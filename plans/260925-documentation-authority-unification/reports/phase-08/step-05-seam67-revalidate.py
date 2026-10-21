"""Revalidate full corpus and affected batch7 after the final p05 text correction."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,time,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
previous=json.loads((P/'step-05-seam67-final-proof.json').read_text());assert previous['ok']
save('step-05-seam67-before-last-note-proof.json',previous)
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env['PYTHONDONTWRITEBYTECODE']='1';env['TMPDIR']='/tmp/fgos-work'
updates=[]
for label,script,result,args in [('full-check','step-05-check.py','step-05-seam67-full-check.json',['--output','step-05-seam67-full-check.json']),('batch7','step-05-seam5-batch7-probes.py','step-05-seam5-batch7-probes-result.json',[])]:
 start=time.time_ns();log=P/('step-05-seam67-proof-'+label+'.log');cmd=[sys.executable,'-B',str(P/script),*args]
 with log.open('w') as stream:run=subprocess.run(cmd,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT)
 data=json.loads((P/result).read_text());fresh=(P/result).stat().st_mtime_ns>=start
 e={'label':label,'command':cmd,'startedAtNs':start,'exit':run.returncode,'resultFresh':fresh,'sourcePath':str((P/script).relative_to(ROOT)),'sourceSha256':sha(P/script),'logPath':str(log.relative_to(ROOT)),'logSha256':sha(log),'resultPath':str((P/result).relative_to(ROOT)),'resultSha256':sha(P/result),'counts':{k:data[k] for k in ['passed','total','positivePassed','positiveTotal','baselineFailures','failureCount','files','literalReferences','dynamicTuples'] if k in data}}
 e['ok']=run.returncode==0 and fresh and not data.get('failures') and (data.get('passed')==data.get('total') if 'total' in data else data.get('failureCount')==0)
 save('step-05-seam67-proof-'+label+'.json',e);updates.append(e);print(json.dumps(e),flush=True);assert e['ok'],e
previous['proofs']=[next((e for e in updates if e['label']==old['label']),old) for old in previous['proofs']]
previous['metadataRevalidation']={'reason':'Final p05 scalar-object reason and matching canonical review hashes only; no source pin, operand, admission or disposition change. Full checker and affected batch7 probes rerun. Other probe families retain their actual completed evidence.','revalidated':['full-check','batch7'],'previousProof':'step-05-seam67-before-last-note-proof.json'}
assert all(e['ok'] for e in previous['proofs'])
save('step-05-seam67-final-proof.json',previous)
print('final p05 metadata revalidation passed',flush=True)
