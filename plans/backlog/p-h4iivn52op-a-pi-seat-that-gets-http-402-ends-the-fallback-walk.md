---
id: p-h4iivn52op
title: "A pi seat that gets HTTP 402 (OpenRouter out of credits) exits 0 with no report, so the fallback walk stops there instead of trying the next executor (runner, priority P1; source: supervisor wake, 2026-11-28)"
status: proposed
priority: P1
area: runner
created: 2026-11-28
---

# Why

The keeper's independent periodic review failed 4 of its last 5 runs (unit runs `unit-run-1795838217177-5a3cc4ac`, `-1795842474900-651c1382`, `-1795846794744-c4a7e7bc`, `-1795850877452-c10431d2`). Each time gemini was skipped (`provider-limit` or `lease-conflict`) and the walk fell back to `deepseek` through pi on the `openrouter` account. Every deepseek attempt's `stdout.log` ends in OpenRouter `402` errors ("requires more credits, or fewer max_tokens. You requested up to 908527 tokens, but can only afford 40000"), then `agent_settled`, exit 0. The runner settles it as `execution-failure` / `infra-no-report` with zero usage, so the walk ends there and never reaches claude, which passed the one run where it was picked (`unit-run-1795844344549-2f5e8604`).

Two defects show together: a 402 credit refusal is not read as a provider limit that moves the walk on (and quarantines the account), and the pi seat asks for `max_tokens` near the full context window, which turns a low balance into a refusal of every request.

# Done when

A pi seat whose provider answers 402 settles as a provider limit (or credit-exhausted) with the account quarantined, and the fallback walk goes on to the next candidate; proven by one test at the layer that classifies a seat's outcome, using a recorded 402 pi stream. The pi seat's `max_tokens` request is bounded by the seat's output budget, not the model's context size.

# Notes

Topping up the OpenRouter balance is the owner's call and does not fix the walk. Check p-3jtwwzchjl (pi stream events counted as output) first: same seat path, different cause.
