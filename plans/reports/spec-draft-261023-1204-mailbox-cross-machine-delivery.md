---
title: "Agent Mailbox spec §15.2 (proposed): cross-machine delivery"
description: "Proposed replacement for agent-mailbox spec section 15.2. Covers the remote message event and its canonical signed bytes, delivery and disposition semantics across machines, addressing through Identity, refusal of unsigned mail, Event Store transport, the hook rule, policies across machines, growth, the X ladder and the owner's questions. Not signed: the owner signs gate GX after review."
---

# 15.2 Cross-machine delivery (proposed, not signed)

```txt
Document type: proposed replacement for docs/platform/agent-mailbox/spec.md section 15.2 (branch mailbox/v1-v3)
Status: draft for owner review; signed only at gate GX (section 15.2.9). Nothing here changes what G0 signed for the first slice
Scope: MAIL's own concerns only, as agreed with the IDENT lead (claude-5v7u@fg-server) on 2026-10-23
Not designed here: Identity's signing, keys, trusted-machine list and shared directory (docs/platform/identity/spec.md sections 5, 7 rungs I4-I5); Event Store's envelope, sealing, sync and cadence (docs/platform/event-store/spec.md sections 6, 7, 14, 16)
Supersedes: the earlier section 15.2 text ("Persistence in the Event Store and cross-machine delivery")
Date: 2026-10-23
```

## 15.2.0 What changes from the earlier text, and why

| Earlier 15.2 | This draft | Reason |
|---|---|---|
| The whole record (section 6.4) becomes Event Store events | The local snapshot stays the record for every message, local or remote. Only mail that crosses machines is also an Event Store event | The hook reads the snapshot under a 50 ms p95 target (section 4.1). A store read on that path would break the Event Store's in-gate and network rules. G0 signed the snapshot under a mutex. Local mail is runtime state (L1, L7) and has no reason to enter shared history |
| `MailStore` and `Replication` become ports | No new port. A single adapter module registers MAIL as an Event Store consumer | Section 4, rule 5: a port is added only for a second real implementation. The Event Store is the only transport (15.2.5) |
| Sender attribution only | Remote mail is refused unless it has a signature that Identity has verified (15.2.4) | Outside one machine the trust boundary is gone: anyone who can push to the remote can write an event |
| Rate limit "per session rather than per machine" plus collapse of identical bodies | Each policy is placed on the sender, on the receiver or (none today) on a global view (15.2.7) | One machine cannot see another machine's counts before a sync |

Kept from the earlier text and from section 17: no timer and no daemon; per-sender order only; at-least-once delivery deduplicated by `id`; no message garbage collection at first, with expiry as a view rule; the Event Store's 2 s rebuild threshold (decision 2026-10-19); body retention equal to the record TTL (owner Q1, 2026-10-22); lifetime caps for heads only (owner Q3, 2026-10-21).

## 15.2.1 The remote message event and its canonical bytes

**Event types.** These are registered in a new contract `packages/mailbox/contracts/mailbox.events.v1.json`. MAIL owns them; the Event Store only carries them (its section 7):

| Type | Scope / stream | `sealOnWrite` | Written by | Purpose |
|---|---|---|---|---|
| `mailbox.message` | `project`, stream `project:mailbox` | true | the sender's `send` when the recipient is on another machine | one remote message, with its signature |
| `mailbox.disposition` | `project`, stream `project:mailbox` | true | the receiver's ingestion and finish | `{id, state: offered \| refused, reason?}`, so the sender learns the outcome after a sync |
| `mailbox.ingested` | `local` | false | the receiver's ingestion | `{id, bytesSha256}`. A rebuilt view never ingests a message twice. Never pushed |

A local message (sender and recipient on one machine) never becomes an event. `acked` and `handled` (section 15.1) will be dispositions in the same stream when 15.1 is built. This draft adds no state for them.

**Payload shape.** The payload is `{ "msg": <message object>, "sig": <Signature> }`. `sig` is what Identity's `sign` returns: `{machine_id, key_id, sig}`. Identity owns its encoding.

**The message object.** These are the only fields that are signed. All of them are strings or booleans, so no number encoding is involved:

| Field | Rule |
|---|---|
| `v` | `"mailbox.message/1"`. A new shape takes a new value and never reuses this one |
| `project` | the project id from Identity (`.fgos/project.json`, 32 hex). A message signed for one project never verifies in another |
| `id` | a machine-scoped id `<machine-id>/<local message id>` (Identity section 4a, rule 2), unique by construction. The local part comes from the operating system's random device, as for local messages today |
| `from` | the sender's Identity full id `<machine-id>/<local session id>`, set by the component and never taken from message text |
| `to` | the recipient's Identity full id, resolved at send (15.2.3) |
| `to_registered_at` | the `registeredAt` of the directory entry the sender resolved. The receiver uses it to tell the same session from a later one (15.2.2) |
| `kind` | `message`. Notices never cross machines: a notice is about local record state |
| `reply_to` | the derived reply link (section 5.4), or the empty string. It is checked by the receiver |
| `wake` | the sender's permission (section 5.1). It is never the effective wake, which the receiver decides |
| `sent_at` | sender wall clock, fixed width `YYYY-MM-DDTHH:MM:SS.sssZ`. For information only. No window, TTL or order uses it |
| `body_sha256` | lowercase hex SHA-256 of the exact body bytes (UTF-8, as sent, before any framing or escape) |
| `body_bytes` | the body length in bytes, as a decimal string |
| `body` | the body text inline, or absent. Whether it may be absent is owner question Q-X1 (15.2.8, 15.2.10). The signature covers `body_sha256` either way, so `body` itself is not among the signed fields |

**Canonical bytes (what is signed).** The canonical bytes are the ASCII line `fgos-mailbox-message/1` and one `\n`, followed by the message object without `body`, serialized by the Event Store's canonical rule (its section 6: keys sorted, no insignificant whitespace, UTF-8). MAIL reuses that rule through the Event Store crate's serializer and does not write a second one. The prefix keeps a message signature from being valid as an Identity directory-entry signature or any other signed object. The body is bound through `body_sha256` and `body_bytes`, so a receiver checks an inline body against the hash before use. A body that does not match is framed as a missing body (section 5.5) and is never shown.

**Not signed, by design.** These are left out:

- the Event Store envelope fields (`origin`, `stream`, `seq`, `seen`, `ts`, `src`, `h`), which belong to the transport and are covered by `h`;
- `to_generation`, which only the receiving machine knows;
- `depth`, which each side derives from the chain (section 5.4);
- the effective wake;
- every state, and `recorded_at`, which is the receiver's ingestion time.

**Proof shape.** Golden vectors (message object, then canonical bytes, then SHA-256) live in `packages/mailbox/contracts/fixtures/remote/`. They are checked by `cargo test -p fgos-mailbox-core`. The core builds the bytes with no I/O and takes the signature as an input. It never calls Identity itself (section 4, rule 1).

## 15.2.2 Delivery and disposition semantics across machines

**States on each side.** States stay local, as section 5.2 defines them. A machine never moves another machine's state. It only reads that machine's published dispositions.

| Sender machine sees | Meaning | Source |
|---|---|---|
| `recorded` | `mailbox.message` appended and acknowledged (Event Store section 9: durable on this machine) | the append result |
| `published` (a report fact, not a state) | the own ref was pushed past the event | `fgos events status` (last push, unpublished count) |
| `offered` / `refused (reason)` | the receiver's disposition arrived with a later fetch | a `mailbox.disposition` event from the recipient's machine |
| no disposition yet | not fetched, not ingested, the receiver is offline, or the receiver is retired. These cases cannot be told apart | the age since `published`, shown by `status` |

| Receiver machine | Meaning |
|---|---|
| ingested, then `recorded` | the consumer folded the event, verified it (15.2.4) and placed it in the local snapshot. From here the message is exactly like local mail: claim, emit and finish (section 5.2), and the record TTL counted from the ingestion time |
| `offered` | finished as in section 5.2. A disposition is appended |
| `refused (reason)` | refused at ingestion or by the lazy sweep (TTL, offer cap). A disposition is appended, except for the unverified cases of 15.2.4 |

**Ingestion rules (receiver, under the mailbox mutex).** These rules apply in order, and the first failure wins:

1. Verify (15.2.4).
2. Dedupe by `id`. An `id` already ingested is skipped. An `id` seen with different canonical bytes is `id-conflict`: it is refused, counted and never offered.
3. The recipient must be a live head of this machine. The local part of `to` must be the key of a live binding, and `to_registered_at` must equal the `registeredAt` of the recipient's current Identity entry. Otherwise the message is refused with `recipient-gone` or `recipient-restarted`. A remote message is therefore never replayed into a later process of the same session. This is the cross-machine form of the generation rule (section 5.1).
4. `reply_to`, if set, must name a message this recipient sent to the sender. Otherwise the message is refused with `reply-to-not-offered`. `depth` is then derived and the chain-depth cap is applied.
5. The size cap, then the queue cap and the per-sender share. When either is full, the message is deferred, not refused (bounded deferral, 15.2.7).
6. Effective wake: the receiver's exchange quota and its wake lifetime cap (15.2.7).
7. Bind `to_generation` to the binding's current generation. Write the snapshot and append `mailbox.ingested`.

**Guarantees, stated plainly:**

- **At least once, deduplicated by `id`.** The Event Store delivers an event to a view any number of times across rebuilds. `mailbox.ingested` together with the snapshot's own header set means a message is ingested at most once per receiver clone. The duplicate window of section 5.2 still applies after ingestion. A machine that is rebuilt from zero can lose its local `ingested` record. It then re-offers only messages that have no disposition from this machine, because a published disposition also counts as ingested.
- **Order per sender only.** Messages from one sender are ingested in the sender stream's `seq` order. Two senders have no common order. The Event Store's global order (its section 12) is used for determinism and is not promised as mail order.
- **The rebuildable view.** MAIL's consumer view is the set of `mailbox.*` events that name a head of this machine (as `to`, or as the subject of a disposition), with the consumer's cursor. It is a cache and can be dropped by `fgos rebuild` (Event Store section 15). The snapshot is not the view. It stays runtime state and is never rebuilt from the store. Header retirement (section 6.4) does not delete anything from history.
- **Offline.**
  - A sender that is offline still appends, returns `recorded`, and its report says "not yet published". The Event Store retries the publish at its next trigger.
  - A receiver that is offline receives nothing. Its local mail is unaffected.
  - Neither side blocks a hook, a verb or the Work gate on the network (Event Store section 14).

## 15.2.3 Addressing through Identity

**Owner decision 2026-10-23, "B then A".**

- **Step B (one machine, first).** An Identity session handle (`claude-4f@fg-server`), a role alias `lead:<LANE>` and an Identity full id become aliases of a local mailbox binding. `fgos identity resolve` returns the full id. When its machine part is this machine, the local part is the mailbox key and delivery is local, exactly as today. The short names of section 5.1.1 (`<project>-<cli>-<2 characters>`) remain the local names.
- **Step A (across machines).** The address is the Identity handle or the full id. Short mailbox names are local only and are never resolved on another machine.

**Resolution order at `send`.** This extends check 2 of section 5.3. Shapes cannot collide: a mailbox short name or key is limited to `[A-Za-z0-9._-]`. A text that contains `@` or `/`, or that starts with `lead:`, therefore goes to Identity, and any other text goes to the mailbox resolver of section 5.1.1. A name is never taken from message text.

**What a remote resolve returns (Identity contract, I4).** It returns:

- the full id `<machine-id>/<local id>`;
- `machine {id, handle}`;
- `registeredAt`;
- the age of the fetch that carried the entry;
- `liveness: "remote"`, Identity's value for an entry from another machine: it proves neither alive nor dead. The IDENT lead fixed this spelling on 2026-10-23, and it enters the Identity contract when I4 starts, together with `machine {id, handle}` and `fetchedAt`.

MAIL never maps the remote value to `alive`.

**Refusals.** Identity keeps its own codes, `not-found` and `ambiguous` (design principle 2), and MAIL maps them to `unknown-name` and `ambiguous-name`. The refusal lists typed candidate objects: `{id, handle, liveness}` today, with `machine` and `age` added as optional fields at I4 (IDENT lead, 2026-10-23). MAIL never parses text.

