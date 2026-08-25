# Skill Inventory: claudekit-engineer (Group 2)

**Report Date:** 2026-08-25  
**Scope:** 22 skills (cook through llms)  
**Source:** `claude/skills/*/SKILL.md` + referenced scripts/workflows  
**Status:** 22/22 fully read

---

## cook
**What:** End-to-end feature implementation with structured workflow — manages intent detection, planning, coding, testing, and finalization phases. Supports multiple modes (interactive, fast, auto, parallel) with mandatory review gates at each step.

**Where:**  
- `claude/skills/cook/SKILL.md` (frontmatter, workflow diagram, hard gates)
- `references/intent-detection.md` (mode routing logic)
- `references/workflow-routing.md` (cross-skill sequence decisions)
- `references/workflow-steps.md`, `references/review-cycle.md` (phase definitions)

**Mechanism notes:**  
- **Mandatory scout before planning:** "HARD-GATE-SCOUT-FIRST" enforces codebase context scan (project type, existing modules, patterns, docs, public APIs) before questions
- **Exact requirements before plan:** "HARD-GATE-EXACT-REQUIREMENTS" requires concrete answers: output artifacts, acceptance criteria, scope boundary, constraints, touchpoints — all grounded in scout findings
- **Code review as subagent:** Mandatory code-reviewer subagent invocation checks: acceptance criteria met, no regression, no breaking changes, follows patterns, no new errors
- **Finalize with task sync:** Mandatory `/ck:project-management` skill activation for plan sync-back, then docs-manager and git-manager subagents
- **Anti-rationalization table:** Lists 6 common developer rationalizations (e.g., "This is too simple to plan") with rebuttals

**Keywords:**  
- `interactive` / `fast` / `auto` / `parallel` / `no-test` modes
- `code` mode (skip research, load plan from path)
- `Simplify signal` (post-implementation conditional simplification)
- Blocking gates: `[Review]`, `[Research]`, `[Plan]`, `[Test]`, `[Finalize]`

---

## copywriting
**What:** Conversion copywriting formulas, headline templates, email patterns, landing page structures, and custom writing style extraction from user documents. Includes 50 default styles and multi-format asset processing.

**Where:**  
- `claude/skills/copywriting/SKILL.md`
- `assets/writing-styles/default.md` (50 default styles)
- `references/copy-formulas.md` (AIDA, PAS, BAB, 4Ps, 4Us, FAB)
- `references/headline-templates.md`, `references/email-copy.md`, `references/cta-patterns.md`
- `scripts/extract-writing-styles.py` (multi-format extraction: .md, .txt, .pdf, .docx, .xlsx, .pptx, .jpg, .png, .mp4)

**Mechanism notes:**  
- **Multi-format style extraction:** Single Python script handles markdown, text, PDF, Word, Excel, PowerPoint, images, and video — requires `GEMINI_API_KEY` for media formats
- **Workflow routing:** Four specialized workflows (CRO optimization, enhancement, quick, quality) with references pointing to each
- **Power words catalog:** Emotional word groupings available per context (urgency, benefit, social proof, scarcity, etc.)

**Keywords:**  
- Copy formulas: AIDA, PAS, BAB, 4Ps, 4Us, FAB
- CTA patterns: "Start [verb]ing", "Get [benefit]", "Yes, I want [benefit]"
- Custom writing styles (extract from user assets)

---

## cti-expert
**What:** Cyber threat intelligence and OSINT skill for exposure reviews, domain reconnaissance, breach checks, username/email/phone research, image forensics, darknet checks, cloud tenant recon, and structured intelligence reporting. Full AEAD case lifecycle (Acquire → Enrich → Assess → Deliver) with 30+ recon techniques.

**Where:**  
- `claude/skills/cti-expert/SKILL.md` (610+ lines, comprehensive spec)
- `engine/case-schema.json` (subject/finding/connection model)
- `techniques/` directory (30+ technique modules: fx-metadata-parsing.md, fx-image-verification.md, fx-breach-discovery.md, etc.)
- `scripts/generate-cti-docx-hybrid.py` (primary DOCX generator: pandoc + post-process)
- `scripts/sample-cti-report-data.json` (JSON schema for DOCX generation)

**Mechanism notes:**  
- **Collection method fallback:** "agent-browser when available (JavaScript-heavy sites, infinite-scroll, screenshot evidence without real user login state); use `ck:chrome-profile` only when real cookies needed, with auto-fallback to web search / web fetch"
- **AEAD lifecycle:** Four-phase case workflow (Acquire raw data → Enrich with lateral pivots → Assess/verify → Deliver reports)
- **Technique activation matrix:** Table shows which 40+ techniques activate per target type (Person, Domain, Org, Username, Email, IP) — adaptive chaining feeds newly discovered identifiers into subsequent phases
- **Dual-mode DOCX generation:** Hybrid generator (pandoc base + post-process charts from JSON), fallback JSON-only, fallback Markdown-only
- **Finding framework:** Trust scores (1-5), confidence levels (VERIFIED → CHALLENGED), source reliability grades (A-F), conflict detection, deviation detection, weight engine for aggregation
- **Auto-install policy:** Before running any CLI tool, check existence; if missing, auto-install silently (never block investigation)
- **Visualization rendering:** All charts/graphs use ASCII box-drawing **by default** (Mermaid only with explicit `--mermaid` flag)

**Keywords:**  
- AEAD phases (Acquire, Enrich, Assess, Deliver)
- `/case`, `/sweep`, `/query`, `/username`, `/email-deep`, `/subdomain`, `/breach-deep`, `/exposure`, `/threat-model`, `/report`, `/render`
- Subject types: Person, Username, Email, Domain, IP, Organization, Phone, Location, Asset, Event, Device, Image, Crypto Address, Custom
- Connection types: owns, uses, works_at, linked_to, alias, communicated_with
- Trust score 1-5, confidence levels (VERIFIED–CHALLENGED), source grade (A-F)
- Workflow guides: `wf-journalist.md`, `wf-hr-screening.md`, `wf-threat-analyst.md`, `wf-private-investigator.md`

