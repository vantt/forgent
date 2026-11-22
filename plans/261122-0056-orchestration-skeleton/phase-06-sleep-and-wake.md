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
4. Wake the secretary on new owner input (owner choice C of 2026-11-22, handed off from plan
   `261122-0118-heads-stable-and-able` phase 10, supervision event `cda876817cff4f21`): a new owner question in the
   question store, or new mail to the secretary, makes her record actionable, so an idle or sleeping secretary is
   woken (or a successor started) within one watcher interval. That plan ships only a 15-minute timer inside the
   secretary session, kept as the slow fallback; it builds no wake path, so this step is the only one. If the question
   store or mailbox source is not yet a keeper source after phase 5, widen this phase's footprint in the plan rather
   than adding a path beside the keeper.

## Verify

`cargo test -p fgos-supervision --test keeper`. Pass: an idle lead whose record waits is stopped with `sleep`; an
idle secretary is kept under the limit and stopped past it; a busy or unknown head is never stopped; the record turning
actionable starts a successor.

## Rollback

Revert the phase commit; heads then stay in their panes as today.
