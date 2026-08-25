---
authoritative_for: coding domain's role/holder axis, handoff verb, task-spec/skill/knowledge/context ontology, and workflow hierarchy design decisions
---

# Why the coding domain has a role/holder axis and a task-spec ontology

This explains the design behind several pieces that now exist in the coding
domain: the work item's role/holder axis, the `handoff`/`handoff-return`
verbs, the task-spec vs. skill split, and the domain → workflow → item
hierarchy. It grew out of a comparison between fgOS's own coding-domain
dispatch mechanism and `upstreams/marketing-cockpit`'s workflow/task/
process/stage/routing shape, done to find what fgOS should borrow before
building a marketing domain on top of it (tsk-2t9c).

## Role/holder as a third axis on a work item

> D1: Work item có trục thứ ba role/holder; verb handoff bị guard bởi
> roleGraph khai báo per-domain trong DOMAINS; route ngoài graph bị REFUSED
> kèm danh sách edge hợp lệ

Stage and status already tracked *where* an item is in its lifecycle; role/
holder answers a different question — *who* (which role) must act next.
Guarding `handoff` against a per-domain `roleGraph` gives three things at
once: multi-role ping-pong that doesn't need a new work item per bounce,
an illegal route refused with the valid edges named back, and a natural
fine-grained checkpoint per handoff — the same precedent the engine already
had with `ask`/`answer`.

## Two kinds of interaction: call vs. pass

> D4: Handoff hai loại — call (round-trip, bóng về người gửi, 4 reason:
> advise/assist/review/consult, tổng quát hoá ask/answer) và pass (một
> chiều theo stage). Cùng item dùng handoff; khác item/cây dùng signal

A **call** is round-trip: the ball returns to whoever sent it, for one of
four reasons — advise, assist, review, consult (`ask`/`answer` generalized
into this same shape). A **pass** is one-way, moving along the stage axis.
Same-item interaction uses `handoff`; cross-item or cross-tree interaction
uses a signal instead, keeping the two mechanisms from blending.

## Sync vs. async calls, and when holder actually moves

> D8: Async call (park chờ role khác) = handoff event đầy đủ, holder đổi,
> checkpoint đầy đủ. Sync call trong-session (subagent) = KHÔNG đổi
> holder, ghi một event call-summary gọn lúc hoàn thành (reason, callee
> role, outcome ref), không cặp start/end. Guard invariant: holder chỉ
> đổi qua async handoff

The holder axis exists to answer "who must act next across a scheduling
boundary." A synchronous in-session subagent call doesn't change that
answer, so it isn't a real handoff — it gets a single call-summary event at
completion instead of a full start/end pair. Only an async call (parking
for another role) actually moves holder. This is why `fgos-coding-implement`
and its sibling stage skills fire real `handoff`/`handoff-return` calls at
specific points rather than treating every subagent dispatch as a role
change (D14/D15 below).

## Wiring the stage skills to actually call handoff — and the bugs found doing it

Design intent is not the same as an engine guarantee. Two rounds of live
wiring found real gaps:

> D14: fgos-coding-implement wired to actually call handoff/handoff-return
> at 3 points: (1) Orient reclaim... (2) Implement collaboration...
> (3) Return -- CHỈ gọi handoff --to reviewer SAU KHI return/catchup
> thành công (không phải trước) -- self-review bắt lỗi thứ tự thật: gọi
> trước thì item bị return đỏ (blocked) vẫn ghi sai holder=reviewer dù
> chưa ai review

> D15: fgos-coding-discovering/exploring/planning/validating wired to
> actually call handoff/handoff-return, same rigor as D14... Two real
> bugs/gaps found and fixed while wiring for real (not by design review
> alone): (1) roleGraph had ZERO edges at stage discovery... (2)
> shape-plan.md and validate-plan.md task-specs both wrongly listed
> advise(async) rows for triggers that actually resolve live in-session

An independent review (a fresh `code-reviewer` agent, deliberately without
shared context) then found further defects in that wiring:

> D16: ...HIGH#1: fgos-coding-implement's reclaim depended on a status
> re-check that is SKIPPED on the fgos-coding-driving loop path -- never
> ran on the automated path. Fixed generically in fgos-coding-driving
> itself... HIGH#2: review handoff never closed on the approve path --
> holder stuck at reviewer forever on every delivered item. Fixed in
> moveWork (store.mjs): to==='delivered' now loops recordCallReturn
> closing every open frame...

The HIGH#1 fix belongs in `fgos-coding-driving` rather than `fgos-routing`
specifically because driving does not re-invoke routing as a skill every
loop iteration — it only reuses routing's registry data — so a
routing-level fix would never have run on the automated path.

