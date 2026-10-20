# Step 5 pilot bounded re-review request

Status: final author rework, pending Lead-started independent review. Reviewers **never run checker, probes, tests, generators or processes**. Read the pinned windows and records; whole-file cross-record joins, source/census-versus-grep, diff application/rollback and hashes stay with the plan-local checker. No checker pass is independent semantic acceptance.

Input pin: `aa8d343746a292d2cb476ab76e6489411fd59a62`. Earlier six reports remain historical at the pre-rework packet. This request dispatches **only files whose outcome changed in this turn**. A co-cut test-set expansion is a patch outcome change, even where its pointer remains patch. Record-text/provenance-only files are excluded. Each payload contains at most 60 logical reference/tuple records and 400,000 UTF-8 bytes. Every admitted literal in the changed files and every changed tuple/rejection is reviewed, with ±40 physical source lines around its actual pinned location. If a window does not establish the operation, request additional function context; never infer it. A file streamed across parts has one final verdict after all its slices. Unchanged tuples retain the earlier independent review plus full checker sweep; no later five-seam sample waiver is implied.

Check each changed outcome below against its own passage, inherited Step 3/4 custody, shared literal/dynamic outcome, path operand, generator blocking ownership and exact test co-cut. The three canonical receipts and cutover specifications remain records, with absent proof explicit. Do not apply any patch. Read receipt corrections (six real instruction files, absent marketing root, existing module proofs, unchanged provenance and post-census notes) alongside the changed files, not as extra unchanged consumer files. Co-cut test files are Phase 9 specifications attached to the changed consumer, not additional authored/tested files.

## Changed file outcomes

### `apps/fgos-gateway/src/gateway.rs`

- `reference-000161`: REJECT/preserve → ADMIT/parked.
- `reference-000182`: REJECT/preserve → ADMIT/parked.

### `apps/fgos-gateway/src/mcp.rs`

- `dynamic-000766`: ADMIT/preserve → REJECT/preserve.

### `.githooks/pre-commit`

- `reference-000110`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `reference-000111`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `dynamic-000566`: REJECT/preserve → ADMIT/patch; atomic co-cut test set expanded.
- `dynamic-000571`: ADMIT/preserve → ADMIT/patch; atomic co-cut test set expanded.

### `src/cli/command-registry.mjs`

- `reference-003641`: ADMIT/patch → ADMIT/parked; own source span remapped to line 1760; atomic co-cut test set expanded.
- `reference-003655`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `reference-003666`: ADMIT/preserve → ADMIT/parked.

### `src/runner/merge.mjs`

- `reference-003749`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.

### `src/runner/worktree.mjs`

- `reference-003784`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.

### `src/state/events-jsonl-truncation-guard.mjs`

- `reference-003868`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.

### `src/setup/instruction-registry.mjs`

- `dynamic-013969`: REJECT/preserve → ADMIT/preserve.
- `dynamic-013982`: ADMIT/preserve → REJECT/preserve.
- `dynamic-013988`: ADMIT/preserve → REJECT/preserve.
- `dynamic-013989`: ADMIT/preserve → REJECT/preserve.
- `dynamic-013990`: ADMIT/preserve → REJECT/preserve.
- `dynamic-013991`: ADMIT/preserve → REJECT/preserve.
- `dynamic-013992`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014003`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014006`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014007`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014008`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014016`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014017`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014018`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014026`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014027`: ADMIT/preserve → REJECT/preserve.
- `dynamic-014028`: ADMIT/preserve → REJECT/preserve.

### `src/setup/model-pool-checks.mjs`

- `dynamic-014060`: ADMIT/parked → REJECT/preserve.
- `dynamic-014072`: ADMIT/parked → REJECT/preserve.

### `src/setup/registrations.mjs`

- `reference-003803`: ADMIT/preserve → ADMIT/parked.
- `reference-003804`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `reference-003806`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `reference-003811`: ADMIT/patch → ADMIT/patch; atomic co-cut test set expanded.
- `reference-003828`: ADMIT/preserve → ADMIT/parked.
- `reference-003829`: ADMIT/preserve → ADMIT/parked.
- `reference-003833`: ADMIT/preserve → ADMIT/parked.
- `reference-003834`: ADMIT/preserve → ADMIT/parked.
- `reference-003839`: ADMIT/preserve → ADMIT/parked.
- `dynamic-014207`: REJECT/preserve → ADMIT/patch; atomic co-cut test set expanded.
- `dynamic-014299`: REJECT/preserve → ADMIT/preserve.
- `dynamic-014300`: REJECT/preserve → ADMIT/preserve.
- `dynamic-014301`: REJECT/preserve → ADMIT/preserve.
- `dynamic-014302`: REJECT/preserve → ADMIT/preserve.
- `dynamic-014307`: ADMIT/parked → ADMIT/patch; atomic co-cut test set expanded.
- `dynamic-014338`: ADMIT/parked → REJECT/preserve.
- `dynamic-014345`: ADMIT/parked → REJECT/preserve.
- `dynamic-014346`: ADMIT/parked → REJECT/preserve.
- `dynamic-014907`: REJECT/preserve → ADMIT/patch; atomic co-cut test set expanded.

### `src/setup/run-supervisor-checks.mjs`

- `dynamic-014965`: ADMIT/parked → REJECT/preserve.

### `src/setup/skill-wrappers.mjs`

- `dynamic-015044`: ADMIT/parked → REJECT/preserve.
- `dynamic-015059`: ADMIT/parked → REJECT/preserve.
- `dynamic-015060`: ADMIT/parked → REJECT/preserve.
- `dynamic-015119`: ADMIT/parked → REJECT/preserve.
- `dynamic-015125`: ADMIT/parked → REJECT/preserve.
- `dynamic-015126`: ADMIT/parked → REJECT/preserve.
- `dynamic-015127`: ADMIT/parked → REJECT/preserve.
- `dynamic-015175`: ADMIT/parked → REJECT/preserve.
- `dynamic-015186`: ADMIT/parked → REJECT/preserve.
- `dynamic-015187`: ADMIT/parked → REJECT/preserve.
- `dynamic-015194`: ADMIT/parked → REJECT/preserve.
- `dynamic-015229`: ADMIT/parked → REJECT/preserve.
- `dynamic-015236`: ADMIT/parked → REJECT/preserve.

## Parts

| Part | Payload | Records | Bytes | Required report |
|---|---|---:|---:|---|
| 01 | [step-05-pilot-rr-p01.json](step-05-pilot-rr-p01.json) | 28 | 385,889 | `review-a38-step-05-pilot-rr-p01.md` |
| 02 | [step-05-pilot-rr-p02.json](step-05-pilot-rr-p02.json) | 33 | 389,048 | `review-a38-step-05-pilot-rr-p02.md` |
| 03 | [step-05-pilot-rr-p03.json](step-05-pilot-rr-p03.json) | 32 | 379,520 | `review-a38-step-05-pilot-rr-p03.md` |
| 04 | [step-05-pilot-rr-p04.json](step-05-pilot-rr-p04.json) | 29 | 264,765 | `review-a38-step-05-pilot-rr-p04.md` |

Record per-file verdict, ids checked, exact counter-evidence/defect, and corrected outcome when needed. Report unresolved disagreement to Lead after this one bounded re-review. No reviewer is launched by the author. The remaining five seams follow owner option B (2026-10-20 23:55): 100% of admitted references, ±40 lines; whole-file mechanical checks remain mandatory.
