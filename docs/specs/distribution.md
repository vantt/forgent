---
area: distribution
updated: 2026-10-16
sources: [distribution-packaging, str76-runner-bootstrap, str77-79-doc-gap-fixes, str87-fgos-install-ux, str88-fgos-pnpm-lifecycle, str87-fgos-setup-doctor]
decisions: [12aedbc8, 469f4c79, 5d669ff6, 38f7e0b8, ea8b9a8d, cbb4736a, 862ac01f, b799cbaa, 563db0a9, e52cc667, e8852403, 4cb11e46, 589eb4b0, 175cfc08, 1005dae0, 4206a0a6, 7d982955, ef531b22]
coverage: full
---

```txt
Legacy status: Promoted source
Promoted to:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/history/distribution-baseline.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Generated/curated source facts during migration
Do not use this legacy file for: Final human navigation or post-migration authority
Last reviewed: 2026-09-13
```

# Spec: Distribution

How a developer gets the `fgos` and `fgos-runner` commands running — either
onto their own machine and into their own project from outside the forgent
source repository, or directly from inside a checkout of the source
repository itself, without a separate install. Used by: a developer who
wants to run `fgos` in a project that is not this repo, and a forgent
contributor working inside this repo's own checkout (or a linked worktree
of it).

## Entry Points & Triggers

- `npm install -g github:vantt/forgent` (run anywhere) → resolves and installs
  the `fgos` command globally from the forgent GitHub repository.
- After install, `fgos init` (run inside the target project) → on the npm
  channel it refuses (`git-addon-unavailable: addon not shipped on this
  channel: onboard this project with fgctl init`) and changes nothing: this
  channel ships no native Git addon and Git has one door, so a project is
  onboarded with `fgctl init`, whose activated release carries the addon. The
  init/doctrine/marker-detection behavior itself (owned by the coexistence
  area, see `docs/coexistence.md`) runs from that activated release.
- Sourcing the dev checkout's shell helper file from a contributor's own
  shell profile → makes `fgos` and `fgos-runner` available directly from any
  location inside a checkout of the forgent source repository itself
  (including a linked git worktree of it), with no separate install step.
- `fgos setup` (run anywhere) → deprecated legacy compatibility command;
  wires the shell helper's source line into every shell profile the caller
  actually has, and brings the local config file up to date with the current
  defaults. New workspace onboarding should use `fgctl init` (which
  downloads the latest release when `.fgos/distribution.json` is absent, RUL15 (fgctl init downloads a checksum-verified release when no source is given))
  plus local `fgos doctor --fix` and `fgos doctor`; `doctor --fix` runs only registered fixes, so the
  config defaults, hook wiring and Claude Code hook still come from one `fgos
  setup` in the project. Shell/global integration remains legacy setup
  compatibility until the compatibility-window decision retires it.
