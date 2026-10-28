# HARDEN legacy-fence deletes: phase lead report

Worktree branch `harden/h33-legacy-deletes` on origin/main `cdd15126f`. Not pushed, not merged.

## Commits
| sha | subject | net |
|---|---|---|
| 661e2925d | refactor(observe): remove the legacy work.friction import and its fence | +51 / -968 |
| eb7ad4e13 | refactor(event-store): remove the legacy import, the migrate verb and the rollback export | +362 / -2660 |
| 626519470 | chore(architecture): drop the manifest rows of the deleted events migrate and parity verbs (docs/architecture-manifest.json only, allowed by the coordinator) | -2 |
| da33d3bcc | test(event-store): drop the census of readers of the retired event files | +2 / -196 |
| (this report) | docs(report) | + |

Whole range vs cdd15126f: 61 files, +413 / -3824. By kind (rust bucket includes Rust tests): Node src/scripts about +22/-501, tests (Node and Rust test dirs) +46/-973, Rust about +279/-2266, other (contracts, census, CHANGELOG, suite-baseline) +66/-84.

## Scope done
- H33 friction fence: importer, source trait and record, work-state reader, wiring, `friction migrate` (registry, route, host table), doctor row and tests. There was no `run_lazy_migration` left to delete and no code behind the `.fgos/observe/.lock/TOMBSTONE` fence (the Node fence mechanism went in an earlier release; `holder-lock` tombstones now belong to the activation lock and Git, which stay). Only a stale `observe/.lock` removal in the fixture generator went.
- D4 HEAD legacy path, import and migrate in `legacy_import.rs` (917 -> about 200 lines: kept `all_entries`, tree hashing, `verify_legacy_tree`, shrunk `write_readiness` and `legacy_layout`). Read path: no pin means no legacy history.
- D5 rollback export (crate, addon, `export.mjs`, `--format`), D6 `events migrate` (+ `parity.mjs`, `parseEventLines`, `checkStopped`, `workspaceListing`, `SCAN_PROTOCOL` copy), D7 `decodeLegacyFiles` and twins.
- Consequence deletes: error codes `event-store-migration-required` and `event-store-migration-fence-ignored` (result-codes contract); addon write admission now keeps only the admitted answer (no settled refusal left).
- D14 reader census in `door.test.mjs`.
- CHANGELOG: two lines under Unreleased.

## Retired tests and owners
All named in the commit bodies. Highlights: Node migrate, migrate-cutover-grant, rollback-export, export-legacy-parity, legacy-order-parity (owner: crate tests/vectors.rs), event-log (behaviour removed); Rust legacy_import (5 of 7 tests), legacy_reader pre-migration, head_legacy_ignores..., converted_origins...; observe doctor (5), friction migrate (4), work-state legacy_friction reader. Rewritten onto a pinned legacy history instead of dropped: legacy_reader fence-once and one-Git-read, read_memo legacy-held, reader_review_regressions legacy-appears-forces-rebuild, facade repeat-read-not-resent, backward-compat listWork, six doctor vocabulary tests (through `freezeLegacyWorkFixture`). New fixtures: `test/helpers/legacy-fence-fixture.mjs`, `reader_support::fenced_legacy`, tests/legacy_import.rs `publish_legacy`, work-state `import_fixture` (git plumbing).

## D13 decision
Left alone. No committed evidence that the "section 23.2 candidate run" happened: the only runs on record (plans/reports/verification-261022-2203-work-cutover-branch-proofs.md:24, verification-261023-1630-...:161) are the branch-proof runs of `settle-host-proof.mjs --host` itself, and those scripts remain the only owner of the ENOSPC/SIGKILL settle-fault proof.

## Review fixes (second round)
- Wording correction to `eb7ad4e13`: reads do not authenticate the pinned legacy history. Reads check only that the tracked fence and the legacy refs agree. Only the doctor's `legacy_layout` calls `verify_legacy_tree`.
- `1c4c5f0a0` removes the pre-commit event-log shrink guard (its only purpose was protecting what `events migrate` imported) and its five tests, and rewords `forge-probe.sh`.
- `6ee4230b3` builds `legacy_import.rs` on `reader_support::fenced_legacy` (real data-tree id), adds the unfenced-HEAD admission proof, and names the retired facade moved-history assertion (behaviour removed; the new-fence case is owned by `a_legacy_history_that_appears_after_a_read_forces_a_rebuild_even_when_v4_order_is_unchanged`).

## Behaviour change to know
A clone whose HEAD still tracks legacy event files and has no fence is no longer refused for writes; its tracked legacy files are ignored. The change rests on the owner's 2026-10-24 23:3x line in the ES plan ("3 máy sync hết rồi, các project kia xong hết rồi") and the approved package of 2026-10-25 20:57 (decision 43).

## Left out
- `internal quiesce-scan` route and Git `cutoverGrant`: S5 asked the T0/T2 seats to confirm. quiesce-scan still has callers (fgctl, distribution git_gate); cutoverGrant untouched (test/git/cutover-grant.test.mjs).
- `VALID_REASONS` still accepts `migrated`; old Observe fixtures (`test/fixtures/observe-legacy-friction.jsonl`) and the `work.friction` enum in `work-events.read.v1.json` stay as reader data.
- `foldPortingEvents` is still exported though now used only inside porting-store.mjs.
- Machine-owned contract text mentioning cutover callers: packages/holder-lock/contracts/internal-route.quiesce-scan.v1.json, route.rs doc comment.

## Docs/spec lines to change later (not touched, except the manifest rows)
- docs/platform/event-store/spec.md:499 (drop `--format jsonl|legacy-layout`), 564-574, 607-609 (import_legacy, cutover section), 638, 730 (rollback proof), 934, 978-980, 1000, 1032, 1052 (migration-required and fence-ignored codes, readLegacyFromHead, importLegacy), 1216. Suggested: mark the cutover/rollback/migrate sections historical, remove the two codes and the legacy-layout doctor warning.
- docs/specs/observe.md:15,17,72,81 (friction migrate, LegacyFrictionSource, observe-friction-migrated).
- docs/how-to/install-fgos-in-a-project-and-use-doctor.md:323,331 (event-store-legacy-layout wording, remove observe-friction-migrated row).
- docs/specs/work-state.md:1190,1195,1228 (fence installed by `fgos events migrate`; unmigrated repos read legacy history).
- docs/platform/holder-lock/spec.md:208,259; docs/platform/component-boundary.md:87; docs/specs/distribution.md:77; docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133 (check list, quiesce scan caller named as events migrate).
- docs/backlog.md:9 (p-aot44rcjaf mentions migrate --check; now moot).
- docs/specs/reading-map.md:60,70; docs/specs/distillery.md:136; docs/knowledge/fgos-participant-contract...:7 and the reconstruct-tracking-state how-to: mentions of migrate or legacy files.

## Tests run (target /home/vantt/projects/forgent-worktrees/harden-h33-target)
- cargo test: fgos-observe, fgos-work-state, fgos-event-store, fgos-node-addon, fgos (app), all green. cargo clippy -D warnings on those crates clean. cargo check --workspace (all targets) clean. Release workspace build ok.
- Node via runChosenTests: 159 files that mention events.jsonl, legacy or events migrate (3698 tests, 0 fail after the manifest commit; 2 architecture failures before it), plus test/architecture.test.mjs 36/0 after the manifest commit, test/event-store/door + git/one-door 10/0. No run-tests ERROR lines.
- Census: `git-one-door-scan --write-census` 0 undeclared, staged in each commit.
- Not run: npm test, cargo test --workspace (by instruction), msvc/darwin checks.
