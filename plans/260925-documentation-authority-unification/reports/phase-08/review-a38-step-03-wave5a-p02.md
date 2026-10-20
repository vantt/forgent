# Review a38 — Step 3 wave 5a, part p02

Pin ae141550c. Read-only. Each file was read whole (all under ~60 KB). Each record was loaded per field, with the diff printed separately. No checker or probe was run.

## Per-file results

| # | Set / stratum | File (docs/knowledge/...) | Edges | Verdict |
|---|---|---|---:|---|
| 1 | batch-080 / unpatched-seeded | why-resolveplan-s-pass-through-.../why-resolveplans-pass-through-path-now-checks-planapproveverify-before-executing.md | 1 | ok |
| 2 | batch-081 / patched-seeded | why-session-claim-liveness-.../why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md | 5 | ok |
| 3 | batch-081 / patched-seeded | why-src-runner-dispatch-mjs-.../why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md | 3 | **rework** (04939) |
| 4 | batch-081 / unpatched-seeded | why-state-json-s-write-.../why-state-json-writes-became-atomic-while-its-lock-scope-claim-turned-out-already-fixed.md | 1 | ok |
| 5 | batch-081 / patched-seeded | why-the-herdr-fgos-dashboard-.../herdr-fgos-dashboard-three-piece-build.md | 2 | ok |
| 6 | batch-081 / unpatched-seeded | why-the-iron-law-evidence-contract-.../iron-law-evidence-contract-stays-human-gated.md | 2 | ok |

14 edges reviewed (1+5+3+1+2+2). No retiresWithTree records in this part.

### Edge detail

**File 1**
- maps-j-04924, line 30, `docs/history/verify-judgment-at-clarify/RESEARCH.md`: preserve. The path exists and the docs/history tree is retained. The passage is past-tense narration of a rescan, so it is evidence. OK.

**File 2**
- 04932, line 16, `docs/specs/work-state.md`: preserve. The passage describes the earlier "indefinite hold" problem in the past tense, so it is a past-event citation. OK. See Lead question 2.
- 04933 (line 109), 04934 (line 111), 04935 (line 113): preserve. The three docs/history paths exist and are retained. OK.
- 04936, line 115, `docs/explanation/session-isolation-and-concurrency.md`: patch to `docs/knowledge/how-fgos-isolates-concurrent-sessions-and-why-the-event-log/session-isolation-and-concurrency.md`.
  - The source path does not exist at the pin, so this is a pre-rename holder. The target exists with the same basename.
  - Target lines 201-228 hold the tsk-49a correction (zero real runner-vs-session double-claims). That matches the source gloss.
  - The diff is exact and sits in the correct hunk. OK.

**File 3**
- 04937, line 16, `docs/specs/runner.md`: preserve. The reference is inside the dated "Removed door (2026-10-14)" banner (decision 0062). The same banner is preserved in 15 sibling records, so this is consistent.
- 04938, line 20, `docs/history/task-dispatch-unification/CONTEXT.md`: preserve. The path exists and is retained. OK.
- **04939, line 94 (defect below).**

**File 4**
- 04965, line 61, `docs/history/tsk-5nj-state-json-write-only-cost/CONTEXT.md`: preserve. The path exists and the description matches (D1-D4). OK.

**File 5**
- 04996, line 50, `docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md`: patch to the docs/knowledge holder.
  - The source path does not exist at the pin. The target exists.
  - The target's sections 1-2 cover the manifest `[[actions]]` limitation and the `pane split` then `pane run` mechanics. That matches "full mechanics". OK.
- 04997, line 109, `docs/specs/work-state.md`: patch to `docs/platform/work-state/spec.md` with anchor `11-business-rules`.
  - The target's `## 11. Business Rules` exists, and RUL25 at line 1065 says the frontier blocks a root until its descendants are done and the root's own verify is the integration proof. This is gloss-true.
  - The diff is correct. OK. See Lead question 3.

