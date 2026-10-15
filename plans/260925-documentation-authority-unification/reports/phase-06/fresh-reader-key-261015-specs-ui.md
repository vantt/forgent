# Specs and ui-spec batch (Step 8) fresh-reader key

Author: reviewer:claude-session:a4954387@2026-10-15 (key author, not a reader)
HEAD: 1276467f3

Commit this key before any reader starts. Readers receive only their own `fresh-reader-brief-s8-<area>.md`; they never see this key. The author read the area portal and every substantive section cited below for all seven areas, plus the switchboard, `governance.md`, `migration-authoring-rules.md` and the portal. UNPROVEN: no reader has run; no score is claimed. The key is a scoring constraint, not evidence that any carried sentence is true. Pending author decisions (triage, the A19/A28 truth pass) are never required knowledge.

## 1. Scoring rule

Same shape as `reports/phase-05/pilot-b-fresh-reader-key.md`, the whole-system key and the proposals key (`fresh-reader-key-261015-proposals.md`). A scenario answer (one of six questions) is correct when it names an acceptable owner below with a `path#anchor` that exists and whose text supports the claim. Per reader (one reader per area, three scenarios): at least 5 of 6 correct per scenario; 0 non-existent anchors (any one fails the whole run); at most 8 files opened in total (counting support files; the portal and the migration rules are optional because equivalent evidence sits in the switchboard and governance); 0 files opened outside the brief; 0 legacy-authority answers.

Anchors verified at the worktree (HEAD 1276467f3, `docs/platform` unchanged after it) with `node scripts/list-doc-anchors.mjs --check <path#anchor>`: 138 distinct anchors checked, 138 exit 0, 0 failures. Equivalent supported anchors are acceptable. Anchors of the form `unheaded-block-N` exist only in `fgos-gateway-api-v1.yaml` here and are fragile: a block anchor that does not exist is a fabrication; a different anchor with the same support is fine.

Notation: `P` = `docs/platform`; `PRT` = `P/README.md` (portal); `SW` = `P/documentation/switchboard.md`; `GOV` = `P/governance.md`; `MR` = `P/migration-authoring-rules.md`; `AC` = `P/agent-confinement`; `CP` = `P/claude-plugin`; `DD` = `P/decision-citation-drift`; `DI` = `P/distillery`; `HW` = `P/herdr-web-dashboard`; `OB` = `P/observe`; `UI` = `P/ui-spec`. `spec#x` means `<area>/spec.md#x`; `README#x` means `<area>/README.md#x`.

### 1.1 What every correct answer does (adapted to this batch; nothing here is promoted)

All 7 areas are candidate carriers: each file header says `Design status: Candidate`, `Canonical: No`, `Canonical for: None; candidate only`, `Implementation: Carriage only; current implementation truth is not certified`, and names a legacy source in `Related`/`Provenance`. The switchboard (`SW#2-area-authority-routes`) marks every one of the 7 area rows `legacy-current`; the portal registry (`PRT#2-area-registry`) lists only `ui-spec` (pointing at `../ui-spec/`) and none of the other six. Resolution step 4 (`SW#4-resolution-algorithm-for-readers-and-writers`) says to go to the legacy route and not author candidate files under `docs/platform/<area>/`. Legacy owners (named from the switchboard rows, never opened):

| Area | Binding owner per switchboard | Retained / subordinate |
|---|---|---|
| agent-confinement | `docs/specs/confinement-authority.md` | `src/runner/dispatch/confinement/**` |
| claude-plugin | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` |
| decision-citation-drift | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` |
| distillery | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` |
| herdr-web-dashboard | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` |
| observe | `docs/specs/observe.md` | `packages/observe/rust/**` |
| ui-spec | `docs/ui-spec/00-overview.md` (entry for `docs/ui-spec/**`) | relevant area spec (here the herdr web dashboard spec) |

A correct answer therefore does all of:

1. cites an in-scope `path#anchor` as evidence;
2. says the cited file is a candidate carrier (header `Canonical: No`), its text is source text carried for review, and the legacy owner above (named, not cited as an anchor) is the binding route;
3. keeps apart, wherever the scenario touches it: carried statement (including carried status words), current binding owner, and implemented code or tests (not readable in scope; any claim of "implemented", "tests exist", "shipped", "retired" or "migrated" is UNPROVEN);
4. for an edit, says it goes once to the legacy owner (never dual-author: `SW#1-operating-invariants`, `SW#4-resolution-algorithm-for-readers-and-writers`; equivalent `MR#1-core-principles`), that edits under `docs/specs/**` or `docs/architect/**` need a reviewed ratchet exception (`SW#4...` step 6; equivalent `MR#2-legacy-roots-ratchet-and-exceptions`), and that candidate impact is recorded in migration tracking (`MR#1-core-principles` item 4), not by editing the carrier.

Legacy-authority answer (fails the answer): citing a legacy path as an `#anchor` (the reader cannot open it); treating a candidate carrier as binding; treating a carried status or claim as proof (`> Trạng thái: IMPLEMENTED` and `coverage: implemented` in the confinement spec, `coverage: full` and "Open Gaps: none" in the plugin spec, "9 tests" in the drift spec, "18 paths match 1-to-1" in the herdr spec, "chuyển trọn gói sang Rust" in the observe spec, `status: active` and `version: "0.1.0"` front matter in the ui-spec files); following a link to `plans/`, `docs/specs/`, `docs/history/`, `packages/` or the codebase (the area portals send readers to `plans/260925-.../reports/phase-06/step-08-report.md` and `component-boundary.md`: out of scope, do not open).

