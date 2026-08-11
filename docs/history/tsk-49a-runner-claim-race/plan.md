# Runner claim race (tsk-49a) — plan

## Mode

**Standard.** Flags counted against the mode-gate checklist:

- auth — no
- authorization — no
- data model — no
- audit/security — no (concurrency-correctness, not an attacker-facing
  security property)
- external systems — no
- public contracts — no (no CLI/API surface changes)
- cross-platform — no
- **existing covered behavior — yes**: the new test exercises
  `claim-port.mjs`'s `claimWork`, a choke point three call sites (`take`,
  `pick`, runner `claimItem`) already depend on and that
  `test/runner/claim-port.test.mjs` already covers for other CAS scenarios
  (stale/fresh hook locks, claim-lock §3b reclaim). A flaky or
  mis-asserting addition here risks false confidence or false alarms
  across all three callers.
- **weak proof around the area — yes**: this is the exact gap the item
  exists to close — zero regression coverage today proves a runner claim
  is rejected against a live session-role claim.
- multi-domain — no

2 flags → **standard**. A smaller (`small`) mode would not honestly cover
it: per D1 in `CONTEXT.md`, this item's whole point is proving a
guarantee about a shared choke point three callers rely on, not just
adding one throwaway test — the risk map below (claim-port.mjs's CAS,
plus the still-open possibility the guarantee does NOT hold once
actually exercised) needs the fuller standard-mode treatment, not a
one-line small-mode note.

## Approach

**Chosen path**: extend `test/runner/claim-port.test.mjs` with a new
`test(...)` block using the file's own existing `initTempRepo()`/`setup()`
fixture (real temp git repo + real `.fgos` store, no mocks — matching
this file's existing pattern for every other test in it). The test:

1. Claims `item-a` as a session (`claimWork(dir, { id: 'item-a', actor:
   'session', isolate: false, repoRoot })`) — mirrors `fgos take --role
   session`.
2. Immediately attempts a second claim as the runner on the SAME id
   (`claimWork(dir, { id: 'item-a', actor: 'runner', isolate: false,
   repoRoot })`) — mirrors `loop.mjs`'s `claimItem` calling into the same
   choke point.
3. Asserts the second call throws — `moveWork`'s CAS
   (`expectedStatus: 'todo'` at `claim-port.mjs:198`) must reject once
   status is already `doing`, surfacing as an `FsmError` with category
   `conflict` (`src/state/store.mjs:348`'s documented contract) — the
   same category `loop.mjs`'s `claimAndDispatch` already maps to a
   graceful `state-conflict` halt (`categoryOf(err)`), not a crash.
4. Asserts `item-a` is still `status: 'doing'`, `claimRole: 'session'`
   after the rejected attempt (`listWork(dir).work['item-a']`) — the
   failed runner claim must leave the session's claim completely
   untouched, not partially overwrite it.

**Rejected alternative**: adding this at the `loop.mjs`/frontier level
(`test/runner/loop.test.mjs`, spinning up a real `runOnce` drain-run).
Rejected because the actual guarantee being proven lives in
`claim-port.mjs`'s CAS, and `claim-port.test.mjs` already has the exact
matching fixture for it (no worktree/`runOnce` machinery needed); a
`loop.mjs`-level test would exercise far more incidental machinery
(lock acquisition, worktree creation, goal-check) to prove the same
narrower fact, and would be slower and less direct. `frontier.mjs`'s own
`status !== 'todo'` filter (a second, independent layer of the same
guarantee — see `CONTEXT.md` scout evidence) is already implicitly
covered by any existing frontier test that seeds a `doing` item and
confirms it's excluded; this plan does not add a redundant one unless
`fgos-coding-validating` finds no such coverage exists.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `claim-port.mjs`'s `moveWork` CAS (the mechanism under test) | Low — additive test only, no production code change, same fixture pattern as 4 existing tests in the same file | The new test passing under `node --test test/runner/claim-port.test.mjs` |
| Whether the guarantee (per `CONTEXT.md` D1) actually holds once mechanically exercised (as opposed to inferred from reading the code) | Medium — this item exists specifically because a prior belief about this area turned out wrong once checked against the real event log; the code-reading-based confidence from `fgos-coding-exploring` is not itself proof | Running the new test for real. A FAIL here is not a bug to silently patch under this plan's scope — it reopens exactly the question `CONTEXT.md` D1 currently answers "no" to, and should route back through `fgos-coding-exploring`/re-scoping rather than being fixed as an unplanned side quest |

**Files touched**: `test/runner/claim-port.test.mjs` only. No production
code file is expected to change — per `CONTEXT.md` D1, the guarantee
already exists; this plan proves it, not builds it.

**Ordering**: `fgos graph --json` shows `tsk-49a` is not on the current
`criticalPath` and appears in `topUnblock` unblocking exactly one item
(`tsk-45y`, `unblocks: 1, newlyUnblocks: 2`) — a single standalone piece
with no internal ordering to resolve.

## Shape

One test, one file, no split. Concrete cases the new test proves,
matching D2's runner-vs-session-only scope:

- **The race itself**: session claims first, runner's claim on the same
  id immediately after is rejected (the core case, detailed above).
- **The session's claim survives untouched**: post-rejection state check
  (`status`/`claimRole` unchanged) — this is what distinguishes "rejected
  cleanly" from "rejected but partially clobbered."
- Out of scope per D2 (not added by this plan): runner-vs-human,
  session-vs-session, or any ordering where the RUNNER claims first and a
  session's `take`/`pick` races in second — the item's own title and D2
  scope this to runner-vs-session, session-claims-first only.

## Split

No split. This is one honest, already-minimal piece of work — a single
new test in an existing file, no production code change anticipated. It
proceeds as itself (`tsk-49a`), not decomposed into child items.

## Verify

`npm test` (matches this repo's standard DoD proof and the convention
already used by sibling items in this backlog). For fast iteration while
writing the test, `node --test test/runner/claim-port.test.mjs` runs just
this file.

## Outstanding questions carried to fgos-coding-validating

- Confirm whether `frontier.mjs`'s own `status !== 'todo'` filter (the
  second, independent layer of this guarantee) already has ANY existing
  test coverage anywhere in `test/state/` — if genuinely uncovered,
  `fgos-coding-validating` should decide whether closing that gap belongs inside
  this same item or is truly out of scope per D2.
- Confirm the exact `FsmError`/`categoryOf` error shape the second
  `claimWork` call actually throws today (this plan asserts `category:
  'conflict'` based on reading `src/state/store.mjs:348`'s comment and
  `claim-port.mjs`'s `CLAIM_ERROR_CATEGORY` map, but has not yet run the
  assertion against real code).
