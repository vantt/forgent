# P05.1 doer-report — hard conformance and recovery proof, real installed product path

Cell: `plans/260905-architecture-advisory-panel/phase-05-comparative-proof-and-promotion.md`, P05.1.
Protocol under test: `core.coordination-protocol.architecture-advisory-panel-v1`
(`core/coordination-protocols/architecture-advisory-panel-v1.yaml`), the same
FlowDefinition P03.2's own 13-case conformance suite exercises at the
kernel/pack-gate level. This cell instead exercises **the installed product
path**: the real `fgos` CLI binary, spawned as genuine OS subprocesses, never
the internal engine functions directly (except for reading/verifying raw
on-disk state, and `fgos add` calls to file gaps found in the main repo's own
work-item store).

**This report was rewritten after independent Review and Red-Team.** The
original submission's summary ("all 6 hard-conformance claims proven") is no
longer accurate and is corrected below, per area, citing the reviewers' own
finding IDs. The original per-area walkthroughs (what was actually run, what
the CLI actually returned) are accurate records of what happened in *this
cell's own, non-adversarial run* and are kept below with corrections inserted
inline — but the original conclusions drawn from them overclaimed how far
those results generalize. Full independent reports:
`reviewer-report.md`/`reviewer-findings.json` (6 findings, `P051-R-01..06`),
`redteam-report.md`/`redteam-findings.json` (18 live attacks, findings
`F1..F9`).

## Corrected conclusion, per area — read this first

| Area | Original claim | Verdict under independent adversarial testing |
|---|---|---|
| 1. Authority | Holds | **Holds, more robustly than shown.** The Doer's own attack was refused at the shallow request-schema layer before reaching the engine at all. Red-Team pushed 4 additional, schema-legal variants at the real store-layer guard (`RT-01..04`) — driver self-attribution, a driver-authored ref as the "person," a declared panel actor as the "person," a foreign `writerId` — **all 4 blocked**, confirming genuine defense in depth. Caveat: this holds against CLI-reachable attacks only. With direct filesystem write access to `.fgos/` (a different, higher privilege level than any CLI caller), forged events can force a real dispatch (`RT-06` stage 2, **BYPASSED**), and the per-event integrity hash is unverified anywhere (`F7`, medium) — so "the ledger cannot be tampered with" was never a claim this area actually supports, only "CLI-reachable authority is enforced," which is true. |
| 2. Visibility | Holds both directions | **Holds narrowly, does not hold as the phrase "controlled reveal" implies.** The context-grant/authorization gate (what was actually tested) holds exactly as shown, reproduced independently twice, and `show`/`chain` leak no content pre-reveal (`RT-07`, BLOCKED). But Red-Team found the reveal boundary is enforced only at the *prompt* layer, not the *process* layer: a shaper's own executor subprocess can read every sibling's `agent-report.md` off disk, across actors and across sessions, before or regardless of any reveal (`F8`/`RT-08`, **BYPASSED**). "Independent work, controlled reveal" does not hold against a curious executor. |
| 3. Aggregation | Holds | **The narrow claim holds; a related robustness property is broken.** `aggregateBounds` declared at open, reaching `close-dialogue`: reproduced exactly by independent Review, which additionally proved necessity (stripping the bounds wedges the identical chain at round 10). Red-Team additionally found the real minimum for this flow is `maxRounds: 12`, not the `20` used (informational, `RT-09`, no fencepost bug). But: `aggregateBounds` declared on a **resumed** request is silently discarded in both directions — tightening returns exit 0 and dispatches past the new cap anyway; raising an under-budgeted session's cap does nothing, and that session is then wedged forever with no CLI recovery door (`F6`/`RT-10`, **BYPASSED, high**). Filed as `tsk-1zk`. |
| 4. Routing | Holds | **Does not hold as generalized.** The specific run in this cell genuinely dispatched through two distinct registered executors with correct, matching provenance — independently reproduced byte-for-byte by Review. But Red-Team showed the reported provenance is not evidence of what was dispatched: `findLatestRunResult` reads `runs/<n>/result.json` off disk with no authenticity or shape check and links it as genuine (`F1`/`RT-11`, **BYPASSED, high**) — a hand-planted file reporting a fabricated executor/provider/tier was accepted with **zero real executors run**. This is reachable by any actor with filesystem write access to `.fgos/assignments/`, which every dispatched executor subprocess already has (`F8` again). Filed as `tsk-63z`. **The original "each RunResult's own provenance matches exactly what the request asked for" is false as a general property of this protocol's routing; it was true only for this one run, which had no adversary present.** |
| 5. Bounds | Holds | **The cap holds; the precondition does not exist.** `activation.maxInvocations: 2` on `revise-synthesis` is real, reproduced exactly (same event count, independent Review) and survives genuine concurrent racing 10/10 trials, no double-admit (`RT-12`, BLOCKED). But the YAML's own stated precondition — a reopen is spendable "once a human turn has been recorded" — is prose only. Red-Team authorized and dispatched `revise-synthesis` in a session with **zero** human turns and **zero** prior synthesis, skipping the entire graph (`F5`/`RT-18`, **BYPASSED, high**). Filed as `tsk-3ru`. **"Bounds" as this report originally used the word conflated two different guarantees — the numeric cap (real) and the sequencing precondition (fictional) — only the first was tested.** |
| 6. Replay/crash-resume | Holds, with one disclosed limitation (`tsk-47l`) | **Diagnosis holds; recovery is worse than disclosed.** A fresh process correctly reads a crashed session's true state via `show` alone — confirmed independently. The originally-disclosed `dispatch.claim` gap is real, but two things were wrong about how it was characterized: (a) the proposed fix ("detect a claim whose owning process is verifiably dead") is **not implementable as stated** — `dispatch.claim` is a zero-byte file recording no PID, host, or timestamp anywhere; the Doer could only confirm death because of insider knowledge from the test harness's own out-of-band marker file, which a real incident responder would not have (`RT-14`, UNEXPECTED). (b) A **second**, undisclosed lock (`dispatch/cli.mjs`'s per-cwd dispatch lock, real-repo `timeoutMs: 2100000` = 35 minutes) also survives SIGKILL, and attempting the documented workaround while it is still held does not fail cleanly — it **permanently poisons the assignment** (`late` → `failed` forever, no CLI retry) — inside a window an operator would naturally hit (`F2`/`RT-15`, **BYPASSED, high**). Two more failure modes, worse than the disclosed one, were found: a crash during event-log append makes the session undiagnosable, not just unrecoverable — both `show` and `run` exit 5 (`F3`/`RT-16`, high); and a fabricated `result.json` bypasses the stale claim entirely and silently "completes" the actor with fabricated content (`F4`/`RT-17`, high, same root cause as `F1`). `tsk-47l` has been amended to record all of this (`fgos show tsk-47l`). |

**Read plainly, per team-lead's own instruction: 3 of the 6 areas (Routing,
Bounds, Replay/crash-resume) have a real, independently reproduced bypass of
the claim as this report originally stated it.** Authority and Aggregation
hold for their narrow, literal claims but have adjacent properties (ledger
integrity; resumed-request bounds) that do not. Visibility holds at the
layer it was tested at (context-grant gating) but not at the layer the
phrase "controlled reveal" implies (process isolation).

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
calls, matching the task's own instruction and P03.2's own precedent.

