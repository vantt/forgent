# Decision Packet — vnflow (synthesizer)

## Recommendation

**Keep the two pipelines and the existing `AssetRunner`. Do not build a pluggable pipeline abstraction. Close named seams in this order: (1) make the intraday breadth-gate policy explicit at the boundary, (2) port EOD's schema tolerance into intraday's loaders, (3) make intraday's read of EOD's persisted output a checked input at read time.**

That is CASE option A executed narrowly, with the System Shaper's option-C reasoning as its justification. It is one recommendation, not a merge of three: every item below was proposed by a named advisor in the text given to me, and I have added nothing.

The panel converged on the negative half of this — no new abstraction — but it did **not** converge for one reason, and the distinction matters when you weigh it:

- The **System Shaper** reaches it diagnostically: A and B both assume the difficulty sits at the execution-graph level, and the scout falsifies that premise — a shared engine and shared domain functions already exist. There is no boundary left to draw there.
- The **Constraint Advocate** reaches it by blast radius: EOD's dead-man-switch / 5-session catchup means one shared-engine change can touch 6 sessions in a single invocation, so `AssetRunner`, EOD scheduling, and persisted formats should stay unchanged and compatibility should be injected at consumer edges only.
- The **Alternative Shaper** reaches it by priors: at ~1 month of repo history, boundaries are still settling, so explicit data dependencies and operational safety outrank code-level DRYness.

I record those as three distinct routes to the same place. I am **not** using that to dismiss Attack 3, which is live and appears below.

## Step zero, and it holds regardless of anything else unresolved here

**The breadth-gate omission.** Commit `235d05d` added a breadth gate to EOD; intraday never wired the new input; the shared gate silently defaults to bypass. The Constraint Advocate ranks this HIGH and irreversible-once-fired: a wrong decision here can reach an external Telegram notification, and `AssetRunner`'s `_materialize` calls `spec.fn(ctx)` **before** `_run_checks(...)`, so a post-execution check cannot intercept a notification that has already been sent.

**The critic attacked exactly this claim and the attack failed** — the critic conceded, against `asset_runner.py`, that the ordering is as the Constraint Advocate stated. This is the only finding in the session that was directly assaulted and survived. The System Shaper independently names the same seam (item 2). Nobody argued against fixing it.

The Constraint Advocate's shape for the fix is the right one *because it does not require you to know the answer yet*: make the policy explicit at the boundary as either **required-with-source** or **deliberately-exempt-with-reason**. Either branch removes the silent default. Which branch is correct is a fact only you hold (see the last section).

## What is demoted, and by what evidence

**The shared alert-cap coupling drops to lowest priority.** The Alternative Shaper treated it as a real operational risk and made it their *only* named no-build trigger ("the first time a critical intraday alert is swallowed because EOD exhausted the shared daily cap"). The Constraint Advocate ranked the cap-scope isolation MEDIUM with the `max(0, C-I-E)` vs `max(0, C-I)` formula fix.

Attack 2 landed and was independently re-verified against the repo: `alert_dispatch_intraday.py` lines 17–23 say in the codebase's own docstring that EOD runs after close (16:30) while intraday polling stops at 15:00, "so they never overlap," the only contamination path is a manual/backfill EOD run during the session, and it **fails safe — suppresses extra alerts, never sends more.**

This does not erase the finding. It reclassifies it: real, already known to the author, rare, and suppression-only. It is not the chronic exposure the Alternative Shaper's trigger implied.

**Bookkeeping consequence, flagged as mine, not the panel's:** with that trigger undercut, the Alternative Shaper's no-build path is now *trigger-less*. Nobody proposed a replacement tripwire. If you choose to do nothing, you would be doing nothing without a defined revisit condition — which is a different decision than the one the Alternative Shaper offered.

**The alert kind discriminator survives, but on weaker grounds.** Both the System Shaper (item 4) and the Alternative Shaper (item 1) want it, unattacked. But its operational urgency travelled with the cap argument that Attack 2 downgraded. Treat it as cheap and worth doing when you are already in that dataset, not as a reason to open it.

## Mechanism the panel settled, and one it did not

**Settled.** The System Shaper's item 1 asked for intraday's EOD-lake read to become a same-date DAG dependency. Attack 1 landed and was re-verified: `interface/scheduler.py` puts EOD at 16:30 ICT while intraday polling stops at 15:00, so a strict same-date edge deadlocks intraday waiting hours for a run that has not happened. This fired the System Shaper's **own** pre-stated falsification criterion #2, which already named the fallback: a freshness check at read time. The diagnosis (the dependency is undeclared and must be made explicit) is untouched. Only the mechanism converted.

