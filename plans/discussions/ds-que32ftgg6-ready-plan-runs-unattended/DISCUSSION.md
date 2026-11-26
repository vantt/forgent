---
id: ds-que32ftgg6
title: "A ready plan runs unattended: what `ready` must guarantee so the owner can walk away"
status: open
source: []
created: 2026-11-26
---

discussion: open

## Seed

Split out of ds-jxoz3h2qgk-when-to-ask on 2026-11-26 at 11:45. The owner had asked whether to split it, and its shaper decided yes. The supervisor asked for this directory in its reply to coordination event 40cb311fe7105ff0. Park owner questions in the question store instead of waiting on them.

- **Owner's pain (chat, 2026-11-26 11:38):** the owner believes every question was settled in the plan and walks away trusting it will be delivered. On return, the plan holds silly questions and sometimes has not even been activated.
- **Outcome:** `ready` means the plan can run to `done` without the owner, not only that it is written and passes the shape check. Every question that could be foreseen is answered when the plan is approved.
- **Scope (candidate parts, none settled):**
  - the footprint is traced to the place where the change really runs, not listed by reading code;
  - every verify step names an executor that can actually run it (a confined head cannot run full suites, activate a release or remove worktrees);
  - the plan states its cleanup at the end (worktrees, branches);
  - the plan's outcome separates the core goal, released first, from the cleanup goal, done later;
  - fallbacks for foreseeable deviations ("if X cannot be done inside the footprint, record it as named debt for the cleanup phase") are approved together with the plan.
- **Evidence:** `../ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md` and ds-jxoz3h2qgk §5 round 7. About 140 of the 163 owner questions (2026-11-19 to 2026-11-26) were asked after a plan existed. The foreseeable classes:
  - footprint widen: 40 questions (missed files such as `src/cli/command-registry.mjs` and `apps/fgos/src/routing.rs`);
  - confined head lacking hands for a host step: about 45;
  - cleanup: 18;
  - acceptance deviations from an outcome that bundled the core and the cleanup: 8 (component-authority-doors: q-lnjt5zzbfq, q-aanvfxaopa; authority-declare-update: q-trgzaa34ua).

  Three plans account for 66 questions: 261122-0118-heads-stable-and-able (29), 261121-2110-component-authority-doors (22) and 261120-0625-work-data-model (15).
- **Interfaces:**
  - ds-3in4yb5thk-backlog-to-ready-pipeline owns the flow to `ready` (when to plan, in what order, pull timing); this discussion defines what `ready` guarantees.
  - ds-jxoz3h2qgk-when-to-ask owns the execution-time ask rule (four-part model: goal, direction, action, consequence; ask only on a deviation from the goal that no direction avoids). That rule remains the last safety net.
  - ds-mzyircswox-widen-a-running-plan-footprint owns the door that widens a running plan's footprint.
- **Read first:** `core/skills/_shared/plan-contract.md`, `scripts/plan-contract-check.mjs`, the fgos-coding-planning and fgos-coding-validating skills, and the plans named in the evidence.

## 1. Trạng thái hiện tại

