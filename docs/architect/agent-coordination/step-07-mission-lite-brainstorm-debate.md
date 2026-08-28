# Step 07 - Mission-Lite Brainstorm And Debate

Status: future implementation plan after Work-attached adoption
Date: 2026-08-28
Scope: test team coordination without Work lifecycle by running read-only brainstorming/debate assignments inside a lightweight mission envelope

## 1. Goal

Prove that Team Dispatch can coordinate multiple roles around a question before
there is lifecycle Work.

This step is intentionally read-only:

```txt
mission-lite question
  -> several read-only assignments
  -> structured role results
  -> synthesis report
  -> optional proposal to create Work
```

The outcome is a report, not a code change.

## 2. Prerequisites

- Step 04 evidence hardening complete.
- Step 05 operation choice doctrine complete.
- Step 06 has successfully used at least one Work-attached read-only operation.

Do not start Step 07 just because mission-lite is conceptually appealing. It is
a proving ground after the Work-attached path is trustworthy.

## 3. Non-Goals

- No mission lifecycle FSM.
- No queued `Job`.
- No scheduler.
- No Work status/stage movement.
- No repo mutation by role assignments.
- No Herdr truth.

## 4. Minimal Mission-Lite Shape

Physical storage can be local and file-based:

```txt
.fgos/missions/<mission-id>/
  mission.json
  thread.jsonl
  assignments/
    <assignment-id>.json
  results/
    <assignment-id>.json
  synthesis.md
```

`mission.json`:

```json
{
  "missionId": "mission_team_dispatch_validation_debate_001",
  "objective": "Decide whether planning validation should run as reviewer Assignment.",
  "mode": "debate",
  "status": "open",
  "createdAt": "2026-08-28T00:00:00.000Z",
  "constraints": [
    "read-only",
    "no Work lifecycle",
    "no repo mutation"
  ],
  "successCriteria": [
    "each role writes structured result",
    "synthesis names decision, tradeoffs, and recommended Work item"
  ]
}
```

`thread.jsonl` carries semantic messages:

```json
{"type":"TASK","assignmentId":"asgn_mission_research_001","toRole":"researcher","objective":"Gather prior docs and code evidence."}
{"type":"RESULT","assignmentId":"asgn_mission_research_001","status":"done","resultRef":"results/asgn_mission_research_001.json"}
```

This thread is not a mailbox daemon. It is an append-only local record for one
mission-lite run.

## 5. Assignment Types

Start with four read-only assignment patterns:

| Pattern | Role | Purpose |
|---|---|---|
| `background-brief` | researcher | Gather facts, existing docs, existing code paths, and unresolved gaps. |
| `argument-for` | advisor/helper | Make the best case for the proposed direction. |
| `argument-against` | reviewer | Find risks, contradictions, false-success paths, missing tests. |
| `synthesis` | implementer/driver | Produce a decision recommendation and possible Work item scope. |

All four require `agent-result.json`. None may mutate repo state.

## 6. First Business Case

Use a coordination question that is real but safe:

```txt
Should coding-domain planning validation run as a reviewer Assignment, or stay
as direct same-session validation until executing-stage adoption is stable?
```

Why this case:

- it touches Team Dispatch itself;
- it needs researcher, reviewer, and advisor perspectives;
- it can be answered by reading docs/code without editing;
- it can produce a concrete next Work item;
- it does not need Work lifecycle to test role communication.

## 7. Runtime Rules

- Mission-lite creates assignments with `workId: null`.
- Every assignment runs read-only.
- `executeAssignment()` must reject mission-lite mutating operations unless a
  later step explicitly allows them.
- `reported` is acceptable for role outputs.
- `verified` is not required unless a role claims it ran a command whose output
  is stored as an artifact.
- `no-evidence` excludes the role result from synthesis unless the synthesizer
  explicitly labels it unsupported.
- `failed` stops that role branch; synthesis may proceed only if enough other
  evidence exists and the failure is recorded.

## 8. Synthesis Report Contract

`synthesis.md` must contain:

```txt
# Mission Synthesis

## Question
...

## Inputs
- researcher: <result ref>
- advisor/helper: <result ref>
- reviewer: <result ref>

## Decision Recommendation
...

## Tradeoffs
...

## Risks
...

## Recommended Work Item
...

## Evidence Quality
...
```

The synthesis may recommend creating Work. It must not create Work unless the
caller explicitly invokes the normal intake/add path.

## 9. Files To Touch

Possible implementation files:

- new `src/runner/dispatch/mission-lite.mjs`;
- `src/runner/dispatch/assignment.mjs` for `workId: null` handling if needed;
- `src/runner/dispatch/assignment-runner.mjs` for read-only mission guard;
- a narrow CLI facade if justified, such as:

```txt
fgos mission-lite start --mode debate --objective ...
fgos mission-lite assign ...
fgos mission-lite synthesize ...
```

Do not add CLI until a file-module prototype has tests. If CLI is added, it
must be read-only except for `.fgos/missions/` writes.

## 10. Tests

Required tests:

- mission-lite can create mission.json and thread.jsonl;
- mission-lite assignments use `workId: null`;
- read-only role assignments can produce `reported`;
- mutating operation is refused in mission-lite;
- synthesis ignores `no-evidence` role result unless labeled unsupported;
- mission-lite does not create or mutate Work;
- mission-lite does not write outside `.fgos/missions/` and assignment run
  storage.

Suggested command:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/mission-lite.test.mjs
```

## 11. Acceptance Criteria

Step 07 is done when:

- one debate mission can run with at least three role assignments;
- every role result is a structured artifact;
- synthesis report cites role result refs;
- no Work item is created or modified;
- the recommended next step is expressed as a proposed Work item or explicit
  no-op;
- failure/no-evidence branches are visible and do not masquerade as consensus.

## 12. Rollback

Remove mission-lite CLI/module wiring. Keep Assignment/RunResult hardening and
Work-attached operation dispatch. Mission-lite is an adoption experiment, not a
foundation required by Work lifecycle.