**What the sender sees (there is no remote liveness).** The delivery report for a remote recipient is one fixed sentence from the frame contract (`[report.remote]`, a proposed section). It says:

- the message is recorded for `<handle>` on `<machine handle>` and is remote;
- the directory entry is `<age>` old and liveness is not proven;
- the recipient sees the message only after both machines sync and then at its next tool call;
- if the session is gone, the refusal reaches the sender after a later sync.

It never says woken, idle or busy for a remote recipient, and it never gives a time bound that the transport cannot keep (15.2.6). `fgos mailbox status` lists remote messages that were published and have no disposition yet, with their ages.

**Prerequisite that this draft relies on.** Only a session registered in the Identity directory can be reached from another machine. Settled with the IDENT lead on 2026-10-23 (`claude-5v7u@fg-server`): the mailbox hook registers its head in the Identity directory through IDENT's exported library call `register_current`, but only when a read-only `resolve` of the head's own handle answers `not-found`. Each head is therefore registered once, from a deliberate write by a known head, and the registration rule stays inside Identity. Once Identity's shared directory (I4) exists, a head the hook registered can be reached from another machine with no manual step. The step lands with MAIL step B.

## 15.2.4 Refusing unsigned or unverified mail

**Who does what.** Identity owns signing and verification as library calls over bytes:

- `sign(state_root, bytes) -> Result<Signature{machine_id, public_key, sig}, Refusal>`; the public key travels with the signature, so the receiver can pin it the first time it sees it;
- `verify(state_root, bytes, &Signature) -> Result<Verified{machine_id, fingerprint, first_seen}, Refusal>`. Identity's I5 design, decided by the owner on 2026-10-23 16:58 as "1a 2b": each machine has an ed25519 key minted by `fgos doctor --fix`, and signing goes through `ssh-keygen -Y` in the namespace `fgos-identity`. Trust is per machine and pinned on first sight, in local user state, the way `known_hosts` works. A changed key is refused with `machine-key-changed`. There is no per-project trusted-machine list; the project binding lives in MAIL's signed bytes (`project`).

MAIL builds the canonical bytes of 15.2.1 and calls these two functions. It designs no key, no algorithm and no trust list.

**Cross-machine delivery stays OFF until I5 exists.** It is controlled by one proposed key, `mailbox.remote.enabled` (default off). The loader refuses `on` unless this machine has a key (`fgos identity machine --json` reports a non-null `keyFingerprint`) and `ssh-keygen` is present. While the key is off:

- `send` to an address on another machine is refused with `remote-disabled`, which is a new refusal reason. Nothing is recorded and no event is appended.
- The consumer ingests nothing. `mailbox.*` events from other machines stay in history and are ignored, and `status` counts them.

**With cross-machine on, a remote message is ingested only when all of these hold:**

1. `sig` is present and `verify(state_root, canonical bytes, sig)` returns `Ok(Verified{machine_id, ..})`. Identity's refusals `bad-signature`, `machine-key-changed`, `machine-key-missing` and `ssh-keygen-missing` all count as unverified;
2. `machine` equals the machine part of `from` and the `origin` machine of the carrying ref;
3. `project` equals this project's id;
4. an inline `body` matches `body_sha256` and `body_bytes`.

**When a check fails.** Mail with no signature, a signature that does not verify, an untrusted or unknown machine, or a mismatched machine or project is:

- never framed, never offered and never placed in the snapshot;
- never counted against any queue, budget or exchange;
- never answered with a disposition, so that an unauthenticated writer gets no reflection channel and cannot make this machine write.

It only raises a bounded per-reason counter (`unverified-remote`, keyed by the claimed machine within `mailbox.counters.maxKeys`). It also raises a `status` signal, so a person can see forged or misconfigured traffic. A later change to the trust list never makes an already-ingested message unverified. It applies only to messages not yet ingested.

**What a signature proves, and what it does not.**

- It proves which trusted machine wrote the message.
- It does not prove which session on that machine wrote it. Any process of the same user there can still sign as any of its sessions (section 8, item 3). `from`'s session part stays attribution.
- Remote mail is `peer` and passes the same frame and instruction as local mail (sections 5.5 and 8).
- A verified signature never grants user authority or a policy exemption.

