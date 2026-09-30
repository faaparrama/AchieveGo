#!/usr/bin/env python3
"""Validate the curated library and build a portable, offline HTML demonstration."""
import csv
import importlib.util
import hashlib
import json
import re
from pathlib import Path
import shutil
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]


def build_index(db):
    documents = []
    for r in db['evidence_records']:
        rule = next(m for m in db['mapping_rules'] if m['evidence_id'] == r['id'])
        text = ' '.join(str(r[k]) for k in ['title', 'outcome', 'population', 'implementation', 'monitor', 'limitations'])
        text += ' ' + ' '.join(db['needs'][n] for n in rule['needs_any'])
        topics = []
        if r['subject'] == 'math':
            topics.append('math')
        if r['subject'] == 'literacy':
            topics.append('literacy')
        if 'offtrack' in rule['needs_any']:
            topics.append('offtrack')
        if r['lane'] == 'opportunity':
            topics.append('advanced')
        documents.append({'id': r['id'], 'source_id': r['source_id'], 'topics': topics,
                          'terms': sorted(set(re.findall(r'[a-z0-9]+', text.lower())))})
    sha = hashlib.sha256(json.dumps(db, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    return {'library_version': db['version'], 'sha256': sha, 'method': 'metadata and keyword index', 'documents': documents}


def validate(db):
    records = db['evidence_records']
    ids = [r['id'] for r in records]
    assert len(ids) == len(set(ids)), 'Duplicate evidence record'
    mapping_ids = [m['evidence_id'] for m in db['mapping_rules']]
    assert sorted(mapping_ids) == sorted(ids), 'Exactly one explicit mapping per evidence record required'
    for source in db['sources'].values():
        assert urlparse(source['url']).scheme == 'https', 'Invalid source URL'
        assert source['checked'] and source['year'] and source['curation_status']
    for r in records:
        assert r['source_id'] in db['sources'], 'Unknown source'
        assert 1 <= r['grade_min'] <= r['grade_max'] <= 12, 'Invalid grade scope'
        assert r['subject'] in ['any', 'math', 'literacy']
        assert r['limitations'] and r['exact_profile_diagnosis_effect']
        if db['sources'][r['source_id']]['kind'] == 'WWC practice guide':
            assert r['rating'] in ['Strong', 'Moderate', 'Minimal']
            assert r['rating_framework'] == 'WWC practice-guide recommendation evidence'
        if db['sources'][r['source_id']]['kind'] == 'WWC intervention report':
            assert r['rating'] in ['Positive Effects', 'Potentially Positive Effects', 'Mixed Effects',
                                    'No Discernible Effects', 'Potentially Negative Effects', 'Negative Effects']
            assert r['protocol'] and r['protocol_version'] and r['wwc_intervention_id']
    for m in db['mapping_rules']:
        assert m['status'] == 'Proposed; not validated'
        assert m['needs_any'] and set(m['needs_any']).issubset(db['needs'])
    for p in db['presets']:
        assert p['profile'] in db['profiles'] and set(p['labels']).issubset(db['labels'])
        assert set(p['needs']).issubset(db['needs'])
        assert 6 <= p['grade'] <= 12


def csv_export(rows, target):
    fields = list(dict.fromkeys(k for r in rows for k in r))
    with target.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v for k, v in r.items()})


def main():
    db = json.loads((ROOT / 'data/library.json').read_text())
    validate(db)
    spec = importlib.util.spec_from_file_location('research', ROOT / 'scripts/research.py')
    research = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(research)
    catalog = json.loads((ROOT / 'data/research_catalog.json').read_text())
    research.validate(catalog, db)
    research.build_database(ROOT)
    research_rows = []
    for finding in catalog['findings']:
        publication = next(p for p in catalog['publications'] if p['id'] == finding['publication_id'])
        research_rows.append({'publication_id': publication['id'], 'title': publication['title'],
                              'doi': publication['doi'], 'source_url': publication['source_url'],
                              'intervention': publication['intervention'], 'comparison': publication['comparison'],
                              'publication_type': publication['publication_type'], 'synthesis_method': publication['synthesis_method'],
                              'review_status': publication['review_status'], 'appraisal': publication['appraisal'],
                              'access_basis': publication['access_basis'], 'checked': publication['checked'],
                              'limitations': publication['limitations'], **finding})
    csv_export(research_rows, ROOT / 'data/research_findings.csv')
    index = build_index(db)
    (ROOT / 'data/evidence_index.json').write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n')
    config = json.loads((ROOT / 'data/bot-config.json').read_text())
    assert set(config) == {'schema_version', 'mode', 'prompt_version', 'max_message_characters', 'max_turns', 'provider_connected'}
    assert config['mode'] == 'local-evidence-demo' and config['provider_connected'] is False
    prompt = (ROOT / 'prompts/educator-system.md').read_text()
    assert 'system prompt v' + config['prompt_version'] in prompt
    safe_json = lambda value: json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')
    html = (ROOT / 'src/template.html').read_text()
    replacements = {
        '/* STYLES */': (ROOT / 'src/styles.css').read_text(),
        '/* DATA */': safe_json({**db, 'research_catalog': catalog}),
        '/* ENGINE */': (ROOT / 'src/engine.js').read_text(),
        '/* APP */': (ROOT / 'src/app.js').read_text(),
        '/* INDEX */': safe_json(index),
        '/* BOT_CONFIG */': safe_json(config),
        '/* CHAT_ENGINE */': (ROOT / 'src/chat-engine.js').read_text(),
        '/* CHAT_APP */': (ROOT / 'src/chat-app.js').read_text(),
    }
    for key, value in replacements.items():
        assert html.count(key) == 1, 'Missing or duplicate build marker'
        html = html.replace(key, value)
    (ROOT / 'index.html').write_text(html)
    csv_export([{**r, 'source_url': db['sources'][r['source_id']]['url'],
                 'source_year': db['sources'][r['source_id']]['year'],
                 'source_checked': db['sources'][r['source_id']]['checked']} for r in db['evidence_records']], ROOT / 'data/evidence_library.csv')
    csv_export(db['mapping_rules'], ROOT / 'data/proposed_mappings.csv')
    # Publish an explicit allowlist, never the research or source directory.
    site = ROOT / '_site'
    if site.is_symlink():
        raise ValueError('_site must not be a symbolic link')
    if site.exists():
        shutil.rmtree(site)
    (site / 'data').mkdir(parents=True)
    (site / 'index.html').write_text(html)
    (site / '.nojekyll').write_text('')
    for name in ['evidence_library.csv', 'proposed_mappings.csv', 'research_findings.csv']:
        shutil.copyfile(ROOT / 'data' / name, site / 'data' / name)
    print(f'Built index.html, review CSVs, and _site/: {len(db["evidence_records"])} records; {len(db["sources"])} sources')


if __name__ == '__main__':
    main()
