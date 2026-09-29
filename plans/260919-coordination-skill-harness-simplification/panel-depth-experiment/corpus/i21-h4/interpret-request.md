# interpret-request (real, asgn_i27_driver_op_005)

## Dispatched objective (verbatim)

Interpret the person's intent: Unit I21 (this repo's own coordination-skill-harness-simplification track) found a real, live confinement/security regression (H4, fix-round-2): the generic "review" capability (deliberately declared with no `.prefer` by Unit I19) fell through `deriveOperationCapability`'s reverse-mapping `capability.for` branch, silently pinning all 8 architecture-advisory-panel-v1 actors onto an UNCONFINED `xai`/`pi-cli-vantt` executor (write/edit/bash, no sandbox) instead of the pre-I21 `readOnlyRedirects` safety net (a confined, read-only path). The round-2 fix restricted accepted resolutions to exactly `bindingSource === 'capability.prefer'` (src/verbs/coordination/binding.mjs, around the H4 comment). Validate: is this fix a sufficient, durable structural closure, or does it leave the underlying exposure open for any FUTURE capability that also declares no `.prefer` (the same shape that caused H4 in the first place)? Use absolute paths for anything you read (e.g. /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts at the exact runDir path this dispatch gives you under that tree. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Interpreted intent for the H4 confinement-fix validation. Stated question bundles three separable properties (sufficient / durable / structural) that may get different answers. Confident: the worry is class-vs-instance closure of a string-tag allowlist at the symptom site, not whether H4 still reproduces. Guessed and flagged: the person already suspects instance-only closure and wants it checked, not the fix ratified; the deeper fear is that confinement is inferred from the chosen executor rather than asserted from the operation's read-only mutation, which would make even capability.prefer a non-guarantee. Held open five ambiguities (A-E) for the context investigator: non-prefer fall-through behavior, downstream confinement enforcement, whether .prefer is confinement-checked, presence of a mutation-sensitive locking test, and whether the fix retired I19's no-.prefer intent. No PROJECT_ROOT source read (binding.mjs read denied, consistent with role); no intake.md existed, the objective text served as intake.",
  "evidenceRefs": [
    "/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_005/runs/01/agent-report.md",
    "/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment/.fgos/assignments/asgn_i27_driver_op_005/runs/01/task-spec.json"
  ]
}
```

## Real agent-report.md (verbatim)

# Interpretation — H4 confinement fix: sufficient, durable, structural?

Role: lead-advisor (interpret-request). Assignment `asgn_i27_driver_op_005`, run 01.

## Evidence used

- The dispatch objective text (no `intake.md` exists at the runDir; the objective is the intake).
- `plans/260919-coordination-skill-harness-simplification/plan.md` status header only (lines 1–100): confirms Unit I21 is already integrated at `main@9d1fbc99d` after 3 fix rounds, and that this track's verification policy makes mutation proof mandatory for confinement boundaries.
- NOT read: `src/verbs/coordination/binding.mjs` or any other PROJECT_ROOT source. A read attempt on the main checkout was denied, which is consistent with the interpretation role — investigation belongs to the context investigator.

## The stated question

"Is the round-2 fix (`bindingSource === 'capability.prefer'` allowlist) a sufficient, durable structural closure, or does it leave the underlying exposure open for any FUTURE capability that also declares no `.prefer`?"

## The person's vocabulary (adopt, never correct)

confinement / unconfined executor · safety net (`readOnlyRedirects`) · fell through · silently pinning · reverse-mapping `capability.for` branch · deliberately declared with no `.prefer` · structural closure · durable · exposure · "the same shape that caused H4" · H4 / fix-round-2 / Unit I19 / Unit I21.

## Actual worry behind the question — confidence per inference

1. **Confident.** The worry is not "does H4 still reproduce" — I21 is integrated and the round-2 fix demonstrably re-routes the 8 panel actors. The worry is that the fix is an *allowlist on a string tag at the symptom site*, and the person wants to know whether the **class** is closed or only the **instance**.

2. **Confident.** The question bundles three separable properties and the person will accept different answers for each:
   - *sufficient* — H4's exact shape can no longer reach an unconfined executor;
   - *durable* — a future capability declared with no `.prefer` (I19's deliberate pattern) cannot re-open it without someone noticing;
   - *structural* — the guarantee lives at the layer that owns confinement, not at a resolver branch that happens to be patched.
   A "yes, yes, no" answer is plausible and would be useful; the panel should not collapse these into one verdict.

3. **Guess, and the guess matters.** The parenthetical "(the same shape that caused H4 in the first place)" reads as a person who already suspects the answer is "instance, not class" and wants that suspicion independently confirmed or refuted before opening a follow-up unit. This is closer to *seeking a check on a suspicion* than to *seeking ratification of the fix*. Reading that makes the person reasonable: they closed the live regression fast under fix-round pressure and are now asking, at leisure, whether the fast close is the right close. If the guess is wrong (they actually want the fix ratified as final), candidate answers of the form "open a follow-up unit" would be unwelcome and the panel should instead deliver "here is the test that locks it." The scout's evidence on whether a locking test already exists separates these.

4. **Guess.** The unstated fear is the failure mode where the *default* is the dangerous branch: capability resolution *chose* an executor and confinement was inferred from that choice, rather than confinement being asserted from the operation's declared mutation (`read-only`) independent of which executor was chosen. If that is how the code is shaped, then even `capability.prefer` is not a confinement guarantee — a `.prefer` that names an unconfined executor would be accepted — and the fix is a narrower allowlist over a gate that was never the right gate. This is the inference with the largest consequence; it is what "structural" in the question is really probing.

5. **Guess, lower weight.** The person may not have noticed a hidden cost of the fix: if the generic `review` capability (I19) now *never* resolves through capability binding because it has no `.prefer`, then I19's declaration is inert for this protocol and the safety net is doing all the work. That is safe but means the fix and I19's intent are in quiet tension. Not stated; flag for the scout, do not treat as a requirement.

## Altitude and burden

- **Altitude:** module/contract level — the boundary between capability resolution (`binding.mjs`) and dispatch confinement authority. Not a team or product bet. It touches the track's own locked direction that "no coordination action or template can bypass the resolved dispatch policy" and that CoordinationSession/dispatch, not skills or resolvers, own mutation gating.
- **Reversibility:** high. The fix is merged; the decision is whether a follow-up unit is owed. Nothing here needs to be undone.
- **Cost of being wrong in each direction:** calling it structurally closed when it is not leaves a silent, unconfined write/edit/bash path for advisory actors — and because fgOS is installed globally on other projects (mission #1), that exposure lands on projects the person does not control from this repo. Calling it insufficient when it is closed costs one unnecessary unit. Asymmetric: the person is right to ask.
- **Authority:** the person is the track owner; no authority uncertainty. The question is a DoD question (product priority #3), not a scope or authority question.
- **Already decided?** The fix itself is decided and shipped. What is open is *whether it is the last word*. Treat the fix as fixed and the follow-up as genuinely undecided.

## Genuine ambiguity — held open for the context investigator

Do not resolve these by inference; each separates candidate answers.

- **A. What does a non-`capability.prefer` resolution do now?** If every rejected source falls unconditionally to `readOnlyRedirects`, then "durable" is true for the no-`.prefer` shape by construction. If a rejected source can still reach some other resolution path, it is not.
- **B. Is confinement enforced anywhere downstream of binding?** If dispatch/confinement independently refuses a `read-only` operation onto an unconfined executor, H4 was a defense-in-depth failure and binding is not the sole gate. If not, binding *is* the sole gate, and "structural" is false regardless of how the allowlist is written.
- **C. Is `capability.prefer` itself confinement-checked?** A `.prefer` pointing at `xai`/`pi-cli-vantt` being accepted would mean the allowlist keys on provenance, not on safety.
- **D. Does a mutation-sensitive test lock this boundary?** The track's policy requires mutation proof for confinement boundaries. Its presence or absence changes the recommendation from "add the test" to "redesign the gate."
- **E. Was I19's no-`.prefer` declaration meant to be resolvable, or meant to be a requirement-only declaration?** Determines whether the fix silently retired I19's intent.

## What this interpretation deliberately does not add

No requirement to rewrite dispatch confinement, no requirement to change I19's capability, no claim that other protocols are affected. Those are candidate answers for later roles, not part of the person's ask.

## Status

Interpretation complete. Hand to context investigation with ambiguities A–E as the evidence targets.
