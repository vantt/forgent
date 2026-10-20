#!/usr/bin/env python3
"""Freeze per-set A51 selection and review payloads with actual byte/slot limits."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections,math
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m
q.PIN='dc24ce64527fbffd23e1643f35a7ddf808fd7b45'

def main():
 rs=q.load();batches=[b for b in q.BATCHES if b['batch'] in {r['reviewSet'] for r in rs}]
 sweep=q.read('step-04-l12-60-sweep.json');changed={(x['set'],x['file']) for x in sweep['changedRecords']}
 selections=[]
 for b in batches:
  if b['batch']<='step04-016':
   x=next(v for v in q.read('step-04-wave1-selection.json') if v['set']==b['batch']).copy()
   x['selectionMode']='L12-60 mandatory targeted re-review; original wave1 A51 seeds/ranks retained as history, not reseeded'
   x['targetedReReview']=sorted(r['file'] for r in rs if r['reviewSet']==b['batch'] and (b['batch'],r['file']) in changed)
   x['selected']=sorted(set(x['selected'])|set(x['targetedReReview']))
   x['mandatoryWitnesses'] += [{'file':f,'reasons':['L12-60: record changed this turn, mandatory targeted whole-file re-review']} for f in x['targetedReReview'] if f not in {v['file'] for v in x['mandatoryWitnesses']}]
  else:
   x=q.selection(rs,b);x['selectionMode']='A51 seeded selection for sets 017–033 after L12-60 sweep';x['targetedReReview']=[]
  if b['batch']=='step04-030':
   f='core/skills/fgos-run/SKILL.md';x['selected']=sorted(set(x['selected'])|{f});x['mandatoryWitnesses'].append({'file':f,'reasons':['L12-60 main-changed source plus all generated outputs; zero documentation edges, mandatory full-context review']})
  x['reviewStatus']='pending fresh Lead-started independent review; no approval carry';x['reviewedFiles']=[];x['reworkNumerator']=None;x['reworkDenominator']=None
  selections.append(x)
 q.save('step-04-wave2-selection.json',selections)
 parts=[];current={'set':None,'files':[],'items':[],'edges':0}
 def wire(part):return {'authorInputCommit':q.PIN,'reviewerRule':'Never run checker/probes/resolver/author scripts. Read every assigned file through EOF and independently verify targets. One verdict per whole file, even when streamed.','set':part['set'],'files':part['files'],'joinedSlots':part['edges'],'items':part['items']}
 def size(part):return len((json.dumps(wire(part),ensure_ascii=False,indent=2)+'\n').encode())
 def flush():
  nonlocal current
  if not current['items']:return
  n=len(parts)+1;name=f'step-04-wave2-p{n:02}.json';output=f'review-a38-step-04-wave2-p{n:02}.md'
  payload=wire(current);q.save(name,payload);bytes_=(P/name).stat().st_size
  assert bytes_<=400000 and current['edges']<=60
  parts.append({'part':n,'set':current['set'],'files':current['files'],'edges':current['edges'],'bytes':bytes_,'payload':name,'payloadSha256':m.sha((P/name).read_bytes()),'expectedReviewerOutput':output,'reviewStatus':'pending','elapsedReviewerSeconds':0,'remainingReviewerBudgetSeconds':None})
  current={'set':None,'files':[],'items':[],'edges':0}
 def put(set_,file,item,edges):
  nonlocal current
  candidate={'set':set_,'files':sorted(set(current['files']+[file])),'items':current['items']+[item],'edges':current['edges']+edges}
  if current['items'] and (current['set']!=set_ or candidate['edges']>60 or size(candidate)>400000):flush();candidate={'set':set_,'files':[file],'items':[item],'edges':edges}
  if size(candidate)>400000:
   # Stream full context separately; do not split the semantic file verdict.
   context=item.pop('sourceContext',None)
   if context is None:raise ValueError(('oversize non-context item',file,size(candidate)))
   lines=context.splitlines(keepends=True);chunk=[];start=1
   for i,line in enumerate(lines,1):
    if len(''.join(chunk).encode())+len(line.encode())>220000 and chunk:
     put(set_,file,{'file':file,'logicalReviewFile':file,'sourceContextStartLine':start,'sourceContextEndLine':i-1,'sourceContext':''.join(chunk),'contextContinues':True},0);flush();chunk=[];start=i
    chunk.append(line)
   if chunk:put(set_,file,{'file':file,'logicalReviewFile':file,'sourceContextStartLine':start,'sourceContextEndLine':len(lines),'sourceContext':''.join(chunk),'contextContinues':False},0);flush()
   put(set_,file,item,edges);return
  current=candidate
 for selection in selections:
  for f in selection['selected']:
   r=next(r for r in rs if r['reviewSet']==selection['set'] and r['file']==f)
   targets=sorted({e['target'] for e in r['edges'] if e['target']})
   item={'file':f,'sourceDigest':r['digest'],'sourceContext':m.blob(q.PIN,f).decode(),'record':r,'targetEvidence':{t:[{'edgeSlot':k,**v} for k,v in r['checks']['anchors'].items() if any(e['slotKey']==k and e['target']==t for e in r['edges'])] for t in targets},'renderContexts':{x['path']:m.blob(q.PIN,x['path']).decode() for j in r['sourceRenderProvenance'] for x in j['renderFiles']},'populationGapFindings':[],'L12-60-coverage':{'stepFiveExcluded':r['stepFiveExcluded'],'authorAddedSlots':[e['slotKey'] for e in r['edges'] if e.get('authorAddedEdge')],'recordChangedThisTurn':(r['reviewSet'],f) in changed},'mandatory':'Read source→render header/slot correspondence in record; generation/parity is not claimed.'}
   put(selection['set'],f,item,len(r['edges']))
  flush()
 q.save('step-04-wave2-review-index.json',parts)
 accounts=[{**x,'filesInSet':sum(r['reviewSet']==x['set'] for r in rs),'parts':[p['part'] for p in parts if p['set']==x['set']],'bytes':sum(p['bytes'] for p in parts if p['set']==x['set']),'elapsedReviewSeconds':0,'remainingReviewBudgetSeconds':None,'semanticAuthorElapsedBySetSeconds':None,'timingNote':'No independent review started; Lead allocates budget. Earlier author timings are historical; this semantic correction sweep was not separately timed per set.'} for x in selections]
 q.save('step-04-wave2-review-accounting.json',accounts)
 manifest={'authorInputCommit':q.PIN,'authoredBatches':[b['batch'] for b in batches],'records':[{'set':r['reviewSet'],'file':r['file'],'digest':r['digest'],'recordSha256':m.sha(q.canon(r)),'edges':len(r['edges']),'diffBytes':len(r['diff'].encode())} for r in rs],'recordFiles':[{'path':str(p.relative_to(m.ROOT)),'sha256':m.sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted((P/'step-04-records').glob('*.jsonl'))],'inputs':[{'path':n,'sha256':m.sha((P/n).read_bytes())} for n in ['step-04-batches.json','step-04-population.json','step-04-source-render-provenance.json','owner-answers.md','step-04-l12-60-sweep.json','step-00-l12-61-binding-check.json']],'selectionSha256':m.sha((P/'step-04-wave2-selection.json').read_bytes()),'parts':parts,'acceptance':'Records only; independent A51 semantics and L12-11 runner-commit accounting remain owed.'}
 q.save('step-04-wave2-manifest.json',manifest)
 counts=collections.Counter(e['disposition'] for r in rs for e in r['edges'])
 targeted=sum(len(x['targetedReReview']) for x in selections)
 lines=['# Step 4 wave 2 — independent review after L12-60 corrections','',f'Pin: `{q.PIN}`. This ONE request replaces the packet at 7a6b8a3b1. It covers A51 selection in sets 017–033 PLUS **all {targeted} changed source records in 001–016**, mandatory targeted whole-file re-review. New L12-10 companion-source records and main-changed fgos-run zero-edge source are included. Original wave1 A51 seeds/ranks remain recorded; they are not reseeded. No earlier approval carries to changed bytes.','',f'All 33 authored sets: {len(rs)} source records, {sum(len(r["edges"]) for r in rs)} slots; dispositions `{dict(counts)}`. Ten former lead-ruling supplemental slots are first-class under L12-60(7), keyed by exact tuples; no invented Step 2 ids. Dated files preserve as history; the live worker-contract source parks on exact claim carry, with renders joined. Zero open lead-ruling slots. Frozen inventories and Step 3 records are unchanged.','',f'**{len(parts)} review parts**, each ≤60 joined slots and **400,000 UTF-8 bytes**. Exact bytes, SHA256, input pin, source files and output names: `step-04-wave2-review-index.json`; frozen record and input hashes: `step-04-wave2-manifest.json`; per-set seeds, ranks, strata, selection and pending time/rework: `step-04-wave2-selection.json` and `step-04-wave2-review-accounting.json`. Source context may stream across parts; all parts for a file comprise ONE logical file judgment.','', '**Reviewers never run the checker, probes, resolver, author or packet scripts.** Lead launches fresh-context A38 reviewers. Author launched/accepted none. Read every assigned source through EOF, every edge and Step 5 exclusion, full diff, target passages and source→render correspondence at the pin. Target files are available with `git show <pin>:<target>`; continue through EOF where needed. Do not take author verification or census advisory labels as semantic proof.','', 'For sets 017–033, per set select ceil(15% of nonempty-diff files) by the recorded SHA256 seed and ranks, union mandatory size/slot/prepared/changed bindings. The separate inherited L12-34 unpatched stratum uses its recorded seed. The main-changed fgos-run source and outputs are mandatory even with zero documentation edges. For 001–016 every changed record is mandatory, including preserved and parked records; this targeted re-review does not replace or silently re-seed the original wave1 sample.','', 'For each set and stratum report reviewed files and files with outcome rework. A file counts once. ≤3% passes; >3% expands to every file in that set, including preserve/park. No pooled rate or sample replacement. Fields remain null until independent review; elapsed time 0 means not started, and reviewer budget is pending Lead allocation.','', 'Apply L12-60 explicitly: root law/vision and architecture-manifest corrections; whole-file distribution area pointer; dead cleanup/retro pointers with non-executable successors; local passage-specific blocker/dependency/witness; census prose join and wrapped dead paths; Step 5 runtime messages and example strings; missed gate-bypass rows; L70 retired decision-directory writer and A34 Step 7 carry; thin wrappers from build:skills; render-join label with sourceDisposition rather than patch/null-target. Managed root marker was line 316 at the reviewed wave1 pin and is line 321 at this merged pin; source owner records carry the actual merged range.','', 'Required sources of context: owner-answers L12-58/59/60/61 and the 19 wave1 review reports; `step-04-l12-60-sweep.json` journals additions, alias joins, custody moves and per-passage judgments. The previously reported wrapped clarifying 0026 citations now have first-class slots; no open admission request remains for them. L12-10 conventions remain literal. Archived/dated unslotted mentions preserve under L12-29/60 and the Phase 9 L12-4 literal remnant search; never reinterpret historical present-tense language as a live write instruction.','', 'Step 0 binding review is a separate owed Lead action: six L12-61 content rebindings in five shards, pending independent acceptance. Seven canonical Step 3 overlaps plus their historical revision copies are listed in `step-00-l12-61-step3-deferred-rebinds.json`; rebind once at Step 7 final atomic assembly under L12-58(1), together with earlier L12-44/57 obligations. A47 conservation, workflow carry, A34 residual, Phase 9 source application and Step 5 parity remain their own dependencies.','', 'No consumer/render writes, generator run, installed-package parity, determinism or Phase 9 application is claimed. No separate pair-accounting parts for report-only commits under L12-58(4). Lead records the real runner author commit in ordinary L12-11 accounting. Return exact source/target quotes and disposition/anchor/diff consequences for each finding; do not substitute checker green for a semantic verdict.','', '| Part | Set | Files | Slots | Bytes | Payload | Required reviewer report |','| --- | --- | ---: | ---: | ---: | --- | --- |']
 lines += [f'| {x["part"]:02} | {x["set"]} | {len(x["files"])} | {x["edges"]} | {x["bytes"]} | `{x["payload"]}` | `{x["expectedReviewerOutput"]}` |' for x in parts]
 lines += ['', 'Per-set review accounting:', '', '| Set | Files | Selection mode | Patched/sample | Unpatched/sample | Targeted | Selected | Parts/bytes |', '| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |']
 lines += [f'| {x["set"]} | {x["filesInSet"]} | {"mandatory re-review" if x["set"]<="step04-016" else "A51"} | {len(x["population"])}/{len(x["sample"])} | {len(x["unpatchedRanks"])}/{len(x["unpatchedSample"])} | {len(x["targetedReReview"])} | {len(x["selected"])} | {len(x["parts"])}/{x["bytes"]} |' for x in accounts]
 (P/'step-04-wave2-review-request.md').write_text('\n'.join(lines)+'\n')
 print(json.dumps({'selectedCanonicalFiles':sum(len(x['selected']) for x in selections),'targetedWave1':targeted,'a51SelectedLater':sum(len(x['selected']) for x in selections if x['set']>='step04-017'),'parts':len(parts),'bytes':sum(x['bytes'] for x in parts),'maxBytes':max(x['bytes'] for x in parts),'maxEdges':max(x['edges'] for x in parts)}))
if __name__=='__main__':main()
