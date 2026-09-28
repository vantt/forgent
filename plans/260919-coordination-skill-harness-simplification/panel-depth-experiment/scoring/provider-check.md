# Provider check (rubric Section 2)

## Panel synthesizer/lead-advisor executor per scored run

| Case | Run | Synthesizer provider | Lead-advisor provider |
|---|---|---|---|
| case-1 (P05.2 clear) | full | claude | claude |
| case-1 (P05.2 clear) | withheld (v2) | n/a (reused synthesis) | claude |
| case-2 (P05.2 unclear) | full | claude | claude |
| case-2 (P05.2 unclear) | withheld (v2) | n/a (reused synthesis) | claude |
| case-3 (I21 H4) | full | claude | claude |
| case-3 (I21 H4) | withheld | n/a (reused synthesis) | claude |

Every synthesizer and lead-advisor execution across every scored run used the
`claude` provider (`claude-cli-bwrap` invocation, confined).

## Blind scorer

Provider: **`xai`** (`pi-cli-bwrap-vantt` invocation, confined) -- distinct from
`claude`, the only provider used by any panel synthesizer/lead-advisor above.

Note: `xai` was also used as the red-team-actor's executor for case-3's real
red-team retry (after the `codex`/`openai` account's OAuth refresh token failed
mid-experiment). The rubric excludes only the synthesizer/lead-advisor providers
from the scorer's own provider pool, not red-team's -- `xai` remains a legal
choice for the blind scorer.

Codex/`openai` was not usable for the scorer either way: its account's OAuth
refresh token was dead for the remainder of this real-cost session (see the
I21-H4 red-team retry note in `real-runs/i21-h4-req3b-redteam-retry.json`).
