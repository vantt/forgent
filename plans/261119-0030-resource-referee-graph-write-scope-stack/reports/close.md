# Phase 7c gate run (worktree rs-p7c, branch rs/p7c at d075046e1, 2026-11-19)

## Gates

1. `CARGO_TARGET_DIR=<wt>/target cargo test --workspace --locked -j4` : exit 0. 387 test binaries/doc suites, 3396 passed, 0 failed, 12 ignored. Log /dev/shm/rs-p7c-cargo.log.
2. `cargo tree -p fgos-write-scope -p fgos-graph -p fgos-resource-referee --locked` (with dev edges): fgos-write-scope no dependencies; fgos-graph serde + serde_json only; fgos-resource-referee serde + serde_json, dev: fgos-graph, fgos-write-scope. PASS.
3. `npm test` : exit 0. tests 8486, pass 8458, fail 0, skipped 28. No ERROR line (only a test title containing "ERROR_CLASSES"); no leak/clone ERROR. one-door and git-mutation-census tests green. Log /dev/shm/rs-p7c-npm.log. Suite line: 614 files, 3635 Rust tests, 634 s.
4. `node plans/261119-0030-.../reports/run-plan-check.mjs --all` : exit 1 (one other plan failing). Plans 128, under contract 15 (failing 1). No error names 261119-0030; no overlap pair printed. Decision 30: PASS. Log /dev/shm/rs-p7c-plancheck.log.
5. `node scripts/git-one-door-scan.mjs --root . | tail -2` : 0 undeclared sites. CENSUS DOES NOT MATCH THE TREE: `git status --short` showed `M packages/git/contracts/mutation-census.v1.json` after the gates. The committed census was last regenerated at 92570dd85 (before phase 5, 0a1234178); it lacks packages/resource-referee/rust/src/{catalog,facts,refusal,ruleset,verdict}.rs and tests/referee.rs and has an old lib.rs digest. The file was rewritten (mtime 08:39:39, during npm test, not by the scan: the scan has no write without --write-census) with payloadDigest 4fe5c49d... -> 0f8a9b6f.... Diff saved at /dev/shm/rs-p7c-census.diff (8 insertions, 2 deletions; only resource-referee entries + payloadDigest). I reverted the file (git checkout) so the tree is clean; nothing committed. Step 4 (regenerate census as last commit) is still needed.
6. `test -d packages/git/write-scope` : fails (directory absent). PASS.

## Other lanes' plan-check errors (not fixed)

- 261118-1117-external-ui-integration-multica: 8 errors: source must be a list of paths or backlog ids; missing sections outcome, acceptance criteria, non-goals, phases, owner questions, risks and rollback; no phase table with a footprint column.

## Census

Phases landed on main one by one through the landing script (main was the integration branch), each
rebased on `origin/main` and gated with the census tests. Phase 7 regenerated the census for its own
door changes (`af285ac57`). The phase 5 crate files reached the census through another lane's
regeneration (`b126050c4`); at `7baa37769` `--write-census` produces no diff, so the census matches the
tree. Entries this plan added or moved: the `packages/write-scope` files (moved from
`packages/git/write-scope`), the `packages/graph/rust` and `packages/resource-referee/rust` sources, and
the addon modules `packages/git/node-addon/src/graph.rs`, `git/write_scope.rs`, `lib.rs`, `marshal.rs`,
plus `src/native/door.mjs`. No entry outside a phase footprint.

## Landings

| Phase | Commit on main |
|---|---|
| 2 scaffold and move | `8978813ee` |
| 1 specs and contracts | `87f802304` |
| 3 write-scope pairs and addon operations | `9e166f430` |
| 4 graph crate | `ffe52891a` |
| 7 addon bindings and ABI | `af285ac57` |
| 5 resource-referee crate | `0a1234178` |

## Acceptance criteria

1. Pass: `packages/git/write-scope` is gone; `packages/write-scope`, `packages/graph/rust`,
   `packages/resource-referee/rust` build and test in the workspace (gate 1).
2. Pass: `test/git/write-scope-parity.test.mjs` runs the golden suite, now with `writeScopesOverlap`,
   through the addon; `colliding_pairs` is proven against a naive pairwise oracle in the crate tests.
3. Pass: `fgos-graph` carries the ported cases of `test/state/graph-metrics.test.mjs` and names the
   intended differences as tests.
4. Pass: one owning test per check; the blocking codes are read from the contract and each has a
   producing case; a truncated fact never yields accept or advice under any policy; unknown claim
   space refused by name; per-item limit breaches are item findings.
5. Pass: an addon lacking or low on `graph` or `writeScope` is refused by name (`config-door.test.mjs`);
   `native-load.test.mjs` pins the new `versions()`; `ports.v1.json` lists `graph.analyze`; each new panic
   id has a guard case.
6. Pass: cargo workspace and `npm test` green one after the other (gates 1 and 3); plan check scoped by
   decision 30 green (gate 4); census matches the tree.

## Decisions taken by the lead during delivery

- Landing per phase on main instead of one integration branch: the landing script rebases, regenerates
  the census on conflict and runs the census tests, so main serves as the integration branch.
- Canonical cycle: the lexicographically smallest of the shortest cycles through the smallest id.
- Collisions cannot be switched off: when any unit declares a layer, a colliding pair with an end that
  declares none is the blocking floor finding `exclusion-layer-undeclared`.
- `fgos-resource-referee` takes graph facts and colliding pairs as data; `fgos-graph` and
  `fgos-write-scope` are dev-dependencies only (its spec row says so).

## Release

Active release before this plan's landings: `sha256:74e822fffc46725a9d341e1e9d525abd8b36ba41d8ff17e13b49eb04694ad143`
(previous `sha256:b50f36be811cd8bb710f98f713cc18b4201cb14083ca76362e386c7eb30da748`). Rollback re-activates
that digest explicitly; `fgctl repair` reaches only the immediately previous activation.

Activation: not activated with this plan's code at the time of writing. The new addon ABI fields mean a
release staged from main after `af285ac57` is needed before any payload uses the packages; nothing calls
them until the door plan. `npm run fgos:dev` builds its own addon and is unaffected.
