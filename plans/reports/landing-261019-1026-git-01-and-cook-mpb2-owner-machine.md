# Owner machine: Git 01 + 6.4 landed together with COOK, the codex prompt door and MP-B2

Date 2026-10-19 10:26 (Asia/Saigon), session `forgentx-95`, following [the 09:15 guide](guide-261019-0914-owner-machine-git-01-landing-after-fixes.md). Owner approved the landing ("ok chờ hội đồng xong rồi land") after upgrading git.

## What is active now

- Release `sha256:4591f097ba7934bbde8263f36c0757d1f10526157abcb4bfc82ce1d6ef67f357`, built from main `f85fc7d3f` in a clean detached worktree with its own Cargo dir; tree has `libexec/native/fgos.node`.
- Active in mdview, mcp-skill-hub and forgentX (`.fgos/installation/activation.json`).
- Contents beyond the second machine's release (`af1f2db2b`): Git phase 02 (dormant, adds the `git-transport-config` doctor row) and the board/report commits after it. Also carried: COOK P1+P3 (`/fgOS:deliver`), codex brief through `herdr agent prompt`, MP-B2 phases 00–05 (`invocation.credentialStore`), 6.4 controller death.
- Not in this release: Git phase 04 (custody lease), which keeps its own stop-everything landing.
- `fgctl` reinstalled from the same tree (`b461e9d1…`); previous copy at `.fgos/runtime/landing-git01-cargo/fgctl.prev` (`fd70f877…`).
- Previous release for rollback: 6.3 `sha256:a6bcdc29…`. Backups of `distribution.json`, fetch lines and config hashes: `.fgos/runtime/landing-git01-backup/`.

## Steps as run

1. git 2.55.0 (owner upgraded).
2. `/tmp/fgos-confinement`: 26 homes, none version-1 (no `paneId`/`binderPid`); nothing removed.
3. Quiesce: the DOC lane stopped its Phase 8 Doer run itself on request (it reruns fresh); an orphaned test bwrap from 10-18 19:40 (my fixture) was killed; the stuck council pane `wS:p5VW` closed.
4. Old-release `fgos doctor --fix`: `run-attempts-stuck` clean in all three.
5–7. Build, backups, `fgctl stage` + `fgctl upgrade` in mdview → mcp-skill-hub → forgentX; `distribution.json` restored in each.
8–10. `fgos setup` in each: `git-driver-directories` safe, `Git WAL initialized and trusted`; fetch lines `+refs/heads/*`, `+refs/fgos/events/*`, glob `+refs/fgos/legacy*`; `git fetch origin` exit 0.
11. 6.4 sweep with the new release: `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait` pass in all three after one pass.
12. Doctor through the shim: every required row passes (Git rows, attempt rows, `lock-*`, `state-root`). forgentX `active-release-matches-checkout` fails only on the 4 git-ignored `.agents/skills/instruction-audit/` files that setup renders, the same as every landing on the second machine. Other failing rows are the owner-config set (model/tier coverage, provider capacity, doc conservation, executor profile warnings).
13. Smoke:
    - codex through herdr in forgentX (account `tetnu`): `unit-run-1792380024687-1500a594` **pass**; the brief was submitted on the first try (prompt door active).
    - claude through cli (herdr env removed) in the scratch clone: `unit-run-1792380133554-b031603e` **pass**.
    - claude through herdr in forgentX: `unit-run-1792380086595-540b5d9e` and `unit-run-1792380365267-e3cef0b0` **pass**.
    - Ctrl-C/resume: **not exercised** this time (the agent finished in 17 s before the interrupt landed); the path was proven by T8 in 6.4 P07A.
    - Seen, not regressions: codex in the scratch clone `smoke-6.2` is blocked by `terminal:blocked:trust-dialog` (the clone is its own git root, trusted by no codex account; lane TRUST); a cli read-only run with a bare "reply ok" prompt is `inconclusive` because no report artifact is written (no-evidence by design).

## Follow-ups

- MP-B2 phase 06 (remove `resourceBindings`/`env[homeEnv]` from forgentX config) is now unblocked.
- Rerun the AGENT-WF focused panel round (its codex seat failed on the old release).
- Git 04 landing waits for the owner's time.
