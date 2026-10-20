# Model family tier ladders (2026-10-20)

Question: does each family offer 6 distinguishable levels (nano < mini < standard < advanced < flagship < frontier)? Proposal only; no config touched.

## 1. Sources and credibility

Official pages fetched 2026-10-20 (high credibility). Web-search aggregators conflicted and were ignored where an official page existed.

| Family | Official source | Notes |
|---|---|---|
| claude | https://platform.claude.com/docs/en/models/overview ; https://platform.claude.com/docs/en/build-with-claude/effort | complete, with prices and effort per model |
| openai | https://developers.openai.com/api/docs/models ; https://developers.openai.com/api/docs/pricing | models page lists reasoning effort for GPT-6 only; pricing page has no effort notes |
| gemini | https://ai.google.dev/gemini-api/docs/models ; .../pricing ; .../thinking | complete |
| xai | https://docs.x.ai/developers/models ; https://docs.x.ai/developers/model-capabilities/text/reasoning | grok-4.3 effort not documented |
| deepseek | https://api-docs.deepseek.com/quick_start/pricing ; https://api-docs.deepseek.com/guides/thinking_mode | complete |
| z-ai | https://docs.z.ai/guides/overview/pricing ; https://docs.z.ai/guides/capabilities/thinking-mode | no effort levels, only thinking on/off |

## 2. Lineups as of 2026-10-20

### claude
| Model | $/MTok in/out | Effort levels | Default |
|---|---|---|---|
| haiku-5-5 | 0.10+/0.50+ | low, medium, high, xhigh, max (thinking can be disabled at <=high) | medium |
| sonnet-5-5 | 2/10 | same 5 (thinking off not allowed; `between_tools` = lowest) | high |
| opus-5-5 | 4/20 | same 5 | medium |
| fable-5-1 | 10/50 | same 5 | high |

Also `mythos-5-1` appears in effort docs (not in the main lineup table; unclear availability). Anthropic itself says: Opus 5.5 for most work, Fable 5.1 when Opus at higher effort falls short; Haiku for classification/extraction/routing.

### openai
| Model | $/MTok in/out | Effort |
|---|---|---|
| gpt-6-luna | 0.10/0.50 | none, low, medium, high, xhigh, max |
| gpt-5.6-luna | 0.20/1.20 | not documented |
| gpt-5-nano | 0.05/0.40 | not documented |
| gpt-5.4-mini | 0.75/4.50 | not documented |
| gpt-5.6-terra | 2/12 | not documented |
| gpt-5.6-sol | 4/20 (promo through at least 2026-11-21) | not documented |
| gpt-6.1-sol | 2/10 | low..max (5) |
| gpt-6-astra | 10/50 | low..max (5) |

No GPT-6 Terra exists. No current Codex model (all Codex variants deprecated). GPT-6.1 Sol is cheaper than GPT-5.6 Sol and "near-Astra" per OpenAI, so 5.6 Sol is superseded.

### gemini
| Model | $/MTok in/out | Thinking levels |
|---|---|---|
| gemini-3.5-flash-lite | 0.30/2.50 | minimal, low, medium, high (default minimal) |
| gemini-3.8-flash | 0.75/3.75 (to 2026-12-31, then 1.50/7.50) | low, medium, high (default medium) |
| gemini-4-argon | 2/10 (to 2026-11-30, then 4/20) | low, medium, high (default medium) |

3.6 Flash and 3.1 Pro/Flash-Lite still listed but older. Google recommends 3.5 Flash-Lite or 3.8 Flash for new projects.

### xai
| Model | $/MTok in/out | reasoning_effort |
|---|---|---|
| grok-4.20-0309-non-reasoning | 1.25/2.50 | none (non-reasoning variant) |
| grok-4.3 | 1.25/2.50 | not documented |
| grok-4.5 | 2/6 | low, medium, high (xhigh treated as high) |
| grok-4.6 | 2/6 | low..xhigh (4) |
| grok-4.7 | 2/6 | low..xhigh (4); xAI recommends it for code and chat |
| grok-build-0.1 | 1/2 | not documented |

