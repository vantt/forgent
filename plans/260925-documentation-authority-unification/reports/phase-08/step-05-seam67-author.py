"""Pinned record-only authoring for compiler and citation/ratchet consumers.
No source execution, migration application or generator invocation.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,hashlib,functools,collections,copy,re,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
SEAMS=['ui-spec-compiler','citation-ratchet-roots']
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).open()]
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT).decode()
PIN=git('rev-parse','HEAD').strip()
@functools.lru_cache(None)
def blob(pin,f):return git('show',pin+':'+f)
@functools.lru_cache(None)
def mode(pin,f):return git('ls-tree',pin,'--',f).split()[0]
def inp(f,pin=PIN):
 t=blob(pin,f);return {'path':f,'inputCommit':pin,'sha256':sha(t),'bytes':len(t.encode()),'mode':mode(pin,f),'provenance':pin+':'+f}
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
def span(ls,n,radius=3):
 a=max(1,n-radius);b=min(len(ls),n+radius);return {'startLine':a,'endLine':b,'text':'\n'.join(ls[a-1:b])}
def wit(ls,n,x,col=None):
 x=x.split('\n')[0];k=ls[n-1].find(x) if col is None else col-1;assert k>=0 and ls[n-1][k:k+len(x)]==x,(n,x)
 return {'line':n,'columnStart':k+1,'columnEndExclusive':k+len(x)+1,'text':x}
@functools.lru_cache(None)
def mapping(pin,f):
 a=blob(pin,f).splitlines();z=blob(PIN,f).splitlines();d={}
 for tag,i,j,k,l in difflib.SequenceMatcher(None,a,z,autojunk=False).get_opcodes():
  if tag=='equal':d.update({n+1:k+n-i+1 for n in range(i,j)})
 return d

def locate(f,oldpin,n,x,col):
 ls=blob(PIN,f).splitlines();mapped=mapping(oldpin,f).get(n)
 if mapped is not None:return wit(ls,mapped,x,col)
 # For edited lines require uniquely best complete old-line correspondence.
 oldls=blob(oldpin,f).splitlines();choices=[]
 for j,t in enumerate(ls,1):
  if x.split('\n')[0] in t:choices.append((difflib.SequenceMatcher(None,oldls[n-1],t,autojunk=False).ratio(),j))
 choices.sort(reverse=True)
 assert choices and (len(choices)==1 or choices[0][0]>choices[1][0]),('unbound',f,n,x)
 return wit(ls,choices[0][1],x)

def newitem(r,id,n,x,kind='added'):
 ls=blob(PIN,r['file']).splitlines();w=wit(ls,n,x);c=span(ls,n)
 return {'referenceId':id,'inventoryOrigins':[],'originalSourceSpans':[],'sourceSpans':[w],'matchedExpression':x,'passage':c['text'],'passageSpan':{k:v for k,v in c.items() if k!='text'}}

def main():
 global PIN
 HEAD_PIN=PIN
 pop=rows('step-05-population-files.jsonl');refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
 for e in rows('step-05-population-references.jsonl'):
  if e['seam'] in SEAMS:refs[e['file']].append(e)
 for e in rows('step-05-population-dynamic.jsonl'):
  if e['seam'] in SEAMS:dyn[e['file']].append(e)
 priors=collections.defaultdict(list)
 for folder in ['step-03-records','step-04-records']:
  for f in sorted((P/folder).glob('*.jsonl')):
   raw=f.read_bytes()
   for n,l in enumerate(raw.decode().splitlines(),1):
    r=json.loads(l)
    priors[r['file']].append({'recordFile':str(f.relative_to(ROOT)),'recordLine':n,'recordSha256':sha(raw),'record':r})
 protected=['scripts/check-decision-citation-drift.mjs','scripts/check-decision-citation-drift.baseline.json','scripts/check-legacy-docs-ratchet.mjs','scripts/check-legacy-docs-ratchet.baseline.json','scripts/check-legacy-docs-ratchet.exceptions.json','scripts/generate-shipped-path-inventory.mjs']
 frozen={f:sha(blob(PIN,f)) for f in protected}
 commands={'ui-spec-compiler':['node .claude/skills/ui-spec/tools/validate.mjs --root docs/ui-spec','node .claude/skills/ui-spec/tools/wireframe/verify-runtime.mjs --root docs/ui-spec'],'citation-ratchet-roots':['env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-decision-citation-drift.test.mjs test/scripts/check-legacy-docs-ratchet.test.mjs']}
 allrs=[];cutovers=[];sourceByFile={};whole=[]
 def classify(r,e,n,x,dynamic=False):
  f=r['file'];ls=blob(PIN,f).splitlines();src=ls[n-1];comment=src.lstrip().startswith(('//','/*','*','#'));seam=r['seamIds'][0]
  def outcome(admit,disp,role,why,cat=None,operand=None,dep=None):
   e.update(admission=admit,disposition=disp,role=role,nonDocumentUse=cat,reason='L12-85: '+f+': '+why+' Own operand '+repr(x),target=None,anchor=None,timing='phase9' if disp in ['parked','patch','render-join'] else 'none',diffHunk=None,blockedCategory='cutover-contract' if disp=='parked' else None,blockedReason=f+': '+why if disp=='parked' else None,dependency=dep,dependencyCategory='phase9' if dep else None,successorNote=None,aliasWriteCheck={'isWriter':bool(re.search(r'writeFileSync|renameSync',src)),'destinationIsAlias':False,'evidence':'No destination is rewritten. Root/config input remains the existing compiler or checker door; no alias is adopted.'},receiptId=r['receiptIds'][0],proofCommand=commands[seam][0],parityObligation='Same-input current/candidate comparison remains pending. Preserve all status, findings, output path/mode/hash and owning assertions; no normalization beyond deterministic set ordering.',resolverWitness={'inputCommit':PIN,'scope':why,'treeRetires':bool(re.search(r'docs/(?:specs|architect)',x))})
   if dynamic:
    e.update(pathOperand=operand,stateExportDependency=dep,blockedSeams=[seam,'phase9'] if disp=='parked' else [],rejectedAsUnrelatedReason=e['reason'] if admit=='REJECT' else None)
    if operand:
     pn=next(i for i in range(e['currentPassage']['startLine'],e['currentPassage']['endLine']+1) if operand.split('\n')[0] in ls[i-1]);e['pathOperandWitness']=dict(wit(ls,pn,operand),text=operand)
   return e
  def reject(cat,why):return outcome('REJECT','preserve','non-document-operation',why,cat)
  def preserve(why,op=None,role='document-operation'):return outcome('ADMIT','preserve',role,why,operand=op or (x if dynamic else None))
  def park(why,dep,op=None):return outcome('ADMIT','parked','document-operation',why,operand=op or (x if dynamic else None),dep=dep)
  if 'baseline.json' in f or f.endswith('ratchet.exceptions.json'):
   if dynamic:return reject('generated-data-text','Frozen checker-read baseline/exceptions serialized string, not an executable expression or actual document lookup. Original JSON content and occurrence identity remain byte-identical (R13).')
   return preserve('Frozen checker-read data entry/path or finding excerpt; retain its exact key/text/digest. No rebaseline, new exception kind or hand editing is authorized (R13).',role='frozen-baseline-data')
  if f.endswith('citation-format.md'):
   if n in [4,6] or n==96 and x=='docs/specs/*.md':
    return park('Canonical citation convention must describe permanent decision homes, split area holders and the actual scan-set after root deletion together with checker defaults and help; no approved replacement wording/coverage proof exists for this passage.','citation-convention-and-scan-packet')
   return preserve('Canonical citation-format historical/design pointer or retained docs/history convention; no root rewrite is implied.',role='citation-convention')
  if f.startswith('test/'):
   if f.endswith('check-decision-citation-drift.test.mjs') and n in [762,763,764,765,766,767,768,769,770,771,772,773,774,775,776,777,778,779]:
    return reject('root-only' if n in [762,763,764,765] else 'caller-data-formatting','Real-repo CLI enforcement owning proof uses citation defaults, baseline and both skill roots; root derivation/diagnostic is not itself a document operand. The entire test declaration/assertions join the scan packet.')
   if f.endswith('check-legacy-docs-ratchet.test.mjs') and n==737:
    return preserve('Real repository baseline read; complete live self-check at L736-750 invokes the frozen checker with unchanged baseline. Retirement obligation is in the owning packet; never patch/rebaseline this test data.',op='path.resolve(REPO_ROOT, DEFAULT_BASELINE_PATH)')
   return reject('comment-or-type' if comment else 'root-only' if 'REPO_ROOT' in x and 'resolve' in x else 'config-or-metadata' if re.search(r'docs/|roots:|repoRoot:|path:',x) else 'non-document-fs-probe' if re.search(r'join\(|resolve\(|new URL|mkdtemp',x) else 'text-label-join' if x.startswith('`') or '.join(' in x else 'scalar-pass-through','Test-owned mkdtemp or in-memory fixture, checker source locator, input validation/scope token or diagnostic. No real legacy document bytes are read by this operand. Fixture constructors and every owning assertion are recorded unchanged.')
  if f=='scripts/check-legacy-docs-ratchet.mjs':
   if not dynamic:
    if comment:return preserve('Frozen ratchet policy/provenance names the retiring tree identity; no retained-tree witness. Decision F owes retirement in Phase 9.',role='comment-provenance')
    return park('Decision F Phase 9 ratchet retirement must handle this actual default root/classifier operand and deletion-finding behavior atomically with retirement of docs/specs and docs/architect; frozen gate bytes cannot absorb migration output.','decision-f-phase9-ratchet-retirement')
   if n in [20,272,276,282,283,297,372,425,682]:
    if x=='repoRoot = process.cwd()':return reject('root-only','Only resolves caller repository root, not a document destination.')
    op={20:"['docs/specs', 'docs/architect']",272:'DEFAULT_ROOTS',276:'path.resolve(repoRoot, rootRel)',282:'path.join(currentAbs, entry.name)',283:'path.relative(repoRoot, fullPath)',297:'path.resolve(currentAbs, rawTarget)',372:'DEFAULT_ROOTS',425:'DEFAULT_ROOTS',682:'DEFAULT_ROOTS'}[n]
    return park('Decision F Phase 9 ratchet retirement owns this scan/default/symlink path operation; keep existing containment and deletion detection until the coordinated retirement.','decision-f-phase9-ratchet-retirement',op)
   if n in [670,674]:return preserve('Checker reads the fixed baseline/exceptions data through override-or-default resolution; frozen R13 bytes and all schema controls remain unchanged.',op='path.resolve(\n    cwd,\n    '+('baselineIdx >= 0 ? argv[baselineIdx + 1] : DEFAULT_BASELINE_PATH' if n==670 else 'exceptionsIdx >= 0 ? argv[exceptionsIdx + 1] : DEFAULT_EXCEPTIONS_PATH')+'\n  )')
   return reject('root-only' if n in [422,678] else 'config-or-metadata' if n in [21,22,411,667,668] else 'finding-path-field' if re.match(r'^path:',x) else 'guard' if n in [220,301,305,317] else 'text-label-join' if n==44 else 'caller-data-formatting','Schema/CLI/root plumbing, path-field echo, accumulator, path guard or diagnostic formats caller/scanned values. Actual default/scanner reads and retirement obligation have separate exact slots; this expression adds no fixed documentation path.')
  if f=='scripts/check-decision-citation-drift.mjs':
   if not dynamic:
    if n==428:return park('CLI specsDir default points into the retiring specs tree. The candidate scan root/set and default/help/citation-format wording must be approved together; a narrower or absent root must not manufacture green.','citation-candidate-scan-coverage')
    if n==422:return park('CLI decisionsDir enumeration consumes the directory including proposed-move index.md; keep metadata loader and the index decision in one co-cut unit.','Phase 9 retention-or-move decision for docs/decisions/index.md')
    if n==18:return preserve('Dated retired-index citation in explanatory comment; move decision for index joins this pointer as a co-change, not a live read.',role='comment-provenance')
    return preserve('Frozen citation-checker scan description or retained backlog/history convention; co-change documented commands/defaults in one packet before candidate scanning is accepted.',role='comment-provenance' if comment else 'document-operation')
   if n in [232,253,288,321,340,346,352,419,423,427,448,451,452,453]:
    op={232:'path.join(decisionsDir, file)',253:'path.join(current, entry.name)',288:'path.join(specsDir, file)',321:"['docs', 'src', 'plugins', 'core/skills', 'domains', '.agents/skills']",340:'WIDE_SWEEP_ROOTS',346:'path.join(cwd, root)',352:'path.join(current, entry.name)',419:"'docs/decisions'",423:"'docs/backlog.md'",427:"'docs/specs'",448:'path.resolve(cwd, decisionsDir)',451:'path.resolve(cwd, backlogPath)',452:'path.resolve(cwd, specsDir)',453:'path.resolve(cwd, d)'}[n]
    # Multiline defaults use the actual literal line, still within their passage.
    if n in [419,423,427]:
     e['pathOperand']=op
     if dynamic:e['pathOperandLine']={419:422,423:426,427:428}[n]
    if n in [419,448,232]:return park('Decision-metadata directory reader enumerates docs/decisions and filters numeric markdown names; proposed index move must be decided with all directory readers even though index.md does not match the numeric filter.','Phase 9 retention-or-move decision for docs/decisions/index.md',op)
    if n in [288,427,452]:return park('Default specs scan resolves retiring docs/specs/*.md; approve exact candidate coverage and findings equivalence with documented scan commands before the old root disappears.','citation-candidate-scan-coverage',op)
    return preserve('Existing recursive/wide/backlog/skills scan operation. Wide roots are docs, src, plugins, core/skills, domains and .agents/skills; sorted output/finding equivalence after deletion is missing, not inferred from unchanged root spelling.',op=op)
   if n in [464]:return preserve('Fixed citation baseline resolution is checker data I/O; pin exact baseline bytes, never rebaseline.',op='path.resolve(\n    cwd,\n    baselinePath,\n  )')
   return reject('guard' if n in [342] else 'config-or-metadata' if n in [44,323,414,430] else 'caller-data-formatting','Citation IDs, finding keys/messages, skip config, caller-derived filters or scalar counts; no own fixed document-path operand. Preserve exact finding categories, multiplicity and exits.')
  if f.endswith('spec.config.yaml'):
   if dynamic:return reject('config-or-metadata','surface_dirs is YAML configuration data; config.mjs reads surface_dirs and joins its values to the selected specRoot. It is not its own read/write operation.')
   return preserve('Config comment product-source pointer already has exact settled Step 3 citation custody; carry that same Phase 9 pointer patch without promoting the retained compiler root.',role='comment-provenance')
  if f=='docs/ui-spec/generated/wireframe-v2.html':
   return reject('generated-data-text','Generated CSS/UMD/DOM or serialized surface payload, not an independent filesystem root. Exact source/generator joins attached separately; never hand-patch generated HTML.')
  if not dynamic:return preserve('Retained compiler docs/ui-spec example or existing runtime path. L12-21/26 preserve docs/ui-spec; actual verify-runtime reader is fixed under frontend and ignores --root.',role='compiler-path')
  if f.endswith('/config.mjs'):
   ops={14:'join(dir, "spec.config.yaml")',26:'resolve(process.argv[idx + 1])',33:'parseRootArg() ?? findSpecRoot(process.cwd())',44:'join(specRoot, "spec.config.yaml")',49:'configPath',57:'join(specRoot, config.schema_path ?? "schema/surface-contract.schema.json")'}
   if n in ops:return preserve('Selected-root config/schema chain: explicit --root wins; otherwise probe start cwd and at most nine parents (ten candidates), stop at filesystem root. YAML load/read failure exits 1. No containment or symlink refusal exists here; config may point outside default root.',ops[n])
   return reject('root-only' if n in [12,17,63] else 'config-or-metadata','Root derivation/pass-through or surface/schema option data; owning document constructions and errors are individually admitted.')
  if f.endswith('/build.mjs'):
   if n in [10,32,69,86,104]:return preserve('Build writes beneath selected SPEC_ROOT/generated: surface-registry.yaml, navigation-graph.yaml, action-registry.csv and coverage-report.md. Retain path/mode/content pipeline; candidate output sets/hash/mode proof missing.',op=x if x.startswith('join(') else None)
   return reject('table-row-serialization' if n in [86,101] else 'text-label-join','CSV/Markdown table/count serialization; no destination path in this operand.')
  if f.endswith('/extract.mjs'):
   if n in [20,24,31]:return preserve('Configured surfaceDirs entries are listed one directory deep (no recursive descent despite header wording); .md regular files plus optional crossCutting absolute/drive or specRoot-relative files feed extractFile. Missing dirs/cross-cutting files are ignored; statSync for surface entries is unguarded.',op=x)
   return reject('caller-data-formatting','Parser/block/id diagnostic or direct-run guard; no own document root. Actual extractFile read/relative output is attached as supplemental source slots.')
  if f.endswith(('/interpret.mjs','/interpret-wireframe.mjs')):
   if n in ([69,757,762,765,769] if f.endswith('/interpret.mjs') else [31,73,78,81,85]):
    op={69:'join(specRoot, item.file.replace(/\//g, require_sep()))',757:'specRoot',762:'join(specRoot, "generated")',765:'join(genDir, "wireframe.html")',769:'outPath',31:'join(specRoot, item.file.replace(/\//g, sep))',73:'specRoot',78:'join(specRoot, "generated")',81:'join(genDir, "wireframe-v2.html")',85:'outPath'}[n]
    return preserve('Interpreter reads selected spec surface data/prose and writes one generated HTML output; emitted root/output path follows same construction. Browser launch commands receive that generated file URL, not a moved document alias. Root remains docs/ui-spec when explicitly selected.',op)
   return reject('root-only' if n==430 else 'text-label-join','DOM state, HTML/CSS/control label, scalar render/count, browser command formatting or in-memory table/string join; no own document construction. Output provider is owned separately.')
  if f.endswith('/rename.mjs'):
   if n in [41,71]:return preserve('walk(specRoot) recursively reads .md files while skipping generated/node_modules directories. Default is preview; --apply writes matching content and renames matching basenames. Existing retained specRoot only; no alias resolver or containment check is added.',op=x)
   return reject('caller-data-formatting','Preview/status text formats selected token/relative filename and counts; actual document walk/write/rename has explicit source slots.')
  if f.endswith('/validate.mjs'):
   if n in [17,188,196,216]:return preserve('Validator reads selected schema, surface Markdown, states catalogue and overview index. Missing schema exits 1; structural/schema/cross-file errors exit 1 and warning-only completion exits 0. Preserve actual validation messages and status; no root promotion.',op={17:'schemaPath',188:'join(SPEC_ROOT, catalogName)',196:'join(SPEC_ROOT, f.file)',216:'join(SPEC_ROOT, ovName)'}[n])
   return reject('caller-data-formatting','Validation message serializes surface/action/field/counter; no fixed document path in this operand. Exact schema/read path is separately owned.')
  if f.endswith('/verify-runtime.mjs'):
   if n==14:return preserve('Real HTML read uses resolve(__dir, "../../../../../frontend/docs/ui-spec/generated/wireframe-v2.html"); the program does not parse --root. Actual repository-relative target is frontend/docs/ui-spec/generated/wireframe-v2.html, not the retained docs/ui-spec generated output. Existing mismatch is recorded; no tool execution or repair authorized.',op='resolve(__dir, "../../../../../frontend/docs/ui-spec/generated/wireframe-v2.html")')
   return reject('comment-or-type' if n==13 else 'root-only' if n==12 else 'caller-data-formatting','Runtime DOM-smoke diagnostic/assertion or module-root derivation, not a document path. Surface/flow clicks and graph fallback assertions remain unchanged.')
  return reject('root-only' if '__dir' in x else 'non-document-fs-probe' if f.endswith('/html-shell.mjs') and n in [17,23] else 'text-label-join' if 'join(' in x or x.startswith('`') else 'config-or-metadata','Compiler client/CSS/DOM/source-bundle operation: not a document path. html-shell reads client JS and node_modules bundles and embeds SURFACES; code assets and rendered labels do not imply documentation migration.')
 # Build every census identity; use unchanged-line ancestry instead of global text lookup.
 for row in pop:
  if row['seam'] not in SEAMS:continue
  f=row['file'];PIN='42edba2b08d26ab8dcabe4859a301e1589fa8e6b' if f=='scripts/check-legacy-docs-ratchet.exceptions.json' else HEAD_PIN;seam=row['seam'];t=blob(PIN,f);ls=t.splitlines();rid=seam+'-parity';r={'file':f,'authorInputCommit':PIN,'sourceSha256':sha(t),'sourceMode':mode(PIN,f),'censusOrigins':row['origins'],'priorRecordRefs':[{k:v for k,v in x.items() if k!='record'} for x in priors[f]],'seamIds':[seam],'subBatch':'judgment-seam67','wholeFileRead':True,'wholeFileReadEvidence':{'bytes':len(t.encode()),'lines':len(ls),'sha256':sha(t),'method':'Complete pinned git blob through EOF; exact source expressions, input/output chain and prior source joins retained.'},'references':[],'dynamicTraces':[],'authorAddedReferences':[],'diff':None,'rollbackDiff':None,'expectedAfterSha256':sha(t),'coCutPaths':[],'receiptIds':[rid],'protectedPins':{pf:sha(blob(PIN,pf)) for pf in protected} if seam=='citation-ratchet-roots' else {},'parked':[],'review':{'status':'pending','reviewer':None,'report':None},'generated':f in ['.agents/skills/_shared/citation-format.md','plugins/fgOS/skills/_shared/citation-format.md','docs/ui-spec/generated/wireframe-v2.html'],'inheritedSourceSlots':[],'authorAssessment':'Judgment record; no unproved R19/R20/R21 neutrality closure is claimed. Exact operation-level judgments require independent window review.','carryJoins':[c for c in rows('step-05-dynamic-carries.jsonl') if c.get('file')==f]}
  for x in refs[f]:
   ss=[locate(f,x['origins'][0]['pin'],s['line'],s['text'],s['columnStart']) for s in x['sourceSpans']];n=ss[0]['line'];c=span(ls,n);e={'referenceId':x['id'],'inventoryOrigins':x['origins'],'originalSourceSpans':x['sourceSpans'],'sourceSpans':ss,'matchedExpression':x['expression'],'passage':c['text'],'passageSpan':{k:v for k,v in c.items() if k!='text'}};classify(r,e,n,x['expression']);r['references'].append(e)
  for x in dyn[f]:
   tup=x['callSite'];oldpin=read(x['inventories'][0])['inputCommit'];w=locate(f,oldpin,tup[0],tup[4],tup[1]);n=w['line'];c=span(ls,n,5)
   # Include the full multiline default/resolve operation in context.
   c['endLine']=max(c['endLine'],min(len(ls),n+len(tup[4].splitlines())+2));c['text']='\n'.join(ls[c['startLine']-1:c['endLine']])
   declarations=[(i,l) for i,l in enumerate(ls[:n],1) if re.match(r'^(?:export )?(?:async )?function |^test\(',l)]
   caller={'line':declarations[-1][0],'declaration':declarations[-1][1]} if declarations else {'line':1,'declaration':ls[0]}
   e={'id':x['id'],'originalTuple':tup,'inventoryOrigins':x['inventories'],'currentLine':n,'currentPassage':c,'operationWitness':w,'caller':caller,'inputs':[tup[4]],'targetSetOrConstruction':tup[4],'operationChain':{'caller':caller,'input':tup[4],'operation':ls[n-1],'constructionRule':'Exact own operand plus the pinned family trace; no blanket string replacement.','containmentAndErrors':'Existing behavior only; see family source trace, no additional symlink/containment guarantee.'}}
   classify(r,e,n,tup[4],True);r['dynamicTraces'].append(e)
  allrs.append(r);sourceByFile[f]=r;whole.append(dict(inp(f),lines=len(ls)))
 PIN=HEAD_PIN
 # Source core citation-format was not a literal census file: author every real source slot.
 core=sourceByFile['core/skills/_shared/citation-format.md'];ct=blob(PIN,core['file']);cls=ct.splitlines()
 template=sourceByFile['.agents/skills/_shared/citation-format.md']
 for x in template['references']:
  text=x['matchedExpression'];line=x['sourceSpans'][0]['line']-1
  e=newitem(core,'author-s67-citation-core-'+str(line)+'-'+str(x['sourceSpans'][0]['columnStart']),line,text);classify(core,e,line,text);core['authorAddedReferences'].append(e)
 # Mandatory source line96 example is pinned at its actual source/render coordinate.
 core['mandatoryCitationScanExample']={'originalLine':96,'currentLine':96,'text':cls[95],'inputCommit':PIN,'commandRoots':['docs/backlog.md','docs/specs/*.md','--skills-dir'],'packetDependency':'citation-convention-and-scan-packet'}
 for f in ['.agents/skills/_shared/citation-format.md','plugins/fgOS/skills/_shared/citation-format.md']:
  r=sourceByFile[f];assert blob(PIN,f).endswith(ct);r['sourceRenderProvenance']={'sourceFile':core['file'],'sourceSha256':core['sourceSha256'],'renderRule':'One generated source header line plus canonical core source; exact equality checked.','generator':'scripts/build-skill-wrappers.mjs'}
  for e in r['references']:
   owner=next(x for x in core['authorAddedReferences'] if x['matchedExpression']==e['matchedExpression'] and x['sourceSpans'][0]['line']==e['sourceSpans'][0]['line']-1)
   e.update(admission=owner['admission'],disposition='parked' if owner['disposition']=='parked' else 'render-join',sourceOwner={'kind':'step5','file':core['file'],'id':ident(owner)},sourceOwnerDisposition=owner['disposition'],reason='L12-85/R2: exact canonical source passage '+ident(owner)+' in '+core['file']+' owns this render; never hand-edit generated bytes.')
   if owner['disposition']=='parked':e.update(blockedReason=f+': source owner '+core['file']+' '+ident(owner)+' is parked: '+owner['blockedReason'],dependency=owner['dependency'],dependencyCategory='source-owner',blockedCategory='source-owner')
   else:e.update(blockedReason=None,dependency=None,dependencyCategory=None,blockedCategory=None)
 # Config comment citations carry their exact Step3 plan; compiler roots do not move.
 for f in ['docs/ui-spec/spec.config.yaml','docs/platform/ui-spec/architecture/spec.config.yaml']:
  r=sourceByFile[f];e=r['references'][0];target='docs/platform/herdr-web-dashboard/spec.md';prior=[(j,z) for j in priors[f] for z in j['record'].get('edges',[]) if z.get('matchedExpression')==e['matchedExpression']]
  if not prior:
   # Candidate config is a Phase6 content copy of the retained source config.
   prior=[(j,z) for j in priors['docs/ui-spec/spec.config.yaml'] for z in j['record'].get('edges',[]) if z.get('matchedExpression')==e['matchedExpression']]
  assert prior and prior[0][1]['disposition']=='patch' and prior[0][1]['target']==target
  j,z=prior[0];e.update(disposition='patch',timing='phase9',target=target,proposedReplacement=target,reason='L12-85/R8: module config header navigates to the settled whole product spec. Reuse exact Step3 product-source claim maps-j-08490; root stays docs/ui-spec. Candidate YAML is parsed only when its directory is explicitly chosen or discovered; no automatic mirror promotion.',resolverWitness={'inputCommit':PIN,'targetSha256':sha(blob(PIN,target)),'scope':'Same whole product-level source claim as settled Step3 config citation','treeRetires':False},inheritedSourceSlot={k:v for k,v in j.items() if k!='record'}|{'edgeId':z['edgeId'],'disposition':z['disposition']})
  before=blob(PIN,f);after=before.replace(e['matchedExpression'],target);r.update(diff=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+f,tofile='b/'+f)),rollbackDiff=''.join(difflib.unified_diff(after.splitlines(True),before.splitlines(True),fromfile='a/'+f,tofile='b/'+f)),expectedAfterSha256=sha(after),coCutPaths=[f,target]);e['diffHunk']=r['diff']
  cutovers.append({'inputCommit':PIN,'file':f,'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'symbolOrPassage':'Product-source comment at L3; compiler config root retained','oldText':before,'newText':after,'sourceSpans':e['sourceSpans'],'diff':r['diff'],'expectedAfterSha256':sha(after),'targetOwner':target,'claimAnchorProof':e['inheritedSourceSlot'],'receiptId':r['receiptIds'][0],'coCutPaths':r['coCutPaths'],'expectedOutputSets':[],'testTargets':commands['ui-spec-compiler'],'intentionalBehaviorDeltas':['Comment-only product-source citation changes; parsed YAML and root/output behavior unchanged.'],'prerequisites':['Step7 final source binding review','Phase9 compiler parity proof'],'order':'With settled Step3 source citations; no root migration','rollbackDiff':r['rollbackDiff'],'timing':'phase9','readiness':'pending review; not applied','commentOnly':True})
 # Generated wireframe references are tied to source surface owner/Step3 passage, not HTML edits.
 html=sourceByFile['docs/ui-spec/generated/wireframe-v2.html'];ht=blob(PIN,html['file']);hls=ht.splitlines();surfaces=json.loads(ht.split('const SURFACES = ',1)[1].split(';\n',1)[0]);html['sourceRenderProvenance']={'generatorFile':'.claude/skills/ui-spec/tools/interpret-wireframe.mjs','shellFile':'.claude/skills/ui-spec/tools/wireframe/html-shell.mjs','inputRoot':'docs/ui-spec','rule':'buildSurfaceData extracts each surface and serializes prose using JSON.stringify; CSS/client/UMD bytes are inlined; no independent output edits.'};html['generatedSourceInputs']=[]
 for surface in surfaces:
  f='docs/ui-spec/'+surface['file'];html['generatedSourceInputs'].append(inp(f))
 for e in html['references']:
  if e['matchedExpression']!='docs/specs/herdr-web-dashboard.md':continue
  n=e['sourceSpans'][0]['line'];start=ht.index('const SURFACES = ')+len('const SURFACES = ');offset=sum(len(x)+1 for x in hls[:n-1]);prefix=ht[start:offset];filehits=re.findall(r'"file": "([^"]+)"',prefix);f='docs/ui-spec/'+filehits[-1]
  choices=[(j,z) for j in priors[f] for z in j['record'].get('edges',[]) if z.get('matchedExpression')==e['matchedExpression']]
  if not choices:
   # Stale output: the real source removed this passage before the census.
   assert f=='docs/ui-spec/15-system-events.md'
   historicalPin=git('rev-parse','1839de60b72e1cc1848f4f686f8a13ed6dfef667^').strip();old=blob(historicalPin,f);current=blob(PIN,f);assert e['matchedExpression'] in old and e['matchedExpression'] not in current
   ownerRecord=sourceByFile['.claude/skills/ui-spec/tools/wireframe/html-shell.mjs'];operand='JSON.stringify(surfaces, null, 2)';on=next(i for i,t in enumerate(blob(PIN,ownerRecord['file']).splitlines(),1) if operand in t);oid='author-s67-current-surface-serialization'
   owner=newitem(ownerRecord,oid,on,operand);owner.update(admission='ADMIT',disposition='preserve',role='generator-source',nonDocumentUse=None,reason='R3 source slot: serialize current surface data; source 15-system-events.md already removed the stale product-spec citation in 1839de60b72e1cc1848f4f686f8a13ed6dfef667. Existing generator will use current source, never patch stale generated HTML.',target=None,anchor=None,timing='none',diffHunk=None,blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,successorNote=None,aliasWriteCheck={'destinationIsAlias':False},receiptId=ownerRecord['receiptIds'][0],proofCommand=commands['ui-spec-compiler'][0],parityObligation='Regeneration with complete current-source output sets remains missing.')
   if not any(ident(z)==oid for z in ownerRecord['authorAddedReferences']):ownerRecord['authorAddedReferences'].append(owner)
   e.update(admission='ADMIT',disposition='render-join',nonDocumentUse=None,role='generated-source-copy',sourceOwner={'kind':'step5','file':ownerRecord['file'],'id':oid},sourceOwnerDisposition='preserve',reason='R2/R3: stale generated source data; current source has already removed this citation. Regenerate via preserved serializer/source input; never patch generated output or invent a current source pointer.',sourcePassageProof={'file':f,'historicalInputCommit':historicalPin,'historicalSourceSha256':sha(old),'historicalText':next(t for t in old.splitlines() if e['matchedExpression'] in t),'currentInputCommit':PIN,'currentSourceSha256':sha(current),'removalCommit':'1839de60b72e1cc1848f4f686f8a13ed6dfef667','removalDiff':git('diff',historicalPin,PIN,'--',f),'renderLine':n,'renderText':hls[n-1],'transform':'Historical prose retained in stale JSON output; current source no longer emits it.'})
   continue
  j,z=choices[0]
  if len(choices)>1:
   ordered=sorted(choices,key=lambda pair:(pair[1]['sourceSpans'][0]['line'],pair[1]['sourceSpans'][0]['columnStart']));occurrence=hls[n-1][:e['sourceSpans'][0]['columnStart']-1].count(e['matchedExpression']);j,z=ordered[occurrence]
  index=len(html['inheritedSourceSlots']);html['inheritedSourceSlots'].append({'sourceFile':f,'recordFile':j['recordFile'],'recordLine':j['recordLine'],'recordSha256':j['recordSha256'],'edge':z,'sourceSha256':sha(blob(PIN,f))})
  e.update(admission='ADMIT',nonDocumentUse=None,disposition='render-join',role='generated-source-copy',timing='phase9',sourceOwner={'kind':'inheritedSourceSlots','file':html['file'],'index':index},sourceOwnerDisposition=z['disposition'],target=z.get('target'),reason='L12-85/R2: embedded prose from '+f+' follows exact Step3 source edge '+z['edgeId']+'; regenerate through interpreter, never hand-patch HTML.',sourcePassageProof={'file':f,'sourceLine':z['sourceSpans'][0]['line'],'sourceText':blob(PIN,f).splitlines()[z['sourceSpans'][0]['line']-1],'renderLine':n,'renderText':hls[n-1],'transform':'JSON string escaping; same source pointer and surrounding surface prose'})
 # Every omitted concrete I/O still gets its own source slot, not a fabricated census ID.
 supplemental={
 '.claude/skills/ui-spec/tools/extract.mjs':[(69,'readFileSync(absPath, "utf8")'),(70,'relative(SPEC_ROOT, absPath)')],
 '.claude/skills/ui-spec/tools/config.mjs':[(47,'readFileSync(configPath, "utf8")')],
 '.claude/skills/ui-spec/tools/validate.mjs':[(20,'readFileSync(schemaPath, "utf8")')],
 '.claude/skills/ui-spec/tools/rename.mjs':[(59,'readFileSync(p, "utf8")'),(70,'writeFileSync(p, content.replace(tokenRe, newTok), "utf8")')],
 }
 for f,pairs in supplemental.items():
  r=sourceByFile[f];ls=blob(PIN,f).splitlines()
  for n,x in pairs:
   if x not in ls[n-1]:n=next(i for i,t in enumerate(ls,1) if x in t)
   e=newitem(r,'author-s67-io-'+sha(f+str(n)+x)[:16],n,x);e.update(admission='ADMIT',disposition='preserve',role='document-io',nonDocumentUse=None,reason='L12-85/R3: actual document read/write/relative-output operation in selected-root pipeline; fixed root remains retained. No writer alias or new containment guarantee.',target=None,anchor=None,timing='none',diffHunk=None,blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,successorNote=None,aliasWriteCheck={'destinationIsAlias':False,'evidence':'Selected real root, no alias resolver introduced.'},receiptId=r['receiptIds'][0],proofCommand=commands['ui-spec-compiler'][0],parityObligation='Exact current/candidate payload and output mode/hash proof missing.');r['authorAddedReferences'].append(e)
 # Honor R26 for actual decision directory reads, including fixed defaults.
 for r in allrs:
  for e in items(r):
   if e.get('dependency')=='Phase 9 retention-or-move decision for docs/decisions/index.md':e['r26Unit']='docs/decisions/index.md';e['resolverWitness']['scope']='Undecided proposed move, actual directory reader/default; no retained-path claim'
  r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(r) if e['disposition']=='parked']
  # Complete test declaration/assertion preservation also covers each fixture.
  ls=blob(PIN,r['file']).splitlines();r['owningProofs']=[{'line':i,'text':t} for i,t in enumerate(ls,1) if re.match(r'^\s*(?:test|it)\(',t) or re.search(r'\bassert\.\w+\(',t)] if r['file'].startswith('test/') else []
 for seam in SEAMS:
  rs=[r for r in allrs if seam in r['seamIds']];(P/'step-05-records'/ (seam+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
 save('step-05-seam67-cutover-specs.json',{'inputCommit':PIN,'patches':cutovers,'compilerRootChange':False,'ratchetRetirement':{'status':'parked','dependency':'Decision F Phase9 ratchet retirement','patch':None,'frozenGateWitness':frozen},'readiness':'pending independent review and Phase9 composed parity'})
 receipts=[];template=read('step-05-parity-receipt-template.json')
 for seam in SEAMS:
  rs=[r for r in allrs if seam in r['seamIds']];inputs=[inp(r['file'],r['authorInputCommit']) for r in rs];candidate=copy.deepcopy(inputs)
  for i in candidate:
   r=sourceByFile[i['path']]
   if r['diff']:
    spec=next(s for s in cutovers if s['file']==i['path']);i.update(sha256=spec['expectedAfterSha256'],bytes=len(spec['newText'].encode()))
  receipts.append({'id':seam+'-parity','seam':seam,'inputCommit':PIN,'currentInputs':inputs,'candidateInputs':candidate,'comparison':{'currentOutputSet':[],'candidateOutputSet':[],'normalization':'None executed; later compare complete raw hashes/modes and exact stdout/stderr/findings/exits. Sorting path sets only; never omit payload or findings.','comparedFields':template['seamTemplates'][seam]['requiredComparisons'],'intentionalDeltas':[s['intentionalBehaviorDeltas'] for s in cutovers if s['file'] in {r['file'] for r in rs}],'unexpectedDeltas':[]},'proofs':[{'command':c,'owningBehavior':'Existing validation/runtime tool target, not migration parity test' if seam=='ui-spec-compiler' else 'Existing citation/ratchet owning test suites; current baseline/fixtures only','exit':None,'logPath':None,'logSha256':None,'status':'not-run'} for c in commands[seam]]+[{'command':'missing','owningBehavior':'Dedicated same-input current/candidate root discovery and complete output path/mode/hash parity' if seam=='ui-spec-compiler' else 'Candidate scan coverage and finding multiplicity/exits after legacy-root deletion; false-negative cases','exit':None,'logPath':None,'logSha256':None,'status':'missing'}],'blockedBy':list(dict.fromkeys(e['blockedReason'] for r in rs for e in items(r) if e['disposition']=='parked')),'readiness':'pending independent review, final-pin composition and Phase9 parity; no execution-ready cutover','review':{'status':'pending','reviewer':None,'report':None},'coCutPaths':sorted({r['file'] for r in rs}|{f for r in rs for f in r['coCutPaths']}),'cutoverSpecifications':[s for s in cutovers if s['file'] in {r['file'] for r in rs}],'frozenGateWitness':frozen if seam=='citation-ratchet-roots' else {},'generatedOutputPolicy':'Regenerate only through exact source owner; no hand-authored generated diff.'})
 save('step-05-seam67-parity-receipts.json',{'receipts':receipts});save('step-05-seam67-whole-file-reads.json',{'inputCommit':PIN,'files':whole,'fileCount':len(whole),'sourceBytes':sum(e['bytes'] for e in whole),'method':'Complete immutable tracked source blobs only; no .fgos/env/secrets reads; no build/tool execution.'})
 print('authored',len(allrs),'references',sum(len(r['references']) for r in allrs),'tuples',sum(len(r['dynamicTraces']) for r in allrs))
if __name__=='__main__':main()
