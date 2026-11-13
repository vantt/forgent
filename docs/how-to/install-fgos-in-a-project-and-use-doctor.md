---
type: how-to
title: How to install fgOS in a project and use fgos doctor
tags: [install, fgctl, doctor, setup, trust, workflow]
timestamp: 2026-10-05T00:00:00.000Z
source_capture_ids: []
---
# How to install fgOS in a project and use fgos doctor

Use this when you own a project (not the fgOS repo) and want fgOS to run in it:
install the tooling, bring the project to a healthy state, and know what you
must still do by hand before the first Workflow run. It covers `fgctl`,
`fgos doctor`, `fgos doctor --fix`, the legacy `fgos setup`, every doctor check,
and how to read a run that stops or fails.

## 1. The two layers and who owns what

fgOS is installed in two layers. Do not mix them up.

| Layer | What it is | Where it lives | Who changes it |
|---|---|---|---|
| Machine | `fgctl` (the bootstrap binary) and a release store of staged fgOS releases | `~/.local/bin/fgctl`, `${FGOS_STATE_HOME:-${XDG_STATE_HOME:-$HOME/.local/state}/fgos}/` | `install.sh`, `fgctl stage` |
| Project | The release this project is pinned to, as a workspace activation plus a stable `fgos` shim | `<project>/.fgos/installation/` (`bin/fgos`, `bin/fgos-runner`, `activation.json`) | `fgctl init`, `fgctl upgrade`, `fgctl repair` |

Rule of thumb from the architecture doc: `fgctl` selects and repairs the
runtime; the project-local `fgos` runs project workflow semantics under the
selected runtime. `fgos doctor --fix` repairs readiness under the active
runtime and is never a hidden upgrade. See
[fgctl and local fgOS](../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).

A third context exists for contributors only: sourcing
`scripts/fgos-shell-integration.sh` from a checkout of the fgOS repo. A project
owner does not need it. Resolution order, when several are present, is
workspace installation, dev checkout, project-local install, global install.

For changes to fgOS itself, use `npm run fgos:dev -- <verb> [args]` in the
source checkout to run the Rust host with its working-tree Node payload.
The runtime keeps the invoking directory through npm's `INIT_CWD`; Cargo
builds from the script's checkout and respects relative or absolute
`CARGO_TARGET_DIR`. The fresh native executable and dev manifest are
materialized in an invocation-specific directory under `.fgos/runtime/dev-host/`,
with the existing manifest containment and symlink checks unchanged; that
invocation removes only its own artifacts after the child exits. Serialize
`fgos:dev` invocations across worktrees that share a Cargo target directory.

