# P01 — Current Hotspot And Leak Removal

**Status:** stop, no candidate accepted. Working tree is byte-identical to before this phase (one candidate was mutated, measured, and reverted; only this report is new).

## Search process

### Class A — accidental external provider/network/process

Searched the top-30 profiled files (`plans/.../reports/proof-inventory.json`) for real `gh`/`curl`/`wget`/`npm install`/`fetch`/`http(s)://`/`claude`/`codex`/`agy` invocations:

- Every `gh`-touching test (`fgos-merge.test.mjs`, `fgos-merge-2.test.mjs`, `fgos-approve-5.test.mjs`) already injects `FGOS_GH_COMMAND: <fake>` — no accidental real `gh` call exists.
- `runner/dispatch.test.mjs`'s `https://` strings are either loopback (`http://127.0.0.1:<port>`), an intentionally-invalid domain (`http://example.invalid/hook`), or literal config values being asserted (`ANTHROPIC_BASE_URL` resolution), never a real outbound call.
- `test/setup/doctor-fresh-run.test.mjs` ("fresh external project reaches expected fgos doctor state after init + setup", 13.68s) does run a real `npm install -g` — but that IS the invariant under test (a real packaging/distribution e2e proof), and it already injects `FGOS_CLAUDE_COMMAND: /nonexistent/...` to avoid the one incidental provider reach (`claude-plugin-marketplace` check) that is NOT part of that invariant. Not a candidate: rule 1 ("not explicitly proving that external boundary") fails — it explicitly is.
- `test/setup/self-uninstall-spike.test.mjs` ("removes a real npm -g installed package on this platform", 9.02s) explicitly proves real package removal. Not a candidate for the same reason.
- `test/rust-host/fgctl-init.test.mjs` / `fgctl-upgrade.test.mjs` invoke the real `FGCTL_BIN`/`FGOS_BIN` and real local `git`, never a network/registry call — their cost is the real Rust/Node boundary + local Git, both asserted, not accidental.

**No class-A candidate found.** The codebase already consistently uses fake-command injection at every real external-provider seam encountered.

### Class B — oversized live-state/repository-history fixture

Scanned the top-30 files for bulk-seeding loops (`for (let i = 0; i < N`, `Array.from({length: N`, N ≥ 20 as a starting filter). One hit: `test/runner/loop.test.mjs:1744` builds 25 items — not oversized in a material sense, and `loop.test.mjs`'s cost (58.61s / 92 tests) is already flagged in P00A as execution-count-driven, not a single-fixture outlier. No file in the top-30 folds/scans a full real event store where the invariant needs a small persisted shape.

**No class-B candidate found.**

### Class C — obvious fixture-only subprocess outside the P02 batch

Reused `scripts/test-proof-inventory.mjs`'s `inventoryRunInitSites` (P00A tooling) against the other top-30 `test/cli/*` files not already owned by P02's nine-file lease. Found **25 genuine fixture-construction sites** across 4 files, all `run(cwd, ['init'])` with the result discarded and `cwd` built via the non-subdir `initGitCwdMain()`:

| File | Sites |
|---|---:|
| `test/cli/fgos-post-merge.test.mjs` | 2 |
| `test/cli/fgos-post-merge-3.test.mjs` | 8 |
| `test/cli/fgos-post-merge-4.test.mjs` | 7 |
| `test/cli/fgos-approve-6.test.mjs` | 8 |

**Root cause traced:** `initGitCwdMain()` itself calls `tmpCwd()`, which already runs a real `fgos init` subprocess on a git-less tmp dir before git is initialized. These 25 call sites then run a *second* real `fgos init` subprocess afterward, once git exists, because the tests need `.fgos/`'s coexistence/branch detection to reflect a real git repo. The first init (inside `tmpCwd()`) is fully superseded and wasted for these particular callers — a genuine execution-duplication cost, not a guess. None of the 25 sites assert anything about `init`'s own output/process/cwd behavior; all are pure precondition setup for `cleanup`/`approve`/post-merge business logic.

**Fix attempted (then reverted — see below):** replaced each site's second `run(cwd, ['init']);` with the existing, already-proven, already-exported `initFgosFixtureInProcess(cwd)` helper (used pervasively elsewhere via `tmpCwdFast()`; not new code). Deliberately did **not** touch the shared `initGitCwdMain()` definition itself, since GitNexus confirms it and `tmpCwdFast()`'s underlying helper are used far more broadly (`initGitCwdMain` alone is used by 14 other test files) — changing the shared function would exceed this candidate's scope and risk files this phase never traced.

