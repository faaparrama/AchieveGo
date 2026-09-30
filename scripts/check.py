#!/usr/bin/env python3
"""Run source-integrity and matching-boundary tests; requires Node or macOS JSC."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / 'scripts/build.py')], check=True)
subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', str(ROOT / 'tests'), '-v'], check=True)
jsc = Path('/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc')
runtime = shutil.which('node') or (str(jsc) if jsc.exists() else None)
if not runtime:
    sys.exit('Data checks passed. Install/use Node to run the JavaScript boundary tests; they were not run.')
script = 'if (typeof print === "undefined") { var print = console.log; }\n'
script += 'var db = ' + (ROOT / 'data/library.json').read_text() + ';\n'
script += (ROOT / 'src/engine.js').read_text() + '\n' + (ROOT / 'tests/engine.test.js').read_text()
script += '\nvar chatIndex = ' + (ROOT / 'data/evidence_index.json').read_text() + ';\n'
script += 'var chatConfig = ' + (ROOT / 'data/bot-config.json').read_text() + ';\n'
script += (ROOT / 'src/chat-engine.js').read_text() + '\n' + (ROOT / 'tests/chat.test.js').read_text()
for name in ['app.js', 'chat-app.js']:
    script += '\nnew Function(' + json.dumps((ROOT / 'src' / name).read_text()) + ');'
script += '\nprint("App and chat JavaScript syntax passed");'
with tempfile.TemporaryDirectory(prefix='achievego-check-') as directory:
    path = Path(directory) / 'checks.js'
    path.write_text(script)
    subprocess.run([runtime, str(path)], check=True)
