---
phase: 5
title: "One account inventory shape (runner.llmAccounts)"
status: applied on design-lap 2026-11-17 (empty legacy shells remain, see door finding)
priority: P2
effort: 3h
depends_on: [P3, D3, P4 step 3 (agy files known)]
touches: ~/.fgos/private/accounts.yaml through the config door; global agy invocation files; owner approval
---

# Phase 5: One account inventory shape

## Context

Today the accounts file holds three shapes (key structure in [inventory.md](inventory.md)):
`runner.providers.<p>.accounts.<a>.credentialSources.<cli>` (openai, gemini, claude),
`runner.providers.<p>.accounts.<a>.credentialSource` (xai, z-ai, deepseek), and
`runner.llmAccounts.<pool>.<a>.credentialStore.<cli>` (openrouter, thehive). The lease reads a pool
from `llmAccounts` when declared, and from `runner.providers` otherwise
(`provider-capacity.mjs:284-296`, RUL102/RUL106). `deriveLegacyInventory`
(`llm-accounts.mjs:235-262`) turns `llmAccounts` into the per-CLI shape the lease uses. A `codex`
store becomes `codex-home`. Any other store becomes `home-files`, with the files that the
invocations of that store declare (`declaredStoreFiles`, `llm-accounts.mjs:205-224`). A store with
no declared files is left out of the account (`unusableFor`). The state key is preserved
(`legacyStateKey`, `openai` to `openai-codex`), so lease and quarantine state carry over.

All three activations (2026-10-25 and later) read `llmAccounts` (`bc57e8550`, 2026-10-19).

## Requirements

- Every pool and account lives in `runner.llmAccounts` with the same declared order (lease order,
  RUL106). Gemini is two pools after P8: `gemini` (tetcu72, tetnu) and a second pool for mucdong.
- Every non-codex store used by an account has `files` declared on at least one invocation of that
  store (agy is the gap today: the global `agy-*` forms declare no `files`).
- Values (login directories) are never printed. The transform runs as a script that writes a patch
  file in `.fgos/runtime/tmp/` (mode 0600, deleted afterwards). Reports print paths and counts only.

## Steps

1. **Dead pools check (U3).** Run `fgos dispatch explain --for business:perspectives` and one
   deepseek-first capability. If the walk never names pool `z-ai` or `deepseek` (every cell carries
   `@thehive` or `@openrouter`), then `runner.providers.z-ai` and `.deepseek` are dead, and they are
   deleted rather than moved. If either is named, move it as pool `z-ai` / `deepseek` with account `openrouter`.
2. **agy files.** Add `files` to the global `agy-cli-bwrap` and `agy-herdr*` `credentialStore`, using
   the names from the gemini accounts' `credentialSources.agy.files` (read names only with a script
   that prints array items that are relative file names). The same list goes into the standard in P4.
   Back up first, then `fgos config set --global runner.executors.gemini.invocations '<flow>' --reason "agy store declares its login files so an llmAccounts account can be provisioned"`.
3. **Compare stores.** For each legacy account, compare the per-account `files` list with the files
   the invocations declare for that store (names only). Where the account list has a name that no
   invocation declares, add it to the invocation `files`. Otherwise that file stops being copied
   after the move. Doctor `llm-accounts-vs-legacy` (registrations.mjs:1093) already reports
   differences once both are declared. Use it after step 4.
4. **Write `llmAccounts`.** Back up `~/.fgos/private/accounts.yaml` to
   `~/.fgos/private/config-backup-<YYMMDD-HHMM>-llm-accounts/`. Generate one patch with `set`
   items, one per pool: `runner.llmAccounts.<pool>` = `{<account>: {credentialStore: {<cli>: <home>},
   label?, disabled?}}`, in declared order. Use pools openai (fgovn, tetnu), gemini (tetcu72, tetnu) plus the mucdong pool from P8, xai
   (vantt: `{omp: <home>}`), claude (main), and z-ai/deepseek only if step 1 says live. Apply with
   `fgos config patch <file> --reason "accounts move to the one llmAccounts shape; runner.providers retires"`.
   The door routes the keys to the accounts file.
5. **Check (no quota):** doctor `llm-accounts-shape` passes, `llm-accounts-vs-legacy` shows no
   difference, `confined-pane-accounts` passes, and `fgos dispatch explain --for <cap>` shows the same
   accounts in the same order per pool. Do this in all three workspaces with `--dir`.
