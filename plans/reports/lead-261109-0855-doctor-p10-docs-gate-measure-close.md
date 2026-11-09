# Doctor readiness only, docs gate, measure and plan close: lead report

Branch `harden/doctor-p10-docs-gate-measure-close` from origin/main `289726233`, worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p10-docs-gate-measure-close`. Docs only; no `src/` or Rust change. Plan: `plans/261106-1216-doctor-readiness-only/`.

## What changed

- `AGENTS.md` "Install/setup/doctor gate": the old text (register into `fgos setup`'s config-merge and `src/setup/checks.mjs`) replaced with the four rules that match the doors that exist (config key into `core/config-standard` and `core/config-schema`; a runtime dependency gets a readiness row in `src/setup/registrations.mjs`; an incident class is reportable and repairable through its component's verb and doctor may carry one read-only pointer row; a repo rule goes into `npm test`, CI, pre-commit or the release check). The install-level and CHANGELOG bullets stay. The gate text is outside the generated block, so `npm run build:skills` changes nothing (`test/setup/instruction-projections.test.mjs` green).
- Packaging-distribution spec: new rule RUL109 beside RUL9 to RUL12; entry-point rows and section 6 say readiness only; data dictionary row 7 reconciled with the live registry (dropped `executor-posture-coverage` and `observe-friction-migrated`, added the config rows, `identity-shared-directory`, the mailbox rows, `omp-natives-present`), row 7b likewise (dropped `gate-bypass-configured`, `iron-law-configured`, `runner-coordination-orgPolicy-shape`, added the config and mailbox fixes, the sentinel-only scope of `workflow-case-bindings`); decision narrative at the top of "Lịch sử quyết định" (holder resolved through `docs/platform/governance.md#decision-scope-to-holder-table`: the spec's own history section; the section uses dated entries with no D-ADR number, so nothing was minted and `fgos decision-index` has nothing to regenerate).
- Registry contract: section 1 (readiness plus pointer rule; `fgctl init` tail unchanged, `fgos init` recovers Git), section 3 (no write and no child outside a set-up repo; "Pointer rows" with the table of the six pointer rows and the two failing ones; owning-proofs table gains the packaged definitions; knowledge verbs named), section 6. The two inventory lines were already exact for the 109 rows (pinned by `test/setup/registrations.test.mjs`).
- CHANGELOG: one summary line ("readiness only"); the per-phase lines did not say it.
- Backlog: `p-bkmh4egqlv` (minted with `fgos identity mint backlog`) retires `shell-integration-sourced` when the `fgos setup` fallback window closes.
- Owner-extra, decision 76(d): `dependencies-installed` was already removed with its docs and tests by the dead-rows phase (`ff6947580`); nothing to delete or retire, so no title table. Local branch `harden/drop-dependencies-installed` (one commit `caf9da1e7`, 3 files) was superseded and deleted. Leftovers cleaned: its stale entry in `scripts/check-decision-codes.baseline.json`, and section 1 of `docs/knowledge/add-a-new-npm-dependency-to-forgent/` (taught registering that row).
- Owner guide `plans/reports/guide-261109-0844-owner-machine-doctor-readiness-only.md`: sections for phases 01 to 08, 09 (what remains with WORK) and 10, plus the AgentKit-block save and re-apply step.

## Measurements (fg-server2, plain `fgos doctor --json </dev/null` of the active release `1c162964`, built from main `57e00abf4`)

The active release predates phase 08 (111 rows, not 109); phase 08's rows cost about 20 ms together, so its time is within noise. Other lanes ran full suites on this machine for most of the session; the figures below were taken in an idle window (CPU idle 87 %, load 6 to 16).

