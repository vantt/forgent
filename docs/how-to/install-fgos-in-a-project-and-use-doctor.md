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

Separately from both layers, the config has two levels: a project file
`<project>/.fgos/config.json` and a global file `~/.fgos/config.json`. The
project file wins over the global one.

## 2. Order of operations for a new project

Run these from the project root (it must be a git repository; `fgctl init`
refuses outside one).

1. Install `fgctl` once per machine:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/vantt/forgent/main/install.sh | sh
   ```

   It downloads `fgctl-<version>-<target>.tar.gz` from the release, verifies it
   against `SHA256SUMS`, and puts `fgctl` in `~/.local/bin` (override with
   `FGCTL_INSTALL_DIR`). If `~/.local/bin` is not on `PATH` it tells you what to
   export. Only `x86_64-unknown-linux-gnu` is supported today.

2. Activate fgOS in the project with `fgctl init`. The release must come from
   somewhere: `fgctl init` with no argument works only when the project already
   carries a committed `.fgos/distribution.json` pin. For a first install, give
   it the release asset (the `fgos-<version>-<target>.tar.gz` from the same
   GitHub release):

   ```bash
   fgctl init --from ./fgos-<version>-x86_64-unknown-linux-gnu.tar.gz
   ```

   `fgctl init` stages the release into the machine store, writes
   `.fgos/installation/`, and then, using the new shim, runs this tail in order:

   ```text
   .fgos/installation/bin/fgos init
   .fgos/installation/bin/fgos doctor --fix
   .fgos/installation/bin/fgos doctor
   ```

   If any tail command exits non-zero, `fgctl init` exits non-zero and the
   install is recorded as `ready-degraded`. Note that `fgos doctor` exits 0
   even when checks fail (see section 3; `--strict` changes that, but the tail
   does not use it), so a green `fgctl init` does not mean a green doctor.

3. Read the doctor report yourself and clear everything the tool could not fix
   (section 4 says which is which):

   ```bash
   .fgos/installation/bin/fgos doctor --pretty
   ```

4. Do the owner steps in section 5 (trust in every agent CLI home, pools with
   enough provider families). No tool writes those for you.

5. If config defaults or hooks are still reported as missing (the
   `... -- run fgos setup` messages), run the legacy `fgos setup` once:

   ```bash
   .fgos/installation/bin/fgos setup
   ```

   See "What setup still does that doctor --fix does not" below.

Later, to move the project to a newer release:

```bash
fgctl upgrade --from ./fgos-<new-version>-x86_64-unknown-linux-gnu.tar.gz
```

`fgctl upgrade` records the previous release so `fgctl repair` can roll back.
Check what is active with `fgctl status` (`--json` for machines).

### 2.1. What each command does

| Command | Does | Writes? |
|---|---|---|
| `install.sh` | Installs the `fgctl` binary | `~/.local/bin/fgctl` |
| `fgctl stage --from <release>` | Puts a release into the machine store without activating it | machine store |
| `fgctl init [--from <release>]` | Stages (if needed), activates in this project, runs the init/doctor tail | `.fgos/installation/`, machine store |
| `fgctl upgrade --from <release>` | Moves the project to another release, keeps the previous one, runs the tail | `.fgos/installation/` |
| `fgctl repair` | Rolls back to the previous release if one is recorded, otherwise re-verifies and re-publishes the same one | `.fgos/installation/` |
| `fgctl verify` | Verifies the active release's files against its manifest and quarantines it on drift | quarantine on failure |
| `fgctl status` | Shows the active and previous release and staged releases | nothing |
| `fgos init` | Creates the `.fgos/` store (event log, empty view, coexistence manifest) | `.fgos/` |
| `fgos doctor` | Runs every check and reports | nothing |
| `fgos doctor --fix` | Runs every registered fix, then reports the checks again | the fixes listed in section 4 |
| `fgos doctor --strict` | Same report; exits 1 when any check fails (also with `--fix`) | nothing |
| `fgos setup` | Legacy. Wires shell integration, fills config defaults, wires git and Claude Code hooks, runs every registered fix, materializes skills | project and global config, rc files, hooks |

If the shim says `no active runtime -- run fgctl init` or
`active runtime is not ready (...) -- run fgctl repair`, do what it says.

### 2.2. What setup still does that doctor --fix does not

`fgos setup` is marked deprecated, but `fgctl init`, then `fgos doctor --fix`,
then `fgos doctor` does not fill the config defaults. `doctor --fix` only runs
the fixes in section 4; the check messages for missing config sections, the git
hook and the Claude Code dispatch hook all still say "run fgos setup", and only
`setup` writes them (its help now says so too). Run `fgos setup` once in the
project when those checks are red. It never overwrites a value you already set.

## 3. Reading doctor output

```bash
fgos doctor --pretty    # one line per check, a tick or a cross
fgos doctor --json      # {"data": {"checks": [{id, description, passed, message}]}}
fgos doctor --fix --json   # adds data.fixed: [{id, changed, message}] and re-reports checks
```

- Plain `doctor` and `doctor --fix` both exit 0 whatever the checks say: the
  `fgctl init|upgrade|repair` tail runs them and treats a non-zero exit as a
  degraded install, and a project that has not run `fgos setup` always has red
  checks. Read `passed`, or pass `--strict` (`fgos doctor --strict`,
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
- **setup**: `fgos setup` repairs it (and `doctor --fix` does not).
- **you**: only the project owner can, by hand. fgOS never edits those files.
- **info**: informational, or only reports. No action required unless you care.

The list below is the live output of `fgos doctor --json` (96 checks), in
registration order, which lives in `src/setup/registrations.mjs`
(`src/setup/checks.mjs` re-exports it). Some read-only checks list the failing
file or key in their message; the message always names the exact target.

### 4.1. Machine and installation

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `node-version-and-git` | Node 18 or newer and git on `PATH` | `node v16.x -- need >=18` | you | Install Node 18+ or git |
| `cli-version-visible` | `fgos version` resolves this build's version and verbs | `fgos version did not resolve a packageVersion...` | you | No fix is registered: repair the runtime (`fgctl repair`) or reinstall |
| `shell-integration-sourced` | The shell-integration `source` line is in your rc files and the `fgos` function really works | `not sourced in: ~/.zshrc -- run fgos setup`; `sourced correctly, but "fgos --help" fails after stripping ...` (shown as an informational, still passing, note when doctor runs inside an agent harness shell) | setup, you | `fgos setup` adds the line. Dead `source` lines it reports must be deleted by hand. Open a new shell. The "fails after stripping" form is a harness shell snapshot dropping a helper, not a project problem; run doctor from your own terminal to see the real verdict. Only relevant to dev checkouts |
| `plugin-skill-cli-reachable` | A `fgos` CLI is reachable from this project (workspace installation, local `bin/fgos.mjs`, project-local install, or global `PATH`) | `no bin/fgos.mjs at <cwd>, no project-local node_modules/.bin/fgos, and no global fgos install on PATH -- every /fgOS:* slash command will fail on first use` | you | `fgctl init` in the project (its message still names the legacy `npm install -g github:vantt/forgent`) |
| `bin-discovery-cache` | (fix only, no check) refreshes the cached global `fgos` path | none | tool | `fgos doctor --fix` |
| `rust-host-binary-present` | The active release's `bin/fgos` exists and is executable | `no active fgos rust host release or dev checkout found` | you | `fgctl repair` |
| `rust-host-target-supported` | The OS and CPU are an approved Rust host target | names the unsupported platform | you | Use `x86_64-unknown-linux-gnu`; no other target is shipped |
| `legacy-node-payload-present` | The legacy Node payload named by the release manifest exists | `no active fgos rust host release or dev checkout found` | you | `fgctl repair` |
| `command-routes-drift` | The command-routes descriptor matches the command registry | lists the drifted verbs | info | A release or contributor issue, not yours; report it |
| `dependencies-installed` | `package.json` dependencies are in `node_modules` | `missing from node_modules: <pkg> -- run npm install` | you | `npm install` (or your package manager's equivalent) in the project |
| `config-awareness` | Which config level is active (project or global) and whether the other exists | never fails | info | none |
| `plugin-dev-skills-packaged` | Every coding-domain dev-skill is also in `plugins/fgOS/skills/` | lists the missing skill | info | Only checks the fgOS repo itself; "not a forgent checkout" elsewhere |
| `claude-plugin-marketplace` | The fgOS Claude Code plugin marketplace is registered and the plugin enabled | `fgOS Claude Code plugin not installed/enabled` | tool | `fgos doctor --fix` (needs the `claude` CLI on `PATH`) |
| `changelog-unreleased-stale` | `CHANGELOG.md` has an `[Unreleased]` entry | `## [Unreleased] has no pending entries -- reminder only` | info | Add a line to your changelog if you keep one |
| `readme-install-tag-exists` | The `README.md` install command pins a tag that exists | names the missing tag | info | Fix the tag in the README, if you have one |

