# work-item-backlog-status — research

Item: `tsk-5wr`. Add a globally-shared `backlog` status before `todo` in
the work-item lifecycle (not a domain-relabeled status), named `backlog`
(never `propose`/`proposed`), and make clarify-stage discovery treat
`backlog` items as candidates the same way `todo` items already are.

## Round 1 — 2026-08-10 (stage `discovery`, clarify → discovery)

**Asked:** Does the item's own description/acceptance text accurately
reflect the real code it cites? (Two-branch mechanical routing — every
named file/decision the goal depends on lives in this repo, so every check
below is a repo search, no external lookup needed.)

**Checked:**
- `src/state/work.mjs:83-93` (`STATUSES`) — read directly.
- `src/state/status-fsm.mjs:99-135` (`TRANSITIONS`) — read directly.
- `src/state/discover-pool.mjs:1-24` (`CLARIFY_SHAPED_STAGES`,
  `CANDIDATE_STAGES`, `isCandidate`) — read directly.
- `src/state/frontier.mjs:138-151` (`isReadyStatus`) — read directly.
- `src/state/workflow-stage-graphs.mjs:162-198` (`statusLabels`,
  `statusCategory` framing) — read directly.
- `docs/decisions/0024-doi-ten-status-proposed-thanh-awaiting-approval.md`,
  `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-
  base-workflow-model-d1-d3.md` — existence confirmed (`ls
  docs/decisions/`).
- `docs/history/phase-2-status-category-schema/` — existence confirmed
  (`CONTEXT.md`, `DISCUSSION.md`, `plan.md` all present).
- `plans/reports/research-260730-0931-work-item-schema-multi-domain-
  upgrade-report.md` — existence confirmed.
- `docs/history/backlog-execution-reconciliation/` — a DIFFERENT, unrelated
  feature (`tsk-3vv`, reconciles `docs/backlog.md` PBI rows against
  `.fgos/state.json`); ruled out as a naming collision, new folder created
  instead (`work-item-backlog-status/`).

**Found:**
- `STATUSES` today has exactly 10 entries (`todo`, `doing`, `blocked`,
  `awaiting-approval`, `delivered`, `retrospective`, `cleanup`, `done`,
  `awaiting-human`, `wontfix`) — matches the item's own "hiện có 10 (này sẽ
  là 11)" claim.
- `TRANSITIONS` is confirmed the single global, domain-agnostic table
  (`status-fsm.mjs`) — matches acceptance criterion 1's framing exactly.
  Edge count in the file is ~24-25 (approximate grep, comments interleaved)
  — close to the item's "24 cạnh" claim; exact count is an implementation
  detail for planning, not a discovery blocker.
- `discover-pool.mjs`'s real structure is `CLARIFY_SHAPED_STAGES =
  {clarify, discovery, exploring}` and `CANDIDATE_STAGES =
  CLARIFY_SHAPED_STAGES ∪ {decompose}`, with `isCandidate = status ===
  'todo' && CANDIDATE_STAGES.has(stage)` — confirms acceptance criterion 3
  is precisely actionable: splitting the status check so
  `CLARIFY_SHAPED_STAGES` accepts `{todo, backlog}` while the
  `decompose`-only branch stays strict `todo`-only is a real, scoped code
  change against this exact structure (line numbers in the item text,
  22-24, are off by a few from today's 19-21 — harmless drift, not a
  factual error).
- **New finding, not yet in the item's own acceptance text:**
  `frontier.mjs`'s `isReadyStatus` (line 150) is a *positive*-match filter
  — `item.statusCategory === 'todo'` (falling back to the literal
  `item.status === 'todo'` only when `statusCategory` is undefined) — not
  an exclusion list. `awaiting-human`/`doing`/`blocked` are already
  excluded from `ready` today purely because their `statusCategory` is
  `in-progress`, never `todo` — there is no separate "exclude these
  statuses" code path to mirror. This means: **if `backlog` is given its
  own distinct `statusCategory` (the still-open acceptance criterion 6),
  `frontier.mjs` requires no additional code change at all** — it already
  excludes anything whose category isn't `todo`. Acceptance criterion 7
  ("frontier.mjs phải loại backlog... mirror cách nó đã loại
  awaiting-human") is answered by this same mechanism, not a parallel one.
  This sharpens (but does not replace) the open decision in criterion 6 —
  worth carrying into `exploring`.

**Still open (product/design decisions, not discovery gaps — for
`fgos-exploring`/`fgos-planning`, per this skill's own scope boundary):**
1. Which role(s) may fire the new `backlog -> todo` edge (item's own
   acceptance criterion 4).
2. Whether `fgos submit`'s default creation status changes from `todo` to
   `backlog`, and whether `fgos add` stays `todo` (criterion 5).
3. Whether `backlog` gets its own `statusCategory` or reuses `todo`'s
   (criterion 6) — sharpened above: this choice also fully determines
   `frontier.mjs`'s behavior for free, no separate frontier-side decision
   needed.

## Verdict

**Clear.** Every file/decision-doc reference in the item's description
checked out against the real code (line-number drift only, no factual
conflict). The remaining open points are downstream product/design
decisions the item's own acceptance text already flags as undecided — in
scope for `fgos-exploring`, not a discovery gap. `verify` stays the
not-yet-determined placeholder; a real verify command is `fgos-planning`'s
job once the design decisions above are locked.
