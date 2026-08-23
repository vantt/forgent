# CONTEXT: architecture-manifest.json missing a row for enduser-index-generate.mjs

Item: `tsk-1kh`. Discovered mid-session while returning `tsk-104` (a
completely unrelated item): `npm test` on `main` was found red on
`test/architecture.test.mjs`, both its "đủ sổ" (file↔manifest 1:1) and
"import một chiều xuống" (one-way-down import direction) checks, over the
same missing row. Filed and worked as its own item with the user's direct
authorization, since it blocks `fgos return` for every open item (the
shared `npm test` verify).

## Locked decisions

- **D0.** Root cause: `src/report/enduser-index-generate.mjs` (added by
  `70a88ff`, `feat(tsk-1m0): add enduser-docs-index-stale doctor check +
  fix`, already committed and an ancestor of every other in-flight
  branch) has no row in `docs/architecture-manifest.json`'s `files` map.
  `tsk-1m0`'s own commit added the file without registering it.
- **D1.** Layer chosen: `infra`. Read the file's own imports
  (`src/report/enduser-index-generate.mjs:13-16`): `./enduser-index.mjs`
  (manifest: `domain`) and `../state/store.mjs` (manifest: `infra`). Its
  own header comment (`:1-11`) names its two real callers:
  `bin/fgos.mjs` (manifest: `entry`) and `src/setup/registrations.mjs`
  (manifest: `use-case`). Layer order (`docs/architecture-manifest.json`
  `layers`): `entry`(0) < `use-case`(1) < `infra`(2) < `domain`(3) <
  `kernel`(4). The one-way-down rule (`test/architecture.test.mjs:53-54`)
  flags a violation when `rank(source) > rank(target)` — imports must go
  to an equal-or-deeper layer, never shallower. Four constraints:
  - importing `store.mjs` (infra=2) requires own rank <= 2
  - importing `enduser-index.mjs` (domain=3) requires own rank <= 3
    (always true given the first constraint)
  - being imported by `bin/fgos.mjs` (entry=0) requires own rank >= 0
    (always true)
  - being imported by `registrations.mjs` (use-case=1) requires own
    rank >= 1
  Combined: rank must be in `[1, 2]` — `use-case` or `infra`. `infra` is
  the correct choice: this module does real I/O (`fs`/`listWork`) and
  sits alongside its own sibling infra-adjacent modules, not orchestration
  logic itself (which is what `use-case` is for elsewhere in this
  manifest, e.g. `registrations.mjs` itself).
- **D2.** Verified directly: `node --test test/architecture.test.mjs` —
  all 3 tests pass after adding the row; full `npm test` also green
  (2743/2738/0 fail/5 skipped).

## Outstanding questions

None
