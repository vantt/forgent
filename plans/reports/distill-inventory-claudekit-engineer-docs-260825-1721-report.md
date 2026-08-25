# Inventory: claudekit-engineer guide/reference documentation surface

Source repo: `/home/vantt/projects/forgentX/upstreams/claudekit-engineer/`
Scope: `guide/SKILLS.md`, `guide/SKILLS.yaml`, `guide/ENVIRONMENT_RESOLVER.md`, `docs/referecences/`, `docs/research/`. `docs/assets/`, `docs/infographics/`, `docs/journals/` noted only (sizes below), not read.

---

### `guide/SKILLS.md`
- What: Auto-generated human-readable catalog of every skill shipped in the repo's `.claude/skills/` tree. Single markdown file, no subfiles.
- Where: `guide/SKILLS.md` (577 lines, 25.4K)
- Mechanism notes / key structure:
  - Header block declares `Last Updated: 2026-06-17` and `Total Skills: 88`.
  - A "Categories" section with anchor links to 11 category headings: AI & Machine Learning, Frontend & Design, Backend Development, Infrastructure & DevOps, Database & Storage, Development Tools, Multimedia & Processing, Frameworks & Platforms, Security & Intelligence, Utilities & Helpers, Other.
  - A "Legend" section defines two emoji markers: 📦 = "Has executable scripts", 📚 = "Has reference documentation". These emoji prefix each skill's `###` heading when applicable (e.g. `### 📦 📚 \`ai-artist\``).
  - Per-category `##` heading, then one `### <emoji-flags> \`skill-name\`` subsection per skill containing: the skill's description paragraph (verbatim from its SKILL.md frontmatter `description`), then a `**Location**: \`.claude/skills/<path>/SKILL.md\`` line pointing at the real file.
  - Category sizes observed: dev-tools is the largest bucket (~24 skills: agent-browser, agentize, chrome-profile, docs-seeker, excalidraw, find-skills, git, gkg, graphify, llms, mcp-builder, mintlify, plans-kanban, repomix, scout, ship, skill-creator, team, tech-graph, use-mcp, vibe, web-testing, worktree, xia), followed by utilities (~26 skills incl. ask, autoresearch, bootstrap, brainstorm, code-review, cook, debug, docs, fix, ghpm, journal, loop, plan, predict, preview, project-management, research, retro, review-pr, scenario, security, security-scan, sequential-thinking, test, watzup).
  - Some catalog entries use a `ckm:` display prefix distinct from their directory (e.g. `ckm:design` maps to `.claude/skills/design/SKILL.md`), and some display names differ from directory names (`graphify` → dir `ck-graphify`, `code-review` → dir `ck-code-review`, `debug` → dir `ck-debug`, `loop` → dir `ck-loop`, `plan` → dir `ck-plan`, `predict` → dir `ck-predict`, `scenario` → dir `ck-scenario`, `security` → dir `ck-security`, `autoresearch` → dir `ck-autoresearch`).
- Keywords: skills catalog, auto-generated, progressive disclosure listing, 📦/📚 legend, category taxonomy, `.claude/skills/*/SKILL.md`.

### `guide/SKILLS.yaml`
- What: Machine-readable manifest paired 1:1 with `SKILLS.md` — same 88 skills, same 11 categories, same descriptions, but structured YAML meant for programmatic consumption (e.g. by a skill router or install tool) rather than human reading.
- Where: `guide/SKILLS.yaml` (729 lines, 42.1K)
- Mechanism notes / key structure — top-level keys:
  - `metadata:` — `title`, `description`, `last_updated: '2026-06-17'`, `total_skills: 88` (matches SKILLS.md).
  - `categories:` — a flat map of category-id → display-name (e.g. `ai-ml: "AI & Machine Learning"`, `dev-tools: "Development Tools"`) — the machine-readable counterpart to SKILLS.md's category anchors.
  - `legend:` — `has_scripts: "Has executable scripts"`, `has_references: "Has reference documentation"` — machine counterpart to the 📦/📚 emoji legend.
  - `skills:` — a map keyed by category id, each value a YAML list of skill-entry objects.
  - One skill-entry schema (fields seen, not all present on every entry):
    ```yaml
    - name: "ai-artist"
      path: "ai-artist/SKILL.md"          # relative to .claude/skills/
      description: "..."                   # same text as SKILL.md
      category: "ai-ml"                    # redundant with the map key, self-describing
      has_scripts: true                    # bool, drives 📦
      has_references: true                 # bool, drives 📚
      argument_hint: "[concept] [--mode search|creative|wild|all] ..."  # optional; CLI-style usage hint
      keywords: ["image", "generation", "prompts", "styles"]            # optional; free-text search tags
      maturity: "beta"                     # optional; seen only on ck-graphify
      related: ["ck:repomix", "ck:scout", "ck:gkg"]  # optional; cross-refs to other skills
    ```
  - Fields not present on every entry: `argument_hint` (most have it; a few omit, e.g. `frontend-design`, `journal`, `research`), `keywords` (present on all sampled entries), `maturity` and `related` (rare — only `graphify` carries both in the sample).
