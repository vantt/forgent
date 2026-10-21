"""Seal executed proof, unchanged inputs and scoped author handback; never commit."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,ast,time,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
frozen=read('step-05-seam5-b6-review-frozen-inputs.json')
for e in frozen['files']:assert sha(ROOT/e['path'])==e['sha256'],'input changed after freeze: '+e['path']
basecmd=read('step-05-seam5-b6-review-baseline-command.json');assert basecmd['exit']==0
full=read('step-05-seam5-b6-closure-clean-check.json');assert full['failureCount']==0 and (full['files'],full['literalReferences'],full['dynamicTuples'])==(995,3622,30661)
assert (ROOT/basecmd['resultPath']).stat().st_mtime_ns>=basecmd['startedAtNs'] and sha(ROOT/basecmd['sourcePath'])==basecmd['sourceSha256']
probe=read('step-05-seam5-b6-review-probe-proof.json');assert probe['ok'] and len(probe['proofs'])==10 and not probe['failures']
for e in probe['proofs']:
 assert e['exit']==0 and e['resultFresh'] and e['ok']
 for k in ['source','result','log']:assert sha(ROOT/e[k+'Path'])==e[k+'Sha256']
 assert (ROOT/e['resultPath']).stat().st_mtime_ns>=e['startedAtNs']
base={'label':'full-check','command':basecmd['command'],'environment':basecmd['environment'],'startedAtNs':basecmd['startedAtNs'],'exit':basecmd['exit'],'resultFresh':True,'ok':True,'sourcePath':basecmd['sourcePath'],'sourceSha256':basecmd['sourceSha256'],'logPath':basecmd['logPath'],'logSha256':sha(ROOT/basecmd['logPath']),'resultPath':basecmd['resultPath'],'resultSha256':sha(ROOT/basecmd['resultPath']),'counts':{k:full[k] for k in ['files','literalReferences','dynamicTuples','failureCount']}}
proofs=[base]+probe['proofs'];passed=sum(e['counts'].get('passed',0) for e in proofs);total=sum(e['counts'].get('total',0) for e in proofs);assert passed==total
# The historical canonical result filename is a byte-identical alias of this
# executed clean result, not a claim that another command was run.
(P/'step-05-seam5-batch7-full-check.json').write_bytes((ROOT/basecmd['resultPath']).read_bytes())
final={'ok':True,'proofs':proofs,'negativeProbesPassed':passed,'negativeProbesTotal':total,'failures':[],'scope':'All eleven current proof families include the full integrated checker and ten probe families; R26 owns only its eight new unit mutations, R22/R25 own patch/replay mutations. Semantic acceptance and Phase 9 execution remain pending.'};save('step-05-seam5-batch7-final-proof.json',final)
closure=read('step-05-seam5-closure.json');units=read('step-05-proposed-move-read-units.json');journal=read('step-05-seam5-b6-review-closure.json');ix=read('step-05-seam5-review-list.json');q=read('step-05-seam5-continuation.json');assert not q['remainingFilesInOrder'] and not closure['remainingFiles'] and len(closure['deferredReplayObligations'])==6
assert units['unitCount']==43 and units['unitsWithReaders']==6 and units['readerCount']==73 and units['readerFiles']==16
# Verify closure locators, current record hashes and complete park population.
rs={json.loads(l)['file']:json.loads(l) for f in (P/'step-05-records').glob('tests-*.jsonl') for l in f.open()};actual={(r['file'],e.get('referenceId',e.get('id'))) for r in rs.values() for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked'}
assert actual=={(e['file'],e['id']) for g in closure['parkDependencies'] for e in g['items']}
for e in [e for g in closure['parkDependencies'] for e in g['items']]+closure['patchCoCutUnits']:
 assert hashlib.sha256(json.dumps(rs[e['file']],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==e['record']['recordSha256']
# Read-only scope and syntax checks over all actual changes.
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()+subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines();prefix=str(P.relative_to(ROOT))+'/';assert all(f.startswith(prefix) for f in changed)
for f in changed:
 path=ROOT/f
 if path.suffix=='.py':ast.parse(path.read_text())
 if path.suffix=='.json':json.loads(path.read_text())
 if path.suffix=='.jsonl':
  for line in path.read_text().splitlines():json.loads(line)
pr=subprocess.run(['git','diff','--check'],cwd=ROOT,text=True,capture_output=True);assert pr.returncode==0,pr.stdout+pr.stderr
# Finish prose after proof, without altering any frozen checker inputs.
h=P/'step-05-seam5-batch7-handback.md';s=h.read_text();old='Verification is running; this paragraph will be replaced with fresh checker/probe totals and the final hash receipt.';assert old in s
s=s.replace(old,f'Fresh integrated checker: **995 records / 3,622 original references / 30,661 original tuples / 0 failures**. **{passed}/{total} negative probes reject**, including prompt and eight R26 unit mutations. All per-family commands, exits, fresh result hashes and raw log hashes are bound by `step-05-seam5-batch7-verification.json`; 71 canonical inputs/checker sources stayed byte-identical throughout the final verification. The root positive probes and HEAD-only drift positives pass under their owning families. The later two-failure recheck (overbroad direct-read candidate and duplicate blocker list) is retained as `step-05-seam5-b6-closure-second-check.json` and is superseded by the fresh zero-failure run. Five repeated patch/replay mutants were removed from the new R26 family because the existing R22/R25 probes already own those contracts.');h.write_text(s)
with (P/'progress.md').open('a') as f:f.write(f'\n\n## L12-83 closure — completed author handback (2026-10-21)\n\nClosed requested review rework and all-seam R26 sweep as records only. R26: 43 units, six active reader units, 73 reader/default/output slots across 16 files. Seam 5 authoring remains complete at 704 files / 1,203 refs / 25,007 tuples, 1,117 supplemental slots, 82 parks, 23 patch items in 11 files; six exact R25 deferred replays. Fresh full checker: 995 records / 3,622 refs / 30,661 tuples / zero failures. Every probe family passes: {passed}/{total} negative mutants reject; required positives pass. Final source/log/result hashes and 71 frozen input hashes verified. All actual changes remain in the authorized report directory; syntax and git diff --check pass. No product source/docs/test/skill/baseline edit, fgOS CLI, git write, live-state/secrets read or semantic acceptance claimed. Initial failures remain visible. Runner owns the commit; Lead owns independent windows (including authorAddedReferences), park decisions, Step 7 composition and Phase 9 full-suite/replay proof. See step-05-seam5-batch7-handback.md and verification.json; needsWrites [].\n')
with (P/'owner-answers.md').open('a') as f:f.write(f'\nL12-83 final measured proof: full checker 995 records / 3,622 refs / 30,661 tuples / 0 failures; all {passed}/{total} negative mutations reject. R26 43 units, six with 73 reader/default/output slots over 16 files. Seam 5 has 82 parks grouped under 34 dependencies; six deferred replays. Final evidence: step-05-seam5-batch7-verification.json. Author closure only.\n')
artifacts=['step-05-seam5-batch7-final-proof.json','step-05-seam5-batch7-full-check.json','step-05-seam5-closure.json','step-05-proposed-move-read-units.json','step-05-seam5-b6-review-closure.json','step-05-seam5-b6-review-cutover-specs.json','step-05-seam5-review-list.json','step-05-seam5-batch7-deferred-replays.json','step-05-seam5-b6-review-replay-manifests.json','step-05-seam5-batch7-handback.md','progress.md','owner-answers.md']
verification={'ok':True,'verifiedAtNs':time.time_ns(),'proofs':proofs,'checker':{k:full[k] for k in ['files','literalReferences','dynamicTuples','failureCount']},'negativeProbes':{'passed':passed,'total':total},'closureTotals':closure['totals'],'R26':{k:units[k] for k in ['unitCount','unitsWithReaders','readerCount','readerFiles']},'reviewChanges':journal['counts'],'seam5ReviewChanges':{k:len(v) for k,v in ix['changedThisTurn'].items()},'remaining':0,'frozenInputs':frozen,'scope':{'allChangesInsideAuthorizedReportDirectory':True,'consumerFilesUnchanged':True,'canonicalRecordCorrectionsAuthorized':True,'syntaxPass':True,'diffCheckPass':True,'needsWrites':[]},'artifacts':[{'path':str((P/f).relative_to(ROOT)),'sha256':sha(P/f),'bytes':(P/f).stat().st_size} for f in artifacts],'limits':'Independent semantic review, 82 seam5 parks, Step 7 final composition, six R25 full replays and Phase 9 npm/cargo/runtime/state/generator parity remain owed. A current-only profile scratch failure is explicitly retained; no forbidden config was copied or invented.'};save('step-05-seam5-batch7-verification.json',verification)
print(json.dumps({'ok':True,'checker':verification['checker'],'negativeProbes':verification['negativeProbes'],'R26':verification['R26'],'scope':verification['scope']},ensure_ascii=False))
