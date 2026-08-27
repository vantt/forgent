---
framework: diataxis
mode: explanation
---
# Why `resolvePlan`'s pass-through path now checks `planApproveVerify` before `executing`

`resolvePlan` (`src/intake/plan.mjs`) computes `planApproveVerify =
view.gates?.[id]?.planApprove?.verify ?? work.verify` once, then moves the
item to `executing` (via `moveStage`) with zero correctness check on that
value — unlike `resolveDiscovery`'s own caller-verdict path, which runs
`judgeVerifySemanticCorrectness` on a proposed verify before accepting it.
An item could reach `executing` carrying a verify command nobody had ever
mechanically checked.

## Scope was narrowed from the original description — and why

The item's original framing proposed a bigger move: relocate
verify-judgment ownership out of clarify/discovery entirely, into
`validateApprove` plus a per-child check in `resolvePlan`. That framing's
cost premise was that `judgeVerifySemanticCorrectness` was an expensive
LLM subprocess judge (90s–4min per dispute) — worth moving out of the hot
path. By the time this item was worked, that premise had gone stale:
`tsk-1x3` (D9/D17) had already retired the LLM subprocess judge for an
unrelated reason (native-first dispatch waste) and replaced it with a
near-free mechanical regex check
(`src/intake/verify-pattern-check.mjs`) that catches one specific error
pattern (a `node --test` + TAP-reporter grep trap) and otherwise almost
always returns `agrees: true`.

A live rescan (`docs/history/verify-judgment-at-clarify/RESEARCH.md` Round
1) confirmed two things stayed true despite the stale premise: (a)
`resolveDiscovery`'s own two branches are still genuinely inconsistent
(the locked-context path skips the check, the caller-verdict path still
runs it) even though the cost argument for caring is now weak, and (b)
the "known adjacent hole" — `resolvePlan`'s pass-through path stamping
`planApproveVerify` with no check at all — was untouched by the drift and
remained a real gap.

Given a weakened cost premise, three scope options were put to a person:
(1) still do the full contract-level move as originally described, (2) do
a smaller fallback (drop the second pass from `resolveDiscovery` only,
touch nothing in `resolvePlan`/gates), or (3) narrow to just the known
adjacent hole. **Locked: option (3).** The `resolveDiscovery`
inconsistency was dropped — not deferred — because the cost premise that
would have justified changing its stage-FSM contract no longer holds.
This item's remaining scope is exactly the twin of `tsk-14a`: `tsk-14a`
made sure `work.verify` gets synced with the item's real, designed verify
on a pass-through path; `tsk-4m4` (this item) checks that value once
`tsk-14a` has already ensured it isn't a blind placeholder.

## The fix touches four call sites, not one

The original description named one call site
(`plan.mjs`, the explicit `--verdict pass-through` branch). Direct
reading of the current file on `fgw/tsk-4m4` found `planApproveVerify`
actually feeds **four** separate `moveStage` call sites, all reusing the
same unchecked value:

1. The `hasChildren` crash-recovery re-entrancy branch (children already
   exist from an interrupted prior call; only the root's own stage-move
   remains).
2. The tiny/small skip-and-advance trust signal (no `callerVerdict`).
3. The explicit `--verdict pass-through` branch (the one originally
   named).
4. The real `--verdict decompose` (split) success path — even when
   children are created with their own forced-real verify
   (`normalizeChild`), the root's own move to `executing` still carried
   the same unchecked value.

Since all four are gated by the identical value, computed once, the fix
is one check run once, immediately after `planApproveVerify` is computed
(`src/intake/plan.mjs:552-591`), before any of the four branches below it
execute — never four separate checks. This mirrors `resolveDiscovery`'s
own dispute-handling shape and the same file's existing per-child check
(the `disputedChild` pattern already used for the `decompose` verdict's
own children): same `judgeVerifySemanticCorrectness` call, same
park-on-disagreement via `putInAwaiting`, same `callerVerdict?.force ===
true` override — except a mechanical disagreement
(`secondPass.mechanical === true`) is never overridable by `--force`,
the same carve-out already precedented at the sibling child-dispute call
site.

Placing the check before all four branches — including the crash-recovery
one — is safe: an item mid-flight with real children being parked now on
a verify dispute it was never checked against before is strictly safer
than the prior silent pass-through, and a person resuming a
crash-recovered item is exactly the audience this check exists to reach.
A narrower fix (checking only the one originally-named call site) was
rejected: all four share the identical unchecked value, so fixing one and
leaving three open would be an incomplete, misleading fix under the same
title.

## Hit the sibling bug live, during this item's own return

While returning this item, the `fgw/tsk-4m4` branch's own `verify` had
never been synced — the exact bug `tsk-14a` fixes, whose own merge hadn't
landed yet at the time this item was worked (branch friction:
`goal-check failed on branch "fgw/tsk-4m4"`, exit 127). Resolved live with
`fgos edit --verify` followed by re-returning — direct confirmation, from
the inside, that `tsk-4m4` (the check) and `tsk-14a` (the sync) really are
two halves of one gap: without the sync fix, this item's own check had
nothing trustworthy to check yet.

## Proof

`npm test` green (3168 passing) after the check landed at all four call
sites, covering: dispute parks with `outcome: 'verify-disputed'`;
`--force` overrides a non-mechanical dispute; `--force` does NOT override
a mechanical one; an undisputed verify is unaffected on all four branches.
