"""Batch 7 judgments via the existing complete-file record builder; no product mutation."""
import sys
sys.dont_write_bytecode=True
import ast,pathlib,json,re,subprocess,collections,importlib.util,copy,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
PIN='5eb9dc609f303fc9d54377f866b5e8caf9a5d129';selection=json.loads((P/'step-05-seam5-batch7-selection.json').read_text());selection['inputCommit']=PIN
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
DEAD='__none__';BLOCKS={};NOTES={};roots=['docs/platform','docs/knowledge','docs/reference','docs/tutorials'];queries=[];lookup=[]
dump('step-05-seam5-batch7-search-evidence.json',{'inputCommit':PIN,'roots':roots,'queries':queries,'aliasLookups':[],'assessment':'No selected passage needs a park or replacement holder. All unresolved root proofs receive explicit judgment; no neutrality is inferred.'})
OUTPUT_FILES={'test/cli/knowledge-verbs.test.mjs','test/cli/run-verb.test.mjs','test/runner/assignment-runresult.test.mjs','test/runner/execution/handoff-refs.test.mjs','test/runner/execution/run-sync.test.mjs','test/runner/execution/run.test.mjs','test/skills/fgos-coding-knowledge.test.mjs','test/workflow/seats.test.mjs','test/workflow/workflow-runner.test.mjs'}
NOTE_GROUPS={
 'test/cli/knowledge-verbs.test.mjs':'Test-owned git/store fixtures exercise reserve/register/move/promote and compare folded registry/CLI results. Their guide paths are synthetic, never live repository holders.',
 'test/runner/execution/handoff-refs.test.mjs':'Test-created Markdown refs and worktree output exercise same-repository digesting, cross-repository rejection and receipt delivery; all temporary paths and assertions remain unchanged.',
 'test/workflow/seats.test.mjs':'Pure workflow seat expansion copies contextRefs into runtime unit templates/provenance. Preserve copied document path comparisons under L12-72, without claiming real holder existence.',
 'test/workflow/workflow-runner.test.mjs':'Temporary workflow repositories exercise shared ref digest/status/downstream assignment propagation. Keep every output path, digest and state assertion; no live document target lookup.',
 'test/scripts/doc-rationale.test.mjs':'Pure in-memory source/target/link fixtures exercise rationale generation and whole-unit evidence. Old paths and fake digests are intentional data, not real repository navigation.',
 'test/runner/evidence-attribution.test.mjs':'In-memory dirty-path/hash/coverage inputs exercise attribution and scope matching; docs paths are scalar fixture values, not authority reads.',
 'test/state/events-legacy-absence.test.mjs':'Dated docs/history retirement citation is provenance. Executable reads inspect source/config files for removed contiguity mechanisms, not the historical document.'}
