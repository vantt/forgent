#!/usr/bin/env python3
"""Freeze new batch only and prepare one bounded independent review request."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave4e-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
sp=importlib.util.spec_from_file_location('pkt',P/'step-03-wave3-packet.py');pkt=importlib.util.module_from_spec(sp);sp.loader.exec_module(pkt)
m=w.m;PIN=w.PIN
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
 m.SETS=w.ALL;rs=m.records();save('step-03-wave4e-binding-manifest.json',w.binding(rs));wave=[r for r in rs if r['reviewSet'] in {'batch-'+b for b in w.NEW}];frozen=w.freeze(wave);save('step-03-wave4e-manifest.json',frozen)
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
 parts=pkt.parts(rows,'review-a38-step-03-wave4e-p');index={'pin':PIN,'manifest':'step-03-wave4e-manifest.json','binding':'step-03-wave4e-binding-manifest.json','selectedFiles':len(rows),'selectedEdges':sum(r['edges'] for r in rows),'perSet':account,'parts':parts,'reviewersStarted':0,'accepted':0,'scope':'New batch 075 only. Batches 076–082 unauthored; records ≤074 and their review requests are not assigned.'};save('step-03-wave4e-review-index.json',index)
 method=(P/'step-03-wave3-review-request.md').read_text().split('## Python per-field extractor')[1].split('## Set and stratum accounting')[0]
 method=method.replace("for key in ('file','authorInputCommit','digest','inventoryEdgeIds','authoringRules','retiresWithTree','edgeIds','reason','diff'):", "for key in ('file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules','retiresWithTree','edgeIds','reason','diff'):")
 lines=['# Step 3 wave 4e — one independent review request','',f'Fixed author pin `{PIN}`. Patch RECORDS only; no consumer edit. Read owner-answers A51, L12-21..L12-41 and the authoring digest. **Reviewers never run checker/probes.** Started/accepted 0/0.','',f'New batch **075** only: {len(wave)} whole-file records / {sum(len(r["edges"]) for r in wave)} edges. Two A51 strata select **{len(rows)} whole files / {index["selectedEdges"]} edges / {len(parts)} parts**. Complete-batch authoring-budget stop after 075; 076–082 remain unauthored. No partial next batch. Existing ≤074 reviews remain separate and unchanged.','', 'Review actual complete source roles and adjacent descriptions, not advisory census actions. Read aliases, candidate target passages, precise anchors, units, supplemental exclusions and all parked/preserve entries. Check the tutorial’s stale/live-lock gloss versus the actual verify-failure guide; it is a description-rewrite park. The 0025 Ship Faster citation binds to its exact titled narrative in runner/decisions/h-36d872fbb0e5.md; distinguish the unrelated number-only matches. RUL25 and RUL25/26/27 citations use exact Business Rules. Preserve actual completed spec-edit/audit identity and retained source/history references. L12-40 evidence exemptions do not turn arbitrary live knowledge prose into history.','', '## Python per-field extractor'+method,'## Set and stratum accounting','','| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |','|---|---:|---:|---:|---:|---:|']
 for a in account:lines.append(f"| {a['set']} | {a['patchedPopulation']}/{a['patchedSeedSample']} | {a['mandatoryFiles']} | {a['patchedAndMandatoryDistinct']} | {a['unpatchedEligiblePopulation']}/{a['unpatchedSample']} | {a['distinctSelected']} |")
 lines+=['','The manifest freezes exact NUL seeds/ranks, source/diff/record hashes and mandatory witnesses (≥65,536 bytes OR ≥40 inventory edges). Patched population includes all nonempty Phase 9 diffs. Unpatched population = empty diff with ≥1 edge, excluding already selected. Each stratum separately has reviewed denominator 0 and rework pending. ≤3% per set/stratum passes; >3% expands to EVERY file of that set, including unpatched/zero-edge files. Never pool, reseed, replace failed samples or self-accept.','', '## Assigned parts','']
 for part in parts:
  lines += [f"### Part {part['part']:02} → `{pathlib.Path(part['report']).name}`",'',f"{part['fileCount']} files / {part['edges']} edges / {part['sourcePlusRecordBytes']} source-plus-record bytes.",'','| Set | Consumer | Inclusion | Edges |','|---|---|---|---:|']
  for row in part['files']:lines.append(f"| {row['set']} | `{row['file']}` | {', '.join(row['strata'])} | {row['edges']} |")
  lines.append('')
 lines+=['## Required handback','','Read each complete pinned consumer via git show in consecutive ≤120-line pages; use the Python per-field extractor above for each record field and complete diff. Never dump a full JSONL record. A field >300,000 bytes is paged as UTF-8 bytes, preserving one whole-file verdict. Check target claims, witness groups and supplemental exclusions. Write only the assigned report. Give per-set AND per-stratum file denominators/rework numerators and overlaps; separate semantic outcome defects, record-text notes and Lead questions. Never run checker/probes, repair records, dispatch review or accept this request. Lead owns preview, independent acceptance, actual runner-commit accounting and committed-byte acceptance. GAP-01/02/03, workflow/RUL10 carry, Step 5 parity and Phase 9 remain separately gated. No Step 3 acceptance or phase close is claimed.']
 (P/'step-03-wave4e-review-request.md').write_text('\n'.join(lines)+'\n');print(json.dumps({'A51':account,'reviewFiles':len(rows),'reviewEdges':index['selectedEdges'],'parts':len(parts)}))
if __name__=='__main__':main()
