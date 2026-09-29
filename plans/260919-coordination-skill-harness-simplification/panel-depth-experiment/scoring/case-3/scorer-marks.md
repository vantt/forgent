# Blind scorer report — case-3 (asgn_i27_scorer_driver_op_003)

Procedure applied in order. Substance filter: a finding must assert a risk, error, gap, missing consideration, unsupported assumption, or change-recommendation about the **decision** (whether the round-2 `bindingSource === 'capability.prefer'` restriction is a sufficient, durable structural closure of the H4 exposure class). Wording/process, pure agreement, restatements, and style nits are excluded. Compound claims are split when an explanation could contain one part without the other. Duplicates are merged only when object + failure/risk + consequence are the same.

## RT findings (frozen list)

None.

The red-team source does not assert any distinct atomic finding about the **decision's substance**. Landed attacks A1–A3 target the dispatch/grant (empty `contextRefs`, driver-authored assertions in the objective, source used as a packet substitute). F1–F6 are explicitly **not asserted** (“not proven” / “not shown false”). F7 is recorded as a this-dispatch roster fact and is explicitly **not** upgraded into an H4-unclosed or diversity-violation claim. The `binding.mjs` notes (no `confinementSensitive` identifier; unbound-unless-`capability.prefer` already in control flow) are labeled in-source as code observations, not decision findings.

## CX findings (frozen list)

Enumerated from `control-objections-source-X.md` only (architecture-critic + constraint-advocate).

**CX-1.** The `confinementSensitive` flag would not have prevented H4: H4 was a consumer-side failure (existing `confinement.mode: required` on `review` was never read), not an author-side mis-marking; a second synonymous unread marker changes nothing on the side that failed.
Quote: “H4 was a **consumer-side** failure: a declaration existed and was ignored. It was not an **author-side** judgment failure. Adding a second marker that means the same thing as `confinement.mode` changes nothing on the side that failed.”

**CX-2.** If refuse-orphan-fallback is gated on `confinementSensitive: true`, every capability authored without the flag fails open — worse than today's unconditional line-268 fail-closed.
Quote: “The rule would be "refuse the orphan fallback only when `confinementSensitive: true`". With that rule, every capability authored without the flag fails **open**. Line 268 today fails **closed** for every capability”

**CX-3.** If a flag-gated rule still keeps line 268 unconditional, the flag adds no coverage for branch 3 (redundant).
Quote: “If it does keep line 268, the flag adds no coverage for branch 3.”

**CX-4.** The system shaper's confinement-aware `prefer` filter (`confinement.mode === 'required'`) is opt-in by the capability author and stays silent for any capability with no `confinement` block.
Quote: “That predicate is still **opt-in by the capability author**. It stays silent for any capability that has no `confinement` block.”

**CX-5.** Declared-prefer-lands-unconfined residual: a capability with a bare-string `.prefer` (in-repo: `code:test`) is accepted by line 268 because `bindingSource` is `capability.prefer`; `preferInvocation` is omitted; dispatch takes the first CLI invocation (e.g. `claude-cli` with acceptEdits).
Quote: “`code:test` (config.json:119-126) has `prefer: "claude"` as a bare string and no `confinement` block. … Line 268 accepts it, because the binding source is `capability.prefer`. … Dispatch then takes the first CLI invocation, `claude-cli` with acceptEdits … That is the "declared prefer lands unconfined" residual”

**CX-6.** The fact that actually needs confinement lives on the **operation** side (`result.kind: advisory`; kernel-derived `Mutation: read-only`), not on the capability-author side.
Quote: “The fact that actually needs confinement lives on the **operation** side. Every operation in this protocol declares `result.kind: advisory` … the kernel already derives a read-only mutation class that does not depend on any capability author.”

**CX-7.** Structural closure should key “must bind to a confined invocation, or stay unbound” on the operation's effective mutation class (read-only), with capability `confinement.mode` as an additional trigger, not the only one — closing the omission path for future capabilities with nothing new to author.
Quote: “A structural closure should key the "must bind to a confined invocation, or stay unbound" predicate on the **operation's effective mutation class** (read-only). The capability `confinement.mode` should be an additional trigger, not the only one.”

**CX-8.** If the mutation class is derived only after binding, or is invisible to the binder, it must be threaded into `bindOperations` `facts` (a contract change).
Quote: “If it is derived only after binding, or only from something the binder can't see, the proposal needs that value threaded into `facts`. That is still cheap, but it is a contract change.”

