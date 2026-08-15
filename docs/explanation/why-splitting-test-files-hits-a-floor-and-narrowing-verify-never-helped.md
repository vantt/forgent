# Why splitting test files hits a floor, and why narrowing verify never helped

Every item in this repo pays for `npm test` at least twice — once at
`return`, once post-merge. So the suite's wall-clock is a tax on the whole
backlog, not a local annoyance. `tsk-25b` set out to cut it and measured
the whole way. This page records what the numbers actually showed,
including the two things that turned out to be false.

All figures below are real measurements, each run alone and sequentially so
nothing competed for CPU.

## `node --test` parallelizes by file, so one file sets the floor

The baseline: the full suite of 118 files ran **163.1s / 2827 tests / 0
fail**. Individual files, measured alone:

| File | Alone |
|---|---|
| `test/cli/fgos.test.mjs` | 171.0s / 547 tests |
| `test/setup/checks.test.mjs` | 109.0s / 85 tests |
| `test/runner/merge.test.mjs` | 2.0s |
| `test/runner/goal-check.test.mjs` | 2.0s |
| `test/architecture.test.mjs` | 0.14s |

The full suite was *faster than its slowest file run alone*. That is the
whole mechanism: `node --test` parallelizes by file, so suite wall-clock
≈ cost of the slowest file, and the other 117 files hid completely behind
`fgos.test.mjs`. Running them was nearly free.

## Consequence: narrowing verify scope cannot make verify faster

This is the counter-intuitive part, and it was measured rather than
reasoned about. A subset of 4 files covering exactly the code a change
touched ran **172.6s / 732 tests** — *slower than the full suite*, while
covering 2095 fewer tests.

Narrowing the verify command trades coverage away and buys nothing, because
what you keep is the expensive file. Anything that touches code covered by
`fgos.test.mjs` — which means anything touching `bin/fgos.mjs` — pays that
file's cost no matter how tightly the verify is scoped.

The only lever that moves the number is making the slowest file stop being
slow.

## The measurement that decided whether the plan was real, before any code moved

Splitting `test/cli/fgos.test.mjs` was the riskier half of the work: 547
tests moving files, and a path deleted that 55 items referenced in their
`verify`. That risk was accepted only because the deciding number was taken
*first* — before a line was changed.

Two measurements settled it:

- **The other 116 files ran to completion in 29.70s.** That is the real
  ceiling once the dominant file stops dominating, so a sub-45s suite was
  achievable rather than hypothetical.
- **Per-test cost showed the heaviest single test at 11.1s**, so 10 groups
  would each land under the ~30s per-file threshold.

Without those two numbers the split would have been a guess that moved 547
tests and deleted a widely-referenced path for possibly nothing. This is
the same discipline the rest of this page runs on: measure the ceiling
before paying for the work, not after.

One verify detail matters here too. The verify for this split was rewritten
to catch a *real* regression rather than assert "0 fail" against a baseline
that was already known to be green — an assertion that would have passed
whether or not the split preserved anything.

## Split by measured cost — not by test count, and not by topic

The two dominant files needed different splitting rules, and only
measurement revealed why.

For `test/cli/fgos.test.mjs`, cost per test was roughly even (~0.31s across
547 tests), so dividing by *count* was a good enough approximation.

For `test/setup/checks.test.mjs` it was not. The cost distribution is
severely skewed: **10 tests that stand up a real environment accounted for
117.6s of the file's 120s**, at 10.66–14.27s each. Everything else was
noise. Two consequences followed directly from those numbers:

- **Grouping by count would have failed.** The only workable rule was
  pairing two heavy tests per file for ~24.9s, safely under the ~30s
  per-file threshold — and the two heaviest (12.2s and 10.7s) had to land
  in *different* groups, since together they were 23s before adding
  anything else.
- **Grouping by topic was impossible.** Three tests sharing the config
  topic came to 33.8s on their own — already over threshold before any
  other test joined them. A topically tidy split would have been an
  over-threshold split.

The intuitive organizing principles — equal counts, related subject matter
— both produce wrong answers here. Only the measured per-test cost
produces a correct one.

The first half's result, for scale: 581/581 tests matched after the move,
and the suite went 169.76s → 133.49s from that file alone.

## Mechanical splitting worked, then stopped working at ~50s

