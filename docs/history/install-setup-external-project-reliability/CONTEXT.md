# CONTEXT — install/setup reliability for external projects (tsk-2qc)

## Feature boundary

fgOS's own `fgos setup`/`fgos doctor` are exercised almost entirely
through forgentX's own dev-checkout self-hosting, where `bin/fgos.mjs`
and `.claude/skills/fgos-*` are always already present at cwd. A project
that only ever does the documented install path (`npm install -g
github:vantt/forgent`, then a Claude Code plugin install) hits two
structural fail-open gaps — bin discovery and skill/plugin registration —
that report clean (`doctor` green) while producing nothing usable
("Unknown skill" / "no fgos on PATH"). This item redesigns both
mechanisms so bin and skill availability are actually verifiable,
self-healing where possible, and loudly reported where not — per
`docs/distribution-vision.md`'s three pillars (setup/doctor self-fix,
multi-context awareness, extensible registry) — not a local patch to two
functions.

Full evidence, live back-and-forth, and two rejected/superseded framings
(see D1→D5 below) live in
`docs/history/install-setup-external-project-reliability/DISCUSSION.md`
(11-round live discussion, 2026-08-13) — this document is the locked
synthesis, not a duplicate transcript.

## Locked decisions

| D-ID | Summary |
|------|---------|
| D1 | fgOS install has 2 independent axes — bin distribution and skill distribution — with no automatic bridge except `fgos setup`/`doctor --fix`. (Skill-axis framing later revised by D5 — see below.) |
| D2 | Bin resolution is 3 deterministic tiers: dev-checkout self-hosting (file-check), project-local install (file-check `node_modules/.bin/fgos`, kept as a real mode for cross-project version pinning), global install (the only tier needing PATH/cache). |
| D3 | Extend `scripts/fgos-shell-integration.sh` to cover all 3 D2 tiers (currently only tier 1→PATH), and stop `integrationScriptPath()`/`checkShellIntegrationSourced` from requiring a git checkout before wiring for npm-installed copies — that requirement is only a real risk for dev-checkout self-hosting. |
| D4 | Tier-3 (global) bin resolution uses a config-cache (`~/.fgos/config.json`) as source of truth; multi-tier probing is a one-time populate/repair step in `fgos setup`/`doctor --fix`, not run on every call. Self-heals via a cheap `existsSync` staleness check. |
| D5 | **Revises D1's skill-axis framing.** Canonical source-of-truth for skill content moves to `.agents/skills/<name>/SKILL.md` (orchestrator-neutral, already exists in-repo). `.claude/skills/<name>/SKILL.md` becomes a thin wrapper stub. `fgos setup`, run in any project, materializes both directly — no `claude` CLI or plugin marketplace registration required for core skill availability. Plugin marketplace becomes optional (only for `/fgOS:xxx` typed-command UX). |
| D6 | The 14 coding-domain dev-skills (dispatch-only, never human-typed) get `user-invocable: false` in their generated wrapper frontmatter; the ~35 CLI-wrapper skills (work-item creation + launcher/orchestrator — the ones a human actually types) stay `user-invocable: true`. Needs one empirical verification step before rollout (see Outstanding below — resolved as a planning/implementation task, not a product gray area). |
| D7 | Wrapper generation uses one shared generator function, called from both an npm script (forgentX's own dogfood + CI, replacing `test/skills/fgos-mirror.test.mjs`'s byte-identical assertion) and `fgos setup`'s external-project path. Generated wrappers are always self-contained inside the target project (copies `.agents/skills/*` + `.claude/skills/*` together, sibling-relative paths) — never point back at a global npm install location. |

Full text and rationale for each D-ID: `fgos show tsk-2qc` (decision log)
or `DISCUSSION.md` §4.

## Pinned terms

- **Bin axis / skill axis** — the two independent install mechanisms (D1):
  getting the `fgos`/`fgos-runner` binaries reachable, vs. getting fgOS
  skill content reachable by an agent harness. No install step satisfies
  both automatically except `fgos setup`.
- **Tier 1/2/3 (bin resolution, D2)** — dev-checkout self-hosting / project-
  local install / global install, in that priority order.
- **Thin wrapper (D5)** — a short `.claude/skills/<name>/SKILL.md` stub
  whose entire content is a read-and-follow redirect to the real
  `.agents/skills/<name>/SKILL.md`, not a full content copy.
- **Dev-skill vs CLI-wrapper skill (D6)** — the pre-existing split from
  `docs/specs/distribution.md` Data Dictionary #4b: 14 `fgos-*`
  coding-domain dev-skills (dispatch-only) vs. ~35 CLI-wrapper skills
  (human-typed). Exact enumeration: `DISCUSSION.md` §7.

## Scout evidence (paths cited during shaping)

- `src/setup/registrations.mjs:1205-1219` — `checkPluginSkillCliReachable`,
  non-login `sh -c "command -v fgos"` lookup (root cause #1).
- `src/setup/registrations.mjs:1118-1124` — `checkClaudePluginMarketplace`
  fail-open when `claude` CLI unreachable (root cause #2, dissolved by D5).
- `src/setup/registrations.mjs:228-239,270-281`, `src/runner/paths.mjs:72-85`
  — `integrationScriptPath()`/`checkShellIntegrationSourced` fail-open when
  not inside a git checkout (root cause #3, D3).
- `src/config/global-config.mjs` — existing project-wins-over-global merge
  semantics, precedent for D4's cache read pattern.
- `package.json` `files` allowlist — confirms `.agents/` missing (needed
  for D5), `plugins/` never shipped via npm.
- `.agents/skills/`, `plugins/fgOS/skills/`, `.claude-plugin/marketplace.json`,
  `test/skills/fgos-mirror.test.mjs` — confirm D5's 3-way hand-mirror
  reality and the exact 14/35 skill split (D6).
- `docs/history/tsk-jtb-pin-fgos-install-to-semver-release/`,
  `docs/history/tsk-65q-gate-bypass-global-install-resolution/` — adjacent,
  already-closed items; D2's version-pinning rationale depends on `tsk-jtb`
  eventually cutting a real tag (currently `git tag -l` shows only
  `pre-tsk-3ce` — no semver tag yet). Out of this item's scope.
- `upstreams/bee` — checked for a reusable pattern; none found (workshop-
  only tool, no npm distribution, never solved this class of problem).

**Impact-analysis posture:** `present` (GitNexus registered,
`fgos tool query --capability impact-analysis --status present`,
2026-08-13) but the index has been repeatedly flagged stale during this
session (`last indexed: c0cedaa`) — degraded, per `CLAUDE.md`'s gate.
Informational only here: this skill produces no code/proof points itself.
`fgos-coding-planning`/`fgos-coding-implement` should re-check freshness
before relying on blast-radius output for the actual `src/setup/*.mjs`
edits.

## Canonical references

- `docs/distribution-vision.md` — the 3-pillar vision this item's design
  is held to (self-fix, multi-context awareness, extensible registry).
- `docs/specs/distribution.md` — current spec, Data Dictionary #4b/#7
  (skill split, doctor check registry) will need updates once D5-D7 land.
- `docs/history/install-setup-external-project-reliability/DISCUSSION.md`
  — full shaping transcript, §6 design synthesis + diagrams, §7 candidate
  task breakdown (3 tasks: bin-discovery, skill-source-of-truth, hide-dev-
  skills).

## Outstanding questions

None
