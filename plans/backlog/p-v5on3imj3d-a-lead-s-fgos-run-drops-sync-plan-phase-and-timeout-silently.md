---
id: p-v5on3imj3d
title: "A lead's `fgos run` silently drops `--sync`, `--plan`, `--phase` and `--timeout` (session-host, priority P2; source: lead of plan 261121-2110-component-authority-doors, its plan.md note of 2026-11-24, line \"Head request route\")"
status: proposed
priority: P2
area: session-host
created: 2026-11-24
---

# Why

A lead ran `fgos run "<prompt>" --provider claude --worktree W --writes ... --sync --plan <dir> --phase <id> --timeout <n>`. The ticket that came back had none of those four flags in its argv: only the prompt, `--writes`, `--provider`, `--worktree` and `--json`. A run that added only `--sync` was refused with `bad-args`. The lead is never told which flag was dropped.

Cause (read in code, not run): the lead branch of `runVerb` in `src/session-host/head-request.mjs` (about lines 370-395) accepts exactly five keys through `exactKeys(args, ['prompt', 'provider', 'capability', 'writes', 'worktree'])` and builds the argv itself. The secretary and supervisor branch (`secretaryRunArgv`) does carry `--timeout`, taken from `maxMinutes`. Not yet checked on the client side: when a flag is dropped silently and when it is refused with `bad-args`.

Effects: a lead cannot set a deadline for a long unit, so it gets the runner's default timeout; it cannot wait synchronously, so it polls `fgos request result --wait 50` up to 11 times; the unit's record under `.fgos/assignments/<unitRunId>/` does not say which plan and phase produced it; and the lead believes the flag worked, because no error says otherwise.

# Done when

The owner picks one: (a) a lead may pass a timeout (capped by the configured ceiling) plus plan and phase for provenance; or (b) the route refuses each unsupported flag with an error code that names the flag. `--sync` likely stays refused, because the head route always returns a ticket, but the message must say why. Either way no flag is dropped without a word.
