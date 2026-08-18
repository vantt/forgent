# fgos-cleanup-loop — plan

Item: `tsk-dvc`. Decisions: `docs/history/fgos-cleanup-loop/CONTEXT.md`
(D1-D3, all locked).

## Mode

**Mode: small.**

Flag count against the mode-gate checklist: **0**.

- auth / authorization — no, no auth surface touched.
- data model — no, no schema/field change; reuses `cleanup-harness.mjs`'s
  existing exported checks and the item store's existing `status`/`stage`
  fields as-is.
- audit/security — no.
- external systems — no new one; the only subprocess involved (`git
  merge-base --is-ancestor`, inside `checkMergeStillResolves`) is already
  reused unchanged, not newly introduced.
- public contracts — no; `fgos cleanup <id>` and its harness contract are
  untouched. The two new skills are new surface, not a change to an
  existing one.
- cross-platform — no.
- existing covered behavior — no; both files this item builds on top of
  (`src/state/cleanup-harness.mjs`, `bin/fgos.mjs`'s `case 'cleanup'`)
  already have real test coverage (`test/state/cleanup-harness.test.mjs`)
  and are not modified.
- weak proof around the area — no; the closest precedent
  (`src/state/discover-pool.mjs`) has its own real test file
  (`test/state/discover-pool.test.mjs`) this item's own test mirrors.
- multi-domain — no; single area (`src/state/` + `plugins/fgOS/skills/`).

0 flags → tiny or small. Not **tiny**: this is four real files across two
different directories (a new pure module + its test + two skill files),
not "a couple of files, one direct task." **Small** fits: a few files, and
— per CONTEXT.md's own "Outstanding, explicitly deferred: None left open
at the decision-lock level" — no gray areas; D1-D3 already resolve the
only genuinely open product questions.

## Approach

Reuse `fgos cleanup <id>` and `cleanup-harness.mjs` exactly as they are
(CONTEXT.md's own scope boundary). The only new logic is a pure pool-picker
that decides *which* id to call that verb on and *whether* to call it at
all — mirroring `discover-pool.mjs`'s existing split between "pick" (pure,
no side effects) and "act" (the skill layer, which runs the real CLI verb).

Alternative rejected: fold the TTL pre-filter directly into
`cleanup-loop`'s own steps with no separate module or `cleanup-next` skill.
Rejected because it would duplicate `checkCleanupTTLElapsed`'s reading
logic inline in a markdown skill file instead of reusing the already-tested
export, and it would break the `-next`/`-loop` split every other pair in
this repo (`merge-next`/`merge-loop`, `discover-next`/`discover-loop`)
already establishes — a `-loop` skill that isn't a thin wrapper around a
`-next` skill would be the first exception to a real, repeated pattern
without a reason to be one.

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → GitNexus `present` →
posture **full** (same read `fgos-coding-exploring` already recorded in
CONTEXT.md). Binding below: the new module is additive-only (no existing
symbol is edited), so no upstream-impact run is owed before adding it;
`fgos-coding-implement` still owes a real `impact()` call before touching anything
inside `cleanup-harness.mjs` or `bin/fgos.mjs`'s `case 'cleanup'` should
either turn out to need a change during build (not expected — see Scope
boundary in CONTEXT.md — but the gate stays live regardless of plan intent).

### Files touched, in build order

1. **`src/state/cleanup-pool.mjs`** (new) — `pickNextCleanupItem(view,
   rawEvents, { ttlDays, now })`. Pure (no fs, no `.fgos/` read — same
   discipline `discover-pool.mjs`'s own header comment states for itself):
   - Filter `view.work` to `status === 'cleanup'`.
   - For each candidate, call the already-exported
     `checkCleanupTTLElapsed(rawEvents, id, { ttlDays, now })` from
     `cleanup-harness.mjs` (D1's own basis: same event this function reads
     — `work.move` with `payload.to === 'cleanup'`, `.at(-1)` — is the FIFO
     sort key below). Drop any candidate whose `.ok` is `false`.
   - Sort survivors ascending by that same `.at(-1)` event's `ts` (D1:
     FIFO, oldest cleanup-entry first).
   - Return `{ id }` of the first, or `null` if none survive.
   - Built first because both skill files below depend on it existing and
     already being correct — there is no other real ordering choice for a
     single non-split item.

2. **`test/state/cleanup-pool.test.mjs`** (new) — literal-view unit tests,
   same shape as `discover-pool.test.mjs`'s own `item()`-helper pattern.
   Concrete cases (mode-scaled: `small`, so the boundary/regression sketch
   stays short, not the fuller map a `high-risk` item would need):
   - empty pool → `null`.
   - a `status:cleanup` item with no `retrospective->cleanup` event in
     `rawEvents` at all → excluded (mirrors `checkCleanupTTLElapsed`'s own
     "never entered cleanup" `ok:false` branch).
   - a `status:cleanup` item whose TTL has not elapsed → excluded.
   - a `status:cleanup` item whose TTL has elapsed → picked.
   - two TTL-elapsed candidates → the one with the earlier
     `retrospective->cleanup` event timestamp wins (D1 FIFO).
   - a non-`cleanup`-status item (e.g. `status:doing`) → never picked,
     even with a stray matching event in `rawEvents`.
   - built immediately after the module, before either skill file, so the
     picker's own correctness is proven before anything wraps it.

3. **`plugins/fgOS/skills/cleanup-next/SKILL.md`** (new) — single-item
   skill, same shape as `discover-next/SKILL.md`:
   - Resolve `root` the same way every other fgOS skill does.
   - Run the picker via an inline `node -e` script importing `store.mjs`'s
     `listWork`/`readRawEvents` and `cleanup-pool.mjs`'s
     `pickNextCleanupItem`, reading `ttlDays` from shared config the same
     way `bin/fgos.mjs`'s own `case 'cleanup'` already does
     (`sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS`) so the
     picker's TTL window always matches what the verb itself will check.
   - `null` → report "pool empty — nothing to clean up" (mirrors
     `discover-next` step 3's pool-empty report verbatim in spirit).
   - Otherwise run `fgos cleanup <id> --dir "$root"` as a real subprocess
     (mirrors `discover-next` step 4 — capture stdout and the real exit
     code, never just stdout) and classify by exit code, reusing the same
     `EXIT_CODES` contract (`src/state/store.mjs:65-73`)
     `discover-next` step 5 already documents: `0` → read `data.to`
     (`'done'` or `'blocked'`, with `data.reason` when blocked); `7`
     (`lock-timeout`) → report as the one systemic condition; any other
     non-zero → scoped-to-this-item failure, report as skipped.
   - Built after the picker + its test so this skill can be written and
     manually sanity-checked against a picker already proven correct.

4. **`plugins/fgOS/skills/cleanup-loop/SKILL.md`** (new) — wraps `/loop`
   around `/fgOS:cleanup-next`, same recursion target and rationale
   `merge-loop`/`discover-loop` already establish and
   `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`
   documents (the built-in `loop` skill, dynamic self-pacing — never
   `ck-loop`). Stop rules, reading each iteration's report:
   - **pool empty** — stop cleanly (D3).
   - **`done`** — continue, increment a `cleaned` counter.
   - **`blocked`** (content-missing or merge-no-longer-resolves — TTL is
     never the reason here, the picker already excluded not-yet-ready
     items) — per **D2**, scoped to this one item: increment a `skipped`
     counter, continue to the next iteration. The blocked item stays
     visibly parked for a person to pick up later; the loop never stops
     for it.
   - **lock-timeout** — stop immediately (systemic, matches
     `discover-loop`'s own lock-timeout stop).
   - **any other scoped, non-lock-timeout failure** — increment `skipped`,
     continue (same "scoped to one item" framing D2 already covers).
   - **No iteration cap** (**D3**) — the only stop conditions are the four
     above; unlike `discover-loop`'s cap-of-15, there is no per-iteration
     LLM cost here to bound.
   - Final report: `cleaned` count, `skipped` count, and the stop reason
     named plainly (pool empty / lock-timeout), same reporting discipline
     `discover-loop` step 5 already uses.
   - Built last — it is a thin wrapper with no logic of its own beyond the
     stop-rule bookkeeping above; nothing here can be written correctly
     before `cleanup-next`'s own report shape (step 3) is fixed.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not name `tsk-dvc` in
either list — it has no dependents today, so no item-level ordering signal
applies here; the file-build order above is decided by the intra-item
dependency chain (module → its test → the skill that calls it → the skill
that wraps that skill), which is the only ordering question this plan
actually has.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `cleanup-pool.mjs` | low — pure function, same proven shape as `discover-pool.mjs` | `test/state/cleanup-pool.test.mjs`'s 6 cases above, run via `node --test test/state/cleanup-pool.test.mjs` |
| `cleanup-next` skill | low — thin CLI wrapper, exit-code classification already proven by `discover-next`'s own use of the same `EXIT_CODES` contract | manual dry run: pick an existing (or a locally-created throwaway) `status:cleanup` item and confirm the null/done/blocked paths report correctly |
| `cleanup-loop` skill | low — markdown-only, no logic beyond stop-rule bookkeeping already proven correct by `merge-loop`/`discover-loop`'s own live use | structural read against `merge-loop`/`discover-loop`'s SKILL.md shape (no automated harness exists for skill-markdown files in this repo) |

No proof point above is medium/high risk, so `fgos-coding-validating` has no
carried-forward proof obligation beyond running `cleanup-pool.test.mjs`
and the full `npm test` suite (AGENTS.md's own definition-of-done: "npm
test ... green; new or changed behavior gets a matching test").

## Assumptions

None carried forward as unproven — every genuinely open question
(pick order, block-handling, iteration cap) is already locked as D1-D3 in
`CONTEXT.md`. The items CONTEXT.md's own "Deferred to planning" section
left open (exact module path/name, `cleanup-next` as a real separate
skill, `node -e` invocation shape, no "waiting" count in the loop's
report, test shape) are all decided directly above, as this plan's own
implementation shape — none of them change scope, behavior, or acceptance
criteria, so none needed a hand-back to `fgos-coding-exploring`.

## Split

No split. One honest piece of work — four files, one clear build order,
zero gray areas. `parent` lineage not used; this item proceeds as itself.

## Verify

```
node --test test/state/cleanup-pool.test.mjs && npm test
```

The narrower run first (the only new automated test this item adds),
then the full suite per AGENTS.md's own DoD bar (state + cli + runner +
e2e). No new CLI/FSM surface exists for this item to add integration
tests against beyond what the unit test above already covers — the two
skill files are markdown, proven by the manual dry run in the risk map,
not by `npm test`.
