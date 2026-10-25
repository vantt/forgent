#!/usr/bin/env python3
"""Reproduce records proofs; relocate only output sinks and tempfile roots."""
import sys
sys.dont_write_bytecode = True
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
P9 = HERE.parent
ROOT = HERE.parents[4]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def save(name, data):
    (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def run(argv):
    cp = subprocess.run(list(map(str, argv)), cwd=ROOT, capture_output=True, text=True)
    return dict(argv=list(map(str, argv)), exit=cp.returncode, stdout=cp.stdout, stderr=cp.stderr)


def census():
    source = P9 / 'census-join/join.py'
    pin = json.loads((source.parent / 'settlement-decisions.json').read_text())['sourceCommit']
    # The original main, original inputs and every assertion run unchanged.
    # Only dump(path,data), the script's sole write sink, is relocated. This
    # avoids its historical --out hardcoding without relaxing an input check.
    adapter = '''import runpy,sys,pathlib
script,output,pin=sys.argv[1:]
ns=runpy.run_path(script)
main=ns['main']; original=ns['dump']; target=pathlib.Path(output)
main.__globals__['dump']=lambda path,data: original(target/path.name,data)
sys.argv=[script,'--pin',pin]
main()
'''
    with tempfile.TemporaryDirectory(prefix='fchain-census-', dir='/tmp/fgos-work') as name:
        root = Path(name); snapshots = []; commands = []
        for number in (1, 2):
            output = root / str(number); output.mkdir()
            command = run(['python3', '-B', '-c', adapter, source, output, pin])
            commands.append(command)
            assert command['exit'] == 0, command
            snapshots.append({p.name: p.read_bytes() for p in output.glob('*.json')})
        assert snapshots[0] == snapshots[1], 'census replay is not deterministic'
        result = dict(exit=0, pin=pin, sourceSha256=sha(source.read_bytes()), adapter=adapter,
            commands=commands, identicalReplays=True,
            outputs={file: dict(sha256=sha(raw), bytes=len(raw)) for file, raw in snapshots[0].items()},
            counts=json.loads(snapshots[0]['join.json'])['counts'],
            relocation='Only dump output sink redirected to auto-cleaned tempfile; original input checks, main and citations --check unchanged.')
        save('census-replay.json', result)
        print(json.dumps({k:v for k,v in result.items() if k not in {'commands', 'adapter'}}))


def roots():
    spec = importlib.util.spec_from_file_location('proof_shard', P9 / 'preserve-premise/park-judgments/check_shard.py')
    shard = importlib.util.module_from_spec(spec); spec.loader.exec_module(shard)
    engine = shard.load_replayer()
    states, findings, inventory = shard.replay_chain(engine.PIN, engine)
    assert not findings
    approved = json.loads((P9.parent / 'phase-08/step-07-composed-patches.json').read_text())['patches']
    selected = json.loads((P9 / 'composition/patch-specs.json').read_text())['patches']
    byid = {p['id']: p for p in selected}
    inventory_by_file = {r['file']: r for r in inventory['predecessors']}
    proofs = []
    for prior in approved:
        file = prior['path']; selection = inventory_by_file[file]
        patch = prior if selection['selected'] else byid[selection['replacedBy']]
        before = shard.blob(engine.PIN, file).decode()
        assert shard.sha(before) == patch['beforeSha256']
        after = engine.apply_diff(file, before, patch['diff'])
        assert shard.sha(after) == patch['expectedAfterSha256']
        result = engine.step7.patch_roundtrip(file, before, after, patch['diff'], patch['rollbackDiff'])
        proofs.append(dict(file=file, original=prior['patchSpecId'], selected=patch.get('id', patch.get('patchSpecId')), **result))
    assert len(proofs) == 423
    save('root-replay.json', dict(exit=0, pin=engine.PIN, roots=len(proofs), files=proofs,
        reuse='Unmodified phase-08/step-07-assemble.py patch_roundtrip; selection by owning premise replay_chain.'))
    print(json.dumps(dict(exit=0, roots=len(proofs))))


def composition():
    path = P9 / 'composition/w13-replay-recipes.json'
    recipe = json.loads(path.read_text())['scripts']['independent-replay.py']
    old = "TMP=Path('/tmp/fgos-work/g9-polish-107kxq_h')"
    assert recipe.count(old) == 1
    with tempfile.TemporaryDirectory(prefix='fchain-independent-', dir='/tmp/fgos-work') as name:
        root = Path(name); script = root / 'independent-replay.py'
        adapted = recipe.replace(old, 'TMP=Path(' + repr(name) + ')')
        script.write_text(adapted)
        command = run(['python3', '-B', script])
        assert command['exit'] == 0, command
        proof = json.loads(command['stdout'])
        assert proof['exit'] == 0
        save('composition-replay.json', dict(exit=0, recipe=str(path.relative_to(ROOT)),
            recipeSha256=sha(recipe.encode()), adaptedSha256=sha(adapted.encode()),
            adaptation='Only the hardcoded scratch root replaced with an auto-cleaned tempfile. Replay logic and all assertions unchanged.',
            command=command, proof=proof))
        print(json.dumps({k:v for k,v in proof.items() if k not in {'commands','filesVerified','edges','generatorEvidence'}}))


def all_proofs():
    commands = []
    for argv in [
        ['python3', '-B', HERE / 'check.py', '--pin', 'HEAD'],
        ['python3', '-B', HERE / 'controls.py'],
        ['python3', '-B', P9 / 'preserve-premise/park-judgments/check_shard_controls.py'],
        ['python3', '-B', P9 / 'preserve-premise/park-judgments/check_shard.py', '--all'],
        ['python3', '-B', P9 / 'g9/check_phase9_decisions.py'],
        ['python3', '-B', P9 / 'g9/check_phase9_decisions.py', '--self-test'],
        ['node', P9 / 'carries/verify-carries.mjs'],
        ['python3', '-B', Path(__file__), '--census'],
        ['python3', '-B', Path(__file__), '--roots'],
        ['python3', '-B', Path(__file__), '--composition'],
        ['python3', '-B', HERE / 'audit.py'],
    ]:
        command = run(argv); commands.append(command)
        print(json.dumps(dict(command=command['argv'], exit=command['exit'])), flush=True)
        save('commands.json', dict(exit=int(any(c['exit'] for c in commands)), commands=commands))
    return int(any(c['exit'] for c in commands))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    for name in ('all', 'census', 'roots', 'composition'):
        group.add_argument('--' + name, action='store_true')
    args = parser.parse_args()
    if args.all:
        return all_proofs()
    if args.census:
        census()
    elif args.roots:
        roots()
    else:
        composition()
    return 0


if __name__ == '__main__':
    sys.exit(main())
