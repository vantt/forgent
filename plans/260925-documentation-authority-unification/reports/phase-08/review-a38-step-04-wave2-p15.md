# Review A38 — Step 4 wave 2, part 15 (set step04-009)

Pin dc24ce645. Read the full pinned AGENTS.md (411 lines), CLAUDE.md (11), core/instructions/design-principles.md (56) and the full diff; applied the AGENTS.md diff to a scratch copy (applies cleanly, hunks match the intended lines). Targets checked with `git show dc24ce645:<path>`.

## Per file

### AGENTS.md — set step04-009, mandatory re-review — verdict REWORK (1 outcome defect)
Slots reviewed: 24 (instructions-001..024), plus the 13 stepFiveExcluded projection edges (025..037) and the dead-path journal for the file (41 occurrences).

Wave 1 rework verification:
- 001 / 017 / 022 now preserve (`docs/platform-foundations.md`) — ok. 019 / 020 preserve (`docs/distribution-vision.md`) — ok. Both files exist at the pin.
- 021 patches `docs/specs/distribution.md` to `docs/platform/packaging-distribution/spec.md` (exists; line 134 hunk applies; relative form is repo-root like the source) — ok.
- A34 residual is recorded as `rootInstructionBoundary.dependency` (Step 7 packet) — ok. Managed range 321-411 matches the real markers (`fgos:instruction-projection:start` at 321, end at 411).
- **Line ~70 / "goes into docs/decisions/" is NOT present — defect below.**

Other slots verified: 002 (-> `docs/platform/system-overview/spec.md` exists), 003/012/014 (-> `docs/reading-map.md` exists), 008/009 (-> `docs/platform/runner/decisions/h-36d872fbb0e5.md`; heading `### 0030 — Thêm bậc ưu tiên #2 "Release con người" ...` exists at line 921, and the single-hyphen collapsed anchor matches the form already used by 28+ accepted Step 3 anchors to this file), 004/005/006/015/016 preserve (retained paths; 006 is the generated index per ruling 5), 007/013/018 parked (retiring `docs/specs/<area>.md` / `docs/specs/` layout), 010/011/023/024 parked on GAP-02 (no live holder: the 0035 heading in the runner shard is a different decision, no 0054/0062 platform-foundations narrative exists). The `docs/decisions/*.md` glob at lines 27 and 35 is correctly excluded as a pattern. No behavior change (prose only; managed block untouched).

OUTCOME DEFECT
1. **Missing Phase 9 edge for line 74** (`AGENTS.md`, step 6 of the definition of done: "A settled decision goes into `docs/decisions/`; a settled spec fact goes into the relevant `docs/specs/<area>.md`", source lines 73-75; the path `docs/decisions/` is on line 74). Rule: L12-60 ruling 5 ("`AGENTS.md` line 70 ... is a present-tense pointer to a retired directory and becomes a Phase 9 edge"; generated `docs/decisions/index.md` still preserves) and L12-60 sweep 2 (every occurrence without a slot becomes an author-added slot). Evidence: record has exactly edges 001-024, `authorAddedSlots: []`, no slot with line 74; `step-04-l12-60-sweep.json` deadPathScan lists `docs/decisions/` line 74 as state `existing` (no slot), because the directory still holds `index.md`, so the scan did not flag it. Correction: add an author-added slot for line 74 span cols 5-20 (`docs/decisions/`), disposition parked or patch (not preserve) with a Phase 9 timing. The reason must come from this passage: a settled decision now lands in the area decision records (for example `docs/platform/<area>/decisions/`), and the successor must be a non-executable note until Phase 9 names the holder. Line 75 (`docs/specs/<area>.md`, instructions-018, parked) is the sentence's second half and is already covered.

Record-text notes (not rework):
- Parked reasons for 007, 013 and 018 carry the same boilerplate ("complete narrative/index/writer contract ... trace the actual registry/index reader in Step 5") and the `A51, L12-30/31/32/58/60:` prefix is doubled on every parked reason. It fits 018 (writer instruction) and roughly 007, but not 013 (a read-first navigation sentence, "area spec under `docs/specs/`"). L12-60 sweep 3 asks for reasons derived from the slot's own passage; re-word 013 (for example, a read-first pointer to a directory whose per-area spec path moves in Phase 9).
- For parked slots `blockedReason` and `dependency` repeat the full reason text; harmless.
- 008/009 patch the line 27 span to `<path>#0030-...'s "Lịch sử quyết định" § D-ADR0030`. The shard does hold a section "Lịch sử quyết định retired từ docs/decisions/", so the claim stays true; the possessive after the anchor reads awkwardly but resolves.

### CLAUDE.md — set step04-009 — verdict OK
Slot reviewed: 1 (instructions-057, line 11 `@AGENTS.md`, preserve). Bare import must stay literal (the file's own text says so); empty diff. No other edge.

### core/instructions/design-principles.md — set step04-009 — verdict OK
Slots reviewed: 2. instructions-038 (source line 30, `docs/architecture-manifest.json`) preserves; the file exists, is read by `test/architecture.test.mjs` (lines 2 and 24), and "docs/architect" is only a false prefix match. instructions-037 (AGENTS.md line 384, same text) is a `render-join` with `sourceDisposition: preserve`, a correct source-to-render correspondence (render block at AGENTS.md lines 321-411, `source:` header at line 365, `renderOnly` true, no render diff, no copied dependency text). Empty diff, no other docs edges in the file (grep confirmed).

## Counts
- step04-009 (this part): files reviewed 3; files with outcome rework 1 (AGENTS.md); slots reviewed 27 (24 + 1 + 2).
- Set-level >3% rule: set step04-009 has been fully reviewed here and in p16 (the other file belongs to p16). Rework here is 1 of 3 files, above 3%, so every file in the set needs review; the Lead should combine with p16's result.
- Stratum: mandatory re-review (all changed records); no sampled stratum in this part.

## Lead-judgment questions
- Whether line 74 should be parked (successor note naming the area decision records) or patched to a concrete holder; no single live holder exists today, so park looks right.

Status: DONE
Summary: CLAUDE.md and design-principles.md are ok. AGENTS.md needs rework because the ruled Phase 9 slot for `docs/decisions/` at line 74 ("goes into docs/decisions/") is missing; all other wave 1 corrections (001/017/022, 019/020, 021, A34, 037/038) verified.