| Measure | Value |
|---|---|
| Rows | 111 on the active release; 109 on main (the registry contract inventory, pinned by test, lists 109). Audit start: 147 released, 146 in source |
| Total time, main checkout, 3 runs at load 5.3 to 6.6 | 19.86 s, 19.91 s, 19.57 s: median 19.86 s (audit start 45 s; target 20 s). Earlier runs the same hour at load about 10: 18.1, 17.6, 17.2 s; at load 9 to 14: 22.1, 20.8, 18.6 s. The time is CPU bound (user 9 s, sys 10 to 12 s), so it follows machine load |
| Scratch non-fgOS repo, 3 runs | 3.28 s, 3.09 s, 3.53 s: median 3.28 s (target 4.5 s); `.fgos` absent after the runs; the count of all `fgos` processes is useless on this busy machine, so the no-child proof is `test/setup/checks-doctor-config.test.mjs`, which checks `.fgos/logs` and the child |
| `run-attempts-stuck` | 1 to 4 ms (cap 250 ms), measured after the 2026-11-08 wipe with 10 assignment directories |
| Pointer rows in the main checkout | `git-incidents` 6 ms, `event-store-incidents` 0, `lock-holders` 0, `run-attempts-stuck` 4, `terminal-allocations` 60 to 180, `mailbox-hook` 570 to 930: together about 0.7 to 1.1 s |
| Target 12 s | pending: needs the Work rows (P09) and T5's seat-row cut |

Ten slowest rows in the main checkout (preload wrapper over the real run, one run, noisy): `delivered-not-on-trunk` 8.8 s (4.9 s and 7.3 s in two earlier runs; a Work row), `claude-plugin-marketplace` 1.34 s, `seat-binding-dry-bind` 1.27 s and `blind-steps-use-proven-pools` 1.26 s (both T5), `mailbox-hook` 0.93 s, `event-store-open-root` 0.91 s, `main-checkout-hook-wired` 0.89 s, `event-store-machine-id` 0.71 s, `root-drift` 0.67 s (Work), `confinement-probe-freshness` 0.65 s. The Work rows `delivered-not-on-trunk`, `root-drift`, `work-classification-vocabulary` and `leaf-notify-drift` sum to 6 to 10 s of the 17 to 22 s, which is the P09 gap; the T5 seat and blind rows add about 2.5 s.

### Why `run-attempts-stuck` was 442 ms at the pointer phase, and is not now

