# Ground truth: case-2 (P05.2 unclear case)

Extracted verbatim from `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md`, lines ~140-152 and ~193-207.

## GT-1: false-wrap rate

Not applicable to case-2. See `scoring/case-1/ground-truth.md`.

## GT-2: Codex cursor glyph

> Concrete, previously unverified mechanism found: `MENU_CURSOR_ITEM` hardcodes Claude's own cursor glyph, and the repo's own prior-art notes record Codex using a different one — unconfirmed by any real capture at explanation time.

Live-confirmed later in the same cell by capturing a real Codex pane (P05.2.md ~L193-201): "Codex's real menu (`› 1. Yes, continue`) used a different cursor glyph (U+203A) than Claude's (U+276F) for the identical concept, exactly as the panel's documentary evidence predicted — and it really did wrap incorrectly before the fix."

**Bears on:** case-2 (unclear case) only.
