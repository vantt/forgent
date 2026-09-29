# interpret-request (real, asgn_coordinator_driver_op_030)

## Dispatched objective (verbatim)

Interpret the person's intent: whether to keep the universal visual-heuristic classifier or move toward a per-agent grammar system, and on what timeline. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Intent read as a maintenance-velocity complaint, not an architecture-purity question: three consecutive releases (0.1.18/0.1.19/0.1.20) were all Claude Code-specific fixes, and asking 'on what timeline' signals they expect grammar to be coming, not urgent. Key finding — the premise is already half-false: 3 of 6 signals in web/src/block-classify.ts are agent-specific and two name Claude in their own comments, so the grammar already arrived undeclared inside a module that claims to be universal. The binary is also false: AgentRow.kind is an open string, ShellRow has no kind at all, so any grammar registry must fall through to the universal classifier — grammar can only sit in front of it, never replace it. Recommendation: gate the three agent-specific signals behind the pane's kind (already plumbed client-side, hours of work, fail-closed contract and rollback untouched), keep gutters/box-ratio/pipes as the universal core, and do NOT build a grammar subsystem yet — no Codex/Agy fixture exists, so it would be a framework for a population of one. Timeline should be a trigger, not a date: revisit when the first Codex/Agy-specific signal appears (not the fourth Claude one) or when a third file needs its own 'where is Claude's footer' heuristic. Real blocker either way is PBI-060's still-open 'can any fixture be committed?' — without a multi-agent corpus both options are tuned blind.",
  "role": "lead-advisor",
  "recommendation": "keep-and-scope",
  "confidence": "medium",
  "evidence_basis": "indirect",
  "evidence_caveat": "Raw submission text was never read. Context refs were empty and /home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_030/ was outside this session's read permission, so task-spec/assignment JSON could not be opened. The intent reading is inferred from the person's recorded decisions and revealed behaviour in the herdr-gateway repo, not from their words.",
  "files_read": [
    "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
    "/home/vantt/projects/herdr-gateway/web/src/api.ts",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/plan.md",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md",
    "/home/vantt/projects/herdr-gateway/docs/backlog.md",
    "/home/vantt/projects/herdr-gateway/docs/specs/reading-map.md"
  ],
  "key_findings": [
    "Classifier is not universal today: isFramingRule, the menu-cursor rule and countSummaryPairs are Claude Code-specific; only stable gutters, box-drawing ratio and aligned pipes are shape-universal.",
    "Commit c1bebce (0.1.20) is not in the classifier at all — it is the reply guard in web/src/views/terminal.ts. Two files now carry independent heuristics for 'where is Claude Code's footer'. This is the first genuinely structural symptom, distinct from signal accumulation.",
    "Per-agent grammar cannot replace the universal classifier: AgentRow.kind is `string` not a closed enum, agent_presets is arbitrary user config (PBI-053), and ShellRow has no kind field. A default fallback branch is mandatory and that branch is the universal classifier.",
    "The three Claude-specific signals currently run against every pane including shells and Codex. Harmless today because pan is fail-closed, but it is why the module reads as incoherent.",
    "plan.md carried risk #5 ('No Codex/Agy fixture exists') is still true, so a grammar framework would ship with exactly one agent implemented and no way to validate the second.",
    "Phase-04's stop condition ('reopen the decision with them') has not strictly fired — every fix landed cleanly and pan-default meant no user-visible damage between releases. The cost is release churn, not broken UX; that should govern urgency."
  ],
  "recommended_actions": [
    "Now: gate the three agent-specific signals behind the pane's kind, keeping gutters/box-ratio/pipes as universal core and shell/unknown fallback. Small, reversible, fail-closed contract and 'force verdict to pan' rollback both preserved.",
    "Regardless of direction: close PBI-060's open question 'can any fixture be committed?' and commit a multi-agent corpus. Both options are being tuned blind without it.",
    "Do not build a grammar subsystem yet.",
    "Set the revisit trigger as: first Codex/Agy-specific signal, or a third file needing its own Claude-footer heuristic."
  ],
  "open_questions": [
    "For the person, and it changes the recommendation: is the pain 'I keep shipping releases for this' (kind-gate now, defer grammar) or 'the wrap decision and the reply guard disagree about where Claude's UI is' (shared Claude-Code region model justified sooner)? Commit c1bebce hints at the second.",
    "Raw submission text was never read; if the person stated a timeline preference or trigger in their own words, this reading has not accounted for it.",
    "Phase-04's dropped pty soft-wrap signal was left as a candidate refinement 'if the structure detector proves insufficient in use'. It has now proven insufficient three times and nobody has re-priced it against the grammar option — possibly a cheaper third path.",
    "Not verified whether kind is readable at the terminal-detail call site or only on the switcher row (grep unavailable in this session). Assumed available since detail is navigated to from an AgentRow; confirm before committing to the gating fix."
  ]
}
```

## Real agent-report.md (verbatim)

# Lead advisor — keep universal classifier vs. move to per-agent grammar

Assignment `asgn_coordinator_driver_op_030`, run 01. Role: lead-advisor.

## Evidence basis (read this first)

**No raw submission text was reachable.** Context refs were empty, and
`/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_030/`
is outside this session's read permission — task-spec/assignment JSON could not be
opened. So the intent reading below is **inferred from the person's own recorded
decisions and revealed behaviour in `/home/vantt/projects/herdr-gateway`**, not from
their words. Treat confidence accordingly; one question at the end must go back to them.

Read (all absolute paths):

- `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts` — the classifier itself
- `/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/plan.md`
- `/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md`
- `/home/vantt/projects/herdr-gateway/docs/backlog.md` (PBI-060, PBI-061, PBI-062, PBI-053)
- `/home/vantt/projects/herdr-gateway/docs/specs/reading-map.md`
- `/home/vantt/projects/herdr-gateway/web/src/api.ts`
- git log (last 3 commits, from session context)

## The premise is already half-false — say this to them first

The question assumes today's classifier is universal. It is not, and hasn't been for
three releases. `block-classify.ts` has six signals:

| # | Signal | Universal? |
|---|---|---|
| 1 | ≥2 stable column gutters over ≥4 lines | yes — carries the measured 6-9x separation |
| 2 | full-line box-drawing rule ≥8 chars (`isFramingRule`) | added for Claude Code's input box |
| 3 | ≥30% box-drawing lines | yes |
| 4 | aligned markdown pipes | yes |
| 5 | `❯ N.` cursor + ≥2 numbered siblings | comment says "Claude Code's own menu" |
| 6 | `● q` / `→ a` pairs ×2 (`countSummaryPairs`) | comment says "Claude's own 'Review your answers'" |

Half the signals are agent-specific, and two name Claude in their own doc comments.
The last three tagged commits are all the same shape of fix:

- `881fa33` (0.1.18) — rules + choice menus wrapping under real Claude Code footers
- `15b1203` (0.1.19) — pan Claude's "Review your answers" summary
- `c1bebce` (0.1.20) — widen reply guard tail window past Claude Code's footer

So the grammar already arrived; it arrived undeclared, inside a module that claims to be
universal. The real question is not "should we adopt per-agent grammar" but
**"should we admit the one we already have."**

## Reading of intent

They are not asking an architecture-purity question. Three consecutive releases burned on
one agent's UI chrome is a **maintenance-velocity** complaint. "On what timeline" signals
they think grammar is *coming*, not *urgent* — they want a trigger condition, not a date.

One sharper signal: `c1bebce` is **not in the classifier**. It's the reply guard in
`web/src/views/terminal.ts` (PBI-062's `screenTailContainsSent`). Two different files now
carry independent heuristics for "where is Claude Code's footer." That is the first real
structural symptom, distinct from mere signal accumulation.

## It is not either/or — the binary is false

A per-agent grammar **cannot replace** the universal classifier, for reasons already in the repo:

1. `AgentRow.kind` is `string`, not a closed enum (`web/src/api.ts:11`). `agent_presets` is
   arbitrary user config — PBI-053's note is explicit that Shell/Claude/Codex/Agy is only a
   fresh-install default, "UI dropdown cần list động theo config thật, không hardcode 4 lựa chọn".
2. `ShellRow` carries no `kind` at all (`web/src/api.ts:26-34`). Shells get no agent identity, ever.
3. So any grammar registry must fall through to a default branch — which *is* the universal
   classifier. Grammar can only sit in front of it.
4. Signals 1/3/4 carry the measured separation on real captures (7-11% Claude vs 66% shell,
   per phase-04's probe table). A "Claude grammar" would have to rebuild them internally.

## The actual defect, and the cheap fix

The three Claude-specific signals currently run against **every** pane — shells, Codex, Agy
included. A `❯ 1.` in shell output, or a `● / →` pair in a Codex transcript, gets Claude's
verdict today. Fail-closed default (pan) means this is currently harmless — prose-panned is
"exactly today's behaviour, an invisible non-event" per the locked design — but it is why the
module reads as incoherent.

**Recommendation (now, small, reversible):** gate signals 2/5/6 behind the pane's `kind`,
keep 1/3/4 as the universal core and the fallback for shells and unknown kinds. `kind` is
already plumbed client-side at zero cost. This buys per-agent grammar's *only* real benefit —
scoping — at almost none of its cost. No new module boundary, no subsystem, fail-closed
contract untouched, rollback still "force the verdict to pan" (phase-04 rollback note).

## What a real grammar would additionally buy — and why it isn't earned yet

**For:** one shared model of Claude Code's TUI regions (footer / input box / menu / summary)
that both the wrap decision and the reply guard consume, instead of two files sniffing lines
independently. This is the genuine argument and it is worth putting to them.

**Against, three ways:**

- **A framework for a population of one.** `plan.md`'s carried risk #5 — "No Codex/Agy fixture
  exists — none were running when the corpus was captured" — is still true. A per-agent
  framework would ship with exactly one agent implemented and no way to check the second.
- **Version coupling to an upstream they don't control.** PBI-061 already records this exact
  hazard: "verify lại regex trên fixture Claude Code thật của host, không chép mù (version có
  thể vẽ khác)". A grammar makes the app structurally sensitive to Claude Code's chrome, which
  ships often. Line-sniffing degrades to pan on a miss; a grammar that mis-parses a region can
  be confidently wrong.
- **The stop condition has not actually fired.** Phase-04 says an untrustworthy miss rate means
  "reopening the decision with them, not shipping a mechanism they cannot trust." Three fixes
  in three releases looks like that moment — but each landed cleanly and pan-default meant no
  user-visible damage in between. The cost is release churn, not broken UX. That distinction
  should govern urgency.

## Timeline: give them a trigger, not a date

- **Now:** `kind`-gate the three agent-specific signals. Hours, not days.
- **Prerequisite before either path can be tuned:** PBI-060's open question "Can any fixture be
  committed?" is still unanswered. Without a committed Codex/Agy corpus **both** options are
  being tuned blind. This is the real blocker on the timeline and it is cheap to clear — do it
  regardless of which way they lean.
- **Revisit trigger, not a calendar date — whichever fires first:**
  1. the first *Codex or Agy* specific signal (not the fourth Claude one). Two agents' quirks
     in one function is a design failure, because that's where signals start *conflicting*
     rather than merely accumulating;
  2. a third file needing its own "where is Claude's footer" heuristic. Two is a coincidence,
     three is a missing shared model.

## Bottom line

Keep the classifier. Stop pretending it's universal. Gate the agent-specific half behind
`kind` now, commit a multi-agent fixture corpus, and let a Codex/Agy-specific signal — not a
Claude one — be the thing that authorises building a grammar subsystem.

## Unresolved questions

1. **For the person, and the one that changes the recommendation:** is the pain "I keep
   shipping releases for this" (→ `kind`-gate now, defer grammar) or "the wrap decision and the
   reply guard disagree about where Claude's UI is" (→ shared Claude-Code region model is
   justified sooner)? `c1bebce` hints at the second.
2. Raw submission text was never read (permissions). If the person stated a timeline
   preference or a specific trigger in their own words, this reading has not accounted for it.
3. Phase-04's dropped pty soft-wrap signal was left as "a candidate refinement if the structure
   detector proves insufficient in use." It has now proven insufficient three times. Nobody has
   re-priced it against the grammar option — it may be a cheaper third path.
4. Can `kind` actually be read at the terminal-detail call site, or only on the switcher row?
   Not verified — `grep` was unavailable in this session. Assumed available since detail is
   navigated to from an `AgentRow`; confirm before committing to the gating fix.
