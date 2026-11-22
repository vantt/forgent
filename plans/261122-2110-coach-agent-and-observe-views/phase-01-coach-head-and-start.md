# Phase 1: Coach head, grant and start

Capability: `code:implement`. Wave 1. Depends on nothing. Decisions: CA-D1, CA-D2, CA-D5; inherits OC-D5.

## Inputs

- `plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md`, sections 3 (rows "When the
  supervisor starts the coach", "Coach budget", "Goal compass", "What the coach produces") and 6 ("Goal compass",
  "One generic loop"), and section 4 (CA-D1, CA-D2, CA-D5).
- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, OC-D5 row (coach scope and hand-off).
- `core/watcher/README.md`, `core/watcher/definitions/discussion-settled.query.json`,
  `core/watcher/definitions/supervisor-stuck.query.json` (`without ... anchor: after`, `having`, own window),
  `core/attention/definitions/head-gone.query.json` (head-state records), `core/attention/definitions/plan-no-progress.query.json`
  (`params.configKey`).
- `packages/observe/rust/src/query/model.rs` (`Without`, `Anchor`, `Having`) and `packages/observe/rust/src/friction.rs`
  (`RECORDED_KIND`, `RESOLVED_KIND`, the settle rule in `unsettled`, the class attribute `fgos.friction.class`).
- `packages/supervision/rust/tests/definitions.rs` and `packages/supervision/rust/tests/fixtures/definitions/discussion-settled/`.
- `core/skills/fgos-supervisor/SKILL.md`, section "Settled discussion" (the model for the new section).
- `src/session-host/head-grants.mjs` (`GRANTS`, `HEAD_VERBS`, `LAND_VERBS`, `COORDINATION_VERBS`), `src/session-host/head-request.mjs`
  (verb routing and the `fgos.coordination.*` kind limit on `metrics record`), `packages/run-supervisor/contracts/head-request.v1.json`.
- `core/agents/shaper.yaml` (persona file shape), `core/config-standard/supervisor.yaml` and
  `core/config-schema/supervisor.schema.yaml` (config file shape).
- `test/live/head-grant-probe.live.mjs` (how a live head probe is written).
- Goal sources for the compass: `AGENTS.md` (product priority order, mission boundary), `docs/platform/vision.md`,
  `docs/platform/intent-preservation-ledger.md`, `docs/platform/platform-foundations.md`, `docs/decisions/index.md`.

## Files it may write (footprint)