Missing the candidate versus binding-owner distinction, the carried-statement versus implemented-behavior distinction, or an area-specific conflict named below, where the scenario rests on it, is partial, not correct.

## 2. Reading scope and start file

Start file: `P/README.md` (accepted platform portal; §4 `PRT#4-how-to-change-platform-docs` is the how-to). Supporting: `SW`, `GOV`, `MR`. Area files per brief. A reader's three-scenario run may open at most 8 files in total.

Common owners reused below (support files): `SW#1-operating-invariants`, `SW#2-area-authority-routes`, `SW#3-root-document-routes`, `SW#4-resolution-algorithm-for-readers-and-writers`, `GOV#3-document-types` (Spec, Contract, Decision, Proposal, Guide types), `GOV#4-authority-matrix`, `GOV#5-metadata` (header; implementation-alignment table: claim, status, evidence), `GOV#7-discussion-scratchpad-workflow` (promotion targets), `GOV#8-intent-preservation`, `GOV#13-migration-rule`, `MR#1`, `MR#2`, `MR#3-authoring-new-platform-documentation`.

Generic rows, accepted in every scenario unless a row says otherwise: Q1 may open with `PRT#4-how-to-change-platform-docs` then `SW#4...` then the area row `SW#2...` then `<area>/README#added-in-candidate-read-this-area`. Q6 always includes: settled decision goes to a Decision record (`GOV#3-document-types`), settled fact to the Spec, both at the legacy owner once, plus candidate impact recorded in migration tracking (`MR#1-core-principles`).

## 3. Area agent-confinement (AC)

Files: `AC/README.md`, `AC/spec.md`, `AC/contracts/confinement-authority-v1.md` (C), `AC/decisions/confinement-authority-decisions.md` (D), `AC/history/rollout-and-settled-facts.md` (H). Candidate carriers split from `docs/specs/confinement-authority.md`; original section numbers kept (the spec carries no body for §6, §10, §12, §13.1 or §13.3: they sit in C, H, D; §13.2 and the deferred items stay in the spec).

Known in-area conflict (do not score against the reader): the spec header block (`spec#spec-agent-confinement-authority`) says the live `.fgos/config.json` has no `confinement` key and live migration is deferred, while `spec#14-pointers-hiện-tại` says the same file's invocations declare `confinement.backend`. A reader may not pick a side as fact; flagging it as unresolved and UNPROVEN in scope is the credited answer.

### Scenario AC-A: add a second backend driver (container-based) beside bwrap

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard row (legacy-current) first, then the carried spec and contract as candidate text | `SW#2...`; `SW#4...`; `AC/README#added-in-candidate-read-this-area`; `spec#spec-agent-confinement-authority`; `C#6-canonical-contracts` |
| 2 | A contract-level change to a legacy-current runtime security boundary, not a config tweak; binding spec is `docs/specs/confinement-authority.md`, code under `src/runner/dispatch/confinement/**` | `spec#91-support-matrix-của-default` (default accepts only Linux bwrap, others `unsupported`); `C#65-backend-port`; `C#610-version-và-evolution`; `GOV#3...` |
| 3 | Backend port and machine registry (driver type, schema), attestation records driver version, error taxonomy, one-door rule (adapters never called directly), doctor/setup registration; remote/container profile needs recovery contract and journal/lease before `required` | `C#65-backend-port`; `C#62-nơi-đặt-policy`; `C#621-trust-boundary-của-backend-registry`; `C#66-confinementattestation`; `spec#86-crash-và-cleanup`; `spec#52-quy-tắc-dependency`; `spec#115-doctorsetup`; `SW#2...` |
| 4 | High: fail-closed security boundary; project config cannot define machine backend instances; no silent backend fallback; runtime boundary change triggers the component-boundary check the README names (`component-boundary.md`, out of scope, name it only); legacy edits need a ratchet exception | `spec#4-threat-model`; `C#621-trust-boundary-của-backend-registry`; `spec#5-component-boundary`; `README#added-in-candidate-verification-and-change-boundary`; `SW#4...`; `MR#2...` |
| 5 | Contract tests (unknown driver type and bad driver config rejected), one-door tests, behavior probes, observability pins, doctor check per backend instance; driver version change reruns golden tests, probes and doctor. Carried "IMPLEMENTED" is not proof | `spec#11-proof-và-definition-of-done`; `spec#111-contract-tests`; `spec#112-one-door-tests`; `spec#113-behavior-probes`; `spec#115-doctorsetup`; `C#610-version-và-evolution`; `GOV#5-metadata` |
| 6 | Support-matrix row and contract version are settled facts for the spec; the choice of driver is a Decision (`D#12-quyết-định-của-proposal` shows the shape); both authored once at the legacy owner; candidate impact tracked | `D#12-quyết-định-của-proposal`; `spec#91-support-matrix-của-default`; `GOV#3...`; `MR#1...` |

