# Independent check of E5 and E9 (documentation-migration pilot)

Checker: verify-e5-e9 (did not take part in the pilot). Worktree `forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`. Read-only except this file.

## 1. Verdicts

| Criterion | Pilot's own claim | This check | Verdict |
|---|---|---|---|
| E9 every D1 and D2 group reproduced | "partly met" (16 D1 + 7 of 28 D2 by hand, rest mechanical) | 28 of 28 D1 and 28 of 28 D2 reproduced by reading source lines and target docs; 0 not reproduced; 5 notes where the pilot's wording is imprecise (section 2.3) | Met |
| E5 headings traced or labelled >= 95% | 154 of 157 (98.1%) | 157 of 157 (100%) when a heading counts as traced if a decision row lands on it or on a block in its section or it is scaffold; 148 of 157 (94.3%) if only a row on the heading itself counts. Pilot's 132/22/3 split not reproduced (mine: 127 direct, 9 via section content, 21 scaffold or title) | Met under the criterion's wording; below 95% under the strictest reading (see 3.2) |
| E5 0 unlabelled invented normative claims in 50 stratified blocks | 0 | 0 in the 50-block sample; 0 in the whole population (261 non-heading blocks) | Met |

## 2. E9

### 2.1 Method

For each group in `reports/phase-05/pilot-a-discrepancy.md` sections 2 and 3: read the cited legacy lines (`docs/architect/host-invocation-routing/*`), read the promoted targets (README, spec, roadmap, vision, ledger, source-inventory, all `architecture/`, `contracts/`, `verification/`, `history/` docs), then probed the whole area (`docs/platform/host-invocation-routing/**`, 33 targets plus ledger, inventory and audit) with distinctive terms from the cited lines. Probe is a locator only: a group is marked reproduced when reading the nearest carrier shows the claim absent (D1) or weaker or changed (D2). Evidence "absent" means: no hit for the listed terms in the whole area outside the audit matrix (`verification/source-preservation-audit.md:29-36`, which only names topics). Paths below are relative to `docs/platform/host-invocation-routing/`.

### 2.2 D1 groups (28): old audit says preserved, new method finds no target

