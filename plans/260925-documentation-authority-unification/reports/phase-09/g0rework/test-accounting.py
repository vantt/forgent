#!/usr/bin/env python3
"""Owning proof for exact rebind acceptance and refusal, using real witnesses.

The historical authoring assertions do not observe live drift accounting. These
controls call that single production predicate; no checkout bytes are changed.
Run from the repository root with python3 -B; extractors own disposable scratch.
"""
import copy
import json
from pathlib import Path
import runpy
import subprocess


HERE = Path('plans/260925-documentation-authority-unification/reports/phase-09/g0rework')


def main():
    verifier = runpy.run_path(str(HERE / 'verify.py'))
    misc = runpy.run_path(str(HERE.parent / 'misc-fix/rebind.py'))
    rebind = runpy.run_path(str(HERE.parent / 'rebind/rebind.py'))
    pin = subprocess.check_output(['git', 'log', '-1', '--format=%H', '--',
                                   str(HERE / 'receipt.json')], text=True).strip()
    records = verifier['recorded_rebindings'](misc['preimages'](pin))
    paths = sorted({r['after']['targetOwner'] for r in records})
    catalog = rebind['extract'](dict(paths=paths))['catalog']
    account = lambda row, records: verifier['account_target'](row, catalog, records, rebind['matches'])
    results = []
    # Both persisted record shapes must authorize their exact real transition.
    for name in ('g0-direct-rebindings.json', 'g0-rework-rebindings.json'):
        edge = next(r for r in records if name in r['record'] and r['before'] != r['after'])
        assert account(edge['before'], [edge]) == edge
        assert account(edge['after'], []) is None
        results.append(dict(behavior=name + ': exact recorded transition and unchanged live target pass'))
    edge = next(r for r in records if r['before'] != r['after'])
    row = edge['before']
    cases = [('unaccounted drift is refused', [])]
    for side in ('before', 'after'):
        for key in ('targetOwner', 'targetAnchor', 'targetUnitDigest'):
            wrong = copy.deepcopy(edge)
            wrong[side][key] = 'wrong-' + str(wrong[side][key])
            cases.append((side + ' wrong ' + key + ' is refused', [wrong]))
    for side in ('before', 'after'):
        short = copy.deepcopy(edge)
        short[side]['targetUnitDigest'] = short[side]['targetUnitDigest'][:12]
        cases.append((side + ' digest prefix is refused', [short]))
    for label, altered in cases:
        try:
            account(row, altered)
        except AssertionError as error:
            assert 'unaccounted live target drift' in str(error)
        else:
            raise AssertionError(label)
        results.append(dict(behavior=label, expected='AssertionError', refused=True))
    # A record for one target must not waive an unrelated live digest change.
    changed = copy.deepcopy(catalog)
    target = next(u for u in changed[edge['after']['targetOwner']]['units']
                  if u['anchor'] == edge['after']['targetAnchor'])
    target['textDigest'] = '0' * 64
    try:
        verifier['account_target'](row, changed, [edge], rebind['matches'])
    except AssertionError:
        results.append(dict(behavior='unrecorded new live digest is refused', refused=True))
    else:
        raise AssertionError('unrecorded new live digest was accepted')
    print(json.dumps(dict(status='pass', controls=results), indent=2))


if __name__ == '__main__':
    main()
