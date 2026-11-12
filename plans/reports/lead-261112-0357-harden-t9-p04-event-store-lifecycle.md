# HARDEN T9 P04 - Event Store lifecycle, fault logs, init use case

Branch `harden/t9-p04-event-store-lifecycle` from `origin/main` `05d951dbf`, rebased on `fcb58d5d7`. OPC MERGE on `98bdf3140`; its optional point (a throwing Land release) is applied after it. Status: DONE_WITH_CONCERNS (two full-run failures this phase does not touch).

## What changed

- `src/event-store/maintenance.mjs`: `runWithEventStoreLifecycle(facts, fn)` runs hand-off switch, start trigger (dispatched worker only, never `init`), the verb with its printed answer and exit code, the seal hand-off child, the end trigger, then the Land release (a callback). Start and end trigger errors are recorded alike (`event-store-start-trigger`, `event-store-end-trigger`; the start error was dropped before). The Land release runs even when the end trigger failed; a release that throws is recorded (`event-store-land-release`) and never fails the command. `maintainEventStore` takes `trustedMain` as a string or a function; a function that throws is the trigger's `{ error }`, never a cwd fallback.
- `bin/fgos.mjs` `main()`: one wrapper call. `handSealsToChild`, `isEventStoreChild`, `opensEventStore`, `eventStoreLifecycle`, `sweepsLand` and six imports are gone. `events` and `rebuild` share `eventStoreContext(dir)`. The `init` arm is flags plus one call.
- Registry: `events` gains `eventStoreChild(positional, flags)` (seal, `sync --opportunistic`) beside `store` and `landsWork`; manifest tests accept it.
- `session.mjs`, `gateway-control.mjs`, `loop.mjs`: shutdown root is `resolveInvocationRoot` policy `main-checkout`; no `resolveMainCheckoutRoot(x) ?? x` left in them (loop resolves once; `getMainFgosDir` import gone).
- Fault logs `git mv`'d to `src/observe/` (`invocation-fault-log.mjs`, `approve-fault-log.mjs`): the record holds `argvShape` (verb, sub-verb, flag names, `<length>` for every value), the file is 0600, and past 1 MB the oldest half of the lines is dropped (`appendFaultRecord`, shared by both logs). `friction-client`, `approve.mjs` import them locally. The invocation fault log test moved to `test/observe/`.
- `spawnDetachedCli` moved to `src/util/spawn-detached-fgos.mjs` (same contract, same entry; `OWN_CLI` exported). `case-start.mjs` re-pointed.
- `src/verbs/state/init.mjs`: `initStoreUseCase({ dir })` (mint, lock dirs, `initStore`, coexistence manifest, headless notice, Git recovery).
- Architecture: `src/{event-store,workflow,observe,verbs,setup}` import nothing from `src/cli`, one named exception (`src/setup/registrations.mjs`, goes with the doctor version read); the exception list fails if the file stops importing. Manifest rows moved/added; static-import pin shrank by six lines.
- Spec: dated paragraph at the end of `docs/platform/event-store/spec.md`; two path mentions re-pointed. CHANGELOG line. Census: lines and digests, 0 undeclared.

## Tests

- New `test/event-store/lifecycle.test.mjs` (7): start-trigger error recorded; end order and Land release; no start trigger for the owner or for `init`; Land only when landed and not dispatched; no triggers when the verb does not open the store; verb error rethrown after the tail; unreadable root recorded and nothing released; throwing release recorded. Own file because the wrapper switches the process to hand-off sealing, which the inline-sealing cases of `triggers.test.mjs` cannot share.
- `triggers.test.mjs`: one CLI wiring case, a failing start trigger of a dispatched worker leaves a record and the command still succeeds (smoke for the plan's forced-failure step). Existing end-trigger, child-record and Land-sweep wiring cases are unchanged and green.
- `test/observe/invocation-fault-log.test.mjs`: shape/redaction, 0600, cap, approve log shares the rules.
- `test/distribution/source-payload.test.mjs`: the detached child's entry is `bin/fgos.mjs` and is in the staged source payload.
- `test/architecture.test.mjs`: the `src/cli` import guard and a fixture test that it catches static, dynamic and multi-line imports.
- Nothing retired, nothing weakened. Red evidence: the wrapper and `argvShape`/`appendFaultRecord`/`OWN_CLI` did not exist, so the new cases could not load before the code; the dropped start-trigger error was read at the old `main()`. I did not run the new cases against the old tree.

## Gate (what I ran)

- Wide focused set before the OPC point: `test/event-store test/cli test/setup test/observe test/runner test/verbs test/workflow test/state test/distribution` + architecture, doc-health, decision-citation: green except doc-health (two dead paths in the Event Store spec, fixed) and the drift-check fixture (fixed on main since).
- Full `npm test` on `98bdf3140`: 8684 tests, 2 fail, no ERROR lines: V7n addendum (known) and `mailbox-live-confined` "ending a confined run leaves no process" (known load flake; 19/19 alone). After the release-catch edit: lifecycle, triggers, architecture, doc-health, citation drift, session, manifest 140/140.
- Census scan 0 undeclared. No Rust touched.

## Size (vs origin/main)

bin about -122 net (+57/-179 with the helpers and init body gone), src +160 (wrapper +70, redaction/cap +40, init use case +55, moves ~0), tests +250. Estimate bin -110 (met), src +85 (over: init moved into a use case file instead of being deleted, redaction and cap are shared), tests ~0 (over: the wrapper, redaction and guard had no unit proof).

## Authority

- When to open, maintain, seal, hand off and release for the Event Store was `main()` (a shell) plus three runner exits; now one function in the event-store layer reading verb facts from the registry and the root from the invocation-root door.
- Deviation from the plan text: `trustedMain` is not "resolved by the function when omitted". The Event Store layer may not import `src/runner` (existing consumer-boundary guard), so callers pass the door as a function and the layer only calls it.
- Not moved: `getMainFgosDir` (state layer) still falls back to the `.fgos` it was given when Git cannot be read, for its other callers (`src/state`, `src/identity`); it belongs on the same door. Separate item.
- `src/setup/registrations.mjs` still imports `src/cli/version.mjs` (named exception until the doctor reads the version at its owner).
- A trigger of the tail (end trigger, Land release) now both record and never fail the command. The end trigger now runs before the error line of a failing verb is printed; a succeeding verb prints first as before.

## Lessons

- The architecture guard that stops a layer importing upward can contradict a plan line ("resolved by the function"); read the guards of the target layer before planning a signature.
- A process-global switch (hand-off sealing) in a function under test forces its tests into their own file; check for module state before adding cases to an existing file.
- A source-pinned import list (`ARM_STATIC_IMPORTS`) is quickest to fix by diffing the real import set, not by hand.
