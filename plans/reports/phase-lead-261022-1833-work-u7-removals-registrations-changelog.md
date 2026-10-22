---
title: "WORK lane U7 lead report: removals, registrations, CHANGELOG"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (from 9a8f163a8; code 53523a917, fixtures 34c4ad20e, docs, census and baseline after)
status: DONE_WITH_CONCERNS
---

# U7: removals, registrations, CHANGELOG

## Commits (new on top of 9a8f163a8; `790616298` untouched)

| Commit | Content |
|---|---|
| `53523a917` | `events sync|status|export|migrate` and `rebuild` registered and wired; one `eventStore` default; ten doctor rows through one `eventStoreDoctor` per run, three fixes; mutating predicates; lifecycle verbs; `fgos init` prepares machine id and locks dir; removals; their tests |
| `34c4ad20e` | Runner, rust-host and e2e fixtures moved onto the prepared Work repository (the fixtures were red since the gate cutover; none of U1-U6 ran those directories) |
| docs commit | CHANGELOG, Event Store spec clarification, doctor how-to rows, distribution spec list |
| census commit | `mutation-census.v1.json` through `--write-census`; `test/suite-baseline.json` through `test-proof-inventory --write-baseline` |

## Removals (spec §19)

- `resolveWriterLogPath`, `appendEventCore`, `appendEvent`: already gone from `src` after U1-U6 (only test comments named them; fixed).
- `src/state/events.mjs` deleted. `lockOfLog`, `repairTruncatedLastLine` went with it; `EventLogError` imports now come from `event-log.mjs` (bin, `approve.mjs`, `store.mjs`).
- `event-log.mjs` keeps `EventLogError` and `parseEventLines` (export and migrate use them). `readEvents`, `readLastLineBefore`, `readEventsFromByte`, `parsesAsJson` had no product caller left and are deleted.
- `replay.mjs`: `tryIncrementalRebuild`, `rebuildView` and the fs imports deleted. `foldEvents`/`applyEvent` stay. Discovery and T4 code were already gone.
- `fgos repair`: registry entry, route in `command-routes.json` (regenerated through `scripts/export-command-selectors.mjs`), envelope vector `version.json` (regenerated through `test/rust-host/generate-vectors.mjs`), the `case`, `MUTATING_ONLY_VERBS`.
- Orphans from U6: `recordMainCheckoutGuardWarning` (module deleted), `MAIN_CHECKOUT_GUARD_WARNINGS` file kind and `normalizeFgosDir` (its only caller), doctor row `main-checkout-guard-warnings`, the noise-regex alternative for it, the architecture-manifest rows. Doctor row lists in the setup-doctor-registry contract, `distribution.md` and the how-to updated (a contract test enforces the contract list).
- **Decision to confirm (outside the brief's list):** the three one-shot scripts `migrate-actor-to-role`, `migrate-status-proposed-to-awaiting-approval`, `backfill-status-category` and their two tests are deleted. They were the only remaining `lockOfLog` callers, they rewrite tracked event files in place, and `fgos events migrate` imports those files as they are. Reverse by restoring them with an inline lock if the owner wants them.
- Reader census in `door.test.mjs` is `{}`. `rg "\.fgos/events" src bin scripts packages apps -g '!test/**'` leaves only the migrate inventory and files this unit may not edit: `src/verbs/events/migrate.mjs`; `packages/event-store` (`legacy_import.rs`, `fence.rs`, legacy reader fixtures); `packages/git` (the fence refusal in `scoped_commit.rs` and its tests; Git's, not editable); `packages/holder-lock/contracts/lock-registry.v1.json` (v1 lock tombstone inventory, HARDEN's); `packages/work-state/rust/src/event_reader.rs` (five hits, all in its `#[cfg(test)]` fixture that builds a legacy history to import).

## Registrations

- Registry: `events` built with `withSubcommands` (sync, status, export, migrate, each with flags and examples). `rebuild` description now says what it prints. Verb-wide flags follow the registry header convention (most privileged effect): `touchesState: true`, `externalEffect: true` for `events`. The read-only precision L7 asks for lives where the guard decides: `MUTATING_SUBCOMMAND_PREDICATES` has `events` (sync, migrate) and `rebuild`; `events status|export` are not mutating invocations. The group-4 comment (rebuild "deliberately not guarded") is corrected.
- `EVENT_STORE_LIFECYCLE_VERBS` has `events`; `opensEventStore(entry, verb, positional)` excludes `events migrate`. Proof: `triggers.test.mjs` CLI test (`events status` makes 2 `maintenance` calls, `events migrate --check` makes 0).
- `eventStore` default: the existing Git registration (`{ remote }`) now carries `EVENT_STORE_DEFAULTS` (seal 300, sync 300, rebuild 5, remote origin); still one registration (`registrations.test.mjs`).
- Doctor: ten `event-store-*` rows each ask `run.once('event-store-doctor:<cwd>')`, so a run builds one `eventStoreDoctor` (proof in `event-store-checks.test.mjs`: one key per run). Three fixes registered with explicit `registerFix` calls (a loop over an array made the one-door scan report four undeclared binary sites).
- `fgos rebuild` prints `{rebuilt:[{consumer, counts, revision, cover}]}`; `counts` is the size of each collection, `revision` the view hash, `cover` read from the consumer's installed cache cursor (`streams`, `covered`, `deferred`), `null` when the cache has no cursor. Owning proof `verbs.test.mjs`; one CLI wiring proof in `fgos-setup.test.mjs`.
- Comments (review B L2): `bin` noise-regex block and the `appendEventCore` sentence rewritten, the truncated `VIEW_SCHEMA_VERSION` comment in `replay.mjs` repaired, `merge.mjs` import above the header moved, stale `events.mjs`/`readEvents` mentions fixed in `work.mjs`, `store.mjs`, `approve.mjs`, the two Event Store setup headers, `forge-probe.sh`, test comments. The other L2 headers (`claim-port`, the three scripts, loop/session/gateway-control) were already right.
- `take`/`pick --wait`/`--no-wait` untouched.

## Finding: `fgctl init` on a machine that never ran setup failed

`fgctl`'s runtime tail runs `fgos init`, `doctor --fix`, `doctor` (`packages/distribution/rust/src/init.rs:561`). `fgos init` opens the store, which needs the machine id and `.git/fgos/events/locks`; only the setup fixes make them, and `doctor --fix` comes after. About 35 `test/rust-host` tests failed on this; origin/es/p09-cutover has the same `init`, so nothing had run it. Options weighed with `kongming`: A) `init` runs the same fixes, B) reorder the tail (Rust, outside this unit, and `init` must work without fgctl), C) skip the store in `init` (the first `add` then fails), D) seed fixtures (hides it). Chose A in `bin` (the CLI door; `initStore` is in a lower layer and may not import setup): `fixEventStoreMachineId` and `fixEventStoreLockDirs`, both idempotent; a clone's own `fgos.machineId` still wins. The refspec fix stays with setup. Recorded in the spec's cutover clarifications and CHANGELOG. **Owner to confirm** (it changes what `fgos init` does).

## CHANGELOG `[Unreleased]`

Ten lines, none duplicating U6's two: Work history moved to the Event Store with `events migrate`; the four verbs and their flags; refspecs and the ten rows and three fixes; the `eventStore` keys with trigger behaviour, `event-seal-failed` and `promotion` (U5's handoff lines); removed `fgos repair`, the guard-warnings row and the three scripts; the retired `checkpoint` section; `seq` meaning; `rebuild` output; `init` preparing the store; Windows refusal; npm channel needs an fgctl release.

