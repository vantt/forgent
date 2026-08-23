# tsk-5wr — Iron Law evidence

Item: `tsk-5wr` — "Them status backlog..." (add a `backlog` status ahead of
`todo` in the work-item lifecycle). This is the DECOMPOSED PARENT of the
`work-item-backlog-status` feature; it carries no direct code changes of
its own (per its own driver-report decisions: "No stage skill invoked and
no parent-level implementation attempted: the parent text was already
decomposed into these 4 children, so the work belongs to them, not to the
root").

## Classification

`classifyIronLaw` against the real committed `main...fgw/tsk-5wr` diff:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/status-fsm.mjs","src/state/workflow-stage-graphs.mjs"]}
```

No `matchedFlags`: nothing in this item's own text trips a heavy risk
keyword.

## Why there is no new failing-test-first run here

`git diff --stat main fgw/tsk-5wr` is exactly the union of the 4 children's
own diffs, nothing more (21 files, matching `tsk-5vs` + `tsk-4rdi` +
`tsk-1av` + `tsk-584` file-for-file) — confirmed by reading the diffstat
directly rather than assumed. Each child already carries its own real
failing-before/passing-after proof for the module(s) it touched:

- `docs/history/tsk-5vs/iron-law-evidence.md` — `src/state/work.mjs`,
  `src/state/status-fsm.mjs`, `src/state/workflow-stage-graphs.mjs`
  (schema core: `backlog` added to STATUSES/TRANSITIONS/statusLabels).
- `docs/history/tsk-4rdi/iron-law-evidence.md` — `bin/fgos.mjs`
  (`--backlog` submit flag).
- `docs/history/tsk-1av/iron-law-evidence.md` — `src/state/discover-pool.mjs`
  (clarify-shaped-stage candidacy widened to accept `backlog`).
- `docs/history/tsk-584/iron-law-evidence.md` — `herdr-plugin/src/app.rs`,
  `herdr-plugin/src/main.rs`, `herdr-plugin/src/ui.rs` (TUI `BACKLOG` tab).

Re-proving those same modules here with a fresh failing-before run would
not test anything different — the root introduces no behavior beyond what
those four documents already prove, individually and with real
failing/passing transcripts.

## Verify command

The item's own recorded `verify`, set explicitly for this closing step
(the item predated a real verify value):

```
npm test
```

## Passing after (the full merged tree, `fgos return`'s own run)

```
ℹ tests 3147
ℹ suites 0
ℹ pass 3142
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 44653.992136
```

This is the combined tree — all 4 children merged into `fgw/tsk-5wr` —
verified green as a whole, not just piecewise. The Rust side
(`herdr-plugin`, `tsk-584`'s footprint) is not included in `npm test`;
it was verified separately and is documented in
`docs/history/tsk-584/iron-law-evidence.md`, and re-verified green again
during this item's own `fgos catchup` step (146 tests, 4 suites, 0 fail)
when `tsk-584`'s branch was caught up to include `tsk-4rdi`'s already-
landed `CHANGELOG.md` entry.

## Merge conflict resolved during this rollup (not a code change)

`tsk-584`'s first approve attempt hit a real `CHANGELOG.md` conflict
against `tsk-4rdi`'s already-landed `## [Unreleased]` entry — both
branches independently inserted a bullet at the same position. Resolved
by keeping both entries (no other content touched), re-verified
(`cargo test`, 146/146 green), and re-landed via `fgos catchup tsk-584`.
Purely textual; no logic change.

## Blast radius

`bin/fgos.mjs`, `src/state/status-fsm.mjs`, `src/state/workflow-stage-graphs.mjs`
are each already covered by their owning child's own blast-radius section
(`tsk-5vs`, `tsk-4rdi`). This item adds no new symbol touches beyond that
union.