Splitting the two dominant files (7–8 shards for `fgos.test.mjs`, 5 for
`checks.test.mjs`, 27 files total) was deliberately *mechanical*: test
bodies moved verbatim, no test content edited, so the split was
zero-behavior-change and provably lost no tests.

It paid off, then stalled:

| Run | Wall-clock |
|---|---|
| 1 | 46.91s |
| 2 | 52.51s |
| 3 (with CPU measured) | 50.37s — `user=324.46s sys=104.50s cpu=851%` |

169.76s → ~47–53s, about a 70% cut. But it would not go below ~45s, and the
CPU numbers explain why:

- Total CPU for the suite is **429s**, spread over only **8.5 of 16 cores**
  (`cpu=851%`).
- The theoretical floor at full 16-core saturation is ~27s. The gap from
  27s to 50s is **not** the slowest file any more — the heaviest remaining
  file is only ~22s. It is core *occupancy*: toward the end of a run only a
  few heavy files are still going and most cores sit idle.

The ceiling changed shape. In the first round it was `max(file)`, so
splitting until no file exceeded ~30s was sufficient. After that it became
makespan across 16 cores.

## The obvious next step was tried, measured, and was wrong

The natural hypothesis — more, smaller files fill the cores better — is
false, and this is the measurement that shows it:

| Configuration | Wall-clock |
|---|---|
| 27 files (`test/cli` + `test/setup`) | 46.91s, 52.51s, 50.37s |
| 40 files (5 setup → 10, 6 cli → 12) | 53.46s, **61.79s** |

Finer splitting made the suite **slower**. Total CPU (429s) does not change
when you redistribute the same work, but every test file is a separate
`node` process that must boot and re-import the whole harness — so 13 more
files means 13 more copies of that fixed cost, plus more CPU contention.
The test count matched at 2878 in both configurations, so the split itself
was correct; it simply bought nothing.

This was reverted to 27 files. It is written down here so nobody spends the
same measurement twice.

**Mechanical splitting is out of room at ~50s.** Going lower requires
reducing *total* CPU — consolidating fixtures, spawning fewer real
processes — which is exactly what the mechanical-split rule ruled out of
scope, and is a separate item.

## The floor was not structural — it was 10 tests shelling out to a real CLI

