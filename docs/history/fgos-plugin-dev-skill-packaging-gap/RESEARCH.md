# fgos plugin dev-skill packaging gap — RESEARCH

## Round 1 — 2026-08-12 (tsk-32b, discovery stage)

**Asked:** does Claude Code's plugin system support a plugin
(`plugins/fgOS/.claude-plugin/plugin.json`) declaring/loading skills from a
directory OTHER than the plugin's own `<plugin>/skills/` — e.g. a symlink,
an additional-path field, or any mechanism that references skills living
outside the plugin bundle — versus requiring every skill file to be
physically copied into `<plugin>/skills/`. This determines whether
"package the coding-domain dev-skills into the plugin" can point at the
existing `.claude/skills/fgos-coding-*` tree without a second physical
copy, or whether it necessarily means duplicating files (and therefore
needs its own sync story to avoid recreating the exact byte-identical
mirror-drift bug already tracked at tsk-4jk/tsk-18g/tsk-11f/tsk-2qh).

**Checked — repo first:**
- `plugins/fgOS/.claude-plugin/plugin.json` (read directly): only
  `name`/`description`/`version`/`author` today — no `skills` field at
  all, confirming the plugin currently relies entirely on the default
  `skills/` directory scan.
- `find plugins/fgOS -maxdepth 2 -type d`: only the 34 slash-command
  wrapper skills live under `plugins/fgOS/skills/` — no reference of any
  kind to `.claude/skills/fgos-coding-*`.
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (tsk-d3c, closed,
  D1-D4): a DIFFERENT but related bug, already root-caused and fixed
  within this same repo — the project-skill scanner
  (`.claude/skills/<name>/SKILL.md`, not the plugin loader) only
  enumerates ONE level deep, so a nested layout
  (`.claude/skills/fgos/<name>/SKILL.md`) was invisible until flattened to
  `.claude/skills/<name>/SKILL.md` (commit `1e14290`, confirmed fixed
  end-to-end). This explains why `.claude/skills/fgos-coding-driving/`
  today sits flat, and confirms the project-skill scanner and the plugin
  skill loader are two SEPARATE discovery mechanisms — tsk-d3c's fix does
  not touch or improve the plugin loader, so it does not help a session
  outside this repo's own working tree (this item's own case).
- `docs/distillery/sources/superpowers.md`, `plans/reports/distill-
  superpowers-packaging-inventory-*.md`: a third-party tool (Pi) has its
  own bespoke `"pi": {"skills": [...]}` field in `package.json` — not part
  of Claude Code's own plugin manifest schema, not applicable here.

**Checked — external (not found conclusively in repo):**
- WebSearch → `https://code.claude.com/docs/en/plugins-reference`
  (WebFetch, official Claude Code docs). Confirmed via the "Plugin
  manifest schema" and "Path behavior rules" sections:
  - `plugin.json` DOES support a `"skills"` manifest field (string or
    array), e.g. `"skills": "./custom/skills/"`.
  - This field **adds to** the default `skills/` directory scan (does not
    replace it, unlike `commands`/`agents`).
  - **"For all path fields: All paths must be relative to the plugin root
    and start with `./`, except that the `skills` field also accepts
    `"."`."** Both `"."` and `"./"` denote the plugin root itself. There
    is no documented mechanism for a path that escapes the plugin root
    (e.g. `../`) or an absolute path into a sibling repository.
  - Marketplace-installed plugins are additionally copied to
    `${CLAUDE_PLUGIN_ROOT}`, a cache location wholly separate from the
    source repository, at install/update time — even if a relative
    `../`-style escape were permitted at the schema level, there is no
    stable path back to a specific source checkout (like forgentX's own
    working tree) from that cache location once installed.

**Finding:** `plugin.json`'s `skills` field can only ADD paths that live
INSIDE the plugin's own directory tree. There is no supported mechanism —
symlink, external path, or otherwise — for a plugin to reference skill
files that live outside itself, and specifically none that could reach
across repositories to forgentX's own `.claude/skills/fgos-coding-*` tree.
Any "package the dev-skills into the plugin" fix necessarily means
physically copying those files into `plugins/fgOS/` (directly under
`skills/`, or into a `skills`-manifest-referenced subfolder within the
plugin) — which then needs its own answer for staying in sync, the same
open problem the existing `.claude/skills` <-> `.agents/skills` mirror
already has trouble with (tsk-4jk/18g/11f/2qh: drift slips through
undetected between edits).

**Still open (not this round's question — a scope choice, not a research
gap):** which of the following the fix should actually be:
(a) physically copy the coding-domain dev-skills into the plugin with some
new sync/build step, (b) a runtime fallback where a plugin skill catches
"Unknown skill" and reads the target SKILL.md directly via Read (only ever
helps when a forgentX checkout is reachable from the calling session —
not a real fix for a genuine plugin-only consumer with no such checkout
on disk), or (c) explicitly document today's dev-skill dispatch as
forgentX-checkout-only and add a doctor check that fails loudly instead of
erroring mid-run. This is a product/scope decision, not something further
research resolves.

