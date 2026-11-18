# Validation: project supervisor plan (2026-11-18)

Plan `plans/261118-1045-project-supervisor` (plan.md incl. the 2026-11-18 "Handoffs" paragraph, 19 phases) checked against HEAD `f1cd5635e` of `plan/supervisor`. Read-only; method of fgos-coding-validating (prove, never plausibility).

**Verdict: fail (NOT READY, return to the planner).** The decisions are well grounded and most cited lines hold, but four gaps stop the outcome from working at all, and sixteen more need plan edits. Every fix below is a plan or phase file edit; none reopens an owner decision except M5, which is put as a question.

Verified as cited (no finding): `land.rs:102-103` slot comment, `LandRequest` `:14`, `prepare_land` `:294`, `publish_land` `:673`, refusal codes; `timer.rs:33` (2 variants), `:68` `ALL`, `:117-139`, `:141`, `:158`, `:173`, `:339`, `:475`; `head-start.mjs:21` (32-char name), `:202-219` fronting; `head-grants.mjs:19-27`; `head_request.rs:33,37`, contract `verbTimeoutMs` 60000 and `busy`; `worker-slots.mjs:59,81,106,150`; `.githooks/pre-commit:424-455`, `:376-379`; `workerSlots.yaml` (`ceiling: null`); `runner.schema.yaml:489-495`; `bundle.rs:19-24`; marker lines of PS-15; `command-registry.mjs:125`; run-supervisor `Cargo.toml` has no `fgos-config` (PS-18). Phase table: every dependency is in an earlier wave and same-wave footprints are disjoint (scripted check of the table). `plan-contract-check.mjs` could not run on this machine (`git-addon-unavailable`, both checkouts), so that criterion is unproven here.

## Blockers

