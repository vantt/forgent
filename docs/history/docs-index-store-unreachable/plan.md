# plan — `docs-index` on an unreachable store

Item: `tsk-f31`. Decisions: `CONTEXT.md` D1 (preserve on-disk value when
store unreachable), D2 (test points `--dir` at a real store). Verify (engine
-set, `fgos discover`): `npm test && test -z "$(git status --porcelain
docs/enduser-docs-index.json)"`.

## Mode: standard

Flags counted: **2 of 10**.

- **public contracts** — `docs/specs/enduser-docs-index.md` (locked area
  spec) step 3 of "Điều gì xảy ra" currently reads: "thấy thì lấy mã việc
  của nó, không thấy thì để `null`" (found → real id, not found → null) —
  that is exactly the behavior D1 changes for the store-unreachable case.
  The spec must gain the new case.
- **existing covered behavior** — `test/report/enduser-index.test.mjs` has
  **15** passing tests today (measured: `node --test
  test/report/enduser-index.test.mjs` → 15/15), 4 of which call the real
  `runDocsIndex()` helper D2 changes: the demo-entry test, the
  missing-quadrant-dir test, the decisions-alias test, and the idempotent
  re-run test (R7's own proof). All 4 execute through the reordered code
  D1 needs.

Not flagged: auth, authorization, data model, audit/security, external
systems, cross-platform, weak proof (dedicated spec + 15 tests already),
multi-domain.

Why not smaller: two contracts move (a locked spec section, and a helper
used by 4 existing tests), and a wrong merge order could silently defeat the
write-only-if-changed guard or violate R7's convergence guarantee. Why not
larger: no hard-gate flag applies; the shape is one reordering inside one
`case` block plus a companion spec paragraph — `tsk-k7i` proved the same
size of change (guard + outcome + tests + docs) for the sibling
already-caught-up bug.

Graph position (`fgos graph --json`): not on `criticalPath` (depth 10,
rooted at `tsk-4vo`), absent from `topUnblock` (top 3: `tsk-3p1`, `tsk-2j9`,
`tsk-1dj`). No deps, no dependents — ordering below is internal only.

No split. One honest piece: reorder + merge, tests, spec paragraph. Nothing
in it is independently workable or independently valuable.

## Approach

Inside `case 'docs-index'` (`bin/fgos.mjs:1362`-`1421`), today's order is:
compute `entries` from `buildEnduserIndex(docEntries, view.outcomes ?? {})`
→ compute `nextContent = JSON.stringify(entries, ...)` → read
`previousContent` from disk → write only if they differ. D1's merge has to
happen **before** `nextContent` is computed, not after, or the
write-only-if-changed comparison would run against pre-merge content:

1. Read `previousContent` from `manifestPath` first (same
   try/catch-on-ENOENT this block already has — a first-ever run with no
   prior manifest is not an error).
2. Compute `storeReachable = fs.existsSync(path.join(dir, 'events.jsonl'))`
   — **not** `fs.existsSync(dir)` on the directory itself: caught live in
   this item's own worktree (`fgw/tsk-f31`) that `.fgos/` the directory can
   exist (holding only `main-checkout.lock`, per `git status --short .fgos`
   showing `events.jsonl`/`state.json` etc. as locally-deleted-but-tracked)
   while the log file the store actually needs is absent — `fs.existsSync(dir)`
   would read `true` in exactly the condition this guard exists to catch.
   The log path matches `paths(dir)`'s own `logPath` definition
   (`src/state/store.mjs:88`: `path.join(dir, 'events.jsonl')`), the exact
   file `readEvents` catches `ENOENT` on to degrade to an empty view
   (`src/state/events.mjs:78`-`85`) — this is the real signal
   `listWork(dir)` itself keys off, not a directory-level proxy for it.
3. Parse `previousContent` (guard against a malformed/absent file the same
   way — falls back to `[]`, never crashes) into a `docPath → sourceCaptureId`
   map.
4. Merge: for each entry `buildEnduserIndex` produced, if `!storeReachable`
   and its `sourceCaptureId` is `null` and the previous map has a
   **non-null** value for that `docPath`, take the previous value instead.
   Every other case (store reachable, or no prior value, or the entry
   already resolved a real id) passes through unchanged — this never
   invents a value `buildEnduserIndex` didn't already almost produce, it
   only refuses to let an unreachable store regress an existing one.
5. Compute `nextContent` from the **merged** entries, then the existing
   write-only-if-changed comparison and write proceed unchanged.

`buildEnduserIndex` itself (`src/report/enduser-index.mjs`) is untouched —
it stays the pure function CONTEXT.md's deferred question left open,
resolved here in favor of keeping the merge in the write layer, which
already reads `previousContent` for the unchanged-guard and needs no new
parameter threaded through a tested pure function.

For D2, `runDocsIndex()` in `test/report/enduser-index.test.mjs` gains
`--dir <root>/.fgos`, resolved once at module load via the same
`git rev-parse --path-format=absolute --git-common-dir` the skills in this
repo already standardize on, passed through `spawnSync`'s args.

Rejected alternatives:

- *Thread a third parameter into `buildEnduserIndex` for the previous
  entries.* Rejected per CONTEXT.md's own deferred note: changes a tested
  pure function's signature for logic that belongs at the I/O boundary,
  which already reads `previousContent`.
- *Detect "store unreachable" by checking whether `view.outcomes` is empty.*
  Rejected: an empty outcomes view is also the legitimate shape of a
  reachable-but-genuinely-empty store (CONTEXT.md's own pinned distinction)
  — only the log file's own existence distinguishes the two.
- *Detect "store unreachable" via `fs.existsSync(dir)` on the whole `.fgos/`
  directory.* Tried first, rejected at `fgos-validating`: caught live that
  the directory can exist (holding only `main-checkout.lock`) while
  `events.jsonl` inside it is absent — the exact condition this guard needs
  to catch would have read as "reachable." `fs.existsSync(path.join(dir,
  'events.jsonl'))` is the real signal, matching `readEvents`'s own
  `ENOENT` check.
- *Fix only the test (D2) and leave the generator's real behavior as today
  (D1's declined "keep current behavior" option).* Declined at the gate
  question already — restated here only as the alternative D1 rejected, not
  reopened.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Reorder must not defeat write-only-if-changed: `nextContent` has to be computed from the merged entries, not the pre-merge ones | medium | A test where the store is reachable and content is genuinely unchanged from a prior run still results in NO write (existing idempotent-rerun test, still green, plus a new assertion that mtime/content is untouched) |
| `fs.existsSync(path.join(dir, 'events.jsonl'))` is the correct, sufficient signal for "store unreachable" in this exact code path | medium | A test that runs `docs-index` with `--dir` pointing at a directory that exists but has no `events.jsonl` (the exact shape observed live: a worktree's `.fgos/` holding only `main-checkout.lock`), asserts a docPath with a real prior on-disk id keeps that id |
| R7 (convergence) survives D1: running docs-index twice in a row under the SAME unreachable-store condition must not churn on the second run | medium | A test that runs `docs-index` twice with an unreachable store and asserts byte-identical manifest content and no second write (mtime unchanged) between run 1 and run 2 |
| All 4 existing `runDocsIndex()`-based tests keep passing after D2's `--dir` addition, not just the one demo test | medium | `node --test test/report/enduser-index.test.mjs` stays at the pre-change baseline of 15 pass / 0 fail, all four integration tests included, none edited beyond the `--dir` plumbing |
| First-ever run: no prior manifest file exists AND store is unreachable | low | A test asserts no crash and every entry's `sourceCaptureId` is `null` (nothing to preserve — matches the existing legitimate-null case, CONTEXT.md's own scope boundary) |

Every medium above carries to `fgos-validating` as a proof point; none is
settled by argument here.

## Shape (phased)

1. **Reorder + merge** — `bin/fgos.mjs`, `case 'docs-index'`: move the
   `previousContent` read earlier, add the `storeReachable` check and the
   merge step, compute `nextContent` from the merged entries.
2. **Tests** — `test/report/enduser-index.test.mjs`: add `--dir` to
   `runDocsIndex()` (D2); add two new tests for D1 (store-unreachable
   preserves an existing prior value; store-unreachable with no prior value
   stays `null`); add one test for the R7-survives-D1 risk-map row
   (two consecutive unreachable-store runs converge, no second write). All
   15 pre-existing tests stay green, none edited beyond the `--dir` call
   site.
3. **Docs** — `docs/specs/enduser-docs-index.md`: extend step 3 of "Điều gì
   xảy ra" with the store-unreachable case, and add a companion bullet next
   to the existing "Tài liệu không có capture nào khai `docPath`... vẫn
   `null`" edge-case bullet distinguishing it from the new preserved-value
   case.

Cases worth proving against, beyond the risk map: a docPath whose prior
on-disk value is already `null` (legitimately, or from a previous
unreachable-store run) and the store is unreachable again — stays `null`,
never invents a value; a docPath that exists in the current doc tree but
had NO entry at all in the previous manifest (a brand-new doc file added
since the last run) — its `sourceCaptureId` is `null` regardless of store
reachability, since there is no prior value to preserve.
