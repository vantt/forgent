#!/usr/bin/env python3
"""Prepare fresh bounded A51 packets; never overwrite a prior review request."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave5a-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
sp=importlib.util.spec_from_file_location('pkt',P/'step-03-wave3-packet.py');pkt=importlib.util.module_from_spec(sp);sp.loader.exec_module(pkt)
m=w.m;PIN=w.PIN;NEW=('083','084','085');ALL=tuple(f'{i:03}' for i in range(1,86))
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
method=(P/'step-03-batch073-r2-review-request.md').read_text().split('## Python per-field extractor')[1].split('## One assigned part')[0]
def request(name,title,index,preface,accounts=None):
 assert not (P/name).exists(),name
 lines=['# '+title,'',f'Fixed author pin `{PIN}`. Patch RECORDS only. A51 and L12-21..L12-49, including the latest authoring rules digest, remain binding. **Reviewers never run checker/probes.** Started/accepted 0/0. No consumer edit, authority flip or author acceptance.','',preface,'',f'Frozen index `{name.replace("request.md","index.json")}`: **{index["selectedFiles"]} whole files / {index["selectedEdges"]} edges / {len(index["parts"])} parts**. Source/diff/current-record hashes bind each assigned file. Read EVERY edge and complete diff of each assigned consumer in full pinned-source context, including preserve, parked, row flips, supplemental edges/exclusions and search witnesses.','', '## Python per-field extractor'+method]
 if accounts:
  lines+=['## Per-set A51 selection','','| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct |','|---|---:|---:|---:|---:|---:|']
  for a in accounts:lines.append(f"| {a['set']} | {a['patchedPopulation']}/{a['patchedSeedSample']} | {a['mandatoryFiles']} | {a['patchedAndMandatoryDistinct']} | {a['unpatchedEligiblePopulation']}/{a['unpatchedSample']} | {a['distinctSelected']} |")
 lines+=['','Both strata use their own NUL-seeded sha256(path) ranks and ceil(15%) selection, with mandatory ≥65,536 source bytes OR ≥40 inventory edges. Each set/stratum retains its own reviewed denominator/rework numerator; no pooling or reseeding. A >3% rework breach expands semantic review to EVERY file of that set, including parked/preserve/row-flip and zero-edge files. Frozen historical memberships stay unchanged.','', '## Assigned parts','']
 for part in index['parts']:
  lines += [f"### Part {part['part']:02} → `{pathlib.Path(part['report']).name}`",'',f"{part['fileCount']} files / {part['edges']} edges / {part['sourcePlusRecordBytes']} source-plus-record bytes.",'','| Set | Consumer | Inclusion | Edges |','|---|---|---|---:|']
  for row in part['files']:lines.append(f"| {row['set']} | `{row['file']}` | {', '.join(row['strata'])} | {row['edges']} |")
  lines.append('')
 lines+=['## Handback','','Write only the assigned uniquely named report. Give one whole-file verdict per file, exact record/diff bindings, every edge read, per-set AND per-stratum reviewed-file denominators and rework numerators (with overlaps), evidence and dissent. Distinguish semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch or accept. Lead owns preview, independent review/acceptance and actual-commit accounting. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separate gates. No set closure is claimed. Names follow the explicit brief namespace; fgOS CLI is forbidden in this worker.']
 (P/name).write_text('\n'.join(lines)+'\n')
def main():
 m.SETS=ALL;rs=m.records();w.ALL=ALL;w.NEW=NEW
 binding=w.binding(rs);binding['rule']='A51, L12-49; all current records 001–085; earlier review manifests remain historical'
 save('step-03-wave5b-binding-manifest.json',binding)
 wave=[r for r in rs if r['reviewSet'] in {'batch-'+b for b in NEW}];freeze=w.freeze(wave);save('step-03-wave5b-manifest.json',freeze)
 by={r['file']:r for r in wave};rows=[];account=[]
 for g in freeze['sets']:
  b=g['set'];u=freeze['unpatchedStrata'][b.removeprefix('batch-')];selected=sorted(set(g['selected']+u['selected']))
  account.append({'set':b,'allFiles':sum(r['reviewSet']==b for r in wave),'patchedPopulation':g['populationCount'],'patchedSeedSample':len(g['sample']),'mandatoryFiles':len(g['mandatoryWitnesses']),'patchedAndMandatoryDistinct':len(g['selected']),'unpatchedEligiblePopulation':u['populationCount'],'unpatchedSample':len(u['selected']),'distinctSelected':len(selected),'patchedStratum':{'selectedDenominator':len(g['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'},'unpatchedStratum':{'selectedDenominator':len(u['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'}})
  for f in selected:
   strata=[]
   if f in g['sample']:strata.append('patched-seeded')
   if f in [x['file'] for x in g['mandatoryWitnesses']]:strata.append('mandatory-threshold')
   if f in u['selected']:strata.append('unpatched-seeded')
   rows.append(pkt.row(by[f],strata))
 index={'pin':PIN,'manifest':'step-03-wave5b-manifest.json','binding':'step-03-wave5b-binding-manifest.json','selectedFiles':len(rows),'selectedEdges':sum(r['edges'] for r in rows),'perSet':account,'parts':pkt.parts(rows,'review-a38-step-03-wave5b-p'),'reviewersStarted':0,'accepted':0,'scope':'New batches 083–085 only; 086–125 remain unauthored at a complete-batch authoring/context budget boundary. No partial next batch. 126–130 are another worker’s custody and excluded.'}
 save('step-03-wave5b-review-index.json',index)
 request('step-03-wave5b-review-request.md','Step 3 wave 5b — independent A51 review',index,'New batches **083–085 only**, 32 whole-file records. **086–125 remain unauthored**; stop at complete batch 085, no partial next record. Other worker batches 126–130 and wave5c are excluded. Review the Related/Provenance distinction even in metadata fences; candidate content is live outside declared carriage/history. Compare RUL75 to exact Business Rules holder, 0062 removal to its decision, stale line-locator parks, self/carriage-only Related parks and complete map cutover row semantics. Check every supplemental link against both original snapshot and wrapper coordinates. L12-47 Source provenance remains literal; a provenance spelling never turns into a live navigation claim.',account)
 # L12-49 expansion preserves wave5a selection and actual reviewed-file evidence.
 batch=[r for r in rs if r['reviewSet']=='batch-081'];oldindex=json.loads((P/'step-03-wave5a-review-index.json').read_text());oldset=next(s for s in json.loads((P/'step-03-wave5a-manifest.json').read_text())['sets'] if s['set']=='batch-081');original=set(oldset['population']);reviewed={r['file'] for part in oldindex['parts'] for r in part['files'] if r['set']=='batch-081'};current={r['file'] for r in batch if r['diff']};pending=current-reviewed;corrected={r['file'] for r in batch if any(e['edgeId']=='maps-j-04939' for e in r['edges'])}
 assert original==current|corrected
 erows=[pkt.row(r,['L12-49-patched-stratum-expansion'] if r['file'] in pending else ['L12-49-corrected-04939-targeted-re-review']) for r in batch if r['file'] in pending|corrected]
 exp={'pin':PIN,'rule':'L12-49 / A51','historicalPatchedPopulation':sorted(original),'historicalPatchedPopulationCount':len(original),'alreadyReviewedWave5a':sorted(reviewed),'historicalPatchedReviewed':sorted(original&reviewed),'historicalReviewedDenominator':len(original&reviewed),'historicalReworkNumerator':1,'currentPatchedPopulation':sorted(current),'currentPatchedUnreviewed':sorted(pending),'correctedFileSupplement':sorted(corrected),'originalPatchedPopulationCovered':sorted((original&reviewed)|pending|corrected),'selectedFiles':len(erows),'selectedEdges':sum(r['edges'] for r in erows),'parts':pkt.parts(erows,'review-a38-step-03-batch081-x-p'),'reviewedNewDenominator':0,'reworkNewNumerator':'pending','reviewersStarted':0,'accepted':0}
 assert set(exp['originalPatchedPopulationCovered'])==original
 save('step-03-batch081-expansion-review-index.json',exp)
 request('step-03-batch081-expansion-review-request.md','Step 3 batch 081 — patched-stratum expansion and corrected-file re-review',exp,f'L12-49 confirms 1 rework among the 3 wave5a patched-stratum reviewed files (>3%). Original patched population **{len(original)}**; current patched population **{len(current)}**. This request assigns EVERY current patched file not already reviewed in wave5a (**{len(pending)} files**) plus the corrected 04939 file as a targeted supplement (**{len(corrected)} file**). The other two previously reviewed patched files stay covered by wave5a; the index lists the exact full population union. Existing requests/reports and seed membership are unchanged. Re-review **maps-j-04939** as description-rewrite park: source attributes `<scope>#p<n>`/ID_PATTERN shape to the classify-step guide, but the knowledge-tree holder lacks it; actual text is in `core/skills/_shared/executor-dispatch-fallback.md`. It has no executable diff/target, matching the 04485 class. All other edges in that file are unchanged.')
 print(json.dumps({'A51':account,'newFiles':index['selectedFiles'],'newEdges':index['selectedEdges'],'newParts':len(index['parts']),'expansionFiles':exp['selectedFiles'],'expansionEdges':exp['selectedEdges'],'expansionParts':len(exp['parts'])}))
if __name__=='__main__':main()
