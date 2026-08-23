# plan: goal-check-timeout-visibility (tsk-53o)

## Status

Mode: **standard**. Ready for `fgos-coding-validating`.

No `CONTEXT.md` exists for this feature. `fgos-clarifying` judged the
item's own description fully self-specifying (exact bug, exact file/lines,
exact forbidden approaches, exact incident evidence) and passed it straight
from `clarify` to `decompose` with a caller-supplied clear verdict — there
was no gray area for `fgos-coding-exploring` to lock. This plan treats the item's
own `description` as the decision record; every design choice below cites
back to it directly instead of a `CONTEXT.md` D-ID.

## Mode gate

Lane decided directly (direct-entry fallback: no `fgos-routing` Orient
prose was handed to this session, and no prior `plan.md` existed) per
`fgos-routing`'s own Mode-gate table:

| Flag | Applies? |
|---|---|
| auth | no |
| authorization | no |
| data model | no |
| audit/security | no |
| external systems | no |
| public contracts | **yes** — `runGoalCheck`'s own file header calls its return shape a "load-bearing" contract every caller relies on RESOLVING (never rejecting); this item adds a field to that shape |
| cross-platform | no |
| existing covered behavior | **yes** — `runGoalCheck` is exercised by the full `npm test` suite (2600 tests) and by 7 real call sites across 3 files; an additive-only change still needs every one of those sites re-read to confirm nothing assumed the OLD two-value shape exhaustively |
| weak proof around the area | no — the area is well tested; the bug is a genuine untested edge case (timeout-under-load), not a general coverage gap |
| multi-domain | no |

2 flags → **standard**. Not high-risk: no hard-gate flag (no auth, no data
loss, no audit/security, no external provider, no validation removal).
Not tiny/small: 7 call sites across 3 files is more than "a couple of
files, one direct task."

## Approach

**Chosen path:** add one new boolean field to `runGoalCheck`'s resolved
object, additive only, then update every caller that currently treats
`status:null` as its only timeout signal to read the new field instead —
one caller at a time, deciding each site's own resulting state rather than
applying one blanket rule everywhere.

### 1. `src/runner/goal-check.mjs` (the primitive itself)

`runGoalCheck` already computes `timedOut` internally (line 32, set at
line 44) but never returns it — line 84-88's resolved object carries only
`passed`/`status`/`output`. Add `timedOut` as a fourth field on that same
object:

```js
resolve({
  passed: !timedOut && code === 0,
  status: timedOut ? null : code,
  timedOut,
  output: `${stdout}${stderr}`,
});
```

