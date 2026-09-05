# Phase 00 - Read-Only Dispatch Readiness

Depends on: plan Entry Conditions. Cell: P00.1.

## Objective

Establish a hard, live-proven read-only confinement envelope before any advisory
agent is allowed to inspect a real proof project. Prompt instructions and
`isReadOnlyMode` classification are not subprocess filesystem confinement.

## Requirements

- Read active project/global executor configuration and run the real help output
  for every candidate CLI (`claude`, `codex`, `agy`, and any replacement).
- Compare provider-native sandbox flags, executor variants, and OS/filesystem
  sandboxing or read-only mounts. Select the smallest general mechanism that
  enforces the invariant; do not assume an executor variant is the answer
  before the probes. A disposable checkout is only the mutation-attack target,
  never accepted as confinement by itself.
- Reuse `claude-reviewer` only after re-proving its mutation-negative behavior.
- Do not reuse current `codex-cli` while it carries bypass-all sandbox authority
  unless an outer OS/filesystem envelope independently contains it.
- Probe Agy for a real read-only mode and also evaluate outer confinement. If no
  combination is safe or the binary is absent, exclude it; prompt discipline is
  not enforcement.
- Run every admitted executor/mechanism pair against a disposable checkout with
  prompt that explicitly attempts to modify and commit a sentinel file. The
  process must be unable to change tracked/untracked source outside its own
  evidence output boundary.
- Record executor id, command/args with secrets removed, providerModel, tier
  mapping, resolved model, exit result, before/after git status/hash, and the
  refusal/containment evidence.
- If a new config default, executor variant, or confinement dependency becomes a product dependency,
  register it through setup config merge and doctor checks per repository law.
  A proof-local wrapper may remain under `proofs/P00.1/` only when Phase 02 will
  explicitly decide its product placement before Phase 05.
- Capture current full-suite baseline and the exact four known failures inherited
  from the completed group-thinking-plan-loop track; any drift is named.

## Dispatch Door

For every manual role dispatch, first ask the shared decision door:

```sh
node src/runner/dispatch.mjs decide <safe-executor-id> --has-live-task-access
```

Then obey the returned mechanism:

- `in-process`: use the caller's live Agent/Task capability only when P00.1 has
  separately proved that live capability's filesystem confinement; otherwise
  the executor/mechanism pair is not admitted for this proof;
- `out-of-process`: execute only through the shared adapter door below;
- `unavailable`: do not simulate the role inline; park the independence proof
  or choose another previously proven executor/mechanism pair.

```sh
node src/runner/dispatch.mjs execute <safe-executor-id> \
  --prompt "$(cat <immutable-role-prompt-path>)" \
  --tier <tier> \
  --cwd <disposable-proof-checkout> \
  --has-live-task-access
```

Never invoke the resolved provider command directly. For in-process dispatch,
persist the tool call identity/result; for out-of-process dispatch, persist
stdout/stderr and returned executor/provider/model metadata under
`proofs/P00.1/`.

## Files And Tests

Lease: `readonly-dispatch` from `plan.md`; no other path may change. Run focused
dispatch/setup/doctor tests, mutation-negative live probes, `git diff --check`,
and full `npm test`. Reviewer and Red-Team independently inspect both config and
the before/after filesystem evidence.

## Exit

The track index contains an allowlist of safe advisory executor/confinement
pairs, their supported mechanisms, and meaningful tier mappings. P01 may use
only this allowlist. Fewer than two safe provider families parks heterogeneous
proof but does not authorize an unsafe executor.
