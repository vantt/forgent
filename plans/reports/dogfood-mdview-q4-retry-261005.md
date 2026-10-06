# Dogfood on mdview, question 4 retry (2026-10-05)

Question 4: can a Workflow with a human gate run on mdview and stop at the gate.
Answer now: **yes, reached and parked**, but only after two hand edits to mdview's `.fgos/config.json` that no tool step covers. The first run on the untouched config failed.

Code under test: forgentX main at `6dcf183a0`, called as `node bin/fgos.mjs workflow start nominal-group --dir /home/vantt/projects/mdview --request "<ranking question>"`, run with `env -u CLAUDE_CODE_SESSION_ID`, secrets sourced into the child only.

## Result

Workflow run `wf-run-1791179543229-dc77a168` (mdview `.fgos/workflow-runs/`):

| Step | Outcome | Executors |
|---|---|---|
| silent-generation | pass, 3 min 19 s | panelists claude-herdr, xai (pi-herdr), glm (pi cli bwrap, OpenRouter); synthesizer deepseek (pi cli bwrap) |
| round-robin-sharing | pass, 27 s | claude-herdr |
| voting-ranking | **parked at the human gate**, not approved | question "Review the consolidated ideas, cast votes, and provide priority rankings?" |
| final-ranking | pending | |

`workflow status` reports `parked` with one open question on `voting-ranking`. To continue a person runs `fgos workflow answer wf-run-1791179543229-dc77a168 --step voting-ranking --answer <text> --dir /home/vantt/projects/mdview`. I did not.
The synthesizer brief now says "You are the synthesizer for a panel that answered the task below", so the per-role objective fix works in a real Workflow run (the old run's brief carried the panelist objective).

## Why the earlier attempts did not reach the gate

| Run | Config | What happened |
|---|---|---|
| `wf-run-1791176896305-9ec527cb` | untouched (claude-herdr, xai, openai, glm) | panelists 1 and 2 passed; openai panelist blocked at 15 s on codex "Trust this folder?" (`visibility.json`: `trustSeedFailed`, mdview not trusted in `~/.codex-fgovn/config.toml`). Run ended `execution-failure` |
| scratch copy in /tmp (my diagnostic, now deleted) | openai removed | invalid test: claude showed its own folder-trust dialog for the /tmp path, xai could not find its brief. Discarded, no conclusion drawn |
| `wf-run-1791177956630-d0357593` | openai removed | all three panelists passed (glm ran on OpenRouter, 46 s); synthesizer refused: `policy-refusal ... Candidate "glm" (provider "z-ai") violates independence requirement against [claude-herdr, xai, glm]`. Three runnable families cannot give an independent synthesizer of three panelists |
| `wf-run-1791178631664-a0765b81` | deepseek added as 4th | panelists 1 and 2 passed in 38 s; glm panelist ran 900 s and timed out (`execution-timeout`). Its pi stream showed a loop of malformed tool calls (path argument containing `</arg_value><arg_key>`), the known glm tool-call loop |
| `wf-run-1791179543229-dc77a168` | deepseek added as 4th | glm ran 151 s and passed; whole gate reached |

So the blockers, in order: (1) codex has no folder trust for mdview, a person-only action nothing checks; (2) a panel of three needs a fourth runnable provider family for the synthesizer, and mdview's pools had none that worked; (3) glm is flaky, 1 of 3 real runs lost 15 minutes to the tool-call loop, with a provider-limit style retry not triggered because the stream was busy, not idle (the capacity/stall probe watches idleness, not a runaway stream).

## Hand edits made in mdview (reported, not committed)

- `.fgos/config.json` (git-ignored): removed `openai` from the four `nominal-group:*` prefer pools, added `{"executor":"deepseek","invocation":"pi-cli-bwrap-openrouter"}` as fourth entry. After the gate was reached I restored the original file (`cmp` identical); the edited copy is `/tmp/q4retry/mdview-config.edited.json`, the original `/tmp/q4retry/mdview-config.orig.json`. Consequence: resuming the parked run uses the original pools, so `final-ranking`'s solo unit goes to the first candidate (claude-herdr) and works, but a fresh `nominal-group` start fails the same way as the first run until the pools are edited again.
- Nothing else in the tracked tree changed: `git status` in mdview is unchanged from the start (the same untracked `.agents/`, `.claude/`, `docs/` files from the earlier dogfood); no commit made, main still at `9c4b1e3`.
- New run directories under `.fgos/workflow-runs/` (five runs above, plus two from other sessions earlier today, `wf-run-1791170454409-1285ccf7` and `wf-run-1791171111836-63dacfe5`) and `.fgos/assignments/unit-run-1791176897427-5da4500d`, `...177956783-0d60a387`, `...178632364-044eab75`, `...179543366-04d76c81`.

## New findings with evidence

1. **`workflow start` returns immediately and detaches a `workflow resume` child** (runs 3 to 5: output printed in under a second with `status: running`, steps pending, then a node `workflow resume <id> --dir ...` process does the work). The first run blocked and returned the finished state after 47 s. The detached child's stdout and stderr are not captured anywhere I found, so a caller sees no progress and no failure; the only way to know is to poll `events.jsonl` or `workflow status`. Evidence: `/tmp/q4retry/run3.out`, `run4.out`, `run5.out` versus `run1.out`.
2. **Independence cannot be met with fewer than four runnable families**, and the failure is a `policy-refusal` after the panelists already ran and were paid for (`wf-run-1791177956630-d0357593`). Doctor does not check that a Workflow's pools can satisfy independence (`src/runner/execution/patterns/panel.mjs:53,83`, `src/runner/execution/bind.mjs:204`).
3. **Hidden per-project codex trust is still unchecked** (`wf-run-1791176896305-9ec527cb`, panelist-3 `visibility.json`); same as the earlier finding 5. The blocked pane was reported as `execution-timeout / resource` in the classification although the actual state was "blocked on a trust prompt" (`runnerNote` says so, `classification.failure` does not).
4. **glm tool-call loop still costs a full 900 s ceiling on a cli-spawn run** (`wf-run-1791178631664-a0765b81`, `panelist-3/1/runs/01/protected/capture/*/stdout.log`: 1916 message updates, 9 tool calls, repeated write/read of its own `agent-result.json`). Not new in cause (see `16b439e4d`), but the stall probe does not shorten it.
5. **mdview's config is stale against main**: its `modelPolicies.z-ai` still maps to `z-ai/glm-5.2` (main raised to glm-5.3), so glm panelists ran 5.2.
6. Leftover: a closed pane's private home `/tmp/fgos-confinement/disp_1791176898218_0a441a08/home` was not removed after the pane closed (I removed it by hand).

## Panes

Before: 23 panes, none mine. Mine this session: `wS:p30F`, `p30G` (settled on their own), `p30H` (codex trust prompt, closed by me), `p30K` and `p30M` (scratch copy run, closed by me; `p30M` closed itself). Later runs' herdr panes closed on their own. After: the pre-existing set only. One fgos resume process was mine and has exited; the run is parked, no process remains.

## Unresolved questions

- Should `workflow start` stay detached, and if so where do its progress and failure go?
- Should doctor check, per Workflow, that the capability pools hold enough runnable provider families for the panel plus an independent synthesizer, and that codex and agy trust the project?
- Should the gate be answered to also exercise `final-ranking` and the end of the run? I stopped as instructed.
- Is a runaway glm stream worth a lower per-run ceiling than 900 s for panelist roles?
