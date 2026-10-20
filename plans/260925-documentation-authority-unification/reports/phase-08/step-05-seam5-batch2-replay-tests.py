"""Replay the existing owning tests over both immutable report input sets.
Only scratch is written. Legacy parked readers remain on both sides: this
proves the proposed path substitutions, never post-retirement readiness.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,tempfile,os,re,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
rc=json.loads((P/'step-05-seam5-batch2-judgment-receipts.json').read_text())['receipts'][0]
specs=json.loads((P/'step-05-seam5-batch2-cutover-specs.json').read_text())['patches'];by={s['file']:s for s in specs};pin=rc['inputCommit'];results=[]
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.pop('NODE_OPTIONS',None);env['TMPDIR']='/tmp/fgos-work';pathlib.Path(env['TMPDIR']).mkdir(parents=True,exist_ok=True)
for side in ['current','candidate']:
 with tempfile.TemporaryDirectory(prefix='seam5-batch2-replay-',dir=env['TMPDIR']) as scratch:
  metadata={i['path']:i for i in rc[side+'Inputs']};helper='test/helpers/process-tmp-root.mjs';paths=list(metadata)+[helper]
  for f in paths:
   raw=by[f]['newText'].encode() if side=='candidate' and f in by else subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT)
   if f in metadata:assert hashlib.sha256(raw).hexdigest()==metadata[f]['sha256'] and len(raw)==metadata[f]['bytes']
   dest=pathlib.Path(scratch)/f;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);os.chmod(dest,int(metadata.get(f,{'mode':'100644'})['mode'][-3:],8))
  cmd=['node','--test','test/docs/decisions-corpus-retired.test.mjs','test/docs/rul11-anchor-phrase.test.mjs'];proc=subprocess.run(cmd,cwd=scratch,env=env,text=True,capture_output=True);raw=proc.stdout+proc.stderr
  outcomes=[re.sub(r' \([0-9.]+ms\)$','',line) for line in raw.splitlines() if line.startswith(('✔','✖')) or re.match(r'ℹ (?:tests|pass|fail|cancelled|skipped|todo) ',line)]
  assert proc.returncode==0,raw;assert outcomes==rc['comparison'][side+'OutputSet'][0]['outcomes'],raw
  print(side+'\n'+raw);results.append({'side':side,'exit':proc.returncode,'outcomes':outcomes,'rawSha256':hashlib.sha256(raw.encode()).hexdigest()})
assert results[0]['outcomes']==results[1]['outcomes']
print(json.dumps({'scope':'same immutable readset; parked legacy readers retained; no post-retirement claim','inputCommit':pin,'equalOutcomes':True,'results':results},ensure_ascii=False))
