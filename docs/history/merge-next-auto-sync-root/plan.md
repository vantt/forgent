# Plan: tsk-173 — merge-next auto sync-root on blockedOnSync

## Mode

**high-risk.** Flags counted against `CONTEXT.md`'s locked scope (D1/D2):

| Flag | Applies? | Why |
|---|---|---|
| audit/security | **yes** | this reuses `sync-root`, which performs a real `git merge` into `main` — the exact operation whose ungoverned form caused tsk-3bn's origin incident (tsk-50i's own plan.md flags it `audit/security: yes` for the same reason; this item automates *calling* that same verb, same blast radius) |
| public contracts | **yes** | `merge next`'s JSON return shape gains a new `syncRoot` field; `/fgOS:merge-next`/`/fgOS:merge-loop` SKILL.md's own documented outcome shapes change |
| existing covered behavior | **yes** | extends `mergeReadiness` (`src/state/graph-harness.mjs`) and the `merge next` CLI case (`bin/fgos.mjs`), both under existing test coverage with real regression exposure |
| weak proof around the area | **yes** | item's own `verify` field reads "chưa xác định — P15 bổ sung" (not yet determined) |
| multi-domain / auth / authz / data model / external systems / cross-platform | no | none apply |

4 flags, and `audit/security` alone is a hard-gate flag — high-risk regardless of count. A smaller mode would not honestly cover the git-mutation blast radius this item adds to an unattended path (`/fgOS:merge-loop`).

## Approach

Reuse everything that already exists; add exactly one new branch to `merge next`, one ordering fix to `mergeReadiness`, and two skill-doc updates.