### 4.2. Project config (written by setup or `--fix`)

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `config-not-stale` | `.fgos/config.json` exists and has every current default key | `not yet configured -- run fgos setup`; `stale config -- missing keys: ...` | setup | `fgos setup` (only adds missing keys, never overwrites yours) |
| `runner-rigor-config` | `runner.rigorToTier` is complete in the project and global config | `project runner.rigorToTier missing -- run fgos setup` | setup | `fgos setup`; or fix the named key by hand |
| `runner-patterns-config` | `runner.patterns` is present, well formed and cumulative | `runner.patterns missing -- falling back to setup defaults` | setup | `fgos setup` |
| `tier-vocabulary-dead-keys` | No retired tier keys (`runner.models`, `minTier`, `rigorOverrides`) | names the dead key | you | Delete or migrate the named key |
| `model-policy-tier-coverage` | `runner.modelPolicies` has a model for every tier `rigorToTier` produces, for every provider | `global provider "openai" missing model for tier "standard"` | you | Add the model for that provider and tier under `runner.modelPolicies` in the named config file |
| `advise-execute-capabilities-configured` | `runner.capabilities` declares `advise`, `execute`, `code:implement` | `runner.capabilities section missing -- run fgos setup` | setup | `fgos setup` |
| `workflow-capabilities-configured` | Every capability a Workflow unit names is declared, and has a `prefer` pool | `no entry for Workflow capabilities: ...`; `warning: ... no "prefer" pool, so a headless run of those units is refused` | setup, you | `fgos setup` declares the capabilities. The `prefer` pool is yours to fill (section 5.2) |
| `capability-serves-valid` | The `serves` sets are well formed, distinct and include `review` | `runner.capabilities section missing -- run fgos setup` | setup | `fgos setup` |
| `operation-capability-resolves` | Coordination operations' declared capabilities resolve against the config | `runner config section missing -- run fgos setup` | setup | `fgos setup` |
| `worker-slots-ceiling-usable` | `workerSlots.ceiling` is a positive integer or explicit `null` | `workerSlots section missing -- run fgos setup` | setup | `fgos setup`; set an integer (8 is recommended) to enforce a ceiling |
| `invariant-checks-configured` | `invariantChecks.commands` has a runnable command | `invariantChecks section missing -- run fgos setup` | setup | `fgos setup`, then put your project's own check command there |
| `worktree-setup-configured` | `worktreeSetup.commands` is a list of non-empty shell commands | names the bad entry | you | Edit `worktreeSetup.commands` |
| `gate-bypass-configured` | `gateBypass.level` is one of off, light, standard, heavy | `gateBypass.level missing or not a recognized level ... -- run fgos doctor --fix` | tool | `fgos doctor --fix` |
| `iron-law-configured` | `ironLaw.level` is ask or warn | `ironLaw.level missing ... -- run fgos doctor --fix` | tool | `fgos doctor --fix` |
| `gateway-token-configured` | `gateway.token` is present in `~/.fgos/config.json` | `gateway.token missing from ~/.fgos/config.json` | tool | `fgos doctor --fix` (never rotates an existing token) |
| `herdr-launcher-configured` | `herdrOrchestrator` toggles are present booleans | `herdrOrchestrator section missing -- run fgos setup` | setup | `fgos setup` |
| `herdr-web-dashboard-configured` | `herdrWebDashboard.staticServing` is a boolean | `herdrWebDashboard section missing -- run fgos setup` | setup | `fgos setup` |
| `doc-registry-enforce` | `docRegistry.enforce` is a boolean | `docRegistry section missing -- run fgos setup` | setup | `fgos setup` |
| `main-checkout-hook-wired` | `core.hooksPath` points at `.githooks` (the main-checkout lock hook) | `core.hooksPath not wired to .githooks ... run fgos setup` | setup | `fgos setup` (never re-points a custom hooks path). Only meaningful when the project carries `.githooks` |
| `dispatch-decide-hook-wired` | `.claude/settings.json` has the PreToolUse hook that forces `dispatch decide` before Agent/Task calls | `.claude/settings.json has no PreToolUse dispatch-decide hook wired ... run fgos setup` | setup | `fgos setup` |
| `instruction-projections-stale` | The effective instruction projections and ledger are current | `instruction projections not materialized -- run fgos doctor --fix` | tool | `fgos doctor --fix` |

