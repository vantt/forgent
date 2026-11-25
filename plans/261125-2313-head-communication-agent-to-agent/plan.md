---
contract: plan-v1
title: "Head to head mail from inside the cage: one send, the door picks the path and wakes the recipient, every refusal names its cause"
status: running
priority: P1
blockedBy: []
footprint:
  - plans/261125-2313-head-communication-agent-to-agent/**
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/session-host/rust/src/forwarder.rs
  - packages/session-host/rust/src/permissions.rs
  - packages/session-host/rust/src/pane_io.rs
  - packages/session-host/rust/tests/forwarder.rs
  - packages/session-host/rust/tests/permissions.rs
  - packages/session-host/rust/tests/typed_wake.rs
  - packages/run-supervisor/rust/src/head_client.rs
  - packages/run-supervisor/rust/src/head_request.rs
  - apps/fgos/src/wiring/mailbox_verbs.rs
  - apps/fgos/src/wiring/mailbox_verbs/**
  - apps/fgos/src/wiring/mailbox_root.rs
  - apps/fgos/src/wiring/mailbox_hook.rs
  - apps/fgos/tests/mailbox_routes.rs
  - packages/mailbox/rust/core/src/**
  - packages/mailbox/rust/core/tests/**
  - packages/mailbox/rust/store/src/record/**
  - packages/mailbox/rust/store/src/hook/**
  - packages/mailbox/rust/store/src/nudge.rs
  - packages/mailbox/rust/store/src/verbs.rs
  - packages/mailbox/rust/store/src/adapters/**
  - packages/mailbox/rust/store/tests/record_*.rs
  - packages/mailbox/rust/store/tests/nudge_*.rs
  - packages/mailbox/contracts/adapters.v1.json
  - packages/mailbox/contracts/frame.v1.txt
  - packages/agent-protocol/rust/src/terminal/**
  - packages/agent-protocol/rust/tests/terminal_vectors.rs
  - packages/agent-protocol/contracts/fixtures/terminal/**
  - packages/identity/rust/src/directory.rs
  - docs/platform/agent-mailbox/spec.md
  - test/live/mailbox-heads.live.mjs
base: 17a914d8acb4c1b16e9949dc8d60f5d433a3b0c2
lead: head:lead-forgent-261125-2313-head-c-cdfd0
source:
  - plans/discussions/ds-h3fvnp6qbt-head-communication-and-requests/DISCUSSION.md
  - p-rchuoa2v3k
  - p-ia2v33b54u
  - p-bifjfd5rix
  - p-nnaksnxtwu
created: 2026-11-25
---

# Head to head mail from inside the cage

Answers the agent-to-agent part of the settled discussion
`plans/discussions/ds-h3fvnp6qbt-head-communication-and-requests/DISCUSSION.md` (HC-D1 to HC-D5). The owner channel
and the missing-grant request are not in this plan (discussion §3 row 12). The skill know-how file, the
session-host spec line and the move of `supervision.rs` onto the shared pane lookup are in the follow-up plan
`plans/261125-2315-head-mail-knowhow-in-skills/`, because their files belong to the running plan
`261124-2143-head-lifecycle-events` until it lands.

## Outcome

A head (secretary, supervisor, lead, planner, shaper) sends one `fgos mailbox send --wake` from inside its cage and
reads one answer. The host records the mail (locally when the recipient is a live head on this machine, on the Event
Store otherwise), wakes an idle recipient by the fastest channel its CLI allows (socket or `codex queue` push, else
one typed labelled wake line, else the next tool call) and says which path it took. A confined head reads its own
inbox. A refusal always carries the real code, never a bare `host-failed`. Mail queued for a head's old generation
is offered once to its successor.

## Acceptance criteria

1. The diagnosis report `plans/261125-2313-head-communication-agent-to-agent/reports/diagnose-confined-mail.md`
   reproduces tonight's confined `host-failed` (send) and `lock-unavailable` (read) and names the cause with the
   line that causes it; the fix of phase 4 removes that cause (discussion criterion 1).
2. `cargo test -p fgos-session-host --test permissions --test forwarder` passes, with a case per head persona that
   `mailbox send` and `mailbox inbox` are allowed (lead and planner `--to` limits unchanged) and a case that a host
   verb refused with no code of its own surfaces the domain code it printed, never `host-failed` (criteria 2, 3).
3. `cargo test -p fgos --test mailbox_routes` passes a confined send and read through the request socket that
   records and returns the mail, with no lock or record opened by the confined process (criterion 2).
4. `cargo test -p fgos-mailbox-core` and `cargo test -p fgos-mailbox --test record_snapshot` pass a case: mail queued
   for generation N of a role is offered once to generation N+1 and never twice (criterion 4).
5. `cargo test -p fgos-agent-protocol --test terminal_vectors` passes `composer_state` vectors (`empty`,
   `not-empty`, `unknown`) from fixtures captured from the real Claude Code, Codex and agy (criterion 5, gate).
6. `cargo test -p fgos-session-host --test typed_wake` and `cargo test -p fgos-mailbox --test nudge_typed` pass: the
   typed wake types only into an idle pane with an empty composer and no dialog, never moves focus, keeps one
   outstanding nudge per head and falls back to `turn` on `unknown`; the send answer's `path` field is one of
   `local-pushed`, `local-typed`, `local-next-tool-call`, `remote-recorded` (criteria 5, 6).
7. `docs/platform/agent-mailbox/spec.md` header, §6.2, §15.2 and §15.8 match main (cross-machine mail built, typed
   wake built, the shared crate not built) (criterion 7, spec half). The `CHANGELOG.md` line is written by the
   follow-up plan, since the running plan `261125-1631-agent-context-engine` owns that file.
8. `node --test test/live/mailbox-heads.live.mjs` (live, run by the integration phase) shows each confined persona
   sending to a peer and reading a reply, an idle head of each drained CLI woken within the bound without focus
   change, and one cross-machine send read after a fetch; `npm test` and `cargo test --workspace` green on the
   merged tree (criterion 8).

## Non-goals

- The owner channel and the missing-grant request (discussion §3 row 12; a new discussion).
- Claude Code `SendMessage` as a rung (discussion §3 row 4).
- A faster cross-machine wake than the Event Store sync interval (§3 row 8).
- The mailbox head finder beside Identity (`p-5igcekysul`) and latency measurement (`p-whvn2fgyep`).
- Widening any persona: the only new rows are `mailbox inbox` for reading one's own mail (HC constraint, §3 row 14).
- Making `--wake` the default. G0 signed wake as the sender's permission (`agent-mailbox/spec.md` §14); HC-D4 is
  met by the door choosing the channel, not by removing that permission. The follow-up plan's know-how file tells
  heads to send with `--wake`.
- The shared crate `fgos-agent-terminal` of spec §15.8: the spec's own "simpler alternative" (terminal-control plus
  agent-protocol pure functions, no crate) is taken, since no second consumer of a default `AgentIo` exists.
- Skill files, the session-host spec and `apps/fgos/src/wiring/supervision.rs` (follow-up plan).

## Prior art

Reused, not rebuilt:

- The `Nudge` port, `NUDGE_LINE` and the Codex and Claude socket channels (`packages/mailbox/rust/store/src/nudge.rs`,
  commits `0e6c26d43`, `9d1c80e34`, `1eec06568`, from legacy plan `261030-0323-mailbox-v9-wake-on-mail`). The typed
  wake is a third `NudgeChannel`, not a new mechanism; the "one outstanding nudge" rule and wake caps stay.
- Cross-machine mail (`apps/fgos/src/wiring/mailbox_remote.rs`, `mailbox_sync.rs`): built, only the spec is stale.
- The typed-signal rules of spec §15.8 (kept since 2026-10-20) and `agent-protocol`'s `draft_still_in_composer` and
  `Inspection.prompt_text` for the composer reading.
- Pane lookup through Identity's directory (`ids.terminal.key`), the same one `session type` uses
  (`apps/fgos/src/wiring/supervision.rs` `pane_of`). It moves into the identity crate as one method here;
  `supervision.rs` switches to it in the follow-up plan (L10 item recorded there).
- `session-host`'s `PaneIo` (`packages/session-host/rust/src/pane_io.rs`) as the one door that sends to and inspects
  a pane by key.

Missing, and built here: the reason for the confined failures, `mailbox inbox` rows, the refusal-code pass-through,
generation handover of queued mail, `composer_state`, the typed channel, and the `path` field of the send answer.

**Spec §15.8 question 17 (allocation record per attached head), decided by analysis.** The typed wake uses the
terminal key Identity already holds for a head, which the session host writes and clears with the head's own
lifecycle, so no `attach` and no new allocation record is made. A head with no terminal in Identity (for example a
pane a person opened by hand without `fgos session start`) is not typed into; its answer is
`local-next-tool-call`. This is what rule 6 of §15.8 already asks (fall back on unknown), so no owner question is
needed.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Send door picks local or remote, wakes, names the path in its answer | `agent-mailbox` | extends `mailbox send`; `path` joins the send answer |
| Typed wake as a third nudge channel | `agent-mailbox` | `NudgeChannel::Typed`; rules from spec §15.8 |
| Safe-to-type gate over a pane (idle, empty composer, no dialog, focus-neutral) | `session-host` | method on `PaneIo`, the existing pane door |
| `composer_state` predicate per CLI with fixtures | `agent-protocol` | pure function of screen and `Inspection` |
| Terminal key of a listed session | `identity` | `Listed::terminal_key()`; `supervision.rs` `pane_of` moves onto it in the follow-up plan |
| `mailbox inbox` rows for each head persona | `session-host/head-permissions.v1` | read of one's own mail only |
| Refusal code pass-through for forwarded host verbs | `session-host` | `forwarder.rs` refusal mapping |
| Queued mail follows a rotation | `agent-mailbox` | record and registry, generation handover |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Diagnose confined mail](phase-01-diagnose-confined-mail.md) | - | plans/261125-2313-head-communication-agent-to-agent/reports/diagnose-confined-mail.md | 1 | done |
| 2 | [Queued mail follows a rotation](phase-02-mail-follows-rotation.md) | - | packages/mailbox/rust/core/src/**, packages/mailbox/rust/core/tests/**, packages/mailbox/rust/store/src/record/**, packages/mailbox/rust/store/src/hook/**, packages/mailbox/rust/store/tests/record_*.rs | 1 | ready |
| 3 | [Composer state per CLI](phase-03-composer-state.md) | - | packages/agent-protocol/rust/src/terminal/**, packages/agent-protocol/rust/tests/terminal_vectors.rs, packages/agent-protocol/contracts/fixtures/terminal/** | 1 | ready |
| 4 | [Mail through the request socket](phase-04-mail-through-socket.md) | 1 | packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/src/forwarder.rs, packages/session-host/rust/src/permissions.rs, packages/session-host/rust/tests/forwarder.rs, packages/session-host/rust/tests/permissions.rs, packages/run-supervisor/rust/src/head_client.rs, packages/run-supervisor/rust/src/head_request.rs, apps/fgos/src/wiring/mailbox_root.rs, apps/fgos/src/wiring/mailbox_hook.rs, apps/fgos/src/wiring/mailbox_verbs.rs, apps/fgos/tests/mailbox_routes.rs | 2 | ready |
| 5 | [The send door wakes the recipient](phase-05-send-door-wakes.md) | 2, 3, 4 | packages/mailbox/rust/store/src/nudge.rs, packages/mailbox/rust/store/src/verbs.rs, packages/mailbox/rust/store/src/adapters/**, packages/mailbox/rust/store/tests/nudge_*.rs, packages/mailbox/rust/core/src/report.rs, packages/mailbox/contracts/adapters.v1.json, packages/mailbox/contracts/frame.v1.txt, packages/session-host/rust/src/pane_io.rs, packages/session-host/rust/tests/typed_wake.rs, packages/identity/rust/src/directory.rs, apps/fgos/src/wiring/mailbox_verbs.rs, apps/fgos/src/wiring/mailbox_verbs/**, apps/fgos/tests/mailbox_routes.rs | 3 | ready |
| 6 | [Mailbox spec matches main](phase-06-spec.md) | 4, 5 | docs/platform/agent-mailbox/spec.md | 4 | ready |
| 7 | [Live probe and integration](phase-07-live-probe-and-integration.md) | 1, 2, 3, 4, 5, 6 | test/live/mailbox-heads.live.mjs, plans/261125-2313-head-communication-agent-to-agent/reports/integration.md | 5 | ready |

Waves: phases 1, 2 and 3 run at once (disjoint: a report, the mailbox record and core, agent-protocol). Phase 4
waits for the diagnosis. Phase 5 needs the rotation-aware record, the composer predicate and the socket path.
Phase 6 writes the spec once the shape is landed; phase 7 is the one wiring proof above the lower tests and the
merge gate. Hot files: `apps/fgos/src/wiring/mailbox_verbs.rs` and `apps/fgos/tests/mailbox_routes.rs` have one
writer per wave (4, then 5).

Cross-plan check: the running plans `261124-2143-head-lifecycle-events` and `261125-1631-agent-context-engine` own
`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml`, `CHANGELOG.md`, the skill
sources and renders and `docs/platform/session-host/spec.md`; this plan writes none of them (the typed wake lives in a submodule
of `mailbox_verbs.rs`, and `apps/fgos` already depends on session-host, identity and terminal-control).

## Owner questions

None. The one open point the discussion named (spec §15.8 question 17) is decided by analysis above. If phase 1
finds a cause that needs a write outside this footprint (for example inside the confinement driver owned by draft
plan `261124-1853-confinement-to-rust`), phase 4's lead stops and raises it with `fgos supervisor raise --kind
coordination-help` rather than widening the footprint.

## Risks and rollback

- **The typed line reaches the model as user input.** Mitigated by the fixed label (§8.1, §15.8 rule 3) and the
  content staying in the mailbox; no body is ever typed. Proof: the typed-wake test asserts the exact line.
- **Typing merges with a person's half-typed text or answers a dialog.** The gate re-observes right before typing
  and refuses on anything but `idle` + `empty` + no dialog; the residual race (§15.8 rule 7) is counted through
  nudge outcomes. Medium risk; proof point: phase 5 test plus the phase 7 live case with a half-typed composer.
- **Phase 1 finds a cause outside this footprint.** Phase 4 stops and raises; phases 2, 3 and 5's agent-protocol and
  record parts are unaffected.
- **Composer fixtures drift with a CLI version.** The fixtures carry the version; the live suite fails on a bump
  until re-captured (§15.8).
- **Rollback:** revert the plan's commits in reverse wave order. The typed channel can also be turned off alone by
  removing its `adapters.v1.json` rows, which drops every head back to `turn` without touching the other fixes.
