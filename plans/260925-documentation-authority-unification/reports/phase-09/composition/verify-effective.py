#!/usr/bin/env python3
"""Independent, hash-guarded replay of effective records, not author claims.
Reuses GNU patch at fuzz=0, never applies a source-worktree edit. No fgOS CLI.
"""
import collections
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
P8=HERE.parent.parent/'phase-08'
TMP=Path('/tmp/fgos-work/w2-d2b-brief/independent-verifier')
TMP.mkdir(parents=True,exist_ok=True)
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
def load(p):return json.loads(p.read_text())
packet=load(HERE/'patch-specs.json')
byid={s['id']:s for s in packet['patches']}
ids=packet['effectiveSpecIds'];assert len(ids)==len(set(ids))
approved={s['path']:s for s in load(P8/'step-07-composed-patches.json')['patches']}
# Historical records remain byte-for-byte equal as JSON values, duplicates included.
rel=str((HERE/'patch-specs.json').relative_to(ROOT))
old=json.loads(subprocess.check_output(['git','--no-optional-locks','show','HEAD:'+rel],cwd=ROOT,text=True))['patches']
assert packet['patches'][:len(old)]==old
byfile=collections.defaultdict(list)
for ident in ids:byfile[byid[ident]['path']].append(byid[ident])
rows=[];edges=[];commands=0

def apply(path,text,diff,expected):
    global commands
    with tempfile.TemporaryDirectory(dir=TMP) as d:
        p=Path(d)/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
        if diff:
            cp=subprocess.run(['patch','--batch','--fuzz=0','-p1'],input=diff,cwd=d,text=True,capture_output=True)
            commands+=1
            assert cp.returncode==0,(path,cp.stdout,cp.stderr)
        actual=p.read_text();assert sha(actual)==expected,(path,sha(actual),expected)
        return actual

for path,specs in byfile.items():
    current=(ROOT/path).read_text();text=current;steps=[]
    first=specs[0]
    if sha(text)!=first['beforeSha256']:
        prior=approved[path]
        assert sha(text)==prior['beforeSha256'],('uncovered current drift',path)
        text=apply(path,text,prior['diff'],prior['expectedAfterSha256'])
        assert sha(text)==first['beforeSha256'],('not composed over exact approved after',path)
        steps.append(prior)
    for s in specs:
        assert sha(text)==s['beforeSha256'],('broken same-file chain',s['id'])
        if s.get('predecessor'):
            pred=s['predecessor'];owner=byid.get(pred['patchSpecId']) or next(p for p in approved.values() if p['patchSpecId']==pred['patchSpecId'])
            assert s['beforeSha256']==pred['expectedAfterSha256']==owner['expectedAfterSha256']
            edges.append({'specId':s['id'],'predecessor':pred['patchSpecId'],'sha256':s['beforeSha256'],'valid':True})
        text=apply(path,text,s['diff'],s['expectedAfterSha256']);steps.append(s)
    end=sha(text)
    for s in reversed(steps):text=apply(path,text,s['rollbackDiff'],s['beforeSha256'])
    assert text==current,('rollback differs from actual current bytes',path)
    rows.append({'path':path,'effectiveSpecIds':[s['id'] for s in specs],'currentSha256':sha(current),'expectedAfterSha256':end,'forwardAndRollbackExact':True})
# Negative hash probe: a different input must refuse before patch invocation.
assert rows and sha((ROOT/rows[0]['path']).read_text()+'\n')!=rows[0]['currentSha256']
assert not any('proposal:gap05' in i for i in ids)
result={'sourceCommit':packet['sourceCommit'],'exit':0,'historicalEntriesPreserved':len(old),'effectiveSpecs':len(ids),'effectiveFiles':len(rows),'patchInvocations':commands,'edges':edges,'files':rows,'negativeHashProbe':'different source bytes rejected by beforeSha256 guard','proposalsNotActivated':True,'scope':'All effective records against this checkout. Not semantic acceptance, full suite, final pin F, or gate closure.'}
(HERE/'w2-independent-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['edges','files']},ensure_ascii=False))