def classification(f,ls,line,expr,identity=None,dynamic=False):
 text=ls[line-1];comment=text.lstrip().startswith(('//','/*','*'));note=NOTE_GROUPS.get(f,'Complete pinned test/helper source: scratch/state/fixture paths, executable source roots and scalar diagnostics remain unchanged. No actual documentation authority lookup in this operand.')
 def reject(cat,why):return ('REJECT','preserve',cat,None,f+': '+why,None)
 def admit(why,operand=None):return ('ADMIT','preserve',None,operand or expr,f+': '+why,None)
 if comment:
  if 'docs/' in expr:return admit('R16 document comment pointer; dated provenance retained. '+note)
  return reject('comment-or-type','Comment/type/code locator; no document-valued operation. '+note)
 if f=='test/docs/run-doors-doctrine.test.mjs' and line in [14,65,70]:return admit('Real repository doctrine reader/walk, including retained AGENTS.md and skill/instruction surfaces. Exact scan and assertions stay unchanged; no retiring docs tree is walked.')
 if f=='test/setup/readme-tag-check.test.mjs' and 'path.join(REPO_ROOT' in expr and 'README.md' in expr:return admit('Reads retained real repository README.md and checks its actual pinned install tag against git tag listing. Keep the full test assertions and real tag comparison.')
 if re.match(r'\s*(?:test|it)\s*(?:\.\w+)?\(',text) and ('docs/' in expr or 'AGENTS.md' in expr or 'README.md' in expr):return admit('Test title is a runtime baseline key; no patch is proposed.')
 # R21 root-proven scratch joins stay fixture operations, including scratch docs.
 if re.search(r'path\.(?:join|resolve)\(|\.join\(',expr) or 'path.join(' in text and 'docs/' in expr:return reject('state-event-store' if re.search(r'\.fgos|events\.jsonl',expr) else 'non-document-fs-probe','Test-owned/source/fixture path construction, never a claimed retained document. '+note)
 if f in OUTPUT_FILES and 'docs/' in expr and not expr.startswith('`') and ('assert.' in text or 'contextRefs' in text or 'refs:' in text or 'docPath =' in text):return admit('Document context/path is an input to or comparison against emitted registry/unit/workflow output; fixture path preserved, no repository holder read. '+note)
 if expr.startswith('`'):return reject('text-label-join','Scalar diagnostic/test-label/command serialization; temporary fixture commands are data, not live navigation. '+note)
 return reject('config-or-metadata' if re.search(r'docs/|[\x22\x27]docs[\x22\x27]',expr) else 'root-only' if re.search(r'import\.meta|__dirname',expr) else 'state-event-store' if re.search(r'\.fgos|events\.jsonl',expr) else 'scalar-pass-through',note)
refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for e in b.rows('step-05-population-references.jsonl'):refs[e['file']].append(e)
for e in b.rows('step-05-population-dynamic.jsonl'):dyn[e['file']].append(e)
loop=builder[builder.index('rs=[];receipts=[];readset=[]'):].replace('batch4','batch7').replace('batch-4','batch-7').replace('b4-','b7-')
# Reuse the occurrence-ancestry proof before accepting a same-position text hit.
ancestrySpec=importlib.util.spec_from_file_location('authorAncestry7',P/'step-05-seam5-batch7-relocation-audit.py');ancestry=importlib.util.module_from_spec(ancestrySpec);ancestrySpec.loader.exec_module(ancestry)
old="  w=b.witness(body,x['callSite']);history=None;opls=ls"
new="""  originPin=ancestry.inventory_pin(x['inventories'][0]);mapped=ancestry.mapping(originPin,PIN,f).get(x['callSite'][0]);w=None;history=None;opls=ls
  if mapped:
   expression=x['callSite'][4].split('\\n')[0];k=x['callSite'][1]-1;assert ls[mapped-1][k:k+len(expression)]==expression
   w={'line':mapped,'columnStart':k+1,'columnEndExclusive':k+len(expression)+1,'text':expression}"""
assert old in loop
loop=loop.replace(old,new)
# Changed whole lines can retain the exact original operand. Relocate only
# inside the exact replacement hunk, with a unique best whole-line match.
needle="  if w is None:\n   assert x['callSite'][4] not in body,(f,x['id'])"
replacement="""  if w is None:
   for tag,a1,a2,z1,z2 in difflib.SequenceMatcher(None,oldls,ls,autojunk=False).get_opcodes():
    if tag!='replace' or not a1<=ow['line']-1<a2:continue
    oldline=oldls[ow['line']-1];expression=x['callSite'][4].split('\\n')[0];choices=[]
    for j in range(z1,z2):
     if expression in ls[j]:choices.append((difflib.SequenceMatcher(None,oldline,ls[j],autojunk=False).ratio(),j+1))
    choices.sort(reverse=True)
    if choices and (len(choices)==1 or choices[0][0]>choices[1][0]):
     newLine=choices[0][1];k=ls[newLine-1].index(expression);w={'line':newLine,'columnStart':k+1,'columnEndExclusive':k+len(expression)+1,'text':expression};break
  if w is None:
   assert oldls[ow['line']-1] not in ls,(f,x['id'])"""