- `fgos doctor` (run anywhere) → reports whether the environment is set up
  correctly (Node/git present, shell helper sourced, config up to date).

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). Its locks are holder-lock kernel locks under the machine lock root (row 5g): `provider-state` guards this file, and `provider-account/<provider>/<account>` guards one account while a renewal or unlock probe runs through it, held until that call and every process it started have exited. The same directory holds `account-locks/<provider>/<account>/`: copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |
| 5g | Lock directories and the lock config key | `<lockRoot>` = `<stateRoot>/locks` (machine-scope lock files: `full-suite`, `provider-account/<provider>/<account>`, `provider-state`, `install`) and `<fgosDir>/locks` (repo-scope lock files: `gateway`, `runner`, `sessions`, `reconcile`, `main-checkout`, `worktree-admin`, `merge-slot--<encodeURIComponent(ref)>` per target ref, `state.hot` and `state.reclaim.lock`, `porting-events.hot` and `porting-events.reclaim.lock` (the state store's hot mutex: the `.hot` record is not a kernel lock file, only the `.reclaim.lock` file is), `activation`, `observe`, and `dispatch-cwd--<dev>-<ino>` keyed by the dispatch directory's identity after realpath; the run locks live in their run: `<workflowRunDir>/locks/advance.lock`, `<runDir>/locks/recovery.lock`), both created by `fgos setup` (the machine root with mode 0700); `stateRoot` is the single resolution of `docs/platform/holder-lock/spec.md` §11 (`FGOS_STATE_ROOT` pinned by the host, else `FGOS_STATE_HOME`, `XDG_STATE_HOME/fgos`, `HOME/.local/state/fgos`). One config key, `lock.predecessorKillWaitMs` (`registerConfigDefault({id: 'lock', key: 'lock', shape: {predecessorKillWaitMs: 2000}})`): the longest wait, after the processes of a dead previous holder have been terminated, for them to exit before the lock is handed over; it never waits for a live domain to drain. Global first, project on top; the merge adds the key only when it is missing. Lock files are never packaged, committed or repaired; `lock-kernel-semantics`, `lock-holders`, `lock-record-unreadable`, `lock-fences`, `lock-predecessor-kill-wait` and `state-root` report them (row 7) | two directories plus one integer key | no (created by setup; the key defaults to 2000 ms when absent) | `lock: {predecessorKillWaitMs: 2000}` |
| 5h | Terminal-control directory and the `terminal` config key | `<stateRoot>/terminal` (one subdirectory per driver; allocation records and their markers, a cache of what the port opened: deleting it never closes a pane because nobody closes a pane that has no record), created by `fgos setup` with mode 0700 (the `terminal-dir` fix). One config key, `terminal` (`registerConfigDefault({id: 'terminal', key: 'terminal', shape: {allocationGraceMs: 60000, retainFailedPaneMs: null, layout: {policy: 'measured-split', minCols: 80, minRows: 20, maxPanesPerTab: 8}}})`); `docs/platform/terminal-control/spec.md` §9 gives each number's source. Project over global over default; the merge adds a missing key only. No new environment variable (`FGOS_HERDR_ANCHOR_PANE` stays, as the input of `attach`). Checked 2026-10-18: the release active in the forgentX, mdview and mcp-skill-hub workspaces (one digest) accepts a `terminal` section in the global and in the project config, so the key is written like `lock`; had it refused unknown keys, setup would have written it to the project config only until all three workspaces ran the new release. | `<stateRoot>/terminal` present / absent; config key present / absent | yes (computed, not stored) | — |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `lock-kernel-semantics` (for the workspace lock directory and the machine lock root: the holder-lock driver's guarantee through the host's lock-fd route, then a two-process probe on that same mount, a description locked here and handed to a child must read held while the child lives and free once it died; prints driver, exclusion, borrow and holders levels; kernel with a green probe passes, a missing directory warns until setup creates it, a guarantee of unsupported (a platform with no driver) and a network filesystem none fail by name; on Windows the probe runs over a lock-hold helper and the message shows lockfileex), `lock-borrow-vectors` (runs the host's lock-borrow-vectors route: a lock description borrowed by a git child must not leak to any background process git starts; any red vector or a red sibling check fails, unavailable fails, since activation refuses the same result and there is no run-time switch that disables borrowing; runs on Windows with its own pid-handle assertion), `lock-holders` (for every existing lock file of the locks this release cut over, including the main checkout, merge slot and worktree-admin files, the holders the kernel lists: a holder that is neither a fgOS process, by the host's state-root pin or a fgOS payload in its argv, nor a borrowed child of that lock warns with pid and cmdline; a predecessor record next to a lock file naming a domain that is not empty, an unknown record version or a Windows job the host does not judge empty (read-only, through the host's lock-fd route with --predecessor-state) warns with the domain and the reason; holders that cannot be listed are informational), `lock-record-unreadable` (the state and porting-events hot records of the workspace, under .fgos/locks: a record that does not parse, or one whose holder the judge cannot place for more than five minutes, warns with the path and the fence command of the lock verb; absent, alive or dead holders pass; no automatic fix, because a person confirms the holder is gone; never fails), `lock-fences` (every legacy lock path of the registry has its cutover fence, tombstone or blocking generation (the main checkout lock, one merge slot per local branch and the three old state store locks, the old events, claims and porting events lock files, among them; a per-run `.recovery.lock` tombstone only for a run from before the cutover, so a run holding `attempt.lock` is not counted); a missing one warns and names the fix, and an old lock file still present is named because it blocks that fix), `lock-predecessor-kill-wait` (reads lock.predecessorKillWaitMs from the project config, else the global one, prints the value and its source; not an integer from 1 to 60000 fails by name, an unparseable config fails; absent passes with the default 2000), `state-root` (state root, lock root and their source as Node resolves them and as the Rust host answers for the same environment; a difference fails; a pinned root also shows what the host resolves without the pin), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the precompiled form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; the check reports a missing, unreadable or stale file and domain YAML that cannot be parsed, and a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `terminal-control` (the terminal-control driver answers through the internal route: driver, declared capabilities and the herdr server incarnation are printed; a missing herdr only warns, a missing layout.geometry capability is information, and a bad FGOS_HERDR_ANCHOR_PANE fails), `terminal-config` (the terminal section after the merge, each value with its source; fails by name on a grace below the ready timeout plus 30 s, a retain time that is neither null nor a positive integer, an unregistered policy, or limits that are not positive integers or sit below the measured floor of 40x8), `terminal-allocations` (slots past terminal.allocationGraceMs that never launched and retained panes past their time, from the route's reconcile-scan; reports only, closes nothing), `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover the default tier, runner.defaults.tier, for every registered executor), `executor-family-unique` (two agent executors of one provider family fail, naming both), `executor-skills-installed` (every skill an agent executor declares in its supports.skills has a SKILL.md in its runtime's skill directory of the main checkout, chosen by each invocation's CLI (claude: .claude/skills, codex: .agents/skills, omp: .omp/skills, pi: .pi/skills, grok: .grok/skills), every invocation of an executor must have the skill; a missing one fails naming the path and the remedy; a CLI with no known skill directory is reported as not checked), `model-policy-pools` (a tier cell entry model@pool whose pool runner.llmAccounts does not declare warns; not evaluated when no cell names a pool), `llm-accounts-shape` (every problem the runner.llmAccounts reader finds fails: an inventory in the project config, a pool name with an at-sign or another spelling of a family, an account without a credentialStore directory), `llm-accounts-vs-legacy` (when runner.llmAccounts is declared, accounts or login directories that differ from runner.providers, which the lease still reads, warn), `global-model-policies-portable` (a list or model@pool cell in the global runner.modelPolicies fails, since older releases on the machine cannot read it), `tier-fallback` (a family `runner.tierFallback` lists for a tier that has no `modelPolicies` cell at that tier, or no agent executor, warns: the walk skips it; never fails), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot), `process-containment`, `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`, `gate-kill-grace`, `legacy-attempts-stuck`, `units-awaiting-resume`, `cancel-wait`. The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `terminal-dir` (creates the terminal directory under the state root with mode 0700 when missing, and tightens an existing one to 0700), `lock-dirs` (creates the workspace lock directory and the machine lock root with mode 0700 when missing, and tightens an existing one to 0700, since the first lock taken before setup may have created it with the umask's mode), `lock-fences` (the stop-everything cutover of holder-lock for this workspace: acts only when the workspace's activated release ships the lock registry in its payload, because fencing a workspace that still runs the old lock code would stop it, and then only for the locks that registry names, so the fgctl activation lock, the machine install lock and the Observe store lock are fenced once the release that takes them as kernel locks is the activated one, never before (an older fgctl would meet the tombstone at its own lock path and could no longer upgrade the workspace); then the quiesce scan, the fences by exclusive mkdir or ledger link, and the scan again; with a blocker on the first scan nothing is placed and the processes are listed; an old lock file still in use stops it with v1-lock-present and the path, nobody's file is removed; see the holder-lock platform spec), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `runtime-socket-dir`, `run-attempts-stuck`, `legacy-attempts-stuck`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 7c | Doctor check `process-containment` | Which process-containment driver this machine would pick for an attempt (`bwrap-pidns`, `linux-pgroup`, `windows-job`, `macos-tree`), the level it gives and the named escapes; read from the host route's `--protocol 1 --probe` answer (`docs/platform/run-supervisor/spec.md` §14, `docs/platform/process/spec.md` §10) | passed with `kernel`; warning with the name `best-effort` (Linux without a user namespace, macOS); never a failure for being best-effort | yes (computed) | — |
| 7d | Doctor check `runtime-socket-dir` | The run supervisor's runtime socket directory (`$XDG_RUNTIME_DIR/fgos`, else `/tmp/fgos-<uid>`): exists, mode 0700, owned by the user, short enough for a unix socket path. `fgos setup` creates it; the fix creates it too | passed / failed (missing, wrong owner or mode, too long) | yes (computed) | created by setup |
| 7e | Doctor check `run-attempts-stuck` | Runs with an envelope v3 and no `closed.json` whose attempt lock is free, counted by `fgos internal adopt --scan --probe-only` (writes nothing, takes no lock); the fix drives them to closed through the one sweep (`sweepAttempts`) | passed / warning with the count | yes (computed) | — |
| 7f | Doctor check `run-supervisor-route` | The active host binary answers `--protocol 1 --probe` with `result: ok` for each of `fgos internal supervise`, `gate`, `adopt`, `attempt-step` | passed / failed naming the route or the protocol mismatch | yes (computed) | — |
| 7g | Doctor check `gate-kill-grace` | The config key `dispatch.gateKillGraceMs` (the SIGTERM to SIGKILL grace of the launch gate): value and source (`project`, `global`, `default`); project overrides global; setup does not write the key into the global config until every workspace runs a release that knows it | passed with the value (absent: default 10000); failed when not an integer or below 1000 | yes (computed) | 10000 |
| 7h | Doctor check `cancel-wait` | The config key `dispatch.cancelWaitMs` (how long a controller stopped by Ctrl-C or SIGTERM waits for its attempts' receipts), read by the same reader as `gate-kill-grace`: value and source (`project`, `global`, `default` = grace + 5000); an unusable value, below 1000 or shorter than the grace, fails | yes (computed) | — |
| 7i | Doctor check `legacy-attempts-stuck` | Runs from before the run supervisor still `running`: fails while one is provably dead (every recorded pid dead, no version-1 home), warns with the reason for each run that is kept; fix settles the provable ones as `abandoned-legacy` | yes (computed) | settled in `run.json` by fix |
| 7j | Doctor check `units-awaiting-resume` | Unit runs whose controller is gone and whose last attempt is closed, with the `fgos run --resume <unit>` command; warns, never fails | yes (computed) | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

## Behaviors & Operations

### Install

- **Blocked when:** the installer's machine cannot reach GitHub over the
  network, or does not have Node.js 18+ available.
- **What changes:** the installer's package manager (npm, pnpm, or yarn)
  resolves the forgent GitHub repository, packages it according to the
  distribution file allowlist, and installs both CLI entry points — `fgos`
  and `fgos-runner` — into the caller's chosen install location (global or
  project-local, per the installer's own install flags), both immediately
  executable. The install resolves against whatever ref the installer's own
  command names: a tagged release commit when the command names a tag
  (`README.md`'s recommended path,
  `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md`),
  or the source repository's default branch when it doesn't (the
  bleeding-edge path README also documents) — preparing release metadata is
  scripted by `npm run release:prepare -- <tag>`, but tag-cutting itself stays
  a manual, repo-owner-judgment act (per tsk-jtb). Pushing a `v*` tag then
  triggers the release workflow that builds assets, verifies the external
  consumer path, and publishes the GitHub Release. The
  install runs
  no lifecycle script of its own — there is nothing for a package manager's
  build-script policy (e.g. pnpm's `allowBuilds`) to approve or block, so the
  install succeeds the same way regardless of which of the three package
  managers runs it (per str88-fgos-pnpm-lifecycle).
- **Side effects:** none beyond the local install; no registry account is
  created or touched, and nothing is published to the public npm registry.
- **Afterwards:** the installer has a working `fgos` command. The content
  they received is limited to the distribution file allowlist — the source
  repository's own internal data (its live event log, its own dogfood
  runner configuration, its test suite) is never part of what they receive.
  The installer also receives the end-user documentation subset (how-to
  guides, design-rationale docs, and the read-by-tag index) — every link the
  README's Documentation section points to resolves to a file that is
  actually present in what they installed; contributor/maintainer-only docs
  (decision records, area specs, the product backlog, platform foundations)
  are not part of the install and are not linked from that section — a
  reader who wants those clones the source repository instead.

### Dev checkout shell helpers

- **Blocked when:** the current location is not inside any git repository —
  sourcing the helper file still succeeds (it only defines functions), but
  calling `fgos` or `fgos-runner` then fails immediately with a clear error
  and a non-zero exit, before anything is invoked.
- **What changes:** once sourced, `fgos` and `fgos-runner` become available
  as ordinary shell commands. Each resolves the checkout's own root the
  moment it is called — using the current location, not where the file was
  sourced from — then runs that checkout's `fgos`/`fgos-runner` entry point
  with whatever arguments were passed.
- **Side effects:** none — nothing is installed, no file outside the current
  shell session is touched, and no other install mechanism (npm or
  otherwise) is affected.
- **Afterwards:** a contributor working anywhere inside a checkout of this
  repository — the main checkout or a linked git worktree of it — has both
  commands available without a separate install, and without needing to
  remember or type the checkout's own path. Sourcing the file is always the
  contributor's own explicit action; nothing in this repository sources it
  for them.

### Contributor hooks setup

- **Blocked when:** never — this is an explicit command a contributor runs
  themselves; it always runs when invoked.
- **What changes:** running the setup command wires up this repository's
  pre-commit hook for the person who just cloned it. It is never triggered
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle)
  — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.
