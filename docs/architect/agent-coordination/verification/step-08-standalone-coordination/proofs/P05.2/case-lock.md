# R5 External Case Lock — Phase 05 (Group Cognition framework proof)

**FROZEN.** This file is written and committed BEFORE any single-agent
baseline (R6), any live framework run (R7), or any quality-report
observation (R8). Per phase-05.md's own R5 text and Risks/Rollback
section ("The main risk is experiment bias. Freeze the case/rubric first
and use an independent evaluator... do not redefine success after
seeing outputs"), nothing below may be edited after this commit lands —
a later cell that wants a different case opens a NEW lock file, it never
edits this one.

Selected and confirmed directly with the repo maintainer in conversation
(not autonomously invented) on 2026-09-02, per this track's own "Scout
First" doctrine: selecting which external project and which decision is
a business-judgment call outside the autonomous Coordinator's own
authority. Two earlier candidates were scouted and explicitly rejected
before this one: (1) forgentX itself — excluded because R5's own text
requires a project "outside this repository," and because using fgOS to
evaluate a decision about fgOS's own repo would contradict this
project's own locked mission boundary (`AGENTS.md`'s D-ADR0035: fgOS
exists to develop OTHER projects and run real business workflows, not to
develop itself); (2) herdr-gateway's terminal-scrolling question —
scouted and rejected because it turned out to be extensively
pre-analyzed already (`docs/backlog.md` PBI-056/057/058/059/060, a
dedicated plan at `plans/260811-1426-terminal-dom-renderer-swap/`, and a
prior distillery-consult report), which would have made the case not
genuinely "unobserved" and defeated R5's own bias-avoidance purpose.

## Project

**mdview** (`/home/vantt/projects/mdview`), a real, independently-running
fgOS-using project (confirmed `.fgos/` present, real `.fgos/config.json`)
outside the forgentX repository.

**Frozen commit**: `84a6710ad2970d2702e6ff2814314fe39f9392b8`
("chore: bump version to 0.7.5", 2026-09-01 22:10:24 +0700). All context
below is quoted verbatim from this exact commit; nothing in this lock
depends on mdview's working tree or any later commit.

## Objective (frozen, verbatim as confirmed with the maintainer)

> Đánh giá việc thêm một MÀN HÌNH EDITOR MỚI, tách biệt (không sửa trực
> tiếp trên màn hình view hiện tại) để chỉnh sửa markdown và ghi thay đổi
> ngược lại file `.md` gốc, có đơn giản không về mặt kiến trúc, và xác
> định rủi ro/vấn đề lớn nhất.

In English, for the framework's own English-language operations/rubric
text: **Assess whether adding a NEW, separate editor screen (never
inline editing on the existing view screen) to mdview — one that edits
markdown and writes the change back to the source `.md` file — is
architecturally simple, and identify the single largest risk/blocker.**

Explicit constraint carried into the objective itself (maintainer's own
words): the editor must be its own screen, never inline editing grafted
onto the current read-only view route. Any candidate answer that
proposes inline editing on the existing view screen has NOT answered the
locked objective and must be flagged as such by evidence review/
synthesis, never silently accepted as if it satisfied the question.

## Context snapshot (frozen, quoted verbatim from mdview @ 84a6710a)

### Current product positioning (PRD.md §3.2, Non-goals)

> - Không phải static site generator (không build output ra HTML tĩnh).
> - **Không phải authoring tool hay WYSIWYG editor.**
> - Không phải tool để deploy/host public (chỉ dùng locally hoặc trong
>   private network).
> - Không cần authentication (để đơn giản; security tùy người dùng tự xử
>   lý ở network level).
> - Không sync hay backup files.
> - Desktop app không phải app đứng riêng có registry riêng — chỉ là
>   cửa sổ/tray native nhìn vào cùng một daemon (§7.5); **vẫn read-only,
>   không phải editor.**

### Deployment topology (PRD.md §7.1)

