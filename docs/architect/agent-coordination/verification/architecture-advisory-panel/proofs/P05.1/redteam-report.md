# P05.1 red-team report — independent adversarial pass on the hard conformance and recovery proof

Red team for cell P05.1 (`plans/260905-architecture-advisory-panel/phase-05-comparative-proof-and-promotion.md`).
Protocol under attack: `core.coordination-protocol.architecture-advisory-panel-v1`.
Machine-readable results: `redteam-findings.json` (18 attacks).

**Posture.** Every attack below was run live, as real OS processes, through the
real `fgos` CLI, in my own throwaway sandbox — never the Doer's sessions,
processes, or evidence. I re-derived each of the six claim areas myself rather
than checking the Doer's transcript. Where I reached the same conclusion, I say
so; where I reached a different one, the commands are in `redteam-findings.json`.

## Environment

- Repo commit under test: `9416298de37d87d0d0ba16b99d541b10ed947169` (branch `group-thinking-plan-loop`), package version `0.1.0`, node `v24.18.0`.
- Sandbox: a fresh `fgos init` temp directory outside the repo, wholly separate
  from both `forgentX/.fgos/` and the Doer's `WORK_DIR`. Fake executors are the
  Doer's own four scripts (reused deliberately, so any difference in result is
  not a fixture difference) plus three of mine: `exec-nosy` (reads siblings),
  `exec-rtslow` (30s), `exec-rtlog` (20s, logs its PID).
- No repo source file was read-modified. `git status` shows no modification
  outside this proofs directory. Sandbox and all spawned processes cleaned up.

## Scorecard

| # | Area | Verdict |
|---|---|---|
| RT-01..04 | Authority — 4 human-decision-slot variants | BLOCKED |
| RT-05 | Forged `operation-authorized` event | Capability BLOCKED / detection FAILED |
| RT-06 | Full ledger + manifest forgery | BYPASSED (needs `.fgos/` write) |
| RT-07 | `show`/`chain` content leak, pre-reveal | BLOCKED |
| RT-08 | Sibling shaper reads siblings' output | BYPASSED |
| RT-09 | `maxRounds` fencepost | BLOCKED (no off-by-one) |
| RT-10 | Bounds unrecoverable + silently discarded | BYPASSED |
| RT-11 | RunResult provenance spoofing | **BYPASSED (high)** |
| RT-12 | Concurrent reopen race, 10 trials | BLOCKED 10/10 |
| RT-13 | Independent `kill -9` repro of `tsk-47l` | Confirmed |
| RT-14 | `dispatch.claim` records no owner | UNEXPECTED |
| RT-15 | Documented workaround + live orphan | **BYPASSED (high)** |
| RT-16 | Crash mid-append → session unreadable | UNEXPECTED (high) |
| RT-17 | Fabricated result bypasses stale claim | **BYPASSED (high)** |
| RT-18 | Reopen spendable with no human turn | **BYPASSED (high)** |

## What genuinely holds

These are not courtesy notes; each was attacked and refused.

**Human-decision provenance is defended in depth (RT-01..04).** The Doer's
Attack 1 used `attributedTo.type: "driver"`, which dies at request-schema
validation — a real refusal, but a shallow one that never reaches the engine. I
pushed past it with four schema-legal payloads. All four were refused at the
store layer: driver naming itself, driver citing its own `asgn_*` ref as the
person, driver naming a declared panel actor, and a foreign `writerId` writing
into someone else's session. `recordHumanTurn`'s T1 guard block
(`store.mjs:1457-1475`) is genuinely load-bearing.

**Every gate is independently re-derived, so ledger tampering buys nothing on
its own (RT-05).** I appended a hand-crafted `operation-authorized` event for
`critique-proposals` into a session whose `post-shaping-open` window was
genuinely closed. `dispatchDeclaredOperation` refused anyway, recomputing the
window from scratch rather than trusting the authorization. That is real
defense in depth and the single strongest result in this pass.

**The manifest is a real second source (RT-06, stage 1).** Forged
`assignment-created` events were caught by a cross-check against
`session.json`'s `assignmentRefs` before any gate was consulted.

**The reopen cap holds under genuine concurrency (RT-12).** Ten trials, two
separate OS processes racing for the last slot under
`activation.maxInvocations: 2`. Exactly one admitted every time, winner
alternating between the two processes (4/6 split, so they really raced). No
double-admit. This matches the previously-verified TOCTOU work in this area.

