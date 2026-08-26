# RESEARCH.md — tsk-2rr

## Round 1 (2026-08-26) — was this an agy `-i` prompt-delivery bug?

**Asked:** does `agy`'s `-i`/`--prompt-interactive` flag actually auto-submit
a trailing positional prompt argument as chat input the way `-p` does, or
does it just open a blank interactive REPL ignoring that argument? The
item's original submission assumed the latter, based on 3 real automated
dispatch failures (all `headBefore==headAfter`, banner-only capture).

**Checked:**
- `agy --help` (real, installed binary v1.1.21): `--prompt-interactive` /
  `-i` is documented as "Run an initial prompt interactively and continue
  the session" — this describes auto-submitting the prompt, not ignoring
  it. Contradicts the original hypothesis at the doc level.
- `docs/explanation/why-agy-dispatch-needed-new-project-and-still-isnt-fully-reliable.md`
  — existing repo doc on `agy`'s `-p` reliability quirks (cwd resumption,
  print-timeout). Relevant context (agy has a history of quirky CLI
  behavior) but does not characterize `-i` specifically.

**Found:** manually replicating the adapter's exact mechanism —
`herdr pane split --cwd <dir>` then `herdr pane run <paneId> <the exact
posixShellQuote-escaped command string herdrSpawnInteractiveAdapter
builds>` (verified byte-for-byte, including the embedded single-quote
escaping for a prompt containing `git commit -m 'proof commit'`) — the
prompt **was delivered and processed correctly every time**, with real
file writes and real git commits landing (`LIVEPROOF.txt`, `PROOF2.txt`
+ `def7e6c proofcommit`, `PROOF3.txt` + `55bae37 proof commit`,
`FLICKER.txt` + `3862de9 flickercommit`). 4/4 manual replications
succeeded, all in the same disposable repo the automated dispatch had
just failed in moments earlier.

**Verdict for this question:** the original hypothesis (`-i` never
delivers the prompt) is **wrong**. `-i` reliably delivers and processes
the prompt when the pane is left alone. The failure is elsewhere.

## Round 2 (2026-08-26) — where does headBefore==headAfter actually come from?

**Asked:** given `-i` delivery is proven reliable, why does every dispatch
*through the real adapter* still fail with zero work done, while manual
replication of the exact same typed command never fails?

**Checked:** ran the real production path
(`node src/runner/dispatch.mjs execute agy-herdr --prompt ... --cwd
<same disposable repo>`) immediately after a manual test had just proven
`-i` delivery works in that exact directory. The real adapter dispatch
still failed: `headBefore==headAfter`, captured stdout = startup banner
only, paneId auto-closed, elapsed only a few seconds.

Instrumented `agent_status` with `herdr pane get <paneId>` polled at
fine-grained intervals, comparing two polling cadences against the same
prompt/cwd:

- **Coarse polling** (`sleep`-style checks every several seconds, no tight
  loop) — `agent_status` progression was `unknown` (~3-4s, agy booting) →
  `working` (~2-4s, agy actually generating) → `idle` (genuine
  completion, file/commit present by then). Every coarse-polled run
  completed real work correctly (this is exactly Round 1's 4/4 successes
  — they were all coarsely observed).