## Round 2 — 2026-08-20 (tsk-5zi, discovery stage)

**Asked:** Round 1's D3 (CONTEXT.md) locked test-based enforcement
(extend `test/skills/fgos-mirror.test.mjs`'s byte-identical assertion to
`plugins/fgOS/skills/`) but explicitly left open "whether to ALSO add an
active copy/generation script ... vs relying on a failing test to force a
manual re-sync" as an implementation-approach choice. tsk-5zi proposes
closing that open choice: extend `npm run build:skills`
(`src/setup/skill-wrappers.mjs`) to auto-copy `.agents/skills/<name>` →
`plugins/fgOS/skills/<name>` for the 14 dev-skills, reusing the existing
`copyDirRecursive` helper. Is this concretely buildable against the real
current code, and does the byte-identical claim in tsk-5zi's own
description still hold?

**Checked — repo first:**
- `src/setup/skill-wrappers.mjs:96` — `copyDirRecursive(sourceDir,
  targetDir)` already exists, module-local (not exported), recursively
  copies and overwrites every file — already reused by
  `generateAllSkillWrappers` (`:62`), `assembleSkills` (`:122`), and
  `materializeSkillsIntoProject` (`:197`) for the analogous
  `.agents/skills` → `.claude/skills`(wrappers)/`targetRoot` copies. A new
  function in the same module can call it directly for the third leg
  without exporting it.
- `scripts/build-skill-wrappers.mjs` (read directly, 29 lines) — the
  `npm run build:skills` entrypoint (`package.json:31`). Currently calls
  only `assembleSkills` then `generateAllSkillWrappers`; never touches
  `plugins/fgOS/skills/` at all today.
- `plugins/fgOS/skills/` (`ls`, 49 entries) vs `.agents/skills/` (`ls`, 16
  entries: `_shared`, `distill`, and the 14 `fgos-*` dev-skills) — the 14
  `fgos-*` dev-skill names in `.agents/skills` are exactly the 14 present
  in `plugins/fgOS/skills` (`distill` is NOT mirrored into
  `plugins/fgOS/skills` — matches `test/skills/fgos-mirror.test.mjs:231-
  234`'s explicit "only the 14 dev-skills are in scope for D6" assertion).
- `diff -rq` run live, fresh, against every one of the 14
  `.agents/skills/fgos-*` dirs and `plugins/fgOS/skills/fgos-*`
  counterparts, plus `_shared`: **all empty** — confirms tsk-5zi's own
  description claim ("2 bên đang byte-identical") still holds today,
  2026-08-20, not just at the description's original write time.
- `test/skills/fgos-mirror.test.mjs:30-39` (comment) — explicitly states
  the plugin leg "stays hand-maintained ... a full byte-identical copy
  against the real canonical source, `.agents/skills`" — confirms no
  active sync exists yet, matching Round 1's D3 framing. Lines `115-150`
  already assert the exact target shape any new sync function must
  satisfy: same `fgos-*` name set, same relative file paths, byte-
  identical content, for every dev-skill. Lines `171-189` assert the same
  for `_shared/` (tsk-53h/tsk-32b: 6 of the 14 dev-skills reference
  `../_shared/executor-dispatch-fallback.md`, so `_shared` must mirror
  too). These tests already pass today (manual copy); a build:skills
  extension does not need to change the tests, only make the state they
  assert self-maintaining.
- `src/setup/registrations.mjs:1921-1946` — doctor check
  `plugin-dev-skills-packaged` only checks *presence* (`SKILL.md` exists
  at the target path), not content — unaffected either way by whether the
  copy is manual or automated.
- `grep -rn "plugins/fgOS/skills"` across `scripts/`, `src/`,
  `package.json`: no other script or module writes into
  `plugins/fgOS/skills/` — the new function has no other caller/path to
  coordinate with besides `scripts/build-skill-wrappers.mjs`.

**Finding:** Fully buildable with existing pieces, no new external
research needed. Concrete shape: add one new exported function in
`src/setup/skill-wrappers.mjs` (e.g. `mirrorDevSkillsIntoPlugin`) that
lists `.agents/skills/<name>` for `_shared` and every `fgos-*`-prefixed
directory and calls the existing `copyDirRecursive` for each into
`plugins/fgOS/skills/<name>`; call it from
`scripts/build-skill-wrappers.mjs` after the existing
`generateAllSkillWrappers` call. `materializeSkillsIntoProject`
(external-project setup path) does NOT need this call —
`plugins/fgOS/skills/` is this repo's own package-relative plugin
directory, not something materialized per external `targetRoot`.

**Still open:** none — this closes Round 1's D3 open choice. No
`awaiting-human` question remains; ready for a `clear` discovery verdict.
