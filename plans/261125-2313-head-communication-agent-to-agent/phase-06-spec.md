# Phase 6: Mailbox spec matches main

`docs/platform/agent-mailbox/spec.md` says what main holds (discussion task `task-knowhow-and-spec`, spec half;
§3 row 10). The skill half is the follow-up plan. Capability: `code:implement`.

## Inputs

- The landed code of phases 2, 4 and 5; `apps/fgos/src/wiring/mailbox_remote.rs`, `mailbox_sync.rs`.
- `docs/platform/agent-mailbox/spec.md` header (Implementation, Source lines), §6.2, §7, §15.2, §15.8, §16 question
  17, §17.
- `docs/platform/governance.md#decision-scope-to-holder-table` for where HC-D1 to HC-D5 are recorded.

## Footprint

`docs/platform/agent-mailbox/spec.md`.

## Steps

1. Header: drop "built on branch `mailbox/v1-v3`, not on main"; list what main holds, including cross-machine mail
   and the typed channel.
2. §15.2: move from later to built, with the limit (recorded until the recipient machine fetches, sync interval).
3. §6.2: add the typed channel row and the `path` values; §15.8: mark the typed nudge built, the shared crate not
   built (simpler alternative taken), question 17 answered by the Identity terminal key.
4. §17 decision history: one entry for HC-D1 to HC-D5 citing the discussion file.

## Verify

`rg -n "not on main|later part" docs/platform/agent-mailbox/spec.md` shows no stale claim about the parts built;
`node scripts/plan-contract-check.mjs --plan plans/261125-2313-head-communication-agent-to-agent` still ok;
`npm test -- test/docs` (if present) green.

## Rollback

Revert the phase commit.
