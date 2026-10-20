"""Reproduce report-only checkers/probes; no fgOS CLI or product mutations."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,os,json,time,hashlib,datetime
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1';started=time.monotonic();proofs=[]
jobs=[('step-05-check.py',['--output','step-05-full-check-result.json'],'step-05-seam5-batch3-full-check.log','step-05-full-check-result.json'),('step-05-probes.py',[],'step-05-seam5-batch3-pilot-probes.log','step-05-pilot-probes-result.json'),('step-05-seam4-probes.py',[],'step-05-seam5-batch3-generator-probes.log','step-05-seam4-probes-result.json'),('step-05-seam5-probes.py',[],'step-05-seam5-batch3-prompt-probes.log','step-05-seam5-probes-result.json'),('step-05-seam5-batch2-probes.py',[],'step-05-seam5-batch3-prior-probes.log','step-05-seam5-batch2-probes-result.json'),('step-05-seam5-batch3-probes.py',[],'step-05-seam5-batch3-probes.log','step-05-seam5-batch3-probes-result.json')]
for script,args,log,result in jobs:
 cmd=[sys.executable,'-B',str(P/script),*args];print('Running '+script,flush=True)
 jobStartedNs=time.time_ns()
 with (P/log).open('w') as out:proc=subprocess.run(cmd,cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT)
 fresh=(P/result).exists() and (P/result).stat().st_mtime_ns>=jobStartedNs
 r=json.loads((P/result).read_text()) if fresh else {};proofs.append({'command':cmd,'exit':proc.returncode,'resultFresh':fresh,'logPath':str((P/log).relative_to(ROOT)),'logSha256':hashlib.sha256((P/log).read_bytes()).hexdigest(),'resultPath':str((P/result).relative_to(ROOT)),'resultSha256':hashlib.sha256((P/result).read_bytes()).hexdigest() if (P/result).exists() else None,'sourceSha256':hashlib.sha256((P/script).read_bytes()).hexdigest(),'counts':{k:r.get(k) for k in ['files','literalReferences','dynamicTuples','failureCount','passed','total'] if k in r}});print(proofs[-1]['counts'], 'exit',proc.returncode,flush=True)
 (P/'step-05-seam5-batch3-verification.json').write_text(json.dumps({'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'elapsedVerificationSeconds':round(time.monotonic()-started,3),'status':'pass' if len(proofs)==len(jobs) and all(p['exit']==0 for p in proofs) else 'incomplete','proofs':proofs},ensure_ascii=False,indent=2)+'\n')
 if proc.returncode:sys.exit(proc.returncode)
