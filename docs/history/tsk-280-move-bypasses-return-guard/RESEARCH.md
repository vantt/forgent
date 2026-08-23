# Research: tsk-280 — `fgos move` still bypasses `return`'s anti-fabrication guard

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Mandatory rescan (item created a while ago). Confirm: (1) does
`fgos move` still have zero guard for the `doing -> awaiting-approval`
edge `return` normally covers? (2) has the related dependency tsk-4on
(now `done`) already fixed this, changing scope? (3) is the tsk-3fj live
incident (2026-08-09 update, "chưa xác định" which door it went through)
still open/relevant?

**Checked:**
- `bin/fgos.mjs:1458-1500` (current `case 'move'`, in full).
- `bin/fgos.mjs:2807-2990` (current `case 'return'`, in full).
- tsk-4on's own record (`fgos show tsk-4on`) — now `status: done`.
- tsk-3fj's own record — now `status: done`.

**Found:**

1. **The core defect is still fully present, current code confirmed.**
   `move` (`bin/fgos.mjs:1458-1500`) has exactly ONE guard today: for
   `--to delivered` only, it refuses when `fgw/<id>` is a live branch not
   yet reachable from trunk (unreachable → require `--override-reason`,
   `bin/fgos.mjs:1475-1497` — added since this item was filed, by a
   different item, tsk-5dk per its own comment). For every other `--to`
   value — including `awaiting-approval`, the exact edge `return` guards —
   `move` falls straight to `moveWork(dir, { id, to, expectedStatus,
   reason, role: 'human' })` (line 1498) with **zero** precondition beyond
   FSM-legal transition. `return`'s own three-part guard (branch-advanced
   past `branchHeadAtTake`/`headAtTake` unless `--no-new-commits-ok`;
   clean working tree; the item's own `verify` command actually passing,
   run in a disposable worktree) lives entirely inside `case 'return'`
   (`bin/fgos.mjs:2807-2990`) — nothing in `move` calls any part of it.
   `fgos move <id> --to awaiting-approval` today still marks any `doing`
   item approved with no proof of anything.

2. **tsk-4on (dependency, now `done`) fixed a related but DIFFERENT gap
   — it did not touch `move` at all.** tsk-4on's own defect was: a
   legitimately-already-complete item (work committed before claim) got
   wrongly REFUSED by `return`'s "branch has not advanced" check, pushing
   people toward the `move` bypass as a workaround. Its fix added
   `--no-new-commits-ok` to `return` itself (`bin/fgos.mjs:2810-2815`,
   `2858`, `2972` — confirmed present, `assertNoPriorBlockedOutcome`
   still enforced even on that path). This closes the *legitimate need*
   that drove people to `move` for that one scenario, but the underlying
   vulnerability this item describes — `move` has zero guardrails for the
   transition `return` exists to guard, for ANY reason, legitimate or
   not — is completely unaffected. Scope is still accurate; only the
   motivating pressure to (mis)use the bypass is somewhat reduced.

3. **tsk-3fj is now `done`** — the specific live-incident forensic
   question (verify-edit-then-27-second-move-to-awaiting-approval — did
   it go through `move` or a gap in `return`) is now historical, not
   reproducible live. Not needed to resolve retroactively: this round's
   direct reading of current `move`/`return` code (finding 1) already
   gives decisive, CURRENT proof that `move` itself has the gap,
   independent of how that one past incident specifically occurred.

**What this means for scope:** no product-judgment gap. The two fix
directions the item itself names are still the live choice, but one is
clearly favored by an already-established precedent in the SAME function,
right above the code in question: the `--to delivered` guard added since
this item was filed (finding 1) doesn't replicate `approve`'s merge
machinery inside `move` — it simply **refuses** the transition when the
precondition return/approve-style verbs exist to guarantee isn't met, and
points the caller at the real door (`"Use \"fgos approve ${id}\"..."`).
The equivalent minimal fix for `awaiting-approval`: `move` refuses
`--to awaiting-approval` from `doing` outright (the one edge `return`
owns) with a message pointing at `fgos return` (and its own
`--no-new-commits-ok` escape hatch, now that tsk-4on exists) — never
duplicate `return`'s disposable-worktree verify machinery inside `move`.
Option (b) from the original description (a whole new "verify-only item"
shape/verb) is not warranted: tsk-4on already built the legitimate escape
hatch that motivated it, via `return --no-new-commits-ok`.
