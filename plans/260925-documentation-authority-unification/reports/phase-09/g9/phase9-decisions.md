# Dependency decisions and prepared F deltas

## Current replay representation — one F door (L13-24)

The 158 decisions below are unchanged. Execute prepared bytes only through
[`../fchain/manifest.json`](../fchain/manifest.json) and
[`../fchain/check.py`](../fchain/check.py); see the current
[receipt](../fchain/receipt.md) for counts and exact proof commands.

- Gateway additions `/2`, `/3`, `/4`, `/6`, `/7`, `/8` are link-only records:
  f03917, f04343, f04357, f06830/f06831/f06837, f07976 and f07985 own them.
  **f04343 and f06830/f06831 remain preserved**, not retargeted. Only `/5`
  owns a new gateway document retarget, rebased after the distinct premise delta.
- Map addition `/1` links f00527. `/0`, `/9`–`/12`, `/17`, `/18` link carries.
  `/19` links carry 3 and retains only its independent map/heading residual;
  its named predecessor guards the exact carry result. No repeated carry diff
  remains executable in these G9 records.
- `/22` owns the late mailbox map citation. The pinned root-document census
  records all 136 occurrences, including 42 surviving reader occurrences,
  with shard/chain/new-patch owners and individually evidenced non-live cases.
- All `plans/` evidence, including changed or deleted scan members and G6
  judgment rows, is read at `sourcePin`. Current prepared replay separately
  uses the shared manifest. The checker validates both AGENTS successor path
  and its composed anchor, and refuses gateway ownership relabeling.

The following narrative and tables are the **historical authoring receipt at
56b3c3ebf**, not the current application order or executable patch list. Historical
fallback/count statements do not supersede the shared door above. L13-23.1 has
also accepted the two classifier proposals; their original provenance flags stay.

## Historical authoring receipt

Status: **authored records slice; not independently accepted; no cutover authorization**.

Source pin: `56b3c3ebffddca273154e482e581591113c394da`.

Read [the complete packet](phase9-decisions.json) for physical-line hashes, original
JSON pointers, exact ruling quotes, effective Phase-8 resolution citations, reader
coverage, conditional application duties and all literal-path scan results.
[f-composition-additions.json](f-composition-additions.json) holds prepared forward
and rollback patches. None has been applied to product files.

## Complete population, not just carriedBlocker rows

The checker derives **158** parked dependencies from every Step-05 JSONL under
`phase-08/step-05-records/`: **29 physical records**, the original **33** entries
plus **125** newly authored entries. It matches Phase 9 / Phase-9 and the literal
`decision-f-phase9-ratchet-retirement` token (18 entries a word-only search misses).
All 158 retain their exact original record/pointer/id/dependency/consumer and
physical-line SHA-256 binding; source records and carriedBlocker remain untouched.

| Local disposition | Entries | Meaning |
|---|---:|---|
| retained-in-place | 96 | 86 retained-path references, 8 dormant native-Land references, 2 marked classification proposals |
| moved | 24 | 6 gateway references, 17 governance references, 1 architecture-map reference |
| retired | 38 | 17 legacy clause/ownership references, 3 root instruction routes, 18 ratchet-unit references |

Applying the Step-07 `rowSchema`, then `reevaluations`, then
`integrationReevaluations` yields **91 preserve, 9 patch, 58 parked** for this
population. Of the 125 newly authored entries, **65 preserve + 6 patch = 71**
were already decided; **54** remain parked there. The brief/review's “53” and
“72” are not the re-derived counts: the listed remaining groups themselves sum
17 + 1 + 18 + 13 + 3 + 2 = 54. The four formerly authored parked clauses give
58 altogether. Every entry cites its effective overlay row and explicitly says
when Phase 8 already decided it. These records do **not** rewrite that overlay
or close its independent proofs.

## Decision rules and remaining conditions

1. **Retain** `docs/decisions/index.md`, `docs/enduser-docs-index.json` and
   `docs/architecture-manifest.json`, per each file's own L12-96 quote. The
   differing candidate manifest under `docs/platform/contracts/` is not promoted.
   Content regeneration and live narrative-writer duties are distinct from
   keeping these paths.
2. **Move** the gateway YAML to
   `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`.
   The two YAML files are byte-identical at the pin. Reuse the five existing
   code-reader chain steps and add the seven maintained document retargets below.
   Do not duplicate already-composed code patches or treat the move as CTR010 proof.
