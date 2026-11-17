# Account and invocation config of design-lap, as the target for other machines

From session `forgentx-46` (design-lap), 2026-11-17. For the owner's other machines: fg-server (RULE) and fg-server2 (HARDEN). Nothing here is a secret: no login directory, no file content, no key. Each machine keeps its own logins and its own directory names.

## 1. What design-lap looks like now

Global config (`~/.fgos/config.yaml`) and accounts file (`~/.fgos/private/accounts.yaml`), written only through `fgos config ... --global --reason`, with a backup first.

- Every agent executor lists only generic invocations, named `<cli>-<transport>[-bwrap]`. No account name in an id, no `bypass`, no `resourceBindings`, no env variable that pins an account. The account comes from the lease.
- Every login store is declared by `credentialStore {use, homeEnv, files}` on the invocation. A store that is not codex needs `files` on at least one invocation of that store, because an account in `runner.llmAccounts` records only a directory.
- Every account is declared in `runner.llmAccounts.<pool>.<account>.credentialStore.<cli>: <login directory>`, in lease order.
- Pools: `openai` (fgovn, tetnu), `xai` (vantt), `claude` (main), `gemini` (tetcu72, tetnu), `gemini-lite` (mucdong), `openrouter`, `thehive`. The codex account `tetcu72` is kept in the `openai` pool with `disabled: true` (owner 2026-11-17: if the subscription is paid again, removing that key enables it). On a machine that has it, set `disabled: true`, never delete its login; on a machine that never had it, do not add it. The pool is `tetcu72 (disabled), fgovn, tetnu`.
- Gemini cap: mucdong cannot run Gemini 4 Argon, so it sits in its own pool `gemini-lite`, and `runner.modelPolicies.gemini` names that pool only at nano, mini, standard and advanced (`<model>` for pool `gemini`, then `<model>@gemini-lite`). Flagship and frontier use the standard cell and name only pool `gemini`. This is the same mechanism deepseek uses with the `thehive` pool.
- `runner.providers.*` still exists on design-lap as a legacy copy. Keep it: `fgos dispatch probe-account` reads accounts only from it until S5 changes that.

## 2. Generic invocation lists (design-lap, before the D-ADR0077 rename)

These are the lists to write per executor (`runner.executors.<id>.invocations`). A global list REPLACES the standard list whole, so write the complete list. Replace each `env` value with the relative directory name of this machine's own profile. After D-ADR0077 lands in your release, the four `-herdr` ids carry `-bwrap` (`codex-herdr-bwrap`, `pi-herdr-bwrap`, `omp-herdr-bwrap`, `agy-herdr-bwrap`).

```yaml
openai:
- id: codex-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: codex
  credentialStore:
    use: codex
    homeEnv: CODEX_HOME
  args:
  - exec
  - --skip-git-repo-check
  - -s
  - danger-full-access
  - --model
  - '{model}'
  - '{prompt}'
  confinement:
    backend: bwrap
- id: codex-herdr
  via: cli
  adapter: herdr-spawn
  confinement:
    backend: bwrap
  command: codex
  credentialStore:
    use: codex
    homeEnv: CODEX_HOME
  args:
  - -s
  - danger-full-access
  - -a
  - never
  - --no-daemon
  - --model
  - '{model}'
  interactiveMode:
    exitCommand: /quit
    kind: codex
    trustStore:
      kind: codex-toml
- id: pi-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: pi
  credentialStore:
    use: pi
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - auth.json
    - models-store.json
    - settings.json
    - trust.json
    - bin/fd
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,find,ls
  - --mode
  - json
  - --approve
  - -p
  - '{prompt}'
  confinement:
    backend: bwrap
- id: pi-herdr
  via: cli
  adapter: herdr-spawn
  confinement:
    backend: bwrap
  command: pi
  credentialStore:
    use: pi
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - auth.json
    - models-store.json
    - settings.json
    - trust.json
    - bin/fd
    - models.json
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,find,ls
  - --approve
  interactiveMode:
    exitCommand: /quit
    kind: pi
xai:
- id: omp-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: omp
  credentialStore:
    use: omp
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - agent.db
    - config.yml
    - models.db
  env:
    PI_CONFIG_DIR: <machine-specific relative dir name>
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,glob
  - --mode
  - json
  - --auto-approve
  - -p
  - '{prompt}'
  confinement:
    backend: bwrap
- id: omp-herdr
  via: cli
  adapter: herdr-spawn
  confinement:
    backend: bwrap
  command: omp
  credentialStore:
    use: omp
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - agent.db
    - config.yml
    - models.db
  env:
    PI_CONFIG_DIR: <machine-specific relative dir name>
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,glob
  - --auto-approve
  interactiveMode:
    exitCommand: /exit
    kind: omp
deepseek:
- id: pi-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: pi
  credentialStore:
    use: pi
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - auth.json
    - models-store.json
    - settings.json
    - trust.json
    - bin/fd
    - models.json
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,find,ls
  - --mode
  - json
  - --approve
  - -p
  - '{prompt}'
  confinement:
    backend: bwrap
- id: pi-herdr
  via: cli
  adapter: herdr-spawn
  confinement:
    backend: bwrap
  command: pi
  credentialStore:
    use: pi
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - auth.json
    - models-store.json
    - settings.json
    - trust.json
    - bin/fd
    - models.json
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,find,ls
  - --approve
  interactiveMode:
    exitCommand: /quit
    kind: pi
glm:
- id: pi-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: pi
  credentialStore:
    use: pi
    homeEnv: PI_CODING_AGENT_DIR
    files:
    - auth.json
    - models-store.json
    - settings.json
    - trust.json
    - bin/fd
    - models.json
  args:
  - --model
  - '{model}'
  - --thinking
  - medium
  - --tools
  - read,write,edit,bash,grep,find,ls
  - --mode
  - json
  - --approve
  - -p
  - '{prompt}'
  confinement:
    backend: bwrap
gemini:
- id: agy-cli-bwrap
  via: cli
  adapter: cli-spawn
  command: agy
  credentialStore:
    use: agy
    homeEnv: HOME
    files:
    - .gemini/antigravity-cli/antigravity-oauth-token
    - .gemini/antigravity-cli/settings.json
    - .gemini/antigravity-cli/installation_id
    - .gemini/antigravity-cli/jetski_state.pbtxt
    - .gemini/antigravity-cli/cache/onboarding.json
  args:
  - -p
  - '{prompt}'
  - --model
  - '{model}'
  confinement:
    backend: bwrap
```

