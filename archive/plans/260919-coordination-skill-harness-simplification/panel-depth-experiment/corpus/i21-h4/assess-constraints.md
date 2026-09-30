# assess-constraints (real, asgn_i27_driver_op_011)

## Dispatched objective (verbatim)

Finalize the risk ranking across all three proposals (kernel hardening; stricter doctor check; do-nothing-further), incorporating the critic's own attack on the kernel-hardening option. State which option you'd actually ship first, and why. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Risk ranking from riskiest to least risky: (1) kernel hardening, which is the only option with an irreversible edge: if it changes any record shape written to the JSONL source of truth, a rollback cannot undo the records written in the meantime, and each one would need manual reconciliation. That is the concern that sinks it. Cheapest fix: the reader accepts both old and new shapes before merge. (2) do nothing further: no migration risk, but the failure can keep recurring with no detection and nobody owns it. (3) stricter doctor check: fully reversible, writes no state, clear owner. Its only failure mode is false positives blocking healthy installs, which is fixed by shipping at warn severity. Ship first: the doctor check at warn severity. It measures how often the failure actually happens, and that decides whether kernel hardening's irreversible edge is worth taking. Kernel hardening second, only with the dual-shape reader. LIMITATION: the critic's attack on kernel hardening was not included in the brief, and no context refs were granted, so it was NOT incorporated and not guessed at. Kernel hardening is ranked on its worst-case path until that attack is available.",
  "evidenceRefs": [
    ".fgos/assignments/asgn_i27_driver_op_011/runs/01/agent-report.md"
  ]
}
```

## Real agent-report.md (verbatim)

# Constraint Findings: Final Risk Ranking (asgn_i27_driver_op_011)

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
