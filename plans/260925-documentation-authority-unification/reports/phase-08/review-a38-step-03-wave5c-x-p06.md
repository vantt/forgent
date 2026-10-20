# Review a38 step-03 wave5c x-p06

Pin ae141550c. Three whole files, 33 edges. Records read through a per-field extractor. Each diff was compared against its patch edges. Sources were read whole with `git show`. Targets and anchors were checked against the pin, using the repo's own `scripts/list-doc-anchors.mjs` read-only. No checker or probe script was run.

## Per-file results

### 1. docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md
- Set: batch-089. Stratum: L12-51-changed-file-targeted-re-review.
- Verdict: **ok**. 28 edges reviewed (maps-j-06515..06542). I read the whole source, 922 lines, and the whole diff.
- Four patches, matching the four diff hunks:
  - 06515 (Related, line 17) goes to `docs/platform/runner/spec.md`.
  - 06516 (line 35) goes to `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The anchor resolves to heading line 695, "Lớp còn thiếu ... (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)". The section text says 4 of 5 phases are done and phase 5 (agy native detection) is deferred/YAGNI, which matches the source claim.
  - 06517 (line 150) goes to the same holder, anchor 0034 (heading line 1300). The 0034 section does split capability from executor and removes the capacities alias, which matches the claim.
  - 06519 (line 832) goes to the same holder, anchor "Lịch sử quyết định retired từ docs/decisions" (line 25). Both Native-First (0026, line 583) and 0034 (line 1300) sit under this section, so the common section is the right granularity.
  - All three anchors exist in the repo anchor API. The record uses the repo's collapsed-hyphen form, not the GitHub double-hyphen slug. This is the repo convention and the checker uses it.
- Preserve edges, all correct:
  - 06518: `docs/history` inside a JSON example. `docs/history` is a retained tree (1699 files at the pin).
  - 06520..06523, 06524..06535: `docs/history/**` paths. All exist at the pin. L12-10 says `docs/history/**` is retained.
  - 06536: the placeholder `docs/history/<task>/`.
  - 06537, 06539..06542: root `docs/architecture-manifest.json`. It exists at the pin and is a retained root file, cited as touched-file evidence.
  - 06538: `docs/specs/runner.md` in the completed `tsk-17m` doc-only touched-files row. This is past-tense evidence and preserves (L12-26(5), L12-46).
- I grepped the whole source for other legacy locators (`docs/specs`, ADR, D00xx, `.md` paths). I found no missed reference. D0026 and ADR 0034 are bare decision numbers (L12-49), and the real paths are patched.

### 2. docs/platform/agent-coordination/spec.md
- Set: batch-089. Stratum: L12-51-changed-file-targeted-re-review.
- Verdict: **ok**. 4 edges reviewed (06545..06548). I read the whole source, 109 lines.
- 06545 (line 17 Related) and 06546 (line 20 "Superseded by") are patched to `docs/platform/runner/spec.md`. This is a whole-area owner claim with no narrower locator. The "Superseded by" line is live current-owner framing in this wrapper, not historical wording.
- 06547 (line 75) is the paired label and destination. The label `docs/specs/runner.md` and the destination `../../specs/runner.md` both become `docs/platform/runner/spec.md` and `../runner/spec.md`. The relative path from `docs/platform/agent-coordination/` resolves to the existing `docs/platform/runner/spec.md`. This satisfies L12-51 ruling 5. The surrounding description (Unit/Workflow execution ownership, retained Assignment/Run contract) stays true.
- 06548 (line 100, "the current owner") has its destination patched correctly.
- The diff has 4 hunks covering 5 changed lines, matching the 4 patch edges. No other legacy path appears in the source. Line 87 "Work-state / runner specs" is pathless and not an edge.

### 3. docs/platform/contracts/architecture-manifest.json
- Set: batch-094. Stratum: L12-51-changed-file-targeted-re-review.
- Verdict: **ok**. 1 edge reviewed (06664). I read the whole 13 KB source.
- 06664 preserves `"map": "docs/architecture-map.md"` (line 3). The root file exists at the pin and is a retained root file (legacy-current; Phase 9 touches only its CTR010 lines). The diff is empty, which is consistent. No other `docs/` path appears in the JSON.

## Defects
No outcome defects (wrong disposition, target, anchor or diff, false adjacent description, or missed reference).

## Record-text notes (not rework)
- 06517: the patched sentence reads "the runner spec's (`…/decisions/h-36d872fbb0e5.md#0034-…`) historical `capacity` concept …". The parenthetical now points at the runner area's decisions-history file instead of "the runner spec" itself. The 0034 holder does state the capacity-to-capability/executor split. The old `runner.md` also had a vocabulary-map note, now in `docs/platform/runner/architecture/h-7af1f0242611.md`, that carries the same mapping. The target is defensible, and the checker accepted it.
- 06538: the reason says "tree retires at Phase 9". That is correct, because `docs/specs/**` is a retiring tree.

## Lead-judgment questions
None.

## Counts
- Set batch-089: 2 files, 32 edges reviewed, 0 rework.
- Set batch-094: 1 file, 1 edge reviewed, 0 rework.
- Stratum L12-51-changed-file-targeted-re-review: 3 files, 33 edges reviewed, 0 rework.
