# Mechanical Inventory — ClaudeKit Engineer Skills Group 1

Date: 2026-08-25 | Coverage: 22/22 skills (21 full + 1 thin wrapper)

---

## Inventory Entries

### agent-browser
- **What:** Fast browser automation CLI for AI agents using Chrome/Chromium via CDP. Provides accessibility-tree snapshots and compact `@eN` element refs. Use for testing, screenshots, form fills, scraping, cloud browsers, Electron apps, and Slack automation.
- **Where:** `claude/skills/agent-browser/SKILL.md`, `references/browserbase-cloud-setup.md`, commands via `agent-browser skills get <topic>`
- **Mechanism notes:** "Commands and skills ship with the binary" — invokes `agent-browser skills get core` to load version-matched workflow content; supports specialized skills (electron, slack, dogfood, vercel-sandbox, agentcore); observability dashboard on port 4848
- **Keywords:** browser automation, playwright, testing, e2e, browserbase, autonomous, headless, electron, slack

### agentize
- **What:** Convert a codebase feature/module into an AI-agent-friendly CLI and/or MCP server. Covers npm packaging, stdio/SSE/Streamable HTTP surfaces, credential resolution, docs, tests, CI, and companion Claude skill. Principles: understand before wrap, agent-centric design, one source of truth.
- **Where:** `claude/skills/agentize/SKILL.md`, `references/agent-centric-design.md`, `references/monorepo-layout.md`, `references/deployment-guide.md`
- **Mechanism notes:** "7-phase workflow" — Track (mandatory) → Scout → Analyze → Decide → Scaffold → Wrap → Harden → Package. Hard gates at each phase; modes: `--both` (default monorepo), `--mcp`-only, `--cli`-only; interaction: `--auto` (autonomous), `--ask` (clarifying questions)
- **Keywords:** agentize, mcp, cli, monorepo, npm, cloudflare, docker, agent-tool, typescript

### ai-artist
- **What:** Generate product mockups, marketing assets, brand visuals, concept art via Nano Banana with 129 curated prompts. Mandatory validation interview refines style/mood/colors. 3 modes: search (default), creative (remix), wild (random artistic transform).
- **Where:** `claude/skills/ai-artist/SKILL.md`, `references/validation-workflow.md`, `data/awesome-prompts.csv`, `scripts/generate.py`, `scripts/search.py`
- **Mechanism notes:** BM25 search engine over 129 curated prompts; 10 wild-mode transformations (Ukiyo-e, Bento grid, cyberpunk, cinematic, vaporwave, etc.); modes can be combined (`--mode all` generates all 3 variations); routes through `ai-multimodal` for unified provider access
- **Keywords:** image generation, prompts, styles, Nano Banana, generation modes, validation interview

### ai-multimodal
- **What:** Analyze images/audio/video with Gemini API (vision), generate images (Imagen 4, Nano Banana 2, MiniMax), videos (Veo 3, Hailuo), speech (MiniMax TTS), music (MiniMax). Use for vision analysis, transcription, OCR, design extraction, multimodal AI.
- **Where:** `claude/skills/ai-multimodal/SKILL.md`, `references/vision-understanding.md`, `references/image-generation.md`, `references/video-generation.md`, `references/minimax-generation.md`, `scripts/gemini_batch_process.py`, `scripts/minimax_cli.py`
- **Mechanism notes:** Multi-provider routing (Google, OpenRouter, MiniMax); Gemini API key rotation support; stdin support for file piping; audio/video length limits (9.5h audio, 6h video); transcript output format (markdown with timestamps); MiniMax voice library (300+ voices, 40+ languages)
- **Keywords:** vision, image, video, audio, Gemini, Imagen, Veo, Hailuo, transcription, OCR, multimodal

