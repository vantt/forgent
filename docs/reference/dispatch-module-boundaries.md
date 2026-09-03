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
| `dispatch/config.mjs` | `.fgos/config.json`'s `runner` section load/validate/bootstrap (`loadRunnerConfig`, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`), the `RunnerConfigError` type, every `validate*Shape` gate, and the frozen vocabularies every other `dispatch/*` module reads. |
| `dispatch/resolve.mjs` | Unit → executor → model/tier/command resolution: `modelForTier`, the purpose/executorId resolution chain (`resolveExecutorIdForPurpose`, `resolveExecutorAndOverrides`), `resolveExecutorConfig`. |
| `dispatch/mechanism.mjs` | In-process / out-of-process / unavailable judgment: `decideDispatchMechanism` (Native-First Dispatch Doctrine, pure over caller-supplied booleans) and `decideExecutorDispatchMechanism` (the `executors.<id>`-specific form, D-ADR0033: config wins over `--has-live-task-access`). |
| `dispatch/transport.mjs` | Adapters, spawn, attestation, tee: the `DispatchError` type, `captureDispatchAttestation`, `resolveExecutorCommand` (prompt/model → argv substitution + cross-provider gate), `teeChunk`, the executor-adapter implementations. |
| `dispatch/prepare.mjs` | Payload assembly: `buildPrompt` (the worker prompt built from a work item's own fields) and `prepareDispatch(unit, opts) → {payload, transport, economics, refusal?}` — the named builder concept `tsk-2uf` D6/D7 introduced, meant to be the one place every dispatch door (`execute --work`, the automatic `spawnWorker` path, a future `--task` for ephemeral units) converges on. |
| `dispatch/cli.mjs` | Dispatch behavior plus the thin CLI doors over it: `executorIdForWork`, `spawnWorker` (the automated path `loop.mjs` calls), `logExecutorDispatch`, and the `execute`/`decide`/`log` CLI subcommands (`executeExecutorCli`, `decideExecutorCli`), plus the raw argv-parsing entry point. |
| `dispatch.mjs` | Barrel re-export only, plus the CLI entry-point guard (`node src/runner/dispatch.mjs execute/decide/log ...`) — a documented, literal invocation path (`AGENTS.md`'s Dispatch section, several skills' own prose) that must keep resolving to this exact file; the guard delegates its body to `dispatch/cli.mjs`'s `runDispatchCli()`. |

## What this reference does not cover

The `dispatch/` directory has grown further since this split shipped —
`assignment.mjs`, `assignment-normalizer.mjs`, `assignment-policy.mjs`,
`assignment-runner.mjs`, `execution-contract.mjs`, `operation-choice.mjs`,
`plan.mjs`, and `result-ladder.mjs` all exist alongside the six files
above. Those came from later work (referencing `ADR-006`/`ADR-007` in
their own code comments) outside `tsk-2uf-1`'s scope — not documented
here; see their own module headers for what each owns.
