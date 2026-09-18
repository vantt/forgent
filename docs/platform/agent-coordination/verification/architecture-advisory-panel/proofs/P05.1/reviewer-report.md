# P05.1 reviewer-report — independent re-verification of the hard conformance and recovery proof

Reviewer: `p05-1-reviewer`, 2026-09-06. Branch `group-thinking-plan-loop`,
HEAD `9416298d`. This review was written without reading the Doer's report
first for Areas 1-6 conclusions; every claim below was re-executed in my own
throwaway sandboxes and is reported from my own output.

## Method

Three isolated sandboxes under the session scratchpad, each a fresh
`fgos init` with `proofs/P05.1/executors/runner-config.json` installed as
`.fgos/config.json` and the four fake executor scripts copied in. Every
command was a real `node /home/vantt/projects/forgentX/bin/fgos.mjs
coordination run|show` OS subprocess run from the sandbox cwd — never an
internal engine call.

- `rev-p051` — authority and visibility attacks.
- `rev-p051-main` — main chain plus my own independent `kill -9` crash proof.
- `rev-p051-clean` — uncrashed main chain, for bounds and close-dialogue.
- `rev-p051-nobounds` — the same chain with `aggregateBounds` stripped, to
  test whether the Doer's bounds declaration was genuinely necessary.

I did not touch the Doer's committed session state. No source file was
modified by this review.

## Verdict per area

All six areas hold. Five reproduce exactly. Area 6 holds as far as the
Doer took it, but my reproduction found a second failure mode the cell did
not discover, described in full below and filed as `P051-R-01`.

### Area 1 — Authority: HOLDS, reproduced exactly

**Attack 1 (driver impersonates a human decision).** My run:

```
$ node bin/fgos.mjs coordination run --file requests/req-attack-authority-01-driver-impersonates-human.json
fgos: coordination request: steps[1].attributedTo.type must be "person"
exit=4
```

Byte-identical to the Doer's cited message. I confirmed the refusal layer
independently: after the call, `ls .fgos/coordination/sessions/` listed only
`aap_p051_smoke` — `aap_p051_authority_attack1` was never created. The
legal `interpret-request` step riding in the same request also never ran.
This is whole-request schema validation before any dispatch, exactly as
claimed, and it is the stronger of the two possible guarantees.

**Attack 2 (unauthorized dispatch of a driver-authorized operation).** After
running the setup that legitimately opens `post-shaping-open`:

```
$ node bin/fgos.mjs coordination run --file requests/req-attack-authority-02-unauthorized-dispatch.json
fgos: dispatchDeclaredOperation: operation "critique-proposals" at node "phase-critique"
for actor "architecture-critic-actor" declares activation.mode "driver-authorized", and no
unconsumed "operation-authorized" event in session "aap_p051_authority_attack2" authorizes
that exact binding -- refusing to materialize an Assignment
exit=4
```

Refused at the authorization layer, as claimed — distinct from Attack 1's
schema layer. I verified the refusal wrote nothing by diffing the session
event log before and after: 15 events before, 15 after, files byte-identical,
and zero occurrences of `critique-proposals` in the log. The setup correctly
isolates the attack to "was this ever authorized" rather than "is the window
open", which is the right experimental design.

### Area 2 — Visibility: HOLDS both directions, reproduced exactly

Premature reveal with 2 of 3 shapers settled:

```
fgos: authorizeDeclaredOperation: operation "critique-proposals" at node "phase-critique"
for actor "architecture-critic-actor" requires visibility window "post-shaping-open" to be
open before any context may be granted, and it is not open yet -- refusing to authorize
exit=4
```

Event log 15 before, 15 after, byte-identical — the refusal wrote nothing.
Then the same authorization, re-issued in the same call that dispatches the
missing third shaper, succeeded: exit 0, `authCritiqueLate -> authorize
true`, and a real `operation-authorized` event with
`authorizationId: auth_critique_late` in the log. So the gate is genuine
fan-out gating, not a permanent block. This is the claim that matters and
it is properly proven.

One incidental observation, filed as `P051-R-05`: this authorization
succeeded in my sandbox while citing `grantedContextRefs`
`asgn_aap_driver_op_016`/`017`, which do not exist there — the refs are not
validated against real Assignments. The visibility gate keys off actual
quorum completion, so Area 2's conclusion is unaffected.