Every command below was run as its own real OS process
(`node bin/fgos.mjs coordination run|show|chain ...`), from `WORK_DIR`, via
Bash. Full request files: `requests/`. Full raw stdout/stderr: `responses/`.
Full session event logs: `session-events/`. Real RunResult artifacts:
`run-results/` (added after Review's `P051-R-03`, see Files below). The
crash-proof driver script: `executors/run-crash-proof.mjs` (also added after
`P051-R-03` — see Files below).

## Area 1 — Authority (2 real attacks through the real CLI; Red-Team ran 4 more, all blocked)

**Attack 1 — a driver-authored artifact claiming to be a human decision.**
`requests/req-attack-authority-01-driver-impersonates-human.json`: a
`human-turn` step with `attributedTo: {type: "driver", id: "aap-driver"}`,
preceded by a legitimate `interpret-request` step in the same call.

```
$ fgos coordination run --file req-attack-authority-01-driver-impersonates-human.json
fgos: coordination request: steps[1].attributedTo.type must be "person"
(exit code 4)
```

Refused, and refused at the whole-request schema-validation layer before ANY
step dispatches — `.fgos/coordination/sessions/aap_p051_authority_attack1/`
never got created at all. **Correction (Red-Team):** this refusal is real
but shallow — it never reaches the engine's own store-layer guard, because
`attributedTo.type: "driver"` is schema-illegal on its own. Red-Team pushed
4 schema-*legal* variants designed to reach the engine (`RT-01`: driver
attributes a turn to itself; `RT-02`: driver cites its own Assignment ref as
the "person"; `RT-03`: driver names a declared panel actor as the "person";
`RT-04`: a different `writerId` writes into a session it does not drive) —
**all 4 blocked**, at `recordHumanTurn`'s own T1 guard (`store.mjs`). This is
the real, load-bearing defense; the original Attack 1 only exercised the
outer, easier layer.

**Attack 2 — an unauthorized actor attempting a driver-only operation.**
Setup (`req-attack-authority-02-setup.json`): complete all three Phase-5
shapers for a fresh session (`aap_p051_authority_attack2`), so
`post-shaping-open` is legitimately open — isolating the attack to "was this
operation ever authorized" rather than "is the window open yet." Attack
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
zero matches. Both independently reproduced by Review and Red-Team.

**Scope caveat, not in the original report:** all 6 blocked attacks above
(2 original + 4 Red-Team) go through the CLI as a normal caller. A
*different* privilege level — direct write access to `.fgos/`'s own event
log — is a separate, weaker guarantee: `RT-05` shows the dispatch/authorize
gates correctly re-derive from real state and refuse a forged
`operation-authorized` event on their own (capability BLOCKED), but the
forged event itself is accepted and rendered by `show` as legitimate with no
integrity error, because the per-event `h` hash field is never verified
against content anywhere in `src/` (`F7`, medium). `RT-06` escalates this to
a real bypass: fabricating an entire missing Assignment (two files + one
directory) does get `critique-proposals` to dispatch for real — but only
with that filesystem write access, which is a materially different threat
model from anything reachable via `fgos coordination run`. **Authority
against a CLI-reachable adversary holds; authority against an adversary with
`.fgos/` filesystem write access does not, and the ledger's own apparent
integrity field provides none.**

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

Event count before/after the refused attempt: unchanged at 15 — the refusal
wrote nothing. Then (`req-attack-visibility-03-complete-trio-and-reveal.json`):
dispatch the missing third shaper and, in the same call, re-issue the
identical critique authorization — it now succeeds (`appended: true`). Both
directions independently reproduced by Review, byte-for-byte including the
event count. `RT-07` separately confirmed `show`/`chain` carry no artifact
content (no `agentClaim`, no summary, no report text, no stdout) at any
point before the reveal — content-level leakage is genuinely blocked.

**Correction (Red-Team, `F8`/`RT-08`, BYPASSED):** all of the above tests the
*context-grant* layer — what the engine puts in a prompt or a `show`
payload. It does not test the *process* layer. Red-Team bound the third
Phase-5 shaper to a curious executor that, during its own legitimate
dispatch, read all 12 sibling `agent-report.md` files present in the
workspace off the filesystem directly — including the two shapers that
settled before it in its own session, and assignments belonging to entirely
different sessions. Every executor subprocess runs with `cwd` = the whole
workspace, and assignment directories are not filesystem-isolated from each
other or from the executors dispatched into them. **"Independent work,
controlled reveal" governs what the engine hands an executor in its prompt,
not what that executor's own process is able to read** — the original
report tested only the former and stated the conclusion as if it covered
the latter.

## Area 3 — Aggregation (real CLI, real `aggregateBounds`, reaches `close-dialogue`)

Session `aap_p051_main` (the same session used for Areas 4/5/6 below — one
coherent real panel run) opened with `aggregateBounds: {maxRounds: 20,
maxAssignments: 30}` declared at open (`requests/req-01-framing-shaping.json`)
— the exact fix P04.2 had to apply after finding the platform's default
`maxRounds: 10` cap made this protocol's own mandatory pre-dialogue path
unreachable to `close-dialogue`. This session runs 14 real CLI-dispatched
operations plus a real crash/resume (Area 6) and reaches:

```
$ fgos coordination run --file req-12-close-dialogue.json
... "closed": true, "status": "completed"
```

`responses/out-13-show-final.json`: `status: "completed"`, `quorum.missing:
[]`, `assignmentRefs` length 13. **Independent Review corroboration, not in
the original report:** Review reproduced this exactly, then separately
proved necessity by stripping `aggregateBounds` from an otherwise-identical
chain in a fourth sandbox — it dies at round 10 (`createSessionAssignment:
... at or above the declared aggregateBounds.maxRounds cap of 10`),
permanently `active`, `lead-advisor-actor` forever missing (`close-dialogue`
is its only remaining gating binding and is exactly what the cap blocks). So
`{maxRounds: 20, maxAssignments: 30}` was genuinely load-bearing, not
decoration.

**Correction 1 (informational, Red-Team `RT-09`, no defect):** the real
minimum `maxRounds` for this full flow including one reopen is **12**, not
the `20` this cell used. `maxRounds: 12` completes; `11` fails exactly at
`close-dialogue`; `13` also completes at 12 — no fencepost error either
side. `20` remains a safe, generous value; this is a more precise fact for
anyone tuning the protocol later, not a correction to this cell's own work.

**Correction 2 (Red-Team, `F6`/`RT-10`, BYPASSED, high — filed as `tsk-1zk`):**
the narrow claim above ("declared once at open, reaches close-dialogue")
holds. A broader, adjacent claim this report implied — that `aggregateBounds`
is a real, live control surface — does not: declaring **different**
`aggregateBounds` on a *resumed* request is silently discarded in both
directions, exit 0, no warning. Tightening a healthy session's bounds mid-run
does nothing and a dispatch proceeds past the newly-declared cap anyway.
Raising an under-budgeted session's cap (the exact rescue an operator would
reach for after hitting the `maxRounds: 11` wedge above) also does nothing —
that session stays permanently `active` with no CLI door to recover it. This
is the mirror image of the already-known `actors[]` non-persistence gap
(`tsk-3bf`, P04.2): one silently un-confines on resume, the other silently
refuses to re-confine, and neither says so.