`core/agents/coach.yaml` (new), `core/skills/fgos-coach/SKILL.md` (new), `core/skills/fgos-coach/references/goal-compass.md`
(new), `core/watcher/definitions/coach-due.query.json` (new), `core/config-standard/coach.yaml` (new),
`core/config-schema/coach.schema.yaml` (new), `core/skills/fgos-supervisor/SKILL.md`, `src/session-host/head-grants.mjs`,
`src/session-host/head-request.mjs`, `test/session-host/head-grants.test.mjs`, `test/session-host/head-request.test.mjs`,
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/rust/src/head_request.rs`,
`packages/run-supervisor/rust/tests/head_request.rs`, `packages/supervision/rust/tests/definitions.rs`,
`packages/supervision/rust/tests/fixtures/definitions/coach-due/**` (new), `test/live/coach-run.live.mjs` (new).

The generated render surfaces may be rebuilt on this phase's branch for the live probe. Phase 6 owns their landed
state, so do not land them from this phase.

## Steps

1. **Probe the sandbox first.** Give `coach` a provisional grant in `GRANTS`. Start one real coach head on this
   machine (`fgos session start coach --name probe`) and check from inside it whether each of these works:
   `fgos metrics query --def core/attention/definitions/plan-no-progress.query.json`, `fgos friction rank`, reading
   `~/.claude/projects/<project>/` transcripts, reading the auto-memory directory, and `fgos friction resolve`. Write
   the result table to `plans/261122-2110-coach-agent-and-observe-views/reports/sandbox-probe.md`. Every read that fails
   becomes a socket verb in step 5. Transcripts or memory that stay unreadable are recorded there as a named gap for
   phase 4.
2. **`coach-due` definition.** Write `core/watcher/definitions/coach-due.query.json` over `fgos.friction.recorded`.
   Drop settled frictions with two `without` clauses on `fgos.friction.resolved` anchored `after`, one `on` the
   subject and one `on` `fgos.friction.class`. Raise one row when either holds:
   (a) an unsettled signature's count reaches `coach.signatureThreshold` (`having count >= param`), or
   (b) any unsettled friction exists and no `head:coach-` head started within `coach.floorDays`. Use `without` on
   the head-state kind `head-gone` reads, with `within` from the param.
   If (a) and (b) cannot share one query, write two definitions, `coach-due` and `coach-due-floor`, with the same row
   kind `coach-due`. Use `"window": "own"` with `since` `-30d` so the event id holds across ticks (see `head-gone`).
   The row's `subject` is a fixed `coach` id, so a second signature crossing the threshold in the same window does not
   raise a second event before the run. Row: `kind: coach-due`, `reason`, `nextCommand: fgos supervisor plans`.
   If the settle rule cannot be expressed (risk 1 in plan.md), stop and register `UnsettledSource` as a derived source.
   That edit is in `apps/fgos/src/wiring/observe_query.rs`, phase 4's file, so record it as `DONE_WITH_CONCERNS` and
   hand it to phase 4 rather than writing it here.
3. **Config keys.** Create `core/config-standard/coach.yaml` and `core/config-schema/coach.schema.yaml` (`owner:
   observe`) with `coach.signatureThreshold` (default 3), `coach.floorDays` (7), `coach.maxSignatures` (3),
   `coach.maxProposals` (3), `coach.transcriptScanMaxBytes` (default 50 MiB, used by phase 4) and
   `coach.maxTranscriptsPerRun` (default 20). Each needs a `@fgos:doc` line with unit, bounds and default. If the
   config tests name a registry of standard files, add the entry there and widen this footprint by that file through
   the owner question door before writing it.
4. **Persona and skill.** `core/agents/coach.yaml`: role "Learning-loop coach (one run)", skills `fgos-coach`, decision
   boundary per OC-D5. It may decide which ≤3 problems to work and how to diagnose them. It must escalate any goal
   conflict (CA-D5) and anything beyond small instruction or memory text. `core/skills/fgos-coach/SKILL.md`: the run in
   order, as follows.
   - Read the goal compass (`references/goal-compass.md`: each written goal source, its place in the fixed priority
     order, and the views that measure it).
   - Read the inputs. Until phase 2 lands, these are `fgos friction rank` and the reused definitions.
   - Pick at most `coach.maxSignatures` problems, ranked by the goal they hurt, then by count.
   - Diagnose each problem.
   - Write one report at `fgos convention path --kind report --type coach --slug <slug>`.
   - Make at most `coach.maxProposals` proposals. Each one cites its goal and source line, or it is not made. Each is a
     new version, never an in-place edit (CA-D6). Small instruction or memory text goes into one batched
     `fgos questions ask`. Anything else becomes `fgos supervisor raise` with the evidence.
   - Record each proposal as an `fgos.coach.proposal` metrics record (attributes: signature, goal, route
     `owner|supervisor`, report path).
   - After the supervisor files a row, run `fgos friction resolve --class <sig> --reason filed:<backlog-id>`.
   - In the next run, report the before and after count per filed signature.
   - Record an owner rejection or re-aim as friction class `coach-misread-goal`. Record a question the views cannot
     answer as `coach-query-gap`.
   - Stop after the report.
   Private text (transcript excerpts, people's words) never goes into the report. It goes to
   `.fgos/observe/private/coach/<run>/` (phase 3's store directory).
5. **Grant and socket.** Add `coach` to `GRANTS` with writes `['plans/reports']`. Its verbs are `HEAD_VERBS`,
   `QUESTION_VERBS`, `LAND_VERBS`, `supervisor raise`, `metrics record` limited to `fgos.coach.*` kinds, and every read
   or resolve verb that step 1 found blocked. Extend the per-persona kind limit in `head-request.mjs` so the existing
   `fgos.coordination.*` rule keeps holding for the coordinators. Declare the new entries in `head-request.v1.json`
   and its Rust mirror. Extend the owning tests in `head-grants.test.mjs`, `head-request.test.mjs` and
   `head_request.rs`, with no second copy of their cases.
6. **Supervisor action.** Add a section "Coach due" to `core/skills/fgos-supervisor/SKILL.md`: on event `coach-due`,
   run `fgos session start coach --name <project handle>` unless a `head:coach-` role is live. Then run
   `fgos supervisor handled <event id>`. Stop the coach with `fgos session stop coach --name <name> --reason "report
   written"` once its report is landed. A raised problem from the coach is filed as one backlog row
   (`fgos identity mint backlog`) through the normal pipeline. The new section must use only the five-part question
   form the other plan defines and must not restate it.
7. **Tests.** Add `coach-due` to `RAISED` in `packages/supervision/rust/tests/definitions.rs`. Add fixture dirs with a
   matching store (one signature at 3 unsettled records; one friction settled by subject and one by signature, which
   must not count) and a non-matching store (2 records, or 3 that are settled). Write `test/live/coach-run.live.mjs`.
   It copies a fixture project with seeded friction and one private phrase, starts a coach head, waits for its report
   and asserts the following:
   - exactly one report exists;
   - it has ≤3 proposals;
   - each proposal has a `Goal:` line naming a source path and line;
   - the private phrase is absent from the report;
   - the run ended within `coach.maxProposals` and a wall-clock cap.

## Verify

```bash
cargo test -p fgos-supervision --test definitions
cargo test -p fgos-run-supervisor --test head_request
node --test test/session-host/head-grants.test.mjs test/session-host/head-request.test.mjs
node scripts/plan-contract-check.mjs --plan plans/261122-2110-coach-agent-and-observe-views
node --test test/live/coach-run.live.mjs   # live, spends tokens; run once on the host
```

Pass: every command exits 0. The `coach-due` fixture answers exactly one row on the matching store and none on the
non-matching one. `reports/sandbox-probe.md` exists.

## Rollback

`git revert` of this phase's commit. No coach can start without the grant and the definition, and no data is
written.
