# Plan — tsk-3hks: clear a stale reason/parkReason on a closed item

Mode: high-risk

Flags counted (per fgos-routing's Mode gate): **audit/security** (hard-gate
— this item is specifically about editability of the audit-trail-adjacent
`reason`/`parkReason` fields; the current lack of a write path is itself
what keeps that trail trustworthy today, so any new write path here needs
the same ceremony a security-adjacent change gets), **existing covered
behavior** (`test/cli/fgos-edit.test.mjs` already exercises
`EDITABLE_FIELDS`/`editWork` directly), **public contract**
(`fgos edit`'s allowlist, and any new verb's CLI surface, are both public
contracts other sessions/scripts rely on). One hard-gate flag alone forces
high-risk regardless of total count — no CONTEXT.md/exploring round
happened for this item (discovery verdict was `clear`), so this lane was
derived directly from `fgos-routing`'s own Mode-gate table (direct-entry
fallback, no lane was ever recorded in prose before this session).

## Context

No `CONTEXT.md` exists — discovery's `clear` verdict skipped `exploring`
entirely. `docsRef` was registered by this session
(`docs/history/tsk-3hks-clear-stale-park-reason/`) since none existed yet.
Evidence backing this plan is recorded in this same feature dir's
`RESEARCH.md` (Round 1, `fgos-researching` consult call, logged via
`fgos handoff --reason consult`).

## Approach

**Problem, confirmed with evidence (RESEARCH.md Round 1):**
- `src/state/store.mjs:280` `EDITABLE_FIELDS` does not include `reason` or
  `parkReason`.
- `src/state/replay.mjs:172-179` (RUL32) folds `item.reason` from a
  `work.move` event's `reason` payload, **latest-wins**, with no event
  type that ever clears it.
- `docs/specs/work-state.md:949` — `done` is a one-way terminal status:
  once reached, no further `work.move` event can ever be appended.
  `status-fsm.mjs:156-169` (fsm-wontfix-terminal-status) confirms
  `wontfix` is a **second, symmetric** one-way terminal status, reached via
  `blocked/todo/doing -> wontfix`, same "no further move" shape as `done`.
- Combined: a `done` **or** `wontfix` item's `reason`/`parkReason` is
  structurally permanent today — there is no event path left that could
  ever touch it again.
- **Assumption (grounded, not escalated):** scope covers both `done` and
  `wontfix` terminal items, not just `done` — the structural cause (no
  further `work.move`, latest-wins-only fold) is identical for both, per
  the FSM evidence above. This is a direct technical extrapolation from
  evidence already in hand, not a product judgment call, so it is pinned
  here rather than routed back to a person. Non-terminal statuses
  (`blocked`, `awaiting-human`, `todo`, `doing`) already have a working
  path to overwrite `reason` via their own next `work.move` — they are out
  of scope, the bug does not reproduce there.

**Chosen approach — a narrow, dedicated verb, not an `EDITABLE_FIELDS`
addition:**

`src/state/work-state.md:1179` (RUL64) is the direct precedent: `holder`
is also deliberately excluded from `EDITABLE_FIELDS` for the same reason
`reason`/`parkReason` are — a system-populated field with special
semantics — and instead of ever joining generic `edit`, it got its own
verb pair (`fgos handoff` / `fgos handoff-return`) with its own scoped
validation. This item follows the same idiom rather than the plain
allowlist route:

- New verb (name TBD at execute time, kebab-case, e.g. `fgos
  resolve-park-reason <id> --note "<human-confirmed rationale>"`):
  - Refuses (`validation`) unless `work.status` is `done` or `wontfix` —
    the one-way-terminal scope above.
  - Requires a non-empty `--note` — this is what preserves the actual
    audit value: the CLEARING action itself stays justified and traceable
    in the event log (append-only, never rewritten), even though the
    live-view `reason`/`parkReason` no longer shows the stale text. This
    is the same shape as the item description's "annotated as resolved"
    option, made mechanical.
  - Appends a **new event type** (not `work.move` — a move on a terminal
    item is exactly the precondition violation `moveWork` already throws;
    reusing `work.move` here would either need to bypass that guard, which
    would reopen the "done is one-way" invariant, or fail outright). A
    fold case in `replay.mjs` clears `item.reason`/`item.parkReason`
    (unset the fold key, mirroring how these fields are "absent until
    first set" today) and records the new event's `note` into a durable,
    additive (never-overwritten) log the same shape `outcomes`/`frictions`
    already use, so the resolution note is itself never silently lost the
    way the stale text was.
- Rejected alternative: adding `reason`/`parkReason` straight to
  `EDITABLE_FIELDS`. Rejected because (a) both fields are populated
  exclusively by the FSM's own move-event fold, i.e. by the system, not by
  a person editing metadata — mixing a system-populated field into the
  generic person-facing `edit` door blurs exactly the boundary
  `id`/`status`/`stage`/`domain` are already kept out of `EDITABLE_FIELDS`
  for; (b) generic `edit` has no natural way to express "only when status
  is done/wontfix" or "requires a justification note" without special-
  casing those two fields inside `editWork` itself, which is worse than a
  small dedicated function that owns its own precondition.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| New verb's status/terminal-state guard (wrong scope lets a live item's audit-relevant field be cleared) | high | validating: a red-path test that asserts refusal on every non-`done`/`wontfix` status |
