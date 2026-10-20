"""Records-only admission pilot. Frozen census identity is never rewritten.
Reads current complete source bodies; writes only this report directory.
All disposition rules below are author judgments, pending independent review.
"""
import sys
sys.dont_write_bytecode=True
import json,pathlib,hashlib,subprocess,difflib,re,time,datetime,collections,functools
P=pathlib.Path(__file__).resolve().parent
ROOT=P.parents[3]
PIN=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
SEAMS=['gateway-contract','cli-help-messages','setup-doctor-roots']
sha=lambda b:hashlib.sha256(b.encode() if isinstance(b,str) else b).hexdigest()
def read(n):return json.loads((P/n).read_text())
def rows(n):return list(map(json.loads,(P/n).read_text().splitlines()))
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def linesave(n,rs):(P/n).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
@functools.lru_cache(None)
def body(f):return (ROOT/f).read_text()
@functools.lru_cache(None)
def blob(pin,f):return git('show',pin+':'+f).decode()
@functools.lru_cache(None)
def line_map(pin,f):
 a=blob(pin,f).splitlines();b=body(f).splitlines();out={}
 for i,j,n in difflib.SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks():
  for k in range(n):out[i+k+1]=j+k+1
 return out
CENSUS=rows('step-05-population-references.jsonl');DYNAMIC=rows('step-05-population-dynamic.jsonl');FILES=rows('step-05-population-files.jsonl');CARRIES=rows('step-05-dynamic-carries.jsonl')
ORIGINAL_PIN='42edba2b08d26ab8dcabe4859a301e1589fa8e6b'
# These actual emitted-message owners are promoted from advisory runtime routing.
PROMOTED={'reference-000228','reference-000277','reference-003682','reference-003687','reference-003708','reference-003749','reference-003771','reference-003784','reference-003868'}
SELECTED=[r for r in CENSUS if r['seam'] in SEAMS or r['id'] in PROMOTED]
for r in SELECTED:
 r['pilotSeam']='cli-help-messages' if r['id'] in PROMOTED else r['seam']
selected_files={r['file'] for r in SELECTED}|{r['file'] for r in FILES if r['seam'] in SEAMS}|{'bin/fgos.mjs'}
file_seam={r['file']:r['seam'] for r in FILES if r['seam'] in SEAMS}
for r in SELECTED:file_seam.setdefault(r['file'],r['pilotSeam'])
file_seam['bin/fgos.mjs']='cli-help-messages'
# Existing canonical slots only; never import a review verdict across a hash.
PRIOR=collections.defaultdict(list)
for folder in ['step-03-records','step-04-records']:
 for f in sorted((P/folder).glob('*.jsonl')):
  for row in map(json.loads,f.read_text().splitlines()):
   owner=row.get('file')
   affected={owner}|{e.get('consumerFile',owner) for e in row.get('edges',[])}
   for consumer in affected&selected_files:
    slots=[{k:e[k] for k in ['edgeId','slotKey','sourceSpans','disposition','consumerFile'] if k in e} for e in row.get('edges',[]) if e.get('consumerFile',owner)==consumer]
    PRIOR[consumer].append({'recordFile':str(f.relative_to(ROOT)),'recordSha256':sha(f.read_bytes()),'sourceSha256':row.get('sourceSha256',row.get('digest')),'authorInputCommit':row.get('authorInputCommit'),'slots':slots,'reviewInheritance':'none; current source separately pinned'})
REGISTRY=json.loads((ROOT/'docs/doc-registry.json').read_text())
ALIASES={alias:d for d in REGISTRY['docs'] for alias in d.get('aliases',[]) if d.get('docLifecycle')!='retired'}
TEMPLATE=read('step-05-parity-receipt-template.json')
protected=['scripts/generate-shipped-path-inventory.mjs','plans/260925-documentation-authority-unification/transitional-switchboard.json','docs/transitional-switchboard.md','AGENTS.md','CLAUDE.md','scripts/check-legacy-docs-ratchet.mjs','scripts/check-legacy-docs-ratchet.baseline.json']
PROTECTED={f:sha((ROOT/f).read_bytes()) for f in protected if (ROOT/f).is_file()}
MODE={l.split('\t',1)[1]:l.split()[0] for l in git('ls-files','-s').decode().splitlines() if '\t' in l}

