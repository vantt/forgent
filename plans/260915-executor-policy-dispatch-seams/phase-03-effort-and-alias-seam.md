# Phase 03 — reasoning effort and compatibility alias seam

## Cell goal

Introduce canonical `reasoningEffort` and same-scope legacy executor alias
expansion without changing permission contracts.

## Parallelization

Run after Phase 01. Prefer running after Phase 02 as well, because aliases may
carry persona/toolIntent and should use the PromptEnvelope evidence shape. Phase
06 may run in parallel only if it is limited to docs/doctor warnings.

## Scope

Add a compatibility layer for legacy executor ids such as:

- `claude-reviewer`
- `claude-reviewer-herdr`
- `codex-readonly` where it still needs to resolve for explain/deprecation

When a caller supplies one of these ids at a scope, expand the alias patch at the
same scope and record `viaAlias: <id>` in provenance. Do not create a new
precedence scope named `alias`.

Alias patches may include:

- persona/personaRef;
- toolIntent or legacy tool-gating intent;
- reasoningEffort;
- visibility/invocation hint only if required to preserve old id behavior.

Alias patches must not include permission contracts.

## Likely files

- `src/runner/definitions/schema.mjs`
- `src/verbs/coordination/run.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/provider-adapters.mjs` from Phase 01
- runner/coordination tests that cover actor and CLI policy forwarding

## Alias application rule

If caller scope is CLI, alias patch provenance is CLI:

```jsonc
{
  "scope": "cli",
  "viaAlias": "claude-reviewer"
}
```

If caller scope is actor, alias patch provenance is actor:

```jsonc
{
  "scope": "actor",
  "id": "reviewer",
  "viaAlias": "claude-reviewer"
}
```

Do not add `alias` to the precedence order.

## reasoningEffort

Add canonical values:

```text
low | medium | high | max
```

Default from `minRigor` once quality exists:

```text
low -> low
standard -> medium
high -> high
critical -> max
```

Before Phase 04, bridge from the existing tier vocabulary only where needed and
record the source as compatibility.

## Verification

```sh
npm test -- test/runner/assignment-dispatch.test.mjs test/runner/coordination*.test.mjs
```

## Exit criteria

- `preferExecutor: claude-reviewer` at CLI scope expands patch provenance at
  CLI scope with `viaAlias: claude-reviewer`.
- Alias expansion preserves legacy argv in the Phase 00/01 snapshots.
- No alias changes a mutating/read-only operation contract.
- Unsupported provider effort behavior is audited, not silently discarded.
