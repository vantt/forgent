---
contract: plan-v1
title: "H2 build step 2: the core write door (locate, grow with evidence, or hand off to admission), the retrospective writer as its first caller"
description: "Lift the retrospective writer's locate-grow-handoff steps into one core write-door procedure on fgos doc locate, make locate return exact mentions next to ranked candidates so a writer gets search and literal matching in one call, record the writer's locate, mentions and decision on grow, add the always-loaded pointer seed through the context engine, correct the documentation specs after the context engine landed, record what the door still cannot catch, and measure topics per retrospective item."
status: running
priority: P2
blockedBy: []
base: b64b2712624ca49a10d468ee4a27b37dec23fdc1
source:
  - p-ixrbglli5o
  - docs/platform/documentation/spec.md#4-build-order
  - plans/261113-0124-docos-retrospective-claim-units/plan.md
created: 2026-11-27
footprint:
  - plans/261127-1003-h2-step2-core-write-door/**
  - src/state/knowledge-registry.mjs
  - bin/fgos.mjs
  - src/cli/command-registry.mjs
  - test/state/knowledge-registry.test.mjs
  - docs/platform/work-state/contracts/knowledge-registry.md
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/documentation/rust/src/**
  - packages/documentation/rust/tests/**
  - packages/documentation/rust/observe-kinds.json
  - apps/fgos/src/wiring/doc_locate.rs
  - core/skills/_shared/write-door.md
  - domains/coding/skills/fgos-coding-knowledge/SKILL.md
  - .agents/skills/_shared/write-door.md
  - .agents/skills/fgos-coding-knowledge/SKILL.md
  - .claude/skills/fgos-coding-knowledge/SKILL.md
  - plugins/fgOS/skills/_shared/write-door.md
  - plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md
  - core/instructions/documentation-door.md
  - .fgos/instructions/effective/**
  - docs/platform/documentation/spec.md
  - docs/platform/documentation/subcomponents/write-door/spec.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
  - docs/platform/documentation/operations/how-a-document-is-written.md
  - docs/platform/proposals/documentation-system-unification.md
  - docs/platform/intent-preservation-ledger.md
  - docs/reading-map.md
  - plans/260925-documentation-authority-unification/plan.md
  - plans/261113-0124-docos-retrospective-claim-units/plan.md
  - plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md
  - plans/backlog.md
  - changelog.d/261127-1003-h2-step2-core-write-door.md
  - test/cli/knowledge-attest-gate.test.mjs
lead: head:lead-forgent-261127-1003-h2-ste-f47e4
---

# H2 build step 2: the core write door

Where H2 stands: the build order and the plan of each step live in
[documentation spec section 4](../../docs/platform/documentation/spec.md#4-build-order). Step 1 (locate through pkm)
landed in `efb1f5af3` (plan `261122-2217-docos-pkm-locate-door`). This plan is step 2. It replaces the draft
`261113-0124-docos-retrospective-claim-units`, written before the owner's 2026-11-24 decision (general door, not a
writer path) and before locate existed.

## Outcome

Any agent that writes documentation follows one core write-door procedure: draft the claim, find the unit that
already carries it with `fgos doc locate`, then grow that unit (a user knowledge unit gets one evidence line and an
attestation that records the locate result), ask when two units fit, or hand the claim to an admission request when
none does. One locate call answers both questions a writer has: which section should carry the claim (ranked
search, as today) and where else the same names appear (an exact, complete scan of the corpus on disk, new). A
document the scan finds but the search missed is flagged, and the writer must read it and say how each mention was
handled before attest or handoff accepts the record. The retrospective writer `fgos-coding-knowledge` is the first
caller and no longer searches with `rg`. What neither search nor scan can catch is written down in the spec as a
known limit, with the measurement that would close it. One always-loaded line, compiled by the Agent Context Engine, points every agent at the door. The documentation
specs say what the context engine now owns, and every place that names H2 links to the build order. New topics
per retrospective item are measured before and after.

## Facts (checked on `c4ff00277`, 2026-11-27)

| # | Fact | Evidence |
|---|---|---|
| F1 | Most of the draft plan already landed: the cleanup gate accepts a handoff to a live admission request as a fourth evidence kind, `fgos knowledge handoff` records it, and the knowledge skill follows write door 6.4 (claims, grow with an evidence line and attest, or hand off) | `4a731ffa9`, `26d61be01`; `src/state/cleanup-harness.mjs` `checkRetrospectiveContentForId`; `domains/coding/skills/fgos-coding-knowledge/SKILL.md` |
| F2 | The skill still locates with `rg -l -i` over `docs/knowledge docs/explanation docs/how-to` and says "`fgos doc locate` replaces this search when it lands" | skill step 2 |
| F3 | `fgos doc locate` is native (Rust), takes `--draft`/`--draft-file`/`--area`/`--question`, returns up to ten candidates with `path`, `title`, `section`, `excerpt`, `axes`, `outside_region`, plus `partial` and the index `state`; it covers the whole `docs/` vault minus past-state folders and `docs/distillery/` | `packages/host-runtime/contracts/command-routes.json` `doc.native_subcommands`; `packages/documentation/rust/src/port.rs` `Candidate`, `Answer`; document identity 8.2 |
| F4 | `doc.attest` records only `captureId` on a registry document; `capture.handoff` already records a locate result (`query`, `candidates[{path, section, why_not}]`) through `normalizeHandoffLocate` | `src/state/knowledge-registry.mjs` |
| F5 | Document identity 8.1 step 6 assigns "the writer's decision in the locate log" to the write door of step 2 | document identity spec 8.1, 14 |
| F6 | Code-level refusal of `topic register` / `doc reserve` without a locate result is an effect check at the doors, which admission (step 4) builds | admission spec 6.1, 6.5; documentation spec section 4 step 4 |
| F7 | The write-door spec defines "the write door" as a skill reached through a pointer line; step 5 builds "the skill and live templates on the core door that step 2 builds" | write-door spec 1, 2.1; documentation spec section 4 step 5 |
| F8 | Always-loaded rules are now rule units under `core/instructions/` with context-engine frontmatter; the pre-commit hook runs the engine's structural and nearest-rule checks on a staged unit, and the compiled set lives in `.fgos/instructions/effective/` | `docs/platform/agent-context-engine/spec.md` 4, 6.2, 7; `core/instructions/scratch-artifacts.md` |
| F9 | The context engine owns every fgOS rule (ids L1–L10, D-ADR, RUL, seeds), links pkm itself at the same tag and never depends on the documentation component | agent-context-engine spec 1, 2; plan `261125-1631-agent-context-engine` (ACE-D6) |
| F10 | Stale after the context engine landed: documentation spec section 2 ("a future area"), section 5 row A3, section 6.1 item 1 (rules as documentation claims), section 8 row "Agent Context Engine ... none"; write-door spec 11 item 1 ("the existing instruction registry renders it", "`fgos setup`") | those sections |
| F11 | No entry document links to the build order: proposal section 0 table and 9.2, H1 plan 12.1, `docs/reading-map.md`, intent ledger PF-I006 | grep, 2026-11-27 |
| F12 | Knowledge and doc verbs stay in Node until step S7 of the Rust verb migration | `plans/261114-2051-rust-verb-migration-program/plan.md` S7 row |
| F13 | The context engine work raised the shared pkm pin to `v0.7.1` for both crates; the documentation specs still name `v0.7.0` as the current pin | `packages/documentation/rust/Cargo.toml`, `packages/agent-context-engine/rust/Cargo.toml`; `acb2a6efa` |
| F14 | Locate has no exact match. BM25 splits names such as `doc.attest`, `--locate-file` or a path into words, embeddings blur them, and only the top 10 come back. The identifier boost of document identity 8.1 step 4 is deferred, and identifier extraction (5.6 kinds and registers) is not built | `packages/documentation/rust/src/port.rs`, `locate.rs`; document identity 8.1, 8.2 "Deferred" |
| F15 | Measured cases where text search loses to grep: grep opened the right earlier document in 19 of 20 duplicate cases, locate's path in 18; a Vietnamese note over English documents ranks a right unit in the top 3 for 0% of queries (91.7% after translation); English queries over the Vietnamese platform specs were never measured; 6 documents with invalid frontmatter were left out of the index. Grep lost on the decision (13/26 right against 19/26) | `plans/reports/measurement-261112-1314-docos-document-identity-recall.md` sections 6.2, 6.3, 7 |
| F16 | The locate corpus is `docs/` minus the past-state folders and `docs/distillery/` (`profile::excluded_globs`); the locate record keeps only draft digests and top paths (`doc-locate-draft-digests.v1`); `fgos doc locate --eval <gold>` measures a gold set on a ready index | `packages/documentation/rust/src/profile.rs`; `apps/fgos/src/wiring/doc_locate.rs` `locate_record`, `answer_eval` |
| F17 | Locate flags are declared in `src/cli/command-registry.mjs` and exported to `command-manifest.json` and `command-routes.json` by `scripts/export-command-selectors.mjs`; the Rust side parses them in `REPEATED_FLAGS` | those files |

## Decisions (planner, inside the owner's 2026-11-24 frame)

- **D1. The core door is a shared procedure on existing verbs, not a new verb.** `core/skills/_shared/write-door.md`
  holds the steps; any skill in any domain follows it; it calls `fgos doc locate`, `fgos knowledge attest`,
  `fgos submit` and `fgos knowledge handoff`. Reasons: F7 makes the door a skill and leaves the full skill to step 5;
  F12 means a new Node verb would be migrated again in S7; RUL104 and L10. Rejected: a new `fgos doc write` verb that
  edits prose and writes registry events (a second door beside attest and handoff; Rust cannot write the Work store
  before S7).
- **D2. The writer's decision is recorded on the registry events it already writes.** Grow: `fgos knowledge attest`
  takes an optional `--locate-file` in the handoff's locate shape and records it with `decision: grow`. Create and
  no-place: `capture.handoff` already holds the locate result and gains the `decision` value. No new Observe kind;
  the observer (step 6) joins these with `fgos.doc.locate` records. The locate file stays optional, so existing
  callers and replay are unchanged.
- **D3. A claim whose carrier is outside the registry** (locate returns a platform document section that already
  states it): the retrospective writer records a non-engine decision naming the section (`path#heading`) that
  carries the claim and why the item adds nothing to it. That is a real judgement, which the gate already accepts;
  no new evidence kind. A composite document is grown only when the item changes what it states, through its own
  edit and the check command.
- **D4. The refusal at `topic register` / `doc reserve` stays with admission (step 4)** (F6). The procedure forbids
  those verbs for a writer; the code check comes with admission's effect checks.
- **D5. The pointer line is a context-engine rule unit**, `core/instructions/documentation-door.md`, written and
  checked through the engine's door (F8), not a block appended by hand. This amends write-door 11 item 1.
- **D6. Rules belong to the context engine; H2 keeps claims in documents.** Documentation spec 6.1 item 1 is
  rewritten: a rule with an id is held and checked by the context engine; documentation links to it and never
  restates it. Both link pkm at one tag; a pin raise moves both together.
- **D7. Locate returns exact mentions beside the ranked candidates, in one answer** (owner, 2026-11-27: "agents must
  use both"; F14, F15). A second instruction ("also run `rg`") decays into locate alone, so the literal scan goes
  through the same door. Per part, `mentions` lists each term with its `total`, up to 20 sections
  (`path`, `section` heading path, `line`) and `truncated`. Terms are the backticked spans of that part (at least 3
  characters, deduplicated, at most 16; more are counted as `dropped`) plus each repeatable `--exact <string>`. The
  scan reads the corpus files on disk (same corpus as F16), so it is complete and current even when the index is
  `partial`, a file just landed, or a file failed to index. It lives in the documentation crate behind its own port
  with a filesystem adapter, sharing the corpus definition with the profile. Mentions never change `candidates` or
  their order; they are not the identifier boost. Rejected: shelling out to `rg` (a second tool to ship and a
  process per call); asking pkm for phrase search (FTS5 still tokenizes, and an index cannot be current on files it
  has not read).
- **D8. `missedBySearch` marks what the scan found and the search did not.** A mention whose document is not among
  that part's candidates carries `missedBySearch: true`. The procedure makes the writer read every such section
  before deciding. The locate record adds the counts of mentions and of `missedBySearch` documents, and their paths
  (never the terms, which are draft text; the redaction rule moves to `doc-locate-draft-digests.v2`). The locate log
  thereby counts the cases where grep would have caught what search missed, which is the miss list for document
  identity 8.5.
- **D9. The writer records how each mention was handled, and the verbs refuse a record without it.** The locate
  file of D2 gains `mentions[{path, section?, missedBySearch, handling, note?}]`, `handling` one of `updated` (the
  section was edited to agree), `unaffected` (it names the term but states nothing the claim changes) or
  `too-common` (the term is too general to check; `note` says why). `fgos knowledge attest --locate-file` and
  `fgos knowledge handoff --locate-file` refuse a mention without a valid `handling`. Phase 1 builds the check from
  this shape and phase 7 the answer, so both run in wave 1.
- **D10. Translation into the corpus language is a required step of the procedure**, before locate, because the
  scan cannot rescue a prose claim with no names (F15). The term list (`--exact`) stays in the source wording, since
  names are the same in both languages.

## What the door still cannot do (recorded, not fixed here)

Phase 3 writes these into document identity section 12 as known limits, each with the evidence that would close
it. Phase 6 measures the first two that can be measured now.

| # | Gap | Why neither search nor scan catches it | What would close it |
|---|---|---|---|
| G1 | A prose claim with no names, written in a language other than the target document's | No term for the scan; search across languages scored 0% at top 3 | Translation (D10) is the only guard; phase 6 counts how often translated drafts still miss |
| G2 | English queries over the Vietnamese platform specs | Never measured (F15) | Phase 6 runs a small gold set through `fgos doc locate --eval` |
| G3 | Text outside the corpus: past-state folders, `docs/distillery/`, rule units in `core/instructions/` (owned by the context engine), skills, plans, code comments | The scan uses the locate corpus on purpose; widening it would rank and list documents a writer must never grow | A writer changing a rule goes through the context engine's door; other surfaces stay out of the documentation door |
| G4 | Completeness of the writer's mention list | The Node verbs see only the locate file the writer built, not the locate answer, so they cannot prove nothing was left out | Observer (step 6) joins `fgos.doc.locate` records with attest and handoff events and reports omissions |
| G5 | Whether `unaffected` is true | It is the writer's judgement | Admission's reviewer (step 4) and the observer's sampling (step 6) |
| G6 | Names that differ but mean the same (`attest` and "attestation"), or typed identifiers checked against a register | Raw backticked spans only; identifier kinds and registers (5.6) and the identifier boost (8.1 step 4) are not built | Document identity 8.5.3 identifier signals, once its deferral condition is met |
| G7 | A very common name past the 20-section cap | `truncated` shows it, but the rest is not listed | The writer marks it `too-common`, or narrows with `--exact` on a longer string |
| G8 | The decision after finding: found but created anyway, or grew a neighbouring wrong document | Search and scan only find; the 26-case trial showed these judgement errors remain | Admission (step 4) and the observer (step 6) |
| G9 | The code refusal at `topic register`, `doc reserve`, `doc register` | Not built (D4) | Admission (step 4) |

## Acceptance criteria

1. `node --test test/state/knowledge-registry.test.mjs` passes, including a case where `fgos knowledge attest` with a
   locate file records the locate result and `decision: grow`, and a case where attest without one replays as before.
2. `core/skills/_shared/write-door.md` exists, and `domains/coding/skills/fgos-coding-knowledge/SKILL.md` has no
   `rg ` search and points to it; `npm run build:skills` leaves no diff.
3. `fgos internal context-engine check --protocol 1 --paths core/instructions/documentation-door.md` (the door the
   pre-commit hook calls) returns no refusal, and `.fgos/instructions/effective/rules.json`, compiled by
   `fgos internal context-engine compile --protocol 1`, contains the rule `documentation-door`.
4. `rg -n "future area|instruction registry renders" docs/platform/documentation` returns nothing;
   `node scripts/doc-health.mjs` passes on `docs/platform/**`.
5. The build order table in documentation spec section 4 has a plan column; the proposal (section 0 and 9.2), the
   H1 plan (12.1), `docs/reading-map.md` and ledger row PF-I006 each link to it.
6. A report at `fgos convention path --kind report --slug h2-step2-topics-per-retrospective-item` gives the
   baseline and the after count of new topics per retrospective item, with the queries used.
7. `npm test` and `cargo test --workspace` are green on the merged tree, apart from tests that fail the same way on
   `main`.
8. `cargo test -p fgos-documentation` passes, including cases where locate returns a mention the search missed
   (`missedBySearch: true`), a mention in a file the index has not read, a term over the 20-section cap
   (`truncated`), and an `--exact` term; the locate record carries mention counts and paths but no term text.
9. `fgos knowledge attest --locate-file` and `fgos knowledge handoff --locate-file` refuse a mention without a valid
   `handling`, and accept a locate file with no `mentions` key only as today (old events replay unchanged).
10. Document identity section 12 lists G1–G8 as known limits; the phase 6 report gives the `missedBySearch` count
    over the measured calls and the English-over-Vietnamese gold-set result (G2).

## Non-goals

- The code refusal at `topic register`, `doc reserve`, `doc register` (admission, step 4; D4).
- The admission reviewer, frame and ceiling (step 4). A request waits like any proposed item.
- The full documentation skill and live templates (step 5).
- Merging the 479 story documents into claim units (observer, step 6).
- Any change to locate's ranking, the identifier boost, identifier kinds and registers, the pkm pin, or the context
  engine's code. Locate gains `mentions` and `--exact` only (D7, D8).
- Widening the locate corpus (G3).
- Moving knowledge verbs to Rust (S7 of the Rust verb migration).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Shared write-door procedure `core/skills/_shared/write-door.md` | `write-door` | Content of the write-door subcomponent; step 5 grows it into the skill |
| `--locate-file` and `decision` on `doc.attest`, `decision` on `capture.handoff` | `learning-docs-registry` | Additive event fields in the knowledge-registry contract (`docs.work-state/knowledge-registry`); replay unchanged |
| Pointer rule unit `documentation-door` | `agent-context-engine` | The engine holds and checks the unit; its wording is owned by `write-door` (write-door spec 8) |
| Rule-versus-claim boundary sentence in documentation spec 6.1 | `documentation` | Spec text only; no model change |
| `mentions`, `missedBySearch`, `--exact` on `fgos doc locate`; the mention scan port and its filesystem adapter | `documentation` (document identity, the locate verb) | Inside the existing documentation crate; no new component |
| `mentions[].handling` in the locate file of attest and handoff | `learning-docs-registry` | Same contract row as D2 |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Attest records the locate result, mentions and the grow decision](phase-01-attest-records-locate-and-decision.md) | - | src/state/knowledge-registry.mjs, bin/fgos.mjs, src/cli/command-registry.mjs, test/state/knowledge-registry.test.mjs, docs/platform/work-state/contracts/knowledge-registry.md, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, `test/cli/knowledge-attest-gate.test.mjs` | 1 | ready |
| 2 | [Pointer rule unit through the context engine](phase-02-pointer-rule-unit.md) | - | core/instructions/documentation-door.md, .fgos/instructions/effective/** | 1 | ready |
| 3 | [Specs after the context engine, and links to the build order](phase-03-spec-corrections-and-links.md) | - | docs/platform/documentation/spec.md, docs/platform/documentation/subcomponents/write-door/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, docs/platform/proposals/documentation-system-unification.md, docs/platform/intent-preservation-ledger.md, docs/reading-map.md, plans/260925-documentation-authority-unification/plan.md | 1 | ready |
| 7 | [Locate returns exact mentions beside the ranked candidates](phase-07-locate-returns-exact-mentions.md) | - | packages/documentation/rust/src/**, packages/documentation/rust/tests/**, packages/documentation/rust/observe-kinds.json, apps/fgos/src/wiring/doc_locate.rs | 1 | ready |
| 4 | [Shared write-door procedure; the knowledge skill calls it](phase-04-shared-procedure-and-knowledge-skill.md) | 1, 7 | core/skills/_shared/write-door.md, domains/coding/skills/fgos-coding-knowledge/SKILL.md, .agents/skills/_shared/write-door.md, .agents/skills/fgos-coding-knowledge/SKILL.md, .claude/skills/fgos-coding-knowledge/SKILL.md, plugins/fgOS/skills/_shared/write-door.md, plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md, docs/platform/documentation/operations/how-a-document-is-written.md | 2 | ready |
| 5 | [Integrate, land, retire the draft plan](phase-05-integrate-and-land.md) | 1, 2, 3, 4, 7 | changelog.d/261127-1003-h2-step2-core-write-door.md, docs/platform/documentation/spec.md, docs/platform/documentation/subcomponents/write-door/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, plans/261113-0124-docos-retrospective-claim-units/plan.md, plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md, plans/backlog.md | 3 | ready |
| 6 | [Measure topics per retrospective item](phase-06-measure-topics-per-item.md) | 5 | plans/261127-1003-h2-step2-core-write-door/reports/**, docs/platform/documentation/subcomponents/document-identity/spec.md | 4 | ready |

Phases 1, 2, 3 and 7 share no file and run at once; phase 1 owns every `command-registry.mjs` edit, `--exact` on
locate included, and phase 7 parses it on the Rust side, both from the shapes fixed in D7–D9. Phase 4 needs phase
1's flags and phase 7's answer. Phase 5 merges and runs the full gate;
it also writes the implementation-alignment rows of the three documentation specs, which phase 3 leaves untouched
(a later wave, so the shared spec files are not written twice at once). Phase 6 needs the landed and activated release, because the
retrospective loop runs the activated skill.

Footprint check: phases in one wave share no path (`fgos resource-check --plan` accepts). Cross-plan overlaps
with active plans are not waited for: the owner decided on 2026-11-27 to merge shared files at land time ("chừng
nào land thì merge"). Shared with this plan, as of `ac171967a`:
- `src/cli/command-registry.mjs` (phase 1): `261127-0143` (running) and `261127-0151` (ready). Phase 1 rebases on
  `main` before its land and reruns `node scripts/export-command-selectors.mjs`, never hand-merges the exported
  contracts.
- `.fgos/instructions/effective/**` (phase 2): `261127-0144` (running) and `261127-0151`. Phase 2 recompiles with
  `fgos internal context-engine compile --protocol 1` on the rebased tree, never hand-merges `rules.json`.
- Generated skill copies under `.agents/`, `.claude/`, `plugins/fgOS/` (phase 4): `261127-0144` and `261127-0151`.
  Phase 4 reruns `npm run build:skills` on the rebased tree.
- `docs/reading-map.md` (phase 3): `261127-0016` (running); a one-line addition, merged by hand.
- `changelog.d/**`: `261126-2324` claims the folder by glob; this plan writes only its own fragment.

Hot files: the compiled rule set (phase 2 only), the generated skill copies (phase 4 only), the backlog (phase 5
only).

Capability: phases 1, 2, 4 and 7 are `code:implement`; phase 3 is `code:implement` (documentation edit); phase 5 is
`code:review` plus the land; phase 6 is `code:test` on real items.

## Owner questions

None open. The owner set the plan going on 2026-11-27 without waiting for the plans that share files (see the
footprint check). Validating proof point, run on `ac171967a`: `fgos doc locate` on a real retrospective-style draft
answered `state: starting` with no candidates on the first call (the case D7's disk scan covers), then, text only
while vectors were computed, ranked the knowledge-registry contract section 7.5, write-door spec 12 and
how-a-document-is-written 11 at places 4 to 6 under three general documents. D1 (procedure, not a new verb) and D3 (a carrier outside the registry is recorded as a decision) are the
planner's calls inside the 2026-11-24 frame; the owner may overturn either before `ready`. D7–D10 follow the
owner's choice of 2026-11-27 (option A: exact mentions in this step, inside locate).

## Risks and rollback

- **Locate not ready** (index building, model missing): the procedure runs `fgos doc index status --wait` and, if
  the answer stays `partial`, says so in the handoff or decision instead of guessing. Proof point for validating:
  run locate on one real retrospective draft from the current pool.
- **Grow into the wrong unit** (the trial's remaining error): additive evidence, reversible by the observer.
- **Mentions flood the writer** (a common name, many parts): the 20-section cap, `truncated`, the 16-term cap and
  `too-common` bound it; phase 6 reports the average mentions per call, and a cap change is a phase 7 constant.
- **Scan cost** on a large corpus: one read of the corpus files per call (about 700 files, a few MB here); phase 7
  measures it on this repository and records the time in the locate record's duration.
- **The pointer unit trips the nearest-rule check** against an existing rule: phase 2 reads the advisory candidates
  and declares a relation or rewords; never bypasses the hook.
- **Generated skill copies drift** if another plan regenerates at the same time: the land door regenerates
  generated skill surfaces on a conflict (`261126-2324`), and phase 4's verify reruns `npm run build:skills`.
- **Rollback:** revert the phase 4 commit and the knowledge skill returns to `rg`; attest's locate field stays
  readable (an optional field, never required). Revert the phase 2 commit and recompile to remove the pointer line.
