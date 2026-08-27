---
authoritative_for: why fgOS's coding-domain skills were rewritten to a 300-line SKILL.md + references/*.md shape, why citation rules differ between product/shippable skill files and process/build-time docs, and the safety net used while doing a mass skill-prose rewrite
framework: diataxis
mode: reference
---

# Why fgOS skills split into `SKILL.md` + `references/`, under 300 lines each

fgOS's skill files had grown long and script-heavy — seven coding-domain
skills were measured well past a 300-line target (`fgos-coding-driving`
645 lines, `fgos-coding-exploring` 557, `fgos-coding-planning` 532,
`fgos-coding-validating` 513, `merge-loop` 437, `fgos-coding-implement`
436, `fgos-fanout` 358), hard to read and hard to maintain. This
rewrite applied Anthropic's own skill-authoring doctrine (already present
on the machine — `skill-anatomy-and-requirements.md`,
`writing-effective-instructions.md`, `token-efficiency-criteria.md`) and
an upstream reference project's own convergent shape (`beegog` v2.7.0:
`skills/` holds only `SKILL.md` + `references/*.md`, instruction-only, no
embedded scripts — decision `0025` names this directly: "`skills/**`
doctrine (the product)... never migrated — it is prose the model reads").

The same upstream project had also consolidated hard, from 18 skills down
to 9 (three merged into one shaping skill, one retired outright with its
work folded into planning) — evidence that skill-count reduction, not just
per-file length, was a real option worth surveying, though this item's own
scope stayed at splitting/shortening rather than merging fgOS's own set.

## The citation-boundary rule: producer role, not folder location

> D1: Ranh giới trích dẫn ID governance... xác định theo VAI TRÒ SẢN XUẤT
> của artifact, không theo vị trí thư mục

Process/build-time artifacts (`docs/history/`, `docs/decisions/`,
`docs/backlog.md`, a work item's own `CONTEXT.md`, `docs/specs/`) keep
`tsk-37i`'s citation rule unchanged — ADR/`RUL` ids need a gloss, a
`D`-local id only cites inside its own home `CONTEXT.md`. Product/shippable
artifacts — `.agents/skills/*/SKILL.md` (the real source) and its
`references/*.md`, confirmed byte-identical to `plugins/fgOS/skills/*`
today — drop ID governance entirely, applied directly at the `.agents/skills`
source rather than on a downstream copy.

The reasoning traces to what actually ships: `plugins/fgOS/.claude-plugin`
contains only `plugin.json` + `skills/` — verified directly by listing it
— carrying no `docs/` content at all when published through the plugin
marketplace. Cross-checked against the upstream project's own practice:
it keeps citations only when the referenced material ships *alongside* the
distributed package (gloss + a pointer-integrity check + a durable target)
— a condition fgOS's real publish channel doesn't meet, so that model
doesn't transfer. `.claude/skills/*` (the three-line generated wrapper) is
out of scope entirely — it has no body of its own to carry a citation in
the first place.

## A safety net before touching what every session reads every time

> D2: git tag pre-skill-prose-cleanup-tsk-56w trên main tại SHA hiện tại,
> bắt buộc trước khi item con đầu tiên của tsk-56w vào stage executing

Skills are re-read by every session, every time — a mistake here has
unusually wide blast radius compared to an ordinary code change. A tag
was cut on `main` before any child item began executing specifically so a
later regression could be traced against, compared to, or rolled back from
a known-good point.

## Quality bar and the proof shape for a skill-prose change

> D4: Áp dụng chuẩn skill-creator (SKILL.md dưới 300 dòng, references/*.md
> dưới 300 dòng/file, không trùng lặp nội dung, viết imperative form) cho
> toàn bộ 7 skill

> D5: Quy trình đảm bảo chất lượng... verify theo đúng khuôn
> docs/how-to/write-verify-for-a-skill-prose-change.md (POSITIVE + NEGATIVE,
> --hidden khi quét .claude/skills hoặc .agents/skills)... smoke-test that
> theo mẫu smoke-test-fgos-code-implement-with-a-trivial-item.md, tổng quát
> hoá cho cả 7 skill

Rather than inventing a new proof shape, this reused two conventions that
already existed: a verify clause proving both that new content exists
(POSITIVE) and that the old pattern is gone (NEGATIVE) — always run with
`rg --hidden` against `.claude/skills`/`.agents/skills`, since `rg`
otherwise silently skips hidden directories by default (a known trap,
`tsk-f38`); and, after any one skill was rewritten, a real smoke test —
claim a disposable chore item and let the just-edited skill actually drive
it, confirming `attempts: 1, errorClass: null` in the real event log —
before trusting that edit, generalized here to all seven skills rather
than only `fgos-coding-implement`. Verify was deliberately scoped to prove
the mechanism, never asked to prove prose "reads coherently" — that stays
a human/`fgos-coding-validating` judgment, not a mechanical check.

## A scope collision caught and resolved before it happened

> D6: Thu hẹp phạm vi tsk-2sp, giao 61 file skill... cho tsk-56w sở hữu,
> tsk-2sp chỉ còn 12 file không-phải-skill

A sibling item (`tsk-2sp`) had planned to apply `tsk-37i`'s *original*
citation rule (add a gloss) to the same 73-file baseline this item's own
D1 had just locked a *stricter* rule for (strip IDs entirely, no gloss) on
61 of those 73 files — all `.agents/skills/**/SKILL.md` +
`plugins/fgOS/skills/**/SKILL.md`. Running both unchanged would have meant
`tsk-2sp` adding glosses this item would then have to delete again — wasted
work and a likely literal merge conflict on the same lines. `tsk-2sp`'s own
description was edited down to the 12 real non-skill files
(`docs/specs/*` + `docs/backlog.md`); once split, the two items no longer
overlapped and could run in parallel with no dependency between them.

## Source

`tsk-56w`, decomposed into 9 independently-workable children (disjoint
footprints, no ordering dependency) covering all seven over-length skills.
Verify: `npm test`.
