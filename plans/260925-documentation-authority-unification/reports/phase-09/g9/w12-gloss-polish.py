#!/usr/bin/env python3
"""Records-only gloss repair/replay. Run with python3 -B from the repo root.

Reuses W11's audit generator, exact chain locator, published composition
recipes and GNU patch proofs. Scratch is confined to w12-gloss and removed.
"""
import copy
import difflib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
COMP = HERE.parent / 'composition'
TMP = Path('/tmp/fgos-work/w12-gloss')
COMMANDS = []


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


r = module('w12_recompose', HERE / 'recompose.py')
f = module('w12_prior_followup', HERE / 'w11-followup.py')
sweep = r.sweep
load = sweep.load


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def run(argv, output=None, expected=0):
    cp = subprocess.run(list(map(str, argv)), cwd=ROOT, capture_output=True)
    record = {'argv': list(map(str, argv)), 'exit': cp.returncode,
              'stdoutSha256': sweep.sha(cp.stdout), 'stdoutBytes': len(cp.stdout),
              'stderr': cp.stderr.decode()}
    COMMANDS.append(record)
    save(HERE / 'w12-commands.json', COMMANDS)
    if output:
        output.write_bytes(cp.stdout)
    if cp.returncode != expected:
        raise ValueError((record, cp.stdout.decode()[-4000:]))
    return cp.stdout


def diff(path, before, after):
    return ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                        fromfile='a/' + path, tofile='b/' + path))


def repair(pin):
    witnesses = json.loads(run(['git', 'show', pin + ':' + str(
        (COMP / 'w8-citation-glosses.json').relative_to(ROOT))]))
    original = copy.deepcopy(witnesses)
    fixes = []

    def replace(index, old, new):
        witness = witnesses['witnesses'][index]
        # Idempotent authoring; already repaired records still replay below.
        if old not in witness['after']:
            assert new in witness['after'], (index, old)
            return
        assert witness['after'].count(old) == 1
        before = witness['after']
        witness['after'] = before.replace(old, new)
        fixes.append({'index': index, 'path': witness['file'], 'line': witness['line'],
                      'before': before, 'after': witness['after']})

    replace(2, '(section 16, the Stop-drain decision: only wake-enabled mail starts an idle turn and record layout)',
            '(section 16: the Stop-drain decision and the record layout; Stop-drain permits only wake-enabled mail to start an idle turn)')
    for index, old, new in [
        (35, '**the red-tests-first order (order)**', '**(1) Order**'),
        (36, '**the CAS-only sequence counter, the scp remote form (sequence counter and the scp form)**',
         '**(2), (3) Sequence counter and the scp form**'),
        (37, '**The worktree-add fsync question (fsync count of a worktree add)**', '**(4) Worktree-add fsync count**'),
        (37, '**The test-lane move-down boundary, the per-operation herdr command-count bar**',
         '**(5), (6) Test move-down and per-operation herdr command counts**'),
        (38, '**The WAL digest evidence decision (WAL digest)**', '**(7) WAL digest**'),
        (38, '**The census-gated legacy-drain decision (drains)**', '**(8) Drains**'),
        (39, '**the deferred repository-handle cache (parked)**', '**(9) Parked**')]:
        replace(index, old, new)
    for index in [47, 50, 59]:
        replace(index, '(nhật ký sự kiện là changeset niêm phong trên ref mỗi máy)',
                '(event log as sealed changesets on per-machine refs)')
    for index in [61, 62, 64]:
        import re
        old = witnesses['witnesses'][index]['after']
        new = re.sub(r'\bMục (\d+):', r'(\1)', old)
        if old != new:
            replace(index, old, new)
    replace(65, 'Bài học G-042 và G-155 của component Git đòi kiểm bẩn tới lúc huỷ nằm dưới một quyền sở hữu; the declared repo-lease and worktree-admin scope decision chỉ bọc `git worktree add` nên remove/relocate/prune là khe hở có tên.',
            'Bài học G-042 và G-155 của thành phần Git đòi việc kiểm tra cây làm việc bẩn kéo dài tới lúc huỷ phải nằm dưới một quyền sở hữu; ý (8) của đoạn main-door chỉ bọc `git worktree add` nên các thao tác xoá, di chuyển và dọn dẹp là những khe hở đã được chỉ ra.')
    replace(94, 'authority (D-ADR0072 (Seat Binding owns executor, model, effort, tier and account choice))',
            'authority — D-ADR0072 (Seat Binding quyết định executor, model, effort, tier và account)')

    packet = json.loads(run(['git', 'show', pin + ':' + str(
        (COMP / 'patch-specs.json').relative_to(ROOT))]))
    byid = {s['id']: s for s in packet['patches']}
    external = {s['patchSpecId']: s for s in load(sweep.P8 / 'step-07-composed-patches.json')['patches']}
    current, changes, commands = {}, [], []
    # Replay all selected composition steps, updating any successor guard too.
    for ident in packet['effectiveSpecIds'] + packet['finalPinFSpecIds']:
        spec = byid[ident]
        path = spec['path']
        old_spec = copy.deepcopy(spec)
        if path not in current:
            data = sweep.blob(pin, path)
            assert data is not None or spec.get('requiresAbsent'), path
            current[path] = (data or b'').decode()
            pred = spec.get('predecessor')
            if pred and pred['patchSpecId'] not in byid:
                ext = external[pred['patchSpecId']]
                assert sweep.sha(current[path]) == ext['beforeSha256'], path
                current[path], _ = r.relocate(current[path], ext, commands)
        before = current[path]
        after, _ = r.relocate(before, spec, commands)
        if ident.startswith('w8:gloss:'):
            for old, new in zip(original['witnesses'], witnesses['witnesses']):
                if old['file'] == path and old['after'] != new['after']:
                    assert after.count(old['after']) == 1, (path, old['line'])
                    after = after.replace(old['after'], new['after'])
        spec.update(beforeSha256=sweep.sha(before), expectedAfterSha256=sweep.sha(after),
                    diff=diff(path, before, after), rollbackDiff=diff(path, after, before))
        if spec.get('predecessor'):
            pred = spec['predecessor']
            parent = byid.get(pred['patchSpecId']) or external[pred['patchSpecId']]
            assert parent['expectedAfterSha256'] == spec['beforeSha256'], ident
            pred['expectedAfterSha256'] = parent['expectedAfterSha256']
        if spec != old_spec:
            changes.append({'specId': ident, 'path': path,
                            'oldBeforeSha256': old_spec['beforeSha256'],
                            'beforeSha256': spec['beforeSha256'],
                            'oldAfterSha256': old_spec['expectedAfterSha256'],
                            'afterSha256': spec['expectedAfterSha256']})
        current[path] = after
    save(COMP / 'patch-specs.json', packet)
    save(COMP / 'w8-citation-glosses.json', witnesses)
    save(COMP / 'w12-preparation.json', {'pin': pin, 'changes': changes, 'glossFixes': fixes,
                                       'commands': commands, 'independentAcceptance': False})
    audit_controls(original, witnesses, fixes, pin)


