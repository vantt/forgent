# Runtime Recovery - Concrete Next Steps

**Purpose:** turn the panel feedback and adjusted design into an executable
sequence. This file does not authorize source changes by itself.

## Gate 0 - Freeze The Accepted Shape

**Owner:** design lead  
**Status:** done

Read and accept these as the current design authority:

- `architecture-decision-lock.md`
- `detailed-design.md`
- `phase-designs/*.md`
- `architecture-panel-adoption-and-rebuttal.md`
- `design-audit-final.md`

Do not use the panel's original candidate as a second competing design. Its
accepted corrections are incorporated into the files above.

## Gate 1 - Close Static Contract Gaps

**Owner:** design lead, no source mutation  
**Output:** [static-contract-closure.md](static-contract-closure.md)

Perform these repository checks and record file/symbol evidence:

1. Confirm every Assignment-shaped launch reaches `executeAssignment`.
2. Confirm the standalone attempt allocation race at
   `assignment-runner.mjs` and the exact lock/log path that P01 will pass to
   `withEventsLock`.
3. Enumerate every reader of `run.json`; prove whether v2 fields can be absent
   without changing settlement/admission semantics. If not proven, retain the
   v2 fail-closed boundary.
4. Confirm the existing `coordination run` vocabulary cannot target a
   standalone admitted, unsettled Run. This fixes the recovery door in the
   `dispatch` family rather than adding coordination authority.
5. Enumerate consumers of `visibility.json` and prove it remains binding
   evidence rather than Run authority. Do not introduce a parallel
   `handle.json` in the first profile.
6. Confirm whether same-Assignment speculative concurrent attempts are a
   supported behavior. If yes, stop and revise the one-active-Run invariant;
   if no, record the invariant as an explicit product rule.

**Gate:** no claim remains “unchecked” when P01/P04 is marked ready; F6 is
closed negatively and documented.

## Gate 2 - Define The Node Admission Contract

**Owner:** P01 design owner  
**Output:** revise `phase-designs/run-admission-and-fencing.md`

Write the exact algorithm against the repository primitive:

- lock path and critical-section boundary;
- Assignment version read and retry tuple comparison;
- exclusive attempt directory creation;
- `run.json` v2 schema and legacy read behavior;
- generation allocation and settlement fence;
- session `run-retried` ledger versus standalone Run-file authority;
- crash rows before/after create and before/after result.

**Gate:** P01 has one owner, one lock primitive, one identity tuple and
executable tests for both session and standalone callers.

## Gate 3 - Probe Herdr Before Any Replacement Launch

**Owner:** Herdr adapter owner  
**Output:** `herdr-reconciliation-probe.md` plus fixtures

Probe and record:

1. `agentGet(name)` for never-created name;
2. `agent start` on an existing name: source and conformance tests already
   settle this as reject (`agent_name_taken`); retain a live smoke probe only
   as regression evidence;
3. resource survival after gateway restart;
4. same conversation/session correlation with a new worker process/resource
   incarnation;
5. crash after create and before locator persistence;
6. closed resource/no-resurrection behavior.

**Gate:**

- reattach/observe/park can proceed if matching identity is provable;
- replacement launch stays disabled unless gateway returns an authoritative
  `absent-proven` or equivalent;
- no code path treats a name lookup miss as absence.

## Gate 3L - Close Local CLI Spawn Contract

**Owner:** P02L design owner, no source mutation  
**Output:** [phase-designs/cli-spawn-local-contract.md](phase-designs/cli-spawn-local-contract.md)
and [cli-spawn-review-resolution.md](cli-spawn-review-resolution.md)

The P02L independent review found that the supervisor direction is necessary
but the handoff lacked several exact contracts. Close them without adding a
generic manager:

1. protected proof paths are outside the worker write grant;
2. the launch envelope contains the fully resolved invocation and execution
   options;
3. the adapter receipt preserves current `cliSpawnAdapter` timeout,
   idle-timeout, maxBuffer, `onChunk` and `close` semantics;
