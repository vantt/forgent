# Phase 06: config proposal for the owner (diff first, edit only after approval)

## Context

- [plan.md](plan.md) decisions 1-4, open questions 1-3; owner answers 2026-10-19 23:07 and 23:20 in the [problem report](../reports/problem-261017-0022-model-tier-selection-misfit.md).
- Starts after phase 05 is merged **and** a release containing phases 01-04 is activated on every workspace and machine (memory rule: a new key in `~/.fgos/config.json` is read by every workspace release; schema additions there wait until all activations read them).
- **Who edits.** `~/.fgos/config.json` is owner-owned. The big lead shows the diff below (regenerated from the live file, not copied), the owner approves, then the big lead edits and takes a backup first. The planner and executors never edit it. The project `.fgos/config.json` follows the same show-then-approve step for this phase.

## Proposal A: project `.fgos/config.json` (`runner`), default, no pool flip

1. **`tierFallback`** (new key, project only; older releases ignore it):

```json
"tierFallback": {
  "nano":     ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "standard": ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "advanced": ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "flagship": ["claude", "openai", "gemini", "xai"],
  "frontier": ["claude", "openai", "gemini", "xai"]
}
```

Family names are `modelPolicies` keys (`z-ai` is GLM). `gemini` appears in flagship and frontier because its `gemini-4-argon-high` cell exists at both. The `tier-fallback` doctor check confirms every listed family has a cell at its tier.

2. **Code capabilities** change `prefer` to gemini, deepseek, glm, claude (no openai, no xai). The `glm` executor serves family `z-ai`.

| Capability | Today | Proposed |
|---|---|---|
| `code:implement`, `coding:implement`, `fgos-coding-implement` | `[gemini/omp-herdr, claude]` | `[gemini/omp-herdr, deepseek, glm, claude]` |
| `code:test`, `code:refactor`, `execute` | `claude` | `[gemini, deepseek, glm, claude]` |
| `code:review`, `code:debug` | `[openai/codex-cli-bwrap]` | `[gemini, deepseek, glm, claude]` (owner confirms: this removes the codex pin that reviews use today; independence from the producer's family still applies through `independentOf`) |

3. **Architecture council** (owner 23:20, "tạm đồng ý"): synthesizer at `frontier`, others at `flagship`. Capability rigor sets the tier for every seat of a capability, so: `architecture:synthesize` stays `critical` (frontier); `architecture:frame` and `architecture:critique` stay `high` (flagship); `architecture:shape` and `architecture:explain` change `critical` to `high` (flagship). The one critique seat at `frontier` is a seat-level choice that lives in the council preset, not in runner config (open question 2; phase 00 fact 9 names the file); it is shown as a separate diff.
4. **GLM and DeepSeek cells.** `glm-5.4` is not on OpenRouter (2026-10-19 23:15). Replace the project `z-ai` cells: nano and standard `z-ai/glm-5.3-flash`, advanced `z-ai/glm-5.3`; flagship and frontier unchanged (`z-ai` is not in those tiers' fallback lists). When OpenRouter lists `glm-5.4`, advanced and above switch to it (reversal trigger; record it in the spec). DeepSeek: `deepseek-v4-pro` stays at `advanced` and above. The owner already chose `deepseek/deepseek-v4.1-flash` for nano and standard and it is applied in both configs (main `694e2c1e7`), so it is current state and not part of this diff.
5. **Ceiling `advanced` for code: not included.** No mechanism exists (plan open question 1). The diff has no `maxTier` line; the lead shows the options and applies the owner's choice as a separate step.

## Proposal B: pool flip, optional, separate commit (recommended once A is proven)

Gives the one live proof of pool routing and shared quota state for the two OpenRouter families.

- Global `~/.fgos/config.json`: add `runner.llmAccounts.openrouter.or-a: { "label": "openrouter", "credentialStore": { "pi": "${HOME}/.pi/accounts/openrouter" } }`. `llmAccounts` is read by every release that carries MP-A (phase 00 fact 6 confirms the activated one does); `runner.providers` stays untouched, so releases that do not read it keep working. Order inside a pool is the order written; add a second account after `or-a` only when one exists.
- Project config: `z-ai` and `deepseek` cells gain `@openrouter` (`z-ai/glm-5.3-flash@openrouter`, `deepseek/deepseek-v4-pro@openrouter`, and so on).
- Effect: both families lease from state key `openrouter` instead of `z-ai` / `deepseek`. During mixed releases a quarantine on one key is not seen by the other (extra failed attempt, no double-seat hazard for an API key). Declare it done only after every workspace runs the new release.
- Leave `openai`, `gemini`, `xai` pools on `runner.providers` until MP-C: their accounts carry file lists other projects depend on (mdview and mcp-skill-hub use the older private-home bindings).

## Steps

1. Lead regenerates both diffs from live files and shows them with the open questions (decision-question form, in the lead's visible text).
2. After approval: backup, edit, `fgos doctor` through `npm run fgos:dev -- doctor`, `fgos dispatch explain --for <cap>` for every capability in the tables above, compare the chains with decisions 1-3.
3. Commit project config changes separately per proposal.

## Tests / validation

- `bind-committed-config.test.mjs` and `dispatch-policy-baseline-snapshot.test.mjs` updated for the new `prefer` and tiers (the snapshot diff is reviewed line by line, not regenerated blindly).
- A test that walks every tier of the committed config and asserts the chain stays in-tier and in the declared groups.
- Doctor green; no `tier-fallback` warning.

## Risk / rollback

M x M: a fallback lands on a weaker model than expected. Mitigation: explain output for each capability reviewed before commit. Rollback: restore the backup; project config revert is one commit per proposal.
