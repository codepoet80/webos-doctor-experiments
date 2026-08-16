#!/usr/bin/env python3
"""
Regenerate manifest.json for a magazine issue language folder.

Usage (from the PivotMagazine-WOSA repo root):
    python3 Tools/gen-manifest.py
    python3 Tools/gen-manifest.py --issue Issues/Current --lang en --num-pages 32

The manifest is written in-place to {issue}/{lang}/manifest.json.
Works on macOS and Linux (uses Python hashlib, not md5sum).
"""
import argparse
import hashlib
import json
import os
import pathlib
import sys
from datetime import datetime

REPO_ROOT = pathlib.Path(__file__).parent.parent.resolve()

TYPE_MAP = {
    '.lo.js': 'layout',
    '.jpg':   'image',
    '.jpeg':  'image',
    '.png':   'image',
    '.gif':   'image',
    '.json':  'binding',
    '.css':   'css',
}

SKIP_NAMES = {'manifest.json', 'gen-manifest.sh', 'gen-manifestjson-server.sh', 'gen-fs.sh'}


def file_type(path: pathlib.Path):
    name = path.name
    if name.endswith('.lo.js'):
        return 'layout'
    for ext, t in TYPE_MAP.items():
        if name.endswith(ext):
            return t
    return None


def md5(path: pathlib.Path) -> str:
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def build_manifest(lang_dir: pathlib.Path, lang: str, num_pages: int,
                   publish_date: str) -> dict:
    results = []
    total_size = 0

    for filepath in sorted(lang_dir.rglob('*')):
        if not filepath.is_file():
            continue
        if filepath.name in SKIP_NAMES:
            continue

        ftype = file_type(filepath)
        if ftype is None:
            continue

        logical = filepath.relative_to(lang_dir).as_posix()
        physical = f'source/magazine/defaultEdition/{lang}/{logical}'
        section = logical.split('/')[0]
        size = filepath.stat().st_size
        checksum = md5(filepath)

        total_size += size
        results.append({
            'logicalPath': logical,
            'checksum':    checksum,
            'section':     section,
            'type':        ftype,
            'edition':     1,
            'physicalPath': physical,
            'size':        size,
        })

    return {
        'publishDate': publish_date,
        'numPages':    num_pages,
        'packageSize': total_size,
        'results':     results,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--issue', default='Issues/Current',
                   help='Path to the issue folder relative to repo root (default: Issues/Current)')
    p.add_argument('--lang', default='en',
                   help='Language code subfolder to process (default: en)')
    p.add_argument('--num-pages', type=int, default=None,
                   help='Override numPages (default: auto-count from page* folders)')
    args = p.parse_args()

    issue_dir = REPO_ROOT / args.issue
    lang_dir  = issue_dir / args.lang
    out_path  = lang_dir / 'manifest.json'

    if not lang_dir.is_dir():
        print(f'Error: {lang_dir} is not a directory', file=sys.stderr)
        sys.exit(1)

    # Auto-count pages if not specified.
    if args.num_pages is None:
        page_dirs = [d for d in lang_dir.iterdir() if d.is_dir() and d.name.startswith('page')]
        num_pages = len(page_dirs)
        if num_pages == 0:
            print('Warning: no page* directories found; defaulting numPages to 0')
    else:
        num_pages = args.num_pages

    # Preserve publishDate from existing manifest; use today otherwise.
    publish_date = datetime.now().strftime('%m/%d/%Y 12:00:00')
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text())
            if existing.get('publishDate'):
                publish_date = existing['publishDate']
        except (json.JSONDecodeError, KeyError):
            pass

    manifest = build_manifest(lang_dir, args.lang, num_pages, publish_date)

    out_path.write_text(json.dumps(manifest, indent=4) + '\n', encoding='utf-8')
    print(f'Wrote {len(manifest["results"])} entries to {out_path.relative_to(REPO_ROOT)}')
    print(f'  numPages={num_pages}  packageSize={manifest["packageSize"]:,} bytes')


if __name__ == '__main__':
    main()