**Not settled, and I will not settle it by authoring.** Three advisors proposed three different mechanisms for that same seam, and the critic adjudicated none of them:

- **Alternative Shaper:** an explicit "external data readiness" sensor/asset in intraday's DAG, checking EOD lake freshness before running.
- **Constraint Advocate:** a narrow read-only EOD-context reader returning explicit available / missing / stale / incompatible status, expressed as an input/preflight asset — motivated by intraday's loader today silently converting read failures into absent context.
- **System Shaper (post-conversion):** a freshness check at read time.

These are indistinguishable on the evidence the panel produced, and **no panel member named an observation that would separate them.** Naming one now would be me quietly authoring the deciding argument. I record it as an open mechanism choice inside a seam all three agree must close; it does not change the direction and can be reopened or decided at implementation time.

## Confidence, per claim

- **That the difficulty is not at the execution-graph level (shared engine and shared domain functions already exist):** **high** on the fact — scout-observed, path-cited, unattacked. **Medium-high** on the inference from it to "therefore build no abstraction," discounted by Attack 3 below.
- **That the breadth-gate omission can reach an external notification and post-execution checks cannot stop it:** **high**. Attacked directly, verified against `asset_runner.py`, attack conceded.
- **That the breadth bypass is a bug rather than deliberate policy:** **unknown**. The scout explicitly could not determine it. This is the System Shaper's unchecked criterion #1 and it sizes step one.
- **That the loader schema asymmetry exists (`068d898` tolerance in EOD, absent in intraday):** **high** — scout-cited. **That fixing it matters:** **medium** — unattacked, but also unsized by anyone, and the System Shaper's own criterion #4 (the asymmetry merely reflects intraday being newer) was never checked.
- **That intraday's cross-pipeline EOD-lake read is undeclared in its own DAG:** **high** — scout-observed, unattacked, and reached independently by all three advisors.
- **That the shared alert-cap coupling is a live operational risk:** **low**. Attack 2 confirmed against the file's own docstring.
- **The Constraint Advocate's "4–7 maintainer days":** **low confidence in either direction.** Attack 5 called it inflated for a handful of well-scoped file changes; the coordinator judged verification out of scope and did not check. Do not plan against this number.
- **That duplication/drift is the dominant or accelerating cost:** **unknown** — scout could not determine.
- **Production scale, latency budget, failure frequency:** **unknown** — not in the repository. Genuine you-only gaps.

## What this recommendation costs

Choosing seam-closing over the pluggable abstraction is choosing against the forward-looking reading of your own word "evolution." If the real cost you feel is porting each new feature into both pipelines — the 2026-07-05 audit's proposed intraday ATR/RVOL features that EOD already has — then this recommendation spends days on seams that do not reduce that cost at all, and you will pay the porting cost again on the very next feature. The Alternative Shaper said this outright in their falsification criterion #1: if the pain is the boilerplate of duplicating new features, **structural unification wins instead.**

It also costs you silence. Today the breadth gate defaults to bypass and intraday's loader silently converts read failures to absent context — intraday always runs. After steps 1 and 3, intraday can refuse or fail loudly where it previously proceeded on wrong or missing inputs. You trade silently-wrong for visibly-stopped.

## Surviving dissent, attributed and unresolved

**The critic's Attack 3 is live and I cannot close it.** The critic holds that the near-unanimous convergence of all three shapers on "don't restructure, fix seams" may be an artifact of all three reading the same Phase 3 scout report rather than genuine independent convergence — and that all three under-weighted the CASE's own word "evolution" (forward-looking) in favor of the scout's operational bug findings. The coordinator did **not** re-verify this; it is interpretive, with no settling observation. **No advisor answered it,** because no proposal was revised after critique. Everything above is downstream of a diagnosis that this attack questions at the root, and it is the reason my confidence in "therefore no abstraction" is medium-high rather than high.

**The framing split was never adjudicated.** The System Shaper answers CASE option **C** (reframe: the option space itself is wrong). The Alternative Shaper and Constraint Advocate answer option **A** (keep separate, formalize contracts). Their concrete work overlaps heavily, but I am not reporting that as agreement on the question you asked — one advisor says your option space was mis-drawn and two say you picked correctly from it. If you care about the framing and not only the work order, that disagreement is unresolved.

