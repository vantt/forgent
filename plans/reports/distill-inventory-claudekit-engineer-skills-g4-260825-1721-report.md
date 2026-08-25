# Skill Inventory: claudekit-engineer Group 4

**Scope:** 21 skill directories (`_shared` through `xia`)  
**Date:** 2026-08-25  
**Coverage:** Full mechanical inventory (frontmatter + opening sections)

---

## _shared

**Status:** Infrastructure directory, not user-invocable

**What:** Shared code fragments and utilities used by other skills in the claudekit-engineer stack.

**Where:**
- `claude/skills/_shared/lib/plan-table-parser.cjs` — Plan parsing library (CommonJS module)
- `claude/skills/_shared/tests/plan-table-parser.test.cjs` — Unit tests
- `claude/skills/_shared/references/workflow-artifacts.md` — Workflow documentation

**Mechanism notes:** Vendored library for parsing work plans. Tests verify parsing correctness. Referenced by skills that need to introspect plan structure.

**Keywords:** shared fragments, plan parsing, library, utilities

---

## ship

**What:** Unified ship pipeline: merge target, test, review, journal, optional docs, commit, push, PR. Full automation except for test failures, critical review issues, or major version bumps.

**Where:**
- `claude/skills/ship/SKILL.md` — Core pipeline (Steps 1–12)
- `claude/skills/ship/references/ship-workflow.md` — Detailed step-by-step
- `claude/skills/ship/references/auto-detect.md` — Target and mode detection
- `claude/skills/ship/references/pr-template.md` — PR body structure

**Mechanism notes:** Mode detection infers from branch name or accepts explicit `official`/`beta`. Stops on test failure, critical review findings, or major/minor version bump questions. Uses subagent delegation (`tester`, `code-reviewer`, `journal-writer`, `docs-manager`). Background tasks for journal and docs prevent blocking.

**Keywords:** ship, pipeline, PR, merge, release, version bump, changelog, journal, docs update

---

## shopify

**What:** Build Shopify apps, extensions, themes with Shopify CLI, GraphQL Admin API, Polaris UI, Liquid, webhooks, billing.

**Where:**
- `claude/skills/shopify/SKILL.md` — Platform overview, CLI workflows, API guidance
- `claude/skills/shopify/references/app-development.md` — GraphQL Admin API, webhooks, billing, metafields
- `claude/skills/shopify/references/embedded-apps.md` — App Bridge v4, session tokens, OAuth
- `claude/skills/shopify/references/extensions.md` — UI extensions (Preact + web components), Shopify Functions
- `claude/skills/shopify/references/themes.md` — Liquid theme development
- `claude/skills/shopify/scripts/shopify_init.py` — Thin CLI wrapper

**Mechanism notes:** CLI-first workflow using official `@shopify/cli`. GraphQL Admin API is default for new apps (REST legacy-only post-2025-04-01). Checkout UI, Admin UI, POS UI, Customer Account, Theme App Extensions, and Shopify Functions extension points mapped. Liquid for theme templates.

**Keywords:** Shopify, CLI, GraphQL Admin API, Liquid, Polaris, extensions, themes, webhooks, billing

---

## show-off

**What:** Create self-contained HTML showcase pages with multi-language support, screenshots, optional publishing. Responsive design with parallax, theme toggle, project-local assets.

**Where:**
- `claude/skills/show-off/SKILL.md` — Core workflow (detailed instructions)
- `claude/skills/show-off/scripts/preferences.js` — Persistent workflow preferences (screenshots, publishing, language)
- `claude/skills/show-off/scripts/capture-sections.js` — Parallel screenshot capture script
- PREREQUISITE: `/ck:project-management` skill for plan/task lifecycle

**Mechanism notes:** Preference resolution before work (no screenshots/publish/language defaults). Preference helper persists to `~/.claude/show-off/preferences.json` (overridable via `SHOW_OFF_PREFS_PATH`). Screenshots via local Puppeteer script (with font/image/CSS readiness chain) OR fallback to `rws` CLI (ReviewWeb API). Publishing via `agentwiki` CLI if enabled. Responsive layout (16:9, 9:16, 1:1 ratios).

