---
phase: 06
title: "Deletions (dead doctor row, process-observe route, dead crate functions) and spec updates with the approved Part A shapes"
status: pending
depends_on: [03, 04, 05]
parallel: "sequential: after phases 03, 04 and 05; phase 07 may run beside it only when SEAT has landed (disjoint files except registrations.mjs: coordinate by commit order)"
effort: ~1d
net_size: "Node −155 / Rust −47 / tests −215 (estimate)"
---

# Phase 06 — Deletions and spec updates

## Context

[plan.md](plan.md) Facts ("Specs and docs that name the old shape", "Prior art"); arbitration Part A §2 (approved shapes, to be written into each component's spec), §3 rows S11/§A #10, S-D1/S10, S-F1, S-F2, S-F3, S-G1, S-G2, S-G3, S-A3, RT-M6; D1 (the route goes once the door ships on every channel), D5 (accepted duplication recorded in the durable-file shape); red-team unsafe deletions 2 and 7; hand-off H12 (DOC lane told before merge); backlog `p-3c7681b8` (closes with the row deletion). Design principle 7 (code and docs agree at one source) and L10.

## Requirements

**Deletions**
- `coordination-abandoned-claims`: `src/setup/registrations.mjs:5991-6145` (`getAbandonedClaims` :5991, `processStartFingerprint` :6057, the `registerCheck` :6073 and `registerFix` :6095); **only** lines 47–115 of `test/setup/doctor-coordination-checks.test.mjs` (lines 16–45 own `runner-coordination-orgPolicy-shape`, registered at `registrations.mjs:6147`, and stay); the id in `test/setup/checks.test.mjs:193`; the three docs `docs/specs/distribution.md:78`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133, :135`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:331`. No replacement row and no replacement test: the mechanism is dead (nothing writes `claim.json`: `rg -ln "claim\.json" src packages apps bin` → `registrations.mjs` only). Close backlog row `p-3c7681b8` in `docs/backlog.md:58` with the reason.
- `fgos internal process-observe`: `packages/holder-lock/rust/src/route.rs:159` (usage line), `:182` (arm), `:474-505` (`process_observe`); `packages/holder-lock/contracts/internal-route.process-observe.v1.json`; `apps/fgos/tests/internal_lock_routes.rs:458-477` (retired: behaviour removed; the in-process observation is owned by `packages/process/rust/tests/judge_vectors.rs` and the phase-2 Node wiring case); `test/state/hot-lock-host-judge.test.mjs` (94 lines, retired whole: its route cases `:58, :67, :78, :84` are behaviour removed; its two judge behaviours moved in phase 3 into `test/state/hot-lock-multiprocess.test.mjs`). The Node client went in phase 3.
- `facts::start_time` (`packages/process/rust/src/facts.rs:254-259`), updating `tests/holders_multiprocess.rs:95` and `:140` to `facts::identity_of(pid).map(|t| t.start_time)` (or `self_identity()` where the pid is self) in the same commit; `kcmp_same_file` (`platform/linux.rs:415-419`, its re-export `facts.rs:530`, and the kcmp half of its test `:538-559`, keeping the fdinfo/table half that `own_lock_token`/`lock_table_entries` still need).
- The `pidExists` sentence and the Node-leaf sentences in the docs (below), so that `rg -n "pidExists|process-observe|observeViaHost" docs src packages apps test` returns nothing after this phase.

**Spec updates (the approved Part A shapes, written as they stand in arbitration §2)**
- `docs/platform/process/spec.md`: §2 ownership table unchanged except that the Node leaf sentence goes; §3 `:71-73` replaced by the door paragraph: Node reaches the judge through one in-process door (`src/runner/dispatch/process-identity.mjs`, six exports, ≤ 60 lines, no `/proc`, no `process.kill`), loaded by the T0 leaf `src/native/door.mjs`; the two caller policies (reclaim only on `dead`; signal only on `sent`); the named loader errors with their next steps; the H8 verification rule as OQ-1 decided; S1's invariant (boot id and pid namespace read once per process; no fgOS process that judges ever unshares after start). §8 gains one entry dated 2026-10-21 that **supersedes the 2026-10-16 Plan 4.2 entry (`:105`) by name**: the Node leaf and `pidExists` are retired, the owner's 12:05 decision and the T0 council (link the arbitration). §9 "Node leaf and its callers" row points at the door. §10: the containment table's `linux-pgroup` row says the leader is the subreaper (RT-M1) and `is_empty` answers `unknown` when any seen member cannot be judged (RT-M2).
- `docs/platform/component-boundary.md:78`: the sentence "the Node leaf `src/runner/dispatch/process-identity.mjs` reads the same vectors, and reconcile imports only `facts`" becomes "Node reaches it only through the in-process door (`src/native/door.mjs` → `src/runner/dispatch/process-identity.mjs`, six exports); reconcile imports the thin client". Two **new rows** for `canonical-json` and `durable-file` with the Part A authority sentence, ports, Rust/Node boundary and Node budget, the delete list outcome, and (durable-file) the accepted duplication of the four private no-fsync Rust helpers (D5) and why (a heartbeat fsync per tick). These rows are the specs of the two leaf crates until a spec file exists; link them from `docs/specs/reading-map.md` beside `:61`.
- `docs/platform/holder-lock/spec.md:229` (fix the `{v: 1, protocol: 1}` sentence to the protocol the routes answer), `:238` (drop the `process-observe` row), `:312` (the cleanup paragraph names the door, not the route).
- `docs/specs/reading-map.md:57` (route list without `process-observe`), `:59` (hot-lock line: "on Windows the holder's creation time is read in-process through the door"), `:61` (process spec line: "Node through the door `src/native/door.mjs`; thin client `src/runner/dispatch/process-identity.mjs`"), plus the two new boundary rows.
- `packages/process/contracts/containment.port.v1.json:28` (`spawn_in` errors gain `invalid-bwrap-prefix` and `driver-unavailable`, which the code returns at `linux.rs:88-105`, `windows.rs:74-77`), `:35` (`linux-pgroup.is_empty` describes the `/proc` row scan, not `kill(-pgid, 0)`), the `linux-pgroup` escapes list gains "a group scan after the leader died can meet a reused pgid" (spec `:137` already names it). The port's shape does not change (OPC constraint).
- Named errors with next steps (S-G1): the `lock-route-error` and `lock-route-bad-output` throws that remain in `src/holder-lock/driver.mjs` after phase 3 deleted the `process-observe` ones at `:286, :289` (`rg -n "lock-route-error|lock-route-bad-output" src/holder-lock/driver.mjs`) and the `process-containment` warn and fail texts in `src/setup/run-supervisor-checks.mjs:119-124` each gain one imperative next step (install bwrap / enable user namespaces / rebuild the host from this checkout). The durable-file error text was done in phase 5. `test/setup/run-supervisor-checks.test.mjs:98-118` owns the row's texts; extend its assertion, add no test.
- `CHANGELOG.md` `[Unreleased]`: the doctor row `coordination-abandoned-claims` is removed (dead mechanism); `fgos internal process-observe` is removed (Node judges in-process).

## Files

**Modify**: `src/setup/registrations.mjs` (delete :5991-6145; SEAT touches this file: tell SEAT, keep the diff to the deletion), `test/setup/doctor-coordination-checks.test.mjs` (delete :47-115), `test/setup/checks.test.mjs:193`, `docs/specs/distribution.md:78`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133, :135`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:331`, `docs/backlog.md:58`, `packages/holder-lock/rust/src/route.rs`, `apps/fgos/tests/internal_lock_routes.rs`, `packages/process/rust/src/facts.rs`, `packages/process/rust/src/platform/linux.rs`, `packages/process/rust/tests/holders_multiprocess.rs`, `docs/platform/process/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/holder-lock/spec.md`, `docs/specs/reading-map.md`, `packages/process/contracts/containment.port.v1.json`, `src/holder-lock/driver.mjs`, `src/setup/run-supervisor-checks.mjs`, `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`.

**Delete**: `packages/holder-lock/contracts/internal-route.process-observe.v1.json`, `test/state/hot-lock-host-judge.test.mjs`.

**Tests to retire** (owner named): `doctor-coordination-checks.test.mjs:47-115` (mechanism removed; no owner); `internal_lock_routes.rs:458-477` (owner: `judge_vectors.rs` + the phase-2 Node wiring case); `hot-lock-host-judge.test.mjs` (owners: `hot-lock-multiprocess.test.mjs` wiring case from phase 3; route cases: behaviour removed); the kcmp half of `platform/linux.rs:538-559` (behaviour removed).

## Steps

1. Doctor row deletion (code, test lines, three docs, `checks.test.mjs`, backlog), one commit; `node scripts/run-tests.mjs test/setup/doctor-coordination-checks.test.mjs test/setup/checks.test.mjs test/setup/registrations.test.mjs`.
2. Route deletion (Rust arm, contract, Rust test, Node test file), one commit; `cargo test -p fgos-holder-lock && cargo test -p fgos --test internal_lock_routes`.
3. Crate deletions (`start_time`, `kcmp_same_file`) with the test updates; `cargo test -p fgos-process`.
4. Contract lines (S-F2) and the two named-error next steps (S-G1); `node scripts/run-tests.mjs test/setup/run-supervisor-checks.test.mjs test/rust-host/internal-routes.test.mjs`.
5. Spec and boundary and reading-map edits, with the §8 supersession entry; verify every link and every `file:line` the new text cites against the tree (`rg` each symbol); `fgos decision-index` if the §8 entry carries a decision id.
6. Flip `test/process/one-door.test.mjs` green by removing the now-empty allowlist entries; census; `npm test` once. Message DOC (`forgentx-5f`) with the list of changed doc files (H12) and SEAT about `registrations.mjs` and the three docs.

## Verification (exact)

- `rg -n "coordination-abandoned-claims|getAbandonedClaims|processStartFingerprint" src test docs packages` → nothing.
- `rg -n "process-observe|runProcessObserveRoute|observeViaHost|hot-lock-host-judge" src test docs packages apps` → nothing.
- `rg -n "pidExists|isPidAlive|Node leaf" docs/platform/process/spec.md docs/platform/component-boundary.md docs/specs/reading-map.md` → nothing (except the superseded §8 entry's own historical wording, which stays as history).
- `rg -n "start_time\(|kcmp_same_file" packages apps --glob '*.rs'` → only `identity_of`/`self_identity` call sites.
- `node scripts/run-tests.mjs test/process/one-door.test.mjs` → green.
- `cargo test --workspace`; `node scripts/run-tests.mjs test/setup test/state test/rust-host/internal-routes.test.mjs`.
- `fgos doctor --json | rg -c '"id"'` on this workspace: one row fewer than the baseline's 145.

## Net size

Node: registrations −155, driver/run-supervisor-checks +2 → ≈ −155. Rust: route −35, start_time −6, kcmp −6 → ≈ −47. Tests: doctor-coordination −69, hot-lock-host-judge −94, internal_lock_routes −19, kcmp half −20, holders_multiprocess 0, one-door allowlist −13 → ≈ −215.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Deleting the whole `doctor-coordination-checks.test.mjs` removes the only proof of `runner-coordination-orgPolicy-shape` | H × H | Only lines 47–115 go; the commit shows the file still has `:16-45`. |
| A doc still names the route or the row and the DOC lane's phase 9 patches from older bytes | M × M | The `rg` lines above; H12 message with the exact files before merge. |
| `test/suite-baseline.json` `knownClones` lists a retired file | M × L | Report the retired files to TEST; do not hand-edit the baseline. |
| The §8 supersession is edited in place instead of added | L × H | The step says "gains one entry … supersedes by name"; the old entry stays. |

## Rollback

Revert the phase's commits; the route and row return with their tests. The on-disk formats are unchanged by this phase.

## Done when

Every `rg` line above holds; the specs carry the Part A shapes with §8 superseded by name and the two new boundary rows; the one-door test is green; DOC and SEAT told; backlog row closed.

## Lead brief essentials

Delete list: as above, exact line ranges. Find the owning test before writing a new one (nothing new is written here). Δ-lines per language. Report only what you saw yourself. Edit `registrations.mjs` only in the deleted range. Report name from `fgos convention name --json`.
