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
