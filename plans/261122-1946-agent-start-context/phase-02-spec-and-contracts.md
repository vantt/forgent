# Phase 2: Area spec and v1 contracts

The spec comes before the code (L5 question 2). It names the crate's owner, its tier, its ports and its contracts.

## Inputs

- The discussion's `#interface` (contract, fact registry, payload union, delivery enum, refusals, the two doors,
  budget and order), `#design`, and ASC-D1, ASC-D5 and ASC-D6.
- Pattern to copy: `packages/questions/contracts/questions-input.v1.json` and
  `packages/questions/contracts/refusals.v1.json`. Spec pattern: `docs/platform/agent-protocol/spec.md`.
- `docs/platform/governance.md#decision-scope-to-holder-table`, `docs/reading-map.md`,
  `docs/platform/system-overview/spec.md` (area map, shared entities).

## Footprint

`docs/platform/agent-start-context/**`, `packages/agent-start-context/contracts/**`, `docs/reading-map.md`,
`docs/platform/governance.md`, `docs/platform/system-overview/spec.md`.

## Steps

1. Write `docs/platform/agent-start-context/spec.md`. It must cover:
   - purpose and scope (fgOS-owned text only, ASC-D2);
   - the owner (this component) and tier 3, with the allowed dependencies at tier 3 or below;
   - the callers (head launch, `PromptPort` host adapter, agent-file projection, SessionStart hook, setup matcher);
   - the ports `UnitSource`, `FactRegistry`, `RecordSink` and `Contributor`;
   - fail closed for static data and fail open for contributors;
   - the byte budget per delivery, and the order by authority and specificity;
   - the per-start record;
   - the one-producer rule;
   - a "Lịch sử quyết định" section that carries ASC-D1 to ASC-D7, each with its date and a link to the discussion.
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
4. Register the area in the governance holder table, the system-overview area map and `docs/reading-map.md`.

## Verify

- `node -e` parses every schema and vector file as JSON.
- `node scripts/run-tests.mjs test/docs` passes (doc links and holder-table checks).
- The spec names an owner and a tier, and every refusal in `refusals.v1.json` appears in it.

## Rollback

Revert the commit. It adds only new docs and contract files plus three index rows.
