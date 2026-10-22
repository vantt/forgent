#!/usr/bin/env python3
"""Records-only proof: exact patch roundtrips, owning-row join and one-door replay.

No product tests, Git writes, state access or CLI calls. Patch applies only to a
fresh /tmp/fgos-work copy of the explicitly named product source files.
"""
import collections
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PIN = '244a0435466a46e56cd95b4a70bfe03f54670996'
PREFIX = str(HERE.relative_to(ROOT))


def read(name):
    return json.loads((HERE / name).read_text())


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def dump(name, value):
    (HERE / name).write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n')


outputs = ['step-07-consumer-cutover-matrix.json', 'step-07-patch-order.json',
           'step-07-readiness.json', 'step-07-final-assembly-report.md',
           'step-07-final-obligations.json', 'step-07-final-prepared-specs.json',
           'step-07-park-resolution-applied.json']
argv = ['python3', '-B', PREFIX + '/step-07-assemble.py', '--final', '--pin', PIN]
runs = []
for n in (1, 2):
    result = subprocess.run(argv, cwd=ROOT, capture_output=True, check=True)
    runs.append({'round': n, 'exit': result.returncode, 'stdout': result.stdout.decode().strip(),
                 'outputs': {name: {'sha256': sha((HERE / name).read_bytes()), 'bytes': (HERE / name).stat().st_size} for name in outputs}})
assert runs[0]['outputs'] == runs[1]['outputs']
assert runs[0]['stdout'] == runs[1]['stdout']
matrix = read('step-07-consumer-cutover-matrix.json')
resolution = read('step-07-park-resolution-applied.json')
integration = read('step-07-integration-inputs.json')
readiness = read('step-07-readiness.json')
patches = read('step-07-patch-order.json')
prepared = read('step-07-final-prepared-specs.json')
proof = read('step-07-post-move-proof.json')
assert not readiness['readyForCutover'] and readiness['noReadinessClaim']
assert len(proof['checks']) == proof['count'] == 9650
assert {r['rowId'] for r in integration['reevaluations']} == {r['rowId'] for r in proof['overturns']}
assert integration['proofSha256'] == sha((HERE / integration['proof']).read_bytes())
records = {r['id']: [json.loads(line) for line in (HERE / r['path']).read_text().splitlines()] for r in matrix['recordCatalog']}
actual = matrix['consumerRows'] + matrix['rejectedNotConsumerRows']
assert len(actual) == len({r[0] for r in actual}) == 46404
updates = {r[0]: r[7] for r in resolution['rows']}
updates.update({r['rowId']: r['newDisposition'] for r in resolution['reevaluations']})
updates.update({r['rowId']: r['newDisposition'] for r in integration['reevaluations']})
by_id = {r[0]: r for r in actual}
counts = collections.Counter({name: 0 for name in matrix['counts']['byDispositionClass']})
writer_classes = collections.Counter()
aliases = {r['oldPath'] for r in read('step-05-cutover-move-set.json')['paths']} - {'docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'}
for row in actual:
    rec = records[row[1]][row[2] - 1]
    item = next(i for f in ('references', 'dynamicTraces', 'authorAddedReferences') for i in rec.get(f, []) if str(i.get('referenceId') or i.get('id') or i.get('edgeId')) == row[3])
    disposition = updates.get(row[0], item.get('disposition'))
    cls = 'rejected-not-consumer' if item.get('admission') == 'REJECT' and disposition == 'preserve' else {'preserve': 'preserved-history/fixture', 'patch': 'prepared-for-cutover', 'parked': 'individually parked', 'render-join': 'prepared-for-cutover', 'phase9-row-flip': 'prepared-for-cutover'}.get(disposition)
    assert cls == row[4], (row[0], disposition, cls, row[4])
    counts[cls] += 1
    if item.get('aliasWriteCheck', {}).get('isWriter') or item.get('writeDestination'):
        writer_classes[cls] += 1
        assert (item.get('target') or item.get('writeDestination')) not in aliases
assert dict(counts) == matrix['counts']['byDispositionClass']
assert sum(writer_classes.values()) == 51
assert not matrix['aliasViolations'] and not matrix['unmatchedRows']
assert len(integration['parkOwners']) == matrix['counts']['byDispositionClass']['individually parked']
assert {r['rowId'] for r in integration['parkOwners']} == {r[0] for r in matrix['consumerRows'] if r[4] == 'individually parked'}
assert all(r['owner'] and r['familyPlan'] and r['remainingBlocker'] and r['owner'] != 'Lead/documentation integration owner' for r in integration['parkOwners'])
assert len(resolution['rows']) == len({r[0] for r in resolution['rows']}) == 2311
# Historical v1 rows/catalogs and v2 decisions are not rewritten by the integration.
base = json.loads(subprocess.check_output(['git', '-C', str(ROOT), 'show', 'a0aa5a2acf49470e4b2bb9d21b7ae11a91842b47:' + PREFIX + '/step-07-park-resolution-applied.json']))
for key in ['rows', 'rowSchema', 'recordCatalog', 'fileCatalog', 'blockerCatalog', 'sourceBindingCatalog', 'reevaluations', 'reevaluationSourceBindings', 'externalLocatorReevaluations', 'v1ApplicationSha256']:
    assert base[key] == resolution[key], key