The row walks the assignments tree and, for each open attempt that has an envelope or intent, asks the holder-lock door for its lock state (`attemptLockState`, about 0.33 ms each, measured on a synthetic fixture with the active release's code; walking 600 directories with 1200 attempts costs 5 ms). Its cost is therefore proportional to the number of open supervised attempts that history never closed. At the pointer phase the main checkout carried hundreds of them; the wipe left 10. No fix is needed now. The cost returns as run history grows, which backlog row `p-tslryr3buq` (run directories are never removed) and the Workflow prune already cover; I did not add a second mechanism.

### Over-cap pointer row

`mailbox-hook` costs 0.57 to 0.93 s because it spawns `fgos mailbox status` for the record verdict, and that verdict can fail the row (owner decision 65 exception), so the count cannot be left out. With it the six pointers together exceed the 1 s bound in the worst run. Cheaper in-process reading is MAIL's code; the spec and contract now state the exception instead of claiming the bound.

## Final table: every audit row

| Audit row(s) | Disposition | Owner / where |
|---|---|---|
| node-version-and-git, cli-version-visible, project-fgos-launcher, curl-available, rust-host-binary-present, rust-host-target-supported, legacy-node-payload-present, claude-plugin-marketplace, main-checkout-hook-wired | kept | readiness |
| shell-integration-sourced | kept | backlog p-bkmh4egqlv retires it when the `fgos setup` fallback window closes |
| active-release-matches-checkout | kept | UQ-1 option (a): only a dev machine can judge it |
| dependencies-installed | deleted (P02) | judged a user project's packages; fgOS has no runtime dependency |
| plugin-skill-cli-reachable | deleted (P02) | `test/setup/bin-discovery.test.mjs` tiers incl. the live PATH case; `project-fgos-launcher` on the project side |
| plugin-dev-skills-packaged | deleted (P02) | `test/skills/fgos-mirror.test.mjs` |
| command-routes-drift | deleted (P02) | `test/rust-host/command-routes.test.mjs` drift case |
| git-mutation-one-door | moved (P03) | `test/setup/git-mutation-census.test.mjs` |
| instruction-projections-stale (+fix) | moved (P03) | `test/setup/instruction-projections.test.mjs`; `npm run build:skills` regenerates |
| config-* rows, gateway-token-configured, runner-generated-paths, runner-patterns-config, worker-slots-ceiling-usable, run-supervisor-config, global-model-policies-portable | kept | readiness |
| tier-vocabulary-dead-keys | deleted (P02) | `config-unknown-key` (proven for all 15 retired keys in `test/setup/checks-doctor-config.test.mjs`; warning, not failure) |
| executor-family-unique, executor-skills-installed, tier-fallback, model-policy-pools, llm-accounts-shape, llm-accounts-vs-legacy, capability-serves-valid, workflow-capabilities-configured, executor-confinement, invocation-git-write-grants, herdr-executor-kinds, trust-store-readable, non-claude-trust-stores-readable, agent-cli-project-trusted, confined-pane-accounts, executor-profile-warnings, seat-binding-dry-bind, blind-steps-use-proven-pools, seat-binding-route, bwrap-available, confinement-* (policies-declared, backend-registry-readable, bwrap-platform, probe-freshness, blind-read, strict-readiness, herdr-maturity), tool-registry-configured, agy-permissions-configured, agy-sub-homes-configured | T5 | still registered; T5 decides (seat-row cost cut pending) |
| executor-posture-coverage | T5 (folded) | folded into `seat-binding-dry-bind` by T5 |
| credential-copies-retained, confinement-orphaned-resources-reaped | T5 | still registered with their fixes; T5 owns the incident repair |
| provider-capacity-state | T5 | still registered; Dispatch's pointer is T5's call |
| shadow-binder-divergence | deleted before the plan | gone in `847913570` |
| dispatch-decide-hook-wired, codex-, agy-, omp-, pi-hook-wired | kept | readiness |
| run-supervisor-route, runtime-socket-dir | kept | orphan sockets are removed by `sweepAttempts` on every run and loop sweep (P07) |
| run-attempts-stuck | pointer (P07) | `fgos dispatch recover`, the next `fgos run` adopts |
| lock-kernel-semantics, lock-borrow-vectors | kept | readiness |
| lock-holders | pointer (P07) | `fgos lock-status` (`problems`) |
| event-store-open-root, event-store-machine-id, event-store-legacy-layout | kept | readiness |
| event-store-refspec | deleted (P02) | folded into `git-repository-config` |
| event-store-native-addon | deleted (P02) | folded into `git-component-compatible` |
| event-store-unsealed, event-store-integrity, event-store-sync | pointer (P07) | `event-store-incidents` over `fgos events status`; fails on integrity problems, skipped mirrors, sync warnings |
| git-component-compatible, git-repository-config, git-operation-journal | kept | journal row judges readiness only (P06) |
| git-worktree-recovery, git-native-locks | moved (P04, P06) | `fgos git status`; counts in the `git-incidents` pointer |
| no-stuck-merge-abort (+fix) | deleted (P01, P06) | the fix did nothing; merge in progress is `fgos git status` `mergeInProgress` |
| git-land-recovery (fix) | moved (P04, P06) | `fgos git recover`, run by `fgos init` |
| (new) git-incidents | pointer (P06) | `fgos git status`, `fgos git recover` |
| work-classification-vocabulary, work-step-vocabulary, work-recorded-conflicts, root-drift, leaf-notify-drift, delivered-not-on-trunk | WORK (P09) | still registered; WORK's doors and a `work-incidents` pointer pending |
| workflow-case-binding-sentinel | kept | readiness (sentinel fix stays) |
| workflow-case-bindings | WORK/Workflow (P09) | repair moved to the Workflow normal path and `fgos workflow status` shows `bindingsJudgment` (T6); the row still fails on a problem, pointer form pending |
| mailbox-hook | pointer (P07) | `fgos mailbox status`; fails on an unreadable or untrusted record |
| mailbox-claude-accept, mailbox-sync-timer | kept | readiness |
| writer-identity-resolvable, identity-machine-id, identity-machine-key, identity-ssh-keygen, identity-project-id, identity-shared-directory, observe-dir-writable, observe-host-resolvable, terminal-control | kept | readiness |
| identity-pinned-machines | deleted (P02) | `fgos identity pins`; `packages/identity/rust/tests/signing.rs` |
| identity-ids-unique | moved (P03) | `test/scripts/doc-health.test.mjs` (body `scripts/identity-ids-unique.mjs`) |
| observe-run-coverage | deleted (P03) | shared run-layout fixture: `test/runner/assignment-layout.test.mjs`, `packages/run-result/rust/tests/layout_fixture.rs` |
| terminal-allocations | pointer (P07) | `fgos dispatch inspect --terminal` |
| task-specs-resolve, domain-workflow-operations-coverage | moved (P08) | `test/setup/packaged-definitions.test.mjs` |
| agent-claims-resolve, domain-registry-compiled, agent-type-names-unique, operation-prompt-templates-valid | kept (P08) | project tier only; release tiers in `packaged-definitions.test.mjs` |
| coordination-protocol-dead-vocabulary | deleted (P02) | `test/runner/dead-vocabulary-guard.test.mjs` |
| coordination-protocol-fixtures-valid, coordination-example-requests-valid, operation-capability-resolves | deleted (P02) | returned "retired", no condition |
| enduser-docs-index-stale, decision-index-stale (+fixes) | moved (P03) | `test/scripts/doc-health.test.mjs`; `fgos docs-index`, `fgos decision-index` |
| doc-registry-stale (+fix) | moved (P05) | `fgos doc-registry --check` |
| nine doc-* lint rows | moved (P05) | `fgos knowledge status` `findings` (`test/report/knowledge-lints.test.mjs`) |
| changelog-unreleased-stale | moved (P03) | `scripts/prepare-release.mjs`, `test/scripts/prepare-release.test.mjs` |
| readme-install-tag-exists | moved (P03) | `test/scripts/doc-health.test.mjs` |
| convention-conformance | moved (P03) | `test/scripts/convention-conformance.test.mjs` (body `scripts/convention-conformance.mjs`) |

## Final row id list (109 rows, plan bound 112)

`active-release-matches-checkout`, `agent-claims-resolve`, `agent-cli-project-trusted`, `agent-type-names-unique`, `agy-hook-wired`, `agy-permissions-configured`, `agy-sub-homes-configured`, `blind-steps-use-proven-pools`, `bwrap-available`, `capability-serves-valid`, `claude-plugin-marketplace`, `cli-version-visible`, `codex-hook-wired`, `config-comment-migrated-why`, `config-comment-missing-doc`, `config-comment-missing-why`, `config-doc-drift`, `config-format-legacy-json`, `config-global-permissions`, `config-key-in-wrong-file`, `config-legacy-shadowed`, `config-migrate-backup-stale`, `config-parse`, `config-redundant-value`, `config-schema`, `config-secret-outside-private`, `config-unknown-key`, `confined-pane-accounts`, `confinement-backend-registry-readable`, `confinement-blind-read`, `confinement-bwrap-platform`, `confinement-herdr-maturity`, `confinement-orphaned-resources-reaped`, `confinement-policies-declared`, `confinement-probe-freshness`, `confinement-strict-readiness`, `credential-copies-retained`, `curl-available`, `delivered-not-on-trunk`, `dispatch-decide-hook-wired`, `domain-registry-compiled`, `event-store-incidents`, `event-store-legacy-layout`, `event-store-machine-id`, `event-store-open-root`, `executor-confinement`, `executor-family-unique`, `executor-profile-warnings`, `executor-skills-installed`, `gateway-token-configured`, `git-component-compatible`, `git-incidents`, `git-operation-journal`, `git-repository-config`, `global-model-policies-portable`, `herdr-executor-kinds`, `identity-machine-id`, `identity-machine-key`, `identity-project-id`, `identity-shared-directory`, `identity-ssh-keygen`, `invocation-git-write-grants`, `leaf-notify-drift`, `legacy-node-payload-present`, `llm-accounts-shape`, `llm-accounts-vs-legacy`, `lock-borrow-vectors`, `lock-holders`, `lock-kernel-semantics`, `mailbox-claude-accept`, `mailbox-hook`, `mailbox-sync-timer`, `main-checkout-hook-wired`, `model-policy-pools`, `node-version-and-git`, `non-claude-trust-stores-readable`, `observe-dir-writable`, `observe-host-resolvable`, `omp-hook-wired`, `omp-natives-present`, `operation-prompt-templates-valid`, `pi-hook-wired`, `project-fgos-launcher`, `provider-capacity-state`, `root-drift`, `run-attempts-stuck`, `run-supervisor-config`, `run-supervisor-route`, `runner-generated-paths`, `runner-patterns-config`, `runtime-socket-dir`, `rust-host-binary-present`, `rust-host-target-supported`, `seat-binding-dry-bind`, `seat-binding-route`, `shell-integration-sourced`, `terminal-allocations`, `terminal-control`, `tier-fallback`, `tool-registry-configured`, `trust-store-readable`, `work-classification-vocabulary`, `work-recorded-conflicts`, `work-step-vocabulary`, `worker-slots-ceiling-usable`, `workflow-capabilities-configured`, `workflow-case-binding-sentinel`, `workflow-case-bindings`, `writer-identity-resolvable`

## Acceptance criteria

| # | Criterion | Result |
|---|---|---|
| 1 | doctor median of 3 at most 20 s after P08; at most 12 s after P09 and T5 | 19.86 s on a 111-row release (marginal); 12 s pending, see above |
| 2 | scratch repo: no `.fgos`, no events child, at most 4.5 s | 3.28 s, no `.fgos`; child proof is the checks-doctor-config test |
| 3 | no registered fix repairs an incident of the named ids | `rg` on `registerFix(...)` for the seven ids returns nothing; remaining incident fixes: `workflow-case-bindings` is now sentinel-only, T5's `credential-copies-retained` and `confinement-orphaned-resources-reaped` |
| 4 | table and row count at most 112 | table above; 109 |
| 5 | `fgos git status|recover` exist, `fgos init` recovers, no `doctor --fix` Land message | `fgos git status --json` answered on the active release; no `src/` line pairs `doctor --fix` with Land (`rg` empty) |
| 6 | pointer rows read-only, `passed: true`, "N open; run verb" | holds for `git-incidents`, `lock-holders`, `run-attempts-stuck`, `terminal-allocations`; `event-store-incidents` and `mailbox-hook` fail only on the two owner-accepted cases |
| 7 | every retired test names its owner | per-phase reports (P01 to P08) |
| 8 | net size within budget | below |
| 9 | gate text, spec rule and contract state readiness only | done in this phase |

### Net size (measured over each phase's commits; Node = `src`, `bin`, `scripts`)

| Phase | Node | Rust | Tests |
|---|---|---|---|
| 01 | -21 | 0 (message text) | +23 |
| 02 | -362 | 0 | -188 |
| 03 | -477 | 0 | -524 |
| 04 | +109 | 0 | +62 |
| 05 | -94 | 0 | -39 |
| 06 | -49 | 0 | -9 |
| 07 | -63 | 0 | -5 |
| 08 | -247 | 0 | -22 (the moved bodies, +269 in a test helper, excluded) |
| Total | -1 204 | 0 | -702 (-433 counting the moved bodies) |

Budget was Node at most -700, Rust at most +10, tests at most -250: met on all three.

## What remains, and who owns it

- **WORK (rest of P09):** the six Work rows (`work-classification-vocabulary`, `work-step-vocabulary`, `work-recorded-conflicts`, `root-drift`, `leaf-notify-drift`, `delivered-not-on-trunk`) each need a Work read verb and removal from doctor, then HARDEN adds the `work-incidents` pointer. The Workflow half was done by the case-bindings phase of the Workflow layer: repair runs on the Workflow normal path and `fgos workflow status` shows `bindingsJudgment`. `workflow-case-bindings` still fails on a mismatch; its pointer form is the last piece.
- **T5:** the seat-row cost cut (`seat-binding-dry-bind`, `blind-steps-use-proven-pools`, `confinement-probe-freshness`).
- **12 s target:** re-measure after both.
- **MAIL:** `mailbox-hook` cost (above).
- **Backlog:** `p-bkmh4egqlv`.
- Machines still need a release built from this main for the full set of phases; the guide lists the steps.

## Ideas for the owner to choose (not done; each with reason and gain)

- A `fgos doctor --time` flag that prints per-row milliseconds. Reason: the audit and this phase both needed a preload wrapper to see row costs (`/dev/shm/p10/row-times-preload.mjs` was scratch). Gain: the next cost regression is visible without tooling.
- `claude-plugin-marketplace` costs 1.3 s on every doctor run for a state that rarely changes. Reason: the second-largest row after Work's `delivered-not-on-trunk`. Gain: about 1.3 s per run.

## Deviations and notes

- The plan text expected a decision narrative with a D-ADR number "if the holder table requires one": it does not (the packaging-distribution history section uses dated entries), so none was minted.
- The registry contract inventory lines needed no edit (exact for 109 rows). Spec rows 7 and 7b were stale and are reconciled.
- Doctor time target at the active release is marginal (19.86 s against 20 s); on main it is lower by the phase 08 rows (about 20 ms), which is not the margin. The result depends on machine load.
- `plan.md` status is `in-progress` through `ak plan update` (phase 09 is WORK's). The phase files' `completed` marks were edited in their front matter: `ak plan phase close` finds no plan in the store for this folder.
