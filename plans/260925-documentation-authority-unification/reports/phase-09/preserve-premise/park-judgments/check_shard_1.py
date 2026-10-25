#!/usr/bin/env python3
"""Check a premise-judgment shard; never apply a prepared patch to the checkout.

Evidence is UTF-8 text with LF separators, without an implied final newline.
File digests hash the complete raw blob. Unit digests hash exactly `text`.
The existing prepared-patches.json format is reused, including grouped rowIds.
"""
import argparse
from collections import Counter
from functools import lru_cache
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'AGENTS.md').is_file())
PHASE = HERE.parents[1]
PROOF = (PHASE / 'preserve-premise/proof.json').relative_to(ROOT).as_posix()
MOVES = 'plans/260925-documentation-authority-unification/reports/phase-08/step-05-cutover-move-set.json'
DISPOSITIONS = {'preserve-confirmed', 'repoint', 'retire-with-source',
                'successor-bound', 'owned-park'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical_sha(value):
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).encode())


def safe_path(value):
    p = PurePosixPath(value)
    require(value and not p.is_absolute() and '..' not in p.parts
            and p.as_posix() == value, f'unsafe path: {value}')
    return value


@lru_cache(maxsize=None)
def blob(pin, file):
    safe_path(file)
    return subprocess.run(['git', 'show', f'{pin}:{file}'], cwd=ROOT,
                          check=True, capture_output=True).stdout


def check_span(span, pin):
    file = safe_path(span['file'])
    raw = blob(pin, file)
    require(sha(raw) == span['fileSha256'], f'file digest: {file}')
    lines = raw.decode().splitlines()
    start, end = span['lineStart'], span['lineEnd']
    require(type(start) is int and type(end) is int and
            1 <= start <= end <= len(lines), f'line range: {file}')
    text = '\n'.join(lines[start - 1:end])
    require(text == span['text'] and text, f'evidence text: {file}:{start}')
    require(sha(text.encode()) == span['unitSha256'], f'unit digest: {file}:{start}')
    # This is also a live-drift check, not an author-pin-only certificate.
    require((ROOT / file).read_bytes() == raw, f'live drift; rejudge: {file}')


def check_successor(successor, pin, moves):
    require(successor['section'], 'missing successor section')
    check_span(successor['unit'], pin)
    require(successor['file'] == successor['unit']['file'], 'successor file mismatch')
    require(successor['currentUnitDigest'] == successor['unit']['unitSha256'],
            'successor unit digest mismatch')
    check_span(successor['sectionEvidence'], pin)
    require(successor['section'] == successor['sectionEvidence']['text'],
            'section evidence mismatch')
    mapping = successor['mapping']
    require(mapping['file'] == MOVES and mapping['fileSha256'] == sha(blob(pin, MOVES)),
            'mapping input digest')
    candidates = [r for r in moves['paths'] if r['oldPath'] == mapping['oldPath']]
    require(len(candidates) == 1, 'mapping oldPath missing or ambiguous')
    matches = [m for m in candidates[0]['moves']
               if m['to'] == successor['file'] and m['id'] == mapping['id']]
    require(len(matches) == 1, 'successor not in the cutover mapping')
    for related in successor.get('relatedHolders', []):
        check_successor(related, pin, moves)


def check_patch(patch, pin, row_ids):
    file = safe_path(patch['file'])
    require(patch['status'] == 'prepared-not-applied', 'patch was applied or mislabelled')
    require(set(patch['rowIds']) <= row_ids, 'patch crosses shard')
    before = blob(pin, file)
    require(sha(before) == patch['sourceSha256'], f'patch preimage: {file}')
    lines = before.decode().splitlines(keepends=True)
    seen = set()
    for replacement in patch['replacements']:
        line = replacement['line']
        require(line not in seen and 1 <= line <= len(lines), 'duplicate/invalid replacement line')
        seen.add(line)
        require(lines[line - 1].rstrip('\n') == replacement['before'], 'replacement preimage')
        require(replacement['before'] != replacement['after'] and
                '\n' not in replacement['after'], 'empty or multiline replacement')
        lines[line - 1] = replacement['after'] + ('\n' if lines[line - 1].endswith('\n') else '')
    proposed = ''.join(lines).encode()
    require(sha(proposed) == patch['proposedSha256'], f'patch postimage: {file}')
    diff = patch['patch']
    headers = [line for line in diff.splitlines() if line.startswith(('--- ', '+++ '))]
    require(headers == [f'--- a/{file}', f'+++ b/{file}'], 'patch targets unexpected file')
    Path('/tmp/fgos-work').mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='park-judgments-', dir='/tmp/fgos-work') as tmp:
        target = Path(tmp) / file
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(before)
        for direction, expected in [('--forward', proposed), ('--reverse', before)]:
            run = subprocess.run(['patch', '--batch', '--fuzz=0', '--no-backup-if-mismatch',
                                  '-p1', direction], input=diff.encode(), cwd=tmp,
                                 capture_output=True)
            require(run.returncode == 0, f'{direction} patch: {file}: {run.stderr.decode()}')
            output = (run.stdout + run.stderr).decode()
            require(not re.search(r'offset|fuzz', output, re.I), f'inexact patch: {output}')
            require(target.read_bytes() == expected, f'patch replay bytes: {file}')
        require(not list(Path(tmp).rglob('*.rej')) and not list(Path(tmp).rglob('*.orig')),
                'patch left rejects/backups')


