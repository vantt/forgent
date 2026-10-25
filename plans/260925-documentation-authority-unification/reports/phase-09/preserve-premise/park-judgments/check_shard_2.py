#!/usr/bin/env python3
"""Read-only, pin-bound park-judgment checker; patch writes stay in tempfiles.

Run with python3 -B check_shard_2.py --shard 2 [--self-test].
Span digests include the original line endings; source unit digests use the
exact proof.json currentUnit string (which has no terminal line ending).
This checks custody and replay, not the correctness of a semantic judgment.
"""
import argparse
import collections
import copy
import functools
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[6]
HERE = Path(__file__).resolve().parent
PROOF = HERE.parent / 'proof.json'
ALLOWED = {'preserve-confirmed', 'repoint', 'owned-park',
           'retire-with-source', 'successor-bound'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe(path):
    p = PurePosixPath(path)
    require(path and not p.is_absolute() and '..' not in p.parts,
            'unsafe repository path: ' + path)
    return path


@functools.lru_cache(maxsize=None)
def blob(pin, path):
    safe(path)
    require(re.fullmatch(r'[0-9a-f]{40}', pin), 'pin must be a full commit id')
    return subprocess.run(['git', 'show', f'{pin}:{path}'], cwd=ROOT,
                          check=True, capture_output=True).stdout


def span(pin, item):
    raw = blob(pin, item['path'])
    lines = raw.splitlines(keepends=True)
    start, end = item['startLine'], item['endLine']
    require(type(start) is int and type(end) is int and
            1 <= start <= end <= len(lines), 'invalid evidence lines')
    selected = b''.join(lines[start - 1:end])
    require(item['text'] == selected.decode('utf-8'), 'evidence text mismatch')
    require(item['sha256'] == sha(selected), 'evidence span digest mismatch')
    require(item['fileSha256'] == sha(raw), 'evidence file digest mismatch')
    return selected


def replay(pin, patch):
    safe(patch['file'])
    require(patch['status'] == 'prepared-not-applied', 'patch must be unapplied')
    before = blob(pin, patch['file'])
    require(sha(before) == patch['sourceSha256'], 'patch preimage mismatch')
    lines = before.decode('utf-8').splitlines(keepends=True)
    seen = set()
    for replacement in patch['replacements']:
        n = replacement['line']
        require(n not in seen, 'duplicate replacement line')
        seen.add(n)
        require(1 <= n <= len(lines), 'replacement line outside file')
        require(replacement['before'] in lines[n - 1], 'replacement preimage missing')
        require(lines[n - 1].count(replacement['before']) == 1,
                'replacement must be unambiguous on its line')
        lines[n - 1] = lines[n - 1].replace(replacement['before'], replacement['after'])
    after = ''.join(lines).encode('utf-8')
    require(before != after and sha(after) == patch['proposedSha256'],
            'patch proposed digest mismatch')
    header = f"--- a/{patch['file']}\n+++ b/{patch['file']}\n"
    require(patch['patch'].startswith(header), 'unexpected patch headers')
    require(patch['patch'].count('\n--- ') == 0, 'multi-file patch not allowed')
    # Each temporary directory is removed even when a patch fails.
    base = Path('/tmp/fgos-work')
    base.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='park-shard-check-', dir=base) as tmp:
        target = Path(tmp) / patch['file']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(before)
        for direction, expected in [('--forward', after), ('--reverse', before)]:
            result = subprocess.run(
                ['patch', '--batch', '--fuzz=0', '-p1', direction], cwd=tmp,
                input=patch['patch'].encode('utf-8'), capture_output=True)
            require(result.returncode == 0,
                    'patch replay failed: ' + result.stderr.decode('utf-8'))
            require(b'offset' not in result.stdout and b'fuzz' not in result.stdout,
                    'patch must apply at its exact coordinates')
            require(target.read_bytes() == expected, 'patch output byte mismatch')
            require(not list(Path(tmp).rglob('*.rej')), 'patch rejection left behind')


