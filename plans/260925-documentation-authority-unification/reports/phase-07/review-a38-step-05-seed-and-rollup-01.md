# A38 review: Step 5 seed and rollup

- Reviewer: `reviewer:sonnet-session:p7s5-r3@2026-10-17`
- Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`
- Reviewed commit: `5334499c1` (read-only detached worktree)
- Pin check: PASS (all index pins/parts hashes, byte lengths, limits, frame id uniqueness/sort/count/sha)
- Review mode: ordinary
- State: **complete** (all three bounded parts and the remainder sample are in). Reviewers: part 01 `reviewer:sonnet-session:a642704cf61747822`, part 02 `reviewer:sonnet-session:a6e5cb71fcc35506d`, part 03, frame and remainder this reviewer.

## 1. Remainder frame verification

Method: imported `extractMarkdownConservationUnits` from `scripts/generate-doc-inventory.mjs` (production export, no copied parser; module is import-safe, its CLI runs only under `isMainModule`). Node `v24.18.0`, one process, peak RSS about 330 MB, 34 s. Script lives in my scratchpad, not in the repo.

| Check | Result |
|---|---|
| Files in frame vs `find docs/platform -name '*.md'` | 611 = 611, no extra, none missing |
| Per-file sha256 and byte length vs frame `files` | 611/611 equal (0 sha mismatches, 0 byte mismatches) |
| Extractor total units | 22457 |
| Exclusions (3 ids in frame `exclusions`) | all three matched and removed (component-boundary.md unheaded-block-27 and -99 labels; architecture-intent.md unheaded-block-61 table) |
| Eligible after exclusion | 22454; unique 22454 |
| Stable id rule `REM-UNIT-` + first 24 hex of sha256(path + '#' + anchor) | recomputed for every unit |
| Recomputed sorted ids vs frame `ids` | identical, same order; 0 missing, 0 extra |
| Recomputed `sortedIdsSha256` | `bc0b81877c17fb7ee5d538451ee741da0be0a2aaa9b35868818f8e4b7b900116` == frame value |

Result: frame verified complete and exact. Memory stayed far under the 4 GB stop threshold.

## 2. Seed and draw (chosen only after section 1 passed)

- Selection time: **2026-10-17T06:56:24Z** (after the frame check; chosen by reviewer, not shared with Doer)
- Seed (reviewer-held string): `tamarind-ledger-0917-r3`
- Algorithm (runtime independent, no PRNG library): for each id in the frame `ids`, key = SHA-256 hex of `seed + ':' + id` (UTF-8); sort ids by key ascending; take the first 60; report them sorted. Reproduce with Python 3: `sorted(sorted(ids,key=lambda i:hashlib.sha256((seed+':'+i).encode()).hexdigest())[:60])`. Draw run with Python 3 stdlib (hashlib/json only), without replacement by construction.
- `sortedIdsSha256` of the frame: `bc0b81877c17fb7ee5d538451ee741da0be0a2aaa9b35868818f8e4b7b900116`
- Draw size: exactly 60. No author-selected seed, file set or substitute used; mandatory rows did not reduce it.

Selected ids (sorted):

```
REM-UNIT-025c743b0dcce6010c19b03f
REM-UNIT-03c6ad4afffcf7682ba530ee
REM-UNIT-05b5ad95a14b3ec0b996dbe6
REM-UNIT-0660024cb1bf0e1c1b800005
REM-UNIT-0879a8f83167642550593d4e
REM-UNIT-08dc068aca3f42aa5783dd28
REM-UNIT-090002899faf0c671638d022
REM-UNIT-0cbb37ae16bdf58b142a9f9d
REM-UNIT-0dd26185c7e6f442bb91c9a3
REM-UNIT-10b2de6bf4e56053cad24692
REM-UNIT-1356cc37d76312e5796c6b46
REM-UNIT-14bc628153f8c33e70de02e0
REM-UNIT-189b26796290822476a34847
REM-UNIT-1e0e83df551eaef135702bad
REM-UNIT-2373a904c7242e1bb4e4ebc4
REM-UNIT-2a7406eb8944405b6304df81
REM-UNIT-2b91ba7498398f573b3bbf58
REM-UNIT-33be75e1c2b3ab3631fb37c5
REM-UNIT-3af077093fac5dc2c103d1df
REM-UNIT-4174a1f537418a70ff019388
REM-UNIT-4190cc9d2d69d4eac6171a86
REM-UNIT-42bb78185a6113d8f52b37b1
REM-UNIT-474df2340c8ff67020185939
REM-UNIT-58388f74c8c940ae9600f0fa
REM-UNIT-60e156ccabc7bb7d4ce50e80
REM-UNIT-69ea0950d03028fc9515f70d
REM-UNIT-6c4e41669ff9c4ff6a761c87
REM-UNIT-70aef04a21d9cf2e83066d95
REM-UNIT-7470d7f25f35796681c96a2e
REM-UNIT-76b2601326ca63c51fe1cc35
REM-UNIT-79795042a2a6806cdb2a6907
REM-UNIT-79b5030a05768fa03810cfbf
REM-UNIT-7b780b68d6141abd89fb4c29
REM-UNIT-7f747d4aab25acb6cd00e7d7
REM-UNIT-82d875fcaddec4928ca2620e
REM-UNIT-870fec3ac2cd7cac32765728
REM-UNIT-89d9c95a553791b084d5fd34
REM-UNIT-8e1e4584912f589cdabba25e
REM-UNIT-92ff6b3a0f5980dbd65f26db
REM-UNIT-97efed18b57d327c7eb1926d
REM-UNIT-985e49df317e7e5884f602e4
REM-UNIT-a171bb71691e38ea33bde091
REM-UNIT-a31512af9e192aaf68f6f86e
REM-UNIT-a779387e922dc854c56e9f34
REM-UNIT-b60b8523462ae616804e7060
REM-UNIT-b653e0f1aa0e07adf17478df
REM-UNIT-ba781c34f393e1a0b9f323ec
REM-UNIT-bdb385e01584a6b4cb3ea253
REM-UNIT-be91bff839629958017c8110
REM-UNIT-c8de6ee2e7eb2e2455aea13f
REM-UNIT-cb846064fe639c7ae424dc0b
REM-UNIT-d188f5ac60ae5ff4c66ef9da
REM-UNIT-d314a591d8fd6ed2b056b024
REM-UNIT-d59bca90d7833ff779f3fc4b
REM-UNIT-db6d39126c1d142fdd5f1f57
REM-UNIT-e4bd3c16fab126f1da0d8fc5
REM-UNIT-eca79c6efe362b0cf641a056
REM-UNIT-ecad2db55dcb72dcb70ea881
REM-UNIT-f160027181f61433c4b3749c
REM-UNIT-f4466287419fc9b9ecbd2fa1
```

## 3. Per-unit deep read (60)

Each unit was read with its enclosing heading and document header (Document type, Implementation, Design status lines). Reverse direction: for the units with a long text line (about 50 of 60; `git grep -F` of the longest line on the pinned commit, checked for units 1-47 of the draw order) the text was found in a legacy source under `docs/architect/`, `docs/specs/` or `docs/platform/.../history/`, i.e. the candidate is a verbatim carriage of an original (units 5, 8, 14 and 43 matched only in Phase 6 review reports, and unit 25's tables are candidate-added; those were read against code instead); the units with no long line (headings, short labels) were read against their parent document and its siblings. Authority kinds used: verification-evidence (dated record, per `agent-coordination/verification/README.md`: "dated physical evidence collections, not proof that every tested runtime still exists"), decision history, proposal, specification/contract/architecture (carried, with header "Carriage only" or "unverified"), proof fixture, guide.

| # | Stable id | File : lines | Unit kind | Authority kind | Alignment | Evidence / note |
|---|---|---|---|---|---|---|
| 1 | `REM-UNIT-025c743b0dcce6010c19b03f` | `docs/platform/proposals/architecture-advisory-panel.md`:279-283 (`unheaded-block-37`) | unheaded-block | proposal | deferred | Document type Proposal/Candidate; Phase 7 comparative-convergence design text, no operative current claim |
| 2 | `REM-UNIT-03c6ad4afffcf7682ba530ee` | `docs/platform/agent-coordination/verification/step-08-standalone-coordination/index.md`:63-63 (`active-cell`) | heading | verification-evidence (dated record) | aligned | Closed-track status line; verification README says dated evidence sets are not proof the runtime still exists; engine dir src/runner/coordination is absent (retired), consistent with history labelling |
| 3 | `REM-UNIT-05b5ad95a14b3ec0b996dbe6` | `docs/platform/agent-coordination/verification/confinement-authority-implementation/P01.md`:7-7 (`coordination-sessions`) | heading | verification-evidence (dated record) | aligned | Heading of a session table in a cell trace; dated evidence |
| 4 | `REM-UNIT-0660024cb1bf0e1c1b800005` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/explanation.md`:32-35 (`unheaded-block-10`) | unheaded-block | proof fixture (non-fgOS worked example) | aligned | P01.3 intraday/EOD example is a panel proof fixture, not an fgOS claim |
| 5 | `REM-UNIT-0879a8f83167642550593d4e` | `docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md`:1-1 (`historical-file-step-07-design-discussion-handoff-prompt`) | heading | decision history | aligned | retired-engine history file, header "Preserve ... as non-authority historical evidence" |
| 6 | `REM-UNIT-08dc068aca3f42aa5783dd28` | `docs/platform/packaging-distribution/vision.md`:95-95 (`unheaded-block-12`) | unheaded-block | vision (superseded-notes table intro) | aligned | Intro of section 6 table; table row "doctor --fix exists" checked: --fix present in bin/fgos.mjs (5 hits) |
| 7 | `REM-UNIT-090002899faf0c671638d022` | `docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md`:554-554 (`unheaded-block-90`) | unheaded-block | proposal | deferred | Proposal A0.7 label "Likely implementation shape:"; not operative |
| 8 | `REM-UNIT-0cbb37ae16bdf58b142a9f9d` | `docs/platform/work-state/decisions/retired-decision-history.md`:538-538 (`0027-context`) | heading | decision history | aligned | Retired ADR 0027 context heading (Vietnamese), cites src/state/workflow-stage-graphs.mjs as of its date; file now absent, text is decision history |
| 9 | `REM-UNIT-0dd26185c7e6f442bb91c9a3` | `docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md`:73-73 (`unheaded-block-12`) | unheaded-block | verification (R3 inventory, Implemented preview) | aligned | gateway.rs: /v1/runtime route (2402), nest_service("/mcp") (1245), runner/tick shells bin/fgos-runner.mjs (1123-1135); run_verb_blocking/spawn_fgos_verb/FgosCliGateway in apps/fgos-gateway/src/{gateway,ports}.rs |
| 10 | `REM-UNIT-10b2de6bf4e56053cad24692` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P04.1/doer-fix-round-1-report.md`:155-177 (`unheaded-block-7`) | unheaded-block | verification-evidence (dated record) | aligned | Fix-round Process list of commands and counts; dated evidence |
| 11 | `REM-UNIT-1356cc37d76312e5796c6b46` | `docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P03.1.md`:27-27 (`commands`) | heading | verification-evidence (dated record) | aligned | Commands heading of cell P03.1 with dated test counts |
| 12 | `REM-UNIT-14bc628153f8c33e70de02e0` | `docs/platform/agent-coordination/playbooks/coordination-operating-harness.md`:268-269 (`unheaded-block-32`) | unheaded-block | guide / playbook | aligned | Process rule "start prompt by reading trace/index.md and current-cell.md"; same names at playbook L85,106,138; guide not a code claim |
| 13 | `REM-UNIT-189b26796290822476a34847` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.3-P08.1-review.md`:30-34 (`unheaded-block-6`) | unheaded-block | verification-evidence (dated record) | aligned | Independent review of retired engine cite session-engine.mjs:3061-3182; file retired, dated evidence per verification README |
| 14 | `REM-UNIT-1e0e83df551eaef135702bad` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/prompts/context-investigator.md`:168-172 (`unheaded-block-18`) | unheaded-block | proof fixture (prompt example) | aligned | Bad-example prompt text inside P01.3 prompt fixture |
| 15 | `REM-UNIT-2373a904c7242e1bb4e4ebc4` | `docs/platform/host-invocation-routing/contracts/legacy-payload.md`:47-51 (`unheaded-block-8`) | unheaded-block | contract (Implementation Alignment table) | aligned | bin/fgos.mjs, package.json bin.fgos-runner (line 11), release-manifest.md, track-closeout.md, r1-rust-host-proof.md all exist at linked relative paths; status labels legacy-current / implemented preview consistent with header |
| 16 | `REM-UNIT-2a7406eb8944405b6304df81` | `docs/platform/agent-coordination/architecture/evidence-and-results.md`:56-56 (`unheaded-block-8`) | unheaded-block | architecture (principle) | aligned | Single general sentence, no code claim |
| 17 | `REM-UNIT-2b91ba7498398f573b3bbf58` | `docs/platform/agent-coordination/verification/code-panel-multicell-facade/p00.md`:177-178 (`unheaded-block-14`) | unheaded-block | verification-evidence (dated record) | aligned | Adversarial corpus lead-in in a cell trace; dated |
| 18 | `REM-UNIT-33be75e1c2b3ab3631fb37c5` | `docs/platform/agent-coordination/verification/step-07-mvp/P02.1.md`:200-200 (`low-1-known_mutating_opsread_only_ops-promoted-from-call-scoped-to-shared-exported-module-singletons`) | heading | verification-evidence (dated record) | aligned | Cites assignment-normalizer.mjs:51-63; KNOWN_MUTATING_OPS exported const at line 52 in pinned tree |
| 19 | `REM-UNIT-3af077093fac5dc2c103d1df` | `docs/platform/system-architecture/architecture/architecture-intent.md`:713-724 (`unheaded-block-106`) | unheaded-block | architecture (MVP roadmap) | deferred | Header "Implementation: Partial - inherited source qualifications"; roadmap table is plan, MVP rows not asserted as shipped |
| 20 | `REM-UNIT-4174a1f537418a70ff019388` | `docs/platform/work-state/contracts/cli-io-contract.md`:223-223 (`6-cursor-pagination`) | heading | contract (carried source) | implementation-gap | Spec says four verbs carry paginated:true (ready, triage, evolve, list work); registry has paginated:true at command-registry.mjs:928 (list), 948 (ready), 1685 (triage); no evolve registry entry. Inherited text, header "current implementation truth unverified" |
| 21 | `REM-UNIT-4190cc9d2d69d4eac6171a86` | `docs/platform/agent-coordination/verification/step-08-standalone-coordination/P01.2.md`:1265-1265 (`verification-run-post-fix-round-3`) | heading | verification-evidence (dated record) | aligned | Regression-run heading with dated command; evidence |
| 22 | `REM-UNIT-42bb78185a6113d8f52b37b1` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.3-P08.1-red-team.md`:488-495 (`unheaded-block-76`) | unheaded-block | verification-evidence (dated record) | aligned | Red-team Finding 1c cites definitions/schema.mjs:386-392; retired path, dated |
| 23 | `REM-UNIT-474df2340c8ff67020185939` | `docs/platform/agent-coordination/verification/confinement-authority-implementation/P01.md`:27-27 (`requirements-proof-phase-01-config-policy-and-machine-registrymd`) | heading | verification-evidence (dated record) | aligned | Requirements proof table; src/runner/dispatch/config.mjs and confinement/policies.mjs exist |
| 24 | `REM-UNIT-58388f74c8c940ae9600f0fa` | `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`:59-59 (`unheaded-block-4`) | unheaded-block | specification (carried runner rule RUL62) | aligned | --no-new-commits-ok in command-registry/bin; assertNoPriorBlockedOutcome defined bin/fgos.mjs:764, used 3331,3537; header "Carriage only" |
| 25 | `REM-UNIT-60e156ccabc7bb7d4ce50e80` | `docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md`:29-34 (`unheaded-block-4`) | unheaded-block | decision history | doc-fix | Evidence column cites herdr-round.mjs:340-358 and 1275-1285 and cli.mjs:212,788; the cited behaviours exist (outcome map herdr-round.mjs:362-374, pane close != cancel at 1400, run.json at cli.mjs:196) but at moved lines. herdr-agent.mjs:385, liveness.mjs:28-35, visibility-session.mjs:136-146 correct. Claims true, anchors drifted (minor) |
| 26 | `REM-UNIT-69ea0950d03028fc9515f70d` | `docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md`:374-374 (`unheaded-block-68`) | unheaded-block | decision history | aligned | Brainstorm history 9.1 principle |
| 27 | `REM-UNIT-6c4e41669ff9c4ff6a761c87` | `docs/platform/agent-coordination/verification/step-07-mvp/P01.2.md`:1692-1694 (`unheaded-block-135`) | unheaded-block | verification-evidence (dated record) | aligned | Regex fix snippet in dated cell trace |
| 28 | `REM-UNIT-70aef04a21d9cf2e83066d95` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`:623-624 (`unheaded-block-44`) | unheaded-block | verification-evidence (dated record) | aligned | Test-evidence heading, dated |
| 29 | `REM-UNIT-7470d7f25f35796681c96a2e` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P09.2.md`:50-70 (`unheaded-block-4`) | unheaded-block | verification-evidence (dated record) | aligned | Proof matrix of dated cell; test names are historical evidence |
| 30 | `REM-UNIT-76b2601326ca63c51fe1cc35` | `docs/platform/agent-coordination/verification/code-panel-multicell-facade/p00.md`:59-59 (`fix-round-2-disposition-accepted-b1-a1-a2-c1-c2d1-m2m3-m4-c3`) | heading | verification-evidence (dated record) | aligned | Fix-round disposition heading, dated |
| 31 | `REM-UNIT-79795042a2a6806cdb2a6907` | `docs/platform/agent-coordination/history/retired-engine/files/spec.md`:25-25 (`literal-snapshot`) | heading | decision history | aligned | Literal Snapshot heading in retired-engine history file |
| 32 | `REM-UNIT-79b5030a05768fa03810cfbf` | `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md`:3-21 (`unheaded-block-1`) | unheaded-block | proposal | aligned | Header block states Document type Proposal and "not shipped behavior"; no operative claim |
| 33 | `REM-UNIT-7b780b68d6141abd89fb4c29` | `docs/platform/proposals/architecture-advisory-panel.md`:219-222 (`unheaded-block-28`) | unheaded-block | proposal | deferred | Proposal Phase 1 interpret-intent text |
| 34 | `REM-UNIT-7f747d4aab25acb6cd00e7d7` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.4-P09.1-red-team.md`:626-628 (`unheaded-block-80`) | unheaded-block | verification-evidence (dated record) | aligned | Red-team finding cites protocol-loader.mjs:202-209 of retired engine, dated |
| 35 | `REM-UNIT-82d875fcaddec4928ca2620e` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P04.2/doer-fix-round-1-report.md`:205-205 (`tests`) | heading | verification-evidence (dated record) | aligned | Tests heading in a Doer fix report |
| 36 | `REM-UNIT-870fec3ac2cd7cac32765728` | `docs/platform/documentation/history/proposals-redesigns/documentation-system-discussion.md`:378-383 (`unheaded-block-46`) | unheaded-block | decision history | aligned | Dated brainstorm open-risk bullets |
| 37 | `REM-UNIT-89d9c95a553791b084d5fd34` | `docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P03.2.md`:16-17 (`unheaded-block-2`) | unheaded-block | verification-evidence (dated record) | aligned | Requirements preamble, dated |
| 38 | `REM-UNIT-8e1e4584912f589cdabba25e` | `docs/platform/agent-confinement/spec.md`:499-511 (`unheaded-block-61`) | unheaded-block | specification (carried, 9.2 hostRead blind) | aligned | All reason codes present in src (blind-requires-confinement, blind-in-process in confinement/request.mjs:373 and bind.mjs:274, blind-hides-workspace, blind-ref-hidden, confinement-backend-missing, confinement-probe-failed, peer-run-hidden, confinement-blind-read) |
| 39 | `REM-UNIT-92ff6b3a0f5980dbd65f26db` | `docs/platform/agent-coordination/verification/team-dispatch-v1/step-06-cell-5-scout-blast-radius.md`:165-187 (`unheaded-block-19`) | unheaded-block | verification-evidence (dated record) | aligned | Diff summary of a blocked cell; dated |
| 40 | `REM-UNIT-97efed18b57d327c7eb1926d` | `docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md`:614-616 (`unheaded-block-50`) | unheaded-block | verification-evidence (dated record) | aligned | Forward notes of a closed track |
| 41 | `REM-UNIT-985e49df317e7e5884f602e4` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.2.md`:260-281 (`unheaded-block-26`) | unheaded-block | verification-evidence (dated record) | aligned | Cell summary cites core/coordination-protocols/group-thinking-rfc-review-lite.yaml (retired, absent); dated |
| 42 | `REM-UNIT-a171bb71691e38ea33bde091` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/proposals/constraint-advocate.md`:71-71 (`unheaded-block-36`) | unheaded-preamble | proof fixture | aligned | Closing sentence of a panel proposal fixture |
| 43 | `REM-UNIT-a31512af9e192aaf68f6f86e` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/prompts/system-shaper.md`:77-77 (`handoff-shape`) | heading | proof fixture (prompt) | aligned | Handoff Shape paragraph of prompt fixture |
| 44 | `REM-UNIT-a779387e922dc854c56e9f34` | `docs/platform/packaging-distribution/history/distribution-baseline.md`:277-277 (`inherited-distribution-source-unit-4`) | heading | decision history | aligned | Added-in-candidate paragraph says dated evidence, native identity gap explicit |
| 45 | `REM-UNIT-b60b8523462ae616804e7060` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.4-P09.1-review.md`:514-514 (`item-7-the-replay-consistency-check-confirmed-present-and-exactly-what-it-does-and-does-not-catch`) | heading | verification-evidence (dated record) | aligned | Review item 7 heading, dated |
| 46 | `REM-UNIT-b653e0f1aa0e07adf17478df` | `docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P03.1.md`:67-67 (`baseline-comparison-indexmd-8-known-failures-no-new-failure`) | heading | verification-evidence (dated record) | aligned | Baseline comparison heading, dated test counts |
| 47 | `REM-UNIT-ba781c34f393e1a0b9f323ec` | `docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md`:1123-1123 (`bad-example-6`) | heading | guide (doctrine example) | aligned | Intentional "Bad Example" quote |
| 48 | `REM-UNIT-bdb385e01584a6b4cb3ea253` | `docs/platform/observe/spec.md`:42-45 (`unheaded-block-6`) | unheaded-block | specification (carried) | implementation-gap | Must-Not-Own bullet names packages/coordination-state; packages/ has no such crate (convention, distribution, herdr-fgos-common, holder-lock, host-runtime, observe, process, run-result, session-identity, work-state). Verbatim of docs/specs/observe.md:22; header "Carriage only; truth not certified" |
| 49 | `REM-UNIT-be91bff839629958017c8110` | `docs/platform/agent-coordination/verification/step-07-mvp/P02.1.md`:664-678 (`unheaded-block-34`) | unheaded-block | verification-evidence (dated record) | aligned | Fix-evidence block, dated |
| 50 | `REM-UNIT-c8de6ee2e7eb2e2455aea13f` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P10-KERNEL-FIX.md`:867-867 (`74-high-4-quorumclose-coverage-added-for-all-5-previously-dark-protocols`) | heading | verification-evidence (dated record) | aligned | HIGH-4 coverage heading, dated |
| 51 | `REM-UNIT-cb846064fe639c7ae424dc0b` | `docs/platform/agent-coordination/verification/code-implementation-track-policy/p04.md`:68-68 (`unheaded-block-15`) | unheaded-block | verification-evidence (dated record) | aligned | Round-3 cap note; cites retired fgos-plan-loop skill, dated |
| 52 | `REM-UNIT-d188f5ac60ae5ff4c66ef9da` | `docs/platform/proposals/architecture-advisory-panel.md`:64-67 (`unheaded-block-9`) | unheaded-block | proposal | deferred | Proposal section 1; fgos-code-panel use case, not operative |
| 53 | `REM-UNIT-d314a591d8fd6ed2b056b024` | `docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.2-red-team.md`:734-735 (`unheaded-block-108`) | unheaded-block | verification-evidence (dated record) | aligned | Red-team item 9, dated |
| 54 | `REM-UNIT-d59bca90d7833ff779f3fc4b` | `docs/platform/proposals/step-09-group-thinking-substrate.md`:215-215 (`6-mvp1---master-coordination-fixture`) | heading | proposal | deferred | Proposal MVP1 heading and fixture name |
| 55 | `REM-UNIT-db6d39126c1d142fdd5f1f57` | `docs/platform/proposals/step-10-coding-domain-adoption.md`:683-683 (`12-intent-traceability`) | heading | proposal | deferred | Proposal intent-traceability table |
| 56 | `REM-UNIT-e4bd3c16fab126f1da0d8fc5` | `docs/platform/agent-coordination/history/documentation-migration/source-inventory.md`:21-21 (`unheaded-block-2`) | unheaded-block | history (source inventory ledger) | aligned | Preamble says temporary migration aid, conservative classification |
| 57 | `REM-UNIT-eca79c6efe362b0cf641a056` | `docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P02.2.md`:680-681 (`unheaded-block-51`) | unheaded-block | verification-evidence (dated record) | aligned | Forward-gaps note, dated |
| 58 | `REM-UNIT-ecad2db55dcb72dcb70ea881` | `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P04.1/redteam-recheck.md`:214-222 (`unheaded-block-35`) | unheaded-block | verification-evidence (dated record) | aligned | Red-team recheck item A1, dated |
| 59 | `REM-UNIT-f160027181f61433c4b3749c` | `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`:259-260 (`unheaded-block-27`) | unheaded-block | contract (carried) | deferred | Section 6.2 lead-in; header "Carriage only; truth not certified"; config shape not asserted current |
| 60 | `REM-UNIT-f4466287419fc9b9ecbd2fa1` | `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md`:140-140 (`runtime-identity-and-activation-1`) | heading | architecture + history (retained source detail) | aligned | Retained-source heading with "Legacy status: Promoted"; no new claim |

Alignment totals: aligned 49, deferred 8, doc-fix 1, implementation-gap 2, total 60.

## 4. Defect count and rate

- Substantive candidate-content defects (candidate-authored incorrect operative claim or lost residual): **0 of 60 = 0%**.
- Sensitivity: if the one doc-fix (unit 25, ADR-011 evidence-line pointers that moved after later source edits; the behaviours cited are all still true) is counted, 1/60 = 1.7%.
- Stop threshold is >10% (7 or more): **not reached. No owner-escalation stop.**
- Rationale-only wording: none counted (L10-37).

### Findings, exact rows

1. Unit 25 (`REM-UNIT-60e156ccabc7bb7d4ce50e80`, `agent-coordination/decisions/ADR-011-...md` L29-34), kind decision-history, alignment doc-fix, risk low, owner agent-coordination docs owner (Phase 9). The "Implementation And Design Status" table (candidate-authored, "Added in candidate") cites `herdr-round.mjs:340-358` for the blocked/paused-limit to worker-timeout map (it is at 362-374), `herdr-round.mjs:1275-1285` for pane-close-not-cancel (it is at about 1400-1402), and `cli.mjs:212,788` for run.json close (run.json written at `cli.mjs:196`). Other cites verified exact: `herdr-agent.mjs:385`, `liveness.mjs:28-35`, `visibility-session.mjs:136-146`. Parked only this row; not repaired by me.
2. Unit 20 (`REM-UNIT-4174a1f537418a70ff019388`, `work-state/contracts/cli-io-contract.md` section 6 heading, L223), implementation-gap, risk medium (contract reads as four paginated verbs), owner work-state contract owner. Source text names four `paginated: true` verbs (`ready`, `triage`, `evolve`, `list` work key). `src/cli/command-registry.mjs` has `paginated: true` only at lines 928 (list), 948 (ready), 1685 (triage); there is no `evolve` registry entry. Inherited from `docs/specs/work-state.md:695`; header says "Carried source material; current implementation truth unverified". Reported, not repaired.
3. Unit 48 (`REM-UNIT-bdb385e01584a6b4cb3ea253`, `observe/spec.md` Must Not Own L42-45), implementation-gap, risk low, owner observe owner. Bullet assigns Agent Coordination state to `packages/coordination-state`; `packages/` contains no such crate (only convention, distribution, herdr-fgos-common, holder-lock, host-runtime, observe, process, run-result, session-identity, work-state). Verbatim of `docs/specs/observe.md:22`; header "Carriage only; current implementation truth is not certified". Reported, not repaired.

### Other observations (not defects)

- Many verification/history units cite code of the retired coordination engine (`src/runner/coordination/**`, `src/runner/definitions/`, `core/coordination-protocols/*.yaml`, `core/skills/fgos-plan-loop` are absent in the pinned tree). The collection README labels these dated evidence sets, so they are history, not false current claims.
- 8 proposal-type or carriage-only units are `deferred`: not a claim of current truth.
- The population is dominated by agent-coordination verification traces; that is the frame's real composition (611 files), not a sampling skew introduced here.

## 5. Bounded part 03 (reviewed by this reviewer)

See `review-a38-step-05-bounded-part-03.md`: 23 entries (17 A34 bindings + 6 controls), 23 deep-read, 23 ok, 0 rework, 0/17 and 0/6.

## 6. Bounded parts 01-02 and all-part rollup

Reports read: `review-a38-step-05-bounded-part-01.md` (60 ok, 0 rework), `review-a38-step-05-bounded-part-02.md` (59 ok, 1 rework), `review-a38-step-05-bounded-part-03.md` (23 ok, 0 rework). All three parts ran against `5334499c1`, all pin checks PASS, all in ordinary mode, no parked rows except the PARK-PROTECTED-01 control (ok, visibly false by design).

### 6.1 Completion and ordinary verdict totals (143 bounded entries)

| Part | Entries | ok | rework | Deep | Mechanical only |
|---|---|---|---|---|---|
| 01 | 60 | 60 | 0 | 23 (+ X-DUP-01/03/04 read as siblings) | 37 |
| 02 | 60 | 59 | 1 (X-LOCK-05) | 48 | 12 |
| 03 | 23 | 23 | 0 | 23 | 0 |
| Total | 143 | 142 | 1 | 94 | 49 |

Composition check: 109 statements (part 01: 32 DUP/SEM + 28 `a34-residual` statement rows; part 02: 49) + 28 A34 preservation bindings (part 02: 11, part 03: 17) + 6 controls = 143.

### 6.2 Per-population rework calculation

| Population | Rows | Deep-read denominator | Substantive rework numerator | Rate | 3% rule |
|---|---|---|---|---|---|
| Bounded statements | 109 | 60 (part 01: 23; part 02: 37 = 48 deep minus 11 binding rows) | 1 (X-LOCK-05) | 1/60 = 1.7% (part 02 alone 1/37 = 2.7%) | At or below 3%, no full deep read of the population required |
| A34 preservation bindings | 28 | 28 (part 02: 11, part 03: 17), every binding deep-read | 0 | 0/28 = 0% | Below 3% |
| Control proofs | 6 | 6 | 0 | 0/6 | n/a |
| Remainder sample (60 of 22454) | 22454 | 60 | 0 (1 minor doc-fix not counted; 1/60 = 1.7% if counted) | 0% | Below the 10% stop, no escalation |

Additional integrity facts: all 28 A34 payload hashes recomputed and verbatim against residual files (parts 01 and 03 checked all 28 independently; part 02 checked 11 against source and target); `legacySuccessorRehomeOwed` is true on exactly 13 rows (X-A34-01, 17..28), matching concern 4; frame, extractor blobs (B), allowed paths (A) and the two-candidate-edit digest binding verified.

### 6.3 Remaining items, each with row id and owner

Rework (blocks acceptance until fixed):

| Id | Item | Risk | Owner |
|---|---|---|---|
| R1 X-LOCK-05 | Row marks the statement `aligned`, but `docs/platform/packaging-distribution/spec.md` states none of it (no `lock-*` checks, `lockRoot`, row 5g, `lock-dirs` fix; they exist only in `docs/specs/distribution.md:70,72,73`). Either (a) repoint `statementPath` and anchor to `docs/platform/holder-lock/spec.md` section 13 and add `src/setup/holder-lock-checks.mjs` plus the fgctl activation gate as evidence, or (b) keep the file and set alignment to `doc-fix` or `deferred` naming the gap | medium | Author (authority-alignment row), with packaging-distribution owner for the underlying gap |

Lead rebind items (mechanical, not content defects):

| Id | Item | Owner |
|---|---|---|
| G1 QF-01..13 | Stale `statementFileSha256` `2ffde3b3...` for `phase-07/owner-answers.md`; file is now `c8891911...` after Lead edit L11-16 (`5334499c1`). Rebind or state out of row scope. Family routing text actually lives in `owner-queue.md` and `cross-area-inventory.json` | Lead |
| CONTROL-FRAME pin | Entry pins `step-05-remainder-frame/index.json` sha `4ae2e89c...`, which no longer exists after the compact frame replacement (L11-16). Statement itself verified against the compact frame. Repoint to `step-05-remainder-frame.json` | Lead |

Implementation gaps and doc observations (reported, never repaired; not blocking):

| Id | Item | Risk | Owner / route |
|---|---|---|---|
| G2 packaging doc | Candidate `packaging-distribution/spec.md` lacks lock rows 5g/7/7b that `docs/specs/distribution.md` carries | medium | packaging-distribution owner, Step 9 / Phase 9 |
| X-DUP-03 | "Duplicate pair" is not byte-identical: platform `architecture-manifest.json` lacks holder-lock path classifications present in the root manifest (disclosed, sha b7797fea vs 74762f5c) | medium | Step 6, `docs/platform/contracts/architecture-manifest.json` owner |
| X-SEM-13 | `statementPath` is `docs/specs/runner.md`, but group members are retired-engine history files; mapping wording only, optional doc-fix | low | Step 2 owner |
| X-SEM-17..32, X-SEM-12 | Code evidence refs are directories without digest; acceptable under the rows' own scope | low | none |
| G3 PRES-X-A34-02..11 | `declaredResidualPayloadSha256` null on ten rows; `payloadHashVerified` is the author's recomputation. Substance verified against source and target | low | Step 9 rebind |
| G4 PRES-X-A34-02..11 | Row `reviewReport` differs from the report named inside the residual record; both exist | low | Step 9 rebind |
| X-A34-02..11 binding note | Payloads sit in restored sections (e.g. `## Restored class definitions`); 02 and 03 share one payload hash by design | low | Step 9 rebind |
| X-A34-15..28 drift | Source (and for 18..28 target) `docs/specs/runner.md` drifted from B0 through main edits; residual bytes preserved, rebind owed | low | Step 9 |
| G5 X-LOCK-07 | `deferred` by design: Windows and macOS domains ship Unknown/Refused; containment belongs to the run supervisor | low | run supervisor owner |
| Remainder unit 25 (ADR-011) | Candidate-added evidence table has moved line pointers (`herdr-round.mjs`, `cli.mjs`); behaviours still true | low | agent-coordination docs owner, Phase 9 |
| Remainder unit 20 (`cli-io-contract.md` section 6) | Names four paginated verbs; registry has three, no `evolve` | medium | work-state contract owner |
| Remainder unit 48 (`observe/spec.md` Must Not Own) | Names nonexistent `packages/coordination-state` | low | observe owner |
| PARK-PROTECTED-01 | Raw protected equality stays false (reading-map merge result keeps branch edits, +10/-2 vs main parent); provenance explained, no protected repair, no false all-green | low | Lead / Step 9 |

Stops: none. No population crossed its threshold, no row is parked other than the protected-provenance control, and the remainder sample is far below 10%.

## 7. Verdict

**Step 5 can be accepted once R1 (X-LOCK-05) is reworked.**

- Required before acceptance: fix X-LOCK-05 by option (a) or (b) above, then a narrow re-review of that one row; Lead rebinds the QF-01..13 `statementFileSha256` and the CONTROL-FRAME pin (mechanical).
- No full-population expansion is needed: statements 1.7%, bindings 0%, remainder 0% are all within their thresholds.
- Frame verified exact; seed and draw recorded in section 2; A34 residuals, hashes, owners and activation obligations all survive; no candidate promotion, proposal activation, new writer or implementation repair was found.
- Implementation gaps listed above are routed to their owners and do not block acceptance; fresh native close stays Step 9 and whole-file truth stays Phase 9.