> MDView chạy như **một server (daemon) duy nhất**; browser tab và cửa
> sổ desktop chỉ là **client** nhìn vào nó. Bất biến bắt buộc: **không
> bao giờ có 2 daemon cùng ghi một registry SQLite.**
>
> - **Web (phần lớn thời gian):** agent gọi `mdview_view_file` → daemon
>   trả url → user click → xem trong browser. Desktop không cần bật.
> - **Desktop (thỉnh thoảng):** ... App đọc `~/.mdview/daemon.lock`: có
>   daemon sống → cửa sổ chỉ attach (webview → :7700); chưa có → app tự
>   spawn daemon rồi mới hiện cửa sổ.
>
> Hệ quả DRY: chỉ **một** web UI — xem qua browser hay qua Tauri webview
> đều cùng một code path render; live reload / registry / MCP share tự
> động vì cùng một daemon.

### URL namespace (PRD.md §7.2, current routes)

```
/                                 → Project list
/p/{project-id}/                  → Project home + file tree
/p/{project-id}/{path/to/file.md} → Render file
/p/{project-id}/_search           → Search trong project
/api/projects                     → REST API (cho UI)
/api/projects/{id}/files          → File list
/settings                         → Trang cấu hình hệ thống (FR-22b)
/api/config                       → GET/PUT cấu hình (cho Settings UI)
/api/status                       → Health check
/ws                               → WebSocket endpoint (live reload)
```

### Code organization (PRD.md §7.4, Clean Architecture / Ports & Adapters)

> **Workspace Rust** (một core, nhiều adapter):
>
> ```
> mdview-core/    (lib)  DOMAIN + APPLICATION: registry, indexer, link resolver, search,
>                        render (comrak). Định nghĩa PORTS (trait): FileStore, Watcher,
>                        Clock, ProjectRepository. KHÔNG phụ thuộc Axum / Tauri / SQLite.
> mdview/         (bin)  Adapter CLI + daemon: HTTP/WS (Axum), MCP server, clap CLI.
> mdview-desktop/ (bin)  Adapter Tauri: cửa sổ native + tray, attach/spawn daemon.
> adapters/              SQLite (rusqlite) impl ProjectRepository; notify impl Watcher; ...
> ```
>
> **Dependency rule** — phụ thuộc chỉ hướng vào trong (adapter →
> application → domain). Domain không `use` Axum/Tauri/rusqlite.

### Desktop read-only invariant (PRD.md §7.5)

> **Read-only:** desktop không ghi vào file/folder user; state riêng
> (window, prefs) ở app-data-dir cross-platform (macOS Application
> Support, Linux `~/.local/share`, Windows `%APPDATA%`).

### Confirmed absence of prior analysis

`grep`-searched `docs/backlog.md`, `PRD.md`, `README.md`, and
`plans/` at the frozen commit for `editor`/`editable`/`edit mode`: no
existing plan, backlog item, or design discussion addresses adding
editing capability. This case is genuinely unobserved by prior work,
unlike the herdr-gateway candidate that was scouted and rejected (see
above).

## Evaluation rubric (frozen, per R8's own named dimensions)

An independent evaluator (never the same agent/context that produced
the baseline or ran the framework — see "Evaluator independence" below)
scores both the single-agent baseline (R6) and the framework run (R7)
against every one of these dimensions, without redefining any of them
after seeing either output:

1. **Evidence coverage** — how much of the real, frozen context above
   (routing/URL namespace, clean-architecture boundaries, deployment
   topology, read-only invariant, MCP/CLI/desktop client surface) does
   the answer actually engage with, vs. ignore.
2. **Unsupported claims** — factual assertions about mdview's real
   architecture that are not grounded in the frozen context and cannot
   be verified against it.
3. **Unique valid alternatives/risks** — how many DISTINCT, genuinely
   different architectural approaches or risks are named (not
   rephrasings of the same point).
