"""R25: exact deferred replay obligations; never executable proof or passing output."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,importlib.util,difflib,copy
P=pathlib.Path(__file__).resolve().parent
FIELDS=['status','file','inputCommit','sourceSha256','owningTestCommand','owningTests','assertedLines','assertionEffect','expectedStrings','diff','rollbackDiff','coCutPaths','blockerEvidence','phase9Obligation']
def read(f):return json.loads((P/f).read_text())
def changed(spec):
 a=spec['oldText'].splitlines();z=spec['newText'].splitlines();out=[]
 for tag,i,j,k,l in difflib.SequenceMatcher(None,a,z,autojunk=False).get_opcodes():
  if tag!='equal':out.append({'beforeStartLine':i+1,'beforeEndLine':j,'afterStartLine':k+1,'afterEndLine':l,'before':'\n'.join(a[i:j]),'after':'\n'.join(z[k:l])})
 return out

def obligation(spec,r,blocker):
 changes=changed(spec);asserted=[c for c in changes if not all(t.lstrip().startswith(('//','/*','*')) or not t.strip() for t in c['before'].splitlines())]
 tests=[]
 for c in changes:
  candidates=[t for t in r['owningProofs'] if t['declarationLine']<=c['beforeStartLine']]
  if candidates:
   t=max(candidates,key=lambda t:t['declarationLine'])
   if t not in tests:tests.append(t)
 return {'status':'replay-deferred-phase9','file':r['file'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'owningTestCommand':'env -u CLAUDE_CODE_SESSION_ID node --test '+r['file'],'owningTests':tests,'assertedLines':asserted,'assertionEffect':'Changed expected assertion literals/regex must follow the source diagnostic patch; retain every assertion.' if asserted else 'Comment-only pointer patch: no assertion output changes; owning assertion lines remain identical. Full owning replay is still owed in Phase 9.','expectedStrings':changes,'diff':r['diff'],'rollbackDiff':r['rollbackDiff'],'coCutPaths':r['coCutPaths'],'blockerEvidence':blocker,'phase9Obligation':'Replay full owning command on pinned current and composed Phase 9 candidate with complete co-cut set; compare all original assertions, permitting only the exact recorded navigation deltas. No replay or passing outcome is claimed now.'}

def validate(spec,r,receipt,body):
 d=receipt['deferredReplay'];assert all(k in d for k in FIELDS),'R25 deferred replay missing required field'
 blocks=read('step-05-seam5-batch6-replay-blockers.json')['blockers'];block=next(b for b in blocks if b['file']==r['file'])
 assert d==obligation(spec,r,block),'R25 obligation differs from pinned source, exact changed assertions, strings, diffs or co-cut set'
 assert body==spec['oldText'] and d['sourceSha256']==r['sourceSha256']
 s=importlib.util.spec_from_file_location('r25s4',P/'step-05-seam4-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
 assert m.apply(r['file'],body.encode(),d['diff'])==spec['newText'].encode()
 assert m.apply(r['file'],spec['newText'].encode(),d['rollbackDiff'])==body.encode()
 assert receipt['proofs']==[{'command':d['owningTestCommand'],'owningBehavior':d['assertionEffect'],'status':'replay-deferred-phase9','exit':None,'logPath':None,'logSha256':None,'reason':'Lead R25; exact deferredReplay obligation binds pinned bytes and full co-cut unit.'}]
 assert receipt['comparison']['currentOutputSet']==receipt['comparison']['candidateOutputSet']==[],'Deferred replay cannot claim actual outputs'
 return True

if __name__=='__main__':
 rs=[json.loads(l) for fn in ['tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl'] for l in (P/'step-05-records'/fn).read_text().splitlines()];specs=read('step-05-seam5-batch6-cutover-specs.json')['patches'];blocks=read('step-05-seam5-batch6-replay-blockers.json')['blockers'];out=[]
 for fn in ['step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json']:
  data=read(fn)
  for rc in data['receipts']:
   spec=next((s for s in specs if s['receiptId']==rc['id']),None)
   if spec is None:continue
   r=next(r for r in rs if r['file']==spec['file']);d=obligation(spec,r,next(b for b in blocks if b['file']==r['file']));rc['deferredReplay']=d;rc['proofs']=[{'command':d['owningTestCommand'],'owningBehavior':d['assertionEffect'],'status':d['status'],'exit':None,'logPath':None,'logSha256':None,'reason':'Lead R25; exact deferredReplay obligation binds pinned bytes and full co-cut unit.'}];rc['comparison']['candidateScope']='Exact unexecuted patch; replay-deferred-phase9 under R25. Empty output sets represent no execution.';validate(spec,r,rc,spec['oldText']);out.append(d)
  (P/fn).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (P/'step-05-seam5-batch7-deferred-replays.json').write_text(json.dumps({'rule':'R25 / L12-82','count':len(out),'deferredReplays':out,'actualTestsInvoked':False},ensure_ascii=False,indent=2)+'\n')
