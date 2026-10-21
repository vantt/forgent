"""Reproduce L12-90 full-corpus structural checks and all negative probe families.
Logs and intermediate outputs stay in /tmp/fgos-work. Only final proof/result
artifacts are published in the records directory. No consumer/runtime is run.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,time,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
SCRATCH=pathlib.Path('/tmp/fgos-work/final-verification');SCRATCH.mkdir(parents=True,exist_ok=True)
JOBS=[('step-05-check.py','full','step-05-full-check-result.json',[]),('step-05-probes.py','pilot','step-05-pilot-probes-result.json',[]),('step-05-seam4-probes.py','seam4','step-05-seam4-probes-result.json',[]),('step-05-seam5-probes.py','prompt','step-05-seam5-probes-result.json',[])]+[(f'step-05-seam5-batch{n}-probes.py',f'batch{n}',f'step-05-seam5-batch{n}-probes-result.json',[]) for n in range(2,8)]+[('step-05-proposed-move-probes.py','r26','step-05-proposed-move-probes-result.json',[]),('step-05-seam67-probes.py','seam67','step-05-seam67-probes-result.json',[]),('step-05-seam8-check.py','seam8','seam8-probes.json',['--probes','--output',str(SCRATCH/'seam8'/'seam8-probes.json')])]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def save(path,d):path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
BOOTSTRAP='''import pathlib,sys,runpy,os
script,destination,*arguments=sys.argv[1:]
p=pathlib.Path(script).parent;out=pathlib.Path(destination);old=pathlib.Path.write_text
def redirected(path,data,*a,**kw):
 if path.absolute().is_relative_to(p):return old(out/path.name,data,*a,**kw)
 assert path.absolute().is_relative_to(pathlib.Path('/tmp/fgos-work')),str(path)
 return old(path,data,*a,**kw)
pathlib.Path.write_text=redirected
os.environ.pop('CLAUDE_CODE_SESSION_ID',None)
os.environ['PYTHONDONTWRITEBYTECODE']='1'
os.environ['TMPDIR']='/tmp/fgos-work'
sys.argv=[script,*arguments]
runpy.run_path(script,run_name='__main__')
'''
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.update(PYTHONDONTWRITEBYTECODE='1',TMPDIR='/tmp/fgos-work')
def input_snapshot():
 files=set((P/'step-05-records').glob('*.jsonl'))|set(P.glob('step-05*.py'))|set(P.glob('step-05*parity-receipts.json'))|set(P.glob('step-05*review-list.json'))|set(P.glob('step-05*rereview-list.json'))|{P/'step-05-proposed-move-read-units.json',P/'step-05-seam8-proposed-move-read-units.json',P/'step-05-cutover-move-set.json',P/'step-05-state-tree-sweep.json',P/'step-05-final-review-closure.json'}
 return {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in sorted(files)}
frozen_inputs=input_snapshot()
proofs=[]
for script,label,result,args in JOBS:
 directory=SCRATCH/label;directory.mkdir(exist_ok=True);log=directory/'command.log';start=time.time_ns()
 cmd=[sys.executable,'-B','-c',BOOTSTRAP,str(P/script),str(directory),*args]
 with log.open('w') as stream:run=subprocess.run(cmd,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT)
 file=directory/result;fresh=file.exists() and file.stat().st_mtime_ns>=start;data=json.loads(file.read_text()) if fresh else {}
 ok=run.returncode==0 and fresh and not data.get('failures') and (data.get('passed')==data.get('total') if 'total' in data else data.get('failureCount')==0)
 proof={'label':label,'script':script,'arguments':args,'startedAtNs':start,'completedAtNs':time.time_ns(),'exit':run.returncode,'ok':ok,'resultFresh':fresh,'sourceSha256':sha((P/script).read_bytes()),'scratchLog':str(log),'logSha256':sha(log.read_bytes()),'scratchResult':str(file) if fresh else None,'resultSha256':sha(file.read_bytes()) if fresh else None,'counts':{k:data[k] for k in ['passed','total','positivePassed','positiveTotal','baselineFailures','failureCount','files','literalReferences','dynamicTuples'] if k in data}}
 if 'total' in data:proof['probeResults']=data
 proofs.append(proof);save(SCRATCH/'running-proof.json',{'proofs':proofs});print(json.dumps({k:v for k,v in proof.items() if k!='probeResults'}),flush=True)
 if not ok:break
final_inputs=input_snapshot()
complete=len(proofs)==len(JOBS) and all(x['ok'] for x in proofs) and frozen_inputs==final_inputs
report={'inputsUnchangedDuringVerification':frozen_inputs==final_inputs,'inputHashes':final_inputs,'ruling':'L12-90','ok':complete,'proofs':proofs,'negativeProbesPassed':sum(x['counts'].get('passed',0) for x in proofs),'negativeProbesTotal':sum(x['counts'].get('total',0) for x in proofs),'positivePassed':sum(x['counts'].get('positivePassed',0) for x in proofs),'positiveTotal':sum(x['counts'].get('positiveTotal',0) for x in proofs),'recordSetSha256':sha(b''.join(f.read_bytes() for f in sorted((P/'step-05-records').glob('*.jsonl')))),'scope':'Structural source/record checking and negative mutations only. Independent review, state exports, Step7 composition and Phase9 execution/replay remain owed.'}
if complete:
 for name in ['step-05-full-check-result.json','step-05-head-drift.json']:(P/name).write_bytes((SCRATCH/'full'/name).read_bytes())
 save(P/'step-05-final-proof.json',report)
else:save(SCRATCH/'failed-proof.json',report)
print(json.dumps({k:v for k,v in report.items() if k!='proofs'}),flush=True)
sys.exit(not complete)