4. the controller persists the evaluator baseline before launch;
5. Confinement Authority cleanup/finalization is recoverable after coordinator
   death;
6. recovered destructive cancel and shared-cwd mutating takeover remain typed
   unsupported until their own proof exists.

**Gate:** completed at design level. P02L has one canonical local contract and
Astra final re-review returned `READY_WITH_NON_BLOCKING_NOTES`; the low note was
folded into the contract.

## Gate 3H - Close Herdr Bwrap Worker-Command Seam

**Owner:** P02H design owner, no source mutation  
**Output:** [phase-designs/launch-reconciliation.md](phase-designs/launch-reconciliation.md)
and [phase-designs/confinement-adapter-contract.md](phase-designs/confinement-adapter-contract.md)

Close Herdr against the same Confinement Authority boundary without making Herdr
Run truth:

1. Authority prepares one `authority-prepared-invocation.v1`;
2. Herdr starts exactly that prepared worker command, including bwrap argv when
   required;
3. full Herdr start request digest remains separate from worker-command/env
   digest;
4. provider-kind-only Herdr launch cannot claim enforced bwrap;
5. result settlement still comes from worker outbox plus adapter receipt;
6. deterministic-name absence parks until Herdr has authoritative
   `absent-proven`.

**Gate:** completed at architecture level. Implementation must add/prove the
Herdr arbitrary-worker-command seam; automatic replacement launch remains gated.

## Gate 4 - Close Effect And Recovery Read Contracts

**Owner:** P03/P04 design owners  
**Output:** revise S3/S4 briefs and traceability

1. Specify the effect attestation object and three branches:
   network allow -> park; undeclared sink -> park; provider-only filtered ->
   eligible only with declared duplicable telemetry.
2. Specify `recover` as an ephemeral recommendation whose apply echoes
   snapshot, control epoch and single-use action key.
3. Verify close-after-steps is not reachable from the recovery path.
4. Record typed outcomes and schema-1 parity cases.

**Gate:** P03/P04 do not introduce an effect ledger or plan-token authority.

## Gate 5 - Independent Design-Panel Recheck

**Owner:** architecture panel  
**Input:** all artifacts from Gates 1-4, including Gate 3L  
**Output:** revised panel recommendation and readiness matrix

Ask the panel only to verify closure, not reopen settled architecture unless
it presents direct source contradiction. Required checks:

- standalone admission is actually covered;
- generation/incarnation remain intact;
- S2 readiness is split between reattach and replacement launch;
- no accidental new authority or abstraction appeared;
- every READY label has owner, port, crash path and proof.

**Gate:** panel returns either `READY FOR IMPLEMENTATION` per phase or a typed
external dependency. No generic verdict.

## Gate 6 - Code-Panel Wave Authorization

Only after Gate 5:

1. Open P00 baseline fixture first.
2. Open P01 and P04 in parallel only if their leases remain disjoint.
3. Open the shared Confinement Authority prepared-invocation seam, then P02L
   for default `cli-spawn`; open P02H for Herdr bwrap launch afterward.
   P02H is architecturally ready for first launch/observe/park with the
   Authority-prepared command; implementation must add/prove Herdr
   arbitrary-worker-command start. Automatic replacement still waits for
   `absent-proven`.
4. Open P03 after its inputs are present; no blind fallback retry.
5. Keep P06 disabled and P07 blocked until their named contracts land.
6. Run P08 closeout only after capability evidence matches the matrix.

The original Gate 5 exposed A01-A08 in Astra review. Two focused delta rounds
closed them at design level. The later default-adapter review opened P02L; Gate
3L records the now-ready local contract. Gate 3H records the Herdr bwrap worker-
command seam. No code-panel cell is authorized until the person explicitly lifts
the hold.

## Decision Requests To The Person

Current count: **zero**. The only potential future product decision is whether
same-Assignment speculative concurrent attempts are a supported behavior. The
design lead must first inspect the repository and ask only if source evidence
cannot settle it.
