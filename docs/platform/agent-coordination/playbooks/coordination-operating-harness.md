# Coordination Operating Harness

```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/coordination-operating-harness.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Runtime And Lifecycle Notice

This owner-retained harness describes manual engineering coordination.
It is not a runtime sequencer or a prerequisite for restoring the retired
CoordinationSession engine. Use current Unit/Workflow execution and governed
dispatch when running requests; manual roles cannot bypass their authority.

New selected manual tracks write evidence under the current platform
`verification/<track>/` owner, not the frozen `docs/architect/` tree. The
conventions below apply only when a track actually adopts this manual harness.
They neither define Workflow storage nor prove a rollout was executed.

The [earlier Step 07 discussion](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
is preserved history, not a current architecture milestone.

## 1. Goal

The original Work-attached/mission-lite experiment motivation is historical;
mission-lite and the coordination engine were retired. The current goal is a
compact, auditable manual engineering loop whose roles produce real evidence
without replacing Unit/Workflow execution or Work lifecycle.

The target:

```txt
Coordinator prepares a small cell
Doer implements only that cell
Reviewer checks correctness and regression risk
Red-team tries to break invariants
Doer fixes accepted findings
Coordinator closes the cell with proof
```

Reviewer and Red-team may run in parallel after the Coordinator has verified a
stable Doer candidate. Multiple fixes may be batched only under the
master prompt's parallelism policy: shared-checkout Fixers produce patch
proposals or reports, while source-writing Fixers require isolated workspaces
and a recorded Fix Batch Plan. The Coordinator applies or merges fixes
sequentially and verifies the combined diff before close.

This is not a new runtime subsystem. It is a disciplined artifact and prompt
workflow that keeps independent agents aligned without making every agent read
all architecture docs.

## 2. Why This Step Exists

Detailed plans and independent review prompts are not enough by themselves.
They still fail when:

- the plan remains prose instead of executable proof;
- doers read too much and broaden scope;
- reviewers read too little and miss cross-layer invariants;
- red-team checks happen late or not at all;
- traceability lives only in chat and disappears between sessions;
- every new agent rereads the full architecture pack and spends tokens
  reconstructing the same context.

This playbook turns the operating method into durable project artifacts:

```txt
trace/index.md          = global progress and proof map
trace/current-cell.md   = the one active work contract
trace/<cell>.md         = compact proof record for one cell
```

## 3. Non-Goals

- Do not introduce `Job`.
- Do not introduce scheduler, daemon, mailbox, or mission lifecycle.
- Do not replace Work lifecycle.
- Do not change Assignment/RunResult semantics.
- Do not revive the retired mission-lite/CoordinationSession runtime.
- Do not turn trace files into long transcripts.
- Do not require every agent to read every architecture doc.

## 4. Role Model

The harness uses four standing roles.

| Role | Responsibility | Writes |
|---|---|---|
| Coordinator | Reads broad docs, splits work into cells, writes current-cell contract, closes trace. | `trace/index.md`, `trace/current-cell.md`, cell trace status |
| Doer | Writes failing tests, implements minimal code/prose, runs verification. | source/tests/docs in current cell, cell trace proof |
| Reviewer | Reviews diff against plan and bug taxonomy. Does not fix. | review findings, optionally cell trace section |
| Red-team | Attempts to break invariants and find false-success paths. Does not fix. | attack report, missing-test recommendations |

Optional fifth role:

| Role | When allowed | Output |
|---|---|---|
| Researcher | Only when a specific external/library/subsystem fact is unknown. | short finding, evidence refs, confidence, current-cell impact |

Do not add more roles until a real bottleneck appears. More agents increase
coordination cost and context drift.

## 5. Trace File Layout

Create:

```txt
docs/platform/agent-coordination/verification/<track>/
  index.md
  current-cell.md
  harness-cell-01-trace-harness.md
  harness-cell-02-current-cell-contract.md
  harness-cell-03-review-redteam-gates.md
  harness-cell-04-token-context-budget.md
  harness-cell-05-live-proof-capture.md
```

The exact cell filenames may vary, but `index.md` and `current-cell.md` are
stable names.

For brevity, later examples use `trace/index.md` and `trace/current-cell.md` as
logical names inside the selected `verification/<track>/` directory. They do
not refer to the removed top-level `agent-coordination/trace/` path.

## 6. Trace Index Contract

`verification/<track>/index.md` is the track status board. It must stay short.

Required sections:

```md
# Agent Coordination Implementation Trace

Status: active
Last updated: <ISO timestamp>
Active cell: <cell id or none>
Next action: <prepare | doer | review | fix | red-team | close | blocked>

