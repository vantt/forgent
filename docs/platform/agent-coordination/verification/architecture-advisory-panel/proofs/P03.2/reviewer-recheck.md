# Cell P03.2 — Reviewer Recheck (Fix Round 1)

Recheck of the Doer's response to R1-R3 (`556e5bf9` fix, `38bea45e` docs).
Each fix verified independently against the code and by live execution; the
Doer's `doer-fix-round-1-report.md` claims were not taken on trust. R4-R8 were
accepted as out of scope by the Lead and are not revisited here.

**Verdict: 3/3 fixed, 0/3 not fixed, 0/3 partial.** One disclosed deviation on
R3 is technically justified — I verified the Doer's stated reason from source
and it is correct.

## Scope guard: the fix commit changed nothing it should not have

`git diff 556e5bf9~1..556e5bf9` touches exactly two files. Filtering the YAML
diff to non-comment lines returns **empty** — the change to
`architecture-advisory-panel-v1.yaml` is comment-only, so no operation,
binding, window, actor, or role was altered while correcting the header. Both
`maxInvocations: 2` declarations remain in place (lines 518 and 523). No
accidental cap removal was left behind.

## R1 — stale YAML header: FIXED

`architecture-advisory-panel-v1.yaml:135-159` now states, accurately:

- the mechanism by name and value — `SAFE_ID_RE` (`/^[A-Za-z0-9_-]+$/`) admits
  no colon;
- all three ref fields — an `authorize` step's `grantedContextRefs`, a
  `disposition` step's `targetRef`, **and** a `disposition` step's
  `evidenceRefs`;
