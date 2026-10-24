#!/usr/bin/env python3
"""Materialize the authored park review's source deltas, never decide by rule.

park-decisions.json is the explicit human-readable judgment input. Its record
and evidence digests fail closed if any source changes. Reuse sweep's exact
bound/current locators and recompose's GNU patch proof; no source is edited.
"""
import argparse
import difflib
import json
from pathlib import Path

import recompose

sweep = recompose.sweep
HERE = Path(__file__).resolve().parent


def dump(name, value):
    (HERE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin', required=True)
    args = ap.parse_args()
    pin = sweep.git('rev-parse', args.pin + '^{commit}').decode().strip()
    decisions = sweep.load(HERE / 'park-decisions.json')
    assert pin == decisions['sourceCommit']
    originals, _ = sweep.scope()
    rows, _ = sweep.records_at(pin)
    current = {r['id']: r for r in rows}
    deltas, reviews = {}, []
    for decision in decisions['rows']:
        row = current[decision['id']]
        assert decision['recordSha256'] == row['recordSha256'], row['id']
        assert decision['evidenceSha256'] == sweep.evidence_digest(row['passages']), row['id']
        entry = originals[row['id']]
        claims = {str(i.get('id') or i.get('referenceId') or i.get('edgeId')): i
                  for field in ['edges', 'references', 'dynamicTraces', 'authorAddedReferences']
                  for i in entry['record'].get(field, [])}
        joins = []
        for bound, passage in zip(sweep.bound_passages(entry), row['passages']):
            before = bound['text']
            after = passage.get('currentText')
            if after is None and passage.get('currentReadCommand'):
                raw = sweep.blob(pin, passage['currentPath']).decode()
                after = ''.join(raw.splitlines(True)[passage['startLine'] - 1:passage['endLine']])
            assert sweep.sha(before) == passage['boundSha256']
            assert (sweep.sha(after) if after is not None else None) == passage['currentSha256']
            # Every passage was read above. Unchanged/moved text already has
            # an owning join in judgments/passages; do not duplicate it here.
            if passage['classification'] not in ('changed', 'absent'):
                continue
            body = {k: passage.get(k) for k in ['path', 'currentPath', 'oldStartLine', 'oldEndLine',
                     'startLine', 'endLine', 'boundSha256', 'currentSha256', 'currentFileSha256',
                     'classification', 'boundReadCommand', 'currentReadCommand', 'locator']}
            # Full delta, including large whole-file dependencies; never a truncated excerpt.
            body['diff'] = ''.join(difflib.unified_diff(before.splitlines(True),
                                    (after or '').splitlines(True), fromfile='bound', tofile='current'))
            key = sweep.sha(json.dumps(body, sort_keys=True, ensure_ascii=False))
            deltas[key] = body
            claim = claims.get(str(passage['passageId']).split('/caller')[0], {})
            joins.append({'passageId': passage['passageId'], 'deltaRef': 'park-review-evidence.json#' + key,
                          'recordedDisposition': passage.get('recordedDisposition'),
                          'claimSha256': sweep.sha(json.dumps(claim, sort_keys=True, ensure_ascii=False))})
        reviews.append({'id': row['id'], 'recordSha256': row['recordSha256'],
                        'evidenceSha256': decision['evidenceSha256'],
                        'passagesRead': len(row['passages']), 'passages': joins})
    dump('park-review-evidence.json', {'sourceCommit': pin, 'rows': reviews, 'deltas': deltas,
         'scope': 'Every bound/current passage read; full changed/absent deltas only. Claim hashes resolve to the record/item named by row id and passageId. Unchanged/moved evidence is reused from judgments.json/passages.json, never duplicated. Semantic judgments live in park-decisions.json; no independent acceptance.'})

    commands = []
    # One stale numeric source citation remains after the root-discovery rewrite.
    path = 'packages/distribution/rust/src/workspace.rs'
    before = sweep.blob(pin, path).decode()
    old = '//! Follows `docs/specs/distribution.md:297` for workspace root discovery: the\n'
    new = ('//! Follows the Git Common Directory Discovery contract in\n'
           '//! `docs/platform/packaging-distribution/contracts/activation-binding.md`\n'
           '//! (under Init Pipeline And Root Binding) for workspace root discovery: the\n')
    assert before.count(old) == 1
    after = before.replace(old, new)
    forward = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                          fromfile='a/' + path, tofile='b/' + path))
    rollback = ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True),
                                           fromfile='a/' + path, tofile='b/' + path))
    proof = recompose.replay(path, before, after, forward, rollback, commands)
    dump('park-supplemental-specs.json', {'sourceCommit': pin, 'patches': [{
         'id': 'park-review:workspace-root-citation', 'path': path,
         'beforeSha256': sweep.sha(before), 'expectedAfterSha256': sweep.sha(after),
         'diff': forward, 'rollbackDiff': rollback, 'roundtrip': proof,
         'purpose': 'Comment-only current source citation; no executable Rust bytes change.',
         'independentAcceptance': False}]})
    dump('park-review-commands.json', commands + sweep.COMMANDS)
    print(json.dumps({'rowsRead': len(reviews), 'distinctFullDeltas': len(deltas),
                      'supplementalBodies': 1, 'patchExits': [c['exit'] for c in commands]}))


if __name__ == '__main__':
    main()