**Keywords:** showcase, demo, HTML, responsive, screenshots, publishing, bilingual, project-management integration

---

## skill-creator

**What:** Create or update Claude skills with eval-driven iteration. Includes templating, script/reference organization, eval testing, description optimization, benchmark scoring.

**Where:**
- `claude/skills/skill-creator/SKILL.md` — Core workflow (9-step creation process)
- `claude/skills/skill-creator/references/skill-anatomy-and-requirements.md` — Full anatomy
- `claude/skills/skill-creator/references/skill-creation-workflow.md` — Step-by-step process
- `claude/skills/skill-creator/references/eval-infrastructure-guide.md` — Test case structure, grading
- `claude/skills/skill-creator/agents/grader.md`, `agents/comparator.md`, `agents/analyzer.md` — Eval agent templates
- `claude/skills/skill-creator/references/eval-schemas.md` — JSON schema for test cases
- `claude/skills/skill-creator/scripts/init_skill.py` — Initialize from template
- `claude/skills/skill-creator/scripts/improve_description.py` — Single-pass description optimization
- `claude/skills/skill-creator/scripts/run_loop.py` — Iterative description tuning (5–15 iterations)
- `claude/skills/skill-creator/references/skillmark-benchmark-criteria.md` — Accuracy (80%) + Security (20%)

**Mechanism notes:** Parallel eval runs (with-skill vs baseline) to measure impact fairly. Composite scoring: accuracy × 0.80 + security × 0.20. Description optimization combats undertriggering with "pushy" keywords. Benchmark rules enforce explicit standard terminology, numbered steps, concrete examples. Security scope declarations and 6-category refusal policy mandatory.

**Keywords:** skill-creation, eval, iteration, description-optimization, benchmarking, security-scoring, component-library

---

## stitch

**What:** AI design generation via Google Stitch. Generate UI designs from text, export Tailwind/HTML/DESIGN.md, integrate into design-to-code pipeline.

**Where:**
- `claude/skills/stitch/SKILL.md` — API setup, actions, quota management
- `claude/skills/stitch/scripts/stitch-quota.ts` — Check/increment/reset daily quota
- `claude/skills/stitch/scripts/stitch-generate.ts` — Generate UI from prompt
- `claude/skills/stitch/scripts/stitch-export.ts` — Export as HTML/screenshot/DESIGN.md
- `claude/skills/stitch/references/stitch-sdk-api.md` — SDK API reference
- `claude/skills/stitch/references/stitch-mcp-setup.md` — MCP server integration
- `claude/skills/stitch/references/design-to-code-pipeline.md` — Handoff patterns
- `claude/skills/stitch/references/quota-management.md` — Credit strategy

**Mechanism notes:** Free tier: 400 credits/day + 15 redesign/day. Project isolation per git repo (auto-detect or `STITCH_PROJECT_ID` override). DESIGN.md takes precedence over text specs in implementation skills. Local quota tracking via `~/.claudekit/.stitch-quota.json`. Falls back to `/ck:ui-ux-pro-max` when exhausted.

**Keywords:** Stitch, AI-design, UI-generation, Tailwind export, design-to-code, quota-management, Google

---

## tanstack

**What:** Build full-stack React with TanStack Start (file-based routing, server functions), TanStack Form (headless validation), TanStack AI (streaming/chat).

**Where:**
- `claude/skills/tanstack/SKILL.md` — Framework overview, quick-start examples
- `claude/skills/tanstack/references/tanstack-start.md` — Router, file structure, middleware
- `claude/skills/tanstack/references/tanstack-form.md` — Form API, validators, SSR patterns
- `claude/skills/tanstack/references/tanstack-ai.md` — Streaming, adapters (OpenAI, Anthropic, Gemini, Ollama)

**Mechanism notes:** TanStack Start uses Nitro under the hood. Client-first philosophy with opt-in SSR. Full end-to-end type inference via `createServerFn`. Form validation via Zod/Valibot adapters. AI supports structured output with Zod. TypeScript-first, no RSC yet (planned).

**Keywords:** TanStack, full-stack, React, routing, forms, validation, AI-streaming, Nitro