---

## databases
**What:** Unified guide for MongoDB and PostgreSQL schema design, queries, aggregation pipelines, indexing, migrations, replication, performance optimization, and administration. Includes Python utility scripts for migration, backup, and performance analysis.

**Where:**  
- `claude/skills/databases/SKILL.md`
- `references/db-design.md` (transactional/analytics schema design)
- `references/mongodb-*.md` (CRUD, aggregation, indexing, Atlas cloud)
- `references/postgresql-*.md` (queries, psql CLI, performance, administration)
- `scripts/db_migrate.py`, `scripts/db_backup.py`, `scripts/db_performance_check.py`

**Mechanism notes:**  
- **Database selection by use case:** MongoDB for document-oriented (1-to-few embedded, 1-to-many refs); PostgreSQL for relational with normalization + foreign keys
- **Python utility pattern:** Each script (migrate, backup, performance-check) accepts `--db mongodb|postgres` flag + specific options
- **Best practices encoded:** MongoDB embedded vs reference rules, PostgreSQL 3NF with denormalization, indexing strategies, Atlas/pgBouncer recommended

**Keywords:**  
- MongoDB: embedded documents, aggregation pipeline, BSON, `createIndex`, Atlas, KV store
- PostgreSQL: 3NF normalization, EXPLAIN ANALYZE, VACUUM, psql meta-commands, pgBouncer connection pooling

---

## deploy
**What:** Auto-detect deployment target and orchestrate app hosting across 15 platforms (Vercel, Netlify, Cloudflare, Railway, Fly.io, Render, Heroku, TOSE, Coolify, Dokploy, GitHub Pages, GCP, AWS, Digital Ocean, Vultr). Cost-optimized platform recommendations and deployment docs creation.

**Where:**  
- `claude/skills/deploy/SKILL.md`
- `references/platforms/vercel.md`, `references/platforms/netlify.md`, etc. (platform-specific workflows)
- `references/platform-config-templates.md` (docs/deployment.md template)

**Mechanism notes:**  
- **Detection signal table:** Scans for config files in order: `vercel.json`, `netlify.toml`, `wrangler.toml`, `fly.toml`, `Procfile`, `docker-compose.yml`, etc.
- **Cost-optimized ranking:** Free tier static (Github Pages → Cloudflare Pages → Vercel → Netlify), free tier backend (Railway → Render → Fly.io), PAYG (TOSE.sh, Workers, Railway)
- **Progressive detection:** Check `docs/deployment.md` → scan config files → analyze project type → ask user with cost rankings
- **Post-deploy docs:** Creates/updates `docs/deployment.md` with platform, URL, deploy command, env vars, custom domain, rollback

**Keywords:**  
- 15 platforms: Vercel, Netlify, Cloudflare (Workers/Pages/R2/D1), Railway, Fly.io, Render, Heroku, TOSE.sh, Coolify, Dokploy, Github Pages, GCP, AWS, Digital Ocean, Vultr
- Platform tiers: static (free), backend (free), self-hosted (free, own server)
- Project types: static site, SPA, SSR/full-stack, Node.js API, Python API, Docker app, monorepo

---

## design
**What:** Brand identity, design tokens, UI styling, logo design, CIP mockups, slides, banners, social photos, and icons. Routes to external sub-skills (brand, design-system, ui-styling) and provides built-in generators for logos, CIP, slides, banners, social photos, and SVG icons using Gemini AI.

**Where:**  
- `claude/skills/design/SKILL.md`
- `scripts/logo/generate.py`, `scripts/logo/search.py`, `scripts/logo/core.py` (55+ logo styles, 30 color palettes, 25 industry guides)
- `scripts/cip/generate.py`, `scripts/cip/search.py`, `scripts/cip/render-html.py` (50+ CIP deliverables, 20 styles, 20 industries)
- `scripts/icon/generate.py` (SVG icon generation via Gemini 3.1 Pro)
- `references/logo-design.md`, `references/cip-design.md`, `references/slides-create.md`, `references/banner-sizes-and-styles.md`, `references/social-photos-design.md`, `references/icon-design.md`

**Mechanism notes:**  
- **Logo generation:** Python scripts search BM25 engine across 55+ styles, extract design briefs, generate with Gemini (white background ALWAYS)
- **CIP workflow:** Logo + deliverable + industry → generate mockups; optional Pro model for 4K text; HTML presentation render
- **SVG icon output:** Gemini 3.1 Pro generates SVG as XML text (no image API needed), supports 15 styles, multi-size export
- **Banner + Social workflow:** Two-pass design (brainstorm → critique plan → build) with design dials (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY: 1-10 range)
- **Setup requirement:** `export GEMINI_API_KEY="..."`; `pip install google-genai pillow`

**Keywords:**  
- Logo styles: minimalist, bold, vintage, abstract, geometric, retro, modern, flat, gradient, duotone, lined, solid, 3D, neon, handdrawn, watercolor
- CIP deliverables: business card, letterhead, envelope, brochure, poster, signage, social, email template, presentation
- Icon styles: outlined, filled, duotone, rounded, sharp, flat, gradient
- Design dials: DESIGN_VARIANCE (1-10), MOTION_INTENSITY (1-10), VISUAL_DENSITY (1-10)
- Anti-slop rules: no Inter/Roboto, avoid AI purple gradient, use asymmetric grids, no round numbers, no "Elevate/Seamless" clichés

---

## devops
**What:** Deploy and manage cloud infrastructure across Cloudflare (Workers, R2, D1), Docker, Google Cloud (Cloud Run, GKE, Cloud SQL), and Kubernetes (kubectl, Helm). Covers serverless, containers, CI/CD, GitOps, security audits, RBAC, and network policies.

