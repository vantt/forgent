import pathlib,json,copy,hashlib,sys
assert len(sys.argv)==2 and sys.argv[1].startswith("/tmp/fgos-work/")
P=pathlib.Path('plans/260925-documentation-authority-unification');R=P/'reports/phase-06';read=lambda p:json.loads(pathlib.Path(p).read_text())
old=read(R/'step10-author-closure-expected.json');scope=set(read(R/'step10-global-source-scope.json')['paths']);reg=read(R/'working-identity-registry.json');native={u['claimId']:u for k in ['units','identityGaps','retiredUnits'] for u in reg[k]};rows=[]
for directory in [P/'pilot/decisions',P/'ledger/decisions']:
 for p in directory.glob('*.json'):
  j=read(p)
  for k in ['claims','registryGaps']:
   for row in j.get(k,[]):
    u=native.get(row['claimId']);path=row.get('sourcePath') or (u or {}).get('sourcePath')
    if path not in scope:continue
    rows.append((p,k,row,u))
pending=[{'file':str(p),'collection':k,'claimId':r['claimId'],'sourcePath':u['sourcePath'] if u else r.get('sourcePath'),'sourceAnchor':u['sourceAnchor'] if u else r.get('sourceAnchor'),'sourceUnitDigest':u['sourceUnitDigest'] if u else r.get('sourceUnitDigest'),'disposition':r['disposition']} for p,k,r,u in rows if r.get('reviewStatus')!='reviewed']
partials=[{'claimId':r['claimId'],'sourcePath':u['sourcePath'],'sourceAnchor':u['sourceAnchor'],'sourceUnitDigest':u['sourceUnitDigest']} for p,k,r,u in rows if r['disposition']=='partial-carry' and u]
lists=[];provenance=[]
for file in old['_provenance']['candidateSources']:
 file=file['path'] if isinstance(file,dict) else file;j=read(file);lists.append(j['rows']);provenance.append({'path':file,'rows':len(j['rows']),'sha256':hashlib.sha256(pathlib.Path(file).read_bytes()).hexdigest()})
expected={'holds':sorted(set(r['claimId'] for r in pending if r['collection']=='claims')),'identicalUnits':old['identicalUnits'],'partialCarries':partials,'candidateLists':lists,'_provenance':{'SYNC':reg['commit'],'realHolds':[],'awaitingReview':pending,'meaning':'The frozen comparator field holds is the union of real holds (0) and explicit current active rows awaiting independent review. Gap decisions awaiting review are listed separately; native claims-not-reviewed does not count gaps. This compatibility input changes no checker or review status. A43 Rings are pending ordinary review, never holds.','candidateSources':provenance,'partialsFrom':'Exact authored current claims/registryGaps joined to native full identity, independent of E output.','identicalFrom':'Unchanged committed explicit exception population; not inferred from E.'}}
(pathlib.Path(sys.argv[1])/'expected.json').write_text(json.dumps(expected,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'realHolds':0,'activeAwaitingReview':len(expected['holds']),'gapAwaitingReview':sum(r['collection']=='registryGaps' for r in pending),'partialCarries':len(partials),'candidateLists':len(lists)}))
