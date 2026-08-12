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
> `fgos-coding-exploring` cho `tsk-38t`... §1 tự ghi nhận 'Đây là thu hẹp thật so
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

## The backfill migration (D4) needed two retries before it verified clean

`tsk-38t-3` wrote `scripts/backfill-status-category.mjs`, the real migration
script for the ~1500+ pre-existing `work.move` events described above under
"Frozen at write time, never derived on read." Its own capture recorded two
`verify-miss` frictions in a row (`goal-check failed on branch
"fgw/tsk-38t-3" (exit 1)`) before it finally verified clean — consistent
with D4's own bar being real replay-from-zero correctness (`test -f
scripts/backfill-status-category.mjs && node --test
test/scripts/backfill-status-category.test.mjs`), not a superficial
presence check. Landed `awaiting-approval`, ahead by 1 commit.

## Consumer migration closed the `RESOLVED_STATUSES` gap the audit flagged

`tsk-38t-4` migrated `src/state/frontier.mjs`'s `RESOLVED_STATUSES` set —
the single spot `docs/decisions/0027`'s own audit flagged as riskiest,
because it mixed the four fixed tail statuses with `wontfix` (a
front-segment, domain-owned label that only happens to always map to
`canceled`) in one hand-written `Set`. Scoped to `frontier.mjs` itself
(the footprint this child task declared), verified with the plain
regression bar (`npm test`) rather than a narrower behavioral assertion —
downstream consumers of `RESOLVED_STATUSES` (`graph-metrics.mjs`,
`graph-harness.mjs`, `drift-status.mjs`, `impact.mjs`, `claim-port.mjs`,
per the audit) inherit the fix automatically since they only call
`.has()` on the same set rather than re-implementing the literal-string
check themselves. Landed `awaiting-approval`, first attempt, ahead by 1
commit, no friction recorded.

## The `skillMap.retrospective` key (D5) is what `/fgOS:retro-next` reads today

`tsk-38t-5` added the `retrospective` key to each domain's `skillMap` in
`src/state/workflow-stage-graphs.mjs` — the concrete mechanism D5 promised
above ("Khác biệt per-domain ở bước `retrospective` nằm ở SKILL nào chạy").
This is not a hypothetical: `/fgOS:retro-next`'s own step 4 (the skill that
produced this very document) resolves which synthesis skill to run for a
given item by reading exactly this key —
`skillForStage(getDomain(item.domain), 'retrospective') ?? 'fgos-coding-compounding'`
— with the `?? 'fgos-coding-compounding'` fallback matching `skillForStage`'s own
null-safe shape one level up. For `coding` today this always resolves back
to `fgos-coding-compounding` itself, zero behavior change from before the lookup
existed — the field's purpose is to give a second domain somewhere to
plug in a different synthesis skill without `retro-next` needing an
if/else keyed on domain name. Landed `awaiting-approval`, first attempt,
ahead by 2 commits, no friction recorded.

## `domainFields` (D6) landed as a thin, narrowly-verified addition

`tsk-38t-6` added the `domainFields` field itself to `src/state/store.mjs`
and `src/state/work.mjs`, matching the whole-object-overwrite,
optional-`fieldSchema`-validated shape D6 describes above. Its own verify
was a single presence grep (`grep -q "'domainFields'" src/state/store.mjs`)
— proportionate to the task's own footprint (two files, one new optional
field with no existing consumer yet to break) rather than a full
behavioral suite, since nothing in the coding domain reads or writes
`domainFields` yet. Landed `awaiting-approval`, first attempt, ahead by 2
commits, no friction recorded.

## The fixture domain proving the design (`tsk-38t-7`), last child to land

`tsk-38t-7` is the task that actually registered the disposable fixture
domain mentioned above under "What this design deliberately did not
solve" — its own verify imports `DOMAINS` and asserts at least one
registered domain key beyond `coding`/`synthetic`/`triage` exists with a
non-empty `transitions` list, plus a matching
`test/e2e/synthetic-domain.test.mjs` suite, before falling back to the
plain `npm test` regression bar. Depended on all five other child tasks
(`tsk-38t-2` through `tsk-38t-6`) landing first, since it exercises the
schema field, the backfill, the consumer migration, the `skillMap` key,
and `domainFields` together through one real second domain rather than
testing any of them in isolation. Landed `awaiting-approval`, first
attempt, ahead by 1 commit, no friction recorded — the last of `tsk-38t`'s
eight child tasks to close.

## The `herdr-plugin` literal-status dependency, later actually removed — once new evidence existed

`tsk-4ot`'s own conclusion above was correct *at the time it was made* —
no field existed that could separate `doing` from `blocked`/
`awaiting-human` without the literal status strings, so keeping the
literal match and pinning it with a regression test was the right call
then. `tsk-48i` reversed that decision later, but only because the
premise it rested on had genuinely changed: `parkReasonForStatus`
(`src/state/workflow-stage-graphs.mjs:409`, built by a separate item,
`tsk-3w3`) landed on `main` in the meantime — a domain-owned table that
makes exactly the distinction that was missing before. `tsk-48i`'s own
scope note names this explicitly as a reversal-on-new-evidence, not a
second-guess:

> "tsk-4ot (delivered) scoped a prior attempt at this same risk to
> Rust-only and concluded no safe fix was possible then, because no field
> existed that could distinguish `doing` from `blocked`/`awaiting-human`
> without the literal strings... Since then, `parkReasonForStatus`...
> landed on `main` — a domain-owned table that makes exactly this
> distinction. This item exposes that table through the public JSON
> contract and switches `fgos.rs` to consume it, finally removing the
> literal-status dependency tsk-4ot could only document and pin."

The new field, `parkReason`, is stamped at write time exactly like
`statusCategory` already is (`addWork`/`moveWork`) — reusing the existing
domain-agnostic table byte for byte rather than inventing a herdr-specific
derived field, the same DRY precedent `statusCategory` itself set. It
takes one of three values (`"system-error"` for `blocked`,
`"human-question"` for `awaiting-human`, `"natural-finish"` for
`awaiting-approval`) or is absent for every other status, including
`doing` itself.

A first implementation pass of the new Rust-side filter (`parkReason`
absent or `"natural-finish"`) regressed a different existing test
(`parse_doing_excludes_done_items`), because `parkReason` is *also* absent
for `todo`/`done`/`wontfix`/`delivered`/`retrospective`/`cleanup` — not
just `doing` — since `parkReasonForStatus`'s table only declares entries
for the three park states. The fix combined `parkReason` with
`statusCategory` (both already-public, write-time-stamped fields) rather
than re-introducing any literal `status` check, verified case by case
against every one of the ten statuses to reproduce the pre-change
membership byte-for-byte. The item's own verify-writing process needed
five rounds of correction to land on a grep that actually proved this (a
free-word match colliding with the unrelated function name
`parkReasonForStatus`; a wrong test-file target testing only internal
store state instead of the public CLI JSON surface; a binary path
resolving against the main checkout instead of the branch's own code) —
the same category of trap `docs/how-to/write-verify-for-a-skill-prose-
change.md` catalogs for skill-prose verify, showing up here for a Rust
consumer's verify instead.

## The stale triage-table doc gap (`tsk-38t-8`) — independent of the category decision

`tsk-38t-8` fixed `docs/reference/triage-table-columns.md`, which
`docs/decisions/0027`'s audit flagged as listing only 7 of the 10 real
statuses (missing `delivered`/`retrospective`/`cleanup`). This gap was
explicitly independent of how the category design landed — it existed
before this feature and would have needed fixing regardless of which way
the front/tail segment boundary was drawn, so it shipped as its own
zero-dependency child task rather than being folded into the schema or
consumer-migration work. Landed `awaiting-approval`, first attempt, ahead
by 1 commit, no friction recorded.

## The `herdr-plugin` gap the audit flagged, resolved by pinning the current behavior rather than migrating it

`tsk-4ot`, a later independent bug item (not one of `tsk-38t`'s own eight
children, but a direct follow-on from the consumer-migration backlog item
`docs/decisions/0027`'s audit named), decided what to do about
`herdr-plugin/src/fgos.rs` — the Rust process, outside the Node runtime
entirely, that filters `fgos list --all --json` on literal
`status == "doing" || status == "awaiting-approval"` to build its
in-process pane. The tempting "fix" would be to swap that literal match for
`statusCategory` to match the rest of the migrated consumers — but this
item's own scout evidence proves that would be a regression, not a fix:
`doing`, `blocked`, and `awaiting-human` all collapse into the same
`in-progress` category (confirmed live: `tsk-64s` at `doing`, `tsk-42i` at
`blocked`, `tsk-5ui` at `awaiting-human` all report `statusCategory:
in-progress`), so a category-based filter would wrongly start showing
blocked and awaiting-human items as "in process."

> "D3: ... no Rust-only code change can remove the literal-status
> dependency without regressing pane membership... Resolution: keep the
> literal `status == "doing" || status == "awaiting-approval"` match — it
> is provably correct today, since `coding` is the only domain and decision
> record 0027 D1 gives domains the *right*, never the *obligation*, to
> relabel their six front-segment statuses. Add a regression test in
> `fgos.rs` that pins this exact literal-match behavior, so the crate's own
> test suite fails loudly if a future change swaps to a bare
> `statusCategory` filter (the naive, incorrect 'fix')."

`tsk-1hb`, the item that actually implemented D4's combined-predicate fix
above, needed a `--force` override past its own second-pass verify judge
during clarify — the same override mechanism `tsk-5cf` added for exactly
this shape of failure. The judge's objections were internally
contradictory round to round: round 3 wanted a `grep`-based proof, round
4 then demanded the `cargo test` command itself somehow prove exhaustive
`parkReason`-value coverage and complete literal-match removal — an
open-ended bar no single shell command can express, the same
"contradictory round-to-round criteria" pattern already documented and
accepted an override for. `tsk-1hb`'s own D2/D3 already deterministically
specified the required behavior; the judge's escalating demands were
re-litigating settled scope, not surfacing a real gap.

The lesson generalizes beyond this one crate: `statusCategory` is a
lossy compression by design (see "Frozen at write time" above) — collapsing
three distinct front-segment statuses into one category was an accepted,
deliberate trade-off for the domain-agnostic mechanisms that only need the
coarse bucket, not a promise that category alone is always sufficient. A
consumer that genuinely needs to distinguish `doing` from `blocked` from
`awaiting-human` — this pane, and `fgos-coding-driving`'s own stop-condition
check per the deferred `parkReasonForStatus` proposal — has to keep reading
literal `status`, category migration or not. Landed `awaiting-approval`,
first attempt, ahead by 2 commits — settlement history shows a real risk
classification back-and-forth (heavy at intake vs. tiny after scoping to a
single Rust test file), resolved by a human confirming the narrower tiny
scope across two separate rounds.

---

**Source:** `docs/history/phase-2-status-category-schema/CONTEXT.md` and
`DISCUSSION.md` (tsk-38t, D1-D6, settled 2026-08-04 via a 12-round
`fgos-coding-shaping` session); work-item capture via `fgos check tsk-38t`
and `fgos check tsk-38t-1`; `docs/decisions/0027-domain-so-huu-status-
doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`.
