# synthesize-recommendation (real, asgn_coordinator_driver_op_037)

## Dispatched objective (verbatim)

Recommend ONE architecture for herdr-gateway's terminal-detail classification (universal heuristic vs. per-agent grammar), keeping live disagreement visible rather than smoothing it into a footnote. The real ledger: Proposal A (system-shaper) -- stay in-system, evolve the universal classifier at /home/vantt/projects/herdr-gateway/web/src/block-classify.ts. Proposal B (alternative-shaper) -- a per-agent semantic grammar, HarnessAdapter-pattern inspired by /home/vantt/projects/herdr-gateway/upstreams/collie. Proposal C (constraint-advocate) -- keep the universal heuristic, patched reactively per counter-example. The critic's attack on B (the strongest-seeming alternative): importing collie's HarnessAdapter is massive over-engineering, because word-wrapping carries only a cosmetic risk profile, unlike collie's own motivating problem (keystroke injection / dialog-swallowing, incident #34, a safety-relevant failure mode). The constraint-advocate's own risk ranking, highest to lowest: C (reactive patching with no fixture corpus) > B (per-agent grammar, disproportionate engineering weight for a cosmetic-only failure mode) > A (in-system, genuinely lower risk than C only if paired with a real fixture/regression corpus commitment) -- noting block-classify.ts already secretly contains Claude-Code-specific special cases (menu cursor, Q&A pairs, arrow exclusion) inside a nominally-universal function, with undocumented blast radius on Codex/Agy panes (PBI-061, unresolved), and the repo's own prior-art log already scored collie's pattern as R3 E1 F3 (relevant but single-source, high build cost, no harness/ subsystem exists yet). Use absolute paths for anything you additionally read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts at the exact runDir path this dispatch gives you under that tree. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Recommend Proposal A (stay in-system, evolve web/src/block-classify.ts), conditioned on two changes to how A was pitched: source the fixture corpus from the repo's already-catalogued composer-testdata-ground-truth candidate (airemote, R2 E2 F2) rather than collie's conformance suite (R3 E1 F3), and name the Claude-specific rules inside the existing module instead of creating a harness/ subsystem. B is refuted on stronger grounds than the critic used: collie's own tier ladder classifies read-only lift whose mis-detect is cosmetic as Tier 1 and reserves the fixture-corpus/conformance/live-verify apparatus for Tier 2 interactive send, so B imports Tier-2 machinery for a Tier-1 capability. C is confirmed highest-risk by observation, not argument — the last three commits (0.1.18/0.1.19/0.1.20) are each one reactive Claude-specific patch. Live disagreement kept open, not smoothed: nobody's proposal measures the Codex/Agy blast radius, a mechanism for damage is proven (MENU_CURSOR_ITEM hardcodes Claude's U+276F while airemote records Codex's U+203A) but damage is unobserved because no Codex/Agy fixture has ever been captured; and the critic's cosmetic-only premise holds in aggregate but not uniformly, since a wrapped choice menu on a phone can reach mis-answer.",
  "recommendation": "A-with-conditions",
  "proposals": {
    "A": {
      "verdict": "recommended",
      "conditions": [
        "Corpus commitment sourced from composer-testdata-ground-truth (docs/distillery/porting-log.md:101), not collie's Tier-2 conformance suite",
        "Claude-specific rules named and separable inside web/src/block-classify.ts; no harness/ subsystem"
      ],
      "caveat": "Cannot be declared lower-risk than C until a Codex/Agy capture exists; the ranking currently rests on a mechanism, not a measurement."
    },
    "B": {
      "verdict": "rejected",
      "primary_reason": "collie's own capability-tier ladder puts read-only lift with cosmetic mis-detect at Tier 1 and gates the fixture-corpus/conformance/live-verify apparatus behind Tier 2 interactive send; B imports Tier-2 machinery for a Tier-1 capability (docs/distillery/porting-log.md:103, scored R3 E1 F3, F3 because tier+fence+conformance is one subsystem)",
      "supporting_precedent": "PBI-062 already declined the per-agent adapter and accepted a narrower safety guarantee in the data-loss domain (collie #34 itself): 'bỏ pre-flight composerReady (không có per-agent adapter)' (docs/backlog.md:7)",
      "partial_rescue": "B's diagnosis is correct and its cheap half is double-sourced: per-agent-launch-adapters (airemote, R2 E2 F2, porting-log.md:96) independently converged on per-agent adapters and names the exact discriminator (Codex U+203A vs Claude U+276F). Only the subsystem is single-sourced and expensive."
    },
    "C": {
      "verdict": "rejected",
      "reason": "Not hypothetical — it is the current operating mode. Commits 881fa33 (0.1.18), 15b1203 (0.1.19), c1bebce (0.1.20) are three consecutive reactive Claude-specific patches.",
      "ledger_correction": "'no fixture corpus' overstates it — web/test/block-classify.test.ts carries 25 tests including literal regression fixtures for those counter-examples. The deficiency is narrower: no captures from any agent other than Claude."
    }
  },
  "unresolved_disagreement": {
    "codex_agy_blast_radius": "Unmeasured by every proposal. Mechanism proven (MENU_CURSOR_ITEM = /^\\s*❯\\s*\\d{1,2}[.)]\\s/ at web/src/block-classify.ts:70 hardcodes Claude's cursor; a Codex menu using U+203A fails the cursor check, falls through the gutter check that varying-length descriptions defeat per the code's own comment at :162-164, and wraps). Damage unobserved: plans/260811-1426-terminal-dom-renderer-swap/plan.md:121 carries 'No Codex/Agy fixture exists — none were running when the corpus was captured' as an unresolved risk into execution.",
    "cosmetic_premise_crack": "Holds cleanly for tables/trees/diffs/box frames. Thinner for choice menus: a wrapped menu on a 390px viewport can place option text under the wrong number, reaching mis-answer — adjacent to, not identical to, collie #34. Blunted but not eliminated by pan-on-doubt default and PBI-062's downstream replySend guard. Critic's aggregate conclusion survives; the claim of uniformity does not.",
    "tension_inside_recommendation": "The corpus commitment may not be dischargeable as stated. The plan offers a synthesised clean set to avoid live work content in real captures, but composer-testdata-ground-truth — the pattern recommended as A's corpus source — carries 'gap không backfill giả'. Its synthetic fixtures prove default-deny on unseen shapes; synthesising a Codex fixture from a guess is the prohibited move. Closing the Codex/Agy gap likely requires actually running those agents and hand-reviewing the capture."
  },
  "ledger_corrections": [
    "The dispatch attributes the undocumented Codex/Agy blast radius to PBI-061. PBI-061 (docs/backlog.md:8) is the pane display-name item (collie sessionName/paneDisplayName scraping) and does not touch block-classify.ts. Its open question #4 is the same Claude-only-generalisation question in a different subsystem. The classifier's instance is tracked at plans/260811-1426-terminal-dom-renderer-swap/plan.md:121. Two unresolved instances of one pattern, not one item.",
    "'B is single-source (E1)' is accurate for collie's capability-tier subsystem only, not for per-agent adapters as a concept (airemote, E2).",
    "'C has no fixture corpus' overstates it; 25 regression tests exist. The real gap is non-Claude captures."
  ],
  "constraint_carried_untouched": "Operator locked 2026-08-11: wrap decision fully automatic, no UI control of any kind, errs toward pan when unsure (plan.md:63-64). All three proposals honour it. Phase-4 stop condition states the escape hatch is reopening with the operator, not adding a mechanism (plan.md:97-99).",
  "open_questions": [
    "Will anyone run and capture a Codex and an Agy pane? Every risk ranking here is unmeasured without it.",
    "Can a real capture clear hand-review for commit given live work content — and if not, does the no-fake-backfill rule leave any legitimate corpus route for Codex/Agy at all?",
    "Is a wrapped choice menu genuinely cosmetic on a 390px phone, or does it reach mis-answer?",
    "Does adding U+203A to MENU_CURSOR_ITEM regress anything on Claude panes? Cheap to test, untested.",
    "Which table-shaped output does the operator actually read most — needed to tune thresholds on representative rather than invented data (plan.md:125-126)."
  ],
  "evidence_read": [
    "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
    "/home/vantt/projects/herdr-gateway/web/test/block-classify.test.ts",
    "/home/vantt/projects/herdr-gateway/docs/backlog.md",
    "/home/vantt/projects/herdr-gateway/docs/distillery/porting-log.md",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/plan.md",
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md"
  ],
  "artifacts": {
    "report": "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_037/runs/01/agent-report.md"
  }
}
```

## Real agent-report.md (verbatim)

# Synthesis — terminal-detail classification architecture

**Assignment:** asgn_coordinator_driver_op_037 · role: synthesizer · 2026-09-07

## Recommendation

**Proposal A — stay in-system, evolve the universal classifier at
`/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`.**

Two conditions, both of which change what A means relative to how the system-shaper pitched it:

1. **Source the fixture corpus from `composer-testdata-ground-truth`, not from collie.** The
   constraint-advocate is right that A beats C only if paired with a real corpus commitment. That
   commitment already exists as a scored candidate in the repo's own prior-art log:
   `composer-testdata-ground-truth | airemote | R2 E2 F2` — "fixture màn hình thật +
   completeness assertion + 10 synthetic unseen-shape chứng minh default-deny; gap không backfill
   giả" (`docs/distillery/porting-log.md:101`). Cheaper to build (F2 vs F3) and better evidenced
   (E2 vs E1) than collie's Tier-2 conformance suite.
2. **Name the Claude-specific rules inside the existing module. Do not create `harness/`.** The
   seam B correctly diagnoses is real; the subsystem B prescribes is not the remedy.

## Why B fails — but not for the critic's stated reason

The critic's attack lands, and the ledger under-credits it. The strongest argument against B is not
"word-wrapping is cosmetic, collie's incident #34 was safety-relevant, therefore disproportionate."
It is that **collie's own tier ladder already classifies this work as Tier 1 and exempts it from the
apparatus B wants to import.**

From `docs/distillery/porting-log.md:103` (`harness-adapter-capability-tiers | collie | candidate |
R3 E1 F3`), collie's ladder verbatim:

- **Tier 0** — raw mirror, free.
- **Tier 1** — read-only lift, "mis-detect chỉ hỏng cosmetic."
- **Tier 2** — interactive; *this* is what requires "fixture corpus + choreography notes +
  conformance suite xanh + maintainer live-verify trước khi bật send."

Block classification is read-only lift where a mis-detect breaks cosmetics. It is Tier 1 by the
source pattern's own taxonomy. B proposes importing the Tier-2 machinery — capability fence,
conformance suite, tier ladder — for a Tier-1 capability. That is a misreading of the source, not
merely a proportionality error, and it is a firmer refutation than a risk-profile comparison,
because it does not depend on anyone's estimate of how bad wrapping is.

The `R3 E1 F3` score corroborates: F3 explicitly because "cả hệ thống tier+fence+conformance là 1
subsystem."

**Precision the ledger gets wrong, in B's favour:** "single-source (E1)" is accurate for collie's
*capability-tier subsystem*. It is not accurate for *per-agent adapters as a concept* —
`per-agent-launch-adapters | airemote | candidate | R2 E2 F2`
(`docs/distillery/porting-log.md:96`) is independent convergence on the same idea, and it names
exactly the discriminator this decision turns on: Codex `›` vs Claude `❯`. B is single-sourced on
the expensive part and double-sourced on the cheap part. Splitting B along that line is what makes
A tractable rather than a rejection of B's diagnosis.

## Why C fails

C is not a hypothesis about the future; it is the last three commits.

| Commit | What it added |
|---|---|
| `881fa33` | stop rules and choice menus wrapping under real Claude Code footers; 0.1.18 |
| `15b1203` | pan Claude's "Review your answers" Q&A summary; 0.1.19 |
| `c1bebce` | widen reply guard tail window past Claude Code's footer; 0.1.20 |

Three consecutive releases, each a reactive patch against one counter-example, each adding a
Claude-Code-specific rule to a nominally universal function. The constraint-advocate's ranking of C
as highest-risk is confirmed by observation, not argument.

One correction in C's favour: "reactive patching **with no fixture corpus**" overstates it.
`web/test/block-classify.test.ts` carries 25 tests, several of which are literal regression fixtures
for the counter-examples above ("Real Claude Code footer: two full-width rules bracket a draft the
input box already soft-wrapped"; "still rejects a single stray arrow under a bulleted line"). The
discipline exists. What is missing is not tests — it is **captures from any agent other than
Claude**. That is a different, and narrower, deficiency than the ledger states.

## The disagreement that does not resolve

**Nobody's proposal measures the Codex/Agy blast radius, and the corpus needed to measure it does
not exist and may not be committable.**

`plans/260811-1426-terminal-dom-renderer-swap/plan.md:121` carries this as a known risk into
execution, unresolved: *"No Codex/Agy fixture exists — none were running when the corpus was
captured."* Its open questions (`:126-128`) add: *"Can any fixture be committed? Real captures
contain live work content; the corpus needs either a synthesised clean set or a hand-reviewed one
before it enters the repo."*

So the state of evidence is:

- **A mechanism for Codex damage is proven.** `MENU_CURSOR_ITEM = /^\s*❯\s*\d{1,2}[.)]\s/`
  (`web/src/block-classify.ts:70`) hardcodes Claude's cursor glyph. airemote independently records
  Codex's as `›`. A Codex numbered choice menu therefore fails the cursor check, falls through to
  the gutter check that the same code comment says varying-length descriptions defeat
  (`:162-164`), and wraps.
- **Damage itself is unobserved.** No Codex fixture has ever been captured. Nobody has looked.

**This is the crack in the critic's "cosmetic-only" premise, and I am not smoothing it.** Cosmetic
holds cleanly for tables, trees, diffs, box frames. It is thinner for choice menus: a wrapped menu
on a 390px phone can put option text under the wrong number, and the operator answering the wrong
prompt is adjacent to — not identical to, but adjacent to — collie's #34. Two things blunt it
rather than eliminate it: `pan` is the default, so the failure requires the classifier to
*affirmatively* wrap a menu; and `replySend`'s type-then-verify guard (PBI-062) already sits
downstream of a misread. The critic's aggregate conclusion survives. The claim of uniformity does
not.

My recommendation does not close this. It makes it cheap to close — capture one Codex pane, one Agy
pane, add `›` to the cursor alternation, and the highest-value unknown is discharged for roughly the
cost of one of the three patches above. **A cannot be declared lower-risk than C until that capture
happens.** Until then the ranking C > B > A rests on a mechanism, not a measurement.

## Tension inside my own recommendation

The corpus commitment may not be dischargeable as stated. The plan offers "a synthesised clean set"
as the way around live work content in real captures. But `composer-testdata-ground-truth` — the
very pattern I am recommending as A's corpus source — carries the rule **"gap không backfill giả"**
(do not backfill gaps with fakes). Its synthetic fixtures exist to *prove default-deny on unseen
shapes*, not to substitute for captures of a known agent nobody has run. Under its own discipline,
synthesising a Codex fixture from a guess at what Codex draws is precisely the prohibited move.

So: the Codex/Agy gap likely requires actually running those agents and hand-reviewing the capture.
That is a real cost my recommendation carries and does not eliminate.

## Precedent the ledger omits, and it is the closest one available

The repo has already decided this exact question once, in the harder direction. PBI-062
(`docs/backlog.md:7`), porting `type-then-verify-then-submit-split` from collie:

> "Thu hẹp so bản gốc collie: bỏ pre-flight `composerReady` (**không có per-agent adapter**) — chỉ
> chặn 'Enter trả lời nhầm dialog', KHÔNG chặn 'text gõ nhầm vào 1 dialog full-screen khác' (rủi ro
> chấp nhận thấp hơn collie)."

The per-agent adapter was declined, and a *narrower safety guarantee accepted in exchange*, in the
domain where the failure mode is lost work — collie's #34 itself. Adopting per-agent adapters where
the failure mode is cosmetic, having refused them where it was data loss, would be inconsistent. The
burden of proof sits on B, and B has not discharged it.

## Ledger correction

The dispatch attributes the undocumented Codex/Agy blast radius to **PBI-061, unresolved**. PBI-061
(`docs/backlog.md:8`) is the *pane display-name* item — scraping an agent's self-assigned session
name, collie's `sessionName`/`paneDisplayName`. It does not touch `block-classify.ts`.

The underlying concern is real and the confusion is understandable: PBI-061's open question #4 is
*"chỉ áp Claude (giống collie) hay Codex/Agy cũng có convention tương tự — chưa biết"* — the same
Claude-only-generalisation question, in a different subsystem. The classifier's version of it is
tracked in `plans/260811-1426-terminal-dom-renderer-swap/plan.md:121`. Two unresolved instances of
one pattern, not one item. Worth fixing before the citation propagates.

## Constraint carried, not touched

Operator locked 2026-08-11: the wrap decision is **fully automatic, no UI control of any kind, errs
toward pan when unsure** (`plan.md:63-64`). All three proposals honour it. The plan's own Phase-4
stop condition states the escape hatch is *reopening the decision with the operator*, not adding a
mechanism (`plan.md:97-99`). Nothing here changes that.

## Open questions

1. Will anyone run a Codex and an Agy pane and capture them? Every risk ranking in this decision is
   unmeasured without it.
2. Can a real capture clear hand-review for commit, given live work content — and if not, does
   `composer-testdata-ground-truth`'s "no fake backfill" rule leave any legitimate corpus route for
   Codex/Agy at all?
3. Is a wrapped choice menu genuinely cosmetic on a 390px phone, or does it reach mis-answer? Decides
   whether the critic's cosmetic premise holds uniformly or only in aggregate.
4. Does adding `›` to `MENU_CURSOR_ITEM` regress anything on Claude panes? Cheap to test, untested.
5. Plan open question, still open: which table-shaped output does the operator actually read most —
   needed to tune thresholds on representative rather than invented data (`plan.md:125-126`).
