# Terminal Control Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "which pane does this key run in" on a terminal multiplexer
Design status: Accepted
Implementation status: In progress (Rust core and herdr driver landing; Node migration not done)
Canonical: Yes
Owner: Terminal Control component
Source: packages/terminal-control/rust
Contracts: packages/terminal-control/contracts/
Last reviewed: 2026-10-16
Related:
- docs/platform/component-boundary.md
- docs/platform/session-identity/spec.md
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

There is one implementation: the Rust crate `fgos-terminal-control` (`packages/terminal-control/rust`). Node calls it through the internal route only.

## 3. Upper port

Every operation is addressed by a **key** (for a run, the attempt id) plus an optional `groupKey` that decides which tab the pane belongs to. The operations are `allocate`, `attach`, `launch`, `send`, `read`, `inspect`, `release` and `label`. Every result can be `unsupported` or `unknown` explicitly; the core never guesses. `unknown` is never turned into "the pane is closed".

The operation inputs and results are in [terminal-control.port.v1.json](../../../packages/terminal-control/contracts/terminal-control.port.v1.json). This spec does not copy them.

Two rules carry meaning beyond the field lists:

- `launch` returns the identity of the process it started (pid, start time, boot id, process group), checked against the argv the caller asked for. The supervisor only releases its agent after that identity is durable.
- A pane taken with `attach` (a pane the caller already owns, for example the one `/fgOS:terminal` runs in) is never closed by the core. `release` on it only removes the label or the binding. `attach` may name a `groupKey`: the pane joins that group, so the group's next pane opens beside it (`FGOS_HERDR_ANCHOR_PANE` of a dispatching caller).
- A fresh herdr session has no workspace to hold a tab. The herdr driver then creates the session's first workspace for the group's first `allocate`; its root pane is the slot and its tab takes the group's label.
- A slot that was `released` as `retain` refuses a later `close` by key (it closes when `until` passes). A caller that keeps a pane for a person and still wants anyone to be able to close it by key (the account probe, the reaper) leaves the slot allocated instead of retaining it; only an explicit retention window uses `retain`.

## 4. Allocation record and markers

The only thing Terminal Control writes is one **allocation record**, published once when the slot is allocated. Its shape and the two markers (`launched`, `released`, plus `launch-requested` written before the driver is asked to run anything) are in [allocation-record.v1.json](../../../packages/terminal-control/contracts/allocation-record.v1.json). It lives under the shared state root, per driver and per server incarnation, one file per key.

Everything else is read live: whether the pane still exists, which process runs in it, which panes the tab has. A hint file that maps a group to a tab exists only to find it quickly; it is always checked against the live state before use and dropped when wrong. The record carries no holder: who may use a slot is a matter for the layer above.

## 5. Core rules

These are the test contract of the core.

1. Tabs are grouped by `groupKey`. By default `groupKey` is the unit run id, or the workflow run id when one exists. No code invents a tab label from a key and a timestamp.
2. A new pane is split from a **live** pane of the group. A new tab opens with the first worker's own pane; there is no empty root pane.
3. A dead anchor pane, or a tab that vanished, makes the core open a new tab with the same label. When the last pane closes the multiplexer removes the tab itself; there is no "close the tab if empty" step.
4. A label is display only. No code reads a label to decide anything.
5. The core closes only panes it allocated, by key. It never closes a tab.

Hệ quả người dùng thấy được: các bước chạy nối tiếp (reviewer sau producer) mở tab mới cùng nhãn khi tab cũ đã tự biến mất; không có pane giữ chỗ để giữ một tab xuyên suốt.

## 6. Driver and capabilities

A driver declares which capabilities it has; the core answers `unsupported` for an operation whose capability is missing. The capability names, and which driver declares which per operating system, are in [driver-capabilities.v1.json](../../../packages/terminal-control/contracts/driver-capabilities.v1.json). Driver errors (timeout, unreadable output) become `unknown`.