Partial: describing the contract change without naming the legacy binding owner; citing `spec#spec-agent-confinement-authority` ("IMPLEMENTED") as proof the door exists. Legacy-authority: authoring the driver into `AC/contracts/` and calling that the contract.

### Scenario AC-B: make strict mode the default and move live executors to backend references

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard, then the carried status block, the settled-facts and the rollout history | `SW#2...`; `spec#spec-agent-confinement-authority`; `spec#added-in-candidate-current-settled-facts-and-deferred-items`; `H#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành` |
| 2 | A rollout and config-migration decision gated by open deferred items; not new design. Observe-first is the rollout order | `spec#tồn-đọng-mở-open-deferred-items`; `H#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành`; `spec#9-default-implementation-đầu-tiên` (item on migrating the three bwrap executors) |
| 3 | `runner.confinement.strict` (default false) and per-executor `confinement` keys, capability policy ids, doctor readiness; shared project-over-global config rule; the carried-text conflict above must be surfaced | `C#62-nơi-đặt-policy`; `spec#115-doctorsetup`; `spec#14-pointers-hiện-tại`; `spec#spec-agent-confinement-authority` |
| 4 | High: refusing dispatch (`required`, zero spawn) when a capability lacks a policy; pins posture of 17 executors; the carried text says a live migration attempt was reverted; deferred items (inherited unconfined anchor, thin attestation, reaper caller) remain open | `spec#82-required-preferred-unconfined`; `spec#87-bảng-tình-huống-chuẩn`; `spec#114-observability`; `spec#tồn-đọng-mở-open-deferred-items` |
| 5 | Doctor readiness reports, pinned executor posture, closing the deferred items first; evidence per governance (status, evidence, gap), not the header word | `spec#115-doctorsetup`; `spec#114-observability`; `spec#tồn-đọng-mở-open-deferred-items`; `GOV#5-metadata` |
| 6 | The strict-default choice is a new Decision that supersedes the earlier one rather than rewriting it; staged rollout stays visible (intent preserved); done at the legacy owner | `D#12-quyết-định-của-proposal`; `GOV#8-intent-preservation`; `GOV#3...`; `H#10...` |

Partial: asserting the live config shape (either side) as fact. Legacy-authority: treating the header's "strict stays false" as current truth without UNPROVEN.

### Scenario AC-C: a new agent-CLI release changes how its terminal UI starts sessions

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Decision record for the codex pane and the rollout formula history, via the switchboard | `SW#2...`; `D#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên`; `H#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên` |
| 2 | An executor-invocation change plus a decision record, not a contract change; confinement is the bwrap door, the provider's own sandbox is off by decision; backend stays provider-agnostic (provider normalizer owns recipes) | `D#133-...`; `D#12-quyết-định-của-proposal` (provider normalizer row); `H#131-...` |
| 3 | Resource-binding recipe (private home) and request contract; login-renewal and write-back rules are owned by the runner spec (`docs/specs/runner.md`, named in the carried text, binding, not opened); invocation lives in `.fgos/config.json` | `H#131-...`; `C#63-confinementrequest`; `spec#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược`; `spec#14-pointers-hiện-tại` |
| 4 | Medium-high: provider sandbox off means bwrap is the only confinement; the incident cause is stated "not yet proven", so the mechanism must be carried as hypothesis | `D#133-...` (the "Chưa chứng minh" paragraph); `spec#4-threat-model`; `spec#113-behavior-probes` |
| 5 | Reproduction under the exact mount, pinned write grants, probes; the unproven mechanism stays UNPROVEN until reproduced | `spec#113-behavior-probes`; `spec#114-observability`; `D#133-...` |
| 6 | Record decision date, reason, evidence and the unproven part so it is not re-derived; one owner, legacy | `D#133-...`; `H#131-...`; `GOV#3...`; `MR#1...` |

Partial: asserting the daemon-updater cause as proven; moving the recipe into the driver.

## 4. Area claude-plugin (CP)

Files: `CP/README.md`, `CP/spec.md`. Carrier of `docs/specs/fgos-plugin.md`. Known in-area gap: spec R1 says the plugin wraps exactly 12 verbs and R4 lists unwrapped verbs; whether that matches `plugins/fgOS/**` cannot be proven in scope, so any "wrapper X already exists" or "does not exist" is UNPROVEN.

### Scenario CP-A: add a slash-command wrapper for the `triage` verb

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard plugin row, then portal read-first, then the spec's rules and pointers | `SW#2...`; `CP/README#added-in-candidate-read-this-area`; `spec#business-rules`; `spec#pointers-implementation` |
| 2 | A plugin-layer convenience addition: new skill file plus the spec's verb list/rules at the legacy owner; not new lifecycle behavior | `spec#business-rules` (R1, R4); `spec#entry-points-triggers`; `spec#spec-fgos-plugin-claude-code-slash-command-surface` |
| 3 | R2 one-door-write and R3 error handling; the wrapped verb's own rules belong to Work-State (`docs/specs/work-state.md`, named); plugin manifest/skill file under `plugins/fgOS/**` | `spec#business-rules`; `spec#actors-access`; `spec#pointers-implementation`; `SW#2...` (work-state row) |
| 4 | Low for a read-only verb; real risks: stating the verb's behavior in the plugin spec (dual-authoring), leaving R1's "exactly 12" and R4 stale, edit under a legacy root needs an exception | `MR#1...`; `MR#2...`; `spec#business-rules`; `SW#4...` |
| 5 | The shipped skill file exists and resolves the CLI (project-local, global, or a stated error) and the spec entries, rule and R4 list are updated; the spec's own "evidenced against shipped files" claim is carried, not proof | `spec#open-gaps`; `spec#pointers-implementation`; `GOV#5-metadata` |
| 6 | Update R1, R4 and the entry list once at the legacy owner; the backlog is a generated projection, not hand-edited | `spec#business-rules`; `SW#3-root-document-routes` (backlog row); `MR#1...` |

