# Agent Protocol Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the pure per-CLI adapters that read what an agent CLI showed and name what happened, for the run supervisor
Design status: Accepted
Implementation status: Built (direct and terminal adapters for claude, codex, agy, pi, omp)
Canonical: Yes
Owner: Agent-protocol component (L3)
Source: packages/agent-protocol/rust (crate fgos-agent-protocol)
Contracts: packages/agent-protocol/contracts/
Last reviewed: 2026-10-24
Related:
- docs/platform/run-supervisor/spec.md
- docs/platform/terminal-control/spec.md
- docs/platform/component-boundary.md
- docs/specs/runner.md
- plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md
- plans/261016-1351-terminal-mode-and-launcher-identity/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
```

## 1. Purpose

An adapter is a pure state machine for one agent CLI in one launch mode. It reads what the agent left behind (a capture tail, an exit, an outbox listing) and names the result. It never opens a tab, picks a model, changes a timeout or decides a retry. It has no dependency on terminal-control, on a lock or on an attempt; the run supervisor wires it.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The named results (section 4) | Argv, model or executor choice (Execution Core; `resolveExecutorCommand` in `src/runner/dispatch/transport.mjs` builds argv from the executor configuration) |
| Reading the outbox: which `result-<N>.json` is the newest and complete (sections 4, 5.1) | Stdin policy (the gate opens stdin from the envelope's `launch.stdinPolicy`; section 6) |
| The activity signal the idle timer counts (section 7) | Timeouts, deadlines, retry, fallback (supervisor, controller); judging the work (Run Result Evaluator) |
| One fixture file of real screen or output tails per CLI and mode | Terminal screens and keys (terminal-control: the supervisor wires `AgentIo` to it) |

## 3. The IO gate

The contract ([agent-protocol.v1.json](../../../packages/agent-protocol/contracts/agent-protocol.v1.json)) gives each adapter one port, `AgentIo`:

| Operation | Meaning | Modes |
|---|---|---|
| `send(text?, keys?, submit)` | Put input in front of the agent | terminal only; in direct mode it answers `Unsupported` |
| `screen()` | The visible screen of the pane | terminal |
| `inspect()` | The screen detector's verdict (`state`, `visible_blocker`, `visible_idle`, `visible_working`, whether a rule matched, the prompt text) | terminal |
| `now_ms()`, `pause(ms)` | The clock and the only way time passes: the supervisor keeps its own watch (deadlines, cancel, carrier) running inside `pause`, and a test drives a virtual clock. Every wait in an adapter goes through `pause`, outbox reads included (the stability wait of a result file), so a stop request cuts it short | terminal |

In direct mode the adapter needs no port at all: the gate gave the brief to the agent at spawn (argv or stdin file) and owns its IO, and the supervisor passes the capture tail, the exit and the outbox listing to the adapter as plain values.

## 4. Named results

| Result | Meaning | Mode |
|---|---|---|
| `completed(resultPath)` | The agent finished and `outbox/result-<N>.json` exists (the newest by number) | both |
| `blocked(reason)` with `login`, `trust-dialog`, `usage-limit` | The CLI waits for something only a person can do, or its quota is used up. `usage-limit` is named in both modes by the same anchored wording rule (below) | both |
| `needs-human` | The agent asked a question only a person can answer | both |
| `exited(code)` | The process exited without a result file | direct |
| `ready` | The CLI shows an empty prompt and can take the brief | terminal |
| `delivered` | The brief is confirmed submitted: the CLI shows it working **and** its composer no longer holds the brief (or it keeps working for 8 s, longer than a paste takes to be ingested), or its composer is empty **and** the brief is echoed in the conversation, or a complete result already exists. A changed screen, or one look at `working` while the TUI takes in the paste, is not proof | terminal |
| `delivery-unknown` | Delivery could not be confirmed, or the prompt never became ready. Nothing is resent blind | terminal |

Rules for direct mode, as implemented:

1. A result file wins over everything else: `completed`, whatever the tail says (a wording quoted inside the agent's own output is not a block).
2. Without a result file the **final words** decide: only the last 5 non-empty lines of the capture are examined (`TAIL_LINES`). A login or quota wording far up a long capture is not a block.
3. Login wordings (for example `oauth refresh failed`, `invalid_grant`, `run /login`, `not logged in`, an API key reported missing, invalid or expired) give `blocked(login)`. Quota wordings (`you've hit your usage limit`, `usage limit has been reached`, `individual quota reached`) give `blocked(usage-limit)`. The wordings are those the Node runner already classifies at settlement (`provider-auth-failure.mjs`), cut down to what a live round needs.
4. Otherwise `exited(code)`.

