# Plan: make priority-write catch blocks emit a visible signal

Item: `tsk-6d8`. Mode: **tiny** — two catch blocks, one line each, no split.

## Approach

Per D1: change `catch {}` to `catch (err) {}` in both
`discovery.mjs`/`decompose.mjs`'s priority-write try blocks, adding one
`process.stderr.write` line naming the item id and `err.message`. Fail-safe
control flow unchanged — nothing re-thrown, nothing else added to the catch
body.

Files touched: `src/intake/discovery.mjs`, `src/intake/plan.mjs`
(the priority-write catch only — the separate "decompose completeness
advisory" catch later in the same file is a different concern, not named
by this item's own citation, left untouched).

Impact-analysis posture: **degraded** (GitNexus present, stale) — minimal
risk: additive stderr write inside an existing catch, no control-flow
change.

## Cases

- **Boundary**: a write that succeeds — no stderr output, unchanged.
- **Existing behavior unchanged**: the clarify/unclear resolution
  following the try/catch still runs identically on failure.
- **Regression guard**: existing discovery.test.mjs/decompose.test.mjs
  tests exercising the legacy-invalid-shape path (which relies on this
  catch firing) must still pass.

## Outstanding questions

None
