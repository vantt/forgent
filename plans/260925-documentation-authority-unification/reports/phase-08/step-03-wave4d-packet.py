#!/usr/bin/env python3
"""New-batch-only A51 selection and one bounded review request; never dispatch review."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave4d-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
sp=importlib.util.spec_from_file_location('pkt',P/'step-03-wave3-packet.py');pkt=importlib.util.module_from_spec(sp);sp.loader.exec_module(pkt)
m=w.m;PIN=w.PIN
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
 m.SETS=w.ALL;rs=m.records();save('step-03-wave4d-binding-manifest.json',w.binding(rs));wave=[r for r in rs if r['reviewSet'] in {'batch-'+b for b in w.NEW}];frozen=w.freeze(wave);save('step-03-wave4d-manifest.json',frozen)
 by={r['file']:r for r in wave};rows=[];account=[]
 for g in frozen['sets']:
  b=g['set'];u=frozen['unpatchedStrata'][b.removeprefix('batch-')];selected=sorted(set(g['selected']+u['selected']))
  account.append({'set':b,'allFiles':sum(r['reviewSet']==b for r in wave),'patchedPopulation':g['populationCount'],'patchedSeedSample':len(g['sample']),'mandatoryFiles':len(g['mandatoryWitnesses']),'patchedAndMandatoryDistinct':len(g['selected']),'unpatchedEligiblePopulation':u['populationCount'],'unpatchedSample':len(u['selected']),'distinctSelected':len(selected),'patchedStratum':{'selectedDenominator':len(g['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'},'unpatchedStratum':{'selectedDenominator':len(u['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'}})
  for f in selected:
   strata=[]
   if f in g['sample']:strata.append('patched-seeded')
   if f in [x['file'] for x in g['mandatoryWitnesses']]:strata.append('mandatory-threshold')
   if f in u['selected']:strata.append('unpatched-seeded')
   rows.append(pkt.row(by[f],strata))
 for r in wave:
  if any(e.get('blockedCategory')=='lead-ruling' for e in r['edges']):
   existing=next((x for x in rows if x['file']==r['file']),None)
   if existing:existing['strata'].append('open-lead-ruling')
   else:rows.append(pkt.row(r,['open-lead-ruling']))
 parts=pkt.parts(rows,'review-a38-step-03-wave4d-p');index={'pin':PIN,'manifest':'step-03-wave4d-manifest.json','binding':'step-03-wave4d-binding-manifest.json','selectedFiles':len(rows),'selectedEdges':sum(r['edges'] for r in rows),'perSet':account,'parts':parts,'reviewersStarted':0,'accepted':0,'scope':'Only new batches 073–074; no batch ≤072 record is assigned here.'};save('step-03-wave4d-review-index.json',index)
 method=(P/'step-03-wave3-review-request.md').read_text().split('## Python per-field extractor')[1].split('## Set and stratum accounting')[0]
 lines=['# Step 3 wave 4d — one independent review request','',f'Fixed author pin `{PIN}`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-40 and the current authoring digest. **Reviewers never run checker/probes.** Started/accepted 0/0.','',f'Only new batches **073–074**, 50 whole-file records / 164 edges (160 inventory + 4 author-added). A51 plus open-ruling supplement selects **{len(rows)} whole files / {index["selectedEdges"]} edges / {len(parts)} parts**. Batches 075–082 remain unauthored at a complete-batch budget boundary. No partial batch. This request neither supersedes nor modifies wave4c, and assigns no earlier record, including the three bounded L12-40 preserves.','', 'Use complete pinned source reads, including empty-diff files and supplemental exclusions. Re-evaluate actual passage roles and every adjacent description against exact target passages. L12-40: captured evidence (fences, blockquoted output, explicit completed grep results/work descriptions and history regions) preserves; self-alias never patches and only preserves in evidence, while live self prose parks for description rewrite. Exemption is no semantic approval of an operative writer recipe. Check current-status names, superseded seq procedures, generated versus manual index recipes, exact decision number AND title, source-derived units, relative forms and anchor precision.','', '073 includes separate description-rewrite parks for historical seq-procedure recommendations, the old manual index recipe and schedule warning citations whose asserted passage is absent from the actual update; two operative index writer lines park on Step 5 parity. 074 adds four source-bound spec basenames in the tsk-3j1 historical footprint and P8-DOC-GAP-02 carry notes for enduser-docs; the backlog generator claim parks under P8-DOC-GAP-03. Open lead-ruling edge 04444: actual Iron Law 0032 deletion/title holder conflicts with the current checker’s sibling Multi-role 0032 successor requirement; checker changes beyond L12-40 need a bounded Lead ruling. That whole file is included even if outside the seeded union. 04445 uses its real deleted Multi-role filename and proper successor. These are author judgments to review, never accepted facts merely because their bindings check.','', '## Python per-field extractor'+method,'## Set and stratum accounting','','| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |','|---|---:|---:|---:|---:|---:|']
 for a in account:lines.append(f"| {a['set']} | {a['patchedPopulation']}/{a['patchedSeedSample']} | {a['mandatoryFiles']} | {a['patchedAndMandatoryDistinct']} | {a['unpatchedEligiblePopulation']}/{a['unpatchedSample']} | {a['distinctSelected']} |")
 lines+=['','Exact NUL seeds/ranks, source digests, diff hashes, mandatory threshold witnesses (≥65,536 bytes OR ≥40 inventory edges) and record hashes are frozen in the manifest. Patched population includes every nonempty Phase 9 diff; unpatched eligibility is empty diff with ≥1 edge, excluding already selected. Both strata separately have reviewed denominator 0 and rework pending. ≤3% rework per set/stratum passes; >3% expands to EVERY file in that set, including unpatched/zero-edge files. Never pool sets/strata, replace failed samples, reseed after findings or self-accept.','', '## Assigned parts','']
 for part in parts:
  lines += [f"### Part {part['part']:02} → `{pathlib.Path(part['report']).name}`",'',f"{part['fileCount']} files / {part['edges']} edges / {part['sourcePlusRecordBytes']} source-plus-record bytes.",'','| Set | Consumer | Inclusion | Edges |','|---|---|---|---:|']
  for row in part['files']:lines.append(f"| {row['set']} | `{row['file']}` | {', '.join(row['strata'])} | {row['edges']} |")
  lines.append('')
 lines+=['## Required handback','','Read each assigned complete consumer at the fixed pin via git show in consecutive ≤120-line pages, every record field and complete diff, target passages, resolution witness hit groups and supplemental exclusions. Use Python per-field extraction above; never dump a full JSONL record. A field >300,000 bytes is paged as UTF-8 bytes; one whole-file verdict remains indivisible. Write only the assigned report. Report per-set AND per-stratum file denominators/rework numerators, including overlaps; separate semantic outcome defects, record-text notes and Lead questions. Do not run checker/probes, repair records, dispatch review or accept a packet. Lead owns preview, independent acceptance, actual runner-commit accounting in both manifests and committed-byte acceptance. Workflow/RUL10/GAP-01/02/03 carry, Step 5 parity and Phase 9 remain separately gated. No Step 3 acceptance, phase close or Phase 9 authorization is claimed.']
 (P/'step-03-wave4d-review-request.md').write_text('\n'.join(lines)+'\n');print(json.dumps({'A51':account,'reviewFiles':len(rows),'reviewEdges':index['selectedEdges'],'parts':len(parts)}))
if __name__=='__main__':main()