### 4.3. Agent CLIs, trust and Workflow readiness

These are the checks a project owner has to act on. Section 5 explains each
manual step.

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `agent-cli-project-trusted` | The project root is trusted in every codex home and agy sub-HOME the configured executors use | `codex config ~/.codex-x/config.toml (openai) has no entry for /path; codex will stop at "Trust this folder?"`; `agy settings ... does not list /path in trustedWorkspaces` | you | codex: add `[projects."<root>"]` and `trust_level = "trusted"` to the named `config.toml`. agy: add the root to the `trustedWorkspaces` array in the named `settings.json`. fgOS never edits these files |
| `workflow-pools-satisfy-independence` | For every panel or reviewed Workflow unit, the `prefer` pool has enough distinct provider families to place every role independently | `capability prefer pools cannot supply the independent provider families these Workflow units need: ...` | you | Add a `prefer` entry on another provider family under `runner.capabilities.<capability>` |
| `trust-store-readable` | Claude's folder-trust store `~/.claude.json` is readable and has a `projects` object, so fgOS can pre-trust its own worktrees | `trust store at ~/.claude.json is unreadable: ...` or `... is not valid JSON` or `... has no usable "projects" object` | you | Start `claude` once so it creates the file; fix its permissions or its content |
| `non-claude-trust-stores-readable` | Every codex or agy trust store named in an executor is readable | names the unreadable store | you | Fix the path in the executor config, or start that CLI once so the file exists |
| `confined-pane-accounts` | Every confined herdr invocation with a private home has an account whose credential files exist | `no runner.providers.z-ai.accounts in the global config, so its pane starts in an empty private home, logged out` | you | Add the account under `runner.providers.<provider>.accounts` in `~/.fgos/config.json`, and log that CLI in |
| `agy-permissions-configured` | agy's `settings.json` has a working command denylist | the message says what the settings file lacks | tool | `fgos doctor --fix` |
| `agy-sub-homes-configured` | Each agy sub-HOME named by an executor has `toolPermission: always-proceed` | names the sub-HOME | tool, you | Re-run `fgos doctor --fix`; if it persists, edit that sub-HOME's `settings.json` |
| `tool-registry-configured` | Declared tool providers (such as an impact-analysis tool) are present on this machine | `degraded -- 1/2 registered tool(s) present (1 missing, ...) run fgos tool check` | you | Install the missing tool, then `fgos tool check` to refresh the local overlay |
| `provider-capacity-state` | Provider account leases and quarantine are reportable. Doctor never clears quarantine | `provider-capacity quarantine present (acct:quota-limit:until=...)` | you | Inspect with `fgos dispatch inspect --provider-capacity`, fix the cause, then `fgos dispatch reconcile provider-capacity clear-quarantine` |
| `provider-capacity-lock-stale` | The provider-capacity lock file is not held by a dead process | `provider-capacity lock at <path> is held by dead pid <n>` | you | No fix is registered: confirm the pid is gone (`kill -0 <pid>`), then remove the lock file named in the message |
| `herdr-available` | `herdr` is on `PATH` and reports a version (the interactive dispatch transport) | `herdr is not usable on PATH (herdr): ...` | you | Install herdr |
| `herdr-executor-kinds` | Every executor dispatched through a herdr pane names a supported agent kind and no outdated integration hook | names the executor | you | Fix the executor's kind in the config |
| `executor-profile-warnings` | Legacy executor entries hardcoding policy-shaped flags or account-pool env | `9 legacy executor-profile warning(s) (informational, not blocking)` | info | Migrate when convenient; each item names the target |
| `executor-confinement` | No executor has `permissionMode: bypass` without `privateHome`, `isolatedSession` and `ownWorktree` all true | names the executor | you | Set the three flags or drop `bypass` |
| `invocation-git-write-grants` | No executor or invocation grants workers `git add` or `git commit` | `warning: ... still grant git add/git commit` | you | Remove the grant from `--allowedTools`; the runner commits |
| `bwrap-available` | `bwrap` resolves and passes a smoke test (`bwrap --ro-bind / / -- true`) | `bwrap is unavailable or failed smoke test: ...` | you | Install bubblewrap; on a restricted kernel allow user namespaces |

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

