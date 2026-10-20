#!/usr/bin/env python3
"""Serial light proof, protected bytes and exact author write scope; no commits."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,os,subprocess,datetime,time,ast
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m

def main():
 env=dict(os.environ);env.pop('CLAUDE_CODE_SESSION_ID',None);env['TMPDIR']='/tmp/fgos-work'
 commands=[('whitespace',['git','diff','--check']),('legacy-ratchet',['node','scripts/check-legacy-docs-ratchet.mjs']),('light-tests',['env','-u','CLAUDE_CODE_SESSION_ID','node','--test','test/scripts/doc-link-pass.test.mjs','test/scripts/check-doc-candidate-status.test.mjs','test/scripts/check-doc-constitution.test.mjs','test/scripts/generate-shipped-path-inventory.test.mjs','test/setup/instruction-registry.test.mjs','test/setup/instruction-composition.test.mjs','test/setup/instruction-projections.test.mjs'])]
 receipts=[]
 for name,cmd in commands:
  start=time.time();run=subprocess.run(cmd,cwd=m.ROOT,env=env,capture_output=True)
  (P/f'step-04-wave1-{name}.stdout.log').write_bytes(run.stdout);(P/f'step-04-wave1-{name}.stderr.log').write_bytes(run.stderr)
  receipts.append({'name':name,'argv':cmd,'exitCode':run.returncode,'elapsedSeconds':round(time.time()-start,3),'stdout':f'step-04-wave1-{name}.stdout.log','stderr':f'step-04-wave1-{name}.stderr.log','CLAUDE_CODE_SESSION_ID':'unset','TMPDIR':'/tmp/fgos-work'})
 # Read-only comparison against the author tree. This does not claim the
 # separate committed-byte L12-11 accounting that only Lead can perform.
 tracked=m.git('diff','--name-only',q.PIN).decode().splitlines();untracked=m.git('ls-files','--others','--exclude-standard').decode().splitlines();writes=sorted(set(tracked+untracked));prefix=str(m.REL)+'/'
 outscope=[f for f in writes if not f.startswith(prefix)]
 protected=[]
 names=['docs/transitional-switchboard.md','scripts/check-legacy-docs-ratchet.mjs','scripts/generate-shipped-path-inventory.mjs','scripts/list-doc-anchors.mjs','scripts/generate-doc-inventory.mjs',str(m.REL/'step-03-check.py'),str(m.REL/'step-03-resolve.py')]
 # Every pre-existing artifact in this write scope is immutable except the
 # explicitly requested progress update. Include all Step 3 records/requests.
 names+=m.git('ls-tree','-r','--name-only',q.PIN,'--',str(m.REL)).decode().splitlines()
 for f in sorted(set(names)):
  if f==str(m.REL/'progress.md'):continue
  before=m.sha(m.blob(q.PIN,f));after=m.sha((m.ROOT/f).read_bytes());protected.append({'file':f,'inputSha256':before,'currentSha256':after,'unchanged':before==after})
 q.save('step-04-wave1-protected-bindings.json',{'inputCommit':q.PIN,'bindings':protected,'changed':[x for x in protected if not x['unchanged']]})
 rs=q.load();check=q.read('step-04-wave1-check-result.json');probes=q.read('step-04-wave1-probes-result.json');parts=q.read('step-04-wave1-review-index.json');selection=q.read('step-04-wave1-selection.json')
 for path in sorted(P.glob('step-04*.py')):ast.parse(path.read_text(),filename=str(path))
 partProof=[]
 for x in parts:
  data=(P/x['payload']).read_bytes();payload=json.loads(data);partProof.append({'part':x['part'],'bytes':len(data),'slots':payload['joinedSlots'],'pass':len(data)==x['bytes'] and len(data)<=400000 and m.sha(data)==x['payloadSha256'] and payload['joinedSlots']<=60})
 result={'inputCommit':q.PIN,'completedBatches':check['checkedBatches'],'stopBoundary':'step04-016 complete; step04-017..033 not authored. Remaining turn context reserved for full replay, probes, frozen review packet and handoff; no partial next batch.','records':check['files'],'consumerFiles':check['consumerFiles'],'slots':check['edges'],'dispositions':check['dispositions'],'checkerFailureCount':check['failureCount'],'openLeadRulingEdges':check['openLeadRulingEdges'],'probes':{'passed':probes['passed'],'total':probes['total'],'allPassed':probes['allPassed']},'sourceFilesWithDiff':sum(bool(r['diff']) for r in rs),'sourcePatchSlots':sum(not e['renderOnly'] and e['disposition']=='patch' for r in rs for e in r['edges']),'renderPatchJoins':sum(e['renderOnly'] and e['disposition']=='patch' for r in rs for e in r['edges']),'A51':{'patchedPopulation':sum(len(x['population']) for x in selection),'patchedSample':sum(len(x['sample']) for x in selection),'unpatchedSample':sum(len(x['unpatchedSample']) for x in selection),'mandatorySources':sum(len(x['mandatoryWitnesses']) for x in selection),'distinctSelectedSources':sum(len(x['selected']) for x in selection),'perSet':'step-04-wave1-selection.json','independentReviewed':0,'reworkNumerator':None,'reworkDenominator':None},'reviewParts':partProof,'commands':receipts,'writes':writes,'outOfScopeWrites':outscope,'protectedBindingCount':len(protected),'protectedDrift':[x for x in protected if not x['unchanged']],'zeroEdgeCoverageFiles':len(q.read('step-04-wave1-zero-edge-coverage.json')),'noConsumerEdits':not outscope,'generatorRuns':0,'gitMutations':0,'fgosCliInvocations':0,'reviewersStarted':0,'pairAccountingParts':0,'committedByteAcceptance':'Pending runner commit and ordinary L12-11 Lead accounting; no guessed commit or post-commit reproduction claim','knownLeadBaseline':'L12-58: one existing D6 citation failure on main in decision-citation-drift; this wave does not edit docs/backlog.md or claim that separate suite green.','preview':'Not started: MDView MCP unavailable, and CLI preview was omitted to honor the assignment’s strict write scope. Markdown is available directly.','reviewerBudget':{'elapsedSeconds':0,'remainingSeconds':None,'status':'Lead must allocate; no independent review started'},'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 result['pass']=check['failureCount']==0 and probes['allPassed'] and all(c['exitCode']==0 for c in receipts) and not outscope and not result['protectedDrift'] and all(x['pass'] for x in partProof)
 q.save('step-04-wave1-verification.json',result);print(json.dumps({k:result[k] for k in ['pass','records','consumerFiles','slots','dispositions','A51','outOfScopeWrites','protectedBindingCount','reviewParts']},ensure_ascii=False));return not result['pass']
if __name__=='__main__':raise SystemExit(main())
