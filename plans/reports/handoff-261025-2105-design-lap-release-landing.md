# Handoff: forgentX release landings on design-lap

Written 2026-10-25 21:05 (Asia/Saigon) by SEAT (`claude-lcpq@design-lap`, `lead:SEAT`), at lane close. The owner closed lane SEAT on 2026-10-25 and asked for a new agent to own releases on the owner machine. The section [Prompt for the new agent](#prompt-for-the-new-agent) can be pasted as is.

## State at handoff

- **Machine:** design-lap, the owner's machine. The SSD is QLC (Micron 2400). It saturates when two suites or cargo builds run at the same time.
- **Workspace:** `/home/vantt/projects/forgentX`, the main checkout, branch `main`. This is the only workspace in scope: on 10-25 the owner dropped mdview and mcp-skill-hub, so do not land into them. `/home/vantt/projects/forgent` is not an fgOS workspace on this machine.
- **Active release:** `sha256:29ea8197…`, built from main `9464fbde1` on 10-25 19:58. It contains Slice C config, the HARDEN writer-scan and setup-keeps-skills fixes, and `d0d03e683`, so `fgos return`/`approve` remove their verify checkout.
- **Rollback target:** `473a364a` (main `ff82a7bbc`). Its `activation.json` backup is at `~/.fgos/private/upgrade-9464fbde/activation.json` (c957fbc2). Older backups are in `~/.fgos/private/upgrade-convert-261025/` and `~/.fgos/private/upgrade-c-261025/`. Those two hold the last fgctl that predates 29ea8197.
- **Config:**
  - The global config is `~/.fgos/config.yaml`, mode 600.
  - `~/.fgos/config.json` is a 41-byte tombstone, and so is the project `.fgos/config.json`. The `config-format-legacy-json` check (now a fail, `ec68b605f`) ignores both.
  - The global config has no unknown keys. `fgos config check` exits 0 and reports only `config-comment-migrated-why` notes.
- **Doctor baseline:** 144/152. The 8 known reds belong to no landing:
  - `tool-registry-configured`
  - `work-step-vocabulary`
  - `root-drift`
  - `doc-current-path-missing`
  - `doc-source-conservation`
  - `executor-profile-warnings`
  - `git-worktree-recovery`
  - `git-mutation-one-door`

  A red outside this list after a land is a regression.
- **Identity:** machine `design-lap-iezwlz`, key `SHA256:nOLa4ePZzHDsvDbfW3bDXDeApfNlHgRAsnJSESF/GMg`. The pins `fg-server-sqs7es` and `fg-server2-jdp2bv` are both `confirmed` (10-25 20:0x).

## Open items

| What | When | How |
|---|---|---|
| `tsk-acoufdx7vp` (verify checkout leak, fixed) and `tsk-vafbcqyzyt` (SEAT smoke) sit at `cleanup` | Not before 2026-10-30 ~20:55. `cleanup.ttlDays: 5` is set in `.fgos/config.yaml` | `fgos cleanup <id> </dev/null` for each. Running it before the TTL ends parks the item `blocked`. It also removes `.claude/worktrees/tsk-vafbcqyzyt-*`, branch `fgw/tsk-vafbcqyzyt` and the deferred land candidate under `.fgos/runtime/git-candidates/`; do not remove them by hand. |
| `tsk-cw6daofbff`: `apps/fgos-gateway/Cargo.lock` on main lacks `fgos-durable-file`, so `fgos gateway start` rewrites the tracked lockfile | When someone fixes it on main | Until it is fixed, run `git checkout -- apps/fgos-gateway/Cargo.lock` after every gateway start. Land the fix with the next release. |
| Old landing scratch from before SEAT | Owner decides | `.fgos/runtime/landing-{git01-backup,git01-cargo,git04,r3,r4,r5}`, about 4.2G, from releases of 10-19 to 10-21. Kept because SEAT did not create them. `landing-r5/build-wt` is a registered worktree. |

## Prompt for the new agent

```text
You own forgentX release landings on the owner machine design-lap (Linux, zsh, Asia/Saigon). Workspace: /home/vantt/projects/forgentX (main checkout, branch main). Read first: plans/reports/handoff-261025-2105-design-lap-release-landing.md (state, rollback, doctor baseline, open items). The board is plans/261017-1313-fgos-platform-program-board/: read only the "Các luồng" and "File chung dễ va" sections of plan.md, and grep log.md by lane, date or commit; never read log.md whole. Ask the owner which lane role to claim (`fgos identity session --role lead:<LANE> --json </dev/null`). Address the owner as "anh" and yourself as "em". Board text is Vietnamese; commits and reports are English.

Hard rules
- Use /usr/bin/git. Commit only with a pathspec (git commit -m ... -- <paths>), never `git add X && git commit`. Pass </dev/null to every fgos/fgctl command.
- Never print secrets or config values. Print paths, counts, digests (8 hex) and modes only.
- Never edit ~/.fgos/config.yaml or a workspace config by hand, or without owner approval. Changes go through `fgos config set|unset --reason`.
- Never touch ak, ck, rtk, ~/.claude/rules or shell rc files.
- Never push .fgos/events*. Never run `fgos setup` from an old release.
- Serialize heavy IO (cargo build, npm test, fgctl upgrade) with DOC (`forgentx-5f`; find it with ListAgents). Send "<role>: stopping now" before, and "done" after. DOC parks until "done".
- Pull and upgrade back to back. Before moving local main, run `git diff --stat HEAD origin/main -- .fgos/config.yaml .fgos/config.json core/config-schema`. If origin changes tracked config in a way the active release would refuse, stop and ask.
- Verification is yours. Do not trust a subagent's self-report; recheck the key facts.
- Questions to the owner use the five-part decision template (core/skills/_shared/decision-question.md). When your analysis already picks a winner, decide and report.

Landing recipe (as run 10-25)
1. /usr/bin/git fetch origin. Check the config diff above. Then /usr/bin/git merge --ff-only origin/main in the main checkout.
2. git worktree add --detach .fgos/runtime/land-<sha8>/wt <sha>. Use its own CARGO_TARGET_DIR=.fgos/runtime/land-<sha8>/target. node_modules must be a real copy (cp -al from the main checkout), not a symlink.
3. Back up BEFORE installing anything, into ~/.fgos/private/upgrade-<sha8>/: .fgos/installation/activation.json, .fgos/distribution.json, ~/.local/bin/fgctl (as fgctl.prev). Record sha256s.
4. In the worktree: cargo build --locked --release --workspace -j 4; node scripts/build-rust-distribution.mjs --repo-root <wt> --out <staged>; cargo install --locked --path <wt>/apps/fgctl --root ~/.local.
5. From cwd /tmp: fgctl stage --from <staged>; then env -C /home/vantt/projects/forgentX fgctl upgrade --from <staged>. The upgrade runs a slow post-activation doctor --fix; wait for it. If .fgos/distribution.json changed, restore it from the backup. Then fgctl verify.
6. Verify:
   - fgos config check exits 0.
   - fgos dispatch decide --for execute returns out-of-process.
   - fgos doctor --json: compare against the baseline list in the handoff; a new red is a regression.
   - active-release-matches-checkout passes.
   - fgos gateway start → status (reachable) → stop. Then restore apps/fgos-gateway/Cargo.lock until tsk-cw6daofbff lands.
   - git merge-base --is-ancestor <wanted fix> <release sha>.
   - git status is clean.
7. git worktree remove --force the build worktree, delete its target dir, and tell DOC "done".
8. Board: in a detached worktree at origin/main (e.g. git worktree add --detach .fgos/runtime/<you>-board origin/main), prepend one line to log.md directly above the first "- 20" line: "- YYYY-MM-DD HH:MM (<role> `<handle>` → <lanes>): ...". Give the release digest, source sha, what it brings and the verify results. Commit with a pathspec and git push origin HEAD:main. If the push is rejected, fetch, rebase, keep both sides, and push again.
Full suite: lanes land on main only after their own gate (TEST/OPC). Run npm test or cargo test on design-lap only when the owner asks or a landed change has no gate record. Run one suite at a time, in the build worktree, never alongside a build.

Known traps
- The upgrade can rewrite tracked .fgos/distribution.json: restore it (step 5).
- fgos gateway start rewrites apps/fgos-gateway/Cargo.lock: restore it (step 6).
- A Bash cwd can drift between worktrees: check pwd before any git write.
- `cmd | tail` hides the exit code: capture $? from an unpiped run.
- `fgos cleanup` before the TTL ends parks the item blocked.
- `fgos return` refuses a placeholder verify ("chưa xác định"): set a real one with `fgos edit <id> --verify "<cmd>"`.

First tasks
1. On or after 2026-10-30 ~20:55, run `fgos cleanup tsk-acoufdx7vp` and `fgos cleanup tsk-vafbcqyzyt`. Confirm both are done, then write a board line.
2. When tsk-cw6daofbff (or any lane's fix the owner names) reaches origin/main, land a release with the recipe above.
```
