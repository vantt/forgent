# plan.md — retrospective-synthesis-merge-corruption (tsk-2oy)

Mode: high-risk

Lane decided directly (no prior handoff — this session entered via
`fgos-coding-driving`, not `fgos-routing`'s Orient step, and no earlier
`plan.md` round exists). Flags counted per `fgos-routing`'s own Mode-gate
table: **audit/security** (hard-gate — this item repairs a hole in the
main-checkout write path that silently corrupts the git-history audit
trail), **existing covered behavior** (`fgos-compounding`'s step 3 runs on
every retrospective-synthesis, of every item, going forward), **weak proof
around the area** (main-checkout merge mechanics; see Risk map). One
hard-gate flag alone forces high-risk regardless of count; 3 flags total
here.

CONTEXT.md decisions this plan honors: D1 (scope = tsk-4v6 only, other 4
found instances become follow-ups), D2 (audit already satisfied by
RESEARCH.md round 1).

## Approach

**Chosen path:** two changes, landed as one item (no split — see below):
1. Merge `fgw/tsk-4v6`'s real tip (`687abfb8`) into `main`.
2. Add a `MERGE_HEAD` precondition guard to `fgos-compounding` step 3's
   commit, so it refuses instead of silently absorbing a stray staged
   merge.

**Rejected alternative — wrap step 3 in the full `main-checkout.lock`**
(mirroring `mergeRunnerItem`'s own `acquireMainCheckoutLock` end-to-end):
would close the residual TOCTOU window completely (see Risk map item 2)
but needs a new reusable lock-acquire-then-release CLI surface that
nothing in this repo exposes today — real new production code for a
window that a plain `MERGE_HEAD` check already closes for every one of the
5 confirmed real-world instances (in each, the stray merge was already
staged, not racing into existence mid-commit). Rejected as scope beyond
what the evidence justifies (YAGNI) — noted here, not silently dropped,
per D2's audit-scope precedent for documenting boundaries honestly.

**Rejected alternative — split into two items** (one for the merge, one
for the guard): rejected because CONTEXT.md D1 already scopes both as one
bounded piece for tsk-2oy, they share one verify chain, and neither is
independently useful without the other (merging without the guard leaves
the hole open for the next synthesis; guarding without merging leaves
tsk-4v6's fix still missing).

### Risk map

| # | Component | How risky | Proof point (for `fgos-validating`) |
|---|---|---|---|
| 1 | Landing `fgw/tsk-4v6` on `main` | **MEDIUM** (downgraded from an earlier HIGH — see `fgos-validating` round 1 correction below). `fgos approve` requires `item.status === 'awaiting-approval'` (`bin/fgos.mjs:2735-2737`); tsk-4v6 sits at `cleanup`. A FULL read of `status-fsm.mjs`'s `TRANSITIONS` table (not a partial grep) shows the legal path IS `cleanup -> blocked -> awaiting-approval`, and better: `checkMergeStillResolves` (`src/state/cleanup-harness.mjs:133`), already wired into the existing `fgos cleanup` verb (`bin/fgos.mjs:1291-1341`), checks exactly `git merge-base --is-ancestor <branchHeadAtReturn> HEAD` and auto-parks `cleanup -> blocked` with a real system-generated reason when it fails — which it will, for tsk-4v6, right now — **regardless of TTL state** (the `assessment.failed.length > 0` branch in `case 'cleanup'` is checked before the TTL no-op branch). No manual `--reason`, no custom script, no direct call to an unexported function. | Sequence: `fgos cleanup tsk-4v6` (auto-parks `cleanup -> blocked`, reason cites the real merge-check failure) -> `fgos move tsk-4v6 --to awaiting-approval` (`blocked -> awaiting-approval`, no `--reason` required — not one of the three reason-required edges) -> `fgos approve tsk-4v6` (standard, lock-guarded `mergeRunnerItem` path, unmodified). Confirm at execution time that `checkRetrospectiveContent` still finds real content (it already did once, nothing erases it) so the later `delivered -> retrospective -> cleanup -> done` replay passes mechanically without needing fresh synthesis work. **Never a raw hand-run `git merge`, and never a direct off-CLI call to `mergeRunnerItem`** — both are unnecessary now that the standard path is confirmed open. |
| 2 | Guarding `fgos-compounding` step 3 | **HIGH** (existing covered behavior + audit/security). A `MERGE_HEAD`-present precondition check before the `git commit` line, refusing loudly (matching this codebase's existing "refuse loudly, never silently guess" idiom — e.g. `resolveDiscovery`'s missing-`--verdict` refusal) closes the exact hole all 5 confirmed instances share. Residual: a `MERGE_HEAD` created in the narrow window between the check and the commit itself (two shell statements) is not closed by a plain precondition — accepted as a documented residual, not fixed here (see Rejected alternative above). | `fgos-validating` should confirm no other code path in this repo already exports a reusable `mergeHeadExists`-equivalent it should call instead of a fresh inline `git rev-parse --verify -q MERGE_HEAD` (checked: `mergeHeadExists` in `merge.mjs` is a private, unexported function — the guard is a fresh one-line shell check, not an import). |
| 3 | Skill-prose verify shape | LOW — mechanical once written. `docs/how-to/write-verify-for-a-skill-prose-change.md` read (required — this item touches `.claude/skills/fgos-compounding/SKILL.md`). | See Proof surface below; no proof point needed beyond writing it correctly. |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → GitNexus registered,
`present` → **full**. `fgos-code-implement` must run a real `impact()`
call on the touched symbols/files before editing (`fgos-compounding`'s own
step-3 commit block, and whatever helper `mergeRunnerItem` invocation is
written) per `CLAUDE.md`'s MUST rule.

### Files touched

- `.claude/skills/fgos-compounding/SKILL.md` — add the `MERGE_HEAD` guard
  immediately before the existing `git -C "$root" commit -m "docs(<id>):
  retrospective synthesis"` line (step 3).
- `main` (via merge, not a tracked-file diff under this item's own
  branch) — receives `fgw/tsk-4v6`'s real content
  (`src/runner/loop.mjs`'s `parseVerdictBlock`/`resolveDiscovery` routing,
  already written and reviewed under tsk-4v6 — no new implementation
  logic here, only landing it).

### Order

1. Land `fgw/tsk-4v6` on `main` first (via the standard `fgos cleanup` ->
   `fgos move --to awaiting-approval` -> `fgos approve` sequence, item 1
   above) — this is the more time-sensitive fix (a real bug in
   `src/runner/loop.mjs` stays live on main until this lands) and is
   independent of the guard.
2. Add the `MERGE_HEAD` guard to `fgos-compounding` step 3 second — once
   `main` already reflects tsk-4v6's fix, there is no more risk of a
   crashed/concurrent step-1 merge leaving a stray `MERGE_HEAD` for step 2
   itself to trip over.

No dependency graph consultation needed (`fgos graph --json` shows tsk-2oy
with 0 deps and no children — this is a standalone leaf item; ordering
above is a within-item sequencing call, not a cross-item one).

## Shape

Two-phase, sequential (see Order above), each with its own concrete proof:

**Phase 1 — land tsk-4v6's fix.**
- Run `fgos cleanup tsk-4v6` — `checkMergeStillResolves` fails (687abfb8/
  dbd31b42 not an ancestor of main), auto-parking `cleanup -> blocked`
  with a real, system-generated reason. Confirm the reason names the
  merge-resolution failure specifically (not a TTL or content-check
  reason crowding it out — `failed` join includes every real gate
  failure, so this is additive, not exclusive).
- `fgos move tsk-4v6 --to awaiting-approval` (`blocked -> awaiting-
  approval`, no `--reason` needed).
- `fgos approve tsk-4v6` — the standard, already-lock-guarded,
  `MERGE_HEAD`-safe path (`src/runner/merge.mjs`'s `mergeRunnerItem`,
  invoked through the CLI exactly as designed, no workaround).
- Prove: `git merge-base --is-ancestor 687abfb8 main` → yes, plus the
  merge's own goal-check output shows `passed: true`.
- Edge cases to prove against: `main` has moved since tsk-4v6's branch was
  cut (conflict is a real possible outcome — `mergeRunnerItem` already
  handles conflict/verify-fail/fgos-write-rejected as defined non-throwing
  outcomes; if hit, this item stops and reports rather than force-pushing
  past it). Post-approve, tsk-4v6 lands at `delivered` and mechanically
  replays `retrospective -> cleanup -> done` — expected to pass immediately
  since `checkRetrospectiveContent` already found real content once and
  nothing erases it, and `checkMergeStillResolves` now passes for real.

**Phase 2 — guard the pipeline.**
- Add the `MERGE_HEAD` precondition check (exact refusal text pinned so
  the POSITIVE verify below has a real target):
  `"refusing to commit — MERGE_HEAD is set"`.
- Prove the guard text exists (POSITIVE) and the original commit line is
  still present, unremoved (a lighter substitute for a NEGATIVE clause —
  see Proof surface below for why a true NEGATIVE does not apply to a pure
  addition).
- Edge case to prove against conceptually (not re-testable by `verify`
  itself, per the skill-prose how-to's own boundary): a future
  retrospective-synthesis session hitting a real stray `MERGE_HEAD` now
  gets a loud refusal instead of a silent wrong-branch commit — this is
  the actual behavior change, and per the how-to doc, proving prose is
  *followed correctly at runtime* is out of verify's jurisdiction; that
  lives in merge-time review + `fgos-validating`'s own reality check, not
  a shell assertion.

### Proof surface (verify)

Item's `verify`, refined from the clarify-stage placeholder to also cover
the skill-prose deliverable (`docs/how-to/write-verify-for-a-skill-prose-
change.md`'s required shape for any item touching a `SKILL.md` path):

```
git merge-base --is-ancestor 687abfb8 main && npm test && grep -q "refusing to commit — MERGE_HEAD is set" .claude/skills/fgos-compounding/SKILL.md && grep -q 'git -C "\$root" commit -m "docs(<id>): retrospective synthesis"' .claude/skills/fgos-compounding/SKILL.md
```

No true NEGATIVE clause: this change is a pure addition to
`fgos-compounding`'s prose (a guard inserted before an existing line), not
a rename/removal — the how-to doc's NEGATIVE requirement exists to catch
"verify passes because the deliverable was deleted," which the second
`grep -q` above (asserting the original commit line survives unremoved)
already covers for this shape of change.

## Outstanding questions

None