**B1. A confined head cannot reach any of the new socket verbs.** Today a CLI verb reaches the socket only through a per-verb confined branch: `bin/fgos.mjs:3473-3487` calls `startHead`/`rotateHead`, which check `FGOS_CONFINED` (`src/session-host/head-request.mjs:20,32-48`). Phase 10 adds the server side of `land`, `run`, `worktree create`, `request result`, `session stop`, `supervisor handled|done`. Phase 16 makes `land`/`supervisor` native Rust verbs. No phase adds the client side, so `fgos land` typed by a confined lead runs Rust Land inside the sandbox and fails, and there is no CLI form of `request result` at all, although phase 18 tells the heads to type these. Fix: phase 10 adds one confined door (`requestHead(verb,args)` behind the existing marker) and phase 16 makes each new verb route a confined caller to it, including `fgos run` and `fgos worktree create` (existing verbs, so their entries enter phase 16's footprint). Add `fgos request result <id>` to phase 16 step 3/4. Owning proof: one Node test per door in `head-request.test.mjs`.

**B2. Nothing writes this repo's `land.gates` / `land.regenerate`, so every `fgos land` refuses `land-gate-missing`.** PS-5 says "this repo's land-branch.sh list becomes its project config", but no phase edits `.fgos/config.yaml`, and it is not in the plan footprint. Acceptance 8 (live run) and every lead landing therefore fail. Fix: phase 19 step 1b (or phase 4) writes `land.gates` from `land-branch.sh` lines 43-46 (the seven test files; `cargo fmt --all --check` with `when: "**/*.rs"`) and `land.regenerate` = `node scripts/export-command-selectors.mjs && node scripts/git-one-door-scan.mjs --root . --write-census` with its three files, via `fgos config set` with a reason; add `.fgos/config.yaml` to the plan footprint and that phase's row.

**B3. The watcher never runs the ops-metrics liveness definitions nor the handed-over `question-answered`.** Phase 13 step 2 runs one dir, `--def core/watcher/definitions`; ops-metrics puts `head-gone` and `plan-no-progress` in `core/attention/definitions/` (`plans/261118-0936-ops-metrics/phase-14-attention-detections.md:26`), and the new Handoffs paragraph (plan.md "Non-goals" tail) has the watcher run `question-answered`, owned elsewhere. So the settled duty "gone/stuck lead: restart, park or ask" (SETTLED DESIGN item 3) never fires. `--def` is repeatable (`ops-metrics/phase-07...:28`). Fix: phase 4 adds key `watcher.definitions` (list of files/dirs; standard = the watcher dir plus the two attention files plus the question-answered file); phase 11 passes each as `--def`; phase 13 test proves the attention rows carry `{kind, reason, nextCommand, subject, ts}` or phase 11 maps them. Add the owner-questions plan to `blockedBy` (or mark the question-answered row "runs when present"); phase 18 adds the supervisor's duty for it.

**B4. The crate's dependencies are frozen in phase 3 without what later phases need.** Phase 3 step 1 allows only `fgos-yaml-doc, fgos-git, fgos-holder-lock, fgos-identity, serde, serde_json, thiserror`, and `packages/supervision/rust/ Cargo.toml` + `Cargo.lock` belong to phase 3 alone. Phase 8 needs `fgos-event-store` (`append.rs:177`, `read.rs:468`), phase 11 needs `sha2` (id = sha256), phase 14 needs `fgos-observe` (`RecordSource`), phase 13 tests run "the real Observe query" (`fgos-observe` dev-dep), phases 7/8/14 need temp-dir/fixture dev-deps. Those phases cannot be done inside their footprint. Fix: phase 3 step 1 lists every dependency and dev-dependency of phases 7-14.

## Major

**M1. Phase 7's regeneration flow does not work with the Land port.** A conflict not covered by declared files aborts the merge and returns `land-conflict-aborted` (`land.rs:540-555`); no candidate worktree remains to regenerate in. A second `prepare_land` with different `files` under the same operation id refuses `operation-id-reused` (`land.rs:351-366`), and step 6 gives the use case one id. Fix: step 3 = pre-merge read-only (`git merge-tree`, as `declareLandFiles`, `src/runner/merge.mjs:847-855`), take the target side for each declared generated file, prepare, regenerate in the candidate, and if bytes differ drop and prepare again with a fresh operation id at the same pinned target; test "a conflicting census lands regenerated".

**M2. Phase 9 edits `head-start.mjs` outside its footprint, at the wrong site.** `grantOf` is called in `placeHead` (`head-start.mjs:172`), also used by the rotation executor, not in `startHeadSession`. Fix: add `src/session-host/head-start.mjs` to phase 9's row; step 3 says "pass `projectRoot` from `placeHead`".

**M3. Phase 17 footprint misses files that name the deleted module.** `doctor-registry.v1.json:140` (owner map) and `:474-479` (judge file `src/state/worker-slots.mjs`, description "or explicitly null", contradicting step 4); `test/suite-baseline.json:226,557`; `docs/platform/component-boundary.md:1056`; the row text in `docs/platform/packaging-distribution/spec.md:586`. Fix: add them to phase 17 (wave 5 has no other writer).

**M4. Lane semantics are unsafe as written.** (a) Every Assignment goes through `buildEnvelope`/`startSupervisor` (`assignment-runner.mjs:1086,1147`): reviewers, judges and nested dispatch (`currentDispatchDepth`, `:71`) would each take a lane, so a seat that dispatches a child at ceiling 4 can deadlock. Phase 6 must say which attempts take a lane (e.g. top-level work seats) and test the nested case. (b) Lanes are machine locks (`<lockRoot>`), but `workerSlots.ceiling` is read per project with no `x-fgos-scope`; two projects with different ceilings share one pool. Phase 4 makes it `global-only` (config spec §3 rule on machine keys, `docs/platform/config/spec.md:69-77`).

**M5. Owner question: the lead's grant = the plan footprint, writable in the main checkout.** Workers write in linked worktrees, so these writes never reach the work, but any lead edit there makes its own lands refuse `main-checkout-dirty-mid-merge` (`land.rs:268-271`). Settled item 4 says "the plan's footprint as writes". Ask in five-part form in plan.md "Owner questions": (A) keep; (B) plan dir only (recommended: same function, no self-block). Phase 9 is marked blocked on it; the rest stays ready.

**M6. Tick span names disagree between phase 3 and phase 11.** Phase 3 declares attrs `fgos.watcher.mode|outcome`, measures `fgos.watcher.interval`, `fgos.plans.ready|running` (as `DISCUSSION.md:302-304`); phase 11 step 2.7 emits `raised, duplicate, wakes, notifies, errors, unmeasured, interval_sec`, and PS-13 says `interval_sec`. Fix: phase 11 emits exactly phase 3's names; phase 3 declares any extra counters; PS-13 says `fgos.watcher.interval`.

**M7. Pace definitions `watcher-overdue` and `supervisor-idle-burn` are undelivered.** `DISCUSSION.md:308-310` gives them to the supervisor side; phase 13 is titled "pace definitions" but writes only `watcher-active`; `watcher.overdueFactor` (phase 4) has no reader; a stopped watcher cannot detect itself, and `watcher-timer` (phase 15) judges only the unit. Fix: phase 13 writes both; phase 16's doctor group runs `watcher-overdue` as a read-only warn row (or drop the key).

**M8. PS-9 "done ends the session" is not built.** Phase 12 `done` answers `{done:true}`; nothing retires the supervisor, so it idles alive and later wakes return `already-live` with no reader. Fix: phase 12/16 `supervisor done` retires the caller through phase 10's `stopHeadSession`; phase 16 wiring proof checks it.

**M9. Notify path is incomplete.** No recipient key exists (phase 11 Inputs expects "the notify recipient" from phase 4); phase 11 routes action `none`, phase 4's enum lacks it. Fix: phase 4 adds `watcher.notifyTo` and `none`.

**M10. Two planners for one settled discussion.** Round 8: the secretary starts the planner; phase 13/18: the supervisor does on `discussion-settled`. Head-name fronting dedupes only while the first is live. Fix: phase 18's supervisor duty skips when a plan's `source` names the discussion or `head:planner-<name>` is live; phase 18 secretary row says the same.

**M11. Settled gate item "the plan's tests outside the sandbox" and backlog closure.** `fgos land` has no per-landing test input (land-branch.sh took them as `$@`, line 45), and phase 19 step 4 closes `p-dkkodseo63`, whose acceptance is "a seat can run `node --test`... `--verify` reports real pass/fail" (`docs/backlog.md:23`) — not delivered. Fix: phase 7 adds `--test <path>...` appended to a gate with `{tests}`; phase 19 leaves `p-dkkodseo63` open or records the owner's re-scope.

**M12. Live run (acceptance 8) runs the old release.** Plain `fgos`, the timer unit and the heads run the activated release (AGENTS.md "Legacy-Node CLI Ownership Boundary"), which lacks every new verb. Fix: phase 19 step 5 starts with build/stage/activate of the combined tree on the main checkout, `fgos doctor --fix` to install `watcher-tick`, and a doctor check through the installed shim.

**M13. `fgos session stop` as a CLI verb is owned by no phase** (session-verb plan adds none; `grep stop` there is empty), yet phase 1 lists it and phase 19 step 5 uses it. Fix: phase 16 registers `session stop` (Node route to `stopHeadSession`).

**M14. Event ids for projection rows.** Id = `kind|subject|ts` (phase 11 step 2.5); `head-gone` reads a live projection (`ops-metrics/phase-11...:21-24`) whose `ts` may be query time, giving a new id and a new wake every tick. Fix: phase 13 requires each watched definition to emit the state-change instant as `ts`; phase 11 tests a projection row twice.

**M15. New contracts are not shipped.** `test/event-store/consumers.test.mjs:16-21` requires every consumer `contractFile` in `package.json` `files`; `scripts/` ships and phase 3 makes it read `packages/supervision/contracts/plan-vocabulary.v1.json`. Fix: add `package.json` to phase 3's row and the plan footprint.

**M16. Cross-plan `retired` signal is assumed.** Phase 10 writes `retired.json` "the signal ops-metrics' head source reads"; ops-metrics phase 11 names no file. Fix: phase 10 step 0 reads the landed reader and writes exactly that.

## Minor

- m1 Phase 3 creates stubs `queue.rs ... discussion_source.rs` outside its row; list them. Step 2 wording is contradictory.
- m2 Depends-on gaps (waves already cover them): 11 needs 6 (lock row) and 13; 12 needs 2; 13 needs 4; 16 needs 13.
- m3 Phase 15 may edit `doctor/mod.rs` (step 5), owned by 16; drop or add to its row.
- m4 Phase 16 step 4 "delete its two imports": `bin/fgos.mjs:93` also imports `claimWork, ClaimError`; remove only `readWorkerSlotCeiling`. `observe_declarations.rs` is created by ops-metrics phase 1, not 8/11.
- m5 Phase 4 step 5: `fgos config refresh-docs` rewrites user files, not golden fixtures; name the fixture regenerator. `supervisor.maxLeads` default 3 differs from Round 7 "default = the lane count"; say why or use 4.
- m6 Phase 1 lists PS-1..PS-16 (there are 18) and "two departures"; the supervisor's `land --paths` grant (PS-14) is a third departure from item 3 "never lands".
- m7 Phase 5 says plan.md cites `:420-438`; it cites `:424-455`. `fgos worktree create` defaults to detached, which the new rule refuses: phase 10/18 require `--branch`. Wave-1 phases 3 and 4 commit before phase 5 lands: land 5 first.
- m8 Phase 18 rollback: phase 9 adds no `skills` field, so the "two missing skills" sentence is wrong.
- m9 Phase 12 outcome values differ from `DISCUSSION.md:305-307`; phase 3 declares the enum phase 12 uses.
- m10 Phase 6 extends Node launcher tests and maybe `tests/envelope_digest_vectors.rs` outside its row; name them.
- m11 Phase 17 creates `test/state/report-verb.test.mjs` (absent today); fine as a move, say so in the retire list.
- m12 Phase 7 `--paths` runs every gate on each portfolio edit; set `when` on the heavy ones in B2's config.

## Tests (one owning proof)

- Duplicates: phase 12 `plans` re-proves order and blocked/collision admissibility owned by phase 3 `tests/portfolio.rs` (keep only `leadsLive`/`maxLeads`); phase 7 re-proves Land port refusals (`main-checkout-dirty-mid-merge`, `land-slot-already-held`) owned by `packages/git/rust/tests/land.rs` (keep one pass-through proof); phase 10 proves "a ticket verb answers at once" in both Node and Rust (keep Rust for timeout survival, Node for the ticket file).
- Missing owners: `supervisor-events-unhandled` doctor row (phase 16), the mailbox notifier adapter (phase 16), lane take on adopt is listed (phase 6) but `lane-pool-over` has no test.

## Coverage vs settled design

Delivered: items 1, 3 (except M8), 5 (except M11 tests), 6 (M4), 7, 8, 9, 10. Undelivered: item 2 liveness triggers (B3), pace definitions (M7). Added beyond the design, each justified in the plan: ticket verbs, `land --paths`, census trunk-only hook, plan-vocabulary contract (all serve settled items; no RUL104 concern).

Status: DONE
Summary: fail (NOT READY): 4 blocker, 16 major, 12 minor; fixes are plan/phase edits plus one owner question (M5).


## Resolution (planner, 2026-11-18)

Phase table after revision: 19 phases, 6 waves; phases 9 and 18 `draft` (owner question Q1), all others `ready`. Contract check passes with the new blocker `261118-1159-owner-question-store` visible; on this branch it reports that blocker as unknown until its plan dir reaches the tree (see planner status).

- **B1** fixed: phase 10 step 2 adds one confined door (`SOCKET_VERBS` from the contract, `requestHeadVerb`); phase 16 step 4 adds the host rule (confined call of a contract verb goes to Node) and one `bin/fgos.mjs` arm covering `land`, `run`, `worktree create`, `request result`, `session start|stop`, `supervisor handled|done`; step 5 registers `request result` and `session stop`. Proofs: `head-request.test.mjs` (door), `test/cli/**` (wiring). PS-20.
- **B2** fixed: phase 19 step 5.2 writes `land.gates` / `land.regenerate` from land-branch.sh into `.fgos/config.yaml` (bootstrap commit, `when` on every heavy gate, m12); `.fgos/config.yaml` added to phase 19 and the plan footprint; doctor row `land-gates-configured` (phase 16).
- **B3** fixed: phase 4 key `watcher.definitions` (standard: `core/watcher/definitions`, the two `core/attention/definitions` files, `core/questions/definitions`); phase 11 passes one `--def` per entry, maps attention rows in the adapter, counts a missing path; `261118-1159-owner-question-store` added to `blockedBy`; phase 18 supervisor duty for `question-answered`.
- **B4** fixed: phase 3 step 1 declares every dependency and dev-dependency of phases 7-14 (`fgos-write-scope`, `fgos-event-store`, `fgos-observe`, `sha2`, temp-dir and Git/Event Store test support); later phases never touch the crate's `Cargo.toml` or `Cargo.lock`.
- **M1** fixed: phase 7 step 3 (pre-merge `merge_tree`, target-side bytes, regenerate, re-prepare with a fresh operation id); PS-4; test "a conflicting census lands regenerated".
- **M2** fixed: `head-start.mjs` added to phase 9; step 3 passes `projectRoot` from `placeHead` (`:172`).
- **M3** fixed: phase 17 footprint and step 5 cover `doctor-registry.v1.json:140,474-479`, `test/suite-baseline.json`, `component-boundary.md:1056`, `packaging-distribution/spec.md:586`.
- **M4** fixed: (a) only top-level seats take a lane (`FGOS_DISPATCH_DEPTH` 0, `lanes` envelope field written only then; phase 6, PS-12/PS-18; nested-seat test); (b) `workerSlots.ceiling` becomes `global-only` in phase 17.
- **M5** owner question: plan.md Q1 (five-part); phases 9 and 18 wait on it; PS-24 records the recommended answer.
- **M6** fixed: phase 3 step 6 declares the counters; phase 11 step 2.7 emits exactly those names; PS-13 says `fgos.watcher.interval`.
- **M7** fixed: phase 13 writes `watcher-overdue` and `supervisor-idle-burn` in `core/watcher/pace/`; phase 16 doctor row `supervision-pace` runs them; `watcher.overdueFactor` has that reader.
- **M8** fixed: phase 10 step 9 (route stops the caller after `done:true`), phase 12 `done`, phase 16 wiring proof, PS-9.
- **M9** fixed: phase 4 `watcher.notifyTo` and `none` in the action enum; phase 11 notifier reads it.
- **M10** fixed: PS-23; phase 18 supervisor skips when a plan's `source` names the discussion or its planner is live; secretary rows hand over.
- **M11** fixed: phase 7 `--test` into a `{tests}` gate; phase 19 leaves `p-dkkodseo63` open with a note.
- **M12** fixed: phase 19 step 5.1 builds, stages, activates, checks doctor through the shim; 5.3 installs the timer with `doctor --fix`.
- **M13** fixed: phase 16 step 5 registers `session stop`.
- **M14** fixed: phase 13 requires `ts` = state-change instant and a re-run test; step 0 stops on an ops-metrics `head-gone` with query-time `ts`; phase 11 test "projection row seen on three ticks raises once".
- **M15** fixed: `package.json` in phase 3's row and the plan footprint; step 5 adds `packages/supervision/contracts` to `files`.
- **M16** fixed: phase 10 step 0/7 reads the landed head-state source and writes exactly what it reads (or nothing).
- **m1** fixed (phase 3 footprint `packages/supervision/rust/src/**`, stubs named, step 2 rewritten). **m2** fixed (11 adds 6, 13; 12 adds 2; 13 adds 4 and moved to wave 2; 16 adds 13). **m3** fixed (`doctor/mod.rs` in phase 15's row). **m4** fixed (phase 16 step 6 keeps `claimWork, ClaimError`; `observe_declarations.rs` attributed to ops-metrics phase 1). **m5** fixed (no regenerator: fixtures hand-edited per README; `maxLeads` default 4). **m6** fixed (phase 1 lists PS-1..PS-24 and three departures). **m7** fixed (citation corrected; PS-7 rule = main checkout or trunk, linked worktrees pass; `worktree create` requires `--branch`; phase 5 step 5 lands first). **m8** fixed (phase 18 rollback). **m9** fixed (phase 3 declares the door's outcome enum and records the difference from the DISCUSSION list). **m10** fixed (phase 6 names the Node and vector tests). **m11** fixed (phase 17 says `report-verb.test.mjs` is a move). **m12** fixed (gate `when` lists in phase 19).
- **Tests**: phase 12 `plans` tests cut to `leadsLive`/`maxLeads`/`leadLive`; phase 7 keeps one Land pass-through proof; phase 10 Rust proves runner survival, Node the ticket file; `supervisor-events-unhandled` and the other doctor rows and the mailbox notifier get proofs in phase 16 step 9; `lane-pool-over` tested in phase 6.
