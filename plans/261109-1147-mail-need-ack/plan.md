---
title: "Mailbox: sender-requested acknowledgement (--need-ack, --reply-by)"
description: "A sender marks a message as needing an acknowledgement; the receiver is told to reply in one line; past reply-by the sender gets one notice and status lists it, same machine and across machines."
status: pending
priority: P2
effort: 7d
branch: main
tags: [mailbox, cross-machine, payload, ack]
created: 2026-11-09
---

# Mailbox: sender-requested acknowledgement

Date 2026-11-09. Lane MAIL. Plan only, no code; for owner approval. Owner idea 2026-11-09.
Spec `docs/platform/agent-mailbox/spec.md` is frozen: this plan edits no doc; the spec lines a spec owner
must update are listed at the end.

## Outcome

- `fgos mailbox send --to X --need-ack [--reply-by <dur>] "…"`. A send without the flag is unchanged, byte for byte
  (frame, report, payload).
- A flagged message's frame swaps its last reply sentence for: the sender needs to know you have taken this in
  within N min; reply in one line even with nothing to add ("read, nothing to add" is enough), with the exact
  `fgos mailbox send --to … --reply-to <id> "…"` command.
- A reply that names `--reply-to <id>` (or is the derived reply, spec §5.4) marks the original acknowledged.
- An acknowledgement asks for nothing back: `--need-ack` on a reply to a flagged message is refused (no ack ping-pong).
- Past reply-by with no acknowledgement: the sender's head gets one notice ("remind once"); if an earlier
  reminder to the same recipient also went unanswered, the notice says "do not send again; ask your user as a
  decision question" (spec §15.1 escalation). `fgos mailbox status` lists awaiting / acknowledged / overdue.
- Works across machines (fg-server2, fg-server, design-lap) through one optional signed payload field.

## Non-goals

`handled` state, `held`/`approve`, the compaction pin (spec §15.1 bullets 2 and 4), automatic reminders sent by
the system, a delivery daemon, a new Event Store type, acknowledgement of a cross-machine message by a reply that
does not name `--reply-to` (cross-machine mail has no derived chain today, `remote.rs:246`).

## Prior art (re-verified, reused; nothing rebuilt)

| Found | Where | Use |
|---|---|---|
| `Header.answered`: "the recipient has replied", set on the derived parent at `send` | `core/src/envelope.rs:81-82`, `core/src/delivery.rs:483-489` | **is** `acked` on the receiver's side (spec §15.1 "a reply counts"); no new state |
| Derived parent = latest offered unanswered msg from Y to X within `loop.windowSec` | `core/src/policy.rs:262-287` | unchanged |
| `--reply-to` hint, validated as offered to the sender's current generation (check 4) | `core/src/policy.rs:198-220`; parsed `apps/fgos/src/wiring/mailbox_verbs.rs:135` | gap: a valid hint does **not** mark its message answered; fixed in P1 |
| Status "offered and never answered: N of M" | `store/src/verbs.rs:459-462, 520-522` | kept; the ack lines sit beside it |
| Notice lane (refused-message notices, cap, one per (sender, reason) per window) | `core/src/notices.rs:26-39, 77`, `core/src/sweep.rs:171-193` | reused for the overdue notice |
| Optional signed payload flag precedent: `wake` (v2) and v3 | `apps/fgos/src/wiring/mailbox_remote.rs:144-177`; contract `packages/mailbox/contracts/remote.v1.json` `wakeVersion`/`bodyRefVersion` | payload decision below |
| Receiver shape check reads named fields only, no unknown-field refusal | `apps/fgos/src/wiring/mailbox_ingest.rs:114-157` | an older receiver takes an extra signed field and ignores it |
| Cross-machine reply link: payload `reply_to` is written (`mailbox_remote.rs:170-172`) but carries the **receiver-local** id (raw `--reply-to`, `mailbox_verbs.rs:621`) and no receiver reads it (`remote.rs:246` sets `reply_to: None`) | | gap: P3 translates it to the sender's id; P5 reads it |
| Sender-side fold of own sends + verified settlements | `mailbox_remote.rs:317-418` (`sent_summary`) | extended for the ack column |
| Snapshot compat by optional field + `skip_serializing_if` (no version bump) | `envelope.rs:73-74` (`body_rendered_bytes`); version rule `core/src/state.rs:9-34` | same pattern |
| `git log -S reply_by / acked / need-ack` in mailbox code | only spec commits (`6b5e5119e` draft with `acked`/`handled`/`expired` states and an `ack` verb, narrowed out in `c951985bc`); no code ever existed | design here is smaller than the draft: no `ack` verb, no new state |