### Area 3 — Aggregation: HOLDS, and I confirmed the bounds were necessary

My clean chain reached, through the real CLI:

```
$ node bin/fgos.mjs coordination run --file requests/req-12-close-dialogue.json
closed: true  status: completed
```

I did not take the status claim on trust. The real event log for the session
contains exactly one `session-completed` event alongside 13
`assignment-created` and 13 `result-linked` events, and a fresh
`coordination show` reports `status: completed`, `quorum.missing: []`,
`quorum.failed: []`, `assignmentRefs` length 13 — matching the Doer's
committed `out-13-show-final.json` (which I also parsed directly: same
values).

On necessity, I ran the identical chain in a fourth sandbox with
`aggregateBounds` deleted from the opening request. It dies partway:

```
req-09-human-turn-and-reopen1  exit=4 :: fgos: createSessionAssignment: session
"aap_nobounds" has already used 10 round(s) session-wide, at or above the declared
aggregateBounds.maxRounds cap of 10 -- refusing to create a new Assignment for a new round
req-10-reopen2                exit=4 :: (same)
req-12-close-dialogue         exit=4 :: (same)
```

Final state: `status: active`, `quorum.missing: lead-advisor-actor` — the
session can never complete, because `close-dialogue` is the only route to
lead-advisor quorum and it is exactly what the cap blocks. So
`{maxRounds: 20, maxAssignments: 30}` was genuinely load-bearing, not
decoration, and the Doer's reference to P04.2's finding is accurate.

### Area 4 — Routing: HOLDS, verified against real RunResult provenance

I read the actual `result.json` provenance blocks from my own re-run rather
than the Doer's summary. For the two roles the request binds explicitly:

| role | executor | provider | model (source) | tier (source) |
|---|---|---|---|---|
| system-shaper | `exec-family-a` (source `cli`) | `family-a` (source `registeredExecutor`) | `model-a-analytical` (`runnerConfig: family-a.analytical`) | `analytical` (`operation: shape-system-proposal`) |
| alternative-shaper | `exec-family-b` (source `cli`) | `family-b` (source `registeredExecutor`) | `model-b-analytical` (`runnerConfig: family-b.analytical`) | `analytical` (`operation: shape-alternative-proposal`) |

Every field matches the Doer's report exactly, including the provenance
`source` scopes. Two genuinely distinct executor/provider/model families,
each resolved through the real CLI, each matching what the request asked
for, with the tier floor coming from the operation's own declared minimum
rather than the request. The claim is true.

Two qualifications, neither of which changes that verdict. First, the
RunResult files themselves are not in the evidence tree — the report quotes
them from working notes that were not committed (`P051-R-03`); I could only
confirm the values because I regenerated them. Second, the confined slice is
narrower than the write-up implies: only 3 of the main chain's 14 dispatched
operations run on a declared per-role binding, because 8 of 11 main-chain
requests omit `actors[]` and fall back to the global default
(`P051-R-06`). Harmless here, materially risky for P05.2 against real
providers.

### Area 5 — Bounds: HOLDS, reproduced exactly including the event count

Two legitimate reopens succeeded, each producing a distinct new Assignment.
The third:

```
fgos: authorizeOperation: binding (node "phase-dialogue-reopen", operation "revise-synthesis",
actor "synthesizer-actor") in session "aap_p051_main" already has 2 "operation-authorized"
event(s), at or above its declared activation.maxInvocations cap of 2 -- refusing to
authorize another invocation
exit=4
```

My independently-built session had **47 events before the refused attempt and
47 after**, byte-identical, with zero occurrences of `auth_revise_3` — the
same count the Doer reports. Reaching the identical event count from a
separately constructed session is strong corroboration that their main
session was a genuine, unedited run of exactly this sequence.

### Area 6 — Replay / crash / fresh-process resume: HOLDS as far as taken, but incomplete

The crash itself is real, not simulated. I reproduced it with my own driver
rather than trusting the log:

