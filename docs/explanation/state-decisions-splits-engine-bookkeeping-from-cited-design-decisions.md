---
type: explanation
title: state.decisions splits engine bookkeeping from cited design decisions
tags: []
source_capture_ids: [tsk-1ud]
---
# state.decisions splits engine bookkeeping from cited design decisions

`tsk-1ud` implemented steps 1 and 3 of decision D7: a two-zone contract
for where fgOS's design decisions live, and a real cleanup of the
machine-readable zone so a future agent-facing consumer can actually use
it.

## Two zones, two readers

D7's own contract: `state.decisions` is the authoritative zone for an
**agent** to read — short, evidence-bearing entries. `CONTEXT.md` is free
to optimize for a **person** — full narrative prose, unconstrained
markdown. `tsk-1ud` was a deliberate gate: no skill gets wired to read
`state.decisions` until this item's own cleanliness check passes.

## The measured gap that motivated it

Real counts against `.fgos/state.json`, 2026-08-09:

> "CONTEXT.md: 199 file, ~1.973 token/file (cao nhất 4.978), MỌI skill
> đọc (fgos-coding-planning/SKILL.md:14,48,66 đọc CONTEXT.md để lấy quyết định
> đã lock). state.decisions: 1.711 bản ghi, ~100 token/bản, 0 skill đọc
> — chỉ `fgos show <id>` và một bộ đếm."
> — real work item description, id `tsk-1ud`

Roughly a 20x cost difference per read, paid on every `clarify`/`planning`
pass, for a zone (`CONTEXT.md`) that could in principle be backed by the
cheaper zone (`state.decisions`) — except the cheaper zone wasn't clean
enough yet for anything to actually read it.

## What was actually wrong with the cheap zone

Of 1,711 real records, 592 (35%) were pure engine bookkeeping, not design
decisions at all — identifiable only by matching literal text prefixes
("discovery caller-supplied", "decompose verdict", "auto-approved",
"fgos-coding-validating verdict"), written by `addDecision` calls inside
`src/intake/discovery.mjs` and `src/intake/plan.mjs`. The remaining
1,119 (65%) were real design decisions, but 130 (12%) had no rationale
and 180 (16%) had a rationale under 80 characters.

## A correction that changed the item's own scope, made mid-investigation

D7's original rationale had claimed `store.mjs:835` didn't enforce a
rationale at write time. That claim was wrong, and the correction (event
log seq 10223) removed an entire planned step before implementation
started:

> "addDecision (`src/state/store.mjs:826-838`) CÓ validate: throw
> StoreError('validation') khi text hoặc rationale rỗng ... 130 bản thiếu
> rationale đều có ts từ 2026-07-16 đến 2026-07-29, ZERO sau 2026-08-01
> ⇒ DI SẢN CŨ, không phải lỗ hổng đang mở. HỆ QUẢ: bước 2 của D7 ('cưỡng
> chế rationale ở tầng store') KHÔNG CÒN VIỆC GÌ PHẢI LÀM."
> — real work item description (correction section), id `tsk-1ud`

The store already validated non-empty rationale on write; the 130
missing-rationale records were legacy data written before that
enforcement existed, not a live gap. The item's own scope shrank from
three planned steps to two (steps 1 and 3) as a direct result of
verifying this claim instead of trusting it.

## The two real fixes

1. **Separate engine bookkeeping from design decisions structurally, not
   by string-matching.** A new `kind: 'engine' | 'design'` field on the
   decision payload lets a consumer filter without prefix-matching. The
   item's own description names why this mattered: prefix-matching
   itself is the exact anti-pattern this whole investigation was
   critiquing elsewhere in the same code
   (`gate.ask.includes(<literal>)` in `decompose.mjs:638,646`) —
   reproducing it here to fix a different instance of the same problem
   would have been self-defeating.

2. **Require design decisions to cite checkable evidence.** A rationale
   must reference a `file:line`, an event `seq`, or a real measurement —
   an opinion with no citation isn't evidence. Enforced only forward from
   2026-08-01 (the point at which the legacy gap had already gone quiet)
   — the legacy 130/180 records were explicitly left alone; the log is
   append-only, and rewriting history wasn't attempted.

## The recurring failure pattern this item exists to stop

The item's own description names three separate instances of the same
shape, observed across one investigation, before deciding this couldn't
be left as a fourth:

> "Ba lần trong cùng phiên thảo luận đã thấy mô-típ 'ghi trước, nối dây
> sau' mà dây không bao giờ được nối: quy ước `## Outstanding questions`
> (skill không biết nó tồn tại đến `tsk-5hg`), `askHistory` (314 entry,
> 184KB, 0 nơi đọc), `state.decisions` (1.711 bản, 0 skill đọc). Item
> này tồn tại ĐÚNG để chặn việc lặp lại — nó là cổng, không phải một
> bước song song."
> — real work item description, id `tsk-1ud`

A data-writing convention with no consumer wired to read it is easy to
create by accident (each of the three examples above shipped correctly
on its own terms) and easy to miss until someone goes looking for who
actually reads it. This item's own gate — clean the zone *before* letting
anything depend on it, verified by a real mechanical check counting
`kind` coverage and citation coverage — is the shape chosen specifically
to make a fourth recurrence structurally harder, not just noted as a risk.

## What deliberately stays out of scope here

Wiring `fgos-coding-planning`/`fgos-coding-validating` to actually read
`state.decisions` instead of `CONTEXT.md` (the payoff this cleanup makes
possible) is a separate, hard-dependent follow-up item — this item only
makes that future read safe, it doesn't perform it. Rewriting
`CONTEXT.md`'s own authoring convention is D7's own step 6, also
separate.
