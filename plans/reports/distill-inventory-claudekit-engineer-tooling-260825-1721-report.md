# claudekit-engineer tooling/scripting/CI/distribution inventory

Mechanical inventory only — no porting recommendations. Repo root:
`/home/vantt/projects/forgentX/upstreams/claudekit-engineer/`.

---

## 1. `scripts/` directory tree

```
scripts/
  check-metadata-deletions.js          (+ .test.cjs)
  check-skill-cross-refs.js            (+ .test.cjs)
  check-skill-descriptions.js          (+ .test.cjs)
  check-skill-routing.js
  commands_data.yaml                    (retired stub — see below)
  generate-managed-hooks.cjs           (+ .test.cjs)
  generate-release-manifest.cjs
  hook-require-integrity.test.cjs      (test only, no matching non-test .js in scripts/)
  install-ps1-safety.test.cjs          (tests claude/skills/install.ps1, see §6)
  lint-content.cjs                     (+ .test.cjs)
  prepare-release-assets.cjs
  release-bookkeeping.cjs              (+ .test.cjs)
  release-bookkeeping-helpers.cjs
  send-discord-release.cjs             (+ .test.cjs)
  skill-description-lint-allowlist.json
  skills_data.yaml                      (generated skill catalog dump)
  team-surface-contract.test.cjs       (test only)
  win_compat.py
  eval/
    eval-utils.ts
    run.ts
    tier-1-static.ts
    tier-1-validators.ts
    tier-2-e2e.ts
    tier-3-judge.ts
  lib/
    validate-allowlist-reason.js       (+ .test.cjs)
  __fixtures__/
    bad-skill/SKILL.md
    clean-skill/SKILL.md
```

**Overall shape:** this is a CI-quality-gate layer for a "content kit" repo (a
boilerplate of Claude Code skills/hooks/agents shipped as a distributable
package, not an application). Almost every top-level `.js`/`.cjs` file is a
standalone Node CLI check invoked by `npm test`, `npm run lint`, or a specific
GitHub Actions job — none of them import a shared framework; each is
`require.main === module` gated and also exports its internals for the
paired `.test.cjs` file (Node's built-in `node --test` runner, no Jest/Mocha).

How they're wired — from root `package.json`'s `"scripts"` block:
```json
"test": "node --test scripts/release-bookkeeping.test.cjs scripts/send-discord-release.test.cjs scripts/install-ps1-safety.test.cjs scripts/check-metadata-deletions.test.cjs scripts/check-skill-cross-refs.test.cjs scripts/lint-content.test.cjs scripts/hook-require-integrity.test.cjs scripts/team-surface-contract.test.cjs scripts/generate-managed-hooks.test.cjs claude/hooks/__tests__/descriptive-name.test.cjs claude/hooks/__tests__/workflow-artifact-gate.test.cjs claude/skills/show-off/scripts/preferences.test.js claude/skills/watzup/scripts/watzup-scan.test.cjs && python3 claude/skills/chrome-profile/scripts/test_chrome_profile.py",
"lint": "node scripts/lint-content.cjs",
"semantic-release": "semantic-release",
"prepare": "husky install || true",
"test:eval": "bun scripts/eval/run.ts 1",
"test:eval:e2e": "bun scripts/eval/run.ts 2 --diff",
"test:eval:judge": "bun scripts/eval/run.ts 3 --diff",
"test:eval:all": "bun scripts/eval/run.ts all"
```
Note: `npm test` explicitly lists individual `.test.cjs`/`.test.js` files
(not a glob) — it also reaches into `claude/hooks/__tests__/` and specific
`claude/skills/*/scripts/*.test.*` files outside `scripts/`, plus a final
`&&`-chained Python test (`test_chrome_profile.py`). `check-skill-*.js`,
`check-metadata-deletions.js` themselves are NOT in the `test` npm script —
they're invoked directly as CI steps in `quality-gates.yml`, separate from
`npm test`.

### Key top-level scripts — what each does

**`check-metadata-deletions.js`** — CI gate. Diffs the current branch
against `origin/$GITHUB_BASE_REF` (allowlisted to `dev`/`main` only, to
avoid shell injection via the env var), finds every `D`/`R`-status path
under `claude/`, and verifies each has a matching entry in
`claude/metadata.json`'s `deletions[]` array (supports exact paths, dir
prefixes, and glob patterns with `*`, `**`, `?`, `{a,b}`). Also runs the
inverse check: rejects any `deletions[]` entry that still matches a live
file under `claude/` (except an explicit allowlist, currently
`command-archive/**`). Exit 1 on any mismatch.

