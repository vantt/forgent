# Final recommendation: establishing, maintaining and keeping healthy the project portfolio (board, backlog, plans) as the base for short-lived driving roles

I explained the settled revised packet (producer/2, revision 2) and the effect of the owner's request, answered every red-team finding on it (RT-5.1 to RT-5.4) and the tester's new REV-5, and named one reversible next action. Nothing here is approved: the status stays **advice-only**, and nothing in the workspace was changed.

## 1. What the owner request changes

The owner made two decisions on 2026-11-17. Both are binding inputs to this packet, and the packet does not decide them.

- **D-ADR0079** (commit `4a7eb5a54`; heading at line 1964 of `docs/platform/runner/decisions/h-36d872fbb0e5.md` in that commit). In the owner's words: "portfolio/board/backlog/plans là nguồn sự thật của project và đi theo project. Work vẫn là lớp UX…" That is, the portfolio is the project's source of truth and travels with it; Work is the human-facing layer, owns its own conversation data and can be replaced (multica is the example given). What this does to the design:
  - The truth must live in files in the repository: backlog rows, plan directories, record files and a generated board (D1, D3, D6).
  - Nothing the portfolio needs may live only in Work (`verdict.not_included`).
  - Work, or a replacement UI, reads the board and the records. It never writes portfolio truth.
- **Placement decision.** The owner's line on the board, the same day:
  - Build it first as this repository's own tool by promoting `tools/plan-supervisor`, measure it, then move it into fgOS as verbs and skills.
  - Start with `fgos run --pattern solo`.
  - Run state goes through fgOS doors (Event Store facts and holder-lock), never through per-machine files.
  - The engine is Workflow (D-ADR0076).

  What this does to the design: D10 sets the order P1 (data, board, check), then P2 (manual supervisor tick with run facts), then P3 (leader plus solo workers), then a move into fgOS once the N9 measures are in and one project other than fgOS has used the tool. D11 makes the Event Store and holder-lock a named **P2 gate**: today there is no CLI append, no registered portfolio consumer and no registered lock name. P1 does not touch that gate.

Checked against this checkout:
- Local `HEAD` is `882bad7fc` and does not contain `4a7eb5a54`, so this checkout is behind on the decision record. The decision itself exists in the cited commit.
- `tools/plan-supervisor` does not exist yet. Only `origin/plan-supervisor-prototype` exists.
- `fgos workflow start` without `--foreground` hands the run to a detached process (`src/cli/command-registry.mjs:2561`).

## 2. The packet's verdict (unchanged; summarized, not replaced)

**Position:** "Recommended starting design, not adopted and not closed."

- **Establish:**
  - Two authored sources: backlog rows say why; plan directories say what and how.
  - Add-only record files beside each plan, bound to a digest of the plan's declared files.
  - One generated, committed board that holds durable facts only.
- **Maintain:**
  - Every change to a source lands together with its record.
  - The board is regenerated inside the landing commit.
  - CI fails only the plan a change affects.
- **Keep healthy:** a timer-run sweep with no LLM reads the board plus the run facts kept through fgOS doors, and records exceptions.
- **Build order:** first as `tools/plan-supervisor` (promoted, with the prototype's private parser, TTL lock, home-directory state and claim queue replaced by fgOS doors), measure it, then move it into fgOS.

**Confidence, as the packet states it:**
- Medium on the layering: the repository owns the portfolio, the engine owns execution, and fgOS doors own run state.
- Low to medium on the record shapes (D3, D5, D11).
- Low on the continuation rule (D12).

**Design rules D1 to D12 (titles):**
- **D1**: Two authored sources in the repository; every other portfolio file is a record or generated.
- **D2**: The execution envelope is authored inside plan.md frontmatter.
- **D3**: Records are add-only files named by kind and subject digest, not lines in one shared log.
- **D4**: `ready` means published and validated at the same digest, and the validation happens before pickup through an existing door.
- **D5**: Delivery is a record written in the landing commit by the landing step, and the dependency test is against the plan's current digest.
- **D6**: The board is a generated file committed in the repository; a command adds the live overlay.
- **D7**: Upkeep has three parts, and the third one records what it finds.
- **D8**: Each role is one short invocation with one obligation and a named file kind it may add.
- **D9**: Existing surfaces are left, not rewritten.
- **D10**: Placement: this repository's tool first, then fgOS.
- **D11**: Run state goes through fgOS doors: facts in the Event Store, exclusion in holder-lock.
- **D12**: Continuation: the process that started a run is the one that sees it finish, and the sweep is the backstop.

**Short-lived roles, per D8:**
- **boss:** backlog rows and owner decisions.
- **shaper:** locked decisions in the plan directory.
- **planner:** plan.md and its envelope, plus the `published` and `withdrawn` records.
- **validation unit:** a read-only `fgos run` that writes only its report.
- **validation tick:** a tool process (not an agent) that adds the `validated` or `returned` record.
- **supervisor tick:** selects and starts a plan.
- **leader and workers:** work inside the case only and never touch the portfolio.
- **landing step:** writes `delivered` in the landing commit and regenerates the board.
- **watcher:** the sweep.

## 3. Answers to the red-team findings on the revised packet

Each answer below is my proposed correction for the next revision. No seat has reviewed any of them, so none is marked resolved.

### RT-5.1: the observer is not the process the role table starts, and the CLI does not wait
**Accepted.** D8 and D11 say the supervisor tick exits after starting the run. D12 and N15 say a waiting driver process sees the run finish. The CLI default detaches (`command-registry.mjs:2561`). These rules cannot all hold, so the packet's earlier "accepted in part" on RT-4.2 overstated how much was closed.

Proposed correction: **the supervisor tick is the driver**, as one non-LLM tool process. It is short in model tokens, not in wall-clock time. In order, it:
1. takes the holder-lock;
2. re-reads the board;
3. appends a run-intent fact (see REV-2/F27 below);
4. starts the run with `fgos workflow start … --foreground`, or with `fgos run` for a unit, both of which wait;
5. appends the settle fact;
6. on a passed run, starts the landing step.

For a conductor case, the tick waits on the leader's `fgos run`. With this change, D8 and D11 drop "exit" and D12 matches them. The sweep remains the backstop.

### RT-5.2: the validation writer is named, but the commit that makes its record true is not
**Accepted.** Under D-ADR0079, a record that exists only in the tick's working tree is not portfolio truth.

Proposed correction: the validation tick lands the record on the target as a **record-only commit** through the same landing door. The record sits outside the digested subject (D2, N13), so this commit cannot change any digest. Until that commit lands, the board prints the plan as `published` (not validated). Committing the record on the plan's own branch instead is an alternative, and it stays an open dissent option.

### RT-5.3: the verdict still recommends a record scheme that the packet's own N12 breaks
**Accepted.** Remove the sentence in D3 saying that two worktrees never touch the same file, and do not present D3 in the verdict as settled.

Proposed correction:
- Name validation records `validated-<digest>-<baseSha>-<unitRunId>.json` (and `returned-…` the same way). Repeated or concurrent validations then never collide, and every record stays immutable.
- The reader folds them: the deciding record is the one whose base is the newest one reachable from the target. If two validations at the same base disagree, the plan is held with the reason "validation conflict".

This also answers F28 and tester REV-1. It stays OPEN until a seat reviews it.

### RT-5.4: a host-button merge cannot carry a delivery, and the branch names given were not this checkout's
**Accepted, both halves.**

1. **Delivery.** Proposed rule: a plan is delivered only through the landing step. A merge made with the host's button leaves the plan `landed, not delivered`: dependents stay held, and the sweep raises an exception that asks the landing step to write a delivery-only commit naming the merge commit. Whether that later commit is acceptable, given D5's reason ("a later hand commit would survive a revert"), is landing policy. That is missing-expertise item 4 and stays open. The safest alternative is branch protection that makes the landing step the only door to the target for plan work.
2. **Branch names.** `git branch -a --list '*execution-read-door*'` on this checkout lists:
   - local: `p03`, `p13`, `p15`;
   - origin: `integration`, `p03`, `p13`, `p15`, `plan/execution-read-door`, `plan/execution-read-door-decisions`.

   There is no `p01`. The count correction (six remote heads) holds; the names the packet gave are withdrawn. None of these branches was inspected.

### Earlier red-team findings, as the packet carried them
- **RT-4.1 (withdrawn voids delivered):** stated in D3, D5 and D6. It is `accepted; unreviewed` and was not exercised (F20).
- **RT-4.2:** the one-writer half holds (D4 and D8 agree). The observer half is reopened by RT-5.1 above.
- **RT-4.3:** handled by RT-5.4 part 2 above.

### Tester findings still open (high)
- **REV-1 / F28:** covered by the RT-5.3 proposal.
- **REV-2 / F27, a launch with no fact naming it:**
  - Proposed fix: append the run-intent fact {plan, digest, intent id, base} **before** the engine start, and pass the intent id as the request or label of the case or unit. The sweep can then find the run by that id when the tick dies.
  - This depends on the P2 Event Store gate, and on whether the engine accepts an external correlation id. That second point is unverified and needs the Workflow maintainer (missing-expertise item 1).
- **REV-3 / F29:** a validation unit must run in a clean linked worktree checked out at the base commit, and the tick refuses a validation run whose checkout is not at that SHA. This is proposed and has not been exercised.
- **REV-5, new: the backstop's status read cannot see a standalone unit, and an attempt that finishes after its controller dies may wait for an explicit resume.**
  - **Accepted.** `fgos workflow status` reads cases, not standalone units, so the sweep needs a unit-run read door for validation units. Its candidates are the unit's assignment directory and the `fgos dispatch inspect` and `reconcile` reads; this seat did not verify that they serve this use.
  - For cases, the sweep may need to call `fgos workflow resume <id> --foreground` before it can observe the result. This stays OPEN.

## 4. Unresolved dissent (preserved, all still open)
- Committed board versus command
- Scheduled checking
- Legacy plans
- Backlog Status column
- Where the readiness mark lives
- Validation before pickup
- Where the claim for a running plan lives
- Who continues a plan after a run ends
- Whether the record scheme of D3 survives repeated and concurrent validation

## 5. Attributed findings (preserved, with the packet's dispositions)
- **F1** (from critique producer round 2, finding 1): accepted; addressed by D2; unchanged
- **F2** (from critique producer finding 2; red-team RT-1, RT-2.1, RT-3.4): accepted; OPEN. D4 gives a pre-pickup validation through read-only fgos run, which is an agent claim and does not remove the in-case validation. Changed from 'resolved'.
- **F3** (from critique producer finding 3; system seat): accepted; D1 and D6 list outcomes with no plan and partial coverage; advisory only; unchanged
- **F4** (from critique producer finding 4; red-team RT-3, RT-2.2, RT-3.1): accepted; revised in D3 and D5, and corrected again in this revision for the withdraw half (RT-4.1); unreviewed.
- **F5** (from red-team RT-2.3, RT-3.4): accepted in part. D5 states the predicate and requires passed true, evaluator and milestone, but the record is still a committed copy (K3). Changed from 'accepted; predicate stated'.
- **F6** (from red-team RT-2.4): accepted; D9; unchanged
- **F7** (from red-team RT-2.5, RT-3.6; prototype note): accepted in part; D7c, D11 and D12; an engine status read exists as door text, its link to a plan and its meaning for health are missing (K2)
- **F8** (from critique producer finding 5; red-team RT-3.2): accepted; D11, which is now stated as a P2 gate because no CLI append exists and no portfolio consumer is registered
- **F9** (from critique producer finding 6; constraint seat): accepted; D3 publish refusals; unchanged in substance
- **F10** (from constraint seat): accepted; D2 and D10; now a condition of promoting the prototype
- **F11** (from alternative seat): accepted; D3; unchanged
- **F12** (from framing seat; synthesis): accepted; the owner has now stated that every piece of work goes through a plan, so only the timing of enforcement is open (Q2)
- **F13** (from synthesis): rejected as stale; unchanged
- **F14** (from synthesis): rejected; read-only must be declared explicitly; unchanged
- **F15** (from red-team RT-1 (stronger form)): not adopted; unchanged; D4 no longer depends on it
- **F16** (from reviewer/2): noted; a pass of the critique, not of any design; unchanged
- **F17** (from red-team/1 on the first packet, RT-3.3): accepted; D5 and D8; Q3 of the first packet withdrawn
- **F18** (from red-team/1 on the first packet, RT-3.5): accepted; D2, D3, D6, D8
- **F19** (from red-team/1 on the first packet, RT-3.7): accepted; verdict wording and dispositions changed
- **F20** (from red-team/1 on the previous revision, RT-4.1): accepted; D3, D5, D6, N11; unreviewed
- **F21** (from red-team/1 on the previous revision, RT-4.2): accepted in part; writer fixed in D4 and D8; observer named in D12 on door text that was not exercised; OPEN on evidence
- **F22** (from red-team/1 on the previous revision, RT-4.3): accepted; corrected to six remote heads, three also local, none inspected
- **F23** (from red-team/1 on the previous revision, missing expertise): accepted; added
- **F24** (from reviewer/1 on the previous revision, finding 1): accepted; D2, D3, N13
- **F25** (from reviewer/1 on the previous revision, finding 2): accepted; D6, N14; the host-button case leaves the board stale for one commit
- **F26** (from reviewer/1 on the previous revision, finding 3): accepted; D11; the import guard was not checked
- **F27** (from tester/1 on the previous revision, REV-2 (high)): recorded; OPEN; not fixed in this round (outside the fixes this round was limited to). D12 names the window and does not close it.
- **F28** (from tester/1 on the previous revision, REV-1 (high)): recorded; OPEN; not fixed in this round. It bears on D3, D4 and N12 and contradicts D3's sentence that two worktrees never touch the same file.
- **F29** (from tester/1 on the previous revision, REV-3 (high)): recorded; OPEN; not fixed in this round.
- **F30** (from tester/1 on the previous revision (medium)): accepted where it overlaps RT-4.2 and RT-4.3: K2 and the RT-3.6 answer are corrected. The Run Supervisor probes were not read by this seat.

## 6. `missing expertise` (preserved verbatim)
- Workflow engine maintainer: whether a pre-case validation route, an engine-side claim or a clone-visible landing record is planned
- Event Store maintainer: whether a repository tool can append project-scope events today, and seal and sync cadence across the owner's three machines
- Holder-lock maintainer: registering a lock for portfolio selection in the lock registry
- Git landing policy across machines: squash versus merge, revert handling, who performs landings in this repository
- Concurrent add-only record files and a generated board file under git merge across worktrees
- Authority for writing a delivered record that dependents trust after the case is pruned
- Operator of a consuming project outside the fgOS repository
- Operations: scheduling the sweep and delivering its exceptions to a person on the owner's machines
- Owner reading habits: where and on what device the board is read
- Observer of run completion: who or what sees a passed case or a finished validation unit and starts the landing step or the record tick once the supervisor tick has exited (Workflow status and Run Supervisor maintainers)
- Authority to withdraw a delivered plan digest and to decide whether the landed code is reverted with it

This seat proposes one more entry, which is **not** added to the packet's array: a maintainer of the unit-run read path, who can say how a standalone unit is observed and resumed after its controller dies (REV-5).

## 7. Owner questions still open (from the packet)
- **Q1:** a committed generated board versus a command only. The packet reads D-ADR0079 as a committed board.
- **Q2:** when planless runs stop being admitted.
- **Q4:** where the claim for a running plan lives among fgOS doors.

Q3 was withdrawn.

## 8. One reversible next action

**Start P1 only, read-only.**
1. In a linked worktree, branch `tools/plan-supervisor` from `origin/plan-supervisor-prototype`.
2. Replace the prototype's line parser with `src/util/yaml.mjs` `readFrontmatter`.
3. Run the board generator in **check mode** against two or three real active plans. It writes no record files and no board, and calls neither the Event Store nor holder-lock.
4. Measure: how many plans print `draft`, `invalid` or `held`, and what false holds show up.

This tests D1, D2 and D6 and the D3 digest over committed bytes. It does not depend on any open finding: RT-5.1, RT-5.2, REV-2 and REV-5 are all P2 or later.

To undo it, delete the branch and the worktree (`fgos worktree remove`). Nothing on main changes. The record shapes from RT-5.3 should be revised and reviewed before P1 starts writing records.

## Evidence
- Packet: `.fgos/assignments/unit-run-1794898080767-81113980/producer/2/runs/01/outbox/report-1.md` (raw JSON, 74641 bytes).
- Reviews of the packet: the reviewer/2, red-team/2 and tester/2 reports in the same unit run. The tester's file `final-packet-1.json` carries REV-1, REV-2, REV-3 and REV-5.
- Repository checks made for this report:
  - `src/cli/command-registry.mjs:2561`: the `--foreground` text.
  - `git branch -a`: execution-read-door and plan-supervisor refs.
  - `git show 4a7eb5a54`: the D-ADR0079 heading at line 1964.
  - `tools/plan-supervisor` is absent.

## Unresolved questions
- Is a delivery-only commit after a host-button merge acceptable under the landing policy?
- Can a Workflow case or unit carry an external intent id, so that F27 can be closed?
- Which door reads and resumes a standalone validation unit?
- How does the tool reach the Event Store and holder-lock, given the P2 registration gate?
- How is selection kept exclusive across the owner's three machines (N10 is an interim default)?
