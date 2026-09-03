---
framework: diataxis
mode: explanation
---
# Why `decompose`'s skip-and-advance is narrower than `discovery`'s

`resolveDiscovery` already had a skip-and-advance trust signal: when a
non-empty `CONTEXT.md` exists, it skips `judgeDiscovery` and moves
straight ahead — a clarify-pass has nothing at stake by skipping, since
it's a pure judgment call with no side effect beyond the stage
transition itself. Porting the same idea to `resolveDecompose`
(`tsk-19j-2`, child of `tsk-19j`) needed to be **deliberately narrower**,
because a decompose verdict can do something a clarify-pass never
does: write real child work items.

## Why a literal port would be unsafe

```js
// DECOMPOSE-SIDE SKIP-AND-ADVANCE (tsk-19j D1/D3/D7, closes gap 3) —
// deliberately narrower than a literal port of resolveDiscovery's own
// trust signal: unlike a clarify-pass, a decompose verdict can WRITE REAL
// CHILDREN (addWork below) — skipping judgeDecompose blind would also
// skip the one thing that turns plan.md's documented split into real work
// items, which is never safe to assume away (this root's own tsk-19j
// needed exactly that real LLM call to produce its 3 children).
```

`tsk-19j` — the very root item this child belongs to — is itself living
proof: its own three children only exist because a real
`judgeDecompose` call actually ran and produced them. Blindly skipping
that call whenever a plan document exists would silently skip the one
mechanism that turns a documented split into real, addressable work
items.

## The one condition narrow enough to be provably safe

```js
// The only case where skipping is provably safe is when fgos-coding-planning's
// own mode gate (SKILL.md step 2) already guarantees no split is
// possible: `tiny`/`small` mode is single-piece by definition (0-1 risk
// flags). Detected by reading plan.md's own recorded mode line
// (fgos-coding-planning always writes one, per its own step 2 "Record the
// count, the flags, and the chosen mode in plan.md itself") — any other
// mode, or no match at all, falls through to the real judgeDecompose call
// below unchanged (fail-safe: an uncertain read must never skip a real
// judgment, same discipline discovery.mjs's own header states for
// judgeDiscovery).
const passThroughModeMatch = /\bmode\s*[:=]\s*\*{0,2}(tiny|small)\b/i.exec(lockedContext);
if (lockedContext && passThroughModeMatch) {
  const mode = passThroughModeMatch[1].toLowerCase();
  addDecision(dir, {
    id,
    text: `decompose skip: plan.md declares mode "${mode}" (tiny/small are single-piece by fgos-coding-planning's own mode gate), no model call`,
    source: 'resolveDecompose',
    rationale: 'tsk-19j D7 trust signal: plan.md already committed to no split, so judgeDecompose has nothing to judge — skipping avoids a pointless model round-trip, never a real child-generation decision',
  });
  moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', verify: planApproveVerify, role });
  releaseClaimOnExecuting();
  return { outcome: 'pass-through', id };
}
```

Only `fgos-coding-planning`'s own mode gate — `tiny`/`small` mode, which is
single-piece by definition (0–1 risk flags) — is narrow enough to make
skipping provably safe. If `plan.md` has already committed to
single-piece mode, there is nothing left for `judgeDecompose` to judge;
skipping just avoids a pointless model round-trip, never a real
child-generation decision. Any other mode, or no recognizable mode line
at all, falls straight through to the real `judgeDecompose` call —
fail-safe: an uncertain read must never skip a real judgment, the same
discipline `discovery.mjs`'s own header already states for
`judgeDiscovery`.

## Real verify, read from the approve record — closing a second gap

```js
// Real verify (tsk-19j D1/D11, closes gap 2): `gates[id].planApprove.verify`
// is the real command fgos-coding-planning/fgos-coding-validating recorded for this item
// — read once, reused by every moveStage call below that advances this item
// to `executing`, so none of them silently carry FALLBACK_VERIFY or leave
// `verify` untouched (transitionStage only overwrites it when passed a
// value — stage.mjs:59-64). Falls back to the item's own current `verify`
// when no approve record exists yet (an item that never went through
// Track A's Gates, e.g. from before this item, is unaffected).
const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;
```

Every path through `resolveDecompose` that moves an item to `executing`
(already-decomposed re-entrancy, the mode-gate skip above, and the
normal judged path) reads `gates[id].planApprove.verify` — the real
verify string `fgos-coding-planning`/`fgos-coding-validating` recorded at approval
time (`tsk-19j-1`'s own contribution) — once, and reuses it consistently.
No path silently carries the old `FALLBACK_VERIFY` placeholder or
leaves `verify` untouched by accident. An item that predates this whole
gate-approve mechanism and has no `planApprove` record yet simply falls
back to its own current `verify` field — unaffected, not broken.

## Re-entrancy: the same fix applies to an interrupted retry

The `hasChildren` re-entrancy guard (a crash between writing children
and moving the root to `executing` must not regenerate children on
retry) also reads and reuses `planApproveVerify` on its own
already-decomposed path — the real-verify fix isn't scoped only to the
new skip branch; it closes the gap consistently across every stage-move
this function performs.

## Follow-up (`tsk-3ev`): the code is correct, but nothing warned a hand-driving session about it

`releaseClaimOnExecuting()`, called on every path above that advances an
item to `executing` (`decompose.mjs:488-494`, `claim-lock` §3b), is
genuinely correct behavior — it releases the claim back to `todo` so the
item is real again in `fgos-coding-driving`'s own loop, which does
check a fresh claim status before invoking the `executing`-stage skill,
exactly per its own hard rule. `tsk-3ev` found the gap wasn't in this
code at all: **a session driving stage-by-stage by hand** — calling
`fgos-coding-implement` directly instead of returning to
`fgos-coding-driving`'s loop after `decompose --verdict pass-through` —
has no signal that its own claim was just silently released.

**Real repro, on the same item this doc's own citation, `tsk-19j`,
belongs to the same family as**: `tsk-vms` (2026-08-07). After `fgos
decompose tsk-vms --verdict pass-through`, the item's status returned to
`todo` while the session kept writing its own script/report and
committing — with no active claim. The gap only surfaced later, at
`fgos return`, which refused with `"is todo, not doing"`. Recovery
required re-claiming (`fgos pick tsk-vms` again — the same branch/
worktree was safely reused) before `return` could succeed. Named as a
**process gap, not a code bug**: if a different session had picked the
same item while it briefly sat unclaimed at `todo`/stage `executing` (a
real, legitimate frontier candidate in that state), a genuine worktree/
branch conflict could have resulted.

**The fix**: an explicit warning line added to `fgos-coding-validating/
SKILL.md`'s own Handoff section (and `fgos-coding-implement/SKILL.md`'s
Orient step, both dual-root copies) — any driving path that does **not**
go through `fgos-coding-driving`'s own loop must re-check the item's
live status itself (it may already be back at `todo`) and re-claim
before Implementing, rather than assuming the original `pick`'s claim
stays valid across the whole `clarify → decompose → executing` span.
This closes the gap at the documentation/process layer, since the
underlying release-on-executing behavior itself is correct and stays
unchanged.
