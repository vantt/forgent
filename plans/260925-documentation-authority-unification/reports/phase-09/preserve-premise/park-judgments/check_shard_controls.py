#!/usr/bin/env python3
"""Owning checker-only controls; python3 -B check_shard_controls.py.

The previous 37 controls were recorded only as inline-probe results. This makes
those behaviours reproducible and adds rejection probes for premise-patch.v1.
No product test, consumer mutation, or checker-only production switch is used.
"""
import contextlib
import copy
import difflib
import io
import json
from pathlib import Path
import subprocess
import sys
from unittest.mock import patch

sys.dont_write_bytecode = True
import check_shard as c


def main():
    pin = subprocess.check_output(['git', '--no-optional-locks', 'rev-parse', 'HEAD'],
                                  cwd=c.ROOT, text=True).strip()
    rp = c.load_replayer()
    states, findings, inventory = c.replay_chain(pin, rp)
    assert not findings and all(s['strict'] for s in states.values())
    validated = {n: c.validate_shard(n, states) for n in [1, 2, 3]}
    physical = c.load(c.HERE.parent / 'proof.json')['physical']
    moving = {r['from'] for r in physical['physicalMoves']} | set(physical['additionalStep6Removals'])
    tracked = subprocess.check_output(['git', '--no-optional-locks', 'ls-tree', '-r', '--name-only', pin],
                                      cwd=c.ROOT, text=True).splitlines()
    checks = []

    def check(name, predicate):
        assert predicate, name
        checks.append(dict(case=name, passed=True))

    def rejects(name, action):
        try:
            action()
        except (ValueError, KeyError, TypeError, StopIteration):
            check(name, True)
        else:
            raise AssertionError(name + ': accepted invalid input')

    def validate(number, document):
        original_load = c.load
        with patch.object(c, 'load', side_effect=lambda path: document if path == c.HERE / f'shard-{number}.json' else original_load(path)):
            return c.validate_shard(number, states)

    def inspect(number, document=None, changed_states=None):
        d, proof, patches = validated[number]
        d = document if document is not None else d
        patches = {r['patch']['file']: r['patch'] for r in d['rows'] if 'patch' in r}
        return c.inspect_rows(number, d, proof, patches, changed_states if changed_states is not None else states,
                              rp, moving, tracked)

    check('all shard bindings, digests, coverage and patch pre/post-images validate',
          sum(len(d['rows']) for d, _, _ in validated.values()) == 787)
    for n, (document, _, _) in validated.items():
        for label, change in [
            ('missing row', lambda d: d['rows'].pop()),
            ('duplicate row', lambda d: d['rows'].append(copy.deepcopy(d['rows'][0]))),
            ('forged span text', lambda d: d['rows'][0]['evidence'][0].__setitem__('text', 'forged')),
            ('forged file digest', lambda d: d['rows'][0]['evidence'][0].__setitem__('fileSha256', '0' * 64)),
            ('diff inconsistent with declared replacements', lambda d: [r['patch'].__setitem__('patch', r['patch']['patch'] + '\n') for r in d['rows'] if 'patch' in r]),
        ]:
            d = copy.deepcopy(document); change(d)
            rejects(f'shard {n} rejects {label}', lambda: validate(n, d))

    file = 'sample.md'; before = 'top\nold\nbottom\n'; after = before.replace('old', 'new')
    diff = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/'+file, tofile='b/'+file))
    check('clean row patch applies forward and reverses exactly', c.patch_roundtrip(file, before, diff)['ok'])
    check('changed neighbour fails at fuzz zero', not c.patch_roundtrip(file, before.replace('bottom', 'changed'), diff)['ok'])
    replacements = [dict(before='// old/path.md', after='// new/path.md')]
    check('rewrapped path post-image is duplicate', c.contains_post('// prefix new/path.md', replacements))
    check('old token retained is not a duplicate', not c.contains_post('old/path.md new/path.md', replacements))
    check('unrelated prose cannot prove duplicate', not c.contains_post('prefix', replacements))
    check('removed directory and wildcard are recognized', c.cutover_removes('a/', {'a/x', 'a/y'}, ['a/x', 'a/y']) and c.cutover_removes('a/*', {'a/x', 'a/y'}, ['a/x', 'a/y']))
    check('partly retained directory is not removed', not c.cutover_removes('a/', {'a/x'}, ['a/x', 'a/y']))
    check('already absent operand is not a cutover removal', not c.cutover_removes('absent.md', set(), []))

    all_findings = []
    for n in validated:
        summary, fs = inspect(n)
        all_findings.extend(fs)
        check(f'shard {n} real row/chain inspection is green', not any(not f['resolved'] for f in fs) and all(r['ok'] for r in summary['patchReplays'].values()))
    markers = [f for f in all_findings if f['kind'] == 'duplicateOfChain']
    check('duplicate attributed to exact chain entry', len(markers) == 24 and all(f['resolvedBy'] == f['chainEntryId'] for f in markers))
    check('valid alreadyComposed with patch removed resolves duplicate', all(f['resolved'] for f in markers))

    def marker_probe(name, mutate, state_mutation=None):
        d = copy.deepcopy(validated[1][0]); row = next(r for r in d['rows'] if r['rowId'] == 'f00183')
        mutate(row)
        ss = copy.deepcopy(states) if state_mutation else states
        if state_mutation:
            state_mutation(ss[validated[1][1]['f00183']['file']])
        _, fs = inspect(1, d, ss)
        check(name, any(f['kind'] == 'invalidAlreadyComposed' and f.get('rowId') == 'f00183' for f in fs))

    marker_probe('unknown alreadyComposed is refused', lambda r: r.__setitem__('alreadyComposed', 'unknown'))
    def parallel_patch(row):
        source_file = validated[1][1][row['rowId']]['file']
        before = states[source_file]['text']; line = before.splitlines(True)[0]
        after = before.replace(line, line.rstrip('\n') + ' (extra)\n', 1)
        row['patch'] = dict(file=source_file, basis='chain', rowIds=[row['rowId']],
                            patch=''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                  fromfile='a/'+source_file, tofile='b/'+source_file)),
                            replacements=[dict(before=line.rstrip('\n'), after=line.rstrip('\n')+' (extra)',
                                               ownerRowIds=[row['rowId']])])
    marker_probe('alreadyComposed cannot leave parallel patch', parallel_patch)
    marker_probe('alreadyComposed cannot waive stale chain input', lambda r: None, lambda s: s.__setitem__('strict', False))
    marker_probe('wrong-file alreadyComposed is refused', lambda r: r.__setitem__('alreadyComposed', 'file:AGENTS.md'))
    check('wrapped alreadyComposed matches the full retarget', any(f.get('rowId') == 'f00183' and f['resolved'] for f in markers))
    marker_probe('wrapped old operand cannot lose its continuation', lambda r: None,
                 lambda s: [t.__setitem__('before', t['before'].replace('fgos-gateway-api-v1.yaml', 'wrong.yaml')) for t in s['trace']])
    marker_probe('a different successor is not a valid retarget', lambda r: r['successor'].__setitem__('file', 'docs/wrong.md'))

    d = copy.deepcopy(validated[3][0]); row = next(r for r in d['rows'] if r['rowId'] == 'f07786')
    source_file = validated[3][1][row['rowId']]['file']; ss = copy.deepcopy(states)
    ss[source_file]['text'] = ss[source_file]['text'].replace('docs/specs/runner.md', 'docs/wrong.md')
    _, fs = inspect(3, d, ss)
    check('preserved occurrence changed by chain is a conflict', any(f['kind'] == 'conflictsWithChain' and f.get('rowId') == row['rowId'] for f in fs))
    check('harmless gloss is insertion-only and retains all preserved references', c.preserved_line_survives('See `docs/old.md` RUL100.', 'See `docs/old.md` RUL100 (explanation).'))
    check('gloss cannot replace a preserved reference', not c.preserved_line_survives('See `docs/old.md` RUL100.', 'See `docs/new.md` RUL100 (explanation).'))
    check('a preserved path cannot become a longer different path', not c.preserved_line_survives('docs/old.md', 'docs/old.md-other'))
    check('gloss cannot remove preserved prose', not c.preserved_line_survives('See `docs/old.md` important.', 'See `docs/old.md` (gloss).'))

    # Upstream citation corrections are not F patches. This helper owns exact
    # rebind authentication; the shared F door has only the wiring to it.
    rebound = next(r for r in validated[3][0]['rows'] if r.get('preservationRebind'))
    rebound_file = rebound['preservationRebind']['source']['file']
    corrected = c.preservation_line(rebound, rebound_file, 23, pin)
    check('preservation follows the authenticated upstream source correction',
          corrected == rebound['preservationRebind']['source']['text'] and
          c.preserved_line_survives(corrected, states[rebound_file]['text']))
    frozen = copy.deepcopy(rebound); frozen.pop('preservationRebind')
    check('without an explicit rebind the frozen preservation obligation remains',
          c.preservation_line(frozen, rebound_file, 23, pin) == frozen['source']['text'] and
          not c.preserved_line_survives(frozen['source']['text'], states[rebound_file]['text']))
    for label, mutate in [
        ('forged corrected text', lambda r: r['preservationRebind']['source'].__setitem__('text', 'forged')),
        ('forged corrected unit hash', lambda r: r['preservationRebind']['source'].__setitem__('unitSha256', '0' * 64)),
        ('forged corrected file hash', lambda r: r['preservationRebind']['source'].__setitem__('fileSha256', '0' * 64)),
        ('different source file', lambda r: r['preservationRebind']['source'].__setitem__('file', 'docs/wrong.md')),
        ('different source ordinal', lambda r: r['preservationRebind'].__setitem__('sourceLine', 22)),
        ('different correction owner', lambda r: r['preservationRebind'].__setitem__('composedBy', r['pin'])),
        ('parallel executable patch', lambda r: r.__setitem__('patch', {'file': rebound_file})),
        ('non-preserve judgment', lambda r: r.__setitem__('disposition', 'repoint')),
        ('later commit falsely claiming the correction', lambda r: r['preservationRebind'].update(pin=pin, composedBy=pin)),
    ]:
        changed = copy.deepcopy(rebound); mutate(changed)
        rejects('preservation rebind rejects ' + label,
                lambda: c.preservation_line(changed, rebound_file, 23, pin))
    rejects('a later correction cannot certify an earlier replay pin',
            lambda: c.preservation_line(rebound, rebound_file, 23, rebound['pin']))
    check('a valid upstream rebind never permits a downstream F rewrite',
          not c.preserved_line_survives(corrected, corrected.replace('ee2ce49c4', 'forged')))

    # Current fixed rows replace the old expected-red CLI runs. Deliberately bad
    # documents still exercise the real main error/report boundary without a
    # second expensive replay or a persistent report write during each probe.
    original_write = Path.write_text
    for selection in ['1', '2', '3', 'all']:
        output = {}
        def capture(path, text, *args, **kwargs):
            if path.parent == c.HERE and path.name == f'chain-check-{pin[:9]}.json':
                output.update(json.loads(text)); return len(text)
            return original_write(path, text, *args, **kwargs)
        argv = ['check_shard.py', '--all'] if selection == 'all' else ['check_shard.py', '--shard', selection]
        with patch.object(sys, 'argv', argv), patch.object(c, 'replay_chain', return_value=(states, [], inventory)), \
             patch.object(c, 'validate_shard', side_effect=ValueError('negative coverage control')), \
             patch.object(Path, 'write_text', capture), contextlib.redirect_stdout(io.StringIO()):
            exit_code = c.main()
        check(f'--{selection} exits 1 with invalid-input findings, no traceback', exit_code == 1 and output['unresolved'] > 0)

    old_controls = c.load(c.HERE / 'chain-check-controls.json')
    historical = c.load(c.HERE / 'chain-check-c804a3213.json')['findings']
    named_duplicates = set(old_controls['reviewCrossCheck']['duplicateRows'])
    named_conflicts = set(old_controls['reviewCrossCheck']['conflictRows'])
    check('all review-named duplicateOfChain rows remain detected after repair', named_duplicates <= {f['rowId'] for f in markers})
    check('all review-named original conflicts retain their historical detection proof', named_conflicts <= {f.get('rowId') for f in historical if f['kind'] in {'conflictsWithChain', 'duplicateOfChain'}})
    check('all review-named conflicts now have guarded replayable repairs or markers', named_conflicts <= {r['rowId'] for d, _, _ in validated.values() for r in d['rows'] if r.get('patch') or r.get('alreadyComposed')})

    for basis in ['pin', 'chain']:
        n = next(n for n, (d, _, _) in validated.items() if any(r.get('patch', {}).get('basis') == basis for r in d['rows']))
        d = copy.deepcopy(validated[n][0]); p = next(r['patch'] for r in d['rows'] if r.get('patch', {}).get('basis') == basis)
        target = p['file']
        for r in d['rows']:
            if r.get('patch', {}).get('file') == target: r['patch']['sourceSha256'] = '0' * 64
        rejects(basis + ' basis refuses a forged preimage', lambda: validate(n, d))

    chain_patch = next(p for p in validated[1][2].values() if p['basis'] == 'chain')
    for label, mutate in [
        ('wrong chain result hash', lambda p: p.__setitem__('chainResultSha256', '0' * 64)),
        ('missing chain predecessor', lambda p: p.__setitem__('chainEntryIds', [])),
        ('reordered chain predecessors', lambda p: p.__setitem__('chainEntryIds', list(reversed(p['chainEntryIds'])))),
        ('unknown basis', lambda p: p.__setitem__('basis', 'evidence-only')),
    ]:
        p = copy.deepcopy(chain_patch); mutate(p)
        rejects(label, lambda: c.patch_basis(p, validated[1][0]['pin'], states))
    ss = copy.deepcopy(states); ss[chain_patch['file']]['strict'] = False
    rejects('chain basis refuses diagnostic-only bytes', lambda: c.patch_basis(chain_patch, validated[1][0]['pin'], ss))
    d = copy.deepcopy(validated[3][0]); d['chainRebases'] = []
    rejects('parallel legacy patch representation is refused', lambda: validate(3, d))
    d = copy.deepcopy(validated[3][0]); d['frozenPinEvidence'][0]['patch'] = 'not executable'
    rejects('frozen pin evidence cannot carry another executable diff', lambda: validate(3, d))

    for label, mutate in [
        ('wrong successor holder file', lambda p: p['holder'].__setitem__('file', 'docs/wrong.md')),
        ('wrong successor holder section', lambda p: p['holder'].__setitem__('sections', ['## Invented'])),
        ('forged successor holder evidence', lambda p: p['holder']['evidence'][0].__setitem__('text', 'forged')),
        ('pin-basis successor proposal', lambda p: p.__setitem__('basis', 'pin')),
        ('replacement outside source evidence', lambda p: p['replacements'][0].__setitem__('sourceLine', 999999)),
    ]:
        d = copy.deepcopy(validated[3][0]); target = 'docs/platform/identity/spec.md'
        for r in d['rows']:
            if r.get('patch', {}).get('file') == target: mutate(r['patch'])
        rejects(label, lambda: validate(3, d))

    summary, fs = inspect(3)
    presence = {r['rowId']: r['sourcePresence'] for r in summary['checks']}
    check('already-absent source is separate from a cutover removal', presence['f07852'] == presence['f07854'] == 'already-absent' and presence['f08335'] == 'removed-by-cutover')
    d = copy.deepcopy(validated[3][0]); r = next(r for r in d['rows'] if r['rowId'] == 'f07852')
    r['source']['file'] = 'docs/platform/identity/spec.md'
    rejects('existing source cannot claim absence', lambda: validate(3, d))
    d = copy.deepcopy(validated[3][0]); r = next(r for r in d['rows'] if r['rowId'] == 'f07786')
    r['disposition'] = 'successor-bound'
    _, fs = inspect(3, d)
    check('a surviving source still rejects an unnecessary successor binding', any(f['kind'] == 'successorOfSurvivingSource' and f.get('rowId') == 'f07786' for f in fs))

    d = copy.deepcopy(validated[2][0])
    for row in d['rows']:
        if row.get('patch', {}).get('file') == 'docs/platform/governance.md':
            row['patch']['replacements'][0]['sourceLine'] += 1
    rejects('an in-span ordinal cannot be relabelled to a different base line', lambda: validate(2, d))

    packet_path = c.PHASE / 'composition/patch-specs.json'
    packet = c.load(packet_path)
    new_roots = c.load(c.HERE / 'chain-rebases.json')['entries']
    for name, mutate, kind in [
        ('an omitted rebased root exposes its stale predecessor',
         lambda p: p['effectiveSpecIds'].remove(new_roots[0]['chainEntryId']), 'staleChainEntry'),
        ('a forged chain postimage is rejected',
         lambda p: next(s for s in p['patches'] if s['id'] == new_roots[0]['chainEntryId']).__setitem__('expectedAfterSha256', '0' * 64), 'conflictsWithChain'),
        ('a forged chain rollback is rejected',
         lambda p: next(s for s in p['patches'] if s['id'] == new_roots[0]['chainEntryId']).__setitem__('rollbackDiff', ''), 'conflictsWithChain'),
    ]:
        changed = copy.deepcopy(packet); mutate(changed); original_load = c.load
        with patch.object(c, 'load', side_effect=lambda path: changed if path == packet_path else original_load(path)):
            _, fs, _ = c.replay_chain(pin, rp)
        check(name, any(f['kind'] == kind and f['file'] == new_roots[0]['file'] for f in fs))

    result = dict(sourceCommit=pin, command='python3 -B ' + str(Path(__file__).relative_to(c.ROOT)),
                  exit=0, passed=len(checks), failed=0, checks=checks,
                  predecessorControlRecord='chain-check-controls.json (37 controls, retained unchanged)',
                  legacyExpectation='The old expected-red CLI/review outcomes are preserved by historical reports; current rows are repaired. Negative CLI inputs must still fail.',
                  limits='Checker-only controls; no product tests, consumer mutation, authority approval, or gate closure.')
    (c.HERE / 'chain-contract-controls.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(exit=0, passed=len(checks), failed=0)))


if __name__ == '__main__':
    main()