Claude has no global invocation list: it uses the standard (so `credentialStore` and `sessionDir` are kept). Do not write one.

### Gemini herdr invocation (restore once your release carries commit dd26e81dd)

design-lap runs gemini through `agy-cli-bwrap` only, because the herdr form failed on long briefs until `dd26e81dd` (agy brief through the prompt door). Add this entry after `agy-cli-bwrap` once your release carries that commit, and give it the same `credentialStore.files` as `agy-cli-bwrap`:

```yaml
- id: agy-herdr
  via: cli
  adapter: herdr-spawn
  confinement:
    backend: bwrap
  command: agy
  credentialStore:
    use: agy
    homeEnv: HOME
  args:
  - --mode
  - accept-edits
  - --new-project
  - --model
  - '{model}'
  interactiveMode:
    exitCommand: /exit
    kind: agy
    trustStore:
      kind: agy
```

## 3. Steps for each machine

1. Read first, write nothing: `fgos config check`, `fgos doctor`, and `fgos dispatch explain --for review` and `--for code:review`. Keep the output.
2. Back up `~/.fgos/config.yaml` and `~/.fgos/private/accounts.yaml` to a new `~/.fgos/private/config-backup-<date>-<what>/` (mode 700, files 600).
3. Invocations, one executor at a time (openai, xai, deepseek, glm, gemini): build the list from section 2, keeping only the accounts and CLIs that machine really has. Write it with `fgos config patch <file> --global --reason "<why>"`. After each executor: `fgos config check` shows no `config-unknown-key`, and `explain` shows only generic ids.
4. Accounts: for each account the machine has a login for, add `runner.llmAccounts.<pool>.<account> = {credentialStore: {<cli>: <login directory>}, label?, disabled?}`. The machine needs a pool for claude first if it has none. `fgos config migrate --global` does NOT move accounts and has no `--reason`; the move is a patch of `~/.fgos/private/accounts.yaml` through the door. Do not remove `runner.providers`.
5. Gemini cap, only if the machine has an account whose plan lacks Gemini 4 Argon: give it its own pool and set the four low-tier gemini cells as in section 1.
6. Check, no quota: doctor `llm-accounts-shape`, `confined-pane-accounts`, `model-policy-pools` are ok; `explain` shows source `llmAccounts` for every pool and the same account order.
7. Owner-gated, quota: `fgos dispatch probe-account --provider <p> --account <a> --leg harness`, one account at a time. Expected: every row `ok`. Headless claude stops at the trust prompt (`needs-human`), so skip claude's harness leg. The probe asks the model of the first tier-cell entry, so an account of another pool can show `other` with "Model not found": that is a probe limit, not a config fault.
8. Post one board line: `machine <X> on llmAccounts`, with the evidence (doctor rows, probe verdicts) and any deviation from this report.

## 4. Traps

- A global `executors.<id>.invocations` replaces the standard list whole (backlog `p-lndtbwbjjl`): copy the whole list, or leave the key unset.
- `fgos config unset` and a whole-sequence write can refuse for comment loss; `--acknowledge-comment-loss` is for removing an entry whose comments only annotated it.
- The YAML door cannot insert into a sequence, only replace it. A legacy `resourceBindings` key is rejected on rewrite: rebuild the list without it.
- A new config key in the global file waits until every activated release on the machine knows it. This report adds none.
- Never print login directories, file contents or keys. Report counts and names only.

## 5. Rollback

Per executor: `fgos config set --global runner.executors.<id>.invocations '<old list from the backup>'`. For accounts: restore the accounts file from the backup through the door, or by file copy with the owner present. `llmAccounts` entries may stay, the lease prefers them per pool.
