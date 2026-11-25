# Phase 2: Area spec and v1 contracts

The spec comes before the code (L5 question 2). It names the crate's owner, its tier, its ports and its contracts.
This phase writes only new files. Registering the component in the model, the generated views and the reading-map
row are phase 6 (they sit in files that ACE phase 3 and running plans also write). The RUL102 successor is ACE phase 3's, not this plan's
(ACE-D3). It waits for ACE phase 1, whose contracts this spec cites.

## Inputs

- The discussion's `#interface` (contract, payload union, delivery enum, refusals, the two doors, budget and order),
  `#design`, ASC-D1, ASC-D5, ASC-D6, and their amendments ASC-D8 and ASC-D9.
- ACE-D1, ACE-D2 and ACE-D5 in `ds-e26zcar63f`: ACE and ASC are two components; ACE hands ASC one checked effective
  rule set with a digest and owns the `when:` key registry; ASC fills values from live data and matches. The
  2026-11-22 approval that called ASC "the first slice of ACE" ([reports/owner-approval-ace-boundary.md](reports/owner-approval-ace-boundary.md))
  is superseded by ACE-D1; its point 3 (phase 6 scope) is answered by ACE-D5, and its point 4 (tell DOCOS when the
  `when:` list is fixed) is met by ACE phase 1.
- ACE's contracts from ACE phase 1: `packages/agent-context-engine/contracts/when-keys.v1.json` and
  `effective-rules.v1.json`.
- Pattern to copy: `packages/questions/contracts/questions-input.v1.json` and
  `packages/questions/contracts/refusals.v1.json`. Spec pattern: `docs/platform/agent-protocol/spec.md`.
- Component authority: `docs/platform/component-authority/spec.md` §3 (`locate`, `declare`). Run
  `fgos authority locate "compose the start text an agent receives"` and record the answer in the spec, so the spec
  names any row it overlaps and the survivor. (On 2026-11-25 "agent start context" matched no component by id.)
- Observe record contract v2: `docs/platform/observe/spec.md` (record store, kinds declared at the place of use).

## Footprint

`docs/platform/agent-start-context/**`, `packages/agent-start-context/contracts/**`.

## Steps

1. Write `docs/platform/agent-start-context/spec.md`. It must cover:
   - purpose and scope (fgOS-owned text only, ASC-D2), and the contract with ACE (ACE-D5): ASC reads one checked
     effective rule set and verifies its digest; it never reads rule files, never needs pkm or an embedding model,
     and never edits rule text; the dependency order ACE ← ASC ← packaging-distribution (ACE-D2);
   - the owner (this component) and tier 3, with the allowed dependencies at tier 3 or below, ACE's reader included;
   - the callers (head launch, `PromptPort` host adapter, agent-file projection, SessionStart hook, setup projection);
   - the ports `RuleSet` (ACE's compiled set), `FactRegistry` (keys from ACE's registry, values from live data),
     `RecordSink` and `Contributor`;
   - fail closed for a rule set that does not verify or a request that does not validate, and fail open for
     contributors;
   - the byte budget per delivery, and the order: ACE's composition order for rules, then payloads and contributors
     placed by ASC;
   - the per-start record as an Observe v2 record of a declared `start-context` kind (facts, rule set digest, matched
     rule ids, bytes per block, dropped blocks), written through Observe's record door;
   - the one-producer rule (persona, ritual, on-wake and opening text; Execution's assignment block stays a payload);
   - a "Lịch sử quyết định" section that carries ASC-D1 to ASC-D9, the 2026-11-22 owner approval marked superseded by
     ACE-D1, each with its date and a link to the discussion or the approval report.
2. Write the four schemas under `packages/agent-start-context/contracts/`:
   - `start-request.v1.json`: facts (keys referenced from ACE's `when-keys.v1.json`, with the keys each start kind
     must supply), the payload union (`assignment`, `task`, `handoff`, `for-question`) and delivery (`opening`,
     `prompt-arg`, `agent-file`, `hook-context`);
   - `start-context.v1.json`: `blocks[]` of `{id, source, text, bytes}`, `matched[]`, `ruleSetDigest`, `record`;
   - `start-contributors.v1.json`: an empty registration list plus its row schema (`id`, `when`, `owner`,
     `budgetBytes`, `timeoutMs`);
   - `refusals.v1.json`: `start-fact-unknown`, `start-fact-value-invalid`, `start-fact-missing`,
     `start-payload-invalid`, `start-rule-set-invalid` (missing, wrong version, or digest mismatch; it replaces
     `start-unit-invalid`, since bad rules are refused by ACE when written), `start-delivery-unsupported`.
   `start-facts.v1.json` is not written here: the key registry is ACE's (ASC-D9).
3. Add golden vectors under `packages/agent-start-context/contracts/vectors/`. Each one is a request and its expected
   context or refusal, with at least one case per refusal.

## Verify

- `node -e` parses every schema and vector file as JSON.
- `node scripts/doc-health.mjs docs/platform/agent-start-context/spec.md` passes, including its links to ACE's
  contracts.
- The spec names an owner and a tier, and every refusal in `refusals.v1.json` appears in it.

## Rollback

Revert the commit. It adds only new files.