- **Tight polling, 500ms interval, starting immediately** (matching
  `herdrSpawnInteractiveAdapter`'s own `checkIdle`/`setInterval(checkIdle,
  500)` exactly) — `agent_status` reported `idle` as early as **3500ms**,
  while the pane's own visible content still showed only the pristine
  startup banner (confirmed via `herdr pane read --source visible` at
  that exact moment) and the target file (`POLLTEST.txt`) did not exist
  on disk yet. This exact timing/false-report reproduced consistently
  across multiple runs, always in the same shape: a premature `idle`
  report several seconds before genuine completion, always coinciding
  with tight ~500ms `pane get` polling from very early in the pane's
  life.

**Finding:** `herdr pane get`'s own `agent_status` classification becomes
unreliable — reporting a false `idle` — when queried repeatedly at short
(~500ms) intervals starting immediately after a pane's foreground process
launches. This is not an `agy` bug and not a prompt-delivery bug; it is
either (a) a real defect in herdr's own activity-detection heuristic (the
act of querying may itself interfere with whatever "has this pane changed
since last observed" state the classifier tracks), or (b) an inherent
race in that heuristic during a process's own early rendering (banner
draw, `-i`'s own boot sequence) that only manifests when sampled this
tightly — either way, `herdrSpawnInteractiveAdapter`'s `checkIdle` (which
polls at exactly this cadence, starting immediately after typing the
command) hits it on effectively every real dispatch, while a person
watching a pane at normal human-observation cadence (seconds apart) never
would.

**Verdict:** `clear`. Verify: a live dispatch test asserting **real file
content** (not just exit code 0) through `executeExecutorCli('agy-herdr',
...)` against a disposable repo — the exact repro shape used in this
research (a multi-step create-file-then-git-commit prompt) — must FAIL
before any fix, and PASS after. Suggested fix direction for planning:
require `checkIdle` to have observed `agent_status === 'working'` at
least once (a genuine, sustained active state) before trusting a
subsequent `idle`/`done` as real completion — this closes the exact false
signal demonstrated above without needing to change polling cadence or
understand herdr's internal heuristic further. A slower first-poll delay
alone would not be a reliable fix (this Round's 3500ms false report is
already past what a modest initial delay would buy).

## Round 3 (2026-08-26) — implementing the fix surfaced a second, related race

**Found during implementation:** the `sawWorking` gate alone (a single
boolean, trusting the very next `idle`/`done` reading once `working` had
been seen once) closed the original false-idle race, but left a residual
flake: independent live re-runs of the strengthened test (a multi-step
prompt: create a file, THEN run a separate `git commit` shell command)
showed **1 failure out of 4 isolated runs** (`PROOF.txt` never created,
same symptom as Round 2, but now occurring mid-turn instead of at
startup) — and **2 failures out of 3 full-test-file runs** (this test
alongside several other concurrently-executing live tests in the same
file).

**Mechanism:** a multi-step turn (file edit, then a separate Bash tool
call for the git commands) can show a brief `idle`-looking gap on
`agent_status` BETWEEN the two real tool calls — the model/tool-call
round-trip has its own latency, and herdr's activity heuristic can read
that gap as `idle` for one poll cycle. Once `sawWorking` had already
latched `true` from the first tool call, that one-poll gap alone was
enough to satisfy the original gate and fire `/exit` before the second
tool call (the actual `git commit`) ever ran.

**Fix, incremental, both steps live-tested:**
- Requiring the SAME terminal reading on **2 consecutive** 500ms polls:
  0 failures across 5 isolated re-runs (up from 1/4), but still 2
  failures across 3 full-test-file (concurrent) runs — real resource
  contention from multiple simultaneous live herdr/agy dispatches appears
  to widen the mid-turn gap beyond one extra poll cycle under load.
- Requiring **3 consecutive** polls: 0 failures across 4 full-test-file
  runs (up from 1/3 with 2 polls). Not proof of "never" — LLM-backed
  live timing is not perfectly bounded — but a real, measured
  improvement over both the original bug (0/6+ successes) and the
  2-poll debounce (1/3 full-file runs still failed).

**Verdict:** accept the 3-consecutive-poll debounce as the shipped fix.
This adds up to 1000ms of extra latency (two more 500ms poll cycles)
before a genuine completion is recognized — negligible against the
multi-second-to-tens-of-seconds real dispatch times observed throughout
this investigation. Documented here plainly rather than claimed as a
permanent, deterministic fix: a load-dependent residual flake of this
kind is inherent to polling a heuristic, load-sensitive external signal
(`herdr`'s own `agent_status` classifier) rather than something this
adapter can fully control from its own side.

## Round 4 (2026-08-26) — advisor review found 2 real gaps before approval

An independent advisor review of this fix (requested before merging tsk-2rr)
found two concrete issues neither Round 2 nor Round 3 had actually settled:

1. **`done` was gated on `sawWorking` the same way `idle` is, with no
   evidence justifying it.** The code required `sawWorking` before trusting
   *either* `idle` or `done`. But every confirmed false-positive in this
   entire investigation (Rounds 1-3) was herdr reporting `idle` — never
   `done`. Requiring `sawWorking` for `done` risks reintroducing the exact
   regression tsk-10j's own bug #2 already fixed once: an agent whose
   first-ever response is fast enough to report `done` before any poll
   samples `working` would hang until the outer timeout instead of
   completing.

   **Checked live**: split a fresh pane, ran two different genuinely
   ultra-short prompts ("Reply with exactly: OK", "Say OK") with
   fine-grained (200-500ms) polling from the start. Both settled at
   `idle` — through a real, multi-second `working` phase first — never at
   `done` at all. `done` could not be reproduced on demand in this
   agy/herdr version. Grepping the existing test file for `'done'`
   confirmed **zero** tests (mocked or live) had ever exercised the `done`
   code path — the whole branch shipped in Round 2/3 was untested.

   **Fix**: decoupled the two. `idle` still requires `sawWorking` (the
   confirmed-risky value); `done` only needs the 3-consecutive-poll
   debounce on its own, no `sawWorking` requirement. Added a real,
   deterministic mocked test (`agent_status` sequence `unknown, unknown,
   done, done, done` — `working` never appears at all) proving a
   `done`-only completion still finishes correctly rather than hanging.

2. **The Round 3 mocked test only proved *a* debounce existed, not the
   specific 3-consecutive-poll requirement.** Its own assertion
   (`totalPolls >= 3`) would have passed identically under a weaker 1-poll
   or 2-poll gate — it never actually exercised the mid-turn-dip scenario
   Round 3's own prose describes (working, THEN a brief false idle,
   THEN working again, THEN the real finish).

   **Fix**: added a new deterministic mocked test with the sequence
   `working, idle, idle, working, idle, idle, idle` — a dip back to
   `working` after only 2 consecutive idle readings, forcing the counter
   to reset, then a full fresh 3-in-a-row run. Confirmed by construction
   that this test would have FAILED against a 2-poll debounce (which
   would have fired at the first `idle, idle` pair, poll count 3, well
   under this test's own `>= 7` assertion) — this is a real discriminating
   test, not one that merely tolerates the current implementation.

**Verdict, updated**: both gaps closed. Full suite (`test/runner/herdr-
spawn-adapter.test.mjs`) re-run green, 32/32, including both new tests and
the existing live interactive test.
