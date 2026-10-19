# Phase lead report: model pool B2, credential store confinement

Plan: `plans/261019-0019-model-pool-b2-credential-store-confinement/`, phases 00-05. Phase 06 is not done (it waits for the release that reads `credentialStore` to be active).
Branch: `worktree-agent-ada45a3be0947e970`, base `d70585fdb`.

## Commits

| sha | subject |
|---|---|
| d2b08e011 | feat(runner): invocations declare the login store they read |
| d5e1cb8fe | feat(runner): bwrap hands over the login files the invocation's store names |
| a71501f7a | feat(doctor): confined-pane-accounts covers every invocation that reads a login store |
| bfc6367f6 | feat(runner): account probe and dispatch explain read the declared login store |
| 4f6fc44d7 | chore(config): confined invocations declare the login store they read |
| dcb0e9d7c | docs(spec): confinement request carries the login store the invocation reads |
| 38bd4b6f6 | docs(spec): an invocation declares the login store it reads |
| ae9e260ec | docs: changelog entry for the declared login store |
| 699009f2b | docs: use the invocation ids that no longer carry an account name |
| 31418c6a8 | test(runner): the committed gemini invocations are named without an account |
| 387f18b12 | docs(spec): gloss the second citation of the login store rule |

Phases 01 and 02 are split so each commit is green: the first commit already replaces the generic binding loop in the driver by `env[homeEnv]` (the driver cannot read the removed field), the second adds the copy rules. Reverting 02 alone is fine; reverting 01 needs 02 reverted too, as the plan said.

## Phase 00 results (no code)

