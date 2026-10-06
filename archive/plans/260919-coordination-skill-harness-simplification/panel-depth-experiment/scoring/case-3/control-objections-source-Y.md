# Critique — kernel hardening vs H4 (architecture-critic, [REDACTED])

## Evidence read
- `src/verbs/coordination/binding.mjs` (worktree copy, `unit/I27`). I could not read the main-checkout path because permission was denied. Bash/grep was denied too.
- `src/runner/dispatch/resolve.mjs:260-400`, `.fgos/config.json:25-134`, `core/coordination-protocols/[REDACTED].yaml:180-400`.
- Finished reports for op_005 (lead), op_006 (scout), op_007 (system shaper), op_008 (alternative shaper) and op_009 (constraint advocate). The packet's own "Granted Context" says `(none)`, but the driver request grants op_005–009. I relied on the request's grant and am recording the mismatch here.

## Attack 1 (decision-relevant): the `confinementSensitive` flag would NOT have prevented H4. It also does not relocate the failure to I19's author. It targets a failure that never happened.

The premise under test is "I19's author could mark it `false` by mistake". The config refutes it. `.fgos/config.json:59-69` shows the `review` capability, authored in I19, **already declares** `confinement: {mode: "required", policy: "host-write-denied"}`. The human stated the sensitivity correctly. H4 happened because **no code read that declaration**:
- `deriveOperationCapability` (binding.mjs:89-109) never reads `.confinement`.
- Branch 3 of `resolveExecutorAndOverrides` (resolve.mjs:301-303) matched `[REDACTED].for:["review"]` and bound to [REDACTED]'s first CLI invocation (resolve.mjs:391-393), which is unconfined.

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

---

# Constraint Findings: Final Risk Ranking ([REDACTED])

Role: constraint-advocate. Mutation: read-only. Granted context refs: **none**.

## Input limitation (read first)

The brief says to incorporate "the critic's own attack on the kernel-hardening option," but that attack text was not in the brief and no context ref was granted. I did not open any path, so I have not seen the critic's argument. I did not reconstruct it or guess at it. The ranking below comes only from the structure of the three options as named. Where the critic's attack could change a finding, I say so.

I also had no granted evidence on how often the underlying failure happens, which kernel surface is involved, or whether persisted state is touched. So each magnitude below is stated as a condition ("if X, then Y"), not as a measured number.

## Per-proposal findings

| # | Proposal | Where risk actually lives | Reversible? | Magnitude (conditional) | Owner afterward |
|---|----------|---------------------------|-------------|-------------------------|-----------------|
| A | Kernel hardening | Every caller of the hardened path, because it changes runtime behavior on the shared core. The sharp edge is any change to what gets **written** (event/JSONL shape, state transitions). Under L3, JSONL is the truth, so records written in a new shape cannot be un-written by reverting the code. | **Code: reversible (git revert). Persisted writes in a new shape: IRREVERSIBLE** once any real session writes them. | If it only tightens validation on read or dispatch: moderate. A revert fixes it and the worst case is refused operations until the revert lands. If it changes written shape: every record written between deploy and rollback must be reconciled by hand. | The kernel owner. This is the only option whose owner has to exist *and* be available during the rollback window. |
| B | Stricter doctor check | `fgos doctor` check registry only. It is diagnostic and makes no state writes. Its failure mode is **false positives**: a check set to fail blocks setup or CI on machines that are actually healthy, including projects outside this repo that use the global install (mission #1/#2). | **Fully reversible.** It is one check-registry entry plus a severity level. | If it ships at fail level with a wrong predicate, every downstream project that runs doctor is blocked until a release goes out. If it ships at warn level, the worst case is noise. | The doctor/setup registry. The owner is clear and the change is small. |
| C | Do nothing further | No migration and no blast radius. The risk is **silent recurrence** of whatever failure prompted A and B, with no detection. | Reversible: A or B can still be picked up later. But the cost of each recurrence accumulates and cannot be recovered. | Unknown: I had no granted evidence on how often it recurs. If recurrence is rare and loud, C is acceptable. If it is silent, C is the riskiest option over time, because nobody learns it is happening. | Nobody. That is itself the finding: C has no owner for the failure it leaves in place. |

## Ranking: riskiest first

1. **A: kernel hardening.** This is the only option that has a path to an irreversible step: persisted writes in a changed shape. It also has the widest blast radius, because it is shared core code. **This is the concern that sinks A if left unaddressed:** if A changes anything that gets written to the JSONL truth, a rollback cannot restore consistency without manual reconciliation of every record written during the window. The critic's attack is exactly the input that could move A up or down. If the critic showed A touches written shape, A's risk is confirmed and severe. If the critic showed A is read-side or validation-only, A drops to moderate and reversible. I could not see the attack, so I left A at #1 on its worst-case path.
2. **C: do nothing further.** It has no immediate risk, but it has an unowned, undetected recurrence risk. It ranks above B because B at least produces detection and C does not.
3. **B: stricter doctor check.** It is lowest risk: fully reversible, no state writes, and it has a clear owner. Its one real failure mode, false positives blocking healthy installs, has a cheap mitigation that can be done in an afternoon (below).

## Cheapest mitigations that survive (each doable in an afternoon)

- **A:** Before merging, make the reader accept **both the old and the new record shapes**. If A turns out not to change written shape, add a test that asserts that, so a later edit cannot quietly add a new shape. This turns the irreversible step into a reversible one, because a revert still reads everything written during the window. Do not use "we'll be careful during rollout" as the mitigation. That is a process promise, not an engineering control.
- **B:** Register the check at **warn** severity, not fail. Moving it to fail later is a one-line change, made once real doctor runs show zero false positives. The check's predicate gets a test against a known-healthy fixture.
- **C:** Not applicable by definition. The only cheap mitigation for C is B, which is the argument for B.

## What I'd ship first

**B, at warn severity.** It is the only option that is fully reversible, has a clear owner, has no migration, and makes no state writes. It also produces the evidence the panel is currently missing: how often the failure actually occurs, which decides whether A is worth its irreversible edge at all. That makes B the step that reduces uncertainty before any irreversible choice is made. **A comes second**, and only with the dual-shape reader in place. C is not a "ship"; it is what we would be choosing by default if B is not done.

## Unresolved questions

- What did the critic's attack on A actually establish? It was not granted to this assignment. It is the single input most likely to change A's magnitude.
- Does A change any persisted or written record shape? That is the reversible/irreversible pivot for the whole ranking.
- How often does the underlying failure recur, and is it loud or silent? That decides whether C is acceptable. No evidence was granted.
