# Superpowers multi-platform packaging inventory

Mechanical inventory of `/home/vantt/projects/forgentX/upstreams/superpowers/` platform-adapter
files. All target files were readable; none were missing or unreadable. Full directory listing
of the requested paths:

```
.claude-plugin/marketplace.json
.claude-plugin/plugin.json
.codex-plugin/plugin.json
.cursor-plugin/plugin.json
.kimi-plugin/plugin.json
.opencode/INSTALL.md
.opencode/plugins/superpowers.js
.pi/extensions/superpowers.ts
.agents/plugins/marketplace.json
gemini-extension.json
package.json
.version-bump.json
.gitattributes
.pre-commit-config.yaml
```

`.agents/` has no other files besides `plugins/marketplace.json`. `.opencode/` has no other
files besides `INSTALL.md` and `plugins/superpowers.js`. `.pi/` has no other files besides
`extensions/superpowers.ts`.

---

### claude-plugin-manifest-pair
- **What:** `.claude-plugin/plugin.json` is the canonical Claude Code plugin manifest (name,
  description, version `6.2.0`, author, homepage/repository, license, keywords, `"skills":
  "./skills/"`, empty `"hooks": {}`). `.claude-plugin/marketplace.json` is a separate dev
  marketplace manifest (`"name": "superpowers-dev"`) listing this same plugin with
  `"source": "./"` (a bare string pointing at the repo root) and its own owner block.
- **Where:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- **Notable:** This is the reference/native format the other five adapters are all translating
  into. `marketplace.json`'s `source` field is a plain string (`"./"`) — contrast with
  `.agents/plugins/marketplace.json` below, whose `source` is a nested object.
- **Keywords:** plugin.json, marketplace.json, skills path, hooks stub, source string

### codex-plugin-manifest-branding
- **What:** `.codex-plugin/plugin.json` is the OpenAI Codex plugin manifest. Beyond the
  shared name/version/description/keywords, it adds a large `"interface"` object:
  `displayName`, `shortDescription`, `longDescription`, `developerName`, `category`,
  `capabilities: ["Interactive","Read","Write"]`, `defaultPrompt` (two example prompts),
  `websiteURL`, `privacyPolicyURL`, `termsOfServiceURL`, `brandColor: "#F59E0B"`,
  `composerIcon: "./assets/superpowers-small.svg"`, `logo: "./assets/app-icon.png"`,
  `screenshots: []`.
- **Where:** `.codex-plugin/plugin.json`
- **Notable:** This is the only manifest with app-store-style branding metadata (icons, brand
  color, privacy/TOS URLs, default prompts) — implying Codex's plugin surface is presented as a
  discoverable app listing, unlike Claude's bare plugin.json.
- **Keywords:** interface, composerIcon, brandColor, defaultPrompt, capabilities