# Exact forward and rollback proof at the lowest layer that can observe patch bytes.
path_proofs = []
pathlib.Path('/tmp/fgos-work').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='integration-patches-', dir='/tmp/fgos-work') as tmp:
    scratch = pathlib.Path(tmp)
    for spec in prepared['specs']:
        source = subprocess.check_output(['git', '-C', str(ROOT), 'show', PIN + ':' + spec['path']])
        assert sha(source) == spec['beforeSha256']
        file = scratch / spec['path']
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(source)
        for key in ['diff', 'rollbackDiff']:
            run = subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], input=spec[key].encode(), cwd=scratch, capture_output=True)
            assert run.returncode == 0, (spec['id'], key, run.stdout, run.stderr)
            if key == 'diff':
                after = file.read_bytes()
                assert sha(after) == spec['expectedAfterSha256']
                if spec.get('composedOnce'):
                    ordered = [p for p in patches['patches'] if p['path'] == spec['path']]
                    for entry in ordered:
                        assert entry['composedOnce'] and entry['expectedAfterSha256'] == sha(after)
                        assert len(entry['forwardDiffRefs']) == 1 and entry['forwardDiffRefs'][0]['id'] == spec['id']
                if spec['path'] == 'test/report/enduser-index.test.mjs':
                    before_asserts = [l.strip() for l in source.decode().splitlines() if l.lstrip().startswith('assert.')]
                    after_asserts = [l.strip() for l in after.decode().splitlines() if l.lstrip().startswith('assert.')]
                    assert [l.replace("'docs/how-to/check-rollup-progress.md'", 'REAL_DEMO_DOC_PATH') for l in before_asserts] == after_asserts
                    assert "e.docPath === REAL_DEMO_DOC_PATH" in after.decode()
                    assert "path.join(REPO_ROOT, 'docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md')" in after.decode()
                if spec['path'] in ['apps/fgos-gateway/src/gateway.rs', 'apps/fgos-gateway/src/mcp.rs']:
                    assert 'docs/contracts/fgos-gateway' not in after.decode()
                    assert 'root.join("docs/contracts")' not in after.decode()
        assert file.read_bytes() == source
        path_proofs.append({'id': spec['id'], 'path': spec['path'], 'sourceSha256': sha(source), 'afterSha256': sha(after), 'forwardAndRollbackExact': True})
assert all(by_id[r][4] == 'prepared-for-cutover' for r in ['r03739', 'r03718', 'r03900', 'r03806', 'r26116', 'r26215', 'r26201'])
assert all(by_id[r][4] == 'preserved-history/fixture' for r in ['r03719', 'r03809'])
required_patches = ['r01010', 'r01106', 'r01108', 'r01135', 'r01136', 'r00820', 'r01033', 'r01037', 'r04466', 'r14203']
required_parks = ['r02200', 'r04182', 'r00764', 'r00732', 'r00761', 'r00762', 'r00731', 'r00733', 'r00737']
assert all(by_id[r][4] == 'prepared-for-cutover' for r in required_patches)
assert all(by_id[r][4] == 'individually parked' for r in required_parks)
park_by_id = {r['rowId']: r for r in integration['parkOwners']}
for rid in ['r02200', 'r04182']:
    assert park_by_id[rid]['remainingBlocker'] == park_by_id['r22947']['remainingBlocker']
    assert park_by_id[rid]['owner'] == park_by_id['r22947']['owner']
for rid in required_parks[2:]:
    assert park_by_id[rid]['owner'] == 'AGENTS.md cutover packet'
    assert park_by_id[rid]['remainingBlocker'] == 'AGENTS.md cutover packet (A34) rewrites root pointers to moved targets at cutover'
