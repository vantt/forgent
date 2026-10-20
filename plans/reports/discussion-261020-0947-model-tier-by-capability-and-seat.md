# Discussion: model family and tier per capability and per seat

Open with the owner (2026-10-20). Nothing in config changes until the owner gives the taste per row. Feeds MP-B1 phase 06 ([plan](../261019-2312-model-pool-b1-fallback-and-account-order/plan.md)).

## Owner principle (2026-10-20 09:50)

- Work that is simple and already has a plan and detailed guidance runs on a **cheap model of the right level**.
- Work that needs complex thinking, an independent perspective or special design goes back to the **premium families**.
- Some seats and some capabilities carry the owner's own taste; those rows are decided one by one.

## The levers that exist today (no new mechanism needed)

| Lever | Where | Scope | Notes |
|---|---|---|---|
| Capability `rigor` | project `.fgos/config.json` `runner.capabilities.<cap>.rigor` | every seat of that capability | `rigorToTier`: low→nano, standard→standard, high→flagship, critical→frontier. A capability rigor also lifts the `maxTier` ceiling for itself. |
| Capability `prefer` | same file, `.prefer` | every seat of that capability | family order of the first attempt; only narrows the tier's fallback list. |
| Unit `rigor` in a preset | `core/workflows/<preset>.yaml`, unit `template.rigor` | every seat of that unit | the stronger of unit and capability rigor wins; stays under the ceiling. |
| Seat override in a preset | unit `template.overrides: [{ scope: { role: panelist-2 }, tier: …, executor: … }]` | **one seat** | raises the tier or pins a family for that role only; still under the ceiling. This is the per-seat taste lever. |
| Ceiling `maxTier` | project config `runner.maxTier` = `flagship` (owner 10-17) | everything | a seat reaches `frontier` only when its capability rigor is `critical`. |
| Tier fallback order | `runner.tierFallback.<tier>` (new, MP-B1) | after a failure | doer tiers → cheap families; flagship/frontier → premium families. |
| Model per tier | `runner.modelPolicies.<family>.<tier>` | per family | e.g. claude standard = sonnet, flagship = opus, frontier = fable. |

## What runs today (from `fgos dispatch explain`, 2026-10-20 09:47)

| Preset | Unit | Capability | Pattern | Tier now | First model now | Nature of the work | Proposal by the principle |
|---|---|---|---|---|---|---|---|
| (one-liner/plan) | — | `code:implement` | — | standard | gemini flash | follows a plan | cheap: keep standard; order gemini → deepseek → glm → claude |
| (one-liner/plan) | — | `execute`, `code:test`, `code:refactor` | — | standard | claude sonnet | follows a plan | cheap: standard, gemini/deepseek/glm before claude |
| (review) | — | `code:review`, `code:debug` | — | standard | openai gpt-5.6-terra | judgement, independent view | **owner taste**: keep codex (independent family, proven confined), or cheap |
| architecture-advisory | frame-context | architecture:frame | solo | flagship | openai gpt-6.1-sol | framing a problem: judgement | premium flagship (as now) |
| architecture-advisory | shape-proposals | architecture:shape | panel ×3 blind | **frontier** | openai gpt-6-astra | competing designs: special design | **owner taste**: all 3 frontier, or 1 frontier seat + 2 flagship |
| architecture-advisory | critique-proposals | architecture:critique | reviewed | flagship | xai grok-4.6 | stress test: independent view | premium flagship (as now) |
| architecture-advisory | synthesize-recommendation | architecture:synthesize | reviewed (+reviewer, red-team) | **frontier** | claude fable | final design call | premium frontier (owner 23:20) |
| architecture-advisory | explain-recommendation | architecture:explain | solo | **frontier** | claude fable | rewrites a settled packet for the owner | cheaper: flagship or standard — the decision is already made |
| business-discussion | 5 units | business:* | solo/panel/reviewed | standard | claude sonnet | strategy: judgement | **owner taste**: standard now; flagship for perspectives/synthesis? |
| council-lite | deliberate | delphi:propose | panel ×3 blind | standard | claude sonnet | quick opinions | standard (as now) |
| delphi | 4 units | delphi:* | panel/solo | standard | claude sonnet | iterative opinions | standard; synthesis maybe flagship |
| group-cognition | 3 units | group-cognition:* | panel/reviewed/solo | standard | claude sonnet | sense making | standard |
| nominal-group | 4 units | nominal-group:* | panel/solo | standard | claude sonnet | idea generation + voting | cheap: standard or nano for share/vote |
| marketing/content-publish | research, write, publish | marketing:* | solo/reviewed | standard | claude sonnet | follows a brief | cheap: standard; publish could be nano |

Notes:
- Every council seat runs claude first at standard today (`prefer` lists start with claude). By the principle, opinion panels at standard could lead with the cheap families too; the panel spread already gives different families to different seats.
- `architecture:explain` runs at frontier only because its capability rigor is `critical`; it restates a decided packet, so it is the clearest saving.

## Questions for the owner (taste rows)

1. `code:review` / `code:debug`: keep codex (independent, proven in the sandbox), or move to cheap families?
2. Architecture `shape-proposals` (3 blind panelists): all frontier, or one frontier seat (which lens: system, alternative, constraint) and two flagship?
3. Architecture `explain-recommendation`: drop to flagship (or standard)?
4. Business/delphi synthesis seats: lift to flagship, or keep standard?
5. Opinion panels at standard (council-lite, delphi, group-cognition, nominal-group): lead with cheap families (gemini, deepseek, glm) instead of claude?

## Owner answers so far

- 2026-10-20 09:58: **confirmed** — `code:implement`, `coding:implement`, `fgos-coding-implement`, `code:test`, `code:refactor`, `execute` follow the proposal (gemini → deepseek → glm → claude, standard tier).
- `code:review`, `code:debug`: owner undecided.
- **Red-team seat → xai** (owner: grok tends to break and attack, which suits red-team). Facts: red-team is a checker role of the `reviewed` pattern, bound with the unit's own capability; every `code:*` unit gets it, and every unit at rigor high/critical; a checker must be a different family from the producer (and from the other checkers at high/critical). Today the only per-role lever is a seat override in each preset (`overrides: [{ scope: { role: red-team }, executor: xai }]`), which does not reach one-off `fgos run` units. Options: (a) per-preset overrides, no new mechanism; (b) one role-level preference in config (`runner.roles.<role>.prefer`), a soft preference that keeps the family-independence rule and falls back when xai is the producer or down — a small new lever, owner choice under RUL104. Big lead recommends (b).
