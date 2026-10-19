#!/usr/bin/env python3
"""Plan-local deterministic A50 tables. No writes; committed census input only."""
import sys
sys.dont_write_bytecode=True
import json,hashlib,math,collections,re,importlib.util
from pathlib import Path
R=Path(__file__).resolve().parent;ROOT=R.parents[3]
SEED='A50-L12-26-merged-20261019-step02j-7f491cc2'
def enc(x):return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def load(n):return json.loads((R/n).read_text())
def source_join(before,after):
    by=collections.defaultdict(list);oldby=collections.defaultdict(list)
    for e in after:by[(e['consumerPath'],e['normalizedReference'])].append(e)
    for e in before:oldby[(e['consumerPath'],e['normalizedReference'])].append(e)
    out={}
    for b in before:
        key=(b['consumerPath'],b['normalizedReference']);rows=by[key];old=oldby[key]
        # Normalized identity + complete expression, then authenticated physical overlap.
        exact=[n for n in rows if n['matchedExpression']==b['matchedExpression']]
        same=[n for n in exact if n.get('callSiteSha256')==b.get('callSiteSha256') and any(s['line']==b['line'] and s['columnStart']==b['columnStart'] for s in n['physicalSpans'])]
        content=[n for n in exact if n.get('callSiteSha256')==b.get('callSiteSha256')]
        if len(same)==1:out[b['edgeId']]=same
        elif len(content)==1:out[b['edgeId']]=content
        elif len(exact)==1:out[b['edgeId']]=exact
        elif len(rows)==len(old) and rows and all(n['fileDigest']==b['fileDigest'] for n in rows):out[b['edgeId']]=[rows[old.index(b)]]
        else:
            out[b['edgeId']]=[n for n in after if n['consumerPath']==b['consumerPath'] and (n['fileDigest']==b['fileDigest'] or n.get('callSiteSha256')==b.get('callSiteSha256')) and (n['normalizedReference'].startswith(b['normalizedReference']) or b['normalizedReference'].startswith(n['normalizedReference'])) and any(s['line']==b['line'] and s['columnStart']<b['columnEndExclusive'] and s['columnEndExclusive']>b['columnStart'] for s in n['physicalSpans'])]
    return out
FIELDS=('cutoverAction','desiredOwner','desiredAnchor','cutoverPatch')
def changed(b,n):return any(b.get(k)!=n.get(k) for k in FIELDS)
CLASS_FIELDS={1:FIELDS,2:('successorNote',),3:FIELDS,4:('role','rule','sourcePath','cutoverAction'),5:FIELDS,6:FIELDS,7:('cutoverPatch','blockedStatus'),8:FIELDS,9:FIELDS+('role','globDirectory','blockedStatus'),10:('brokenLinkCause','successorNote')}
def class_bad(k,e):
    patch=e.get('cutoverPatch');action=e['cutoverAction']
    if k==1:return bool(patch and e.get('locatorTokens') and not e.get('desiredAnchor'))
    if k==2 and (e.get('globDirectory') or re.search(r'[<>*{}]',e['normalizedReference'])):return False
    if k==2:return 'successorNote' not in e or e['successorNote'].get('executable') is not False
    if k==3:return action!='preserve' or bool(patch)
    if k==4:
        return e['consumerPath']=='docs/backlog.md' and (e['role']=='generator' or e['rule']=='generated' or e['sourcePath']!='docs/backlog.md')
    if k==5:return e['rule'] in ('historical-narrative','verbatim-carriage','frozen-rename-history','provenance') and (action!='preserve' or bool(patch))
    if k==6:return e['rule']=='migration-state' and (action!='phase9-row-flip' or bool(patch))
    if k==7:return bool(patch and (patch['old']!=e['matchedExpression'] or patch.get('timing')!='Phase 9 only')) or ('pending' in action and (bool(patch) or e.get('blockedStatus')!='blocked'))
    if k==8:return e['rule'].startswith('lineage-') and bool(patch)
    if k==9:return action=='exact-cutover-patch' or ('pending' in action and (bool(patch) or e.get('blockedStatus')!='blocked')) or (bool(e.get('globDirectory')) and bool(e.get('successorNote')))
    if k==10:return bool(e.get('brokenLinkCause') and re.search(r'[<>*{}]',e['normalizedReference'].split('#')[0]))
    raise ValueError(k)
