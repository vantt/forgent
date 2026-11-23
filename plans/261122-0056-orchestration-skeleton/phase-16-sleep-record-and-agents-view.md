# Phase 16: Sleep record in the head record; one read-only view of live and sleeping agents

No dependency. Decisions: D2 and D3 (first half) of the settled discussion
`ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` (§4): the sleep state lives only in the Session Host's
head record `placement.json`; one read-only view, owned by the Session Host, joins Identity's live sessions with the
head records; every sleep writes a handoff with reason `sleep`. Identity's directory is not changed (its locked I3b
rule keeps it live-only). This phase is the Session Host half of phase 6's amendments (hand-off items (c), (d) and the
handoff part of (e)); phase 6 calls it from the keeper.

## Inputs

- `src/session-host/head-stop.mjs` (`stopHeadSession` already writes `retiredAt` and `retiredReason` into the
  lineage's `placement.json` before it asks the head to stop).
- `src/session-host/head-start.mjs` (`lineageDirOf`, `readHeadPlacement`, `writeHeadPlacement`, `identityHolder`;
  a later start replaces the file, so a wake clears the sleep state with no extra step).
- `src/session-host/head-request.mjs` (the request route a confined head's `session stop` goes through).
- `src/session-rotation/handoff-store.mjs` (`writeHandoff`, the rotation handoff writer) and
  `src/session-rotation/rotate.mjs` (`ROTATION_REASONS`, the stop trace `recordStopTrace` and its measured `fraction`).
- `apps/fgos/src/wiring/observe_sources/head_state.rs` (reads `retiredAt`; must keep answering `retired` for a
  sleeping head, so nothing there changes).
- `src/cli/command-registry.mjs` (`session` verb), `bin/fgos.mjs` (its dispatch),
  `packages/host-runtime/contracts/command-manifest.json` (host route of `session` subverbs).
- `docs/platform/session-host/spec.md` §3, §8; `docs/platform/identity/spec.md` (I3b, `identity list`).

## Footprint

`src/session-host/head-stop.mjs`, `src/session-host/head-list.mjs` (new), `src/session-host/head-request.mjs`,
`src/session-rotation/handoff-store.mjs`, `src/session-rotation/rotate.mjs`, `src/cli/command-registry.mjs`,
`bin/fgos.mjs`, `packages/host-runtime/contracts/command-manifest.json`, `test/session-host/head-stop.test.mjs`,
`test/session-host/head-list.test.mjs` (new), `test/session-rotation/handoff-store.test.mjs`.

## Steps

1. `session stop` takes `--reason sleep` with `--wake-at <RFC 3339>` (required with `sleep`, refused
   `wake-at-invalid` otherwise) and optional `--plan <plans/dir>` and `--phase <NN>`. `stopHeadSession` then writes,
   in the same first write it already does, `retiredReason: "sleep"`, `wakeAt`, `plan`, `phase`, `contextFraction`
   (the newest measured `fraction` of the lineage's stop trace, `null` when none) and `cliSessionId` (the live
   holder's CLI session id from its Identity record, `null` when absent). Nothing else stores these (D2).
2. Before the stop request, a sleep writes one handoff through `writeHandoff` with `rotate: "sleep"` (add `sleep` to
   the accepted reasons; the soft, hard and manual paths are unchanged). The handoff names plan, phase and wake time.
   A failed handoff write refuses the sleep stop (`handoff-not-written`) and puts the record back, as a failed stop
   request does today: a lead is never put to sleep without the handoff D3 promises.
3. `head-list.mjs`: `listHeads({ projectRoot }, ports)` reads every lineage `placement.json` under
   `.fgos/runtime/session-rotation/` and joins it with `fgos identity list --project --json`. Each row:
   `{ role, persona, state: live | sleeping | retired, wakeAt?, plan?, phase?, startedAt, retiredAt? }`. `sleeping`
   means `retiredReason: sleep` and no live holder; a live holder wins over any record. It writes nothing.
4. Verb `fgos session list [--json]` serves it (registry, dispatch, host manifest route). From inside a confined head
   it goes through the request route as a read.

## Verify

`node --test test/session-host/head-stop.test.mjs test/session-host/head-list.test.mjs
test/session-rotation/handoff-store.test.mjs`. Pass: a sleep stop writes all six fields and a `sleep` handoff, and a
refused handoff write leaves the record as it was; a sleep stop without `--wake-at` is refused; the list shows a slept
head as `sleeping` with its `wakeAt`, a live head as `live`, a manually stopped head as `retired`; the list writes no
file (directory listing before and after is equal).

## Rollback

Revert the phase commit. Heads stopped with `sleep` before the revert keep extra fields in `placement.json`; the next
start of their lineage replaces the file, and `head_state.rs` ignores the extra fields.