- **herdr** is the first driver. It declares every capability on Linux and macOS.
- **Windows** declares none until herdr ships a Windows build, so every pane operation there is `unsupported`. Direct (headless) mode does not use Terminal Control and is unaffected.
- A herdr binary that cannot be found makes every operation `unsupported` in the same way.
- tmux is deferred; the port has room for it and needs no change to the core.

The Node client's current herdr calls map one to one onto port operations; the table is in the measurement report ([section 5](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md)).

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
- **The rect herdr reports can differ from the real pty size.** With two clients attached, `pane layout` reported 40×8 while the pty was 18×51. The re-measure therefore prefers the pty size when the driver can read it, and only falls back to the reported rect.
- `ratio` of a split is the share of the **old** pane.
- When the whole tab is smaller than the minimum, the first pane of a new tab is still accepted; otherwise the core would open new tabs forever.

## 9. Configuration

Configuration keys are listed here for readers; registration into `fgos setup` and the doctor checks that print each value with its source are separate work and are not described as done by this spec.

| Key | Default | Source of the number |
|---|---|---|
| `terminal.allocationGraceMs` | `60000` | 30000 ms ready timeout + 30000 ms; must stay larger than the ready timeout. After it a scan only triggers a reconcile through `inspect`; it closes nothing |
| `terminal.retainFailedPaneMs` | `null` | Today's behaviour: a failed attempt's pane is kept until a person closes it; the scan only reports to doctor |
| `terminal.layout.policy` | `measured-split` | Section 8 |
| `terminal.layout.minCols` | `80` | The terminal size all five CLIs are designed for; a 352×69 tab holds eight 88×34 panes |
| `terminal.layout.minRows` | `20` | Same |
| `terminal.layout.maxPanesPerTab` | `8` | The count `measured-split` yields at 352×69 with 80×20 |

**Hard floor.** `minCols` below 40 or `minRows` below 8 is refused by doctor. The floor is measured: claude, agy, pi and omp are ready and show their composer and paste chip at 40 columns and at 8 rows; codex was only measurable at 120×30 because an update dialog blocked its later starts. Measured data and the size table: [measurement report](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md).

The research's 85×20 and "at most 4" are not used; nobody measured them.

## 10. Internal route only

Node reaches the core through `fgos internal terminal-control <op> --protocol 1 --json`, one process per operation ([contract](../../../packages/terminal-control/contracts/internal-route.terminal-control.v1.json)). There is **no user verb**: adding `fgos terminal` would reverse the standing decision that herdr is display only and would hand an old release in another project a verb it does not know. The caller serializes the operations of one `groupKey` (one promise queue per coordinating process); Terminal Control takes no lock.

Two coordinators with the same `groupKey` (only when set by hand) can create two tabs with the same label. This is harmless: a label is not a key, and every slot still has its own key.

## 11. Failure cases

| Case | What stays correct | Who cleans up |
|---|---|---|
| Coordinator dies before `allocate` | Nothing exists | — |
| Coordinator dies after `allocate`, before handing over | The attempt lock was held before `allocate`, so it is released when the coordinator dies | Only the layer above (adopt) may close; it concludes `abandoned-not-started` and calls `release(key)`. Terminal Control's own scan never closes anything just because time passed: after `allocationGraceMs` it only reconciles with `inspect`; a slot not yet `launch-requested` whose pane holds only a bare shell is reported to doctor; `unknown` or already `launch-requested` is kept |
| Supervisor dies with the slot allocated, not launched | The gate never ran or never connected, so no agent runs | Adopt concludes `abandoned`, then `release(key, close)` |
| Supervisor dies after `launch` returned | The attempt lock holds, the agent runs to its end or hard ceiling | Adopt after the lock is released, then `release` |
| Slot retained (`retain`) | Kept until `until`; no process needs it | Closed only when past `until` **and** same incarnation **and** the foreground process is not a stranger; otherwise kept (time is not evidence) |
| Resume meets an old slot | The old attempt still holds its lock, so resume only observes with `inspect(key)`; it never launches into an old slot. A new attempt is a new key and a new slot | — |
| Two coordinators, same group | Two tabs with one label (display only) | — |
| herdr server restarts | Panes and agents die with the pty; the incarnation differs, so the old record is invalid | The supervisor sees the agent die with no result (`carrier-lost`); the scan drops records of the old incarnation |
| Reboot | Everything dies, kernel locks release | Adopt and scan |
| A person closes or moves a pane | `inspect` answers `gone` or a pane in another tab; the core infers nothing from labels | The supervisor treats it as a lost agent |

