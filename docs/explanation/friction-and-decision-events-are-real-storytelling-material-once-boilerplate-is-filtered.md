---
type: explanation
title: Friction and decision events are real storytelling material, once boilerplate is filtered
tags: []
source_capture_ids: [tsk-1hy]
---
# Friction and decision events are real storytelling material, once boilerplate is filtered

`tsk-28x` round 3 had claimed the event log's "struggle material" was
already usable as-is for compound-learning artifacts. Round 4 retracted
that claim — the retraction itself had generalized from a single record
(`tsk-1gn`) to the whole system, and a real read of the full log showed
92% of recorded friction is machine telemetry, not narrative. Having
already been wrong in that direction once, `tsk-1hy` existed to answer
the underlying question with a probe against the real log instead of a
second guess: is there genuinely usable storytelling material in
`.fgos/events.jsonl`, or is it all boilerplate?

## The probe, and what it deliberately didn't do

`scripts/probe-storytelling-material.mjs` — kept out of `bin/fgos.mjs`
on purpose, since a probe shouldn't become a permanent public surface
before anyone knows the material is usable — reads two vistas straight
out of the real log:

- **Vista (a)** — every event carrying a `question`/`ask` payload.
- **Vista (b)** — every decision whose `rationale` text appears exactly
  once across the whole log (a proxy for "not a template"), with five
  named boilerplate patterns filtered out first.

Grouping, ranking signal design, and any registry/architecture decision
were explicitly out of scope — this probe only had to answer "is the
material real," not "how should it be used."

## What filtering removed, with real counts

Run against the live log (10119 events, 2026-08-09): 1701 decision
events, 1569 carrying a rationale. After removing the boilerplate
patterns (`tsk-27y D2: caller-supplied verdict...` x321, empty x132,
the `fgos-coding-planning` mirror of the same string x96, `see CONTEXT.md for
full scout evidence and reasoning` x82/x38) and the 132 missing-rationale
entries, 778 singleton rationales remained. Vista (a) surfaced 314 ask
events across roughly 230 items.

## The verdict, and its real caveat

From the probe's own report:

> **Yes, this vỉa (vista) is real, usable storytelling material** — for
> a meaningful chunk of it, not the whole thing. Grouped by item id,
> the material shows genuine narrative arc, turning points, and real
> disagreement — not just unusable notes. The catch: it is unevenly
> distributed.

The signal concentrates in items with several rounds of dated entries.
`tsk-19j` (15 vista-b entries, 2026-07-31 → 2026-08-02) shows a real
self-correction arc:

> 2026-07-31T06:25:18: "user phản biện đúng: caller đặt ceiling (cook) đã
> hardcode tên stage domain coding khắp SKILL.md rồi, không có lợi ích
> domain-portable thật để giữ số bước..."
>
> 2026-07-31T11:20:47: "user thach thuc dung: 'phai khong do, sao lai vuot
> duoi roi' -- buoc phai kiem lai nghiem tuc thay vi doi y de vua long."
>
> 2026-07-31T11:49:41: "user tu nhan ra: 'no co khac gi fgos:pick dau, mai
> mot fgos:pick hoac cac skill khac chi la wrapper voi mot so tham so
> thay doi' -- dung, khong con cau hoi mo nao nua"

`tsk-1ca` (25 vista-b entries, 2026-08-01) shows a direct human decision
that redirects a feature's shape mid-flight, followed by a session
catching a real destructive risk and stopping before acting:

> 2026-08-01T15:32:05: "Nguoi quyet truc tiep (2026-08-01): 'thuc chat
> retrospective la reflect/learning phai khong? nhu vay compound chinh la
> hoc do. stage do bo luon, chay skill compound-learning tai
> retrospective.' Tranh 2 co che song song lam cung 1 viec (technical debt
> ngay tu thiet ke)."
>
> 2026-08-01T17:12:44: "Dung dung luc thay rui ro that (co the xoa mat
> cong viec hop le cua session/nguoi khac tren main dung chung) truoc khi
> lam gi them -- dung 'tu lam luon' cua nguoi dung khong bao gom quyen tu
> quyet git-surgery tren nhanh main dung chung khi phat hien rui ro pha
> huy."

## The counter-evidence the probe found on its own

Vista (a) — unlike vista (b) — was not run through D4's boilerplate
filter, and the probe's report shows it needs one just as much: items
like `tsk-3id`/`tsk-3fb` repeat "Không phán được rõ ràng — cần người xác
nhận thủ công." as filler, and `tsk-3w8` repeats "Đề xuất: không chia
(pass-through) — Item gốc có risk cao (heavy) — cần xác nhận trước khi
chia." four times verbatim within the same item. A design that ranks or
selects from vista (a) directly will need an equivalent frequency filter
before that vista is as clean as vista (b) already is.

## What this settles, and what it doesn't

The material is real enough to build a compound-learning artifact
registry on top of — but it is not uniformly dense across every item.
The probe's own report frames the implication for whoever designs that
registry next: weight by round-count-per-item (the items with many dated
entries carry the real arcs) rather than treating every decision/ask
event as equally story-worthy. Which ranking signal to use, and the
registry's shape, remain explicitly out of this probe's own scope — this
item only settled whether there is real material to rank in the first
place.
