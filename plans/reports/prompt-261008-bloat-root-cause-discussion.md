# Handoff: why fgOS keeps drifting and growing (discussion for a separate chat)

Written 2026-10-08 by the lead of the session that ran the advisory plan review. This file is a self-contained brief: a new chat with no history should be able to continue from it. Nothing here is a decision. Decisions belong to the owner.

## 1. The owner's question

"Detect nguyên nhân gì khiến system của chúng ta luôn đi chệch hướng và phình to; hãy nhìn từ genesis." Triggering facts the owner gave: weeks lost to a coordination engine that ended too heavy and was abandoned; the lesson "a 150-line skill over existing primitives beat a 70k-line harness"; a document-unification phase 2 that produced a one-off tool of "more than 17,000 lines" which lead agents cancelled; and the advisory completion plan, two days in, Phase 02 still unfinished.

## 2. What the new chat should do

Act as a critical discussion partner, not an implementer. Challenge the causal story in section 5, test the opposite hypothesis, and help the owner decide what, if anything, to change. Do not edit locked laws, do not build guardrails, do not write long new documents before the owner decides. Every proposal must state its own weight (lines or files added) and how it could be gamed or turn into the next heavy system.

## 3. Evidence to read first (all in /home/vantt/projects/forgentX/plans/reports/)

| File | What it is | Reliability note |
|---|---|---|
| `opus-genesis-drift-forensics-261008.md` | Independent forensic report from genesis: growth curve, four episodes, eight structural causes, twelve ranked guardrails | One agent's analysis. Several figures I checked (below); the rest are its own. States what it could not check |
| `archive/reports/opus-advisory-adjustment-redteam-261008.md` | Independent red-team of the proposed correction to the advisory plan | Measured with git numstat; did not check whether main's dispatch can finish a live run |
| `archive/reports/kongming-advisory-plan-review-261008.md` | Second opinion, verdict "continue with cuts" | Could not read the worktree diff; its numbers were supplied to it |
| `archive/reports/opus-advisory-phase02-review-261008.md` | Independent review of advisory Phase 02 (request changes) | Spec compliance first; lists unproven items |
| `/home/vantt/projects/forgentX-worktrees/advisory-capability-completion/plans/261006-1408-advisory-capability-completion/reports/owner-challenges-and-rationale.md` | The owner's own questions when the advisory plan was split off, including "will bringing it back bloat the system" | Primary source for the plan's original intent. Lives in a worktree that is not on main |

## 4. Numbers the lead verified on 2026-10-08

- Tracked files 7,416. Lines: `docs/` 804,280 (59.6 MB), `archive/` 184,254, `plans/` 181,910, `test/` 162,164, `src/` 82,201 (3.7 MB), `packages/` 26,688, `apps/` 18,285; `.fgos` 34.8 MB of committed state.
- `docs/architect` and `docs/platform`: 938 files at the same path, 868 byte-identical.
- Commits 2026-08-01 to 2026-09-01: about 5,270; about 2,431 start with `docs(tsk`; about 279 start with `feat`.
- Coordination engine retirement commit `2180b4e72`: 186 files, 489 insertions, 79,186 deletions.
- Advisory Phase 02 working tree against base `71043949d`: +4,414/-790 over 51 files at the first measurement; source +1,432/-344, tests +3,259/-410. About 60 percent of the source growth is in the dispatch/herdr/confinement layer, which the plan's own exclusions name. The work was still uncommitted two days in.
- A grep of the repo found no enforced line, size or time budget in plans, source, tests or scripts. The only budget-like mention found is a documentation setting outside the repo.
- Not verified by the lead: the forensic report's growth curve over time, ages and sizes of retired subsystems, the session counts, the 21k figure for the document-unification branch (the owner said 17k; the forensic agent counted about 21k and says the tooling is frozen on its branch, not deleted).

## 5. The causal story to challenge (from the forensic report; confidence is the agent's)