```
[15:33:11.697Z] spawned real child PID 3895508
[15:33:11.899Z] executor subprocess genuinely mid-flight, marker pid=3895521
[15:33:11.899Z] child PID 3895508 alive immediately before kill: true
[15:33:11.899Z] sending REAL SIGKILL to PID 3895508
[15:33:11.951Z] independent ESRCH probe confirms PID 3895508 dead: true
[15:33:11.951Z] node 'exit' event: {"code":null,"signal":"SIGKILL"}
[15:33:11.951Z] exec-slow-finished.marker exists: false
[15:33:11.988Z] ps -p 3895508 raw output: ""  (empty string == genuinely gone)
[15:33:11.998Z] orphaned detached executor PIDs after parent kill: "3895521\n3895530"
```

The resulting on-disk state is identical to the Doer's snapshot: the
Assignment holds `assignment.json`, `dispatch.claim`, and
`runs/01/{run.json,dispatch-plan.json}` with no `result.json`, and
`run.json` is frozen at `"status": "running"` forever. A genuinely fresh
`coordination show` process correctly classifies the interrupted actor as
`late`, distinct from the two never-reached actors in `missing` and the five
in `completed`. That diagnosis half of the claim is fully sound.

The first resume attempt is refused by the stale `dispatch.claim`, with the
exact message the Doer reports. I confirmed the Doer's characterization of
this as deliberate rather than a regression by reading the source:
`session-engine.mjs:341-370` documents the claim as intentionally never
removed on success, and states plainly that "a crashed in-flight dispatch
still needs manual reconciliation, not silent auto-retry -- fail closed." I
also confirmed there is genuinely no CLI door for it: `fgos coordination`
exposes only `run|show|launch-master-loop|chain`, and `fgos unlock` targets
the default main-checkout lock, not this file. So `tsk-47l`'s core
characterization is correct: a disclosed, deliberate fail-closed behavior,
and a real gap in the "resume via CLI doors alone" claim.

**Where my reproduction diverges from the Doer's, and why it matters.** The
Doer's step 6 says that after removing the stale claim, "the identical resume
request succeeded." Mine did not. It failed — and failed destructively.

Removing `dispatch.claim` and re-running 58 seconds after the kill produced
`exit=1` and a `runs/02/result.json` with `"status": "failed"` whose
`agentClaim.summary` reads `dispatch for cwd "..." is already in flight (held
for 58s)`. That is a **second** lock: `src/runner/dispatch/cli.mjs:467-474`
acquires a per-cwd dispatch lock with `releaseOnExit: true` and
`ttlMs: timeoutMs`. SIGKILL prevents `releaseOnExit` from ever firing, so
this lock also survives the crash — and unlike `dispatch.claim` it is
invisible in the Assignment directory.

The damage is that the engine treated that transient infrastructure refusal
as the Assignment's real outcome: it wrote the failed result and **linked**
it (`result-linked` → `run_asgn_aap_driver_op_008_02`). The synthesizer moved
from `late` to `failed`. A third attempt at 108 seconds, with the TTL long
lapsed, still exits 1 and creates no `runs/03` — it short-circuits at the
`priorLink` check (`session-engine.mjs:377-381`) and returns the failed
result as `resumed: true`, permanently. The engine's own retry primitive
`retrySessionTask` exists but no CLI door reaches it: the request schema
accepts only `operation`/`authorize`/`contribution`/`human-turn`.

A workaround does exist, and I verified it: a fresh `authorize` with a new
`authorizationId`/`invocationKey` creates a new Assignment, dispatches
cleanly, and recovers quorum to `failed: []`. But it burns an invocation, so
for the two bindings that declare `maxInvocations: 2` — `revise-synthesis`
and `revise-explanation` — a crash during the second invocation is
unrecoverable through CLI doors.

Why the Doer did not hit this: the proof sandbox's `runner.timeoutMs` is
60000, and they let more than 60 seconds pass between the kill and the
resume, so the TTL had lapsed. **This repo's own `.fgos/config.json` sets
`runner.timeoutMs` to 2100000 — 35 minutes.** In production the hazard
window is 35 minutes wide, and `tsk-47l`'s own verify recipe instructs the
fixer to confirm the process is dead and then re-run promptly, which lands
inside it.

