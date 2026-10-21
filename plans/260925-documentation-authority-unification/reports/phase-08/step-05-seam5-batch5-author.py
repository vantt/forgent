"""Reuse batch-4 schema authoring functions/loop; supply bounded source judgments.
All output is report records; no imported product/test module is executed.
"""
import sys
sys.dont_write_bytecode=True
import ast,pathlib,json,re,subprocess,collections,importlib.util,copy,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
PIN='5eb9dc609f303fc9d54377f866b5e8caf9a5d129';selection=json.loads((P/'step-05-seam5-batch5-selection.json').read_text())
# Reuse the existing schema door, including exact witness rebasing and removed
# tuple provenance. Do not copy an alternative record builder alongside it.
builder=(P/'step-05-seam5-batch4-author-judgment.py').read_text();tree=ast.parse(builder)
for n in tree.body:
 if isinstance(n,ast.FunctionDef) and n.name in ['dump','relative','git','mode','pininput','witness','span','ownership','basename']:exec(compile(ast.Module(body=[n],type_ignores=[]),str(P/'step-05-seam5-batch4-author-judgment.py'),'exec'))
DEAD='__none__';NOTES={};roots=['docs/platform','docs/knowledge','docs/reference','docs/tutorials'];queries=[];lookup=[]
for term in ['check-rollup-progress','QUADRANT_DIR_ALIASES','docs/decisions','### 0010','### 0015','### 0017','Product Gates']:
 cmd=['git','grep','-n','-F',term,PIN,'--',*roots];pr=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True);queries.append({'query':term,'command':cmd,'exit':pr.returncode,'matches':pr.stdout.splitlines(),'stdoutSha256':b.sha(pr.stdout)})
for f in ['plans/260925-documentation-authority-unification/alias-table.json','plans/260925-documentation-authority-unification/reports/phase-06/draft-alias-merged-step10.json','docs/doc-registry.json']:
 raw=b.body(PIN,f);data=json.loads(raw);matches=[e for e in data.get('entries',data.get('docs',[])) if any(t in json.dumps(e) for t in ['check-rollup-progress','enduser-docs-index','docs/decisions'])];lookup.append({'path':f,'sha256':b.sha(raw),'matches':matches})
dump('step-05-seam5-batch5-search-evidence.json',{'inputCommit':PIN,'roots':roots,'queries':queries,'aliasLookups':lookup,'policy':'Proposed aliases are not activated; promotion and full-suite parity remain pending.'})
# Distinct actual dependencies, each tied to the owning assertion/read passage.
BLOCKS={
 'demo-find':'The generated manifest find predicate requires the seeded real rollup demo at its old how-to path. Registry proposes the knowledge holder; co-cut REAL_DEMO_DOC_PATH in test/report/helpers/docs-index-state-fixture.mjs and real generator output before changing this predicate.',
 'demo-equality':'The asserted demo.docPath must agree with the seeded capture and fixture constant after rollup-doc relocation; preserve sourceCaptureId doc-fgos-rollup-howto and the exact demo title while composing its generated manifest mapping.',
 'demo-read':'This frontmatter read requires mode/type and source_capture_ids on the real rollup document. Verify the proposed knowledge holder carries both fields and co-cut its direct read with demo-path assertions and the state fixture capture; the generator alias decision remains parked.',
 'alias-decisions-count':'The decisionsCount filesystem enumeration counts every retained index-only decisions entry; bind its exact Phase 9 alias membership to parked dynamic-009788 in src/report/enduser-index-generate.mjs and dynamic-009791 in src/report/enduser-index.mjs before changing this count.',
 'alias-primary-count':'The primaryExplanationCount enumerates real explanation Markdown while registry proposals move some entries into knowledge. Compose its counted legacy subset against the promoted output without replacing the count assertion with a weaker existence test.',
 'alias-filter':'The legacyExplanationEntries filter fixes the decisions/explanation subset of the real generated manifest. Settle explanation alias membership with generator dynamic-009788 and quadrant dynamic-009791; retain one entry per actual source file.',
 'alias-total':'The explanatory assertion compares the counted retained decisions alias plus primary explanation files to exactly that output subset. Resolve the two generator parks and preserve this cardinality equality after final layout composition.',
 'alias-membership':'The per-entry allowed-directory predicate constrains every explanation output to decisions, explanation or knowledge. Its old prefixes must be composed with parked QUADRANT_DIR_ALIASES dynamic-009791 and source enumerator dynamic-009788, never simply removed.',
 'alias-message':'The failure message prints the real enumerated entry.docPath; its allowed-directory assertion is jointly dependent on explanation alias composition, rather than an unrelated scalar diagnostic.',
 'alias-index-find':'The generatedIndex selection requires docs/decisions/index.md to remain included via the explanation alias. Its existence predicate depends on the retained-index alias membership choice in dynamic-009788/dynamic-009791.',
 'alias-index-assert':'The generated decisions-index assertion requires a real manifest entry from the retained directory; final generator alias membership must still satisfy this non-empty proof, with no test skip.',
 'alias-primary-find':'The primaryDoc selection requires at least one backfilled explanation document after registry migration. Verify at final composition that the primary directory still contributes an entry, preserving the independent primary-vs-alias check.'}
