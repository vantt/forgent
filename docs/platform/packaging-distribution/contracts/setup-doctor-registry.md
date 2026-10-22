# Contract: Setup Doctor Registry

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Define the doctor/fix registry contract and legacy setup compatibility used by packaging-distribution
Design status: Draft
Implementation status: Implemented
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md and src/setup/**
Last reviewed: 2026-09-13
Related:
- src/setup/checks.mjs
- src/setup/registrations.mjs
- bin/fgos.mjs
- test/setup/registrations.test.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

The doctor/fix registry is the extension point for environment readiness. Modules register checks, fixes, and config defaults instead of adding one-off repair logic.

Target architecture has no separate `fgos setup` verb for workspace onboarding. `fgctl init` is the one-command workspace onboarding orchestrator; after activation it invokes active local `fgos init`, `fgos doctor --fix`, and `fgos doctor`. Legacy shell/global integration remains compatibility behavior under the explicit deprecated fallback window: 30 calendar days after preview release publication, unless a later release decision replaces that policy.

Current Node `fgos setup` remains implemented as deprecated legacy compatibility and consumes the same registry while it exists.

## 2. Registry Types

| Registry | Function | Meaning |
| --- | --- | --- |
| Check | `registerCheck` | A named diagnostic reported by `fgos doctor`. |
| Fix | `registerFix` | A named repair run by `fgos doctor --fix`; current legacy `fgos setup` also runs fixes while it remains implemented. |
| Config default | `registerConfigDefault` | A default config shape merged into shared config without overwriting user values. |

`event-store` registers the `eventStore` config shape `{ remote: "origin" }`. Config merge fills missing keys while preserving explicit remote choices; `git-publication-refspecs` diagnoses and repairs obsolete exact legacy mappings on the configured remote and on historical `origin`.

The registries are independent. A module may register only a check, only a fix, only a config default, or any combination.

## 3. Doctor Contract

`fgos doctor`:

- runs registered checks;
- reports individual pass/fail status;
- does not write files by default;
- should tell the user what command or fix path applies when a check fails.

Run coverage is checked by `observe-run-coverage`: the host's `metrics coverage`
must report layout rule `v2` and valid observed/skipped accounting. Doctor
independently compares both eligible unique results and candidate-directory/
barrier counts against the Node production admission projection and layout scan.
Both read the main checkout store, including from a worktree. A candidate run
directory changed in the last 60 seconds permits a bounded transient difference,
even before a result exists; future mtimes are recent for clock skew. The host's
`recentRuns` remains result-file based. Diagnostic paths are sample candidates,
not verified host omissions. An unknown coverage subcommand or a response
without `layoutRule` identifies an old host positively and reports
passed-but-degraded with an upgrade instruction; other host errors fail.
This check is read-only, introduces no config default, and never rewrites runs.

`convention-conformance` checks the packaged naming and placement rules only
inside an fgOS source checkout. Violations on paths already present at the
rule cutoff pass with counts and up to three examples; a violation on a path
introduced after that cutoff fails the check, even while the rule posture is
`warn`. A missing or old host pass-skips with the reason because doctor never
reimplements the native rules. The check is read-only and has no registered
fix or config default.


`active-release-matches-checkout` compares a source checkout's Node payload
working-tree bytes with its own activated manifest, using the release builder's
source enumeration. It reports changed, missing and extra source files, excludes
staged production dependencies, and does not certify Rust host freshness.
Outside source checkouts, without activation, with a same-checkout development
manifest, or in a linked worktree whose activation belongs to main, it reports
a reasoned skip. Unsafe paths and unreadable inputs fail this check rather than
throwing out the whole doctor run. It is read-only, with no registered fix:
`npm run fgos:dev -- <verb>` runs working-tree code; build/stage/upgrade updates
plain `fgos`. Diagnosis never changes the activation implicitly.


| Check | Pass | Fail | Not applicable |
| --- | --- | --- | --- |
| `documentation-cutover-lease` | Repository hooks are wired, the committed main-ref sidecar is absent, released or abandoned, and no stray main token exists. | Committed sidecar is corrupt/unreadable; a token exists in main while main is not the recorded holder; applicable hook wiring is missing; or a lease is held. Held state reports age and frozen scope, or a missing hook/kernel lock resource. | Outside Git or without a main branch; also without `.githooks/reference-transaction` when authority is neither held nor corrupt and no stray main token exists. |

This check reads committed main-ref authority before treating missing repository hooks as not applicable: held/corrupt authority still fails if the reference hook disappears. It diagnoses a stray main token by file presence and the recorded holder checkout, without validating a linked holder's token possession. Acquire refuses the same stray condition with `stray-main-token`; held-lease admission also refuses main callers with that residue. The check is read-only, with no registered fix, config default or automatic token cleanup. After checking committed state and the recorded holder, the owner removes residue by hand; a real holder's release restores any pre-existing main token bytes. The [lease contract](../../holder-lock/spec.md#documentation-cutover-write-lease) owns the release crash window and recovery.

`fgos doctor --fix`:

- runs every registered fix;
- reports fix results;
- then reports checks.

## 4. Legacy Setup Compatibility

Current legacy `fgos setup` is deprecated but still reachable:

- wires known local support such as shell integration and hooks where applicable;
- ensures shared config defaults are present;
- runs every registered fix unconditionally;
- reports changes;
- preserves idempotency when run repeatedly.

The command registry and setup result payload expose the deprecation and workspace-onboarding path. This is implemented behavior, not the target architecture. New distribution design should route workspace onboarding through `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`, while preserving `fgos setup` as the legacy shell/global integration path through the 30-day preview fallback window unless a later release decision replaces that behavior. Removing the command entirely remains gated by that release-policy window, not by implementation-side inference.

## 5. Config Merge Contract

Config merge is fill-missing-only:

- customized values are not overwritten;
- nested object defaults fill missing keys;
- arrays are added wholesale only when missing;
- project config wins over global config for matching keys;
- missing global config is not an error.

## 6. Ownership Boundary

Doctor/fix paths may repair environment readiness. They must not silently select a different runtime identity when a workspace activation is present. Runtime selection belongs to `fgctl` and workspace activation records.

## 7. Implementation Evidence

| Claim | Evidence |
| --- | --- |
| Checks/fixes/defaults are registered through open registries | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs` |
| Doctor default path is read-only | `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Doctor fix runs registered fixes | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Legacy setup runs registered fixes and declares its deprecation path | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs` |
| Project config overrides global config | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |

## 8. Open Follow-Up

The exact list of registered checks/fixes changes over time. This contract should avoid carrying a stale giant list; generated registry reports or verification docs should carry snapshots when needed.

## Registered inventory

This canonical inventory is checked against the live registry by `test/setup/registrations.test.mjs`; the legacy distribution Data Dictionary is a historical projection.

Today's registered checks: `active-release-matches-checkout`, `advise-execute-capabilities-configured`, `agent-claims-resolve`, `agent-cli-project-trusted`, `agent-type-names-unique`, `agy-hook-wired`, `agy-permissions-configured`, `agy-sub-homes-configured`, `blind-steps-use-proven-pools`, `bwrap-available`, `cancel-wait`, `capability-serves-valid`, `changelog-unreleased-stale`, `claude-plugin-marketplace`, `cli-version-visible`, `codex-hook-wired`, `command-routes-drift`, `config-awareness`, `config-not-stale`, `confined-pane-accounts`, `confinement-backend-registry-readable`, `confinement-blind-read`, `confinement-bwrap-platform`, `confinement-herdr-maturity`, `confinement-orphaned-resources-reaped`, `confinement-policies-declared`, `confinement-probe-freshness`, `confinement-strict-readiness`, `convention-conformance`, `coordination-example-requests-valid`, `coordination-protocol-dead-vocabulary`, `coordination-protocol-fixtures-valid`, `credential-copies-retained`, `curl-available`, `decision-index-stale`, `delivered-not-on-trunk`, `dependencies-installed`, `dispatch-decide-hook-wired`, `doc-active-duplicate`, `doc-alias-broken`, `doc-current-path-missing`, `doc-near-duplicate`, `doc-provisional-aged`, `doc-registry-enforce`, `doc-registry-stale`, `doc-role-underused`, `doc-source-conservation`, `doc-source-unreachable`, `doc-topic-oversized`, `documentation-cutover-lease`, `domain-registry-compiled`, `domain-workflow-operations-coverage`, `enduser-docs-index-stale`, `events-compaction-verified`, `events-jsonl-not-truncated`, `executor-confinement`, `executor-family-unique`, `executor-posture-coverage`, `executor-profile-warnings`, `executor-skills-installed`, `gate-bypass-configured`, `gate-kill-grace`, `gateway-token-configured`, `git-component-compatible`, `git-durability-capability`, `git-land-recovery`, `git-mutation-one-door`, `git-native-locks`, `git-operation-journal`, `git-publication-refspecs`, `git-transport-config`, `git-trust-topology`, `git-worktree-recovery`, `global-model-policies-portable`, `herdr-executor-kinds`, `herdr-launcher-configured`, `herdr-web-dashboard-configured`, `identity-ids-unique`, `identity-machine-id`, `identity-project-id`, `instruction-projections-stale`, `invariant-checks-configured`, `invocation-git-write-grants`, `iron-law-configured`, `leaf-notify-drift`, `legacy-attempts-stuck`, `legacy-node-payload-present`, `llm-accounts-shape`, `llm-accounts-vs-legacy`, `lock-borrow-vectors`, `lock-holders`, `lock-kernel-semantics`, `main-checkout-guard-warnings`, `main-checkout-hook-wired`, `model-policy-pools`, `no-stuck-merge-abort`, `node-version-and-git`, `non-claude-trust-stores-readable`, `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `omp-hook-wired`, `operation-capability-resolves`, `operation-prompt-templates-valid`, `pi-hook-wired`, `plugin-dev-skills-packaged`, `plugin-skill-cli-reachable`, `process-containment`, `project-fgos-launcher`, `provider-capacity-state`, `readme-install-tag-exists`, `root-drift`, `run-attempts-stuck`, `run-supervisor-route`, `runner-generated-paths`, `runner-patterns-config`, `runtime-socket-dir`, `rust-host-binary-present`, `rust-host-target-supported`, `seat-binding-config`, `seat-binding-drain`, `seat-binding-dry-bind`, `seat-binding-route`, `shadow-binder-divergence`, `shell-integration-sourced`, `task-specs-resolve`, `terminal-allocations`, `terminal-config`, `terminal-control`, `tier-fallback`, `tier-vocabulary-dead-keys`, `tool-registry-configured`, `trust-store-readable`, `units-awaiting-resume`, `work-classification-vocabulary`, `work-step-vocabulary`, `worker-slots-ceiling-usable`, `workflow-capabilities-configured`, `workflow-case-binding-sentinel`, `workflow-case-bindings`, `worktree-setup-configured`, `writer-identity-resolvable`. This list changes with the corresponding registrations.

Today's registered fixes: `agy-hook-wired`, `agy-permissions-configured`, `bin-discovery-cache`, `claude-plugin-marketplace`, `codex-hook-wired`, `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped`, `credential-copies-retained`, `decision-index-stale`, `dispatch-decide-hook-wired`, `doc-registry-stale`, `enduser-docs-index-stale`, `gate-bypass-configured`, `gateway-token-configured`, `git-driver-directories`, `git-land-recovery`, `git-publication-refspecs`, `git-wal-dir`, `identity-machine-id`, `instruction-projections-stale`, `iron-law-configured`, `legacy-attempts-stuck`, `lock-dirs`, `no-stuck-merge-abort`, `omp-hook-wired`, `pi-hook-wired`, `project-fgos-launcher`, `run-attempts-stuck`, `runner-coordination-orgPolicy-shape`, `runtime-socket-dir`, `terminal-dir`, `workflow-case-bindings`. This list changes with the corresponding registrations.

The Git checks share one ABI/floor row, `git-component-compatible`. `git-operation-journal` reports pending count, oldest unresolved operation and retained bytes, refuses unreadable or incomplete scans, and fails `git-fence-missing` (next step: `fgctl upgrade` for the active release) when a WAL exists without the controller activation fence. Native locks are detected without removal. `git-wal-dir` initializes the trusted WAL directories; `git-driver-directories` creates or tightens only the current user’s designated fgOS root and empty driver hooks directory, canonicalizing a symlinked state root, rejecting symlinked hooks/foreign owners and leaving parents untouched; existing root chmod additionally requires canonical basename `fgos` or the driver’s own floor-record marker; Git doctor refusals name the mode/owner cause and this registered fix. `git-publication-refspecs` reads the canonical Git RepositoryConfig mapping for the effective `eventStore.remote` (project over global, default `origin`), installs missing wildcard mirror mappings and replaces the obsolete exact legacy line using RepositoryConfig under repo-config 80, preserving user configuration and recording the effective remote URL. `event-store` registers `eventStore.remote` with default `origin`; obsolete exact origin mappings are also repaired when a different remote is configured. Reserved legacy-suffix mirrors are reported for manual cleanup. A missing addon makes the checks fail and fixes report a refusal without aborting unrelated setup fixes. Durability reports the process-crash/fsync contract without certifying stable media.

`git-transport-config` reports repository-local transport settings that Publication/Remote refuse, using Rust’s scope-based admission policy. For actions/checkout credentials, use `persist-credentials: false`, remove the repo-local `http.<url>.extraheader`, and configure a trusted global credential helper or `GIT_CONFIG_GLOBAL`-level setting. The check is read-only, reports keys without credential values, and has no automatic credential migration.

## Retained Distribution Source Detail

Added in candidate — complete source units from `docs/specs/distribution.md` at blob `13d2e172de35a570d148022d4c859cac05223acb`, after the boundary main sync. Dated decisions, implementation rules and recorded gaps are retained; current assertions remain subject to the independent truth sample.

##### Contributor hooks setup

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

##### Setup

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
  defaults the fill-missing-only merge adds. Because setup runs every
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

##### Doctor

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
