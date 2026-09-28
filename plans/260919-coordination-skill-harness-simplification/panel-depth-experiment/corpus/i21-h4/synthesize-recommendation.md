# synthesize-recommendation (real, asgn_i27_driver_op_012)

## Dispatched objective (verbatim)

Recommend ONE path for closing the H4 exposure class durably, keeping live disagreement visible rather than smoothing it into a footnote: kernel structural hardening in binding.mjs (system-shaper), a stricter operation-capability-resolves doctor check (alternative-shaper), or confirming the existing round-2 fix is already sufficient and no further work is needed (constraint-advocate's own risk ranking). Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs first (absolute path). Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Recommend path (c) with proof: the round-2 fix at binding.mjs:268 already closes the H4 exposure class as the person defined it (any future capability with no .prefer falls to unbound, fail-closed, for every capability, no author action required) -- confirmed against source by scout, both shapers, constraint advocate (op_009), critic (attacked, held) and synthesizer. Open no kernel-hardening unit for H4. The confirmation is conditional on the single unchecked observation every panelist named and none could take (grep denied): F1 -- whether any dispatch-time path in session-engine/assignment-runner/run.mjs re-resolves by capability NAME; if yes, the guard must move into resolve.mjs and this recommendation inverts. Lock (c) with the shaper's regression test (review + no prefer + xai.for:[review] stays unbound) if none exists; nobody checked the test suite. The confinementSensitive flag is moot: H4 was consumer-side (review already declared confinement.mode: required; no code read it), so the critic's Attack 1 dissolves the question. Kept visible, not smoothed: (1) values disagreement on whether to close the E4+E5 residual now (bare .prefer -> first CLI invocation, unconfined; mechanism real, zero live instances in this config, F3 test never run) -- shaper/critic say close structurally, alt shaper/op_011 say doctor-first; goes to the person. (2) Gap, not finding: critic's Attack 2 (trigger on operation mutation class, not capability confinement.mode) is on the ledger but un-attacked and rests on an unverified fact (where Mutation is derived); coordinator should route a new shaper position, I did not author it. (3) op_011 contradicts op_009 (same role): its ranking of kernel hardening as riskiest assumes persisted-write shape changes, refuted by binding.mjs header and op_009's own 'pure, no I/O' statement; op_011 worked blind with no grant and its A-ranking should carry no weight. Separate real findings not to lose or merge into H4: doctor check skips derived capabilities (registrations.mjs:2040, checked); required-diversity fails open (binding.mjs:128-131,145-148,202, checked); ship any doctor check at warn. Falsification tally: 1 of 7 criteria checked; the checked one is the one the recommendation rests on. Read binding.mjs from the unit/I27 worktree copy because the main-checkout path was permission-denied for every panelist; main drift unverified.",
  "evidenceRefs": [
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_012/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/src/verbs/coordination/binding.mjs:268",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/src/verbs/coordination/binding.mjs:27-31",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/src/verbs/coordination/binding.mjs:311",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_005/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_006/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_007/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_008/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_009/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_010/runs/01/agent-report.md",
    ".claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_011/runs/01/agent-report.md"
  ]
}
```

## Real agent-report.md (verbatim)

# Synthesis — closing the H4 exposure class (synthesizer, asgn_i27_driver_op_012)

## Evidence base and its limits

- Ledger read in full: op_005 (lead interpretation), op_006 (scout), op_007 (system shaper), op_008 (alternative shaper), op_009 (constraint advocate, first pass), op_010 (critic), op_011 (constraint advocate, final ranking). All at run 01, the revision each was written against.
- `binding.mjs`: read from this worktree (`unit/I27`), 334 lines. The main-checkout path was permission-denied, as it was for op_005, op_009 and op_010. Line 268 matches every citation in the ledger. Main-vs-`unit/I27` drift remains unverified by anyone.
- Packet says Granted Context `(none)`; the driver's declared step granted op_005 through op_011. I used the driver's grant, same as the critic did, and record the mismatch. op_011 did NOT do this and worked blind — see "Panel conduct" below, because it changes how much weight that report carries.
- I added no new evidence. Bash/grep was denied for me as for every panelist. Nothing in this packet was verified by execution.

## Recommendation: ONE path

**Path (c), with proof: confirm the round-2 fix (`binding.mjs:268`) already closes the H4 exposure class as the person defined it, and open no kernel-hardening unit for H4. Make that confirmation conditional on the single observation nobody has taken — F1 — and lock it with a regression test if one does not already exist.**

Not (a) kernel hardening for H4. Not (b) a doctor check as the closure. Both address things that are real but are not H4.

### Why (c) wins on facts, per claim

| Claim | Confidence | Who checked it against source |
|---|---|---|
| Line 268 refuses `capability.for` and `executor-id` for EVERY capability, not just `review`; a future capability with no `.prefer` falls to unbound → `minTier`/`readOnlyRedirects`, fail-closed, sensitivity-blind | **High.** Read directly by scout, system shaper (E3), constraint advocate (op_009 §"Correcting a premise"), critic (attacked, held), and by me | 4 panelists + synthesizer |
| H4 was a consumer-side failure (a declaration existed, `review.confinement.mode: required` at config.json:59-69, and no code read it), not an author-judgment failure | **High.** Config read by shaper (E7/E8), alt shaper (evidence 1), critic (Attack 1) | 3 panelists |
| Therefore a `confinementSensitive` flag would not have prevented H4 and adds no coverage for branch 3 | **High.** Follows from the two rows above; shaper dropped the flag independently; critic reached the same verdict | shaper + critic, independently |
| The person's own three-part question resolves as: sufficient — yes; durable for the no-`.prefer` shape — yes; structural — partly (the gate keys on provenance `bindingSource`, not on the confinement the invocation actually has) | **High** on the first two, **moderate** on the third — "structural" is partly a definitional call | lead (op_005 inference 2 + 4), confirmed by shaper E4/E5 |

That last row is the whole answer to the person: the class they asked about — "any FUTURE capability that also declares no `.prefer`" — cannot reach an unconfined executor through `bindOperations` today, by construction, with no author action required. That is exactly the "silence is safe by construction" property. It already exists at line 268.

### The one observation that could flip this: F1

Both shapers and the critic name it; nobody checked it; the critic calls it "the load-bearing unknown for every option." `binding.mjs:18` says a real dispatch "re-resolves at execution time." If `session-engine.mjs`, `assignment-runner.mjs` or `run.mjs` passes an operation's **capability name** (not the bound `preferExecutor`) to `resolveExecutorAndOverrides`/`resolveExecutorConfig` at dispatch time, then branch 3 is reachable again outside the binder, line 268 is not the gate, and the recommendation inverts: the guard must move into `resolve.mjs` as a caller opt-in (system shaper's own fallback position) and neither (b) nor (c) is enough.

Estimated by the alt shaper at about 30 minutes of reading. Zero panelists could do it because grep was denied to all of them. **This is the coordinator's first routing decision: grant one investigator Bash on those three files.** Until F1 is checked, "(c) confirmed" is a high-probability claim, not a proven one.

### What (c) still owes: the lock test

Lead inference 3: if the person wants the fix ratified, the deliverable is "here is the test that locks it." Ambiguity D (does a mutation-sensitive test already lock the `bindingSource === 'capability.prefer'` boundary?) was handed to the scout and **not answered** — the scout checked the fix and the config, not the test suite. The system shaper's test #1 (`review` with no `prefer` plus `xai.for:["review"]` must stay unbound) is that test. If it exists, (c) is complete after F1. If not, it is the only code change H4 itself needs. Confidence that it exists: **unknown** — nobody looked.

## Live disagreement kept visible (not smoothed)

### 1. Whether "durable" should include the E4+E5 residual — values, not facts

**The fact** (high confidence, mechanism read by shaper and critic in `resolve.mjs:391-393` + `binding.mjs:311`): a bare-string `.prefer` emits no `preferInvocation`; dispatch takes the executor's first `via: "cli"` invocation, which for `xai` and `claude` is unconfined/acceptEdits. **No live instance in this repo's config** (shaper E9: all three confinement-required capabilities with `.prefer` name a confined invocation explicitly). Other projects' configs: unknown (shaper F4, near-unfalsifiable from here). F3 — the one pure unit test that would prove or kill the residual — was **stated by the shaper, endorsed by the critic as "run it before anything else," and run by nobody.**

**The disagreement:** system shaper and critic say close it now, structurally, because it is reached by author omission. Alt shaper and op_011 say do not touch the dispatch path until there is evidence of a live instance; make it visible via doctor first. This is speed/reversibility versus defense-in-depth on a residual with zero observed instances. **It does not resolve with more evidence from this ledger. It goes to the person as a values choice.** My framing of the trade: the residual has a different shape from H4 (it requires a `.prefer` to exist), so it is a separate exposure class with its own decision, not an argument that H4 is open.

### 2. Which trigger a confinement predicate should key on — a gap, not a finding

If the person chooses to close E4+E5, the ledger holds two positions:
- **System shaper:** trigger on `capabilities.<name>.confinement.mode === 'required'`. Attacked by the critic: still opt-in on the capability side; `code:test` (bare `prefer: "claude"`, no confinement block) is a concrete omission residual if a future read-only operation ever declares it.
- **Critic (Attack 2):** trigger on the operation's effective mutation class (`read-only`, which every panel operation already derives) OR the capability's `confinement.mode`. This position is **on the ledger but un-attacked** — no shaper wrote it, no critic attacked it, and it rests on an unverified fact: where `Mutation: read-only` is derived and whether `bindOperations` can see it as pure input before dispatch.

I am not authoring a resolution. **Coordinator: if E4+E5 goes forward, this needs a new shaper position on the critic's variant plus one fact-finding (where the mutation class is derived).** Recommending the critic's variant now would be the "merged fourth architecture nobody attacked."

### 3. The panel's second constraint pass (op_011) contradicts its first (op_009)

Same role, opposite rankings. op_009 (source read) ranked **scoped kernel hardening least risky** and said outright "the binding itself is pure (no I/O, no persisted state)." op_011 (no source, no context — "I did not open any path") ranked **kernel hardening riskiest** on the ground that it might change persisted JSONL record shape. That worry is refuted by the module's own header (`binding.mjs:27-31`: "No filesystem I/O, no mutation") and by op_009's own words. **op_011's ranking of option A should carry no weight; its ranking of B and C rests on option names alone.** Its one durable point — register any doctor check at warn severity first — is sound and I carry it below.

## Separate findings the panel surfaced — do not lose, do not merge into H4

Each is real, each is checked against source, none is H4 closure:

1. **Doctor blind to derived capabilities** (alt shaper evidence 4, `registrations.mjs:2040-2041`, read): `operation-capability-resolves` skips every operation without a declared `policy.capability`, so the one protocol where H4 happened is invisible to the check meant to cover it. Post-fix consequence is silent degradation, not exposure: 100% of panel actors run unbound, so `distinctProviderFrom` between red-team and synthesizer is inert (alt shaper, `binding.mjs:200-202, 300-301`). Nobody opposed adding this check. Falsification the alt shaper owes: F4 (does the schema allow an `unbound: true` acknowledgment field). Ship at **warn** (op_011). This is a visibility item and a diversity-product item, not confinement.
2. **`required` provider diversity fails open** (op_009, `binding.mjs:128-131, 145-148, 202`): unknown family or forward reference is treated as diverse and the frozen record claims `satisfied: true`. Critic agreed it is real and separate. Latent today (no shipped protocol declares `required`); the first adopter is the deadline because the false claim would land in append-only evidence. Owner after I21: unknown to everyone.
3. **`pane-labeling`** (scout §2): the only other `.prefer`-less capability; no protocol operation reaches it (unverified by grep). Not an exposure.

## Falsification criteria: checked vs merely stated

| Criterion | Stated by | Checked? |
|---|---|---|
| F1 — dispatch-time re-resolution by capability name | shaper, alt shaper, critic | **No.** Grep denied to all. Load-bearing for every option. |
| Shaper F3 — bare `prefer` on required-confinement capability lands unconfined | shaper | **No.** One pure unit test; nobody ran it. |
| Shaper F2 — Confinement Authority already refuses empty confinement for required capabilities | shaper | **No.** `confinement/authority.mjs` unread by everyone. |
| Shaper F4 — a consuming project deliberately names an unconfined `.prefer` | shaper | **Unfalsifiable from here** (critic). Opinion-grade. |
| Alt shaper F4 — schema rejects an `unbound` field | alt shaper | **No.** |
| Lead ambiguity D — a test already locks line 268 | lead | **No.** Scout did not look at the test suite. |
| Line 268 closes branch 3 for every capability | all | **Yes**, by source read, five times over. |

One of seven checked. The one that was checked is the one the recommendation rests on. The one that could overturn it (F1) is the cheapest unchecked item.

## Panel conduct note for the red-team

I weighed the critic's Attack 1 and found it correct and decision-relevant: it dissolves the `confinementSensitive` question entirely rather than answering it. I did **not** adopt the critic's Attack 2 as the recommendation, because it is an un-attacked position resting on an unverified fact. I did **not** adopt op_011's "B first" because its reasoning about A is contradicted by the ledger. The constraint advocate's real contribution is op_009, not op_011.

## Unresolved questions

- F1: does any dispatch-time path pass a capability name to `resolveExecutorAndOverrides`? (Flips the whole recommendation if yes.)
- Does a regression test already pin `bindingSource !== 'capability.prefer'` → unbound? (Decides whether (c) needs any code change.)
- Where is the effective-execution-contract `Mutation` class derived, and can the binder see it? (Prerequisite for any decision on E4+E5.)
- Does main's `binding.mjs` differ from `unit/I27`'s at line 268? (Nobody could read main.)
- Who owns `binding.mjs` after I21 closes? (Needed for the diversity fail-open, not for H4.)
