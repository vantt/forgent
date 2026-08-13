# Plan: tsk-280 — refuse `move --to awaiting-approval` from `doing` unless explicitly overridden

Mode: **high-risk** (direct-entry fallback — no `fgos-routing` Orient
hand-off, driven via `fgos-coding-driving`). Flag count: "existing
covered behavior" applies, but at unusual breadth — `RESEARCH.md` Round 1
found `move --to awaiting-approval` used as a test-setup shortcut at 39
call sites across 7 test files (`test/cli/fgos-approve.test.mjs`,
`fgos-read.test.mjs`, `fgos-post-merge.test.mjs`, `fgos-merge.test.mjs`,
`fgos-move.test.mjs`, `fgos-return.test.mjs`, and the shared harness
`test/cli/helpers/fgos-cli-harness.mjs`). No single flag from
`fgos-routing`'s named list (auth/data-model/audit/external/cross-
platform/multi-domain) applies on its own, but a change whose honest
Shape touches 7 files across the test suite does not read as `tiny`/
`small`/`standard` either — recorded here as `high-risk` for the breadth
its own Shape section names plainly, not because any hard-gate flag
fired (confirmed clean: item's own title/description trip none of
`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`).

No `CONTEXT.md` — discovery verdict came back `clear` (D2 skips
`exploring`). Evidence base is `RESEARCH.md`.

## Approach

**Confirmed still accurate, current code (RESEARCH.md Round 1).** `move`
(`bin/fgos.mjs:1458-1500`) has exactly one guard today — for
`--to delivered` only, refusing an unreachable branch unless
`--override-reason` is supplied (added since this item was filed, by a
different item, tsk-5dk). Every other `--to` value, including
`awaiting-approval` — the one edge `return` exists to guard with its own
three-part check (branch-advanced, clean tree, verify passes,
`bin/fgos.mjs:2807-2990`) — falls straight to an unguarded `moveWork`
call. `fgos move <id> --to awaiting-approval` today marks any `doing`
item approved with zero proof of anything.

**Relationship to tsk-4on (dependency, `done`).** tsk-4on fixed a
different, related gap: `return` wrongly refusing a legitimately-already-
complete item, which had been pushing people toward the `move` bypass as
a workaround. Its fix added `--no-new-commits-ok` to `return`
(`bin/fgos.mjs:2810-2815`). This item's own scope is unaffected in
substance — it closes the *motivation* for one class of (mis)use, not the
underlying hole this item describes.