### cursor-plugin-manifest-external-hooks
- **What:** `.cursor-plugin/plugin.json` mirrors the Claude manifest's core fields but points
  hooks at an external file: `"hooks": "./hooks/hooks-cursor.json"` (a string path, not an
  inline object like Claude's `{}`).
- **Where:** `.cursor-plugin/plugin.json`
- **Notable:** Cursor's manifest format takes `hooks` as a **path reference** rather than an
  inline config, meaning hook wiring lives in the shared `hooks/` directory and is referenced,
  not duplicated, per platform.
- **Keywords:** hooks path reference, hooks-cursor.json

### kimi-plugin-manifest-embedded-instructions
- **What:** `.kimi-plugin/plugin.json` adds two Kimi-specific fields not present in any other
  manifest: `"sessionStart": {"skill": "using-superpowers"}` (a declarative session-start hook
  naming the bootstrap skill) and a large freeform `"skillInstructions"` string embedded
  directly as JSON — a multi-paragraph tool-mapping cheat sheet telling the agent to translate
  Superpowers vocabulary onto Kimi's own tool names, e.g.: *"When a Superpowers skill says to
  ask the user... call Kimi Code's `AskUserQuestion` tool,"* *"For implementation, code review,
  spec review... call `Agent` with `subagent_type: \"coder\"`,"* and *"Do not pass
  `general-purpose` as `subagent_type`."*
- **Where:** `.kimi-plugin/plugin.json`
- **Notable:** Unlike OpenCode/Pi (which inject their tool-mapping prose at runtime from code),
  Kimi's tool-mapping text is baked directly into the static manifest JSON as a string field —
  no separate injection script exists for this platform in the inventoried paths.
- **Keywords:** sessionStart, skillInstructions, tool-mapping cheat sheet, AskUserQuestion, TodoList

### opencode-plugin-runtime-injection
- **What:** `.opencode/plugins/superpowers.js` is a real JS plugin module (ESM, uses
  `import.meta.url`) exporting `SuperpowersPlugin`. It (1) hooks OpenCode's `config` lifecycle
  to push the repo's `skills/` directory into `config.skills.paths` at runtime — "no symlinks
  needed" per its own comment — and (2) hooks
  `'experimental.chat.messages.transform'` to unshift a synthetic bootstrap text block into the
  first user message of each session. The bootstrap content is the `using-superpowers`
  `SKILL.md` body (frontmatter stripped) wrapped in an `<EXTREMELY_IMPORTANT>` marker plus an
  inline OpenCode tool-mapping cheat sheet (`todowrite`, `task` with `subagent_type: "general"`,
  native `skill` tool, `read`, `apply_patch`, `bash`, `grep`/`glob`, `webfetch`). Content is
  memoized in a module-level `_bootstrapCache` to avoid repeated disk I/O, citing issue `#1202`.
  The comments explicitly explain why a **user** message is used instead of a system message:
  "Token bloat from system messages repeated every turn (#750)" and "Multiple system messages
  breaking Qwen and other models (#894)."
- **Where:** `.opencode/plugins/superpowers.js`, `.opencode/INSTALL.md`
- **Notable:** `.opencode/INSTALL.md` documents install via `opencode.json`'s `"plugin"` array
  using a git-dependency spec: `"superpowers@git+https://github.com/obra/superpowers.git"`
  (with a pinned-tag variant `#v5.0.3`), and explicitly instructs migrating away from an older
  symlink-based install (`rm -f ~/.config/opencode/plugins/superpowers.js`, `rm -rf
  ~/.config/opencode/skills/superpowers`). It also documents a Windows-specific fallback where
  Bun's OpenCode installer can't resolve `git+https` specs, requiring manual `npm install
  ...--prefix` plus a literal `node_modules` path in `opencode.json`.
- **Keywords:** config hook, messages.transform, EXTREMELY_IMPORTANT, bootstrap cache, symlink migration, git+https plugin spec

### pi-extension-runtime-injection
- **What:** `.pi/extensions/superpowers.ts` is a TypeScript extension for the Pi coding agent
  (`@earendil-works/pi-coding-agent` `ExtensionAPI`). It registers handlers for
  `resources_discover` (returns `{ skillPaths: [skillsDir] }`), `session_start` /
  `session_compact` (arm a `injectBootstrap` flag), `agent_end` (disarm it), and `context`
  (actually inserts the bootstrap message, guarded by a `messageContainsBootstrap` scan and
  inserted after any leading `compactionSummary` messages via
  `firstNonCompactionSummaryIndex`). The bootstrap text uses the same
  `<EXTREMELY_IMPORTANT>` convention as OpenCode's, with a distinct marker string
  `"superpowers:using-superpowers bootstrap for pi"`, and its own Pi-specific tool-mapping
  section (`read`/`write`/`edit`/`bash`, optional `grep`/`find`/`ls`, no native `Skill` tool —
  "load the relevant `SKILL.md` with `read`... or let a human invoke `/skill:name`", no
  standard subagent tool unless `pi-subagents` is installed, no standard todo tool — falls back
  to plan files or a repo-local `TODO.md`).
- **Where:** `.pi/extensions/superpowers.ts`
- **Notable:** Functionally the same "session-start bootstrap injection + tool vocabulary
  translation" pattern as OpenCode's adapter, independently reimplemented in TypeScript against
  a different event model (explicit `session_start`/`agent_end` arm/disarm state machine
  instead of OpenCode's per-message idempotency check alone).
- **Keywords:** ExtensionAPI, resources_discover, session_compact, agent_end, compactionSummary, bootstrap marker

### agents-plugins-marketplace-variant-shape
- **What:** `.agents/plugins/marketplace.json` is a third marketplace manifest variant:
  `{"name": "superpowers-dev", "interface": {"displayName": "Superpowers Dev"}, "plugins": [{
  "name": "superpowers", "source": {"source": "url", "url": "./"}, "policy": {"installation":
  "AVAILABLE", "authentication": "ON_INSTALL"}, "category": "Developer Tools" }]}`.
- **Where:** `.agents/plugins/marketplace.json`
- **Notable:** The `source` field here is a **nested object** (`{"source": "url", "url":
  "./"}`) rather than the bare string `"./"` used in `.claude-plugin/marketplace.json` —
  a genuine schema divergence between two superficially similar marketplace formats for what
  both call a "plugins" array. This manifest also introduces `policy.installation` /
  `policy.authentication` enum fields absent from the Claude marketplace format.
- **Keywords:** nested source object, policy.installation, policy.authentication, AVAILABLE, ON_INSTALL

### gemini-cli-extension-context-file
- **What:** `gemini-extension.json` at repo root is the Gemini CLI extension manifest:
  `{"name": "superpowers", "description": ..., "version": "6.2.0", "contextFileName":
  "GEMINI.md"}`. `GEMINI.md` itself is a 2-line stub:
  ```
  @./skills/using-superpowers/SKILL.md
  @./skills/using-superpowers/references/gemini-tools.md
  ```
- **Where:** `gemini-extension.json`, `GEMINI.md`
- **Notable:** Gemini's extension manifest names a `contextFileName` that the harness loads as
  the extension's always-on context; the file itself uses the bare `@path` include syntax to
  splice in the bootstrap skill plus a Gemini-specific tools reference doc — the same
  `@`-include convention used by this project's own `CLAUDE.md` (`@AGENTS.md`) and
  `.claude/CLAUDE.md` (`@RTK.md`), reused here for a different harness's context-loading
  mechanism.
- **Keywords:** contextFileName, @-include, gemini-tools.md, GEMINI.md stub

### root-package-json-dual-purpose
- **What:** Root `package.json` (`"name": "superpowers"`, `"version": "6.2.0"`, `"type":
  "module"`) sets `"main": ".opencode/plugins/superpowers.js"` — the entry point OpenCode's
  npm/git-dependency plugin resolution loads — and a custom top-level `"pi"` field:
  `{"extensions": ["./.pi/extensions/superpowers.ts"], "skills": ["./skills"]}`, which the Pi
  harness reads directly out of `package.json` rather than a separate manifest file. Keywords
  array includes the literal tag `"pi-package"`.
- **Where:** `package.json`
- **Notable:** Unlike Claude/Codex/Cursor/Kimi/Gemini (each with its own dedicated manifest
  file/directory), OpenCode and Pi both piggyback on the single root `package.json` — OpenCode
  via the standard npm `"main"` field, Pi via a bespoke namespaced `"pi"` object. There is no
  `"scripts"` field in `package.json`; none of the sync/packaging tooling is wired through npm
  scripts.
- **Keywords:** main field, pi namespace, pi-package keyword, no npm scripts

### version-bump-drift-detection-script
- **What:** `.version-bump.json` declares the list of files+JSON field paths that must carry
  the same version string: `package.json#version`, `.claude-plugin/plugin.json#version`,
  `.cursor-plugin/plugin.json#version`, `.codex-plugin/plugin.json#version`,
  `.kimi-plugin/plugin.json#version`, `.claude-plugin/marketplace.json#plugins.0.version`,
  `gemini-extension.json#version`, plus an `audit.exclude` list (`CHANGELOG.md`,
  `RELEASE-NOTES.md`, `node_modules`, `.git`, `.version-bump.json`,
  `scripts/bump-version.sh`). `scripts/bump-version.sh` reads this config and supports three
  modes: `--check` (print each declared file's version, flag drift if not all identical),
  `--audit` (`--check` plus a repo-wide `grep -F` for the current version string, flagging any
  file containing it that isn't in the declared list), and `<new-version>` (bump: write the new
  version into every declared file via `jq`, then automatically re-run `--audit`).
- **Where:** `.version-bump.json`, `scripts/bump-version.sh`
- **Notable:** This is version-string synchronization only — it does **not** generate or copy
  the platform-adapter files themselves. It notably omits `.agents/plugins/marketplace.json`
  and `.opencode`/`.pi` manifests from its declared file list (those carry the version only
  inside `package.json`, or in `.agents`'s case not at all — `.agents/plugins/marketplace.json`
  has no version field).
- **Keywords:** drift detection, jq dotted-path read/write, --check/--audit/bump, undeclared version grep

### codex-fork-outward-sync-script
- **What:** `scripts/sync-to-codex-plugin.sh` is a one-way **outward** sync: it clones (or
  reuses via `--local`) a *separate* downstream repo, `prime-radiant-inc/openai-codex-plugins`
  (constant `FORK="prime-radiant-inc/openai-codex-plugins"`), and rsyncs this repo's tracked
  files into that fork's `plugins/superpowers/` directory (`DEST_REL="plugins/superpowers"`),
  then commits, pushes a timestamped branch (`sync/superpowers-<sha>-<timestamp>` or
  `bootstrap/superpowers-...` with `--bootstrap`), and opens a PR via `gh pr create`. It reads
  the version to sync from the *committed* `.codex-plugin/plugin.json`, not from a live
  argument. An explicit `EXCLUDES` array anchors patterns to the source root (comment:
  "Unanchored patterns like `scripts/` would match... `skills/brainstorming/scripts/`") and
  excludes `.claude/`, `.claude-plugin/`, `.codex/`, `.cursor-plugin/`, `.kimi-plugin/`,
  `.opencode/`, `.pi/`, root ceremony files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
  `gemini-extension.json`, `package.json`, `RELEASE-NOTES.md`), and `commands/`, `docs/`,
  `evals/`, `lib/`, `scripts/`, `tests/`, `tmp/`. A `copy_preserved_destination_metadata`
  step re-copies any existing `skills/*/agents/openai.yaml` files from the destination back
  into the sync source before rsyncing, so OpenAI-owned per-skill metadata already living in
  the fork survives each sync. The script is explicitly designed to be idempotent/deterministic
  ("running twice against the same upstream SHA produces PRs with identical diffs... use that
  to verify the tool itself").
- **Where:** `scripts/sync-to-codex-plugin.sh`
- **Notable:** This is the closest thing to a "generator" in the repo, but it does not generate
  the in-repo `.codex-plugin/` folder — `.codex-plugin/plugin.json` is hand-authored and
  committed; this script instead pushes the *already-committed* plugin content (including
  `.codex-plugin/`, `assets/`, `hooks/`) out to a third-party fork's plugin registry directory.
- **Keywords:** rsync --delete --delete-excluded, anchored excludes, openai.yaml metadata preservation, deterministic diff, gh pr create, bootstrap mode

### codex-portal-archive-packaging-script
- **What:** `scripts/package-codex-plugin.sh` packages a standalone, **rootless** archive
  (zip or tar.gz) for direct upload to the Codex portal, as an alternative path to the fork-sync
  script above. Its own header comment says: "The Codex portal artifact differs from the old
  openai/plugins sync flow: it is a standalone archive." It uses `git archive` (pinned via
  `git -c tar.umask=0022`) to extract exactly `.codex-plugin`, `CODE_OF_CONDUCT.md`, `LICENSE`,
  `README.md`, `assets`, `skills` at a given ref into a staging dir, seeds
  `skills/*/agents/openai.yaml` per skill from a `--metadata-source` (a prior official
  package directory/zip/tar.gz — same OpenAI-owned metadata file pattern as the sync script),
  and hard-fails if any skill is missing its metadata file or if the skill/metadata counts
  don't match. Archive contents are built deterministically (`LC_ALL=C sort`, pinned mtimes —
  `touch -t 198001010000` for zip due to the DOS-epoch floor, `197001010000` for tar.gz — pinned
  uid/gid/uname/gname for tar). After building, it greps the produced archive's file list
  against a denylist regex (`^scripts/|^tests/|^docs/|^\.claude|...`) and dies if any
  "source-only" path leaked into the archive, then prints a SHA-256 checksum.
- **Where:** `scripts/package-codex-plugin.sh`
- **Notable:** A second, independent packaging path for the same platform (Codex) as the sync
  script, but producing a self-contained artifact instead of a PR against a fork — the two
  scripts' inline comments describe this as supplanting an "old openai/plugins sync flow."
  Both scripts independently reimplement the same idea (seed OpenAI-owned per-skill
  `agents/openai.yaml` metadata that this repo does not itself own/generate).
- **Keywords:** git archive, rootless archive, openai.yaml seeding, deterministic zip/tar.gz, SHA-256, source-only path denylist

### misc-repo-hygiene-files
- **What:** `.gitattributes` forces LF line endings for `*.sh`, `hooks/session-start`, `*.cmd`
  ("Ensure the polyglot wrapper keeps LF (it's parsed by both cmd and bash)"), `*.md`, `*.json`,
  `*.js`, `*.mjs`, `*.ts`, and marks `*.png`/`*.jpg`/`*.gif` as binary.
  `.pre-commit-config.yaml` defines three local pre-commit hooks (`evals-ruff-check`,
  `evals-ruff-format-check`, `evals-ty-check`), all scoped to `^evals/.*\.py$` and run via
  `uv --project evals run ruff ...` / `uv --directory evals run ty check` — this is Python
  linting/type-checking for the `evals/` harness only, unrelated to the multi-platform skill
  packaging; noted here per instructions without further detail (hook mechanics belong to a
  separate hooks inventory — see sibling report
  `distill-superpowers-hooks-inventory-260728-1653-report.md` in this same reports directory).
- **Where:** `.gitattributes`, `.pre-commit-config.yaml`
- **Notable:** Not a platform-packaging mechanism; included for completeness of the requested
  file list.
- **Keywords:** eol=lf, polyglot wrapper, uv --project evals, ruff, ty check

---

## Adjacent files noticed but not in the requested list (mentioned for traceability only)

- `scripts/lint-shell.sh` exists alongside the three scripts above (shell-script linting; not
  read in detail — out of scope, no packaging content expected).
- `hooks/hooks-cursor.json` is referenced by `.cursor-plugin/plugin.json`'s `"hooks"` field but
  is outside the requested path list; not read here.
- `CLAUDE.md` (repo root) contains the project's contribution rules, including a strict
  requirement that any PR adding a "New Harness Support" must prove the harness auto-triggers
  the `brainstorming` skill on session start via a full transcript — directly explaining *why*
  every adapter above independently reimplements a "bootstrap injection at session start"
  mechanism rather than relying on lazy/on-demand skill loading.

Status: DONE
