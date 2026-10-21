"""Operation-specific blocker text and source/render agreement, R7/R12."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,hashlib
P=pathlib.Path(__file__).resolve().parent
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
allrs=[]
for s in ['ui-spec-compiler','citation-ratchet-roots']:
 f=P/'step-05-records'/(s+'.jsonl');rs=[json.loads(l) for l in f.open()];allrs+=rs
by={r['file']:r for r in allrs}
core=by['core/skills/_shared/citation-format.md']
for e in core['authorAddedReferences']:
 n=e['sourceSpans'][0]['line']
 why={4:'Permanent decision-home convention still names retired numbered files. Specify the global-permanent index/history holder without changing ID lifetime before rewriting this definition.',6:'Area-scoped rule-home definition assumes one area spec file. Approve split-holder addressability and RUL ownership before rewriting this definition.',96:'Documented citation-check command promises a flat specs markdown scan. Prove candidate scan coverage and synchronize the companion CLI defaults before changing this stated scan population.'}.get(n)
 if e['disposition']=='parked':e['blockedReason']=core['file']+': '+why;e['reason']='L12-85: '+why
for f in ['.agents/skills/_shared/citation-format.md','plugins/fgOS/skills/_shared/citation-format.md']:
 for e in by[f]['references']:
  if e['disposition']!='parked':continue
  o=next(o for o in core['authorAddedReferences'] if ident(o)==e['sourceOwner']['id']);e.update(timing='phase9',blockedReason=f+': canonical source '+o['blockedReason'],reason='L12-85/R2: canonical source '+core['file']+' '+ident(o)+' is parked; exact rendered passage shares that source obligation.')
r=by['scripts/check-decision-citation-drift.mjs']
for e in items(r):
 if e['disposition']!='parked' or e.get('r26Unit'):continue
 n=e.get('currentLine') or e['sourceSpans'][0]['line']
 why={428:'CLI flat specsDir default selects the retiring directory when the flag is absent. Choose the replacement scan population and matching documented command without reducing coverage.',427:'CLI flat specsDir default selects the retiring directory when the flag is absent. Choose the replacement scan population and matching documented command without reducing coverage.',288:'Flat specs listing joins each filtered markdown basename before reading its lines. Establish candidate membership equality, including non-recursive behavior, before the legacy directory vanishes.',452:'runCli resolves the parsed specsDir against caller cwd then supplies it to loadSourceFiles. Prove flag override and missing-root behavior against the candidate population before switching this argument.'}[n]
 e['blockedReason']=r['file']+': '+why;e['reason']='L12-85: '+why
 if n==427:e['operationWitness']=copy.deepcopy(e['pathOperandWitness'])
r=by['scripts/check-legacy-docs-ratchet.mjs']
whyByLine={20:'Default scan-root array still governs both retiring trees. Decision F must retire this entry point together with the root deletion; no empty-root success or rebaseline is an acceptable replacement.',69:'Explicit generated-projection classification names the platform-foundations legacy projection. Decision F must settle that special case with gate retirement while preserving the frozen baseline digest.',88:'classifyFile treats the specs prefix/equal-root branch as maintained authority except explicit projections. Decision F must retire that branch with the removed tree; no extension-based exemption may absorb output.',95:'classifyFile treats the architect prefix/equal-root branch as maintained/history by extension and proposal status. Decision F must settle this branch with retirement, retaining current classification until then.',272:'scanFiles optional roots argument uses the legacy default array. Decision F must close this public scanning contract when the legacy roots retire; recursive membership cannot silently narrow.',276:'scanFiles resolves each requested relative root against repoRoot before enumeration. Decision F must settle invocation/removal of this root resolution at gate retirement.',282:'Recursive scanner constructs each child path, retaining dotfiles, symlink refusal and non-regular entries. Gate retirement under Decision F owns this actual enumeration, not a relaxed replacement scan.',283:'Recursive scanner computes a repository-relative child path for containment checks. Gate retirement under Decision F owns the guard boundary and exact finding path spelling.',297:'Symlink target resolution feeds tree-escape refusal. Decision F must close this guard with the gate, preserving escape detection rather than hiding migration findings.',372:'generateBaseline has its own optional roots default, reachable only through explicit baseline generation. Decision F must retire that path; authoring never invokes write-baseline or changes frozen data.',425:'checkRatchet defaults still scan both legacy trees before comparing missing baseline entries. Decision F must retire this enforcement together with the tree deletion, preserving unexpected-deletion until that cut.',682:'runCli selects explicit --roots or DEFAULT_ROOTS. Decision F must retire the command and its default/help contract together; passing an empty scan is not accepted parity.'}
for e in items(r):
 if e['disposition']!='parked':continue
 n=e.get('currentLine') or e['sourceSpans'][0]['line'];why=whyByLine[n];e['blockedReason']=r['file']+': '+why;e['reason']='L12-85/Decision F: '+why
for r in allrs:
 r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(r) if e['disposition']=='parked']
for s in ['ui-spec-compiler','citation-ratchet-roots']:
 (P/'step-05-records'/(s+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in allrs if r['seamIds']==[s]))
print('refined exact source/render blockers')