| Group | Source lines | Verdict | Evidence |
|---|---|---|---|
| G05 | doc-std 41-67 | reproduced | goal / Non-Goals / Hard Migration Rules text absent; only the audit matrix names them (source-preservation-audit.md:31) |
| G06 | doc-std 81-118 | reproduced, sub-class partly mis-stated | `history/source-inventory.md:23-28,34-37` carries roles and dispositions and 4 of 7 cross-area rows and 2 of 7 reference-pattern rows, no Must-preserve column; so "new-audit-miss" is only partly right |
| G07 | doc-std 161-176 | reproduced | requirement text absent; the ledger realises it with 8 columns (`intent-preservation-ledger.md:53`, plan says 7, adds Disposition) |
| G08 | doc-std 178-194 | reproduced | thirteen-bucket scheme absent (0 hits for "bucket"); ledger rows are in subject order |
| G09 | doc-std 213-327 | reproduced | phase mechanics, `target pending -> promoted`, "verification before retiring" absent; ledger.md:98-101 holds only a phase audit result table |
| G10 | doc-std 339-340 | reproduced | Phase 6 exit statement absent as a requirement; closest is `source-inventory.md:41` (old docs carry status notes) |
| G11 | doc-std 364-379 | reproduced | ten-question review checklist absent (0 hits "checklist") |
| G23 | hi-routing 115-186 | reproduced | 0 hits "version pair", "coerc", "best-effort", upgrade/downgrade transform; only `contracts/component-protocol.md:20` (independent versioning) and `contracts/operation-catalog.md:22` (idempotency field name) |
| G24 | hi-routing 175-182 | reproduced | 0 hits `admission-refused`, `selection-refused`, `grant-refused`; `contracts/operation-request-outcome.md:32` keeps only `dispatched` and one terminal record |
| G29 | hi-routing 194-218 | reproduced | layout tree and snake_case/kebab-case rule absent; paths occur only as evidence links (`verification/implementation-alignment.md:33-35`) |
| G30 | hi-routing 236-240 | reproduced, wording imprecise | Q1 packaged-vs-core, Q3 public extension points, Q4 local socket absent; Q5 integrity policy only loosely at `roadmap.md:300`; Q2 (first native OperationIds) IS carried at `spec.md:74` |
| G36 | ext-protocol 30-62 | reproduced | class definitions (required, fgOS-owned, atomically released, static-linked, release train, never compiled in), table, "dynamic libraries not default" absent; `architecture/external-provider-protocol.md:21` names classes only |
| G37 | ext-protocol 64-70 | reproduced | cold-start / hot-loop / one-shot-CLI guidance absent ("startup" appears once, `verification/r2-external-process-proof.md:70`, in the supervisor-deadline sense) |
| G38 | ext-protocol 90 | reproduced | 0 hits "transport-neutral", "binary codec" |
| G39 | ext-protocol 107 | reproduced | minimum manifest contents (publisher, platform compat, integrity, health/describe) absent; `contracts/external-provider-manifest.md:20` lists only the line-109 common fields |
| G40 | ext-protocol 113-124 | reproduced | linker procedure and input/output formula absent; only the refusal outcomes (`verification/r2-external-process-proof.md:49,69`) and the derived-registry rule |
| G46 | legacy-cli 30-71 | reproduced | 0 hits "state transaction", "locking, atomicity" in this context; adapters-delegate-complete-use-case rule absent |
| G47 | legacy-cli 48 | reproduced | `bin.fgos` removal rule and ownership header absent; `roadmap.md:38` states only the current `bin.fgos` |
| G48 | legacy-cli 91 | reproduced | 0 hits "launcher", "both runtimes", "ship both"; cost half of benefit/cost absent (`vision.md:40` has the benefit) |
| G57 | n2r 15-26 | reproduced | per-slice obligation to read the component-boundary advisory absent; component-boundary appears only as "no change" notes (`verification/implementation-alignment.md:30`) |
| G58 | n2r 69-129 | reproduced | Option A/C rationale absent; only verdicts (`intent-preservation-ledger.md:85`, `architecture/node-to-rust-migration.md:20`) |
| G59 | n2r 147-399 | reproduced | "risk and authority still determine order" and "every stage leaves a reproducible gate" absent (0 hits); the ordering-signal point itself is carried (`architecture/node-to-rust-migration.md:33`) |
| G60 | n2r 305-342 | reproduced | ten-step repeat procedure absent (0 hits "shared fixtures", "same semantic fixtures"); only complete-boundary and read-before-writer rules |
| G61 | n2r 389-395 | reproduced | 0 hits "observation window", "side by side", "irreversible", "recover state" |
| G72 | rust-plan 120-580 | reproduced | P0 scout evidence, P2 workspace steps, P3 steps, P4 steps absent (0 hits "scout", `args_os`, "recursion", "injected", "process spy") |
| G73 | rust-plan 189-246 | reproduced | 0 hits "p50", "25 ms"; "harness fails on every injected difference" absent; `verification/compatibility-harness.md:20-24` holds invocation and coverage only |
| G74 | rust-plan 440-614 | reproduced, sub-class partly right | P6 steps absent from the host area (0 hits "separately revertible", "idempotent", "selector drift"); the packaging area carries release/install proof (`../packaging-distribution/verification/install-and-release-proof.md:28-31,72`) but not idempotent init, uninstall, doctor-check registration or the revertible flip |
| G75 | rust-plan 582-644 | reproduced | gate table, evidence rules (process-spy, filesystem snapshots, timestamp predicates), risk register absent (0 hits) |

### 2.3 D2 groups (28): target exists, claim weakened or changed

