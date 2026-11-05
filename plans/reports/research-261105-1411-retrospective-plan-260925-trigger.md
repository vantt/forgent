# What triggered plan 260925 (documentation authority unification)

Read-only research, 2026-11-05. All dates are +0700. "Unverified" marks anything I could not tie to a sha, path or dated report.

## 1. Trigger narrative

### 1.1 Headline finding

I found no single failure, incident report or chat transcript that triggered the plan. The trigger was a design discussion about a "Unified Documentation Operating System". That discussion was preserved as a proposal, and the plan was cut out of it as its "H1" horizon.

- The discussion's chat itself is not in the repo. The proposal says it "preserves the complete discussion so it can continue without chat history".
- The proposal header says `Last reviewed: 2026-09-20` (read from `git show 2085d88fe^:docs/platform/proposals/documentation-system-unification.md`).
- The proposal first appears in git in commit `ca854f443` (2026-09-21 23:23). That commit is titled "refactor coordination action legality and test fixtures" and adds 991 lines at `docs/platform/proposals/documentation-system-unification.md`. It is a mixed commit, so the title says nothing about the proposal.
- The authoring session that wrote the proposal is unverified. Its original prompt is not in the repo.

### 1.2 The standing doctrine the proposal builds on

- `docs/doc-governance.md` (458 lines) and `docs/platform/README.md` (79 lines) were added in `23fb220e3` (2026-09-15 03:13, "chore: preserve main worktree before packaging merge").
- Governance section 13 required per-area migration with redirects. The first independent review quotes it: "`docs/doc-governance.md` §13, which is Accepted and canonical, says 'Migrate one area at a time, with redirect/stub pointers'".
- So by 2026-09-15 the repo had a new `docs/platform/**` tree beside the legacy `docs/specs/**` and `docs/architect/**`, and areas were being promoted one at a time.

### 1.3 The problem as the proposal stated it (before the plan existed)

From `docs/platform/proposals/documentation-system-unification.md` section 1, at `2085d88fe^`:

> "fgOS already has substantial documentation doctrine and tooling, but the system is split across canonical targets, legacy-current trees, end-user knowledge machinery, templates, instructions, and generated projections. An agent asked to 'write the architecture doc' must still reconstruct the workflow: classify the claim, find its owner, choose a type and path, locate a template, update related links and proof, regenerate projections, and determine which checks apply."

> "Every retained detail in `docs/specs/**` and `docs/architect/**` must be migrated to the new system. Those legacy trees must then be retired and removed; they must not remain indefinitely as compatibility or 'legacy-current' sources."

That is the owner's intent: retire the legacy trees and leave no permanent split.

### 1.4 What turned the proposal into a plan (2026-09-25)

The plan's own inputs, readable at `archive/doc-260925-lineage` (84bbfa7b8, 2026-11-03), show how the plan was shaped.

**Phase 00 "truth reset", 2026-09-25 13:57** (`a725d4788`, "complete phase 00 truth reset"):
- It produced `current-authority-map-2026-09-25.md`, snapshot commit `ac19f6d1e`.
- That map says it "Records current authority; does not promote, migrate, delete, or supersede any source".
- Its routing rule starts: "Use explicit declarations, not path, date, prose quality, or a bare `Canonical:` metadata field".
- Its vocabulary (`promoted`, `candidate`, `legacy-current`, `conflicted`, `non-authority`) shows that several authority rules coexisted.

**Independent frontier review prompt** (`independent-frontier-review-prompt.md`). It frames the decision under review as:

> "fgOS currently has fragmented platform-documentation authority: promoted and candidate areas under `docs/platform/**`, legacy/current material under `docs/specs/**` and `docs/architect/**`, root-level authority documents, and shipped skills/instructions that still encode legacy paths."

**First review** (`independent-frontier-review-2026-09-25.md`, Claude Opus via fgOS dispatch, advisory only). Verdict: "PROCEED WITH REQUIRED CHANGES, for Phase 00 only". The most important finding is the one that reveals the real state. Quote:

> "The plan is aimed at a clean two-system repository. The live repository already has per-area authority flips, three user-doc systems, and decision history stored in `docs/specs`."

Critical finding C1 reads, in part:
- "`docs/platform/packaging-distribution/`, `host-invocation-routing/` and `agent-coordination/` all carry 'Canonical: Yes, after review'."
- "Three authority rules are live at the same time and disagree": `docs/reading-map.md` section 3, `docs/specs/reading-map.md:7`, and the agent-coordination portal.

C2 reads: "Deleting legacy platform paths needs a way to look them up afterwards, and that doesn't exist before cutover."

