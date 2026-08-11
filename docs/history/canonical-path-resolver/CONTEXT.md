# Canonical path resolver — CONTEXT

## Feature boundary

`tsk-63j`. Today, every place that needs the root path of fgOS storage
(`.fgos/`), its logs (`.fgos/logs/`), its database-of-record (`state.json`
+ `events.jsonl`, both under `.fgos/`), or a skill's own on-disk location
resolves that path independently — `process.cwd()`-based lookups scattered
across `bin/fgos.mjs`, `src/runner/session.mjs`, `src/runner/loop.mjs`, and
a separate env-var convention (`FGOS_NESTED_PREFIX`, from `tsk-3fb`) baked
into 17 `plugins/fgOS/skills/*/SKILL.md` templates for skill paths.

This item locks the decisions for replacing all of that with one canonical
resolver function: parses the environment variables it needs, precomputes
every path it is responsible for (including shell profile paths on
bash/zsh/Windows), and is called at the start of both a fgOS CLI process
and a Claude Code session (via a SessionStart hook), so every consumer
reads precomputed paths instead of re-deriving them.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | One resolver function, called from two entry points: (a) fgOS CLI process start (`bin/fgos.mjs`, `bin/fgos-runner.mjs`), and (b) a Claude Code SessionStart hook that injects the precomputed paths as session context/env — matching the SessionStart-hook pattern this repo already uses for other startup context. |
| D2 | Scope is everything named in the title, in full: the `.fgos` storage root (today scattered via `process.cwd()` in `bin/fgos.mjs:61`, `src/runner/session.mjs:84`, `src/runner/loop.mjs:281`/`941`), the logs directory (`.fgos/logs/`, written by `src/runner/worker-log.mjs`), the database-of-record (`state.json` + `events.jsonl`, both already living under the `.fgos` root — "database" is this event-sourced state, not a separate DB engine; none exists in this repo), and skill-path resolution (the `plugins/fgOS/skills/*/SKILL.md` path templates). |
| D3 | Shell profile-path detection is in scope for bash, zsh, **and Windows** now. Today `src/setup/shell-rc.mjs` only detects `.bashrc`/`.zshrc` (`RC_FILE_NAMES`) — there is no Windows equivalent (e.g. PowerShell `$PROFILE`) anywhere in this repo. This item adds it, not just documents it as future intent. |
| D4 | ~~The new resolver subsumes `tsk-3fb`'s `FGOS_NESTED_PREFIX` env var — it becomes the single place that variable is read and applied, folding the skill-path mechanism `tsk-3fb` shipped into this resolver rather than leaving it as a second, separate path mechanism.~~ **Revised at `fgos-coding-implement`** (empirical check: `grep -rn FGOS_NESTED_PREFIX --include=*.mjs --include=*.cjs --include=*.js .` — zero hits). The variable is read nowhere in JS; it is a pure shell-substitution pattern inside the 17 `SKILL.md` templates, expanded by the calling shell *before* Node starts. An in-process resolver cannot retroactively become that read — literal subsumption is not buildable. **D4-revised**: the resolver independently parses `FGOS_NESTED_PREFIX` for its own JS-side needs (same variable name, a second independent reader); the 17 templates keep their existing shell-substitution pattern unchanged. |

| D5 | **Added at `fgos-coding-implement`**, before any code was touched: `bin/fgos.mjs`'s CLI is intentionally cwd-strict (its own comment, line 64-69: `.fgos/` "always lives under the caller's own cwd," never git-resolved), while `src/runner/loop.mjs`'s `resolveRepoRoot` deliberately shells out to `git rev-parse --show-toplevel` — needed because `session.mjs`'s worktree-management callers (`reclaimOrphanedSessions`/`endSession`/`listSessions`, GitNexus-confirmed HIGH risk, 4 direct callers) must resolve correctly from inside a worktree, not just the main checkout. The resolver takes an explicit mode/option for this (strict cwd-only vs git-resolved) rather than picking one behavior for both — preserves both existing, documented, tested contracts exactly. |

## Pinned terms

- **Canonical resolver** — the single function this item locks the shape
  of; not a class, not a config file, one function other code calls.
- **"Session"** (per D1) — ambiguous on its face; locked to mean *both*
  a fgOS CLI process invocation and a Claude Code agent session, not
  either one alone.
