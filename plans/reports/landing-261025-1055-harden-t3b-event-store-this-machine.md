# Landing: HARDEN T3 part 04b (Event Store) and 04a phase 07, on the second machine

Activated 2026-10-25 10:52 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` (machine `fg-server2`) by `lead:HARDEN` (`claude-p74h@fg-server2`). This was a self-landing under owner decision 36 (Q4) in a quiet window that WORK (`forgent-4e`) and TEST (`test-wa-5d`) both confirmed. WORK's close-out (`38f43b6c1`) was folded into the same release at WORK's request.

## Outcome

- **Active release:** `sha256:34d5be090cc8e422c8224a9c50a219e42c2a55c2fa377dc407f8d07dc51f3690`, built from main `38f43b6c1` (HARDEN merge `8622c1066` plus WORK's close-out), 861 files.
- **Rollback release:** `sha256:874af08f3ce5b660ee4bbbf0bdd7d8a7c38af553fedef54be7a5712c9026087d` (the T3-04a release) stays staged.
- **Sources:**
  - [04b arbitration](council-261025-0057-harden-t3b-arbitration.md), owner decisions 33–38 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md);
  - branch reports on `origin/harden/t3b-land`: `report-261025-0713-harden-t3b-red-tests.md`, `report-261025-0917-harden-t3b-reader-edges.md`, `report-261025-0917-harden-t3b-admission-platform.md`, `report-261025-0916-harden-t3a-p07-scorecard-constants.md`.

**What changed for users:**
- **Event Store reads at the edges** (owner decision 33):
  - a clone with no store root yet reads as empty history, and a write there refuses naming `fgos setup`;
  - a peer's mirror that fails verification (bad machine name, tampered header, oversize blob, forged own-origin claim) is skipped and named in `skippedMirrors`, and a rewound or vanished peer mirror keeps the events it already authenticated and is named `event-store-mirror-rewound`;
  - the reading machine's own history stays fail-closed, including a fresh clone's own-machine mirror (the read request now names the machine);
  - `event-store-integrity` fails naming each skipped mirror and each sync warning;
  - `fgos setup` makes `fgos`, `fgos/events` and `locks` mode 0700.
- **Write admission** keeps only settled answers (admitted, migration required); a Git or I/O failure or a missing pinned legacy ref is asked again on the next write.
- **Platform wording:** Work and the Event Store refuse every non-Linux platform, macOS included (owner decision 34; backlog `p-zsy3fmbcpd`).
- **`fgos metrics harness`** no longer prints `complexity`, `sessions`, `friction` or `entropy.counts.frictions` (owner decision 37).
- **Not built:** masking secrets at append (owner decision 38; backlog `p-nykfevjxqf`; the manual remedy is in the Event Store spec's known limits).

## Reviews

| Part | Reviewer |
|---|---|
| Red tests, reader edges, admission and platform | WORK: MERGE on each branch |
| Git area (addon `event_store.rs`, census) | OPC: MERGE on `08b9043e9`, one Low fixed in `a5ac7f5c5` |
| 04a phase 07 | owner decision 37; big lead verified; TEST accepted the test retirements |
| OPC's own Git fix (`cb1edec0b`, landed separately) | HARDEN: MERGE |

## Verification before the merge

- **Full gate** on the merged tree `08b9043e9` (env -i, private Cargo target):
  - `npm test`: 8682 tests, 8584 pass, 0 fail, 33 skipped, 65 todo; no run-tests ERROR lines.
  - `cargo test --workspace`: 1629 pass, 1 fail. The red is IDENT's `identity_register_publishes_and_resolve_answers_a_session_of_another_machine`, which fails the same way on main `496743e39` (TEST confirmed; board `ca055f10b`): the test does not isolate HOME, and this machine's global config is refused by the config validator.
- **After merging OPC's land:** `fgos-git`, `fgos-event-store` and `fgos-work-state` tests (84 targets green), clippy `-D warnings` on node-addon, fgos and fgos-git, and the touched Node files (54 pass).
- **Cross-target:** `cargo check --all-targets` clean for event-store, observe and work-state on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (compile only).
- **Census:** regenerated last; `--check` shows only the 5 known undeclared sites.

## Steps and checks

1. **Build** in a clean detached worktree at `38f43b6c1`: `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs --out` (861 files).
2. **Backups** in `.fgos/runtime/tmp/landing-harden-t3b-here/`: `distribution.json`, `activation.json`, `project-config.json`, `global-config.json` (mode 600), `refspecs.txt`, `instruction-hashes.txt`, `fgctl.prev`.
3. **Activation:** `fgctl` reinstalled from the release worktree, `fgctl stage`, `fgctl upgrade` (exit 0), `distribution.json` restored, instruction hashes unchanged, AgentKit block present once, `fgctl verify` exit 0, refspecs unchanged.
4. **Setup and doctor:** `fgos doctor --fix` exit 0; `fgos setup --json` added no config keys; `fgos doctor --json` 149 rows, 10 not passed, the same known ten as the 04a landing. Every `event-store-*`, `observe-*` and `identity-*` row passes. `fgos events status`: `skippedMirrors` and sync warnings empty.
5. **Smoke:** `dispatch decide` answers `in-process`; `friction list` reads 752 records; `metrics coverage` 0.18 s; `identity session --role lead:HARDEN` claims the role.

## Known on this machine

The config validator refuses these keys in this machine's config files, before and after this landing (the validator was already in the previous release):
- project `.fgos/config.json`: `gateway.port` (belongs in global), `gateway.token` (belongs in the token file);
- global `~/.fgos/config.json`: `gateway.token` (token file), `runner.llmAccounts` and `runner.providers.{openai,gemini,z-ai,deepseek,xai}.accounts` (accounts file).

So `fgos config show` refuses, and IDENT's shared-directory publish (new in this release) prints `identity-publish-failed` and does not publish, while the role is still recorded locally. Moving those keys is the owner's or CFG's call.

## Rollback

Stop every fgOS writer, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:874af08f3ce5b660ee4bbbf0bdd7d8a7c38af553fedef54be7a5712c9026087d`.
2. Restore `.fgos/distribution.json` from the backup folder.
3. `cp fgctl.prev ~/.local/bin/fgctl`.

On main, revert merge `8622c1066` (`-m 1`) only while no lane has built on it; WORK's `38f43b6c1` already has. The previous release reads everything this one writes: no on-disk format changed (`skippedMirrors` is a new read-result field; checkpoints and cursors keep their shape).

## Other machines

fg-server, design-lap and the owner machine take this with their next upgrade from main. Checks for that guide: every `event-store-*` row passes, `fgos events status` shows empty `skippedMirrors`, and `fgos metrics harness --json` has no `complexity` key.
