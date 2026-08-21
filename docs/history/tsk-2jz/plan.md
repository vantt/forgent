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

**Chosen path — REVISED after `fgos-coding-validating`'s round-1 reality
gate returned NOT READY** (see "Validating round 2 findings" below; the
original round-1 Approach overclaimed a single mechanism resolving both
blind spots — direct git testing against the item's own cited real shas
disproved that for 2 of the 3 named repro cases). Two distinct fallback
checks, tried in order inside `checkAncestry` when the direct
`git merge-base --is-ancestor <sha> <targetRef>` check fails:

1. **Main-ancestry fallback (proven, resolves blind spot 2's shape
   cleanly):** `git merge-base --is-ancestor <sha> main` (or `HEAD` — the
   real merge target, never the possibly-bypassed `targetRef`). Confirmed
   live against tsk-5sr's actual recorded shas: `7d6ae519` is NOT an
   ancestor of `fgw/tsk-5sr` (the stale check, fails as the item
   describes) but IS a direct ancestor of `main` (`git merge-base
   --is-ancestor 7d6ae519 main` → true) — no content-matching needed at
   all for this shape; the rescue merge already put it there.
2. **Content-equivalence fallback (best-effort, resolves a CLEAN
   rebase-rehash — same diff, no conflict-driven content drift):** reuse
   the git primitive `src/state/drift-status.mjs:84-108`
   (`unmatchedCommitCount`) already uses: `git rev-list --count
   --cherry-pick --right-only --no-merges <targetRef>...<sha>`, a `0`
   count meaning every reachable non-merge commit from `sha` has a
   patch-id twin already on `targetRef`. This is a real, useful check for
   the CLEAN-rebase case, but it is **not a universal fix** for blind spot
   1 — see the round-2 findings below for why, and the Risk map's honest
   scoping of what it does and does not prove.

