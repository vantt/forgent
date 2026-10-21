# TEST lane: run-supervisor retirements, four unguarded behaviours, the claude guard, help-routes, the suite-change line

Date: 2026-10-21 (Asia/Saigon). Owner of the lane: session `forgent-f8`, from 15:40 ([handoff](handoff-261021-1519-test-lane-governance.md)). Plan rows: [plan](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) § "Received items and owner decisions".

## 1. Outcome

| Row | What changed | Where |
|---|---|---|
| RS5 | Five Node run-supervisor tests retired, each naming its owner | main `4bb8058dc` |
| D1 | Owning proofs for `sync --no-push`, the root `porting/` log, and a live unit controller; the duplicate JS rank check deleted | branch `chore/test-governance-d1` |
| H4 | No test process reaches the real `claude` CLI: `buildTestEnv` names a missing binary unless the caller names one | same branch |
| H5 | `help-routes` runs its cases through one staged release; one case keeps the dev door | same branch |
| H1 | `suite:` line for what a change does to the suite; admission warning for an unexplained new CLI spawn; `--cli-cost`; the review checklist asks for them | same branch |
| H2 | Parked: owner chose (c) at 17:3x | plan row H2 |
| H3 | Trigger moved to HARDEN ledger H13 (T9/Packaging) | plan row H3 |

## 2. Gates

RS5 (base `f132c8c7e`):
- `npm test` 8774 tests, 0 fail, 32 skipped; `suite: 581 files, 8087 test() calls, 456 s wall`.
- `cargo test --workspace` 1219 passed, 0 failed.
- Coverage map before and after: 331 sources both times, **0 sources lost their last covering test**. 74 sources lost one covering file, all `contracts-unit-state.test.mjs`, which loaded them only through the deleted `gate-kill-grace.mjs` import. The "before" map ran in a fresh worktree without release artifacts, so its `fgctl-*` rows failed fast; the comparison only checks for loss, so this cannot hide one caused by these retirements.

Batch 2 (base `4bb8058dc`):
- `npm test` 8777 tests, 0 fail, 32 skipped; `suite: 581 files, 8090 test() calls, 361 s wall`; `suite: this change against 4bb8058dc: +5 -2 test() calls, 0 new CLI/host spawn site(s), 0 without a reason`.
- `cargo test --workspace` 1221 passed, 0 failed.
- A logging `claude` placed first on PATH (passing through to the real one) saw **0 calls** in the full run; before the `buildTestEnv` change it saw 11.
- Coverage map: see section 6.

## 3. D1: the six unguarded behaviours of the phase 2 report

| id | Decision | Proof |
|---|---|---|
| ES-R4 `sync --no-push` pushes | owning proof added | `offline_sync.rs: no_push_sync_leaves_the_remote_alone_and_records_the_tail_as_unpublished`; forcing the push fails it |
| ES-R5 legacy import ignores the root `porting/` | owning proof added | `legacy_import.rs: a_root_porting_log_alone_still_needs_migration_before_a_write`; dropping the `porting/` root fails it |
| RS-N6 held controller keeps the unit `running` | existing owner extended | inspect-recover-adopt "… awaits resume and names the command; a live controller keeps it running"; dropping the check fails it |
| ES-N1 JS rank `>= 58` check | code deleted | the native layer refuses the same ranks with the same code before any lock or Git work; `facade.test.mjs` still sees `lock-order-violation` for 58, 70, 80 |
| RS-N4 refusal code `attempt-still-running` | no test | nothing reads the code: the CLI prints only the message, which `resume-adopts` test 2 owns |
| ES-N5 retained native view | kept | a folded read of 5000 events takes 137 ms with the view and 274 ms without (500 events: 37 ms and 58 ms) |

## 4. H4: the suite reached the real claude CLI

Doctor and setup inside fixtures ran the real `claude` (`--version`, `plugin marketplace list/add vantt/forgent`, `plugin list`, `plugin install fgOS@fgos-plugins`), in `fgctl-*`, `release-tree`, `fgos-cli-harness`, `domain-registry-compiled` and `yaml-parse-failures`, several with the real `HOME`. The real `~/.claude/plugins` shows `fgos-plugins` already registered and `installed_plugins.json` unchanged since 10-16, so the effect looks idempotent, but the suite was writing the real user's plugin configuration and reaching the network.

The August fix guarded test files one by one through a string lint over four listed files, which the files split out on 10-14 never joined. The guard now sits in `buildTestEnv`, which builds the env of every process the suite, canary, coverage map and selection runs start. The lint test "setup/doctor CLI e2e tests fail closed against real Claude provider execution" is retired; its owner is run-tests "buildTestEnv points the claude CLI at a missing binary unless the caller names one".

## 5. H5 and H1

- `help-routes`: alone on this host 95 s before, 14 s after, same five tests and assertions. The installed `fgos` the file is about is a staged release, so one is staged per file; the dev door keeps the top-level `--help --json` byte-identity case.
- H1 mechanism: the `suite:` line now reads, against the merge base, `+A -R test() calls, N new CLI/host spawn site(s), M without a reason`; a new CLI, host or fgctl spawn in a test without `// boundary:` on its line or the one above is an admission warning; `node scripts/test-proof-inventory.mjs --cli-cost` prints the median of `fgos --help` and `fgos list` (here: 104 ms and 407 ms at load 2.8).
- H1 rule (owner 18:13 "em làm đi"): the review checklist in `core/skills/fgos-run/SKILL.md` §4, which every lead report already passes, now asks for both `suite:` lines, a `// boundary:` reason on every new CLI/host/fgctl spawn in a test, and `--cli-cost` on base and branch when a change adds such spawns or changes what every CLI call loads. Extended in place; no new rule file.

## 6. Coverage map for batch 2

Against the map of main after RS5: 331 sources both times, **0 sources lost their last covering test, 0 sources lost any covering file** (same six run-supervisor/runner files time out in both). The first attempt died when `/tmp` filled (HARDEN's cargo targets, since moved off `/tmp`). The killed run also left 1.1 GB in `/tmp/fgos-coverage-*`: the coverage script does not clean its directory when it dies. Fixed in the same branch (owner 18:13): the removal now sits in a `finally`.

## 7. Unresolved questions

None.
