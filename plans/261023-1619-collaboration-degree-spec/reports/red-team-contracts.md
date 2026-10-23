# Red-team: contract and fact check of spec-draft.md

Reviewed at HEAD `4065cbd68`. Read-only; no tests or builds run.

Fact-check summary. Cited file:line anchors that I re-read exist and say what the spec claims: `run.mjs:366` (chosenPattern), `case-projection.mjs:19,26,104,109-116,129`, `seat-resolver.mjs:113,116,198-203`, `unit.mjs:262-268`, `case-admission.mjs:233,240-241`, `case-runtime.mjs:169,215`, `reviewed.mjs:113,144`, `feature.yaml:143-145`. Quoted Vietnamese sentences in 15.1, 15.2 and 15.3 match the current text of `workflow.md` (lines 107, 167, 173, 228/239, 261, 271, 306, 428, 452), `runner.md` (1146, 1500) and `seat-binding.md` (29, 213, 214). Two sentences sit inside longer lines, so cite them as "within line N". Every proof file named in section 10 exists. The defects below are in the design, not the citations.

## F1 (Critical) — "both receipts on plan-validated" has no implementable acceptance model, and consent alone makes the milestone eligible

Spec: F3, F8, 8.1, S5.

Evidence:
- `case-projection.mjs:67-70` `achieve()` overwrites the whole milestone record with `{state:'achieved', digest, ...extra}`. A milestone holds one digest and one `receipt` or `receipts` payload.
- `gate.answer` (`:109-116`) sets `state:'achieved'` and `consent:true`. `settle` (`:129`) sets `state:'achieved'` and `receipts`. There is no field for "verdict seen" next to "consent seen".
- Consumer admission (`case-admission.mjs:148-168`) checks `human-consent` as `state==='achieved' && consent===true`, and `verify-receipt` as `state==='achieved'` only. The switch has no `reviewer-verdict` case.

Failure scenarios:
1. Consent is answered first, with no verdict. The state is `achieved` with `consent:true`, so `implement-item` passes the `human-consent` MUST row. Nothing checks the verdict, so a plan that was never validated gets executed.
2. A verdict settle arrives after consent and overwrites the record. `consent` is lost, the digest becomes the assessor's digest, and the order of the two events decides which receipt survives.

Spec text that is wrong or missing:
- F3 says "accepted only from the evaluator its guard names ... on every event path".
- Nothing says how two guards on one milestone combine, or that the consumer-side admission switch gains a `reviewer-verdict` case.
- F3 names "projection; admission adapter" as owner but not `case-admission.mjs`.

Fix: define the milestone record as per-guard evidence slots, `{verdict:{digest,receipt}, consent:{digest,receipt}}`. A milestone is `achieved` only when every guard row naming it is satisfied on one digest. `achieve` merges slots and never replaces them. Add the `reviewer-verdict` case to the admission switch and make `consent` and `verdict` both conjuncts. Add S5 cases for consent-first and verdict-first.

## F2 (Critical) — a worker can still mint a harness-verify receipt by naming its seat; `unit.seats` also bypasses every param bound

Spec: 3 ("never a weaker receipt"), F1, F9, 6.2 (`seats` is closed-set), 8.1.

Evidence:
- `legacy-seat-read.mjs:29-31` `isVerifyResult` is `/^verif(y|ier)$/.test(seatKeyOf(result))`. It is a seat-id name test with no posture check.
- `receiptsFromResults` (`case-projection.mjs:244`) turns any such passing result into `evaluator:'harness-verify'`.
- Solo accepts a declared seat with an arbitrary id: `seat-resolver.mjs:198-201` returns `seat: declared[0].seat`.
- `declaredSeatsOf` (`seat-resolver.mjs:159-162`) reads `unit.seats ?? params.seats`, so a Unit-level `seats` silently beats the preset or activity `params.seats`.

Failure scenarios:
1. A producer-only solo Unit declares `seats:[{seat:'verifier',role:'producer'}]`. Its own pass becomes a harness-verify receipt on `child-verified`.
2. `unit.seats` overrides a preset invariant (`consult` and the research presets). Section 6.2 and 6.5 say a request replacing a closed-set invariant refuses `preset-invariant-weakened`, but the file-level `seats` path never goes through that check.

