# Phase 21: live migration of this repository's config

Date 2026-10-25 (Asia/Saigon). Machine fg-server. Worktree `cfg/slice-c-c`, merged with `origin/main` `f03d9c6c1` (`c0568e903`). Paths and counts only; no value is printed except public model ids and layout names that the owner read before deciding.

## Result

`.fgos/config.json` (1,568 lines) is now the tombstone `moved to .fgos/config.yaml; upgrade fgOS`, and `.fgos/config.yaml` holds 153 lines. `fgos config check` returns `ok: true`. The project-side findings are warnings only, one per kept value; the global side keeps the three known warnings that stage 2 clears. The backup is `.fgos/runtime/config-migrate/06281d9f89a79cf5-config.json` (git-ignored).

| Count | Value | Rehearsal (D, 2026-10-24) |
|---|---|---|
| kept | 27 | 15 |
| droppedRedundant | 249 | 257 |
| droppedRetired | 1 (`lock.predecessorKillWaitMs`) | 1 |
| droppedOutOfScope | 2 (`gateway.port`, `gateway.token`) | 2 |
| docConverted | 1 (`runner.$comment`) | 1 |
| machineOverrides | 22 | 28 |

The counts moved from the rehearsal because main edited the file after it (`301cb430a` Event Store defaults, `aff7f2d54` terminal layout). The migration's own equivalence check passed: it compares effective values against an empty global and then against this machine's global, and refuses on any difference not in the override list.

## The 22 machine overrides and the global file

The 22 paths are project values equal to the standard that this machine's global file set differently. Dropping them would have let the global value win on fg-server: `runner.modelPolicies.claude.flagship` opus to sonnet, `claude.frontier` fable to opus, `openai.nano` gpt-6-luna to gpt-5.5, `terminal.layout.policy` even-split to measured-split, plus 18 capability `description` strings. Checked with `fgos config show --path` from an empty directory (provenance `global:config.json`).

Owner decisions (2026-10-25):

- Accept the overrides in the tracked file, because the file is right for every machine (spec section 13, line 287).
- Clean the stale values from the global file instead.

The door cannot write that file. It refuses a JSON global with `config-format-legacy-json`, refuses to write a value equal to the standard (`redundant-noop`, `write.rs:346`), and no verb converts the global file yet (plan idea I2). So the owner chose a one-time scripted edit:

- Backup: `~/.fgos/private/config.json.bak-261025-drop-stale-catalog` (600, byte-identical copy, `cmp` checked).
- What the script did: removed exactly the 22 keys, plus the 15 parent objects they left empty. It kept key order, two-space indent and mode 600. It wrote through a temporary file and a rename, and asserted that nothing else changed. No value was printed.
- Result through the door: the four non-description paths now resolve to the standard (provenance `standard`). The active release's `fgos doctor` config rows stay green.

So the effective value of this repository on fg-server is the same before and after.

## Step 4 evidence

- **Tests on the migrated file.** The 12 files that held earlier failures were re-run: 319 passed, 20 failed. The six failures caused by reading the unmigrated config are now green: `capability-plan-lint`, `dispatch-i08b-remediation`, `dispatch-operability` (2), `dispatch-governance-operability`, `test-select-mutate`. What remains:
  - 17 `fgctl` cases that are red on main too.
  - The 2 inline-lead cases waiting on SEAT.
  - `node-version-and-git`. From a linked worktree it reads the main checkout's file, which is still unmigrated, so it turns green once this lands and is pulled.
- **Doctor through the dev host** shows the same main-checkout effect: the config, event-store and git rows read `~/projects/forgent/.fgos/config.json`. It is no evidence for the migrated file until after the pull (phase 22).
- **Tombstone against an older reader.** The plan's `tombstone-older-reader.test.mjs` does not exist in the repository. The evidence is preflight line 8 instead: `fgctl status` and `fgctl verify` pass on a workspace holding the tombstone.
- **Independent review** (sonnet, read-only): every non-redundant value is kept, the dropped classes and counts match, the tombstone text is exact, the backup is byte-identical to `HEAD:.fgos/config.json` and git-ignored, and the YAML holds no secret. Each kept value carries a `@fgos:why` line naming the migrating session. That is the migration's reason format, which the spec sets.

## Step 6: final gates

The gates ran sequentially on `cfg/slice-c-c` after the migration commit.

| Gate | Result |
|---|---|
| `cargo test --workspace --no-fail-fast -j 4` | 1615 passed, 0 failed |
| `npm test` | 8491 passed, 20 failed (see below) |
| `cargo test --manifest-path apps/fgos-gateway/Cargo.toml` | 88 passed, 0 failed |
| `cargo test --manifest-path herdr-dashboard/Cargo.toml` | 125 passed, 0 failed |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | exit 0 |
| `cargo fmt --all --check` | red; equally red on a clean `origin/main` (4,180 hunks repo-wide) |
| `cargo deny ... check advisories bans sources` | advisories red on `RUSTSEC-2026-0386` (tokio `AsyncFd`); equally red on a clean `origin/main`; bans and sources pass; the branch adds no external crate |

The first `npm test` after the migration had 42 failures; the 22 extra came from the migration itself and are fixed in `e95f4814b`:

- `test/helpers/committed-config.mjs` parsed `HEAD:.fgos/config.json`, now the tombstone. It now copies `HEAD:.fgos/config.yaml` and reads the effective `runner` section through the facade with no machine global. Nine test files use it.
- `seat-binding-dry-bind` "the committed forgentX config binds every seat" used to pass vacuously: the old file was refused, and the check answers `passed: true` when the config is not loadable. Now the config loads, and the confined invocations bind only where the machine registry names bwrap. The test seeds that registry, like the other confinement tests. On this machine's real global file all 62 seats of 27 units bind.

The 20 that remain are known:

- 17 `fgctl-upgrade` and `fgctl-init-download-sources` cases, red on main too.
- 2 inline-lead cases in `run.test.mjs`, waiting on SEAT.
- `node-version-and-git`, which reads the main checkout's unmigrated file from a linked worktree.

## Still to do

- Budget counts in the phase 23 closeout.
- The landing waits on SEAT's two items.

## Unresolved

- fg-server2 and design-lap: their own global files may hold the same stale catalog. Their checklists must run `migrate --dry-run` against their globals and list the overrides before G-C1.
