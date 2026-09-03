---
type: how-to
title: Use --force to clear a red-first verify disagreement at clarify
tags: [clarify, discover, force, verify, red-first, behavior_change]
timestamp: 2026-08-06T00:00:00.000Z
source_capture_ids: [tsk-66o]
framework: diataxis
mode: how-to
---

# Use `--force` to clear a red-first verify disagreement at clarify

You're clarifying a root item that only decomposes into child work — it
adds no code itself yet (a `behavior_change` root, or any item whose real
deliverable is child items, not a running feature). The second-pass
semantic judge (`judgeVerifySemanticCorrectness`) keeps disputing your
proposed `verify` command because it doesn't pass *today*. It never will,
by design: the functions/files it names don't exist until the child items
that build them land.

## The trap this catches

`tsk-66o` (a root item decomposing into `computed-parallel-wave-schedule`
+ `worktree-dispatch-attestation` work) hit exactly this loop:

> "Sai lầm gốc: cứ tìm verify PASS ngay hôm nay. Với behavior_change chưa
> xây, verify đúng ra phải ĐỎ bây giờ, XANH sau build (red-first) — discover
> chỉ ghi chuỗi, không chạy ngay. Trỏ tên hàm cụ thể hoá D2 (Kahn/Tarjan đã
> khoá tên thuật toán), không phải bịa implementation mới."

Chasing a verify string that already passes for an item that hasn't been
built yet forces one of two bad outcomes: a vacuous verify (checks
something that already exists, proves nothing about the new work), or an
endless dispute loop where the judge keeps rejecting a verify that is
*correctly* red. Neither is the goal — `fgos discover` only **records**
the verify string at this stage; it does not execute it. Red-first is
correct: the verify should fail today and turn green only once the child
work actually lands.

## What still has to be true of the verify string

Red-first does not mean vague. The judge disputed two real gaps before
this one settled, and both corrections kept the string concrete:

1. **Point at names the locked decisions already committed to**, not an
   invented implementation. `tsk-66o`'s D2 had already locked the
   algorithm names (Kahn layering + Tarjan cycle-detection); the verify
   was corrected to grep for `computeSchedule`/`detectCycles` — names
   *implied by the locked decision*, not guessed fresh at verify-writing
   time.
2. **Grep for new, disambiguated names, not old code that already
   matches.** An earlier draft grepped `declared.has(file)` — code that
   already existed from a prior item (STR63) — which would pass
   trivially without proving anything about *this* item's change. The fix
   introduced a new function name (`footprintDiffHits`, next to the
   existing `frozenJudgeHits`) specific enough that only the new work
   would make the grep hit.

## Then use `--force`

Once the verify string is genuinely as concrete as the locked decisions
allow, but the judge still disputes it because it can't pass right now,
override:

> "Dùng `--force` — đây chính là cơ chế được thiết kế cho case
> root-chưa-xây (behavior_change, red-first) vs semantic judge cứ đòi
> verify pass ngay hôm nay (catch-22)... Verify vẫn giữ nguyên nội dung cụ
> thể nhất đã đề xuất, chỉ đi qua bằng force thay vì tiếp tục vòng lặp
> không hồi kết."

`--force` on `fgos discover` is exactly the override mechanism built for
this catch-22 — see `src/intake/discovery.mjs`'s `--force` branch (test
coverage for its two behaviors, override-and-log vs. refuse-when-
awaiting-human, is `tsk-5ld`'s own scope,
`docs/history/tsk-5ld-discovery-force-override-test-gap/CONTEXT.md`). It
does not weaken the verify string itself — the override is logged as an
explicit decision naming what was overridden, so the audit trail still
shows a real judge disagreement was consciously resolved, not silently
skipped.

## A second real reason to force: the judge is asking for planning's job, not exploring's

`tsk-535` (a bug fix, not a decomposition root) hit a related but distinct
version of this same override. The second-pass judge wanted the verify to
concretely check that `description` ends up non-empty — a fair ask in
principle — but writing the concrete test assertions for that belongs to
`fgos-coding-planning`, not `fgos-coding-exploring`:

> "Verify chưa xác định phải kiểm được description non-empty, đúng như
> second-pass nói. Nhưng viết test cụ thể là việc của `fgos-coding-planning`,
> không phải `fgos-coding-exploring` (SKILL.md: 'do not research implementation').
> Force qua, xem quyết định log."

`fgos-coding-exploring`'s own `SKILL.md` draws this boundary directly: locking
product decisions is exploring's job; researching and writing the
implementation-level specifics (including exact test shape) is planning's.
When a second-pass dispute is correct about *what* the verify should
eventually check but is really asking clarify to do planning's job early,
`--force` past it — logged — is the right move, same mechanism as the
red-first case above, different underlying reason.

## Related

- `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md`
  (`tsk-66o`) — the real capture this doc distills from.
- `docs/history/tsk-5ld-discovery-force-override-test-gap/CONTEXT.md` —
  test coverage for `--force`'s own two behaviors.