**No fencepost anywhere in the round cap (RT-09).** I drove three complete
sessions end to end. `maxRounds: N` admits exactly N assignments and refuses the
N+1st. The real minimum for the full flow with one reopen is **12** — the Doer
used 20 and never probed the edge, so this is newly established. At 11 the flow
dies precisely at `close-dialogue`.

**`show` does not leak content (RT-07).** No `agentClaim`, no summary, no report
text, no stdout anywhere in the payload, at any point in the fan-out.

## Findings

### F1 (high) — RunResult provenance is read from an unauthenticated file, not from the dispatch that happened

Directly contradicts this cell's Area 4 claim that "each RunResult's own
provenance matches exactly what the request asked for".

I let an assignment be created with its dispatch failing (unregistered
executor), planted a hand-written `runs/01/result.json`, then re-issued the
identical step **explicitly binding `exec-family-a`**. The CLI returned exit 0
reporting `executor: exec-family-b, provider: family-b, tier: critical`. No
executor ran at all.

Root cause: `createAndExecuteSessionTask`'s self-heal path calls
`findLatestRunResult` (`session-engine.mjs:262`), which `JSON.parse`s
`runs/<n>/result.json` off disk with no authenticity, signature, or shape
validation, and `linkResult()`s it as a genuine outcome. The provenance the
coordination layer reports is therefore whatever that file says.

This is not theoretical. RT-08 demonstrates live that **every executor
subprocess runs with cwd = the workspace and can read and write every other
assignment's directory** — including across sessions. The Doer's own fixture
executors already walk `.fgos/assignments/*/runs/*` and write into all of them;
escalating from `agent-result.json` to `result.json` is a one-line change. A
panel member — the exact party the protocol's independence rules exist to
constrain — can settle another role's assignment with content and provenance it
authored.

### F2 (high) — the documented crash workaround can permanently poison an assignment (RT-14 + RT-15)

`tsk-47l` discloses the stale `dispatch.claim` and states the workaround: remove
it "after confirming the OS-level PID is dead". Two problems.

First, **nothing on disk names the owner**. `dispatch.claim` is a **zero-byte**
file (`fs.openSync(path,'wx')` then immediate `closeSync`). `run.json` records
`startedAt`/`cwd`/`timeoutMs`/`executorId` but no PID for the runner or the
executor; `grep -ril pid` across the whole assignment directory returns nothing.
The Doer could confirm death only because their crash-driver harness wrote PIDs
to an out-of-band marker file. A real incident leaves no such artifact, so the
Doer's step-3 "OS-level confirmation" is **not reproducible in production**, and
`tsk-47l`'s own proposed fix ("detect a claim whose owning process is verifiably
dead") is not implementable until the claim carries owner identity.

Second, doing the workaround anyway — which is what an operator who cannot check
will do — produces a worse outcome than the stale lock. I killed a dispatch,
left the detached orphan executor running, removed the claim, and resumed. A
second, cwd-level in-flight lock correctly prevented real double-execution
(genuine defense in depth, worth crediting). But that transient contention was
**not surfaced as a refusal**: it was captured as a real
`RunResult{status: "failed"}`, link-resulted into the event log, exit 0. The
synthesizer moved from `late` (recoverable, correctly diagnosed) to
`quorum.failed` permanently. Re-running the identical step afterwards, with
nothing else running, returns the cached failure via the `priorLink`
short-circuit — exit 0, no `runs/03`, forever. The assignment is unrecoverable
and the session can never reach quorum.

The orphan then wrote `agent-result.json`/`agent-report.md` into both `runs/01`
and the already-settled `runs/02`, so run 02's on-disk artifacts say `done`
while its linked `result.json` says `failed`.

**Correction, added at final recheck — I understated the exposure window.** My
sandbox ran with `runner.timeoutMs: 60000`, so the contending lock cleared in
seconds and I described the window as lasting only while the orphan runs. That
is wrong for this repo. The blocking lock is `src/runner/dispatch/cli.mjs:480`'s
per-cwd dispatch lock, acquired with `ttlMs: cfg.timeoutMs`, and this repo's own
`.fgos/config.json` sets `runner.timeoutMs: 2100000` — **35 minutes**. Worse,
`cli.mjs` builds a *string* identity (`${pid}:${Date.now()}:${random}`), which
in `main-checkout-lock.mjs`'s `tryAcquireOnce` takes the branch judged by
`ttlMs` freshness **alone, with no PID-liveness probe** ("no process to probe",
line ~284). So after a SIGKILL the lock reads as held for the full 35 minutes
whether or not anything is still alive, and every resume attempted inside that
window permanently poisons the assignment. The window is deterministic and
large, not incidental — this raises the practical severity of F2 rather than
lowering it.

