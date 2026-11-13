# Phase 1: handoff record and the gate's fourth kind

## Context

`checkRetrospectiveContentForId` (`src/state/cleanup-harness.mjs:361`) accepts a non-engine decision, an outcome `docType`+`docPath` whose file exists, or an attested document whose file exists. A retrospective item whose claim no unit carries has none of these unless the writer manufactures a document or a decision. Write door 6.4 names the completion path: the material goes to an admission request item, and the retrospective item records the handoff.

## Requirements

1. **A registry event `capture.handoff`** in the knowledge registry (same store and door family as `doc.attest`), payload:
   - `captureId`: the retrospective item;
   - `requestId`: the admission request item;
   - `claim`: the claim's one-sentence statement;
   - `material`: the drafted text the writer would have written (non-empty);
   - `locate`: `{ query, candidates: [{ path, section?, why_not }], places? }`, the locate result and one line per candidate on why it does not carry the claim; an empty candidate list is allowed only with `query` present. `section` (heading path) and `places` are kept as given when the search returns them, so the record keeps the same shape when pkm's locate replaces the interim search.
   The reducer refuses a missing or empty `captureId`, `requestId`, `claim`, `material` or `locate.query`, and a `requestId` that is not an existing work item. The material lives once, in this event (L1: log); the request item's text links to it.
2. **A verb** `fgos knowledge handoff --capture-id <id> --request <requestId> --claim <text> --material-file <path> --locate-file <path>` writing that event through the store facade, mirroring `knowledge attest` (files for the long fields, so no raw text is spliced into shell).
3. **The gate's fourth kind**, inside `checkRetrospectiveContentForId` after the attestation branch: ok when a `capture.handoff` exists for `id` and its `requestId` still names an existing item; detail `retrospective material handed to admission request <requestId>`. A handoff whose request item no longer exists is `ok:false` with that reason. Engine-record exclusion and the three existing kinds are unchanged. The parent fallback applies as for the other kinds.
4. **Contract text**: a section "7.5 Handoff" in `docs/platform/work-state/contracts/knowledge-registry.md`, and the gate's list of accepted kinds where the cleanup gate is specified in the work-state spec. Write door 6.4 already states the decision.

## Files

- `src/state/knowledge-registry.mjs`: event kind and reducer case; view field `handoffsByCapture`.
- `src/state/store.mjs`: `handoffCaptureStore` facade beside `attestDocStore`.
- `bin/fgos.mjs`: `knowledge handoff` subcommand beside `attest` (line 1680), and its help row.
- `src/state/cleanup-harness.mjs`: the fourth kind.
- `test/state/cleanup-harness.test.mjs`: owning proof of the gate kind (accepted; refused when the request item is gone; still refused for an engine-only item).
- the knowledge-registry reducer's existing test file: owning proof of the event's validation (find it with `rg -l "doc.attest" test`).
- one CLI wiring proof of `knowledge handoff` in the file that owns `knowledge attest`'s CLI case.
- `docs/platform/work-state/contracts/knowledge-registry.md`, work-state spec gate text, `CHANGELOG.md` `[Unreleased]` (a user-visible verb).

## Steps

1. Facts: `git log -S'capture.handoff'` and `-S'handoff'` in `src/state` for prior art; read the attest CLI path and its tests.
2. Reducer case and view field; reducer tests.
3. Store facade and CLI verb; wiring proof.
4. Gate kind; gate tests.
5. Contract and spec text; `node scripts/doc-health.mjs --repo-root .`.

## Validation

- `env -u CLAUDE_CODE_SESSION_ID node --test test/state/cleanup-harness.test.mjs` and the reducer and CLI test files; then the full `npm test` in the main checkout's quiet window (not in a linked worktree), under the doc-heavy lock.
- A probe: a material-only item with a handoff reaches `cleanup` ok; the same item without it stays `ok:false` with today's message.

## Risk

Low to medium: one new event kind, one additive gate branch. Replay of old events is unchanged.
