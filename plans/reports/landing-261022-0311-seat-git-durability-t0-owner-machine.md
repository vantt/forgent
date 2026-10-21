# Land SEAT, Git durability and HARDEN T0 on the owner machine

Landed 2026-10-22 02:50–03:10 (Asia/Saigon) by `forgentx-95`. The owner authorized it at 2026-10-21 22:09 ("em tự làm việc với DOC để land, máy này chỉ có 2 đứa"). The stop was coordinated with `forgentx-5f` (DOC), and no other session ran on this machine. Followed [the owner-machine guide](guide-261022-0011-owner-machine-git-durability-and-t0.md), including step 6 of [the T0 guide](guide-261021-2213-harden-t0-owner-machine-landing.md).

## Result

- **Release:** `sha256:52a7e0acda1085666c8edf0c8176d27bb8f69698dc9339e00a4f075211bd2629`, built from main `172c9d138` in a clean detached worktree with its own Cargo dir (`.fgos/runtime/landing-261022/`).
  - `manifest.json` carries `git-wal-v1`.
  - `fgctl` was reinstalled from the same tree; the previous one is kept as `fgctl.prev`.
- **Active** in mdview, mcp-skill-hub and forgentX (02:56:09–02:56:45, back to back). Before that, all three ran `653affd6…` (Git 07–08).
- **Contents:**
  - Seat Binding: phases -01 to 11 of `plans/261020-2132-seat-binding-component`, with the Work path pinning its named or default executor;
  - the Git durability fixes and HARDEN T0;
  - the guard fix `p-f97bb935`, the advisory fix, the one-door scanner fix and AGENT-WF 05–09;
  - everything else on main up to `172c9d138`.
- **Census:** main `b4e25c442` commits the regenerated mutation census. The release build rewrote it, as on 10-21.

## Steps

1. **Pull:** forgentX main merged with origin; SEAT was verified on the merged tree.
   - Full suite at `46613f277`; solo reruns clean except the fgctl fixture issue under Findings.
   - Merge-touched files run alone at `0d6225066`.
   - `cargo test --workspace` clean, except one load-dependent test that passes alone.
2. **Full stop:** no `fgos`, `fgctl` or `fgos-gateway` process, and no open fd under any `.fgos` or `~/.local/state/fgos`. No gateway was running.
3. **`fgos doctor --fix` with the old release:** `lock-holders` showed 0 held, `run-attempts-stuck` showed none stuck, and `git-operation-journal` had `pendingCount` 0 in all three workspaces.
4. **Backups** went to `.fgos/runtime/landing-261022/` in each workspace:
   - `distribution.json` and `activation.json` (rollback digest `653affd6…`);
   - refspecs and config/instruction hashes;
   - `~/.fgos/config.json` (mode 600) and `fgctl.prev`, in forgentX's folder only.
5. **Build:**
   - `cargo build --locked --release --workspace`;
   - `scripts/build-rust-distribution.mjs`;
   - `cargo install fgctl`.
6. **Canonical JSON corpus check:** `{"files":62826,"docs":101906,"subtrees":1146169,"mismatches":0,"skipped":7}`, i.e. **`canonical-corpus: all equal`**.
7. **Activate:** `fgctl stage` + `upgrade` + `distribution.json` restored + hashes unchanged + `fgctl verify` 0, in each workspace.
8. **`fgos doctor --fix` with the new release:** exit 0 in all three.
9. **`fgos setup`:** exit 0, `configAddedKeys` and `globalConfigAddedKeys` empty, refspecs unchanged.
   - Seat-binding conversion: mdview and mcp-skill-hub were `converted` (backups `.fgos/config.json.pre-seat-binding-20261021T2002*Z`); forgentX was `unchanged`.
   - Changes in both: `defaults.tier: standard` set, `rigorToTier` deleted, tier ladder `$comment` added, `patterns.seatBinding.schema: 1` added.
10. **Doctor through the shim:**
    - Every `git-*`, `lock-*`, `terminal-*`, `process-containment`, `run-supervisor-route`, `state-root` and `seat-binding-*` row passes in all three, **except `git-mutation-one-door`** (Findings).
    - `git-operation-journal` `pendingCount` 0; no `coordination-abandoned-claims` row.
    - The other failing rows predate this land:
      - mdview: `executor-family-unique`, `tool-registry-configured`, `doc-source-conservation`, `executor-profile-warnings`, `blind-steps-use-proven-pools`;
      - mcp-skill-hub: `executor-family-unique`, `executor-profile-warnings`;
      - forgentX: `tool-registry-configured`, `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`.
11. **Smoke in forgentX:**
    - (a) gateway `start` (running, reachable), `status`, `stop` ok;
    - (b) `fgos lock fence gateway --yes` on a free lock ok;
    - (c) read-only `fgos run` pass on gemini, tier standard, `unit-run-1792613203420-e8a84438`, with the seat-keyed path `producer/1/runs/01`;
    - (d) writing `fgos run` in `fgos worktree create … --branch smoke/seat-land` passed, commit `committed` `4d0f1975f` through ScopedCommit;
    - (e) `fgos worktree remove --delivered-to smoke/seat-land` ok, branch deleted.

