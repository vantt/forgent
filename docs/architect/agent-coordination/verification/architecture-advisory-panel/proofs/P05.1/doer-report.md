# P05.1 doer-report — hard conformance and recovery proof, real installed product path

Cell: `plans/260905-architecture-advisory-panel/phase-05-comparative-proof-and-promotion.md`, P05.1.
Protocol under test: `core.coordination-protocol.architecture-advisory-panel-v1`
(`core/coordination-protocols/architecture-advisory-panel-v1.yaml`), the same
FlowDefinition P03.2's own 13-case conformance suite exercises at the
kernel/pack-gate level. This cell instead exercises **the installed product
path**: the real `fgos` CLI binary, spawned as genuine OS subprocesses, never
the internal engine functions directly (except for reading/verifying raw
on-disk state, and one `fgos add` to file a found gap in the main repo's own
work-item store).

## Environment (isolation, not the shared repo's own `.fgos/`)

`WORK_DIR` = a fresh `fgos init`-ed temp directory, completely separate from
`forgentX`'s own `.fgos/` (this repo's CLI is cwd-strict per
`src/runner/paths.mjs`'s own doc comment — `.fgos/` always lives under the
caller's cwd, never resolved upward — so pointing every subprocess's `cwd` at
`WORK_DIR` gives full isolation from every other cell/session running
concurrently in this same repo, the same isolation `test/cli/`'s own
`tmpCwd()` harness relies on). `WORK_DIR/.fgos/config.json`
(`executors/runner-config.json` in this evidence set) registers 4 real,
locally-spawned fake executors (`exec-family-a`, `exec-family-b`, `exec-slow`,
`exec-fast-resume` — scripts under `executors/`), each a genuine `node
<script>.mjs` subprocess the CLI's own `cli-spawn` adapter spawns, matching
the shape `test/cli/coordination.test.mjs`'s own `writeFakeExecutorConfig`
and the conformance suite's own `fakeRunnerConfig` already use. No real LLM
calls, matching the task's own instruction and P03.2's own precedent — the
protocol's authority/visibility/aggregation/bounds/replay/routing behavior is
independent of what a given executor's output actually says.

Every command below was run as its own real OS process
(`node bin/fgos.mjs coordination run|show|chain ...`), from `WORK_DIR`, via
Bash. Full request files: `requests/`. Full raw stdout/stderr: `responses/`.
Full session event logs: `session-events/`.

## Area 1 — Authority (2 real attacks through the real CLI)

**Attack 1 — a driver-authored artifact claiming to be a human decision.**
`requests/req-attack-authority-01-driver-impersonates-human.json`: a
`human-turn` step with `attributedTo: {type: "driver", id: "aap-driver"}`,
preceded by a legitimate `interpret-request` step in the same call.

```
$ fgos coordination run --file req-attack-authority-01-driver-impersonates-human.json
fgos: coordination request: steps[1].attributedTo.type must be "person"
(exit code 4)
```

**Result: refused, and refused at the whole-request schema-validation layer
before ANY step dispatches** — `.fgos/coordination/sessions/aap_p051_authority_attack1/`
never got created at all (confirmed: `ls .fgos/coordination/sessions/` lists
only `aap_p051_main`, `aap_p051_visibility`, `aap_p051_authority_attack2`,
`aap_p051_smoke` — never `aap_p051_authority_attack1`). This is a stronger
guarantee than "the human-turn step itself is refused": even the otherwise-
legal `interpret` step riding along in the same call never got a chance to
run. **Claim holds.**

**Attack 2 — an unauthorized actor attempting a driver-only operation.**
Setup (`req-attack-authority-02-setup.json`): complete all three Phase-5
shapers for a fresh session (`aap_p051_authority_attack2`), so
`post-shaping-open` is legitimately open — isolating the attack to "was this
operation ever authorized" rather than "is the window open yet" (that
refusal is Area 2's own case). Attack
(`req-attack-authority-02-unauthorized-dispatch.json`): dispatch
`critique-proposals` as a plain `operation` step, with **no prior `authorize`
step ever issued** for that binding.