## Step Status
| Unit | Status | Trace | Open Gaps |
|---|---|---|---|

## Blocking Gaps
| Gap | Blocks | Owner | Next Action |
|---|---|---|---|
```

Rules:

- one row per step/cell;
- `Status` values: `missing`, `in-progress`, `review-needed`,
  `fixes-needed`, `red-team-needed`, `blocked`, `done`;
- never paste long logs;
- link to proof artifacts instead of embedding them;
- update monotonically: `done` must not become `missing` without explicit
  evidence and explanation.

## 7. Current Cell Contract

`trace/current-cell.md` is the only file every role must read.

It must stay under 80 lines.

Required shape:

```md
# Current Cell

Cell: 7.1
Status: in-progress
Owner: coordinator
Last updated: <ISO timestamp>
Next action: doer-implement

## Goal
...

## Non-Goals
...

## Must Read
- ...

## May Inspect
- ...

## Do Not Touch
- ...

## Tests First
- ...

## Acceptance
- ...

## Bug Taxonomy
- ...

## Trace Update
- ...
```

Rules:

- Doer reads `current-cell.md` first, then only `Must Read`.
- Reviewer reads `current-cell.md`, cell trace, diff, and touched files.
- Red-team reads `current-cell.md`, cell trace, diff, and tests.
- Coordinator may read architecture docs and prepare the compact contract.
- A second coordinator run must resume from `current-cell.md`, not restart.
- Parallel Reviewer/Red-team or Fixer activity must still preserve trace
  ownership, mutation attribution, one active cell, and independent first-pass
  reports.

## 8. Cell Trace Contract

Each cell trace must stay under 150 lines unless a real blocker requires more.

Required shape:

```md
# Harness Cell 01 - <Name>

Status: in-progress
Last updated: <ISO timestamp>

## Requirements
- R1: ...

## Proof Matrix
| Req | Code/Doc Path | Positive Test | Negative Test | Evidence | Status |
|---|---|---|---|---|---|

## Commands
- `<command>` -> pass/fail summary

## Review
- pending / findings summary

## Red-Team
- pending / findings summary

