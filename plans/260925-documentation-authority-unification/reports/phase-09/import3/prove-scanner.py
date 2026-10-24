"""Scratch-only scanner probes, reusing the existing exact composition replay.
Only the three effective component-carriage specs are needed for this boundary;
this is not a whole-cutover or final-pin composition verdict.
"""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
sys.dont_write_bytecode=True
ROOT=Path.cwd()
P=Path('plans/260925-documentation-authority-unification')
O=P/'reports/phase-09/import3'
S=Path('/tmp/fgos-work/w11-import3/scanner-proof')
S.mkdir(parents=True,exist_ok=True)
recipe=json.loads((P/'reports/phase-09/composition/w9-replay-recipes.json').read_text())['scripts']['rework.py']
replayPath=S/'rework.py'
replayPath.write_text(recipe.replace('/tmp/fgos-work/w9-comp-rework',str(S)))
spec=importlib.util.spec_from_file_location('composition_replay',replayPath)
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
if (S/'tree').exists():shutil.rmtree(S/'tree')
tree=r.export('tree')
# No repository, index, ref or fixture Git write. This pointer serves read-only
# git show/log/rev-parse in the scanner; all mutable fixture paths are real copies.
(tree/'.git').symlink_to(ROOT/'.git')
for rel in ['ledger/decisions','reports/phase-09/late-areas']:
    shutil.copytree(ROOT/P/rel,tree/P/rel)
for rel in ['reports/phase-08/step-07-final-determinism.json','reports/phase-02-identity-registry.json','reports/phase-06/working-identity-registry.json']:
    dest=tree/P/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/P/rel,dest)
scanner=str(P/'reports/phase-09/late-areas/scan-legacy-drift.mjs')
output=tree/P/'reports/phase-09/late-areas/legacy-drift.json'
cp=r.run(['node',scanner],tree);assert cp.returncode==0,cp.stderr
live=json.loads(output.read_text());assert live['counts']['missingChangedUnits']==0
prepared=live['preparedPendingApply'];assert len(prepared)==2
assert sum(p['rowCount'] for p in prepared)==134
assert sum(p['historicalLookupRowCount'] for p in prepared)==44
assert all(not any(t['path'].endswith('component-boundary-source-carriage.md') for t in row['candidateSuccessors']) for row in live['records'])
# An unflagged bad shard must fail on the actual candidate read, not disappear.
negative=tree/P/'ledger/decisions/zzz-w11-missing-holder-probe.json'
missing='docs/platform/w11-required-missing-holder.md'
negative.write_text(json.dumps(dict(sourceBindings=[dict(sourcePath='docs/specs/confinement-authority.md',targetOwner=missing)])))
preimage=output.read_bytes();cp=r.run(['node',scanner],tree)
assert cp.returncode!=0 and 'ENOENT' in cp.stderr.decode() and missing in cp.stderr.decode(),cp.stderr
assert output.read_bytes()==preimage
negativeExit=cp.returncode;negative.unlink()
# Replay the published predecessor + relocation + history, unchanged and with
# hash checks, --fuzz=0, per-step rollback and full rollback byte equality.
packet=json.loads((P/'reports/phase-09/composition/patch-specs.json').read_text())
selected={'docs/platform/component-boundary.md','docs/platform/system-architecture/history/component-boundary-source-carriage.md'}
by={s['id']:s for s in packet['patches']}
packet['effectiveSpecIds']=[i for i in packet['effectiveSpecIds'] if by[i]['path'] in selected]
packet['finalPinFSpecIds']=[i for i in packet['finalPinFSpecIds'] if by[i]['path'] in selected]
assert len(packet['effectiveSpecIds'])==3 and not packet['finalPinFSpecIds']
proof,_,_=r.replay(tree,packet)
for pending in prepared:
    file=tree/pending['path'];doc=json.loads(file.read_text());assert doc['appliedToDocs'] is False
    doc['appliedToDocs']=True;file.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
# Directly resolve every prepared overlay, not merely the aggregate scan result.
b=r.resolver(tree)
preparedDocs={entry['path']:json.loads((tree/entry['path']).read_text()) for entry in prepared}
paths=sorted({row['targetOwner'] for doc in preparedDocs.values() for _,row in b.rows(doc)})
cat=r.catalog(b,tree,paths)
resolved=[]
for file,doc in preparedDocs.items():
    for ptr,row in b.rows(doc):
        unit=b.unit_for(row,cat)
        assert row['bindingSha256']==b.digest(row)
        assert row['targetAncestry']==unit['ancestry']
        resolved.append(dict(shard=file,pointer=ptr,binding=b.payload(row),bindingSha256=row['bindingSha256']))
assert len(resolved)==134  # 44 heading + 90 body; other 44 entries are historical lookup rows
cp=r.run(['node',scanner],tree);assert cp.returncode==0,cp.stderr
applied=json.loads(output.read_text());assert applied['preparedPendingApply']==[]
# This scanner's unchanged source-binding join does not inherit sourcePath from
# superseded rows. The independent resolver above proves all actual overlays;
# retain the composed scan's conservative residual, never invent bindings here.
history='docs/platform/system-architecture/history/component-boundary-source-carriage.md'
assert any(any(t['path']==history for t in row['candidateSuccessors']) for row in applied['records'])
report=dict(inputHEAD=live['head'],scannerSha256=r.sha((ROOT/scanner).read_bytes()),
    recipe=dict(path=str(P/'reports/phase-09/composition/w9-replay-recipes.json'),script='rework.py',sha256=r.sha(recipe),adaptation='Scratch path only; replay body unchanged'),
    liveTree=dict(exit=0,counts=live['counts'],preparedPendingApply=prepared,oldRowsRemainEffective=True),
    unflaggedMissingHolder=dict(exit=negativeExit,error='ENOENT',path=missing,outputUnchanged=True),
    preparedComposition=dict(specIds=packet['effectiveSpecIds'],replay=proof,resolvedOverlayRows=len(resolved),rows=resolved,exit=0,counts=applied['counts'],preparedPendingApply=[]),
    commands=r.commands,limits=['Scratch only. Both prepared shards are marked applied only in the physically composed fixture. No live flag or patch changed.','This is the scanner/overlay boundary proof, not whole-cutover acceptance. The composed scan exits 0 and reads the history target, but its unchanged source-binding join conservatively reports two changed units in README/repo-layout-vision; all 134 operative overlay targets resolve independently. Final-pin source-join materialization belongs to the composition owner.','No native addon or fgOS CLI; repository Git reads only.'])
(O/'scanner-proof.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(liveExit=0,pendingRows=134,unflaggedMissingExit=negativeExit,composedExit=0,resolvedOverlayRows=134,composedMissingChangedUnits=applied['counts']['missingChangedUnits'])))