Partial: claiming the wrapper already exists/does not exist. Legacy-authority: treating `coverage: full`/"Open Gaps: none" as proof.

### Scenario CP-B: make `move` reject illegal target statuses inside the plugin

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | The `move` behavior and the edge case, then the work-state row | `spec#move`; `spec#edge-cases-settled`; `SW#2...` (work-state row) |
| 2 | Not a plugin change: legality is checked by Work-State; plugin pre-validation would copy lifecycle rules and contradicts the settled edge case | `spec#move`; `spec#edge-cases-settled`; `spec#spec-fgos-plugin-claude-code-slash-command-surface` (lifecycle owned by Work-State); `MR#1...` |
| 3 | R2/R3 and the verbatim-error edge case; binding owners `docs/specs/work-state.md` and `docs/io-contract.md` (switchboard work-state row), candidate `docs/platform/work-state/**` not read | `spec#business-rules`; `spec#edge-cases-settled`; `SW#2...` |
| 4 | Drift (a plugin copy of the status set goes stale), false rejections, R3 "never guess" | `spec#data-dictionary` (target status owned by Work-State); `spec#edge-cases-settled`; `MR#1...` |
| 5 | Proof is on the Work-State side; for the plugin only that the underlying error surfaces verbatim; no claim of behavior from this file | `spec#open-gaps`; `spec#pointers-implementation`; `GOV#5-metadata` |
| 6 | If the settled edge case is changed, supersede it as a Decision at the legacy owner; do not rewrite history | `spec#edge-cases-settled`; `GOV#3...`; `GOV#4-authority-matrix`; `MR#1...` |

Partial: answering without naming Work-State as binding owner.

### Scenario CP-C: restrict `approve`/`move` by role and require confirmation in the plugin

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Actors section and business rules | `spec#actors-access`; `spec#business-rules`; `SW#2...` |
| 2 | A new authorization capability, not a plugin tweak: the spec says the plugin adds no role model; any role comes from the underlying tool | `spec#actors-access`; `spec#business-rules` (R2) |
| 3 | R2 (one-door-write) and the actor table; underlying tool owns roles (`docs/specs/work-state.md`/CLI, named); a plugin-side gate would be a second write path or policy fork | `spec#actors-access`; `spec#business-rules`; `SW#2...` |
| 4 | High: forking policy, breaching R2/R3; a confirmation prompt is a UX-only addition, a role gate is not | `spec#business-rules`; `spec#actors-access`; `MR#1...` |
| 5 | Needs an owner decision and code/tests in the owning tool first; claim that the plugin enforces a role needs code evidence not this file | `spec#open-gaps`; `GOV#5-metadata`; `GOV#4-authority-matrix` |
| 6 | Record a new Open Gap or Decision at the legacy owner; if staged, preserve intent | `spec#open-gaps`; `GOV#8-intent-preservation`; `GOV#3...` |

Partial: treating confirmation and role gating as the same change without distinguishing them.

## 5. Area decision-citation-drift (DD)

Files: `DD/README.md`, `DD/spec.md`. Carrier of `docs/specs/decision-citation-drift.md`. Known in-area conflicts: (a) the switchboard row says the spec owns "baseline ratchet rules" but the carried spec has no baseline concept (flag; do not invent one); (b) the spec's default decisions directory is `docs/decisions` while its pointers note says that corpus format was retired (`spec#pointers-implementation`): whether the check still has anything to scan is UNPROVEN.

### Scenario DD-A: wire the check into an npm script and CI gate

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Entry points and open gap, switchboard row | `SW#2...`; `spec#entry-points-triggers`; `spec#open-gaps`; `DD/README#added-in-candidate-read-this-area` |
| 2 | Infra/gating change around an existing check, not a behavior change; the gap is stated, wiring needs a gate owner | `spec#open-gaps`; `spec#actors-access` |
| 3 | Exit semantics (0 none, 1 findings), fixed scan scope (R3), script at `scripts/check-decision-citation-drift.mjs` (retained source in switchboard row); a new gate is a new infra dependency to register with setup/doctor (repo rule outside scope; may be named) | `spec#behaviors-operations`; `spec#run-citation-drift-scan`; `spec#business-rules`; `SW#2...` |
| 4 | Gate may block on existing findings; current findings unknown (one finding recorded 2026-07-26 is history); the retired decision corpus may make a gate vacuous or failing | `spec#edge-cases-settled`; `spec#pointers-implementation`; `spec#open-gaps` |
| 5 | A real run on the repo with exit code, the carried "9 tests" as unverified, and the gate present in the runner; do not trust the carried count | `spec#pointers-implementation`; `spec#run-citation-drift-scan`; `GOV#5-metadata` |
| 6 | Close the Open Gap once at the legacy owner; candidate impact recorded | `spec#open-gaps`; `MR#1...`; `GOV#3...` |

