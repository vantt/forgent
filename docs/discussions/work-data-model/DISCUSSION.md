discussion: open

# Work data model: the shape of the portfolio data

## 1. Trạng thái hiện tại

2026-11-19: discussion opened from backlog row `p-mc25x5pfi6` (owner approval via Miu). Starting point scouted
(§2, §3). Nothing settled yet. Round 1 done: owner reframed #1 (content of a row, not its storage); shaper proposed a short row + link and a 5-value backlog status list, explained #3–#5. Waiting for the owner's reaction. Plan 261119-1615 phase 4 (add-rows) is on hold
until the backlog shape is decided here.

## 2. Mục tiêu & đề bài

The portfolio (backlog rows, plan directories, board) is the project's source of truth and travels with the project
(D-ADR0079); Work is a replaceable UX layer on top and is on hold. The owner wants the planning data "thuần nhất",
generic and self-describing so an engine runs from the raw files with no UI and any UI reaches it through one
intermediate layer (owner 2026-11-17 14:30, quoted in `plans/261117-1430-portfolio-driving-draft/plan.md`). Today the
data is not uniform: `docs/backlog.md` is one ~358 KB table of ~277 rows whose Status cell is free text, and 135 plan
dirs use about 12 status spellings while plan-v1 has a five-value enum. This discussion decides the data shape: how a
backlog row is stored, the fixed status list(s), how plan status is held to plan-v1, and which state is authored in
files versus recorded in the Event Store. Its outcome decides plan 261119-1615 phase 4 (`session write --add-rows`).

## 3. Vấn đề rõ / chưa rõ

| # | Point | Evidence | State |
|---|---|---|---|
| 1 | What a backlog row holds, and what moves to the plan once one exists (owner reframed round 1: one file vs one table is the wrong question; details live in the plan once planned) | Rows are paragraphs, not lines: 296 rows, length median ~830 chars, p90 ~1470, max ~4400 (problem, evidence, prior art, CoS, landing notes in the Status cell). Backlog→plan link is weak: only 19 plan.md have `source:`, naming 8 distinct backlog ids. Whole-file writes are what 1615 phase 4 add-rows works around (plan.md:74); no backlog parser in code | open; shaper proposal round 1: row = short item (id, title, why, CoS, status, priority, area, link); long pre-plan detail lives in the row only until a discussion/plan exists, then the row links there |
| 2 | Backlog status vocabulary | Status column: 234 `proposed`, 31 `done`, 3 `in-flight`, plus ~15 cells of free text (`done (main …)`, `proposed (partly: …)`, `proposed (hoãn …)`) | open; shaper proposal round 1: `proposed`, `parked` (with reason/date), `in-flight` (links a discussion or plan), `done`, `dropped`; notes leave the status cell; a "partly" row is split |
| 3 | Plan status held to plan-v1 | plan-v1 enum draft/ready/running/done/withdrawn (`core/skills/_shared/plan-contract.md` §2, `packages/supervision/contracts/plan-vocabulary.v1.json`); plan dirs: 44 done, 39 completed, 14 pending, 7 in-progress, 5 draft, 3 running/proposed/complete/approved, 1 partial/landed/deferred; legacy map exists in plan-contract.md; `scripts/plan-contract-check.mjs --all` only warns legacy | open |
| 4 | Authored state in files vs Event Store | L1 log vs state; council D1/D3/D6/D11 (`plans/261117-1430-portfolio-driving-draft/reports/council-final-recommendation.md`); Event Store has no portfolio consumer yet (council §1) | open |
| 5 | Touching Work: how far this may go while Work is on hold | draft 261117 parked because it touches Work; memory: foundation first, Work later | open |
| 6 | Readers to keep working: supervision portfolio reader, Miu's `fgos session write` | `packages/supervision/rust/src/portfolio.rs` (plan frontmatter only, refuses unknown status `plan-status-unknown`); `docs/platform/supervision/spec.md:45,54` | open |

Explained to the owner round 1: #3 (migrate legacy plans by the existing map, then make the check fail instead of warn), #4 (L1 state vs log: what an item is/why = file; what happened = Event Store or git history), #5 (Work = the work-item system in `docs/platform/work-state/spec.md`, on hold; risk is designing a second item model beside it; proposed boundary: only the shape of repo portfolio files, no Work code/items/stream/adapter).

## 4. Quyết định đã chốt

| D-ID | Decision | Date | Source |
|---|---|---|---|

## 5. Q&A log

- 2026-11-19 17:0x — opened; starting point scouted from the brief, backlog row `p-mc25x5pfi6`, secretary-supervisor-powers §3 row 13 (branch `origin/shape/secretary-supervisor-powers`), the parked draft and council recommendation, plan-v1 and the supervision portfolio reader.

- 2026-11-19 17:2x — owner round 1: (1) backlog question is wrong — one file or one table, there is always a list plus a file; unclear how much detail a backlog row holds, since once planned the detail lives in the plan in separate files; (2) asks for advice on the status list; (3)(4) asks for explanation; (5) asks to say it more clearly. Shaper scouted row sizes and backlog→plan links and answered with proposals for #1/#2 and explanations for #3–#5.

## 6. Thiết kế đã chốt {#design}

Nothing settled yet.

## 7. Danh mục hạng mục / task {#tasks}

None yet.
