#!/usr/bin/env python3
"""Read-only, pin-bound park-judgment checker; patch replay is confined to tempfile.

Usage: python3 -B <this-file> --shard 3
Evidence text is UTF-8, split into physical lines, joined with LF without a final
LF. fileSha256 hashes the original blob bytes; unitSha256 hashes that span text.
This verifies bindings and prepared patches, not the semantic judgments.
"""
import argparse
from collections import Counter
import difflib
from functools import lru_cache
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[6]
HERE = Path(__file__).resolve().parent
REL = HERE.relative_to(ROOT).as_posix()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(value):
    require(isinstance(value, str) and value and '\\' not in value, 'invalid path')
    path = PurePosixPath(value)
    require(not path.is_absolute() and all(p not in ('', '.', '..') for p in value.split('/')), 'unsafe path')
    return value


@lru_cache(maxsize=None)
def blob(pin, file):
    safe_path(file)
    proc = subprocess.run(['git', 'show', f'{pin}:{file}'], cwd=ROOT, capture_output=True)
    require(proc.returncode == 0, f'missing blob at {pin}: {file}')
    return proc.stdout


def check_span(pin, span):
    data = blob(pin, span['file'])
    require(digest(data) == span['fileSha256'], f'file digest: {span["file"]}')
    lines = data.decode('utf-8').splitlines()
    start, end = span['startLine'], span['endLine']
    require(type(start) is int and type(end) is int and 1 <= start <= end <= len(lines), 'line bounds')
    text = '\n'.join(lines[start - 1:end])
    require(text == span['text'] and bool(text.strip()), f'evidence text: {span["file"]}:{start}')
    require(digest(text.encode()) == span['unitSha256'], 'unit digest')
    return text