## Key decisions (recommended; owner may override in the questions)

1. **Acknowledged = answered.** Receiver side reuses `Header.answered`; P1 adds: a validated `--reply-to` hint also
   marks its message answered. Side effect on unflagged mail: that message stops being a derived-parent candidate
   and leaves the "never answered" count, which is more correct, not a contract break.
2. **Sender side = one bounded list `ack_watch` in the snapshot** `{id, from, from_generation, to_label,
   to_machine: Option, due, acked, overdue}`. One method `mark_acked(id, from_machine)`, two callers (local `send`,
   remote ingest). Local watches are judged by the lazy sweep; remote watches only by the sync child.
3. **Deadline.** `--reply-by` is a duration (`90s`, `30m`, `2h`). Default from one new key
   `mailbox.ack.replyBySec` (placeholder 3600, reader `core`). Bounds derived from existing keys, no new key:
   local min `mailbox.inFlightTtlSec`, max `header_horizon_sec()` (`core/src/limits.rs:33-38`, 1 day) so the header
   outlives its deadline; cross-machine min `eventStore.sync.intervalSec + mailbox.remote.clockSkewSec`, max
   `mailbox.remote.maxAgeSec`. Out of range is a usage error (exit usage, not counted). `--reply-by` without
   `--need-ack` is a usage error.
4. **Clock.** Local: the record clock. Cross-machine: the sender's clock only, and a remote watch turns overdue only
   at a sync whose event fetch **started** after `due + clockSkewSec` and succeeded (same rule as the body
   "expired" verdict, `remote.v1.json` receiverStates). A reply fetched later still flips it to "acknowledged late".
   This meets the council condition (spec line 654): no false dead letter from fetch lag.
5. **Payload: optional signed field `ackWithinSec` (integer) in every existing version, under that version's
   domain; no v4, no new domain.** Reasons: all three machines send v3 since 2026-11-09 (body plan step 4); the
   signature already covers every field (`signed_bytes` over the whole unsigned payload,
   `mailbox_ingest.rs:168-179`), so the field cannot be added or stripped in transit. An older receiver takes the
   message and shows the plain frame (verified by reading its shape check, `mailbox_ingest.rs:114-157`): the
   content arrives, only the ack line is missing, so the worst case is a sender overdue notice. A v4 would make an
   older receiver drop the whole message as `remote-malformed` (the wake precedent) and still produce the overdue
   notice: strictly worse. A new receiver validates the field (integer, 1..=maxAgeSec) and drops a bad one as
   `remote-malformed`. Payload `reply_to` is redefined (contract text) as the **sender machine's** message id.
6. **No loops.** The ack reply is unflagged and renders the normal frame ("do not reply just to acknowledge it",
   `frame.v1.txt` `[message.reply]`). `--need-ack` on a send whose derived parent or hint was itself flagged is
   refused: new core refusal `ack-on-ack`, check 4b (after check 4), one new `CounterReason`.
7. **Escalation is mechanical, not model memory.** When a watch goes overdue the core picks the notice wording:
   `notice.reason.ack-overdue` ("remind once") or, if a retained watch from the same sender to the same recipient
   already went overdue, `notice.reason.ack-overdue-again` ("do not send again; ask your user, decision question").
   `Notice.reason` becomes a `NoticeReason` enum `{record-ttl, offer-cap, ack-overdue, ack-overdue-again}` with the
   same serde names for the first two (snapshot compatible). A suppressed notice (cap/window) still shows in status.
8. **No new config switch for cross-machine.** The receiver-first order (P3, then P4 on all three machines, then P5)
   is the gate, as for bodies. `fgos mailbox status` prints "this machine takes acknowledgement requests" beside
   the payload-version line.

