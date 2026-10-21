"""Pinned pure scratch replay of new comment-only test patches under R22."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,tempfile,re,hashlib,posixpath
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
specs=read('step-05-seam5-b6-review-cutover-specs.json')['patches'];receipts=read('step-05-seam5-batch6-parity-receipts.json');outputs=[]
for spec in specs:
 f=spec['file']
 if f!='test/runner/dispatch-worker-home.test.mjs':continue
 pin=spec['inputCommit'];cache={}
 def source(path):
  if path not in cache:cache[path]=subprocess.check_output(['git','show',pin+':'+path],cwd=ROOT)
  return cache[path]
 todo=[f];seen=set()
 while todo:
  path=todo.pop()
  if path in seen:continue
  seen.add(path);text=source(path).decode()
  for rel in re.findall(r'''(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]''',text):todo.append(posixpath.normpath(posixpath.join(posixpath.dirname(path),rel)))
 assert not any(p.startswith('.fgos/') for p in seen)
 env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.pop('NODE_OPTIONS',None);env['TMPDIR']='/tmp/fgos-work';env['PYTHONDONTWRITEBYTECODE']='1';proofs=[];sets=[];manifests=[]
 for side in ['current','candidate']:
  with tempfile.TemporaryDirectory(prefix='s5-review-replay-',dir='/tmp/fgos-work') as scratch:
   files=[]
   for path in sorted(seen):
    raw=spec['newText'].encode() if side=='candidate' and path==f else source(path);dest=pathlib.Path(scratch)/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);mode=subprocess.check_output(['git','ls-tree',pin,'--',path],cwd=ROOT,text=True).split()[0];dest.chmod(int(mode[-3:],8));files.append({'path':path,'sha256':sha(raw),'bytes':len(raw),'mode':mode})
   pr=subprocess.run(['node','--test',f],cwd=scratch,env=env,text=True,capture_output=True);raw=pr.stdout+pr.stderr;log='step-05-seam5-b6-review-'+pathlib.Path(f).stem+'-'+side+'.log';(P/log).write_text(raw)
   assert pr.returncode==0,raw
   outcomes=[re.sub(r' \([0-9.]+ms\)$','',line) for line in raw.splitlines() if line.startswith(('✔','✖')) or re.match(r'ℹ (?:tests|pass|fail|cancelled|skipped|todo) ',line) or re.match(r'(?:ok|not ok) \d+ - ',line)]
   assert outcomes;sets.append(outcomes);proofs.append({'side':side,'command':'env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test '+f,'cwd':'disposable pinned scratch','status':'pass','exit':pr.returncode,'logPath':str((P/log).relative_to(ROOT)),'logSha256':sha(raw),'owningBehavior':'All original assertions; only navigation comments change.'});manifests.append({'side':side,'inputCommit':pin,'files':files,'exit':pr.returncode})
 assert sets[0]==sets[1]
 rc=next(x for x in receipts['receipts'] if x['id']==spec['receiptId']);rc['proofs']=proofs;rc['comparison']['currentOutputSet']=rc['comparison']['candidateOutputSet']=[{'file':f,'outcomes':sets[0],'normalization':'Wall-clock durations only; titles and every outcome/count preserved.'}];outputs.append({'file':f,'equalOutcomes':True,'manifests':manifests,'proofs':proofs,'outcomes':sets[0]})
 print('equal replay',f,sets[0][-6:],flush=True)
save('step-05-seam5-batch6-parity-receipts.json',receipts);save('step-05-seam5-b6-review-replay-manifests.json',{'replays':outputs,'scope':'Pure scratch current/candidate full owning tests; no CLI, git fixture, .fgos state, service or secrets read.'})
