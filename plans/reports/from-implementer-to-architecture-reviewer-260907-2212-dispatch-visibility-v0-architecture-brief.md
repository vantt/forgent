# Architecture review brief — Dispatch Visibility V0

**Branch:** `dispatch-visibility-v0` @ `45281918` (= local `main`)
**Repo:** fgOS (`/home/vantt/projects/forgentX`), worktree for this branch:
`/home/vantt/projects/forgentX-worker-isolation`
**What you are asked for:** an **architecture** judgement, not a correctness audit.
Two correctness reviews already ran and their findings are closed; the second one's
report is in this directory and is listed below as required reading so you do not
re-derive what it already established.

---

## 1. What the system is for

fgOS dispatches work to AI coding agents. Its core promise, from
`docs/platform-foundations.md`, is **"Release con người"** — free the human from
sitting and watching. A person should be able to leave, come back, and find out
what happened.

Until this track, that promise had a hole in the middle. Dispatch ran an agent
**headless** (`claude -p "<prompt>"`, `agy -p …`): a subprocess with a captured
stdout and an exit code. Two consequences, both measured in production:

1. **A multi-line prompt could not survive.** The prompt was substituted into an
   argv element; a real implementation prompt is always multi-line, and it arrived
   at the agent corrupted. Every real `fgos-coding-implement` dispatch was
   destroyed this way, silently.
2. **Nobody could see anything.** No pane to look at, no way to know whether a
   30-minute round was working or wedged, no way to tell a run that ended an hour
   ago from one killed mid-flight — `run.json` was written once as
   `status: "running"` and never written again.

**V0's goal:** make dispatch through **herdr** (a terminal-multiplexer daemon that
runs real interactive agent TUIs in panes) actually work, be observable while it
runs, and be safe enough that a worker cannot reach the operator's own cockpit.

**Explicitly out of scope for V0:** *contact*. V0 grants **observation only** —
any number of readers, no coordination. Talking to a running worker (answering its
question, redirecting it, stopping it) is V1. Several design choices below only
make sense against that boundary, and one of the questions for you is whether the
boundary is drawn in the right place.

### The doctrine the whole design turns on

> **A receipt is an artifact the receiver wrote.**

Transport status is never proof. Concretely: a round concludes **only** when the
worker's own `outbox/result-<round>.json` appears on disk. `agent_status` is never
read as completion — that reading was wrong twice in production (reported `idle`
before the agent had started at all, and again in a gap between two tool calls of
one turn).

A second rule, stated three times in the code because it is the one that kills
healthy work when broken:

> **A reading that could not be taken is not evidence.**

A failed liveness probe reports `unknown`, never `absent`. `died` needs consecutive
absences and one `unknown` resets the count. Time in which the agent's status could
not be read does not count towards an idle timeout.

---

## 2. The entity chain

```
Work item  tsk-*          what needs doing            (fgos list)
  └─ Assignment  asgn_*   who is doing which stage of it
       └─ Run  runs/NN    one actual execution of an executor
            └─ RunResult  result.json — what that execution produced
```

A retry is a **new Run**, never an edit of the old one. `run.json.status`
(`running` | `settled` | `died` | `unknown`) is a statement about **the execution
reaching its end** — never about whether the work succeeded, which lives in
`result.json`'s `status`/`confidence`.

There is a second, flatter Run layout, `dispatch-runs/<workId>/<stamp>/`, used when
a runner dispatch has no Assignment of its own. **Two layouts for one concept is a
thing worth your opinion.**

---

## 3. Shape of what was built

Three boundaries, deliberately separate:

- **Routing boundary** — the worker gets its own herdr *session*, so the socket
  herdr hands it controls only worker panes.
- **Namespace boundary** — the worker gets a private `HOME`, closing the
  `$HOME/.config/herdr/herdr.sock` fallback.
- **Neither closes the hole alone.** Measured: herdr injects `HERDR_SOCKET_PATH`
  into every pane it creates and **overwrites any `--env` override**. A worker
  cannot be denied a socket, only handed a different one.

The signal ladder, in strict order (`liveness.mjs`):

```
1. truth      the worker's result file — outranks even a process that has exited
2. blocked    agent waiting on something only a person can answer
3. died       consecutive absent readings only
4. ceiling    absolute bound on the round
5. stale      no progress; the ONLY rung that reads screen text
```

One round, as a sequence (`herdr-round.mjs`):

```
prepareRunDir → establishConfinement → paneSplit → seedWorkspaceTrust
  → startAgent → deliverBrief → pollForOutcome → concludeFailure | settleRound
```

---

## 4. Files to read, in order

### Start here (the argument, before the code)

| file | why |
|---|---|
| `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` | the decision the design rests on |
| `plans/260906-1831-dispatch-visibility-v0/plan.md` | the 7 phases, the definition of done, the named risks |
| `plans/reports/from-red-team-to-implementer-260907-1853-dispatch-visibility-v0-review-report.md` | the second correctness review. **Read this before reviewing** — its findings are all closed, and it records what was probed and found sound (kill path, atomicity, collector, mock fidelity) so you need not repeat that work |

### The core (≈1 600 lines — this is the architecture)

