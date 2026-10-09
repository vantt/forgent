# Red-team: advisory plan — original goal, overshoot, and the proposed adjustment (2026-10-08)

Read-only. Worktree `/home/vantt/projects/forgentX-worktrees/advisory-capability-completion` (W), base `71043949d`, working-tree diff. Plan folder `W/plans/261006-1408-advisory-capability-completion/` (P). No commits on branch; everything is uncommitted.

## 0. Measured numbers (git numstat, today)

- Whole diff: 51 files, **+4871/-791** (lead's +4414 was earlier; GitNexus AGENTS/CLAUDE hunks are gone, plan docs grew ~+180).
- src: **+1432/-344, 21 files** (matches lead). Tests: **+3259/-410, 19 files** (2.3x, matches).
- src split: dispatch/confinement/setup **880 lines (61%)**: assignment-runner 261, herdr-round 222, herdr-reconcile 171, authority 68, settlement 63, proof-helpers 27, cli 17, assignment-layout 16, cleanup 14, agent-cli-trust 10, request 8, transport 3. Workflow/execution contracts **552 (38.5%)**: run 236, runner 128, handoff-refs 110, definition 35, store 19, loader 18, panel 3, registry 2, index 1.
- 26 Workflow runs + 26 Units created in W/.fgos for proof. `herdr-round.mjs` last modified 2026-10-08 11:23, i.e. **after** the Opus review: dispatch code is still growing.
- Registered flow on main: `core/workflows/architecture-advisory.yaml` 55 lines, `core/skills/fgos-architecture-panel/SKILL.md` 390 lines. Confirmed.
- Retirement `2180b4e72`: 186 files, -79,186. Confirmed. Document-unification 17k tool: **UNPROVEN** (not read).

## 1. Original goal and expansion chain (from artifacts)

1. **Seed — a roster deletion.** Original single-door Phase 01 (`f114f6ccd`, 2026-10-06 17:24, `plans/261006-1415-fgos-single-door-mechanisms/phase-01-architecture-panel-roster-single-source.md`): goal = remove hand-pinned executor/model roster from the skill + one guard test. It anticipated the trap explicitly: Step 1 third bullet "Nếu vai không map được vào Workflow … dừng, báo Lead; phạm vi phase này chỉ là roster, phần còn lại thành work item riêng"; Risks row "Skill còn nhiều chỗ mô tả `coordination run` đã retire … Ngoài phạm vi; ghi câu hỏi mở, không mở rộng phase".
2. **The stop fired, but became a plan instead of a question.** `P/reports/owner-challenges-and-rationale.md:32`: skill still promised retired actor/specialist APIs; owner asked to keep full behavior through a thin skill; "Phần đó được ghép vào old plan rồi mở rộng thành runtime contracts". Owner then asked to split it out (`P/plan.md:15`). The advisory plan first appears inside commit `f053de033` (2026-10-06 23:04, titled `feat(hygiene)…`), not its own commit.
3. **Stated original goal** (`P/plan.md:17`): "hoàn tất năng lực đã yêu cầu trong migration … Một skill mỏng dùng Workflow/Pattern/Unit/bind sẵn có; không second sequencer/store/binding/actor registry". Owner reference size: "herdr-cook-plan/checker khoảng 151 dòng" (`owner-challenges:12`).
4. **Four source-backed gaps** (Astra, `owner-challenges:34-38`; `plan.md:38`): red-team doesn't see final packet; no path for specialist discovered mid-flow; `findings` fails the Workflow; Unit ID associated only after run returns.
5. **Gaps became five contracts + seven live gates.** Committed Phase 02 (`f053de033`): owners list = workflow/*, execution/{run,unit,panel,reviewed,handoff-refs}, CLI — **no dispatch/herdr/confinement**. Exit: "Use a real reachable external target … ACCEPT only with evidence for all seven … no deferred foundation/MVP acceptance". `plan.md:100` Exclusions: "provider/transport/confinement change".
6. **Live gates pulled in dispatch work, one failure at a time** (`P/reports/phase-02-execution.md`): L59 framing worker blocked by MCP dialog → L69 herdr startup diagnosis repair; L87-92 native ref access → `cli.mjs` `withRunDirReadAccess`; L113 receipt-backed collection → `assignment-runner`; L131 selected-account trust → `authority`/`agent-cli-trust`; L141 HOME lifetime vs startup reaper → `cleanup`; L191 settlement overwrote `findings` with `pass` → `settlement.mjs`; L219 unsent-brief phase/recovery in `herdr-round/reconcile/request` "GitNexus warned CRITICAL upstream blast radii before edits"; L286+ review remediation A/B in herdr-round. L17 still says "No provider/transport/confinement change … was introduced" — true for the first slice, never revised.
7. **Evidence manufacture.** Review F-1 (`/home/vantt/projects/forgentX/plans/reports/opus-advisory-phase02-review-261008.md:36-57`): Gate 3 "honest unavailable expertise" = controlled worker loss + objective containing the verdict + observer-authored evidence. A metadata mistake in those runs then produced a **new store event** `workflow.request.corrected` (`W/src/workflow/store.mjs` diff; `phase-02-execution.md` §"Persisted request provenance").
8. **Next step already queued is more runtime:** Phase 03 entry now requires a new ref type `unit-outcome:<unitRunId>` (`plan.md:78`), and the two open HIGH risks need "a durable pane/session/socket identity contract through allocation/retention/recovery" (`phase-02-execution.md` §"Additional read-only review limits").

## 2. Why it overshot

PROVEN from artifacts:
- **P1. Proof bar = live real-worker, all-7, no deferral.** Every dispatch repair is causally tied to a live gate run failing (chain item 6). None was a contract defect of the advisory flow.
- **P2. Plan's own exclusion breached silently.** `plan.md:100` excludes transport/confinement change; 61% of src is there; no section re-evaluates the exclusion or STOP list after these edits (grep of phase-02-execution for KILL/STOP/exclusion evaluation: only L17's stale denial).
- **P3. No numeric budget by design.** `owner-challenges:54`: "Không đưa một numeric threshold bịa ra". The "complexity ledger" (`phase-01-start.md:30`, `phase-02-execution` §Friction delta) counts starts/Units/assignments, never src lines, files, or owners touched. Nothing could trip.
- **P4. Feedback loop: each review adds a deliverable.** Opus review → 4 remediation items + Phase 03 entry condition requiring new runtime ref; runtime reviewer → 2 HIGH needing a new durable contract. Reviews were answered by building, not by narrowing claims.
- **P5. Paperwork > product.** 314-line execution report + 190-line review vs 55-line YAML.

INFERRED (not provable from artifacts):
- Agents treated "chặn tại đầu, không foundation/follow-up" (`owner-challenges:13`) as "fix every prerequisite in-branch" instead of "report blocked". The plan forbade deferral but had no "stop and ask" exit for infra prerequisites.
- Same mechanism as doc-unification (all-or-nothing acceptance, no size/time box) — UNPROVEN, that plan not read.
- Not a second engine yet: no second store/registry/scheduler in src. The engine risk sits in Phase 03 (below), not Phase 02.

## 3. Attack on the adjustment

| Element | How it morphs | Guarded? | Smallest structural guard |
|---|---|---|---|
| Split dispatch hardening to own branch/item | (a) Becomes heavy track: 880 lines + 2 HIGH needing "durable pane/session/socket identity contract" = new state contract in herdr, no budget, no end date. (b) **Split boundary is wrong**: by-directory list moves lines advisory needs: `settlement.mjs` `assessment.verdict === 'findings'` fix (without it real reviewers' findings settle as `pass` → contract 4 unreachable live); `assignment-layout.listUnitRunDirs` serves Unit association. (c) Advisory live run on main without those fixes re-hits the same startup/trust failures → pressure to re-add them to advisory. | No | Split by **purpose** not directory: keep settlement findings lines (~5) with contract 4. Dispatch item gets its own budget (e.g. land as-is after review, HIGH risks = separate decision by owner, not auto-built). Live run uses whichever executors start cleanly on main today; if none, report blocked — do not patch dispatch from the advisory side. |
| Deterministic tests replace live gates 4, 5, 3-neg | Proof-by-fixture: tests prove Workflow plumbing with fake reports, which is what left P4 acceptance DONE_WITH_CONCERNS. Also gate-5 tests keep the 236-line `run.mjs` prepare/capture machinery alive in advisory scope. | Partly (gate 7 + one live run remain real) | Label explicitly: tests prove runtime contract, live run proves advice. Move contract 5 (Unit association/reconnect) **out** of advisory: it is a generic runner bug (Kongming says so too, then keeps it — contradiction). |
| One live run judged by owner (gates 1,2,6) | Lead scripts the objective again (F-1 pattern); or "owner judged" becomes lead summarizing for owner. | No | Run must go through the installed skill entry, objective = owner's verbatim CASE only, owner reads raw final report (not a lead digest). Record the definition SHA used. |
| Unavailable specialist = skill rule + fixture | Fixture authored by lead = same observer-authored evidence channel; and the planned `unit-outcome:` ref is new runtime. | No | Drop autonomous specialist continuation (see §4): if a named gap appears, explanation lists it and the close gate asks owner. No new ref type, no fixture needed. |
| Skill ≤250 lines, ≤4 defs ≤60 lines | Logic moves into: objectives text inside YAML, `--definition` ad-hoc graphs generated at runtime (contract 2 is NOT in keep list but not removed), tests, `Workflow.description` labels, the split branch. "Engine in a prompt." | No | Remove contract 2 (`--definition`) from the branch: skill may only start **registered** ids. Then the 4×60 cap is real because no unregistered graph can exist. Count = `wc -l` of skill + `core/workflows/architecture-*.yaml`, pasted in phase exit. |
| Phase 03 driver "reads reports, picks next graph" | It is a sequencer: chooses next graph, tracks root/parent/pass/reopenRound in `Workflow.description`, recovers ancestry, resumes interrupted Units (`phase-03-thin-skill-cutover.md:26-30,70`). Kongming's kill criterion "rounds only in run description" **blesses** a free-text state schema that the LLM must parse on resume. Violates law 0049 spirit (Workflow sole sequencer). | No — criterion legitimizes it | Normal pass = **one** registered Workflow start ending in a human close gate. Only the owner triggers another start (reopen) with `contextRefs` to the parent. No pass/round bookkeeping by the driver; owner reopens are visible in gate answers already. |
| Kill criteria | Nobody evaluates; ">100 new src lines" has no baseline SHA; "new store field" already violated (`workflow.request.corrected`, `configSnapshot`, `unitRunId` in store.mjs); "third Workflow door" ambiguous — `--definition` is arguably already the third selector (id, `--plan`, `--definition`). | No | Record freeze SHA + `git diff --numstat <freeze> -- src` in each phase report; name the evaluator (owner-facing line in report header). Decide now on the three existing store additions: revert `workflow.request.corrected` (exists only to fix lead's own evidence labels). |
| Deadline 2026-10-10 | Pressure → skip owner judgment or rubber-stamp; Phase 04 needs restage + full suite + shared-source baton with single-door plan. | Partly | Deadline applies to "owner has read one real advice from installed entry", not to all Phase 04 paperwork. |
| "On kill: ship 1,3,4 + skill over existing 5-step YAML" | This fallback is the cheapest correct design; framing it as failure path invites spending 2 days first. | — | Make it the primary plan. |

## 4. Recommendation (≤12 lines)

Cut harder than the adjustment; do not re-plan from scratch (gaps are real and small).
1. Freeze W src now; record freeze SHA.
2. Advisory branch keeps: panel params (contract 1, 3 lines), `acceptOutcomes` + the settlement findings-verdict fix (contract 4), `contextRefs` without byte-capture/refuse-on-resume (3-lite). Revert `--definition`, `workflow.request.corrected`, capture machinery.
3. Edit the ONE registered YAML: synthesis becomes `reviewed` (producer=synthesizer, reviewer/red-team see final packet), `acceptOutcomes:[pass,findings]` on consumers, final no-Unit human close gate. Target ≤70 lines.
4. Specialist: explanation must name any material expertise gap; owner decides at close gate (reopen = new start with `contextRefs`). No autonomous specialist continuation, no `unit-outcome:` ref, no driver. (Owner trade-off: one batched question vs priority #2 — owner decides.)
5. Skill rewrite ≤200 lines: run registered id, read final report, relay close gate verbatim, start reopen with contextRefs. No round/pass bookkeeping.
6. One live run on mcp-skill-hub via installed entry, verbatim CASE, owner reads raw report. If executors won't start on main: report BLOCKED, do not patch dispatch here.
7. Contract 5 (Unit association) + all 880 dispatch lines → one separate work item, reviewed and landed or dropped as-is; the 2 HIGH risks become an owner decision, not an auto-build.
8. Kill: any src line beyond step 2's set, any second registered advisory definition, any driver state.

After one week the owner should see:
1. `git diff --numstat main -- src` for the advisory change ≤ ~250 lines, and exactly one advisory YAML + one skill ≤200 lines on main.
2. The owner has personally read one real advice from the installed entry on an external repo, where red-team cites the final packet and dissent survives into the explanation.
3. The dispatch item is either landed or closed with a written owner decision; it did not grow past its frozen 880 lines, and no new durable herdr contract was started without that decision.

## 5. UNPROVEN

- Whether main's current dispatch can complete a live advisory run without the 880 split lines (trust seeding/settlement may be on the normal path).
- Whether `reviewed` pattern supports producer=synthesizer reading prior step reports inside one Workflow without contract 5 (believed yes via runner `unit-run:` refs, per Kongming citing `runner.mjs:40-114`; not re-run).
- Doc-unification 17k-line claim; Kongming numbers beyond what I re-measured.
- Quality of the six "ACCEPT" gates: relied on the Opus review, not re-derived.

## 6. Unresolved questions (owner)

1. Accept human-triggered specialist (one batched question at close) instead of autonomous mid-flow specialist? This removes the only reason a driver/sequencer exists.
2. Dispatch 880 lines: land after review, or drop? Who owns the 2 HIGH risks?
3. Does "store field" kill criterion apply retroactively to `configSnapshot`/`unitRunId`/`workflow.request.corrected` already in the diff?
