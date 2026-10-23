# Land the later Identity phases on the owner machine

Landed 2026-10-23 11:00–11:15 (Asia/Saigon) by `SEAT` (`claude-lcpq@design-lap`). The owner asked at 10:26 and again at 10:39 ("bên kia nó chờ tất cả máy land IDENTITY"). Through DOC, the owner also handed the Identity landings on this machine to SEAT. The procedure follows [the T1 landing](landing-261023-0133-t1-and-seat-owner-machine.md). The stop was coordinated with DOC (`forgentx-5f`), which was parked.

## Result

- **Release:** `sha256:94e2689459dfe6a29803ab5e5b4cb10f8af426c84feb6c891c6fe8a7ca2923d6`, built from main `7b36e7e70` in a detached worktree (`.fgos/runtime/landing-261023/`) with its own Cargo dir.
  - `fgctl` was reinstalled from the same tree; the previous binary is `fgctl.prev`.
- **Active** in mdview, mcp-skill-hub and forgentX. Before the land all three ran `2ce473d4…`.
- **New since `2ce473d4…`** (26 code commits):
  - IDENT phases 04 and 07: `fgos identity resolve|list|mint`, the local session directory, roles (`--role lead:<LANE>`), the project id, and the doctor rows `identity-project-id` and `identity-ids-unique`;
  - the terminal writer-id fix;
  - the CFG YAML Document slice A;
  - TEST retirements.

## Verification (shortened at the owner's request)

- **`npm test`:** 8412 pass, 31 fail.
  - 21 are the known reds: `fgctl-upgrade` 15, `fgctl-init-download-sources` 2, `dev-host` 4.
  - Rerun alone, these passed: `identity-checks` (4/4 on the second solo run; the first solo run hit load while cargo was being stopped), `fgctl-init`, `event-store-checks`, `worktree-admin-multiprocess`, `session` and `worktree`.
  - **Not rerun** this time: the four long files that hit the 600 s timeout under load (`execution/run`, `loop`, `run-provider-failover`, `crash-matrix-adopt-resume`). They have passed alone several times in the last 24 h.
- **`cargo test --workspace`:** **skipped** to shorten the wait. The new Rust is mostly Identity, which IDENT verified with cargo green. `fg-server2` landed nearly the same main (`199d85223`) with cargo green.
- **Release build:** done in a separate Cargo dir while `npm test` ran.

## Steps

1. **Full stop.** No `fgos`, `fgctl` or gateway process was running.
2. **`doctor --fix` with the old release:** `lock-kernel-semantics`, `lock-holders` (0 held) and `git-operation-journal` (pending 0) pass in all three.
3. **Backups** to `.fgos/runtime/landing-261023-ident/` in each workspace: `distribution.json`, `activation.json`, `config.json`, refspecs and hashes. forgentX's folder also holds `global-config.json` (mode 600) and `fgctl.prev`.
4. **Install and activate:** `cargo install fgctl` (from `/tmp`), then `fgctl stage` + `upgrade` in mdview, mcp-skill-hub and forgentX.
   - Every step returned 0, `distribution.json` was restored, the hashes were unchanged and `fgctl verify` returned 0.
5. **`doctor --fix`, `setup`, doctor:**
   - Exit 0; `configAddedKeys` and `globalConfigAddedKeys` empty; refspecs and hashes unchanged.
   - All three pass `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `writer-identity-resolvable`, `identity-machine-id`, `process-containment`, `git-operation-journal`, `seat-binding-config`, `seat-binding-dry-bind` and `tier-fallback`.
   - New rows:
     - `identity-project-id` passes in forgentX (project `08b076572f6eff3a90c586a35f24e4bb`, handle `forgent`). In mdview and mcp-skill-hub it only warns that no project id exists yet; `fgos identity project --init` is for IDENT or the owner to decide.
     - `identity-ids-unique` passes in all three.
   - Still red: `git-mutation-one-door` (5 sites from CFG `03c99bc61`). The other red rows predate this land.
6. **Smoke in forgentX:**
   - Gateway `start`/`status`/`stop`.
   - `lock fence gateway` reports `free`.
   - `identity machine` and `identity session` work.
   - `identity session --register --role lead:SEAT`, then `identity resolve lead:SEAT`, name this session.
   - Read-only run: pass (`unit-run-1792728650313-9dbad317`).
   - Writing run in `smoke/i7-land`: pass, `committed` `d2e222dbf` through ScopedCommit (`unit-run-1792728710559-4208cc9e`). The worktree was removed with `--delivered-to` and the branch deleted.
   - A real `git commit` in the main checkout: the commit carrying this report.

## Rollback

1. Stop everything.
2. In each workspace, from cwd `/tmp`: `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:2ce473d4e0e9cda5131a660559399719a7b2318b490b11766321047c57f7b326`.
3. Restore `distribution.json` and `config.json` from `.fgos/runtime/landing-261023-ident/`.
4. `cp fgctl.prev ~/.local/bin/fgctl`, then `fgctl verify`.

## Open

- IDENT phases 05/06 land here when they reach main; this is SEAT's job.
- `git-mutation-one-door` stays red until CFG fixes the census.
- Project ids for mdview and mcp-skill-hub are not minted yet.
