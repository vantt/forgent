# Explanation packet — should you invest further in closing I21's H4 exposure class? (lead-advisor, [REDACTED])

## What this means for you

If you accept the panel's recommendation, you open no new kernel-hardening unit for H4. You spend roughly half an hour of one investigator's time on one unchecked fact, confirm a regression test exists or write one, and you are done with H4. Every future capability someone declares without a `.prefer` already lands unbound and fail-closed, with no action by its author. That is the "silence is safe by construction" property you asked for, and the panel found it already exists at `binding.mjs:268`.

But you should know two things before you defend this to the colleagues who own that file. First, the recommendation rests on one fact nobody on the panel was allowed to check. Second, the [REDACTED] did not evaluate this recommendation at all, because its dispatch handed it nothing to evaluate. The panel's answer is a strong, source-read claim. It is not yet a verified one, and it is not yet a [REDACTED]ed one.

## The recommendation, plainly

The synthesizer picked one path out of three: **confirm the round-2 fix is sufficient, lock it with a test, and do no further H4 work.** Not kernel hardening. Not a doctor check as the closure.

The reasoning is short. The fix at line 268 refuses every resolution except `bindingSource === 'capability.prefer'`, for every capability, not just `review`. Five separate readers of the source agree on that. H4 itself was a consumer-side failure: a confinement declaration existed in config and no code read it. So a `confinementSensitive` flag, the idea the system-shaper originally floated, would not have prevented H4. The shaper dropped the flag on their own, and the critic independently reached the same conclusion. Your three-part question resolves as sufficient: yes. Durable for the no-`.prefer` shape: yes. Structural: partly, because the gate keys on where a binding came from, not on what confinement the invocation actually has.

## What stands between "high-probability" and "proven"

Two items. Both are cheap. Neither was done.

1. **F1, the fact that could flip everything.** The module header says a real dispatch "re-resolves at execution time." If any dispatch-time code in the session engine, assignment runner, or run path passes an operation's capability name, rather than the already-bound executor, back into executor resolution, then line 268 is not the gate and the whole recommendation inverts toward moving the guard into `resolve.mjs`. Both shapers and the critic named this. The critic called it the load-bearing unknown for every option. No panelist could check it because every panelist was denied grep. The alternative-shaper estimated it at about thirty minutes of reading.

2. **The lock test.** Nobody looked at whether a test already pins "no `capability.prefer` binding means unbound." The scout was asked and did not look at the test suite. If it exists, H4 is complete after F1. If not, writing it is the only code change H4 needs.

Until F1 is checked, treat "confirmed sufficient" as a high-probability claim. Do not present it to your colleagues as proven.

## The disagreement that is still live, and is yours to settle

The panel did not converge on one point, and the synthesizer was explicit that more evidence from this ledger will not settle it.

**A separate residual exists.** A capability that declares a bare-string `.prefer` emits no invocation preference, so dispatch takes the executor's first CLI invocation, which for `[REDACTED]` and `claude` is unconfined. No live instance exists in this repo's config. Other projects' configs are unknown and near-unfalsifiable from here. The one unit test that would prove or kill this residual was stated by the shaper, endorsed by the critic as "run it before anything else," and run by nobody.

- **System-shaper and critic:** close it now, structurally, because an author omission reaches it.
- **Alternative-shaper and the constraint-advocate's final pass:** do not touch the dispatch path until there is evidence of a live instance. Surface it through doctor first.

This is speed and reversibility against defense-in-depth on a residual with zero observed instances. The synthesizer's framing, which I find fair: this residual has a different shape from H4, since it requires a `.prefer` to exist. It is a second exposure class with its own decision. It is not an argument that H4 remains open.

**If you choose to close that residual**, note that the ledger holds two different triggers for the predicate, and the second was never attacked. The shaper's trigger keys on the capability's own `confinement.mode`. The critic proposed keying on the operation's effective mutation class instead, which would also cover capabilities like `code:test` that have no confinement block. The critic's variant rests on an unverified fact about where the mutation class is derived and whether the binder can see it. The synthesizer refused to recommend it for exactly that reason. Adopting it now would be adopting an architecture nobody tested.

## The [REDACTED]'s verdict, relayed without softening

**Protocol verdict: INSUFFICIENT-EVIDENCE. Not APPROVE. Not REVISE.**

The [REDACTED] did not evaluate the synthesis. It could not. Its assignment recorded an empty context grant, even though the driver's declared step named the synthesis as the granted reference. Under the [REDACTED]'s own evidence contract, it does not hunt for files it was not granted, so it opened only its own assignment record, its own execution contract, and `binding.mjs`. It explicitly did not open the synthesis, the critique, the constraint-advocate findings, or any shaper proposal.