needle='\n'.join(' '+line for line in needle.splitlines())
replacement='\n'.join(' '+line for line in replacement.splitlines())
assert needle in loop
loop=loop.replace(needle,replacement)
loop=loop.replace("if history:e['historicalOnly']=history;","if history:history['removedOccurrence']={'line':ow['line'],'text':oldls[ow['line']-1],'sha256':b.sha(oldls[ow['line']-1])};history['reason']='Exact original occurrence line was removed or replaced before author pin; identical scalar operands elsewhere do not create a binding. Full deletion diff and historical span retained.';e['historicalOnly']=history;")
exec(compile(loop,str(P/'step-05-seam5-batch4-author-judgment.py')+'[shared schema loop]','exec'))
rs=b.rows('step-05-records/tests-judgment-batch7.jsonl');rc= json.loads((P/'step-05-seam5-batch7-parity-receipts.json').read_text())
for r,receipt in zip(rs,rc['receipts']):
 f=r['file'];ls=b.body(PIN,f).splitlines();own=r['owningProofs'];cmd='env -u CLAUDE_CODE_SESSION_ID node --test '+f
 if f.endswith('.rs'):
  r['proofOwnerKind']='Rust owning declarations/assertions; full workspace test command includes imported support modules';cmd='env -u CLAUDE_CODE_SESSION_ID cargo test --workspace'
 elif not jsownership(ls):
  r['proofOwnerKind']='Imported helper / immutable replay fixture; full owning Node suite';cmd='env -u CLAUDE_CODE_SESSION_ID npm test'
  query=['git','grep','-n','-F',pathlib.PurePosixPath(f).name,PIN,'--','test','packages','apps'];pr=subprocess.run(query,cwd=ROOT,text=True,capture_output=True);r['importingProofWitness']={'command':query,'exit':pr.returncode,'matches':pr.stdout.splitlines(),'sha256':b.sha(pr.stdout)}
 # Receipt IDs must distinguish identical Rust module/support basenames.
 receiptId='real-file-tests-goldens-batch7-'+f.replace('/','-');r['receiptIds']=[receiptId];receipt['id']=receiptId
 for e in r['references']+r['dynamicTraces']+r['authorAddedReferences']:
  e['receiptId']=receiptId;e['proofCommand']=cmd;n=e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'));expr=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]);comment=ls[n-1].lstrip().startswith(('//','/*','*'))
  if e['admission']=='ADMIT':
   e['role']='comment-provenance' if comment else 'real-document-reader' if f in ['test/docs/run-doors-doctrine.test.mjs','test/setup/readme-tag-check.test.mjs'] else 'document-path-comparison';e.pop('fixtureProvenance',None);e['resolverWitness']['scope']='Actual pinned '+e['role']+'; temporary paths are synthetic, not retained live holders.'
  if 'originalTuple' in e and e['admission']=='REJECT':e['rejectedAsUnrelatedReason']=e['reason']
 r['authorAssessment']=NOTE_GROUPS.get(f,'Whole pinned source and exact original operation witnesses classified as judgment. Prior R21/R20 scan did not prove neutrality; no mechanical rejection is inferred.')
 receipt['proofs'][0]['command']=cmd;receipt['comparison']['comparedFields']=json.loads((P/'step-05-parity-receipt-template.json').read_text())['seamTemplates']['real-file-tests-goldens']['requiredComparisons']
 # Retained real-root readers bind the actual file bytes as well as source.
 target='AGENTS.md' if f=='test/docs/run-doors-doctrine.test.mjs' else 'README.md' if f=='test/setup/readme-tag-check.test.mjs' else None
 if target:
  inp=pininput(target);r['protectedPins'][target]=inp['sha256'];r['realReadInputs']=[inp];receipt['currentInputs'].append(inp)
  # Shared JSON encoding duplicates the lists after loading; copy explicitly.
  receipt['candidateInputs']=copy.deepcopy(receipt['currentInputs'])
(P/'step-05-records/tests-judgment-batch7.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs));dump('step-05-seam5-batch7-parity-receipts.json',rc)
print('complete',len(rs),'tuples',sum(len(r['dynamicTraces']) for r in rs),'added',sum(len(r['authorAddedReferences']) for r in rs))