**`check-skill-cross-refs.js`** — CI gate. Builds a skill-name registry by
scanning every `claude/skills/*/SKILL.md` frontmatter `name:` field
(stripping a leading `ck:` prefix), then regex-scans all `claude/**/*.md`
for `/ck:<name>` references and flags any that don't resolve. Also flags
skill names colliding with a hardcoded set of Claude Code built-in command
names (`help`, `clear`, `debug`, `plan`, etc.), with an allowlist for
directories intentionally named `ck-debug`/`ck-plan`/`ck-code-review` to
dodge the collision at the filesystem level. Separately, for **changed**
`SKILL.md` files only (diffed against `origin/dev` or
`$SKILL_CROSS_REF_BASE_REF`), scans for local relative-path references
(`scripts/…`, `references/…`, `agents/…`, etc.) and verifies the target
file exists on disk relative to the skill directory.

**`check-skill-descriptions.js`** — CI gate + shared rule library. Lints
every `SKILL.md` frontmatter against a `RULES` array (`use-this-prefix`
minor, `maintainer-marker` major, `todo-marker` major, `too-short` minor
`<50` chars, `too-long` minor `>512` chars) plus auto-emitted findings for
missing `description`, unparseable frontmatter, missing `when_to_use`,
missing `user-invocable: true`, `disable-model-invocation: true` present,
and project-level skill-listing budget settings
(`skillListingBudgetFraction`, `skillListingMaxDescChars`,
`skillOverrides`) read from `claude/settings.json`. It computes a
projected total listing-character budget across all skills and requires
`skillListingBudgetFraction` to be large enough for a 200k-token context
floor (4 chars/token heuristic). Supports a JSON allowlist
(`skill-description-lint-allowlist.json`) keyed by skill name + rule ID +
required `reason` (validated via `lib/validate-allowlist-reason.js`, min 20
chars, rejects placeholders). Exits 1 only on **major** findings; minor
findings are non-blocking. This file's `RULES`/`extractFrontmatterField`/
`combineListingText` are re-exported and reused by `lint-content.cjs`.

**`check-skill-routing.js`** — CI gate. Verifies two retired
always-loaded routing files (`claude/rules/skill-domain-routing.md`,
`skill-workflow-routing.md`) are absent (routing was migrated to be
skill-owned), verifies four specific skill-owned routing reference files
exist (`find-skills/references/domain-routing.md`,
`cook/references/workflow-routing.md`, etc.), and verifies every `ck:*`
skill has a frontmatter description ≥20 chars.

**`generate-managed-hooks.cjs`** — Regenerates
`claude/hooks/managed-hooks.json` from `claude/settings.json`'s `hooks`
block, by regex-extracting hook basenames from `.../hooks/<name>.cjs|mjs|js`
command strings. This manifest is the deterministic source of truth the
ClaudeKit CLI's self-heal reads to detect missing hook registrations.
Supports `--check` mode (fails if the generated content differs from what's
on disk — a "is this file stale" CI-style check) vs. default write mode.

**`generate-release-manifest.cjs`** — Walks `claude/` (or configured
`sourceDir`) plus `plans/templates`, skips build/vcs dirs (`node_modules`,
`.venv`, `.git`, `dist`, etc.) and hidden files except an explicit include
list (`.gitignore`, `.mcp.json`, `.ck.json`, `.env.example`, `.gitkeep`,
…), computes a SHA-256 checksum and last-git-commit ISO timestamp per file,
and writes `release-manifest.json` (atomic write via temp file + rename).
Guards against symlink cycles via inode tracking. Invoked as
`node scripts/generate-release-manifest.cjs [version]`.

