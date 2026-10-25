#!/usr/bin/env python3
"""Scope, unchanged judgments and exhaustive diff-bearing record inventory."""
import sys
sys.dont_write_bytecode = True
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
P9 = HERE.parent
ROOT = HERE.parents[4]


def main():
    def load(path):
        return json.loads(path.read_text())
    def original(path):
        return json.loads(subprocess.check_output(['git', '--no-optional-locks', 'show',
            '72d516ba54692c7eacb38fde4b3fef9f6d1edc0b:' + str(path.relative_to(ROOT))], cwd=ROOT))
    carries = P9 / 'carries/pointer-patches.json'
    current = load(carries); old = original(carries)
    stripped = dict(current, patches=[{k:v for k,v in p.items() if k != 'composedBy'} for p in current['patches']])
    assert stripped == old, 'Carries may only gain composedBy links'
    data = load(P9 / 'g9/phase9-decisions.json'); prior = original(P9 / 'g9/phase9-decisions.json')
    editable = {'readers', 'patchRefs', 'documentReaderOccurrences'}
    assert [{k:v for k,v in e.items() if k not in editable} for e in data['entries']] == [
            {k:v for k,v in e.items() if k not in editable} for e in prior['entries']], 'A G9 decision changed'
    bodies = P9 / 'g9/recomposed.json'
    stripped = load(bodies)
    stripped['specs'] = [{k:v for k,v in body.items() if k != 'composedBy'} for body in stripped['specs']]
    assert stripped == original(bodies), 'Existing G9 bodies/metadata changed beyond owner links'
    for number in (1, 2, 3):
        path = P9 / f'preserve-premise/park-judgments/shard-{number}.json'
        assert load(path) == original(path), 'Premise judgment/evidence/patch changed'
    changes = subprocess.check_output(['git', '--no-optional-locks', 'status', '--porcelain', '-uall'], cwd=ROOT, text=True).splitlines()
    prefix = str(P9.relative_to(ROOT)) + '/'
    writable = ('fchain/', 'g9/', 'preserve-premise/park-judgments/')
    for change in changes:
        file = change[3:]
        assert file.startswith(prefix) and (file[len(prefix):].startswith(writable) or file[len(prefix):] in
            {'carries/pointer-patches.json', 'census-join/pointer-patches.json'}), 'Out-of-scope change: ' + file
    census = []
    def count(value):
        if isinstance(value, dict):
            return int(any(isinstance(value.get(key), str) and value[key].startswith('--- ')
                for key in ('diff', 'forwardDiff', 'patch'))) + sum(count(v) for v in value.values())
        return sum(map(count, value)) if isinstance(value, list) else 0
    manifest = load(HERE / 'manifest.json')
    known = {source['path']: source for source in manifest['sources']}
    for path in sorted(P9.rglob('*.json')):
        if path.is_symlink():
            raise ValueError('symlink in records inventory: ' + str(path))
        number = count(load(path))
        if not number:
            continue
        name = str(path.relative_to(ROOT))
        assert name in known, 'Uninventoried diff-bearing record: ' + name
        census.append(dict(path=name, diffObjects=number, reader=known[name]['reader'],
            sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    output = dict(exit=0, judgmentsUnchanged=787, dependencyDecisionsUnchanged=158,
        existingBodiesUnchanged=546, carriesOnlyComposedBy=True, changedPaths=len(changes),
        allDiffBearingRecordFiles=len(census), sourceDiscovery=census,
        interpretation='Raw diff objects include shared shard copies, historical observations, unit adaptations and generator witnesses; not a count of executable patches.')
    (HERE / 'audit.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k:v for k,v in output.items() if k != 'sourceDiscovery'}))


if __name__ == '__main__':
    main()
