---
type: explanation
title: Why fgos-coding-planning's mode gate moved to fgos-routing, and gate traceability stayed inline
tags: [fgos-coding-planning, fgos-routing, mode-gate, triage-before-load, gate-traceability]
timestamp: 2026-08-06T00:00:00.000Z
source_capture_ids: [tsk-5ay]
framework: diataxis
mode: explanation
---

# Why fgos-coding-planning's mode gate moved to fgos-routing, and gate traceability stayed inline

`tsk-5ay` started as a much bigger ask: compare all four fgOS dev skills
(explore/plan/validate/execute) against `/ck:plan`+`/ck:cook` and a
re-distilled "bee" hive framework, looking for bloat to cut or merge —
without reversing the reality-check principle those skills exist to
enforce. During a live session comparing the real `fgos-coding-planning/SKILL.md`
and `fgos-routing/SKILL.md` against bee's own `bee-planning`/`bee-briefing`
chain, the scope narrowed to exactly two fixes with real evidence behind
them — not a full four-skill audit (deferred, a separate item if ever
needed).

## What was explicitly rejected first

Splitting `fgos-coding-planning` into several smaller skills, one per internal
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

`fgos-coding-planning/SKILL.md` (257 lines) ran its mode gate — deciding the lane
(tiny/small/standard/high-risk/spike) — as step 2, *inside* the skill,
after a full bootstrap. That means the entire 257-line skill has already
been loaded into context before the session even learns the item is tiny.
`fgos-routing/SKILL.md`, the lightweight skill that runs first and decides
which heavier skill to load, had no lane/mode-gate logic of its own at
all — confirmed by a fresh grep before deciding. Locked:

> "D1: Mode-gate của `fgos-coding-planning` dời sang `fgos-routing` (triage TRƯỚC
> khi load skill nặng), thay vì nằm TRONG `fgos-coding-planning` như hiện tại —
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
> Gate step của `fgos-coding-planning` hiện có, KHÔNG tách skill `fgos-briefing`
> riêng — `plan.md` fgOS đã CHÍNH LÀ review document rồi — chỉ thiếu kỷ
> luật, không thiếu tầng. Tách thêm 1 skill = thêm 1 hop cho mọi đường
> standard/high-risk, ngược Ship Faster (0025)."