- **`resolveRoot`** (`src/runner/root-affinity.mjs`) is already imported in `bin/fgos.mjs:59` — no new import needed. For a root item (no `parent`), it resolves to itself; for a leaf item, it walks up to the owning root. Verified directly: `tsk-5q5` (today's live blockedOnSync case) has no `parent`, so `resolveRoot(view, 'tsk-5q5') === 'tsk-5q5'` — the same id `sync-root` expects as its `root-id` argument, in both the root-blocked and leaf-blocked case.
- **`mergeReadiness`'s `blockedOnSync` bucket** (`src/state/graph-harness.mjs:116-121`) is currently pushed in raw candidate-iteration order (object-key order), unlike every other bucket (`ready`/`mergeSets`/`supersededOut`), which is already passed through the file's own `orderByRank` closure. D2 ("top-ranked blockedOnSync root, same rankImpact order `ready` already uses") is only well-defined once this ordering exists — today it's accidental (only 1 blockedOnSync candidate exists live), not guaranteed. Fix: wrap `blockedOnSync` in `orderByRank` before returning, matching the file's own established pattern. This is a pure additive ordering change — assumption, not asked back to `fgos-coding-exploring`: it doesn't change which items are members of the bucket, only the order, and CONTEXT.md's D2 already specifies the ordering rule this fix realizes.
- **`merge next`'s new branch** (`bin/fgos.mjs`, inside the existing `case 'next':`): when `ready.length === 0` and `blockedOnSync.length > 0`, resolve the top-ranked blockedOnSync id's root via `resolveRoot`, then call `sync-root` the same way this case already calls `approve` — recursively through `runVerb('sync-root', flags, [rootId], dir)` (D6's own "no parallel merge mechanism" contract, extended rather than broken). Branch on the outcome:
  - `outcome: 'synced'` — re-read `listWork`/`driftStatus`/`mergeReadiness` fresh (git state changed), and if something is now `ready`, fall straight into the existing `approve` path for that id, reporting `syncRoot: {id: rootId, outcome: 'synced'}` alongside. If still nothing is ready (e.g. a footprint conflict newly surfaced, or a different root still drifted), report `{picked: null, reason: 'nothing ready to merge', syncRoot: {...}}` — safe to collide with the plain "nothing ready" shape here: nothing went wrong, `sync-root`'s own decision-log line already records the mutation for audit, and no human action is owed.
  - `outcome: 'blocked'` (`merge-conflict` / `fgos-write-rejected` / `verify-fail`) — report `{picked: rootId, syncRoot: syncResult, blocked: syncResult.reason}`. **Never `picked: null` here** (validated 2026-08-03, `fgos-coding-validating`: `plugins/fgOS/skills/merge-loop/SKILL.md` step 4's actual stop-rule table treats every `picked: null` as the single "frontier empty, stop cleanly, nothing to report as a problem" case — a real merge-conflict on `sync-root` reported as `picked: null` would be silently swallowed as if nothing happened, the exact class of invisibility this item exists to fix, one level down). Setting `picked: rootId` instead lands this in merge-loop's *existing* "a blocked pick" bucket (`{picked: <id>, approve: {blocked, reason}}` or `{picked: <id>, blocked: "iron-law"}` — same-id-blocked-twice-in-a-row logic already built for exactly this shape). No retry, no fallback to a different blockedOnSync candidate (D2).
  - Iron Law throw (`sync-root`'s own gate, same as `approve`'s) — caught the same way the existing Iron Law catch already handles `approve`, reported as `{picked: rootId, blocked: 'iron-law', syncRoot: {message: err.message}}` — the exact top-level `{picked: <id>, blocked: "iron-law", ...}` shape merge-loop's Iron Law bullet already recognizes (never auto-acknowledges, needs a real human — same standing rule `approve`'s own Iron Law path already holds).
- **Skill docs**: `/fgOS:merge-next` SKILL.md gains one more outcome shape to relay (`syncRoot` alongside `picked`/`blocked`). `/fgOS:merge-loop` SKILL.md needs exactly one small widening, not a new stop-rule row: step 4's "a blocked pick" bullet currently recognizes `{picked, approve: {blocked, reason}}` or `{picked, blocked: "iron-law"}` — it must also recognize `{picked, blocked: <reason>, syncRoot: {...}}` (no `approve` field present) as the same bucket, so the existing same-id-blocked-twice-in-a-row stop applies to a blocked `sync-root` attempt exactly as it already does to a blocked `approve` attempt. A `synced` outcome that still lands on "nothing ready" needs no doc change — it already matches the existing frontier-empty bullet verbatim.

`impact-analysis` posture: **full** (`gitnexus`, `present` — confirmed this session). `fgos-coding-implement` must run real `impact()` on `mergeReadiness`, the `merge` case in `bin/fgos.mjs`, and `sync-root` before editing any of them, per the repo's own gate — this plan's proof points below assume that check runs, not substitute for it.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `merge next` auto-sync-root branch (`bin/fgos.mjs`) | **high** — mutates `main` via a real, unattended `git merge`; wrong root resolution would merge the wrong branch | CLI tests covering all 4 `sync-root` outcomes reached *through* `merge next` (not just direct `sync-root` calls, which `test/cli/fgos.test.mjs:5287+` already covers): happy path (drifted root syncs, then the now-ready item merges), merge-conflict (root stays blocked, `main` unchanged, `ready` still empty), Iron Law trip (stays blocked, no auto-ack attempted), `verify-fail`. Reuse the existing `makeDriftedRoot` test helper (`test/cli/fgos.test.mjs`) rather than a new fixture. |
| `blockedOnSync` ordering fix (`graph-harness.mjs`) | low — pure function, additive ordering only, same pattern the file already uses 3x | unit test in `test/state/graph-harness.test.mjs`: 2 blockedOnSync candidates with different `rankImpact` scores, assert output order matches `ready`'s own ordering rule |
| existing `merge next`/`approve`/`sync-root` callers (regression) | medium | full existing suite (`node --test test/cli/fgos.test.mjs test/state/graph-harness.test.mjs`) — every existing case has an empty `blockedOnSync` (today's default for a non-drifted item), so this must stay byte-identical: zero behavior change when nothing is drifted |
| `/fgOS:merge-loop` stop-rule coverage for the new outcome | medium — an unhandled/misshapen outcome could get silently swallowed as "frontier empty" instead of stopping and reporting a real problem | traced the skill's own stop-rule table by hand against every new outcome shape (`fgos-coding-validating`, 2026-08-03) — found and fixed exactly this: the original design's `picked: null` on a blocked sync collided with the existing frontier-empty bullet; redesigned to `picked: rootId` so it lands in the existing "blocked pick" bucket instead (see Approach) |

## Files touched

1. `src/state/graph-harness.mjs` — `blockedOnSync` ordering via `orderByRank` (existing closure, no new logic)
2. `bin/fgos.mjs` — `merge next` case, new auto-sync-root branch (reuses `resolveRoot`, already imported; reuses `runVerb('sync-root', ...)`, the same recursive-call shape `approve` already uses)
3. `test/state/graph-harness.test.mjs` — ordering unit test
4. `test/cli/fgos.test.mjs` — `merge next` auto-sync-root outcome tests (happy/conflict/iron-law/verify-fail)
5. `plugins/fgOS/skills/merge-next/SKILL.md` — relay the new `syncRoot` field
6. `plugins/fgOS/skills/merge-loop/SKILL.md` — widen step 4's existing "a blocked pick" bullet to also recognize `{picked, blocked, syncRoot}` (no new stop-rule row; reuses the existing same-id-blocked-twice-in-a-row logic)

## Order

`fgos graph --json` shows this item as an isolated single-item component (no dependents in the current graph) — no `--what-if` split comparison needed since this item does not split (see below). Internal build order:

1. `graph-harness.mjs` ordering fix + its unit test — foundation; `merge next`'s new branch depends on `blockedOnSync` actually being rank-ordered for D2's "top-ranked" contract to mean anything once more than one root drifts.
2. `bin/fgos.mjs` auto-sync-root branch + its CLI tests — the real feature.
3. Skill doc updates (`merge-next`, `merge-loop`) — depend on the final outcome shape settled in step 2.

## Split decision

No split. This is one cohesive change: every piece (ordering fix, CLI branch, skill docs) exists solely to deliver "merge next auto-remediates a clean blockedOnSync case" as a single, indivisible feature — splitting it would leave an intermediate item shipping half a contract (e.g. the ordering fix alone has no product value without the branch that consumes it).

## Assumptions

- `blockedOnSync` ordering via `orderByRank` is a pure implementation detail consistent with the file's existing pattern (`ready`/`mergeSets`/`supersededOut` all already use it) — not re-litigated with `fgos-coding-exploring`, since CONTEXT.md's D2 already specifies the ordering rule this realizes; it was silent only on the *mechanism*, not the *behavior*.
- `resolveRoot(view, blockedId)` is the correct root-id argument for `sync-root` in both the root-blocked and leaf-blocked case — verified directly against `root-affinity.mjs`'s own docstring and against the live `tsk-5q5` case (a root with no `parent` resolves to itself).

## Verify

`node --test test/cli/fgos.test.mjs test/state/graph-harness.test.mjs`