Partial: not flagging the retired-corpus or baseline-ratchet conflict.

### Scenario DD-B: extend the scan scope to `docs/platform/**`

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | R3 and the data dictionary scope row; switchboard invariant that `docs/platform/**` is not yet universal authority | `spec#business-rules`; `spec#data-dictionary`; `SW#1-operating-invariants` |
| 2 | A change to a settled rule (R3) of a legacy-current check, in a migration where target docs are candidate | `spec#business-rules`; `SW#2...`; `SW#1...` |
| 3 | R3 scope (backlog plus specs), `--specs-dir`/default flags, finding shape carries file path; candidate carriers duplicate legacy text | `spec#entry-points-triggers`; `spec#data-dictionary`; `spec#business-rules` |
| 4 | Duplicate findings from carried text, scanning non-authority files, the scope must move again at cutover | `SW#2...`; `SW#4...`; `MR#1...` |
| 5 | Updated tests for scope, real run, scope matches the then-current owners | `spec#pointers-implementation`; `spec#edge-cases-settled` |
| 6 | R3 change recorded as a Decision at the legacy owner; migration tracking notes the scope dependency | `spec#business-rules`; `MR#1...`; `GOV#13-migration-rule` |

### Scenario DD-C: make the check auto-fix flagged lines

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Actors table and open gap on auto-fix | `spec#actors-access`; `spec#open-gaps`; `spec#behaviors-operations` |
| 2 | Reverses a settled read-only property (detection only); an owner scope decision | `spec#behaviors-operations`; `spec#actors-access` |
| 3 | The read-only guarantee; the files it would edit are the backlog (generated projection, never hand-edited per switchboard) and legacy specs (frozen, ratchet) | `SW#3-root-document-routes`; `MR#2...`; `spec#behaviors-operations`; `SW#4...` |
| 4 | High: edits to frozen legacy specs refused without exception; auto-adding a superseding id falsely asserts the line is aware | `spec#open-gaps`; `spec#business-rules` (R1); `MR#2...` |
| 5 | Tests plus ratchet pass plus no false acknowledgements; not provable from this file | `spec#pointers-implementation`; `MR#2...` |
| 6 | Decision recorded and Open Gap closed at the legacy owner | `spec#open-gaps`; `GOV#3...`; `MR#1...` |

## 6. Area distillery (DI)

Files: `DI/README.md`, `DI/spec.md`. Carrier of `docs/specs/distillery.md`. Known in-area gap: the spec says legal moves follow "the enum's legal order above" but no explicit transition table is carried; a reader who asserts specific legal transitions as fact is partial.

### Scenario DI-A: add a new lifecycle status `deferred`

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard row, then data dictionary and rules | `SW#2...`; `DI/README#added-in-candidate-read-this-area`; `spec#data-dictionary`; `spec#business-rules` |
| 2 | A lifecycle (state-machine) change, spec-level; binding spec `docs/specs/distillery.md`, rule code in `src/state/porting.mjs` (pointer) | `spec#data-dictionary`; `spec#business-rules` (R3); `spec#pointers-implementation` |
| 3 | Status enum and legal moves, durable record as truth (R2), seeding using only legal moves, exported package subpaths used by an outside project | `spec#data-dictionary`; `spec#behaviors-operations`; `spec#pointers-implementation` |
| 4 | Moderate-high: replaying history with a new enum value, seeding idempotence, external consumers, human log sync; transitions table not carried | `spec#business-rules`; `spec#behaviors-operations`; `spec#pointers-implementation` |
| 5 | Illegal move leaves record and log unchanged; seeding reaches every recorded status through legal moves; the carried "no candidate needed an exception" is as-of-writing, UNPROVEN now | `spec#behaviors-operations`; `spec#edge-cases-settled` |
| 6 | Update the enum and rules once at the legacy owner; Open Gaps adjusted | `spec#open-gaps`; `GOV#3...`; `MR#1...` |

### Scenario DI-B: someone hand-edits a status in the human-readable porting log

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | R2 and the advance behavior | `spec#business-rules`; `spec#behaviors-operations` |
| 2 | An operation via the `move` verb, not a doc edit; Score, Local, destination, commit and notes remain free to edit (R1) | `spec#business-rules`; `spec#data-dictionary` |
| 3 | Durable record is the truth, the log is a reflection; the log path and the record path are in pointers (not opened) | `spec#business-rules`; `spec#pointers-implementation` |
| 4 | Silent divergence between record and log; the carried spec describes no correction path for a wrong but legal move: UNPROVEN | `spec#open-gaps`; `spec#edge-cases-settled` |
| 5 | After a move the record shows the change and the log equals the record; illegal moves refused with an explanation | `spec#behaviors-operations` |
| 6 | If a correction path is missing, record the gap at the legacy owner | `spec#open-gaps`; `MR#1...` |

