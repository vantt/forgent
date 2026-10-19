#!/usr/bin/env python3
"""Deterministic, read-only A50 packet compiler. Print all tables as one JSON object.
Input: regenerated census JSON path. No writes, no git mutations, no fgOS CLI.
"""
import sys
sys.dont_write_bytecode=True
import collections,hashlib,json,math,re,functools,importlib.util
from pathlib import Path
R=Path(__file__).resolve().parent
ROOT=R.parents[3]
def sha(b):return hashlib.sha256(b).hexdigest()
def enc(x):return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def load(n):return json.loads((R/n).read_text())
_spec=importlib.util.spec_from_file_location('tree_parser',R/'step-02g-parser.py')
tree=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(tree)
SEED='A50-step02g-L12-23-2026-10-19-v1'
def compile_packet(c):
    edges=c['entries'];byid={e['edgeId']:e for e in edges};groups=collections.defaultdict(list)
    for e in edges:groups[(e['normalizedReference'],e['desiredOwner'],e['desiredAnchor'])].append(e)
    mappings=[]
    for key,rows in sorted(groups.items(),key=lambda x:tuple(v or '' for v in x[0])):
        mappings.append({'mappingId':f'mapping-g-{len(mappings)+1:04}','legacyReference':key[0],'owner':key[1],'anchor':key[2],'edgeIds':[e['edgeId'] for e in rows],'edgeCount':len(rows),'actions':dict(collections.Counter(e['cutoverAction'] for e in rows)),'rules':dict(collections.Counter(e['rule'] for e in rows)),'roles':dict(collections.Counter(e['role'] for e in rows)),'retiringConsumerEdges':sum(e['consumerPath'].startswith(('docs/specs/','docs/architect/')) for e in rows),'effectiveRowsSha256':sha(enc(rows)),'representativeEdgeId':rows[0]['edgeId'],'semanticReview':'pending; read every distinct action/rule/role variant and target, not only representative','targetCheck':next((e['mechanicalTargetCheck'] for e in rows if e.get('mechanicalTargetCheck')),None)})
    old=load('step-02c-census-maps-portals-prose.json')['entries'];oldby={e['edgeId']:e for e in old};oldsets=load('step-02c-review-exceptions.json')['sets']
    joined=collections.defaultdict(list)
    for e in edges:
        for p in e['priorRows']:joined[p['rowId']].append(e)
    def projected(name):return {e['edgeId'] for id in oldsets[name]['rowIds'] for e in joined[id]}
    sets={}
    def add(name,ids,why):sets[name]={'rowIds':sorted(set(ids)),'count':len(set(ids)),'mandatoryDeepRead':True,'reason':why}
    for action in ['preserve-pending-target','preserve-pending-behavioral-proof','phase9-row-flip']:
        add(action,[e['edgeId'] for e in edges if e['cutoverAction']==action],'Every effective row, all deep read; no executable patch for parked rows')
    add('mechanical-target-failures',[e['edgeId'] for e in edges if e.get('mechanicalTargetCheck',{}).get('failures')],'Exact new target checks, including preserved citation successors; missing is never a pass')
    # Prior failures get individual disposition controls below, rather than silently shrinking on link merge.
    add('writers-and-writer-triage',projected('writers-and-writer-triage')|{e['edgeId'] for e in edges if e['role']=='writer/check'},'Retain old triage population plus all newly identified live writer/check rows; role downgrade requires deep read')
    add('behavioral-runtime-and-contract-triage',projected('behavioral-runtime-and-contract-triage')|{e['edgeId'] for e in edges if e['role'] in ('behavioral','generator','writer/check')},'Do not shed unresolved legacy IO triage on parser regeneration')
    add('semantic-roadmap',[e['edgeId'] for e in edges if e['rule']=='roadmap-semantic'],'Whole sentence Step 3 semantic rewrite, including carried roadmap copies; no path-only patch')
    controls=c['overlayControls'];controlby={x['controlId']:x for x in controls};effective={tuple(e['baseKey']):e for e in c['overlayEffectiveRows']}
    controlrows=[{**x,'effectiveRow':effective[tuple(x['baseKey'])]['row']} for x in controls]
    add('overlay-precedence-controls',[x['controlId'] for x in controls],'Every L12-19/20 partial/full overlay and wrapped addition; all consumers resolve final effective hash')
    annex=[]
    for e in load('step-02c-maps-anchor-check.json')['entries']:
        if e.get('failures'):
            id=e['id'];annex.append({'controlId':'prior-target-'+id,'receipt':'step-02c-maps-anchor-check.json','row':e,'regeneratedEdgeIds':[x['edgeId'] for x in joined[id]],'priorDisposition':next(x for x in c['priorReconciliation'] if x['priorRowId']==id),'status':'Every one of 104 prior target failures is individually accounted; new exact proof or preservation/parking must be reviewed'})
    add('prior-target-failure-dispositions',[e['controlId'] for e in annex],'All 104 prior failures individually deep-read after full-unit merge')
    # Earlier class failures retain receipt identity and any correction overlay.
    for e in load('step-02c-anchor-check.json')['entries']:
        if e.get('effective') and e['failures']:
            annex.append({'controlId':'anchor-'+e['id'],'receipt':'step-02c-anchor-check.json','row':e,'status':'earlier-class failure remains pending, not cleared by class-3 parser'})
    for e in load('step-02c-inventory-edges.json')['entries']:
        if e.get('identityStatus')=='unresolved-dynamic-pattern':
            annex.append({'controlId':'native-'+e['edgeId'],'receipt':'step-02c-inventory-edges.json','row':e,'status':'unresolved actual dynamic path/adoption; Step 5 trace needed'})
    add('prior-anchor-check-failures',[e['controlId'] for e in annex if e['controlId'].startswith('anchor-')],'All effective 21 earlier-class failures remain a separate mandatory set')
    add('native-dynamic-patterns',[e['controlId'] for e in annex if e['controlId'].startswith('native-')],'All nine unresolved native dynamic records; no fresh export or runtime/parity claim')
    ranked=sorted((sha((SEED+'\0'+e['edgeId']).encode()),e['edgeId']) for e in edges)
    sample=[{'edgeId':id,'sha256Rank':rank,'effectiveRowSha256':sha(enc(byid[id]))} for rank,id in ranked[:math.ceil(.15*len(edges))]]
    add('seeded-semantic-edge-sample',[e['edgeId'] for e in sample],'Portable SHA-256 ranking, ceil(15% of all regenerated edges); a breach expands semantic read to the full population')
    # Retain whole failed pilot populations even when a fix moves a row out of
    # pending-target or changes a mapping identity. These are intentional overlaps.
    previous=load('step-02e-census-maps-portals-prose.json')['entries']
    previousIndex=load('step-02e-mapping-review-index.json')
    previousMappings={m['mappingId']:m for m in load('step-02e-distinct-mappings.json')['entries']}
    rejoined=source_join(previous,edges)
    for number in (3,26):
        part=previousIndex['parts'][number-1]
        oldids=({id for mid in part['entryIds'] for id in previousMappings[mid]['edgeIds']} if number==3 else set(part['entryIds']))
        add(f'mandatory-rereview-former-pilot-{number:02}',{n['edgeId'] for id in oldids for n in rejoined[id]},'L12-22 second pilot: every source edge from the failed former pilot part, including reclassified preserved/behavioral rows; deep-read all and use mapping joins for target variants')
    former=load('step-02f-census-maps-portals-prose.json')['entries']
    formerIndex=load('step-02f-mapping-review-index.json')
    formerJoined=source_join(former,edges)
    for number in (30,47,65):
        oldids=formerIndex['parts'][number-1]['entryIds']
        add(f'mandatory-rereview-second-pilot-{number:02}',{n['edgeId'] for id in oldids for n in formerJoined[id]},'L12-23 third pilot: every edge of former failed 02f part, including rows now preserved or retyped; all mandatory')
    # Counts describe detectable defect instances, not independent semantic acceptance.
    diffs=[]
    def diff(name,before,after,meaning):
        examples=[]
        for id in before[:3]:
            b=oldby.get(id)
            examples.append({'priorRowId':id,'before':{k:b.get(k) for k in ['consumerPath','line','matchedExpression','normalizedReference','desiredOwner','cutoverAction','cutoverPatch']} if b else None,'after':[{'edgeId':e['edgeId'],'reference':e['normalizedReference'],'rule':e['rule'],'action':e['cutoverAction'],'patch':e['cutoverPatch']} for e in joined[id]][:4]})
        diffs.append({'defectClass':name,'beforeCount':len(before),'afterCount':len(after),'beforeRowIds':before,'afterRowIds':after,'measurement':meaning,'examples':examples})
    patches=[e for e in old if (e.get('cutoverPatch') or {}).get('new')]
    newpatch=[e for e in edges if e['cutoverPatch']]
    diff('partial-reference-patch',[e['edgeId'] for e in patches if joined[e['edgeId']] and all(e['cutoverPatch']['old']!=u['matchedExpression'] for u in joined[e['edgeId']])],[e['edgeId'] for e in newpatch if e['cutoverPatch']['old']!=e['matchedExpression']],'Executable patch old must equal complete parsed link/token, not prefix/suffix; includes original 444 evidence subspans')
    diff('corrupted-reference-key',[e['edgeId'] for e in old if joined[e['edgeId']] and e['normalizedReference'] not in {u['normalizedReference'] for u in joined[e['edgeId']]}],[e['edgeId'] for e in edges if '[' in e['normalizedReference'] or 'repo/docs/' in e['normalizedReference']],'Old identity disagrees with independently parsed full-unit destination; includes bracket, relative depth and repo-prefix defects; overlaps prefix/brace classes')
    linkdups=[]
    seen=set()
    for e in edges:
        if e['syntax']=='markdown-link':
            key=(e['consumerPath'],tuple((s['line'],s['columnStart'],s['columnEndExclusive']) for s in e['physicalSpans']))
            if key not in seen:
                ids=[p['rowId'] for p in e['priorRows'] if p['rowId'] in oldby]
                if len(ids)>1:linkdups.extend(ids[1:])
                seen.add(key)
    duplicates=[];seen=set()
    for e in edges:
        key=(e['consumerPath'],e['normalizedReference'],enc(e['physicalSpans']))
        if key in seen:duplicates.append(e['edgeId'])
        seen.add(key)
    diff('split-markdown-link',linkdups,duplicates,'Redundant old label/destination/prefix edges per full Markdown link; new brace expansions are distinct destinations within one physical unit')
    linecache={}
    def prefixhit(e):
        if e['matchedExpression']!='docs/architect':return False
        if e['consumerPath'] not in linecache:linecache[e['consumerPath']]=tree.read(e['consumerPath']).decode().splitlines()
        line=linecache[e['consumerPath']][e['line']-1];end=e['columnEndExclusive']-1
        return end<len(line) and (line[end].isalnum() or line[end] in '_-')
    diff('evidence-prefix-or-suffix-patch',[e['edgeId'] for e in patches if e['pattern']=='evidence'],[e['edgeId'] for e in newpatch if e['cutoverPatch']['old']!=e['matchedExpression']],'The exact 444 evidence subspan executable patches identified by review; replaced by complete units or preserved/parked')
    diff('prefix-inside-longer-token',[e['edgeId'] for e in old if prefixhit(e)],[e['edgeId'] for e in edges if e['matchedExpression']=='docs/architect' and e['normalizedReference'].startswith('docs/architecture')],'Whole-token boundary: docs/architect inside architecture-map/manifest tokens')
    excludedold=[e['priorRowId'] for e in c['priorReconciliation'] if not e['edgeIds']]
    code=[id for id in excludedold if '/' not in oldby[id]['matchedExpression']]
    diff('code-token-as-path',code,[e['edgeId'] for e in edges if e['normalizedReference'] in ('docs/specs/a','docs/ui-spec/generated/e','docs/ui-spec/generated/n','docs/ui-spec/generated/t')],'JS operands/regex/minified tokens excluded, while actual literal documentation strings remain provenance or generated-source rows')
    diff('unexpanded-brace-list',[e['edgeId'] for e in old if '{' in e['normalizedReference'] and any(len(u['references'])>1 for u in joined[e['edgeId']])],[e['edgeId'] for e in edges if '{' in e['normalizedReference'] and any(len(u['references'])>1 for u in joined[e['edgeId']])],'Each brace member gets a resolved identity; shared whole-reference patch stays parked until exact list rewrite')
    def rulebad(name,rules,predicate,afterpredicate=None):
        before=[e['edgeId'] for e in old if any(u['rule'] in rules for u in joined[e['edgeId']]) and predicate(e)]
        after=[e['edgeId'] for e in edges if e['rule'] in rules and (afterpredicate or predicate)(e)]
        diff(name,before,after,'Before rows classified by regenerated contextual rule; all old IDs and before/after examples retained. Contextual rules require independent review.')
    haspatch=lambda e:bool((e.get('cutoverPatch') or {}).get('new'))
    rulebad('provenance-rewritten',{'provenance'},haspatch)
    rulebad('migration-cell-path-substitution',{'migration-state'},lambda e:e['cutoverAction']!='phase9-row-flip')
    rulebad('generated-hand-patch',{'generated'},haspatch)
    rulebad('operative-read-to-area-portal',{'operative-read'},lambda e:bool(e.get('desiredOwner') and e['desiredOwner'].endswith('/README.md') and not e['normalizedReference'].split('#')[0].endswith('/README.md')))
    diff('self-link-patch',[e['edgeId'] for e in patches if e.get('desiredOwner')==e['consumerPath']],[e['edgeId'] for e in newpatch if e['desiredOwner']==e['consumerPath']],'Executable patch points into its own consumer')
    rulebad('verbatim-carriage-patch',{'verbatim-carriage'},haspatch)
    rulebad('authoritative-for-key-rewrite',{'authoritative_for'},haspatch)
    rulebad('reading-map-wrong-owner',{'navigation','operative-read'},lambda e:e['normalizedReference']=='docs/specs/reading-map.md' and e.get('desiredOwner')!='docs/reading-map.md')
    diff('evidence-wrong-mirror',[e['edgeId'] for e in old if any(u['normalizedReference'].startswith('docs/architect/agent-coordination/verification/') and u['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state','template-placeholder','template') for u in joined[e['edgeId']]) and e.get('desiredOwner')!=e['normalizedReference'].split('#')[0].replace('docs/architect/agent-coordination/verification/','docs/platform/agent-coordination/verification/',1)],[e['edgeId'] for e in edges if e['normalizedReference'].startswith('docs/architect/agent-coordination/verification/') and e['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state','template-placeholder','template') and e['desiredOwner']!=e['normalizedReference'].split('#')[0].replace('docs/architect/agent-coordination/verification/','docs/platform/agent-coordination/verification/',1)],'Only operative/navigation evidence references, excluding historical/provenance cells; every file/directory/template prefix follows the same-path mirror')
    rulebad('live-writer-treated-as-navigation',{'live-evidence-writer','writer-L12-19'},lambda e:e['cutoverAction']!='preserve-pending-behavioral-proof')
    rulebad('checker-scope-treated-as-navigation',{'checker-scope'},lambda e:e['cutoverAction']!='preserve-pending-behavioral-proof')
    rulebad('external-citation-with-fgos-owner',{'external-project'},lambda e:bool(e.get('desiredOwner')) or haspatch(e))
    rulebad('ui-compiler-self-reference-rewritten',{'ui-spec-self-reference'},haspatch)
    rulebad('roadmap-without-semantic-disposition',{'roadmap-semantic'},lambda e:e.get('desiredOwner')!='docs/platform/packaging-distribution/README.md' or e['cutoverAction']!='preserve-pending-target')
    rulebad('template-placeholder-rewritten',{'template'},haspatch)
    second=second_round_diff(c)
    for name,s in sets.items():
        s['retiringConsumerEdges']=sum(byid[id]['consumerPath'].startswith(('docs/specs/','docs/architect/')) for id in s['rowIds'] if id in byid)
    reviewdata={'seed':SEED,'sampleCount':len(sample),'sample':sample,'sets':sets,'overlayControls':controlrows,'annex':annex,'defectDiff':diffs,'systemicDiffVs02e':systemic_previous_diff(c),'systemicDiffVs02f':systemic_previous_diff(c,'02f'),'secondRoundDefectDiff':second,'thirdRoundDefectDiff':third_round_diff(c),'phase9LinkCheckPolicy':{'exclude':'verbatim carriage regions only, preserved without alias','evidence':'L12-22; review-a38-step-02e-map-part-60.md: 21 already-broken links','implementation':'Phase 9 obligation; no checker, vocabulary, alias or consumer change here'},'limits':'Detection counts overlap; zero detectable systemic defects is an author regression result, not semantic approval, behavioral census completion or authority cutover.'}
    parts=[]
    def partition(population,source,rows,idfield):
        chunk=[]
        def part(chunk):
            n=len(parts)+1
            return {'part':n,'population':population,'sourceTable':source,'entryIds':[e[idfield] for e in chunk],'idField':idfield,'entryCount':len(chunk),'resolvedRowsSha256':sha(enc(chunk)),'resolvedPayloadBytes':len(enc(chunk)),'report':f'review-a38-step-02g-map-part-{n:02}.md','mandatoryDeepReads':'All listed mappings/exceptions/sample rows; read actual source and target, all role/action variants. >=10 reads or all when fewer. >3% rework expands affected set; sample breach expands all edges.','retiringConsumerEdges':sum(e.get('consumerPath','').startswith(('docs/specs/','docs/architect/')) for e in chunk)}
        for row in rows:
            candidate=chunk+[row]
            if chunk and (len(candidate)>60 or len(enc({'part':part(candidate),'resolvedRows':candidate}))>400000):
                parts.append(part(chunk));chunk=[]
            chunk.append(row)
            assert len(enc({'part':part(chunk),'resolvedRows':chunk}))<=400000,(population,row.get(idfield))
        if chunk:parts.append(part(chunk))
    partition('distinct-mappings','step-02g-distinct-mappings.json',mappings,'mappingId')
    second=second_round_diff(c)
    for name,s in sets.items():
        if name=='overlay-precedence-controls':rows=controlrows;source='step-02g-review-data.json';field='controlId'
        elif name in ('prior-anchor-check-failures','native-dynamic-patterns','prior-target-failure-dispositions'):rows=[e for e in annex if e['controlId'] in s['rowIds']];source='step-02g-review-data.json';field='controlId'
        else:rows=[byid[id] for id in s['rowIds']];source='step-02g-census-maps-portals-prose.json';field='edgeId'
        partition(name,source,rows,field)
    pins={p.name:sha(p.read_bytes()) for p in [R/'owner-answers.md',R/'step-02c-census-maps-portals-prose.json',R/'step-02c-distinct-mappings.json',R/'step-02c-review-exceptions.json',R/'review-a38-step-02c-map-replay.md',R/'step-02e-census-maps-portals-prose.json',R/'review-a38-step-02e-map-replay.md']+[R/f'review-a38-step-02e-map-part-{i:02}.md' for i in (3,13,26,38,45,60)]+[R/f'review-a38-step-02c-map-part-{i:02}.md' for i in range(1,36)]}
    pins.update({p.name:sha(p.read_bytes()) for p in [R/'step-02f-census-maps-portals-prose.json',R/'step-02f-mapping-review-index.json',R/'review-a38-step-02f-map-replay.md']+[R/f'review-a38-step-02f-map-part-{i:02}.md' for i in (5,30,47,65,95,96,97,98)]})
    index={'rule':'A50 / L12-21 / L12-22 / L12-23; one request, embedded logical parts, no per-part payload files','mechanicalReviewer':'Lead starts one fresh-context independent reviewer to run step-02g-replay.py over all units/files, every old edge disposition, all overlays and every downstream consumer','parts':parts,'inputEvidencePins':pins,'counts':{'edges':len(edges),'mappings':len(mappings),'sample':len(sample),'parts':len(parts),'reviewEntries':sum(p['entryCount'] for p in parts),'maxResolvedPartBytes':max(len(enc({'part':p,'resolvedRows':resolve(p,c,{'entries':mappings},reviewdata)})) for p in parts)},'reviewStatus':{'started':0,'accepted':0,'elapsedSeconds':0,'budget':'Lead must size from measured regenerated volume'}}
    index['mandatoryRereviewParts']={name:[p['part'] for p in parts if p['population']==name] for name in sets if name.startswith('mandatory-rereview-')}
    index['sourceTablePins']={'step-02g-census-maps-portals-prose.json':sha(enc(c)+b'\n'),'step-02g-distinct-mappings.json':sha(enc({'groupKey':['normalizedReference','desiredOwner','desiredAnchor'],'entries':mappings,'counts':{'edges':len(edges),'mappings':len(mappings)}})+b'\n'),'step-02g-review-data.json':sha(enc(reviewdata)+b'\n')}
    crosswalk=[]
    for tag,numbers in [('02e',(3,26)),('02f',(30,47,65))]:
        oldc=load(f'step-{tag}-census-maps-portals-prose.json')['entries']
        oldi=load(f'step-{tag}-mapping-review-index.json')
        oldm={m['mappingId']:m for m in load(f'step-{tag}-distinct-mappings.json')['entries']}
        joins=source_join(oldc,edges)
        for number in numbers:
            part=oldi['parts'][number-1]
            ids=sorted({id for mid in part['entryIds'] for id in oldm[mid]['edgeIds']} if part['idField']=='mappingId' else set(part['entryIds']))
            name=f'mandatory-rereview-{"former-pilot" if tag=="02e" else "second-pilot"}-{number:02}'
            members={n['edgeId'] for id in ids for n in joins[id]}
            assert members==set(sets[name]['rowIds']) and all(joins[id] for id in ids)
            crosswalk.append({'baseline':tag,'formerPart':number,'sourceEdgeCount':len(ids),'currentEdgeCount':len(members),'mandatoryParts':index['mandatoryRereviewParts'][name],'joins':[{'beforeEdgeId':id,'afterEdgeIds':[n['edgeId'] for n in joins[id]],'normalMappingParts':sorted({p['part'] for p in parts if p['idField']=='mappingId' and any(set(m['edgeIds'])&{n['edgeId'] for n in joins[id]} for m in mappings if m['mappingId'] in p['entryIds'])})} for id in ids]})
    return {'step-02g-pilot-crosswalk.json':{'populations':crosswalk,'status':'All original source edges have joins and mandatory part membership; semantic acceptance pending'},'step-02g-distinct-mappings.json':{'groupKey':['normalizedReference','desiredOwner','desiredAnchor'],'entries':mappings,'counts':{'edges':len(edges),'mappings':len(mappings)}},'step-02g-review-data.json':reviewdata,'step-02g-mapping-review-index.json':index}