Plain `fgos` still runs the activated release, not files you just edited.
To update it, follow the [build, stage and upgrade procedure](measure-a-real-case.md#5-staging--verifying-the-host-runtime),
then run doctor through `.fgos/installation/bin/fgos`. From a linked worktree,
`fgctl init`/`upgrade` selects the main checkout through `git-common-dir`;
do not use that route to change another session's activation. An old release's
`fgos setup` can overwrite generated skill headers until the release is
restaged. `active-release-matches-checkout` compares only the Node payload
against doctor's source directory, not HEAD or Rust binary freshness.

Separately from both layers, the config has two levels: a project file
`<project>/.fgos/config.yaml` and a global file `~/.fgos/config.yaml`, over the
release's standard. The project file wins over the global one; `fgos config show`
prints the effective value with where each came from.

## 2. Order of operations for a new project

Run these from the project root (it must be a git repository; `fgctl init`
refuses outside one).

1. Install `fgctl` once per machine:

   ```bash
   curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh
   ```

   It downloads `fgctl-<version>-<target>.tar.gz` from the release, verifies it
   against `SHA256SUMS`, and puts `fgctl` in `~/.local/bin` (override with
   `FGCTL_INSTALL_DIR`). If `~/.local/bin` is not on `PATH` it tells you what to
   export. `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` are supported; on Windows use `install.ps1` from PowerShell instead (see the README Install section).

2. Activate fgOS in the project with `fgctl init`. Where the release comes
   from, first match wins: `--from <path|URL>`, then `FGCTL_FROM`, then
   `FGCTL_VERSION=<tag>`, then the release pinned by the project's committed
   `.fgos/distribution.json`, then the latest GitHub release. For a first
   install nothing needs downloading by hand:

   ```bash
   fgctl init                              # no pin: downloads the latest release
   FGCTL_VERSION=<tag> fgctl init           # an exact tag (pre-releases are never "latest")
   FGCTL_FROM=./fgos-<tag>-x86_64-unknown-linux-gnu.tar.gz fgctl init   # a non-release build
   ```

   A download goes through `curl` and is verified against the release's
   `SHA256SUMS`: a missing or mismatching entry stops the init before anything
   is staged. A URL given to `--from`/`FGCTL_FROM` must have a `SHA256SUMS` next
   to it; a local path is used as is. `FGCTL_ASSET_BASE_URL` points downloads at
   a mirror (the directory that holds the assets; `https://` or `file:///`, and
   `http://` only to a loopback host). A download records its tag in `.fgos/distribution.json`
   (`projectRuntime.releaseVersion`); a teammate's plain `fgctl init` on a
   machine without that release then downloads the same tag and refuses if its
   digest is not the pinned one. A pin without a tag (digest only) still needs
   one of the sources above on such a machine. The `curl-available` doctor check reports a missing `curl`.

   `fgctl init` stages the release into the machine store, writes
   `.fgos/installation/`, and then, using the new shim, runs this tail in order:

   ```text
   .fgos/installation/bin/fgos init
   .fgos/installation/bin/fgos doctor --fix
   .fgos/installation/bin/fgos doctor
   ```

   The tail writes the config defaults and wires the agent hooks (Claude Code,
   Codex, agy, OMP and Pi) through `fgos doctor --fix`; no separate setup step is
   needed. `fgctl init` then reads the last doctor report and ends with one of two
   blocks. When `ok` is true it prints `Ready: fgOS <tag> active (<digest12>)` and
   `Next: fgos run "<prompt>"`, and exits 0 (`nothing to do: fgOS <tag> already active, doctor ok` when the release was already active and the doctor is clean; a `Note:` line follows when `fgos init` moved a legacy config). Otherwise it prints `<N> checks need
   you:` and one numbered line per failing check, `<id>: <fix command>` (the check's
   message when only a person can fix it), and exits 2; the release stays activated
   and the install is recorded as `ready-degraded`. `fgctl init` has no `--yes`
   flag: it asks nothing. A tail command that itself fails exits 1.

3. Clear every check the closing block listed. To read the whole report
   (section 4 says which check is which):

   ```bash
   .fgos/installation/bin/fgos doctor --pretty
   ```

4. Do the owner steps in section 5 (trust in every agent CLI home, pools with
   enough provider families). No tool writes those for you.

Later, to move the project to a newer release:

```bash
fgctl upgrade
# or a specific tag / local archive:
FGCTL_VERSION=v0.2.0 fgctl upgrade
fgctl upgrade --from ./fgos-<new-version>-x86_64-unknown-linux-gnu.tar.gz
```

`fgctl upgrade` downloads and verifies the release when no `--from` is given, updates `.fgos/distribution.json` (recording the tag when downloaded), and records the previous release so `fgctl repair` can roll back.
Check what is active with `fgctl status` (`--json` for machines).

### 2.1. What each command does

| Command | Does | Writes? |
|---|---|---|
| `install.sh` | Installs the `fgctl` binary | `~/.local/bin/fgctl` |
| `fgctl stage --from <release>` | Puts a release into the machine store without activating it | machine store |
| `fgctl init [--from <release or URL>]` | Downloads the release when none is given or pinned, stages (if needed), activates in this project, runs the init/doctor tail | `.fgos/installation/`, machine store |
| `fgctl upgrade [--from <release or URL>]` | Downloads the latest or `FGCTL_VERSION` release when none is given, moves the project to it, updates `.fgos/distribution.json`, keeps the previous release, runs the tail | `.fgos/installation/`, `.fgos/distribution.json`, machine store |
| `fgctl repair` | Rolls back to the previous release if one is recorded, otherwise re-verifies and re-publishes the same one | `.fgos/installation/` |
| `fgctl verify` | Verifies the active release's files against its manifest and quarantines it on drift | quarantine on failure |
| `fgctl status` | Shows the active and previous release and staged releases | nothing |
| `fgos init` | Creates the `.fgos/` store (event log, empty view, coexistence manifest) | `.fgos/` |
| `fgos doctor` | Runs every check and reports | nothing |
| `fgos doctor --fix` | Runs every registered fix, then reports the checks again | the fixes listed in section 4 |
| `fgos doctor --strict` | Same report; exits 1 when any check fails (also with `--fix`) | nothing |
| `fgos setup` | Deprecated. Kept only for the legacy shell-integration line and global config defaults; `fgctl init` already writes the config defaults and wires the hooks | project and global config, rc files, hooks |
| `fgctl uninstall [--dry-run] [--yes] [--purge]` | Prints a plan, then removes fgOS's hook entries, generated skills, git hooks and `.fgos/installation/`; keeps config and data; `--purge` also removes the machine release store | the project, and the store with `--purge` |

If the shim says `no active runtime -- run fgctl init` or
`active runtime is not ready (...) -- run fgctl repair`, do what it says.

### 2.2. The legacy `fgos setup`

`fgos setup` is deprecated. `fgctl init` runs `fgos doctor --fix`, which writes the
config defaults and wires the hooks, so a project onboarded with `fgctl init` does
not need it.

`fgos setup` also converts a project config file that still holds the retired
collaboration keys (`runner.patterns.reviewed.maxRounds`,
`runner.patterns.reviewed.checkersByRigor`, `runner.patterns.defaultRule`,
`runner.patterns.research-fan-out-gated`) to the `runner.loops` layout with
`runner.patterns.seatBinding.schema: 2`, and keeps a copy of the old file next to
it. It never rewrites the global file: when the global file holds a retired key,
setup prints the `fgos config patch <patch-file> --global --reason ...` command to
run from a directory outside any fgOS project. The schema 2 marker exists so that
a release older than the conversion refuses the converted file instead of
misreading it.

## 3. Reading doctor output

```bash
fgos doctor --pretty    # one line per check, a tick or a cross
fgos doctor --json      # {"data": {"checks": [{id, description, passed, message}]}}
fgos doctor --fix --json   # adds data.fixed: [{id, changed, message}] and re-reports checks
```

- Plain `doctor` and `doctor --fix` both exit 0 whatever the checks say: the
  `fgctl init|upgrade|repair` tail runs them and treats a non-zero exit as a
  crash of the tail itself. Read `ok` (true only when no check fails) and `next`
  (the commands to run), or pass `--strict` (`fgos doctor --strict`,
  `fgos doctor --fix --strict`) to get exit 1 when any check fails, for scripts
  and CI. A check that reports `passed: true` with an "informational" note never
  trips `--strict`.
- A check that cannot be evaluated here (no runner config, not a fgOS checkout,
  nothing to check) reports `passed: true` with a "not applicable" or "nothing
  to check" message. A green line is not always a proof, read the message.
- `--fix` only runs the fixes that are registered (section 4). Anything else it
  leaves alone and the check stays red.
- `fgos doctor` resolves the project from where you run it (from a linked
  worktree it resolves the main checkout). Run it from inside the project.

## 4. Every doctor check

Who fixes it:

- **tool**: `fgos doctor --fix` repairs it.
- **setup**: only the legacy `fgos setup` repairs it (and `doctor --fix` does not).
- **you**: only the project owner can, by hand. fgOS never edits those files.
- **wire-agents**: your own agent config outside the project (the Claude config dir, `~/.gemini`). `fgos init`, `setup` and `doctor --fix` never write it. Run `fgos wire-agents` to see what it would change, then `fgos wire-agents --yes`: it acts only on agent CLIs on this machine and backs up each file first as `<file>.pre-wire-agents-<time>`. A setting that widens an agent's permissions it only shows; you decide and edit it yourself.
- **info**: informational, or only reports. No action required unless you care.

`fgos doctor --json` lists every row of the machine you run it on, with its id,
message and, where one exists, its fix; the tables below explain the rows a
project owner meets most. The registered checks come from
`src/setup/registrations.mjs` (`src/setup/checks.mjs` re-exports it). Some read-only checks list the failing
file or key in their message; the message always names the exact target.

### 4.1. Machine and installation

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `node-version-and-git` | Node 18 or newer and git on `PATH` | `node v16.x -- need >=18` | you | Install Node 18+ or git |
| `cli-version-visible` | `fgos version` resolves this build's version and verbs | `fgos version did not resolve a packageVersion...` | you | No fix is registered: repair the runtime (`fgctl repair`) or reinstall |
| `shell-integration-sourced` | The shell-integration `source` line is in your rc files and the `fgos` function really works | `not sourced in: ~/.zshrc -- run fgos setup`; `sourced correctly, but "fgos --help" fails after stripping ...` (shown as an informational, still passing, note when doctor runs inside an agent harness shell) | setup, you | `fgos setup` adds the line. Dead `source` lines it reports must be deleted by hand. Open a new shell. The "fails after stripping" form is a harness shell snapshot dropping a helper, not a project problem; run doctor from your own terminal to see the real verdict. Only relevant to dev checkouts |
| `bin-discovery-cache` | (fix only, no check) refreshes the cached global `fgos` path | none | tool | `fgos doctor --fix` |
| `rust-host-binary-present` | The active release's `bin/fgos` exists and is executable | `no active fgos rust host release or dev checkout found` | you | `fgctl repair` |
| `rust-host-target-supported` | The OS and CPU are an approved Rust host target | names the unsupported platform | you | Use `x86_64-unknown-linux-gnu` or `x86_64-pc-windows-msvc`; no other target is shipped |
| `legacy-node-payload-present` | The legacy Node payload named by the release manifest exists | `no active fgos rust host release or dev checkout found` | you | `fgctl repair` |
| `active-release-matches-checkout` | Activated Node payload matches doctor's source working tree; staged dependencies excluded | changed/missing/extra counts, up to five paths, digest and activation time | you | Use `npm run fgos:dev -- <verb>` for working-tree code, or rebuild/stage/upgrade to update plain `fgos`; no automatic fix. Skips outside source checkouts, absent activation, same-checkout dev manifests and linked worktrees whose activation belongs to main. Does not certify Rust host freshness |
| `activation-matches-pin` | The active release is the one the committed `.fgos/distribution.json` pin names | a `warning:` (it never fails) `active <digest12> != pin <digest12> (override: <reason> or none)` | you | `fgctl init` to follow the pin, or `fgctl upgrade` and commit the moved pin when you are ahead on purpose; skips without a pin or an activation. `fgctl status` and `fgctl verify` print the same line |
| `config-awareness` | Which config level is active (project or global) and whether the other exists | never fails | info | none |
| `claude-plugin-marketplace` | The fgOS Claude Code plugin marketplace is registered and the plugin enabled | a `warning:` (it never fails) `fgOS Claude Code plugin not installed/enabled ... run fgos wire-agents` | wire-agents | `fgos wire-agents --yes` (needs the `claude` CLI on `PATH`) |

### 4.2. Project config (written by setup or `--fix`)

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `runner-patterns-config` | The pattern catalog (`runner.patterns`) and the loop tuning (`runner.loops`) are well formed; no retired key remains; a project that sets `runner.loops.*` carries `runner.patterns.seatBinding.schema: 2` (a warning otherwise) | `<file>:<line>: runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead.` | you | `fgos setup` converts the project YAML file (a backup is kept beside it); for a legacy JSON file edit the keys the message lists, then run `fgos config migrate` |
| `runner-generated-paths` | `runner.generatedPaths` maps a generated source to its render targets with well-formed write-scope entries | `fgos doctor --pretty` names the key | you | Edit the key the message names, then `fgos config check` |
| `executor-family-unique` | Each agent family has one executor | `one family, several executors: claude (claude, claude-herdr)` | you | Merge them: keep one executor and move the other's transports into it as invocations |
| `executor-skills-installed` | Every skill an executor declares in `supports.skills` exists in the skill directory of each CLI the executor invokes (claude, codex, omp, pi, grok) in the main checkout | `claude declares ak:cook but .claude/skills/ak-cook/SKILL.md is missing in /path/repo` | you | Install the skill for that runtime, or remove it from `executors.<id>.supports.skills` |
| `tier-fallback` | Every family `runner.tierFallback` lists for a tier has a `modelPolicies` cell at that tier and an agent executor | `warning: tier fallback entries the walk skips: advanced: z-ai has no modelPolicies cell at advanced` | you | Add the cell, or remove the family from that tier's list |
| `model-policy-pools` | Every pool a tier cell names (`model@pool`) has accounts in `runner.llmAccounts` (the walk skips an entry whose pool has none) | `warning: tier cells name pools runner.llmAccounts does not declare: deepseek.standard@openrouter; the walk skips these entries until the pool has an enabled account holding a login store for the CLI of the invocation (fgos dispatch explain shows each)` | you | Declare the pool's accounts under `runner.llmAccounts` in `~/.fgos/config.json` |
| `llm-accounts-shape` | `runner.llmAccounts` is in the global config only and well formed | `runner.llmAccounts.codex: "codex" is another spelling of the family "openai"` | you | Fix the named key (`fgos config explain <path>` says where it belongs) |
| `llm-accounts-vs-legacy` | `runner.llmAccounts` and `runner.providers` list the same accounts and login directories (the lease reads `runner.llmAccounts` for a pool it declares and `runner.providers` for the rest) | `warning: the lease reads runner.llmAccounts for a pool it declares and runner.providers for the rest; only in runner.providers: gemini/tetcu72` | you | Add the missing account to the side that lacks it |
| `workflow-capabilities-configured` | Every capability a Workflow unit names is declared, and has a `prefer` pool | `no entry for Workflow capabilities: ...`; `warning: ... no "prefer" pool, so a headless run of those units is refused` | you | Declare the capability under `runner.capabilities`; the `prefer` pool is yours to fill (section 5.2) |
| `capability-serves-valid` | The `serves` sets are distinct and include `review` (their shape is `fgos config check`'s) | `fgos doctor --pretty` names the key | you | Edit the key the message names, then `fgos config check` |
| `worker-slots-ceiling-usable` | `workerSlots.ceiling` is a positive integer or explicit `null` | `fgos doctor --pretty` names the key | you | Edit the key the message names, then `fgos config check` |
| `worktree-setup-configured` | `worktreeSetup.commands` is a list of non-empty shell commands | names the bad entry | you | Edit `worktreeSetup.commands` |
| `gate-bypass-configured` | `gateBypass.level` is one of off, light, standard, heavy | `gateBypass.level missing or not a recognized level ... -- run fgos doctor --fix` | tool | `fgos doctor --fix` |
| `iron-law-configured` | `ironLaw.level` is ask or warn | `ironLaw.level missing ... -- run fgos doctor --fix` | tool | `fgos doctor --fix` |
| `gateway-token-configured` | the machine files under `~/.fgos/private/` (accounts file, `gateway-token`) exist and are valid | the row names the missing or invalid file | tool | `fgos doctor --fix` (never rotates an existing token) |
| `main-checkout-hook-wired` | `core.hooksPath` points at `.githooks` (the main-checkout lock hook) | `core.hooksPath not wired to .githooks ... run fgos setup` | setup | `fgos setup` (never re-points a custom hooks path). Only meaningful when the project carries `.githooks` |
| `dispatch-decide-hook-wired` | `.claude/settings.json` has the PreToolUse hook that forces `dispatch decide` before Agent/Task calls | `.claude/settings.json has no PreToolUse dispatch-decide hook wired ... run fgos doctor --fix` | tool | `fgos doctor --fix` |

### 4.3. Agent CLIs, trust and Workflow readiness

These are the checks a project owner has to act on. Section 5 explains each
manual step.

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `agent-cli-project-trusted` | The project root is trusted in every codex home and agy sub-HOME the configured executors use | `codex config ~/.codex-x/config.toml (openai) has no entry for /path; codex will stop at "Trust this folder?"`; `agy settings ... does not list /path in trustedWorkspaces` | you | codex: add `[projects."<root>"]` and `trust_level = "trusted"` to the named `config.toml`. agy: add the root to the `trustedWorkspaces` array in the named `settings.json`. fgOS never edits these files |
| `seat-binding-dry-bind` | Every seat of every Workflow unit (packaged ones included) binds under the committed config, in a fixed headless session, with no lease and nothing started. A policy refusal fails; a capability with no pool, an account-state refusal, a tier lowered by `maxTier` and seats that share a provider family are listed as info | `1 seat(s) are refused by policy: reviewed-fixture/build/draft (capability "fixture:draft"): seat reviewer refused for independence-unsatisfiable: ...` | you | Name another provider family under `runner.capabilities.<cap>.prefer`, add the missing model cell the message names, or choose a pattern that needs fewer families |
| `trust-store-readable` | Claude's folder-trust store `~/.claude.json` is readable and has a `projects` object, so fgOS can pre-trust its own worktrees | `trust store at ~/.claude.json is unreadable: ...` or `... is not valid JSON` or `... has no usable "projects" object` | you | Start `claude` once so it creates the file; fix its permissions or its content |
| `non-claude-trust-stores-readable` | Every codex or agy trust store named in an executor is readable | names the unreadable store | you | Fix the path in the executor config, or start that CLI once so the file exists |
| `confined-pane-accounts` | Every confined herdr invocation with a private home has an account whose credential files exist | `no runner.providers.z-ai.accounts in the global config, so its pane starts in an empty private home, logged out` | you | Add the account under `runner.providers.<provider>.accounts` in `~/.fgos/config.json`, and log that CLI in |
| `agy-permissions-configured` | When agy is on `PATH`: your `~/.gemini/antigravity-cli/settings.json` lets headless agy run commands under a deny list | a `warning:` naming the file (it never fails) | you | `fgos wire-agents` shows the edit (`toolPermission: "always-proceed"` with a deny list); it widens agy's permissions in your own sessions too, so only you set it |
| `agy-sub-homes-configured` | Each agy sub-HOME named by an executor has `toolPermission: always-proceed` | names the sub-HOME | tool, you | Re-run `fgos doctor --fix`; if it persists, edit that sub-HOME's `settings.json` |
| `tool-registry-configured` | Declared tool providers (such as an impact-analysis tool) are present on this machine | `degraded -- 1/2 registered tool(s) present (1 missing, ...) run fgos tool check` | you | Install the missing tool, then `fgos tool check` to refresh the local overlay |
| `provider-capacity-state` | Provider account leases and quarantine are reportable. Doctor never clears quarantine | `provider-capacity quarantine present (acct:quota-limit:until=...)` | you | Inspect with `fgos dispatch inspect --provider-capacity`, fix the cause, then `fgos dispatch reconcile provider-capacity clear-quarantine` |
| `lock-kernel-semantics` | Both lock directories (`.fgos/locks`, `~/.local/state/fgos/locks`) give kernel lock exclusion, proven by a two-process probe | `... does not exist yet, not measured` (warning) or `... the filesystem gives no lock exclusion`; it also prints the state root and its source | you | Run `fgos setup` for a missing directory; move the workspace or state root off a network filesystem; from a checkout run through `npm run fgos:dev -- doctor` |
| `lock-borrow-vectors` | A lock lent to a git child never leaks to a background process git starts | `borrowed lock leaks (git version ...): <vector>: <detail>` | you | Report it: activation refuses the same release; do not work around it |
| `lock-holders` | Pointer: the foreign holders of fgOS locks, previous holders' processes still running and the `state` and `porting-events` hot records that need a person are read by `fgos lock-status` (its `problems` list) | `holders of fgOS locks, predecessor domains still running and hot records that need a person: run \`fgos lock-status\`` (always passes) | you | Run `fgos lock-status`; stop a named process; for a `predecessor.json` problem, confirm the domain is gone, then remove that record; for a hot record, confirm the holder is gone, then run `fgos lock fence <resource>` |
| `terminal-control` | The terminal driver (herdr) answers through the terminal port; prints its capabilities and the herdr server it talks to, then each `terminal.*` value with whether it came from the project, the global config or the default, and fails a value the rules refuse | `warning: terminal mode unsupported: herdr is not usable (herdr); direct mode unaffected` (a failure for a bad `FGOS_HERDR_ANCHOR_PANE` or a bad `terminal.*` value such as `terminal.allocationGraceMs = 40000 must be an integer of at least 60000 ...`) | you | Install herdr to use terminal mode (direct mode needs nothing); fix a bad value in `.fgos/config.json` or `~/.fgos/config.json` |
| `terminal-allocations` | Pointer: no terminal slot is stuck past `terminal.allocationGraceMs` and no retained pane is past its time; `fgos dispatch inspect --terminal` lists them | `warning: 1 slot(s) need a person; nothing was closed; run \`fgos dispatch inspect --terminal\`` | you | Close the named pane yourself; doctor never closes one |
| `herdr-executor-kinds` | Every executor dispatched through a herdr pane names a supported agent kind and no outdated integration hook | names the executor | you | Fix the executor's kind in the config |
| `executor-profile-warnings` | Legacy executor entries hardcoding policy-shaped flags or account-pool env | `9 legacy executor-profile warning(s) (informational, not blocking)` | info | Migrate when convenient; each item names the target |
| `executor-confinement` | No executor has `permissionMode: bypass` without `privateHome`, `isolatedSession` and `ownWorktree` all true | names the executor | you | Set the three flags or drop `bypass` |
| `invocation-git-write-grants` | No executor or invocation grants workers `git add` or `git commit` | `warning: ... still grant git add/git commit` | you | Remove the grant from `--allowedTools`; the runner commits |
| `bwrap-available` | `bwrap` resolves and passes a smoke test (`bwrap --ro-bind / / -- true`) | `bwrap is unavailable or failed smoke test: ...` | you | Install bubblewrap; on a restricted kernel allow user namespaces |
| `curl-available` | `curl` runs (`fgctl init` downloads releases through it) | `warning: curl is not usable on PATH ...` (never a failure: local `--from` paths do not need it) | you | Install curl, or pass a local `--from` path |

### 4.4. Confinement

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `confinement-policies-declared` | Policies referenced by capabilities exist | names the unknown policy | you | Declare it under `runner.confinementPolicies` or fix the reference |
| `confinement-backend-registry-readable` | The machine registry `~/.fgos/confinement-backends.json` exists and is valid | `machine backend registry not found at ... -- run fgos doctor --fix` | tool | `fgos doctor --fix` |
| `confinement-orphaned-resources-reaped` | No confinement temp dirs are left by a dead process | `1 empty per-dispatch dir(s) left behind across /tmp/fgos-confinement -- run "fgos doctor --fix"` | tool | `fgos doctor --fix` |
| `confinement-bwrap-platform` | The bwrap backend in the machine registry is enabled and its executable verified | the message names the broken state | you | Install or enable bubblewrap; re-run |
| `confinement-probe-freshness` | The 8 confinement probes pass | names the failing probe | you | Fix the named probe's cause (usually bwrap or namespace permissions) |
| `blind-steps-use-proven-pools` | Every blind Workflow unit's capability pool can only bind executors whose provider family and transport were proven blind by the live canary (claude and xai through herdr, openai through herdr or cli, glm and deepseek through cli; gemini is not proven) | `blind steps can bind executors not proven to keep a worker blind: <workflow>/<step>/<unit>: <executor> via <invocation> ...`; passes as not applicable when no unit is blind | you | Remove that executor from the capability's `prefer` pool for the blind step, or run the canary for that family and transport and add a row to `BLIND_PROVEN_PAIRS` in `src/setup/blind-steps-proven-pools.mjs` |
| `confinement-blind-read` | A blind unit can be enforced (the bwrap backend hides peer run state from a worker) | `blind-read: fail (...)` names what the worker could still read; `backend-unsupported` means blind units are refused | you | Fix bwrap or namespace permissions, as for the probe row |
| `confinement-strict-readiness` | Strict confinement is possible (all capabilities have known policies, bwrap ready) | `warning: strict confinement disabled (capability "x" missing confinement policy ...)` | info | Declare a policy per capability if you want strict mode |
| `confinement-herdr-maturity` | Reports how far herdr confinement has converged | never fails | info | none |

#### 4.4.1. Linux host setup for the bwrap rows

`bwrap-available`, `confinement-bwrap-platform` and `confinement-probe-freshness` pass only when
`bwrap` is installed and a non-root user may create a user namespace with it. On a clean Ubuntu or
Debian machine:

```sh
sudo apt-get install -y bubblewrap
# Ubuntu 24.04 and later: AppArmor blocks unprivileged user namespaces by default, so bwrap
# fails its smoke test even when installed. Allow them (add the line to a file under
# /etc/sysctl.d/ to keep it across reboots); the key does not exist on older releases.
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
fgos doctor
```

A narrower alternative to the sysctl is an AppArmor profile that grants `userns` to
`/usr/bin/bwrap` only. `scripts/ci-setup-bwrap.sh` runs exactly these commands before the
external consumer proofs of the release and CI workflows.

### 4.5. Work state, git and coordination hygiene

Mostly relevant after the project has real work items.

This table is selective for the Event Store: it lists the one row a project owner acts on (`event-store-legacy-layout`); the missing fetch mapping, an unsafe publication refspec and a moved remote are reported by `git-repository-config`, and `fgos doctor --fix` installs the mappings. The six `event-store-*` rows and what each one checks are in `docs/platform/event-store/spec.md` section 21.

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `domain-registry-compiled` | Every `compiled.json` of the installed fgOS's domains exists, parses, carries the contract this fgOS reads and matches its YAML | `... -- run npm run build:domains` | you | `npm run build:domains` in the fgOS source; elsewhere reinstall fgOS. The row judges the installed fgOS, not the project |
| `agent-type-names-unique` | Agent type names are unique within each tier the project supplies (`fgos/agents`, and `core/agents` when it ships one) | names the duplicate | you | Rename one. Tiers read from the installed release are judged by `npm test` |
| `work-classification-vocabulary` | Open items' risk and kind match their domain's vocabulary | `N open item(s) outside their domain's classification` | you | Re-classify the named items |
| `work-step-vocabulary` | No open item is stranded on a retired step | `2 open item(s) at a step their domain no longer registers` | you | Drain the named items; no verb relabels a live item's step |
| `work-recorded-conflicts` | The Work view holds no recorded cross-machine conflicts | `warning: 1 recorded cross-machine conflict(s) on 1 item(s): build-cli` | you | Never fails. Run `fgos show <id>` to list the conflicts of an item: each is a change acknowledged on one machine that another machine's concurrent change kept from applying. Nothing resolves it automatically |
| `root-drift` | No `fgw/<root>` branch is ahead of its target | `drifted root branch(es) need syncing: ... -- run fgos sync-root <root-id>` | you | `fgos sync-root <root-id>` |
| `leaf-notify-drift` | No live session branch has post-land drift | names the branch | you | Rebase or resync the named branch |
| `delivered-not-on-trunk` | Every handed-over item's branch is reachable from the trunk | names the item | you | Merge or catch up the named item |
| `event-store-legacy-layout` | No tracked event file (`.fgos/events.jsonl`, `.fgos/events/`) is left in the main checkout | `event-store-migration-required: run fgos events migrate in the main checkout with writers stopped` | you | `fgos events migrate --check`, then `fgos events migrate`, with every writer stopped |
| `git-incidents` | Pointer: open Git incidents (pending operations, native locks, a merge in progress) | `warning: 1 pending Git operation(s); run \`fgos git status\` ...` | you | Never fails. `fgos git status` lists every incident; `fgos git recover` settles interrupted operations; for a stuck merge review `git status`, then `fgos main-checkout-reset --sha <sha> --confirm` |
| `runner-coordination-orgPolicy-shape` | `runner.coordination.orgPolicy.dischargeOn` is an array of strings | `... dischargeOn must be an array of strings` | tool | `fgos doctor --fix` resets it to the default |
| `operation-prompt-templates-valid` | Operation prompt templates in `.fgos/prompt-templates` validate | names the template | you | Fix the named template. The release's own templates are judged by `npm test` |
| `observe-dir-writable` | `.fgos/observe` is writable | names the path | you | Fix directory permissions |
| `observe-friction-migrated` | Legacy friction records are migrated to `.fgos/observe/friction` | `N legacy work.friction record(s) newer than cursor (not migrated) -- run: <host binary> friction migrate --dir <project>` | you | Run the named command. `friction` is a Rust host verb (`.fgos/installation/bin/fgos`, or `FGOS_HOST_BIN`); the Node `fgos` entry has no such verb and no registered fix does it |
| `observe-host-resolvable` | The Rust host resolves and reads the friction store | `host binary unavailable (FGOS_HOST_BIN unset and no active installation ...)` | you | `fgctl repair` |

### 4.6. Docs and generated projections

`fgos doctor` no longer judges the knowledge registry. Run `fgos knowledge status`
to see the registry lints (`doc-alias-broken`, `doc-active-duplicate`,
`doc-current-path-missing`, `doc-source-unreachable`, `doc-near-duplicate`,
`doc-provisional-aged`, `doc-topic-oversized`, `doc-role-underused`,
`doc-source-conservation`) as `findings`, `fgos doc-registry --check` to see
whether `docs/doc-registry.md` and `.json` are current, and `fgos doc-registry`
to refresh them.

## 5. Before your first Workflow run

### 5.1. Checklist

- [ ] Run from inside the project (see 5.4).
- [ ] `fgos doctor` is clean for the rows in sections 4.2 and 4.3, or you
  understand each remaining red line.
- [ ] Every Workflow you will run has a `prefer` pool with **enough distinct
  provider families** (5.2).
- [ ] The project root is **trusted in every agent CLI home** the pools use:
  claude, codex and agy (5.3).
- [ ] Each executor's account is logged in (`confined-pane-accounts` and the
  CLI itself).
- [ ] `herdr` and `bwrap` are present if your executors use them.
- [ ] Nothing stale is in the way: no provider quarantine you did not mean to
  keep (`provider-capacity-state`).

### 5.2. Pools and independence

A Workflow unit names a capability, for example `nominal-group:generate`. The
runner picks executors from that capability's pool in the project config
(`fgos config show --path runner.capabilities`; the file is `<project>/.fgos/config.yaml`). Shown as JSON for brevity:

```json
"runner": { "capabilities": { "nominal-group:generate": {
  "prefer": [
    { "executor": "claude" },
    { "executor": "xai", "invocation": "omp-herdr" },
    { "executor": "openai" },
    { "executor": "glm", "invocation": "pi-cli-bwrap" }
  ] } } }
```

A reviewed unit's checkers must come from a different provider family than the
producer (hard rule). A panel only prefers a different family per seat:
`bind()` gives each seat the first family in `prefer` order that no earlier seat
uses, then the least used one, so a panel may have more seats than the pool has
families and some seats share a family (the run's `unit-summary.json` lists them
under `sharedFamilies`). The `seat-binding-dry-bind` check fails
on a reviewed unit that lacks a second family and only notes, without failing,
which panel seats would share a family.
"Runnable" here means what the binder can place (allow-list, confinement,
herdr). It does not see a family whose CLI is blocked on a trust prompt or whose
account is out of quota, so a green pool check is not enough on its own.

Edit the `prefer` list of every capability the Workflow uses (`fgos doctor`
lists them), keeping at least one more family than the largest panel.

### 5.3. Trust in every agent CLI home

Each agent CLI keeps its own record of which folders a human has vouched for.
A fresh worktree is a path none of them has seen; fgOS pre-trusts its own
worktrees for claude **only when the repo root is already trusted by you**
(trust is derived, never invented). For codex and agy fgOS does not write at
all. A missing entry stops the agent at a "Trust this folder?" dialog.

| CLI | Where the trust lives | What you do once per project |
|---|---|---|
| claude | `~/.claude.json`, `projects["<path>"].hasTrustDialogAccepted` | Start `claude` in the project root and accept the folder-trust dialog |
| codex | `config.toml` in each codex home an executor uses (for example `~/.codex-x/config.toml`; the path is named by `agent-cli-project-trusted`) | Add `[projects."/abs/path/to/project"]` and under it `trust_level = "trusted"` |
| agy | `.gemini/antigravity-cli/settings.json` in each agy sub-HOME | Add `"/abs/path/to/project"` to the `trustedWorkspaces` array |

Use the exact root the check prints. If you use several codex homes or agy
sub-HOMEs (one per account), repeat for each: the check lists them all.
`agent-cli-project-trusted` verifies codex and agy; claude trust has no doctor
check beyond `trust-store-readable`, so open it once yourself.

### 5.3.1. A claude seat in the sandbox needs its own login

A claude seat that runs confined (`claude-cli-bwrap`, `claude-herdr-bwrap`) starts
in a private home and keeps its session transcript there. Its login must be a
dedicated one, never your `~/.claude`: fgOS renews the login of a seat account, and
a failed renewal would sign out every claude session of yours. Until the machine has
such an account, `fgos doctor` fails `confined-pane-accounts` for both claude
invocations and the seat starts logged out. A machine without the `claude` CLI skips
this.

Create the login once, in a directory fgOS owns, and sign in with the account the
seat should use (it may be the same Anthropic account, as a separate sign-in):

```bash
mkdir -m 700 -p ~/.fgos/private/claude-login
CLAUDE_CONFIG_DIR=~/.fgos/private/claude-login claude /login
```

Then declare it as the `main` claude account in the global config:

```bash
fgos config set runner.providers.claude.accounts.main '{label: claude-seat, credentialSources: {claude: {kind: home-files, home: "${HOME}/.fgos/private/claude-login", files: [".credentials.json"]}}}' --reason "claude seat uses its own login"
```

Only `.credentials.json` is copied into the seat's home. A seat refuses to start when
the copy has less access-token time left than the seat's timeout, so it never renews
inside its home; fgOS renews this login at the source before a run. Check with
`fgos config check`, then `fgos doctor`: `confined-pane-accounts` should say each
claude invocation "has its 1 credential file(s)".

### 5.4. Run from inside the project

Run `fgos workflow start ...` (and `workflow status`, `answer`, `resume`) from
the project's root, using the project's own installed `fgos`
(`.fgos/installation/bin/fgos`, or the `fgos` launcher on your `PATH`, which
runs the release the project's activation names from the machine release store). Do not run another checkout's `bin/fgos.mjs` from a different directory with
`--dir /path/to/project`. `--dir` only selects which `.fgos/` store is read and
written; it does not make the project's own configuration, hooks and paths the
ones in force, so a run started that way can silently mix two trees.

## 6. Troubleshooting a run

### 6.1. Start, then watch

```bash
fgos workflow start <workflow-id> --request "<what you want>"
```

`start` returns at once with the run id and a `detached` block (`pid`,
`logPath`, `statusCommand`); a detached `fgos workflow resume <id> --foreground`
does the work. Add `--foreground` to keep it in your terminal until it
completes, fails or parks.

```bash
fgos workflow status <run-id>
```

`status` shows the run's state per step, any open question, and an `advance`
block: `running` (is the detached process alive), `pid`, `logPath`
(`.fgos/workflow-runs/<run-id>/advance.log`), the last log lines while the run
is not completed, and a `hint` when the run says `running`, nothing is advancing
and nothing was recorded for a while. In that case continue it with
`fgos workflow resume <run-id>`.

### 6.2. Where the evidence is

| Path under the project | What it holds |
|---|---|
| `.fgos/workflow-runs/<run-id>/events.jsonl` | The run's event log, source of `status` |
| `.fgos/workflow-runs/<run-id>/advance.log` | Output of the detached advance process |
| `.fgos/assignments/<unit-run>/<role>/<n>/assignment.json` | The unit's assignment (executor, brief) |
| `.fgos/assignments/<unit-run>/<role>/<n>/runs/<NN>/visibility.json` | What was seen of the agent: outcome, pane, prompt readiness, `trustSeedFailed` |
| `.fgos/assignments/<unit-run>/<role>/<n>/runs/<NN>/{result,evidence,exit}.json`, `stdout.log`, `stderr.log` | The agent's result and logs |

### 6.3. The outcome `blocked`

`blocked` means the agent stopped at something only a person can answer, for
example a "Trust this folder?" dialog. The failure text ends with:
"Answer the prompt in the pane, or grant trust for this project in the agent's
own home, then run again." Concretely:

1. Open `visibility.json` of the failing round. A `trustSeedFailed` value names
   the agent home and says the project root "is not itself trusted ... so there
   is nothing to derive trust from": trust is missing, fix it as in 5.3.
2. If the pane is still open (the failure text says "Pane ... is left open"),
   read the actual dialog there. If it is not a trust prompt (a login, a quota
   screen), solve that in the agent CLI.
3. You can answer the dialog in that pane, but the run has already ended as
   failed. Grant trust and start the run again; a run does not retry itself past
   a blocked outcome.
4. Re-run `fgos doctor`: `agent-cli-project-trusted` should now be green.

### 6.4. Other failures

| Symptom | Likely cause | What to do |
|---|---|---|
| Step refused with `policy-refusal ... violates independence requirement against [...]` | A `reviewed` checker has no provider family different from the producer's (a panel never refuses for this) | Add a family to the pool (5.2); the producer already ran |
| `execution-timeout` after a long wait | An agent looped or stalled. A busy stream is not treated as idle | Read the round's `stdout.log`; consider a different executor in the pool |
| `parked` with an open question | A human gate | Answer: `fgos workflow answer <run-id> --step <step-id> --answer "<text>"`; the run continues |
| `status` says `running`, no progress, `advance.running` false | Detached advance died | `fgos workflow resume <run-id>` |
| Run not found | Wrong project or you ran with a mismatched `--dir` | Run from inside the project (5.4) |
| Everything runs but the agents cannot start | Account not logged in, or provider quarantine | `confined-pane-accounts`, `provider-capacity-state` |

## 7. Related files

| Relationship | File |
|---|---|
| install channels, entry points, doctor and setup behavior | [packaging-distribution spec](../platform/packaging-distribution/spec.md) |
| doctor/fix registry contract | [setup-doctor-registry](../platform/packaging-distribution/contracts/setup-doctor-registry.md) |
| `fgctl` and local `fgos` ownership split | [fgctl and local fgOS](../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md) |
| area portal | [packaging-distribution README](../platform/packaging-distribution/README.md) |
| confinement and agent isolation | [configure and operate agent confinement](configure-and-operate-agent-confinement.md) |
| group-thinking Workflows | [use fgos group thinking](use-fgos-group-thinking.md) |
| top-level install commands | [README](../../README.md) |