def audit_controls(original, witnesses, fixes, pin):
    captured = []
    original_save = f.save
    try:
        f.save = lambda path, value: captured.append(value)
        f.audit_glosses(original, [], pin)
        historical = captured[-1]
        expected = {35: ['1'], 36: ['2', '3'], 37: ['4', '5', '6'],
                    38: ['7', '8'], 39: ['9']}
        # Also works when re-run on repaired inputs: explicitly remove labels.
        stripped = copy.deepcopy(witnesses)
        import re
        for index in expected:
            stripped['witnesses'][index]['after'] = re.sub(r'\([1-9]\),? ?', '', stripped['witnesses'][index]['after'])
        f.audit_glosses(stripped, [], pin)
        lost = captured[-1]
        for index, labels in expected.items():
            row = lost['witnesses'][index]
            assert row['verticalList'] and row['lostListLabels'] == labels, row
            assert row['status'] == 'review-required'
        generic = []
        for kind, labels in [('numbered', ['1', '2']), ('lettered', ['A', 'B'])]:
            sample = {'witnesses': [{'file': kind, 'line': i + 1,
                       'before': label + '. Original item', 'after': 'Replacement item'}
                       for i, label in enumerate(labels)]}
            f.audit_glosses(sample, [], pin)
            failed = captured[-1]
            assert [row['lostListLabels'] for row in failed['witnesses']] == [[label] for label in labels]
            for row, label in zip(sample['witnesses'], labels):
                row['after'] = '(' + label + ') Replacement item'
            f.audit_glosses(sample, [], pin)
            assert not captured[-1]['reviewRequired']
            generic.append({'kind': kind, 'lostLabelsRejected': labels, 'restoredLabelsPass': True})
    finally:
        f.save = original_save
    f.audit_glosses(witnesses, fixes, pin)
    audit = load(COMP / 'w10-gloss-audit.json')
    assert len(audit['witnesses']) == 104 and not audit['reviewRequired'], audit['reviewRequired']
    save(COMP / 'w12-audit-controls.json', {'pin': pin, 'exit': 0,
         'historicalReviewRequired': historical['reviewRequired'],
         'verticalMissingLabelRows': [lost['witnesses'][i] for i in expected],
         'genericListControls': generic,
         'allWitnesses': len(audit['witnesses']), 'currentReviewRequired': audit['reviewRequired']})


