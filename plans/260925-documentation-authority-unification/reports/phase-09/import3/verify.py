"""Read-only joins over current W11 evidence and exact input objects; no native call."""
import ast
import json
from pathlib import Path
import subprocess
import sys
P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import3'
sys.path.insert(0,str(O))
from resync import expand_report, sha
load=lambda p:json.loads(Path(p).read_text())
git=lambda *a:subprocess.check_output(['git',*a]).decode()
proof=expand_report(load(O/'binding-refresh.json'));pin=proof['sourceHEAD']
shard=load(P/'ledger/decisions/s18-import3-resync.json');intake=load(O/'source-triage.json')
assert {(r['sourcePath'],u['sourceAnchor'],u['sourceUnitDigest']) for r in intake['records'] for u in r['missingCarriage']}=={(r['sourcePath'],r['sourceAnchor'],r['sourceUnitDigest']) for r in shard['sourceBindings']}
assert len(shard['sourceBindings'])==24 and proof['exactSourceBindings']==16
for row in shard['sourceBindings']:
    if row['disposition']['kind']=='exact-unit-digest':assert row['sourceUnitDigest']==row['targetUnitDigest']
    else:assert row.get('adaptationWitness') and row['reviewStatus']=='pending'
for change in proof['directOriginMaterializations']:
    assert change['after']['reviewStatus']=='pending'
assert len(proof['directOriginMaterializations'])==len(proof['overlayPredecessorIdentityRefreshes'])==11
assert len(proof['historicalOverlayPredecessorsNotRewritten'])==171
path='scripts/check-legacy-docs-ratchet.exceptions.json'
before=json.loads(git('show',pin+':'+path));after=load(path)
changed=[]
for a,b in zip(before['exceptions'],after['exceptions']):
    if a==b:continue
    fixed=dict(b);fixed['expectedDigest']=a['expectedDigest'];assert a==fixed
    assert b['expectedDigest']==sha(Path(b['path']).read_bytes());changed.append(b['path'])
assert set(changed)=={'docs/specs/confinement-authority.md','docs/specs/reading-map.md','docs/specs/seat-binding.md'}
assert len(before['exceptions'])==len(after['exceptions'])
assert after['mainMergeAccounting']['commit']==git('rev-parse','571a996f5').strip()
assert after['previousMainMergeAccounting']['objectSha256']==sha(json.dumps(before['mainMergeAccounting'],ensure_ascii=False,separators=(',',':')))
for key in before.keys()-{'exceptions','mainMergeAccounting','previousMainMergeAccounting'}:assert before[key]==after[key]
assert git('show',pin+':scripts/check-legacy-docs-ratchet.baseline.json')==Path('scripts/check-legacy-docs-ratchet.baseline.json').read_text()
drift=load(P/'reports/phase-09/late-areas/legacy-drift.json')
assert drift['head']==pin and drift['counts']['missingChangedUnits']==0
assert all(r['missingCarriage']==[] for r in drift['records'])
assert sum(p['rowCount'] for p in drift['preparedPendingApply'])==134
for entry in drift['preparedPendingApply']:
    assert load(entry['path'])['appliedToDocs'] is False
    assert Path(entry['path']).read_text()==git('show',pin+':'+entry['path'])
scan=load(O/'scanner-proof.json')
assert scan['scannerSha256']==sha((P/'reports/phase-09/late-areas/scan-legacy-drift.mjs').read_bytes())
assert scan['unflaggedMissingHolder']['exit']==1 and scan['unflaggedMissingHolder']['error']=='ENOENT'
assert scan['preparedComposition']['resolvedOverlayRows']==134
assert scan['preparedComposition']['replay']['fullRollbackExact']
assert scan['preparedComposition']['exit']==0
checks=load(O/'checks-w11.json');assert checks['requiredChecksPassed']
for item in checks['checks']:
    if item['name']=='ownership-audit':
        assert item['requiredOwnershipPassed']
        assert all(m['failingRowCount']==0 for m in item['ownershipSummary'])
    else:assert item['exit']==0,item['name']
assert checks['evidenceRelocation']['status']=='not-run'
assert load(O/'current-source-triage.json')['counts']['unprovenUnits']==0
changedPaths=sorted(set(git('diff','--name-only','HEAD').splitlines()+git('ls-files','--others','--exclude-standard').splitlines()))
allowed=lambda p:p.startswith(('docs/platform/',str(P/'ledger/decisions')+'/',str(O)+'/')) or p in ['docs/reading-map.md',str(P/'phase-09-atomic-platform-authority-cutover.md'),'scripts/check-legacy-docs-ratchet.exceptions.json',str(P/'reports/phase-09/late-areas/legacy-drift.json'),str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs')]
assert all(map(allowed,changedPaths)),[p for p in changedPaths if not allowed(p)]
for path in changedPaths:
    if path.endswith('.json'):load(path)
    if path.endswith('.py'):ast.parse(Path(path).read_text())
print(json.dumps(dict(status='pass',inputHEAD=pin,carriedUnits=24,exactUnits=16,adaptedUnits=8,effectiveRebinds=63,directOrigins=11,overlayIdentities=11,liveMissingCurrent=0,preparedOverlayRows=134,composedScannerResidual=scan['preparedComposition']['counts']['missingChangedUnits'],ratchetRefreshes=3,scopePaths=len(changedPaths),independentReview='pending'),indent=2))
