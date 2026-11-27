---
phase: 1
title: "Attest records the locate result, mentions and the grow decision"
status: ready
dependencies: []
---

# Phase 1: attest records the locate result, mentions and the grow decision

## Inputs

- `plan.md` decisions D2, D7, D9 and facts F4, F5, F17; gap G4 (the verb cannot prove the mention list is
  complete).
- `src/state/knowledge-registry.mjs`: `normalizeHandoffLocate`, the `doc.attest` and `capture.handoff` reducer cases.
- `bin/fgos.mjs`: the `knowledge` case, `attest` and `handoff` arms (around lines 1418-1530).
- `src/cli/command-registry.mjs`: the `knowledge` entry (examples, flags).
- `docs/platform/work-state/contracts/knowledge-registry.md`: the `doc.attest` row and section 7.5 (handoff).
- `test/state/knowledge-registry.test.mjs`: the existing attest and handoff cases.

## Footprint

`src/state/knowledge-registry.mjs`, `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
`test/state/knowledge-registry.test.mjs`, `docs/platform/work-state/contracts/knowledge-registry.md`, and the exported
`packages/host-runtime/contracts/command-manifest.json` and `command-routes.json`.

## Steps

1. Rename `normalizeHandoffLocate` to one locate normalizer used by both events (same shape: `query`,
   `candidates[{path, section?, why_not}]`, optional `places`). Keep the handoff's error messages naming its event.
   For attest, `why_not` is required on every candidate except the one grown, which is named by `grown` (the path
   of the attested document) instead.
2. `doc.attest`: accept an optional `locate` and record it with `decision: 'grow'` on the attestation, keyed by
   capture id (for example `view.attestsByCapture[captureId]`), next to the existing `sourceCaptureIds` push. An event
   without `locate` replays exactly as today.
3. `capture.handoff`: accept an optional `decision` of `create` or `no-place` (default `create` on replay of old
   events). Reject any other value.
4. Mentions (D9): the shared normalizer accepts an optional `mentions[{path, section?, missedBySearch, handling,
   note?}]`. `handling` must be `updated`, `unaffected` or `too-common`, and `too-common` needs a `note`; anything
   else is refused with a message naming the path. A locate without `mentions` is accepted as today, so old events
   and old callers replay unchanged. The verbs cannot check the list against the locate answer (G4); say so in the
   contract.
5. CLI: `fgos knowledge attest --locate-file <json>` reads the file like `handoff` does (same error texts for an
   unreadable file or bad JSON); `fgos knowledge handoff --decision create|no-place`. In the `doc` entry, declare
   locate's repeatable `--exact <string>` ("a literal string to list every section that contains it"); phase 7
   parses it in Rust. Update the examples and flag lists, then run `node scripts/export-command-selectors.mjs` and
   commit the exported contracts.
6. Contract: in the knowledge-registry contract add the optional fields (`locate` with `mentions`, `decision`), state
   that replay of older events is unchanged, and that these fields are the writer's locate decision of document
   identity 8.1 step 6.
7. Tests in `test/state/knowledge-registry.test.mjs` (the owning test; extend the attest and handoff cases rather
   than add a new file): attest with a locate records `decision: grow`, the candidates and the mentions; attest
   without one replays as before; a handoff with `decision: no-place` is kept; an unknown decision is refused; a
   mention without `handling`, or `too-common` without a note, is refused on both events.

## Verify

```bash
node --test test/state/knowledge-registry.test.mjs test/state/cleanup-harness.test.mjs
node scripts/run-tests.mjs test/cli
```

Pass: all green; the cleanup-harness cases are unchanged (the gate does not read the new fields).

## Rollback

Revert the phase commit. Events written with the new optional fields stay readable only if the revert keeps the
normalizer tolerant; if any were written, revert the CLI flags only and keep the reducer fields.
