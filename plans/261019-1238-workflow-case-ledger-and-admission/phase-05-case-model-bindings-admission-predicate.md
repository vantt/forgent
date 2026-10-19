# Phase 05 — Case model: events, projection, bindings, admission predicate

Infra only (rank infra or lower, spec §5.3). No door, no proposer change: this phase ships the functions phases 06–08 call, each driven by tests with fixture guides.

## Context

- Spec RUL-WF-2, -5..8, -10, -12..17, -19, -21, -24, -27, -28; §2.2 (milestone states, reservation, binding, route/deviation, receipt), §4 (entities; ids named, no bare `runId`; Unit link `{caseId, activity, reservationId}`), §5.2, §5.5 (reservations and live bindings are runtime state, never events), §7.2 steps 4 and 6, battery 1–6, 16, 17, 26.
- Code: `src/workflow/store.mjs` (after 02: hold-gated append, fail-closed read; `projectWorkflowState` `:131`), `src/workflow/ref-digests.mjs` (`digestContextRefs` `:17`; comment `:4` claims gate answers immutable — false today), `writeGateAnswerFile` `src/workflow/runner.mjs:1264` (overwrites), gate-answer path reader `src/runner/execution/handoff-refs.mjs:102`, `:283`; write-scope matcher (RUL84) `src/runner/dispatch/write-scope.mjs:53,130` (no scope-vs-scope overlap today); worktree identity `cwdDevIno` `src/holder-lock/registry.mjs:39` (private); custody holder probe `dispatchCwdHolder` `src/runner/dispatch/cwd-lock.mjs:76`; blind mask `BLIND_HIDDEN_ROOTS` `src/runner/dispatch/confinement/resources.mjs:26`; doctor registry `src/setup/registrations.mjs` (pattern: `src/setup/git-checks.mjs`, `event-store-checks.mjs`).

## Requirements

1. **Event kinds** (ledger, appended only through the 02 door): `case.opened` (kind `playbook|conductor`, guide snapshot ref, frame, request digest), `binding` (caseId, generation, worktreeRoot, commonDir, ref, state), `route` (decision point, chosen activity, route kind `should|may-instead|unlisted`, reason when required, guide version), `reservation` (reservationId, activity, writes, worktree, counters reserved, seat-launch ceiling, unitRunId when known), `settle` (reservationId, outcome, receipts, seatLaunchesUsed, `frame-exhausted` once), `gate.answer` (stepId/decision point, approved, subject digest), `case.closed`. Stored runs (92, legacy step events) fold as `playbook` cases; no migration, one read path.
2. **Projection** (pure fold, R5): milestones `unreached | achieved(subjectDigest) | stale(prior, current) | blocked(question)` — current digests are computed by the caller and passed in, never read inside the fold; live reservations; frame remaining; eligible activities (all entry milestones achieved for the current digest); listed routes per decision point **plus** the unlisted path (never filtered, N11); open gates; closable or not.
3. **Receipts** only from named evaluators: harness verify result in `unit.json`, reviewer verdict from the pattern's checker role, gate answer. Worker prose and self-reported `verifiedSha` are never receipts (0052). A receipt binds to the tested paths; an integration is a new subject (RUL-WF-15). `findings` is an outcome: a diagnostic milestone accepts it; a delivery milestone needs `pass` + current receipt (RUL-WF-19).
4. **Subject digests**: extend `ref-digests.mjs` to digest a declared artifact set (files/paths/tree of those paths/named external subject), and gate answers; fix the `:4` comment. Unknown current digest → that milestone fails closed only (RUL-WF-13).
5. **Gate-answer file** (runtime state beside the ledger, RUL-WF-14/24): exclusive create per gate occurrence (`O_EXCL`; a gate that re-parks after a rejection is a new occurrence), carries `approved` + subject digest at answer time; once a `gate.answer` event consumes it, it is immutable; a second answer to the same occurrence is refused by name (`gate-already-answered`). Phase 00 checks which existing tests re-answer a gate and whether that is a re-park (allowed) or an overwrite (now refused). The path read by `handoff-refs.mjs:102` stays the same; its content gains front-matter fields the reader ignores (verify the reader).
6. **Bindings** (RUL-WF-27), `src/workflow/case-bindings.mjs`: one file per worktree identity at `.fgos/workflow-runs/.bindings/<key>.json`, key from the one identity door (export `cwdDevIno` from `src/holder-lock/registry.mjs`; never re-derive). Lifecycle under the case's `advance` hold: exclusive create `{state:'pending', caseId, generation, worktreeRoot, commonDir, ref}` + fsync → caller appends `binding` event + fsync → temp-write-then-rename over the **same name** to `committed`. Only the owner (`caseId` + `generation`) overwrites. Read: missing file → `unbound` (no ledger scan); another open case's committed record → `worktree-already-bound`; `pending`, unparsable, or generation mismatch → `binding-unsettled` (never `unbound`). Unbind only when the attempt is quiet — proof is the custody lease being free (`dispatchCwdHolder(...) === null`), not a pid or mtime — and only for the matching generation.
   - **Masked-view sentinel**: the host writes `.fgos/workflow-runs/.bindings/.root` before any dispatch (created only when `currentDispatchDepth() === 0`). A reader that finds the bindings dir without the sentinel, or cannot write it when a write is requested, answers `binding-view-unavailable` — never `unbound`. Under `hostRead: blind` the whole `workflow-runs` root is masked (`resources.mjs:26`), so a confined worker always gets this answer; no confinement change.
