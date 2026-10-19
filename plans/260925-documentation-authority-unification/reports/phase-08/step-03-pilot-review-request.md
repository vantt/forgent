# Step 3 pilot — one independent semantic review request

Authority: A51; L12-21..L12-29, especially L12-26 classes 1–10, its overruled verdicts and Lead rulings; Phase 8 Steps 3–4. This request is ONE logical full-pilot review, streamed in bounded parts. Lead starts one fresh-context independent reviewer; no review has been launched or accepted by the author.

Author input: `ae141550c2e022310de7a0efea757580c0b2479f`. Inventory input: `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. All 21 consumer files are byte-identical between those inputs, so original complete spans remain bound without positional reattachment. step-02j actions/owners/patch text are advisory only. No consumer file was edited. Every non-empty diff is a Phase 9 cutover specification, not an executable instruction for this review.

Read owner-answers.md A50/A51 and L12-21..29, the phase file Steps 3–4 and step-03-authoring-request.md first. Use the source at the author pin, not a later HEAD. Do not treat the candidate header `Implementation: Carriage only / Canonical: No` as a carriage-region declaration by itself; L12-26 overruled that interpretation. Distinguish live exact sections from explicit source-carriage/History bodies.

## Review scope and verdict contract

Review ALL 21 files / 437 inventory edges, including empty-diff, parked, preserved and row-flip records. Read each whole source file before concluding its one `ok` or `rework` verdict. Packets contain the record once and complete original source bytes in ordered bounded context sections. A large file's context may continue into later packets; do not conclude its verdict early. `fileVerdictReports` in the index assigns its one final verdict to the report containing its final context chunk. Earlier continuation reports record context read / verdict pending. Every part has a distinct reserved report name; the first is `review-a38-step-03-pilot-01.md`.

For each final file verdict give: file and digest; set; `ok` or `rework`; concrete reason with source line/edge/hunk and relevant owner/Lead rule; required corrections; and any authoring-rule gap needing Lead judgment. Findings and Lead judgments stay separate. A file requiring any semantic correction counts once in that set's rework numerator. Report reviewed-file denominator and rework numerator for each set; do not pool sets or call unreviewed files clean. The pilot already expands review to all files; the A51 ≤3% gate still describes each set's eventual result. Corrected records require fresh digest/diff binding and re-review.

For every file assess:

- Current operative navigation still follows the switchboard before cutover; a future candidate path is never presented as current authority. Protected README/root projections receive no hand-patched render. Generated claims must name a verified source/generator, not inherit an obsolete generated header.
- Every inventory edge is dispositioned, with no source/provenance/history rewrite, lost locator, path-prefix loss, image-marker/backtick loss, basename-label drift, self-reference or duplicate Related-list destination. Shared physical units change once and every referring edge joins the same hunk header. `diffHunk` is the exact unique unified-diff header; its complete hunk occurs once in the file's `diff`.
- Inspect the actual candidate target passage at the author pin, not merely the target filename. Exact content/contract/schema read requests cannot fall back to an area README or explicit carriage. Verify plain extractor anchors versus GitHub Markdown anchors with the existing API. Inspect parked dependencies for a real missing passage/target/parity question rather than automatic acceptance of advisory roles.
- Whole-row migration-state flips describe post-flip status/owner semantics, preserve retained root paths, and stay Phase 9. Confirm each parked edge has an explicit non-executable reason and the smallest target/decision/parity dependency. Check P8-DOC-GAP-01/02/03 and workflow carry before any future delete-without-carry. Preserve external-project conventions and retained docs/ui-spec paths.

Do not edit consumers, instructions, skills, switchboard, production code, gates, aliases, tests or reproduction manifests. Return findings to Lead; author does not certify its own semantic result.

## Bounded stream

The JSON part is the review payload. Shared author material is this request, the three step-03 Python tools, the manifest and review index. Each packet plus those shared bytes must stay ≤400,000 bytes; no part exceeds 60 entries. The complete class-3 inventory and policy sources are pinned repository inputs, not duplicated human packet entries. Context text is literal source, not an author synopsis. Validate concatenated source digest with `step-03-review-pack.py --verify`.

| Payload | Bytes | Entries | Reserved report |
|---|---:|---:|---|
| `step-03-pilot-review-part-01.json` | 273,556 | 13 | `review-a38-step-03-pilot-01.md` |
| `step-03-pilot-review-part-02.json` | 293,428 | 15 | `review-a38-step-03-pilot-02.md` |
| `step-03-pilot-review-part-03.json` | 270,102 | 7 | `review-a38-step-03-pilot-03.md` |
| `step-03-pilot-review-part-04.json` | 288,523 | 3 | `review-a38-step-03-pilot-04.md` |
| `step-03-pilot-review-part-05.json` | 269,184 | 3 | `review-a38-step-03-pilot-05.md` |
| `step-03-pilot-review-part-06.json` | 247,041 | 6 | `review-a38-step-03-pilot-06.md` |
| `step-03-pilot-review-part-07.json` | 271,703 | 3 | `review-a38-step-03-pilot-07.md` |
| `step-03-pilot-review-part-08.json` | 169,479 | 4 | `review-a38-step-03-pilot-08.md` |

## Sets and mechanical replay

The seeded selector is recorded even though full pilot review supersedes its review minimum. Population = every non-empty diff, including Phase 9 diffs; seed and ranks are in the manifest and step-03-sample-result.json. Mandatory witnesses include preserved/parked-only large files. Thresholds are source bytes ≥65,536 OR ≥40 edges.

| Set | Files | Edges | Patch | Parked | Row flip | Preserve | Seeded + mandatory distinct |
|---|---:|---:|---:|---:|---:|---:|---:|
| batch-001 | 1 | 2 | 0 | 1 | 0 | 1 | 0 |
| batch-002 | 5 | 111 | 23 | 29 | 5 | 54 | 2 |
| batch-040 | 11 | 161 | 31 | 41 | 3 | 86 | 4 |
| batch-041 | 4 | 163 | 4 | 26 | 0 | 133 | 3 |

Run from `/tmp` (replace ROOT with this checkout's absolute path if moved). No fgOS CLI, activation, runtime service, production alias adoption or live Git index write is involved. The checker creates and removes disposable Git repositories/indexes only under `/tmp/fgos-work/` to run ordinary `git apply --check --cached`; it does not register a linked worktree or touch the plan checkout's index.

```sh
ROOT=/home/vantt/projects/forgentX-phase00-documentation-authority-unification
P="$ROOT/plans/260925-documentation-authority-unification/reports/phase-08"
env -u CLAUDE_CODE_SESSION_ID python3 "$P/step-03-check.py" --author-commit ae141550c2e022310de7a0efea757580c0b2479f
env -u CLAUDE_CODE_SESSION_ID python3 "$P/step-03-check.py" --author-commit ae141550c2e022310de7a0efea757580c0b2479f --select
env -u CLAUDE_CODE_SESSION_ID python3 "$P/step-03-probes.py" --author-commit ae141550c2e022310de7a0efea757580c0b2479f
env -u CLAUDE_CODE_SESSION_ID python3 "$P/step-03-review-pack.py" --author-commit ae141550c2e022310de7a0efea757580c0b2479f --verify
```

Expected mechanical result: 21 files / 437 edges, zero failures; all negative probes rejected; sample identical to the frozen manifest; source context complete and each record present once. Mechanical green is not semantic approval. Check the verification receipt for limits, protected-byte pins and actual command results. Lead separately accounts the real runner commit in both protected Phase 6 manifests and performs committed-byte batch-end acceptance. None of that acceptance is claimed here.
