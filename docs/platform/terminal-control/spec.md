# Terminal Control Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "which pane does this key run in" on a terminal multiplexer
Design status: Accepted
Implementation status: Built (Rust core, herdr driver, internal route, Node client and dispatch migration, setup and doctor); `/fgOS:terminal` migrated; tmux and herdr-dashboard deferred
Canonical: Yes
Owner: Terminal Control component
Source: packages/terminal-control/rust
Contracts: packages/terminal-control/contracts/
Last reviewed: 2026-10-23
Related:
- docs/platform/run-supervisor/spec.md
- docs/platform/component-boundary.md
- docs/platform/identity/spec.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
- plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md
- plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md
- plans/261016-1306-terminal-control-rust-core-herdr-driver/plan.md
```

## 1. Purpose

Terminal Control answers one question for a caller that wants a terminal pane: where does the work with this key run, and is that pane still alive. It is a foundation component (L2) that stands alone. It does not know runs, deadlines, receipts or work items, so it is usable without a run: the `/fgOS:terminal` slash command, the `herdr-dashboard` plugin and a pane a person opened all go through it.

It is placement and pane lifecycle, not process supervision. The run supervisor owns the agent process; Terminal Control owns the pane the process sits in. Dependency is one way: supervisor → Terminal Control.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The allocation record and its two markers (section 4) | Run lifecycle, deadlines, receipts, retry decisions (run supervisor) |
| The rules that group tabs and place panes (section 5) | Which CLI to start, how to deliver a brief, how to read "done" (agent protocol) |
| The key-addressed upper port (section 3) | Who may use a slot: that is the caller's lock, the slot only has a key |
| The lower driver port and its declared capabilities (section 6) | Account, credential or sandbox home of a worker |
| The layout mechanism and the pluggable placement policy (section 8) | A user-facing verb (section 10) |
| The server incarnation check before a destructive close (section 7) | Any lock; Terminal Control takes none |

There is one implementation: the Rust crate `fgos-terminal-control` (`packages/terminal-control/rust`). Node calls it through the internal route only. The core owns which pane, whether it is alive, the record, the placement policy and the only herdr process that operates on panes; the limits, the defaults, the policy names and the measured 40x8 floor are the core's too, and Node reads the defaults and the policy names from `capabilities` (section 9).

Raw herdr calls that stay outside the port, each with the question that would move it:

- **The worker session-server start** (`ensureWorkerSession` in `src/runner/dispatch/worker-session-boot.mjs`) starts and judges a herdr server for a confined worker session. That is a process lifecycle, not a pane operation, so it stays raw by decision (section 15); whether the run supervisor should own it is an open question.
- **Three read-only probes** still call herdr directly: the doctor's anchor-pane check (`pane get` in `src/setup/terminal-control-checks.mjs`), the `herdr-executor-kinds` check's help scrape (`defaultHerdrRun` in `src/setup/registrations.mjs`) and the `/fgOS:terminal` skill's `pane-owned.sh`. Moving them behind the port is an open question, not a decision.

## 3. Upper port

Every operation is addressed by a **key** (for a run, the attempt id) plus an optional `groupKey` that decides which tab the pane belongs to. The operations are `allocate`, `attach`, `launch`, `send`, `read`, `inspect`, `release`, `label`, `capabilities` and `reconcile-scan`. `capabilities` answers the driver, its declared capabilities, the server incarnation and the core's defaults and placement policy names; `reconcile-scan` only observes (section 11). Every result can be `unsupported` or `unknown` explicitly; the core never guesses. `unknown` is never turned into "the pane is closed".

The operation inputs and results are in [terminal-control.port.v1.json](../../../packages/terminal-control/contracts/terminal-control.port.v1.json). This spec does not copy them.

Rules that carry meaning beyond the field lists:

- `launch` types `cd <cwd> && <command>` into the pane and returns the identity of the process it started (pid, start time, boot id, process group), checked against the argv the caller asked for. Plain launch conducts a ready-shell handshake with probe commands (`printf '%s%s\n' fgos-ok- <nonce>`) before typing the launcher line (an unanswered probe is typed again after a third of `shellReadyTimeoutMs`, at most 3 probes in all): neither probe nor launcher line is typed unless `process_info` shows the shell itself holds the foreground (`is_bare_shell`). The marker `launch-requested` is written only after the handshake succeeds, immediately before typing the launch line. Residual risk: a line-mode `read` in the user's rc inside the shell takes one probe line as its answer, and Enter on a default-yes helper counts as yes; the proof is anti-accident, not anti-hostile-rc. The pane's shell stays as the parent (no `exec`): a pane whose root process is the command closes with it, and a pane kept for a person to read (`retain`) would be gone before they looked. A pane whose shell was replaced by a launcher is still recognised, because the shell pid is not excluded when the argv matches. The supervisor only releases its agent after that identity is durable.
- `allocate` adds `DISABLE_AUTO_UPDATE=true` to the environment of every pane it creates (via `tab create` and `pane split`); a caller value in the request's `env` wins. Attached panes are untouched (the core never creates them). The variable reaches the pane's whole process tree and is inert for anything but oh-my-zsh; a user `zstyle ':omz:update' mode` overrides it, and there the ready-shell handshake carries correctness.
- `send` types only while a program other than the pane's shell holds the pane's foreground (the same foreground fact `inspect` reports, including a launched command that `exec`-replaced the shell), through the prompt door as well. A pane whose shell is in the foreground, or whose foreground cannot be read or identified, gets nothing: the answer is `foreground-not-agent` with the reason. A shell runs typed text as commands, backtick spans included.
- A pane taken with `attach` (a pane the caller already owns, for example the one `/fgOS:terminal` runs in) is never closed by the core. `release` on it only removes the label or the binding. `attach` may name a `groupKey`: the pane joins that group, so the group's next pane opens beside it (`FGOS_HERDR_ANCHOR_PANE` of a dispatching caller).
- A fresh herdr session has no workspace to hold a tab. The herdr driver then creates the session's first workspace for the group's first `allocate`; its root pane is the slot and its tab takes the group's label.
- A slot that was `released` as `retain` refuses a later `close` by key. Nothing in the core closes it afterwards: past `until` the scan reports it with its pane id and a person closes the pane. A caller that keeps a pane for a person and still wants anyone to be able to close it by key (the account probe, the reaper) leaves the slot allocated instead of retaining it; only an explicit retention window uses `retain`.

## 4. Allocation record and markers

The only thing Terminal Control writes is one **allocation record**, published once when the slot is allocated. Its shape and the two markers (`launched`, `released`, plus `launch-requested` written after the shell handshake, before the launch line) are in [allocation-record.v1.json](../../../packages/terminal-control/contracts/allocation-record.v1.json). It lives under the shared state root, per driver and per server incarnation, one file per key.

Everything else is read live: whether the pane still exists, which process runs in it, which panes the tab has. The record carries no holder: who may use a slot is a matter for the layer above.

## 5. Core rules

These are the test contract of the core.

1. Tabs are grouped by `groupKey`. By default `groupKey` is the unit run id, or the workflow run id when one exists. No code invents a tab label from a key and a timestamp.
2. A new pane is split from a **live** pane of the group. A new tab opens with the first worker's own pane; there is no empty root pane.
3. A dead anchor pane, or a tab that vanished, makes the core open a new tab. A group's second and later tabs that are open at the same time carry their ordinal (`label (2)`, `label (3)`), so no two tabs of a group share a name. When the last pane closes the multiplexer removes the tab itself; there is no "close the tab if empty" step.
4. A label is display only. No code reads a label to decide anything. Every allocated pane, the first pane of a tab included, is named with the request's display label after its record is published; a pane that cannot be named stays a usable slot.
5. The core closes only panes it allocated, by key. It never closes a tab.

Hệ quả người dùng thấy được: các bước chạy nối tiếp (reviewer sau producer) mở tab mới cùng nhãn khi tab cũ đã tự biến mất; không có pane giữ chỗ để giữ một tab xuyên suốt.

## 6. Driver and capabilities

A driver declares which capabilities it has; the core answers `unsupported` for an operation whose capability is missing. The capability names, and which driver declares which per operating system, are in [driver-capabilities.v1.json](../../../packages/terminal-control/contracts/driver-capabilities.v1.json). Driver errors (timeout, unreadable output) become `unknown`.

- **herdr** is the first driver. It declares every capability on Linux and macOS.
- **Windows** declares none until herdr ships a Windows build, so every pane operation there is `unsupported`. Direct (headless) mode does not use Terminal Control and is unaffected.
- A herdr binary that cannot be found makes every operation `unsupported` in the same way.
- tmux is deferred; the port has room for it and needs no change to the core.

The Node client's current herdr calls map one to one onto port operations; the table is in the measurement report ([section 5](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md)).
Plain `launch` requires capabilities `pane.run`, `read.screen`, and `process.info`. 

## 7. Server incarnation and the known gap

A destructive `close` carries the incarnation of the herdr server it was meant for: host, boot id, pid namespace, pid, start time and endpoint. The driver derives it from the peer credentials of the server socket, then the start time and boot id of that pid.

**The gap, stated plainly.** herdr has no way to bind a close to a server instance: its API (measured) has no server id or instance field on `pane close`. The core therefore reads the incarnation **before** and **after** the close and compares both with the expected one. A mismatch, or an incarnation that cannot be read, gives `unknown` and the pane is kept for a person to close; the core never closes a second time.

What this does not cover: a server restart, or a live handoff that keeps panes alive while the server pid changes, that happens **between** the two checks. That window is a known gap, not a closed one. The failure direction is safe: a wrong mismatch only keeps a pane open. A restart kills the old panes anyway, and the old record is invalid because its incarnation differs.

## 8. Layout

Pane position is computed from measured state, not from a model of terminal geometry.

1. Before placing, the core asks the driver for the real geometry of the group's tab: the tab area and the rect of every pane.
2. A **placement policy**, a pure deterministic function, decides `split(anchor, direction, ratio)`, `newTab` or `unsupported` from that geometry and the limits. The contract is [placement-policy.v1.json](../../../packages/terminal-control/contracts/placement-policy.v1.json). Policies are chosen by name from a registry, so a better layout can be added without touching the core or a driver.
3. The core applies the decision, then **measures again**. A new pane below the minimum size is closed (it has not launched yet, so this is safe) and a new tab opens in the same group.

The default policy is `measured-split`: for each live pane of the group and each direction it takes the two child sizes from the measured rect at ratio 0.5, picks the candidate whose smaller child is largest relative to the minimum, and falls back to a new tab when none reaches the minimum or the tab holds `maxPanesPerTab`. A driver without `layout.geometry` runs no policy; the core splits the anchor `down` at 0.3 and only applies `maxPanesPerTab`.

Measured on a real herdr (details in the [measurement report](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md)):

- The tab area follows the attached client and changes during the day (352×69, 244×71 and 51×36 were seen).
- **The rect herdr reports can differ from the real pty size.** With two clients attached, `pane layout` reported 40×8 while the pty was 18×51. The re-measure of a new pane therefore prefers the pty size when the driver can read it, and only falls back to the reported rect. Placement measures each tab once per allocate from the reported rects; only the new pane's pty is read.
- `ratio` of a split is the share of the **old** pane.
- When the whole tab is smaller than the minimum, the first pane of a new tab is still accepted; otherwise the core would open new tabs forever.

## 9. Configuration

Configuration lives in one top-level section, `terminal`, registered through `registerConfigDefault` so `fgos setup` adds it when missing and never overwrites a value (project over global over default). Node reads it through `src/terminal-control/config.mjs`: the same function feeds the doctor checks below and the route (a herdr round sends the explicitly set values as the `config` field of the route envelope; the Rust core keeps its own defaults for the rest, and a test keeps the two default sets equal). The core enforces the rules whose inputs it owns: a registered policy name, positive integer limits and the measured floor below. Two rules stay with the round because their inputs live there: `allocationGraceMs` must exceed the agent ready timeout plus 30 s, and `retainFailedPaneMs` is `null` or a positive integer. `retainFailedPaneMs` sets the window for panes the supervisor releases with `retain`; section 15 defines which attempts need retention.

| Key | Default | Source of the number |
|---|---|---|
| `terminal.allocationGraceMs` | `60000` | 30000 ms ready timeout + 30000 ms; must stay larger than the ready timeout. After it a scan only triggers a reconcile through `inspect`; it closes nothing |
| `terminal.retainFailedPaneMs` | `null` | A genuine crash or uncertain attempt is kept until a person closes it, also with a positive value: the number only sets when `reconcile-scan` starts reporting the pane (with its pane id) as retained past its time. A settled dead worker with captured output closes at release-slot (section 15) |
| `terminal.layout.policy` | `measured-split` | Section 8 |
| `terminal.layout.minCols` | `80` | The terminal size all five CLIs are designed for; a 352×69 tab holds eight 88×34 panes |
| `terminal.layout.minRows` | `20` | Same |
| `terminal.layout.maxPanesPerTab` | `8` | The count `measured-split` yields at 352×69 with 80×20 |

**Hard floor.** `minCols` below 40 or `minRows` below 8 is refused by the core itself, before any operation runs (`terminal-config-below-floor`, naming key, value and floor), and `fgos doctor` prints that refusal. The floor is measured: claude, agy, pi and omp are ready and show their composer and paste chip at 40 columns and at 8 rows; codex was only measurable at 120×30 because an update dialog blocked its later starts. Measured data and the size table: [measurement report](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md).

The research's 85×20 and "at most 4" are not used; nobody measured them.

### Setup and doctor

- **Directory.** `<stateRoot>/terminal` (mode 0700), the parent of one record directory per driver, is created with everything under it by the allocation store on first use; setup has no fix for it. The state root is the single resolution of the holder-lock spec. Deleting it closes no pane: nobody closes a pane that has no record.
- **No new environment variable.** `FGOS_HERDR_ANCHOR_PANE` stays as the input of `attach`; `FGOS_HERDR_BIN` stays as the herdr binary the caller resolved. `DISABLE_AUTO_UPDATE=true` is injected directly into created panes as a quiet shell default: this is not an fgOS config key, env var fgOS reads, file or tool dependency, so nothing registers with `fgos setup` or `fgos doctor`.
- **Other releases.** Checked 2026-10-18: the release active in the forgentX, mdview and mcp-skill-hub workspaces (one digest) accepts a `terminal` section in the global and in the project config, so setup writes the key like `lock`. A release that refused unknown keys would have to be given the key in the project config only, until every workspace ran the new release.
- **Doctor checks** (`src/setup/terminal-control-checks.mjs`; two rows, no `--fix`, all read-only):

| Check | What it does | Result |
|---|---|---|
| `terminal-control` | Calls the `capabilities` route and prints driver, declared capabilities and server incarnation; checks `FGOS_HERDR_ANCHOR_PANE` when set; then prints each `terminal.*` value with its source after the merge | herdr missing: warning "terminal mode unsupported ... direct mode unaffected" (on Windows it says herdr has no Windows build); herdr without `layout.geometry`: information (the fixed split applies); empty or unresolvable anchor pane: fail; an unreadable config, a value the core refuses (below the 40x8 floor, a limit that is not a positive integer, an unregistered policy) and the two round rules of section 9 (grace, `retainFailedPaneMs`): fail, by name |
| `terminal-allocations` | Calls `reconcile-scan` with `olderThanMs` = `allocationGraceMs` | Findings: warning listing each key, with its pane id when the record has one; nothing is closed, a retained pane past its time is reported for a person to close |

## 10. Internal route only

Node reaches the core through `fgos internal terminal-control <op> --protocol 1 --json`, one process per operation ([contract](../../../packages/terminal-control/contracts/internal-route.terminal-control.v1.json)). There is **no user verb**: adding `fgos terminal` would reverse the standing decision that herdr is display only and would hand an old release in another project a verb it does not know. The caller serializes the operations of one `groupKey` (one promise queue per coordinating process); Terminal Control takes no lock. A missing or different `--protocol` exits 3 with code `host-version-mismatch`, like the other internal routes; a usage error exits 2.

Two coordinators with the same `groupKey` (only when set by hand) can create two tabs with the same label. This is harmless: a label is not a key, and every slot still has its own key.

## 11. Failure cases

| Case | What stays correct | Who cleans up |
|---|---|---|
| Coordinator dies before `allocate` | Nothing exists | — |
| Coordinator dies after `allocate`, before handing over | The attempt lock was held before `allocate`, so it is released when the coordinator dies | Only the layer above (adopt) may close; it concludes `abandoned-not-started` and calls `release(key)`. Terminal Control's own scan never closes anything just because time passed: after `allocationGraceMs` it only reconciles with `inspect`; a slot not yet `launch-requested` whose pane holds only a bare shell is reported to doctor; `unknown` or already `launch-requested` is kept |
| Supervisor dies / handshake times out before the launch line | No marker, plain allocated slot; the gate never ran, so no agent runs | Adopt concludes `abandoned`, scan reports the bare shell after grace |
| Supervisor dies after `launch` returned | The attempt lock holds, the agent runs to its end or hard ceiling | Adopt after the lock is released, then `release` |
| Slot retained (`retain`) | Kept; no process needs it | A person. Past `until` the scan reports it with its pane id (`retain-expired`) when the foreground is provably the launched process or the shell, and as `unknown` otherwise; it never closes the pane (time is not evidence) |
| Resume meets an old slot | The old attempt still holds its lock, so resume only observes with `inspect(key)`; it never launches into an old slot. A new attempt is a new key and a new slot | — |
| Two coordinators, same group | Two tabs with one label (display only) | — |
| herdr server restarts | Panes and agents die with the pty; the incarnation differs, so the old record is invalid | The supervisor sees the agent die with no result (`carrier-lost`); the scan drops records of the old incarnation |
| Reboot | Everything dies, kernel locks release | Adopt and scan |
| A person closes or moves a pane | `inspect` answers `gone` or a pane in another tab; the core infers nothing from labels | The supervisor treats it as a lost agent |

## 12. Migration status

The dispatch path has moved twice. First every herdr caller reached herdr only through `fgos internal terminal-control` (`createHerdrClient`, `createBatchTab`, `batchTabFor`, `closeIfEmpty` and the `fgos-lead-*` labels are deleted; `FGOS_HERDR_ANCHOR_PANE` is an `attach` into the round's group). Then the run supervisor took over the round: **the slot key of a run is its attempt id** (`att-...`, the same string the attempt directory and the writer id carry), and its group key is the batch key, else the unit run id. The controller calls `allocate(key = attemptId, groupKey)` once, through the client's per-group queue, before it hands the attempt over; the supervisor then calls `launch`, `send`, `read`, `inspect` and `release` in process by that key, and adopt calls `release` for an attempt whose supervisor is gone. Nothing outside the attempt closes a pane: the confinement reaper and its `terminalKey` home-marker field are deleted, a home belongs to an attempt (run-supervisor spec, section 8). The immediate close of an allocated slot and the scan's report of an expired retained pane share one foreground check: unreadable process information, an empty foreground list or an unrelated foreground process keeps the pane, and a launched process counts as the pane's own only while its recorded pid, start time and boot still match. A `release(close)` from the supervisor can race an `allocate` that splits from that pane: the core skips a pane that vanished between its liveness check and its geometry read and opens a new tab under the same label when the group has none left, so the race costs a tab, never a wrong close.

`/fgOS:terminal` and `/fgOS:terminal-close` act through `attach`, `label` and `release` of the caller's own pane.

## 13. Known limits

- The incarnation gap in section 7.
- herdr's reported rect can differ from the real pty size (section 8); the pty size is readable only where the driver can read it (Linux today).
- The tab area depends on the attached client, so the same group can receive tabs of different sizes in one day.
- Two coordinators with the same group may produce two same-label tabs.
- Windows and a missing herdr binary give `unsupported` for every pane operation.
- A live handoff of herdr (`capabilities.live_handoff`) was not measured; it would change the server pid, so a close answers `unknown` and the pane is kept.

## 14. The six questions (platform L5)

1. **What to read first?** `docs/specs/reading-map.md`, then this spec; the contracts under `packages/terminal-control/contracts/`; the measurement report for every number.
2. **What kind of work is this?** Pane placement and lifecycle for a key. Anything about the agent process, a deadline or a receipt belongs to the run supervisor; a user-facing terminal verb is refused (section 10).
3. **What contract does it touch?** The upper port (`terminal-control.port.v1.json`), the lower driver capabilities, the record shape, the internal route, and the `terminal` config section. A new driver changes none of the first four.
4. **How much risk?** A destructive `close` rests on the incarnation check and its known gap (section 7); a wrong layout only costs a tab. Changing a closing rule raises the bar to the Rust core tests plus a run on a real herdr.
5. **What proof means done?** `cargo test -p fgos-terminal-control`, the fixture tests of the placement policy, `node --test test/terminal-control/*.test.mjs test/setup/terminal-control-checks.test.mjs` against a host built from the checkout, and `npm test`. The doctor tests run the real route against a recorded herdr stand-in; a live herdr test uses its own workspace.
6. **What learning gets left behind?** Section 15 below and the measurement report; a settled spec fact goes here, a repo-wide decision into `docs/decisions/`.

## 15. Lịch sử quyết định

- 2026-10-15 — The architecture council keeps the tab grouping and the removal of the empty root pane as rules of the core (council sections 2.3 and 2.4, measured on a real herdr with five CLIs), rejects a user verb `fgos terminal`, a layout engine by screen ratio, a layout lock file inside the repo and reading pane labels for state, and keeps the lock for terminal placement as a kind of the shared lock component if it is ever needed. Source: [council](../../../plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md).
- 2026-10-15 — The owner makes terminal-control a real foundation component (package `packages/terminal-control`, crate `fgos-terminal-control`), usable outside a run, with a key-addressed upper port and a driver port with declared capabilities; supervisor → terminal-control is one way, and the supervisor never knows panes. The layout becomes measured state plus a pluggable policy. Source: [design, section 7](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md).
- 2026-10-16 — The terminal-control plan fixes: the incarnation is checked before and after a close because herdr cannot bind a close to a server instance (D1); the route is internal only and no user verb is added (D2, standing STR40 decision); `maxPanesPerTab` is 8 (D6). Measured numbers and the Lead's chosen defaults: [measurements](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md). Plan: [terminal-control plan](../../../plans/261016-1306-terminal-control-rust-core-herdr-driver/plan.md) (decisions D1-D7, prior art).
- Prior art removed by the dispatch migration: `createBatchTab`, `batchTabFor`, `closeIfEmpty` and the `fgos-lead-<key>-<ts>` labels in `src/runner/dispatch/herdr-round.mjs` and `herdr-agent.mjs`; `FGOS_HERDR_ANCHOR_PANE` becomes `attach` plus `groupKey`. The removal landed with the dispatch migration (2026-10-18).
- 2026-10-18 — Setup and doctor. `terminal` is one config section registered like `lock`; `herdr-available` is replaced by `terminal-control`, which asks the port for capabilities and keeps the anchor-pane diagnosis; a missing herdr is a warning because direct mode needs no terminal. `terminal-config` enforces the D4 rule (grace at least ready timeout plus 30 s) and the measured 40x8 floor; `terminal-allocations` only reports (r6 section 7.7). The settings reach the route and the failed-pane retention through one module (`src/terminal-control/config.mjs`) so a value doctor accepts is the value a round uses. The 40x8 floor and the 80x20, 8-pane defaults come from the measurement report and the P04 fixtures, not from the research. Not done, deferred by name: the herdr-dashboard workspace and a tmux driver (D7).

- 2026-10-20 14:00 Asia/Ho_Chi_Minh — Owner decision, option 1: release-slot closes a dead worker's pane once all preceding settlement steps have receipts and receipt.json contains both valid SHA-256 capture digests plus a recognized gate exit. `exited` with stoppedBy `agent` includes SIGTERM and ordinary non-zero exits; `cancelled` requires `cancel`; `timeout` requires `soft-deadline`, `idle` or `hard-ceiling`; `output-limit` requires `output-limit`. Adopted `exited` requires `orphan` + `orphan-result` + an outbox result. A blocked/question reason or missing outbox does not keep a proven dead, captured worker's pane. Gate/carrier loss, abandoned attempts, unrecognized/inconsistent facts, missing capture, or failed settlement retain diagnostics as genuine crashes or uncertainty. No new receipt fact or mechanism is needed. The foreground must still be the launched process or the shell, and server incarnation checks and attached-pane ownership remain enforced. `retainFailedPaneMs` stays unchanged; this decision applies at the initial release, not retroactively to already retained panes. Evidence and verification: [phase report](../../../plans/reports/phase-lead-261020-1402-close-settled-failed-panes.md).
- 2026-10-20 14:53 Asia/Ho_Chi_Minh — A pending settlement step is not "failed settlement": while any step before release-slot has no receipt (it failed or asked for a retry), release-slot records nothing, so the pass that completes the step (resume or adopt) decides with the full facts. A final `retain` is written only from the facts of a settled attempt. Before this, one transient step failure fixed the pane as retained for good, since a receipted step never runs again; the herdr cancel smoke hit it when `npm run fgos:dev` deleted the staged host a detached supervisor still ran from, so settle-attempt exited 66. The dev door now keeps a staged host while a process runs from it and prunes it afterwards. Evidence: [unit 2 report](../../../plans/reports/phase-lead-261020-1453-close-settled-failed-panes-u2.md).
- 2026-10-23 — The T2 arbitration of Git and terminal-control (report: [arbitration](../../../plans/reports/council-261023-0402-harden-t2-arbitration.md)). Decided and built:
  - Liveness is tri-state. A worker session's herdr socket is removed only when the OS refuses a connect twice on the same socket file; when the server's state cannot be judged the socket stays and the dispatch fails with `worker-session-server-unknown` (CF01).
  - `reconcile-scan` observes only. A retained pane past `retainFailedPaneMs` is reported with its pane id and a person closes it, so a doctor run without `--fix` never mutates; the default `null` already behaved so, and no terminal `--fix` was added (CF02, D-T2-6).
  - A closable foreground is judged by the launched process's recorded pid, start time and boot, never by pid alone, and an empty foreground list is not ownership (CF03). A directory sync that fails after an install makes the outcome `unknown` with the file kept (CF04). herdr commands run through the Process spawn door and inherit no descriptor above 1023 (CF10).
  - The core owns the policy registry, the defaults, the positive-limit rules and the 40x8 floor; the grace-versus-ready-timeout rule and the `retainFailedPaneMs` shape stay with the round (D-T2-7). One `timeoutMs` budget bounds every herdr command of an operation.
  - Dead surface removed: the group hint, the activity-launch branch, `label_tab`, `report_agent`, the pane resize, swap and move capabilities, `role_hint`, the `terminal-dir` setup fix, the Node `launch`, `send` and `label` client arms, and the `herdr-agent.mjs` module. The doctor rows are two, `terminal-control` and `terminal-allocations`.
  - Kept on purpose: placement by count where the driver has no `layout.geometry` (a documented degraded mode with a doctor information row), the server-incarnation reads before and after a close (they guard a server swap), `herdrSpawnAdapter` and the account probe's read of `herdr-diagnosis.json` (left to the dispatch owner), and the worker session-server start (section 2).