- Keywords: YAML manifest, machine-readable catalog, `has_scripts`/`has_references` booleans, `argument_hint`, `keywords[]`, `related[]`, `maturity`.

### `guide/ENVIRONMENT_RESOLVER.md`
- What: Documentation for a centralized environment-variable resolution script (`~/.claude/scripts/resolve_env.py`) that all skills are meant to use instead of each skill hand-rolling its own `.env`-lookup logic.
- Where: `guide/ENVIRONMENT_RESOLVER.md` (256 lines, 7.4K)
- Mechanism / problem solved: Skills need config (API keys etc.) that can come from multiple scopes (per-project vs per-user, per-skill vs shared). Without a shared resolver, each skill implements divergent lookup logic. This doc defines one resolution order and a CLI+Python API to look it up consistently, plus debugging tools to see which scope "won."
- Key structure:
  - **Priority Hierarchy** (highest → lowest, 7 levels): `process.env` (runtime) → `PROJECT/.claude/skills/<skill>/.env` → `PROJECT/.claude/skills/.env` → `PROJECT/.claude/.env` → `~/.claude/skills/<skill>/.env` → `~/.claude/skills/.env` → `~/.claude/.env`.
  - **Benefits** section: consistency (single resolution logic), flexibility (project-local vs user-global), debuggability (built-in `--show-hierarchy`, `--find-all`, `--verbose` CLI flags), maintainability (single source of truth).
  - **CLI usage** examples: `python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal`, `--default fallback-value`, `--export` (for `eval $(...)` shell sourcing), `--show-hierarchy`.
  - **Python API**: `from resolve_env import resolve_env; resolve_env('GEMINI_API_KEY', skill='ai-multimodal')`, importable after `sys.path.insert(0, str(Path.home() / '.claude' / 'scripts'))`.
  - **Integration pattern for skills**: try/except import of the centralized resolver with a fallback to legacy per-skill resolution logic if unavailable — shown as a copy-paste snippet skills adopt.
  - **4 worked scenarios**: global default only; project override beats user default; skill-specific override beats general default; runtime env var beats everything (testing).
  - **Debugging output examples**: sample `--show-hierarchy` output showing ✓/✗ per file path per priority level; sample `--find-all` output listing every location a var is defined plus which one resolves; sample `--verbose` step-by-step trace.
  - **Migration guide**: for existing skills (keep old function as fallback, wrap new import in try/except) and for new skills (just call `resolve_env` directly).
  - **Files created/updated** section lists concrete artifacts: `~/.claude/scripts/resolve_env.py`, `~/.claude/scripts/README.md`, `.claude/ENVIRONMENT_RESOLVER.md` (this file, apparently mirrored at project root under `.claude/` too), plus updated `.env.example` files and one integrated skill script (`ai-multimodal/scripts/gemini_batch_process.py`).
- Keywords: environment variable resolution, `.env` hierarchy, `resolve_env.py`, project vs user scope, skill-specific override, CLI debugging flags.