4.5, 4.6, 4.7 share one price: they look like generations, not tiers. Reasoning cannot be disabled on 4.5+.

### deepseek
| Model | $/MTok in(miss)/out, off-peak | Controls |
|---|---|---|
| deepseek-flash (V4.1-Flash-1017) | 0.15/0.60 (peak x2) | thinking on/off; effort low, high, max |
| deepseek-v4-pro | 0.66/1.98 (peak x2) | same |

Effort aliases collapse: minimal/low to low; medium/high/xhigh to high; max/ultra to max. So 3 real effort values plus thinking off.

### z-ai
| Model | $/MTok in/out | Thinking |
|---|---|---|
| glm-5.3-flash | 0.15/0.50 | forced on |
| glm-5.3-flashx | 0.37/1.25 | on by default |
| glm-5.3 (= 5.2 = 5.1 price) | 1.40/4.40 | forced on |
| glm-4.7 | 0.60/2.20 | on by default, can disable |
| glm-4.7-flash / 4.5-flash | free | can disable |

No effort levels, only on/off (and forced on for 5.3). 5.1/5.2/5.3 same price: generations.

## 3. Mapping onto the 6 levels

"Cell" = model + effort. Distinct = cells I judge genuinely different in capability or cost, not just different names.

| Family | nano | mini | standard | advanced | flagship | frontier | Distinct | Needs effort? |
|---|---|---|---|---|---|---|---|---|
| claude | haiku low | haiku high | sonnet medium | sonnet high/xhigh | opus 5.5 high | fable 5.1 high | 6 | yes: 4 models only; 2 levels come from effort |
| openai | gpt-6-luna low | gpt-6-luna high (or gpt-5.4-mini) | gpt-5.6-terra | gpt-6.1-sol medium | gpt-6.1-sol high/xhigh | gpt-6-astra | 6 | partly: 4 families of model (luna, terra, sol, astra), 5 with 5.6-sol |
| gemini | flash-lite minimal | flash-lite high | flash-3.8 medium | flash-3.8 high | argon medium | argon high | 6 | yes: only 3 models |
| xai | grok-4.20 non-reasoning | grok-4.3 | grok-4.5 medium | grok-4.5 high | grok-4.7 high | grok-4.7 xhigh | 5 nominal, ~4 real | yes; 4.5/4.7 same price |
| deepseek | flash, thinking off | flash low | flash high | pro low or high | pro high | pro max | 4 real (flash-off, flash-think, pro-high, pro-max) | yes, 3 effort values |
| z-ai | glm-4.7-flash thinking off | glm-5.3-flash | glm-5.3-flashx | glm-5.3 | glm-5.3 | glm-5.3 (collapse) | 3-4 | no effort available |

Judgement notes:
- claude: Sonnet 5.5 low/medium/high is real; Anthropic says Haiku 5.5 xhigh should be compared with Sonnet, so Haiku effort is a legit mini lever. Opus to Fable is a real 2.5x price step.
- openai: strongest ladder; real price steps 0.10 to 2 to 2 (6.1 Sol) to 10. Terra (2/12) and 6.1-Sol (2/10) are same price; Sol is newer/stronger, so Terra only fills "standard" for continuity (could drop to Sol medium and lose a level).
- gemini: three prices with effort inside Flash is the only way to reach 6. Effort steps within one model are a weaker capability gap than model steps.
- xai: tiers beyond grok-4.3/4.5 are generational; no documented capability difference at same price. Weakest mapping of the big three.
- deepseek, z-ai: 2 to 3 sizes; 6 levels would be mostly the same model with different settings or the same cell repeated.

## 4. Current config check (`runner.modelPolicies`)

- No `mini` key for any family (only nano, standard, advanced, flagship, frontier). If the ladder is 6, mini is missing everywhere.
- Repeats: claude standard=advanced=sonnet; gemini flagship=frontier=argon-high; z-ai nano=standard (flash), advanced=flagship=frontier (glm-5.3); xai nano=standard (4.3), flagship=frontier (4.6); deepseek nano=standard (flash), advanced=flagship=frontier (pro).
- Stale ids spotted: openai uses gpt-5.6-luna ($0.20) while gpt-6-luna ($0.10, listed first, supports effort none..max) exists; xai pins 4.6 while 4.7 is the recommended model at same price; gpt-5.6-sol is superseded by gpt-6.1-sol in price/performance.
- Gemini nano uses `3.8-flash-low`; `3.5-flash-lite` (minimal) is cheaper and exists, check why not used.

