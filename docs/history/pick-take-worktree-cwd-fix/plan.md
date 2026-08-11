# pick/take repoRoot cwd fix — plan

CONTEXT.md: `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` (D1, D2
locked and approved).

## Mode gate

Flags counted:
- **existing covered behavior** — `pick`/`take` handlers are exercised by
  `test/cli/fgos.test.mjs`, `test/runner/claim-port.test.mjs`,
  `test/runner/worktree.test.mjs`, and e2e (`test/e2e/pr-gate.test.mjs`,
  runner-loop e2e). `createWorktree`/`reclaimOrphanedCheckout`
  (`src/runner/worktree.mjs`) are shared with the autonomous runner's own
  leaf/root dispatch path (`loop.mjs`'s pool-loop, per
  `docs/specs/runner.md`), so D1's guard change is load-bearing for both
  the pull door and the runner loop. **1 flag.**
- **weak proof around the area** — no existing test exercises the CLI
  handler's `repoRoot` derivation itself (`claim-port.test.mjs` calls
  `claimWork` directly with an explicit test-controlled `repoRoot`,
  bypassing the exact bug); this is why the bug shipped and stayed latent.
  **1 flag.**

No auth/authorization/data-model/audit-security/external-system/public-
contract/cross-platform/multi-domain flags. Not classified as the "data
loss" hard-gate: the existing dirty-checkout guard in
`reclaimOrphanedCheckout` already refuses to force-remove anything with
uncommitted changes, so a force-removed orphan today is always already
committed — the bug's symptom is a crash from a doomed `cwd`, not lost
commits. D1 closes a narrower case (refuse instead of force-remove when
`orphanPath` resolves to `repoRoot` itself) as an added stability
guarantee, not a data-loss fix.

2 flags, no hard gate → **standard**.

## Approach

Locked scope (CONTEXT.md): `bin/fgos.mjs`'s `pick`/`take` handlers plus
`src/runner/worktree.mjs`'s `reclaimOrphanedCheckout`/`createWorktree`.
`return`'s own `process.cwd()` uses are out of scope — `return` never
calls `reclaimOrphanedCheckout`/`createWorktree`, so it can't hit this
failure mode.

`fgos graph --json`: tsk-k8u is an isolated component (no deps, no
children) — `criticalPath`/`topUnblock` carry no ordering signal here;
this is one honest piece of work, not a candidate for splitting (step 5 of
this skill's flow doesn't apply).

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` → `gitnexus` present, confirmed during
`fgos-coding-exploring`). GitNexus `impact()` MUST run before editing
`reclaimOrphanedCheckout`/`createWorktree`/the `pick`/`take` handlers
(CLAUDE.md's Always-Do rules) — this is the blast-radius proof point for
the risk-map row below, carried to `fgos-coding-validating`.

### Changes

1. **`src/runner/worktree.mjs` — `reclaimOrphanedCheckout` (D1).**
   Immediately after computing `orphanPath` (currently line ~200), before
   the existing dirty-checkout guard, add: if
   `path.resolve(orphanPath) === path.resolve(repoRoot)`, throw a
   `WorktreeError` refusing to reclaim (same style as the existing
   dirty-checkout refuse message at line ~205) instead of proceeding to
   force-remove. This is the same function, same guard style already
   established (data-loss guard tsk-1os) — one more branch, not a new
   mechanism.

2. **`bin/fgos.mjs` — `take` handler.** Replace `repoRoot: process.cwd()`
   (currently line ~1722) with the `repoRoot = path.dirname(dir)` pattern
   already used at line ~1537 (`wiki` verb) and `src/intake/plan.mjs:438`.

3. **`bin/fgos.mjs` — `pick` handler (D2).** Same `repoRoot` fix as `take`
   (currently line ~1785), AND replace `worktreeDir: path.join(process.cwd(),
   '.claude', 'worktrees')` (currently line ~1786) with the same fixed
   `repoRoot` — `path.join(repoRoot, '.claude', 'worktrees')`. Same call,
   same root cause, same fix.

### Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `reclaimOrphanedCheckout` new refuse branch (D1) | Medium — shared with runner's own autonomous dispatch (`loop.mjs` leaf/root `createWorktree` calls); a wrong guard could make normal reclaim (orphan != repoRoot, the common case) refuse when it shouldn't | `impact({target: "reclaimOrphanedCheckout", direction: "upstream"})` before editing; full `test/runner/worktree.test.mjs` + `test/e2e/pr-gate.test.mjs` + runner-loop e2e green after the change, unmodified pass/fail set except the new case added |
| `pick`/`take` `repoRoot`/`worktreeDir` derivation | Low-medium — mechanical substitution, but on the most heavily used pull-door path | `impact({target: "claimWork", direction: "upstream"})` before editing; full `test/cli/fgos.test.mjs` + `test/runner/claim-port.test.mjs` green; no-`--dir` behavior byte-identical (see CONTEXT.md scout evidence) |
| CLI-level regression coverage (currently absent) | The bug's own root cause — nothing catches a CLI handler passing the wrong `repoRoot` | New test in `test/cli/fgos.test.mjs`: spawn `pick` with `--dir <mainCheckoutFgosDir>` while process `cwd` is a *different* directory than the main checkout, assert the resulting worktree/claim state reflects `--dir`'s root, not `cwd` |

### Concrete cases to prove

- Normal `pick`/`take` from the main checkout, no `--dir` override — byte-
  identical behavior to today (regression baseline).
- `pick`/`take` invoked with `--dir` pointed at the main checkout while
  `cwd` is a different worktree directory — no ENOENT, claim/worktree
  created against the `--dir` root.
- `reclaimOrphanedCheckout(repoRoot, branch)` where the branch's checkout
  path resolves to `repoRoot` itself — refuses cleanly (new
  `WorktreeError`), does not force-remove.
- `reclaimOrphanedCheckout` where the orphan path is any other worktree
  (the existing, common case, e.g. runner's own stale-leaf reclaim) —
  still force-removes exactly as before (no regression).
- The original tsk-2ie repro shape: claim-release + re-pick from inside
  the worktree being torn down — completes without ENOENT.

## Assumptions

- The exact `WorktreeError` message wording for D1's refuse path and the
  exact shape of the new CLI-level regression test are implementation
  detail, not product decisions — left to whoever implements (per
  CONTEXT.md's own deferred-questions section); `fgos-coding-validating`'s
  reality gate checks this assumption is proven, not asked about here.

## Proof surface

`npm test` (`node --test 'test/**/*.test.mjs'`, per `package.json`'s `test`
script) is the full-suite bar named in AGENTS.md's own DoD and was this
plan's own recorded proof point through the planning/validating gates.

The item's own `verify` field, set by `fgos discover`'s real judgment call
(the trust-signal shortcut didn't apply — `readLockedContext` reads
`repoRoot`'s own working tree, which only has `CONTEXT.md`/`plan.md` once
committed there, not merely committed to `fgw/<id>` in a separate
worktree): `node --test test/cli/take-pick-claim-eligibility.test.mjs
test/runner/claim-port.test.mjs test/runner/worktree.test.mjs` — a real,
narrower, existence-confirmed file set covering exactly the risk-map rows
above. This is what `fgos return`'s goal-check actually runs; the full
`npm test` run stays the broader CI-level bar for this change.

## Split

None — one honest piece of work, no children created.
