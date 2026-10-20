# Review a38 — Step 4 wave 3, part 19 (set step04-023, second part)

Pin dc24ce645, both files read through the pinned payload and blobs. 2 slots reviewed (1 preserve, 1 parked, 0 patch). No diffs.

| File | Cat | Slots | Verdict |
| --- | --- | --- | --- |
| src/runner/dispatch/operation-prompt-templates.mjs | A | 1 parked (l-000273) | ok (see Lead-judgment question) |
| src/runner/dispatch/prepare.mjs | B | 1 preserve (l-000274) | ok |

## Outcome defects
None.

## Evidence
- prepare.mjs l-000274: wrapped path at lines 26-27, a single `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` D7 citation. The file exists in the pinned tree with 5 history commits, and the wording is "the named concept D7 introduces", i.e. provenance. Preserve is correct; the wrapped span is complete. No other docs paths in the blob.
- operation-prompt-templates.mjs l-000273 (line 3, `docs/architect/agent-coordination/contracts/flow-definition.md`): park witness re-checked by me. The docs/architect copy exists at the pin (retiring tree). The only other copy is docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md, a literal retired snapshot (carriage). Passage-content search over docs/platform, docs/knowledge, docs/reference, docs/tutorials, docs/specs for prompt-template registry / deterministic resolver / provenance renderer / `operation-prompt-templates` / templateId found no live holder. Hits are only the architecture manifest layer entry, runner spec RUL44 (worker prompt templates, a different mechanism), and unrelated mentions. The flow-definition contract itself has no prompt-template registry section (its "template" is `spec.operations[]`). Live agent-coordination README, spec.md and protocol-model.md state FlowDefinition is historical. So no live holder exists and a same-basename moved-verbatim patch (ruling 1) does not apply, because the retired copy is a snapshot under history/. Park is consistent with the witness.
- Line 4 `plans/260919-coordination-skill-harness-simplification/plan.md` does not exist at the pin (moved to archive/plans/ at the same name). Relocation is out of scope (ruling 9), and it is archived dated-plan provenance. Unslotted preserve is acceptable.
- Lines 11-13 and constants are runtime `.fgos/prompt-templates` / `core/prompt-templates` locations, not doc edges.

## Record-text notes (not rework)
- blockedReason carries a doubled "L12-62: A51, ..." prefix in reason (cosmetic).

## Lead-judgment questions
- l-000273: the citation reads "per <flow-definition.md> and <plan.md>", the module's design-origin basis (Unit I04 / Phase 3). Ruling 2 of L12-62 says design-origin provenance preserves even if a live statement exists. The sibling claim-port.mjs `tsk-40m (docs/architect/doing-coordination-redesign.md)` is preserved as design-origin evidence. Parking is the conservative outcome (nothing is written), and wave 2 already accepted it. Should the Lead prefer preserve for consistency? Not treated as rework.

## Counts
Set step04-023 part 19: files reviewed 2 (A 1, B 1), outcome rework 0, slots 2 reviewed / 0 rework.

Status: DONE
