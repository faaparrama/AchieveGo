#!/usr/bin/env python3
"""Audit an immutable WWC snapshot. Preserve raw rows; do not publish matches."""
import argparse
import collections
import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    'InterventionReports.csv': {'InterventionID', 'Protocol', 'Protocol_Version', 'Outcome_Domain', 'Effectiveness_Rating'},
    'Studies.csv': {'ReviewID', 'StudyID', 'Study_Rating', 'ProductID'},
    'Findings.csv': {'FindingID', 'ReviewID', 'Outcome_Domain', 'Effect_Size_WWC', 'ESSA_Rating'},
}


def audit(snapshot):
    manifest = json.loads((snapshot / 'manifest.json').read_text())
    archive = snapshot / 'wwc-export.zip'
    if hashlib.sha256(archive.read_bytes()).hexdigest() != manifest['sha256']:
        raise ValueError('Snapshot checksum mismatch')
    tables = {}
    with zipfile.ZipFile(archive) as z:
        for name, required in REQUIRED.items():
            reader = csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig'))
            if not required.issubset(reader.fieldnames or []):
                raise ValueError(f'{name}: source schema changed; review before import')
            tables[name] = list(reader)
    studies = tables['Studies.csv']
    reviews = collections.Counter(r['ReviewID'] for r in studies)
    findings = tables['Findings.csv']
    reports = tables['InterventionReports.csv']
    selected = [r for r in reports if r['InterventionID'] == '312']
    return {
        'snapshot': snapshot.name, 'retrieved_at': manifest['retrieved_at'], 'sha256': manifest['sha256'],
        'source_page': manifest['source_page'], 'rows': {k: len(v) for k, v in tables.items()},
        'unique_study_ids': len({r['StudyID'] for r in studies}),
        'unique_review_ids': len(reviews),
        'unique_intervention_ids_in_reports': len({r['InterventionID'] for r in reports}),
        'unique_finding_ids': len({r['FindingID'] for r in findings}),
        'review_ids_with_multiple_rows': sum(n > 1 for n in reviews.values()),
        'findings_with_no_review_row': sum(r['ReviewID'] not in reviews for r in findings),
        'study_row_ratings': dict(collections.Counter(r['Study_Rating'] for r in studies)),
        'check_connect_raw_report_rows': selected,
        'curation_notes': [
            'Counts of rows are not counts of independent studies or intervention programs.',
            'ReviewID can repeat across products. Separate review-product relationships before joining findings; reject conflicting review attributes.',
            'Keep distinct protocols and outcome domains; blank values mean unknown, not zero or no disability.',
            'Check & Connect progressing outcome: export flags grades 9–12; evidence snapshot specifies grade 9. Curated card conservatively uses grade 9 and retains this discrepancy.',
            'Snapshot inspection is not evidence appraisal or approval for learner matching.'
        ]
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', nargs='?', type=Path)
    args = parser.parse_args()
    snapshot = args.snapshot or sorted((ROOT / 'data/wwc_snapshots').iterdir())[-1]
    result = audit(snapshot)
    target = ROOT / 'data/wwc_audit.json'
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'check_connect_raw_report_rows'}, indent=2))


if __name__ == '__main__':
    main()
