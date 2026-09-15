# Phase 02 — persona PromptEnvelope propagation

## Cell goal

Make resolved persona behaviorally real by delivering it through a PromptEnvelope
and recording delivery provenance.

## Parallelization

May run in parallel with Phase 01 after Phase 00 lands. Avoid changing provider
argv rendering here; this phase owns prompt/persona delivery only. If it needs a
runtime evidence field also touched by Phase 01, prefer an additive field and
let the merge cell reconcile naming.

## Scope

Add or extend prompt compilation so that when dispatch policy resolves a persona,
the worker prompt contains a persona/role section or system-slot content.

The DispatchPlan/runtime evidence should record:

- persona id;
- persona source/provenance;
- persona version or digest when available;
- delivery mode: `system` or `section`;
- whether delivery was applied or unsupported.

Do not make executor adapters choose or mutate persona. They only advertise
delivery capability and render the already-compiled envelope.

## Likely files

- `src/runner/dispatch/assignment.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/prompt-templates.mjs` or prompt template files if the
  current prompt renderer routes through them
- `src/runner/coordination/session-engine.mjs` only if declared-protocol
  persona provenance needs to be carried further
- `test/runner/coordination*.test.mjs`
- `test/runner/assignment-dispatch.test.mjs`

## PromptEnvelope minimum

The first implementation does not need a final public schema. It must at least
produce an internal object or persisted runtime evidence with:

```jsonc
{
  "persona": {
    "ref": "code-reviewer",
    "delivery": "system|section",
    "source": {"scope": "..."}
  }
}
```

If no native system slot is wired yet, use `delivery: "section"` and render a
clearly delimited role/persona section into the existing brief.

## Required behavior

- If policy persona is non-null, tests must fail unless PromptEnvelope contains
  a `role`/persona section or system content.
- System-slot delivery and brief-section delivery are not equivalent; record
  which happened.
- Existing prompts without persona should remain byte-equivalent or intentionally
  snapshot-updated only where the new envelope wrapper is unavoidable.

## Verification

```sh
npm test -- test/runner/coordination*.test.mjs test/runner/assignment-dispatch.test.mjs
```

## Exit criteria

- Persona provenance no longer “lies”: resolved persona reaches worker-visible
  prompt content.
- Tests cover declared-protocol actor persona, assignment role default persona,
  and no-persona cases.
- Dispatch evidence distinguishes `system` vs `section` delivery.