7. **Admission predicate**, `src/workflow/case-admission.mjs` (pure over projection + binding answers + live reservations): checks entry milestones at current digest, consent for the effect (`human-consent` bound to the approved artifact digest), `independence-blind` (refuse non-encapsulated form; refuse a later Unit whose handoff refs name blind-seat outputs, RUL-WF-16), `writes` disjoint from every live reservation of the case (add `writeScopesOverlap` to `write-scope.mjs` — the one matcher; check phase 00 for an existing overlap helper first), binding, frame (`dispatches`, `mutatingDispatches`, seat-launch ceiling; unknown remainder → refuse the next writing dispatch), route rules (unlisted needs a reason and is refused at `listedRoutesOnly` points; MUST still applies to unlisted routes), two conflicting hard rules → refusal naming both (RUL-WF-8). Returns `{ reservation, events[] }` or `{ refused: { code, condition } }`; refusals are answers for the agent, not owner questions (RUL-WF-10).
8. **Reservations** runtime state: `.fgos/workflow-runs/<id>/reservations/<reservationId>.json`; a reservation is released only after its attempt is quiet or custody settled (spec §5.4 last bullets). **Settle-pending**: a settle that cannot take `advance` writes `.fgos/workflow-runs/<id>/settle-pending/<reservationId>.json`; every `advance` holder drains settle-pending and unconsumed gate-answer files first (one helper `drainCaseInbox(hold)`).
9. **Nested frame** (RUL-WF-28): `reserveParentFrame(parentHold, …)` and idempotent `refundParentFrame` — a separate `advance` section on the parent, released before the child case opens; never two `advance` holds in one scope (holder-lock rank rule).
10. **Doctor**: `src/setup/workflow-case-checks.mjs` — sentinel present; every binding record matches its case's ledger (`binding` event, open case, generation); repair path rebuilds records from the ledger (L3). Registered in `src/setup/registrations.mjs` (one line + import).

## Files

- Create `src/workflow/case-bindings.mjs`, `src/workflow/case-admission.mjs`, `src/workflow/case-projection.mjs` (or extend `store.mjs` if under ~150 added lines — keep one fold), `src/setup/workflow-case-checks.mjs`; tests `test/workflow/case-bindings.test.mjs`, `case-admission.test.mjs`, `case-projection.test.mjs`, `test/setup/workflow-case-checks.test.mjs`.
- Modify `src/workflow/store.mjs`, `src/workflow/ref-digests.mjs`, `src/holder-lock/registry.mjs` (export only), `src/runner/dispatch/write-scope.mjs` (add overlap; no new import — kernel isolation list unchanged), `src/workflow/runner.mjs` (`writeGateAnswerFile` moves into `case-projection`/store as exclusive + digest; `recordGateAnswer` keeps today's flow until 06, except that a second answer to the same gate occurrence is now refused), `src/setup/registrations.mjs`, `docs/architecture-manifest.json` (new files infra).
- Verify `src/runner/execution/handoff-refs.mjs` reads the new gate-answer content unchanged; modify only if it parses content.

## Tests (battery → test)

- 1 two reservations with overlapping `writes` → second refused at reservation.
- 2 a worker-written "approved" artifact never satisfies `human-consent`.
- 3 receipt on child paths does not satisfy the integration milestone.
- 4 approved artifact digest changed → `stale`, effect refused.
- 5 frame counters: exhausted → refused; unknown remainder → next writing dispatch refused.
- 6 unlisted route proposed and recorded; the action violating a MUST refused.
- 16 two cases bind one worktree via two path spellings (symlink) → second `worktree-already-bound`.
- 17 crash after `pending` / after event / before rename (kill child at each point) → never `unbound`; late cleanup with an old generation leaves the new binding.
- 26 concurrent exclusive create from two processes → exactly one wins; never-bound worktree → `unbound` with no ledger file opened (assert via a fixture with an unreadable `workflow-runs/*/events.jsonl`).
- Masked view (sentinel absent) → `binding-view-unavailable`.
- Projection determinism: fold twice / replay → identical (R5); legacy stored-run fixture folds as playbook.
- Guard (01) unchanged.

## Risks / rollback

- Risk (M×H): `cwdDevIno` includes `birthtimeNs`; filesystems without birthtime give `0n` — still stable per inode; confirm in phase 00 on ext4/tmpfs.
- Risk (M×M): settle-pending drain forgotten at one `advance` site → receipts late. Mitigation: phase 06 calls `drainCaseInbox` inside the one `acquireAdvanceLock` wrapper, not at call sites (this phase builds and tests the helper only; wiring it now would double-append with today's `answerWorkflow`).
- Risk: write-scope overlap of globs is conservative (may refuse disjoint-in-practice globs) — acceptable (fail closed), named in refusal.
- Rollback: revert; nothing outside tests calls the new modules yet.

## Done when

New tests green; A4 and kernel isolation green; guard and full `npm test` green.
