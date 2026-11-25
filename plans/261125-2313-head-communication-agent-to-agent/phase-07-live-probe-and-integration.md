# Phase 7: Live probe and integration

The one wiring proof above the lower tests, and the merge gate (discussion task `task-live-probe`, criterion 8).
Capability: `code:test`.

## Inputs

- Every earlier phase's branch and verify output.
- `test/live/mailbox-claude.live.mjs`, `test/live/mailbox-behaviour.live.mjs` (patterns for live suites).
- `docs/platform/agent-mailbox/spec.md` §15.8 live-suite paragraph.

## Footprint

`test/live/mailbox-heads.live.mjs`,
`plans/261125-2313-head-communication-agent-to-agent/reports/integration.md`.

## Steps

1. Merge the phase branches in wave order onto current main and run `npm test` and `cargo test --workspace` on the
   combined tree.
2. Write `test/live/mailbox-heads.live.mjs`: start confined heads of each persona with `fgos session start`; each
   sends `--wake` to a peer it is allowed to reach and reads a reply with `fgos mailbox inbox`; an idle Claude Code,
   Codex and agy head is woken within the bound, with focus unchanged; a head with a half-typed composer is not typed
   into and its answer says so. It asserts behaviour only, no copy of lower-layer cases.
3. Cross-machine: one send to a head on another machine answers `remote-recorded`, and is read there after
   `fgos` syncs (manual step recorded in the report when the second machine is not reachable from the suite).
4. Write `reports/integration.md`: gate output, live results, the cross-machine evidence, and which backlog rows
   (`p-rchuoa2v3k`, `p-ia2v33b54u`, `p-bifjfd5rix`) the supervisor can close.

## Verify

`npm test && cargo test --workspace` green on the merged tree; `node --test test/live/mailbox-heads.live.mjs` green
on this machine. Pass: every persona case and every drained-CLI wake case passes.

## Rollback

Revert the merge commits in reverse wave order; delete the live suite.