def source_join(before,after):
    by=collections.defaultdict(list)
    for e in after:
        for line in {z['line'] for z in e['physicalSpans']}:by[(e['consumerPath'],line)].append(e)
    return {e['edgeId']:[n for n in by[(e['consumerPath'],e['line'])] if any(s['line']==e['line'] and s['columnStart']<e['columnEndExclusive'] and s['columnEndExclusive']>e['columnStart'] for s in n['physicalSpans'])] for e in before}

def systemic_previous_diff(c,tag='02e'):
    old=load('step-'+tag+'-census-maps-portals-prose.json')['entries'];joined=source_join(old,c['entries'])
    patch=lambda b:bool((b.get('cutoverPatch') or {}).get('new'))
    rule=lambda ns,types:any(n['rule'] in types for n in ns)
    def evidencebad(b,ns):
        return any(n['normalizedReference'].startswith('docs/architect/agent-coordination/verification/') and n['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state','template-placeholder','template') and (b.get('desiredOwner') or '').rstrip('/')!=n['normalizedReference'].split('#')[0].replace('docs/architect/','docs/platform/',1).rstrip('/') for n in ns)
    checks=[
      ('partial-reference-patch',lambda b,ns:patch(b) and bool(ns) and all(b['cutoverPatch']['old']!=n['matchedExpression'] for n in ns)),
      ('corrupted-reference-key',lambda b,ns:not ns and b['normalizedReference'].startswith('docs/architect/') and b['matchedExpression'].startswith(('./','../'))),
      ('split-markdown-link',lambda b,ns:any(n['syntax']=='markdown-link' and b['matchedExpression']!=n['matchedExpression'] for n in ns)),
      ('evidence-prefix-or-suffix-patch',lambda b,ns:patch(b) and '/verification/' in b['normalizedReference'] and bool(ns) and all(b['cutoverPatch']['old']!=n['matchedExpression'] for n in ns)),
      ('prefix-inside-longer-token',lambda b,ns:b['matchedExpression']=='docs/architect' and any(n['normalizedReference'].startswith('docs/architecture') for n in ns)),
      ('code-token-as-path',lambda b,ns:not ns),
      ('unexpanded-brace-list',lambda b,ns:'{' in b['normalizedReference'] and any(len(n['references'])>1 for n in ns)),
      ('provenance-rewritten',lambda b,ns:rule(ns,{'provenance'}) and patch(b)),
      ('migration-cell-path-substitution',lambda b,ns:rule(ns,{'migration-state'}) and b['cutoverAction']!='phase9-row-flip'),
      ('generated-hand-patch',lambda b,ns:rule(ns,{'generated'}) and patch(b)),
      ('operative-read-to-area-portal',lambda b,ns:rule(ns,{'operative-read'}) and bool(b.get('desiredOwner')) and b['desiredOwner'].endswith('/README.md') and not b['normalizedReference'].split('#')[0].endswith('/README.md')),
      ('self-link-patch',lambda b,ns:patch(b) and b['desiredOwner']==b['consumerPath']),
      ('verbatim-carriage-patch',lambda b,ns:rule(ns,{'verbatim-carriage'}) and patch(b)),
      ('authoritative-for-key-rewrite',lambda b,ns:rule(ns,{'authoritative_for'}) and patch(b)),
      ('reading-map-wrong-owner',lambda b,ns:b['normalizedReference']=='docs/specs/reading-map.md' and rule(ns,{'navigation','operative-read'}) and b['desiredOwner']!='docs/reading-map.md'),
      ('evidence-wrong-mirror',evidencebad),
      ('live-writer-treated-as-navigation',lambda b,ns:rule(ns,{'live-evidence-writer','writer-L12-19'}) and b['cutoverAction']!='preserve-pending-behavioral-proof'),
      ('checker-scope-treated-as-navigation',lambda b,ns:rule(ns,{'checker-scope'}) and b['cutoverAction']!='preserve-pending-behavioral-proof'),
      ('external-citation-with-fgos-owner',lambda b,ns:rule(ns,{'external-project'}) and (bool(b['desiredOwner']) or patch(b))),
      ('ui-compiler-self-reference-rewritten',lambda b,ns:rule(ns,{'ui-spec-self-reference'}) and patch(b)),
      ('roadmap-without-semantic-disposition',lambda b,ns:rule(ns,{'roadmap-semantic'}) and (b['desiredOwner']!='docs/platform/packaging-distribution/README.md' or b['cutoverAction']!='preserve-pending-target')),
      ('template-placeholder-rewritten',lambda b,ns:rule(ns,{'template','template-placeholder'}) and patch(b)),
    ]
    out=[]
    for name,predicate in checks:
        before=[b for b in old if predicate(b,joined[b['edgeId']])]
        after=[n for n in c['entries'] if predicate(n,[n])]
        out.append({'defectClass':name,'baseline':tag,'beforeCount':len(before),'afterCount':len(after),'beforeRowIds':[b['edgeId'] for b in before],'afterRowIds':[n['edgeId'] for n in after],'measurement':'Explicit complete-source-span join and predicates; slash-only identity differences measured separately','examples':[{'beforeRowId':b['edgeId'],'afterRowIds':[n['edgeId'] for n in joined[b['edgeId']]]} for b in before[:3]]})
    return out

