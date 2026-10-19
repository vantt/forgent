# Step 3 wave 1 — independent per-file review request

AUTHOR records only; **no consumer edit or authority flip**. Author pin `ae141550c2e022310de7a0efea757580c0b2479f`; inventory pin `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. Read [owner answers](owner-answers.md) A51 and L12-21..L12-33, the [authoring rules digest and checker/reviewer table](progress.md#authoring-rules-digest--give-scaled-batches-this-checklist-verbatim), then the complete selected source, its complete JSONL record and diff, and actual target passages. Pilot records remain unchanged and accepted; this request assigns only the selected wave-1 files below.

Wave population: **31 sets / 75 files / 642 inventory + 69 supplemental = 711 edges**. Author dispositions: **48 patch / 70 parked / 50 Phase 9 row-flip / 543 preserve**. There are 13 files with nonempty diffs. [Frozen sample and manifest](step-03-wave1-sample.json) records every file digest, record/diff hash, source byte count, all patched-file populations, complete hash ranks, seed, sample, mandatory witnesses and selected membership. **9 distinct selected files; 3 reviewer parts**. Each part is ≤6 files, ≤150 edges and ≤400,000 source-plus-record bytes; a file is never divided between parts. Read large source/target context in bounded chunks while retaining one whole-file verdict.

## Source and record access

Use the source from Git at the pin, not a working-tree copy or an older inventory excerpt:

```sh
git show ae141550c2e022310de7a0efea757580c0b2479f:docs/architect/README.md
```

For each assigned file, directly read its line in `step-03-records/batch-NNN.jsonl`, selected by exact `file`. Read every edge (including added, preserve, parked and row-flip), all coverage exclusions, the entire proposed diff and the pinned target quotes. `git show <author-pin>:<target>` supplies actual target context. Digest/evidence bindings and author verdicts do not establish semantic correctness. The checker result is author mechanical evidence only.

**Reviewers must not run the checker or probes.** The following command is for Lead/author mechanical reproduction, not reviewer work:

```sh
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-wave1-check.py
```

The wrapper selects pilot + batches 003–033 and invokes the unchanged accepted `step-03-check.py`; it also verifies both manifest freezes. `--select` emits the wave manifest and reruns the unchanged A51 selector. No checker rule, accepted pilot file, resolver, census, production extractor, comparator, test or baseline was changed. The author runs at most one heavy job at a time with the session environment unset.

## Semantic review focus

- Check actual passage role, not the census advisory action: migration-state rows take precedence; provenance, dated engine evidence, explicit whole-source carriage and Related-header lineage preserve their original spelling. The root architecture-map has an explicit whole-file historical-source header; validate that framing against all its units.
- Search-witness hit groups carry the accepted enums. Judge actual claim holders versus incidental citations/partial holders and carriage. A source-snapshot candidate is not an executable patch target, even when its path exists. Parks name their precise source claim and smallest carry or description correction.
- Check every added occurrence and every contextual exclusion, especially basename labels pointing at current relative candidate links, domains/<name>/specs/*.md, proposed directory overlays, quoted runner.md:<line> warnings, and history copies. Source tree leaves must not become full absolute paths by isolated replacement.
- Compare the complete adjacent source description with the target in all six dimensions. The old Stage model, mandatory old intent-ledger second reads, current-status SVG gloss and obsolete overlay grouping are parked as description-rewrite. Validate source qualifiers and sibling-row implications independently.
- Check exact live target, complete label/destination, preserved relative/image/path form, nearest enclosing claim holder and explicit whole-file scope justification. Combined claims spanning peer sections use their common parent and evidence for all peer subjects; ensure no source locator was dropped.
- Row-flips describe whole-row/paragraph authority semantics and retained-root dependencies. They apply no early diff. Verify retained laws/CLI-I/O/user-doc roots are not silently retired and that planned tutorials slots are not represented as real directories.
- History facts are pinned to Git ancestry, with exact rename successor and deletion state where applicable. Preserved retiring paths say they exist at author pin and retire at Phase 9, or carry their actual absent/renamed state. Never inherit prior semantic acceptance for a new record.

## Reviewer parts

### p01

Report: `review-a38-step-03-wave1-p01.md` in this directory. **3 files / 79 edges / 254,227 source-plus-record bytes**. The report name is unique to this part.

| File | Set / record | Inventory + added edges | Patch | Parked | Row-flip | Preserve |
|---|---|---:|---:|---:|---:|---:|
| `docs/architect/README.md` | `batch-003.jsonl:1` | 15 + 0 | 4 | 11 | 0 | 0 |
| `docs/architect/agent-coordination/README.md` | `batch-004.jsonl:1` | 45 + 1 | 1 | 0 | 0 | 45 |
| `docs/architect/agent-coordination/architecture/README.md` | `batch-004.jsonl:2` | 18 + 0 | 10 | 4 | 0 | 4 |

### p02

Report: `review-a38-step-03-wave1-p02.md` in this directory. **3 files / 59 edges / 377,050 source-plus-record bytes**. The report name is unique to this part.

| File | Set / record | Inventory + added edges | Patch | Parked | Row-flip | Preserve |
|---|---|---:|---:|---:|---:|---:|
| `docs/architect/component-boundary/README.md` | `batch-005.jsonl:1` | 24 + 4 | 17 | 7 | 0 | 4 |
| `docs/architect/domainization/README.md` | `batch-006.jsonl:1` | 6 + 0 | 1 | 0 | 0 | 5 |
| `docs/architect/proposals/component-authority-boundary-map.md` | `batch-008.jsonl:2` | 15 + 10 | 1 | 15 | 0 | 9 |

### p03

Report: `review-a38-step-03-wave1-p03.md` in this directory. **3 files / 54 edges / 207,416 source-plus-record bytes**. The report name is unique to this part.

| File | Set / record | Inventory + added edges | Patch | Parked | Row-flip | Preserve |
|---|---|---:|---:|---:|---:|---:|
| `docs/architect/roadmap.md` | `batch-009.jsonl:1` | 5 + 6 | 2 | 9 | 0 | 0 |
| `docs/platform/agent-coordination/README.md` | `batch-015.jsonl:1` | 3 + 0 | 1 | 0 | 0 | 2 |
| `docs/architecture-map.md` | `batch-033.jsonl:2` | 39 + 1 | 0 | 0 | 0 | 40 |

## Per-set A51 accounting and handback

Keep each set separate. Reviewed-file denominator starts at its selected count below; rework numerator is pending, not zero. A file with any required semantic correction counts once. **≤3% rework passes that set; >3% expands review to every file in that set**, including zero-diff and preserved/parked-only files. Never pool sets, replace a selected failure, or silently reseed. Corrected records need fresh digest/diff binding and re-review. A set with no selected file has no semantic-review claim. The ≥40-total-edge supplement adds one conservative mandatory file beyond the inventory-only threshold; it waives no mandatory file.

| Set | All files | Patched-file population | Seeded sample | Mandatory | Selected denominator | Rework numerator |
|---|---:|---:|---:|---:|---:|---|
| batch-003 | 1 | 1 | 1 | 0 | 1 | pending |
| batch-004 | 11 | 7 | 2 | 1 | 2 | pending |
| batch-005 | 1 | 1 | 1 | 0 | 1 | pending |
| batch-006 | 1 | 1 | 1 | 0 | 1 | pending |
| batch-007 | 3 | 0 | 0 | 0 | 0 | pending |
| batch-008 | 2 | 1 | 1 | 0 | 1 | pending |
| batch-009 | 1 | 1 | 1 | 0 | 1 | pending |
| batch-010 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-011 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-012 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-013 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-014 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-015 | 22 | 1 | 1 | 0 | 1 | pending |
| batch-016 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-017 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-018 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-019 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-020 | 2 | 0 | 0 | 0 | 0 | pending |
| batch-021 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-022 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-023 | 6 | 0 | 0 | 0 | 0 | pending |
| batch-024 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-025 | 2 | 0 | 0 | 0 | 0 | pending |
| batch-026 | 2 | 0 | 0 | 0 | 0 | pending |
| batch-027 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-028 | 2 | 0 | 0 | 0 | 0 | pending |
| batch-029 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-030 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-031 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-032 | 1 | 0 | 0 | 0 | 0 | pending |
| batch-033 | 2 | 0 | 0 | 1 | 1 | pending |

Each report must state the author pin, assigned files and record/diff hashes, then one **ok / rework / needs-Lead-ruling** verdict per complete file with exact edge ids and source/target passages for findings. Separate required corrections from suggestions and Lead judgments. Record actual elapsed review time. A new rule gap goes to Lead; affected edges stay non-executable until ruled and the ruling is applied to earlier records as needed.

No reviewer is launched by this request. Lead owns independent dispatch, reviewer budget, acceptance, A51 expansion and actual runner-commit accounting in the two protected Phase 6 manifests, followed by clean committed-byte proof. This author turn does not claim Step 3 acceptance, Phase 8 closure or Phase 9 authorization. Existing pilot dependencies (GAP-02 full-content carry, workflow carry/re-resolution and Step 5 parity) remain scoped obligations; this wave found no new Lead-ruling gap. Markdown preview stays with Lead under the record-only worker boundary.
