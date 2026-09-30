import copy
import importlib.util
import json
from pathlib import Path
import sqlite3
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('research', ROOT / 'scripts/research.py')
research = importlib.util.module_from_spec(spec)
spec.loader.exec_module(research)


class ResearchTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / 'data/research_catalog.json').read_text())
        self.library = json.loads((ROOT / 'data/library.json').read_text())

    def test_duplicate_doi_with_url_or_case_is_rejected(self):
        p = copy.deepcopy(self.catalog['publications'][0])
        p['id'] = 'duplicate'
        p['doi'] = 'https://doi.org/' + p['doi'].upper()
        self.catalog['publications'].append(p)
        with self.assertRaisesRegex(ValueError, 'Duplicate DOI'):
            research.validate(self.catalog, self.library)

    def test_external_paper_cannot_acquire_wwc_rating(self):
        self.catalog['publications'][0]['wwc_rating'] = 'Strong'
        with self.assertRaisesRegex(ValueError, 'WWC ratings'):
            research.validate(self.catalog, self.library)

    def test_unverified_quality_judgement_is_rejected(self):
        self.catalog['publications'][0]['appraisal']['judgement'] = 'High quality'
        with self.assertRaisesRegex(ValueError, 'quality judgement'):
            research.validate(self.catalog, self.library)

    def test_review_does_not_automatically_enable_matching(self):
        self.catalog['findings'][0]['recommendation_status'] = 'approved'
        with self.assertRaisesRegex(ValueError, 'authorize matching'):
            research.validate(self.catalog, self.library)

    def test_invalid_interval_is_rejected(self):
        self.catalog['findings'][0]['effect']['ci_lower'] = 9
        with self.assertRaisesRegex(ValueError, 'interval'):
            research.validate(self.catalog, self.library)

    def test_missing_effect_requires_explanation(self):
        f = next(f for f in self.catalog['findings'] if f['effect']['estimate'] is None)
        f['effect']['missing_reason'] = None
        with self.assertRaisesRegex(ValueError, 'explanation'):
            research.validate(self.catalog, self.library)

    def test_unknown_review_relationship_is_rejected(self):
        self.catalog['relationships'] = [{'from_id': 'missing', 'to_id': 'yeager-2019', 'kind': 'includes'}]
        with self.assertRaisesRegex(ValueError, 'relationship'):
            research.validate(self.catalog, self.library)

    def test_corrupt_snapshot_cannot_replace_database(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'data').mkdir()
            for name in ['library.json', 'research_catalog.json', 'wwc_audit.json']:
                shutil.copy2(ROOT / 'data' / name, root / 'data' / name)
            audit = json.loads((root / 'data/wwc_audit.json').read_text())
            snapshot = root / 'data/wwc_snapshots' / audit['snapshot']
            snapshot.mkdir(parents=True)
            shutil.copy2(ROOT / 'data/wwc_snapshots' / audit['snapshot'] / 'manifest.json', snapshot / 'manifest.json')
            (snapshot / 'wwc-export.zip').write_bytes(b'corrupted input')
            (root / 'data/generated').mkdir()
            target = root / 'data/generated/evidence.sqlite'
            target.write_bytes(b'existing database sentinel')
            with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                research.build_database(root)
            self.assertEqual(target.read_bytes(), b'existing database sentinel')

    def test_database_preserves_raw_counts_and_distinct_identity(self):
        audit = json.loads((ROOT / 'data/wwc_audit.json').read_text())
        with sqlite3.connect(ROOT / 'data/generated/evidence.sqlite') as db:
            for member, count in audit['rows'].items():
                self.assertEqual(db.execute('SELECT COUNT(*) FROM wwc_rows WHERE member=?',(member,)).fetchone()[0], count)
            self.assertEqual(db.execute("SELECT COUNT(DISTINCT study_id) FROM wwc_rows WHERE member='Studies.csv'").fetchone()[0],audit['unique_study_ids'])
            self.assertEqual(db.execute('SELECT COUNT(*) FROM publications').fetchone()[0],len(self.catalog['publications']))
            expected_sources = len(self.library['sources']) + sum(not p['linked_library_source'] for p in self.catalog['publications'])
            self.assertEqual(db.execute('SELECT COUNT(*) FROM sources').fetchone()[0],expected_sources)
            self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(),[])

    def test_unknown_estimates_and_companion_null_findings_survive(self):
        with sqlite3.connect(ROOT / 'data/generated/evidence.sqlite') as db:
            self.assertIsNone(db.execute("SELECT estimate FROM research_findings WHERE id='yeager-lower'").fetchone()[0])
            rows = db.execute("SELECT id FROM research_findings WHERE direction='no_clear_effect'").fetchall()
            self.assertGreaterEqual(len(rows),4)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM mapping_rules').fetchone()[0],len(self.library['mapping_rules']))
            raw = db.execute("SELECT raw_json FROM wwc_rows WHERE member='Studies.csv' LIMIT 1").fetchone()[0]
            self.assertIn('Study_Rating',json.loads(raw))

    def test_catalog_not_silently_in_chat_retrieval(self):
        index = json.loads((ROOT / 'data/evidence_index.json').read_text())
        self.assertEqual({d['id'] for d in index['documents']},{r['id'] for r in self.library['evidence_records']})
        html = (ROOT / 'index.html').read_text()
        self.assertIn('id="research-type"', html)
        self.assertIn('yegencik-2025', html)
        self.assertIn('not yet part of chatbot retrieval', html)


if __name__ == '__main__':
    unittest.main()
