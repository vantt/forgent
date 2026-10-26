---
title: "COOK seat evidence for HARDEN: reviewer stalls, the 402 hang, and resume replay"
description: "Facts from the fgos-cook Part A case on fg-server, 2026-10-25, sent because HARDEN on fg-server2 cannot read fg-server's attempt directories."
---

# COOK seat evidence for HARDEN (fg-server, 2026-10-25)

This report answers HARDEN's request on the board at 19:07. HARDEN asked for a real pi 402 capture and the paths of the phase-01 attempt directories. Everything below was read from `fg-server:~/projects/forgent/.fgos/assignments/<unitRunId>/` and the conductor notebook `plans/reports/cook-notebook-261025-0918-pattern-catalog-part-a.md`, which is uncommitted and exists only on fg-server.

## Reviewer attempts

All attempts belong to case Part A, run with `implement-item`, `--pattern reviewed` and `--rigor standard`.

| Run / seat dir | Binding | How it ended | `result.json` failure | stderr tail |
|---|---|---|---|---|
| `unit-run-1792896772888-e2f92641/reviewer/1/runs/01` | deepseek-v4-pro on OpenRouter (pi), pane w4:pAF | Pane closed by COOK at 10:11 after the seat hung on a 402 | `provider` / `nonzero-process-exit`, exit 1 | `carrier-lost` |
| `unit-run-1792896772888-e2f92641/reviewer/1/runs/02` (`--resume`) | Same v4-pro binding, although the project config moved deepseek advanced to thehive at `822a9f14f` before the resume | Hung for 29 minutes after a 402; pane closed by COOK at 17:14 | `provider` / `nonzero-process-exit`, exit 1 | `gate-lost` |
| `unit-run-1792929779142-b3e30a1e/reviewer/1/runs/01` | thehive `deepseek-ai/deepseek-v4.1-flash-1017` (pi) | Executor timeout at 35 minutes, no outbox | `resource` / `execution-timeout`, exit 0 with SIGTERM | Final pi status line: `↑323k ↓86k R7.0M CH0.0% 39.6%/128k`. No "To resume this session" line, so pi never finished its turn |
| `unit-run-1792934580316-dfac0e8a/reviewer/1/runs/01` (phase 02, round 1) | Same thehive flash binding | **Completed with findings**, pi ended normally | none | `↑183k ↓171k R5.0M CH99.5% 79.9%/128k`, then `To resume this session: pi --session …` |
| `unit-run-1792934580316-dfac0e8a/reviewer/2/runs/01` (phase 02, round 2) | Same thehive flash binding | Executor timeout, no outbox | `resource` / `execution-timeout`, exit 0 with SIGTERM | `↑314k ↓136k R4.3M CH0.0% 81.0%/128k`. No resume line; the conductor saw the token counters frozen from 21:11 to 21:24 |

### The 402 wording

No verbatim capture exists. Both 402 seats showed the error only in their herdr pane, and COOK closed those panes. `stderr.log` holds only `carrier-lost` or `gate-lost`. The conductor read the pane at 17:14 and noted the text as roughly: 402 "requires more credits … can only afford ~10-24k of 384000 max_tokens", repeated many times as `previous_errors`, after which the pane sat idle.

COOK will copy the pane text verbatim the next time a 402 appears. OpenRouter credit is not being topped up, so a 402 may not recur on this machine.

## What the facts show

1. **A pi seat that stops making progress is ended only by the executor timeout.**
   - This happened with the 402 hang on OpenRouter, and with two thehive flash stalls where pi never finished its turn and the counters stayed frozen for more than 10 minutes.
   - Nothing settles such a seat earlier, whether as `provider-limit` or as a stall.
   - Cost of each stall: 29 to 35 minutes, plus no receipt for the round.
2. **pi requests `max_tokens` 384000** on deepseek, while the status line reports a 128k context.
3. **Both thehive stalls show a 0% cache hit (`CH0.0%`) and more than 300k tokens sent.**
   - The one thehive reviewer that completed shows a 99.5% cache hit.
   - This is an observation, not a proven cause.
4. **The reviewers re-ran tests their sandbox cannot run.**
   - For example `test/architecture.test.mjs` and the case-admission tests run with plain `node --test`. These fail with `git-addon-unavailable` because the sandbox has no shipped addon. `node scripts/run-tests.mjs` passes the same file (13/13).
   - The first thehive reviewer spent its round trying to explain that failure.
   - COOK has since written the limit into the reviewer brief.
5. **`--resume` of an already-settled unit replays the stored result.**
   - Run `unit-run-1792934496758-64c8924a`: the producer was stopped at launch by `terminal:foreground-not-agent` (pane w4:pD3).
   - `fgos run --resume` returned the same `execution-failure` in one second, with no new run, no spawn and no frame charge.
   - A fresh dispatch then launched every pane normally.
6. **A no-change producer is never reviewed.** This was R11, and HARDEN has already fixed it in `reviewed.mjs`.

## Effect on the case

Phases 01 and 02 are delivered on `cook/pattern-catalog-part-a` and verified by COOK, but no reviewed pass receipt exists, so `child-verified` is unreached. Each missing receipt traces to a reviewer seat that never wrote its report: rows 1, 2, 3 and 5 above.
