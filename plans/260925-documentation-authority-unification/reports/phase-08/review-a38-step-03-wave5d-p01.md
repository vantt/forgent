# Wave 5d review, part p01 (pin ae141550c)

Method: each source read whole (all under 5 KB, one page each); every edge's fields and diff read; targets checked at the pin.

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/reference/coding-worker-contract-shape.md | batch-123 | unpatched | 1 | ok |
| docs/reference/dispatch-module-boundaries.md | batch-123 | patched | 2 | ok |
| docs/templates/contract.md | batch-124 | unpatched | 2 | ok |
| docs/ui-spec/15-system-events.md | batch-125 | unpatched | 1 | ok |
| docs/ui-spec/modals/M02-approve-merge.md | batch-125 | patched | 1 | ok |
| docs/ui-spec/modals/M03-add-edit-item.md | batch-125 | patched | 1 | ok |

## Per-file notes (all edges ok)

- coding-worker-contract-shape.md, maps-j-08045 (preserve, line 82-83, path wrapped across lines): docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md exists at the pin. The sentence is a live pointer to a retained history path and carries the locked decisions D3/D4. Preserve is correct and the empty diff is correct. No other legacy path in the file.
- dispatch-module-boundaries.md:
  - maps-j-08047 (patch, row L26, runner.md to docs/platform/runner/decisions/h-36d872fbb0e5.md, anchor for decision 0062): the heading exists at line 1716 of the holder. Its text matches the row's claim (execute/log/fanout-batch removed; decide/inspect/reconcile/probe-account kept; executeExecutorCli is the Assignment transport step; `fgos run`). The anchor follows the repo's extractor slug (single hyphen after "0062"), consistent with other records. The diff changes only the path and appends the anchor. Ok.
  - maps-j-08048 (patch, row L27, confinement-authority.md to docs/platform/agent-confinement/spec.md, no anchor): the holder exists. Whole spec is the right target because the row lists the component's responsibilities. Ok.
  - The row-L26 adjacent description is true against the target.
- contract.md, maps-j-08383 (L16) and maps-j-08384 (L51): both are `../README.md` template placeholders. Preserve is correct under L12-10/L12-21. The unrecorded `../spec.md` and `../verification/` placeholders in the same table are not legacy edges and stay as written.
- 15-system-events.md, maps-j-08464: docs/contracts/fgos-gateway-api-v1.yaml exists at the pin, as a retained gateway contract. Preserve is correct. The route-count prose is unchanged and is not an edge.
- M02, maps-j-08481: target spec.md#approve-a-merge. The heading "### Approve a merge" exists (line 155) and its content matches (changes trunk, outcome including a blocked failure). The diff keeps the "§Approve a merge" locator. Ok.
- M03, maps-j-08482: target spec.md#behaviors-operations. The parent "## Behaviors & Operations" exists, and both "Add a work item" (line 168) and "Edit a work item" (line 175) sit under it. The combined unit is kept and both locators remain. Ok.

## OUTCOME defects

None.

## Record-text notes (not rework)

- The anchors for 08047 and 08482 are the extractor's own anchor form (for example `behaviors-operations`, `0062-xoá-...`), not GitHub's `githubSlug` (`behaviors--operations`). `list-doc-anchors.mjs` accepts either, so they resolve.
- 08045's reason is generic ("sibling proof-history references..."). The file has one edge, so the sentence is boilerplate and not wrong.

## Lead-judgment questions

None.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-123 patched | 1 | 0 |
| batch-123 unpatched | 1 | 0 |
| batch-124 unpatched | 1 | 0 |
| batch-125 patched | 2 | 0 |
| batch-125 unpatched | 1 | 0 |

The batch-125 mandatory file (wireframe-v2.html) is in part p02, not counted here.

Status: DONE