old_integration = json.loads(subprocess.check_output(['git', '-C', str(ROOT), 'show', '7df3f2e34955494090ccb81e83b53b3b6f515ee0:' + PREFIX + '/step-07-integration-inputs.json']))
old_ids = {r['rowId'] for r in old_integration['reevaluations']}
assert len(old_ids) == 39
assert all(by_id[r][4] == 'prepared-for-cutover' for r in old_ids)
assert set(integration['additionalOverturnsSinceL12_120']) == {r['rowId'] for r in proof['overturns']} - old_ids
assert proof['negativePremiseProbes'] == 3
assert 'historical-fixture-or-frozen-gate-operand' not in proof['resultCatalog']
assert len(proof['digestCatalog']) == len(set(proof['digestCatalog']))
# Each input preserve joins a stated reason, operand and physical-source
# digest, including inherited neutral-rule reasons; no role is an exemption.
for check in proof['checks']:
    rid = f'r{check[0]:05d}'
    row = by_id[rid]
    rec = records[row[1]][row[2] - 1]
    item = next(i for f in ('references', 'dynamicTraces', 'authorAddedReferences') for i in rec.get(f, []) if str(i.get('referenceId') or i.get('id') or i.get('edgeId')) == row[3])
    reason = item.get('reason') or rec.get('mechanicalClosure', {}).get('reason')
    assert reason and sha(reason.encode()) == proof['digestCatalog'][check[2]], rid
    token = str(item.get('matchedExpression') or item.get('pathOperand') or item.get('targetSetOrConstruction') or (item.get('callSite') or [None] * 5)[4] or '')
    assert sha(token.encode()) == proof['digestCatalog'][check[3]], rid
    assert proof['resultCatalog'][check[1]] in proof['premiseDescriptions']
for change in proof['overturns']:
    assert by_id[change['rowId']][4] == ('prepared-for-cutover' if change['newDisposition'] == 'patch' else 'individually parked')
    if change['newDisposition'] == 'patch' and change['file'] != 'docs/enduser-docs-index.json':
        spec = next(s for s in prepared['specs'] if s['path'] == change['file'] and s.get('composedOnce'))
        assert change['rowId'] in spec['rowIds']
        removed = '\n'.join(l[1:] for l in spec['diff'].splitlines() if l.startswith('-') and not l.startswith('---'))
        unwrap = lambda s: re.sub(r'\r?\n\s*(?://|\*)?\s*', '', s)
        assert any(p in unwrap(removed) for p in change['movingPaths']) or unwrap(change['token']) in unwrap(removed), change['rowId']
    else:
        assert change['newDisposition'] == 'patch' or (change['owner'] and change['remainingBlocker'])
assert len(readiness['blockedRowReadiness']) == counts['prepared-for-cutover'] + counts['individually parked']
four_bytes = sum(runs[0]['outputs'][name]['bytes'] for name in outputs[:4])
assert four_bytes < 6000000
result = {'sourceCommit': PIN, 'authority': 'L12-121', 'recordsOnly': True, 'counts': dict(counts),
          'rowJoin': {'rows': len(actual), 'duplicates': 0, 'disagreements': 0, 'parkMembers': 2311, 'effectiveParks': len(integration['parkOwners']), 'inputPreservesChecked': 9650, 'preservesOverturned': len(integration['reevaluations'])},
          'aliasWriterCheck': {'oldPaths': len(aliases), 'writers': sum(writer_classes.values()), 'classes': dict(writer_classes), 'violations': 0},
          'historicalV1AndV2ValuesUnchanged': True, 'composedPatchProofs': path_proofs,
          'premiseCoverage': {'allInputPreserves': len(proof['checks']), 'statedReasonAndOperandDigestJoins': len(proof['checks']), 'negativeProbes': proof['negativePremiseProbes'], 'roleExemption': False, 'proofHarnessSha256': sha((HERE / 'step-07-post-move-proof.mjs').read_bytes())},
          'additionalOverturnsSinceL12_120': integration['additionalOverturnsSinceL12_120'],
          'limits': ['No owning product tests or full npm/cargo suites run; fixture Git writes remain prohibited.', 'No live state or exporter rerun; no Phase 9 readiness/independent acceptance.', 'Two fixture constant members remain parked pending full scan/co-cut acceptance; their exact supplemental patch is prepared, not applied.']}
dump('step-07-integration-verification.json', result)
dump('step-07-final-determinism.json', {'sourceCommit': PIN, 'authority': 'L12-121', 'command': ' '.join(argv),
                                     'runs': runs, 'byteIdentical': True, 'fourGeneratedOutputBytes': four_bytes,
                                     'limitBytes': 6000000, 'owningRowVerification': 'step-07-integration-verification.json',
                                     'postMoveProof': 'step-07-post-move-proof.json', 'notClaimed': result['limits']})
print(json.dumps({'rows': len(actual), 'overturns': len(integration['reevaluations']), 'patchRoundtrips': len(path_proofs), 'byteIdentical': True, 'fourGeneratedOutputBytes': four_bytes}, sort_keys=True))
