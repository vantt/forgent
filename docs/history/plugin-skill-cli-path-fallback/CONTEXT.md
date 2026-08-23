---
type: context
title: Plugin skill CLI path fallback (tsk-1no)
timestamp: 2026-08-08T06:08:00.000Z
---

# Plugin skill CLI path fallback

## Feature boundary

Every `plugins/fgOS/skills/*/SKILL.md` file shells out to the real `fgos`
CLI with the literal template
`node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs
<verb> ...`. This template resolves correctly only when the current
project IS a forgent-style checkout with `bin/fgos.mjs` present at its
root (or at the nested prefix). A project that installed fgOS globally via
npm (`fgos`/`fgos-runner` on PATH per `package.json`'s `bin` field, with
its own local `.fgos/` created by `fgos init`) has no `bin/fgos.mjs` in its
own tree at all — every `/fgOS:*` slash command in that project fails on
first use with a raw "file not found", not a clear error.

This item fixes that one gap: give the 23 `plugins/fgOS/skills/*/SKILL.md`
files a resolution fallback (local `bin/fgos.mjs` -> PATH `fgos` -> clear
error) instead of the current single-branch template, and register a
doctor check that catches this gap at install/setup time instead of at
first slash-command use.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | fgOS plugin is activation UX only (`/fgOS:*` slash commands in Claude Code) — it will never bundle the CLI (`bin/`+`src/`) itself. It stays dependent on `fgos` being reachable via an existing install channel: a project-local `bin/fgos.mjs` (forgent-style checkout) or a global npm install on PATH. Ruled out: making the plugin self-contained by shipping `bin/`+`src/` inside `plugins/fgOS/`. |
| D2 | Fix scope is `plugins/fgOS/skills/*/SKILL.md` (23 files) only. `.claude/skills/fgos-*` and their `.agents/skills/fgos-*` mirrors use a separate, already-correct resolution pattern (`git rev-parse --path-format=absolute --git-common-dir \| xargs dirname`, provider-agnostic — no Claude-Code-specific env var) and are used to drive forgent's own backlog from inside forgent's own checkout (dogfooding) — never reported broken, never meant to run against an external consumer project's `.fgos/`. Moving skill source-of-truth toward `.agents/skills` for max cross-provider reuse is a live intent but its activation shape is not yet tested on non-Claude providers — a separate, not-yet-realized concern this item does not touch or expand. |
| D3 | Fix shape: give each of the 23 `plugins/fgOS/skills/*/SKILL.md` files the same fallback `scripts/fgos-shell-integration.sh:29-46` already proves correct for the shell-function surface — try the project-local `bin/fgos.mjs` first, else `fgos` resolved from PATH, else a clear stated error (never a raw Node `Cannot find module`). Additionally register a new check in `src/setup/registrations.mjs`'s `DOCTOR_CHECKS` (via `registerCheck`, re-exported through `src/setup/checks.mjs`) confirming the resolved `fgos` invocation actually runs from the current project, so a future install surfaces this gap at `fgos doctor` time instead of at first slash-command failure. |

## Pinned terms

- **plugin fgOS** — the Claude-Code-specific marketplace plugin
  (`plugins/fgOS/`, declared in `.claude-plugin/marketplace.json`) that
  exposes `/fgOS:*` slash commands. Distinct from "the fgOS CLI"
  (`bin/fgos.mjs`) and from "fgOS dev-skills" (`.claude/skills/fgos-*`).
- **consumer project** — any project other than forgent's own checkout
  that has installed fgOS (globally via npm, or by running `fgos init`
  locally) to use as its own work-item backlog. The reported failure
  happened in one (`herdr-gateway`).
- **dev-skill** — `.claude/skills/fgos-*` / `.agents/skills/fgos-*`,
  mirrored byte-identically (`test/skills/fgos-mirror.test.mjs`), used to
  drive forgent's own backlog from inside forgent's own checkout. Out of
  this item's scope per D2.

