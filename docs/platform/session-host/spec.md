# Session Host Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "where does this agent session run, and is it still there"
Design status: Built (terminal adapter; head rotation executor)
Implementation: packages/session-host/rust (port), src/session-host/ (client, head start, head request), src/session-rotation/ (rotation). Contract: packages/session-host/contracts/host-port.v1.json
Canonical: Yes
Owner: Session Host component
Source: packages/session-host/rust, src/session-host/client.mjs, src/session-rotation/rotate.mjs
Contracts: packages/session-host/contracts/
Provenance: First committed on branch sec/p01 (2026-11-17)
Writer type: Human + agent coauthor
Last reviewed: 2026-11-18
Canonical for: the placement port (open, launch, alive, front, retire) for worker and head sessions, and the head rotation executor
Use this when: Placing an agent session, adding a host adapter, or changing how a head session is rotated
Do not use this for: Run state, deadlines, containment (run supervisor); which pane (Terminal Control); who a session is (Identity)
Related:
- docs/platform/terminal-control/spec.md
- docs/platform/run-supervisor/spec.md
- docs/platform/component-boundary.md
- docs/platform/holder-lock/spec.md
- packages/run-supervisor/contracts/head-request.v1.json
- plans/261117-1856-secretary-session-spine/reports/facts-host-port.md
```

## 1. Purpose

Every agent session, a worker under the run supervisor or a long-lived head such as the secretary, is placed by one port with five operations: `open`, `launch`, `alive`, `front`, `retire`. There is no single `start`: a controller learns the command it launches only after the slot exists (the run supervisor's gate), so placement is two halves. The facts are in the facts report; this spec fixes the contract. Section 8 adds what sits on top of the port for a head session: starting it, and replacing it before its context fills (rotation).

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The five operations and their refusals | Which pane a key runs in, tab grouping, layout (Terminal Control) |
| The terminal adapter over Terminal Control | The attempt lock, cwd lease, containment domain, deadlines, receipts (run supervisor; containment never moves) |
| Head start and head rotation (section 8): the two-step replacement, the lineage files, the rotation lock | Typing an opening or a brief into a pane and detecting that it was taken (`fgos-agent-protocol`, driven by the run supervisor) |
| | Who a session is, its role, whether it holds the role (Identity alone) |
| | Which CLI, model or account (bind(), Seat Binding) |
| | Transporting a head's verbs out of its sandbox and enforcing its grant (run supervisor, head-request contract) |

## 3. Port contract

Machine form: [host-port.v1.json](../../../packages/session-host/contracts/host-port.v1.json).

- `open(request) -> placed(placement, slot?)`: allocates the terminal slot of a key (`groupKey`, `beside`, `groupSize`, `cwd`, `env`, `display`) and starts nothing. A key whose pane is already live answers its placement and allocates nothing.
- `launch(placement, spec) -> launched(identity) | not-started(reason)`: starts a prepared command in that slot through Terminal Control's durable `launched` marker and answers the launched root's process identity. `not-started` keeps the slot and never launches into it again.
- `alive(placement) -> live | gone | unknown`. `unknown` is never turned into `gone`.
- `front(placement) -> fronted | unsupported`.
- `retire(placement, close|retain) -> retired | unknown`.
- Refusals are `unsupported` or `unknown` with a named code: `host-unsupported-here`, `placement-unknown`.

Rules:
1. **Opening text.** Not a port operation. A head's opening is typed visibly as the full text by the run supervisor through the shared delivery step (`fgos-agent-protocol` `adapter_for`, `await_ready`, `deliver_brief`) after it has launched the head's gate; the Session Host never types into a pane.
2. **Idempotent key.** `open` of a key with a live pane answers that placement; it never allocates a second.
3. **Containment.** The port launches a prepared, already-contained command; it never builds containment.
4. **Close discipline.** Only a pane the port opened is closed, never a tab (Terminal Control rule).
5. **Serial per group.** A Node caller that opens many placements serialises per group (`openAsync`, `retireAsync(close)`, one queue per coordinating process): two rounds of one batch never both open the batch's tab, and a close waits behind the earlier opens of its group.

## 4. Adapters

- **terminal**: Terminal Control `allocate` for `open`, `launch` with shell-quoted `launch_line` for `launch`, `inspect` for `alive`, the focus operation for `front` (herdr `tab focus`), `release` for `retire`. Unsupported where the driver declares no pane capability (Windows): answers `unsupported / host-unsupported-here`.
- There is no screenless adapter. A screenless launch (SDK, cloud) is the run supervisor's own, and a head session needs a pane: it answers `host-unsupported-here` on a host without one.

## 5. Paper check against a second host

| Operation | Pane host (Terminal Control + herdr) | Screenless host (Claude Agent SDK or a cloud session) |
|---|---|---|
| `open` | allocate the slot | create the session record; `groupKey`, `beside`, `display` are ignored |
| `launch` | quoted launch into the slot | start the session with the prepared command; identity is the host's handle |
| `alive` | `inspect` of the pane: live, gone, unknown | the host's own session handle |
| `front` | the focus operation: `fronted` | `unsupported` |
| `retire` | `release` close or retain, only a pane the port opened | the host's own stop call; retain keeps the session |
| containment | stays with the run supervisor | stays with the run supervisor |

Both columns fit the five operations with no field the other column cannot fill. No cut that cannot hold was found.

## 6. Layer

Above Terminal Control (L2), below the run supervisor (L4). The dependency is one way: run supervisor → Session Host → Terminal Control. Rust crate `fgos-session-host` (`packages/session-host/rust`) with a thin Node client (`src/session-host/client.mjs`) behind an internal route; no user verb. The head use cases (`src/session-host/head-start.mjs`, `head-request.mjs`, `src/session-rotation/rotate.mjs`) are Node use cases above the client and the run supervisor's session attempt.

## 7. Shared entities

| Entity | Owner | Used here as |
|---|---|---|
| key | Terminal Control key shape | placement key: the attempt id, for a worker and for a head |
| allocation record | Terminal Control | the only pane record; the port writes none of its own |
| session identity and role | Identity | read for who is alive and who holds `head:<persona>-<name>`, never decided here |
| delivery step | `fgos-agent-protocol` | the opening text typed into a pane, by the run supervisor |
| head grant | `src/session-host/head-grants.mjs` (`grantOf`) | the writable paths and verbs of a head role; read at launch, carried in the envelope |
| lineage folder | this spec, section 8 | `.fgos/runtime/session-rotation/<persona>-<name>/` |

## 8. Head sessions and rotation

### 8.1 Starting a head

A head (`head:<persona>-<name>`) is one long-lived interactive agent. `startHeadSession` checks the names, fronts the live holder of the role instead of starting a second, and otherwise calls `placeHead`, the one launch path of a head: bind a seat at the persona's tier, launch it as a confined supervised session attempt (run supervisor, sandbox, account lease, private home) with the opening typed visibly, and answer the placement. `startHeadSession` then records the placement in the lineage folder. A head is confined like a worker; what differs is its grant (`grantOf(role)`): writable project paths and allowed verbs. A head reaches the host only through its request socket (`head-request.v1.json`): `head start`, `head rotate`, `head answered`, `head restore role`.

### 8.2 Rotation: the two-step rule

A head is replaced before its context fills. The replacement is two steps, never one:

1. **Start the successor beside the old session.** The executor (`rotateHeadSession`) writes the handoff, then calls `placeHead` for the next generation with `beside` set to the old placement key, so the successor opens in the same tab while the old session still holds the role. The successor registers in Identity without the role (the role is held) and reads the handoff in its opening.
2. **Move the role only after the successor answered.** The successor's own hook reports its first turn through its request socket (`head answered`): the entry records the answer (`answered.json`: generation, key, Identity session id, last assistant message) only when this lineage's pending rotation waits for that very key and the successor echoes the rotation id exactly (the handoff carries a `Rotation id:` line and `rotation.json` the same id; no fuzzy match, and this entry is the one place the answer is checked); then the successor's own supervisor moves the role to the successor with Identity's `take`. The executor accepts the answer only when Identity lists the successor as the holder, then (the successor now being the role holder, nothing after this point ever ends it; each step that fails writes a `step-failed` incident naming the step and the next step still runs) records the successor's placement and ends the old session by asking its own supervisor to stop it (`cancel-requested.json` in its run directory): the supervisor stops the agent and its release step closes the pane, as at any session attempt's end. The port's `retire(close)` is not used for a live head, because Terminal Control keeps a pane whose foreground is not provably the launched process.

Failure before the successor holds the role (start refused, no valid answer within `sessionRotation.answerWaitMs`): `rotation.json` is removed first (a late `head answered` is then refused), then Identity is asked once. If it already names the successor as holder, the rotation is finished and the incident `rotation-completed` says it was finished after the deadline; if Identity cannot answer nothing is ended and the incident says so; only otherwise the successor is ended the same way. After the ended successor's attempt has closed, Identity is asked who holds the role (invariant: after any outcome exactly one live head holds it): if nobody live does, a take that landed late hit the dead successor, and the old head registers the role again through its own supervisor (verb `head restore role`, registered without `take`, so Identity refuses when any live session holds it) with the incident `role-restored`; if that fails too the incident is `no-live-head` and the executor stops. In that last case the old session stays alive and keeps its placement record, one incident line goes to `incidents.jsonl`, and the reason is returned. Nothing is ever killed with SIGKILL: ending a session is its supervisor's normal stop. The next `head start` fronts whichever session Identity says holds the role.

Authority: Identity alone says who holds the role. The executor owns the replacement and the lineage files. The run supervisor transports and enforces the verbs and moves the role on the one `head answered` verb. `placeHead` starts heads; there is no second launch path.

### 8.3 Requesting a rotation

`requestRotation` is the one entry that asks for a rotation: the request socket's `head rotate`, `fgos head rotate` and an unconfined hook all call it. It checks `{ persona, name, reason: soft|hard|manual, stopFacts }`, writes `request-<id>.json` under the lineage folder, starts the executor as a detached process through the one detach door and returns at once. `soft` and `hard` rotate when the measured fraction of the context window reaches `sessionRotation.soft` or `.hard` (`decide.mjs`; `hard` carries the pending question verbatim into the handoff); `manual` is the owner's `/handoff` and carries it too. One rotation at a time per lineage: the executor holds the `session-rotation` lock (holder-lock registry, `<fgosDir>/locks/session-rotation--<persona>-<name>.lock`), a second request finds it held and is a no-op, and `head start` refuses `rotation-in-progress` while it is held.

### 8.4 Files

Under `.fgos/runtime/session-rotation/<persona>-<name>/`:

| File | Writer | Content |
|---|---|---|
| `<yymmdd-hhmm>-<sid8>.md`, `latest.json` | handoff store | immutable redacted handoffs, newest `keep` kept; `latest.json` replaced atomically after the file exists |
| `placement.json` | `startHeadSession`, the executor | `{ role, gen, placement, runDir, persona, startedAt }` of the live head (`runDir`: its session attempt's directory) |
| `rotation.json` | executor | the pending rotation: id, successor key and generation, reason, handoff, old key and session, pending question; removed when the rotation ends either way |
| `answered.json` | `markSuccessorAnswered` | the successor's first answer |
| `incidents.jsonl`, `rotation.log` | executor | one JSON line per failed rotation; the detached process's output |
| `request-<id>.json` | `requestRotation` | one request until its executor reads and removes it |

### 8.5 Open items

- **Executor crash after `placeHead`.** If the detached executor dies after it started the successor, `rotation.json` stays, the lock frees itself, and nothing ends or completes the rotation: the successor waits unanswered and the old session keeps the role. No recovery is built; it is tracked as backlog `p-bakpfrvigb`.

### 8.6 Configuration and the `/clear` fallback

`sessionRotation` in `core/config-standard`: `soft` (0.4), `hard` (0.7), `keep` (10), `windowSize` (1000000), `answerWaitMs` (120000), `personas.<name>.{soft,hard,reload}`. The context fraction comes from the status line sidecar newer than the Stop hook, else the transcript sum marked one turn stale (spike report).

`/clear` through Terminal Control `send` works (the spike measured 3 of 3, with a SessionStart hook re-injecting a short context) but cannot meet the two-step rule: the old context is gone before the successor answers. It is recorded only as a fallback for a host that cannot open a second session and is never used on the terminal host.

## 9. Lịch sử quyết định

- 2026-11-17 — Home decision, settled by evidence not asked: the port is a new foundation component Session Host, a Rust crate, layered between Terminal Control and the run supervisor. The run supervisor, which must place through it, is Rust (`supervise.rs`), so the port must be Rust to be reachable without a second path; `component-boundary.md` §4 forbids the run supervisor knowing a pane and says Terminal Control stands alone and must not know runs, so the port belongs to neither; design principle 4 (foundations in Rust). Evidence: [facts report](../../../plans/261117-1856-secretary-session-spine/reports/facts-host-port.md) sections 1 and 4. Prior art: none existed or was removed (`git log -S'placement' -- src/run-supervisor` is empty).
- 2026-11-17 — Opening delivery reuses the one shared delivery step; nothing moves out of the run supervisor, whose `TermIo` wraps the port's `PaneIo`.
- 2026-11-18 — Worker attempts are placed through the port (`open` + `launch` replace `start`; the envelope carries `host`). The direct adapter and the port's own `start` and opening delivery were deleted: a head is started by its run supervisor as a session attempt (confined like a worker), so the port never types into a pane and a screenless launch stays the supervisor's. Evidence: phase 11 and 12 reports of the secretary plan.
- 2026-11-18 — Head rotation is two steps (start the successor beside the old session, move the role only after the successor answered, then end the old one). Because a confined successor can write neither `.fgos` nor Identity, its first answer travels as the verb `head answered` through the request socket and its own supervisor moves the role with Identity's `take`; the executor never moves a role. The lineage lock is a holder-lock registry row (`session-rotation`). No earlier rotation mechanism existed (`git log -S` on rotation symbols found none).
