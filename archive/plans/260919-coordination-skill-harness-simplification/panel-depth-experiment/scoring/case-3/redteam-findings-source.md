# Red-team packet attack — I21 H4 exposure-closure ([REDACTED])

**Protocol verdict:** `INSUFFICIENT-EVIDENCE`  
**Claim `assessment.verdict`:** `inconclusive`  
**Role:** independent red-team (`red-team-packet`). Attack is on the packet and the panel's conduct, not on the architecture.

This is not a soft `REVISE`. The H4 honesty questions in the objective are **not proven**, and they are also **not shown false**. Collapsing that into `REVISE` would claim a panel failure I did not observe.

## What was opened (evidence scope)

Granted Context References in the dispatched prompt: **(none)**. `assignment.json` has `"contextRefs": []`.

The red-team template's own rule: evidence is scoped to exactly what `{contextRefs}` grants; never a path it does not name. Therefore **no sibling synthesis, critique, constraint-advocate, disposition, or shaper artifact was opened**. Hunting them would have been an isolation breach by this role, not diligence.

Opened because the dispatch itself named them, not as a substitute packet:

| Artifact | Why it is in scope |
|---|---|
| This assignment's `assignment.json` | Defines the empty grant and the primed objective |
| This run's `effective-execution-contract.json` | This dispatch's own executor/template record |
| `[REDACTED]/src/verbs/coordination/binding.mjs` | Absolute path named in the objective; read as instructed |
| This role's own prompt template (rendered into the user packet) | Operating instructions for this turn |

Not opened: any `synthesis.md`, critique, constraint findings, `dispositions.md`, other assignments' `runs/`, or ungranted evidence-directory prompt/run records of sibling roles.

## Attacks that landed

### A1. Red-team was asked to audit a packet that was not granted

**Claim under attack:** this `red-team-packet` turn can independently check whether synthesis weighed the critic, whether a driver disposition outran advisor evidence, whether isolation held, and whether cited evidence exists.

**Observation:** `contextRefs` is empty. The typical grant ("the evidence directory's own prompt and run records, when the driver has included them there") is absent. Without those files, every check that requires comparing advisor artifacts is mechanically impossible.

**Why this is process, not architecture:** the protocol makes red-team a post-synthesis attacker of the ledger. Dispatching the role with no ledger is ceremonial: it can only approve from narration (forbidden) or honestly stop.

**Settled by:** this assignment's own `contextRefs: []`. No further repository search required.

### A2. The driver placed advisor claims and a technical option into the red-team objective without granting the advisors' artifacts

**Claim under attack:** a driver must not decide or smuggle a technical question without an advisor's evidence; red-team must notice claims in the packet no advisor actually made.

**Observation:** the objective asserts, as if already in the ledger:

1. that the critic attacked a `confinementSensitive` flag as relocating the same human-judgment failure;
2. that the constraint-advocate ranked in a way that might have licensed dismissing that attack;
3. that a cheaper option (unbound/`readOnlyRedirects` unless `.prefer` **or** explicit `confinementSensitive: false`) may have been unproposed.

None of those advisor artifacts are in the grant. From this role's evidence contract, those are **driver-authored technical assertions**, not advisor evidence. Checking "did synthesis dismiss the critic" while the only source of "what the critic said" is the driver's prompt is exactly the failure mode the role exists to catch — except here it is in the dispatch of red-team itself.

**Not claimed:** that the critic never said this, or that the cheaper option is wrong. Those would require the withheld files. The landed fact is: this turn was primed to treat driver narration as the critic/constraint/synthesis record.

### A3. This turn was also pointed at source (`binding.mjs`) as if that could substitute for the packet

**Claim under attack:** red-team attacks the packet; the critic attacks the architecture. Checking artifacts, not narration.

**Observation:** the only PROJECT_ROOT file the objective names is `binding.mjs`. Reading it can describe current code. It cannot tell whether synthesis weighed a critic, whether isolation held, or whether an option was proposed. Using it to answer those questions would be **reviewing instead of attacking**.

`binding.mjs` was read as instructed. It is not treated as a Decision Packet.

## Attacks that failed / are not proven

Report at the same weight as landed attacks.

### F1. "Synthesis dismissed the critic's confinementSensitive attack because the constraint-advocate already agreed with a chosen option"

**Status:** **not proven.** Also **not shown false.**

No synthesis artifact, no critique artifact, no constraint-advocate ranking was granted. I will not infer dismissal from the driver's leading "or" in the objective.

**What would settle it:** grant the synthesizer's linked result and the critic's and constraint-advocate's linked results (paths in `contextRefs`), then compare whether the critic's attack is attributed, answered with evidence, carried as `unresolved`, or dropped because a ranking already matched a preferred option.

### F2. "A cheaper option existed that nobody proposed (default unbound unless `.prefer` or explicit `confinementSensitive: false`)"

**Status:** **not proven** as a panel omission.

Whether anyone proposed it is a fact about shaper/critic/synthesis artifacts I do not have. I refuse to convert an objective-suggested option into a finding that the panel missed it.

Reading `binding.mjs` (objective-named) shows there is **no** `confinementSensitive` identifier in that module, and unbound-unless-`capability.prefer` is already the H1/H4 fall-through in the committed comments and control flow. That is a **code observation**, not proof of panel conduct. Treating it as "the panel failed to propose the cheaper option" would be architecture review plus an unearned process claim.

**What would settle the process question:** the three proposals, the critique, and the synthesis, granted by path.

### F3. Isolation breach (a proposal referencing a sibling)

**Status:** **not proven.** No proposals granted.

### F4. Cited evidence that does not exist; claims no advisor made (inside the withheld packet)

**Status:** **not proven** against sibling artifacts. The only claims I can test are in this assignment's objective (A2).

### F5. Driver disposition of a technical question in `dispositions.md`

**Status:** **not proven.** `dispositions.md` was not granted. A2 is about this objective text, not about a disposition file I have not seen.

### F6. Confidence in a synthesis that outruns its support

**Status:** **not proven.** No synthesis granted.

### F7. This run's `executorId: "[REDACTED]"` (cli-spawn) versus the architecture-advisory roster's declared red-team executor

**Status:** **observed in this run's contract, not used as proof that H4 is unclosed in the panel packet.**

`runs/01/effective-execution-contract.json` records `"executorId": "[REDACTED]"`, `"adapter": "cli-spawn"`. The architecture-advisory skill's red-team row names `codex-bwrap` and a family off the synthesizer. That mismatch is a **this-dispatch** roster fact. I do not have the session's `actors[]` / `fgos coordination show` output in `contextRefs`, so I will not upgrade it into "the panel violated diversity" or "H4 still binds advisory actors onto [REDACTED]." It is recorded so a driver with the real session ledger can check it; it does not change the protocol verdict.

## What `binding.mjs` was used for (and not)

Read in full, as the objective required.

- It is a pure `bindOperations` module. Comments document H1 (refuse literal executor-id as capability resolution) and H4 (refuse `capability.for` / `decide --for` orphan fallback; leave unbound so `minTier` / `readOnlyRedirects` remain the safety net).
- Current control flow: if `!resolved.configured || resolved.bindingSource !== 'capability.prefer'`, the actor is left `bindingSource: 'unbound'` with empty `cliPolicy`.
- No `confinementSensitive` flag appears in the file.

That is the named source, not a panel ledger. It does **not** answer whether the synthesizer weighed the critic. It is not an APPROVE of the recommendation.

## Verdict rationale

| If I had said | Why that would be dishonest |
|---|---|
| `APPROVE` | Ceremonial: no Decision Packet, no sibling run records, no dispositions. Approving honesty I did not inspect. |
| `REVISE` | Would treat F1/F2 as panel defects. They are **not proven**. Empty grant is a dispatch defect that **prevents** inspection; it is not itself proof that synthesis dismissed the critic. |
| `INSUFFICIENT-EVIDENCE` | Matches the evidence contract. The H4 honesty question cannot be settled from what was granted. |

Landed attacks A1–A3 are why the verdict is insufficient, not a hidden `REVISE` of I21.

## What a successor dispatch must grant before this role can give `APPROVE` or `REVISE`

Minimum `contextRefs` (paths, not summaries):

1. Synthesizer linked result for the I21 H4 question (recommendation + how critic/constraint inputs were weighed).
2. Architecture-critic linked result (the confinementSensitive / human-judgment attack, in the critic's words).
3. Constraint-advocate Phase-6 findings (the ranking the objective says may have licensed dismissal).
4. Driver `dispositions.md` if any finding on this question was closed.
5. The three shaper proposals, if "nobody proposed X" is still in scope.
6. Optionally this session's replay (`coordination show --json`) if roster/diversity/authorization is in scope.

Until those exist in the grant, another red-team turn that answers F1/F2 from source or from the driver's paraphrase should itself be attacked.
