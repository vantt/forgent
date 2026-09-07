# Red-team review request — Dispatch Visibility V0

Branch `dispatch-visibility-v0`, 26 commits on top of `main`. You are reviewing
completed work, not a plan. Read the code; do not take this brief's claims on
trust — several of them are exactly what you are being asked to falsify.

---

## Part 1 — What this work was for, and where it is going

**The problem.** fgOS dispatches work to agent CLIs. Interactive dispatch (an
agent running in a real terminal pane a person can watch) had been failing
silently in production for months. Two defects were recorded and neither was
really fixed:

- The prompt was quoted into an argv string and typed into the pane as
  keystrokes, so every multi-line prompt was corrupted before the agent saw it —
  and every real implementation prompt is multi-line.
- Completion was read off `agent_status`. That reading was measured wrong twice:
  `idle` reported before the agent had started at all (a dispatch that delivered
  nothing reported success with an unchanged HEAD), and an `idle`-looking gap
  between two tool calls of a single turn, ending roughly a quarter of runs
  mid-work. Each got a patch — a "must have seen working first" gate, then a
  three-poll debounce — and the second patch's own author wrote that it was a
  heuristic, not a proof.

The consequence: `capabilities.fgos-coding-implement.prefer` was reverted to
`agy-cli` and interactive dispatch was effectively dead.

**The constraints the work had to hold.** Agents run *interactive*, never `-p`
headless as the main path. Visibility is a Dispatch capability, not decoration.
Terminal text is never evidence.

**The claim this work is built on**, and the one most worth attacking:

> The three defects are one mistake — reading the terminal as though it were the
> record. No amount of tuning fixes that, because the terminal is not where the
> answer is. Dispatch owns lifecycle truth; herdr is transport and failure
> detector; **a receipt is an artifact the receiver wrote**.

**The long horizon.** This is V0 of three deliberate levels, and the split
matters for judging scope:

- **V0 (this work): visibility without contact.** Watch a run, know what became
  of it, never send it anything. One driver, unlimited read-only observers.
- **V1: minimal contact.** A `contact` verb writing `contact/<seq>.json`,
  delivered as a pointer only when the agent is at rest. Its shape is locked in
  the design doc so V1 reuses V0's delivery path instead of redoing it. **No
  code in V0.**
- **V2: hook-based contact** at the provider's turn boundary. Out of scope.

So "why is there no contact mechanism" is answered: on purpose. But "does V0's
shape actually make V1 cheap, or has it painted V1 into a corner" is a fair and
wanted question.

Design source: `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md`
Decision record: `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md`
Plan and phases: `plans/260906-1831-dispatch-visibility-v0/`
Live proof: `docs/architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md`

---

## Part 2 — What was built

Seven phases, all complete. Roughly 4,800 added lines across 32 files.

| Module | Lines | Job |
|---|---|---|
| `src/runner/dispatch/transport.mjs` | 1080 (rewritten adapter inside) | the `herdr-spawn` adapter |
| `src/runner/dispatch/herdr-agent.mjs` | 244 | one door onto the herdr CLI; parses its JSON envelope, names its errors |
| `src/runner/dispatch/brief.mjs` | 103 | renders the brief file and the one-line pointer |
| `src/runner/dispatch/liveness.mjs` | 192 | the signal ladder, as a pure function |
| `src/runner/dispatch/visibility-session.mjs` | 279 | `visibility.json` + `run.json` status + reconcile + actor lease |
| `src/runner/dispatch/trust-store.mjs` | 174 | folder-trust store (pre-seed so a fresh worktree does not stop at a dialog) |
| `src/runner/dispatch/worker-home.mjs` | 184 | provisioned private HOME per run |
| `src/runner/dispatch/worker-session.mjs` | 114 | pure session addressing; refuses the operator's session |
| `src/runner/dispatch/worker-session-boot.mjs` | 114 | brings the worker session up and gives it a root pane |
| `src/verbs/dispatch/{show-run,watch}.mjs` | 131 + 90 | read-only observe doors |

Behaviour, in one pass:

1. The prompt is written to `brief-<round>.md`; only a one-line pointer is typed.
   `promptDelivery: "inline"` is a declared alternative.
2. The agent is started by `herdr agent start`, which returns only once herdr
   confirms readiness. `herdr pane run` is gone from the startup path, along with
   the exit sentinel it needed.
3. A round ends when `outbox/result-<round>.json` appears. `agent_status` is not
   read as completion anywhere.
4. Failures are typed: `settled`, `blocked`, `died`, `timed-out-idle`,
   `timed-out-ceiling`, `paused-limit`. Only `settled` closes its pane.
5. `run.json` is closed out at settlement; a crashed run reconciles to
   `settled` / `died` / `unknown`.
6. Confinement (private HOME + own herdr session) applies when declared, and is
   *refused* rather than downgraded when it cannot be established.

**Test state:** 5719 tests, 5709 pass, 3 fail. All three failures are
pre-existing on `main` and untouched by this branch (`ask/answer` legacy item,
`docs-index` needing an absent `docs/tutorials`, `coordination-example-requests-valid`).
Verify that claim rather than accepting it.

**Live proof** (own herdr sessions throughout; the operator's `default` session
was never addressed): real `claude` settled end-to-end in 39.1s with the brief
carrying a 7-line prompt verbatim; a killed agent produced `died` in 1525 ms with
its pane kept; a `setsid` child outlived `pane close`; a separate OS process
watched a run while another drove it; panes survived a herdr server restart;
`agy` ran 10/10 clean (threshold declared before the runs).

