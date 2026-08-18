# disposable-worktree dependency provisioning — plan

Item: `tsk-2vd`. Decisions: `docs/history/worktree-dependency-provisioning/CONTEXT.md` (D1-D2).

## Mode gate

Flags counted:

- **existing covered behavior** — yes. `test/runner/worktree.test.mjs`,
  `test/runner/worktree-callsite-wrapper.test.mjs`, and
  `test/cli/fgos.test.mjs`'s branch-source `return` tests (e.g. line 5840)
  already cover `createWorktree`/`return`'s disposable-worktree path and
  must keep passing byte-identical for a `package.json` with no
  dependencies declared (the common historical case).
- **external systems** — yes. This is the first time either code path
  makes a real npm-registry network call (via `npm ci`/`npm install`) as
  part of an otherwise offline operation (worktree creation, verify).
- **weak proof around the area** — yes. No existing test proves
  `createWorktree` or `return`'s temp worktree correctly handle a
  `package.json` that DOES declare a real dependency — the exact scenario
  that exposed this bug had zero coverage before this item.

3 flags, none a hard-gate flag (no auth/data-loss/audit-security/
external-provider-in-the-security-sense/validation-removal) → **standard**.
Not high-risk: this is a build-tooling reliability fix using already-pinned
`package-lock.json` versions, not a change to what the system trusts or
who can act on it.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: "present"` → **full** per `CLAUDE.md`'s
capability gate. `impact({target: "createWorktree", direction: "upstream"})`
and the same for `return`'s implementation in `bin/fgos.mjs` MUST run (and
risk level reported) before `fgos-coding-implement` edits either — `createWorktree`
in particular is called from `claim-port.mjs`, i.e. every leaf/root claim in
the system, so a wide blast radius is expected and must be confirmed, not
assumed away by this plan.

## Approach

**Chosen (D1):** one shared helper, `provisionDependencies(worktreePath)`
(new export in `src/runner/worktree.mjs`, alongside `createWorktree` —
co-located with the module that already owns disposable-worktree creation,
so `bin/fgos.mjs` imports it the same way it already imports
`createClaimWorktree`/`branchNameFor`/`branchExists` from that module today).
Reads `worktreePath/package.json`; if absent or its `dependencies` +
`devDependencies` are both empty, no-ops (mirrors
`checkDependenciesInstalled`'s own skip precedent,
`src/setup/registrations.mjs:349-355`, D2's deferred-to-planning skip
condition); otherwise runs `npm ci` when `package-lock.json` exists in that
worktree, else `npm install` (D2).

Called from two sites:
1. `bin/fgos.mjs`'s `return` branch-source verify block (~line 1766-1768,
   right after `git worktree add --detach` succeeds, before
   `runGoalCheck`).
2. `worktree.mjs`'s `createWorktree`, right before its `return { path, ... }`
   (so every caller — `claim-port.mjs`'s `createClaimWorktree`, and by
   extension `loop.mjs`'s worker/leaf dispatch — gets it for free, matching
   D1's "one shared helper, not two separate fixes").

**Rejected:** provisioning unconditionally with no skip check. Would slow
every worktree creation (including `pick`'s own interactive worktrees, and
every item whose `verify` never touches npm) even when nothing declares a
dependency — the overwhelming majority of this repo's history per
`checkDependenciesInstalled`'s own comment ("forgent had zero npm
dependencies until tsk-slq added yaml"). The skip check keeps today's
byte-identical-when-no-dependencies behavior for every existing caller,
mirroring `capacities.<id>` absent (D1, tsk-62v) and `allowCrossProvider`
absent (D1, tsk-32n) — this codebase's own repeated "additive, no-op when
the new thing isn't declared" pattern.

**Rejected:** a symlink-based provisioning strategy — already rejected in
CONTEXT.md D2 with reasoning (masks a real dependency mismatch); restated
here only to confirm the plan didn't quietly reopen it.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `provisionDependencies`'s skip condition (no `package.json`, or empty deps) | Medium — a wrong skip means either unnecessary install cost (over-broad) or a silent unprovisioned worktree (under-broad, defeats the item) | New tests: (a) worktree with no `package.json` → no-op, no `npm` process spawned; (b) `package.json` present, empty `dependencies`/`devDependencies` → no-op; (c) `package.json` with a real dependency + `package-lock.json` present → `npm ci` runs, dependency ends up in that worktree's own `node_modules`; (d) same but no `package-lock.json` → `npm install` runs instead. |
| Wiring into `bin/fgos.mjs`'s `return` | High — this is the exact path `tsk-32n` proved broken; a wrong insertion point either still fails verify or provisions AFTER `runGoalCheck` (too late) | Reproduce `tsk-32n`'s own real failure as the before/after proof (RUL34/Iron Law failing-test-first style): a real branch with a `yaml`-declaring `package.json`, `fgos return` on it fails today, passes after the fix — same real repro this item was filed from, not a synthetic stand-in. |
| Wiring into `worktree.mjs`'s `createWorktree` | High — this is the runner-loop path, no human present to notice a silent skip | New test extending `test/runner/worktree.test.mjs`: `createWorktree` on a repo whose committed `package.json` declares a dependency → the returned worktree's own `node_modules` contains it, proven by a real `fs.existsSync` check, not a mock. |
| Existing zero-dependency callers stay byte-identical | Low (well-precedented pattern) but must be proven, not assumed | Existing `worktree.test.mjs`/`fgos.test.mjs`/e2e suite runs unchanged and green — this repo's own tracked `package.json` at HEAD-of-this-branch already has real dependencies (`yaml`, from `tsk-64p`'s merge), so the "no-op when empty" branch needs its OWN synthetic fixture (a temp git repo with either no `package.json` or an empty-deps one) to actually exercise the skip path — the real repo's own tests can no longer prove that branch by accident. |

## Files touched

- `src/runner/worktree.mjs` — new `provisionDependencies` export, called
  from `createWorktree`.
- `bin/fgos.mjs` — import and call `provisionDependencies` in the `return`
  branch-source verify block.
- `test/runner/worktree.test.mjs` (or
  `test/runner/worktree-callsite-wrapper.test.mjs`, whichever already hosts
  `createWorktree`'s own direct tests — confirmed at execution time) — the
  4 skip/install scenarios in the risk map, plus the `createWorktree`
  end-to-end case.
- `test/cli/fgos.test.mjs` — extends the branch-source `return` tests
  (near line 5840) with a real dependency-declaring fixture reproducing
  `tsk-32n`'s own failure, before/after.

No change to `merge.mjs`'s two `runGoalCheck` calls (out of scope, D1's
pinned-terms exclusion — they run against `repoRoot` directly, already has
real `node_modules`).

## Order

1. `provisionDependencies` itself + its own 4 unit scenarios (self-contained,
   no caller wiring yet — smallest correct starting point, matches
   `fgos graph`'s advisory below).
2. Wire into `createWorktree` (the runner-loop path — higher production
   blast radius per the impact-analysis note above) + its test.
3. Wire into `bin/fgos.mjs`'s `return` (the path that actually blocked
   `tsk-32n`) + its test, reproducing the real failure this item was filed
   from.
4. Full `npm test` green, confirming the existing zero-dependency-callers
   invariant.

`fgos graph tsk-2vd --json` was run: `topUnblock`/`criticalPath` are
whole-backlog signals unrelated to this item (nothing currently depends on
`tsk-2vd`) and don't change the order above — this item isn't splitting, so
there's no multi-piece choice for that data to inform.

## Split decision

No split. One honest, cohesive fix: a single new helper plus two call
sites that both need it, all traceable to the same root cause (D1). Item
proceeds as itself.

## Verify

`npm test` — proves both the new unit coverage and that `tsk-32n`'s own
real, previously-reproduced failure now passes.

## Assumptions

- `provisionDependencies` lives in `worktree.mjs` rather than a new module
  — not material (doesn't change behavior or acceptance), pinned per this
  skill's own mid-planning-gap filter; `bin/fgos.mjs` already imports
  several worktree-lifecycle helpers from that module, so this keeps one
  import site instead of adding a new module for one function.
- The skip condition checks BOTH `dependencies` and `devDependencies`
  (`checkDependenciesInstalled`'s own precedent only checks
  `dependencies`) — broadened here because `npm ci`/`npm install` installs
  both by default; skipping only when `dependencies` is empty while
  `devDependencies` has entries would still under-provision. Not material
  to CONTEXT.md's own decisions, pinned as an implementation-correctness
  detail.
