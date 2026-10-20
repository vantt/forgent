"""R21 root refusal and R22/R23 record mutations, all in-memory.
No repository source or synthetic git history is written.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,subprocess
P=pathlib.Path(__file__).resolve().parent

def load(name,file):
 s=importlib.util.spec_from_file_location(name,P/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
r=load('root','step-05-seam5-root-rules.py');j=load('judgment4','step-05-seam5-batch4-judgment-check.py');results=[];positive=[]
def test(name,fn,reject=True):
 try:ok=bool(fn())
 except Exception as ex:ok=False;detail=str(ex)
 else:detail=None
 (results if reject else positive).append({'name':name,'passed':ok,'detail':detail})
# These source probes inspect the actual base and keep its provenance in the
# report. Suffix temporary ids must never sanitize a repository/docs base.
file='test/probe-root.mjs'
def expr(source,expression):return r.Roots(r.PIN,file,"import os from 'node:os';\n"+source).expr(expression)
for name,source,expression in [
 ('repository base','const root = process.cwd();','path.join(root, child)'),
 ('docs base',"const root = 'docs/specs';",'path.join(root, child)'),
 ('docs template base',"const root = 'docs/specs';",'`${root}/${child}`'),
 ('temporary suffix on repository base','const root = process.cwd(); const tmp = os.tmpdir();','path.join(root, tmp, child)'),
 ('dynamic external base','const root = externalRoot();','path.join(root, child)'),
 ('mixed local bindings','const root = os.tmpdir(); root = process.cwd();','path.join(root, child)'),
 ('parent escape',"const root = os.tmpdir();","path.join(root, '..', child)"),
 ('absolute resolve suffix','const root = os.tmpdir();',"path.resolve(root, '/docs', child)"),
 ('repo caller','function consume(root) { return path.join(root, child); } consume(process.cwd());','path.join(root, child)'),
 ('mixed callers','function consume(root) { return path.join(root, child); } consume(os.tmpdir()); consume(process.cwd());','path.join(root, child)'),
 ('exported caller','export function consume(root) { return path.join(root, child); } consume(os.tmpdir());','path.join(root, child)'),
 ('escaping function','function consume(root) { return path.join(root, child); } consume(os.tmpdir()); register(consume);','path.join(root, child)')]:test(name,lambda source=source,expression=expression:expr(source,expression) is None)
for name,source,expression in [
 ('temporary descendant','const root = os.tmpdir();','path.join(root, child)'),
 ('temporary template descendant','const root = os.tmpdir();','`${root}/${child}`'),
 ('nested descendant','const root = os.tmpdir(); const sub = path.join(root, "fixture");','path.join(sub, child)'),
 ('home/config root','const home = os.homedir();','path.join(home, ".config", name)'),
 ('state root',"const root = '.fgos/runtime';",'path.join(root, name)'),
 ('test fixture root',"const root = 'test/fixtures';",'path.join(root, name)'),
 ('closed caller','function consume(root) { return path.join(root, child); } consume(os.tmpdir());','path.join(root, child)'),
 ('Rust temporary chain','', 'std::env::temp_dir().join(name)')]:test(name,lambda source=source,expression=expression:expr(source,expression) is not None,False)
test('unknown namespace cannot impersonate os',lambda:r.Roots(r.PIN,file,'const root = other.tmpdir();').expr('path.join(root, child)') is None)
# Repo import transports share one root resolver and source hash witness.
original=r.b.body
module='test/probe-roots.mjs'
for transport,source,expression in [
 ('named',"import { ROOT } from './probe-roots.mjs';",'path.join(ROOT, name)'),
 ('namespace',"import * as paths from './probe-roots.mjs';",'path.join(paths.ROOT, name)'),
 ('CommonJS destructure',"const { ROOT } = require('./probe-roots.mjs');",'path.join(ROOT, name)'),
 ('CommonJS namespace',"const paths = require('./probe-roots.mjs');",'path.join(paths.ROOT, name)')]:
 for bad in [False,True]:
  content="export const ROOT = 'docs/specs';" if bad else "export const ROOT = 'test/fixtures';"
  def body(pin,f,content=content):
   if f==module:return content
   return original(pin,f)
  r.b.body=body
  test(transport+(' moved-root refusal' if bad else ' fixture-root proof'),lambda source=source,expression=expression,bad=bad:(expr(source,expression) is None)==bad,bad)
 r.b.body=original
# Rust const/static bindings and same-crate imports use the same base proof.
for kw in ['const','static']:
 source=kw+' ROOT: &str = "test/fixtures";'
 test('Rust '+kw+' non-document root',lambda source=source:r.Roots(r.PIN,'packages/probe/rust/tests/probe.rs',source).expr('ROOT.join(name)') is not None,False)
old_output=r.subprocess.check_output
for moved in [False,True]:
 target='packages/probe/rust/src/paths.rs';content='pub const ROOT: &str = "'+('docs/specs' if moved else 'test/fixtures')+'";'
 def body(pin,f,content=content):
  if f==target:return content
  return original(pin,f)
 def output(cmd,**kwargs):
  if cmd==['git','ls-tree','-r','--name-only',r.PIN,'--','packages/probe/rust/src']:return target+'\n'
  return old_output(cmd,**kwargs)
 r.b.body=body;r.subprocess.check_output=output
 test('Rust same-crate '+('moved-root refusal' if moved else 'constant proof'),lambda moved=moved:(r.Roots(r.PIN,'packages/probe/rust/tests/probe.rs','use crate::paths::ROOT;').expr('ROOT.join(name)') is None)==moved,moved)
 r.b.body=original;r.subprocess.check_output=old_output
# Fresh baseline must pass before record mutation probes.
baseline=j.check();assert baseline['failureCount']==0,baseline['failures']
rs=j.load();rc=j.m.read('step-05-seam5-batch4-parity-receipts.json')['receipts']
def mutate(name,edit):
 rr=copy.deepcopy(rs);receipts=copy.deepcopy(rc);edit(rr,receipts);out=j.check(rr,receipts);test(name,lambda:out['failureCount']>0)
mutate('drop original tuple',lambda rr,rc:rr[0]['dynamicTraces'].pop())
mutate('corrupt source pin',lambda rr,rc:rr[0].update(sourceSha256='0'*64))
mutate('weaken assertion inventory',lambda rr,rc:rr[0]['owningProofs'][0]['assertions'].pop())
mutate('claim replay passed without execution',lambda rr,rc:rc[0]['proofs'][0].update(status='pass',exit=0))
mutate('drop precise park search',lambda rr,rc:next(e for e in rr[0]['dynamicTraces'] if e['disposition']=='parked')['searchWitness'].update(evidenceSha256='0'*64))
mutate('erase prior known carriage gap',lambda rr,rc:next(e for e in rr[0]['dynamicTraces'] if e['id']=='dynamic-023895').update(disposition='preserve',blockedReason=None))
mutate('invent patch without co-cut/replay',lambda rr,rc:rr[1].update(diff='invented'))
mutate('drop independent judgment review slot',lambda rr,rc:rr[0]['references'][0].update(referenceId='invented'))
mutate('forge preserved recorded source mode',lambda rr,rc:rc[2]['currentInputs'][0].update(mode='100755'))
rootbaseline=r.check();assert rootbaseline['failureCount']==0,rootbaseline['failures']
neutral=r.b.rows('step-05-records/tests-root-neutral.jsonl');bad=copy.deepcopy(neutral);bad[0]['mechanicalClosure']['proof']['sha256']='0'*64;out=r.check(bad);test('forged neutral root evidence',lambda:out['failureCount']>0)
triage=r.b.rows('step-05-seam5-root-triage.jsonl');bad=copy.deepcopy(triage);entry=next(e for e in bad if e['context']['literalHazards']);entry['wholeFileNeutralClosure']=True;out=r.check(triage=bad);test('force moved-root source neutral',lambda:out['failureCount']>0)
out={'baselineJudgmentFailures':baseline['failureCount'],'baselineRootFailures':rootbaseline['failureCount'],'passed':sum(e['passed'] for e in results),'total':len(results),'negativeProbes':results,'positivePassed':sum(e['passed'] for e in positive),'positiveTotal':len(positive),'positiveChecks':positive}
(P/'step-05-seam5-batch4-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(not all(e['passed'] for e in results+positive))