So my answer to the question the review brief poses: the Doer's
characterization is correct as far as it goes — `tsk-47l` is a genuine,
disclosed, deliberate fail-closed behavior and not a regression — but it does
**not** fully cover the Area 6 claim. The "resume using only the CLI doors"
promise is not merely incomplete for this failure mode; following the
documented workaround at the wrong moment actively destroys recoverable
state. That is a real finding the cell did not surface, and it is the one
thing I would not close Area 6 on. Full detail and recommendations in
`P051-R-01`.

One more operational hazard worth carrying into the fix: SIGKILL of the CLI
does **not** kill the executor. It is spawned detached as its own
process-group leader, and I confirmed orphans 3895521 and 3895530 still alive
after the parent died. Any future auto-reconciliation that clears a claim
based on the CLI PID alone will re-introduce exactly the double-dispatch race
`dispatch.claim` exists to prevent.

## Evidence-tree completeness

Phase-05 line 20 requires "requests, events, replay, RunResults, routing
provenance, attacks, and outcomes" stored under `proofs/P05.1/`. Present and
genuine: 18 request files, 39 response files (counts match the report
exactly), three session event logs, the crash log and snapshot, the outcome
`show`, and all three test logs. Absent: any RunResult `result.json`
artifact, and `run-crash-proof.mjs` — which `doer-report.md`'s Files section
lists as shipped, but which exists nowhere in the repo (`git log --all` for
that path returns nothing). The Area 6 centerpiece is therefore not
re-runnable from the committed tree. Filed as `P051-R-03`.

Separately, `crash-state-snapshot.md` opens by asserting its contents are
"copied verbatim from the real terminal session ... not reconstructed
afterward", but section 1 shows `ps -p <pid> -o pid,stat,cmd` producing a
line `3730502_GONE_CONFIRMED`. Real `ps` cannot produce that: I ran it
against the same dead PID and it prints only the `    PID STAT CMD` header
and exits 1. The fact is true and I confirmed it by the same two independent
mechanisms; the transcript is synthesized. Filed as `P051-R-02`.

## Test runs (my own)

Focused suite, my run:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' \
    'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
ℹ tests 757   ℹ pass 757   ℹ fail 0   exit=0
```

Skill projection, my run:

```
$ node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs
ℹ tests 39   ℹ pass 39   ℹ fail 0
```

Full suite, my run:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test
ℹ tests 5695   ℹ pass 5686   ℹ fail 3   ℹ skipped 6
```

My three failures are baseline items 1-3 by name: the legacy durable-doing
ask/answer round-trip, the docs-index missing-quadrant tolerance, and
`coordination-example-requests-valid`. Baseline item 4, the live-executor
probe, **passed** in my run — which corroborates the track's
characterization of it as an external-service flake rather than a
regression. So my full run is at or better than the recorded baseline, with
zero new failures. This independently confirms the Doer's test claims.

## Source-touch check

`git show 9416298d --stat --name-only` filtered for non-`docs/` paths returns
nothing: every file in the commit is under
`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P05.1/`.
The "pure evidence-gathering cell, no source touched" claim is accurate, and
my own 757/757 focused run confirms no behavioral drift.

## Summary

This is a genuine, well-constructed proof. Five of six areas reproduce
exactly from a clean sandbox, including two event-count matches that would be
very hard to fake. The routing provenance is real and correct. The crash is
a real `kill -9` of a real process, and the Doer disclosed the
`dispatch.claim` gap honestly rather than smoothing it over — which is the
right instinct and is exactly what a live proof is for.

The gap is that the disclosure stopped one step short. There is a second
stale lock, and the documented recovery procedure is destructive inside its
TTL window — 35 minutes in this repo's real configuration. Area 6 should not
be closed on the current characterization until `tsk-47l` is widened.

## Unresolved questions

- Should a `dispatch-in-flight` refusal be persisted and linked as a real
  failed RunResult at all? My read is no — it is an infrastructure refusal,
  not an executor verdict — but that is a design call for whoever takes
  `tsk-47l`, not something this review should presume settled.
- `retrySessionTask` exists in the engine with no CLI door. Whether exposing
  it is the right fix, versus teaching `coordination run` to reconcile a
  verifiably-dead claim, is the same open design choice the Doer named; my
  reproduction only adds that whichever door is built must probe the
  executor's process group, not the CLI PID.