## Data flow

Same machine: `send --need-ack` → core `send` (check 4b) → Header{ack_within_sec} + AckWatch(due) → hook claim →
frame with `[message.reply.ack]` → receiver `send --reply-to id` → `answered=true` on header, `mark_acked` on watch →
status. No reply: lazy sweep at `due` → overdue notice to sender's current generation → sender's next hook.

Cross-machine: sender `send --need-ack` → `admit_remote` records AckWatch{to_machine} → payload `ackWithinSec` signed →
receiver ingest validates → Header{ack_within_sec} → frame → receiver `send --reply-to <local id>` → host maps local
id to `origin.id`, marks local header answered → payload `reply_to=<sender id>` → sender's sync ingest verifies the
reply (existing path) → `mark_acked(reply_to, signer machine)` → sync judge after fetch → status / notice.

## Phases (each lands alone, in this order)

| # | Phase | Depends on | Parallel with | Budget (with review) |
|---|---|---|---|---|
| P1 | Core: ack model, sweep, frame sections, config key | — | — | 1.5 d |
| P2 | Same-machine verbs, report, status, help, CHANGELOG | P1 | P3 | 1 d |
| P3 | Receiver across machines + reply-id translation | P1 | P2 | 1 d |
| P4 | Upgrade all three receivers | P2, P3 on main | — | 0.5 d work (+ waiting on RULE, LAND) |
| P5 | Sender across machines: payload field, remote watch, sync judge, status | P4 done on 3 machines | — | 1.5 d |
| P6 | Proof on two machines + behaviour check of the new frame line | P5 on 2 machines | — | 1 d |

Total 6.5 d of work, about 7 d with waiting. The plan stops after any phase if OPC or ES finds a problem.

### P1 Core (`fgos-mailbox-core`, contracts, Config)

