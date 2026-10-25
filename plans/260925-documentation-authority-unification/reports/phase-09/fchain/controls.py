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
    non_exact = {**one, 'exactBase': False}
    command_start = len(engine.COMMANDS)
    test('zero-fuzz conflict on actual patch boundary',
         c.apply_one(non_exact, state('not-a\n'), engine, {}), 'conflict')
    assert len(engine.COMMANDS) == command_start + 1
    assert engine.COMMANDS[-1]['exit'] != 0 and '--fuzz=0' in engine.COMMANDS[-1]['argv']
    offset = state('prefix\na\n')
    assert not c.apply_one(non_exact, offset, engine, {}) and offset['text'] == 'prefix\nb\n'
    results.append(dict(case='non-exact authoring hash permits a pure line offset, not fuzz', passed=True))
    # The exact base-chain edge remains usable after a disjoint residual.
    base = state('b\nx\n')
    base['labels'][0] = {'chain:sample.md'}
    base['trace'] = [dict(chainEntryId='base-step'), dict(id='disjoint-residual')]
    final = entry('final', 'b\nx\n', 'c\nx\n')
    final['composesChain'] = ['base-step']
    assert not c.apply_one(final, base, engine, {})
    results.append(dict(case='exact named base chain co-composes after disjoint residuals', passed=True))
    wrong = {**final, 'composesChain': ['other-step']}
    wrong_state = state('b\nx\n'); wrong_state['trace'] = [dict(chainEntryId='base-step')]
    test('co-composition rejects the wrong base-chain edge', c.apply_one(wrong, wrong_state, engine, {}), 'conflict')
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

    # One owning scanner proof: literals stay literal, clickable destinations
    # retain coordinates, reference definitions count only when used.
    links = c.module('control_links', c.HERE / 'links.py')
    file = 'docs/platform/control.md'; old = '../specs/runner.md'
    sample = ('```md\n[x](' + old + ')\n```\n~~~\n[x](' + old + ')\n~~~\n'
        + '`[x](' + old + ')`\n`` `[x](' + old + ')` ``\n'
        + '<!-- [x](' + old + ') -->\n'
        + '[label `code`](' + old + ' "title")\n'
        + '[ref][used]\n[used]: ' + old + '\n[unused]: ' + old + '\n'
        + '[escaped](../specs/%72unner.md#section)\n'
        + '[angle](<' + old + '>)\n![image](' + old + ')\n'
        + '<a href="' + old + '">reader</a>\n'
        + '[external](https://example.com/docs/specs/runner.md)\n'
        + '\\[not-a-link](' + old + ')\n')
    hits = list(links.into_move_set(file, sample, {'docs/specs/runner.md'}))
    assert len(hits) == 6, hits
    assert len(list(links.clickable('[x](<' + old + '>)'))) == 1
    assert not list(links.clickable('<a id="real-anchor"></a>'))
    related_sample = '# Header\n\n```txt\nRelated:\n- docs/first.md\n\n- docs/not-related.md\n```\n'
    assert [link['target'] for link in links.related(related_sample)] == ['docs/first.md']
    assert all(sample[h['targetStart']:h['targetEnd']] == h['target'] for h in hits)
    results.append(dict(case='clickable links exclude code, comments, escapes and unused definitions', passed=True))

    # Real compose() regression: both reader/manifest edges and the final
    # platform scan are checked, not a synthetic list of finding kinds.
    pin = c.subprocess.check_output(['git', '--no-optional-locks', 'rev-parse', 'HEAD'], cwd=c.ROOT, text=True).strip()
    record_path = c.HERE / 'link-retargets.json'
    record = copy.deepcopy(c.load(record_path))
    injected_file = 'docs/platform/injected-link-control.md'
    injected_text = '[new reader](../specs/runner.md)\n'
    injected_patch = entry('injected', '', injected_text)
    injected_patch['diff'] = injected_patch['diff'].replace('sample.md', injected_file)
    injected_patch.update(path=injected_file, rowIds=['injected-link'], forwardDiff=injected_patch.pop('diff'))
    record['patches'].append(injected_patch)
    record['rows'].append(dict(id='injected-link', file=injected_file, ruling='L13-26'))
    anchor_file = 'docs/platform/injected-anchor-control.md'
    anchor_text = ('# Valid — heading\n\n```txt\nRelated:\n- docs/platform/not-present.md\n'
        '- docs/platform/injected-anchor-control.md#valid-heading\n'
        '- docs/platform/injected-anchor-control.md#missing-related-anchor\n'
        '- packages/durable-file/rust\n```\n'
        '[valid](#valid-heading) [angle](<#valid-heading>)\n'
        '[broken](#injected-broken-anchor)\n'
        '[reference][used]\n[used]: #valid-heading\n'
        '<a href="#valid-heading">valid</a>\n'
        '`[literal](#missing)`\n~~~text\n[literal](#missing)\n~~~\n')
    anchor_patch = entry('anchor-injected', '', anchor_text)
    anchor_patch['diff'] = anchor_patch['diff'].replace('sample.md', anchor_file)
    anchor_patch.update(path=anchor_file, rowIds=['injected-anchor'], forwardDiff=anchor_patch.pop('diff'))
    record['patches'].append(anchor_patch)
    record['rows'].append(dict(id='injected-anchor', file=anchor_file, ruling='L13-28'))
    original_load = c.load
    with patch.object(c, 'load', side_effect=lambda path: record if path == record_path else original_load(path)):
        report, _ = c.compose(pin)
    assert all(f['kind'] == 'linkGuard' for f in report['findings']), report['findings']
    test('injected clickable link into a moved path fails the F door', report['findings'], 'linkGuard')
    assert any(f['kind'] == 'linkGuard' and f['file'] == injected_file and f['reason'] == 'moved-target' for f in report['findings'])
    anchor_findings = [f for f in report['findings'] if f['kind'] == 'linkGuard' and f['file'] == anchor_file]
    assert {(f['target'], f['reason']) for f in anchor_findings} == {
        ('#injected-broken-anchor', 'missing-anchor'), ('docs/platform/not-present.md', 'missing-file'),
        ('docs/platform/injected-anchor-control.md#missing-related-anchor', 'missing-anchor')}, anchor_findings
    test('injected broken anchor fails while extracted headings resolve and code stays literal',
         [f for f in anchor_findings if f['reason'] == 'missing-anchor'], 'linkGuard')
    results.append(dict(case='Related metadata is checked even in its txt header fence', passed=True))
    assert report['exit'] == 1

    # Each new regression has one isolated cause and exactly one finding. The
    # real composed source is edited by F, so an overlay must not resurrect it.
    for name, text, reason in [
        ('clickable link into an edited move-set source', '[gov](../doc-governance.md)\n', 'moved-target'),
        ('Related entry into an edited move-set source', '# Probe\n\n```txt\nRelated:\n- docs/doc-governance.md\n```\n', 'moved-target'),
        ('old filename label on an earlier retarget', '[doc-governance.md](governance.md)\n[governance.md](governance.md)\n[documentation rules](governance.md)\n', 'stale-label'),
        ('old filename reference label on an earlier retarget', '[documentation rules][gov] [doc-governance.md][gov]\n[gov]: governance.md\n[unused]: ../doc-governance.md\n', 'stale-label'),
    ]:
        probe_file = 'docs/platform/isolated-link-control.md'
        probe = entry('isolated-link', '', text)
        probe['diff'] = probe['diff'].replace('sample.md', probe_file)
        probe.update(path=probe_file, rowIds=['isolated-link'], forwardDiff=probe.pop('diff'))
        isolated = copy.deepcopy(original_load(record_path))
        isolated['patches'].append(probe)
        isolated['rows'].append(dict(id='isolated-link', file=probe_file, ruling='L13-28'))
        with patch.object(c, 'load', side_effect=lambda path: isolated if path == record_path else original_load(path)):
            rejected, states = c.compose(pin)
        assert rejected['exit'] == 1 and len(rejected['findings']) == 1, (name, rejected['findings'])
        finding = rejected['findings'][0]
        assert finding['kind'] == 'linkGuard' and finding['file'] == probe_file and finding['reason'] == reason, finding
        assert 'docs/doc-governance.md' in states, 'probe must exercise an edited move-set source'
        test(name, rejected['findings'], 'linkGuard')
    # Same filename at the new location is not stale; mixed labels retain their
    # descriptive/section text when only the path operand changes.
    assert not links.stale_label('workflow/spec.md', '../specs/workflow.md', 'workflow/spec.md')
    assert not links.stale_label('spec.md', '../old/spec.md', '../new/spec.md')
    assert links.stale_label('workflow.md §14', '../specs/workflow.md', 'workflow/spec.md#section')
    assert links.stale_label('../old/spec.md', '../old/spec.md', '../new/spec.md')
    assert not links.stale_label('runtime workflow overview', '../specs/workflow.md', 'workflow/spec.md')

    additions = copy.deepcopy(c.load(c.PHASE / 'g9/f-composition-additions.json'))
    additions['patches'][0]['composedBy'] = ['bogus-record-edge']
    disagreement, _ = c.compose(pin, additions=additions)
    assert disagreement['exit'] == 1
    assert any(f.get('reason') == 'record and manifest composedBy disagree' for f in disagreement['findings'])
    results.append(dict(case='record composedBy cannot silently override the manifest', passed=True))

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
