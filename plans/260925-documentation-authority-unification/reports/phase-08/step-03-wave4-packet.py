#!/usr/bin/env python3
"""Current bindings, L12-38 outcome delta and bounded independent review packets."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w4',P/'step-03-wave4-check.py');w4=importlib.util.module_from_spec(sp);sp.loader.exec_module(w4)
sp=importlib.util.spec_from_file_location('pkt',P/'step-03-wave3-packet.py');pkt=importlib.util.module_from_spec(sp);sp.loader.exec_module(pkt)
m=w4.m;PIN=w4.PIN

def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def delta(rs):
 initial=json.loads((P/'step-03-wave3-r2-changes.json').read_text());changes=[];files=[];text=[];byset=collections.Counter()
 for b in w4.PRIOR:
  path=str(m.REL/'step-03-records'/f'batch-{b}.jsonl');old={r['file']:r for r in map(json.loads,m.git('show','HEAD:'+path).decode().splitlines())}
  for r in [r for r in rs if r['reviewSet']=='batch-'+b]:
   before=old[r['file']]
   if before==r:continue
   outcome=False;oldes={e['edgeId']:e for e in before['edges']}
   for e in r['edges']:
    prior=oldes[e['edgeId']]
    if e==prior:continue
    out=any(e.get(k)!=prior.get(k) for k in ('disposition','target','anchor','timing')) or before.get('checks',{}).get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')!=r.get('checks',{}).get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')
    outcome|=out;changes.append({'file':r['file'],'set':r['reviewSet'],'edgeId':e['edgeId'],'kind':'outcome' if out else 'record-text','before':prior,'after':e})
   (files if outcome else text).append(r['file']);byset[r['reviewSet']]+=1
 initial.update(outcomeChanges=sum(x['kind']=='outcome' for x in changes),recordTextChanges=sum(x['kind']=='record-text' for x in changes),outcomeChangedFiles=sorted(files),textOnlyFiles=sorted(text),changes=changes,changedFilesBySet=dict(byset),source='Current records compared with assignment input HEAD; checker attempt 1 retained separately. Outcomes exclude record explanations, categories and advisory unit metadata.')
 # Recount actual notes rather than the initial three-subheading representation.
 initial['ruleHits']['rule3-narrative-note']=[{'file':r['file'],'edgeId':e['edgeId'],'holders':m.removed_decision_holders(PIN,e,(next((x['normalizedReference'] for x in m.census()['entries'] if x['edgeId']==e['edgeId']),None) or e.get('authorAddedEdge',{}).get('normalizedReference','')))} for r in rs for e in r['edges'] if e['disposition']=='preserve' and any(x['edgeId']==e['edgeId'] and x['before']['reason']!=x['after']['reason'] for x in changes) and m.removed_decision_holders(PIN,e,(next((x['normalizedReference'] for x in m.census()['entries'] if x['edgeId']==e['edgeId']),None) or e.get('authorAddedEdge',{}).get('normalizedReference','')))]
 save('step-03-wave3-r2-changes.json',initial);return initial

def request(name,index,expansion):
 old=(P/'step-03-wave3-review-request.md').read_text();method=old.split('## Python per-field extractor')[1].split('## Set and stratum accounting')[0]
 intro=[f'# Step 3 {"L12-38 full-set expansion and outcome re-review" if expansion else "bounded wave 4 A51 review"}', '',f'Pin `{PIN}`. Records only; no consumer patch has been applied. Read owner-answers.md A51 and L12-21..L12-38, progress.md current authoring digest and step-03-authoring-request.md schema. **Reviewers never run checker or probes.** Reviewers started/accepted 0/0.', '',f'Frozen index: `{name.replace("request.md","index.json")}`. **{index["selectedFiles"]} whole files / {index["selectedEdges"]} edges / {len(index["parts"])} parts**. Read every assigned complete pinned consumer with `git show`, every record field, diff, actual target passage, scan exclusion and source unit. Hashes bind records and are not semantic acceptance.', '', 'L12-38 is binding: knowledge and candidate/playbook/prompt files are live outside actual history. Undated decision citations there navigate to exact decision headings. Never-existing name-drift live pointers park dead-link plus a successor note, without inventing aliases. Preserved removed decision ids carry computed narrative-holder notes. Verbatim history regions exempt renamed aliases; 08367/08368 preserve. Carriage/dated history supplemental coverage requires Markdown links and explicit legacy-root paths; bare names, directory fragments and code/test paths are exempt, with true reasons. Present-tense “Where the doc lives now” and reading-map + owning-area claims park as description-rewrite. L12-38 settles all eighteen review questions; no new Lead ruling is requested.']
 if expansion:intro+=['','Expand **every file in batch-061 and batch-065** (the latter holds docs/explanation/herdr-orchestrator-terminology-boundary.md, 03890/03891), both strata and zero-edge files. Also review every Part A outcome-changed file outside those sets (037/038/041). Batch-037 was already fully expanded, but its newly corrected files receive this outcome re-review. Other text-only corrections need no new semantic review. Earlier seeded membership and reviews remain historical; no reseeding/pooling or author acceptance.']
 else:intro+=['','**Completed batch: 070 only (25 files). Pending: 071–082 (289 files); not authored or included in this request.** Stopped at the batch boundary for turn budget. docs/knowledge/decisions-index/decision-record.md is the L12-26(4) frozen rename copy, historical despite its stale generated header; it has no renderer to hand-edit. Participant RUL10 retains L12-17/GAP-01 carry/rewrite prerequisites. Relative decision links bind their original docs/reference coordinates through committed registry aliases; 0014 has GAP-02, while the exact 0011 narrative is bound independently.']
 intro+=['','## Python per-field extractor'+method,'## Set and stratum accounting','']
 if expansion:
  intro+=['| Set | Assigned whole files | Reviewed denominator | Rework numerator |','|---|---:|---:|---|']
  for x in index['coverageBySet']:intro.append(f"| {x['set']} | {x['files']} | 0 | pending |")
 else:
  intro+=['| Set | Patched population / seeded | Mandatory | Patched + mandatory | Unpatched eligible / seeded | Distinct union |','|---|---:|---:|---:|---:|---:|']
  for x in index['perSet']:intro.append(f"| {x['set']} | {x['patchedPopulation']}/{x['patchedSeedSample']} | {x['mandatoryFiles']} | {x['patchedAndMandatoryDistinct']} | {x['unpatchedEligiblePopulation']}/{x['unpatchedSample']} | {x['distinctSelected']} |")
 intro+=['','Both strata retain exact per-set NUL-separated seeds and full ranks. Selected denominators are frozen, reviewed denominators remain 0 and rework numerators pending. ≤3% per set AND stratum passes; >3% expands that set to all files. Never pool, reseed, replace a failed sample or self-accept.','', '## Assigned parts','']
 for part in index['parts']:
  intro += [f"### Part {part['part']:02} → `{pathlib.Path(part['report']).name}`",'',f"{part['fileCount']} files / {part['edges']} edges / {part['sourcePlusRecordBytes']:,} source-plus-record bytes. Read oversized indivisible context using bounded pages, keeping one per-file verdict.",'','| Set | Consumer | Strata | Edges |','|---|---|---|---:|']
  for r in part['files']:intro.append(f"| {r['set']} | `{r['file']}` | {', '.join(r['strata'])} | {r['edges']} |")
  intro.append('')
 intro+=['## Required handback','','Write only the assigned uniquely named review report. State the pin, complete reading method, per-file verdict and edges read; separate outcome defects from record-text notes and Lead questions. Give reviewed-file denominator and rework numerator per set and stratum, counting overlap explicitly. No repair, checker/probe run, reviewer dispatch or acceptance. Lead owns independent acceptance, previews, actual runner-commit accounting in both untouched Phase 6 reproduction manifests and committed-byte closeout. Step 5 parity, workflow/RUL10/GAP-01/GAP-02 carry and Phase 9 step-10 semantic-remnant/reading-map obligations remain. No Phase 8 close or Phase 9 authorization is claimed.']
 (P/name).write_text('\n'.join(intro)+'\n')

def main():
 m.SETS=w4.PRIOR;prior=m.records();d=delta(prior)
 wanted=set(d['outcomeChangedFiles'])|{r['file'] for r in prior if r['reviewSet'] in ('batch-061','batch-065')};rows=[pkt.row(r,['full-set-expansion'] if r['reviewSet'] in ('batch-061','batch-065') else ['Part-A-outcome-change']) for r in prior if r['file'] in wanted]
 index={'pin':PIN,'selectedFiles':len(rows),'selectedEdges':sum(x['edges'] for x in rows),'parts':pkt.parts(rows,'review-a38-step-03-wave3-x-p'),'coverageBySet':[{'set':b,'files':sum(x['set']==b for x in rows),'reviewedFileDenominator':0,'reworkNumerator':'pending'} for b in sorted({x['set'] for x in rows})],'fullExpansionSets':['batch-061','batch-065'],'outcomeChangedFilesOutsideExpandedSets':sorted(set(d['outcomeChangedFiles'])-{r['file'] for r in prior if r['reviewSet'] in ('batch-061','batch-065')}),'reviewersStarted':0,'accepted':0};save('step-03-wave3-expansion-review-index.json',index);request('step-03-wave3-expansion-review-request.md',index,True)
 m.SETS=w4.WAVE4;rs=m.records();frozen=w4.freeze(rs);save('step-03-wave4-manifest.json',frozen);by={r['file']:r for r in rs};rows=[];account=[]
 for g in frozen['sets']:
  b=g['set'];u=frozen['unpatchedStrata'][b.removeprefix('batch-')];selected=sorted(set(g['selected']+u['selected']))
  account.append({'set':b,'allFiles':sum(r['reviewSet']==b for r in rs),'patchedPopulation':g['populationCount'],'patchedSeedSample':len(g['sample']),'mandatoryFiles':len(g['mandatoryWitnesses']),'patchedAndMandatoryDistinct':len(g['selected']),'unpatchedEligiblePopulation':u['populationCount'],'unpatchedSample':len(u['selected']),'distinctSelected':len(selected),'patchedStratum':{'selectedDenominator':len(g['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'},'unpatchedStratum':{'selectedDenominator':len(u['selected']),'reviewedDenominator':0,'reworkNumerator':'pending'}})
  for f in selected:rows.append(pkt.row(by[f],(['patched-seeded'] if f in g['sample'] else [])+(['mandatory-threshold'] if f in [x['file'] for x in g['mandatoryWitnesses']] else [])+(['unpatched-seeded'] if f in u['selected'] else [])))
 index={'pin':PIN,'manifest':'step-03-wave4-manifest.json','completedBatches':list(w4.WAVE4),'pendingBatches':[f'{i:03}' for i in range(71,83)],'selectedFiles':len(rows),'selectedEdges':sum(x['edges'] for x in rows),'perSet':account,'parts':pkt.parts(rows,'review-a38-step-03-wave4-p'),'reviewersStarted':0,'accepted':0};save('step-03-wave4-review-index.json',index);request('step-03-wave4-review-request.md',index,False)
 save('step-03-wave4-binding-manifest.json',w4.binding(prior+rs));print(json.dumps({'expansionFiles':len(wanted),'expansionParts':len(json.loads((P/'step-03-wave3-expansion-review-index.json').read_text())['parts']),'wave4Selected':len(rows),'wave4Parts':len(index['parts'])}))
if __name__=='__main__':main()
