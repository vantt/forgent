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
