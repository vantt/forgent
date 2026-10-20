#!/usr/bin/env python3
"""Independent hashlib/ceil selection, packet and immutable binding replay; no checker calls."""
import os, pathlib, subprocess, hashlib, json, math, collections
ROOT=pathlib.Path(__file__).resolve().parents[4]
P=pathlib.Path(__file__).resolve().parent
PIN='ae141550c2e022310de7a0efea757580c0b2479f';NEW=[str(b) for b in range(122,113,-1)]
ENV=dict(os.environ);ENV.pop('CLAUDE_CODE_SESSION_ID',None)
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args],env=ENV)
def sha(data):return hashlib.sha256(data if isinstance(data,bytes) else data.encode()).hexdigest()
def read(name):return json.loads((P/('step-03-wave5g-'+name)).read_text())
def main():
 rs=[];rawrecords={}
 for b in NEW:
  for line in (P/'step-03-records'/f'batch-{b}.jsonl').read_bytes().splitlines(keepends=True):
   r=json.loads(line);assert r['reviewSet']=='batch-'+b;rs.append(r);rawrecords[r['file']]=line
 assert len(rs)==49 and len({r['file'] for r in rs})==49
 freeze=read('manifest.json');index=read('review-index.json');read_receipts=read('whole-file-reads.json');rr={r['file']:r for r in rs};read_by={r['file']:r for r in read_receipts['files']};source={}
 for r in rs:
  raw=git('show',PIN+':'+r['file']);source[r['file']]=raw;assert sha(raw)==r['digest'];assert raw==git('show',r['inventoryInputCommit']+':'+r['file'])
  lines=raw.decode().splitlines();receipt=read_by[r['file']]
  assert receipt['bytes']==len(raw) and receipt['lines']==len(lines) and receipt['sha256']==sha(raw)
  assert receipt['orderedWholeFileChunks']==[{'firstLine':i+1,'lastLine':min(i+80,len(lines)),'sha256':sha('\n'.join(lines[i:i+80]))} for i in range(0,len(lines),80)]
  for e in r['edges']:
   pieces=[lines[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1] for s in e['sourceSpans']]
   assert pieces==[s['text'] for s in e['sourceSpans']] and '\n'.join(pieces)==e['matchedExpression']
 for f in freeze['files']:
  r=rr[f['file']];assert f['recordSha256']==sha(rawrecords[r['file']]) and f['diffSha256']==sha(r['diff']) and f['digest']==sha(source[r['file']])
 for f in freeze['recordFiles']:assert sha((ROOT/f['path']).read_bytes())==f['sha256']
 expected_selected=set();accounts=[]
 for b in NEW:
  group=[r for r in rs if r['reviewSet']=='batch-'+b];g=next(g for g in freeze['sets'] if g['set']=='batch-'+b)
  seed='A51-step03-file-v1\0'+PIN+'\0'+b
  pop=sorted(r['file'] for r in group if r['diff']);ranks=sorted([{'file':f,'rankHash':sha(seed+'\0'+f)} for f in pop],key=lambda x:(x['rankHash'],x['file']))
  sample=[x['file'] for x in ranks[:math.ceil(.15*len(pop))]]
  mandatory={r['file'] for r in group if len(source[r['file']])>=65536 or len(r['edges'])>=40}
  required={r['file'] for r in group if len(source[r['file']])>=65536 or len(r['inventoryEdgeIds'])>=40};assert required<=mandatory
  assert g['seed']==seed and g['population']==pop and g['populationCount']==len(pop) and g['ranks']==ranks and g['sample']==sample and set(g['selected'])==set(sample)|mandatory
  assert {x['file'] for x in g['mandatoryWitnesses']}==mandatory
  u=freeze['unpatchedStrata'][b];upop=sorted(r['file'] for r in group if not r['diff'] and r['edges'] and r['file'] not in g['selected'])
  useed='A51-step03-file-v1-unpatched\0'+PIN+'\0batch-'+b
  uranks=sorted([{'file':f,'rankHash':sha(useed+'\0'+f)} for f in upop],key=lambda x:(x['rankHash'],x['file']))
  usample=[x['file'] for x in uranks[:math.ceil(.15*len(upop))]]
  assert u['seed']==useed and u['population']==upop and u['populationCount']==len(upop) and u['ranks']==uranks and u['selected']==usample
  forced={r['file'] for r in group if any(e.get('blockedCategory')=='lead-ruling' for e in r['edges'])}
  locator_supplement={r['file'] for r in group if any(e['edgeId']=='maps-j-07614' for e in r['edges'])}
  selected=set(sample)|mandatory|set(usample)|forced|locator_supplement;expected_selected|=selected
  accounts.append({'set':'batch-'+b,'patchedPopulation':len(pop),'patchedSeeded':len(sample),'mandatory':len(mandatory),'unpatchedEligible':len(upop),'unpatchedSeeded':len(usample),'leadSupplement':len(forced-set(g['selected'])-set(usample)),'distinct':len(selected)})
  actual=next(x for x in index['perSet'] if x['set']=='batch-'+b)
  assert actual['patchedPopulation']==len(pop) and actual['patchedSeeded']==len(sample) and actual['mandatory']==len(mandatory) and actual['unpatchedEligible']==len(upop) and actual['unpatchedSeeded']==len(usample) and actual['distinctSelected']==len(selected)
 selected_rows=[r for p in index['parts'] for r in p['files']];assert len(selected_rows)==len(expected_selected)==index['selectedFiles'] and {x['file'] for x in selected_rows}==expected_selected
 assert sum(x['edges'] for x in selected_rows)==index['selectedEdges']
 for p in index['parts']:
  assert p['report'].endswith(f"review-a38-step-03-wave5g-p{p['part']:02}.md")
  assert p['fileCount']==len(p['files']) and p['edges']==sum(x['edges'] for x in p['files']) and p['sourcePlusRecordBytes']==sum(x['contextPlusRecordBytes'] for x in p['files'])
  if p['indivisibleOversize']:assert len(p['files'])==1
  else:assert p['fileCount']<=6 and p['edges']<=150 and p['sourcePlusRecordBytes']<=400000
  for x,page in zip(p['files'],p['readingPages']):
   r=rr[x['file']];assert x['recordSha256']==sha(rawrecords[r['file']]) and x['sourceDigest']==sha(source[r['file']]) and x['diffSha256']==sha(r['diff'])
   assert x['recordBytes']==len(rawrecords[r['file']]) and x['sourceBytes']==len(source[r['file']]) and x['contextPlusRecordBytes']==x['recordBytes']+x['sourceBytes']
   assert page['edgeRanges']==[{'first':n+1,'last':min(n+100,len(r['edges']))} for n in range(0,len(r['edges']),100)] and page['fieldPageBytes']<=300000 and page['sourcePageLines']<=120
 protected=read('protected-bindings.json');frozen={protected['root']+'/'+p:d for p,d in protected['bindings'].items()}
 prior_verification=read('initial-verification.json')
 assert prior_verification['protectedBindingsChecked']==len(frozen)==4146 and prior_verification['protectedDrift']==[]
 critical={f:d for f,d in frozen.items() if ('/phase-08/step-03-records/' in f or '/phase-08/' in f and (pathlib.PurePosixPath(f).name in ('progress.md','owner-answers.md','step-03-authoring-request.md') or 'review-request' in pathlib.PurePosixPath(f).name or f.endswith('.py') and pathlib.PurePosixPath(f).name.startswith('step-03-')) or f.endswith(('/phase-06/step10-round5-reproduction.json','/phase-06/step10-sync4d-reproduction.json')))}
 drift=[f for f,digest in critical.items() if not (ROOT/f).is_file() or sha((ROOT/f).read_bytes())!=digest];assert not drift,drift
 tracked=git('diff','--name-only','--no-ext-diff','HEAD','--','docs','README.md','AGENTS.md','CLAUDE.md','core','src','scripts','test','packages','apps','domains','bin','plans').decode().splitlines();assert not tracked,tracked
 new=git('ls-files','--others','--exclude-standard','--',str(P.relative_to(ROOT))).decode().splitlines()
 allowed_records={str((P/'step-03-records'/f'batch-{b}.jsonl').relative_to(ROOT)) for b in NEW}
 assert all(f in allowed_records or (pathlib.PurePosixPath(f).parent==P.relative_to(ROOT) and pathlib.PurePosixPath(f).name.startswith('step-03-wave5g-')) for f in new),new
 checker=read('check-result.json');assert checker['failureCount']==0,checker['failures']
 assert checker['checkerSourceSha256']==sha((P/'step-03-check.py').read_bytes()) and checker['resolverSourceSha256']==sha((P/'step-03-resolve.py').read_bytes())
 diffrun=subprocess.run(['git','-C',str(ROOT),'diff','--check'],env=ENV,capture_output=True);assert diffrun.returncode==0,diffrun.stdout.decode()+diffrun.stderr.decode()
 out={'pin':PIN,'assignmentHead':git('rev-parse','HEAD').decode().strip(),'newFiles':len(rs),'newEdges':sum(len(r['edges']) for r in rs),'sourceBytes':sum(len(x) for x in source.values()),'completedBatches':NEW,'samplingReplay':accounts,'selectedFiles':len(expected_selected),'selectedEdges':index['selectedEdges'],'reviewParts':len(index['parts']),'partBounds':[{'part':p['part'],'files':p['fileCount'],'edges':p['edges'],'bytes':p['sourcePlusRecordBytes'],'indivisibleOversize':p['indivisibleOversize']} for p in index['parts']],'protectedBindingsChecked':len(critical),'protectedDrift':drift,'priorFullProtectedBindingsChecked':len(frozen),'priorFullProtectedReceipt':'step-03-wave5g-initial-verification.json','priorFullProtectedReceiptSha256':sha((P/'step-03-wave5g-initial-verification.json').read_bytes()),'protectedBindingsMapSha256':sha((P/'step-03-wave5g-protected-bindings.json').read_bytes()),'protectionScope':'Initial 4146-binding scan passed before locator correction; final replay rechecks prior canonical records, controls/helpers/probes, all input review requests, owner/progress/authoring request and both protected reproduction manifests. Corrections afterward touched only new records and new wave5g artifacts; unrelated historical corpus is not redundantly reread.','trackedChanges':tracked,'newPaths':new,'fullChecker':{'files':checker['files'],'edges':checker['edges'],'failures':checker['failureCount'],'checkedBatches':len(checker['checkedBatches'])},'openLeadRulingEdgesPerSet':checker['openLeadRulingEdgesPerSet'],'labelFormExceptions':[],'gitDiffCheckExit':diffrun.returncode,'commands':['env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-wave5g-verify.py','env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-wave5g-verify.py --freeze','env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-wave5g-packet.py','env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-wave5g-replay.py'],'limits':['Author receipts only; independent semantic review and set closure not claimed.','No npm suite or probes rerun; no production code or consumer edits.','No runtime/default-root/writer parity proof or Phase 9 authorization.','Actual-commit accounting and later source/target drift revalidation belong to Lead.','No MDView MCP available; no preview/service/CLI started.']}
 (P/'step-03-wave5g-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:out[k] for k in ('newFiles','newEdges','selectedFiles','selectedEdges','reviewParts','protectedBindingsChecked','fullChecker')},ensure_ascii=False))
if __name__=='__main__':main()
