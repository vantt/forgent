# Plan — fix repoRoot bug (D1) + verify-overwrite guard (D2)

Item: tsk-1ni
CONTEXT.md: `docs/history/discovery-decompose-reporoot-verify-overwrite/CONTEXT.md`

## Mode gate

Flags counted:
- auth — no
- authorization — no
- data model — no (no new/changed fields, only how existing `verify`/
  `docsRef` get read)
- audit/security — no
- external systems — no
- **public contracts — yes.** `resolveDiscovery`/`resolveDecompose` back
  the `fgos discover`/`fgos plan` CLI verbs, consumed by every
  coding-domain skill (`fgos-coding-exploring`, `fgos-coding-planning`, `fgos-coding-validating`,
  `fgos-coding-implement`) and the runner's RUL19 sweep — a behavior change here is
  visible to all of them.
- cross-platform — no
- **existing covered behavior — yes.** `test/intake/discovery.test.mjs`
  (55K) and `test/intake/plan.test.mjs` (65K) already cover
  `resolveDiscovery`/`resolveDecompose` in depth.
- **weak proof around the area — yes.** `mkLockedContextFixture`
  deliberately constructs `repoRoot == content-root`, which is exactly why
  the D1 bug shipped uncaught — the existing proof surface does not model
  real git-worktree topology.
- multi-domain — no

3 flags, no hard-gate flag → **standard**. No split: this is one cohesive
fix (the two bugs share root cause context and a shared helper function),
not several independently workable pieces — proceeds as one item.