Files: `packages/mailbox/rust/core/src/{envelope.rs, delivery.rs, policy.rs, sweep.rs, notices.rs, frame.rs,
counters.rs, report.rs, state.rs, limits.rs}`, `packages/mailbox/contracts/{frame.v1.txt, limits.v1.json}`,
`core/config-schema/mailbox.schema.yaml`, `core/config-standard/mailbox.yaml`, store fixture
`packages/mailbox/rust/store/src/record/snapshot.rs` only if its fixture lists fields.
Steps: `SendRequest.need_ack: Option<u64>`; `Header.ack_within_sec: Option<u64>` (default, skip None);
`MailboxState.ack_watch` (default, skip empty; bounded: retire `acked`/`overdue` watches after header horizon,
cap by `counters.maxKeys`); hint marks answered + `mark_acked`; check 4b `ack-on-ack`; sweep turns due local watches
overdue and notifies; `NoticeReason`; frame sections `[message.reply.ack]` (reuses `{{from}} {{id}} {{count}}` =
minutes), `[notice.reason.ack-overdue]`, `[notice.reason.ack-overdue-again]`, `[report.ack]`; `bounded_len` measures
the longer reply line.
Tests (owning proofs, extend existing files): `core/tests/delivery.rs` one test "a flagged message is acknowledged by
the derived reply or by a reply that names it, and a hint now marks its message answered"; `core/tests/sweep.rs`
"an unacknowledged flagged message notifies its sender once at its deadline, and a second overdue to the same
recipient asks for the user"; `core/tests/policies.rs` add the `ack-on-ack` row to the check-order table; `core/tests/
frame.rs` "a flagged frame ends with the ack line and an unflagged frame is byte-identical"; `core/tests/snapshot.rs`
"a snapshot without ack fields loads and writes back unchanged". Contract tests: `limits_contract` (core + store).
Gates: fmt, clippy `-D warnings`, msvc check, aarch64-apple-darwin check, census scan, `cargo test -p fgos-config`,
`cargo test -p fgos-mailbox-core`, `cargo test -p fgos-mailbox --test limits_contract --test fixtures_contract`.
Review: MAIL lead; OPC only if the census flags a new door.

### P2 Same-machine verbs (host + store)

Files: `apps/fgos/src/wiring/mailbox_verbs.rs` (flags `--need-ack`, `--reply-by`, duration parse, bounds, usage
errors; remote branch refuses `--need-ack` with "not across machines yet" until P5), `apps/fgos/src/wiring/
mailbox_surface.rs` (help/descriptor), `packages/mailbox/rust/store/src/verbs.rs` (report line, status JSON
`ack: {awaiting, acked, overdue, overdueIds}` + text line), `CHANGELOG.md` `[Unreleased]`.
Tests: `apps/fgos/tests/mailbox_routes.rs` one wiring proof "send --need-ack to a local head shows the ack line in the
receiver's frame, a reply marks it acknowledged in status" (+ usage rows for bad `--reply-by`);
`store/tests/verbs.rs` extend the status test with the ack counts.
Gates: as P1 minus config; `cargo test -p fgos` (mailbox_routes); `npm test` before land (L5).
Review: MAIL lead; OPC (process/verb surface).

### P3 Receiver across machines (parallel with P2; file-disjoint)

Files: `apps/fgos/src/wiring/mailbox_ingest.rs` (`verify` reads/validates `ackWithinSec` in v1–v3, passes it and
`reply_to` into `RemoteMail`), `packages/mailbox/rust/core/src/remote.rs` (`RemoteMail.ack_within_sec`,
`reply_to`; `ingest_remote` sets the header field and calls `mark_acked(reply_to, machine)` before admission; new
`remote_reply_parent(from, gen, hint, to_machine)` = check-4 rule for a cross-machine reply, returns `origin.id`,
marks answered), `apps/fgos/src/wiring/mailbox_remote.rs` (`send` maps `--reply-to` through
`remote_reply_parent`; unknown hint refused `reply-to-not-offered` like local check 4), `packages/mailbox/contracts/
remote.v1.json` (`ackWithinSec` optional in every version; `reply_to` meaning; olderReaders text), status line
"takes acknowledgement requests".
Tests: `mailbox_ingest.rs` unit test (extend `only_a_message_that_passes_every_check…`) "ackWithinSec is taken in
v1–v3 and a malformed one is dropped"; `core/tests/remote.rs` "a verified cross-machine reply naming a watched id marks
it acknowledged once, only from the machine it went to"; host contract test
`the_wire_cap_and_signing_domain_equal_the_remote_contract` extended for the field.
Gates: P1 set + `cargo test -p fgos --lib mailbox` + mailbox contract tests. Review: **OPC (payload) and lead:ES
(event payload change without schemaVersion bump, `event-streams.v1.json` stays 1)**.

### P4 Upgrade every receiver

fg-server2 (this machine, MAIL/OPC), fg-server (via lead:RULE), design-lap (via lead:LAND). Each builds/activates a
release containing P2+P3 and prints "takes acknowledgement requests" in `fgos mailbox status`. Record releases on
the board row. Nothing sends a flagged message across machines before all three print it.

### P5 Sender across machines

Files: `mailbox_remote.rs` (`Outgoing.ack_within`, `sent_payload` adds `ackWithinSec`; `SentSummary` ack column),
`packages/mailbox/rust/core/src/policy.rs` (`RemoteSend.ack_within` → `admit_remote` records a remote watch),
`apps/fgos/src/wiring/mailbox_sync.rs` (after ingest: judge remote watches only when this sync's event fetch started
after `due + skew` and succeeded; notify), `mailbox_verbs.rs` (drop the P2 refusal, pass the flag).
Tests: `core/tests/remote.rs` "a remote watch never goes overdue from a stale fetch and goes overdue once after a
fetch that started past its deadline"; host unit test in `mailbox_remote.rs` "a flagged send signs ackWithinSec
under its version's domain and an unflagged send is unchanged".
Gates: P3 set. Review: OPC (payload/process), lead:ES informed.

### P6 Proof

Two machines (fg-server2 → fg-server): ack in time, ack late, no ack → notice, reminder no ack → "ask your user".
Add numbers to the existing cross-machine report. One small behaviour run of the new frame line through the
existing harness (`scripts/lib/mailbox-behaviour-*.mjs`, which hashes `frame.v1.txt`) for Claude Code and Codex:
does the receiver ack, and does the sender stay silent after the ack. Size of that run is an owner question.

## Test matrix

| Behaviour | Owning proof (lowest layer) | Wiring proof |
|---|---|---|
| ack model, hint marks answered, ack-on-ack | core delivery/policies | mailbox_routes (P2) |
| overdue + escalation wording | core sweep | — |
| frame text flagged / unflagged unchanged | core frame | mailbox_routes |
| snapshot compat | core snapshot | — |
| payload field taken/malformed, reply id translation | ingest unit, core remote | host contract test |
| remote overdue only after fresh fetch | core remote | P6 live |

## Risks and rollback

| Risk | L×I | Mitigation |
|---|---|---|
| Downgrade: snapshot structs `deny_unknown_fields` (`state.rs:9-15`); an older binary cannot load a record holding an ack field or the new `CounterReason`/`NoticeReason`; a dev host writing the main checkout's record breaks hooks of the activated release | M×H | fields skipped when empty (old binaries break only while flagged mail is live, ≤ header horizon ≈ 1 d); no live use on a machine before its activation includes P1; rollback is fix-forward, not re-activating an older release; same known limit as `CounterReason` in the body plan |
| A sender upgraded before a receiver: message arrives without the ack line, false overdue | L×M | P4 gate; status capability line; worst case is one notice, content delivered |
| False overdue from sync lag | M×M | decision 4 (fresh-fetch rule + skew) |
| Agents over-ack or ack-loop | L×M | ack-on-ack refusal; existing loop/depth/budget guards; P6 behaviour check |
| Hint-marks-answered changes derived parent choice for unflagged mail | L×L | covered by the P1 delivery test; noted for spec owner |
| Notice cap/window suppresses a second overdue notice | M×L | status lists every overdue watch |
| Frame wording change invalidates earlier behaviour measurements' digest | M×L | unflagged frame byte-identical; P6 measures the new line only |

Rollback per phase: P1/P2/P3/P5 are revert-only commits on main; P3/P5 payload field is optional, so a revert leaves
older/newer receivers interoperable. If flagged mail is live, let watches retire (≤ 1 d) before activating a release
without P1.

## Spec lines for the spec owner (spec frozen; not edited here)

`docs/platform/agent-mailbox/spec.md`: 72 (out-of-scope list: ack and reply_by now in scope, handled/held stay out);
212-219 (envelope table: `ack`/`reply_by` row; line 219 "refused in the first slice"); 231-256 §5.2 (acked is the
`answered` mark, not a new state; line 254 "first slice knows the first two only"); 285 (check order: 4b `ack-on-ack`);
291-293 §5.4 (a validated hint marks its message answered); 297-305 §5.5 (flagged frame line; line 305 example);
333 (verb table: `--need-ack`, `--reply-by`); 461-476 §9 (ack observability, item 10); 497 (compaction row unchanged,
still open); 520 (test list); 534+ §12 (key `mailbox.ack.replyBySec`); 650-657 §15.1 (delivered parts; expiry judged
on `acked`, not `handled`; clock rule); 661 §15.2 (the reply event in the receiver's stream is the receiver-written
ack; no separate `acked` event); decision history §17 (new row). Contracts (code-owned, updated in-phase):
`frame.v1.txt`, `limits.v1.json`, `remote.v1.json`.

## Questions for the owner

1. Approve the six phases and order (receiver first, nothing flagged crosses machines until all three print the
   capability line)?
2. Default reply-by when `--need-ack` has no `--reply-by`: 1 h (placeholder) ok, or require `--reply-by` always?
3. Payload: optional field in the existing versions (recommended, older receiver still delivers the content) vs a v4
   that older receivers drop (the wake precedent)?
4. P6 behaviour run: how many runs and which CLIs (Claude Code + Codex suggested, ~40 runs each)?
5. Who upgrades fg-server and design-lap in P4 (RULE and LAND, as for bodies)?

Note: the cross-machine minimum reads `CrossMachine.sync_interval_sec`, already on the host's config struct
(used at `mailbox_remote.rs:506`); no new door.
