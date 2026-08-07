---
type: explanation
title: Why fgos-planning's mode gate moved to fgos-routing, and gate traceability stayed inline
tags: [fgos-planning, fgos-routing, mode-gate, triage-before-load, gate-traceability]
timestamp: 2026-08-06T00:00:00.000Z
source_capture_ids: [tsk-5ay]
---

# Why fgos-planning's mode gate moved to fgos-routing, and gate traceability stayed inline

`tsk-5ay` started as a much bigger ask: compare all four fgOS dev skills
(explore/plan/validate/execute) against `/ck:plan`+`/ck:cook` and a
re-distilled "bee" hive framework, looking for bloat to cut or merge —
without reversing the reality-check principle those skills exist to
enforce. During a live session comparing the real `fgos-planning/SKILL.md`
and `fgos-routing/SKILL.md` against bee's own `bee-planning`/`bee-briefing`
chain, the scope narrowed to exactly two fixes with real evidence behind
them — not a full four-skill audit (deferred, a separate item if ever
needed).

## What was explicitly rejected first

Splitting `fgos-planning` into several smaller skills, one per internal
step, was considered and rejected:

> "bee chỉ tách planning làm ĐÚNG 2 (bee-planning + bee-briefing, 2 LOẠI
> việc khác nhau: quyết định vs viết ra), không tách vụn theo bước. Skill
> là văn xuôi cho LLM, không phải module code có ranh giới phụ thuộc thật
> — chia nhỏ không có lợi ích 'sửa đúng chỗ'/'test đúng chỗ' như code (đơn
> vị test skill đúng là ĐIỂM QUYẾT ĐỊNH, không phải FILE)."

The reasoning generalizes: a skill is prose an LLM interprets, not a code
module with real dependency boundaries. Splitting it the way you'd split a
source file buys none of code's benefits ("fix the right file," "test the
right file") — the right unit to reason about is the decision point, not
the file boundary.

## D1 — the mode gate moves before the skill loads, not inside it

`fgos-planning/SKILL.md` (257 lines) ran its mode gate — deciding the lane
(tiny/small/standard/high-risk/spike) — as step 2, *inside* the skill,
after a full bootstrap. That means the entire 257-line skill has already
been loaded into context before the session even learns the item is tiny.
`fgos-routing/SKILL.md`, the lightweight skill that runs first and decides
which heavier skill to load, had no lane/mode-gate logic of its own at
all — confirmed by a fresh grep before deciding. Locked:

> "D1: Mode-gate của `fgos-planning` dời sang `fgos-routing` (triage TRƯỚC
> khi load skill nặng), thay vì nằm TRONG `fgos-planning` như hiện tại —
> khớp bee's triage-before-load (bee-hive triage trước khi load
> bee-planning nặng)."

This is "triage-before-load": decide the lane before the heavy skill is
read into context, rather than loading the heavy skill and discovering
partway through that the item never needed it.

## D2 — gate traceability discipline joins the existing Gate step, not a new skill