Both checks return `ok:true` with a detail string naming which fallback
resolved it — never silently indistinguishable from the direct-ancestry
pass. When NEITHER fallback resolves it, the check correctly still
reports `ok:false` — this is the intentional, already-documented
limitation the file's own header names (revert-detection-style: a check
that cannot prove content was never later diverged/reverted stays
`ok:false`, exactly as it does today), not a regression this fix
introduces.

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
| Main-ancestry fallback (blind spot 2) | heavy (data-loss masking if it over-reports `ok:true`) | **Proven live, round 2**: `git merge-base --is-ancestor 7d6ae519 main` → true, reproducing tsk-5sr's exact real shas read-only, no state touched. New regression test still required asserting `ok:false` stays `ok:false` when a sha is genuinely NOT an ancestor of `main` either (a real divergent-content/lost-work case), so the fallback cannot mask a genuine loss. |
| Content-equivalence fallback (blind spot 1, best-effort) | heavy (same data-loss-masking risk, PLUS proven-limited coverage) | **Tested live, round 2, against all 3 named repro cases — does NOT cleanly resolve 2 of them.** `git rev-list --count --cherry-pick --right-only --no-merges` returned non-zero (2) for tsk-3cx's cited pair (`93d8e653` vs same-ref `fgw/tsk-3cx` AND vs `main`) and non-zero (1) for tsk-25b's cited pair (`18ecdd32` vs `fgw/tsk-25b`) — a direct `diff` of tsk-3cx's cited "identical-patch" pair (`93d8e653` vs `7cd06e83`) shows real content divergence, not an identical diff; `git reflog show fgw/tsk-3cx` shows further resets/rebases since the item's own 2026-08-20 investigation, so that evidence has decayed. **Scoped conclusion:** this fallback is kept as a real, honest improvement for the CLEAN-rebase sub-case (no proof it fires for either of the two decayed repro cases specifically), not advertised as resolving blind spot 1 universally. Proof required at Execute: a synthetic clean-rebase test case constructed directly in the regression suite (not dependent on tsk-3cx/tsk-25b's specific, now-decayed shas), per the item's own "verify against fresh reproductions or these three" allowance. |
| Existing ancestry-only behavior for a genuinely healthy item | low | Full existing `cleanup-harness.test.mjs` suite must stay green unmodified — both fallbacks only ever fire after the direct ancestry check already failed, never replace it. |

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

1. `src/state/cleanup-harness.mjs` — add both fallbacks (main-ancestry,
   then content-equivalence) inside/alongside `checkAncestry`; update the
   DIAGNOSTIC HINT doc-comment (tsk-3ft, lines ~112-120) that currently
   states ancestry-alone "ancestry alone cannot tell a genuine force-push
   loss apart from a branch manually reset... this stays an intentional
   limitation" — narrowed, not removed, by this fix; the comment must say
   plainly what now resolves automatically (blind-spot-2 shape, and a
   CLEAN rebase-rehash) and what still correctly stays `ok:false` (a
   rebase that also changed content, e.g. via conflict resolution — the
   same revert-detection-style gap already documented at the top of the
   file, unchanged by this fix).
2. `test/state/cleanup-harness.test.mjs` — regression coverage: a
   rescue-merge case (blind spot 2 shape — provable against tsk-5sr's real
   shas, read-only), a CLEAN synthetic rebase-rehash case (blind spot 1's
   provable sub-case — constructed directly, not borrowed from
   tsk-3cx/tsk-25b's decayed evidence), and a negative case (content
   genuinely diverged/lost — both fallbacks must still report `ok:false`).

No split: one honest piece — a single function-level fix plus its own
regression tests, contained to two files per the GitNexus-confirmed
narrow blast radius above. `fgos-coding-validating` proceeds with the
pass-through path.

## Verify (leaving Execute's own mechanical path alone)

One command proves this piece done, combining the existing suite, new
regression coverage, and a live read-only recheck against the real parked
repro cases:

```
npm test -- test/state/cleanup-harness.test.mjs && node bin/fgos.mjs recheck-blocked --dir "$root" --json
```

**Revised expectation (round 2), per the item's own explicit allowance to
"verify against fresh reproductions or these three":** confirm `tsk-5sr`
surfaces as now-resolvable (main-ancestry fallback, proven above).
`tsk-3cx`/`tsk-25b`'s specific cited shas have decayed since the item's
own investigation and are not expected to surface as resolvable from this
fix alone — that is correct, not a regression: their genuine current
content divergence (proven above) is exactly the case the fix must keep
reporting `ok:false` for. This is the same command already synced onto
`work.verify` at discovery (`fgos discover --verdict clear --verify
...`) — the item's current `verify` is already this real, distinct
command, so no further `fgos edit --verify` sync is needed here per this
skill's own rule against overwriting an already-real value.

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

## Validating round 2 findings (`fgos-coding-validating`, reality gate)

Round 1's Approach claimed one content-equivalence fallback cleanly
resolves both blind spots. Testing it directly against the item's own
cited real shas (read-only `git merge-base`/`git rev-list`/`diff`
commands, no state mutated) disproved that for 2 of the 3 named repro
cases:

- `tsk-5sr` (blind spot 2): resolves — `git merge-base --is-ancestor
  7d6ae519 main` → true. Content-match against the SAME target ref
  (`fgw/tsk-5sr`) does NOT resolve it (`git rev-list --count --cherry-pick
  --right-only --no-merges fgw/tsk-5sr...7d6ae519` → 2) — the fix needs
  the main-ancestry fallback specifically, not content-matching.
- `tsk-3cx` (blind spot 1): content-match against `fgw/tsk-3cx` → 2,
  against `main` → also 2. A direct `diff` of the item's own cited
  "identical-patch" pair (`93d8e653` vs `7cd06e83`) shows real content
  divergence (different logic at the same hunk location — not a
  whitespace/context artifact). `git reflog show fgw/tsk-3cx` shows
  further `branch: Reset to ...` entries after the item's cited
  2026-08-20 investigation commits — the branch has moved since, and the
  cited evidence no longer reproduces as described.
- `tsk-25b`: content-match against `fgw/tsk-25b` → 1 (not 0); ancestry
  against `main` → NO. Does not cleanly resolve either.

Recorded via `fgos decision` (this item, reality-gate-not-ready) before
this revision, per this skill's own rule for a returned NOT READY. The
revised Approach above scopes the fix to what round 2 actually proved:
main-ancestry fallback for blind spot 2 (fully proven), content-match
fallback for a clean rebase-rehash sub-case of blind spot 1 (real,
useful, but not proven against the two decayed repro cases — proof
deferred to a synthetic test case at Execute, which the item's own text
explicitly permits in place of the three original items).

## Gate decision (validateApprove)

Asked live (canAutoApprove: false, heavy tier): ship the scoped fix now
(main-ancestry fallback for blind spot 2, content-match fallback for the
clean-rebase sub-case of blind spot 1; a genuinely content-diverged
rebase correctly stays `ok:false`, documented as an intentional
limitation) vs. hold off for further research into a broader blind-spot-1
mechanism. **Answered: ship the scoped fix.** Recorded via `fgos
gate-approve --actor human`.

## Outstanding questions

None