def locate(r):
 f=r['file'];pin=r['origins'][0]['pin'];ls=body(f).splitlines();mapping=line_map(pin,f);sp=[]
 for old in r['sourceSpans']:
  line=mapping.get(old['line']);text=old['text']
  if r['origins'][0]['inventory']!='step-02l-census-class6.json' and old['line']<=len(ls) and ls[old['line']-1][old['columnStart']-1:old['columnEndExclusive']-1]==text:line=old['line']
  if line is None:
   # Changed line content is admitted as a park, never matched by ordinal.
   hits=[i for i,l in enumerate(ls,1) if text in l]
   if len(hits)==1:line=hits[0]
  if line is None:return [],'Source line changed ambiguously; original occurrence needs content rebind before cutover.'
  if ls[line-1][old['columnStart']-1:old['columnEndExclusive']-1]!=text:
   hits=[m.start() for m in re.finditer(re.escape(text),ls[line-1])]
   if len(hits)!=1:
    globalhits=[i for i,l in enumerate(ls,1) if text in l]
    if len(globalhits)!=1:return [],'Original span has no unique current content correspondence.'
    line=globalhits[0];hits=[m.start() for m in re.finditer(re.escape(text),ls[line-1])]
    if len(hits)!=1:return [],'Original repeated token has no unique current column correspondence.'
   col=hits[0]+1
  else:col=old['columnStart']
  sp.append({'line':line,'columnStart':col,'columnEndExclusive':col+len(text),'text':text})
 return sp,None

def context(f,sp,pad=2):
 ls=body(f).splitlines();a=max(1,min(s['line'] for s in sp)-pad);b=min(len(ls),max(s['line'] for s in sp)+pad)
 return {'startLine':a,'endLine':b,'text':'\n'.join(ls[a-1:b])}

def scope(f,n):
 ls=body(f).splitlines();defs=[]
 for i,l in enumerate(ls[:n],1):
  if re.search(r'\b(?:function|fn)\s+[\w]+\s*\(',l) or re.search(r'^\s*(?:export )?(?:const|let) \w+\s*=.*=>',l):defs.append((i,l.strip()))
 return {'line':defs[-1][0],'declaration':defs[-1][1]} if defs else {'line':1,'declaration':'module declarations / data'}

def alias_target(expr):
 d=ALIASES.get(expr)
 if not d or expr in ['docs/decisions/index.md','docs/doc-registry.json','docs/doc-registry.md']:return None
 target=d['currentPath']
 if not (ROOT/target).is_file():return None
 return {'target':target,'docId':d['docId'],'registryPath':'docs/doc-registry.json','registrySha256':sha((ROOT/'docs/doc-registry.json').read_bytes()),'alias':expr,'targetSha256':sha((ROOT/target).read_bytes()),'claim':'live currentPath lookup; no writer destination adopts an alias'}