## 5. Conclusion

- A 6-level ladder holds as 6 distinct cells for claude, openai, gemini only. xai ~4-5, deepseek 4, z-ai 3-4.
- No family has 6 distinct models. Max is 4-5 models (openai, claude 4). Reaching 6 requires effort inside the tier cell for claude and gemini.
- Effort is not equivalent to a model step: within-model effort mostly changes cost/latency, with smaller capability gaps (DeepSeek maps 7 requested levels to 3; xAI 4.5 clamps xhigh to high).

Recommendation (ranked):
1. Keep the 6-level ladder as the logical contract (it is defined by nature of work, which is family-independent), and make the tier cell = model + optional effort. Allow explicit collapse (same cell on adjacent tiers) per family, declared, not accidental. Reason: only way claude and gemini reach 6; costs nothing for others.
2. Do not shrink to 5: it would drop mini, which is the level where cheap models (haiku high, luna high, flash-lite high) matter most for "small exact edits / small diff review", and 3 of 6 families would still collapse.
3. Treat `frontier` as optional per family (maxTier already exists): deepseek and z-ai have no model above their flagship, so frontier = flagship is honest.

Proposed cells (proposal, not applied):

| Family | nano | mini | standard | advanced | flagship | frontier |
|---|---|---|---|---|---|---|
| claude | claude-haiku-5-5 low | claude-haiku-5-5 high | claude-sonnet-5-5 medium | claude-sonnet-5-5 high | claude-opus-5-5 high | claude-fable-5-1 high |
| openai | gpt-6-luna low | gpt-6-luna high | gpt-5.6-terra | gpt-6.1-sol medium | gpt-6.1-sol xhigh | gpt-6-astra high |
| gemini | gemini-3.5-flash-lite minimal | gemini-3.5-flash-lite high | gemini-3.8-flash medium | gemini-3.8-flash high | gemini-4-argon medium | gemini-4-argon high |
| xai | grok-4.20-0309-non-reasoning | grok-4.3 | grok-4.5 medium | grok-4.5 high | grok-4.7 high | grok-4.7 xhigh |
| deepseek | deepseek-flash thinking off | deepseek-flash low | deepseek-flash high | deepseek-v4-pro low | deepseek-v4-pro high | = flagship (or pro max) |
| z-ai | glm-4.7-flash thinking off | glm-5.3-flash | glm-5.3-flashx | glm-5.3 | glm-5.3 | = flagship |

Adoption risks: Gemini 4 Argon and 3.8 Flash prices double (Nov 30 / Dec 31); Gemini cells depend on promo pricing today. GPT-5.6 Sol promo ends >= Nov 21. DeepSeek peak/off-peak price x2. Z-ai/deepseek via OpenRouter ids in config may not expose the effort/thinking params the same way as direct APIs (not checked).

## 6. Limitations

- Capability ordering is inferred from price, vendor positioning and docs, not from benchmarks or the owner's evals; an eval sweep is the only real proof that e.g. haiku-high differs from sonnet-low.
- Did not verify OpenAI effort levels for 5.6-series, 5.4-mini, gpt-5-nano, or grok-4.3 (docs silent).
- Did not check OpenRouter's pass-through of effort params for deepseek/z-ai/others.
- Prices are list/standard tier; batch/cache discounts ignored.

## Unresolved questions

1. Is `mythos-5-1` (Anthropic) available to this account? It would be a candidate above or beside fable.
2. Why is `mini` absent from the config; intentional?
3. Should a tier cell allow effort at all (schema change), or stay model-only with 4-5 levels per family? Owner decision.
4. Does the owner want grok-4.7 / gpt-6-luna / gemini flash-lite adopted now (id refresh), separate from the ladder question?