### 4.5. Work state, git and coordination hygiene

Mostly relevant after the project has real work items.

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `mutating-assignment-binding-snapshot` | Every mutating assignment result matches its unit snapshot | `error scanning assignments` or a mismatch | you | Report it; do not edit the assignment files |
| `coordination-protocol-dead-vocabulary` | Coordination protocols and workflows do not use retired `minTier` / `minRigor` | names the file | you | Edit the named definition |
| `task-specs-resolve` | Every domain's task spec and every core task spec resolves to a real file | `missing task-spec file(s): coding.operations.discovery[judge-ambiguity] -> ... not found` | you | Resolved against the fgOS install doctor runs from, not the project, so a plain project without fgOS's own `domains/` and `core/` trees passes. A failure means the installed release itself is incomplete: run `fgctl repair` |
| `agent-claims-resolve` | Every agent type's claims name real task specs | names the unresolved claim | info | Same as above |
| `domain-registry-compiled` | Every domain's `compiled.json` exists and parses | `... -- run npm run build:domains` | you | In an fgOS source checkout, `npm run build:domains` |
| `agent-type-names-unique` | Agent type names are globally unique | names the duplicate | you | Rename one |
| `work-classification-vocabulary` | Open items' risk and kind match their domain's vocabulary | `N open item(s) outside their domain's classification` | you | Re-classify the named items |
| `work-step-vocabulary` | No open item is stranded on a retired step | `2 open item(s) at a step their domain no longer registers` | you | Drain the named items; no verb relabels a live item's step |
| `domain-workflow-operations-coverage` | Every Workflow step operation resolves to valid task specs, roles, skills and legal edges | `15 workflow step operation problem(s): ...` | you | Same root as `task-specs-resolve` (the fgOS install, not the project); a failure means the installed release is inconsistent |
| `root-drift` | No `fgw/<root>` branch is ahead of its target | `drifted root branch(es) need syncing: ... -- run fgos sync-root <root-id>` | you | `fgos sync-root <root-id>` |
| `leaf-notify-drift` | No live session branch has post-land drift | names the branch | you | Rebase or resync the named branch |
| `delivered-not-on-trunk` | Every handed-over item's branch is reachable from the trunk | names the item | you | Merge or catch up the named item |
| `events-jsonl-not-truncated` | `.fgos/events.jsonl` was not silently reverted by a stash, checkout, reset or clean | `truncation detected in events.jsonl, ...` | you | No fix is registered: stop writing to the store, restore the log from backup and find what reverted it |
| `events-compaction-verified` | Past `.fgos/events/` compactions still match their archives | names the compaction | you | Report it; do not delete archives |
| `main-checkout-guard-warnings` | The main-checkout guard log has no recorded regressions | `1300 main checkout guard warning(s) recorded` | info | Read the log named in the message; clear only after review |
| `no-stuck-merge-abort` | The main checkout has no lingering `MERGE_HEAD` | `merge in progress or stuck (MERGE_HEAD=...) -- run fgos main-checkout-reset ...` | you | `--fix` never acts here by design. Review `git status`, then `fgos main-checkout-reset --sha <sha> --confirm` |
| `coordination-abandoned-claims` | No abandoned `.claim` or `.staging-*` coordination entries | `Found N demonstrably dead claims` | tool | `fgos doctor --fix` removes only provably dead ones |
| `runner-coordination-orgPolicy-shape` | `runner.coordination.orgPolicy.dischargeOn` is an array of strings | `... dischargeOn must be an array of strings` | tool | `fgos doctor --fix` resets it to the default |
| `coordination-protocol-fixtures-valid` | Coordination protocol definitions validate | `coordination protocol fixtures retired` | info | none |
| `operation-prompt-templates-valid` | Operation prompt templates validate | names the template | you | Fix the named template |
| `coordination-example-requests-valid` | Published coordination example requests validate | `coordination example requests retired` | info | none |
| `shadow-binder-divergence` | Placement shadow-binder divergence is recorded durably | names the divergence | info | Report it |
| `observe-dir-writable` | `.fgos/observe` is writable | names the path | you | Fix directory permissions |
| `observe-friction-migrated` | Legacy friction records are migrated to `.fgos/observe/friction` | `N legacy work.friction record(s) newer than cursor (not migrated) -- run: <host binary> friction migrate --dir <project>` | you | Run the named command. `friction` is a Rust host verb (`.fgos/installation/bin/fgos`, or `FGOS_HOST_BIN`); the Node `fgos` entry has no such verb and no registered fix does it |
| `observe-host-resolvable` | The Rust host resolves and supports observe commands | `host binary unavailable (FGOS_HOST_BIN unset and no active installation ...)` | you | `fgctl repair` |

