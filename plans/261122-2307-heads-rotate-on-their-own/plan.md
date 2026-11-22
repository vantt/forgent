---
contract: plan-v1
title: "Heads rotate on their own: a cron, a background task, a near weekly quota and a quarantined account no longer need a manual rotate"
status: running
priority: P1
blockedBy: []
base: 27fd8a9b09b6a8584c37d7b18a6a96be4b2e1225
lead: head:lead-forgent-261122-2307-heads-5c830
footprint:
  - plans/261122-2307-heads-rotate-on-their-own/**
  - src/session-host/head-start.mjs
  - test/session-host/head-start.test.mjs
  - packages/session-host/rust/src/rotation/decide.rs
  - packages/session-host/rust/src/rotation/measure.rs
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - src/session-rotation/rotate.mjs
  - src/session-rotation/handoff-store.mjs
  - test/session-rotation/rotate.test.mjs
  - test/session-rotation/handoff-store.test.mjs
  - packages/session-host/contracts/rotation-files.v1.json
  - packages/observe/rust/src/sources/transcript_records.rs
  - packages/observe/rust/tests/transcript_records_test.rs
  - src/runner/dispatch/confinement/authority.mjs
  - core/config-standard/sessionRotation.yaml
  - core/config-schema/sessionRotation.schema.yaml
  - docs/platform/session-host/spec.md
  - CHANGELOG.md
source:
  - plans/discussions/ds-scjppt3ruk-heads-rotate-on-their-own/DISCUSSION.md
  - p-fwdxupc6fx
  - p-njgws5wsex
created: 2026-11-22
---

# Heads rotate on their own

## Outcome

A head session rotates without anyone running `fgos session rotate` in each of the three cases found on 2026-11-22:

1. **A session cron or background task is running.** A cron never blocks rotation. It goes into the handoff, and the
   successor recreates it. A background task holds only a soft rotation, the same rule as a pending question. At hard
   the session rotates, and the handoff lists the task so the successor can rerun it if it still matters.
2. **The account is near its weekly quota.** A status-line writer gives the Stop hook a fresh context measure and the
   account's weekly quota use. At `sessionRotation.quota` (standard 0.9) the head rotates at hard. The rotation
   quarantines the predecessor's account until the reset the status line reports, so the successor leases a
   different one.
3. **A head launch would pick a quarantined account.** The head seat's bind is given the lease state, so the seat
   ranking's existing `quarantined_until` filter sees the quarantine.

### Cause confirmation (done at plan time)

- **Cause 3, confirmed.** `bindHeadSeat` (`src/session-host/head-start.mjs:137-147`) calls `bind()` without
  `accountState`. `account_view` (`packages/execution/rust/src/accounts.rs:564`) builds the view from config alone
  when it gets no overlay, so `quarantinedUntil` is never set. The ranking filter
  (`packages/seat-binding/rust/src/rank.rs:911`) is correct. Every other bind caller passes
  `readAccountStateOverlay` (`src/runner/dispatch/provider-capacity.mjs:486`, or `LeaseOverlay` in
  `apps/fgos/src/wiring/unit_run_host/accounts.rs:41`). `secretary-miu/rotation.log` line 43 shows the
  result: `provider-capacity.lease-conflict (account "claude/tetcu" is quarantined)`.
- **Cause 1.** `decide` (`packages/session-host/rust/src/rotation/decide.rs:168`) returns `background-work-running`
  at every level when `background_tasks` or `session_crons` is non-empty. The hook only counts the two lists
  (`apps/fgos/src/wiring/session_rotation_hook.rs:201-205`) and never carries them.
- **Cause 2.** `RotationConfig` has no quota input. The sidecar reader exists (`rotation/measure.rs`), but no writer
  has ever existed: `git log -S'context-sidecar'` shows only the reader commits, and the session-host spec says
  "Not built". The lineage folder is read-only inside a confined head (spec 8.8), so a writer inside the head
  cannot write the path the contract names today.

### Prior art (AGENTS.md, prior art before design)

- `git log -S'background-work-running'`: the rule came in with `b55510b05` (measure, decide and keep handoffs) and
  was kept by `728942829` and `2c10a76a4`. It was never relaxed, and no commit records why crons block. It is
  read as "rotating would lose the work", which is true for a task and not for a cron, since a cron can be
  recreated from its schedule and prompt.
- `git log -S'accountState' -- src/session-host/head-start.mjs`: no hits. The head launch never passed it, so
  this is a gap, not a regression.
- **Reused:** the rotation decision door (`decide`), the measure door (`measure`, sidecar first, transcript as
  fallback), the hook door (`fgos hook session-rotation`, which gains an event instead of a second binary), the
  quarantine door (`quarantineProviderAccount`, `provider-capacity.mjs:634`, reason `quota-limit`), the overlay
  reader (`readAccountStateOverlay`), the handoff writer (`handoff-store.mjs`), and the `sessionRotation` config
  section. **Missing and added:** a sidecar writer (the status-line event), a quota input to `decide`, the
  `sessionRotation.quota` key, and cron and task lists in the stop facts and the handoff. There is no second door
  (L10).

## Acceptance criteria

1. A running cron no longer blocks rotation, and the successor's handoff tells it to recreate each cron. Owning
   proofs: the `decide` unit tests in `packages/session-host/rust/src/rotation/decide.rs`
   (`cargo test -p fgos-session-host rotation::decide`), and the handoff rendering test in
   `test/session-rotation/handoff-store.test.mjs` (`node --test test/session-rotation/handoff-store.test.mjs`).
2. A background task holds soft and does not hold hard. At hard the handoff lists the task. Owning proof: the same
   `decide` tests.
3. A weekly quota use at or above `sessionRotation.quota` rotates at hard. Owning proof: the `decide` tests. The
   sidecar's quota is read by `measure`: its unit tests in `rotation/measure.rs`. The status-line event writes the
   record: the hook tests in `apps/fgos/src/wiring/session_rotation_hook.rs`.
4. A quota rotation quarantines the predecessor's account until the reported reset, before the successor is bound.
   Owning proof: `test/session-rotation/rotate.test.mjs`.
5. A head launch never leases a quarantined account. Owning proof: one test of `bindHeadSeat` in
   `test/session-host/head-start.test.mjs`, with a quarantined account in the lease state and a healthy one beside
   it (`node --test test/session-host/head-start.test.mjs`).
6. `npm test` and `cargo test --workspace` are green on the combined tree (phase 4).
7. `node scripts/plan-contract-check.mjs --plan plans/261122-2307-heads-rotate-on-their-own` passes.
8. `p-njgws5wsex` and `p-fwdxupc6fx` close when this plan is done. The supervisor lands the backlog update.

## Non-goals

- A new seat judge (discussion non-goal).
- Changing the soft or hard context thresholds (discussion non-goal).
- The phase 12 rotation reliability work already done in `261122-0118-heads-stable-and-able`.
- The five-hour quota window. Only the weekly window named by the discussion triggers rotation. The five-hour window
  keeps its existing quota-stop quarantine (`packages/execution/engine/src/accounts/fault.rs`).
- Moving a running background task across the rotation. It cannot be moved, so it is listed for the successor
  instead.
- Codex or other CLIs' status lines. The writer is Claude Code's, which is the CLI the heads run today. Another
  CLI's head keeps the transcript measure.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [A head launch sees the quarantine](phase-01-head-launch-sees-quarantine.md) | - | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs | 1 | done |
| 2 | [Crons and background tasks no longer block rotation](phase-02-crons-and-tasks-rotate.md) | - | packages/session-host/rust/src/rotation/decide.rs, apps/fgos/src/wiring/session_rotation_hook.rs, src/session-rotation/rotate.mjs, src/session-rotation/handoff-store.mjs, test/session-rotation/rotate.test.mjs, test/session-rotation/handoff-store.test.mjs, packages/session-host/contracts/rotation-files.v1.json, plans/261122-2307-heads-rotate-on-their-own/reports/stop-payload-lists.md | 1 | done |
| 3 | [A near weekly quota rotates the head](phase-03-weekly-quota-rotates.md) | 1, 2 | packages/session-host/rust/src/rotation/decide.rs, packages/session-host/rust/src/rotation/measure.rs, apps/fgos/src/wiring/session_rotation_hook.rs, src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, packages/session-host/contracts/rotation-files.v1.json, packages/observe/rust/src/sources/transcript_records.rs, packages/observe/rust/tests/transcript_records_test.rs, src/runner/dispatch/confinement/authority.mjs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, core/config-standard/sessionRotation.yaml, core/config-schema/sessionRotation.schema.yaml, plans/261122-2307-heads-rotate-on-their-own/reports/status-line-payload.md | 2 | done |
| 4 | [Integration, docs and changelog](phase-04-integration.md) | 1, 2, 3 | docs/platform/session-host/spec.md, CHANGELOG.md, plans/261122-2307-heads-rotate-on-their-own/reports/integration.md | 3 | parked: acceptance 6 needs a host full-suite run (npm test, cargo test --workspace) on main at or after 7717d9a05; owner question q-zcileomdpa |

Every phase's capability is `code:implement`, except phase 4, which is `code:test`.

**Parallel reading.** Phases 1 and 2 have disjoint footprints and run at once. Phase 3 touches the files of both
(`decide.rs`, the hook, `rotate.mjs`, the contract, and the head launch settings in `head-start.mjs`), so it
waits for both. Phase 4 is the single writer of the hot files `docs/platform/session-host/spec.md` and
`CHANGELOG.md`. The rotation contract `rotation-files.v1.json` has one writer per wave (2, then 3).

**Progress (lead).** Phase 1 landed `b8482a127`, phase 2 `db1319f9b`, phase 3 `1cd8386c5`. Phase 3 differs from
its file in two points. First, the status-line sidecar lives beside the session transcript
(`<dir of transcript_path>/<session_id>.context-sidecar.jsonl`), not under the lineage, because the confinement policy
(`packages/execution/contracts/confinement-policy/policy.v1.json`) never grants a writable path under `.fgos`. Second,
the payload in `reports/status-line-payload.md` was reconstructed from the installed CLI bundle, so a real recording
is still owed. Phase 4's gate result is in `reports/integration.md`. Phase 4 landed `7717d9a05` and stays `running`,
parked on acceptance criterion 6. In a sandbox, `npm test` cannot start because the full-suite lock is read-only, and
`cargo test --workspace` shows 7 process-liveness failures in `apps/fgos/src/wiring/doctor/confinement.rs`, a module
this plan does not touch. Both gates must run outside a sandbox
(`reports/lead-261123-0214-heads-rotate-wave-run.md`).

**Owner order (2026-11-22 23:30, via the secretary, recorded by head:supervisor-forgent):** heads-stable blocks
nobody. This plan is admitted now; heads-stable's lead watches the files the two plans share (its open phase 11 writes
`head-start.test.mjs` and `CHANGELOG.md`). heads-stable left `blockedBy` and every phase is `ready`.

**Cross-plan sequencing.** `261122-0118-heads-stable-and-able` is `running` and owns `session_rotation_hook.rs`,
`rotate.mjs`, `rotation-files.v1.json`, `head-start.test.mjs`, `docs/platform/session-host/spec.md` and
`CHANGELOG.md`, so this plan is `blockedBy` it as a whole. Phase 1 alone would overlap only on
`head-start.test.mjs`, which that plan's phase 11 writes. Once phase 11 lands, nothing overlaps.

**Held at draft (2026-11-22 23:20).** The plan passes the contract check at `draft`. The `ready` flip is refused
because `scripts/plan-contract-check.mjs` (`activeOverlaps`, lines 249-296) fails any footprint overlap with another
`ready` or `running` plan, and it does not honor `blockedBy`. Two overlaps remain. The first is with
`261122-0118-heads-stable-and-able` (running) on the rotation files. The second is with
`261122-1950-owner-communication-standard` (ready) on `CHANGELOG.md`. Neither can be narrowed away: the rotation files
are the subject of this plan, and AGENTS.md requires a changelog line. Flip this plan to `ready` once both plans are
`done`. If the check is first changed to honor `blockedBy`, adding `261122-1950-owner-communication-standard` to
`blockedBy` clears the second overlap earlier. The check is in the running plan's footprint, so this plan does not
change it.

## Owner questions

None. The discussion left no point open. The quota threshold is a plan-time choice: 0.9 of the weekly window. It
leaves a tenth of the week for the handoff turn and the successor's start ritual, and it lives in
`core/config-standard/sessionRotation.yaml`.

## Outstanding questions

None

## Risks and rollback

- **The status-line input may not carry the weekly quota on the installed Claude Code version** (medium). Proof point
  for validating, phase 3 step 1: record one real status-line payload from a head and check for the weekly used
  fraction and its reset time. If the field is missing, phase 3 still ships the context sidecar, and the quota
  rotation is parked with a question in the five-part form. Phases 1 and 2 do not depend on it.
- **No path is both writable inside the confined head and readable by the host** (medium). Proof point, phase 3
  step 2: find a folder the confinement already grants. Otherwise the phase grants the lineage's `sidecar/`
  subfolder through the confinement authority and nothing wider.
- **The `session_crons` element shape is unrecorded** (low). The fixtures carry only empty lists. Phase 2 step 1
  records one real Stop payload with a cron before writing the handoff section.
- **A quota rotation onto the same account** (low). This is prevented by the order in `rotate.mjs`: quarantine
  first, then bind. Phase 1 makes the bind see the quarantine.
- **Rollback.** Each phase is one commit series on its own branch. Reverting a phase's merge commit restores the
  old behavior: crons block again, quota is ignored, and a head bind goes back to the config-only view. No state
  migration exists. The sidecar file and the `quota` config key are additive and ignored by older code.
