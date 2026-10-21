"""Run one independent checker/probe job or aggregate fresh raw proof metadata."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,os,json,time,hashlib,datetime,argparse
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1'
JOBS=[('step-05-check.py',['--output','step-05-full-check-result.json'],'full-check','step-05-full-check-result.json'),('step-05-probes.py',[],'pilot-probes','step-05-pilot-probes-result.json'),('step-05-seam4-probes.py',[],'generator-probes','step-05-seam4-probes-result.json'),('step-05-seam5-probes.py',[],'prompt-probes','step-05-seam5-probes-result.json'),('step-05-seam5-batch2-probes.py',[],'batch2-probes','step-05-seam5-batch2-probes-result.json'),('step-05-seam5-batch3-probes.py',[],'batch3-probes','step-05-seam5-batch3-probes-result.json'),('step-05-seam5-batch4-probes.py',[],'batch4-probes','step-05-seam5-batch4-probes-result.json'),('step-05-seam5-batch5-probes.py',[],'new-probes','step-05-seam5-batch5-probes-result.json')]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
ap=argparse.ArgumentParser();ap.add_argument('--job');args=ap.parse_args()
if args.job:
 script,argv,label,result=next(x for x in JOBS if x[2]==args.job);cmd=[sys.executable,'-B',str(P/script),*argv];log='step-05-seam5-batch5-'+label+'.log';start=time.time_ns();started=time.monotonic()
 with (P/log).open('w') as out:proc=subprocess.run(cmd,cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT)
 fresh=(P/result).exists() and (P/result).stat().st_mtime_ns>=start;r=json.loads((P/result).read_text()) if fresh else {};proof={'label':label,'command':cmd,'exit':proc.returncode,'elapsedSeconds':round(time.monotonic()-started,3),'resultFresh':fresh,'logPath':str((P/log).relative_to(ROOT)),'logSha256':sha(P/log),'resultPath':str((P/result).relative_to(ROOT)),'resultSha256':sha(P/result) if (P/result).exists() else None,'sourceSha256':sha(P/script),'counts':{k:r[k] for k in ['files','literalReferences','dynamicTuples','failureCount','passed','total','positivePassed','positiveTotal'] if k in r}};save('step-05-seam5-batch5-proof-'+label+'.json',proof);print(json.dumps(proof));sys.exit(proc.returncode or (not fresh))
proofs=[]
for script,argv,label,result in JOBS:
 proof=json.loads((P/('step-05-seam5-batch5-proof-'+label+'.json')).read_text());assert proof['exit']==0 and proof['resultFresh'] and proof['sourceSha256']==sha(P/script) and proof['logSha256']==sha(ROOT/proof['logPath']) and proof['resultSha256']==sha(ROOT/proof['resultPath']),label;proofs.append(proof)
save('step-05-seam5-batch5-verification.json',{'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'pass','proofs':proofs,'negativePassed':sum(p['counts'].get('passed',0) for p in proofs),'negativeTotal':sum(p['counts'].get('total',0) for p in proofs),'authorVerificationOnly':True,'independentReview':'pending Lead','phase9FullSuite':'pending'});print('all 8 jobs pass')
