# plan.md — tsk-34o5: attestation level 2, enforcement halt at reap/return/approve

Mode: high-risk

Lane decided directly from `fgos-routing`'s own Mode-gate subsection
(this session entered via `/fgOS:pick`, so no lane was handed off from an
Orient step). Flags counted against the item:

- **audit/security** (hard-gate flag on its own) — this closes an
  incident/enforcement loophole (tsk-43z: a wrongly-spawned worker
  committed straight to main, caught only by luck + manual revert).
- **public contracts** — a new typed park reason surfaces on `fgos
  return`/`fgos approve`/reap's own JSON output; any existing consumer of
  those outputs sees a new possible value.
- **existing covered behavior** — this modifies three already-tested,
  live chokepoints (`startupReap`, `fgos return`'s branch-source path,
  `fgos approve`'s merge path), not new ground.
- **weak proof around the area** — the sibling level-1 feature in this
  exact area (`docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md`)
  needed three independent post-merge review rounds (tsk-4hl, tsk-x5r,
  tsk-5iv) to actually land correctly; a pre-existing, unrelated red test
  was found live in `test/cli/fgos-return.test.mjs` during this item's own
  discovery (see RESEARCH.md's "Open item found" section).

4 flags plus one hard-gate flag on its own → **high-risk**, independently
confirmed two ways.

impact-analysis posture: **degraded** — `fgos tool query --capability
impact-analysis --status present` still returns `gitnexus`/`present`, but
a live hook notice right after this session's own plan.md/RESEARCH.md
commit read "GitNexus index is stale (last indexed: 7bb3231)" — HEAD had
moved past that commit. Named plainly per the reality gate's own
requirement, but this does not weaken any row below: every citation this
plan and RESEARCH.md rely on is a direct file read, `rg`/`grep`, or a real
`node --test` run — none lean on GitNexus's own blast-radius output. (The
one GitNexus answer actually queried during discovery — a symbol location
for `captureDispatchAttestation` — was independently cross-checked against
a direct read and found wrong even before this staleness, per
RESEARCH.md Round 1's own citations; this is consistent with, not
contradicted by, treating GitNexus output here as advisory-only.)

## Approach

**Chosen path:** one small, shared, pure guard function —
`checkDispatchAttestation(dir, repoRoot, id, branch)` in a new file
`src/runner/attestation-guard.mjs` — called from all three existing
chokepoints (additively, right before each one currently trusts the
branch's commit), rather than three separate copies of the same git
ancestry logic. This directly follows RUL45/RUL11's own "gom lại, ranh
giới rõ" principle (`AGENTS.md`) — three call sites needing the exact same
check is exactly the "tùm lum" shape that principle names, and a shared
function is the boundary that removes it, not a premature abstraction:
three genuinely converging call sites already exist today (Round 1,
RESEARCH.md), not a hypothetical future one.

**Alternatives rejected:**
- *Duplicate the check inline at all three sites* — rejected: same git
  ancestry logic three times, in three different files/layers
  (`loop.mjs`, `bin/fgos.mjs`, `approve.mjs`), is exactly the kind of
  drift-prone duplication a single bug fix later has to chase three
  times.
- *A new event-log-wide "attestation view" folded into `replay.mjs`'s FSM
  view* — rejected: `replay.mjs` explicitly ignores `executor.dispatch` by
  design (audit-only, RESEARCH.md Round 2); the item's own scope
  ("đường xanh zero friction — chỉ vài lệnh git... tại biên") asks for a
  point check at the three chokepoints, not a new state-machine surface.

**Risk map:**

| Component | Risk | Proof point (for validating) |
|---|---|---|
| New reader: latest `executor.dispatch` event by item id (via `readEvents`, `src/state/events.mjs`) | medium — first-ever reader of this event type; must correctly skip past unrelated event types and pick the LAST matching one across retries | Unit test in a new `test/runner/attestation-guard.test.mjs`: append 3 `executor.dispatch` events for the same id (simulating 2 retries) plus unrelated event types interleaved, assert the reader returns the LAST one |
| Null-attestation no-op (in-session dispatch, `baseCommit`/`headRef` both `null`) | medium — a wrong default here either false-halts every session-dispatched item or silently disables the whole feature | Unit test: `checkDispatchAttestation` given an event with `baseCommit: null` returns `{ ok: true, skipped: true }`, never a halt |
| Ancestry check (`git merge-base --is-ancestor baseCommit branchHead`) wired into **reap** (`loop.mjs`, chokepoint before the `moveWork` at line ~434) | high — reap runs headless/unattended; a false halt here silently stops the runner's own drain loop | Integration test in `test/runner/loop.test.mjs`: simulate a stale-doing item whose recorded `executor.dispatch` attestation names a `baseCommit` that is NOT an ancestor of the branch's real tip → assert reap parks it `blocked` with the new typed reason, never `awaiting-approval` |
| Same check wired into **return** (`bin/fgos.mjs`, branch-source path ~3038-3184) | high — this is a human-facing verb; a false halt blocks a real person mid-flow | Integration test in `test/cli/fgos-return.test.mjs`: same divergence fixture → assert `return` exits non-zero / parks `blocked` with the typed reason, and the green path (real, correctly-attested commit) is provably unchanged (existing green-path assertions in this file must still pass for the NEW code path — see Known gap below) |
| Same check wired into **approve** (`src/verbs/merge/approve.mjs`, before `mergeRunnerItem` at lines ~533/706) | high — this is the actual merge gate; a false halt here blocks the exact place `docs/routing-handoff-contract.md`'s trust boundary lives | Integration test in `test/cli/fgos-approve.test.mjs` and/or `test/verbs/merge/approve.test.mjs`: same divergence fixture at approve time → park `blocked`, typed reason, no merge commit created; existing green-path approve tests stay green |
| False-positive: legitimate retry (branch reset to the one-time `dispatchBaseline` before each retry attempt, `loop.mjs:768-816`) | high — this is acceptance criterion 3 verbatim | Test (can live alongside the reap or return integration test above): dispatch, fail verify once leaving a bad commit, retry (worker resets branch to `dispatchBaseline`, commits again), then run reap/return/approve → assert NOT halted, since the final HEAD is still a real descendant of the one recorded `baseCommit` |

**Files likely touched, in dependency order** (the shared guard has to
exist before any call site can use it; reap first since it is the
narrowest/most isolated blast radius, approve last since it is the
highest-consequence):

1. `src/runner/attestation-guard.mjs` (new) — the shared
   `checkDispatchAttestation` function and its own unit tests
2. `test/runner/attestation-guard.test.mjs` (new)
3. `src/runner/loop.mjs` — wire into `startupReap`
4. `test/runner/loop.test.mjs` — reap halt + green + retry tests
5. `bin/fgos.mjs` — wire into `case 'return'`'s branch-source path
6. `test/cli/fgos-return.test.mjs` — return halt + green + retry tests
7. `src/verbs/merge/approve.mjs` — wire into both `mergeRunnerItem` call
   sites (root/component at ~533, leaf at ~706)
8. `test/cli/fgos-approve.test.mjs` and/or `test/verbs/merge/approve.test.mjs` — approve halt + green tests
9. `docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md` — append a "Level 2" follow-up section in the same style as the existing tsk-4hl/tsk-x5r/tsk-5iv follow-up sections (user-visible behavior change: docs/architecture, per `AGENTS.md`'s documentation-management gate)
10. `CHANGELOG.md` — one line under `## [Unreleased]` (user-visible: a merge can now halt on a new failure mode)

`fgos graph --json`'s `criticalPath` does not include `tsk-34o5` (it is
not currently blocking or blocked by anything) — the ordering above is
by internal dependency (shared guard → each call site, narrowest blast
radius first), not by that global ranking.

## Shape

Concrete cases to prove, at high-risk depth:

- **Boundary/empty input**: no `executor.dispatch` event exists at all
  for the item id (pure human-authored work, never dispatched) → no halt,
  behavior byte-identical to today.
- **Null attestation** (in-session dispatch path, Round 2): latest event
  has `baseCommit: null, headRef: null` → no halt (see risk map above).
- **Existing behavior that must not regress**: the green path (branch
  head is a real descendant of the recorded `baseCommit`, `headRef`
  equals `fgw/<id>`) must reach exactly the same `awaiting-approval` /
  merge outcome as before this item, at all three chokepoints —
  `footprintDiffHits`/`frozenJudgeHits`'s own advisory-only posture is
  untouched (out of this item's own scope, per its "phạm vi giữ hẹp"
  line).
- **Concurrent/retry**: multiple `executor.dispatch` events for the same
  id (retry loop) — reader must pick the LAST one; the reset-to-baseline
  design (Round 4) keeps that last event's `baseCommit` a valid ancestor.
- **Partial failure / real divergence**: `headRef` recorded at dispatch
  time is the trunk/main branch name instead of `fgw/<id>` (the exact
  tsk-43z shape) → halt, typed reason, item parked `blocked`, no merge.
- **Partial failure / commit not descended**: `headRef` correctly names
  `fgw/<id>` but the branch's current tip is NOT a descendant of the
  recorded `baseCommit` (e.g. a force-push or an out-of-band rewrite) →
  halt, typed reason.

## Known gap carried into validating (not a CONTEXT.md gap — no CONTEXT.md exists; discovery's own verdict was `clear`)

`test/cli/fgos-return.test.mjs` currently has 3 pre-existing, deterministic
failures on unmodified branch head `294e8baf`, unrelated to attestation
(main-checkout-cleanliness assertions — see RESEARCH.md's "Open item
found" section). This item's own verify command includes this file.
`fgos-coding-validating`'s reality check should treat these 3 as a known,
already-present baseline (not a regression this item introduced) when it
runs the verify command to prove feasibility — re-confirm the count is
still exactly 3 and all three are the same named tests, not a new one.

## Outstanding questions

None
