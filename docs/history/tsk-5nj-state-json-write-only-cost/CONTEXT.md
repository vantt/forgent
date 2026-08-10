# CONTEXT: state.json — real incrementally-read snapshot, split in two

Item: `tsk-5nj`. Feature boundary: `state.json` today is write-only dead
weight (~86ms/mutation, double-stringified, never read by production code)
carrying two live defects (unlocked write, non-atomic write). This item
makes it a real, incrementally-readable snapshot instead of deleting it.

## Locked decisions

**D1 — Direction: real snapshot, not deletion.** The item's own description
posed this as an open decision ("bỏ hẳn, hay làm cho nó thành snapshot thật
sự"). User chose real snapshot, explicitly to also start attacking the
full-log-replay tax this session's `tsk-3jh`-adjacent daemon proposal
(`plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md`) named as a
larger, unscheduled problem.

**D2 — Scope: full byte-offset seeking, not fold-only.** Per RESEARCH.md:
an incremental *fold* alone (skip re-applying already-folded events) does
NOT skip the dominant cost, which is `readEvents`'s own full-file
read+parse (26ms of `rebuildView`'s ~31ms). User explicitly chose to also
add byte-offset seeking (skip re-reading already-folded log bytes), not
just the smaller fold-only option — accepting the larger scope and
correctness burden that requires (D3).

**D3 — Split into two pieces, safety first.** Per RESEARCH.md's own risk
finding: any cached byte offset can be silently invalidated by 3
independent log-rewrite paths (`repairTruncatedLastLine`,
`scripts/events-jsonl-contiguity.mjs --fix`, git's own `merge=union`
driver on `events.jsonl`) — an offset trusted without content validation
can silently skip or duplicate events on fold. User confirmed splitting
rather than one large piece:
- **Piece 1 (safety fixes, low risk):** move `refreshView`'s write inside
  the same lock `withEventsLock` already holds for the append; make
  `writeView` atomic (tmp-file-then-rename). No behavior change to what
  is written, only to how safely it is written.
- **Piece 2 (incremental-read snapshot, high risk):** `foldEvents` accepts
  an optional seed view; `state.json` gains a byte-offset watermark plus a
  content hash of the log bytes `[0, offset)`; `rebuildView` re-hashes
  that range before trusting the offset, falling back to a full read on
  any mismatch (never wrong, only ever loses the perf win for that one
  call). Requires `fgos-validating`'s feasibility matrix to prove the
  anchor-hash invalidation against all 3 rewrite paths named above before
  implementation proceeds, not just plausibility.

Piece 2 depends on Piece 1 landing first (the lock-scope fix must be in
place before more logic gets added to the same write path).

## Scout evidence

- `src/state/store.mjs:88-112` (`writeView`, `refreshView`, lock-scope
  boundary at `:673-674`), `src/state/replay.mjs:30-33` (`foldEvents`),
  `:523-526` (`rebuildView`), `:542-544` (`viewRevision`) — read in full,
  cited in RESEARCH.md.
- `src/state/events.mjs:78-108` (`readEvents`), `:142-187`
  (`repairTruncatedLastLine`) — read in full.
- `scripts/events-jsonl-contiguity.mjs` header comment — `--fix`'s
  dedupe+resort+renumber behavior, confirmed can reorder every line.
- `.gitattributes` — `events.jsonl merge=union`, the third silent-rewrite
  path.
- grep across `src/`+`bin/` for `state.json` reads — confirmed zero
  production readers today.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` (D1's pointer
  — the larger, separately-captured performance initiative this item is a
  smaller, concrete step toward, never the same scope)

## Outstanding questions

None
