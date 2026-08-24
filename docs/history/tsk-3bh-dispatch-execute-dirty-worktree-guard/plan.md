# Plan — tsk-3bh: warn (not silently lose) when an out-of-process dispatch's target cwd loses uncommitted content

Mode: small

No `CONTEXT.md` exists for this item — discovery's own verdict was
`clear` (see `RESEARCH.md` Round 1), which skips `exploring` outright, so
this plan works directly from the item's own description plus
`RESEARCH.md`'s findings, per `fgos-coding-planning`'s direct-entry
fallback.

Lane derivation (no lane was handed off by `fgos-routing` — this session
entered via `fgos-coding-driving` directly): counted against the Mode-gate
flag list — auth: no, authorization: no, data model: no, audit/security:
no (this is a visibility/safety fix, not an access-control change),
external systems: no (fgOS's own dispatch path is not changing its
integration surface with `agy`, only adding a local check around it),
public contracts: no (the happy path — a clean cwd — is byte-identical;
only the previously-undefined dirty-cwd edge case gains new, additive
behavior), cross-platform: no, existing covered behavior: yes
(`executeExecutorCli` in `src/runner/dispatch/cli.mjs` is covered by
`test/runner/dispatch.test.mjs`), weak proof: no, multi-domain: no. **1
flag → small** (a few files, no gray areas): `src/runner/dispatch/cli.mjs`,
`src/runner/worktree.mjs` (one small additive export), and
`test/runner/dispatch.test.mjs`.

## Approach

**Root cause of the wipe itself stays unconfirmed** — per `RESEARCH.md`
Round 1, `agy`'s own changelog (`agy changelog`) gives no definitive
answer either way, and this item's own description already scopes the
fix as root-cause-independent. The fix targets the real, code-confirmed
gap instead: `executeExecutorCli` (`src/runner/dispatch/cli.mjs:351-355`)
defaults `cwd` to `process.cwd()` and never inspects it for uncommitted
changes anywhere along the out-of-process (self-execute) path, before or
after handing it to the adapter.

**Chosen path: detect-and-surface-after, not refuse-before.** Snapshot
the set of dirty paths in `cwd` (git status, `:!.fgos` excluded, same
pathspec `isCheckoutDirty`/`resyncClaimWorktree` already use) immediately
before invoking `adapterFn` in the out-of-process branch
(`src/runner/dispatch/cli.mjs`, right where `captureHeadSha(cwd)` already
runs as `headBefore`), and again immediately after the adapter returns
(alongside the existing `headAfter` capture). If `headBefore === headAfter`
(nothing was ever committed to explain it) AND one or more paths that were
dirty *before* are no longer dirty *after*, that is exactly the tsk-3df
symptom — surface it loudly: a new field on the returned result object
(read by every caller, not just a human watching a terminal) plus a
`process.stderr` line naming the exact paths, so a driving session never
again has this happen invisibly.

**Alternative considered and rejected: refuse before dispatching when
`cwd` is dirty**, mirroring `resyncClaimWorktree`'s own refuse-loudly
discipline (`src/runner/worktree.mjs:825-855`,
`docs/how-to/safely-reset-the-main-checkout.md`) exactly as this item's
own description suggested as a precedent. Rejected because the shape of
the risk is genuinely different: `resyncClaimWorktree` refuses because
**fgOS's own code** is about to run `git reset --hard` and would
otherwise discard real work itself — refusing is the only way to avoid
self-inflicted loss. Here, fgOS's own dispatch path never resets anything
(confirmed: no `reset`/`clean`/`checkout`/`stash` call anywhere in
`src/runner/dispatch/*.mjs`); the presumed actor is the external `agy`
process, whose actual behavior stays unconfirmed. The tsk-3df incident
that motivated this item is itself an ordinary, legitimate dispatch
pattern — a driving session with an uncommitted `plan.md` edit,
dispatching a worker to continue the same item — not a misuse to block.
A hard refuse here would block that entire ordinary pattern on every
out-of-process dispatch (AGENTS.md's product priority #1, Ship Faster:
"giảm friction... ít chờ đợi"), trading a rare, already-recoverable
docs-only loss for constant friction on the common case. Detect-after
gives the same guarantee this item actually asks for — the loss is never
invisible again — without that cost.

**Files touched, in order:**

1. `src/runner/worktree.mjs` — add one small additive export,
   `checkoutDirtyPaths(repoRoot, worktreePath)`, returning the raw
   `git status --porcelain -- ':!.fgos'` lines (parsed to relative paths)
   for `worktreePath`, reusing the exact pathspec exclusion
   `isCheckoutDirty` already centralizes rather than re-deriving it a
   second time in `dispatch/cli.mjs` (this module's own doc comment at
   `isCheckoutDirty`'s definition already names the "never a second
   implementation of is this checkout dirty" discipline this honors).
   `isCheckoutDirty` itself is left unchanged (still boolean, still used
   by its existing three callers) — the new export sits alongside it,
   not a replacement.
2. `src/runner/dispatch/cli.mjs` — in `executeExecutorCli`'s out-of-process
   branch (after the `mechanism === 'in-process'` early return, around the
   existing `headBefore`/`headAfter` capture): call
   `checkoutDirtyPaths(root, cwd)` before and after `adapterFn(...)`,
   compare, and when `headBefore === headAfter` and paths were lost,
   attach them to the returned result (e.g. `lostUncommittedPaths`) and
   print a `process.stderr` warning naming them. No change to the
   `in-process` branch, no change to the happy-path (clean-cwd) result
   shape.
3. `test/runner/dispatch.test.mjs` — a regression test exercising this
   directly: dispatch against a fixture git checkout that (a) starts with
   an uncommitted file, (b) whose adapter fake removes/reverts that file
   without committing anything, asserting the returned result carries the
   new field naming exactly that path; a second case proving a normal
   clean-cwd dispatch, and a dispatch where the adapter's own commit
   legitimately supersedes the pre-existing dirty file, are both
   unaffected (no field, no warning).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `executeExecutorCli`'s existing (already-covered) behavior on a clean cwd | low | existing `test/runner/dispatch.test.mjs` cases stay green unchanged |
| The new before/after dirty-path diff | low | new test cases (item 3 above) exercise dirty→wiped, dirty→committed-over (no false positive), and clean→clean |
| `checkoutDirtyPaths`'s reuse of the `:!.fgos` pathspec | low | same pathspec `isCheckoutDirty`'s own existing tests already prove; no new exclusion logic invented |

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present` — CLAUDE.md's gate): GitNexus is registered and
`present`, but **degraded for this exact target**: `list_repos` shows no
indexed entry at all for this item's own worktree path
(`.claude/worktrees/tsk-3bh-1v5oo8`), and the closest sibling covering
this branch lineage (`/home/vantt/projects/forgentX`, main checkout) is
1425 commits behind HEAD — too stale to trust for this change's blast
radius. Direct `rg`/read cross-check already performed instead (see
`RESEARCH.md` Round 1: `src/runner/dispatch/cli.mjs`'s only caller of
`executeExecutorCli` inside this repo is its own CLI subcommand
dispatch table and `fanoutBatchExecutorCli`, both already exercised by
`test/runner/dispatch.test.mjs`) — this is the honest, weaker substitute
the gate calls for, named plainly rather than silently skipped.

## Outstanding questions

None