def make_ref(r):
 f=r['file'];sp,problem=locate(r);old=r['sourceSpans'];own=context(f,sp) if sp else {'startLine':old[0]['line'],'endLine':old[-1]['line'],'text':'\n'.join(blob(r['origins'][0]['pin'],f).splitlines()[old[0]['line']-1:old[-1]['line']])}
 line=body(f).splitlines()[sp[0]['line']-1].lstrip() if sp else ''
 comment=line.startswith(('//','/*','*'))
 admission='REJECT' if comment and not problem else 'ADMIT'
 covered=any(slot.get('edgeId')==o['id'] for prior in PRIOR[f] for slot in prior['slots'] for o in r['origins'])
 why=(('L12-58 / Step 3–4 comment custody (exact canonical slot joined): ' if covered else 'L12-26(5) history/design/contract evidence citation in a source comment; the quoted implementation rationale is not an operative runtime read of the citation: ')+'Exact own passage: '+repr(own['text'])) if comment else ('Executable data/message/file operation in own passage: '+repr(own['text']))
 role='comment' if comment else ('synthetic-fixture' if f.startswith('apps/') and sp and sp[0]['line']>(1500 if f.endswith('gateway.rs') else 480) else 'emitted-message' if r['pilotSeam']=='cli-help-messages' or 'message:' in own['text'] or 'description:' in own['text'] or 'InstructionRegistryError(' in own['text'] else 'reader/default')
 disp='preserve';target=None;witness=None;block=None;new=None
 if problem:disp='parked';block=problem
 elif r['id']=='reference-003796':
  admission='ADMIT';role='uncovered-comment-navigation';disp='parked';block='Live distribution spec citation in git-hook installation documentation is not joined to a Step 3/4 canonical slot. Step 7 must reconcile its comment navigation with packaging-distribution source; no behavioral code edit inferred.'
 elif admission=='ADMIT':
  witness=alias_target(r['expression'])
  if r['id']=='reference-003641':
   joined=next(x for x in SELECTED if x['id']=='reference-003655');sp,problem=locate(joined);assert not problem
   witness=alias_target(joined['expression']);assert witness
   why+=' This census prefix is the same physical example as reference-003655; bind the full pointer once and retain both original qualifiers.'
  if witness:disp='patch';target=witness['target'];new=target;why+=' The exact registry alias names currentPath '+target+'; Phase 9 changes this emitted pointer only.'
  elif r['id']=='reference-000228':
   target='docs/platform/runner/decisions/h-36d872fbb0e5.md';anchor='0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập';new=target+'#'+anchor
   assert '## 0020' in body(target)
   witness={'target':target,'targetSha256':sha(body(target)),'anchor':anchor,'claim':'0020 Chặn fgos khỏi worktree-worker (không khóa, không cô lập): retained narrative states this no-.fgos worker constraint; matches prior Step 3 batch-080 edge maps-j-04927'};disp='patch'
  elif 'docs/specs/<area>.md' in r['expression'] or r['id']=='reference-000277':
   disp='parked';block='Generic scope/quadrant help must co-cut its owning construction and generator/default contract; no generic root substitution. Exact text candidate awaits source/default receipt.'
  elif r['expression'].startswith('docs/how-to') and ('example' in r['expression'] or r['expression']=='docs/how-to'):
   # Existing examples name both external convention and synthetic parameters;
   # no claim that a fake example is this repository's live claim holder.
   disp='parked';block='Example/scanner argument still describes quadrant layout. Need source construction, registered currentPath/alias-only semantics and same-input proof from generator/runtime seam before replacing it.'
  elif f=='src/setup/registrations.mjs' and 'inventory-data.json' in r['expression']:
   disp='parked';block='Historical inventory reader is real: source-conservation reads this file, then row.oldPath and registry aliases. Bounded inventory and state export absent; keep reader until separately reviewed evidence-relocation packet.'
  else:
   why+=' Preserve actual retained path, synthetic fixture bytes or external-project convention; L12-10/26 keep these roots. Preserve is not a parity pass.'
 fixture=None
 if role=='synthetic-fixture':
  call=scope(f,sp[0]['line']);decl=call['line'];ls=body(f).splitlines();end=next((i for i in range(decl,len(ls)) if re.match(r'    (?:async )?fn ',ls[i])),len(ls))
  fixture={'sourceFile':f,'sourceSha256':sha(body(f)),'owningTest':call,'fullConstructionPassage':'\n'.join(ls[decl-1:end]),'provenance':'Inline synthetic YAML/narrative fixture constructed under std::env::temp_dir with process id (+line for MCP); not a relocated recorded outcome. Docs/history paths exercise external-project convention; traversal sentinel intentionally kept.'}
 e={'referenceId':r['id'],'admission':admission,'inventory':r['origins'][0]['inventory'],'edgeId':r['origins'][0]['id'],'inputCommit':r['origins'][0]['pin'],'inventoryOrigins':r['origins'],'slotKey':None,'sourceSpans':sp,'originalSourceSpans':old,'matchedExpression':r['expression'],'passage':own['text'],'passageSpan':{k:own[k] for k in ['startLine','endLine']},'role':role,'disposition':disp,'reason':why,'target':target,'anchor':witness.get('anchor') if witness else None,'resolverWitness':witness or {'rule':'retained/external project or comment; no replacement claimed','currentPath':r.get('legacyTarget'),'exists':(ROOT/r.get('legacyTarget','__none__')).is_file()},'timing':'phase9' if disp in ['patch','parked'] else 'none','diffHunk':None,'blockedCategory':'cutover-patch-only' if block else None,'blockedReason':block,'dependency':block,'dependencyCategory':'step5-parity' if block else None,'successorNote':None,'aliasWriteCheck':{'isWriter':False if role in ['comment','emitted-message'] else None,'destinationIsAlias':False if role in ['comment','emitted-message'] else None,'evidence':'No operation changes here; this record never adopts aliases as writer destinations.'},'proposedReplacement':new,'priorRecordRefs':PRIOR[f] and [{'recordFile':p['recordFile'],'recordSha256':p['recordSha256'],'matchingSlots':[s for s in p['slots'] if any(s.get('edgeId')==o['id'] for o in r['origins'])]} for p in PRIOR[f]] or [],'fixtureProvenance':fixture,'rejectionRule':('prior-comment-slot' if covered else 'history-design-contract-evidence') if admission=='REJECT' else None,'receiptId':r['pilotSeam']+'-pilot'}
 if fixture:
  e['aliasWriteCheck']={'isWriter':bool(re.search(r'create_dir_all|fs::write|remove_dir_all',e['passage'])),'destinationIsAlias':False,'evidence':'Temporary synthetic target under test root, never a registry alias. Full constructor/inline payload and owning test are pinned in fixtureProvenance.'}
 if admission=='ADMIT':
  e['proofCommand']='missing'
  e['proofScope']='Exact same-input current/candidate message/read/write/finding parity; existing module targets are named in the owning seam receipt and are not universal parity proofs.'
  if fixture:
   name=re.search(r'\bfn (\w+)\(',fixture['owningTest']['declaration'])
   if name:e['proofCommand']='env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos-gateway '+name[1];e['proofScope']='Existing synthetic fixture behavior only; no HTTP parity proof inferred.'
  e['parityObligation']={'current':r['expression'],'candidate':e['proposedReplacement'] if disp=='patch' else r['expression'] if disp=='preserve' else None,'comparison':'Same fixture/export on both sides; exact bytes/strings and status/category/exit for messages, or target set/mode/content/scan findings for readers/writers/defaults. No normalization. Exact qualified receiptId joins the per-seam fields.','blocker':block}
 return e

