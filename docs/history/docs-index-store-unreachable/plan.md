# plan — `docs-index` on an unreachable store

Item: `tsk-f31`. Decisions: `CONTEXT.md` D1 (preserve on-disk value when
store unreachable). D2 (test points `--dir` at a real store) is superseded
by D3 — dropped, `runDocsIndex()` stays unchanged; see `CONTEXT.md` for the
two `fgos-coding-validating` findings that drove this. Verify (engine-set, `fgos
discover`): `npm test && test -z "$(git status --porcelain
docs/enduser-docs-index.json)"`.

## Mode: standard

Flags counted: **2 of 10**.

- **public contracts** — `docs/specs/enduser-docs-index.md` (locked area
  spec) step 3 of "Điều gì xảy ra" currently reads: "thấy thì lấy mã việc
  của nó, không thấy thì để `null`" (found → real id, not found → null) —
  that is exactly the behavior D1 changes for the store-unreachable case.
  The spec must gain the new case.
- **existing covered behavior** — the real regression surface is **20**
  tests across three files, not just the 15 first measured:
  `test/report/enduser-index.test.mjs` (15, `node --test
  test/report/enduser-index.test.mjs` → 15/15), `test/cli/fgos.test.mjs`'s
  own 4 `docs-index`-named tests (`node --test --test-name-pattern
  'docs-index' test/cli/fgos.test.mjs` → 4/4 — found only at
  `fgos-coding-validating`, missed when this flag was first counted), and
  `test/cli/fgos-manifest.test.mjs`'s registry-flags test (1/1, unaffected
  by this change but confirmed). D1's reorder touches `case 'docs-index'`
  itself, so every one of these runs through the reordered code.

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

D1's own new tests spawn the real `fgos docs-index` binary against a fresh,
fully isolated temp directory per test — never `REPO_ROOT`, never `--dir`.
`dataDir()` (`bin/fgos.mjs:83`-`94`) resolves `dir` from `flags.dir` when
given, or falls back to `resolveFgosDir(process.cwd(), { strict: true })`
otherwise — and `resolveRepoRoot`'s `strict` branch
(`src/runner/paths.mjs:26`: `if (strict) return cwd;`) returns `cwd`
unchanged with **no git command run at all**. So spawning
`fgos docs-index` with `cwd: tmpDir` and no `--dir` flag makes `dir =
tmpDir/.fgos` and `repoRoot = tmpDir` directly — no git init needed (unlike
`test/cli/fgos.test.mjs`'s `initGitCwdMain`/`tmpCwd` helpers, which exist
for verbs that DO shell out to git). Each test builds its own
`tmpDir/docs/<quadrant>/*.md` tree, an optional `tmpDir/.fgos/events.jsonl`
(present = store reachable; absent = unreachable, the condition under test),
and an optional pre-seeded `tmpDir/docs/enduser-docs-index.json` (the "prior
on-disk value" to preserve or not). This is the same isolation shape
`buildEnduserIndex`'s own unit tests already use (hand-built inputs, no
shared state) extended to the real I/O verb — it cannot touch or be
affected by `REPO_ROOT`'s real `docs/` tree or manifest, which is exactly
what broke D2's `--dir`-on-`REPO_ROOT` attempt.

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
  directory.* Tried first, rejected at `fgos-coding-validating`: caught live that
  the directory can exist (holding only `main-checkout.lock`) while
  `events.jsonl` inside it is absent — the exact condition this guard needs
  to catch would have read as "reachable." `fs.existsSync(path.join(dir,
  'events.jsonl'))` is the real signal, matching `readEvents`'s own
  `ENOENT` check.
- *Fix only the test (D2) and leave the generator's real behavior as today
  (D1's declined "keep current behavior" option).* Declined at the gate
  question already — restated here only as the alternative D1 rejected, not
  reopened.
- *Point the shared `REPO_ROOT`-based `runDocsIndex()` at a real store via
  `--dir` (D2, as originally locked).* Tried, then dropped (`CONTEXT.md`
  D3): `case 'docs-index'` derives `repoRoot = path.dirname(dir)`, so
  `--dir` doesn't just pick which store informs `sourceCaptureId` — it
  redirects the entire docs-tree scan and manifest write target.
  Reproduced live: pointing `--dir` at main checkout broke `fgos docs-index
  tolerates a missing quadrant dir` (it hides the WORKTREE's own
  `docs/tutorials/`, but the redirected verb scanned main checkout's
  untouched copy instead). Separately shown moot: D1 alone reconstructs
  content byte-identical to a worktree's `HEAD`-identical starting manifest
  when the store is unreachable, so D2's goal (test outcome independent of
  physical location) is already met without touching `repoRoot`.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Reorder must not defeat write-only-if-changed: `nextContent` has to be computed from the merged entries, not the pre-merge ones | medium | A test where the store is reachable and content is genuinely unchanged from a prior run still results in NO write (existing idempotent-rerun test, still green, plus a new assertion that mtime/content is untouched) |
