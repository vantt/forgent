# Research log — tsk-4w4

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** Are `.fgos/config.json`'s `runner.capacities.judge-discovery` and
`runner.capacities.judge-decompose` entries actually dead (no live code
path resolves or dispatches through them anymore), and if so, what is the
correct, previously-proven procedure to remove them from a live, shared
config file.

**Checked:**
- `src/intake/discovery.mjs:40-350` — `resolveDiscovery`'s own doc
  comment and body: the old `judgeDiscovery` nested `claude -p` subprocess
  fallback is explicitly retired (tsk-1x3 D1/D9/D16). Missing both a
  caller-supplied verdict and a locked `CONTEXT.md`, a `'runner'` role
  degrades to a safe no-op; any other role throws loudly. No branch left
  spawns a subprocess judge.
- `src/intake/plan.mjs:9-12,455-473,637-655` — same retirement pattern for
  `judgeDecompose`, same tsk-1x3-style reasoning ("that judgeDecompose is
  retired — same reasoning discovery.mjs's own [comment already gives]").
- `src/runner/dispatch.mjs:1240-1243` — `capacityIdForWork(work)` (the
  one function that auto-selects a capacity for a work item) returns
  `skillForStage(domainObj, 'executing')` — a **skill name** (e.g.
  `fgos-coding-implement`), never `'judge-discovery'`/`'judge-decompose'`.
  Nothing auto-resolves either capacity id for any real work item.
- `grep -rn "judge-discovery|judge-decompose" src/ bin/ test/ docs/`
  (whole repo) — every remaining hit is one of: (a) the two config entries
  themselves in `.fgos/config.json`, (b) comments/docs describing their
  retirement, or (c) `test/runner/dispatch.test.mjs` unit tests that build
  their OWN self-contained `cfg` fixture object using these names as
  realistic example capacity ids — none of those tests read the real,
  committed `.fgos/config.json`. Confirmed via
  `grep -rln "readFileSync.*config.json|\.fgos/config\.json" test/` cross-
  referenced against the judge-name grep: zero overlap. **No pinning test
  asserts the real config's `judge-discovery`/`judge-decompose` entries
  exist or have any particular shape.**
- `docs/explanation/coding-classify-intake-capacity-lifecycle-created-
  then-retired-as-dead-config.md` — direct precedent: an earlier orphaned
  capacity (`coding-classify-intake`/`submit-assist-classify`) went
  through the exact same shape (renamed, then its one consumer removed,
  then confirmed dead via the same `capacityIdForWork` non-resolution
  argument, then removed with explicit human sign-off). Its own "lesson"
  section: "a capacity's config entry and its consuming skill's dispatch
  branch are two independently-editable surfaces that can drift out of
  sync... dead config sitting in a live file until a third item went
  looking for it specifically" — exactly this item's situation.
- `docs/how-to/fix-fgos-write-rejected-merge-block.md` — the binding
  procedure for any `.fgos/config.json` edit: ADR0020 permanently blocks
  a `fgw/<id>` branch from carrying a `.fgos/` diff through `fgos
  approve`/merge (`fgos-write-rejected`). Two prior items,
  `tsk-4eu`/`tsk-5ge`, hit exactly this while touching `judge-decompose`'s
  own config shape — `tsk-5ge`'s entire job was "landed as a direct,
  single-parent commit on main, exactly like every other
  `.fgos/config.json` change in this repo's history." The doc's step 5
  also names the matching lesson for THIS item's own branch: narrow
  `verify` to something that does not depend on `.fgos/` surviving `fgos
  return`'s disposable detached re-verify worktree (which never carries
  `.fgos/` either, same ADR0020 exclusion) — `npm test` alone, not a
  command that reads `.fgos/config.json` content.

**Found:**
- Both `judge-discovery` and `judge-decompose` are confirmed **dead
  config** by the same direct-evidence standard the `coding-classify-
  intake` precedent used: zero remaining resolvers in `src`/`bin`, zero
  real (non-fixture) test dependence, and an explicit, already-landed
  decision (tsk-1x3/tsk-27y, Native-First Dispatch Doctrine) that retired
  the one mechanism that ever called them.
- The correct removal procedure is already fully proven in this repo's
  own history (`tsk-49u` for `coding-classify-intake`, `tsk-5ge` for a
  `judge-decompose` config move): the actual `.fgos/config.json` edit
  must land as a **direct, single-parent commit on the main checkout**,
  never through this item's own `fgw/tsk-4w4` branch. This item's own
  branch carries no code/config diff at all — its job is research, plan,
  and (per the how-to doc's step 5) a `verify` narrowed to `npm test`
  so `fgos return`'s detached-worktree re-verify can actually pass.
- No pinning test exists to rewrite (unlike `coding-classify-intake`,
  which had one) — this is a strictly simpler removal: delete the two
  keys from the committed `.fgos/config.json`, confirm `npm test` still
  passes against the edited main checkout, done.

**Verdict:** clear. Verify (narrowed per the how-to doc's own proven
lesson, since this item's branch carries no `.fgos/` diff): `npm test`.