```
$ fgos coordination run --file req-attack-authority-02-unauthorized-dispatch.json
fgos: dispatchDeclaredOperation: operation "critique-proposals" at node
"phase-critique" for actor "architecture-critic-actor" declares
activation.mode "driver-authorized", and no unconsumed "operation-authorized"
event in session "aap_p051_authority_attack2" authorizes that exact binding
-- refusing to materialize an Assignment
(exit code 4)
```

`session-events/aap_p051_authority_attack2-events.jsonl` has zero
`assignment-created` event naming `critique-proposals` — confirmed by grep,
zero matches. **Claim holds.**

## Area 2 — Visibility (controlled reveal, real CLI)

Session `aap_p051_visibility`. Setup
(`req-attack-visibility-01-partial-shaping.json`): interpret +
`shape-system-proposal` + `shape-alternative-proposal` only — **2 of 3**
Phase-5 shapers. Attack
(`req-attack-visibility-02-premature-reveal.json`): authorize
`critique-proposals` citing the two settled shaper Assignments.

```
$ fgos coordination run --file req-attack-visibility-02-premature-reveal.json
fgos: authorizeDeclaredOperation: operation "critique-proposals" at node
"phase-critique" for actor "architecture-critic-actor" requires visibility
window "post-shaping-open" to be open before any context may be granted,
and it is not open yet -- refusing to authorize
(exit code 4)
```

