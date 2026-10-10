# Analyst for CURRENT: advisory approach at end result (2026-10-08)

Read-only. W = `forgentX-worktrees/advisory-capability-completion`, diff vs `71043949d`. Re-measured 13:59: **51 files +4871/-791; src +1432/-344; test +3259/-410; docs+changelog +61**. Last src write `store.mjs` 11:36. Plan folder 967 lines (~190 KB, execution report alone 88 KB). 26 Workflow roots made for proof. **Nothing is committed, on main or usable through a skill: shipped product = 0.**

## 1. Scores, CURRENT vs BASELINE

**(a) Function** (proof: execution report E, Opus review R)

| Goal | BASELINE (main) | CURRENT |
|---|---|---|
| 3 distinct shapers | Partly: blind panel, but `panel.mjs:66` drops `params` so seats get the same task | Achieved live: Claude, Codex and Gemini blind reports (E:188), objection traced into final advice (E:205, Gate 1) |
| Red-team of FINAL recommendation | No: synthesis is an unreviewed `solo` after critique; the settlement bug turned findings into pass | Achieved: packet `bab4742a` byte-equal in both checker inputs, re-hashed by R (R:18) |
| Specialist on real need | No: the skill promises a retired API | Partly: positive after critique (E:201) and at review (E:215, but the owner's turn was in the causal chain). The unavailable path and the per-pass budget were never exercised in-flow (R F-1, F-2) |
| Bounded dialogue + close | No close gate in the YAML | Achieved in API prototypes (reopen 1/2, zero-Unit close, E:239,249). Driven by lead and observer scripts, **no skill exists** |
| Verbatim human words | Partly: one `request` | Achieved with captured digests. The request was mis-persisted twice by the lead, then patched with a new store event (E:284) |
| Read-only confinement | Existing bwrap | Same mechanism, proved live with EROFS on `r+` (E:150) |

**(b) Stability.** Real gains: fail-closed handling of execution failure (Gate 4), recovery after a controller crash with no duplicate worker and only `runs/01` (R:21), and a HOME lifetime fix. Fresh full suite: 7029 tests, 0 fail (E:306). Risks:
- **Blast radius beyond advisory.**
  - The settlement verdict change (`settlement.mjs` ~L319) now reports real findings. The `reviewed` pattern in `business-discussion`, `group-cognition` and the registered `architecture-advisory` has no `acceptOutcomes`, so those workflows may now loop more revision rounds or fail at maxRounds where they used to pass. This is correct but changes behavior. No live run of those workflows exists: UNPROVEN.
  - Edits warned CRITICAL by GitNexus: `executeAssignment` 48 symbols/45 flows, `reconcileHerdrSpawnRun` 14/19, `buildConfinementRequest` 14/47 (E:229). Every herdr run passes through these.
- **Open defects.** Two HIGH isolated-session gaps (E:312). The fence in F-6 is not a true CAS (E:298). Branch base is behind main and needs another rebase.
- **Determinism.** Phase 03's design has an LLM driver pick the next graph and keep round state in `Workflow.description` labels (phase-03:30). That is non-deterministic by design.

**(c) Fast and light** (foreground wall time only; cost was never observed)

| Scenario | Starts / Units / assignments | Wall time | Source |
|---|---|---|---|
| Normal pass to close | ≥4 + 2 zero-Unit clarification roots | ~2,350 s (~39 min): shaping ~462 s (E:187-188), critique 782, specialist + recommendation 959, explanation 143 | E |
| Material continuation | 2 / 3 / 8 | 1,605 s, includes deliberate crash and reconnect | E:253 |
| BASELINE | 1 start | never completed live: 204 s, then failed at shaping (E:119) | E |

Operational burden:
- a project-local `--strict-mcp-config` override (absent from main's config);
- trust seeding for each provider account;
- a quiet checkout with no concurrent writers (E:97,121).

**(d) Flexibility.** Main already does in-workflow multi-round deliberation: `template.inputs`/`sameSeat`/`anonymizeInputs` (`runner.mjs` main:55-66, `delphi.yaml`).
- **Rebuttal debate:** 1 YAML (~50 lines) + small skill. Needs contract 1 (pro/con tasks) and contract 4 (a judge's findings). Both are in THIN.
- **Council-lens:** its plan states no runtime change; it names contextRefs + findings routing only for cross-exam and split-to-human (plan.md "Scope out"). Also both in THIN.
- **What CURRENT adds:** `--definition` (unregistered ad-hoc graphs: good for experiments, but bypasses registry review and any size cap), byte-capture freeze, and durable reconnect. Neither form needs them.
- **What CURRENT closes:** the driver-per-form pattern would cost N drivers if copied for each new form.

## 2. Build diagnosis

| # | Blocker | Root cause | Advisory-specific? | THIN hits it? | Fix |
|---|---|---|---|---|---|
| 1 | Claude stuck on MCP dialog (E:59-73) | target `.mcp.json` | generic | **Yes** (main lacks the override) | diagnosis capture + local config |
| 2 | "Read outside working dirs" (E:89-91) | captured ref dir not in `--add-dir` | caused by contextRefs | Likely (keeps refs-lite) | `cli.mjs withRunDirReadAccess` |
| 3 | OpenAI quota quarantine (E:95) | environment | no | Maybe | owner added account `tetcu72` |
| 4 | Codex `TERM=dumb` (E:110) | harness non-TTY | no (harness) | If same harness | run from parent PTY |
| 5 | Resume refused `run-unreconciled` (E:113) | receipt without runResult | generic recovery | No (no crash gate) | `assignment-runner` collector |
| 6 | Folder-trust dialog, wrong account (E:114,152,198) | trust seeding read legacy `CODEX_HOME` | generic | **Yes** | `authority` / `agent-cli-trust` + manual trust entry |
| 7 | Baseline contaminated (E:119) | concurrent fgOS writers | process | Avoidable | serialize |
| 8 | HOME reaped under open pane (E:141) | no early lifetime binding | generic | Rare | `cleanup.mjs` |
| 9 | 6-7 suite failures (E:161,170) | reaper probes bare `herdr`; foreign session | generic | No | `cleanup` |
| 10 | Findings settled as pass (E:191) | classifier | generic, load-bearing | **Yes** (keeps fix) | `settlement.mjs` |
| 11 | Idle workers after kill, 1,801 s timeout (E:217) | incarnation stored before brief | generic | No | brief state machine, ~400 lines |
| 12 | Wrong cwd, ref base, `RUNNING` case (E:218,241) | lead/observer scripts | process | Fewer (installed entry) | redo |
| 13 | No natural unavailable expert (E:261) | gate demands a scenario that did not occur | caused by the acceptance clause | No (drops it) | engineered loss → review F-1 → new `unit-outcome:` ref required |
| 14 | Wrong `request` persisted (E:284) | lead error | process | No | **new store event** |
| 15 | Two HIGH isolated-session gaps (E:312) | ambient herdr session | generic | No | open |

**Why it does not finish.**
- **Inside the design:**
  - The segmented multi-start driver needs cross-run refs, capture, `--definition` and reconnect.
  - An autonomous in-flow specialist needs an unavailable-expert path, so a new ref type.
  - Each was a plausible repair, and together they are self-feeding.
- **In how it is run (dominant):**
  - "All seven live, no deferral" (phase-02 exit) turned every environment or dispatch failure into in-branch runtime work: rows 1, 5, 6, 8, 9, 11, 15, i.e. 61% of src.
  - The plan's own exclusion "no transport/confinement change" (plan.md:100) was never re-evaluated (E:17 still denies it).
  - No size or time budget; the complexity ledger counts starts, not lines.
  - The lead certified 7/7, the reviewer cut it to 6/7, and each review added deliverables.
  - The proof environment is shared: quota, trust, concurrent writers.

## 3. Strongest honest case for CURRENT

- **The runtime is not an engine.** No second store, scheduler or registry; review R found the brief state machine sound (R:174-180).
- **Most of the src is real generic defect repair** that any live run on herdr meets (rows 1, 6, 10, 11). THIN's single live run on main will re-hit rows 1 and 6, so THIN's "if blocked, report, don't patch" likely becomes BLOCKED on day one.
- **The work is already built and green** (7029/0). Discarding it re-opens known defects.
- **It is the only approach with live evidence** of a final-packet red-team that caught real defects: a fabricated TLS consensus (E:202) and an overstated SKILL.md claim (F1).
- **The autonomous specialist serves priority #2.** In the one real case, 1 autonomous need arose (E:201) and added useful RFC-grounded limits.

Guarantees THIN loses, and whether the owner would miss each:
- **Autonomous specialist:** mildly. One extra batched owner turn plus a reopen start (~16 min) per need.
- **`--definition`:** no.
- **Byte capture:** no; the single user rarely edits mid-run.
- **Durable association and launch-before-brief recovery:** yes, but only on crash, and they are generic. **Land them separately, do not drop them.**
- **Seven-gate assurance:** no; the owner judges by results.

**Honest net.** The valuable part of CURRENT is the runtime fixes, not the CURRENT approach. Finish the runtime as a reviewed dispatch/runner item (rows 1, 5, 6, 8-11) plus contracts 1/4. The Phase 03 driver is where the risk lies.

**Drop CURRENT if:**
1. the Phase 03 skill exceeds ~250 lines, or the driver needs state beyond the stored ids;
2. a merge requires `unit-outcome:` or the isolated-session identity contract;
3. a THIN live run gives advice the owner rates equal;
4. Phases 03/04 are not closed by 2026-10-10.

## Unresolved

1. Do `business-discussion` and `group-cognition` now fail or loop more after the settlement fix? Needs one run each.
2. Can main complete one live advisory run without rows 1 and 6? UNPROVEN.
3. Gates 1/6/7 traces not re-derived by me (relied on R plus E).
4. Shaping wall time is inferred from E:187-188 timestamps.

## Round 2

**(a) Concede (verified on main):**
- **Reopen needs a new input.** `workflow start` accepts only an id, `--plan` or `--request` (`bin/fgos.mjs:2172-2183`), so a reopen needs a `--context-ref` start input.
- **The blind-input read defect is on the plain path.** Main copies blind inputs into `inputs/` (`run.mjs:315`), but `--add-dir` grants only `runDir` (`cli.mjs:241-244`).
- **Speed is about equal:** 36 vs 39 min. CURRENT gains no wall time.
- **Flexibility favours THIN.** A debate needs only YAML plus panelist params.
- **My earlier wording was off:** the MCP blocker is configuration, not code.

**(b) Wrong or unproven:**
- **"Resume, owner re-starts" understates the crash cost.** The Unit is linked to the Workflow only after the run returns (plan.md:38), so a controller death can re-run settled seats. That is a generic runner bug, and a restart costs ~36 min.
- **Per-account trust is on the plain path, not just UNPROVEN.** The account selector picked `fgovn`, which lacked trust for the target (E:153), and the owner had to add the entry by hand (E:198).
- **"Findings now fail those runs" is imprecise.** `reviewed` first loops revision rounds. It fails only if findings persist at maxRounds (`reviewed.mjs:150`).
- **One YAML plus `--context-ref` still re-runs framing and shaping on every reopen.** That breaks the goal of running only affected work (plan.md:32).

**(c) Middle path M: accept, with four changes.**
1. Allow one more registered reopen YAML (≤60 lines: recommendation → explanation → close). It is registered, so no driver is needed.
2. Keep the small startup-dialog diagnosis capture, so a stall shows its screen (E:59 vs E:71). Keep `--strict-mcp-config` project-local only, since shipping it would disable other projects' MCP tools (E:75). Fix the per-account trust source, or verify trust on the target before the run.
3. Add `acceptOutcomes:[pass,findings]` to `business-discussion` reviewed (it feeds a human gate, `business-discussion.yaml:52`) and to `group-cognition`. Add one deterministic test for each.
4. In the separate dispatch item, Unit association goes first. Set a date for the owner's decision.

Scores for M:
- **Function:** 5/6. A specialist need is decided by the owner at close; affected-only reopen holds only with change 1.
- **Stability:** one deterministic DAG, ~150-200 src lines. Remaining exposure: a crash can re-run settled seats, and the HOME reaper race.
- **Fast and light:** normal run ~36 min, 1 start, 5 Units; a reopen ~15 min. Skill ≤200 lines.
- **Flexibility:** best of the three. New forms stay at the YAML level, and `--context-ref` is generic.

**(d) What would change my mind:** one M run on main, through the installed entry, on an external target, completing with no dispatch patch outside M, with the owner rating its advice at least equal to CURRENT's explanation of packet `bab4742a`. If that happens, drop CURRENT's driver and autonomous specialist entirely. If the run instead stalls on a defect outside M, land the dispatch item first.
