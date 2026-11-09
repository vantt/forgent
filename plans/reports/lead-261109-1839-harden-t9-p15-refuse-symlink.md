# T9 P15 symlink-refusal leaf

Landed on main `184d50017` (range 09fb3d040..184d50017). Gate: focused 216 pass; full `npm test` 8609 pass, 1 fail (known V7n addendum); census regenerated, no undeclared sites.

## What changed
- New `src/util/refuse-symlink.mjs`: `refuseSymlink(path, context, { optional })`. lstat, refuse a link with `Symlink refused in <context>: <path>`; missing path throws the lstat error, or returns null with `optional`.
- Reused: the `lstatPlain` rule of `skill-wrappers.mjs` (deleted, 8 call sites now call the leaf).
- Moved onto it: `build-rust-distribution.mjs` (4 sites), `run-rust-dev-host.mjs` `assertLocalPath`, `registrations.mjs` `doctorDriftPath` (extra copies found by rg).
- Not moved (different decision, not a plain refusal): `native/door.mjs` (throws `unavailable`), walkers/predicates in `assignment-layout`, `worktree`, `case-close`, `propose-validate`, `event-store-*`, `instruction-projections` (own error class), `session.mjs`.
- Manifest row (kernel), census regenerated, CHANGELOG line.

## Tests
- `test/util/refuse-symlink.test.mjs` (+4) is the sole owner of the rule.
- Retired: none. Message-text assertions updated: `skill-wrappers.test.mjs` (4 regexes) and `dev-host.test.mjs` (1) now match the leaf's text; `fgctl-stage.test.mjs` regex already matched. Each still proves its caller reaches the leaf.
- Size: Node -33 lines in callers + 20 leaf; tests +52 lines.

## Authority
Symlink-refusal wording and lstat rule: one owner now, `src/util/refuse-symlink.mjs`. `instruction-projections.mjs` keeps its own error class and `native/door.mjs` its own `unavailable`; left on purpose.

## Lessons
- fgctl-stage and drift tests need a full `cargo build --locked --release --workspace` in `CARGO_TARGET_DIR`; first focused run fails with a missing binary, not a code error.
- Rebase conflicts on CHANGELOG and the census recur; regenerate the census, never merge it.
