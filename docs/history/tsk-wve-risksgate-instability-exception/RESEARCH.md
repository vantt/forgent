# RESEARCH.md — tsk-wve

## Round 1 — 2026-08-11

**Asked:** Is it clear what tsk-wve wants, and what does the caller need to
know to move it forward? Goal (from the item text): `risksGate` in
`resolveDecompose` should stop asking a human to confirm by default merely
because `work.risk === 'heavy'` (or blast-radius crosses a threshold) —
real usage shows that ask always gets approved once a Feasibility matrix
with a Recommended option already exists, and there is no remaining lever
a human can pull there. The gate should only fire when the system itself
judges the specific proposal genuinely unstable / worth a real discussion.

**Checked — repo, mechanical code:**

- `src/intake/plan.mjs:106-119` — the exact mechanism named in the
  item:
  ```
  const HEAVY_RISK = 'heavy';
  const DEFAULT_RISK_GATE_REASON = 'Item gốc có risk cao (heavy) — cần xác nhận trước khi chia.';
  const BLAST_RADIUS_GATE_THRESHOLD = 20;
  const DEFAULT_BLAST_RADIUS_GATE_REASON = 'Blast-radius (impact-analysis) vượt ngưỡng cảnh báo — cần xác nhận trước khi chia.';
  ```
  and lines 654-682:
  ```
  const heavyRiskAlreadyConfirmed = ...gate?.answer... && gate.ask.includes(DEFAULT_RISK_GATE_REASON);
  const keywordRiskGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed;
  const blastRadiusAlreadyConfirmed = ...gate?.answer... && gate.ask.includes(DEFAULT_BLAST_RADIUS_GATE_REASON);
  const blastRadiusGate = Number.isFinite(verdict.blastRadius) && verdict.blastRadius >= BLAST_RADIUS_GATE_THRESHOLD && !blastRadiusAlreadyConfirmed;
  const risksGate = keywordRiskGate || blastRadiusGate;

  if (verdict.kind === 'need-human' || risksGate) { ...putInAwaiting(...); return { outcome: 'need-human', ... }; }
  ```
  So `risksGate` is a pure function of `work.risk`/`blastRadius` — it never
  reads the verdict's own content (whether a Feasibility matrix was
  produced, whether an option is marked Recommended, whether the model's
  own confidence is high). It already skips re-asking the SAME item twice
  (`heavyRiskAlreadyConfirmed`/`blastRadiusAlreadyConfirmed`, matched by
  the gate's `ask` text containing the fixed reason string) — so the
  friction the item complains about is exactly one ask per heavy-risk
  root, not a repeated one.

- `src/intake/plan.mjs:106-109` — a comment directly on `HEAVY_RISK`
  states this is a **deliberate, already-decided** design, not an
  oversight:
  > "D3(b): risk-heavy root always routes through the human gate
  > regardless of what the verdict said — the threshold resolved at
  > validating (feasibility matrix row 4): risk domain mirrors tier
  > (classify.mjs), and 'heavy' is the one value that gates."

  i.e. this exact question — should risk=heavy always force a human gate
  regardless of what the proposal says — was already run through a
  Feasibility-matrix decision once, at `fgos-coding-validating` time, row 4,
  during the original `resolveDecompose` build (commit `3a982bd0`,
  2026-07-16, `feat(stage-decompose-2)`). No `docs/history/<feature>/`
  folder survives for that original decision (checked: no
  `stage-decompose-2` dir under `docs/history/`; the commit shipped
  `decompose.mjs` + its test file with no accompanying plan doc), so the
  D3(b) code comment is the only durable trace of that original call.

  Blast-radius (`BLAST_RADIUS_GATE_THRESHOLD = 20`) is a *later, separate*
  addition (`work-item-priority-matrix D4/D8, Phase C`, line 113-119) with
  its own comment: "a real blast-radius measurement ADDS caution, never
  removes it... neither gate ever loosens the other." So this gate is
  actually two independently-added mechanical floors, not one.

- `docs/history/gate-bypass/CONTEXT.md` D4 (tsk-6bx, 2026-08-xx, quoted in
  full in the prior round of conversation): "Hard-gate/high-risk items
  (RUL34 risk-keyword/module flags, `src/intake/risk-keywords.mjs`) always
  still stop for a human regardless of bypass setting. This floor is
  non-negotiable — mirrors bee's own non-negotiable floor for its riskiest
  lane." — this later item explicitly re-affirmed the same floor as
  non-negotiable when building the *separate* mechanical-bypass feature
  for the OTHER two skill-embedded gates (`fgos-coding-exploring`/`fgos-coding-planning`
  Approve prompts). D4 there is about NOT letting the config-level bypass
  reach this gate at all — it does not itself re-derive whether the gate
  should exist, it inherits `HEAVY_RISK`'s prior D3(b) decision as a given.

- `test/intake/plan.test.mjs` — real, existing coverage for this
  exact gate: `need-human` outcome assertions for heavy-risk/blast-radius/
  footprint-overlap paths (lines ~565, ~606, ~645, plus the
  `heavyRiskAlreadyConfirmed`/`blastRadiusAlreadyConfirmed` skip-on-re-ask
  behavior). A change here has a concrete, runnable verify surface already:
  `npm test -- test/intake/plan.test.mjs` (392 lines, exercises
  `resolveDecompose`/`judgeDecompose` end to end against a real store
  fixture, not mocked).

- `formatProposalAsk` (`decompose.mjs:282-297`) is what actually renders
  the "Feasibility matrix + Recommended option" text the item's evidence
  (tsk-49e) describes — confirmed this is real output of the SAME
  function whether the underlying verdict is `decompose` or
  `pass-through`; `risksGate`'s check runs entirely independently of
  what that render contains.

**Not found in repo / external:** nothing external to check — this is a
pure in-repo policy question, no library/framework/concept outside this
codebase is involved.

**Still open (for `fgos-coding-exploring`/`fgos-coding-planning`, not this skill's job):**

- What "the system itself judges the proposal genuinely unstable" should
  be measured BY, mechanically — the item's own text names a negative
  ("not by risk tier, not by blast-radius, not by default") but not a
  positive replacement signal. Candidates worth scoping there: the
  verdict's own `kind` (e.g. only `need-human` from the model itself, i.e.
  drop the `|| risksGate` clause entirely and trust `judgeDecompose`'s own
  `need-human` verdicts alone), a confidence/ambiguity field the model
  verdict could carry, or something else — a real product decision, not a
  mechanical fact this round can resolve.
- Whether this supersedes D3(b) in place (no doc exists to formally
  supersede) or needs its own new decision record superseding both D3(b)
  (`decompose.mjs`'s own comment) and gate-bypass's D4 (which inherits
  D3(b) as a given) — `AGENTS.md`'s "Changing a locked law" convention
  says supersede-by-ID, never edit in place; D3(b) has no dedicated
  history folder to supersede INTO, which `fgos-coding-planning` will need to
  decide how to handle (e.g. write it into this item's own new folder).
  Not itself a blocker to `exploring`: this is a documentation-placement
  question, not evidence against the change.

## Verdict

**Clear.** The goal is well-defined and the code path is fully located and
read. What remains (the mechanical replacement signal for "genuinely
unstable", and how to record the supersession of D3(b)) are real design
decisions for `fgos-coding-exploring`/`fgos-coding-planning`, not gaps in understanding
what is being asked.

```json
{"clear": true, "verify": "npm test -- test/intake/plan.test.mjs"}
```
