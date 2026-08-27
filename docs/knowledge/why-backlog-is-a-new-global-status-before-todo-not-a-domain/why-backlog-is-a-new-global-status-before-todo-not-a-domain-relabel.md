---
framework: diataxis
mode: explanation
---
# Why `backlog` is a new global status before `todo`, not a domain relabel

Before this item (`tsk-5wr`), the work-item lifecycle had no place for "an
idea, not yet decided whether to commit to" — every item submitted landed
straight at `todo` ("decided, ready to start"). `backlog` is the new
status that fills that gap.

## Global, not domain-owned — symmetric with the tail segment

`backlog` is a **PHO QUAT** (universal, domain-agnostic) status, added to
`work.mjs`'s `STATUSES` and `status-fsm.mjs`'s `TRANSITIONS` — the two
flat tables shared by every domain — never something a domain declares for
itself through `statusLabels`/the `DOMAINS` registry. This mirrors
decision `0027`, which already fixed the four tail-segment statuses
(`delivered`/`retrospective`/`cleanup`/`done`) as global-only, never
domain-relabeled: `0027` already framed "domain owns the transition table"
as false even for those six front statuses (a domain only owns the
*mapping* from status to a human-readable label via `statusLabels`, never
the literal status value or the edge itself). `backlog` needed one new
value, so it went through the same two global tables — there was no
domain-local path available even if one had been wanted.

## Never `propose`/`proposed`

The vocabulary `propose`/`proposed` was deliberately avoided. Decision
`0024` had already retired it — renaming `proposed` to `awaiting-approval`
specifically because "abstract noun, doesn't say what it's waiting for."
Reusing `propose` here for a completely different meaning (initial-intake,
not review-pending) would have resurrected a term the codebase had already
killed for being unclear, and confused old git history and docs that still
reference the retirement. `backlog` is the name that survived scrutiny.

## Four decisions locked before implementation

**D1 — only a human fires `backlog -> todo`.** `transitionWork`
(`src/state/status-fsm.mjs`) never enforces `role` as an ACL — `role` is
attribution-only, stamped onto the event payload and never checked against
the requested edge. Every existing "human-only" edge in this codebase
(`move --to delivered`, `approve`, `done`) works the same way: the CLI
handler that exposes the edge hardcodes `role: 'human'` unconditionally,
rather than the engine authenticating the caller. `backlog -> todo`
follows the identical convention — a real commitment decision ("start
actually doing this now"), not a mechanical hop, mirrors how `reject` and
`answer` already work.

**D2 — the default status stays `todo`; a new opt-in entry point creates
`backlog` items directly.** `fgos submit` and `fgos add` both keep
`status: 'todo'` as their default — including items created through
`/fgOS:cook`, since that path always carries an immediate execution plan.
Landed as an additive `--backlog` boolean flag on both `submit` and `add`
(`bin/fgos.mjs`: `status: opts.backlog ? 'backlog' : 'todo'`) — an omitted
flag changes nothing about either existing default.

**D3 — `backlog` gets its own `statusCategory`, never a reuse of
`'todo'`.** This was already reserved, unused, in the schema before this
item: `STATUS_CATEGORIES` (`src/state/work.mjs`) already declared exactly
`['backlog', 'todo', 'in-progress', 'review', 'completed', 'canceled']`,
with the schema's own comment noting `backlog` and `completed` had no
status mapped into either category yet. This item is what actually wires
`backlog -> 'backlog'` into `DOMAINS.coding.statusLabels`
(`workflow-stage-graphs.mjs`) — no new category needed inventing.

The consequence falls out for free: `frontier.mjs`'s `isReadyStatus` is a
*positive*-match filter (`item.statusCategory === 'todo'`), not an
exclusion list. Once `backlog` carries its own distinct `statusCategory`,
`frontier.mjs` already excludes it from `ready`, the same mechanism that
already excludes `doing`/`blocked`/`awaiting-human` — no separate
frontier-side code change was needed to satisfy "backlog items must never
look ready."

**D4 — `herdr-plugin` visibility is in scope, not a follow-up, and the bar
is "findable," not "doesn't crash."** Before this item, `WorkTab::matches`
(`herdr-plugin/src/app.rs`) was a 4-arm exhaustive match over exactly
`Todo`/`Doing`/`Review`/`Done` — an item at `backlog` matched none of the
four tabs and was invisible in the TUI entirely.
`next_auto_discover_candidate` (`herdr-plugin/src/main.rs`) already
correctly excluded `backlog` from unattended auto-discover (a literal
`status == "todo"` match), so that half needed no fix — but invisibility
in the one interactive browsing surface meant a `backlog` item, whose
`backlog -> todo` promotion is human-only by D1, could never actually get
promoted, defeating the whole feature. Landed as a dedicated `Backlog` tab
(`WorkTab::Backlog`, declared first in the tab strip, wrapping
`Done -> Backlog -> Todo -> ...`) rather than folding backlog items into
the existing `Todo` tab with a marker.

## Root item, four children — decomposed, not implemented directly

This item (`tsk-5wr`) itself never touched code: `fgos-coding-planning`
split it into four children along the fault lines the decisions above
already implied — schema/transition core, the `--backlog` submit/add
flag, `discover-pool.mjs` candidacy (so `fgos-clarifying` still runs on a
`backlog` item the moment it's created, rather than waiting for a human to
promote it to `todo` first), and `herdr-plugin` visibility. The root
carries the design rationale; the mechanics live in its children.

## Zero migration for existing items

`backlog` is a purely additive new value — it changes no existing status's
meaning, and no pre-existing item silently "falls into" `backlog`. It only
affects items created after this item shipped, and only when a caller
explicitly passes `--backlog`.

## Proof

`npm test` green — the schema/transition core, the CLI flag, the
`discover-pool.mjs` candidacy fix, and the `herdr-plugin` Rust test suite
(`tabs_classify_status_into_backlog_todo_doing_review_done`, confirming a
`backlog` item appears in the `Backlog` tab and no other, and is never
read as ready) all landed and pass across the four children.
