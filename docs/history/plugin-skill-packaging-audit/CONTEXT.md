# plugin skill packaging audit — CONTEXT

## Feature boundary

`tsk-2qg`. Submitted as an "audit whether dev-skills need packaging into
`plugins/fgOS/skills/`" item, triggered by a report that an mdview-spawned
session couldn't load `fgos-coding-driving` via the Skill tool. Discovery
found the item's own premise is already contradicted by prior, merged,
verified work (`tsk-d3c`) — this doc records that finding and the decision
to close rather than continue into planning.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Close `tsk-2qg` as `wontfix` — superseded by `tsk-d3c` (status `done`). `tsk-d3c` already root-caused and fixed the general "dev-skill invisible to `Skill()` tool" class of bug: the real cause was `.claude/skills/` scanning only one level deep (skills nested two levels under a shared `fgos/` parent were invisible), not missing plugin packaging. The fix — flatten each skill to `.claude/skills/<name>/SKILL.md` — shipped as commit `1e14290` (2026-07-29), is an ancestor of current `HEAD`, and is confirmed working today: this very session loaded `fgos-coding-driving`/`fgos-coding-discovering`/`fgos-researching` via the Skill tool from inside a worktree. `tsk-d3c`'s own D1 explicitly rejected "duplicate the skills into `plugins/fgOS/skills/*`" as an approach — the exact fix direction `tsk-2qg` was framed around. |
| D2 | Do not open a child item for the "does an mdview-spawned session run the standard project-skill scan" question. No reproduction evidence exists from inside this discovery/exploring pass — `mdview` is a Claude-Code-side tool, not a forgentX concept (zero repo hits), and `tsk-d3c`'s own CONTEXT.md already named "is this a harness behavior outside this repo's control" as an explicit open question it deferred, not a gap this repo silently missed. A future report that reproduces the mdview-specific failure *after* confirming it's not simply stale (i.e., observed on a checkout at or after commit `1e14290`) is new evidence and can be submitted fresh then. |

## Pinned terms

- **Dotdir skill** — same definition `docs/history/fgos-skill-discovery-gap/CONTEXT.md` already pins: a project skill at `.claude/skills/<name>/SKILL.md`, discovered by the harness's generic project-skill scan, as opposed to a plugin skill under `plugins/<plugin>/skills/<name>/SKILL.md` registered via `.claude/settings.json`'s `enabledPlugins`.

## Scout evidence

See `docs/history/plugin-skill-packaging-audit/RESEARCH.md` (discovery-stage
research round, 2026-08-12) for the full grep/read trail: the 12
dev-skill names dispatched from `plugins/fgOS/skills/*/SKILL.md`, all
present as flat `.claude/skills/` dirs; `tsk-d3c`'s full D1-D4 decision
log; the merge/date confirmation for commit `1e14290`; and the
zero-hits-for-`mdview` search across `docs/`, `src/`, `.claude/skills/`,
`plugins/`.

## Canonical references

- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (the superseding investigation, D1-D4)
- `docs/history/fgos-skill-discovery-gap/plan.md` (the flatten fix's own shape/verify)
- `docs/history/plugin-skill-packaging-audit/RESEARCH.md` (this item's own research trail)

## Outstanding questions

None
