# Reader patch specifications — not applied to the source repository

All specs bind `cffe725b948f5a695728c8da08f114e7e97075d6`; refresh/review at F. Never fuzzy-apply a source retirement.

| File | Contract |
|---|---|
| `prior-script-refs.json` | Every original `scriptRefs` occurrence, original locator, normalized reader, target retain/archive/already-pruned, disposition and owning-proof locator. Retained inputs require no source patch. |
| `historical-replay-specs.json` | All 47 historical reader files / 135 joins. Repoint **execution context**, not frozen script bytes. Includes exact recovery blob/SHA/size for each absent input. |
| `standalone-retirement-specs.json` | Exact whole-file deletion operations for migration-only replay entrypoints; preimage SHA/blob, expected absence, archive commit, reason inputs and owning historical replay. |
| `reader-index.json` | New scan joins against moving files, including embedded JSON/JSONL/fenced/inline source locators. Archive program+inputs together, or repoint historical record context. |
| `enumeration-review.json` | Deduplicated enumeration candidate lines, first field/line locator and occurrence count; explicit retained directory sets. This is a review queue, not a list of waived matches. |

## Applying a standalone retirement

1. Require that its final pre-flip owning proof/review has completed and its migration-only current role has ended. A pending gate is **not** retired to make it pass.
2. Require SHA-256 equality to `beforeSha256` and `archiveCommit:path == beforeBlobId`.
3. Require that the source is neither a test nor a live production module.
4. Remove the whole entrypoint from the tip. No stub returning success; original bytes stay at the archive commit.
5. Verify every retained reader/input and run the unchanged owning tests.

`../rehearse.py` applies these operations only in the disposable clone, not this checkout. Its conditions are a rehearsal assumption, **not approval that gates are already green**.

## Applying a historical-context repoint

Install/retain the main-side `historical-replay-specs.json` table with the archive manifest. A row means its dated record is historical evidence, **not a runnable current-tip recipe**. The target is the exact full archive commit and, for previously pruned inputs, their original recovery blobs. Embedded source and historical verdicts stay verbatim. This is not an automatic filesystem fallback and not a claim that every old recipe still passes.

An intentional replay gets its own disposable checkout:

```sh
# Only a disposable clone; never the live repository or a user checkout.
git -C /tmp/fgos-work/archive/<disposable-clone> worktree add --detach \
  /tmp/fgos-work/archive/<new-replay-worktree> <approved-archive-commit>
```

For each missing old input, recover exactly its recorded blob into that new worktree, verifying byte count and SHA-256 first. Then follow the record's own input pin, arguments and external output restrictions. Do not run saved mutation recipes casually. Different historical source pins may still make a replay fail; do not rebaseline or label such a replay current-code proof.

## Review boundary

A historical embedded command is not a product reader merely because it resembles JavaScript. Conversely a zero basename match does not clear a constructed-name reader. Standalone enumeration programs outside the explicitly retained owning-proof roots are conservatively retirement proposals. The retained rationale directory filters, all ledger/pilot shards and all Phase 02 inventory parts stay at their exact paths.

Final-pin review must decide the historical-context queue and confirm the retirement schedule, especially the current Phase 09 gate replayers. The static result `unresolvedLiveSources: 0` means **literal standalone joins only**, never universal reachability. No new input or assertion is removed to manufacture green tests.
