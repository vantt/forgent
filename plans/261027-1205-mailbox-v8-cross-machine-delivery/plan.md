---
title: "Agent mailbox V8: cross-machine delivery"
status: proposed (revised after red-team 2026-10-27)
lane: MAIL
owner-approval: pending (scope and budget, section "Decisions for the owner")
created: 2026-10-27
---

# Agent mailbox V8: cross-machine delivery

Owner: lead:MAIL. Plan only; no code until the owner approves scope and budget.
Authority: `docs/platform/agent-mailbox/spec.md` sections 15.1 and 15.2; Event Store spec sections 6, 7, 14, 16; Identity spec (shared directory, signatures, pins).
Red-team (4 personas, read-only, 2026-10-27) found five load-bearing claims of the first draft false; this revision fixes them. The review's verdict was "go with changes" and asked for a re-estimate, done below.

## Outcome

A session on one machine can send mail to a session of the same project on another machine; the receiver sees it at its next tool call; the sender is told honestly that it is cross-machine and what happened to it afterwards (shown, or refused with a reason). Same-machine delivery does not change.

## Why, stated against the missions

Today every consumer is an fgOS lane on the owner's own machines (mission 3, dogfood). The capability matters for missions 1 and 2 only where a project runs agent sessions on several machines. The owner's words of 2026-10-26 09:57 on the board ("mailbox chưa hoạt động xuyên máy") are the demand on record. If the owner sees no such project yet, the cheaper choice is to stop after phase 00 (see decision 1).

## Measured baseline (2026-10-27, fg-server2, `fgos mailbox status`)

recorded to offered: n=12, p50 905,298 ms (about 15 min), p95 and max 43,520,962 ms (about 12 h, one mail to an idle head). Mail already waits for the receiver's next tool call; Git adds minutes, so cross-machine latency is dominated by the receiver's idleness, not by the transport.

## What exists (verified by the red-team against code and specs)

1. Identity shared directory: signed `identity.session-published` / `session-ended` in stream `project:identity`, fold, cache, pins (`seen` or `confirmed`). **Limits found:** only the CLI verbs `session --register|--role|--drop-role` and `list --prune` publish; the mailbox's own registration (`register_writer`) never does, so most mailbox heads are invisible to other machines, and dead heads stay listed until pruned. The cache is written only by identity verbs, so it is stale after a sync. A first-seen key is pinned `seen` and accepted by `verify`.
2. Event Store transport and registration by contract file; Rust consumers link the crate. Identity's pattern is a port in the crate with the store adapter in the host (`apps/fgos/src/wiring/identity_log.rs`), because the store depends on identity.
3. The detached "seal then push" child exists **only in Node** (`src/cli/detached-child.mjs`, `src/event-store/maintenance.mjs`). A native `fgos mailbox send` appends and nothing seals or pushes until an unrelated Node command runs. Spec 15.2 says "send seals and publishes itself"; V8 must provide that in Rust.
4. Local mailbox record remains delivery truth; the hook reads only it.

## Design (revised)

- **Layering.** `fgos-mailbox` keeps its imports (spec 4 and 5.1.1 forbid the Event Store and Identity calls inside the crates). A `RemoteMail` port lives in the store crate; signing (the identity `directory` feature), the Event Store adapter and head publication live in host wiring beside `mailbox_identity.rs`. Spec sections 4 and 13 are updated in phase 01.
- **Stream and types.** Own stream `project:mailbox` (never the Work `project` stream), registered in `packages/mailbox/contracts/event-streams.v1.json`, scope project, `sealOnWrite: false`:
  - `mailbox.message-sent {v, id, from:{id, machine}, to:{id, machine}, kind, body, reply_to?, sentAt, sig}`; `to.id` is the recipient's full id; the receiver derives the frame handle from the verified id (`owns_id`), never from payload text.
  - `mailbox.message-settled {v, id, machine, outcome: offered|refused, reason?, at, sig}`: receiver to sender. Needed in V8a, otherwise a refusal or TTL expiry on the receiver cannot reach the sender and mail is lost silently (spec conformance item on loss).
  - Each type has its own signing domain text (`fgos-mailbox-message/1\n`, `fgos-mailbox-settled/1\n`).
