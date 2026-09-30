#!/usr/bin/env python3
"""Validate research extractions and rebuild a local SQLite database alongside WWC."""
import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import tempfile
from urllib.parse import urlparse
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TYPES = {'systematic_review', 'meta_analysis', 'randomized_controlled_trial'}
METHODS = {'none', 'narrative_synthesis', 'pairwise_meta_analysis', 'network_meta_analysis', 'second_order_meta_analysis'}
WWC_MEMBERS = {
    'Studies.csv': {'StudyID', 'ReviewID', 'ProductID', 'Study_Design', 'Study_Rating'},
    'Findings.csv': {'FindingID', 'ReviewID', 'Outcome_Domain', 'Effect_Size_WWC'},
    'InterventionReports.csv': {'InterventionID', 'Protocol', 'Outcome_Domain', 'Effectiveness_Rating'},
    'ReviewDictionary.csv': {'Level', 'Description'},
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def normalize_doi(value):
    return re.sub(r'^https?://(?:dx\.)?doi\.org/', '', value.strip(), flags=re.I).lower()


def validate(catalog, library):
    require(catalog['schema_version'] == 1, 'Unsupported research catalog schema')
    pubs = catalog['publications']
    ids = [p['id'] for p in pubs]
    require(len(ids) == len(set(ids)), 'Duplicate publication ID')
    dois = [normalize_doi(p['doi']) for p in pubs]
    require(len(dois) == len(set(dois)), 'Duplicate DOI: merge reports instead of counting twice')
    for p in pubs:
        require(re.fullmatch(r'[a-z0-9-]+', p['id']) is not None, 'Invalid publication ID')
        require(re.fullmatch(r'10\.\d{4,9}/\S+', normalize_doi(p['doi'])) is not None, 'Invalid DOI')
        require(p['publication_type'] in TYPES and p['synthesis_method'] in METHODS, 'Unknown evidence design or synthesis method')
        require(p['publication_type'] != 'randomized_controlled_trial' or p['synthesis_method'] == 'none', 'A primary RCT is not a meta-analysis')
        require(p['publication_type'] != 'meta_analysis' or p['synthesis_method'].endswith('meta_analysis'), 'Meta-analysis needs a synthesis method')
        require(urlparse(p['source_url']).scheme == 'https', 'Source must use HTTPS')
        require(p['wwc_rating'] is None, 'External papers cannot inherit WWC ratings')
        require(p['review_status'] in {'extraction_pending', 'independently_reviewed'}, 'Invalid review state')
        require(p['overlap_status'] in {'not_assessed', 'partially_assessed', 'assessed'}, 'Invalid overlap status')
        require(p['access_basis'] in {'publisher_abstract', 'full_text_sections', 'full_text'}, 'Specify source access basis')
        for field in ['title', 'citation', 'population', 'intervention', 'comparison', 'limitations', 'locator', 'checked', 'tags']:
            require(bool(p[field]), 'Missing publication field: ' + field)
        a = p['appraisal']
        require(a['status'] in {'not_appraised', 'completed'}, 'Invalid appraisal state')
        if a['status'] == 'not_appraised':
            require(a['judgement'] is None and a['reviewer'] is None, 'Unappraised records cannot carry a quality judgement')
        else:
            require(all(a.get(k) for k in ['tool', 'judgement', 'reviewer']), 'Completed appraisal needs tool, judgement and reviewer')
        if p['review_status'] == 'independently_reviewed':
            require(bool(p.get('extraction_reviewer')), 'Independent review needs a named reviewer')
        link = p['linked_library_source']
        if link:
            require(link in library['sources'], 'Unknown existing library source')
            require(normalize_doi(library['sources'][link]['url']) == normalize_doi(p['doi']), 'Linked library DOI differs')
    finding_ids = [f['id'] for f in catalog['findings']]
    require(len(finding_ids) == len(set(finding_ids)), 'Duplicate finding ID')
    for f in catalog['findings']:
        require(f['publication_id'] in ids, 'Finding references unknown publication')
        require(f['direction'] in {'positive', 'negative', 'mixed', 'no_clear_effect', 'uncertain'}, 'Unknown finding direction')
        require(f['recommendation_status'] == 'context_only', 'Research intake must not automatically authorize matching')
        for key in ['outcome', 'population', 'timepoint', 'summary', 'locator']:
            require(bool(f[key]), 'Missing finding field: ' + key)
        e = f['effect']
        for key in ['estimate', 'ci_lower', 'ci_upper', 'ci_level']:
            require(e[key] is None or (type(e[key]) in (float, int) and math.isfinite(e[key])), 'Non-finite or nonnumeric effect')
        lo, hi = e['ci_lower'], e['ci_upper']
        require((lo is None) == (hi is None), 'Both CI bounds are required')
        if e['estimate'] is not None:
            require(bool(e['metric']), 'Effect size needs a metric')
        if lo is not None:
            require(e['estimate'] is not None and lo <= e['estimate'] <= hi, 'Invalid effect interval')
            require(e['ci_level'] is not None and 0 < e['ci_level'] < 1, 'Invalid CI level')
        else:
            require(e['ci_level'] is None and bool(e['missing_reason']), 'Missing statistics need an explanation')
    by_id = {p['id']: p for p in pubs}
    for rel in catalog['relationships']:
        require(rel['from_id'] in ids and rel['to_id'] in ids and rel['from_id'] != rel['to_id'], 'Invalid publication relationship')
        require(rel['kind'] in {'includes', 'same_study', 'updates'}, 'Invalid relationship kind')
        require(rel['locator'] and rel['verified_by'], 'Relationship must have verification provenance')
        if rel['kind'] == 'includes':
            require(by_id[rel['from_id']]['publication_type'] != 'randomized_controlled_trial', 'A trial cannot include a synthesis')
    for link in catalog['wwc_links']:
        require(link['publication_id'] in ids and link['study_id'] and link['locator'] and link['verified_by'], 'Incomplete WWC identity link')


def build_database(root=ROOT):
    catalog = json.loads((root / 'data/research_catalog.json').read_text())
    library = json.loads((root / 'data/library.json').read_text())
    validate(catalog, library)
    audit = json.loads((root / 'data/wwc_audit.json').read_text())
    name = audit['snapshot']
    require(Path(name).name == name, 'Invalid snapshot directory')
    snapshot = root / 'data/wwc_snapshots' / name
    manifest = json.loads((snapshot / 'manifest.json').read_text())
    archive = snapshot / 'wwc-export.zip'
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    require(digest == manifest['sha256'] == audit['sha256'], 'WWC snapshot checksum mismatch')
    output = root / 'data/generated'
    output.mkdir(exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='research-', suffix='.sqlite', dir=output)
    os.close(fd)
    counts = {}
    try:
        with sqlite3.connect(tmp) as conn:
            conn.execute('PRAGMA foreign_keys=ON')
            conn.executescript('''
                CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE sources (id TEXT PRIMARY KEY, title TEXT NOT NULL, source_kind TEXT NOT NULL, source_json TEXT NOT NULL);
                CREATE TABLE publications (id TEXT PRIMARY KEY, doi TEXT UNIQUE NOT NULL, publication_type TEXT NOT NULL, synthesis_method TEXT NOT NULL, review_status TEXT NOT NULL, source_id TEXT REFERENCES sources(id), record_json TEXT NOT NULL);
                CREATE TABLE research_findings (id TEXT PRIMARY KEY, publication_id TEXT NOT NULL REFERENCES publications(id), outcome TEXT NOT NULL, direction TEXT NOT NULL, estimate REAL, ci_lower REAL, ci_upper REAL, record_json TEXT NOT NULL);
                CREATE TABLE evidence_records (id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id), record_json TEXT NOT NULL);
                CREATE TABLE mapping_rules (evidence_id TEXT PRIMARY KEY REFERENCES evidence_records(id), record_json TEXT NOT NULL);
                CREATE TABLE publication_relationships (from_id TEXT REFERENCES publications(id), to_id TEXT REFERENCES publications(id), kind TEXT NOT NULL, record_json TEXT NOT NULL, PRIMARY KEY(from_id,to_id,kind));
                CREATE TABLE wwc_rows (snapshot TEXT NOT NULL, member TEXT NOT NULL, row_number INTEGER NOT NULL, study_id TEXT, review_id TEXT, finding_id TEXT, intervention_id TEXT, raw_json TEXT NOT NULL, PRIMARY KEY(snapshot,member,row_number));
                CREATE INDEX wwc_study ON wwc_rows(study_id);
                CREATE INDEX wwc_review ON wwc_rows(review_id);
                CREATE INDEX wwc_intervention ON wwc_rows(intervention_id);
                CREATE TABLE publication_wwc_links (publication_id TEXT REFERENCES publications(id), study_id TEXT NOT NULL, record_json TEXT NOT NULL, PRIMARY KEY(publication_id,study_id));
                CREATE VIEW wwc_study_review_ids AS SELECT DISTINCT snapshot, study_id, review_id FROM wwc_rows WHERE member='Studies.csv';
            ''')
            dumps = lambda value: json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False)
            for sid, s in library['sources'].items():
                conn.execute('INSERT INTO sources VALUES (?,?,?,?)', (sid,s['title'],s['kind'],dumps(s)))
            for p in catalog['publications']:
                sid = p['linked_library_source'] or 'research:' + p['id']
                if not p['linked_library_source']:
                    conn.execute('INSERT INTO sources VALUES (?,?,?,?)', (sid,p['title'],p['publication_type'],dumps(p)))
                conn.execute('INSERT INTO publications VALUES (?,?,?,?,?,?,?)', (p['id'],normalize_doi(p['doi']),p['publication_type'],p['synthesis_method'],p['review_status'],sid,dumps(p)))
            for f in catalog['findings']:
                e = f['effect']
                conn.execute('INSERT INTO research_findings VALUES (?,?,?,?,?,?,?,?)', (f['id'],f['publication_id'],f['outcome'],f['direction'],e['estimate'],e['ci_lower'],e['ci_upper'],dumps(f)))
            for r in library['evidence_records']:
                conn.execute('INSERT INTO evidence_records VALUES (?,?,?)', (r['id'],r['source_id'],dumps(r)))
            for r in library['mapping_rules']:
                conn.execute('INSERT INTO mapping_rules VALUES (?,?)', (r['evidence_id'],dumps(r)))
            for r in catalog['relationships']:
                conn.execute('INSERT INTO publication_relationships VALUES (?,?,?,?)', (r['from_id'],r['to_id'],r['kind'],dumps(r)))
            with zipfile.ZipFile(archive) as z:
                for member, fields in WWC_MEMBERS.items():
                    with z.open(member) as raw:
                        reader = csv.DictReader(io.TextIOWrapper(raw,encoding='utf-8-sig'))
                        require(fields.issubset(reader.fieldnames or []), 'WWC schema changed: ' + member)
                        count = 0
                        for count, row in enumerate(reader,1):
                            require(None not in row and all(v is not None for v in row.values()), 'Malformed WWC row')
                            conn.execute('INSERT INTO wwc_rows VALUES (?,?,?,?,?,?,?,?)', (name,member,count,row.get('StudyID') or None,row.get('ReviewID') or None,row.get('FindingID') or None,row.get('InterventionID') or None,dumps(row)))
                        counts[member] = count
                        if member in audit['rows']:
                            require(count == audit['rows'][member], 'WWC audit count mismatch: ' + member)
            for r in catalog['wwc_links']:
                require(conn.execute("SELECT 1 FROM wwc_rows WHERE member='Studies.csv' AND study_id=?",(r['study_id'],)).fetchone(), 'Unknown WWC StudyID')
                conn.execute('INSERT INTO publication_wwc_links VALUES (?,?,?)', (r['publication_id'],r['study_id'],dumps(r)))
            info = {'schema_version':1,'catalog_updated':catalog['updated'],'wwc_snapshot':name,'wwc_sha256':digest,'catalog_sha256':hashlib.sha256((root/'data/research_catalog.json').read_bytes()).hexdigest(),'library_sha256':hashlib.sha256((root/'data/library.json').read_bytes()).hexdigest(),'wwc_rows':counts,'publications':len(catalog['publications']),'research_findings':len(catalog['findings']),'curated_records':len(library['evidence_records']),'distinct_sources':conn.execute('SELECT COUNT(*) FROM sources').fetchone()[0]}
            conn.executemany('INSERT INTO metadata VALUES (?,?)', [(k,dumps(v)) for k,v in info.items()])
            require(not conn.execute('PRAGMA foreign_key_check').fetchall(), 'Broken database reference')
        os.replace(tmp,output/'evidence.sqlite')
        (output/'database_manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    finally:
        if Path(tmp).exists():
            Path(tmp).unlink()
    return info


if __name__ == '__main__':
    argparse.ArgumentParser(description=__doc__).parse_args()
    print(json.dumps(build_database(),indent=2))