### ask
- **What:** Answer technical and architectural questions with expert analysis. Consultative role using four specialized architectural advisors: Systems Designer, Technology Strategist, Scalability Consultant, Risk Analyst. Use for design decisions, best practices evaluation, solution comparison.
- **Where:** `claude/skills/ask/SKILL.md`, `./.claude/rules/primary-workflow.md`, `./.claude/rules/development-rules.md`
- **Mechanism notes:** "Four specialized advisors" — Systems Designer (boundaries/interfaces), Technology Strategist (tech stacks/patterns), Scalability Consultant (performance/reliability), Risk Analyst (issues/trade-offs). Output: Architecture Analysis → Design Recommendations → Technology Guidance → Implementation Strategy → Next Actions
- **Keywords:** questions, consultation, architecture, expert analysis, trade-offs, design decisions

### backend-development
- **What:** Production-ready backend development with modern technologies. Covers REST/GraphQL/gRPC APIs, auth (OAuth, JWT), databases, microservices, security (OWASP), Docker/K8s. Technology selection guide for Node.js, Python, Go, Rust with corresponding frameworks.
- **Where:** `claude/skills/backend-development/SKILL.md`, `references/backend-technologies.md`, `references/backend-api-design.md`, `references/backend-security.md`, `references/backend-authentication.md`, `references/backend-performance.md`, `references/backend-architecture.md`, `references/backend-testing.md`
- **Mechanism notes:** Decision matrix for tech selection (Node.js+NestJS for speed, Python+FastAPI for ML, Go+Gin for concurrency); implementation checklist (API design → DB schema → security hardening → testing 70-20-10 pyramid → deployment); 2025 key practices listed (Argon2id passwords, parameterized queries, OAuth 2.1+PKCE, Redis caching, blue-green/canary deployments)
- **Keywords:** nodejs, python, go, api, rest, graphql, grpc, authentication, databases, microservices

### better-auth
- **What:** Add authentication with Better Auth (TypeScript). Supports email/password, OAuth providers (Google, GitHub), 2FA/MFA, passkeys/WebAuthn, sessions, RBAC, rate limiting. Framework-agnostic for Next.js, Nuxt, SvelteKit, Remix, Astro, Hono, Express, etc.
- **Where:** `claude/skills/better-auth/SKILL.md`, `references/email-password-auth.md`, `references/oauth-providers.md`, `references/database-integration.md`, `references/advanced-features.md`, `scripts/better_auth_init.py`
- **Mechanism notes:** Client-server architecture (server handles auth logic + DB, client provides hooks/methods); database adapters with Kysely; feature matrix shows plugin requirements (email/password built-in, OAuth built-in, 2FA requires plugin, passkeys require plugin, organizations require plugin); resolution chain for credentials (explicit flag → env var → .env files → config JSON → keychain)
- **Keywords:** auth, oauth, 2fa, passkeys, sessions, webauthn, betterauth, typescript

### bootstrap
- **What:** End-to-end project bootstrapping from idea to running code. Principles: YAGNI, KISS, DRY, token efficiency. Modes: full (interactive ultrathink), auto (explicit autonomous), fast (quick), parallel (multi-agent).
- **Where:** `claude/skills/bootstrap/SKILL.md`, `references/workflow-full.md`, `references/workflow-auto.md`, `references/workflow-fast.md`, `references/workflow-parallel.md`, `references/shared-phases.md`
- **Mechanism notes:** "10-step workflow" — Git Init → Research (mode-dependent) → Tech Stack → Design → Planning (delegates to `/ck:plan`) → Implementation (delegates to `/ck:cook`) → Test → Review → Docs → Onboard → Final. Modes select research depth, gate style, and cook parallelism; planning/cook skill modes composed from flags
- **Keywords:** scaffold, project, setup, boilerplate, new-project, initialization

### brainstorm
- **What:** Brainstorm solutions with trade-off analysis and brutal honesty. Use for ideation, architecture decisions, technical debates, feature exploration, feasibility assessment, design discussions, problem-first inversion, HTML editorial reports, and AgentWiki publishing.
- **Where:** `claude/skills/brainstorm/SKILL.md`, `references/problem-first.md`, `references/editorial-magazine-html.md`
- **Mechanism notes:** "Scout-first mandatory" before asking any clarifying question; hard gates for exact requirements capture (output, acceptance criteria, scope, constraints, touchpoints); 9-phase flow (Scout → Discovery → Scope Assessment → Research → Analysis → Debate → Consensus → Documentation → Finalize); flags: `--html` (editorial HTML output), `--wiki` (AgentWiki publishing); handoff to `/ck:plan` modes (default, --tdd) after design approval
- **Keywords:** ideation, tradeoffs, debate, decisions, problem-first, html, wiki, agentwiki, reports

