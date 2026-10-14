# Report: settled revised packet r4 and impact of the owner request

Role: producer (read-only). Status of everything below: **NOT APPROVED**. This explains the settled packet; it does not replace its advice or claim approval. Owner decisions (2)-(5) are settled inputs; everything else is a recommendation for Lead/owner.

## 1. Verdict (preserved from r4, unchanged)

Two mechanical doors, `fgos workflow start` (pre-planned) and `fgos run` (one Unit, adaptive), on one `runUnit` boundary. Dispatch is a lower tier that knows nothing about Unit or Work. Shortest route:

- **R0** make the Doer path go green (R0.1-R0.5).
- **R1** `fgos run "<prompt>" [--provider X] [--persona Y] [--writes ...]` plus Unit `prefer`/`persona` as a SOFT preference (prepend, keep failover and governance).
- **R2** delete D1 (`dispatch execute <executor>`), D3 (`--assignment`), D2 (`--contract`, folded into `fgos run` without `--writes`) and `dispatch log`; move fanout-batch onto `runUnit`; add an import-guard test; docs edit in the same commit.
- **R3** D7 spawnWorker + D8 operation-choice onto `runUnit`, as its own bounded item with a gate.

R0-R2 deliver N1+N2. Work separation (owner decision 5) is complete only when R3's gate passes, not at R2.

## 2. Impact of the owner request, by question

- **A (target shape, smallest route):** Confirmed. A door is syntax; `runUnit` is the only completion boundary; the one-liner is sugar that builds a one-shot Unit, not a third engine. Order R0 -> R1 -> R2 -> R3.
- **B (who commits):** The runner. Already built (`run.mjs:497-507`, `commitUnitWork`; verified this session). Root cause of the 13:22 probe: the objective told the agent to commit, the agent hit the read-only gitdir, claimed blocked, outcome != pass, so the runner commit was never reached. Rejected: relaxing the sandbox (undoes a deliberate git-metadata decision), Lead-commits-after-review (re-adds a hand-off). Fix = one brief line (R0.1) + scoped landing (R0.2).
- **C (Unit provider/persona):** `prefer: [executorId | {executor, invocation?}]` + `persona`; remove `prefer` from the disallowed list. Soft: prepended to the capability's prefer list; every candidate still passes bind() filters (independence, posture, quarantine/provider-limit, locked-persona). `--override` stays the hard pin. Failover is not removed (owner 3).
- **D (cut Work from dispatch/flow):** Rule: Work depends on flow/dispatch, never the reverse; guard test over `src/workflow/**`, `src/runner/execution/**`, `src/runner/dispatch/**`, `dispatch.mjs`. Now (R2): delete `dispatch log`, move fanout-batch to the Work tier calling `runUnit`. Later (R3, own item, Lead submits when R2 closes): D7/D8. Until the gate passes, the summary must say "N1/N2 delivered, Work separation incomplete".
- **E (lanes):** A closed. B valid, lands as a bind() override on `fgos run`/`workflow start`, not on D1. C valid in the RUL65b-narrowed form (herdr provider-limit classification UNPROVEN). D valid and on the R0 critical path (confinement null R0.4, coverage R0.3, scope observation R0.5). #8 stays at warning.

## 3. Open findings on r4 (attributed, NOT resolved, none is approval)

Reviewer and red-team both returned verdict `findings` on r4. I spot-checked two of them against the current tree this session.

| id | by | sev | finding | spot-check |
|---|---|---|---|---|
| F1 / RT-R4-1 | reviewer, red-team | high | The R3 gate is import-only; dispatch still consumes a Work object (workItem, docsRef, plan.md hash, rigor, domain, refs). The gate can pass while semantic dependence on Work survives. Fix: put those Work-shaped inputs in the inventory and gate; Work supplies generic requirements and content identity; keep rigor monotonicity and stale-plan protection with a regression. | Confirmed: `assignment-runner.mjs:1529-1541` reads `opts.work.docsRef`, resolves the content root and hashes `plan.md`. |
| F2 | reviewer | medium | R0.1/R0.5 expect `commit.sha` / `commit.outOfScope` in unit-summary, but the summary projection has no commit field; the commit lives on the result and attempt record. Fix: name the projection change, or choose the unit/attempt record as the acceptance surface. | Confirmed: no `commit` reference in `unit-summary.mjs`; `run.mjs:504-505` attaches it to the result and attempt only. |
| F3 / RT-R4-3 | reviewer (medium), red-team (high) | | R0.5 warns only from `changedFiles`, which omits edits to files already dirty at launch, so those outside edits never reach `commit.outOfScope`. Fix: observe baseline mutations for mutating runs, or bound the claim to newly dirty paths and keep the docs-only interim pending. | Not re-run; both seats ran a read-only `computeChangedFiles` check with the same result. |
| RT-R4-2 | red-team | high | Unit writes accept `./docs`, `docs//`, `.` without canonicalising; `:(literal)` git pathspec and the raw string-prefix coverage rule disagree on them, so a file can land in the commit yet be labelled out of scope. Fix: canonicalise or refuse at the Unit boundary, one resolved scope for stage/coverage/warning; define repo-root scope; add `./`, `//`, `.` cases. | Not re-run. |