1. The founding laws point fgOS at improving itself: L6/F5 puts "self-improving" at the top rung and L5 defines done as a documentation test; the mission boundary (do not develop itself) came about 35 days later as prose with no metric (high).
2. All-or-nothing completeness clauses ("all seven gates, phase stays blocked, no deferral"; "every claim accounted for exactly once") together with RUL11 ("gom tới khi hết; quy mô không bao giờ là lý do miễn trừ") remove size as a reason to stop (high).
3. Every review finding becomes a phase and new code; no review says "delete" or "descope" (high).
4. Producing proof artifacts counts as progress (high).
5. Plans are locked before any live run, so a blocked live gate leaks work into other layers (medium-high).
6. Agents mark their own work done; diagnoses stay as reports, and a line-count cap proposed on 2026-09-29 was never built (medium-high).
7. Plans split and reopen with no parent that owns the total (medium).
8. The same job gets built twice (three sequencers, two identical doc trees) (high).
Where heavy machinery paid for itself, per the same report: the JSONL state layer, fixes for real reproduced races, `bind()` and the Workflow runner.

## 6. Where the story is weakest (start here)

- **RUL11 as a cause is inference.** No agent was seen citing it to justify extra machinery. The all-or-nothing plan clauses may be the real driver and RUL11 only added pressure.
- **Genesis reading.** "Founded as a self-improving harness" is an interpretation of founding documents. The README says "platform layer for building and running agent applications". Check whether the early repo really had no outside project.
- **Selection bias.** The episodes examined are the failures. How many plans of similar shape finished small and clean, and what was different?
- **The lead's own contribution.** In this session the lead also added plans, a spec section placed in the wrong document, and review notes that asked the advisory agent for more tests and code, with no budgets on any of them. The same pattern applies to reviewers and leads, not only to implementers.
- **Guardrails can become the next system.** A pre-merge budget script, a doctor row and new review sections are themselves code and process. Ask which single guardrail has the best effect per unit of weight, and whether doing nothing but writing one budget line in each plan header is already most of the benefit.
- **Incentives of the agents.** Acceptance clauses that block a phase reward manufacturing evidence (the controlled worker loss in the advisory plan is the example). Is the fix to change the clause, to change who accepts, or both?

## 7. Decisions waiting for the owner (only the owner decides)

1. Whether to supersede L6/F5 (a locked law: needs a new decision id, no in-place edit).
2. Whether and how to reword the operative clause of RUL11. Option floated, not applied: "gom lại trong ngân sách đã ghi ở đầu plan; vượt ngân sách thì dừng và hỏi lại".
3. Which guardrails to adopt. The forensic report's minimum set: a one-line size/time/allowed-paths budget in every plan header; a pre-merge script under 100 lines that checks the diff against it; a mandatory "what to delete or descope" section in every review; a doctor row that fails when documentation of a retired component remains.
4. What to do with the 31.8 MB of committed logs and JSON evidence and the duplicated documentation trees (868 identical files).
5. Whether the same budget rule applies to plans and documents written by leads and reviewers.

## 8. Not known

Cost in hours or tokens; engine sessions in other repositories; exact birth dates of some retired subsystems; whether main's dispatch can finish a live advisory run without the split-off fixes.

## 9. Prompt to paste into the new chat

```
Read /home/vantt/projects/forgentX/plans/reports/prompt-261008-bloat-root-cause-discussion.md and the files it lists in section 3 before answering. You are a critical discussion partner for the owner, who writes in Vietnamese and is addressed as "anh" (you are "em"). Do not implement anything and do not edit locked laws. Start from section 6: challenge the causal story, test the opposite hypothesis, and tell the owner which of the eight causes you would still bet on after your own checks, with the evidence you re-read yourself. Present your analysis in text before asking any question or offering options. Keep each proposal to a weight statement (lines or files added) and a note on how it could be gamed. Report what you could not verify.
```
