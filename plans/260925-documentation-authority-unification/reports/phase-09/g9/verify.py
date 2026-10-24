#!/usr/bin/env python3
"""Replay G9 current-byte bodies and evidence joins; no product/test execution."""
import argparse
import copy
import difflib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sp = importlib.util.spec_from_file_location('g9_recompose', HERE / 'recompose.py')
recompose = importlib.util.module_from_spec(sp)
sp.loader.exec_module(recompose)
sweep = recompose.sweep


def verify_park_reviews(pin, rows, commands):
    """Own proof for the explicit reviews: complete deltas and named successors."""
    packet = sweep.load(HERE / 'park-decisions.json')
    evidence = sweep.load(HERE / 'park-review-evidence.json')
    decisions = {r['id']: r for r in packet['rows']}
    reviews = {r['id']: r for r in evidence['rows']}
    assert len(decisions) == len(packet['rows']) == 338
    assert set(decisions) == set(reviews)
    originals, _ = sweep.scope()
    for row in rows:
        if row['id'] not in decisions:
            continue
        decision = decisions[row['id']]
        review = reviews[row['id']]
        assert decision['group'] in packet['groups']
        assert review['recordSha256'] == row['recordSha256'] == decision['recordSha256']
        assert review['evidenceSha256'] == sweep.evidence_digest(row['passages']) == decision['evidenceSha256']
        entry = originals[row['id']]
        bound = sweep.bound_passages(entry)
        assert review['passagesRead'] == len(row['passages']) == len(bound)
        changed = [(old, now) for old, now in zip(bound, row['passages'])
                   if now['classification'] in ('changed', 'absent')]
        assert len(review['passages']) == len(changed)
        claims = {str(i.get('id') or i.get('referenceId') or i.get('edgeId')): i
                  for field in ['edges', 'references', 'dynamicTraces', 'authorAddedReferences']
                  for i in entry['record'].get(field, [])}
        for (old, now), join in zip(changed, review['passages']):
            assert join['passageId'] == now['passageId']
            assert join['recordedDisposition'] == now.get('recordedDisposition')
            claim = claims.get(str(now['passageId']).split('/caller')[0], {})
            assert join['claimSha256'] == sweep.sha(json.dumps(claim, sort_keys=True, ensure_ascii=False))
            delta = evidence['deltas'][join['deltaRef'].split('#', 1)[1]]
            for key in ['path', 'currentPath', 'oldStartLine', 'oldEndLine', 'startLine', 'endLine',
                        'boundSha256', 'currentSha256', 'currentFileSha256', 'classification', 'locator']:
                assert delta[key] == now.get(key), (row['id'], key)
            after = now.get('currentText')
            if after is None and now.get('currentReadCommand'):
                raw = sweep.blob(pin, now['currentPath']).decode()
                after = ''.join(raw.splitlines(True)[now['startLine'] - 1:now['endLine']])
            assert sweep.sha(old['text']) == now['boundSha256']
            assert (sweep.sha(after) if after is not None else None) == now['currentSha256']
            expected = ''.join(difflib.unified_diff(old['text'].splitlines(True),
                               (after or '').splitlines(True), fromfile='bound', tofile='current'))
            assert delta['diff'] == expected, row['id']
        for key in ['additionalEvidence', 'successorEvidence']:
            if key in decision:
                site = decision[key]
                data = sweep.blob(pin, site['path'])
                text = b''.join(data.splitlines(True)[site['startLine'] - 1:site['endLine']])
                assert sweep.sha(text) == site['sha256']
        if decision['disposition'] != 'superseded-or-retired':
            continue
        successor = decision['supersedingRecord']
        path = successor['path']
        if successor['kind'] == 'git-change':
            commit = successor['commit']
            argv = ['git', '--no-optional-locks', 'merge-base', '--is-ancestor', commit, pin]
            cp = subprocess.run(argv, cwd=sweep.ROOT, capture_output=True)
            commands.append({'argv': argv, 'exit': cp.returncode})
            assert cp.returncode == 0
            assert sweep.sha(sweep.blob(commit + '^', path)) == successor['beforeSha256']
            after = sweep.blob(commit, path)
            assert (sweep.sha(after) if after is not None else None) == successor['afterSha256']
            assert sweep.sha(sweep.git('diff', commit + '^', commit, '--', path)) == successor['gitDiffSha256']
            if successor['afterSha256'] is None:
                assert sweep.blob(pin, path) is None
        elif successor['kind'] == 'jsonl-record':
            line = sweep.blob(pin, path).decode().splitlines()[successor['line'] - 1]
            assert sweep.sha(line) == successor['sha256']
            assert json.loads(line)[successor['requiredField']] is True
        else:
            assert successor['kind'] == 'json-pointer'
            data = sweep.blob(pin, path)
            assert sweep.sha(data) == successor['sha256']
            value = json.loads(data)
            for part in successor['pointer'].strip('/').split('/'):
                value = value[int(part)] if isinstance(value, list) else value[part]
            assert value == successor['expected']
    # Exercise the real owning validator against falsified author output.
    judgments = sweep.load(HERE / 'judgments.json')
    original_load = sweep.load
    for field, disposition in [('reviewedDependencies', 'still-valid-as-recorded'),
                                ('supersedingRecord', 'superseded-or-retired'),
                                ('missingInput', 'owned-park')]:
        altered = copy.deepcopy(judgments)
        target = next(j for j in altered['rows'] if j.get('reviewRef') and
                      j['disposition'] == disposition and field in j)
        target.pop(field)
        try:
            sweep.load = lambda path: altered if path == HERE / 'judgments.json' else original_load(path)
            assert any(e['id'] == target['id'] for e in sweep.judgment_errors(rows)), field
        finally:
            sweep.load = original_load
    return {'reviewedRows': len(decisions), 'distinctFullDeltas': len(evidence['deltas']),
            'negativeControls': ['missing exact dependency review rejected',
                                 'missing named superseding record rejected',
                                 'missing concrete park input rejected']}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin', default='HEAD')
    args = ap.parse_args()
    pin = sweep.git('rev-parse', args.pin + '^{commit}').decode().strip()
    packet = sweep.load(HERE / 'recomposed.json')
    selected = sweep.spec_chains()
    assert not packet['unresolved']
    assert {s['path'] for s in packet['specs']} == set(selected)
    assert len(packet['specs']) == len(selected)
    commands, files = [], []
    for spec in packet['specs']:
        path = spec['path']
        before = sweep.blob(pin, path)
        if spec['requiresAbsent']:
            assert before is None
            before = b''
        assert before is not None and sweep.sha(before) == spec['beforeSha256'], path
        # Verify predecessor identity and body digests against original records,
        # not only a self-consistent recomposed packet.
        expected = sweep.chain_identity(selected[path])
        assert [{k: edge.get(k) for k in expected[0]}
                for edge in spec['predecessorChain']] == expected, path
        with recompose.workspace('verification-') as name:
            target = Path(name) / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(before)
            for direction, payload, prehash, posthash in [
                    ('forward', spec['diff'], spec['beforeSha256'], spec['expectedAfterSha256']),
                    ('rollback', spec['rollbackDiff'], spec['expectedAfterSha256'], spec['beforeSha256'])]:
                data = target.read_bytes() if target.exists() else b''
                assert sweep.sha(data) == prehash
                if payload:
                    argv = ['patch', '--batch', '--fuzz=0', '--reject-file=-', '-p1']
                    cp = subprocess.run(argv, cwd=name, input=payload, text=True, capture_output=True)
                    commands.append({'argv': argv, 'path': path, 'direction': direction,
                                     'exit': cp.returncode, 'stdout': cp.stdout, 'stderr': cp.stderr})
                    assert cp.returncode == 0, (path, cp.stdout, cp.stderr)
                data = target.read_bytes() if target.exists() else b''
                assert sweep.sha(data) == posthash, path
            assert (target.read_bytes() if target.exists() else b'') == before
        files.append({'path': path, 'beforeSha256': spec['beforeSha256'],
                      'expectedAfterSha256': spec['expectedAfterSha256'], 'roundtripExact': True})
    # The owning sweep also binds body bytes to the replayed current chain.
    specs = sweep.spec_sweep(pin)
    assert not specs['bodyReplayMismatches'], specs['bodyReplayMismatches']
    commands.extend(specs['bodyReplayCommands'])
    rows, cohorts = sweep.records_at(pin)
    assert sum(cohorts.values()) == 684 and len(rows) == 574
    assert not sweep.judgment_errors(rows)
    judgments = sweep.load(HERE / 'judgments.json')['rows']
    byid = {r['id']: r for r in rows}
    bodies = sweep.load(HERE / 'passages.json')['passages']
    for judgment in judgments:
        row = byid[judgment['id']]
        if judgment['disposition'] == 'still-valid-as-recorded':
            changed_dependencies = [{'path': p['currentPath'], 'passageId': p['passageId'],
                                     'currentSha256': p['currentSha256']} for p in row['passages']
                                    if p['passageId'] in ('explicit-overlap-dependency', 'canonical-source-dependency')
                                    and p['classification'] in ('changed', 'absent')]
            if changed_dependencies:
                assert judgment.get('reviewRef'), row['id']
                assert judgment.get('reviewedDependencies') == changed_dependencies, row['id']
        for actual, witness in zip(row['passages'], judgment['evidence']):
            body = {k: v for k, v in actual.items() if k not in ['passageId', 'recordedDisposition']}
            stored = bodies[witness['evidenceRef'].split('#', 1)[1]]
            # Retrieval commit can differ when source bytes are unchanged.
            assert {k: v for k, v in body.items() if k != 'currentReadCommand'} == {
                k: v for k, v in stored.items() if k != 'currentReadCommand'}
    park_reviews = verify_park_reviews(pin, rows, commands)
    # Negative controls mutate evidence in memory, never source/record files.
    changed = copy.deepcopy(rows[0])
    changed['passages'][0]['currentSha256'] = '0' * 64
    assert sweep.judgment_errors([changed])
    missing = copy.deepcopy(rows[0])
    missing['id'] = 'missing-record-negative-control'
    assert sweep.judgment_errors([missing])
    altered_record = copy.deepcopy(rows[0])
    altered_record['recordSha256'] = '0' * 64
    assert sweep.judgment_errors([altered_record])
    repin = copy.deepcopy(rows[0]['passages'])
    for p in repin:
        if 'currentReadCommand' in p:
            p['currentReadCommand'] = ['git', 'show', 'another-pin:' + p['currentPath']]
    assert sweep.evidence_digest(repin) == sweep.evidence_digest(rows[0]['passages'])
    # Authenticate every discovered equivalence, including mappings deliberately
    # NOT applied to historical Work exports. No title-only or prefix matching.
    mapping = sweep.load(HERE / 'sha-map.json')
    twins = mapping['mappings'] + [mapping['retainedBranchTwin']]
    for twin in twins:
        ids = []
        for commit in [twin['oldCommit'], twin['newCommit']]:
            argv = ['git', '--no-optional-locks', 'show', '--no-ext-diff', '--no-textconv',
                    '--binary', '--format=commit %H', commit]
            cp = subprocess.run(argv, cwd=sweep.ROOT, capture_output=True)
            commands.append({'argv': argv, 'exit': cp.returncode, 'stdoutSha256': sweep.sha(cp.stdout)})
            assert cp.returncode == 0
            q = subprocess.run(['git', '--no-optional-locks', 'patch-id', '--stable'],
                               cwd=sweep.ROOT, input=cp.stdout, capture_output=True)
            commands.append({'argv': ['git', '--no-optional-locks', 'patch-id', '--stable'],
                             'stdinCommit': commit, 'exit': q.returncode, 'stdout': q.stdout.decode()})
            assert q.returncode == 0 and len(q.stdout.split()) == 2
            ids.append(q.stdout.decode().split()[0])
        assert ids[0] == ids[1] == twin['oldPatchId'] == twin['newPatchId']
        argv = ['git', '--no-optional-locks', 'merge-base', '--is-ancestor', twin['newCommit'], pin]
        cp = subprocess.run(argv, cwd=sweep.ROOT, capture_output=True)
        commands.append({'argv': argv, 'exit': cp.returncode,
                         'stdout': cp.stdout.decode(), 'stderr': cp.stderr.decode()})
        assert cp.returncode == 0
    pure_repins = 0
    for twin in mapping['mappings']:
        if twin['oldToken'] not in mapping['doerPinsRepinned']:
            continue
        for site in twin['occurrences']:
            line = (sweep.ROOT / site['path']).read_text().splitlines()[site['line'] - 1]
            expected = site.get('currentCommit', twin['newCommit'])
            assert '"' + site['key'] + '": "' + expected + '"' in line, site
            if expected != twin['newCommit']:
                # A regenerated report can legitimately advance its source pin.
                # Authenticate the explicit refresh, never weaken to any ancestor.
                refresh = site['refreshEvidence']
                current = (sweep.ROOT / site['path']).read_bytes()
                assert sweep.sha(current) == refresh['currentFileSha256']
                assert sweep.blob(refresh['changedByCommit'], site['path']) == current
                previous = sweep.blob(refresh['changedByCommit'] + '^', site['path'])
                assert ('"' + site['key'] + '": "' + twin['newCommit'] + '"').encode() in previous
                for ancestor, descendant in [(twin['newCommit'], expected), (expected, pin),
                                              (refresh['changedByCommit'], pin)]:
                    argv = ['git', '--no-optional-locks', 'merge-base', '--is-ancestor', ancestor, descendant]
                    cp = subprocess.run(argv, cwd=sweep.ROOT, capture_output=True)
                    commands.append({'argv': argv, 'exit': cp.returncode})
                    assert cp.returncode == 0
            pure_repins += 1
    comparison = mapping['inputTreeComparison']
    cp = subprocess.run(comparison['command'], cwd=sweep.ROOT, capture_output=True)
    commands.append({'argv': comparison['command'], 'exit': cp.returncode,
                     'stdout': cp.stdout.decode(), 'stderr': cp.stderr.decode()})
    assert cp.returncode == 0 and cp.stdout == b''
    result = {'pin': pin, 'status': 'pass', 'uniqueRecords': len(rows),
              'cohortMemberships': sum(cohorts.values()), 'effectiveFiles': len(files),
              'roundtripFiles': files, 'purePinFieldsVerified': pure_repins,
              'patchIdEquivalencesVerified': len(twins), 'parkReviews': park_reviews,
              'negativeControls': ['changed passage digest rejects judgment', 'missing row rejects judgment',
                                   'changed record body rejects judgment',
                                   'same source bytes at another commit retain their content-bound judgment'],
              'independentAcceptance': False,
              'scope': 'Byte/provenance replay only; no owning product parity, semantic approval, final pin F or gate closure.'}
    (HERE / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    (HERE / 'verification-commands.json').write_text(json.dumps(commands + sweep.COMMANDS, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'roundtripFiles'}, indent=2))


if __name__ == '__main__':
    main()
