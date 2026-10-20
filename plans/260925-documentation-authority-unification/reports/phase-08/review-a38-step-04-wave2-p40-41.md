# A38 review: Step 4 wave 2, parts 40 + 41 (set step04-030), pin dc24ce645

Reviewer: read-only. Sources read via `git show dc24ce645:<path>` (every doc-path/edge region plus whole-file grep for refs). Part 41 (core/skills/fgos-run/SKILL.md) is a separate file from part 40's six files, so seven file verdicts below. fgos-indexing is NOT in either payload (not reviewed here).

## Verdicts

| File | Stratum | Slots | Verdict |
| --- | --- | --- | --- |
| .claude/skills/ui-spec/CONVENTION.md | mandatory | 1 (skills-062 preserve) | ok |
| core/skills/_shared/capability-catalog.md | mandatory | 3 (2 render-join, 1 preserve) | ok |
| core/skills/_shared/executor-dispatch-fallback.md | mandatory | 20 (14 render-join, 3 park, 3 preserve) | REWORK |
| core/skills/_shared/planning-capability-awareness.md | mandatory | 3 | ok |
| core/skills/distill/references/deep-dive-protocol.md | mandatory | 2 | ok |
| core/skills/fgos-clarifying/SKILL.md | mandatory | 6 (1 patch, 2 patch render-join, 2 park render-join, 1 park) | ok |
| core/skills/fgos-run/SKILL.md (p41) | mandatory | 0 | ok |

Per set/stratum: step04-030 mandatory: 7 reviewed, 1 rework (14%, over 3%, so the set expands to every file; all seven files here are already covered, fgos-indexing and any other set 030 file belongs to its own part).

## Outcome defect

### core/skills/_shared/executor-dispatch-fallback.md: missing source slot for line 224
- Source line 224: `` `docs/history/two-layer-dispatch/DISCUSSION.md` D12: this is an optional, `` (start of section "Provider/tier judgment for an ad-hoc dispatch").
- The record has source preserve slots for lines 12, 33 and 151 only. Line 224 has no source-owner slot. The .agents and plugins render joins (class4-l-000021, class4-l-002019, line 225) say "canonical source disposition preserve", so they point at a slot that does not exist. The Step 5 exclusion list does carry history-019 for core line 224.
- Rule: every frozen census occurrence needs a first-class source-owner slot (L12-58(3), L12-60(8): render joins hang off a canonical source slot).
- Correction: add a source preserve slot, span line 224 columns 2..47, text `docs/history/two-layer-dispatch/DISCUSSION.md`, reason as for lines 12/33/151. It is a live existing path and an L12-10 history reference, so preserve is the right disposition. No diff.

Everything else in this file checked out:
- Parks at [239-240], [292], [311]: all three paths are absent at the pin. `docs/decisions/` holds only the generated index.md. The how-to path is absent from docs/how-to. The 0026 ADR is absent.
- Live-holder check for the 0026 parks (docs/platform/**): the only holder of the ADR 0026 passage ("Lớp còn thiếu", line 695 of docs/platform/runner/decisions/h-36d872fbb0e5.md, section "### 0026" at line 583) is that file. It is a candidate carriage file ("Canonical: No", "Implementation: Carriage only"). The other "Lớp còn thiếu" hits in docs/platform (agent-coordination proposals) are D0026 mentions, not the ADR passage. No live non-carriage holder, so park is correct.
- Render-join pairs (.agents lines 13/34/152/225/240-241/293/312 and the plugins copies) are keyed as source+1 offsets as expected, with sourceDisposition matching (preserve, parked).

## Slot-by-slot notes (all other files)

- ui-spec/CONVENTION.md skills-062, line 173 `cd docs/ui-spec/tools`: preserve is right. It is a command example in a generated project's convention (the tools live at .claude/skills/ui-spec/tools; docs/ui-spec/tools does not exist in this repo). It describes the target project's layout, so it is not a doc-authority link. Headerless file, so it is its own source owner, no renders. No other doc paths in the file (the .md names are surface-file examples).
- capability-catalog.md: source line 5 preserve (existing L12-10 portable plan.md convention; file exists). Render joins for .agents/plugins line 6 are correct. The 3 Step 5 exclusions (history-001/015/030) are listed. Other .md names are bare sibling filenames (not edges).
- planning-capability-awareness.md: source line 7 preserve, joins at line 8, S5 history-006/020/035 correct. Sibling links are relative and resolve.
- deep-dive-protocol.md: `docs/distillery/deep-dives/<topic-slug>.md` is an external-project output convention. Preserve under L12-10 is right, and the render join is labelled correctly.
- fgos-clarifying/SKILL.md:
  - skills-084, line 90 `docs/specs/runner.md` for RUL45: patch to docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules. The target exists. Heading `## Business Rules` is at line 25, so the anchor resolves. RUL45 is at line 78 and carries the untrusted-text trust-boundary rule the sentence cites (plus the log-normalization rule). Phase 9 timing and the record keep the live route unchanged until cutover. The hunk (-87,7 +87,7) lines up with the pinned bytes and keeps the backtick form. Applying it verbatim renders fine. The line is longer, which is harmless.
  - skills-015/148 are render joins at line 91 with sourceDisposition patch, no own diff, correct label.
  - Wrapped 0026 ADR path at lines 100-101: park as dead link, with a non-executable successor note to h-36d872fbb0e5.md. No live non-carriage holder (same analysis as above). The 2 render joins (class4-l-000040/002042, source+1 offset) are right.
- fgos-run/SKILL.md (p41): zero doc-path edges, which matches the file. It has only `../_shared/decision-question.md` (relative, resolves to core/skills/_shared/decision-question.md), bare `AGENTS.md`, and code paths under src/. Nothing to slot. The .agents/plugins copies carry no docs/ or plans/ paths either.

## Record-text notes (not rework)

- The successor note anchor `h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity` omits the double hyphen a GitHub-style slug gives for the heading `### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity` (expected `0026--native-first-dispatch-doctrine-launcherroottaskcapacity`). It is a non-executable note, so it does not block. Lead may want the note to name the heading text instead of a slug.
- The two class4 successor notes for the 0026 ADR cite "0026 and 0033 narrowing". The 0033 section is at line 1211 of the same file, which is accurate.

## Lead-judgment questions

1. executor-dispatch-fallback.md line 292: the parked how-to has a same-named, same-content successor at docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md. It is a live, non-carriage doc (migrated in tsk-5mh), but it sits outside docs/platform/**, so under your docs/platform-only holder test it stays parked. If the Lead counts docs/knowledge as an authority holder, this slot becomes a Phase 9 patch (L12-30), and so does the render-join pair for lines 293. I judged park acceptable per the stated test.
2. The RUL45 patch targets a carriage-candidate spec (Canonical: No). This matches how Phase 9 patches retarget docs/specs/** into the docs/platform map, so I did not flag it. Say so if patches must exclude candidate-only holders.

Status: DONE
Summary: Seven files reviewed across parts 40 and 41. Six are ok. executor-dispatch-fallback.md needs rework because source line 224 (history two-layer-dispatch DISCUSSION.md D12) has no source preserve slot, which leaves two render joins pointing at nothing. The 0026 and how-to parks were confirmed against docs/platform (only carriage holders). The how-to successor under docs/knowledge is a Lead question.