The spawn-failure branch (line 63-67, `child.on('error', ...)`) is a
DIFFERENT statusless case (the shell itself never ran) — it must resolve
`timedOut: false` explicitly, not leave the field undefined, so every
caller can test `timedOut === true` as a single, always-present signal
rather than distinguishing "false" from "absent." `passed`/`status`/
`output`'s existing meaning is untouched — this is additive only, the
function still only ever resolves, never rejects (per the item's own
explicit prohibition and the file's own header comment on why).

Update the file header comment (lines 13-19) to document the new field
alongside the existing contract description — the item's own instruction
that "header phai ghi ro hop dong nay load-bearing" applies to the new
field too.

### 2. Per-caller audit — decide each site's resulting state

Every one of the 7 real call sites below currently either (a) reads only
`.passed` and treats a false as an undifferentiated fail, or (b) reads
`.status` for a message and gets `null` for both a timeout and a
spawn-failure. None may be left silently unchanged — each needs an
explicit `timedOut` read and an explicit decision:

| Site | File:line | Today, on `!passed` | Decision |
|---|---|---|---|
| `return` (branch-source) | `bin/fgos.mjs:2350` → `:2375` | `moveWork(..., to:'blocked', reason:'verify-fail')`, friction `errorClass:'verify-miss'`, message `` `goal-check failed on branch "${branch}" (exit ${check.status})` `` | On `timedOut`: still park `blocked` (timeout is not proof the item is done — item's own prohibition on `passed:true`), but `reason:'verify-timeout'` (new, distinct from `'verify-fail'`) and message states `` `goal-check on branch "${branch}" timed out after ${timeoutMs}ms (not a verify failure — rerun return)` `` instead of `(exit ${check.status})`, which prints `(exit null)` today — this is the exact incident reproduced 2026-08-07 on tsk-puz |
| `return` (headAtTake path) | `bin/fgos.mjs:2414` | same shape, one line down (non-branch return path) | same decision as above, same new `reason:'verify-timeout'` |
| `approve` (pull-door/legacy verify-only) | `bin/fgos.mjs:3069` | `moveWork(..., to:'blocked', reason:'verify-fail')`, same friction shape, message `` `goal-check failed on main (exit ${check.status})` `` | same decision, `reason:'verify-timeout'`, message states elapsed timeout instead of `(exit null)` |
| `catchup` (already-caught-up) | `bin/fgos.mjs:3451` | returns `{outcome:'verify-fail', ...}`, no `moveWork` call (item already `blocked`, stays `blocked` either way) | no status-transition change needed (already parked), but the returned `outcome` gains a sibling `timedOut: true` field and the CLI-facing message must say "timed out" so a human reading `catchup`'s own output does not read "verify-fail" as a real test failure |
| `catchup` (clean-merge-staged) | `bin/fgos.mjs:3510` | same `{outcome:'verify-fail', ...}` shape | same decision as above |
| `mergeRunnerItemLocked` (already-merged) | `src/runner/merge.mjs:832` | returns `{outcome:'verify-fail', branch, check}` up to its `bin/fgos.mjs` caller, which is what actually moves state | propagate `check.timedOut` unchanged inside `check` (already carried, since `check` is the raw `runGoalCheck` result) — the real per-site decision lives in whichever `bin/fgos.mjs` merge-verb code reads this `outcome`; that call site must be located and updated at execution time the same way the `return`/`approve` sites above were (grep `outcome === 'verify-fail'` against `merge.mjs`'s callers) |
| `mergeRunnerItemLocked` (fresh merge) | `src/runner/merge.mjs:893` | same `{outcome:'verify-fail', branch, check, ...}` shape | same decision as above |
| `startupReap` | `src/runner/loop.mjs:388` | `verifyPassed = (await runGoalCheck(...)).passed` — discards everything but the boolean, feeds a `'blocked'` resolution the same as any other fail | destructure `{passed, timedOut}` instead of `.passed` alone; the reap log line (`log(...)`) must say "timed out" instead of the generic worktree-fail/verify-fail phrasing when `timedOut` is true, so a person reading runner logs can tell the two apart |
| `dispatchClaimedItem` | `src/runner/loop.mjs:769` | on `!check.passed`, sets `failure = {errorClass:'verify-miss', message: ...}`, retried up to the attempt cap, then eventually parks | when `timedOut`, use a distinct `errorClass:'verify-timeout'` (mirrors the `return`/`approve` decision) so the eventual park (after attempts exhausted) carries a message that says "timed out" instead of implying the worker's own code was wrong |

**Rejected alternatives** (per the item's own explicit prohibitions, cited
directly from its description, not re-litigated here):

- Raising `.fgos-runner.json`'s default `timeoutMs` — masks the symptom
  under heavier machine load rather than fixing the misreported state.
- Letting a timeout resolve `passed:true` — would let an unproven item
  through as if verified, weakening the check itself.
- Converting `runGoalCheck` to reject/throw on timeout — breaks the
  load-bearing "always resolves" contract every one of the 7 sites above
  already depends on; would require touching every caller's error-handling
  shape instead of just its success/failure branch.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `goal-check.mjs`'s new `timedOut` field | low — additive, existing fields unchanged | full `npm test` green (2600/2600) — any failure here is a real regression, not an expected update |
| `return`/`approve` blocked-park message and `reason` (2 sites, same shape) | medium — these are the sites with real, reproduced incident evidence (tsk-puz, 2026-08-07) | a short-`timeoutMs` integration case: item with `verify` set to a command that outrun a 1-2s timeout, assert the resulting `blocked` park's `reason` is `'verify-timeout'` and its message states the elapsed ms, not `(exit null)` |
| `catchup`/`merge.mjs` propagation (4 sites) | medium — `merge.mjs`'s own two sites hand the decision to a `bin/fgos.mjs` caller not yet located by name; that caller must be found and confirmed to read `check.timedOut` before this item can be called complete | grep `outcome === 'verify-fail'` (or equivalent) in `bin/fgos.mjs` against `merge.mjs`'s exported functions to enumerate every reader; each must be updated the same way |
| `loop.mjs`'s two async-runner sites | low-medium — no reproduced incident here yet, but same untested-timeout gap; `startupReap` discards the whole result down to one boolean today | targeted unit test on each function (if a harness already exists for `loop.mjs`, per existing test layout) asserting `timedOut` is read, not discarded |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → **1 provider, status
present** → posture **full**. Before implementing, run `impact({target:
"runGoalCheck", direction: "upstream"})` per this repo's own GitNexus
"Always Do" rule and report the blast radius before editing — this plan
does not substitute for that call, it only records that the posture is
`full` so the rule applies exactly as written at execution time.

**Files touched:**

- `src/runner/goal-check.mjs` — add `timedOut` field, update header comment.
- `bin/fgos.mjs` — `return` (2 sites), `approve` (1 site), `catchup`
  (2 sites): new `reason`/`errorClass`/message handling on timeout.
- `src/runner/merge.mjs` — 2 sites propagate `timedOut` unchanged inside
  `check`; the actual state-transition decision lives in whichever
  `bin/fgos.mjs` code consumes `mergeRunnerItemLocked`'s `outcome`, to be
  located and updated at execution time.
- `src/runner/loop.mjs` — `startupReap` (1 site), `dispatchClaimedItem`
  (1 site): read `timedOut` instead of discarding it, distinct log/error
  wording.

**Ordering:** `fgos graph --json` shows this item as a size-1 component
(no dependencies, nothing depends on it) — no cross-item ordering
question. Within the item: fix the primitive (`goal-check.mjs`) first
(everything else reads its new field), then the two reproduced-incident
sites (`return`, `approve` — highest-confidence proof points), then
`catchup`/`merge.mjs` (needs the extra grep step to locate `merge.mjs`'s
own callers), then `loop.mjs`'s two async sites last (no reproduced
incident, lowest urgency, same fix shape as `return`/`approve` once
written).

## Shape

Single item, not split — one root cause (`runGoalCheck` swallows a signal
it already computes), one shared fix (expose the field), then a bounded,
enumerable set of call sites to update, all in the same PR-sized change.
Splitting into per-caller children would fragment a single additive field
change across artificial boundaries with no independent value on their
own.

Concrete cases worth proving, matching `standard` depth:

- A real timeout (short `timeoutMs`, a verify command that outlives it) on
  `return` and `approve` → `blocked` with `reason:'verify-timeout'`,
  message states elapsed ms, no truncated-output-only message.
- A real verify FAILURE (non-zero exit, no timeout) on the same two sites
  → unchanged `reason:'verify-fail'` behavior (regression check — the old
  path must still work exactly as before).
- A real verify PASS on the same two sites → unchanged `awaiting-approval`
  behavior (regression check).
- A genuine spawn failure (e.g. `verify` pointing at a missing shell/binary)
  → `timedOut:false`, `status:null` — must NOT be reported as a timeout;
  stays whatever generic statusless-failure handling exists today.
- `catchup`'s two sites: timeout during an already-`blocked` item's retry
  → outcome reports timeout distinctly, no unintended status churn (item
  was already `blocked`, stays `blocked`).
- `loop.mjs`'s two async sites: a timeout during an unattended runner pass
  produces a log/error message distinguishable from a real verify miss.

## Split

No split — see Shape above.

## Execution note

Verify command for this item: `npm test` (already locked as the item's
`verify` field via the `discover --verdict clear` call). The full suite
staying green (2600/2600) proves the additive change broke nothing
existing; the targeted timeout-vs-fail-vs-pass cases above are the
positive proof this item's own bug is actually fixed, to be added as real
test cases (not just manually exercised) during execution — `goal-check.mjs`
is small and already has, per its own file layout, room for a focused unit
test file exercising `runGoalCheck` directly with a short `timeoutMs`
against a deliberately slow shell command.
