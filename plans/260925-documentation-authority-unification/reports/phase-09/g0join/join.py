#!/usr/bin/env python3
"""G0: committed ledger@--pin x independent per-row review records.

Read-only git/Python stdlib only. Reuse ledgerfix's hash, snapshot exclusions and
supersession traversal. Aggregate prose/checks never manufacture row verdicts.
Stdout is deterministic JSON; exit 1 means the enumerated gaps remain open.
"""
import argparse
import collections
import hashlib
import json
import pathlib
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = pathlib.PurePosixPath('plans/260925-documentation-authority-unification')
BASE = P / 'reports/phase-09'
sys.path.insert(0, str(HERE.parent / 'ledgerfix'))
from bindings import at, digest, effective, payload, rows, supersessions


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], stderr=subprocess.PIPE)


def records(value, pointer=''):
    """Only actual verdict objects; do not expand counts or prose into rows."""
    if isinstance(value, dict):
        if value.get('verdict') in ('APPROVE', 'REWORK') and (
                'bindingSha256' in value or 'targetUnitDigest' in value or
                str(value.get('claimId', value.get('id', ''))).startswith('claim_')):
            yield pointer, value
        for key, child in value.items():
            yield from records(child, pointer + '/' + key)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from records(child, pointer + '/' + str(index))


def claim_ids(docs, file, pointer):
    """Nested binding rows inherit only their own enclosing claim identity."""
    result = set()
    while True:
        row = at(docs[file], pointer)
        if isinstance(row, dict):
            for key in ('claimId', 'id'):
                if str(row.get(key, '')).startswith('claim_'):
                    result.add(row[key])
        if not pointer:
            return result
        pointer = pointer.rpartition('/')[0]


def obligations(register, docs, baseline):
    pending = {}
    def add(file, pointer, reason):
        pending.setdefault((file, pointer), set()).add(reason)
    for row in register['changedBindings']:
        pointer = '/' + '/'.join(str(k) for k in row['keys'])
        add(row['file'], pointer, 'changedBindings')
    for file, doc in docs.items():
        previous = dict(rows(baseline.get(file, {})))
        for pointer, row in rows(doc):
            if row.get('supersedesBinding') or pointer.startswith('/bindingRefresh/'):
                add(file, pointer, 'later-rebind-or-redecision')
            elif pointer in previous and payload(previous[pointer]) != payload(row):
                add(file, pointer, 'in-place-binding-change-since-frozen-source')
            elif row.get('rebindReason'):
                add(file, pointer, 'recorded-rebind')
    return pending


def resolve(register, docs, baseline):
    links = supersessions(docs)
    groups, errors = {}, []
    for (file, pointer), reasons in sorted(obligations(register, docs, baseline).items()):
        try:
            row = at(docs[file], pointer)
            ef, ep, current = effective(file, pointer, row, docs, links)
        except (KeyError, IndexError, AssertionError) as error:
            errors.append(dict(file=file, pointer=pointer, error=str(error), reasons=sorted(reasons)))
            continue
        key = (ef, ep)
        group = groups.setdefault(key, dict(file=ef, pointer=ep, row=current,
                                           origins=[], refs=set(), ids=set()))
        # Follow the exact lineage, including intermediary rows for review joins.
        f, p, r = file, pointer, row
        while True:
            group['refs'].add((f, p))
            group['ids'].update(claim_ids(docs, f, p))
            identity = (f, p, r.get('targetAnchor'), r.get('targetUnitDigest'))
            if identity not in links:
                break
            f, p = links[identity]
            r = at(docs[f], p)
        group['origins'].append(dict(file=file, pointer=pointer, reasons=sorted(reasons)))
    return groups, errors


def relevant(review, group):
    rid = review.get('claimId', review.get('id', ''))
    file = review.get('file', review.get('shard'))
    pointer = review.get('pointer')
    if str(rid).startswith('claim_'):
        return rid in group['ids'] and (not file or any(f == file for f, _ in group['refs']))
    # Review-local ids (e.g. W19 B-00) are not ledger ids. Their explicit pointer
    # must name a lineage row; a pointer without a shard is allowed only with
    # both exact digests, then uniqueness is checked across the whole population.
    return bool(pointer and any(p == pointer and (not file or f == file)
                                for f, p in group['refs']))