Fix:
- Receipt classification must come from the runner-owned result kind (the verify checkpoint's own record) and not from `seat` text.
- `checkDeclaredSeats` must refuse reserved ids `verify` and `verifier`.
- `unit.seats` and `params.seats` must be unified in the one resolver as a single `seats` param. It then falls under the 6.1 merge order and the bound.
- Add this to the S6 and S13 proofs.

## F3 (High) — the digest is stamped at settle, not when the evaluator ran

Spec: F3 ("captured at evaluation; settlement never restamps"), 8.3 ("the tested paths (unchanged)"), F1, S4.

Evidence:
- `case-admission-port.mjs:82-86` calls `testedPathsDigest` at settle time and passes it into `receiptsFromResults`, which copies `subjectDigest` onto every receipt.
- `receiptsFromResults` takes the digest as a parameter. The verify result records no digest.

The spec says in the same breath "unchanged" and "never restamps". That is a contradiction against current code.

Failure scenario: the harness verifies tree T1, a worker or a resume edits the scope, then settle runs. The receipt is stamped with T2 and `isValidReceipt` passes. A pass on T1 now vouches for T2.

Fix: F1 must say the verify checkpoint records the tested-subject digest in its durable result at run time. The adapter reads that digest and never recomputes it. A mismatch with the current digest means no achievement. Say that 8.3's "(unchanged)" is replaced for verify-guarded milestones. Likewise the assessor receipt digest comes from the digest captured when the assessor was launched.

## F4 (High) — F8's assessor activity has no milestone to bind to, and `integrate` and `fix-verify-red` are not covered

Spec: F8, F9, S3, S6.

Evidence:
- `feature.yaml:147` `review-item` has `produces: []`.
- `case-admission-port.mjs:71-74` returns `{achieved:[]}` when `produces` is empty, so the assessor's verdict is stored nowhere against a milestone.
- F3 says a receipt names one milestone, and F4 says a MUST is checked on "a milestone this activity finishes".

The light-validation unit the owner chose for the coding guide therefore finishes nothing and gates nothing.

Also not addressed:
- `integrate` (`produces: [integrated]`, `unit:{kind:integrate}`, no pattern, so it resolves to solo) has `integration-receipt` (`verify-receipt`, subject `integrated`). Once F1's "finishing activity needs a verify checkpoint and command" lands, this activity refuses `verify-command-required` unless a command is supplied.
- `fix-verify-red` is told to "declare a unit" with no value.
- The `shape-plan` and `validate-plan` split needs a new milestone id, `entry` rewiring for `validate-plan`, and `decisions` rows. None are given.

Fix: state what milestone `review-item`'s verdict binds to (a new `item-reviewed` milestone, or drop the claim that it is light validation). Add rows for `integrate` and `fix-verify-red` and the exact guide diff for the plan split.

## F5 (High) — clamp versus refuse, and `maxRounds` is both default and ceiling

Spec: 6.3 (SC4), 6.1, F7 ("never clamps"), 5.3.

Evidence:
- 6.3 says "a preset or activity default above the ceiling resolves to the ceiling with provenance `config`".
- F7 says a request crossing a bound "refuses by name, never clamps".
- The code reads `maxRounds` in at least three places: `reviewed.mjs:113`, `reviewed.mjs:144` and `seat-resolver.mjs:262`. All use `params?.maxRounds ?? cfg.patterns.reviewed.maxRounds ?? 2`. F7 says "every loop consumer reads the pin" but names none.
- One key plays two roles. A project that sets `maxRounds: 1` as its default can no longer permit a request for 3, and a project that wants default 2 and ceiling 4 cannot say so.

Fix:
- Pick one rule, refuse for requests and clamp-with-provenance for defaults, and state it once in F7 and 6.3.
- Name the three consumers that move to the pinned value in the same change.
- Either accept that default and ceiling are one number (and say so in the description) or give the ceiling its own key, which then needs setup and doctor registration under the AGENTS.md gate.

## F6 (High) — `verify-command-unsupported` as written breaks existing capability-level verify on panel and debate

Spec: F1 third bullet, 5.3, S10.

Evidence:
- `verifyCommandOf` (`reviewed.mjs:34-37`) returns the Unit `verify`, else `capabilities.<cap>.verify`.
- `run.mjs:1418` resolves it for every pattern.
- The spec says a supplied verify refuses "whether or not any guard asks", with "Unit or capability supplies".

A project that configures `verify` on a capability, which is a default for that capability, and then runs `panel`, `debate` or the `research-fan-out` presets on it, now refuses before launch. That is a silent breaking change to an existing key. Section 9 lists this key as unchanged.

Fix: refuse only a Unit-explicit `verify` on a pattern with no checkpoint. A capability default is ignored there and reported as `verify: {ran:false, reason}`. Admission's `verify-command-required` then catches the case where a guard needs it. If the refusal on capability verify is intended, section 9 must list it as a behaviour change with a CHANGELOG line.

## F7 (Medium) — the precedence rule and the merge order disagree on activity-default params

Spec: 5.1, 6.1, owner's order (guide defaults, pattern/preset invariants, config, agent request).

- 5.1 says an explicit selector (caller or Unit) beats the pinned activity unit entirely.
- 6.1 says request beats activity default beats preset default.
- When a caller passes `--pattern rfc` and the activity says `{pattern: reviewed, params:{maxRounds:1}}`, nothing says whether the activity's `maxRounds:1` still applies. It is the same pattern family but a different selector.
- `selector-conflict` is "different explicit selectors". The spec does not say whether `code-change` versus `reviewed` is compared by name or by expansion.
- 6.1 puts "config" in the chain only for `maxRounds`. Config bounds and config floors are described elsewhere as "on top". The owner's four-step order has invariants as a separate step before config, and 6.1 folds them into "preset default".

Fix: add one table that gives a worked order for explicit selector plus activity params, and define selector equality (by resolved `{patternName, params}`). Keep invariants as their own step.

## F8 (Medium) — the consent writer takes `milestones`, digest and `subjectRef` from the caller

Spec: 8.2 (SC6), F8, 15.1 RUL-WF-14.

Evidence:
- `case-verbs.mjs:167-185` `recordAnswer` is the public answer door. SC6 adds `milestones` and `subjectRef` to `recordGateAnswerRound`, and the digest is supplied by the caller (spec step 3: "digested with `digestSubject` at approval time").
- Projection (`case-projection.mjs:114`) will then `achieve` any milestone ids in the payload.
- Nothing restricts the ids to milestones that have a `human-consent` MUST row, and nothing says the writer, not the caller, computes the digest.

Failure scenario: any process that can call the answer door with `--approve` (the door is also reachable by agent sessions) names `child-verified` or `plan-validated` and a digest it chose. It earns state and consent on a milestone, and F1 shows consent already bypasses the verdict check.

Also, premise G3 ("only the playbook runner writes `gate.park`") is only partly true: `src/workflow/runner.mjs:448-457` parks a gate again when a stale approval is refused, using `guide.activities...produces`. Check whether the scoped exclusivity rule collides with that re-park path.

Fix: the writer accepts `subjectRef` only, validated against the milestone's declared subject locator. It computes the digest itself under the existing lock. It refuses milestone ids that have no `human-consent` row. State who may call it (owner door only).

## F9 (Medium) — setup writing `minCheckers` conflicts with project>global>shipped inheritance, and G5's premise is unproven

Spec: F5 upgrade path, G5, 9 (Setup row).

Evidence:
- The shipped `core/config-standard/runner.yaml:707` already has a `code:*` entry (roles, tier) and no `minCheckers`. The F5 plan to "ship the default in the standard config" reaches every project that does not override that key, through normal config merge.
- Writing the key into each project's `.fgos/config.json` pins the value and freezes any later shipped change. It also turns an inherited default into a "visible project choice" that the project never made.
- The spec does not say whether the runtime merge actually reads the shipped standard config (versus the `config.mjs` code defaults). G5's claim that moving the key to shipped config "silently drops" it was not verified against the loader.
- A project with an exact entry such as `code:implement` that sets its own `minCheckers` loses red-team (the `:116` hardcode is gone and the exact key now wins first). The spec's "absent inherits" covers only absent keys.

Fix: verify the loader path first. If the shipped file is merged, delete the setup-write requirement and instead make setup and doctor report an exact-key `minCheckers` that omits `red-team` (a warn, not a write). If it is not merged, say so with the line that proves it.

## F10 (Medium) — acceptance scenarios that name two owners or no observable

Spec: section 10, principle 8.

- S9 and S10 share `case-admission.test.mjs` as owner for three admission codes, with `run.test.mjs` for the Core code. That is fine, but S9's wiring proof (`run-case-admission.test.mjs`) is listed as proving "the proposal carries effective pattern, params, postures, checkpoint and command presence". That fact set is a new field list on `port.admit` (`run.mjs:718-730` today passes `pattern`, `seatLaunches`, `blind`, `handoffRefs`, `rigor`). The spec never names the new proposal fields or their owner in one place (`requested` appears only in 11.1). Add them to section 5.3 or a proposal-shape table.
- S1 asserts that a registered step, a conductor case and a standalone Unit give the same effective collaboration, and gives the pure resolver test as the only proof. The three doors differ in who builds the Unit (`unit-handoff.mjs unitPatternOf`, `bin/fgos.mjs adhocUnitFromPrompt`, `--unit` file), so a resolver test cannot observe the door difference. Needs one wiring proof, and the table says "none".
- S11 ("resume after a preset or config edit: the original effective meaning, or a named refusal") has no named refusal code. F7 says only "refused by name". Add the code to 5.3, because it is a new refusal with no owner today.
- S17 is observable only where provenance exists. The seat resolver cannot see handoff provenance (it does not read `handoffRefs`), so the owning layer is wrong: it belongs at the admission or Core door that sees `inputs`.

Fix: add the missing code names and the proposal-shape table. Move S17 to the layer that can see provenance.

## Unresolved questions

- Does `readCase` supply `currentDigests` for guide cases from a `subjectRef` the writer stored, or from the guide's prose `subject`? 8.3 says the former, but SC7 does not say which module owns locator validation.
- Does the owner accept that F1 as drafted changes `plan-validated` for every existing guide case in flight (no `plan.md`-bound consent exists until the coding cutover, per RR13)? That blocks all `implement-item` dispatches on in-flight coding cases.

Status: DONE
