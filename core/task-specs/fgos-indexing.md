# task-spec: fgos-indexing

domain: core | role: indexer | scope: enduser-docs | requires-skill: fgos-indexing

## Input
- End-user markdown documents located under `docs/<quadrant>/` (`how-to`, `tutorials`, `reference`, `explanation`).
- `QUADRANT_META` definitions in `src/report/enduser-index.mjs`.
- Resolved main checkout root directory (`--dir "$root"`).

## Output
- Regenerated catalog `docs/enduser-docs-index.json`.
- Pointer in `docs/specs/reading-map.md` verified/updated for `docs/enduser-docs-index.json`.

## Gates
- Soft: Idempotent regeneration — skips disk write when index content is unchanged.
- Hard: Reads `purpose`/`audience` strictly from `QUADRANT_META` in `src/report/enduser-index.mjs`; never hand-edits `docs/enduser-docs-index.json`. Does not write or classify documents itself (that belongs to `fgos-coding-compounding`).

## Verify-template
- Verification check `fgos doctor` (check `enduser-docs-index-stale`).

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| End-user doc added or modified by compounding | index-refresh (sync) | fgos-indexing | regenerate | updated `docs/enduser-docs-index.json` |
| No trigger matches | — regenerate index from disk — | | | |