### Scenario DI-C: add cross-source comparison and candidate ranking

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Purpose and open gaps; switchboard row naming the skill as operational surface | `spec#purpose`; `spec#open-gaps`; `SW#2...` |
| 2 | A new capability beyond the carried spec (`coverage: partial`); needs a spec before code at the legacy owner; do not author candidate files under `docs/platform/distillery/` (legacy-current) | `spec#open-gaps`; `spec#purpose`; `SW#4...` |
| 3 | Score is free-form and not lifecycle-governed (R1); the skill is the operational surface; status lifecycle must stay untouched | `spec#business-rules`; `spec#data-dictionary`; `SW#2...` |
| 4 | Low-moderate: scope creep, Score semantics, accidentally touching the status lifecycle | `spec#open-gaps`; `spec#business-rules` |
| 5 | Nothing to prove until a spec states behavior; update coverage then | `spec#open-gaps`; `GOV#5-metadata` |
| 6 | New spec sections and Open Gap closure at the legacy owner | `spec#open-gaps`; `MR#1...`; `GOV#3...` |

## 7. Area herdr-web-dashboard (HW)

Files: `HW/README.md`, `HW/spec.md`, `HW/operations/operator-runbook.md` (RB), `HW/contracts/fgos-gateway-api-v1.yaml` (GW). Carrier of `docs/specs/herdr-web-dashboard.md`; the runbook's switchboard owner is `docs/operator-runbook-herdr-cockpit.md`; the contract's legacy twin is `docs/contracts/fgos-gateway-api-v1.yaml` (named in `spec#open-gaps`).

Known in-area conflict (do not score against the reader): `spec#open-gaps` says there is no edit route (`/work/{id}` is `get` only), but the carried contract has a `patch` (operationId `editWork`) on `/work/{id}` (`GW#unheaded-block-11`, schema `GW#unheaded-block-33`). Also the spec says 18 paths; the carried contract lists 19 path keys. A reader must surface the conflict and mark which statement is current UNPROVEN, not resolve it by path, date or richness.

### Scenario HW-A: implement edit-a-work-item in the web client

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Edit behavior, open gaps, contract; switchboard herdr row | `SW#2...`; `spec#edit-a-work-item`; `spec#open-gaps`; `HW/README#added-in-candidate-read-this-area` |
| 2 | Client feature through the gateway verb (`fgos edit`), not new server logic; blocked on knowing whether the route exists | `spec#edit-a-work-item`; `spec#business-rules` (R1, R2); `spec#open-gaps` |
| 3 | The gateway API contract is stated as the boundary's source of truth; the spec and the carried contract disagree on the edit route; one-door-write (R2); fields subset `EditableWorkFields` | `spec#open-gaps`; `GW#unheaded-block-11`; `GW#unheaded-block-33`; `spec#business-rules` |
| 4 | Writes on a surface that is on by default and reachable beyond loopback, one token covers everything | `spec#business-rules` (R5, R8); `spec#actors-access` |
| 5 | Route present in the contract and matched by gateway registration, tests; the "matches 1-to-1" claim is carried, not proof | `spec#open-gaps`; `GW#unheaded-block-11`; `GOV#5-metadata` |
| 6 | Update the Open Gap once at the legacy owner; the gateway contract is a cross-area contract with its own owner | `spec#open-gaps`; `PRT#1-platform-wide-anchors` (contracts row); `MR#1...` |

Partial: stating the route does or does not exist as fact. Legacy-authority: citing `docs/contracts/fgos-gateway-api-v1.yaml#...`.

### Scenario HW-B: an operator wants the dashboard off by default and loopback-only

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | R5, R8 and the entry-point availability trigger | `spec#business-rules`; `spec#entry-points-triggers`; `SW#2...` |
| 2 | An owner product and security decision with stated consequences, not an implementation tweak; do not silently reverse it | `spec#business-rules` (R8); `spec#open-gaps` |
| 3 | Config toggle and bind default, token auth (R3/R4), gateway bearer scheme; setup/doctor registration for any default change | `spec#entry-points-triggers`; `spec#business-rules`; `GW#unheaded-block-28` |
| 4 | High: R8 states the default is exposure of a trunk-changing surface; authorization granularity unresolved | `spec#business-rules` (R8); `spec#open-gaps`; `spec#actors-access` |
| 5 | Config default test, warning when bind is not loopback, token never committed (R4); carried text is not proof | `spec#business-rules` (R4, R5); `spec#edge-cases-settled` |
| 6 | A Decision recording the new default and its consequences, superseding the old; R5/R8 updated once at the legacy owner | `GOV#3...`; `spec#business-rules`; `MR#1...` |

### Scenario HW-C: push a notification when a question is waiting

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | R11, entry-point note, open gap, and the contract scope paragraph | `spec#business-rules` (R11); `spec#entry-points-triggers`; `spec#open-gaps`; `GW#unheaded-block-2` |
| 2 | A new unbuilt capability (attention channel), outside this spec; needs its own item and spec | `spec#open-gaps`; `spec#entry-points-triggers`; `GW#unheaded-block-2` |
| 3 | R11 conflict; the runbook's native notification belongs to the cockpit dashboard pane (TUI chrome), not the web surface; runbook owner `docs/operator-runbook-herdr-cockpit.md` | `RB#what-each-pane-does`; `RB#hard-rule`; `spec#business-rules`; `SW#2...` |
| 4 | Contradicts a settled rule; needs an authorization/delivery model that does not exist | `spec#business-rules`; `spec#open-gaps` |
| 5 | A new spec and contract must exist first; nothing here can prove it | `spec#open-gaps`; `GOV#5-metadata` |
| 6 | R11 changes only by a superseding Decision, never an in-place edit | `GOV#3...`; `GOV#4-authority-matrix`; `spec#business-rules` |

