# Session Host Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "where does this agent session run, and is it still there"
Design status: Draft (contract written; code lands in later phases of the secretary plan)
Implementation: Not built. Contract: packages/session-host/contracts/host-port.v1.json
Canonical: Yes
Owner: Session Host component
Source: packages/session-host/rust (planned), src/session-host/client.mjs (planned)
Contracts: packages/session-host/contracts/
Canonical for: the placement port (start, alive, front, retire) for worker and head sessions
Use this when: Placing an agent session, adding a host adapter, or changing how a session opening text is delivered
Do not use this for: Run state, deadlines, containment (run supervisor); which pane (Terminal Control); who a session is (Identity)
Related:
- docs/platform/terminal-control/spec.md
- docs/platform/run-supervisor/spec.md
- docs/platform/component-boundary.md
- plans/261117-1856-secretary-session-spine/reports/facts-host-port.md
```

## 1. Purpose

Every agent session, a worker under the run supervisor or a long-lived head such as the secretary, is placed by one port with four operations: `start`, `alive`, `front`, `retire`. Today placement is split over Node dispatch (allocate), the controller (envelope `mode`) and the Rust run supervisor (launch, release). The facts are in the facts report; this spec fixes the contract.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The four operations and their refusals | Which pane a key runs in, tab grouping, layout (Terminal Control) |
| Choosing the adapter (`terminal`, `direct`) for a start | The attempt lock, cwd lease, containment domain, deadlines, receipts (run supervisor; containment never moves) |
| Delivering an opening text visibly in a pane, through the shared delivery step | Per-CLI screen rules and how a brief is detected as taken (`fgos-agent-protocol`) |
| Refusing a head session on a host with no interactive surface | Who the session is, its role, whether it holds the role (Identity) |
| | Which CLI, model or account (bind(), Seat Binding) |

## 3. Port contract

Machine form: [host-port.v1.json](../../../packages/session-host/contracts/host-port.v1.json).

- `start(spec) -> Placement{host, key, display}`; `spec = {host: terminal|direct, key, groupKey?, beside?, cwd, env, command, args, opening?: {text, delivery: typed|argument|file}, display, role?: worker|head}`.
- `alive(placement) -> live | gone | unknown`. `unknown` is never turned into `gone`.
- `front(placement) -> fronted | unsupported`.
- `retire(placement, close|retain) -> retired | unknown`.
- Refusals are `unsupported` or `unknown` with a named code: `head-needs-interactive-host`, `host-unsupported-here`, `opening-delivery-unsupported`, `pane-not-ready`, `placement-unknown`, `key-in-use`.

Rules:
1. **Opening text.** In a pane the text is typed visibly as the full text, never a pointer to a file, through the shared delivery step (`fgos-agent-protocol` `adapter_for`, `await_ready`, `deliver_brief` over `AgentIo`, via the port's own `PaneIo` over Terminal Control `send/read/inspect`). A screenless host passes it by argument or file. A worker's brief is not an opening: it stays in the run supervisor's watched `drive`, so a worker `start` carries no `opening` and its command is the gate.
2. **Head on direct is refused.** `role: head` on `host: direct` answers `unsupported: head-needs-interactive-host` until a screenless host with a message channel exists (non-goal).
3. **Idempotent key.** A key with a live placement answers that placement; it never starts a second.
4. **Containment.** The `direct` adapter starts a prepared, already-contained command; it never builds containment.
5. **Close discipline.** Only a pane the port started is closed, never a tab (Terminal Control rule).

## 4. Adapters

- **terminal**: Terminal Control `allocate` + `launch` (shell-quoted `launch_line`) + when `opening` is given `await_ready` + `deliver_brief`. `front` uses the focus operation Terminal Control gains (herdr has `tab focus`; every create passes `--no-focus` today). Unsupported where the driver declares no pane capability (Windows).
- **direct**: the run supervisor's prepared gate command started without a screen. `front` is `unsupported`; liveness is the supervisor's, passed as a handle.

## 5. Paper check against two hosts

| Operation | Pane host (Terminal Control + herdr) | Screenless host (Claude Agent SDK or a cloud session) |
|---|---|---|
| `start` | allocate + quoted launch; opening typed visibly as full text through the shared delivery step | create the session; opening passed by argument or file; `typed` answers `opening-delivery-unsupported` |
| `alive` | `inspect` of the pane: live, gone, unknown | the host's own session handle: live, gone, unknown |
| `front` | the focus operation (phase 5): `fronted` | `unsupported` |
| `retire` | `release` close or retain, only a pane the port allocated | the host's own stop call; retain is a no-op that keeps the session |
| head session | allowed | `head-needs-interactive-host` until a message channel exists |
| containment | stays with the run supervisor | stays with the run supervisor |

Both columns fit the four operations with no field the other column cannot fill: `groupKey`, `beside` and `display` are terminal-only hints a screenless host ignores. No cut that cannot hold was found.

## 6. Layer

Above Terminal Control (L2), below the run supervisor (L4). The dependency is one way: run supervisor → Session Host → Terminal Control. Rust crate `fgos-session-host` (`packages/session-host/rust`) with a thin Node client (`src/session-host/client.mjs`) behind an internal route; no user verb.

## 7. Shared entities

| Entity | Owner | Used here as |
|---|---|---|
| key | Terminal Control key shape | placement key (attempt id for a worker, `<persona>-<name>` for a head) |
| allocation record | Terminal Control | the only pane record; the port writes none of its own |
| session identity and role | Identity | read for who is alive, never decided here |
| delivery step | `fgos-agent-protocol` | opening text typed into a pane |

## 8. Lịch sử quyết định

- 2026-11-17 — Home decision, settled by evidence not asked: the port is a new foundation component Session Host, a Rust crate, layered between Terminal Control and the run supervisor. The run supervisor, which must place through it, is Rust (`supervise.rs`), so the port must be Rust to be reachable without a second path; `component-boundary.md` §4 forbids the run supervisor knowing a pane and says Terminal Control stands alone and must not know runs, so the port belongs to neither; design principle 4 (foundations in Rust). Evidence: [facts report](../../../plans/261117-1856-secretary-session-spine/reports/facts-host-port.md) sections 1 and 4. Prior art: none existed or was removed (`git log -S'placement' -- src/run-supervisor` is empty).
- 2026-11-17 — Opening delivery reuses the one shared delivery step; nothing moves out of the run supervisor, whose `TermIo` later wraps the port's `PaneIo`.