Net effect on this cell's Area 6 claim: "after that one manual reconciliation
step … the identical resume request succeeded" holds only when the orphan is
already dead — a precondition the system gives you no way to establish.

### F3 (high) — a crash during the event-log append leaves the session completely unreadable (RT-16)

The task asked for a kill at a different lifecycle point producing a worse
failure mode. This is it. A truncated final JSONL line — exactly what a SIGKILL
mid-`appendEventLocked` produces — makes **both** `show` and `run` exit 5
(`corrupt-log`). Unlike the stale-claim case, the session is not even
diagnosable.

`src/state/events.mjs` already has a `repair()` that handles precisely this
shape (truncated final line only, with a backup). **No `fgos coordination`
sub-verb exposes it.** Same missing-CLI-door family as `tsk-47l`, one severity
level higher. The window is narrower than the dispatch window, but real.

### F4 (high) — a fabricated `result.json` bypasses the stale claim entirely (RT-17)

`findLatestRunResult` is consulted *before* the `dispatch.claim` check
(`session-engine.mjs:380` vs `:389`). So the shortcut a stuck agent would
plausibly reach for — copy a sibling `result.json` into the crashed run
directory — works: exit 0, the fabrication is link-resulted, and `show` moves
the actor from `late` to `completed`. The session then presents as a
legitimately-progressed panel with fabricated advisory content, unmarked. Same
root cause as F1, but here it is a silently-corrupting "fix" for the very gap
`tsk-47l` documents. Anyone picking up `tsk-47l` should be warned off it
explicitly.

### F5 (high) — the bounded dialogue reopen has no enforced link to a human turn (RT-18)

The protocol YAML describes `revise-synthesis`/`revise-explanation` as "the
bounded, driver-authorized CAPABILITY a driver may spend once a human turn has
been recorded and read". I authorized **and dispatched** `revise-synthesis` in a
session's second call, with zero `human-turn-recorded` events and zero
`synthesize-recommendation` events — skipping the entire graph.

Cause: those bindings deliberately declare no `contextAccess.visibilityWindowRef`
(documented in the YAML, for quorum reasons), and graph `transitions` are not
themselves a dispatch gate — node ordering is enforced **only** through
visibility windows. So the numeric cap is kernel-enforced while the precondition
is prose only. This compounds `tsk-44p`, which the YAML already notes leaves the
free-text `authorize.reason` as the only channel linking a turn to a reopen.

The Doer's Area 5 proved the cap (2 admitted, 3rd refused — I reproduced that).
It did not test the precondition. "A revision informed by the person's turn"
carries no kernel guarantee that any person ever spoke.

### F6 (high) — `aggregateBounds` on a resumed request is silently discarded, both directions (RT-10)

Declaring **tighter** bounds mid-session returns exit 0 with no warning, leaves
the manifest untouched, and dispatches past the declared cap — an operator
tightening bounds to contain a runaway panel gets a success signal for an action
that did nothing.

Declaring **higher** bounds to rescue an under-budgeted session also does
nothing, and such a session is permanently wedged: at `maxRounds: 11` the flow
dies at `close-dialogue`, which is the only route to lead-advisor quorum, so the
session stays `active` forever with no CLI door to recover it. Same
missing-reconciliation-door family as `tsk-47l` and F3.

This is the mirror of the already-recorded `actors[]` non-persistence asymmetry:
`actors[]` silently un-confines on resume, `aggregateBounds` silently refuses to
re-confine. Both discard a caller's declaration without saying so.

### F7 (medium) — the event log is not tamper-evident (RT-05, RT-06)

Each event carries an `h` field — a SHA-256 prefix computed at write time
(`src/state/events.mjs:457`). **It is never verified against content anywhere in
`src/`.** Its only uses are as a dedupe key (`events-compaction.mjs:116`,
`replay.mjs:855`). There is no chaining (no prev-hash), so events are freely
insertable and reorderable.

Live: a forged event with `h: "0000000000000000"` and `src: "red-team-forger"`
was accepted without complaint and rendered by `show` as a legitimate
authorization attributed to the real driver, with no `coordinationStateError`.

