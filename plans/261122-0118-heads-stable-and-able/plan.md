---
contract: plan-v1
title: "Make the secretary and the supervisor heads stable and fully able: head verbs, plan check at the land door, provider floor, release pickup, rotation recovery, idle and wake tuning, live grant probe"
status: running
lead: head:lead-forgent-261122-0118-heads-b52f9
priority: P1
blockedBy: []
base: aa35c0664447f6d01d214911973c4d0246715e39
footprint:
  - packages/execution/engine/tests/credentials.rs
  - packages/execution/engine/src/credentials/renew.rs
  - packages/execution/engine/src/credentials/mod.rs
  - apps/fgos/src/wiring/dispatch_subs/probes.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/src/wiring/supervision.rs
  - scripts/lib/git-one-door-declarations.v1.json
  - packages/run-supervisor/rust/src/attempt_step.rs
  - packages/supervision/rust/observe-kinds.json
  - src/cli/command-registry.mjs
  - plans/261122-0118-heads-stable-and-able/**
  - src/session-host/head-grants.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - test/session-host/head-start.test.mjs
  - apps/fgos/src/routing.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/src/supervise/terminal.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - src/session-rotation/rotate.mjs
  - test/session-rotation/rotate.test.mjs
  - packages/session-host/contracts/rotation-files.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
  - apps/fgos/src/wiring/doctor/**
  - core/skills/_shared/plan-contract.md
  - core/skills/_shared/friction-capture.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .fgos/config.yaml
  - docs/platform/session-host/spec.md
  - docs/platform/run-supervisor/spec.md
  - docs/platform/supervision/spec.md
  - test/skills/fgos-supervisor-idle-lead.test.mjs
  - test/live/head-grant-probe.live.mjs
  - CHANGELOG.md
  - packages/config/rust/src/provider.rs
  - packages/config/rust/src/provider/unix_verbs.rs
  - packages/config/contracts/fixtures/scope.v1.json
  - packages/config/rust/tests/golden_scope.rs
  - apps/fgos/src/cli_projector.rs
  - packages/host-runtime/contracts/command-manifest.json
  - docs/platform/config/spec.md
  - packages/host-runtime/rust/src/activation.rs
  - packages/host-runtime/rust/src/lib.rs
  - packages/distribution/rust/src/lib.rs
  - packages/run-supervisor/rust/Cargo.toml
  - Cargo.lock
  - docs/architecture-manifest.json
  - test/setup/registrations.test.mjs
  - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
  - apps/fgos/src/wiring/session_rotation_hook.rs
source:
  - plans/discussions/ds-fvoi45qccq-heads-stable-and-able/DISCUSSION.md
  - p-vquz26ibnn
  - p-of5vpvce3e
  - p-s2t244hkqj
  - p-ycausep3zs
  - p-5gczifzh7h
  - p-erwx4t7gl6
  - p-ekqtvofdoh
  - p-ndortdckid
  - p-d3ub553ogh
  - p-bakpfrvigb
  - p-4uqiyjwrtd
created: 2026-11-22
---

# Heads stable and able

The owner settled the scope through Miu on 2026-11-22: one plan that closes every gap of `p-vquz26ibnn` and the rows
folded into it, with no owner question tonight. Owner decisions already recorded in
`plans/backlog/p-vquz26ibnn-make-the-secretary-and-the-supervisor-stable.md` (2026-11-21 17:39 and 21:28) are scope and
are not reopened here.

## Outcome

The secretary head (Miu) and the supervisor head run stable and can do everything their roles need through their
request sockets: every head records its own friction, the supervisor patches config, a lead raises an event when it parks
a phase, a plan that breaks the contract cannot land, an admitted plan carries `base` and `lead`, no coordinating head is
bound to a weaker provider family, a live head's next request runs the newest activated release, a rotation whose
executor died is resolved on the lineage's normal path, an idle lead is checked rather than believed, the supervisor's
wake rate and false idle alarms are measured before and after one tuning change, the time from an owner question being
asked to the owner seeing it is measured, the secretary wakes on new questions or mail by the mechanism the owner picks,
and the manual `lead:SUPERVISOR` session has a written retire condition. A live per-verb probe from confined heads proves
the grants, verb by verb.

## Acceptance criteria

1. Live probe table for both heads exists at `plans/261122-0118-heads-stable-and-able/reports/head-grant-probe.md`, each
   verb `served`, `refused as expected`, or named out of scope with a reason (phase 11, `node test/live/head-grant-probe.live.mjs`).
2. Every folded row is closed by a phase or carries an explicit no (table "Folded rows" below; phase 11 checks each
   row's done-when against the landed evidence).
3. Wake rate and false idle alarms have a before (`reports/baseline-wake-and-idle.md`, phase 1) and an after
   (`reports/after-wake-and-idle.md`, phase 9) measured the same way.
4. The retire condition of the manual `lead:SUPERVISOR` session is a settled fact in `docs/platform/supervision/spec.md`
   (phase 7).
5. `npm test` and `cargo test --workspace` green on main with every phase landed (phase 11).
6. `node scripts/plan-contract-check.mjs --plan plans/<dir>` refuses a `running` plan with no `lead` and the land door
   refuses a paths land of a plan that fails the check, main unchanged (phase 3: `node scripts/run-tests.mjs
   test/scripts/plan-contract-check.test.mjs`, `cargo test -p fgos-supervision --test land`).

## Non-goals

- The old Work-item `fgos answer` in the secretary sandbox (owner withdrew it 2026-11-21).
- New orchestration primitives (keeper, scheduling records, player wake from domain records, question recipients and
  notifier): owned by draft plan `261122-0056-orchestration-skeleton`. This plan uses only existing doors: the closed
  raise kinds (`coordination-help`), `watcher tune`, `metrics record` of `fgos.coordination.*` kinds, `session type` on an
  event-named session.
- The seat judge that swaps a coordinating head to another family of enough quality (`p-s2t244hkqj`): that row asks for a
  shaped discussion and an owner pick before any build; this plan keeps the fixed Claude pin, which is the safe floor
  that row itself names. The row stays open.
- Miu's expired login (an owner account action, not code).

## Folded rows

| row | closed by | note |
|---|---|---|
| p-vquz26ibnn (2) config patch joins the supervisor grant | phase 2 | owner yes 2026-11-21 17:39 |
| p-vquz26ibnn (a) secretary wakes on new questions or mail, relays unasked | phase 10 | mechanism is the owner's pick; only that phase waits |
| p-vquz26ibnn (b) time from question asked to owner seeing it | phase 8 | relay record plus measure |
| p-vquz26ibnn (c) a lead that parks a phase raises an event itself | phases 2, 7 | lead gains `supervisor raise`; lead skill names the trigger |
| p-vquz26ibnn (7) wake rate and false idle alarms | phases 1, 9 | before, one tuning change, after |
| p-vquz26ibnn (8) retire condition of manual `lead:SUPERVISOR` | phase 7 | owner approved 2026-11-21 |
| p-vquz26ibnn verb-by-verb list from a confined head | phase 11 | live probe, not a reading of `GRANTS` |
| p-ndortdckid heads record friction | phases 2, 7 | `friction record` through the socket for every head |
| p-of5vpvce3e coordinating head never on a weak provider | phase 4 | supervisor, lead, planner, shaper already pinned; secretary pinned here; owning test |
| p-s2t244hkqj seat judge | explicit no | see Non-goals |
| p-ycausep3zs head picks up a newer release | phase 5 | route resolves the active release per request |
| p-5gczifzh7h supervisor checks a lead's claimed wait | phase 7 | a screen claim never closes `session-idle` |
| p-erwx4t7gl6 land door runs the plan check | phase 3 | land gate with a `{plans}` placeholder |
| p-ekqtvofdoh admission writes `base` and `lead` | phases 3, 7 | skill writes both; check makes a missing `lead` an error |
| p-d3ub553ogh secretary sandbox TMPDIR | already closed | `bbe0ffe2a` sets `TMPDIR=/tmp` (private tmpfs); proof `test/session-host/head-start.test.mjs:247`; phase 11 re-confirms live |
| p-bakpfrvigb orphan rotation state | phase 6 | resolved on the lineage's normal path plus one doctor pointer row |
| (owner 2026-11-22 09:08) rotation Stop hook fires in no head | phase 6 steps 6-8, phase 11 probe row | owner-approved 2026-11-22 09:08 via lead:SUPERVISOR: prove the Stop hook runs in a confined head, writes stop-trace and rotates at soft; find and fix the cause in this plan |
| p-6sd4fslxv7 landed worktree removed by the land door | phase 7 steps 10-13 | owner-approved 2026-11-22 14:55, folded in by lead:SUPERVISOR (`69a20ce3a`) |
| p-4r4h3jqtth head ran 33 h without rotating | already done | plan `261121-0745-head-rotation-trace`, `65ad518d5` |
| (owner 2026-11-22 16:05) rotation reliability: handoff last message and portfolio, true rotation.log outcome, live soft rotate | phase 12 (12a), phase 11 probe row | folded in by lead:SUPERVISOR 17:47 (`q-msslhlmfkt`) |
| p-kqs6fjalvh pool login expires inside a long seat | phase 12 (12b) | folded in by lead:SUPERVISOR 17:47; 12b waits on its footprint widen |

## Prior art reused and what was missing

- Grants stay one table, `src/session-host/head-grants.mjs` (`grantOf`); verbs are served by
  `src/session-host/head-request.mjs` behind the Rust transport `packages/run-supervisor/rust/src/head_request.rs`, and a
  confined CLI call is mapped to a socket verb in `apps/fgos/src/routing.rs` (`confined_head_call`). Missing: `friction
  record`, `config patch` (supervisor), `supervisor raise` (lead).
- The land door already runs configured gates with `when` globs, unconfined, for a paths land too
  (`packages/supervision/rust/src/land.rs`, `run_gates`). Missing: a gate for `plans/**` and a placeholder naming the
  landed plan directories (only `{tests}` exists).
- Persona pins already exist in `.fgos/config.yaml` (`runner.personas.<p>.prefer: claude`, tier flagship for supervisor,
  lead, shaper, planner). Missing: the secretary pin (tier and pool only) and an owning test.
- The raise door's closed kinds (`packages/supervision/rust/src/queue.rs`, `COORDINATION_KINDS`) already include
  `coordination-help`; no new kind is added.
- Watcher actions and thresholds (`core/config-standard/watcher.yaml`: `sessionIdleLimit`, `activeIntervalSec`,
  `actions`) are tuned with the existing `fgos watcher tune`.
- Head `TMPDIR` was fixed in `bbe0ffe2a`; the 33-hour rotation gap was closed by plan `261121-0745-head-rotation-trace`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Baseline: wake rate and idle alarms](phase-01-baseline-wake-and-idle.md) | - | plans/261122-0118-heads-stable-and-able/reports/baseline-wake-and-idle.md | 1 | done |
| 2 | [Head verbs through the request socket](phase-02-head-verbs.md) | - | src/session-host/head-grants.mjs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, test/session-host/head-start.test.mjs, apps/fgos/src/routing.rs, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/tests/head_request.rs, docs/platform/session-host/spec.md | 1 | done |
| 3 | [The land door runs the plan check](phase-03-land-plan-check.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, core/skills/_shared/plan-contract.md, .agents/skills/**, plugins/fgOS/skills/**, .fgos/config.yaml | 1 | done |
| 4 | [Coordinating heads keep their provider floor](phase-04-provider-floor.md) | 3 | .fgos/config.yaml, test/session-host/head-start.test.mjs | 2 | done |
| 5 | [A live head's requests run the active release](phase-05-release-pickup.md) | 2, 6 | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/src/supervise/terminal.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, docs/platform/run-supervisor/spec.md | 3 | done |
| 6 | [A rotation whose executor died is resolved](phase-06-orphan-rotation.md) | 2 | src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/session-host/contracts/rotation-files.v1.json, packages/distribution/contracts/doctor-registry.v1.json, apps/fgos/src/wiring/doctor/**, docs/platform/session-host/spec.md | 2 | done |
| 7 | [Supervisor and lead rules, retire condition](phase-07-supervisor-lead-rules.md) | 2, 3 | core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, core/skills/_shared/friction-capture.md, .agents/skills/**, plugins/fgOS/skills/**, docs/platform/supervision/spec.md, test/skills/fgos-supervisor-idle-lead.test.mjs, packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 2 | done |
| 8 | [Question relay is recorded and measured](phase-08-question-relay-measure.md) | 7 | core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, plans/261122-0118-heads-stable-and-able/reports/question-relay.md | 3 | running |
| 9 | [One watcher tuning change, measured after](phase-09-watcher-tuning.md) | 1, 4, 7 | .fgos/config.yaml, plans/261122-0118-heads-stable-and-able/reports/after-wake-and-idle.md | 3 | running |
| 10 | [The secretary wakes on new questions or mail](phase-10-secretary-wake.md) | 8 | core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, plans/261122-0118-heads-stable-and-able/reports/secretary-wake.md | 4 | running |
| 11 | [Integration gate and live grant probe](phase-11-integration-and-probe.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 | test/live/head-grant-probe.live.mjs, CHANGELOG.md, plans/261122-0118-heads-stable-and-able/reports/head-grant-probe.md, test/session-host/head-start.test.mjs | 5 | ready |
| 12 | [Rotation reliability](phase-12-rotation-reliability.md) | 6 | src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, packages/session-host/contracts/rotation-files.v1.json, docs/platform/session-host/spec.md, apps/fgos/src/wiring/session_rotation_hook.rs | 4 | done |

Each phase names its canonical dispatch capability in its file: `code:implement` for 2 to 7 and 10 and the probe script
of 11; phases 1, 8's measure, 9's after-measure and 11's gate are evidence reads (`code:test`). No executor, provider or
model is pinned here; `decide` chooses at execution time.

Checks made on this table (`fgos resource-check --plan plans/261122-0118-heads-stable-and-able` and
`node scripts/plan-contract-check.mjs --plan plans/261122-0118-heads-stable-and-able`): no two phases of one wave share a
path; each phase sits in a later wave than its dependencies. Hot files are serialized by wave: `.fgos/config.yaml`
(3, then 4, then 9), the generated skill renders `.agents/skills/**` and `plugins/fgOS/skills/**` (3, 7, 8, 10, one per
wave), `head-request.v1.json` (2, then 5), `docs/platform/session-host/spec.md` (2, then 6). `CHANGELOG.md` has one
writer, phase 11.

**Set `ready` 2026-11-22 08:15 by lead:SUPERVISOR:** work-data-model closed at 07:32 (3d31ef9a5), and S6A narrowed its footprint off every path here (2ccaaaa96, f0d2f44ca, c9c0e42bf, e6d346cdd). The owner ranks this plan first. Run its file-disjoint phases in parallel up to the lead ceiling.

### Lead progress (2026-11-22 21:50, head:lead-forgent-261122-0118-heads-b52f9, gen 7)

- **Phase 12c landed** as `8883c2a62` (`p12d`: `453f91152`, plus the review fix `827d6b07c` and the door fix
  `68843da76`; session_rotation_hook 13/13, clippy clean, land gates green). Cause, from lead:SUPERVISOR's report and
  checked in the code: a successor's answer was sent only by the Stop hook at the end of its first turn, and a lead's
  first turn does not end. So rotation `55465224e078c9c2` (gen 6 to 7, 21:10) hit `no-answer`, and gen 7 was then
  started by stop+start, which proves nothing about soft rotation. Now, when `rotation.json` waits for this generation,
  the session-start context tells the successor to answer right after its ritual line, in the same turn. It does so
  through the existing hook door, by the installed shim path (`project_shim_path`). The `fgos` shell function appends
  `--dir`, and the hook then returns silently. No new door was added. The change takes effect at the next release
  activation. After that, lead:SUPERVISOR reruns a real rotation, which is done-when item 3.
- **The phase 11 probe ran live from this lead** (gen 7, started 14:14Z on `0844a0a4`). 29 of 30 rows matched the grant.
  `supervisor raise` is now served, so the grant reached this head through the restart. The one mismatch was the probe's
  own misclassification: `friction record` returns its disposition refusal under code `error`. That is fixed in
  `5b5eb89f8` (`p11`, 17 lines; the gates passed). Separate finding, outside this plan: the friction host verb reports
  its domain code only inside the message text, so a confined caller cannot read it as a code.
- **Stop-trace evidence for phase 11's Stop-hook row:** this lineage's `stop-trace.jsonl` had no line after 02:14Z,
  although gen 6 ended turns until 21:10. A manual installed-path hook call at 14:24Z wrote a line, so the host side
  works. Whether the real Stop hook fires in a head is still for phase 11's probe row to show.
- `q-3g32txifg5` cancelled as moot (12b landed as `039acaa7e`). No question of this lead is open.
- **Next:** release activation (owner/OPC) to carry 12c, then lead:SUPERVISOR's rotation rerun. Phases 8, 9 and 10 finish
  their 24-hour measures from about 14:20 to 16:30 on 2026-11-23, and phase 11 steps 1, 2, 4 and 5 run after that.

### Lead progress (2026-11-22 21:10, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 11 steps 3 and 6 landed** as `6765c56df` (`p11`) at 20:47, once `baf9a59bf` glossed the backlog citation.
  The land went through its fast-forward step, so `q-pfecbg6ffn` (git recover) was not needed and is cancelled.
- **Release `0844a0a4` is active** (contract 3 plus phase 12), and carries phases 2, 5-7 and 12.
- **Phase 11 stays `ready`** for steps 1, 2, 4 and 5. They run once phases 8, 9 and 10 have their 24-hour measures
  (from about 14:20 on 2026-11-23), on heads started on `0844a0a4` or later. This lead started on `f032b2c7`, so its own
  probe run needs a rotation first, and that rotation is the live soft-rotation proof of phase 12's done-when item 3.

### Lead progress (2026-11-22 20:40, head:lead-forgent-261122-0118-heads-b52f9)

- **The 12b clippy fix landed** as `df93b230f` once the D12/D13 citations were fixed (`31321e24f`).
- **Phase 11 steps 3 and 6 are ready on `p11` (`41130f13c` plus the review fixes `6f4ea6ca7`):**
  - `test/live/head-grant-probe.live.mjs` covers all 30 contract verbs.
  - An independent review checked every call's argv and found 24 that are refused before any write, or only read.
  - `supervisor wake` is not called. It takes no args, always records a wake and may start a supervisor head, so it is
    listed with the caller-acting verbs.
  - `served` now counts only the expected domain refusal per verb. Local `bad-args`, route failures and transport
    failures count as `failed`.
  - The script refuses a live run outside a head (no `FGOS_HEAD_REQUEST_SOCKET`).
  - The `head-start.test.mjs` comment now cites `apps/fgos/tests/questions_head.rs`.
- **The land of `p11` is parked twice:**
  - Ticket `c-80805-1795354765816` passed its gates and then failed `fast-forward main: resource-recovery-required`
    (`q-pfecbg6ffn`).
  - A retry at 20:45 got past that step but failed the citation gate on a finding that is not this plan's:
    `plans/backlog/p-24xw2cwdvo-delete-the-dead-tier-5-node-execution-modules-and-their-tests.md:30` cites `ADR0083`
    with no gloss. It came in through the paths land `958532a25`, which skips that gate.
  Every branch land is red until that row is glossed. `p11` lands with the same command right after.
- **Phase 11 stays `ready`** for its remaining steps:
  - step 1, the gate on main;
  - step 2, the CHANGELOG line, rebased after s6a 22b;
  - steps 4-5, the live runs and the report, on heads started on a release that carries phases 2, 5-7 and 12.
  These come after phases 8, 9 and 10 finish their 24-hour measures (phase 9's window ends about 14:20 on 2026-11-23).

### Lead progress (2026-11-22 20:05, head:lead-forgent-261122-0118-heads-b52f9)

- **The clippy fix for 12b is ready on `p12c` (`b800a1601`):** the nested if is collapsed and `renew_in_scratch`'s
  arguments are grouped in `RenewInScratchArgs`, with no `allow`. `cargo clippy -p fgos --bins -- -D warnings` and
  `cargo clippy -p fgos-execution-engine --all-targets -- -D warnings` are clean, and credentials pass 26/26.
- **Its land is parked on a red main gate that is not this plan's.** Ticket `c-67254-1795352250452` failed
  `test/scripts/check-decision-citation-drift.test.mjs:485` with 3 new findings: `D12` cited at
  `plans/backlog/p-kihregmfxm-a-moot-owner-question-cannot-be-closed-once-its-asking-head-is-gone.md:22`, and `D13` at
  `plans/backlog/p-kmavlfevvu-a-coach-the-supervisor-starts-from-observe-metrics-and-friction.md:12,20`. Both files came
  in through paths lands, which skip that gate, and neither is in this footprint. Every branch land stays red until
  their owner inlines those ids. `p12c` lands with the same command right after.

### Lead progress (2026-11-22 19:35, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 12 done.** 12a landed as `809c83190`, and 12b as `039acaa7e` (`p12b`: `89e75d68a` plus the review fixes
  `68b9db525`; credentials 26/26, dispatch_subs 19/19). The fixes:
  - a seat whose copy of the renewed pair failed is named in the outcome (`left-behind`);
  - the owner scan moved into the engine (`find_account_renewal_owner`), and `probes.rs` keeps only a 10-line call;
  - seat homes are read in agent mode;
  - an fgOS scratch renewal is recorded as the renewer, and an ended seat shows as `(ended)`;
  - a failed owner-file write is no longer ignored.
  Accepted risk, stated in the unit report: below the threshold, refresh-ahead may redeem the shared refresh token
  while a seat's CLI still holds the old one in memory. The seat is safe only if its CLI re-reads its credentials file
  before it refreshes. Done-when item 3 (live soft rotation with resume from the handoff alone) is proved by phase 11's
  probe on a head started on a release that carries phase 12. Both changes take effect only after the next release
  activation.
- **Next:** phases 8, 9 and 10 finish with their 24-hour measures (phase 9's window ends about 14:20 on 2026-11-23).
  Phase 11 then runs on heads started on a release with phases 2, 5-7 and 12.
- **Worktrees safe to remove:** p12, p12b, p07d, p10.

### Lead progress (2026-11-22 19:15, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 12b** is on `p12b` (`89e75d68a`) and in independent review. A live seat's account now renews below the
  threshold, the new pair reaches the sharing seats, and the renewal owner is recorded and shown in `probe-account`.
  Credentials 23/25 and confinement_cleanup 11/14 inside the unit sandbox. The unit attributes the 5 failures to the
  sandbox's PID namespace (staging-writer liveness reads `Unknown`); the land's unconfined gates decide.
- **The stale helper reference** at `test/session-host/head-start.test.mjs:343` is added to phase 11 as step 6. The
  stray-writes path at `docs/platform/run-supervisor/spec.md:66` stays with s6a phase 22b (lead:SUPERVISOR's
  correction, 19:20). s6a 22b also edits `CHANGELOG.md`, so phase 11's line rebases if it lands second.
- **"A live head keeps its launch release": phase 12 does not close it, and part of it needs its own row.** There are
  two halves:
  - Request routes are closed by phase 5 for every head started on a release that contains it (`1e544460` on). This
    lead predates it, so it self-heals at its next rotation, and phase 12a makes that rotation reliable.
  - The grant does not follow. `cfg.verbs` is fixed in the head-request server's config at session start
    (`packages/run-supervisor/rust/src/head_request.rs:1363`), so a verb added to `GRANTS` in a later release reaches
    a live head only after it restarts or rotates. That may be intended (the grant is bound at start), but no spec
    says so. It is outside this plan's outcome. Proposed as its own backlog row (lead:SUPERVISOR or the secretary
    files it): "a live head's grant is fixed at its start: decide whether `GRANTS` changes reach it per request, and
    record the answer in the session-host spec".
  Phase 11's step 2 and step 4 now say this: the changelog line names the grant limit, and the probe runs only on heads
  started on `1e544460` or later.

### Lead progress (2026-11-22 18:45, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 12a landed** as `809c83190` (`p12`). `q-ctjxjol33f` was cancelled as moot: OPC recovered the abandoned land
  and pushed the stray main commit. The land still waited on a shaper's dirty `DISCUSSION.md` and a second stray
  local main commit (`e5077ae40`) before it went through at 18:42. Phase 12 stays `running` for 12b (`q-3g32txifg5`).
- **This head still runs its launch release.** The land ticket's `hostBin` is
  `sha256:f032b2c7` although `1e544460` is active. The head-request server of a live head is the launch release's own
  code, and that release predates phase 5, so per-request pickup starts only for a head started on a release that
  contains phase 5. Effects seen: `supervisor raise` refused, and the `p12` worktree was not removed by the land (no
  `worktreesRemoved` field). Both are expected until this lead restarts or rotates onto `1e544460`. Phase 11's probe
  must run on heads started on `1e544460` or later.

### Lead progress (2026-11-22 18:30, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 12a is ready to land, parked on `q-ctjxjol33f`.** Branch `heads-stable-and-able/p12` (`24672c180` plus the
  review fixes `50aaf575f`; rotate and head-start 59/59; independent review found no blockers). The fixes:
  - the last message is found again on each poll pass after finalize-home;
  - the head's own task file (a lead's `plan.md`) is in the handoff portfolio;
  - a rotation whose old run was asked to stop or had closed logs `old-not-live`, never `start-refused`, and leaves no
    handoff.
  The land is refused `land-abandoned-writer-mismatch` ("run `fgos git recover`") after an attempt at 18:19 failed
  `lock-acquire-unavailable`. Before that, lands were refused `land-target-ahead` while local main held the unpushed
  supervisor report `3b9baf34a`.
- **Phase 12b** waits on `q-3g32txifg5` (footprint widen by the credential renewal and probe-account files).
- **Release 1e544460 (phases 2, 5-7) is active since the second window.** This lead's `supervisor raise` is still
  refused `verb-not-granted`: the grant list is fixed at session start, so phase 5's per-request release pickup does
  not refresh a live head's grant. A head gains a new verb only after a restart or rotation. Phase 11's probe should
  name this. `stop-trace.jsonl` of this lead has no record after 02:14Z yet (its last has `fraction: null`). The first
  Stop under 1e544460 is the one to read for phase 12's soft-rotation proof.

### Lead progress (2026-11-22 17:40, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 7 done:** the follow-up (steps 10-13, `p-6sd4fslxv7`) landed as `36afd4d6b` (`p07e`, reapplied at the tip from
  the reviewed `p07d`: `bb031d4ab` plus the review fixes `15cc7aef9`; land 60/60, fgos-supervision green). After a
  successful branch land, the land door removes the worktree that has the landed branch checked out. It goes through
  the worktree door only, and the result names each worktree removed or kept with its code. A squash land always
  keeps its worktree (`worktree-delivery-unproven`), and the skill and spec say so. Not changed: the worktree door
  briefly moves a live worktree's untracked files aside before it refuses, which now happens on every branch land. It
  is active only once a release carrying it is activated.
- **Release:** `40e170b4` (phases 5 and 6) was rolled back (`c562d631a`), so fg-server2 stays on `f032b2c7`. Phases 2, 5,
  6 and 7 are landed but not active, and this lead's `supervisor raise` stays refused until a release carrying them is
  activated.
- **Open:** `q-msslhlmfkt`, the "owner-approved rotation reliability work" named by lead:SUPERVISOR at 16:50, with no
  row, phase file or footprint in this plan; the proposal is to fold `p-kqs6fjalvh` in as phase 12.
- **Next:** phases 8, 9 and 10 finish with their 24-hour measures. Phase 11 then needs a release carrying phases 2 and
  5-7 to be active for its live probe.
- **Worktrees safe to remove:** add p07c, p07d and p07e to the list below.

### Lead progress (2026-11-22 16:25, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 5 done:** landed as `78220dddb` (branch `p05c`, recut at the trunk tip from the reviewed `p06f` plus the
  one-door declaration `8da6d51a4`; head_request 50/50, head-request.mjs 89/89, one-door scan 0 undeclared). It takes
  effect for a head once the next release is activated.
- **Phase 10 steps 2-3 landed** as `2fa775706` (`p10b`): on every start the secretary arms `/loop 15m`, and each tick
  reads `fgos questions`, then `fgos mailbox inbox`, then relays within the 5-question cap. The review found no
  blockers. The supervisor already raised the B half. The phase stays `running` until step 4's 24-hour measure
  (`reports/secretary-wake.md`).
- **Phase 8** steps 1-3 landed (`827bbb7e1`); it stays `running` until step 4's 24-hour measure.
- **Phase 2 done:** step 10 (`config patch` for the supervisor) landed as `3e13a0e61` (`p02h`, `31dcaab69` plus the
  review fixes `3a00fc207`: bounded args, `--global`/`--project-only` refused from a confined caller, and a relative
  path documented as read from the project root). The supervisor can use it once a release carrying it is activated.
- **Next:** phase 7 follow-up once `q-d5mrno2mfk` is answered (apply the carry diff on a fresh tip worktree, add the two
  `worktree_removal: None` lines, land). Phases 8, 9 and 10 finish with their 24-hour measures. Phase 11 runs after them.
- **Phase 7 follow-up parked on `q-d5mrno2mfk`:** the removal is green in its crate (land 57/57, fgos-supervision
  152/152) and saved in `reports/carry-p07c-landed-worktree-removal.diff`. The fgos binary still needs
  `worktree_removal: None` at two `LandPorts` literals in `apps/fgos/src/wiring/session_write_publish.rs`, which is
  outside the footprint. `fgos supervisor raise` is still refused `verb-not-granted` for this lead, because its socket
  runs the launch release.
- **Land friction:** a land counts every trunk path changed since the branch base. A shaper's dirty `DISCUSSION.md` in
  the main checkout therefore refused `p10` and `p06f` with `main-checkout-dirty-overlap`. A unit sandbox cannot rebase
  (`.git` is read-only), and a prompt-less `run --sync` is refused through the socket (`bad-args`), so both branches were
  recut at the tip and reapplied by a unit.
- **Worktrees safe to remove** (landed or superseded): p02e, p02f, p02g, p04, p06, p06c, p06d, p06e, p06f, p08, p10,
  p10b, p05c, p02h.

### Lead progress (2026-11-22 15:20, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 2 steps 8-9 done:** `p02g` landed as `c9594d0d4` (the land regenerated `command-routes.json`). Step 10 follows
  phase 5 (shared `head-request.mjs`).
- **Phase 5 reviewed and ready, parked on `q-r5w6funyv5`.** The review found no code defects; its blocking gap
  (contract note and spec fact) is fixed in `f33ffddb8`. The land stopped in the regenerate step: git-one-door-scan
  reports `head_request.rs` `Command::new(&host)` as `unresolved-binary`. The fix is one `configured-binary` entry
  in `scripts/lib/git-one-door-declarations.v1.json`, which is outside the footprint; the doctor's identity row has
  the same kind of entry as precedent.
- **Phase 8** running on `p02g` (ticket `c-41126-1795334991265`, Gemini; OpenAI is at its usage limit, and Claude
  units here are refused every shell command).
- **Phase 7 follow-up (steps 10-13, owner-approved 14:55, `p-6sd4fslxv7`):** the land door removes a landed branch's
  clean worktree. It runs in `p02g` after phase 8 lands, so no new worktree is used while the disk is full.

### Lead progress (2026-11-22 14:55, head:lead-forgent-261122-0118-heads-b52f9)

- lead:SUPERVISOR decided the three footprint questions as recommended (`e8c502658`): `src/cli/command-registry.mjs`
  (config.patch hunk only, shared with S6A, second lander rebases), `packages/supervision/rust/observe-kinds.json`,
  `packages/run-supervisor/rust/src/attempt_step.rs`. `q-lnq3nbjssw`, `q-2ul3tjw3kd` and `q-zwvjlsuqgc` cancelled as
  decided there. Phase 9's change is committed as `a6608f628` (`actions.session-idle: none`); its window stands.
- Running: phase 5 on `p06f` (ticket `c-24850-1795333749972`), phase 2 steps 8-9 on `p06d` (ticket
  `c-24860-1795333750299`). Phase 2 step 10 shares `head-request.mjs` with phase 5 and runs after it. Phase 8 runs on
  `p06d` after phase 2's land (draft in `reports/carry-p08-question-relay-skill.diff`), to keep to the two clean
  worktrees on a full disk. Removable: p02, p02e, p02f, p04, p06, p06c, p06e, p08.

### Lead progress (2026-11-22 14:35, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 5 parked on `q-zwvjlsuqgc`:** the route child runs through `attempt_step::exec_payload`, which refuses any host
  but the envelope's original one (`host-version-mismatch`, `packages/run-supervisor/rust/src/attempt_step.rs:60`).
  Widening by that file lets the head-request route hand over to the active release while attempt steps stay pinned.
  The unit changed nothing (`unit-run-1795331613274-50a9b661`).
- **Every remaining phase now waits on another party:** phase 2 steps 8-10 on `q-lnq3nbjssw`, phase 5 on `q-zwvjlsuqgc`,
  phase 8 on `q-2ul3tjw3kd`, phase 9 on the 24-hour window (started 14:20 +07) and the commit of the disarm, phase 10
  on 8, phase 11 on all.

### Lead progress (2026-11-22 14:20, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 6 done:** `p06f` landed as `32e39e0ea` once main's citation baseline moved (`f238a127b`).
- **Phase 5 running** in `p06f`'s worktree, synced to main (ticket `c-22469-1795331612629`); no new worktree.
- **Phase 9:** lead:SUPERVISOR applied `fgos watcher tune session-idle --disarm` in the main checkout's working tree
  at 14:20 (+07). That differs from block `phase9` (`actions.session-idle: none`): disarming stops the rows themselves,
  not only their wakes. It is still one attributable change, and the supervisor's per-wake check of running plans (phase 7) does
  not depend on those rows, so the after-measure reads it as the change made. It is **not committed**, and
  `.fgos/config.yaml` in the main checkout also carries the owner's uncommitted edits. The 24-hour window runs from
  14:20 (+07) because a working-tree config is live. The commit stays open for lead:SUPERVISOR or the owner.

### Lead progress (2026-11-22 14:25, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 6 ready to land, parked on main's red citation gate.** Branch `heads-stable-and-able/p06f` (`23d6c85a0`,
  `e844e2e5d`): an independent review found two blocking wedges, an old-format or `unknown` `rotation.json`, and an
  executor that died before the successor was placed. Both are fixed and proven red-to-green (rotation 31/31; Node 171/171).
  `fgos land` (ticket `c-20288-1795330518526`) failed `land-gate-failed` in
  `test/scripts/check-decision-citation-drift.test.mjs`: 14 unglossed citations in
  `docs/platform/platform-foundations.md`, `docs/platform/runner/decisions/h-36d872fbb0e5.md`,
  `docs/platform/seat-binding/spec.md` and `docs/platform/work-state/decisions/retired-decision-history.md`.
  Commit `74045ce23` added them through a paths land, which skips that gate. None of those files are in this
  footprint. **Every code land is red until main is fixed (lead:SUPERVISOR).** Phase 6 lands with the same command
  right after.
- **Phase 5** follows phase 6 (shared `head_request.rs`) and starts on `p06f`'s worktree once phase 6 lands, so no
  new worktree is used (disk).
- **Waiting on others:** phase 2 steps 8-9 on `q-lnq3nbjssw`, phase 8 on `q-2ul3tjw3kd`, phase 9 on lead:SUPERVISOR
  applying block `phase9`.
- **Worktrees removable:** p02, p04, p06, p02e, p02f, p06c, p06d, p06e (their work is in the landed `reports/carry-*.diff`).
  Keep p06f and p08.

### Lead progress (2026-11-22 14:00, head:lead-forgent-261122-0118-heads-b52f9)

- **Units that end `blocked` or time out commit nothing**, and a unit cannot read a sibling worktree. Finished work
  therefore moves through landed patches in `reports/carry-*.diff`, applied with `--input` in a fresh worktree.
  `fgos run --resume` is refused through the request socket (`bad-args: run takes one prompt`).
- **Phase 6:** the work is finished: Node 167/167, head_request 48/48, hook 12/12, doctor pointer 1/1 (unit
  `unit-run-1795329329981-92df873c`). A commit-ready rerun is on `p06f` (ticket `c-14842-1795329958668`), with a
  code review in parallel. The CHANGELOG line and the live Stop probe belong to phase 11.
- **Phase 2 steps 8-9 parked on `q-lnq3nbjssw`:** the flag works (fgos-config 115/115, golden_scope 3/3), but the
  manifest is generated from `src/cli/command-registry.mjs`, which is outside the footprint. The work is in
  `reports/carry-p02e-config-patch-project-only.diff`.
- **Phase 8 parked on `q-2ul3tjw3kd`:** `fgos.coordination.question-relayed` is not declared in
  `packages/supervision/rust/observe-kinds.json` (strict registry, outside the footprint). The skill text is on `p08`,
  uncommitted, and the renders are not built yet.
- **Phase 9** waits on lead:SUPERVISOR applying block `phase9`.

### Lead progress (2026-11-22 13:35, head:lead-forgent-261122-0118-heads-b52f9)

- **Phase 7 done:** `heads-stable-and-able/p07b` (stacked on `p07`) landed as `01c149eda` after lead:SUPERVISOR's
  regenerate patch `5be887a56`; gates and the idle-lead and mirror tests passed in the land.
- **Phase 6:** the Gemini unit on `p06c` timed out after 33 min with most edits in place (ticket
  `c-3302-1795326924685`, `execution-failure`, outcome `timeout`); its work moved to `p06d` with a Claude unit to
  finish, simplify the Stop-failure plumbing and run the tests (ticket `c-8530-1795329051551`).
- **Phase 2 steps 8-9** still running on `p02e` (ticket `c-3312-1795326925023`).
- **Phase 8** steps 1-3 running on `p08` (ticket `c-9350-1795329088359`); step 4 measures 24 hours after it lands.
- **Phase 9:** change chosen, `watcher.actions.session-idle: none` (reason in its phase file). **Waits on
  lead:SUPERVISOR** to apply block `phase9` of `config-patch-items.yaml`; the after-measure runs 24 hours later.
- Worktrees superseded and safe to remove (answered lead:SUPERVISOR): p02, p02b, p02c, p04, p05, p06, p06b, p07.

### Lead progress (2026-11-22 13:00, head:lead-forgent-261122-0118-heads-b52f9)

Owner answers written back (`590c8eaf7`) and acked: `q-eyb5i7m7wq` and `q-obm5mrukjc` (widen landed in `9a30bd755`),
`q-pn6ur6wrjf` (phase 5 moves the pure activation read into `fgos-host-runtime`), `q-y24ukwgfpo` (add `core/**` to
`land.regenerate.when`). **Phase 7 waits on lead:SUPERVISOR:** apply block `phase7` of `config-patch-items.yaml` and
reply with the commit; `p07`/`p07b` land right after. This lead's `fgos supervisor raise` was refused
`verb-not-granted`: its request socket still runs the launch release, without phase 2's lead grant (the gap phase 5
closes). Running now: phase 6 on `heads-stable-and-able/p06c` (ticket `c-3302-1795326924685`, the reviewed `p06b` work
plus the three widened files) and phase 2 steps 8-9 on `heads-stable-and-able/p02e` (ticket `c-3312-1795326925023`).

### Lead progress (2026-11-22 12:45, head:lead-forgent-261122-0118-heads-b52f9)

Landed: phase 2 code (`b310eb241`; `routing.rs` in 94edcbdc3, reported to lead:SUPERVISOR for S6A's route flip), phase
4 (`9abfa5257`). Phase 2 stays `running` for steps 8-10 (`config patch --project-only`, owner-approved 12:28), which
wait on the footprint widen `q-eyb5i7m7wq`. Phase 7 (`heads-stable-and-able/p07`) was refused by the census gate:
`land.regenerate.when` misses `core/**`, so a skill-only land never rebuilds the mutation census; asked
`q-y24ukwgfpo`. Its new step 9 (missed idle-lead alarm) runs on `heads-stable-and-able/p07b`, stacked on `p07`.

Earlier notes, kept for the record:

Branches ready (reviewed, green), landing in this order once the merge resource is recovered (`q-rbleatcask`: a land
started 04:32Z, pid 3502900, died in its census step; every land since answers `resource-recovery-required`):

- **Phase 2** `heads-stable-and-able/p02d` (94edcbdc3, cut at trunk 3ed31c896): `friction record` for every head,
  `supervisor raise` for leads, route, mapping, contract, spec, tests (94 Node, 26 routing, 47 contract). `config patch`
  stays out of the grant: `q-va5vu7zeza` went to the owner. lead:SUPERVISOR is told the moment it lands (S6A's route
  flip waits on its `routing.rs`).
- **Phase 4** `heads-stable-and-able/p04b` (44e4bec81): the secretary pin is in force from the standard layer
  (`q-3f6qen2bsd`), so the repo fact reads the effective standard-plus-project pin through the config test helper;
  head-start 23/23, architecture 82/82.
- **Phase 7** `heads-stable-and-able/p07` (58080248a): admission writes `status`, `lead` and `base` in one land; an idle
  lead is typed a wait check and the event closes only on an answer or progress; a lead that parks raises
  `coordination-help`; heads record friction; the retire condition of `lead:SUPERVISOR` is a settled fact. Step 3
  (`config patch` door) left out until `q-va5vu7zeza`. 18 tests.
- **Phase 6** `heads-stable-and-able/p06b` (0bede196c, on phase 2): orphan rotations resolved on the normal path, executor
  identity in `rotation.json`, `session-rotation-orphans` doctor pointer, `stop-failed` incidents, and the Stop-hook cause
  fixed: the head-request bounded decoder turned a decimal fraction into serde's private number map under
  `arbitrary_precision`, so every real Stop was refused `bad-measure` (this lead's supervisor log, 03:32Z and 03:57Z; its
  `stop-trace.jsonl` never grew). Rotation 27, head-request 48, doctor pointer 1. Lands after `q-obm5mrukjc` widens the
  footprint by `test/setup/registrations.test.mjs`, `setup-doctor-registry.md` and `session_rotation_hook.rs`
  (row count, inventory, pre-Node hook failure incident).
- **Phase 5** parked on `q-pn6ur6wrjf`: the one activation reader (`fgos_distribution::activated_host_bin`) sits above
  `fgos-run-supervisor`; moving its pure read into `fgos-host-runtime` needs six more footprint paths. Phase 5 now also
  follows phase 6, which edits `head_request.rs`.
- **Gates:** the plan-contract land gate is held by lead:SUPERVISOR (14287de27) until the next activation carries
  `{plans}`; main's citation findings were fixed (e146eaf3c).
- Friction met: `fgos request result --wait` fails through the socket (`bad-args`; `--wait=` does not block) and since
  04:55Z the ticket list answers `verb-failed: the route ended with exit 0`; a unit that writes no report settles
  `inconclusive`; the runner never commits a path dirty at round start, so reviewed work moves to a fresh worktree by
  patch; `fgos land` counts every path changed on trunk since the branch base as written, so a dirty file of another
  plan in the main checkout refuses an older branch: branches are cut at the trunk tip right before landing.

### Footprint overlap with the two running plans

Checked by running the contract check on a copy of this plan set to `ready`: it is refused for overlapping both running
plans.

- `261118-1341-s6a-execution-tier-rust` lists `src/session-host/head-request.mjs`, `src/session-rotation/rotate.mjs`,
  `apps/fgos/src/routing.rs`, `packages/run-supervisor/**`, `packages/distribution/contracts/doctor-registry.v1.json`
  and `apps/fgos/src/wiring/doctor/**`. Phases 2, 5 and 6 must touch these.
- `261120-0625-work-data-model` lists `src/session-host/head-grants.mjs`, `scripts/plan-contract-check.mjs`,
  `packages/supervision/rust/src/land.rs`, the supervisor and secretary skills and their renders,
  `docs/platform/session-host/spec.md`, `docs/platform/supervision/spec.md` and `CHANGELOG.md`. Only two lands remain
  in that plan, and both wait on the supervisor's open question `q-wjecldhcmr` (git recover of the main checkout).

While those footprints stand, the check refuses this plan as `ready` and the supervisor's `admissible` excludes it. The
plan therefore lands `draft`, with every phase that waits on no owner answer marked `ready`. It becomes admissible when
work-data-model is done, and when s6a is done or narrows its plan footprint to the files its remaining phases still
change, none of them in this plan's list. Ordering these plans is the secretary's call (the owner ranked `p-vquz26ibnn`
first). `blockedBy` stays empty because no phase here needs a result of either plan.

## Owner questions


- **q-3g32txifg5: decided 2026-11-22 18:50 by lead:SUPERVISOR inside the approved frame** (phase 12b, owner-approved 16:05): the footprint takes the credential renewal files and `apps/fgos/src/wiring/dispatch_subs/probes.rs`. probes.rs is also in s6a's footprint (`dispatch_subs/**`); keep the hunk to the renewal call, and whichever lands second rebases.

- **q-d5mrno2mfk: decided 2026-11-22 16:50 by lead:SUPERVISOR inside the approved frame**: the footprint takes `apps/fgos/src/wiring/session_write_publish.rs` for the phase 7 follow-up (owner-approved landed-worktree removal), as recommended.

- **q-r5w6funyv5, q-qki26cwunf: decided 2026-11-22 15:55 by lead:SUPERVISOR inside the approved frame**: the footprint takes `scripts/lib/git-one-door-declarations.v1.json` (phase 5 route host declaration) and `apps/fgos/src/wiring/supervision.rs` (phase 7 follow-up, owner-approved landed-worktree removal), as each question recommended.

- **q-lnq3nbjssw, q-2ul3tjw3kd, q-zwvjlsuqgc: decided 2026-11-22 14:55 by lead:SUPERVISOR inside the approved frame**: the footprint takes `src/cli/command-registry.mjs` (shared with s6a, disjoint hunks; whichever lands second rebases), `packages/supervision/rust/observe-kinds.json` and `packages/run-supervisor/rust/src/attempt_step.rs`, each as the question recommended. Phases 5 and 8 are ready again. The phase 9 disarm is committed as a6608f628.
None asked now. The owner said not to ask tonight, and the one open point (the secretary wake mechanism, a choice the
owner reserved on 2026-11-21 21:28) blocks only phase 10: that phase's first step asks it with `fgos questions ask` in
the five-part form, with the proposal written in the phase file, and lists the `q-` id here.

- **Phase 10, secretary wake mechanism: answered C** (owner via the secretary, 2026-11-22, supervision event
  `9467856911fda6a6`). A now: Miu arms a 15-minute recurring check on every start. Then B through
  `261122-0056-orchestration-skeleton` phase 6 (player wake), handed off there with a `coordination-handoff` event; A
  stays as the slow fallback. Phase 10 step 1 is done by this answer; the phase is `ready`.

- **q-ns4o7uqamq, who writes `.fgos/config.yaml`: answered 2026-11-22** by lead:SUPERVISOR: no unit may write `.fgos/`
  (the runner's write scope refuses the store directory), so lead:SUPERVISOR, the manual supervisor session in the main
  checkout, applies the patch items, keeping the owner's uncommitted edits, lands them and replies with the commit. The
  items are in `config-patch-items.yaml` in this directory (phase 3 gate, phase 4 pin; phase 9 added when chosen).

## Risks and rollback

- **Overlap with s6a and work-data-model** (above): the plan cannot be admitted until both are resolved; nothing
  breaks meanwhile.
- **The new land gate refuses lands it should not**: a running plan that already overlaps another running plan (s6a and
  `261120-0625-work-data-model` overlap today) must still land its phase-table updates. Phase 3 reports cross-plan overlap
  as an error only for a plan that is `ready`, and as a warning for one already `running`; its test covers both.
- **Release pickup crosses a layer**: the activation reader lives in `packages/distribution`; phase 5 injects the
  resolution as a port from the code that builds the socket config, never copies the reader, and stops for a plan change
  if the needed file is outside its footprint.
- **The idle-lead rule types into a pane**: only `session type` on a session an open `session-idle` event names, which the
  socket already enforces (`target-not-stuck`).
- **`.fgos/config.yaml` carries uncommitted owner edits in the main checkout**: phases 3, 4 and 9 change it only through
  `fgos config patch` or `fgos watcher tune` on their branch, and the lead reports a refused local fast-forward instead of
  touching the main checkout.
- **Rollback**: every phase lands as its own commit; revert that commit. The grant table, the land gate entry and the
  persona pin are each one config or table line, so a revert restores the previous behavior without a migration.
