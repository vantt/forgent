# Review a38 — Step 4 wave 3, part 18 (set step04-023)

Reviewer scope: 6 files, 11 slots (12 record rows: l-000269 carries two rows, one supplemental row has edgeId null). Pin dc24ce645 (authorInputCommit dc24ce64527f...). Whole source of each file read from the payload; every patch target and anchor checked at the pin.

Stratum notes: authority.mjs and herdr-round.mjs and mechanism.mjs are category A (outcome changed); backend-registry, request, execution-contract, herdr-round, mechanism are category B.

## Per file

### src/runner/dispatch/confinement/authority.mjs — set step04-023, category A — verdict ok (1 slot)
- class6-l-000263 (line 2, `docs/specs/confinement-authority.md`) patch. Target `docs/platform/agent-confinement/spec.md` (anchor null) plus `additionalTargets` `contracts/confinement-authority-v1.md#6-canonical-contracts`; the record lists both targets.
- Both live holders verified at pin. spec.md has `## 1. Quyết định kiến trúc` (L46) and `### 5.2 Quy tắc dependency` (L210). The contract has `### 6.6 ConfinementAttestation` (L588) and `### 6.9 Kết quả của cửa Authority` (L724) under `## 6. Canonical contracts` (L24). The anchor `6-canonical-contracts` resolves.
- The replacement is one patch: `docs/platform/agent-confinement/spec.md §1, §5.2; docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts §6.6, §6.9`. It keeps all four original locators and the backtick/label form. Paths are repo-root-relative, like the original.
- The passage witness is content-matched: ConfinementAttestation (6 live hits, contract only), "Kết quả của cửa Authority" (1, contract), "Quy tắc dependency" (1, spec.md). This agrees with the sections above.
- Diff touches comment line 2 only; no behavior change. The other `spec §6.x` mentions in the file (L133, L184) are bare section cites with no path and are not edges.

### src/runner/dispatch/confinement/backend-registry.mjs — category B — verdict ok (1 slot)
- class6-l-000264 (line 2) patch to `contracts/confinement-authority-v1.md#62-nơi-đặt-policy`. Heading `### 6.2 Nơi đặt policy` exists (L131) and `#### 6.2.1 Trust boundary của backend registry` (L297) nests under it, so the single anchor covers the cited `§6.2-§6.2.1`. The slug convention matches the repo's other anchors. `confinement-backend-registry.v1` appears in the contract (L264).
- The diff is comment line 2 only. Bare `(spec §6.x)` mentions in JSDoc are not path edges.

### src/runner/dispatch/confinement/request.mjs — category B — verdict ok (1 slot)
- class6-l-000266 (line 2) patch to `contracts/confinement-authority-v1.md#6-canonical-contracts`. The cited §6.4 `ConfinementPlan` (L460) and §6.10 `Version và evolution` (L768) both sit under §6, so the common-parent anchor is sound. Both numbered locators are kept.
- The diff is comment line 2 only.

### src/runner/dispatch/execution-contract.mjs — category B — verdict ok (1 slot)
- class6-l-000267 (line 76, `docs/architecture-manifest.json`) preserve. The file exists in the pin tree (`architecture-manifest.v1`) and is a retained contract read by test/architecture.test.mjs. The tree witness matches. No diff, and no other path edges. `ADR-006/007 §n` mentions are bare ids, not edges.

### src/runner/dispatch/herdr-round.mjs — categories A and B — verdict ok (1 slot)
- class6-l-000268 (line 8, `docs/specs/runner.md`) patch to `docs/platform/run-supervisor/spec.md`, anchor null. Target verified: §4 Handover controller to supervisor, §5.3 Terminal mode (brief delivery, release-slot), §9.1 Controller death (agent keeps running), and the orphan-branch text at L156. This covers the cited claim "supervisor and the gate keep going when this process is gone".
- Diff is comment line 8 only; relative form unchanged.
- Record-text note, not rework: the "process is gone" witness hit sits in an unrelated runner spec (RUL80), not in the chosen target. The target is correct on its own content; the witness text is just weak evidence.

### src/runner/dispatch/mechanism.mjs — categories A and B — verdict ok (5 census slots plus 1 supplemental row)
- l-000269, line 9 and line 10 rows: preserve of `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md`. The tree witness shows the file exists. This is a named history evidence ref (L12-10), correct to preserve.
- l-000270 (line 15-16, `docs/decisions/0026-vision-orchestrator-roottask-executor-native-vs-cli-spawn.md`) parked as a name-drifted dead link (L12-62 ruling 1). The pointer's file is not in the pin tree. The successor note `runner/decisions/h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity` matches the heading `### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity` (L583) under the repo's slug convention. Passage search used passage terms (Native-First Dispatch Doctrine, hasLiveTaskAccess, forceCliSpawn, and others). It found the live holders in the runner decisions file and a proposals file. The exact-path search had 0 hits.
- Authored supplemental row (edgeId null, line 15 col 49-76 plus line 16): parked on the same passage with the same reason and an equivalent witness.
- l-000271 (line 54, `docs/history/capability-capacity-remodel/CONTEXT.md`): preserve; tree witness present.
- l-000272 (line 65, `docs/decisions/0033-...md`): preserve as a literal abbreviated pointer, with a non-executable successor note to `#0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2`. The heading exists (L1211).
- No diff, so no behavior change.

## Outcome defects (rework)
None.

## Record-text notes (not rework)
1. mechanism.mjs: the supplemental null-edge row repeats the census l-000270 occurrence (same line 15 span; its second span adds the line-16 continuation). The two rows duplicate each other. The checker accepted this, so it is harmless, but one row would suffice.
2. mechanism.mjs and herdr-round.mjs: the `reason`/`blockedReason` text repeats "L12-62: L12-62:", and "A51, L12-7/30/31/32/58: L12-62:" has a doubled prefix. Cosmetic.
3. herdr-round.mjs: weak witness hit, as noted above.

## Lead-judgment question
- mechanism.mjs l-000272: `docs/decisions/0033-...md` is preserved as a literal truncated example, not parked. Alternative: park it like 0026, since it is a live "see X" pointer whose retired corpus no longer exists. The disposition is defensible because the string is an ellipsis abbreviation, not a resolvable path, and a successor note is carried. I did not call it a defect.

## Counts
- step04-023, part 18: 6 files reviewed, 0 rework.
- Slots reviewed: 11 census slots plus 1 supplemental row. Patch 4 (authority, backend-registry, request, herdr-round), preserve 5 (execution-contract; mechanism 269 x2, 271, 272), parked 2 (mechanism l-000270 and its supplemental twin).
- Category A files (authority, herdr-round, mechanism): 3 reviewed, 0 rework. Category B files: 5 reviewed, 0 rework.
- All 4 patches change comment lines only (no code behavior change).