Partial: treating the runbook notification as web push.

## 8. Area observe (OB)

Files: `OB/README.md`, `OB/spec.md`, `OB/decisions/observe-component-architecture.md` (D). Carrier of `docs/specs/observe.md` (the decision section carried in D is its §6). Owner for implementation `packages/observe/rust/**`. Known in-area gap: whether the Rust migration the spec describes is complete is UNPROVEN in scope.

### Scenario OB-A: add a friction subcommand (`friction reopen`)

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard row, then commands/routing and the friction section | `SW#2...`; `OB/README#added-in-candidate-read-this-area`; `spec#4-commands-routing`; `spec#friction-làn-b` |
| 2 | Extension of a native Rust command surface with a single writer; Node refuses (`nativeOnly`) | `spec#4-commands-routing`; `D#d-adr0037-observe-component-architecture` |
| 3 | Subcommand list, versioned `observe.friction.v1` contract, golden fixtures, doctor checks, `fgos.v1` envelope, shard-per-writer store and lock | `spec#4-commands-routing`; `spec#contract-quyết-định-làn-c-f8`; `spec#3-storage-model`; `spec#owns` |
| 4 | Moderate-high: append-only shards, lock TTL, best-effort side channel, Work must not read friction; contract version; ratchet | `spec#3-storage-model`; `D#d-adr0037-observe-component-architecture`; `spec#must-not-own`; `SW#4...` |
| 5 | Rust tests, regenerated golden fixtures, doctor checks; "migrated wholly to Rust" is carried, UNPROVEN | `spec#contract-quyết-định-làn-c-f8`; `GOV#5-metadata` |
| 6 | Subcommand list and friction section updated once at the legacy owner; a Decision only if semantics change | `spec#4-commands-routing`; `D#6-lịch-sử-quyết-định`; `MR#1...` |

### Scenario OB-B: make Work show or join friction

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | The decision section and the must-not-own list | `D#d-adr0037-observe-component-architecture`; `spec#must-not-own` |
| 2 | Reversing a settled decision (Work stops reading friction, `learning.frictions` dropped); needs a superseding Decision, not an edit | `D#d-adr0037-observe-component-architecture`; `GOV#3...`; `GOV#4-authority-matrix` |
| 3 | Boundaries: Observe independent; composition root wires; `work` subject owned by the work-state package | `spec#must-not-own`; `spec#2-shared-entities-subjects`; `spec#1-overview-boundaries` |
| 4 | High: inverts dependencies and re-adds a removed close-event field | `D#d-adr0037-observe-component-architecture`; `spec#must-not-own` |
| 5 | A Decision supersession plus tests in both components; carried text is not proof | `GOV#4-authority-matrix`; `GOV#5-metadata` |
| 6 | Supersede the Decision at the legacy owner; do not edit history | `D#6-lịch-sử-quyết-định`; `GOV#3...` |

### Scenario OB-C: change the store (untracked shards, different lock TTL)

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Storage model and the decision about tracked shards | `spec#3-storage-model`; `D#d-adr0037-observe-component-architecture`; `SW#2...` |
| 2 | Storage contract change in a Rust component | `spec#3-storage-model`; `spec#1-overview-boundaries` |
| 3 | Lock (`O_CREAT|O_EXCL`, TTL 30 s), shard path, tracked in git, doctor check on the observe dir, versioned contracts | `spec#3-storage-model`; `D#d-adr0037-observe-component-architecture`; `spec#contract-quyết-định-làn-c-f8` |
| 4 | High: data store with a migration cursor, tracked data in other worktrees, concurrent writers, doctor checks | `spec#3-storage-model`; `D#d-adr0037-observe-component-architecture` |
| 5 | Golden fixtures, doctor checks, lock recovery tests (dead holder, TTL) | `spec#contract-quyết-định-làn-c-f8`; `spec#3-storage-model` |
| 6 | Supersession of the tracked-shard decision at the legacy owner; spec §3 updated once | `D#6-lịch-sử-quyết-định`; `GOV#3...`; `MR#1...` |

## 9. Area ui-spec (UI)

