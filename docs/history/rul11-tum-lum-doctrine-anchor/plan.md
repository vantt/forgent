# plan.md — tsk-7u7: lock RUL11 (tùm lum, not heavy) into doctrine

Mode: small (flags: 0 of the ten hard-gate/standard triggers apply — no
auth, no data model, no audit/security, no external system, no public
API/handoff-contract change (`docs/routing-handoff-contract.md` untouched),
no cross-platform surface, no existing covered behavior modified (this is
pure addition, RUL1-RUL10 untouched per the item's own boundary), no weak
proof area, single domain. Three files touched + one state write is why
this is `small` rather than `tiny` — "a few files, no gray areas", not "a
couple of files, one direct task". No `fgos-routing` Orient handed a lane
into this session — decided here directly per fgos-coding-planning's
direct-entry fallback, reading `fgos-routing`'s own Mode-gate table.)

docsRef: `docs/history/rul11-tum-lum-doctrine-anchor/` (registered on the
item; no `CONTEXT.md` exists — discovery verdict was `clear`, which skips
`exploring`, so there is no exploring-locked decision set to cite. This is
a pass-through single piece, not a split, so `fgos-coding-validating`'s
D-ID-citation requirement for child specs does not apply here.)

## Sources already locked (no re-derivation)

- Item's own description (verbatim, `fgos show tsk-7u7`) already fixes:
  the exact RUL11 sentence, the exact anchor phrase (one unwrapped line:
  `khong phai no nang ma no tum lum`), which file gets which piece
  (RUL11 → `docs/specs/platform-foundations.md` Business Rules; anchor →
  `AGENTS.md`), and the boundary (add, never touch RUL1-RUL10).
- `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` D7 —
  the concrete evidence this law generalizes from: tsk-2uf-1 was
  re-designed from "add a --work flag" (an 11th door bolted onto ten
  scattered ones) to gathering `dispatch.mjs` (2204 lines, 6 tangled
  concerns) into bounded modules around a named `prepareDispatch(unit,
  opts)` concept.
- `docs/platform-foundations.md:187-209` (L8, the un-summarized original
  doctrine-placement law `docs/specs/platform-foundations.md`'s RUL9 is
  derived from) — the three real tests this change must pass:
  1. **Placement test (one sentence):** "does this rule need to hold even
     when no workflow is running?" — yes for RUL11 (a working philosophy,
     not a workflow-scoped procedure) → belongs on the standing sheet
     (AGENTS.md), not a reference doc loaded on demand.
  2. **Transport rides with the order:** the AGENTS.md line must carry the
     command inline, not just point at `docs/specs/platform-foundations.md`
     — a rule that only cites where the real instruction lives "behaves
     exactly like no rule at all" per L8's own wording.
  3. **Anchor-suite:** the phrase must be automatically checked by name —
     this item's own test file is that check.
- `docs/history/rul11-tum-lum-doctrine-anchor/RESEARCH.md` (discovery
  round, 2026-08-18) — confirms: RUL11 is the correct next slot in
  `platform-foundations.md`'s own RUL-series (per-file numbering, no
  collision with `work-state.md`'s unrelated RUL11 or `runner.md`'s
  RUL49); `D-ADR0036` is the correct next global decision number (highest
  found: `D-ADR0035`); no existing test asserts an anchor phrase for any
  RULn today (this item's test is the first of its kind).

## Impact-analysis capability gate

Not applicable — this plan writes no proof point that leans on
blast-radius evidence. The change is two doc edits (a spec's Business
Rules line + a doctrine-layer paragraph) and one new test file; no
runtime code path is touched, so `fgos tool query --capability
impact-analysis` was not queried for this plan.

## Approach

One honest piece, done in this exact order (each step commits before the
next per the one-commit-per-item convention only applies at Execute's own
final commit — these are the in-order steps `fgos-coding-implement` will run,
not separate items):

1. **`docs/specs/platform-foundations.md`** — two edits to the same file:
   - Business Rules section (after line 73, `RUL10`): append
     `- **RUL11.** <the law, chưng từ phát biểu gốc — see Shape below>.`
   - "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)" section
     (after the `### 0035` entry, before `## Edge Cases Settled`): append a
     new `### 0036 — Khoá RUL11: "tùm lum", không phải "nặng"` entry, same
     Bối cảnh/Quyết định/Hệ quả subheading shape the `0001`/`0009`/`0014`/
     `0035` entries already use, carrying the user's phát biểu verbatim
     (per the item's own instruction: "luật là bản chưng, nguyên văn là
     nguồn").
2. **`fgos decision write`** — record the same `D-ADR0036` text/rationale
   into `state.decisions` with `--scope platform-foundations`, matching
   every existing row's own convention (`docs/decisions/index.md`'s
   generated table). Then `fgos decision-index` to regenerate
   `docs/decisions/index.md` so the new row actually appears (never
   hand-edit that generated file — its own header says so).
3. **`AGENTS.md`** — one short paragraph/bullet block, placed near
   `## Changing a locked law` (same doctrine-weight neighborhood, before
   the fgOS Workflow section): states the RUL11 principle in one or two
   sentences AND an imperative ("when something reads as tùm lum,
   consolidate — repeatedly, scale is never an exemption"), carrying the
   anchor phrase verbatim on its own unwrapped line so a line-based search
   matches it (same shape L8's own `awaiting-approval is the DEFAULT
   ceiling, overridable` line in `fgos-coding-driving/SKILL.md` already
   uses for exactly this reason — precedent for "pin an anchor on one
   line inside a longer file").
4. **`test/docs/rul11-anchor-phrase.test.mjs`** — new file (first of its
   kind, per RESEARCH.md's finding #4): asserts (a) `AGENTS.md` contains
   the anchor phrase on some single line, (b) `docs/specs/
   platform-foundations.md` contains a `**RUL11.**` line, (c) that RUL11
   line's content matches (word-for-word or close paraphrase check on) the
   locked law text, (d) a short header comment naming this as the first
   RULn anchor-assertion test, opening the pattern rather than
   retrofitting RUL1-RUL10 (closes the item's own boundary #4 note about
   RUL9 silent-mismatch risk).
5. **Verify.** `npm test -- test/docs/rul11-anchor-phrase.test.mjs` (the
   item's own `work.verify`, already synced at discovery — no placeholder
   to promote here).

## Files touched

- `docs/specs/platform-foundations.md`
- `AGENTS.md`
- `test/docs/rul11-anchor-phrase.test.mjs` (new)
- `docs/decisions/index.md` (regenerated, not hand-edited)
- `docs/history/rul11-tum-lum-doctrine-anchor/RESEARCH.md`,
  `plan.md` (this file)

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| RUL11 slot collision | Low — checked in RESEARCH.md, per-file namespace confirmed | grep already run; test asserts the exact `**RUL11.**` line exists once |
| `D-ADR0036` collision | Low — highest existing is 0035, confirmed across `docs/decisions/index.md` + every `docs/specs/*.md` | `fgos decision-index` regeneration surfaces any duplicate scope/text visibly; a second decision with the same number would just render as two rows, not a crash — reviewed by eye before commit |
| Anchor phrase placement/format (L8 test 1-3) | Low-medium — the one part of this item genuinely judged, not just transcribed | test asserts the phrase's exact text on one line in `AGENTS.md`; plan cites L8's three tests explicitly above, not just RUL9's summary |
| Test over/under-matching | Low | test written narrowly (exact anchor string, exact `**RUL11.**` marker), run once before commit |

No medium/high-risk item needs a `fgos-coding-validating` proof point beyond
what Execute's own real `npm test` run already provides.

## Split decision

No split. This is one honest, bounded piece — two doc edits, one decision
record, one new test, already fully specified by the item's own
description. `fgos graph --what-if` was not run: there is exactly one
candidate ordering (docs → decision record → doctrine anchor → test), not
multiple pieces to compare for `topUnblock`/`criticalPath`.

## Outstanding questions

None
