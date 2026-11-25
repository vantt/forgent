# Phase 6: Sleep and wake of players

Depends on phase 17, and on phases 5 and 16 of plan `261122-0056-orchestration-skeleton` (the keeper plan, done before this plan starts). Decisions: OS-D18 (sleep ends the session by default; a head talking with a person
may sit in its pane and be woken by mailbox or wake, up to a configured limit, then falls back to the default). The
limit is decided in plan.md: `watcher.conversationSleepMaxSec`, default 43200. Amended 2026-11-23 by the settled
discussion `ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` (D1 to D3, its hand-off items (a) to (f)): a
slept lead keeps its worktree and unlanded work, the sleep state lives in the head record, and the woken lead continues
in the same worktree.

## Inputs

- `packages/supervision/rust/src/keeper.rs` (phases 4, 5); the wake door's `StopSession` and `Activity` ports.
- `docs/platform/runner/contracts/routing-handoff.md` (what a successor receives).
- `core/config-standard/sessionRotation.yaml` (personas `secretary` and the shaper are the conversation heads).
- Hand-off (a): the checkout door `packages/execution/checkout/src/work_remove.rs` (refuses `worktree-dirty-preserved`
  and `worktree-delivery-unproven`; every remover goes through it), the lead skill's worktree naming
  (`core/skills/fgos-lead/SKILL.md` step 1, `<plan dir name>-p<NN>`), and `src/session-host/head-start.mjs`
  (`writeHeadPlacement`).
- Phase 16's `session stop --reason sleep --wake-at` and `fgos session list`; phase 17's wake choice in
  `startHeadSession`.
- The land door `run_land` in `apps/fgos/src/wiring/supervision.rs` (removes only a landed, clean worktree).

## Footprint

`packages/supervision/rust/src/keeper.rs`, `packages/supervision/rust/tests/keeper.rs`,
`core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`, `apps/fgos/src/wiring/supervision.rs`,
`core/skills/fgos-lead/SKILL.md`, `apps/fgos/tests/sleeping_lead_worktree.rs` (new).

## Steps

1. Add `watcher.conversationSleepMaxSec` (default 43200, minimum 60) and `watcher.conversationPersonas` (default
   `[secretary, shaper]`) to the standard and the schema.
2. Keeper rule: a head whose records all wait (`waitingOn` set) and whose activity is `Idle` is stopped through
   `StopSession` (reason `sleep`), unless its persona is a conversation persona and it has been idle less than the
   limit. `Unknown` activity is never stopped. The stop is a Session Host retire (hand-off (c), D2): the wiring's
   `HostStop` adapter runs `session stop <persona> --name <name> --reason sleep --wake-at <until> [--plan <dir>]
   [--phase <NN>]`, `until` being the earliest `waitingOn.until` of the head's records (a head whose records wait only
   on a person or an event gets the conversation limit as its `until`), plan and phase from the record when it names
   them. Phase 16 writes the sleep fields and the `sleep` handoff (hand-off (e), first half); the keeper writes nothing
   itself.
3. When its record becomes actionable again (the `until` passed, read back by the plan source from `placement.json`,
   phase 5), the existing start path starts the successor; phase 17 picks resume or fresh with the handoff. No pane or
   lane is held while asleep, and nothing holds the worktree: it is safe only through the checkout door's refusals
   (D1).
4. Hand-off (b), D1: the woken lead's brief names plan and phase (phase 17's wake line or the handoff). Add to the
   lead skill step 1: before creating a phase worktree, look for `<plan dir name>-p<NN>` in `git worktree list` and
   reuse it when present; create only when absent. Nothing stores a copy of the path.
5. Wake the secretary on new owner input (owner choice C of 2026-11-22, handed off from plan
   `261122-0118-heads-stable-and-able` phase 10, supervision event `cda876817cff4f21`): a new owner question in the
   question store, or new mail to the secretary, makes her record actionable, so an idle or sleeping secretary is
   woken (or a successor started) within one watcher interval. That plan ships only a 15-minute timer inside the
   secretary session, kept as the slow fallback; it builds no wake path, so this step is the only one. If the question
   store or mailbox source is not yet a keeper source after phase 5, widen this phase's footprint in the plan rather
   than adding a path beside the keeper.

## Verify

`cargo test -p fgos-supervision --test keeper` and `cargo test -p fgos --test sleeping_lead_worktree`. Pass:

- an idle lead whose record waits is stopped with `sleep` and the `until` of its record; an idle secretary is kept
  under the limit and stopped past it; a busy or unknown head is never stopped; the record turning actionable starts
  a successor (`keeper`);
- hand-off (f): a lead slept with a committed but unlanded change and an uncommitted one, then a land of another
  branch and `fgos worktree` cleanup, finds both changes in `<plan dir>-p<NN>` on waking, and its start reuses that
  worktree (`sleeping_lead_worktree`, real git in a temp repo, fakes only for the CLI);
- `fgos session list` shows the slept head as `sleeping` with its `wakeAt` (in `sleeping_lead_worktree`, one wiring
  check; the cases are owned by phase 16's `head-list.test.mjs`);
- light-sleep resume, heavy-sleep and refused-resume handoff are owned by phase 17's `head-start.test.mjs`, not
  copied here.

## Rollback

Revert the phase commit; heads then stay in their panes as today and the lead skill creates worktrees as before.