---

## team

**What:** Orchestrate multiple independent Claude Code sessions (Agent Teams) for parallel research, implementation, review, or debug workflows. Each teammate has own context, communicates via task list and messages.

**Where:**
- `claude/skills/team/SKILL.md` — Agent Teams engine (4 templates: research, cook, review, debug)
- `claude/skills/team/references/team-coordination-rules.md` — Teammate behavior rules

**Mechanism notes:** Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json and CLI-only (disabled in VSCode extension). All teammates must use Opus 4.6. Templates include `--delegate` mode (lead coordinates, never touches code). Worktree isolation via `isolation: "worktree"` for cook devs prevents file conflicts. Pre-flight: must call `TeamCreate` first; if it errors, tell user Agent Teams is unavailable (no fallback to subagents).

**Keywords:** Agent-Teams, parallel-sessions, research, cook, review, debug, worktree-isolation, delegate-mode

---

## tech-graph

**What:** Generate production-quality SVG+PNG technical diagrams across 14 diagram types (architecture, data flow, sequence, agent memory, state machine, ER, class, use case, timeline, flowchart, network, mind map, comparison) in 8 visual styles.

**Where:**
- `claude/skills/tech-graph/SKILL.md` — 14 diagram types, 8 styles, layout rules
- `claude/skills/tech-graph/scripts/generate-diagram.sh` — Validate SVG + export PNG
- `claude/skills/tech-graph/scripts/generate-from-template.py` — Create SVG from JSON template
- `claude/skills/tech-graph/scripts/validate-svg.sh` — XML syntax + marker validation
- `claude/skills/tech-graph/scripts/test-all-styles.sh` — Batch test all 8 styles
- `claude/skills/tech-graph/references/style-1-flat-icon.md` (through style-8-dark-luxury.md) — Per-style color tokens, SVG patterns
- `claude/skills/tech-graph/references/icons.md` — Icon library (known products)
- `claude/skills/tech-graph/references/style-diagram-matrix.md` — Style × diagram-type recommendations

**Mechanism notes:** Vendored from upstream `fireworks-tech-graph` (yizhiyanhua-ai, MIT). System dependency `librsvg` (rsvg-convert binary) auto-installed. Workflow: classify → extract structure → plan layout → load style reference → map shapes → write SVG (Python list method mandatory) → validate → export PNG → optional visual self-review. Arrow semantics (data, control, memory, async, embedding, feedback). Layout grid snapping, jump-over arcs for crossings, label offset-first positioning.

**Keywords:** diagrams, SVG, PNG, architecture, flowchart, sequence, UML, agent-memory, visualization

---

## test

**What:** Run unit, integration, e2e, UI tests. Coverage analysis, build verification, visual regression, QA reports.

**Where:**
- `claude/skills/test/SKILL.md` — Core testing workflows
- `claude/skills/test/references/test-execution-workflow.md` — Unit/integration/e2e execution
- `claude/skills/test/references/ui-testing-workflow.md` — Browser automation, responsive, accessibility
- `claude/skills/test/references/report-format.md` — Structured QA report template

**Mechanism notes:** Never ignores failing tests. Supports JS/TS (Jest/Vitest/Mocha), Python (pytest), Go, Rust, Flutter. Browser testing via `ck:agent-browser`, `ck:web-testing`, `ck:chrome-profile`, or project-native Playwright/Vitest/k6. Team mode: claims assigned task via `TaskUpdate`, waits for blocking tasks, respects file ownership.

**Keywords:** testing, unit, integration, e2e, UI, coverage, visual-regression, QA, reports

---

## threejs

**What:** Build 3D web experiences with Three.js. WebGL/WebGPU scenes, GLTF models, animations, physics, VR/XR. Searchable examples (556 indexed) + API reference.

**Where:**
- `claude/skills/threejs/SKILL.md` — Overview, search CLI, example categories
- `claude/skills/threejs/scripts/search.py` — Find examples by query, domain, category, complexity
- `claude/skills/threejs/references/00-fundamentals.md` through `18-geometry.md` — 19 progressive reference files (L1: fundamentals, L5: specialized/WebGPU)