**File 6**
- 05008 (line 68) and 05009 (line 78): preserve `docs/history/<id>/iron-law-evidence.md`. This is an illustrative placeholder convention under the retained docs/history directory. It is not a literal file, so there is nothing to patch. OK.

## Outcome defects

1. **maps-j-04939** (batch-081, file 3, source line 94).
   - Rule: L12-42 (gloss-true alias patches) and the false-adjacent-description check.
   - Facts:
     - The patch repoints the source to `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md`.
     - The record reason says the target guide "defines ad-hoc task identity" and the executor mechanism.
     - The target (161 lines) has no ad-hoc, packet or `<scope>#p<n>` text at all. It covers only executor config, the decide then `fgos run` pair, and the shared fallback fragment (lines 26, 97, 103-109).
     - The source sentence is "The id shape (`<scope>#p<n>`) is unchanged — see <how-to> and the _shared fragment". The id-shape gloss is actually held by `core/skills/_shared/executor-dispatch-fallback.md` (line 168), not by the how-to.
     - `git log -S'ad-hoc task'` on the old how-to path finds nothing, so the how-to never held it.
   - What holds: the path-move resolution to the same-basename holder is correct. The source `docs/how-to/...` is missing at the pin, and the guide was migrated by 47703ebf0.
   - Correction (Lead picks one):
     - (a) Keep the patch and rewrite the reason to state accurately what the target holds (the task-dispatch skill wiring guide that the sentence names). Do not claim it defines ad-hoc identity. If so, this is record-text only.
     - (b) Park as a description-rewrite, because the gloss "id shape ... see X" is not true at the target.
   - I treat this as rework because the reason's claim about the target is false.

## Record-text notes (not rework)

- 04937: the reason says "L12-40: original captured source/output identity". The passage is a dated banner blockquote, not captured output. The correct basis is the dated "Removed door" retirement framing, as in the sibling records. The disposition is right.
- Files 4 and 6 are unpatched and each has one extra non-docs reference, for example `plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` in file 4. That path does not exist at the pin. It sits outside the inventory roots (plans/ is not a retiring tree), so no edge exists. This is noted only.

## Lead-judgment questions

1. 04939: choose (a) or (b) above.
2. 04932: this is a past-tense reference to `docs/specs/work-state.md` "Open Gaps", and it is preserved. If you consider a pointer to a retiring spec's gap list live, it would need a patch or a successor note. I judge preserve correct.
3. 04997: the "RUL25 in practice: how the root closed ..." section narrates a past event. If L12-46 treats it as a completed-action history region, a historyRegion declaration plus a successor note would be needed instead of the patch. The citation itself is present-tense ("RUL25: a root's own verify *is* the integration proof"), so I judge the patch fine. This is a judgment call.

## Counts

| Set | Stratum | Reviewed (p02) | Rework (p02) |
|---|---|---:|---:|
| batch-080 | unpatched-seeded | 1 | 0 |
| batch-081 | patched-seeded | 3 | 1 (file 3) |
| batch-081 | unpatched-seeded | 2 | 0 |
| batch-080 | patched-seeded | 0 here (see p01) | n/a |
| batch-082 | any | 0 here (see p03) | n/a |

p02 totals: 6 files and 14 edges reviewed; 1 file with 1 edge flagged for rework.

batch-081 patched-seeded: 1 of 3 files in this part, which is 33%. That is over the 3% threshold, so expansion may be triggered if Lead confirms the defect. The full stratum denominator is 3 (patched, seeded) and all three are in this part. No file overlap with p01 or p03.

Status: DONE_WITH_CONCERNS
Summary: 5 of 6 files are ok. One outcome defect: maps-j-04939 (batch-081, dispatch.mjs file) is a patch whose reason falsely claims the target defines ad-hoc task identity. Lead should decide between a reason rewrite and a park.
