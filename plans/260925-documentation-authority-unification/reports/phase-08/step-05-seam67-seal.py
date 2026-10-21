"""Seal final record/proof/scope evidence; no git write and no consumer execution."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,ast,time
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
proof=read('step-05-seam67-final-proof.json');assert proof['ok'] and not proof['failures'] and proof['negativeProbesPassed']==proof['negativeProbesTotal']>=328
for e in proof['proofs']:
 assert e['exit']==0 and e['resultFresh'] and e['ok']
 for key in ['source','log','result']:assert sha(ROOT/e[key+'Path'])==e[key+'Sha256']
 assert (ROOT/e['sourcePath']).stat().st_mtime_ns<=e['startedAtNs']
full=read('step-05-seam67-full-check.json');assert (full['files'],full['literalReferences'],full['dynamicTuples'],full['failureCount'])==(1030,4935,31510,0)
closure=read('step-05-seam67-closure.json');specs=read('step-05-seam67-cutover-specs.json');closure['patchCoCutUnits']=specs['patches'];closure['verification']={'fullChecker':{k:full[k] for k in ['files','literalReferences','dynamicTuples','failureCount']},'negativeProbesPassed':proof['negativeProbesPassed'],'negativeProbesTotal':proof['negativeProbesTotal'],'currentOwningTests':59};save('step-05-seam67-closure.json',closure)
# Keep current seam5 dependency inventories truthful after Task0, preserving its old authoring delta.
oldclosure=read('step-05-seam5-closure.json')
proc=subprocess.run([sys.executable,'-B',str(P/'step-05-seam5-batch7-closure.py')],cwd=ROOT,text=True,capture_output=True);assert proc.returncode==0,proc.stderr
updated=read('step-05-seam5-closure.json');updated['previousAuthoringDelta']=oldclosure.get('previousAuthoringDelta',oldclosure['addedThisTurn']);updated['addedThisTurn']={'files':0,'references':0,'tuples':0,'supplementalSlots':0,'description':'Task0 reviews existing records; no new seam5 file is authored.'};updated['task0ReviewClosure']='step-05-seam67-task0-closure.json';updated['closureProofs']={'fullChecker':'step-05-seam67-full-check.json','rejectingProbes':'step-05-seam67-final-proof.json'};save('step-05-seam5-closure.json',updated)
listing=read('step-05-seam67-review-list.json');rs=[json.loads(l) for s in ['ui-spec-compiler','citation-ratchet-roots'] for l in (P/'step-05-records'/(s+'.jsonl')).open()];assert len(rs)==35
for r in rs:
 entry=next(e for e in listing['canonicalRecords'] if e['file']==r['file']);assert hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==entry['recordSha256']
assert read('step-05-seam67-current-proof.json')['tests']==59
# Final owner/progress text reports only the completed real verification.
f=P/'owner-answers.md';s=f.read_text();old='Full fresh checker/probe verification is being finalized in `step-05-seam67-final-proof.json`; no passing global result is inferred before that receipt completes.';new=f"Fresh full checker: **1,030 records / 4,935 references / 31,510 tuples / 0 failures**; **{proof['negativeProbesPassed']}/{proof['negativeProbesTotal']} negative probes reject**, with 15/15 root-positive checks. Raw source/log/result hashes and freshness are bound in `step-05-seam67-final-proof.json` and `step-05-seam67-verification.json`.";assert old in s or new in s;f.write_text(s.replace(old,new))
f=P/'progress.md';s=f.read_text();s+='\n## Seam 6/7 author handback\nTask0 review closure and both complete seams are authored. Final checker: 1,030 records / 4,935 references / 31,510 tuples / 0 failures. Negative probes: '+str(proof['negativeProbesPassed'])+'/'+str(proof['negativeProbesTotal'])+' reject; current citation/ratchet suites 59/59; exact retired-corpus/RUL11 scratch replay passes on both sides. Independent review, 36 new-seam parks, Step7 composition and Phase9 parity remain open. No product/code/docs/tests/skills/baseline or runtime-* record edit; no git write, fgOS CLI, build, cargo, service or live-state/secrets access.\n';f.write_text(s)
summary='''# Compiler and citation consumer records — author handback

Task0 is closed in the records: 32 old files / 168 changed items, split into 8 disposition-changing and 24 label-only files. The direct L94 and transitive L163 governance readers are in one R26 unit. R27 names the real outside-census fanout skill read; R28 joins fixed-path outputs, comments and fixture co-changes. Current review hashes/deltas and the 43 proposed-move units (90 readers over 17 files) are regenerated. The existing inventory prefix classifier owner is confirmed; the store plan reader remains an explicit seam8 carry.

Both new seams are complete: 25 compiler files plus 10 citation/ratchet files; 1,313 original references, 849 original tuples and 17 supplemental source slots. Counts including supplemental slots: 1,222 admitted, 957 rejected; 36 parks, two patch items, 2,116 preserves and 25 render joins. No mechanical/neutral closure is claimed without proof. Complete pinned source bytes: 1,328,645; canonical two-shard record payload: about 71 MB of canonical JSONL (including full physical-line contexts). Review parts are not packed here; Lead owns the source windows/generated-file packing and review budget.

The two exact forward/inverse patches only correct product-source comments in YAML configs. Retained docs/ui-spec roots and parsed config values stay unchanged. Generated HTML follows its exact source owners and historical stale-input witness. The runtime verifier ignores --root and targets an absent frontend/docs/ui-spec path; the candidate architecture directory lacks its default schema. These are recorded facts, not repaired tools or claimed parity. Literal and escaped test grep for the patched comment pointer has no matches.

Citation source L96, both renders, checker defaults, documented commands and frozen baseline/exception inputs stay one cutover packet. Candidate scan coverage after deletion is missing; DecisionF ratchet retirement is an explicit Phase9 obligation. No rebaseline, new exception kind or checker implementation change absorbs migration output.

'''+f"Verification: full checker 1,030 records / 4,935 references / 31,510 tuples / 0 failures; {proof['negativeProbesPassed']}/{proof['negativeProbesTotal']} negative probes reject; root-positive checks 15/15; current owning checker suites 59/59. The retired-corpus/RUL11 exact current/candidate scratch replay passes and is attached to its patch specification, with parked legacy inputs retained. No composed post-retirement, UI tool/build, full npm/cargo or installed-release parity is claimed.\n\n"+'''Entry artifacts: [closure](step-05-seam67-closure.json), [review list](step-05-seam67-review-list.json), [Task0 delta](step-05-seam67-task0-closure.json), [parity receipts](step-05-seam67-parity-receipts.json), [cutover specs](step-05-seam67-cutover-specs.json), [source traces](step-05-seam67-source-traces.json), [final proof](step-05-seam67-final-proof.json), [verification](step-05-seam67-verification.json). Independent review, park decisions, final-pin composition and Phase9 proof remain owed. Markdown preview remains with Lead. needsWrites: [].
'''
(P/'step-05-seam67-handback.md').write_text(summary)
# All actual mutations remain under the authorized report directory.
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()+subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines();assert all(f.startswith(str(P.relative_to(ROOT))+'/') for f in changed);assert not any(pathlib.PurePosixPath(f).name.startswith(('runtime-','step-05-seam8-')) for f in changed)
for f in changed:
 path=ROOT/f
 if path.suffix=='.py':ast.parse(path.read_text())
 if path.suffix=='.json':json.loads(path.read_text())
 if path.suffix=='.jsonl':
  for line in path.open():json.loads(line)
pr=subprocess.run(['git','diff','--check'],cwd=ROOT,text=True,capture_output=True);assert pr.returncode==0,pr.stdout+pr.stderr
artifacts=['step-05-records/ui-spec-compiler.jsonl','step-05-records/citation-ratchet-roots.jsonl','step-05-seam67-review-list.json','step-05-seam67-task0-closure.json','step-05-seam67-closure.json','step-05-seam67-cutover-specs.json','step-05-seam67-parity-receipts.json','step-05-seam67-source-traces.json','step-05-seam67-caller-corrections.json','step-05-seam67-whole-file-reads.json','step-05-seam67-inventory-owner-confirmation.json','step-05-seam67-documented-commands.json','step-05-proposed-move-read-units.json','step-05-seam5-review-list.json','step-05-seam5-closure.json','step-05-seam67-final-proof.json','step-05-seam67-current-proof.json','step-05-seam67-r22-patch-replay.json','step-05-seam67-handback.md']
checkers=sorted(set(P.glob('step-05*check.py'))|set(P.glob('step-05*rules.py'))|set(P.glob('step-05*probes.py'))|{P/'step-05-seam4-callers.py',P/'step-05-seam67-callers.py'})
out={'ok':True,'verifiedAtNs':time.time_ns(),'fullChecker':{k:full[k] for k in ['files','literalReferences','dynamicTuples','failureCount']},'negativeProbesPassed':proof['negativeProbesPassed'],'negativeProbesTotal':proof['negativeProbesTotal'],'currentTests':59,'seam67Totals':closure['totals'],'task0':read('step-05-seam67-task0-closure.json')['counts'],'scope':{'allChangesInsideAuthorizedReportDirectory':True,'noRuntimeShardOrSeam8ArtifactEdited':True,'syntaxPass':True,'diffCheckPass':True,'needsWrites':[]},'checkerSources':[{'path':str(f.relative_to(ROOT)),'sha256':sha(f)} for f in checkers],'artifacts':[{'path':str((P/f).relative_to(ROOT)),'sha256':sha(P/f),'bytes':(P/f).stat().st_size} for f in artifacts],'limits':'Author structural verification only; independent review, retention/move decisions, Step7 composition, UI/candidate scan parity and Phase9 full-suite proof remain owed.'};save('step-05-seam67-verification.json',out);print(json.dumps({k:v for k,v in out.items() if k not in ['checkerSources','artifacts']}))
