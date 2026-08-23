# plan.md — tsk-1u77: install-packaging e2e flakes under ambient concurrent .fgos writes

Mode: small

1 flag (weak proof around the area — the concurrent-write scenario is hard
to reproduce deterministically in a unit test, so this plan relies on unit
tests against the extracted assertion function rather than a real
concurrent-session e2e reproduction). No CONTEXT.md: discovery verdict was
clear. Item premise re-verified against the current repo before starting
(the `[MUST khi bắt đầu]` re-scan instruction on the item): `test/install-
packaging.test.mjs` still uses `snapshotDir`/`diffSnapshots` around
`REPO_ROOT/.fgos`, unchanged since the item was filed — confirmed by
reading the file directly.

## Approach

**Chosen path:** replace the byte-identical before/after snapshot diff
(`diffSnapshots`, deleted) with `assertNoLeakedPaths` — scans every file
under `REPO_ROOT/.fgos` (after the external `fgos init` ran) for the
external test's own tmp paths (`externalCwd`/`installPrefix`/`packDir`)
appearing anywhere in their content. This proves the actual invariant the
test cares about (the external process's artifacts never leaked into the
source repo's store) without requiring the source repo's `.fgos/` to be
quiescent during the test's multi-second npm-subprocess window.

**Why not retry/quiesce (the item's other suggested direction):**
rejected — concurrent writes on this dev machine are durable (another
session's real event lands in `events.jsonl` and stays), not transient,
so waiting and re-snapshotting would never make a legitimate concurrent
diff disappear. Retrying only helps with a read racing a write mid-flush,
which was never the actual failure mode described (mtimes were already
9s old at diagnosis — the write had already landed and settled).

**Why this is still a real, meaningful check, not a weakened no-op:** the
external `fgos init` call's own `cwd` (`externalCwd`) is not even a git
repository in this test — `dataDir()`'s resolution for a plain `init` (no
`--dir`) is purely `path.join(cwd, '.fgos')`, with no main-checkout-walk
logic at all, so there is no code path today by which this specific call
could reach `REPO_ROOT/.fgos`. What COULD go wrong, and what this
assertion still catches, is exactly the failure mode a real regression in
that resolution would produce: the external process's own paths leaking
into the source repo's files.

**Risk map:** Light — a test-only file change; no production code touched.

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session).

## Shape

- `test/install-packaging.test.mjs` — replace `diffSnapshots` with
  `assertNoLeakedPaths`; drop the now-unused `repoFgosBefore` snapshot
  (taken before the npm pack/install/init sequence, no longer needed since
  the new check only inspects the AFTER snapshot's content).
- Two new unit tests directly against `assertNoLeakedPaths`: one proving
  it tolerates unrelated concurrent-session content (the exact
  false-positive shape the old check produced), one proving it still
  catches a real leak.

**Concrete cases to prove against:**
- Existing behavior that must not regress: the real e2e test itself
  (npm pack -> install -> init) still passes.
- The actual bug case: concurrent-session-shaped content differing from
  any "before" snapshot, containing none of the external tmp paths —
  must not fail.
- A real regression: content that DOES contain one of the external tmp
  paths — must still fail, with a clear message.

## Split decision

No split.

## Outstanding questions

None
