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
