#!/usr/bin/env python3
"""Independent compact record/seed/packet/scope verification; no checker predicate changes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,hashlib,math,collections,subprocess,re
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-03-wave5f-common.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m;PIN=q.PIN;INPUT='171937a68c91cc93f0458a39776e5031ed850e46'

def main():
 sets=tuple(p.stem.removeprefix('batch-') for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')));rs=[r for b in sets for r in q.load(b)];by={r['file']:r for r in rs};wave=[r for r in rs if 105<=int(r['reviewSet'][-3:])<=113];freeze=json.loads((P/'step-03-wave5f-manifest.json').read_text());accounts=[];reads=[]
 for r in wave:
  raw=m.blob(PIN,r['file']);ls=raw.decode().splitlines();assert m.sha(raw)==r['digest'];reads.append({'file':r['file'],'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(r['inventoryEdgeIds']),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
 for g in freeze['sets']:
  b=g['set'];group=[r for r in wave if r['reviewSet']==b];pop=sorted(r['file'] for r in group if r['diff']);seed='A51-step03-file-v1\0'+PIN+'\0'+b[-3:];ranks=sorted(pop,key=lambda f:(m.sha(seed+'\0'+f),f));sample=ranks[:math.ceil(.15*len(pop))]
  assert g['seed']==seed and g['population']==pop and g['sample']==sample
  mandatory={r['file'] for r in group if len(m.blob(PIN,r['file']))>=65536 or len(r['edges'])>=40};inventory_mandatory={r['file'] for r in group if len(m.blob(PIN,r['file']))>=65536 or len(r['inventoryEdgeIds'])>=40};assert inventory_mandatory<=mandatory;assert set(g['selected'])==set(sample)|mandatory
  u=freeze['unpatchedStrata'][b[-3:]];upop=sorted(r['file'] for r in group if not r['diff'] and r['edges'] and r['file'] not in g['selected']);useed='A51-step03-file-v1-unpatched\0'+PIN+'\0'+b;urank=sorted(upop,key=lambda f:(m.sha(useed+'\0'+f),f));assert u['population']==upop and u['seed']==useed and u['selected']==urank[:math.ceil(.15*len(upop))]
  accounts.append({'set':b,'patchedPopulation':len(pop),'patchedSeeded':len(sample),'mandatory':len(mandatory),'inventoryMandatory':len(inventory_mandatory),'unpatchedEligible':len(upop),'unpatchedSeeded':len(u['selected']),'distinct':len(set(g['selected']+u['selected']))})
 packets=[]
 for name in ['step-03-wave5f-review-index.json','step-03-wave5c-expansion-review-index.json']:
  index=json.loads((P/name).read_text());assigned=[]
  for part in index['parts']:
   assert part['fileCount']==len(part['files'])<=6
   if part['edges']>150 or part['sourcePlusRecordBytes']>400000:assert part['fileCount']==1 and part['indivisibleOversize']
   assert part['sourcePlusRecordBytes']==sum(x['contextPlusRecordBytes'] for x in part['files'])
   for row,page in zip(part['files'],part['readingPages']):
    r=by[row['file']];assigned.append(r['file']);raw=(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode();assert row['recordSha256']==m.sha(raw) and row['diffSha256']==m.sha(r['diff']) and row['sourceDigest']==r['digest'];assert row['recordBytes']==len(raw) and row['sourceBytes']==len(m.blob(PIN,r['file']))
    expected=[{'first':n+1,'last':min(n+100,len(r['edges']))} for n in range(0,len(r['edges']),100)];assert page['edgeRanges']==expected and page['maxFieldPageBytes']<=300000
  assert len(assigned)==len(set(assigned))==index['selectedFiles'];assert index['selectedEdges']==sum(len(by[f]['edges']) for f in assigned)
  if name.startswith('step-03-wave5f'):assert set(assigned)=={f for g in freeze['sets'] for f in g['selected']}|{f for u in freeze['unpatchedStrata'].values() for f in u['selected']}
  else:assert set(assigned)==set(index['remaining126And130'])|set(index['targetedChangedFiles'])
  packets.append({'index':name,'files':len(assigned),'edges':index['selectedEdges'],'parts':len(index['parts']),'bound':True})
 binding=json.loads((P/'step-03-wave5f-binding-manifest.json').read_text())
 for row in binding['recordFiles']:assert m.sha((m.ROOT/row['path']).read_bytes())==row['sha256']
 for row in binding['files']:
  r=by[row['file']];assert row['recordSha256']==m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n') and row['diffSha256']==m.sha(r['diff'])
 switch=by['docs/transitional-switchboard.md'];body=m.blob(PIN,switch['file']).decode();flips=switch['checks']['coverage']['switchboardStatusRowFlips'];assert len(flips)==6
 for flip in flips:assert m.spans_text(body,flip['sourceSpans'])=='\n'.join(s['text'] for s in flip['sourceSpans']) and flip['replacement'] and flip['timing']=='Phase 9' and flip['disposition']=='phase9-row-flip'
 capture_edges=[];reg=by['docs/doc-registry.json'];lines=m.blob(PIN,reg['file']).decode().splitlines()
 for e in reg['edges']:
  if 'sourceCaptureIds array value (capture/provenance key)' not in e['reason']:continue
  capture_edges.append(e['edgeId']);assert e['disposition']=='parked' and e['blockedCategory']=='step5-parity'
  assert all(term in e['reason'] for term in ('doc-source-unreachable','doc-source-conservation','src/setup/registrations.mjs'))
  assert 'aliases array value' not in json.dumps(e,ensure_ascii=False)
 assert len(capture_edges)==332
 holder='docs/platform/work-state/decisions/retired-decision-history.md';heading='## 4. ADR 0004 Scope And Non-Goals';assert heading in m.blob(PIN,holder).decode().splitlines()
 legacy='docs/specs/work-state.md';assert '0004 — Phạm vi & non-goal' in m.blob(PIN,legacy).decode()
 notes=[e['edgeId'] for r in rs for e in r['edges'] if 'Non-executable file-level successor note: '+holder+'. Title-matched passage: 4. ADR 0004 Scope And Non-Goals' in e.get('reason','')];assert notes
 # Read-only Git status proves the tracked and new output paths stay in the declared plan scope.
 status=subprocess.check_output(['git','status','--porcelain','-uall'],cwd=m.ROOT,text=True).splitlines();paths=[line[3:] for line in status];assert all(path.startswith('plans/260925-documentation-authority-unification/') for path in paths);assert not any('reports/phase-06/' in path or pathlib.Path(path).name.startswith('step-03-wave5g-') for path in paths)
 subprocess.run(['git','diff','--check'],cwd=m.ROOT,check=True)
 protected=[]
 for name in ('step10-round5-reproduction.json','step10-sync4d-reproduction.json'):
  path=str(m.REL.parent/'phase-06'/name);digest=m.sha((m.ROOT/path).read_bytes());assert digest==m.sha(m.blob(INPUT,path));protected.append({'path':path,'sha256':digest,'unchangedFromAssignmentInput':True})
 oldpaths=[p for p in m.git('ls-tree','-r','--name-only',INPUT,'--',str(m.REL/'step-03-records')).decode().splitlines() if re.search(r'/batch-[0-9]{3}\.jsonl$',p)];oldbytes={pathlib.Path(p).name:m.blob(INPUT,p).decode() for p in oldpaths};changes=[]
 for name,content in oldbytes.items():
  oldrs=[json.loads(l) for l in content.splitlines()];now=q.load(name.removeprefix('batch-').removesuffix('.jsonl'));assert [r['file'] for r in oldrs]==[r['file'] for r in now]
  for old,r in zip(oldrs,now):
   if old==r:continue
   oldby={e['edgeId']:e for e in old['edges']};edgeids=[e['edgeId'] for e in r['edges'] if e!=oldby.get(e['edgeId'])]
   changes.append({'set':r['reviewSet'],'file':r['file'],'beforeRecordSha256':m.sha(json.dumps(old,ensure_ascii=False,separators=(',',':'))+'\n'),'afterRecordSha256':m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n'),'changedEdgeIds':edgeids,'diffChanged':old['diff']!=r['diff'],'coverageChanged':old['checks']['coverage']!=r['checks']['coverage']})
   unchanged={e['edgeId'] for e in r['edges'] if e in old['edges']}
   maps=[(r['checks'][section],old['checks'][section]) for section in ('anchors','relativeResolution','labelForm')]
   maps += [(v,old['checks']['coverage'].get(k,{})) for k,v in r['checks']['coverage'].items() if isinstance(v,dict)]
   for current,previous in maps:
    for eid in unchanged:assert current.get(eid)==previous.get(eid),(r['file'],eid,'unrelated proof changed')
 assert len(changes)==24
 q.save('step-03-wave5f-ruling-changes.json',{'rule':'L12-51','pin':PIN,'assignmentInputHead':INPUT,'sourceCaptureIdsRelabelled':332,'changedFiles':len(changes),'changes':changes,'unrelatedEdgeProofsRestoredAndVerified':True})
 q.save('step-03-wave5f-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Final complete immutable source traversal with exact chunk/digest bindings; author evidence only, not independent review.'})
 for f in P.glob('step-03-wave5f-whole-file-reads-*.json'):f.unlink()
 proof=json.loads((P/'step-03-wave5f-check-result.json').read_text());assert proof['failureCount']==0 and not proof['notClosableSets'];assert len(proof['checkedBatches'])==len(sets)
 q.save('step-03-wave5f-verification.json',{'pin':PIN,'assignmentInputHead':INPUT,'newFiles':len(wave),'newEdges':sum(len(r['edges']) for r in wave),'samplingReplay':accounts,'packets':packets,'allCurrentBindingsVerified':len(by),'reworkFiles':24,'sourceCaptureKeys':332,'switchboardCompleteStatusUnits':6,'decision0004TitleBinding':{'target':holder,'heading':heading,'targetDigest':m.sha(m.blob(PIN,holder)),'legacySource':legacy,'noteEdges':notes},'unrelatedEdgeProofs':'unchanged against assignment-input bytes','checker':{'files':proof['files'],'edges':proof['edges'],'failures':0,'openLeadRulingEdgesPerSet':proof['openLeadRulingEdgesPerSet']},'scope':{'changedOrNewPaths':len(paths),'allInsidePlan':True,'phase06AndWave5gUntouched':True},'protectedReproductionManifests':protected,'gitDiffCheck':'pass','commands':['env -u CLAUDE_CODE_SESSION_ID python3 -B '+str(m.REL/'step-03-wave5f-check.py'),'env -u CLAUDE_CODE_SESSION_ID python3 -B '+str(m.REL/'step-03-wave5f-packet.py'),'env -u CLAUDE_CODE_SESSION_ID python3 -B '+str(m.REL/'step-03-wave5f-verify.py')],'limits':'Patch records only. No consumer edit, review acceptance, production/full npm suite, authority flip, set closure or Phase 9 authorization. Runner commits; Lead owns actual-commit accounting and drift revalidation.'})
 print(json.dumps({'files':len(wave),'edges':sum(len(r['edges']) for r in wave),'packets':packets,'verified':True}))
if __name__=='__main__':main()
