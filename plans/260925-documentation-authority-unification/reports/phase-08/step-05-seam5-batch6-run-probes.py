"""Run existing independent probes with honest exit/freshness receipts."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,os,json,time,hashlib,concurrent.futures
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
JOBS=[('step-05-probes.py','pilot','step-05-pilot-probes-result.json'),('step-05-seam4-probes.py','seam4','step-05-seam4-probes-result.json'),('step-05-seam5-probes.py','prompt','step-05-seam5-probes-result.json'),('step-05-seam5-batch2-probes.py','batch2','step-05-seam5-batch2-probes-result.json'),('step-05-seam5-batch3-probes.py','batch3','step-05-seam5-batch3-probes-result.json'),('step-05-seam5-batch4-probes.py','batch4','step-05-seam5-batch4-probes-result.json'),('step-05-seam5-batch5-probes.py','batch5','step-05-seam5-batch5-probes-result.json')]
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(job):
 script,label,result=job;start=time.time_ns();log=P/('step-05-seam5-batch6-'+label+'-probes.log');cmd=[sys.executable,'-B',str(P/script)]
 with log.open('w') as f:pr=subprocess.run(cmd,cwd=ROOT,env=env,stdout=f,stderr=subprocess.STDOUT)
 fresh=(P/result).exists() and (P/result).stat().st_mtime_ns>=start;r=json.loads((P/result).read_text()) if fresh else {}
 out={'label':label,'command':cmd,'exit':pr.returncode,'resultFresh':fresh,'sourceSha256':sha(P/script),'logPath':str(log.relative_to(ROOT)),'logSha256':sha(log),'resultPath':str((P/result).relative_to(ROOT)) if fresh else None,'resultSha256':sha(P/result) if fresh else None,'counts':{k:r[k] for k in ['passed','total','positivePassed','positiveTotal','baselineFailures'] if k in r}}
 (P/('step-05-seam5-batch6-proof-'+label+'-probes.json')).write_text(json.dumps(out,indent=2)+'\n');return out
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for out in pool.map(run,JOBS):print(json.dumps(out),flush=True)
