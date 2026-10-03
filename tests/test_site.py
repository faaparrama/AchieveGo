from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = {'index.html', '.nojekyll', 'assets/figure1_tm_cycle.png', 'assets/figure2_evidence_to_design.png', 'assets/figure3_achievego_mechanics.png', 'data/evidence_library.csv', 'data/proposed_mappings.csv', 'data/research_findings.csv'}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attributes):
        self.urls.extend(value for key, value in attributes if key in ['href', 'src'] and value)


class SiteTests(unittest.TestCase):
    def test_only_allowed_files_are_published(self):
        site = ROOT / '_site'
        actual = {str(p.relative_to(site)) for p in site.rglob('*') if p.is_file()}
        self.assertEqual(actual, PUBLIC_FILES)
        self.assertEqual((site / 'index.html').read_bytes(), (ROOT / 'index.html').read_bytes())
        self.assertEqual((site / 'assets/figure1_tm_cycle.png').read_bytes(), (ROOT / 'assets/figure1_tm_cycle.png').read_bytes())

    def test_project_pages_relative_paths(self):
        parser = Links()
        parser.feed((ROOT / '_site/index.html').read_text())
        for url in parser.urls:
            if url.startswith(('https://', '#')):
                continue
            self.assertFalse(url.startswith(('/', 'file:', 'http:')), url)
            published = urlparse(urljoin('https://example.github.io/achievego/', url)).path
            self.assertTrue(published.startswith('/achievego/'), url)
            self.assertTrue((ROOT / '_site' / url).is_file(), url)

    def test_build_contains_no_unresolved_markers_or_local_paths(self):
        html = (ROOT / '_site/index.html').read_text()
        for marker in ['/* STATE */', '/* WORKFLOW */', '/* DATA */', '/* ENGINE */', '/* APP */', '/* STYLES */', '/* INDEX */', '/* CHAT_APP */', '/* CHAT_ENGINE */', '/* BOT_CONFIG */', '/Users/', 'file:///']:
            self.assertNotIn(marker, html)

    def test_vercel_publishes_only_staged_website(self):
        import json
        config = json.loads((ROOT / 'vercel.json').read_text())
        self.assertEqual(config['outputDirectory'], '_site')
        self.assertIsNone(config['framework'])
        self.assertEqual(config['buildCommand'], 'python3 scripts/check.py')

    def test_chat_index_covers_catalog_and_has_current_hash(self):
        import json
        import importlib.util
        spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
        build = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(build)
        db = json.loads((ROOT / 'data/library.json').read_text())
        actual = json.loads((ROOT / 'data/evidence_index.json').read_text())
        self.assertEqual(actual, build.build_index(db))
        self.assertEqual({d['id'] for d in actual['documents']}, {r['id'] for r in db['evidence_records']})


if __name__ == '__main__':
    unittest.main()