**CX-9.** System-shaper F3 (one pure unit test of the residual) is real and cheap and should be run before anything else.
Quote: “**System shaper F3** is real and cheap: it is one pure unit test. Run it before anything else.”

**CX-10.** F1 (dispatch-time re-resolution by capability name) is load-bearing for every option; if it lands, neither the binding predicate nor a doctor check is enough and the guard must move into `resolve.mjs`.
Quote: “If F1 lands, neither the binding predicate nor a doctor check is enough, and the guard moves into resolve.mjs.”

**CX-11.** The `required`-diversity fail-open (`binding.mjs:128-131, 145-148, 202`) is a real, separate finding — not H4 — that should not be merged into this decision and should not be lost.
Quote: “the `required`-diversity fail-open (binding.mjs:128-131, 145-148, 202) is a real, separate finding. It is not H4. It should not be merged into this decision, but it should not be lost either.”

**CX-12.** Recommended work order: (1) resolve F1; (2) locate where the mutation class is derived; (3) land the predicate with the shaper's 4 tests plus a `code:test`-shaped omission test; (4) add the doctor check as the visibility layer.
Quote: “Order of work: 1. Resolve F1. 2. Locate where the mutation class is derived. 3. Land the pure predicate with the shaper's 4 tests, plus one for `code:test`-shaped omission. 4. Add the doctor check … as the visibility layer.”

**CX-13.** Kernel hardening (A) has the widest blast radius (shared core) and a path to irreversible persisted JSONL writes if written shape changes; rollback cannot restore consistency without manual reconciliation of records written in the window.
Quote: “This is the only option that has a path to an irreversible step: persisted writes in a changed shape. It also has the widest blast radius, because it is shared core code. … if A changes anything that gets written to the JSONL truth, a rollback cannot restore consistency without manual reconciliation”

**CX-14.** A stricter doctor check (B) can false-positive and block setup/CI on healthy machines, including other projects that use the global install.
Quote: “Its failure mode is **false positives**: a check set to fail blocks setup or CI on machines that are actually healthy, including projects outside this repo that use the global install”

**CX-15.** Do-nothing (C) risks silent, unowned recurrence whose cost accumulates and cannot be recovered; C has no owner for the failure it leaves in place.
Quote: “The risk is **silent recurrence** of whatever failure prompted A and B, with no detection. … C has no owner for the failure it leaves in place.”

**CX-16.** Before merging A, make the reader accept both old and new record shapes (or add a test asserting no shape change); a process promise is not an engineering control.
Quote: “Before merging, make the reader accept **both the old and the new record shapes**. … Do not use "we'll be careful during rollout" as the mitigation. That is a process promise, not an engineering control.”

**CX-17.** Register any new doctor check at **warn** severity, not fail; promote to fail later after zero false positives; test the predicate against a known-healthy fixture.
Quote: “Register the check at **warn** severity, not fail. Moving it to fail later is a one-line change, made once real doctor runs show zero false positives. The check's predicate gets a test against a known-healthy fixture.”

**CX-18.** Ship B first at warn (to produce recurrence-frequency evidence), A second only with the dual-shape reader; C is not a ship.
Quote: “**B, at warn severity.** … **A comes second**, and only with the dual-shape reader in place. C is not a "ship"”

**CX-19.** Main's `binding.mjs` may differ from the `unit/I27` worktree copy; that drift is unverified.
Quote: “Does main's `binding.mjs` differ from `unit/I27`'s? I could not read main.”