## 15.2.5 Transport: the Event Store

- MAIL registers one entry in `packages/event-store/contracts/consumers.v1.json`, with an `id`, `contractFile` (`packages/mailbox/contracts/mailbox.events.v1.json`), its own `cachePath` for the view, and `rebuildModule`. The consumer folds only its own types into its own view.
- Publication and fetch are one Event Store verb, `fgos events sync`. It seals, fetches every machine's ref through the fetch refspec, reconciles and pushes the own ref. MAIL never calls git, never writes a ref, never adds a refspec and never runs its own fetch, push, socket or broker.
- **Cadence belongs to the Event Store.** It runs the opportunistic check at the start and end of every fgOS command that opens the store, and in the loops of long-lived gateway and runner processes, every `eventStore.sync.intervalSec` (default 300). MAIL can only ask the Event Store for an on-demand trigger, and whether to ask is owner question Q-X2. If one is added, it is an Event Store door that MAIL calls, with the Event Store's own locks (`event-seal`, `try`). It is never a second transport.
- **When remote mail is ingested.** It happens when the consumer folds. That is the process that ran `fgos events sync`, after the Event Store tells registered consumers that the mirror tips changed (Event Store section 14, step 5), or the next `fgos mailbox` verb, whose catch-up read runs outside every hook. Ingestion takes the mailbox mutex (rank 80) and never holds it across a store read. The store read runs first, outside the mutex, and only the ingestion step runs under it.
- **Swap triggers are recorded, not built.** They are: the remote rejects or limits `refs/fgos/*`; a measured need for latency below a few seconds between machines; a full rebuild of the mailbox view above the Event Store's 2 s threshold. Any of them reopens this section. None of them lets MAIL add a transport beside the Event Store (L10).

## 15.2.6 Hook rule and the honest latency bound

The hook (`fgos hook mailbox`) reads the local snapshot only. It never opens the Event Store, never reads a ref, never fetches and never does network I/O, as the Event Store's Work-gate rule requires (its sections 11 and 14). It also has its own 50 ms p95 target. Remote mail becomes visible only after a sync and an ingestion. From then on, the hook delivers it exactly like local mail: at the next `post-tool-use`, or at `Stop` when the receiver granted an effective wake.

**The latency limit, stated honestly.** The time from the sender's `send` until the recipient can see the message is the sum of four waits:

1. The sender's publish: immediate if Q-X2 adds a publish-on-send trigger. Otherwise up to `eventStore.sync.intervalSec` (300 s by default) while some fgOS process runs on the sender machine, and unbounded when none runs.
2. The receiver's fetch and ingestion: up to the same interval while a runner, gateway or other fgOS command runs on the receiving machine. Unbounded on a machine where no fgOS process runs, because a hook call does not count.
3. The recipient's next checkpoint (tier `turn`, section 6.2): unbounded for an idle session.
4. No wake crosses machines in real time. After ingestion, the receiver applies its own local wake channel, if its tier has one, under its own quota, just as for a local `send`. Every adapter is tier `turn` today, so in practice there is no wake.

These bounds are reported in the delivery report. No sentence claims a bound that depends on a process that may not be running.

## 15.2.7 Policies across machines

The limits of section 5.3 were designed for one machine with one snapshot. A sender session lives on exactly one machine, so its own sends are all visible to it. A receiver sees its own sends and its ingested mail. No machine sees a global view before a sync. Each policy goes where its count is complete:

