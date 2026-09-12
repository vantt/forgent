# Static Contract Closure - Gate 1

**Date:** 2026-09-12  
**Scope:** source-only verification before Herdr live probe

## Findings

### Assignment launch surface

The repository has one session-engine call to `executeAssignment` at
`src/runner/coordination/session-engine.mjs:311-312`. The dispatch CLI and
operation-choice paths also call `executeAssignment` directly (the architecture
tests enumerate these postures). Therefore the admission helper must live
inside `executeAssignment` or a function it calls; locking only the session
ledger would leave direct callers unfenced.

### Current race

`src/runner/dispatch/assignment-runner.mjs:811-827` computes max attempt from
directory state, loops on `existsSync`, then calls recursive `mkdirSync`.
Recursive create does not provide exclusive admission. This confirms the
panel's shared HIGH finding. The final design replaces this with an append-only
generation guard and complete staging-directory atomic rename; it never exposes
an empty final attempt directory.

### Existing lock primitive

`src/state/events.mjs` provides `withEventsLock`, but Astra's delta audit proved
its reread/unlink reclaim and unconditional release can delete a successor lock.
It remains evidence of current behavior, not the recovery primitive. P01 owns
the append-only generation/release-marker implementation already required by
`runtime-recovery-design.md` section 6; no generation record is unlinked.

### Run readers and version boundary

`run.json` is read by `visibility-session.mjs`, `show-run.mjs`,
`session-engine.mjs` result-linking code and numerous tests. The static search
does not yet prove that every reader ignores unknown fields. The design
therefore keeps `assignment-run.v2` and fail-closed recovery for legacy v1
records until a reader-by-reader audit is complete.

### Herdr path and identity

`runHerdrRound` is reached through `transport.mjs:653`; its current name is
timestamp-derived in `herdr-round.mjs`. `runId` exists in the Run record but is
not yet passed into the Herdr context. S2 must thread it through the existing
context. `agentSession.value` remains conversation correlation; resource
control requires an adapter-proven process/resource incarnation. The
duplicate-name behavior is closed by the source/tests recorded below; restart
and crash-window ambiguity remains a conservative park condition.

### Parked Run reachability

The source has read-only run projections (`show-run.mjs`) and session result
linking. `coordination run` accepts request steps for session work and has no
standalone Run recovery intent. Therefore F6 is closed negatively: the public
recovery door belongs beside `dispatch show-run` as a future
`dispatch recover <runId>` use case, reusing the same Run write door. It must
not be invented as a second coordination authority.

### Speculative attempts

Fanout code launches distinct child assignments; this search found no explicit
same-Assignment speculative-attempt contract. Until a focused source review
or product requirement proves otherwise, the invariant is one active Run per
Assignment. If such a requirement is found, P01 must stop and revise its
admission tuple rather than silently serialize legitimate work.

## Gate Result

- **Closed:** standalone admission race is real and has a single owner;
  existing lock primitive is identified; Herdr identity gap is confirmed.
- **Closed in design:** exact Assignment lock-path mapping and F6 public-door
  ownership.
- **Implementation proof still required:** reader-by-reader v2 audit, the F6
  public-door test, and restart/crash-window Herdr scenarios.
- **No product decision requested yet:** speculative-attempt support is not
  evidenced by this pass; ask the person only if source review finds a real
  requirement.

## Herdr Name Probe Result

The Herdr source and conformance tests are available at
`/home/vantt/projects/herdr-gateway` and settle the duplicate-name question:
`upstreams/herdr/src/app/agents.rs:234` maps duplicate names to
`agent_name_taken`; `upstreams/herdr/tests/api_ping.rs:945-955` asserts the
same live wire error; the gateway fake test at `src/herdr/fake.rs:1223-1235`
asserts the second start returns `AgentNameTaken`. Therefore existing-name
start is reject, not reuse or replace. This closes the name-collision branch.

The remaining gateway probes (restart-issued session/incarnation, crash before
locator persistence and no-resurrection) are not a reason to start an fgOS web
gateway. The running Herdr server is the transport under test; the first Node
profile parks when its CLI adapter cannot prove the required identity.

## Final Gate Classification

- Assignment lock owner: **closed at design level**; P01 uses the append-only
  generation guard and staging-directory publication, not `withEventsLock`.
- `run.json` readers: **fail-closed policy retained**; v2 reader audit is a
  P01 acceptance test, not a second authority.
- Public parked-Run route: **F6 closed negatively**; add the recovery door in
  the dispatch family, not the coordination session family.
- Herdr existing-name behavior: **closed by gateway source/tests**; no
  `fgos gateway start` is required.

## Consequence

P01 design is ready; its focused reader audit and lock-path fixture are P01
implementation acceptance, not missing design. P02 remains split:
reattach/observe/park is implementable, while replacement launch is
gateway-contract-gated. P05 owns the F6 public-door proof.