### `docs/referecences/` (repo's own typo — kept verbatim; only one file present)
- **`docs/referecences/claude-cli-usage-limits-api.md`**
  - What: A "reusable implementation guide" (not repo-specific reference docs — reads as a portable technical recipe) for integrating with Anthropic's OAuth-based Usage API to show Claude Code plan usage/quota inside a third-party app or dashboard.
  - Where: `docs/referecences/claude-cli-usage-limits-api.md` (527 lines, 13.0K)
  - Mechanism notes / key structure (10 numbered sections):
    1. **Anthropic Usage API** — `GET https://api.anthropic.com/api/oauth/usage`, requires OAuth Bearer token + `anthropic-beta: oauth-2025-04-20` header. Documents a live-verified quirk: as of 2026-03-31 the API returns whole-number percentages (`37`, not `0.37`) — the doc explicitly flags this as the "current source-of-truth behavior" and recommends consumers handle both encodings defensively. Response shape: `five_hour`, `seven_day`, `seven_day_opus`, `seven_day_sonnet`, each `{utilization, resets_at}`.
    2. **Cross-platform credential retrieval** — table of storage locations: macOS Keychain (service `Claude Code-credentials`), Windows `%USERPROFILE%\.claude\.credentials.json`, Linux `~/.claude/.credentials.json`. TypeScript code samples for `getClaudeCredentials()`, macOS-Keychain-with-file-fallback, file-based retrieval, and a `isCredentialsExpired()` helper with a 5-minute buffer.
    3. **Usage Limits Service** — full TS implementation of `getUsageLimits()`: resolves token (credentials file/keychain first, then `CLAUDE_CODE_OAUTH_TOKEN` env var fallback), fetches the endpoint, maps snake_case → camelCase.
    4. **API route with caching** — Express route example with a 60-second in-memory TTL cache and structured error responses including a user-facing `hint`.
    5. **Frontend integration** — React hook (`useUsageLimits`) with auto-refresh every 5 minutes while a panel is open, plus a plain API client function.
    6. **UI display component** — React `UsageBar` component with green/yellow/red color coding at 80%/95% thresholds and a reset-countdown formatter.
    7. **Environment variables** table — `CLAUDE_CODE_OAUTH_TOKEN` (optional override), `ANTHROPIC_API_KEY` (for subprocess spawning); documents token priority (system credentials first, then env var).
    8. **Error handling** table — 401/403/no-token/keychain-denied causes and fixes, plus a standard success/error JSON response shape.
    9. **Security considerations** — never log tokens, strip sensitive env vars when spawning subprocesses, 60s cache TTL rationale, 5-min expiry buffer rationale.
    10. **Testing** — mock usage response fixture and a Jest/Supertest-style cache-hit integration test.
- Keywords: Anthropic OAuth Usage API, `/api/oauth/usage`, credential retrieval (Keychain/file), `CLAUDE_CODE_OAUTH_TOKEN`, usage quota dashboard, five_hour/seven_day utilization.

### `docs/research/` — 4 files, all research/technical-guide reports
- **`architectural-defense-prompt-injection.md`** (26.9K)
  - Topic researched: Why prompt-engineering-level defenses ("ignore instructions in fetched content") against prompt injection in Claude Skills are fundamentally insufficient, and what architectural patterns actually mitigate the risk.
  - Conclusion / key claims: Cites an Oct-2025 paper (14 researchers incl. OpenAI/Anthropic/DeepMind members) showing all 12 common defense mechanisms were bypassed >90% of the time under adaptive attacks — framed as proof prompt injection is an *architectural* vulnerability, not a prompting bug.
  - Content (mostly Vietnamese prose with English code/diagrams): documents **6 design patterns** from Beurer-Kellner et al. 2025 ("Design Patterns for Securing LLM Agents against Prompt Injections" — IBM/Invariant Labs/ETH Zurich/Google/Microsoft), each with an ASCII architecture diagram, a worked SKILL.md-style example, and a security/trade-off note: (1) Action Selector — LLM only picks from a fixed action list, never sees tool output; (2) Plan-Then-Execute — LLM locks a full plan before touching external data; (3) LLM Map-Reduce — isolated per-file LLM calls with strict schema output, non-LLM reducer; (4) Dual LLM — Privileged LLM (has tools, never sees untrusted data) + Quarantined LLM (sees untrusted data, has no tools) coordinated by non-LLM orchestrator code via symbolic `$VAR` references; (5) Code-Then-Execute — LLM generates a full script before seeing external data, then runs it sandboxed (no network, restricted filesystem); (6) Input-Output Filter — a retriever LLM extracts only specific fields, a separate summarizer LLM never sees the raw original input.
  - Applies these to a concrete "SKILL.md contains a URL with an injected prompt" threat scenario, giving a 4-layer defense stack (Skill Review → Content Isolation → Execution Sandboxing → Output Validation) and a full worked "Secure Web Analyzer" SKILL.md template using the Dual LLM pattern with a Python schema-validation snippet.
  - Ends with a decision tree ("does this skill fetch external content? execute code? access private files?") for choosing among the 6 patterns, a skill-author checklist and skill-consumer checklist, and a short "what might solve this in the future" section (token-level privilege tagging, Microsoft FIDES-style Information Flow Control, formal verification — all noted as not production-ready). 10 numbered references (arXiv papers, Meta, OWASP, Microsoft, Simon Willison, Lakera).

