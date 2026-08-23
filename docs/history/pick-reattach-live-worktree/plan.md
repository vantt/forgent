# plan — re-claiming an item after the claim-lock §3b release

Item: `tsk-65n`. Decisions: `docs/history/pick-reattach-live-worktree/CONTEXT.md`
(D1–D4). This plan never reopens them.

## Mode: high-risk

Flags counted from the mode gate — 3 apply, one of them a hard gate:

| flag | applies | why |
|---|---|---|
| removing a validation / data loss | **yes (hard gate)** | D3 relaxes the tsk-1os cleanliness guard on the claim path — the guard that exists *because* uncommitted work was destroyed once (`docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`) |
| public contracts | yes | D2/D4 make `take` refuse where it succeeds today (CLI exit contract); D1 changes what `pick` returns/does for an existing checkout |
| existing covered behavior | yes | `test/runner/worktree.test.mjs` (reuse + reclaim suite, incl. the dirty-refusal and clean-force-remove cases at `:97-136`, `:154-181`), `test/e2e/pr-gate.test.mjs`, `test/cli/take-pick-claim-eligibility.test.mjs` |
| auth / authorization / data model / audit-security / external systems / cross-platform / multi-domain / weak proof | no | no identity or permission surface, no schema or event-kind change, git is local tooling, area is already well covered by tests |

A smaller mode would not honestly cover this: `small` assumes no gray areas,
but the single change with the most leverage here is loosening a
data-loss guard, and the blast radius question ("does the relaxation reach
the runner's retry path, which deliberately wants a *fresh* worktree?") is
exactly the kind of thing that needs a named proof point rather than a
confident edit. `standard` would fit the file count but not the hard gate.

## No split

`fgos graph --json`: `criticalPath` (depth 10, `tsk-4vo → … → tsk-19y-1`)
does not contain `tsk-65n`, and it appears nowhere in `topUnblock`.
`fgos graph --what-if tsk-65n --json` returns an empty `topUnblock` —
completing this item unblocks nothing, so splitting buys no parallelism and
no earlier unblock, only extra claim/merge cycles.

The two code changes (D1/D3 reattach, D2/D4 refusal) also share one story
and one doc: a reader hitting either symptom needs the other half explained
in the same place. Kept as one item, phased below.

## Approach

Land the reattach first (it removes an actively session-breaking behavior
and is additive), then the `take` refusal (breaking, needs test triage),
then the doc that describes both.

### Phase 1 — `pick` reattaches instead of reclaiming (D1, D3)

Where the decision goes matters more than the mechanism.
`test/runner/worktree.test.mjs:97-136` and `:154-181` pin today's
`createWorktree`-reuse and `reclaimOrphanedCheckout` behavior — clean
checkout force-removed, dirty checkout refused — and those tests must stay
green **unmodified**, because the dispatch and merge-ephemeral callers still
need exactly that. So the reattach must be opt-in from the claim-isolate
shape only, never the new default of the shared reuse path:

- `src/runner/worktree.mjs` — reattach lives behind an opt that defaults
  off, consumed on `createWorktree`'s reuse path (or in
  `createClaimWorktree`, above it). When it is on and
  `findCheckoutPath(listing, branch)` yields an existing on-disk path,
  return that path as the worktree — clean or dirty, per D3 — without
  calling `reclaimOrphanedCheckout` and without `git worktree add`. The
  freshly `mkdtemp`'d directory must be cleaned up on this path, the same
  care `createWorktree` already takes on its failure paths.
- `src/runner/claim-port.mjs:250` — `createClaimWorktree(...)` passes the
  opt. `createDispatchWorktree` and `withMergeEphemeralWorktree` do not,
  and are not touched.
- The `{ path, branch, reused }` return shape stays; `reused: true` already
  covers a reattached checkout. Whether callers need to distinguish
  "reattached existing path" from "added fresh checkout on existing
  branch" is the open question below.

### Phase 2 — `take` refuses on a branch-existing `todo` item (D2, D4)