### 4.6. Docs and generated projections

| Id | Checks | Typical failing message | Who | Fix |
|---|---|---|---|---|
| `enduser-docs-index-stale` | `docs/enduser-docs-index.json` covers every end-user doc | `N/M docs in the index` | tool | `fgos doctor --fix` (same as `fgos docs-index`) |
| `decision-index-stale` | `docs/decisions/index.md` matches the logged decisions | `... is stale` | tool | `fgos doctor --fix` |
| `doc-registry-stale` | `docs/doc-registry.md` and `.json` are current | `docs/doc-registry.md or docs/doc-registry.json is stale -- run fgos doc-registry` | tool | `fgos doctor --fix` |
| `doc-alias-broken` | Doc aliases point to valid paths | names the alias | you | Fix the alias target |
| `doc-active-duplicate` | No duplicate active docs for one topic and role | names the pair | you | Retire one |
| `doc-current-path-missing` | A doc's `currentPath` exists at HEAD | `1 doc(s) with currentPath absent at HEAD` | you | Restore the file or update the registry entry |
| `doc-source-unreachable` | Source capture linkage is reachable | names the capture | you | Repair the link |
| `doc-near-duplicate` | No near-duplicate authoritative claims | names the pair | you | Merge the docs |
| `doc-provisional-aged` | No provisional doc is past its age limit | names the doc | you | Promote or retire it |
| `doc-topic-oversized` | No topic is over its size ceiling | names the topic | you | Split the topic |
| `doc-role-underused` | Role usage frequency | `362 roles used by single doc ...` | info | none |
| `doc-source-conservation` | Source captures are conserved | `4 outcome source capture(s) unresolvable` | info | Report it |