# Explicit output comparisons. Their test-owned inputs remain unchanged; none is
# a real repo document lookup or an invitation to patch a fixture spelling.
OUTPUT_LINES={
 'fgos-post-merge-2':{197,200,207,216,219,234},
 'fgos-post-merge':{115,118,186,231},
 'fgos-stage-3':{183,187,192,204,221,239},
 'fgos-preflight':{60,125},
 'fgos-return':{354,370,376},
 'fgos-edit':{225,226,228,229},
 'authoritative-match':{176,179,187,195,206,222,233,237,245,256,259,271},
 'context-render':{180,195},
 'decision-index':{160},
 'dispatch':{229,234,235,237,246},
 'assignment':{139}}
END='test/report/enduser-index.test.mjs';CAP='test/report/capability-plan-lint.test.mjs'
def classification(f,ls,line,expr,identity=None,dynamic=False):
 key=basename(f);src=ls[line-1];comment=src.lstrip().startswith(('//','/*','*'));context=' '.join(ls[max(0,line-2):min(len(ls),line+2)])
 def reject(cat,why):return ('REJECT','preserve',cat,None,why+' '+repr(expr),None)
 def admit(why,operand=None,group=None):return ('ADMIT','parked' if group else 'preserve',None,operand or expr,f+': '+(BLOCKS[group] if group else why),group)
 if comment:
  if 'docs/history' in expr:return admit('R16: dated docs/history comment pointer; preserve provenance.')
  if 'docs/architect/doing-' in expr:return admit('Dated tsk-40m provenance; docs/architect tree retires. docs/platform/proposals/doing-coordination-redesign.md explicitly declares non-canonical status and is not a live patch target.')
  if 'docs/architect/knowledge-registry-redesign.md' in expr:return admit('Dated attestation-contract provenance; docs/architect tree retires. docs/platform/proposals/knowledge-registry-redesign.md is self-declared non-canonical, so preserve as provenance under L12-74 p20.')
  if 'docs/' in expr:return admit('Dated explanatory comment reference; preserve its cited historical spelling; no module-header live-holder pointer in this selected batch.')
  return reject('comment-or-type','Prose/type metadata, not an executing document operand:')
 if f==CAP:
  if line==361:return admit('Real pinned how-to reader supplies fenced Product Gates example and exact zero-unit/zero-finding assertions. This retained path is absent from the cutover move set.',"path.resolve(__dirname, '../../docs/how-to/author-a-plan-loop-track.md')")
  if line in [339,360]:return admit('Emitted node:test title names the fixed document example; baseline key preserved.',expr)
 if f==END:
  ops={17:"path.join(REPO_ROOT, 'docs', 'enduser-docs-index.json')",195:"path.join(REPO_ROOT, 'docs', 'tutorials')",196:"path.join(REPO_ROOT, 'docs', '.tutorials-hidden-for-test')",322:"path.join(REPO_ROOT, 'docs', 'decisions')",323:"path.join(REPO_ROOT, 'docs', 'explanation')",374:"path.join(REPO_ROOT, 'docs', 'decisions')",378:'path.join(decisionsDir, file)',386:"path.join(REPO_ROOT, 'docs', 'how-to', 'check-rollup-progress.md')"}
  groups={162:'demo-find',167:'demo-equality',322:'alias-decisions-count',323:'alias-primary-count',325:'alias-filter',330:'alias-total',334:'alias-membership',335:'alias-message',345:'alias-index-find',346:'alias-index-assert',347:'alias-primary-find',386:'demo-read'}
  if line in ops:return admit('Real retained index/tutorials path and exact frontmatter assertions; post-retirement full-suite parity remains pending.',ops[line],groups.get(line))
  if line in groups:return admit('',expr,groups[line])
  if line in [188,197,211,316,348,373,376,380,381,385]:return admit('Emitted test title/assertion/diagnostic with fixed document-root values; preserve baseline and assertions. Owning read-set dependencies are separately explicit.',expr)
  # The bottom fixtures are rooted in tmpFixtureCwd and NEVER in the real
  # symlink fixture used by runDocsIndex; retain that distinction.
  return reject('config-or-metadata' if 'docs/' in expr else 'text-label-join' if expr.startswith('`') else 'non-document-fs-probe','Pure in-memory path fixture or tmpFixtureCwd descendant (R5/R21), outside real repository readers:')
 if line in OUTPUT_LINES.get(key,set()) and 'docs/' in expr:return admit('Fixed test document path is passed to/emitted by the product CLI, prompt or assignment and compared by the owning assertion. Preserve exact fixture input/output; no real source document is resolved.')
 if key=='merge' and line in [1263,1265]:return admit('Fixed docs/how-to recovery path is compared to the real merge failure-detail output; preserve diagnostic spelling and the whole assertion.')
 if re.search(r'path\.(?:join|resolve)\(|\.join\(',expr):return reject('state-event-store' if '.fgos' in expr or 'events.jsonl' in expr else 'non-document-fs-probe','Test-owned scratch/state/code path plumbing (R21); this constructor does not read the repository documentation:')
 if expr.startswith('`'):return reject('text-label-join','Test data serialization or assertion label interpolation, not a document path operand:')
 if 'docs/' in expr:return reject('config-or-metadata','R5: fixture path metadata in temporary test state or a pure function input; no real document lookup or asserted emitted navigation in this passage:')
 return reject('root-only' if re.search(r'__dirname|import.meta',expr) else 'state-event-store' if '.fgos' in expr else 'scalar-pass-through','Non-document test configuration, root resolution or scalar value:')
refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for e in b.rows('step-05-population-references.jsonl'):refs[e['file']].append(e)
for e in b.rows('step-05-population-dynamic.jsonl'):dyn[e['file']].append(e)
# Use the existing complete-file builder with the new selection and author
# judgments above; no old search/record artifacts are overwritten.
loop=builder[builder.index('rs=[];receipts=[];readset=[]'):]
loop=loop.replace('batch4','batch5').replace('batch-4','batch-5').replace('b4-','b5-')
exec(compile(loop,str(P/'step-05-seam5-batch4-author-judgment.py')+'[reused loop]','exec'))
# Complete real read-set and successor provenance beyond the generic schema.
rs=b.rows('step-05-records/tests-judgment-batch5.jsonl');rc=json.loads((P/'step-05-seam5-batch5-parity-receipts.json').read_text())
for r,receipt in zip(rs,rc['receipts']):
 f=r['file'];body=b.body(PIN,f);ls=body.splitlines();allitems=r['references']+r['dynamicTraces']+r['authorAddedReferences'];notes=[]
 for e in allitems:
  x=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]);n=e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'));comment=ls[n-1].lstrip().startswith(('//','/*','*'))
  if e['admission']=='ADMIT':
   e['role']='comment-provenance' if comment else 'real-document-reader' if f in [END,CAP] and ('path.' in (e.get('pathOperand') or x) or f==END and n in [162,167,325,330,334,335,345,346,347]) else 'document-path-comparison'
   if e['role']!='synthetic-fixture':e.pop('fixtureProvenance',None)
  if re.search(r'docs/decisions/\d{4}-|0000-index\.md',x):
   e['successorNote']='docs/decisions/index.md'
   if '0022-fgos-choke-point-survey' in x:e['successorNote']='docs/platform/runner/decisions/h-36d872fbb0e5.md#0022--khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill'
   e['reason']+=' The numbered/index spelling in a temporary merge fixture is synthetic data, not a claim that a retired historical decision still exists; successorNote points readers to the surviving decision index.' if f.endswith(('merge.test.mjs','merge-quoted-paths.test.mjs')) else ' Retired citation successor is explicit.'
  if e['disposition']=='parked':
   e['searchWitness']['assessment']=e['blockedReason'];e['owningGeneratorParks']=[{'file':'src/report/enduser-index-generate.mjs','id':'dynamic-009788','recordFile':relative('step-05-records/generators-enduser-index.jsonl')},{'file':'src/report/enduser-index.mjs','id':'dynamic-009791','recordFile':relative('step-05-records/generators-enduser-index.jsonl')}]
  if e['admission']=='REJECT' and 'originalTuple' in e:e['rejectedAsUnrelatedReason']=e['reason']
 # The source fixture helper follows a symlink to real docs: pin it explicitly.
 inputs=[]
 if f==END:
  paths=['test/report/helpers/docs-index-state-fixture.mjs','src/report/enduser-index.mjs','src/report/enduser-index-generate.mjs','docs/enduser-docs-index.json','docs/how-to/check-rollup-progress.md','docs/decisions/index.md']
  r['realReadSetContract']={'manifest':'docs/enduser-docs-index.json','symlinkFixture':'test/report/helpers/docs-index-state-fixture.mjs','temporaryFixtureFactory':'tmpFixtureCwd','sourceCaptureId':'doc-fgos-rollup-howto','roots':['docs/how-to','docs/tutorials','docs/decisions','docs/explanation','docs/knowledge'],'pending':'Bind live scan set to parked generator alias membership at Step 7; no per-file run or mutation of tracked docs is performed.'}
 elif f==CAP:paths=['docs/how-to/author-a-plan-loop-track.md'];r['realReadSetContract']={'readLine':362,'assertionLines':[364,365],'path':paths[0],'moveSetAbsent':True}
 else:paths=[]
 for path in paths:
  inp=pininput(path);inputs.append(inp);r['protectedPins'][path]=inp['sha256']
 r['realReadInputs']=inputs;receipt['currentInputs']+=inputs;receipt['candidateInputs']+=copy.deepcopy(inputs);receipt['comparison']['realReadSet']=r.get('realReadSetContract',[])
 r['authorAssessment']='All pinned source bytes read through EOF. Judgment is per actual operand, with exact owning declarations/assertions; temp-root fixtures and in-memory data are rejected uniformly, emitted product-path comparisons are admitted. '+str(r.get('realReadSetContract','No real repository document reader in this file.'))
 receipt['comparison']['fixtureSource']={'inputCommit':PIN,'path':f,'sha256':r['sourceSha256'],'mode':r['sourceMode'],'origin':'test-authored immutable fixture data; unchanged'}
 receipt['blockedBy']=list(dict.fromkeys(e['blockedReason'] for e in allitems if e['disposition']=='parked'))
(P/'step-05-records/tests-judgment-batch5.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs));dump('step-05-seam5-batch5-parity-receipts.json',rc)
dump('step-05-seam5-batch5-builder-provenance.json',{'builder':'step-05-seam5-batch4-author-judgment.py','builderSha256':b.sha(builder),'reused':'schema helper definitions and complete record/receipt authoring loop; batch-specific classification is supplied here','sourceBytesRead':sum(r['wholeFileReadEvidence']['bytes'] for r in rs),'files':len(rs)})
