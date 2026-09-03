---
type: reference
title: State-machine module file names (fsm.mjs/stage.mjs rename)
tags: [state, fsm, naming]
timestamp: 2026-08-06T09:51:30.000Z
source_capture_ids: [tsk-3id]
framework: diataxis
mode: reference
---

# State-machine module file names

`src/state/`'s two finite-state-machine modules were renamed for clarity
(`tsk-3id`, commit `7e01c80`) — exports unchanged, only the file names
and every prose reference to them:

| Old name | Current name |
|---|---|
| `src/state/fsm.mjs` | `src/state/status-fsm.mjs` |
| `src/state/stage.mjs` | `src/state/stage-fsm.mjs` |

Every real import site, the Iron Law self-modification rule and its test
fixtures, and `docs/architecture-manifest.json`/`docs/architecture-map.md`'s
file-map rows were updated to match.

## Related, now-corrected naming drift

The same fix pass corrected every remaining stale prose reference to the
pre-`STR66` `src/state/domains.mjs` name (`STR66`'s real rename target,
`src/state/workflow-stage-graphs.mjs`, had already landed on `main` —
confirmed via `git log` commit `9cf7138`, 2026-07-22 — this item only
found and closed leftover comment drift, never re-did the rename itself),
including `workflow-stage-graphs.mjs`'s own file header, which still
called itself `domains.mjs`.

## Related

- `docs/architecture-map.md` — the canonical file-map, kept in sync by
  this rename.