6. **Remove the legacy shape:** `fgos config unset runner.providers --reason "every pool is declared in runner.llmAccounts" --acknowledge-comment-loss`.
   This only touches the accounts file, and the `runner.providers.<p>: {}` stubs in
   `~/.fgos/config.yaml` go the same way (`--global`). Repeat step 5.
7. **Owner-gated probes (quota):** `fgos dispatch probe-account --all --leg harness`. Expected:
   every generic row `ok` for every enabled account, the same verdicts as after P3.

## Validation

`fgos config show --path runner.providers` is empty, and doctor plus probes pass.

## Risk

| Risk | L x I | Mitigation |
|------|-------|------------|
| A login file silently stops being copied | M x H | step 3 comparison; the copy rule refuses an empty store loudly (`credential-store-empty`) |
| Lease state lost through a key change | L x M | state key is unchanged by `legacyStateKey`; explain shows quarantines before and after |
| Values leak into logs | L x H | script prints names and counts only; patch file 0600 under `.fgos/runtime/tmp/`, deleted |

## Rollback

Restore the accounts backup through the door (`fgos config set runner.providers '<flow>'`), or by
file copy with the owner present. `llmAccounts` entries can stay, because the lease prefers them per pool.

## Applied (design-lap machine, 2026-11-17, owner-approved)

Backup: `~/.fgos/private/config-backup-261117-p5/` (accounts file and global config before P5).

- Steps 1 to 5 and 7 done. The agy `files` (step 2) were already added in P8. The names comparison (step 3)
  found no file that an account lists and no invocation declares, for agy, omp, pi and claude (codex needs none).
- `runner.llmAccounts` now holds pools `openai` (fgovn, tetnu, each with a codex and a pi store), `xai` (vantt),
  `claude` (main), `gemini` (tetcu72, tetnu) and, from P8, `gemini-lite` (mucdong), besides the existing
  `openrouter` and `thehive`: 9 accounts in 7 pools. Order and the lease state keys are unchanged.
- Doctor: `llm-accounts-shape` ok, `confined-pane-accounts` ok, `model-policy-pools` ok. `llm-accounts-vs-legacy`
  differs only for pools that exist in one place: `z-ai/openrouter` and `deepseek/openrouter` (only in
  `runner.providers`; no tier cell names those pools, so they are dead) and the pools that exist only in
  `llmAccounts`.
- `fgos dispatch explain`: every pool reports source `llmAccounts`.
- Harness probes after the move, all `healthy`: openai/fgovn and openai/tetnu (codex cli, codex herdr, pi cli,
  pi herdr, all `ok`), xai/vantt (omp cli, omp herdr), gemini/tetcu72 and gemini/tetnu (`agy-cli-bwrap`).
  claude/main was not probed (headless claude stops at the trust prompt).

**Step 6 applied (design-lap, 2026-11-17 23:3x).** The earlier claim here that `probe-account` reads only
`runner.providers` was wrong: it reads both blocks through `providerAccountInventory` (HARDEN guide
`plans/261115-2328-execution-read-door/reports/guide-261117-2230-design-lap-llm-accounts-move.md`, fact 2).
Done: pools `z-ai` and `deepseek` added to `runner.llmAccounts` (copies of the `openrouter` account, the pools
an unbound glm or deepseek seat leases from); every legacy account removed one by one with
`fgos config unset runner.providers.<p>.accounts.<a> --global`. Proof after: `fgos config check` 0 fails;
doctor `llm-accounts-shape` ok (12 accounts, 9 pools); harness probes healthy for openai/fgovn, openai/tetnu,
xai/vantt; real `fgos run` ok for deepseek (48 s) and gemini/tetnu (87 s) and gemini/tetcu72 (417 s, slow, correct).
The doctor row `agy-sub-homes-configured` now says "nothing to check" (the coverage gap the guide predicted;
phase 16 must move `src/setup/agy-permissions.mjs:160` to `llmAccounts`).

**Door finding.** `unset runner.providers --global` edits only `config.yaml` and removes the empty
`runner.providers.<p>` entries there; the accounts file then refuses every write (`config-key-in-wrong-file`).
Do not run it first: remove the accounts through the per-account path, and the empty `accounts: {}` shells in the
accounts file cannot be removed through the door (they stay, harmless, with their empty entries in `config.yaml`).
A hand edit of the private file, or a door fix, is left to the owner and the S5 reader deletion.

Rollback: restore the accounts file from the backup through the door, or by file copy with the owner present.
