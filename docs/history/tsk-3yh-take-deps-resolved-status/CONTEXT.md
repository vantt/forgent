# tsk-3yh-take-deps-resolved-status — locked decisions

Item: `tsk-3yh`. Source ticket (raw, untrusted per RUL45, translated from
Vietnamese): `isDepsAndLineageReady` (`src/state/frontier.mjs`, used by
`bin/fgos.mjs:1594`'s `take --id` explicit branch to gate claim of a
`todo` item) checks a dep's status with the literal `=== 'done'`, NOT
`RESOLVED_STATUSES` (which also covers `delivered`/`retrospective`/
`cleanup`/`wontfix`) the way `frontier()` right next to it in the same
file already does. The function's own header comment claims parity with
`frontier()`'s clauses, but the code diverges from that claim. A dep sitting
at `delivered` (already merged to main, verified, only not yet through
compound-learn to `done`) is treated as resolved by `frontier()` but still
blocks `take --id` on anything depending on it. Real 2026-08-02 repro:
`tsk-4voj` is `status:delivered` (merge commit `6daef60` on `main`,
decisions D1/D2 locked, only compound-learn left) and `tsk-3bn` (which
depends on it) cannot be claimed via `take --id tsk-3bn` under the current
code — blocking the merge-harness cluster of work this ticket itself is
part of (see `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`).

## Feature boundary

Fix `isDepsAndLineageReady` (`src/state/frontier.mjs:108-115`) so its
dep-readiness check reads `RESOLVED_STATUSES.has(work[dep]?.status)`
instead of `work[dep]?.status === 'done'` — the same set `frontier()`
(`frontier.mjs:93`) and every other consumer (`graph-metrics.mjs`,
`entropy.mjs`, `graph-harness.mjs`, `impact.mjs`, `claim-port.mjs`)
already use. Nothing else in the function changes: the
`hasOpenDescendant` lineage guard (already correctly using
`RESOLVED_STATUSES`, `frontier.mjs:188`) is untouched, and no other
function or file is in scope.

## Locked decisions

No Socratic questions were asked — none passed the material/grounded/
answerable bar. The source ticket already states the exact root cause
(literal `'done'` check vs `RESOLVED_STATUSES`), the exact fix (swap to
`RESOLVED_STATUSES.has(...)`, mirroring `frontier()`), a real repro
(`tsk-4voj`/`tsk-3bn`), and the exact risk (this gate is system-wide for
every `todo` item's `take --id`, so both directions — a resolved status
must pass, a not-yet-resolved status must still block — need test
coverage). Scout below confirms every one of those claims against current
code; nothing was left for a person to decide. Per user instruction
2026-08-02 ("nếu đầy đủ thông tin và không còn gì unclear thì tự làm cho
tới khi xong" — this item blocks other work), this session proceeds
straight through without a human approval round trip, since the gate
question below has nothing left to ask about.

## Pinned terms

- **`RESOLVED_STATUSES`** — the shared terminal-status set exported at
  `src/state/frontier.mjs:172`:
  `['delivered', 'retrospective', 'cleanup', 'done', 'wontfix']`. The fix
  must import/reuse this exact export, never redefine an equivalent set
  locally.

## Scout evidence cited

- `src/state/frontier.mjs:93` — `frontier()`'s own dep-readiness clause:
  `item.deps.every((dep) => RESOLVED_STATUSES.has(work[dep]?.status))`.
- `src/state/frontier.mjs:100-115` — `isDepsAndLineageReady`, the buggy
  function. Line 114 is the literal `work[dep]?.status === 'done'` check
  that must change. Its header comment (100-107) already *claims* the
  same clauses as `frontier()`, confirming the divergence is a bug, not
  intended behavior.
- `src/state/frontier.mjs:150-172` — the comment documenting why
  `RESOLVED_STATUSES` exists and lists every consumer that is supposed to
  share it; `isDepsAndLineageReady` is conspicuously absent from that
  list despite living in the same file.
- `src/state/store.mjs:839-850` — `isDepsAndLineageReady(dir, id)`, a
  thin dir/rebuild wrapper around `frontier.mjs`'s function (imported
  there as `depsAndLineageReadyView`). This is the only caller of the
  buggy function — confirms there is exactly one implementation to fix,
  not two.
- `bin/fgos.mjs:1594` — `take --id`'s explicit-`--id` branch, the sole
  call site of `store.mjs`'s `isDepsAndLineageReady`. Confirms the blast
  radius named in the ticket ("gates claim system-wide") is accurate:
  every `todo` item claimed by id through `take` goes through this check.
- `src/runner/claim-port.mjs:159` — `pick`'s own analogous
  unresolved-deps check already uses `RESOLVED_STATUSES` directly, not a
  literal `'done'` check. Confirms `pick` is unaffected by this bug —
  only `take --id` is, matching the ticket's own scoping.
- `test/cli/take-pick-claim-eligibility.test.mjs` — the existing
  regression suite for `take --id` claim eligibility. It covers an
  unmet-dep rejection and an open-decomposed-child rejection, but has
  zero coverage for a dep sitting at a `RESOLVED_STATUSES`-but-not-`done`
  status (e.g. `delivered`). Confirms the gap is real and currently
  untested — the fix needs a new case added here, not a new test file
  (existing file already owns this exact behavior).
- GitNexus impact query on `isDepsAndLineageReady` independently found
  exactly the same two symbols (`store.mjs` wrapper, `frontier.mjs` real
  implementation) and the same call relationship — corroborates the scout
  above from a second source.
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` provider, `status: "present"` — impact-analysis posture is
  **full** for this item; `CLAUDE.md`'s gate applies the MUST rules as
  written for planning/validating/executing.
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  — the report this ticket was filed out of; lists `tsk-4voj` among the
  "8 existing bug fixes" prerequisite to trusting the merge-harness v2
  design's output.

## Outstanding questions deferred to planning

- Exact verify command for the item (currently a placeholder,
  `"chưa xác định — P15 bổ sung"`, on the item's own `verify` field) —
  implementer-level, `fgos-coding-planning`'s call, not a product decision.
- Whether the fix also warrants updating the header comment at
  `frontier.mjs:100-107` (it already describes the *intended* correct
  behavior, which the fix makes true) — cosmetic/implementation
  judgment, not a product decision.