## Gaps
- ...
```

Do not store full stdout in the trace. If full logs are needed, write them to a
proof artifact and link the path.

## 9. Resume And Idempotency Rules

Every coordinator prompt must start by reading `trace/index.md` and
`trace/current-cell.md` if they exist.

Rules:

- If `trace/index.md` exists, do not restart the selected track's audit unless
  it says `stale`, `blocked`, or explicitly requests re-audit.
- If `trace/current-cell.md` exists, treat it as the active cell contract.
- Do not overwrite `current-cell.md` unless the current action is coordinator
  prepare or close.
- If a cell trace exists, update sections in place; do not create a duplicate.
- Never start a new cell while the current one is `in-progress`,
  `review-needed`, `fixes-needed`, or `red-team-needed`.
- If another session modified trace files during the run, stop and report the
  conflict.
- Use `git status` or equivalent before writing trace files.

## 10. Master Prompt And Internal Roles

The normal manual-bootstrap entry point is the
[Master Multi-Agent Implementation Coordinator](prompts/master-coordinator.md).
The user pastes that prompt once; the master resumes persistent track state and
delegates these internal role contracts:

- Coordinator Audit;
- Coordinator Prepare Cell;
- Doer Implement Cell;
- Reviewer Review Cell;
- Red-Team Attack Cell;
- Doer Fix Findings;
- Coordinator Close Cell.

The master prompt references `trace/current-cell.md` as the main context
artifact and does not inline all architecture docs into each role packet.
Separate copy/paste prompts for the seven roles are optional recovery artifacts,
not the primary interface.

This master prompt is bootstrap tooling, not a runtime deliverable. Runtime
consult/research/brainstorm/debate prose belongs in `core/skills/` or
`domains/<domain>/skills/` and their referenced TaskSpecs/protocol config.

## 11. Token Budget Rules

Default reading budget by role:

| Role | Reads by default |
|---|---|
| Coordinator | architecture docs plus trace index/current cell |
| Doer | current-cell plus listed must-read source/test files |
| Reviewer | current-cell, cell trace, diff, touched files |
| Red-team | current-cell, cell trace, diff, tests |
| Researcher | current-cell, one explicit question, source refs needed for that question |

Forbidden token patterns:

- asking every role to read all Step 00-08 docs;
- copying long command output into trace;
- pasting full diffs into trace when git already stores them;
- letting cell trace become a diary;
- reading historical reports unless the current cell names one as must-read.

## 12. Harness Rollout Cells

Status: dated, unexecuted rollout proposal. H.1 through H.Final below are
manual-harness adoption criteria, not current completed cells or registered
Workflow steps. No execution/proof is inferred from their presence here.

### 12.1 Cell H.1 - Trace Harness Skeleton

Goal: create `trace/index.md` and an initial `trace/current-cell.md` that can
resume safely.

Implementation:

1. Create trace directory if missing.
2. Create `index.md` with Step 01-08 rows.
3. Mark Step 01-06 from existing evidence if already known, otherwise
   `partial`.
4. Set active cell to `H.2`.
5. Create first `current-cell.md` contract.

Acceptance:

- files exist;
- no runtime code touched;
- status values are from the allowed set;
- rerunning coordinator prompt resumes instead of restarting.

### 12.2 Cell H.2 - Current-Cell Contract Enforcement

Goal: make the compact work-packet contract concrete enough for doer/reviewer
sessions.

Implementation:

1. Define the required headings in docs.
2. Add a lightweight validation command or documented manual check.
3. Ensure `current-cell.md` has owner, status, next action, must-read,
   do-not-touch, tests, acceptance, and trace update sections.

Acceptance:

- missing required headings are caught by test or documented check;
- current-cell stays under 80 lines;
- doer can implement from current-cell without reading the full architecture
  pack.

### 12.3 Cell H.3 - Review And Red-Team Gate Records

Goal: make review/red-team findings durable and tied to one cell.

Implementation:

1. Add sections to cell trace for review and red-team.
2. Define severity labels.
3. Define close rules:
   - high severity finding blocks close;
   - medium severity needs accepted fix or explicit deferral;
   - low severity may be recorded as follow-up.

Acceptance:

- every cell trace can show whether review happened;
- every cell trace can show whether red-team happened;
- coordinator cannot mark a cell done while unresolved high severity findings
  remain.

### 12.4 Cell H.4 - Token And Context Budget

Goal: keep multi-agent work cheap enough to run repeatedly.

Implementation:

1. Add context budget section to prompt templates.
2. Add `Must Read`, `May Inspect`, and `Do Not Touch` discipline to every
   current-cell template.
3. Define log handling: summaries in trace, full logs in proof files.

Acceptance:

- doer prompt does not include all architecture docs by default;
- reviewer prompt does not include all architecture docs by default;
- trace links proof artifacts instead of embedding long output.

### 12.5 Cell H.5 - Live Proof Capture

Goal: make live smoke evidence reusable by later agents.

Implementation:

1. Define a proof artifact path convention, such as:

   ```txt
   docs/platform/agent-coordination/verification/<track>/proofs/<cell-id>/
   ```

2. Define required live proof fields:
   - command;
   - before state;
   - after state;
   - assignment id/run id when relevant;
   - result status/confidence;
   - unrelated failures.

3. Update trace template with a live proof pointer row.

Acceptance:

- a live smoke can be summarized in under 10 trace lines;
- later agents can find full proof if needed;
- unrelated doctor failures are separated from current-cell failures.

### 12.6 Cell H.Final - Harness Dogfood

Goal: use the harness itself to prove that its operating loop can be resumed and
closed from durable artifacts.

Implementation:

1. Prepare a current-cell for `H.Final`.
2. Have a doer update docs/templates only.
3. Have reviewer and red-team reports recorded in the cell trace.
4. Close the harness rollout in `trace/index.md`.

Acceptance:

- the harness rollout was completed using its own coordination harness;
- trace shows doer, review, red-team, fixes if any, and close decision;
- numbered runtime steps may reference the harness without treating it as a
  runtime dependency or completion gate.

## 13. Tests And Checks

Use the repository's current test/check doors for actual scripts and record the
exact observed result. The hypothetical trace script below is not shipped or a
mandatory dependency; manual text checks do not prove execution behavior.

Suggested minimal test if implemented:

```bash
node --test test/architect/coordination-trace.test.mjs
```

Suggested manual checks:

```bash
test -s docs/platform/agent-coordination/verification/<selected-track>/index.md
test -s docs/platform/agent-coordination/verification/<selected-track>/current-cell.md
```

## 14. Acceptance Criteria

For a separately authorized adoption of the unexecuted rollout, completion would require:

- trace index exists and can resume safely;
- current-cell contract exists and stays compact;
- prompt templates exist and route roles through current-cell;
- review and red-team findings are recorded per cell;
- token/context budget rules are documented;
- live proof capture convention exists;
- the final harness cell dogfoods the operating loop.

## 15. Rollback

Any future rollback must first check actual consumers and authority.
This proposal does not authorize deleting owner-retained current prompts,
evidence or runtime implementation. The manual harness is not a second
runtime infrastructure component.
