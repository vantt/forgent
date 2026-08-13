# Research — tsk-5dk (delivered-event merge provenance)

## Round 1 — 2026-08-12 17:28 UTC (discovery stage, pre-planning verification)

**Asked:** does tsk-5dk's technical premise still hold against current repo
HEAD, and are the file:line citations in the item description still
accurate enough to plan against?

### 1. Repro the 352/345 measurement

Checked: ran the item's own python3 one-liner against
`.fgos/events.jsonl` (main checkout, not the worktree — `.fgos/` never
exists in a linked worktree per ADR0020).

Found: **358 lần / 351 item**, still exactly one shape:
`[(('role',), 358)]`. The premise drifted (352→358, 345→351, as the item
itself warned it would) but is otherwise **unchanged**: every single
`work.move → delivered` event ever written carries `role` and nothing
else — no `mergedSha`, no branch, no evidence field.

### 2. `moveWork` provenance shape (`src/state/store.mjs`)

Checked: `src/state/store.mjs:487` (function signature) and the
post-transition stamp block that follows it (`:547`–`:646`).

Found: the item's claim is accurate. `moveWork` already destructures
`headAtTake, headAtReturn, branchHeadAtTake, branchHeadAtReturn` as
optional params and stamps each onto `rawEvent.payload` only `if
(x !== undefined)` (e.g. `:547-549`, `:570-575`) — every one of these is
additive, ignored by `status-fsm.mjs` (which only destructures what it
knows), so adding `mergedSha`/`mergedInto` to the same destructure +
stamp pattern, right after `branchHeadAtReturn`'s block (`:575`), is a
direct, low-risk extension of an established pattern. No caller is
broken by adding two more optional, undefined-by-default params.

### 3. `approve`'s two/three call sites into `moveWork(...to:'delivered'...)`

Checked: every `to: 'delivered'` occurrence in `bin/fgos.mjs`
(`grep -n "to: 'delivered'"`).

Found: **the item's line citations (2874, 3137) are stale** — the file
has grown/shifted since the item was written. More importantly, **the
shape is not the two-call-site model the item describes.** Current
reality:

- A shared helper `moveDeliveredOrRecordFault(dir, id, phase)`
  (`bin/fgos.mjs:3009`) wraps the actual `moveWork(...to:'delivered'...)`
  call (`:3019`) with fault-logging on lock-timeout. It has **three**
  call sites, not one:
  - `:3534` — `'leaf-into-root merge'` (a decomposed leaf merging into
    its root's branch; a real local git merge, `result.branch` known,
    no direct merge-commit sha captured today)
  - `:3684` — `'root-into-main merge'` (a real local git merge onto
    trunk via `mergeRunnerItem`, `src/runner/merge.mjs:805`; the merge
    result shape is `{outcome:'merged', branch, check}` — **no sha
    field currently returned**, would need `currentHead(repoRoot)`
    (`bin/fgos.mjs:121`) read post-merge)
  - `:3736` — `'pull-door verify-only'` (a pull-door proposal that
    merely verified green — **no git merge happens on this path at
    all**, so there is no merge commit to attribute a `mergedSha` to)
- A **separate, direct** `moveWork(...to:'delivered'...)` call at
  `:3282`, inside the `flags.github` branch (`:3265`–`:3283`), does NOT
  go through the shared helper.

Open question this raises (see verdict below): what should
`mergedSha`/`mergedInto` be on the `'pull-door verify-only'` path, where
no merge commit exists?

### 4. GitHub path's merge-sha availability

Checked: `mergeGitHubPR` (`src/runner/github-adapter.mjs:174-188`) and
`viewGitHubPRStatus` (`:126-162`), plus what `bin/fgos.mjs` imports from
that module (`bin/fgos.mjs:40` — only `createGitHubPR`, `mergeGitHubPR`,
`viewGitHubPRStatus`; no raw `gh` command runner).