def check_patch(pin, patch, row_ids):
    file = safe_path(patch['file'])
    require(patch['status'] == 'prepared-not-applied', 'patch must be unapplied')
    require(set(patch['rowIds']) <= row_ids and len(set(patch['rowIds'])) == len(patch['rowIds']), 'patch ids')
    before = blob(pin, file)
    require(digest(before) == patch['sourceSha256'], 'patch source digest')
    lines = before.decode().splitlines(keepends=True)
    for replacement in patch['replacements']:
        number = replacement['line']
        require(type(number) is int and 1 <= number <= len(lines), 'replacement bounds')
        old, new = replacement['before'], replacement['after']
        require(old and old != new and lines[number - 1].count(old) == 1, 'replacement must match once')
        lines[number - 1] = lines[number - 1].replace(old, new)
    after = ''.join(lines).encode()
    require(digest(after) == patch['proposedSha256'] and after != before, 'patch proposed digest')
    expected = ''.join(difflib.unified_diff(before.decode().splitlines(keepends=True),
                                           after.decode().splitlines(keepends=True),
                                           fromfile='a/' + file, tofile='b/' + file))
    require(expected == patch['patch'], 'unified patch differs from replacements')
    scratch_root = Path('/tmp/fgos-work')
    scratch_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='park-judgments-', dir=scratch_root) as temporary:
        target = Path(temporary) / file
        target.parent.mkdir(parents=True)
        target.write_bytes(before)
        for reverse, expected_bytes in ((False, after), (True, before)):
            command = ['patch', '--batch', '--fuzz=0', '-p1', '-R' if reverse else '--forward']
            run = subprocess.run(command, input=patch['patch'].encode(), cwd=temporary, capture_output=True)
            require(run.returncode == 0, f'patch replay failed: {run.stdout!r} {run.stderr!r}')
            require(b'offset' not in run.stdout.lower(), 'patch replay used an offset')
            require(target.read_bytes() == expected_bytes, 'patch replay bytes')
        require(not list(Path(temporary).rglob('*.rej')), 'patch rejects')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--shard', type=int, required=True)
    args = parser.parse_args()
    require(args.shard > 0, 'invalid shard')
    data = json.loads((HERE / f'shard-{args.shard}.json').read_text())
    pin = data['pin']
    require(re.fullmatch(r'[0-9a-f]{40}', pin) is not None, 'pin must be full commit id')
    ids_blob = blob(pin, f'{REL}/shard-{args.shard}-ids.json')
    expected_ids = json.loads(ids_blob)['rowIds']
    require(digest(ids_blob) == data['idsSha256'], 'ids digest')
    require((HERE / f'shard-{args.shard}-ids.json').read_bytes() == ids_blob, 'ids drift')
    require(data['shard'] == args.shard, 'shard mismatch')
    rows = data['rows']
    actual_ids = [r['rowId'] for r in rows]
    require(len(actual_ids) == len(set(actual_ids)) and set(actual_ids) == set(expected_ids), 'exact coverage')
    proof_file = f'{REL.rsplit("/", 1)[0]}/proof.json'
    proof_bytes = blob(pin, proof_file)
    require(digest(proof_bytes) == data['proofSha256'], 'proof digest')
    proof = {r['rowId']: r for r in json.loads(proof_bytes)['rows']}
    patches = {}
    counts = Counter()
    for row in rows:
        rid = row['rowId']
        require(row['pin'] == pin and row['kind'] == proof[rid]['result'], f'{rid}: pin/kind')
        require(row['source']['file'] == proof[rid]['file'], f'{rid}: source identity')
        require(row['reason'].strip() and row['group'] in data['groups'], f'{rid}: rationale/group')
        disposition = row['disposition']
        allowed = {'preserve-confirmed', 'repoint', 'owned-park'} if row['kind'] == 'park-unconfirmed-preserve-premise' else {'retire-with-source', 'successor-bound', 'owned-park'}
        require(disposition in allowed, f'{rid}: disposition')
        evidence = row['evidence']
        require(isinstance(evidence, list) and evidence, f'{rid}: evidence required')
        for span in evidence:
            check_span(pin, span)
        source = row['source']
        if source.get('present') is False:
            require(row['kind'] == 'park-source-absent', f'{rid}: unexpected absent source')
            probe = subprocess.run(['git', 'cat-file', '-e', f'{pin}:{safe_path(source["file"])}'], cwd=ROOT, capture_output=True)
            require(probe.returncode != 0 and source['fileSha256'] is None, f'{rid}: source not absent')
        else:
            check_span(pin, source)
            require(any(e['file'] == source['file'] and e['startLine'] <= source['startLine'] and e['endLine'] >= source['endLine'] for e in evidence), f'{rid}: source not evidenced')
            unit = proof[rid]['currentUnit']
            require(unit in source['text'], f'{rid}: original bound unit not covered')
            require(all(source['startLine'] <= n <= source['endLine'] for n in proof[rid]['currentLines']), f'{rid}: occurrence lines not covered')
        if disposition in ('repoint', 'successor-bound'):
            successor = row['successor']
            check_span(pin, successor)
            require(successor['section'].strip(), f'{rid}: successor section')
            require(any(line.strip() == successor['section'] for line in blob(pin, successor['file']).decode().splitlines()), f'{rid}: missing section')
            require(any(e == {k: v for k, v in successor.items() if k != 'section'} for e in evidence), f'{rid}: successor evidence missing')
        if disposition == 'owned-park':
            require(row.get('owner', '').strip() and row.get('nextAction', '').strip(), f'{rid}: owner/action')
        if row.get('needsFlipDate'):
            require(row.get('flipDateReason', '').strip(), f'{rid}: flip-date reason')
        if disposition == 'repoint':
            require('patch' in row, f'{rid}: missing prepared patch')
        if 'patch' in row:
            patch = row['patch']
            require(rid in patch['rowIds'], f'{rid}: patch linkage')
            key = patch['file']
            require(key not in patches or patches[key] == patch, 'conflicting same-file patches')
            patches[key] = patch
        counts[disposition] += 1
    require(dict(counts) == data['counts'], 'count mismatch')
    for patch in patches.values():
        require(set(patch['rowIds']) == {r['rowId'] for r in rows if r.get('patch', {}).get('file') == patch['file']}, 'patch group coverage')
        check_patch(pin, patch, set(actual_ids))
    print(json.dumps({'status': 'passed', 'shard': args.shard, 'pin': pin,
                      'rows': len(rows), 'counts': dict(sorted(counts.items())),
                      'patches': len(patches), 'replays': len(patches) * 2}, sort_keys=True))


if __name__ == '__main__':
    main()