### chrome-profile
- **What:** Target a real Google Chrome profile for browser automation through Chrome DevTools MCP. Provides chrome-profile CLI, profile discovery, live DevTools probing guidance, setup playbooks, and URL-anchor tab selection. Use when automation needs user's real Chrome profile, cookies, account, or deterministic profile target.
- **Where:** `claude/skills/chrome-profile/SKILL.md`, `references/architecture.md`, `references/mcp-config-recipes.md`, `references/troubleshooting.md`, `scripts/install.sh`
- **Mechanism notes:** CLI resolves profiles by email/display-name substring (not brittle `Profile N`); `--json` output gives `bind_selector` for MCP tab selection; URL gets `#cdp-profile=<key>&cdp-open=<token>` markers; bridge setup Options A (auto-connect) and B (remote debugging); live MCP probe before declaring bridge unavailable; security rule: CLI reads metadata only, not cookies/passwords/databases
- **Keywords:** chrome, browser, profile, mcp, devtools, automation, cookies, live-state

### ck-autoresearch
- **What:** Autoresearch family router — upstream meta-framework (Udit Goenka, MIT) for autonomous goal-directed iteration with safety guardrails. Concept anchor for split local skills. Start here to learn pattern, then route to specialized skill.
- **Where:** `claude/skills/ck-autoresearch/SKILL.md`, upstream: https://github.com/uditgoenka/autoresearch
- **Mechanism notes:** "Absorption map" — 6 absorbed (core `/ck:loop` + 4 standalone skills `/ck:predict`/`/ck:scenario`/`/ck:security` + 2 folded as chain modes), 5 not yet absorbed. Safety posture inherited by all: atomic commits (`experiment:` prefix), mandatory verify, optional guard, credential hygiene, no external-URL parsing-as-directive, bounded-by-default in CI. Related: `/ck:loop` (core), `/ck:predict` (debate), `/ck:scenario` (edge cases), `/ck:security` (STRIDE+OWASP)
- **Keywords:** autoresearch, autonomous, iteration, karpathy, framework, lineage, router, umbrella