The same wording rule holds in both modes and on every path that judges a stop:

- A wording joins the matchers only with a recorded vector (a real capture under `packages/agent-protocol/contracts/fixtures/`) that shows it.
- On a terminal screen, login and quota wordings match from the **start of the line**, after an optional `error` (login also `warning` or `fatal`) label. The screen also carries the agent's own text, so a wording in the middle of a sentence is not the CLI speaking. Direct mode reads the last 5 capture lines (`TAIL_LINES`) and matches a login wording anywhere on one of them (a glog line carries it mid-line); quota is anchored in both.
- The terminal paths that already know the agent stopped use one rule: the detector said `blocked` (at the ready gate or after delivery), or the screen is idle after delivery. All three call the same classification (trust dialog, login, then quota). The screen-only checks that run before any stop is known (start banner, the ready gate's own screen look, the unruled wait) skip quota, so quota text left in scrollback never stops a launch.

`trust-dialog` and `needs-human` exist in the contract; the direct adapters have no output pattern for them (they belong to the interactive prompt). Only the terminal adapters return them (section 5.1). 

Receipt reasons the protocol renders (`TerminalOutcome::receipt_reason` and the `REASON_*` constants in `packages/agent-protocol/rust/src/terminal/mod.rs`; the full list with their meanings is `toReceiptReason` in [terminal-outcomes.v1.json](../../../packages/agent-protocol/contracts/terminal-outcomes.v1.json)): `terminal:blocked:<login|trust-dialog|usage-limit>`, `terminal:needs-human`, `terminal:delivery-unknown`, and the four early ends the supervisor itself names, `terminal:foreground-not-agent`, `terminal:agent-not-started`, `terminal:result-unreadable`, `terminal:completed-no-exit`. The direct mode's `direct:blocked:<reason>` arm arrives when the supervisor's settle step calls `Direct::classify` (not wired yet; the Node settle step still re-reads the screen, section 8).

## 5. Adapter per CLI and mode

| CLI | `direct` | `terminal` |
|---|---|---|
| claude | landed | landed: exit `/exit` + Enter; folder-trust dialog; Enter gap 300 ms |
| codex | landed | landed: exit `/quit` + Enter; trust dialog (v0.163 words it "Trust this folder?" and opens it about a second after the first prompt screen); brief delivered through the prompt door (one `agent prompt` send, text plus submit; typed text then Enter loses its first Enters to a long paste, 4 to 6 or more); Enter gap 600 ms still applies to the typed path; a draft that stays in the composer gets Enter again every 2.5 s, six times at most; chip wording `[Pasted Content N chars]`; launch argv carries `-c shell_environment_policy.set={FGOS_SESSION_ID="<id>"}` |
| agy | landed | landed: exit `/exit` + Enter; trust dialog; Enter gap 300 ms |
| pi | landed | landed: exit Ctrl-D on empty input; no trust dialog observed; brief delivered through the prompt door (one `agent prompt` send, text plus submit; a 4 KB brief typed raw takes 7 to 25 s and its final Enter is sometimes lost); a draft that stays in the composer gets Enter again every 2.5 s, six times at most |
| omp | landed | landed: exit Ctrl-D on empty input; no trust dialog observed; attachment chip that Enter submits; brief delivered through the prompt door, as for pi (a stop that landed while the brief was still being typed sent the rest of it into the pane's shell) |

An unknown CLI name (matching is case-insensitive) in `envelope.agentProtocol.cli` gets the **generic** adapter in direct mode: exit and outbox only, no output patterns, no block detection. In terminal mode an envelope naming a CLI without a terminal adapter is refused before launch (`agent-protocol-unsupported`). Today the five direct adapters are one behavior (`Direct`; a known CLI name only turns block detection on); each has its own fixture file under `packages/agent-protocol/contracts/fixtures/direct/<cli>/vectors.json` with the same six cases (completed with outbox, exited without outbox, blocked login, blocked usage limit, a login wording far up is not a block, an outbox beats a quoted wording).

### 5.1 Terminal adapters

Contract: [terminal-outcomes.v1.json](../../../packages/agent-protocol/contracts/terminal-outcomes.v1.json); code `packages/agent-protocol/rust/src/terminal/` (`mod.rs` the state machine, `common.rs` the shared matchers and timings, one profile per CLI: exit command, Enter gap, trust wording, start banners). The order of outcomes is `ready` then one of `blocked`, `delivered`, `delivery-unknown`, then `completed` or `needs-human`; `completed` only after `delivered`, which the supervisor enforces.

| Step | Rule |
|---|---|
| Ready | Wait for the CLI's own rule to say idle (claude, codex), or, where no rule exists (agy, pi, omp), for the screen to be drawn and to hold still; a process that never draws is typed at after a bounded wait (15 s). After the settle wait the detector is asked once more, so a dialog that opened over a prompt that already looked ready still blocks. A trust dialog or login screen gives `blocked`; an unrecognised blocking dialog gives `needs-human`; a readiness timeout gives `delivery-unknown` with nothing typed. **Start banner**: a profile can list start banners (marker wording in lowercase plus the dismiss key); while one is on the bottom 20 screen lines the adapter presses its key (a key press, never text) before any verdict is believed, whatever the detector says (idle, working or no verdict). The step comes after the blocked classification: a trust dialog or login screen on the same screen is never answered with a key. At most 2 presses per wait, one per changed screen (a stale frame after a press earns none); a banner that stays gives `delivery-unknown` with nothing typed once the wait runs out, and a banner that opens during the settle wait keeps the wait going. Only agy has an entry (`meet gemini`, key `esc`; the ready screen's own `esc to dismiss` footer is not the marker); its wording comes from the backlog description, so a real capture with other wording replaces the data with no code change |
| Brief | Typed as text, then the CLI's Enter gap, then Enter as a key (codex, pi, omp: one prompt-door send that submits itself, so a stop cannot split the brief between a typing call and an Enter). A draft left in the composer (paste chip, history above the composer, or a composer that grew to show a window of a long paste: two or more of the brief's own lines in the last six) is recognised by the matchers ported from the old controller (`PASTE_CHIP_RE`, the working-tail wording, `isDraftStillInComposer`). The detector's prompt text is not trusted alone: codex reports its window title there, so the screen is always looked at |
| Delivered | Section 4. Typing is repeated only when the typing call itself failed **and**, after one render interval, the pane equals its screen from before the send, is idle and shows no draft; at most 2 resends. A typing call that succeeded is never repeated |
| Completed | A result counts only when `outbox/result-<N>.json` parses as a JSON object and keeps its bytes and modified time over 20 ms (the wait goes through `pause`; a wait the run cut short is not stable); temporary names (`*.tmp.*`) are ignored. The file is read at most 16 MiB (`MAX_RESULT_BYTES`), through a no-follow open that accepts regular files only: on Unix `fgos-durable-file` (`open_beneath`), on other targets the opened file's type and size are checked. A link, a FIFO or an oversized file is as good as absent, and a read never blocks on a FIFO. A result number with a leading zero (`result-007.json`) or a sign is not a name the protocol issues and is ignored; `result-0.json` is accepted. Measured: claude renames a full file into place, codex, agy and omp write in place, pi shows the name empty first |
| Exit | The CLI's exit command (the envelope's `terminal.exitCommand` overrides it) |

