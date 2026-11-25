# Phase 2: Area spec and v1 contracts

The spec comes before the code (L5 question 2). It names the crate's owner, its tier, its ports and its contracts.
This phase writes only new files, so it can start now. Registering the component in the model, the generated views,
the reading-map row and the RUL102 amendment are phase 3 (they sit in files a running plan holds; see plan.md
"Owner questions" 3).

## Inputs

- The discussion's `#interface` (contract, fact registry, payload union, delivery enum, refusals, the two doors,
  budget and order), `#design`, and ASC-D1, ASC-D5 and ASC-D6.
- The owner approval of the ACE boundary: [reports/owner-approval-ace-boundary.md](reports/owner-approval-ace-boundary.md).
  ACE owns composition and selection; ASC is its door; ASC never edits rule text.
- RUL102 as it stands: `docs/platform/packaging-distribution/spec.md:838` (decision history) and `:248`; the
  composition contract `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md`
  (model row `docs.packaging-distribution/instruction-composition-and-projection`, provider `packaging-distribution`).
- Pattern to copy: `packages/questions/contracts/questions-input.v1.json` and
  `packages/questions/contracts/refusals.v1.json`. Spec pattern: `docs/platform/agent-protocol/spec.md`.
- Component authority: `docs/platform/component-authority/spec.md` §3 (`locate`, `declare`). Run
  `fgos authority locate "compose the start text an agent receives"` and record the answer in the spec, so the spec
  names any row it overlaps and the survivor.
- Observe record contract v2: `docs/platform/observe/spec.md` (record store, kinds declared at the place of use).

## Footprint

`docs/platform/agent-start-context/**`, `packages/agent-start-context/contracts/**`.

## Steps

1. Write `docs/platform/agent-start-context/spec.md`. It must cover:
   - purpose and scope (fgOS-owned text only, ASC-D2), and the ACE/ASC boundary as approved;
   - the owner (this component) and tier 3, with the allowed dependencies at tier 3 or below;
   - the callers (head launch, `PromptPort` host adapter, agent-file projection, SessionStart hook, setup matcher);
   - the ports `UnitSource`, `FactRegistry`, `RecordSink` and `Contributor`;
   - fail closed for static data and fail open for contributors;
   - the byte budget per delivery, and the order by authority and specificity;
   - the per-start record as an Observe v2 record of a declared `start-context` kind (facts, matched unit ids,
     bytes per block, dropped blocks), written through Observe's record door;
   - the one-producer rule (persona, ritual, on-wake and opening text; Execution's assignment block stays a payload);
   - a "Lịch sử quyết định" section that carries ASC-D1 to ASC-D7 and the 2026-11-22 owner approval of the ACE
     boundary, each with its date and a link to the discussion or the approval report.
2. Write the five schemas under `packages/agent-start-context/contracts/`, exactly as `#interface` gives them:
   - `start-request.v1.json`: facts, the payload union (`assignment`, `task`, `handoff`, `for-question`) and
     delivery (`opening`, `prompt-arg`, `agent-file`, `hook-context`);
   - `start-context.v1.json`: `blocks[]` of `{id, source, text, bytes}`, `matched[]`, `record`;
   - `start-facts.v1.json`: the registry rows `kind`, `cli`, `project`, `persona`, `role`, `domain`, `workflow`,
     `stage`, each with its value type, the start kinds that require it, and the live source of its values;
   - `start-contributors.v1.json`: an empty registration list plus its row schema (`id`, `when`, `owner`,
     `budgetBytes`, `timeoutMs`);
   - `refusals.v1.json`: the six named refusals.
3. Add golden vectors under `packages/agent-start-context/contracts/vectors/`. Each one is a request and its expected
   context or refusal, with at least one case per refusal.

## Verify

- `node -e` parses every schema and vector file as JSON.
- `node scripts/doc-health.mjs docs/platform/agent-start-context/spec.md` passes.
- The spec names an owner and a tier, and every refusal in `refusals.v1.json` appears in it.

## Rollback

Revert the commit. It adds only new files.
