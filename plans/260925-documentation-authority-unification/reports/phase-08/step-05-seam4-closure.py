"""L12-71 records-only closure. Never writes a consumer or runs a generator."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,hashlib,importlib.util,re
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('checker',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
sha=m.sha
read=lambda n:json.loads((P/n).read_text())
def save(n,v):(P/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
rs=m.load();before=copy.deepcopy(rs);refs={e['referenceId']:e for r in rs for e in r['references']};dyn={d['id']:d for r in rs for d in r['dynamicTraces']}
sweep=[]
for r in rs:
 for e in r['references']:
  if e['disposition']=='preserve' and re.search(r'docs/(?:specs|architect)/',e['matchedExpression']) and 'retained' in str(e['resolverWitness']).lower():
   sweep.append({'file':r['file'],'id':e['referenceId'],'oldWitness':copy.deepcopy(e['resolverWitness']),'action':'patch live doctor holder' if e['admission']=='ADMIT' else 'replace retained witness by explicit comment provenance'})
   if e['admission']=='REJECT':e['resolverWitness']={'rule':'L12-71: source-comment provenance; exists at author pin; tree retires at Phase 9. Prior canonical comment slot owns this historical/design evidence, not a retained target.','inputCommit':r['authorInputCommit'],'expression':e['matchedExpression']}
r=next(r for r in rs if r['file']=='src/cli/command-registry.mjs');target='docs/platform/packaging-distribution/spec.md';text=m.pinned(r['authorInputCommit'],target)
assert '## Business Rules' in text and '**RUL9' in text and '**RUL11' in text
w={'rule':'L12-71: live RUL9/RUL11 doctor contract holder; Step 4 cli-006 precedent','target':target,'targetSha256':sha(text),'anchor':'business-rules','inputCommit':r['authorInputCommit'],'claim':'RUL9 default never writes; RUL11 --fix runs every registered fix','claimLines':[644,659]}
for rid in ['reference-003649','reference-003664']:
 e=refs[rid];e.update(disposition='patch',timing='phase9',target=target,anchor='business-rules',proposedReplacement=target,resolverWitness=copy.deepcopy(w),reason='L12-71: emitted doctor help cites RUL9/RUL11. docs/specs retires; the pinned live Business Rules holder states both rules, following Step 4 cli-006. Replace only this path.',coCutTestGrep=m.test_grep(r['authorInputCommit'],e['matchedExpression']))
 e['parityObligation'].update(candidate=target,comparison='Exact emitted doctor help bytes with only the path substitution; selectors, JSON shape and exits unchanged; runtime parity missing.')
 e['aliasWriteCheck']={'isWriter':False,'destinationIsAlias':False,'evidence':'Emitted navigation string; no document destination is written.'}
a,b=m.candidate(r);r.update(diff=m.m.make_diff(r['file'],a,b),rollbackDiff=m.m.make_diff(r['file'],b,a),expectedAfterSha256=sha(b))
for e in r['references']:
 if e['disposition']=='patch':e['diffHunk']=r['diff']
# Correct every enumerated reviewer note without rewriting the independent reports.
for d in dyn.values():
 if d['id'] in ['dynamic-000766']:d.update(role='type/import',reason="L12-71: type/import token "+repr(d['originalTuple'][4])+" in root: &std::path::Path; actual read owned by 000767/000768.",rejectedAsUnrelatedReason='Rust type token, not an operation')
for ids,file,line in [(['dynamic-013991','dynamic-013992'],'src/setup/instruction-registry.mjs',597),(['dynamic-013982'],'src/setup/instruction-registry.mjs',457),(['dynamic-014207'],'src/setup/registrations.mjs',2056),(['dynamic-014338'],'src/setup/registrations.mjs',3760)]:
 for did in ids:dyn[did]['caller']={'line':line,'declaration':m.pinned(r['authorInputCommit'],file).splitlines()[line-1].strip()}
# compileInstructionUnit encloses the 361 validation message.
file='src/setup/instruction-registry.mjs';ls=m.pinned(r['authorInputCommit'],file).splitlines();n=next(i for i,l in enumerate(ls,1) if 'export function compileInstructionUnit(' in l)
dyn['dynamic-013969']['caller']={'line':n,'declaration':ls[n-1].strip()}
for did in ['dynamic-013982','dynamic-013989','dynamic-013990','dynamic-013991','dynamic-013992']:
 d=dyn[did];d.update(role='comment',reason='L12-71: JSDoc option declaration '+repr(d['originalTuple'][4])+' describes API parameters; no path construction occurs here.',rejectedAsUnrelatedReason='JSDoc parameter comment; actual defaults are separate admitted tuples')
for did in ['dynamic-014008','dynamic-014018','dynamic-014028']:
 d=dyn[did];d.update(reason='L12-71: state directory '+repr(d['originalTuple'][4])+' handed to listWork; the generated decision-index read is owned by dynamic-013969.',rejectedAsUnrelatedReason='State directory pass-through into listWork; not a document location')
dyn['dynamic-014072']['censusDriftNote']='L12-71: diagnostic text drifted since census pin; current pinned parts.join formatting is unchanged in role.'
for did in ['dynamic-014299','dynamic-014300','dynamic-014301','dynamic-014302']:
 d=dyn[did];d['parityObligation']['comparison']='Retained root file read, no diff and no literal patch owner. Same input bytes, extraction result and error behavior; cutover parity not run.'
 if did in ['dynamic-014301','dynamic-014302']:d['reason']='L12-71: README.md retained root reader extracts the pinned install tag. Own operand '+repr(d['originalTuple'][4])+'. No Unreleased extraction in this function.'
for rid in ['reference-003641','reference-003643','reference-003652','reference-003653','reference-003659','reference-003666']:
 e=refs[rid];e.update(blockedCategory='step5-parity',dependencyCategory='step5-parity');e['resolverWitness']={'rule':'L12-71: parked scope/quadrant generator construction; retained-path status cannot prove current/candidate semantics.','expression':e['matchedExpression'],'blocker':e['blockedReason']}
for rid in ['reference-003658','reference-003661','reference-003662']:
 refs[rid]['resolverWitness']={'rule':'L12-71: synthetic gate-check example item tsk-19j; path nonexistent by design, not live repository navigation.','expression':refs[rid]['matchedExpression'],'exists':False}
for rid in ['reference-000168','reference-000189']:
 e=refs[rid];e['resolverWitness']={'rule':'L12-71: retained docs/history external-project narrative convention / inline synthetic work-doc fixture. No relocation claimed.','expression':e['matchedExpression']}
for rid in ['reference-003804','reference-003806','reference-003811']:
 refs[rid]['proofScope']='Exact emitted-output parity missing. Existing test/setup/checks.test.mjs (and readme-tag-check owning proof where relevant) are current behavior targets only, not this parity proof.'
for r in rs:
 r['parked']=[e['referenceId'] for e in r['references'] if e['disposition']=='parked']+[d['id'] for d in r['dynamicTraces'] if d['disposition']=='parked']
for seam in m.SEAMS:(P/'step-05-records'/f'{seam}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if seam in r['seamIds']))
# Refresh existing receipt/specs, preserving all prior proof custody.
specs=read('step-05-pilot-cutover-specs.json');receipts=read('step-05-pilot-parity-receipts.json')
r=next(r for r in rs if r['file']=='src/cli/command-registry.mjs');s=next(s for s in specs['patches'] if s['file']==r['file']);rc=next(x for x in receipts['receipts'] if x['seam']=='cli-help-messages')
s.update(diff=r['diff'],rollbackDiff=r['rollbackDiff'],expectedAfterSha256=r['expectedAfterSha256'],sourceSpans=[span for e in r['references'] if e['disposition']=='patch' for span in e['sourceSpans']],targetOwner=sorted({e['target'] for e in r['references'] if e['disposition']=='patch'}),claimAnchorProof=[e['resolverWitness'] for e in r['references'] if e['disposition']=='patch'])
for e in r['references']:
 if e['referenceId'] not in ['reference-003649','reference-003664']:continue
 span=e['sourceSpans'][0];old=a.splitlines()[span['line']-1];new=old[:span['columnStart']-1]+e['proposedReplacement']+old[span['columnEndExclusive']-1:]
 delta={'file':r['file'],'referenceId':e['referenceId'],'edgeId':e['edgeId'],'line':span['line'],'currentExpression':old,'candidateExpression':new,'oldPointer':e['matchedExpression'],'newPointer':e['proposedReplacement'],'intent':'L12-71: only doctor RUL9/RUL11 navigation path changes','evidence':e['resolverWitness']}
 for arr in [s['expectedOutputSets'],s['intentionalBehaviorDeltas'],rc['comparison']['intentionalDeltas']]:
  if not any(x.get('referenceId')==e['referenceId'] for x in arr):arr.append(delta)
 for arr in [s['coCutTestGreps'],rc['coCutTestGreps']]:
  if e['coCutTestGrep'] not in arr:arr.append(e['coCutTestGrep'])
for r0 in rs:
 if not r0['diff']:continue
 ss=next(x for x in specs['patches'] if x['file']==r0['file']);es=[e for e in r0['references'] if e['disposition']=='patch']
 ss.update(symbolOrPassage=[e['passage'] for e in es],oldText=[e['matchedExpression'] for e in es],newText=[e['proposedReplacement'] for e in es])
 if r0['file']=='.githooks/pre-commit':
  for edit in ss['coCutTestEdits']:edit['proofScope']+=' L12-71: merge.test.mjs belongs to the shared atomic old-pointer co-cut with merge.mjs reference-003749; it does not assert hook output. Hook e2e basename proof stays unchanged.'
setup=next(x for x in receipts['receipts'] if x['seam']=='setup-doctor-roots')
setup['recordTextClarifications']=['L12-71: emitted doc-registry messages preserve because docs/doc-registry.json and .md stay at docs root. A later projection rename must co-cut reference-003830/003846/003853/003857/003858 with parked readers/writers.','L12-71: root/mainCheckout state-path parks are coupled to their owning check; they are not document destinations. looksLikeDocPath at 4131-4133 remains a future source-conservation co-cut prerequisite.','L12-71: registrations L2045 preserved manual-command comment is stale before cutover; reference-003845 is comment provenance, not current-path guidance.']
# Keep duplicate receipt test edits equal to their owning specs.
for rc0 in receipts['receipts']:
 rc0['coCutTestEdits']=[copy.deepcopy(edit) for ss in specs['patches'] if ss['receiptId']==rc0['id'] for edit in ss.get('coCutTestEdits',[])]
 for out in rc0['comparison']['candidateOutputSet']:
  if out.get('file')==r['file']:out.update(sourceSha256=r['expectedAfterSha256'],diffSha256=sha(r['diff']))
save('step-05-pilot-cutover-specs.json',specs);save('step-05-pilot-parity-receipts.json',receipts)
# Refresh canonical projections, retaining original pin and bounded part identities.
byfile={r['file']:r for r in rs};rec={x['id']:x for x in receipts['receipts']};specby={s['file']:s for s in specs['patches']}
ix=read('step-05-pilot-review-index.json')
for part in ix['parts']:
 d=read(part['payload'])
 for it in d['items']:
  k=it['kind'];rr=byfile.get(it.get('file'))
  if k in ['references','dynamicTraces','priorRecordRefs']:it['value']=rr[k][it['index']]
  elif k=='record-metadata':it['value']={k:v for k,v in rr.items() if k not in ['references','dynamicTraces','priorRecordRefs']}
  elif k=='receipt':it['value']=rec[it['value']['id']]
 save(part['payload'],d);raw=(P/part['payload']).read_bytes();part.update(bytes=len(raw),payloadSha256=sha(raw))
save('step-05-pilot-review-index.json',ix)
rr=read('step-05-pilot-rereview-index.json')
for part in rr['parts']:
 d=read(part['payload'])
 for it in d['records']:
  r0=byfile[it['file']];k=it['kind'];it['record']=next(e for e in r0[k] if e.get('referenceId',e.get('id'))==it['id'])
  if it['record']['disposition']=='patch' or 'cutoverSpecification' in it:it['cutoverSpecification']={k:v for k,v in specby[it['file']].items() if k not in ['symbolOrPassage','oldText','newText','expectedOutputSets','intentionalBehaviorDeltas']}
 save(part['payload'],d);raw=(P/part['payload']).read_bytes();part.update(bytes=len(raw),sha256=sha(raw))
save('step-05-pilot-rereview-index.json',rr)
save('step-05-seam4-closure-sweep.json',{'sweptFiles':len(rs),'literalReferences':sum(len(r['references']) for r in rs),'dynamicTuples':sum(len(r['dynamicTraces']) for r in rs),'retiringRetainedWitnessHits':sweep,'hitCount':len(sweep),'patchIds':['reference-003649','reference-003664'],'consumerWrites':0,'reviewReports':'Original independent reports immutable; this author closure supersedes record-text notes, not their historical verdicts.'})
print(json.dumps({'sweepHits':len(sweep),'patchIds':2,'physicalNewPatchHunks':1,'maxPilotBytes':max(x['bytes'] for x in ix['parts']),'maxRRBytes':max(x['bytes'] for x in rr['parts'])}))