| Policy (section 5.3) | Enforced where | Holds across machines? |
|---|---|---|
| Size | sender at send (remote cap, 15.2.8), receiver again at ingestion | yes |
| Group guard, self | sender | yes |
| Session budget (rolling window), lifetime cap | the sender's machine, counting local and remote sends together | yes, **per session**: this is council round 1's "per session rather than per machine" without a global view, because one session's sends are all on one machine. A forged sender is stopped by 15.2.4, not by the budget |
| Chain depth | both sides derive it from the chain: the sender at send, the receiver at ingestion | yes, for linked replies |
| Loop guard (ordered pair, window) | sender (it sees every message of its own ordered pair) | yes, per ordered pair. A cycle through three machines is braked as on one machine: by budgets, lifetime caps, queue caps and TTL (section 5.3), each per machine |
| Wake quota per exchange, wake lifetime cap | **receiver** at ingestion: it sees both directions, its own sends and its ingested mail | per receiver. The sender cannot know the exchange count before a sync, so the effective wake is decided where the wake would happen |
| Queue cap and per-sender share | receiver at ingestion | yes, with **bounded deferral** (below) |
| Record TTL, redelivery, offer cap | receiver, from the ingestion time (receiver clock) | yes. `sent_at` is never used, so clock skew between machines creates no false expiry (section 15.1 condition) |
| Collapse of identical bodies | receiver at ingestion, keyed `(from, to, body_sha256)` within a window (proposed `mailbox.remote.collapseWindowSec`, no value) | per receiver. Fan-out to many recipients is already refused as a group |
| A project-wide rate across all machines | none | it would need a global view. Not proposed (Q-X3) |

**Bounded deferral.** When a recipient's queue cap or a sender's share is full at ingestion, that sender's later messages are deferred and not refused. The rule:

- A message is deferred in sender order, so the sender's per-sender order holds.
- Deferral costs no storage: the event is already in history, and only the consumer cursor waits.
- At most a proposed `mailbox.remote.maxDeferredPerSender` messages (no value) wait per sender and recipient.
- Past that bound, the oldest deferred message is refused with `queue-full`, a disposition is published, and later messages are considered again.
- A deferred message also counts toward the record TTL from its first fold, so nothing waits forever.

This keeps the local rule that the newest message is refused, never an old legitimate one, while never dropping a message silently.

## 15.2.8 Growth

Event Store refs only move forward and history is never rewritten (Event Store sections 10 and 14). A body inside a `mailbox.message` event therefore stays in every clone's shared history for good, including after the view's TTL. This covers a secret pasted by mistake: it cannot be removed. The remote frame instruction tells senders this in one line (proposed contract text).

- **Body policy.** The policy is owner question Q-X1. The recommendation is to keep bodies inline and small: cap remote bodies at a proposed `mailbox.remote.maxInlineBodyBytes` (no value; the local cap is 16 KiB) and refuse anything larger at send with "send a link". A path means nothing on another machine.
- **Hash only in the chain.** The signed bytes already allow this (15.2.1). It would need an out-of-chain carrier, which today would be a second transport, so it is not proposed without a carrier the Event Store owns.
- **Expiry is a view rule.** TTL and body retention (section 12, owner Q1) apply to the view and the snapshot. The history keeps everything. No message garbage collection at first (section 17, 2026-10-19).
- **Measurement from the first push.** Rung X6 records, per machine and per day:
  - `mailbox.*` events and their bytes, with the body share;
  - the full rebuild time of the mailbox view;
  - the shared ref's total bytes added.

  The data comes from `fgos events status` and `fgos events export --stream project:mailbox`. When the view rebuild passes 2 s on the slowest owner machine, the compaction item of Event Store section 22 opens. MAIL adds no threshold of its own.
- **Fallback if growth forces it.** Streams per period (for example `project:mailbox-<period>`), so an old one can be ignored whole. This needs the Event Store to accept several consumer streams for one type, which is unverified. It would be an Event Store decision.

## 15.2.9 Prerequisites and ladder

| Prerequisite | Owner | State (board, 2026-10-23) |
|---|---|---|
| Event Store publication live: WORK's ES 09-11 cutover, consumer registry non-empty | ES / WORK | `consumers.v1.json` is empty and the store is dormant on main. The cutover is running on the WORK lane, and `npm test` is not green on its branch yet |
| IDENT I4: shared directory, remote resolve with fetch age and a remote liveness value | IDENT | outline only (`plans/261022-1100-identity-i1-i4-project-machine-session-directory/phase-05-shared-directory-across-machines.md`); waits for ES publication |
| IDENT I5: `sign`, `verify`, the trusted-machine list | IDENT, owner | no mechanism chosen. The owner decides at the close of I4, possibly earlier |
| MAIL step B: Identity handles, `lead:<LANE>` and full ids as aliases of local bindings | MAIL | not started. Needs I3b (built) and V5 (built on branch) |

