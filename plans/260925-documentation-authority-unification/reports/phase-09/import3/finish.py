"""Render the W11 handback from the actual saved command/binding records."""
import collections
import json
from pathlib import Path
import subprocess
P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import3'
load=lambda p:json.loads(Path(p).read_text())
shard=load(P/'ledger/decisions/s18-import3-resync.json')
checks=load(O/'checks-w11.json');scan=load(O/'scanner-proof.json')
rows=[dict(sourcePath=r['sourcePath'],sourceAnchor=r['sourceAnchor'],sourceUnitDigest=r['sourceUnitDigest'],targetOwner=r['targetOwner'],targetAnchor=r['targetAnchor'],targetUnitDigest=r['targetUnitDigest'],targetAncestry=r['targetAncestry'],bindingSha256=r['bindingSha256'],kind=r['disposition']['kind'],ledgerPointer='/sourceBindings/'+str(i)) for i,r in enumerate(shard['sourceBindings'])]
extra=[
 dict(command='node reports/phase-09/late-areas/scan-legacy-drift.mjs (repo-relative plan prefix)',exit=0,result='Initial live scan after the prepared-flag repair: 24 missing; after holder edits, 8; final scan 0.'),
 dict(command='python3 -B reports/phase-09/import3/resync.py (repo-relative plan prefix)',exit=0,result='Prepared 63 effective-row rebindings / 24 source bindings without applying.'),
 dict(command='python3 -B reports/phase-09/import3/resync.py --write (repo-relative plan prefix)',exit=0,result='First application left 11 superseded direct origins stale for the frozen direct-claim reader; corrected by explicit terminal materialization and predecessor-identity refresh, then rerun successfully.'),
 dict(command='rebind/rebind.py --check, same runpy scratch wrapper as checks-w11.json',exit=1,result='Initial diagnostic: exactly 11 stale historical direct origins. Final unchanged check exits 0, drift 0.'),
 dict(command='python3 -B reports/phase-09/import3/prove-scanner.py (repo-relative plan prefix)',exit=1,result='First proof-author attempt asserted 178 operative overlays; corrected to 134 operative rows plus 44 historical lookup entries.'),
 dict(command='python3 -B reports/phase-09/import3/prove-scanner.py (repo-relative plan prefix)',exit=1,result='Second proof-author attempt expected composed global scan zero. Actual unchanged source-join reports 2 conservative changed-unit gaps; the final proof retains this result rather than changing scanner logic.'),
 dict(command='python3 -B reports/phase-09/import3/refresh-ratchet.py (repo-relative plan prefix)',exit=0,result='Exactly three existing exception digests refreshed; immutable previous accounting authenticated at input HEAD.'),
 dict(command='python3 -B reports/phase-09/import3/verify.py (repo-relative plan prefix)',exit=0,result='Full intake/source-binding join, record integrity, 3-only ratchet delta, false prepared flags and exact writable scope.'),
 dict(command='git diff --check',exit=0,result='Read-only whitespace check.'),
 dict(command='Read-only git status/log/show/diff/rev-parse/merge-base investigations',exit=0,result='Path history, exact merge parents/base, symbol prior art and scope checks only; no repository Git write.')]
