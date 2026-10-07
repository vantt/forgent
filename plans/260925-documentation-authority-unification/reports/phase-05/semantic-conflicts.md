# Semantic conflicts found by the pilots

Conflicts between a source claim and the code or between two sources, recorded for the area transformation of Phase 6. A row that carries the contradicted claim is `pending`, never `reviewed`, until the owner resolves the conflict. The candidate documents carry the source text as written.

## SC-1: which verbs carry `externalEffect: true`

| Where | Statement |
|---|---|
| `docs/specs/work-state.md` lines 665-676 (candidate: `contracts/cli-io-contract.md#entry-fields-and-effect-axes`) | "today only `review` and `approve`" carry `externalEffect: true`; the candidate replaces this clause with the manifest deferral of the other source (decision recorded in the target map) |
| `docs/io-contract.md` lines 124-134 (candidate: same section) | refers to `fgos --help --json` for the current list, with the examples `review`, `approve`, `coordination` |
| Code: `COMMAND_REGISTRY` in `src/cli/command-registry.mjs` | 15 verbs are marked `externalEffect: true`: cleanup, decision-index, context-render, dispatch, run, review, approve, sync-root, promote-to-component, docs-index, doc-registry, gateway, resync-worktree, main-checkout-reset, workflow; `coordination` is not one of them |

Both sources are stale: the exclusive two-verb claim is false and the `coordination` example does not match the registry. The rows carrying the contradicted statements are decision rows `claim_ce947d10ed900598bde4df5b552e0265` (changed carry) and the io-contract row of lines 124-134; both are `pending`. Open for the owner: correct the example and the list statement in the candidate, or keep the manifest deferral without examples.

Owner decision (2026-10-07): the code is the truth. `COMMAND_REGISTRY` (15 verbs with `externalEffect: true`, `coordination` not among them) decides. The resolution of the document text (the exclusive two-verb statement and the `coordination` example) is deferred to Phase 6; until then the two rows stay `pending`, so Pilot B's scoped strict gate lists exactly those two rows as open.

