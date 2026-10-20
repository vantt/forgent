# Phase 11 — Retrospective post series

Status: pending. Starts after Phase 10 closes. Owner request, 2026-10-20.

## Overview

The owner wants a series of posts about this month-long documentation work. The series traces the work back to where this plan started, then further back to the repository's genesis. It explains why the work became a month-long process: what was built, what was done, why it had to be done, what it cost, and what was gained.

## Requirements

1. **Trace this plan back to its start.** Find what started plan 260925. The plan was created on 2026-09-26 in `2085d88fe`. Find the investigation, chat, report or failure that led to it, and the documents the plan names as its own input: the current authority map, the frontier reviews and the harness investigation pointer. Quote the evidence that triggered it, not a later summary.
2. **Trace further back to genesis.** The repository's root commit is `f6139bf57` (2026-07-13). Find the first documents written: the foundations laws, the first specs, `docs/decisions/`, and the first knowledge entries. Pay most attention to the **compound** concepts: compound learning, compound engineering, and knowledge that compounds across work. `compound` appears in docs from the first day; `test/e2e/compound-learn-lifecycle.test.mjs` also exists. Record what each concept promised and how it was meant to work.
3. **Find the causal chain.** Explain how the early choices produced the problem this plan had to fix. The early choices are where documents were written, how decisions and knowledge were stored, and the renames, moves and parallel trees. The problem was split authority, dead links, divergent copies and the switchboard bypasses. Every link in the chain cites a commit, a file or a dated report.
4. **What was built and done.** Cover each of Phases 1–10:
   - what it built: the inventory, conservation ledger, minimum constitution, pilots, candidate tree, per-file patch records, checker with probes, write lease and cutover;
   - what it did, and why that step was needed.
5. **The price.** Use measured costs, not impressions:
   - calendar time;
   - Doer turns, reviewer runs, review rounds and rework rates;
   - owner and Lead decisions (A-series, L12-xx);
   - quota stalls, blocked runs and approaches that did not converge (such as the per-edge semantic review before the rule classes moved into the checker);
   - what was abandoned.
6. **The gain.** What the repository has after cutover that it did not have before, with evidence: one authority, a reproducible check, and what a stranger agent can now answer (L5). Also name what was not gained or is still open.
7. **Post series.** Write 4–6 posts, each standing alone and linking to the next. Suggested arc:
   1. genesis and the compound idea;
   2. how docs drifted;
   3. the trigger;
   4. the method and why it was slow;
   5. the cost;
   6. the result and the lessons.

   Tone: honest, concrete, no marketing. Mistakes and dead ends are named.

## Method

- Use read-only research: `git log` (`-S`, `-G`, `--diff-filter=A`, `--follow`), plan reports, owner-answers, the program board and memory notes.
- Run read-only research agents in parallel per era: genesis, middle growth, plan trigger, and plan execution. Each agent returns dated evidence.
- One writer drafts the posts from the evidence pack. One independent reviewer checks every factual claim against its cited source.

## Outputs

- An evidence pack: a dated timeline, the causal chain and a cost table, each row with its source.
- The post drafts, in the location the owner chooses (plan reports by default; publishing is the owner's call).

## Success criteria

- Every claim in the posts has a cited commit, file or report.
- The reviewer finds no unsupported claim.
- The owner approves the series before anything is published.

## Out of scope

- Publishing to any external service without the owner's approval.
- Any change to docs or code.
