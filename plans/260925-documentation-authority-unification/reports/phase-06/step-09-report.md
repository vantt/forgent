# Runner carriage author checkpoint — draft, review not started

State: **authoring** (P1–P4 author pass complete; committed native proof and review packaging next). Input HEAD and SYNC: `63fa6f15266f45c881f610235e0be8d61ff07120`, Lead main merge; docs unchanged since `af0057e13`. Source `docs/specs/runner.md` is untouched. Current HEAD / sync blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`; frozen map blob: `473a009662f22fb5d745e6ae151136da324d0d5e`. [Source pins and full digest drift](step9-source-blobs.json). Runner owns commit; no git write by the worker.

## Carriage and decisions

**495 current source units / 166 headings**, all carried verbatim with exact source ids and full unit/target digests. One pending shard, [s9-runner-01.json](../../ledger/decisions/s9-runner-01.json): **0 Unit-exact / 494 Weak-exact / 1 Judgment**, 495 pending, 0 reviewed. Classification uses unchanged `classifyExactCarry` over the whole source document: split files lose the source H1 ancestry and/or have less than half the source units, so exact byte matches are conservatively Weak-exact. The original H1's direct-section digest changes because full P3 metadata is inserted after it; original H1 and payload remain verbatim. All other 494 digests equal their targets. Every row remains pending, including all exact matches.

**16 mapped carrier files plus the portal = 17 new candidate files**, full P3 headers, one H1 per file, Canonical No. Portal written last; existing `contracts/routing-handoff.md` unchanged. The Lead evidence's 15-file total misses the root `spec.md`: the frozen map actually names 16 distinct target paths (8 subcomponent specs + 3 architecture + 2 decisions + operations + contract + root spec). This is an accounting correction, no new split. [Carriage accounting](step9-carriage-accounting.json) records whole-source segment reconstruction, 23 bounded byte passes, target hashes, every binding and review class. Each pass is at most 55,000 bytes, including the large Business Rules, Behaviors and decision-history targets. Final decision history includes the new records and is about 177 KB with metadata; the evidence's 123 KB excluded unresolved heading rows.

[Section-level liveness](step9-liveness.md) ran **before carriage**, with its [committed script](step9-liveness-scan.mjs): 167 sections including preamble, 349 document citations in the declared live search roots, per-section RUL consumers and extant/missing paths. Historical roots and candidates are excluded; the citation count is not the evidence's broader git-grep count. No subject is declared retired; lexical silence cannot prove retirement. [Triage table](step9-triage.md) / [full triage](step9-triage.json) remain pending independent review. [Truth ledger](truth-ledger-runner.json): 181 current-by-default units eligible for a reviewer-chosen sample, no truth certified. Decision/history placement preserves any current assertions for review too.

## Existing Lead decisions applied, by rule

| Lead decision | Rule | Result |
|---|---|---|
| 1. Map growth / stale anchors | P2 | 11 additive rows labelled Added in candidate: nine new records 0055–0063 plus retitled 0047/0052; two obsolete row keys rebound to the current-heading rows, full original rows preserved as historical rebinding receipts. 166 active rows = file default + 165 non-H1 headings; H1 is owned by default. All current target anchors resolve. Source retired-heading text retained verbatim; no retirement judgment. |
| 2. Drift measure | Stop condition 6, Step 8 precedent | 27/470 pin unit digests changed = **5.7447%**. 52 current digests absent from pin, net +25 units, recorded separately as growth. Remeasure at every sync. Current blob compared to source-blobs.txt immediately before rows; no old approval carried. |
| 3. Area intro placement | P2 frozen map | Intro remains in architecture/h-e53a3a9829a8.md. Root spec owns preamble/H1. |
| 4. Large-section authoring | P3 + exact consumer contracts | At most 55,000-byte passes into same mapped file; no new subdivision. All original heading levels/text, decision ids and RUL ids retained. 41 code-file RUL consumers and exact-heading test remain cutover constraints. |
| 5. Stale text | A19 + explicit Lead A35 note | Deleted modules, retired corpus, moved plans and runner.md:<line> self-citations carried verbatim. Candidate metadata and candidate-unverified/truth ledgers say “Known stale carried sentences; full truth check owed at promotion.” This grants no automatic exception if the independent A28 sample exceeds 10% false. |
| 6. Retired-corpus test | P6 / cutover obligation | Repoint test/docs/decisions-corpus-retired.test.mjs at cutover; preserve assertions and exact headings. No test/source edit now. |
| 7. Coordination phrase / map gap | P2 | No row names the phase text's shared agent-coordination subcomponent. Follow map; gap recorded in owner-queue.md. No inferred boundary change. |

[Exact amendments and old-row receipts](step9-map-amendments.json). **No component-boundary change.**

## Fast verification and honest open data

Scoped fast D/E uses unchanged exported production rules on a working-tree overlay, **one `--scope docs/specs/runner.md`**. Both priors together and each separately give the same results:

| Run | Fast D fatal | Fast E structural fatal | Pending source | Existing gap rows without disposition | Reverse candidate units |
|---|---:|---:|---:|---:|---:|
| both priors | 0 | 0 | 495 | 32 | 62 |
| identity prior | 0 | 0 | 495 | 32 | 62 |
| phase02 prior | 0 | 0 | 495 | 32 | 62 |

**E is not green.** [Raw fast results](step9-fast-check.json) / [reproducible wrapper](step9-fast-check.mjs). This is not native committed-tree coverage, a full D/E run or current native identity proof. Registry unchanged: 61,576,932 bytes, SHA256 `b9b4f20ce368ed76b314e84bce31dc7ee0ac32764e9fe9795bdc8f9424a259e7`. No native sync, carry-forward or persistence.

[32 existing registry gaps](step9-existing-registry-gaps.json) are historical accounting rows distinct from the 495 current source claims; this author pass does not fabricate a witness or successor for them. They must receive bounded evidence-backed disposition/review before strict closure. [Candidate-unverified list](candidate-unverified-runner.json): 62 provisional reverse units plus 119 separately listed known-risk carriage bindings, path/anchor/digest/status and explicit local-identity warning; its three prior sets agree. It is **not** a native five-field equality list; replace/verify it after the next committed native sync. Known stale carried source sections are also explicitly listed in [truth ledger](truth-ledger-runner.json).

Candidate status: **six unresolved relative links**, carried verbatim under A19, zero missing metadata fields. [Raw candidate status](step9-candidate-status.json); [owed repoints](step9-owed-repoints.json). H is not green; links need the planned link pass, post-review edit log and rebind/re-review. No baseline changed. Constitution placement reports 590 files, 589 matched, zero leftover/ambiguous/evidence-without-index, one recorded exception; [raw placement](step9-placement.log). Ratchet clean: 995 legacy files, 26 accounted edits, one accounted new file. Extractor closure and protected source/tool/registry/switchboard bytes equal HEAD; [mutation audit](step9-mutation-audit.json). All 165 active heading-row target anchors resolve; heading titles/levels, rule ids, source segments and all 495 target bindings mechanically checked.

Tests: **44/44 pass**, zero fail/skip/cancel/todo. `env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-decision-conservation.test.mjs test/scripts/doc-decision-review.test.mjs test/scripts/doc-review-format.test.mjs`; [raw tests](step9-tests.log). `git diff --check` passes. Full npm suite is not claimed by this docs-only author checkpoint. MDView MCP is unavailable; no preview registration is performed because the assignment confines writes to the two allowed trees (plus mandatory result outbox).

## Step 8 bookkeeping and next turn

Eight ok verdicts from committed review `41f8a8feb` applied using unchanged ordinary applicator with notes verbatim; [application](step8-last-rationale-application.json). The one remaining rationale now names both deltas: review/approve/run examples **and** the new three-line subcommands bullet absent from source. It stays pending in [one-row re-review](review-request-261015-1653-specs-ui-last-rationale.md). **Step 8 closes when that row is independently accepted and applied.** No changed Step 8 docs bytes or approval carry. Its approved report is pinned through input HEAD ancestry.

Next turn: **run native sync once at this turn's runner commit**, preserving all known ids; compact persistence only under that turn's authorization. Run native D/E with one source scope and both priors together/each, verify native five-field reverse tuples and re-pin all actual target units. Then package bounded A36 source requests (494 Weak-exact, 1 Judgment; reviewer-drawn minimum 75 Weak-exact + the sole Judgment, all changed-digest rows mandatory), separate historical gap accounting, triage, liveness, current-truth and candidate-list requests. No author seed/draw/verdict. **No Step 9 review packs or native sync in this turn.** Requests require an immutable content/decision commit, not the input HEAD substituted for new working bytes.

P5 independent review, P6 final main sync/re-decisions, fresh readers (key first, 3 scenarios / two independent readers), red-team with 0 unresolved High/Critical, alias/link/consumer preview and strict E closure are still owed. Existing Rings holds, A34 residuals, Step 10 root/navigation/digest obligations and full truth at promotion persist. No new owner-direction question; these are explicit unfinished closure dependencies. One author session; 495 current judgments recorded for review, no review round or rework-rate claimed. Writes confined to docs/platform and this plan; scratch /tmp/fgos-work; no secrets, .fgos workspace, lifecycle verbs, git write or legacy-source edit. Mandatory result outbox is the explicit scope exception; needsWrites empty.
