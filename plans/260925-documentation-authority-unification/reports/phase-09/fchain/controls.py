#!/usr/bin/env python3
"""Owning falsification probes for the shared replay boundary, not product tests."""
import sys
sys.dont_write_bytecode = True
import copy
import difflib
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
import importlib.util
import check as c


def main():
    shard = c.module('control_shard', c.PHASE / 'preserve-premise/park-judgments/check_shard.py')
    engine = shard.load_replayer()
    results = []
    def entry(name, before, after, owners=None):
        return dict(id=name, file='sample.md', owners=['row-1'] if owners is None else owners,
            beforeSha256=c.sha(before), expectedAfterSha256=c.sha(after), exactBase=True,
            diff=''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/sample.md', tofile='b/sample.md')))
    def state(text):
        return dict(text=text, labels=[set() for _ in text.splitlines(True)], gaps={}, trace=[])
    def test(name, findings, kind):
        assert any(f['kind'] == kind for f in findings), (name, findings)
        results.append(dict(case=name, rejectedBy=kind, findings=findings))
    one = entry('one', 'a\n', 'b\n')
    live = state('a\n'); signatures = {}
    assert not c.apply_one(one, live, engine, signatures)
    test('second independent owner changes the same original line',
         c.apply_one(entry('two', 'b\n', 'c\n'), live, engine, signatures), 'sameLinesTwice')
    test('zero-fuzz conflict on actual patch boundary',
         c.apply_one(one, state('not-a\n'), engine, {}), 'conflict')
    test('patch without an owning row',
         c.apply_one(entry('orphan', 'a\n', 'b\n', []), state('a\n'), engine, {}), 'ownerless')
    signatures = {}; assert not c.apply_one(one, state('a\n'), engine, signatures)
    test('identical change in a second source without composedBy',
         c.apply_one(entry('duplicate', 'a\n', 'b\n'), state('a\n'), engine, signatures), 'duplicateWithoutLink')
    tampered = copy.deepcopy(one); tampered['expectedAfterSha256'] = '0' * 64
    test('self-consistent diff with forged postimage digest', c.apply_one(tampered, state('a\n'), engine, {}), 'conflict')
    applied = {**one, 'exactBase': False}
    reversed_findings = c.apply_one(applied, state('b\n'), engine, {})
    test('already-applied forward delta must not auto-reverse', reversed_findings, 'conflict')
    assert any('auto-reversed' in finding.get('reason', '') for finding in reversed_findings)
    escaped = copy.deepcopy(one); escaped['diff'] = escaped['diff'].replace('a/sample.md', 'a/../escape.md')
    test('second path cannot escape the named file', c.apply_one(escaped, state('a\n'), engine, {}), 'conflict')

    # W25 regression: plans evidence changed/deleted after pin. No real record
    # is mutated. Both cases exercise the real scanner with pinned Git replies.
    spec = importlib.util.spec_from_file_location('control_g9', c.PHASE / 'g9/check_phase9_decisions.py')
    g9 = importlib.util.module_from_spec(spec); spec.loader.exec_module(g9)
    with tempfile.TemporaryDirectory(prefix='fchain-record-control-', dir='/tmp/fgos-work') as temporary:
        root = Path(temporary); path = 'plans/example.md'; target = root / path
        target.parent.mkdir(parents=True); target.write_text('later record no longer mentions the operand\n')
        frozen = (g9.GATEWAY + '\n').encode()
        def git(*args):
            if args[0] == 'ls-tree':
                return b'100644 blob ' + b'0' * 40 + b'\tplans/example.md\0'
            if args[0] == 'diff':
                return b''
            raise AssertionError(args)
        for label in ('edited', 'deleted'):
            if label == 'deleted':
                target.unlink()
            g9.scan_gateway.cache_clear()
            with patch.object(g9, 'ROOT', root), patch.object(g9, 'git', side_effect=git), patch.object(g9, 'blob', return_value=frozen):
                scan = g9.scan_gateway('frozen')
                assert scan[path]['sha256'] == g9.digest(frozen) and scan[path]['lines'] == [1]
            results.append(dict(case='plans evidence ' + label + ' after pin still scans frozen bytes', passed=True))

        path = 'docs/example.md'; target = root / path
        target.parent.mkdir(parents=True); target.write_text('unrelated current correction\n')
        def drift_git(*args):
            if args[0] == 'ls-tree':
                return b'100644 blob ' + b'0' * 40 + b'\tdocs/example.md\0'
            if args[0] == 'diff':
                return (path + '\n').encode()
            raise AssertionError(args)
        for label, old, current, accepted in [
            ('non-reader repair', b'old non-reader\n', 'new non-reader\n', True),
            ('new gateway occurrence', b'old non-reader\n', g9.GATEWAY + '\n', False),
            ('removed gateway occurrence', frozen, 'new non-reader\n', False),
            ('changed gateway reader body', frozen, g9.GATEWAY + '\nextra\n', False),
        ]:
            target.write_text(current); g9.scan_gateway.cache_clear()
            with patch.object(g9, 'ROOT', root), patch.object(g9, 'git', side_effect=drift_git), patch.object(g9, 'blob', return_value=old):
                try:
                    scan = g9.scan_gateway('frozen')
                    assert accepted and scan == {}, label
                except ValueError:
                    assert not accepted, label
            results.append(dict(case='gateway scan authenticates ' + label, passed=True))
    output = dict(exit=0, controls=results, count=len(results), reuse='Real apply_one with compose.apply_diff; real G9 scan_gateway with immutable Git fixture replies.')
    (c.HERE / 'controls.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(exit=0, controls=len(results))))


if __name__ == '__main__':
    main()
