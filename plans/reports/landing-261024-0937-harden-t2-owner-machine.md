# Land HARDEN T2 (with IDENT I5 and CFG YAML) on the owner machine

Landed 2026-10-24 09:20–09:37 (Asia/Saigon) by `SEAT` (`claude-lcpq@design-lap`, `lead:SEAT`), following [HARDEN's owner-machine guide](guide-261023-2228-harden-t2-owner-machine-landing.md). The owner said "go" at 09:23 (in the SEAT session, and to DOC: "land feature moi tu cac may khac"). DOC (`forgentx-5f`) was parked during the activation.

## Why now

Every `fgos run` on `design-lap` failed with `terminal-control-route-usage "unknown terminal.layout.policy even-split"`.
- **Cause:** SEAT pulled main into the forgentX checkout to commit board lines. Main already carried `aff7f2d54`, which sets the tracked project config to `even-split`. The active release `447cb9a4…` knew only `measured-split`.
- The guide's first precondition says not to pull before activating. SEAT missed it.

## Result

- **Release:** `sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8`, built from main `62ce98513` in a fresh detached worktree (`.fgos/runtime/landing-261024-t2/wt`), with a fresh Cargo dir and a fresh staged dir.
  - `fgctl` was reinstalled from the same tree; the previous binary is `fgctl.prev`.
- **Active** in mdview, mcp-skill-hub and forgentX. Before the land all three ran `447cb9a4…`.
- **Carries since `e604ec15f`:**
  - HARDEN T2 (merge `a01f725bf`: Git and terminal-control hardening, `even-split` default);
  - IDENT I5: machine signing key, `HeadRef`, `PI_SESSION_ID`, the writer-key door `0d3224362`;
  - CFG Slice B schemas and Slice C YAML through Rust;
  - the other lanes' commits up to `62ce98513`.

## Verification

- **Full `npm test`: not run here (owner's choice at 09:23).** The basis instead:
  - HARDEN landed T2 on `fg-server2` at 22:09;
  - TEST reported `npm test` 8661/0 on main;
  - `fg-server` landed the IDENT part;
  - doctor before and after, plus the smoke below.
- **Census (phase 8):** `TOTAL {"wals":3,"legacyScopedOrSync":0,"ledgerV1":0,"unreadable":0}`, posted 10-23 18:25.

## Steps

1. **Preconditions with the old release.** `doctor --fix`, then `doctor --json` saved as `doctor-before.json`.
   - `git-operation-journal` and `lock-holders` pass in all three.
   - `terminal-config` is red only in forgentX, because of the `even-split` value this land fixes.
2. **Backups** to `.fgos/runtime/tmp/landing-harden-t2/` in each workspace:
   - `.fgos/distribution.json`, `.fgos/config.json` and `activation.json`;
   - refspecs and hashes;
   - forgentX only: `global-config.json` (mode 600) and `fgctl.prev`.
3. **Activation:** `fgctl stage` and `upgrade` in mdview, mcp-skill-hub and forgentX.
   - All returned 0 on the first try; no `git-predecessor-writer-live`.
   - `distribution.json` was restored, hashes and refspecs were unchanged, and `fgctl verify` returned 0.
4. **Checkout:** forgentX was pulled fast-forward to `aa11b0490`. That is the release source plus two board lines.
5. **`doctor --fix` and `setup`:** `configAddedKeys` and `globalConfigAddedKeys` are empty in all three; refspecs and hashes are unchanged. `identity-machine-key` created the machine key.
6. **Layout policy:** the guide's step 10 script ran.
   - Changed to `even-split`: `~/.fgos/config.json`, mdview and mcp-skill-hub.
   - forgentX was already `even-split`.
7. **Doctor after:** 140 rows in each workspace.
   - **Git rows (6):** `git-component-compatible`, `git-mutation-one-door`, `git-native-locks`, `git-operation-journal`, `git-repository-config` and `git-worktree-recovery`.
   - **Terminal rows (2):** `terminal-control` and `terminal-allocations`.
   - `identity-machine-key`, `identity-ssh-keygen`, `identity-pinned-machines`, `terminal-control`, `lock-holders`, `seat-binding-*` and `tier-vocabulary-dead-keys` pass.
   - **No row is newly red** compared with `doctor-before.json`.
   - `git-mutation-one-door` is still red (CFG's census sites).
   - **`active-release-matches-checkout`** in forgentX names one file, `packages/git/contracts/mutation-census.v1.json`. This is by design: `scripts/build-rust-distribution.mjs` writes a fresh census of the product into the release (Git spec §12), and the census committed on main is stale. It clears when CFG regenerates the census on main.
8. **Smoke in forgentX:**
   - Gateway start / status (running, reachable) / stop.
   - `dispatch decide --needs-soul --has-live-task-access` → `in-process`.
   - `identity --json` → `source: env`. `identity mint work` → `tsk-qpvin4lchs` (minted, unused). `lock fence gateway` → `free`.
   - Writing run in `smoke/t2-land`: pass, `committed` `92a2adcf8` through ScopedCommit (`unit-run-1792809320197-05127616`, gemini on herdr). The worktree was removed with `--delivered-to`.
   - `fgos worktree create --detach` took 2.6 s and `remove --delivered-to refs/heads/main` took 1.3 s; no `prunable` registration left.
   - **Read-only runs: 1 pass of 3.** The two failures (`unit-run-1792809306628-b7a20dfd`, `unit-run-1792809441654-9c423afa`) are gemini through `omp` v18.11.0. omp drew its screen, showed an "Update Available 18.12.6" banner, then exited 1 back to the shell, and the runner stopped it with `terminal:foreground-not-agent`.
     - The same failure also happened on the old release (`unit-run-1792771105757-8d008210`, 10-23), and the same path passed three times today, including the writing run.
     - Reading: the cause is in the agent CLI, not in T2. It was not traced further.
   - The optional three-pane herdr check was not done.
   - A real `git commit` in the main checkout: the commit carrying this report.

## Rollback

1. Stop everything.
2. In each workspace, from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:447cb9a40339333a4ef51c33b9bc39c33a7b2dff31618e2f4296ef427c734d06`.
3. Restore `.fgos/distribution.json` and `.fgos/config.json` from `.fgos/runtime/tmp/landing-harden-t2/`, and `~/.fgos/config.json` from forgentX's `global-config.json`. The old release refuses `even-split`.
4. `cp fgctl.prev ~/.local/bin/fgctl`, then `fgctl verify`.

## Open

- **IDENT key** — `design-lap`: `SHA256:nOLa4ePZzHDsvDbfW3bDXDeApfNlHgRAsnJSESF/GMg` (board line).
- `git-mutation-one-door` and the census entry of `active-release-matches-checkout` wait for CFG's census regeneration.
- The intermittent omp/gemini exit at start: no owner yet. A candidate cause is the omp update banner; `omp update` to 18.12.6 is the owner's call (another project's tool).
