#!/usr/bin/env python3
"""Package an allowlisted static site and source repository, never local secrets."""
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_FILES = [
    'index.html', 'README.md', 'DEPLOYMENT.md', 'EVIDENCE.md', 'CHATBOT.md',
    'AI_BOT_INTEGRATION_PLAN.md', 'RESEARCH_DATABASE.md', '.gitignore', 'vercel.json',
    'data/research_catalog.json', 'data/research_findings.csv', 'scripts/research.py', 'tests/test_research.py',
    '.github/workflows/pages.yml', 'prompts/educator-system.md',
    'src/template.html', 'src/styles.css', 'src/app.js', 'src/engine.js',
    'src/chat-engine.js', 'src/chat-app.js',
    'data/library.json', 'data/bot-config.json', 'data/evidence_index.json',
    'data/evidence_library.csv', 'data/proposed_mappings.csv', 'data/wwc_audit.json',
    'scripts/build.py', 'scripts/check.py', 'scripts/package_release.py',
    'scripts/inspect_wwc.py', 'scripts/fetch_wwc.py',
    'tests/test_data.py', 'tests/test_site.py', 'tests/test_packaging.py',
    'tests/engine.test.js', 'tests/chat.test.js', 'tests/browser.test.js'
]


def repository_files(root):
    files = [root / name for name in REPOSITORY_FILES]
    # Only the known public WWC snapshot format is allowed under this directory.
    for name in ['*/manifest.json', '*/wwc-export.zip']:
        files.extend((root / 'data/wwc_snapshots').glob(name))
    for path in files:
        if not path.is_file() or path.is_symlink() or root.resolve() not in path.resolve().parents:
            raise ValueError('Missing or unsafe release file: ' + str(path))
    return sorted(files)


def main():
    subprocess.run([sys.executable, str(ROOT / 'scripts/check.py')], check=True)
    release = ROOT / 'release'
    release.mkdir(exist_ok=True)
    with zipfile.ZipFile(release / 'achievego-static-site.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in ['index.html', '.nojekyll', 'data/evidence_library.csv', 'data/proposed_mappings.csv', 'data/research_findings.csv']:
            archive.write(ROOT / '_site' / name, name)
    with zipfile.ZipFile(release / 'achievego-github-repository.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in repository_files(ROOT):
            archive.write(path, 'achievego-website/' + str(path.relative_to(ROOT)))
    print('Created release/achievego-static-site.zip and release/achievego-github-repository.zip (Vercel/GitHub Pages source)')


if __name__ == '__main__':
    main()
