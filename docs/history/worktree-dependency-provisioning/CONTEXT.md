# disposable-worktree dependency provisioning — locked decisions

Item: `tsk-2vd`. Filed mid-session from `tsk-32n`'s own `fgos return` failure
(real, reproduced — not speculative).

No prior `judgeDiscovery` verdicts exist for this item (`view.discovery`
empty) — this is the first clarify pass.

## Feature boundary

Every disposable git worktree this codebase creates to run a `verify`
command (`npm test`) needs that worktree's own `node_modules` provisioned
before verify runs — today neither code path that creates one does this.

## Why this gap exists now, and didn't before

This repo had zero real npm dependencies until `tsk-64p`'s cluster added the
first one (`yaml`, `scripts/project-agents.mjs`, still only merged into
`fgw/tsk-64p`, not yet on `main`). Before that, `npm test` never needed
`node_modules` to pass, so the gap was latent and harmless. `tsk-32n`'s
branch legitimately carries that merge (to reach `tsk-62v`'s capacities
schema — a separate, already-resolved dependency-branch gap from earlier in
this session) and was the first branch-source `fgos return` to actually run
verify against a `node_modules`-less worktree with a real dependency in
`package.json`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope covers BOTH broken code paths, via one shared helper — not just the item's original as-submitted scope (`bin/fgos.mjs`'s `return` verb's own disposable temp worktree, `git worktree add --detach` at `bin/fgos.mjs:1766`). Scouting found `worktree.mjs`'s `createWorktree` (used by `claim-port.mjs:259` for every leaf/root claim, and whose `wt.path` result feeds `runGoalCheck` directly in `loop.mjs:362` and `:714`) has the IDENTICAL gap — the headless runner's own automated dispatch loop can fail verify on any future npm-dependent item's `verify` command, not just a human `return`. Fixing only the `return` path would ship a fix that still leaves the more critical automated path broken. |
| D2 | Provisioning strategy is `npm ci` (falling back to `npm install` when no `package-lock.json` is present) run inside the disposable worktree, before verify — never a `node_modules` symlink from the main checkout. A symlink is faster and needs no network, but risks masking a real dependency mismatch when a branch's `package.json` diverged from main's own installed set — exactly the scenario (`tsk-64p` adding `yaml`) that exposed this gap in the first place. An install-based fix would have caught this correctly; a symlink-based one would not have (main's own `node_modules` never had `yaml` either, since `tsk-64p` isn't merged to main). |

## Pinned terms

- **disposable worktree** — a worktree created solely to run one `verify`
  command and then discarded: `bin/fgos.mjs` return's own `--detach` temp
  worktree, and any worktree `worktree.mjs`'s `createWorktree` produces for
  runner-loop dispatch (`loop.mjs`'s worker/leaf/root claims). Explicitly
  NOT `merge.mjs`'s two `runGoalCheck` calls (lines 702, 748), which pass
  `repoRoot` — the real host checkout, which already has its own
  `node_modules` — directly; those are unaffected and out of this item's
  scope.
- **provisioning** — running a real dependency install (D2) inside the
  disposable worktree before `runGoalCheck` is called against it.

## Scout evidence cited

- `bin/fgos.mjs:1758-1799` — `return`'s branch-source verify block: `git
  worktree add --detach tmpWorktree branchHead` then `runGoalCheck(item,
  tmpWorktree, timeoutMs)`, no dependency step anywhere in between. Read in
  full this session (both before and after this item was filed).
- `src/runner/worktree.mjs:227-298` (`createWorktree`) — read in full this
  session; its own doc comment addresses `.fgos/` explicitly (removed after
  checkout, ADR0020) but says nothing about dependencies at all — confirms
  the gap is a real omission, not an intentional decision documented
  elsewhere.
- `src/runner/loop.mjs:362,714` — both call `runGoalCheck(item, wt.path,
  ...)` where `wt.path` is `createWorktree`'s own return value — confirms
  the runner loop's own automated verify runs inside a worktree with the
  same gap, grounding D1's scope expansion.
- `src/runner/claim-port.mjs:259` — `createClaimWorktree` (wraps
  `createWorktree`) is the one door every leaf/root claim forks a worktree
  through — confirms `createWorktree` is not a rarely-used path.
- `src/runner/merge.mjs:702,748` — both `runGoalCheck` calls there pass
  `repoRoot` (the real host checkout), not a disposable worktree — read to
  confirm these are genuinely unaffected, not assumed.
- `src/runner/goal-check.mjs` (`runGoalCheck`, read in full) — confirms one
  shared verify primitive already exists across every caller (worker
  dispatch, return, approve/merge) — D1's "one shared helper" for
  provisioning mirrors this existing "one implementation, never two"
  precedent (the module's own header comment says exactly that about itself).
- Reproduced directly this session: `tsk-32n`'s own `fgos return` — `npm
  test` passed 2041/2046 in a properly-`npm install`'d interactive worktree,
  then failed the identical suite (`ERR_MODULE_NOT_FOUND` for `'yaml'`,
  exactly 1 failure) inside `return`'s own disposable temp worktree,
  confirming this is a real, reproduced defect, not a hypothetical.
- `fgos tool query --capability impact-analysis --status present` → one
  provider, `gitnexus`, `status: "present"` — AGENTS.md's impact-analysis
  gate reads **full**: `impact()` MUST run (and its risk level reported)
  before `fgos-coding-implement` edits `createWorktree`/`bin/fgos.mjs`'s return
  implementation.

## Deferred to planning

- Where the shared provisioning helper lives (new module vs. added to
  `worktree.mjs` vs. `bin/fgos.mjs` itself) — implementation choice.
- Whether provisioning should be skipped when `package.json` declares no
  `dependencies`/`devDependencies` at all (avoiding install cost for the
  common case) — this codebase already has exactly this precedent
  elsewhere (`src/setup/checks.mjs`'s `dependencies-installed` doctor
  check: "passes when package.json has no dependencies field"), so it is
  a natural default to carry forward, not a new product decision — but the
  exact skip condition and its own test coverage is planning's call.
- Whether provisioning happens unconditionally on every worktree creation
  or only lazily right before `runGoalCheck` is called against that
  worktree (affects `pick`'s own interactive worktrees too, which today
  need a manual `npm install` — this fix would incidentally remove that
  manual step for humans as well, not just the automated paths).
- Exact test coverage/fixture shape for proving D1's two call sites both
  get provisioning, and D2's `npm ci`-falls-back-to-`npm install` branch.

## Outstanding questions

None — D1/D2 above resolve every material gray area found this session.