## 12. Migration status

The dispatch path has moved: `src/runner/dispatch/herdr-round.mjs`, `herdr-reconcile.mjs`, `worker-session-boot.mjs`, the account probe and the confinement reaper reach herdr only through `fgos internal terminal-control`. `createHerdrClient`, `createBatchTab`, `batchTabFor`, `closeIfEmpty` and the `fgos-lead-*` labels are deleted; `FGOS_HERDR_ANCHOR_PANE` is an `attach` into the round's group. A round's slot key is its agent name (the normalized `fgos-<runId>-<launchCommandId>` for an assignment run); its group key is the batch key, else the unit run id. The reaper reads `terminalKey` from the home marker; a marker without one names no slot and its pane is never closed on a guess.

Still to move: `/fgOS:terminal` (`rename.sh`) becomes `attach` plus `label`. Starting a herdr server process for a confined worker session (`herdr --session <name> server`) stays in `worker-session-boot.mjs`: it is a server lifecycle, not a pane operation, and every question asked of a running server goes through the port.

## 13. Known limits

- The incarnation gap in section 7.
- herdr's reported rect can differ from the real pty size (section 8); the pty size is readable only where the driver can read it (Linux today).
- The tab area depends on the attached client, so the same group can receive tabs of different sizes in one day.
- Two coordinators with the same group may produce two same-label tabs.
- Windows and a missing herdr binary give `unsupported` for every pane operation.
- A live handoff of herdr (`capabilities.live_handoff`) was not measured; it would change the server pid, so a close answers `unknown` and the pane is kept.

## 14. Lịch sử quyết định

- 2026-10-15 — The architecture council keeps the tab grouping and the removal of the empty root pane as rules of the core (council sections 2.3 and 2.4, measured on a real herdr with five CLIs), rejects a user verb `fgos terminal`, a layout engine by screen ratio, a layout lock file inside the repo and reading pane labels for state, and keeps the lock for terminal placement as a kind of the shared lock component if it is ever needed. Source: [council](../../../plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md).
- 2026-10-15 — The owner makes terminal-control a real foundation component (package `packages/terminal-control`, crate `fgos-terminal-control`), usable outside a run, with a key-addressed upper port and a driver port with declared capabilities; supervisor → terminal-control is one way, and the supervisor never knows panes. The layout becomes measured state plus a pluggable policy. Source: [design, section 7](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md).
- 2026-10-16 — The terminal-control plan fixes: the incarnation is checked before and after a close because herdr cannot bind a close to a server instance (D1); the route is internal only and no user verb is added (D2, standing STR40 decision); `maxPanesPerTab` is 8 (D6). Measured numbers and the Lead's chosen defaults: [measurements](../../../plans/reports/implementation-261016-1352-terminal-control-herdr-measurements.md). Plan: [terminal-control plan](../../../plans/261016-1306-terminal-control-rust-core-herdr-driver/plan.md) (decisions D1-D7, prior art).
- Prior art removed by the dispatch migration: `createBatchTab`, `batchTabFor`, `closeIfEmpty` and the `fgos-lead-<key>-<ts>` labels in `src/runner/dispatch/herdr-round.mjs` and `herdr-agent.mjs`; `FGOS_HERDR_ANCHOR_PANE` becomes `attach` plus `groupKey`. The removal landed with the dispatch migration (2026-10-18).
