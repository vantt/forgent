---
title: Inventory – claudekit-engineer Skills Group 3 (22 skills)
date: 2026-08-25
scope: mechanical facts only, no judgment
---

# Skill Inventory: Group 3 (22/22)

**Coverage:** All 22 skills read and inventoried. Facts extracted from SKILL.md + noted reference files. No judgment applied.

---

## 1. markdown-novel-viewer

- **What:** HTTP server rendering markdown files in a calm, book-like reader UI with auto-hide header, progress bar, and directory browser. Also renders Mermaid diagrams inline with theme support.
- **Where:** `claude/skills/markdown-novel-viewer/SKILL.md`; `scripts/server.cjs`, `scripts/lib/` (port-finder, process-mgr, http-server, markdown-renderer, plan-navigator); `assets/` (template.html, reader.js, theme CSS, modular styles); routes at `/view`, `/browse`, `/assets`, `/file`
- **Mechanism notes:** Auto-increments to next available port (3456-3500) on conflict; `--host 0.0.0.0` binds to all interfaces and auto-detects local network IP; `--background` mode with PID file management (`/tmp/md-novel-viewer-*.pid`); plan directory structure auto-detection with accordion sidebar + Previous/Next nav; keyboard shortcuts (`?`, `T`, `S`, arrow keys, `Esc`); mobile FAB + bottom-sheet for <768px viewports
- **Keywords:** "novel-reader UI", "warm cream background" (light) / "warm gold accents" (dark), Libre Baskerville, Inter, JetBrains Mono, "focused reader mode", "auto-hide header", "progress bar", "full-width toggle", "Mermaid auto-renders", "plan navigation", "first-time toast"

---

## 2. mcp-builder

