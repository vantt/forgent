---
authoritative_for: hasStillNeededDescendant vs hasOpenDescendant, why they are NOT duplicates, tsk-577 false-positive block incident, comment-only cross-reference
---

# Two "identical-looking" descendant checks turned out to intentionally diverge

`tsk-3ofc` proposed a seemingly safe cleanup: `src/runner/loop.mjs`'s
`hasStillNeededDescendant` and `src/state/frontier.mjs`'s
`hasOpenDescendant` both answer "does this item have an open/still-
needed descendant" — the item's own description claimed they were
"semantically identical... confirmed by direct read" and proposed
deleting the `loop.mjs` copy in favor of the exported `frontier.mjs`
one. **Discovery-stage research found that claim false.**

## The real divergence, and why it exists

The two functions disagree on whether a descendant sitting in
`delivered`/`retrospective`/`cleanup` counts as "still needed":

- **`hasStillNeededDescendant` ("still needed," loop.mjs sense)** — a
  descendant whose status is anything other than `done`/`wontfix`.
  Broader — includes `delivered`/`retrospective`/`cleanup`.
- **`hasOpenDescendant` ("open," frontier.mjs sense, via
  `isResolvedStatus`)** — a descendant whose status is not in
  `{delivered, retrospective, cleanup, done}` and is not `wontfix`.
  Narrower.

`loop.mjs`'s own docstring already stated this outright before the item
even started: "Do not consolidate this with `hasOpenDescendant` — the
two intentionally answer different questions." The divergence traces to
a real prior incident: **`tsk-577`'s 14-item false-positive block** —
exactly the range of statuses (`delivered`/`retrospective`/`cleanup`) the
two functions disagree on. Merging them the way the item's own
description proposed would have reintroduced that same false-positive
class.

## What shipped — scoped down after the false premise was caught

Locked as a single explicit decision (D1): scope the item down to a
**comment-only bidirectional cross-reference** between the two functions
— so a future reader scanning either one immediately sees a lookalike
exists elsewhere and why they are deliberately not merged — instead of
the originally described function consolidation. No behavior change, no
function deletion, no call-site edit. `frontier.mjs`'s own
`hasOpenDescendant` gained the same warning `loop.mjs` already had, on
its own side, where no such pointer previously existed.

## Why this matters beyond this one item

A concrete instance of this repo's own discovery-gate discipline working
as intended: a plausible-sounding, "confirmed by direct read" dedup claim
was falsified by actual research before any code shipped against it —
the same pattern already seen in [`tsk-1ji`'s merge-abort hypothesis](events-jsonl-opportunistic-truncation-check.md)
being empirically falsified during validating. Two lookalike functions
that read as duplicates at a glance can carry real, load-bearing
behavioral differences traceable to a specific past incident.