The review also says its shell was blocked, so the `5c948d2a4` ancestry, `fgos doctor` output and `rg` consumer counts were "not independently verified".

**Re-review** (`independent-frontier-rereview-2026-09-25.md`, Gemini 3.1 Pro High). Verdict: "PROCEED WITH REQUIRED CHANGES for Phase 00 only; migration execution remains unauthorized." Findings:
- H1: drift detection is not a write freeze.
- H2: relocating evidence payloads could break runtime readers.
- M1: whether locked laws L5/L8 hardcode the moved paths is unproven.
- M2: the claim ledger has no durable home.

### 1.5 The earlier pressure that created the doc split

The stated problem was an accumulation of the 2026-09-15 to 09-20 per-area promotions, not one event. Evidence for the accumulation:
- The independent review counts three promoted areas with retained legacy sources.
- The 2026-10-06 harness synthesis (`plans/reports/harness-investigation-261006-synthesis.md`, V11) lists the symptom as: "Foundation: 3 bản; reading-map: 2; `AGENTS.md` trỏ 2/3 bản; 5 gốc docs ngoài governance; `plan.md` ở 3 chỗ".
- That synthesis post-dates the plan, so it is corroboration and not the trigger.

## 2. Timeline, about 2026-09-15 to 2026-10-06

| Date and time | Event | Source |
|---|---|---|
| 2026-09-15 03:13 | `docs/doc-governance.md` and `docs/platform/README.md` land. Per-area migration is the governing method. | `23fb220e3` |
| 2026-09-20 | Proposal "Last reviewed" date. Draft authored around here. Origin unverified. | proposal header at `2085d88fe^` |
| 2026-09-21 23:23 | Proposal first committed, in a mixed commit about coordination refactoring. | `ca854f443` |
| 2026-09-25 13:57 | Phase 00 truth-reset done. Authority map snapshot at `ac19f6d1e`. | `a725d4788` |
| 2026-09-25 16:18 | Phase 01 "authority switchboard, ratchets, and inventories" implemented. | `2b2ee26d1` |
| 2026-09-25 | Two independent reviews (Opus, then Gemini). Plan revised after the first. | review files in `archive/doc-260925-lineage` |
| 2026-09-25 to 09-26 | Phase 01 review remediation and Phase 02 inventory work (inventory phase closed 09-26 12:41 to 13:46). | `f98e94d31`, `c953d35d1`, `97c046eb7`, `d78c20ac0` |
| 2026-09-26 22:43 | Commit `2085d88fe` "docs: establish documentation authority unification plan". Adds the 704-line `plan.md`, the three review files, and edits to `doc-governance.md`, `docs/platform/README.md`, `reading-map.md`, `intent-preservation-ledger.md`, the proposal, and the knowledge-registry plan. 10 files, 1524 insertions. Plan status "Proposed — not authorized for execution". | `git show 2085d88fe --stat` |
| 2026-09-26 22:43 | The same commit demotes the old `plans/260825-1841-knowledge-registry/plan.md` to "historical implementation plan" and deletes its main-checkout-only execution boundary. | `git show 2085d88fe -- plans/260825-1841-knowledge-registry/plan.md` |
| 2026-09-29 18:51 | Plan converted to AgentKit phase-file format: `plan.md` shrinks from 704 lines to a phase index, ten `phase-NN` files, renumbered from 1, with legacy-number mapping. | `4d80eaf29` |
| 2026-09-29 23:40 | Plan adds a cost-aware review harness, "gated on Observe plans". | `551687021` |
| 2026-09-29 23:45 | Advice report on running the plan through the fgOS harness with the right executors. Diagnosis: the harness routes docs work as code (`capability: code:*`). | `plans/reports/advice-260929-2345-doc-authority-harness-executor-routing.md` |
| 2026-10-06 | Harness-investigation synthesis (item H6) finds the plan had already run partway on its own branch. | `plans/reports/harness-investigation-261006-synthesis.md` |
| 2026-10-06 16:29 to 16:39 | Resume: main merged into the plan branch (`b9fee1e56`, `6b8ef0e8d`), inventory regenerated, claim "Dev / Source Activation" put in `dropped-claims-register.json`, resume report committed. | `73142f7d6`, `3c5080b06` |
| 2026-10-06 (owner decision) | The plan runs in a separate chat session. The investigation chat only completes plan and intent, runs no phase. Only the script fix (a) item 1 is allowed, at the start of Phase 4. | synthesis section on H6 |
| 2026-10-07 to 10-08 | Phase 4+ work resumes under review gates (many `docs(unification)` and `docs-gates` commits). | `bc63a17af` through `aa688258b` |

