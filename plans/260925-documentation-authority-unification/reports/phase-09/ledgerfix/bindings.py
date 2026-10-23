"""Shared records-only recipe and traversal; no writes, no author-pin fallback."""
import hashlib
import json
from pathlib import Path
import subprocess

P = Path('plans/260925-documentation-authority-unification')
R = P / 'reports/phase-09/ledgerfix'
GATE = P / 'reports/phase-08/step-08-preflip-gates.json'
KEYS = ['targetOwner', 'targetAnchor', 'targetUnitDigest', 'targetAncestry']
# These are immutable preimages/review snapshots, not current binding assertions.
SNAPSHOTS = {'priorReview', 'supersedesBinding', 'before', 'after', 'beforeBinding',
             'afterBinding', 'sourceOccurrence', 'alreadySupersededHistoricalBindings',
             'targetUnitWitnesses'}


def load(p):
    return json.loads(Path(p).read_text())


def sha(s):
    return hashlib.sha256(s.encode() if isinstance(s, str) else s).hexdigest()


def payload(row):
    result = {k: row.get(k) for k in KEYS}
    if row.get('targetAnchor') is None and (row.get('successorGroup') or 'successorGroupMemberDigests' in row):
        result['successorGroupMemberDigests'] = (sorted(m['unitDigest'] for m in row['successorGroup']['members'])
                                                if row.get('successorGroup') else row['successorGroupMemberDigests'])
    return result


def digest(row):
    return sha(json.dumps(payload(row), sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\n')


def rows(value, pointer=''):
    if isinstance(value, list):
        for i, child in enumerate(value):
            yield from rows(child, pointer + '/' + str(i))
    elif isinstance(value, dict):
        if value.get('targetOwner') and ('targetUnitDigest' in value or 'bindingSha256' in value):
            yield pointer, value
        for key, child in value.items():
            if key not in SNAPSHOTS:
                yield from rows(child, pointer + '/' + key)


def documents():
    return {str(f): load(f) for folder in ['ledger/decisions', 'pilot/decisions']
            for f in sorted((P / folder).glob('*.json'))}


def at(doc, pointer):
    keys = pointer.strip('/').split('/') if pointer else []
    for key in keys:
        doc = doc[int(key)] if isinstance(doc, list) else doc[key]
    return doc


def identity(file, pointer, row):
    # Hash deliberately excluded: a recipe migration cannot break a content join.
    return (file, pointer, row.get('targetAnchor'), row.get('targetUnitDigest'))


def supersessions(docs):
    links = {}
    for file, doc in docs.items():
        for pointer, row in rows(doc):
            old = row.get('supersedesBinding')
            if not old:
                continue
            old_pointer = old.get('pointer') or '/' + old['collection'] + '/' + str(old['index'])
            key = identity(old['shard'], old_pointer, old)
            if key in links:
                assert links[key] == (file, pointer), ('ambiguous overlay', key)
            links[key] = (file, pointer)
    return links


def effective(file, pointer, row, docs, links):
    seen = set()
    while identity(file, pointer, row) in links:
        key = identity(file, pointer, row)
        assert key not in seen, ('overlay cycle', key)
        seen.add(key)
        file, pointer = links[key]
        row = at(docs[file], pointer)
    return file, pointer, row


def catalog(paths, virtual=None):
    request = {'paths': sorted(set(paths)), 'virtual': virtual or []}
    data = json.loads(subprocess.check_output(
        ['node', str(P / 'reports/phase-09/g0fix/extract-units.mjs')],
        input=json.dumps(request).encode()))
    for entry in data['catalog'].values():
        for unit in entry['units']:
            if unit['unitKind'] == 'heading':
                unit['ancestry'] = unit['ancestry'] + [unit['title']]
    return data


def unit_for(row, cat):
    matches = [u for u in cat[row['targetOwner']]['units']
               if u['anchor'] == row.get('targetAnchor') and u['textDigest'] == row.get('targetUnitDigest')]
    assert len(matches) == 1, (row['targetOwner'], row.get('targetAnchor'), row.get('targetUnitDigest'))
    return matches[0]


def head():
    return subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