def composition(pin):
    recipes = load(COMP / 'w11-replay-recipes.json')['scripts']
    adapted = {}
    for name, source in recipes.items():
        source = source.replace('/tmp/fgos-work/w11-g9', str(TMP))
        if name == 'verify.py':
            for filename in ['citation-before-f.json', 'chain-verification.json', 'citation-verification.json',
                             'gap05-verification.json', 'unresolved-bindings.json', 'action-verification.json']:
                source = source.replace("/'w11-" + filename, "/'w12-" + filename)
            source = source.replace('correctedWitnessIndices=[0,37,38,61,62,64],correctedSpecs=3',
                                    'correctedWitnessIndices=[2,35,36,37,38,39,47,50,59,61,62,64,65,94],correctedSpecs=4')
        (TMP / name).write_text(source)
        adapted[name] = source
    save(COMP / 'w12-replay-recipes.json', {'pin': pin, 'scripts': adapted,
         'reuse': 'W11 full-chain and independent replay, skill generation, citation scan, ledger resolver and immutable extractors; only scratch/output names and corrected witness metadata adapted.'})
    prior = load(COMP / 'w11-gap05-verification.json')
    keys = ['sourceBindingAssertions', 'effectiveBindingRefreshAssertions', 'effectiveUnitCarryAssertions',
            'distinctTerminalBindings', 'bindingRefreshTerminalBindings', 'unitCarryTerminalBindings',
            'duplicateOriginAssertions', 'operativeOverlays', 'headingCurrentRows', 'headingExcludedLookupRows',
            'currentRowsAdded', 'ambiguousSupersessions', 'overlayHashesVerified', 'sourceRowsVerified']
    save(TMP / 'overlay-summary.json', {k: prior[k] for k in keys})
    save(TMP / 'commands.json', [])
    run(['python3', '-B', TMP / 'verify.py'], COMP / 'w12-verify-summary.json')
    save(COMP / 'w12-commands.json', load(TMP / 'commands.json'))
    run(['python3', '-B', TMP / 'independent-replay.py'], COMP / 'w12-independent-verification.json')


def main():
    assert not TMP.exists(), 'Scratch must start absent; never delete another run\'s files'
    pin = run(['git', 'rev-parse', 'HEAD']).decode().strip()
    baseline = json.loads(run(['git', 'show', pin + ':' + str(
        (HERE / 'recomposed.json').relative_to(ROOT))]))
    TMP.mkdir(parents=True)
    try:
        repair(pin)
        composition(pin)
        run(['python3', '-B', HERE / 'recompose.py', '--pin', 'HEAD'], HERE / 'w12-recompose-summary.json')
        before = {s['path']: s for s in baseline['specs']}
        changed = []
        for spec in load(HERE / 'recomposed.json')['specs']:
            old = before[spec['path']]
            if any(spec[k] != old[k] for k in ['beforeSha256', 'expectedAfterSha256', 'diff', 'rollbackDiff']):
                changed.append({'path': spec['path'], 'oldAfterSha256': old['expectedAfterSha256'],
                                'afterSha256': spec['expectedAfterSha256'],
                                'preimageUnchanged': spec['beforeSha256'] == old['beforeSha256']})
        save(HERE / 'w12-recomposition-delta.json', {'pin': pin, 'changedBodies': changed,
             'unchangedBodyDiffs': len(before) - len(changed), 'totalBodies': len(before)})
    finally:
        if TMP.exists():
            shutil.rmtree(TMP)
    # Run the real checks with no parent scratch left by the reproduction.
    # Each patch tempfile and the lazily created empty parent must disappear.
    old_tmp = Path('/tmp/fgos-work/w11-g9')
    old_exists = old_tmp.exists()
    run(['python3', '-B', HERE / 'sweep.py', '--check', '--pin', 'HEAD'], HERE / 'sweep-check.json')
    assert not TMP.exists() and old_tmp.exists() == old_exists
    run(['python3', '-B', HERE / 'verify.py', '--pin', 'HEAD'], HERE / 'w12-verify-summary.json')
    assert not TMP.exists() and old_tmp.exists() == old_exists
    save(HERE / 'w12-tempfile-proof.json', {'pin': pin, 'exit': 0,
         'scratchAbsentBeforeChecks': True, 'scratchAbsentAfterSweep': True,
         'scratchAbsentAfterVerify': True, 'historicalScratchExistsUnchanged': old_exists,
         'importCreatesDirectory': False,
         'scope': 'Actual check/verify runs after scratch deletion; import-only proof is also recorded in final-audit.'})
    print(json.dumps({'pin': pin, 'status': 'pass', 'scratchRemoved': not TMP.exists()}, indent=2))


if __name__ == '__main__':
    main()