| Group | Source lines | Verdict | Evidence |
|---|---|---|---|
| G01 | doc-std 23-54 | reproduced | `README.md:109-113` keeps the omitted-detail safeguard; origin story, "improves structure only after preserving", six reader questions absent |
| G02 | doc-std 58-79 | reproduced | non-goals list and nine hard rules reduced to README sections 3-8 and ledger status vocabulary (ledger.md:30-35, differs from the plan's list); "legacy can stay live", "no silent summarization" absent |
| G03 | doc-std 120-211 | reproduced | tree realised by the area itself; text tree and Must-not-own column absent (0 hits "Must not own") |
| G04 | doc-std 227-335 | reproduced | status vocabulary carried (`README.md:94-103`, `spec.md`); phase exit gates, architecture promotion order, Node-removal gate absent |
| G14 | hi-routing 1-35 | reproduced; pilot note mis-states one fact | title is "Host Invocation" (`README.md:1`); the combined name "Host Invocation And Provider Routing" survives only in ledger HI-I001 (ledger.md:55), NOT in vision.md as the pilot note says; `vision.md:36` keeps the special-path matrix, per-host differences (parsing, auth, streaming) absent |
| G16 | hi-routing 65-95 | reproduced | mermaid diagram absent; `architecture/host-use-cases.md:27-29` has the ownership table; "peer status does not require one OS process" only in ledger HI-I003 (ledger.md:57) |
| G17 | hi-routing 101-113 | reproduced | `contracts/operation-catalog.md:20-22` keeps the id shape and descriptor fields; component-owns-authority, singular object-type, verb set, plural REST example, `Box<dyn Any>`, build_snapshot absent |
| G18 | hi-routing 119-148 | reproduced | "no I/O, no async, no failure normalization" only in ledger HI-I009 (ledger.md:63); `architecture/provider-routing.md:21` keeps purity only as "pure selection"; `SelectionRefused`, router limits, atomic snapshot publication absent |
| G19 | hi-routing 152-161 | reproduced | two stages and least-privilege kept (`provider-routing.md:38`, `contracts/operation-provider.md:28`); admission inputs (principal, policy, host surface), process/network/secret/Git capability list, "single pre-selection gate cannot evaluate" absent |
| G20 | hi-routing 173-184 | reproduced | closed families (`contracts/operation-request-outcome.md:28`) and one terminal record (:32) carried; terminal record field list only in ledger HI-I013 (ledger.md:67); non-idempotent no-replay rule only in `contracts/component-protocol.md:32` (external case) |
| G21 | hi-routing 222-242 | reproduced | ownership boundary in `README.md:84`; onboarding vocabulary (`fgos init`, `doctor --fix`, no `setup` verb as design) absent except "separate `setup` verb" as a non-gate (`architecture/release-boundaries.md:23`) |
| G22 | hi-routing 226-232 | reproduced | release table carried but changed (R2 cache in-memory, R3 narrowed: `architecture/release-boundaries.md:23-25`); "ship the Rust host" definition reduced to :40; chat non-gating only at `roadmap.md:60` |
| G33 | ext-protocol 19-54 | reproduced | two axes and class names carried (`architecture/external-provider-protocol.md:21`); who owns/releases/configures formulation, class definitions, table absent |
| G34 | ext-protocol 74-88 | reproduced | framing, handshake, ids, bounds, cancel, crash rule carried (`contracts/component-protocol.md:20-32`); `fgos.component.v1` name, newline-JSON-not-contract, stdout-protocol-only, max-frame rationale, one-shot vs pooled connections absent (newline JSON only in ledger HI-I021, ledger.md:75) |
| G35 | ext-protocol 103-132 | reproduced | static discovery, derived registry, reserved namespaces, fail-closed carried (`contracts/external-provider-manifest.md:20-30`); `kind` examples, cache mechanics (host version, fingerprint, atomic replace, stale rebuild), explicit grant list absent |
| G42 | legacy-cli 24-32 | reproduced | two adapters carried (`architecture/legacy-cli-transition.md:21`); passthrough input shape (OsString, inherited stdin, signals, bytes plus exit), semantic bridge calls extracted use case never `bin/fgos.mjs` only in ledger HI-I025 (ledger.md:79) |
| G43 | legacy-cli 36-50 | reproduced | identity and resolution rule carried (`contracts/legacy-payload.md` sections 1-3); Today/After-R1 table, `libexec/legacy-node` (0 hits), `dev:<rev>` values, nine call sites only in ledger HI-I027/I028 (ledger.md:81-82) |
| G44 | legacy-cli 52-73 | reproduced | fields and rules carried (`contracts/command-route-descriptor.md:20-38`); derivation from registry plus migration annotations (0 hits "annotation"), explain-script output fields, CI rejection list, rollback-oracle sentence absent |
| G45 | legacy-cli 67-89 | reproduced | rollback rule carried (`vision.md:61`, `architecture/release-boundaries.md:42`); benefit reduced to composition root and plugin seam (`vision.md:40`); "removes a LegacyNode edge", peer hosts, provider registry reasoning absent |
| G51 | n2r 41-112 | reproduced | answer carried (`architecture/node-to-rust-migration.md:20`, `contracts/legacy-payload.md`); question framing, repair-path bullets, "intentionally small" absent (0 hits) |
| G52 | n2r 138-327 | reproduced | `history/host-invocation-baseline.md:26-30` keeps the three command lists; per-command reasons dropped; not-thin condition narrowed to "until boundaries are ready" (source: "transaction and authority boundaries can move together") |
| G53 | n2r 181-273 | reproduced | R1 order only in ledger HI-I033 (ledger.md:87); named targets lack ownership-header step, R2 five steps, R3 six steps, R1 exit condition beyond `verification/r1-rust-host-proof.md:20-26` |
| G54 | n2r 285-332 | reproduced | `roadmap.md:169-195` carries routing, read-only, no-drift, no `gate-policy`; proof purpose (config precedence, malformed input, fail-closed default), Work Lifecycle read-side next step absent |
| G55 | n2r 348-361 | reproduced, pilot wording slightly strong | full nine-item list only in ledger HI-I035 (ledger.md:89); `architecture/node-to-rust-migration.md:41` has a generic "atomicity/replay/mutual-exclusion gates" row, so "none of" is true for sole authority, schema compat, fsync, idempotency, crash recovery, typed error, rollback compat only |
| G56 | n2r 367-412 | reproduced | `roadmap.md:271-284` carries zero routes, replay, contract tests, setup/doctor, rollback; cleanup-series removal, rollback rules, stage gate table and performance gates absent |
| G67 | rust-plan 34-662 | reproduced | R1/R2/R3 relations carried (`architecture/release-boundaries.md:41`); non-goals (no Rust toolchain on consumers, no parser rewrite, no Node deletion with the flip) and "independently shippable" absent |
| G68 | rust-plan 112-433 | reproduced | outcomes carried in changed form (r1 proof, roadmap, legacy-payload); P7/P8 independence, P0 verify command, P1 steps 3 and 6 wording, P2 target tree, P3 deliverables, P4 steps absent |
| G69 | rust-plan 442-624 | reproduced | R2/R3 outcomes carried with different commands; "P6 is part of R1, not late cleanup", "discard the candidate binary before P6", never auto-retry a writer absent |

### 2.4 Dropped-claims register entries 002-017

`dropped-claims-register.json` has 17 entries; 002-017 are 16 `dropped-needs-review` entries. Mapping by source path and line range (entry `source.lines` equals the group's lines): 002=G23 (115-186), 003=G24 (175-182), 004=G29 (194-218), 005=G36, 006=G37, 007=G38 (90), 008=G40 (113-124), 009=G46 (30-71), 010=G47 (48), 011=G48 (91), 012=G57 (15-26), 013=G58, 014=G60 (305-342), 015=G61 (389-395), 016=G73, 017=G75. All 16 correspond to D1 groups reproduced above; the 16 are exactly the pilot's `real-drop` sub-class. The remaining 12 D1 groups (G05-G11, G30, G39, G59, G72, G74) are correctly not registered under the pilot's sub-class (intentional / new-audit-miss / old-audit-overclaim); I reproduce their absence but did not re-judge intent. Entries 008 and 013 are narrowed to the missing part in the register text, consistent with what I found (linker exists in code; rejected verdicts carried).

### 2.5 Where the pilot's own wording differs from this check

1. Pilot section 6 and `pilot-method-defects.md:41` say E9 is partly met (7 of 28 D2 by hand). Reading all 28 shows none fails; the claim "partly" understates it only because the reading had not been done.
2. G14 note: combined area name is in ledger HI-I001, not vision.md.
3. G06: the inventory carries more than "source roles and dispositions" (4 of 7 cross-area rows) but not the Must-preserve column, so the sub-class is partly right.
4. G30: Q2 is carried (`spec.md:74`); "silently dropped" holds for Q1, Q3, Q4 and mostly Q5.
5. G55: generic "mutual-exclusion gates" appears in the target row.

## 3. E5

### 3.1 Method

Scripts in the session scratchpad `verify/` (`load.mjs`, `count.mjs`, `q2.mjs`, `sample.mjs`, `pop.mjs`).

- Population: the six candidate documents under `docs/platform/work-state/`; blocks from `node scripts/list-doc-anchors.mjs` (418 blocks: 157 headings, 261 unheaded blocks). Decisions: the 366 rows of the seven `pilot/decisions/b-*.json` shards (`b-files.json` excluded); a block is "named" when a row has its `targetOwner` and `targetAnchor`. All 366 rows point at an existing anchor (0 dangling).
- Trace test for a block: its whitespace-normalised text is a substring of `docs/specs/work-state.md` or `docs/io-contract.md` (so no claim can be invented), otherwise read by hand against the source.
- Sampler: seeded mulberry32, **seed 20261008**, 50 blocks from the 261 non-heading blocks, stratified by file and by decision type (promote / merge / supersede / not named), one random draw per equal-width position bin inside a stratum so each stratum spreads across the file. Allocation: README 3 (all 8 of its blocks are navigation), spec 15 (13 promote, 2 not named), CLI I/O contract 10 (3 promote, 5 merge, 1 supersede, 1 not named), implementation pointers 2, retired decision history 15 (14 promote, 1 not named), distill record 5 (3 promote, 2 not named).
- Population cross-check beyond the sample: 234 named blocks are verbatim in the sources, 4 named blocks are not verbatim (read by hand, section 3.4), 23 blocks are not named (headers, purpose sentences, navigation, links; the 10 in the sample plus the remaining README blocks, header blocks and link lists were read).

### 3.2 Headings

| Measure | Count |
|---|---:|
| Headings in the six candidates (H1 titles included) | 157 |
| A decision row lands on the heading itself | 127 |
| No row on the heading, but a row lands on a block in its section | 9 (spec `15-source-provenance-and-coverage`; contract H3: `single-write-door`, `writer-source-trust-levels`, `writer-resolution-rules`, `caller-role`, `error-path-is-not-enveloped`, `runner-stdout-envelope`, `recognizing-a-real-envelope`, `entry-fields-and-effect-axes`) |
| Scaffold sections listed in target map section 10 (no source rows, by design) | 15 |
| H1 titles (no row, not in the section 10 list) | 6 |
| Not traced and not scaffold | 0 |

Traced or labelled: 157 of 157 = 100% if a heading counts as traced when source rows land in its section, which is what "trace to a source row" means for the contract H3 headings (they are structural subdivisions added by the map; the source io-contract has only 11 headings, so these 8 have no source heading of their own). If only a row on the heading itself counts and H1 titles and the 15 listed scaffold sections are accepted as labelled, 148 of 157 = 94.3%, just below 95%.

Differences from the pilot (`pilot-method-defects.md:24,41`): it reports 132 named, 22 scaffold, 3 unlabelled (`single-write-door`, `caller-role`, `recognizing-a-real-envelope`). I count 127 direct, and 8 contract H3 headings with no heading row (not 3); the pilot's "22 scaffold" matches 15 + 6 H1 titles + 1 (probably spec section 15, which has a block row). The totals (157) match; the split does not, and the pilot's list of unlabelled headings is incomplete under a direct-row reading. Recommend the owner state the counting rule in the criterion. Not a defect in the carried content.

### 3.3 Sample of 50 blocks

| # | Block (file#anchor) | Lines | Stratum | Result |
|---:|---|---|---|---|
| 1 | README.md#unheaded-block-2 | 24-24 | README.md:unnamed | read by hand: scaffold sentence about the document itself; no source claim made |
| 2 | README.md#unheaded-block-4 | 30-37 | README.md:unnamed | read by hand: navigation table of links; all targets exist; no normative claim |
| 3 | README.md#unheaded-block-6 | 51-51 | README.md:unnamed | read by hand: authority label "canonical until the cutover" is the phase-file instruction for the portal (step 5), matches docs/transitional-switchboard routing; not a source claim, not invented |
| 4 | spec.md#unheaded-block-3 | 25-48 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 5 | spec.md#unheaded-block-15 | 157-161 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 6 | spec.md#unheaded-block-17 | 170-175 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 7 | spec.md#unheaded-block-26 | 229-230 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 8 | spec.md#unheaded-block-34 | 288-294 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 9 | spec.md#unheaded-block-46 | 439-442 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 10 | spec.md#unheaded-block-53 | 498-504 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 11 | spec.md#unheaded-block-56 | 527-559 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 12 | spec.md#unheaded-block-64 | 677-703 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 13 | spec.md#unheaded-block-74 | 906-910 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 14 | spec.md#unheaded-block-82 | 966-970 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 15 | spec.md#unheaded-block-84 | 982-984 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 16 | spec.md#unheaded-block-93 | 1032-1085 | spec.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 17 | spec.md#unheaded-block-1 | 3-17 | spec.md:unnamed | read by hand: candidate header (type, audience, purpose, status Candidate, Related); metadata |
| 18 | spec.md#unheaded-block-60 | 603-603 | spec.md:unnamed | read by hand: navigation listing of the two H3 children of section 8; both exist |
| 19 | contracts/cli-io-contract.md#unheaded-block-11 | 85-91 | contracts/cli-io-contract.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 20 | contracts/cli-io-contract.md#unheaded-block-36 | 310-313 | contracts/cli-io-contract.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 21 | contracts/cli-io-contract.md#unheaded-block-38 | 330-331 | contracts/cli-io-contract.md:promote | read by hand: source lines 147-150 of docs/io-contract.md, only the link target rewritten (dead 0011 link now points at the retired-history anchor, which exists per list-doc-anchors --check) |
| 22 | contracts/cli-io-contract.md#unheaded-block-5 | 42-49 | contracts/cli-io-contract.md:merge | traced: whitespace-normalised substring of the legacy source (named by merge decision row) |
| 23 | contracts/cli-io-contract.md#unheaded-block-14 | 114-124 | contracts/cli-io-contract.md:merge | traced: whitespace-normalised substring of the legacy source (named by merge decision row) |
| 24 | contracts/cli-io-contract.md#unheaded-block-20 | 154-158 | contracts/cli-io-contract.md:merge | traced: whitespace-normalised substring of the legacy source (named by merge decision row) |
| 25 | contracts/cli-io-contract.md#unheaded-block-28 | 234-235 | contracts/cli-io-contract.md:merge | traced: whitespace-normalised substring of the legacy source (named by merge decision row) |
| 26 | contracts/cli-io-contract.md#unheaded-block-32 | 276-286 | contracts/cli-io-contract.md:merge | traced: whitespace-normalised substring of the legacy source (named by merge decision row) |
| 27 | contracts/cli-io-contract.md#unheaded-block-31 | 264-274 | contracts/cli-io-contract.md:supersede | read by hand: source docs/specs/work-state.md ~665-675 plus io-contract.md:131-133; the exclusive "only review and approve" clause is replaced by the io-contract wording incl. `coordination` (io-contract.md:133). Traced; stale-content risk is a carry-fidelity issue, not an invented claim |
| 28 | contracts/cli-io-contract.md#unheaded-block-1 | 3-15 | contracts/cli-io-contract.md:unnamed | read by hand: candidate header; metadata |
| 29 | architecture/implementation-pointers.md#unheaded-block-3 | 21-44 | architecture/implementation-pointers.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 30 | architecture/implementation-pointers.md#unheaded-block-2 | 17-17 | architecture/implementation-pointers.md:unnamed | read by hand: scaffold purpose sentence; no source claim |
| 31 | decisions/retired-decision-history.md#unheaded-block-5 | 35-41 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 32 | decisions/retired-decision-history.md#unheaded-block-11 | 79-79 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 33 | decisions/retired-decision-history.md#unheaded-block-17 | 116-116 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 34 | decisions/retired-decision-history.md#unheaded-block-25 | 163-163 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 35 | decisions/retired-decision-history.md#unheaded-block-30 | 196-203 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 36 | decisions/retired-decision-history.md#unheaded-block-36 | 249-255 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 37 | decisions/retired-decision-history.md#unheaded-block-45 | 343-348 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 38 | decisions/retired-decision-history.md#unheaded-block-53 | 417-422 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 39 | decisions/retired-decision-history.md#unheaded-block-58 | 475-480 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 40 | decisions/retired-decision-history.md#unheaded-block-66 | 542-556 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 41 | decisions/retired-decision-history.md#unheaded-block-70 | 602-604 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 42 | decisions/retired-decision-history.md#unheaded-block-79 | 683-694 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 43 | decisions/retired-decision-history.md#unheaded-block-84 | 761-770 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 44 | decisions/retired-decision-history.md#unheaded-block-93 | 909-916 | decisions/retired-decision-history.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 45 | decisions/retired-decision-history.md#unheaded-block-95 | 935-937 | decisions/retired-decision-history.md:unnamed | read by hand: links only |
| 46 | history/multi-role-harness-distill-record.md#unheaded-block-3 | 21-27 | history/multi-role-harness-distill-record.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 47 | history/multi-role-harness-distill-record.md#unheaded-block-5 | 48-52 | history/multi-role-harness-distill-record.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 48 | history/multi-role-harness-distill-record.md#unheaded-block-8 | 81-86 | history/multi-role-harness-distill-record.md:promote | traced: whitespace-normalised substring of the legacy source (named by promote decision row) |
| 49 | history/multi-role-harness-distill-record.md#unheaded-block-1 | 3-13 | history/multi-role-harness-distill-record.md:unnamed | read by hand: candidate header; metadata |
| 50 | history/multi-role-harness-distill-record.md#unheaded-block-2 | 17-17 | history/multi-role-harness-distill-record.md:unnamed | read by hand: scaffold purpose sentence, points to the decision document |

### 3.4 Result

- Blocks traced to a source row: 38 verbatim in the legacy sources; 2 more traced with one change each (contract `unheaded-block-38`: link target only; `unheaded-block-31`: the exclusive "only review and approve carry externalEffect" clause replaced by the io-contract wording, `docs/io-contract.md:131-133`, so the example `coordination` is source text); 10 scaffold, header or navigation blocks read by hand (3 of them carry an authority label or a purpose sentence; none states a platform rule). 38 + 2 + 10 = 50.
- Unlabelled invented normative claims: **0 of 50**. Population check: 0 of 261 (234 verbatim; the 4 non-verbatim named blocks are two link rewrites, the replaced clause, and a quoted ADR 0002 supersession note that is verbatim at `docs/specs/work-state.md:1339`; the 23 unnamed blocks contain no source-style claim).
- One non-invented content issue seen (not counted): sample 27 carries a stale statement as written (the known `coordination` example), already recorded by the pilot.
- "Canonical until the cutover" in README blocks 3 and the legacy-pointer table is an authority label the phase file prescribes for the portal; it matches `docs/transitional-switchboard.md`; treated as scaffold, not as an invented claim.

## 4. Verdicts

- E9: **met** (56 of 56 reproduced by reading; the pilot's own "partly met" is superseded by this check). Open notes: G14, G06, G30, G55 wording; none changes a count or the 16 registered drops.
- E5, both directions: **met** on the criterion text (157 of 157 headings traced or labelled; 0 of 50 invented claims). One caveat for the owner: under a heading-row-only counting rule the share is 94.3%, so the criterion wording should fix the rule; the pilot's 132/22/3 breakdown does not reproduce (mine 127/9/21).
