"""Fresh sequential checker/probe receipts; stale results never count as success."""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,os,json,time,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
JOBS=[('step-05-check.py','full-check','step-05-seam5-batch7-full-check.json',['--output','step-05-seam5-batch7-full-check.json']),('step-05-probes.py','pilot','step-05-pilot-probes-result.json',[]),('step-05-seam4-probes.py','seam4','step-05-seam4-probes-result.json',[]),('step-05-seam5-probes.py','prompt','step-05-seam5-probes-result.json',[]),('step-05-seam5-batch2-probes.py','batch2','step-05-seam5-batch2-probes-result.json',[]),('step-05-seam5-batch3-probes.py','batch3','step-05-seam5-batch3-probes-result.json',[]),('step-05-seam5-batch4-probes.py','batch4','step-05-seam5-batch4-probes-result.json',[]),('step-05-seam5-batch5-probes.py','batch5','step-05-seam5-batch5-probes-result.json',[]),('step-05-seam5-batch6-probes.py','batch6','step-05-seam5-batch6-probes-result.json',[]),('step-05-seam5-batch7-probes.py','batch7','step-05-seam5-batch7-probes-result.json',[])]
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1';env['TMPDIR']='/tmp/fgos-work'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
proofs=[]
for script,label,result,args in JOBS:
 start=time.time_ns();log=P/('step-05-seam5-batch7-proof-'+label+'.log');cmd=[sys.executable,'-B',str(P/script),*args]
 with log.open('w') as stream:pr=subprocess.run(cmd,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT)
 fresh=(P/result).exists() and (P/result).stat().st_mtime_ns>=start;data=json.loads((P/result).read_text()) if fresh else {};proof={'label':label,'command':cmd,'startedAtNs':start,'exit':pr.returncode,'resultFresh':fresh,'sourcePath':str((P/script).relative_to(ROOT)),'sourceSha256':sha(P/script),'logPath':str(log.relative_to(ROOT)),'logSha256':sha(log),'resultPath':str((P/result).relative_to(ROOT)) if fresh else None,'resultSha256':sha(P/result) if fresh else None,'counts':{k:data[k] for k in ['passed','total','positivePassed','positiveTotal','baselineFailures','failureCount','files','literalReferences','dynamicTuples'] if k in data}}
 proof['ok']=pr.returncode==0 and fresh and not data.get('failures') and (data.get('passed')==data.get('total') if 'total' in data else data.get('failureCount')==0)
 proofs.append(proof);(P/('step-05-seam5-batch7-proof-'+label+'.json')).write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print(json.dumps(proof),flush=True)
 if label=='full-check' and not proof['ok']:break
out={'ok':len(proofs)==len(JOBS) and all(p['ok'] for p in proofs),'proofs':proofs,'negativeProbesPassed':sum(p['counts'].get('passed',0) for p in proofs),'negativeProbesTotal':sum(p['counts'].get('total',0) for p in proofs),'failures':[p for p in proofs if not p['ok']],'scope':'Author structural verification and negative mutations; independent semantic review and composed Phase 9 proofs remain pending.'}
(P/'step-05-seam5-batch7-final-proof.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='proofs'}),flush=True);sys.exit(not out['ok'])
