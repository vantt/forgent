# P03.1 — Fix Round 2 Report (final)

Responding to independent Reviewer + Red-Team recheck of fix round 1, which
confirmed all 6 original findings genuinely fixed (both re-ran their own
repros rather than trusting the fix-round-1 report), and one new item both
found independently during that recheck, plus one doc-precision nit.

## 1. Symlink-aware workspace containment for `artifactRef`

**The gap.** Fix round 1's containment check (`src/verbs/coordination/run.mjs`)
compared LEXICAL paths only: `path.relative(ctx.cwd, path.resolve(ctx.cwd,
step.artifactRef))`. `fs.readFileSync` two lines later follows symlinks —
so an IN-WORKSPACE symlink whose TARGET is outside the workspace passed
the lexical containment check and had its outside target's bytes hashed
as the `revision`. Red-Team's own live reproduction: a symlink at
`human/1-person.md` pointing at `/etc/hostname` was accepted, with the
recorded `revision` matching `/etc/hostname`'s own hash.

**Fixed.** `src/verbs/coordination/run.mjs`'s `human-turn` step dispatcher
now:
1. Resolves the candidate path with `fs.realpathSync(resolvedArtifactPath)`
   — this both follows every symlink in the path AND confirms the file
   genuinely exists (ENOENT/ENOTDIR here now produce the same
   "does not resolve to a real file" `StoreError` the old `readFileSync`
   ENOENT catch used to produce — extracted into a shared
   `missingArtifactError()` closure so both catch sites use byte-identical
   wording).
2. Resolves the workspace root itself with
   `fs.realpathSync(ctx.cwd)` — closing the sibling case where `ctx.cwd`
   ITSELF contains a symlink component (e.g. a symlinked worktree, or
   macOS's `/tmp` → `/private/tmp`), which a naive "resolve candidate only"
   fix would have missed.
3. Runs the SAME `path.relative(...).startsWith('..') ||
   path.isAbsolute(...)` containment test as fix round 1, now comparing
   the two REAL (symlink-resolved) paths instead of the two lexical ones.
4. Reads bytes from the already-resolved `realArtifactPath` (never
   re-resolves), so there is no second symlink-following read that could
   observe a different target than the one containment was checked
   against.

The pre-existing `../`-traversal and absolute-path tests, and the
non-symlinked nested-file success case, all still pass unchanged — the
fix only changes WHICH paths are compared, not the comparison itself.

**Tests** (`test/verbs/coordination-run-driver-steps.test.mjs`, +2):
- "artifactRef is refused when it is an in-workspace symlink pointing
  outside the workspace" — creates a real file in a fresh OS temp dir
  outside the workspace, symlinks `human/1-person.md` to it, asserts the
  request is rejected with `/outside the working directory/`.
- "artifactRef still works for a genuine nested in-workspace file (no
  symlink involved)" — a real, non-symlinked, nested path
  (`human/nested/1-person.md`); asserts the step succeeds and the
  recorded `revision` matches an independently-computed hash of the real
  file's bytes. Pins the "don't regress the legitimate case" requirement.

**Verified to fail without the fix:**
```
$ git stash push --keep-index -- src/verbs/coordination/run.mjs
$ node --test test/verbs/coordination-run-driver-steps.test.mjs
✖ a "human-turn" step's artifactRef is refused when it is an in-workspace symlink pointing outside the workspace
✔ a "human-turn" step's artifactRef still works for a genuine nested in-workspace file (no symlink involved)
ℹ tests 59 / pass 58 / fail 1
$ git stash pop
```
The symlink-escape test fails (accepted instead of refused) under the
fix-round-1 code; the legitimate-nested-file test already passed even
before this round's fix, confirming the new containment logic does not
newly restrict anything that already worked.

## 2. Doc-precision nit — T8's `respondsToRefs[]` clause overstated

**The gap.** Reviewer's own recheck of fix round 1's R-P03.1-04 fix found
the contract doc's T8 row said replay re-checks "`respondsToRefs[]`
ownership" unqualified. In reality, replay's re-check (added in fix round
1, `replay.mjs`) recognizes only the two reserved namespaces
(`human-turn:`/`contribution:`) plus the bare-id near-miss — NOT the full
cross-session segment scan `assertDispositionRefOwnedBySession` runs at
write time. Reviewer demonstrated: a hand-written `respondsToRefs` entry
naming a path like `coordination/sessions/victim/session.json` replays
clean today, while the write door would refuse it. No real harm reopens
(nothing legitimate can rely on a ref shape replay does not itself resolve
to anything), but the doc overstated what is checked.

