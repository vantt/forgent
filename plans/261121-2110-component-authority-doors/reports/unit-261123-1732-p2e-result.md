# Phase 2e result: retire the Node agy sub-home finder

## Done
- Replayed both `findAgySubHomes` cases on the survivor, as `checks.rs` tests (no existing test there owned them):
  `sub_homes_include_the_agy_stores_of_the_gemini_pool_and_no_other_store_or_pool` and
  `sub_homes_cover_single_and_multi_executor_configs_expand_home_and_skip_duplicates`. A `SubHomes` impl for the test `World` supports them.
- Deleted `src/setup/agy-permissions.mjs`. No product code imported it (grep of the tree: only the test, the guard test, census, the door row, docs/history).
- Removed the two `findAgySubHomes` cases and the import from `test/setup/agy-permissions.test.mjs`; the file stays because its doctor-wiring case (one wiring proof of the `agy-permissions-configured` and `agy-sub-homes-configured` rows) is not retired.
- Guard test in `test/architecture.test.mjs` (the synthetic case was at line 2116, not 2149): the old-path assertion now expects the retired path `src/setup/agy-permissions.mjs` to still hit the row, plus `no debt` on the row.
- Door row: `debt` and `retiredBy` removed. Census: entry for the deleted file removed by hand.

## Owning test of each retired behaviour
- Sub-HOME discovery (executor config, `runner.executors`, gemini pool of `runner.llmAccounts`, `${HOME}`/`~` expansion, de-duplication): the two `checks.rs` tests above.
- Retired-path governance: the door-guard test in `test/architecture.test.mjs`.

## Deleted path and last SHA
- `src/setup/agy-permissions.mjs`: last changed in 6b37add132355435506c252cd338118785cc4231; still present at HEAD 57087d7bd (parent of this commit).

## Not run (refused cargo and node)
- `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos-execution`
- The census was edited by hand (one line removed), not regenerated; the lead should regenerate/check it. `test/suite-baseline.json` is unchanged: `test/setup/agy-permissions.test.mjs` still exists with one case, so its timing entry stays (the lead may refresh the 7.9s figure).

## Spec decision-history line for phase 11
"Phase 2e: the Node `findAgySubHomes` (src/setup/agy-permissions.mjs, last SHA 6b37add13) is deleted; `find_sub_homes` in packages/execution/rust/src/checks.rs is the only sub-HOME finder, its two cases replayed there. The door row `execution-doctor-judgments` holds no debt."

## Docs touching the deleted file (outside scope, for phase 11)
`docs/explanation/agy-permission-denylist-not-allowlist.md:61` and `docs/platform/secrets/spec.md:68` still name the file.

Status: DONE_WITH_CONCERNS
Summary: Node agy sub-home finder deleted, cases replayed in checks.rs, row debt removed; verify commands not run.
Concerns: cargo/node refused so nothing was executed; census edited by hand; two docs outside scope still cite the deleted path.
