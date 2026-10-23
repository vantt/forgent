#!/usr/bin/env python3
"""Owning structural/custody proof of archive design; no repository Git writes."""
import gzip, hashlib, json, pathlib, re, subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
P = 'plans/260925-documentation-authority-unification/'
A = P + 'reports/phase-09/archive/'


def main():
    def load(name):
        return json.loads(gzip.decompress((HERE / 'audit' / (name.replace('/', '--') + '.gz')).read_bytes()))
    def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT)
    m = json.loads((HERE / 'manifest.json').read_text())
    pin = m['sourceCommit']
    assert git('rev-parse', 'HEAD').decode().strip() == pin
    for asset in m['auditAssets']:
        data = (ROOT / asset['path']).read_bytes()
        assert len(data) == asset['size'] and hashlib.sha256(data).hexdigest() == asset['sha256']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == asset['blobId']
        json.loads(gzip.decompress(data))
    partition = load('partition.json')
    entries = {}
    for line in git('ls-tree', '-rlz', pin, '--', P).split(b'\0'):
        if not line: continue
        meta, p = line.split(b'\t', 1)
        mode, typ, oid, size = meta.split(); p = p.decode()
        if typ == b'blob' and mode != b'120000' and not p.startswith(A):
            entries[p] = (oid.decode(), int(size))
    moving = {r['path']: r for r in partition['records']}
    kept = {r['path']: r for r in partition['retained']}
    assert len(moving) == len(partition['records']) and len(kept) == len(partition['retained'])
    assert not set(moving) & set(kept) and set(moving) | set(kept) == set(entries)
    def check_row(r):
        p = pathlib.PurePosixPath(r['path'])
        assert not p.is_absolute() and '..' not in p.parts and r['path'].startswith(P)
        assert entries[r['path']] == (r['blobId'], r['size'])
        data = (ROOT / r['path']).read_bytes()
        assert len(data) == r['size'] and hashlib.sha256(data).hexdigest() == r['sha256']
    for r in partition['records'] + partition['retained']: check_row(r)
    assert all(r['reasons'] and not any('small record' in s for s in r['reasons']) for r in kept.values())
    for name in ('alias-table.json', 'claim-and-disposition-vocabulary.json', 'shipped-path-conventions-inventory.json', 'dropped-claims-register.json', 'plan.md'):
        assert P + name in kept
    specs = load('reader-patches/standalone-retirement-specs.json')['specs']
    assert len(specs) == len(set(r['path'] for r in specs))
    def check_spec(r):
        assert moving[r['path']]['sha256'] == r['beforeSha256']
        assert r['expectedAfter'] == 'absent' and r['archiveCommit'] == pin
        assert r['owningProof'] != r['path']
        assert r['owningProof'] or r['behaviourDisposition'] == 'behaviour retired with the plan'
    for r in specs: check_spec(r)
    gates = load('gate-retention.json')
    assert len(gates['reviewedTen']) == 10 and set(gates['reviewedTen']) <= set(gates['programs'])
    assert set(gates['programs']) <= set(gates['temporaryInputs']) | set(kept)
    assert all(r['schedule'] == 'retire-at-final-pin' for r in specs if r['path'] in gates['programs'])
    hist = load('reader-patches/historical-replay-specs.json')
    assert hist['readerTargetJoins'] == 135 == len(hist['joins'])
    assert hist['historicalReaderFiles'] == 47 == len(set(r['readerPath'] for r in hist['joins']))
    prior = load('reader-patches/prior-script-refs.json')['joins']
    old = json.loads((ROOT / P / 'reports/phase-08/step-08-tree-prune-manifest.json').read_text())
    assert len(prior) == sum(len(r['scriptRefs']) for r in old['inventory'])
    for r in prior:
        if r['readerPath'].startswith(('test/', 'scripts/', 'src/')):
            assert r['targetDisposition'] == 'retain', r
    restored = {r['path'] for r in old['directoryReaderCorrection']['restoredFiles']}
    assert len(restored) == 6 and restored <= set(kept)
    reachable = {l.split(b' ', 1)[0].decode() for l in git('rev-list', '--objects', pin).splitlines()}
    recovery = load('prior-prune-recovery.json')['records']
    batch = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    for r in recovery:
        assert r['blobId'] in reachable
        batch.stdin.write((r['blobId'] + '\n').encode()); batch.stdin.flush()
        head = batch.stdout.readline().split(); assert head[1] == b'blob' and int(head[2]) == r['size']
        data = batch.stdout.read(r['size']); assert batch.stdout.read(1) == b'\n'
        assert hashlib.sha256(data).hexdigest() == r['sha256']
    batch.stdin.close(); assert batch.wait() == 0
    negative = []
    for name, delta in [('wrong digest', {'sha256': '0' * 64}), ('wrong object', {'blobId': '0' * 40}), ('unsafe path', {'path': '../outside.json'})]:
        try: check_row({**partition['records'][0], **delta})
        except (AssertionError, KeyError): negative.append({'probe': name, 'rejected': True})
        else: raise AssertionError('negative probe accepted ' + name)
    try: check_spec({**specs[0], 'owningProof': specs[0]['path']})
    except AssertionError: negative.append({'probe': 'self-owning retired proof', 'rejected': True})
    else: raise AssertionError('self-owning retirement accepted')
    rehearsal = json.loads((HERE / 'rehearsal.json').read_text()) if (HERE / 'rehearsal.json').exists() else {}
    observed = None
    if 'bundle' in rehearsal:
        assert rehearsal['sourceCommit'] == pin
        bundle = rehearsal['bundle']; data = (ROOT / bundle['path']).read_bytes()
        assert len(data) == bundle['size'] and hashlib.sha256(data).hexdigest() == bundle['sha256']
        heads = {line.split()[1]: line.split()[0] for line in git('bundle', 'list-heads', str(ROOT / bundle['path'])).decode().splitlines()}
        assert heads[m['archiveRef']] == rehearsal['archiveCommit']
        assert heads['refs/heads/rehearsal/archive-reduced'] == rehearsal['accountedCandidate']
        assert heads['refs/heads/rehearsal/archive-with-gates'] == rehearsal['preFreezeCandidate']
        pairs = json.loads(gzip.decompress((HERE / 'audit/pair-accounting.json.gz').read_bytes()))
        for record in pairs:
            assert record['beforeExit'] == 1 and record['removalPairs'] > 0
            assert record['afterExit'] == 0 and record['afterAOk'] and record['afterUnaccountedPairs'] == record['afterWorkingViolations'] == 0
            assert len(record['pairRows']) == record['beforeUnaccountedPairs']
            rows = record['pairRows']; assert len({(r['commit'], r['path']) for r in rows}) == len(rows)
            assert sum(r['commit'] == rehearsal['removalCommit'] for r in rows) == record['removalPairs']
        assert len(rehearsal['tests']) == 20
        baseline = {}; reduced = {}
        for t in rehearsal['tests']:
            data = gzip.decompress((ROOT / t['log']).read_bytes())
            assert hashlib.sha256(data).hexdigest() == t['sha256']
            cases = [re.sub(r' \([0-9.]+ms\)$', '', s) for s in t['failedTitles'] if s != '✖ failing tests:']
            (baseline if t['phase'] == 'baseline' else reduced)[t['file']] = (t['exit'], sorted(set(cases)))
        assert baseline == reduced
        for variant in rehearsal['variants']:
            assert len(variant['runs']) == 3 and all(r['exit'] == 0 for r in variant['runs'])
        observed = {'bundleHeadsAndDigestVerified': True, 'testsPerSide': 10, 'baselineFailureParity': True,
            'accountingRecipesGreen': len(pairs), 'realDisk': rehearsal['findmnt'], 'variantTipBytes': [r['tipBytes'] for r in rehearsal['variants']]}
    result = {'inputCommit': pin, 'exit': 0, 'partitionFiles': len(entries), 'movingFiles': len(moving),
        'retainedFiles': len(kept), 'retirementSpecs': len(specs), 'gatePrograms': len(gates['programs']), 'reviewedTen': 10,
        'historicalReaderFiles': 47, 'historicalJoins': 135, 'priorScriptRefOccurrences': len(prior),
        'sixRestoredInputsRetained': True, 'alreadyPrunedRecoveryBlobsVerified': len(recovery),
        'negativeProbes': negative, 'mainManifestBytes': (HERE / 'manifest.json').stat().st_size,
        'auditCompressedBytes': sum(r['size'] for r in m['auditAssets']), 'rehearsalCustody': observed,
        'limits': 'Pin-bounded custody and conservative static reader closure; not independent semantics, arbitrary reachability, F approval or a product-suite pass.'}
    (HERE / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))

if __name__ == '__main__': main()
