---
type: explanation
title: Why fgos-coding-planning writes a pass-through item's real verify before handoff
tags: [fgos-coding-planning, verify, plan-mjs, placeholder]
source_capture_ids: [tsk-14a]
authoritative_for: why a pass-through (non-split) item's designed proof-surface command is synced onto work.verify by fgos-coding-planning, and why the fix is skill prose rather than an engine change
---
# Why `fgos-coding-planning` writes a pass-through item's real verify before handoff

`tsk-14a`. Discovered live while implementing `tsk-38h`.

## The gap

`resolvePlan` (`src/intake/plan.mjs:543`) stamps every
`planning`→`executing` transition with:

```js
const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;
```

`planApprove` is a retired gate name — no live skill writes it since
`coding-planning-validating-gate-redesign`
(`docs/explanation/why-planning-and-validating-collapsed-into-one-co-adjustment-gate.md`)
— so this always falls through to whatever `work.verify` already holds,
real or placeholder. Nothing upstream of that line ever writes
`plan.md`'s actually-designed proof-surface command onto `work.verify`
for a **pass-through** (non-split) item. `fgos-coding-validating`'s own
gate-approve call is explicit that it re-records "the item's own current
`verify` field, read fresh" — it *proves* the existing value holds, it
never *designs* a new one.

**The real incident**: `tsk-38h`'s `plan.md` named a real proof surface
(`grep -q "tsk-38h" CLAUDE.md && npm test`), and validating's reality
gate correctly passed that as proof — but the item's own `verify` field
still carried discovery-stage's untranslated placeholder ("chưa xác
định — P15 bổ sung"), since nothing in the standard flow calls `fgos edit
--verify` for a pass-through item (only `normalizeChild`'s
`decompose --children` path forces a real verify onto a *child* at
creation time — a different code path, never exercised for a
pass-through item). The first `fgos return tsk-38h` ran the placeholder
text as a literal shell command: `/bin/sh: 1: chưa: not found`, moving
the item `doing -> blocked`. Fixed live via `fgos edit --verify`, then
`return` succeeded — `tsk-38h` itself has no residual issue, but the gap
recurs on any small pass-through item whose discovery-stage placeholder
verify was never overwritten.

## The fix, and why it's skill prose rather than an engine change

`resolvePlan`'s own fallback chain is correct *as a fallback* — it
should keep reading whatever `work.verify` says. The actual gap is that
nothing populates `work.verify` with the real value in the first place,
and that is squarely `fgos-coding-planning`'s own job (it is the skill
that knows the designed command), not the engine's. The fix: when
`fgos-coding-planning` shapes a pass-through item and names its
proof-surface command, it now syncs that command onto `work.verify` via
`fgos edit --verify` **before** handing off to `fgos-coding-validating` —
but only when the item does not already carry a real, distinct verify,
so a value a person or an earlier round deliberately set is never
overwritten.

## Relationship to `tsk-4m4` — populate vs. judge, not competing fixes

Same code site, complementary scope: a related item (`tsk-4m4`) argues
nothing currently *checks* `planApproveVerify` for correctness (it wants
that judgment moved into the merged validating gate). This item argues
nothing upstream ever *populates* it with the real designed command in
the first place. `tsk-14a`'s fix supplies exactly the value `tsk-4m4`'s
future judgment would need to check — sequenced via `deps`, but not
blocking in substance: this fix is purely additive (write a real value
earlier) and never touches the judgment-placement question `tsk-4m4`
owns.
