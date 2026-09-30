import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


class DataTests(unittest.TestCase):
    def setUp(self):
        self.db = json.loads((ROOT / 'data/library.json').read_text())

    def test_catalog(self):
        module('build').validate(self.db)

    def test_invalid_source_rejected(self):
        self.db['evidence_records'][0]['source_id'] = 'fabricated'
        with self.assertRaises(AssertionError):
            module('build').validate(self.db)

    def test_wwc_rating_cannot_be_invented(self):
        self.db['evidence_records'][0]['rating'] = 'Guaranteed effective'
        with self.assertRaises(AssertionError):
            module('build').validate(self.db)

    def test_unmapped_record_rejected(self):
        self.db['mapping_rules'].pop()
        with self.assertRaises(AssertionError):
            module('build').validate(self.db)

    def test_snapshot_and_curated_ratings_agree(self):
        expected = json.loads((ROOT / 'data/wwc_audit.json').read_text())
        actual = module('inspect_wwc').audit(ROOT / 'data/wwc_snapshots' / expected['snapshot'])
        self.assertEqual(actual, expected)
        for record in self.db['evidence_records']:
            if record['source_id'] == 'cc':
                raw = next(r for r in actual['check_connect_raw_report_rows'] if r['Protocol'] == record['protocol'] and r['Outcome_Domain'] == record['outcome'])
                self.assertEqual(record['rating'], raw['Effectiveness_Rating'])
                self.assertEqual(record['num_studies_meeting'], int(raw['NumStudiesMeetingStandards']))


if __name__ == '__main__':
    unittest.main()