3. **Conditionally move governance** to `docs/platform/governance.md`.
   Compared its entire 14-section legacy body, not just its pathname/header.
   Required baseline fields are identical; after normalizing heading levels and
   moved links, only the component-boundary link label and whitespace differ.
   F chain owns added scope routing/current-truth text. Existing status-reader
   patch is reused; constitution reads/messages and both fixture directories/copies
   receive prepared deltas. No candidate status is promoted now.
4. **Conditionally move the map** to `docs/platform/architecture-map.md`.
   Compared the complete legacy map, both appendices and ADR 0010/0015/0017.
   Normalized differences are exactly the recorded A45 contract correction:
   reserve CTR010 for gateway, use documentation-only CTR011 for confinement,
   and add CTR012/013. The map's nested heading depth is reflected explicitly in
   its owning narrative proof, with all 34 ADR and collision assertions retained.
   Independent conservation/current-truth acceptance still precedes F.
5. **Retire old clause ownership/pointers**, not code behavior. Reuse
   `carries/claim-carries.json`'s exact occurrence, successor holder and anchor;
   prepare the corresponding source-comment/help deltas on the effective F chain.
   The obsolete `docs/backlog.md` advisory row is already done: do not replay its
   stale historical patch. Root instructions reuse the existing AGENTS chain,
   naming the scope table and exact spec holder rather than another generic
   `docs/specs/<area>.md` route. No second AGENTS patch is added.
6. **Retire the ratchet script/baseline/exceptions together only conditionally**.
   Whole-unit deletions are prepared, not applied. L12-89's replacement guards
   must be implemented and proved at existing convention/doc-health doors in the
   same authorized cut, with registration removed and the old owning test retired
   with its mechanism. No silent empty-root success, rebaseline, production-test
   skip or weakened coverage. Until that prerequisite is met, keep all three files.
7. **Retain native Land behavior**: L12-96 explicitly keeps it dormant in this
   repository but functioning for consumer repositories; no renumbering alias or
   changed index-write destination is introduced.
8. **Two Lead proposals**, explicitly `leadDecisionProposed: true`: retain the
   immutable-commit `docs/architect/` and `docs/specs/` classifiers in
   `scripts/generate-shipped-path-inventory.mjs`. Current code already supports
   `docs/platform/` through the existing-path branch. Old pinned trees must remain
   reproducible and absent paths must remain unresolved. This is not a live
   filesystem scan, and no broadened classification or consumer scope is proposed.
   Lead must confirm the reconciliation with frozen-B's live-scope lifting.

Each conditional move includes both full-file evidence hashes and the exact
normalized content diff. R26 generated index reasons are free-text exports,
not physical reader destinations; immutable classifier fixtures and synthetic
rename fixtures retain their historical operands. `excludedCoChanges` records
these cases individually, including why the differing manifest copy is dropped.

## Gateway census and ownership

A fresh literal-path `rg` scan of tracked files finds **473 matching files**:
**12 maintained readers** and **461 explicit exclusions**. The scan excludes
private/tool directories, its own four outputs and the prohibited test runner.
Each matched file is rebound to pin bytes; current drift fails the check.
The packet retains all match lines and digests, not only R26's five code paths.
Historical/plan/audit reports and retiring legacy sources are excluded from live
retargeting, with per-file reasons. Basename-only synthetic diagnostics are not
file reads; YAML schema content is unchanged.

| Reader | Ownership / prepared coverage |
|---|---|
| `apps/fgos-gateway/Cargo.toml` | Already composed: `w2:predecessor:apps/fgos-gateway/Cargo.toml` |
| `apps/fgos-gateway/src/gateway.rs` | Already composed: `file:apps/fgos-gateway/src/gateway.rs` |
| `apps/fgos-gateway/src/mcp.rs` | Already composed: `w2:predecessor:apps/fgos-gateway/src/mcp.rs` |
| `apps/fgos-gateway/web/src/api/client.ts` | Already composed: `file:apps/fgos-gateway/web/src/api/client.ts` |
| `apps/fgos-gateway/web/src/api/types.ts` | Already composed: `file:apps/fgos-gateway/web/src/api/types.ts` |
| `docs/knowledge/the-fgos-gateway-http-json-api-contract-ctr010-its-scope-and/fgos-gateway-api-ctr010.md` | F addition; additions /patches/2 |
| `docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md` | F addition; additions /patches/3 |
| `docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md` | F addition; additions /patches/4 |
| `docs/platform/config/spec.md` | F addition; additions /patches/5 |
| `docs/platform/herdr-web-dashboard/spec.md` | G6 `f06830`, `f06831`, `f06837`; additions /patches/6 |
| `docs/platform/ui-spec/architecture/screens/S03-task-detail.md` | G6 `f07976`; additions /patches/7 |
| `docs/platform/ui-spec/contracts/15-system-events.md` | G6 `f07985`; additions /patches/8 |

