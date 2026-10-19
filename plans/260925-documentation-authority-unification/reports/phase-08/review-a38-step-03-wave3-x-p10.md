# Review a38 step-03 wave3 expansion, Part 10

Pin `ae141550c2e022310de7a0efea757580c0b2479f`, read in `/home/vantt/projects/forgentX-s8-review`. No checker or probe was run, and nothing was written to the worktree.

Method: for each of the 6 files I loaded the batch-065 record with python (per edge: edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency fields, searchWitness queries; plus the diff and the coverage/legacyScan candidates). I read every pinned source whole with `git show`; the largest, `herdr-spawn-adapter-fresh-pane.md` (25 KB), I read in full with line numbers. I checked every target at the pin: file existence, `docs/doc-registry.json` alias entries, anchor headings, and the decision heading in `docs/platform/runner/decisions/h-36d872fbb0e5.md`. I also grepped `docs/platform` for RUL105.

## Per file

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| `docs/explanation/gate-bypass-keyword-floor-false-positives.md` | batch-065 | full-set-expansion | 0 | ok |
| `docs/explanation/general-verb-events-baseline-write-verified-fixed.md` | batch-065 | full-set-expansion | 4 (03874-03877) | ok |
| `docs/explanation/gitignore-docs-history-reverify.md` | batch-065 | full-set-expansion | 6 (03878-03883) | ok |
| `docs/explanation/glm-openrouter-executor.md` | batch-065 | full-set-expansion | 3 (03884-03886) | ok |
| `docs/explanation/herdr-orchestrator-terminology-boundary.md` | batch-065 | full-set-expansion | 5 (03887-03891) | ok |
| `docs/explanation/herdr-spawn-adapter-fresh-pane.md` | batch-065 | full-set-expansion | 5 (03892-03896) | ok |

## Edge findings

- **gate-bypass (0 edges).**
  - The source (3.7 KB) names only the bare basenames `AUDIT.md`, `FINDINGS.md` and `plan.md`.
  - It has no docs path, no Markdown link and no legacy-root path, and the record's legacyScan reports 0 candidates. A zero-edge record is correct.
- **03874, 03875, 03876, 03877 (L10, L11, L51-52, L63).**
  - These are relative links to `eventlog-tier-a-multifile-content-hash-redesign.md`, `eventlog-sweep-checkpoint-redesign.md` (twice) and `opportunistic-checks-test-regression-fgos-oet.md`.
  - All three targets exist at the pin. The registry gives each `currentPath` in `docs/explanation/` with `aliases: []`, so the renamed-alias rule (L12-37(2)) does not apply.
  - Preserve is correct.
  - 03876 wraps across two lines, and the source span covers both lines whole.
- **03878-03882 (`docs/history` at L2, L5, L11, L19, L28).**
  - `docs/history/**` is retained (L12-10), and the tree exists at the pin.
  - Preserve is correct. L2 is the `authoritative_for` key, and L11 and L19 carry a leading slash that the matched expression includes.
  - Every `docs/history` occurrence in the source is covered.
- **03883 (`docs/backlog.md`, L34).** It is a retained hand-maintained root file (L12-30..L12-36 series) and exists at the pin. Preserve is correct.
- **03884 (glm L11).**
  - This is the "Removed door (2026-10-14)" banner citing "decision 0062 in `docs/specs/runner.md`".
  - The file is dated explanation, which is history under L12-38(1), so preserve with a successor note is correct.
  - The note points at `h-36d872fbb0e5.md`, whose `### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work ...` heading exists (L1716). The note does not name the edge's own path.
  - The banner is a removal notice and does not claim "where the doc lives now", so L12-38(6) does not apply.
- **03885 (glm L24).**
  - The text is "pi reads the key from the `auth.json` the sandbox is handed (docs/specs/runner.md RUL105)" in a dated 2026-10-05 update that reaches forward to 2026-10-19.
  - It is parked as `phase9-carry`. RUL105 exists only in `docs/specs/runner.md:1136` and `docs/specs/confinement-authority.md`, and I confirmed it has zero hits under `docs/platform` at the pin.
  - The nearest live text is `h-6979005beaf7/spec.md` L199 (`llmAccounts` / `credentialStore`) and RUL80, which does not define the RUL105 rule. A successor note therefore cannot name a true narrative holder, and the park is correct.
  - searchWitness shows RUL105 with 0 hits and 0 live hits, with the alias-table and registry lookups empty.
  - See Lead-judgment question 1.
- **03886 (glm L116).**
  - This is a link to `fanout-batch-per-child-sync-spawn-and-listwork.md`. It exists at the pin and is registered with no alias.
  - Preserve is correct.
