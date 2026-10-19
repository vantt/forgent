#!/usr/bin/env python3
"""Freeze current records, deltas and one bounded independent review request."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave4c-check.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
sp=importlib.util.spec_from_file_location('pkt',P/'step-03-wave3-packet.py');pkt=importlib.util.module_from_spec(sp);sp.loader.exec_module(pkt)
m=w.m;PIN=w.PIN
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
 m.SETS=w.ALL;rs=m.records();delta=json.loads((P/'step-03-wave4b-r2-changes.json').read_text());changes=[];outfiles=set();textfiles=set()
 for b in w.ALL:
  if b=='072':continue
  path=str(m.REL/'step-03-records'/f'batch-{b}.jsonl');old={r['file']:r for r in map(json.loads,m.blob('HEAD',path).decode().splitlines())}
  for r in (r for r in rs if r['reviewSet']=='batch-'+b):
   oldr=old[r['file']];before={e['edgeId']:e for e in oldr['edges']};out=False
   for e in r['edges']:
    oe=before.get(e['edgeId'])
    if oe==e:continue
    outcome=oe is None or any(oe.get(k)!=e.get(k) for k in ('disposition','target','anchor','timing','retiresWithTree','blockedCategory','dependencyCategory')) or oldr.get('checks',{}).get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')!=r.get('checks',{}).get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')
    out|=outcome;changes.append({'file':r['file'],'set':r['reviewSet'],'edgeId':e['edgeId'],'kind':'outcome' if outcome else 'record-text','before':oe,'after':e})
   if oldr!=r:(outfiles if out else textfiles).add(r['file'])
 delta.update(changes=changes,outcomeChanges=sum(x['kind']=='outcome' for x in changes),recordTextChanges=sum(x['kind']=='record-text' for x in changes),outcomeChangedFiles=sorted(outfiles),textOnlyFiles=sorted(textfiles),comparison='Assignment input HEAD versus current records; new batch 072 excluded from Part A delta.')
 save('step-03-wave4b-r2-changes.json',delta);save('step-03-wave4c-binding-manifest.json',w.binding(rs));wave=[r for r in rs if r['reviewSet'] in ('batch-071','batch-072')];frozen=w.freeze(wave);save('step-03-wave4c-manifest.json',frozen)
 chosen=collections.defaultdict(list);account=[];by={r['file']:r for r in rs}
 for g in frozen['sets']:
  b=g['set'];u=frozen['unpatchedStrata'][b.removeprefix('batch-')];selected=sorted(set(g['selected']+u['selected']))
  account.append({'set':b,'allFiles':sum(r['reviewSet']==b for r in wave),'patchedPopulation':g['populationCount'],'patchedSeedSample':len(g['sample']),'mandatoryFiles':len(g['mandatoryWitnesses']),'patchedAndMandatoryDistinct':len(g['selected']),'unpatchedEligiblePopulation':u['populationCount'],'unpatchedSample':len(u['selected']),'distinctSelected':len(selected),'patchedStratum':{'selectedDenominator':len(g['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'},'unpatchedStratum':{'selectedDenominator':len(u['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'}})
  for f in selected:
   if f in g['sample']:chosen[f].append('patched-seeded')
   if f in [x['file'] for x in g['mandatoryWitnesses']]:chosen[f].append('mandatory-threshold')
   if f in u['selected']:chosen[f].append('unpatched-seeded')
 for f in outfiles:chosen[f].append('Part-A-outcome-change')
 # Open questions are explicitly reviewable even when outside the seeded union.
 for r in wave:
  if any(e.get('blockedCategory')=='lead-ruling' for e in r['edges']):chosen[r['file']].append('open-lead-ruling')
 rows=[pkt.row(by[f],strata) for f,strata in sorted(chosen.items())];parts=pkt.parts(rows,'review-a38-step-03-wave4c-p')
 index={'pin':PIN,'manifest':'step-03-wave4c-manifest.json','binding':'step-03-wave4c-binding-manifest.json','selectedFiles':len(rows),'selectedEdges':sum(r['edges'] for r in rows),'perSet':account,'outcomeChangedFiles':sorted(outfiles),'parts':parts,'reviewersStarted':0,'accepted':0};save('step-03-wave4c-review-index.json',index)
 method=(P/'step-03-wave3-review-request.md').read_text().split('## Python per-field extractor')[1].split('## Set and stratum accounting')[0]
 lines=['# Step 3 wave 4c — one independent review request','',f'Pin `{PIN}` fixed. Patch records only; no consumer edit. Supersedes `step-03-wave4b-review-request.md`. Read owner-answers A51, L12-21..L12-39 and the progress authoring digest. **Reviewers never run checker/probes.** Reviewers started/accepted 0/0.','',f'Frozen index `step-03-wave4c-review-index.json`: **{len(rows)} whole files / {index["selectedEdges"]} edges / {len(parts)} parts**. Covers the reselected batch-071 sample, new batch-072 sample, every Part A outcome-changed file, and all open lead-ruling files. **073–082 remain unauthored** (batch-boundary budget stop).','', 'L12-39: verify number AND heading-title correspondence for narrative notes; only RUL10 passage/citing work-state edges keep dispositions, others have coverage-only retirement markers with no patch. Explicit Document history capture identities preserve. Deleted 00NN basenames join the scanner; 0001 has a title-search witness and dead-link park. A lead-ruling park is valid but its set cannot close. Keep dated Superseded-by and retained-root semantics distinct. Three batch-072 lead-ruling edges ask about exact historical capture/repro identities outside explicit history headings versus the current alias-preserve predicate; do not silently turn them into executable patches.','', '## Python per-field extractor'+method,'## Set and stratum accounting','','| Set | Patched population / seeded | Mandatory | Patched selected | Unpatched eligible / selected | Distinct A51 files |','|---|---:|---:|---:|---:|---:|']
 for a in account:lines.append(f"| {a['set']} | {a['patchedPopulation']}/{a['patchedSeedSample']} | {a['mandatoryFiles']} | {a['patchedAndMandatoryDistinct']} | {a['unpatchedEligiblePopulation']}/{a['unpatchedSample']} | {a['distinctSelected']} |")
 lines+=['','Exact per-set NUL seeds/ranks are frozen in the manifest. Batch 071 has been reselected against corrected records using the same formula, not a replacement for a failed sample. Earlier sample freezes remain historical. Both strata: selected denominators above; reviewed denominator 0, rework pending; ≤3% per set/stratum passes, >3% expands to every file of that set. No pooling, reseeding after a verdict or self-acceptance. Outcome supplements do not change seeded denominators.','', '## Assigned parts','']
 for part in parts:
  lines += [f"### Part {part['part']:02} → `{pathlib.Path(part['report']).name}`",'',f"{part['fileCount']} files / {part['edges']} edges / {part['sourcePlusRecordBytes']} source-plus-record bytes.",'','| Set | Consumer | Inclusion | Edges |','|---|---|---|---:|']
  for row in part['files']:lines.append(f"| {row['set']} | `{row['file']}` | {', '.join(row['strata'])} | {row['edges']} |")
  lines.append('')
 lines+=['## Required handback','','Use Python field extraction, read every assigned complete pinned consumer, every record field/diff, actual target passages, exclusion reasons, search groups and retirement markers. Page source in consecutive ≤120-line chunks and proofs one field at a time; one file verdict remains intact. Separate outcome defects from record-text notes and Lead questions, reporting per-set AND per-stratum file denominators/rework numerators and overlaps. Write only the assigned report; never run checker/probes, repair records, dispatch review or accept the packet. Lead owns preview, independent acceptance, actual runner-commit two-manifest accounting and committed-byte acceptance. Workflow/RUL10/GAP-01/GAP-02, Step 5 parity/decision-index row rewrite, Step 6 relocation, Phase 9 step-10 semantic search and reading-map merge remain. No Step 3 acceptance, Phase 8 close or Phase 9 authorization is claimed.']
 (P/'step-03-wave4c-review-request.md').write_text('\n'.join(lines)+'\n');print(json.dumps({'outcomeFiles':len(outfiles),'outcomes':delta['outcomeChanges'],'text':delta['recordTextChanges'],'A51':account,'reviewFiles':len(rows),'reviewEdges':index['selectedEdges'],'parts':len(parts)}))
if __name__=='__main__':main()
