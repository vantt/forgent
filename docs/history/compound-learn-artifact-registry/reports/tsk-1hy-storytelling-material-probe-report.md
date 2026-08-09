# Storytelling-material probe (tsk-1hy) — real answer

Ran `scripts/probe-storytelling-material.mjs` against the real, live
`.fgos/events.jsonl` (10119 events, 2026-08-09). Full script output:
2143 lines, `Vista (a)` 314 ask events across ~230 items, `Vista (b)` 778
singleton decision rationales after removing the four named boilerplate
patterns plus the 132 missing-rationale entries (D4). This report answers
the probe's own question — CONTEXT.md D5 — with verbatim quotes, not
feeling.

## Verdict

**Yes, this vỉa (vista) is real, usable storytelling material** — for a
meaningful chunk of it, not the whole thing. Grouped by item id (D5), the
material shows genuine narrative arc, turning points, and real
disagreement — not just unusable notes. The catch: it is unevenly
distributed. A large share of vista (a) is itself a second layer of
boilerplate ("Không phán được rõ ràng — cần người xác nhận thủ công."
repeats, "Đề xuất: không chia (pass-through)..." repeats) that a future
design must filter too, on top of D4's four decision-rationale patterns.
The real signal concentrates in items with several rounds of dated
entries — exactly the items a frequency/grouping pass like this one
surfaces for free.

## Real arc example — tsk-19j (vista b, 15 entries, 2026-07-31 → 2026-08-02)

A design question evolves across a real session, including a moment where
a person catches the session about to abandon ground it had already
proven, and the session catching its own reasoning slip:

> 2026-07-31T06:25:18: "user phản biện đúng: caller đặt ceiling (cook) đã
> hardcode tên stage domain coding khắp SKILL.md rồi, không có lợi ích
> domain-portable thật để giữ số bước..."

> 2026-07-31T11:20:47: "user thach thuc dung: 'phai khong do, sao lai vuot
> duoi roi' -- buoc phai kiem lai nghiem tuc thay vi doi y de vua long."

> 2026-07-31T11:49:41: "user tu nhan ra: 'no co khac gi fgos:pick dau, mai
> mot fgos:pick hoac cac skill khac chi la wrapper voi mot so tham so thay
> doi' -- dung, khong con cau hoi mo nao nua"

That third quote is a real turning point — a self-recognized "this is the
same mechanism as X" insight that closes an open question, not a status
update.

## Real disagreement example — tsk-1ca (vista b, 25 entries, 2026-08-01)

A direct, quoted human decision that redirects the whole feature's shape
mid-flight:

> 2026-08-01T15:32:05: "Nguoi quyet truc tiep (2026-08-01): 'thuc chat
> retrospective la reflect/learning phai khong? nhu vay compound chinh la
> hoc do. stage do bo luon, chay skill compound-learning tai
> retrospective.' Tranh 2 co che song song lam cung 1 viec (technical debt
> ngay tu thiet ke)."

And a real self-restraint moment (a session catching a risk and stopping
before acting on it):

> 2026-08-01T17:12:44: "Dung dung luc thay rui ro that (co the xoa mat
> cong viec hop le cua session/nguoi khac tren main dung chung) truoc khi
> lam gi them -- dung 'tu lam luon' cua nguoi dung khong bao gom quyen tu
> quyet git-surgery tren nhanh main dung chung khi phat hien rui ro pha
> huy."

## Real disagreement example — from vista (a), item bo-hardcode-ten-trunk-main

> 2026-07-16T16:12:40: "Trunk name 'main' hiện là một assumption có chủ
> đích, ghi rõ trong comment tại src/runner/merge.mjs:75-76... không có
> config/param nào cho trunk name ở nơi khác trong runner... Vậy trunk
> name nên được xác định bằng cách nào thay vì hardcode: (a) đọc từ git
> thật..., hay (b) thêm tham số/config truyền vào từ caller?"

This is a real, cited, two-option product question — not a template.

## The counter-evidence — vista (a)'s own second layer of boilerplate

Unlike vista (b) (already cleaned by D4's frequency-based filter), vista
(a) still contains its own repeated non-content templates the script does
NOT yet filter, e.g. (tsk-3id, tsk-3fb, and others):

> "Không phán được rõ ràng — cần người xác nhận thủ công."

and (tsk-3w8):

> "Đề xuất: không chia (pass-through) — Item gốc có risk cao (heavy) — cần
> xác nhận trước khi chia." (repeated 4 times verbatim within the same item)

A later design that wants to rank/select from vista (a) directly will need
an equivalent filter pass for these — this probe's own scope (D7) stops at
"filter + group", not "design the ranking signal".

## What this means for tsk-28x §6.4

The material is real enough to build on, but it is not uniformly dense —
confirms neither round 3's original over-broad claim nor round 4's full
retraction. A future design should weight by round-count-per-item (items
like tsk-19j/tsk-1ca with many dated entries carry the real arcs) rather
than treating every decision/ask event as equally story-worthy — this
itself is new information for whichever option tsk-28x picks next, though
picking that option remains explicitly out of this probe's scope (D7).
