# critique-proposals (real, asgn_i27_driver_op_010)

## Dispatched objective (verbatim)

Attack the strongest proposal on the table (kernel structural hardening in binding.mjs, per shape-system-proposal). Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs first (absolute path). Specifically stress-test: would a `confinementSensitive` flag actually have prevented H4, or would `review`'s author (Unit I19) simply have marked it `false` by mistake or omission -- meaning the new flag just relocates the same human-judgment failure one field over rather than closing it? Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "A confinementSensitive flag would not have prevented H4, and it does not shift blame onto the I19 author either: config.json:59-69 shows I19 already declared review.confinement.mode=required correctly. H4 happened because no code read that declaration (branch 3 of resolve.mjs, capability.for). The flag's real hazard is its default when absent. A flag-gated rule fails open when someone leaves it out, while binding.mjs:268 today fails closed for every capability. The flag is also redundant for branch 3 and duplicates confinement.mode. So reject it. The attack that flips the recommendation targets the strongest proposal, the system shaper's (op_007) confinement-aware prefer filter. That filter also keys on a capability-side marker that authors must opt into. A capability with no confinement block and a bare prefer (e.g. code:test, prefer:\"claude\") would still bind an advisory/read-only operation to the unconfined first CLI invocation, the E4+E5 residual. Recommended change: trigger the predicate on the operation's effective mutation class (result.kind advisory implies Mutation: read-only) OR capability confinement.mode=required. Two attacks held: line 268 does close the H4 class for all capabilities, and the shaper's reasons for rejecting the flag are sound. Still to settle: F1 (execution-time re-resolution by capability name) is load-bearing for every option and is unread, and it is also unknown where the Mutation class is derived and whether bindOperations can see it. System-shaper F4 cannot really be tested from this repo, so treat it as an opinion.",
  "evidenceRefs": [
    "src/verbs/coordination/binding.mjs:89-109,268-311",
    "src/runner/dispatch/resolve.mjs:266-305,380-393",
    ".fgos/config.json:59-69,119-126",
    "core/coordination-protocols/architecture-advisory-panel-v1.yaml:188-191,336-397",
    ".fgos/assignments/asgn_i27_driver_op_010/runs/01/agent-report.md"
  ]
}
```

## Real agent-report.md (verbatim)

# Critique — kernel hardening vs H4 (architecture-critic, asgn_i27_driver_op_010)

## Evidence read
- `src/verbs/coordination/binding.mjs` (worktree copy, `unit/I27`). I could not read the main-checkout path because permission was denied. Bash/grep was denied too.
- `src/runner/dispatch/resolve.mjs:260-400`, `.fgos/config.json:25-134`, `core/coordination-protocols/architecture-advisory-panel-v1.yaml:180-400`.
- Finished reports for op_005 (lead), op_006 (scout), op_007 (system shaper), op_008 (alternative shaper) and op_009 (constraint advocate). The packet's own "Granted Context" says `(none)`, but the driver request grants op_005–009. I relied on the request's grant and am recording the mismatch here.

## Attack 1 (decision-relevant): the `confinementSensitive` flag would NOT have prevented H4. It also does not relocate the failure to I19's author. It targets a failure that never happened.

The premise under test is "I19's author could mark it `false` by mistake". The config refutes it. `.fgos/config.json:59-69` shows the `review` capability, authored in I19, **already declares** `confinement: {mode: "required", policy: "host-write-denied"}`. The human stated the sensitivity correctly. H4 happened because **no code read that declaration**:
- `deriveOperationCapability` (binding.mjs:89-109) never reads `.confinement`.
- Branch 3 of `resolveExecutorAndOverrides` (resolve.mjs:301-303) matched `xai.for:["review"]` and bound to xai's first CLI invocation (resolve.mjs:391-393), which is unconfined.

So H4 was a **consumer-side** failure: a declaration existed and was ignored. It was not an **author-side** judgment failure. Adding a second marker that means the same thing as `confinement.mode` changes nothing on the side that failed. A new flag is only as good as the code that reads it, and the existing marker was not being read.

The flag does carry a real hazard, but in a different place from the one the objective proposes. The flag's value is not the risk. Its **default when absent** is. The rule would be "refuse the orphan fallback only when `confinementSensitive: true`". With that rule, every capability authored without the flag fails **open**. Line 268 today fails **closed** for every capability, whether or not it is sensitive (scout §3, shaper E3). A flag-gated rule therefore makes things *worse* on the omission path, unless it keeps line 268 unconditional. If it does keep line 268, the flag adds no coverage for branch 3.

**Verdict on the objective's hypothesis:** half right. The flag does rest on author judgment, but H4 shows the author's judgment was correct. The real risk is **omission, not mis-marking**, and the flag's default decides how omission plays out. For branch 3 specifically, the flag is redundant and cannot improve on what line 268 already does.

## Attack 2 (the one that flips the recommendation): the system shaper's actual proposal fails the same omission test

The strongest proposal on the table (op_007) does **not** add the flag. The shaper already dropped it, for the reasons in Attack 1. What it proposes is a confinement-aware `prefer` filter, keyed on `capabilities.<name>.confinement.mode === 'required'`. That predicate is still **opt-in by the capability author**. It stays silent for any capability that has no `confinement` block.

A concrete residual in the real config: `code:test` (config.json:119-126) has `prefer: "claude"` as a bare string and no `confinement` block. Suppose a future read-only / advisory protocol operation declares `policy.capability: "code:test"`, or derives to a capability shaped like it. Line 268 accepts it, because the binding source is `capability.prefer`. The shaper's predicate does not fire. `preferInvocation` is omitted (binding.mjs:311). Dispatch then takes the first CLI invocation, `claude-cli` with acceptEdits (shaper E5). That is the "declared prefer lands unconfined" residual the shaper itself identified (E4+E5), and it is reached through omission.

In short, both the flag and the shaper's predicate put the confinement requirement on the **capability** side, which depends on each author remembering to set it. The fact that actually needs confinement lives on the **operation** side. Every operation in this protocol declares `result.kind: advisory` (yaml:336-397). This very packet's effective execution contract reads `Mutation: read-only` for such an operation. That means the kernel already derives a read-only mutation class that does not depend on any capability author.

A structural closure should key the "must bind to a confined invocation, or stay unbound" predicate on the **operation's effective mutation class** (read-only). The capability `confinement.mode` should be an additional trigger, not the only one. That closes the omission path for every future capability, with nothing new to author. This is also inference #4 from the lead advisor (op_005): confinement should be asserted from the operation's declared mutation, not inferred from which executor was chosen.

**What would settle it:** find where the effective-execution-contract `Mutation` field is derived. I could not do this because grep was denied. Candidates are `session-engine.mjs` and `assignment-runner.mjs`. Then confirm it is available to `bindOperations` as pure input. If it is derived only after binding, or only from something the binder can't see, the proposal needs that value threaded into `facts`. That is still cheap, but it is a contract change.

## Attacks that held (reported at equal weight)
- **Line 268 closes branch 3 for every capability.** I attacked this and it held. binding.mjs:268 is sensitivity-blind and fails closed. H4's exact shape (no `.prefer`, a matching `for:`) cannot reach an unconfined executor through `bindOperations`. Scout, system shaper and constraint advocate agree, and the source confirms it.
- **The shaper's rejection of the flag (duplicate marker, RUL11 drift, migration of 13 entries)** held. The config confirms `confinement.mode` already exists on 4 capabilities.

## Attack on the shapers' falsification criteria
- **System shaper F4** ("a real consuming project deliberately names an unconfined invocation for a required-confinement capability") is close to unfalsifiable from this repo, since other projects' configs are not visible here. The shaper says so. Treat it as an opinion-grade risk, not a test.
- **System shaper F3** is real and cheap: it is one pure unit test. Run it before anything else.
- **F1 appears in both the system and alternative shapers' criteria**: dispatch-time re-resolution by capability name, per binding.mjs:18's "a real dispatch re-resolves at execution time". This is the load-bearing unknown for **every** option, not just one of them. If F1 lands, neither the binding predicate nor a doctor check is enough, and the guard moves into resolve.mjs. It is a 30-minute read. Nobody has done it yet, including me, because grep was denied.
- **Constraint advocate:** the `required`-diversity fail-open (binding.mjs:128-131, 145-148, 202) is a real, separate finding. It is not H4. It should not be merged into this decision, but it should not be lost either.

## Net
- The `confinementSensitive` flag: reject. It is redundant for branch 3, fails open when omitted, and duplicates `confinement.mode`.
- System shaper's predicate: directionally right. Change its trigger to "operation effective mutation is read-only **OR** capability `confinement.mode` is required", so author omission cannot re-open the E4+E5 residual.
- Order of work:
  1. Resolve F1.
  2. Locate where the mutation class is derived.
  3. Land the pure predicate with the shaper's 4 tests, plus one for `code:test`-shaped omission.
  4. Add the doctor check (alternative shaper, which covers derived capabilities) as the visibility layer.

## Unresolved questions
- Where is `Mutation: read-only` in the effective execution contract derived, and can `bindOperations` see it before dispatch?
- F1: does execution-time re-resolution pass a capability name to `resolveExecutorAndOverrides`?
- Does main's `binding.mjs` differ from `unit/I27`'s? I could not read main.
