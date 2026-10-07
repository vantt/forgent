---
phase: 1
title: "Verdict schema: unresolved first"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 01: Verdict schema, unresolved first

## Overview
The synthesizer's final report gets a fixed shape: what is still unknown, each lens's position, whether the panel genuinely split, what would change the answer, and exactly one next step.

## Requirements
- Order: (1) unresolved/unknown, (2) positions per seat label (never role ids; seat labels already required by delphi), (3) agreement or genuine split with the stance counts Observe reads, (4) kill criteria / what would change the conclusion, (5) one next step.
- Must keep the stance-in-claim and `--stance-options` contract Observe parses; do not change what `metrics discussions` reads.
- No consensus is invented: a split is reported as a split.

## Related Code Files
- Modify: `core/workflows/delphi.yaml`, `nominal-group.yaml`, `group-cognition.yaml`, `business-discussion.yaml` (synthesizer objectives); the shared synthesizer persona text if the schema belongs there.
- Check first: `packages/observe/rust/src/metrics_cli/discussions.rs` and `src/runner/execution/unit-summary.mjs` for fields the schema must keep.
- Do not touch: `src/runner/execution/patterns/*.mjs`.

## Implementation Steps
1. Read the four workflows and the synthesizer persona; find the single place where the shape can be stated once and reused (prefer the persona/`description`, not four copies).
2. Write the schema as instructions, with the "stance" line the sensor needs.
3. Run one real workflow end to end (Delphi on a small real question) and check the report follows the order and Observe still reads stance/agreement.
4. Add or adjust a consumer test only for behavior with a real boundary (e.g. unit-summary still extracts stance from the new shape). No source-text or wording tests.

## Success Criteria
- [ ] Real run's final report has unknowns first and one next step.
- [ ] `metrics discussions` reports the run with no new undetermined units.
- [ ] No duplicate copies of the schema across workflows.

## Risk Assessment
Schema text can bloat output and push a model past its limit: keep it to five short items. If a model ignores the order, record it as evidence in Phase 04 rather than adding a gate.
