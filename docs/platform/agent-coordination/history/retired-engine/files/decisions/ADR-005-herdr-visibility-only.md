# Historical File: surviving visibility-is-not-result decision

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 5fcce47bd72f70e053189a2fb58659000ce3ddd3e3d9b6651f793940d045430f
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# ADR-005: Herdr Is Visibility, Not Evidence

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-005: Herdr Is Visibility, Not Evidence
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-005-herdr-visibility-only.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-005: Herdr Is Visibility, Not Evidence; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: ADR
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: interactive visibility trust boundary

## Context

Terminal panes and process state are valuable operational signals but cannot
reliably prove semantic success, artifact freshness, verification, or Work
lifecycle completion.

## Decision

Herdr is an observability surface. Structured runtime settlement, RunResult,
artifacts, and evidence establish outcome truth. Work verbs establish lifecycle
truth.

## Consequences

- Quietness, visible text, or pane closure cannot mark a Run successful.
- Herdr may display canonical Run/RunResult/evidence references.
- Correctness must survive headless or detached execution.
- Visibility bugs and evidence bugs remain separate failure categories.
~~~~