**Fix, mirroring the existing `--to delivered` precedent exactly (not
duplicating `return`'s verify machinery inside `move`).** `move` refuses
`--to awaiting-approval` when the item's current `status` is `doing`
(the one precondition `return` itself checks, `bin/fgos.mjs:2830-2832`),
unless an explicit override flag is supplied — same shape as
`--override-reason` for `--to delivered`: requires a non-empty reason,
logs it to the decision log (`addDecision`), then proceeds. **Never**
replicate `return`'s disposable-worktree goal-check/invariant-check
inside `move` — that duplication is exactly what option (b) of the
item's original description ("first-class verify-only verb") would have
required, and it is not warranted: the point of this fix is that the one
verb designed to prove real progress (`return`, now including tsk-4on's
own legitimate escape hatch) stays the only door for that edge, not that
`move` grows a second copy of the same proof machinery.

**Why the override flag needs its own name, not `--override-reason`
reused.** `--override-reason` (`bin/fgos.mjs:1481`) is already scoped, by
its own error message, specifically to the `--to delivered` /
branch-reachability case ("moving it to \"delivered\" here would record
no merge evidence"). Reusing it for a structurally different guard (no
merge evidence vs. no proof of real progress) would make one flag mean
two unrelated things depending on `--to`, which is worse for a future
reader than a second, equally-named flag: `--skip-return-guard "<reason>"`,
required non-empty, logged the same way.

**Proof point.** `impact-analysis` posture: **full** (`gitnexus` present).
`impact({target: "move" case handler / moveWork, direction: "upstream"})`
required before editing at Implement — this touches a widely-used verb;
deferred to that step per this skill's "leave execution alone" boundary.

**Smaller path considered and rejected:** an env-var escape hatch
(`FGOS_TEST_MODE=1`) piggybacking on the shared test harness's `run()`
choke point was considered, to avoid touching 39 call sites individually.
Rejected: an env-var bypass is trivially set process-wide by accident,
carries no per-call reason, and is never logged to the decision log —
strictly weaker than the explicit, audited flag every other guard in this
same function already uses. The mechanical cost (39 call sites, all
one-line additions of an existing-shape flag) is the honest price of
keeping the guard real.

### Feasibility: is the wide test-suite touch actually reversible?

Despite the breadth, **cost verdict: REVERSIBLE** (D5) — every one of the
39 call sites either already has (or, after this fix, needs) an explicit,
independent flag; a missed or wrong call site fails LOUDLY as a red test
in the same `npm test` run this item's own verify already requires, never
silently. Repair cost if a call site is wrong: fix that one line, rerun.
No production data at risk (this only touches how the LOCAL test suite
sets up fixture state), no partial-rollout window, fully undoable with a
single revert. This is why the high-risk lane above is about Shape's
honest size, not about danger — matches this skill's own D11 distinction
("tier ceiling measures delegation appetite, not risk; size and
reversibility are different things").

## Shape

One piece, pass-through (no split — the guard and its 39 call-site
updates are one coherent change, not independently shippable pieces).

Files touched:

- `bin/fgos.mjs` — `case 'move'`: add the `status === 'doing' && to ===
  'awaiting-approval'` guard, mirroring the existing `--to delivered`
  block's shape (refuse with a message pointing at `fgos return`/its own
  `--no-new-commits-ok`, unless `--skip-return-guard "<reason>"` is
  supplied, in which case log the reason via `addDecision` and proceed).
- `test/cli/fgos-move.test.mjs` — new tests for the guard itself (refuses
  without the flag; proceeds and logs with it; empty-string flag value
  still refused, mirroring the existing `--to delivered` `--override-
  reason` empty-value test at line 88).
- `test/cli/helpers/fgos-cli-harness.mjs`,
  `test/cli/fgos-approve.test.mjs`, `test/cli/fgos-read.test.mjs`,
  `test/cli/fgos-post-merge.test.mjs`, `test/cli/fgos-merge.test.mjs`,
  `test/cli/fgos-return.test.mjs` — every existing `move ... --to
  awaiting-approval` call (39 total, RESEARCH.md Round 1) gains
  `--skip-return-guard "test fixture setup, not exercising return's own
  guard"` (or an equivalently scoped literal reason per call site where a
  more specific one reads better) so each keeps proceeding exactly as
  before — these tests are fixture setup for OTHER verbs (approve,
  post-merge, merge, read), not tests of `return`'s own guard, and are
  never expected to exercise it.

### Cases this needs to hold for

- `fgos move <id> --to awaiting-approval` on a `doing` item, no flag —
  refused, message names `fgos return` (and `--no-new-commits-ok`) as the
  real door.
- `fgos move <id> --to awaiting-approval --skip-return-guard "<reason>"`
  on a `doing` item — proceeds, logs the reason to the decision log.
- `fgos move <id> --to awaiting-approval --skip-return-guard ""` (empty)
  — refused, same shape as the existing empty-`--override-reason` test.
- `fgos move <id> --to awaiting-approval` on a NON-`doing` item (e.g. a
  legal correction from some other status the FSM allows) — unaffected;
  the guard only fires when `status === 'doing'`, the one case `return`
  itself would also accept.
- Every pre-existing test relying on the old unguarded shortcut — updated
  in place (Shape above), never silently left red.

## Verify

```bash
npm test
```

Regression floor. The 39 updated call sites plus the new guard tests in
`fgos-move.test.mjs` are all part of the suite `npm test` already runs —
a full green run is direct proof both that the guard fires correctly and
that every legitimate test-fixture use of the old shortcut still works
via the new explicit flag.

## Assumptions

None beyond what RESEARCH.md already confirmed with direct citations —
every claim above traces to a specific `bin/fgos.mjs` line range or a
`grep` count already recorded there.

## Outstanding questions

None
