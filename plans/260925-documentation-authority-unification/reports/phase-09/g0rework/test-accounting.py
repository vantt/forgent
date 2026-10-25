#!/usr/bin/env python3
"""Owning proof for exact rebind acceptance and refusal, using real witnesses.

The historical authoring assertions do not observe live drift accounting. These
controls call that single production predicate; no checkout bytes are changed.
Run from the repository root with python3 -B; extractors own disposable scratch.
"""
import copy
import json
import os
from pathlib import Path
import runpy
import shutil
import subprocess
import tempfile


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
    # The predicate controls above own exact-record acceptance. These boundary
    # controls uniquely prove both embedded readers refuse real unaccounted rows
    # through the Python check door, with all fixture mutations confined to /tmp.
    root = Path.cwd()
    plan = HERE.parents[2]
    docs = rebind['documents']()
    links = rebind['supersessions'](docs)
    direct = rebind['direct_rows'](docs)
    stale = next((f, p, r) for f, p, r in direct
                 if r.get('targetAnchor') and r.get('targetUnitDigest') and
                 rebind['effective'](f, p, r, docs, links)[:2] == (f, p) and
                 rebind['matches'](r, catalog.get(r['targetOwner'], {}).get('units', [])))
    group = next((f, p, r) for f, p, r in direct if r.get('successorGroup') and
                 rebind['effective'](f, p, r, docs, links)[:2] == (f, p))
    env = dict(os.environ, NODE_OPTIONS='--no-addons', PYTHONDONTWRITEBYTECODE='1')
    env.pop('CLAUDE_CODE_SESSION_ID', None)
    with tempfile.TemporaryDirectory(prefix='ownership-controls-', dir='/tmp/fgos-work') as name:
        for label, (file, pointer, row) in [('stale digest without successor', stale),
                                          ('one non-matching group member', group)]:
            fixture = Path(name) / ('stale' if row is stale[2] else 'group')
            fixture.mkdir()
            # All mutable inputs and the checker are copies. Unmodified source
            # modules and document bytes are read-only references, not fixtures.
            for folder in ('docs', 'scripts'):
                (fixture / folder).symlink_to(root / folder, target_is_directory=True)
            for folder in ('ledger/decisions', 'pilot/decisions'):
                shutil.copytree(plan / folder, fixture / plan / folder)
            for relative in [plan / 'reports/phase-09/rebind/rebind.py',
                             plan / 'reports/phase-09/ledgerfix/bindings.py',
                             plan / 'reports/phase-09/g0fix/extract-units.mjs',
                             plan / 'reports/phase-06/working-identity-registry.json',
                             plan / 'reports/phase-06/step10-sync287-target-ownership.json',
                             plan / 'reports/phase-06/step10-round5-target-ownership.json',
                             *[plan / 'reports/phase-06' / (s + '-reproduction.json')
                               for s in ('step10-round5', 'step10-sync4d')]]:
                dest = fixture / relative
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(relative, dest)
            changed = copy.deepcopy(docs[file])
            mutant = rebind['at'](changed, pointer)
            if row is stale[2]:
                mutant['targetUnitDigest'] = '0' * 64
            else:
                mutant['successorGroup']['members'][-1]['unitDigest'] = '0' * 64
            (fixture / file).write_text(json.dumps(changed, ensure_ascii=False, indent=2) + '\n')
            commands = []
            def run(argv):
                proc = subprocess.run(argv, cwd=fixture, env=env, text=True, capture_output=True)
                commands.append(dict(argv=argv, exit=proc.returncode,
                                     stdout=proc.stdout, stderr=proc.stderr))
                return proc
            checked = run(['python3', '-B', str(plan / 'reports/phase-09/rebind/rebind.py'), '--check'])
            assert checked.returncode == 1, checked.stderr
            result = json.loads(checked.stdout)
            assert any(r['file'] == file and r['pointer'] == pointer for r in result['rows'])
            assert not any(r['file'] == file and r['pointer'] == pointer for key in
                           ('authenticatedSupersededOrigins', 'authenticatedIdenticalUnitGroups')
                           for r in result[key])
            audits = []
            for stem, key, library in [('step10-round5', 'scripts', 'step10-sync287-lib.mjs'),
                                       ('step10-sync4d', 'readOnlyScripts', 'lib.mjs')]:
                scripts = json.loads((fixture / plan / 'reports/phase-06' /
                                      (stem + '-reproduction.json')).read_text())[key]
                output = fixture / stem
                output.mkdir()
                for script in (library, 'ownership.mjs', 'audit-ownership.mjs'):
                    (output / script).write_text(scripts[script])
                own = run(['node', str(output / 'ownership.mjs'), '--output-dir', str(output)])
                audit = run(['node', str(output / 'audit-ownership.mjs'), '--output-dir', str(output)])
                assert own.returncode == 0, own.stderr
                assert audit.returncode == 1 and 'assert(current.noNewDoubleOwnership)' in audit.stderr, audit.stderr
                census = json.loads((output / (stem + '-target-ownership.json')).read_text())
                assert census['noNewDoubleOwnership'] is False
                assert [r['claimId'] for r in census['unaccountedTargetDigestDrift']] == [row['claimId']]
                assert any(r['claimId'] == row['claimId'] for r in census['targetDigestDrift'])
                assert census['nativePlatformTargetIdentityDuplicates'] == 0
                assert census['newActiveSourcePairCollisions'] == []
                audits.append(dict(manifest=stem, raw=len(census['targetDigestDrift']),
                                   accounted=len(census['accountedTargetDigestDrift']), unaccounted=1))
            results.append(dict(behavior=label, refused=True, file=file, pointer=pointer,
                                claimId=row['claimId'], audits=audits, commands=commands))
    print(json.dumps(dict(status='pass', controls=results, scratchRemoved=True), indent=2))


if __name__ == '__main__':
    main()