## Area 4 — Routing (heterogeneous dispatch, real RunResult provenance)

Same session, Call 1 (`req-01-framing-shaping.json`) declares an `actors[]`
override: `system-shaper-actor -> exec-family-a`,
`alternative-shaper-actor -> exec-family-b` — two distinct REGISTERED
executors. CLI step-result excerpt (`responses/out-01-framing-shaping.json`):

| step | executor | provider | tier |
|---|---|---|---|
| shapeSystem | `exec-family-a` | `family-a` | `analytical` |
| shapeAlt | `exec-family-b` | `family-b` | `analytical` |

Real `RunResult.policy.provenance`, now committed at
`run-results/asgn_aap_driver_op_004-system-shaper-exec-family-a-run01-result.json`
and `run-results/asgn_aap_driver_op_005-alternative-shaper-exec-family-b-run01-result.json`
(added after `P051-R-03` — the original submission cited these from
uncommitted working notes, a real evidence-completeness gap; Review
independently reproduced the identical values byte-for-byte before these
were committed):

- system-shaper: `executor: exec-family-a`, `provider: family-a`, `model: model-a-analytical` (source `runnerConfig: family-a.analytical`), `tier: analytical` (source `operation: shape-system-proposal`).
- alternative-shaper: `executor: exec-family-b`, `provider: family-b`, `model: model-b-analytical` (source `runnerConfig: family-b.analytical`), `tier: analytical`.

Two genuinely distinct executor/provider/model bindings, each resolved
through the real CLI, each RunResult's own provenance matching exactly what
the request asked for, **in this specific, non-adversarial run.**

**Correction (Red-Team, `F1`/`RT-11`, BYPASSED, high — filed as `tsk-63z`):
the original "each RunResult's own provenance matches exactly what the
request asked for" is false as a general property of this protocol; it only
describes this one run, which had no adversary present.** Red-Team let an
assignment's dispatch fail (an unregistered executor), planted a
hand-written `runs/01/result.json` claiming a completely different
executor/provider/tier, then re-issued the identical step explicitly binding
`exec-family-a`. The CLI returned exit 0 reporting the *fabricated*
executor/provider/tier — **zero real executors ran**. Root cause:
`createAndExecuteSessionTask`'s self-heal path (`findLatestRunResult`,
`session-engine.mjs:262`) `JSON.parse`s `runs/<n>/result.json` off disk with
no authenticity, signature, or shape validation and links it as a genuine
outcome. This is not a theoretical trust boundary: `F8`/`RT-08` (Area 2)
demonstrates live that every executor subprocess the panel itself dispatches
can already read and write any assignment directory, including ones that
are not its own — so the least-trusted actor in the system (a dispatched
executor) can fabricate another role's provenance and have the coordination
layer report it as real.