**Mechanism notes:** Python search script indexes 556 examples across 13 categories (WebGL 216, WebGPU 190, WebGL Advanced 48, Postprocessing 27, WebXR 26, Physics 13, etc.). Domain filtering: examples, api, use-cases, categories. Complexity filtering: beginner/intermediate/advanced. Reference files organized by learning level (L1–L5). Vendor note: no `npx skills add` — installation via CK Engineer stack only.

**Keywords:** Three.js, 3D, WebGL, WebGPU, GLTF, physics, VR, XR, particle-effects, shaders

---

## ui-styling

**What:** Style UIs with shadcn/ui (Radix UI + Tailwind CSS). Accessible components, themes, dark mode, responsive layouts, design systems, color customization.

**Where:**
- `claude/skills/ui-styling/SKILL.md` — Component library, theming, accessibility, Tailwind utilities
- `claude/skills/ui-styling/references/shadcn-components.md` — Complete component catalog
- `claude/skills/ui-styling/references/shadcn-theming.md` — Theming, dark mode, customization
- `claude/skills/ui-styling/references/shadcn-accessibility.md` — ARIA patterns, keyboard nav
- `claude/skills/ui-styling/references/tailwind-utilities.md` — Core utility classes
- `claude/skills/ui-styling/references/tailwind-responsive.md` — Responsive design, breakpoints
- `claude/skills/ui-styling/references/tailwind-customization.md` — Config, custom utilities, @theme directive
- `claude/skills/ui-styling/references/canvas-design-system.md` — Visual design philosophy
- `claude/skills/ui-styling/scripts/shadcn_add.py` — Component installation automation
- `claude/skills/ui-styling/scripts/tailwind_config_gen.py` — Config generation

