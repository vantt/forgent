# catchup worktree cwd fix — locked decisions

## Feature boundary

`fgos catchup` fails with git's "Cannot force update the current branch"
when the calling session's shell cwd is inside the item's own linked
worktree (checked out on `fgw/<id>`) at invocation time — e.g. the same
session that just hit `verify-fail-post-merge` and is still sitting inside
its own `pick`'d worktree. Root cause (confirmed, `RESEARCH.md` round 1):
`bin/fgos.mjs:3576`'s `catchup` handler reads `const repoRoot =
process.cwd();`, then `withMergeEphemeralWorktree` force-updates the
item's branch via `git branch -f` at `cwd: repoRoot`
(`src/runner/worktree.mjs:809`) — if `repoRoot` is itself the worktree
currently checked out on that branch, git refuses to force-update its own
current branch.

This is the exact same bug class `tsk-k8u` already fixed for `take`/`pick`
(`repoRoot = path.dirname(dir)` instead of raw `process.cwd()`) — and that
fix's own record (`docs/history/pick-take-worktree-cwd-fix/CONTEXT.md`)
explicitly scoped `catchup` **out** at the time ("not any other verb's
`process.cwd()` use in the file"). Scouting for this item found the same
raw-`process.cwd()` pattern still present in `sync-root`
(`bin/fgos.mjs:3273`) and `approve` (`bin/fgos.mjs:2739`) — same class,
never reported broken until now.

Separately, `fgos-code-implement/SKILL.md`'s Return-step hard rule ("If
`return` reports `blocked`, treat that exactly like a failed verify:
diagnose, fix, and return again") is confirmed incomplete for the
`verify-fail-post-merge` blocked case: `return` requires `status: doing`
and cannot act on an already-`blocked` item at all; per RUL33/RUL34
(`docs/specs/work-state.md`), `blocked → awaiting-approval` is a direct
catch-up edge that never passes through `doing`, so `fgos catchup` is the
only verb that actually recovers a `blocked` item, and the skill's own
guidance never names it.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | ~~Fix the `repoRoot = process.cwd()` bug in **all three** affected verbs — `catchup`, `sync-root`, and `approve` — in one pass, not `catchup` alone.~~ **Superseded by D2** — see below. |
| D2 | Descope to **`catchup` only**. `fgos-validating`'s reality-gate pass (Repo fit) found that, unlike `catchup`, `sync-root` (`bin/fgos.mjs:3274`) and `approve` (`bin/fgos.mjs:2764-2790`) already carry deliberate, incident-documented worktree-refusal guards (`approve`'s comments cite a real past incident, tag `P44` / "Multi-session-checkout Epic 2" / "spike-proven": a merge could silently land on a worktree's own detached HEAD, or a stale goal-check could falsely report "verified on main"). Those two verbs don't crash confusingly today — they refuse cleanly with an actionable message. Changing their `repoRoot` derivation would convert "always refuse from a worktree" into "work from a worktree provided `--dir` is trustworthy" — a real behavior/risk-posture change for `approve` specifically (the system's highest-stakes, final merge-to-main gate), not a pure bug fix like `catchup`'s. Confirmed by user: "Descope to catchup only" over "keep all three, with explicit proof points" — `sync-root`/`approve`'s guard interaction is filed as its own follow-up item (see below) for dedicated review, not bundled into this bug fix. |

## Pinned terms

- **repoRoot** (reused from `docs/history/pick-take-worktree-cwd-fix/
  CONTEXT.md`) — the stable main-checkout path a merge/claim operation's
  git commands should run against; must equal `path.dirname(dir)` where
  `dir` is the `--dir`-resolved `.fgos` path, never the caller's possibly
  worktree-scoped `process.cwd()`.

## Assumption (pinned, not asked — implementer-level, follows directly from D1)

Once D1's fix lands, `catchup` no longer requires exiting the worktree
first — the precondition tsk-5vl asked to have "surfaced" in `fgos catchup
--help`/`fgos-coding-driving/SKILL.md` is eliminated by the code fix
itself, not merely documented. No doc change is needed on those two
surfaces for that reason. The one doc change that remains real and
necessary regardless of D1 is `fgos-code-implement/SKILL.md`'s Return-step
hard rule: it needs a `blocked`-specific branch naming `fgos catchup` (per
RUL33/RUL34) as the recovery verb, distinct from the existing "diagnose,
fix, return again" guidance which stays correct for a verify failure
caught while the item is still `doing`. Left to `fgos-planning` to decide
exact wording placement (inline in the existing hard rule vs. a new
sub-bullet) — an implementation/writing detail, not a product decision.

## Scout evidence

- `bin/fgos.mjs:3542-3576` (`case 'catchup'`) — `const repoRoot =
  process.cwd();` at line 3576.
- `bin/fgos.mjs:3265-3393` (`case 'sync-root'`) — line 3273, same pattern.
- `bin/fgos.mjs:2724-3265` (`case 'approve'`) — line 2739, same pattern.
- `bin/fgos.mjs:2247-2255` (`case 'take'`) / `bin/fgos.mjs:2324-2330`
  (`case 'pick'`) — both already fixed: `const repoRoot =
  path.dirname(dir);`, citing `tsk-k8u D1/D2`.
- `src/runner/worktree.mjs:776-815` (`withMergeEphemeralWorktree`) — line
  809's `git(repoRoot, ['branch', '-f', branch, endCommit])` is the exact
  call that fails when `repoRoot` is the branch's own current checkout.
- `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` — tsk-k8u's own
  fix record; explicitly scopes `catchup` (and every other verb) out of
  that round.
- `docs/specs/work-state.md:1068-1069` — RUL33/RUL34, confirms the
  `blocked → awaiting-approval` catch-up edge never passes through
  `doing`.
- `.claude/skills/fgos-code-implement/SKILL.md:174-189` — the Return-step
  hard rule text confirmed incomplete as tsk-5vl describes.
- `docs/how-to/avoid-a-hung-verify-on-return-approve-catchup.md` — read in
  full; covers `--timeout`/`--no-timeout` for these three verbs, no
  overlap with the worktree-cwd issue here.
- `bin/fgos.mjs:2764-2790` (`approve`) — registry-based session-worktree
  guard (2764-2772) plus structural `isMainWorktree` guard (2785-2790),
  both refusing when `repoRoot` (== `process.cwd()`) is any linked
  worktree; comments cite incident tag `P44` and "Multi-session-checkout
  Epic 2" as the origin. `bin/fgos.mjs:3274` (`sync-root`) carries the
  same `isMainWorktree` guard, one layer only. Neither guard exists on
  `catchup` — this is the finding behind D2's descope.
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` present. Posture: **impact-analysis: full** — GitNexus's MUST
  rules (impact analysis before editing the `catchup`/`sync-root`/
  `approve` handlers and `withMergeEphemeralWorktree`; `detect_changes()`
  before commit) apply as written to whoever implements this.

## Canonical references

- `bin/fgos.mjs` (`catchup`/`sync-root`/`approve`/`take`/`pick` handlers)
- `src/runner/worktree.mjs` (`withMergeEphemeralWorktree`)
- `docs/specs/work-state.md` (RUL33, RUL34)
- `.claude/skills/fgos-code-implement/SKILL.md` (Return step)
- `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` (sibling fix, same
  bug class)
- `docs/history/catchup-worktree-cwd-fix/RESEARCH.md` (this item's own
  research round)

## Outstanding questions

None
