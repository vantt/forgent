# Phase report: agent definitions only through their door

Branch `one-door-debt/p02`, cut from origin/main `3cd0b8c41`.

## What changed

- `src/runner/dispatch/assignment.mjs`: `renderPersonaSection` reads an unpinned persona with `resolveAgentDefinition` (workspace, core; domain tier when `options.workflow` carries `owningDomain`). Missing persona keeps the bare section; every other door error renders one failure line (`could not be parsed` for YAML errors, `cannot be rendered` otherwise), never throws. The runner passes no workflow context today, so `options.workflow` is an optional pass-through for a caller that has one.
- `src/runner/agent-roster.mjs`: built from `scanAgentTiers` in door order (workspace, domain, core; first wins). Legacy `cwd/agents` and core-first order dropped; `.yml` files are no longer read (the door ignores them).
- `scripts/project-agents.mjs`: `findAgentYamlFiles` enumerates through `scanAgentTiers`; the legacy walk and the legacy-collision branch of `resolveAgentFiles` are gone (any duplicate name now throws). `node scripts/project-agents.mjs` leaves `.claude/agents` with an empty diff.
- `src/runner/agent-listing.mjs`: masking reads the core directory and label from `agentTierDirs`.
- `docs/architecture-manifest.json`: new door row `agent definition tier directories`.
- `packages/git/contracts/mutation-census.v1.json`: regenerated with `--write-census` (payload digest only).

## Door row, final lists

- allowed: `src/runner/agent-definitions.mjs`; `src/util/domain-dirs.mjs` (defines the domain layout the door reads); `src/cli/command-registry.mjs` (help text naming the tiers, nothing read).
- debt: `src/setup/registrations.mjs` (doctor chooser, kept for the later phase, reason as in the phase file).
- Last pattern narrowed to `join\((?![^)]*\.claude)[^)]*,\s*['"]agents['"]\)`: the phase's form also matched a Rust `optional(request, "agents")` and the `.claude/agents` output directory in `project-agents.mjs`, both different jobs.

## Tests

- Added in `test/runner/assignment.test.mjs`: workspace-only persona renders; domain persona renders only with the workflow context; model-taste persona renders the failure line; missing persona keeps the bare section. New because nothing covered tier lookup in the renderer.
- `test/runner/agent-roster.test.mjs`: order cases rewritten for the door order; the legacy-`agents/` and core-first expectations are retired (behaviour removed); the workspace-shadows-core wiring case is owned by `agent-definitions.test.mjs` for the order itself.
- `test/scripts/project-agents.test.mjs`: the legacy-collision test is retired (behaviour removed: the legacy walk is gone); the listing test now covers the workspace tier and asserts a legacy `agents/` file is not listed. The phase file said this file stays unchanged; it could not, since it asserted the dropped legacy walk.
- Gate list plus every test importing the touched files: 740 pass, 0 fail. `git-one-door-scan` 0 undeclared; decision-citation drift clean.

## CHANGELOG

Suggested `## [Unreleased]` line for the big lead: "Persona lookup now reads one place everywhere: a persona in `fgos/agents` renders in the assignment prompt, and the Work roster no longer reads a project `agents/` folder or lists `.yml` definitions; an agent the dispatcher cannot resolve no longer appears."

## Lessons

- A door row's raw patterns need a real run before landing: two of five matched unrelated code (Rust request field, `.claude/agents` output path).
- Door errors carry the name and path as a prefix; strip it when a caller wants a one-line reason.
- A "no workflow context" caller is the common case: the runner never passes one, so the domain tier is reachable only by a future caller.
- Regenerating the mutation census is required whenever a scanned `src`/`scripts` file changes, even for non-Git edits.

## Authority

None changed.

Status: DONE