**Fixed (doc only, no code change — this is a real, disclosed asymmetry,
not a bug to close).** `coordination-session.md`'s Human Turn Provenance
section:
- T8's Mechanism column now says `respondsToRefs[]` re-validation is
  NARROWER than the write door's own check, names exactly what replay
  recognizes (the two reserved namespaces + bare-id near-miss), gives the
  same counter-example Reviewer demonstrated, and states explicitly that
  this is not a live harm.
- The "Refusals" prose paragraph's own claim ("applies the IDENTICAL
  out-of-order-ref/dangling-ref/near-miss checks to a
  `human-turn-recorded` event's own `respondsToRefs[]` entries") is
  corrected from "IDENTICAL" to "for the two reserved namespaces and the
  bare-id near-miss ONLY", with a pointer to T8's row for the full
  disclosure.

CHANGELOG.md's still-`[Unreleased]` entry updated in place to mention the
symlink-resolution fix.

## Test Counts

Verified with `git show c48d0de7:<file> | grep -c '^test('` against the
current file:

| Suite | Before fix round 2 | After | Delta |
|---|---|---|---|
| `coordination-run-driver-steps.test.mjs` | 57 | 59 | +2 |
| Focused suite total | 742 | **744** | +2 |

## Real Command Output — Focused Suite (post-fix)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
```

**744 tests, 744 pass, 0 fail.** Raw log:
`proofs/P03.1/fix-round-2-focused-suite-run.log`.

## Real Command Output — Full `npm test` (post-fix)

**5682 tests, 5672 pass, 4 fail — 0 new failures.** Raw log:
`proofs/P03.1/fix-round-2-full-test-run.log`. All 4 map to the track's own
recorded baseline by exact file/test-name match: `test/cli/fgos-intake-4.test.mjs:318`
(legacy durable-doing ask/answer), `test/report/enduser-index.test.mjs:187`
(docs-index missing-quadrant), `test/runner/codex-cli-glm-cli-live-executors.test.mjs:68`
(live executor flake — fired this run, unlike fix round 1's run),
`test/setup/coordination-doctor-check.test.mjs:42` (resume-example
placeholder chars). This is the full 4-item baseline, all pre-existing,
none touching this cell's own files.

## `detect_changes` Output (post-fix)

`--scope all` (isolated diff against HEAD): **4 files, 5 symbols**, risk
MEDIUM — notably lower than every prior round's CRITICAL/HIGH label,
consistent with this round's genuinely small scope (one function,
`runCoordinationUseCase`, plus markdown-section attribution for the
contract-doc edits). `git diff --stat src/verbs/coordination/run.mjs`:
37 insertions, 19 deletions, all inside the single `human-turn` step
branch this whole track has touched from the start — no other function in
the file changed. Raw output:
`proofs/P03.1/fix-round-2-detect-changes-isolated-diff.log`.

`--scope compare --base-ref main`: whole-branch divergence, same caveat as
every prior round (not a useful per-cell signal on its own). Raw output:
`proofs/P03.1/fix-round-2-detect-changes-vs-main.log`.

## Files Changed This Fix Round

- `src/verbs/coordination/run.mjs` — symlink-aware workspace containment
- `test/verbs/coordination-run-driver-steps.test.mjs` (+2)
- `docs/architect/agent-coordination/contracts/coordination-session.md` — T8/Refusals wording precision, artifactRef symlink-resolution note
- `CHANGELOG.md` — in-place update to the still-`[Unreleased]` entry
- This report + updated proof logs

## Unresolved Questions

None. This closes P03.1.

Status: DONE
Summary: Fixed the symlink-escape gap in artifactRef workspace containment (fs.realpathSync on both sides of the comparison), with a test verified to fail without it and a companion test pinning the legitimate nested-file case. Corrected T8's respondsToRefs[] claim to match exactly what replay checks. Focused suite 744/744, full suite exactly the 4-item pre-existing baseline (0 new).
Concerns/Blockers: None.
