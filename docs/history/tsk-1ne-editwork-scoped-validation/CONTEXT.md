# tsk-1ne — editWork re-validates the whole work object on patch, blocking edits to legacy-invalid items

## Feature boundary

`editWork` (`src/state/store.mjs:258`) merges an edit patch onto the
existing item and calls `validateWork(candidate, ...)` on the FULL merged
object, not just the patched keys. Found while backfilling `tsk-535`'s
description gap: 65/112 items could not be edited AT ALL — for ANY field —
because they carry pre-existing invalid shape unrelated to what was being
changed: 61 items have `stage: compound-learn` (not in coding domain's
current 3-value enum `[clarify, decompose, executing]`,
`src/state/workflow-stage-graphs.mjs`), and 4 items have legacy ids over
the 30-character `MAX_ID_LENGTH` guard (`src/state/work.mjs:33,237`).

This item's job is to lock which of the three named fixes to pursue, not
to design the implementation — that is `fgos-coding-planning`'s job next.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix by scoping `editWork`'s re-validation to only the fields actually present in the patch (or fields whose rule depends on a patched field), instead of re-validating the whole merged candidate. Chosen over (a) adding a `compound-learn` stage-enum allowance for legacy items — fixes only the 61 stage-invalid items, leaves the 4 id-length items still permanently blocked, and permanently pollutes a currently-clean 3-value enum with a value that only exists for old data; and (b) migrating the 65 items' `stage`/`id` to valid values — a data rewrite of historical (mostly `done`/`wontfix`/`retrospective`) records, and renaming an id risks breaking references to it elsewhere (`refs`/`deps`/`parent`, the `fgw/<id>` branch name, the append-only event log) for items that otherwise need no further edits. Confirmed via user approval in conversation (2026-08-06) after this session presented the three-way tradeoff. |
| D2 | This fix loses zero validation strength for the two failing checks specifically: `EDITABLE_FIELDS` (`src/state/store.mjs:238`) never includes `id` or `stage` — `editWork`'s own patch-key allowlist rejects a patch containing either before the merge even happens (`store.mjs:270-276`, comment at line 244 confirms `id`/`status`/`stage`/`domain` are always rejected). So a patch can never introduce a NEW invalid `id` or `stage` value through this door — scoping validation to patched fields only stops re-rejecting OLD values that were already sitting in the store untouched, never weakens what the patch itself is allowed to contain. |
| D3 | Scope stays narrow to the bug as described: `editWork`'s validation pathway only. No change to `addWork` (new items still get full-shape validation, unchanged), no change to `validateDomainFields`/`checkAcceptanceEvidenceTraceable`, no backfill of the 65 items' data. A regression test proving "patching an unrelated field on a legacy-invalid item now succeeds" is an implementation detail for `fgos-coding-planning`/`fgos-coding-implement`, not locked here. |

## Pinned terms

- **Legacy-invalid item** — a work item whose `stage`/`id` predates a
  schema rule (enum shrink, length cap) that now rejects it, but that was
  valid at the time it was written. `editWork` grandfathers these fields
  when the patch does not touch them; `addWork` still rejects them on
  create.

## Scout evidence

- `src/state/store.mjs:258-299` (`editWork`) — `candidate = {...work,
  ...normalizedPatch}` then `validateWork(candidate, Object.keys(before.work))`
  at line 289-290: validates the full merged object, not the patch alone.
- `src/state/store.mjs:238` (`EDITABLE_FIELDS`) — set does not contain
  `id` or `stage`; comment at line 244 confirms both are rejected if a
  patch attempts to include them.
- `src/state/work.mjs:227` (`validateWorkShape`) — line 237 rejects
  `id.length > MAX_ID_LENGTH` (30, line 33); line 387 rejects `stage` not
  in `domain.stages`.
- `node bin/fgos.mjs edit <id> --description ...` run against all 65
  affected ids (tsk-535, logged as a decision on tsk-535, seq 8202) —
  returned `work.stage must be one of [clarify,decompose,executing] when
  present, got: compound-learn` or `work.id must be at most 30 characters`.
- `fgos tool query --capability impact-analysis --status present`: 1
  provider (`gitnexus`, status `present`) — `impact-analysis: full` per
  `CLAUDE.md`'s gate. Informational only; this item makes no code change.
- `fgos list --id tsk-1ne --json`: `discovery` array empty (no prior
  `judgeDiscovery` verdict to reconcile against).

## Canonical references

- `src/state/store.mjs` (`editWork`, `EDITABLE_FIELDS`)
- `src/state/work.mjs` (`validateWorkShape`, `validateWork`, `MAX_ID_LENGTH`)
- `src/state/workflow-stage-graphs.mjs` (coding domain's `stages` enum)
- tsk-535 decision log (seq 8202) — original error-breakdown evidence

## Outstanding questions deferred to planning

- Exact mechanism for "scope validation to patched fields" — e.g. skip
  `validateWorkShape`'s per-field checks whose field is absent from
  `patch` and unchanged from `before`, vs. a more granular per-field
  validator refactor. `fgos-coding-planning` decides the smallest honest
  implementation shape.
- Whether a regression test is added covering this exact scenario (edit an
  unrelated field on a `stage: compound-learn` or long-id item) — expected
  yes, but the test's shape is `fgos-coding-planning`/`fgos-coding-implement`'s call.