`fgos graph tsk-1ni --json`: tsk-1ni sits in a 4-item component with its
dependency `tsk-5q5` and `tsk-5q5`'s own children; not on `criticalPath`,
not in `topUnblock`'s top ranks — this is a self-contained correctness fix
with no cross-backlog ordering constraint, so file order below is decided
by dependency between the two fixes themselves, not by `fgos graph`.

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` returned `gitnexus`/`present`, checked
during `fgos-coding-exploring`). GitNexus impact analysis is run before editing
`resolveDiscovery`/`resolveDecompose` at `fgos-coding-implement`, per `CLAUDE.md`'s
own MUST rule — not skipped or degraded here.

## Approach

### D1 — content-root resolution (shared by both files)

Today: `const repoRoot = path.dirname(dir); readLockedContext(repoRoot,
work.docsRef)` in both `resolveDiscovery` (discovery.mjs:518-519) and
`resolveDecompose` (decompose.mjs:438-439). `dir` is always the state root
(main checkout's `.fgos`, per `--dir`/ADR0020) — `repoRoot` derived from it
is always main's working tree, never the item's own `fgw/<id>` worktree
where `CONTEXT.md`/`plan.md` actually get committed.

**Chosen path:** add one new helper, `resolveContentRoot(stateRoot, id)`,
next to `readLockedContext` in `decompose.mjs` (same module, same import
`discovery.mjs` already has), tried in order, first hit wins:

1. `process.cwd()` — the common case. Every caller that has real locked
   content to find is the interactive session itself, invoked from inside
   the item's own worktree (`fgos-coding-exploring`'s and `fgos-coding-planning`'s own
   hard rule: commit before calling `fgos discover`/`fgos plan`, and
   this session's own actual invocations in this branch confirm the CLI is
   run from that same cwd). Zero extra cost — just use the process's own
   working directory as the first candidate.
2. `git worktree list --porcelain` (run from `stateRoot`), matched against
   branch `fgw/<id>` — covers the crashed-mid-session case tsk-ozl D3 named
   as RUL19's own reason to trust a committed CONTEXT.md even with no live
   session attached: the worktree still exists on disk even after the
   session that created it ends, discoverable by branch name alone. Only
   invoked when candidate 1 doesn't resolve to a directory holding
   non-empty locked content — one extra shell call, not on the hot path.
3. `stateRoot` itself (today's behavior) — last resort, covers an item
   whose branch already merged to main (content really does live at
   `stateRoot` now) or a genuinely untouched item (no worktree, no
   content — correctly fails open to a real judge call, unchanged from
   today).

`readLockedContext`'s own signature/behavior is untouched — only what root
gets passed to it changes. Both call sites replace
`readLockedContext(repoRoot, work.docsRef)` with
`readLockedContext(resolveContentRoot(repoRoot, id), work.docsRef)`.

Rejected alternative: an explicit `contentRoot` parameter threaded through
every layer from the CLI verb down. Rejected because the CLI verb
(`bin/fgos.mjs`) has no independent source for that path today — it would
have to either derive it from `process.cwd()` anyway (making the extra
parameter a no-op wrapper) or take on new plumbing to discover it, which
`resolveContentRoot` already does internally without changing any call
site's public signature (`resolveDiscovery(dir, id, cfg, role)` /
`resolveDecompose(dir, id, cfg, role)` stay as they are).

### D2 — verify-overwrite guard (discovery.mjs only)

Today: `discovery.mjs:577`, `moveStage(..., verify: verdict.verify ??
FALLBACK_VERIFY, ...)` on every clear verdict, unconditional.

**Chosen path:** before that call, check whether `work.verify` is already
real — set, non-empty, and not one of the two known placeholder strings:
the retired P14 sentinel (`"chưa xác định — P15 bổ sung"`,
discovery.mjs:43's own comment) and the current `FALLBACK_VERIFY`
(`"chưa xác định — bổ sung thủ công"`, discovery.mjs:50). When real, pass
`work.verify` through unchanged instead of `verdict.verify`; only fall back
to the model's guess when `work.verify` is empty or one of those two
placeholders. Applies regardless of whether D1's skip-and-advance path or
the real `judgeDiscovery` path produced the clear verdict — both call
`moveStage` with a `verify` value today, both get the guard.

`decompose.mjs` needs no equivalent guard (confirmed at `fgos-coding-exploring`:
`planApproveVerify` is read once at line 431 and reused unconditionally at
every `moveStage`-to-`executing` call site already).

## Files touched, in order

1. `src/intake/plan.mjs` — add `resolveContentRoot`, export it; update
   `resolveDecompose`'s call site (line ~438-439) to use it. Depends on
   nothing else in this plan — do first since `discovery.mjs` imports from
   this module already.
2. `src/intake/discovery.mjs` — import `resolveContentRoot`; update
   `resolveDiscovery`'s call site (line ~518-519) to use it; add the D2
   verify-overwrite guard before the clear-verdict `moveStage` call
   (line ~572-580).
3. `test/intake/plan.test.mjs` — new fixture shape that separates
   `stateRoot` from `content-root` (a real second directory, or a fixture
   `git worktree`), replacing/supplementing `mkLockedContextFixture`'s
   coincidental `repoRoot == content-root` construction; cover all three
   `resolveContentRoot` branches (cwd hit, worktree-list hit, fallback to
   stateRoot).
4. `test/intake/discovery.test.mjs` — same fixture-shape update for
   `resolveDiscovery`; add coverage for D2's guard (clear verdict with an
   already-real `work.verify` must not be overwritten; clear verdict with
   an empty/placeholder `work.verify` still gets the model's guess).

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `resolveContentRoot` (new, shared) | Medium — wrong resolution could make the trust signal fire against stale/wrong content, or never fire at all | New fixture test per branch (cwd hit / worktree-list hit / stateRoot fallback), run via GitNexus impact analysis on `readLockedContext`/`resolveDiscovery`/`resolveDecompose` before editing (`CLAUDE.md` MUST rule, posture: full) |
| D1 skip-and-advance now reachable in the standard workflow (previously dead) | Medium — first time this code path actually runs for real committed content; could surface a latent bug in the skip-and-advance logic itself (tsk-ozl code, never exercised past the coincidental-fixture test) | Live-shaped test reproducing tsk-3sw's case: real worktree, committed CONTEXT.md, `resolveDiscovery` called with cwd = that worktree, assert skip-and-advance fires and stage moves without a model call |
| D2 verify-overwrite guard | Low — isolated conditional, single call site | Test: clear verdict + already-real `work.verify` → unchanged; clear verdict + placeholder/empty `work.verify` → `verdict.verify` used, matching today's behavior |
| RUL19 sweep behavior for items with no worktree and no merged content | Low — must stay unchanged (fail open to real judge) | Existing sweep tests continue passing; `resolveContentRoot`'s fallback branch is exactly today's `repoRoot`, same as before this fix |

## Assumptions (unproven, flagged for fgos-coding-validating)

- `process.cwd()` at the time `resolveDiscovery`/`resolveDecompose` run
  during a real interactive session is reliably the item's own `fgw/<id>`
  worktree — true for every call site observed in this session's own
  history (fgos-coding-exploring/fgos-coding-planning/pick's own worktree-switch flow),
  not independently proven for every possible caller shape.
- `git worktree list --porcelain`'s branch-name field is stable/parseable
  the same way across the git version(s) this repo runs on — not verified
  against a specific git version floor.

## Proof surface

Verify command for this item as a whole (no split):

```
node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs
```

Narrow, matches the two touched source files exactly (same pattern
`tsk-5e97` locked: a real, already-passing, file-scoped command — never
the full `npm test` suite, which is what this item's own D1/D2 fix exists
to stop `fgos discover` from silently substituting in its place).