**Secondary correction (Review, `P051-R-06`, low):** only 3 of the main
chain's 14 dispatched operations were routed through a declared per-role
binding; the other 11 ran on the global default executor because 8 of the
11 main-chain requests omit `actors[]` (a resumed request's `run.mjs` reads
`actors[]` from the current request only, never the session manifest — the
same mechanism behind `tsk-3bf`). Harmless in this sandbox (the default is
itself a local fake), but the heterogeneous-routing claim covers only the 3
explicitly-bound dispatches, not the whole chain, and against real providers
an unrepeated `actors[]` on a later call would silently route to the
unconfined default rather than the originally-opened roster.

## Area 5 — Bounds (dialogue-reopen cap, real CLI)

Same session. Real human turn recorded
(`req-09-human-turn-and-reopen1.json`, `human/1-person.md` — see the Honesty
note below), then `revise-synthesis` authorized and dispatched twice
(`req-09-...json` call 1, `req-10-reopen2.json` call 2) — both succeed
(`appended: true`, each producing a genuinely NEW Assignment:
`asgn_aap_driver_op_012`, then `asgn_aap_driver_op_013`). A third attempt
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

Event count unchanged (47 before and after) — the refused 3rd reopen wrote
nothing. **Independent corroboration:** Review's own separately-built
session reached the identical 47-event count before and after its own 3rd
attempt — strong evidence the main session was a genuine, unedited run of
this exact sequence. Red-Team additionally raced two OS processes for the
same last invocation slot across 10 fresh sessions (`RT-12`): exactly one
admitted every time, winner alternating 4/6 between the two processes
(genuinely racing, not serializing by accident), zero double-admits. **The
numeric cap holds, including under real concurrency.**

**Correction (Red-Team, `F5`/`RT-18`, BYPASSED, high — filed as `tsk-3ru`):
this cell only tested the cap, not the precondition, and the two are not the
same guarantee.** The protocol's own YAML header describes
`revise-synthesis`/`revise-explanation` as "the bounded, driver-authorized
CAPABILITY a driver may spend **once a human turn has been recorded and
read**." Red-Team authorized and dispatched `revise-synthesis` in a
session's second call with **zero** `human-turn-recorded` events and **zero**
`synthesize-recommendation` events — skipping the entire graph, including
Phase 5 shaping, Phase 6 critique, and the very synthesis the operation
claims to "revise." Cause: these bindings deliberately declare no
`contextAccess.visibilityWindowRef` (the YAML documents this choice, for
quorum reasons), and graph `transitions` are not themselves a dispatch gate
— node ordering in this engine is enforced only through visibility windows.
So `activation.maxInvocations: 2` is kernel-enforced; "only after a human
turn" is prose the driver is trusted to respect, not something the kernel
checks. **"Bounds" as this report originally used the term conflated a real
cap with a fictional precondition; this cell proved only the former.**

## Area 6 — Replay / crash / fresh-process resume (the centerpiece)

Full narrative and every command/output: `crash-state-snapshot.md` (which
itself now carries two corrections from independent Review/Red-Team — see
below). Summary of what was actually run:

1. Same session driven, via 4 separate real CLI calls, through framing,
   Phase-5 fan-out (heterogeneous), Phase 6 (critique + assess-constraints),
   and authorization of `synthesize-recommendation` (Assignment
   `asgn_aap_driver_op_009`) — well past the Phase-5 fan-out, with synthesis
   itself authorized.
2. `executors/run-crash-proof.mjs` (now committed — see Files below; the
   original submission referenced this script but never committed it,
   `P051-R-03`) spawned a genuinely separate `node bin/fgos.mjs coordination
   run --file req-04-dispatch-synth-slow.json` child process (real PID
   `3730502`) dispatching that same synthesis Assignment through a
   deliberately slow fake executor (`exec-slow.mjs`) that writes a real
   `exec-slow-started.marker` file immediately, then sleeps 25s before ever
   settling. The driver polled for that marker (real proof the executor
   subprocess was genuinely mid-flight — its own PID `3730516` recorded in
   the marker), then sent a real `SIGKILL` to PID `3730502`.