Excluded from CX: held attacks that are pure agreement (line 268 closes H4's exact no-`.prefer` shape; shaper already rejected the flag); F4-as-unfalsifiable (evaluation-process of a criterion); ranking table restated as CX-13/14/15; process notes (empty grant, grep denied).

## CY findings (frozen list)

Enumerated independently from `control-objections-source-Y.md` only. Source text is the same packet; the atomic list is therefore isomorphic, not copied from CX.

**CY-1.** The `confinementSensitive` flag would not have prevented H4: H4 was a consumer-side failure (existing `confinement.mode: required` on `review` was never read), not an author-side mis-marking; a second synonymous unread marker changes nothing on the side that failed.
Quote: “H4 was a **consumer-side** failure: a declaration existed and was ignored. It was not an **author-side** judgment failure. Adding a second marker that means the same thing as `confinement.mode` changes nothing on the side that failed.”

**CY-2.** If refuse-orphan-fallback is gated on `confinementSensitive: true`, every capability authored without the flag fails open — worse than today's unconditional line-268 fail-closed.
Quote: “With that rule, every capability authored without the flag fails **open**. Line 268 today fails **closed** for every capability”

**CY-3.** If a flag-gated rule still keeps line 268 unconditional, the flag adds no coverage for branch 3 (redundant).
Quote: “If it does keep line 268, the flag adds no coverage for branch 3.”

**CY-4.** The system shaper's confinement-aware `prefer` filter (`confinement.mode === 'required'`) is opt-in by the capability author and stays silent for any capability with no `confinement` block.
Quote: “That predicate is still **opt-in by the capability author**. It stays silent for any capability that has no `confinement` block.”

**CY-5.** Declared-prefer-lands-unconfined residual: a capability with a bare-string `.prefer` (in-repo: `code:test`) is accepted by line 268 because `bindingSource` is `capability.prefer`; `preferInvocation` is omitted; dispatch takes the first CLI invocation (e.g. `claude-cli` with acceptEdits).
Quote: “That is the "declared prefer lands unconfined" residual the shaper itself identified (E4+E5), and it is reached through omission.”

**CY-6.** The fact that actually needs confinement lives on the **operation** side (`result.kind: advisory`; kernel-derived `Mutation: read-only`), not on the capability-author side.
Quote: “The fact that actually needs confinement lives on the **operation** side.”

**CY-7.** Structural closure should key “must bind to a confined invocation, or stay unbound” on the operation's effective mutation class (read-only), with capability `confinement.mode` as an additional trigger, not the only one.
Quote: “A structural closure should key the "must bind to a confined invocation, or stay unbound" predicate on the **operation's effective mutation class** (read-only). The capability `confinement.mode` should be an additional trigger, not the only one.”

**CY-8.** If the mutation class is derived only after binding, or is invisible to the binder, it must be threaded into `bindOperations` `facts` (a contract change).
Quote: “If it is derived only after binding, or only from something the binder can't see, the proposal needs that value threaded into `facts`.”

**CY-9.** System-shaper F3 (one pure unit test of the residual) is real and cheap and should be run before anything else.
Quote: “**System shaper F3** is real and cheap: it is one pure unit test. Run it before anything else.”

**CY-10.** F1 (dispatch-time re-resolution by capability name) is load-bearing for every option; if it lands, neither the binding predicate nor a doctor check is enough and the guard must move into `resolve.mjs`.
Quote: “If F1 lands, neither the binding predicate nor a doctor check is enough, and the guard moves into resolve.mjs.”

**CY-11.** The `required`-diversity fail-open (`binding.mjs:128-131, 145-148, 202`) is a real, separate finding — not H4 — that should not be merged into this decision and should not be lost.
Quote: “the `required`-diversity fail-open (binding.mjs:128-131, 145-148, 202) is a real, separate finding. It is not H4.”

**CY-12.** Recommended work order: (1) resolve F1; (2) locate mutation-class derivation; (3) land the predicate with the shaper's 4 tests plus a `code:test`-shaped omission test; (4) add the doctor check as visibility.
Quote: “Order of work: 1. Resolve F1. 2. Locate where the mutation class is derived. 3. Land the pure predicate … 4. Add the doctor check”

**CY-13.** Kernel hardening (A) has the widest blast radius (shared core) and a path to irreversible persisted JSONL writes if written shape changes; rollback cannot restore consistency without manual reconciliation.
Quote: “This is the only option that has a path to an irreversible step: persisted writes in a changed shape.”

**CY-14.** A stricter doctor check (B) can false-positive and block setup/CI on healthy machines, including other projects that use the global install.
Quote: “Its failure mode is **false positives**: a check set to fail blocks setup or CI on machines that are actually healthy”

**CY-15.** Do-nothing (C) risks silent, unowned recurrence whose cost accumulates and cannot be recovered; C has no owner.
Quote: “The risk is **silent recurrence** … C has no owner for the failure it leaves in place.”

**CY-16.** Before merging A, make the reader accept both old and new record shapes (or add a test asserting no shape change); a process promise is not an engineering control.
Quote: “Before merging, make the reader accept **both the old and the new record shapes**.”

**CY-17.** Register any new doctor check at **warn** severity, not fail; promote to fail later after zero false positives; test against a known-healthy fixture.
Quote: “Register the check at **warn** severity, not fail.”

**CY-18.** Ship B first at warn (to produce recurrence-frequency evidence), A second only with the dual-shape reader; C is not a ship.
Quote: “**B, at warn severity.** … **A comes second**, and only with the dual-shape reader in place. C is not a "ship"”

**CY-19.** Main's `binding.mjs` may differ from the `unit/I27` worktree copy; that drift is unverified.
Quote: “Does main's `binding.mjs` differ from `unit/I27`'s? I could not read main.”

## RT marks in X

No RT findings to mark.

## RT marks in Y

No RT findings to mark.

## CX marks in X

PRESENT requires the same object + same risk/failure + same consequence in any wording (adopting, conditioning-on, or naming-and-rebutting). No partial credit.

| ID | Mark | Matching quote (PRESENT only) |
|---|---|---|
| CX-1 | **PRESENT** | “H4 itself was a consumer-side failure: a confinement declaration existed in config and no code read it. So a `confinementSensitive` flag … would not have prevented H4.” |
| CX-2 | **ABSENT** | — (fail-closed is stated for no-`.prefer` capabilities, not for a flag-gated default-when-absent) |
| CX-3 | **ABSENT** | — |
| CX-4 | **PRESENT** | “The shaper's trigger keys on the capability's own `confinement.mode`. The critic proposed keying on the operation's effective mutation class instead, which would also cover capabilities like `code:test` that have no confinement block.” |
| CX-5 | **PRESENT** | “A capability that declares a bare-string `.prefer` emits no invocation preference, so dispatch takes the executor's first CLI invocation, which for `[REDACTED]` and `claude` is unconfined.” |
| CX-6 | **ABSENT** | — (mutation-class is named as a proposed trigger; the operation-side diagnosis `result.kind: advisory` / kernel-derived `Mutation: read-only` is not stated) |
| CX-7 | **PRESENT** | “The critic proposed keying on the operation's effective mutation class instead, which would also cover capabilities like `code:test` that have no confinement block. … The synthesizer refused to recommend it for exactly that reason. Adopting it now would be adopting an architecture nobody tested.” |
| CX-8 | **PRESENT** | “The critic's variant rests on an unverified fact about where the mutation class is derived and whether the binder can see it.” |
| CX-9 | **PRESENT** | “The one unit test that would prove or kill this residual was stated by the shaper, endorsed by the critic as "run it before anything else," and run by nobody.” |
| CX-10 | **PRESENT** | “If any dispatch-time code … passes an operation's capability name, rather than the already-bound executor, back into executor resolution, then line 268 is not the gate and the whole recommendation inverts toward moving the guard into `resolve.mjs`. … The critic called it the load-bearing unknown for every option.” |
| CX-11 | **PRESENT** | “**Required provider diversity fails open.** An unknown family or forward reference counts as diverse, and the frozen record then claims the requirement was satisfied. … The first adopter is the deadline, because the false claim would land in append-only evidence.” |
| CX-12 | **ABSENT** | — (F1 / tests / doctor appear separately; the four-step order is not stated) |
| CX-13 | **PRESENT** | “The second pass read nothing and ranked kernel hardening riskiest on a persisted-record worry the module header refutes. The synthesizer gave the second pass's ranking no weight, and I agree with that call.” |
| CX-14 | **ABSENT** | — (warn-severity is present; false-positives blocking healthy/global installs is not) |
| CX-15 | **ABSENT** | — |
| CX-16 | **ABSENT** | — |
| CX-17 | **PRESENT** | “Nobody opposed adding this check. Ship at warn severity first.” / “Its one durable contribution, warn severity for any new doctor check, was kept.” |
| CX-18 | **PRESENT** | “The synthesizer picked one path out of three: **confirm the round-2 fix is sufficient, lock it with a test, and do no further H4 work.** Not kernel hardening. Not a doctor check as the closure.” plus ranking “gave the second pass's ranking no weight” |
| CX-19 | **PRESENT** | “Every panelist read `binding.mjs` from the `unit/I27` worktree. Nobody could read main. Drift between the two remains unverified.” |

## CY marks in Y

| ID | Mark | Matching quote (PRESENT only) |
|---|---|---|
| CY-1 | **PRESENT** | “H4 was not an author-judgment failure. The declaration already existed (`confinement.mode: required`); the failure was that no consumer read it. Adding a second declaration nobody reads would not have prevented H4.” |
| CY-2 | **ABSENT** | — |
| CY-3 | **ABSENT** | — |
| CY-4 | **ABSENT** | — (bare-string `.prefer` residual is named; the shaper `confinement.mode === 'required'` opt-in predicate is not) |
| CY-5 | **PRESENT** | “a bare-string `.prefer` silently falling through to an unconfined first invocation. Zero observed instances.” |
| CY-6 | **ABSENT** | — |
| CY-7 | **ABSENT** | — |
| CY-8 | **ABSENT** | — |
| CY-9 | **ABSENT** | — |
| CY-10 | **PRESENT** | “**Conditioned on F1:** whether any dispatch-time path re-resolves an operation by capability NAME rather than by the bound preferExecutor. … If the answer is yes, the recommendation inverts: the guard must move into resolve.mjs, and a unit is warranted.” |
| CY-11 | **ABSENT** | — |
| CY-12 | **ABSENT** | — |
| CY-13 | **ABSENT** | — (text asserts high reversibility / “nothing here is a one-way door” without naming the JSONL persisted-write irreversibility finding; that is not naming-and-rebutting) |
| CY-14 | **ABSENT** | — |
| CY-15 | **ABSENT** | — |
| CY-16 | **ABSENT** | — |
| CY-17 | **ABSENT** | — |
| CY-18 | **ABSENT** | — |
| CY-19 | **ABSENT** | — |

## Dispositions

Only PRESENT marks. DISPOSED = final recommendation adopts, conditions-on, or rebuts-with-reason. MENTIONED-ONLY = appears, but the recommendation neither acts on it nor rebuts it.

### CX-1 in X — DISPOSED
Used as a reason the flag is not the path and that the round-2 fix can be treated as sufficient for H4-as-defined. Adopted into the recommendation.

### CX-4 in X — MENTIONED-ONLY
The opt-in `confinement.mode` trigger and the no-block gap are named as part of the live residual disagreement. The H4 recommendation neither adopts a predicate fix nor rebuts that the shaper predicate is opt-in/silent.

### CX-5 in X — MENTIONED-ONLY
The bare-string `.prefer` → unconfined-first-CLI residual is named and reclassified as a second exposure class. The recommendation does not close it and does not rebut that the residual exists; it leaves the residual to the person.

### CX-7 in X — DISPOSED
The mutation-class trigger is named and **rebutted with reason**: unverified derivation/binder visibility; “adopting it now would be adopting an architecture nobody tested.”

### CX-8 in X — DISPOSED
The binder-visibility/derivation gap is the stated reason for refusing CX-7. Rebuts-with-reason / conditions non-adoption on that unverified fact.

### CX-9 in X — MENTIONED-ONLY
F3 is named as endorsed and unrun. The recommendation's “confirm a regression test exists or write one” is the H4 lock test (no-`prefer` → unbound), not F3. F3 is not required by the recommendation.

### CX-10 in X — DISPOSED
F1 is the explicit condition: until checked, treat “confirmed sufficient” as high-probability, not proven; a yes inverts the recommendation toward `resolve.mjs`.

### CX-11 in X — DISPOSED
Adopted as a non-H4 finding that “should not be lost,” with first-adopter-as-deadline.

### CX-13 in X — DISPOSED
The persisted-record / irreversible-writes ranking is named and **rebutted with reason**: module header refutes it; binder does no I/O; synthesizer gave the ranking no weight; the explainer agrees.

### CX-17 in X — DISPOSED
Warn-severity for any new doctor check is kept and recommended (“Ship at warn severity first”).

### CX-18 in X — DISPOSED
The ship-B-then-A package/ranking is named and **rebutted with reason**: H4 closure is “confirm the round-2 fix”; not kernel hardening; not doctor as the closure; second-pass ranking given no weight.

### CX-19 in X — MENTIONED-ONLY
Main vs `unit/I27` drift is listed as unverified and as an unresolved question. The “confirm sufficient” recommendation is not conditioned on checking that drift (the stated gates are F1 and the lock test).

### CY-1 in Y — DISPOSED
§9 is used as a reason the flag is not the answer; Part A recommends confirming the round-2 fix and opening no kernel-hardening unit for H4.

### CY-5 in Y — MENTIONED-ONLY
The residual is named as Part B and held open for the person. The recommendation does not close it and does not rebut that it exists.

### CY-10 in Y — DISPOSED
Part A is explicitly **conditioned on F1**; a yes inverts the recommendation (guard into `resolve.mjs`, unit warranted).

## Unscored notes (if any)

None. This case has no independently verified ground truth. No factual-error rate, count, or comparison is stated or implied.
