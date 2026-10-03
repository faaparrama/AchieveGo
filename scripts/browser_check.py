#!/usr/bin/env python3
"""Optional real-browser checks; Playwright is a development-only dependency."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import tempfile
import threading

ROOT = Path(__file__).resolve().parents[1]


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit('Install the development dependency: python3 -m pip install playwright; then python3 -m playwright install chromium')
    with tempfile.TemporaryDirectory(prefix='achievego-browser-') as directory:
        base = Path(directory)
        site = base / 'AchieveGo'
        shutil.copytree(ROOT / '_site', site)
        html = (site / 'index.html').read_text()
        checks = ''.join('<script>' + (ROOT / 'tests' / name).read_text() + '</script>' for name in ['browser.test.js', 'workflow.test.js'])
        (site / 'checks.html').write_text(html.replace('</body>', checks + '</body>'))
        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(base)))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f'http://127.0.0.1:{server.server_port}/AchieveGo/'
        try:
            with sync_playwright() as p:
                chrome = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                options = {'executable_path': str(chrome)} if chrome.exists() else {}
                browser = p.chromium.launch(headless=True, **options)
                for width in [390, 768, 1440]:
                    context = browser.new_context(viewport={'width': width, 'height': 1000})
                    page = context.new_page()
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.goto(url + 'checks.html')
                    page.wait_for_function("document.querySelector('#workflow-test-result') && /^(PASS|FAIL)/.test(document.querySelector('#workflow-test-result').textContent)")
                    for name in ['browser-test-result', 'workflow-test-result']:
                        result = page.locator('#' + name).inner_text()
                        if not result.startswith('PASS'):
                            raise AssertionError(f'{width}px: {result}')
                        print(f'{width}px: {result}', flush=True)
                    if errors:
                        raise AssertionError(errors)
                    page.goto(url + '#workspace/review')
                    assert page.evaluate('AGFlow.state().cases[0].plans.length') == 2
                    page.reload()
                    assert page.evaluate('AGFlow.state().cases[0].plans.length') == 2
                    assert not page.locator('[data-stage="review"]').is_hidden()
                    page.locator('#library-tab').click()
                    page.go_back()
                    assert not page.locator('#workspace-view').is_hidden()
                    exported = page.evaluate('JSON.stringify(AGFlow.state())')
                    page.locator('#import-file').set_input_files({'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': b'{bad json'})
                    page.wait_for_function("document.querySelector('#workflow-status').textContent.includes('Import rejected')")
                    assert page.evaluate('AGFlow.state().cases[0].plans.length') == 2
                    page.locator('#import-file').set_input_files({'name': 'demo.json', 'mimeType': 'application/json', 'buffer': exported.encode()})
                    page.locator('#import-confirm').wait_for(state='visible')
                    page.locator('#import-cancel').click()
                    assert page.evaluate('AGFlow.state().cases[0].plans.length') == 2
                    page.locator('#import-file').set_input_files({'name': 'demo.json', 'mimeType': 'application/json', 'buffer': exported.encode()})
                    page.locator('#import-confirm').wait_for(state='visible')
                    page.locator('#import-confirm').click()
                    assert page.evaluate('AGFlow.state().cases[0].plans.length') == 2
                    print(f'{width}px: project-path, reload, history, and import checks passed', flush=True)
                    context.close()
                browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    main()
