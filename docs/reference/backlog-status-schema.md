---
type: reference
title: backlog status schema
tags: [status-fsm, backlog, work-item, schema]
source_capture_ids: [tsk-5vs, tsk-4rdi, tsk-1av]
authoritative_for: the schema shape of the backlog work-item status — STATUSES, TRANSITIONS, and statusLabels wiring
---
# `backlog` status schema

`backlog` is a global, domain-agnostic work-item status — "an idea not
yet committed to work," distinct from `todo` ("committed, ready to
start"). It sits before the six domain-owned front-segment statuses
(`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/
`wontfix`), symmetric with the four global tail-segment statuses
(`delivered`/`retrospective`/`cleanup`/`done`) decision `0027` already
fixed as global-only, never domain-relabeled. Full design:
`docs/history/work-item-backlog-status/CONTEXT.md`.

## Schema wiring

| Field | File | Change |
|---|---|---|
| `STATUSES` | `src/state/work.mjs` | `'backlog'` added |
| `TRANSITIONS` | `src/state/status-fsm.mjs` | `{from: 'backlog', to: 'todo'}` added — a plain edge, same shape as the existing `blocked -> todo` edge, no `reason`/`ask`/`answer` requirement |
| `DOMAINS.coding.statusLabels` | `src/state/workflow-stage-graphs.mjs` | `backlog: 'backlog'` added, wiring the already-reserved `STATUS_CATEGORIES` `'backlog'` slot |

`frontier.mjs` needed no code change: its positive-match filter already
excludes any non-`todo` category, so a `backlog` item is automatically
kept out of the pick frontier once the category exists.

## Product decisions locked alongside the schema

- **D1** — the `backlog -> todo` transition fires only by a human (never
  an automated promotion).
- **D2** — `fgos submit`/`fgos add` keep defaulting to `status: 'todo'`;
  a separate, dedicated entry point creates an item directly at
  `backlog`.
- **D3** — `backlog` gets its own `statusCategory`, never a reuse of
  `'todo'`'s category.
- **D4** — `herdr-plugin`'s `WorkTab::matches`/`next_auto_discover_candidate`
  needed a matching fix so a `backlog` item is correctly excluded from
  auto-discover, scoped into this same item rather than deferred.

## Entry point: `fgos submit --backlog`

Per D2 above, `fgos add` stays untouched — it always creates at `todo`.
`fgos submit` gained the dedicated entry point instead: `submitWork`
takes a new optional `opts.backlog` flag (the same optional shape as the
existing `opts.async`). When set, the created item's `status` is
`'backlog'` instead of the hardcoded `'todo'` literal
(`bin/fgos.mjs:921`) — the one and only place a work item can be created
directly into `backlog` rather than reaching it later some other way.

## `fgos-clarifying` can run directly on a `backlog` item

`src/state/discover-pool.mjs`'s `isCandidate` status check is split by
stage shape: a `discoverableStages` candidate (`discovery`/`exploring`
for the `coding` domain) now accepts status `todo` **or** `backlog`; a
decompose-stage candidate (the drain-only legacy path) stays strict
`todo`-only, unchanged. This lets `fgos-clarifying` clarify a backlog
item's description while it still sits at `backlog` — clarification does
not require promoting the item to `todo` first.
