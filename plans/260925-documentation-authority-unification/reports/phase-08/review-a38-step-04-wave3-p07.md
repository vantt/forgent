# Review A38 - Step 4 wave 3, part 07 (set step04-009)

Pin dc24ce645. I read the pinned `AGENTS.md` (411 lines) through EOF, all 25 slots, the full diff, the `stepFiveExcluded` list, and the render-join source records for `core/instructions/platform-laws.md` and `core/instructions/design-principles.md`. I applied the diff with `patch` to a scratch copy. Targets were read with `git show dc24ce645:<path>`. No checker, probe, resolver or author script was run.

## Per file

### AGENTS.md - set step04-009, stratum category A (outcome changed) - verdict OK
Slots reviewed: 25 (instructions-001..024 plus the author-added line-74 slot). I also reviewed the 13 managed-block edges (025..037) joined to their canonical sources.

**Named repairs verified**

- **Line-74 slot (L12-62 rework item 1).** It is present as an author-added occurrence at line 74, cols 5-20, text `docs/decisions/`, with `supplementalOccurrenceKey` at pin dc24ce645. It is `parked`, not preserve. The reason is derived from its own passage (present-tense writer to the retired decision corpus; the dependency is the Step 7 A34 residual). It carries a passage search witness over `docs/platform/**` and `docs/knowledge/**`, with terms `area-scoped` and `decision-index`.
  - The generated `docs/decisions/index.md` (instructions-006, line 14) still preserves, as L12-60(5) and L12-62 ruling 4 require.
  - The second half of the sentence (line 75, `docs/specs/<area>.md`, instructions-018) is parked.
- **Quadrant-input slot.** The `docs/<quadrant>/` pattern named in L12-62 belongs to the fgos-indexing files, not to `AGENTS.md`, so it does not apply here. What `AGENTS.md` has is instructions-018, whose census line 71 is source line 75 after the merge. It is parked as a writer instruction and is consistent with the line-74 slot.
- **Earlier wave fixes.**
  - 001, 017 and 022 preserve (`docs/platform-foundations.md`, switchboard route), and 019 and 020 preserve (`docs/distribution-vision.md`).
  - 021 patches to `docs/platform/packaging-distribution/spec.md`, which exists at the pin.
  - 002 patches to `docs/platform/system-overview/spec.md`, which exists.
  - 003, 012 and 014 patch to `docs/reading-map.md`, which exists.
  - 008 and 009 patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The heading `### 0030 - Thêm bậc ưu tiên #2 "Release con người" ...` is at line 921. The anchor `0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm` equals what the repo's `githubSlugText` produces: the em-dash is stripped and whitespace is collapsed to one hyphen. The shard also holds a "Lịch sử quyết định retired từ docs/decisions/" section, so the line-27 phrase stays true.
  - 004, 005, 015 and 016 preserve retained paths, and all of them exist.
- **Parks have genuine search witnesses.**
  - 010 and 011 (D-ADR0035 mission boundary): the only `0035` heading in `docs/platform/**` is a different decision (mutation-gate trust boundary). The knowledge doc `why-fgos-self-development-is-not-the-default-mission.md` states that it "intentionally stays short and points" back at `docs/specs/platform-foundations.md` `0035`. `decision-record.md` is a generated row that also points back at the retiring spec. There is no live holder, so the park is right.
  - 023 and 024 (D-ADR0054/RUL11 and D-ADR0062/RUL104): `docs/platform/platform-foundations.md` has only the RUL11 locked-law table row, not the decision narrative. The `0062` and `0061` headings in the runner shard are different decisions that reuse the ids (id collision). Matching them by id would have been wrong, and the record does not. Parking is correct.
- **Diff applies.** `patch --dry-run` applies all 5 hunks cleanly to the pinned blob. Line 8, line 11, line 14, lines 29-35, lines 74-75, the entire A34 residual and lines 145-157 are untouched. After the patch the managed block (321-411) is byte-identical to the original, so the root diff carries no render change. Paths are repo-root form like the source, and label and backtick form is kept (backticks where the source had them, bare in the list and heading lines).
- **Managed block as render joins.** `AGENTS.md` 321-411 holds exactly the three effective-set sources: `core/instructions/decision-question.md`, `platform-laws.md` and `design-principles.md`. I checked every non-blank line of each source against the block and none is missing. The `source:` header witnesses are at lines 341 and 365. `instructions-025..036` join the `platform-laws.md` source slots 039..050 by equal passage. Their source outcome is patch, and they carry the `render-join` label with no render diff. `instructions-037` joins `design-principles.md` instructions-038 (preserve). The `AGENTS.md` record carries no diff inside the range 321-411. The sources contain no other docs paths. `rootInstructionBoundary` has managed range 321-411, the reviewed marker at 316 and the merged-pin marker at 321, which matches the real `start`/`end` markers at lines 321 and 411.
- **Wrapped-path scan.** I found no `docs/` path wrapped across lines. Line 40 (`docs/specs/` before the line break) and lines 74-75 are slotted.

Outcome defects: none.

**Record-text notes (not rework)**

1. instructions-013 (line 40, "the area spec under `docs/specs/`") still carries the generic park reason about a "complete narrative/index/writer contract ... registry/index reader". That text does not fit a read-first navigation sentence. The wave 2 note asked for a re-word and it was not done. The disposition (parked, because the per-area path changes in Phase 9) is right.
2. `docs/decisions/*.md corpus đã retired tsk-1lv-4` appears at lines 27 and 35 as a glob inside a past-tense history clause. It has no own slot or `stepFiveExcluded` entry. It reads as history, so preserve is right, and the Phase 9 literal remnant search covers it. Lines 27 and 35 are otherwise slotted (008/009 and 010/011).
3. The reasons of all parked slots carry a doubled "A51, L12-30/31/32/58/60:" prefix. The line-74 reason repeats "L12-62: L12-62:". `blockedReason` and `dependency` repeat the whole reason. This is harmless duplication.
4. The line-74 park has no successor note naming an area decision-record location. The wave 2 report suggested one. The L12-62 text only requires the Step 7 dependency, which is present.

**Lead-judgment questions**

- After Phase 9 the root managed block (render) keeps `docs/platform-foundations.md` (the A34 residual and the `platform-laws.md` source patch to `docs/platform/platform-foundations.md`) until the instruction projection is regenerated. `AGENTS.md` lines 8, 63, 142 preserve the same old path under L12-60. Both are internally consistent with the render-join rule. Confirm that the Step 7 packet owns the regeneration so the root and the managed block do not end up disagreeing.

## Counts

- Set step04-009 in this part: files reviewed 1 (`AGENTS.md`); outcome rework 0.
- Slots reviewed: 25 (24 census slots plus the author-added line-74 slot), plus 13 join edges and 12 `platform-laws.md` source patch slots checked as join counterparts.
- Stratum: category A (outcome-changed), full final-state review. No B stratum in this part.

Status: DONE
Summary: `AGENTS.md` is ok. The line-74 `docs/decisions/` park, instructions-018, the earlier wave fixes and the 321-411 managed block as render joins all verify against the pinned sources, and the diff applies cleanly. Four record-text notes and one Lead question; no outcome defects.