---

## Part 3 — What to judge

### A. Is it actually implemented, or does it only look implemented?

Check for stubs, fake data, dead paths, and things that are tested only against
their own mocks. Specifically worth probing:

- The mock herdr in `test/runner/herdr-spawn-adapter.test.mjs` is elaborate.
  Does it encode the *real* herdr's behaviour, or a convenient version of it?
  (herdr 0.8.2 envelope: success → exit 0 `{id,result}`; failure → exit 1
  `{error:{code,message}}`.) One earlier version of this mock reported a pane
  with no agent process in it, which made the ladder correctly answer `died` —
  the mock was wrong, not the code. Look for the same class of error elsewhere.
- `liveness.mjs` is pure and heavily unit-tested. Is the *adapter's* use of it
  faithful to what the tests assume — same observation shape, same threading of
  `absentStreak`, screen read exactly once?
- Are the two observe verbs genuinely read-only? There is a test asserting the
  source contains no route to `agent prompt`/`send-text`/`send-keys`. Is that
  test defeatable — e.g. by a transitive import it does not check?

### B. Critical issues

Anything that loses work, corrupts state, kills a healthy run, or lets a worker
reach something it should not. In particular:

- **The kill path.** `died` requires N consecutive `absent` readings and a single
  `unknown` resets the count; a failed liveness probe must report `unknown`,
  never `absent`. Find a sequence that kills a healthy worker.
- **Confinement.** `worker-session.mjs` refuses `default` and refuses the
  caller's own `HERDR_SESSION`. Find a config or environment that gets a worker
  into the operator's session anyway.
- **Atomicity.** `visibility.json` and `run.json` are written temp-then-rename.
  Find an interleaving where a reader sees a torn or lost write, or where two
  actors both believe they hold the lease.
- **The collector.** It now resolves the worker's claim from either
  `outbox/result-<round>.json` or the legacy flat `agent-result.json`, highest
  round wins, ordered numerically. Find an input where the wrong claim is
  chosen, or where the claim is counted as its own companion report.

### C. Design and architecture quality — the part that matters most here

The bar is not "is it correct". It is:

**Simple.** Is there a smaller shape that does the same job? Name concretely
what would be deleted or merged, not just "this feels heavy".

**Intuitive — does a developer get it on the first read?** That click of
*"oh, I see"* on first contact, without needing to hold five files in their head.
Judge this the way a new maintainer would: open the code cold and see whether the
mechanism explains itself.

Places I already suspect fail this bar, stated so you can confirm or reject
rather than rediscover:

- **`runHerdrRound` is 328 lines in one function.** It does pane creation, agent
  start, confinement, brief delivery, the poll loop, resend, failure
  classification, the exit sequence and teardown. This is the single most likely
  legitimate finding in the whole branch. Is it one thing or six? If six, say
  exactly where the seams are.
- **Two shapes now express confinement.** This branch adds a declarative
  `confinement: {privateHome, isolatedSession, ownWorktree}` field, while the
  repo already expresses OS-level confinement by *having a separate executor
  entry* (`claude-bwrap`, `agy-bwrap`). Two vocabularies for one idea. Is that
  drift worth collapsing now, and into which of the two?
- **Timeout vocabulary.** `timeoutMs`, `idleTimeoutMs`, `readyTimeoutMs`,
  `promptTimeoutMs`, `resendAfterMs`, plus a ceiling derived from `timeoutMs`.
  Six knobs. How many does a person configuring an executor actually need to
  understand, and can the rest be derived or dropped?
- **`liveness.mjs`'s `needsScreen` round-trip.** The ladder returns
  `needsScreen: true`, the caller reads the screen and calls again. It keeps the
  module pure, at the cost of a two-pass protocol a reader has to notice. Is the
  purity worth that, or should the reader be injected as a callback?

If something is too hard to understand, **propose the clearer design**. A
concrete restructure beats a complaint. Where a simplification would cost
something real (a measured behaviour, a named failure mode), say what it costs so
the trade is visible.

---

## Part 4 — Already known; do not spend effort re-reporting

These are recorded in ADR-011 and the live-proof page, deliberately, as accepted
or deferred:

- The worker holds a copy of the operator's provider credential; only a relay
  closes that, and V0 has none.
- Workers share one herdr session, so the proved boundary is
  worker-versus-operator, not worker-versus-worker.
- `blocked` and `paused-limit` both map to the coarse `worker-timeout` error
  class, so the recovery matrix will retry them.
- Hang detection is unsolved; V0 has an idle timeout and a ceiling and says so.
- `herdr pane split` needs an existing pane, so the adapter cannot open the first
  pane in an empty session.
- No executor declares `confinement` yet, and `prefer` is still `agy-cli`, so
  none of this is on a production dispatch path today. That is the plan's own
  scope line, not an oversight.

New reasoning about *why* one of these is worse than believed is welcome. Simply
restating them is not.

---

## Part 5 — How to answer

For each finding: the file and line, what actually breaks or confuses, and a
concrete fix or restructure. Rank by severity, and separate **correctness** from
**clarity** — they have different fixes and different urgency.

Then answer these four directly:

1. Is this implemented, or does it only look implemented?
2. Are there critical issues that should block merge to `main`?
3. Is the design simple enough, and if not, what specifically comes out?
4. Would a developer meeting this code cold understand the mechanism on the first
   read? If not, name the exact place they lose the thread, and how you would
   restructure it so they do not.

Verdict: **ship** / **ship after named fixes** / **do not ship, redesign**.
Say which, and why, in one paragraph.
