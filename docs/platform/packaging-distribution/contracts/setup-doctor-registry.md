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

Today's registered checks: `active-release-matches-checkout`, `advise-execute-capabilities-configured`, `agent-claims-resolve`, `agent-cli-project-trusted`, `agent-type-names-unique`, `agy-hook-wired`, `agy-permissions-configured`, `agy-sub-homes-configured`, `blind-steps-use-proven-pools`, `bwrap-available`, `cancel-wait`, `capability-rigor-ceiling`, `capability-serves-valid`, `changelog-unreleased-stale`, `claude-plugin-marketplace`, `cli-version-visible`, `codex-hook-wired`, `command-routes-drift`, `config-awareness`, `config-not-stale`, `confined-pane-accounts`, `confinement-backend-registry-readable`, `confinement-blind-read`, `confinement-bwrap-platform`, `confinement-herdr-maturity`, `confinement-orphaned-resources-reaped`, `confinement-policies-declared`, `confinement-probe-freshness`, `confinement-strict-readiness`, `convention-conformance`, `coordination-abandoned-claims`, `coordination-example-requests-valid`, `coordination-protocol-dead-vocabulary`, `coordination-protocol-fixtures-valid`, `credential-copies-retained`, `curl-available`, `decision-index-stale`, `delivered-not-on-trunk`, `dependencies-installed`, `dispatch-decide-hook-wired`, `doc-active-duplicate`, `doc-alias-broken`, `doc-current-path-missing`, `doc-near-duplicate`, `doc-provisional-aged`, `doc-registry-enforce`, `doc-registry-stale`, `doc-role-underused`, `doc-source-conservation`, `doc-source-unreachable`, `doc-topic-oversized`, `domain-registry-compiled`, `domain-workflow-operations-coverage`, `enduser-docs-index-stale`, `events-compaction-verified`, `events-jsonl-not-truncated`, `executor-confinement`, `executor-family-unique`, `executor-posture-coverage`, `executor-profile-warnings`, `gate-bypass-configured`, `gate-kill-grace`, `gateway-token-configured`, `git-component-compatible`, `git-durability-capability`, `git-native-locks`, `git-operation-journal`, `git-publication-refspecs`, `git-transport-config`, `git-trust-topology`, `git-worktree-recovery`, `global-model-policies-portable`, `herdr-executor-kinds`, `herdr-launcher-configured`, `herdr-web-dashboard-configured`, `instruction-projections-stale`, `invariant-checks-configured`, `invocation-git-write-grants`, `iron-law-configured`, `leaf-notify-drift`, `legacy-attempts-stuck`, `legacy-node-payload-present`, `llm-accounts-shape`, `llm-accounts-vs-legacy`, `lock-borrow-vectors`, `lock-fences`, `lock-holders`, `lock-kernel-semantics`, `lock-predecessor-kill-wait`, `lock-record-unreadable`, `main-checkout-guard-warnings`, `main-checkout-hook-wired`, `model-policy-pools`, `model-policy-tier-coverage`, `mutating-assignment-binding-snapshot`, `no-stuck-merge-abort`, `node-version-and-git`, `non-claude-trust-stores-readable`, `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `omp-hook-wired`, `operation-capability-resolves`, `operation-prompt-templates-valid`, `pi-hook-wired`, `plugin-dev-skills-packaged`, `plugin-skill-cli-reachable`, `process-containment`, `project-fgos-launcher`, `provider-capacity-state`, `readme-install-tag-exists`, `root-drift`, `run-attempts-stuck`, `run-supervisor-route`, `runner-coordination-orgPolicy-shape`, `runner-generated-paths`, `runner-patterns-config`, `runner-rigor-config`, `runtime-socket-dir`, `rust-host-binary-present`, `rust-host-target-supported`, `shadow-binder-divergence`, `shell-integration-sourced`, `state-root`, `task-specs-resolve`, `terminal-allocations`, `terminal-config`, `terminal-control`, `tier-vocabulary-dead-keys`, `tool-registry-configured`, `trust-store-readable`, `units-awaiting-resume`, `work-classification-vocabulary`, `work-step-vocabulary`, `worker-slots-ceiling-usable`, `workflow-capabilities-configured`, `workflow-pools-satisfy-independence`, `worktree-setup-configured`, `writer-identity-resolvable`. This list changes with the corresponding registrations.

Today's registered fixes: `agy-hook-wired`, `agy-permissions-configured`, `bin-discovery-cache`, `claude-plugin-marketplace`, `codex-hook-wired`, `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped`, `coordination-abandoned-claims`, `credential-copies-retained`, `decision-index-stale`, `dispatch-decide-hook-wired`, `doc-registry-stale`, `enduser-docs-index-stale`, `gate-bypass-configured`, `gateway-token-configured`, `git-driver-directories`, `git-publication-refspecs`, `git-wal-dir`, `instruction-projections-stale`, `iron-law-configured`, `legacy-attempts-stuck`, `lock-dirs`, `lock-fences`, `no-stuck-merge-abort`, `omp-hook-wired`, `pi-hook-wired`, `project-fgos-launcher`, `run-attempts-stuck`, `runner-coordination-orgPolicy-shape`, `runtime-socket-dir`, `terminal-dir`. This list changes with the corresponding registrations.

The Git checks share one ABI/floor row, `git-component-compatible`. `git-operation-journal` reports pending count, oldest unresolved operation and retained bytes, and refuses unreadable or incomplete scans. Native locks are detected without removal. `git-wal-dir` initializes the trusted WAL directories; `git-driver-directories` creates or tightens only the current user’s designated fgOS root and empty driver hooks directory, canonicalizing a symlinked state root, rejecting symlinked hooks/foreign owners and leaving parents untouched; existing root chmod additionally requires canonical basename `fgos` or the driver’s own floor-record marker; Git doctor refusals name the mode/owner cause and this registered fix. `git-publication-refspecs` reads the canonical Git RepositoryConfig mapping for the effective `eventStore.remote` (project over global, default `origin`), installs missing wildcard mirror mappings and replaces the obsolete exact legacy line using RepositoryConfig under repo-config 80, preserving user configuration and recording the effective remote URL. `event-store` registers `eventStore.remote` with default `origin`; obsolete exact origin mappings are also repaired when a different remote is configured. Reserved legacy-suffix mirrors are reported for manual cleanup. A missing addon makes the checks fail and fixes report a refusal without aborting unrelated setup fixes. Durability reports the process-crash/fsync contract without certifying stable media.

`git-transport-config` reports repository-local transport settings that Publication/Remote refuse, using Rust’s scope-based admission policy. For actions/checkout credentials, use `persist-credentials: false`, remove the repo-local `http.<url>.extraheader`, and configure a trusted global credential helper or `GIT_CONFIG_GLOBAL`-level setting. The check is read-only, reports keys without credential values, and has no automatic credential migration.
