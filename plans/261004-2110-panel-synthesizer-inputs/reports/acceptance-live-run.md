# Phase 1 acceptance: live panel run (2026-10-04)

Command (repo's own entry, not the `fgos` shell function): `node bin/fgos.mjs run --unit plans/reports/council-lens-experiment-261004/unit.json --pattern panel --override <pins>`
Pins (explicit, cli origin): panelist-1 openai, panelist-2 gemini, panelist-3 xai, synthesizer deepseek.

## Proven on a real run

The synthesizer assignment (`.fgos/assignments/unit-run-1791125508673-2dc6ba17/synthesizer/1/assignment.json`) lists all three panelist reports as absolute paths:

```
.fgos/assignments/unit-run-1791125508673-2dc6ba17/panelist-1/1/runs/01/outbox/report-1.md
.fgos/assignments/unit-run-1791125508673-2dc6ba17/panelist-2/1/runs/01/outbox/report-1.md
.fgos/assignments/unit-run-1791125508673-2dc6ba17/panelist-3/1/runs/01/outbox/report-1.md
```

Panelist assignments carry no refs. Step 0 had already shown a real herdr worker can read such a path.

## Not proven

Whether a synthesizer actually USES the refs. The synthesizer attempt failed before reading anything:
deepseek had no OpenRouter API key (`No API key found for openrouter`). Four distinct provider families
are needed for three panelists plus an independent synthesizer, and the Claude-Code-based executors
(claude-herdr, glm-herdr) were all blocked by the startup dialog described in step0-worker-read-access.md,
so no runnable 4th family was available.

## Process notes

- The first acceptance attempt used the `fgos` shell function and showed `contextRefs: []`: that command runs
  an installed release, not this checkout. Use `node bin/fgos.mjs` for anything that must exercise repo code.
- Full suite: 6550 pass, 1 fail. The failure (`self-uninstall-spike`) passes alone; `npm pack` hit a transient
  `.tmp-` file another process was writing under `.agents/skills`. An earlier full run had 9 failures: one was the
  missing architecture-manifest row for the new module (fixed), seven passed alone (load flakes).

## Update 22:06 — synthesizer use proven

Cause of the earlier blockers: the claude-based herdr executors stopped at the folder-trust dialog because
`~/.claude.json` had no accepted-trust flag for this repo, so the runner refused to derive worker trust
(`visibility.json` of the failed run: "its repo root ... is not itself trusted"). The owner accepted the dialog; the
flag is set now. Why the flag was missing is not known. deepseek still fails with "No API key found for openrouter":
the key does not reach the worker (not an out-of-credit error), separate item.

Run `unit-run-1791126251945-31382d3b`, default panel (panelist-1 claude-herdr, panelist-2 openai, panelist-3 gemini,
synthesizer xai), outcome pass:

- Synthesizer brief lists the three panelist reports (absolute paths).
- Its output ends with "Evidence read: panelist reports (all 3 converge on no)" and its position matches the
  panelists. The earlier run without refs contradicted two of three panelists and named none.
- Copy: `acceptance-synthesizer-report.md`.

One live run only. Phase 2 trigger (refs ignored) not met; closed as not needed unless a later run shows refs ignored.

## Update 22:17 — deepseek through OpenRouter, same key as glm

`.fgos/config.json`: both deepseek invocations now carry `OPENROUTER_API_KEY: "${GLM_OPENROUTER_API_KEY}"` (only the
variable name is committed; the value lives in the untracked `.fgos/secrets.local.env`). pi reads
`OPENROUTER_API_KEY` for OpenRouter. The runner process needs that variable in its environment: nothing in the repo
loads the secrets file, so the run above exported it in a child shell for that one command.

Run `unit-run-1791126838232-96f54c6b` (panelists openai, gemini, xai; synthesizer deepseek via OpenRouter):
- deepseek (`deepseek/deepseek-v4-flash`) ran, no more "No API key" error.
- It read all three panelist reports and its synthesis names and reconciles each panelist's position. Second live
  confirmation that the synthesizer uses the refs, on a different provider.
- Run outcome is still `execution-failure`: deepseek could not write its report (`EROFS` on `runs/01/agent-report.md`
  and `agent-result.json`), so the runner saw no evidence (`verdict-inconclusive`). deepseek only has cli-spawn
  invocations, and a cli-spawn worker's writable place is `worker-output/outbox`, while it tried the flat run
  directory. Not caused by this change; not investigated further. Separate item.
