---
title: Vendored js-yaml behind one YAML door
date: 2026-10-16
summary: "Removed fgOS's only npm runtime dependency by vendoring js-yaml 5.4.3 behind src/util/yaml.mjs and retiring hand-rolled YAML readers; branch feat/vendor-js-yaml, not merged."
---

# Vendored js-yaml behind one YAML door

## What happened
- Trigger: `test/architecture.test.mjs` failed in a checkout without `node_modules` because `yaml` (the only production dependency) was missing. Six places had grown hand-rolled YAML readers or "not evaluated" branches for the same reason.
- Vendored js-yaml 5.4.3 into `src/util/third-party/js-yaml.mjs` (hash-guarded by `test/util/yaml.test.mjs`) behind `parseYaml` in `src/util/yaml.mjs`; dropped `yaml` from package.json; one-door architecture test.
- Replaced `extractSkillsFromYamlText` (x2), `parseSimplePersonaYaml`, agent regex reads and the line-matching `workflowCapabilityUses` with `readAgentDefinition`, parsed persona rendering and `readWorkflowDefinitionFiles`; parse failures are named per file in doctor and never thrown.
- Branch `feat/vendor-js-yaml` (worktree `/home/vantt/projects/forgent-worktrees/vendor-js-yaml`), 16 commits; full suite 7861 tests, 0 fail, after building release `fgctl`/`fgos` in the worktree.

## What the gates caught
- Red-team: js-yaml 5 `load` throws on empty or comment-only input (yaml v2 returned null); js-yaml defaults to unlimited aliases; `vendor/` and `dist/` paths are blocked by the repo's scout-block hook; retiring `compiled.json` would parse YAML at import time on every verb and hook.
- Code review: persona list items with an unquoted `": "` parsed as mappings and were dropped silently; `maxAliases` counts aliases, not expansion (72 aliases blew a doctor check to 600 MB); a second workflow-file reader had crept in.

## Decision
- Kept `compiled.json` (generated projection with drift test) and added freshness to doctor; kept `frontmatter.mjs` and `distill.mjs` readers. Pinned persona text falls back to a private legacy projection. Decision entry in `docs/specs/distribution.md` (no ID yet).

## Next steps
- Merge after owner approval; register the decision ID with `fgos decision` on main and run `fgos decision-index`; restage/activate the release and run `fgos doctor` through the installed shim.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
