# Agent Protocol Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the pure per-CLI adapters that read what an agent CLI showed and name what happened, for the run supervisor
Design status: Accepted
Implementation status: In progress (direct mode adapters for claude, codex, agy, pi, omp landed; terminal mode is plan 6.3)
Canonical: Yes
Owner: Agent-protocol component (L3)
Source: packages/agent-protocol/rust (crate fgos-agent-protocol)
Contracts: packages/agent-protocol/contracts/
Last reviewed: 2026-10-18
Related:
- docs/platform/run-supervisor/spec.md
- docs/platform/component-boundary.md
- docs/specs/runner.md
- plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
```

## 1. Purpose

An adapter is a pure state machine for one agent CLI in one launch mode. It reads what the agent left behind (a capture tail, an exit, an outbox listing) and names the result. It never opens a tab, picks a model, changes a timeout or decides a retry. It has no dependency on terminal-control, on a lock or on an attempt; the run supervisor wires it.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The named results (section 4) | Argv, model or executor choice (Execution Core; `resolveExecutorCommand` in `src/runner/dispatch/transport.mjs` builds argv from the executor configuration) |
| Stdin policy per CLI (section 6) | Timeouts, deadlines, retry, fallback (supervisor, controller) |
| The activity signal the idle timer counts (section 7) | Judging the work (Run Result Evaluator) |
| One fixture file of real screen or output tails per CLI and mode | Terminal screens and keys (terminal-control, plan 6.3) |

## 3. The IO gate

The contract ([agent-protocol.v1.json](../../../packages/agent-protocol/contracts/agent-protocol.v1.json)) gives each adapter one port, `AgentIo`:

| Operation | Meaning | Modes |
|---|---|---|
| `send(text?, keys?, submit)` | Put input in front of the agent | terminal only; in direct mode it answers `Unsupported` |
| `read()` | New lines since the previous read: the stdout capture tail (direct) or the screen (terminal) | both |
| `activity()` | A monotonic counter that rises on anything the idle timer counts, or absent | both |

In direct mode the supervisor does not need `send`: the gate gave the brief to the agent at spawn (argv or stdin file) and owns its IO.

## 4. Named results

| Result | Meaning | Mode |
|---|---|---|
| `completed(resultPath)` | The agent finished and `outbox/result-<N>.json` exists (the newest by number) | both |
| `blocked(reason)` with `login`, `trust-dialog`, `usage-limit` | The CLI waits for something only a person can do | both |
| `needs-human` | The agent asked a question only a person can answer | both |
| `exited(code)` | The process exited without a result file | direct |
| `ready`, `delivered`, `delivery-unknown` | The prompt is ready; the brief is confirmed submitted (a changed screen is not proof); delivery could not be confirmed and is never resent blind | terminal (plan 6.3) |

Rules for direct mode, as implemented:

1. A result file wins over everything else: `completed`, whatever the tail says (a wording quoted inside the agent's own output is not a block).
2. Without a result file the **final words** decide: only the last 5 non-empty lines of the capture are examined (`TAIL_LINES`). A login or quota wording far up a long capture is not a block.
3. Login wordings (for example `oauth refresh failed`, `invalid_grant`, `run /login`, `not logged in`, an API key reported missing, invalid or expired) give `blocked(login)`. Quota wordings (`you've hit your usage limit`, `usage limit has been reached`, `individual quota reached`) give `blocked(usage-limit)`. The wordings are those the Node runner already classifies at settlement (`provider-auth-failure.mjs`), cut down to what a live round needs.
4. Otherwise `exited(code)`.

`trust-dialog` and `needs-human` exist in the contract; the direct adapters have no output pattern for them yet (they belong to the interactive prompt). Nothing in the direct adapters returns them today.

## 5. Adapter per CLI and mode

| CLI | `direct` | `terminal` |
|---|---|---|
| claude | plan 6.2: landed | plan 6.3 |
| codex | plan 6.2: landed; stdin always the null device | plan 6.3 |
| agy | plan 6.2: landed | plan 6.3 |
| pi | plan 6.2: landed | plan 6.3 |
| omp | plan 6.2: landed | plan 6.3 |

