# Owner machine: COOK P4, debate pattern, MP-B1 pool fix, thehive

Date 2026-10-20 15:00–15:30 (Asia/Saigon), session `forgentx-95`, machine `design-lap`. Owner 14:59: "nếu được thì em land đi … chỉ cần đảm bảo không có đụng ai". Followed [the landing guide](guide-261019-2222-owner-machine-git-05-es-08-landing.md).

## What is active now

- Release `sha256:4efa6e15a14a5fbd1c060d46dcf26f7151bf092492adbc66d4f8ac5078537612`, built from main `d02b82899` in a clean detached worktree with its own Cargo dir; native addon `linux-x64 8 ["git-wal-v1"]`. Active in mdview, mcp-skill-hub, forgentX; `fgctl` reinstalled from the same tree (previous kept as `.fgos/runtime/landing-r4/fgctl.prev`).
- New since `d7b89b24…`: COOK P4 (skill prune keeps third-party skills, `fgos worktree create` provisions, `ak-*` copy, `executor-skills-installed`, ak:cook brief), `resolveTierModel` on the B1 contract, `debate` pattern and `judge` role, `fgos worktree remove`, ES store-layer fixes (dormant), secrets crate (library only).
- Rollback target `d7b89b24…`; backups in `.fgos/runtime/landing-r4/backup/`.

## Steps as run

1. Quiet: peer `forgentx-5f` (DOC lead) confirmed no fgOS work and held until "land done"; no fgos/fgctl process; one orphan test node (pid 720692, 20 h old, cwd a deleted agent worktree, holding a deleted `/var/tmp` test lock) stopped; two leftover panes of earlier runs closed.
2. `/tmp` step 0: the guarded command keeps every git checkout, so ~9k test repos stayed; a separate agent cleaned them ([report](audit-261020-1512-tmp-test-dirs-cleanup.md): 9,050 removed, ~597k inodes).
3. Git identity: forgentX and mcp-skill-hub global only; mdview keeps its deliberate local email.
4. Old-release `doctor --fix`: 0 stuck, 0 held; no predecessor records; decision index untouched.
5. Backups, build, `git-wal-v1` check, `fgctl stage`/`upgrade` mdview → mcp-skill-hub → forgentX, `distribution.json` restored, hashes unchanged, `fgctl verify` 0.
6. New-release `doctor --fix` and `fgos setup` exit 0; refspecs identical; `git fetch` ok.
7. Doctor through the shim: every required Git/run/lock/state/model row passes in forgentX; mdview and mcp-skill-hub fail only `model-policy-tier-coverage` (xai has no `nano` cell), same as before landing.
8. Probes: `z-ai/openrouter` and `deepseek/openrouter` **healthy** (were `tier-cell-missing` on the old release with the committed `@openrouter` cells — the reason for this landing). All 7 accounts healthy.
9. Smokes in forgentX: a (claude read-only, herdr) pass; `fgos worktree create` 2 s, 106 `ak-*` skills copied; b and c (writing runs, same worktree) pass and commit; e (codex `openai/tetnu`) pass. d (Ctrl-C/resume) not rerun: controller-death code unchanged since its last pass on this machine.
10. Dormancy: git operations dir holds only `setup` and `worktree` entries.

## After landing (owner 15:0x–15:25)

- **thehive** added for the flash cells: pi store `~/.pi/accounts/thehive/` (`models.json` provider `thehive`, `auth.json` key owner-filled, mode 600), global `llmAccounts.thehive.thehive`, forgentX cells deepseek/z-ai nano+standard = `[thehive/… @thehive, … @openrouter]`, `models.json` added to the pi invocations' `credentialStore.files` (main `03fd437da`). The working endpoint is `https://api.thehive.ai/api/v3`; `api-cdn.thehive.ai` answers 401 to every key. Real runs: glm → `zai-org/glm-5.3-flash` and deepseek → `deepseek-ai/deepseek-v4.1-flash-1017` via pool `thehive`, both pass.
- Secret variable renamed `GLM_OPENROUTER_API_KEY` → `OPENROUTER_API_KEY` (value hash equal) and `${…}` references in three configs; `.fgos/secrets.local.env` set to 600.

## Findings

1. **Provisioned worktrees cannot be removed by `fgos worktree remove`.** The port refuses `worktree-ignored-bytes-preserved` because provisioning (dependencies, copied `ak-*` skills) leaves ignored bytes. COOK P4 provisioning and the Git port's preservation rule now collide on every `fgos worktree create`d checkout. The smoke worktree was removed with `git worktree remove --force` (throwaway branch). Needs a fix owned by COOK with lane GIT: Execution records what it provisioned so remove can treat exactly that as disposable, or remove accepts a provisioned-content manifest.
2. **Guide smoke b must write a non-root path:** the root-file allowlist hook also applies in linked worktrees (`smoke-r4.txt` at the root was refused; `test/fixtures/…` committed).
3. **Guide smoke e must ask for a real report:** a one-word "OK" report is not substantive (`isSubstantiveReportText`), so the run is `inconclusive` by design.
4. **The OpenRouter key was printed in this session's transcript** (`access` field of the pi store's `auth.json`, missed by a key/token filter). Owner advised to rotate it in both places (`~/.pi/accounts/openrouter/auth.json`, `.fgos/secrets.local.env`).

## Next

- Fix finding 1 (COOK × GIT).
- Owner: reinstall ak for codex, omp, pi, grok in forgentX (the prune fix is now active); rotate the OpenRouter key.
