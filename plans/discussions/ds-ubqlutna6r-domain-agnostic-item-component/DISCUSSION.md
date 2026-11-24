---
id: ds-ubqlutna6r
title: "A domain-agnostic item component, split from Work, settled before Work"
status: open
source:
  - ds-wqsrwmiier
created: 2026-11-24
---

discussion: open

Opened by the shaper of `ds-wqsrwmiier` (HARDEN next round) at the owner's order of 2026-11-24 09:37 and 09:4x. Its premise
(§3 rows I1 and I2) was moved here from that discussion's rows N14 and N15. No shaper has been assigned yet; the secretary
arranges one, and a backlog row of its own if one is wanted.

## 1. Trạng thái hiện tại

**Round 3 (2026-11-24).** The owner corrected the shaper: a Workflow's lifecycle is needed. It lists possible
and forbidden routes that an organization sets, and those routes are its competitive edge (I11). Item, Workflow and view
stay as three layers (I9, I10). Open now: I12, whether routes live only in the guide (the D-ADR0070 design, which
retires the step graph at the coding cutover) or the step graph stays as a second route list. After that comes the
no-fgOS item contract (ids). Open rows: I4–I6, I9, I12.

## 2. Mục tiêu & đề bài

fgOS keeps items in two places today: the portfolio files under `plans/` (backlog items, discussions, plans; D-ADR0082) and
the Work store (`tsk-` items in the Event Store, on hold and frozen). Work also carries a mapping layer that keeps its core
domain-agnostic. The owner wants item storage and management (fields, properties, status, a step reference and triage)
split out of Work into one component of its own that no domain shapes. This must happen before Work's own phase opens,
so that Work's council can decide whether to keep, shrink or delete what is left of Work. The outcome is one item model with
one door: its authority, contract and Rust/Node boundary, the fields it holds, where the status FSM lives, and how domains
and Workflow attach to it without the component knowing them.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Evidence / note |
|---|---|---|---|
| I1 | **A domain-agnostic item-data component, apart from Work.** What already exists: D-ADR0079 and D-ADR0082 (2026-11-19) made the portfolio files under `plans/` (backlog items, discussions, plans) the source of truth, domain-agnostic. They made Work a replaceable UX layer on hold, and froze the old Work store; triage of the open Work items is its own backlog row. Owner questions and gates are already the `questions` component (tier 3, Rust). The supervision crate reads the portfolio (`portfolio.rs`, `discussion_source.rs`). **Gaps in the model:** (1) no component owns the portfolio item data. `fgos authority locate` falls back to `work-state` with a weak match, and supervision owns only "portfolio status and plan lane pool"; (2) `packages/portfolio/*.mjs` (item parsing, backlog index, check) is in no component's `paths`; (3) `work-state` still owns "questions, human gates" while `questions` owns "owner question shape" and "workflow gates", so two components own one job. What stays inside Work: work-item lifecycle (`tsk-` ids, stage, claim and return), its events, and `src/intake` (classification, risk keywords; the keywords are coding-specific). **Proposal:** declare one item-data component (items, ids, statuses, links, one write door, one check, per D-ADR0082), with domain-agnostic triage in it and domain rules left in `domains/`. Its boundary is settled in this discussion (A1); phase T7 then opens with "keep, shrink or delete Work". A new component needs the owner's answer (`fgos authority declare`). | premise (from `ds-wqsrwmiier` N14) | `plans/discussions/ds-an5r4pyyto-work-data-model/DISCUSSION.md` §2, §3 row 7, D-ADR0082; `components.yaml` rows work-state, questions, supervision; `fgos authority locate` 2026-11-24 |
| I2 | **The sensitive part: two item models and Work's mapping layer.** Today there are two item stores. (1) Portfolio (D-ADR0082, live): `p-` item files with `id, title, status, priority, area, created`, five statuses (`proposed, parked, in-flight, done, dropped`), plus discussions (`open, paused, settled`) and plans (`draft, ready, running, done, withdrawn`). It has no domain and no step. (2) Work (on hold, store frozen): `tsk-` items with about 26 fields, Event Store truth, and a fixed 10-status base FSM (`fsm.mjs`; no domain may change an edge, and the four tail statuses are shared). On top of that sits the **mapping layer that keeps Work domain-agnostic**. Each domain declares its steps and maps each one onto one of the five base-workflow steps (Init, Clarify, Decompose, Execute, Compound), along with its transitions, a skill per step, `worktreeBacked`, category labels for its head statuses, and valid `kind` and `risk` values. The core never reads a domain's step names; the engines ask the registry "which step of this domain is Clarify". Part of this layer has already moved: an item carries `workflowStep` instead of `stage`, and the steps, transitions and aliases live in Workflow definitions (`domains/<domain>/workflows/*.yaml`, `src/workflow/definition.mjs`), read through `src/state/domain-registry.mjs`. **Proposed direction for N14:** one item model, not two (one door). It starts from the portfolio model, since D-ADR0082 made it the truth and froze Work's store. It takes from Work only the fields a council proves are needed (for example status category, parent and deps, refs). The item component stores the step only as an opaque reference and never interprets it. Workflow owns step meaning and the mapping onto base steps, and `domains/` owns labels and value sets. Where the base status FSM belongs (item component or Workflow) is I3. | premise (from `ds-wqsrwmiier` N15); the direction is proposed, not yet put to the owner | `docs/platform/work-state/spec.md` §3 row 4, §5 "Workflow Step Replaces Stage", §6 Domain Model; `packages/portfolio/contracts/portfolio-vocabulary.v1.json`; D-ADR0082; decision 78 frame (§6 Shape) |
| I3 | Where does the base status FSM live: in the item component or in Workflow? | open; folded into I9 | I2; `fsm.mjs`; work-state spec §3 row 4 |
| I4 | Which Work fields does the item model take beyond the portfolio fields, and what proof does each need? | open | I2; work-state spec §3 |
| I5 | What happens to the `tsk-` items and Work's frozen streams: migrated, kept as read-only history, or triaged? The triage of Work's open items is already a separate backlog row (ds-an5r4pyyto round 12). | open | `plans/discussions/ds-an5r4pyyto-work-data-model/DISCUSSION.md` §3 row 7 |
| I6 | The component needs `fgos authority declare` (a new component needs the owner's answered question). There is also an overlap to fix: `work-state` owns "questions, human gates", while `questions` owns "owner question shape and states". Correction to I1: `questions` lists "workflow gates" under `mustNotOwn`, so it does not own them. | open | I1; `components.yaml` rows work-state (owns), questions (owns, mustNotOwn), read 2026-11-24 |
| I7 | **What the code holds today (scout, round 1).** (a) The live portfolio model is Rust: `apps/fgos/src/wiring/portfolio.rs` (1145 lines; parse, check, index, `create_item`, `edit_item`). `fgos land` uses it when it publishes a file (`session_write_publish.rs`), and so does `fgos migrate portfolio` (`migrate.rs`). It sits in the app's wiring layer, not in a crate, and no component row owns it. (b) `packages/portfolio/*.mjs` (699 lines) is a Node twin that only `test/portfolio/` imports. Its `mintBacklogId` makes its own random id instead of calling `fgos identity mint`, which goes against D-ADR0082 point 2. (c) No verb creates or edits an item: `create_item` and `edit_item` have only test callers. Items are written by hand and checked when `land --paths` publishes them, so D-ADR0082's "one write door" exists only as that check on landing. (d) Work's status FSM is `src/state/status-fsm.mjs` (328 lines, 10 statuses). Its step FSM is `src/state/step-fsm.mjs` (81 lines), which reads its legal moves from the workflow YAML. | settled fact | the files named; `rg` for callers, 2026-11-24 |
| I8 | **Overlap map (owner's prompt, 2026-11-24 09:54).** *What the item is:* portfolio item (`p-`, files, 5 statuses) vs Work item (`tsk-`, Event Store, about 26 fields, 10 statuses). Both hold id, title, status, priority and refs. *Where it stands:* (1) Work `status` (status-fsm, 10 statuses incl. `awaiting-approval`, `delivered`, `retrospective`, `cleanup`); (2) Work `workflowStep` (step-fsm, edges from the YAML *lifecycle part*: `steps`/`transitions`); (3) the Workflow *guide part* of the same YAML (`milestones`, case ledger in `src/workflow/case-*.mjs`; the file says "nothing reads this part until the coding cutover"); (4) plan `status` plus its phase table, run by the supervisor and lead; (5) backlog status, which the portfolio check partly derives (`in-flight` needs a citing file; drift against plan status). *Who moves it:* Work verbs (`move`, `take`, `return`, `approve`, `discover`, `plan`), Workflow (`workflow start`, case verbs, `fgos run`), `land` (plan `done` sets its items `done`), and hand edits. Status is decided in up to five places. Correction after the owner's framing (I10): the YAML's guide part is the Workflow *frame plus guide* as intended, not a duplicate. Whether the *lifecycle part* (`steps`, `transitions`, `aliases`, `statusSkills`) is redundant is no longer claimed: the owner says it lists possible routes, not one path (I11), and the question of where routes live is I12. | settled fact (map, corrected rounds 2 and 3); its resolution is I9 | `src/state/status-fsm.mjs` TRANSITIONS; `domains/coding/workflows/feature.yaml` lines 11–135; `src/workflow/case-*.mjs`; `apps/fgos/src/wiring/portfolio.rs` lines 1034–1128 |
| I9 | **Proposed split, revised to the owner's three layers (round 2, not yet a decision).** (1) *Item* = the portfolio file contract (plain Markdown and frontmatter under `plans/`, readable and writable with no fgOS). fgOS adds the id mint, the write door, the check and the generated index, which make the files more effective but are never required to read them. Domain-free and step-free; it holds coarse status `proposed/parked/in-flight/done/dropped` (plans: `draft…withdrawn`, discussions: `open/paused/settled`). (2) *Workflow* = frame (possibilities, MUST constraints, budget `frameDefaults`) plus guide (`decisions` with `should`/`mayInstead`), driving one item's work as a case that references the item id. It is the only owner of how work proceeds and never writes item fields except through the item door. (3) *Work, or whatever replaces it* = a view and control surface for people. It projects item status, case milestones and open owner questions into stages a person can follow; it owns no truth and no FSM of its own, and every control action it offers calls the item door or a Workflow verb. Consequences: Work's status FSM (`status-fsm.mjs`), step FSM (`step-fsm.mjs`) and the YAML lifecycle part lose their owner, and T7 decides their deletion or their reduction to a view mapping. A plan stays a portfolio file (it must work without fgOS); its phases are its own content, and when fgOS runs it, a Workflow case or units drive the execution and `land` writes the coarse status through the item door. | open; revised round 2 | I7, I8, I10 |
| I10 | **Owner framing (2026-11-24 10:00).** (a) A Workflow has two parts: a *frame* for one line of work (open: a set of possibilities and constraints that must not be exceeded, never a fixed path), taken from fgOS core experience or customized by an organization; and a *guide* that lets capable agents drive the work inside that frame. Workflow drives tasks by the guide today. (b) Work, in the owner's revised vision (or a system that replaces it), shows items and their stages and statuses so that a person can understand and control them easily. (c) The portfolio and work-item approach exists so that tasks and plans stay as generic as possible: a system without fgOS can still work with them, and with fgOS it works better. | owner statement, provisional (held 1 round) | chat 2026-11-24 10:00; matches `src/workflow/guide-schema.mjs` header and the guide part of `domains/coding/workflows/feature.yaml` |
| I11 | **Owner correction (2026-11-24 10:0x).** The lifecycle is still needed. It is not a hard path: it lists possibilities (many routes) and may list forbidden routes. Without routes being listed, an organization loses the chance to set its own routes, and those routes are where an organization competes. The earlier design was meant this way. | owner statement, provisional (held 1 round) | chat 2026-11-24 |
| I12 | **Where the routes live: guide or a separate step graph.** In the approved design (D-ADR0070, owner 2026-10-19, `docs/platform/workflow/spec.md`), routes are listed in the *guide*. Each decision point at a milestone names a SHOULD with its reason and the routes allowed instead (`mayInstead`). An unlisted route is allowed with a recorded reason, unless the point carries `listedRoutesOnly` (RUL-WF-5); MUST rows name absolute bans as guards; and `kind: playbook` makes every point `listedRoutesOnly`. The same spec keeps the YAML's lifecycle part (`steps`/`transitions`) only until the coding cutover and deletes it in that same change (RUL-WF-23; N12/N16, row "Work tuỳ chọn; `feature.yaml` giữ phần lifecycle tới cutover"). Read together with I11: the owner's concept (listed routes, forbidden routes, set by the organization) is what the guide carries. The open point is whether the step/transition graph also stays as a second, coarser route list (which supersedes N12/N16) or is retired at the cutover as planned, with Work's stages drawn from milestones for display. | open; needs the owner (touches an owner-approved decision) | `docs/platform/workflow/spec.md` lines 127, 269, 324, 473, 675; `domains/coding/workflows/feature.yaml` lines 111–175 |

## 4. Quyết định đã chốt

| D-ID | Decision | Rounds held | Source |
|---|---|---|---|
| A1 | Item storage and management is split from Work into its own domain-agnostic component, shaped in this discussion. | owner answer | `ds-wqsrwmiier` D19; chat 2026-11-24 09:37 |
| A2 | It comes before Work: phase T7 of `ds-wqsrwmiier` opens only after this discussion is settled and its plan has landed. | owner answer | `ds-wqsrwmiier` D19 |
| A3 | Inherited, not reopened: D-ADR0079 (the portfolio travels with the project; Work is a replaceable layer) and D-ADR0082 (the portfolio data model; the Work store is frozen). | prior decisions | `docs/platform/runner/decisions/h-36d872fbb0e5.md#d-adr0082` |

## 5. Q&A log

- **2026-11-24 09:4x — opened** from `ds-wqsrwmiier` at the owner's order ("thôi tách việc này thành 1 discussion riêng phải làm
  trước Work"; "move các chi tiết liên quan làm tiền đề cho thảo luận đó"). I1 and I2 were moved from that discussion's N14 and
  N15, with their evidence.
- **2026-11-24 09:42 — round 1 opened** by shaper `ds-ubqlutna6r`. The only open owner question (q-ozu6l2ioxa)
  belongs to the supervisor, not to this discussion. The owner asked for the goal in plain words, and the shaper
  restated it as the five points in §2 (boundary, item model, FSM location, attachment to domains and Workflow, old
  `tsk-` items). The scout facts are recorded as I7, and I1's claim about `questions` was corrected in I6.
- **2026-11-24 09:54 — owner:** "giờ có thể có một số overlap hoặc conflict hoặc làm dư thừa: portfolio vs work-item;
  Workflow vs FSM vs phần move trạng thái của work." The shaper mapped the overlaps (I8) and proposed one owner per
  question (I9), not yet put to the owner as a decision.

- **2026-11-24 10:00 — owner:** a Workflow is a frame (open: possibilities and constraints, from fgOS core or an
  organization) plus a guide that lets agents drive the work inside it; Workflow drives tasks by the guide today. Work
  (or its replacement) visualizes items and their stages and statuses so that a person can understand and control
  them. The portfolio and work-item approach keeps tasks and plans generic, so they work without fgOS and work better
  with it. The shaper recorded this as I10, corrected I8 (the guide part is intended; the YAML lifecycle part is the
  redundant one), and revised I9 into three layers: item, Workflow, view.

- **2026-11-24 10:0x — owner:** the lifecycle is still needed; it lists possibilities (many routes) and maybe
  forbidden routes, and without listed routes an organization cannot set its own, which is its competitive edge; the
  earlier design was meant this way. The shaper withdrew the "lifecycle part is redundant" claim from I8, recorded I11,
  and opened I12 with the D-ADR0070 evidence that the guide already lists routes and that the step graph was due to be
  retired at the coding cutover.

## 6. Thiết kế đã chốt {#design}

*Nothing settled yet beyond A1–A3.*

## 7. Danh mục hạng mục / task {#tasks}

*Filled once the shape is settled.*