3. Confirmed dead by an independent, separate mechanism from the `exit`
   event: a `kill -0` ESRCH probe, and (as a second independent check)
   `ps -p <pid>` for all three PIDs involved — all three confirmed gone.
   **Correction (Review, `P051-R-02`, medium):** `crash-state-snapshot.md`
   originally presented this `ps` confirmation as verbatim terminal output
   including lines like `3730502_GONE_CONFIRMED`; real `ps` cannot produce
   that string — it comes from this session's own `|| echo` shell fallback,
   which the original write-up silently dropped. The underlying fact (all
   three PIDs genuinely dead) is true and was independently reproduced by
   both reviewers via their own separate `kill -9` runs; the transcript has
   been corrected in `crash-state-snapshot.md` to show the real command
   (including the fallback) and label which part is real `ps` output versus
   this session's own echo. The executor subprocess is spawned `detached:
   true` as its own process-group leader, so it survived the parent's
   SIGKILL as a real orphan and had to be reaped explicitly — confirmed
   independently by both reviewers as well.
4. From a genuinely fresh, separate process, the session correctly reports
   the interrupted actor as `late` (distinct from `completed`/`missing`) and
   the on-disk Assignment shows a `run.json` frozen at `"status": "running"`
   forever, with no result file. **This diagnosis half of the claim holds**
   — confirmed independently by both Review and Red-Team.
5. Re-dispatching the identical operation through the CLI from the fresh
   process was refused by a stale `dispatch.claim` exclusive-lock file the
   killed process created and never got to remove. `session-engine.mjs`'s
   own doc comment confirms this is deliberate, documented fail-closed
   behavior, not a regression. Originally filed as `tsk-47l`.
6. After removing the stale claim, the identical resume request succeeded
   from the fresh process, producing a genuinely new run attempt (`runs/02`)
   under the same Assignment id — `runs/01` preserved on disk, untouched.

**Correction — steps 5-6 as originally reported understated the real
severity, and this is the most significant correction in this rewrite.**
Both independent Review (`P051-R-01`) and Red-Team (`F2`/`RT-14`/`RT-15`,
plus two new failure modes `F3`/`RT-16` and `F4`/`RT-17`) found that:

- **The clean resume in step 6 was a timing accident, not the general
  case.** More than this sandbox's own `runner.timeoutMs` (60000ms) had
  elapsed between the kill and the resume, which is why a *second*,
  undisclosed lock (`src/runner/dispatch/cli.mjs:467-474`'s per-cwd dispatch
  lock, `releaseOnExit: true`, TTL = `runner.timeoutMs`) was already clear.
  SIGKILL defeats `releaseOnExit` here exactly as it defeats
  `dispatch.claim` cleanup. **This repo's own real `.fgos/config.json` sets
  `runner.timeoutMs` to `2100000` (35 minutes).** Both reviewers
  independently reproduced what happens when the documented workaround
  (`rm dispatch.claim`; resume) is attempted *inside* that window, which is
  exactly when an operator following `tsk-47l`'s original verify recipe
  ("confirm dead, then re-run") would naturally attempt it: the resume
  returns exit 1, and the engine **links a real `RunResult{status:
  "failed"}`** for the transient lock contention as if it were the
  Assignment's genuine outcome — permanently flipping the actor from `late`
  (recoverable) to `quorum.failed` (not recoverable through any CLI door;
  `priorLink` short-circuits every later attempt to the same cached failure
  forever). Filed into the amended `tsk-47l`.
- **The originally-proposed fix is not implementable as stated.** `tsk-47l`
  originally proposed detecting "a claim whose owning process is verifiably
  dead." Red-Team (`RT-14`) found `dispatch.claim` is a **zero-byte file**
  recording no PID, host, or timestamp anywhere, and no sibling file records
  one either — this cell's own step-3 "OS-level confirmation" was only
  possible because the crash-driver harness happened to write PIDs to an
  out-of-band marker file. A real incident responder has no such artifact
  and no way to answer "is the owner dead." `tsk-47l` has been amended to
  require owner-identity recording as a prerequisite to any reconciliation
  fix.
- **A crash during event-log append is worse than the disclosed gap, not
  merely a variant of it.** Red-Team (`F3`/`RT-16`) simulated a SIGKILL
  landing mid-`appendEventLocked` (a truncated final JSONL line) and found
  **both** `show` and `run` exit 5, undiagnosable — unlike the stale-claim
  case, where `show` still works and the state is at least readable.
  `events.mjs` already has a `repair()` for exactly this shape, but no
  `fgos coordination` sub-verb exposes it.
- **A fabricated result bypasses the stale claim entirely.** Red-Team
  (`F4`/`RT-17`) found `findLatestRunResult` is consulted *before* the
  `dispatch.claim` check, so planting a fabricated `result.json` into the
  crashed run directory — the shortcut a stuck operator with filesystem
  access might plausibly reach for — works: exit 0, the fabrication is
  linked, and `show` reports the actor as legitimately `completed`. Same
  root cause as `F1` (Area 4); explicitly the wrong "fix" for `tsk-47l`.

**Corrected claim assessment: diagnosis holds — a fresh process can always
correctly read a crashed session's true state via `show` alone. Recovery
does not hold as originally characterized** — the documented workaround is
safe only outside a lock-TTL window this cell never identified (35 minutes
in this repo's real config), is not verifiable as safe from anything a real
crash leaves on disk, and two additional crash-adjacent failure modes exist
that are worse than the one originally disclosed. `tsk-47l` has been amended
in place (`fgos show tsk-47l`) to carry all of this rather than being
superseded by a new item, since it is the same underlying capability gap
(no CLI-level reconciliation door for any of the three failure modes).

## Honesty note on the human turn used for Area 5

Per phase-05's own Live Proof Boundary ("A scripted fake-human transcript
cannot prove the Decision Dialogue"), the human turn used here
(`human/1-person.md`) is explicitly **not** offered as proof of the real
Decision Dialogue with an actual third-party person — that is P05.2's own
scope. It exists solely to exercise the `human-turn` request-step type and
the bounded-reopen numeric cap (Area 5) through the real CLI, and is
labelled as such in the file itself. Independent Red-Team's `F5`/`RT-18`
finding above shows this operation does not, in fact, require any human turn
to exist at all — reinforcing that this proof never established the
sequencing guarantee its own framing implied.

## Tests

- Focused suite (`focused-suite-run.log`):
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
  — **757/757 pass**, exact match with the track's own recorded baseline (no
  source touched, no change expected or found). Independently reproduced by
  Review (757/757) and re-run again after this rewrite (see below).
- Skill-projection suite (`skill-wrappers-suite-run.log`):
  `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
  — **39/39 pass**. Independently reproduced by Review (39/39).
