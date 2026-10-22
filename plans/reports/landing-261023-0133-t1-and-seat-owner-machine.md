# Land HARDEN T1 and the seat-binding fixes on the owner machine

Landed 2026-10-23 01:20–01:40 (Asia/Saigon) by `SEAT` (session handle `claude-lcpq@design-lap`). The owner chose option A at 00:13: land now and accept the known red `git-mutation-one-door` row. `SEAT` acted as the owner-machine agent of item (3) in the board line of 2026-10-22 22:47, following [the T1 guide](guide-261022-2003-harden-t1-owner-machine-landing.md) step by step. The stop was coordinated with DOC (`forgentx-5f`), which was idle.

## Result

- **Release:** `sha256:2ce473d4e0e9cda5131a660559399719a7b2318b490b11766321047c57f7b326`, built from main `7833d5df1` in a detached worktree (`.fgos/runtime/seat-sel-verify/wt`) with its own Cargo dir.
  - `fgctl` was reinstalled from the same tree; the previous binary is `fgctl.prev`.
- **Active** in mdview, mcp-skill-hub and forgentX. Before the land all three ran `9508f457…`.
- **Contents beyond `9508f457…`:**
  - HARDEN T1: holder-lock and identity doors in-process; the Node fences and the `/proc` scan are removed; doctor holder-lock rows go from 9 to 5.
  - IDENT phases 01–02: machine and session handles.
  - OPC Phase A.
  - The COOK pane-launch fix for `p-a178ca5c`.
  - SEAT-TRIM batch 1.
  - The run-door fix: `fgos run --capability` and `--persona` are no longer refused as raises.
  - The seat-binding client EPIPE fix.
- **Not in this release:** IDENT phase 07 (the mint door) reached main during verification, after `7833d5df1`. It ships with the next land.

## Steps

1. **Pre-conditions** (old release, read-only, then `doctor --fix`):
   - `lock-fences` passes in all three. mdview has 222 paths fenced and mcp-skill-hub 23.
   - forgentX has 71 `advance` paths not fenced. None has an old lock file (no `old lock still present`), which is the case the guide allows.
   - `git-operation-journal` shows `pendingCount` 0 in all three.
2. **Verify main `7833d5df1`** (serialized, during DOC's idle time):
   - `cargo test --workspace`: only `holder_lock_gate_passes_on_a_local_mount_with_the_real_git` failed, and it passes alone.
   - `npm test`: 8527 pass, 24 fail.
     - 18 are the known reds: `fgctl-upgrade` 15, `fgctl-init-download-sources` 2, `dev-host` 1.
     - The other 6 files pass alone: `help-routes`, `session`, `worktree-admin-multiprocess`, `spawn-worker`, `execution/run`, `loop`.
3. **Full stop:** no `fgos`, `fgctl` or gateway process, and no open fd under `.fgos` or `~/.local/state/fgos`.
4. **Backups** to `.fgos/runtime/landing-t1/` in each workspace:
   - `distribution.json`, `activation.json` and `config.json`;
   - refspecs and hashes;
   - forgentX only: `global-config.json` (mode 600) and `fgctl.prev`.
5. **Build:**
   - `cargo build --locked --release --workspace`;
   - `build-rust-distribution.mjs`;
   - `cargo install fgctl`, run from `/tmp`.
6. **Activate**, in order mdview, mcp-skill-hub, forgentX:
   - `fgctl stage` 0 and `fgctl upgrade` 0;
   - `distribution.json` restored;
   - hashes unchanged;
   - `fgctl verify` 0.
7. **`doctor --fix`**, then **`setup`** and **doctor**:
   - Exit 0; `configAddedKeys` and `globalConfigAddedKeys` empty; refspecs and hashes unchanged.
   - All three pass `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `writer-identity-resolvable`, `identity-machine-id`, `process-containment` and `git-operation-journal`, plus every `seat-binding-*` row and `tier-fallback`.
   - The four rows T1 removed are gone.
   - New red row: `git-mutation-one-door` (5 `unresolved-binary` from CFG `03c99bc61`), as expected.
   - forgentX also shows `active-release-matches-checkout`, because main moved past the release.
   - The other red rows predate this land.
8. **Smoke in forgentX:**
   - (1) Gateway `start` (running, reachable), `status` and `stop`.
   - (2) `fgos lock fence gateway --yes` reports `free`.
   - (3) `fgos identity --json` returns `source: env`. Machine handle `design-lap`; session `claude-lcpq@design-lap`.
   - (4) Read-only `fgos run`: pass (`unit-run-1792693841540-a991efa3`, gemini, advanced).
   - (5) Writing `fgos run` in `smoke/t1-land`: pass, commit `committed` `500654ccf` through ScopedCommit (`unit-run-1792693867255-b6c321a3`). The worktree was removed with `--delivered-to` and the branch deleted.
   - (6) `fgos run "…" --capability docs:write`, read-only: no longer refused. It passed on openai pi-herdr at flagship, `gpt-6.1-sol`, effort high (`unit-run-1792693975470-b4ac1694`).
   - (7) A real `git commit` in the forgentX main checkout (this report, the board line and the config change) went through the new pre-commit hook.
9. **Config:** the `docs:write` pin to `openai#codex-herdr` (`38b82e415`) is removed in the same commit as this report. It rested on a wrong diagnosis: the failures were the pane-launch race, not pi with `gpt-6.1-sol`. With the pane fix active, smoke (6) passed on pi-herdr.

## Rollback

1. Stop everything.
2. In each workspace, from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:9508f457d1ec11814de34149c6b19ce01ffbf237060ee6093fbaf442fac4b511`.
3. Restore `distribution.json` and `config.json` from `.fgos/runtime/landing-t1/`, and `~/.fgos/config.json` from forgentX's `global-config.json`.
4. `cp fgctl.prev ~/.local/bin/fgctl`, then `fgctl verify`.

## Open

- `git-mutation-one-door` stays red until CFG fixes the 5 census sites; the next land then also carries IDENT phase 07.
- Per IDENT's request, the `IDENT roster` board line for this machine is written with this land.
