# tsk-5cf — judgeVerifySemanticCorrectness gives contradictory round-to-round verdicts

## Feature boundary

`judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs:340-362`,
invoked from `resolveDiscovery`/`resolveDecompose` in
`src/intake/discovery.mjs`/`decompose.mjs` via `fgos discover`/`fgos
decompose`) is the second, independent judge pass that must agree a
proposed `verify` command actually proves an item's claim before
`clarify`→`decompose` (or a child's `decompose`→`executing`) can fire.
Reproduced live on `tsk-4xg` (docs/history/
tsk-4xg-plugin-marketplace-doctor-check/CONTEXT.md): across 10 rounds of
proposing a corrected `verify` in response to each round's stated
objection, the judge's own stated criteria flatly reversed at least
twice (round 6 rejected a direct keyword grep as "too generic/just word
presence"; round 8 explicitly demanded that same direct-grep approach
back; round 9 rejected a more specific phrase-grep as "too specific" —
the opposite of round 6's complaint). No CLI escape hatch exists today:
`fgos discover` has no flag to accept a disputed second-pass verdict, and
`fgos edit --verify` patches the field but does not itself fire the
`clarify`→`decompose` transition (still gated through `discover`'s judge
call). Net effect: a genuine two-judge disagreement can strand any
clarify-stage item in an `awaiting-human`/`doing` loop indefinitely, with
no way for a person to just accept a verify and move on.

This item covers `judgeVerifySemanticCorrectness` only — `judgeDiscovery`'s
first-pass verdict and `judgeDecompose`'s per-child verify check reuse the
same function (confirmed by the GitNexus caller list: `resolveDecompose`,
`resolveDiscovery`, `discovery.test.mjs`), so a fix here benefits both
call sites without this item needing to touch `decompose.mjs`'s own logic
separately.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Fix scope is both halves: (a) stabilize the judge itself, and (b) add a person-facing override escape hatch. Grounded in reading `buildVerifyCheckPrompt` (`judge-executor.mjs:305-329`): each round's prompt is built fresh from only `{title, description, proposedVerify}` — zero memory of the judge's own prior-round verdicts/reasons — which structurally explains the reproduced contradictions (each round is an independent judgment free to invent new unstated criteria). Stabilizing addresses the root cause; the override addresses the residual case where two independent judgments simply never converge (a real, not just theoretical, failure mode — this is a second, independent LLM pass, not a deterministic check). |
| D2 | Item stays at default `tier: standard` / `risk: standard` — not bumped to `heavy`. Consequences were surfaced and explicitly accepted: `risk: heavy` would force a mandatory human gate at `decompose` regardless of the model's own decompose judgment (`decompose.mjs` D3(b): "risk-heavy root always routes through the human gate"); `tier` selects which model tier runs this item's own judge calls (`modelForTier`, `judge-executor.mjs`); neither field affects frontier pick-order on its own (`priority` is a separate, later-computed field, `frontier.mjs`). |

## Scout evidence

- `src/intake/judge-executor.mjs:340-362` — `judgeVerifySemanticCorrectness`
  definition: spawns one judge call via `runJudgeExecutor`, folds any
  spawn/parse failure or `agrees !== boolean` to `{agrees: false,
  reason: DEFAULT_VERIFY_DISAGREE_REASON}` (fail-safe stance, matches
  discovery.mjs's own D4) — never throws, never silently agrees.
- `src/intake/judge-executor.mjs:305-329` — `buildVerifyCheckPrompt`: the
  full prompt template. Confirmed inputs are exactly `title`,
  `description` (item's own, "(không có)" if empty), and the current
  round's `proposedVerify` — no prior-round context of any kind is
  threaded in.
- `src/intake/discovery.mjs:643-657` (`resolveDiscovery`'s dispute
  handling) — on disagreement, calls `putInAwaiting(dir, {id, ask,
  statusAtAsk: work.status})` and returns `{outcome: 'verify-disputed',
  ...}`; the same `awaiting-human` park an unclear first-pass verdict
  already uses (per `docs/explanation/judge-verdict-second-pass-semantic-
  check.md`, this project's own existing doc on why disagreement parks
  instead of retrying).
- `docs/explanation/judge-verdict-second-pass-semantic-check.md` — this
  project's own design rationale for the second pass existing at all
  (catches syntactically-valid-but-wrong-target `verify` strings, a real
  prior failure on `tsk-d3c`). Confirms disagreement-parks-not-retries is
  an intentional design choice, not a bug in itself — the bug this item
  covers is the judge's own criteria being unstable round to round, not
  the parking mechanism.
- `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md`
  — prior precedent of 3-4 verify-disputed rounds being normal/expected
  and each catching a real gap. `tsk-4xg`'s reproduction (10 rounds,
  contradictory not just additive objections) goes past that precedent.
- `src/intake/plan.mjs` — confirms `risk: heavy` triggers
  `DEFAULT_RISK_GATE_REASON` mandatory human gate at decompose (D3(b)),
  grounding D2's stated trade-off.
- `src/runner/dispatch.mjs:590-596` (`modelForTier`) + this repo's local
  `.fgos/config.json` having an empty `models` map (falls to defaults
  elsewhere, exact tier→model mapping not resolved here — implementation
  detail, out of this skill's scope) — grounds D2's tier-affects-judge-
  model claim without overclaiming the exact model swap.
- `src/state/frontier.mjs:148-156` — confirms `priority` (not
  tier/risk directly) drives frontier pick order, and is computed later
  (at `discover` time, via `computePriority({impact, urgent, risk})`,
  `discovery.mjs:627`) — grounds D2's "no direct queue-jump today" note.
- GitNexus `impact({target: "judgeVerifySemanticCorrectness"})` caller
  list — `resolveDecompose`, `resolveDiscovery`, `discovery.test.mjs` —
  confirms the blast radius named in the Feature boundary above.
  `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered, `status: "present"` — impact-analysis: full.

## Pinned terms

- "the second pass" / "the judge" in this item's title/description means
  `judgeVerifySemanticCorrectness` specifically — never `judgeDiscovery`
  (the first-pass verdict) or `judgeDecompose`'s own separate splitting
  logic, even though both call this same function for their own verify
  checks.
- "stabilize" (D1a) means: give the judge continuity across rounds for
  the *same item* (e.g. its own prior rejection reasons folded into the
  next round's prompt) and/or reduce call-to-call variance — the exact
  mechanism is left to `fgos-coding-planning`, not decided here.
- "override" (D1b) means: some person-facing way to make `fgos discover`
  proceed past a disputed second-pass verdict without requiring the two
  judge passes to agree — the exact shape (a flag, reusing the recorded
  `fgos answer` text as authoritative, etc.) is left to `fgos-coding-planning`.

## Outstanding questions (deferred to planning)

- Exact stabilization mechanism (prior-round context injection vs.
  sampling/temperature change vs. a fixed rubric) is an implementation
  choice for `fgos-coding-planning`.
- Exact override mechanism and its own audit-trail/abuse-resistance
  shape (should it require a reason string, should it be logged
  distinctly from a normal `clear` verdict) is also left to planning —
  D1 only locks that an override exists, not its shape.
- Whether `judgeDiscovery`'s own first-pass instability (never actually
  reproduced or scouted here — only the second pass was) shares the same
  root cause is out of scope for this item; not assumed either way.
