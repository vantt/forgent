# Wave 5d independent per-file review request

Author pin: `ae141550c2e022310de7a0efea757580c0b2479f`. Review only new **batches 123–125**, authored in order **125 → 124 → 123**. The author stops at a complete-batch context-budget boundary; **105–122 remain unauthored**, without a partial next record. Batches 126–130 and every earlier record/request stay frozen. These are patch RECORDS, with no consumer edit, authority flip or acceptance claim. Lead supplies fresh-context reviewers and the exact report paths below; this request launches nobody.

Read `progress.md` authoring rules digest, `owner-answers.md` A51 and L12-21..L12-49 (including L12-47 provenance lines), then `step-03-authoring-request.md` schema. The inventory is mechanical input; its advisory action is not an authoring decision. Review each selected complete pinned source and exact target passages, its complete diff, and every preserve/park outcome in the file. Candidate status alone does not establish history. Related is navigation; Source/Provenance is lineage.

Frozen file/diff/record bindings, exact NUL seeds/ranks and mandatory witnesses: `step-03-wave5d-manifest.json`. Whole-source pages, edge pages and report membership: `step-03-wave5d-review-index.json`. Read every indexed page. The HTML file ≥64 KiB is mandatory and has its own indivisible part, even though its diff is empty. Source pages are consecutive 8,000-character slices (including bundled libraries and all embedded prose), each below 400,000 bytes; edge pages are ≤50 edges, stronger than the ≤100-edge limit. Read fields separately; deliver one verdict for the whole file, never a verdict that silently excludes a page.

Reviewers **never run any checker, probe, resolver or verification script**. Use the Python extractor below for reading only. Read quoted target text at the exact pin, not current checkout bytes. No source, code, test, config or record edit is authorized by this review request.

## Per-set A51 selections

| Set | Patched population → seeded sample | Mandatory | Eligible unpatched population → seeded sample | Distinct selected |
|---|---:|---:|---:|---:|
| batch-123 | 1 → 1 | 0 | 5 → 1 | 2 |
| batch-124 | 0 → 0 | 0 | 4 → 1 | 1 |
| batch-125 | 12 → 2 | 1 | 1 → 1 | 4 |

Patched seed: `A51-step03-file-v1` NUL full pin NUL three-digit batch id. Unpatched seed: `A51-step03-file-v1-unpatched` NUL full pin NUL `batch-NNN`. Exclude files already selected by the patched/mandatory union from the eligible unpatched population. Rank sha256(seed NUL full consumer path), ascending, tie path; select ceil(15%). Always union every source ≥65,536 bytes or file ≥40 edges, even when unpatched. Keep frozen membership; no pooling, substitutions or reseeding.

For **each set and stratum separately**, report reviewed-file denominator and rework numerator; any required semantic correction counts the file once. Initial denominator 0, numerator pending. ≤3% passes; >3% expands semantic review to **EVERY file in that set**, including empty-diff, parked, preserve, row-flip and zero-edge records. Corrected bindings need fresh re-review. Lead records findings and judgments separately; no author self-acceptance.

## Parts

| Part | Output | Files | Edges |
|---|---|---:|---:|
| 01 | `review-a38-step-03-wave5d-p01.md` | 6 | 8 |
| 02 | `review-a38-step-03-wave5d-p02.md` | 1 | 11 |

Part 01: `docs/reference/coding-worker-contract-shape.md`, `docs/reference/dispatch-module-boundaries.md`, `docs/templates/contract.md`, `docs/ui-spec/15-system-events.md`, `docs/ui-spec/modals/M02-approve-merge.md`, `docs/ui-spec/modals/M03-add-edit-item.md`.

Part 02: `docs/ui-spec/generated/wireframe-v2.html`. Indivisible mandatory file; all source/edge pages, one whole-file verdict.

## Python field-extractor reading method

Select the assigned consumer/record and repeat every indexed source page and edge page. This code imports no checker/resolver. Do not print a complete JSONL record or a whole minified HTML line. For every edge, read all fields and its source context; `searchWitness` is a binding, not semantic acceptance.

```python
import json, pathlib, subprocess
pin = "ae141550c2e022310de7a0efea757580c0b2479f"
consumer = "docs/ui-spec/generated/wireframe-v2.html"
record_path = pathlib.Path("plans/260925-documentation-authority-unification/reports/phase-08/step-03-records/batch-125.jsonl")
record = next(json.loads(line) for line in record_path.open()
              if json.loads(line)["file"] == consumer)
# Read metadata/diff separately. Slice inventoryEdgeIds in pages of 50.
field = "diff"
print(field, record[field])
start, stop, field = 0, 50, "reason"
for edge in record["edges"][start:stop]:
    print(edge["edgeId"], field, json.dumps(edge.get(field), ensure_ascii=False))
# All source pages, including large/minified lines; offsets come from the index.
source = subprocess.check_output(["git", "show", pin+":"+consumer]).decode()
first_character, last_character_exclusive = 0, 8000
print(source[first_character:last_character_exclusive])
```

Repeat edge-field extraction for `sourceSpans`, `matchedExpression`, `disposition`, `target`, `anchor`, `timing`, `diffHunk`, `reason`, `blockedCategory`, `dependencyCategory`, `blockedReason`, `dependency`, `targetFacts`, `unitDispositionReason`, `authorAddedEdge`, `historyRegion` and `searchWitness`. Read coverage `resolutionSearches`, `writerTrace`, `descriptionTruth`, then `anchors`, `relativeResolution`, `labelForm` per edge id. Read each legacyScan candidate and every source page. Verify the whole adjacent paragraph/list/row, all six description dimensions, and real target quotes/headings/line correspondence. Whole-file claims must justify that breadth. Inspect ancestry where a reason claims rename/removal/nonexistence.

Focus: batch-125 UI citations go to the exact dashboard operations, Data Dictionary row 4 and Business Rules, keeping all locators and the combined Add/Edit unit. The companion reference follows its committed alias to the complete layout document. UI compiler root and retained gateway/history references stay literal. Eleven generated HTML citations park on Step 5 compiler/source/render parity: `docs/ui-spec/00-overview.md` names validate/build/interpret-wireframe under the ui-spec skill tools; no hand patch of the render. The render's old server-emitted event prose must be reconciled with current client-derived event source during parity work. Template links remain reusable placeholders (L12-10/L12-21), not inferred concrete fgOS owners. Batch-123 maps live decision 0062 to its exact runner narrative and confinement to the complete component spec; existing retained sibling reference/how-to/history citations preserve.

New-set open Lead-ruling lists are empty in `step-03-wave5d-lead-ruling-gaps.json`. The full checker result separately enumerates every present set. Report new semantic uncertainties as findings; no new rule/checker change is authorized. Return `ok` or `rework` per file, concrete edge ids and source/target evidence. No set closure, independent acceptance, committed-byte accounting, Step 4 source rebindings or Step 5/Phase 9 readiness is claimed here. Markdown preview stays with Lead; no service startup in this author Unit.