The doc-* checks pass with "skipped" in a project that has no knowledge
registry (no events log yet).

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
runner picks executors from that capability's pool in
`<project>/.fgos/config.json`:

```json
"runner": { "capabilities": { "nominal-group:generate": {
  "prefer": [
    { "executor": "claude-herdr" },
    { "executor": "xai", "invocation": "pi-herdr-vantt" },
    { "executor": "openai" },
    { "executor": "glm", "invocation": "pi-cli-bwrap-openrouter" }
  ] } } }
```

A panel or reviewed unit has roles that must come from different provider
families (a synthesizer may not share a family with the panelists it
summarizes). With three panelists you need a fourth family for the synthesizer;
three families fail on the synthesizer after the panelists already ran. The
`workflow-pools-satisfy-independence` check finds this before a paid run.
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

### 5.4. Run from inside the project

Run `fgos workflow start ...` (and `workflow status`, `answer`, `resume`) from
the project's root, using the project's own installed `fgos`
(`.fgos/installation/bin/fgos`, or the `fgos` on your `PATH` that resolves to
it). Do not run another checkout's `bin/fgos.mjs` from a different directory with
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
| `.fgos/assignments/<unit-run>/<role>/<n>/runs/<NN>/herdr-diagnosis.json` | What herdr said about the agent when the round did not settle: agent state, the detection rule that matched, the last screen |
| `.fgos/assignments/<unit-run>/<role>/<n>/runs/<NN>/{result,evidence,exit}.json`, `stdout.log`, `stderr.log` | The agent's result and logs |

### 6.3. The outcome `blocked`

`blocked` means the agent stopped at something only a person can answer, for
example a "Trust this folder?" dialog. The failure text ends with:
"Answer the prompt in the pane, or grant trust for this project in the agent's
own home, then run again." Concretely:

1. Open `visibility.json` of the failing round. A `trustSeedFailed` value names
   the agent home and says the project root "is not itself trusted ... so there
   is nothing to derive trust from": trust is missing, fix it as in 5.3.
2. Open `herdr-diagnosis.json` and read `detectionScreen` to see the actual
   dialog. If it is not a trust prompt (a login, a quota screen), solve that in
   the agent CLI.
3. If the pane is still open (the failure text says "Pane ... is left open"),
   you can answer it there, but the run has already ended as failed. Grant trust
   and start the run again; a run does not retry itself past a blocked outcome.
4. Re-run `fgos doctor`: `agent-cli-project-trusted` should now be green.

### 6.4. Other failures

| Symptom | Likely cause | What to do |
|---|---|---|
| Step refused with `policy-refusal ... violates independence requirement against [...]` | Pool lacks enough provider families | Add a family to the pool (5.2); the panelists already ran |
| `execution-timeout` after a long wait | An agent looped or stalled. A busy stream is not treated as idle | Read the round's `stdout.log` and `herdr-diagnosis.json`; consider a different executor in the pool |
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
