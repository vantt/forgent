# Signal Sources Fact List (Phase 2: Drone Definitions)

Review of existing Observe records and attributes for the four session signals specified in SP-D5 and Phase 2:

| # | Signal | Existing Record | Carrying Attributes | Producer & Source Location | Status |
|---|---|---|---|---|---|
| 1 | **Session gone** | `fgos.head.state` | `fgos.head.state` (`gone`), `fgos.head.identity` (`absent`), `subject: { kind: "head" }` | `apps/fgos/src/wiring/observe_sources/head_state.rs` (`head-state` source) | **Available** |
| 2 | **Idle too long holding unfinished work** | `fgos.session.activity` | `fgos.session.activity.source` (`transcript`, `sidecar`), `ts`, `subject: { kind: "session" }` | `packages/observe/rust/src/sources/transcript_records.rs` (`claude-transcripts` source) | **Available** |
| 3 | **No commit or result for N minutes** | `fgos.run.settled` | `fgos.run.settled` timestamp & attrs, `fgos.plan.activity` (`fgos.git.commit`), `fgos.run.attempt` | `packages/run-result/rust/src/lib.rs` (`run-result` source) & `apps/fgos/src/wiring/observe_sources/plan_history.rs` | **Available** |
| 4 | **Repeated refused commands** | None (`fgos.run.reason` evaluated) | `fgos.run.reason` only exists on `fgos.run.settled` (subject `run`, tracking legacy outcome derivation reasons). No producer records command-level refusals across Identity sessions. | None | **GAP** |

### Summary of Decisions for Phase 2:
- Signal 1 (`session-gone`), Signal 2 (`session-idle`), and Signal 3 (`session-no-result`) have active record producers and will have watcher drone definitions and test fixtures implemented.
- Signal 4 has no active Observe producer in the codebase today. Per `plan.md` ("A signal needs a record no producer writes today (likeliest: refused commands)... a signal with none is reported to the lead as a gap and that definition is not written"), this definition is not shipped and is marked as a gap.