receipt=dict(version=2,status='done',qualification='Authored and verified within W11 scope; independent review pending. Not gate acceptance, final-pin composition acceptance or authority cutover.',
 inputHEAD=checks['inputHEAD'],authority='L12-137 / L13-6 / w10-import3-brief + w11-import3-resume-brief',needsWrites=[],
 merge=load(O/'merge-accounting.json')['merges'][0]['merge'],
 counts=dict(importedCommits=69,changedPathsInImport=119,changedDocumentation=8,incomingPlatformDocuments=4,completeIncomingUnits=608,incomingEffectiveBindingsChecked=1,
  intakeUnits=24,intakeBySource={'confinement':18,'navigation':2,'seat-binding':4},exactCarriedUnits=16,adaptedBindings=8,
  refreshedEffectiveRows=63,contentRows=33,placementOrAnchorRows=30,directOriginMaterializations=11,overlayPredecessorIdentityRefreshes=11,generatedExistingShardsRewritten=5,
  historicalOverlayPredecessorsNotRewritten=171,currentEffectiveBindingsChecked=314,ratchetEntriesChanged=3,liveFiles=33,missingCurrentUnits=0,missingChangedUnits=0,
  preparedOperativeOverlayRows=134,preparedHistoricalLookupRows=44,composedConservativeMissingChangedUnits=2),
 carriedUnits=rows,
 ratchetEntriesChanged=load(O/'ratchet-refresh.json')['changedPaths'],
 scanner=dict(change='Only appliedToDocs === false shards are withheld from live resolution and reported with row counts; old rows stay effective. No other scan algorithm changed.',
  live='legacy-drift.json / checks-w11.json',preparedPendingApply=load(P/'reports/phase-09/late-areas/legacy-drift.json')['preparedPendingApply'],
  unflaggedMissingHolder=scan['unflaggedMissingHolder'],preparedComposition=dict(exit=0,resolvedOperativeOverlays=134,fullRollbackExact=True,missingChangedUnits=2,
   explanation='Existing scanner source-binding join does not inherit sourcePath from superseded rows. The moved README/repo-layout-vision units need final-pin source-join materialization by the composition owner; all 134 operative targets independently resolve against exact composed bytes. No live patch/flag changed.')),
 checks=[dict(name=c['name'],exit=c['exit'],commandRef='checks-w11.json#/checks/'+str(i),**({'requiredOwnershipPassed':c['requiredOwnershipPassed']} if c['name']=='ownership-audit' else {})) for i,c in enumerate(checks['checks'])],
 ownershipAudit=next(c['ownershipSummary'] for c in checks['checks'] if c['name']=='ownership-audit'),
 evidenceRelocation=checks['evidenceRelocation'],additionalCommands=extra,
 auditNativeDiagnostic=dict(loaded=True,context='audit-report.py invokes the unchanged checks.mjs child, whose trackedPlatformDocs uses the native Git Inspect door.',
  result='Both checks.mjs children exited 1 before a checks verdict: git-floor-probe-failed, read-only file system. Their exact stdout/stderr are retained in checks-w11.json subcommandOutputs.',
  staging='Existing cached addon was loaded; no Cargo/build output and no new staging attempt observed. No explicit preload, addon build, .fgos inspection or cleanup was performed. The evidence --before checker was never invoked.'),
 proofEncoding='binding-refresh.json interns long strings in a digest-authenticated textCatalog, expanded by resync.py --check. Original blocked artifacts remain historical.',
 impactAnalysis='degraded/unqueried under the no-fgos-CLI brief; only the records scanner changed, no production symbol change.',
 scratch=dict(path='/tmp/fgos-work/w11-import3',removedAtHandback=True),
 boundaries=dict(repositoryGitWrites=False,fgosCLI=False,workLifecycle=False,broadSuites=False,pairAccounting=False,gateAcceptance=False,authorityCutover=False,livePreparedFlagsChanged=False),
 followup=['Independent review of 24 source bindings, 63 effective rebindings, 11 direct-origin materializations and 11 overlay predecessor identities.',
  'At final pin, the composition owner materializes source joins for the relocated README/repo-layout-vision; scratch composed scan conservatively reports 2 changed units despite 134 valid overlay targets.',
  'The combined audit checks.mjs verdict is unavailable on this sandbox native floor; do not call it a check-A result. Both required ownership proofs already pass.'])