| file | lines | what it owns |
|---|---|---|
| `src/runner/dispatch/herdr-round.mjs` | 704 | one round, as a named sequence. `runHerdrRound` is the sequence; `driveRound` is everything after confinement exists |
| `src/runner/dispatch/liveness.mjs` | 207 | the signal ladder. **Pure** — no clock, no terminal, no I/O |
| `src/runner/dispatch/visibility-session.mjs` | 305 | `run.json` + `visibility.json`; the only door onto both. Atomic write, merge-not-replace |
| `src/runner/dispatch/herdr-agent.mjs` | 266 | the one door onto the herdr CLI |
| `src/runner/dispatch/brief.mjs` | 103 | the brief and its pointer; teaches the worker one gesture (`.tmp` then rename) |
| `src/runner/dispatch/worker-artifacts.mjs` | 58 | where a worker's claim is, under either name it may have used |
| `src/runner/dispatch/dispatch-error.mjs` | 22 | the shared error type; exists so two adapter modules need not import each other |

### Confinement

| file | lines | |
|---|---|---|
| `src/runner/dispatch/worker-home.mjs` | 215 | provision / redact / remove a private HOME |
| `src/runner/dispatch/worker-session.mjs` | 114 | session naming, socket paths, operator-session refusal |
| `src/runner/dispatch/worker-session-boot.mjs` | 140 | bring the worker session up and give it a pane to split from |
| `src/runner/dispatch/trust-store.mjs` | 287 | pre-seed workspace trust, both formats (claude JSON, codex TOML) |

### The seams into the rest of fgOS (where two defects hid)

| file | lines | read for |
|---|---|---|
| `src/runner/dispatch/cli.mjs` | 1324 | `spawnWorker` (175) and `executeExecutorCli` (380) — **the two production call sites.** Both once dropped fields the config declared |
| `src/runner/dispatch/transport.mjs` | 695 | `resolveExecutorCommand`, the adapter registry, the cli-spawn/http adapters |
| `src/runner/dispatch/config.mjs` | 1097 | the config door. `validateInteractiveModeShape` (579), `validateExecutionProfileShape` (713) |
| `src/runner/dispatch/assignment-runner.mjs` | 1075 | the collector: Run → RunResult (line 862 on) |

### Observation surface

`src/verbs/dispatch/show-run.mjs` (131), `src/verbs/dispatch/watch.mjs` (90),
and `bin/fgos.mjs`'s `stale` case (the orphaned-run advisory, 2946 on).

### Evidence — read at least one

`docs/architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md`
plus `proofs/2026-09-07-v0/` (probe scripts + their result JSON). This is what was
actually measured against a real herdr, a real claude and a real agy, rather than
argued.

### Tests worth reading as specification

`test/runner/dispatch-liveness.test.mjs` (the ladder's contract),
`test/runner/dispatch-production-call-sites.test.mjs` (starts at the config file —
exists because everything else built the invocation by hand),
`test/verbs/dispatch-observe.test.mjs` (walks the import graph to assert an
observer binds no writer).

---

## 5. What we would most like your judgement on

Not a checklist to work through — the questions where a second architect is
worth more than another correctness pass.

1. **Is the entity chain right?** Work item → Assignment → Run → RunResult, with a
   retry as a new Run. Is `Run` carrying its own status file the right shape, or
   should run state be derived from the event log the rest of fgOS uses?

2. **Two Run layouts.** `assignments/<id>/runs/NN` and
   `dispatch-runs/<workId>/<stamp>`. Every reader now handles both. Is that a
   boundary that should be collapsed, and if so which way?

3. **Where the observation boundary sits.** V0 grants read-only observation and
   defers contact to V1. An actor lease was written and then **removed** — it
   promised one-driver-at-a-time that a check-then-write cannot deliver, and its
   tests asserted the promise rather than the behaviour. The reasoning is in a
   comment block in `visibility-session.mjs`. Was removing it right, and is the
   heartbeat that replaced part of its job (`round.note({})` every 10s) the right
   primitive for V1 to build the real lock on?

4. **The purity of the ladder.** `evaluateLadder` is pure and asks the caller for
   screen text via a `needsScreen` flag, answered by a second call. It stayed pure
   against a review suggestion to inject a `readScreen` callback. Right call?

5. **`herdr-round.mjs` at 704 lines.** It was 369 lines inside a 1100-line
   `transport.mjs` and was split out and decomposed into named steps. Is the
   current decomposition real, or is it one file that should be two or three?
   Named remaining seams: `pollForOutcome` carries both ladder-polling and
   brief-resend policy; `settleRound` does five things.

6. **Config surface.** Four executor fields were just **deleted** (`receipt`, a
   top-level `trustStore`, `confinement.sessionName`, and four transport
   deadlines), and a config still declaring one is now refused by name rather than
   ignored. Is "refuse a removed field" the right posture for a platform other
   projects install, or should it warn and continue?

7. **The thing we know is unproven.** Every live proof ran a trivial task with a
   six-line prompt. What is established is **contract conformance** — the agent
   reads the pointer, finds the brief, writes ack/report/result — not that an agent
   does hard implementation work well. `capabilities.fgos-coding-implement.prefer`
   is already flipped to `agy-herdr`, so the next real implement dispatch takes
   this path. Does anything in the architecture make that flip riskier than it
   needs to be?

## 6. Ground rules

- Do not send messages to, or interfere with, any running herdr session or agent.
- Do not start a gateway by hand; `fgos gateway start` is the only door.
- This is a review: **read and report, change nothing.**
- Three tests fail on this branch (`fgos-intake-4`, `enduser-index`,
  `coordination-doctor-check`). All three reproduce identically on `main` and
  belong to other tracks; the branch touches none of their files. Suite otherwise:
  5 739 pass.
