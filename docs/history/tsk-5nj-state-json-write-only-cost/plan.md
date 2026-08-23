# Plan: state.json real-snapshot split

Item: `tsk-5nj`. Mode: **standard** — real split into two independently
workable pieces (D3), not one honest piece.

## Approach

Per D1/D2/D3 (CONTEXT.md): direction is a real, incrementally-read
snapshot with full byte-offset seeking, split so the safety fixes land
before the higher-risk seeking mechanism is added on top of them.

Impact-analysis posture: **degraded** (GitNexus present per `fgos tool
query`, but this session's own PostToolUse hook repeatedly flags the
index as stale). Both children's own plan work will re-check this at
their own `fgos-coding-planning` pass; noted here so `fgos-coding-validating`'s reality
gate has an honest starting posture rather than assuming a fresh index.

`fgos graph --what-if` was not run to pick between the two pieces' order
— the order is fixed by real code dependency (piece 2's own seeking
mechanism adds logic on top of the same write path piece 1 makes safe),
not a frontier-priority judgment call; `tsk-4mx` (piece 2) carries piece
1's id in its own `deps`.

## Split

- **`tsk-4mx`** — state.json write moves inside `events.lock` and becomes
  atomic (tmp+rename). Risk: light. Verify: `node --test
  test/state/store.test.mjs && npm test`. No behavior change to what is
  written, only how safely.
- **`tsk-49e`** — state.json becomes an incrementally-read snapshot
  (byte-offset seek + anchor-hash validation against all 3 known
  log-rewrite paths). Risk: heavy, `deps: [tsk-4mx]`. Verify: `node --test
  test/state/store.test.mjs test/state/replay.test.mjs
  test/state/events.test.mjs && npm test`. Requires a real feasibility
  matrix at its own `fgos-coding-validating` pass proving the anchor-hash
  invalidation against `repairTruncatedLastLine`,
  `scripts/events-jsonl-contiguity.mjs --fix`, and a real
  `merge=union` reorder — plausibility is not sufficient given the
  correctness stakes named in RESEARCH.md.

Both children already created via `fgos add --parent tsk-5nj --footprint
...` with real, runnable verify commands and their own `deps`/risk —
never a placeholder.

## Cases (per child, sketched here at the parent level since both pieces
share the same underlying subject)

- **Boundary**: empty log, single-event log — snapshot machinery must not
  assume at least one prior mutation exists.
- **Existing behavior unchanged**: every current caller of `listWork`/
  `rebuildView` gets the exact same folded view either way — the snapshot
  is purely a performance path, never a second source of truth (D3 pins:
  wrong-in-doubt always falls back to the always-correct full read).
- **Concurrent access**: two processes mutating close together must not
  race on `state.json` itself once piece 1 lands (regression guard for
  the very defect being fixed).
- **Partial failure**: a crash mid-write to `state.json` must never leave
  a file a subsequent read trusts as complete (atomic write, piece 1); a
  log rewritten by any of the 3 known paths must never be silently
  under-read (anchor-hash fallback, piece 2).

## Outstanding questions

None
