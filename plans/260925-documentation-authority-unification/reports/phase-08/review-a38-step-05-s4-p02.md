# Review a38 Step 5 seam 4, part src-p02

Payload: s4-src-p02.json (10 files, 6 items, 0 dynamic tuples, 0 parked). Pin 95301cb9a (ancestor of review HEAD).

## Per file

| file | verdict | items |
|---|---|---|
| core/skills/_shared/capability-catalog.md | ok | 1 (reference-000279) |
| core/skills/_shared/executor-dispatch-fallback.md | ok | 4 (000280, 000281, 000282, 000283) + inherited diff |
| core/skills/_shared/planning-capability-awareness.md | ok | 1 (000284) |
| catchup-self-recovery.md, coding-worker-contract.md, fgos-cli-fallback.md | ok (no Step 5 items) | 0 |
| core/skills/distill/SKILL.md, references/consult-protocol.md, deep-dive-protocol.md, extract-rules.md | ok (no Step 5 items), see Q1 | 0 |

## OUTCOME defects

None.

- All six items are admitted `docs/history/**` navigation pointers: "shared awareness cluster (...)", "D2/D3/D12" design-provenance citations. The role is navigation and the disposition is preserve. The targets are under docs/history, not docs/specs or docs/architect, and the passages do not need a live holder. Preserve is right (dated history; no relocation).
- The same-passage preserve outcomes agree with the Step 4 physical prior joins. Verified for 000279 and the executor-dispatch-fallback slots at lines 12, 33, 151 and 224.
- The diff in executor-dispatch-fallback.md (line 292, `docs/how-to/wire-a-skills-classify-...` -> `docs/knowledge/how-to-wire-an-existing-skill-s-.../wire-a-skills-classify-...`) is on a SOURCE file (`core/`). Its inverse rollbackDiff is exact and symmetric.
  - The new target exists at the pin; the old `docs/how-to/` path did not.
  - It is the Step 4 patch carried over unchanged (step04-030 line 11, disposition patch). It is not a new Step 5 decision.
  - Output delta: the render copies `.agents/skills/_shared/` and `plugins/fgOS/skills/_shared/` follow the source via `npm run build:skills`, not by hand. Their Step 5 records exist.
  - No new admitted item in this part carries the hunk, so diffHunk is null on all six items. This fits an inherited Step 4 slot, but see the record-text note.

## Record-text notes

- N1: every resolverWitness reads `existsAtPin: false`. This is factually wrong for all six history targets, which exist at pin 95301cb9a and at HEAD:
  - `docs/history/agent-coordination-foundation/plan.md`
  - `docs/history/two-layer-dispatch/DISCUSSION.md`
  - `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`

  The preserve outcome stays valid. The witness rule text is "retained ... as shown by own passage", not a "retained" existence claim. Correct the witness field, or explain what it measures.
- N2: the executor-dispatch-fallback diff is applied in this entry, but the line-292 patch has no item in this part. The record should name the inherited slot (priorRecordRefs line 11, `inheritedSourceSlots`) so a reader sees that the diff is not orphaned. The record file carries `inheritedSourceSlots`, so this is probably already satisfied there.
- N3: `proofCommand: "missing"` and the proofScope "unexecuted" on every item match the Step 5 records-only stance. This is not a defect.

## Lead-judgment questions

- Q1: Zero-item entries contain doc-path text with no Step 5 census or prior origins.
  - `core/skills/distill/references/consult-protocol.md:22` cites `docs/reference-learning-system.md`. That target is absent at the pin and appears in no step-03/04/05 record I found, except as a string in `scripts/generate-shipped-path-inventory.mjs`.
  - `docs/distillery/...` appears in distill SKILL.md (lines 58, 119), consult-protocol (30, 49), deep-dive-protocol (27) and extract-rules (76). These are "host path" runtime hints. I confirmed only deep-dive-protocol has Step 4 coverage (step04-030). The others rest on Step 3 or on census exclusion.
  - Confirm that the census owns these. If they were wrongly excluded rather than non-references, they are missed references and not Step 5 outcome errors. I found no evidence they were wrongly excluded.
- Q2: `catchup-self-recovery.md:47` (`docs/how-to/diagnose-a-verify-fail-...md`) has no Step 5 origin. step-05-population-references line 1354 shows the render copy under `.agents/skills`, and Step 3 batches cover the string. This looks correct, because the source is handled by a prior step and the render copy follows it.

Counts: files 10; items reviewed 6 (all ADMIT, all preserve); dynamic tuples 0; parked 0; outcome defects 0; record-text notes 3; Lead questions 2.
