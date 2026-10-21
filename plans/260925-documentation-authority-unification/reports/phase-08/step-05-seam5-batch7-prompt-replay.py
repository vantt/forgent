"""R25 pure scratch replay of the existing prompt/golden atomic candidate."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,os,tempfile,re,hashlib,posixpath
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def sha(raw):return hashlib.sha256(raw).hexdigest()
rc=read('step-05-seam5-parity-receipts.json')['receipts'][0];specs={s['file']:s for s in read('step-05-seam5-cutover-specs.json')['patches']};pin=rc['inputCommit'];test='test/runner/prompt-templates.test.mjs';cache={}
def source(f):
 if f not in cache:cache[f]=subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT)
 return cache[f]
# Imports in the golden template are text, not module dependencies. Scan only
# the import preamble of this owning test, then the complete imported modules.
todo=[test];seen=set()
while todo:
 f=todo.pop()
 if f in seen:continue
 seen.add(f);text=source(f).decode();text=text[:text.index("test('")] if f==test else text
 for rel in re.findall(r'''(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]''',text):todo.append(posixpath.normpath(posixpath.join(posixpath.dirname(f),rel)))
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',pin,'--','src/runner/prompt-templates','domains'],cwd=ROOT,text=True).splitlines();seen.update(f for f in paths if f.startswith('src/runner/prompt-templates/') or f.endswith('/compiled.json'))
assert not any(f.startswith('.fgos/') for f in seen)
env=os.environ.copy();env.pop('CLAUDE_CODE_SESSION_ID',None);env.pop('NODE_OPTIONS',None);env['TMPDIR']='/tmp/fgos-work';results=[];sets=[]
for side in ['current','candidate']:
 with tempfile.TemporaryDirectory(prefix='s5-b7-prompt-',dir='/tmp/fgos-work') as scratch:
  manifest=[]
  for f in sorted(seen):
   raw=specs[f]['newText'].encode() if side=='candidate' and f in specs else source(f);path=pathlib.Path(scratch)/f;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw);mode=subprocess.check_output(['git','ls-tree',pin,'--',f],cwd=ROOT,text=True).split()[0];path.chmod(int(mode[-3:],8));manifest.append({'path':f,'sha256':sha(raw),'bytes':len(raw),'mode':mode})
  cmd=['node','--test',test];pr=subprocess.run(cmd,cwd=scratch,env=env,text=True,capture_output=True);raw=pr.stdout+pr.stderr;log=P/('step-05-seam5-batch7-prompt-'+side+'-tests.log');log.write_text(raw);assert pr.returncode==0,raw
  outcomes=[re.sub(r' \([0-9.]+ms\)$','',line) for line in raw.splitlines() if line.startswith(('✔','✖')) or re.match(r'ℹ (?:tests|pass|fail|cancelled|skipped|todo) ',line) or re.match(r'(?:ok|not ok) \d+ - ',line)];assert outcomes;sets.append(outcomes);results.append({'side':side,'command':'env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test '+test,'inputCommit':pin,'exit':pr.returncode,'status':'pass','logPath':str(log.relative_to(ROOT)),'logSha256':sha(raw.encode()),'files':manifest,'outcomes':outcomes})
assert sets[0]==sets[1]
(P/'step-05-seam5-batch7-prompt-replay-manifests.json').write_text(json.dumps({'equalOutcomes':True,'manifests':results,'scope':'Same pinned scratch readset; two exact atomic source/golden substitutions. Independent acceptance and composed Phase 9 full suite remain owed.'},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'equalOutcomes':True,'outcomes':sets[0]}))