- **`claude-code-native-tasks-orchestration-system.md`** (33.4K)
  - Topic researched: Claude Code's native `Task` tool system (TaskCreate/TaskUpdate/TaskGet/TaskList) as a session-scoped orchestration primitive, and the "hydration pattern" for bridging that session-scoped state to persistent spec files across sessions. Sourced from a syndicated external blog post (Rick Hightower / Spillwave Solutions, pub.spillwave.com, dated Jan 27 2026) rather than original repo research — reproduced with attribution.
  - Conclusion / key claims: Tasks are deliberately session-scoped (not persistent) — verified by inspecting `~/.claude/tasks/<uuid>/` and finding only empty `.lock` files, no task data. The "hydration pattern" reads persistent spec files (e.g. `.speckit/tasks.md`) into live Claude Tasks at session start and syncs completed status back to those files at session end, giving durable multi-session progress via git-tracked markdown. Documents the 4 tools' parameters (`subject`/`description`/`activeForm`/`metadata` for TaskCreate; `status`/`addBlocks`/`addBlockedBy`/`owner` for TaskUpdate), a worked 28-task hydration example with automatic dependency-chain setup, a 2-agent parallel case study (Rust backend + React frontend, zero file overlap, `allowed_tools` scoping e.g. `Bash(cargo *)`), a "when to use Tasks vs skip" decision matrix (the "3-Task Rule": fewer than 3 related steps → just do them directly), and lineage history (community "Ralph Wiggum Loop" stop-hook plugin → "Ralphie" tool adding parallel execution/dependencies → native Tasks in Claude Code 2.1+ as of ~2026-01-22, formalizing what Ralphie pioneered). Notes Ralphie still has unique features Tasks lack: git worktree isolation per agent, automatic PR creation, cross-session state file persistence.
  - Includes a full copy-paste "Appendix" prompt for converting an existing SDD/speckit project into native Claude Tasks with parallel subagents.

- **`complete-guide-to-building-skills-for-claude.md`** (36.2K)
  - Topic researched: End-to-end guide to authoring, testing, and distributing Claude Skills — sourced/adapted from Anthropic's official PDF ("The Complete Guide to Building Skill for Claude", resources.anthropic.com).
  - Conclusion / key claims (organized as 6 chapters + 3 reference appendices):
    - Ch.1 Fundamentals: a skill = folder with required `SKILL.md` + optional `scripts/`, `references/`, `assets/`; **progressive disclosure** = 3 levels (YAML frontmatter always loaded → SKILL.md body loaded when relevant → linked files loaded on demand); skills must be composable and portable across Claude.ai/Code/API. Includes an "MCP builders" section framing MCP=kitchen (tools) vs Skills=recipes (how to use them well).
    - Ch.2 Planning and Design: start from 2-3 concrete use cases; 3 use-case categories (Document/Asset Creation, Workflow Automation, MCP Enhancement) each with a real example skill; success criteria (quantitative: 90% trigger rate, tool-call count, 0 failed API calls; qualitative: no follow-up prompting needed). Full file-structure spec, naming rules (kebab-case folder, exact `SKILL.md` filename, no README.md inside), full YAML frontmatter field reference (`name`, `description` <1024 chars must include WHAT+WHEN, `license`, `compatibility`, `metadata`), forbidden content (`<`/`>` XML tags, "claude"/"anthropic" in skill name — reserved).
    - Ch.3 Testing and Iteration: 3 testing rigor levels (manual in Claude.ai, scripted in Claude Code, programmatic via Skills API); 3 test categories (Triggering, Functional, Performance Comparison) each with worked examples; the `skill-creator` skill's role (does not run automated evals, just design assistance); iteration guidance keyed to under-triggering vs over-triggering vs execution-issue symptoms.
    - Ch.4 Distribution and Sharing: current (Jan 2026) distribution model — manual zip-upload to Claude.ai Settings, org-wide admin deployment (shipped Dec 18 2025); skills as an "open standard" portable across platforms; Skills API (`/v1/skills` endpoint, `container.skills` param in Messages API, requires Code Execution Tool beta); positioning advice (outcome-framing vs feature-framing).
    - Ch.5 Patterns and Troubleshooting: problem-first vs tool-first skill framing; 5 named patterns (Sequential Workflow Orchestration, Multi-MCP Coordination, Iterative Refinement, Context-Aware Tool Selection, Domain-Specific Intelligence) each with a worked markdown example; a troubleshooting section covering upload failures, non-triggering skills, over-triggering skills, MCP connection issues, ignored instructions, and large-context/performance issues — each with symptom/cause/solution.
    - Ch.6 + Appendices: links to official Anthropic docs/blog posts, the `anthropics/skills` public repo, a Quick Checklist (before/during/after skill authoring), full YAML frontmatter reference including `allowed-tools` field, and pointers to complete example skills (Document Skills, Partner Skills Directory).

