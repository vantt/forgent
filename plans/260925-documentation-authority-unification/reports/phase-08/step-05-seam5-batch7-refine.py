"""Physical occurrence closure: joined history citation and retained root reads."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,subprocess,hashlib
P=pathlib.Path(__file__).resolve().parent
fn='step-05-records/tests-judgment-batch7.jsonl';rs=[json.loads(l) for l in (P/fn).read_text().splitlines()]
for r in rs:
 f=r['file'];ls=subprocess.check_output(['git','show',r['authorInputCommit']+':'+f],text=True).splitlines();items=r['references']+r['dynamicTraces']+r['authorAddedReferences']
 if f=='test/runner/execution/handoff-refs.test.mjs':
  # Same scratch join as dynamic-026491; the nested literal is not a second emitted path.
  parent=next(e for e in items if e.get('id')=='dynamic-026491');child=next(e for e in items if e.get('referenceId')=='author-s5-b7-handoff-refs-67-42')
  child.update({k:copy.deepcopy(parent[k]) for k in ['admission','disposition','nonDocumentUse','role','reason','parityObligation']});child.pop('resolverWitness',None)
 if f=='test/skills/fgos-coding-knowledge.test.mjs':
  parent=next(e for e in items if e.get('id')=='dynamic-037262');child=next(e for e in items if e.get('referenceId')=='author-s5-b7-fgos-coding-knowledge-33-20')
  child.update({k:copy.deepcopy(parent[k]) for k in ['admission','disposition','nonDocumentUse','role','reason','resolverWitness','parityObligation']})
 if f=='test/state/events-legacy-absence.test.mjs':
  e=next(e for e in r['authorAddedReferences'] if e['sourceSpans'][0]['line']==1);tail='history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md';k=ls[1].index(tail);e['matchedExpression']='docs/'+tail;e['sourceSpans']=[e['sourceSpans'][0],{'line':2,'columnStart':k+1,'columnEndExclusive':k+len(tail)+1,'text':tail}];e['reason']='R16: joined two-line docs/history provenance citation; preserve dated retirement rationale.'
 if f=='test/docs/run-doors-doctrine.test.mjs':
  base=next(e for e in r['dynamicTraces'] if e['id']=='dynamic-018759')
  for n in [25,77]:
   identity='author-s5-b7-retained-agents-'+str(n)
   if any(e.get('referenceId')==identity for e in r['authorAddedReferences']):continue
   e={k:copy.deepcopy(v) for k,v in base.items() if k not in ['id','originalTuple','inventoryOrigins','currentLine','currentPassage','caller','operationWitness','inputs','targetSetOrConstruction','stateExportDependency','fixtureProvenance','rejectedAsUnrelatedReason','blockedSeams','pathOperand','pathOperandWitness']};text="'AGENTS.md'";k=ls[n-1].index(text);e.update(referenceId=identity,matchedExpression=text,sourceSpans=[{'line':n,'columnStart':k+1,'columnEndExclusive':k+len(text)+1,'text':text}],passage='\n'.join(ls[max(0,n-4):n+3]),passageSpan={'startLine':max(1,n-3),'endLine':min(len(ls),n+3)},reason='R3/R6: retained real AGENTS.md read / doctrine scan member; preserve exact Dispatch assertions and removed-door scan.')
   r['authorAddedReferences'].append(e)
(P/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