def class_diff(c,joins):
    before=load('step-02i-census-maps-portals-prose.json')['entries'];out=[]
    for k in range(1,11):
        bs=[b for b in before if any(k in n.get('l12_26Classes',[]) and any(b.get(f)!=n.get(f) for f in CLASS_FIELDS[k]) for n in joins[b['edgeId']])]
        bad=[e for e in c['entries'] if k in e.get('l12_26Classes',[]) and class_bad(k,e)]
        out.append({'class':k,'baseline':'02i','beforeCount':len(bs),'afterCount':len(bad),'beforeRowIds':[b['edgeId'] for b in bs],'afterRowIds':[e['edgeId'] for e in bad],'comparisonFields':CLASS_FIELDS[k],'measurement':'Before: all source-identity joined 02i rows whose class-specific outcome changed. After: explicit structural rule violations across the repaired class population (class_bad). Overlapping author predicates, not independent semantic error rates; real differential witnesses supplement every class.'})
    parity=[x for x in c['earlierClassProposals'] if x['controlId'] in ('overlay-004','overlay-005')]
    out[6]['supplementalBeforeControlIds']=[x['controlId'] for x in parity]
    out[6]['beforeCount']+=len(parity)
    out[6]['afterCount']+=sum(x['cutoverAction']!='preserve-pending-behavioral-proof' or x['blockedStatus']!='blocked' or bool(x['cutoverPatch']) for x in parity)
    out[6]['measurement']+=' Includes two earlier Step 5 parity controls with candidate text only and explicit blocked status.'
    out[8]['supplementalBeforeRowIds']=[x['edgeId'] for x in c.get('earlierClassHelpProposals',[])]
    out[8]['beforeCount']+=len(out[8]['supplementalBeforeRowIds'])
    out[8]['measurement']+=' Includes the two named earlier CLI help rows, with committed passage correspondence and blocked Step 5 candidate text.'
    out[8]['afterCount']+=sum(x['cutoverAction']!='preserve-pending-behavioral-proof' or x['blockedStatus']!='blocked' or bool(x['cutoverPatch']) for x in c.get('earlierClassHelpProposals',[]))
    return out