def validate(data, shard, replay_patches=True):
    pin = data['pin']
    ids_path = str((HERE / f'shard-{shard}-ids.json').relative_to(ROOT))
    ids = json.loads(blob(pin, ids_path))['rowIds']
    require(data['shard'] == shard, 'wrong shard')
    proof_path = str(PROOF.relative_to(ROOT))
    proof = {r['rowId']: r for r in json.loads(blob(pin, proof_path))['rows']}
    require(data['proofSha256'] == sha(blob(pin, proof_path)), 'proof digest mismatch')
    require(data['idsSha256'] == sha(blob(pin, ids_path)), 'ids digest mismatch')
    rows = data['rows']
    actual = [r['rowId'] for r in rows]
    require(len(actual) == len(set(actual)), 'duplicate row')
    require(set(actual) == set(ids), 'shard must cover exactly its ids file')
    require(actual == ids, 'row order must match the ids file')
    counts = dict(collections.Counter(r['disposition'] for r in rows))
    require(data['counts'] == counts, 'disposition count mismatch')
    groups = {g['id']: g for g in data['groups']}
    require(len(groups) == len(data['groups']), 'duplicate group')
    require(collections.Counter(i for g in groups.values() for i in g['rowIds']) ==
            collections.Counter(ids), 'groups must partition shard')
    patches = {}
    patch_members = collections.defaultdict(list)
    for row in rows:
        rid = row['rowId']
        old = proof[rid]
        require(row['pin'] == pin and row['kind'] == old['result'], rid + ': pin/kind')
        require(row['disposition'] in ALLOWED, rid + ': invalid disposition')
        require(row['reason'].strip(), rid + ': missing semantic reason')
        require(rid in groups[row['group']]['rowIds'], rid + ': wrong group')
        require(row['needsFlipDate'] is False, rid + ': unexpected flip-date dependency')
        source = row['source']
        require(source['path'] == old['file'], rid + ': source path mismatch')
        selected = span(pin, source).decode('utf-8')
        require(selected.rstrip('\r\n') == old['currentUnit'].rstrip('\r\n'),
                rid + ': source unit differs from owning proof')
        require(source['unitSha256'] == sha(old['currentUnit'].encode('utf-8')),
                rid + ': source unit digest mismatch')
        require(row['evidence'], rid + ': evidence required')
        require(any(e['path'] == source['path'] and
                    e['startLine'] <= source['startLine'] and
                    e['endLine'] >= source['endLine'] for e in row['evidence']),
                rid + ': passage absent from evidence')
        for item in row['evidence']:
            require(item['role'].strip(), rid + ': evidence role required')
            span(pin, item)
        successor = row.get('successor')
        if row['disposition'] in {'repoint', 'successor-bound'}:
            require(successor and successor['section'].strip(), rid + ': successor required')
            span(pin, successor)
            require(successor['unitSha256'] == successor['sha256'],
                    rid + ': successor unit digest mismatch')
            require(any(e == dict(successor, role='successor-unit')
                        for e in row['evidence']), rid + ': successor evidence missing')
        if row['disposition'] == 'successor-bound':
            require(old['result'] in {'park-source-removed-by-cutover', 'park-source-absent'},
                    rid + ': successor binding requires removed/absent source')
            require(successor['path'] in [s['path'] for s in old['sourceSuccessors']],
                    rid + ': unregistered source successor')
        if row['disposition'] == 'preserve-confirmed':
            require(old['result'] == 'park-unconfirmed-preserve-premise',
                    rid + ': cannot preserve at a removed source')
        if row['disposition'] == 'owned-park':
            require(row.get('owner', '').strip() and row.get('nextAction', '').strip(),
                    rid + ': owned park needs owner and action')
        if row['disposition'] == 'repoint':
            patch = row['patch']
            require(patch['file'] == source['path'], rid + ': patch source mismatch')
            require(rid in patch['rowIds'], rid + ': patch ownership missing')
            require(any(source['startLine'] <= r['line'] <= source['endLine']
                        for r in patch['replacements']), rid + ': patch misses bound passage')
            previous = patches.setdefault(patch['file'], patch)
            require(previous == patch, rid + ': file patches must be co-composed')
            patch_members[patch['file']].append(rid)
        else:
            require('patch' not in row, rid + ': only repoints carry patches')
    for file, patch in patches.items():
        require(sorted(patch['rowIds']) == sorted(patch_members[file]),
                'patch must name exactly the affected shard repoints')
        if replay_patches:
            replay(pin, patch)
    return {'rows': len(rows), 'counts': counts, 'groups': len(groups),
            'preparedPatches': len(patches), 'pin': pin}


def controls(data, shard):
    """Falsify identities, evidence, source custody, and patch integrity."""
    mutations = [
        lambda d: d['rows'].pop(),
        lambda d: d['rows'][0].update(rowId=d['rows'][1]['rowId']),
        lambda d: d['rows'][0]['evidence'][0].update(text='invented\n'),
        lambda d: d['rows'][0]['evidence'][0].update(sha256='0' * 64),
        lambda d: d['rows'][0]['evidence'][0].update(startLine=0),
        lambda d: d['rows'][0]['source'].update(unitSha256='0' * 64),
        lambda d: d['rows'][0].update(pin='0' * 40),
    ]
    for mutate in mutations:
        broken = copy.deepcopy(data)
        mutate(broken)
        try:
            validate(broken, shard, replay_patches=False)
        except (ValueError, KeyError):
            continue
        raise ValueError('negative control was incorrectly accepted')
    patch = next(r['patch'] for r in data['rows'] if r['disposition'] == 'repoint')
    broken = copy.deepcopy(patch)
    broken['patch'] = broken['patch'].replace('@@', '@broken@', 1)
    try:
        replay(data['pin'], broken)
    except ValueError:
        return len(mutations) + 1
    raise ValueError('malformed patch was incorrectly accepted')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--shard', type=int, required=True)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    data = json.loads((HERE / f'shard-{args.shard}.json').read_text())
    result = validate(data, args.shard)
    if args.self_test:
        result['negativeControls'] = controls(data, args.shard)
    result['status'] = 'passed'
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == '__main__':
    main()
