# Component authority integration acceptance (2026-11-23 04:27)

## Reconcile (step 1)

- Manifest blob at HEAD before delete: `1f294728e2019a7107f2451d42eb4ad1a131b094` (matches `reports/copy-point.md`).
- `git log 07493b986..HEAD -- docs/architecture-manifest.json`: **empty** (0 commits).
- Last commit that touched the path (historical): `00dddf7ae4979a3228a3b8a9ae43ee1aec29060b`.
- **no manifest change after the copy point** — nothing ported into `packages/component-authority/model/`.

## Retirements and retargets (step 2)

- Deleted `docs/architecture-manifest.json`.
- Deleted `plans/261121-2109-component-authority/reports/manifest-model-compare.mjs`.
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` evidence row now points at:
  - `packages/component-authority/model/doors/doctor-readiness-registry.json`
  - `packages/component-authority/model/doors/node-rows-bridge.json`
  (nothing else in that file changed).
- Live docs retargeted / pinned:
  - `docs/knowledge/.../layered-architecture-invariant.md` — live path → `packages/component-authority/model/`; history quotes keep path + `(retired; last commit 00dddf7ae)`.
  - `docs/knowledge/.../why-fgos-checks-repo-invariants-...md` — incident sentence pinned.
  - `docs/knowledge/.../state-machine-module-file-names.md` — rename history pinned.
  - `docs/platform/domainization/architecture/domainization.md` — enforcement points at model + `test/architecture.test.mjs`.
- `plan.md` status **not** changed (producer instruction).

## Commands

### `node scripts/component-authority-render.mjs --check`

```
exit 0
```

### Focused Node suite (via `node scripts/run-tests.mjs` so the native addon stages)

Command:

```sh
node scripts/run-tests.mjs \
  test/architecture.test.mjs \
  test/component-authority/components.test.mjs \
  test/component-authority/contracts.test.mjs \
  test/component-authority/render.test.mjs \
  test/setup/instruction-registry.test.mjs \
  test/report/decision-index.test.mjs \
  test/docs/agents-doctrine-anchors.test.mjs \
  test/docs/decisions-corpus-retired.test.mjs \
  test/docs/rul104-anchor-phrase.test.mjs \
  test/docs/rul11-anchor-phrase.test.mjs \
  test/docs/run-doors-doctrine.test.mjs
```

Result:

```
ℹ tests 207
ℹ pass 207
ℹ fail 0
duration_ms 26841.822157
```

`run-tests` process exit was **1** only because of leftover temp dirs (`fgos-ca-render-*: 6`); the test assertions themselves are green.

Plain `node --test …` without staging the addon fails one architecture case with:

```
Error: git-addon-unavailable: addon not shipped on this channel: onboard this project with `fgctl init`
code: 'git-addon-not-shipped'
```

(at `test/architecture.test.mjs` A4 domain/Workflow literal guard → `parseYaml`).

### Acceptance criteria 1–5

#### 1. Spec + first component row

```sh
node --test test/component-authority/components.test.mjs
```

```
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0
```

#### 2. Manifest gone; model owns checks; rg surface

- `test ! -e docs/architecture-manifest.json` → ok.
- `node --test test/architecture.test.mjs` green under `run-tests.mjs` (see above); first architecture test still asserts every `src/`/`bin/` `.mjs` maps to exactly one component.
- `rg -l 'architecture-manifest\.json'` → **512 hits**. Classification:

| Bucket | Count | Notes |
| --- | ---: | --- |
| history:archive | 24 | criterion-2 history |
| history:docs/history | 41 | criterion-2 history |
| history:verification | 27 | criterion-2 history |
| history:decision-narrative | 2 | criterion-2 history |
| history:platform-history | 3 | criterion-2 history |
| history:plans | 401 | criterion-2 history |
| sibling-sweep | 2 | `docs/platform/packaging-distribution/spec.md`, `packages/convention/contracts/convention.rules.v1.json` |
| knowledge (history pins from this phase) | 3 | keep deleted path + `(retired; last commit 00dddf7ae)` |
| **live-remaining outside this write scope** | **9** | listed below |

**Sibling-sweep (allowed by criterion 2):**

- `docs/platform/packaging-distribution/spec.md`
- `packages/convention/contracts/convention.rules.v1.json`

**Knowledge (this phase; history wording + pin):**

- `docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md`
- `docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md`
- `docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md`

**Live-remaining (criterion 2 residual; not writable in this unit):**

1. `docs/explanation/herdr-spawn-adapter-fresh-pane.md`
2. `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md`
3. `docs/platform/agent-mailbox/spec.md`
4. `docs/platform/component-authority/spec.md`
5. `docs/platform/governance.md`
6. `docs/platform/host-invocation-routing/spec.md`
7. `docs/platform/proposals/doing-coordination-redesign.md`
8. `docs/platform/proposals/knowledge-registry-redesign.md`
9. `src/cli/command-registry.mjs`

Full history/archive/plans/verification hit list is the `rg -l` output under those prefixes (468 history + 2 sibling + 3 knowledge + 9 residual = 512).

#### 3. Contract index

```sh
node --test test/component-authority/contracts.test.mjs
```

```
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0
```

#### 4. Render check + decision-index on model

- `node scripts/component-authority-render.mjs --check` → exit 0.
- `test/component-authority/render.test.mjs` and `test/report/decision-index.test.mjs` included in the 207/207 green set above.
- Proposal map retirement and contradiction rows were earlier phases; this phase only retires the manifest.

#### 5. Full suites

**`npm test`:** cannot acquire the full-suite lock on this sandbox:

```
Error: EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'
    at Object.openSync (node:fs:621:18)
    ...
    path: '/home/vantt/.local/state/fgos/locks/full-suite.lock'
