# HARDEN T6 council, CORRECTNESS seat (axes A, B: correctness, state and recovery)

Seat: correctness, state and recovery of the Workflow layer (guide and case). Repo main at `0890dfe15`; no file under `src/workflow`, `src/setup/workflow-case-checks.mjs` or `bin/fgos.mjs` differs from `bbbf52f00`, the commit of the activated release, so every reproduction below ran the code read. fg-server2, 2026-11-08 09:00 to 10:00 Asia/Saigon, load 6 to 10. Read-only; the only write is this file.

Inputs: [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (per-layer loop step 2, size rule, owner decision 70), [T6 baseline](research-261108-0831-harden-t6-baseline.md), [T5 closing](closing-261106-2006-harden-t5-execution-core.md) section 11, `docs/platform/workflow/spec.md`. Citations used: RUL104 (audit makes what exists better, not bigger: no new feature, layer or mechanism; a contract change moves every caller and deletes the old path), L10 (extend through the door, never beside it), L3 (truth is the JSONL ledger, anything else is a view), D-ADR0070 (Workflow is guide plus admission ledger; the agent picks the order), N15 (owner 2026-10-19: the case ledger stays JSONL hardened in place, no Event Store in the cutover). Design principles are numbered as in `core/instructions/design-principles.md` (1 one door, 2 strict layering, 5 correctness first, 7 one source of truth, 8 one proof).

## What I ran, and what I did not read

Read line by line: `store.mjs`, `runner.mjs`, `case-verbs.mjs`, `case-lock.mjs`, `case-runtime.mjs`, `case-bindings.mjs`, `case-frame.mjs`, `case-close.mjs`, `case-start.mjs`, `case-projection.mjs`, `case-admission.mjs`, `case-admission-port.mjs`, `case-gate.mjs`, `case-inherit.mjs`, `unit-handoff.mjs`, `units-source.mjs`, `ref-digests.mjs`, `seat-providers.mjs`, `checked.mjs`, `dir-guard.mjs`, `index.mjs`, `guide-schema.mjs`, `src/setup/workflow-case-checks.mjs`, the `workflow` arm of `bin/fgos.mjs` (2234-2379), and on the boundary `src/runner/execution/case-admission-port.mjs`, `unit-run-start.mjs` 290-410, `run.mjs` 185-215, `bind.mjs` 380-435, `patterns/catalog.mjs` 90-360, `packages/seat-binding/rust/src/rank.rs` 455-560.

Skimmed by grep only, so no verdict from me: `definition.mjs` (cycle and reference checks seen at 412-430, the rest not read), `steps.mjs`, `loader.mjs` past line 80, `seats.mjs`, `propose.mjs`, `propose-classify.mjs`, `propose-frame.mjs`, `propose-validate.mjs` (a grep found no write or spawn in any of them, so they are read-only as the spec says). About 5 100 of the 7 288 lines were read line by line; the brief's "every line" was not met for the guide loader and the conductor-entry `propose*` files.

Executed (scratch dirs under the session scratchpad, `HOME` set to a scratch home, `HERDR*`/`CLAUDE*` unset, the activated `.fgos/installation/bin/fgos`, no agent, no seat, no pane):

| Probe | What it shows | Result |
|---|---|---|
| `d1/` units file with one writing unit in a repository with no commit; then commit; then `workflow resume --foreground` | a step that ended `execution-failure` is not rerun after its cause is gone | reproduced: ledger stays at 7 events, status `failed` |
| `gate/` playbook `g1` gate, `g2` gate after it; answer `g2 --approve` while only `g1` is parked; then answer `g1` | a gate can be approved before it is asked | reproduced: `g2` never parks, run completes |
| `rsv/` conductor guide with one writing activity; `workflow gate --verify "sleep 30"` killed by `timeout -s TERM 4`; then `status`, `resume`, a second `gate --verify true` | a reservation whose controller died is never released | reproduced: reservation stays live, second gate refused `writes-overlap`; the killed gate's `sleep 30` outlived it (I killed it) |
| `bind-probe.mjs` (pure Node from the checkout): a pending binding record of a case whose ledger has no `binding` event; `checkWorkflowCaseBindings`, `fixWorkflowCaseBindings` | doctor fix cannot settle a crash-left pending record | reproduced: check fails, fix answers "no binding record needed repair", record stays, another case reads `binding-unsettled` |
| read of the 54 real ledgers in `.fgos/workflow-runs` (event types, sizes, binding provenance only; no config read) | account pin outcome per seat; ledger size | 6 runs with `--account` where the pin held for some seats only, 2 of them with no `unit.account-unpinned` event; `unit.complete` lines up to 3.8 MB, ledgers up to 10 MB |

No test file was run (none needed for a reproduction, and the machine was loaded). No Cargo target, no worktree under `forgent-worktrees` was created. Every process I started has exited.

## Part A, target shape

The layer stays Node. No component has a Rust consumer, admission is a pure 280-line predicate that the Execution Core (Node, T5) calls in process, and N15 keeps the ledger JSONL. Re-evaluate only if the Execution Core's door moves to Rust (spec 5.6, unchanged).

| Component | Authority for | Contract and ports | Node budget (now -> after) | Delete | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|
| Guide (`guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests`) | what a guide or Playbook may say; the closed guard catalog; step vocabulary | `validateWorkflow`, `normalizeGuide`, `loadWorkflow`; kernel files import nothing of the runner | 1 345 -> <= 1 300 | `entryStep` (no user) | `workflow-capabilities-configured`, `domain-workflow-operations-coverage`, `domain-registry-compiled` (shared with Work) | no function over 300 (`validateWorkflow` 384 today) |
| Case ledger (`store`, `case-projection`, `case-runtime`, `case-lock`, `case-frame`, `case-close`) | the append-only ledger, its one fold, the inbox beside it, the `advance` hold, closing | `appendWorkflowEvent` under a hold; `projectWorkflowState` and `projectCase` pure; `drainCaseInbox` as the one place that folds runtime files in and (new) releases dead reservations | 1 251 -> <= 1 160 | reservation files (duplicate of the `reservation` event, B-13); the second dir-fsync helper; the gate-answer tmp-and-rename; `CASE_EVENT_KINDS` (no user) | none of its own | `unit.complete` carries references, not copies (B-9) |
| Admission (`case-admission`, `case-admission-port`, `case-bindings`, `case-gate`) | may this activity run now; route kind; reservation and settle; one binding per worktree | the Execution Core's `CaseAdmissionPort` (T5-owned interface, unchanged); `admitProposal` pure | 965 -> <= 980 | `activityUnitOf` once admission reads the activity pattern itself (B-6) | `workflow-case-bindings` with its fix extended; `workflow-case-binding-sentinel` may merge into it with no condition lost | the pattern comparison lives in `admitProposal`, never in a door |
| Conductor entry (`propose*`, `case-start`, `case-inherit`, `case-verbs`) | proposal for approval; opening a case under a frame; inherit; the five verbs | `prepareWorkflowRun`, `openCaseOnLedger`, verbs in `index.mjs` | 2 171 -> <= 2 171 (simplicity seat owns `propose`) | none from this lens | none | gate answers only for a parked gate (B-1) |
| Playbook runner (`runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index`) | step order, parked gates, wave worktrees, integration, Unit hand-off | `advanceWorkflowRun` under the proposer's lifelong hold; Units through `runUnit` with the port | 1 556 -> <= 1 500 | the per-unit account dry bind (`runner.mjs:367-404`, B-5) | none | `advanceWorkflowRun` (521) <= 300 by moving the unit body into one function, no new module |
| Doors (`bin/fgos.mjs` `workflow` arm) | argument parsing only | verbs of `index.mjs` | 145 -> <= 145 | none | none | ids checked as one path segment before any path is built (B-15) |
| Doctor side (`workflow-case-checks`, `workflow-definition-files`) | what a machine must have for Workflow | registered rows in `registrations.mjs` | 238 -> <= 250 | none | as above | fix settles every crash window the check reports (B-7, B-8) |

Where the spec is right and the code agrees: the ledger is the truth and fails closed on a corrupt or unterminated line (`store.mjs:177-210`); only an `advance` holder appends or truncates; the inbox drain is idempotent on reservation id and round; consent is bound to the subject digest. Where they disagree:

1. Spec 5.4 and section 17 item 22: "a reservation is released once its attempt is quiet". No code releases it; `reservationQuiet` (`case-runtime.mjs:61`) has no caller (B-2).
2. Spec 5.2 names doctor row `workflow-pools-satisfy-independence`; no registered row has that id (baseline D9).
3. Spec 6 names a gate answer "bound to the digest of what the gate shows". An answer is accepted for a gate that shows nothing yet (B-1).
4. Section 18 names `integrate.mjs` and `plan-source.mjs`; neither exists.

## Part B, findings

Severity counts: High 3 (all reproduced), Medium 6 (2 reproduced), Low 8.

### High

**B-1. High. A gate can be approved before it is asked, and the approval is then spent without a question ever being shown. Reproduced.**
Evidence: `recordAnswer` (`case-verbs.mjs:168-185`) never checks that the step is parked: the question falls back to `gate?.question ?? ''` (`:180`); `recordGateAnswerRound` (`case-runtime.mjs:314-339`) computes `occurrence = max(1, parks)`, so an unparked gate is "occurrence 1"; the fold sets any answered step to `answered`/`approved` (`store.mjs:349-373`, no check of a prior `gate.park`), and the runner skips the park for an `answered` step (`runner.mjs:166`). The subject digest recorded is that of whatever existed at answer time (`stepSubjectDigest`, `unit-handoff.mjs:435`), for a gate whose producers have not run that is the digest of an empty report set.
Scenario (the `gate/` probe): playbook `g1 -> g2 -> done`; while only `g1` is parked, `fgos workflow answer <id> --step g2 --approve`; then answer `g1`. Ledger: `gate.park g1`, `gate.answer g2`, `gate.answer g1`, `step.complete g1`, `step.complete g2`, `workflow.complete`, `case.closed`. `g2` was never asked. Admission re-asks only when a downstream *writing* Unit is guarded by a `human-consent` MUST row (`case-admission.mjs:153-163`); the shipped `delphi` and `group-cognition` presets have gates and no `must:` rows, so for them the pre-approval stands. The same hole lets an answer to a step with no gate reach later Units as "the owner's answer" (`buildUnitHandoff`, `unit-handoff.mjs:95-101`).
Fix (smaller or equal): `recordGateAnswerRound` refuses `gate-not-parked` unless the ledger's last `gate.park` of that step is later than its last settling `gate.answer`; drop the `?? gate?.question ?? ''` fallback. The owning test `case-runtime.test.mjs` already parks first (`gatedRun`), so it stays green; one new case there. About +3/-1 lines.

**B-2. High. A reservation whose controller died is never released; its writes block every overlapping writing dispatch of the case for good. Reproduced.**
Evidence: a reservation is settled only by its own controller (`runUnit`'s `settleAdmission`, `run.mjs:197-217`; `runCaseGate`, `case-gate.mjs:117`) or by a resume of the Unit run that recorded its link (`unit-run-start.mjs:266-268`). Nothing settles one whose controller died before the link existed, or a gate's (no Unit run ever). `reservationQuiet` (`case-runtime.mjs:61`), written for exactly this, has no caller. `writes-overlap` is checked against every live reservation (`case-admission.mjs:187-193`); the reuse path for a re-asked Unit needs a `unitId` (`case-admission-port.mjs:276-277`), which `fgos run --case` and `fgos workflow gate` never send.
Scenario (the `rsv/` probe): conductor case with writing activity `build`; `fgos workflow gate <case> --writes 'src/**' --verify "sleep 30"` is killed (SIGTERM, as a closed terminal or an agent timeout does). `status` and `resume` both show `rsv-... src/**` live forever; a new gate on `src/**` is refused `writes-overlap ... reservation rsv-...`. The only way on is `workflow close`, which ends the case. The killed gate also left its `sleep 30` running: `runCommand` (`goal-check.mjs`) does not take its child down with it.
Fix: (1) a writing reservation's liveness is the worktree's custody lease, which `runUnit` already holds for the whole writing run (`admitSuccessor`, `unit-run-start.mjs:388`); take it before `port.admit` instead of after (T5-owned file, a reorder, no new code), and let `runCaseGate` hold the same lease around its command. (2) `drainCaseInbox` settles each live writing reservation whose custody is free and whose Unit run is not resumable (no `unit.json`, or a `gate-run-` id) as `not-started`, through `applySettle`, using `reservationQuiet`. A cancelled `fgos run --case` keeps its reservation (its `unit.json` exists and is unsettled), so the T5 rule "a cancelled run stays live for resume" holds. About +12 Node, the dead export becomes used; no new event kind, no new lock.

**B-3. High. `workflow resume` cannot rerun a step that ended `execution-failure`, so one bad seat launch costs the whole run. Reproduced (T5 closing section 11, `p-d2dc4f2e`).**
Evidence: the runner writes `execution-failure` for any throw in a Unit's preparation or run (`runner.mjs:484-491`), then `step.fail` and `workflow.fail` (`:543-558`); the fold makes the step and the run `failed` (`store.mjs:382-397`) and no event turns them back; the ready filter drops `failed` steps (`runner.mjs:124`) and the loop runs only while `running` (`:113`); a completed unit is skipped whatever its outcome (`:262`). `resume` then returns the failed state, appends nothing and says nothing (`case-verbs.mjs:294-310`).
Scenario (the `d1/` probe): a writing unit in a repository with no commit fails "cannot resolve HEAD"; after the commit, `resume --foreground` returns `status failed`, the ledger is unchanged at 7 events.
Semantics I propose (no new mechanism): an `execution-failure` or `not-started` outcome is an infrastructure fact, not a verdict; `findings`, `refused`, out-of-scope writes and an integrate refusal are verdicts. `resume` (and an `answer`, which advances through the same loop) re-opens a run whose failing step ended on infrastructure: it reruns that step's failed Units as fresh, newly admitted Unit runs; everything completed stays; a verdict stays terminal, and `resume` then refuses by name (`nothing-to-resume: step <id> ended <outcome>`) instead of returning silently. No automatic retry is added: the Execution Core's one lost-brief retry (T5, `MAX_BRIEF_RETRIES`, `run.mjs:237`) stays the only automatic one, every further attempt is one explicit `resume`, and the `fgos-cook` retry goes (baseline D5: today a seat that always loses its brief launches up to 4 times). Fresh admission, not a resume of the settled Unit run: the settled reservation must not be reused (`unit-run-start.mjs:266` never re-admits a resume), and consent and frame have to be asked again. A writing Unit reruns in its recorded worktree and branch when they still exist (the existing `custody-predecessor-unknown` path, `runner.mjs:421-451`, handles a dirty predecessor), because a second `wf/<run>/<unit>` worktree of the same branch cannot be checked out.
Code: the fold's `step.start` clears a run's `failed` status (`store.mjs:301-305`, +3 lines, existing event); the ready filter admits a `failed` step whose outcome is `execution-failure` or `not-started` (`runner.mjs:124`); the skip at `:262` requires an accepted outcome. About +6/-1.

### Medium

**B-4. Medium. Pattern deviation is gated in one door only and never recorded as a route deviation (`p-zpgzqdoy4z`). Code read.** The catalog refuses a pattern swap without a reason only when the caller passes `activityUnit` (`patterns/catalog.mjs:112-118`); only `fgos run --case` does (`bin/fgos.mjs:2906`). The port receives `pattern: loop` (the loop name, `unit-run-start.mjs:374`) and ignores it; `routeKindOf` classifies by decision point only (`case-admission.mjs:84-95`), so a swap is recorded as `should` or `eligible`, `deviationsBeforeAsk` is not charged and a `listedRoutesOnly` point does not refuse it. Fix: the core sends the selected pattern name; `admitProposal` compares it with `activity.unit?.pattern` and classifies a difference as `unlisted` (reason required, deviation charged, refused at a listed-routes-only point). Then `activityUnitOf` and its read in `bin/fgos.mjs` can go once the catalog takes the activity pattern from the same answer. About +6/-25.

**B-5. Medium. `--account`: what the code does, and why a pin both "does not hold for every seat" and "moves seats to another pool". Reproduced from real ledgers.** The start checks the pin exists (`case-start.mjs:307-314`) and stores it (`store.mjs:95`); `resume --account` is refused (`bin/fgos.mjs:2344`) and the stored one is reused. Per Unit, the runner dry-binds every seat with the pin (`runner.mjs:367-404`); if no seat binds the account it drops the pin for the whole Unit and records `unit.account-unpinned`, else it passes the pin as an unscoped override to every role, framing and synthesizer included (`unit-handoff.mjs:198-207`). In the crate, a pin keeps only the survivors of its pool whenever the pool serves any survivor of that seat (`rank.rs:488-541`): a seat whose natural first choice is another family is moved onto the pinned pool (the DOCOS report: `--account gemini/tetnu` put gemini on every seat, framing included), and a seat no entry of the pool serves runs unpinned with only a `account-pin-other-pool` skip in its provenance. Real ledgers: `wf-run-1792241488834-2c6f0e91` and `wf-run-1792238913436-23f161ae` have `panelist-2` unpinned (`account-pin-no-inventory`) and no `unit.account-unpinned` event, because the runner's check is `some` seat. `seatProviders` (`status`) does not show the account at all (`seat-providers.mjs:24-37`). Fix in this layer (smaller): delete the dry bind; the per-seat binding provenance is the one record; `seatProviders` adds `account` (value or skip reason) per seat (+1 line). Whether a pin may move a seat across pools is Seat Binding's rule (closed T5), so it is a decision question, below.

**B-6. Medium. Integrate can land some branches and then report a failure that reads as "nothing merged"; the landed operation is never acknowledged. Code read.** `runner.mjs:223-240` merges dependency branches one by one; on the second failure the first is already on the target, but the step fails with `integration of X refused` and `acknowledgeWorkflowLand` runs only on success (`:250`), so Land keeps the first candidate. A crash between publish and `step.complete` loses the `operationId` the same way (the rerun sees the branch as an ancestor and returns `operationId: null`, `:612-613`). Fix: acknowledge `landed` on both paths and put `landed` on the `step.fail` payload. About +2.

**B-7. Medium. Doctor fix cannot settle a pending binding record of a case whose ledger has no `binding` event; it answers "no binding record needed repair". Reproduced.** `fixWorkflowCaseBindings` visits only cases from `casesWithBindings` (`workflow-case-checks.mjs:33-48, 104-105`), but a crash between the exclusive create and the first `binding` event (`case-bindings.mjs:132-139`) leaves exactly such a case. The worktree then answers `binding-unsettled` to every case (`readBinding`, `:86`). Fix: iterate the records and repair under the owning case's hold whatever its ledger holds. About +3/-3.

**B-8. Medium. Doctor fix cannot settle a committed record whose ledger already says `unbound`. Code read, unreproduced (needs the staged addon for a hold).** `unbindWorktree` appends the `unbound` event before it unlinks (`case-bindings.mjs:157-164`); a crash between leaves a committed record the check reports (`workflow-case-checks.mjs:83`), while `repairCaseBindings` handles only `pending` (`case-bindings.mjs:185`). The worktree stays bound to a case that released it. Fix: in `repairCaseBindings`, a committed record whose ledger's last event for its key is `unbound` at its generation is removed. About +3.

**B-9. Medium. The ledger copies every Unit's full results; appends and unlocked readers scale with it. Measured; reader race unreproduced.** `unit.complete` carries `results` whole (`runner.mjs:505-520`): lines up to 3.8 MB, ledgers up to 10 MB with 33 events, 431 MB for 54 runs. Every append reads and parses the whole ledger to number the event (`store.mjs:155-157`), and the proposer rereads it several times per Unit (`runner.mjs:102-109, 155, 354, 523`). `statusWorkflow` and `recordAnswer` read without the hold and fail closed on an unterminated tail (`store.mjs:203-208`); the port retries three times with no wait (`case-admission-port.mjs:34-41`); a multi-megabyte append is a real window for them. It also duplicates the Unit run's own record (design principle 7). Fix: `unit.complete` keeps `unitRunId`, `outcome`, seat keys and the scope findings; the hand-off, gate question and `seatProviders` read the rest from the Unit run (`readUnitRunHistory`, T5). Shrinks every new ledger by about 99 percent and keeps old ledgers readable (the fold treats a full `results` and a short one alike).

### Low

- **B-10.** `renderGateAnswerFile` writes `tmp` then renames with no fsync (`case-runtime.mjs:152-153`, baseline D8). It is a view, but it is the file handed to Units as the owner's answer; a power loss can leave it empty until the next round. Use `replaceDurably`, already imported (-2 lines).
- **B-11.** Two directory-fsync helpers (`store.mjs:123`, `case-bindings.mjs:31`). Keep one (store's) and import it (-8). The durable door has no append and no remove, so the ledger's own append-and-fsync stays local.
- **B-12.** `writeDurably` ignores the byte count of `writeSync` (`store.mjs:116`); a short write leaves an unterminated line while the writer believes the event stored. Loop or refuse (+2).
- **B-13.** Reservation files duplicate the `reservation` event; their only reader is `applySettle`'s binding lookup (`case-runtime.mjs:85-89`). Put `binding: { key, generation, created }` on the event (it is appended after `bindWorktree`, `case-admission-port.mjs:310-317`) and delete the files and their four functions (about -25 and the reservation-file assertions).
- **B-14.** `resumeWorkflowDetached` discards a hold it may win (`case-verbs.mjs:326`) and then reports a Playbook case as a conductor and spawns nothing, if the proposer releases between the two tries. Same shape as `resumeWorkflow` (-3).
- **B-15.** A run id is joined into paths unchecked (`store.mjs:42-44`, `case-lock.mjs:19-21`): `.fgos/workflow-runs/.bindings/advance.lock` exists in the real tree, so a non-case id was once advanced; `..` reaches `.fgos`. Check the id with the pattern `caseEnvOf` already uses (`case-admission-port.mjs:123`) at the verbs.
- **B-16.** Throws that escape the advance loop with the run still `running` and no event: the worktree cleanup inside the admission-refusal catch (`runner.mjs:456`) and `outOfScopeWrites` (`:497-499`, throws when the branch is gone); a run that hits the second throws again on every resume. Catch into the unit's failure like the rest.
- **B-17.** Error naming: 77 of 92 `RunnerConfigError` throws in `src/workflow` carry no code. A caller has to read the text for "already being advanced" (`case-lock.mjs:45-50`, while the port's twin is `case-admission-busy`), "not found" (`case-verbs.mjs:45`), and a corrupt `settle-pending` file is skipped forever without a word (`case-runtime.mjs:27-33, 230`). Give the three a code; report the unreadable file.

### Edge cases from reading, no finding

Ledger tail recovery is sound: only an `advance` holder truncates, it drops the one unterminated line and records `ledger.recovered`. Gate-answer rounds are race-safe (`installOnce` per occurrence and round). The drain is idempotent on reservation id and round, so a crash between append and file removal repeats nothing. `bindWorktree` refuses another case's worktree and a masked view (`binding-view-unavailable`) never reads as `unbound`. A Unit whose controller died after admission is reused by `(activity, unitId)`, so the Playbook proposer has no B-2 leak of its own. Admission never reads a file or the clock (`case-admission.mjs` is pure), so the predicate itself replays.

## Migration table

| Node part | What it decides | Move to Rust? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `case-admission.mjs` | may an activity run now | No | pure, in-process caller is Node (T5); spec 5.6 | n/a | <= 290 |
| `store.mjs`, `case-projection.mjs` | ledger append, fold | No | N15 keeps JSONL; fold is pure and small; fix B-3, B-9, B-12 | 1 | <= 420 / 255 |
| `case-runtime.mjs`, `case-bindings.mjs` | inbox, bindings | No | durable door already Rust; fix B-2, B-8, B-10, B-11, B-13 | 1 | <= 230 / 195 |
| `runner.mjs` | Playbook order, integration | No | a reshape, not a language move; fix B-3, B-5, B-6, B-16 | 2 | <= 600 |
| `workflow-case-checks.mjs` | binding doctor | No | fix B-7, B-8 | 1 | <= 130 |

## Delete list

Production: the account dry bind in `runner.mjs:367-404` (B-5); reservation files `writeReservationFile`, `removeReservationFile`, `readReservationFile`, `readReservationFiles` (B-13); `fsyncDir` in `case-bindings.mjs` (B-11); `activityUnitOf` and its `bin/fgos.mjs` read once admission compares patterns (B-4); `entryStep`, `CASE_EVENT_KINDS` (no user, baseline). Instruction text: the `fgos-cook` rerun of a failed seat (one retry owner, B-3). Spec text: the `workflow-pools-satisfy-independence` row name, `integrate.mjs`, `plan-source.mjs`. Tests: reservation-file assertions in `case-runtime.test.mjs` ("a settle that could not take advance ... its reservation file goes with it") and `case-admission-port.test.mjs` (`readReservationFiles` count) move to assert the event payload.

## Doctor table

| Row | Fail or warn condition | Surviving row |
|---|---|---|
| `workflow-case-binding-sentinel` | bindings directory without `.root` | may merge into `workflow-case-bindings` (same directory, same fix); no condition lost |
| `workflow-case-bindings` | record unparseable or pending; record not bound on its ledger; record of a closed case; open case bound on its ledger with no record | kept; its fix must settle every condition it reports (B-7, B-8) |
| `workflow-capabilities-configured` | a shipped Workflow capability without a `prefer` pool | kept |
| `domain-workflow-operations-coverage` | a step operation that resolves to nothing | kept |
| `domain-registry-compiled` (shared) | `compiled.json` out of date | kept |
| `blind-steps-use-proven-pools` (shared with T5) | blind unit can bind an unproven pair | kept (T5's) |

No new row: a dead reservation is released by the drain (B-2), not reported.

## Tests table

| Behaviour | Owning proof | Duplicate or smell | Move or change |
|---|---|---|---|
| Ledger append, fail closed, tail recovery | `workflow-store-ledger.test.mjs` | none | keep |
| Fold of step events to run state | first tests of `workflow-runner.test.mjs` (append then project) | a pure fold proved in a 154 s file | move to `workflow-store-ledger.test.mjs`; add the `step.start`-reopens case (B-3) |
| Resume reruns an infrastructure failure, not a verdict | none | B-3 | one fold case (above) plus one wiring proof: the `d1/` scenario, no agent, about 1 s, in `workflow-runner.test.mjs` |
| Gate answer only when parked | `case-runtime.test.mjs` (`gatedRun` parks first) | none for B-1 | add one case there |
| Dead reservation released | none | B-2 | one case in `case-runtime.test.mjs` (the drain releases a quiet, never-linked writing reservation and keeps a cancelled, resumable one) |
| Binding repair | `test/setup/workflow-case-checks.test.mjs` | none for B-7, B-8 | add two cases |
| Pattern deviation | `case-admission.test.mjs` | `p-zpgzqdoy4z` acceptance asks exactly this | add two cases |
| Account per seat in status | `seat-evidence.test.mjs` (not read) | `units-runner.test.mjs:473-610` drives the dry bind end to end | retire the `unit.account-unpinned` assertions with the dry bind; owner becomes the binding provenance test of T5 plus one `seatProviders` row case |
| Time-based waits | `playbook-proposer.test.mjs:247` sleeps 3.5 s; `workflow-runner.test.mjs` polls status every 200 ms (`:419, 442`) | waits on detached children | wait for the ledger's terminal event instead of a sleep |

## Received items (answers)

| Item | Answer |
|---|---|
| D1 resume after a seat failure (`p-d2dc4f2e`) | B-3: reproduced; semantics and code above |
| D2 `.fgos/assignments` retention (`p-tslryr3buq`) | a new mechanism, so under proposed additions; correctness constraints listed there |
| D3 `--account` | B-5: both reports are one crate rule seen from two sides; layer fix is reporting plus deleting the dry bind; the move rule is a decision question |
| D4 pattern deviation (`p-zpgzqdoy4z`) | B-4 |
| D5 two retry owners | B-3: the Execution Core's one retry stays; `fgos-cook`'s goes; Workflow adds none |
| D8 durable writes | B-10, B-11, B-12 |
| D6 `p-3ydqquajy2` (two guards on one milestone overwrite each other's evidence) | confirmed by reading: `achieve` replaces the whole milestone entry (`case-projection.mjs:81-84`), so a `gate.answer` after a `settle` drops its verify receipts and the reverse; not reproduced |
| D9 stale spec | Part A list, items 2 to 4 |

## Decision question for the owner (B-5, Seat Binding rule)

What is happening: `--account pool/id` keeps only the candidates of that pool for every seat the pool can serve, so it changes a seat's family (framing included) and narrows a panel's spread; a seat the pool cannot serve runs unpinned. Cause: one rule in `rank.rs:488-541` serves both "which login pays" and "which provider runs". Options: (a) a pin applies only to a seat whose first choice is already of that pool, never moves a seat (one condition in the crate, golden vectors change; cost: an operator who wants to route a panel to one provider uses `prefer` or `--seats`); (b) keep the move and only report it per seat (B-5 fix alone, no crate change). Recommendation: (a), because the DOCOS case shows the move surprising the operator on the framing seat and the account is a billing choice. Scope of the answer: Seat Binding (closed T5 layer, Rust crate plus golden vectors); Workflow's part is the B-5 fix either way.

## Proposed additions (owner picks)

- **P-1 Retention of `.fgos/assignments` and `.fgos/workflow-runs` (`p-tslryr3buq`).** Problem: 1.4 GB in 529 run directories and 431 MB in 54 ledgers on this machine, never pruned; `dispatch inspect` cost grows with the count. Evidence: baseline sections 4 and 7. Correctness constraints for whoever builds it: never remove a Unit run that an open case names (`unit.started`, `unit.complete`, `reservation` or `settle` of that case), one whose custody or attempt lock is held, one that is resumable (unsettled `unit.json`), or a report an approval's digest still stands behind (`approvedReportDigests`); remove a closed case's ledger only with or after its Unit runs. B-9 first cuts the ledger tree by about 99 percent for new runs, so the remaining need is the assignments tree. Benefit: bounded disk and `inspect` time. Replaces nothing; it is a new sweep, so it waits for the owner.

## Net size estimate (my proposals only)

| Part | Delta |
|---|---|
| Node production | about -75 deleted (dry bind 38, reservation files 25, fsync helper 8, `activityUnitOf` read and export 20 minus the comparison 6, dead exports 4) and +45 added (B-1 3, B-2 12, B-3 6, B-6 2, B-7/B-8 6, B-9 10, B-12 2, B-15 4); net about -30, before the simplicity seat's cuts |
| Rust | 0 (option (a) of the decision question would change one condition in `rank.rs`) |
| Tests | about +120 (B-1, B-2, B-3 fold and wiring, B-4, B-7, B-8, B-9) and -80 (dry-bind assertions, reservation-file assertions, fold cases moved out of the 154 s file); net about +40 |

Status: DONE_WITH_CONCERNS
Summary: Three Highs, all reproduced on the activated release with no agent: a gate can be approved before it is asked, a dead controller's reservation blocks overlapping writes of the case forever, and resume cannot rerun a step that failed on infrastructure; six Mediums including the `--account` behaviour (one crate rule explains both reports) and a doctor fix that cannot repair what its check reports.
Concerns/Blockers: `definition.mjs`, `loader.mjs`, `seats.mjs` and the `propose*` files were skimmed, not read line by line. B-8 and the B-9 reader race are unreproduced (need the staged addon or a timing harness). B-2's fix reorders custody before admission in a T5-owned file and needs that owner's agreement.