## Test retirements (reason on each)

All are "behaviour removed (D-ADR0055)" unless a successor is named.
- `test/state/replay.test.mjs` 90 -> 78. Retired: the uninitialized-log read, every `rebuildView` snapshot, zero-read, incremental, shrink, repair-safe, resort, reorder, no-snapshot, malformed-snapshot and round-trip test (13 were red; replay discovery, T4 and snapshots are gone). Converted to the pure fold with the same assertion: determinism, historical `ts`, `serializeView`, the three `viewRevision` tests, the `human-advisor` normalization. Added `foldEvents onto a seed view` (successor of the seed-immutability part of the retired fast-path tests). Cache and cursor authentication is owned by `test/event-store/work-gate.test.mjs`.
- `test/state/events.test.mjs` -> `event-log.test.mjs`: the two `readEvents` assertions dropped with the reader; `parseEventLines` keeps its proof.
- `test/cli/fgos-setup.test.mjs`: the two `repair` CLI tests (verb removed; a damaged open log is the store's recovery rule, owned by `store-hardening.test.mjs`, with the CLI corruption proofs in `fgos-read-2`).
- `test/setup/registrations.test.mjs`: the guard-warnings doctor test; the `checks.test.mjs` id list lost the row and gained the ten.
- `test/scripts/{migrate-actor-to-role,backfill-status-category}.test.mjs`: scripts removed.
- Review B H2 (`claim-port`, `fgos-return`, `land-vs-manual-commit`): U6 already retired or rewrote them; no title matches the old mechanisms and the files are green here. The `fgos-return` log-exemption test now uses `invocation-faults.jsonl`, a log that is still written.
- Fixture changes with the behaviour kept: rust-host `fgctl-init` step 9 asserts the addon-less npm channel refuses a Work read by name (previously it compared that read byte for byte with the shim); harness read cases run in a scratch Work repository.
- test() calls 8131 -> 8102. `test/suite-baseline.json` written by the tool: 601 files, 8102 calls, 56 known clones (clone hashes moved with the two `eventStore` default edits in the checks files; no new clone).

## Counts (focused runs, nothing concurrent, final tree)

| Set | Tests | Fail |
|---|---|---|
| `test/state test/event-store test/cli test/intake test/config` | 2666 (2600 pass, 1 skipped, 65 todo) | **0** |
| `test/setup test/scripts` | 1509 (1508 pass, 1 skipped) | **0** (exit 1 only from the harness line `product code started git ... (272x)`: fixture `git init` frames, same line as U1-U6) |
| `test/runner` whole directory, `FGOS_TEST_FILE_TIMEOUT_MS=900000` | 3029 (3027 pass, 2 skipped) | **0** |
| `test/git test/architecture.test.mjs` | 196 (195 pass, 1 skipped) | **0** |
| `test/rust-host` + `test/e2e/rebuild-determinism.test.mjs` | 151 (150 pass, 1 skipped) | **0** |
| Extra, outside the brief: `test/e2e test/holder-lock test/direct test/verbs test/workflow` | 628, 4 failed | 4 -> fixed (e2e `pr-gate` d/e/f and `fixture-marketing-domain` read tracked event files and expected state in git commits); the two files rerun 12/12 |

Before this unit: `replay.test.mjs` 13 red; the runner directory had 92 red and `test/rust-host` 51 red (stale fixtures that opened the store in a non-repository or without a machine id, a stale release host without the `events` route, and the `init` gap above); none of those directories were in earlier unit lists.
`cargo test --locked -p fgos -p fgos-distribution` green (no Rust source touched; the host embeds `command-routes.json` and the distribution crate reads the census). The staged release host in `work-es-target/release` was from 10:46 and lacked the `events` route: `cargo build --release -p fgos -p fgctl -p fgos-node-addon` (`cb.sh`) before rust-host runs, whoever changes a route.
Census: `--write-census`, `--check` shows only main's five `unresolved-binary` sites (`bin/fgos.mjs:3488,3632`, `merge.mjs:1215,1245`, `worktree.mjs:146`); none added.

## Impact analysis

`fgos tool query --capability impact-analysis --status present`: 0 providers, inactive; blast radius not confirmed by a tool. By `rg`: `events.mjs` importers were `bin`, `approve.mjs`, `store.mjs` and tests (all moved); `rebuildView` and `readEvents` had no product caller; `rebuild` (bin) had one; `lockOfLog` three scripts (deleted); `recordMainCheckoutGuardWarning`/`readMainCheckoutGuardWarnings` the registration and tests (deleted); `fixEventStore*` fixes now also called from `case 'init'`.

## Delta lines

Against this unit's start (`9a8f163a8`), 69 files: src/bin/scripts +162 -1090; test +357 -1093 (plus vectors +12 -33); census json +41 -128; docs +18 -5.

Whole branch against its merge base with origin/main (`b6a399731`, report excluded):

| | + | - |
|---|---|---|
| src, bin, scripts | 1328 | 3414 |
| test (js, mjs) | 2194 | 4290 |
| test vectors json | 12 | 45 |
| rust (packages, apps) | 446 | 428 |
| census and contract json | 387 | 300 |
| docs, plans, changelog | 620 | 103 |

## Concerns and follow-ups for the owner

1. **`fgos init` now prepares the store** (above); confirm, or choose B (fgctl tail order) and drop it from `init`.
2. The three deleted rewrite scripts (above).
3. `.gitattributes` `merge=union` for events and this repository's own tracked `.fgos/events*` files remain; they leave with this repo's migration (U9/U10), not with code removal.
4. `docs/specs/work-state.md` still describes `fgos repair`, `events.mjs` and the removed scripts (lines 26 and 1345); U9 owns that file. `docs/specs/distribution.md` row 7 and 7b enumerations I only edited for the removed and added ids.
5. `generateCoverageFloorCases` now creates one scratch repository per call (the read cases need a prepared repository); temp roots are per process.
6. A clone with no remote still attempts a failing sync at each owner command end (U5 concern 1) and `take --wait` stays an accepted no-op (controller decision); nothing changed there.

Status: DONE_WITH_CONCERNS
