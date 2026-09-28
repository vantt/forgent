# synthesize-recommendation (real, asgn_coordinator_driver_op_027)

## Dispatched objective (verbatim)

Recommend ONE architecture for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification, keeping live disagreement visible rather than smoothing it into a footnote. The real ledger: Proposal A (system-shaper) -- keep looksStructured() as a flat, ordered OR-chain of small named detectors, not a pluggable registry; the only consumer (terminal-render.ts) reads just block.mode, never detector reasoning. Proposal B (alternative-shaper) -- a 'Pluggable Output Grammar' architecture: a registry of layout signatures replacing the monolithic heuristics. Proposal C (constraint-advocate) -- keep the current architecture, the only shape that stays cheaply unit-testable without a browser/corpus. The critic's attack on A (the strongest proposal): its reliance on consumer output shape ignores internal maintainability and producer-side scaling. The constraint-advocate's own risk ranking: B is HIGHEST risk (unmotivated abstraction over 6 hand-tuned interdependent heuristics with documented false-positive exclusions -- arrows excluded from BOX_CHARS, menu-cursor+sibling-count combo, summary Q&A adjacency -- migration/regression risk, weaker debuggability in an asymmetric-cost domain, a YAGNI violation with no evidence of a real pluggability requirement); A and C are near-zero risk, functionally identical to what is already deployed. Also weigh the real prior operator decision locked 2026-08-11 in herdr-gateway's own plan.md (fully automatic, no UI control, err toward pan when unsure) and the real prior finding that phase-04's own required corpus + confusion matrix was never built. Use absolute paths for anything you additionally read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts there: /home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_027/runs/01/agent-result.json for the structured JSON, and .../agent-report.md for the human-readable report (the exact assignment id will be confirmed in this operation's own dispatch context; if it differs from op_027, use the runDir this dispatch actually tells you). Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Recommend Proposal A's shape (identical to C's status quo): keep looksStructured() as a flat ordered OR-chain of small named detectors in one file. Reject B's pluggable registry. No code change. The critic's attack on A is upheld — A's 'consumer only reads block.mode' premise is verified true at terminal-render.ts:161 but is the wrong load-bearing reason, since this file's cost is entirely producer-side and git history (0.1.18/0.1.19/0.1.20, three consecutive heuristic-adding commits) shows the producer is actively scaling. A's reason is replaced, not its shape: the six detectors are independent in evaluation but interdependent in tuning through a shared character vocabulary (BOX_CHARS excludes the arrow precisely so SUMMARY_ANSWER can claim it), and co-location is the only thing documenting that contract. B loses on that specific ground rather than generic YAGNI: it is behaviourally equivalent (pure OR chain, order not semantically load-bearing — the strongest pro-B point, which no panelist made), so it buys zero behaviour change while splitting matched exclusion notes into files that no longer explain each other — a concrete debuggability regression in an asymmetric-cost domain. The constraint-advocate's HIGHEST-risk ranking on B therefore survives. C overclaims: 'not cheaply testable without a corpus' is a false constraint, since looksStructured and stableGutters are exported pure string[]-in functions, so the current shape makes a corpus cheap rather than unnecessary. The one authorized action is non-architectural: build phase-04's never-built corpus plus a confusion matrix scored on false-wrap rate (not accuracy), because all three proposals share the same blind spot — none can say whether the six detectors are correct, and a registry measures nothing.",
  "recommendation": {
    "adopt": "A (shape) == C (status quo)",
    "reject": "B (Pluggable Output Grammar registry)",
    "code_change_required": false,
    "action_item": "Build phase-04 corpus + asymmetry-weighted confusion matrix (metric: false-wrap rate held near zero, false-pan tolerated), consistent with the 2026-08-11 operator decision.",
    "amendment_to_A": "Retire A's consumer-shape justification; replace with cross-detector tuning-vocabulary coupling as the reason co-location is load-bearing.",
    "amendment_to_C": "Keep C's shape argument; drop C's 'without a corpus' framing — the corpus is cheap because of this shape, not obviated by it."
  },
  "verified_claims": [
    {
      "claim": "Consumer reads only block.mode",
      "verdict": "CONFIRMED",
      "evidence": "/home/vantt/projects/herdr-gateway/web/src/terminal-render.ts:161"
    },
    {
      "claim": "looksStructured is a flat ordered OR-chain of 6 detectors",
      "verdict": "CONFIRMED",
      "evidence": "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts:131-176"
    },
    {
      "claim": "Three heuristics encode documented false-positive exclusions",
      "verdict": "CONFIRMED",
      "evidence": "block-classify.ts:43-50 (arrows out of BOX_CHARS), :161-167 (menu cursor + sibling count), :83-98 and :169-173 (summary Q&A adjacency)"
    },
    {
      "claim": "Prior operator decision: fully automatic, no UI control, err toward pan",
      "verdict": "CONFIRMED in-source",
      "evidence": "block-classify.ts:9-16 states the no-UI-control premise and derives pan-as-default from it"
    },
    {
      "claim": "Producer side is actively scaling",
      "verdict": "CONFIRMED",
      "evidence": "commits 881fa33 (0.1.18), 15b1203 (0.1.19), c1bebce (0.1.20) each add/widen a heuristic, mapping onto isFramingRule, MENU_*, SUMMARY_*"
    },
    {
      "claim": "phase-04 corpus + confusion matrix never built",
      "verdict": "TAKEN AS GIVEN",
      "evidence": "dispatch context only; not independently verified this session"
    }
  ],
  "reopen_triggers": [
    "A signature must be registered without editing block-classify.ts (plugin, or a second consumer with different needs).",
    "Detector count exceeds ~10 AND new detectors carry no cross-detector vocabulary coupling."
  ],
  "limitations": [
    "Bash unavailable this session — every command including ls/find returned 'requires approval', so plans/ could not be enumerated and plan.md / the phase-04 phase file were not opened directly.",
    "The phase-04 corpus gap is load-bearing for the action item but rests on dispatch assertion; worth one confirmation pass by a session with filesystem listing."
  ],
  "unresolved_questions": [
    "Does a partial corpus already exist under plans/ or web/src/__tests__/ that predates the phase-04 finding?",
    "Does the 0.1.20 reply-guard tail window live in block-classify.ts or a sibling module? It was not in the file read; if elsewhere, the real detector surface exceeds six and the reopen trigger tightens."
  ],
  "artifacts": {
    "report": "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_027/runs/01/agent-report.md"
  }
}
```

## Real agent-report.md (verbatim)

# Synthesis — block-classify.ts terminal-detail block classification

**Assignment:** asgn_coordinator_driver_op_027 · run 01 · role: synthesizer
**Date:** 2026-09-07
**Artifact under decision:** `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`

---

## Recommendation

**Adopt Proposal A's shape, which is Proposal C's status quo. Reject Proposal B as the
architecture. Change no code.**

The single action this decision authorizes is not architectural: **build the phase-04 corpus
and an asymmetry-weighted confusion matrix.** That is what the critic's attack actually earns,
and it is the only proposal-independent gap on the table.

A and C are the same artifact. Their disagreement is about justification and about what is
still owed — not about the code. So the recommendation adopts A's shape while **replacing A's
stated reason**, which is verified-true and load-bearing-wrong.

---

## What I verified directly

| Claim | Status | Evidence |
|---|---|---|
| Consumer reads only `block.mode`, never detector reasoning | **CONFIRMED** | `terminal-render.ts:161` — `el.className = \`term-block is-${block.mode}\``. That is the sole read of a `Block` field other than `.lines`/`.start`. No detector identity crosses the boundary. |
| `looksStructured()` is a flat ordered OR-chain of 6 detectors | **CONFIRMED** | `block-classify.ts:131-176` — gutters, framing rule, box ratio, pipe columns, menu cursor, summary pairs. Every branch returns `true`. |
| Three heuristics exist because of documented false-positive exclusions | **CONFIRMED** | Arrows excluded from `BOX_CHARS` (lines 43-50); menu cursor + `MENU_MIN_ITEMS` sibling combo (lines 161-167); summary Q&A adjacency (lines 83-98, 169-173). |
| Prior operator decision: fully automatic, no UI control, err toward pan | **CONFIRMED in-source** | Header comment lines 9-16 states the asymmetry and the no-UI-control premise verbatim, and derives `pan` as default from it. I could not open `plan.md` (see Limitations), but the decision is inscribed in the artifact itself. |
| Producer side is actively scaling | **CONFIRMED** | Three consecutive commits — `881fa33` (0.1.18, rules + choice menus), `15b1203` (0.1.19, Q&A summary), `c1bebce` (0.1.20, reply guard tail) — each added or widened a heuristic. These map 1:1 onto `isFramingRule`, `MENU_*`, and `SUMMARY_*`. |
| phase-04's required corpus + confusion matrix never built | **Taken as given** (dispatch); not independently verified — see Limitations. |

---

## The live disagreement, kept live

### The critic is right about A, and it does not change the verdict

A's argument is that the consumer only reads `block.mode`, so no pluggable seam is owed. That
premise is **factually true** — I confirmed it at `terminal-render.ts:161`. The critic's attack
is nonetheless correct: **consumer output shape is the wrong load-bearing argument here.** The
maintenance cost of this file has never been on the consumer side. It is entirely producer-side,
and the git history proves the producer is scaling — three releases in a row, each one a new
heuristic.

So A reaches the right shape via an argument that will not survive the next false positive.
**Adopt A's shape; retire A's reason.**

### The reason that should replace it

The six detectors are independent *in evaluation* and **interdependent in tuning**, through a
shared character vocabulary. The clearest instance:

- `BOX_CHARS` (line 50) deliberately excludes `→`, because an agent scatters arrows through
  prose (lines 43-49).
- `SUMMARY_ANSWER` (line 79) then **claims** `→`, but only in one specific position — alone at
  line start, directly under a bulleted question, twice (lines 83-98).

Those two comment blocks are a **matched pair**. Neither is correct or even intelligible without
the other. The exclusion is what makes the claim safe; the claim is what makes the exclusion
affordable. Co-location in one file is not incidental tidiness — it is the only thing currently
documenting that contract.

### The strongest point in B's favour, which nobody on the panel made

Since every detector returns `true` → pan and the chain is a pure boolean OR, **ordering is not
semantically load-bearing today.** A registry of predicates would be behaviourally equivalent.
B is therefore not *wrong*; it is *unmotivated*. That concession should be recorded rather than
smoothed away.

But it is also exactly why B loses. A migration that is behaviour-preserving-and-identical pays
full migration and regression risk for zero behavioural gain — and spends, in the process, the
one asset the file has. Splitting six detectors into independently-registered signature modules
puts the `BOX_CHARS` exclusion and the `SUMMARY_ANSWER` claim in different files, where neither
explains the other. In a domain where misclassification cost is asymmetric and unrecoverable
(structured-wrongly-wrapped destroys alignment permanently; prose-wrongly-panned is just the
prior shipped behaviour), losing the cross-detector tuning rationale is a **concrete
debuggability regression**, not an abstract YAGNI objection.

**The constraint-advocate's HIGHEST-risk ranking on B survives — but on this specific ground,
not on the generic one.**

### Where C overclaims

C defends the current shape as "the only shape that stays cheaply unit-testable without a
browser/corpus." The "without a corpus" framing is a false constraint. `looksStructured` and
`stableGutters` are both **exported** and both pure `string[] → boolean`/`number`. A corpus here
is a fixture directory of captured screens plus expected modes — no browser, no DOM, no harness.

The current shape does not make a corpus unnecessary. **It makes a corpus cheap.** C should keep
its shape argument and give up its excuse for the missing corpus.

---

## What all three proposals share as a weakness

None of A, B, or C can tell you whether the six detectors are *correct*. A registry measures
nothing. The status quo measures nothing. The standing gap — phase-04's own required corpus and
confusion matrix, never built — is untouched by every option on the ledger.

That is where the critic's producer-scaling attack should be routed. Producer churn is an
argument for **better evidence**, not for a different container.

**One caveat on the matrix:** plain accuracy would mislead here. The operative metric is the
**false-wrap rate** (structured misclassified as prose — unrecoverable), held near zero, with
false-pan tolerated freely. A symmetric confusion matrix scored on overall accuracy would
actively push the classifier the wrong way against the 2026-08-11 operator decision.

---

## Trigger to reopen B

Reconsider a registry only when one of these is observably true:

1. A signature must be contributed **without editing this file** — a plugin, a
   consumer-specific layout, or a second consumer with different needs.
2. Detector count crosses roughly ten **and** the new detectors carry no cross-detector
   vocabulary coupling (i.e. the `BOX_CHARS`/`SUMMARY_ANSWER`-style matched pairs stop
   appearing).

Neither holds today. Detector count is six and the coupling is present and load-bearing.

---

## Limitations

- **Bash was unavailable this session** — every command, including `ls` and `find`, returned
  "requires approval." I could not enumerate `plans/`, so `plan.md` (2026-08-11 decision) and
  the phase-04 phase file were not opened directly.
- The 2026-08-11 decision is nonetheless **confirmed from the primary artifact**: the header
  comment at `block-classify.ts:9-16` states the no-UI-control premise and derives pan-when-unsure
  from it.
- The "phase-04 corpus never built" finding is **taken as given from dispatch, not
  independently verified.** It is load-bearing for the action item. Worth one confirmation pass
  by a session with filesystem listing before that item is scheduled.

## Unresolved questions

1. Does a partial corpus already exist under `plans/` or `web/src/__tests__/` that the phase-04
   finding predates? Unverifiable here without Bash.
2. Is the reply-guard tail window from `c1bebce` (0.1.20) inside `block-classify.ts` or in a
   sibling module? It did not appear in the file I read — if it lives elsewhere, the classifier's
   real detector surface is wider than six, which tightens the reopen trigger above.