- **What:** Comprehensive MCP server development guide for FastMCP (Python), TypeScript/Node.js SDKs. Covers agent-centric design, evaluation creation, and best practices for LLM-external service integration.
- **Where:** `claude/skills/mcp-builder/SKILL.md`; `reference/mcp_best_practices.md` (universal guidelines), `reference/python_mcp_server.md` (Python-specific), `reference/node_mcp_server.md` (TypeScript guide), `reference/evaluation.md` (QA pair creation); external: `https://modelcontextprotocol.io/llms-full.txt` (full MCP spec), Python SDK README, TypeScript SDK README
- **Mechanism notes:** Phase 1 emphasizes agent-centric design principles ("Build for Workflows, Not Just API Endpoints", "Optimize for Limited Context", "Design Actionable Error Messages"); Phase 2 implementation uses Pydantic v2 (Python) or Zod (TypeScript) for input validation; Phase 3 requires Quality Checklist from language-specific guides; Phase 4 creates XML evaluation files with Q&A pairs (read-only, independent, complex, realistic, verifiable, stable); MCP servers are long-running stdio/stdin processes — warns against running directly in main process
- **Keywords:** "agent-centric design", "evaluation-driven development", "tool registration" (`@mcp.tool`, `server.registerTool`), "Pydantic models", "Zod schemas", "tool annotations" (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`), "response format guidelines", "character limits and truncation", "pagination helpers", "error handling utilities", "XML evaluation format"

---

## 3. media-processing

- **What:** Processes video/audio/images using FFmpeg, ImageMagick, and RMBG CLI tools. Covers encoding, conversion, filters, thumbnails, batch processing, and HLS/DASH streaming.
- **Where:** `claude/skills/media-processing/SKILL.md`; `references/ffmpeg-encoding.md`, `references/ffmpeg-streaming.md`, `references/ffmpeg-filters.md`, `references/imagemagick-editing.md`, `references/imagemagick-batch.md`, `references/rmbg-background-removal.md`, `references/common-workflows.md`, `references/troubleshooting.md`, `references/format-compatibility.md`
- **Mechanism notes:** Tool selection matrix: FFmpeg for video/audio (native codec, streaming), ImageMagick for still images, RMBG for AI background removal, mogrify for batch in-place edits; FFmpeg key params: `-c:v libx264`, `-crf 22` (quality 0-51), `-preset slow`, `-c:a aac`; ImageMagick: `800x600` (fit within, maintain aspect), `800x600^` (fill, may crop), `-quality 85`, `-strip` (remove metadata); RMBG models: briaai (high quality), u2netp (fast); note: "Invoke `/ck:project-organization` skill to organize the outputs"
- **Keywords:** "codecs", "quality vs compression", "hardware acceleration", "HLS/DASH streaming", "live streaming", "complex filtergraphs", "AI background removal", "batch operations", "parallel ops", "responsive images", "GIF creation", "metadata removal"

---

## 4. mermaidjs-v11

- **What:** Create text-based diagrams using Mermaid.js v11 syntax. Supports flowcharts, sequence diagrams, class/ER/Gantt/state diagrams, architecture diagrams, timelines, user journeys via CLI or markdown rendering.
- **Where:** `claude/skills/mermaidjs-v11/SKILL.md`; `references/diagram-types.md` (syntax for 24+ types), `references/configuration.md` (config, theming, accessibility), `references/cli-usage.md` (CLI commands + Docker/batch), `references/integration.md` (JavaScript API), `references/examples.md` (practical patterns); CLI: `mmdc` command from `@mermaid-js/mermaid-cli`
- **Mechanism notes:** Markdown inline code blocks with ` ```mermaid ` fence; frontmatter config via `---` block (e.g., `theme: dark`); comments with `%% ` prefix; CLI: `mmdc -i diagram.mmd -o diagram.svg/png` with `-t dark` theme, `-b transparent`, `--cssFile` for custom styling; configuration options: `theme` (5 built-in + custom), `look` (classic/handDrawn), `fontFamily`, `securityLevel`; reference to `/ck:tech-graph`'s `svg-layout-best-practices.md` for SVG layout rules
- **Keywords:** "declarative syntax", "24+ diagram types", "frontmatter config", "Mermaid Live Editor", "theme support", "flowchart arrows" (`-->`), "pie/Gantt/XY charts", "sequenceDiagram participants", "comments", "layout collisions", "anti-pattern catalog"

---

## 5. mintlify

- **What:** Build and maintain Mintlify documentation sites using Markdown/MDX with API docs, components, navigation, theming, OpenAPI/AsyncAPI integration, and AI features (llms.txt, skill.md, MCP support).
- **Where:** `claude/skills/mintlify/SKILL.md`; `references/docs-json-configuration-reference.md` (docs.json config), `references/mdx-components-reference.md` (26+ MDX components), `references/api-documentation-components-reference.md` (OpenAPI), `references/navigation-structure-and-organization-reference.md`, `references/deployment-and-continuous-integration-reference.md`, `references/ai-features-and-integrations-reference.md`; CLI: `mint` command (dev, new, update, broken-links, a11y, validate, openapi-check, rename, migrate-mdx)
- **Mechanism notes:** Core config: `docs.json` file (replaces `mint.json`); 7 themes: mint, maple, palm, willow, linden, almond, aspen; 26+ built-in MDX components (Note, CodeGroup, Steps, etc.); navigation: Tabs, anchors, groups, dropdowns, products (partition docs), versions (multiple doc versions), languages (28+ locales, i18n); frontmatter per MDX file; analytics: GA4, PostHog, Amplitude, Clarity, Fathom, Heap, Hotjar, LogRocket, Mixpanel, Plausible integrations; deployment: auto-deploy from GitHub/GitLab, preview deployments, custom domains, subpath hosting, Vercel/Cloudflare/AWS
- **Keywords:** "MDX components", "API documentation", "OpenAPI/AsyncAPI", "llms.txt", "skill.md", "page modes" (default/wide/custom/frame/center), "code examples", "product partitioning", "version management", "i18n", "SEO metaTags", "redirects", "sitemap generation", "Discord/Slack bots"

---

## 6. mobile-development

- **What:** Production-ready mobile development with React Native, Flutter, Swift/SwiftUI, Kotlin/Jetpack Compose. Covers iOS/Android, mobile UX, performance optimization, offline-first architecture, app store deployment.
- **Where:** `claude/skills/mobile-development/SKILL.md`; `references/mobile-frameworks.md` (framework comparisons), `references/mobile-ios.md` (Swift 6, SwiftUI, iOS HIG), `references/mobile-android.md` (Kotlin, Material Design 3), `references/mobile-best-practices.md` (performance, offline, security, testing), `references/mobile-debugging.md` (tools, profiling), `references/mobile-mindset.md` (thinking patterns, decision frameworks)
- **Mechanism notes:** "10 Commandments of Mobile Development" principle set; framework stats (React Native 121K stars 67% familiarity, Flutter 170K stars 46% adoption); performance targets: app launch <2s (70% abandon if >3s), memory <100MB, network <3s, battery <5% drain/hour, animation 60 FPS; architecture: MVVM (small/medium), MVVM + Clean (large enterprise); state management: Zustand (React Native), Riverpod 3 (Flutter), StateFlow (Android); security: OAuth 2.0 + JWT + biometrics, Keychain/KeyStore, certificate pinning; testing: 70%+ unit test coverage, Detox/Appium/XCUITest/Espresso; deployment: Fastlane automation, staged rollouts (Internal → Closed → Open), mandatory iOS 17 SDK (2024), Android 15 API 35 (Aug 2025)
- **Keywords:** "cross-platform vs native", "offline-first", "MVVM", "Riverpod 3", "Zustand", "StateFlow", "OWASP Mobile Top 10", "HIG", "Material Design 3", "Fastlane", "TestFlight", "closed beta", "open rollout", "app size budgets" (<50MB initial, <200MB total)

---

## 7. payment-integration

- **What:** Integrate payments with SePay (Vietnamese banks, VietQR), Polar (global SaaS subscriptions), Stripe (global infrastructure), Paddle (MoR subscriptions), Creem.io (MoR + licensing). Covers checkout, webhooks, subscriptions, QR codes, multi-provider orders.
- **Where:** `claude/skills/payment-integration/SKILL.md`; per provider: `references/sepay/overview.md`, `/api.md`, `/webhooks.md`, `/sdk.md`, `/qr-codes.md`, `/best-practices.md` (similar structure for polar, stripe, paddle, creem); `references/multi-provider-order-management-patterns.md`; `scripts/sepay-webhook-verify.js`, `scripts/polar-webhook-verify.js`, `scripts/checkout-helper.js`
- **Mechanism notes:** Platform selection matrix: SePay (VND, bank transfers, VietQR, 44+ VN banks, 2 req/s), Polar (MoR, subscriptions, usage billing, benefits, 300 req/min), Stripe (CheckoutSessions, Billing, Connect, Payment Element), Paddle (MoR, overlay/inline checkout, Retain churn prevention, tax), Creem.io (MoR, licensing, revenue splits, no-code); general flow: auth → products → checkout → webhooks → events
- **Keywords:** "Merchant of Record" (MoR), "VietQR", "QR/bank/cards", "webhook verification", "subscription lifecycle", "usage billing", "tax compliance", "revenue splits", "device activation", "churn prevention", "SHA256 verification"

---

## 8. plans-kanban

- **What:** Thin launcher for ClaudeKit plans dashboard in CLI config UI. Opens integrated visual kanban view at localhost:3456/plans for multi-plan views, progress tracking, timeline checks, and navigation into plan files.
- **Where:** `claude/skills/plans-kanban/SKILL.md`; `scripts/open-dashboard.cjs` (launcher entry point); `deprecated/MIGRATION.md` (legacy server retirement notes); CLI command: `ck config ui --port 3456`
- **Mechanism notes:** Launcher auto-detects running dashboard at port 3456 or auto-fallback to 3457-3460; if dashboard not running, launches `ck config ui --port 3456 --no-open` then opens browser; capability probe via `/api/health` response containing `"plans-dashboard"` in features array OR `/api/plans` 2xx response (backward-compat); deprecated flags (--dir, --port, --host, --background, --foreground, --stop) accepted with warnings
- **Keywords:** "plans dashboard", "kanban view", "grid view", "progress overview", "plan.md navigation", "phase-*.md navigation", "project-scoped plans", "global-scoped plans", "blockedBy/blocks dependencies", "open vs completed work", "standalone server retired"

---

## 9. preview

- **What:** Universal viewer + visual generator. View existing files/directories OR generate new visual explanations, slides, diagrams, ASCII art, diff reviews, plan reviews, project recaps as self-contained HTML or markdown.
- **Where:** `claude/skills/preview/SKILL.md`; `references/visual-explanation-routing.md` (mode selection), `references/generation-modes.md` (explain/slides/diagram/ascii modes), `references/view-mode.md` (file/dir viewing); HTML mode refs: `references/html-design-guidelines.md`, `references/html-css-patterns.md`, `references/html-libraries.md`, `references/html-slide-patterns.md`, `references/html-responsive-nav.md`; templates: `architecture.html`, `mermaid-flowchart.html`, `slide-deck.html`, `data-table.html`
- **Mechanism notes:** Argument priority: `--stop` → HTML flag → workflow dispatch → generation flags → path resolution; topic-to-slug conversion: lowercase, spaces→hyphens, max 80 chars; HTML output to `plans/visuals/{slug}.html` with theme toggle button (MANDATORY); "Visual self-review pattern" adapted from fireworks-tech-graph; error handling: invalid topic, flag without topic, no git repo (for --diff), no plan file (for --plan-review), --html --ascii combination unsupported (ASCII terminal-only)
- **Keywords:** "visual explanation", "self-contained HTML", "Mermaid integration", "theme toggle", "slide deck", "diff review", "plan review", "project recap", "responsive nav", "anti-slop rules", "CSS reset", "font pairs", "static HTML mode", "asset embedding"

---

## 10. problem-solving

- **What:** Systematic problem-solving techniques for complexity spirals, innovation blocks, recurring patterns, assumption constraints, scale uncertainty. Each technique targets specific stuck-ness patterns.
- **Where:** `claude/skills/problem-solving/SKILL.md`; `references/when-stuck.md` (dispatch flowchart), `references/simplification-cascades.md`, `references/collision-zone-thinking.md`, `references/meta-pattern-recognition.md`, `references/inversion-exercise.md`, `references/scale-game.md`, `references/attribution.md` (source notes)
- **Mechanism notes:** Five core techniques: (1) Simplification Cascades — find one insight eliminating multiple components; (2) Collision-Zone Thinking — force unrelated concepts together for emergent properties; (3) Meta-Pattern Recognition — spot patterns in 3+ domains to find universal principles; (4) Inversion Exercise — flip assumptions to reveal hidden constraints; (5) Scale Game — test at extremes (1000x bigger/smaller, instant/year-long) to expose fundamental truths; techniques can combine for power (e.g., Simplification + Meta-pattern, Collision + Inversion)
- **Keywords:** "Simplification Cascades", "Collision-Zone", "Meta-Pattern Recognition", "Inversion", "Scale Game", "stuck-ness", "complexity spiral", "innovation block", "assumption constraints", "breakthrough thinking", "reusable abstractions"

---

## 11. project-management

- **What:** Project oversight and coordination using Claude native Tasks (TaskCreate, TaskUpdate, TaskGet, TaskList) integrated with persistent plan files. Tracks progress, updates plan statuses, generates reports, coordinates doc updates.
- **Where:** `claude/skills/project-management/SKILL.md`; `references/task-operations.md` (TaskCreate/TaskUpdate/TaskGet/TaskList), `references/hydration-workflow.md` (session-bridge pattern), `references/progress-tracking.md` (scanning, parsing, completion %), `references/documentation-triggers.md` (doc update delegation), `references/reporting-patterns.md` (session summaries, naming)
- **Mechanism notes:** Task tools (TaskCreate, TaskUpdate, TaskGet, TaskList) are **CLI-only** — disabled in VSCode extension (isTTY check); fallback to TodoWrite in VSCode; hydration pattern: Read plan [ ] items → TaskCreate per unchecked → TaskUpdate during work → Sync-back (reconcile all completed tasks, update [ ] → [x], update YAML frontmatter) → Resume from [ ] on next session; mandatory sync-back guard: sweep ALL phase-XX-*.md, reconcile every completed task to phase metadata, backfill earlier phases; plan YAML: status (pending/in-progress/completed), priority, effort, branch, tags, created date
- **Keywords:** "hydration pattern", "sync-back", "YAML frontmatter", "Task ephemeral/Plan persistent", "phase metadata", "checkpoint reconciliation", "completion %", "docs-manager subagent", "reporting-patterns", "token efficiency"

---

## 12. project-organization

- **What:** Standardizes file locations, naming conventions, directory structures, markdown content templates for any project type. Advisory mode (other skills reference) or Organize mode (direct user invocation with scanning/proposing/executing).
- **Where:** `claude/skills/project-organization/SKILL.md`; `references/markdown-body-templates.md` (plan/phase/report/journal/doc/ADR/changelog/README/guide/spec templates), `references/directory-patterns.md`, `references/naming-conventions.md`
- **Mechanism notes:** Five core rules: (1) Directory Categories — src/, docs/, plans/, tests/, scripts/, assets/{type}/, config/; (2) Naming Patterns — kebab-case, three modes: timestamped `{YYMMDD-HHmm}-{slug}`, evergreen `{slug}`, variant `{slug}-{variant}.{ext}`; max 50-char slugs; $CK_PLAN_DATE_FORMAT env var or default `YYMMDD-HHmm`; (3) Nesting Logic — single file flat, multi-file in subdirectory; (4) Markdown Body Standards — H1 title, optional frontmatter, universal sections: context → content → next steps; (5) Path Resolution Decision Tree — determine category, then naming, then nesting; Organize mode: Scan → Analyze → Propose → Confirm → Execute → Verify; safety: never overwrite, never touch .git/node_modules/.env, respect .gitignore
- **Keywords:** "timestamped vs evergreen", "kebab-case", "slug rules", "nesting logic", "Organize mode", "migration plan", "git handles backup", "single source of truth", "variant naming", "platform-specific subdirs" (twitter, linkedin)

---

## 13. react-best-practices

- **What:** Comprehensive performance optimization guide for React and Next.js from Vercel Engineering. 45 rules across 8 priority-ordered categories for automated refactoring and code generation guidance.
- **Where:** `claude/skills/react-best-practices/SKILL.md`; `rules/` directory with individual rule files (e.g., `async-parallel.md`, `bundle-barrel-imports.md`); `_sections.md` index; full compiled version in `AGENTS.md`
- **Mechanism notes:** Eight rule categories by priority/impact: (1) Eliminating Waterfalls (CRITICAL, prefix `async-`) — move await into branches, Promise.all(), Suspense streaming; (2) Bundle Size Optimization (CRITICAL, `bundle-`) — direct imports, next/dynamic, defer third-party, conditional loading; (3) Server-Side Performance (HIGH, `server-`) — React.cache(), LRU cache, minimize client data, parallel fetching; (4) Client-Side Data Fetching (MEDIUM-HIGH, `client-`) — SWR dedup, deduplicate event listeners; (5) Re-render Optimization (MEDIUM, `rerender-`) — defer reads, memo, dependencies, derived state; (6) Rendering Performance (MEDIUM, `rendering-`) — SVG wrapper animation, content-visibility, hoist JSX; (7) JavaScript Performance (LOW-MEDIUM, `js-`) — batch DOM/CSS, index maps, cache property access; (8) Advanced Patterns (LOW, `advanced-`) — event handler refs, useLatest
- **Keywords:** "wwaterfalls", "barrel files", "dynamic imports", "Suspense", "React.cache()", "LRU cache", "SWR", "startTransition", "content-visibility", "SVG precision", "memo", "inline script", "Activity component", "cssText", "toSorted()"

---

## 14. remotion

- **What:** Build video content programmatically with Remotion in React. Covers 3D (Three.js + React Three Fiber), animations, assets (images/video/audio/fonts), audio manipulation, captions, effects, metadata calculation, frame extraction, charts, GIFs, Lottie, text animation, timing, transitions, trimming, TailwindCSS integration.
- **Where:** `claude/skills/remotion/SKILL.md` (frontmatter + "When to use" section); 30+ rule files under `rules/` (3d.md, animations.md, assets.md, audio.md, calculate-metadata.md, can-decode.md, charts.md, compositions.md, display-captions.md, effects.md, extract-frames.md, fonts.md, get-audio-duration.md, get-video-dimensions.md, get-video-duration.md, gifs.md, images.md, import-srt-captions.md, lottie.md, measuring-dom-nodes.md, measuring-text.md, sequencing.md, tailwind.md, text-animations.md, timing.md, transcribe-captions.md, transitions.md, trimming.md, videos.md)
- **Mechanism notes:** React-based video composition approach; each rule file covers one feature with detailed explanation and code examples; helper: Mediabunny for media queries (can-decode, extract-frames, get-audio-duration, get-video-dimensions, get-video-duration); composition metadata: calculate-metadata.md for dynamic duration/dimensions/props; caption handling: display-captions.md for TikTok-style pages + word highlighting, import-srt-captions.md for .srt files, transcribe-captions.md for audio→captions
- **Keywords:** "React composition", "Three.js", "React Three Fiber", "Mediabunny", "captions", "SRT subtitles", "word highlighting", "Lottie animations", "text measurement", "DOM measuring", "frame extraction", "sequencing", "trimming", "Tailwind integration", "TikTok-style pages"

---

## 15. repomix

- **What:** Packs entire repositories into single, AI-friendly files (XML, Markdown, JSON, plain text). Supports remote repositories, comment removal, token counting, security checks via Secretlint, and monorepo-aware skill generation.
- **Where:** `claude/skills/repomix/SKILL.md`; `references/configuration.md` (config files, include/exclude patterns, output formats), `references/usage-patterns.md` (AI analysis workflows, security audit prep, docs generation); CLI: `repomix` command with flags (`--style`, `--include`, `--ignore`, `--remove-comments`, `--copy`, `--config`, `--token-count-tree`, `--skill-generate`, `--security-check`)
- **Mechanism notes:** Multi-output formats: XML (AI-optimized), Markdown, JSON, plain text; git-aware (respects .gitignore); token counting: pure-JavaScript tokenizer, parallelize pack pipeline; `--token-count-tree` visualizes token distribution hierarchically, `--token-count-tree 1000` sets minimum threshold; comment removal supports 18+ languages (HTML, CSS, JS, TS, Vue, Svelte, Python, PHP, Ruby, C, C#, Java, Go, Rust, Swift, Kotlin, Dart, Shell, YAML); Secretlint detects API keys, passwords, private keys, AWS secrets; `--skill-generate` includes dependency files under package/app dirs; Config via `repomix.config.json` or `.repomixignore`
- **Keywords:** "AI-friendly formatting", "token management", "context limits", "Secretlint", "security checks", "git-aware", "remote repos", "comment stripping", "monorepo-aware", "skill generation", "nested dependency", "token ceiling", "format compatibility"

---

## 16. research

- **What:** Comprehensive technical research with systematic information gathering, analysis, synthesis, and report generation. Supports Gemini CLI integration (fallback to WebSearch) and multi-source validation.
- **Where:** `claude/skills/research/SKILL.md`; research workflow references embedded; Gemini config from `.claude/.ck.json` or `~/.claude/.ck.json` (skills.research.useGemini boolean, gemini.model string)
- **Mechanism notes:** Four-phase process: (1) Scope Definition — identify key terms, recency, eval criteria, boundaries; (2) Systematic Gathering — Gemini toggle check (useGemini boolean), validate Gemini CLI (`command -v gemini`, timeout 15s ping), fallback to WebSearch; run Gemini with timeout 180s from `/tmp` to avoid GEMINI.md interception, check exit code for GaxiosError/RESOURCE_EXHAUSTED/MODEL_CAPACITY_EXHAUSTED/PERMISSION_DENIED/UNAUTHENTICATED, fall back to WebSearch on failure; max **5 researches** (5 tool calls) strictly; use ck:docs-seeker for GitHub repo deep-read; (3) Analysis & Synthesis — identify patterns, pros/cons, maturity, security, performance; (4) Report Generation — save to `Report:` path (from ## Naming section or ask main agent), include frontmatter timestamp, TOC, code blocks, diagrams (Mermaid/ASCII)
- **Keywords:** "Gemini CLI", "WebSearch fallback", "multi-source validation", "recency requirements", "video content research", "cross-reference validation", "consensus vs controversial", "five-research limit", "token efficiency", "docs-seeker integration", "no fabricated values"

---

## 17. retro

- **What:** Data-driven sprint retrospectives from git history. Generates metrics (commit frequency, test-to-code ratio, churn rate, active day ratio, plan completion) and health indicators from analyzed time periods.
- **Where:** `claude/skills/retro/SKILL.md`; `references/report-template.md` (markdown template for report output); CLI flags: timeframe (7d/2w/1m/sprint/YYYY-MM-DD:YYYY-MM-DD), --compare, --team, --format (html|md); output: `plans/reports/retro-{YYMMDD}-{slug}.md` or `.html`
- **Mechanism notes:** Six-step workflow: (1) Parse timeframe to --since date for git commands (7d = 7 days ago, sprint = ask user, range = both --since/--until); (2) Gather raw git metrics via bash: commits per day, LOC added/removed/net, file hotspots (top 10), commit type distribution (conventional commits), active authors, per-author count, days with activity, unique files changed, test file ratio; (3) Compute derived: commit frequency = total_commits / days_in_period, test-to-code ratio = test_file_changes / total_file_changes, churn = (LOC_added + LOC_removed) / max(LOC_net, 1), active day ratio = days_with_commits / days_in_period; (4) Scan plans/ for modified plan files in period, count [ ] vs [x]; (5) Generate report from template (never fabricate metrics, mark N/A when missing), add 3-5 specific recommendations based on findings; (6) HTML format optional (inline CSS, self-contained)
- **Keywords:** "data-driven metrics", "git log parsed", "commit frequency", "churn rate", "hotspot files", "conventional commits", "test ratio", "active day ratio", "plan completion", "comparison deltas" (--compare), "per-author breakdown" (--team), "N/A for missing data"

---

## 18. review-pr

- **What:** Review GitHub PRs for duplicate prior work, project standards, strategic necessity, correctness, security, breaking changes, code quality (anti-AI-slop patterns), and project-specific compliance. Supports --fix (convergence loop with fixes, conflict resolution, CI watching) and --reply (post review to GitHub).
- **Where:** `claude/skills/review-pr/SKILL.md`; `references/anti-ai-slop.md` (high-signal AI pollution patterns + taxonomy + stack-specific appendix), `references/project-rules-example.md` (worked example for Go/React/Tailwind); uses `ck:fix --auto` for blocking fixes, `ck:git cp` for commit/push/CI watch
- **Mechanism notes:** Three mandatory gates before verdict: (1) Duplicate/prior gate — search PRs/issues/git log with extracted terms, check for merged/open overlaps; (2) Standards gate — prefer CLAUDE.md/AGENTS.md/docs/code-standards.md/docs/system-architecture.md, generate baseline if missing (local only in review-only mode, commit if --fix and in scope); (3) Strategic necessity gate — review as owner/creator for clear value (user outcome, roadmap alignment, revenue, security, maintainer toil, reliability, compliance), mark **Important** if correct but unnecessary; Anti-slop: load full taxonomy when diff >300 lines OR ≥2 anti-slop flags OR >2 new utils/ files OR cannot confidently judge YAGNI vs slop; Risk levels: Low/Medium/High based on scope/complexity/breakage; Findings severity: **Critical** (bugs, security, data loss), **Important** (logic, missing validation, *structural* slop), **Suggestion** (style, *micro* slop); Verdict: Approve / Request changes / Comment
- **Keywords:** "Duplicate/prior gate", "Standards gate", "Strategic necessity", "anti-slop patterns", "structural vs micro slop", "dumping-ground dirs", "parallel reimpl", "premature abstraction", "Catch-and-swallow", "phantom coverage", "schema change without migration", "fork/no-write blocker", "merge conflict resolution", "External CI blocker", "convergence loop", "gh pr review"

---

## 19. scout

- **What:** Fast codebase scouting using parallel agents for file discovery and context gathering. Supports internal (Explore subagents) and external (Gemini/OpenCode CLI) scouting modes.
- **Where:** `claude/skills/scout/SKILL.md`; `references/internal-scouting.md` (Explore subagents), `references/external-scouting.md` (Gemini/OpenCode CLI), `references/task-management-scouting.md` (Claude Task patterns); Gemini config from `.claude/.ck.json`
- **Mechanism notes:** Four-step workflow: (1) Analyze task — parse user prompt for search targets, identify key dirs/patterns/file types/LOC scale, determine SCALE (subagent count); (2) Divide & conquer — split codebase per agent, no overlap; (3) Register scout tasks — TaskList first, skip if ≤2 agents (overhead exceeds benefit) or VSCode (no Task tools), `TaskCreate` per agent with scope metadata, `TaskUpdate` to in_progress before spawn; (4) Spawn parallel agents — load internal/external reference per decision tree, each subagent has <200K token context, spawn count depends on system resources; (5) Collect results — 3-minute timeout per agent, `TaskUpdate` completed (skip if Task tools unavailable), aggregate into report; note: "Invoke `/ck:project-organization` skill to organize the outputs"
- **Keywords:** "Divide and conquer", "parallel agents", "Task registration", "Explore subagents", "Gemini CLI fallback", "token context window", "system resources", "scout report", "unresolved questions"

---

## 20. security-scan

- **What:** Lightweight security scanner for secrets, dependencies, and OWASP vulnerability patterns. Uses Claude reasoning + shell tools; no external dependencies. Supports --secrets-only, --deps-only, --full flags.
- **Where:** `claude/skills/security-scan/SKILL.md`; `references/secret-patterns.md` (regex patterns for API keys, private keys, DB strings, passwords), `references/vulnerability-patterns.md` (SQL injection, XSS, command injection, path traversal, insecure randomness, eval patterns); output to `plans/reports/security-scan-{date}.md` in --auto mode
- **Mechanism notes:** Six-step workflow: (1) Detect project type (package.json → Node, requirements.txt/pyproject.toml → Python, go.mod → Go, Cargo.toml → Rust); (2) Secret scanning (always first) — Grep regex patterns (API keys, private keys, DB strings, hardcoded passwords), exclude .env.example/test fixtures/docs/node_modules/dist, verify real secret (not placeholder like `YOUR_API_KEY`), severity: CRITICAL (prod key exposed), HIGH (real credential), MEDIUM (possible credential); (3) Dependency audit — `npm audit --json` or `pip audit --format json`, parse by severity; (4) Code pattern analysis — Grep for dangerous patterns (SQL concat, innerHTML, exec/spawn, file path input, Math.random, eval/Function), read 5-10 line context, use Claude reasoning for true vs false positive; (5) .env exposure check — `git ls-files` for tracked .env, check .gitignore; (6) Generate report with summary table (Critical/High/Medium/Low counts) + findings + recommendations; policy: NEVER output actual secrets (redact to first 4 + last 2 chars), NEVER execute/commit secrets found, NEVER modify code automatically (report + suggest)
- **Keywords:** "Secretlint-like", "OWASP patterns", "severity rating", "regex matching", ".env tracking", "dependency audit", "code context", "false positive handling", "secret redaction", "immediate rotation recommendation"

---

## 21. sequential-thinking

- **What:** Structured problem-solving via step-by-step analysis with dynamic adjustment and revision capability. Supports branching, hypothesis-driven investigation, and adaptive planning for complex problems with emerging scope.
- **Where:** `claude/skills/sequential-thinking/SKILL.md`; `references/core-patterns.md` (revision/branching), `references/examples-api.md` (API design), `references/examples-debug.md` (debugging), `references/examples-architecture.md` (architecture), `references/advanced-techniques.md` (spiral refinement, hypothesis testing, convergence), `references/advanced-strategies.md` (uncertainty, revision cascades, meta-thinking); optional scripts: `scripts/process-thought.js` (validate/track), `scripts/format-thought.js` (display formatting)
- **Mechanism notes:** Seven-step process: (1) Loose estimate — start with `Thought 1/5`, adjust dynamically as understanding evolves; (2) Structure each thought — build on previous context, address one aspect, state assumptions/uncertainties/realizations, signal next thought focus; (3) Dynamic adjustment — Expand (complexity found → increase total), Contract (simpler → decrease total), Revise (new insight invalidates → mark revision), Branch (multiple approaches → explore alternatives); (4) Revision format — `Thought 5/8 [REVISION of Thought 2]: [Corrected understanding]` with original/why/impact lines; (5) Branching format — `Thought 4/7 [BRANCH A from Thought 2]: [Approach A]`, compare explicitly, converge with rationale; (6) Hypothesis/Verification — `[HYPOTHESIS]: [solution]`, `[VERIFICATION]: [test results]`, iterate until verified; (7) Complete only when ready — mark `Thought N/N [FINAL]` when solution verified/all critical aspects addressed/confidence achieved; two modes: Explicit (visible markers when complexity warrants), Implicit (internal for routine problems)
- **Keywords:** "dynamic adjustment", "Expand/Contract/Revise/Branch", "Thought numbering", "hypothesis-driven", "spiral refinement", "convergence", "meta-thinking", "uncertainty handling", "revision cascades", "branch comparison"

---

## 22. shader

- **What:** Write GLSL fragment shaders for procedural graphics. Topics: shapes (SDF), patterns, noise (Perlin/simplex/cellular), fBm (fractional Brownian motion), colors (HSB/RGB), matrices, gradients, animations. Use for generative art, textures, visual effects, WebGL, Three.js.
- **Where:** `claude/skills/shader/SKILL.md` (fundamentals + quick patterns); 11 reference files: `references/glsl-fundamentals-data-types-vectors-precision-coordinates.md`, `references/glsl-shaping-functions-step-smoothstep-curves-interpolation.md`, `references/glsl-colors-rgb-hsb-gradients-mixing-color-spaces.md`, `references/glsl-shapes-sdf-circles-rectangles-polar-distance-fields.md`, `references/glsl-shapes-polygon-star-polar-sdf-combinations.md`, `references/glsl-patterns-tiling-fract-matrices-transformations.md`, `references/glsl-pattern-symmetry-truchet-domain-warping.md`, `references/glsl-noise-random-perlin-simplex-cellular-voronoi.md`, `references/glsl-cellular-voronoi-worley-noise-patterns.md`, `references/glsl-fbm-fractional-brownian-motion-turbulence-octaves.md`, `references/glsl-procedural-textures-clouds-marble-wood-terrain.md`, `references/glsl-shader-builtin-functions-complete-api-reference.md`
- **Mechanism notes:** Fragment shaders execute **simultaneously on every pixel**; each thread receives pixel position via `gl_FragCoord`, returns color via `gl_FragColor` (vec4: RGBA 0.0-1.0), cannot communicate (stateless); standard uniforms: `uniform float u_time`, `uniform vec2 u_resolution`, `uniform vec2 u_mouse`; coordinate normalization: `vec2 st = gl_FragCoord.xy / u_resolution`; essential functions table (mix, step, smoothstep, fract, mod, clamp, length, distance, dot, normalize, atan, sin/cos/pow/abs); quick patterns provided: circle (distance + smoothstep), rectangle (step combinations), tiling (fract), animation (sin + u_time); tools: online editor (editor.thebookofshaders.com), glslViewer CLI, glslCanvas HTML embed, ShaderToy (iTime/iResolution/iMouse)
- **Keywords:** "GPU-accelerated", "SDF" (signed distance fields), "Perlin/simplex/cellular noise", "fBm", "stateless pixel threads", "normalized coordinates", "procedural textures", "generat art", "The Book of Shaders", "LYGIA library", "ShaderToy", "Three.js integration", "HSB color space"

---

## Summary

- **22/22 skills inventoried** with facts extracted from SKILL.md frontmatter and body content
- **No judgment applied** — mechanical facts only (What, Where, Mechanism, Keywords)
- **Distinctive mechanisms noted** — tool selection matrices, token counting, parallel agent dispatch, sandboxing, LaTeX-style compilation, git-aware filtering, etc.
- **Cross-references preserved** — noted `/ck:` skill references where one skill invokes another (e.g., media-processing → project-organization, scout → project-organization)
- **Reference structure captured** — identified reference file locations and purposes (implementation guides, pattern libraries, checklists, taxonomies)
- **CLI/config patterns noted** — identified configuration methods (.ck.json, .repomixignore, docs.json, etc.) and command-line flags distinctive to each skill

**Unresolved questions:** None at inventory stage — all files readable and parsed successfully.

---

**Report generated:** 2026-08-25  
**Scope:** All 22 skills in claudekit-engineer/claude/skills/ subdirectories (markdown-novel-viewer through shader)  
**Format:** Mechanical inventory only; no prioritization, assessment, or recommendations applied