- In fgOS source checkouts, the hook refuses newly staged root files outside
  its own allowlist, including linked worktrees and `fgw/*` branches. Existing
  root modifications/deletions remain permitted. Allowlist changes must land
  separately on main before root additions use them; the index cannot authorize
  itself. Merge commits skip only this root guard, never existing data-loss
  guards. `main-checkout-hook-wired` diagnoses wiring using the existing check.
- In fgOS source checkouts, the hook sends newly staged, copied, or renamed
  Markdown files directly under `plans/reports/` and `plans/journals/` to the
  native Convention checker. Violations and unavailable, old, or failed hosts
  emit warnings only; the hook never blocks the commit for Convention results.
  Nested evidence and per-plan `reports/` directories are outside this scope.


### Setup

- **Blocked when:** never — running `fgos setup` always attempts its work;
  a shell profile that does not exist is simply skipped rather than
  refused.
- **What changes:** for every shell profile the caller actually has (bash's
  and/or zsh's, whichever exist), the shell helper's source line is added
  if not already present — never duplicated on a repeat run. The local
  project config file is also brought up to date: any setting present in
  the current default schema but missing from the caller's file is added,
  without ever changing a setting the caller already customized; a config
  file that already has every current default is left untouched. The same
  fill-missing-only treatment is applied to the **global** config file
  (`~/.fgos/config.json`, tsk-1ri) — `fgos setup` initializes it with the
  same default schema the project-local file gets, or fills in any missing
  key, every time it runs, regardless of which project it's run from;
  a value the caller already customized at the global level is never
  overwritten. The lock directories of row 5g are created when missing:
  `<lockRoot>` and `<fgosDir>/locks`, both mode 0700, an existing one tightened to it (the `lock-dirs` fix);
  the `lock` config section (`predecessorKillWaitMs: 2000`) is one of the
  defaults the fill-missing-only merge adds, and so is the `terminal` section
  of row 5h; `<stateRoot>/terminal` is created with mode 0700 (the
  `terminal-dir` fix). Because setup runs every
  registered fix, it also attempts the `lock-fences` cutover step (row 7b),
  which places nothing unless the workspace's activated release already
  runs holder-lock and no other fgOS process of the workspace is running.
- **Side effects:** the caller's own shell profile file(s), local project
  config file, global config file (`~/.fgos/config.json`), and the two lock
  directories may be created or modified; nothing outside the caller's own
  environment is touched, and no network access happens.
- **Afterwards:** the caller sees exactly what changed — which profile
  file(s) gained the source line (or already had it), which project config
  settings were newly added (or that none were needed), and which global
  config settings were newly added (or that none were needed, or that the
  global file was just created). Nothing is done silently; running `fgos
  setup` again when everything is already current reports that plainly,
  without repeating any change.

### Doctor

- **Blocked when:** never — `fgos doctor` always runs every check and
  reports the result; it never fails the invocation itself, only reports
  individual checks as passing or not. Exit stays 0 because `fgctl
  init|upgrade|repair` run it as their tail and mark the install degraded on
  a non-zero exit; `--strict` is the opt-in that exits 1 when any check fails.
- **What changes:** nothing — this is a read-only diagnostic. It never
  writes a config file, never modifies a shell profile, and never installs
  anything, even when a check reports a problem (`config-not-stale`
  failing on a missing config file reports that plainly rather than
  creating one).
- **Side effects:** none.
- **Afterwards:** the caller sees each named check (Data Dictionary #7) and
  whether it passed, including enough detail to know what to do next (e.g.
  which config settings are missing, or that `fgos setup` has not been run
  yet).

## Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer / contributor |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |
| Source the dev checkout shell helper file | n/a (nothing to source outside a checkout) | ✓ (opt-in, from their own shell profile) |
| Run `fgos setup` (writes shell profile + config) | ✓ | ✓ |
| Run `fgos doctor` (read-only diagnostic) | ✓ | ✓ |

## Business Rules

- **RUL1 (distributed package never includes the source repo's own runtime data).** The distributed package never includes the source repository's own
  runtime data directory or its own dogfood runner configuration — install
  content is always limited to the distribution file allowlist.
- **RUL2 (distribution is a GitHub install, not an npm registry publish).** Distribution happens by installing directly from the GitHub
  repository, not by publishing to the public npm registry — no package
  rename and no registry publish credentials are involved.
- **RUL3 (install never changes init/doctrine/marker-detection behavior).** Installing fgos does not change init/doctrine/marker-detection
  behavior in any way — that behavior belongs entirely to the coexistence
  area and is unchanged by installation.
- **RUL4 (every README Documentation link resolves to a shipped file).** Every link in the README's Documentation section resolves to a
  file that is actually present in the distribution file allowlist — a link
  to content that isn't shipped is a defect, not an acceptable pointer to
  "clone the repo for more" (per str77-79-doc-gap-fixes / ea8b9a8d).
  Contributor/maintainer-only documentation (decision records, area specs,
  the product backlog, platform foundations) is intentionally excluded from
  both the allowlist and that section — it is out of scope for an installed
  end user, not an oversight.
- **RUL5 (dev checkout shell helper is never sourced automatically).** The dev checkout shell helper file is never sourced automatically
  by any install step or other mechanism in this repository — a contributor
  adding it to their own shell profile is always their own explicit,
  separate action.
- **RUL6 (install never runs a lifecycle script).** Installing (from any of npm, pnpm, or yarn) never runs a lifecycle
  script of its own — the contributor hooks setup is always a separate,
  manually-invoked command, never an automatic `prepare`/`postinstall` step
  (per str88-fgos-pnpm-lifecycle). This is what lets every package
  manager's own build-script approval policy stay out of the way entirely,
  rather than needing to be satisfied.
- **RUL7 (setup/doctor cover both bash and zsh).** `fgos setup` and `fgos doctor` both cover bash and zsh — neither
  shell is treated as a lesser case.
- **RUL8 (setup's config update never overwrites a customized setting).** `fgos setup`'s config update never overwrites a setting the
  caller already customized, at any nesting depth; array-valued settings
  are never partially merged, only added wholesale when entirely missing.
- **RUL9 (doctor's default path never writes anything).** `fgos doctor`'s default (no `--fix`) path never writes
  anything, under any circumstance, including when a check would
  otherwise need to create a file to check it — a missing config file is
  reported as missing, never created as a side effect of checking.
  `--fix` is the deliberate exception: it runs every registered fix
  (Data Dictionary #7b) before re-reporting checks — reversed from the
  original no-exceptions wording per `tsk-2qz`, which reverses this
  rule and RUL11 (doctor --fix exists and is real, runs every registered fix) together (`docs/history/doctor-fix-gate-bypass/
  CONTEXT.md`).
- **RUL10 (setup never asks for confirmation, acts then reports).** `fgos setup` never asks for confirmation before writing to a
  shell profile or the config file — it acts and then reports exactly what
  it changed. Every other verb, and both of these two without
  `--pretty`, still produce the same enveloped-JSON result shape as before
  this feature — `--pretty` only changes how that same result is displayed,
  never what it contains.
- **RUL11 (doctor --fix exists and is real, runs every registered fix).** `fgos doctor --fix` exists and is real: it runs every fix
  registered via `registerFix` (Data Dictionary #7b) against the current
  cwd before re-reporting checks, then returns the same checks shape as
  the no-flag path plus a `fixed` array. The fix list is a registry, not
  a fixed set — a module can register a new one the same way a check or
  config-default is registered, independent of either (per tsk-2cs). This
  supersedes the original v1 "does not exist yet, Deferred Idea" wording
  — `tsk-2qz` reverses that decision deliberately, per
  `docs/distribution-vision.md` §3's trụ cột 3.
- **RUL12 (setup also runs every registered fix, unconditionally).** Legacy `fgos setup` also runs every registered fix (the same
  `runFixes()` `doctor --fix` calls per RUL11 (doctor --fix exists and is real, runs every registered fix)), unconditionally and with no
  confirmation — consistent with RUL10 (setup never asks for confirmation, acts then reports)'s own act-then-report contract for
  this deprecated compatibility verb, not an exception to it. `setup`'s result gains a `fixed` array,
  the same per-entry `{id, changed, message}` shape RUL11 (doctor --fix exists and is real, runs every registered fix) already describes
  for `doctor --fix`'s own (per `tsk-5hi`,
  `docs/history/setup-runs-registered-fixes/CONTEXT.md`).

- **RUL13 (customer customization lives in one tracked workspace folder; fgOS reads it first and never writes it; specified 2026-10-07; the lookup, the same-tier rule and the doctor check are built (runner decision 0057), the `fgctl init` skeleton and README are not).** A customer project that wants its own agent definitions (persona, role, decision boundary) puts them in `fgos/agents/<name>.yaml` at its project root. It is not `.fgos/`: that folder is runner state, ignored by git (`/.fgos/*`), every merge that stages a change under it is refused (`fgos-write-rejected`), and a fresh worktree has it stripped (ADR0020 (the runner strips .fgos/ from every fresh worktree)). It is not `.agents/` either: that is generated skill output which `fgos setup` and `npm run build:skills` rewrite. The first scope is `agents/` only; `workflows/`, `task-specs/` and `skills/` follow the same layout when a customer needs them, not before.
  - Lookup, by name, first match wins: the workspace folder, then a domain or extension (`domains/<name>/agents/`), then the installed `core/agents`. A higher tier replaces the whole file of a lower one; fields are never merged. Two definitions of one name in the same tier are an error that `fgos doctor` reports, never a silent pick. This replaces the earlier rule that a name is unique across `core/agents` and every domain: a name is unique within a tier and a higher tier shadows a lower one.
  - fgOS creates the folder and a README once, at onboarding (`fgctl init`), and never edits it afterwards; an fgOS upgrade never touches it. The installed tier is located through the release manifest, never through the working directory or PATH.
  - Built: `src/runner/agent-definitions.mjs` is the one lookup (workspace, then `domains/*/agents/`, then `core/agents/`; a project without its own `domains/` or `core/agents/` folder reads the running package's). `fgos workflow start --seats "@name|..."` uses it and pins the text at start. The doctor check `agent-type-names-unique` now means unique within each tier, covers `fgos/agents`, and reports which definition each customization replaces. The unit-level and capability-level `persona:` names still read `core/agents` of the working project at dispatch.
  - A doctor check registers with the feature and reports each customization, which installed definition it shadows, whether it has the shape the loader needs, and a shadowed core name or an override that no longer fits the installed set after an upgrade.
  - Not customizable here: executor, model and provider policy (`config.json`) and the platform laws. An extension is treated as a domain until an extension loader exists.
  - No component-boundary change: it extends the three-tier discovery convention coordination protocols already use (project, `domains/<name>/`, packaged `core/`) to agent definitions.

- **RUL14 (the lazy-probe unlock rule: moved).** The rule that unlocks an account locked for a dead login with one real call now lives with the provider-capacity rules in `docs/specs/runner.md` (RUL74 (lazy-probe unlock: an account locked for a dead login unlocks itself after one real call that succeeds)), together with the refresh-ahead and write-back rules for a rotating login (RUL75 (a rotating provider login is renewed once at the source, in a copy fgOS holds, and a login renewed inside a private home is written back)). This document keeps only where the state lives (row 5d).
- **RUL15 (`fgctl init` needs no hand-downloaded tarball: it picks its release by a fixed precedence and downloads it checksum-verified; 2026-10-12).** The release `fgctl init` installs comes from the first of these that is set:
  1. `--from <path | URL>` on the command line;
  2. the `FGCTL_FROM=<path | URL>` environment variable (same meaning as the flag, for a non-release build: a `.tar.gz`, a release directory, or a URL);
  3. `FGCTL_VERSION=<tag>`, which downloads exactly that tag's asset (needed for a pre-release, which "latest" never selects);
  4. the release pinned by the project's committed `.fgos/distribution.json` (no network when that release is staged on the machine; otherwise see "The pin records the tag" below);
  5. otherwise the latest GitHub release, found by following `<repo>/releases/latest` to its tag.
  - An explicit source (1-3) beats a pin; the pin then only validates what was fetched (a different digest is refused as a pin mismatch, as for `--from` today). The inputs are read per invocation; nothing is remembered.
  - **The pin records the tag.** When `fgctl init` or `fgctl upgrade` installs from a download (latest or `FGCTL_VERSION`) and writes `.fgos/distribution.json`, it stores the resolved tag in `projectRuntime.releaseVersion` next to the digest (a local or URL source writes a digest-only pin with a null `releaseVersion`, never the build's own manifest version, which is not a download name; `init` never rewrites an existing pin, while `upgrade` rewrites the pin to the upgraded release). A pin with a tag whose digest is not staged on this machine (a teammate's fresh clone, or a quarantined release) makes a plain `fgctl init` download that tag, checksum-verified; the pin's digest must equal what was fetched, else `pin-mismatch` and nothing is activated. A tag written without the leading `v` (a hand-edited pin, for example `0.2.0`) is read as `v0.2.0`, the form releases are tagged in; if the download still fails, the error names the pinned tag and points to `FGCTL_VERSION` and `FGCTL_FROM` instead of surfacing a bare HTTP error. A digest-only pin (no tag) keeps the old behavior: it needs `--from`, `FGCTL_FROM` or `FGCTL_VERSION` on a machine that has not staged it.
  - A download fetches `fgos-<tag>-<target>.tar.gz` and `SHA256SUMS` through the system `curl` with the same flags, timeouts and `FGCTL_ASSET_BASE_URL` override as `install.sh`; there is no HTTP/TLS library in `fgctl`. The target is detected the way the installers do (`FGCTL_TARGET` overrides; `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` are supported, see RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)) and an unsupported target refuses before any request.
  - Verification is mandatory: the asset's own entry in `SHA256SUMS` (file name matched exactly) must equal the downloaded file's SHA-256, otherwise `fgctl init` / `fgctl upgrade` refuses and writes nothing (no staging, no pin, no activation). A URL source must have `SHA256SUMS` in the same directory; a local path is trusted as given. The download lives in a private scratch directory under `${TMPDIR:-/tmp}/fgos-work/` that is removed when the command returns, success or not.
  - The project must be inside a git repository, checked before any request is made (unchanged). `fgctl upgrade` resolves its candidate by `--from <path | URL>` > `FGCTL_FROM` > `FGCTL_VERSION` > the latest GitHub release (it ignores the current pin so a plain `fgctl upgrade` moves to the latest release). `fgctl stage` still takes only `--from <path>`; it does not download.
  - `curl` is an assumed tool (on Windows, the `curl.exe` that ships with Windows 10 and later): the `curl-available` doctor check reports it.
- **RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell; 2026-10-13).** fgOS runs from a plain PowerShell or `cmd.exe` session on Windows 10 and later, with no Git Bash and no WSL.
  - **Assets.** A release publishes, per target, `fgos-<tag>-<target>.tar.gz` and `fgctl-<tag>-<target>.tar.gz` for `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc`, one `SHA256SUMS` covering every asset, and both installers (`install.sh`, and `install.ps1`, which lives at `scripts/install.ps1` in the repository because the root-file allowlist is closed and is published under the name `install.ps1`). `tar.gz` is the one archive format on every target: Windows 10 and later ship `tar.exe` and `curl.exe`, and the Rust extractor already reads it. The Windows `fgos` tree carries the host as `bin/fgos.exe` (and `bin/fgos`, the manifest's entry name), a `bin/fgos-runner.cmd` beside the `sh` form of `bin/fgos-runner`, and declares `target: {os: windows, arch: x64}`. The Linux asset is built on `ubuntu-22.04`, and the build fails when a shipped binary needs a glibc symbol newer than `GLIBC_2.35` (`scripts/check-glibc-ceiling.sh`), so a binary never prints a loader error on the oldest supported distribution. A new platform is one row in `src/util/release-targets.mjs`, one in the Rust `host_target` table, one in each installer and one release-workflow matrix entry; macOS is not published.
  - **`install.ps1`.** Same contract as `install.sh`: `FGCTL_VERSION`, `FGCTL_INSTALL_DIR` (default `%LOCALAPPDATA%\fgos\bin`), `FGCTL_ASSET_BASE_URL` (http, https or `file://`), `FGCTL_TARGET`; the tarball's own `SHA256SUMS` entry must match or nothing is installed; a symlinked `fgctl.exe` is refused; every request is bounded by a timeout. It needs no administrator rights (an elevated session is refused unless `FGCTL_ALLOW_ROOT=1`, as `install.sh` refuses root), never changes `PATH`, and prints the commands that do. Like `install.sh`, with no `FGCTL_VERSION` it installs the latest NON-prerelease, so a pre-release needs `FGCTL_VERSION`.
  - **Workspace launchers.** `fgctl init` and `fgctl repair` write four launchers into `.fgos/installation/bin/`: the `sh` pair `fgos`, `fgos-runner` (Linux, macOS, Git Bash) and the batch pair `fgos.cmd`, `fgos-runner.cmd` (PowerShell, `cmd.exe`; no `sh` involved). Each reads `activation.json`, refuses with exit 3 unless `status` is `ready`, and runs the active release's entry. A directory on `PATH` holding them makes `fgos` resolve in PowerShell through `PATHEXT`. The post-activation tail (`init`, `doctor --fix`, `doctor`) runs the `.cmd` form on a Windows host. `fgctl verify` checks that the launchers its host needs (the `sh` pair everywhere, the batch pair too on Windows) exist and equal what this `fgctl` writes; a missing or edited one is reported with `run fgctl repair` and never quarantines the (intact) release.
  - **Proof.** Pushing a release tag builds both targets and runs a consumer proof on each, and only when both pass does the publish job run; publishing exists only in `release.yml`. The Windows proof (`scripts/ci-external-consumer.ps1`, under Windows PowerShell 5.1 and PowerShell 7) installs `fgctl` with `install.ps1`, runs `fgctl init` against a local release server, runs the activated `fgos` from PowerShell and from `cmd.exe`, and checks that a tampered download is refused by both the installer and `fgctl init`.
  - **Not covered.** Windows ARM64 and macOS have no asset. The machine release store stays at `%USERPROFILE%\.local\state\fgos` (`FGOS_STATE_HOME` moves it); relocating it to `%LOCALAPPDATA%` is a separate decision.
- **RUL17 (one `fgos` on PATH runs each project's own activated fgos; `doctor --fix` provides it; 2026-10-13).** A release install puts only `fgctl` on PATH and `fgctl init` activates a release per project, so a plain `fgos` used to need an absolute path. `fgos doctor` check `project-fgos-launcher` and its registered fix own the answer, and `fgctl init` already ends by running `doctor --fix`:
  - The fix writes one small launcher named `fgos` (`fgos.cmd` on Windows) into the directory `fgctl` was found in on `PATH`. The launcher walks up from the working directory to the nearest `.fgos/installation/bin/fgos` and runs it with the same arguments, so each project runs the release it activated, from any subdirectory, in any shell, interactive or not; it edits no rc file. Outside a project it exits 127 and says to run `fgctl init`.
  - The launcher carries a marker line. The check reports `ready`, an out-of-date copy (rewritten by the fix), a foreign `fgos` found first on `PATH` (never overwritten; the check names it), no `fgos` with `fgctl` on `PATH` (the fix writes it), or neither on `PATH` (the check says to add the directory `fgctl` was installed into).
  - A source checkout keeps the sourced shell-integration script and needs no launcher; the check passes there.
  - Proof: `test/setup/project-launcher.test.mjs` (two projects and a nested one each run their own fgos; the `cmd` launcher runs on Windows in the focused Windows job).

- **RUL18 (`fgctl` activates a release only after the holder-lock semantics probe and the borrow vectors are green; 2026-10-16).** Right before `fgctl` publishes the activation file, on every path that activates (`init`, `upgrade`, `repair`), it runs through the `fgos-holder-lock` crate it links itself, never anything under the candidate directory: the driver guarantee plus a two-process semantics probe (a child holds the lock exclusively, the parent must see it held; the child dies, the parent must see it free) for `<workspace>/.fgos/locks` and `<lockRoot>`, and the four borrow vectors with the sibling check. On Linux and macOS a red probe or vector refuses the activation with `lock-kernel-semantics-failed` or `lock-borrow-vectors-failed` and the detail, and nothing is published. The gate runs on Windows too (the `fgctl` binary is its own helper); a platform whose driver reports `unsupported` refuses with `lock-kernel-semantics-failed`. A lock directory on a network filesystem (`none`) is refused by name. There is no flag that turns the gate off; the gate's running time is part of the activation (target under one second). The activation manifest carries no `lockProtocol` field and there is no `lockProtocolFloor`: an old release meets the cutover fences and fails loudly, so a floor would only add a prettier message. Doctor repeats the same two checks after activation (`lock-kernel-semantics`, `lock-borrow-vectors`, row 7). Authority for the port, the levels and the vectors: `docs/platform/holder-lock/spec.md`.
  - **`fgctl`'s own locks are kernel locks (2026-10-16).** The activation lock is the kernel lock `<fgosDir>/locks/activation.lock` (mutex, rank 80, repo scope) and the install lock is the kernel lock `<stateRoot>/locks/install.lock` (mutex, machine scope); neither has a TTL, a pid record or a stale reclaim, and a holder that is killed leaves the lock free at once. The old paths `.fgos/installation/activation.lock` and `<stateRoot>/install.lock` become tombstone directories at the cutover, so an older `fgctl` or `fgos` stops with an error there instead of taking a legacy lock beside the kernel lock.
  - **The main checkout.** `fgctl` checks the main checkout with `probe` (shared, non-blocking, never held) on `<fgosDir>/locks/main-checkout.lock` and nothing else: a held lock refuses `init`, `upgrade` and `repair`; the old `.fgos/main-checkout.lock` (file or tombstone directory) is never read, so there is no ttl, stale or ambiguous answer. 2026-10-17: the v1 read this bullet used to carry went away with the main checkout cutover.
  - **Windows.** The Windows holder-lock driver (`LockFileEx`) takes these locks like the other platforms; there is no fallback to the old lock files, and a platform with no driver refuses.

## Lịch sử quyết định

- **2026-10-21 — The npm channel's `fgos init` points to `fgctl init`.** Before this, a project onboarded with `npm install -g github:vantt/forgent` plus `fgos init`; that route needs Git through the native addon, which only an activated release ships ("until M10" in the old message). Git keeps one door, so the npm channel gets no addon-less Git read path: in a project no `fgctl init` has activated, `fgos init` refuses with `git-addon-unavailable: addon not shipped on this channel: onboard this project with fgctl init` and writes nothing. `test/setup/doctor-fresh-run.test.mjs` and `test/install-packaging.test.mjs` prove that refusal; the doctor state of an onboarded project is proven by the `fgctl init` tests (real runtime tail).

- **2026-10-18 — Terminal-control enters setup and doctor.** `fgos setup` adds the `terminal` config section and creates `<stateRoot>/terminal` (0700); `fgos doctor` replaces `herdr-available` with `terminal-control`, `terminal-config` and `terminal-allocations`. Reasons: the herdr check now asks the port what the driver can do instead of running `herdr --version` on its own (one door); the new settings must be visible to doctor with their source or they are guesses (L5). Prior art read: the `herdr-available` check and `FGOS_HERDR_ANCHOR_PANE` diagnosis are kept inside `terminal-control`; `lock` is the precedent for a top-level section registered by a component. Decisions: (1) a missing herdr is a warning, not a failure, because direct mode does not use a terminal; (2) the doctor floor of 40x8 for `minCols`/`minRows` is the measured one from the measurement report; (3) the setting names reach the route and the failed-pane retention through `src/terminal-control/config.mjs`, so a value doctor accepts is the value a round uses; explicit values only are sent, the Rust core keeps its defaults.

- **2026-10-16 — The activation, install and observe locks join holder-lock.** `fgctl`'s activation lock, the machine install lock and the observe store lock become kernel locks at `<fgosDir>/locks/activation.lock`, `<stateRoot>/locks/install.lock` and `<fgosDir>/locks/observe.lock`; the observe lock waits 5 s with no TTL and writes the shard snapshot under the lock. Their legacy paths (`.fgos/installation/activation.lock`, `<stateRoot>/install.lock`, `.fgos/observe/.lock`) become tombstone directories. Windows `fgctl init|upgrade|repair` refused with `lock-driver-unavailable` until the Windows driver landed (2026-10-17, `docs/platform/holder-lock/spec.md` §8.1). The `lock-fences` check and fix cover the three new registry rows. Details: RUL18 (startup reap only takes claims the runner itself made, never a human or session holder) above and `docs/platform/holder-lock/spec.md` §15.

- **2026-10-16 — Holder-lock enters setup, doctor and the activation gate (RUL18 (`fgctl` activates a release only after the holder-lock semantics probe and the borrow vectors are green)).** The cold locks of the runner (gateway, runner, sessions, advance, reconcile, recovery, full-suite, provider account and state, dispatch cwd) move from pid/TTL files to kernel locks on open file descriptions (`docs/platform/holder-lock/spec.md`). Owner decisions of 2026-10-16: a stop-everything cutover with fences instead of a two-protocol transition, so no marker and no protocol floor in the manifest; Windows reports `unsupported` for these locks rather than falling back to the old files; macOS runs the `flock` driver at once, gated at activation by the vectors and the probe. In this spec: six doctor checks (`lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-predecessor-kill-wait`, `state-root`) and the `lock-fences` fix replace `provider-capacity-lock-stale`, whose ledger is no longer a mutex; `fgos setup` creates `<lockRoot>` and `<fgosDir>/locks` and registers the one new config key `lock.predecessorKillWaitMs` (row 5g). Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`.

- **2026-10-12 — `fgctl init` downloads by default (RUL15 (fgctl init downloads a checksum-verified release when no source is given)).** Before this, a plain `fgctl init` in a project with no pin failed with "`--from <source>` is required", so a first install meant downloading the release tarball by hand. Owner decision: no source and no pin means the latest GitHub release; `FGCTL_VERSION` selects an exact tag; `FGCTL_FROM` and `--from` select a non-release build; checksum verification is mandatory; the transport is the system `curl` rather than a new HTTP crate (same behavior and override as `install.sh`, no TLS stack to carry in `fgctl`). Prior art: `fgctl init --from` (the release-asset door, kept unchanged and now equivalent to `FGCTL_FROM`), `install.sh`'s `FGCTL_VERSION`/`FGCTL_ASSET_BASE_URL`/`FGCTL_TARGET` (reused, not redefined). Same day, follow-up: the pin now records the tag, so a pinned workspace whose release is not staged on this machine downloads it instead of needing a source; only a digest-only legacy pin still needs `FGCTL_FROM`/`FGCTL_VERSION`/`--from`, because a digest names no download. Follow-up (2026-10-14): `fgctl upgrade` uses the same verified download pipeline (`--from` > `FGCTL_FROM` > `FGCTL_VERSION` > latest GitHub release) and records the downloaded tag in `.fgos/distribution.json`, so an upgraded project's pin keeps a downloadable `releaseVersion` for teammates instead of reverting to digest-only.
- **2026-10-13 — Windows is a native release target (RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)).** Owner decision: the level is "native, complete" (PowerShell and `cmd.exe`, no Git Bash, no WSL), with `tar.gz` kept as the single archive format and macOS left out of scope. Prior art, reused: the Windows CI hardening track made the Rust workspace build and the release-tree staging work on Windows (the `fgos.exe` entry, colon-free release store directory names, drive-letter-safe archive validation), and an earlier change wrote `.cmd` launchers on Windows that ran the `sh` shims through a `sh` on `PATH`; that required Git for Windows, so it is replaced by launchers that read `activation.json` themselves. Missing before: a Windows release asset, `install.ps1`, a Windows consumer proof, and any check that the launchers exist. Also in this change: the Linux asset moves from `ubuntu-latest` (binaries then needed glibc 2.39 and printed a loader warning on Ubuntu 22.04, glibc 2.35) to `ubuntu-22.04`, with a CI gate on the glibc symbol versions.
- **2026-10-16 — fgOS has no npm runtime dependency; YAML is read through one vendored parser (RUL101 (fgOS has no npm runtime dependency; every YAML parse goes through one vendored js-yaml 5.4.3 behind src/util/yaml.mjs)).** Before this, `yaml` was the one production dependency. An installed release carried it (the release builder stages declared production dependencies), but a checkout, linked worktree or unpacked copy without `npm install` did not, so every module importing it failed to load there, and the doctor and setup paths grew their own YAML readers and "not evaluated" branches to keep loading. Decision: `package.json#dependencies` stays empty; the only YAML parser is `src/util/third-party/js-yaml.mjs`, the ESM bundle from the js-yaml 5.4.3 tarball, unmodified except a header and the dropped source-map comment line, and every parse goes through `src/util/yaml.mjs` (`parseYaml(text, { filename })`: zero documents give `null`, more than one throws, `maxAliases` 100, js-yaml's default core schema). An architecture test fails on any other import of `yaml`, `js-yaml` or the third-party file. Rejected: keeping `yaml` and making doctor tolerate its absence (what the workarounds did, and the cause of the divergence); a hand-rolled parser (a second authority for what YAML means); `vendor/` or `dist/` as the location (the repository's scout-block hook refuses those path segments, so agents could not read or review the file); 5.4.2 (a block-indentation mis-parse fixed in 5.4.3) and 5.5.0 (one day old at the time). Readers that used to skip silently now report a parse failure as a named problem with file, line and column; pinned persona text that the strict parser rejects renders through a private legacy projection so older runs resume with the same text (its removal is tracked in the backlog). Evidence: commits `8ef1baf1c` (door and vendored file), `838b044e5` (call sites), `b75c01a3f` (release and dev-host staging), `6013ca389` (dependency dropped), `f96eece77`, `b7eeb4bb6` and `26b3338a7` (readers use the parser), `f705b9c8c` (doctor checks `compiled.json`); a parity run of the old parser against the door over every tracked YAML and frontmatter document found 828 documents, 0 differences, 13 rejected by both; a cold `fgos` start costs 2 to 3 ms more (97 to 99 ms for `version`, 109 to 110 ms for `dispatch decide`); the full suite ran 7850 tests with 0 failures with release binaries present; `test/util/yaml.test.mjs` pins the vendored bytes by hash. Kept on their own paths: `src/report/frontmatter.mjs` pairs `parseFrontmatter` with `renderFrontmatter` over a deliberately flat schema, so replacing only the parser would make the pair asymmetric; `distill.mjs` carries a minimal YAML reader because portable skills ship without `src/`; `domains/*/compiled.json` stays a generated projection because parsing domain YAML at import would put every verb, hook and `doctor` at the mercy of one YAML typo (doctor now checks its freshness instead). Upgrade procedure: in an empty scratch directory run `npm pack js-yaml@<version> --ignore-scripts`; compare the tarball's sha512 with `npm view js-yaml@<version> dist.integrity`; extract the `.mjs` bundle from the tarball without executing anything in it (build the path so the hook-refused segment does not appear in the command); confirm it has no import or require; diff it against the current bundle and read every changed line; re-run the parity comparison against the previous parser over the tracked YAML; replace the third-party file with the new bundle under a fresh header (source, version, integrity, license, hash); update the hash constant in `test/util/yaml.test.mjs`. js-yaml advisories are watched through the backlog, since `npm audit` no longer covers the file.
- **2026-10-17 — Instruction composition belongs to the Agent Context Engine; packaging-distribution delivers (RUL102 (one owner for composing agent instructions: the Agent Context Engine composes and selects rules, packaging-distribution only discovers, installs, renders per host and repairs)).** Before this, two documents gave the same authority to two components: `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` §2 named packaging-distribution owner of the composition engine and registry shape, while `docs/platform/proposals/documentation-system-unification.md` §4.7.2-4.7.3 put the Instruction Composer in the Agent Context Engine and said packaging-distribution "does not decide semantic composition". Left as is, a future Agent Context Engine would be built beside `src/setup/instruction-composition.mjs`, giving two composers and two orderings of the same rules. Owner decision: composing and selecting rules (kind order, override, conflict, per-task selection, per-host budget, progressive disclosure) has one owner, the Agent Context Engine; packaging-distribution keeps delivery (source discovery and install, per-host render adapters, projection ledger, doctor repair). Two delivery moments follow: static delivery, where packaging-distribution asks the engine for each host's effective set when sources change or at setup/install/upgrade and renders it to files; and per-task delivery, where the runner asks the engine for a context packet that goes into the worker brief, with no file written. The engine knows no host or file. Rejected: packaging-distribution keeping composition and also absorbing budgets and per-task selection (it would grow a content-deciding role inside an install/delivery component). Weight guard: no new component now; the existing code in `src/setup/instruction-registry.mjs` and `src/setup/instruction-composition.mjs` is the engine's seed and moves to its own module only when the first budget/tiering slice lands, in the same change, never kept in two places. Evidence and reasoning: `plans/reports/research-261016-1118-agent-code-quality-guardrails.md` sections 2d and 6.

## Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
- An agent in a project with no `bin/` (only the installed `fgos`) finds how
  to run anything from `fgos --help --json` and `fgos <verb> [<sub>] --help
  --json`. The host's route table carries two option selectors, `--help` and
  `-h`, generated from `HELP_SELECTORS` in `src/cli/command-registry.mjs`
  like every verb route and sent to the legacy-node payload, which owns the
  verb manifest; every other leading option still has no route and exits 4.
  A Rust-native verb given an exact `--help`/`-h` token anywhere after it is
  sent to the payload too, so it prints its manifest entry instead of
  running. `fgos version` lists verbs only, never the two help selectors.

## Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.

## Visuals

Not applicable — no screen; this is a command-line install flow.

## Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