The guard belongs at the **verb** layer, in `bin/fgos.mjs`'s `take` case —
not in `claimWork`. `src/runner/loop.mjs:452` calls
`claimWork(dir, { actor: 'runner', isolate: false, ... })` directly, so a
guard inside `claimWork` would make the runner start refusing its own
claims.

Condition: item `status === 'todo'` and `branchExists(repoRoot,
branchNameFor(id))`. Message names `pick <id>` as the correct door and says
why a main-checkout take is wrong (it records `source: main` +
`headAtTake`, which makes `return` measure progress against a main HEAD
that never advances). `blocked` + branch-exists (`isBranchTake`,
`claim-port.mjs:204`) is explicitly untouched.

### Phase 3 — doc (D1's tail)

`docs/how-to/claim-a-clarify-or-decompose-stage-item.md` today states it
covers the fresh-claim case and "not to resuming an item you already
claimed" — that sentence becomes the seam for a resume section: after a
§3b release, re-claim with `pick <id>` (now safe on a live worktree);
`take` refuses and says so; the `move --to blocked` + `take` detour is no
longer needed and costs the preserved `branchHeadAtTake`
(`docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` D2).

### Rejected along the way

- **Doc-only** — leaves both the destructive re-`pick` and the silent
  main-source `take` in place; rejected by D1.
- **A new `reattach` verb/flag** — a second claim door beside the one
  `docs/specs/runner.md:163-168` already names; rejected by D1.
- **Making reattach the default of `createWorktree`'s reuse path** — would
  reach the runner retry path (`loop.mjs:641-643`, `:648`, `:762`), which
  deliberately wants a fresh worktree on a reused branch so a retry never
  builds on debris.
- **Guarding inside `claimWork`** — would refuse the runner's own
  `isolate: false` claims (`loop.mjs:452`).

## Risk map

| component | risk | what would prove it |
|---|---|---|
| reattach leaking to the dispatch / merge-ephemeral callers | **high** | `test/runner/worktree.test.mjs` and `test/runner/loop.test.mjs` stay green **with no edits**; `createDispatchWorktree`/`withMergeEphemeralWorktree` provably never pass the opt |
| relaxing the tsk-1os guard on the claim path (D3) | **high** | a new test: a dirty checkout of `fgw/<id>` re-picked keeps its uncommitted changes at the same path, and no `git worktree remove` runs; `test/state/backward-compat.test.mjs` + `test/e2e/pr-gate.test.mjs` green |
| reattached path vs the harness `EnterWorktree` constraint (must sit under `.claude/worktrees/` of the same repo) | medium | check what `pick` returns for a checkout created under the older `os.tmpdir()/fgos-worktrees` default, and what `/fgOS:pick`'s step-4 hand-off does with it |
| D2's refusal breaking a real flow or a green test | medium | enumerate every `take` call path (CLI vs `claimWork` callers) and every test touching `take`; full suite green, and any test asserting today's silent main-source take is knowingly rewritten, not deleted |
| `git worktree list --porcelain` parsing on the reattach path (stale registration, path gone from disk) | medium | a test where the registration exists but the directory does not — must fall through to today's prune-then-add, not return a nonexistent path |
| the §3b `branchHeadAtTake` preservation (`claim-port.mjs:184-199`) regressing | low | `test/cli/fgos.test.mjs:4997-5019` and the `claim-reclaim-branchhead-reset` coverage green, unmodified — this plan touches the worktree step, not the branchHead computation |

Both **high** rows carry to `fgos-coding-validating` as proof points, not
assumptions.

## Cases worth proving (high-risk depth)

- Re-`pick` with a live **clean** checkout of `fgw/<id>` → same path
  returned, checkout still registered, nothing removed.
- Re-`pick` with a live **dirty** checkout → same path, uncommitted changes
  intact (today: hard refusal).
- Re-`pick` with a registration whose directory is gone → today's
  prune-and-add path, not a returned dead path.
- Re-`pick` when no checkout exists but the branch does → today's
  add-on-existing-branch path, `reused: true`, unchanged.
- Runner retry on a reused branch → still a **fresh** worktree.
- `approve`/`catchup` merge-ephemeral worktrees → unchanged, still
  force-removed on settle.
