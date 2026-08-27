---
framework: diataxis
mode: explanation
---
# Why `fgos move --to awaiting-approval` refuses a `doing` item without `--skip-return-guard`

`fgos return` is the one verb built to prove real progress before an item
crosses `doing -> awaiting-approval`: it checks the branch actually
advanced (or the caller passed `--no-new-commits-ok`), the working tree is
clean, and the item's own `verify` command actually passes
(`bin/fgos.mjs:1427-1579`, RUL19). Before tsk-280, `fgos move <id> --to
<status>` (`bin/fgos.mjs`, `moveWork` -> `src/state/fsm.mjs`) had zero
precondition beyond "is this an FSM-legal transition" — so `fgos move <id>
--to awaiting-approval` silently bypassed every one of `return`'s
guarantees. An item could be marked "approved" with no branch-advance
check, no clean-tree check, and no verify run at all.

This wasn't hypothetical. It was reproduced live on 2026-07-29 with item
`tsk-mvp-test-1`: a verify-only item (no stage, no description, no code
diff expected) got correctly refused by `return` (branch had not advanced
past `branchHeadAtTake`), then was closed out anyway via `fgos move
tsk-mvp-test-1 --to proposed` on user instruction — skipping verify
entirely, with no warning.

## What changed

`move` now refuses `--to awaiting-approval` when the item's current
`status` is `doing` (the one precondition `return` itself checks,
`bin/fgos.mjs:1540-1559`), unless the caller passes an explicit,
non-empty `--skip-return-guard "<reason>"`:

- No flag, item is `doing`: refused. The error names `fgos return <id>`
  (and its own `--no-new-commits-ok` escape hatch) as the real door.
- `--skip-return-guard "<reason>"`, item is `doing`: proceeds, and the
  reason is logged to the decision log via `addDecision` before the move
  applies.
- `--skip-return-guard ""` (empty): still refused — same shape as the
  pre-existing empty-`--override-reason` refusal for `--to delivered`.
- Item is NOT `doing` (e.g. a legal correction from some other status the
  FSM allows): unaffected — the guard only fires on the one case `return`
  itself would also gate.

## Why a new flag name, not the existing `--override-reason`

`--override-reason` was already scoped, by its own error message,
specifically to the `--to delivered` / branch-reachability case ("moving
it to \"delivered\" here would record no merge evidence"). Reusing it here
would make one flag mean two structurally different guarantees depending
on `--to` (no merge evidence vs. no proof of real progress) — worse for a
future reader than a second, equally-shaped flag. Hence
`--skip-return-guard`, mirroring `--override-reason`'s exact shape
(required non-empty reason, logged the same way) for a different
guarantee.

## Why `move` doesn't just duplicate `return`'s checks

The fix deliberately does not replicate `return`'s disposable-worktree
goal-check/invariant-check machinery inside `move`. The point is that
`return` — the one verb designed to prove real progress — stays the only
door for that edge; `move` growing a second copy of the same proof
machinery would defeat the purpose of having a single guarded door at all.

## The breadth this touched, and why it was still low-risk

`move --to awaiting-approval` was in use as a test-fixture shortcut at 39
call sites across 7 test files (`test/cli/fgos-approve.test.mjs`,
`fgos-read.test.mjs`, `fgos-post-merge.test.mjs`, `fgos-merge.test.mjs`,
`fgos-move.test.mjs`, `fgos-return.test.mjs`, and the shared harness
`test/cli/helpers/fgos-cli-harness.mjs`). Every one of those needed
`--skip-return-guard "test fixture setup, not exercising return's own
guard"` (or an equivalently scoped per-call-site reason) added, since
those tests exist to set up fixtures for OTHER verbs — approve,
post-merge, merge, read — and were never meant to exercise `return`'s own
guard.

An env-var escape hatch (`FGOS_TEST_MODE=1` piggybacking on the shared
harness's `run()` choke point) was considered to avoid touching 39 call
sites individually, and rejected: an env-var bypass is trivially set
process-wide by accident, carries no per-call reason, and is never logged
to the decision log — strictly weaker than the explicit, audited flag
every other guard in the same function already uses. The wide touch was
judged **reversible** despite its size: every call site either already
had, or after the fix needed, an explicit independent flag; a missed or
wrong call site fails loudly as a red test in the same `npm test` run this
item's own verify already requires — never silently. This is a "shape is
large, risk is low" case, not a "shape is small, risk is high" one:
delegation-appetite (the tier ceiling) and reversibility are different
axes.

## Relationship to tsk-4on

tsk-4on (done, prior item) fixed a related but different gap: `return`
wrongly refusing a legitimately-already-complete item, which had been
pushing people toward the `move` bypass as a workaround, via
`--no-new-commits-ok`. That item closed the *motivation* for one class of
misuse; this item (tsk-280) closes the underlying hole itself — `move`
having no guard at all on this edge.

## Proof

`npm test` green (3168 passing) after the guard landed and all 39 call
sites were updated — the guard-refusal case, the flag-override case, the
empty-flag-refusal case, and every pre-existing fixture use of the old
shortcut are all part of that one run.
