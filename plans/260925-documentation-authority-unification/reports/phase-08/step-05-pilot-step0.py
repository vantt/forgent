"""Read-only two-target Step 0 binding check using both unchanged extractors."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,hashlib,tempfile,os
P=pathlib.Path(__file__).resolve().parent
ROOT=P.parents[3];PIN=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
targets=['docs/platform/agent-protocol/spec.md']
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
results=[]
for stem,key,lib in [('step10-round5','scripts','step10-sync287-lib.mjs'),('step10-sync4d','readOnlyScripts','lib.mjs')]:
 manifest=P.parent/'phase-06'/(stem+'-reproduction.json');scripts=json.loads(manifest.read_text())[key]
 with tempfile.TemporaryDirectory(prefix='step04-step0-',dir='/tmp/fgos-work') as td:
  t=pathlib.Path(td)
  for n,s in scripts.items():assert pathlib.Path(n).name==n;(t/n).write_text(s)
  (t/'check.mjs').write_text("import {unitsOf} from './"+lib+"';console.log(JSON.stringify(Object.fromEntries("+json.dumps(targets)+".map(p=>[p,unitsOf(p)]))));")
  env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None)
  out=json.loads(subprocess.check_output(['node',str(t/'check.mjs'),'--output-dir',td],cwd=ROOT,env=env,text=True))
  results.append({'manifest':str(manifest.relative_to(ROOT)),'extractor':lib,'extractorSha256':sha(scripts[lib].encode()),'units':out})
assert results[0]['units']==results[1]['units']
direct=[];sources=[];groups=[]
def walk(x,path,loc):
 if isinstance(x,dict):
  if x.get('targetOwner') in targets:
   units=results[0]['units'][x['targetOwner']];hits=[u for u in units if u['anchor']==x.get('targetAnchor')]
   direct.append({'shard':str(path.relative_to(ROOT)),'keys':loc,'claimId':x.get('claimId'),'targetOwner':x['targetOwner'],'targetAnchor':x.get('targetAnchor'),'expectedDigest':x.get('targetUnitDigest',x.get('targetDigest')),'currentUnits':hits})
  if x.get('sourcePath') in targets:sources.append({'shard':str(path.relative_to(ROOT)),'keys':loc,'claimId':x.get('claimId'),'sourcePath':x['sourcePath'],'custody':'Inherited backlog source/history identity, not a target binding. Current backlog is retained hand-maintained per L12-26(4); no renderer, approval or identity remapping in this record-only wave.'})
  for k,v in x.items():walk(v,path,loc+[k])
 elif isinstance(x,list):
  for i,v in enumerate(x):walk(v,path,loc+[i])
for p in (ROOT/'plans/260925-documentation-authority-unification/ledger').rglob('*.json'):walk(json.loads(p.read_text()),p,[])
# No inbound target or group member contains either changed path. Do not
# refresh source/history identity digests by ordinal substitution.
assert not direct
files=[{'file':f,'digest':sha((ROOT/f).read_bytes()),'bytes':len((ROOT/f).read_bytes()),'equalAuthorPin':(ROOT/f).read_bytes()==git('show',PIN+':'+f),'previousDigest':sha(git('show',PIN+'^1:'+f)),'units':len(results[0]['units'][f])} for f in targets]
assert all(f['equalAuthorPin'] for f in files)
main=git('rev-parse',PIN+'^2').decode().strip();base=git('merge-base',PIN+'^1',main).decode().strip()
out={'authorInputCommit':PIN,'main':main,'mergeBase':base,'mainCommits':int(git('rev-list','--count',base+'..'+main)),'files':files,'extractorsAgree':True,'extractors':results,'directBindingsChecked':len(direct),'directBindings':direct,'sourceIdentityJoins':sources,'remainingTargetDigestDrift':0,'rebindingsApplied':0,'step3Rebindings':'Deferred once to Step 7 atomic assembly under L12-58(1); no Step 3 record changed.','acceptance':'Binding existence/content check only. No source identity, content approval, or committed-byte reproduction acceptance.'}
(P/'step-00-l12-67-binding-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k not in ['extractors','sourceIdentityJoins']}))
