---
type: explanation
title: Why fgos-coding-planning writes a pass-through item's real verify before handoff
tags: [fgos-coding-planning, verify, plan-mjs, placeholder]
source_capture_ids: [tsk-14a, tsk-13b, tsk-1zo]
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

## Follow-up: the placeholder detector only matched two exact strings (`tsk-13b`)

Both `tsk-14a`'s sync fix and `tsk-4m4`'s check (below) depend entirely
on `hasRealVerify()` (`src/intake/discovery.mjs`) correctly telling a
real verify command apart from a placeholder. That function only did
exact-string equality against exactly two known constants
(`FALLBACK_VERIFY`: "chưa xác định — bổ sung thủ công", and
`RETIRED_P14_PLACEHOLDER`: "chưa xác định — P15 bổ sung") — never a
pattern match against the shared `"chưa xác định —"` prefix every
placeholder actually uses.

Live evidence at capture time: four items sitting `status: todo` in the
real backlog carried placeholder verify text that matched *neither*
constant — `tsk-8v1` ("chưa xác định — clarify sẽ khoá"), `tsk-7l9`
("chưa xác định — bổ sung ở discovery/planning"), and `tsk-45f`/`tsk-3y2`
(both "chưa xác định — cần thiết kế (...)"). If any of these later went
pass-through through `resolvePlan` with its verify still undesigned,
`hasRealVerify` would mistake the placeholder for real, skip both
`tsk-14a`'s sync and `tsk-4m4`'s check, and `fgos return` would run the
placeholder text verbatim as a shell command — replaying the exact
`tsk-38h`/`tsk-12p` failure class even *after* both fixes had landed.

**Why this isn't covered by `tsk-1yt`**: that item's own D2 is
syntax-only ("never semantics") — all four placeholder strings above are
syntactically valid shell (they parse as a simple command naming a
nonexistent binary), only semantically wrong, so `tsk-1yt`'s write-time
validation structurally cannot catch this class.

**Fix**: `hasRealVerify` now pattern-matches the shared `"chưa xác
định —"` prefix instead of exact-matching two literal constants — the
alternative considered (normalize every placeholder-generating site down
to the two exported constants, never rolling its own text) was not the
direction taken.

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

## `fgos return`'s own safety net, once a placeholder slips through anyway (`tsk-1zo`)

Even with the upstream fixes above, a placeholder can still reach `fgos
return` — an item can complete every one of its children without its own
root item's `verify` ever getting upgraded from `SUBMIT_VERIFY_SENTINEL`.
This happened live, directly during `tsk-1lv`'s own real approve: its root
item still held the literal placeholder text ("chưa xác định — P15 bổ
sung") when its six children finished, and `return`'s own verify execution
path (`runGoalCheck` → `runCommand`, `src/runner/goal-check.mjs`) shelled
out to that literal string with zero placeholder check — producing a raw,
cryptic shell error (`/bin/sh: 1: chưa: not found`, exit 127) instead of a
clear validation refusal. The guard already existed elsewhere:
`hasRealVerify()` (`src/intake/discovery.mjs`) is used at discovery-stage
transitions, but `return`'s own verify path never imported or reused it.
The fix: `runGoalCheck` now checks `hasRealVerify(item.verify)` before
calling `runCommand`, refusing with a clear `StoreError` naming the
placeholder instead of executing it as a shell command. Complementary
scope to the fix above, not competing: that fix stops a placeholder from
ever reaching `planning`→`executing` in the normal case; this one is the
safety net for when one reaches `return` anyway.