4. **Decision-criteria coverage** — does the answer name concrete
   criteria a real decision-maker would use (e.g. write-path safety,
   conflict with live-reload, desktop-vs-web parity, scope of the new
   screen's own feature set) rather than a vague "it depends."
5. **Dissent preservation** (framework run only, N/A for the single-
   agent baseline) — are minority/contrarian positions from the
   framework's own explorer/critic actors visible in the final output,
   or silently smoothed away.
6. **Actionability** — could a real engineer start work from this
   answer without another round of clarification.
7. **Operator time** — human wall-clock time spent supervising/
   intervening, separate from pure computation time.
8. **Wall time** — total time from dispatch to final settled output.
9. **Retries** — how many dispatch attempts failed and were retried,
   for either mode.
10. **Available cost** — token/dollar cost if measurable from the real
    RunResult provenance; explicitly recorded as "unknown" rather than
    guessed if the real dispatch doesn't surface it.

Per R8's own text: **a null or negative quality result (framework does
NOT outperform the single-agent baseline) still closes this proof if
both contracts held** — it triggers a documented product reassessment,
never a fabricated benefit. The evaluator may not redefine "success"
after seeing which mode did better.

## Required tiers / provider families

Per the already-declared `group-cognition-framework.yaml` fixture
(P05.1, committed `833888ba`): activity tier floors span
`creative`/`analytical`/`critical` across the 6 phases (divergent
exploration=creative, cluster-deduplicate=analytical,
critical-challenge=critical, evidence-review=analytical,
convergent-synthesis=analytical, recommend-with-dissent=critical);
`cohort.distinctProviderFamilies: 2`. R7 requires "real cli-spawn actors
from at least two provider families supporting all required tiers" —
this is the SAME live-proof feasibility question already resolved for
`lightweight` tier in P04.2b; whether it holds for `creative`/
`analytical`/`critical` tiers specifically for a SECOND non-Claude
family is NOT yet confirmed and is P05.2's own first empirical question
(see "Known risk" below) — this lock does not assume the answer.

## Budgets (frozen)

- **Single-agent baseline (R6)**: one bounded dispatch, `budget.maxRuns: 1`,
  `timeoutMs`: the same default this track's inline contracts already
  use (`DEFAULT_TASK_TIMEOUT_MS`, `session-engine.mjs`) unless a longer
  bound is genuinely needed for a `critical`-tier single-shot answer —
  recorded exactly, not silently changed mid-run.
- **Framework run (R7)**: the aggregate bounds already declared on
  whichever session opens the framework (`aggregateBounds` defaults,
  `schema.mjs` — `wallTimeMs: 3600000`, `maxAssignments: 20`,
  `maxConcurrency: 4`, `maxRounds: 10`, `maxTaskDepth: 3`) unless P05.2
  finds it must open with tighter bounds for this specific case; any
  deviation from these defaults must be recorded in this lock file's own
  amendment log (see below) BEFORE the framework run starts, never
  after.
- Both modes read the SAME frozen objective/context above — no separate
  briefing, no hint that carries information from one mode to the other.

## Evaluator independence (frozen protocol)

The R8 quality report MUST be produced by an agent that:
- Never participated in building the `group-cognition-framework.yaml`
  fixture (P05.1) or this lock file.
- Never ran or supervised the single-agent baseline (R6) dispatch.
- Never ran or supervised the framework dispatch (R7).
- Receives ONLY: this lock file, the baseline's recorded output/
  provenance, and the framework's recorded output/provenance/full event
  trace — never the coordinator's own commentary on which one it
  expects to be better.

## No proprietary secret

All quoted context above is public-facing product documentation
(`PRD.md`) already committed to mdview's own repository — no
credential, API key, customer data, or other secret is contained in or
referenced by this lock.

## Amendment log

(Must remain empty for this lock to be valid evidence — any entry here
means this case was edited after freezing, which invalidates R5's
bias-avoidance guarantee for whatever was changed. If a genuine
amendment becomes unavoidable, it is recorded here with a timestamp and
reason, and the Deferral Audit at Phase 05's close must name the
resulting weakened-evidence caveat explicitly, never hide it.)