Residual (not findings): index check is point-in-time, so concurrent staging between check and commit is unproven; selective landing can include pre-existing in-scope changes; scope is not authorship.

Also verified: `commitUnitWork` still stages `add -A -- . :(exclude).fgos` (`commit-unit-work.mjs:48`, packet cites :47) and commits the whole index, matching the baseline the packet changes.

## 4. Unresolved dissent (all sides kept)

1. **Measure before building the short door:** r2 framing, panelist-1, panelist-3 wanted to build the shortcut; panelist-2 wanted doctrine first, measure, then build only if needed. Overruled by owner decision (4) plus the 19-turn demand evidence, not refuted. The 19 files show demand, not external-caller coverage; panelist-2's ingress-count risk survives. Mitigation: error message pointing to the new syntax.
2. **Docs-only confinement shape:** framing/panelist-1 = third named posture via bind(); panelist-2 = capability-specific allowlist, fail closed; panelist-3 = no subpath bwrap, worktree + scope-check. Open, none proven; R0.2/R0.5 implement only panelist-3's observe-and-land variant, and RT-R4-3 limits even that.
3. **Order of confinement fix:** panelist-1 before wrapper; panelist-3 inside step 0; panelist-2 after af132275b. Superseded by the new rollout (wrapper and af132275b merge removed by owner), not refuted.
4. **Commit scope:** writes-only + fail closed on a foreign index (producer r3/r4) vs `add -A` (current 5cd01e884). Counter: files legitimately made outside `writes` are left behind. A producer recommendation, not seat consensus; needs Lead/owner confirmation.
5. **D7/D8 timing:** producer defers to bounded R3; red-team RT4 accepts only with a gate and no claim of finished separation. Rollout default under owner question (D).

## 5. Missing expertise (packet's array, preserved; reviewer's addition noted)

- Git index isolation and scoped commit semantics (staged entries, renames, deletions, pathspec magic)
- bwrap / Linux namespace sandbox policy (subpath write binds, git directory handling)
- provider CLI output formats for usage-limit signals (Codex/OpenAI, xai) and herdr provider-limit classification
- caller inventory of D1/D3 across external project installations (migration of deleted doors)
- run-specific filesystem write attribution and concurrency isolation
- Workflow/Work dependency architecture and migration acceptance
- Added by reviewer of r4: Unit summary projection and durable evidence read-contract compatibility
- Added by red-team of r4: canonical pathspec semantics; semantic Workflow/Work migration with rigor and stale-plan guarantees (covered in substance by items 1 and 6)

## 6. One reversible next action

**Lead adds the single brief line for mutating unit-run producers (R0.1): "Only write files inside writes; do not git add/commit; the runner commits after pass." Then rerun exactly the 13:22 probe (`fgos run --unit <yaml> --override {"executor":"openai"}`).**

Why this one: it is the smallest change, independent of every open finding (F1-F3, RT-R4-2), reversible by reverting one line, and its result decides the packet's first reversal trigger. Pass = outcome pass + a runner commit; fail = root cause is elsewhere, revisit B without loosening the sandbox. Caveat: the rerun is UNPROVEN (this read-only seat cannot run it). Do R0.2/R0.3/R0.5 only after the Lead settles F1-F3/RT-R4-2 dispositions (canonical scopes, bounded observation claim, summary surface) and confirms the commit-scope default.

## 7. Unresolved questions

- Does the owner confirm writes-only landing + fail-closed foreign index over `add -A`?
- Is the acceptance surface for `commit.sha`/`commit.outOfScope` the unit-summary (needs projection work) or the unit/attempt record?
- Bound R0.5 to newly dirty paths, or observe baseline mutations?
- Does the R3 gate also cover Work-shaped dispatch inputs (docsRef/plan hash, rigor, domain, refs)?
- Is the lane-C herdr provider-limit classification actually complete?
