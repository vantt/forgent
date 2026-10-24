"""Read-only merge/Step 0 accounting, adapted from import2/account.py.
Only writes this turn's import3 reports; never repairs rows or refreshes the ratchet.
Run from repository root with python3 -B.
"""
import collections
import json
import subprocess
import sys
from pathlib import Path
P = Path('plans/260925-documentation-authority-unification')
O = P/'reports/phase-09/import3'
sys.path.insert(0, str(P/'reports/phase-09/ledgerfix'))
from bindings import documents, rows, supersessions, effective, payload, digest, sha, KEYS

def git(*args):
    return subprocess.check_output(['git', *args], stderr=subprocess.PIPE).decode()

def blob(pin, path):
    try:
        return git('show', pin+':'+path)
    except subprocess.CalledProcessError:
        return None

def dump(name, data):
    (O/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')

head = git('rev-parse', 'HEAD').strip()
merge = git('rev-parse', '571a996f5').strip()
fp, main = git('show', '-s', '--format=%P', merge).split()
base = git('merge-base', fp, main).strip()
changed = git('diff', '--name-only', fp, merge).splitlines()
main_changed = git('diff', '--name-only', base, main).splitlines()
docpaths = [p for p in changed if p.startswith('docs/') or p in ('AGENTS.md', 'CLAUDE.md')]
incoming = [p for p in changed if p.startswith('docs/platform/')]
provenance = []
for p in docpaths:
    snapshots = {k: blob(pin, p) for k, pin in [('base', base), ('firstParent', fp), ('main', main), ('merge', merge)]}
    equal_main = snapshots['merge'] == snapshots['main']
    equal_fp = snapshots['merge'] == snapshots['firstParent']
    provenance.append(dict(path=p, digests={k: sha(v) if v is not None else None for k,v in snapshots.items()},
        currentSha256=sha(Path(p).read_bytes()) if Path(p).is_file() else None,
        mergeEqualsMain=equal_main, mergeEqualsFirstParent=equal_fp,
        resolution='Main bytes retained verbatim' if equal_main else 'First-parent bytes retained verbatim' if equal_fp else 'Retains first-parent documentation-cutover additions alongside incoming main edits; exact main-to-merge and first-parent-to-merge witnesses below. Accounting is not current-truth approval.',
        mainPathCommits=git('log', '--format=%H %s', fp+'..'+main, '--', p).splitlines(),
        firstParentToMergePatch=git('diff', '--no-ext-diff', fp, merge, '--', p),
        mainToMergePatch=git('diff', '--no-ext-diff', main, merge, '--', p)))
assert len(incoming)==4
assert len(git('rev-list', fp+'..'+main).splitlines())==69
# Same adapter/byte-frozen extractors and four-key serialization as import2.
legacy=['docs/specs/confinement-authority.md','docs/specs/reading-map.md','docs/specs/seat-binding.md']
oldscan=json.loads((P/'reports/phase-09/late-areas/legacy-drift.json').read_text())
source_targets={r['sourcePath']:[t['path'] for t in r['candidateSuccessors']] for r in oldscan['records'] if r['sourcePath'] in legacy}
paths=sorted(set(incoming+legacy+[t for ts in source_targets.values() for t in ts]))
request={'paths':paths,'virtual':[dict(path='first-parent-'+str(i)+'.md',content=blob(fp,p)) for i,p in enumerate(incoming)]}
data=json.loads(subprocess.check_output(['node',str(O/'extract-units.mjs')],input=json.dumps(request).encode()))
cat=data['catalog']
docs=documents(); links=supersessions(docs)
allrows=[(f,p,r) for f,d in docs.items() for p,r in rows(d)]
def witness(units, unit):
    i=units.index(unit)
    return dict(selected=unit,previous=units[i-1] if i else None,next=units[i+1] if i+1<len(units) else None)
checks=[]; historical=[]
for f,p,row in allrows:
    if row.get('targetOwner') not in incoming or not row.get('targetAnchor'):continue
    if effective(f,p,row,docs,links)[:2]!=(f,p):
        historical.append(dict(shard=f,pointer=p));continue
    units=cat[row['targetOwner']]['units']
    matches=[u for u in units if u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest']]
    exact_elsewhere=[u for u in units if u['textDigest']==row['targetUnitDigest']]
    before=cat['first-parent-'+str(incoming.index(row['targetOwner']))+'.md']['units']
    preimage=[u for u in before if u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest']]
    valid=len(matches)==1 and matches[0]['ancestry']==row.get('targetAncestry')
    checks.append(dict(shard=f,pointer=p,claimId=row.get('claimId'),target=payload(row),
        bindingHashValid='bindingSha256' not in row or row['bindingSha256']==digest(row),
        currentUnitValid=valid,firstParentPreimage=preimage,
        currentMatches=matches,completeDigestMatchesElsewhere=exact_elsewhere,
        currentPlacementWitnesses=[witness(units,u) for u in matches],
        firstParentPlacementWitnesses=[witness(before,u) for u in preimage],
        status='current binding matches' if valid else 'repair pending; no ordinal-only relocation performed'))
candidate_checks=[dict(path=p,currentSha256=cat[p]['fileSha256'],completeUnitCount=len(cat[p]['units']),
    effectiveDirectBindingsAtInput=sum(c['target']['targetOwner']==p for c in checks),
    failingBindings=sum(c['target']['targetOwner']==p and (not c['currentUnitValid'] or not c['bindingHashValid']) for c in checks),
    status='Both frozen extractors agree on every complete unit; current effective bindings checked. Zero-bind documents retain incoming obligations.') for p in incoming]
source_bindings=[]
for doc in docs.values():
    for value in doc.values():
        if isinstance(value,list):
            source_bindings += [r for r in value if isinstance(r,dict) and r.get('sourcePath') and r.get('sourceUnitDigest') and r.get('targetUnitDigest')]
triage=[]
for source in legacy:
    missing=[]; units=cat[source]['units']
    for unit in units:
        exact=[dict(path=t,anchor=u['anchor']) for t in source_targets[source] for u in cat[t]['units'] if u['textDigest']==unit['textDigest']]
        bound=[b for b in source_bindings if b['sourcePath']==source and b['sourceUnitDigest']==unit['textDigest'] and b['targetOwner'] in source_targets[source] and any(t['anchor']==b['targetAnchor'] and t['textDigest']==b['targetUnitDigest'] for t in cat[b['targetOwner']]['units'])]
        if not exact and not bound: missing.append(dict(sourceAnchor=unit['anchor'],sourceUnitDigest=unit['textDigest'],unitKind=unit['unitKind'],ancestry=unit['ancestry'],startLine=unit['startLine'],endLine=unit['endLine'],content=unit['text']))
    triage.append(dict(sourcePath=source,sourceSha256=cat[source]['fileSha256'],candidateSuccessors=source_targets[source],currentUnits=len(units),unprovenUnitCount=len(missing),missingCarriage=missing))
dump('binding-check.json',dict(inputHEAD=head,merge=merge,extractors=data['extractors'],candidateChecks=candidate_checks,
    checkedEffectiveDirectBindings=len(checks),failingBindings=sum(not c['currentUnitValid'] or not c['bindingHashValid'] for c in checks),
    historicalOverlayPredecessorsNotRewritten=len(historical),checks=checks,
    changedRows=0,status='read-only Step 0 check; rebindings not applied because the turn stopped on its exact writable boundary'))
dump('source-triage.json',dict(inputHEAD=head,method='Bounded diagnostic using import2 frozen dual extractors and the three existing successor sets. Not a replacement for the unchanged global scanner, which fails on an absent prepared-only holder.',
    records=triage,counts=dict(sourceFiles=3,unprovenUnits=sum(r['unprovenUnitCount'] for r in triage)),
    carriedUnits=[],needsWrites=['docs/reading-map.md']))
unchanged=[]
for p in ['AGENTS.md','CLAUDE.md','docs/transitional-switchboard.md',str(P/'transitional-switchboard.json')]: 
    unchanged.append(dict(path=p,changedFromFirstParent=p in changed,changedOnMain=p in main_changed,
        firstParentSha256=sha(blob(fp,p)),mergeSha256=sha(blob(merge,p))))
account=dict(inputHEAD=head,decision='L12-137 / L13-6 / w10-import3-brief; accounting only; resync blocked by exact writable scope',
    merges=[dict(merge=merge,firstParent=fp,main=main,base=base,mainCommitCount=69,
        mainCommits=git('log','--format=%H %s',fp+'..'+main).splitlines(),changedPathCount=len(changed),changedPaths=changed,
        mainChangedPaths=main_changed,families=dict(sorted(collections.Counter(p.split('/')[0] for p in changed).items())),
        changedDocumentation=docpaths,documentationProvenance=provenance,
        leadResolvedConflicts=[],resolutionQualification='Five changed documentation files equal main byte-for-byte. Git and Holder-lock retain the branch documentation-cutover contracts; the legacy reading map retains the branch transition banner and knowledge fixes. Exact parent deltas are recorded; no textual conflict or current-truth acceptance is inferred merely from a tree diff.')],
    unchangedInstructionAndSwitchboardWitnesses=unchanged,incomingPlatformPaths=incoming,candidateChecks=candidate_checks,
    step0=dict(method='Same dual byte-frozen extractors as import2; full unit digest and self-inclusive ancestry, never an ordinal alone.',
        checkedEffectiveDirectBindings=len(checks),failingBindings=sum(not c['currentUnitValid'] or not c['bindingHashValid'] for c in checks),
        changedRowsIncludingPlacement=0,witnesses='binding-check.json',independentReview='pending'),
    sourceResync=dict(status='blocked before any carry/rebind/exception edit',diagnostic='source-triage.json',
        authoritativeScanner='failed with ENOENT; saved legacy-drift.json remains historical, not HEAD evidence'),
    limits=['No pair accounting, content approval, authority promotion, cutover, fgOS CLI, repository Git write or production-symbol edit.',
        'impact-analysis: degraded/unqueried under the no-CLI brief; no product symbol changed.'],needsWrites=['docs/reading-map.md'])
assert {r['path'] for r in provenance if not r['mergeEqualsMain']} == {'docs/platform/git/spec.md','docs/platform/holder-lock/spec.md','docs/specs/reading-map.md'}
dump('merge-accounting.json',account)
print(json.dumps(dict(inputHEAD=head,commits=69,changedPaths=len(changed),changedDocumentation=len(docpaths),candidateChecks=candidate_checks,
    checkedBindings=len(checks),failingBindings=account['step0']['failingBindings'],unprovenUnits={r['sourcePath']:r['unprovenUnitCount'] for r in triage},needsWrites=account['needsWrites']),indent=2))
