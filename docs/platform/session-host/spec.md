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
| head grant | `src/session-host/head-grants.mjs` (`grantOf`) | the writable paths, the mailbox flag and the verbs of a head role; read at launch, carried in the envelope |
| lineage folder | this spec, section 8 | `.fgos/runtime/session-rotation/<persona>-<name>/` |

## 8. Head sessions and rotation

### 8.1 Starting a head

A head (`head:<persona>-<name>`) is one long-lived interactive agent. `startHeadSession` checks the names, fronts the live holder of the role instead of starting a second (by the slot key in the holder's Identity record, `ids.terminal.key`; a record that names no slot is refused `placement-unknown`), and otherwise calls `placeHead`, the one launch path of a head: bind a seat at the persona's tier, launch it as a confined supervised session attempt (run supervisor, sandbox, account lease, private home) with the opening typed visibly, and answer the placement. `startHeadSession` then records the placement in the lineage folder. A head is confined like a worker; what differs is its grant (`grantOf(role)`): writable project paths (a granted directory is bound writable; a granted file, the secretary's `docs/backlog.md`, stays read-only in the sandbox, as does its whole directory, and only `session write` replaces it: Agent Confinement spec, grant `workspace-paths`), `mailbox` (the project's mailbox lock and record writable, grant `mailbox-record`; the secretary's) and allowed verbs. A head reaches the host only through its request socket (`head-request.v1.json`): `session bind session`, `session start`, `session write`, `session rotate`, `session answered`, `session restore role`, and the owner-question verbs `questions ask`, `questions ack`, `questions cancel` (every head, one shared list `QUESTION_VERBS` in `head-grants.mjs`) and `questions answer` (the secretary only). The `questions *` verbs are served by the host route `fgos internal head-questions --run-dir <attemptDir>` (`apps/fgos/src/wiring/head_questions.rs`, an internal route dispatched in `main.rs` beside `seat-binding`, not in help): `runHeadRequest` only passes the request on, and Rust reads the envelope itself and fills the asker from it (the role from `envelope.session.role`, the session, handle, roles and machine from Identity as the holder of that role, the project from `envelope.cwd`), so no argument can name the asker; it refuses `questions answer` for any head but the secretary and records it with source `secretary`. Inside a head, `fgos questions ask|answer|ack|cancel` send these verbs through the socket when `FGOS_HEAD_REQUEST_SOCKET` is set, retrying a `busy` reply 3 times, 1 s apart; reads go straight to the store. `session write` (`fgos session write <path>`, content on stdin; the secretary's grant) is answered by the head's supervisor itself: the path must be named exactly by the grant's `writes`, a regular file with no symbolic link on the way, and is replaced atomically through the durable-file door, then published by the existing paths land (`fgos_supervision::land`, through the one port `WritePublisher` that `apps/fgos` fills in `wiring/session_write_publish.rs` and passes to `fgos_run_supervisor::route::main` as a parameter; the supervisor crate commits, fetches and pushes nothing). The order: first the land's own catch-up step alone (`land::catch_up`): under the target's merge slot the main checkout is fast-forwarded to the remote tip, and a branch with commits its remote lacks is refused `write-branch-ahead`, any other catch-up refusal `write-catch-up-refused` (detail `<land code>: <detail>`, e.g. `main-checkout-catch-up-refused`); then the path must have no uncommitted change (`write-path-dirty`; `write-path-unreadable` when that cannot be read); every refusal so far leaves nothing written. Then the write, and the paths land: only that path is committed (subject `docs(<role>): write <path>`, writer the head's writer id) and the checked-out branch is pushed without force; the reply is `{path, bytes, commit}` and `fgos session write` prints `committed <sha>`. The project's `land.gates` run only for paths their `when` matches, so a configured gate list whose globs match none of the path runs nothing (this repository's gates match only code paths, so a docs, backlog or plans write runs none); gates that do run run inside the request, under the client's 180 s bound, and the head's busy flag is held meanwhile, so the head's other requests are refused `busy` until it ends. A land refusal is a reply, not an error: `{path, bytes, publish: {refusal, detail}}`, nothing is forced, and `fgos session write` ends non-zero with `written, not published: <refusal> <detail>`. Its true outcome differs by refusal: `land-paths-push-rejected` (the remote moved outside fgos) and `land-commit-contract-violation` (a hook changed the commit) leave the path committed locally and the branch ahead of its remote, so the next write is refused `write-branch-ahead` until a person pushes or resets that commit; every other land refusal (`land-gate-failed`, `land-gate-missing` when the project configures no `land.gates`, and the others) leaves the file written and uncommitted. **One Identity record per head (phase 7e).** The envelope's `session` names the head (`persona`, `name`, `gen`, from `FGOS_HEAD_PERSONA`, `FGOS_HEAD_NAME`, `FGOS_HEAD_GEN` of the launch), and the supervisor registers the attempt in Identity with the `head` group (persona, name, generation) and the `terminal` group (slot key, tab and pane ids, read from the terminal store's allocation record of the slot), so a head cannot report another generation and its pane names it; a bind moves both groups to the agent's session. Its mailbox hook sends `session bind session` (args `{source, value, mailbox?}`: the CLI's own session variable and id, a Codex hook taking the id from its payload, and the mailbox name its hooks bound, `{fgosDir, name}`) the first time it binds the head, and again when that mailbox name changed; the supervisor records the bound session's `cliSession` (for Claude Code the name, messaging socket, pid and start time of `<config dir>/sessions/<agent pid>.json`, read outside the sandbox) and the `mailbox` group; until Identity shows the session bound, every later hook call asks again, except within 5 minutes of this head's own failed bind recorded in the hook outcome (an entry another head wrote, or none, means ask now); the head's supervisor answers the verb itself with the connecting pid (`caller-not-under-head` when that pid does not run under the gate) and has Identity register the agent's own session (cli `claude`, say) on the attempt's gate and move the role to it, so `fgos identity session` inside the head and `--to head:<persona>-<name>` both name that session, not the attempt's `worker` id. A second bind on the same live gate (the CLI started a new session, e.g. after `/clear`) moves the roles to the new session and retires the one bound before. A head messages a peer with `fgos mailbox send`; its sandbox does not reach peer session sockets.

A head runs in the permission mode its persona's invocation declares. The secretary head runs in the leads' mode (bypass), so a peer's message to it is delivered instead of held for approval; it is pinned by `runner.personas.secretary.prefer` in the release standard and runs only inside its required sandbox (Agent Confinement spec 13.4). Every other persona keeps the pane that asks. Only a head's launch may bind a bypass invocation (a capability, role or worker-seat pin of it is refused at bind as `bypass-invocation-not-allowed`), and a project's own `runner.personas.secretary.prefer` replaces the standard's list whole, so an override must keep the bypass invocation entry or the secretary head asks again. Under bypass the paths the grant opens are written without asking.

### 8.2 Rotation: the two-step rule

A head is replaced before its context fills. The replacement is two steps, never one:

1. **Start the successor beside the old session.** The executor (`rotateHeadSession`) writes the handoff, then calls `placeHead` for the next generation with `beside` set to the slot key the role holder's Identity record names (`ids.terminal.key`; none when the record names no slot), so the successor opens in the same tab while the old session still holds the role. The successor registers in Identity without the role (the role is held) and reads the handoff in its opening.
2. **Move the role only after the successor answered.** The successor's own hook reports its first turn through its request socket (`session answered`): the entry records the answer (`answered.json`: generation, key, Identity session id, last assistant message) only when this lineage's pending rotation waits for that very key and the successor echoes the rotation id exactly (the handoff carries a `Rotation id:` line and `rotation.json` the same id; no fuzzy match, and this entry is the one place the answer is checked); then the successor's own supervisor moves the role to the successor with Identity's `take`. The executor accepts the answer only when Identity lists the successor as the holder, then (the successor now being the role holder, nothing after this point ever ends it; each step that fails writes a `step-failed` incident naming the step and the next step still runs) records the successor's placement and ends the old session by asking its own supervisor to stop it (`cancel-requested.json` in its run directory): the supervisor stops the agent and its release step closes the pane, as at any session attempt's end. The port's `retire(close)` is not used for a live head, because Terminal Control keeps a pane whose foreground is not provably the launched process.

Failure before the successor holds the role (start refused, no valid answer within `sessionRotation.answerWaitMs`): `rotation.json` is removed first (a late `session answered` is then refused), then Identity is asked once. If it already names the successor as holder, the rotation is finished and the incident `rotation-completed` says it was finished after the deadline; if Identity cannot answer nothing is ended and the incident says so; only otherwise the successor is ended the same way. After the ended successor's attempt has closed, Identity is asked who holds the role (invariant: after any outcome exactly one live head holds it): if nobody live does, a take that landed late hit the dead successor, and the old head registers the role again through its own supervisor (verb `session restore role`, registered without `take`, so Identity refuses when any live session holds it) with the incident `role-restored`; if that fails too the incident is `no-live-head` and the executor stops. In that last case the old session stays alive and keeps its placement record, one incident line goes to `incidents.jsonl`, and the reason is returned. Nothing is ever killed with SIGKILL: ending a session is its supervisor's normal stop. The next `session start` fronts whichever session Identity says holds the role.

Authority: Identity alone says who holds the role. The executor owns the replacement and the lineage files. The run supervisor transports and enforces the verbs and moves the role on the one `session answered` verb. `placeHead` starts heads; there is no second launch path.

### 8.3 Requesting a rotation

`requestRotation` is the one entry that asks for a rotation: the request socket's `session rotate` and the unconfined branch of `rotateHead` (which `fgos session rotate` and a hook call) end in it. It checks `{ persona, name, reason: soft|hard|manual, stopFacts }`, writes `request-<id>.json` under the lineage folder, starts the executor as a detached process through the one detach door and returns at once. `soft` and `hard` rotate when the measured fraction of the context window reaches `sessionRotation.soft` or `.hard` (`rotation/decide.rs` in the Session Host crate; `hard` carries the pending question verbatim into the handoff); `manual` is the owner's `/handoff` and carries the old session's last assistant message too (8.8). One rotation at a time per lineage: the executor holds the `session-rotation` lock (holder-lock registry, `<fgosDir>/locks/session-rotation--<persona>-<name>.lock`), a second request finds it held and is a no-op, and `session start` refuses `rotation-in-progress` while it is held.

### 8.4 Files

Under `.fgos/runtime/session-rotation/<persona>-<name>/`:

| File | Writer | Content |
|---|---|---|
| `<yymmdd-hhmm>-<sid8>.md`, `latest.json` | handoff store | immutable redacted handoffs, newest `keep` kept; `latest.json` replaced atomically after the file exists |
| `placement.json` | `startHeadSession`, the executor | `{ role, gen, placement, runDir, persona, startedAt }` of the live head (`runDir`: its session attempt's directory); lineage state only: the head's identifiers (slot key, pane, generation) are read from its Identity record, never from this file |
| `rotation.json` | executor | the pending rotation: id, successor key and generation, reason, handoff, old key and session, pending question; removed when the rotation ends either way |
| `answered.json` | `markSuccessorAnswered` | the successor's first answer |
| `incidents.jsonl`, `rotation.log` | executor | one JSON line per failed rotation; the detached process's output |
| `request-<id>.json` | `requestRotation` | one request until its executor reads and removes it |

### 8.5 Open items

- **Executor crash after `placeHead`.** If the detached executor dies after it started the successor, `rotation.json` stays, the lock frees itself, and nothing ends or completes the rotation: the successor waits unanswered and the old session keeps the role. No recovery is built; it is tracked as backlog `p-bakpfrvigb`.

### 8.6 Configuration and the `/clear` fallback

`sessionRotation` in `core/config-standard`: `soft` (0.4), `hard` (0.7), `keep` (10), `windowSize` (1000000), `answerWaitMs` (120000), `personas.<name>.{soft,hard,reload}`. The context fraction comes from the status line sidecar newer than the Stop hook, else the transcript sum marked one turn stale (spike report).

`/clear` through Terminal Control `send` works (the spike measured 3 of 3, with a SessionStart hook re-injecting a short context) but cannot meet the two-step rule: the old context is gone before the successor answers. It is recorded only as a fallback for a host that cannot open a second session and is never used on the terminal host.

### 8.7 The `fgos session` verb

`fgos session start <persona> --name <name>` and `fgos session rotate <persona> --name <name>` are the owner's door to 8.1 and 8.3 (a live head is fronted by the slot its Identity record names; `fgos identity resolve` with any identifier of the head, its pane, tab, CLI session or role, answers the same record); `fgos session write <path>` is a confined head's door to its granted files. The request socket's verbs carry the same names (`session start`, `session rotate`, `session answered`, `session restore role`, `session bind session`, `session write`), and the `questions ask|ack|cancel|answer` verbs of the owner-question store carry theirs. "Head" stays this component's word for the session kind: Identity's `head:` role, `FGOS_HEAD_*`, `internal head-request` and the `head-request.v1.json` contract keep their names. `fgos head` left no alias and no refusal pointer: it answers unknown verb. The verb is declared once in the command registry (`src/cli/command-registry.mjs`, generated manifest and routes beside it); the host serves its help.

The CLI arm holds no behaviour: `start` calls `startHead` and `rotate` calls `rotateHead` (both in `src/session-host/head-request.mjs`: a confined caller asks through its request socket, anyone else calls `startHeadSession` or `requestRotation`). The project is the worktree root found from the current directory. A CLI rotation is always reason `manual`; `soft` and `hard` come only from the rotation hook, so the verb has no flag for a reason.

Refusals and exit codes (the table `exit-codes.v1.json`):

| Exit | Meaning |
|---|---|
| 0 | started, fronted the live holder, or rotation requested (`rotate` returns at once; the executor runs detached) |
| 2 | precondition: a refusal of the use case or the socket (grant, role, `no-request-socket`, bind or start refused), or a rotation that did not start |
| 3 | `rotation-in-progress` |
| 4 | validation: missing persona or `--name`, `bad-persona`, `bad-name`, unknown sub-verb |

`--json` prints the use case's result (`start`: the placement or the fronted holder; `rotate`: `{ started: true, pid }`). Proof: `test/cli/session-verb.test.mjs`.

### 8.8 The rotation hook

`fgos hook session-rotation --event stop|session-start` is a native subcommand of `hook` (served by the host before the composition root, like `hook mailbox`; code `apps/fgos/src/wiring/session_rotation_hook.rs`). The hook only gathers facts, decides and asks: Identity moves roles and the executor rotates. It does nothing unless `FGOS_HEAD_ROLE` is set, takes the persona and name from `FGOS_HEAD_PERSONA` and `FGOS_HEAD_NAME` (declared by `placeHead` in the session envelope's env; the role string is never parsed), never blocks, prints nothing to the conversation except the session start's one `additionalContext` object, and exits 0 on every path; a failure leaves one line on stderr. Files, environment and payload fields it reads are the contract `packages/session-host/contracts/rotation-files.v1.json`.

- **Stop, successor.** When the lineage's `rotation.json` waits for `FGOS_HEAD_GEN` and no answer is recorded, the stop sends `session answered` (rotation id read from its own handoff, its Identity session id, its first assistant message) over `FGOS_HEAD_REQUEST_SOCKET` and does not measure. No message yet or a refusal: nothing is recorded and the next stop tries again.
- **Stop, any head.** Measure (`rotation/measure.rs`: a status-line sidecar record newer than the hook, else the transcript marked one turn stale), decide (`rotation/decide.rs`, thresholds of the persona), and on soft or hard send `session rotate` with the stop facts. Without a request socket nothing is asked. No lineage state defines a pending owner question yet, so none is reported.
- **Session start.** Prints the latest handoff of the lineage (inline under 10000 characters, else a pointer and the pending question verbatim).
- **What a handoff records.** `- rotation:` in the handoff, `rotate` in `latest.json` and `reason` in `rotation.json` are the real kind: `soft`, `hard` or `manual`. A hard or manual handoff carries the old session's last assistant message and the pending question verbatim (a head batches its open questions in that last message; no structured pending-question source exists yet). The portfolio is the stop facts' list, else `sessionRotation.personas.<persona>.reload` (files or folders, listed as written; an entry the project does not have is left out quietly); the release standard lists the secretary's backlog and discussions folder, so the secretary rereads them after any rotation.
- **A manual rotation's last message.** No Stop hook carries it, so the executor reads it: the session folder the old launch kept or declared (`seatSessionDir`), then the route `fgos internal session-host last-message` (`rotation/last_message.rs`: the newest `<session-id>.jsonl` one level under the folder, read backwards from its end, at most 8 MiB; its last non-sidechain assistant message with text). The turn has ended only when the last user or assistant entry is an assistant `end_turn`; the executor reads again until then (at most 60 s), so the message written after the request is the one handed over. The handoff fences the message (a fence its backticks cannot close, so a heading quoted in it is never read as the pending question) and keeps its last 8000 characters behind `…(earlier text cut)`. A Codex head's rollout transcript is not read: no fixture proves its assistant record, so the section names it as not found. A folder or transcript that cannot be found leaves `(not found: <why>)` in that section and the rotation goes on. Proofs: `test/session-rotation/rotate.test.mjs`, the crate's `last_message` tests, and the route wiring in `test/session-host/client.test.mjs`.
- **Owners.** The frame codec and the client call are the run supervisor's (`go_channel`, `head_client`); measure, decide and the lineage reader are the Session Host crate's (`rotation/`); the wiring only connects them. The hook rows are Claude Code's, in the one hook table; `fgos doctor` reports a missing row through the existing hook row of that CLI.
- **Not built.** No status-line sidecar writer ships (`context-sidecar.jsonl` is optional), so measures are transcript-based and one turn stale until one exists.

### 8.9 The confined door: ticket verbs, `session stop`, `forQuestion`

A confined head reaches every verb below through its one request socket (`head-request.v1.json`); the host hands a confined call (`FGOS_CONFINED=1`) of a verb the contract names to the Node payload, which sends it through `requestHead(verb, args)` (one constant per verb in `head-request-client.mjs`, no second client). The route child (`runHeadRequest`) re-checks every argument, because the arguments come from the sandbox: an unknown key, a mistyped value, or a string that becomes a host argv token and starts with `-` is `bad-args`, and the host argv is built from named fields, never from a free string.

| Verb | Who | Does |
|---|---|---|
| `land` | any head with the grant | Answers a ticket. Exactly one of `branch` and `paths`. A `branch` land is a lead's only (`land-branch-lead-only`) and carries the footprint of its plan as `--footprint` (a plan with no footprint refuses `write-outside-footprint`, the flag is never left out); `tests` go as one `--test <path>` each; `paths` must lie in the caller's grant `writes` (`path-outside-grant`), and a lead's `paths` land that would change the `footprint` of its own `plan.md` against the trunk tip is `footprint-change-refused`. |
| `run` | lead | Answers a ticket. `prompt` (never `unit`: a unit file declares its own writes, which the footprint could not bound, so `unit` is `bad-args`); `writes` the plan footprint does not contain, judged by the repo's write-scope matcher (`matchesWriteScope`), are `write-outside-footprint`, so `src/**` is not contained in `src/*`. The runner starts `fgos run` without `FGOS_DISPATCH_DEPTH`, so a lead's phase run is a top-level seat that takes a lane. |
| `request result` | any head | Reads this role's own tickets: with `id` one (`ticket-unknown` for another role's), without it the role's tickets newest first; `wait` (seconds, at most 50) polls until the ticket leaves `running`. |
| `worktree create` | lead | `fgos worktree create <path> --branch <b> [--base <ref>]`; `branch` is required (a detached worktree is not this door's). |
| `session stop` | supervisor, secretary and any head granted it | `stopHeadSession`: stamps `retiredAt` in its lineage `placement.json` (the head-state source reads `retired` from it) before anything can end the route, then ends the live head the way a rotation ends the old head (its own supervisor is asked to stop it, the attempt's close is awaited), then retires the pane; a plain pane close is refused while an agent is the pane's foreground (8.2). When no stop request can be written the answer is `stop-not-ended` and the stamp is put back; once the request is written the stamp stays, and a head that does not end in time (`stop-not-ended`) or a pane that will not close (`retire-refused`) is reported with the stamp kept. Allowed for a lead or planner lineage of this project, the asker of an answered question (the host's `asker.roles` holds the role; a host failure surfaces with its code), or the caller's own role, else `role-mismatch`; a role no live session holds answers `{stopped: false, reason: "not-live"}`. |
| `supervisor handled`, `supervisor done` | supervisor | The host verbs of the same name, through the envelope's `hostBin`; `handled` takes `events`, one to 50 ids, and marks every one. A `done` that answers `{done: true}` also starts a detached stop of the caller's own role, which waits for the route to exit so the reply is out first, and adds `stopping: true` only once that process started. |
| `supervisor queue`, `supervisor plans`, `slots` | supervisor | Reads the sandbox cannot make itself: the queue is read from the event store, the plans need Identity's project handle and live role holders, the lane view the machine's lock root, and all three sit under masked roots. Not tickets: the route child runs the host verb with `--json` through `hostBin` (the way `supervisor handled` does) and returns its JSON within the 60 s bound. A lead's skill reads only `request result`, so a lead is granted none of them. |

The host verbs' answers are read as one document first (`--json` prints it indented) and line by line only when that fails; a refusal the host prints on stderr as `fgos: <message> [<code>]` keeps its code as the verb's `verb-failed` detail.

A plan is read by one reader, `planOfHead` (`src/session-host/head-plan.mjs`): a `lead-*` or `planner-*` head name is the project handle cut to the prefix limit, `-`, and a prefix of one plan directory that is not `done` or `withdrawn` (`plan-not-found`, `plan-ambiguous`; the limits live in `plan-vocabulary.v1.json`), and its `footprint` is read from `plan.md` at the trunk tip, never from the working file. The project handle is the Identity one (`handle` of `.fgos/project.json`, what `fgos identity project` reports), never the checkout folder's name.

**Tickets.** The socket serves one request at a time and caps a verb at 60 s, so `land` and `run` answer `{ticket, state: "running"}` at once. The request id is the ticket id; `.fgos/runtime/head-tickets/<role>/<id>.json` is created without replacing (`ticket-used`) and a detached runner runs the host verb to its end, then rewrites the file `done` or `failed` (`exit`, `code`; `land` keeps the host's JSON, `run` only the `unitRunId`, whose outcome stays in `.fgos/assignments/<unitRunId>/` and is read from there by `request result` through the Unit-run readers: present, settled, summary outcome). The runner's process identity is written into the ticket before the reply, so a runner that dies at once reads `failed`/`runner-gone`. The runner outlives the route child (proof: `a_ticket_verb_answers_at_once_while_its_detached_runner_outlives_the_route_child`). A `running` ticket whose runner record is judged `dead` reads `failed` with `runner-gone`; `unknown` stays `running`. Ticket files are runtime scratch.

**`forQuestion`.** `session start` takes an optional question id; the opening gains one line telling the new head to write that question's answer back to its origin and then `fgos questions ack <id>` (or `cancel`). The successor holds the asker's own head role, so nothing else changes.

## 9. Lịch sử quyết định

- 2026-11-17 — Home decision, settled by evidence not asked: the port is a new foundation component Session Host, a Rust crate, layered between Terminal Control and the run supervisor. The run supervisor, which must place through it, is Rust (`supervise.rs`), so the port must be Rust to be reachable without a second path; `component-boundary.md` §4 forbids the run supervisor knowing a pane and says Terminal Control stands alone and must not know runs, so the port belongs to neither; design principle 4 (foundations in Rust). Evidence: [facts report](../../../plans/261117-1856-secretary-session-spine/reports/facts-host-port.md) sections 1 and 4. Prior art: none existed or was removed (`git log -S'placement' -- src/run-supervisor` is empty).
- 2026-11-17 — Opening delivery reuses the one shared delivery step; nothing moves out of the run supervisor, whose `TermIo` wraps the port's `PaneIo`.
- 2026-11-18 — Worker attempts are placed through the port (`open` + `launch` replace `start`; the envelope carries `host`). The direct adapter and the port's own `start` and opening delivery were deleted: a head is started by its run supervisor as a session attempt (confined like a worker), so the port never types into a pane and a screenless launch stays the supervisor's. Evidence: phase 11 and 12 reports of the secretary plan.
- 2026-11-18 — Head rotation is two steps (start the successor beside the old session, move the role only after the successor answered, then end the old one). Because a confined successor can write neither `.fgos` nor Identity, its first answer travels as the verb `head answered` through the request socket and its own supervisor moves the role with Identity's `take`; the executor never moves a role. The lineage lock is a holder-lock registry row (`session-rotation`). No earlier rotation mechanism existed (`git log -S` on rotation symbols found none).
- 2026-11-18 — The secretary head's grants are raised (owner), everything else stays confined. A granted file gets its parent bound read-write from the host with the other entries bound back read-only (first a tmpfs shell, replaced the same day: a file bound by inode went stale when Git replaced it, and the long-lived head wrote a deleted file), so an editor's temp-and-rename write succeeds; `mailbox: true` binds exactly the mailbox lock file and record directory (bind option A, chosen over a request-socket send for speed; the head can rewrite the project's mail record). A confined head becomes its CLI session in Identity through the supervisor-answered `head bind session`, because the head cannot write Identity's directory and the mailbox keys it by the CLI session; peers are reached by `fgos mailbox send`, and peer sockets and the PID namespace are left as they are (separate decision).
- 2026-11-18 — The verb `fgos head start|rotate` (owner answer 2026-11-17, noun provisional) is a thin arm over `startHead` and `rotateHead`, so a confined head running it goes through its socket exactly as the use cases do. CLI rotation is always `manual`: the use case requires a reason, and an extra `--now` flag would have named the same thing. See 8.7.
- 2026-11-18 — The rotation hook is a native Rust hook kind, not a Node script: new code goes to Rust. `measure` and `decide` (used only by the hook) moved to the Session Host crate and their Node files and tests were deleted; the Rust tests in `rotation/` own them. Persona and name travel as declared envelope env instead of being split from the role. The Node handoff writer stays (backlog p-kkkgpg6dzc). See 8.8.
- 2026-11-19 — `fgos head` became `fgos session` (`start|rotate|write`), and every request-socket verb `head <x>` became `session <x>` in the same change, Node and Rust together, because the supervisor refuses an unknown verb. The old worktree verb `fgos session` was retired first. No alias and no refusal pointer: only the owner runs fgOS and all machines upgrade together, and the unknown-verb answer already lists what exists. "Head" stays the word for the session kind (`head:` role, `FGOS_HEAD_*`, file and contract names). See 8.7.
- 2026-11-19 — The secretary head runs in the leads' permission mode (owner decision): a supervisor message to it was held and expired because the leads ran bypass and it ran auto. The one path is the invocation's `permissionMode` chosen through the persona's `prefer` in the release standard; no head-specific flag path. Bypass stays legal only under the required bwrap sandbox (Agent Confinement spec 13.4).
- 2026-11-19 — Long request verbs (`land`, `run`) answer a ticket at once instead of running inside the request, because the socket serves one request at a time and caps a verb at 60 s; the ticket is a file the role reads with `request result`, and its detached runner outlives the route child. A head ends on purpose through `session stop`, which stamps `retiredAt` in the lineage placement and ends the head through its own supervisor, as rotation does.