```

**`cargo test --workspace`:** ran; exit **101**. Failures observed (environment/flaky confinement & gateway, not this phase’s files):

```
failures:
    wiring::doctor::confinement::tests::a_home_owned_by_a_dead_process_is_named_by_the_row_and_removed_only_by_the_fix
    wiring::doctor::confinement::tests::copies::a_staging_in_a_stranded_store_is_reported_once_for_hand_recovery_and_the_fix_leaves_it
    wiring::doctor::confinement::tests::copies::an_interrupted_staging_is_reported_and_the_fix_removes_only_one_provably_not_needed
    wiring::doctor::confinement::tests::copies::an_interrupted_staging_row_offers_no_source_judgement_without_an_inventory
    wiring::doctor::confinement::tests::copies::the_fix_judges_a_staging_against_the_source_login_of_its_store_through_the_inventory
    wiring::doctor::confinement::tests::copies::the_fix_never_sweeps_a_stores_constructor_staging_the_row_calls_stranded
    wiring::doctor::confinement::tests::copies::the_orphan_count_skips_a_held_home_of_a_dead_process_but_counts_one_only_being_retried
    wiring::gateway_control::tests::a_live_process_is_sent_term_and_the_registry_is_cleared
test result: FAILED. 541 passed; 8 failed; ...
error: test failed, to rerun pass `-p fgos --bin fgos`
```

### `node scripts/plan-contract-check.mjs --plan plans/261121-2109-component-authority`

Exit **1**. Pre-existing phase status strings are free-text (`done: landed …`, `running: …`) rather than bare `draft|ready|running|done|withdrawn`. Producer must not edit `plan.md`. Sample:

```
ERROR ... phase 1: status "done: landed 07971a3e5 ..." is not one of draft, ready, running, done, withdrawn
...
ERROR ... phase 7: status "running: no longer waits on heads-stable ..." is not one of draft, ready, running, done, withdrawn
WARN ... footprint overlaps another active plan: ... 261122-1950-owner-communication-standard
```

## Verify checklist

| Check | Result |
| --- | --- |
| `test ! -e docs/architecture-manifest.json` | pass |
| Manifest deltas after copy point | none |
| Render `--check` | pass |
| Focused architecture + component-authority + related tests | 207/207 pass (addon staged) |
| AC1 components | pass |
| AC2 rg clean of non-history | residual 9 paths outside write scope |
| AC3 contracts | pass |
| AC4 render | pass |
| AC5 npm test | EROFS lock (sandbox) |
| AC5 cargo test --workspace | 8 unrelated failures |
| plan-contract-check | fails on pre-existing phase status prose |

## Residual mentions

Nine live-remaining paths from criterion 2 residual, classified after the follow-up pin/fix pass:

| Path | Class |
| --- | --- |
| `src/cli/command-registry.mjs` | Sibling plan sweep (comment still names the retired path). |
| `docs/platform/component-authority/spec.md` | Retirement narrative (owns the migration story; path stays intentional). |
| `docs/explanation/herdr-spawn-adapter-fresh-pane.md` | Pinned dated history line (`(retired; last commit 00dddf7ae)`). |
| `docs/platform/agent-mailbox/spec.md` | Pinned dated history line (`(retired; last commit 00dddf7ae)`). |
| `docs/platform/host-invocation-routing/spec.md` | Pinned dated history line (`(retired; last commit 00dddf7ae)`). |
| `docs/platform/governance.md` | Fixed: removed `architecture-manifest.json` from the live `docs/` tree listing. |
| `docs/platform/proposals/doing-coordination-redesign.md` | Canonical: No, exempt. |
| `docs/platform/proposals/knowledge-registry-redesign.md` | Canonical: No, exempt. |
| `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md` | Outside the footprint; a dated task table. |


## Host full-suite run (lead:SUPERVISOR, main 4c5f55541, contains 9fd188d74)

Logs are in `/home/vantt/projects/forgent-worktrees/`: `main-cargo-test-4c5f55541.log` and `main-npm-test-4c5f55541-r2.log`. The first npm run had 22 EDQUOT write errors, so this classification uses the r2 rerun.

**`cargo test --workspace`:** 4282 passed and 1 failed. The failure is `head_request the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks` (the contract lists `config patch`, the server does not). It was already red at 4951cf3da and is outside this plan's files.

**`npm test` r2:** 7915 tests, 16 failed.

### Reds this plan caused

| Test | Cause | Fix |
|---|---|---|
| live self-check: every repository platform doc passes every doc-health rule | The deleted manifest was still backticked without a commit pin in `component-authority/spec.md` (lines 61, 127, 185, 224) and `packaging-distribution/spec.md` (792-793). `P08.1.md:8` linked the deleted proposal map. | Fixed in `3bf544312` (commits c35d66acf, df8eaa3d9). The land gate's run of this same self-check passed. |
| dead vocabulary guard: Request-to-Run P5 retired symbols | `FlowDefinition` and `CoordinationProtocol` in model rows `domain-registry-loader` and `group-thinking` and in one contract row reached `system-overview/spec.md` through the generated views. | Fixed in `3bf544312`: the model text was reworded and the views regenerated. |
| this repository's tracked instruction projections are current | The design-principles edit made `.fgos/instructions/effective/repo.json` stale (it still named the manifest). | Fixed in `148769e1c`: lead:SUPERVISOR regenerated it from the main checkout with `npm run build:skills`, because the lead run door refuses `.fgos/` paths. `test/setup/instruction-projections.test.mjs` passes 15/15 on the host. |

### Reds this plan did not cause

The supervisor flagged these as new against 4951cf3da:

| Test | Evidence | Class |
|---|---|---|
| a changed login copy is set aside, never deleted, keeps its run directory and stops the batch | `Unknown system error -122` on `copyfile` | disk quota (EDQUOT) |
| L1: ./bin/fgos and bin/fgos are treated as a collision | `-122` on `copyfile` | disk quota (EDQUOT) |
| R3: Staged release tree runs P02 harness from outside checkout | entry B: `fgos: Unknown system error -122 ... write` | disk quota (EDQUOT) |
| integration: a real mutant (m-edit-1) is applied and classified inside a real detached git worktree | `git worktree add --detach failed at HEAD: worktree-command-failed` | host environment (worktree creation under load and quota); touches no file of this plan |
| Reviewer M2: upgrading away from a quarantined activation | `git-predecessor-writer-live: process scan incomplete: 1 unreadable process(es) could be fgOS` | live heads running during the suite |

The other 9 reds were already red at 4951cf3da, the supervisor's baseline:

- a playbook step form becomes one activity per step
- e2e: npm pack -> npm install -g -> fgos init
- every registered workflow carries a guide model
- migrate (native): sub-verbs and their flags match the Rust sources
- the brief a reviewer reads says its claim needs assessment.verdict
- the drift scan covers the verbs that branch on a positional sub-verb
- the static scan reports a Git spawn in each shape a literal search misses
- this repository has no blocking convention violation and no post-cutoff naming violation
- tracked instruction projections. This one is listed above as caused by this plan: the baseline already contained the phase 2 design-principles edit.

None of these nine touch this plan's files.

**Result:** every red this plan caused is fixed (`3bf544312`, `148769e1c`). Acceptance criterion 5 holds, except for reds this plan did not cause, which are classified above.
