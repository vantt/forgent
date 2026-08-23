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

Separately, `fgos-coding-implement/SKILL.md`'s Return-step hard rule ("If
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
| D2 | Descope to **`catchup` only**. `fgos-coding-validating`'s reality-gate pass (Repo fit) found that, unlike `catchup`, `sync-root` (`bin/fgos.mjs:3274`) and `approve` (`bin/fgos.mjs:2764-2790`) already carry deliberate, incident-documented worktree-refusal guards (`approve`'s comments cite a real past incident, tag `P44` / "Multi-session-checkout Epic 2" / "spike-proven": a merge could silently land on a worktree's own detached HEAD, or a stale goal-check could falsely report "verified on main"). Those two verbs don't crash confusingly today — they refuse cleanly with an actionable message. Changing their `repoRoot` derivation would convert "always refuse from a worktree" into "work from a worktree provided `--dir` is trustworthy" — a real behavior/risk-posture change for `approve` specifically (the system's highest-stakes, final merge-to-main gate), not a pure bug fix like `catchup`'s. Confirmed by user: "Descope to catchup only" over "keep all three, with explicit proof points" — `sync-root`/`approve`'s guard interaction is filed as its own follow-up item (`tsk-4uj`, see below) for dedicated review, not bundled into this bug fix. |
| D3 (tsk-4uj) | `sync-root`/`approve` get an **opt-in flag** (exact name left to `fgos-coding-planning`, e.g. `--trust-dir`) to derive `repoRoot` from `path.dirname(dir)` instead of `process.cwd()` — default behavior stays exactly as today (strict cwd-identity, zero regression risk to the incident-driven guard). A caller that knows its `--dir` is trustworthy passes the flag explicitly to get the relaxed behavior. Confirmed by user over three other framings: fix both verbs unconditionally (full consistency with `catchup`/`take`/`pick`), fix `sync-root` only, or change neither (keep the permanent `ExitWorktree`-first requirement). Grounded in `RESEARCH.md` Round 2: `approve`'s guard has a TWO-incident history (`P44` original + a later `--github`-path bypass, `review-260718`), and tracing every existing guard test confirms none of them pass `--dir` explicitly, so the fix (gated behind the new flag) would not silently defeat any of them — it only changes the untested cwd-in-worktree-plus-explicit---dir combination. |
| D4 (tsk-4uj) | `promote-to-component` (`bin/fgos.mjs` ~3411-3423) shares `sync-root`'s exact single-layer `repoRoot = process.cwd()` + `isMainWorktree` guard — found during `fgos-coding-validating`'s own Repo-fit pass on tsk-4uj's plan, cross-checking `isMainWorktree`'s real callers after GitNexus's stale index returned an incomplete result. Excluded from tsk-4uj's scope: it has a SECOND, independent guard layer downstream — `retargetMember` (`src/runner/promote-engine.mjs:53-58`) takes `repoRoot` as a parameter and re-checks `isMainWorktree` itself, explicitly documented as mirroring `sync-root`'s own discipline, called via a batch/multi-member promotion path structurally different from the single-item merge path `sync-root`/`approve` use — not a trivial third instance of the same one-line fix. Confirmed by user: filed as its own follow-up item (`tsk-2bg`) over folding it into tsk-4uj. |
| D5 (tsk-2bg) | `promote-to-component` gets the **same opt-in trust-dir relaxation** as `sync-root`/`approve` (D3), not a stricter posture. Its risk shape matches `sync-root` (merges member branches into a runner-owned integration branch `fgw/<rootId>`, never `main` directly) rather than `approve`'s higher-stakes final merge-to-main gate, and each per-member merge already reuses the identical primitive (`mergeRunnerItem` via `withMergeEphemeralWorktree`) `sync-root` uses today. Running the promotion over N members in one call is a repetition of that same guarded primitive, not a new kind of risk. Confirmed by user (260811). |
| D6 (tsk-2bg) | The fix lands **only at the CLI entry layer** (`bin/fgos.mjs`'s `promote-to-component` case, same `repoRoot`-resolution shape D3 gives `sync-root`/`approve`) — **zero change to `src/runner/promote-engine.mjs`'s `retargetMember`**. Scout finding: `retargetMember` is called at `bin/fgos.mjs:3624` with the exact same `repoRoot` variable the CLI handler already resolved at line 3541 — it never re-derives its own value. Once the CLI layer resolves `repoRoot` correctly (trust-dir-gated, same as D3), `retargetMember`'s own `isMainWorktree(repoRoot)` check (`promote-engine.mjs:54`) passes through transparently on an already-correct input — its guard is neither removed nor weakened, it simply now receives correct input, same as today when invoked from the real main checkout. Adding a second, independent opt-in parameter to `retargetMember` itself was considered and rejected as speculative (YAGNI): no caller besides this one CLI case exists today, and any future caller that does not itself resolve a trustworthy `repoRoot` remains correctly blocked by the unchanged guard. Confirmed by user (260811). |

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
necessary regardless of D1 is `fgos-coding-implement/SKILL.md`'s Return-step
hard rule: it needs a `blocked`-specific branch naming `fgos catchup` (per
RUL33/RUL34) as the recovery verb, distinct from the existing "diagnose,
fix, return again" guidance which stays correct for a verify failure
caught while the item is still `doing`. Left to `fgos-coding-planning` to decide
exact wording placement (inline in the existing hard rule vs. a new
sub-bullet) — an implementation/writing detail, not a product decision.

## Assumption (pinned for tsk-4uj, not asked — implementer-level, follows directly from D3)

The opt-in flag applies identically to BOTH `sync-root` and `approve`
(they share the same `isMainWorktree` guard shape) — no reason found to
split it further after D3 already rejected the "sync-root only" framing.
This item's scope is the flag/guard mechanism itself (CLI flag, guard
logic, regression tests, and doc callouts on when a human should reach
for it) — NOT wiring any skill's own automated call sites to pass it
(`fgos-coding-driving`, `fgos-coding-implement`, etc. never call `approve`
themselves per AGENTS.md's own gate boundary, so there is no automated
consumer to wire in the first place; the flag's real user is a person
running `fgos approve --trust-dir <id>`/`fgos sync-root --trust-dir <id>`
by hand while still inside a worktree session). Exact flag name and
whether passing it without an explicit `--dir` is a no-op or a validation
error are implementation nuances — left to `fgos-coding-planning`, matching how
other flags in this file already resolve redundant-combination behavior.

## Assumption (pinned for tsk-2bg, not asked — follows directly from D5/D6)

**Superseded during `fgos-coding-validating`'s reality-gate pass on `tsk-2bg`
(260811):** tsk-4uj has since landed on `main`
(`64f86633 feat(tsk-4uj): add --trust-dir opt-in flag to approve/sync-root`,
`status: delivered`). The real, shipped mechanism (confirmed by reading
the merged diff directly) is:

```js
const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
```

applied ahead of the existing `isMainWorktree(repoRoot)` guard on both
`approve` (`bin/fgos.mjs`, now line ~2760+ on `main`) and `sync-root`
(now line ~3307+ on `main`) — byte-identical to today when `--trust-dir`
is omitted, or passed without `--dir`. tsk-4uj also shipped
`docs/how-to/recover-approve-sync-root-from-inside-a-worktree-with-trust-
dir.md` and four new regression tests in `test/cli/fgos.test.mjs`
(`sync-root --trust-dir with --dir succeeds...`, its no-op counterpart,
and the `approve` + `approve --github` equivalents). `plan.md`'s own
Approach/Changes sections now cite this real mechanism directly instead
of deferring to it — see `plan.md`'s own revision note.

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
- `.claude/skills/fgos-coding-implement/SKILL.md:174-189` — the Return-step
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
- `src/runner/merge.mjs:240-269` (`isMainWorktree` docstring, in full) and
  `test/cli/fgos.test.mjs:8055-8161` (the P44 ad-hoc-worktree guard tests
  plus the later `--github`-path bypass fix) — `RESEARCH.md` Round 2's own
  citations for D3's incident-history grounding.
- `test/cli/fgos.test.mjs:7915-7963` (session-nesting guard tests) — traced
  in full during Round 2: every existing guard test invokes with no
  `--dir` flag, so `path.dirname(dir)` reduces to today's `process.cwd()`
  in each one — D3's fix, gated behind the new opt-in flag, cannot defeat
  any of them.
- `bin/fgos.mjs:4172-4180` (`main-checkout-reset`) — an EXISTING precedent
  for a DIFFERENT trust-widening mechanism: its guard only fires `if
  (flags.dir === undefined && !isMainWorktree(repoRoot))` — passing `--dir`
  explicitly is already treated as full trust there, no separate flag.
  Found during `fgos-coding-validating`'s Repo-fit pass (same pass that found
  D4's `promote-to-component`). D3's separate opt-in flag deliberately
  diverges from this precedent: every automated caller in this codebase
  (`fgos-coding-driving`, `fgos-coding-implement`) already always passes
  `--dir`, so applying `main-checkout-reset`'s convention verbatim to
  `approve`/`sync-root` would silently relax trust for ALL of them —
  exactly the broader, unintended change D3's explicit flag was chosen to
  avoid. `fgos-coding-planning` should cite this precedent in `plan.md` and
  explain the divergence, so a future reader of two similar guards in the
  same file isn't left wondering why they work differently — this is an
  implementation/writing detail, not a re-opening of D3.
- GitNexus's `impact({target: "isMainWorktree", direction: "upstream"})`
  returned only ONE caller (`retargetMember`) despite SIX real call sites
  confirmed by `grep` (`bin/fgos.mjs:2809,3298,3418,4174,4437,4453` +
  `promote-engine.mjs:54`) — the stale index (`last indexed: 4ce7a96`,
  confirmed behind current HEAD) silently omitted `bin/fgos.mjs`'s own
  edges. Manual `grep` cross-check is what surfaced D4's finding at all —
  recorded here as a concrete instance of CLAUDE.md's own gate note: "a
  present status only means the tool is installed, never that its index
  is fresh."

- `bin/fgos.mjs:3535-3547` (`case 'promote-to-component'`) — same
  `repoRoot = process.cwd()` + `isMainWorktree` single-layer guard as
  `sync-root`, confirmed by direct read (D4's own finding).
- `src/runner/promote-engine.mjs:53-58` (`retargetMember`) — independent
  `isMainWorktree(repoRoot)` check, `repoRoot` taken as a plain function
  parameter, no derivation of its own.
- `bin/fgos.mjs:3624` (the `retargetMember(repoRoot, member, rootId, ...)`
  call site inside `case 'promote-to-component'`) — confirms `repoRoot` is
  the exact same variable resolved once at line 3541 and passed straight
  through, never re-derived — the basis for D6.
- `tsk-4uj` (`docs/history/catchup-worktree-cwd-fix/CONTEXT.md` D3/D4, this
  same doc) — origin of the trust-dir flag concept and this item's own
  spin-out; read from `fgw/tsk-4uj` since tsk-4uj is unmerged as of this
  pass.

## Canonical references

- `bin/fgos.mjs` (`catchup`/`sync-root`/`approve`/`take`/`pick`/
  `promote-to-component` handlers)
- `src/runner/worktree.mjs` (`withMergeEphemeralWorktree`)
- `src/runner/promote-engine.mjs` (`retargetMember`)
- `docs/specs/work-state.md` (RUL33, RUL34)
- `.claude/skills/fgos-coding-implement/SKILL.md` (Return step)
- `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` (sibling fix, same
  bug class)
- `docs/history/catchup-worktree-cwd-fix/RESEARCH.md` (this item's own
  research round)

## Outstanding questions

None