The two required yaml-doc exclusions are explicit:

- `packages/yaml-doc/contracts/fixtures/parse.v1.json`: Parser golden fixture explanation of a scalar shape, not a pathname opened by the parser; preserve fixture bytes.
- `packages/yaml-doc/upgrade-record.md`: Historical parser comparison observation in upgrade evidence, not a live contract read; preserve provenance.

The three additionally discovered maintained readers are the knowledge documents
in the table; they receive prepared additions, not unsupported blanket exclusions.
G6 ownership is bound to exact `preserve-premise/proof.json` rows, including both
f06830/f06831 metadata occurrences, not just an unverified row-id label.

## Prepared patches and F replay

Order: Phase-08 `step-07-composed-patches.json`, then Phase-09
`composition/patch-specs.json` **effectiveSpecIds only**, resolving each declared
replacement root as `composition/verify-effective.py` does, then this packet's
one consolidated addition per path. Approved historical alternatives are not
applied alongside replacements.

The consolidated `preserve-premise/park-judgments/check_shard.py` does not exist
at this HEAD (only numbered shard helpers do). The fallback uses GNU
`patch --batch --fuzz=0` in disposable `/tmp/fgos-work/` directories, rejects
unplanned offsets, verifies before/result hashes and replays rollback to exact
input bytes. This succeeds on **29 relevant chain files and 22 additions**.
No prerequisite chain step needed a rebase at this pin (`chainRebases: []`).
This is relevant-file replay, not a claim about every unrelated F patch.

Historical S28 `carries/pointer-patches.json /patches/13` is **stale** for
reference-000232/235/236: its bin input hash is
`4ad9ed0cb07518ae19774ddcf058d78484b53de25b850ae641b7b53011010d5f`,
versus pin bin hash
`1c50f5643c3bdaa2ac28b04d3e6efe1d67ffe86bab3aa33b949ba943d1eb3c1e`.
Its three exact comment retargets are rebuilt after the current bin F chain in
addition 0. Rebase/recheck again at actual F if bytes drift; no old approval or
whole-file patch is transferred.

| Addition pointer | Path | Application |
|---|---|---|
| `/patches/0` | `bin/fgos.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/1` | `docs/architecture-manifest.json` | After named relevant F predecessors; prepared, not applied |
| `/patches/2` | `docs/knowledge/the-fgos-gateway-http-json-api-contract-ctr010-its-scope-and/fgos-gateway-api-ctr010.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/3` | `docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/4` | `docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/5` | `docs/platform/config/spec.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/6` | `docs/platform/herdr-web-dashboard/spec.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/7` | `docs/platform/ui-spec/architecture/screens/S03-task-detail.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/8` | `docs/platform/ui-spec/contracts/15-system-events.md` | After named relevant F predecessors; prepared, not applied |
| `/patches/9` | `packages/distribution/rust/src/canonical.rs` | After named relevant F predecessors; prepared, not applied |
| `/patches/10` | `packages/distribution/rust/src/init.rs` | After named relevant F predecessors; prepared, not applied |
| `/patches/11` | `packages/distribution/rust/src/verify.rs` | After named relevant F predecessors; prepared, not applied |
| `/patches/12` | `packages/distribution/rust/src/workspace.rs` | After named relevant F predecessors; prepared, not applied |
| `/patches/13` | `scripts/check-doc-constitution.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/14` | `scripts/check-legacy-docs-ratchet.baseline.json` | Only with L12-89 replacement guard unit |
| `/patches/15` | `scripts/check-legacy-docs-ratchet.exceptions.json` | Only with L12-89 replacement guard unit |
| `/patches/16` | `scripts/check-legacy-docs-ratchet.mjs` | Only with L12-89 replacement guard unit |
| `/patches/17` | `src/runner/dispatch/operation-prompt-templates.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/18` | `src/state/knowledge-registry.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/19` | `test/docs/decisions-corpus-retired.test.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/20` | `test/scripts/check-doc-candidate-status.test.mjs` | After named relevant F predecessors; prepared, not applied |
| `/patches/21` | `test/scripts/check-doc-constitution.test.mjs` | After named relevant F predecessors; prepared, not applied |

