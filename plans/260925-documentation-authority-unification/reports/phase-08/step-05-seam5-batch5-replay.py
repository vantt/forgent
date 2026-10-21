"""Replay only the comment-patch file, in confined pinned scratch trees.
No fgos CLI, live state, service, or operator secrets are read/run.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,subprocess,json,os,tempfile,re,hashlib,posixpath
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
spec=read('step-05-seam5-batch5-review-cutover-specs.json')['patches'][0];pin=spec['inputCommit'];f=spec['file'];cache={}
def source(path):
 if path not in cache:cache[path]=subprocess.check_output(['git','show',pin+':'+path],cwd=ROOT)
 return cache[path]
# Trace complete in-repo import closure without executing any source module.
todo=[f];todo+=['test/helpers/process-tmp-root.mjs'];seen=set()
while todo:
 path=todo.pop()
 if path in seen:continue
 seen.add(path);raw=source(path);text=raw.decode()
 for rel in re.findall(r'''(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]''',text):todo.append(posixpath.normpath(posixpath.join(posixpath.dirname(path),rel)))
assert not any(p.startswith('.fgos/') for p in seen)
base=pathlib.Path('/tmp/fgos-work');base.mkdir(parents=True,exist_ok=True);proofs=[];sets=[];manifests=[]
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.pop('NODE_OPTIONS',None);env['TMPDIR']=str(base);env['PYTHONDONTWRITEBYTECODE']='1'
for side in ['current','candidate']:
 with tempfile.TemporaryDirectory(prefix='seam5-batch5-replay-',dir=base) as scratch:
  files=[]
  for path in sorted(seen):
   raw=spec['newText'].encode() if side=='candidate' and path==f else source(path);dest=pathlib.Path(scratch)/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);mode=subprocess.check_output(['git','ls-tree',pin,'--',path],cwd=ROOT,text=True).split()[0];os.chmod(dest,int(mode[-3:],8));files.append({'path':path,'sha256':sha(raw),'bytes':len(raw),'mode':mode})
  cmd=['node','--test',f];pr=subprocess.run(cmd,cwd=scratch,env=env,text=True,capture_output=True);raw=pr.stdout+pr.stderr;log='step-05-seam5-batch5-'+side+'-tests.log';(P/log).write_text(raw)
  assert pr.returncode==0,raw
  outcomes=[re.sub(r' \([0-9.]+ms\)$','',line) for line in raw.splitlines() if line.startswith(('✔','✖')) or re.match(r'ℹ (?:tests|pass|fail|cancelled|skipped|todo) ',line) or re.match(r'(?:ok|not ok) \d+ - ',line)]
  assert outcomes;sets.append(outcomes);proofs.append({'side':side,'command':'env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test '+f,'cwd':'disposable scratch materialized from immutable git objects','status':'pass','exit':pr.returncode,'logPath':str((P/log).relative_to(ROOT)),'logSha256':sha(raw),'owningBehavior':'All original worker-session test declarations and assertions; only source header pointer differs.'});manifests.append({'side':side,'inputCommit':pin,'files':files,'exit':pr.returncode})
assert sets[0]==sets[1]
rc=read('step-05-seam5-batch4-parity-receipts.json');receipt=next(r for r in rc['receipts'] if r['id']==spec['receiptId']);receipt['proofs']=proofs;receipt['comparison']['currentOutputSet']=receipt['comparison']['candidateOutputSet']=[{'file':f,'outcomes':sets[0],'normalization':'Only wall-clock durations stripped; exact test titles, pass/fail and counts preserved.'}]
(P/'step-05-seam5-batch4-parity-receipts.json').write_text(json.dumps(rc,ensure_ascii=False,indent=2)+'\n');(P/'step-05-seam5-batch5-replay-manifests.json').write_text(json.dumps({'manifests':manifests,'proofs':proofs,'equalOutcomes':True},ensure_ascii=False,indent=2)+'\n');print('replay equal',sets[0])