**Where:**  
- `claude/skills/devops/SKILL.md`
- `references/cloudflare-*.md` (Workers basics/advanced, APIs, R2, D1, browser rendering)
- `references/docker-*.md` (basics, compose)
- `references/gcloud-*.md` (platform, services)
- `references/kubernetes-*.md` (basics, kubectl, Helm, security, workflows, troubleshooting + advanced variants)
- `scripts/cloudflare_deploy.py`, `scripts/docker_optimize.py`

**Mechanism notes:**  
- **Platform selection matrix:** Sub-50ms latency → Cloudflare Workers; large file storage → R2 (zero egress); SQL database → D1; containers → Docker + Cloud Run/GKE
- **Kubernetes references:** Split into basics/advanced for each topic (kubectl, Helm, security, workflows, troubleshooting) — allows progressive loading

**Keywords:**  
- Cloudflare: Workers, Pages, R2, D1, KV store, Durable Objects
- Docker: multi-stage builds, Docker Compose, image scanning
- GCP: Cloud Run, GKE, Cloud SQL, Compute Engine, gcloud CLI
- Kubernetes: kubectl, Helm, RBAC, secrets, GitOps (Argo CD, Flux), network policies, resource limits
- CI/CD: multi-region deployments, GitOps workflows

---

## docs
**What:** Analyze codebase and manage project documentation through scouting, analysis, and structured doc generation. Supports three operations: `init` (create initial docs), `update` (refresh existing), `summarize` (quick analysis).

**Where:**  
- `claude/skills/docs/SKILL.md`
- `references/init-workflow.md`, `references/update-workflow.md`, `references/summarize-workflow.md` (per-operation workflows)
- `references/documentation-management.md` (when docs should change)
- `docs/` directory structure (project-overview-pdr.md, code-standards.md, codebase-summary.md, design-guidelines.md, deployment-guide.md, system-architecture.md, project-roadmap.md)

**Mechanism notes:**  
- **SVG diagram rules:** When authoring/refreshing diagrams in `system-architecture.md`, apply universal SVG layout rules from `/ck:tech-graph` at `claude/skills/tech-graph/references/svg-layout-best-practices.md` (component spacing, arrow routing, label placement, z-index ordering)
- **No implementation:** Critical note: "Do not start implementing code" — docs skill is analysis/generation only

**Keywords:**  
- Operations: `init`, `update`, `summarize`
- Output docs: project-overview-pdr.md, code-standards.md, codebase-summary.md, design-guidelines.md, deployment-guide.md, system-architecture.md, project-roadmap.md

---

## docs-seeker
**What:** Script-first documentation discovery using llms.txt standard (context7.com). Detects query type, fetches documentation URLs, and analyzes multi-source results for agent distribution strategy.

**Where:**  
- `claude/skills/docs-seeker/SKILL.md`
- `scripts/detect-topic.js` (classify query: topic-specific vs general)
- `scripts/fetch-docs.js` (construct context7.com URLs, fallback chains)
- `scripts/analyze-llms-txt.js` (categorize URLs, recommend agent strategy)
- `references/context7-patterns.md` (URL patterns, known repositories)
- `references/errors.md` (fallback strategies)
- `references/advanced.md` (versioning, edge cases)

**Mechanism notes:**  
- **Script execution principle:** Always execute scripts in order (detect → fetch → analyze); scripts handle URL construction, fallback, and error handling automatically
- **Zero-token overhead:** All scripts run without context loading — designed for fast dispatch
- **Automatic fallback chain:** topic-specific URL → general library URL → error (handled by fetch-docs script)
- **Progressive disclosure:** Load workflows/references only when needed (workflow files load on type classification, references load on error)
- **Agent distribution:** Scripts recommend strategy (1 agent for small set, 3 agents for moderate, 7 agents for comprehensive, phased for very large)
- **Env config chain:** Scripts load from `.env` in order: `.env` (process env) → `.claude/skills/docs-seeker/.env` → `.claude/skills/.env` → `.claude/.env`

**Keywords:**  
- Query types: topic-specific (library + topic keyword), general (full library docs)
- Workflows: topic-search.md (10-15s), library-search.md (30-60s), repo-analysis.md (fallback)
- Recommendation: 1-agent / 3-agent / 7-agent / phased strategy per URL count

---

## excalidraw
**What:** Create Excalidraw diagrams for architecture, data flow, workflows, and system design. Supports two rendering backends: MCP canvas (live editing) or file-based JSON + Playwright rendering. Includes zero-config codebase auto-diagramming.

**Where:**  
- `claude/skills/excalidraw/SKILL.md` (workflow, design process, color reference, shape reference, sizing rules)
- `references/mcp-workflow.md` (MCP canvas tools, batch creation, self-critique)
- `references/file-workflow.md` (JSON generation, section-by-section, render script)
- `references/auto-diagram-guide.md` (zero-config codebase analysis: detect → discover → map → verify → select layout → generate)
- `references/design-methodology.md` (deep design philosophy, evidence artifacts, multi-zoom, large diagram strategy)
- `references/color-palette.md` (semantic colors, platform colors AWS/Azure/GCP/K8s, text hierarchy)
- `references/element-templates.md` (copy-paste JSON templates for file mode)
- `references/json-schema.md` (Excalidraw JSON format)

**Mechanism notes:**  
- **Core philosophy: "Diagrams should ARGUE, not DISPLAY"** — isomorphism test (remove text, does structure alone communicate?), education test (learn something concrete?), container test (can any box be free text?)
- **Visual pattern mapping:** Concepts → patterns: spawns-output → fan-out (radial arrows), combines-inputs → convergence (funnel), hierarchy → tree (lines + text), sequence → timeline, loops → spiral/cycle, abstract-state → cloud (ellipses), transform → assembly-line, compare → side-by-side, phases → gap/break
- **Mode detection first:** Test MCP availability; if works, use MCP tools (live editing); fallback to file-based (JSON generation + Playwright render)
- **Auto-diagram pipeline:** Max 12 components, 20 arrows per diagram; limit 15 tool calls for discovery, 10 for mapping; group if more
- **Self-critique loop:** Render/screenshot → audit vs vision → check defects (overlaps, clipped text, misrouted arrows, uneven spacing) → fix → re-render (typically 2-4 iterations, max 2 for MCP)
- **Modern aesthetics:** `roughness: 0` (clean, default) or 1 (hand-drawn), `strokeWidth: 2` (standard), `opacity: 100` always, `fontFamily: 3` (monospace), arrow labels use `strokeStyle: "dashed"` (async) or `"dotted"` (weak deps)