| Rung | Content | Proof command | Waits for |
|---|---|---|---|
| GX | The owner signs this section and answers Q-X1 to Q-X3 | signed decisions in section 17 | owner |
| X1 | Canonical bytes and `mailbox.events.v1.json`: pure core, golden vectors, the signature taken as an input | `cargo test -p fgos-mailbox-core` (remote vectors) | GX |
| X2 | Step B: send to `lead:<LANE>`, a handle and a full id on one machine; refusal mapping with typed candidates | `cargo test -p fgos-mailbox`; live: two sessions on one machine, `fgos mailbox send --to lead:<LANE>` | GX, MAIL V5 merged |
| X3 | Consumer registration, outbound append, fold and ingestion, `mailbox.ingested`, dispositions, dedupe, `id-conflict`, deferral. Two clones with distinct `fgos.machineId` over a local bare remote, signatures stubbed as refused, so ingestion is proven to refuse everything | `cargo test -p fgos-mailbox` (remote ingestion suite over real temporary repositories) | ES publication live |
| X4 | Remote resolve through Identity: report sentence, age, remote liveness value never shown as alive | the same suite plus `fgos identity resolve <handle-on-B>` on A after `fgos events sync` | IDENT I4 |
| X5 | Verification: unsigned, forged, untrusted-machine, wrong-project and machine-mismatch events never ingested and never disposed; valid events ingested | `cargo test -p fgos-mailbox` (forged vectors) | IDENT I5 |
| X6 | Two real machines: A to B, seen at B's next tool call after sync; offline then online; re-sync dedupe; latency and growth measured from the first push | live suite `test/live/mailbox-remote.live.mjs` (planned), report in `plans/reports/` | X5, owner authorization to push to the real remote |
| X7 | Turn on: `mailbox.remote.enabled` usable; `status` signals (published and not disposed, unverified count, deferred count); doctor row; `CHANGELOG.md` | `fgos doctor`; `fgos mailbox status` | X6 |

Cross-machine delivery stays off in production through X6. Each rung proves nothing above itself. Nothing here changes a locked law of `docs/platform-foundations.md`.

## 15.2.10 Questions for the owner

### Q-X1. Body retention (owner decided 2026-10-23 12:39: option B)

The Event Store is append-only, so anything sent through it stays in the shared repository history forever. Once a message has been handled, its body no longer needs to be kept.

**Decision B.**
- **Only metadata goes into the permanent Event Store stream:** id, `from`, `to`, `reply_to`, depth, `body_sha256`, `body_bytes`, signature and dispositions. This is roughly 200 bytes per message and serves as the audit trail.
- **The body travels in a temporary Event Store stream, cut into periods** (for example one per day). A period is dropped whole once every machine has fetched it and every message in it has a disposition from its receiver, and the body retention has passed (`record.bodyRetentionSec`, the same rule as on one machine).
- MAIL still uses no transport of its own: the temporary stream is an Event Store feature, and MAIL is only a consumer of it.

**Prerequisite.** The ES lane builds "a temporary stream, dropped by period" (the fallback that Event Store §15.2 mentions, "a separate stream per period, dropped once every machine has fetched it", which is not verified yet). If ES cannot build it, the owner revisits this choice. The interim fallback is A (small bodies inline, with a tight cap, stored forever), with that consequence stated plainly.

**Rejected:** A (bodies stay forever), C (gateway as the body carrier, which stays the later upgrade path; see Q-X2), and D (no cross-machine bodies).

### Q-X2. Does MAIL ask the Event Store for an on-demand trigger before delivery?

**What is happening.** Without a trigger, a remote message waits for the sender's cadence to publish and then the receiver's cadence to fetch: up to 300 s each while fgOS runs, unbounded otherwise.

**Cause.** Event Store section 14 has only the explicit `sync` (seal, fetch, reconcile, push, all under `event-seal`) and the opportunistic check. It has no publish-only door, and the hook may never call either.

**Options.**

