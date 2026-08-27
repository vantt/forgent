# Research: submit's dependency-candidate scan misses `delivered` items (tsk-68j)

## Round 1 — 2026-08-27 (discovery stage)

**Asked:** Where is `fgos list`'s default status-filter set defined, and
what other consumers rely on that same default? Does the repo already have
precedent for widening a status-scoped read to catch `delivered`-but-not-
yet-`cleanup` items, and is there a clearly-correct pick among the item's
3 proposed options, or does the choice carry real trade-offs a person
should decide?

**Checked (repo):**
- `bin/fgos.mjs:2647-2660` — `list`'s default view filters
  `Object.entries(rawView.work).filter(([, item]) => !isResolvedStatus(item))`
  unless `--all` is passed. `isResolvedStatus` (`src/state/frontier.mjs:266`)
  treats `done`/`wontfix`/`delivered`/`retrospective`/`cleanup` as resolved
  (see `TAIL_RESOLVED_STATUSES` at `src/state/frontier.mjs:244`,
  `delivered`/`retrospective`/`cleanup`/`done`). This confirms the item's
  own claim: default `list --json` excludes all four tail statuses, not
  just `delivered`.
- `plugins/fgOS/skills/submit/SKILL.md:65-71` — step 2's own scan command
  is exactly `list --json` (no `--all`), confirming the item's cited
  evidence verbatim.
- `herdr-plugin/src/fgos.rs` (per `bin/fgos.mjs:2722-2726`'s own comment):
  every one of its 3 call sites uses `["list", "--all", "--json"]`
  verbatim — i.e. the one other consumer in this codebase that needs a
  *complete* picture across all statuses already always widens with
  `--all`, never relies on the narrow default. This is a real precedent
  for Option 1 (widen the scan) over Option 2 (leave narrow, just
  document).
- No existing code in this repo implements a "recency-based" duplicate
  check (Option 3) — grepped for `recency`, `recentlyDelivered`,
  `sinceDelivered` style helpers in `src/state/*.mjs` and
  `plugins/fgOS/skills/submit/*`: no hits. Option 3 would be new
  machinery, not an existing pattern to reuse.

**Still open (a real product/scope choice, not a fact gap):**
- Option 1 itself has an unresolved sub-choice the item explicitly leaves
  open: widen to bare `--all` (pulls in `done`/`wontfix` too — arguably
  useful, since a `wontfix` hit is exactly the kind of "don't resubmit
  this" signal a duplicate scan should catch, but pulls significantly more
  rows into the same-turn heuristic match) vs. a narrower
  `delivered`/`retrospective`/`cleanup`-only filter (matches the item's own
  stated root cause precisely, smaller working set, but is a filter shape
  that does not exist anywhere else in this codebase today — would be new,
  scan-specific logic, not a reuse of the existing `--all` flag).
- No repo evidence favors Option 2 (document-only) or Option 3 (dedicated
  recency check) over Option 1 on technical grounds — the choice among the
  three, and the width of Option 1's own filter if chosen, is a scope
  decision the item's own text explicitly left open ("Options to consider
  (not prescribing one)"). This is not resolvable by further research; it
  needs a person's call.
