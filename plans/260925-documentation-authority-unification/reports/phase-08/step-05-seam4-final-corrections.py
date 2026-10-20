import pathlib,json,re
p=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
def nums(s):return {'dynamic-'+f'{int(x):06}' for x in s.split()}
reject={
 **{x:'root-only' for x in nums('8084 8085 8132 8133 8183 8537 8538 8541 8542 7846 692 732 738 741 776 781 786')},
 **{x:'finding-path-field' for x in nums('6780 6784 6785 14347 14348 14349 7794 7789')},
 **{x:'guard' for x in nums('7599 7720 7784 8554 8555')},
 **{x:'scalar-pass-through' for x in nums('7833 7848 7851 9715')},
}
for f in (p/'step-05-records').glob('*.jsonl'):
 rs=[json.loads(l) for l in f.read_text().splitlines()]
 for r in rs:
  for d in r['dynamicTraces']:
   if d['id'] in reject:
    cat=reject[d['id']];d.update(admission='REJECT',disposition='preserve',role=cat,nonDocumentUse=cat,pathOperand=None,stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason='L12-72 R5: '+cat+'; exact own operand '+repr(d['originalTuple'][4]),reason='L12-72 R5: '+cat+'; exact own operand '+repr(d['originalTuple'][4]))
   if (r['file'] in ['scripts/knowledge-canary.mjs','src/report/capability-plan-lint.mjs','scripts/verify-phase-01.mjs']) and d['disposition']=='parked':
    d.update(disposition='preserve',stateExportDependency=None,blockedReason=None,blockedSeams=[],reason='L12-72 R4/R9: fixed sandbox document or plan reader/gate convention '+repr(d['originalTuple'][4])+'; no moving target is constructed by this operation and no file-specific external blocker exists.')
   if d.get('parityObligation') and d['disposition']!='parked':d['parityObligation']['blocker']=None
  for e in r['references']+r.get('authorAddedReferences',[]):
   if e.get('disposition')=='preserve' and re.search(r'docs/decisions/0027-',e.get('matchedExpression','')):
    e['successorNote']='docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027';e['resolverWitness'].update(rule='Retired decision corpus historical design citation; successorNote gives live ADR0027 narrative holder.',existsAtPin=False);e['resolverWitness'].pop('expressionKind',None)
   if e.get('matchedExpression')=='docs/decisions/*.md' and e.get('disposition')=='preserve':
    e['successorNote']='docs/decisions/index.md';e['resolverWitness']['rule']='Retired decision corpus glob, not an existing directory population; checker output documents retirement. New index is the live decision projection.'
  r['parked']=[e.get('id',e.get('referenceId')) for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked']
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
# Nested tuple siblings of non-document defaults/guards share the same rejection.
reject2=nums('7598 7721 7785 7786 7832 7845 7847 7850')
for f in (p/'step-05-records').glob('*.jsonl'):
 rs=[json.loads(l) for l in f.read_text().splitlines()]
 for r in rs:
  for d in r['dynamicTraces']:
   if d['id'] in reject2:
    d.update(admission='REJECT',disposition='preserve',role='scalar-pass-through',nonDocumentUse='scalar-pass-through',pathOperand=None,stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason='L12-72 R5/R7: nested scalar guard/default, same operation as its rejected enclosing tuple.',reason='L12-72: scalar guard/default '+repr(d['originalTuple'][4])+'; nested sibling has same rejection.')
   if d['id'] in nums('8554 8555'):
    d.update(admission='ADMIT',disposition='preserve',role='document-root-probe',pathOperand=d['operationWitness']['text'],stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason=None,reason='L12-72 R9: exact legacy document-root membership probe in the migration gate, sharing literal root identity; '+repr(d['originalTuple'][4]));d.pop('nonDocumentUse',None)
  for e in r['references']+r.get('authorAddedReferences',[]):
   if e.get('successorNote')=='docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027':e['successorNote']='docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary'
   if e.get('referenceId') in ['reference-003625','reference-003633','reference-003638','reference-003639']:
    e.update(disposition='preserve',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,timing='none',reason='L12-72 R9: exact fixed legacy-root identity in this frozen migration gate; no named Phase 9 change obligation for this expression.');e['resolverWitness']['rule']='Exact frozen migration gate identity, not a retained retiring tree.'
  r['parked']=[e.get('id',e.get('referenceId')) for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked']
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
# Root instruction documents are documents too (R6); hook settings remain config.
audit_admit=nums('1825 1826 1827 1828 1829 1831 1832 1869')
state_reject=nums('13878 13894 13897 13898 13910 13911 13925 13927')
for f in (p/'step-05-records').glob('*.jsonl'):
 rs=[json.loads(l) for l in f.read_text().splitlines()]
 for r in rs:
  for d in r['dynamicTraces']:
   if d['id'] in audit_admit:
    d.update(admission='ADMIT',disposition='preserve',role='document-live-read',pathOperand=d['operationWitness']['text'],stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason=None,proofCommand='missing',reason='L12-72 R6/R4: '+repr(d['originalTuple'][4])+' resolves/probes root instruction documents or followed @import documents. Fixed instruction-root reader convention is retained; no generator-data blocker.');d.pop('nonDocumentUse',None);d['parityObligation']={'current':d['pathOperand'],'candidate':d['pathOperand'],'comparison':'Same document import/root input produces same exact read set; no relocation authorized.','blocker':None}
   if d['id'] in state_reject:
    d.update(admission='REJECT',disposition='preserve',role='state-event-store',pathOperand=None,nonDocumentUse='state-event-store',stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason='L12-72 R5: effective-set JSON under .fgos/instructions is configuration state, not a document.',reason='L12-72 R5: configuration state '+repr(d['originalTuple'][4])+' under .fgos/instructions/effective; root AGENTS.md projection destination remains separately owned.')
  r['parked']=[e.get('id',e.get('referenceId')) for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked']
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
# R6 follows a fixed document root through a local variable into emitted text.
fixed_messages=nums('1677 1680 1716 1717 1756 6456 6457 6459')
sets={f:[json.loads(l) for l in f.read_text().splitlines()] for f in (p/'step-05-records').glob('*.jsonl')};rows=[r for a in sets.values() for r in a];by={r['file']:r for r in rows}
for r in rows:
 for d in r['dynamicTraces']:
  if d['id'] in fixed_messages:
   d.update(admission='ADMIT',disposition='preserve',role='emitted-document-message',pathOperand=d['operationWitness']['text'],stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason=None,proofCommand='missing',reason='L12-72 R6: '+repr(d['originalTuple'][4])+' derives the printed/temporary document path from fixed REFS_DIR docs/distillery or the fixed skill render roots; the output changes if that root moves. Preserve the retained convention.');d.pop('nonDocumentUse',None);d['parityObligation']={'current':d['pathOperand'],'candidate':d['pathOperand'],'comparison':'Exact printed document path and temp-to-document destination unchanged.','blocker':None}
for r in rows:
 if not r.get('generated'):continue
 for d in r['dynamicTraces']:
  if not d.get('sourceOwner'):continue
  src=by[d['sourceOwner']['file']];o=next((e for e in src['dynamicTraces'] if e['id']==d['sourceOwner']['id']),None)
  if o:
   for k in ['admission','disposition','reason','role','nonDocumentUse','rejectedAsUnrelatedReason','proofCommand','parityObligation']:
    if k in o:d[k]=o[k]
    else:d.pop(k,None)
   d['sourceOwnerDisposition']=o['disposition'];d['pathOperand']=d['operationWitness']['text'] if o['admission']=='ADMIT' else None
for f,a in sets.items():f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in a))
# Separate filesystem probes/reads from caller-data error formatting on their line.
import hashlib
for f in (p/'step-05-records').glob('*.jsonl'):
 rs=[json.loads(l) for l in f.read_text().splitlines()]
 for r in rs:
  if r['file']=='scripts/check-doc-inventory-gates.mjs':
   lines=pathlib.Path(r['file']).read_text().splitlines()
   for n,expr,role in [(1320,'fs.existsSync(filePath)','live-probe'),(1321,"fs.readFileSync(filePath, 'utf8')",'live-read'),(1339,'fs.existsSync(filePath)','live-probe')]:
    assert expr in lines[n-1];key='author-s4-read-'+hashlib.sha256((r['file']+str(n)+expr).encode()).hexdigest()[:16]
    if not any(e['id']==key for e in r['authorAddedReferences']):
     col=lines[n-1].index(expr)+1;r['authorAddedReferences'].append({'id':key,'admission':'ADMIT','disposition':'preserve','matchedExpression':expr,'sourceSpans':[{'line':n,'columnStart':col,'columnEndExclusive':col+len(expr),'text':expr}],'passageSpan':{'startLine':n,'endLine':n},'passage':lines[n-1],'role':role,'pathOperand':'filePath','reason':'L12-72 R3/R6/R9: document input probe/read has an exact owning source slot. The disjoint caller-data error template is formatting; frozen migration gate bytes preserve.','resolverWitness':{'inputCommit':r['authorInputCommit'],'rule':'Exact document input probe/read in frozen migration gate.'},'blockedReason':None,'successorNote':None,'receiptId':r['receiptIds'][0],'proofCommand':'missing'})
   for d in r['dynamicTraces']:
    if d['id']=='dynamic-006788':d.update(admission='REJECT',disposition='preserve',nonDocumentUse='caller-data-formatting',pathOperand=None,role='caller-data-formatting',stateExportDependency=None,blockedReason=None,blockedSeams=[],rejectedAsUnrelatedReason='L12-72 R6: suggested command echoes only paths supplied by context.inventoryPath/identityRegistryPath; no fixed document root.',reason='L12-72 R6: suggested command '+repr(d['originalTuple'][4])+' formats caller-supplied paths; actual default-path resolution and document reads have separate owning operations.')
  if r['file'] in ['docs/decisions/index.md','docs/doc-registry.md','docs/doc-registry.json','docs/enduser-docs-index.json']:
   generators={'docs/decisions/index.md':'src/report/decision-index.mjs','docs/doc-registry.md':'src/report/knowledge-projection.mjs','docs/doc-registry.json':'src/report/knowledge-projection.mjs','docs/enduser-docs-index.json':'src/report/enduser-index-generate.mjs'};r['sourceRenderProvenance']['generator']=generators[r['file']]
  for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]):
   w=e.get('resolverWitness',{})
   if w.get('rule')=='Exact frozen migration gate identity, not a retained retiring tree.':w['rule']='Exact frozen migration gate identity; Phase 9 owns gate retirement.'
   if e.get('parityObligation') and e['disposition']=='preserve' and 'current' in e['parityObligation']:e['parityObligation']['candidate']=e['parityObligation']['current'];e['parityObligation']['blocker']=None
   if 'originalTuple' in e and e.get('operationChain'):
    c=e['currentPassage'];n=e.get('currentLine');e['operationChain']['input']=e.get('pathOperand') or e['originalTuple'][4]
    if n:e['operationChain']['operation']=c['text'].splitlines()[n-c['startLine']].strip()
    else:e['operationChain']['operation']='Census operand removed before this source pin; pinned context is locator only. Original non-document use: '+str(e.get('nonDocumentUse'))
  r['parked']=[e.get('id',e.get('referenceId')) for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked']
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
