# RESEARCH.md — tsk-34o5: attestation level 2 (enforcement halt at reap/return/approve)

## Round 1 (2026-08-23) — the three checkpoints, and whether they share a chokepoint

**Asked:** where do "reap", "fgos return", and "fgos approve" actually live, and
is there one shared pre-merge/pre-trust chokepoint each already has, that a
new attestation-divergence check could sit beside?

**Checked (repo search):**
- `rg -n "captureDispatchAttestation" src bin --glob "*.mjs"`
- Read `src/runner/dispatch/transport.mjs:113-140`
- Read `src/runner/loop.mjs:356-445` (startupReap) and `:820-880` (executor.dispatch event append)
- Read `bin/fgos.mjs:3038-3184` (`case 'return'`, branch-source path)
- Read `src/verbs/merge/approve.mjs:1-60, 130-145, 460-710` (imports, classifySource, mergeRunnerItem call sites)

**Found:**
- **reap** = `startupReap` (`src/runner/loop.mjs:376-445`). For each stale
  `doing` item with `claimRole` not `human`/`session` (i.e. a runner claim),
  it computes `branchFacts(repoRoot, branch)` (`facts.aheadCount > 0` →
  `hasCommit`), then runs verify in a throwaway worktree and calls
  `moveWork(dir, { id, to: resolution.to, expectedStatus: 'doing', reason,
  role: 'runner' })` at `loop.mjs:434`. **This `moveWork` call, right after
  `resolveStaleDoing`, is the chokepoint** — before it, nothing has yet
  trusted the branch's commit as real progress.
- **return** = `bin/fgos.mjs`, `case 'return'` (line 3038). The
  branch-source path (`item.branchHeadAtTake` set) reads `branchHead =
  gitAt(repoRoot, ['rev-parse', branch])`, computes `branchAheadCount =
  commitsSince(...)`, then (further down, ~3176-3184) computes
  `frozenJudgeHits`/`footprintDiffHits` and returns `{..., to:
  'awaiting-approval', ...}`. **The chokepoint is right after
  `branchAheadCount`/verify resolve, before the `awaiting-approval` return
  value is built** — same shape as reap's chokepoint (a
  branchHead-vs-recorded-baseline read already happens here for an
  unrelated purpose (`branchHeadAtTake`), which is a DIFFERENT field than
  the dispatch-level `baseCommit` this item is about — see Round 2).
- **approve** = `src/verbs/merge/approve.mjs`. `classifySource(repoRoot,
  item)` at line 139 decides branch vs main source; `mergeRunnerItem(...)`
  is the actual merge, called at line 533 (root/component path,
  `targetSlot: true`) and line 706 (leaf path). **The chokepoint is right
  before each `mergeRunnerItem(...)` call** — nothing before it has
  compared the branch's real identity against what was captured at
  dispatch time.
- **No single shared function** wraps all three today — each is its own
  file/case, but all three already do a "read the branch's real git state
  right before trusting it" step (`branchFacts`/`commitsSince`/
  `classifySource`), so the new check is additive at three sites, not a
  rewrite of any of them.

**Verdict:** clear — three concrete chokepoints identified with file:line citations.

## Round 2 (2026-08-23) — the persisted attestation's exact shape, and whether anything reads it back

**Asked:** what does the persisted `executor.dispatch` event actually
contain, and does any existing function read it back by item id?

**Checked:**
- `src/runner/loop.mjs:850-873` — the `appendEvent` call.
- `src/runner/dispatch/cli.mjs:280-296` — `logExecutorDispatch` (the
  in-session sibling writer).
- `rg -n "executor\.dispatch" src bin --glob "*.mjs"` (no `test` files) — only
  two writers, zero readers.
- `src/state/events.mjs` exports (`rg -n "^export function" `) — `readEvents(logPath)` exists as the generic reader primitive.
- `docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md` (full read).

**Found:**
- Event shape (async runner path, `loop.mjs:854-873`): `{ type:
  'executor.dispatch', payload: { id, executorId, provider, command, model,
  baseCommit, headRef } }`, appended to `.fgos/events.jsonl` via
  `appendEvent`. The doc comment explicitly says `replay.mjs` ignores this
  event type by design — **it never enters the FSM `view`** (`fgos list
  --json` cannot see it). Any level-2 check needs to read raw events itself.
- **No reader exists yet.** `readEvents(logPath)` (`src/state/events.mjs`)
  is the only generic primitive; a new function filtering `type ===
  'executor.dispatch' && payload.id === id`, keeping the LAST match (by
  file order / `seq`), is new code this item has to add.
