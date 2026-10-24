#!/usr/bin/env python3
"""Reproduce the bounded gloss repair and existing composition proofs in scratch.

Run with python3 -B from repository root: --prepare once, then --verify.
Reuses the published W9 replay, resolver, extractors and independent verifier;
only scratch/output locations and the current correction metadata are adapted.
No live docs, product code, generated skills or baselines are written.
"""
import argparse
import atexit
import difflib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
TMP = Path('/tmp/fgos-work')
TMP.mkdir(parents=True, exist_ok=True)
_workspace = tempfile.TemporaryDirectory(prefix='composition-rework-', dir=TMP)
atexit.register(_workspace.cleanup)
TMP = Path(_workspace.name)
OLD_TMP = '/tmp/fgos-work/w9-comp-rework'


def load(path):
    return json.loads(path.read_text())


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def recipes():
    TMP.mkdir(parents=True, exist_ok=True)
    scripts = load(HERE / 'w9-replay-recipes.json')['scripts']
    adapted = {}
    for name, source in scripts.items():
        source = source.replace(OLD_TMP, str(TMP))
        if name == 'verify.py':
            for output in ['citation-before-f.json', 'chain-verification.json', 'citation-verification.json',
                           'gap05-verification.json', 'unresolved-bindings.json', 'action-verification.json']:
                source = source.replace("/'w9-" + output, "/'w10-" + output)
            source = source.replace('correctedWitnessIndices=[3,9,15,33,86,87,96],correctedSpecs=5',
                                    'correctedWitnessIndices=[16],correctedSpecs=1')
        (TMP / name).write_text(source)
        adapted[name] = source
    save(HERE / 'w10-replay-recipes.json', {
        'scratchOnly': str(TMP), 'scripts': adapted,
        'reproduction': ['python3 -B ' + str(HERE.relative_to(ROOT) / 'w10-rework.py') + ' --verify'],
        'adaptations': ['Scratch root relocated; no extraction or resolver logic changed.',
                        'Verification outputs use w10-* names; gloss correction metadata is witness 16 / one spec.',
                        'Overlay summary inputs are the unchanged W9 published accounting fields.'],
        'reuse': 'Published W9 exact chain replay, independent replay, shared ledgerfix/bindings.py and immutable extractors.'})
    spec = importlib.util.spec_from_file_location('w10_composition_replay', TMP / 'rework.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def prepare(replay):
    packet = load(HERE / 'patch-specs.json')
    tree = replay.export('prepare-tree')
    proof, before, after = replay.replay(tree, packet)
    path = 'docs/platform/event-store/spec.md'
    witnesses = load(HERE / 'w8-citation-glosses.json')
    witness = witnesses['witnesses'][16]
    assert witness['file'] == path and witness['line'] == 1138
    old = witness['after']
    new = old.replace('(plan porting uses ', '(in the plan, porting uses ')
    assert old != new and after[path].count(old) == 1
    assert before[path].splitlines()[1137] == witness['before']
    revised = after[path].replace(old, new)
    spec = next(s for s in packet['patches'] if s['id'] == 'w8:gloss:' + path)
    assert replay.sha(before[path]) == spec['beforeSha256']
    assert replay.sha(after[path]) == spec['expectedAfterSha256']
    spec['diff'] = ''.join(difflib.unified_diff(before[path].splitlines(True), revised.splitlines(True),
                                              fromfile='a/' + path, tofile='b/' + path))
    spec['rollbackDiff'] = ''.join(difflib.unified_diff(revised.splitlines(True), before[path].splitlines(True),
                                                      fromfile='a/' + path, tofile='b/' + path))
    spec['expectedAfterSha256'] = replay.sha(revised)
    witness['after'] = new
    save(HERE / 'patch-specs.json', packet)
    save(HERE / 'w8-citation-glosses.json', witnesses)
    save(HERE / 'w10-gloss-audit.json', {
        'witnessesRead': list(range(len(witnesses['witnesses']))),
        'review': 'Read all 104 after-lines for doubled words, dangling articles and removal-induced broken prose. No additional such fault found; grammatical redundancy is not expanded into polish.',
        'fixes': [{'index': 16, 'path': path, 'line': 1138, 'before': old, 'after': new}],
        'historicalChainReplayBeforeRepair': proof,
        'claimLimit': 'Author prose review; all witness locators/bytes are independently checked by the replay.'})
    save(HERE / 'w10-prepare-commands.json', replay.commands)
    print(json.dumps({'fixedWitnesses': [16], 'auditedWitnesses': len(witnesses['witnesses'])}))


def verify(replay):
    # These are immutable accounting inputs from the already reviewed overlay
    # change, not a new claim. The reused verifier checks them against real rows.
    prior = load(HERE / 'w9-gap05-verification.json')
    keys = ['sourceBindingAssertions', 'effectiveBindingRefreshAssertions', 'effectiveUnitCarryAssertions',
            'distinctTerminalBindings', 'bindingRefreshTerminalBindings', 'unitCarryTerminalBindings',
            'duplicateOriginAssertions', 'operativeOverlays', 'headingCurrentRows', 'headingExcludedLookupRows',
            'currentRowsAdded', 'ambiguousSupersessions', 'overlayHashesVerified', 'sourceRowsVerified']
    save(TMP / 'overlay-summary.json', {k: prior[k] for k in keys})
    # A fresh verifier log; authoring/preparation commands are retained separately.
    save(TMP / 'commands.json', [])
    cp = subprocess.run(['python3', '-B', str(TMP / 'verify.py')], cwd=ROOT, capture_output=True)
    save(HERE / 'w10-verify-command.json', {'argv': ['python3', '-B', str(TMP / 'verify.py')],
                                          'exit': cp.returncode, 'stdout': cp.stdout.decode(),
                                          'stderr': cp.stderr.decode()})
    save(HERE / 'w10-commands.json', load(TMP / 'commands.json'))
    assert cp.returncode == 0, (cp.stdout.decode(), cp.stderr.decode())
    cp = subprocess.run(['python3', '-B', str(TMP / 'independent-replay.py')], cwd=ROOT, capture_output=True)
    save(HERE / 'w10-independent-command.json', {'argv': ['python3', '-B', str(TMP / 'independent-replay.py')],
                                               'exit': cp.returncode, 'stderr': cp.stderr.decode()})
    assert cp.returncode == 0, cp.stderr.decode()
    save(HERE / 'w10-independent-verification.json', json.loads(cp.stdout))
    print(json.dumps({'compositionVerifyExit': 0, 'independentReplayExit': 0,
                      'citation': load(HERE / 'w10-citation-verification.json')}, indent=2))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', action='store_true')
    mode.add_argument('--verify', action='store_true')
    args = ap.parse_args()
    replay = recipes()
    if args.prepare:
        prepare(replay)
    else:
        verify(replay)


if __name__ == '__main__':
    main()