def second_round_diff(c):
    """Same explicit predicates against BOTH immutable baselines; counts overlap.
    Expected populations come from new contextual rules, never from alleged old IDs.
    Raw before/after witnesses remain available for independent semantic review.
    """
    rows=c['entries'];out=[]
    haspatch=lambda e:bool((e.get('cutoverPatch') or {}).get('new'))
    def pathpart(e,new=False):
        raw=(e.get('cutoverPatch') or {}).get('new' if new else 'old','')
        m=re.search(r'\]\(([^)]+)\)$',raw)
        return (m[1] if m else raw).split('#')[0]
    def slashbad(e):return haspatch(e) and pathpart(e).endswith('/') and not pathpart(e,True).endswith('/')
    @functools.lru_cache(None)
    def mirror_path(b):
        return b.startswith('docs/architect/agent-coordination/') and tree.is_dir(b) and tree.is_dir(b.replace('docs/architect/','docs/platform/',1))
    def mirrored(e):
        return mirror_path(e['normalizedReference'].split('#')[0]) and e['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state','self-reference-preserved')
    classes=[
      ('block-context-writer',lambda n:n['role']=='writer/check',lambda b,n:b['cutoverAction']!='preserve-pending-behavioral-proof' or ('role' in b and b['role']!='writer/check')),
      ('migration-before-inherited-provenance',lambda n:n['rule']=='migration-state',lambda b,n:b['cutoverAction']!='phase9-row-flip'),
      ('directory-trailing-slash',lambda n:True,lambda b,n:slashbad(b)),
      ('whole-template-placeholder',lambda n:bool(re.search(r'<[^>]+>|\.\.\.',n['normalizedReference'])),lambda b,n:haspatch(b)),
      ('same-path-directory-mirror',mirrored,lambda b,n:(b.get('desiredOwner') or '').rstrip('/')!=n['normalizedReference'].split('#')[0].replace('docs/architect/','docs/platform/',1).rstrip('/')),
      ('retained-docs-history',lambda n:n['rule']=='retained-history',lambda b,n:b['cutoverAction']!='preserve' or haspatch(b)),
      ('deleted-target-successor-note',lambda n:n['rule']=='deleted-historical-target' and bool(n.get('successorNote',{}).get('successor')),lambda b,n:not b.get('successorNote',{}).get('successor') or haspatch(b)),
      ('migration-plan-source-locator',lambda n:n['rule']=='provenance' and n['consumerPath'].endswith('/documentation-standardization-plan.md'),lambda b,n:haspatch(b)),
      ('retired-handoff-checkpoint-write',lambda n:n['rule']=='retired-checkpoint-write',lambda b,n:b['cutoverAction']!='preserve' or haspatch(b)),
      ('observe-exact-spec',lambda n:n['normalizedReference']=='docs/specs/observe.md',lambda b,n:b.get('desiredOwner')!='docs/platform/observe/spec.md'),
      ('carriage-without-alias-and-link-check-exclusion',lambda n:bool(n.get('carriagePolicy')) and not n['aliasLookup']['candidateIds'],lambda b,n:b['cutoverAction']!='preserve' or not b.get('carriagePolicy',{}).get('preserveWithoutAlias') or 'exclude' not in b.get('carriagePolicy',{}).get('phase9LinkCheck','')),
    ]
    for tag in ('02c','02e','02f'):
        baseline=load('step-'+tag+'-census-maps-portals-prose.json')['entries'];joined=source_join(baseline,rows)
        for name,pop,bad in classes:
            oldbad=[b for b in baseline if any(pop(n) and bad(b,n) for n in joined[b['edgeId']])]
            newbad=[n for n in rows if pop(n) and bad(n,n)]
            out.append({'defectClass':name,'baseline':tag,'beforeCount':len(oldbad),'afterCount':len(newbad),'beforeRowIds':[e['edgeId'] for e in oldbad],'afterRowIds':[e['edgeId'] for e in newbad],'measurement':'Explicit predicate on source-span joined expected population; contextual populations require independent review','examples':[{'before':{k:b.get(k) for k in ('edgeId','consumerPath','line','matchedExpression','normalizedReference','rule','cutoverAction','desiredOwner','cutoverPatch','successorNote')},'after':[{k:n.get(k) for k in ('edgeId','normalizedReference','rule','cutoverAction','desiredOwner','cutoverPatch','successorNote','carriagePolicy')} for n in joined[b['edgeId']]]} for b in oldbad[:3]]})
        code=[]
        for b in baseline:
            if any(x['consumerPath']==b['consumerPath'] and 'Code import/require/node -e' in x['reason'] and any(s['line']==b['line'] and s['columnStart']<b['columnEndExclusive'] and s['columnEndExclusive']>b['columnStart'] for s in x['physicalSpans']) for x in c['excludedCodeUnits']):code.append(b['edgeId'])
        out.append({'defectClass':'code-snippet-relative-specifier','baseline':tag,'beforeCount':len(code),'afterCount':0,'beforeRowIds':code,'afterRowIds':[],'measurement':'Excluded source-pinned import/require/node -e specifiers overlap old scanner spans; independently tested by parser probes'})
    return out