**`prepare-release-assets.cjs`** — Pre-publish step run by
`.releaserc.cjs`'s `@semantic-release/exec` `prepareCmd`. Regenerates
`claude/metadata.json` (preserving existing custom fields, overwriting
`version`/`name`/`description`/`buildDate`/`repository`/`download`),
shells out to `generate-release-manifest.cjs`, validates the manifest is
valid JSON, stages the runtime `.claude/` dir from the source `claude/` dir
(via `fs.cpSync`, skipped if source===runtime), and zips
`dist/claudekit-engineer.zip` containing `.claude/`, `plans/templates`,
`.gitignore`, `.repomixignore`, `.mcp.json`, `release-manifest.json` via a
shelled-out `zip -r` command.

**`release-bookkeeping.cjs`** (+ `release-bookkeeping-helpers.cjs` for the
pure/testable logic) — Two subcommands:
- `next-beta-version`: reads all `v*` git tags, finds the latest stable
  (`X.Y.Z`) and latest beta on a base ≥ that stable, computes the next
  `X.Y.(Z+1)-beta.N` (or increments N if the beta base didn't advance);
  writes `stable`/`version` to `$GITHUB_OUTPUT`.
- `mark-dev-release`: given `--current-tag`, finds the previous tag, greps
  merge-commit subjects (`Merge pull request #N` / `Merge PR #N`) for PR
  numbers in that range, labels each PR via `gh pr edit --add-label`,
  parses "closes/fixes/resolves #N" issue references out of the PR
  title+body, and labels/closes/comments on each linked issue via `gh
  issue edit|close|comment` (idempotent — checks for an HTML-comment marker
  before re-commenting). All git/gh calls go through `execFileSync` (no
  shell interpolation).

**`send-discord-release.cjs`** — Sends a Discord webhook embed on release.
For **production**: parses the latest `## X.Y.Z (date)` section out of
`CHANGELOG.md` into `### <emoji> <SectionName>` → bullet-list fields, and
gates sending on the current git HEAD actually being tagged `vX.Y.Z`
(`git tag --points-at HEAD`) so a semantic-release no-op run doesn't
repost stale notes. For **beta**: reads `package.json` version, diffs git
log since the previous tag, regex-parses conventional-commit subjects into
the same section map as `.releaserc.cjs`. Posts via raw `https.request`
(no discord.js dependency), 10s timeout, Discord's field/embed limits
respected (1024 chars/field via truncation, 25 fields/embed via slice).

**`win_compat.py`** — Tiny shared helper (`ensure_utf8_stdout()`,
`safe_print()`) imported by skill Python scripts to avoid
`UnicodeEncodeError` on Windows' cp1252 console; wraps `sys.stdout` in a
UTF-8 `TextIOWrapper` once.

**`lib/validate-allowlist-reason.js`** — Shared allowlist-`reason`
validator (min 20 chars post-trim, rejects non-string/empty/placeholder)
used by both `check-skill-descriptions.js` and (per its docstring)
`check-skill-routing.js`'s sibling allowlist mechanism.

**`lint-content.cjs`** — Orchestrator-only file; delegates rule detection
entirely to `check-skill-descriptions.js`'s exported `RULES` +
`extractFrontmatterField` + `combineListingText`. Its own logic is just:
scan all `SKILL.md` files, collect violations, then **partition by whether
the file changed vs. `$LINT_BASE_REF`/`origin/dev`** — violations on
changed files become blocking errors (exit 1), violations on legacy/
unchanged files become non-blocking warnings (exit 0 still). This
diff-based severity model exists explicitly (per its own header comment)
because the repo carries "hundreds of legacy `.md` files with pre-existing
frontmatter issues" and a full-repo-fail policy would be noise. Falls back
to warn-only mode if the base ref is unavailable (e.g., shallow CI
checkout).

**`commands_data.yaml`** — Retired stub file, 4 comment lines only:
"Commands have been migrated to skills... See claude/skills/ for the
current skill catalog. Regenerate skills catalog via:
`python3 claude/scripts/scan_skills.py`".

**`skills_data.yaml`** — Generated catalog dump (336+ lines), one YAML
record per skill with `category`/`description` fields — appears to be the
output of the `scan_skills.py` regeneration script referenced above (not
itself inspected in this pass).

### `scripts/eval/` — 3-tier skill-quality eval harness

Entry point `run.ts` (Bun script, `bun scripts/eval/run.ts [tier] [opts]`)
dispatches to one of three tiers, or `all` sequentially:
- **Tier 1 — `tier-1-static.ts` + `tier-1-validators.ts`** ($0, <5s,
  CI-mandatory per its own docstring, though not observed wired into any
  `.github/workflows/*.yml` in this pass — only reachable via
  `npm run test:eval`). Validates SKILL.md frontmatter (custom regex-based
  YAML frontmatter parser, not a real YAML lib), agent `.md` files, hook
  `.cjs` syntax, `.ck.json`, `portable-manifest.json`, and broken
  references inside skills. `validateSkills()` requires `name`+
  `description` (fail if missing) and warns if `metadata.version`/
  `argument-hint` are absent.
- **Tier 2 — `tier-2-e2e.ts`** (~$3.85/run, on-demand). Spawns an AI CLI
  (`claude` by default, or `$CK_EVAL_CMD` e.g. `"ccs glm"`) per skill with
  a prompt `"Activate /ck:<skill> and describe what you would do. Do not
  execute any tools."`, with a 60s overall timeout and a 30s
  heartbeat-timeout, and records pass/fail/timeout + truncated output
  summary as NDJSON to `scripts/eval/results/e2e-{date}.ndjson`. Supports
  `--diff` (only skills changed in `HEAD~1..HEAD`), `--skill <name>`,
  `--all`.
- **Tier 3 — `tier-3-judge.ts`** (~$0.15/run, on-demand). Sends each
  skill's SKILL.md content (capped at 3000 chars) to the same AI CLI,
  asking for a JSON-only clarity/specificity/completeness/overall 1-10
  score + feedback; flags anything scoring below 6
  (`LOW_SCORE_THRESHOLD`); writes JSON results to
  `results/judge-{date}.json`.
- **`eval-utils.ts`** — shared helpers: `listSubdirs`/`findFiles`/
  `readFileSafe`, `projectRoot()` (resolves 2 levels up from
  `scripts/eval/`), `sourceClaudeDir()` (prefers `claude/`, falls back to
  legacy `.claude/`), `isSkillDir`/`allSkillNames`/`getChangedSkills` (git
  diff against `HEAD~1`), and `resolveEvalCli()` (parses `$CK_EVAL_CMD` as
  `cmd + prefixArgs`, default `"claude"` with no prefix args).

### `scripts/__fixtures__/`
Two minimal SKILL.md fixtures used by the lint-content/description tests:
`bad-skill/SKILL.md` has a `TODO` in its description (triggers
`todo-marker`); `clean-skill/SKILL.md` has a full, rule-satisfying
frontmatter (`user-invocable: true`, `when_to_use`, a long
capability-led description).

---

## 2. Root `package.json`

- `name`: `claudekit-engineer`, `version: 2.20.0`, `license: MIT`,
  `publishConfig.access: public` (despite `@semantic-release/npm` having
  `npmPublish: false` — see §5).
- Custom top-level `"claudekit"` config block: `{ "sourceDir": "claude",
  "runtimeDir": ".claude" }` — read by several scripts
  (`generate-release-manifest.cjs`, `prepare-release-assets.cjs`,
  `eval-utils.ts`'s `sourceClaudeDir`) to resolve where the tracked source
  tree lives vs. the installed runtime tree.
- `"files"` (npm publish allowlist): `.claude/`, `plans/`, `README.md`,
  `CHANGELOG.md`, `LICENSE`, `.claude/metadata.json`.
- `"scripts"` block: see §1 above (verbatim).
- `devDependencies`: `@commitlint/cli` + `@commitlint/config-conventional`
  (commit linting), the full `semantic-release` plugin family
  (`@semantic-release/changelog`, `commit-analyzer`, `exec`, `git`,
  `github`, `npm`, `release-notes-generator`), `husky` (git hooks),
  `conventional-changelog-conventionalcommits` (commit convention preset).
  **No runtime `dependencies` block at all** — everything shipped to end
  users under `.claude/` is either pure Node stdlib (`.cjs`/`.js` scripts)
  or per-skill Python `requirements.txt` files (see §6), not resolved via
  root `node_modules`.
- No test runner devDependency (no jest/vitest/mocha) — uses Node's
  built-in `node --test`, confirming the `"test"` script's literal file
  list is the whole test surface for this layer, not a glob-discovered
  suite.
- `engines.node: >=18.0.0`.

---

## 3. `.github/workflows/*.yml`

| File | Trigger | What it runs |
|---|---|---|
| `branch-protection.yml` | `pull_request` → `main` (opened/sync/reopened/edited) | Single inline bash step: rejects any PR into `main` unless the source branch is exactly `dev` or matches `*hotfix*` — enforces a dev→main-only merge flow (plus named hotfix branches). |
| `quality-gates.yml` | `pull_request` → `dev` or `main` | 6 independent jobs, each its own checkout: `metadata-check` (`check-metadata-deletions.js`), `skill-cross-ref-lint` (`check-skill-cross-refs.js`, base ref = the PR's actual base), `skill-routing-coverage` (`check-skill-routing.js`), `skill-frontmatter-contract` (`python3 claude/scripts/validate-skill-frontmatter.py` — a stricter, blocking Python-side frontmatter schema check not in `scripts/`), `skill-description-lint` (`check-skill-descriptions.js`), `lint` (`npm run lint` = `lint-content.cjs`, diff-based). All jobs do `fetch-depth: 0` and (except routing-coverage/frontmatter) fetch the base branch explicitly before diffing. |
| `release-beta.yml` | `push` → `dev`, or `workflow_dispatch` | Skips if the triggering commit message contains `[skip ci]` (loop-prevention). Installs Node+Python, `npm install`, `npm test`, `npm run lint`, computes next beta version (`release-bookkeeping.cjs next-beta-version`), bumps `package.json` version (`npm version --no-git-tag-version`), runs `prepare-release-assets.cjs`, commits+tags+pushes to `dev`, hand-builds structured release notes from conventional-commit `git log` (own bash parsing, mirroring `.releaserc.cjs`'s section map), creates a GitHub **prerelease** via `gh release create --prerelease --target dev`, runs `release-bookkeeping.cjs mark-dev-release` to label/close linked issues, and sends a Discord notification (`send-discord-release.cjs beta`). Concurrency-grouped per repo, `cancel-in-progress: false`. |
| `release.yml` | `push` → `main`, or `workflow_dispatch` | Installs Node+Python, `npm install`, `npm audit signatures` (supply-chain provenance check), `npm test`, `npm run lint`, then `npm run semantic-release` (delegates the actual release mechanics to `.releaserc.cjs`), then Discord notify (`send-discord-release.cjs production`). Needs `id-token: write` for npm provenance and `NPM_TOKEN` secret even though `npmPublish: false` is set in `.releaserc.cjs` (see §5 note). |
| `sync-dev-after-release.yml` | `push` → `main` | Guarded to only run when the triggering commit message contains `chore(release)` (or manual dispatch). **Force-resets** `dev` to `origin/main` (`git reset --hard origin/main && git push origin dev --force`) — a destructive hard sync. |
| `sync-main-to-dev.yml` | `push` → `main` | Also guarded on `chore(release)` commit message. Does a **non-destructive merge** (`git checkout dev && git merge main -m "..." && git push origin dev`) instead of a reset. |

Mechanical note (not a judgment call, just an observation of the diff):
`sync-dev-after-release.yml` and `sync-main-to-dev.yml` both trigger on the
same event/message-guard combination but perform two different
reconciliation strategies (force-reset vs. merge) against the same target
branch (`dev`).

---

## 4. `.husky/`

Only one hook file present: **`commit-msg`**.
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Skip husky hooks in CI environment
if [ "$CI" = "true" ]; then
  exit 0
fi

export PATH="$HOME/.nvm/versions/node/$(node -v 2>/dev/null || echo 'v22.20.0')/bin:$HOME/.bun/bin:$PATH"

npx --no-install commitlint --edit $1
```
Runs `commitlint` against the commit message being authored, using
`.commitlintrc.json`'s rules (below). Explicitly no-ops when `$CI=true`
(so CI-generated commits like `chore(release): ...` aren't blocked by a
hook that requires `npx`/network in a context where it's already been
validated). Manually widens `$PATH` to find a locally-managed Node
(nvm) or Bun binary — defends against husky running in a minimal git-hook
shell environment that doesn't inherit the interactive shell's PATH.
`package.json`'s `"prepare": "husky install || true"` wires this up on
`npm install` (the `|| true` tolerates environments where husky install
fails, e.g. non-git contexts).

---

## 5. `.releaserc.cjs` and `.commitlintrc.json`

**`.releaserc.cjs`** — semantic-release config, `branches: ['main']` only
(beta releases are explicitly handled outside semantic-release, by
`release-beta.yml` + `release-bookkeeping.cjs`, per its header comment).
Plugin chain:
1. `commit-analyzer` (conventionalcommits preset) — custom `releaseRules`:
   `feat`→minor; `fix`/`hotfix`/`perf`/`docs(README)`/`refactor`/`style`→patch.
   Note `hotfix` is a **non-standard** conventional-commit type added here.
2. `release-notes-generator` — emoji-prefixed section headers per type
   (🚀 Features, 🔥 Hotfixes, 🐞 Bug Fixes, 📚 Documentation, 💄 Styles,
   ♻️ Code Refactoring, ⚡ Performance, ✅ Tests, 🏗️ Build System, 👷 CI).
3. `@semantic-release/changelog` → writes `CHANGELOG.md`.
4. `@semantic-release/npm` with **`npmPublish: false`** — version-bumps
   `package.json`/lockfile but does not actually publish to npm registry.
5. `@semantic-release/exec` — `prepareCmd: node scripts/prepare-release-assets.cjs ${nextRelease.version}`.
6. `@semantic-release/github` — attaches `CHANGELOG.md` and
   `dist/claudekit-engineer.zip` as GitHub release assets.
7. `@semantic-release/git` — commits `CHANGELOG.md`, `package.json`,
   `package-lock.json`, `claude/metadata.json` back with message
   `chore(release): ${version} [skip ci]` (the `[skip ci]` is what the
   loop-prevention guards in the workflows above match against).

**`.commitlintrc.json`** — extends `@commitlint/config-conventional`.
Overrides: `type-enum` restricted to `build, chore, ci, docs, feat, fix,
perf, refactor, revert, style, test` (note: **`hotfix` is NOT in this
list**, even though `.releaserc.cjs`'s `commit-analyzer` has a release
rule for it — a `hotfix:` commit would be rejected by commitlint before it
could ever reach the release analyzer). `subject-case` forbids
sentence-case/start-case/PascalCase/UPPER-CASE (lowercase-first enforced
implicitly). `subject-empty`/`subject-full-stop` standard. `header-max-length: 100`.
`body-max-line-length: 300` (warning severity `1`, not error `2`).

---

## 6. Distribution / install story

### `claude/skills/install.sh` (Linux/macOS, bash 3.2+ compatible)

Rustup-style exit codes: `0` success (full or partial), `1` fatal
(no Python/broken venv), `2` partial (optional deps failed). Flags:
`-y|--yes`, `--with-sudo`, `--resume`, `--retry-failed`; also honors
`$NON_INTERACTIVE` env var to auto-confirm.

Detects OS (`macos`/`linux`/`wsl`/`msys`/`cygwin`/`unknown`) and, for
Linux, distro (`alpine`/`arch`/`debian`/`redhat`/`unknown`) via
marker-file/command checks, then abstracts `pkg_update`/`pkg_install`
over `apk`/`pacman`/`apt-get`/`dnf`/`yum`. Persists a JSON state file
(`.install-state.json`, hand-written via `sed` substitution rather than a
JSON library) tracking 5 phases (`system_deps`, `node_deps`, `python_env`,
`env_migration`, `verify`) so `--resume` can skip already-`done` phases.

Phases, in order:
1. **System deps** — installs `ffmpeg`, `imagemagick`, and a
   distro-specific `librsvg` package name (`librsvg2-bin` on Debian,
   `librsvg2-tools` on RedHat) only if `--with-sudo` was passed (or root
   on Alpine); otherwise tracks as "skipped, requires sudo". Just
   checks-for (doesn't install) `psql`/`docker`.
2. **Node deps** — installs Node.js itself if missing (brew / apk-pacman /
   NodeSource curl-pipe-bash for Debian+RedHat), then a fixed list of
   global npm packages (`rmbg-cli`→`rmbg`, `pnpm`, `wrangler`, `repomix`),
   then walks a fixed list of skill subdirectories
   (`sequential-thinking`, `markdown-novel-viewer`, `show-off/scripts`,
   `plans-kanban`, `stitch/scripts`) and runs `npm install --quiet` in
   each if a `package.json` exists there. Shopify CLI install is
   interactive-confirmed (`y/N` prompt) unless `--yes`.
3. **Python env** — locates `python3`, detects a uv-managed Python
   specifically (path contains `/.local/share/uv/`), creates
   `.venv` with a 3-tier fallback (`python3 -m venv` → `uv venv` +
   manual pip bootstrap via `get-pip.py` → `python3 -m venv --without-pip`
   + manual pip bootstrap), verifies venv integrity
   (`activate` script + working `python3` interpreter) and recreates if
   corrupted. Then, for every immediate subdirectory of
   `claude/skills/` (skipping `.venv` and `document-skills`), installs
   `scripts/requirements.txt` **line-by-line** (not `pip install -r`) via
   `try_pip_install()` — a wheel-first (`--prefer-binary`) → build-tools-
   check (`gcc`/`clang` + Python dev headers or Xcode CLT) → source-build
   fallback chain, logging each skill's output to
   `.venv/logs/install-<skill>.log`. Also installs
   `scripts/tests/requirements.txt` per skill (via plain `pip install -r`,
   non-fatal on failure) and the shared `.claude/scripts/requirements.txt`
   (contains `pyyaml` for `scan_skills.py`).
4. **Env migration** — idempotently appends any var present in
   `.env.example` but missing from an existing `.env` (checked at both
   `claude/.env` and `claude/skills/.env`), preserving the comment block
   immediately above each var in the `.example` file as context, without
   touching existing values. Skipped entirely if no `.env` exists yet
   (points the user at `.env.example`).
5. **Verify** — re-checks ffmpeg/imagemagick/node/npm/each npm CLI
   package/`google.genai` importability, purely informational.

Ends with a categorized report (Installed/Skipped/Degraded), distro-
specific remediation command suggestions, an `exit $FINAL_EXIT_CODE`, and
(only on failure) writes `.install-error-summary.json` with structured
`critical_failures`/`optional_failures`/`skipped`/`remediation` fields —
apparently meant to be machine-parsed by "the CLI" (a wrapper this repo
doesn't itself contain, referenced only as consumer). State file is
deleted on full success.

### `claude/skills/install.ps1` (Windows PowerShell 5.1+)

Structurally a 1:1 port of `install.sh`'s phase model (state JSON via
`ConvertTo-Json`/`ConvertFrom-Json` rather than `sed`, same 5 phases plus
a `chocolatey` phase at the front). Distinct Windows-specific mechanisms:
- Package manager priority `winget` > `scoop` > `choco` (`choco` only used
  if `-WithAdmin` and actually elevated — checked via
  `WindowsPrincipal`/`WindowsBuiltInRole::Administrator`).
- `Find-Python` specifically detects and warns about the **Windows Store
  Python alias** (path contains `WindowsApps`) redirecting to the Store
  instead of running Python, with remediation instructions (App execution
  aliases toggle).
- `Test-VSBuildTools` uses `vswhere.exe` (falling back to hardcoded VS
  2019/2022 install paths) to detect real C++ build tools before
  attempting a source build for a failed wheel install.
- `Get-UserInput` explicitly handles **redirected stdin** (e.g. being
  driven by an agent/automation harness rather than a real terminal) by
  peeking the stream and falling back to a default rather than blocking.
- `rsvg-convert` install (`Install-RsvgConvert`) is special-cased: neither
  winget nor scoop ship it, so it's choco-only (admin-gated) with a
  documented MSYS2 fallback.
- Flags: `-Y`, `-WithAdmin`, `-Resume`, `-RetryFailed`, `-SkipChocolatey`,
  `-PreferPackageManager <auto|winget|scoop|choco>`, `-Help`. Also honors
  `$env:NON_INTERACTIVE -eq "1"`.

### `claude/skills/INSTALLATION.md`

Human-facing doc. Structure: Overview → Automated Installation (points at
`install.sh`/`install.ps1`, lists exactly what each installs) → Manual
Installation (Quick Start "install everything" vs. "install per-skill") →
Skills Dependencies (documents that **only `ai-multimodal`** among all
skills needs external Python packages — `google-genai`, `pypdf`,
`python-docx`, `docx2pdf` Windows-only, `markdown`, `Pillow`,
`python-dotenv` — everything else is stdlib-only or Node/CLI-based) →
System Tool Dependencies per skill area (media-processing, devops,
better-auth/repomix/shopify, databases, web-frameworks/ui-styling) →
per-platform copy-paste install blocks (Linux/macOS/Windows) → Testing
Dependencies (`pytest`/`pytest-cov`/`pytest-mock`, run via
`python -m pytest tests/ -v --cov=. --cov-report=term-missing`) →
documented **env var loading priority**: `process.env` (highest) →
`claude/skills/<skill>/.env` → `claude/skills/.env` → `claude/.env`
(lowest) → Troubleshooting (`externally-managed-environment` pip error,
missing system tools, permission errors) → Minimal Installation
(ai-multimodal-only or media-processing-only snippets) → Development
Setup (contributor pre-commit hooks, full test-suite invocation) →
Skill-Specific Notes (ai-multimodal needs `GEMINI_API_KEY`; media-
processing needs ffmpeg/ImageMagick/rmbg all in PATH; devops needs
`CLOUDFLARE_API_TOKEN`+`CLOUDFLARE_ACCOUNT_ID` or
`GOOGLE_APPLICATION_CREDENTIALS`; shopify needs `shopify auth login` +
partner account).

### `portable-manifest.json`

Not an install script — a **cross-agent-CLI migration manifest** consumed
by "the CLI" (`cliVersion: "3.43.0"` referenced inside), tracking two
kinds of changes across CLI versions: `renames` (currently empty) and
`providerPathMigrations` — a list of `{provider, type, from, to, since}`
entries recording where each supported coding-agent CLI (codex,
gemini-cli, windsurf, cursor) has moved its agent/skill file locations
over time, e.g. gemini-cli's skills moved `.gemini/skills` →
`.agents/skills` since 3.37.0, then windsurf/cursor later moved their
skills **out of** the shared `.agents/skills` convention back into their
own provider-specific dirs (`.windsurf/skills`, `.cursor/skills`) since
3.43.0. `sectionRenames` also present but empty.

### `.env.example`

Only 2 documented integrations, both **notification webhooks** (not
app runtime config): `DISCORD_WEBHOOK_URL` (with instructions: Discord
Server Settings → Integrations → Webhooks → New Webhook) and
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (via @BotFather / getUpdates
API). Header comment: "Claude Code Notification Hooks - Environment
Variables... NEVER commit .env files to version control." This is a
different, narrower `.env.example` than the per-skill ones referenced in
INSTALLATION.md (e.g. `devops/.env.example` for Cloudflare/GCloud) — this
root one is specifically for the notification-hooks layer that
`send-discord-release.cjs` and (by naming convention) a Telegram
equivalent consume.

---

## Unresolved / not verified in this pass

- `python3 claude/scripts/validate-skill-frontmatter.py` (referenced by
  `quality-gates.yml`'s `skill-frontmatter-contract` job) and
  `claude/scripts/scan_skills.py` (referenced by `commands_data.yaml`'s
  regeneration note and INSTALLATION.md's dev workflow) live outside
  `scripts/` under `claude/scripts/` — not read in this pass since the
  brief scoped this inventory to the root `scripts/` tree plus the named
  root config files.
- Did not open `claude/hooks/__tests__/*.test.cjs`,
  `claude/skills/show-off/scripts/preferences.test.js`,
  `claude/skills/watzup/scripts/watzup-scan.test.cjs`, or
  `claude/skills/chrome-profile/scripts/test_chrome_profile.py` — these
  are only visible here as entries in the root `npm test` command line.
- Did not open the individual `*.test.cjs` files paired with each script
  in `scripts/` (only their non-test counterparts were read).
