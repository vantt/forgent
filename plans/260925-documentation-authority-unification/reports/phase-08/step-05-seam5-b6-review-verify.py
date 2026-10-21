"""Run remaining independent probe families after the clean integrated baseline.
Each process writes a distinct result/log. No artifact from a stale run counts.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,time,os,hashlib,concurrent.futures
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
JOBS=[('step-05-probes.py','pilot','step-05-pilot-probes-result.json'),('step-05-seam4-probes.py','seam4','step-05-seam4-probes-result.json'),('step-05-seam5-probes.py','prompt','step-05-seam5-probes-result.json'),('step-05-seam5-batch2-probes.py','batch2','step-05-seam5-batch2-probes-result.json'),('step-05-seam5-batch3-probes.py','batch3','step-05-seam5-batch3-probes-result.json'),('step-05-seam5-batch4-probes.py','batch4','step-05-seam5-batch4-probes-result.json'),('step-05-seam5-batch5-probes.py','batch5','step-05-seam5-batch5-probes-result.json'),('step-05-seam5-batch6-probes.py','batch6','step-05-seam5-batch6-probes-result.json'),('step-05-seam5-batch7-probes.py','batch7','step-05-seam5-batch7-probes-result.json'),('step-05-proposed-move-probes.py','r26','step-05-proposed-move-probes-result.json')]
base=read('step-05-seam5-b6-closure-clean-check.json');assert base['failureCount']==0,base['failures'];env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1';env['TMPDIR']='/tmp/fgos-work'
def run(job):
 script,label,result=job;start=time.time_ns();log=P/('step-05-seam5-batch7-proof-'+label+'.log');cmd=[sys.executable,'-B',str(P/script)]
 with log.open('w') as stream:pr=subprocess.run(cmd,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT)
 f=P/result;fresh=f.exists() and f.stat().st_mtime_ns>=start;data=read(result) if fresh else {};proof={'label':label,'command':cmd,'environment':'CLAUDE_CODE_SESSION_ID unset; PYTHONDONTWRITEBYTECODE=1; TMPDIR=/tmp/fgos-work','startedAtNs':start,'exit':pr.returncode,'resultFresh':fresh,'sourcePath':str((P/script).relative_to(ROOT)),'sourceSha256':sha(P/script),'logPath':str(log.relative_to(ROOT)),'logSha256':sha(log),'resultPath':str(f.relative_to(ROOT)) if fresh else None,'resultSha256':sha(f) if fresh else None,'counts':{k:data[k] for k in ['passed','total','positivePassed','positiveTotal','baselineFailures','failureCount'] if k in data}}
 proof['ok']=pr.returncode==0 and fresh and not data.get('failures') and data.get('passed')==data.get('total');(P/('step-05-seam5-batch7-proof-'+label+'.json')).write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print(json.dumps(proof),flush=True);return proof
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(run,JOBS))
out={'ok':all(x['ok'] for x in results),'cleanBaseline':'step-05-seam5-b6-closure-clean-check.json','proofs':results,'failures':[x for x in results if not x['ok']]};(P/'step-05-seam5-b6-review-probe-proof.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');sys.exit(not out['ok'])