- **"Database"** (per D2) — this repo's event-sourced work-item state
  (`state.json` derived view + `events.jsonl` append-only log), not a
  SQL/NoSQL engine. Confirmed by scout: no `sqlite`/`.db`/`better-sqlite`
  hit anywhere in `src`, `bin`, or `package.json`.

## Scout evidence

- `bin/fgos.mjs:61` — `path.join(process.cwd(), '.fgos')`, the primary
  `.fgos` root getter, cwd-based.
- `src/runner/session.mjs:84` — `path.join(path.resolve(repoRoot), '.fgos')`,
  a second independent `.fgos` root getter.
- `src/runner/loop.mjs:281` (`resolveRepoRoot(cwd = process.cwd())`) and
  `:941` (`path.join(repoRoot, '.fgos')`) — a third.
- `src/runner/worker-log.mjs:72,100` — `path.join(dir, 'logs')`, logs
  directory derived from a caller-supplied `.fgos` dir; folds naturally
  under the root resolver once that root is unified.
- `scripts/herdr-cockpit.sh:41` — `'${REPO_ROOT}/.fgos/logs/'*.log`,
  confirms logs live under the `.fgos` root in practice today.
- `src/setup/shell-rc.mjs:13` — `RC_FILE_NAMES = ['.bashrc', '.zshrc']`,
  no Windows entry; confirms D3's "not previously supported" claim.
- `docs/history/fgos-repo-prefix-path-fix/CONTEXT.md` (`tsk-3fb`) — prior
  item that introduced `FGOS_NESTED_PREFIX` for skill-path resolution
  across workshop/standalone layouts, scoped at the time to 20 templates
  plus 2 specs. Re-verified against today's repo: `grep -rl
  FGOS_NESTED_PREFIX plugins/fgOS/skills/*/SKILL.md | wc -l` → 17 (matches
  `ls plugins/fgOS/skills/ | wc -l`, every current skill dir uses it), and
  only `docs/specs/fgos-plugin.md:167-168` documents the pattern —
  `docs/specs/distribution.md:287`'s `repo/bin/fgos.mjs` line is unrelated
  (setup/doctor verb dispatch). Counts below use the re-verified numbers,
  not `tsk-3fb`'s original ones. D4 folds this mechanism into the new
  resolver rather than leaving it standalone.
- `grep -rln -iE "sqlite|\.db['\"]|better-sqlite" src bin package.json` —
  no hits, confirming D2/pinned-terms' "no separate DB engine" claim.

## Canonical references

- `bin/fgos.mjs`, `bin/fgos-runner.mjs` — CLI entry points needing the
  resolver at process start (D1).
- `src/runner/session.mjs`, `src/runner/loop.mjs`, `src/runner/worker-log.mjs`
  — current independent path getters this resolver replaces (D2).
- `src/setup/shell-rc.mjs` — current bash/zsh-only profile detection,
  extended for Windows under D3.
- `plugins/fgOS/skills/*/SKILL.md` (17 files) and
  `docs/specs/fgos-plugin.md:167-168` (1 spec) and
  `docs/history/fgos-repo-prefix-path-fix/CONTEXT.md` — `tsk-3fb`'s
  `FGOS_NESTED_PREFIX` mechanism, subsumed per D4.

## Outstanding questions deferred to planning

- Exact resolver module location and export shape (new file under
  `src/state/` or `src/runner/`? single function vs. a small object of
  path getters?) — implementation choice, not a product decision.
- Exact env var names the resolver parses beyond `FGOS_NESTED_PREFIX`
  (the description says "parses the environment variables it needs" but
  names none new) — planning should confirm no new env var is actually
  required beyond what D2's scope already implies, or name the ones that
  are.
- SessionStart hook wiring mechanics (hook script path, how injected
  context reaches consuming skills/commands) — implementation choice.
- Windows PowerShell `$PROFILE` detection mechanics (single default path
  vs. querying the actual `$PROFILE` variable) — implementation choice,
  deferred to planning/implementation.
- Migration path for the 17 `plugins/fgOS/skills/*/SKILL.md` templates
  once `FGOS_NESTED_PREFIX` is subsumed (D4) — whether those templates
  change at all, or only the resolver's internal reading of the env var
  changes — implementation choice for planning to size.