- **(a) Cadence only.** Zero cost. Latency is the sum of both sides' cadences.
- **(b) Publish on send.** `send` to a remote address calls an Event Store door with `try` on `event-seal`, after the append and outside the mailbox mutex. This removes the sender-side wait. Harm: `send` takes seconds of network time (a counter-ref push measured 2.5-3 s, Identity section 4a, which is a different operation). Cost: a request to ES for the door, plus about 20 lines in MAIL.
- **(c) (b) plus a receiver-side fetch trigger from `fgos mailbox inbox`.** This helps a recipient that is pulling. Harm: `inbox` becomes a network call. It never applies to the hook.

**Recommendation.** (b). The sender is the party that chose to send now. The receiver keeps ES's cadence, which no MAIL rule may shorten from a hook.

**Scope of the answer.** A yes authorizes MAIL to request the door from the ES lane. ES decides its form and locks. It does not authorize MAIL to run git or to sync from a hook.

**Owner direction 2026-10-23 12:35.** For now the owner accepts the latency of the Git and Event Store path, which is several minutes. When delivery has to be faster, the candidate is **the gateway** (`fgos-gateway`) as the fast path. It is recorded as the swap trigger of 15.2.5 and is not built now. Q-X2 (publish right after `send`) is still open, as the cheap way to cut latency while the transport stays the Event Store.

### Q-X3. Which cross-machine policies are enforced per machine and which globally?

**What is happening.** Section 5.3's limits assume one snapshot. Across machines no process sees every count before a sync.

**Cause.** The analysis in 15.2.7: every count a policy needs is complete on either the sender's or the receiver's machine, except a project-wide rate.

**Options.**

- **(a) Placement as in 15.2.7.** Budgets, lifetime caps, loop guard and depth on the sender. Wake quota, queue, TTL, collapse and bounded deferral on the receiver. No global policy. Cost: inside the X3 rung.
- **(b) (a) plus a project-wide rate per sender machine,** computed from the fetched view. Harm: it lags by a sync and refuses late. It adds a number and a view query.
- **(c) Global counts for everything.** This needs a coordinator or a consensus protocol, which neither MAIL nor the Event Store has (Event Store section 12).

**Recommendation.** (a). Signatures (15.2.4) close the forged-sender case that a global rate would otherwise target.

**Scope of the answer.** A yes fixes the placement and the bounded-deferral rule, and authorizes the proposed keys `mailbox.remote.collapseWindowSec` and `mailbox.remote.maxDeferredPerSender` with their values set from X6. It does not authorize any global counter.

### Q-X4. (settled, no owner question)

Agreed with the IDENT lead on 2026-10-23: the mailbox hook registers its head through IDENT's `register_current`, and only when the head's own handle does not resolve. See section 15.2.3. This needs no owner decision, because the registration rule stays in Identity.


## Review by the IDENT lead (2026-10-23, `claude-5v7u@fg-server`)

- No overlap or contradiction with Identity.
- A head keyed by pid (agy, later) takes Identity's local id `pid-<24 hex>` from `register_current` / `session()`. `resolve` never accepts or exposes a raw pid. A pid → local-id library call is added only once there is a caller.
- `mailbox.remote.enabled` depends on an Identity query "signing is available in this build", which I5 will expose.
- The Event Store gaps (Rust `rebuildModule`, the undefined "tell the consumers" step) also block IDENT I4. They are raised with ES as a need of two consumers (board log 12:30 and 12:45).

## Trust in a machine's first key (settled 2026-10-24)

The owner chose B on 2026-10-24 09:59, and IDENT landed it as `179b917bf`.
- **In Identity:** each pin has a state, `Seen` or `Confirmed`. The owner moves a machine to `Confirmed` with `fgos identity pins --confirm <machine-id> --fingerprint <fp>`, after comparing fingerprints; `--forget` moves it back to `Seen`. `Verified.state` carries the state, and this machine's own key always verifies as `Confirmed`.
- **In MAIL:** only one boolean is proposed, `mailbox.remote.requireConfirmed`. When it is on, MAIL ingests remote mail only if `Verified.state == Confirmed`. MAIL keeps no list of its own, so Identity remains the only authority on which machines are trusted.
- **Rejected:** a MAIL-side allowlist of machine handles (`mailbox.remote.allowMachines`). It would make two authorities for the same decision.