bee's `bee-briefing` enforces a discipline worth adopting: every sentence
presented at a decision gate must trace back to a specific passage in
`plan.md`/`CONTEXT.md`; anything that can't be traced becomes an Open
Question instead of an assertion invented on the spot ("briefing là
consolidator, không phải planner thứ hai"). The question was whether
adopting that discipline required a new `fgos-briefing` skill, mirroring
bee's own two-skill split. It didn't:

> "D2: Học kỷ luật truy-nguồn của bee-briefing... NHƯNG thêm thẳng vào
> Gate step của `fgos-planning` hiện có, KHÔNG tách skill `fgos-briefing`
> riêng — `plan.md` fgOS đã CHÍNH LÀ review document rồi — chỉ thiếu kỷ
> luật, không thiếu tầng. Tách thêm 1 skill = thêm 1 hop cho mọi đường
> standard/high-risk, ngược Ship Faster (0025)."

The distinction that mattered: `fgos-planning`'s existing Gate step
("`plan.md` is the review document; nothing past this point starts until
it is approved") already *is* the review layer bee's `bee-briefing`
provides — fgOS was missing the traceability discipline, not a whole
missing layer. Adding a second skill just to enforce a discipline the
existing artifact could carry directly would add a hop to every
standard/high-risk path, working against the product priority order's
"Ship Faster" (`docs/decisions/0025`) — and that decision's own scope
note applies here too: speed means the speed of a project *using* fgOS,
not fgOS's own build speed, so a self-imposed extra hop isn't justified
just because it might feel more architecturally symmetric with bee.

## Outcome

Landed `awaiting-approval`, verified via three greps confirming the mode
gate's old text left `fgos-planning/SKILL.md`, lane/mode-gate language
appeared in `fgos-routing/SKILL.md`, and traceability language ("truy
nguồn" / "trace back to" / "Open Question") appeared in `fgos-planning`'s
Gate step. The broader four-skill audit and the fuller `/ck:plan`+`/ck:cook`
comparison the item originally asked for stayed explicitly deferred — not
forgotten, just judged non-material to landing these two evidenced fixes.

## Follow-up (`tsk-da1`): four real gaps left by the D1/D2 move

An independent code review after `tsk-3uz`/`tsk-5ay` merged found the
mode-gate move above had left the skill docs themselves in a state that
didn't fully hold up:

1. **The Decide-the-split example command failed if actually run.** The
   worked example in that step used the item's title as `fgos add`'s
   positional id argument and was missing 4 other required fields — it
   read as a real example but would fail on a real terminal. Fixed to a
   command that actually runs (`fgos add --title ...`).
2. **Stale step-number references survived the renumbering.**
   Moving the mode gate out of `fgos-planning/SKILL.md` renumbered its
   remaining steps, but `fgos-validating/SKILL.md` and
   `fgos-coding-shaping/SKILL.md` still pointed at the *old* step numbers
   ("step 3"/"step 5") for cross-references into `fgos-planning` — a
   classic renumbering-leaves-stale-external-references gap, since the
   grep-verified fixes in the original D1/D2 work only checked
   `fgos-planning`'s own file, not every other skill referencing it by
   number.
3. **No fallback lane when entered directly, bypassing `fgos-routing`.**
   D1's whole premise was "decide the lane in `fgos-routing`, before the
   heavy skill loads" — but `fgos-planning` can also be entered directly
   from `fgos-exploring`/`fgos-validating` without ever passing through
   `fgos-routing`'s own mode gate first, and nothing computed a lane in
   that case. Fixed by adding a fallback that computes the lane locally
   when no hand-off lane was received, rather than assuming
   `fgos-routing` is always the entry point.
4. **The "saves load" framing overstated what actually landed.** D1's own
   stated benefit was that `fgos-routing` could skip loading
   `fgos-planning` entirely for lanes that don't need it — but
   `fgos-routing` still unconditionally routes every decompose-shaping
   item into `fgos-planning` regardless of lane, so that savings claim
   was aspirational, not yet real. The docs were reworded to state this
   plainly rather than imply an optimization that hadn't actually
   shipped.

Applied to both dual-root skill copies (`.claude/skills/` and
`.agents/skills/`), per this repo's dual-root convention. Verified with
real greps against the actual file contents, not just review — including
a negative check that the fallback-lane addition didn't accidentally
reintroduce the old inline mode-gate text D1 had deliberately removed.

---

**Source:** `docs/history/fgos-planning-mode-gate-and-gate-traceability/CONTEXT.md`
(tsk-5ay, D1-D2); work-item capture via `fgos check tsk-5ay`. Follow-up
fixes: `tsk-da1` (`fgos check tsk-da1`), filed as an independent code
review after `tsk-3uz`/`tsk-5ay` merged.
