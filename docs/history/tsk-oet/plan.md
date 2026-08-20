Mode: high-risk

## Why high-risk

Flags: audit/security (this fix touches the exact mechanism tsk-1ji built
for data-loss prevention, per docs/history/tsk-1ji-*; a wrong change here
can reopen the truncation-loss window tsk-1ji closed), existing covered
behavior (7 currently-passing-on-other-commits tests assert invariants
this same code path now violates), weak proof around the area (this
exact area already produced two live incidents — tsk-24e, tsk-64o —
before tsk-1ji's own fix). Any one hard-gate flag (audit/security) alone
routes to high-risk per fgos-routing's Mode gate; 3 flags total.

## Root cause (from docs/history/tsk-oet/RESEARCH.md Round 1 — bisection-confirmed)

The item's own original description attributed the regression to commit
`88619f23` (tsk-6al). That attribution is **falsified**: a detached
worktree checked out at `88619f23` runs the full 4 flagged test files
(`test/cli/fgos-take.test.mjs`, `test/cli/fgos-read.test.mjs`,
`test/cli/fgos-return.test.mjs`, `test/e2e/runner-loop.test.mjs`) 171/171
green. The real cause is the next commit on `main`, `5439eaa2` ("add
opportunistic truncation guard and periodic commit for events.jsonl",
already-merged item `tsk-1ji`, `mergedSha: 0cbde249...`), confirmed by
the same bisection method (checkout at `5439eaa2` reproduces 5/7 of the
failures directly).

`5439eaa2` added `runOpportunisticMainCheckoutChecks`
(`src/state/events-jsonl-truncation-guard.mjs:208`), wired into 3 real
call sites (`rg` cross-check, impact-analysis posture below):

- `src/runner/claim-port.mjs:123` — inside `claimWork`, runs on every
  `fgos take`/`pick`.
- `src/runner/merge.mjs:788` — inside `withMergeTargetSlot`, runs on
  every merge-lock acquisition.
- `src/runner/merge.mjs:911` — inside `mergeRunnerItem`, runs on every
  merge.

Two independent side effects fire on `repoRoot`/`lockRoot`, unconditionally,
every time any of the 3 sites run:

- **D1** — writes/advances `.fgos/events-jsonl.truncation-guard.json`, a
  brand-new tracked file. Every test asserting "only `.fgos/events.jsonl`
  (or nothing) is dirty" now sees an extra dirty path.
- **D2** — if `.fgos/events.jsonl` is dirty and its last real commit is
  `>= 900s` old (or never committed — the common case for a freshly-init'd
  test fixture), runs a real `git add` + `git commit -m "chore(.fgos):
  periodic events.jsonl checkpoint"` directly against that repo. This
  advances `HEAD`, which is exactly what every SHA-comparison assertion
  in the failing tests (`gitHead(cwd) === mainHeadBefore`) catches.

## This is NOT a bug to revert — it's an untested collateral-damage gap

Checked `docs/history/events-jsonl-merge-abort-truncation-gap/CONTEXT.md`
(tsk-1ji's own locked decisions) directly: **D2 there is an explicit,
human-answered decision** — "auto-commit cadence for `.fgos/events.jsonl`
on the shared main checkout is time-based periodic." The periodic
auto-commit itself is intentional, locked product behavior (visible live
in this repo's own recent commit log: `chore(.fgos): periodic events.jsonl
checkpoint`, e.g. `b354b996`, `9f4fe7d6`, `1b347c58`). Per this repo's own
review-audit-self-decision rule, a locked human decision is not
reversible here just because it collaterally breaks other tests — that
would need to be presented as options to a person, not silently undone.

**What tsk-1ji's own scope actually missed:** its own `verify`
(`node --test test/runner/claim-port.test.mjs test/runner/merge.test.mjs`)
never ran the broader suite, so it never caught that `claimWork`/
`mergeRunnerItem` are called from many OTHER tests
(`fgos-take`/`fgos-read`/`fgos-return`/`runner-loop`) that use
`initGitCwdMain()`-style self-contained git fixtures and assert
clean-tree/HEAD-unchanged invariants having nothing to do with
truncation-guard/periodic-commit — none of those tests opted into this
new side effect, and none of them can opt out of it either. That is the
real gap this item fixes: give a caller a way to opt a repo root OUT of
`runOpportunisticMainCheckoutChecks` entirely, without touching its
default (on) production behavior on the real main checkout.

## Approach

Add an explicit, precedented env-var opt-out, checked first thing inside
`runOpportunisticMainCheckoutChecks`
(`src/state/events-jsonl-truncation-guard.mjs:208`):

```js
if (process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS === '1') return;
```

Precedent for this exact shape already exists in this codebase for
test/probe-only overrides: `FGOS_SHELL_INTEGRATION_PROBE_SCRIPT`
(`src/setup/registrations.mjs:339`), `FGOS_GH_COMMAND` (`bin/fgos.mjs:246`).
This is not a new pattern.

**Revised at validating (reality-gate FAIL, recorded via `fgos decision`):**
the first draft of this Approach wired only the shared CLI test harness
(`test/cli/helpers/fgos-cli-harness.mjs`'s `initGitCwdMain()`). Direct
read of `test/e2e/runner-loop.test.mjs` (one of the 4 originally-broken
files) found it does NOT import that harness — it has its own inline git
fixture and spawns `fgos`/`fgos-runner` via `spawnSync(process.execPath,
[FGOS, ...args], { cwd, encoding: 'utf8' })` (lines 47/51) with no `env:`
key, so it inherits the parent process's env by default. Wiring only the
harness would leave this file's regression unfixed.

Set the opt-out at the **npm test script level** instead, so it covers
every spawned `fgos`/`fgos-runner` subprocess (inherited env, regardless
of which fixture helper a file uses or whether it uses one at all) AND
every in-process call (`claimWork`, `mergeRunnerItem` called directly by
a test in the same process):

```json
"test": "FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'"
```

Only the 2 test files that exist specifically to exercise D1/D2
(`test/state/events-jsonl-truncation-guard.test.mjs`,
`test/runner/claim-port.test.mjs`'s own
`runOpportunisticMainCheckoutChecks` assertion at line 482) unset it
locally at their own top (e.g. `delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS`)
so the feature they test still actually runs. This is safe with no
cross-file leakage: empirically confirmed (`node --test a.test.mjs
b.test.mjs` with `a` setting a var in its test body — `b` reads
`undefined`) that `node --test` runs each matched file in its own child
process, so one file's env mutation never reaches another file in the
same run.

**Alternatives rejected:**

- *Revert 5439eaa2 / disable D2 by default* — rejected: reverses a
  locked, human-answered decision (tsk-1ji CONTEXT.md D2) without
  presenting it as an option to a person first, and is already visibly
  running correctly in production (real periodic-checkpoint commits
  already in this repo's own `main` history).
- *Update the 7 failing tests to tolerate a possible periodic-commit
  side effect instead of adding an opt-out* — rejected: those tests exist
  to prove specific, narrow invariants (clean-tree gate, exempt-footprint
  self-check, "return never advances the human's main checkout") that
  have nothing to do with truncation-guard/periodic-commit; teaching
  every one of them to tolerate an unrelated concern's side effects
  (nondeterministically, since D2's `>= 900s` staleness check is
  timing-dependent) would weaken what they actually prove instead of
  fixing the real gap (no opt-out existed).
- *Gate on `NODE_ENV==='test'` instead of a dedicated env var* — rejected:
  not an existing convention in this codebase (`rg` cross-check: no
  production code branches on `NODE_ENV` today) and would silently change
  behavior for anyone else who happens to run with `NODE_ENV=test` for
  unrelated reasons; an explicit `FGOS_*` opt-out name matches this
  repo's existing convention exactly.

## Impact-analysis posture: degraded

Per `CLAUDE.md`'s impact-analysis capability gate: GitNexus is registered
and `present`, but the only index covering this repo
(`/home/vantt/projects/forgentX`) is **1102 commits behind HEAD**
(`gitnexus list_repos`) — none of the per-worktree indices correspond to
this item's own worktree either. Posture: **degraded**. Blast-radius
evidence above is NOT from GitNexus — it is a direct `rg -n
"runOpportunisticMainCheckoutChecks" --glob '*.mjs' src bin test`
cross-check (3 real call sites + 3 test files referencing it, listed
above), per the capability gate's own instruction to cross-check a
stale/suspicious answer instead of trusting it blind.

## Risk map

| Component | How risky | Proof point (for validating) |
| --- | --- | --- |
| `runOpportunisticMainCheckoutChecks` early-return gate | Medium — wrong env-var check could accidentally disable the feature in production if the var leaks into a real session's environment | Proof: run the 2 dedicated D1/D2 test files (`test/state/events-jsonl-truncation-guard.test.mjs`, `test/runner/claim-port.test.mjs`) UNCHANGED (opt-out not set) and confirm they still pass — proves the feature still fires when the var is absent |
| npm test script env wiring | Low — additive, one env-var prefix in `package.json`'s `test` script; confirmed via direct empirical check that `node --test` isolates `process.env` per matched file, so the 2 dedicated D1/D2 files unsetting it locally cannot leak into or be leaked into by any other file | Proof: the 4 originally-failing files (`fgos-take`/`fgos-read`/`fgos-return`/`runner-loop`) all green after the change, AND the 2 dedicated D1/D2 files still pass unchanged (feature still fires when the var is unset locally) |
| Full-suite collateral | Medium — same class of gap that let this regression land unnoticed (narrow verify scope) | Proof: full `npm test` green, not just the 4 flagged files — this item's own verify (below) is intentionally the full suite, not a narrow slice, specifically because tsk-1ji's narrow verify is what let this happen |

## Files touched (order)

1. `src/state/events-jsonl-truncation-guard.mjs` — add the opt-out gate
   at the top of `runOpportunisticMainCheckoutChecks`.
2. `package.json` — prefix the `test` script with
   `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`.
3. `test/state/events-jsonl-truncation-guard.test.mjs`,
   `test/runner/claim-port.test.mjs` — unset the var locally at the top of
   the specific tests exercising D1/D2, so they keep proving the real
   feature still works under `npm test`.

Not on the critical path and unblocks nothing (`fgos graph --json`'s
`topUnblock` does not list it) — no external sequencing constraint.

## Split decision

Pass-through — one coherent piece. The fix (gate + harness wiring) and
its own proof are inseparable: an opt-out with no caller wired to use it
proves nothing, and wiring the harness without the opt-out existing is
not buildable. tier/risk already set to `heavy` at discovery (matches
this high-risk lane).

## Outstanding questions

None
