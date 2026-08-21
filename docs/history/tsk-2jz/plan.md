# plan.md — tsk-2jz

Mode: high-risk

Lane decided via the direct-entry fallback (`fgos-routing`'s own Mode
gate, applied directly — no `fgos-coding-exploring` round happened since
discovery's own verdict was `clear`, so no lane was ever handed off in
prose). Flags counted:

- **audit/security / data-loss (hard-gate)** — a wrong content-equivalence
  fallback could report `ok:true` for content that was genuinely lost
  (force-push, bad rebase), the exact failure mode the existing ancestry
  check exists to catch. One hard-gate flag alone forces `high-risk`
  regardless of count.
- **existing covered behavior** — `test/state/cleanup-harness.test.mjs`
  (42K, substantial existing suite) already covers `checkMergeStillResolves`
  and must keep passing unmodified for every case it already proves.

Not counted: auth/authorization (none), data model (logic-only, no schema
change), external systems (pure local git), public contracts (`{ok,
detail}` return shape unchanged), cross-platform (n/a), multi-domain — only
`coding` declares `worktreeBacked: true`
(`src/state/workflow-stage-graphs.mjs:107` vs. `:351/:382/:429`), so this
check is only ever exercised for that one domain today, weak proof (the
existing suite is substantial, not weak, and the fix itself reuses a
proven pattern — see Approach).

This matches the item's own `risk: heavy` set at discovery (no `fgos edit`
needed here — already correct).

## Approach

**No `docs/history/tsk-2jz/CONTEXT.md` exists** — discovery's verdict was
`clear`, which skips `exploring` entirely, so there is no locked-decision
table to cite here. Every claim below traces to either the item's own
description (already exhaustively evidenced by the submitter: exact shas,
exact repro items, exact function names) or `RESEARCH.md`'s Round 1
findings (this same `docs/history/tsk-2jz/` dir, written during discovery).

**Chosen path:** extend `checkAncestry` in `src/state/cleanup-harness.mjs`
with a content-equivalence fallback, reusing the exact git primitive
`src/state/drift-status.mjs:84-108` (`unmatchedCommitCount`) already uses
and already proved in production: `git rev-list --count --cherry-pick
--right-only --no-merges <targetRef>...<sha>`. When the direct
`git merge-base --is-ancestor <sha> <targetRef>` check fails, run this
comparison before returning `ok:false`; a `0` count (every reachable
non-merge commit from `sha` has a patch-id twin already on `targetRef`)
means the content is present under a different literal sha (rebase-rehash,
or a rescue-branch landing) and the check should report `ok:true` with a
detail string naming which fallback resolved it — never silently
indistinguishable from the direct-ancestry pass, so a later reader can
still tell the two apart. This single change covers BOTH blind spots in
the item description: blind spot 1 (rebase-rehash — same content,
identical patch-id, new sha) and blind spot 2 (orphan-branch rescue — the
child's original non-merge commit still has a patch-id twin among the
commits the rescue merge (e.g. `d00367f9`) brought onto `main`, even
though the rescue merge commit itself is excluded by `--no-merges`).

**Alternatives rejected** (per the item description's own three listed
options, judged against RESEARCH.md Round 1 evidence):

- *Record a rescue/supersession event* (`work.supersededBy`) — real field
  exists (`src/state/work.mjs:342-361`, `fgos edit --superseded-by`), but
  it is item-level (this item is superseded by that item), never wired
  into `cleanup-harness.mjs` today, and cannot by itself distinguish a
  commit-level cause. Would need new schema/plumbing with no existing
  precedent — rejected in favor of the content-match path, which has one.
