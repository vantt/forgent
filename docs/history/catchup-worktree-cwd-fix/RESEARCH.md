# catchup worktree cwd fix — research

## Round 1 — 2026-08-11 (tsk-5vl, discovery stage)

**Asked:** Is tsk-5vl's reported bug ("fgos catchup fails to force-update
the item's branch when checked out in a linked worktree") grounded in real
repo evidence, and is `fgos-coding-implement/SKILL.md`'s blocked-recovery
hard rule actually incomplete as described?

**Checked — repo:**

- `bin/fgos.mjs:3542-3576` (`case 'catchup'`): line 3576 reads
  `const repoRoot = process.cwd();` — the catchup handler derives its
  `repoRoot` from the caller's live shell cwd, not from the resolved
  `--dir` main-checkout path.
- `bin/fgos.mjs:776-815` (`withMergeEphemeralWorktree`, `src/runner/
  worktree.mjs`): on a successful merge it lands the result with
  `git(repoRoot, ['branch', '-f', branch, endCommit])` (line 809) — a
  force-update of the item's own `fgw/<id>` branch, run with `cwd:
  repoRoot`. If `repoRoot` is itself the worktree currently checked out on
  `branch` (session cwd was inside its own pick'd worktree when `catchup`
  ran), this is exactly the shape that produces git's "Cannot force update
  the current branch" — forcing the branch that IS the invoking
  directory's own HEAD.
- `bin/fgos.mjs:2247-2255` (`case 'take'`) and `bin/fgos.mjs:2324-2330`
  (`case 'pick'`): both already compute `const repoRoot =
  path.dirname(dir);` instead of `process.cwd()`, with an inline comment
  citing `tsk-k8u D2`/`D1-D2` — "a caller running this from inside a
  linked worktree... always passes `--dir` at the stable main checkout —
  deriving repoRoot from it keeps every git op in this handler targeting
  that stable root instead of the caller's own possibly-transient cwd."
- `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` (the tsk-k8u
  record): explicitly scopes its own fix to `pick`/`take` only — "Fix
  boundary locked this round: bin/fgos.mjs's `pick` and `take` CLI
  handlers only — not `claimWork`'s own default parameter, not `return`'s
  unrelated `process.cwd()` uses..., **not any other verb's `process.cwd()`
  use in the file**." `catchup` did not exist as a distinct concern at
  that time and was never touched — this confirms tsk-5vl's bug is a real,
  previously out-of-scope gap in the same class tsk-k8u already fixed for
  two sibling verbs, not a new/separate mechanism.
- `docs/specs/work-state.md:1068-1069` (RUL33/RUL34): confirms `blocked ->
  awaiting-approval` is a direct catch-up edge that "KHÔNG BAO GIỜ đi qua
  `doing`" (never passes through `doing`) — corroborates that `return`
  (which requires `status: doing`) cannot be the recovery verb for a
  `blocked` item; `catchup` is the only edge that applies.
- `.claude/skills/fgos-coding-implement/SKILL.md:174-189` (Return step, hard
  rule): current text reads "If `return` reports `blocked`, treat that
  exactly like a failed verify: diagnose, fix, and return again" — this
  is the literal text tsk-5vl says is incomplete. Confirmed: `return`
  itself never produces a `blocked` outcome by design here (an item is
  moved to `blocked` by `approve`'s post-merge verify-fail rollback, a
  DIFFERENT verb, not by `return`) — so an item already `blocked` when a
  session goes to call `return` again will simply be refused (`return`
  requires `status: doing`), and the skill names no alternative verb.

**Not found in repo / external:** nothing needed externally — this is a
wholly internal repo bug plus an internal doc gap, no third-party library
or concept involved.

**Findings:**

1. `catchup`'s `repoRoot = process.cwd()` (bin/fgos.mjs:3576) is the same
   class of bug tsk-k8u already fixed for `take`/`pick` (`repoRoot =
   path.dirname(dir)`), deliberately left out of that fix's scope. Reusing
   the identical, already-proven pattern is a real, concrete, and small
   candidate fix — not a novel mechanism to design.
2. `sync-root` (bin/fgos.mjs:3273) and `approve` (bin/fgos.mjs:2739) also
   still read raw `process.cwd()` for merge-related git ops — same class,
   but OUTSIDE tsk-5vl's own reported scope (which names `catchup`
   specifically); worth flagging to planning as a possible sibling gap,
   not something to silently fold in.
3. `fgos-coding-implement/SKILL.md`'s Return-step hard rule is confirmed
   incomplete exactly as tsk-5vl states: it never mentions `catchup` as
   the correct recovery verb for a `blocked` item, and its "return again"
   instruction cannot succeed on a `blocked` item at all (`return`
   requires `doing`).
4. No existing `docs/how-to/*` doc mentions the worktree-checkout
   precondition for `catchup` either — `avoid-a-hung-verify-on-return-
   approve-catchup.md` and `recover-a-blocked-merge-conflict-when-
   catchup-cannot-reconcile-it.md` both exist but don't cover this case
   (title-matched only, not opened in full this round — left for planning
   to confirm before deciding whether to extend one or add a new doc).

**Still open (for `fgos-coding-planning`, not this skill's call):** whether the
fix is (a) `repoRoot = path.dirname(dir)` in `catchup` alone, (b) the same
pattern also applied to `sync-root`/`approve` in one pass, and exactly
which doc(s) (`--help` text, `fgos-coding-implement/SKILL.md`,
`fgos-coding-driving/SKILL.md`, a `docs/how-to/*` page) get the
catchup-recovery-verb and worktree-precondition callouts.

**Verdict:** `clear: true`. Goal, root cause, and both documentation gaps
are all confirmed against real repo evidence; nothing about the item's own
intent is in question. Sizing/exact fix shape is `fgos-coding-planning`'s job,
not blocked on any further research.

## Round 2 — 2026-08-11 (tsk-4uj, discovery stage)

**Asked:** tsk-4uj's own goal — should `sync-root`/`approve` get the same
`repoRoot = path.dirname(dir)` fix as `catchup` (tsk-5vl), given they
already carry deliberate worktree-refusal guards `catchup` never had?
Round 1 (above) already found the guard code paths (`bin/fgos.mjs:3274`,
`:2764-2790`) and the `P44` tag; this round digs into what `P44` and the
guards' own real incident history actually were, and whether applying the
fix would silently defeat any EXISTING test coverage.

**Checked — repo:**

- `src/runner/merge.mjs:240-269` (`isMainWorktree` docstring, in full):
  states the check is deliberately structural (git's own common-dir/
  toplevel resolution), not registry-based, "so it catches both: a main
  worktree's git-common-dir sits directly inside its own toplevel...; a
  linked worktree's common-dir resolves to the MAIN repo's `.git`..."; the
  motivating risk is named explicitly — "a merge landing on that
  worktree's own checkout, or a goal-check verifying its own (possibly
  stale/divergent) tree, while the item is still reported 'done'/'verified
  on main' (P44)."
- `test/cli/fgos.test.mjs:8055-8148` ("approve ad-hoc (unregistered)
  worktree guard (P44)"): the tests' own header comment names the real
  incident this guard closes — "The registry-based guard above only
  catches a worktree created through `fgos session start`... A plain `git
  worktree add` run by hand is invisible to sessions.json, so it slipped
  through the same guard block untouched — approve would merge/verify
  against that worktree's checkout while still reporting the item `done`,
  exactly the silent false-verification the registry guard exists to
  prevent." Three tests prove the refuse-cleanly behavior for both
  `runner` and `pull` sources, plus one confirming main-checkout approve
  is unaffected.
- `test/cli/fgos.test.mjs:8149-8161` ("approve --github + worktree guard",
  citing a SECOND, later incident — `P1 finding
  review-260718-concurrency-hard-gate-cluster`): the `--github` merge path
  originally called `moveWork` BEFORE the registry guard/`isMainWorktree`
  ever ran, so `approve --github` from a linked worktree reached `done`
  while GitHub showed the PR merged — the same false-verification class,
  a second time, from a different code path. Guards were relocated ahead
  of the `--github` branch to close it. This shows the guard has already
  been strengthened once after a real regression, not merely written once
  and left alone.
- `test/cli/fgos.test.mjs:7915-7963` (session-nesting guard,
  `fgos-multi-session-checkout Epic 2`): `initSessionSafeCwd()` builds a
  worktree via `fgos session start`'s real `createSession` with a
  SYMLINKED `.fgos/` (shared store, `.fgos/` fully gitignored) — a
  different worktree flavor than the `catchup`/`take`/`pick` ADR0020 case
  (linked worktree with NO `.fgos/` at all). Every test in this section
  calls `run(sessionWt, ['approve', id])` with **no `--dir` flag** — `dir`
  resolves via the symlink to the same real store even without `--dir`,
  so `repoRoot` (today, `process.cwd()`) equals `sessionWt` regardless.
  Traced through: applying the `tsk-k8u`/`tsk-5vl` fix (`repoRoot =
  path.dirname(dir)`) would NOT change this test's outcome, because
  `path.dirname(dir)` with no `--dir` passed reduces to the exact same
  value `process.cwd()` already gives here — `isMainWorktree(sessionWt)`
  still correctly evaluates false, the guard still fires. Same is true of
  the ad-hoc-worktree tests above (`initGitCwdMain`'s tracked `.fgos/`
  means `dir` resolves via the worktree's own checked-out copy even
  without `--dir`).
- Extrapolating the same trace to `sync-root` (`bin/fgos.mjs:3265-3393`,
  read in full during tsk-5vl's own validating pass): its `isMainWorktree`
  guard is structured identically — same conclusion applies.

**Not found in repo / external:** no separate incident-report document for
`P44` beyond the code/test comments above — it is a comment tag, not a
cross-referenced doc. Nothing external needed; this is entirely an
internal design-history question.

**Findings:**

1. `approve`'s worktree-refusal guard has a real, TWICE-proven incident
   history (`P44` original + the later `--github` bypass), not a
   speculative "just in case" check — strengthens the case that changing
   its trust boundary (cwd-identity -> `--dir`-trust) deserves a real
   product decision, exactly as tsk-5vl's validating pass concluded.
2. Crucially: applying the `repoRoot = path.dirname(dir)` fix to
   `sync-root`/`approve` would NOT break any of the EXISTING guard tests
   (session-nesting, ad-hoc-worktree, `--github`) — every one of them
   invokes the CLI with cwd inside the worktree and NO `--dir` flag, so
   `path.dirname(dir)` reduces to the same value `process.cwd()` already
   gives; the fix only changes behavior in the untested combination (cwd
   inside the worktree AND `--dir` pointed at the main checkout — the
   exact `verify-fail-post-merge`-recovery shape tsk-5vl's own report
   describes). The trade-off is real, but it would not be "quietly
   removing tested protection" — it would be "extending trust from
   cwd-identity to `--dir`-supplied-identity," a materially different
   framing worth putting to the product owner directly.

**Still open (for the product owner, via this skill's own Socratic pass,
not resolvable by more research):** whether extending that trust to
`--dir` for `approve`/`sync-root` is wanted at all, given the two-incident
history behind why cwd-identity was chosen as the trust boundary in the
first place — this is a judgment call about risk appetite, not a fact
research can settle further.

**Verdict:** `clear: true`. The trade-off, its real incident grounding,
and its actual (non-)interaction with existing test coverage are all now
evidenced. Ready for `fgos-coding-exploring`'s Socratic pass with the product
owner — no further research needed first.

## Round 3 — 2026-08-11 (tsk-2bg, discovery stage)

**Asked:** tsk-2bg's own goal — does `promote-to-component`'s
`process.cwd()` + `isMainWorktree` guard (mirroring `sync-root`) plus its
downstream `retargetMember` guard need any further research before
`fgos-coding-exploring`'s Socratic pass can lock the two open framing questions
(same-posture-as-sync-root? single- vs. dual-layer fix?), or is everything
material already grounded in repo evidence?

**Checked — repo:**

- `bin/fgos.mjs:3535-3547` (`case 'promote-to-component'`): confirms D4's
  own finding directly — `const repoRoot = process.cwd();` followed by
  `if (!isMainWorktree(repoRoot))`, byte-identical shape to `sync-root`
  (Round 2, line 3273).
- `src/runner/promote-engine.mjs:53-58` (`retargetMember`): confirms the
  second guard — `isMainWorktree(repoRoot)` re-checked on the `repoRoot`
  parameter, with a docstring comment explicitly stating it "mirrors
  `sync-root`'s own discipline."
- `bin/fgos.mjs:3624` (the `retargetMember(repoRoot, member, rootId, ...)`
  call site): confirms `repoRoot` is the exact same binding resolved once
  at line 3541, never re-derived downstream — the CLI layer is the single
  point where `repoRoot`'s value is decided.
- `rg -l "retargetMember" bin src test` → three hits only: `bin/fgos.mjs`
  (the one real production caller), `src/runner/promote-engine.mjs` (its
  own definition), `test/runner/promote-engine.test.mjs` (direct unit
  test). No second production caller exists today — corroborates D6's
  "no caller besides this one CLI case exists today" claim directly,
  rather than assuming it.
- `test/runner/promote-engine.test.mjs` (read via `rg -n "isMainWorktree|
  repoRoot"`, 54 hits, all plain temp-dir `repoRoot` fixtures): confirms
  `retargetMember`'s own `isMainWorktree` refusal branch (line 54-58) has
  **no dedicated test today** — unlike `sync-root`/`approve`, which have
  named P44-guard tests (Round 2). Worth flagging to `fgos-coding-planning`: this
  item's test scope should add that missing coverage regardless of which
  layer the actual code fix touches.
- GitNexus's own `impact`/graph query on `retargetMember` again returned an
  incomplete caller list ("Called by: promote-engine.test.mjs" only,
  omitting `bin/fgos.mjs`'s real call site at line 3624) — the same
  stale-index gap D4 already found for `isMainWorktree` itself, now
  reproduced a second time on a different symbol in the same file. Cross-
  checked by `grep`/`rg` per CLAUDE.md's own gate note; not re-querying
  `fgos tool query` this round since Round 2/D4 already established the
  posture (`impact-analysis: full`, index stale).

**Not found in repo / external:** nothing external needed — this is a
purely internal guard-placement and trust-boundary question, same as
Rounds 1-2.

**Findings:**

1. Every claim `fgos-coding-exploring`'s own scout (and the D5/D6 decisions it
   locked) relies on is now independently re-confirmed by direct repo
   evidence in this round, not carried over on assertion alone.
2. `retargetMember`'s worktree-refusal branch has zero existing test
   coverage — a concrete gap for `fgos-coding-planning` to size into this item's
   verify scope, independent of the D5/D6 framing decisions themselves.

**Still open:** none for this discovery pass. Whether the actual code
change matches D6's "CLI-layer only" framing, and the exact `--trust-dir`
mechanics (name, no-op-vs-error shape), stay `fgos-coding-planning`'s call once
tsk-4uj's own real mechanism has landed (see CONTEXT.md's tsk-2bg
assumption note).

**Verdict:** `clear: true`. Nothing about this item's own intent, root
cause, or guard structure is in question — ready to proceed past
`discovery`.

**Correction (`fgos-coding-implement`, 260811):** Finding 2 above ("zero
existing test coverage" for both guard layers) was only half right.
`test/runner/promote-engine.test.mjs`'s `'retargetMember refuses to run
from a linked worktree, mirroring sync-root's own discipline'` test
(added by `56b34d9a feat(tsk-3gx-2): mutating engine restructure for
promote-to-component` — the ORIGINAL implementation, not a later
addition) already covers `retargetMember`'s own guard directly. This
round's `rg -n "isMainWorktree|repoRoot"` search missed it because the
test exercises the BEHAVIOR (rejects from a linked worktree) without
referencing the guard function's name — a keyword-search gap, not an
absent test. The CLI-layer half of the finding was correct: no
worktree-guard test existed for `promote-to-component`'s own case before
this item (confirmed again directly this pass, now closed by three new
tests in `test/cli/fgos.test.mjs`). Net effect: the "weak proof" Mode-gate
flag in `plan.md` was grounded in a real gap (the CLI layer), just a
narrower one than stated; it does not change the lane (the hard-gate flag
alone already forced high-risk) or D6's own conclusion.
