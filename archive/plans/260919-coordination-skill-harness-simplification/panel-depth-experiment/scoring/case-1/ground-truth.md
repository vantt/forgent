# Ground truth: case-1 (P05.2 clear case)

Extracted verbatim from `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md`, lines ~129-139 and ~209-211, 228.

## GT-1: false-wrap rate

> finding a real **30.8% false-wrap rate** on the R25-gated "core" tier (`ls -la`'s header defeating gutter detection, missing diff/graph-rail/caret-underline detectors) — a real, hand-traced violation of the project's own hard bar, not a hypothetical one.

Independently reproduced by a real test run later in the same cell (P05.2.md ~L183-187): "First real (not hand-traced) run: **false wrap 4/13 = 30.8%**, exactly matching the panel's own hand trace." Fixed afterward to 0.0%.

**Bears on:** case-1 (clear case) only.

## GT-2: Codex cursor glyph

Not applicable to case-1. See `scoring/case-2/ground-truth.md`.
