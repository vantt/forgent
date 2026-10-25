# Config cutover preflight: fg-server

Date 2026-10-25 02:00 (Asia/Saigon). Machine fg-server. Branch `cfg/slice-c-c` at `c0568e903` (merged with `origin/main` `f03d9c6c1`). The checklist is [phase 20](../261023-1649-yaml-config-slice-c-node-door-cutover/phase-20-cutover-preflight.md). Every line lists the command and its result. It records ids, paths and modes only, never a value.

## Result

All eleven lines are green or expected. The three expected lines (2, 5, 9) are each closed by a later step of the plan, not by anything this gate has to wait for. Line 9 also waits on SEAT for two tests.

| # | Check | Evidence | Result |
|---|---|---|---|
| 1 | D is active | `fgos config --help` lists `show explain standard check set unset patch migrate refresh-docs`; active release `sha256:4ea7812b…` | green |
| 2 | Every activated project passes | `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'` finds one project, `~/projects/forgent` (worktrees excluded). `fgos config check` there: project file `gateway.port` fail, `gateway.token` warn | expected: the fail is this repository's own file, which phase 21 migrates (the dry run drops both gateway keys) |
| 3 | Global file clean | same `check`: global file has warnings only (`gateway.token`, `runner.llmAccounts`, file-level), no refusal; no `runner.rigorToTier`, no extended tier cell | green |
| 4 | Machine files | `~/.fgos/private` 700; `accounts.yaml` and `gateway-token` 600; the two `config.json.bak-*` backups moved under `private/` (600) through the door's `move-under-private` repair | green |
| 5 | No older release reads the old keys | one activation on the machine (this repository). D stage 2 not run: it needs G-D3 and, by phase 22, follows this machine's activation | expected (G-C1 option A) |
| 6 | Parity report | [parity sweep](research-261024-1452-cfg-slice-c-parity-sweep.md): `changed` 0, `dropped-by-rule` 0; the only `refused` is `gateway.port` (line 2). Owner items O1 to O3 are asked with this gate | green once O1 to O3 are answered |
| 7 | Windows | landing C builds no Windows asset; gate G4 stays open | green |
| 8 | `fgctl` independent of Node config | scratch workspace activated from the active release, project file migrated by `fgos config migrate` (tombstone plus `config.yaml`): `fgctl status` exit 0, `fgctl verify` exit 0 | green |
| 9 | Branch green | sequential: `cargo test --workspace --no-fail-fast -j 4` 1617 passed, 0 failed; `npm test` 8485 passed, 26 failed; gateway `cargo test` exit 0; dashboard `vitest` 51 passed, 1 failed | see below |
| 10 | Other worktrees | `git worktree list` plus `git status -- .fgos/config.json` per worktree: no edit | green |
| 11 | Rollback ready | `activation.json`: active `sha256:4ea7812b710baccab83bd4a1720ca519a193f5a4c8e1e746550d3254776bcd1a`, previous `sha256:b9c2465e01e5…`; release store `~/.local/state/fgos/releases/`; this repository's migrate backup goes to `.fgos/runtime/config-migrate/` | green |

## Line 9 in detail

The 26 `npm test` failures were compared, file by file, with the same files run on the merged main commit `bbae8b0b6`.

- **17 are red on main too.** They are the `fgctl-upgrade` and `fgctl-init-download-sources` cases and the `events-legacy-absence` and `event-store/migrate` cases. This is under the plan's limit of 18 known cases. They also fail on a clean main on this machine, and TEST did not see them on fg-server2. They are recorded on the board for WORK and TEST.
- **7 read this repository's unmigrated `.fgos/config.json`** and are refused with `config-key-out-of-scope gateway.port`. Affected: `dispatch-operability` (2), `dispatch-governance-operability`, `dispatch-i08b-remediation`, `capability-plan-lint`, `test-select-mutate`, and `checks-doctor-config` `node-version-and-git`. Phase 21's migration turns them green. The same refusal hits `fgos dispatch decide` in this repository today, so the migration is needed beyond the tests.
- **2 test the inline lead** in `run.test.mjs`. SEAT decides keep or retire (board, 2026-10-24).
- The dashboard failure (`TaskDetail` D17, the `tier` field) is red on a clean `origin/main`. The branch does not touch `apps/fgos-gateway/web`.

Fixed while running this gate: the isolated test home now carries the real git identity as a file (`c3122f1af`), because the git driver drops `GIT_CONFIG_GLOBAL`. The standard's `eventStore.seal.coalesceSec` is now named in the registry comparison (`2ea2ef277`).

## Unresolved

- SEAT's two items: land `seat/standard-single-vendor-coverage` `4890009b5`, and keep or retire the inline lead.
- fg-server2 and design-lap still need their own run of this checklist.
