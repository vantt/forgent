import json,collections as C,re
p=json.load(open('parks.json'))
R26P='Phase 9 retention-or-move decision for '
def fam(x):
  d=x['dependency'] or ''; s=x['stateExp'] or ''; b=x['blockedReason'] or ''; f=x['file']; i=x['id']
  for k in (s,d):
    if k.startswith(R26P): return 'r26:'+k[len(R26P):].strip()
  if 'Quadrant' in d and 'dynamic-009788' in d: return 'r26:docs/decisions/index.md'
  if 'requires folded view.docs/topics' in d: return 'gen-doc-registry'
  if 'requires final document scan set and folded registry' in d: return 'gen-enduser-index'
  if 'requires bounded state.decisions rows' in d: return 'gen-decision-index'
  if s.startswith('Phase 9 decision for the legacy decisions-tree'): return 'r29-native-land-decisions-tree'
  if s=='decision-f-phase9-ratchet-retirement' or d=='decision-f-phase9-ratchet-retirement': return 'decision-f-ratchet-retirement'
  if s=='citation-convention-and-scan-packet' or d=='citation-convention-and-scan-packet': return 'citation-convention-and-scan'
  if s.startswith('Authorized persisted Work.docsRef'): return 'state-work-docsref'
  if s.startswith('Authorized persisted inventory oldPath') or 'Source conservation loads inventory-data.json' in d: return 'state-inventory-oldpath'
  if s.startswith('Authorized persisted outcome.docPath') or s.startswith('Authorized Work.acceptance'): return 'state-outcome-and-evidence'
  if 'Near-duplicate' in s: return 'readset-post-retirement-scan'
  if s.startswith('Authorized registry docs currentPath') or s.startswith('bin/fgos.mjs — CLI item/registry') or (f=='src/setup/registrations.mjs' and ('stale check' in d or 'repair writes' in d or 'stale check' in s or 'repair writes' in s)): return 'state-registry-export'
  if x['dependencyCategory']=='step5-parity' and 'CTR010' in d: return 'gateway-ctr010-contract-citations'
  if f in ('test/runner/dead-vocabulary-guard.test.mjs','test/scripts/generate-shipped-path-inventory.test.mjs','test/report/helpers/docs-index-state-fixture.mjs') and x['blockedCategory']=='read-set-parity': return 'readset-post-retirement-scan'
  if f=='scripts/generate-shipped-path-inventory.mjs' and 'Classifier' in d: return 'readset-post-retirement-scan'
  # split-area holder mapping (narrative/decision/fact homes)
  if i in ('reference-000123','reference-000145','reference-000151','reference-000231','reference-003908','reference-003643','reference-003666') or s.startswith('Description rewrite: L12-63: Settled-fact'): return 'split-area-holder-mapping'
  if x['dependencyCategory']=='GAP-02' or x['dependencyCategory']=='claim-correspondence': return 'carry-foundations-and-retired-decision-narratives'
  if f=='src/state/knowledge-registry.mjs' or i in ('reference-000235','reference-000236') or 'fgos-coding-knowledge/SKILL.md' in d: return 'carry-knowledge-registry-framework'
  if f.startswith('packages/distribution/') or f=='apps/fgos-gateway/src/gateway.rs' or 'js-yaml upgrade' in d or f=='apps/fgos-gateway/web/src/lib/network.ts': return 'carry-distribution-gateway-claims'
  if 'executor-dispatch-fallback' in d or 'fgos-clarifying' in d or x['dependencyCategory']=='dead-link' or i in ('reference-000232','reference-003727') or 'STR70a' in d: return 'carry-runner-workstate-doctrine'
  return None
out=C.defaultdict(list)
for x in p: out[fam(x)].append(x)
json.dump({k:[x['id']+'@'+x['file'] for x in v] for k,v in out.items()},open('assign.json','w'))
tot=0
for k,v in sorted(out.items(),key=lambda kv:-len(kv[1])):
  tot+=len(v); print(len(v),len({x['file'] for x in v}),k)
print('total',tot)
for x in out.get(None,[]): print('UNASSIGNED',x['id'],x['file'],x['dependency'][:150])
