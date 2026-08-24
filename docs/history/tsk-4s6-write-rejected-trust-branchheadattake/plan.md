# Plan — tsk-4s6: trust a `.fgos/` path provably untouched since branchHeadAtTake

Mode: small

No CONTEXT.md/`exploring` round happened — discovery verdict was `clear`
(RESEARCH.md Round 1 already gave enough real evidence to shape this
directly). No decisions are locked to cite; this plan's every claim traces
to RESEARCH.md Round 1 or a fresh read cited inline below.

## Approach

**Chosen path:** extend the fgos-write-rejected restore-then-recheck loop
in `mergeRunnerItemLocked` (`src/runner/merge.mjs:1392-1412`) with a second,
independent trust criterion alongside `isMergeUnionPath`: a staged `.fgos/`
path is also safe to restore to `repoRoot`'s own HEAD when the branch's
current committed blob at that path is git-identical to the blob at the
item's own `branchHeadAtTake` — i.e. the branch never made a real edit to
it since the item was first taken, so restoring only discards
never-legitimate staleness, never a real branch-authored write.

**New helper**, same file, next to `isMergeUnionPath`:

```js
function isUnchangedSinceBranchHeadAtTake(repoRoot, branch, relPath, branchHeadAtTake) {
  if (!branchHeadAtTake) return false; // can't prove zero-edit without a base to compare against
  try {
    const atTake = git(repoRoot, ['rev-parse', `${branchHeadAtTake}:${relPath}`]).trim();
    const atBranchHead = git(repoRoot, ['rev-parse', `${branch}:${relPath}`]).trim();
    return atTake === atBranchHead;
  } catch {
    return false; // path didn't exist at branchHeadAtTake (or branch), or the ref is bad — fail closed
  }
}
```

The restore loop's per-path gate becomes:

```js
if (!isMergeUnionPath(repoRoot, fgosPath) && !isUnchangedSinceBranchHeadAtTake(repoRoot, branch, fgosPath, item.branchHeadAtTake)) {
  continue;
}
```

`item` and `branch` are already in scope at that point
(`mergeRunnerItemLocked(repoRoot, item, branch, opts)`,
`merge.mjs:1232` — confirmed, RESEARCH.md point 3) — **zero new parameter
threading** needed anywhere in the call chain (`approve.mjs`, `sync-root.mjs`,
`promote-engine.mjs` all already pass a real `item` through unchanged).

**Alternatives rejected:**
- Widen `isMergeUnionPath` itself to also cover `config.json`/legacy
  `events.jsonl` via `.gitattributes` — rejected: `merge=union` is a real
  git merge-driver semantic (interleaves both sides' lines on an actual
  3-way text conflict), which would corrupt `config.json`'s JSON structure
  or silently interleave unrelated `events.jsonl` regions on a genuine
  future conflict between two DIFFERENT live sessions. The two paths this
  item fixes need "trust main, unconditionally, when proven untouched" —
  a different, narrower guarantee than union's real semantics, so they need
  their own gate, not a borrowed one.
- Compare against `git merge-base branch main` instead of `branchHeadAtTake`
  — rejected: `branchHeadAtTake` is the item's own recorded fork point
  (exactly what "did THIS item's own work touch this path" means); a merge-
  base could shift underneath a stale branch across multiple catch-ups and
  would prove a weaker claim (only "at the last common ancestor", not "at
  the moment this item started").
- Fix this inside `performCatchUp` instead — rejected: RESEARCH.md point 2
  confirms `performCatchUp` has no write-rejected guard at all on the clean-
  merge path already (asymmetric by design, ADR0020 only strictly guards
  the branch→main direction). Nothing to fix there.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| New helper's git plumbing (`rev-parse <ref>:<path>`) | low | unit test: path present at both refs, identical → true; present at both, differs → false; absent at `branchHeadAtTake` → false (fail closed) |
| Restore loop's widened gate | medium (shared merge path, `approve`/`sync-root`/`promote-engine` all route through it) | the existing `tsk-4gi` regression test (`test/runner/merge.test.mjs:1648-1675`, "still refuses a non-union .fgos/ path that auto-merges cleanly on non-overlapping lines") must keep passing UNCHANGED — its `makeItem()` call carries no `branchHeadAtTake`, so the new criterion returns `false` there and the existing refusal is untouched. This is the actual safety net, not a description of one. |
| New passing-case test | low | new test, `merge.test.mjs`, seeds `branchHeadAtTake` at the real fork commit, only main drifts the non-union path afterward, asserts `outcome === 'merged'` and final content equals main's own pre-merge content — mirrors `test/runner/merge.test.mjs:1589-1636`'s assertion shape (tsk-4gi union case) applied to a non-union path instead |

Impact-analysis posture: **degraded** — GitNexus registered and `present`
but flagged stale (index at `7bb3231`, behind current HEAD per this
session's own PostToolUse hook notices) — blast radius not re-confirmed
fresh. Cross-checked with a direct `grep -rn "mergeRunnerItem\b" src
--include="*.mjs"`: real call sites are exactly `src/verbs/merge/
approve.mjs` (2 call sites), `src/verbs/merge/sync-root.mjs` (1),
`src/runner/promote-engine.mjs` (1) — the whole merge-verb cluster, nothing
outside it. No public-contract/external-system/auth/data-model flag
applies; this stays a `small`-lane item.

`fgos graph --json`'s `criticalPath`/`topUnblock` not consulted — single
sequential piece, one file's own logic plus its own test file, no ordering
decision to make.

## Shape

Single piece, not split. Files touched, in order:

1. `src/runner/merge.mjs` — add `isUnchangedSinceBranchHeadAtTake`, widen
   the restore loop's gate (both at `merge.mjs:1392-1412`, the exact
   citation RESEARCH.md Round 1 point 1 already pinned).
2. `test/runner/merge.test.mjs` — one new test proving the fix (mirrors
   `merge.test.mjs:1589-1636`'s shape for a NON-union path); the existing
   `merge.test.mjs:1648-1675` test (tsk-4gi "must not weaken this") stays
   byte-for-byte, asserted still-passing as the safety net, not edited.

Concrete cases to prove, matching `small`-lane depth:
- **New passing case**: branch forks, main independently edits a non-union
  `.fgos/` path afterward, branch never touches it → `merged`, final
  content matches main's own pre-merge state.
- **Existing-behavior-must-not-regress case** (already covered,
  `merge.test.mjs:1648-1675`): branch AND main both genuinely edit the same
  non-union path on non-overlapping lines → still `fgos-write-rejected`.
- **Boundary case**: `item.branchHeadAtTake` absent/undefined (every other
  existing `makeItem()` call in the suite) → helper returns `false`,
  behavior identical to before this fix for every one of them.

## Outstanding questions

None