Capability impact alone is low — the gates re-derive (RT-05) and the manifest
cross-check catches the naive version (RT-06). But with two files edited and one
directory fabricated, I forced `post-shaping-open` open and dispatched
`critique-proposals` for real. Given F1/F4, and given that executors already have
this write access, "the log is only as trustworthy as `.fgos/` filesystem
permissions" is the honest statement — and a field that *looks* like an
integrity hash but provides none is worse than no field, because a reader will
assume otherwise.

### F8 (medium) — controlled reveal is prompt-scoped, not process-scoped (RT-08)

I bound the third Phase-5 shaper to a curious executor. During its own
legitimate run it read all 12 sibling `agent-report.md` files in the workspace —
including the two shapers that settled before it in its own session, and
assignments belonging to entirely different sessions.

The visibility window governs what the engine *puts in the prompt*, not what the
process *can read*, and assignment directories are workspace-global rather than
session-scoped. For a panel whose value rests on genuinely independent priors,
this is the boundary worth stating plainly in the docs rather than leaving
readers to infer that "isolated-until-fan-in" means process isolation.

### F9 (low, informational) — `maxRounds` and `maxAssignments` are the same counter

Both are enforced as `manifest.assignmentRefs.length >= cap`
(`store.mjs:775` and the check immediately above it). In this protocol they are
indistinguishable and the stricter simply wins. Not a defect; worth one line in
the docs so nobody budgets them as independent dimensions.

## Assessment of the Doer's cell

The six areas are genuinely exercised through the real CLI, and the disclosure
of `tsk-47l` rather than smoothing it over is the right call. Three
qualifications:

1. **Area 4 (routing) does not hold as stated.** F1 shows reported provenance is
   not evidence of the dispatch that occurred. The Doer's own observation is
   correct for *their* run; the claim generalizes further than the mechanism
   supports.
2. **Area 6's recovery half is weaker than reported.** F2 shows the documented
   workaround is not safely performable from what a crash leaves behind, and
   performing it blind can permanently poison the assignment. F3 and F4 are two
   crash-adjacent failure modes worse than the one disclosed.
3. **Area 5 proves the cap but not the precondition** (F5), and Area 3's bounds
   were never probed at the edge (I did: no fencepost, minimum is 12).

F6 also means a reviewer cannot infer from a passing run that the bounds a
request declares are the bounds in force.

## Recommendations

1. Validate `result.json` on the `findLatestRunResult` resume path before
   linking it — at minimum bind it to the `dispatch-plan.json`/`run.json` the
   engine itself wrote for that attempt (F1, F4). This is the highest-value
   single fix; it closes two high findings.
2. Write owner identity (pid, boot id or start time, hostname) into
   `dispatch.claim` — `tsk-47l`'s proposed fix cannot be built without it
   (F2). Update `tsk-47l` to record this, and to warn against the fabricated-
   result shortcut.
3. Do not record transient dispatch-lock contention as a terminal
   `RunResult{failed}` (F2). Refuse with a non-zero exit and leave the
   assignment retryable.
4. Expose the existing `repair()` through a `fgos coordination` door (F3), and
   consider one reconciliation verb covering the stale claim, the truncated log,
   and the wedged-bounds case together — they are one missing capability, not
   three bugs.
5. Either verify `h` on read (and chain it), or stop writing a field that reads
   as integrity protection (F7).
6. State plainly in the panel docs that reveal control is prompt-scoped and that
   `aggregateBounds`/`actors[]` are fixed at open (F6, F8). These are honest
   design limits; the risk is that the current prose implies otherwise.
7. Consider whether F5 should be closed in the graph (gate the reopen bindings
   on a window that a human turn opens) or accepted and documented as a driver
   discipline. That is a design decision for P05.2, not a defect to patch
   silently.

## Unresolved questions

- F1/F4 sit at a trust boundary the project may already consider inside its
  perimeter (executors are trusted subprocesses). If so, F1 is a documentation
  fix, not a code fix — but the Area 4 wording still needs correcting, because
  it presents provenance as proof.
- Whether F5 is a defect or an accepted deferral depends on how strongly the
  Decision Dialogue guarantee is meant to be read. P05.2 exercises the real
  human turn and is the right place to settle it.
- I did not re-run the test suites; that is the reviewer's lane. Nothing I found
  is suite-visible — every finding is a property no current test asserts.