Files: `UI/README.md`, `UI/spec.md`, `UI/contracts/20-domain-rules.md` (R), `UI/contracts/15-system-events.md` (E), `UI/architecture/screens/S04-questions-needing-answer.md` (S04), `UI/architecture/spec.config.yaml.md` (CFG). The legacy owner is `docs/ui-spec/**` (entry `docs/ui-spec/00-overview.md`); product rules are owned by the herdr web dashboard area spec (`docs/specs/herdr-web-dashboard.md`; not in this reader's scope).

Known in-area conflicts (do not score against the reader): (a) `spec#how-to-work-on-this-spec` says `generated/` is gitignored build output, while `README#added-in-candidate-tool-root-obligation` says the five generated outputs stay in place with regenerate-from-source: surface, do not resolve. (b) The ratchet text (`MR#2...`) names `docs/specs` and `docs/architect` only; whether `docs/ui-spec` needs a reviewed exception is not stated in scope: an answer asserting a required exception for `docs/ui-spec` without that caveat is partial; saying "not stated" is credited. (c) Carried `status: active` front matter is source text, not binding.

### Scenario UI-A: add a screen S05 (settings and endpoint switcher)

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Switchboard UI row (legacy-current, entry `docs/ui-spec/00-overview.md`), portal registry, spec overview and how-to | `SW#2...`; `PRT#2-area-registry`; `UI/README#added-in-candidate-read-this-area`; `spec#herdr-web-dashboard-ui-spec-overview`; `spec#how-to-work-on-this-spec` |
| 2 | UI-layer work that cannot settle a product question: the screen must trace to the area spec first (multi-endpoint behavior is only partly decided there); authored in `docs/ui-spec/**`, not under `docs/platform/ui-spec/` | `spec#herdr-web-dashboard-ui-spec-overview`; `spec#surface-index`; `SW#4...` |
| 3 | Surface index and tree, `spec.config.yaml` (surface dirs, entry surface), rules mapping with the bidirectional `rules:` frontmatter check, state/error ids | `spec#surface-index`; `spec#directory-tree`; `R#domain-rules`; `CFG#added-in-candidate-provenance-for-specconfigyaml` |
| 4 | Moderate: the functioning compiler root remains `docs/ui-spec/`, so a screen written in the candidate tree is not compiled; dual-authoring; validate gate errors on dangling targets and rule drift | `README#added-in-candidate-tool-root-obligation`; `spec#how-to-work-on-this-spec`; `SW#1...`; `MR#1...` |
| 5 | `validate` passes (trust gate), `interpret-wireframe` regenerates, rules mapping bidirectional | `spec#how-to-work-on-this-spec`; `R#domain-rules` |
| 6 | Update the surface index and tree once at the legacy entry; add rule links; regenerate outputs rather than hand-editing | `spec#surface-index`; `spec#directory-tree`; `README#added-in-candidate-tool-root-obligation`; `MR#1...` |

### Scenario UI-B: add a notification bell with unread badge on the questions screen

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Domain rules (R11), the overview and S04 | `R#domain-rules`; `spec#herdr-web-dashboard-ui-spec-overview`; `S04#states` |
| 2 | A product-rule change, not UI polish: the UI layer draws the area spec's rules and adds none; the owner is the area spec | `R#domain-rules`; `spec#herdr-web-dashboard-ui-spec-overview` |
| 3 | R11 and surfaces S02/S04 `rules:` mapping; system events are client-derived by polling, nothing pushes; S04 interactions listen to events | `R#domain-rules`; `E#system-events`; `S04#interactions`; `S04#states` |
| 4 | Moderate: implies a push channel the area spec lists as unbuilt; rule drift error; misleading the person | `R#domain-rules`; `S04#states`; `E#system-events` |
| 5 | `validate` rule-drift gate, wireframe, and the area spec changed first | `spec#how-to-work-on-this-spec`; `R#domain-rules` |
| 6 | Decision and spec change at the area-spec owner, then mirrored once in the UI spec; no in-place R11 edit | `R#domain-rules`; `GOV#3...`; `MR#1...` |

### Scenario UI-C: refresh the clickable wireframe and make the compiler checks pass

| Q | Required distinction | Acceptable owners |
|---|---|---|
| 1 | Tool root obligation and how-to | `README#added-in-candidate-tool-root-obligation`; `spec#how-to-work-on-this-spec` |
| 2 | A build/regeneration task against the legacy compiler root, not authoring | `spec#how-to-work-on-this-spec`; `README#added-in-candidate-tool-root-obligation` |
| 3 | Compiler root layout, the five generated outputs, the schema carried as history; the gitignore versus stay-in-place conflict | `README#added-in-candidate-tool-root-obligation`; `spec#directory-tree`; `spec#how-to-work-on-this-spec` |
| 4 | Running against the candidate tree is uncertified (directory layout differs); committing generated copies adds a second copy | `README#added-in-candidate-tool-root-obligation`; `spec#directory-tree` |
| 5 | `validate` passes, outputs regenerated from source at the legacy root | `spec#how-to-work-on-this-spec` |
| 6 | The obligation (repoint the tool root or retain the legacy root before promotion) is the owner queue's, not this reader's to settle | `README#added-in-candidate-tool-root-obligation`; `GOV#13-migration-rule` |

## 10. Known gaps (do not score against the reader)

- None of the 7 areas has a promoted portal; switchboard step 4 forbids authoring candidate files for them, while `MR#3-authoring-new-platform-documentation` speaks only of `promoted`/`candidate`/uncreated areas. Noting the tension or following switchboard step 4 is credited; silence is partial.
- Each area README sends readers to `plans/260925-.../reports/phase-06/step-08-report.md` and to `component-boundary.md`. Both are out of scope; a reader who names them without opening is not penalized, one who opens them breaks the scope rule.
- Anchors in AC/spec and the yaml contract mostly resolve to long unheaded blocks; heading anchors above carry the same support.
- No reader has run. No candidate carrier is truth-reviewed; the A19/A28 truth pass is owed by the owners.

## 11. Pass criteria

Per reader (one per area), per scenario: at least 5 of 6 answers correct; 0 cited anchors that do not exist; 0 answers that rely on a legacy path as authority or treat a carrier or carried status word as binding; at most 8 files opened in total; 0 files opened outside the brief. Area set passes when all three scenarios pass.
