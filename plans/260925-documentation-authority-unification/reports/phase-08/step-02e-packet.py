#!/usr/bin/env python3
"""Deterministic, read-only A50 packet compiler. Print all tables as one JSON object.
Input: regenerated census JSON path. No writes, no git mutations, no fgOS CLI.
"""
import sys
sys.dont_write_bytecode=True
import collections,hashlib,json,math,re
from pathlib import Path
R=Path(__file__).resolve().parent
ROOT=R.parents[3]
def sha(b):return hashlib.sha256(b).hexdigest()
def enc(x):return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def load(n):return json.loads((R/n).read_text())
SEED='A50-step02e-L12-21-2026-10-19-v1'
def compile_packet(c):
    edges=c['entries'];byid={e['edgeId']:e for e in edges};groups=collections.defaultdict(list)
    for e in edges:groups[(e['normalizedReference'],e['desiredOwner'],e['desiredAnchor'])].append(e)
    mappings=[]
    for key,rows in sorted(groups.items(),key=lambda x:tuple(v or '' for v in x[0])):
        mappings.append({'mappingId':f'mapping-e-{len(mappings)+1:04}','legacyReference':key[0],'owner':key[1],'anchor':key[2],'edgeIds':[e['edgeId'] for e in rows],'edgeCount':len(rows),'actions':dict(collections.Counter(e['cutoverAction'] for e in rows)),'rules':dict(collections.Counter(e['rule'] for e in rows)),'roles':dict(collections.Counter(e['role'] for e in rows)),'retiringConsumerEdges':sum(e['consumerPath'].startswith(('docs/specs/','docs/architect/')) for e in rows),'effectiveRowsSha256':sha(enc(rows)),'representativeEdgeId':rows[0]['edgeId'],'semanticReview':'pending; read every distinct action/rule/role variant and target, not only representative','targetCheck':next((e['mechanicalTargetCheck'] for e in rows if e.get('mechanicalTargetCheck')),None)})
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
        if e['consumerPath'] not in linecache:linecache[e['consumerPath']]=(ROOT/e['consumerPath']).read_text().splitlines()
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
    diff('evidence-wrong-mirror',[e['edgeId'] for e in old if any(u['normalizedReference'].startswith('docs/architect/agent-coordination/verification/') and u['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state') for u in joined[e['edgeId']]) and e.get('desiredOwner')!=e['normalizedReference'].split('#')[0].replace('docs/architect/agent-coordination/verification/','docs/platform/agent-coordination/verification/',1)],[e['edgeId'] for e in edges if e['normalizedReference'].startswith('docs/architect/agent-coordination/verification/') and e['rule'] not in ('provenance','verbatim-carriage','external-project','migration-state') and e['desiredOwner']!=e['normalizedReference'].split('#')[0].replace('docs/architect/agent-coordination/verification/','docs/platform/agent-coordination/verification/',1)],'Only operative/navigation evidence references, excluding historical/provenance cells; every file/directory/template prefix follows the same-path mirror')
    rulebad('live-writer-treated-as-navigation',{'live-evidence-writer','writer-L12-19'},lambda e:e['cutoverAction']!='preserve-pending-behavioral-proof')
    rulebad('checker-scope-treated-as-navigation',{'checker-scope'},lambda e:e['cutoverAction']!='preserve-pending-behavioral-proof')
    rulebad('external-citation-with-fgos-owner',{'external-project'},lambda e:bool(e.get('desiredOwner')) or haspatch(e))
    rulebad('ui-compiler-self-reference-rewritten',{'ui-spec-self-reference'},haspatch)
    rulebad('roadmap-without-semantic-disposition',{'roadmap-semantic'},lambda e:e.get('desiredOwner')!='docs/platform/packaging-distribution/README.md' or e['cutoverAction']!='preserve-pending-target')
    rulebad('template-placeholder-rewritten',{'template'},haspatch)
    for name,s in sets.items():
        s['retiringConsumerEdges']=sum(byid[id]['consumerPath'].startswith(('docs/specs/','docs/architect/')) for id in s['rowIds'] if id in byid)
    reviewdata={'seed':SEED,'sampleCount':len(sample),'sample':sample,'sets':sets,'overlayControls':controlrows,'annex':annex,'defectDiff':diffs,'limits':'Detection counts overlap; zero detectable systemic defects is an author regression result, not semantic approval, behavioral census completion or authority cutover.'}
    parts=[]
    def partition(population,source,rows,idfield):
        chunk=[]
        def part(chunk):
            n=len(parts)+1
            return {'part':n,'population':population,'sourceTable':source,'entryIds':[e[idfield] for e in chunk],'idField':idfield,'entryCount':len(chunk),'resolvedRowsSha256':sha(enc(chunk)),'resolvedPayloadBytes':len(enc(chunk)),'report':f'review-a38-step-02e-map-part-{n:02}.md','mandatoryDeepReads':'All listed mappings/exceptions/sample rows; read actual source and target, all role/action variants. >=10 reads or all when fewer. >3% rework expands affected set; sample breach expands all edges.','retiringConsumerEdges':sum(e.get('consumerPath','').startswith(('docs/specs/','docs/architect/')) for e in chunk)}
        for row in rows:
            candidate=chunk+[row]
            if chunk and (len(candidate)>60 or len(enc({'part':part(candidate),'resolvedRows':candidate}))>400000):
                parts.append(part(chunk));chunk=[]
            chunk.append(row)
            assert len(enc({'part':part(chunk),'resolvedRows':chunk}))<=400000,(population,row.get(idfield))
        if chunk:parts.append(part(chunk))
    partition('distinct-mappings','step-02e-distinct-mappings.json',mappings,'mappingId')
    for name,s in sets.items():
        if name=='overlay-precedence-controls':rows=controlrows;source='step-02e-review-data.json';field='controlId'
        elif name in ('prior-anchor-check-failures','native-dynamic-patterns','prior-target-failure-dispositions'):rows=[e for e in annex if e['controlId'] in s['rowIds']];source='step-02e-review-data.json';field='controlId'
        else:rows=[byid[id] for id in s['rowIds']];source='step-02e-census-maps-portals-prose.json';field='edgeId'
        partition(name,source,rows,field)
    pins={p.name:sha(p.read_bytes()) for p in [R/'owner-answers.md',R/'step-02c-census-maps-portals-prose.json',R/'step-02c-distinct-mappings.json',R/'step-02c-review-exceptions.json',R/'review-a38-step-02c-map-replay.md']+[R/f'review-a38-step-02c-map-part-{i:02}.md' for i in range(1,36)]}
    index={'rule':'A50 / L12-21; one request, embedded logical parts, no per-part payload files','mechanicalReviewer':'Lead starts one fresh-context independent reviewer to run step-02e-replay.py over all units/files, every old edge disposition, all overlays and every downstream consumer','parts':parts,'inputEvidencePins':pins,'counts':{'edges':len(edges),'mappings':len(mappings),'sample':len(sample),'parts':len(parts),'reviewEntries':sum(p['entryCount'] for p in parts),'maxResolvedPartBytes':max(len(enc({'part':p,'resolvedRows':resolve(p,c,{'entries':mappings},reviewdata)})) for p in parts)},'reviewStatus':{'started':0,'accepted':0,'elapsedSeconds':0,'budget':'Lead must size from measured regenerated volume'}}
    index['sourceTablePins']={'step-02e-census-maps-portals-prose.json':sha(enc(c)+b'\n'),'step-02e-distinct-mappings.json':sha(enc({'groupKey':['normalizedReference','desiredOwner','desiredAnchor'],'entries':mappings,'counts':{'edges':len(edges),'mappings':len(mappings)}})+b'\n'),'step-02e-review-data.json':sha(enc(reviewdata)+b'\n')}
    return {'step-02e-distinct-mappings.json':{'groupKey':['normalizedReference','desiredOwner','desiredAnchor'],'entries':mappings,'counts':{'edges':len(edges),'mappings':len(mappings)}},'step-02e-review-data.json':reviewdata,'step-02e-mapping-review-index.json':index}
def resolve(part,c,m,d):
    source=part['sourceTable']
    rows=c['entries'] if source.endswith('census-maps-portals-prose.json') else m['entries'] if source.endswith('distinct-mappings.json') else d['overlayControls']+d['annex']
    byid={x[part['idField']]:x for x in rows};return [byid[id] for id in part['entryIds']]
if __name__=='__main__':print(json.dumps(compile_packet(json.loads(Path(sys.argv[1]).read_text())),ensure_ascii=False))
