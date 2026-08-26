# plan — tsk-4ah: orchestrator vocabulary disambiguation pointer

Mode: tiny

0 mode-gate flags apply (no auth, authorization, data model, audit/
security, external systems, public contracts, cross-platform, existing
covered behavior, weak proof, or multi-domain concern) — three exact,
independent docs edits, each fully specified in the item's own
description with verified file:line evidence (`RESEARCH.md` Round 1).
`impact-analysis` gate: not applicable — no code/blast-radius proof point
in this plan, docs-only.

## Approach

Chosen path: add exactly the 3 pointers the item names, nothing else.
Alternatives rejected: rewriting `DISCUSSION.md`'s body to explain the
vocabulary split inline (rejected — item's own "Nguyên tắc xử lý" forbids
touching anything in `docs/history/` beyond one banner at the top of one
file, frozen-record convention); consolidating all 3 links into one new
standalone doc instead of 3 inline pointers (rejected — item asks for
pointers at the reader's real point of entry, not a fourth doc to
discover).

Files touched, in this order (no dependency between them, order is just
cheapest-to-verify-first):

1. `docs/explanation/why-the-launcher-vocabulary-word-guard-was-retired-
   right-after-tsk-1s5-fixed-it.md` line 51 — replace the dead
   `docs/decisions/0031-....md` citation with a citation to
   `docs/specs/runner.md`'s `### 0031 — Bỏ guard cấm từ orchestrator sau
   khi 0029 đã gán nghĩa mới` heading (confirmed real, line 2107,
   `RESEARCH.md` point 5). Honors the item's own point 2 verbatim.
2. `docs/history/orchestrator-worker-slots/DISCUSSION.md` — insert one
   banner block right after the `# orchestrator-worker-slots — DISCUSSION`
   H1, before `Item: \`tsk-2sj\`.` — same anchor position as the precedent
   (`runtime-claim-doing-separation/CONTEXT.md`'s SUPERSEDED banner sits
   directly under its own H1, `RESEARCH.md` point 3). Banner states: this
   doc uses "orchestrator" in ADR0029 D17's NEW sense (T0 composition
   layer), distinct from ADR0026's retired sense (renamed "launcher" by
   ADR0028) — points to `docs/decisions/index.md` lines 28-32 (the full
   chain) and to the explanation doc from point 1. No other line in
   `DISCUSSION.md` changes (honors the item's own point 1 and Acceptance
   criteria's "không sửa nội dung kỹ thuật nào khác").
3. `docs/specs/reading-map.md` line 15 — append one short pointer sentence
   to the existing `docs/decisions/` bullet (the one containing "hồ sơ
   quyết định dài hạn...", confirmed at line 15 in `RESEARCH.md` point 6):
   note that "orchestrator" is a pinned term whose meaning changed
   mid-stream (0026→0028 old sense, 0029 new sense) and point to
   `docs/decisions/index.md` lines 28-32. No other line in
   `reading-map.md` changes.

Risk map: all three edits are additive-only, single-paragraph/sentence
insertions with no existing prose removed or reworded — risk is `light`
as already recorded on the item. No proof point beyond the verify command
below is needed; nothing here touches code, tests, or a public contract.

## Shape

Not a split — one honest, indivisible piece: three small, independent
doc edits that together close one disambiguation gap. No child items.

`verify` (already set on the item from discovery's `clear` verdict, still
accurate): confirms the banner landed in `DISCUSSION.md`, the dead link in
the explanation doc was replaced with a real `runner.md` citation and the
old dead path is gone, and the `reading-map.md` pointer landed:

```bash
grep -q "ADR0029" docs/history/orchestrator-worker-slots/DISCUSSION.md && grep -q "docs/specs/runner.md" docs/explanation/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md && ! grep -q "0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-gan-nghia-moi.md" docs/explanation/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md && grep -q "orchestrator" docs/specs/reading-map.md
```

Concrete cases worth proving at `tiny` depth: (a) exactly 3 files changed,
nothing else under `docs/history/` touched — checked by `git status
--short` at return time showing only these 3 paths plus this feature's own
`docs/history/orchestrator-vocabulary-disambiguation-pointer/` dir; (b)
byte-identical elsewhere — checked by reading each file's diff and
confirming no line outside the stated insertion/replacement changed.

## Outstanding questions

None
