"""Apply L12-72 to records only; original census identities and source bytes stay pinned."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,copy,hashlib,importlib.util,collections,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('pilot',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
sha=m.sha
files=sorted((P/'step-05-records').glob('*.jsonl'))
sets={f:[json.loads(l) for l in f.read_text().splitlines()] for f in files};rs=[r for a in sets.values() for r in a];by={r['file']:r for r in rs}
original=copy.deepcopy(rs);changes=[]
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def ident(e):return e.get('referenceId',e.get('id'))
def body(r):return m.pinned(r['authorInputCommit'],r['file']) if r.get('wholeFileRead',True) else ''
def line(r,d):
 ls=body(r).splitlines();n=d.get('currentLine');return ls[n-1] if n and n<=len(ls) else d.get('currentPassage',{}).get('text','')
def outcome(e,ad,disp,why,cat=None):
 e.update(admission=ad,disposition=disp,reason='L12-72: '+why,blockedReason=None)
 if 'originalTuple' in e:
  x=e['originalTuple'][4];e['reason']+=' Own census operand '+repr(x)+'.'
  e.update(rejectedAsUnrelatedReason=e['reason'] if ad=='REJECT' else None,stateExportDependency=None,blockedSeams=[])
  if ad=='REJECT':e.update(nonDocumentUse=cat or 'scalar-pass-through',pathOperand=None,role=cat or 'scalar-pass-through',targetSetOrConstruction=None)
  else:e.pop('nonDocumentUse',None)
 else:e.update(blockedCategory=None,dependency=None,dependencyCategory=None,timing='none' if disp in ['preserve','render-join'] else 'phase9')
 if e.get('parityObligation'):e['parityObligation']['blocker']=None

def reject(d,why,cat):outcome(d,'REJECT','preserve',why,cat)
def admit(d,why,disp='preserve'):outcome(d,'ADMIT',disp,why);d['role']='document-path-operation'
def ids(s):return {'dynamic-'+f'{int(x):06}' for x in s.split()}
forcedreject={
 **{x:'clone-directory' for x in ids('1682 1683 1698 1710 1765 1766')},
 **{x:'non-document-fs-probe' for x in ids('1721 1749 1769 1703')},
 **{x:'root-only' for x in ids('1694 1695 1809 1810 1812 1813 1714 1733 1738 1758 1764 1781 1789 1794 1799 1816 6448 6449')},
 **{x:'accumulator' for x in ids('1753 6600 9721')},
 **{x:'table-row-serialization' for x in ids('1804')},
 **{x:'text-label-join' for x in ids('7358 7359 7362 9732')},
 **{x:'cargo-output-directory' for x in ids('6393 6395 6428')},
 **{x:'state-event-store' for x in ids('9770 13884 13886 13887 13896 13901 13902 13914 13915')},
 **{x:'scalar-pass-through' for x in ids('13904 13881 13922 13926 13929 7302 7303 7314 7318 7319 7126 7127 6603 6572 6684 6824 6825 7112 7113 9735')},
 **{x:'finding-path-field' for x in ids('9790 9799 9800 9759 9772 6601 6583 7289 7304 7305 7326 7327')},
 **{x:'guard' for x in ids('6550 6829 6872 6957 6974 6975 7072 7296 7123')},
}
forceadmit=ids('1711 1741 1791 1815 2092 2093 6479 6547 6548 6609 6617 6623 6597 6596 6607 6739 7070 6743 6744 6813 6805 6812 6788 7297 6358 6359 6365 6411 6412 6420 6421')
# Genuine git document reads; caller-only error text remains formatting under R6.
forceadmit|=ids('6732 6741')
GATES=('scripts/check-doc-','scripts/doc-alias-resolver','scripts/doc-binding-repair','scripts/doc-inventory-artifact','scripts/doc-link-pass','scripts/doc-rationale-facts','scripts/generate-doc-inventory','scripts/generate-shipped-path-inventory','scripts/propose-doc-decisions')
# Each rejected occurrence receives a closed R5 category, selected from its own operation.
def category(r,d):
 x=d['originalTuple'][4];s=line(r,d)
 if '.fgos' in x or 'events.jsonl' in x or re.search(r'\bfgosDir\b',x):return 'state-event-store'
 if 'CLONES_DIR' in x or 'upstreams' in x:return 'clone-directory'
 if 'CARGO_TARGET_DIR' in x or 'resolvedOut' in x:return 'cargo-output-directory'
 if '".git"' in x or "'.git'" in x:return 'non-document-fs-probe'
 if re.search(r'\b(?:lines|aa|bb|labels|parts|segments|sections|rest|frontmatterLines|reasons|unheaded)\.join',x) or x.startswith('join('):return 'text-label-join'
 if x.lstrip().startswith(('//','/*','*')) or d['originalTuple'][5]=='comment':return 'comment-or-type'
 if re.search(r'^(?:path|sourcePath|targetPath|docPath|oldPath|newPath|filePath|currentPath|canonicalDir|relativeFragmentPath|scanRoots|additionalRootFiles)\s*:',x):return 'finding-path-field'
 if re.search(r'(?:Root|root|cwd)\s*=|process.cwd\(|requireRoot\(|resolveMainCheckout',x):return 'root-only'
 if 'new Map(' in x or 'new Set(' in x or re.search(r'=\s*(?:\[\]|\{\}|null)(?:\W|$)',x):return 'accumulator'
 if re.search(r'===|!==|startsWith\(|endsWith\(|\.test\(|indexOf\(|typeof |\|\||&&',x):return 'guard'
 if x.startswith('`') or '${' in x:return 'caller-data-formatting'
 if re.search(r'(?:scope|root|dir|path)\s*:',x,re.I):return 'config-or-metadata'
 return 'scalar-pass-through'
# Broad R5 sweep, followed by reviewed positive exceptions.
for r in rs:
 if r.get('generated'):continue
 f=r['file']
 for d in r['dynamicTraces']:
  x=d['originalTuple'][4];s=line(r,d);cat=forcedreject.get(d['id'])
  if not cat and d['admission']=='ADMIT':
   if re.search(r'\.fgos|events\.jsonl|\bfgosDir\b',x):cat='state-event-store'
   elif re.search(r'\.git[\x22\x27/]',x):cat='non-document-fs-probe'
   elif re.search(r'^(?:path|sourcePath|targetPath|docPath|oldPath|newPath|filePath|currentPath|canonicalDir|relativeFragmentPath)\s*:',x) and not re.search(r'path\.(?:join|resolve|relative)|posixJoin\(',x):cat='finding-path-field'
   elif re.search(r'\b(?:lines|aa|bb|labels|segments|sections|rest|frontmatterLines|reasons|unheaded|ambiguousNotes)\.join\(',x):cat='text-label-join'
   elif re.search(r'^(?:\w*(?:Root|root)|ROOT|root|dir)\s*=\s*(?:process\.cwd|requireRoot|findRoot|resolveMainCheckout|resolveProjectRoot|mainCheckout|context\.repoRoot|REPO_ROOT|parent|args\.root|options\.repoRoot)',x):cat='root-only'
   elif re.search(r'^path\.resolve\((?:args\.root|process\.argv\[1\]|import\.meta\.dirname|path\.dirname\(fileURLToPath)',x):cat='root-only'
   elif re.search(r'^(?:repoRoot|retiringRoots|sourcePath|resolvedPath|root|fgosRoot|consumerPath)\s*=\s*(?:null|process\.cwd|repoRoot|REPO_ROOT)',x):cat='scalar-pass-through'
   elif re.search(r'=\s*(?:\[\]|\{\}|null)(?:\W|$)',x):cat='accumulator'
   elif 'contractScope ===' in x or re.search(r'^\w*RootIdx =|^repoRootIdx =|^dirIdx =|^dirFlagIndex =',x):cat='guard'
   elif x.startswith('`') and not re.search(r'docs/|REFS_DIR|HOW_TO_DOC|PLAN_DIR|DEFAULT_\w+_PATH|OWNER_ROOT|\.agents/|\.claude/',x):cat='caller-data-formatting'
  if cat:reject(d,f+': '+cat+'; own operation '+repr(s.strip())+' does not read, write, probe or emit a document path.',cat)
  if d['id'] in forceadmit:
   admit(d,f+': own operation '+repr(s.strip())+' reads/constructs/emits a document path under R6; fixed conventions and frozen gate paths preserve.')
  if d['admission']=='ADMIT' and d['disposition']=='parked':
   if f.startswith('core/skills/distill/'):
    admit(d,f+': retained project-local docs/distillery convention (L12-26(3)); source path is fixed and does not migrate.')
   elif f.startswith(GATES):
    admit(d,f+': migration gate document operand; L12-72 R9 freezes this gate in Phase 8. No named Phase 9 obligation changes this operation; preserve exact gate identity.')
   elif f in ['scripts/list-doc-anchors.mjs','scripts/next-doc-id.mjs']:
    admit(d,f+': retained document reader convention; caller root does not require a generator export.')
  if d['admission']=='REJECT':d['nonDocumentUse']=category(r,d) if not cat else cat;d['pathOperand']=None
# Special hand-written source output classes after examining source, not the source-family label.
for r in rs:
 if r.get('generated'):continue
 f=r['file']
 if f=='scripts/project-agents.mjs':
  for d in r['dynamicTraces']:
   if d['admission']=='ADMIT' and d['disposition']=='parked':
    if 'core' in d['originalTuple'][4] and 'agents' in d['originalTuple'][4]:reject(d,'Agent YAML inputs are executor configuration, not document paths.','config-or-metadata')
    elif d['id'] in ids('8501 8502 8503 8505 8506 8507 8509 8510 8537 8538 8541 8542'):reject(d,'Agent configuration enumeration/root plumbing, not document paths.','config-or-metadata')
 if f in ['scripts/test-select-promote-report.mjs','scripts/test-select-promote.mjs','scripts/run-rust-dev-host.mjs','scripts/git/e3-bench.mjs','scripts/measure-coordination-baseline.mjs']:
  for d in r['dynamicTraces']:
   if d['admission']=='ADMIT':reject(d,'Build/test/runtime artifact path; no document operand.','config-or-metadata')
# Literal correction and truthful witnesses; no inferred existence for patterns.
for r in rs:
 for e in r['references']+r.get('authorAddedReferences',[]):
  w=e.get('resolverWitness',{});expr=e.get('matchedExpression','');q=expr.split('#')[0].replace('\\/','/')
  if 'existsAtPin' in w:
   if any(c in q for c in '*<>') or '\n' in q or '(?:' in q:w.pop('existsAtPin');w['expressionKind']='pattern, not one path'
   else:w['existsAtPin']=bool((ROOT/q).exists())
  if ident(e)=='reference-003700':outcome(e,'ADMIT','preserve','Design-origin comment, like sibling 003699; docs/explanation exists and this comment defines alias design history.');w['rule']='Design-origin comment provenance; no runtime path change';w['existsAtPin']=True
  if r['file'].startswith('scripts/check-doc-') and e.get('disposition')=='preserve':
   w['rule']='L12-72 R9: exact migration gate identity; Phase 8 gate bytes frozen; final gate disposition remains Phase 9 custody.'
  if ident(e) in ['reference-002483','reference-002484']:e['role']='live-read'
  if ident(e) in ['reference-002482','reference-002485']:e['role']='emitted-message'
  if ident(e)=='reference-003698':w['rule']='Dated pre-cutover module-header provenance at '+r['authorInputCommit']+'; tree retires at Phase 9; no live end-user-index spec holder found in docs/platform or docs/knowledge.'
# Missing source slots for G3 and p06 classifyReleasePath; explicit line/column pins.
def add(r,expr,n,disp='preserve',target=None,why=''):
 src=body(r);ls=src.splitlines();col=ls[n-1].index(expr)+1
 old=next((e for e in r.get('authorAddedReferences',[]) if e.get('matchedExpression')==expr and any(s['line']==n for s in e.get('sourceSpans',[]))),None)
 if old:
  if disp=='patch':
   outcome(old,'ADMIT','patch',why);old.update(target=target,proposedReplacement=target,anchor=None);old['resolverWitness']={'rule':why,'targetSha256':sha((ROOT/target).read_bytes())}
  return old
 key='author-s4-'+sha(r['file']+':'+str(n)+':'+str(col)+':'+expr)[:16];a=max(1,n-3);b=min(len(ls),n+3)
 e={'id':key,'admission':'ADMIT','matchedExpression':expr,'sourceSpans':[{'line':n,'columnStart':col,'columnEndExclusive':col+len(expr),'text':expr}],'passageSpan':{'startLine':a,'endLine':b},'passage':'\n'.join(ls[a-1:b]),'role':'source-navigation','disposition':disp,'reason':'L12-72 R3: '+why,'resolverWitness':{'rule':why,'inputCommit':r['authorInputCommit']},'target':target,'anchor':None,'proposedReplacement':target,'timing':'phase9' if disp=='patch' else 'none','diffHunk':None,'blockedReason':None,'dependency':None,'blockedCategory':None,'dependencyCategory':None,'successorNote':None,'receiptId':r['receiptIds'][0],'proofCommand':'missing','proofScope':'Records-only proposed source edit; no cutover or regeneration pass.'}
 if target:e['resolverWitness'].update(targetSha256=sha((ROOT/target).read_bytes()),targetExistsAtPin=True)
 r.setdefault('authorAddedReferences',[]).append(e);return e
newpatches=[]
for f,expr,target in [
 ('core/skills/_shared/catchup-self-recovery.md','docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md','docs/knowledge/how-to-diagnose-a-verify-fail-post-merge-block-on-approve/diagnose-a-verify-fail-post-merge-block-on-approve.md'),
 ('domains/coding/skills/fgos-coding-planning/references/scope-and-reclaim.md','docs/how-to/write-verify-for-a-skill-prose-change.md','docs/knowledge/how-to-write-verify-for-a-skill-prose-change/write-verify-for-a-skill-prose-change.md')]:
 if f not in by:
  f=next(k for k in by if k.endswith('/scope-and-reclaim.md') and not by[k].get('generated'))
 r=by[f];n=next(i for i,l in enumerate(body(r).splitlines(),1) if expr in l)
 # Resolve from actual holder filename, not a guessed folder.
 matches=list((ROOT/'docs/knowledge').glob('*/'+pathlib.Path(expr).name));assert len(matches)==1,(expr,matches)
 target=str(matches[0].relative_to(ROOT));e=add(r,expr,n,'patch',target,'Live holder exists; source has no owning prior slot, add exact source slot before render-joining copies.');newpatches.append((r,e))
for r in rs:
 if r.get('generated') or not (r['file'].startswith('core/skills/distill/') and r['file'].endswith('.md')):continue
 for n,l in enumerate(body(r).splitlines(),1):
  for h in re.finditer(r'docs/distillery/[^\s`<>)]*(?:<[^>]+>[^\s`)]*)?',l):
   expr=h[0].rstrip('.,');add(r,expr,n,why='Retained runtime-created project-local docs/distillery area; no alias/relocation. Existing Deep Dive prior slot remains its owner where present.')
  if 'docs/reference-learning-system.md' in l:
   e=add(r,'docs/reference-learning-system.md',n,why='Dated reference-learning design citation; absent at input pin. No unique live successor with this identity; preserve provenance, not a navigation guarantee.');e['resolverWitness']['existsAtPin']=False;e['successorNote']='No unique live narrative holder found; core/skills/distill/SKILL.md owns the current learning-area procedure (not an asserted replacement document).'
r=by['scripts/build-rust-distribution.mjs']
for n,l in enumerate(body(r).splitlines(),1):
 if 98<=n<=101:
  for expr in ['docs/','README.md','LICENSE']:
   if expr in l:add(r,expr,n,why='classifyReleasePath classifies the package files document payload as immutable-doc; package.json files owns the shipped set, no move inferred.')
# Exact source-only specifications for added G3 patches; reuse owning full-file diff and grep doors.
specdata=m.read('step-05-seam4-cutover-specs.json');specs=specdata['patches'];receipts=m.read('step-05-seam4-parity-receipts.json');rec={r['id']:r for r in receipts['receipts']}
for r,e in newpatches:
 before=body(r);base=next((s for s in specs if s['file']==r['file']),None)
 after=before
 if base:
  # Existing source hunks remain authoritative; compose substitutions from their source spans.
  import tempfile
  sp2=importlib.util.spec_from_file_location('s4',P/'step-05-seam4-check.py');s4=importlib.util.module_from_spec(sp2);sp2.loader.exec_module(s4)
  after=s4.apply(r['file'],before.encode(),base['diff']).decode()
 after=after.replace(e['matchedExpression'],e['target']);diff=m.m.make_diff(r['file'],before,after);rollback=m.m.make_diff(r['file'],after,before)
 g=m.test_grep(r['authorInputCommit'],e['matchedExpression']);cuts=sorted(set((base or {}).get('coCutPaths',[]))|{r['file'],'CHANGELOG.md'}|{h['file'] for h in g['matches']})
 s=base or {'inputCommit':r['authorInputCommit'],'file':r['file'],'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'symbolOrPassage':e['matchedExpression'],'sourceSpans':e['sourceSpans'],'targetOwner':e['target'],'claimAnchorProof':e['resolverWitness'],'receiptId':r['receiptIds'][0],'testTargets':['env -u CLAUDE_CODE_SESSION_ID node --test test/skills/fgos-mirror.test.mjs test/setup/skill-wrappers.test.mjs'],'prerequisites':['Step 7 composes source hunks; Phase 9 executes build:skills from the composed sources and compares same-input output sets.'],'order':'Source before render','timing':'phase9','coCutTestGreps':[],'coCutTestDecisions':[]}
 s.update(oldText=e['matchedExpression'],newText=e['target'],diff=diff,rollbackDiff=rollback,expectedAfterSha256=sha(after),coCutPaths=cuts,expectedOutputSets={'current':'step-05-seam4-output-provenance.json','candidate':None},intentionalBehaviorDeltas='Source navigation points to existing live knowledge holder; generated copies follow source.',readiness='pending independent review and Phase 9 same-input generated parity')
 if g not in s['coCutTestGreps']:s['coCutTestGreps'].append(g)
 for h in g['matches']:
  if not any(d['match']==h for d in s['coCutTestDecisions']):s['coCutTestDecisions'].append({'match':h,'disposition':'preserve','reason':'Pinned historical/synthetic test input; source navigation does not rewrite fixture provenance. Step 7 checks owning test composition.'})
 if base is None:specs.append(s)
 r.update(diff=diff,rollbackDiff=rollback,expectedAfterSha256=sha(after),coCutPaths=cuts);e['diffHunk']=diff
 for ref in r['references']+r['authorAddedReferences']:
  if ref['disposition']=='patch':ref['diffHunk']=diff
 rc=rec[s['receiptId']];rc['comparison']['intentionalDeltas']=[d for d in rc['comparison']['intentionalDeltas'] if d['file']!=r['file']]+[{'file':r['file'],'expectedAfterSha256':sha(after),'diff':diff,'packetOnly':False}];rc['coCutPaths']=sorted(set(rc['coCutPaths'])|set(cuts));rc.setdefault('coCutTestGreps',[]).append(g)
# Correct source-derived render dispositions, preserving exact owner identity.
def source_slot(r,e):
 src=r.get('sourceRenderProvenance',{}).get('sourceFile');sr=by.get(src);expr=e.get('matchedExpression');w=e.get('resolverWitness',{})
 if not sr:return None
 candidates=[x for x in sr['references']+sr.get('authorAddedReferences',[]) if x.get('matchedExpression')==expr]
 if candidates:return sr,candidates[0],{'kind':'step5','file':src,'id':ident(candidates[0])}
 if w.get('sourceRecord'):
  pr=w['sourceRecord'];old=m.rows(str(pathlib.Path(pr['recordFile']).relative_to(P.relative_to(ROOT))))[pr['recordLine']-1]
  found=next((x for x in old['edges'] if x.get('slotKey')==w['sourceSlotKey']),None)
  if found:return sr,found,{'kind':'prior','file':src,'recordFile':pr['recordFile'],'recordLine':pr['recordLine'],'slotKey':found.get('slotKey')}
 # Use inherited source occurrence, including split/multiline literals.
 candidates=[x['edge'] for x in sr.get('inheritedSourceSlots',[]) if x['edge'].get('matchedExpression')==expr or any(expr in s['text'] for s in x['edge'].get('sourceSpans',[]))]
 if candidates:return sr,candidates[0],{'kind':'inheritedSourceSlots','file':src,'index':sr['inheritedSourceSlots'].index(next(x for x in sr['inheritedSourceSlots'] if x['edge']==candidates[0]))}
 return None
for r in rs:
 if not r.get('generated') or not r.get('sourceRenderProvenance',{}).get('sourceFile'):continue
 sr=by.get(r['sourceRenderProvenance']['sourceFile'])
 if not sr:continue
 for e in r['references']:
  got=source_slot(r,e)
  if not got:
   # A source occurrence outside the original census needs its own explicit owner (R3).
   expr=e['matchedExpression'];hits=[n for n,l in enumerate(body(sr).splitlines(),1) if expr in l]
   assert hits,(r['file'],expr)
   source=add(sr,expr,hits[0],why='Retained source convention/provenance; copied output must derive from this exact source occurrence.');got=(sr,source,{'kind':'step5','file':sr['file'],'id':ident(source)})
  _,owner,locator=got;disp=owner['disposition'];outcome(e,owner.get('admission','ADMIT'),'parked' if disp=='parked' else 'render-join','Generated reference follows exact source owner '+sr['file']+':'+str(ident(owner) or owner.get('slotKey'))+'.')
  e['sourceOwner']=locator;e['sourceOwnerDisposition']=disp
  if disp=='parked':
   block='Source owner '+sr['file']+':'+str(ident(owner) or owner.get('slotKey'))+' is parked: '+str(owner.get('blockedReason') or owner.get('dependency'))
   e.update(blockedReason=block,dependency=block,blockedCategory='source-owner',dependencyCategory='source-owner',timing='phase9')
  if not e['resolverWitness'].get('prior'):
   # Prefer a sibling's canonical Step 4 physical join when it owns the same source passage.
   sibling=next((x for x in r['references'] if x is not e and x['matchedExpression']==e['matchedExpression'] and x['resolverWitness'].get('prior')),None)
   if sibling:e['resolverWitness']=copy.deepcopy(sibling['resolverWitness'])
 for d in r['dynamicTraces']:
  matches=[x for x in sr['dynamicTraces'] if x['originalTuple'][4]==d['originalTuple'][4]]
  if matches:
   owner=min(matches,key=lambda x:abs((x.get('currentLine') or 0)-(d.get('currentLine') or 0)));keep={k:copy.deepcopy(d[k]) for k in ['id','originalTuple','inventoryOrigins','currentLine','currentPassage','caller','inputs','enclosingFunctionEvidence'] if k in d}
   d.update({k:copy.deepcopy(v) for k,v in owner.items() if k not in keep});d.update(keep);d['sourceOwner']={'kind':'step5','file':sr['file'],'id':owner['id']};d['sourceOwnerDisposition']=owner['disposition']
# Generator parks: retain real missing inputs, with file/operation-specific contracts, never a proof-only generic blocker.
for r in rs:
 for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]):
  if e.get('disposition')!='parked':continue
  if e.get('sourceOwner'):continue
  expr=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]);n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line')
  f=r['file']
  if r.get('generated'):
   missing={'docs/decisions/index.md':'bounded state.decisions rows and committed index union input','docs/doc-registry.json':'folded view.docs/topics rows including currentPath, aliases, purposeTitle and sourceCaptureIds','docs/doc-registry.md':'folded view.docs/topics rows including currentPath, aliases and purposeTitle','docs/enduser-docs-index.json':'final document scan set and folded registry resolution input'}
   why=missing.get(f,'source-data rows for generated payload')
  elif f in ['src/setup/skill-wrappers.mjs','src/setup/instruction-projections.mjs','scripts/project-agents.mjs']:
   why='composed canonical instruction/skill/agent inputs and resulting generated destination inventory after source patches; final source bytes are not assembled'
  elif f in ['src/report/knowledge-resolver.mjs','src/report/knowledge-projection.mjs']:
   why='bounded folded docs/topics input with document lifecycle, aliases, currentPath and lineage; committed projections do not supply authoritative state'
  elif f.startswith('scripts/knowledge-') or f=='src/setup/registrations.mjs':
   why='bounded inventory and folded registry input for this operation at the final candidate tree; current legacy projection cannot establish candidate identities'
  elif f=='docs/backlog.md':why='Step 3 retained backlog header packet composition in Step 7; six source passages belong to that single hand-maintained header correction'
  elif f=='src/setup/instruction-registry.mjs':why='bounded decision source rows and final composed instruction manifest/scan set at cutover'
  elif f in ['src/report/decision-index.mjs','src/report/enduser-index-generate.mjs','src/report/enduser-index.mjs']:why='bounded generator source rows and final document scan set; source-data identity correction is not yet supplied'
  else:why='final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set'
  block=f+':'+str(n)+': '+repr(expr)+' requires '+why+'.'
  e['blockedReason']=block
  if 'originalTuple' in e:e['stateExportDependency']=block;e['blockedSeams']=['generators']
  else:e.update(dependency=block,blockedCategory='source-input',dependencyCategory='source-input')
  if e.get('parityObligation'):e['parityObligation']['blocker']=block
# Retired decision successors reuse the Step 4 owning notes (no new authority map).
notes={}
for f in (P/'step-04-records').glob('*.jsonl'):
 for l in f.read_text().splitlines():
  for e in json.loads(l).get('edges',[]):
   if e.get('successorNote'):
    expr=e.get('matchedExpression','');match=re.search(r'(\d{4})-',expr)
    if match:notes[match[1]]=e['successorNote']
for r in rs:
 for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]):
  expr=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]) or ''
  hit=re.search(r'(?:docs/decisions/)(\d{4})-[\w-]+\.md',expr)
  if not hit and '0000-index.md' in expr:hit=re.search(r'(0000)-index\.md',expr)
  if hit and e.get('disposition') in ['preserve','render-join']:
   code=hit[1];e['successorNote']=notes.get(code,'docs/decisions/index.md' if code=='0000' else None)
   if not e['successorNote']:
    # Search actual live retired history headings, preserving the real anchor spelling.
    for path in (ROOT/'docs/platform').glob('**/*.md'):
     for heading in path.read_text().splitlines():
      if heading.startswith('#') and re.search(r'(?:ADR\s*|D-ADR|^#{1,6}\s*)'+code+r'\b',heading,re.I):
       anchor=re.sub(r'[^\w\s-]','',heading.lstrip('# ').lower());anchor=re.sub(r'\s','-',anchor)
       e['successorNote']=str(path.relative_to(ROOT))+'#'+anchor;break
     if e['successorNote']:break
   assert e['successorNote'],(r['file'],expr)
   if e.get('resolverWitness') is not None:e['resolverWitness']['rule']='Retired decision corpus design provenance; successorNote names the live history holder, no existence claim for the removed file.'
# Store before deeper same-operation reconciliation and exact pathOperand extraction.
for f,rows in sets.items():f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rows))
save('step-05-seam4-cutover-specs.json',specdata);save('step-05-seam4-parity-receipts.json',receipts)
print('records updated',len(rs),'added refs',sum(len(r.get('authorAddedReferences',[])) for r in rs))
