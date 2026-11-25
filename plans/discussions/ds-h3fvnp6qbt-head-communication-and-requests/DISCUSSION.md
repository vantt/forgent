---
id: ds-h3fvnp6qbt
title: "A head that lacks a power or a door can always speak up"
status: open
source:
  - p-nnaksnxtwu
  - p-rchuoa2v3k
  - p-ia2v33b54u
  - p-5igcekysul
  - p-whvn2fgyep
  - p-bifjfd5rix
  - p-wb6rkwpjsg
created: 2026-11-25
---

discussion: open

## Seed

Opened by the secretary (Miu) on the owner's order, 2026-11-25. Owner: Miu and the supervisor are the owner's two hands; if they cannot communicate they cannot ask for the power they need, so they stay stuck and silent.

- **Outcome:** every head has a guaranteed channel to the owner and to a peer head from inside its confinement, a refusal always names its cause, and a head refused for lack of a verb or door can file a request naming the missing grant.
- **Evidence (2026-11-25):** Miu's grant-probe result could not reach the heads-operate lead: `fgos session type` refused `target-not-stuck`; `fgos mailbox send` to the lead's role and handle failed `host-failed` with no reason; a head's mailbox cannot reach the owner (`unknown-name`).
- **Gather, do not add (RUL11):** `p-rchuoa2v3k`, `p-ia2v33b54u`, `p-5igcekysul`, `p-whvn2fgyep`, `p-bifjfd5rix`, `p-wb6rkwpjsg` (settled discussion ds-cfsfcbknl6 covers the owner side of wording and the question door).
- **Read first:** `src/session-host/head-grants.mjs`, `docs/platform/agent-mailbox/spec.md`, `docs/platform/supervision/spec.md` section 1.1.

## 1. Trạng thái hiện tại

Round 4 (2026-11-25 22:46, shaper, owner live in chat). Domain: coding (fgOS platform). Authority: `agent-mailbox` owns the channel; no new component.

**Scope now:** agent to agent only (owner, 22:39). The owner channel (ds-cfsfcbknl6) and the missing-grant request are set aside, to be taken up after.

**Settled this session:** HC-D1 (a channel always exists; the sender lacks the capability to use all of it, so the door must carry the know-how), HC-D2 (fastest available channel first, then step down), HC-D3 (the mailbox carries the content in both scopes, same machine and cross machine). Provisional, one round old: typing into the recipient's pane is the wake layer and types only one labelled wake line, never the message (owner "đồng ý", 22:46).

**Open:** who walks the ladder, `q-hcnhbtf74z` ([Q2](#Q2)); with typing inside the send door it leans to the door, and the shaper asks the owner to confirm. Not verified: the confined send failure's cause (diagnose first in the plan).

## 2. Mục tiêu & đề bài

Agents (heads: secretary, supervisor, lead, planner, shaper) must always be able to reach each other, from inside their confinement, by the fastest channel available for that message, stepping down until one delivers, with the sender always told which channel delivered or why none did. Four cases are distinguished: same machine or cross machine, and same CLI or different CLI. Speed depends on two axes: the transport (same machine: seconds; cross machine: the recipient machine's next Event Store fetch) and the recipient CLI's wake channel (woken, seen at the next tool call, or read on demand). The sender's CLI hardly matters. The mailbox carries every message in both scopes; typing one labelled wake line into an idle recipient's pane is the universal wake on the same machine. This gathers existing rows (RUL11) and widens no head's grants.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Current view | Evidence |
|---|---|---|---|---|
| 1 | Who walks the ladder | open, `q-hcnhbtf74z` ([Q2](#Q2)) | The send door: the mailbox already picks local before remote; adding the typed wake inside it keeps the walk deterministic (HC-D1). | `mailbox_remote.rs` header; HC-D1 |
| 2 | The four cases | provisional | See §6 table. | spec §6.2, §7, §15.2; `mailbox_remote.rs`, `mailbox_sync.rs` |
| 3 | Typed wake line | provisional (owner agreed once) | Only the fixed labelled line, only under the §15.8 rules (idle and empty composer, no dialog, no focus change, one outstanding nudge, fall back on unknown). The door types it, so no head needs `session type` for this. | spec §15.8, §8.1 |
| 4 | Claude Code `SendMessage` as a rung | decided by analysis, report to owner | Not a rung: it has no record, framing or delivery report (K1, spec §7.2), and the typed wake already gives every same-machine CLI a seconds-level wake. | spec §7.2 |
| 5 | Mailbox inside the cage | clear (fix) | Send and read through the request socket so the host writes the record; diagnose today's `host-failed` first. | p-rchuoa2v3k, p-ia2v33b54u |
| 6 | Mail across rotation | clear (fix) | Addressed to the role, follows a rotation, offered once. | p-bifjfd5rix |
| 7 | Every refusal names cause and next step | clear (fix) | No bare `host-failed`. | forwarder.rs:509 |
| 8 | Cross-machine latency | known limit | Recorded, not delivered, until the recipient machine fetches (`eventStore.sync.intervalSec`, 300 s, only while an fgOS process runs there); a faster cross-machine wake is not in scope. | spec §15.2 |
| 9 | agy not drained | known limit | Typed wake plus `inbox` is its path. | spec §7.3 |
| 10 | Spec staleness | fix in the plan | `agent-mailbox/spec.md` header and §15.2 still call cross-machine mail later and built on a branch; code on main has it. | `apps/fgos/src/wiring/mailbox_*.rs` |
| 11 | Shared know-how | provisional | One `_shared` file, short: "send once, read the answer"; the three private copies in the secretary, supervisor and lead skills move into it. | HC-D1 |
| 12 | Owner channel, missing-grant request | deferred (owner 22:39) | Next discussion step after agent-to-agent. | p-wb6rkwpjsg, head_request.rs:1572 |
| 13 | Mailbox head finder beside Identity; latency measurement | out of scope / later | Own rows. | p-5igcekysul, p-whvn2fgyep |

## 4. Quyết định đã chốt

| D-ID | Decision | Date | Basis |
|---|---|---|---|
| HC-D1 | A channel always exists; what fails is the sender's capability to use all of it. The know-how lives in the door and in refusals, not only in each head's skill. | 2026-11-25 | owner 22:18, held through rounds 3-4 |
| HC-D2 | Use the fastest channel available for this message first, then step down to the next; the sender learns which channel delivered or why none did. | 2026-11-25 | owner 22:20, held through rounds 3-4 |
| HC-D3 | Agent to agent, the mailbox carries the message in both scopes: locally on the same machine, through the Event Store across machines (local head always wins). No supervision-event rung. | 2026-11-25 | owner 22:19 (two scopes) and 22:39; scout of `mailbox_remote.rs`; held rounds 3-4 |

## 5. Q&A log

- **2026-11-25 22:10, shaper, round 1.** Scouted the permission table, the forwarder refusal path and `ask_owner`. Finding: the owner door and the unmatched-verb grant request already exist; the peer door (mailbox inside the cage) and reasonless refusals are the real gaps. Parked `q-ng4ojyph5r` (mailbox or queue as the peer door).
- **2026-11-25 22:15, owner (chat).** Asked for the goal and the current state; shaper restated both.
- **2026-11-25 22:17, owner.** Agreed to the six fix steps (mailbox through the socket, grants unchanged, mail by role, sender always knows the result, a guaranteed fallback, a live probe per persona).
- **2026-11-25 22:18, owner.** "luôn có khả năng trao đổi nhưng người gửi không có đủ năng lực để sử dụng hết khả năng." Shaper added step 7: shared know-how, self-teaching refusals, a probe that breaks the mailbox and checks the head falls back.
- **2026-11-25 22:19, owner.** "về trao đổi thực chất chỉ có 2 phạm vi, xuyên máy hoặc cùng máy." Shaper mapped same machine to the mailbox and cross machine to the Event Store.
- **2026-11-25 22:20, owner.** "nguyên tắc là phải sử dụng kênh khả dụng cho kết quả truyền tải nhanh nhất trước, sau đó thử xuống các kênh khác." Supersedes the single-door framing of `q-ng4ojyph5r`; new open point §3 row 1.
- **2026-11-25 22:39, owner.** "thảo luận agent-agent trước. cần phân biệt các case xuyên máy, cùng máy, cùng cli, khác cli." Scope narrowed to agent-to-agent; owner channel (ds-cfsfcbknl6) and the missing-grant request are set aside for now. Scout: cross-machine mail is already built in the mailbox (`apps/fgos/src/wiring/mailbox_remote.rs`, `mailbox_sync.rs`: Event Store stream `project:mailbox`, signed, "recorded" until the recipient machine fetches; "a local head always wins"), so `agent-mailbox/spec.md` §15.2 calling it later is stale. The round-2 rung "supervision event as the cross-machine rung" is withdrawn: the mailbox already covers both scopes. Speed depends on two axes: the transport (same machine or not) and the recipient CLI's wake channel (spec §6.2 tiers push/turn/pull); the sender's CLI matters only where a CLI has its own native peer channel (Claude Code `SendMessage`, out of mailbox policy per K1, spec §7.2).
- **2026-11-25 22:45, owner.** "type in là một phương pháp hiệu quả đặc biệt không được nhắc tới." Scout: typing into the recipient's pane is the one wake channel that works for every CLI in a terminal on the same machine, idle or not, without hooks (p-rchuoa2v3k: mail typed to the lead by `session type` arrives while the confined read fails; `agent-mailbox/spec.md` §7 measured agy woken by a typed line in 19.1 s). The design already exists and was shelved on 2026-10-20 for lack of a consumer: §15.8 typed-signal rules (idle and empty composer only, no open dialog, one short labelled line, no focus change, one outstanding nudge, fall back when unknown). Risks it answers: typed text reaches the model as user input (§8.1 says peer text never carries user authority), it can merge with the owner's half-typed line or answer a dialog, and it cannot cross machines. Today only the supervisor and secretary may type, and only into a session an open supervision event names (`target-not-stuck`).

- **2026-11-25 22:46, owner.** "đồng ý" to the typed wake being one labelled line only, the content staying in the mailbox. Shaper decided by analysis, to report: Claude Code `SendMessage` is not a rung (§3 row 4). HC-D1, HC-D2, HC-D3 minted.

## 6. Thiết kế đã chốt {#design}

Provisional after round 4; HC-D1 to HC-D3 are settled, the typed-wake shape and who walks the ladder are not yet.

A head sends a message once, through its request socket, to the mailbox send door. The door walks the ladder for it (pending Q2): if the recipient is a live head on this machine the message is recorded locally; otherwise it is signed onto the Event Store for the recipient's machine. On the machine that holds the recipient, the fastest wake its CLI allows is used: Claude Code sessions started to accept get a socket push; any other idle recipient in a terminal gets one typed, labelled wake line under the §15.8 rules; otherwise the message is seen at the recipient's next tool call. The sender's answer always names which path was taken (recorded locally and woken, recorded and waiting for the next tool call, recorded for another machine) or the real cause of a refusal.

| Case | Transport | Wake on the recipient's machine | Expected time |
|---|---|---|---|
| Same machine, same CLI | mailbox, local record | CLI push if available, else typed wake line, else next tool call | seconds |
| Same machine, different CLI | mailbox, local record | by the recipient's CLI, same order | seconds |
| Cross machine, same CLI | mailbox via Event Store | after the recipient machine fetches, same order | minutes (sync interval) |
| Cross machine, different CLI | mailbox via Event Store | same as above | minutes |

```mermaid
flowchart TD
  S[Head sends once via request socket] --> L{Recipient a live head on this machine?}
  L -- yes --> R[Record locally]
  L -- no --> E[Sign onto Event Store; recipient machine fetches]
  E --> R2[Recorded on recipient machine]
  R --> W{Recipient idle?}
  R2 --> W
  W -- CLI push available --> P[Socket push]
  W -- idle, rules allow typing --> T[Type one labelled wake line]
  W -- busy or unknown --> N[Seen at next tool call]
  P --> A[Sender told which path]
  T --> A
  N --> A
```

## 7. Danh mục hạng mục / task {#tasks}

Draft only; filled once Q2 is answered.

## Q1 {#Q1}

Which door is the one guaranteed head-to-head channel? Superseded on 2026-11-25 22:20 by the owner's ladder principle (fastest available first, then step down); `q-ng4ojyph5r` superseded by `q-hcnhbtf74z`.

## Q2 {#Q2}

Who walks the ladder: each head by itself, taught by a shared skill and by refusals that name the next rung, or one send door that tries the rungs in order and reports which delivered? Recommended: the door. Five-part form in the question store; id: `q-hcnhbtf74z`.