def check(shard):
    ids_raw = (HERE / f'shard-{shard}-ids.json').read_bytes()
    ids_doc = json.loads(ids_raw)
    document = json.loads((HERE / f'shard-{shard}.json').read_text())
    pin = document['pin']
    require(re.fullmatch(r'[0-9a-f]{40}', pin), 'pin must be full commit id')
    require(document['shard'] == shard and document['idsSha256'] == sha(ids_raw), 'ids input mismatch')
    rows = document['rows']
    ids = ids_doc['rowIds']
    require(len(ids) == len(set(ids)), 'ids file repeats an id')
    require(len(rows) == len(ids) and Counter(r['rowId'] for r in rows) == Counter(ids),
            'coverage must equal ids exactly')
    proof_raw = blob(pin, PROOF)
    require(document['proofSha256'] == sha(proof_raw), 'proof input digest')
    proof = {r['rowId']: r for r in json.loads(proof_raw)['rows']}
    moves = json.loads(blob(pin, MOVES))
    patches = {}
    for row in rows:
        rid = row['rowId']
        original = proof[rid]
        require(row['pin'] == pin and row['kind'] == original['result'], f'pin/kind: {rid}')
        require(row['proofRowSha256'] == canonical_sha(original), f'proof row digest: {rid}')
        require(row['disposition'] in DISPOSITIONS and row['reason'] and row['group'],
                f'missing judgment: {rid}')
        evidence = row['evidence']
        require(evidence and any(e['role'] == 'source-unit' for e in evidence), f'no passage: {rid}')
        for span in evidence:
            check_span(span, pin)
        sources = [e for e in evidence if e['role'] == 'source-unit']
        require(len(sources) == 1 and sources[0]['file'] == original['file'] and
                sources[0]['text'] == original['currentUnit'], f'source identity: {rid}')
        require(all(sources[0]['lineStart'] <= line <= sources[0]['lineEnd']
                    for line in original['currentLines']), f'source locator: {rid}')
        if row['kind'] == 'park-unconfirmed-preserve-premise':
            require(row['disposition'] in {'preserve-confirmed', 'repoint', 'owned-park'}, rid)
        else:
            require(row['disposition'] in {'retire-with-source', 'successor-bound', 'owned-park'}, rid)
        if row['disposition'] in {'repoint', 'successor-bound'}:
            check_successor(row['successor'], pin, moves)
        if row['disposition'] == 'owned-park':
            require(row.get('owner') and row.get('nextAction'), f'unowned park: {rid}')
        if row.get('needsFlipDate'):
            require(row.get('flipDateReason'), f'unexplained date dependency: {rid}')
        if row['disposition'] == 'repoint':
            patch = row['patch']
            require(rid in patch['rowIds'] and patch['file'] == original['file'], f'patch identity: {rid}')
            previous = patches.setdefault(patch['file'], patch)
            require(previous == patch, f'patches for {patch["file"]} must be co-composed')
    for patch in patches.values():
        require(set(patch['rowIds']) == {r['rowId'] for r in rows
                if r['disposition'] == 'repoint' and r['patch']['file'] == patch['file']},
                'patch group coverage mismatch')
        check_patch(patch, pin, set(ids))
    counts = dict(sorted(Counter(r['disposition'] for r in rows).items()))
    require(document['counts'] == counts, 'reported counts disagree')
    print(json.dumps({'status': 'pass', 'shard': shard, 'pin': pin, 'rows': len(rows),
                      'counts': counts, 'preparedPatches': len(patches),
                      'forwardAndReverse': len(patches) * 2}, sort_keys=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--shard', type=int, required=True)
    args = parser.parse_args()
    check(args.shard)