**Mechanism notes:** shadcn/ui copy-paste distribution model (components in user's codebase, not node_modules). Radix UI primitives for accessibility. Tailwind utility-first CSS with build-time processing. Canvas layer for museum-quality visual compositions. Dark mode via next-themes. Semantic color tokens replace raw hex.

**Keywords:** shadcn/ui, Radix, Tailwind, accessible-components, dark-mode, design-system, responsive

---

## ui-ux-pro-max

**What:** UI/UX design intelligence: 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, 25 chart types across 10 stacks. Searchable with priority-based recommendations.

**Where:**
- `claude/skills/ui-ux-pro-max/SKILL.md` — 10 priority categories (accessibility, touch, performance, style, layout, typography, animation, forms, navigation, charts)
- `claude/skills/ui-ux-pro-max/scripts/search.py` — Design system search (product type, style, color, typography, landing, chart, ux, google-fonts, react, web, prompt)
- `claude/skills/ui-ux-pro-max/scripts/search.py --design-system` — Comprehensive system generation

**Mechanism notes:** Priority-driven checklist: CRITICAL (accessibility, touch), HIGH (performance, style, layout, nav), MEDIUM (typography, animation, forms), LOW (charts). Design system generation via `--design-system` flag produces: pattern, style, colors, typography, effects, anti-patterns. `--persist` creates MASTER.md + page-specific overrides. Stack-specific guidance for React Native (app UI), Web (desktop). Pre-delivery checklist for visual quality, interaction, light/dark mode, layout.

**Keywords:** UI/UX, design-intelligence, color-palettes, typography, design-system, accessibility, responsive-design, animation, dark-mode

---

## use-mcp

**What:** Discover and execute MCP server tools. Two paths: Gemini CLI (LLM-driven, all tasks) or direct scripts (deterministic, specific tools).

**Where:**
- `claude/skills/use-mcp/SKILL.md` — Execution paths, Gemini vs direct scripts
- `claude/skills/use-mcp/scripts/mcp-client.ts` — MCPClientManager (config loader, multi-server stdio connector)
- `claude/skills/use-mcp/scripts/cli.ts` — CLI entry (list-tools, list-prompts, list-resources, call-tool)
- `claude/skills/use-mcp/scripts/smoke-test.sh` — End-to-end smoke test
- `claude/skills/use-mcp/assets/tools.json` — Persisted tool catalog
- `claude/skills/use-mcp/references/configuration.md` — .mcp.json schema, env lookup
- `claude/skills/use-mcp/references/gemini-cli-integration.md` — Gemini setup, error markers, model guidance
- `claude/skills/use-mcp/references/mcp-protocol.md` — JSON-RPC, transports (stdio, HTTP+SSE)

**Mechanism notes:** Path 1 (Gemini): stdin piping mandatory (avoids MCP init headless bugs). GEMINI.md at project root enforces JSON response format. Fallback to Path 2 on Gemini failure (exit code != 0 or error markers). Path 2 (direct scripts): deterministic, uses `@modelcontextprotocol/sdk`. Tools persisted to `assets/tools.json` for LLM-driven selection without live MCP connection. 120s global timeout (env: `MCP_TIMEOUT`).

**Keywords:** MCP, tools, Gemini-CLI, direct-scripts, tool-discovery, stdio, JSON-RPC, gemini.model

---

## vibe

**What:** Full vibe pipeline: GitHub issue → plan → implement (cook/fix) → code-review → ship PR → optional merge + CI watch.

**Where:**
- `claude/skills/vibe/SKILL.md` — 10-step pipeline, GitHub issue body template
- Uses subskills: `/ck:worktree`, `/ck:plan`, `/ck:cook` or `/ck:fix`, `/ck:code-review`, `/ck:ship`, `/ck:review-pr`

**Mechanism notes:** Mode detection: `--ship` enables merge; `--beta` targets dev branch. Route detection: bugfix for errors/regressions, feature for new capability. Reuses existing clean worktrees/plans when available. Labels: `ready to cook`, `in progress`, `ready to ship stable`/`ready to ship beta`. Post-merge CI watch with auto-fix on deterministic failures (max 3 attempts).

**Keywords:** vibe, pipeline, GitHub-issue, worktree, plan, cook, fix, ship, PR, merge, CI-convergence

---

## watzup

**What:** Generate short handoff reports from Git branches, worktrees, unfinished plans, roadmap docs. Priority-ranked next steps with checkbox progress.

**Where:**
- `claude/skills/watzup/SKILL.md` — Required scan, priority ranking, report format
- `claude/skills/watzup/scripts/watzup-scan.cjs` — Scanner (JSON output, optional --fetch)

**Mechanism notes:** Scanner scores plans by status (in-progress +400, in-review +300, pending +150), workspace alignment (current worktree +600, current branch +400), source (+80 filesystem, +40 local ref), momentum (40–90% done bumped). Fallback to minimal git commands if scanner fails. Does not mutate branches or checkout.

**Keywords:** wrap-up, handoff, status, progress, branches, worktrees, plans, roadmap, next-steps

---

## web-design-guidelines

**What:** Review UI code for Web Interface Guidelines compliance. Accessibility and UX guideline audits.

**Where:**
- `claude/skills/web-design-guidelines/SKILL.md` — Review workflow
- Guidelines fetched from: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

**Mechanism notes:** Fetches latest guidelines before each review (WebFetch). Applies all rules from fetched content. Outputs terse `file:line` format per guideline instructions. No local reference files — fresh fetch every time ensures up-to-date rules.

**Keywords:** web-guidelines, accessibility, UX-audit, Vercel, compliance-review

---

## web-frameworks

**What:** Build modern full-stack web with Next.js (App Router, RSC, SSR, ISR), Turborepo monorepos, RemixIcon (3,100+ icons).

**Where:**
- `claude/skills/web-frameworks/SKILL.md` — Framework overview, setup, patterns
- `claude/skills/web-frameworks/references/nextjs-app-router.md` — Routing, layouts, parallel routes
- `claude/skills/web-frameworks/references/nextjs-server-components.md` — RSC patterns, streaming
- `claude/skills/web-frameworks/references/nextjs-data-fetching.md` — fetch API, caching, revalidation
- `claude/skills/web-frameworks/references/nextjs-optimization.md` — Images, fonts, scripts, PPR
- `claude/skills/web-frameworks/references/turborepo-setup.md` — Workspace config
- `claude/skills/web-frameworks/references/turborepo-pipelines.md` — Task dependencies, parallel execution
- `claude/skills/web-frameworks/references/turborepo-caching.md` — Local/remote cache strategies
- `claude/skills/web-frameworks/references/remix-icon-integration.md` — 3,100+ icons (webfont + React component)

**Mechanism notes:** Next.js App Router with file-based routing and Server Components by default. Turborepo for monorepo task orchestration with intelligent caching. RemixIcon provides webfont (HTML/CSS) or React components. Monorepo structure: apps/, packages/, turbo.json pipeline config.

**Keywords:** Next.js, App-Router, RSC, Turborepo, monorepo, RemixIcon, SSR, ISR, caching

---

## web-testing

**What:** Web testing: unit (Vitest), integration, E2E (Playwright), load (k6), accessibility (axe-core), performance (Lighthouse).

**Where:**
- `claude/skills/web-testing/SKILL.md` — Testing strategies, quick-start commands
- `claude/skills/web-testing/references/testing-pyramid-strategy.md` — Pyramid vs Trophy vs Honeycomb
- `claude/skills/web-testing/references/unit-integration-testing.md` — Vitest, AAA pattern
- `claude/skills/web-testing/references/e2e-testing-playwright.md` — Fixtures, sharding, selectors
- `claude/skills/web-testing/references/playwright-component-testing.md` — Component test patterns
- `claude/skills/web-testing/references/mobile-gesture-testing.md` — Touch, swipe, orientation
- `claude/skills/web-testing/references/performance-core-web-vitals.md` — LCP/CLS/INP, Lighthouse CI
- `claude/skills/web-testing/references/visual-regression.md` — Screenshot comparison
- `claude/skills/web-testing/references/test-flakiness-mitigation.md` — Stability strategies
- `claude/skills/web-testing/references/accessibility-testing.md` — WCAG, axe-core
- `claude/skills/web-testing/scripts/init-playwright.js` — Project setup
- `claude/skills/web-testing/scripts/analyze-test-results.js` — Result aggregation

**Mechanism notes:** Testing pyramid strategy (Unit 70% > Integration 20% > E2E 10%). Playwright for E2E/CT with fixtures and sharding. k6 for load testing. Vitest for unit/component tests in browser mode. Visual regression via screenshot comparison. Accessibility via axe-core. Performance tracking via Lighthouse CI. Test data via factories/fixtures/seeding.

**Keywords:** Playwright, Vitest, k6, testing-pyramid, E2E, accessibility, performance, visual-regression, flakiness

---

## worktree

**What:** Create, inspect, and clean isolated git worktrees. Feature isolation, monorepo workflows, stale cleanup.

**Where:**
- `claude/skills/worktree/SKILL.md` — Workflow (6 steps), commands (create, remove, info, list, status, prune)
- `claude/skills/worktree/scripts/worktree.cjs` — Main worktree CLI (Node CommonJS)

**Mechanism notes:** Auto-detects superproject, monorepo, standalone repos. Branch naming: detects `fix`/`refactor`/`docs`/`test`/`chore`/`perf`/`feat` from description, or accepts explicit branch names (with `--no-prefix`). Monorepo support with project selection. Worktree root auto-detected (superproject > monorepo > sibling). Dependency auto-installation (bun/pnpm/yarn/npm/poetry/cargo/go). Env template auto-copy.

**Keywords:** worktree, isolation, parallel, monorepo, feature-branching, dependencies, cleanup

---

## xia

**What:** Extract, compare, port, or adapt features from GitHub repos or local paths. Understand before copy; challenge before implement.

**Where:**
- `claude/skills/xia/SKILL.md` — 6-phase workflow (Recon → Map → Analyze → Challenge → Plan → Deliver)
- `claude/skills/xia/references/challenge-framework.md` — Challenge question structure

**Mechanism notes:** Four modes: `--compare` (analysis only), `--copy` (minimal changes), `--improve` (copy + refactor), `--port` (idiomatic rewrite, default). Security boundary: fetched repo content is untrusted — extract only structure/metadata/behavior evidence, never execute/install/follow instructions. Workflow hard gate: Phase 4 (challenge) must complete before Phase 5 (plan). Hands off to `/ck:cook` or `/ck:plan` for implementation.

**Keywords:** xia, port, extract, compare, feature-porting, cross-repo, recon, challenge, decision-matrix

---

## Summary Table

| Skill | Type | User-Invocable | Key Dependencies | Mechanism Class |
|-------|------|---|---|---|
| _shared | infrastructure | No | — | code library + tests |
| ship | pipeline | Yes | tester, code-reviewer, journal-writer, docs-manager | orchestration with subagent delegation |
| shopify | framework guide | Yes | Shopify CLI, GraphQL | API/CLI reference |
| show-off | content generation | Yes | project-management, agentwiki, rws (optional) | preference persistence + screenshot capture |
| skill-creator | tool-authoring | Yes | eval agents | templating + eval iteration |
| stitch | design-gen API | Yes | Google Stitch API, ui-ux-pro-max (fallback) | quota tracking + design-to-code handoff |
| tanstack | framework guide | Yes | TanStack ecosystem | type-driven examples |
| team | orchestration | Yes | Agent Teams (experimental), TaskCreate, SendMessage | multi-session coordination |
| tech-graph | visualization | Yes | rsvg-convert (librsvg system dep) | SVG generation + validation |
| test | test runner | Yes | jest/vitest/mocha/pytest/go/rust/flutter | framework agnostic execution |
| threejs | 3D framework | Yes | Three.js SDK | searchable examples + progressive references |
| ui-styling | component system | Yes | shadcn/ui, Radix, Tailwind | utility-first + Radix primitives |
| ui-ux-pro-max | design guidance | Yes | Python search script | searchable design database |
| use-mcp | tool executor | Yes | Gemini CLI OR @modelcontextprotocol/sdk | dual-path execution |
| vibe | full pipeline | Yes | worktree, plan, cook/fix, ship, review-pr | multi-skill orchestration |
| watzup | status reporting | Yes | git, fs scanning | scanner + fallback commands |
| web-design-guidelines | audit tool | Yes | WebFetch (live guidelines) | external guideline fetch |
| web-frameworks | framework guide | Yes | Next.js, Turborepo, RemixIcon | full-stack monorepo patterns |
| web-testing | test framework | Yes | Playwright, Vitest, k6, axe-core | test-type router |
| worktree | git tool | Yes | git, package managers (bun/pnpm/yarn/npm/poetry/cargo/go) | auto-detection + dependency install |
| xia | feature porting | Yes | repomix, researcher, planner, cook | multi-phase recon + challenge gate |

---

## Notes on Mechanisms

**Distinctive patterns across group:**

1. **Subagent delegation** (ship, team, vibe): Orchestrate other skills asynchronously to reduce token overhead in primary flow.

2. **Preference/configuration persistence** (show-off, ui-ux-pro-max, stitch): Local state in `~/.claude/` or project root controls runtime behavior across sessions.

3. **Python search scripts** (threejs, ui-ux-pro-max): Indexable databases enable fast, structured queries without live LLM integration.

4. **External API integration** (stitch, use-mcp, web-design-guidelines): Live API/service calls (Google Stitch, MCP servers, Vercel guidelines) with fallback/graceful degradation.

5. **Multi-phase workflows** (xia, vibe, team, tech-graph): Hard gates between phases prevent planning without evidence or implementation without challenge.

6. **Auto-detection strategies** (worktree, vibe, team): Infer missing context from repo state (monorepo structure, branch naming, plan existence) without asking.

7. **Infrastructure skills** (_shared, use-mcp scripts): Library code and utilities that other skills depend on; not directly user-invoked.

**Vocabulary highlights:**

- Composite scoring (watzup priority ranking)
- Security boundary (xia untrusted content handling)
- Hard gate (xia phase ordering, tech-graph arrow routing)
- Readiness chain (show-off screenshot capture sequence)
- Token efficiency (subagent delegation, cached tool catalog)
- Stack-aware (ui-ux-pro-max, web-frameworks, web-testing per-technology references)

---

## Unresolved Questions

None — full inventory complete with mechanism notes.

**Status: 21/21 skills covered fully**