- **The in-session dispatch path always writes `baseCommit: null,
  headRef: null`** (`dispatch/cli.mjs:293-296`, comment: "no
  worktree-dispatch attestation applies to an in-session call —
  `captureDispatchAttestation` is never invoked here"). So for an item
  whose only `executor.dispatch` event came from an in-session
  Agent/Task-tool dispatch (e.g. a live skill's own gather fan-out), there
  is genuinely nothing to compare — the new check must treat a
  null/absent attestation as "nothing to enforce", never a halt. This
  mirrors level 1's own stated fail-safe stance
  (`transport.mjs`'s doc comment: "never throws and never blocks dispatch
  — advisory metadata, not a precondition").
- `item.branchHeadAtTake` (used by `return`'s branch-source path today) is
  a **different, pre-existing field** — captured at `fgos pick`/`take`
  time on the item itself, not the dispatch-level `baseCommit`/`headRef`
  this item's own scope is about. The two mechanisms are independent;
  return's existing `branchHeadAtTake` check is not being replaced or
  duplicated, only supplemented.

**Verdict:** clear — schema and the reader gap are both concretely known; the "no attestation → no halt" rule is not a guess, it is the same fail-safe stance level 1's own code comments already state.

## Round 3 (2026-08-23) — the typed-park-reason convention this item's "not a generic throw" requirement should reuse

**Asked:** does the codebase already have a convention for a typed park
reason on a halt, that a new attestation-mismatch reason should follow?

**Checked:** `rg -n "reason: '[a-z-]+'" src/verbs src/runner --glob "*.mjs"` (excluding tests).

**Found:** yes, an established, consistent convention:
`moveWork(dir, { id, to: 'blocked', expectedStatus: <from>, reason:
'<kebab-case-name>', role: 'system'|'runner' })`. Existing examples:
`'merge-conflict'`, `'merge-blocked-other-item'`, `'lock-lost-mid-merge'`,
`'fgos-write-rejected'`, `'merge-failed-unclassified'` (all in
`approve.mjs`), `'runner-crash-reclaim'` (`loop.mjs`/`recovery.mjs`),
`'anti-loop-max-visits'`. A new reason for this item (exact string is a
naming choice, not a discovery blocker) follows this exact shape.

**Verdict:** clear — no new mechanism needed, only a new reason string in an existing, well-established convention.

## Round 4 (2026-08-23) — why a legitimate retry must not false-positive

**Asked:** what does "a legit retry on a branch that already carries an
old commit" look like today, and why wouldn't the new check wrongly halt it?

**Checked:** `src/runner/loop.mjs:768-816` (`dispatchClaimedItem`'s
retry loop).

**Found:** `dispatchBaseline` is captured **once**, on the item's first
attempt (`git rev-parse wt.branch` right after the worktree is created).
On every subsequent attempt (retry after a failed verify), the code
explicitly does `git reset --hard dispatchBaseline` + `git clean -fdq`
**before** the next worker run — the comment states this outright:
"Retry never builds on debris... reset to this item's own dispatch
baseline instead." Because of this, every `executor.dispatch` event for
the same item id across multiple attempts carries the **same**
`baseCommit` (the one-time `dispatchBaseline`), and the branch's eventual
final HEAD (after whichever attempt's commit sticks) is always a real git
descendant of that `baseCommit` — `git merge-base --is-ancestor
<baseCommit> <branchHead>` holds. A level-2 check keyed off the LAST
`executor.dispatch` event by id (Round 2) reads this same, still-valid
`baseCommit` regardless of how many retries happened — no special-casing
needed, the reset-before-retry design already keeps the attestation
correct across retries.

**Verdict:** clear — the false-positive test case (acceptance criterion 3) has a concrete, evidenced mechanism to construct: dispatch, fail verify once (leaving a bad commit), retry (reset+reclean+recommit), then return/approve should see the retry's commit as a legitimate descendant of the one recorded `baseCommit`, never halted.

## Open item found, out of this item's own scope

Running the natural verify candidate
(`node --test test/runner/loop.test.mjs test/cli/fgos-return.test.mjs
test/cli/fgos-approve.test.mjs test/verbs/merge/approve.test.mjs`) on
unmodified branch head `294e8baf` (no code changes made) surfaces 3
pre-existing, deterministic failures, all in
`test/cli/fgos-return.test.mjs`, all asserting "return never advances or
touches the human's own main checkout" / `.fgos`-only-dirty-tree
exemptions — unrelated to worktree-dispatch attestation. Reproduced twice,
including in full isolation via `--test-name-pattern`, so this is not
test-order contamination or a fixture race in this run. Not investigated
further — root-causing an unrelated main-checkout-cleanliness regression
in `return` is out of this item's own scope (identity/attestation only,
per the item's own "phạm vi giữ hẹp" line). Flagged here so `executing`
does not mistake it for a regression it introduced.