| `fs.existsSync(path.join(dir, 'events.jsonl'))` is the correct, sufficient signal for "store unreachable" in this exact code path | medium | A test that runs `docs-index` (`cwd: tmpDir`, no `--dir`) against a `tmpDir/.fgos/` that exists but has no `events.jsonl` (the exact shape observed live: a worktree's `.fgos/` holding only `main-checkout.lock`), asserts a docPath with a real prior on-disk id keeps that id |
| R7 (convergence) survives D1: running docs-index twice in a row under the SAME unreachable-store condition must not churn on the second run | medium | A test that runs `docs-index` twice with an unreachable store and asserts byte-identical manifest content and no second write (mtime unchanged) between run 1 and run 2 |
| All 20 existing tests across the 3 files keep passing after D1's reorder | medium | **Proven at `fgos-coding-validating`, real code, twice reverted after**: the exact planned patch applied to `bin/fgos.mjs`, all 20 tests run (`test/report/enduser-index.test.mjs` 15/15, `test/cli/fgos.test.mjs`'s 4 docs-index tests 4/4, `test/cli/fgos-manifest.test.mjs`'s registry test 1/1), then reverted (`git status --short` clean on all 3 files) |
| The new isolated-tmpdir tests genuinely never touch `REPO_ROOT` (the exact mistake D2's `--dir` attempt made) | medium | Each new test constructs its own `tmpDir`, spawns `fgos docs-index` with `cwd: tmpDir` and no `--dir` flag, and asserts against `tmpDir`'s own manifest — never `REPO_ROOT`/`MANIFEST_PATH`; live-run at `fgos-coding-validating` confirmed `cwd: tmpDir` + no `--dir` writes to `tmpDir/docs/enduser-docs-index.json`, not under `.fgos/` |
| The item's OWN verify command (`npm test && test -z "$(git status --porcelain docs/enduser-docs-index.json)"`) actually passes end-to-end, not just each test in isolation | medium | **Real gap found and closed at `fgos-coding-validating` (2nd pass)**: `test/report/enduser-index.test.mjs`'s tutorials-hidden test transiently writes a manifest missing the tutorials entry, then only restores the DIRECTORY afterward, not the manifest content — a later store-unreachable run in the SAME suite reads that transient state as "previous" and permanently drops a real id (`tsk-3wr`, reproduced live: 15/15 tests green, yet `git status --porcelain` on the manifest was NOT empty — 1 real regression). Fix: that one test's own `finally` block also restores the manifest content it read before its own `runDocsIndex()` call, same discipline it already applies to the directory. Re-run with both patches: 20/20 tests green AND `git status --porcelain` empty — proven live. |
| First-ever run: no prior manifest file exists AND store is unreachable | low | A test asserts no crash and every entry's `sourceCaptureId` is `null` (nothing to preserve — matches the existing legitimate-null case, CONTEXT.md's own scope boundary) |

Every row above already has real evidence gathered during this plan's own
`fgos-coding-validating` passes (dry-run simulation for the reorder/signal/R7
rows; the real, planned code change, applied and reverted, for the
existing-tests/isolation/end-to-end-verify rows) — none was settled by
argument alone. The remaining flow through `fgos-coding-validating` re-confirms
this evidence still holds once the change is committed for real, and checks
nothing else was missed.

## Shape (phased)

1. **Reorder + merge** — `bin/fgos.mjs`, `case 'docs-index'`: move the
   `previousContent` read earlier, add the `storeReachable` check and the
   merge step, compute `nextContent` from the merged entries.
2. **Tests** — `test/report/enduser-index.test.mjs`: `runDocsIndex()` and
   14 of the 15 pre-existing tests stay byte-for-byte unedited (D2 dropped).
   The 15th — `fgos docs-index tolerates a missing quadrant dir` — gets its
   `finally` block extended: snapshot `MANIFEST_PATH`'s content before the
   test's own `renameSync`, restore that snapshot (not just the directory)
   afterward. Found necessary at `fgos-coding-validating`: without this, the
   test's own transient write becomes a later run's false "previous"
   state, permanently dropping a real id even though nothing was actually
   lost. This does not touch `runDocsIndex()` or introduce a fixture — the
   test still exercises the real `docs/tutorials/` dir and the real
   generator, per this file's own no-fake-fixture rule (line 16); it only
   also undoes its own transient manifest write, the same way it already
   undoes its own transient directory rename. Add three new tests, each
   against its own fresh `tmpDir` (no `--dir`, no git init — see Approach):
   store-unreachable preserves an existing prior value; store-unreachable
   with no prior value stays `null`; two consecutive unreachable-store runs
   converge (R7 survives D1, no second write on the second run).
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
