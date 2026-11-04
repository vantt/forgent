---
authoritative_for: src/runner/dispatch module boundaries, dispatch.mjs barrel re-export, prepareDispatch location
---

# `src/runner/dispatch` module boundaries

`src/runner/dispatch.mjs` was a single 2204-line file mixing six separate
concerns with no boundary between them (`tsk-2uf-1`, extending `tsk-2uf`'s
own dispatch activation/handoff redesign). It was split into
`src/runner/dispatch/*.mjs`, and `dispatch.mjs` itself now only re-exports
every name the old file used to export directly — a barrel, so the 13
files that imported from it (`bin/fgos.mjs`, `bin/fgos-runner.mjs`,
`scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
`src/runner/loop.mjs`, `src/setup/registrations.mjs`, and their tests)
needed zero import-line changes. The dispatch *mechanism* itself was not
re-decided by this split (`tsk-5tm-3` D5 forbids that; this was a pure
move + naming pass).

| File | Owns |
|---|---|
| `dispatch/config.mjs` | the effective `runner` section (read through the config facade, `fgos config show`) load/validate (`loadRunnerConfig`, `loadRunnerConfigForDir`), the `RunnerConfigError` type, every `validate*Shape` gate, and the frozen vocabularies every other `dispatch/*` module reads. |
| `dispatch/resolve.mjs` | Unit → executor → model/tier/command resolution: `modelForTier`, the purpose/executorId resolution chain (`resolveExecutorIdForPurpose`, `resolveExecutorAndOverrides`), `resolveExecutorConfig`. |
| `dispatch/mechanism.mjs` | In-process / out-of-process / unavailable judgment: `decideDispatchMechanism` (Native-First Dispatch Doctrine, pure over caller-supplied booleans) and `decideExecutorDispatchMechanism` (the `executors.<id>`-specific form, D-ADR0033: config wins over `--has-live-task-access`). |
| `dispatch/transport.mjs` | Adapter registry, attestation, command resolution: the `DispatchError` type, `captureDispatchAttestation`, `resolveExecutorCommand` (prompt/model → argv substitution + cross-provider gate), and the executor-adapter registrations: `cli-spawn` and `herdr-spawn` are registered as supervised-only, they refuse a direct call by name because an agent runs as an attempt of the run supervisor. |
| `dispatch/cli.mjs` | Dispatch behavior plus the thin CLI doors over it: `executorIdForWork`, `spawnWorker` (the automated path `loop.mjs` calls), `executeExecutorCli` (now only the transport step of an Assignment), and the remaining CLI subcommands (`decide`, `inspect`, `reconcile`, `probe-account`; `decideExecutorCli`), plus the raw argv-parsing entry point. The `execute` and `log` subcommands and `logExecutorDispatch` were removed (decision 0062 in `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`); work runs through `fgos run`. |
| `dispatch/confinement/` | Confinement Authority subcomponent: one-door runtime launch preparation (`prepareConfinementForLaunch`), request builder, plan compiler, policy normalizer, backend registry and drivers (local `bwrap` v1 with 8 falsification probes), attestation generator, and evidence store. See `docs/platform/agent-confinement/spec.md`. |
| `dispatch.mjs` | Barrel re-export only, plus the CLI entry-point guard (`node src/runner/dispatch.mjs decide ...`) — a documented, literal invocation path (`AGENTS.md`'s Dispatch section, several skills' own prose) that must keep resolving to this exact file; `decide --work` runs only through `fgos dispatch decide`, because the Work resolver is injected from `bin`; the guard delegates its body to `dispatch/cli.mjs`'s `runDispatchCli()`. |

## What this reference does not cover

The `dispatch/` directory has grown further since this split shipped —
`assignment.mjs`, `assignment-normalizer.mjs`, `assignment-policy.mjs`,
`assignment-runner.mjs`, `execution-contract.mjs`, `operation-choice.mjs`,
`plan.mjs`, and `result-ladder.mjs` all exist alongside the six files
above. Those came from later work (referencing `ADR-006`/`ADR-007` in
their own code comments) outside `tsk-2uf-1`'s scope — not documented
here; see their own module headers for what each owns.