# Dynamic sites are a deliberately broad census, so scalar/type/import/string
# false positives are rejected with their concrete use, not absence of a doc cue.
NON_DOC_PARTS=['.fgos','Cargo.toml','node_modules','package.json','.git','index.html','config.json','settings.json','config.toml','instructions.md','*.test','bin/fgos','plugins/','scripts/']
DOMAIN={
'agent-cli-trust':'trust stamp and provider sandbox directory','agent-hooks':'provider hook settings and scripts','agy-permissions':'provider command-permission denylist','ansi':'terminal ANSI formatting','bin-discovery':'installed host/legacy payload resolution','blind-steps-proven-pools':'executor pool proof settings','config-merge':'global/project configuration merge','event-store-checks':'event-store installation/health configuration','event-store-fixes':'event-store repair directories','executor-posture-coverage':'executor capability/posture sets','executor-profile-warnings':'executor capability warnings','git-checks':'Git hook/checkout diagnostics','git-hooks':'Git hook install paths','holder-lock-checks':'holder-lock registry/record diagnostics','lock-record-checks':'holder-lock record validation','model-pool-checks':'model/executor configuration','project-launcher':'project launcher roots','run-supervisor-checks':'attempt/supervisor configuration and runtime diagnostics','shell-rc':'shell rc profile installation','terminal-control-checks':'terminal driver health','workflow-pool-independence':'workflow executor pool selection'}

