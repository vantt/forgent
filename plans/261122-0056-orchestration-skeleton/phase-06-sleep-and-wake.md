# Phase 6: Sleep and wake of players

Depends on phase 5. Decision: OS-D18 (sleep ends the session by default; a
head talking with a person may sit in its pane and be woken by mailbox or wake, up to a configured limit, then falls
back to the default). The limit is decided in plan.md: `watcher.conversationSleepMaxSec`, default 43200.

## Inputs

- `packages/supervision/rust/src/keeper.rs` (phases 4, 5); the wake door's `StopSession` and `Activity` ports.
- `docs/platform/runner/contracts/routing-handoff.md` (what a successor receives).
- `core/config-standard/sessionRotation.yaml` (personas `secretary` and the shaper are the conversation heads).

## Footprint

`packages/supervision/rust/src/keeper.rs`, `packages/supervision/rust/tests/keeper.rs`,
`core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`, `apps/fgos/src/wiring/supervision.rs`.

## Steps

1. Add `watcher.conversationSleepMaxSec` (default 43200, minimum 60) and `watcher.conversationPersonas` (default
   `[secretary, shaper]`) to the standard and the schema.
2. Keeper rule: a head whose records all wait (`waitingOn` set) and whose activity is `Idle` is stopped through
   `StopSession` (reason `sleep`), unless its persona is a conversation persona and it has been idle less than the
   limit. `Unknown` activity is never stopped.
3. When its record becomes actionable again, the existing start path starts a new session that receives the handoff
   per `routing-handoff.md`; no pane or lane is held while asleep.

## Verify

`cargo test -p fgos-supervision --test keeper`. Pass: an idle lead whose record waits is stopped with `sleep`; an
idle secretary is kept under the limit and stopped past it; a busy or unknown head is never stopped; the record turning
actionable starts a successor.

## Rollback

Revert the phase commit; heads then stay in their panes as today.