## Verification and limits

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g9/check_phase9_decisions.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g9/check_phase9_decisions.py --self-test
```

Both exit 0. The self-test runs the same full validator over 25 independently
mutated packets: the original 14 controls plus own-file retention quotes,
source-bound disposition changes even with adjusted counts, F-chain patch
failure, jointly omitted rg census/doc reader, unexplained fixture exclusion,
effective-overlay relabeling, omitted ratchet-token entries, altered content
comparison, false G6 ownership, stale-bin relabeling, and missing retired-clause
pointer coverage. Hash/pointer validity alone cannot stand in for a policy ruling.
All 25 controls were additionally exercised through fresh `python3 -B` checker
CLI processes using `--decisions` and `--additions` with temporary mutated copies;
each returned exit 1. Those temporary wrappers/copies are removed, while
`--self-test` preserves the reproducible owning cases in the granted checker.
The checker also validates forward/rollback bytes, already-composed retired root
routing, moved reader operands, exact clause successors and conditional moves.

No product tests, npm/cargo suites, cutover commands, lifecycle writes, git writes,
pair accounting, ledger edits, generated-state edits or authority deletion were
performed. Impact-analysis tooling was not invoked because this records-only
brief expressly forbids fgOS CLI use and provides no live analysis tool.
Do not infer product/runtime parity, gate closure, independent acceptance,
cutover authorization or F completion from this artifact check. Rebind the final
pin, get Lead's two policy decisions, finish independent conservation/carry/guard
proofs, then compose and verify the authorized cut through the existing doors.

## Full decision index

Each row indexes `/entries/N` in the JSON packet. Retained means retained-in-place;
moved decisions are conditional as above; retired means the precise scope in the
entry, never an implied whole product-file deletion. Original selectors and
citations remain in JSON; this table is a navigation projection only.

| JSON entry | Source operation | Consumer | Decision | Prior effective disposition |
|---|---|---|---|---|
| `0` | `reference-002463` | `scripts/check-decision-citation-drift.mjs` | retained-in-place | preserve |
| `1` | `dynamic-006492` | `scripts/check-decision-citation-drift.mjs` | retained-in-place | preserve |
| `2` | `dynamic-006509` | `scripts/check-decision-citation-drift.mjs` | retained-in-place | preserve |
| `3` | `dynamic-006514` | `scripts/check-decision-citation-drift.mjs` | retained-in-place | preserve |
| `4` | `reference-003545` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `5` | `reference-003546` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `6` | `reference-003547` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `7` | `reference-003548` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `8` | `reference-003549` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `9` | `reference-003550` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `10` | `reference-003551` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `11` | `dynamic-007143` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `12` | `dynamic-007161` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `13` | `dynamic-007162` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `14` | `dynamic-007163` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `15` | `dynamic-007164` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `16` | `dynamic-007165` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `17` | `dynamic-007166` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `18` | `dynamic-007167` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `19` | `dynamic-007172` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `20` | `dynamic-007179` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `21` | `dynamic-007225` | `scripts/check-legacy-docs-ratchet.mjs` | retired | parked |
| `22` | `reference-003646` | `src/cli/command-registry.mjs` | retained-in-place | preserve |
| `23` | `reference-003651` | `src/cli/command-registry.mjs` | retained-in-place | preserve |
| `24` | `author-s4-fix2-284fae1afd0a9579` | `src/cli/command-registry.mjs` | retained-in-place | preserve |
| `25` | `author-s67-command-registry-manifest-861` | `src/cli/command-registry.mjs` | retained-in-place | preserve |
| `26` | `reference-000177` | `apps/fgos-gateway/src/gateway.rs` | moved | patch |
| `27` | `dynamic-000664` | `apps/fgos-gateway/src/gateway.rs` | moved | patch |
| `28` | `dynamic-000665` | `apps/fgos-gateway/src/gateway.rs` | moved | patch |
| `29` | `reference-000200` | `apps/fgos-gateway/src/mcp.rs` | moved | patch |
| `30` | `dynamic-000767` | `apps/fgos-gateway/src/mcp.rs` | moved | patch |
| `31` | `dynamic-000768` | `apps/fgos-gateway/src/mcp.rs` | moved | patch |
| `32` | `dynamic-009758` | `src/report/decision-index.mjs` | retained-in-place | preserve |
| `33` | `dynamic-009759` | `src/report/decision-index.mjs` | retained-in-place | preserve |
| `34` | `dynamic-009760` | `src/report/decision-index.mjs` | retained-in-place | preserve |
| `35` | `dynamic-009761` | `src/report/decision-index.mjs` | retained-in-place | preserve |
| `36` | `dynamic-009767` | `src/report/decision-index.mjs` | retained-in-place | preserve |
| `37` | `dynamic-009768` | `src/report/enduser-index-generate.mjs` | retained-in-place | preserve |
| `38` | `dynamic-009769` | `src/report/enduser-index-generate.mjs` | retained-in-place | preserve |
| `39` | `dynamic-009772` | `src/report/enduser-index-generate.mjs` | retained-in-place | preserve |
| `40` | `dynamic-009773` | `src/report/enduser-index-generate.mjs` | retained-in-place | preserve |
| `41` | `dynamic-009788` | `src/report/enduser-index-generate.mjs` | retained-in-place | preserve |
| `42` | `dynamic-009791` | `src/report/enduser-index.mjs` | retained-in-place | preserve |
| `43` | `author-s4-08912b8301b10321` | `docs/backlog.md` | retired | parked |
| `44` | `reference-002482` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `45` | `reference-002483` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `46` | `reference-002484` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `47` | `reference-002485` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `48` | `dynamic-006599` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `49` | `dynamic-006602` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `50` | `dynamic-006642` | `scripts/check-doc-constitution.mjs` | moved | parked |
| `51` | `reference-003579` | `scripts/generate-shipped-path-inventory.mjs` | retained-in-place **Lead proposal** | parked |
| `52` | `reference-003588` | `scripts/generate-shipped-path-inventory.mjs` | retained-in-place **Lead proposal** | parked |
| `53` | `reference-000145` | `AGENTS.md` | retired | parked |
| `54` | `reference-000151` | `AGENTS.md` | retired | parked |
| `55` | `author-seam8-agents-decision-home-74` | `AGENTS.md` | retired | parked |
| `56` | `reference-000232` | `bin/fgos.mjs` | retired | parked |
| `57` | `reference-000235` | `bin/fgos.mjs` | retired | parked |
| `58` | `reference-000236` | `bin/fgos.mjs` | retired | parked |
| `59` | `dynamic-001360` | `bin/fgos.mjs` | retained-in-place | preserve |
| `60` | `dynamic-001361` | `bin/fgos.mjs` | retained-in-place | preserve |
| `61` | `dynamic-001363` | `bin/fgos.mjs` | retained-in-place | preserve |
| `62` | `dynamic-001454` | `bin/fgos.mjs` | retained-in-place | preserve |
| `63` | `author-seam8-output-2071` | `bin/fgos.mjs` | retained-in-place | preserve |
| `64` | `author-seam8-output-2074` | `bin/fgos.mjs` | retained-in-place | preserve |
| `65` | `author-seam8-output-3029` | `bin/fgos.mjs` | retained-in-place | preserve |
| `66` | `reference-002291` | `packages/distribution/rust/src/canonical.rs` | retired | parked |
| `67` | `reference-002292` | `packages/distribution/rust/src/init.rs` | retired | parked |
| `68` | `reference-002294` | `packages/distribution/rust/src/verify.rs` | retired | parked |
| `69` | `reference-002295` | `packages/distribution/rust/src/workspace.rs` | retired | parked |
| `70` | `reference-003727` | `src/runner/dispatch/operation-prompt-templates.mjs` | retired | parked |
| `71` | `reference-003747` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `72` | `reference-003754` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `73` | `reference-003762` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `74` | `dynamic-012990` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `75` | `author-seam8-native-legacy-decision-writer` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `76` | `author-seam8-native-legacy-index-writer` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `77` | `author-seam8-native-legacy-target-reader` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `78` | `author-seam8-native-legacy-source-reader` | `src/runner/merge.mjs` | retained-in-place | preserve |
| `79` | `reference-003892` | `src/state/knowledge-registry.mjs` | retired | parked |
| `80` | `reference-003893` | `src/state/knowledge-registry.mjs` | retired | parked |
| `81` | `reference-003894` | `src/state/knowledge-registry.mjs` | retired | parked |
| `82` | `reference-003895` | `src/state/knowledge-registry.mjs` | retired | parked |
| `83` | `reference-003896` | `src/state/knowledge-registry.mjs` | retired | parked |
| `84` | `reference-003897` | `src/state/knowledge-registry.mjs` | retired | parked |
| `85` | `reference-003898` | `src/state/knowledge-registry.mjs` | retired | parked |
| `86` | `reference-003899` | `src/state/knowledge-registry.mjs` | retired | parked |
| `87` | `reference-003798` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `88` | `dynamic-013969` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `89` | `dynamic-013983` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `90` | `dynamic-013984` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `91` | `dynamic-013985` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `92` | `dynamic-013986` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `93` | `dynamic-013987` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `94` | `dynamic-014034` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `95` | `dynamic-014035` | `src/setup/instruction-registry.mjs` | retained-in-place | preserve |
| `96` | `reference-003816` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `97` | `dynamic-014318` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `98` | `dynamic-014329` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `99` | `dynamic-014330` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `100` | `dynamic-014334` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `101` | `dynamic-014335` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `102` | `dynamic-014336` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `103` | `dynamic-014337` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `104` | `dynamic-014343` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `105` | `dynamic-014344` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `106` | `author-s4-fix2-2a45460821f48dec` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `107` | `author-s4-fix2-a8e9503a9eafcad1` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `108` | `author-s4-fix2-70cc3f725650c613` | `src/setup/registrations.mjs` | retained-in-place | preserve |
| `109` | `dynamic-016778` | `test/architecture.test.mjs` | retained-in-place | preserve |
| `110` | `reference-004305` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `111` | `reference-004307` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `112` | `reference-004308` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `113` | `reference-004311` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `114` | `reference-004319` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `115` | `reference-004320` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `116` | `reference-004321` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `117` | `reference-004330` | `test/report/enduser-index.test.mjs` | retained-in-place | patch |
| `118` | `reference-004331` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `119` | `reference-004332` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `120` | `reference-004343` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `121` | `reference-004344` | `test/report/enduser-index.test.mjs` | retained-in-place | patch |
| `122` | `reference-004345` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `123` | `reference-004346` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `124` | `reference-004347` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `125` | `reference-004348` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `126` | `reference-004349` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `127` | `reference-004351` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `128` | `dynamic-021513` | `test/report/enduser-index.test.mjs` | retained-in-place | patch |
| `129` | `dynamic-021514` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `130` | `dynamic-021515` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `131` | `dynamic-021542` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `132` | `dynamic-021545` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `133` | `dynamic-021547` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `134` | `dynamic-021548` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `135` | `dynamic-021549` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `136` | `author-s5-b5-enduser-index-154-35` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `137` | `author-s5-b5-enduser-index-334-129` | `test/report/enduser-index.test.mjs` | retained-in-place | preserve |
| `138` | `author-s5-b6-closure-manifest-reader-187` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `139` | `author-s5-b6-closure-manifest-reader-188` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `140` | `author-s5-b6-closure-manifest-reader-198` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `141` | `author-s5-b6-closure-manifest-reader-201` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `142` | `author-s5-b6-closure-manifest-reader-212` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `143` | `author-s5-b6-closure-manifest-reader-216` | `test/cli/fgos-post-merge.test.mjs` | retained-in-place | preserve |
| `144` | `dynamic-017973` | `test/cli/helpers/fgos-cli-harness.mjs` | retained-in-place | preserve |
| `145` | `reference-004586` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `146` | `reference-004589` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `147` | `dynamic-031770` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `148` | `dynamic-031771` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `149` | `author-s67-governance-baseline-94` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `150` | `author-s67-governance-baseline-163` | `test/scripts/check-doc-candidate-status.test.mjs` | moved | parked |
| `151` | `reference-004651` | `test/scripts/check-doc-constitution.test.mjs` | moved | parked |
| `152` | `reference-004659` | `test/scripts/check-doc-constitution.test.mjs` | moved | parked |
| `153` | `dynamic-032029` | `test/scripts/check-doc-constitution.test.mjs` | moved | parked |
| `154` | `dynamic-032030` | `test/scripts/check-doc-constitution.test.mjs` | moved | parked |
| `155` | `reference-004035` | `test/docs/decisions-corpus-retired.test.mjs` | moved | parked |
| `156` | `dynamic-018734` | `test/docs/decisions-corpus-retired.test.mjs` | retained-in-place | preserve |
| `157` | `dynamic-018735` | `test/docs/decisions-corpus-retired.test.mjs` | retained-in-place | preserve |