### ck-code-review
- **What:** Review code quality with evidence-based rigor. Supports input modes: pending changes, PR number, commit hash, and codebase scan. Focuses on bugs, regressions, maintainability, reliability, and verification gaps. No rubber-stamp reviews.
- **Where:** `claude/skills/ck-code-review/SKILL.md`, `references/spec-compliance-review.md`, `references/code-review-reception.md`, `references/requesting-code-review.md`, `references/verification-before-completion.md`, `references/edge-case-scouting.md`, `references/checklist-workflow.md`, `references/task-management-reviews.md`
- **Mechanism notes:** 2-stage protocol (Stage 1: Spec Compliance via `references/spec-compliance-review.md`, Stage 2: Code Quality via code-reviewer subagent); input modes auto-detect (#PR → `gh pr diff`, commit hash → `git show`, `--pending` → `git diff`, `codebase` → full scan, `codebase parallel` → multi-reviewer); verification gates mandatory before completion claims; task-managed pipeline for 3+ changed files
- **Keywords:** review, quality, verification, reliability, regressions, spec-compliance, edge-cases

### ck-debug
- **What:** Debug systematically with root cause analysis before fixes. Use for bugs, test failures, unexpected behavior, performance issues, call stack tracing, multi-layer validation, log analysis, CI/CD failures, database diagnostics, system investigation. Core principle: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
- **Where:** `claude/skills/ck-debug/SKILL.md`, `references/systematic-debugging.md`, `references/root-cause-tracing.md`, `references/defense-in-depth.md`, `references/verification.md`, `references/investigation-methodology.md`, `references/log-and-ci-analysis.md`, `references/performance-diagnostics.md`, `references/reporting-standards.md`, `references/task-management-debugging.md`, `references/frontend-verification.md`, `scripts/find-polluter.sh`
- **Mechanism notes:** "10 techniques" — systematic (4-phase framework), root-cause tracing (backward through call stack), defense-in-depth validation (entry → logic → environment → instrumentation), verification (iron law: fresh evidence before claims), investigation (5-step for system-level), log/CI analysis (gh CLI for GitHub Actions), performance diagnostics (bottleneck identification), reporting standards, task management, frontend verification (ck:agent-browser or chrome-profile)
- **Keywords:** debug, root-cause, bugs, test-failures, investigation, performance, diagnostics

### ck-graphify
- **What:** Build queryable knowledge graphs from code, docs, papers, and images. Use for codebase understanding, architecture analysis, cross-file relationship discovery, token-efficient navigation. Three-pass architecture: AST extraction (local, tree-sitter), audio/video transcription (Whisper), semantic extraction (LLM).
- **Where:** `claude/skills/ck-graphify/SKILL.md` (note: PyPI package is `graphifyy` double-y), upstream: https://github.com/safishamsi/graphify
- **Mechanism notes:** Supports 20 languages via tree-sitter (Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP, Swift, Lua, Zig, PowerShell, Elixir, Objective-C, Julia); outputs: `graph.html` (interactive viz), `GRAPH_REPORT.md` (god nodes), `graph.json` (persistent), `cache/` (incremental); MCP server mode with 4 tools (query_graph, get_node, get_neighbors, shortest_path); confidence tagging (EXTRACTED/INFERRED/AMBIGUOUS)
- **Keywords:** knowledge-graph, code-analysis, tree-sitter, codebase-understanding, ast, mcp

### ck-loop
- **What:** Autonomous iterative optimization loop — run N iterations against a mechanical metric, learn from git history, auto-keep/discard changes. Use for improving measurable metrics (coverage, performance, bundle size, etc.) through repeated experimentation.
- **Where:** `claude/skills/ck-loop/SKILL.md`, `references/autonomous-loop-protocol.md`, `references/git-memory-pattern.md`
- **Mechanism notes:** "8-phase loop protocol" with required config (Goal, Scope glob, Verify command outputting single number) and optional (Guard, Iterations, Noise level, Min-Delta, Direction); ONE atomic change per iteration (pass atomicity test: describable in one sentence without "and"); commit BEFORE verify; logs to `loop-results.tsv` per iteration; stuck detection (5 consecutive discards → analyze patterns + shift strategy, 10 consecutive → STOP); verify-command safety screen (refuse `rm -rf /`, fetch-and-execute, unannounced outbound writes); credential masking mandatory
- **Keywords:** optimization, iteration, metrics, loop, autonomous, experimentation

### ck-plan
- **What:** Plan implementations, design architectures, create technical roadmaps with detailed phases. Use for feature planning, system design, solution architecture, implementation strategy, phase documentation, editorial self-contained HTML plan artifacts, and AgentWiki publishing.
- **Where:** `claude/skills/ck-plan/SKILL.md`, `references/workflow-modes.md`, `references/scope-challenge.md`, `references/research-phase.md`, `references/codebase-understanding.md`, `references/solution-design.md`, `references/plan-organization.md`, `references/output-standards.md`, `references/archive-workflow.md`, `references/red-team-workflow.md`, `references/validate-workflow.md`, `references/task-management.md`, `references/verification-roles.md`
- **Mechanism notes:** CLI integration via `ck plan create`/`ck plan check` (not hand-edited); modes: `--auto` (detect), `--fast` (skip research), `--hard` (2 researchers), `--deep` (2-3 researchers+per-phase scout), `--parallel`, `--two` (two approaches); composable flags: `--tdd` (tests-first), `--no-tasks` (skip hydration), `--html` (editorial HTML), `--github` (create issue + label), `--wiki` (AgentWiki publish); 13-step workflow with red-team and validation gates; phase file template with YAML frontmatter; cross-plan dependency detection via blockedBy/blocks fields
- **Keywords:** planning, architecture, phases, roadmap, html, github, wiki, agentwiki, publish, design

### ck-predict
- **What:** 5 expert personas debate proposed changes before implementation. Catches architectural, security, performance, and UX issues early. Use before major features or risky changes to stress-test assumptions.
- **Where:** `claude/skills/ck-predict/SKILL.md`, `references/chain-modes.md`, upstream: https://github.com/uditgoenka/autoresearch
- **Mechanism notes:** "5 personas independently analyze, then debate conflicts" — Architect (design/scalability), Security (attack surface/auth), Performance (latency/queries/bundle), UX (experience/accessibility/errors), Devil's Advocate (simpler alternatives/hidden assumptions). Verdict levels: GO (aligned, proceed), CAUTION (manageable concerns + mitigations), STOP (critical unresolved). Chain modes: `--chain reason` (subjective refinement loop), `--chain probe` (requirement interrogation via saturation). Output format: verdict + agreements + conflicts table + risk summary + recommendations
- **Keywords:** prediction, debate, review, risk, personas, pre-analysis, architectural-review

### ck-scenario
- **What:** Generate comprehensive edge cases and test scenarios by decomposing features across 12 dimensions. Use for pre-implementation risk discovery, QA planning, regression design, and iterative saturation when coverage must be exhaustive.
- **Where:** `claude/skills/ck-scenario/SKILL.md`, `references/saturation-loop.md`, upstream: https://github.com/uditgoenka/autoresearch
- **Mechanism notes:** "12 decomposition dimensions" — User Types, Input Extremes, Timing, Scale, State Transitions, Environment, Error Cascades, Authorization, Data Integrity, Integration, Compliance, Business Logic. Two modes: one-shot (3–5 scenarios per dimension, default), iterative (`--iterations N` bounded loop, `--saturation` until 2 consecutive iterations yield no novelties). Severity criteria: Critical (data loss/breach/RCE), High (broken for subset/inconsistency), Medium (degraded UX), Low (minor glitch). Iterative outputs: `scenario-results.tsv` per iteration + progress every 5 iterations + final coverage matrix + composite score
- **Keywords:** edge-cases, test-scenarios, dimensions, saturation, iterations, scenario-generation

### ck-security
- **What:** STRIDE + OWASP-based security audit with optional red-team persona discovery loop and auto-fix. Scans code for vulnerabilities from multiple attacker perspectives, categorizes by severity, and can iteratively fix findings using ck:autoresearch pattern.
- **Where:** `claude/skills/ck-security/SKILL.md`, `references/stride-owasp-checklist.md`, `references/red-team-personas.md`, upstream: https://github.com/uditgoenka/autoresearch
- **Mechanism notes:** "6 audit steps" — Scope resolution → STRIDE analysis (Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation) → OWASP Top 10 check → Dependency audit (npm audit, pip-audit, govulncheck, bundle audit) → Secret detection (regex patterns) → Categorization (severity). Modes: audit-only, `--red-team` (4 attacker personas: Security Adversary, Supply Chain, Insider, Infrastructure with 4-persona iterative discovery), bounded red-team (`--red-team --iterations N`), `--fix` (auto-fix iteratively), red-team+fix. Credential hygiene mandatory (mask JWTs, 32+ hex, AWS key prefixes, connection strings)
- **Keywords:** security, STRIDE, OWASP, audit, red-team, penetration-testing, vulnerability-discovery

### coding-level
- **What:** Set coding experience level for tailored output (0-5 scale). Adjust explanation depth, code complexity, and response format to user expertise. Levels: 0 (ELI5), 1 (Junior), 2 (Mid-Level), 3 (Senior), 4 (Tech Lead), 5 (God Mode/default).
- **Where:** `claude/skills/coding-level/SKILL.md`
- **Mechanism notes:** Setting via `.claude/.ck.json` `codingLevel` field; guidelines auto-injected at session start; optional manual `/output-style` with levels (coding-level-0-eli5 through coding-level-5-god). Configured at project level, no manual activation needed.
- **Keywords:** experience, level, explanation, format, tailored-output

### common
- **What:** Thin wrapper — not a shipped user-invocable skill. Shared utilities directory for supporting scripts used by other skills.
- **Where:** `claude/skills/common/`, contains `README.md`, `api_key_helper.py`, `api_key_rotator.py`
- **Mechanism notes:** Directory for common Python helpers (API key management, rotation); no SKILL.md file; referenced by other skills as shared infrastructure
- **Keywords:** shared-utilities, helpers, common-scripts, infrastructure

### context-engineering
- **What:** Check context usage limits, monitor time remaining, optimize token consumption, debug context failures. Use when asking about context percentage, rate limits, usage warnings, context optimization, agent architectures, memory systems.
- **Where:** `claude/skills/context-engineering/SKILL.md`, `references/context-fundamentals.md`, `references/context-degradation.md`, `references/context-optimization.md`, `references/context-compression.md`, `references/memory-systems.md`, `references/multi-agent-patterns.md`, `references/evaluation.md`, `references/tool-design.md`, `references/project-development.md`, `references/runtime-awareness.md`, `scripts/context_analyzer.py`, `scripts/compression_evaluator.py`
- **Mechanism notes:** "Four-bucket strategy" — Write (save externally), Select (pull relevant only), Compress (reduce tokens), Isolate (split across sub-agents). Key metrics: warning at 70% utilization, optimize at 80%; token variance explains 80% of agent performance; multi-agent cost ~15x single agent; compaction target 50-70% with <5% quality loss; cache hit target 70%+. Runtime awareness auto-injects usage via PostToolUse hook; thresholds: 70% (WARNING), 90% (CRITICAL). Attention mechanics: U-shaped curve favors beginning/end positions
- **Keywords:** context, tokens, limits, memory, optimization, compression, multi-agent, evaluation

---

## Summary Statistics

- **Total skills inventoried:** 22 directories
- **Fully documented skills:** 21 (have SKILL.md)
- **Thin wrappers/shared utilities:** 1 (common — no SKILL.md, Python helpers only)
- **Mechanism variety:** 4 primary patterns observed:
  1. **Standalone skill with references** (most common — brainstorm, ck-plan, bootstrap)
  2. **Autoresearch family member** (ck-loop, ck-predict, ck-scenario, ck-security — each implements safety guards + specialized loop)
  3. **Routers/concept anchors** (ck-autoresearch — umbrella for split family; coding-level — preference setter)
  4. **Thin wrappers** (common — shared utilities; context-engineering — utility collection)
- **External dependencies:**
  - Upstream OSS: agent-browser (vercel-labs), graphify (safishamsi), autoresearch family (uditgoenka/autoresearch)
  - Service providers: Gemini API, OpenRouter, MiniMax, Browserbase, Anthropic API, AgentWiki
  - CLIs: `ck` (ClaudeKit), `gh` (GitHub), `npm`, `psql`, `cargo`, `python`
- **Highest cross-skill integration:** `/ck:plan`, `/ck:cook` (impl), `/ck:debug` (via references to `/ck:scout`), `/ck:brainstorm` (gates before `/ck:plan`)
- **Shared concepts:** safety posture (autoresearch family), credential hygiene (better-auth, ck-loop, ck-security), verification gates (ck-code-review, ck-debug), persona-based analysis (ck-predict)

---

## Unresolved Questions

1. **Cook skill location:** Inventory covers group 1 (22 directories as specified). Group 2 likely includes `/ck:cook` (implementation skill heavily referenced across group 1 — appears in bootstrap, brainstorm, plan handoff protocols).
2. **common directory placement:** Listed because it appears in the 22-directory list, but it's not a user-invocable skill — it's Python helper infrastructure. Confirm whether this should remain in the official skill roster or migrate to a `_shared/` location.
3. **Agent-browser browser-bridge playback:** MCP auto-connect vs. remote debugging trade-off (Option A vs B) — both valid but require different setup/restart expectations. No single "recommended" path in doc.
4. **GraphQL/REST depth:** backend-development skill includes references to 7+ subtopics (api-design, security, perf, architecture, testing, devops, debugging) but doesn't ship deep hands-on guides. Confirm whether these are loaded at invocation time or user-curated.

---

*End of Inventory — All 22 directories covered with full mechanism notes and cross-reference paths.*
