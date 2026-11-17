# Phase 15 report: legacy invocation and launch code removed

## What changed
- `credentialStoreOf` reads only a declared `credentialStore`; the private-home `resourceBindings` inference is gone. `resourceBindings` on an invocation is refused at load by name (config.mjs), and left the schema. `explain` keeps `source: 'declared'` (constant now).
- Executor entries (`executors.<id>`) no longer hold launch fields: `command, args, adapter, env, permissionMode, promptDelivery, interactiveMode, liveOutput, resourceBindings` are refused at load by name (existing removed-field door), pointing at the invocation; deleted from `runner.schema.yaml` (plus `dependentRequired`). Readers of the dead fields removed (resolve fallbacks, probes, doctor checks `checkExecutorConfinement` / `confinement-herdr-maturity` now judge the invocation). The bypass-needs-confinement check moved from the entry to each invocation.
- `FGOS_HERDR_PROMPT_DELIVERY` and the dead `opts.promptDelivery` removed; delivery = `terminalPromptDelivery(resolvedCmd)` (resolved command, else inline).
- Docs: RUL105 text, agent-confinement settled fact, a settled-fact bullet beside RUL65, the pane-delivery decision line.

## Kept on purpose (plan lead decided: keep)
- Entry-level `confinement` stays: a project file may turn `ownWorktree` on there (config spec, `tighten`, owner decision 79 Q6c, golden_snapshot). Invocations are global-only, so deleting it would remove that project capability. Readers `inv.confinement ?? executor.confinement` stay.
- `command/args/adapter/env` readers stay where the default `runner.executor` is mounted into the registry (`withDefaultExecutor`); only the raw `executors.<id>` form is refused.
- No shipped, this-repo, fixture or global (read-only look) config needed a data change; none sets a removed key.

## Retired test -> owner now
| Retired | Owner now |
|---|---|
| credentialStoreOf infers from binding (credential-store.test) | same file: only declared counts; resourceBindings refused by name |
| bind-committed-config "no resourceBindings" loops | credential-store.test refusal test |
| dispatch.test warn for flat non-Claude command, R8 unrecognized cli command | new test: warn when no invocation yields a command (behaviour of flat command removed) |
| Rust golden executor-level adapter/command/env/permission/prompt/interactive cases | same cases at `invocations[0]` in golden_validate.rs; one case proves executor-level fields are no longer described |
| golden_snapshot entry command/args/permissionMode scope cases, authoring_equivalence entry paths | invocation-level cases that remain |
| executor-model vectors: "a private-home env binding implies the store of the CLI the command runs", "a private-home binding on a command-less invocation implies nothing" | removed behaviour; vectors deleted, regenerated and `--check` green (236 left) |
| explain "inferred" store | explain: none for an invocation without a store |

## Gates
- cargo test -p fgos-config all green; fmt, clippy -D warnings, check msvc (lib) and apple-darwin ok. (msvc `--all-targets` fails in tests/common on `migrate`, untouched by this change.)
- Node: every test file that references executors/invocations/credentialStore/confinement (152) plus importers of changed helpers run one file per run; all green after fixture fixes. test/rust-host/fgctl-* fail only for a missing release binary (environmental). architecture, mutation census, doc-health, decision-citation-drift green; census regenerated, scan 0 undeclared.
- Fixtures moved: ~45 test files and helpers (flat executor launch fields onto an invocation; helper inputs `confinedRunnerConfig` / `confinedUnitConfig` still take flat input and convert).

## Left / questions
1. Decided by the plan lead: entry-level `confinement` stays (owner decision 79 Q6c).
2. CHANGELOG line for phase 12: "A runner executor entry no longer carries launch fields (command, args, adapter, env, permissionMode, promptDelivery, interactiveMode); declare them on the invocation. resourceBindings is refused: declare credentialStore. FGOS_HERDR_PROMPT_DELIVERY is gone."
3. Other machines' config that still sets these keys is refused at load; design-lap's per-machine move covers it.
4. Touched two of HARDEN's five files: bind-committed-config.test.mjs (deleted two resourceBindings assertions, not the seedStubAgentClis line) and model-pool-checks.test.mjs (dropped dual executor-level command/args). Rebase after their fix lands.

## Review round (CHANGES) follow-up
- Vectors: the two bypass vectors now put `permissionMode` on `executors.a.invocations[0]` (they prove the per-invocation bypass rule: missing flags named / valid); a new vector records the removed-field refusal. 237 vectors, `--check` green.
- Dead entry-level fallbacks deleted in agent-cli-trust, registrations (trust-store env, store check incl. the `credentialStoreOf` command spread, git-write grants on `executor.args`, stale comment), omp-natives-checks, executor-profile-warnings, model-pool-checks, agy-permissions. `provider-session-probe` dropped `chosen.command ?? executor.command`: its callers (cli.mjs) pass `loadRunnerConfigForDir` output, not `withDefaultExecutor` output.
- Removed-field and `resourceBindings` refusals now carry `path: runner.executors.<id>.<field>` (invocation: `...invocations[i].resourceBindings`) so a stale key is attributed to its file; tests assert the path.
- `checkConfinementHerdrMaturity` now checks every herdr-spawn cli invocation (message names `executor/invocation`); its not-applicable test now keeps only headless invocations.
- For the plan lead: "mount `runner.executor` as an invocation so there is one in-memory shape" (readers in resolve, bind, assignment-runner, mechanism, plan, policies, executor-governance still read flat `command/args/adapter/env`).
- `test/rust-host/release-tree.test.mjs` fails only for a missing release addon (environmental).
