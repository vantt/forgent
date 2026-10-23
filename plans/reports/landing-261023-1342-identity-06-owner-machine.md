# Land Identity phase 06 and SEAT-TRIM batch 2 on the owner machine

Landed 2026-10-23 13:20–13:42 (Asia/Saigon) by `SEAT` (`claude-lcpq@design-lap`, `lead:SEAT`). The owner, through DOC on 10-23 10:37, handed the Identity landings on this machine to SEAT. IDENT's board line of 12:40 lists all three machines as not having landed `3cee85c9a`. The procedure follows [the Identity 04/07 landing](landing-261023-1112-identity-04-07-owner-machine.md). The heavy IO window and the stop were coordinated with DOC (`forgentx-5f`), which was parked during the activation.

## Result

- **Release:** `sha256:447cb9a40339333a4ef51c33b9bc39c33a7b2dff31618e2f4296ef427c734d06`, built from main `e604ec15f` in the detached worktree `.fgos/runtime/landing-261023/wt` with its own Cargo dirs.
  - `fgctl` was reinstalled from the same tree; the previous binary is `fgctl.prev` in forgentX's backup folder.
- **Active** in mdview, mcp-skill-hub and forgentX. Before the land all three ran `94e26894…`.
- **New since `94e26894…`:**
  - IDENT phase 06:
    - the Rust library doors for MAIL step B;
    - `fgos identity session --drop-role`;
    - refusals printed as JSON on stdout under `--json`.
  - SEAT-TRIM batch 2:
    - the seat-binding config conversion is removed;
    - the doctor row `seat-binding-drain` is gone;
    - the global seat-key refusal is gone.
  - Board and docs commits of the other lanes.

## Verification

- **`npm test`** (session ids unset, own `CARGO_TARGET_DIR`): 8470 pass, 25 fail.
  - The known reds: `fgctl-upgrade`, `fgctl-init-download-sources` and `dev-host`.
  - Five other files failed in the full run and **passed when rerun alone**:
    - `session` 20/20;
    - `worktree-admin-multiprocess` 7/7;
    - `loop-rununit` 12/12;
    - `execution/run` 82/82;
    - `loop` 98/98 (it hit the 600 s file timeout in the full run).
- **`cargo test --workspace`:** not rerun here. IDENT reported it green (235 suites) for `3cee85c9a`. SEAT-TRIM batch 2 is Node only.
- **Release build:** run after the suite, not in parallel with it, to spare the QLC disk.

## Steps

1. **Full stop.** No `fgos`, `fgctl` or gateway process was running.
2. **`doctor --fix` with the old release:** `lock-kernel-semantics`, `lock-holders` (0 held) and `git-operation-journal` (pending 0) pass in all three.
3. **Backups** to `.fgos/runtime/landing-261023-i06/` in each workspace:
   - `.fgos/distribution.json`, `activation.json` and `config.json`;
   - refspecs;
   - the hashes of `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` and `.fgos/config.json`;
   - forgentX only: `global-config.json` (mode 600) and `fgctl.prev`.
4. **Install and activate:**
   - `cargo install fgctl`.
   - In mdview, mcp-skill-hub and forgentX: `fgctl stage` and `fgctl upgrade`. Every step returned 0, `distribution.json` was restored, hashes and refspecs were unchanged, and `fgctl verify` returned 0.
5. **`doctor --fix`, `setup`, doctor:**
   - **Setup:** `configAddedKeys` and `globalConfigAddedKeys` are empty in all three, the tier ladder comment is `unchanged`, and the hashes are unchanged.
   - **Rows passing in all three:** `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `writer-identity-resolvable`, `identity-machine-id`, `identity-project-id`, `identity-ids-unique`, `process-containment`, `git-operation-journal`, `seat-binding-config`, `seat-binding-dry-bind`, `tier-fallback` and `tier-vocabulary-dead-keys`.
   - **`seat-binding-drain`** is gone, as intended.
   - **Still red:** `git-mutation-one-door` (CFG's 5 `unresolved-binary` sites). In forgentX, `git-worktree-recovery` names two dirty `.claude/worktrees/agent-*` checkouts of other sessions. The other red rows predate this land.
   - **`active-release-matches-checkout`** in forgentX names one file, `packages/git/contracts/mutation-census.v1.json`. The landing worktree's census was rewritten after the suite's own rewrite had been reverted, so the release carries a census regenerated from its own tree. The step that rewrites it was not traced. The next land clears it; CFG's census fix makes the question moot.
6. **Smoke in forgentX:**
   - Gateway `start` / `status` (running, reachable) / `stop`.
   - `lock fence gateway` reports `free`.
   - `identity session` names this session. `identity resolve lead:SEAT` works. `identity resolve lead:NOPE --json` prints the new refusal line on stdout: `{"error":…,"reason":"not-found","candidates":[]}`.
   - Read-only run: pass (`unit-run-1792737654786-cc335f80`).
   - Writing run in `smoke/i06-land`: pass, `committed` `c1645e925` through ScopedCommit (`unit-run-1792737689023-0ce1b957`). The worktree was removed with `--delivered-to` and the branch deleted.
   - A real `git commit` in the main checkout: the commit carrying this report.

## Rollback

1. Stop everything.
2. In each workspace, from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:94e2689459dfe6a29803ab5e5b4cb10f8af426c84feb6c891c6fe8a7ca2923d6`.
3. Restore `.fgos/distribution.json` and `.fgos/config.json` from `.fgos/runtime/landing-261023-i06/`.
4. `cp fgctl.prev ~/.local/bin/fgctl`, then `fgctl verify`.

## Open

- `git-mutation-one-door` stays red until CFG fixes the census.
- **RULE** can now drop `lead:PROSE` on `fg-server` once that machine runs a release with `3cee85c9a`. On this machine no session holds a stray role.