Found: **`mergeGitHubPR` returns `{outcome:'merged', step:'merge',
prNumber}` — no sha, no field for one.** `viewGitHubPRStatus`'s `gh pr
view` call (`:140`) requests `--json
state,mergeable,mergeStateStatus,mergedAt,closed,closedAt` — `mergeCommit`
is not in that field list. `bin/fgos.mjs` has no independent `gh`
invocation of its own (only `ghCommandOpts()`, a test-seam options
builder passed into the imported functions) and no local
`git fetch origin <base>` helper to derive the sha from local git state
either.

**This conflicts with the item's own anti-scope #4** ("KHÔNG đụng đường
GitHub transport ngoài việc truyền thêm hai trường ở bin/fgos.mjs:3137")
— that line assumed the sha is already obtainable from within
`bin/fgos.mjs` alone. It is not, today. Getting a real `mergedSha` on the
GitHub approve path requires one of:
  - (a) a small, additive change to `src/runner/github-adapter.mjs`
    (add `mergeCommit` to the `--json` field list, return it from
    `mergeGitHubPR`) — touches a file outside the item's declared
    footprint, or
  - (b) `bin/fgos.mjs` deriving it independently via a new
    `git fetch origin <base>` + `git rev-parse origin/<base>` sequence
    right after `mergeGitHubPR` succeeds — stays inside the declared
    footprint but is a new mechanism, not "just pass two fields through".

### 5. `docs/specs/work-state.md` Data Dictionary

Checked: `docs/specs/work-state.md:40` onward.

Found: a `## Data Dictionary` section exists with a numbered table
(e.g. row 15 `headAtTake`, row 16 `headAtReturn`, row 19
`branchHeadAtTake`, `:58-62`) — confirmed suitable to extend with two
more rows for `mergedSha`/`mergedInto`, same pattern.

### 6. `move --to delivered` refusal check

Checked: `case 'move':` (`bin/fgos.mjs:1415-1427`).

Found: `move` is fully generic today — no branch-existence or
reachability check of any kind, for any `--to` target. The item's
premise (adding a NEW refusal here) has no existing check to conflict
with. Reusable ancestry-check patterns already exist in the codebase
(`git merge-base --is-ancestor`, used by `src/state/cleanup-harness.mjs`
around `:26`/`:107` for D8's "merge still resolves on main" gate, and by
`src/runner/worktree.mjs` around `:622`) — worth reusing/mirroring rather
than reinventing the ancestry check from scratch, though neither file is
in the item's declared footprint (may only need to be called, not
edited, from `bin/fgos.mjs`).

## Verdict inputs (for the calling skill)

- Core two-part plan (additive `moveWork` fields; new `move --to
  delivered` refusal check) — **fully confirmed, buildable, low risk.**
- Line-number citations in the item description (2874/3137) are stale;
  the real integration shape is 3 local call sites through a shared
  `moveDeliveredOrRecordFault` helper (one of which, `'pull-door
  verify-only'`, has no merge commit to attribute a sha to) plus 1
  separate direct GitHub call site whose sha is not obtainable within
  the item's own stated anti-scope boundary as written.
- Two concrete open product/scope questions, not resolvable from repo
  evidence alone — need a person:
  1. What should `mergedSha`/`mergedInto` be (if anything) on the
     `'pull-door verify-only'` delivered path, which has no git merge?
  2. Anti-scope #4 says never touch GitHub transport beyond passing two
     fields at `bin/fgos.mjs:3137` — but that line's sha is not actually
     available there today. Amend anti-scope #4 to allow a minimal
     `github-adapter.mjs` addition (expose `mergeCommit`), or require a
     footprint-preserving local `git fetch`+`rev-parse` derivation
     inside `bin/fgos.mjs` instead? This is a locked user decision
     (anti-scope #4) whose stated premise turned out to be false —
     per review-audit-self-decision discipline, present it and wait,
     never silently reverse.
