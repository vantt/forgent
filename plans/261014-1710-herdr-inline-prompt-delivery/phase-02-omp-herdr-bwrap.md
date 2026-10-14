---
phase: 2
title: "Phase 2: omp-herdr-bwrap"
status: todo
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: OMP Confined Herdr Invocation & Profile Config

## Overview

Add the confined `omp-herdr-vantt` (`herdr-spawn` + `bwrap`) invocation for `executors.xai` in `.fgos/config.json`, configure `paste.largeMenuThreshold: 0` in the `xai-vantt` profile's `config.yml` (keeping `bwrap.mjs` 100% provider-agnostic per Spec R4), and register `omp-herdr-vantt` in `test/runner/herdr-provider-invocations.test.mjs`.

## Requirements

- [x] Set `paste:\n  largeMenuThreshold: 0` in `~/.omp/profiles/xai-vantt/agent/config.yml` (which is already copied into `private-home` via `providers.xai.accounts.vantt.credentialSource.files` in `~/.fgos/config.json`), keeping `src/runner/dispatch/confinement/drivers/bwrap.mjs` untouched per Spec R4.
- [x] Add `omp-herdr-vantt` (`adapter: "herdr-spawn"`, `confinement: { backend: "bwrap" }`, `interactiveMode: { exitCommand: "/exit", kind: "omp" }`, `resourceBindings: [{ resource: "private-home", target: { kind: "env", name: "PI_CODING_AGENT_DIR" } }]`) under `runner.executors.xai.invocations` in `.fgos/config.json`.
- [x] Register `omp-herdr-vantt` in `test/runner/herdr-provider-invocations.test.mjs`.

## Related Code Files

- Modify: `.fgos/config.json`
- Modify: `test/runner/herdr-provider-invocations.test.mjs`

## Implementation Steps

1. Ensure `~/.omp/profiles/xai-vantt/agent/config.yml` includes `paste:\n  largeMenuThreshold: 0` and `~/.omp/profiles/xai-vantt/agent/extensions/herdr-omp-agent-state.ts` is installed (and listed in `~/.fgos/config.json` `providers.xai.accounts.vantt.credentialSource.files`).
2. In `.fgos/config.json`, add `omp-herdr-vantt` to `runner.executors.xai.invocations` and update `runner.executors.xai.description`.
3. In `test/runner/herdr-provider-invocations.test.mjs`, add `{ executor: 'xai', id: 'omp-herdr-vantt', command: 'omp', homeVar: 'PI_CODING_AGENT_DIR', kind: 'omp', trust: undefined }` to the `providers` array.

## Todo

- [x] Configure `paste.largeMenuThreshold: 0` and `herdr-omp-agent-state.ts` in `xai-vantt` profile
- [x] Add `omp-herdr-vantt` invocation to `runner.executors.xai` in `.fgos/config.json`
- [x] Update `test/runner/herdr-provider-invocations.test.mjs`

## Success Criteria

- [x] `bwrap.mjs` remains completely untouched (Spec R4 preserved).
- [x] `node --test test/runner/herdr-provider-invocations.test.mjs` and `fgos doctor` (`confined-pane-accounts`, `blind-steps-use-proven-pools`) pass with `omp-herdr-vantt` included.
