# Review a38 step-03 wave4c Part 03

Pin ae141550c. All three files are in set batch-072. Edges 04320, 04345 and 04353 are open lead-ruling parks that L12-40 resolves to preserve. I treated them as already ruled.

## Files

### 1. docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md

- Set: batch-072.
- Stratum: open-lead-ruling.
- Verdict: **ok**.
- Edges reviewed: 15 of 15 (04352..04366). I read the 495-line source whole through grep, with every edge region read.

| Edge | Disposition | Check |
|---|---|---|
| 04352 | patch, source line 183 | See below. |
| 04353 | parked, lead-ruling, line 239 | Already ruled; see below. |
| 04354 | preserve, line 285 | `docs/history/tsk-2c1/iron-law-evidence.md` exists at the pin, and the quote is live prose citing a retained history artifact. |
| 04355 | preserve, line 381 | `docs/history/live-events-seq-corruption/plan.md` exists at the pin. |
| 04356..04366 (11 edges: 386, 388, 396, 408, 417, 434, 443, 455, 464, 477, 486) | preserve | See below. |

- 04352: the live-prose Related-style citation (`docs/how-to/add-a-new-npm-dependency-to-forgent.md` step 2) is patched. This is correct.
  - The registry alias holder is `docs/knowledge/add-a-new-npm-dependency-to-forgent/add-a-new-npm-dependency-to-forgent.md`.
  - The file exists at the pin.
  - Its heading "## 2. Prepend `npm install` to any item's own `verify` command" slugs to `2-prepend-npm-install-to-any-items-own-verify-command`, which matches the anchor.
  - The step-2 content matches the claim: the disposable checkout has no `npm install`, which is the yaml/tsk-slq half of the fix.
  - The diff is a single hunk replacing exactly the span, with the trailing "step 2 for that half" preserved. The diff is correct.
- 04353: it is a blockquoted capture of a real work item description, a self-alias. The holder equals the consumer, so L12-40 (1) and (2) apply and the edge preserves. The record is non-executable and consistent with the park. No defect.
- 04356..04366: all of them sit under "## Document history (compound-learn capture linkage)" (heading at line 384). They are explicit history regions under L12-39(6) and L12-40 (1). Preserve is correct. The `docPath`/`doc-sources` quoting in these edges is immutable capture identity.
- Missed references: none. A full grep of the source found no other `docs/` paths and no markdown links. The `ADR0020` and `0005` mentions are bare ids with no path, so they are not edges. Bare `CONTEXT.md` (line 345) and the `src/` and `test/` code paths are exempt.

### 2. docs/knowledge/how-to-label-a-herdr-pane-with-the-claimed-task-from-a-chrom/fgos-terminal-pane-rename.md

- Set: batch-072.
- Stratum: unpatched-seeded.
- Verdict: **ok**.
- Edges reviewed: 3 of 3. I read the source whole (130 lines).

| Edge | Disposition | Check |
|---|---|---|
| 04378 | preserve, line 11 | `docs/history/fgos-terminal-pane-rename/CONTEXT.md` exists at the pin. It is a retained history root cited in live prose. |
| 04379 | preserve, line 20 | `docs/operator-runbook-herdr-cockpit.md` exists at the pin and has no merge or alias entry. It is retained. |
| 04380 | preserve with a non-executable successor note, line 104 | See below. |

- 04380: the path `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` was removed at `4722361ae` and has no successor file. It sits inside a fenced captured-output block (lines 97-105), so it is captured evidence under L12-40 (1). It preserves, and the removed-id rule requires a holder note.
  - The note names `docs/platform/runner/decisions/h-36d872fbb0e5.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập`.
  - That holder has the heading "### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)" at line 102, and the title matches the ADR0020 context.
  - The slug style (collapsed dashes) matches the convention in batch-070.
- No other legacy references. Everything else is code paths (`plugins/`, `src/`, `scripts/`), and `CTR001` and `STR40` are bare ids.

### 3. docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md

- Set: batch-072.
- Stratum: unpatched-seeded.
- Verdict: **ok**.
- Edges reviewed: 1 of 1. I read the source whole (95 lines).

| Edge | Disposition | Check |
|---|---|---|
| 04388 | preserve, line 91 | `docs/history/tsk-1yt-verify-write-time-shell-validation/CONTEXT.md` exists at the pin under the retained history root. |

- The reason's quoted adjacent context is accurate.
- The sibling basename `fix-a-verify-command-broken-by-mixed-in-prose.md` is a bare basename, not a legacy path, so it is not an edge.
- `source_capture_ids: [tsk-12p, tsk-463]` are not paths.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-072 total | 3 files / 19 edges | 0 |
| batch-072 open-lead-ruling | 1 file / 15 edges | 0 |
| batch-072 unpatched-seeded | 2 files / 4 edges | 0 |

Seeded-stratum note: the Part 03 unpatched-seeded files are 2 of the 2 batch-072 unpatched selections, with 0 rework. Patched-seeded stratum is not in Part 03. Overlaps: none.

## Record-text notes (not rework)

- 04353's reason wording ("L12-26(5)") is superseded by L12-40, which Lead will apply in a later commit. This is expected.
- Some preserve reasons for 04354, 04355 and 04388 end "No documentation authority move is asserted". That is fine.

## Lead-judgment questions

None. When 04353 flips to preserve, check that the checker's new fenced/blockquote self-alias exemption applies to line 239 (a blockquoted capture, not fenced code). L12-40 (3) lists "blockquoted captured output", so it should.

Status: DONE
