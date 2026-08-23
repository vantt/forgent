# Research: tsk-4bh — checkMergeStillResolves never skips wontfix/canceled children

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 5's description
(`checkChildrenResolve`, inside `checkMergeStillResolves`, requires EVERY
child's sha to be an ancestor, no status filter)? What is the concrete,
provably-safe fix — literally "reuse `isResolvedStatus`'s canceled branch"
as the report suggests, or something narrower?

**Checked:**
- `src/state/cleanup-harness.mjs:141-183` (`checkMergeStillResolves`,
  `checkChildrenResolve`) — read directly. Confirmed: `Object.entries(view.work
  ?? {}).filter(([, item]) => item.parent === id)` at the children-
  collection line has no status filter, and `checkChildrenResolve` recurses
  into EVERY child unconditionally — exactly as described.
- `src/state/frontier.mjs:244-252` (`isResolvedStatus`,
  `TAIL_RESOLVED_STATUSES`, `LEGACY_CANCELED_STATUS`) — read directly.
  `isResolvedStatus` returns true for BOTH a tail-resolved status
  (`done`/`delivered`/`retrospective`/`cleanup`) AND a canceled/wontfix
  status — it does not distinguish the two.
- `src/runner/claim-port.mjs:167-175` — the report's own cited precedent —
  read directly: uses `isResolvedStatus` wholesale for a dep-readiness
  gate, where "resolved" (done) and "canceled" (wontfix) are equally fine
  to proceed past — a DIFFERENT semantic need than this item's own.

**Found:** the report's own literal suggestion ("reuse `isResolvedStatus`'s
canceled branch") would be WRONG if implemented as "call `isResolvedStatus`
wholesale" — that would ALSO skip the ancestry check for a legitimately
`done`/`delivered` child, defeating the entire diagnostic purpose of
`checkMergeStillResolves` for the normal, successful case. The report's
phrase "canceled branch" (singular, referring to one branch of
`isResolvedStatus`'s own if/else logic, not the whole function) is the
correct reading — confirmed by re-reading `isResolvedStatus`'s own body:
it is a two-part OR (`TAIL_RESOLVED_STATUSES.has(status)` OR canceled), and
only the canceled half is what this item needs. No existing standalone
helper isolates just that half (`grep -rn "statusCategory === 'canceled'"
src` — only one hit, inside `isResolvedStatus` itself).

**Decided:** extract the canceled-only check as its own exported function,
`isCanceledStatus(item)`, in `frontier.mjs` (never a tail-resolved status,
only the canceled/wontfix branch), and refactor `isResolvedStatus` to call
it (`isResolvedStatus = TAIL_RESOLVED_STATUSES.has(status) ||
isCanceledStatus(item)` — byte-identical external behavior, confirmed by
running the full existing `frontier.test.mjs` suite unchanged against the
refactor). `cleanup-harness.mjs` then filters canceled children out of the
children-collection step using this new helper, before either the
`children.length > 0` branch or `checkChildrenResolve` ever sees them.

**Edge case considered and left alone (not this item's scope):** if EVERY
child of a decomposed root is canceled, the post-filter `children` list is
empty, and the code falls through to the SAME leaf-shaped ancestry check on
the item's own recorded sha that a genuinely childless decomposed item
already gets (an existing, separate, undocumented limitation this item does
not newly introduce or worsen — see `checkMergeStillResolves`'s own
DECOMPOSED-PARENT FALLBACK doc comment on why a decomposed item's own sha is
"structurally never a valid signal"). Finding 5's own failure scenario is a
MIXED case (some children resolve, one is wontfix) — this fix closes that
exact scenario; the all-canceled edge case is a pre-existing gap, not new.

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/state/cleanup-harness.test.mjs test/state/frontier.test.mjs
```
(existing suites covering both `checkMergeStillResolves`'s own decomposed-
parent/root recursion tests and `isResolvedStatus`'s own precedence rules;
two new cases added proving Finding 5's exact scenario is closed for both
the legacy `wontfix` status string and the modern `statusCategory:
'canceled'` shape, without weakening the existing "one genuinely
unresolved child still fails" regression guard.)
