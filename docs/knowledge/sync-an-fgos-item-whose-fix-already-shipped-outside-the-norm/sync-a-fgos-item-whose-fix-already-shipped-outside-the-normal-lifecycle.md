---
type: how-to
title: Sync an fgOS item whose fix already shipped outside the normal claim/return/approve lifecycle
tags: [lifecycle, guardrail-bypass, main-checkout, take, return]
timestamp: 2026-08-06T00:00:00.000Z
source_capture_ids: [tsk-3w3x]
framework: diataxis
mode: how-to
---

# Sync an fgOS item whose fix already shipped outside the normal claim/return/approve lifecycle

You (or a session before you) fixed something directly on the main
checkout — committed and pushed straight to `main` — instead of going
through `fgos take` → work on `fgw/<id>` → `fgos return` → `fgos approve`.
Now the work item tracking that fix still shows `status: todo`,
`stage: clarify`, even though the real code is already merged and live.

## How this happens

`tsk-3w3x` (a small discoverability fix — cross-referencing two skills,
`plugins/fgOS/skills/submit/SKILL.md` and `.claude/skills/
fgos-submit-assist/SKILL.md`, that agents kept missing the existence of
each other) got fixed this way when a person explicitly asked for it:

> "Fix đã SHIP THẬT: `plugins/fgOS/skills/submit/SKILL.md` và
> `.claude/skills/fgos-submit-assist/SKILL.md` đã được sửa (thêm đoạn trỏ
> chéo lẫn nhau), commit `db5355e` và `d1187bc`, đã push lên
> `origin/main`. LƯU Ý minh bạch: sửa này làm TRỰC TIẾP trên main checkout
> theo yêu cầu người dùng ('sửa luôn đi' / 'commit push luôn đi'), KHÔNG đi
> qua `fgw/<id>` branch + take/return/approve bình thường — item vẫn đang
> `status:todo`/`stage:clarify` dù code đã xong thật. Đây chính là kiểu
> lệch lifecycle mà `tsk-280` (guardrail-bypass ở tầng FSM) cảnh báo."

This is a real, named risk (`tsk-280`'s own guardrail-bypass concern), not
a hypothetical — the fgOS tracker and the real repository state can
genuinely diverge whenever a fix lands through any door other than the
tracked one, even when the fix itself is correct and welcome.

## Fix: don't leave it diverged — close the loop through the normal doors

The item's own decision log records the right remediation, logged as a
proposal rather than acted on immediately:

> "Đề nghị đóng item này đúng cửa thay vì để `todo` mãi dù code đã thật sự
> xong (commit `db5355e`/`d1187bc` trên main): claim qua `fgos take` (role
> phù hợp), rồi `return` ngay — vì code+verify đã nằm sẵn trên main, không
> cần làm gì thêm, chỉ cần đi đúng vòng đời để trạng thái fgOS khớp thực
> tế thay vì lệch như hiện tại."

Concretely: `fgos take <id>`, confirm there's genuinely nothing left to
change (the fix is already on `main`), then `fgos return <id>` — likely
needing `--no-new-commits-ok` (see the milestone how-to's own note on this
flag) since the branch forks from a `main` that already contains the fix,
so there is nothing new to commit on the item's own branch. This walks the
tracker's status back into agreement with reality without re-doing or
re-verifying work that already shipped correctly.

## Why not just hand-edit the status instead

Nothing about this fix required a different door in principle — the
guardrail-bypass risk `tsk-280` names is specifically about the tracker
and the repository silently disagreeing, not about direct-to-main commits
being forbidden outright (the person explicitly chose this path, and nothing
here reverses that choice). The remediation is to make the tracker catch
up to reality through its own normal doors (`take`/`return`), not to
hand-edit `status`/`stage` fields directly — that would just trade one
kind of one-door-write violation for another.

## Related

- `docs/history/agent-executor-submit-assist-classify/CONTEXT.md` — the
  pinned distinction between `fgOS:submit` (mechanical, deterministic, on
  purpose — so `dogfood-fixture:submit` replay stays reproducible) and
  `fgos-submit-assist` (deliberately outside the stage graph, prints its
  LLM reasoning before submission) that `tsk-3w3x`'s own discoverability
  fix cross-references.
- `docs/explanation/title-semantic-contract-lives-in-submitting-skills.md`
  — cites the same two skills as parallel doors.