| New event type's replay fold (must not disturb existing `work.move`-driven `reason` fold, RUL32) | high | validating: a test asserting an ordinary `work.move`-carried `reason` still folds exactly as before, on an item that never used the new verb |
| `editWork`/`EDITABLE_FIELDS` blast radius if the alternative had been chosen (not the chosen path, recorded for why it was rejected) | n/a (approach avoids this) | — |

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` returned GitNexus as `present`, but its
index for this repo's main checkout (`/home/vantt/projects/forgentX`) is
1120 commits behind HEAD, and this session's own worktree path
(`.claude/worktrees/tsk-3hks-gv74DN`) is not indexed at all (per
`list_repos`, only 3 other worktrees are). Per CLAUDE.md's gate this is
`degraded`, not `full` — ran anyway against the closest (main-path) index
and cross-checked with a direct `grep` on the live checkout: `impact` on
`editWork` (upstream) reported 4 callers (`promote-to-component.mjs`,
`discovery.mjs`, `plan.mjs`, `loop.mjs`); the direct grep found the same 4
call sites and confirmed none of them pass `reason` or `parkReason` in
their patch object today — so even the rejected `EDITABLE_FIELDS`-addition
alternative would have been additive/non-breaking for every existing
caller. The chosen dedicated-verb approach touches none of `editWork`'s
existing callers at all — this proof point is about the rejected
alternative, recorded so a future reader does not have to re-derive why it
was passed over.

**Files likely touched, in order** (per `fgos graph tsk-3hks --json`: this
item is an isolated size-1 component, no dependents/dependencies, so
ordering is driven by build order, not backlog critical path):

1. `src/state/store.mjs` — new verb function (mirror `editWork`'s
   lock/refresh/append shape: `withEventsLockAndRefresh`, read `before`,
   validate status is `done`/`wontfix`, require `note`, `appendEventLocked`
   the new event type).
2. `src/state/replay.mjs` — new fold case: clears `item.reason`/
   `item.parkReason` on the new event type; appends the note to a new
   lazy-keyed, additive view collection (mirror `view.frictions`' shape).
3. CLI wiring — register the new verb the same way `handoff`/
   `handoff-return` are registered (`src/cli/command-registry.mjs` and
   wherever their handler lives), including a `--dir` flag per the
   `requiresExistingStore` convention every other verb here follows.
4. `test/cli/fgos-edit.test.mjs` or a new sibling test file — coverage:
   refuses on `todo`/`doing`/`blocked`/`awaiting-human`/
   `awaiting-approval`; succeeds on `done`; succeeds on `wontfix`; clears
   both `reason` and `parkReason`; requires non-empty `--note`; an
   ordinary `work.move`-carried `reason` on a different item still folds
   unaffected (RUL32 regression guard).
5. `docs/specs/work-state.md` — update Data Dictionary entry #18
   (`reason`) to note the new clearing path exists; add the new verb next
   to RUL32/RUL64 the same way `handoff`/`handoff-return` are documented
   next to RUL64 today.

## Shape

Single honest piece — no split (Step 4). The change is one cohesive
mechanism (one new verb, one new event type, one fold case) touching a
small, well-bounded set of files; splitting it into separate items would
only fragment a change whose pieces cannot be verified independently of
each other (the verb is meaningless without its fold case, and vice
versa).

Concrete cases to prove against at `executing` (depth matching high-risk
mode):
- Boundary: item at `done` with no prior `reason`/`parkReason` at all
  (never parked) — verb should still succeed as a no-op-ish clear (nothing
  to clear, but the note still gets recorded) rather than erroring.
- Existing behavior must not regress: an item currently mid-lifecycle
  (`doing`) that later gets parked (`blocked`) and returns to `doing`
  still gets its `reason` overwritten by the ordinary `work.move` fold,
  completely unaffected by this change.
- Concurrent access: the new verb goes through the same
  `withEventsLockAndRefresh` every other write door uses — no new locking
  design needed, reuse the existing guarantee.
- Partial failure: verb call on a nonexistent id, or missing `--note`,
  fails `validation` before any event is appended (mirrors `editWork`'s
  own up-front checks).

## Outstanding questions

None
