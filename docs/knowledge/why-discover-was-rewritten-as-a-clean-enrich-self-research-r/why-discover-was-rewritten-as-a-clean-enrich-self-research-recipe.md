---
framework: diataxis
mode: explanation
---
# Why `discover` was rewritten as a clean/enrich/self-research recipe

The original complaint: running 15 discover rounds against real backlog
items came back `unclear`/`parked` almost across the board — "exit 0,
unclear, parked" every time, with an iteration report reading
`cleared=0, parked=4, skipped=0`. The ask was to bring `discover` up to
something closer to `/ck:research`'s own depth: self-clean the ask, pull
in related-item context, research (code scan + web) before ever asking a
human, and only *then* judge clear vs. unclear.

## What shipped — Route A

> Route A shipped for discover research-and-clean recipe:
> `executors.judge-discovery` widened (Task/WebSearch/WebFetch/Read
> allowedTools), `buildDiscoveryPrompt` rewritten as 5-step recipe
> (clean ask, enrich real dep content, self-assess, self-research before
> parking, degrade with no tools), verdict gains optional
> `titleProposal`/`descriptionProposal` (proposal-only, never
> auto-applied), scout-notes capture changed from once-ever to every
> call (was the direct cause of repeated identical unclear verdicts),
> `extractScoutTranscript` widened beyond `Bash(rg:*)`.

The judge itself was widened to carry real research tools
(`Task`/`WebSearch`/`WebFetch`/`Read`), and its prompt became an
explicit 5-step recipe: clean up the ask, enrich with real dependency
content, self-assess what's actually unclear, self-research before ever
parking to a human, and degrade gracefully when no tools are available.
Any title/description improvements the judge finds come back as
proposals only — never auto-applied to the item.

## The bug that was the real cause of the repeated `unclear` symptom

Scout-notes capture had been recorded once-ever per item, not on every
call — meaning a re-run against the same unclear item would keep
re-deriving from stale, already-superseded notes instead of the latest
research. This was identified as *the direct cause* of the repeated
identical `unclear` verdicts that originally triggered this whole
investigation — fixed to capture fresh scout-notes on every call.

## Route B was considered and rejected — with a concrete reason

> Route B (route research through fgos-coding-exploring's interactive session
> instead of widening the headless judge) considered and not chosen —
> rejected after a live test showed headless `claude -p` already
> supports parallel Task-tool dispatch, closing most of the capability
> gap route B would have solved, at lower implementation cost.

Not a preference call — a live test disproved the premise that headless
judges couldn't parallelize research the way an interactive session
could.

## Discussion point #4 — measure before enforcing a hard cap

> #4 chọn 'đo trước khi ép' — không thêm --max-turns cứng ngay, mà thêm
> `researchToolCallCount` (mechanical, cưỡi trên `addDiscovery` spread
> giống `impactScore`) đếm số tool call scout thật mỗi lần
> `judgeDiscovery` chạy, qua `scoutCaptureOut` — tham số optional cuối
> cùng mới của `runJudgeExecutor` (threading additive,
> `judgeDecompose`/`runWatch` không đổi, có test byte-identical xác
> nhận).

Rather than immediately hard-capping the model's research budget
(over-engineering a limit before knowing whether it's actually needed),
a mechanical counter (`researchToolCallCount`) was added first to
observe real tool-call counts across real runs — threaded additively
through `runJudgeExecutor` so `judgeDecompose`/`runWatch` stayed
byte-identical, verified by test.

## A separate, real diagnosis: why `fgos-coding-exploring` felt worse than `ck:research`

> Root cause của cảm giác 'exploring ép chọn options, mất thông tin' so
> với `ck:research`: skill text vốn đã cho phép trả lời mở ('point at a
> reference', dòng 118), nhưng agent thực thi mặc định dùng
> `AskUserQuestion` (ép 2-4 option định trước) nên tự giới hạn không
> gian câu trả lời xuống cái agent đã tưởng tượng sẵn.

The gap wasn't in the skill's own design — `fgos-coding-exploring`'s SKILL.md
already permitted open-ended prose answers. The gap was in execution
default: agents defaulted to `AskUserQuestion`'s structured 2–4 option
format for exploratory questions, self-limiting the answer space to
whatever the agent had already imagined, rather than the open space the
skill actually allowed. Fixed by making the SKILL.md explicit that
exploratory decision questions default to open conversational prose, not
a structured-choice tool — while keeping structured-choice for the
genuinely appropriate case, the gate step's yes/no approve/reject.

## The final real validation — closing the loop with observed data

> Chạy lại discover trên đúng 3 item từng crash (tsk-2rp, tsk-42i,
> tsk-4op) + 1 đã chạy trước đó (tsk-47e). Kết quả: 0/4 crash. tsk-47e+
> tsk-42i: clear=true thật (5 và 2 lượt research, verify cụ thể, evidence
> thật). tsk-4op+tsk-2rp: vẫn unclear đúng (product decision thật,
> không phải thiếu info) — tsk-2rp dùng 6 lượt research (VƯỢT ngân sách
> mềm ~5 trong prompt 1 lượt), tự audit ra 9 call site `runGoalCheck`
> thật (report gốc ghi nhầm 4), vẫn đúng đắn kết luận 'đây là quyết định
> sản phẩm, không suy ra được từ code' thay vì tự bịa. Điểm dữ liệu
> discussion #4: `researchToolCallCount` quan sát = {0,2,5,6} — ngân
> sách mềm bị vượt nhẹ 1 lần, không runaway, không case nào tự quyết
> định thay người khi thật sự cần hỏi.

Real re-run against the exact items that used to crash, after a
separate FSM fix (`tsk-wcl`) landed: zero crashes across all four.
Two genuinely cleared with real research evidence; two correctly stayed
`unclear` because the ambiguity was a genuine product decision, not
missing information — and one of those two even self-corrected the
original research report's own miscount (9 real call sites vs. the
report's claimed 4), while still correctly declining to guess at a
product decision on its own. The soft research-budget observation
(`{0,2,5,6}` tool calls across the four runs) showed one mild overshoot
past the ~5-call soft budget, but no runaway loop and no case where the
model silently decided something that genuinely needed a human. This
observed data closed the research thread — no hard `--max-turns` cap
was added, since the soft budget held in practice.