def third_round_diff(c):
    before=load('step-02f-census-maps-portals-prose.json')['entries'];after=c['entries'];joined=source_join(before,after)
    patch=lambda e:bool(e.get('cutoverPatch'))
    hasnote=lambda e:bool(e.get('successorNote',{}).get('successor'))
    rules=lambda e,rs:e['rule'] in rs
    classes=[
      ('committed-tree-target-existence',lambda n:True,lambda b,n:patch(b) and not tree.exists(b['desiredOwner'])),
      ('image-link-marker',lambda n:n['matchedExpression'].startswith('!['),lambda b,n:patch(b) and not b['cutoverPatch']['new'].startswith('![')),
      ('path-label-backticks',lambda n:n.get('pathTextLabel') and n.get('label','').startswith('`'),lambda b,n:patch(b) and not re.match(r'!?\[`',b['cutoverPatch']['new'])),
      ('inherited-carriage-live-body',lambda n:n['rule'] in ('navigation','operative-read') and n['cutoverAction']=='cutover-patch-only',lambda b,n:b['rule']=='verbatim-carriage'),
      ('explicit-carriage-region',lambda n:bool(n.get('carriagePolicy')),lambda b,n:b['cutoverAction']!='preserve' or patch(b)),
      ('operative-read-whole-phrase',lambda n:n['rule']=='navigation',lambda b,n:b['rule']=='operative-read'),
      ('table-final-row-source-locator',lambda n:n['rule']=='provenance' and n['consumerPath'].endswith('/source-preservation-audit.md'),lambda b,n:patch(b)),
      ('same-path-general-directory-mirror',lambda n:n['normalizedReference'].startswith('docs/architect/') and tree.is_dir(n['normalizedReference'].split('#')[0]) and tree.is_dir(n['normalizedReference'].split('#')[0].replace('docs/architect/','docs/platform/',1)) and n['rule'] in ('navigation','operative-read'),lambda b,n:b['desiredOwner']!=n['desiredOwner']),
      ('retained-root-file',lambda n:n['rule']=='retained-reference' and n['normalizedReference'].split('#')[0] in ('docs/backlog.md','docs/reading-map.md','docs/doc-registry.md'),lambda b,n:b['cutoverAction']!='preserve' or patch(b)),
      ('migration-source-column',lambda n:n['rule']=='provenance' and n['consumerPath'].endswith('/documentation-standardization-plan.md'),lambda b,n:b['cutoverAction']!='preserve' or patch(b)),
      ('already-moved-successor-note',lambda n:hasnote(n) and n['normalizedReference'].startswith(('docs/how-to/','docs/explanation/','docs/decisions/')),lambda b,n:not hasnote(b)),
      ('migration-target-doc-row-flip',lambda n:n['rule']=='migration-state' and n['consumerPath']=='docs/platform/README.md',lambda b,n:b['cutoverAction']!='phase9-row-flip'),
      ('read-first-column-exact-spec',lambda n:n['rule']=='operative-read' and n['consumerPath'].endswith('/routing-handoff.md'),lambda b,n:b['desiredOwner']!=n['desiredOwner']),
    ]
    out=[]
    for name,pop,bad in classes:
        bs=[b for b in before if any(pop(n) and bad(b,n) for n in joined[b['edgeId']])]
        ns=[n for n in after if pop(n) and bad(n,n)]
        out.append({'defectClass':name,'baseline':'02f','beforeCount':len(bs),'afterCount':len(ns),'beforeRowIds':[b['edgeId'] for b in bs],'afterRowIds':[n['edgeId'] for n in ns],'measurement':'Source-span joined expected population; input commit tree for existence; contextual outcomes independently reviewed under A50','examples':[{'before':{k:b.get(k) for k in ('edgeId','consumerPath','line','rule','cutoverAction','desiredOwner','cutoverPatch','successorNote')},'after':[{k:n.get(k) for k in ('edgeId','rule','cutoverAction','desiredOwner','cutoverPatch','successorNote')} for n in joined[b['edgeId']]]} for b in bs[:3]]})
    return out

def resolve(part,c,m,d):
    source=part['sourceTable']
    rows=c['entries'] if source.endswith('census-maps-portals-prose.json') else m['entries'] if source.endswith('distinct-mappings.json') else d['overlayControls']+d['annex']
    byid={x[part['idField']]:x for x in rows};return [byid[id] for id in part['entryIds']]
if __name__=='__main__':print(json.dumps(compile_packet(json.loads(Path(sys.argv[1]).read_text())),ensure_ascii=False))