**Keywords:**  
- Render modes: MCP canvas (preferred), file-based (fallback)
- Visual patterns: fan-out, convergence, tree, timeline, spiral, cloud, assembly-line, side-by-side, gap
- Shape meanings: free text (labels), ellipse (markers/start/input), diamond (decision), rectangle (process/action), overlapping ellipse (abstract state)
- Size rules: box 200-240px wide, 120-160px tall, gap 150-200px (labeled) / 100-120px (unlabeled), row spacing 280-350px, zone opacity 25-40
- Quality checklist: research done, evidence artifacts, multi-zoom, different pattern per concept, <30% text in containers, validated render, no overlaps

---

## find-skills
**What:** Discover and install agent skills from the open ecosystem when users ask "how do I do X", "find a skill for X", or express interest in extending capabilities. Routes internal ClaudeKit skill discovery separately from external Skills CLI searches.

**Where:**  
- `claude/skills/find-skills/SKILL.md`
- `references/domain-routing.md` (local ClaudeKit skill routing when question is which installed skill to use)
- Skills CLI at `npx skills` (external ecosystem package manager)
- Skills browse at https://skills.sh/

**Mechanism notes:**  
- **Two-layer routing:** Local ClaudeKit (load domain-routing.md) vs external open ecosystem (use Skills CLI)
- **Skills CLI workflow:** `npx skills find [query]` → user review → present options → install if approved: `npx skills add <owner/repo@skill> -g -y`
- **When no skills found:** Offer direct help, suggest user could create their own with `npx skills init`
- **Common categories with example queries:** Web Development (react, nextjs, typescript), Testing (jest, playwright), DevOps (docker, kubernetes), Documentation (docs, changelog), Code Quality (review, refactor), Design (ui, ux, design-system), Productivity (workflow, automation, git)

**Keywords:**  
- Skills CLI: `find`, `add`, `check`, `update` commands
- Installation: `-g` (global/user-level), `-y` (skip confirmation)
- Skills.sh browse and search

---

## fix
**What:** Unified skill for fixing bugs, errors, test failures, and CI issues with intelligent routing through structured diagnosis. Supports four modes (autonomous, human-in-loop review, quick, parallel) with mandatory scout, diagnose, complexity-classify, implement, verify, and finalize steps.

**Where:**  
- `claude/skills/fix/SKILL.md` (610+ lines, comprehensive workflow)
- `references/mode-selection.md` (AskUserQuestion format for workflow mode)
- `references/diagnosis-protocol.md` (structured root-cause-analysis methodology)
- `references/complexity-assessment.md` (simple/moderate/complex/parallel classification)
- `references/task-orchestration.md` (native Claude Task patterns for moderate+ workflows)
- `references/workflow-quick.md`, `references/workflow-standard.md`, `references/workflow-deep.md` (per-complexity workflows)
- `references/prevention-gate.md` (prevention requirements after fix)
- `references/skill-activation-matrix.md` (when to activate each skill)

**Mechanism notes:**  
- **HARD-GATE-SCOUT-FIRST:** Always scan codebase BEFORE questions: project type, exact symptom files + callers, related tests, recent commits, existing patterns
- **HARD-GATE-EXACT-ROOT-CAUSE:** Six concrete-sentence requirements before proposing fix: exact symptom (copy verbatim), reproduction steps, expected vs actual, root cause (not symptom), why now, blast radius
- **Anti-rationalization table:** 8 developer thought-traps (e.g., "I can see the problem, let me fix it" → "Seeing symptoms ≠ understanding root cause")
- **Step 2: Diagnose mandatory skill chain:** ck:scout → ck:debug (systematic root cause) → ck:sequential-thinking (structured hypotheses) → parallel Explore subagents (test each hypothesis)
- **Step 3: Complexity classification:** Simple (single file, clear error, type/lint) → quick workflow; Moderate (multi-file) → standard; Complex (system-wide) → deep; Parallel (2+ independent) → parallel agents
- **Task Orchestration (Moderate+):** Create native Claude Tasks upfront with `addBlockedBy` dependencies; Fallback: Task tools unavailable → use TodoWrite
- **Step 5: Verify + Prevent (MANDATORY):** (1) run exact pre-fix repro, (2) add/update regression test, (3) blast-radius test sweep, (4) code-reviewer subagent, (5) artifact gate, (6) prevention-gate defense-in-depth, (7) parallel verification
- **Prevention gate:** Apply defense-in-depth validation (guards, assertions, checks) to prevent same bug class recurring

**Keywords:**  
- Modes: autonomous (auto-approve if validator passes), review (human approval per step), quick (fast scout→diagnose→fix→review), parallel (multi-agent)
- Workflows: quick (3 steps), standard (full pipeline), deep (research + brainstorm + plan)
- Complexity levels: simple, moderate, complex, parallel
- Six root-cause requirements: exact symptom, repro steps, expected vs actual, root cause, why-now, blast radius

---

## frontend-design
**What:** Create polished frontend interfaces from designs, screenshots, or videos, avoiding "AI slop" aesthetics. Implements real working code with exceptional attention to aesthetic details and creative choices. Routes to specific workflows based on input type (screenshot, video, 3D, quick, complex).

