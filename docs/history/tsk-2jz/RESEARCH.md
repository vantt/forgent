# RESEARCH.md — tsk-2jz

## Round 1 — 2026-08-21 (discovery stage, fgos-researching helper)

**Asked:** Does the repo already have (a) a mechanism for recording a
"rescue"/supersession event when one item's branch lands another item's
orphaned content, or (b) an existing pattern for content/patch-id matching
that could re-derive an "effective merge" independent of a frozen literal
sha? Both blind spots described in tsk-2jz's own description
(`checkMergeStillResolves`, `src/state/cleanup-harness.mjs`) need this to
judge which of the three options tsk-2jz's description lists (record a
supersession event / re-derive by content match / manual override door) is
actually the smallest honest fix, or whether it's still an open design
question for a person.

**Checked:**

- `rg -n "supersede|rescue" src bin docs test` — found `work.supersededBy`
  (`src/state/work.mjs:342-361`, validated singular/directed, target must be
  a known id), settable via `fgos edit --superseded-by <id>`
  (`bin/fgos.mjs:1685-1690`), consumed today only by
  `src/state/graph-harness.mjs` (frontier/dep-readiness — excludes an item
  whose `supersededBy` target is resolved). **Not currently read anywhere
  inside `cleanup-harness.mjs`** — this is an item-level relation, not a
  commit-level one, and nothing wires it into `checkMergeStillResolves`
  today.
- `src/state/cleanup-harness.mjs:141-236` (`checkMergeStillResolves`,
  `checkChildrenResolve`, `checkRootBranchResolves`) read directly — the
  ancestry check is exactly `git merge-base --is-ancestor <sha> <ref>`
  (via `checkAncestry`, same file), a pure ref-reachability check with no
  content-equivalence fallback anywhere in this file.
- `rg -n "patch-id|cherry-pick" src` — found an existing, **already
  battle-tested** content-equivalence check one file over:
  `src/state/drift-status.mjs:84-108` (`unmatchedCommitCount`) runs
  `git rev-list --count --cherry-pick --right-only --no-merges
  <from>...<branch>` to count commits on `branch` with **no patch-id
  equivalent anywhere on `from`** — i.e. exactly "did this content land by
  a different route" (rebase, cherry-pick, or a differently-routed merge).
  The function's own comment states two of the three branches its first
  live run flagged (`tsk-67g`, `tsk-3um`) "turned out to have landed their
  content by another path already" — the identical false-positive shape
  tsk-2jz describes for `checkMergeStillResolves`, already solved once in
  this codebase for a sibling check (`driftStatus`, not `cleanup-harness`).
  `--no-merges` is required there because a merge commit has no patch-id
  and would always count as unmatched — same caveat applies if reused here.
- `src/state/workflow-stage-graphs.mjs:122-124` — `classificationVocabulary`
  confirms `kind: ['bug','chore','design','docs','feature','task']`,
  `risk: ['light','standard','heavy']`; `TIERS` (`src/state/work.mjs:161`)
  is `['light','standard','heavy']`. Item's current `kind:'bug'`,
  `risk:'heavy'`, `tier:'heavy'` are all valid vocabulary members.
- `bin/fgos.mjs:2611-2622` — `fgos recheck-blocked` already exists: a
  read-only verb that re-runs `checkMergeStillResolves` LIVE against every
  current `status:blocked` item and reports which would now pass, without
  transitioning anything. Exactly the tool to verify a fix against
  tsk-5sr/tsk-3cx/tsk-25b without touching their state, per tsk-2jz's own
  instruction not to touch those three.
- `test/state/cleanup-harness.test.mjs` exists (42K) — the test file this
  fix's regression coverage belongs in.

**Found (answering the question):** Yes — a directly-applicable, proven
precedent exists: `unmatchedCommitCount`'s cherry-pick/patch-id comparison
in `drift-status.mjs` already solves the identical "same content, different
sha" problem tsk-2jz's blind spot 1 (rebase-rehash) describes, and the same
comparison (child sha vs `main`/rescue-target ref) also covers blind spot 2
(orphan-branch rescue) — a rescue-landed child's original commit, cherry-pick-
compared against the rescue target, shows 0 unmatched commits even though
direct ancestry against the *original* parent branch fails. This makes
tsk-2jz's second listed option ("re-derive a child's effective merge sha by
content/patch-id match") the one with real prior art in this repo, versus
the other two options (a new supersession-event schema, or a manual
override door) which have no existing plumbing to build on. No
`supersededBy`-based approach is viable without new wiring — the field
exists but is never read by `cleanup-harness.mjs` today, and is item-level,
not commit-level, so it cannot by itself distinguish "child B's original
commit is unreachable because of X" from a specific commit-level cause.

**Still open:** none for the discovery-stage question (which approach has
real precedent) — this became `clear`. Left for `planning`: the exact call
site for the fallback (inside `checkAncestry`, or a new function
`checkAncestry` falls back to when direct ancestry fails), whether
`--no-merges` needs adjusting for either blind spot's actual commit shapes,
and the two now-passing repro checks (`fgos recheck-blocked` should surface
tsk-3cx and tsk-25b, but tsk-5sr's blind spot 2 needs the rescue TARGET ref
`main`/`fgw/<rescueId>` reachable at cherry-pick-compare time — confirm
which ref to compare against for that case specifically).

**Verdict:** `clear`.
**Verify proposed:**
`npm test -- test/state/cleanup-harness.test.mjs && node bin/fgos.mjs
recheck-blocked --dir "$root" --json` (confirm tsk-5sr, tsk-3cx, tsk-25b
each surface as now-resolvable, without any `fgos move`/`fgos cleanup`
call touching their own state).
