# fgOS plugin dev-skill packaging gap — CONTEXT

## Feature boundary

`tsk-32b`. `plugins/fgOS/skills/` (the globally-installed plugin) only ever
packages the top-level slash-command wrapper skills (`cook`, `discover`,
`plan`, `pick`, `submit`, ...). The coding-domain dev-skills those wrappers
invoke via the `Skill` tool (`fgos-coding-driving`, `fgos-coding-exploring`,
`fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`,
`fgos-coding-discovering`, `fgos-coding-shaping`, `fgos-coding-compounding`,
`fgos-routing`, `fgos-clarifying`, `fgos-researching`, `fgos-fanout`,
`fgos-indexing`, `fgos-unlock`) exist only under this repo's own
`.claude/skills/` (mirrored to `.agents/skills/`) — never referenced from
`plugins/fgOS/`. A session whose cwd is a different repo that only
installed fgOS as a plugin gets `Unknown skill` the first time a plugin
skill tries to dispatch into one of them. Reproduced live (2026-08-12,
tsk-5yf/mdview — see this item's own description for the transcript).
This item locks the fix direction; the fix itself belongs to
`fgos-coding-planning`.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Fix scope combines two of the three researched candidate directions, per explicit human decision (2026-08-12, tsk-32b's `awaiting-human` round): (a) physically copy/package the coding-domain dev-skills into `plugins/fgOS/`, with an *enforced* sync mechanism; and (c) document today's (and post-fix) dev-skill dispatch posture in `docs/distribution-vision.md`/`docs/specs/distribution.md`, plus a doctor check that fails loudly. (b) — a runtime fallback where a plugin skill catches `Unknown skill` and Reads the target SKILL.md directly — is explicitly OUT of scope: it only band-aids the case where a forgentX checkout happens to be reachable from the calling session's own machine (this item's own reproduction case), not a real fix for a genuine plugin-only consumer with no forgentX checkout anywhere. |
| D2 | `.claude/skills/fgos-coding-*` (and its existing `.agents/skills` mirror) stays the single edited source of truth. `plugins/fgOS/`'s copies are an ADDITIONAL generated/enforced mirror, never an independently-edited third copy — the same discipline already governing the `.claude/skills` <-> `.agents/skills` relationship (`docs/specs/runner.md` D4), just extended to a third leg. Rationale: the human decision (D1) explicitly said "must not create a second manually-maintained mirror alongside the existing one" — a plugins/fgOS copy that could be edited independently of `.claude/skills` would be exactly that, a second/competing source. |
| D3 | Enforcement follows this repo's own existing precedent rather than inventing a new mechanism: `test/skills/fgos-mirror.test.mjs` already asserts `.claude/skills/fgos-*` and `.agents/skills/fgos-*` are byte-identical (confirmed by reading the test directly, scout evidence below) — extend that SAME test-based enforcement shape to also compare `plugins/fgOS/skills/fgos-*` (or wherever `fgos-coding-planning` decides the copies live inside the plugin) against `.claude/skills/fgos-*`, so a real `npm test` failure — not just a documented convention — catches drift. Whether to ALSO add an active copy/generation script (vs. relying on a failing test to force a manual re-sync, same as today's `.claude/skills`/`.agents/skills` pair currently does) is left to `fgos-coding-planning` — an implementation-approach choice, not a product decision this item locks. |
| D4 | Where inside `plugins/fgOS/` the copies live (directly under the existing `skills/` alongside the CLI-wrapper skills, vs. a separate subfolder referenced via `plugin.json`'s `skills` manifest field per the confirmed schema — see RESEARCH.md Round 1) is left to `fgos-coding-planning` — an implementation/naming choice, not a product decision. |
| D5 | The doctor check (part of D1's (c)) sits beside the existing `plugin-skill-cli-reachable` check (`src/setup/registrations.mjs:1092`) and reports whether the coding-domain dev-skills the plugin's own slash-commands depend on are actually present in the installed plugin's own directory (i.e. checks D1(a)'s own fix artifact exists) — it does NOT attempt to intercept or detect a live `Skill()` tool dispatch failure at runtime; doctor has no hook into that resolution. Exact check semantics (which skill names it verifies, pass/fail message wording) is left to `fgos-coding-planning`/implementation. |
| D6 | The distribution-doc update (also part of D1's (c)) states the posture explicitly in both `docs/distribution-vision.md` and `docs/specs/distribution.md`: before this fix, `/fgOS:cook`/`/fgOS:discover`/`/fgOS:plan`/`/fgOS:pick`'s own dev-skill dispatch only worked from a forgentX checkout; after, a plugin-only install also works. Exact wording/section placement is left to `fgos-coding-planning`. |

## Pinned terms

- **Plugin (CLI-wrapper) skill** — a skill under `plugins/fgOS/skills/<name>/SKILL.md`, distributed with the fgOS plugin, invoked as `fgOS:<name>` (or bare `<name>`) from any repo that installs the plugin. Today: `cook`, `discover`, `plan`, `pick`, `submit`, `move`, `return`, `ask`, `answer`, `list`, `ready`, `stale`, `triage`, `graph`, `rollup`, `show`, `check`, `conflicts`, `goal`, `terminal`, `terminal-close`, `unlock`, `coding-shape`, `coding-shape-distill`, and the `merge-*`/`plan-*`/`discover-*`/`retro-*`/`cleanup-*` families.
- **Coding-domain dev-skill** — a skill under `.claude/skills/fgos-*/SKILL.md` (mirrored to `.agents/skills/`) that owns a stage of the `coding` domain's own lifecycle (`fgos-coding-discovering`, `fgos-coding-exploring`, `fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`, `fgos-coding-driving`, plus the stage-agnostic helpers `fgos-routing`, `fgos-clarifying`, `fgos-researching`, `fgos-fanout`, `fgos-indexing`, `fgos-unlock`, `fgos-coding-shaping`, `fgos-coding-compounding`). These are what this item is about making reachable from a plugin-only install.
- **Plugin-only consumer** — a session whose cwd is a repo that installed fgOS solely as a Claude Code plugin (via `enabledPlugins`/marketplace), with no forgentX checkout anywhere reachable — the case D1 requires a real fix for, as opposed to the narrower "forgentX checkout reachable on the same machine" case the rejected (b) would have band-aided.

## Scout evidence

- `plugins/fgOS/.claude-plugin/plugin.json` (read directly): today only `name`/`description`/`version`/`author` — no `skills` manifest field, confirming the plugin relies entirely on its default `skills/` directory scan.
- `find plugins/fgOS -maxdepth 2 -type d`: 34 slash-command wrapper skills, no reference of any kind to `.claude/skills/fgos-coding-*`.
- `test/skills/fgos-mirror.test.mjs` (read directly): already asserts `.claude/skills/fgos-*` and `.agents/skills/fgos-*` declare the same skill-name set AND are byte-identical file-for-file — the exact enforcement shape D3 extends. No active generation/copy script exists anywhere in `scripts/`/`package.json` today (`rg`/`find` for `mirror`/`sync`+`skill` returned nothing) — today's two-way mirror is enforced by a failing test only, kept in sync by hand; this is the same discipline (and the same known drift risk, tsk-4jk/tsk-18g/tsk-11f/tsk-2qh) D2/D3 deliberately extend rather than replace with something new.
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (tsk-d3c, closed): a DIFFERENT, already-fixed bug — the project-skill scanner (not the plugin loader) only enumerates one directory level deep, so a nested `.claude/skills/fgos/<name>/SKILL.md` layout was invisible until flattened. This explains why `.claude/skills/fgos-coding-driving/` sits flat today, and confirms the project-skill scanner and the plugin skill loader are two separate discovery mechanisms — tsk-d3c's fix does not help this item's own case (a session entirely outside this repo's working tree).
- `docs/history/fgos-plugin-dev-skill-packaging-gap/RESEARCH.md` (this item's own discovery-stage research, Round 1): Claude Code's official plugin manifest schema (`code.claude.com/docs/en/plugins-reference`) confirms a `skills` manifest field exists and ADDS to (never replaces) the default `skills/` scan, but "All paths must be relative to the plugin root and start with `./`" — no mechanism exists to reference a directory outside the plugin, and marketplace-installed plugins are copied to a separate `${CLAUDE_PLUGIN_ROOT}` cache location at install time regardless. This is why D1(a) requires physical copies, not a reference.
- `fgos tool query --capability impact-analysis --status present`: GitNexus registered and `present` — impact-analysis capability is `full` per `CLAUDE.md`'s own gate. Informational only; this item is exploring/locking decisions, not editing code or symbols yet, so no impact-analysis run was needed at this stage — `fgos-coding-planning`/`fgos-coding-implement` will run it against the specific symbols/files their own plan touches.

## Canonical references

- `plugins/fgOS/.claude-plugin/plugin.json`
- `plugins/fgOS/skills/cook/SKILL.md`
- `.claude/skills/fgos-coding-driving/SKILL.md`
- `test/skills/fgos-mirror.test.mjs`
- `src/setup/registrations.mjs:1092` (`plugin-skill-cli-reachable`)
- `docs/distribution-vision.md`, `docs/specs/distribution.md`
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (related, already-closed bug — different root cause)
- `docs/history/fgos-plugin-dev-skill-packaging-gap/RESEARCH.md` (this item's own discovery-stage research)

## Outstanding questions

None
