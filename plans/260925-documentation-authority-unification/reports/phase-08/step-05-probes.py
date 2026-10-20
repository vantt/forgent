"""Mutation probes for each Step 5 checker rule. No fixture or consumer writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,copy,json,hashlib
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('s5',P/'step-05-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
BASE=m.load();RECEIPTS=m.read('step-05-pilot-parity-receipts.json')['receipts'];INDEX=m.read('step-05-pilot-review-index.json')
patchindex=next(i for i,r in enumerate(BASE) if r['diff']);commentindex=next((i,j) for i,r in enumerate(BASE) for j,e in enumerate(r['references']) if e['admission']=='REJECT');parkindex=next((i,j) for i,r in enumerate(BASE) for j,e in enumerate(r['references']) if e['disposition']=='parked')
probes=[]
def run(name,rule,mutate,packets=False):
 rs=copy.deepcopy(BASE);receipts=copy.deepcopy(RECEIPTS);index=copy.deepcopy(INDEX)
 mutate(rs,receipts,index)
 out=m.check(rs,receipts,index,check_packets=packets);failures=[e for e in out['failures'] if e['rule']==rule]
 probes.append({'name':name,'owningRule':rule,'pass':bool(failures),'caught':failures[:2]})

def mutate_ref(rs,field,value):rs[commentindex[0]]['references'][commentindex[1]][field]=value
run('Omitting one selected literal fails complete coverage','coverage',lambda rs,rc,ix:rs[0]['references'].pop())
run('Dropping a dynamic superset tuple cannot silently shrink admission','coverage',lambda rs,rc,ix:rs[0]['dynamicTraces'].pop())
run('Changing a frozen original tuple is rejected','coverage',lambda rs,rc,ix:rs[0]['dynamicTraces'][0]['originalTuple'].__setitem__(4,'invented operation'))
run('Whole-file digest drift cannot inherit acceptance','source-pins',lambda rs,rc,ix:rs[0].__setitem__('sourceSha256','0'*64))
run('Untrue whole-file read declaration is rejected','source-pins',lambda rs,rc,ix:rs[0].__setitem__('wholeFileRead',False))
run('A prior canonical record digest cannot be changed','source-pins',lambda rs,rc,ix:next(r for r in rs if r['priorRecordRefs'])['priorRecordRefs'][0].__setitem__('recordSha256','0'*64))
run('Physical token corruption is rejected','source-spans',lambda rs,rc,ix:rs[0]['references'][0]['sourceSpans'][0].__setitem__('text','not the source'))
run('Generic unrelated rejection without own passage is rejected','rejections',lambda rs,rc,ix:mutate_ref(rs,'reason','unrelated'))
run('A rejected comment cannot carry a behavioral patch','rejections',lambda rs,rc,ix:mutate_ref(rs,'disposition','patch'))
run('A park without its blocker is rejected','parks',lambda rs,rc,ix:rs[parkindex[0]]['references'][parkindex[1]].__setitem__('blockedReason',None))
run('An unrelated extra full-file hunk is rejected','patches',lambda rs,rc,ix:rs[patchindex].__setitem__('diff',rs[patchindex]['diff']+'\n+unexpected code\n'))
run('A wrong candidate output digest is rejected','patches',lambda rs,rc,ix:rs[patchindex].__setitem__('expectedAfterSha256','0'*64))
run('Missing inverse rollback is rejected','patches',lambda rs,rc,ix:rs[patchindex].__setitem__('rollbackDiff',None))
def wrongtarget(rs,rc,ix):
 e=next(e for e in rs[patchindex]['references'] if e['disposition']=='patch');e['target']='docs/knowledge/decisions-index/decision-record.md';e['resolverWitness']['targetSha256']=m.sha((m.ROOT/e['target']).read_bytes())
run('Frozen decision-index rename copy is not a generator target','targets',wrongtarget)
def aliaswrite(rs,rc,ix):next(e for e in rs[patchindex]['references'] if e['disposition']=='patch')['aliasWriteCheck']['destinationIsAlias']=True
run('An alias writer destination is refused','targets',aliaswrite)
run('A diff on a generated output is refused','generated',lambda rs,rc,ix:rs[patchindex].__setitem__('file','docs/decisions/index.md'))
run('A missing receipt comparison field is rejected','receipts',lambda rs,rc,ix:rc[0]['comparison']['comparedFields'].pop())
run('A missing per-file seam receipt join is rejected','receipts',lambda rs,rc,ix:rs[0].__setitem__('receiptIds',[]))
def fakepass(rs,rc,ix):next(p for p in rc[0]['proofs'] if p['status']=='missing').update(status='pass',exit=0)
run('Missing HTTP proof cannot become pass without execution log','missing-proof',fakepass)
run('A proof log digest is validated against actual bytes','missing-proof',lambda rs,rc,ix:rc[0]['proofs'][0].__setitem__('logSha256','0'*64))
run('HTTP file equality cannot replace missing response proof','gateway',lambda rs,rc,ix:rc[0].__setitem__('proofs',[p for p in rc[0]['proofs'] if p['status']!='missing']))
run('Missing-file HTTP JSON status drift is detected','gateway',lambda rs,rc,ix:rc[0]['comparison']['currentOutputSet'][0]['failure'].__setitem__('status',200))
run('An unreviewed instruction scan-root delta is detected','setup',lambda rs,rc,ix:rc[2]['comparison']['scanRootDeltas']['instructionRootsCandidate'].append('docs/specs'))
run('A dropped emitted-message intentional delta is detected','message-deltas',lambda rs,rc,ix:rc[1]['comparison']['intentionalDeltas'].clear())
run('Oversized or unbound review payload metadata is refused','review',lambda rs,rc,ix:ix['parts'][0].__setitem__('bytes',400001),True)
def erase_fixture(rs,rc,ix):next(e for r in rs for e in r['references'] if e['role']=='synthetic-fixture').__setitem__('fixtureProvenance',None)
run('Synthetic fixture cannot lose constructor/test provenance','fixture-provenance',erase_fixture)
def lose_proof(rs,rc,ix):next(e for r in rs for e in r['references'] if e['admission']=='ADMIT').pop('proofCommand')
run('Every admitted reference retains its owning proof command or explicit missing','receipts',lose_proof)
base=m.check(BASE,RECEIPTS,INDEX)
assert base['failureCount']==0,base['failures'][:3]
covered={p['owningRule'] for p in probes};assert covered==set(m.RULES)
result={'kind':'Step 5 checker mutation probes','baselineFailures':base['failureCount'],'rulesCovered':sorted(covered),'probes':probes,'passed':sum(p['pass'] for p in probes),'total':len(probes),'failures':[p for p in probes if not p['pass']]}
(P/'step-05-pilot-probes-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='probes'},ensure_ascii=False));sys.exit(bool(result['failures']))
