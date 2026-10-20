# Review p09 (Step 5 seam 4, source windows)

Counts: 3 files, 62 items (18 + 21 + 23), 0 diffs, 0 parks; every item preserve. 0 OUTCOME defects.

## scripts/check-decision-codes.mjs: ok (18 items)
- 002474 (L8 docs/history CONTEXT.md in header comment): admit/preserve. docs/history is the retained convention and exists at the pin, so it is not a retiring-tree target. ok.
- 006530-6546 all reject. Operands are argv guards, `test`/scripts baseline defaults, resolve(cwd, ...) of a test dir or baseline, a test-tree walk join, and count or caller-data messages. None builds or reads a docs path (the test dir is `test`, the baseline is `scripts/*.json`). Each nonDocumentUse is true.

## scripts/check-decision-supersession.mjs: ok (21 items)
- 002475/2476/2477/2479 preserve. 002478 and 002480 (retired 0000-index.md) preserve with successorNote docs/decisions/index.md and existsAtPin false, as R8 requires. L138-140 are one passage with one outcome.
- 006547/6548 admit. They are messages that print the fixed retired basename 0000-index.md (R6).
- 006549, 006551-6555 admit. They read a record file, default to 'docs/decisions', resolve the docs dir, and build indexPath. pathOperand is real in each case.
- Reject: 006550 (argv guard), 006556/6557/6559-6561 (id/count/message formatting), 006558 (substring search over already-read text, no path). All true.
- Same-line pairs agree: 6552/6553 and 6554/6555 both admit.

## scripts/check-doc-candidate-status.mjs: ok (23 items)
- 002481 (L15 docs/doc-governance.md): admit/preserve under R9 as frozen gate identity. The target is retained in place (exists at the pin, not under docs/specs or docs/architect).
- Admit: 006565 (dirname of a doc file), 006566 (existsSync probe), 006568/6570 (join(dir,target|related) probed), 006571 (option path resolve), 006573/6574 (switchboard and constitution JSON reads), 006577 (doc read), 006582 (DEFAULT_SWITCHBOARD_PATH plans/ literal). All yield a document or gate path.
- Reject: 006562-6564, 6567, 6569, 6575, 6576, 6578-6581 (caller-data or count formatting). 006572 (repoRoot scalar). 006583 (path: file finding field). Those are R5/R6 correct.
- The caller-only messages at L120/L123 reject while the existsSync probes on the same lines admit. This matches the L12-72 rule that disjoint operations keep their own admission.

## Record-text notes (not outcome defects)
- 006558 (check-decision-supersession L40) uses nonDocumentUse "caller-data-formatting". The real use is a substring search over already-read index text. A more accurate label is something like "text search, no path".
- 006571 (candidate-status L133) is labelled "document-path-operation" but the operation sits in a generic `option()` helper. Its fallback `'.'` for --repo-root is a root. Only the --switchboard and --constitution callers make it a document path. The reason text could name those two callers.
- 006565 and 006566 use targetSetOrConstruction/currentPassage windows that span several operations. This is harmless.

## Lead-judgment questions
- Q1: 006571 admits `path.resolve(cwd, idx >= 0 ? argv[idx+1] : fallback)` while 006572 rejects `repoRoot = option('--repo-root','.')` as scalar. R5 rejects "resolve of a root", but the same helper also builds the switchboard and constitution doc paths read at L141/L142. I consider admit defensible because those two document reads are admitted at their own tuples. If you want the stricter reading, 006571 would become a reject with a root-plumbing note. I recommend leaving it as is.
