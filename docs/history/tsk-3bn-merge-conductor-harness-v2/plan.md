# plan.md: tsk-3bn — Merge Conductor Harness v2

## Mode gate

Flags counted against CONTEXT.md's locked scope (D1: drift + sync-root +
merge-set clustering + mergeTier + mergeAfter):

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | **yes** | new `mergeAfter` field on every work item (D4/D5), new `waits-for` edge kind in `dep-graph.mjs` |
| audit/security | **yes** | `sync-root` performs a real `git merge` into `main`/a parent branch — the exact operation whose ungoverned form caused tsk-3bn's own origin incident |
| external systems | no | — |
| public contracts | **yes** | `mergeReadiness`'s return shape gains `mergeSets`/`mergeTier`/`blocked-on-sync` (consumed by `merge-list`/`merge-next` skills); new CLI surface (`sync-root`, `edit --merge-after`) |
| cross-platform | no | — |
| existing covered behavior | **yes** | extends `mergeReadiness` (`graph-harness.mjs`), already exercised by `merge next`/`merge list` and covered by `test/state/graph-harness.test.mjs` |
| weak proof around the area | **yes** | D2's named risk: merge-set clustering has exactly 1 real incident (tsk-3bn itself) to validate against |
| multi-domain | no | — |

**5 flags, including a hard-gate flag (audit/security)** → **high-risk**.
A smaller mode would not honestly cover this: the audit/security flag
alone (a real-git-merge-into-main action) already forces high-risk
regardless of count, and the count independently clears the 4+ threshold.

## Approach

### Split resolved (CONTEXT.md's deferred question, decided here)

Three children under `tsk-3bn` as root (`parent: tsk-3bn` each), matching
the design report's own filing suggestion, refined by D4's file-boundary
reasoning:

1. **drift-detection** — `driftStatus(repoRoot, view)`, a NEW FILE
   (`src/state/drift-status.mjs`), not a `graph-harness.mjs` export.
   `graph-harness.mjs`'s own header declares itself PURE ("no fs, no
   Date.now(), no event append, no mutation... same read-only discipline
   as impact.mjs/graph-metrics.mjs") — `driftStatus` shells real git
   subprocesses (`merge-base --is-ancestor`, `rev-list --left-right
   --count`), which breaks that invariant and its testing story. This
   resolves CONTEXT.md's "exact file placement" open question: separate
   file, per the design report's own stated reason, now confirmed against
   the actual purity contract in code.
