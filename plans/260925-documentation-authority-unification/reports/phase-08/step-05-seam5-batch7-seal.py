"""Bind final source, result, log, conservation and scope evidence without committing."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,ast,time
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
proof=read('step-05-seam5-batch7-final-proof.json');assert proof['ok'] and not proof['failures']
for e in proof['proofs']:
 assert e['exit']==0 and e['resultFresh'] and e['ok']
 for key in ['source','log','result']:assert sha(ROOT/e[key+'Path'])==e[key+'Sha256']
first=proof['proofs'][0]['startedAtNs'];scripts=set(P.glob('step-05*check.py'))|set(P.glob('step-05*rules.py'))|set(P.glob('step-05*probes.py'))|{P/'step-05-seam5-batch7-deferred.py',P/'step-05-seam5-batch7-relocation-audit.py'}
assert all(f.stat().st_mtime_ns<=first for f in scripts),'checker/probe source changed after final verification started'
full=read('step-05-seam5-batch7-full-check.json');assert full['files']==995 and full['literalReferences']==3622 and full['dynamicTuples']==30661 and full['failureCount']==0
closure=read('step-05-seam5-closure.json');queue=read('step-05-seam5-continuation.json');assert queue['remainingFilesInOrder']==[] and closure['remainingFiles']==[]
rs={json.loads(l)['file']:json.loads(l) for f in (P/'step-05-records').glob('tests-*.jsonl') for l in f.read_text().splitlines()};assert len(rs)==closure['totals']['files']==704
parked={(r['file'],e.get('referenceId',e.get('id'))) for r in rs.values() for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e['disposition']=='parked'};assert parked=={(e['file'],e['id']) for g in closure['parkDependencies'] for e in g['items']}
for e in [e for g in closure['parkDependencies'] for e in g['items']]+closure['patchCoCutUnits']:
 r=rs[e['file']];assert hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==e['record']['recordSha256']
for r in rs.values():
 if r.get('wholeFileRead'):assert r['file'] and r['sourceSha256']
assert read('step-05-seam5-batch7-relocation-audit.json')['differenceCount']==0
# All pre-existing canonical record files stay untouched; only the new shard is authored.
assert subprocess.check_output(['git','diff','--name-only','--',str(P/'step-05-records')],cwd=ROOT,text=True)==''
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()+subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines();assert all(f.startswith(str(P.relative_to(ROOT))+'/') for f in changed)
for f in changed:
 path=ROOT/f
 if path.suffix=='.py':ast.parse(path.read_text())
 if path.suffix=='.json':json.loads(path.read_text())
 if path.suffix=='.jsonl':
  for line in path.read_text().splitlines():json.loads(line)
pr=subprocess.run(['git','diff','--check'],cwd=ROOT,text=True,capture_output=True);assert pr.returncode==0,pr.stdout+pr.stderr
artifacts=['step-05-records/tests-judgment-batch7.jsonl','step-05-seam5-batch7-parity-receipts.json','step-05-seam5-batch7-whole-file-reads.json','step-05-seam5-batch7-neutrality-first.json','step-05-seam5-batch7-deferred-replays.json','step-05-seam5-batch7-relocation-audit.json','step-05-seam5-closure.json','step-05-seam5-continuation.json','step-05-seam5-review-list.json','step-05-seam5-batch7-final-proof.json','step-05-seam5-batch7-prompt-replay-manifests.json','step-05-seam5-batch7-worker-replay-manifests.json','step-05-seam5-batch7-pure-reader-replay.log']
out={'ok':True,'verifiedAtNs':time.time_ns(),'checker':{k:full[k] for k in ['files','literalReferences','dynamicTuples','failureCount']},'negativeProbes':{'passed':proof['negativeProbesPassed'],'total':proof['negativeProbesTotal']},'closureTotals':closure['totals'],'addedThisTurn':closure['addedThisTurn'],'remaining':0,'scope':{'allChangesInsideAuthorizedReportDirectory':True,'oldCanonicalRecordFilesUnchanged':True,'syntaxPass':True,'diffCheckPass':True,'needsWrites':[]},'sourceFiles':[{'path':str(f.relative_to(ROOT)),'sha256':sha(f)} for f in sorted(scripts)],'artifacts':[{'path':str((P/f).relative_to(ROOT)),'sha256':sha(P/f),'bytes':(P/f).stat().st_size} for f in artifacts],'limits':'Author structural proof only; independent review, 59 parks, Step 7 composition and Phase 9 full-suite / four R25 replays remain owed.'}
(P/'step-05-seam5-batch7-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k not in ['sourceFiles','artifacts']},ensure_ascii=False))