## Findings

- **`git-mutation-one-door` fails in all three workspaces.**
  - **Cause:** a SEAT regression. The regenerated census lists 8 `unresolved-binary` sites at `src/runner/dispatch/assignment-runner.mjs:2180` → `executeExecutorCli` → `src/runner/dispatch/cli.mjs:724`. Their binary is `? elements of globalConfig.runner`, `value.map(stripConfigComments)`, `withGlobal.runner` or `runner`. The census before SEAT had none.
  - **Why it does not block:** the spawned binary is the configured agent CLI, not Git, so runtime behaviour is unchanged. Only the static proof is lost.
  - **What happens next:** `seat-p09-lead` is fixing it in production code, with no allow-list and no weaker scan. It ships as a short follow-up land. The land was kept rather than rolled back: a rollback would also drop Git durability and T0, which fix real faults.
- **The tier changed for two workspaces** (by design: rigor no longer raises a tier). In mdview and mcp-skill-hub, `architecture-advisory` and `architecture-advisory-reopen` `synthesize-recommendation` (`rigor: high`) now run at `standard`; before they ran at `flagship`. These go to MP-B1 phase 06's config proposal for the owner.
- **mcp-skill-hub has no pool:** `seat-binding-dry-bind` binds 0 of 42 seats ("no pool configured"). Its config has no `prefer` and no `tierFallback`, so a Workflow unit run there is refused instead of falling back to the global executor. This also goes to MP-B1 06.
- **fgctl test fixture under umask 002:** `test/rust-host/fgctl-upgrade.test.mjs` (15) and `fgctl-init-download-sources.test.mjs` (2) fail on this machine.
  - **Cause:** the shared-init fixture from `d008ff318` copies the state tree with `fs.cpSync`, which loses `git-empty-hooks`' 0500 mode, so the trusted-hooks check refuses.
  - **Impact:** a test fixture problem, not a production fault; it is for the TEST lane.
- **Load-dependent:** `dev-host` "concurrent dev consumers…" also failed at phase 07. Cargo `holder_lock_gate_passes…` and `fgos-git` `killed_move_repairs…` pass alone.

## Rollback

1. Stop everything.
2. In each workspace, run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:653affd6610924ea67b240e50980f1205d49485f3c018fbec2c45528a4ad4061`.
3. Restore from `.fgos/runtime/landing-261022/`:
   - `distribution.json`;
   - for mdview and mcp-skill-hub, also `.fgos/config.json` from its `.pre-seat-binding-*` backup. The old release refuses the converted config.
4. Restore `~/.fgos/config.json` and `cp fgctl.prev ~/.local/bin/fgctl`.
5. Run `fgctl verify`.

## Follow-up land (04:10–04:25)

- **Release:** `sha256:a2b19d78900265cd6eb60b3b4f0868f47a6f134ae3d744644ef7bf024d21f3d3`, built from main `f315b99c7`, active in all three workspaces. Its fix is `a4db2b947`.
  - **Cause of the one-door failure:** the recursive `stripConfigComments` rebuilt the config object, so the scanner could not trace the executor command to file data.
  - **Fix:** a JSON round trip; the census now has 0 sites.
  - It arrived with the main-into-track merge `d7c0256ed`; the `172c9d138` census in git was stale, which is why it read 0.
- **Proof:** full suite at `a4db2b947` plus solo reruns. Only the known reds remained: the fgctl fixture under umask 002, `dev-host`, and cargo `holder_lock_gate` (load; it passes alone).
- **Steps:** the full stop was coordinated with `forgentx-5f`; an orphan test-fixture node (pid 894459, from this session's suite) was killed.
- **Upgrade refusal:** the first `fgctl upgrade` was refused with `git-predecessor-writer-live`. The gate took this session's own shell (cwd in the workspace, argv naming Git) for an older Git writer; that is correct, conservative behaviour. A rerun from a clean script with cwd `/tmp` passed.
- **Doctor:** `git-mutation-one-door` passes in all three (964 files, payload digest `e11f0d9c7050`), and so does every required row. The other failing rows are the same as before this land.
- **Smoke:**
  - A read-only `fgos run` once ended `execution-failure`: omp exited to the shell before the brief was sent, so `terminal:foreground-not-agent` cancelled the run (`unit-run-1792617622427-55f5d158`).
  - The retry passed (`unit-run-1792617651330-03b23a36`).
- **Digest note:** the round trip drops keys whose value is `undefined`. A bind-input digest of a unit bound before this release and resumed after it could differ. No unit was in flight across the stop.
- **Rollback to the first land:** `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:52a7e0ac…`.