Real screens were recorded from herdr panes (`contracts/fixtures/terminal/<cli>/*.txt`, the detector verdict beside each as `*.insp.json`) and replayed on a virtual clock, 17 to 19 vectors per CLI. The Node tests of the old controller's wait logic became vectors (the mapping is in the P04 report). The working screens of codex, omp, pi and agy (a start-up spinner and a mid-turn screen) were recorded on herdr in the integration round, with the long-paste window and the late folder dialog of codex. Known limits: omp's detector never says `working` (its `⎋ Working…` footer is read from the screen), so an omp that is already working when its brief arrives cannot be told from an idle one; pi and omp have no composer rule, so a short brief echoed in the last six lines of a finished turn reads as a draft (the outcome is then `delivery-unknown` unless a result exists, which is the safe direction).

## 6. Design decision: argv stays in the executor configuration

The adapter does not build argv. The controller resolves the command through `resolveExecutorCommand` from the executor configuration and writes `launch.command`, `launch.args`, `launch.env` and `launch.stdinPolicy` into the immutable envelope; the gate runs exactly that. Reason: moving argv rendering to Rust would move the ProviderAdapter binder (`transport.mjs`) to Rust, which a run that survives a dead controller does not need (owner decision 2026-10-16, plan decision D4). If that rendering ever moves, this spec and the contract change together.

Stdin is not the adapter's decision either: the envelope's `launch.stdinPolicy` (`null` or `brief-file`) is the only statement of it, and the gate (`packages/run-supervisor/rust/src/gate.rs`) opens stdin from it. Why a policy exists at all: codex probes piped stdin ("Reading additional input from stdin...") and blocks for ever on an open pipe nothing writes to, so whoever builds the envelope gives it the null device.

What the adapter does decide for direct mode:

| Decision | Rule |
|---|---|
| Activity for idle | Section 7 |
| Completion | The agent exited (reported by `gate-exit.json`) and `outbox/result-<N>.json` exists; the newest result is the one with the highest number, and a name with a sign, a leading zero or a non-numeric part is ignored |
| Named blocks | Section 4 |

## 7. Activity source for idle

The supervisor tails the stdout and stderr capture files (up to 64 KiB per tick) and asks the adapter to judge each new chunk:

| Chunk | Activity |
|---|---|
| Empty or only whitespace | `Quiet`: the idle timer keeps running |
| Anything else, a JSON line included | `Output` |

`Output` resets the idle timer. The supervisor then stops the agent after `idleMs` of `Quiet` (cause `idle`).  Heartbeat files are for display and never count as activity.

## 8. Boundaries

- No dependency on terminal-control, locks, attempts or envelopes: the supervisor passes in the tail, the exit and the outbox directory. The outbox is the one piece of filesystem layout the adapter knows (`result-<N>.json`).
- No stdin policy: the envelope states it and the gate applies it (section 6).
- One dependency outside the crate: the L0 leaf `fgos-durable-file`, for the outbox's no-follow bounded read. Nothing else below terminal-control, locks or attempts.
- The protocol is the one place that names an outcome. The settle step in Node still re-reads the screen to classify it again; deleting that re-read is the run-supervisor work that wires `Direct::classify` and the `direct:blocked:<reason>` receipt arm, not this component's.
- No retry decision: `blocked(login)` and `blocked(usage-limit)` are facts the controller turns into provider-capacity behavior (fail over to another account, lock a dead login) elsewhere.
- The terminal adapters read screens through the supervisor's `AgentIo` over terminal-control, by key; they never call terminal-control themselves.

## 9. Lịch sử quyết định

- **2026-10-16 — D4: cấu hình executor là nguồn duy nhất của argv.** Adapter `direct` không dựng argv; chỉ quyết stdin, nguồn hoạt động, nhận xong và kết quả có tên. Chuyển binder ProviderAdapter sang Rust thêm khoảng 8 giờ và một phase riêng, không cần cho mục tiêu sống qua controller chết.
- **2026-10-18 — Adapter `direct` đọc đuôi 5 dòng, outbox thắng.** Lời login hay hết quota nằm xa phía trên không phải một lần chặn; kết quả trong outbox được quyết bất kể đuôi nói gì.

- **2026-10-18 — Adapters `terminal` portable từ vòng canh của controller.** Regex và logic chờ cũ (`PASTE_CHIP_RE`, `isDraftStillInComposer`, `MAX_RESENDS`) chuyển nguyên sang Rust; test Node cũ thành vector màn hình thật. Gõ lại chỉ khi lời gõ lỗi và pane không đổi; một lời gõ thành công không bao giờ lặp. Kết quả chỉ tính khi file parse được và kích thước ổn định (đo: pi tạo file rỗng rồi mới điền).

- **2026-10-24 — Một cơ quan định danh kết quả cho cả hai mode.** `blocked(usage-limit)` được đặt tên ở `terminal` như ở `direct`; cách ghi lời (neo đầu dòng trên màn hình, chỉ thêm khi có vector thu thật) là một quy tắc cho mọi đường. Bỏ khỏi protocol những gì không ai đọc hoặc thuộc nơi khác: `read()`/`activity()` của `AgentIo`, `Activity::Event`, `StdinPolicy` (stdin là của envelope và gate), sáu adapter `direct` giống nhau (thành một struct). Outbox đọc có chặn trên (16 MiB), no-follow, chỉ file thường, và mọi lần chờ đi qua `pause`. Nguồn: phiên chốt `plans/reports/council-261024-1947-harden-t3a-arbitration.md` §2 và quyết định chủ 30 trong `plans/261021-1118-harden-low-layers-bottom-up/plan.md`. Bước settle của Node vẫn đọc lại màn hình; nối `classify` của `direct` và xoá đoạn đọc lại đó thuộc tầng run-supervisor.

## 10. Related files

| Relationship | File |
|---|---|
| defines | [agent-protocol.v1.json](../../../packages/agent-protocol/contracts/agent-protocol.v1.json) |
| consumer | [run-supervisor/spec.md](../run-supervisor/spec.md) |
| boundary | [component-boundary.md](../component-boundary.md) |
| plans | [direct mode](../../../plans/261016-1351-run-supervisor-rust-core-direct-mode/plan.md), [terminal mode](../../../plans/261016-1351-terminal-mode-and-launcher-identity/plan.md) |
| design | [design r6, section 8](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |
