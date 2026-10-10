# Opus review: advisory capability completion, Phase 02 (2026-10-08)

Scope: working tree of `/home/vantt/projects/forgentX-worktrees/advisory-capability-completion` (branch `feat/advisory-capability-completion`) against base `71043949d`. 51 tracked files changed (+4414/-790), plus 4 untracked plan/journal files. Read-only review. The worktree was stable for the whole review: `git status` showed the same set at start and end, and no writer was observed. The only scratch use was `/var/tmp/opus-phase02-scratch`: one restored guard test, run against symlinked read-only source, then removed.

Diff provenance:
- **Phase 02 runtime work:** `src/workflow/*`, `src/runner/execution/{run,handoff-refs,patterns/panel}.mjs`, `src/runner/dispatch/{assignment-runner,herdr-round,herdr-reconcile,settlement,transport,cli,assignment-layout}.mjs`, `confinement/{authority,cleanup,request}.mjs`, `src/setup/agent-cli-trust.mjs`, `bin/fgos.mjs`, `src/cli/command-registry.mjs`, with their tests and the runner/confinement/handoff specs plus CHANGELOG.
- **Operator repair recorded in the execution report ("scoped MCP restriction"):** `.fgos/config.json` (`--strict-mcp-config` on the claude bwrap invocation).
- **Machine-generated, not a patch:** the `AGENTS.md`/`CLAUDE.md` GitNexus block was renamed to `forgent-advisory-capability` with new symbol counts. This is GitNexus regeneration inside the worktree.
- **Bookkeeping:** files under `plans/`.

## 1. Spec compliance

Checked against phase-02-early-runtime-feasibility.md, "Early vertical-slice experiment" items 1-7.

| Gate | Verdict | Basis |
|---|---|---|
| 1 Three blind shapers, objection traced into the final advice | PASS (not re-derived) | Not re-traced end to end. Execution report sections 194-206 and the artifact layout are consistent. |
| 2 Exact final-packet red-team | PASS | `sha256sum` of `75b988…/producer/2/runs/01/outbox/report-1.md` = `bab4742a…68c3`. The reviewer/2 and red-team/2 briefs and reports both cite `bab4742a`. Reviewer/2 found F1 and red-team/2 passed; the two results are kept separate. |
| 3 Late specialist: after critique, during recommendation review, used downstream, **honest unavailable/refused** | **PARTIAL. The claim of 7/7 is overstated.** | See findings F-1 to F-3. The positive specialist cases are real. The unavailable case shows that the **Core** fails closed. It does **not** show that the advisory flow handles unavailable expertise: the "honest limited advice" was scripted by the lead in the objective and fed by evidence written by the observer. |
| 4 Real findings reach explanation and close; failures are not accepted | PASS | Negative root `84e3de9e`: `acceptOutcomes:[pass,findings]` did not accept `execution-failure`, `step.fail`/`workflow.fail` were emitted, and the dependent step had no `step.start`. The deterministic test "findings opt-in … execution/no-evidence/refusal stop downstream work" was added. |
| 5 Interrupted multi-role Unit reconnects | PASS (with gaps, see F-5 and F-6) | The command records in `75b988…` match the claim. reviewer/1 = `wS:p48W`/3551175 and red-team/1 = `wS:p48X`/3551207. Both are `reconciled` with handoff `submitted`, every role has only `runs/01`, and the epochs are 3 and 5. producer/1 result `658a570e…9ec9` and report `6900ddb2…76e` match the claim. |
| 6 Clarification, material turn, close, provenance and budgets | PASS (not re-derived) | Report only. Not re-verified beyond the gate-answer refs in the definitions. |
| 7 Real worker write denied while its outbox settles | PASS (as narrowly claimed) | Not re-run. The report itself limits the claim to `r+` EROFS on the named files. |
| Separate limited-advice continuation | Valid as an **explainer** run, invalid as Gate 3 proof by itself | Root `5a04c709` completed. Its objective dictates the conclusion it should reach (see F-1). |

SHAs I checked myself, all matching:
- negative `result.json` `2f386692…fc87`
- ack `49789555…1d`
- packet `bab4742a…68c3`, identical in `630a55…/inputs/17-producer-r2.md`
- `inputs/21-…evidence.json` `33492584…024e`

The negative Unit has only `runs/01`, and its outbox contains only `ack-1.json`.

## 2. Findings

### F-1 High: the Gate 3 "honest unavailable expertise" result comes from the lead's prompt, not from the advisory flow

Artifacts:
- `.fgos/workflow-runs/wf-run-1791423462653-5a04c709/events.jsonl` seq 1: `template.objective` and the contextRef `.fgos/runtime/tmp/advisory-g3-negative-public-evidence.json`
- the captured copy of that evidence, `630a55…/inputs/21-…json`

**What happened.** The continuation's objective already contains the verdict: "State the cause explicitly: controlled worker loss, NOT quota/provider-limit, natural provider outage or expert refusal. No expert findings were received…". Its key evidence input says of itself `"authorship": "observer-authored projection"`, and the experiment's own observer wrote it to `.fgos/runtime/tmp`. Report §0.1 repeats those labels ("Nguyên nhân: mất worker có kiểm soát", i.e. cause: controlled worker loss). The only independent check the worker made was hashing `result.json` and listing `runs/`.

**Why the runtime cannot produce this honesty itself:**
- Core classifies the loss as `failure.family: provider`, `code: nonzero-process-exit`, `exitCode: 1` (synthesized: `exit.json` shows exitCode 1 for a pane that simply vanished), `outcome.category: infra`, `policy.disposition: needs-input`.
- Read from the machine record alone, this event looks the same as a provider crash, and the policy disposition points toward asking a human.
- There is no first-class ref for "the outcome of this failed Unit". `reportRefOf` (`src/runner/execution/handoff-refs.mjs:59-80`) resolves `unit-run:` to a settled report, or falls back to the first evidence artifact, so a failed Unit gives an ack file or nothing.

**Failure scenario.** In Phase 03 the skill hits a real unavailable specialist. Either:
- (a) it has to hand-author a projection file, which is the same lead-authored evidence channel with no validation, or
- (b) it reads Core's `provider` / `needs-input` and reports a provider outage or parks for a human.

Neither path is what was proven.

**Impact.** Item 3's "honest unavailable … without inventing a human turn" is proven only for a lead who already knows the answer. The real routing (failed specialist segment → limited-advice explanation) and the distinction between worker loss and an expert refusal have no runtime or contract owner.

**Permanent check.** Add a deterministic Workflow test in which a failed specialist Unit feeds a limited-advice consumer only through a runtime-owned ref (for example a `unit-outcome:<unitRunId>`-style capture of the Core failure record, without tokens). Assert that the consumer input states the failure family and the "no report" fact without any lead-authored file. If the owner decides this should stay skill-side, Phase 03 must name the skill's evidence source and how it is validated, and Gate 3 must be restated as "Core fail-closed proven; advisory handling deferred to Phase 03".

### F-2 Medium: the negative replay did not exercise the real segment shape or the real pass budget

Artifact: definition of `84e3de9e`.

- **Isolated from any pass.** The replay ran a lone `solo` specialist outside any advisory pass, explicitly "not another intervention in material pass2". It is followed by a step with zero units (`must-not-close-after-failure`), not by the "specialist + affected reviewed recommendation segment BEFORE explanation" that the plan requires (Finite boundaries section).
- **Positive review-gap case confounded by the owner's answer.** The positive review-discovered specialist (token contract, pass 2) ran only after the owner answered option 2, which consumed material reopen 1/2. The corrected explanation names both causes.
- **Result.** No run shows a review-discovered gap starting a specialist within the advisor's own one-per-pass budget, with no owner involvement. The negative replay, the one place where an F1 gap drove a specialist, was deliberately placed outside every budget.

**Impact.** Item 3's "also cover a gap first exposed during recommendation review" is satisfied only with an owner turn in the causal chain. The one-specialist-per-pass rule was never exercised on the failure path.

**Permanent check.** No new test is needed. Phase 03's canonical definition should be replayed once with the specialist inside its real segment and budget. This could ride along with Phase 04's installed-entry repeat.

### F-3 Medium: the test that keeps the enumerator-guard allow-list from going stale was deleted without replacement

File: `test/runner/assignment-enumerator-guard.test.mjs`, which loses the test "every allow-listed assignment listing still exists with its count…".

The execution report says "Existing enumeration guard stayed unchanged". It did not stay unchanged: the stale-allow-list test is gone.

I restored that test unchanged in scratch against the current source, and it **passes** (1/1). Deleting the `herdr-reconcile … readdirSync(od)` entry alone was enough, so the test deletion was unnecessary.

**Failure scenario.** An ALLOWED key whose listing is later removed keeps its allowance. A new, unreviewed listing with the same function and variable name is then admitted silently. This is the known key-reuse evasion.

**Permanent check.** Restore the test verbatim.

### F-4 Medium: worktree-generated instruction surfaces must not merge

Files: `AGENTS.md:206,230-233` and `CLAUDE.md` (same block).

The GitNexus repo name became `forgent-advisory-capability`, with new counts. Merged to main, every agent would query a non-main index.

`.fgos/config.json:1292` adds `--strict-mcp-config` to the project config only:
- users installing fgOS on other projects do not get it;
- it is not registered in setup or doctor (AGENTS.md install gate).

The report calls it a scoped repair. It still needs an explicit decision: keep it as a project-local override, or move it to the shipped default plus a doctor check.

**Permanent check.** None is worth building for the GitNexus block (GitNexus regenerates it). Handle it in merge review by reverting those hunks.

### F-5 Low/Medium: crash between `freezeHerdrBrief` proof publication and the command patch leaves a stuck, unbriefed live worker

File: `src/runner/dispatch/herdr-reconcile.mjs:143-167`.

`publishImmutableProof(…brief.json)` runs first, then `patchCommandRecord` writes `briefHandoff` together with `resourceIncarnation`/`paneId`. A controller death between those two steps, or anywhere between pane launch and the freeze, leaves a command with no incarnation:
- reconcile returns `parked: incarnation-unknown`;
- `resumeBrief` is false, so there is correctly no rebrief and no duplicate;
- but the live pane idles forever with its private HOME (a login copy) retained by `bindOwnedPane`.

What the Workflow does with that parked Run (fail, or remain nonterminal) is untested. The existing test "proof publication failure after startup cleans the owned unbriefed worker" covers a live controller, not a crash.

**Permanent check.** Add a deterministic test that crashes between proof and patch, asserting: no submission, a terminal or explicit refusal reason at the Workflow layer, and HOME reaped once the pane closes.

### F-6 Low: `patchCommandRecord` is read-merge-rename without compare-and-swap; phase transitions rely on Run-control exclusivity

Files: `src/runner/dispatch/proof-helpers.mjs:214-229` and `herdr-reconcile.mjs:197-213`.

`transitionHerdrBrief` reads the phase and later rewrites the whole record. If recovery holder P1's Run-control TTL lapses during `awaitPromptReady` (up to 60 s), P2 can acquire control and rebind the command epoch. P1's in-flight rename then overwrites P2's epoch patch (a lost update) and P1 sends.

The window is tiny:
- the sync section runs after `requireCurrentControl`;
- it requires a TTL expiry;
- the test "competing recovery entering submitting during readiness" covers the ordinary interleaving.

Separately, in the initial `driveRound`, a stale-token transition failure inside `beforeSubmit` lands in the catch that calls `cleanupIfWorkerStillLive`. A slow original controller that has lost control would kill the pane that a newer recovery owns. This is UNPROVEN; it depends on the TTL and heartbeat, which I did not read.

**Permanent check.** No new test. Either add a phase/epoch precondition re-read immediately before the rename, or document that brief transitions require an unexpired Run-control lease, and assert the lease TTL is greater than the readiness bound.

### F-7 Low: the pane-loss failure text is false and the HOME retention is keyed on it

Run `8c17e0…/producer/1/runs/01/stderr.log` says "Pane wS:p495 is left open. Private home kept for the open pane". Herdr had already reported that pane `not_found` three times.

`paneFateFor('died')` → keep → `paneRetained` → `retain()` (`confinement/authority.mjs:1232-1242`). The credential-bearing HOME is then left for the reaper rather than removed by the owner. `/tmp/fgos-confinement/` was empty in my view, which suggests it was reaped, but my sandbox view of `/tmp` may differ.

**Permanent check.** Add a unit assertion that a `died` decision with a not-found pane yields `paneRetained:false` and immediate owner HOME removal.

### F-8 Low: documentation and wording drift

- `docs/specs/runner.md` (new paragraph at the end) still says "…still require all seven live scenarios". CHANGELOG says "Live advisory recovery … remain unverified". Both contradict the plan's "7/7 ACCEPT; Phase 02 complete".
- The plan says the continuation "completed honest limited advice". It completed a lead-specified honest explanation (F-1).
- "Independent `sha256sum`" in the execution report: the hashes do check out (I reproduced them). Hash identity proves byte equality, not independent judgement.
- The negative and continuation Workflows reuse the owner's earlier turn "Chỉ phân quyền bằng token" ("authorize only by token") as `request`, the field the plan reserves for the newest human turn. Their descriptions disclaim it, but a reader of `request` sees a human instruction the owner never gave for these runs.

**Permanent check.** None beyond fixing the text.

### F-9 Info (pre-existing, not introduced here): control tokens are on disk in readable places

`controlToken` appears in plaintext in `result.json`, in Workflow `events.jsonl` (`unit.complete` → `runResult`), and in the `control/generations` ledger.

The continuation worker ran in the caller cwd and hashed the raw `result.json`. "Control authority is not copied into its input" is true for the input but not for what the worker could read. The routing/handoff contract already states non-blind workers can read the host (`--ro-bind / /`), and the token is stale after settlement. Not counted against Phase 02.

### Test removals

- **`assignment-runresult.test.mjs`, roughly −270 lines.** These tests exercised a copy of the classifier kept inside the test file, never production code. Deleting them loses no real coverage. The replacement drives production `executeAssignment` through a findings parameterisation over done/read-only and done/verified-mutating, which is stronger. Accept.
- **`assignment-enumerator-guard.test.mjs`, −13 lines.** The entry removal is justified. The stale-test deletion is not (F-3).

## 3. Verification gaps

**Proven wrong:**
- "Existing enumeration guard stayed unchanged" (F-3).
- "Gate 3 ACCEPT" as a statement about the advisory flow: the honesty came from the lead and observer (F-1). As a statement about Core fail-closed behaviour it holds.
- The runner.md and CHANGELOG status lines contradict 7/7 (F-8).

**Not proven (I did not check, or could not):**
- The Gate 1 and Gate 6 objection and provenance traces, read end to end.
- Gate 7 syscall evidence.
- The 204-test focused run and the 7,020-test full `npm test`. I did not run them; I took them on trust and did not re-run them.
- Workflow-level behaviour for a Run parked as `incarnation-unknown` (F-5).
- The Run-control TTL versus the readiness bound (F-6).
- Whether the negative case's private HOME was actually reaped (F-7).
- The `prepareUnitRun` deterministic-identity crash recovery beyond reading its diff, the `--definition` freeze, and the capture/hash refusal paths. For these I read only the test names.
- The pre-fix "before" hashes for producer/1. I can confirm only that the current bytes equal the claimed value.

## 4. Verdict

**Request changes.** Phase 02 should not be marked complete at 7/7.

The native brief-recovery state machine (Focus A) is sound on the paths I traced:
- the phase moves forward only, and the phase is written durably before any send;
- a submitting, ambiguous or legacy record never rebriefs;
- ack and result outrank the phase;
- incarnation, cwd and evidence are re-fenced before the transition;
- recovery re-issues the control epoch from the generation ledger;
- the live artifacts show the same panes and PIDs, only `runs/01`, and an unchanged settled producer.

Required before approval:
1. Restate Gate 3 honestly. Accept the Core fail-closed and positive-specialist evidence. Record that handling an unavailable consultation inside the advisory flow (runtime-owned failure ref, or a named and validated skill evidence source, with no lead-scripted verdict) is still open. This becomes an explicit Phase 03 entry condition (F-1, F-2).
2. Restore the stale-allow-list guard test (F-3).
3. Before any merge, revert the worktree GitNexus `AGENTS.md`/`CLAUDE.md` hunks. Decide the `--strict-mcp-config` placement against the install/doctor gate (F-4).
4. Fix the runner.md and CHANGELOG status lines (F-8).

F-5 to F-7 can be follow-up tests. They do not block.

This review does not authorize Phase 03 or Phase 04.
