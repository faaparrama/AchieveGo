import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('packaging', ROOT / 'scripts/package_release.py')
packaging = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packaging)


class PackagingTests(unittest.TestCase):
    def test_local_secrets_cannot_enter_source_package(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in packaging.REPOSITORY_FILES:
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('public fixture')
            for name in ['src/.env', 'scripts/.env.local', 'data/private-key.json', '.dev.vars', '.vercel/project.json', 'supabase/functions/.env']:
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('DUMMY_SECRET_CANARY')
            actual = packaging.repository_files(root)
            self.assertEqual({str(p.relative_to(root)) for p in actual}, set(packaging.REPOSITORY_FILES))
            self.assertFalse(any('DUMMY_SECRET_CANARY' in p.read_text() for p in actual))

    def test_all_expected_source_files_exist(self):
        paths = packaging.repository_files(ROOT)
        self.assertIn(ROOT / 'prompts/educator-system.md', paths)
        self.assertIn(ROOT / 'vercel.json', paths)


if __name__ == '__main__':
    unittest.main()
