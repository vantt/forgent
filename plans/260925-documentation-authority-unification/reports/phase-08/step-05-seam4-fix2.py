"""L12-74 records-only corrections, with pinned source evidence and exact deltas."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,copy,hashlib,importlib.util,collections,subprocess
P=pathlib.Path(__file__).resolve().parent; ROOT=P.parents[3]
def module(name):
 sp=importlib.util.spec_from_file_location(name,P/(name+'.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
m=module('step-05-check');s4=module('step-05-seam4-check');sha=m.sha
BASE='2b04bfe7c1f748c2f17beca4a6695c968ada2bd5'
original=[json.loads(line) for path in sorted((P/'step-05-records').glob('*.jsonl')) for line in subprocess.check_output(['git','show',BASE+':'+str(path.relative_to(ROOT))],cwd=ROOT,text=True).splitlines()]
rs=copy.deepcopy(original);by={r['file']:r for r in rs}
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
lookup={ident(e):(r,e) for r in rs for e in items(r)}
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
source={r['file']:m.pinned(r['authorInputCommit'],r['file']) for r in rs if r.get('wholeFileRead')}
evidence=[]
def verify(r,e):
 f=r['file'];text=source[f];assert sha(text)==r['sourceSha256']
 if 'originalTuple' in e:
  c=e['currentPassage'];assert c['text']=='\n'.join(text.splitlines()[c['startLine']-1:c['endLine']]);n=e['currentLine'];w=e.get('operationWitness');snippet=text.splitlines()[n-1] if n else c['text']
 else:
  m.m.spans_text(text,e['sourceSpans']);n=e['sourceSpans'][0]['line'] if e['sourceSpans'] else None;snippet=text.splitlines()[n-1] if n else e['passage']
 evidence.append({'file':f,'id':ident(e),'inputCommit':r['authorInputCommit'],'sourceSha256':sha(text),'line':n,'text':snippet});return snippet

def outcome(r,e,ad,disp,why,cat=None):
 verify(r,e);e.update(admission=ad,disposition=disp,reason='L12-74: '+why,blockedReason=None)
 if 'originalTuple' in e:
  e['reason']+=' Own census operand '+repr(e['originalTuple'][4])+'.';e.update(stateExportDependency=None,blockedSeams=[],rejectedAsUnrelatedReason=e['reason'] if ad=='REJECT' else None)
  if ad=='REJECT':e.update(nonDocumentUse=cat or 'scalar-pass-through',pathOperand=None,role=cat or 'scalar-pass-through',targetSetOrConstruction=None);e.pop('pathOperandWitness',None)
  else:e.pop('nonDocumentUse',None)
 else:e.update(blockedCategory=None,dependencyCategory=None,dependency=None,timing='none' if disp in ['preserve','render-join'] else 'phase9')
 if e.get('parityObligation'):e['parityObligation']['blocker']=None

def operand(r,e,p=None):
 if p is None:p=e.get('pathOperand') or e['originalTuple'][4]
 c=e['currentPassage'];lines=c['text'].splitlines();n=e.get('currentLine') or c['startLine'];idx=next((i for i,l in enumerate(lines) if p.split('\n')[0] in l and c['startLine']+i==n),None)
 if idx is None:idx=next(i for i,l in enumerate(lines) if p.split('\n')[0] in l)
 line=lines[idx];pos=line.index(p.split('\n')[0]);assert p in c['text'],(ident(e),p)
 e['pathOperand']=p;e['pathOperandWitness']={'text':p,'line':c['startLine']+idx,'columnStart':pos+1,'columnEndExclusive':pos+len(p.split('\n')[0])+1,'why':'L12-74 exact document operand in pinned operation.'}

def fix(id,ad='ADMIT',disp='preserve',why='Fixed document path on a retained root; no Phase 9 code change required.',cat=None,p=None):
 r,e=lookup[id];outcome(r,e,ad,disp,why,cat)
 if ad=='ADMIT' and 'originalTuple' in e:operand(r,e,p)
 return e

def ds(nums,**kw):
 for n in nums.split():fix('dynamic-'+f'{int(n):06}',**kw)

def block(r,e,why):
 verify(r,e);f=r['file'];e.update(disposition='parked',blockedReason=f+': '+why,reason='L12-74: '+why)
 if 'originalTuple' in e:
  e['reason']+=' Own census operand '+repr(e['originalTuple'][4])+'.';e.update(stateExportDependency=e['blockedReason'],blockedSeams=['generators'])
 else:e.update(dependency=e['blockedReason'],blockedCategory='source-input',dependencyCategory='source-input',timing='phase9',target=None,diffHunk=None,proposedReplacement=None)
 if e.get('parityObligation'):e['parityObligation']['blocker']=e['blockedReason']

# R4/R13/R14 fixed roots. Source verification precedes each edit.
for f in ['src/report/decision-index.mjs','src/setup/instruction-projections.mjs','scripts/generate-doc-inventory.mjs','scripts/propose-doc-decisions.mjs','scripts/verify-phase-01.mjs','scripts/knowledge-classifier.mjs','src/setup/skill-wrappers.mjs','src/report/knowledge-resolver.mjs']:
 r=by[f]
 for e in items(r):
  if e['disposition']!='parked':continue
  if f=='src/setup/skill-wrappers.mjs' and re.search(r'docs/(specs|architect)',e.get('matchedExpression') or e['originalTuple'][4]):
   block(r,e,'The emitted legacy documentation pointer must be composed with its canonical source holder when docs/specs and docs/architect retire; Phase 9 regeneration follows that source correction.');continue
  why=('R13 frozen-gate identity: path operations keep the exact migration gate bytes; final gate disposition belongs to the Phase 9 cut.' if f.startswith('scripts/') and f not in ['scripts/knowledge-classifier.mjs'] else 'R14 fixed non-docs skill/instruction roots; projection regeneration is a Phase 9 run, not a source-code change.' if f.startswith('src/setup/') else 'R4 retained document root; this operation needs no source-path change.')
  outcome(r,e,'ADMIT','preserve',why)
  if 'originalTuple' in e:operand(r,e)
  else:e['resolverWitness']={'rule':why,'inputCommit':r['authorInputCommit']}
 if f in ['scripts/generate-doc-inventory.mjs','scripts/propose-doc-decisions.mjs','scripts/verify-phase-01.mjs']:
  r['frozenGateIdentityWitness']={'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'rule':'L12-74 R13; one identity witness per frozen gate file, lifted only in Phase 9.'}

# Generator enumeration retained roots and alias exception.
ds('9768 9769 9774 9775 9776 9777 9778 9779 9780 9781 9782 9783 9784 9785 9786 9787')
for n,p in [(9778,"path.relative(repoRoot, absPath).split(path.sep).join('/')"),(9786,"path.relative(repoRoot, absPath).split(path.sep).join('/')")]:fix('dynamic-'+f'{n:06}',p=p)
ds('9792',p='docPath',why='R16 document-identity lookup comparing outcome.docPath to the requested document path; retained lookup convention.')
for n in [9788,9791]:
 r,e=lookup['dynamic-'+f'{n:06}'];block(r,e,'The explanation quadrant still enumerates the decisions alias after numbered decision files retired; Phase 9 must decide whether the surviving generated index.md remains in this alias scan and prove its enumerated entries.' if n==9788 else 'QUADRANT_DIR_ALIASES still maps explanation to decisions; the retained index-only directory needs an explicit alias membership decision before the final end-user scan contract can be settled.')
for n in [9810,9811,9812]:
 r,e=lookup['dynamic-'+f'{n:06}'];e['role']='document-identity-lookup';operand(r,e,'path')

# Admission corrections selected by the Lead; every one reads its own pinned passage.
ads='6415 6369 6476 6480 6461 7342 7315 6694 6688 6692 7236 7557 7771 7749 7625 7664 7742 8105 8108 8154 8167 7796 7859 8327 8536 8452 8453 8441 8457 8465 8654 9114 9115 9116 9117 9735 9736 9715 9737 9738 15055 15058 14334 14335 14336 14337 14318 14329 14330 14342 14343 14344 14306'
ds(ads,why='R16 fixed-document read, existence probe or emitted path; retain the owning fixed-root contract.')
rej={
 'root-only':'6471 6472 8570 8604 8632 8640 8650 8651',
 'guard':'8164 8165 8166 14432 14433 7853',
 'scalar-pass-through':'8159 8160 13978 14010 14011',
 'caller-data-formatting':'8410 15060 15062',
 'config-or-metadata':'6880 6732 6753 6758 6835 7761 7765 7626 7559 7646 7857 7827 8608 8609 8610 8611 8612 15117 15118 15084 15085 15136 15172 15142 15144 15222 15228 15230 15086'}
for cat,nums in rej.items():ds(nums,ad='REJECT',cat=cat,why='R16/R5 own operation is '+cat+' and supplies no document-location operand.')
fix('reference-000277',ad='REJECT',cat='caller-data-formatting',why='Usage placeholder <docs/quadrant-dir> names a caller-provided directory, not a fixed document root; no generator dependency.')
# Named retained park dependency for CLI quadrant examples.
for num in [3641,3652,3653,3659]:
 r,e=lookup['reference-'+f'{num:06}'];block(r,e,'Quadrant help must follow src/report/enduser-index-generate.mjs dynamic-009788 and src/report/enduser-index.mjs dynamic-009791: settle explanation/decisions alias enumeration before changing this quadrant '+('synthetic --doc-path example' if num==3659 else 'description' if num==3641 else 'CLI example '+('for lookup' if num==3652 else 'for filtering'))+'.')
for num in [3643,3666]:
 r,e=lookup['reference-'+f'{num:06}'];block(r,e,'Authoring scope still requests the area-spec pattern; the authoring request forbids generic docs/specs to docs/platform conversion because area mapping is not one-to-one. Resolve the area-to-holder scope contract before rewriting this request.')
fix('reference-003690',why='Retained docs/how-to authoring pointer; no source correction or generator dependency.')
# Exact state-derived blocker, rather than a generic instruction generator blocker.
for n in [14034,14035]:
 r,e=lookup['dynamic-'+f'{n:06}'];block(r,e,'readDecisionIds reads docs/decisions/index.md and accepts it only when equal to buildDecisionIndexMarkdown(listWork(fgosDir).decisions); authorized state.decisions export and same-input current/candidate parity are required (L12-72 item 6).')

# Gateway source windows are both references to the same real relocation dependency.
for n in [161,182]:
 r,e=lookup['reference-'+f'{n:06}'];block(r,e,'The gateway '+('module design pointer' if n==182 else 'contract fixture origin')+' cites distribution: the final OpenAPI contract fixture must follow the gateway contract extraction and preserve method/path/schema parity with its live holder; that co-cut fixture is not supplied by a documentation path substitution.')

# Migration inventory operations: distinct obligations for construction, preflight, apply.
r=by['scripts/knowledge-migration.mjs']
blocks={8156:'The planned target is derived from inventory topicId/role and view.topics purposeSlug; export those rows and prove that each retired-root oldPath keeps exactly one target document identity before planning moves.',8157:None,8173:'Apply reads each move.oldPath from the preflighted inventory; export retired-tree source rows and prove original frontmatter and sourceCaptureIds remain readable before the physical move.',8174:'Apply constructs move.newPath destinations; the candidate move list and collision-free target occupancy must be supplied before any moveDocPathStore event can be paired with its file move.',8186:'Preflight tests move.oldPath existence; the inventory oldPath rows under docs/specs and docs/architect need an authorized source snapshot at the cut so missing-source findings can be compared.',8188:'Preflight refuses occupied move.newPath targets except identity moves; the same inventory move destinations and candidate occupied-path set are required to prove no overwrite and unchanged collision diagnostics.'}
blocks[8157]=blocks[8156]
for n,why in blocks.items():rr,e=lookup['dynamic-'+f'{n:06}'];block(rr,e,why)
ds('8162',why='Reachability probe of the computed retained docs/knowledge target; source retirement does not relocate that root.')

# Frozen-B classifier: retained prefixes preserve; inspect every retired prefix separately.
r=by['scripts/generate-shipped-path-inventory.mjs'];r['frozenGateIdentityWitness']={'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'rule':'L12-74 R13 frozen-B classifier; lifts only at Phase 9.'}
for e in items(r):
 if e['disposition']=='parked':outcome(r,e,'ADMIT','preserve','R13 frozen-classifier identity: retained prefixes need no source edit before or during retirement.');e['resolverWitness']={'rule':'L12-74 R13 frozen-classifier identity'} if 'originalTuple' not in e else e.get('resolverWitness')
 x=e.get('matchedExpression') or e.get('pathOperand') or ''
 if re.search(r'docs/(?:specs|architect)/?',x) and e['admission']=='ADMIT' and 'comment' not in e.get('role',''):
  block(r,e,'Classifier prefixes for retired trees must change in the same Phase 9 cut; frozen-B lifts only at Phase 9. '+('The docs/specs prefix classifies area specifications.' if 'specs' in x else 'The docs/architect prefix classifies architecture carriers.'))

# Registrations: classify operations by their actual state comparison and I/O.
r=by['src/setup/registrations.mjs']
for e in items(r):
 if e['disposition']!='parked':continue
 n=e.get('currentLine') or e['sourceSpans'][0]['line']
 if n==3915:outcome(r,e,'ADMIT','preserve','docRegistryAdopted only probes retained docs/doc-registry.md/json existence, with no state-content comparison.')
 elif n in [3824,3852]:outcome(r,e,'ADMIT','preserve','Fixed retained core/instructions existence probe; independent of registry state.')
 elif n in [3930,3931]:block(r,e,('Markdown stale check reads the retained projection and compares it with mdContent from computeKnowledgeProjection(rebuild(fgosDir)); supply authorized folded topics/docs and exact Markdown serialization parity.' if n==3930 else 'JSON stale check reads the retained projection and compares it with jsonContent from computeKnowledgeProjection(rebuild(fgosDir)); supply authorized folded docs/topics with aliases, currentPath and sourceCaptureIds and exact JSON field parity.'))
 elif n in [3961,3962]:block(r,e,('Markdown repair writes mdContent after rebuilding state; require authorized view topics/docs and same-input rendered heading/link parity before overwriting the projection.' if n==3961 else 'JSON repair writes jsonContent after rebuilding state; require authorized registry export and same-input field, ordering and sourceCaptureIds conservation before overwriting the projection.'))
 elif n==4035:block(r,e,'Near-duplicate discovery recursively enumerates docs/**; the post-retirement scan set excluding docs/specs and docs/architect and including conserved holders is needed to compare discovered claim candidates.')
 elif n==4040:block(r,e,'Near-duplicate reader opens each enumerated Markdown file for real frontmatter; supply candidate bytes and authoritative_for values for relocated holders to compare the candidate input rows.')
 elif n==4045:block(r,e,'Near-duplicate candidates emit docs-relative paths into claim groups; the composed post-retirement candidate paths and claim ownership are needed to compare exact grouping and diagnostic paths.')
 elif n==4193:block(r,e,'Source conservation loads inventory-data.json oldPath rows, counts duplicates and resolves each source through the folded registry; supply authorized retired-tree oldPath inventory and aliases before comparing conservation findings.')
 elif n==4220:block(r,e,'Source conservation probes each inventory oldPath on disk before resolveDocPath(view, oldPath); the cutover file-presence set and alias/currentPath resolution for retired sources must prove none becomes lost.')
 else:raise AssertionError((ident(e),n))

# Comments into docs/history are uniformly admitted provenance, not false scalar labels.
for r in rs:
 if r.get('generated'):continue
 for e in r['references']+r.get('authorAddedReferences',[]):
  x=e.get('matchedExpression','')
  if x.startswith('docs/history/') and (e.get('role') in ['comment','navigation','source-navigation'] or (e.get('sourceSpans') and source[r['file']].splitlines()[e['sourceSpans'][0]['line']-1].lstrip().startswith(('//','/*','*')))) and e['disposition']=='preserve':
   outcome(r,e,'ADMIT','preserve','R16 comment pointer into retained docs/history; preserve dated provenance.');e['rejectionRule']=None

# New slots requested by R3; deterministic IDs, no invented census identity.
def add(r,expr,n,disp='preserve',why='',cat=None):
 line=source[r['file']].splitlines()[n-1]
 old=next((e for e in items(r) if 'originalTuple' not in e and any(s['line']==n and expr in s['text'] for s in e.get('sourceSpans',[]))),None)
 if old:return old
 col=line.index(expr)+1;a=max(1,n-3);b=min(len(source[r['file']].splitlines()),n+3)
 e={'id':'author-s4-fix2-'+sha(r['file']+':'+str(n)+':'+str(col)+':'+expr)[:16],'matchedExpression':expr,'sourceSpans':[{'line':n,'columnStart':col,'columnEndExclusive':col+len(expr),'text':expr}],'passageSpan':{'startLine':a,'endLine':b},'passage':'\n'.join(source[r['file']].splitlines()[a-1:b]),'role':'source-navigation','resolverWitness':{'inputCommit':r['authorInputCommit'],'rule':why},'target':None,'anchor':None,'proposedReplacement':None,'diffHunk':None,'successorNote':None,'receiptId':r['receiptIds'][0],'proofCommand':'missing','proofScope':'Records-only source slot; no Phase 9 execution.'}
 r.setdefault('authorAddedReferences',[]).append(e);outcome(r,e,'REJECT' if cat else 'ADMIT',disp,why,cat)
 if disp=='parked':block(r,e,why)
 return e
r=by['src/cli/command-registry.mjs']
for n in [638,1415,1416,1725,1756,1760,1828,1849]:
 line=source[r['file']].splitlines()[n-1]
 for hit in re.finditer(r'docs/(?:<quadrant>(?:/\*\.md|/)?|[A-Za-z0-9_./-]+)',line):
  expr=hit[0];quad='<quadrant>' in expr
  add(r,expr,n,'parked' if quad else 'preserve',why=('Quadrant '+('enumeration description' if n==1725 else 'glob description' if n==1756 else 'argument description')+' depends on src/report/enduser-index-generate.mjs dynamic-009788 and src/report/enduser-index.mjs dynamic-009791: settle the explanation/decisions alias scan before rewriting these roots.' if quad else 'Retained output path or synthetic documentation path example; no unique relocated holder is claimed.'))
r=by['src/setup/registrations.mjs']
for n in [3467,3481,3499,3504,3514,3518,3524,3678,3688,3766]:
 line=source[r['file']].splitlines()[n-1]
 for expr in ['CHANGELOG.md','README.md','manifestPathFor(root)','indexPathFor(root)','docs/enduser-docs-index.json']:
  if expr in line:add(r,expr,n,why='R3/R16 fixed retained root-document '+('probe' if 'existsSync' in line else 'emitted message or description')+'; manifestPathFor -> docs/enduser-docs-index.json, indexPathFor -> docs/decisions/index.md.')
r=by['scripts/knowledge-bootstrap.mjs']
for n,line in enumerate(source[r['file']].splitlines(),1):
 if 'readFileSync' in line and 'inventoryDataPath' in line:add(r,'inventoryDataPath',n,why='Caller inventory input is a document read consumed by bootstrap; preserve reader convention, no fixed relocation inferred.')

# Backlog: carry actual Step 3 outcomes and exact physical joins, not a header blocker.
r=by['docs/backlog.md'];oldfile=P/'step-03-records/batch-126.jsonl'
if not oldfile.exists():oldfile=next((P/'step-03-records').glob('*126*'))
oldrows=[json.loads(l) for l in oldfile.read_text().splitlines()];old=next((q for q in oldrows if q['file']=='docs/backlog.md'),None)
assert old is not None
for e in r['authorAddedReferences']:
 n=e['sourceSpans'][0]['line']
 if (n,e['matchedExpression']) not in [(29,'docs/specs/distribution.md'),(44,'docs/specs/work-state.md:647-675'),(107,'docs/specs/runner.md'),(116,'docs/specs/*.md'),(123,'docs/specs/'),(130,'docs/specs')]:continue
 edge=next(x for x in old['edges'] if any(s['line']==n-5 and (e['matchedExpression'] in s['text'] or s['text'] in e['matchedExpression']) for s in x['sourceSpans']))
 if n in [107,116,123,130]:outcome(r,e,'ADMIT','preserve','Step 3 batch-126 owns this dated backlog provenance; tree retires at Phase 9, no live generic spec-holder substitution.');e['resolverWitness']={'rule':'Step 3 dated provenance; tree retires at Phase 9, no relocated navigation claim.'}
 else:block(r,e,'The distribution citation has no live holder for the exact backlog claim; Step 3 batch-126 must conserve that claim before assigning a replacement.' if n==29 else 'The work-state citation binds an obsolete 647–675 line range; Step 3 batch-126 must establish the conserved passage and its new bounded span before rewriting it.')
 e['physicalPriorJoins']=[{'recordFile':str(oldfile.relative_to(ROOT)),'recordLine':oldrows.index(old)+1,'recordSha256':sha(oldfile.read_bytes()),'inputCommit':old['authorInputCommit'],'edgeId':edge['edgeId'],'slotKey':edge.get('slotKey'),'sourceSpans':edge['sourceSpans'],'disposition':edge['disposition']}]

# Source-only comment patch specifications composed with existing proposed hunks.
patches=[('src/setup/registrations.mjs','reference-003845','docs/knowledge/how-to-respond-to-an-eventsjsonl-truncation/resolve-an-events-jsonl-truncation.md'),('src/setup/registrations.mjs','reference-003850','docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md')]
# Exact holder discovery from tracked docs/knowledge names, not guessed folder labels.
for f,id,target in patches:
 r,e=lookup[id];matches=list((ROOT/'docs/knowledge').glob('*/'+pathlib.Path(e['matchedExpression']).name));assert len(matches)==1 or (ROOT/target).is_file(),(id,matches)
 target=str(matches[0].relative_to(ROOT)) if matches else target;outcome(r,e,'ADMIT','patch','R8 operative comment pointer has a unique live holder with the original document filename.');e.update(target=target,proposedReplacement=target,anchor=None,timing='phase9',resolverWitness={'rule':'Unique conserved knowledge holder, exact filename; comment-only pointer repair.','targetSha256':sha((ROOT/target).read_bytes())})
 e['sourceSpanReplacements']=[target[:-len('design.md')],'// design.md'] if id=='reference-003850' else [target]
# git-hooks pointer: live packaging spec carries the contributor hooks passage.
r,e=lookup['reference-003796'];target='docs/platform/packaging-distribution/spec.md';anchor='pointers-implementation'
assert 'repo/scripts/install-git-hooks.mjs' in (ROOT/target).read_text() and '#### Pointers (implementation)' in (ROOT/target).read_text()
outcome(r,e,'ADMIT','patch','The live packaging spec implementation pointers preserve the contributor hooks setup passage and manual trigger.');e.update(target=target,anchor=anchor,proposedReplacement=target+'#'+anchor,timing='phase9',resolverWitness={'rule':'Pointers (implementation) owns contributor hooks/manual setup:hooks passage, lines 803–812.','targetSha256':sha((ROOT/target).read_bytes())})

# Pin-note fixes requested in the reviews.
for id,cat in [('dynamic-000545','state-event-store'),('dynamic-000546','state-event-store'),('dynamic-000541','caller-data-formatting'),('dynamic-000565','caller-data-formatting'),('dynamic-000551','guard')]:fix(id,ad='REJECT',cat=cat,why='Exact non-document operation label follows the pinned source.')
for n in [766,772]:fix('dynamic-'+f'{n:06}',ad='REJECT',cat='config-or-metadata',why='Rust path type/import token is configuration/type syntax, not document I/O.')
fix('dynamic-000770',ad='REJECT',cat='text-label-join',why='Message newline assembly; no document path operand.')
# Preserve source slots and save for downstream deterministic sweep and diff composition.
for path in sorted((P/'step-05-records').glob('*.jsonl')):
 oldnames=[json.loads(l)['file'] for l in path.read_text().splitlines()];path.write_text(''.join(json.dumps(by[f],ensure_ascii=False,separators=(',',':'))+'\n' for f in oldnames))
save('step-05-seam4-fix2-source-evidence.json',{'kind':'Pinned source checked before each correction','checks':evidence})
print(json.dumps({'records':len(rs),'verifiedOperations':len(evidence),'authorSlots':sum(len(r.get('authorAddedReferences',[])) for r in rs)}))