def dynamic_trace(d):
 f=d['file'];t=d['callSite'];mapping=line_map(ORIGINAL_PIN,f);n=mapping.get(t[0]);expr=t[4];ls=body(f).splitlines()
 if n is None:
  hits=[i for i,l in enumerate(ls,1) if expr in l]
  if len(hits)==1:n=hits[0]
 # Location failure is an explicit park; never transplant a repeated token.
 evidence=context(f,[{'line':n}]) if n else {'startLine':t[0],'endLine':t[2],'text':'\n'.join(blob(ORIGINAL_PIN,f).splitlines()[t[0]-1:t[2]])}
 caller=scope(f,n or 1);name=caller['declaration'];stem=pathlib.Path(f).stem;txt=evidence['text'];kind=t[5]
 admission='ADMIT';disp='parked';reason=None;target=None;block='Caller-dependent path or target set requires a bounded export/construction proof; no path rewrite proposed.';role='unresolved-construction';fixture=None
 if n is None:
  block='Frozen dynamic tuple has no unique content relocation at current pin; later owning seam must rebind actual operation.'
 elif re.search(r'^(?:use |import )',ls[n-1].lstrip()) or re.fullmatch(r'(?:root|path|dir):\s*(?:&?(?:std::)?path::)?(?:&?Path(?:Buf)?|String)',expr.strip()):
  admission='REJECT';disp='preserve';reason='Syntactic type/import or field declaration, not a filesystem operation: '+repr(ls[n-1]);block=None;role='type/import'
 elif any(x in expr for x in ['stdout_thread.join','stderr_thread.join','parts.join','lines.join','message.join',"join(', '","join(' '","join('; '"]):
  admission='REJECT';disp='preserve';reason='Concrete non-document operation: thread wait or array/string serialization, not path resolution: '+repr(expr);block=None;role='scalar/thread'
 elif kind=='template-string' and 'docs/' not in expr and 'HOW_TO_DOC' not in expr:
  admission='REJECT';disp='preserve';reason='Concrete scalar diagnostic/serialization template; its literal output is '+repr(expr)+'. It formats values at '+name+'; contains no documentation-location operand and is not a filesystem operation.';block=None;role='non-document-message'
 elif f.startswith('apps/'):
  if 'get_contract(' in name or 'search_contract(' in name or 'contract_route_is_reachable' in name or re.search(r'search_(with|query)',name):
   disp='preserve';role='fixture-writer' if 'test' in name or 'search_with' in name or 'search_query' in name or 'contract_route' in name else 'contract-reader';target='root/docs/contracts/fgos-gateway-api-v1.yaml';block=None
   reason='Caller '+name+' binds root into the retained contract read/test fixture; HTTP and MCP keep identical path and fixture bytes. Exact operation: '+repr(expr)
   fixture={'sourceFile':f,'sourceSha256':sha(body(f)),'test':name,'construction':'temp_dir + process id (+ line for MCP), mkdir docs/contracts, write the inline YAML, invoke reader, remove temp root'} if role=='fixture-writer' else None
  elif 'get_work_docs(' in name or 'docs' in name.lower() or 'feature_dir' in expr:
   disp='preserve';role='work-narrative-reader/fixture';target='root/docs/history/<external-project-feature>/{CONTEXT.md,plan.md}';block=None
   reason='L12-10 external project narrative convention. get_work_docs obtains docsRef from show envelope, canonicalizes docs/history and docsRef, rejects containment escape, reads only CONTEXT.md/plan.md; fixture temp roots are not authority holders. Own operation '+repr(expr)
   fixture={'sourceFile':f,'sourceSha256':sha(body(f)),'test':name,'construction':'temporary test root; inline synthetic docsRef + CONTEXT.md/plan.md / secret.txt traversal sentinel'} if 'test' in name or 'docs_' in name else None
  else:
   admission='REJECT';disp='preserve';block=None;role='gateway-config/static/verb-fixture'
   reason='Concrete gateway function '+name+' operates on token config, verb argv, static web assets or isolated route fixtures, rather than the contract reader or narrative reader. Operation '+repr(expr)+'; own complete source context attached.'
 elif f=='.githooks/pre-commit':
  if 'HOW_TO_DOC' in expr or 'docs/' in expr:
   disp='preserve';block=None;role='emitted-message';target='HOW_TO_DOC or literal recovery pointer';reason='refuse writes this exact diagnostic to stderr; canonical literal references own the proposed pointer edits. All other diagnostic bytes and exit 1 remain unchanged.'
  else:
   admission='REJECT';disp='preserve';block=None;role='git-index/lock/config';reason='Hook '+name+' uses Git checkout/index/lock or beacon identity; exact operand '+repr(expr)+' is accounted in that non-document protection, not a doc path consumer.'
 elif f=='src/cli/command-registry.mjs':
  admission='REJECT';disp='preserve';block=None;role='schema/help-data';reason='This module contains pure command data. Census token '+repr(expr)+' is a JSON schema property/help scalar, not an executable path constructor. Documentation literals are separately admitted by physical span.'
 elif f=='bin/fgos.mjs':
  disp='preserve';block=None;role='help-message';reason='handleHelp/handleVerbHelp emits exact usage-validation strings for selector parsing. No doc path operand; selected because help is explicitly in pilot. Compare byte-exact strings, JSON values and exits; no change specified.'
 elif stem in DOMAIN:
  admission='REJECT';disp='preserve';block=None;role='non-document-infrastructure';reason='Concrete owning subsystem: '+DOMAIN[stem]+'. '+name+' uses '+repr(expr)+' in this subsystem; whole source/body and exact current passage are attached. This is not a documentation-authority root rewrite.'
 elif stem=='instruction-registry':
  if 'readDecisionIds' in name or 'compileInstructionUnit' in name and 'Decision' in txt:
   role='state-verified-decision-reader';target="projectRoot/docs/decisions/index.md + buildDecisionIndexMarkdown(listWork(fgosDir).decisions)";reason='readDecisionIds requires file bytes equal state-derived index before scope-carrying decisions are trusted. Shared state export absent; UNKNOWN_DECISION message remains literal.';block='instructions-058: bounded decisions export and index equality fixture missing.'
  elif any(x in name for x in ['scanMarkdownFiles','discoverKnownOwners','discoverInstructionSources']):
   role='instruction-discovery';target='projectRoot/{core/instructions,components/<registered>/instructions,domains/<registered>/instructions}; manifest options.manifestPath ?? docs/architecture-manifest.json';disp='preserve';block=None;reason='Retained manifest/default discovery door; actual scan rejects canonical paths escaping projectRoot, skips hidden entries, recognizes lowercase .md, rejects unknown owner/duplicate id. No root delta in pilot.'
  else:
   admission='REJECT';disp='preserve';block=None;role='instruction-metadata';reason='Metadata parsing/validation in '+name+'; '+repr(expr)+' is not a new doc root or filesystem target.'
 elif stem=='registrations':
  if any(x in name for x in ['checkDoc','fixDoc','checkDecisionIndex','fixDecisionIndex','checkEnduserDocs','fixEnduserDocs','InstructionProjection','looksLikeDocPath']):
   role='doctor-document-reader/writer';target='resolveMainCheckout(cwd) ?? cwd; registry/currentPath/sourceCaptureIds or retained docs/** and existing generators'
   reason='Existing doctor registration '+name+' consumes '+repr(expr)+'. Check/fix intent and output must compare against the same bounded source state, never live state in this pilot.'
   block='Bounded registry/decision/outcome/inventory export and post-retirement scan-set parity missing; no automatic fix/root rewrite authorized.'
  elif 'docs/' in txt or "'docs'" in txt:
   role='doctor-doc-dependent';reason='Concrete documentation-related source in '+name+': '+repr(txt);target='own literal/construction in passage';block='Cross-seam bounded consumer target proof pending.'
  else:
   admission='REJECT';disp='preserve';block=None;role='doctor-config/infrastructure';reason='Doctor '+name+' config/default/check operation '+repr(expr)+' belongs to installation/runtime health. Its exact declaration and source context give the non-document use; no root change specified.'
 elif stem=='instruction-composition':
  if 'effectiveSetRelativePath' in name:
   role='effective-set-destination';disp='preserve';block=None;target='.fgos/instructions/effective/'+ '<effectiveSetKey(target)>.json';reason='Pure destination string for downstream projection materialization; retained state directory, no documentation-root relocation. '+repr(expr)
  else:
   admission='REJECT';disp='preserve';block=None;role='instruction-IR';reason='Pure effective-set metadata/composition operation '+repr(expr)+' in '+name+'; no filesystem write in this module. P5 materializes its IR elsewhere.'
 elif stem=='skill-wrappers':
  role='instruction/generator';target='existing source and generated instruction/skill surfaces from caller options';reason='Instruction composition or skill wrapper owner '+name+' uses '+repr(expr)+'; generated outputs cannot be edited here.';block='Owning generators/projections seam must trace source/config/export and complete output set; no generated diff authored.'
 else:
  reason='Exact caller '+name+' with expression '+repr(expr)+' is conservatively admitted; concrete destination is not proved, so no rejection or patch is manufactured.'
 return {'proofCommand':'missing' if admission=='ADMIT' else None,'parityObligation':{'currentTuple':t,'candidateConstruction':target if disp=='preserve' else None,'comparison':'Same bounded input/export; exact target/output/status/findings with no semantic normalization. No candidate output claimed when parked.','blocker':block} if admission=='ADMIT' else None,'id':d['id'],'originalTuple':t,'inventoryOrigins':d['inventories'],'inputCommit':ORIGINAL_PIN,'admission':admission,'disposition':disp,'currentLine':n,'currentPassage':evidence,'caller':caller,'inputs':[expr],'role':role,'targetSetOrConstruction':target,'stateExportDependency':block,'fixtureProvenance':fixture,'rejectedAsUnrelatedReason':reason if admission=='REJECT' else None,'reason':reason,'blockedSeams':[file_seam[f]] if block else [],'blockedReason':block,'receiptId':file_seam[f]+'-pilot'}

