# tsk-558 — plan

## Mode

Flags counted: existing covered behavior — YES
(`test/state/cleanup-harness.test.mjs` already exercises
`checkRetrospectiveContent`). No other flag applies (no auth/data
model/audit/external/public-contract/cross-platform/multi-domain change —
the function's return shape `{ok, detail}` and its caller's `failed`-array
placement are both unchanged, per CONTEXT.md D5).

1 flag → **small**: one function, one file, one caller, no gray areas
(CONTEXT.md D1-D5 already closed every product question).

## Approach

Per CONTEXT.md D1/D2/D4: `checkRetrospectiveContent(view, id)` becomes
`checkRetrospectiveContent(view, id, repoRoot)` — reads
`outcome.docType`/`outcome.docPath` instead of `outcome.actual`/
`outcome.predicted`, and when both are present, additionally confirms
`fs.existsSync(path.join(repoRoot, docPath))` before returning `ok: true`.
`hasDecision` stays the unconditional alternate pass (D3).

### Files touched

1. `src/state/cleanup-harness.mjs` — `checkRetrospectiveContent` (line 78)
   and its one call site inside `assessCleanupReadiness` (line 136, adding
   the `repoRoot` argument it already has in scope). Proof point: 4 unit
   tests covering the item's own test-plan rows (predicted-no-doc → FAIL,
   doc-no-predicted → PASS, docPath-file-missing → FAIL, decision-only →
   PASS).

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `checkRetrospectiveContent` field/file-exists rewrite | low-medium — sole caller already confirmed (`rg`), existing tests pin the old field names and must be updated, not just extended | 4 new unit tests + existing `checkRetrospectiveContent`/`assessCleanupReadiness` tests updated to the new field shape |

Impact-analysis capability gate (re-checked at planning time): GitNexus
`present`, index still behind HEAD (`lastCommit: 251d0b5`, unchanged from
the sibling items this session already handled) → **impact-analysis:
degraded**. `impact` runs on `checkRetrospectiveContent` before it is
edited, cross-checked with `rg` (already done at clarify: exactly one
caller).

## Split decision

No split — one function, one file, already minimal.

## Assumptions

- Exact parameter order/threading for the new `repoRoot` argument is an
  implementation detail, not locked here.

## Verify (this item, whole)

```
node --test test/state/cleanup-harness.test.mjs
```