- **both** reserved namespaces, `human-turn:` and `contribution:`;
- scope: "in EVERY ref field, for EVERY protocol";
- an explicit retraction of the wrong claim ("not merely `grantedContextRefs`,
  and not merely 'unchecked'").

All of this matches what I verified independently last round
(schema.mjs:29 for the regex; :337, :363, :374 for the three application
sites; live probe refusing both namespaces in all three fields).

The refused path is no longer described as an intended step. The header now
ends "never a `disposition` step citing the turn, and never a
`grantedContextRefs` entry naming it", and correctly identifies the
`authorize` step's free-text `reason` as the only channel available today.

Citations check out as real, not decorative:

```
tsk-44p  status: todo  "src/verbs/coordination/schema.mjs's assertSafeRefOrId refuses ANY…"
tsk-3xk  status: todo  "No specialist-authorize request-step type exists for fgos coordination run (the…"
```

`tsk-3xk` is correctly cited at the sibling specialist-gap paragraph
(lines 77-84), not conflated with the charset gap.

## R2 — `revise-explanation` coverage: FIXED, falsification reproduced independently

A real test now exists: `over-cap reopen (explanation): revise-explanation
admits exactly 2 invocations (activation.maxInvocations) and refuses the 3rd`
(conformance file lines 703-821). It drives the full chain to a settled
explanation, then:

- authorizes and dispatches `revise-explanation` twice, asserting
  `appended === true` on each authorization;
- asserts `reviseExplain1Id !== explainId` — a genuinely new Assignment, not a
  retry of the original;
- asserts the third authorization is rejected with `/maxInvocations/`, and that
  the refusal writes **zero** new events;
- asserts via `replaySession` that all three Assignments (original + both
  reopens) coexist distinctly.

I did not rely on the Doer's claim that this is not a phantom. I ran the
falsification myself.

Baseline checksum before touching anything:
`dbd8b6abfd145a6ad4b7e152f2a628ca`, working tree clean.

Removed `maxInvocations: 2` from the `revise-explanation` binding only, then
ran the whole conformance file:

```
✖ over-cap reopen (explanation): revise-explanation admits exactly 2 invocations
  (activation.maxInvocations) and refuses the 3rd
  AssertionError [ERR_ASSERTION]: Missing expected rejection: activation.maxInvocations: 2
  must refuse a third authorization of revise-explanation …
    operator: 'rejects'

ℹ tests 13
ℹ pass 12
ℹ fail 1
```

Two things this proves at once. First, the new test genuinely guards the cap —
it fails, for the right reason, the moment the cap is gone. Second, **exactly
one** test fails and the other twelve still pass, which independently
re-confirms the original R2 finding: before this fix the cap was guarded by
nothing at all.

Restored and verified byte-identical:

```
md5sum → dbd8b6abfd145a6ad4b7e152f2a628ca   (matches baseline)
git status --porcelain → empty
```

## R3 — weak predicates: FIXED; the disclosed deviation is technically justified

Both class-only predicates are now pinned to real messages:

- specialist negative arm (line 566):
  `/is bound to specialist slot "specialist-answer-slot" -- no specialist is currently authorized/`
  — this string is produced only by the slot gate
  (session-engine.mjs:1044 and :1062), so the test can no longer pass on a
  missing-authorization error;
- never-recorded human turn (line 974):
  `/names human turn "turn_never_recorded", which coordination session ".*" never recorded/`
  — confirmed present at store.mjs:1200.

**On the deviation.** The Doer did not restructure the negative arm to
"authorize the operation but not the slot", and says that shape is
unconstructible. I verified this from the call sites rather than accepting it:

`authorizeDeclaredOperation` builds `specialistBindings` the same way
`dispatchDeclaredOperation` does and passes them to the **same** resolver —
`resolveDeclaredOperationActor(definition, operationId, targetActorId,
specialistBindings)` at session-engine.mjs:1889, mirroring :2357 in dispatch.
That resolver raises the unbound-slot `CoordinationError` at :1040-1044 during
actor resolution, before `authorizeDeclaredOperation` reaches its activation
mode check or writes any event. So an `operation-authorized` event for
`unbound-specialist` cannot exist while the slot is unauthorized: the authorize
door refuses first, with the identical message.

The Doer's reason is correct, and my original R3 recommendation was not
achievable as literally written. Message-pinning is an acceptable substitute
here because it achieves the same protective goal — the test can now only pass
for the specific reason its name claims. Deviation accepted.

Incidental, **not** a P03.2 finding and no action asked: the shared resolver
hardcodes the prefix `dispatchDeclaredOperation:` into that message even when
it is thrown from the authorize door. Pre-existing in `resolveDeclaredOperationActor`,
untouched by this cell, and it does not weaken the pin.

## Tests

Focused suite, exit code captured from an un-piped run:

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'

ℹ tests 757
ℹ suites 0
ℹ pass 757
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14710.300768
[exited with code 0]
```

757/757 as expected — exactly one more than the 756 I measured in round 1,
matching the single added test.

Pre-existing conformance suites re-run individually, all green, no regressions:

```
coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs  pass 3  fail 0
coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs pass 8 fail 0
coordination-nominal-group-lite.test.mjs                               pass 3  fail 0
coordination-group-thinking-nominal-group-lite-pack.test.mjs           pass 6  fail 0
flow-definition-standalone-master-coordination-loop.test.mjs           pass 8  fail 0
coordination-launch-master-loop.test.mjs                               pass 16 fail 0
coordination-group-thinking-pack-registration.test.mjs                 pass 8  fail 0
coordination-architecture-advisory-panel-conformance.test.mjs          pass 13 fail 0
```

## Result

| id | original severity | status |
|----|-------------------|--------|
| R1 | medium | Fixed — header now matches the code; tsk-44p/tsk-3xk exist and are correctly placed |
| R2 | medium | Fixed — real test; falsification independently reproduced (1 of 13 fails without the cap); YAML restored byte-identical |
| R3 | medium | Fixed — both predicates pinned; the one deviation is technically justified and accepted |

No new findings. No regressions. Nothing in the fix commit exceeded its scope.

## Unresolved questions

None blocking. `tsk-44p` and `tsk-3xk` are now filed and `todo`, so the two
request-schema/step-vocabulary gaps have an owner outside this cell.
