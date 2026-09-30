#!/usr/bin/env python3
"""Download the public WWC export using the request made by its export page.

This is an observed website interface, not a documented or guaranteed public API.
Downloads are retained as immutable snapshots; nothing is published to the app.
"""
import argparse
import datetime as dt
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://ies.ed.gov/ncee/wwc/StudyFindings'
ENDPOINT = 'https://ies.ed.gov/ncee/WWC/StudyFindings/AllDataExport'
MAX_BYTES = 50 * 1024 * 1024


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--merged', action='store_true', help='Default: separate study, finding and report files, including non-meeting studies.')
    args = parser.parse_args()
    payload = {k: '' for k in ['FWWFilterId', 'RatingId', 'ProtocolId', 'InterventionId', 'EssaRatingId', 'StandardsVersionId', 'OutcomedomainId']}
    payload['IndividualFilesDownload'] = 'false' if args.merged else 'true'
    request = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers={
        'Content-Type': 'application/json', 'Accept': 'application/zip',
        'Referer': PAGE, 'User-Agent': 'AchieveGoResearchPrototype/0.1 (public evidence export)'
    })
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read(MAX_BYTES + 1)
        content_type = response.headers.get('Content-Type')
    if len(body) > MAX_BYTES:
        raise ValueError('Export exceeds 50 MB; inspect the source before retrying.')
    if not zipfile.is_zipfile(io.BytesIO(body)):
        raise ValueError(f'WWC returned {content_type}, not a ZIP. Use the official export page; no catalog was changed.')
    sha = hashlib.sha256(body).hexdigest()
    now = dt.datetime.now(dt.timezone.utc)
    dest = ROOT / 'data' / 'wwc_snapshots' / (now.strftime('%Y%m%dT%H%M%SZ') + '-' + sha[:10])
    dest.mkdir(parents=True, exist_ok=False)
    (dest / 'wwc-export.zip').write_bytes(body)
    with zipfile.ZipFile(io.BytesIO(body)) as z:
        members = [{'name': x.filename, 'bytes': x.file_size} for x in z.infolist()]
    manifest = {'retrieved_at': now.isoformat(), 'source_page': PAGE, 'endpoint': ENDPOINT,
                'interface_status': 'observed website export; not a documented public API',
                'request': payload, 'sha256': sha, 'bytes': len(body), 'members': members}
    (dest / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'snapshot': str(dest.relative_to(ROOT)), **manifest}, indent=2))


if __name__ == '__main__':
    main()