- `take --id <id>` on `todo` **with** branch → refuses, names `pick`.
- `take --id <id>` on `todo` **without** branch → claims as today.
- `take --id <id>` on `blocked` **with** branch → `isBranchTake`, claims
  branch-source as today.
- Concurrent case: two sessions re-picking the same released item — the
  main-checkout lock (`claim-port.mjs`) still serializes the claim; reattach
  must not hand the same path to both as a *successful* claim (the loser is
  refused at the CAS, before any worktree work).

## Verify

Narrowest first:

```
node --test test/runner/worktree.test.mjs test/runner/loop.test.mjs test/cli/take-pick-claim-eligibility.test.mjs
```

Then, because public contracts and covered behavior both move:

```
npm test
```

`npm test` green is this item's done-proof (`AGENTS.md` L5 question 5).

## Validating verdict: READY WITH CONSTRAINTS

Baseline, actually run before any edit —
`node --test test/runner/worktree.test.mjs test/runner/loop.test.mjs test/cli/take-pick-claim-eligibility.test.mjs`
→ `tests 76 / pass 76 / fail 0` (5.34s). That is the unedited-green bar rows
C1/C2 below are measured against.

Four constraints, each from evidence found while proving this plan. None
reopens `CONTEXT.md`; C1 and C4 choose between options this plan already
wrote, C2 and C3 correct its call-site inventory.

- **C1 — implement reattach in `createClaimWorktree`, not in
  `createWorktree`'s reuse path.** This plan's Phase 1 allowed either. The
  narrower one is strictly safer: `createClaimWorktree`
  (`worktree.mjs:319`) can call the module-private `findCheckoutPath`
  (`:110`, same module, no export needed) and early-return before
  `createWorktree` is ever entered, leaving that function byte-identical.
  The leak risk then cannot happen structurally, rather than being
  prevented by an opt that defaults off.
- **C2 — `reclaimOrphanedCheckout` has a second direct caller this plan's
  risk map missed: `src/runner/merge.mjs:786` (`cleanupMergedBranch`).** So
  the guard is reached from exactly two places — `worktree.mjs:257` and
  that one — not just the reuse path. Under C1 both stay untouched;
  recorded because the plan's inventory said otherwise.
- **C3 — reattach only accepts a found checkout under the caller's own
  `worktreeDir`.** `pick` always passes `<cwd>/.claude/worktrees`
  (`bin/fgos.mjs:1573`), and every checkout registered in this repo today
  sits there (`git worktree list --porcelain`, 7 `fgw/*` entries, all under
  `.claude/worktrees/`). But `createWorktree`'s own default is
  `os.tmpdir()/fgos-worktrees`, so a runner-dispatch checkout for the same
  id could be registered elsewhere — and a *live* one implies a running
  runner, which must not be reattached to. Anything outside the caller's
  `worktreeDir` falls through to today's behavior.
- **C4 — reattach must `fs.existsSync` the path `findCheckoutPath`
  returns.** That helper (`:110-123`) reports the registration without
  checking the disk. When the directory is gone, fall through to the
  existing prune-then-add path (`worktree.mjs:183-195`) rather than
  returning a dead path.

Where the new coverage lands: `test/cli/fgos.test.mjs:3315-3346` is already
the §3b second-pick test. It asserts `from`, `branchHeadAtTake`,
`worktree.branch`, and `worktree.reused === true` — all four still hold
under reattach, so it stays green unmodified, and the path-identity
assertion belongs there.

## Open questions for `fgos-coding-validating`

- Does any caller need to distinguish a reattached existing checkout from a
  freshly added one, or does `reused: true` suffice — specifically
  `/fgOS:pick`'s `EnterWorktree` hand-off?
- What should `pick` do when the existing checkout sits outside
  `.claude/worktrees/` (an older `os.tmpdir()` claim) and the harness cannot
  switch into it?
- Does any currently-green test assert `take`'s silent main-source claim on
  a branch-existing `todo` item, and is the runner's own `claimWork` path
  provably untouched by the verb-layer guard?