- Full suite (`full-test-run.log`):
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test` — **5695 tests, 5685 pass, 4
  fail, 6 skipped**. The 4 failures are exactly the track's own recorded
  4-item baseline by name. **Zero new failures.** Review's own independent
  full run additionally corroborates that baseline item 4 (the live-executor
  flake) is environment-only, not a regression: it passed cleanly in
  Review's run while failing in this cell's run, with baseline items 1-3
  failing identically in both.
- `detect_changes`: not run in either the original submission or this
  rewrite — no real source file was touched by this cell (confirmed by
  `git show <commit> --stat --name-only`, filtered for non-`docs/` paths,
  returning nothing, independently re-checked by Review). All findings
  above were produced by Review/Red-Team's own investigation, not by any
  change this cell made to `src/`.

None of the findings above are visible to any existing test suite (Review
and Red-Team both note this explicitly) — every finding is a property no
current test asserts, which is exactly why this cell's own adversarial
re-pass mattered.

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
  (`run-crash-proof.mjs` — **now actually committed**; the original
  submission's Files section claimed this existed here when it did not,
  `P051-R-03` — corrected), and the exact `runner-config.json` used.
- `run-results/` — **new, added per `P051-R-03`**: the real, committed
  `result.json` RunResult artifacts for the two heterogeneous-routing
  dispatches (Area 4), plus the crash/resume lineage for
  `asgn_aap_driver_op_009` (the interrupted `run01` — frozen `run.json`, no
  `result.json`, proving the crash — and the resumed `run02/result.json`
  the engine actually linked).
- `crash-proof-log.txt` — the crash driver's own timestamped log (spawn,
  marker-wait, kill, dead-confirmation, orphan-reap).
- `crash-state-snapshot.md` — full narrative + command/output for Area 6,
  corrected per `P051-R-02` (the `ps` transcript is no longer presented as
  verbatim where it was reconstructed) and extended with a new §6 covering
  the `tsk-47l` amendment.
- `focused-suite-run.log`, `skill-wrappers-suite-run.log`,
  `full-test-run.log` — the three required test runs from the original
  submission.
- `reviewer-report.md`, `reviewer-findings.json`, `redteam-report.md`,
  `redteam-findings.json` — the independent Review and Red-Team's own full
  output, authoritative for every finding cited in this rewrite.

## Real gaps filed

- `tsk-47l` (amended) — a SIGKILL'd coordination dispatch has no
  owner-identity recording anywhere on disk, no CLI reconciliation door for
  any of three distinct failure modes (stale `dispatch.claim`; the
  undisclosed second per-cwd dispatch lock, which can permanently poison an
  assignment if reconciled inside its TTL; and event-log-append corruption,
  which makes the session fully unreadable). Not fixed in this cell —
  disclosure only, per this cell's own scope.
- `tsk-63z` — `findLatestRunResult` trusts an unauthenticated `result.json`
  off disk as genuine dispatch provenance, and executor subprocesses can
  already read/write any assignment's directory — together, the least
  trusted actor in the system can fabricate another role's provenance.
  Breaks Area 4's routing-provenance claim as originally stated.
- `tsk-3ru` — `revise-synthesis`/`revise-explanation`'s documented
  precondition ("only after a human turn is recorded") is prose-only, not
  kernel-enforced; only the numeric `maxInvocations` cap is real. Breaks
  Area 5's implied sequencing guarantee.
- `tsk-1zk` — `aggregateBounds` declared on a resumed request is silently
  discarded in both directions, with no warning; an under-budgeted session
  becomes permanently wedged with no CLI recovery door.

## Unresolved questions

- `tsk-47l`'s eventual fix needs owner identity (PID/host/start-time) added
  to `dispatch.claim` before "detect a dead owner" can mean anything, per
  Red-Team's `RT-14`; whether the right fix is a new reconciliation verb, an
  extension to `show`/`run`, or exposing the engine's existing
  `retrySessionTask` is a real design choice for whoever picks up that item.
- `tsk-3ru`: whether the reopen precondition should be closed in the graph
  (gate the reopen bindings on a window a human turn opens) or accepted and
  documented as a driver-discipline-only guarantee is a design decision
  Red-Team explicitly defers to P05.2, which exercises the real Decision
  Dialogue.
- `tsk-63z`/`F8`: whether cross-assignment filesystem access for executor
  subprocesses is inside this project's accepted trust perimeter (executors
  are already trusted subprocesses) or a boundary that needs closing is a
  design call Red-Team also does not presume settled — but either way, the
  Area 4 provenance claim's wording needs to stop presenting reported
  provenance as proof of what was dispatched.

Status: DONE
Summary: Rewritten per independent Review and Red-Team. Original submission
overclaimed "all 6 areas proven" — corrected: Authority and Aggregation hold
for their literal, narrow claims (with adjacent properties — ledger
integrity, resumed-request bounds — that do not, filed as `tsk-1zk`);
Visibility holds at the context-grant layer but not the process layer
(`F8`); Routing (`tsk-63z`), Bounds' sequencing precondition (`tsk-3ru`), and
Replay/crash-resume's full recovery story (`tsk-47l`, amended) each have a
real, independently reproduced bypass or gap beyond what the original report
disclosed. This is the successful outcome for a hard-conformance proof cell
per phase-05's own framing — a corrected, evidence-backed record, not a
patched-over one. Focused suite 757/757 (re-confirmed after this rewrite,
see below), skill-projection 39/39, full suite at the track's exact 4-item
baseline. No source file touched by this cell at any point; every finding
above is Review/Red-Team's own live investigation.
Concerns/Blockers: None blocking closure of P05.1 itself — the corrected
record IS this cell's deliverable. `tsk-47l`/`tsk-63z`/`tsk-3ru`/`tsk-1zk`
are real follow-on work items, tracked separately, not gating this cell's
own close per this track's established file-don't-fix pattern for proof
cells.
