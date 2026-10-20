#!/usr/bin/env python3
"""Read-only exact-byte/scope handback checks over the final written artifacts."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,collections,os
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];REL=P.relative_to(ROOT);PIN='dc24ce64527fbffd23e1643f35a7ddf808fd7b45'
env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None)
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,env=env)
def sha(b):return hashlib.sha256(b).hexdigest()
def read(n):return json.loads((P/n).read_text())
def allowed(f):return f.startswith(str(REL)+'/') or f.startswith('plans/260925-documentation-authority-unification/ledger/decisions/') or f=='scripts/check-legacy-docs-ratchet.exceptions.json'
tracked=git('diff','--name-only','HEAD').decode().splitlines();untracked=git('ls-files','--others','--exclude-standard').decode().splitlines();assert all(allowed(f) for f in tracked+untracked),'out-of-scope mutation';assert not any(f.endswith('.pyc') or '__pycache__' in f.split('/') for f in tracked+untracked)
protected=[]
for f in git('ls-files','--',str(REL),'plans/260925-documentation-authority-unification/reports/phase-06').decode().splitlines():
 n=pathlib.Path(f).name
 if n.startswith(('step-02','step-03')) or n in ['step10-round5-reproduction.json','step10-sync4d-reproduction.json']:
  b=(ROOT/f).read_bytes();assert b==git('show','HEAD:'+f),f;protected.append({'path':f,'sha256':sha(b)})
rs=[json.loads(l) for p in sorted((P/'step-04-records').glob('*.jsonl')) for l in p.read_text().splitlines()];assert len(rs)==275 and len({r['reviewSet'] for r in rs})==33
current={r['file'] for r in rs}|{e['consumerFile'] for r in rs for e in r['edges']}|{x['path'] for r in rs for j in r['sourceRenderProvenance'] for x in j['renderFiles']}|{e['target'] for r in rs for e in r['edges'] if e['target']}
source_receipts=[]
for f in sorted(current):
 b=(ROOT/f).read_bytes();assert b==git('show',PIN+':'+f),f;source_receipts.append({'path':f,'sha256':sha(b)})
# Exact rebindings and no hidden approval/source-identity carry.
journal=read('step-00-l12-61-merge-rebindings.json');assert len(journal['entries'])==6
for x in journal['entries']:
 d=json.loads((ROOT/x['shard']).read_text())
 for key in x['keys']:d=d[key]
 assert d==x['after'] and d['reviewStatus']=='pending'
 for key in ['claimId','sourcePath','sourceUnitDigest']:
  if key in x['before']:assert d[key]==x['before'][key]
 assert not any(k in d for k in ['reviewedBy','reviewedAt','reviewReport','reviewReportCommit'])
# Only the three authorized exception records change.
f='scripts/check-legacy-docs-ratchet.exceptions.json';new=json.loads((ROOT/f).read_text());old=json.loads(git('show','HEAD:'+f));exceptions={x['path']:x for x in old['exceptions']};assert {x['path'] for x in new['exceptions']}==set(exceptions)
changed=[]
for x in new['exceptions']:
 prior=exceptions[x['path']]
 if x!=prior:
  changed.append(x['path']);assert x['rationale'].startswith(prior['rationale']) and x['approvedBy'].startswith(prior['approvedBy']);assert x['expectedDigest']==sha((ROOT/x['path']).read_bytes())
assert set(changed)=={'docs/specs/distribution.md','docs/specs/reading-map.md','docs/specs/runner.md'}
assert len(new['mainMergeAccounting']['rows'])==7
# Current record, batch and population accounting agree, including zero-edge owners.
pop=read('step-04-population.json');s4=[x for x in pop['rows'] if x['bucket']=='step4'];assert len(s4)==sum(len(r['edges']) for r in rs)==914
assert pop['rawSlots']==sum(max(1,len(x['inventoryRefs'])) for x in pop['rows']) and pop['uniqueSlots']==len(pop['rows']) and pop['overlapJoinCount']==pop['rawSlots']-pop['uniqueSlots']
assert set(pop['zeroEdgeOwners'])=={r['file'] for r in rs if not r['edges']}
b=read('step-04-batches.json');bs=b['batches']+b['mainMergeSupplement']['groups'];assert len(bs)==len({x['batch'] for x in bs})==33 and sum(x['edges'] for x in bs)==914
check=read('step-04-l12-60-check-result.json');assert check['failureCount']==0 and not check['openLeadRulingEdges'];assert check['checkerSha256']==sha((P/'step-04-check.py').read_bytes())
assert check['recordFileHashes']=={f.name:sha(f.read_bytes()) for f in sorted((P/'step-04-records').glob('*.jsonl'))}
for f,h in check['dependencyHashes'].items():assert sha((P/f).read_bytes())==h
assert read('step-04-l12-60-probes-result.json')['allPassed']
verification=read('step-04-l12-60-verification.json');assert verification['allPassed'] and all(x['exit']==0 for x in verification['commands'])
for x in verification['commands']:assert sha((ROOT/x['log']).read_bytes())==x['logSha256']
manifest=read('step-04-wave2-manifest.json');selections=read('step-04-wave2-selection.json');index=read('step-04-wave2-review-index.json');assert len(index)==44
for x in manifest['inputs']:assert sha((P/x['path']).read_bytes())==x['sha256']
for x in manifest['recordFiles']:assert sha((ROOT/x['path']).read_bytes())==x['sha256']
assert manifest['selectionSha256']==sha((P/'step-04-wave2-selection.json').read_bytes())
for x in index:
 data=(P/x['payload']).read_bytes();assert len(data)==x['bytes']<=400000 and sha(data)==x['payloadSha256'] and x['edges']<=60
 assert x['expectedReviewerOutput']==f'review-a38-step-04-wave2-p{x["part"]:02}.md'
changed_records=read('step-04-l12-60-sweep.json')['changedRecords']
for x in changed_records:
 r=next(r for r in rs if r['reviewSet']==x['set'] and r['file']==x['file']);assert sha(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())==x['newRecordSha256']
 if x['set']<='step04-016':assert x['file'] in next(v for v in selections if v['set']==x['set'])['selected']
assert sum(len(x['targetedReReview']) for x in selections)==177 and sum(len(x['selected']) for x in selections)==220
assert read('step-04-wave2-lead-ruling-gaps.json')['recordedPendingCensusSlotCount']==0
white=subprocess.run(['git','diff','--check'],cwd=ROOT,env=env,capture_output=True,text=True);assert white.returncode==0,white.stdout+white.stderr
out={'status':'passed','authorPin':PIN,'workingHEAD':git('rev-parse','HEAD').decode().strip(),'localMain':git('rev-parse','main').decode().strip(),'changedTrackedPaths':tracked,'newPaths':sorted(set(untracked)|{str(REL/'step-04-l12-60-scope-verification.json')}),'outOfScopeWrites':[],'bytecodeOutputs':[],'protectedArtifacts':protected,'protectedArtifactCount':len(protected),'unchangedPinnedConsumerAndTargetFiles':source_receipts,'currentSourceRecords':len(rs),'slots':914,'reviewParts':len(index),'targetedEarlierFiles':177,'selectedLaterFiles':43,'changedBindingsPendingIndependentReview':6,'needsWrites':[],'scopeMeaning':'No consumer, Step 3, frozen census, protected extractor/resolver/reproduction-manifest or production test/checker/baseline change. Step 4 checker and report-local author/probe/packet helpers are explicitly authorized.','limits':'Working-tree author proof; runner commit and separate L12-11 accounting/independent review remain owed.'}
(P/'step-04-l12-60-scope-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k not in ['protectedArtifacts','unchangedPinnedConsumerAndTargetFiles','changedTrackedPaths','newPaths']}))