An unknown CLI name (matching is case-insensitive) in `envelope.agentProtocol.cli` gets the **generic** adapter in direct mode: exit and outbox only, no output patterns, no block detection. In terminal mode an envelope naming a CLI without a terminal adapter is refused before launch (`agent-protocol-unsupported`). Today the five direct adapters share one behavior and differ only where a CLI needs it (codex); each has its own fixture file under `packages/agent-protocol/contracts/fixtures/direct/<cli>/vectors.json` with the same six cases (completed with outbox, exited without outbox, blocked login, blocked usage limit, a login wording far up is not a block, an outbox beats a quoted wording).

## 6. Design decision: argv stays in the executor configuration

The adapter does not build argv. The controller resolves the command through `resolveExecutorCommand` from the executor configuration and writes `launch.command`, `launch.args`, `launch.env` and `launch.stdinPolicy` into the immutable envelope; the gate runs exactly that. Reason: moving argv rendering to Rust would move the ProviderAdapter binder (`transport.mjs`) to Rust, which a run that survives a dead controller does not need (owner decision 2026-10-16, plan decision D4). If that rendering ever moves, this spec and the contract change together.

What the adapter does decide for direct mode:

| Decision | Rule |
|---|---|
| Stdin | Null device by default for every CLI (`stdinPolicy: null` in the envelope; `/dev/null`, `NUL` on Windows). The other policy is `brief-file`, where the gate opens `launch.briefPath` read-only as stdin; the envelope states which one applies, and the adapter's `stdin_policy()` default is the null device. **codex must use the null device**: it probes piped stdin ("Reading additional input from stdin...") and blocks for ever on an open pipe nothing writes to |
| Activity for idle | Section 7 |
| Completion | The agent exited (reported by `gate-exit.json`) and `outbox/result-<N>.json` exists; the newest result is the one with the highest number, and a name with a sign or a non-numeric part is ignored |
| Named blocks | Section 4 |

## 7. Activity source for idle

The supervisor tails the stdout and stderr capture files (up to 64 KiB per tick) and asks the adapter to judge each new chunk:

| Chunk | Activity |
|---|---|
| Empty or only whitespace | `Quiet`: the idle timer keeps running |
| Plain text | `Output` |
| A line that starts with `{` and ends with `}` | `Event` (a CLI that streams JSON events) |

`Output` and `Event` both reset the idle timer. The supervisor then stops the agent after `idleMs` of `Quiet` (cause `idle`).  Heartbeat files are for display and never count as activity.

## 8. Boundaries

- No dependency on terminal-control, locks, attempts, envelopes or the filesystem layout of a run: the supervisor passes in the tail, the exit and the outbox listing.
- No retry decision: `blocked(login)` and `blocked(usage-limit)` are facts the controller turns into provider-capacity behavior (fail over to another account, lock a dead login) elsewhere.
- The terminal adapters (ready, paste-chip recognition, confirming delivery, recognizing done, the exit command) arrive with plan 6.3 and read screens through terminal-control by key.

## 9. Lịch sử quyết định

- **2026-10-16 — D4: cấu hình executor là nguồn duy nhất của argv.** Adapter `direct` không dựng argv; chỉ quyết stdin, nguồn hoạt động, nhận xong và kết quả có tên. Chuyển binder ProviderAdapter sang Rust thêm khoảng 8 giờ và một phase riêng, không cần cho mục tiêu sống qua controller chết.
- **2026-10-18 — Adapter `direct` đọc đuôi 5 dòng, outbox thắng.** Lời login hay hết quota nằm xa phía trên không phải một lần chặn; kết quả trong outbox được quyết bất kể đuôi nói gì.

## 10. Related files

| Relationship | File |
|---|---|
| defines | [agent-protocol.v1.json](../../../packages/agent-protocol/contracts/agent-protocol.v1.json) |
| consumer | [run-supervisor/spec.md](../run-supervisor/spec.md) |
| boundary | [component-boundary.md](../component-boundary.md) |
| plan | [plan.md](../../../plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md) |
| design | [design r6, section 8](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |
