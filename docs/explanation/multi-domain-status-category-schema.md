---
type: explanation
title: Why status splits into status + statusCategory only for the front segment of the lifecycle
tags: [work-item, status, statusCategory, domain-model, multi-domain]
timestamp: 2026-08-04T00:00:00.000Z
source_capture_ids: [tsk-38t]
---

# Why status splits into status + statusCategory only for the front segment of the lifecycle

A non-coding domain (the motivating case: marketing) wants its own status
vocabulary — "awaiting client sign-off" reads better than `awaiting-human`
for a person who never touches git. But `fgOS`'s domain-agnostic machinery
(frontier, rollup, compound-learn, outcome/friction, discovery-judge) all
read `status` directly, and a domain that renamed it out from under them
would silently break every one. The fix landed on a second field,
`statusCategory` — a small, fixed set of coarse buckets, frozen onto the
event at write time, that a domain-agnostic reader can consume without
learning any domain's own vocabulary.

## The split only covers half the lifecycle, on purpose

The six decisions this design settled on:

> "Domain-specific status vocabulary chỉ áp dụng cho đoạn TRƯỚC `delivered`.
> Chuỗi `delivered→retrospective→cleanup→done` cố định, dùng chung tên y
> hệt mọi domain — khác biệt per-domain ở bước `retrospective` nằm ở SKILL
> nào chạy (mở rộng `skillMap` per-domain đã có), không phải tên status."
> (D1)

That line draws the actual boundary: a domain gets to relabel `todo`/
`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`wontfix` — the
*front segment*, where a domain's own work actually happens — but the
*tail segment* (`delivered`/`retrospective`/`cleanup`/`done`) stays one
shared vocabulary for every domain, forever. The reasoning: the tail
segment isn't where domain-specific meaning lives — it's fgOS's own
close-out ceremony (synthesis, harness cleanup, terminal state), identical
regardless of what kind of work item it is. Where domains genuinely do
differ inside that tail is *which skill* runs the retrospective synthesis
— already expressible through the existing per-domain `skillMap`, so no
new field was needed there (D5).

`wontfix` — coding's own synonym for "declined, out of scope" — keeps its
literal name (0 migration for existing coding items) but always maps to
the shared category `canceled`:

> "`wontfix` ở lại đoạn đầu (domain-owned label — coding giữ nguyên chữ, 0
> migration), map cố định vào `statusCategory: 'canceled'`." (D2)

The concrete map settled on:

> "Bảng map 6 status đoạn đầu → `statusCategory`: `todo→todo`,
> `doing/blocked/awaiting-human→in-progress`, `awaiting-approval→review`,
> `wontfix→canceled`." (D3)

The bar for adding a *new* top-level category, rather than folding into an
existing one, came from an earlier precedent this design deliberately
reused rather than re-litigating: a status only earns its own category
when it has a distinct structural effect on the frontier or dependency
graph — otherwise it collapses into an existing bucket and lets `reason`/
`ask`/`answer` carry whatever finer distinction remains. That's why
`doing`, `blocked`, and `awaiting-human` — three states that read very
differently to a person — all collapse into one `in-progress` category:
none of the three has a distinct effect on `frontier.mjs`'s own `ready`
filter or `RESOLVED_STATUSES` today.

## Frozen at write time, never derived on read

`statusCategory` is stamped onto the event payload once, at the moment
`status` moves — never recomputed later by re-reading the domain registry.
That's a direct consequence of fgOS's own replay-from-zero invariant: the
state view has to be exactly reproducible by rebuilding from the event log
alone, so a value that depends on "whatever the domain registry says
today" would make an old event's meaning drift if the registry ever
changed later. The corollary this design accepted is that ~1500+ existing
`work.move` events, written before `statusCategory` existed, needed a real
backfill migration rather than a lazy default:

> "Backfill `statusCategory` cho ~1500+ event `work.move` cũ qua 1
> migration script mới ... KHÔNG lazy-default, vì L3 (luật khoá) đòi hỏi
> replay-from-zero xác định tuyệt đối." (D4)

## `domainFields` follows the same "additive, not a redesign" shape

Alongside the status split, an optional `domainFields: { [domainName]:
{...} }` was added — a place for a domain's own bespoke data (a
marketing item's `campaign`/`budget`, say) that whole-object-overwrites on
each edit and validates against an optional `fieldSchema` a domain can
declare in its own registry entry:

> "`domainFields` chốt nguyên theo thiết kế report gốc (distill) — field
> optional `domainFields: { [domainName]: {...} }`, ghi đè toàn object mỗi
> lần edit, validate qua optional `fieldSchema` khai trong `DOMAINS[domain]`."
> (D6)

Whole-object overwrite (not a deep merge) matches the same latest-wins
convention `--refs`/`--deps`/`--acceptance` already used elsewhere in the
CLI — a second field with different merge semantics from its neighbors
would have been its own inconsistency to explain later.

## What this design deliberately did not solve

The scope was drawn narrowly enough to leave real, known gaps for later,
rather than trying to generalize ahead of a second real consumer:

- **`kind` stays free text.** A parallel `kindCategory` (mirroring
  `statusCategory`) was explicitly out of scope for this pass — `kind`
  doesn't participate in any transition or gate today, so there was no
  forcing function to generalize it yet.
- **No non-coding domain exists to prove this against end to end.** The
  design shipped with `coding` keeping 100% of its existing literal labels
  (zero migration, zero behavior change) and a disposable fixture domain
  (`fixture-marketing`) built specifically to exercise the new fields
  through the real store — not a live product domain. Whether the six
  fixed categories, or the front/tail segment boundary itself, survive
  contact with a real second domain is still unproven.
- **`fgos-coding-driving`'s own stop-condition check was *not* migrated to
  `statusCategory`**, despite an earlier plan recommending exactly that.
  `blocked` and `awaiting-human` both collapse into the same
  `in-progress` category, but the driving loop has to tell them apart (a
  system-detected failure vs. a person's open question, reported
  differently to the caller) — reading the coarser category would erase
  the distinction the loop actually needs. That gap was closed separately
  with a narrower, purpose-built lookup (`parkReasonForStatus`) rather than
  by reusing `statusCategory` for a question it was never meant to answer.

## Outcome

Landed as `awaiting-approval`, first attempt, ahead by 36 commits — split
into 8 real child tasks (schema fields, backfill migration, skillMap
retrospective key, domainFields/fieldSchema, a decision record superseding
base-workflow-model D1-D3, and a second real domain fixture proving the
design generalizes), each merged and verified independently. One
verify-miss was recorded and resolved along the way (goal-check failing on
the item's own branch before the child tasks landed) — expected shape for
a heavy-tier item whose own top-level `verify` was deliberately left as a
minimum regression bar (`npm test`) until the child tasks could each carry
their own narrower, real verify command.

## The decision record itself narrowed the scope it formalizes

`tsk-38t-1`, the child task that wrote the actual decision record
(`docs/decisions/0027-...md`) superseding `base-workflow-model` D1-D3, is a
deliberate act of narrowing, not a direct transcription of the source
research. The record's own "Bối cảnh" section says so explicitly:

> "Bản thân report nguồn (`plans/reports/research-260730-0931-work-item-
> schema-multi-domain-upgrade-report.md`, round 4) ban đầu kết luận
> **"domain sở hữu TOÀN BỘ bảng transition"** — một khung rộng hơn record
> này thật sự chốt. Khung đó đã bị xét lại và THU HẸP trong phiên
> `fgos-exploring` cho `tsk-38t`... §1 tự ghi nhận 'Đây là thu hẹp thật so
> với kết luận round-4 của report gốc... thu hẹp lại đúng phạm vi domain
> thật sự cần tự khai (đoạn đầu vòng đời)'."

In other words: the research phase's own broadest conclusion — a domain
owning the *entire* status transition table — never shipped. What shipped
is the narrower front-segment-only split this document describes above.
The decision record exists specifically so that gap between "what the
research concluded" and "what was actually locked" has one canonical place
to point at, separate from the DISCUSSION.md transcript it was distilled
from.

`tsk-38t-1` also produced a full consumer audit (`docs/decisions/0027`'s
own "Audit" section) enumerating every real reader of `STATUSES`/
`TRANSITIONS`/`RESOLVED_STATUSES` across `src/state/`, `src/runner/`,
`bin/fgos.mjs`, and even one consumer outside the Node runtime entirely
(`herdr-plugin/src/fgos.rs`, a Rust process parsing `fgos list --json`
stdout) — flagging each as needing to move to `statusCategory` or staying
literal-forever per the front/tail boundary. That audit is what let the
later child tasks (`statusCategory` schema, backfill migration,
consumer-migration) proceed without re-discovering the same file list.
Landed clean: `awaiting-approval`, first attempt, ahead by 1 commit, no
friction recorded.

## The schema field itself landed as its own narrow child task

`tsk-38t-2` shipped the `STATUS_CATEGORIES`/`statusCategory` schema field
and domain registry changes (D2/D3) described above as source code, kept
deliberately separate from the decision record (`tsk-38t-1`) and the
backfill migration (a later child) — each landed independently so the
schema's existence, its documentation, and its historical backfill could
each be verified on their own terms rather than as one large, harder-to-
review change. Its own verify was narrow by design: a presence check that
`src/state/work.mjs` exports `STATUS_CATEGORIES` at all, not a behavioral
assertion — the behavioral proof was left to the later consumer-migration
and fixture-domain child tasks. Landed clean: `awaiting-approval`, first
attempt, ahead by 1 commit, no friction recorded.

---

**Source:** `docs/history/phase-2-status-category-schema/CONTEXT.md` and
`DISCUSSION.md` (tsk-38t, D1-D6, settled 2026-08-04 via a 12-round
`fgos-coding-shaping` session); work-item capture via `fgos check tsk-38t`
and `fgos check tsk-38t-1`; `docs/decisions/0027-domain-so-huu-status-
doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`.
