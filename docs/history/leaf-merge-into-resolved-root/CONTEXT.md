# Context: tsk-4s0 — chan tu goc leaf approve vao root da resolved (piece 2 cua tsk-4qu)

## Feature boundary

Prevent (not just report) a leaf item's `approve` from landing its
`fgw/<leaf>` branch on a `fgw/<root>` branch whose root item is already
resolved (`delivered`/`retrospective`/`cleanup`/`done`). This is the
prevention half of a two-piece fix; the detection half (`checkRootDrift`
reporting `strandedAfterClose`) already landed via tsk-4qu.

Scope is `approve`'s own gate (`bin/fgos.mjs`, the actual enforcement
point — confirmed it never reads `mergeTier` at all) plus `mergeReadiness`'s
`ready`/`blockedOnSync` classification (`src/state/graph-harness.mjs`) so
`merge list`/herdr-plugin stop reporting a soon-to-be-refused leaf as
plainly "ready." Remediation of the two already-stranded branches
(tsk-4ns, tsk-53n) is explicitly out of scope — both were already resolved
by hand via `fgos sync-root`. See `plan.md` for the final approach
decision (piece 2's own (a) vs (b) call, and the graph-harness.mjs
consistency fix this uncovered).

## Locked decisions

| ID | Decision |
|---|---|
| D1 | ~~The set of "resolved" root statuses this block checks against is the SAME `COMPLETED_ROOT_STATUSES` set `checkRootDrift` already uses: `{delivered, retrospective, cleanup, done}`. `wontfix` stays excluded.~~ **Superseded by D2.** |
| D2 | The resolved-root check uses `isResolvedStatus` (`src/state/frontier.mjs:247`), NOT the narrower `COMPLETED_ROOT_STATUSES` D1 named — `wontfix` IS blocking, same as `delivered`/`retrospective`/`cleanup`/`done`. Found mid-planning: every other "is this ancestor closed out" gate already inside `mergeReadiness` (deps/mergeAfter/supersededOut, `src/state/graph-harness.mjs:107,109,155`) uses `isResolvedStatus`, which already treats `wontfix` as resolved via `statusCategory === 'canceled'`. D1's citation of tsk-4qu's Assumption #1 only justified piece 1's *reporting* exemption for `wontfix` ("an abandoned branch is supposed to sit unmerged, no need to flag its drift") — that reasoning does not transfer to piece 2's *prevention* gate: a leaf merging into a wontfix root's branch is stranded exactly the same way as one merging into a delivered root's branch, arguably worse since nobody is watching a wontfix branch at all. Confirmed with the user in conversation before locking. |

**Explicitly deferred to `fgos-coding-planning`, not decided here:** which of the
item's own two proposed directions to implement —
(a) reroute `mergeTier` to `root-to-main` for a leaf whose root is
resolved, letting it merge straight to main, vs.
(b) refuse `approve` outright with a clear message, requiring manual
handling.
The item's own description already assigns this choice to planning
("Hai huong de xuat, quyet luc plan") — this is an existing, explicit
decision made by whoever wrote the item, not a gap `fgos-coding-exploring` found;
overriding it here would silently relitigate a decision the item's author
already made. `fgos-coding-planning`'s own reality-check step is also the right
place to answer the risk the item itself names for option (a): does
merging straight to main skip any ordering constraint `approve` normally
enforces for a leaf-to-root merge.

## Pinned terms

- **root** — **correction, found mid-planning:** the item's actual `approve`
  gate (`bin/fgos.mjs`) does NOT use direct-parent-only resolution. It
  consistently calls `resolveRoot(view, id)` (imported as `n` from
  `src/runner/root-affinity.mjs`) for its real git merge target, its Iron
  Law diff base, and its `item.targets` drift check alike (`bin/fgos.mjs`
  lines 2795, 2837, 2939) — `resolveRoot` walks `item.parent` all the way
  to the top-level ancestor, not just one hop. `mergeTier`
  (`graph-harness.mjs:209`) is the one place in the codebase that still
  reads `item.parent` directly rather than `resolveRoot` — that is part of
  the bug this item fixes, not the intended semantic to preserve. Piece
  2's own check must match what `approve` actually merges into
  (`resolveRoot`'s walk), not `mergeTier`'s narrower reading, so a
  multi-level chain (leaf under a mid-level item under a resolved root) is
  correctly covered too — this doesn't expand scope, it's required for the
  fix to actually close the bug for any chain deeper than one level.
- **resolved** (root status) — see D2.

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
