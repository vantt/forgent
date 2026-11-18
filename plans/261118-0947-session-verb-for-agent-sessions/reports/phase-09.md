# Phase 9 step 0: window of the model Miu runs

## Launch
- /home/vantt/projects/forgent/.fgos/assignments/head-secretary-miu-6/runs/01/envelope.json: `claude --model sonnet --add-dir <run>` (alias, no `[1m]`, no beta flag, no env context flag).
- Resolved model in Miu transcripts (miu-2..4, `protected/session/*/*.jsonl`): `claude-sonnet-5-5` (95 of 97 assistant records in gen 3; the 2 `claude-opus-5-5` are other records). So alias `sonnet` -> claude-sonnet-5-5.
- core/config-standard/runner.yaml:497-: modelPolicies.claude = nano/haiku, standard/sonnet, advanced/sonnet, flagship/opus, frontier/fable, mini/haiku(high). Heads use the `claude` command; other families (gemini, openai, z-ai, xai, deepseek) are not what a head launches here.

## Window (authoritative)
https://platform.claude.com/docs/en/about-claude/models/overview (fetched 2026-11-19), "Context window" row: Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5 = 1M tokens each (also Opus 5, Sonnet 5, Fable 5.x, Opus 4.6-4.8, Sonnet 4.6 = 1M). 200K only for Opus 4.5, Sonnet 4.5, Haiku 4.5 and older: none are reachable through the aliases haiku/sonnet/opus/fable today.
claude-api skill and Claude Code 1M docs: not consulted (skill not installed here); only one provider source, so cross-check below.

## Measured
- Max context per Miu generation (input+cache_read+cache_creation): gen2 103,932; gen3 128,572; gen4 179,747 (all claude-sonnet-5-5). No compact_boundary/autocompact record in miu-3 or miu-4 transcripts. 179.7k is below 200k, so it does not by itself prove >200k is accepted; it only shows no early compaction.
- core/config-standard/sessionRotation.yaml:12 windowSize 1000000 matches the documented window.

## Verdict
Phase 9 = not a bug for every claude head model today (all 1M). Residual risk: an alias that later resolves to a 200K model, or a head on a non-claude family; neither exists in config now. Close backlog p-cymvjb6nrc as not a bug; reopen if modelPolicies ever pins a 200K model for a head.
