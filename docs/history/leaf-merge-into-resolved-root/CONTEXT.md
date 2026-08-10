# Context: tsk-4s0 — chan tu goc leaf approve vao root da resolved (piece 2 cua tsk-4qu)

## Feature boundary

Prevent (not just report) a leaf item's `approve` from landing its
`fgw/<leaf>` branch on a `fgw/<root>` branch whose root item is already
resolved (`delivered`/`retrospective`/`cleanup`/`done`). This is the
prevention half of a two-piece fix; the detection half (`checkRootDrift`
reporting `strandedAfterClose`) already landed via tsk-4qu.

Scope is `approve`'s own gate plus `mergeTier`'s classification in
`src/state/graph-harness.mjs:209` — the two places `bin/fgos.mjs`'s own
approve path and `merge list`/`merge next` read to decide where a leaf's
merge lands. Remediation of the two already-stranded branches (tsk-4ns,
tsk-53n) is explicitly out of scope — both were already resolved by hand
via `fgos sync-root`.

## Decisions

| ID | Decision |
|---|---|
| D1 | The set of "resolved" root statuses this block checks against is the SAME `COMPLETED_ROOT_STATUSES` set `checkRootDrift` already uses: `{delivered, retrospective, cleanup, done}` (`src/setup/registrations.mjs:440`). `wontfix` stays excluded — not asked as a question because it is already grounded in tsk-4qu's own Assumption #1 (`docs/history/leaf-merge-into-resolved-root/plan.md`): an abandoned root is a different category from a closed-out one, and a wontfix root's branch is *supposed* to sit unmerged. Piece 2 stays consistent with piece 1's own precedent rather than inventing a second status set. |

**Explicitly deferred to `fgos-planning`, not decided here:** which of the
item's own two proposed directions to implement —
(a) reroute `mergeTier` to `root-to-main` for a leaf whose root is
resolved, letting it merge straight to main, vs.
(b) refuse `approve` outright with a clear message, requiring manual
handling.
The item's own description already assigns this choice to planning
("Hai huong de xuat, quyet luc plan") — this is an existing, explicit
decision made by whoever wrote the item, not a gap `fgos-exploring` found;
overriding it here would silently relitigate a decision the item's author
already made. `fgos-planning`'s own reality-check step is also the right
place to answer the risk the item itself names for option (a): does
merging straight to main skip any ordering constraint `approve` normally
enforces for a leaf-to-root merge.

## Pinned terms

- **root** — any work item that is some other item's `parent`
  (`drift-status.mjs`'s own comment: "a work item whose `fgw/<id>` branch
  is a merge target for its own children"). Direct parent only; this item
  does not address multi-level parent chains (a root that itself has an
  unresolved parent) — `drift-status.mjs:73` already special-cases that one
  level for its own `targetBranch` resolution, but `mergeTier` (the
  function this item touches) only ever distinguishes "has any parent" vs
  "has none," and the item's own real-incident evidence (tsk-4ns, tsk-53n)
  is single-level in both cases. Multi-level nesting, if it turns out to
  matter, is new evidence for a follow-up, not something to guess into
  scope here.
- **resolved** (root status) — see D1.

## Scout evidence

- `src/state/graph-harness.mjs:209` — `mergeTier[item.id] = item.parent ?
  'leaf-to-root' : 'root-to-main'`. Confirmed: no read of root status.
- `src/setup/registrations.mjs:440-471` (`checkRootDrift`, current code) —
  piece 1 already landed: splits drift into `needsSync` and
  `strandedAfterClose`, the latter gated on `COMPLETED_ROOT_STATUSES`.
- `src/state/drift-status.mjs:101` — `needsSync: aheadOfTarget > 0 &&
  !isResolvedStatus(rootItem)`; `isResolvedStatus` (`frontier.mjs:247`)
  additionally treats `wontfix` as resolved via `statusCategory ===
  'canceled'` — a real discrepancy from `checkRootDrift`'s narrower
  `COMPLETED_ROOT_STATUSES`, but one tsk-4qu's own plan already reasoned
  about and accepted (Assumption #1) rather than a gap this item
  introduces.
- `bin/fgos.mjs:2710` (`case 'approve'`) — confirmed as the refusal point
  piece 2 would extend; currently has no root-resolved check.
- `test/state/graph-harness.test.mjs:325-336` — existing `mergeTier`
  coverage pins the current (buggy) parent-only rule; will need a new
  case once piece 2 lands.
- `herdr-plugin/src/fgos.rs:190` — `blockedOnSync` deserialized by name;
  confirms the public-contract constraint the item's own PHAI GIU DUNG
  section names.
- `docs/history/leaf-merge-into-resolved-root/plan.md` (tsk-4qu's plan) —
  explicitly named piece 2 as a deliberate follow-up, with the exact
  footprint tsk-4s0 carries (`bin/fgos.mjs`,
  `src/state/graph-harness.mjs`, `test/cli/fgos.test.mjs`; tsk-4s0 adds
  `test/state/graph-harness.test.mjs`).
- Full research trail: `docs/history/leaf-merge-into-resolved-root/RESEARCH.md`.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`, but
`list_repos` shows the `forgentX` index 418 commits behind HEAD.
Cross-check: `impact({target: "mergeReadiness", direction: "upstream"})`
reported `impactedCount: 0, risk: LOW` — a provably wrong zero-result
(same class of false negative tsk-4qu's own plan already documented for
`validateWorkShape`). `rg -n "mergeReadiness"` cross-check found 6 real
referencing files (`bin/fgos.mjs`, `src/setup/registrations.mjs`,
`src/state/graph-metrics.mjs`, `src/state/work.mjs`,
`src/state/graph-harness.mjs`, `test/state/graph-harness.test.mjs`).
GitNexus's blast-radius claims are not to be trusted here without a grep
cross-check, same posture tsk-4qu's plan already established for this
same area of the code.

## Canonical references

- `docs/history/leaf-merge-into-resolved-root/plan.md` — tsk-4qu's plan
  (piece 1), including its own Approach/Risk-map/Shape sections.
- `docs/history/leaf-merge-into-resolved-root/RESEARCH.md` — this item's
  discovery-stage research round.
- `docs/explanation/why-merge-next-auto-syncs-blockedonsync-roots.md` —
  why `needsSync`'s meaning is fixed and was deliberately left untouched
  by piece 1.

## Outstanding questions

None