A later real end-to-end run surfaced one more instance of the same
underlying class of gap — a skill's prose instructing an action is not the
same as the engine guaranteeing it happens:

> D18: ...fgos-coding-implement's own Return-step prose, even though
> imperative and explicit, never reliably fires handoff --to reviewer
> --reason review... Fix: moveWork itself now fires the review handoff as
> a side effect of reaching awaiting-approval (mirrors D16's to==='delivered'
> auto-close block exactly...)

The consistent lesson across D16 and D18: wherever multiple doors converge
on the same state (every path to `delivered`, every path to
`awaiting-approval`), the guarantee has to live once at the engine level
(`moveWork`), not be duplicated as prose across every skill that might take
one of those doors.

## Mechanism vs. policy

> D3: Tách mechanism/policy — harness gác legality + ghi sự thật + đánh
> thức đúng vai, không phán đoán; soul = agent-type hiểu vai trò/vấn
> đề/cần ai support, tự chọn edge hợp lệ

The harness's job is narrow: guard which routes are legal, record what
actually happened, and wake the right role — never judge which route is
*correct*. That judgment belongs to the "soul" (the agent-type actually
doing the work), which understands its role, the problem, and who to ask
for help, then picks a legal edge itself.

## Gates: hard only when the side effect crosses the item's own boundary

> D5: One-way gate theo nguyên tắc hard/soft — gate hard một-chiều khi và
> chỉ khi side effect vượt ranh giới item/worktree (merge vào main, publish
> ra ngoài, terminal done/wontfix, cleanup đã xoá worktree); mọi gate nội
> bộ item là soft: quay lại được nhưng bắt buộc ghi reason vào event log

A single principle derives every gate instead of hand-listing them: a gate
is hard and one-directional only when its side effect crosses the item's or
worktree's own boundary — merging into main, publishing externally, a
terminal state, or a worktree already deleted by cleanup. Every gate that
stays inside the item is soft — reversible, but only with a reason recorded
to the event log, which turns rework into a compound-learning signal
instead of silent backtracking. The same principle was confirmed to carry
over to marketing unchanged (publish = hard, editorial approval = soft).

## Task-spec: a contract separate from the skill that fulfills it

> D6: Task-spec A-lite — tách contract (task-spec: input/output/gate/
> verify-template, file khai báo per-domain theo mô hình cockpit
> .fgOS/tasks/) khỏi know-how (skill); skillMap trỏ stage sang cặp
> (task-spec, skill); ban đầu task-spec là read-first material qua refs,
> chưa engine enforcement

A task-spec declares the contract (input/output/gate/verify shape); a skill
holds the know-how that fulfills it. `skillMap` maps a stage to the pair.
Deliberately YAGNI at first: a task-spec starts as read-first material a
skill points at, with no engine enforcement yet — enforcement was not built
ahead of a proven need for it.

> D9: Task-spec bắt buộc có section Collaboration — bảng trigger-prose per
> call-edge, khai báo per (workflow, stage): khi nào gọi, reason gì, tới
> role nào, bóng về mang gì. Phân công ba tầng: prose dạy (task-spec),
> soul quyết (được phán đoán không gọi), guard chặn (roleGraph).

Every task-spec's Collaboration table documents each call-edge's trigger in
prose; the soul decides whether a trigger actually matches; the roleGraph
guard blocks any route the trigger prose doesn't license. This three-layer
split existed implicitly before it was named — exploring's own
material/grounded/answerable filter was already an advise trigger, and
`fgos-researching`'s description was already a consult trigger — the design
work was migrating that existing prose into one consistent structure, not
inventing new interactions.

## A four-layer ontology, and why role stays a per-item property

> D10: Ontology 4 tầng task-spec/skill/knowledge/context (knowledge =
> chuyên môn domain, context = bối cảnh instance — refs/docs sẵn có);
> nguyên tắc nở-task-trước-nở-role-sau; roleGraph coding đóng ở 5 position
> (implementer/researcher/reviewer/helper/human-advisor) với ~13 task-spec

Task-spec, skill, knowledge (domain expertise), and context (the instance's
own refs/docs) form four distinct layers. The coding domain's roleGraph
stays closed at five positions serving roughly thirteen task-specs. Job
titles (PO/PM/TechLead/SE/Tester) are explicitly kept out of the harness —
they are persona/title packaging at the "soul" layer, bundling positions
plus tickets plus authority per team roster, not something the engine
encodes.