The distinction that mattered: `fgos-coding-planning`'s existing Gate step
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
gate's old text left `fgos-coding-planning/SKILL.md`, lane/mode-gate language
appeared in `fgos-routing/SKILL.md`, and traceability language ("truy
nguồn" / "trace back to" / "Open Question") appeared in `fgos-coding-planning`'s
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
   Moving the mode gate out of `fgos-coding-planning/SKILL.md` renumbered its
   remaining steps, but `fgos-coding-validating/SKILL.md` and
   `fgos-coding-shaping/SKILL.md` still pointed at the *old* step numbers
   ("step 3"/"step 5") for cross-references into `fgos-coding-planning` — a
   classic renumbering-leaves-stale-external-references gap, since the
   grep-verified fixes in the original D1/D2 work only checked
   `fgos-coding-planning`'s own file, not every other skill referencing it by
   number.
3. **No fallback lane when entered directly, bypassing `fgos-routing`.**
   D1's whole premise was "decide the lane in `fgos-routing`, before the
   heavy skill loads" — but `fgos-coding-planning` can also be entered directly
   from `fgos-coding-exploring`/`fgos-coding-validating` without ever passing through
   `fgos-routing`'s own mode gate first, and nothing computed a lane in
   that case. Fixed by adding a fallback that computes the lane locally
   when no hand-off lane was received, rather than assuming
   `fgos-routing` is always the entry point.
4. **The "saves load" framing overstated what actually landed.** D1's own
   stated benefit was that `fgos-routing` could skip loading
   `fgos-coding-planning` entirely for lanes that don't need it — but
   `fgos-routing` still unconditionally routes every decompose-shaping
   item into `fgos-coding-planning` regardless of lane, so that savings claim
   was aspirational, not yet real. The docs were reworded to state this
   plainly rather than imply an optimization that hadn't actually
   shipped.

Applied to both dual-root skill copies (`.claude/skills/` and
`.agents/skills/`), per this repo's dual-root convention. Verified with
real greps against the actual file contents, not just review — including
a negative check that the fallback-lane addition didn't accidentally
reintroduce the old inline mode-gate text D1 had deliberately removed.

## Second follow-up (`tsk-59a`): the mode→lane rename left a real regression, not just a docs gap

A second independent review round, after `tsk-da1` merged, found five
more issues — the first a genuine functional regression, not just a
prose gap:

1. **Real regression: a literal-token match broke silently.**
   `decompose.mjs:675`'s regex needs the literal token `Mode:` present in
   `plan.md` to skip an unnecessary model call for a `tiny`/`small` item
   — a cheap mechanical shortcut. `fgos-coding-planning`'s own Bootstrap step,
   after the mode→lane terminology rename (the D1 move this doc already
   describes), had stopped instructing sessions to write that literal
   `Mode:` line at all — it now wrote lane information under different
   wording. Measured against the real corpus: 25 of 153 real `plan.md`
   files that should have matched no longer did, silently falling through
   to the more expensive model-call path every time. This is the kind of
   regression that costs real money/latency per occurrence without ever
   throwing an error — nothing crashes, it just gets slower on every
   affected item. Fixed by restoring the instruction to write the exact
   literal `Mode: <lane>` line, keeping the mode→lane terminology rename
   everywhere else.
2. **The same broken `fgos add` example from `tsk-da1` existed
   untouched in a second skill file.** `fgos-coding-exploring/SKILL.md:196` had
   the identical broken-command bug `tsk-da1` had just fixed in
   `fgos-coding-planning`'s own copy — nobody had checked whether the same
   pattern was duplicated elsewhere. Fixed the same way: a command that
   actually runs.
3. **`tsk-da1`'s own fallback-lane addition (D1-follow-up gap 3 above)
   quietly dropped real logic while claiming to be "the exact same
   rule."** The fallback computed the lane locally when entered directly,
   but left out the tie-breaker and the enumeration hard-gate flags that
   `fgos-routing`'s real Mode-gate section actually has — a lossy
   restatement, not a faithful mirror. Fixed by pointing the fallback
   directly at `fgos-routing`'s own Mode-gate section instead of
   re-describing it inline, so there's one canonical copy of the real
   rule rather than two that can drift.
4. **A stale attribution survived the D1 move.** `fgos-coding-validating`
   still referred to "`fgos-coding-planning`'s flag count" — after D1 moved the
   mode gate (and its flag-counting logic) to `fgos-routing`, that
   attribution should have moved with it. Fixed to name the right owner.
5. **A worked example referenced a variable before it was assigned.**
   The split-step example command used `--dir "$root"`, but `$root` was
   only actually assigned in the separate Gate block further down the
   same file — a reader following the split-step example literally would
   hit an undefined variable. Fixed by assigning `$root` directly inside
   the example that uses it.

Applied to both dual-root skill copies (`.claude/skills/` and
`.agents/skills/`), matching this repo's existing dual-root convention.
Verified with real greps plus a real test run
(`node --test test/intake/plan.test.mjs`), not just review — the
regression in particular was confirmed by measuring the real corpus
match rate, not just re-reading the regex.

---

## Third follow-up (`tsk-5iv`): the same undefined-`$root` bug, in the sibling `fgos-coding-exploring` skill

A round-3 independent review found the exact same undefined-`$root`
defect gap 5 above described fixing in `fgos-coding-planning/SKILL.md` also
existed, untouched, in `fgos-coding-exploring/SKILL.md`'s own `fgos add`
example — the same commit (`d3ae2cb`, `tsk-59a`) that fixed
`fgos-coding-planning`'s copy had never checked whether the identical example
was duplicated in the sibling skill. Verified directly: the only real
`root=` assignments in the file sat at unrelated lines 112/231, nowhere
near the broken example. Fixed with the identical assignment line
(`root=$(git rev-parse --path-format=absolute --git-common-dir | xargs
dirname)`) placed before the example, applied to both dual-root copies
(`.claude/skills/` and `.agents/skills/`), keeping them byte-identical
per this repo's convention.

---

**Source:** `docs/history/fgos-coding-planning-mode-gate-and-gate-traceability/CONTEXT.md`
(tsk-5ay, D1-D2); work-item capture via `fgos check tsk-5ay`. Follow-up
fixes: `tsk-da1` (`fgos check tsk-da1`), filed as an independent code
review after `tsk-3uz`/`tsk-5ay` merged; `tsk-59a` (`fgos check tsk-59a`),
a second independent review round after `tsk-da1` merged; `tsk-5iv`
(`docs/history/round3-review-fixes-2026-08-06/`), a round-3 independent
review after `tsk-59a` merged.
