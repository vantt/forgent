# risksGate instability exception — locked decisions

Item: `tsk-wve`. Source request (raw, untrusted per RUL45): user feedback
that fgOS's heavy-risk decompose gate (`risksGate` in `resolveDecompose`)
should stop asking a human to confirm by default merely because
`work.risk === 'heavy'` — real usage (tsk-49e) shows that ask always gets
approved once a Feasibility matrix with a Recommended option already
exists, with no remaining lever for a human to pull there. The gate should
only fire when the proposal is genuinely unstable, not by risk tier alone.

## Feature boundary

- **In scope:** `keywordRiskGate` (`src/intake/plan.mjs:660`, fires on
  `work.risk === 'heavy'` alone) — narrowing when it fires.
- **Out of scope (D2):** `blastRadiusGate`/`BLAST_RADIUS_GATE_THRESHOLD`
  (`decompose.mjs:117-119, 668-669`) — confirmed structurally dead code
  (see D2 below), a separate concern from this item's own ask.
- **Out of scope:** anything about `fgos-coding-exploring`'s or `fgos-coding-planning`'s
  own Approve gates, or the `.fgos/gate-bypass.json` mechanical-bypass
  config (`docs/history/gate-bypass/CONTEXT.md` D1-D8) — that feature
  governs the OTHER two skill-embedded gates and explicitly treats this
  gate as an untouched, non-negotiable floor (its own D4). This item does
  not reopen or extend that feature; it revisits `keywordRiskGate`'s own,
  earlier, separate D3(b) design directly.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `keywordRiskGate` narrows from an unconditional floor ("risk=heavy always asks, regardless of what the verdict said" — `decompose.mjs:106-109`, D3(b)) to firing only when the verdict/`reason` does NOT show real evidence. The exact mechanical evidence-check (what "shows real evidence" means, checked how) is left to `fgos-coding-planning` — a real implementation choice, not decided here. |
| D2 | `blastRadiusGate`/`BLAST_RADIUS_GATE_THRESHOLD` stays untouched — out of this item's scope. Confirmed structurally dead code: `verdict.blastRadius` was only ever populated by `judgeDecompose`, retired in tsk-1x3; the live `fgos plan --verdict ...` CLI (`parseDecomposeCallerVerdict`, `bin/fgos.mjs`) has no `--blast-radius` flag and `resolveCallerDecomposeVerdict` never sets the field — `test/intake/plan.test.mjs:39-45` documents this directly as one of "THREE REAL DEAD-CODE FINDINGS", "structurally unreachable... harmless". Cleanup, if wanted, is a separate item. |

## Pinned terms

- **"genuinely unstable" / "real evidence"** (the item's own wording) —
  pinned by D1 to mean: the verdict/reason `keywordRiskGate` currently
  checks nothing about, beyond `work.risk`. `fgos-coding-planning` designs the
  actual mechanical check; this doc only locks that the check must read
  the VERDICT'S OWN CONTENT (not a static item property like risk tier) —
  same "mechanical, not the session's own confidence/vibe read" discipline
  `docs/history/gate-bypass/CONTEXT.md` D2 already applies to its own
  gates, reused here by the same reasoning, not copied.
- **`risksGate`** = `keywordRiskGate || blastRadiusGate`
  (`decompose.mjs:670`) — this item changes only the first disjunct's
  trigger condition, never the OR shape itself or `blastRadiusGate`.

## Why D1 is a real reversal, not a bug fix

`keywordRiskGate` was a deliberate, already-decided design
(`decompose.mjs:106-109`, comment: "risk-heavy root always routes through
the human gate regardless of what the verdict said — the threshold
resolved at validating (feasibility matrix row 4)"), from the original
`resolveDecompose` build (commit `3a982bd0`, 2026-07-16). Its whole point
was independence from verdict content — a safety net against a confident-
but-wrong verdict on a risky item.

What changed since then, and grounds D1 (not present when D3(b) was
locked): `judgeDecompose` — the independent model/subprocess judge that
used to generate verdicts — is now retired (tsk-1x3). Every live verdict
`resolveDecompose` sees today comes from an explicit `--verdict` supplied
by the SAME live session that then hits the gate (`decompose.mjs:588-599`
throws when no `--verdict` is given, telling the caller to reason about it
itself). So `keywordRiskGate` today is not "a second opinion on a model's
proposal" — it is "always double-check a live session's own proposal on
heavy-risk items, never trust that session alone." D1 accepts narrowing
that specifically because there is no longer a meaningfully DIFFERENT
second opinion to fall back on if the floor were removed outright — a
mechanical evidence-check on the verdict's own content is the compromise
locked here, not full removal (declined) and not the status quo (declined).

## Scout evidence cited

- `src/intake/plan.mjs:106-119` — `HEAVY_RISK`/`DEFAULT_RISK_GATE_REASON`
  and `BLAST_RADIUS_GATE_THRESHOLD`/`DEFAULT_BLAST_RADIUS_GATE_REASON`
  definitions, with D3(b)'s own rationale comment.
- `src/intake/plan.mjs:654-682` — `keywordRiskGate`/`blastRadiusGate`/
  `risksGate` computation and the `need-human` branch that applies them.
- `src/intake/plan.mjs:467-470, 588-599` — `judgeDecompose` retirement
  (tsk-1x3) and the resulting hard requirement that a live session supply
  `--verdict` itself; no automatic verdict generation remains.
- `test/intake/plan.test.mjs:20-45` — existing coverage for
  `need-human`/heavy-risk/blast-radius paths, and the file's own
  "THREE REAL DEAD-CODE FINDINGS" section confirming `blastRadiusGate` is
  structurally unreachable today.
- `docs/history/gate-bypass/CONTEXT.md` D4 — the separate,
  later mechanical-bypass feature that treats this gate as a
  non-negotiable floor for its OWN purposes (never letting a config-level
  bypass reach it); inherits D3(b) as a given rather than re-deriving it.
  Confirmed out of scope for this item (Feature boundary above).
- `docs/history/tsk-wve-risksgate-instability-exception/RESEARCH.md` —
  round 1, full findings this doc summarizes.
- Impact-analysis capability gate (`AGENTS.md`): `fgos tool query
  --capability impact-analysis --status present` → 1 provider (`gitnexus`),
  `status: "present"` → **full**. Informational only; this doc changes no
  code, so no impact-analysis run was needed for exploring itself —
  `fgos-coding-planning`/`fgos-coding-implement` run their own fresh check per the
  same gate.

## Outstanding questions

None
