# session-claim-liveness — plan.md

Item: `tsk-3ni`. Decisions: `docs/history/session-claim-liveness/CONTEXT.md`
(D1-D5). Design record: `docs/history/session-claim-liveness/DISCUSSION.md`.

Mode: **high-risk**

Flags counted (per `fgos-routing`'s Mode gate, applied directly — this
session entered via `fgos-coding-shaping` → `fgos-coding-exploring` →
`fgos-coding-planning`, never through `fgos-routing`'s own Orient step, so no
lane was handed off; this is the documented direct-entry fallback):

- **audit/security** (hard-gate flag on its own) — this changes who is
  allowed to take over a work-item claim and under what evidence; a wrong
  call risks silently taking over another session's still-live work.
- **authorization** — same reason: claim ownership is an access-control
  question, not a cosmetic one.
- **public contracts** — `pick`/`take` currently refuse deterministically
  (exit 3) on every `doing` conflict; this adds a new success branch for a
  subset of that same input, a real behavior change to a CLI surface
  `test/runner/claim-port.test.mjs` already asserts against.
- **existing covered behavior** — the CAS-conflict refusal this item
  modifies is already regression-tested (`claim-port.test.mjs`); every
  existing assertion about it must keep passing unchanged for the
  non-reclaim branch.

4 flags, including a hard-gate one (audit/security) → **high-risk** per the
gate's own table ("4+ flags, or any hard-gate flag ... → high-risk").
`standard` would not honestly cover this: the risk here is specifically
about silently mishandling another session's live claim, which is exactly
the class of risk `standard` is too coarse a bar for.

## Approach

**Chosen path.** Insert one pre-check into `claimWork`
(`src/runner/claim-port.mjs:88-...`), immediately before its existing
`moveWork(dir, { id, to: 'doing', expectedStatus, ... })` call
(currently unguarded — this is exactly where `transitionWork` throws
`FsmError('conflict')`, `src/state/status-fsm.mjs:204-208`, today).

When `expectedStatus` would not match (`item.status === 'doing'`,
`isBranchTake` false) AND `item.claimRole` is `human` or `session` AND
**the NEW claimant's own `actor` is `session` or `human`** (never
`runner`) — this last condition is a `fgos-coding-validating` finding (below),
not part of the original Approach: `startupReap`'s own already-locked
policy (`loop.mjs:372`) deliberately never lets the autonomous runner
touch a human/session claim; scoping this pre-check to the OLD claim's
role alone, with no check on who the NEW claimant is, would let the
runner reclaim a human's stale work through this new door — a silent
contradiction of that separate, already-locked decision. Restricting to
`actor !== 'runner'` keeps this a door only a live session walks through
deliberately, exactly as D2 intends, never something the unattended
runner sweep triggers on its own:

1. Compute D4's activity signal for that item's existing branch/worktree
   — `branchNameFor(id)` (`worktree.mjs:78`) + `git log -1
   --format=%ct` on it, combined with `git status --porcelain`'s listed
   files' newest mtime, read from whichever checkout currently holds that
   branch (resolved the same way `createClaimWorktree` already resolves
   it, `worktree.mjs:697-711` — same-machine by construction, D1/§3#8).
2. If the signal is unreadable for any reason (no worktree found, branch
   gone, git call fails) → do nothing here; fall through to today's
   `moveWork` call, which throws its ordinary conflict exactly as now.
3. If readable: compare elapsed silence to D3's threshold
   (`agentMs`/`humanMs`, reusing `graph-metrics.mjs:483-484`'s existing
   constants — `claimRole: 'session'`/`'human'` maps to the `humanMs`
   bucket the same way `graph-metrics.mjs:503`'s `ownerClass` already
   does). Not past threshold → fall through to today's `moveWork` call,
   same refusal.
4. Past threshold (D2's "conclusive" case): call `moveWork(dir, { id,
   to: 'todo', expectedStatus: 'doing' })` FIRST — a normal,
   already-registered FSM edge (`status-fsm.mjs:117`,
   `{ from: 'doing', to: 'todo' }`), guarded by its own
   `expectedStatus: 'doing'` CAS. **Implementation finding:** `reason` is
   NOT stamped into this edge's payload — `status-fsm.mjs:216-232` scopes
   `payload.reason` to exactly three unrelated edges
   (`awaiting-approval->todo`, `awaiting-approval->blocked`,
   `cleanup->blocked`); a `reason` passed for any other edge, including
   this one, is silently dropped. D2c's "logged with its evidence"
   requirement is met instead via `addDecision(dir, { id, kind: 'engine',
   ... })` right after the release succeeds — the same mechanism
   `resolveDiscovery`/`resolveDecompose` already use for their own
   engine-originated audit entries (`src/intake/discovery.mjs`'s
   `addDecision(...{ source: 'resolveDiscovery', kind: 'engine' })`
   call), carrying the real evidence (last-activity timestamp, threshold
   crossed) in `text`/`rationale`. Then continue into
   `claimWork`'s existing, UNMODIFIED code below: it re-reads
   `branchAlreadyExists` truthfully (the branch from A's prior claim is
   still there), so it takes the exact same branch-reuse path a same-
   session re-`pick` already takes, which calls `createClaimWorktree`
   (`worktree.mjs:697-711`) → `reattachableCheckout` — the tsk-65n
   mechanism, already shipped, reused verbatim, not reimplemented.

**Why the release-then-fall-through shape, not a bypass:** the CAS on
step 4's release call means a genuine race (two sessions B and C both
judging A's claim conclusively stale at once) still only lets one of them
win — the loser's own release attempt fails CAS (item is no longer
`doing` by the time it tries). No new race is introduced; the existing
single-writer guarantee (`events.jsonl`'s lock) is what already makes
this safe, same as every other `moveWork` call in the codebase.

**Validating finding — error-shape normalization required:** the
loser's release-step CAS failure is a DIFFERENT conflict shape
(`expected "doing" but found "todo"`, from the release call) than
today's ordinary claim-conflict message (`expected "todo" but found
"doing"`, from the original claim attempt) — read directly from
`transitionWork`'s single throw site, `status-fsm.mjs:204-208`, which
formats the message from whatever `expectedStatus`/`work.status` it was
given. Left as-is, a race loser would see a confusing, novel error shape
instead of "someone else got there first." The pre-check must catch its
own release-step's conflict specifically and re-throw (or let fall
through as) the SAME shape today's plain `moveWork` conflict already
produces, not leak the release-step's own internal CAS failure verbatim.

**Rejected alternatives:**
- A new verb/flag (`fgos pick --reclaim`) — rejected by D5; this shape
  needs none, the caller runs the same `pick`/`take` command either way.
- A new FSM edge — unnecessary; `doing -> todo` already exists
  (`status-fsm.mjs:117`), same edge `reject` and verify-fail-park already
  use. (Correction from an earlier draft of this plan: this edge does
  NOT carry a `reason` — see the implementation finding above; evidence
  goes through `addDecision` instead, not a new `reason` value.)
- Reimplementing reattach — rejected; `tsk-65n`'s mechanism
  (`status: done`) already does exactly what's needed and is reached for
  free once the release makes `branchAlreadyExists` true again.

**Implementation finding — pre-check is `pick`-only (`isolate: true`),
never `take`:** reading `claim-port.mjs` while wiring this in found that
`tsk-65n`'s own D2 ("`take` refuses instead of silently mis-claiming when
a `todo` item's branch already exists") was never actually shipped in
this file — no such check exists today. `take` (`isolate: false`) always
computes `useBranchSource = isolate || isBranchTake`, so it would land
`source: 'main'` on a reclaimed item whose real work is on `fgw/<id>`,
the exact silent-mis-claim shape `tsk-65n` was scoped to prevent for a
different trigger (the §3b release). Rather than also fixing `take`'s
own pre-existing gap here (out of this item's boundary — no new verb,
no unrelated bug fix), the pre-check is scoped to `isolate: true` only —
`pick` is already the spec's own stated re-claim door
(`docs/specs/runner.md` §3b); `take` on a stale claim keeps hitting
today's ordinary refusal, unchanged.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `claimWork`'s pre-check (`claim-port.mjs`) | **High** — the actual authorization-adjacent logic; a bug could reclaim a genuinely live claim or fail to reclaim a genuinely dead one | New `claim-port.test.mjs` cases: (a) conclusive-stale `doing`/`session` claim, new claimant `actor: 'session'`, `isolate: true` → release+reclaim succeeds, event trail shows the `doing->todo` release plus an `addDecision(kind:'engine')` evidence entry (implementation finding: `reason` itself is not stamped for this edge — see Approach); (b) recent-activity `doing` claim (regression of the literal `tsk-2ec` shape) → refuses exactly as today, unchanged exit/message; (c) `claimRole: 'runner'` `doing` item → pre-check is a no-op, still plain CAS refuse (this path stays `startupReap`'s alone, D2 scope); (d) **(validating finding)** conclusive-stale `doing`/`session` claim, new claimant `actor: 'runner'` → pre-check must NOT fire — refuses exactly as today; (e) **(implementation finding)** conclusive-stale `doing`/`session` claim, new claimant via `take` (`isolate: false`) → pre-check must NOT fire either — `pick`-only scoping (see Approach). A genuine two-claimant RACE on the release step's own CAS is not separately unit-tested: `claimWork` is fully synchronous (no await/yield point between its state read and its `moveWork` calls), so no interleaving is reachable within one process without mocking against this repo's own real-behavior test convention — the property is proven by direct code reading (the catch-block's `instanceof FsmError && category === 'conflict'` check mirrors the already-tested pattern `tsk-49a`'s own test uses) plus `transitionWork`'s own already-proven CAS guarantee, not a dedicated race test. |
| Activity-signal helper (new, `src/runner/claim-liveness.mjs`) | **Medium** — correctness of `git log`/`git status` parsing and threshold math, isolated from the claim flow | New `claim-liveness.test.mjs`: fabricate a worktree, backdate a file's mtime (`utimesSync`) and/or a commit's date (`GIT_COMMITTER_DATE`), assert the computed signal and the resulting reclaim/no-reclaim boundary at exactly the threshold |
| Reattach reuse (`createClaimWorktree`, `worktree.mjs:697-711`) | **Low** — already-shipped, already-tested mechanism; this item only changes what CONDITION reaches it | Existing `worktree.test.mjs` reattach cases must stay green unmodified (regression); one new case confirms the cross-session stale-reclaim trigger lands in the same reattach code path, not a duplicate |
| CLI/public-contract surface (`pick`/`take` exit behavior) | **Medium** — observable behavior changes for a subset of inputs | Every existing `claim-port.test.mjs`/`test/cli/fgos.test.mjs` assertion about today's refuse-on-conflict behavior reviewed and kept passing for the non-conclusive branch, no edits needed to those unless one turns out to assume "always refuses" unconditionally |
| Partial failure after release (release succeeds, subsequent re-claim/reattach then fails) | **Already covered, no new proof point** | `tsk-4m0`'s existing auto-revert (`claim-port.mjs`, D1) already reverts a failed `createClaimWorktree` back to `expectedStatus` — the re-claim half of this flow is the SAME code that hardening already protects; nothing new to prove here |
| Docs/spec | **Low**, no code risk | `docs/specs/work-state.md:1160-1164`'s Open Gaps line updated to reflect this door now exists (same-machine-only, cross-machine still deferred); `CHANGELOG.md` `## [Unreleased]` entry (AGENTS.md install/setup/doctor gate: this changes `pick`/`take`'s user-visible behavior) |

