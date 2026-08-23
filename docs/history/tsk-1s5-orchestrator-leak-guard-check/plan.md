# plan.md — tsk-1s5

Mode: tiny

Lane decided directly (this session's own Orient, no `fgos-routing`
hand-off in this chain): 0 hard-gate/scope flags apply — no auth,
authorization, data model, audit/security, external system, public
contract, or cross-platform change. `tiny` per `fgos-routing`'s own
Mode-gate (0–1 flags → tiny/small).

## Approach

CONTEXT.md D1 already settled this: the leaked "orchestrator" term this
item reports was already fixed by commit `10c0bed5`, already an ancestor
of this item's own worktree branch. There is nothing to build — the one
honest piece of work is running the item's own verify command and
confirming it already passes, then returning the item.

**Revised at `fgos-coding-validating` (reality-gate FAIL, first pass):** writing
this item's own required CONTEXT.md/RESEARCH.md/plan.md — each legitimately
discussing the leaked "orchestrator" term as its own subject matter — trips
the same guard test this item's verify command runs (`node --test
test/docs/launcher-vocabulary-guard.test.mjs` went 9/10, one NEGATIVE
failure naming exactly those 3 new paths as offenders). This is the
established "self-referential mention" shape `docs/how-to/allowlist-a-
historical-mention-in-launcher-vocabulary-guard.md` already documents
(same reasoning as `docs/history/launcher-vocabulary-rename/CONTEXT.md`/
`plan.md`'s own allowlist entries) — not a regression to dodge by rewriting
prose around the word. One file IS touched: `test/docs/launcher-vocabulary-
guard.test.mjs`, adding 3 `ALLOWED_FILES` entries (one per new doc) per
that how-to's step 3. Re-run after the addition: 10/10 pass.

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): `gitnexus` present → full posture, but
not load-bearing here since the one touched file (`ALLOWED_FILES_ENTRIES`,
data-only) carries no behavior change to any symbol.

## Shape

Single piece, no split — a verify-only confirmation of an already-landed
fix, plus the one additive allowlist fix the item's own paper trail made
necessary. Concrete case to prove: `node --test
test/docs/launcher-vocabulary-guard.test.mjs` exits 0 with all 10 tests
passing (re-confirmed after the `ALLOWED_FILES` addition; will be
re-confirmed again at Execute time).

## Proof surface

- Command: `node --test test/docs/launcher-vocabulary-guard.test.mjs`
- Expected: all 10 tests pass, exit 0 — confirmed after adding the 3
  `ALLOWED_FILES` entries for this item's own CONTEXT.md/RESEARCH.md/
  plan.md.

## Outstanding questions

None
