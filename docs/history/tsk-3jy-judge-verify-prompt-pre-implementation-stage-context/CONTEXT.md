# tsk-3jy — judgeVerifySemanticCorrectness demands post-implementation proof at pre-implementation stages

## Feature boundary

`judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs:377`) is
the second-pass judge that checks a model-proposed `verify` command before
`clarify`→`decompose` (called from `discovery.mjs:667`) or a child's
`decompose`→`executing` (called from `decompose.mjs:835`) is allowed. Its
prompt (`buildVerifyCheckPrompt`, `judge-executor.mjs:329`) never tells the
judge model that the evaluation happens BEFORE any code implementing the
item exists — so the judge sometimes demands evidence that cannot exist
yet (e.g. "show me a git diff of the actual code changes"), producing a
category error rather than a real objection to the verify command's
syntax or targeting.

Scope of this fix: `buildVerifyCheckPrompt`'s prompt text only. No change
to `discovery.mjs`/`decompose.mjs` orchestration, no new round-tracking
state, no new parameter threaded into `judgeVerifySemanticCorrectness`'s
signature — both call sites already pass everything the new prompt text
needs (title/description/proposedVerify/priorRejection).

Out of scope: the `putInAwaiting` park-on-disagreement behavior itself
(`docs/explanation/judge-verdict-second-pass-semantic-check.md` — stays
as-is, working as designed), and the `--force` override path
(`discovery.mjs:684` — stays as the escape valve for a caller that already
reasoned through a disagreement live).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scope = `buildVerifyCheckPrompt` (`judge-executor.mjs:329`) only — add a stage-context instruction telling the judge this verify command is proposed BEFORE the code it verifies exists. No hard numeric round-cap added; `--force` (`discovery.mjs:684`) already exists as the escape valve for an unresolved dispute. |
| D2 | Instead of a numeric round cap, the added prompt text must require the judge to name a CONCRETE NEW missing check when it disagrees, never repeat a prior round's complaint reworded. Folded into the same prompt-text change as D1 — no separate round-tracking code added to `discovery.mjs`/`decompose.mjs`. |
| D3 | One generic stage-context instruction covers BOTH callers of `judgeVerifySemanticCorrectness` — `discovery.mjs:667` (clarify stage) and `decompose.mjs:835` (decompose stage, per-child). Both propose `verify` before code exists for that item/child, so no per-stage branching is added inside `buildVerifyCheckPrompt`. |

## Pinned terms

- **pre-implementation stage** — either `clarify` (item-level, via
  `discovery.mjs`) or `decompose` (child-level, via `decompose.mjs`): both
  propose a `verify` command for code that does not exist yet at the time
  of the judge call.
- **category error** — demanding evidence (post-implementation proof, e.g.
  a git diff) that structurally cannot exist at the stage being evaluated,
  as opposed to a legitimate objection to the command's syntax or
  targeting.

## Scout evidence

- `src/intake/judge-executor.mjs:329-360` (`buildVerifyCheckPrompt`) — the
  prompt gives the judge model `title`, `description`, `proposedVerify`,
  and optional `priorRejection` history, but never states what stage this
  evaluation happens at or what evidence is realistically available.
- `src/intake/judge-executor.mjs:377-411` (`judgeVerifySemanticCorrectness`)
  — wraps the prompt call; fail-safe (`{agrees:false}`) on any spawn/parse
  failure, unrelated to this fix.
- `src/intake/discovery.mjs:642-718` (`resolveDiscovery`) — clarify-stage
  caller. Threads `verifyDisputeHistory` (all prior "Đề xuất verify bị nghi
  ngờ" asks for this item) into `priorRejection`, so the judge already sees
  full round history — confirms the fix only needs new PROMPT TEXT, the
  history-threading plumbing already exists.
- `src/intake/plan.mjs:835` — decompose-stage caller, same function,
  confirms both stages are pre-implementation and share one fix.
- `docs/explanation/judge-verdict-second-pass-semantic-check.md` — confirms
  disagreement always parks via `putInAwaiting`, by design; this fix does
  not touch that behavior.
- Real transcript evidence (tsk-5iv, quoted in tsk-3jy's own description):
  round 1 correctly rejected a placeholder verify; round 2 correctly
  demanded more than a bare test-suite run; rounds 3-4 both demanded
  "git diff-level proof" for a command proposed before any code changes
  existed — the category error this fix addresses. Round 4 also repeated
  round 3's complaint in reworded form rather than naming a new gap — the
  behavior D2 addresses.
- `fgos tool query --capability impact-analysis --status present` — 1
  provider (gitnexus), `status: present`. Full impact-analysis posture
  applies for planning/executing.

## Canonical references

- `src/intake/judge-executor.mjs`
- `src/intake/discovery.mjs`
- `src/intake/plan.mjs`
- `docs/explanation/judge-verdict-second-pass-semantic-check.md`

## Outstanding questions deferred to planning

- Exact wording of the added prompt instruction (D1/D2 fix content) —
  implementer's choice, not a product decision.
- This item's own `verify` command (currently the placeholder "chưa xác
  định — P15 bổ sung") — a real, runnable command gets proposed at the
  `clarify`→`decompose` judge pass that follows this document, per the
  normal engine flow.
