# Plan: render effective stage on every read surface

**Item:** tsk-4zj
**Mode:** standard (2 flags: public-contracts, existing-covered-behavior — see `fgos-routing`'s Orient handoff)
**Decisions:** `docs/history/read-surface-effective-stage/CONTEXT.md` (D1-D4)

## Approach

Add one small pure helper next to `stageForStep`/`getDomain` in
`src/state/workflow-stage-graphs.mjs` (D1: this is a read-only derivation,
same module that already owns every other stage-lookup helper — `stage-
fsm.mjs`/`frontier.mjs`/`impact.mjs` already inline this exact expression
in three places, so centralizing it here is consolidation, not new
surface):

```js
export function effectiveStage(item, domain) {
  return item.stage ?? stageForStep(domain, 'Execute');
}
```

`bin/fgos.mjs` imports it and attaches a new `stageEffective` field (D4)
to every work-item-shaped object it emits, for both `--json` and the
human table. `item.stage` itself is never read, written, or defaulted
anywhere in `store.mjs`/`replay.mjs` — nothing there changes (D1), so
`test/state/frontier.test.mjs:205` and `test/state/backward-compat.
test.mjs:277` (both cited in CONTEXT.md's scout evidence) keep passing
unmodified: they exercise `store.mjs`/`replay.mjs`, and this change never
touches those files.

**Alternative rejected:** inject `stageEffective` inside `listWork()`/
`rebuildView()` itself, so every caller gets it automatically. Rejected
per D1 — that is exactly the storage/view layer the two locked tests pin,
and `listWork()` is also called internally by `resolveDecompose`/
`resolveDiscovery`/`claimWork` (not just CLI read verbs), so mutating its
return shape risks feeding a synthetic field into engine logic that was
never designed to see it. The CLI print layer is the correct boundary.

**Alternative rejected:** overload `stage` itself at print time (fill it
in with a formatted string when absent). Rejected per D4 — breaks any
future `item.stage === 'executing'` equality check and mixes types across
explicit/default cases.

### Risk map

| Component | Risk | Proof point (fgos-validating) |
|---|---|---|
| `effectiveStage()` helper itself | light | Unit test in `test/state/workflow-stage-graphs.test.mjs`: explicit stage returned as-is; absent stage on `coding` domain resolves to `'executing'`; mirrors the existing inline pattern in `frontier.mjs`/`stage-fsm.mjs` so no new logic is actually introduced, only consolidated. |
| Wiring into `bin/fgos.mjs`'s 10 read-verb case handlers (`list`, `show`, `ready`, `triage`, `rollup`, `graph`, `stale`, `conflicts`, `merge`, `check`) | medium | CLI test asserts `stageEffective` present (and correct) in the JSON output of every one of the 10 verbs, for both a stage-absent item and a stage-explicit item. Medium because it is 10 separate call sites in one large file — a missed site is the realistic failure mode, not a logic bug. |
| Preserving the two locked "stage absent" tests | medium | `test/state/frontier.test.mjs:205` and `test/state/backward-compat.test.mjs:277` must pass unmodified — by construction (D1: no edit to `store.mjs`/`replay.mjs`), but `npm test` is the actual proof, not just the construction argument. |
| Human table renderer (`fgos list`, no `--json`) | light | Small CLI test: a stage-absent item's table row shows `<value> (default)`; a stage-explicit item's row shows the plain value, no suffix. |
| External consumer (`herdr-plugin`, Rust, outside this repo) | light, accepted | `bin/fgos.mjs:1575`'s own comment confirms it reads `item.status` only, never `stage`/`stageEffective` — an additive JSON field is safe. No proof point needed inside this repo; out of scope per that same comment. |

**impact-analysis: degraded.** `fgos tool query --capability impact-
analysis --status present` reports GitNexus `present`, but `gitnexus
list_repos` shows this repo's index is 454 commits behind HEAD
(`251d0b5`) — too stale to trust for `stageForStep`/`getDomain`'s real
current blast radius. Cross-checked instead via `rg -n "stage"` during
`fgos-exploring`'s scout: 289 matches across 27 files, every consumer of
`item.stage` already tolerant of the same `?? default` pattern this fix
reuses (no consumer found that treats a bare, unprefixed `stage` read as
meaningfully different from this fix's `stageEffective` addition). No
signal of a breaking consumer; flagging the gap plainly rather than
asserting full confidence.

## Shape

One honest piece of work, not split (all 10 wiring sites live in the same
file, `bin/fgos.mjs`, so a split would just create sibling items with
overlapping footprints on that one file — the opposite of what splitting
is for).

Order (no `fgos graph --what-if` benefit here — tsk-4zj has no deps and
no children to unblock; ordering is purely implementation sequencing):

1. Add `effectiveStage()` to `workflow-stage-graphs.mjs` + its unit test
   (foundation, no dependents yet).
2. Wire into `list`'s `--id` and `--all` paths (`bin/fgos.mjs:1590-1654`)
   — highest-traffic verb, and the one the original ask centers on.
3. Wire into the remaining 9 verbs' case handlers.
4. Wire into the human table renderer.
5. CLI test coverage across all 10 verbs (explicit + default cases) +
   full `npm test` run as final proof.

### Concrete cases to prove

- Item with `stage` never set (created via `fgos add`, no `work.stage`
  event) → `stageEffective: 'executing'` in JSON, `'stage'` key still
  absent; table shows `executing (default)`.
- Item with `stage: 'clarify'` explicitly set → `stageEffective:
  'clarify'`; table shows plain `clarify`, no suffix.
- Item mid-transition (e.g. just landed on `decompose` via `work.stage`
  event) → `stageEffective` matches the new explicit value immediately,
  no stale read.
- `test/state/frontier.test.mjs:205` and `test/state/backward-compat.
  test.mjs:277` still pass unmodified (regression guard for D1).
- Every one of the 10 read verbs, not just `list` (regression guard for
  D2).
- Both `--json` and the bare table (`fgos list`) render the same
  effective-stage answer for the same item (regression guard for D3).

## Assumptions

- **A1:** `stageForStep(domain, 'Execute')` never returns `undefined` for
  the `coding` domain — confirmed by reading `DOMAINS.coding.stepMap`
  (`executing: 'Execute'`, `workflow-stage-graphs.mjs:64`) during this
  planning pass, not re-proven live here. `fgos-validating` should
  re-confirm this holds for whatever `coding`'s stepMap looks like at
  execution time.
- **A2:** the 10 verbs identified in `fgos-exploring`'s scout
  (`list`/`show`/`ready`/`triage`/`rollup`/`graph`/`stale`/`conflicts`/
  `merge`/`check`) are the complete set of read verbs that print a
  work-item-shaped object carrying `stage`. `fgos-validating` should grep
  `bin/fgos.mjs` for any other `case '...':` handler touching
  `rawView.work` (or a filtered subset of it) this scout may have missed.

## Proof surface (for the gate below)

`npm test` — the item's own verify command (D-locked in `fgos discover`'s
verdict) — is the single command that proves this plan done: it runs the
full state+cli+runner+e2e suite, including every new/changed test listed
above.