The conclusion above ("total CPU is the only lever left, and that means
consolidating fixtures and spawning fewer processes") was half right. It
named the right quantity and the wrong cause. A follow-up measured the
cost of each piece *before* changing anything, and the starting assumption
collapsed:

| Operation | Cost |
|---|---|
| `node` bare startup | 17 ms |
| `node bin/fgos.mjs --help` (loads the whole CLI) | 47 ms |
| `git init` + config + commit | 13 ms |
| `fgos init` in a fresh tmpdir | 57 ms |
| `fgos setup`, real `claude` CLI blocked | 126 ms |
| `fgos setup`, real `claude` CLI **not** blocked | **11 031 ms** |

**Consolidating git fixtures would have bought almost nothing** — standing
up a real git repo costs 13ms. The thing burning 117.6s of
`checks.test.mjs`'s 120s was 10 tests calling `fgos setup` without blocking
the real `claude` CLI, ~11s each. The gap between blocked and unblocked is
**87×**, measured by a probe running inside `node --test` itself.

The mechanism: `checkClaudePluginMarketplace()` shells out to `claude
--version`, `claude plugin marketplace list --json`, and `claude plugin
list --json`, and on its fix branch also `claude plugin marketplace add
<github source>` — downloading over the network. `claudeCommand()` returns
`process.env.FGOS_CLAUDE_COMMAND || 'claude'`, and the machine had a real
`claude` on `PATH`.

The harness **already had `NO_CLAUDE_ENV` for exactly this**, and the test
files already imported it. They just did not use it: all 10 tests passed
`env: { ...process.env, HOME: homeDir }` where they meant `{
...NO_CLAUDE_ENV, HOME: homeDir }`.

### This was never only a speed bug

`checks.test.mjs`'s own header states that `NO_CLAUDE_ENV` exists so the
suite never touches "this machine's real Claude Code config as a side
effect of running the test suite." Those 10 tests violated the stated
intent of the very constant sitting in their own imports — and made the
test suite **network-dependent**, which nobody chose and nothing declared.
A fake `HOME` was the only reason it stayed harmless.

A one-line fix repeated 10 times, not an architectural change. Two details
mattered:

- **Both syntactic shapes had to be covered.** Nine sites were the property
  form `env: { ...process.env, HOME: homeDir }`; the tenth was a variable
  binding, `const env = { ...process.env, HOME: homeDir };`. A find-replace
  keyed on the property form matches nine and silently leaves one ~11s
  real-CLI spawn behind — which would then read as an unexplained residue
  and invite a wrong conclusion about the root cause.
- **Three `fgos doctor` spawns leak the same way** and were deliberately
  left out of scope, recorded as a boundary rather than missed —
  `checkClaudePluginMarketplace` is registered once in the check registry,
  so `doctor` reaches it exactly as `setup` does.

### Measured result

| Metric | Before | After | Delta |
|---|---|---|---|
| Wall-clock | ~50s | **43.70s** | −6.3s |
| CPU (user+sys) | 429s | **374.39s** | **−54.6s (~12.7%)** |

Test count held at 2878, `fail 0`.

### A wall-clock saving is not a CPU saving

The item predicted "429s → ~319s". That was wrong in kind, not just in
magnitude: it subtracted a *wall-clock* saving from a *CPU* total. The
unblocked path costs ~0.12s CPU per test — the other ~11.4s is network
wait, which occupies wall time without consuming CPU.

Validation caught the category error and corrected the estimate to ≈22s of
CPU recovered. The real figure was **54.6s** — the correction was right
about the confusion and still under-counted, because a per-test probe
measured in isolation does not capture what the unblocked path costs inside
a fully parallel run. Both estimates missed; only the post-change
measurement was right.

## Why the acceptance threshold became relative instead of absolute

The original target was an absolute `npm test` ≤ 45s. It was superseded by
a relative one: at least a 60% reduction against a baseline measured
immediately before the change (169.76s → ≤68s).

Two reasons, both from the numbers above. The absolute target contradicted
the mechanical-split constraint — the suite settles at ~50s and mechanical
splitting cannot go further, so 45s was unreachable without doing the thing
that was explicitly out of scope. And an absolute second-count breaks when
the machine changes: 45s on a 16-core box is impossible on a smaller one,
while "60% below this machine's own baseline" survives the move.

The 45s figure had been fixed before anyone had measured 429s of CPU across
8.5 of 16 cores. The measurement is what retired it.

## A measurement inside a verify must prove it is a number

Three separate bugs hit while timing files in a verify command, all the
same class, and all **silent** — the verify still "ran", it just was not
measuring what it thought:

1. `{ /usr/bin/time -f %e node --test "$f" >/dev/null 2>&1; } 2>&1 | tail -1`
   — the `2>&1` swallows `time`'s output along with node's, so the
   measurement came back empty. `awk -v s="" 'BEGIN{exit (s>30)}'` returns
   0, meaning **every file passed no matter how slow it was**. Fixed with
   `time -o <file>`.
2. Added `case "$s" in ''|*[!0-9.]*)` so a measurement that is not a number
   turns the verify red instead of being skipped. This guard is what caught
   the third bug.
3. `/usr/bin/time -o` writes an *extra* line, `Command exited with non-zero
   status 1`, whenever the measured command exits non-zero — and `npm test`
   in this repo always does, because of a pre-existing guard. The
   measurement became two lines, and guard (2) caught it. Fixed with
   `tail -1` instead of `cat`.

The general lesson: a measurement inside a verify has to prove it is a
number and has to read the right line. Otherwise it measures nothing and
stays green.

A fourth failure in the same family closed this series. One item's `verify`
field was written as Vietnamese prose describing the thresholds to check.
`fgos return` executes `verify` through `/bin/sh`, so it died immediately
on the `(` in that prose — `/bin/sh: 1: Syntax error: "(" unexpected`, exit
2 — and could never have passed no matter what the code did. It was fixed
by making `verify` the runnable command `npm test` and moving the
test-count / CPU / wall-clock thresholds to the review gate, read by a
person from the measured-result table.

That relocation is the honest resolution, not a workaround: `/usr/bin/time`
reports numbers but cannot assert a threshold, so no single shell command
could have enforced those thresholds as written. A verify field must be a
command that runs; a threshold that only a reader can judge belongs at the
gate, not in a string the shell will try to execute.