2. **sync-root action** — Layer 2, `bin/fgos.mjs` (new verb case,
   mirroring `approve`'s dispatch pattern) + `src/runner/merge.mjs`
   (actual merge execution, same layer `mergeRunnerItem` already lives
   in). Consumes drift-detection's output (per D-locked design: "never
   invents its own drift check") — depends on piece 1.
3. **merge-set clustering + mergeTier + mergeAfter** — extends
   `src/state/graph-harness.mjs`'s `mergeReadiness` (`mergeSets`,
   `blocked-on-sync`, `mergeTier` per D7's rename) + `src/state/
   dep-graph.mjs` (new `waits-for` edge kind, extends
   `buildUnifiedAdjacency`/`buildUnifiedEdges`/`assertNoUnifiedCycle`
   per D5) + `src/state/work.mjs` (`mergeAfter` field: existence check
   mirroring `validateDeps`, self-reference guard) + `bin/fgos.mjs`'s
   `edit` verb (`--merge-after` flag, `parseListFlag`-based like `--deps`).
   `blocked-on-sync` needs drift-detection's output — depends on piece 1.
   Bundled together (not split further) because D4 deliberately kept
   `mergeAfter` living in the same file/PR as the clustering extension it
   piggybacks on (`waiting` gate), per D4's own "kept minimal" reasoning.

`tsk-3bn` itself stays the root: no code of its own beyond what the
children land, `verify: npm test` (already set by `discover`) becomes the
root-level "prove the whole harness works together" check — matching the
locked §G table's own root-to-main row (full suite), a natural fit since
`tsk-3bn` IS the root-to-main case in this design.

### Order (per `fgos graph --json`'s criticalPath/topUnblock)

`fgos graph --what-if` needs existing ids, so it cannot rank not-yet-filed
children directly — order instead follows the one real dependency the
locked design states explicitly (§C/§B: sync-root "consumes driftStatus's
output... never invents its own drift check"; clustering's
`blocked-on-sync` needs the same): **drift-detection first**, then
**sync-root** and **clustering+mergeTier+mergeAfter** in parallel (no
stated dependency between them — sync-root doesn't need mergeSets, and
clustering doesn't need sync-root to exist, only drift's read-only
output). `tsk-3bn`'s own current `topUnblock` entry (`unblocks: 3,
newlyUnblocks: 4` from the earlier graph read) reflects its real
downstream fan-out (`tsk-2ie`, `tsk-3gx`, and others reachable through
them) — completing the root unblocks that work regardless of internal
child order, so this doesn't change the internal ordering call.

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `driftStatus` git subprocess calls | medium — wrong ahead/behind math silently mis-reports drift | test against a real git fixture repo with a deliberately-diverged branch (mirrors the actual tsk-3bn incident shape) |
| `sync-root` action | **high** — mutates `main`/a parent branch; a bug here recreates the exact incident this item exists to prevent | must run through the SAME lock/verify path `approve` already uses (no second, untested mutation path); test both nested-target (`fgw/parent`) and `main`-target cases |
| `mergeSets` clustering (permissive default, D2) | high — named, accepted risk (only 1 real incident to validate against) | test the auto-serialize path AND its escalation fallback (re-check-still-conflicts case) explicitly, not just the happy path |
| `mergeAfter`/`waits-for` cycle validation | medium — a missed mixed-cycle case (deps+mergeAfter+parent together) reproduces the exact deadlock class D5 exists to prevent | test a cycle that spans `deps` AND `mergeAfter` together (not just a same-field cycle), since `assertNoUnifiedCycle`'s whole point is catching mixed cycles |
| `mergeTier` naming (D7) | low — already resolved before code exists | none needed beyond a straightforward field-name check in review |

Impact-analysis posture (`CLAUDE.md` gate,
`fgos tool query --capability impact-analysis --status present` — GitNexus
`present`): **full**. Per `CLAUDE.md`'s Always-Do rules, `impact()` must be
run on `mergeReadiness`, `mergeRunnerItem`/the `approve` dispatch case,
and `assertNoUnifiedCycle` before any of the 3 children edit them — the
proof points above are not a substitute for that per-symbol check at
execute time.

### Concrete cases to prove (high-risk depth)

- Empty/boundary: no roots have drifted (drift-detection returns empty);
  a root with zero children (sync-root on a leaf-only item, should be a
  no-op or reject cleanly).
- Existing behavior must not regress: `mergeReadiness`'s current
  `ready`/`waiting`/`conflicts` shape and values stay byte-identical for
  any view with no `mergeAfter` set and no drift — `mergeSets`/
  `blocked-on-sync`/`mergeTier` are additive, per the locked design's own
  "no signature change to existing callers' happy path" clause.
- Concurrent access: two roots drifting independently; `sync-root` on one
  must not touch the other's state (isolation, not just correctness).
- Partial failure: `sync-root`'s git merge itself conflicts — must
  surface as a real escalation (§H.5-style), never a silent partial merge.

## Split — child items (reconciled with engine's `judgeDecompose`, D8)

`fgos plan tsk-3bn` returned `need-human`: the engine's own
independent judgment (reading only the item's title/description/refs, no
visibility into `CONTEXT.md`/this file) proposed a 3-child split covering
`sync-root` / drift-detection wired into `fgos doctor` / a close-out
guard — none of which mention clustering/`mergeTier`/`mergeAfter` at all,
since the engine never sees the locked D1-D7 chain. Presented to the
user as a real fork (keep the engine's shape, keep this plan's shape, or
merge both). User chose **merge both — 4 children**. The engine caught a
real, independent gap this plan had missed: AGENTS.md's install/setup/
doctor gate ("any new capability with an infra dependency must register
into `fgos doctor`'s check registry... not stand alone, undiscoverable by
doctor") — drift-detection is exactly such a capability and this plan's
original child 1 never wired it in. Folded into child 1 below.

Each carries `parent: tsk-3bn`.

1. **drift-detection** (engine-caught doctor-wiring folded in)
   Title: `driftStatus(repoRoot, view) + fgos doctor wiring: read-only ahead/behind drift check per root branch, registered in src/setup/checks.mjs`
   Verify: `node --test test/state/drift-status.test.mjs`
   `deps: []`
   Footprint: `src/state/drift-status.mjs`, `src/setup/checks.mjs`

2. **sync-root action**
   Title: `fgos sync-root <root-id>: merge a root branch's tip into its target without changing item status/stage`
   Verify: `node --test test/runner/merge.test.mjs`
   `deps: [<drift-detection child id>]`
   Footprint: `bin/fgos.mjs`, `src/runner/merge.mjs`

3. **close-out guard** (from the engine's own proposal — real, not in either canonical report, but directly closes tsk-3bn's own origin incident)
   Title: `Wire drift check into root/milestone close-out: warn/block approving or closing a decomposed root (or a milestone targeting its children) when fgw/<root> still has commits unreachable from main; update docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md to point at the real verbs instead of the manual trap note`
   Verify: `npm test`
   `deps: [<drift-detection child id>]`
   Footprint: `bin/fgos.mjs`, `docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`

4. **merge-set clustering + mergeTier + mergeAfter** (this plan's own D1-D7 work, unchanged)
   Title: `mergeReadiness v2: merge-set clustering, blocked-on-sync, mergeTier, and the mergeAfter (waits-for) edge`
   Verify: `node --test test/state/graph-harness.test.mjs test/state/dep-graph.test.mjs test/state/work.test.mjs`
   `deps: [<drift-detection child id>]`
   Footprint: `src/state/graph-harness.mjs`, `src/state/dep-graph.mjs`, `src/state/work.mjs`, `bin/fgos.mjs`

Filed: `tsk-5m7` (drift-detection), `tsk-50i` (sync-root, deps: `tsk-5m7`),
`tsk-62y` (close-out guard, deps: `tsk-5m7`), `tsk-2u0` (clustering +
mergeTier + mergeAfter, deps: `tsk-5m7`). `tsk-2ie`/`tsk-3gx` (D6's
dependents) retargeted from `tsk-3bn` to `tsk-2u0` specifically, now that
the real child holding their needed capability exists.

## Assumptions

- `driftStatus`'s git subprocess calls run from the real main checkout
  (per this item's own origin incident and ADR0020) — never from a
  dispatch worktree's ephemeral path. Not proven here; `fgos-coding-validating`
  should check this explicitly given it's exactly the class of bug this
  item exists to close.
- The `deps-chain`/`waiting`-vs-`mergeSets` structural question
  (CONTEXT.md's last outstanding item) resolves as: `deps-chain` items
  stay conceptually in the existing `waiting` bucket, with `mergeSets`
  reserved for the NEW footprint-overlap/shared-root ordering cases that
  today get dropped from `ready` entirely — this is the reading that
  keeps `mergeAfter`'s D4 design (extends `waiting`) consistent without
  requiring a matching change to how `deps-chain` behaves. Flagged as an
  assumption, not re-litigated with the user — implementation-shape,
  within this planning session's own authority per CONTEXT.md's own
  deferral.