## Impact analysis (correction to P00/P00A's "inactive" note)

`mcp__gitnexus__impact({ target: "initFgosFixtureInProcess", direction: "upstream", repo: "/home/vantt/projects/forgentX" })` — **this MCP tool is live and returned real data** (`direct: 2` callers — `tmpCwdFast`, `fgosTemplateSourceDir` — matching a manual grep exactly), correcting P00/P00A's "impact-analysis: inactive" note: that note was based only on `fgos tool query --capability impact-analysis` (fgOS's own dispatch-executor registry, relevant to whether fgOS would *delegate* impact-analysis work to a registered provider), not on whether this session has the `mcp__gitnexus__*` tools directly — it does, and they work.

Reported risk: **CRITICAL**, `impactedCount: 433` (depth-3 fan-out through `tmpCwdFast`, which hundreds of tests call). This number describes the blast radius of *changing `initFgosFixtureInProcess`'s own behavior* — not relevant here, since this phase only added new call sites to an unchanged function (the same reuse pattern P02/P06 already bless for `tmpCwdFast`/`initGitCwdFast`). Degraded-evidence note: this repo's GitNexus index is registered against the main checkout path (`/home/vantt/projects/forgentX`, branch `main`, 8 commits behind HEAD) — not this specific worktree/branch — so treat the exact call list as accurate for this stable, long-lived helper (unlikely to have new callers appear only on this branch) but not as fresh, branch-scoped ground truth.

## Measurement (Candidate C, reverted)

Focused set: the 4 files above, `node --test <files>`, `/usr/bin/time -f`. Threshold registered before mutation: `max(10% of focused median, 2 × focused run-to-run range)`.

| | Sample 1 | Sample 2 | Sample 3 | Median |
|---|---:|---:|---:|---:|
| Before wall (s) | 18.91 | 18.73 | 18.83 | 18.83 |
| After wall (s) | 17.27 | 17.18 | 17.04 | 17.18 |

- Threshold: max(1.883, 2×0.18=0.36) = **1.883s**
- Measured delta: 18.83 − 17.18 = **1.65s (8.76%)**
- **Below threshold** — not accepted, despite zero overlap between the before/after sample sets (before min 18.73 > after max 17.27), i.e. a real, reproducible, low-noise effect that is simply smaller than the pre-registered bar. Per the plan's explicit rule ("revert...report stop rather than rationalizing it"), this is reverted rather than kept on a "close enough" basis.
- User CPU (process-tree) told a similar story: median 67.90s → 61.47s (≈9.5%), also short of 10%.
- All 55 tests passed, before and after, both count and pass total unchanged.
- `git checkout -- <4 files>` confirmed the tree is byte-identical to pre-mutation; no test deleted, no helper code left behind.

## Disposition

**stop.** No class-A, class-B, or class-C candidate cleared the pre-registered material-effect threshold on this current-tree snapshot. This is consistent with, and sharpens, P00A's own finding ("no mechanically-confident execution-duplication/leak candidate... likely legitimate, needs its own trace, not a quick win"): a genuine, traced, execution-duplication cost DOES exist (the double-init pattern), but its magnitude at this specific 4-file/25-site scope is below the bar this track set for itself. A larger batch (e.g. extending the same fix to some of the other 10 files that also call `initGitCwdMain()`) might cross the threshold, but that is new scope this phase's registered candidate did not cover and is not opened here.

## Verification

- `node --test <4 files>` — 55/55 green, before and after (both discarded per revert).
- `git diff --check` — clean (no residual changes).
- `npm test` (full suite) — not run for this phase: the only artifact this phase adds is this report; no product or test file differs from the already-verified P00A commit.

## Handoff

- The double-init pattern (`initGitCwdMain()` → internal `tmpCwd()` real init, then a second real init) is real and could be revisited as its own future candidate at a wider scope (all 14 `initGitCwdMain()` callers, not just these 4) if a later phase wants to reopen it — flagged here, not acted on.
- P02 proceeds independently on its own (already-scoped, already-verified-real) 4-site fixture-construction candidate inside the nine-file lease (see P00A report); it does not depend on this phase's `stop`.