## Scout evidence

- `plugins/fgOS/skills/submit/SKILL.md` steps 2 and 4: literal
  `node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs`
  template, repeated identically across all 23 verb-skill files (`rg -c
  'CLAUDE_PROJECT_DIR.*bin/fgos\.mjs' plugins/` → 23 hits across 23
  files).
- `package.json`: `"bin": {"fgos": "bin/fgos.mjs", "fgos-runner":
  "bin/fgos-runner.mjs"}` and `"files": ["bin", "src", "README.md",
  "LICENSE", "docs/how-to", "docs/explanation",
  "docs/enduser-docs-index.json"]` — a global npm install puts `fgos` on
  PATH but never ships `plugins/`.
- `.claude-plugin/marketplace.json` + `plugins/fgOS/.claude-plugin/
  plugin.json`: the plugin's own manifest lists only `skills/` as its
  content — no `bin/`, confirming today's plugin never carries the CLI
  (consistent with D1, which keeps it that way deliberately rather than
  by omission).
- `scripts/fgos-shell-integration.sh:13-46`: `_fgos_repo_root` +
  `fgos()`/`fgos-runner()` shell functions already implement exactly the
  fallback D3 asks for, for the shell-function surface (`source
  scripts/fgos-shell-integration.sh` in `~/.bashrc`) — local `bin/
  fgos.mjs` check, then `command -v fgos` PATH fallback, then a clear
  stated error. No equivalent exists in the plugin skill layer today.
- `src/setup/checks.mjs` is a thin re-export shim; the real registry is
  `DOCTOR_CHECKS` in `src/setup/registrations.mjs`, extended via
  `registerCheck` — confirms D3's doctor-check addition has a real,
  already-generic extension point, no core-file edit needed.
- `docs/specs/fgos-plugin.md:167` documents the current (broken-for-
  consumers) template as-is — needs updating once the fix lands, per
  AGENTS.md's own documentation-update bar (public contract change).
- Impact-analysis capability gate (CLAUDE.md): `fgos tool query
  --capability impact-analysis --status present` → GitNexus registered,
  `status: present`. Per `tsk-1lg` (open item, not touched here) the
  index is known stale (434 commits behind) — posture is **degraded**,
  not full. No blast-radius claim in this CONTEXT.md relies on GitNexus;
  all evidence above came from direct `rg`/`cat` reads.

## Canonical references

- `scripts/fgos-shell-integration.sh` (fallback pattern to mirror)
- `plugins/fgOS/skills/submit/SKILL.md` (representative of the 23 files
  needing the fix)
- `src/setup/registrations.mjs` / `src/setup/checks.mjs` (doctor check
  registry)
- `docs/distribution-vision.md` §2 pillars 3/4/6 (setup/doctor
  self-fixing, extensible check registry, global/project coexistence) —
  broader vision this item's doctor-check addition is a small, concrete
  instance of, not a full implementation of the vision itself.
- `docs/specs/fgos-plugin.md:167` (spec line documenting the current
  template, to be updated once fixed)

## Outstanding questions deferred to planning

- Exact fallback shell snippet wording/shape to paste into all 23 files
  (a literal shared block vs. a short one-liner per file) — an
  implementation choice, `fgos-coding-planning`'s call.
- Exact doctor-check name/id and what "actually invocable" checks for
  (e.g. `fgos --version` exit 0 vs. a deeper check) — implementation
  detail.
- Whether `docs/specs/fgos-plugin.md:167` and any other doc referencing
  the old template need a matching update in the same change — likely
  yes per the documentation-management rule (public contract changed),
  final call left to planning/implementation.
- Real `verify` command for this item, given the touched files are all
  skill prose (`plugins/fgOS/skills/**/SKILL.md`) — must follow
  `docs/how-to/write-verify-for-a-skill-prose-change.md`'s
  `npm test && POSITIVE && NEGATIVE` shape; not written here since this
  skill does not design verify, `fgos-coding-planning` does.
