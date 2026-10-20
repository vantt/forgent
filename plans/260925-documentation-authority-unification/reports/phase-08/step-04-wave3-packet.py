#!/usr/bin/env python3
"""One final-outcome wave3 request; exact per-category file scope, no reviewer dispatch."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,importlib.util,copy,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(sp);sp.loader.exec_module(q)
m=q.m;rs=q.load();sweep=q.read('step-04-l12-62-sweep.json');changed={x['file'] for x in sweep['changes']};reviewed={};oldindex=q.read('step-04-wave2-review-index.json')
for f in sorted(P.glob('review-a38-step-04-wave2-*.md')):
 mt=re.search(r'p(\d+)(?:-(\d+))?\.md$',f.name)
 for n in range(int(mt[1]),int(mt[2] or mt[1])+1):
  for path in next(x for x in oldindex if x['part']==n)['files']:reviewed.setdefault(path,[]).append(f.name)
sets={'step04-'+n for n in ['010','019','022','023','024','025','030','031']}
expanded={r['file'] for r in rs if r['reviewSet'] in sets and r['file'] not in reviewed};selected=changed|expanded
categories={'A_outcome_changed':sorted(changed),'B_expansion_not_previously_reviewed':sorted(expanded),'A_and_B':sorted(changed&expanded),'B_only':sorted(expanded-changed),'selectedUnion':sorted(selected)}
# Also enumerate every file in the eight expansion sets with a final-state explanation.
ledger=[]
for r in rs:
 if r['reviewSet'] in sets:ledger.append({'set':r['reviewSet'],'file':r['file'],'wave2Reports':reviewed.get(r['file'],[]),'categoryA':r['file'] in changed,'categoryB':r['file'] in expanded,'selected':r['file'] in selected,'reason':'Outcome changed, mandatory final-state review' if r['file'] in changed else 'No prior whole-file verdict, expanded-set review' if r['file'] in expanded else 'Already reviewed with unchanged final outcome; witness/record-text additions checked mechanically under L12-55 precedent'})
parts=[];current={'set':None,'files':[],'items':[],'joinedSlots':0}
def wire(c):return {'authorInputCommit':q.PIN,'reviewerRule':'Never run checker/probes/resolver/author/packet scripts. Read complete source, all record slots, diff and target passages; one final verdict per whole source file across any streamed parts.','set':c['set'],'files':c['files'],'joinedSlots':c['joinedSlots'],'items':c['items']}
def size(c):return len((json.dumps(wire(c),ensure_ascii=False,indent=2)+'\n').encode())
def flush():
 global current
 if not current['items']:return
 n=len(parts)+1;name=f'step-04-wave3-p{n:02}.json';output=f'review-a38-step-04-wave3-p{n:02}.md';q.save(name,wire(current));b=(P/name).stat().st_size;assert b<=400000 and current['joinedSlots']<=60
 parts.append({'part':n,'set':current['set'],'files':current['files'],'slots':current['joinedSlots'],'bytes':b,'payload':name,'payloadSha256':m.sha((P/name).read_bytes()),'requiredReviewerOutput':output,'reviewStatus':'pending Lead-started review'})
 current={'set':None,'files':[],'items':[],'joinedSlots':0}
def put(set_,f,item,slots=0):
 global current
 c={'set':set_,'files':sorted(set(current['files']+[f])),'items':current['items']+[item],'joinedSlots':current['joinedSlots']+slots}
 if current['items'] and (current['set']!=set_ or size(c)>400000 or c['joinedSlots']>60):flush();c={'set':set_,'files':[f],'items':[item],'joinedSlots':slots}
 assert size(c)<=400000 and c['joinedSlots']<=60,(f,item.keys(),size(c),c['joinedSlots'])
 current=c
def stream(set_,f,kind,path,text):
 ls=text.splitlines(keepends=True);chunk=[];start=1
 for n,line in enumerate(ls,1):
  if chunk and len(''.join(chunk).encode())+len(line.encode())>160000:
   put(set_,f,{'file':f,'kind':kind,'path':path,'startLine':start,'endLine':n-1,'content':''.join(chunk),'continued':True});flush();chunk=[];start=n
  chunk.append(line)
 if chunk:put(set_,f,{'file':f,'kind':kind,'path':path,'startLine':start,'endLine':len(ls),'content':''.join(chunk),'continued':False})
for r in sorted((r for r in rs if r['file'] in selected),key=lambda r:(r['reviewSet'],r['file'])):
 f=r['file'];set_=r['reviewSet'];stream(set_,f,'complete-source-context',f,m.blob(q.PIN,f).decode())
 for j in r['sourceRenderProvenance']:
  for x in j['renderFiles']:stream(set_,f,'complete-render-context',x['path'],m.blob(q.PIN,x['path']).decode())
 item={'file':f,'kind':'complete-final-record','categoryA':f in changed,'categoryB':f in expanded,'record':r,'targetFilesToRead':sorted({e['target'] for e in r['edges'] if e['target']}|{x['path'] for e in r['edges'] for x in e.get('additionalTargets',[])}),'priorWave2Reports':reviewed.get(f,[]),'instruction':'Read every slot and full diff in this final record. Target evidence/anchor proof and content/tree/history witnesses are embedded; independently read actual target passages at author pin. A streamed source remains one whole-file verdict.'}
 put(set_,f,item,len(r['edges']))
flush()
q.save('step-04-wave3-review-index.json',parts)
q.save('step-04-wave3-review-scope.json',{'authorPin':q.PIN,'categories':categories,'expansionSetFinalStateLedger':ledger,'priorWave2Reports':{f:reviewed[f] for f in sorted(reviewed)},'outcomeComparison':'Compare disposition/sourceDisposition, primary/additional targets, anchor, timing, blockedReason, full diff and contextual rewrites against input HEAD. New slots are changed outcomes. Span/witness/wording-only corrections are checker verified under L12-55 precedent.','reviewedFinalStateLimit':'Earlier review is used only for files with unchanged final outcomes; all outcome-changed files are selected again. No acceptance inferred from author proof.'})
manifest={'authorPin':q.PIN,'recordFiles':{f.name:m.sha(f.read_bytes()) for f in (P/'step-04-records').glob('*.jsonl')},'selectedRecords':[{'file':r['file'],'set':r['reviewSet'],'recordSha256':m.sha(q.canon(r)),'slots':len(r['edges'])} for r in rs if r['file'] in selected],'categories':{k:len(v) for k,v in categories.items()},'parts':parts,'maxSlots':max(x['slots'] for x in parts),'maxBytes':max(x['bytes'] for x in parts),'reviewersStarted':0,'reviewersAccepted':0}
q.save('step-04-wave3-manifest.json',manifest)
lines=['# Step 4 wave 3 — one independent final-state review request','',f'Author pin `{q.PIN}`. Binding authority: owner-answers L12-62 (plus L12-58–61). This request covers **{len(changed)} outcome-changed files** (category A), **{len(expanded)} previously unreviewed files** in the eight expanded sets (category B), overlap **{len(changed&expanded)}**, union **{len(selected)} whole source files**. Every changed final outcome is re-reviewed; earlier verdicts carry only to unchanged final outcomes. No reviewers have been launched; Lead owns independent acceptance and actual runner-commit accounting.','',f'**{len(parts)} parts**, each ≤60 slots and 400,000 UTF-8 bytes (actual maxima {manifest["maxSlots"]} slots / {manifest["maxBytes"]:,} bytes). Required outputs are `review-a38-step-04-wave3-pNN.md`. Parts may stream source/render context; all parts naming a source form ONE whole-file verdict. No separate report-only pair-accounting parts (L12-58(4)).','', '**Reviewers never run checker/probes/resolver/author/packet scripts.** Read each assigned source through EOF, every slot and Step 5 exclusion, full exact unapplied diff and bound context edits, all primary/additional target passages at the pin, and complete source→render correspondence. Validate semantics independently; author witnesses are not acceptance. Use `git show <pin>:<file>` when complete target context is needed.','', 'Apply L12-62 rulings 1–9 explicitly: same-basename moved-verbatim knowledge holders patch (frontmatter additions do not change narrative); name-drifted or uncertain successors park with non-executable notes; design-origin provenance preserves even when behavior has a live holder; candidate runner subcomponent is eligible; generated decision-index comments preserve while retired-directory writer instructions await Phase 9 rewrite; bare root filenames are not edges; wrapped-0106 preserves; skills-192 retained runbook preserves; canonical.rs canonicalization remains carriage per resolver; plans→archive relocation is outside scope.','', 'The named repairs include the split confinement replacement with both spec (§1/§5.2) and contract (§6.6/§6.9), manifest schema anchor plus duplicate-citation removal, two never-existing see-pointer parks, reading-map §5 pointers, root line 74 and quadrant-input slots, full six-precedent scope, source line 224, and Git no-hardcoded-trunk passage. Additional passage search repairs include run-supervisor handover/lifecycle pointers. Both original parks and final parks have passage search witnesses; preserved paths have tree/history witnesses with explicit literal/example/design-origin exceptions. Every wrapped hit has exact slot or Step 5 custody.','', 'L12-62 calls the named outcome list twelve files; its bullets name eleven unique paths. The twelfth file obligation is canonical.rs in ruling 8; it was checked and remains parked, because Release Tree Canonicalization is within retained source detail. 0032 successor notes select the iron-law decision by the actual trunk/iron-law passage, excluding the colliding multi-role harness decision.','', 'The repository resolver and slug API remain unchanged. Step 4 explicitly encodes the binding cli-006 RUL9 exception at its rule/enclosing heading, as the earlier law-body override did; other packaging source detail stays carriage. Context edits are checked as exact L12-62 comment-only rewrites; the unchanged Step 3 core separately proves ordinary path substitutions, and Step 4 proves the complete combined diff. This is records-only authoring, not consumer application, source/render generation, installed parity or Step 4 acceptance.','', 'Source inventory and exact per-category scope: `step-04-wave3-review-scope.json`. It enumerates every source in sets 010, 019, 022, 023, 024, 025, 030 and 031 and names prior reports for unchanged final outcomes. Frozen record/payload hashes: `step-04-wave3-manifest.json`. Exact packet names/limits: `step-04-wave3-review-index.json`. Earlier wave 1/2 requests and reports are unchanged.','', '## Category A — changed final outcomes','']
lines += ['- `'+f+'`' for f in sorted(changed)]
lines += ['', '## Category B — expanded sets, no previous whole-file verdict','',f'All {len(expanded)} paths are listed; {len(changed&expanded)} also appear in A. B-only adds {len(expanded-changed)} files.','']
lines += ['- `'+f+'`'+(' (also A)' if f in changed else '') for f in sorted(expanded)]
lines += ['', '## Expanded-set files already reviewed with unchanged final outcomes','']
lines += ['- `'+x['file']+'` — '+', '.join('`'+f+'`' for f in x['wave2Reports']) for x in ledger if not x['selected']]
lines += ['', '## Review parts','', '| Part | Set | Whole-file contexts | Slots | Bytes | Payload | Required report |','| --- | --- | --- | ---: | ---: | --- | --- |']
lines += [f'| {x["part"]:02} | {x["set"]} | '+', '.join('`'+f+'`' for f in x['files'])+f' | {x["slots"]} | {x["bytes"]} | `{x["payload"]}` | `{x["requiredReviewerOutput"]}` |' for x in parts]
lines += ['', 'Return one verdict per whole file, exact source/target quotes for defects, and reviewed/reworked file counts per set and stratum. Any additional >3% outcome rework expands that set; do not pool rates or replace samples. Park only genuine unresolved claim carry/description/index parity/dead links. Step 3 final-pin rebindings, A34 residual, A47 conservation, workflow carry, Step 5 parity and Phase 9 application remain with their existing Lead custody.']
(P/'step-04-wave3-review-request.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'categoryA':len(changed),'categoryB':len(expanded),'overlap':len(changed&expanded),'B_only':len(expanded-changed),'selected':len(selected),'parts':len(parts),'maxSlots':manifest['maxSlots'],'maxBytes':manifest['maxBytes']}))
