# Report 1: confined-pane recipe, per-invocation config or provider adapter?

## Recommendation
Keep the recipe as per-invocation config. Add one doctor guard. Do not build a provider adapter now.

## Evidence read (no files modified)
- `docs/specs/confinement-authority.md` §13.1: the recipe has 3 parts: a `private-home` resourceBinding naming the env var (CODEX_HOME / HOME / PI_CODING_AGENT_DIR), credentials from the machine-global inventory `runner.providers.<p>.accounts.<id>.credentialSource` (`codex-home` or `home-files`), and workspace trust written by `herdr-round.mjs`.
- `.fgos/config.json`: `codex-herdr-fgovn`, `agy-herdr-mucdong`, `pi-herdr-vantt` each carry the binding (~6 lines) and the matching env var. Only the env var name differs.
- `drivers/bwrap.mjs`: the header says prepare uses resolved resources and no provider-specific branches. `provisionSelectedCodexCredential` (line ~72) reads only `request.providerCapacity.credentialSource` and copies `auth.json` or an explicit file list. It has no agent knowledge.
- `src/setup/registrations.mjs:4137`: doctor check `confined-pane-accounts` skips any herdr-spawn invocation without a private-home binding (`continue`).

## Why per-invocation config wins
1. The credential-file layout is already declared outside the driver, in the provider account inventory (`home-files` lists files explicitly). A new adapter would duplicate that declaration.
2. The part an adapter would add is the home-layout declaration: which env var names the home. That is 1 token per invocation, and 3 agents do not justify a new abstraction (YAGNI).
3. Moving it into an adapter would put agent-specific knowledge into the confinement layer. The driver's agent-agnostic design is deliberate. The config-driven path is also what the existing cli-spawn recipe (`codex-cli-bwrap`) uses, so one shape serves both adapters.
4. Config stays visible per invocation and can be overridden per project.

## Trade-offs
Config (recommended):
- (+) small, agent-agnostic driver; reuses inventory; consistent with cli-spawn.
- (-) the env var name is repeated per invocation; a new invocation can omit the binding. This already happened: `cfd670c43` applied posture to all herdr invocations without bindings, and codex/pi/agy died at start (read-only state dir).

Provider adapter:
- (+) one place declares each agent's home layout; omission becomes impossible by construction; new accounts inherit it.
- (-) a new contract and registry, a second source of truth next to the inventory, agent branches inside or beside the driver, spec and doctor work first (new module gets a spec entry before code), and it migrates 3 invocations to fix a 1-line omission risk.

## Required guard (from critique)
`confined-pane-accounts` today only validates invocations that already bind private-home. So the exact failure that happened, a missing binding, passes silently. Add a doctor check that FAILS when a herdr-spawn invocation with `confinement.backend` set and a non-claude agent kind lacks a private-home binding. Register it in `src/setup/checks.mjs` / registrations per the install/setup/doctor gate. Test: invocation without binding is reported as failing.

## Revisit trigger
Move to a kind-keyed table (agent kind to home env var) if a 4th agent appears, or a second consumer needs the same layout. A table keeps it data, not a code adapter.

## Unresolved
- Which agent kinds count as non-claude for the guard: derive from `interactiveMode.kind`, or list explicitly? Claude's herdr invocation was proven without a binding, so it must stay exempt.
- I did not run doctor or tests (read-only task); the line-4137 skip was confirmed by reading code only.