**Impact-analysis posture:** `impact-analysis: full` — `fgos tool query
--capability impact-analysis --status present` reports GitNexus
`present`. Caveat carried forward per `CLAUDE.md`'s own gate guidance: a
separate, already-tracked backlog item independently flags this
machine's GitNexus index as ~434 commits behind HEAD — `present` here
only means installed, not that its index is fresh. Any `impact()` call
`fgos-coding-validating`/`fgos-coding-implement` runs against `claim-port.mjs`/
`status-fsm.mjs` should be cross-checked with a plain `rg` for callers
rather than trusted blindly if it returns something suspiciously
small/empty.

## Files touched

- `src/runner/claim-port.mjs` — `claimWork`'s pre-check (new code, one
  function).
- `src/runner/claim-liveness.mjs` — **new file**: D4's activity-signal
  computation + D3's threshold comparison, pure and independently
  testable.
- `test/runner/claim-port.test.mjs` — new cases per risk map row 1.
- `test/runner/claim-liveness.test.mjs` — **new file**, cases per risk
  map row 2.
- `docs/specs/work-state.md` — Open Gaps line update.
- `CHANGELOG.md` — `## [Unreleased]` entry.

No split: this is one coherent, non-separable piece of work (per the
shaping discussion's own §7 — the pre-check, the signal helper, and their
tests all depend on each other to mean anything; there is no honest
seam). `fgos graph --json` shows `tsk-3ni` in a singleton component (no
deps, nothing currently depends on it) — no cross-item ordering to derive
from `criticalPath`/`topUnblock` either.

## Order

1. `claim-liveness.mjs` + its own tests first — pure, no dependency on
   the claim flow, lowest risk, and everything else needs it to exist
   before it can be wired in or tested end-to-end.
2. Wire the pre-check into `claim-port.mjs`'s `claimWork`, with its own
   regression + new-behavior tests (risk map row 1) landing in the same
   change — this is the one high-risk piece, gets proven immediately
   after it's written, not deferred.
3. Confirm reattach reuse (risk map row 3) — run existing
   `worktree.test.mjs` unmodified, add the one new cross-session case.
4. Docs (`work-state.md`) + `CHANGELOG.md`.

## Concrete cases sketched (high-risk depth)

- **Boundary — no worktree exists at all** (branch exists, worktree was
  manually removed): activity signal is unreadable → falls through to
  today's plain refusal, not a crash.
- **Regression — the literal `tsk-2ec` shape**: `doing`/`session` claim
  with a real event <1 minute old → refuses exactly as today, byte-for-
  byte same error.
- **Domain boundary — runner claims**: `claimRole: 'runner'` items are
  untouched by this pre-check (D2's own scope); `startupReap` remains the
  only thing that ever reaps those, unchanged.
- **Concurrency — two sessions racing a stale reclaim**: both compute
  "conclusive" near-simultaneously; only one's `doing -> todo` release
  CAS succeeds (guarded by `expectedStatus: 'doing'`), the other falls
  through to an ordinary refuse on retry — no double-claim, no new race.
- **Partial failure after release**: covered transitively by `tsk-4m0`'s
  existing auto-revert (risk map, row 5) — explicitly not a new gap.

## Outstanding questions

None
