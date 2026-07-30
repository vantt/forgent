# Runner claim race (tsk-49a) — CONTEXT

## Feature boundary

`tsk-49a` was filed as a concurrency bug: `fgos take --role session` on
`tsk-4fu-2` supposedly did not stop the autonomous runner/dispatcher from
independently picking up and completing the SAME item in parallel — a
duplicate-implementation incident the filing session believed it had
caught live, evidenced by an "independent" commit `259405a` on `main`
with (it claimed) no corresponding `fgos return` event.

Scouting this item's own premise against the actual event log
(`.fgos/events.jsonl`) and `claim-port.mjs` disproved the incident as
described. This item's boundary is now: lock in, via a regression test,
the CAS guarantee that already appears to hold — not fix a bug that was
never confirmed to exist.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Reframed from bug-fix to guarantee-proof/hardening. A full scan of every `work.move` event in `.fgos/events.jsonl` (565 events) found zero genuine runner-vs-session (or any-role) double-claims. The one surface match (`tsk-53f`, seq 272/273, 2026-07-28) is a byte-identical duplicate write from the SAME actor/session, predating and unrelated to this incident — an artifact of the exact same-write-race class `tsk-53f`'s own single-choke-point refactor (`claim-port.mjs`) was built to close. The `tsk-4fu-2` incident itself is fully explained by ordinary `fgos take` semantics (see Scout evidence) — not a runner race. |
| D2 | Regression-test scope is **runner-vs-session claim pairing only**, matching the item's original title/framing — not a broader all-role-pairings test (runner-vs-human, session-vs-session). |
| D3 | `tsk-45y`'s acceptance text (which named `tsk-49a` as proof the single-writer-per-item assumption "is broken") has been corrected in this session to say the assumption was **checked and holds**, not broken. `tsk-49a` stays as `tsk-45y`'s dependency — the regression test still needs to exist before `tsk-45y`'s reconcile design can lean on the guarantee — but the framing no longer claims a confirmed violation. |

## Pinned terms

- **"The guarantee"** — claim-port.mjs's single choke-point property: every
  claim path (`take`, `pick`, runner `claimItem`) funnels through the same
  `moveWork(..., expectedStatus: 'todo')` CAS inside the same
  `acquireMainCheckoutLock`, so a second claimant's CAS fails once the
  first has flipped status to `doing`.
- **"Hardening" (per D1)** — writing a test that proves an existing
  guarantee holds under a race, as opposed to "fixing a bug" (implying
  the guarantee was previously shown to fail).

## Scout evidence

- `src/runner/claim-port.mjs:86-258` (`claimWork`) — the single choke
  point all three claim paths (`bin/fgos.mjs` `take`/`pick`,
  `src/runner/loop.mjs`'s `claimItem`) already funnel through
  (`refactor(tsk-2r4)`, `refactor(tsk-1nu)`, `feat(tsk-3oa)` — all landed
  well before the `tsk-4fu-2` incident date). `moveWork` is called with
  `expectedStatus: isBranchTake ? 'blocked' : 'todo'` (line 198, 204-212)
  — a CAS that fails once status is already `doing`.
- `src/state/frontier.mjs:80` — `if (item.status !== 'todo') continue;`:
  the frontier the runner dispatches from already excludes any item not
  `status: 'todo'`, independent of `claimRole`.
- `src/runner/loop.mjs:344` — `if (item.claimRole === 'human' ||
  item.claimRole === 'session') continue;` inside `startupReap` — this
  guards **stale-doing reclaim** (a crashed runner's own abandoned claim),
  a different code path from frontier dispatch; not itself evidence for
  or against the dispatch-race hypothesis, but confirms claimRole is
  already read and respected in the one place this codebase currently
  needs it.
- `.fgos/events.jsonl` full scan (565 `work.move` events, script run this
  session) — the only "double `to: doing` without an intervening exit"
  match across the ENTIRE log is `tsk-53f` seq 272/273
  (2026-07-28T10:17:04.586Z), a byte-identical duplicate payload from a
  single actor — not a cross-role race, and it predates `claim-port.mjs`
  even existing (that commit itself was `tsk-53f`'s own construction).
- `tsk-4fu-2`'s own event trail (seq 775 take → 798 return, both
  `writer.id: e5001984-d731-4776-82c0-167cb606554a`, single actor,
  `passed:true`, `aheadCount:17`) shows a clean, ordinary,
  single-writer take→implement→return→done lifecycle. No second writer
  ever touches this item in the log.
- `tsk-49a`'s own filing event (seq 794, 2026-07-29T07:39:03Z) landed
  chronologically **between** `tsk-4fu-2`'s take (seq 775,
  07:07:20Z) and its own `return` (seq 798, 07:44:01Z) — the filing
  session wrote up the "incident" while `tsk-4fu-2` was still its OWN
  active `doing` claim, five minutes before calling `return` on it
  itself. The cited "seq 759" and "seq 760 is the last tsk-4fu-2-related
  event" in the original description are wrong: seq 759/760 belong to a
  different item (`tsk-1ab`), not `tsk-4fu-2`.
- Commit `259405a` (`git show`, authored
  2026-07-29T14:21:48+07:00 = 07:21:48Z) falls between `tsk-4fu-2`'s take
  (07:07:20Z) and the filing session's own write-up (07:39:03Z) — an
  ordinary mid-task commit by the claiming session itself, not a
  foreign actor's commit.
- `src/runner/claim-port.mjs:197-199` — `isBranchTake = item.status ===
  'blocked' && branchAlreadyExists; useBranchSource = isolate ||
  isBranchTake;`. For a plain `todo → doing` `take` (`isolate: false`,
  status not `blocked`), `useBranchSource` is `false` — `take` operates
  directly against the main checkout's current HEAD, no worktree/branch
  isolation. This is the actual explanation for "an independent commit
  landed directly on main": that is exactly what a `take`-based claim is
  supposed to do (only `pick` isolates into a worktree/branch).

## Canonical references

- `src/runner/claim-port.mjs` — the choke point the regression test
  targets.
- `src/runner/loop.mjs` — `claimItem`/`claimAndDispatch`, the runner-side
  caller of the choke point.
- `plans/reports/research-260730-1133-open-lock-contention-items-survey.md`
  §"D. Claim-level race" and §6 — the survey that (before this session's
  scout) treated `tsk-49a`'s premise as an established fact and made it a
  hard prerequisite for `tsk-45y`.
- `tsk-45y` — corrected in this session (`fgos edit tsk-45y --acceptance
  ...`, event seq 1781) to no longer claim a confirmed violation.
- `docs/explanation/session-isolation-and-concurrency.md` — the
  explanation doc `tsk-4fu-2` itself produced; tangential background on
  worktree isolation, read during this scout, not directly dispositive.

## Outstanding questions deferred to planning

- Exact test file/location for the runner-vs-session regression test
  (new file under `test/runner/` alongside existing `claim-port`/`loop`
  coverage, or added to an existing suite file) — implementation choice.
- Exact mechanics for simulating "a live session-role claim" in the test
  (seed `.fgos/state.json`/`events.jsonl` fixtures directly vs. drive it
  through the real `take` CLI path first) — implementation choice.
- Verify command for this item (currently `"chưa xác định — P15 bổ
  sung"`) — planning should set a concrete `npm test`-style verify once
  the test file/location is decided.
