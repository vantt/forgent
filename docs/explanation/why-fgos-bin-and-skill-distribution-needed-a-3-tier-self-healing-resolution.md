---
type: explanation
title: Why fgOS bin and skill distribution needed a 3-tier self-healing resolution
tags: [distribution, install, setup, doctor, skill-materialization, external-project]
source_capture_ids: [tsk-2qc]
authoritative_for: why fgOS install/setup resolves the fgos binary through a 3-tier cached scheme, and why skill materialization no longer depends on the claude CLI or plugin marketplace
---
# Why fgOS bin and skill distribution needed a 3-tier self-healing resolution

`tsk-2qc`. Full design: `docs/history/install-setup-external-project-reliability/CONTEXT.md`.
Mission #1/#2 (`AGENTS.md`) — this is entirely about a project that only
ever does the documented fgOS install path, not forgentX's own
dev-checkout dogfood context.

## Two real, silent failures found together (2026-08-13)

1. **`sh -c command -v fgos` resolves nothing for an nvm-based global
   install.** Both `checkPluginSkillCliReachable`
   (`src/setup/registrations.mjs`) and `pick/SKILL.md`'s own fgOS-CLI
   fallback resolve the global `fgos` binary this way — a
   non-interactive, non-login shell. nvm-based global installs (the
   README-recommended path) only add npm's global bin dir to `PATH`
   inside *interactive-shell* blocks of `~/.bashrc`/`~/.zshrc`, so this
   lookup returns empty on a machine that installed fgOS exactly the
   recommended way, with no secondary package manager happening to
   provide a redundant `PATH` export. Confirmed on the investigating
   machine itself: `fgos` only resolved via `PATH` because a second,
   redundant `pnpm`-global install happened to also be present —
   the intended path alone would have failed silently.
2. **A missing `claude` binary makes a real check report false-green.**
   `checkClaudePluginMarketplace` (`registrations.mjs:1118-1124`) returns
   `passed: true` ("not applicable here") when the `claude` binary isn't
   on `PATH` at the moment `fgos setup`/`doctor` runs — a likely
   first-run situation (installing fgOS before ever opening Claude Code).
   This fail-open means the marketplace/plugin auto-install step never
   fires, `doctor` reports green, and every `/fgOS:*` skill then fails
   `Unknown skill` in that project **permanently**, with no signal
   anything is wrong and no automatic re-check.

Related but separately scoped: `tsk-jtb`
(`docs/explanation/why-fgos-install-is-pinned-to-a-semver-tag-instead-of-main-head.md`
— both the global install and `claude plugin marketplace add` floated on
`main` HEAD) and `tsk-65q` (two `SKILL.md` files assumed fgOS source was
vendored in the calling repo, crashing for plugin-only external
consumers — see
`docs/explanation/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md`).

## D1/D2: two independent axes, bin and skill distribution

Bin distribution and skill distribution are separate concerns with no
automatic bridge except `fgos setup`/`doctor --fix`. Bin resolution
itself splits into three deterministic tiers: dev-checkout self-hosting
(a file-check), project-local install (`node_modules/.bin/fgos`, kept as
a real supported mode for cross-project version pinning, not just an
implementation detail), and global install — the only tier that actually
needs `PATH`/cache resolution at all.

## D3/D4: cache-then-verify, not probe-every-call

`scripts/fgos-shell-integration.sh` is extended to cover all three D2
tiers (it previously only handled tier 1's `PATH` wiring), and
`integrationScriptPath()`/`checkShellIntegrationSourced` stop requiring a
git checkout before wiring for npm-installed copies — that requirement
is only a real risk for dev-checkout self-hosting, not the tiers external
consumers actually use.

Tier-3 (global) bin resolution uses a config-cache
(`~/.fgos/config.json`) as its source of truth. Multi-tier probing is a
**one-time populate/repair step** inside `fgos setup`/`doctor --fix`,
never run on every call — and self-heals via a cheap `existsSync`
staleness check rather than re-probing PATH each time.

## D5: skill materialization stops depending on the `claude` CLI at all

This is the decision that directly closes failure 2 above, by revising
D1's own original skill-axis framing: the canonical source of truth for
skill content moves to `.agents/skills/<name>/SKILL.md` (already
orchestrator-neutral, already existing in-repo). `.claude/skills/<name>/SKILL.md`
becomes a thin wrapper stub. `fgos setup`, run in any project, now
materializes both directly — no `claude` CLI presence and no plugin
marketplace registration required for core skill availability. The
plugin marketplace becomes optional, needed only for the `/fgOS:xxx`
typed-command UX, not for the underlying skills to exist and work.

## D6/D7: which skills get typed, and how wrappers are generated

The 14 coding-domain dev-skills (dispatch-only, never human-typed) get
`user-invocable: false` in their generated wrapper frontmatter; the ~35
CLI-wrapper skills (work-item creation plus launchers/orchestrators — the
ones a human actually types) stay `user-invocable: true`. Wrapper
generation uses one shared generator function, called from both an npm
script (forgentX's own dogfood/CI, replacing
`test/skills/fgos-mirror.test.mjs`'s byte-identical assertion) and `fgos
setup`'s external-project path — generated wrappers are always
self-contained inside the target project (copying `.agents/skills/*` +
`.claude/skills/*` together, sibling-relative paths), never pointing back
at a global npm install location.