(O/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
lines=[]
for i,r in enumerate(rows):
 source=r['sourcePath'].split('/')[-1]+'#'+r['sourceAnchor']
 target=r['targetOwner']+'#'+r['targetAnchor']
 lines.append('| '+str(i)+' | `'+source+'` | `'+target+'` | '+('exact' if r['kind']=='exact-unit-digest' else 'adapted')+' |')
md='''# Imported documentation re-sync — authored and verified

**Status: done for the W11 author assignment; independent review pending. No gate acceptance or cutover.**

Input HEAD: `'''+checks['inputHEAD']+'''`. `needsWrites: []`.
Read first: [W11 brief](../w11-import3-resume-brief.md), [machine receipt](receipt.json), [merge accounting](merge-accounting.json), [binding refresh](binding-refresh.json), [source bindings](../../../ledger/decisions/s18-import3-resync.json), [commands](checks-w11.json), [scanner proof](scanner-proof.json).

## Accounting and carriage

The existing import accounting is retained and refreshed: merge `571a996f5`, exact parents/base, **69 commits / 119 changed paths / 8 documentation paths**. All four incoming platform files have dual-frozen-extractor checks (**608 complete units**, sole effective incoming direct binding valid). No invented bindings on zero-bound incoming files. The phase contract already records their union obligation; it needed no further edit.

The original `source-triage.json` remains the immutable blocked-turn intake. All **24 units** are now carried or explicitly bound: confinement **18**, navigation **2**, Seat Binding **4**; **16 exact / 8 adapted**. `current-source-triage.json` reports zero unproven units. Existing holders were reused:

- Confinement: 9 probes, 10 with blind; complete §9.3 machine-private-root masking, `FGOS_CONFINED` caveat, limits/falsifier, rollout, settled facts and dated decision. Preserve the existing live-migration/invocation corrections and CTR011 correction; do not revive stale legacy assertions.
- Navigation: only the two imported entry lines changed in section 5. L11-25 transition banner, both knowledge routes and all prior truth/link corrections remain byte-preserved. No second detailed map.
- Seat Binding: global `rigorToTier` refusal and the dated removal of `dropRetiredGlobalKeys`; retain existing rebased links and the historical 2026-10-23 decision.

## Binding proof

The declared sorted compact UTF-8 JSON + LF recipe and self-inclusive heading ancestry are reused, with both unchanged frozen extractors. Full source units, input preimages and both neighbours are retained (long strings are digest-interned, not omitted).

**63 effective rows** refreshed across five existing generated shards: **33 content / 30 anchor-or-placement**. Every changed row is pending review. The frozen ownership reader also reads superseded direct claims: **11 stale origins** were materialized from their existing terminal overlays, and **11 explicit predecessor identities** refreshed so supersession chains remain intact. Original rows/identities are preserved in the proof. **171 other historical predecessors** remain untouched. No owning proof was edited or weakened. **314 current effective bindings** pass replay, including all 24 new source rows.

Every intake unit and its complete successor anchor is below; row number is its `sourceBindings` index. The JSON shard includes source/target digests, ancestry, content, placement, reason and complete changed-source-line witnesses for adaptations. Adapted does not mean independently approved.

| Row | Source unit | Existing successor anchor | Carry |
|---:|---|---|---|
'''+ '\n'.join(lines)+'''

## Prepared scanner shards

Only the `appliedToDocs === false` guard and explicit `preparedPendingApply` metadata were added. No extraction, mapping, binding or missing-unit algorithm changed. Live old rows stay effective:

- W8: **44 operative rows**, plus **44 historical lookup entries**.
- W9: **90 operative rows**.

The scratch proof reuses the existing composition replay and its three exact predecessor/relocation/history specs, with `--fuzz=0`, per-step rollback and full byte-exact rollback. An **unflagged** shard pointing at a missing holder still fails **exit 1 / ENOENT**, without replacing the output. After physical composition and marking only scratch flags applied, the scan reads the relocated history and exits 0; **all 134 operative overlay targets/digests/hashes/ancestries resolve independently**.

**Scope limitation, not hidden green:** that composed global scan conservatively reports **2 changed-unit gaps** in README/repo-layout-vision because its unchanged source-binding join does not inherit `sourcePath` through supersession. Final-pin source-join materialization belongs to the composition owner. This turn does not change that algorithm or claim a whole-cutover verdict. The actual live-tree scan required by this import has **33 files / 0 missing current units / 0 missing changed units**.

## Verification and limits

Replays: `python3 -B .../import3/run-checks.py`, `python3 -B .../import3/resync.py --check`, and `python3 -B .../import3/verify.py` (all paths relative to the plan reports). Full argv, environment, stdout/stderr and exits are in `checks-w11.json`; scratch child outputs are captured before cleanup. Earlier author attempts and corrections are listed in `receipt.json.additionalCommands`; original W10 records are preserved, not called current proof.

| Check | Result |
|---|---|
| Current source/binding conservation | 0; 24 source units, 314 effective bindings |
| Scanner negative/composed boundary probes | 0; unflagged ENOENT rejected, 134 composed overlays resolve; residual above |
| Live drift scan + `--check` | 0 / 0; no missing units |
| Unchanged `rebind/rebind.py --check` | 0; drift 0 |
| Both `ownership.mjs` and `audit-ownership.mjs` recipes | 0 each; failing rows empty, no new double ownership |
| Combined `phase-08/audit-report.py` | **1**; only its two `checks.mjs` children fail before a verdict, as below |
| Legacy ratchet | 0; 997 legacy files |
| Owning ratchet single test | 0; **28 passed / 0 failed / 0 skipped**, release host set, session env unset |
| Evidence relocation `--before` | **Not run**: it calls `inspectRepo → ensureScriptAddon`, which requires a native addon; W11 forbids loading one for this check |
| Current joins / scope / JSON / Python syntax / whitespace | 0 |

Exactly the three authorized exception digests were refreshed, naming `571a996f5` in the existing `mainMergeAccounting` format. Original rationale/kind/approval fields, all other exceptions, allowances and baseline remain unchanged. Previous accounting is authenticated at the exact input HEAD. Digest accounting is not content approval.

### Audit native diagnostic (disclosed)

The mandatory unchanged audit wrapper also invokes `checks.mjs`. That child imports the production `trackedPlatformDocs` reader, which **loaded the existing cached addon** through its normal door. It then refused at the native Git floor probe on the read-only live state root (`git-floor-probe-failed`, EROFS). Both child stderr streams are retained in `checks-w11.json.subcommandOutputs`; neither produced a checks verdict, so this is **not** described as check A failing. No Cargo/build output or new staging attempt was observed, no explicit addon preload/build was requested, and no runtime artifact was inspected or cleaned. The separately required ownership proofs passed. The evidence relocation checker itself was never invoked.

## Handoff

Independent review remains owed for the changed bindings/materialized origins; final-pin composition source joins and combined checks verdict remain with their owners. No repository `git add`/`commit` or other Git write, fgOS CLI/lifecycle verb, broad suite, pair accounting, owner/progress/gate-state edit, live prepared-flag change, main landing or authority flip. All scratch is confined to `/tmp/fgos-work/w11-import3/` and removed at handback. `impact-analysis: degraded/unqueried` under the no-CLI brief; no product symbol changed. No preview service started within this confined write scope.
'''
(O/'receipt.md').write_text(md)
print(json.dumps(dict(status='done',carriedUnits=len(rows),requiredChecksPassed=checks['requiredChecksPassed'],needsWrites=[])))