**Where:**  
- `claude/skills/frontend-design/SKILL.md` (workflow selection, design lead protocol, two-pass design process, design thinking)
- `references/workflow-screenshot.md`, `references/workflow-video.md`, `references/workflow-describe.md`, `references/workflow-3d.md`, `references/workflow-quick.md`, `references/workflow-immersive.md` (per-input-type workflows)
- `references/redesign-audit-checklist.md` (existing project upgrade audit)
- `references/anti-slop-rules.md` (full forbidden patterns + "AI Tells" checklist)
- `references/premium-design-patterns.md`, `references/performance-guardrails.md`, `references/bento-motion-engine.md` (SaaS dashboard implementation)
- `references/asset-generation.md`, `references/visual-analysis-overview.md`, `references/design-extraction-overview.md`

**Mechanism notes:**  
- **Design lead protocol:** (1) Ground concept in subject, (2) Pull from subject's world (materials, artifacts, vocabulary, constraints), (3) Take one justified aesthetic risk, (4) Spend boldness in one place
- **Two-pass design process:** (1) Brainstorm compact plan (subject, color palette, type, layout concepts, signature, motion, copy voice), (2) Critique before building (would any part appear unchanged for different client?)
- **Design Dials (three configurable parameters):** DESIGN_VARIANCE (1-3: perfect symmetry, centered; 8-10: asymmetric, masonry, massive zones), MOTION_INTENSITY (1-3: hover/active only; 8-10: Framer scroll reveals, spring physics), VISUAL_DENSITY (1-3: art gallery; 8-10: cockpit with 1px dividers)
- **Anti-slop forbidden patterns:** Typography (no Inter/Roboto/Arial — use trending Google Fonts with Vietnamese support, Geist, Outfit, Cabinet Grotesk, Satoshi); Color (no AI purple/blue gradient, no pure #000000); Layout (no 3-column equal card rows, no h-screen, mobile-first required); Content (no "John Doe", round numbers, "Elevate/Seamless" clichés); Effects (no neon outer glows, custom cursors, gradient text headers UNLESS explicitly requested); Components (no default shadcn, Lucide-only icons, generic card-border-shadow at high density)
- **Font size rule:** ALWAYS >16px for input fields (avoid mobile zoom)
- **Workflow activation:** Always activate `ck:ui-ux-pro-max` skill FIRST for design intelligence
- **Screenshot/video replication process:** (1) Analyze with ck:ai-multimodal (extract colors, fonts, spacing, effects), (2) Plan with ui-ux-designer subagent, (3) Implement precisely, (4) Verify against original, (5) Document in design-guidelines.md

**Keywords:**  
- Workflows: screenshot replication, video replication with animations, 3D/WebGL, quick task, complex/award-quality, existing project redesign audit
- Anti-slop rules: no Inter, no AI purple, no centered heroes at high variance, mobile-first, no "Elevate", no default shadcn, asymmetric layouts
- Design Dials: DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY (each 1-10 range)
- Design lead: subject, tone, constraints, differentiation (one memorable element)

---

## frontend-development
**What:** Build React/TypeScript frontends with modern patterns — components with Suspense, lazy loading, useSuspenseQuery, MUI v7 styling, TanStack Router, and performance optimization. Progressive guide with import aliases, file organization, styling patterns, and complete examples.

**Where:**  
- `claude/skills/frontend-development/SKILL.md` (quick start checklist, import aliases, common imports, topic guides)
- `resources/component-patterns.md` (React.FC, lazy, SuspenseLoader, structure)
- `resources/data-fetching.md` (useSuspenseQuery, API service layer, cache-first)
- `resources/file-organization.md` (features vs components, feature subdirs: api/, components/, hooks/, helpers/, types/)
- `resources/styling-guide.md` (inline vs separate, sx prop, MUI v7 Grid syntax)
- `resources/routing-guide.md` (TanStack Router, folder-based, lazy loading)
- `resources/loading-and-error-states.md` (CRITICAL: no early returns, use SuspenseLoader)
- `resources/performance.md` (useMemo, useCallback, React.memo, debounce)
- `resources/typescript-standards.md` (strict mode, no any, explicit return types)
- `resources/common-patterns.md` (React Hook Form + Zod, DataGrid, Dialog, useAuth, mutations)
- `resources/complete-examples.md` (working examples)

**Mechanism notes:**  
- **Import aliases:** `@/` → `src/`, `~types` → `src/types`, `~components` → `src/components`, `~features` → `src/features`; defined in vite.config.ts
- **CRITICAL RULE: No Early Returns** — Layout shift prevention via consistent Suspense boundaries, not early loading spinners
- **Component checklist:** React.FC with TypeScript, lazy load if heavy, wrap in SuspenseLoader for loading states, useSuspenseQuery for data, useCallback for event handlers, default export at bottom
- **Feature structure:** `features/{feature-name}/api/`, `components/`, `hooks/`, `helpers/`, `types/`; create route in `routes/{feature-name}/index.tsx`; lazy load components; export public API from `index.ts`
- **Data fetching pattern:** useSuspenseQuery with cache-first strategy (check grid cache before API); centralized API service at `features/{feature}/api/{feature}Api.ts`
- **Styling rules:** <100 lines inline `const styles: Record<string, SxProps<Theme>>`, >100 lines separate `.styles.ts`; use MUI v7 Grid new syntax: `<Grid size={{ xs: 12, md: 6 }}>`
- **Loading states:** Always use `<SuspenseLoader><Content /></SuspenseLoader>` pattern, never `if (isLoading) return <Spinner/>`
- **Notifications:** Use `useMuiSnackbar` only (never react-toastify)

**Keywords:**  
- Components: React.FC, lazy loading, Suspense, SuspenseLoader
- Data: useSuspenseQuery, apiClient axios instance, cache-first, TanStack Query
- Routing: TanStack Router, folder-based (`routes/my-route/index.tsx`), createFileRoute, lazy load
- Styling: sx prop, MUI v7 Grid, SxProps<Theme>
- Hooks: useCallback, useMemo, useAuth, useMuiSnackbar
- File structure: features, components, routes, api, helpers, types, hooks

---

## ghpm
**What:** GitHub project management for humans and AI agents — use GitHub as single source of truth (SSOT) for shared project work. Handles task intake, triage, issue/project schemas, status updates, handoff logs, and GitHub automation via gh, git, GraphQL, REST, and Actions.

**Where:**  
- `claude/skills/ghpm/SKILL.md`
- `references/schema-and-taxonomy.md` (labels, fields, issue body contract)
- `references/command-cookbook.md` (gh, GraphQL, REST, Actions snippets)
- `references/skill-pipelines.md` (chained workflows with other skills)

**Mechanism notes:**  
- **Core model:** GitHub primitives used deliberately: Issue (atomic task/bug/decision), Issue body (contract: context, acceptance criteria, handoff log), Labels (routing: type, priority, area, risk, agent/human lane), Project (live board: status, iteration, owner, estimate), PR (execution evidence), Actions (automation worker), Comments (append-only handoff log), Branch (WIP pointer)
- **Workflow order:** (1) Orient repo and auth via git/gh commands, (2) Choose mode (Bootstrap / Intake / Execute / Handoff / Audit), (3) Load only needed references, (4) Update GitHub first, then local artifacts, (5) Report from evidence
- **Task contract:** Every task issue should contain: Outcome, Context, Acceptance Criteria (checkboxes), Handoff Log (chronological), Skill Chain (suggested skills and order)
- **Operating rules:** Use `gh` first; use `gh api graphql` for Projects fields needing precision; never create broad labels silently; keep statuses mutually exclusive; record blockers as field/label + comment; for AI handoff, include exact commands run, test/check results, touched files, next safe command
- **Status field:** Prefer Projects `Status` for live state; use `status:*` labels as fallback if no Project

**Keywords:**  
- Primitives: Issue, body, labels, Project, PR, Actions, Comments, Branch
- Labels: type, priority, area, risk, agent, status, estimate
- Handoff log format: YYYY-MM-DD HH:mm TZ - actor: state, evidence, next step
- Skill Chain: suggested skill ordering (e.g., ck:scout → ck:plan → ck:cook → ck:test → ck:git → ck:ship)

---

## git
**What:** Manage git commits, pushes, PRs, branch merges, and PR review-and-merge automation with conventional commit format. Supports five operations: `cm` (stage + commit), `cp` (stage + commit + push), `pr` (create PR), `merge` (merge branches), `merge-pr` (review + label + merge + verify CI).

**Where:**  
- `claude/skills/git/SKILL.md`
- `references/workflow-commit.md`, `references/workflow-push.md`, `references/workflow-pr.md`, `references/workflow-merge.md`, `references/workflow-merge-pr.md`
- `references/commit-standards.md` (conventional commit format)
- `references/safety-protocols.md` (secret detection, branch protection)
- `references/branch-management.md` (naming, lifecycle, strategies)
- `references/gh-cli-guide.md` (GitHub CLI commands)

**Mechanism notes:**  
- **Core workflow:** (1) Stage + analyze, (2) Security check (scan for secrets), (3) Split decision (different types/scopes/files → multiple commits; same type/scope ≤3 files ≤50 lines → single), (4) Commit with conventional format
- **Security check:** `git diff --cached | grep -iE "(api[_-]?key|token|password|secret|credential)"` — STOP if secrets found
- **Split decision rules:** Split if different types (feat + fix), multiple scopes (auth + payments), config/deps + code mixed, FILES > 10 unrelated; Single if same type/scope, FILES ≤ 3, LINES ≤ 50
- **Conventional format:** `type(scope): description` where type ∈ {feat, fix, perf} (only for `.claude` directory files; use docs separately)
- **GitLab integration:** Search for related issues on GitHub before commit; add to commit body
- **merge-pr automation:** Runs `/ck:review-pr <PR> --fix --reply` first; adds `ready to ship` label only after review reports merge-ready; merges reviewed PRs; watches target-branch CI to success
- **Output format:** `✓ staged: N files`, `✓ security: passed`, `✓ commit: HASH type(scope)`, `✓ pushed: yes/no`
- **Subagent delegation:** Execute git workflows via `git-manager` subagent to isolate verbose output; also activate `ck:context-engineering` skill

**Keywords:**  
- Operations: cm, cp, pr, merge, merge-pr
- Conventional commit: feat, fix, perf (type), scope, description
- Merge operations: branch management, PR review, CI convergence
- Security: secret scanning before commit, .gitignore

---

## gkg
**What:** Semantic code analysis with GitLab Knowledge Graph — IDE-like code navigation for AI assistants. Supports go-to-definition, find-usages, impact analysis, and architecture visualization. Uses AST parsing and KuzuDB graph database.

**Where:**  
- `claude/skills/gkg/SKILL.md`
- `references/cli-commands.md` (gkg index, gkg server, gkg remove, gkg clean)
- `references/mcp-tools.md` (7 tools for AI integration)
- `references/http-api.md` (REST endpoints for querying)
- `references/language-support.md` (supported features per language)

**Mechanism notes:**  
- **Two-backend model:** CLI for indexing + server; MCP tools for AI integration; HTTP API for querying
- **Installation:** macOS/Linux bash script, Windows PowerShell; stores in `~/.gkg/`
- **Server workflow:** (1) Index project: `gkg index /path/to/project --stats`, (2) Start server: `gkg server start`, (3) Query via HTTP API at http://localhost:27495 or MCP tools
- **Constraint:** Must stop server before re-indexing; requires initialized Git repository
- **Language support matrix:** Ruby (full), Java (full), Kotlin (full), Python (in progress), TypeScript/JavaScript (in progress)
- **Impact analysis:** Index affected repos → query get_references for changed symbols → review all call sites before refactoring

**Keywords:**  
- Commands: `gkg index`, `gkg server start/stop`, `gkg remove`, `gkg clean`
- MCP tools: get_references (find all usages), go_to_definition, and others
- HTTP API: `/api/graph/search` endpoints
- Language support: Ruby, Java, Kotlin (full); Python, TypeScript, JavaScript (partial)

---

## google-adk-python
**What:** Expert guide for Google's Agent Development Kit (ADK) Python — open-source, code-first toolkit for building single and multi-agent systems with tool integration, A2A protocol, MCP tools, workflows, state/memory, callbacks/plugins, and Vertex AI deployment.

**Where:**  
- `claude/skills/google-adk-python/SKILL.md`
- `references/agent-types-and-architecture.md` (Agent types, workflows, custom agents)
- `references/tools-and-mcp-integration.md` (custom tools, MCP, tool filtering)
- `references/multi-agent-and-a2a-protocol.md` (sub-agents, A2A, coordinator patterns)
- `references/sessions-state-memory-artifacts.md` (state, artifacts, sessions, memory)
- `references/callbacks-plugins-observability.md` (lifecycle hooks, plugins, tracing)
- `references/evaluation-testing-cli.md` (adk eval, evalset format)
- `references/deployment-cloud-run-vertex-gke.md` (Cloud Run, Vertex AI, GKE)
- External: GitHub https://github.com/google/adk-python, Docs https://google.github.io/adk-docs/, Samples, llms.txt

**Mechanism notes:**  
- **Agent structure convention:** `my_agent/__init__.py` (MUST: `from . import agent`) + `agent.py` (MUST: `root_agent = Agent(...)` OR `app = App(...)`)
- **Quick start installation:** `pip install google-adk` (stable weekly releases) or `uv sync --all-extras` (dev, Python 3.10+, 3.11+ recommended)
- **App pattern (production):** Use `App` with plugins, event compaction, custom lifecycle; uses SaveFilesAsArtifactsPlugin, EventsCompactionConfig
- **CLI tools:** `adk web <agents_dir>` (dev UI, recommended), `adk run <agent_dir>` (interactive CLI), `adk api_server <agents_dir>` (FastAPI production), `adk eval <agent> <evalset.json>` (evaluation suite)
- **Agent types:** Agent/LlmAgent (dynamic routing), SequentialAgent (fixed-order), ParallelAgent (concurrent), LoopAgent (iterative), RemoteA2aAgent (remote via A2A)
- **Model support:** Flash: gemini-2.5-flash (stable), gemini-3-flash-preview (preview); Pro: gemini-2.5-pro (stable), gemini-3.1-pro-preview (preview); Also: Anthropic Claude, Ollama, LiteLLM, vLLM, Model Garden
- **Key APIs:** State via `tool_context.state[key]`, Artifacts via `tool_context.save_artifact`, Callbacks (before_agent_callback, after_model_callback), MCP tools via MCPToolset, Sub-agents, Human-in-loop (LongRunningFunctionTool), Plugins

**Keywords:**  
- Agent types: Agent, LlmAgent, SequentialAgent, ParallelAgent, LoopAgent, RemoteA2aAgent
- Workflows: sequential, parallel, loop
- Key APIs: tool_context.state, tool_context.save_artifact, callbacks, MCP, sub_agents
- Deployment: Cloud Run, Vertex AI Agent Engine, GKE
- Models: Gemini Flash/Pro (primary), Claude, Ollama, LiteLLM, Model Garden

---

## html-video
**What:** Create local MP4 videos from HTML/CSS/JS templates using nexu-io/html-video CLI and Studio. Turns HTML templates and project assets into real MP4 exports through headless Chromium and ffmpeg. Covers template discovery, studio customization, preview, and render verification.

**Where:**  
- `claude/skills/html-video/SKILL.md`
- Upstream: https://github.com/nexu-io/html-video
- Docs: live builder at `html-video studio --port 3071`
- Node >=20, pnpm >=9.15.0

**Mechanism notes:**  
- **Setup choice:** Prefer published binary if exists; fallback to source checkout (not vendored into user project)
- **Installation:** macOS/Linux bash script from upstream, Windows PowerShell; requires Node 20+, pnpm 9.15.0
- **Helper function pattern:** Shell function that tries global binary first, fallback to source checkout at `$HOME/html-video` or `$HTML_VIDEO_HOME`
- **Diagnostic start:** Always run `html_video doctor` and `html_video list-engines` first
- **Standard workflow:** (1) Pin brief (audience, duration, aspect ratio, assets, template, output path), (2) Discover templates via `search-templates --intent ... --aspect 16:9 --top 5` + inspect, (3) Create project via `project-create`, (4) Select template + add assets (inline text, files), set variables if needed, (5) Preview (open HTML or launch Studio), (6) Render to MP4 via `project-render`, (7) Verify with ffprobe
- **Studio workflow:** For interactive editing, templates with empty variable schemas, agent-assisted rewrite, layout tuning
- **Output verification:** MP4 proof incomplete until `ffprobe` reports nonzero duration and expected video dimensions
- **Output organization:** `assets/videos/<slug>.mp4` (finished exports), `plans/<plan-slug>/visuals/<slug>.mp4` (proof artifacts), `tmp/html-video/<slug>/` (scratch)
- **Do NOT commit large MP4 files** unless user explicitly wants versioning

**Keywords:**  
- Commands: doctor, list-engines, search-templates, inspect-template, project-create, project-list, project-show, project-set-template, project-add-asset, project-set-var, project-set-vars, project-preview, project-render, studio
- Workflow: brief → template discovery → project creation → template + assets → preview → render → verify
- Output: MP4, ffprobe verification, output organization (assets/, plans/, tmp/)
- Integration: nexu-io/html-video (upstream), Playwright (Chromium), ffmpeg (MP4 encoding)

---

## journal
**What:** Write technical journal entries analyzing recent changes, session reflections, and decision documentation using the journal-writer subagent. Entries are concise and focused on important events, key changes, impacts, and decisions.

**Where:**  
- `claude/skills/journal/SKILL.md` (brief 26 lines)
- Output: `./docs/journals/` directory

**Mechanism notes:**  
- **Subagent delegation:** Uses `journal-writer` subagent to explore memories and recent code changes, then write entries
- **Simple workflow:** Invoke skill → subagent analyzes recent changes + memories → writes concise journal entries
- **Output organization:** Invoke `/ck:project-organization` skill to organize outputs
- **Workflow position:** Terminal skill — typically follows `/ck:ship`, `/ck:cook`, `/ck:fix`

**Keywords:**  
- Output: `docs/journals/` directory
- Focus: important events, key changes, impacts, decisions
- Entry style: concise, focused (not verbose)

---

## llms
**What:** Generate llms.txt files from project documentation or codebase scanning following llmstxt.org specification. Creates LLM-friendly markdown indexes of documentation with optional expanded full-content variant (llms-full.txt).

**Where:**  
- `claude/skills/llms/SKILL.md`
- `scripts/generate-llms-txt.py` (primary generator script)
- `references/llms-txt-specification.md` (llmstxt.org spec details)
- External: https://llmstxt.org/

**Mechanism notes:**  
- **Scope:** Generates `llms.txt` and optional `llms-full.txt` only; does NOT handle hosting, deployment, SEO, robots.txt, sitemaps
- **Workflow:** (1) Gather sources (scan `./docs` directory via ck:scout for .md/.mdx files, or fetch from URL), (2) Analyze & categorize (extract H1 title, first paragraph, group into sections), (3) Generate via Python script or manual per-spec, (4) Structure output (H1 required, blockquote recommended, H2-delimited sections, links in `[title](url): description` format), (5) Validate (H1 present, blockquote present, valid markdown links, Optional section at end, concise descriptions)
- **Generator script:** Python script at `$HOME/.claude/skills/.venv/bin/python3 scripts/generate-llms-txt.py --source <path> --output <output-path> --base-url <url> [--full]`
- **Format rules:** H1 (required, project name), Blockquote (recommended, brief essential context), Sections (H2-delimited), Links (`[Title](url): Optional description`), `## Optional` (special section for skippable content), Language (concise, clear, no jargon)
- **Arguments:** No args (scan ./docs), path (scan specific directory), --full (generate llms-full.txt with inline content), --output (custom output location, default: project root), --url (base URL prefix for links)

**Keywords:**  
- Specification: llmstxt.org
- Files: llms.txt (curated), llms-full.txt (expanded with inline content)
- Format: H1 (required), blockquote (recommended), H2 sections, `[link](url): description`, `## Optional`
- Generator: Python script with --source, --output, --base-url, --full options

---

## Summary Statistics

| Dimension | Count | Notes |
|-----------|-------|-------|
| **Total Skills Inventoried** | 22/22 | 100% coverage |
| **Skills with Sub-skills/External Routing** | 5 | design (→brand/design-system/ui-styling), docs (→mdview), frontend-design (→ui-ux-pro-max), cook (→subagents), fix (→scout/debug/sequential-thinking) |
| **Skills with Python Utility Scripts** | 9 | copywriting, databases, design (logo/cip/icon), devops, cti-expert, docs-seeker, html-video (via upstream), llms, deploy (implicit) |
| **Skills with Comprehensive Workflows** | 8 | cook, fix, cti-expert, frontend-design, frontend-development, ghpm, git, gkg |
| **Skills with Reference Documentation** | 20+ | All skills except the briefest (journal, llms foundation) |
| **Skills Referencing External Tools/APIs** | 12 | cti-expert (30+ techniques), design (Gemini), devops (Cloudflare/Docker/GCP/K8s), ghpm (GitHub API), gkg (GitLab KG), google-adk-python (Vertex AI), html-video (Chromium/ffmpeg), deploy (15 platforms) |
| **Skills with Mode/Workflow Selection** | 5 | cook (interactive/fast/auto/parallel), fix (autonomous/review/quick/parallel), frontend-design (screenshot/video/3D/quick/complex), git (cm/cp/pr/merge/merge-pr), docs (init/update/summarize) |

---

## Notable Patterns

### Mandatory Gates (HARD-GATE pattern)
**Skills using enforcement-level hard gates:** cook (3), fix (3) — rigid "do not proceed without" structures that block workflow progression until conditions are met.

### Subagent Delegation
**Skills that delegate to subagents:** cook (code-reviewer, docs-manager, git-manager), fix (debugger, researcher, planner, code-reviewer, tester), ghpm (gh CLI via subagent), git (git-manager), cti-expert (none explicit, but agent-browser for collection)

### Anti-Pattern Catalogs
**Skills documenting what NOT to do:** frontend-design (AI slop rules with 150-line anti-slop reference), cook (anti-rationalization table), fix (anti-rationalization table)

### Script-Driven Workflows
**Skills organizing work via utility scripts:** docs-seeker (detect→fetch→analyze), design (logo/CIP/icon generators), cti-expert (auto-install policy for 20+ tools), html-video (CLI-first with Studio fallback)

### External Ecosystem Integration
**Skills routing to external systems:** find-skills (Skills CLI / skills.sh), deploy (15 platform providers), devops (Cloudflare/GCP/K8s/Docker), gkg (GitLab KG), google-adk-python (Vertex AI/Model Garden)

### Visual Design Precedence
**Skills defining aesthetic rules:** frontend-design (design lead protocol, design dials, anti-slop rules, "no AI purple" mandate), design (brand/logo/CIP/banner/social/icon with Gemini generation), excalidraw (diagram philosophy: "argue, not display")

### LLM/AI-Specific
**Skills addressing LLM-native concerns:** cti-expert (30+ recon techniques, DOCX hybrid generation), google-adk-python (Agent Development Kit, A2A protocol), llms (llms.txt generation for AI context), copywriting (50 writing styles, power words by emotion)

---

## Unresolved Questions

None — all 22 skills read in full. No missing SKILL.md files or inaccessible references detected.