Event count before/after the refused attempt: unchanged at 15 (confirmed by
`grep -c ""` on the session's `events.jsonl`) — the refusal wrote nothing.
Then (`req-attack-visibility-03-complete-trio-and-reveal.json`): dispatch the
missing third shaper (`shape-constraint-proposal`) and, **in the same call**,
re-issue the identical critique authorization — it now succeeds
(`appended: true`). **Claim holds both ways**: premature reveal refused, and
the SAME authorization legally succeeds once the real fan-out genuinely
completes — proving the refusal is real gating, not a permanent block.

## Area 3 — Aggregation (real CLI, real `aggregateBounds`, reaches `close-dialogue`)

Session `aap_p051_main` (the same session used for Areas 4/5/6 below — one
coherent real panel run, not six disconnected fixtures) opened with
`aggregateBounds: {maxRounds: 20, maxAssignments: 30}` declared at open
(`requests/req-01-framing-shaping.json`) — the exact fix P04.2 had to apply
after finding the platform's default `maxRounds: 10` cap made this
protocol's own mandatory pre-dialogue path (8 ops minimum) unreachable to
`close-dialogue`. This session runs 14 real CLI-dispatched operations plus a
real crash/resume (Area 6) and reaches:

```
$ fgos coordination run --file req-12-close-dialogue.json
... "closed": true, "status": "completed"
```

`responses/out-13-show-final.json` (`fgos coordination show` on the
completed session): `status: "completed"`, `quorum.missing: []`,
`assignmentRefs` length 13 (12 real dispatches + `close-dialogue` itself,
minus the specialist slot never exercised in this cell — out of P05.1's own
scope, per SKILL.md's own `tsk-3xk` disclosure). **Claim holds**: a real
session, through the real CLI, with the declared bounds, reaches
`close-dialogue` and completes.

## Area 4 — Routing (heterogeneous dispatch, real RunResult provenance)

Same session, Call 1 (`req-01-framing-shaping.json`) declares an `actors[]`
override: `system-shaper-actor -> exec-family-a`,
`alternative-shaper-actor -> exec-family-b` — two distinct REGISTERED
executors. CLI step-result excerpt (`responses/out-01-framing-shaping.json`):

| step | executor | provider | tier |
|---|---|---|---|
| shapeSystem | `exec-family-a` | `family-a` | `analytical` |
| shapeAlt | `exec-family-b` | `family-b` | `analytical` |

Real `RunResult.policy.provenance` (`.fgos/assignments/asgn_aap_driver_op_004/runs/01/result.json`,
`.../op_005/runs/01/result.json`, both copied into `session-events/` is not
needed — cited here verbatim, full JSON in the Doer's own working notes
above, reproducible from any resumed WORK_DIR):

- system-shaper: `executor: exec-family-a`, `provider: family-a`, `model: model-a-analytical` (source `runnerConfig: family-a.analytical`), `tier: analytical` (source `operation: shape-system-proposal`).
- alternative-shaper: `executor: exec-family-b`, `provider: family-b`, `model: model-b-analytical` (source `runnerConfig: family-b.analytical`), `tier: analytical`.

Two genuinely distinct executor/provider/model bindings, each resolved
through the real CLI, each RunResult's own provenance matching exactly what
the request asked for (per-role executor override respected, tier floor from
the operation's own declared `minTier`). **Claim holds.**

## Area 5 — Bounds (dialogue-reopen cap, real CLI)

Same session. Real human turn recorded
(`req-09-human-turn-and-reopen1.json`, `human/1-person.md` — see the Honesty
note below on what this turn's own words are and are not), then
`revise-synthesis` authorized and dispatched twice
(`req-09-...json` call 1, `req-10-reopen2.json` call 2) — both succeed
(`appended: true`, each producing a genuinely NEW Assignment:
`asgn_aap_driver_op_012`, then `asgn_aap_driver_op_013`, distinct from the
original `asgn_aap_driver_op_009`). A third attempt
(`req-11-reopen3-refused.json`):

```
$ fgos coordination run --file req-11-reopen3-refused.json
fgos: authorizeOperation: binding (node "phase-dialogue-reopen", operation
"revise-synthesis", actor "synthesizer-actor") in session "aap_p051_main"
already has 2 "operation-authorized" event(s), at or above its declared
activation.maxInvocations cap of 2 -- refusing to authorize another
invocation
(exit code 4)
```

Event count unchanged (47 before and after — confirmed by `grep -c ""` and a
direct `grep "auth_revise_3"` returning zero matches) — the refused 3rd
reopen wrote nothing. **Claim holds**: exactly 2 admitted, the 3rd refused,
through the real CLI, with the exact `activation.maxInvocations` mechanism
the kernel declares.

## Area 6 — Replay / crash / fresh-process resume (the centerpiece)

Full narrative and every command/output: `crash-state-snapshot.md`. Summary:

1. Same session driven, via 4 separate real CLI calls, through framing,
   Phase-5 fan-out (heterogeneous), Phase 6 (critique + assess-constraints),
   and authorization of `synthesize-recommendation` (Assignment
   `asgn_aap_driver_op_009`) — "meaningful durable progress," well past the
   Phase-5 fan-out, with synthesis itself authorized.
2. `run-crash-proof.mjs` (in `executors/`, the crash driver script) spawned
   a genuinely separate `node bin/fgos.mjs coordination run --file
   req-04-dispatch-synth-slow.json` child process (real PID `3730502`)
   dispatching that same synthesis Assignment through a deliberately slow
   fake executor (`exec-slow.mjs`) that writes a real
   `exec-slow-started.marker` file immediately, then sleeps 25s before ever
   settling. The driver polled for that marker (real proof the executor
   subprocess was genuinely mid-flight — its own PID `3730516` recorded in
   the marker), then sent a real `SIGKILL` to PID `3730502`.
3. Confirmed dead by an independent, separate mechanism from the `exit`
   event: a `kill -0` ESRCH probe, AND (outside the driver script entirely,
   as a second independent check) `ps -p <pid>` for all three PIDs involved
   — all three confirmed gone (`crash-state-snapshot.md` §1). The executor
   subprocess is spawned `detached: true` as its own process-group leader
   (`transport.mjs`), so it survived the parent's SIGKILL as a real orphan
   and had to be reaped explicitly — documented plainly, not hidden.
   `exec-slow-finished.marker` never appeared: the kill landed genuinely
   before settlement.
4. From a **genuinely fresh, separate process** (a new `node bin/fgos.mjs
   coordination show aap_p051_main --json` invocation with no shared memory
   or state from the killed one), the session correctly reports the
   interrupted actor as `late` (distinct from `completed`/`missing`) and the
   on-disk Assignment (`asgn_aap_driver_op_009`) shows a `run.json` frozen at
   `"status": "running"` forever, with no result file — real, durable,
   correctly-interpretable partial state (`crash-state-snapshot.md` §2-3).
5. **Real, disclosed gap found here, not asserted away**: re-dispatching the
   identical operation through the CLI from the fresh process did **not**
   just work. It was refused by a stale `dispatch.claim` exclusive-lock file
   the killed process created (before spawning its executor) and never got
   to remove (`crash-state-snapshot.md` §4). Reading `session-engine.mjs`'s
   own doc comment confirms this is deliberate, documented fail-closed
   behavior ("a crashed in-flight dispatch still needs manual
   reconciliation, not silent auto-retry") — not a regression, but a real,
   previously-undisclosed-for-this-track limit on the "resume using only
   `fgos coordination show`/`chain` plus the session id" promise: the ONLY
   reconciliation channel today is direct filesystem access (removing the
   lock file after confirming the owning process is truly dead), which is
   NOT one of the documented CLI doors. **Filed as `tsk-47l`** (light risk,
   bug), not fixed here — this is exactly the class of finding phase-05's
   own brief calls "a real, valuable result for this cell."
6. After that one manual reconciliation step (`rm .../dispatch.claim`, done
   only after the OS-level dead-process confirmation in step 3 above), the
   identical resume request succeeded from the fresh process, producing a
   genuinely NEW run attempt (`runs/02`) under the **SAME** `assignmentId` —
   `runs/01` (the interrupted attempt) stays on disk, untouched by the
   engine. The session's own event log (`session-events/aap_p051_main-events.jsonl`,
   `seq: 33`) confirms the linked result is `run_asgn_aap_driver_op_009_02`,
   not `01`.
7. That same, now-unblocked, fresh-process session then continued — still
   through nothing but the real CLI and its own on-disk state — through
   red-team (`req-07-redteam.json`), explanation (`req-08-explain.json`),
   the real human turn and both bounded reopens (Area 5, above), and
   `close-dialogue`, reaching `status: "completed"` (Area 3, above).

**Claim assessment: holds, with one disclosed, real limitation.** A fresh
process CAN correctly read and interpret a crashed session's true state
using only `fgos coordination show` plus the session id (step 4). A fresh
process can also correctly RESUME and complete that session using only the
real CLI doors (steps 6-7) — but for this one failure mode (a process killed
mid-dispatch, after claiming but before settling an Assignment), getting
from "correctly diagnosed" to "resumed" needs one out-of-band filesystem
step no documented CLI command performs. This is `tsk-47l`, not silently
folded into a clean "replay works" claim.

## Honesty note on the human turn used for Area 5

Per phase-05's own Live Proof Boundary ("A scripted fake-human transcript
cannot prove the Decision Dialogue"), the human turn used here
(`human/1-person.md`) is explicitly **not** offered as proof of the real
Decision Dialogue with an actual third-party person — that is P05.2's own
scope. It exists solely to exercise the `human-turn` request-step type and
the bounded-reopen mechanism (Area 5) through the real CLI, and is labelled
as such in the file itself.

## Tests

- Focused suite (`focused-suite-run.log`):
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
  — **757/757 pass**, exact match with the track's own recorded baseline (no
  source touched, no change expected or found).
- Skill-projection suite (`skill-wrappers-suite-run.log`):
  `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
  — **39/39 pass**.
- Full suite (`full-test-run.log`):
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test` — **5695 tests, 5685 pass, 4
  fail, 6 skipped**. The 4 failures are exactly the track's own recorded
  4-item baseline by name (`fgos-intake-4`/legacy durable-doing
  ask-answer, `enduser-index`/missing-quadrant docs-index,
  `coordination-doctor-check`/two resume-example placeholder refs, and the
  live-executor flake class — this run's own instance is
  `codex-cli-glm-cli-live-executors.test.mjs` returning
  `MODEL=claude-fable-5-1` instead of a genuine GLM identification, same
  live/external-service-flake class `index.md`'s own Baseline section
  already names as item 4's known drift). **Zero new failures.**
- `detect_changes`: not run — no real source file was touched (confirmed:
  this cell's only writes anywhere are under
  `docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P05.1/`,
  this report, plus one `fgos add` call recording `tsk-47l` in the shared
  work-item store), per phase-05's own "you likely won't [touch source]"
  framing for this cell and the task's own instruction to only run
  `detect_changes` "if you touch any real source file."

## Files

- `requests/` — every real request JSON file dispatched (18 files).
- `responses/` — every real CLI stdout/stderr for every call above (39
  files).
- `session-events/` — the raw `events.jsonl` for every session that actually
  opened (`aap_p051_main`, `aap_p051_visibility`, `aap_p051_authority_attack2`;
  `aap_p051_authority_attack1` never opened at all — see Area 1, Attack 1).
- `human/` — the human-turn artifact file(s) used, with the Honesty note
  above embedded in the file itself.
- `executors/` — the 4 fake executor scripts, the crash-proof driver script
  (`run-crash-proof.mjs`), and the exact `runner-config.json` used.
- `crash-proof-log.txt` — the crash driver's own timestamped log (spawn,
  marker-wait, kill, dead-confirmation, orphan-reap).
- `crash-state-snapshot.md` — full narrative + verbatim command/output for
  Area 6.
- `focused-suite-run.log`, `skill-wrappers-suite-run.log`,
  `full-test-run.log` — the three required test runs.

## Real gap filed

`tsk-47l` — crash-killed coordination dispatch leaves a stale
`dispatch.claim` lock blocking CLI-only resume; the documented fail-closed
behavior is correct, but there is no CLI-level reconciliation door today.
Not fixed in this cell (disclosure only, per this cell's own scope and the
task's own instruction to treat a found-and-not-silently-bundled fix as a
separate decision).

## Unresolved questions

- None blocking. `tsk-47l`'s own fix approach (should `fgos coordination
  show`/`run` detect a claim whose owning process is verifiably dead and
  offer/perform reconciliation, or should this stay a documented
  operator-only path?) is a real design choice for whoever picks up that
  item, not something this cell should presume settled.

Status: DONE_WITH_CONCERNS
Summary: All 6 areas (authority, visibility, aggregation, routing, bounds,
replay) proven through the real installed CLI door with real attacks, a real
heterogeneous dispatch, and a real `kill -9` crash/fresh-process resume; one
genuine gap found and disclosed (`tsk-47l`) rather than silently smoothed
over — a stale `dispatch.claim` lock left by a SIGKILL'd dispatch has no CLI
reconciliation door, only direct filesystem access, so "resume using only
the CLI doors" holds for diagnosis but not fully for recovery in this one
failure mode. Focused suite 757/757, skill-projection 39/39, full suite at
the track's own exact 4-item baseline, zero new failures, zero source
touched.
Concerns/Blockers: `tsk-47l` is a real, disclosed limitation on this
cell's own Area 6 claim, not a blocker to closing this cell (per phase-05's
own framing, a found gap is itself a valid live-proof result) — flagging it
so Review/Red-Team weigh it explicitly rather than re-discovering it.
