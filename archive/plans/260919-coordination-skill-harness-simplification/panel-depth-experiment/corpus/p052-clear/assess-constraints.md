# assess-constraints (real, asgn_coordinator_driver_op_026)

## Dispatched objective (verbatim)

Rank the real operational risk of these three real Phase 5 proposals for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification. Proposal A (system-shaper): keep looksStructured() as a flat, ordered OR-chain of small named detectors. Proposal B (alternative-shaper): a Pluggable Output Grammar architecture, a registry of layout signatures replacing the monolithic heuristics. Proposal C (constraint-advocate, your own earlier proposal): keep the current architecture, cheaply unit-testable without a browser/corpus. Use absolute paths for anything you read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts there, at exactly this path, which is where this operation's result belongs regardless of what project you are advising about: /home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_026/runs/01/agent-result.json for the structured JSON, and /home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_026/runs/01/agent-report.md for the human-readable report. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Ranked operational risk (highest to lowest): B (Pluggable Output Grammar registry) is highest risk — unmotivated abstraction over 6 hand-tuned, interdependent heuristics, migration/regression risk, weaker debuggability in an asymmetric-cost domain. A (flat ordered OR-chain) and C (keep current architecture) are functionally the same proposal as the code that is actually deployed today in looksStructured() — near-zero risk, already unit-testable with no browser/corpus.",
  "role": "constraint-advocate",
  "target_file": "web/src/block-classify.ts",
  "ranking_highest_to_lowest_risk": [
    {
      "proposal": "B",
      "name": "Pluggable Output Grammar (registry of layout signatures)",
      "risk": "high",
      "reasons": [
        "No evidence in the current code or Phase 5 scope of a real requirement for runtime-pluggable/third-party detectors; adding a registry is speculative abstraction (YAGNI violation)",
        "The 6 existing detectors are empirically hand-tuned special cases with documented false-positive exclusions (e.g. arrows excluded from BOX_CHARS, menu cursor + sibling-count combo, summary question/answer adjacency) rather than orthogonal composable grammars — forcing them into a plugin/registry shape risks losing or obscuring the tuning rationale during migration",
        "Dynamic registration/ordering is harder to audit than a linear if-chain, which matters because the module's own header comment establishes the domain is asymmetric-risk: a false 'pan' verdict on structured content is unrecoverable/unreadable, so debuggability of 'why did this block classify this way' is a safety property, not just style",
        "Risks the documented invariant that classification depends only on the block's own text (never viewport, never external state) if registration/priority becomes configurable or environment-dependent",
        "Full-rewrite migration cost with no corresponding correctness or extensibility gain demonstrated"
      ]
    },
    {
      "proposal": "A",
      "name": "Flat, ordered OR-chain of small named detectors (system-shaper)",
      "risk": "low",
      "reasons": [
        "Describes the architecture that is already implemented and shipping in block-classify.ts (verified by direct read) — effectively zero migration risk",
        "Only latent risk is chain growth: as more detectors are appended, order/documentation discipline must be maintained so independent ORs don't accidentally become order-dependent — not currently a problem since all checks are independent short-circuiting ORs"
      ]
    },
    {
      "proposal": "C",
      "name": "Keep current architecture, cheaply unit-testable without browser/corpus (constraint-advocate)",
      "risk": "lowest",
      "reasons": [
        "Verified directly: looksStructured(), stableGutters(), classifyBlocks() are pure functions over string[]/StyledLine[] — already testable with plain fixtures, no PTY/browser/corpus dependency required",
        "Zero-cost option: makes no code change, so carries no regression surface beyond what's already proven in production",
        "Functionally indistinguishable from Proposal A in the code produced; differs only in the stated justification (testability-first vs. structural-purity-first framing)"
      ]
    }
  ],
  "cross_cutting_finding": "A and C converge on the same actual architecture (confirmed against the real file) — they are not two independent design options, just two rationales for not changing anything. The real decision is B (rewrite into a registry) vs. not-B (A/C, i.e. status quo).",
  "evidence_gap": "Context refs asgn_coordinator_driver_op_021/022/023 in forgentX .fgos were not readable in this session (permission-gated for read/Bash outside herdr-gateway, though writes to the assignment's own runs/ path were permitted). This ranking is grounded in a direct read of web/src/block-classify.ts, not in those prior assignment artifacts."
}
```

## Real agent-report.md (verbatim)

# op_026 — constraint-advocate risk ranking: block-classify.ts Phase 5 proposals

Role: constraint-advocate. Target: `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`.

## What I actually checked

Read the real file (222 lines). Current `looksStructured()` is 6 independent,
short-circuiting boolean checks — stable gutters, framing rules, box-char
ratio, markdown pipe columns, menu cursor+siblings, summary question/answer
pairs — each a small named pure function/constant with a comment documenting
the specific false positive it was tuned against. `classifyBlocks()` splits on
blank lines and calls `looksStructured()` per block. Everything operates on
`string[]` / `StyledLine[]`, no DOM/PTY/browser dependency.

Could not read forgentX's op_021/022/023 context refs (Read/Bash outside
`herdr-gateway` was permission-gated in this session with no one present to
grant it) — writes into this assignment's own `runs/` path were allowed, reads
elsewhere were not. Ranking below rests on the real code, not on those prior
artifacts.

## Ranking (highest risk → lowest)

**1. Proposal B — Pluggable Output Grammar / registry — highest risk**

- No demonstrated Phase 5 requirement for runtime-pluggable or third-party
  detectors. Adding one today is registry-shaped, plugin-boilerplate
  abstraction for a need that doesn't exist yet (YAGNI).
- The 6 existing checks are not clean orthogonal "grammars" — they're
  empirically patched special cases discovered against real false positives
  (e.g. arrows deliberately excluded from `BOX_CHARS` because a single `→` in
  a 3-line paragraph was making it pan; the menu check requires a cursor glyph
  *and* a sibling count precisely because descriptions vary in length and
  defeat the gutter check). Forcing these into independently-registered units
  risks losing the interaction context that makes each one correct.
- The module's own header comment states the domain is asymmetric-risk: a
  wrongly-panned structured block is "unrecoverable" for the user (no UI
  control to fix it), while a wrongly-wrapped prose block just matches old
  behavior. That means debuggability — being able to read top-to-bottom why a
  block classified the way it did — is a safety property here, not a style
  preference. Dynamic registration/dispatch is strictly harder to trace than
  a linear `if` chain.
- Risks quietly breaking the documented invariant that a verdict depends only
  on the block's own text (never viewport, never external state) if
  registration order or which detectors are active becomes configurable.
- Full rewrite/migration cost against 6 heuristics with no corresponding
  correctness or extensibility win shown.

**2. Proposal A — flat ordered OR-chain of small named detectors — low risk**

- This is, verified directly, the architecture already shipping. Adopting it
  as "the decision" costs nothing to implement.
- Only forward risk: as detectors accumulate, chain order/documentation
  discipline needs to hold so independent ORs don't quietly become
  order-dependent. Not an issue today — all 6 checks are independent,
  short-circuiting ORs.

**3. Proposal C — keep current architecture, cheaply unit-testable — lowest risk**

- Verified directly: `looksStructured`, `stableGutters`, `classifyBlocks` are
  pure functions over `string[]`/`StyledLine[]`. Already testable with plain
  fixtures, no browser/corpus needed — the stated benefit is true today, not
  aspirational.
- Zero-cost: no code change, so no new regression surface beyond what's
  already proven in production.

## Cross-cutting finding

A and C are not two independent designs — they produce the same code (the
code that already exists), differing only in which justification is foregrounded
(structural purity vs. testability). The real fork in the road is B (rewrite
into a plugin registry) versus not-B (A/C, status quo). Framing this as three
competing architectures overstates how many real options are on the table.

## Unresolved questions

- Was there a concrete Phase 5 requirement driving Proposal B (e.g. an actual
  need for externally-registered/user-defined layout signatures), or is it
  speculative? I found no evidence of one in the current file or its comments.
- Context refs op_021/022/023 were inaccessible this run — if they contain
  arguments for B's necessity that aren't visible in the code itself, they
  should be reconciled against this ranking.
