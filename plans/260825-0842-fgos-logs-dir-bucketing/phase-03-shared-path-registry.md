# Phase 3 — shared `.fgos/` file-path registry, retry `state.json` move

## Why

User caught it, not planning: after phase-02 reverted the `state.json`
move (51 test failures, 21 files each hardcoding `.fgos/state.json`
independently), the user asked why no shared helper existed. Answer: none
did — even production code had 4 independent copies of the path
(`store.mjs`, `porting-store.mjs`, `replay.mjs` x2), none exported.

## What shipped

- `src/state/fgos-file-registry.mjs` (**kernel** layer, pure — `node:path`
  only): `FGOS_FILE` enum + `resolveFgosFile(fgosDir, kind)`, one
  lookup-table function instead of one function per file. `normalizeFgosDir`
  also lives here (pure basename check).
- First attempt put this table in `src/runner/paths.mjs` (**infra** —
  shells out to git for `resolveMainCheckoutRoot` etc). That broke
  `test/architecture.test.mjs`'s one-directional-layer check: 4 files at
  **domain**/**kernel** layer (`replay.mjs`, `tool-registry.mjs`,
  `events-jsonl-truncation-guard.mjs`, `main-checkout-guard-warnings.mjs`)
  importing from infra is an upward import, forbidden. Moved the pure
  table to its own kernel-layer file instead — added a manifest row
  (`docs/architecture-manifest.json`, preserving existing key order rather
  than resorting the whole file).
- `state.json` → `.fgos/cache/` (already gitignored, zero dirty-tree
  change) retried on top of the shared resolver: ~13 production files and
  ~30 test files now import `resolveFgosFile`/`FGOS_FILE` instead of
  hardcoding the path.
- `main-checkout-guard-warnings.mjs`'s own inline `.fgos`-or-parent
  ternary consolidated into `normalizeFgosDir` (same registry file).
  `invocation-fault-log.mjs`'s duplicate git-shellout resolver
  (`mainCheckoutFgosDir`) replaced with `resolveMainCheckoutRoot`/
  `fgosDirFromRoot` (already existed in `paths.mjs`, just wasn't used).

## Bugs hit and fixed during this pass

- `store.mjs`'s `paths(dir)` briefly called `resolveFgosFile(dir,
  FGOS_FILE.EVENTS)` — `EVENTS` was deliberately left out of the registry
  (events.jsonl is D1-protected, root-level, not a bucketed leaf file),
  so this resolved to `undefined` and threw on every write. Caused 1298
  test failures in one intermediate run. Reverted to a plain
  `path.join(dir, 'events.jsonl')`.
- ~20 test files needed the shared import added plus their own hardcoded
  `.fgos/state.json` (or fixture `.gitignore` content, or `git add`
  paths, or an evidence-citation string in an acceptance-clause test)
  updated to the new location.

## Outcome

`npm test`: 4023/4023 pass. `git status`: only the session's own live
event shard dirty (expected, D1-protected, unrelated to this change).