- **Impact:** GitNexus index is stale (`b334695`) and returned "not found" for every target; blast radius taken from `rg` on `src/` (consumers listed in the plan Facts table were all found, plus `authority.mjs` `resourceBindingsList`, which is the attestation's own list built from plan resources, not from the invocation). `detect_changes` at the end (compare vs base) reports the expected flows only: ExecuteAssignment, InspectDispatchUseCase, ExecuteExecutorCli; line-mapped symbol list is noisy because of the stale index.
- **Baseline tests:** `npm test` on the base in this worktree under load (other lanes running): 213 failing tests in 34 files, almost all in `test/rust-host/*` and timeouts (9 files killed at 600 s); `test/runner/provider-capacity.test.mjs` failed in the suite and passed alone (36/36). Saved the failing-file list; after the native addon was built (`cargo build --release --workspace`) and the machine was quiet the same suite is green apart from the known ones (below).
- **Baseline bind:** `fgos dispatch explain --for <cap> --json` saved for all 38 capabilities (`explain-baseline`, scratchpad).
- **Step 4, pi reads the key from the store:** PASS. A copy of `~/.pi/accounts/openrouter/{auth.json,settings.json,models-store.json}` in a temp dir, `OPENROUTER_API_KEY` and `GLM_OPENROUTER_API_KEY` unset, `pi --model deepseek/deepseek-v4-flash -p ...` exit 0 and answered `ok`. The key is under `auth.json` -> `openrouter` (`type, access, refresh, expires`). Temp dir removed. No fallback needed, open question 1 of the plan does not arise.
- **Step 5, unconfined invocations without callers:** `codex-cli-bypass-fgovn`, `pi-cli-tetnu|fgovn|tetcu72`, `pi-cli-openrouter` (glm, deepseek), `omp-cli-vantt` have no caller in `core/`, `docs/`, `domains/`, `src/`, workflows or any capability `prefer` pin; only tests read them as fixtures (`provider-adapter`, `dispatch`, baseline snapshot). Removed in phase 04; the tests were moved to the confined invocations or to an inline template (the codex bypass-flag template stays covered inline).
- **Step 6, release before B2 ignores the new key:** `fgos dispatch decide` through the active release on a config copy with `credentialStore` on `codex-cli-bwrap` gave an identical `data_hash` to the control. The config door never closed invocation keys (`validateInvocationShape` has no allow-list). Later, a real round through the active release on the final config also passed (below).
- **Step 7, contract readers:** nothing outside the repo reads `request.invocation.resourceBindings`; only `bwrap.mjs` read it. `confinement-request.v1` kept its name.

## Phase results

- **01** (`provider-capacity.mjs`, `config.mjs`, `request.mjs`, `resolve.mjs`, `transport.mjs`, `cli.mjs`, `assignment-runner.mjs`): `credentialStoreOf` (declared, else inferred from a `private-home` env binding, else null), `credentialStoreProblem` (one reading of the shape for the config door and the request door), `providerCapacityForInvocation` replaces `providerCapacityForCommand` (an invocation that reads no store gets `credentialSource: null`). Config door refuses a store on an invocation with no confinement backend (invocation or executor level) and malformed stores. `launchCandidateClis` and the trust seed key by `use`. New `test/runner/credential-store.test.mjs` (6 tests).
- **02** (`drivers/bwrap.mjs`, `provider-credential-renewal.mjs`): `env[homeEnv]` = private home (wins over an `env` value naming the real store); copy list = `credentialStore.files` ?? account list ?? `auth.json`; present files copied, absent skipped (`ENOENT` only; dangling link, link out, non-file, `..` still refuse), none present -> `credential-provisioning` with `credential-store-empty`; no store -> nothing copied; `assessBwrap` refuses a policy without a `private-home` grant when the invocation reads a store (reused code `confinement-grant-invalid`). `copyCredentialFiles` gained `skipMissing` and returns the copied list; renewal still uses the strict mode. The `argument` binding kind is gone.
- **03** (`provider-account-probe.mjs`, `registrations.mjs`, `explain.mjs`): probe `via: lease` by store key; doctor `confined-pane-accounts` (same id) covers every invocation with a store, passes with absent files noted, fails when none present; `dispatch explain` returns `credentialStore` with `source: declared|inferred`.
- **04** (`.fgos/config.json`): see Decisions. 26 pins repointed (21 glm, 3 gemini, 2 openai). Explain compare: 38 of 38 identical to baseline after mapping the three renamed ids (`omp-herdr-vantt`/`omp-gemini-tetcu72` -> `omp-herdr`, `codex-herdr-fgovn` -> `codex-herdr`); the binding family, executor, model and transport are unchanged.
- **05**: `confinement-authority.md` (request type, section 8.5, 6.5 text, 13.1 formula and history, 14 pointers), `runner.md` (new RUL105, RUL80 pointers), CHANGELOG, two docs that named old ids.

## Test counts

- Test files importing a touched module or reading the committed config (142 files): 3291 tests, 3270 pass, 0 fail.
- Doc and architecture guards (9 files incl. `test/architecture.test.mjs`): 294/294.
- Full `npm test` after phase 05 (before the last two fix commits): 8219 tests, 8116 pass, 8 fail. Failures and proof:
  - `test/git/native-load.test.mjs` x3 and `test/holder-lock/fences-v1-tombstone.test.mjs`: the known pre-existing ones.
  - `test/setup/skill-wrappers.test.mjs`: needs `.claude/skills/instruction-audit/SKILL.md`, a generated render that is not tracked at the base (`git ls-tree d70585fdb -- .claude/skills/instruction-audit` is empty); it was already in the baseline failure list.
  - `test/run-supervisor/crash-matrix-adopt-resume.test.mjs`: in the baseline failure list (load); passes alone.
  - `test/runner/dispatch.test.mjs` (committed gemini ids) and `test/scripts/check-decision-citation-drift.test.mjs` (RUL105 cited without gloss in RUL80): mine, fixed in `31418c6a8` and `387f18b12`; both pass in the rerun.
  Note `committedRunnerConfig()` in `dispatch.test.mjs` reads the committed HEAD config, so tests of that kind only turn red after the config commit.
- Last run of the 142-file set after those two fixes: 3270 pass, 0 fail.
- `fgos doctor --dir <worktree>`: `confined-pane-accounts` passes on the committed config; the other failing checks (stale config, git driver `untrusted-driver-directory`, root drift, legacy attempts, hooks not wired in a worktree, trust of `~/.codex-fgovn`, ...) are environmental and also red on the base config.

## Real rounds (Linux, bwrap, `fgos:dev run ... --dir <worktree>`, prompt "Reply with the single word ok.")

| run id | invocation | transport | account | result |
|---|---|---|---|---|
| unit-run-1792348175223-4065effb | deepseek `pi-cli-bwrap` (no key variable in env) | cli | openrouter | pass, exit 0 |
| unit-run-1792348197325-f6c86455 | xai `omp-cli-bwrap` | cli | vantt | pass, exit 0 |
| unit-run-1792348231385-c2e7450d | xai `omp-herdr` (pane, closed afterwards) | herdr | vantt | pass, exit 0 |
| unit-run-1792348106118-d5ff76e3 | openai `codex-cli-bwrap` | cli | tetnu (pinned, not `fgovn`) | exit 0, answered `ok`, `credentialProvisioned: true`, verdict `inconclusive` |
| unit-run-1792348293293-7ac3e6e1 | deepseek `pi-cli-bwrap`, through the active release (before B2) on the new config | cli | openrouter | pass |
| unit-run-1792347998264-e9c02706 | openai `codex-herdr-fgovn` on main's old-format config, working-tree code (older field inferred) | herdr | tetnu | pass |

The codex cli round: `outcome: execution-failure` with a completed process and the answer in stdout, because the agent wrote no result claim in a read-only cli run. The same round through the active release on main's config (`unit-run-1792348130863-4f194a8b`) gives the identical classification, so it is not from B2; the proof it asserts is that the confined `CODEX_HOME` carried a working login. I did not get a `pass` for codex on cli; the plan wanted `completed-pass`.

Private home contents were checked on the real stores without a model call (`home-listing.mjs`, names only): codex `auth.json`; pi (openai tetnu, deepseek openrouter) `auth.json, bin/fd, models-store.json, settings.json, trust.json`; omp gemini `agent.db, config.yml`; omp xai `agent.db, config.yml, models.db`; each `env[homeEnv]` pointed at the private home; nothing else was copied; the temp dirs were removed.

Panes: none left open by my runs (checked `herdr pane list`).

## Decisions made inside the plan

1. The invocation lists in the real config are arrays with `id`; ids that stay: `codex-cli-bwrap`, `claude-*`. Renamed: `pi-cli-bwrap-openrouter` -> `pi-cli-bwrap` (glm, deepseek), `pi-herdr-openrouter` -> `pi-herdr`, `codex-herdr-fgovn` -> `codex-herdr`, `omp-gemini-tetcu72` and `omp-herdr-vantt` -> `omp-herdr`, `omp-cli-bwrap-gemini-tetcu72` and `omp-cli-bwrap-vantt` -> `omp-cli-bwrap`. `pi-cli-bwrap-{tetnu,fgovn,tetcu72}` collapsed into `pi-cli-bwrap` (tetnu's `env.PI_CODING_AGENT_DIR` kept; the private home overrides it).
2. The resolved command (`resolveExecutorCommand`) no longer carries `resourceBindings`; it carries `credentialStore`. The remaining `resourceBindings` readers in `src/`: `credentialStoreOf` and the two inputs `resolve.mjs` passes into it. Doctor and probe read through `credentialStoreOf`.
3. Baseline snapshot test: rows for `codex-cli` and `codex-pi` are gone (their invocations were removed), `pi` points at `pi-cli-bwrap`, rows regenerated from the committed config by script, fact (e) rewritten to `credentialStore`. `glm` unpinned now resolves to the confined `pi-cli-bwrap` (the unconfined one was its first cli invocation); explain shows no binding change because `bind()` already took the confined one.
4. Trust seeding: an invocation that reads no store now seeds no account trust (it used to derive a store from the command basename); no committed invocation is in that case.
5. The provider-adapter test for glm now asserts the committed invocation carries no key variable and checks env substitution with an inline variable.

No component-boundary change (the driver still does not branch on provider; only the field it reads changed).

## Open questions / not done

- Phase 06 (remove `resourceBindings` and `env[homeEnv]` from the committed config) waits for the activation of a release that has this code; until then a release before B2 runs the config as it is (verified with the active release).
- `~/.fgos/config.json` and other projects' configs still use `resourceBindings`; the inference in `credentialStoreOf` stays until they move (plan: part C).
- The lease still picks an account before the invocation is known, so an account with no file of the store fails late (`credential-store-empty`); filtering by store key before the lease is B1.
- `fgovn` still has no folder trust for forgentX (TRUST lane); `codex-cli-bwrap` leases among tetcu72, fgovn, tetnu, and I pinned `tetnu` for my rounds.
- Codex cli read-only rounds classify `inconclusive` (no claim written), on the old release too; not investigated.

## Feature ideas (not built)

- Surface the copied file list in the attestation or the unit run record (names only). Reason: after a run the private home is gone, so "which files did this launch get" can only be re-derived; today I had to reproduce it in a script. Benefit: a failing login is diagnosable from the run directory.
- `fgos doctor` could say which accounts would be refused for a store key before B1 filters the lease. Reason: a late `credential-store-empty` on an unlucky lease. Benefit: the problem shows before a run.

Status: DONE_WITH_CONCERNS

## Phase 06 (2026-10-19, after the B2 release went active at 10:26)

- `.fgos/config.json`: removed `resourceBindings` (10 invocations) and `env[homeEnv]` (9 entries; an `env` left empty was dropped) from every invocation that declares `credentialStore`. Other env variables (`PI_CONFIG_DIR`, ...) stay. 109 lines removed, no other change. `~/.fgos/config.json`, other projects, credentials and trust stores untouched; the old-field read path in code is untouched.
- Tests: `bind-committed-config.test.mjs` now asserts that no invocation with a store keeps `resourceBindings` or an `env` entry for its `homeEnv`, and that none keeps a binding without a store. Two other tests followed the config: `dispatch-policy-baseline-snapshot.test.mjs` (15 rows lose the home variable from `envKeys`) and `herdr-claude-invocations.test.mjs` (`inv.env` may be absent).
- Explain before/after for `execute`, `architecture:explain`, `business:frame`, `judge`: identical except `generated_at`.
- Tests: the 29 files that read the committed config or import touched modules: 1386 tests, 1384 pass, 0 fail (2 skipped). Wider run (`test/runner`, `test/setup`, `test/scripts`, `test/cli`, 427 files): 5390 tests, 5321 pass, 3 skipped, 1 fail: `test/setup/skill-wrappers.test.mjs`, the untracked `.claude/skills/instruction-audit` render, a known baseline failure.
- Real confined round: `fgos run ... --provider deepseek` -> `pi-herdr` (herdr, bwrap, openrouter store, no key variable in env): `completed-pass`, exit 0, run `unit-run-1792381166287-bfe5688f`. Pane closed.
- For the program board / MP-C: still on the old fields are `~/.fgos/config.json` (13 `resourceBindings`), mdview and mcp-skill-hub configs (24 each), and the inference branch in `credentialStoreOf`.
