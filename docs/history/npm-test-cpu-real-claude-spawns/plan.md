# plan — cut npm test CPU by blocking real `claude` CLI spawns

Item: `tsk-1opx`. Decisions: [`CONTEXT.md`](./CONTEXT.md) (D1–D5).
Evidence: [`RESEARCH.md`](./RESEARCH.md) (F1–F6).

Mode: small

One flag applies from the mode gate: **existing covered behavior**. The 10
tests today run `fgos setup` with the real `claude` reachable, so they
exercise the live branch of `checkClaudePluginMarketplace`
(`src/setup/registrations.mjs:860`); after the edit they exercise the
blocked branch. That is a change in what already-covered behavior covers,
and it needs proving, not assuming (see Risk map).

No hard-gate flag applies: no auth, no authorization, no data model, no
audit/security control, no removed validation. The change only redirects
`FGOS_CLAUDE_COMMAND`, a seam `registrations.mjs:822` documents as
test-only (CONTEXT D2, RESEARCH F2). A smaller lane would not honestly
cover it — `tiny` reads as "a couple of files, one direct task" and this
touches 5 files with a behavior-coverage question attached; `small` is the
honest fit at 5 files, one direct task, no gray areas left open.

## Approach

Swap the spawn environment in the 10 enumerated sites from `process.env` to
the harness's `NO_CLAUDE_ENV`, then measure. Nothing else.

Rejected along the way, both disproved by this item's own measurements
rather than by argument:

- **Pool or share the git fixture** — a real git repo costs 13ms
  (RESEARCH, round 1 preamble). Pooling would add shared mutable state to
  the suite to reclaim milliseconds.
- **Add a new stub binary or a fresh env seam** — unnecessary;
  `NO_CLAUDE_ENV` already exists for exactly this and is already imported
  by all 5 files (CONTEXT D2, RESEARCH F1).
- **Fold in the 3 `doctor` sites and the `test/cli` spawn work now** —
  deferred by CONTEXT D4/D5, so the measurement stays attributable to one
  change.

Files touched (all test-only; no production source file changes):

| File | Sites |
|---|---|
| `test/setup/checks-setup-config.test.mjs` | 45, 58 |
| `test/setup/checks-setup-envelope.test.mjs` | 46, 64 |
| `test/setup/checks-setup-hookspath.test.mjs` | 44, 57 |
| `test/setup/checks-setup-rc-line.test.mjs` | 44, 71 |
| `test/setup/checks-setup-idempotent.test.mjs` | 44, 68 |

Order: the 10 edits are independent of each other, so they land as one
change; the measurement follows it. `fgos graph --json` puts this item off
the critical path (`criticalPath.path` does not contain it) with
`topUnblock: []` — nothing else in the backlog waits on it, so no external
ordering constraint applies.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| The 10 tests' own assertions, now hitting the blocked branch of `checkClaudePluginMarketplace` instead of the live one (the one mode-gate flag) | Medium | Run the 5 files directly and confirm all pass, before running the full suite. If any assertion depended on the live branch's result, it fails here and the reason is visible in isolation rather than buried in a 2878-test run. |
| Site 10's different shape, `const env = ...` at `checks-setup-idempotent.test.mjs:44` (CONTEXT D3, RESEARCH F4) | Low, but silent if missed | After editing, `rg -- "\.\.\.process\.env" test/setup/checks-setup-*.test.mjs` must return zero matches. A count of 9 fixed sites means site 10 was missed. |
| Total test count regressing below 2878 | Low | The item's own verify already counts it; this edit adds and removes no test. |

`impact-analysis: full` — gitnexus is registered and reports `status:
present` (`fgos tool query --capability impact-analysis --status present`,
2026-08-11); per `CLAUDE.md`'s gate, `present` attests installation only,
never index freshness. It carries no weight for these proof points either
way: the change edits no production symbol, so there is no blast radius for
a code graph to report. The two proof points above are direct test runs,
which is stronger evidence here than a graph query.

## Shape

One honest piece of work — no split, no child items. Per CONTEXT D1 this is
a single mechanical edit across 5 files plus a measurement; splitting it
would create children whose verify commands could only be the same full
suite run, which buys nothing.

Cases worth proving against, at `small` depth:

- **Existing behavior must not regress** — the 5 target files pass, then
  the full suite passes with count ≥ 2878 (the Risk map's first two rows).
- **Boundary: the missed-site case** — zero remaining `...process.env`
  matches in the 5 files, so the win is all 10 sites and not 9.
- **The measurement is real, not assumed** — record actual CPU and
  wall-clock, and state them even if they miss the ~1.3s / ~319s
  prediction. CONTEXT D5 exists because this item's first assumption was
  already disproved once by measurement.

Proof command for this item as a whole (the item's own locked verify,
unchanged): `npm test` green with total tests not dropping below 2878 and
no new failures beyond the existing orchestrator guard error, plus
`/usr/bin/time -f "%e %U %S" npm test` showing total CPU (user+sys) clearly
below the 429s measured before the fix and wall-clock below ~50s.

## Assumptions

- **A1** — the 10 tests' assertions do not depend on the live
  `checkClaudePluginMarketplace` branch. Unproven at planning time; the Risk
  map's first proof point is exactly what settles it, and it is the reason
  the 5 files get run before the full suite.
- **A2** — the ~11s per-test cost is entirely the unblocked `claude`
  spawn, so blocking it recovers essentially all of it. Grounded in the
  item's own probe (126ms blocked vs 11,031ms unblocked) but not yet
  confirmed inside a full-suite run; the D5 measurement confirms or refutes
  it.

## Validation (reality check, 2026-08-11)

Verdict: **READY WITH CONSTRAINTS**.

A1 was proven without editing anything. Because the tests spread
`process.env` into the spawned child, exporting `FGOS_CLAUDE_COMMAND` in the
outer environment reaches `fgos setup` by the identical path `NO_CLAUDE_ENV`
would — so the post-edit state is directly observable on unmodified files:

```
FGOS_CLAUDE_COMMAND=/nonexistent/fgos-test-claude-binary \
  node --test test/setup/checks-setup-{config,envelope,hookspath,idempotent,rc-line}.test.mjs
-> tests 10, pass 10, fail 0, duration_ms 280.5   WALL 0.30 USER 0.95 SYS 0.29
```

All 10 pass on the blocked branch. A1 is proven, not flagged.

### Feasibility matrix

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| A1 — the 10 assertions do not depend on the live `checkClaudePluginMarketplace` branch | Medium | Run the 5 files on the blocked branch | The run above: 10/10 pass in 280ms | **PASS** |
| A2 — the ~11s per test is essentially all the unblocked spawn, so blocking recovers essentially all of it | Medium | Measure blocked vs unblocked | `node --test checks-setup-config.test.mjs` unblocked: 2 tests, WALL 23.08 USER 3.71 SYS 1.02. Blocked (above): 10 tests, WALL 0.30 USER 0.95 SYS 0.29 | **PASS for wall-clock, FAIL for CPU** — see C1 |

### Constraints

- **C1 — the item's predicted CPU saving is wrong, and the measurement says
  why.** Unblocked costs **2.37s CPU** per test but **11.54s wall**; blocked
  costs 0.12s CPU per test. So the ~11.5s per test is overwhelmingly
  *network wait*, not CPU. Across 10 tests the real CPU recovered is
  **≈22s** (429s → ≈407s, about 5%), not the ≈110s the item's
  "429s → ~319s" figure predicted. That prediction subtracted a wall-clock
  saving from a CPU total — two different quantities. The wall-clock win is
  the large one and is real: ≈115s of serialized wall time removed from
  these files (117.6s → 0.3s measured).

  This does not change the edit, which is still clearly worth making (the
  wall win, plus removing an unintended network dependency and the
  violation of `checks.test.mjs`'s own stated intent). It does mean the
  item's verify clause "total CPU clearly down from 429s" should be judged
  against ≈407s. Whether a 5% CPU reduction counts as "clearly down" is the
  person's call, not this session's, and it is raised rather than silently
  reinterpreted — the verify itself is left exactly as locked.

- **C2 — all 10 sites, both shapes.** Per CONTEXT D3, confirm with
  `rg -- "\.\.\.process\.env" test/setup/checks-setup-*.test.mjs` returning
  zero matches after the edit.

### Reality gate

| Dimension | Result | Citation |
|---|---|---|
| Mode fit | PASS | 1 flag (existing covered behavior), 5 files, one task — `small` is the honest lane; the flag's own risk was then actually proven, not assumed |
| Repo fit | PASS | All 10 sites read at the exact lines claimed; `NO_CLAUDE_ENV` at `test/setup/helpers/setup-checks-harness.mjs:41`, re-exported `:116`, imported at line 16 of all 5 files |
| Assumptions | PASS | A1 proven by the run above; A2 proven for wall and refuted for CPU, recorded as C1 rather than left as a silent assumption |
| Smaller path | PASS | None exists — the change is one token per site, reusing a constant the files already import |
| Proof surface | PASS | The item's own locked verify is a real runnable command; no placeholder |
| Impact-analysis posture | PASS | `fgos tool query --capability impact-analysis --status present` → 1 provider, `gitnexus:present`, matching the `full` posture the plan recorded. Carries no weight here regardless: no production symbol is edited |

## Measured result (after the edit, 2026-08-11)

All 10 sites landed, both shapes:
`rg -- "\.\.\.process\.env" test/setup/checks-setup-*.test.mjs` returns zero
matches, and the 5 files now carry 10 `...NO_CLAUDE_ENV, HOME: homeDir`
sites (2 per file). C2 satisfied.

The 5 files alone: `tests 10, pass 10, fail 0, duration_ms 283.6`,
`WALL 0.30 USER 0.93 SYS 0.29` — matching the pre-edit simulation (280ms) to
within noise, which confirms the edit reproduces exactly the state validation
had already proven.

Full suite, `/usr/bin/time -f "%e %U %S" npm test`:

| Metric | Before | After | Change |
|---|---|---|---|
| Total tests | 2878 (floor) | **2921** (pass 2916, fail 0, skipped 5) | above the floor, nothing lost |
| Wall-clock | ~50s | **43.70s** | −6.3s |
| CPU (user+sys) | 429s | **374.39s** (279.77 + 94.62) | **−54.6s (~12.7%)** |
| The 5 files' own share | 117.6s | 0.30s | −117.3s |

The item's locked verify is satisfied on every clause: green, count above
2878, CPU down from 429s, wall down from ~50s. `fail 0` — the run did not
even produce the pre-existing orchestrator guard error the verify allowed
for.

**C1 was too pessimistic, and the honest number sits between the two
estimates.** Validation predicted ≈22s of CPU recovered by extrapolating
per-test isolation timings; the real full-suite saving is 54.6s. Isolated
per-test measurement under-counted what the unblocked path actually costs
inside a fully parallel suite run. The original item prediction (≈110s) is
still not reached, so C1's core correction stands — a wall-clock saving is
not a CPU saving — but the CPU win is meaningfully larger than C1's own
figure. Both numbers came from single runs, so treat ±few-percent variance
as expected rather than reading 54.6s as exact.

## Outstanding questions

None