Round 1, 2026-11-26 12:20 +07 (shaper head `ready-plan-runs-unattended`). Domain: coding, platform work on the plan contract and the planning and validating skills (`domains/coding/AGENTS.md` only routes to `fgos-routing`; the doctrine read is `core/skills/_shared/plan-contract.md`, `fgos-coding-validating` and the supervisor's admission rule).

What the scout found (§3 has the detail): today `ready` means "the contract check passed": keys, sections, waves and footprint overlap. Nothing in the contract, the check or the validator asks whether the plan can run to `done` with nobody's hands. The validator's feasibility matrix tests risky assumptions, not who runs each step. Every one of the five seed parts is unguarded, and a sixth gap showed up: a plan can say `ready` and never be started, silently. Three legacy plans sit at `status: ready` today with no footprint, so admission drops them as `footprint-empty` and nobody is told.

Leanings L1-L5 (§3 rows 2-6) are proposed; L6 moved to ds-ipvis4jkpc in round 2 (§3 row 7). They are not settled; no D-ID. In one line: the plan gains one section, "Unattended run", that names the executor of every host step, the cleanup, the core-versus-debt split of acceptance, and the deviations pre-approved with it; the contract check makes `ready` refuse a plan without it; and the `delivery` flag of ds-ipvis4jkpc decides whether it starts.

Round 3 (13:42): the owner answered Q1 in chat (§3 row 8): the standing rule becomes process law with no approval; the owner settles only plan-specific matters. The owner said not to hand off to a planner yet; the discussion stays open. Next: draft the standing rule (§6). No owner question open.

Round 4 (13:55): the standing rule's draft U1-U6 is in §6 for the owner to read. Open: one wiring list for U1 (§3 row 10), and whether `release run` is the full-gate door (§3 row 11).

Round 5 (14:05): owner direction, no hardcoding. §6 now places the rule as ACE rule units selected by `workflow`/`stage`/`domain` (core unit for the guarantee, coding unit for footprint tracing), with doors, executors and wiring sets read from data. Open: §3 rows 10, 11, 12.

Round 6 (14:35): owner accepted U5 as written; D1 minted for the three sources of pre-decided answers. Next: scout §3 rows 10, 11, 12.

Round 7 (14:52): owner clarified plan splitting (§3 row 13): parallel split always; staged compatibility releases are optional, and one big step with a computed reverse path is allowed when the agent's whole change takes hours. Draft U7 in §6.

Round 8 (15:30): scouted §3 rows 10-12. Leanings: wiring set from prior-art commits plus drift checks (row 10); full gate after land through the supervisor's `release run`, reversed by reverting the plan's lands (row 11); rule units keyed by core stage and role (row 12). No owner question needed.

## 2. Mục tiêu & đề bài

The owner settles a discussion, a planner writes the plan, the plan goes `ready`, and the owner walks away believing every foreseeable question is answered. On return he finds the plan stalled on questions he calls silly, or never started at all. Of 163 owner questions from 2026-11-19 to 2026-11-26, about 140 were asked after a plan existed, and the large classes were foreseeable at planning time: 40 footprint widens, about 45 "hands" requests from confined heads, 18 cleanups, and 8 acceptance deviations from outcomes that bundled the core with the cleanup. Three plans produced 66 of them. The goal is that `ready` means "can run to `done` without the owner": every foreseeable question is answered when the plan is approved, so the only questions left at run time are genuine deviations that the four-part ask rule of ds-jxoz3h2qgk-when-to-ask lets through. This discussion defines what `ready` guarantees and how that is checked. It does not own the flow to `ready` (ds-3in4yb5thk-backlog-to-ready-pipeline), the run-time ask rule (ds-jxoz3h2qgk-when-to-ask), or the door that widens a running plan's footprint (ds-mzyircswox-widen-a-running-plan-footprint).

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | What `ready` checks today | **Rõ** | `plan-contract.md` §5: "`ready` is set last, and only after the check passes". `scripts/plan-contract-check.mjs` checks frontmatter keys, body sections, the Authority map, waves and footprint overlap. `fgos-coding-validating` Step 3 (feasibility matrix) checks assumptions the risk map flags; its Gate is usually auto-approved by `fgos gate-check`. Nothing names who runs a step, what is cleaned up, or which acceptance may slip. |
| 2 | **L1, footprint traced to where the change runs** | Leaning | Of the 40 widens, about 15 are the same wiring set for a new verb or route: `src/cli/command-registry.mjs`, `apps/fgos/src/main.rs`, `apps/fgos/src/routing.rs`, `packages/host-runtime/rust/src/catalog.rs`, `packages/host-runtime/contracts/command-manifest.json`, `test/rust-host/vectors/envelope/version.json`, `test/cli/subcommand-flag-drift.test.mjs`, `packages/supervision/rust/observe-kinds.json`, `bin/fgos.mjs`, `apps/fgos/src/wiring/*.rs` (q-6rdolvgvz2, q-sieckdvccb, q-klz3vkxjee, q-75yeaifwzn, q-lnq3nbjssw, q-qzchcwl7ya, q-ep6wknrzop, q-vqyxe5oi6j, q-myvzcbz3sx, q-qki26cwunf, q-d5mrno2mfk). Most of the rest are references to a changed or deleted symbol or file: tests, docs links, callers (q-ms5ifcqex6, q-5roz2uy3sa, q-4aalqblcof, q-pegjald5eu, q-xcuwpxa4kn, q-bioobcr52m, q-swxkda2x5r). Proposed: two tracing rules in the planning skill. (a) A new verb, route or record kind adds its whole wiring set, read from one list the repo keeps, not from memory. (b) A changed or deleted symbol or path adds every reference that `rg` and the impact tool return. Widening stays possible at run time through ds-mzyircswox's door, so a miss costs minutes, not a question. |
| 3 | **L2, every verify step names an executor that can run it** | Leaning | About 45 hands questions asked the owner to run a full suite, activate a release, remove worktrees, patch config or run `fgos git recover`. Plan 261124-0004-heads-operate-without-owner (done 2026-11-25) built the window: a head sends an `fgos` argv, the table `packages/session-host/contracts/head-permissions.v1.json` answers allow, ask or deny, and `fgos can-i <argv>` asks it without running. Hands questions still came after it (q-okdzvolti3, q-bvvdct5edg on 2026-11-25/26). Proposed: the plan lists each host step as an argv with its executor persona; the check (or the validator, where the table needs a live head) resolves each one against the table; an `ask` row is answered by approving the plan, so it never reaches the owner again at run time; a `deny` row means the plan is not `ready`. |
| 4 | **L3, cleanup stated in the plan** | Leaning | 18 cleanup questions (worktrees, branches, duplicate runs). The land door already removes a landed branch's worktree (`docs/platform/supervision/spec.md`, landed-worktree removal, backlog p-6sd4fslxv7). What is left is superseded or failed worktrees and leftover branches. Proposed: one fixed cleanup rule in the contract (the lead removes its superseded worktrees and merged branches through the delivered-to-main door, and lists unmerged ones in its closing report), so no plan has to invent it and no lead has to ask. |
| 5 | **L4, outcome split into core and cleanup** | Leaning | The three acceptance deviations where the owner overrode the recommendation (q-lnjt5zzbfq, q-aanvfxaopa, q-trgzaa34ua) all asked whether a remainder may become named debt or close on focused proof. Each time the owner chose to ship the core and keep the rest as debt. Proposed: each acceptance criterion is marked `core` or `debt-ok`; a `debt-ok` criterion that cannot be met inside the footprint becomes a named backlog row and the plan still reaches `done`; a `core` criterion that cannot be met is the real deviation that ds-jxoz3h2qgk's rule asks about. |
| 6 | **L5, deviations pre-approved with the plan** | Leaning | Rows 3-5 cover the classes seen. Proposed: one table "if X happens, do Y" for anything else the planner foresees, so the run-time rule finds an answered direction instead of asking. Depends on row 8 (who approves it). |
| 7 | **L6, a `ready` plan that is not started says why** | **Moved out (round 2)** | Owned by ds-ipvis4jkpc-release-chain-command, not here. Its D5 splits `ready` (quality: the plan is complete) from the `delivery` flag (the owner wants it delivered); its acceptance (1) admits no `ready` plan without `delivery`, and (3) makes an admission reject name its finding (cycle, dangling `blockedBy`, collision, empty footprint). The three legacy `ready` plans with no footprint are that discussion's evidence, handed over. This discussion owns only the quality half: what `ready` must guarantee. |
| 8 | Who approves the pre-decided answers, and when | **Rõ (owner, chat 13:41), D-ID next round** | Three sources. (1) The owner decides the core / `debt-ok` split of acceptance when the discussion settles. (2) The standing rule for the repeating classes (cleanup through the safe door, host steps run by the supervisor through the permission table, `debt-ok` becoming a named backlog row) is recorded as process law in the plan contract and skills; the owner does not approve it separately. (3) Anything plan-specific a planner wants beyond that rule asks the owner once, batched, before `ready`. Owner: "cái anh phải chốt là những vấn đề riêng của plan thôi". q-ypgj7zverd cancelled with this answer. |
| 9 | Mechanical check or reviewer judgment | Leaning | Structural parts (the section exists, every host step names an argv and executor, every criterion is marked `core` or `debt-ok`) go into `plan-contract-check.mjs`, so `ready` refuses without them. Completeness of the footprint trace stays the validator's judgment, helped by the wiring list of row 2. |
| 10 | Where the wiring set of a new verb or route comes from | **Leaning L10 (scout, round 8)** | No list is needed, in a rule or in the model. Door rows own one job each (e.g. `verb-manifest-projection`), but no row says which doors a new verb passes. The repo already holds the answer twice. (a) Prior art: the last commit that added the same kind of entry point lists its files, e.g. `799f40349` (new verb: `apps/fgos/src/routing.rs`, `cli_projector.rs`, `wiring/mod.rs`, `wiring/<x>.rs`, `command-manifest.json`, `command-routes.json`, `command-route-annotations.json`, `src/cli/command-registry.mjs`, Cargo files), `b98c5d788` (verb on an existing crate), `31dcaab69` (head-request verb: `head-request.v1.json`, `head-grants.mjs`, `head-request.mjs`). AGENTS.md already requires this prior-art step (`git log -S`). (b) The drift checks that fail on missing wiring (`scripts/export-command-selectors.mjs --check`, `test/rust-host/command-routes.test.mjs`, the flag-drift test) name what is missing. So the coding rule unit says: copy the file set of the nearest earlier commit that added the same kind of entry point, then add what the drift checks name. No new mechanism (RUL104). |
| 11 | Who runs the full gate on a plan's integrated tree | **Clear (scout, round 8); leaning L11** | No door does it today. `fgos release run` runs the recipe's `checks` (`npm test`, `cargo test --workspace`, owner q-dhhezn67em) "from the project root" (`.fgos/config.yaml` `release.checks`), i.e. on main after landing, then `fgctl upgrade`, the probe, and `fgctl repair` on failure. The land door's `land.gates` do run unconfined on the merge candidate, but only focused tests (`{tests}`), cargo fmt, the one-door scan, the selector check and the plan check. Unit sandboxes cannot run the full suites (the hands evidence). Options: (A) acceptance "full gate green" is met after the plan's lands by the supervisor's `release run`, whose checks are the full suites; a red run applies nothing, and the reverse path is reverting the plan's lands (fits U7: one step, then a strict check). (B) a new door that runs the release `checks` on a named worktree before landing. Leaning A: it uses existing doors and adds nothing (RUL104); its cost is that a red full gate is found on main, where it blocks other lands until reverted. B only if that cost shows up in practice. |
| 12 | **Placement: rule units via ACE/ASC, not hardcoded** | **Leaning (owner direction round 5; scout round 8)** | Keys: `stage` and `role`, not a workflow preset id. Core stages are settled prior art (ds-ubqlutna6r A5: Init, Discover, Clarify, Plan, Execute, Retrospective; stages come from the item's workflow). The guarantee unit applies at `stage: Plan` for the planner and validator, and its closing half (U3, U4) at `stage: Execute` for `role: lead`; the coding tracing unit adds `domain: coding`. ds-3in4yb5thk is reshaping how the lifecycle maps onto workflows (its §3 rows 11-13) and will not hand to a planner directly; if it renames the core stages, these keys follow it. |
| 13 | **Two ways to split a plan; the second is a mindset choice** | **Leaning (owner, round 7)** | Owner 14:52 corrected the round 6 framing (there is no tension with parallel phases). (1) Split a plan into the smallest pieces that can run in parallel: always right, unchanged (`plan-contract.md` §4). (2) Splitting into step-by-step releases that each keep the running system stable and compatible is a human-era habit: work a person needs 7 days for becomes 7 releases, each carrying temporary compatibility and stability work that is removed after the last one. An agent does the same work in about 2 hours, so it may instead take one big step: temporary disruption inside it, done when it ends. Condition: before starting, it works out a real reverse path (seal the state first, including state outside the worktree), never "just do it". This is a decision lens (cost of waiting vs cost of being wrong), not a mandate: the planner chooses per plan. Fits L10 and RUL104 (move every caller and delete the old path in the same change). Lands as U7 in the core rule unit (§6). |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Nguồn / rationale |
|---|---|---|

| D1 | Pre-decided answers come from three sources. (1) The owner marks each acceptance criterion `core` or `debt-ok` when the discussion settles. (2) The standing rule for repeating classes is process law, recorded with no owner approval. (3) Anything plan-specific beyond that rule asks the owner once, batched, before `ready`. The owner settles only plan-specific matters. | Owner chat 13:41 (§5 round 3), held unchanged through rounds 4 and 5; q-ypgj7zverd cancelled with this answer. |

U5's list (§6) was accepted by the owner in round 6; it becomes a D-ID after one more round without change.

## 5. Q&A log

- 2026-11-26 12:20 +07, shaper, round 1: Scouted `plan-contract.md`, `plan-contract-check.mjs`, `fgos-coding-validating` (feasibility matrix and Gate), the supervisor's admission rule and `admissible()`, plan 261124-0004-heads-operate-without-owner (the permission window and `fgos can-i`), and the 163-question evidence file of ds-jxoz3h2qgk. Mapped each foreseeable class to a missing guarantee (§3 rows 2-7) and found a sixth gap: a `ready` plan that admission skips gives no reason, and three legacy plans are stuck that way today. Proposed L1-L6. Parked Q1 (row 8): the pre-approval idea needs an approval moment that does not exist per plan today.

- 2026-11-26 13:40 +07, owner (chat), round 2: asked whether this discussion is about the plan's `delivery` field. Shaper: no. `delivery` is the owner's intent to deliver (D5 of ds-ipvis4jkpc-release-chain-command), and the flow to `ready` is ds-3in4yb5thk; this discussion owns only what `ready` guarantees (quality). L6 duplicated ds-ipvis4jkpc acceptance (1) and (3), so it moved there (§3 row 7).

- 2026-11-26 13:41 +07, owner (chat), round 3: agrees with all three sources of pre-decided answers. Source 2 needs no approval: it is recorded and turned into process law. The owner settles only plan-specific matters. Then (13:42): do not hand off to the planner yet. Shaper: discussion stays open; q-ypgj7zverd cancelled with the chat answer; next round drafts the standing rule's text in §6.

- 2026-11-26 13:55 +07, shaper, round 4: owner asked for the standing rule's draft. Wrote U1-U6 in §6. Scout: the supervisor row of `head-permissions.v1.json` already allows `release run`, `git recover`, `worktree remove --delivered-to` and `config patch`, so the routine hands classes have a door; U2 routes them there. Two gaps opened (§3 rows 10, 11).

- 2026-11-26 13:50 +07, owner (chat), round 5: the system must not hardcode; the orchestrator pushes an item to a workflow, and the workflow needs to know its related rule set (may need to work with ASC and ACE). Shaper: read `docs/platform/agent-context-engine/spec.md` (rule units in three roots, `when:` keys incl. `workflow`, `stage`, `domain`, `persona`, `role`; ASC selects per start). Re-placed §6: the guarantee becomes a domain-free core rule unit, footprint tracing a coding domain unit, and the doors, executors and wiring sets stay data (permission table, release recipe, authority model). The check enforces shape only. §3 rows 10 and 12.

- 2026-11-26 14:35 +07, owner (chat), round 6: "ok U5": accepts the five beyond-the-rule classes as written, including the U4 default (an unmarked criterion counts as `core`). Asked to have the three scout points (§3 rows 10, 11, 12) explained. Shaper: minted D1 for §3 row 8 (stable since round 3).

- 2026-11-26 14:40 +07, shaper, round 6: received by mail the hand-off of ds-jxoz3h2qgk round 10 (owner view on plan shape: one big sealed step). Verified against that discussion's §5 lines 95-96. Recorded as §3 row 13, open.

- 2026-11-26 14:52 +07, owner (chat), round 7: the round 6 framing was wrong. Splitting into the smallest parallel pieces is always right. What the agent era changes is the other kind of split: step-by-step releases that keep the running system stable and compatible (7 human days = 7 releases, much throwaway compatibility work). An agent finishing in hours can take one big step with temporary disruption, but only after computing a reverse path, never blindly. "Cost of waiting vs cost of being wrong" is a lens for choosing, not a rule that forces. Shaper: restated as §3 row 13 and U7 in §6.

- 2026-11-26 15:00 +07, owner (chat), round 7: asked to find every place that mentions this idea and add the detailed explanation, "không thì sai bét". Shaper: correction to the 14:40 entry above, which called the hand-off "one big sealed step" as a plan-shape rule; that framing is wrong, see §3 row 13 and U7 in §6, which now carry the owner's full explanation. Other mentions: ds-jxoz3h2qgk §5 rounds 10 and 11 (owned by its shaper, file being edited by that head); the explanation was sent to that shaper by mail to add.

- 2026-11-26 15:30 +07, shaper, round 8: owner asked to scout the three open points. Row 11: `release run` runs the full suites on main after landing, not on a plan branch; land gates run unconfined but only focused tests; leaning A (full gate after land through `release run`, reverse by reverting the plan's lands). Row 10: the wiring set comes from the nearest earlier commit adding the same kind of entry point plus the drift checks; no list. Row 12: key the rule units by core stage (A5) and role, not by preset id.

## 6. Thiết kế đã chốt {#design}

Draft, round 5 (2026-11-26 14:05 +07), for the owner to read; not settled, no D-ID. It is the standing rule of §3 row 8 source 2: written once as process law, no per-plan approval.

### Nơi luật sống: rule units, không hardcode (owner, round 5)

The orchestrator pushes an item into a workflow; the workflow learns the rules that apply to it from ACE and ASC, never from text copied into a skill or a script. So the standing rule is not written into `plan-contract.md`, a skill or `plan-contract-check.mjs` as fixed prose or fixed lists. It is split by who owns each part (ACE spec §4: rule units in `core/instructions/`, `components/<c>/instructions/`, `domains/<d>/instructions/`, selected by `when:` keys `workflow`, `stage`, `persona`, `role`, `domain`, `project`):

| Part | Owner and place | `when:` | Why there |
|---|---|---|---|
| The guarantee itself (U2-U5 below): host steps name a door and executor, acceptance marked `core` / `debt-ok`, the fixed cleanup, beyond-the-rule asks once | core rule unit, domain-free | `stage`: the planning and validating stages; `persona`/`role`: planner, validator; the run-side half (U3, U4 at close) `role`: lead | Every domain's plan needs it; it names no tool and no file. |
| How a footprint is traced (U1) | domain rule unit, e.g. `domains/coding/instructions/` | `domain: coding`, planning stage | Tracing a verb's wiring is coding knowledge; a marketing plan traces something else. |
| Which file set a new verb or route brings | data already in the repo: the nearest earlier commit adding the same kind of entry point, and the drift checks | (read by the coding unit) | No second list to drift (design principle 7). §3 row 10. |
| Which door runs which host step, and who may call it | data: the head permission table and the project's release recipe in `.fgos/config.yaml` | (read at plan time, e.g. `fgos can-i`) | The rule says "name a door and an executor the table allows"; the table and the recipe say which ones. Another project has other doors. |
| What the check enforces (U6) | the plan contract check, structure only: the section exists, each host step has an argv and executor, each criterion has a mark, each beyond-rule item has an answered `q-` id | n/a | Domain-free shape; it reads no domain list. |

ACE is "Not built (contracts and vectors only)" today. The rule units can land now in the current `core/instructions` / `domains/<d>/instructions` format, which the instruction composition already projects into agent files; ACE takes them over when it lands. `plan-contract.md` then points at the unit instead of restating it (one door).

### Luật chung: plan `ready` chạy được tới `done` không cần chủ

**U1. Footprint traced, not guessed (coding domain unit).** The planner builds the footprint by tracing, not by reading. For coding:
- a new verb, route, flag or record kind brings its whole wiring set (command registry, Rust routing and `main.rs`, host operation catalog, generated command manifest and its vectors, the flag-drift test, observe kinds, the Node entry where a Node payload still serves it);
- a changed, moved or deleted symbol or file brings every reference that `rg` and the impact tool return (callers, tests, doc links);
- a generated file is named as a hot file and regenerated, never hand-edited.
At run time, widening by a file that serves the plan's own acceptance is a direction, not a question; it goes through ds-mzyircswox's widen door. The wiring set is copied from the nearest earlier commit that added the same kind of entry point, plus what the drift checks name (§3 row 10); the rule lists no files.

**U2. Every host step has a named executor.** Every step that needs more than a unit sandbox is written in the plan as an exact `fgos` argv and the persona that runs it. In this project (forgent) the routine host steps resolve, from the permission table `packages/session-host/contracts/head-permissions.v1.json` and the release recipe, to the supervisor's window; the table below is that data read today, not text the rule carries:

| Step | Door | Executor |
|---|---|---|
| full gate on the integrated tree; release stage and activate | `fgos release run` (the project's recipe in `.fgos/config.yaml`) | supervisor |
| stuck land on main | `fgos git recover` | supervisor |
| remove a delivered worktree | `fgos worktree remove --delivered-to <ref>` | supervisor |
| config change already decided | `fgos config patch <file>` (protected paths refused) | supervisor |

A lead asks for these through `supervisor raise --kind coordination-help` naming the plan's listed argv, never through an owner question. A step whose argv the table answers `deny`, or that no door can run, makes the plan not `ready`. `release run` runs these checks on main after the plan lands, not on the plan branch; the full gate is met there and reversed by reverting the plan's lands (§3 row 11, leaning A).

**U3. Cleanup is fixed, not invented.** The land door removes a landed branch's worktree. The lead's closing step removes superseded worktrees whose tip is on main or on the branch that replaced them (through U2's delivered door), deletes merged branches, stops its own duplicate runs, and lists unmerged branches and dirty worktrees in its closing report without deleting them. No plan restates this; a plan states only cleanup that differs.

**U4. Every acceptance criterion is `core` or `debt-ok`.** The mark comes from the settled discussion, where the owner decides it (source 1). A `debt-ok` criterion that cannot be met inside the plan's frame becomes a named backlog row (`fgos identity mint backlog`), cited in the plan, and the plan still reaches `done`. A `core` criterion that cannot be met is a real deviation and goes to the run-time ask rule of ds-jxoz3h2qgk. A criterion the discussion left unmarked counts as `core`.

**U5. Beyond the rule asks once, before `ready`.** A planner that needs any of these puts them in one batched owner question before `ready`, and only the phases they touch wait:
- debt on a `core` criterion, or narrowing a `core` criterion;
- a new or widened trust boundary (a new grant, a sandbox read, a global config change, a `protectedConfigPaths` key);
- a new component or decision kind (`fgos authority declare`), or a change to a locked law;
- an irreversible step;
- a plan-specific fallback ("if X, do Y") the plan wants pre-approved.

Everything else in U1-U4 is decided by the agent and reported, never asked.

**U7. Choose how to split with "cost of waiting vs cost of being wrong" (a lens, not a mandate).** Owner explanation, 2026-11-26 14:52, kept in full so it is not misread:

- There are two different ways to split a plan. **(1) Split into the smallest pieces that can run in parallel.** This is always right and does not change (`plan-contract.md` §4: phases, waves, an integration phase).
- **(2) Split into step-by-step releases that keep the running system stable and compatible.** This is a habit from human-speed work and often does not fit when an agent is far faster than a person. Example: work A takes a person 7 days and an agent about 2 hours. A person plans the 7 days as 7 releases, and each release carries a pile of work only to stay stable and compatible with the old system part by part (shims, twins, staged migrations, temporary guards). All of it is thrown away when the 7 days end. An agent that finishes in hours should not plan that way. It can do the whole change in **one big step**: there may be temporary disruption inside the step, but when the step ends the work is done.
- **The condition:** before starting, the agent works out a real path to reverse. It never "just does it". The reverse path covers the state the step touches, inside the worktree and outside it (event store, config, release activation, remote), or the step does not touch outside state before it lands; and the closing check is strict, because it carries the weight.
- **Where it comes from:** the owner drew it from the angle "cost of waiting vs cost of being wrong" that the agents raised in ds-jxoz3h2qgk, and from the evidence that 193 hours went to waiting, much of it on side work of this kind.
- **It is a lens, not a rule that forces.** It is one consideration when choosing; the owner said so explicitly (ds-jxoz3h2qgk §5 round 11, 14:28: "a mindset used while deciding, not a large technical expectation"). Where the cost of being wrong is high and no reliable reverse path exists, staged releases stay a valid choice. The plan says which split it chose and why.

**U6. What the check enforces.** For a plan going `ready`, `plan-contract-check.mjs` fails when: the "Unattended run" section is missing; a host step has no argv or no executor; an acceptance criterion has no `core` / `debt-ok` mark; a U5 item is listed with no answered `q-` id. Completeness of the U1 trace stays the validator's judgment.

```mermaid
flowchart LR
  D[Discussion settles:<br/>owner marks core / debt-ok] --> P[Planner]
  L[Rule units from ACE via ASC:<br/>core U2-U5 + domain U1,<br/>selected by workflow/stage/domain] --> P
  P -->|beyond the rule| Q[One batched owner question<br/>U5]
  Q --> P
  P --> C{plan-contract-check<br/>+ validator}
  C -->|pass| R[ready]
  C -->|fail| P
  R -->|delivery flag, admission<br/>ds-ipvis4jkpc| RUN[Lead runs;<br/>host steps via supervisor window]
  RUN -->|core deviation only| ASK[Run-time ask rule<br/>ds-jxoz3h2qgk]
  RUN --> DONE[done]
```

## 7. Danh mục hạng mục / task {#tasks}

Filled once §3 settles.