- **Remote heads.** A mailbox head becomes visible to other machines through a detached Rust child that publishes the head's directory entry (never in the hook: signing spawns `ssh-keygen`). `send` folds the shared view itself and does not trust the cache. Delivery only to heads present in the folded directory; a dead remote head is detected when the mail is refused at the receiver, reported by a settled event.
- **Rust detached door.** One new Rust door starts one detached child (`seal+push` for the mailbox stream; `fetch+ingest` for the receiver). It is used by `send` and, only when the last fetch is older than `eventStore.sync.intervalSec`, by the hook; the hook never waits and never touches the network. Where it lives is decided with OPC in phase 00, reusing the Node maintenance rules (never wait, bounded lock, exit 0).
- **Send commit order.** The event append is the commit point; the local snapshot records the quota after it, and a failure between them is repaired by a counted recovery, not a lost mail. Unsealed events are machine-local until sealed; the report says "recorded" and never "delivered".
- **Ingest, never in the hook.** Runs from the detached `fetch+ingest` child, from `send`, and from `inbox --claim` only (`inbox`, `list`, `status` stay read-only). It reads the stream incrementally from a cursor kept in the local record (record schema v2, rollback deletes the record, already documented). Rules:
  - the first ingest and any cursor reset take a baseline at the current tip and deliver nothing older;
  - dedupe key `(signer machine, id)` kept as long as the ingest horizon (not the 24 h header retention);
  - verify signature, signer machine, pin state, `owns_id`; a mail is bound to the recipient's published full id and `registeredAt`, then to that head's current generation at ingest time; mail older than a stated maximum age (default 24 h, same as the record TTL, with an explicit clock skew tolerance) is dropped with a counted reason; `sentAt` is display only;
  - a deferred or unreadable event never blocks other mail (skip and count, unlike Identity's all-or-nothing read);
  - refusals produce a settled event to the sender.
- **Trust.** Accept only `confirmed` pins (`mailbox.remote.requireConfirmed`, default true; the owner confirms a machine once with `fgos identity pins --confirm`). A `seen` or re-keyed machine is dropped and counted. Every delivered mail is still `peer`. The trust boundary widens from "any process of the same user" to "any machine confirmed for the project"; spec section 8 says so, and says that the trusted-sender instruction does not extend to remote handles.
- **Abuse limits.** Rate and lifetime caps are accounted per verified remote sender, not in the shared `~unregistered` bucket; a remote reply line names the full id (a remote short name can collide with a local head).
- **Size and privacy.** 2 KiB framed body cap across machines, hard refusal above it; the report says bodies are plaintext in the Git remote for good and the sender is warned off likely secrets.
- **Config and doctor.** `mailbox.crossMachine.enabled` default false and `mailbox.remote.requireConfirmed` default true, both in `fgos setup` and a doctor row (publisher and fetch refspec, pins, last fetch age, forged own-mirror, machine id shared by two clones).
- **Out of V8:** acknowledgement, `handled`, `reply_by`, expiry, approval (spec 15.1) become V9; idle wake across machines (question 22); mail to a machine where no fgOS process ever runs; durable sessions.

## Phases

| # | Phase | Output | Depends on |
|---|---|---|---|
| 00 | [Facts and measurements](phase-00-facts-and-measurements.md) | numbers and two owner/OPC answers; go or stop | none |
| 01 | [Contracts and spec](phase-01-contracts-and-spec.md) | stream and types contract; spec 4, 5.1, 8, 10, 13, 15.2 | 00, DOC land |
| 02 | [Rust detached door and head publication](phase-02-detached-door-and-head-publication.md) | seal+push and fetch+ingest children; heads visible remotely | 01 |
| 03 | [Remote send](phase-03-remote-send.md) | signed event, honest report | 02 |
| 04 | [Ingest and settlement](phase-04-ingest-and-settlement.md) | verified mail lands once; refusals reach the sender | 03 |
| 05 | [Rollout, doctor, live proof](phase-05-rollout-doctor-live-proof.md) | config, doctor, two machines proven | 04 |

## Budget (re-estimated after red-team; an estimate from this lane's V1 to V7 pace, to be re-set after phase 00)

| Scope | Working days | Live two-machine runs | Heavy runs |
|---|---|---|---|
| V8 phases 00 to 05 | 10 to 14 | 8 to 10 | 5 to 6 (one per landing, in agreed windows) |
| V9 (15.1: acknowledgement, `reply_by`, expiry) | not planned here | | |

Phase 00 can end the plan: hook budget, remote accepting `refs/fgos/*`, or OPC refusing a Rust detached door each stop it and go to the owner in the decision-question template.

## Decisions for the owner

1. **Go or stop.** Build V8 for missions 1 and 2 now (recommended only if a project needs agents on several machines soon), or run phase 00 only and decide with its numbers (recommended default: this).
2. **Body cap** 2 KiB across machines (recommended).
3. **Default** off (`mailbox.crossMachine.enabled=false`) until the live proof (recommended).
4. **Trust rule** `confirmed` pins only (recommended); it means the owner confirms each machine once.
5. **Approvals needed:** WORK/lead:ES for the stream registration, OPC for the Rust detached door and anything Git-side. HARDEN's R13 and R14 may change phase 00 numbers.

## Acceptance

- Two machines of one project: a mail from A to a head on B is shown inline at B's next tool result, once, with the right sender and no replay after the head's generation changes or the record is deleted; A's `list` shows `offered on B` or the refusal reason.
- Bad signature, `seen` pin, wrong machine, duplicate `(machine, id)`, over-cap, too old: each dropped or refused with a counted reason and a settled event; none reaches a head.
- Same-machine proofs unchanged; hook p95 with no mail within 50 ms.
- Gates: mailbox crates tests, clippy `-D warnings`, msvc and aarch64-apple-darwin checks, one-door census, `npm test` green in an agreed window.
