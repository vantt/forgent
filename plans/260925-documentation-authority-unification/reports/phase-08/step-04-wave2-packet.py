#!/usr/bin/env python3
"""Freeze per-set A51 selection and review payloads with actual byte/slot limits."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections,math
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m
q.PIN='d4a07d57c4d146b482d4a9e632dc02d8df42af79'

def main():
 rs=[r for r in q.load() if r['reviewSet']>='step04-017'];batches=[b for b in q.BATCHES if b['batch'] in {r['reviewSet'] for r in rs}]
 selections=[q.selection(rs,b) for b in batches];q.save('step-04-wave2-selection.json',selections)
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
   item={'file':f,'sourceDigest':r['digest'],'sourceContext':m.blob(q.PIN,f).decode(),'record':r,'targetEvidence':{t:[{'edgeSlot':k,**v} for k,v in r['checks']['anchors'].items() if any(e['slotKey']==k and e['target']==t for e in r['edges'])] for t in targets},'renderContexts':{x['path']:m.blob(q.PIN,x['path']).decode() for j in r['sourceRenderProvenance'] for x in j['renderFiles']},'populationGapFindings':[g for g in q.read('step-04-wave2-population-gaps.json')['findings'] if g['sourceOwner']==f],'mandatory':'Read source→render header/slot correspondence in record; generation/parity is not claimed.'}
   put(selection['set'],f,item,len(r['edges']))
  flush()
 q.save('step-04-wave2-review-index.json',parts)
 accounts=[{**x,'filesInSet':sum(r['reviewSet']==x['set'] for r in rs),'parts':[p['part'] for p in parts if p['set']==x['set']],'bytes':sum(p['bytes'] for p in parts if p['set']==x['set']),'elapsedReviewSeconds':0,'remainingReviewBudgetSeconds':None,'semanticAuthorElapsedBySetSeconds':None,'authorScriptReplaySeconds':next(v['elapsedSeconds'] for v in q.read('step-04-wave2-author-times.json') if v['batch']==x['set']),'timingNote':'Only final author script replay seconds are measured; semantic author/rework time was not instrumented. Independent review not started; Lead budget pending'} for x in selections]
 q.save('step-04-wave2-review-accounting.json',accounts)
 manifest={'authorInputCommit':q.PIN,'authoredBatches':[b['batch'] for b in batches],'records':[{'set':r['reviewSet'],'file':r['file'],'digest':r['digest'],'recordSha256':m.sha(q.canon(r)),'edges':len(r['edges']),'diffBytes':len(r['diff'].encode())} for r in rs],'recordFiles':[{'path':str(p.relative_to(m.ROOT)),'sha256':m.sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted((P/'step-04-records').glob('*.jsonl')) if p.stem>='step04-017'],'inputs':[{'path':n,'sha256':m.sha((P/n).read_bytes())} for n in ['step-04-batches.json','step-04-population.json','step-04-source-render-provenance.json','step-04-population-gaps.json','owner-answers.md','step-04-wave2-population-gaps.json','step-04-wave2-step0-binding-check.json','step-04-wave2-lead-ruling-gaps.json']],'selectionSha256':m.sha((P/'step-04-wave2-selection.json').read_bytes()),'parts':parts}
 q.save('step-04-wave2-manifest.json',manifest)
 counts=collections.Counter(e['disposition'] for r in rs for e in r['edges'])
 lines=['# Step 4 wave 2 — independent A51 source-file review','',f'Author input: `{q.PIN}`. Batches step04-017 through step04-033 in order; {len(rs)} canonical source records, {len({e["consumerFile"] for r in rs for e in r["edges"]})} edge-bearing physical files, {sum(len(r["edges"]) for r in rs)} frozen slots. Records only under L12-58: Phase 9 exact patch specifications and preserve/park joins; no source/render bytes applied. Dispositions: `{dict(counts)}`.','',f'Frozen inputs and per-record/payload hashes: `step-04-wave2-manifest.json`. Per-set seeds/ranks/threshold witnesses: `step-04-wave2-selection.json`. Actual payload sizes and output assignments: `step-04-wave2-review-index.json`. There are {len(parts)} parts; every part ≤60 joined slots and 400,000 UTF-8 bytes, including full source context and record/proof context. A streamed source has ONE logical file verdict across all its parts.','', '**Reviewers never run checker, probes, resolver or author scripts.** Lead starts fresh-context reviewers under A38; author has started/accepted none. Read the full assigned pinned source (included in payload), its complete record/diff, every mandatory provenance join, and independently read target passages from the same pin. Full target files are available through `git show <pin>:<target>`; continue through EOF where needed. Never treat census advisory labels or checker green as semantic acceptance.','', 'A51 review unit is the source file. Per frozen set select ceil(15% of non-empty-diff files) by `sha256("A51-step04-file-v1" + NUL + pin + NUL + batch + NUL + source path)`, ascending hash then path, union every size/slot/prepared mandatory file. The inherited L12-34 unpatched stratum excludes already-selected mandatory files and uses the distinct recorded `-unpatched` seed. This request covers only the newly authored sets. Wave 1 retains custody of its root projections, 22 L12-10 controls and headerless witnesses; none of those earlier records/requests is rewritten. Every new mandatory source, changed binding and render join is included here. A file with any semantic correction counts once; ≤3% rework per set/stratum passes, >3% expands to EVERY file in that set (including preserve/park). Do not pool sets, replace sample members or silently reseed. Numerators/denominators remain null pending independent review.','', 'L12-57 changed bindings in the authored sets are mandatory and have no carried approval. The six L12-44 Step 3 records and later overlap rebindings stay immutable until Step 7 atomic assembly (L12-58(1)); `step-04-l12-44-rebind-report.json` and `step-00-l12-57-tier2-population-drift.json` are required handoff references, not new accepted bindings in this wave. New records preserve portable CONTEXT/RESEARCH/DISCUSSION conventions. All ten supplemental slots in 032/033 are parked lead-ruling pending census admission, with exact tuples and no invented ids; these sets cannot close. The author has not admitted them to the accepted Step 2 census.','', 'Additional uncensused wrapped 0026 decision references in the clarifying source and its two renders are recorded in `step-04-wave2-population-gaps.json`. They are not invented edge ids or admitted census records; review their included whole-file context and return admission/authoring to Lead. Frozen coverage remains 833 slots, not a claim that the earlier census contains these newly noticed occurrences.', '', 'No separate pair-accounting review parts: this wave changes plan reports only, per L12-58(4). Ordinary L12-11 committed-byte accounting and real runner author commit belong to Lead. No author commit id is guessed. No generator, installed-link, source/render determinism, Phase 9 application or post-commit reproduction acceptance is claimed.','', 'Report each file as ok/rework, quote the exact source/target passage for findings, and identify source owner, disposition/target/anchor/diff consequence. Return unresolved product rulings to Lead while unrelated sets continue. Reviewer time is pending Lead allocation; no measured review throughput or approved remaining budget is invented. Author elapsed/proof and the stop boundary are in verification/progress.','', '| Part | Set | Files | Slots | Bytes | Payload | Reviewer output |','| --- | --- | ---: | ---: | ---: | --- | --- |']
 lines += [f'| {x["part"]:02} | {x["set"]} | {len(x["files"])} | {x["edges"]} | {x["bytes"]} | `{x["payload"]}` | `{x["expectedReviewerOutput"]}` |' for x in parts]
 lines += ['', 'Per-set A51 accounting (`step-04-wave2-review-accounting.json` also carries exact seeds/ranks, threshold witnesses, byte/part and pending time/rework fields):', '', '| Set | Files | Patched population / sample | Mandatory | Unpatched eligible / sample | Distinct selected | Parts / bytes |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
 lines += [f'| {x["set"]} | {x["filesInSet"]} | {len(x["population"])}/{len(x["sample"])} | {len(x["mandatoryWitnesses"])} | {len(x["unpatchedRanks"])}/{len(x["unpatchedSample"])} | {len(x["selected"])} | {len(x["parts"])}/{x["bytes"]} |' for x in accounts]
 (P/'step-04-wave2-review-request.md').write_text('\n'.join(lines)+'\n')
 print(json.dumps({'selectedCanonicalFiles':sum(len(x['selected']) for x in selections),'patchedSample':sum(len(x['sample']) for x in selections),'unpatchedSample':sum(len(x['unpatchedSample']) for x in selections),'parts':len(parts),'bytes':sum(x['bytes'] for x in parts),'maxBytes':max(x['bytes'] for x in parts),'maxEdges':max(x['edges'] for x in parts)}))
if __name__=='__main__':main()