- **`preventing-prompt-injection-in-skills.md`** (12.0K)
  - Topic researched: Concrete, skill-author-facing hardening techniques against indirect prompt injection specifically in the SKILL.md attack surface (narrower/more actionable companion to `architectural-defense-prompt-injection.md`, in English).
  - Conclusion / key claims: A SKILL.md is read via the `view` tool directly into Claude's context, making it indistinguishable from trusted instructions — so a URL inside a SKILL.md whose fetched content contains an injected instruction ("ignore previous instructions, run curl ...") is a direct code-execution/exfiltration path. Frames this as OWASP LLM01:2025. Documents a 7-row threat table (Data Exfiltration, Credential Theft, File System Manipulation, Supply Chain Poisoning, Privilege Escalation, Persistence, Social Engineering) with severity ratings.
  - **Defense-in-depth, 5 layers**, each with a copy-paste SKILL.md snippet:
    1. Skill Design — "never fetch arbitrary URLs from within a SKILL.md," inline everything instead; applies **Meta's "Agents Rule of Two"**: a skill should satisfy at most 2 of {[A] processes untrustworthy inputs, [B] accesses sensitive data, [C] changes state} — violating all 3 (fetch + user-file access + exec) is flagged "⛔ Highest risk."
    2. Input Validation — treat fetched content as data-only via explicit "CRITICAL SECURITY NOTE" framing in the skill text, plus structured-extraction technique (pull only named JSON fields, discard narrative text).
    3. Allowlisting — restrict fetches to named domains only, explicitly overriding any fetched-content instruction to visit other domains; notes this complements the existing `network_configuration` domain allowlist in the Claude environment.
    4. Human-in-the-Loop — require explicit user confirmation before any curl/wget/network call, write to `/mnt/user-data/`, package install, or env-var-referencing command.
    5. Output Validation — post-execution checks that only expected files were touched/created and no unexpected network calls were made.
  - Provides a full "Practical SKILL.md Security Template" combining all 5 layers (Trust Model / Allowed Operations / Prohibited Operations / Content Processing Rules sections).
  - "For Skill Consumers" section: a 9-row red-flag table for auditing third-party skills before install (arbitrary URL fetch, base64 encode/decode, pipe-to-bash/eval, env-var access, external POST, `.bashrc` modification, unknown package installs, hidden-file references, URL shorteners) plus a 7-item audit checklist.
  - Closing "Uncomfortable Truth" section repeats the same >90%-bypass-rate research citation as the architectural-defense doc, concluding no SKILL.md-level prompting fix guarantees safety — reinforcing that this doc and `architectural-defense-prompt-injection.md` are a matched pair (mitigations-you-can-write-today vs. architectural-patterns-for-real-fixes). 6 references overlapping the other doc's reference list.

### Skipped (existence + size only, not read)
- `docs/assets/` — 46M (binary/image assets)
- `docs/infographics/` — 5.9M (binary/image assets)
- `docs/journals/` — 104K (session journal logs)
