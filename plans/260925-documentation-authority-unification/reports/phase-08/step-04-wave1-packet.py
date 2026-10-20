#!/usr/bin/env python3
"""Freeze per-set A51 selection and review payloads with actual byte/slot limits."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections,math
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m

def main():
 rs=q.load();batches=[b for b in q.BATCHES if b['batch'] in {r['reviewSet'] for r in rs}]
 selections=[q.selection(rs,b) for b in batches];q.save('step-04-wave1-selection.json',selections)
 parts=[];current={'set':None,'files':[],'items':[],'edges':0}
 def wire(part):return {'authorInputCommit':q.PIN,'reviewerRule':'Never run checker/probes/resolver/author scripts. Read every assigned file through EOF and independently verify targets. One verdict per whole file, even when streamed.','set':part['set'],'files':part['files'],'joinedSlots':part['edges'],'items':part['items']}
 def size(part):return len((json.dumps(wire(part),ensure_ascii=False,indent=2)+'\n').encode())
 def flush():
  nonlocal current
  if not current['items']:return
  n=len(parts)+1;name=f'step-04-wave1-p{n:02}.json';output=f'review-a38-step-04-wave1-p{n:02}.md'
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
   item={'file':f,'sourceDigest':r['digest'],'sourceContext':m.blob(q.PIN,f).decode(),'record':r,'targetEvidence':{t:[{'edgeSlot':k,**v} for k,v in r['checks']['anchors'].items() if any(e['slotKey']==k and e['target']==t for e in r['edges'])] for t in targets},'mandatory':'Read source→render header/slot correspondence in record; generation/parity is not claimed.'}
   put(selection['set'],f,item,len(r['edges']))
  flush()
 # All 22 protected planning/history files, including all sibling-name controls.
 controls=q.POP['historyFiles'];rows=[r for r in q.POP['rows'] if r['bucket']=='L12-10']
 for x in controls:
  f=x['path'];joined=[r for r in rows if r['file']==f]
  put('L12-10-mandatory-controls',f,{'file':f,'sourceContext':m.blob(q.PIN,f).decode(),'digest':m.sha(m.blob(q.PIN,f)),'control':x,'slots':joined,'disposition':'preserve whole file and sibling CONTEXT/RESEARCH/DISCUSSION conventions; no record diff'},len(joined))
 flush()
 # The other two headerless cases are executable source and remain Step 5.
 authored={r['file'] for r in rs}
 for x in q.read('step-04-population-gaps.json')['renderProvenanceGaps']:
  f=x['file']
  if f in authored:continue
  joined=[r for r in q.POP['rows'] if r['file']==f]
  put('L12-58-Step5-source-witnesses',f,{'file':f,'sourceContext':m.blob(q.PIN,f).decode(),'digest':m.sha(m.blob(q.PIN,f)),'preparedWitness':x,'sourceOwner':f,'custody':'Executable source; Step 5 only; no Step 4 diff and no generated status inferred','joins':joined},len(joined))
 flush()
 q.save('step-04-wave1-review-index.json',parts)
 accounts=[{**x,'filesInSet':sum(r['reviewSet']==x['set'] for r in rs),'parts':[p['part'] for p in parts if p['set']==x['set']],'bytes':sum(p['bytes'] for p in parts if p['set']==x['set']),'elapsedReviewSeconds':0,'remainingReviewBudgetSeconds':None,'authorElapsedBySetSeconds':None,'timingNote':'Author time not individually instrumented; independent review not started; Lead budget pending'} for x in selections]
 q.save('step-04-wave1-review-accounting.json',accounts)
 manifest={'authorInputCommit':q.PIN,'authoredBatches':[b['batch'] for b in batches],'records':[{'set':r['reviewSet'],'file':r['file'],'digest':r['digest'],'recordSha256':m.sha(q.canon(r)),'edges':len(r['edges']),'diffBytes':len(r['diff'].encode())} for r in rs],'recordFiles':[{'path':str(p.relative_to(m.ROOT)),'sha256':m.sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted((P/'step-04-records').glob('*.jsonl'))],'inputs':[{'path':n,'sha256':m.sha((P/n).read_bytes())} for n in ['step-04-batches.json','step-04-population.json','step-04-source-render-provenance.json','step-04-population-gaps.json','owner-answers.md']],'selectionSha256':m.sha((P/'step-04-wave1-selection.json').read_bytes()),'parts':parts}
 q.save('step-04-wave1-manifest.json',manifest)
 counts=collections.Counter(e['disposition'] for r in rs for e in r['edges'])
 lines=['# Step 4 wave 1 — independent A51 source-file review','',f'Author input: `{q.PIN}`. Batches step04-001 through step04-016 in order; {len(rs)} canonical source records, {len({e["consumerFile"] for r in rs for e in r["edges"]})} edge-bearing physical files, {sum(len(r["edges"]) for r in rs)} frozen slots. Records only under L12-58: Phase 9 exact patch specifications and preserve/park joins; no source/render bytes applied. Dispositions: `{dict(counts)}`.','',f'Frozen inputs and per-record/payload hashes: `step-04-wave1-manifest.json`. Per-set seeds/ranks/threshold witnesses: `step-04-wave1-selection.json`. Actual payload sizes and output assignments: `step-04-wave1-review-index.json`. There are {len(parts)} parts; every part ≤60 joined slots and 400,000 UTF-8 bytes, including full source context and record/proof context. A streamed source has ONE logical file verdict across all its parts.','', '**Reviewers never run checker, probes, resolver or author scripts.** Lead starts fresh-context reviewers under A38; author has started/accepted none. Read the full assigned pinned source (included in payload), its complete record/diff, every mandatory provenance join, and independently read target passages from the same pin. Full target files are available through `git show <pin>:<target>`; continue through EOF where needed. Never treat census advisory labels or checker green as semantic acceptance.','', 'A51 review unit is the source file. Per frozen set select ceil(15% of non-empty-diff files) by `sha256("A51-step04-file-v1" + NUL + pin + NUL + batch + NUL + source path)`, ascending hash then path, union every size/slot/prepared mandatory file. The inherited L12-34 unpatched stratum excludes already-selected mandatory files and uses the distinct recorded `-unpatched` seed. All root source/projection boundaries, all L12-10 controls and all 17 headerless witnesses are mandatory. A file with any semantic correction counts once; ≤3% rework per set/stratum passes, >3% expands to EVERY file in that set (including preserve/park). Do not pool sets, replace sample members or silently reseed. Numerators/denominators remain null pending independent review.','', 'L12-57 changed bindings in the authored sets are mandatory and have no carried approval. The six L12-44 Step 3 records and later overlap rebindings stay immutable until Step 7 atomic assembly (L12-58(1)); `step-04-l12-44-rebind-report.json` and `step-00-l12-57-tier2-population-drift.json` are required handoff references, not new accepted bindings in this wave. L12-10 control payloads include all 22 complete files and their named CONTEXT/RESEARCH/DISCUSSION companions. The two executable headerless cases are mandatory ownership witnesses only; their behavior remains Step 5.','', 'No separate pair-accounting review parts: this wave changes plan reports only, per L12-58(4). Ordinary L12-11 committed-byte accounting and real runner author commit belong to Lead. No author commit id is guessed. No generator, installed-link, source/render determinism, Phase 9 application or post-commit reproduction acceptance is claimed.','', 'Report each file as ok/rework, quote the exact source/target passage for findings, and identify source owner, disposition/target/anchor/diff consequence. Return unresolved product rulings to Lead while unrelated sets continue. Reviewer time is pending Lead allocation; no measured review throughput or approved remaining budget is invented. Author elapsed/proof and the stop boundary are in verification/progress.','', '| Part | Set | Files | Slots | Bytes | Payload | Reviewer output |','| --- | --- | ---: | ---: | ---: | --- | --- |']
 lines += [f'| {x["part"]:02} | {x["set"]} | {len(x["files"])} | {x["edges"]} | {x["bytes"]} | `{x["payload"]}` | `{x["expectedReviewerOutput"]}` |' for x in parts]
 lines += ['', 'Per-set A51 accounting (`step-04-wave1-review-accounting.json` also carries exact seeds/ranks, threshold witnesses, byte/part and pending time/rework fields):', '', '| Set | Files | Patched population / sample | Mandatory | Unpatched eligible / sample | Distinct selected | Parts / bytes |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
 lines += [f'| {x["set"]} | {x["filesInSet"]} | {len(x["population"])}/{len(x["sample"])} | {len(x["mandatoryWitnesses"])} | {len(x["unpatchedRanks"])}/{len(x["unpatchedSample"])} | {len(x["selected"])} | {len(x["parts"])}/{x["bytes"]} |' for x in accounts]
 (P/'step-04-wave1-review-request.md').write_text('\n'.join(lines)+'\n')
 print(json.dumps({'selectedCanonicalFiles':sum(len(x['selected']) for x in selections),'patchedSample':sum(len(x['sample']) for x in selections),'unpatchedSample':sum(len(x['unpatchedSample']) for x in selections),'parts':len(parts),'bytes':sum(x['bytes'] for x in parts),'maxBytes':max(x['bytes'] for x in parts),'maxEdges':max(x['edges'] for x in parts)}))
if __name__=='__main__':main()