Notes on the 2026-10-06 resume and rewrite:
- The resume agent merged main into the plan branch. Main was 400 commits ahead; the branch had 59 commits not on main (`plans/reports/resume-261006-1635-doc-authority-unification.md`, section 1).
- It regenerated the inventory. Files in scope went 4,305 to 4,311, claim units 85,772 to 86,085, consumer edges 98,406 to 101,286 (same report, section 2).
- Two inventory-generation failures were recorded: the generator ran out of memory, with exit 134 at a 4 GB heap and exit 137 at 7.5 GB after 44 minutes. The generator was reading its own roughly 250 MB inventory JSON. This became "script fix (a) item 1".
- The report states "Từng đơn vị mất thật hay chỉ đổi chỗ: UNPROVEN" for 43 claim units that disappeared.
- The synthesis admits an earlier wrong statement: "Em đã nói sai ở lượt trước ('không thấy dấu hiệu phase nào chạy')". The plan on main still said "Proposed — not authorized", which was stale against the branch.
- A pending Lead edit (memory note `project_doc_plan_260925_evidence_out_of_docs_deferred.md`, 2026-10-10) says to add "a Parent: line to plan.md header naming docs/platform/proposals/documentation-system-unification.md". So the first version had no `Parent:` line; it had `Long-horizon source:` instead.

I could not find a single plan-rewrite commit dated exactly 2026-10-06 that restructures the plan. The restructuring I found is `4d80eaf29` (09-29), plus a plan update "using `ak:plan`" mentioned in the synthesis (H6 text). Treat "the 10-06 rewrite" as unverified beyond that.

## 3. The problem, in the plan's own first-version words

Source: `git show 2085d88fe:plans/260925-documentation-authority-unification/plan.md`.

Header block:

> "Plan status: Proposed — not authorized for execution
> Primary objective: Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**
> Long-horizon source: docs/platform/proposals/documentation-system-unification.md
> Historical foundation: plans/260825-1841-knowledge-registry/
> Risk: Critical documentation migration"

Section 1, Mission:

> "fgOS currently has a newer, deliberately governed platform documentation tree under `docs/platform/**` and older/current authority distributed across `docs/specs/**`, `docs/architect/**`, and several root-level documents. The immediate mission is to end that split without losing any retained claim, rationale, contract, decision, proof, or preserved intent."

> "The intended result is not a cleaner-looking directory tree. The result is: one platform claim → one canonical owner → one explicit authority route → one maintained physical document"

Section 2.1, The hot problem:

> "Readers and agents currently encounter a fragmented authority state, not a clean two-tree split: promoted or candidate targets `docs/platform/**`; legacy/current detail `docs/specs/** + docs/architect/**`; root authorities platform-foundations, io-contract, backlog; shipped path conventions: core/domain skills and generated instructions"

> "`docs/reading-map.md`, `docs/specs/reading-map.md`, accepted governance, and always-loaded instructions therefore express different migration rules."

Section 2.4 snapshot says the knowledge registry reports "479 docs/topics: 147 active and 332 provisional". The re-review (finding L1) flags that count as possibly inconsistent with an earlier all-provisional observation, so treat it as unverified.

The first version names no failing run or incident as cause. Section 3, "Locked Program Decisions", includes:
- Decision 5: "Completion of the authority flip is atomic for the platform-documentation system."
- Decision 12: "No scope reduction by omission."

## 4. Open questions

1. Where is the original design discussion (the 2026-09-20 chat) that produced the proposal? It is not in `plans/reports`, the memory notes or git. Ask the owner or search session logs, which I did not read.
2. Did anything specific happen between 2026-09-15 and 09-20 that made the split painful, such as an agent failing to find the right doc? I found no such report. The review's findings describe a state, not a trigger event.
3. Is the "10-06 rewrite" the `ak:plan` update mentioned in the synthesis, and which commit holds it? I found `4d80eaf29` (09-29) as the structural rewrite and `73142f7d6` and `3c5080b06` as the 10-06 resume. No larger 10-06 `plan.md` rewrite commit was found.
4. The authority-map snapshot is at `ac19f6d1e` while the Phase 00 commit is `a725d4788`. Confirm the plan's authority map was not regenerated between them. Unverified.
5. The memory file `project_doc_plan_260925_session_roles.md` names a "closed investigation chat" ("Conan replaced it"). Its transcript may hold the earliest framing. Unverified and not read.
6. `2085d88fe` was committed on main while the work lived on the plan branch. I did not establish how the plan docs reached main on 09-26, or whether that was a cherry-pick. Unverified.