def compile_packet(c):
    edges=c['entries'];byid={e['edgeId']:e for e in edges};groups=collections.defaultdict(list)
    for e in edges:groups[(e['normalizedReference'],e.get('desiredOwner'),e.get('desiredAnchor'))].append(e)
    mappings=[]
    for key,rows in sorted(groups.items(),key=lambda v:tuple(x or '' for x in v[0])):
        mappings.append({'mappingId':f'mapping-j-{len(mappings)+1:04}','legacyReference':key[0],'owner':key[1],'anchor':key[2],'edgeIds':[e['edgeId'] for e in rows],'edgeCount':len(rows),'actions':dict(collections.Counter(e['cutoverAction'] for e in rows)),'rules':dict(collections.Counter(e['rule'] for e in rows)),'roles':dict(collections.Counter(e['role'] for e in rows)),'effectiveRowsSha256':sha(enc(rows)),'semanticReview':'pending; deep-read every action/rule/role variant, actual source and target'})
    old=load('step-02i-census-maps-portals-prose.json')['entries'];joined=source_join(old,edges)
    olddata=load('step-02i-review-data.json');sets={}
    def add(name,ids,why):sets[name]={'rowIds':sorted(set(ids)),'count':len(set(ids)),'mandatoryDeepRead':True,'reason':why}
    ranked=sorted((sha((SEED+'\0'+e['edgeId']).encode()),e['edgeId']) for e in edges)
    sample=[{'edgeId':id,'sha256Rank':rank,'effectiveRowSha256':sha(enc(byid[id]))} for rank,id in ranked[:math.ceil(.15*len(edges))]]
    add('seeded-semantic-edge-sample',[e['edgeId'] for e in sample],'Lead reviews FIRST. Carried A50 expansion: <=3% rework per set; any breach requires edge-level review of ALL step-02j edges.')
    for action in ('preserve-pending-target','preserve-pending-behavioral-proof','phase9-row-flip'):
        add(action,[e['edgeId'] for e in edges if e['cutoverAction']==action],'Every pending/authority-flip row, deep-read all')
    add('mechanical-target-failures',[e['edgeId'] for e in edges if e.get('mechanicalTargetCheck',{}).get('failures') or e.get('successorNote',{}).get('mechanicalCheck',{}).get('failures')],'Failures are open, never cleared by sample')
    for name in ('writers-and-writer-triage','behavioral-runtime-and-contract-triage'):
        inherited={n['edgeId'] for id in olddata['sets'][name]['rowIds'] if id in joined for n in joined[id]}
        current={e['edgeId'] for e in edges if e['role'] in (('writer/check',) if name.startswith('writers') else ('writer/check','behavioral','generator'))}
        add(name,inherited|current,'All inherited triage rows retained across reclassification; all new behavioral rows deep-read')
    controls=[{**ctl,'effectiveRow':next(x['row'] for x in c['overlayEffectiveRows'] if x['baseKey']==ctl['baseKey']),'successorNotes':[n for n in c.get('overlaySuccessorNotes',[]) if n['controlId']==ctl['controlId']],'currentProposal':next(x for x in c['earlierClassProposals'] if x['controlId']==ctl['controlId']),'historicalWitnessOnly':True,'currentSourceBinding':next((x for x in c['overlaySourceBindings'] if x['controlId']==ctl['controlId']),None)} for ctl in c['overlayControls']]
    add('overlay-precedence-controls',[x['controlId'] for x in controls],'197 chronological overlay witnesses unchanged; successor notes are separate, never precedence mutations')
    annex=olddata['annex']
    for item in annex:
        if 'regeneratedEdgeIds' in item:item['currentEdgeIds']=sorted({n['edgeId'] for id in item['regeneratedEdgeIds'] for n in joined.get(id,[])})
    annex.extend(c.get('mergePriorJoinRebindings',{}).get('controls',[]))
    for name,prefix in [('prior-target-failure-dispositions','prior-target-'),('prior-anchor-check-failures','anchor-'),('native-dynamic-patterns','native-'),('mandatory-rereview-old-exclusions','excluded-')]:
        add(name,[x['controlId'] for x in annex if x['controlId'].startswith(prefix)],'All immutable prior failure/exclusion records remain mandatory; no silent disappearance')
    changedrows=[]
    for b in old:
        ns=joined[b['edgeId']]
        if any(changed(b,n) for n in ns):changedrows.append({'beforeEdgeId':b['edgeId'],'afterEdgeIds':[n['edgeId'] for n in ns],'before':{k:b.get(k) for k in FIELDS},'after':[{k:n.get(k) for k in FIELDS} for n in ns]})
    add('merged-source-lineage-correspondence',[x['controlId'] for x in annex if x['controlId'].startswith('merge-lineage-')],'All main-changed source lineage joins; full reference/call-site correspondence, explicit unmatched historical rows, no same-ordinal approval')
    add('mandatory-rereview-action-target-patch-changed-from-02i',[n['edgeId'] for b in old for n in joined[b['edgeId']] if changed(b,n)],'Every changed action, owner, anchor or patch text, unsampled')
    removed=[b for b in old if not joined[b['edgeId']]]
    for b in removed:annex.append({'controlId':'removed-02i-'+b['edgeId'],'beforeRow':b,'reason':'Reparse population/span changed; explicit source review required'})
    add('mandatory-rereview-removed-from-02i',['removed-02i-'+b['edgeId'] for b in removed],'Every old edge with no current join remains explicitly reviewable')
    # Every former mandatory changed-row/pilot set is carried via stable source identity.
    for name,s in olddata['sets'].items():
        if name.startswith('mandatory-rereview-'):
            add('carried-'+name,[n['edgeId'] for id in s['rowIds'] if id in joined for n in joined[id]],'Continuity with earlier mandatory populations; removed old edges have explicit controls')
    broken=[{'edgeId':e['edgeId'],'consumerPath':e['consumerPath'],'fileDigest':e['fileDigest'],'physicalSpans':e['physicalSpans'],'missingPath':e['normalizedReference'].split('#')[0],'cause':e['brokenLinkCause'],'carriageExcluded':bool(e.get('carriagePolicy')),'phase9Disposition':'Phase 9 computes its own complete baseline; placeholders excluded'} for e in edges if e.get('brokenLinkCause')]
    lineage_carries=[{'edgeId':e['edgeId'],'consumerPath':e['consumerPath'],'reference':e['normalizedReference'],'reason':e['phase9BaselineCarry']} for e in edges if e.get('phase9BaselineCarry')]
    add('lineage-baseline-carries',[x['edgeId'] for x in lineage_carries],'Explicit Related/self lineage preserves: include these retiring-source links in Phase 9 baseline even if valid before cutover')
    add('missing-link-destination-population',[e['edgeId'] for e in broken],'Relocation failures distinguished from inherited missing links; not a complete Phase 9 inventory')
    for n,row in enumerate(c.get('earlierClassSuccessorNotes',[]),1):annex.append({'controlId':f'earlier-class-successor-{n:03}',**row})
    add('earlier-class-moved-successors',[x['controlId'] for x in annex if x['controlId'].startswith('earlier-class-successor-')],'Class 1/2 non-class-3 consumers, immutable effective-row digest and lookup-only successor')
    for x in c.get('earlierClassHelpProposals',[]):annex.append({'controlId':'earlier-help-'+x['edgeId'],**x})
    add('earlier-cli-help-behavioral-proposals',[x['controlId'] for x in annex if x['controlId'].startswith('earlier-help-')],'Named cli-004/008 help-text rows are blocked Step 5 behavioral proposals, not executable patches')
    add('root-authority-alias-outcomes',[x['path'] for x in c['rootAuthorityAliasOutcomes']],'Per-file Phase 6 alias examination, not an inferred retirement')
    # All reviewed rework examples are traceable; Lead overrules remain settled.
    overr={'maps-i-00241','maps-i-00420','maps-i-00586','maps-i-00698'};findings=[]
    for report in sorted(R.glob('review-a38-step-02i-map-part-*.md')):
        for lineno,line in enumerate(report.read_text().splitlines(),1):
            if not re.search(r'rework|judgment|judgement',line,re.I):continue
            for id in sorted(set(re.findall(r'maps-i-\d+',line))):
                if id not in joined:continue
                findings.append({'report':report.name,'reportLine':lineno,'beforeEdgeId':id,'afterEdgeIds':[n['edgeId'] for n in joined[id]],'settledOverride':'L12-26 existing literal-snapshot note accepted' if id in overr else None})
    oldm={m['mappingId']:m for m in load('step-02i-distinct-mappings.json')['entries']};mappingfindings={}
    for report in sorted(R.glob('review-a38-step-02i-map-part-*.md')):
        for lineno,line in enumerate(report.read_text().splitlines(),1):
            if not re.search(r'rework|judgment|judgement',line,re.I):continue
            for mid in sorted(set(re.findall(r'mapping-i-\d+',line))):
                if mid in oldm:mappingfindings[(report.name,mid)]={'report':report.name,'reportLine':lineno,'beforeMappingId':mid,'beforeEdgeIds':oldm[mid]['edgeIds'],'afterEdgeIds':sorted({n['edgeId'] for id in oldm[mid]['edgeIds'] for n in joined[id]})}
    # Deduplicate finding joins but preserve report identities.
    unique={ (x['report'],x['beforeEdgeId']):x for x in findings};findings=list(unique.values())
    diffs=class_diff(c,joined)
    data={'seed':SEED,'sampleCount':len(sample),'sample':sample,'sets':sets,'overlayControls':controls,'annex':annex,'classDiff':diffs,'changedRows':changedrows,'reviewFindingJoins':findings,'reviewMappingFindingJoins':list(mappingfindings.values()),'settledLeadOverrides':['maps-i-00241/00420/00586/00698 already have literal-snapshot lookup notes; accepted','Implementation: Carriage only / Canonical: No are candidate pre-promotion status of 50 area files; not carriage boundaries','runner/subcomponents/h-6979005beaf7/spec.md and runner/decisions/h-aabefc85f0c9.md are valid exact content targets'],'missingLinks':broken,'lineageBaselineCarries':lineage_carries,'rootAuthorityAliasOutcomes':c['rootAuthorityAliasOutcomes'],'phase9Dependencies':['workflow.md AGENT-WF D-ADR0070 candidate carry before docs/specs/** retirement','P8-DOC-GAP-02: destination for enduser-docs-authoring, enduser-docs-index and specs/platform-foundations; park until Step 3, owner if delete without carry','P8-DOC-GAP-03: Step 5 correct backlog GENERATED header and switchboard generated claim','Exact spec.md owner flips for work-state/runner/distribution; Step 3 values for enduser-docs/component-boundary/contracts','Retained paths flip status only; Phase 9 independently computes broken-link baseline'],'phase9LinkCheckPolicy':'Exclude verbatim carriage; distinguish relocation-created breaks, drop placeholders; census is not complete inventory','limits':'Author mechanical accounting only; independent semantic review and behavioral/native adoption proof remain open.'}
    parts=[]
    def partition(population,source,rows,idfield):
        chunk=[]
        def record(chunk):
            n=len(parts)+1
            return {'part':n,'population':population,'sourceTable':source,'entryIds':[e[idfield] for e in chunk],'idField':idfield,'entryCount':len(chunk),'resolvedRowsSha256':sha(enc(chunk)),'resolvedPayloadBytes':len(enc(chunk)),'report':f'review-a38-step-02j-map-part-{n:02}.md','mandatoryDeepReads':'All rows; inspect actual committed source/target. <=3% per set; sample breach expands all edges.'}
        for row in rows:
            proposed=chunk+[row]
            if chunk and (len(proposed)>60 or len(enc({'part':record(proposed),'resolvedRows':proposed}))>400000):parts.append(record(chunk));chunk=[]
            chunk.append(row)
            assert len(enc({'part':record(chunk),'resolvedRows':chunk}))<=400000,(population,row.get(idfield))
        if chunk:parts.append(record(chunk))
    partition('seeded-semantic-edge-sample','step-02j-census-maps-portals-prose.json',[byid[id] for id in sets['seeded-semantic-edge-sample']['rowIds']],'edgeId')
    partition('distinct-mappings','step-02j-distinct-mappings.json',mappings,'mappingId')
    for name,s in sets.items():
        if name=='seeded-semantic-edge-sample':continue
        if name=='overlay-precedence-controls':rows=controls;field='controlId';source='step-02j-review-data.json'
        elif name=='root-authority-alias-outcomes':rows=c['rootAuthorityAliasOutcomes'];field='path';source='step-02j-review-data.json'
        elif all(id in byid for id in s['rowIds']):rows=[byid[id] for id in s['rowIds']];field='edgeId';source='step-02j-census-maps-portals-prose.json'
        else:rows=[x for x in annex if x['controlId'] in s['rowIds']];field='controlId';source='step-02j-review-data.json'
        partition(name,source,rows,field)
    mappingdata={'groupKey':['normalizedReference','desiredOwner','desiredAnchor'],'entries':mappings,'counts':{'edges':len(edges),'mappings':len(mappings)}}
    pins={p.name:sha(p.read_bytes()) for p in sorted(R.glob('review-a38-step-02i-map-part-*.md'))+[R/'owner-answers.md',R/'step-02i-census-maps-portals-prose.json',R/'step-02i-review-data.json']}
    index={'inputHEAD':c['inputHEAD'],'rule':'A50/L12-26; sample FIRST, <=3% per set else edge-level review of ALL edges','parts':parts,'inputEvidencePins':pins,'counts':{'edges':len(edges),'mappings':len(mappings),'sample':len(sample),'parts':len(parts),'reviewEntries':sum(x['entryCount'] for x in parts)},'mandatoryRereviewParts':{name:[p['part'] for p in parts if p['population']==name] for name in sets if 'rereview' in name},'sampleFirstParts':[p['part'] for p in parts if p['population']=='seeded-semantic-edge-sample'],'reviewStatus':{'started':0,'accepted':0,'elapsedSeconds':0,'budget':'Lead-owned; no reviewer launched'}}
    index['counts']['maxResolvedPartBytes']=max(len(enc({'part':p,'resolvedRows':resolve(p,c,mappingdata,data)})) for p in parts)
    index['sourceTablePins']={'step-02j-census-maps-portals-prose.json':sha(enc(c)+b'\n'),'step-02j-distinct-mappings.json':sha(enc(mappingdata)+b'\n'),'step-02j-review-data.json':sha(enc(data)+b'\n')}
    return {'step-02j-distinct-mappings.json':mappingdata,'step-02j-review-data.json':data,'step-02j-mapping-review-index.json':index,'step-02j-pilot-crosswalk.json':{'baseline':'02i','joins':[{'beforeEdgeId':b['edgeId'],'afterEdgeIds':[n['edgeId'] for n in joined[b['edgeId']]]} for b in old],'removedControls':['removed-02i-'+b['edgeId'] for b in removed]}}
def resolve(part,c,m,d):
    source=part['sourceTable'];rows=c['entries'] if source.endswith('census-maps-portals-prose.json') else m['entries'] if source.endswith('distinct-mappings.json') else d['overlayControls']+d['annex']+d['rootAuthorityAliasOutcomes']
    by={x[part['idField']]:x for x in rows if part['idField'] in x};return [by[id] for id in part['entryIds']]
if __name__=='__main__':print(json.dumps(compile_packet(json.loads(Path(sys.argv[1]).read_text())),ensure_ascii=False))