def judge(group, reviews, later):
    row = group['row']
    binding, target = row.get('bindingSha256'), row.get('targetUnitDigest')
    complete, mismatches, reworks = [], [], []
    for review in reviews:
        value = review['value']
        if not relevant(value, group):
            continue
        exact = value.get('bindingSha256') == binding and value.get('targetUnitDigest') == target
        ref = {k: v for k, v in review.items() if k != 'value'}
        ref.update(verdict=value['verdict'], bindingSha256=value.get('bindingSha256'),
                   targetUnitDigest=value.get('targetUnitDigest'))
        if exact and value['verdict'] == 'APPROVE' and review['unique']:
            complete.append(ref)
        elif not exact or not review['unique']:
            mismatches.append(ref)
        if value['verdict'] == 'REWORK' and value.get('bindingSha256') == binding:
            # A missing target digest is not proof of a different/retired REWORK.
            if value.get('targetUnitDigest') in (None, target):
                reworks.append(ref)
    open_rework = [r for r in reworks if not any(later(r['reviewCommit'], a['reviewCommit'])
                                               for a in complete)]
    errors = []
    if not binding or binding != digest(row):
        errors.append('effective-binding-hash-invalid')
    if not target:
        errors.append('effective-target-digest-missing')
    if not complete:
        errors.append('mismatched' if mismatches else 'missing')
    if open_rework:
        errors.append('open-REWORK')
    return dict(file=group['file'], pointer=group['pointer'], ids=sorted(group['ids']),
                bindingSha256=binding, targetUnitDigest=target,
                targetOwner=row.get('targetOwner'), targetAnchor=row.get('targetAnchor'),
                origins=group['origins'], approvals=complete, openRework=open_rework,
                mismatchedVerdicts=mismatches, errors=errors)


def build(pin):
    inputs = {}
    def read(path, commit=pin):
        raw = git('show', f'{commit}:{path}')
        inputs[(commit, str(path))] = dict(pin=commit, path=str(path), sha256=hashlib.sha256(raw).hexdigest())
        return json.loads(raw)
    def documents_at(commit):
        paths = git('ls-tree', '-r', '--name-only', commit,
                    str(P / 'ledger/decisions'), str(P / 'pilot/decisions')).decode().splitlines()
        return {path: read(path, commit) for path in paths if path.endswith('.json')}
    register = read(P / 'reports/phase-08/step-08-preflip-gates.json')
    docs = documents_at(pin)
    groups, errors = resolve(register, docs, documents_at(register['sourceCommit']))
    reviews, aggregate, review_files = [], [], []
    paths = git('ls-tree', '-r', '--name-only', pin, str(BASE / 'reviews')).decode().splitlines()
    for path in paths:
        if not path.endswith('.json'):
            continue
        data = read(path)
        found = list(records(data))
        review_files.append(path)
        if not found:
            aggregate.append(dict(path=path, reason='No per-row binding verdict objects; aggregate/scope review is not a digest-bound approval.'))
            continue
        commit = git('log', '-1', '--format=%H', pin, '--', path).decode().strip()
        for pointer, value in found:
            matches = [g for g in groups.values() if relevant(value, g) and
                       value.get('bindingSha256') == g['row'].get('bindingSha256') and
                       value.get('targetUnitDigest') == g['row'].get('targetUnitDigest')]
            # Several aliases at identical digests are separate ledger rows: no
            # arbitrary choice when a review-local pointer does not disambiguate.
            unique = len(matches) == 1 or str(value.get('claimId', value.get('id', ''))).startswith('claim_')
            reviews.append(dict(path=path, pointer=pointer, reviewCommit=commit,
                                unique=unique, value=value))
    ancestry_cache = {}
    def later(old, new):
        if old == new:
            return False  # conflicting verdicts in one review remain open
        key = (old, new)
        if key not in ancestry_cache:
            proc = subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', old, new], capture_output=True)
            if proc.returncode not in (0, 1):
                raise ValueError('cannot establish review ancestry')
            ancestry_cache[key] = proc.returncode == 0
        return ancestry_cache[key]
    joined = [judge(g, reviews, later) for _, g in sorted(groups.items())]
    counts = dict(frozenChangedBindings=len(register['changedBindings']),
                  obligations=sum(len(g['origins']) for g in groups.values()) + len(errors),
                  effectiveRows=len(joined), approved=sum(not r['errors'] for r in joined),
                  missing=sum('missing' in r['errors'] for r in joined),
                  mismatched=sum('mismatched' in r['errors'] for r in joined),
                  openRework=sum(bool(r['openRework']) for r in joined),
                  invalidBindings=sum(any(e.startswith('effective-') for e in r['errors']) for r in joined),
                  unresolved=len(errors), reviewFiles=len(review_files),
                  perRowVerdicts=len(reviews), aggregateOnly=len(aggregate))
    failed = bool(errors or any(r['errors'] for r in joined))
    return dict(contract='g0-verdict-join.v1', pin=pin, frozenSourcePin=register['sourceCommit'],
                status='gaps' if failed else 'passed', exit=1 if failed else 0,
                method='Committed blobs only; changedBindings plus all explicit supersessions/bindingRefresh/rebindReason rows and in-place payload changes since frozen source; exact lineage, no author reviewStatus inheritance or prose-to-verdict expansion. Matching two stored digests is not a live target-content audit.',
                counts=counts, aggregateOnly=aggregate, unresolved=errors, rows=joined,
                inputs=sorted(inputs.values(), key=lambda r: (r['pin'], r['path'])))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pin', required=True)
    args = parser.parse_args()
    pin = git('rev-parse', '--verify', args.pin + '^{commit}').decode().strip()
    result = build(pin)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return result['exit']


if __name__ == '__main__':
    raise SystemExit(main())
