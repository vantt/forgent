"""Batch 6 judgments via the existing complete-file record builder; no product mutation."""
import sys
sys.dont_write_bytecode=True
import ast,pathlib,json,re,subprocess,collections,importlib.util,copy,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
PIN='5eb9dc609f303fc9d54377f866b5e8caf9a5d129';selection=json.loads((P/'step-05-seam5-batch6-selection.json').read_text());selection['inputCommit']=PIN
builder=(P/'step-05-seam5-batch4-author-judgment.py').read_text()
for n in ast.parse(builder).body:
 if isinstance(n,ast.FunctionDef) and n.name in ['dump','relative','git','mode','pininput','witness','span','ownership','basename']:exec(compile(ast.Module(body=[n],type_ignores=[]),str(P/'step-05-seam5-batch4-author-judgment.py'),'exec'))
jsownership=ownership
def ownership(ls):
 out=jsownership(ls)
 if out:return out
 # Rust tests/support and immutable replay fixtures use their real owning
 # declarations/import consumers, never an invented node:test callback.
 starts=[i for i,t in enumerate(ls,1) if re.match(r'\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+',t)]
 if not starts:starts=[1]
 return [{'declarationLine':a,'declaration':ls[a-1],'assertions':[{'line':i,'text':ls[i-1]} for i in range(a,(starts[k+1] if k+1<len(starts) else len(ls)+1)) if re.search(r'\bassert(?:_\w+)?!|\bassert\.\w+\(|\bexpect\(',ls[i-1])]} for k,a in enumerate(starts)]
DEAD='__none__';NOTES={};BLOCKS={};roots=['docs/platform','docs/knowledge','docs/reference','docs/tutorials'];queries=[];lookup=[]
for term in ['check-rollup-progress','confinement-authority','doc-governance.md','docs/specs/platform-foundations.md']:
 cmd=['git','grep','-n','-F',term,PIN,'--',*roots];q=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True);queries.append({'query':term,'command':cmd,'exit':q.returncode,'matches':q.stdout.splitlines(),'stdoutSha256':b.sha(q.stdout)})
dump('step-05-seam5-batch6-search-evidence.json',{'inputCommit':PIN,'roots':roots,'queries':queries,'aliasLookups':[]})
HELP='test/report/helpers/docs-index-state-fixture.mjs';SHIPPED='test/scripts/generate-shipped-path-inventory.test.mjs'
BLOCKS={
 'rollup-capture':'REAL_DEMO_DOC_PATH seeds the exact capture read through a symlink to real docs. Co-cut the capture path, actual promoted rollup holder and test/report/enduser-index.test.mjs reference-004330/dynamic-021552 after generator dynamic-009788/dynamic-009791 alias membership settles; preserve sourceCaptureId doc-fgos-rollup-howto.',
 'runner-exists':'The real repository classifier asserts runner.md exists, has platform-specification-or-doctrine sourceRole and isSafeRewriteTarget true. docs/specs retires; Step 7 must select the promoted runner spec and co-cut classifier taxonomy and all five assertions at 449-453; do not turn the existence case into a stale-path case.',
 'generated-mirror':'The real repository classifier expects the generated docs/specs/platform-foundations.md projection to exist with generated-projection-non-authority role and isSafeRewriteTarget false. Step 7 must bind a surviving generated projection (not the canonical laws holder) before retiring this file; preserve all five classifier assertions at 473-477.'}
