# tsk-5cf — plan

## Mode

Flags counted against CONTEXT.md's locked scope (D1: both stabilize +
override):

- **external systems** — yes: the fix touches `runJudgeExecutor`'s prompt
  construction, which drives a real LLM subprocess call (`judge-executor.mjs`).
- **public contracts** — yes: D1b adds a new `fgos discover` CLI flag
  (override), a surface other consumers read (`herdr-plugin/src/fgos.rs`
  parses this CLI's `--json` output elsewhere per decision record 0027's
  audit — same command family).
- **existing covered behavior** — yes: `judgeVerifySemanticCorrectness` and
  `fgos discover`'s dispute-park path both have existing test coverage
  (`test/intake/judge-executor.test.mjs`, `docs/explanation/judge-verdict-
  second-pass-semantic-check.md`'s documented contract) that must not
  regress.
- **weak proof around the area** — yes: the bug is LLM non-determinism
  itself; a "the judge is now stable" claim is inherently hard to prove
  with a single deterministic assertion (confirmed live: `tsk-5cf`'s own
  clarify-stage verify negotiation with this exact judge failed 5
  consecutive rounds before this plan even started, both on file-existence
  grounds and on "can't reproduce live-LLM non-determinism with a static
  unit test").

4 flags → **high-risk** per the mechanical count. A smaller mode would
under-cover this: the failure mode is a live, reproduced, external-model
behavior bug, not a local logic bug with a clean pre/post assertion.

Impact-analysis posture: `full` (GitNexus `present`, confirmed via `fgos
tool query --capability impact-analysis --status present` both at
`fgos-coding-exploring` and again here).

## No split

`judgeVerifySemanticCorrectness`'s callers (GitNexus `impact`,
`fgos-coding-exploring` step) are `resolveDiscovery`/`resolveDecompose`/
`discovery.test.mjs` — a small, contained blast radius. D1a (stabilize) and
D1b (override) are locked as one claim (D1: "both"), touch overlapping
files (`judge-executor.mjs`'s prompt builder feeds the same call
`bin/fgos.mjs discover` would need a new flag on), and together are still a
few-file change, not a multi-piece build. Splitting into two children would
add coordination overhead (two claims, two worktrees, two merges) without
buying independent shippability — D1b's override is only actually needed
*because* D1a might not fully eliminate disagreement, so reviewing them
together lets one PR show the override is the real fallback, not the
primary fix. Proceeds as one item.

## Approach

**D1a — stabilize the judge.** `buildVerifyCheckPrompt` (`judge-executor.mjs:
305-329`) takes only `{title, description, proposedVerify}` — no memory of
its own prior verdicts for the same item. Thread the item's own prior
`judgeVerifySemanticCorrectness` rejection reasons (if any exist for this
exact item+round) into the next round's prompt, the same way
`resolveDiscovery` already threads `view.discovery[id]`'s prior verdicts
into `judgeDiscovery`'s own prompt (an existing, precedented pattern in
this same file family — read the `judgeDiscovery` prompt builder to match
its shape, not invent a new one). This directly targets the reproduced
failure: round 8 contradicting round 6's own stated criterion becomes
visibly self-contradictory to the model when its own round-6 reasoning is
right there in round 8's prompt.

Rejected alternative: lowering temperature / pinning sampling params alone.
Doesn't fix a model asked the same open-ended question twice with zero
context reusing DIFFERENT criteria each time (the reproduced failure is
criteria drift, not just wording noise) — prior-verdict context is the
more direct fix; a sampling change is a cheap complementary tweak, not
locked as its own required piece here (left as an implementation-detail
choice at Execute, not gated).

**D1b — override escape hatch.** Add a new `fgos discover --force` flag
(names to be finalized at Execute — `plan.md` locks the behavior, not the
exact flag spelling) that, when a caller supplies a verdict AND the second
pass disagrees, proceeds with `moveStage` anyway instead of parking —
logging a decision record (`fgos decision`) that names the override was
used and why (never a silent bypass, matching this codebase's existing
"never silently overridden" stance for the two-judge disagreement path
per `docs/explanation/judge-verdict-second-pass-semantic-check.md`). This
is the fallback for the residual case D1a cannot structurally guarantee
away (two independent LLM judgments can still genuinely disagree even with
shared context) — confirmed necessary by direct reproduction on both
`tsk-4xg` (10 rounds, never converged) and `tsk-5cf` itself (5 rounds,
never converged), both eventually unblocked only via a *different*,
pre-existing trust path (`readLockedContext`/`docsRef`, tsk-ozl D2/D3),
not via anything this override would have been.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `buildVerifyCheckPrompt` prompt change | Medium — could shift the judge's behavior in unintended ways beyond fixing the contradiction | A regression check: existing `test/intake/judge-executor.test.mjs` cases for this function still pass unchanged (fixed-mock executor, deterministic) |
| Prior-verdict threading source | Medium — needs a real per-item store of prior second-pass verdicts (none exists today; only `view.discovery[id]` stores first-pass `judgeDiscovery` verdicts) | Confirm at Execute whether a new event kind is needed, or whether prior second-pass reasons can be derived from existing `awaiting-human` ask-text history (`putInAwaiting`'s own `ask` string already contains it, per `resolveDiscovery`'s dispute-park code) — cheaper, reuses existing data, avoids a new event kind (YAGNI) |
| New `discover --force` flag | Low-medium — a new CLI surface, but additive (no existing behavior changes when omitted) | CLI-level test: `--force` proceeds past a disputed second pass; omitting it still parks exactly as today (no regression) |
| Decision-log audit trail for override use | Low | Test asserts `fgos decision`/an equivalent record is written whenever `--force` actually overrides a disagreement |

## Proof surface (verify for this item as a whole)

`node --test test/intake/judge-verify-second-pass-stability.test.mjs &&
node --test test/state/discover-verdict-override.test.mjs` — same as the
value already recorded on the item via the `docsRef`/`lockedContext` trust
path used to unblock `clarify`→`decompose` (tsk-ozl D2/D3), carried
forward as the real Execute-stage target. `judge-verify-second-pass-
stability.test.mjs` covers D1a with a fixed-mock judge executor (never a
live LLM call in CI — matches this repo's existing fixed-mock pattern in
`test/intake/judge-executor.test.mjs`) asserting a second-round prompt
contains the first round's stated rejection reason. `discover-verdict-
override.test.mjs` covers D1b at the CLI level.

## Assumptions

- The override flag's exact name/spelling is an implementation detail, not
  locked here (not material to scope/behavior per `fgos-coding-exploring`'s own
  filter — CONTEXT.md correctly left it unspecified).
- Reusing `putInAwaiting`'s existing `ask` text as the prior-round-reason
  source (rather than a new event kind) is a proposed default, not proven
  yet — flagged here for `fgos-coding-validating` to confirm feasible against the
  real store shape before Execute commits to it.