**One abandoned alternative, for the record:** the Alternative Shaper considered and dropped duplicating the shared domain functions outright, on the grounds that the codebase already tolerates drift gracefully via the breadth-bypass default. Nobody attacked that reasoning — and note it rests on the same bypass whose intentionality is unknown.

## The values choice, which no evidence settles

The Constraint Advocate's boundary framing — **required-with-source** or **deliberately-exempt-with-reason** — is not a technical question in disguise. Both branches remove the silent default; they differ in what intraday does when the input is not there. Requiring it means intraday sometimes does not run when it would have run today. Exempting it deliberately means intraday keeps running without a signal you have decided it does not need. As sole maintainer you are also the on-call for whichever failure mode you pick. The panel cannot make that trade for you, and none of its members claimed to.

## Falsification criteria: checked, fired, unchecked, discarded

- **System Shaper #2** (DAG-edge mechanism unworkable for timing reasons → use a read-time freshness check): **checked and FIRED.** Attack 1, coordinator-verified against `interface/scheduler.py`.
- **System Shaper #1** (breadth bypass deliberate → item 2 shrinks to "document and test the constant"): **unchecked, open, load-bearing.**
- **System Shaper #4** (commit/validation asymmetry merely reflects intraday being newer → "asymmetric investment" diagnosis is wrong): **unchecked, open.**
- **Alternative Shaper #1** (pain is feature-porting boilerplate → structural unification wins): **unchecked, open, and the most consequential unchecked criterion in this packet.**
- **Alternative Shaper #2** (alert-cap bleed is an intentional business rule → state-coupling premise wrong): **not checked as stated**, but rendered low-stakes by Attack 2 regardless of intent.
- **System Shaper #3** ("if the pain is really about readability, not silent coupling") and **Alternative Shaper #3** ("if EOD/intraday are destined to merge into one streaming pipeline"): **discarded as criteria** per Attack 4 — unfalsifiable as written ("requires telepathy" / "requires clairvoyance"). They survive only as informal caveats.
- **Constraint Advocate:** stated a **stopping rule**, not falsification criteria — "stop once an EOD contract change passes a real intraday consumption test or fails visibly before dependent side effects." There is nothing here to check, and no criterion of theirs went unchecked.

## Provenance and source revisions

Lead advisor: interpretation of the CASE (four items deliberately left unresolved, all four still unresolved here). Phase 3 scout: report summarized for me as authoritative; I did not read `proofs/P01.3/scout-report.md` directly. System Shaper: `claude-bwrap` / `sonnet` / analytical, proposal v1. Alternative Shaper: `agy-bwrap` / `gemini-3.1-pro-low` / analytical, proposal v1. Constraint Advocate: `codex-readonly` / `gpt-6-astra` / analytical, proposal v1. Critic: Phase 6, reading all three v1 proposals — **the critic's harness/model/mode was not disclosed in the materials given to me**, so you cannot weigh that source the way you can weigh the other three. No actor was reported as having failed or not run; no specialist dispatch was mentioned either way.

Coordinator verification: Attacks 1 and 2 independently re-checked against the real repo and **confirmed**; the failed attack on the Constraint Advocate's check-ordering claim independently confirmed as failed. Attacks 3 and 5 **not** re-verified (interpretive, and out-of-scope estimation, respectively). Attack 4 needed no verification.

All three shapers read the same Phase 3 scout report — that shared input is the entire basis of Attack 3. The critique applies to **v1** of every proposal, and **no proposal was revised after critique**, so no advisor has answered Attack 1's mechanism conversion, Attack 2's downgrade, or Attack 3 in their own voice.

## The one fact that would most change this answer

**Which pain did you mean by "evolution": the drift you keep discovering after the fact, or the cost of adding the next feature to both pipelines?**

You are the sole maintainer; you hold this and no repository check can produce it. It is the Alternative Shaper's unchecked criterion #1 and the substance of the critic's Attack 3, and it is the only fact in this session that could move the recommendation from option A back to option B.

If it is drift: everything above stands as written.

If it is feature-porting cost: this packet solves an adjacent problem, and the panel should be reopened on that question rather than have me improvise the unification argument nobody made.

**Either way, step zero does not move.** The breadth-gate policy omission was attacked, survived, can reach an external notification, and cannot be caught by a post-execution check under the current runner. That is worth fixing before you answer anything else.

A distant second: **is the breadth bypass deliberate?** It does not change the direction — the policy becomes explicit either way — but it decides whether step one is a fix or a one-line documented-and-tested constant, and it is the difference between the Constraint Advocate's HIGH ranking and something much smaller.