- **03887 (herdr-orchestrator L2).**
  - This is the "docs/architect's own dispatch-control-plane-redesign.md §5.1" phrase inside the `authoritative_for` front-matter key.
  - Preserve under L12-21 (exact-match identity key) is correct.
  - The bare `dispatch-control-plane-redesign.md` at L2 is the record's one scan candidate, excluded under L12-38(5) with a true reason.
- **03888 (herdr-orchestrator L21).**
  - This is a patch to `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles`, with timing Phase 9.
  - The target exists at the pin. Its heading `### 5.1 Dispatch Roles` slugs to `51-dispatch-roles`, and L143 reads "orchestrator - T0 composition layer that manages N units of work and stays attached".
  - The target also holds this item's own subsection (§12.1a, "Herdr Own Rust Vocabulary Is a Separate Namespace"), so the adjacent description stays true.
  - The diff replaces only the path span and keeps "§5.1" and the rest of the line intact.
  - The `d0026` link at L23 (03889) is not touched. See Lead-judgment question 2.
- **03889 (L23).** This is a link to `d0026-native-first-dispatch-narrative-reconciliation.md`. It exists at the pin and is not aliased. Preserve is correct.
- **03890 (L49) and 03891 (L50).**
  - Both sit under the present-tense heading "Where the doc lives now" and name `docs/architect/...` locations.
  - Both park as `description-rewrite`, with `ba7b62ac` kept as historical evidence. This is the L12-38(6) case the owner named for this file.
  - The searchWitness has no live holder for the old flat path, and none is needed to park.
  - Parking only the two location paths and not the "moved ... (commit ba7b62ac)" prose is consistent: the whole section is one account to rewrite.
- **03892 (herdr-spawn L11).** This is the same "Removed door" banner as 03884, with the same successor note. Preserve is correct.
- **03893 (L85).** `docs/history/pi-executor-runtime-capacity/evidence/` exists at the pin and is retained. Preserve is correct.
- **03894 (L129).**
  - The source cites `docs/how-to/fix-fgos-write-rejected-merge-block.md`. That path is missing at the pin.
  - The registry doc `how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-change:fix-fgos-write-rejected-merge-block` carries it as an alias, with `currentPath` `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md`.
  - The patch therefore matches L12-37(2), and the patch target is the registry holder.
  - The anchor `#how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-change` matches the H1 "How to fix a `fgos-write-rejected` merge block on a `.fgos/` change".
  - The reason's whole-guide choice is right, because the cited examples `tsk-5ge` (L223) and `tsk-28o` (L259) are separate H2 sections.
  - The diff replaces only the path span.
- **03895 (L319).** `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` exists at the pin and is retained. Preserve is correct.
- **03896 (L351).**
  - `docs/architecture-manifest.json` exists at the pin and is named as a deleted-entries location in dated narrative. Preserve is correct.
  - See record-text note 1.

No missed references were found.

- In the herdr-spawn source, the remaining mentions are code and test paths (`transport.mjs`, `test/runner/...`, `.fgos/config.json`), bare `AGENTS.md` and `CHANGELOG.md`, and bare decision ids such as ADR0020. None is a link target or an explicit legacy-root path, so under L12-38(5) and ruling 7 none is an edge.
- glm L36 `README.md` sits inside a quoted tool-call transcript. The scan excludes it with a true reason.

## Record-text notes (not rework)

1. 03896 and several other preserve reasons use the shared template wording "tree retires at Phase 9". That wording is slightly off for `docs/architecture-manifest.json` (a retained docs-root file) and for `docs/specs/runner.md` in a preserve whose real reason is dated narrative. The disposition is unaffected.
2. 03885's `dependency` and `blockedReason` repeat the same long sentence. No defect.

## Lead-judgment questions

1. **03885 (glm L24, RUL105 citation in a dated update).**
   - Parking as `phase9-carry` is consistent with L12-30(3) and L12-38(3). The rule has no promoted holder, so no successor note can be written.
   - The alternative is preserve plus a note, but that would need an invented holder.
   - Please confirm that a dated explanation citation of a rule with no promoted holder parks rather than preserves. I recommend keeping the park.
2. **03888 (herdr-orchestrator L21, patch inside a dated explanation).**
   - The file is dated history under L12-38(1), but the edge is an undated, present-tense navigation pointer ("per <doc> §5.1 ... names the T0 composition layer"), not a decision-id citation.
   - It is the only docs/architect patch in batch-065. The other docs/specs and docs/architect preserves are removal-banner narratives or the L12-21 identity key.
   - A patch to the surviving §5.1 is sound and I accept it, but if the Lead wants every path citation in dated explanation files preserved with a note, this edge would flip.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-065 / full-set-expansion | 6 files, 23 edges | 0 |

Status: DONE
