---
title: Why plugin skills need a CLI path fallback
framework: diataxis
mode: explanation
---

# Why plugin skills need a CLI path fallback

## The gap (tsk-1no)

Every `plugins/fgOS/skills/*/SKILL.md` file shelled out to the real `fgos`
CLI with one literal template:

```
node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs <verb> ...
```

This resolves only when the current project *is* a forgent-style checkout
with `bin/fgos.mjs` present at its root (or nested prefix). A project that
installed fgOS globally via npm (`fgos`/`fgos-runner` on PATH per
`package.json`'s `bin` field, with its own local `.fgos/` created by
`fgos init`) has no `bin/fgos.mjs` in its own tree at all — every
`/fgOS:*` slash command in that project failed on first use with a raw
"file not found", not a clear error.

Real symptom (2026-08-08, project `herdr-gateway`): a session called
`/fgOS:submit`, the skill tried to run
`node /home/vantt/projects/herdr-gateway/bin/fgos.mjs`, that file didn't
exist anywhere in the repo. The project had `.fgos/` (state + config from
`fgos init`) but no CLI binary in-repo at all.

## Why the fallback existed only halfway

`scripts/fgos-shell-integration.sh` already had the correct fallback for
the shell-function surface: try project-local `bin/fgos.mjs`, else
`fgos` resolved from PATH, else a clear stated error. The plugin-skill
layer never inherited that pattern — two layers solving the same
resolution problem in two different ways, one of them incomplete.

Two structural reasons the gap existed:
- `package.json`'s `files` field (`bin`, `src`, `README.md`, `LICENSE`,
  `docs/how-to`, `docs/explanation`, `docs/enduser-docs-index.json`) never
  included `plugins/` — a global npm install never shipped the plugin
  skill layer, so the skill layer and the CLI layer could drift
  independently.
- `DOCTOR_CHECKS` (`src/setup/registrations.mjs`) had no check confirming
  an installed skill layer could actually reach a runnable `fgos` CLI
  from the current project — a fresh install could pass `fgos doctor`
  while every slash command was already broken.

## The fix

Each of the 23 `plugins/fgOS/skills/*/SKILL.md` files now resolves the
CLI in the same order the shell integration already proved correct:
project-local `bin/fgos.mjs` first, then `fgos` on PATH, then a clear
stated error instead of a raw Node module-resolution failure. A new
doctor check (`plugin-skill-cli-reachable`) was registered in
`DOCTOR_CHECKS` so this gap surfaces at install/setup time instead of at
first slash-command use.

## Locked scope

The fix stays scoped to `plugins/fgOS/skills/*/SKILL.md` — the
Claude-Code-specific marketplace plugin surface. `.claude/skills/fgos-*`
(and their `.agents/skills/fgos-*` mirrors) already use a separate,
provider-agnostic resolution pattern
(`git rev-parse --path-format=absolute --git-common-dir | xargs dirname`)
and are used only to drive forgent's own backlog from inside forgent's
own checkout — never reported broken, never meant to run against an
external consumer project's `.fgos/`.

The fgOS plugin itself stays activation-UX only: it will never bundle the
CLI (`bin/` + `src/`) inside `plugins/fgOS/`. It stays dependent on `fgos`
being reachable via an existing install channel — a project-local
`bin/fgos.mjs` (forgent-style checkout) or a global npm install on PATH.
