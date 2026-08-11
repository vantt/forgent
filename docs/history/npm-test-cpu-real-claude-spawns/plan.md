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

## Outstanding questions

None
