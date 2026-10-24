"""Records-only import accounting. --write renders accounting and the four existing ratchet mismatches.
No repository Git mutation, fgOS CLI, secret or live runtime-store access.
"""
import collections, hashlib, json, re, subprocess, sys
from pathlib import Path
P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import2'
def git(*a):return subprocess.check_output(['git',*a],stderr=subprocess.PIPE).decode()
def sha(s):return hashlib.sha256(s.encode() if isinstance(s,str) else s).hexdigest()
def load(p):return json.loads(Path(p).read_text())
def blob(pin,p):
 try:return git('show',pin+':'+p)
 except subprocess.CalledProcessError:return None
def dump(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def ids(s,kind):
 literal=re.findall(r'register'+kind+r'\(\{\s*id:\s*[\'\"]([^\'\"]+)',s)
 loops=[]
 for match in re.finditer(r'for \(const id of \[([^\]]+)\]\) \{\s*register'+kind+r'\(\{ id,',s):
  loops += re.findall(r"'([^']+)'",match[1])
 return sorted(literal+loops)
M=git('rev-parse','bc5589ed7').strip();fp,main=git('show','-s','--format=%P',M).split();base=git('merge-base',fp,main).strip()
changed=git('diff','--name-only',fp,M).splitlines();incoming=[p for p in changed if p.startswith('docs/platform/')]
docpaths=[p for p in changed if p.startswith('docs/')]
provenance=[]
for p in docpaths:
 snapshots={pin:blob(ref,p) for pin,ref in [('base',base),('firstParent',fp),('main',main),('merge',M)]}
 current=Path(p).read_text() if Path(p).is_file() else None
 provenance.append({'path':p,'digests':{pin:sha(s) if s is not None else None for pin,s in snapshots.items()},'currentSha256':sha(current) if current is not None else None,'mergeEqualsMain':snapshots['merge']==snapshots['main'],'mergeEqualsFirstParent':snapshots['merge']==snapshots['firstParent'],'mainPathCommits':git('log','--format=%H %s',fp+'..'+main,'--',p).splitlines()})
# Conflict resolutions are supplied by Lead; witnesses authenticate each parent's exact bytes.
def unreleased(s):return s.split('## [Unreleased]',1)[1].split('\n## [',1)[0]
b=unreleased(blob(base,'CHANGELOG.md'));f=unreleased(blob(fp,'CHANGELOG.md'));m=unreleased(blob(main,'CHANGELOG.md'));merged=unreleased(blob(M,'CHANGELOG.md'))
newlines=lambda s:[l for l in s.splitlines() if l.startswith('- ') and l not in b.splitlines()]
union=list(dict.fromkeys(newlines(f)+newlines(m)));missing=[l for l in union if l not in merged.splitlines()]
assert not missing,missing
registry='docs/platform/packaging-distribution/contracts/setup-doctor-registry.md';regcode=blob(M,'src/setup/registrations.mjs');regdoc=blob(M,registry)
regproof={}
for kind,label,n in [('Check','checks',141),('Fix','fixes',32)]:
 expected=ids(regcode,kind);line=next(l for l in regdoc.splitlines() if l.startswith("Today's registered "+label+':'))
 actual=re.findall(r'`([^`]+)`',line);assert expected==sorted(actual) and len(expected)==n,(kind,len(expected),len(actual))
 # Current candidate inventories AND Data Dictionary remain reconciled.
 current=Path(registry).read_text();cline=next(l for l in current.splitlines() if l.startswith("Today's registered "+label+':'));assert sorted(re.findall(r'`([^`]+)`',cline))==expected
 table=Path('docs/platform/packaging-distribution/spec.md').read_text();row=next(l for l in table.splitlines() if l.startswith('| 7 |' if kind=='Check' else '| 7b |'))
 listed=row.split("Today's registered "+label+': ',1)[1].split('. The registry is open' if kind=='Check' else '. Same rule as #7',1)[0]
 # Nested explanatory code spans are not IDs. Only comma-delimited leading ID entries count.
 actual=re.findall(r'(?:^|, )`([a-z][a-zA-Z0-9-]+)`(?= \(|,|\.|$)',listed)
 assert set(actual)==set(expected),(kind,sorted(set(expected)-set(actual)),sorted(set(actual)-set(expected)))
 regproof[kind]={'count':len(expected),'ids':expected,'mergeRegistryEqual':True,'currentRegistryEqual':True,'currentDataDictionaryEqual':True}
retained='## Retained Distribution Source Detail'
assert blob(fp,registry).split(retained,1)[1]==regdoc.split(retained,1)[1]
conflicts=[{'path':'CHANGELOG.md','resolution':'Lead-provided union, branch entries then main; all parent-new Unreleased bullets conserved','parentNewBulletCount':len(union),'missingBullets':missing,'witnesses':{pin:{'sha256':sha(s),'unreleased':unreleased(s)} for pin,s in [('firstParent',blob(fp,'CHANGELOG.md')),('main',blob(main,'CHANGELOG.md')),('merge',blob(M,'CHANGELOG.md'))]}},
 {'path':registry,'resolution':'Lead regenerated 141 checks and 32 fixes from registrations at merge; git-transport-config renamed git-repository-config; branch retained detail kept','registry':regproof,'retainedDetailEqualFirstParent':True,'witnesses':{pin:{'sha256':sha(s),'content':s} for pin,s in [('firstParent',blob(fp,registry)),('main',blob(main,registry)),('merge',regdoc)]}}]
# Deferred source-context overlaps. Step 3: every physical revision. Step 4/5: frozen canonical catalog.
R=P/'reports/phase-08';catalog=load(R/'step-07-consumer-cutover-matrix.json')['recordCatalog']
files={3:sorted((R/'step-03-records').glob('*.jsonl')),4:[],5:[]}
for e in catalog:
 for step in [4,5]:
  if e['path'].startswith('step-0'+str(step)+'-'):files[step].append(R/e['path'])
changedset=set(changed)|set(load(O/'binding-refresh.json')['authoredCandidatePaths'])
def dependencies(v,pointer=()):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='file' or k in ['sourceRenderProvenance','protectedPins']:yield from literals(x,pointer+(k,))
 elif isinstance(v,list):
  for i,x in enumerate(v):yield from dependencies(x,pointer+(str(i),))
def literals(v,p):
 if isinstance(v,str):
  if v in changedset:yield {'path':v,'pointer':list(p)}
 elif isinstance(v,dict):
  for k,x in v.items():yield from literals(x,p+(k,))
 elif isinstance(v,list):
  for i,x in enumerate(v):yield from literals(x,p+(str(i),))
records={};traversed={}
for step,ff in files.items():
 rows=[];count=0
 for path in sorted(set(ff)):
  for line,raw in enumerate(path.read_text().splitlines(),1):
   d=json.loads(raw);count+=1;deps=list(dependencies(d))
   if deps:rows.append({'recordFile':str(path),'recordLine':line,'recordSha256':sha(raw),'file':d.get('file'),'changedDependencies':deps,'owner':'Documentation source-binding reviewer / Lead','gateId':'source-context-and-post-pin-recomposition','status':'pending final-pin re-location and whole-file recomposition; old judgments/reviews retained as historical'})
 records['step'+str(step)]=rows;traversed['step'+str(step)]=count
deferred={'inputHEAD':git('rev-parse','HEAD').strip(),'merge':M,'scope':'Step 3 all physical revisions; Step 4/5 canonical consumer-matrix batches, only primary file/sourceRenderProvenance/protectedPins dependency keys, never incidental path mentions. No .fgos source bytes read.','traversed':traversed,'counts':{k:len(v) for k,v in records.items()},'records':records}
refresh=load(O/'binding-refresh.json')
unitcat=json.loads(subprocess.check_output(['node',str(O/'extract-units.mjs')],input=json.dumps({'paths':incoming}).encode()))['catalog']
candidateChecks=[{'path':p,'currentSha256':unitcat[p]['fileSha256'],'completeUnitCount':len(unitcat[p]['units']),'effectiveDirectBindingsAtInput':sum(r['target']['targetOwner']==p for r in refresh['checks']),'status':'complete dual-extractor content/ancestry census; bound units checked with placement; zero-bind files retain incoming doc obligation, never a fabricated ledger row'} for p in incoming]
identity='docs/platform/identity/spec.md';section=lambda s:re.search(r'^## 7a[^\n]*\n.*?(?=^## |\Z)',s,re.M|re.S).group(0)
identityScope={'section':'7a Local session (writer id)','mergeSha256':sha(section(blob(M,identity))),'firstParentSha256':sha(section(blob(fp,identity))),'currentEqualsMerge':section(Path(identity).read_text())==section(blob(M,identity)),'interpretation':'Imported signing I4 work does not broaden this task; original local-session writer scope remains bounded in 7a.'}
account={'inputHEAD':git('rev-parse','HEAD').strip(),'decision':'L12-137 / L13-6 / w3-import2-brief; accounting only','merges':[{'merge':M,'firstParent':fp,'main':main,'base':base,'mainCommitCount':len(git('rev-list',fp+'..'+main).splitlines()),'mainCommits':git('log','--format=%H %s',fp+'..'+main).splitlines(),'changedPathCount':len(changed),'changedPaths':changed,'families':dict(sorted(collections.Counter(p.split('/')[0] for p in changed).items())),'changedDocumentation':docpaths,'documentationProvenance':provenance,'leadResolvedConflicts':conflicts}],'incomingPlatformPaths':incoming,'identity7aScopeWitness':identityScope,'candidateChecks':candidateChecks,'step0':{'method':'Both unchanged frozen extractors agree. Authenticate each preimage by full native digest; resolve by content + self-inclusive ancestry with before/after full neighbour witnesses; never ordinal alone. Historical overlay predecessors are excluded, not rewritten.','checkedEffectiveDirectBindings':len(refresh['checks']),'changedRowsIncludingPlacement':len(refresh['changes']),'shards':len(refresh['outputs']),'witnesses':'binding-refresh.json','independentReview':'pending'},'deferredOverlaps':'deferred-rebinds.json','limits':['No content/authority approval or cutover; no pair accounting, repository Git mutation or Work lifecycle verbs.','Impact-analysis degraded/unqueried under no-CLI brief; no product symbol edited.','Frozen review/gate/recipe projections are historical; owners must rejoin the changed effective rows at final pin.'],'needsWrites':[]}
assert account['merges'][0]['mainCommitCount']==233
if (O/'checks.json').exists():
 checks=load(O/'checks.json')['checks'];censuscheck=next(c for c in checks if c['name']=='undeclared-census');assert censuscheck['exit']==0
 account['census']=json.loads(censuscheck['stdout']);account['census']['owningCheck']='checks.json#/checks/5'
 account['sourceResync']={'shard':'ledger/decisions/s16-import2-resync.json','freshSourceBindings':17,'legacyFileCount':33,'missingCurrentChangedUnits':0,'owningCheck':'checks.json#/checks/1','independentReview':'pending'}
ratchet=load('scripts/check-legacy-docs-ratchet.exceptions.json');mismatches=[]
for e in ratchet['exceptions']:
 p=Path(e['path'])
 if not p.is_file():continue
 digest=sha(p.read_bytes())
 current=next((r for r in ratchet.get('mainMergeAccounting',{}).get('rows',[]) if r['path']==str(p)),e)
 if current['expectedDigest']!=digest:
  assert str(p) in ['docs/specs/distribution.md','docs/specs/observe.md','docs/specs/reading-map.md','docs/specs/runner.md']
  assert blob(M,str(p))==p.read_text()
  mismatches.append({'path':str(p),'kind':e['kind'],'owner':e['owner'],'revisitTrigger':'Phase 09 final conservation/cutover','rationale':'bc5589ed7 main import; exact parent/base/path provenance in reports/phase-09/import2/merge-accounting.json. Current source carriage/rebindings authored, independent review pending; no content or authority approval.','approvedBy':'Lead w3-import2-brief / L12-137 and L13-6, digest accounting only','expectedDigest':digest,'reviewedAt':'2026-10-24','ratchetScope':'active-exception'})
if '--write' in sys.argv:
 dump(O/'merge-accounting.json',account);dump(O/'deferred-rebinds.json',deferred)
 if mismatches:
  ratchet['previousMainMergeAccounting']={'inputCommit':git('rev-parse','HEAD').strip(),'path':'scripts/check-legacy-docs-ratchet.exceptions.json','commit':ratchet['mainMergeAccounting']['commit'],'objectSha256':sha(json.dumps(ratchet['mainMergeAccounting'],ensure_ascii=False,separators=(',',':'))),'meaning':'Previous mainMergeAccounting retained at the exact input commit; objectSha256 is SHA256 of JSON.stringify(mainMergeAccounting). All exception rationales retained verbatim.'}
  ratchet['mainMergeAccounting']={'commit':M,'authorization':'Lead reports/phase-09/w3-import2-brief.md / L12-137 / L13-6','meaning':'Only the four existing main-import digest mismatches are refreshed. Original exception rows and ratchet baseline are unchanged. Digest accounting is not content approval or authority cutover.','rows':mismatches}
  # Existing exception entries are the checker inputs; mainMergeAccounting is provenance, not a second authority.
 if ratchet['mainMergeAccounting']['commit']==M:
  for row in ratchet['mainMergeAccounting']['rows']:
   original=next(e for e in ratchet['exceptions'] if e['path']==row['path'])
   original['expectedDigest']=row['expectedDigest']
  dump('scripts/check-legacy-docs-ratchet.exceptions.json',ratchet)
print(json.dumps({'commits':account['merges'][0]['mainCommitCount'],'changedPaths':len(changed),'candidatePaths':len(incoming),'deferred':deferred['counts'],'registryChecks':141,'registryFixes':32,'ratchetMismatches':len(mismatches)}))