def classification(f,ls,line,expr,identity=None,dynamic=False):
 src=ls[line-1];comment=src.lstrip().startswith(('//','/*','*'));key=basename(f)
 def reject(cat,why):return ('REJECT','preserve',cat,None,f+': '+why+' '+repr(expr),None)
 def admit(why,operand=None,group=None):return ('ADMIT','parked' if group else 'preserve',None,operand or expr,f+': '+(BLOCKS[group] if group else why),group)
 if '/fixtures/' in f:
  return reject('config-or-metadata','Immutable recorded runtime transcript/result payload, not an executing document operation. Preserve exact fixture mode/hash/source provenance; owning parser replay must not rewrite historical output.')
 if comment:
  if 'docs/history' in expr:return admit('R16: dated history comment pointer; provenance spelling preserved.')
  if 'docs/architect' in expr:return admit('Dated design/proof citation; docs/architect tree retires. Proposal carriers are non-canonical; eligible live-holder comment patches are determined separately by S2.')
  if 'docs/' in expr:return admit('Document comment pointer preserved pending source-grounded S2 holder check; no assertion change inferred.')
  return reject('comment-or-type','Comment/type/code locator, not a document operation.')
 if f==HELP:
  if line==35:return admit('',expr,'rollup-capture')
  if line==46:return admit('Real retained docs-root symlink; both operands reference the genuine repository tree and keep its read-set contract.',"path.join(REPO_ROOT, 'docs')")
 if f==SHIPPED and line in [448,472]:return admit('',expr,'runner-exists' if line==448 else 'generated-mirror')
 if f==SHIPPED and line==464:return admit('Intentional retired-decision negative probe: the numbered corpus must stay absent; preserve stale/dead classification and all negative assertions.')
 if f=='test/scripts/check-doc-candidate-status.test.mjs' and line==41:return admit('Copies retained real docs/doc-governance.md into a throwaway fixture. Source read retained; destination is test-owned.',"path.join(REPO_ROOT, 'docs/doc-governance.md')")
 if f=='test/scripts/check-doc-constitution.test.mjs' and line==713:return admit('Copies retained real docs/doc-governance.md; all temporary governance fixtures remain test-owned.',"path.join(REPO_ROOT, 'docs/doc-governance.md')")
 if f=='test/runner/operation-choice.test.mjs' and line in [1169,1174,1175,1176,4299,4306] and 'docs/' in expr:return admit('R6/L12-72: document context paths compared to emitted unit inputs/contextRefs. Synthetic fixture paths, no repository file lookup; preserve exact fixture semantics.')
 if f=='test/setup/knowledge-doctor.test.mjs' and line in [28,29,127,184,185] and 'docs/' in expr:return admit('Fixed fixture path compared against emitted registry Markdown/doctor diagnostic. Synthetic tmp-root fixture, not retained repository documentation.')
 if re.match(r'\s*(?:test|it)\(',src) and 'docs/' in expr:return admit('Runtime test title is a baseline key; preserve exact title and track any owning co-cut separately.')
 if re.search(r'path\.(join|resolve)\(|\.join\(',expr):return reject('state-event-store' if '.fgos' in expr or 'events.jsonl' in expr else 'non-document-fs-probe','Test-owned scratch/state/source/fixture path construction. Real docs-root exceptions are separately enumerated above; no authority lookup here.')
 if expr.startswith('`'):return reject('text-label-join','Scalar/test-label serialization; no independent real document path operation.')
 return reject('config-or-metadata' if 'docs/' in expr else 'root-only' if re.search(r'import.meta|__dirname',expr) else 'scalar-pass-through','In-memory fixture, root/script locator or scalar input. Preserve fixture cases including intentional old/dead paths; no real document navigation is compared here.')
refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for e in b.rows('step-05-population-references.jsonl'):refs[e['file']].append(e)
for e in b.rows('step-05-population-dynamic.jsonl'):dyn[e['file']].append(e)
loop=builder[builder.index('rs=[];receipts=[];readset=[]'):].replace('batch4','batch6').replace('batch-4','batch-6').replace('b4-','b6-')
# The one schema builder stays shared; adapt only metadata for non-node owners.
exec(compile(loop,str(P/'step-05-seam5-batch4-author-judgment.py')+'[reused loop]','exec'))
rs=b.rows('step-05-records/tests-judgment-batch6.jsonl');rc=json.loads((P/'step-05-seam5-batch6-parity-receipts.json').read_text())
for r,receipt in zip(rs,rc['receipts']):
 f=r['file'];ls=b.body(PIN,f).splitlines()
 for e in r['references']:
  if all(ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text'] for w in e['sourceSpans']):continue
  oldpin=e['inventoryOrigins'][0]['pin'];oldls=b.body(oldpin,f).splitlines();mapping={}
  for tag,a,z,c,d in difflib.SequenceMatcher(None,oldls,ls,autojunk=False).get_opcodes():
   if tag=='equal':mapping.update({i+1:c+i-a+1 for i in range(a,z)})
  spans=[]
  for w in e['sourceSpans']:
   n=mapping.get(w['line'])
   if n is None:
    hits=[i for i,t in enumerate(ls,1) if w['text'] in t];assert len(hits)==1,(f,e['referenceId'],hits);n=hits[0]
   k=ls[n-1].index(w['text']);spans.append(dict(w,line=n,columnStart=k+1,columnEndExclusive=k+len(w['text'])+1))
  e['sourceSpans']=spans;ps=span(ls,spans[0]['line']);e['passage']=ps['text'];e['passageSpan']={k:v for k,v in ps.items() if k!='text'}
 r['authorAssessment']='Pinned whole source classified by actual operand; exact ownership and immutable fixture provenance retained. R21 evaluated before judgment; unresolved neutral proof is not assumed.'
 if f.endswith('.rs'):
  raw=b.body(PIN,f);r['proofOwnerKind']='Rust owning declarations/assertions';cmd='env -u CLAUDE_CODE_SESSION_ID cargo test --workspace (Phase 9 owner; not run in records-only turn)'
 elif not jsownership(ls):
  r['proofOwnerKind']='Imported helper / immutable replay fixture';cmd='Phase 9 owning importer replay (not run under records-only contract)'
  q=subprocess.run(['git','grep','-n','-F',pathlib.PurePosixPath(f).name,PIN,'--','test','packages','apps'],cwd=ROOT,text=True,capture_output=True);r['importingProofWitness']={'command':q.args,'exit':q.returncode,'matches':q.stdout.splitlines(),'sha256':b.sha(q.stdout)}
 else:cmd=receipt['proofs'][0]['command']
 for e in r['references']+r['dynamicTraces']+r['authorAddedReferences']:
  n=e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'));x=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]);comment=ls[n-1].lstrip().startswith(('//','/*','*'));e['proofCommand']=cmd
  if e['admission']=='ADMIT':
   e['role']='comment-provenance' if comment else 'test-title' if re.match(r'\s*(test|it)\(',ls[n-1]) else 'real-document-reader' if f in [HELP,SHIPPED] else 'document-path-comparison';e.pop('fixtureProvenance',None);e['resolverWitness']['scope']='actual pinned '+e['role']+'; synthetic paths remain fixtures, never claimed retained'
  if 'originalTuple' in e and e['admission']=='REJECT':e['rejectedAsUnrelatedReason']=e['reason']
  if re.search(r'docs/decisions/\d{4}-|0000-index\.md',x):e['successorNote']='docs/decisions/index.md'
  if e['disposition']=='parked':
   e['searchWitness']['evidenceFile']=relative('step-05-seam5-batch6-search-evidence.json');e['searchWitness']['evidenceSha256']=b.sha((P/'step-05-seam5-batch6-search-evidence.json').read_bytes());e['searchWitness']['queries']=[q['query'] for q in queries];e['searchWitness']['aliasLookupSources']=[]
 receipt['proofs'][0]['command']=cmd
 receipt['comparison']['comparedFields']=json.loads((P/'step-05-parity-receipt-template.json').read_text())['seamTemplates']['real-file-tests-goldens']['requiredComparisons']
(P/'step-05-records/tests-judgment-batch6.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs));dump('step-05-seam5-batch6-parity-receipts.json',rc);dump('step-05-seam5-batch6-selection.json',selection)
