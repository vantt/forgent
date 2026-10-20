# Review a38 Step 4 wave 3, part 23 (set step04-026)

Pin dc24ce645 (author input), worktree 774adbd01. Category A (prior wave 2 report: review-a38-step-04-wave2-p36.md).

## src/state/knowledge-registry.mjs

Set step04-026, stratum maintained code comments. Verdict: ok. Slots reviewed: 10 of 10 (8 parked, 2 preserve, 0 patch).

Whole-file read: pinned blob 812 lines read; every `docs/` occurrence listed (lines 20, 45, 59-62, 65, 77-78, 88, 210-211, 537, 646, 733, 737, 748). Lines 45/65/77-78 are a template/prefix check (`docs/${purposeSlug}/...`, `startsWith('docs/')`), not path edges. Behavior: record diff is empty (`diff: []`), no patch, no code change. stepFiveExcluded is empty, which is correct (no runtime strings carry a legacy path).

Slot checks (column spans verified against source text):
- class6-l-000438 (L20 §5.5/§14.1 only diataxis), 000439 (L88 §7.2 rule 1), 000440 (L210-211 split path across a comment wrap, §7.3 docId durable identity), 000441 (L537 §7.3 doc.promote), 000442 (L646 §13.5 rule 6), 000443 (L733 §7.4 Attestation), 000444 (L737 `docs/architect/...md` elided form, §7.2 example schema), 000445 (L748 §14.3): all parked, phase9-carry, target null. Spans and matchedExpression match the source. Every cited section exists in the carrier docs/platform/proposals/knowledge-registry-redesign.md (headings at lines 126, 241, 260, 287, 502, 521, 550), and the original docs/architect/knowledge-registry-redesign.md still exists at the pin, so a retarget patch is not available. The carrier header says "Canonical: No ... Do not use this for: Current authority", so it is not a patch target.
- Preserve L61 `docs/../evil/guide.md` and L62 `docs/ok/../escape.md`: literal adversarial path examples in a comment, never-existed (tree 0 / history 0), L12-10/49 exception. Correct.

Passage-content witness for parked slots: my independent search (docs, core, domains, README, AGENTS, excluding archive/.fgos) for doc.promote/doc.attest/sourceCaptureIds/doc.supersede/knowledge-registry-redesign found no live holder of the section-specific rules. Hits: docs/explanation/compound-learn-artifact-registry.md (explicitly "the full spec lives elsewhere ... this doc is the narrative, not a duplicate"; it records code-review fixes, carries no section numbers, and does not restate §5.5/§7.2/§7.3/§7.4/§13.5/§14.x text), domains/coding/skills/fgos-coding-knowledge/SKILL.md L44 (another legacy-path citation, outside this file), docs/platform/git/spec.md (unrelated), history/proposal carriers. Park is therefore right.

Defects (OUTCOME): none.

Record-text notes (not rework):
1. The recorded passage witness uses weak terms (`docLifecycle`, `sourceCaptureIds`) over roots docs/platform and docs/knowledge only; hits are test logs and carriage. It does not cover docs/explanation, which contains the design-origin narrative for tsk-28x (frontmatter `authoritative_for` claims the redesign). The conclusion holds (that doc disclaims restating the spec and has no section-level holder), but the witness would be stronger if it named that doc as examined and rejected.
2. reason/blockedReason text is duplicated ("A51, L12-30/31/32/58/60: L12-62: A51, ...") and the passage is repeated verbatim; cosmetic.

Lead-judgment question: whether docs/explanation/compound-learn-artifact-registry.md should be named as the Phase 9 candidate successor note for these parks (it is the live, registered doc about the redesign, but it is not a spec holder). I recommend keep parking as recorded, per the L12-62 uncertain-successor rule.

Counts: set step04-026 reviewed 1 file / 10 slots / rework 0. Stratum maintained code comments: 1 reviewed / 0 rework.

Status: DONE
Summary: Final-state review of src/state/knowledge-registry.mjs finds all 8 parks and 2 literal-example preserves correct, with an empty diff so no behavior change. Only record-text notes, no rework.