if __name__=='__main__':
 (P/'step-05-records').mkdir(exist_ok=True)
 records=[];measure=[]
 for seam in SEAMS:
  start=time.perf_counter();startutc=datetime.datetime.now(datetime.timezone.utc).isoformat();group=[]
  for f in sorted(f for f in selected_files if file_seam[f]==seam):
   text=body(f);refs=[make_ref(r) for r in SELECTED if r['file']==f]
   dyn=[dynamic_trace(d) for d in DYNAMIC if d['file']==f and (d['seam']==seam or f!='bin/fgos.mjs' and file_seam[f]==seam and not f.startswith(('src/intake','src/runner','src/state')))]
   # Promoted files retain only emitted-message tuple memberships in this seam;
   # their unrelated runtime constructions stay in the original owning queue.
   edits={}
   lineoffsets=[0]
   for line in text.splitlines(True):lineoffsets.append(lineoffsets[-1]+len(line))
   for e in refs:
    if e['disposition']=='patch':
     assert len(e['sourceSpans'])==1
     sp=e['sourceSpans'][0];a=lineoffsets[sp['line']-1]+sp['columnStart']-1;b=a+len(sp['text'])
     assert text[a:b]==sp['text']
     edits[(a,b)]=e['proposedReplacement']
   after=text
   for (a,b),new in sorted(edits.items(),reverse=True):after=after[:a]+new+after[b:]
   diff=''.join(difflib.unified_diff(text.splitlines(True),after.splitlines(True),'a/'+f,'b/'+f)) or None
   for e in refs:
    if e['disposition']=='patch':e['diffHunk']=diff
   r={'file':f,'authorInputCommit':PIN,'sourceSha256':sha(text),'sourceMode':MODE[f],'censusOrigins':sorted({o['inventory'] for x in SELECTED if x['file']==f for o in x['origins'] if o['inventory']}|{i for d in DYNAMIC if d['file']==f for i in d['inventories'] if i}),'priorRecordRefs':PRIOR[f],'seamIds':[seam],'wholeFileRead':True,'wholeFileReadEvidence':{'bytes':len(text.encode()),'lines':len(text.splitlines()),'sha256':sha(text),'method':'Complete body read by authoring pass; every frozen literal/current passage and dynamic tuple classified; independent whole-context semantic review pending.'},'references':refs,'dynamicTraces':dyn,'inheritedCarries':[c for c in CARRIES if c['file']==f and c['seam']==seam],'diff':diff,'expectedAfterSha256':sha(after),'rollbackDiff':''.join(difflib.unified_diff(after.splitlines(True),text.splitlines(True),'a/'+f,'b/'+f)) or None,'coCutPaths':['CHANGELOG.md'] if diff else [],'receiptIds':[seam+'-pilot'],'protectedPins':PROTECTED,'parked':[e['referenceId'] for e in refs if e['disposition']=='parked']+[e['id'] for e in dyn if e['disposition']=='parked'],'review':{'status':'pending','reviewer':None,'report':None}}
   group.append(r);records.append(r)
  linesave('step-05-records/'+seam+'.jsonl',group)
  elapsed=time.perf_counter()-start
  measure.append({'seam':seam,'authoringPassStartedAt':startutc,'authoringPassSeconds':elapsed,'timingScope':'Measured record-construction/admission replay only; shared investigation elapsed is not charged as per-seam review time. Not reviewer throughput.','files':len(group),'literalReferences':sum(len(r['references']) for r in group),'literalAdmitted':sum(e['admission']=='ADMIT' for r in group for e in r['references']),'literalRejected':sum(e['admission']=='REJECT' for r in group for e in r['references']),'dynamicTuples':sum(len(r['dynamicTraces']) for r in group),'dynamicAdmitted':sum(e['admission']=='ADMIT' for r in group for e in r['dynamicTraces']),'dynamicRejected':sum(e['admission']=='REJECT' for r in group for e in r['dynamicTraces']),'behavioralFileRecords':sum(any(e['admission']=='ADMIT' and e['role']!='uncovered-comment-navigation' for e in r['references']+r['dynamicTraces']) for r in group),'parkedFileRecords':sum(bool(r['parked']) for r in group),'parkedReferences':sum(e['disposition']=='parked' for r in group for e in r['references']),'parkedDynamicTuples':sum(e['disposition']=='parked' for r in group for e in r['dynamicTraces']),'patchFileRecords':sum(bool(r['diff']) for r in group)})
 save('step-05-pilot-measurements.json',{'inputCommit':PIN,'measurements':measure,'independentReview':'not started; no elapsed reviewer rate inferred','globalQueue':'Original frozen census unchanged; promoted memberships are a pilot overlay, not dropped from their source inventories.'})
 print(json.dumps(measure,ensure_ascii=False))
