# Step 3 wave 3, Part 08 review

Pin: ae141550c2e022310de7a0efea757580c0b2479f (worktree feeeeee92, read-only). Records read: batch-064 and batch-065 JSONL, via per-field Python extraction (edge fields, checks.coverage incl. legacyScan, diff). No checker or probe run. Sources read whole with `git show <pin>:<path>` (all six files are under 12 KB). Targets verified with `git cat-file -e` / `git show` at the pin. Independent grep of every `.md`, `.json` and `docs/`-style token in each source confirmed no path-bearing reference lacks an edge. Record digests are in each record's `digest` field and were not re-derived.

## Per-file verdicts

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/explanation/dispatch-config-cache-scope-narrowed.md | batch-064 | unpatched-seeded | 2 | ok |
| docs/explanation/eventlog-guard-fail-closed-event-count-checkpoint.md | batch-064 | unpatched-seeded | 2 | ok |
| docs/explanation/eventlog-sweep-checkpoint-redesign.md | batch-064 | patched-seeded | 6 | ok |
| docs/explanation/eventlog-tier-a-multifile-content-hash-redesign.md | batch-064 | unpatched-seeded | 6 | ok |
| docs/explanation/executor-dispatch-manual-log-gap-and-step-b5-fix.md | batch-065 | unpatched-seeded | 1 | ok |
| docs/explanation/fanout-batch-per-child-sync-spawn-and-listwork.md | batch-065 | unpatched-seeded | 1 | ok |

All 18 edges were reviewed. Each file's legacyScan reports 0 candidates and authorAddedEdgeIds is empty. My own token scan agrees, so there are no missed references.

## Edge notes (evidence)

- **dispatch-config-cache** (all lines at pin):
  - 03815, L16, `docs/history/dispatch-config-cache/RESEARCH.md`: preserve. The path never existed (`git log` over that path is empty; `docs/history/` has no such dir). The passage is a past-tense research-evidence citation, so preserve is right. The reason quotes the marker passage.
  - 03816, L46, `docs/history/<feature>/CONTEXT.md`: preserve as an illustrative pattern. `docs/history` is a committed, retained directory.
- **eventlog-guard-fail-closed**: 03835 and 03836 are sibling explanation links that exist at the pin and are not aliased. Preserve is correct.
- **eventlog-sweep-checkpoint-redesign**:
  - 03837, 03838, 03839, 03841 and 03842 point to explanation siblings that all exist at the pin. Preserve is correct.
  - 03840, L120, `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`: patch, Phase 9. The source path is absent at the pin. `doc-registry.json` lists it as an alias of `docs/knowledge/how-to-resolve-a-git-merge-conflict-on-fgos-events-jsonl-wit/resolve-an-events-jsonl-merge-conflict.md`. This is the L12-37(2) renamed-alias case, so patching is required.
  - 03840 target: the file exists at the pin. Its H1 (line 10) is the nearest heading over the claim. The slug `…-on-fgoseventsjsonl-without-breaking-seq-contiguity` is correct.
  - 03840 adjacent description: the source says three docs were marked historical for the deleted contiguity mechanism. The target's own "Superseded (`tsk-3tp`…)" note at lines 12-25 says exactly that, and names the deleted `check-events-seq-contiguity.mjs` as no longer wired into `npm test`. All six description dimensions hold, and no counts or lists are made false.
  - 03840 diff: the hunk at L117-127 matches the pinned bytes. It keeps the backticks and replaces only the path, appending `#anchor`.
- **eventlog-tier-a**:
  - 03843, 03845, 03846, 03847 and 03848 point to explanation siblings that exist at the pin. Preserve is correct.
  - 03844, L127, `docs/history/tsk-3ve-<n>/plan.md`: an illustrative `<n>` pattern under the retained `docs/history/` tree. Preserve is correct.
- **executor-dispatch-manual-log-gap**:
  - 03852, L11, `docs/specs/runner.md` ("decision 0062 in …"): preserve. It sits in a dated "Removed door (2026-10-14)" banner with past-tense "were removed … kept as history". That is the L12-35(3) dated retirement framing. It is not an undated present-tense citation (L12-37(3)). The same framing is preserved in at least 15 sibling records (batches 036, 037, 064-068), so it is consistent. The decision does exist at the pin: `docs/specs/runner.md` RUL90 and `docs/platform/runner/decisions/h-36d872fbb0e5.md` §0062.
- **fanout-batch-per-child**: 03858 points to `worker-prompt-iron-law-evidence-timing.md`, which exists at the pin. Preserve is correct.

## Outcome defects (rework)

None.

## Record-text notes (not rework)

1. 03852: the reason says "tree retires at Phase 9" but names no live successor. The digest asks for one where available: `docs/platform/runner/decisions/h-36d872fbb0e5.md`, §0062 (line 1716 at the pin). It is optional because the preserve is in a dated retirement wrapper.
2. 03844: the phrase "in its explicitly named source context" is loose. The edge is a plain illustrative `<n>` pattern, and the rest of the reason is accurate.
3. 03815: it is a retained-text decision that the preserved narrative cites a never-existing research file. The reason quotes the marker correctly. After cutover the reference stays dangling, but it is research history, not live navigation.

## Lead-judgment questions

None needed. The only borderline item is 03852: dated removal banner (preserve, as recorded) versus decision citation as live navigation (patch to the h-36d872fbb0e5 §0062 heading). I judge the recorded preserve correct under L12-35(3) and consistent with the siblings. If the Lead prefers the L12-37(3) reading for dated banners that cite a live decision holder, all of those sibling records would change together, not this one alone.

## Counts

| Set | Stratum | Reviewed | Rework |
|---|---|---:|---:|
| batch-064 | unpatched-seeded | 3 | 0 |
| batch-064 | patched-seeded | 1 | 0 |
| batch-065 | unpatched-seeded | 2 | 0 |
| batch-065 | patched-seeded | 0 | n/a |

The part total is 6 files and 18 edges, with 0 rework.

Status: DONE
Summary: All six files and 18 edges are ok. One patch (03840, via the doc-registry alias to the knowledge holder) was verified for target, anchor, description and diff, and no references were missed. There are three minor record-text notes and no outcome defects.