Three attacks landed, all on the dispatch rather than the architecture:

- It was asked to audit a packet it was never given.
- The objective text asserted what the critic said and what the constraint-advocate ranked, with none of those artifacts in the grant. The [REDACTED] correctly refused to treat driver narration as the critic's record.
- It was pointed at source as if source could answer whether the synthesis stayed honest. Source cannot.

Every honesty question you care about came back **not proven, and also not shown false**: whether the synthesis seriously weighed the critic's attack, whether a cheaper unproposed option existed, whether isolation held, whether any disposition outran evidence. The [REDACTED] was explicit that collapsing this into REVISE would claim a panel failure it did not observe, and collapsing it into APPROVE would be ceremonial.

One more thing the [REDACTED] recorded. Its own execution contract shows it ran on the `[REDACTED]` executor via plain CLI spawn, while the declared roster named `[REDACTED]` via a sandboxed Codex invocation. The [REDACTED] did not upgrade this into a diversity violation, because it lacked the session ledger. I relay it because it is the same class of drift H4 was about: what was declared for an actor and what actually ran were not the same thing. Someone with the session replay should check it.

**What this means for the recommendation.** The synthesizer's own report answers the [REDACTED]'s first two questions on its face: it names the critic's attack, says it found the attack correct, and says it did not adopt the critic's second position because that position was un-attacked. But that is the synthesizer describing its own conduct. No independent role has confirmed it. If [REDACTED] of this decision matters to you, it has not happened yet. A second [REDACTED] dispatch with the synthesis, critique, constraint findings, and shaper proposals actually in the grant would be the way to get it.

## Findings the panel surfaced that are not H4, and should not be lost

1. **Doctor cannot see derived capabilities.** The `operation-capability-resolves` check skips any operation without a declared capability, so the one protocol where H4 happened is invisible to the check meant to cover it. After the fix, the consequence is silent degradation rather than exposure: all eight advisory actors run unbound, which makes the [REDACTED]-versus-synthesizer provider-diversity guard inert. Nobody opposed adding this check. Ship at warn severity first.
2. **Required provider diversity fails open.** An unknown family or forward reference counts as diverse, and the frozen record then claims the requirement was satisfied. Latent today, since no shipped protocol declares `required`. The first adopter is the deadline, because the false claim would land in append-only evidence.
3. **`pane-labeling`** is the only other `.prefer`-less capability and no protocol operation appears to reach it. Not an exposure. Unverified by grep.

## Where the panel's own conduct was weak

- The constraint-advocate's second pass contradicts its first. The first pass read source and ranked scoped kernel hardening least risky, noting the binder does no I/O. The second pass read nothing and ranked kernel hardening riskiest on a persisted-record worry the module header refutes. The synthesizer gave the second pass's ranking no weight, and I agree with that call. Its one durable contribution, warn severity for any new doctor check, was kept.
- Every panelist read `binding.mjs` from the `unit/I27` worktree. Nobody could read main. Drift between the two remains unverified.
- Nothing in the entire packet was verified by execution. Every claim is a source read. One of seven stated falsification criteria was checked, and it was the one the recommendation rests on.

## The decision that is yours

The panel can tell you that H4, as you defined it, is closed by construction at line 268 pending one fact check. It cannot tell you whether the bare-`.prefer` residual is worth closing now, with zero observed instances, at the cost of touching the dispatch path, or whether visibility through doctor is enough until an instance appears. That is a judgment about how much unobserved risk you carry versus how much you value keeping the dispatch path untouched. Two competent panelists landed on each side with the same facts in front of them. When your colleagues ask why you did or did not open that unit, the answer has to be yours.

## What I did not do

I added no new evidence. I did not check F1, did not look for the lock test, and did not open `resolve.mjs` or the test suite, because the role here is to explain the synthesizer's recommendation, not to replace it. This packet recorded a context grant of none. I read the synthesizer's report, the [REDACTED]'s report, and the driver's declared step through this worktree's own tree after the main-checkout paths were denied, the same limitation every earlier panelist recorded.

## Unresolved questions

- F1: does any dispatch-time path pass a capability name to executor resolution? Flips the recommendation if yes.
- Does a regression test already pin "not `capability.prefer`" to unbound?
- Where is the effective mutation class derived, and can the binder see it? Prerequisite for the residual decision.
- Does main's `binding.mjs` differ from `unit/I27`'s at line 268?
- Why did the [REDACTED]'s assignment carry an empty grant when the declared step named the synthesis? Why did it run on `[REDACTED]` when the roster declared `[REDACTED]`?
- Who owns `binding.mjs` after I21 closes? Needed for the diversity fail-open, not for H4.
