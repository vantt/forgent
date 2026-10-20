#!/usr/bin/env python3
"""Record-only accounting; reuse BOTH protected manifest extractors without edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,hashlib,tempfile,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];REL=P.relative_to(ROOT);MERGE='dc24ce64527fbffd23e1643f35a7ddf808fd7b45'
ENV=dict(os.environ);ENV.pop('CLAUDE_CODE_SESSION_ID',None)
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,env=ENV)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
prior=git('rev-parse',MERGE+'^1').decode().strip();main=git('rev-parse',MERGE+'^2').decode().strip();base=git('merge-base',prior,main).decode().strip()
changed=git('diff','--name-only',prior,MERGE,'--','docs').decode().splitlines()
commits={p:git('log','--format=%H %s',base+'..'+main,'--',p).decode().splitlines() for p in changed}
# All changed documentation targets, including zero-binding targets.
results=[]
for stem,key,lib in [('step10-round5','scripts','step10-sync287-lib.mjs'),('step10-sync4d','readOnlyScripts','lib.mjs')]:
 manifest=P.parent/'phase-06'/(stem+'-reproduction.json');scripts=json.loads(manifest.read_text())[key]
 with tempfile.TemporaryDirectory(prefix='l1261-',dir='/tmp/fgos-work') as td:
  t=pathlib.Path(td);paths={}
  for n,s in scripts.items():assert pathlib.Path(n).name==n;(t/n).write_text(s)
  for pin in [prior,MERGE]:
   paths[pin]={}
   for f in changed:
    dest=t/pin/f;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(git('show',pin+':'+f));paths[pin][f]=str(dest)
  (t/'check.mjs').write_text("import {unitsOf} from './"+lib+"'; const paths="+json.dumps(paths)+"; console.log(JSON.stringify(Object.fromEntries(Object.entries(paths).map(([pin,fs])=>[pin,Object.fromEntries(Object.entries(fs).map(([f,p])=>[f,unitsOf(p)]))]))));")
  out=json.loads(subprocess.check_output(['node',str(t/'check.mjs'),'--output-dir',td],cwd=ROOT,env=ENV,text=True))
  results.append({'manifest':str(manifest.relative_to(ROOT)),'extractor':lib,'extractorSha256':sha(scripts[lib].encode()),'units':out})
assert results[0]['units']==results[1]['units'];units=results[0]['units'];checks=[];edits=[];unresolved=[];groupchecks=[]
def locate(f,anchor,digest,ancestry=None,text=None):
 old=[u for u in units[prior][f] if u['anchor']==anchor and (not digest or u['textDigest']==digest)]
 if not old and text:old=[u for u in units[prior][f] if u['text']==text and (ancestry is None or u['ancestry']==ancestry)]
 assert len(old)==1,(f,anchor,'old binding ambiguous',len(old));old=old[0]
 hits=[u for u in units[MERGE][f] if u['text']==old['text'] and u['ancestry']==old['ancestry']]
 if len(hits)!=1:
  # Content changes require complete source section identity and explicit main hunk.
  hits=[u for u in units[MERGE][f] if u['anchor']==old['anchor'] and u['unitKind']==old['unitKind'] and u['ancestry']==old['ancestry']]
 assert len(hits)==1,(f,anchor,'current content ambiguous',len(hits))
 return old,hits[0]
def pending(x):
 removed={k:x.pop(k) for k in list(x) if k in ['reviewedBy','reviewedAt','reviewReport','reviewMode','reviewReportCommit','reviewPackCommit','reviewPackId','seedScoreId']}
 x['reviewStatus']='pending';x['reviewNote']='L12-61 content-bound merge rebind; independent review pending; no approval carry.';x['authoredBy']='codex-session:fgos-run_unit-run-179249d7679df6@2026-10-20';return removed
def walk(x,p,loc):
 if isinstance(x,dict):
  if x.get('targetOwner') in changed and x.get('targetAnchor'):
   f=x['targetOwner'];old,new=locate(f,x.get('targetAnchor'),x.get('targetUnitDigest',x.get('targetDigest')))
   row={'shard':str(p.relative_to(ROOT)),'keys':loc,'claimId':x.get('claimId'),'targetOwner':f,'oldPassage':old,'currentPassage':new,'mainPathCommits':commits[f]};checks.append(row)
   if old['anchor']!=new['anchor'] or old['textDigest']!=new['textDigest'] or x.get('targetAncestry',new['ancestry'])!=new['ancestry']:
    before=copy.deepcopy(x);x['targetAnchor']=new['anchor'];x['targetUnitDigest']=new['textDigest'];x['targetAncestry']=new['ancestry'];removed=pending(x);x['rationale']=x.get('rationale','')+' L12-61: merge '+MERGE+'; complete old/current passage and actual heading ancestry checked with both unchanged extractors; main hunk accounted. Source identity unchanged; independent changed-binding review owed.'
    edits.append({**row,'before':before,'after':copy.deepcopy(x),'removedApprovalFields':removed,'mainDiff':git('diff',prior,MERGE,'--',f).decode()})
  if x.get('path') in changed and 'unitDigest' in x and 'anchor' in x:
   f=x['path'];old,new=locate(f,x['anchor'],x['unitDigest'],x.get('ancestry'),x.get('text'));row={'shard':str(p.relative_to(ROOT)),'keys':loc,'oldPassage':old,'currentPassage':new};groupchecks.append(row)
   if old['anchor']!=new['anchor'] or old['textDigest']!=new['textDigest']:
    before=copy.deepcopy(x);x.update(anchor=new['anchor'],unitDigest=new['textDigest'],ancestry=new['ancestry'],text=new['text']);edits.append({**row,'before':before,'after':copy.deepcopy(x),'groupMember':True})
  for k,v in list(x.items()):walk(v,p,loc+[k])
 elif isinstance(x,list):
  for i,v in enumerate(x):walk(v,p,loc+[i])
for p in sorted((ROOT/'plans/260925-documentation-authority-unification/ledger/decisions').glob('*.json')):
 before=git('show','HEAD:'+str(p.relative_to(ROOT))).decode();d=json.loads(before);walk(d,p,[])
 if d!=json.loads(before):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Re-open written shards and independently compare every current target/group field.
post=[]
def postwalk(x,p,loc):
 if isinstance(x,dict):
  if x.get('targetOwner') in changed and x.get('targetAnchor'):
   hits=[u for u in units[MERGE][x['targetOwner']] if u['anchor']==x['targetAnchor'] and u['textDigest']==x.get('targetUnitDigest',x.get('targetDigest'))]
   assert len(hits)==1,(p,loc,'remaining direct drift');assert x.get('targetAncestry',hits[0]['ancestry'])==hits[0]['ancestry']
   post.append({'shard':str(p.relative_to(ROOT)),'keys':loc,'targetOwner':x['targetOwner'],'anchor':hits[0]['anchor'],'digest':hits[0]['textDigest'],'drift':False})
  if x.get('path') in changed and 'anchor' in x and 'unitDigest' in x:
   hits=[u for u in units[MERGE][x['path']] if u['anchor']==x['anchor'] and u['textDigest']==x['unitDigest'] and u['ancestry']==x['ancestry'] and u['text']==x['text']]
   assert len(hits)==1,(p,loc,'remaining group drift')
  for k,v in x.items():postwalk(v,p,loc+[k])
 elif isinstance(x,list):
  for i,v in enumerate(x):postwalk(v,p,loc+[i])
for path in sorted((ROOT/'plans/260925-documentation-authority-unification/ledger/decisions').glob('*.json')):postwalk(json.loads(path.read_text()),path,[])
assert len(post)==len(checks)
# Ratchet data only; retain all prior rationale verbatim.
p=ROOT/'scripts/check-legacy-docs-ratchet.exceptions.json';d=json.loads(git('show','HEAD:scripts/check-legacy-docs-ratchet.exceptions.json'))
for x in d['exceptions']:
 if x['path'] in ['docs/specs/distribution.md','docs/specs/reading-map.md','docs/specs/runner.md']:
  x['expectedDigest']=sha((ROOT/x['path']).read_bytes());x['reviewedAt']='2026-10-20';x['rationale']+=' L12-61 main merge '+MERGE+' imports main '+main+' (base '+base+', 19 commits): '+' | '.join(commits[x['path']])+'. Accounting only; no authority/content approval; A47 final conservation and changed-binding review owed.';x['approvedBy']+='; Lead L12-60 fix assignment authorizes L12-61 main-merge accounting only'
entry={'decision':'L12-61','mergeCommit':MERGE,'main':main,'base':base,'mainCommits':int(git('rev-list','--count',base+'..'+main)),'paths':[{'path':f,'digest':sha((ROOT/f).read_bytes()),'mainPathCommits':commits[f]} for f in changed],'acceptance':'Accounting only; no approval carry; Step 3 deferred to Step 7 under L12-58(1).'}
previous=copy.deepcopy(d.get('mainMergeAccounting'))
if previous:d['previousMainMergeAccounting']={'inputCommit':git('rev-parse','HEAD').decode().strip(),'path':str(p.relative_to(ROOT)),'commit':previous['commit'],'objectSha256':sha(json.dumps(previous,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()),'meaning':'Previous accounting retained at the exact input commit; exception rationales above retain all preceding accounting text verbatim.'}
d['mainMergeAccounting']={'commit':MERGE,'authorization':'A42/L12-60; assignment unit-run-1792498121301-3ada6ffe','meaning':'L12-61: all seven changed documentation targets accounted. Three ratchet exceptions refreshed. Six content-bound Step 0 rebindings pending independent review. Step 3 overlaps deferred once to Step 7. No content approval, authority flip, baseline/checker change, origin pull or consumer edit.', 'rows':[{'path':f,'kind':'allowed-edit','owner':'documentation-authority-unification-lead','revisitTrigger':'Phase 09 final conservation/cutover','rationale':'L12-61 merge '+MERGE+' imports '+main+', base '+base+', 19 commits: '+' | '.join(commits[f])+'. Accounting only; independent changed-binding/content/conservation review owed; no approval carry.','approvedBy':'Lead L12-60 assignment authorizes merge accounting only','expectedDigest':sha((ROOT/f).read_bytes()),'reviewedAt':'2026-10-20','ratchetScope':'active-exception' if f in ['docs/specs/distribution.md','docs/specs/reading-map.md','docs/specs/runner.md'] else 'outside-default-roots'} for f in changed]}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Canonical Step 3 overlap records remain byte-identical.
deferred=[]
for p in sorted(P.glob('step-03-records*/*.jsonl')):
 for line in p.read_text().splitlines():
  r=json.loads(line)
  if r['file'] in changed:deferred.append({'recordFile':str(p.relative_to(ROOT)),'file':r['file'],'authorInputCommit':r['authorInputCommit'],'recordSha256':sha(line.encode()),'digest':r['digest'],'currentDigest':sha((ROOT/r['file']).read_bytes()),'action':'Deferred once to Step 7 final atomic assembly; relocate complete passage/hunk/target then independently review; retirement records recheck conservation.'})
save('step-00-l12-61-step3-deferred-rebinds.json',deferred)
save('step-00-l12-61-merge-rebindings.json',{'inputHEAD':git('rev-parse','HEAD').decode().strip(),'prior':prior,'merge':MERGE,'main':main,'base':base,'mainCommits':entry['mainCommits'],'changedPaths':changed,'mainPathCommits':commits,'extractorsAgree':True,'checkedBindings':checks,'successorGroupMemberChecks':groupchecks,'entries':edits,'parked':unresolved,'needsWrites':[],'counts':{'directChecked':len(checks),'groupMembersChecked':len(groupchecks),'changedBindings':len(edits),'pendingReview':len(edits)},'phase9ConservationUnionAdditions':changed,'acceptance':'Author binding verification only; independent changed-binding review and real runner commit L12-11 accounting remain owed.'})
save('step-00-l12-61-binding-check.json',{'merge':MERGE,'extractorsAgree':True,'extractors':results,'changedPaths':changed,'directChecked':len(checks),'groupMembersChecked':len(groupchecks),'changedBindingsPendingReview':len(edits),'postApplicationDirectChecks':post,'remainingDrift':0,'deferredStep3Records':len(deferred)})
print(json.dumps({'targets':len(changed),'direct':len(checks),'groups':len(groupchecks),'edits':len(edits),'deferred':len(deferred),'mainCommits':entry['mainCommits']}))
