#!/usr/bin/env python3
"""L12-51 named record repairs, never edits a consumer or historical request."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,re
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-03-wave5f-common.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m;a=q.a;w=q.w;PIN=q.PIN

def probe():
 file='docs/platform/agent-coordination/spec.md';target='docs/platform/runner/spec.md'
 cases=[{'name':'same-file-root-label-relative-destination','old':'[docs/specs/runner.md](../../specs/runner.md)','expected':'[docs/platform/runner/spec.md](../runner/spec.md)'},{'name':'different-file-root-label-not-rewritten','old':'[docs/specs/work-state.md](../../specs/runner.md)','expected':'[docs/specs/work-state.md](../runner/spec.md)'}]
 for x in cases:x['actual']=m.form(x['old'],file,target,None);assert x['actual']==x['expected']
 # Real regression: the first fixture fails under the exact pre-extension implementation.
 before=m.git('show','HEAD:'+str(m.REL/'step-03-check.py')).decode();ns={'re':re,'posixpath':__import__('posixpath')};exec(before[before.index('def form('):before.index('@functools.lru_cache(None)',before.index('def form('))],ns)
 assert ns['form'](cases[0]['old'],file,target,None)!=cases[0]['expected']
 q.save('step-03-wave5f-form-probes.json',{'rule':'L12-51(5)','positive':cases[0],'negative':cases[1],'oldImplementationFailsPositive':True,'passed':2})

def main():
 probe();changes=[];source_count=0
 for b in [f'{i:03}' for i in range(1,105)]+[f'{i:03}' for i in range(123,131)]:
  p=P/'step-03-records'/f'batch-{b}.jsonl'
  if not p.exists():continue
  rs=q.load(b);original=copy.deepcopy(rs)
  for r in rs:
   body=m.blob(PIN,r['file']).decode();lines=body.splitlines();dirty=False
   for e in r['edges']:
    if e.get('retiresWithTree'):continue
    key=e['edgeId'];path=q.path_for(e);before=copy.deepcopy(e)
    if key=='maps-j-04994':
     target=e['target'];q.clean(r,e);h=next(h for h in m.heading_sections(PIN,target) if h['anchor']=='d7-gateway-is-the-one-internal-chokepoint-that-ever-spawns-a-verb')
     a.anchored_patch(r,e,path,body,target,h['anchor'],nums=[h['startLine']+n for n in (0,2,3,4)],assessment='L12-51: source explicitly cites D7, gateway CLI chokepoint. The exact D7 section requires all reads/writes to go through the CLI and forbids direct state imports, matching the PATCH route reuse of edit refusal; no D10/D9 API/MCP claim is attributed here.')
    if key=='maps-j-04982':
     q.clean(r,e);target='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md';tl=m.blob(PIN,target).decode().splitlines();nums=[i for i,l in enumerate(tl,1) if re.match(r'- \*\*RUL(?:34|37) ',l)]
     assert len(nums)==2,nums
     h=next(h for h in reversed(m.heading_sections(PIN,target)) if all(h['startLine']<=n<=h['sectionEndLine'] for n in nums))
     a.anchored_patch(r,e,path,body,target,h['anchor'],nums=nums,locators=['RUL34','RUL37'],assessment='L12-51(2): this citation is present-tense despite the frontmatter date. RUL34 triggers Iron Law on a risky module OR flag; RUL37 requires deliberate human acknowledgement of independent failing-test-first proof at the runner trunk boundary. Those are the two source rule claims; source names its own merge.mjs risk and cost, without claiming every proposal requires acknowledgement. Current ask/warn and trunk/source limits remain in the complete target rule text.')
    if key=='maps-j-01325':
     q.clean(r,e);target='docs/platform/runner/operations/h-51f5cd7279fd.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('Cổng duyệt PR nội bộ'))
     a.anchored_patch(r,e,path,body,target,h['anchor'],nums=[234,236,254,255,256],assessment='L12-51: the source names review/approve/reject as the one internal approval gate; this exact section lists those three operator verbs and awaiting-approval contract. It also distinguishes own-branch commits from approval into trunk. Actors & Access alone does not specify the named verbs.')
    if key=='maps-j-06547':
     q.clean(r,e);w.patch(r,e,path,body,'docs/platform/runner/spec.md',assessment='L12-51(5): complete paragraph delegates Unit/Workflow execution ownership to the whole runner area spec while retaining this area Assignment/Run recovery/control contract. Both path-text label and relative destination name the same retiring source; update them together to the whole runner holder, without asserting a specific section or superseding recovery details.')
    if key=='maps-j-04114':
     q.clean(r,e);a.park(r,e,path,body,'Dead link (L12-51): live Tham chiếu navigation names docs/history/str46-io-contract/, which never existed in author-pin ancestry. No committed live same-artifact holder is available; retain a non-executable blocker until the reading pointer is reconciled.','dead-link')
    if key=='maps-j-04966':
     resolved=m.resolved_elided_decision(PIN,path);assert resolved
     e.pop('targetFacts',None);e['reason']='L12-51, L12-41: elided '+path+' denotes '+resolved+'. '+a.facts(e,resolved)+' Preserve the past-event child tsk-38t-1 decision identity; the Audit locator carry in 04967 remains a separate obligation.'
     for holder in m.removed_decision_holders(PIN,e,resolved):e['reason']+=' Non-executable successor note: '+holder+'.'
    if r['file']=='docs/doc-registry.json':
     n=e['sourceSpans'][0]['line'];nearest=next((lines[i].strip() for i in range(n-2,-1,-1) if re.match(r'"(?:aliases|sourceCaptureIds)": \[',lines[i].strip())),None)
     if nearest=='"sourceCaptureIds": [' and re.fullmatch(r'"[^"]+",?',lines[n-1].strip()):
      assert 'aliases array value' in e['reason'];source_count+=1
      oldwhy=e['blockedReason'];why=oldwhy.replace('aliases array value','sourceCaptureIds array value (capture/provenance key)')+' L12-51 reader parity: doc-source-unreachable (checkDocSourceUnreachable) and doc-source-conservation (checkDocSourceConservation), src/setup/registrations.mjs, consume path-shaped sourceCaptureIds; doc.attest in src/state/knowledge-registry.mjs appends capture keys and src/state/cleanup-harness.mjs reads them. Preserve capture identity, generator input and reader conservation together.'
      e['reason']=e['reason'].replace(oldwhy,why);e['blockedReason']=why;e['dependency']=why
      def relabel(value):
       if isinstance(value,str):return value.replace(oldwhy,why)
       if isinstance(value,list):return [relabel(x) for x in value]
       if isinstance(value,dict):return {k:relabel(v) for k,v in value.items()}
       return value
      e['searchWitness']=relabel(e['searchWitness'])
      for proofs in r['checks']['coverage'].values():
       if isinstance(proofs,dict) and key in proofs:proofs[key]=relabel(proofs[key])
    if r['file']=='docs/transitional-switchboard.md':
     swaps={'maps-j-08403':('docs/platform/system-overview.md','docs/platform/system-overview/spec.md'),'maps-j-08433':('docs/platform/domainization/README.md','docs/platform/domainization/architecture/domainization.md')}
     if key in swaps:
      # Restrict replacement to proposed text, retain the exact original Source passage.
      left,right=e['reason'].split('Replacement:',1);old,new=swaps[key];e['reason']=left+'Replacement:'+right.replace(old,new)
     if key in {'maps-j-08399','maps-j-08400','maps-j-08401','maps-j-08402'}:
      left,right=e['reason'].split('Replacement:',1);e['reason']=left+'Replacement:'+right.replace('docs/platform/component-boundary/** (exact detailed owners)','docs/platform/component-boundary.md (complete boundary authority file)')
    # L12-51 record-text repairs only; preserve actual outcomes and source identities.
    canonical=re.sub(r':\d+(?:[-–]\d+)?$','',path.removeprefix('repo/').split('#')[0]).rstrip('/')
    if not canonical.startswith(('docs/specs/','docs/architect/')) and canonical not in ('docs/specs','docs/architect'):
     e['reason']=e['reason'].replace('; tree retires at Phase 9','').replace(' tree retires at Phase 9;',' ')
    if '0004' in canonical and 'decisions/0004-' in canonical and not m.carriage_declaration(body,e['sourceSpans'][0]['line']):
     note='Non-executable file-level successor note: docs/platform/work-state/decisions/retired-decision-history.md. Title-matched passage: 4. ADR 0004 Scope And Non-Goals (L12-51 English/Vietnamese correspondence).'
     if note not in e['reason']:e['reason']+=' L12-51 title correspondence (Vietnamese Phạm vi & non-goal / English Scope And Non-Goals). '+note
    if '0000-index.md' in canonical and 'docs/decisions/index.md' not in e['reason'] and not m.carriage_declaration(body,e['sourceSpans'][0]['line']):e['reason']+=' L12-51: docs/decisions/index.md was added as the generated projection at the removal commit; this is a record-only successor reference, not a Git-detected rename or permission to edit the projection.'
    dirty|=e!=before
   if any(e['edgeId']=='maps-j-05016' for e in r['edges']):
    candidate=next(x for x in r['checks']['coverage']['legacyScan']['candidates'] if x['span']['line']==63);span=candidate['span'];key='author-wave5f-launcher-vocabulary-guard-L63C2';path='docs/decisions/'+span['text']
    if not any(e['edgeId']==key for e in r['edges']):
     e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=span['text'],disposition='preserve',timing='none',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'L12-51: deleted 0031 basename inside Pointer maintenance history was missed by the prior supplemental exclusion.','searchMethod':'Pinned complete source; deleted-basename historical correspondence L12-39(7)'})
     w.historical_section(r,e,body,'Pointer maintenance (`tsk-4ah`)','No other content');w.preserve(r,e,path,body,'L12-51: completed Pointer maintenance preserves the exact deleted 0031 file identity. Non-executable successor note: docs/platform/runner/decisions/h-36d872fbb0e5.md#0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-gán-nghĩa-mới.')
     r['edges'].append(e);r['checks']['coverage']['authorAddedEdgeIds'].append(key);candidate.pop('excludedReason',None);candidate['edgeId']=key;dirty=True
   if r['file']=='docs/transitional-switchboard.md':
    ranges=[(23,25,'This document records the completed documentation-authority migration; current claim routing follows the accepted post-cutover owners below, with one canonical owner per claim.'),(30,34,'All accepted platform owners in this route table are promoted after atomic cutover and final conservation. Retiring source trees are no longer live authorities; retained sources and evidence keep their declared roles.'),(38,40,'Update each declared canonical owner once; provenance snapshots and projections retain their distinct roles.'),(41,44,'The migration phase history is retained in the plan. This post-cutover route table takes effect only after Phase 9 approval, accepted conservation and coordinated reader/writer parity.'),(98,103,'Use the promoted owner in the surface row. Source lineage is evidence; it does not delegate authority to retiring files.'),(104,108,'Resolve all candidate and legacy-current migration statuses to their accepted post-cutover owner before publishing this route table.')]
    # Explicit supplemental pathless prose units, distinct from canonical reading-map statusRowFlips.
    r['checks']['coverage']['switchboardStatusRowFlips']=[{'sourceSpans':[{'line':n,'columnStart':1,'columnEndExclusive':len(lines[n-1])+1,'text':lines[n-1]} for n in range(start,end+1)],'disposition':'phase9-row-flip','timing':'Phase 9','replacement':replacement,'reason':'L12-51(4), L12-35(2): complete pathless transition/status prose flips with the table; no early authority promotion.','dependency':'Phase 9 owner approval, conservation, source retirement and Step 5 reader/writer parity'} for start,end,replacement in ranges];dirty=True
   if dirty and (r['diff'] or any(e['edgeId']=='maps-j-04114' for e in r['edges'])):q.finish(r,body)
   old_record=next(x for x in original if x['file']==r['file'])
   unchanged={e['edgeId'] for e in r['edges'] if e in old_record['edges']}
   proofmaps=[(r['checks'][s],old_record['checks'][s]) for s in ('anchors','relativeResolution','labelForm')]
   proofmaps += [(v,old_record['checks']['coverage'].get(k,{})) for k,v in r['checks']['coverage'].items() if isinstance(v,dict)]
   for current,oldmap in proofmaps:
    for eid in unchanged:
     if eid in oldmap:current[eid]=copy.deepcopy(oldmap[eid])
     else:current.pop(eid,None)
   for k,oldmap in old_record['checks']['coverage'].items():
    if isinstance(oldmap,dict):
     for eid in unchanged:
      if eid in oldmap:r['checks']['coverage'].setdefault(k,{})[eid]=copy.deepcopy(oldmap[eid])
  if rs!=original:
   q.write(b,rs)
   for old,new in zip(original,rs):
    if old!=new:changes.append({'set':'batch-'+b,'file':new['file'],'beforeRecordSha256':m.sha(json.dumps(old,ensure_ascii=False,separators=(',',':'))+'\n'),'afterRecordSha256':m.sha(json.dumps(new,ensure_ascii=False,separators=(',',':'))+'\n'),'changedEdgeIds':[e['edgeId'] for e in new['edges'] if e not in old['edges']],'diffChanged':old['diff']!=new['diff'],'coverageChanged':old['checks']['coverage']!=new['checks']['coverage']})
 assert source_count==332,source_count
 q.save('step-03-wave5f-ruling-changes.json',{'rule':'L12-51','pin':PIN,'sourceCaptureIdsRelabelled':source_count,'changedFiles':len(changes),'changes':changes})
 print(json.dumps({'changedFiles':len(changes),'captureKeys':source_count}))
if __name__=='__main__':main()
