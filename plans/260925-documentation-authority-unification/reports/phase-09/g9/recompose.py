#!/usr/bin/env python3
"""Consolidate selected historical chains onto --pin; never apply to source.

Reuse the existing Step 7 authored-hunk parser/exact locator. Source drift is
not resolved by fuzzy patching: locate exact authored edits first, then create
and replay a new complete-file-guarded patch with fuzz=0. Ambiguity fails closed.
"""
import argparse
from contextlib import contextmanager
import difflib
import importlib.util
import json
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
TMP = Path('/tmp/fgos-work')


@contextmanager
def workspace(prefix):
    """Each call owns one unique directory; never remove a shared parent."""
    TMP.mkdir(parents=True, exist_ok=True)
    name = tempfile.mkdtemp(dir=TMP, prefix=prefix)
    try:
        yield name
    finally:
        shutil.rmtree(name)


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


sweep = module('g9_sweep', HERE / 'sweep.py')
step7 = module('step7_hunks', sweep.P8 / 'step-07-assemble.py')


def relocate(before, spec, commands):
    if sweep.sha(before) == spec['beforeSha256']:
        with workspace('historical-') as name:
            target = Path(name) / spec['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(before.encode())
            if spec['diff']:
                cp = subprocess.run(['patch', '--batch', '--fuzz=0', '--reject-file=-', '-p1'],
                                    input=spec['diff'], text=True, cwd=name, capture_output=True)
                commands.append({'argv': ['patch', '--batch', '--fuzz=0', '--reject-file=-', '-p1'],
                                 'cwd': str(TMP) + ' (disposable historical subdirectory)',
                                 'path': spec['path'], 'direction': 'historical-step-forward',
                                 'exit': cp.returncode, 'stdout': cp.stdout, 'stderr': cp.stderr})
                if cp.returncode:
                    raise ValueError(cp.stdout + cp.stderr)
            after = target.read_text() if target.exists() else ''
            if sweep.sha(after) != spec['expectedAfterSha256']:
                raise ValueError('historical after hash mismatch')
            return after, [{'resolution': 'exact-whole-file-historical-preimage'}]
    edits = []
    witnesses = []
    for old, new, prefix, suffix, header in step7.hunk_edits(spec['diff']):
        try:
            a, b, text = step7.locate_edit(before, old, new, prefix, suffix)
            edits.append((a, b, text))
            state = 'exact-authored-edit'
        except ValueError:
            resolution_file = HERE / 'reading-map-resolution.json'
            resolutions = sweep.load(resolution_file) if resolution_file.exists() else {}
            resolution = next((r for r in resolutions.get('rows', [])
                               if spec['path'] == resolutions['path'] and
                               r['authoredOldSha256'] == sweep.sha(old) and
                               r['authoredNewSha256'] == sweep.sha(new)), None)
            if resolution:
                for edit in resolution['edits']:
                    a, b, text = step7.locate_edit(before, edit['before'], edit['after'], '', '')
                    if sweep.sha(edit['before']) != edit['beforeSha256'] or sweep.sha(text) != edit['afterSha256']:
                        raise ValueError('authored resolution digest mismatch')
                    edits.append((a, b, text))
                    witnesses.append({'oldSha256': sweep.sha(old), 'newSha256': sweep.sha(new),
                                      'startLine': before[:a].count('\n') + 1,
                                      'endLine': before[:b].count('\n') + 1,
                                      'resolution': 'reading-map-resolution.json; current prose, original path-only edits'})
                continue
            # Already-landed edits are admitted only with a complete exact
            # postimage context; a matching bare path is insufficient.
            needle = prefix + new + suffix
            if needle and before.count(needle) == 1:
                a = before.index(needle) + len(prefix)
                b = a + len(new)
                state = 'complete-postimage-already-present'
            else:
                raise
        witnesses.append({'oldSha256': sweep.sha(old), 'newSha256': sweep.sha(new),
                          'startLine': before[:a].count('\n') + 1,
                          'endLine': before[:b].count('\n') + 1, 'resolution': state})
    edits = sorted(set(edits))
    for l, r in zip(edits, edits[1:]):
        if r[0] < l[1] or r[0] == l[0]:
            raise ValueError('overlapping authored edits')
    after = before
    for a, b, value in reversed(edits):
        after = after[:a] + value + after[b:]
    return after, witnesses


def replay(path, before, after, forward, rollback, commands, creation=False):
    with workspace('replay-') as name:
        root = Path(name)
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        # Creation proof starts with an empty virtual preimage and also carries
        # an explicit requiresAbsent tree guard. No source-worktree file exists.
        target.write_bytes(before.encode())
        for diff, expected, guard, direction in [(forward, after, sweep.sha(before), 'forward'),
                                                  (rollback, before, sweep.sha(after), 'rollback')]:
            if sweep.sha(target.read_bytes()) != guard:
                raise ValueError('whole-file guard mismatch before ' + direction)
            if diff:
                cp = subprocess.run(['patch', '--batch', '--fuzz=0', '--reject-file=-', '-p1'],
                                    input=diff, text=True, cwd=root, capture_output=True)
                commands.append({'argv': ['patch', '--batch', '--fuzz=0', '--reject-file=-', '-p1'],
                                 'cwd': str(TMP) + ' (disposable replay subdirectory)',
                                 'path': path, 'direction': direction, 'exit': cp.returncode,
                                 'stdout': cp.stdout, 'stderr': cp.stderr})
                if cp.returncode:
                    raise ValueError(cp.stdout + cp.stderr)
            # patch may remove a zero-length creation during the inverse.
            data = target.read_bytes() if target.exists() else b''
            if data != expected.encode():
                raise ValueError('byte-exact replay mismatch in ' + direction)
    return {'command': 'patch --batch --fuzz=0 --reject-file=- -p1',
            'forwardExit': 0, 'rollbackExit': 0, 'exactBytes': True,
            'beforeEveryInvocationHashGuard': True, 'creationAbsenceGuard': creation}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin', default='HEAD')
    args = ap.parse_args()
    pin = sweep.git('rev-parse', args.pin + '^{commit}').decode().strip()
    output, problems, commands, drift = [], [], [], []
    for path, chain in sorted(sweep.spec_chains().items()):
        data = sweep.blob(pin, path)
        creation = chain[0].get('requiresAbsent', False)
        if data is None and not creation:
            problems.append({'path': path, 'reason': 'file absent; no requiresAbsent creation contract'})
            continue
        if data is not None and creation:
            problems.append({'path': path, 'reason': 'creation requires absent path but file exists'})
            continue
        before = (data or b'').decode()
        current = before
        history = []
        try:
            for spec in chain:
                if 'diff' not in spec:
                    raise ValueError('selected spec has no diff')
                if sweep.sha(current) != spec['beforeSha256']:
                    drift.append({'path': path, 'specId': spec.get('id', spec.get('patchSpecId')),
                                  'historicalBeforeSha256': spec['beforeSha256'],
                                  'currentBeforeSha256': sweep.sha(current)})
                current, edits = relocate(current, spec, commands)
                history.append({'specId': spec.get('id', spec.get('patchSpecId')),
                                'origin': spec['origin'], 'beforeSha256': spec['beforeSha256'],
                                'expectedAfterSha256': spec['expectedAfterSha256'],
                                'diffSha256': sweep.sha(spec['diff']),
                                'predecessor': spec.get('predecessor'), 'replaces': spec.get('replaces'),
                                'currentBeforeSha256': sweep.sha(before if not history else prior_after),
                                'currentAfterSha256': sweep.sha(current), 'edits': edits})
                prior_after = current
            after = current
            forward = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                                  fromfile='a/' + path, tofile='b/' + path))
            rollback = ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True),
                                                   fromfile='a/' + path, tofile='b/' + path))
            proof = replay(path, before, after, forward, rollback, commands, creation)
            output.append({'id': 'g9:' + path, 'path': path, 'sourceCommit': pin,
                           'beforeSha256': sweep.sha(before), 'expectedAfterSha256': sweep.sha(after),
                           'diff': forward, 'rollbackDiff': rollback, 'roundtrip': proof,
                           'requiresAbsent': creation,
                           'evidenceOnly': any(s.get('evidenceOnly') for s in chain),
                           'conditionalAtFinalPin': any(s.get('id') in sweep.load(HERE.parent / 'composition/patch-specs.json').get('finalPinFSpecIds', []) for s in chain),
                           'predecessorChain': history, 'independentAcceptance': False})
        except ValueError as e:
            problems.append({'path': path, 'specId': spec.get('id', spec.get('patchSpecId')),
                             'reason': str(e), 'completedChain': history})
    packet = {'sourceCommit': pin, 'recordsOnly': True, 'appliedToWorkspace': False,
              'independentAcceptance': False,
              'selectionRule': 'One G9 current-byte body per selected path; historical chains retained as provenance, not executable alternatives. Conditional bodies still require final pin/lease; generator bodies remain evidence only.',
              'specs': output, 'historicalDrift': drift, 'unresolved': problems}
    (HERE / 'recomposed.json').write_text(json.dumps(packet, ensure_ascii=False, indent=2) + '\n')
    (HERE / 'patch-commands.json').write_text(json.dumps(commands, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'files': len(output), 'driftedChainInputs': len(drift), 'problems': problems,
                      'patchInvocations': len(commands)}, ensure_ascii=False, indent=2))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