- *Manual override door* — punts the actual detection work to a human
  every time either blind spot recurs; the content-match fallback instead
  makes both blind spots self-heal automatically, matching the fix the
  item asks for ("a real fix", not a recurring manual chore).

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| Content-equivalence fallback itself | heavy (data-loss masking if it over-reports `ok:true`) | New regression test asserting the fallback still returns `ok:false` for a commit whose content was genuinely dropped (a real divergent-content case, not just a different sha) — proven at `fgos-coding-validating`, not guessed here. |
| Blind-spot-2 shape (rescue lands via a MERGE commit, e.g. `d00367f9`) | medium | `--no-merges` already excludes the merge commit from the comparison by design (mirrors `unmatchedCommitCount`'s own documented reasoning) — the ORIGINAL child's non-merge commit is what needs the patch-id twin, and `git rev-list` walks all non-merge ancestors reachable from the merge, not just the merge tip itself. Proof: reproduce tsk-5sr's actual recorded shas (`7d6ae519` vs `d00367f9` on `main`) via `fgos recheck-blocked`, read-only, without touching tsk-5sr's own state (per the item's own instruction). |
| Existing ancestry-only behavior for a genuinely healthy item | low | Full existing `cleanup-harness.test.mjs` suite must stay green unmodified — the fallback only ever fires after the direct ancestry check already failed, never replaces it. |

Impact-analysis posture: **degraded** — GitNexus is `present`
(`fgos tool query --capability impact-analysis --status present`) but its
`/home/vantt/projects/forgentX` index is flagged 1114 commits behind HEAD
(stale). Ran it anyway per the stale-index cross-check rule: `impact
checkMergeStillResolves upstream` (repo pinned by absolute path, not the
ambiguous shared display name — 7 indexed repos share the name `forgent`)
returned `risk: LOW`, 3 direct upstream callers, all inside
`cleanup-harness.mjs` itself (`checkChildrenResolve`,
`checkRootBranchResolves` recursion, `assessCleanupReadiness`). Cross-checked
against a direct `rg`/read of the file (done during discovery, RESEARCH.md
Round 1) — consistent: no caller outside this one file. Evidence is
therefore treated as confirmed despite the stale index, not weak.

`fgos graph --json` was read (informing ordering, per this skill's own
hard rule) — this item has no `deps`, no children, and sits in its own
single-node graph component today, so there is no multi-item ordering
decision to make; `topUnblock` was skipped by the engine itself (no
candidates to rank) and is not needed here.

**Files likely touched, in order:**

1. `src/state/cleanup-harness.mjs` — add the content-equivalence fallback
   inside/alongside `checkAncestry`; update the DIAGNOSTIC HINT doc-comment
   (tsk-3ft, lines ~112-120) that currently states ancestry-alone
   "ancestry alone cannot tell a genuine force-push loss apart from a
   branch manually reset... this stays an intentional limitation" — that
   limitation is exactly what this fix narrows, so the comment must be
   updated to describe the new fallback and its own remaining gap (a
   content match still cannot prove the CONTENT itself was never later
   reverted — same revert-detection gap already documented at the top of
   the file, unchanged by this fix).
2. `test/state/cleanup-harness.test.mjs` — regression coverage: a
   rebase-rehash case (blind spot 1 shape), a rescue-merge case (blind
   spot 2 shape), and a negative case (content genuinely lost — fallback
   must still report `ok:false`).

No split: one honest piece — a single function-level fix plus its own
regression tests, contained to two files per the GitNexus-confirmed
narrow blast radius above. `fgos-coding-validating` proceeds with the
pass-through path.

## Verify (leaving Execute's own mechanical path alone)

One command proves this piece done, combining the existing suite, new
regression coverage, and a live read-only recheck against the three real
parked repro cases the item names (never mutating their state):

```
npm test -- test/state/cleanup-harness.test.mjs && node bin/fgos.mjs recheck-blocked --dir "$root" --json
```

(confirm `tsk-5sr`, `tsk-3cx`, `tsk-25b` each surface as now-resolvable in
that output). This is the same command already synced onto `work.verify`
at discovery (`fgos discover --verdict clear --verify ...`) — the item's
current `verify` is already this real, distinct command, so no further
`fgos edit --verify` sync is needed here per this skill's own rule against
overwriting an already-real value.

## Assumptions

- The rescue-target ref for the content-equivalence comparison is the same
  ref `checkAncestry` already resolves (`fgw/<rootId>` for a leaf, `HEAD`/
  `main` for a root) — not a new ref concept. Implementation-only detail;
  not material to scope or acceptance.
- `git rev-list --count --cherry-pick --right-only --no-merges
  <targetRef>...<sha>` behaves the same when the right side is a single
  bare sha (our case) as when it is a full branch tip (`drift-status.mjs`'s
  existing usage) — not material; the Execute-stage verify command itself
  is exactly what proves or disproves this against the three real repro
  cases.

## Outstanding questions

None
