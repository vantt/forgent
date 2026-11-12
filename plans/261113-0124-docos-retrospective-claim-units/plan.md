# Retrospective writer adds evidence to claim units

Status: proposed. Item: `p-ixrbglli5o` ([backlog](../../docs/backlog.md)). Lane: `lead:DOCOS`. Build step 1 of the [documentation area map](../../docs/platform/documentation/spec.md#4-build-order).

## Outcome

The retrospective writer stops opening one document per work item. For each item it states one to three claims, finds the unit that already carries each claim, and adds the item there as evidence. A claim no unit carries is handed, with its material, to an admission request item, and the retrospective item reaches cleanup on that record. New user topics then grow with distinct claims, not with items (today 479 topics for 479 documents).

Specs this implements: [write door 6.4](../../docs/platform/documentation/subcomponents/write-door/spec.md#64-the-retrospective-writer), [document identity 5.2 and 8.7](../../docs/platform/documentation/subcomponents/document-identity/spec.md#52-the-unit-that-carries-coordinates), [admission edge case "a retrospective item cannot be parked"](../../docs/platform/documentation/subcomponents/admission/spec.md#10-edge-cases).

## Acceptance criteria (from the backlog row)

1. A material-only retrospective item reaches cleanup through a named evidence path (the handoff record), without weakening the gate or manufacturing a decision. The gate still refuses engine records and still checks every existing kind as today.
2. The writer grows or re-attests by default; it opens a slot (`fgos doc reserve`, `fgos topic register`) only when a person asks.
3. New active topics per retrospective item are counted before and after, on real items.

## Prior art (reused, not rebuilt)

| Exists | Where | Use here |
|---|---|---|
| Re-attest: a capture linked to an existing document | `doc.attest` reducer, `src/state/knowledge-registry.mjs:741`; `fgos knowledge attest`, `bin/fgos.mjs:1680`; gate branch in `checkRetrospectiveContentForId`, `src/state/cleanup-harness.mjs:361` (tsk-555) | the evidence link in the registry; already accepted by the gate |
| Re-attest branch in the skill | `domains/coding/skills/fgos-coding-knowledge/SKILL.md` step 1 (commit `a86e4b417`) | becomes the default path instead of the exception |
| Parent fallback for split groups | `checkRetrospectiveContent`, `cleanup-harness.mjs:449` (tsk-5fv) | unchanged; the handoff kind is checked inside the per-id function so leaves inherit it |
| Work items as requests | `fgos submit` | the admission request is an ordinary item until the admission phase adds the reviewer |

Missing: a record that says "this item's material went to request R", and a gate kind that accepts it. Also missing: an evidence section shape in a unit's body.

## Phases

| # | Phase | Depends on | File |
|---|---|---|---|
| 1 | Handoff record and the gate's fourth kind (work-state contract change) | — | [phase-01](phase-01-handoff-record-and-gate.md) |
| 2 | Skill: claims, locate, grow with evidence, or hand off | 1 | [phase-02](phase-02-knowledge-skill-claims-and-evidence.md) |
| 3 | Measure on real items and land | 2 | [phase-03](phase-03-measure-and-land.md) |

## Not in this plan

- `fgos doc locate` through pkm with OHS (build step 3). Until it lands, the skill locates with ripgrep over the user roots plus the registry listing, as arm A of the trial did (it opened the right document in 19 of 20 cases); the skill names `fgos doc locate` as the replacement so step 3 changes one line.
- The admission reviewer, frame and ceiling (build step 4). Until then a request item waits for the owner like any proposed item; nothing is created from it.
- Code-level refusal of `topic register` and `doc reserve` from a writer (admission phase, effect table 6.1). Phase 2 removes them from the writer's flow; the door check comes with admission.
- Merging the existing 479 story documents into claim units (observer, build step 6).

## Risks

- **The gate change is a contract change owned by work-state.** It lands with its owning proof in `test/state/cleanup-harness.test.mjs` and a row in the knowledge-registry contract; no existing case is loosened.
- **Grow into the wrong unit** (the trial's remaining error). Bounded: evidence is additive and reversible by the observer; the writer refines the claim text only when the item changed it.
- **Concurrent sessions in the main checkout.** Code work runs in a linked worktree; commits by pathspec; heavy IO under the doc-heavy lock.

## Rollback

Revert the skill commit: the writer returns to reserve-per-item. Handoff events already written stay readable; the gate keeps accepting them (removing a kind would strand items already at cleanup).
