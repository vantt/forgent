# Phase 2 impact: typed_wake, type_into_session, session_verb

GitNexus MCP tools were not available in this session, so the blast radius is from `rg` over the workspace
(the gate's "degraded" posture: blast radius confirmed by grep, not by the index).

| symbol | direct callers (upstream) | risk |
|---|---|---|
| `PaneIo::typed_wake` (`packages/session-host/rust/src/pane_io.rs`) | `HostNudge::nudge` (`apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs`, the mailbox typed wake); `type_into_session` (`apps/fgos/src/wiring/supervision.rs`, new); `packages/session-host/rust/tests/typed_wake.rs` | Medium: two production callers, both moved in this change. Its return type changed (`Typed` / `Refused(&str)` became `Submitted` / `Refused { cause, draft }` / `DeliveryUnknown`); `rg TypedWake` finds no other consumer. |
| `type_into_session` | `Verb::SessionType` arm of the supervision verb dispatch only | Low |
| `session_verb` | the supervision request projection (`project_request`) only | Low |
| `Verb::SessionType` | constructed in `session_verb`, matched in the write-operation classifier and the dispatch arm | Low: both matches updated for the new `submit` field. |

Affected flow: the mailbox typed wake now waits the profile's `enter_gap_ms` (codex 600 ms, others 300 ms) and
confirms the submit through `Terminal::confirm_submitted`; the mailbox's own rules and channel selection are unchanged.

Latency. Typing a wake line used to end at its Enter (about 300 ms per CLI, 600 ms for codex, the profile's
`enter_gap_ms`); it now goes on to `Terminal::confirm_submitted`, so a send can press Enter again and wait while the
CLI shows working. The bounds it can spend, read in `packages/agent-protocol/rust/src/terminal/common.rs`, are:
`SUBMIT_ENTER_EVERY_MS` 2500 ms between retried Enters, at most `SUBMIT_MAX_ENTERS` 6 of them (about 15 s of
retrying), `SUBMIT_NO_DRAFT_POLLS` 4 consecutive draft-free looks at `POLL_MS` 700 ms before a quiet composer is
judged, `SUBMIT_WORKING_MS` 8000 ms of continuous working counting as taken, all inside the `SUBMIT_CONFIRM_MS`
60 s deadline. Worst-case mailbox send latency therefore rises from about 300 ms to about 15 s (up to the 60 s
outer deadline if the CLI never confirms). Mailbox rules and channel selection are unchanged: the same line is sent
on the same channel, only the confirmation of the submit is stricter.

The wiring proof in `apps/fgos/tests/supervision_verbs.rs` is weaker than the typed wake's own proof: the fake pane
serves one static screen that already holds the line, so `confirm_submitted` answers `Delivered` through
`brief_echoed` without the screen ever changing. It proves the verb reaches the shared pane call and submits, not
that a real CLI took the line; `packages/session-host/rust/tests/typed_wake.rs` owns that behaviour.