> D11: Binding soul↔role khi team đông hơn role: (1) call nhắm vào
> (position, task-spec), giải quyết bằng pull... (2) sticky trong một
> call-thread... (3) targeted call (--to-soul) là ngoại lệ có chủ đích

When a team has more souls than declared roles, a call targets a
`(position, task-spec)` pair and is resolved by pull — an eligible soul
self-claims rather than being push-assigned — with sticky binding inside
one call-thread so context isn't lost mid-conversation, and an explicit
`--to-soul` override for the rare targeted case (still position-legality
guarded, logged for compound-learn to see).

> D12: Title/persona = agent-type definition sẵn có (.claude/agents/*.md,
> spawn qua subagent_type...); eligibility khai bằng MỘT field frontmatter
> claims:[danh sách phiếu]... KHÔNG roster file, KHÔNG humans registry,
> KHÔNG agent-pools

Rather than inventing a new roster/registry concept, the design recognized
that an agent-type definition already *is* a title — every remaining piece
(worker-slots, dispatch, pull-door verbs, a session announcing itself at
claim time) already existed. The only new surface needed was one `claims:`
frontmatter field per agent-type plus one field on the claim event — no
second source of truth.

## Workflow hierarchy: domain → N workflows → item, mechanism first

> D7: Hierarchy khai báo domain -> N workflow -> item. Mỗi domain có
> nhiều workflow... selector tái dùng kind qua map workflowFor {kind ->
> workflowName}... coding un-gộp thành feature (graph hiện tại, default) /
> bugfix / lightweight

> D7a (amendment to D7): mechanism-first cho workflow multiplicity — piece
> 2 land hierarchy domain to N workflow + selector workflowFor với DUY
> NHẤT workflow feature đăng ký (mọi kind map về feature), chứng minh cơ
> chế không rủi ro migration; hai graph bugfix/lightweight tách thành item
> riêng làm sau khi đã có dữ liệu vận hành

The single coding stage-graph was doing three different jobs (a feature
shape, a bug's prove-cause-first shape, a docs/chore shape forced through
feature-sized ceremony). The hierarchy fix landed the *mechanism*
(domain → N workflows, a `kind → workflowName` selector reusing the
existing `kind` field) with only the `feature` workflow actually
registered — proving the mechanism carries no migration risk before
building the other two graphs, deferred to their own items once real
operating data existed. The amendment itself came out of `fgos-coding-
validating`'s own hard-gate keyword match on "schema/migration," given real
backlog evidence that bugs were 47% of the open backlog (363/768) — a wrong
bugfix-shape would have touched nearly half of it, so the reversible branch
was chosen over the irreversible one.

> D17: ...Locking kind edits once status leaves todo (editWork's own
> guard, store.mjs) means resolveWorkflow(domain, work.kind) and a direct
> domain.stages read agree for an item's entire stage walk, with no new
> field, no new write door, no validated-change verb to get subtly wrong

The final piece closed a design gap Opus had flagged (what happens if an
item's `kind` changes after workflow selection has already happened): `kind`
can only meaningfully change while `status` is `todo` anyway, since
`fgos-coding-driving`'s claim only happens right before the first
`executing`-stage invocation. Locking `kind` edits once status leaves
`todo` means the resolved workflow and the item's stage walk can never
disagree, without adding a new field or a new validated-change verb.

## Artifact schema: only where the domain's own artifacts are structured data

> D13: Ép artifact-schema = harness cung cấp validator + chokepoint...
> Họ artifact-schema (~33 file của cockpit: brief/slot/calendar/persona/
> brand-profile) đi cùng port marketing — KHÔNG làm cho coding vì artifact
> coding là văn xuôi, không phải structured data

Marketing-cockpit's own schema enforcement (41 JSON-Schema files, validated
at the dispatch chokepoint so no orphaned child item can be created from a
malformed brief) is real evidence *for* mechanical gating of LLM-generated
structured data — and a caution that enforcement needs a soft correction
path or an item gets stuck. But coding's own artifacts are prose, not
structured data, so this pattern is deliberately deferred to the marketing
domain's own port rather than retrofitted onto coding.

## Source

`tsk-2t9c` — "So sánh cơ chế điều phối workflow/task/process/stage/routing
giữa fgOS và marketing-cockpit". The item's own `docs/history/
fgos-marketing-domain-foundation/DISCUSSION.md#task-role-axis-coding`
reference has since been cleaned up from disk (the live decision record is
this document plus the `.fgos/` event log's own D1-D18 entries against
`tsk-2t9c`); the decisions quoted above are copied verbatim from that
event-log record rather than the now-absent discussion doc.
