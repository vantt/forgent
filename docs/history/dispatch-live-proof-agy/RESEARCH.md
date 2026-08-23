# RESEARCH.md — tsk-52z (dispatch live-tee + agy trigger proof)

## Round 1 — 2026-08-17

**Asked:** Does `examples/dispatch-live-proof-agy/` already exist (naming
collision)? Is `node --test` the established, working pattern for a
standalone demo file + test pair in this repo?

**Checked:**
- `find examples -iname "*dispatch-live-proof-agy*"` on `fgw/tsk-52z`
  (branched from main `15ad6f06`) — `examples/` does not exist at all on
  this branch yet. No collision.
- `git show fgw/tsk-1fk:examples/dispatch-proof-agy/reverse-string.mjs` and
  `.../reverse-string.test.mjs` — read directly from tsk-1fk's own branch
  (not yet merged, so invisible on `main`/this worktree's checkout, but the
  objects are fetchable via `git show <branch>:<path>` without switching
  branches). Confirmed the exact working pattern: ESM `export function`,
  `import test from 'node:test'`, `import assert from 'node:assert/strict'`,
  relative import of the sibling `.mjs`, one `test(...)` block with
  `assert.strictEqual` calls.
- `git show fgw/tsk-1fk --stat` — commit `0624ee54` shows this precedent
  shipped as exactly 2 files (impl + test), no extra scaffolding.

**Found:**
- No naming collision — clear to create
  `examples/dispatch-live-proof-agy/double-number.mjs` +
  `double-number.test.mjs`.
- `node --test <path>` is a real, already-proven verify command in this
  repo for this exact shape of demo item (tsk-1fk precedent, same
  `docs/history/dispatch-proof-agy/` lineage this item is a follow-up of).

**Open:** none — both points resolved with direct evidence.
