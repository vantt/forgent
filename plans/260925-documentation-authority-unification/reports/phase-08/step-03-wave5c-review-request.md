# Wave 5c independent per-file review request

Author pin: `ae141550c2e022310de7a0efea757580c0b2479f`. Review only new batches **126–130**, author records only. No consumer edit, cutover, independent acceptance or Phase 8 close is claimed. Lead assigns fresh-context reviewers, budget and the unique report paths below. No reviewer has run yet. Earlier review requests/memberships and batches ≤125 are unchanged.

Read `progress.md` authoring rules digest, `owner-answers.md` A51/L12-21..L12-49 and `step-03-authoring-request.md` schema. The census is mechanical input; never inherit its advisory outcomes. Check complete pinned source and exact target passages before judging the whole-file diff and every preserve/park/row-flip.

Frozen hashes/ranks/mandatory witnesses and both strata are in `step-03-wave5c-manifest.json`; bounded pages and membership are in `step-03-wave5c-review-index.json`. Every selected file is reviewed in full. A mandatory file stays selected even with an empty diff. Three generated files are indivisible own parts, each read in source pages and ≤50-edge pages (stronger than the ≤100-edge limit), with one final whole-file verdict. Never split its record or sample identity. Each extracted page is below 400,000 bytes; read source, diff, proof and witness fields in separate calls.

Reviewers **never run any checker, probe, resolver or verification script**. Python per-field extraction below is for reading only. Do not dump a multi-megabyte JSONL record with `cat`, `head` or whole-object `json.dumps`. Read every source page listed in the index with read-only `git show` at the pin. Read every edge page, all its fields and complete adjacent context. An alias remains lookup data; no render is hand-patched. Generator parity parks are not absence claims or approval of an identity migration.

## Per-set A51 selection

| Set | Patched population → seeded sample | Mandatory files | Eligible unpatched population → seeded sample | Distinct selected |
|---|---:|---:|---:|---:|
| batch-126 | 1 → 1 | 1 | 2 → 1 | 3 |
| batch-127 | 0 → 0 | 1 | 0 → 0 | 1 |
| batch-128 | 0 → 0 | 1 | 0 → 0 | 1 |
| batch-129 | 0 → 0 | 1 | 0 → 0 | 1 |
| batch-130 | 2 → 1 | 1 | 1 → 1 | 3 |

Patched seed is `A51-step03-file-v1` NUL full pin NUL three-digit batch id. Unpatched seed is `A51-step03-file-v1-unpatched` NUL full pin NUL `batch-NNN`; exclude files already selected by patched/mandatory selection. Rank sha256(seed NUL full consumer path), ascending, tie path. Take ceil(15% × eligible population). Exact NUL strings, full ranks and threshold witnesses are frozen, with source digests, diff and record hashes.

For **each set and stratum separately**, publish reviewed-file denominator and rework numerator (a file needing any semantic correction counts once). Initial reviewed denominator is 0; numerator pending. ≤3% passes; >3% expands review to **EVERY file of that set**, including empty-diff/parked/preserve/row-flip/zero-edge records. Do not pool, reseed, substitute or self-accept. Corrected bindings require fresh re-review; Lead records findings and judgments separately.

## Parts

| Part | Output | Files | Edges |
|---|---|---:|---:|
| 01 | `review-a38-step-03-wave5c-p01.md` | 4 | 103 |
| 02 | `review-a38-step-03-wave5c-p02.md` | 1 | 825 |
| 03 | `review-a38-step-03-wave5c-p03.md` | 1 | 493 |
| 04 | `review-a38-step-03-wave5c-p04.md` | 1 | 506 |
| 05 | `review-a38-step-03-wave5c-p05.md` | 1 | 11 |
| 06 | `review-a38-step-03-wave5c-p06.md` | 1 | 69 |

Part 01: `docs/backlog.md`, `docs/coexistence.md`, `docs/distribution-vision.md`, `docs/id-systems-audit.md`.

Part 02: `docs/doc-registry.json`. Indivisible large-file exception; read all listed source/edge pages and deliver one verdict.

Part 03: `docs/doc-registry.md`. Indivisible large-file exception; read all listed source/edge pages and deliver one verdict.

Part 04: `docs/enduser-docs-index.json`. Indivisible large-file exception; read all listed source/edge pages and deliver one verdict.

Part 05: `docs/io-contract.md`.

Part 06: `docs/transitional-switchboard.md`.

## Python field-extractor reading method

Set `consumer`, `record_path`, `start`, `stop` and `field` for the assigned part. Repeat across every indexed page and field; this example intentionally prints one field at a time. Printing the complete source is bounded separately by line ranges. The extractor imports no checker/resolver.

```python
import json, pathlib, subprocess
pin = "ae141550c2e022310de7a0efea757580c0b2479f"
consumer = "docs/doc-registry.json"
record_path = pathlib.Path("plans/260925-documentation-authority-unification/reports/phase-08/step-03-records/batch-127.jsonl")
record = next(json.loads(line) for line in record_path.open()
              if json.loads(line)["file"] == consumer)
for name in ("file", "authorInputCommit", "digest", "inventoryEdgeIds", "diff"):
    # Read long edge-id lists in bounded slices, never the whole record.
    value = record[name]
    print(name, value[:50] if isinstance(value, list) else value)
start, stop, field = 0, 50, "reason"
for edge in record["edges"][start:stop]:
    print(edge["edgeId"], field, json.dumps(edge.get(field), ensure_ascii=False))
source = subprocess.check_output(["git", "show", pin+":"+consumer]).decode().splitlines()
first_line, last_line = 1, 80
for line_no in range(first_line, min(last_line, len(source))+1):
    print(line_no, source[line_no-1])
```

Repeat edge extraction for sourceSpans, matchedExpression, disposition, target, anchor, timing, diffHunk, reason, blockedCategory, dependencyCategory, blockedReason, dependency, targetFacts, unitDispositionReason, authorAddedEdge and searchWitness. Read `checks.coverage` per edge id for resolutionSearches, writerTrace, descriptionTruth; read anchors/relativeResolution/labelForm per edge id. Read legacyScan candidates one at a time. Bind quoted target lines/digests with read-only `git show`, read full target sections and history ancestry where claimed. No witness is semantic acceptance.

Focus: backlog stale generated header is superseded by L12-26(4)/GAP-03; explicit Done/Declined/audit/vision source identities preserve with title-matched successors. Live 0009/0014 decisions require full GAP-02 carry. I/O writer/manifest/host carry is distinct from envelope RUL61. Switchboard whole rows flip with owner/content obligations and retained root spelling; no early promotion or guessed enduser owner. Three generated outputs park on named actual generator/reader parity; no hand patch, alias rewrite or store access.

Return per-file `ok` or `rework`, edge ids and concrete source/target evidence. Record all open Lead rulings from `step-03-wave5c-lead-ruling-gaps.json`; no new rule/checker change is authorized here. Independent acceptance, actual-commit accounting, Step 4 source rebindings and Step 5/Phase 9 readiness remain Lead responsibilities. Markdown preview stays with Lead’s authorized environment; no service/CLI startup in this confined author Unit.
