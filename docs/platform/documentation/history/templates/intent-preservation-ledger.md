# <Area> Intent Preservation Ledger

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/intent-preservation-ledger.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/intent-preservation-ledger.md
Supersedes: None; candidate only
Superseded by: None
```

## 1. Purpose

## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |

## 3. Preserved Intents

| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| <AREA-I001> |  |  |  |  |  |  |  |

## 4. Required Plan Traceability

Every implementation plan that narrows this area's vision must include:

1. an intent traceability table;
2. a must-not-preclude check for every touched preserved intent;
3. evidence or an explicit gap for every status change;
4. a phase-closing deferral audit.

## 5. Related Files

```markdown
| Relationship | File |
|---|---|
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
```


## Source Metadata (Added in candidate)

````text
```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full <area> intent across simplified implementation slices
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Preserved design intent for <area>
Use this when: A plan or implementation narrows, stages, or simplifies <area>'s full vision
Do not use this for: Current behavior without checking spec.md, or accepting new architecture by itself
Last reviewed: YYYY-MM-DD
Related:
- `vision.md`
- `spec.md`
```
````
