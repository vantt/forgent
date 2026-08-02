# tsk-3o3: /fgOS:retro-loop — plan.md

## Mode

**small** — a few files, no gray areas (CONTEXT.md already resolved the
one live product question, D1).

Flag count: 0 of the mode-gate flags apply.
- auth / authorization: no — no auth surface touched.
- data model: no — reuses the existing `delivered/retrospective/cleanup`
  status chain and its verbs (`fgos retrospective`, `fgos move`) as-is; no
  schema/FSM change.
- audit/security: no.
- external systems: no.
- public contracts: no — new skill files are additive (`retro-next`,
  `retro-loop`); no existing CLI verb or skill contract changes shape.
- cross-platform: no.
- existing covered behavior: no — every touched surface is either a new
  file or a prose-only doc fix (`fgos-compounding/SKILL.md`); no existing
  *code* symbol is modified, so nothing already under test coverage is at
  risk.
- weak proof around the area: no — impact-analysis posture is **full**
  (GitNexus present, verified `docs/history/fgos-retro-loop/CONTEXT.md`),
  though see the impact-analysis note below: nothing here is an edit to
  an *existing* code symbol, so there is nothing to run `impact()` against.
- multi-domain: no — single domain (`coding`, fgOS's own tooling).

## Approach

Mirror `tsk-dvc`'s (cleanup-loop) shape exactly, substituting the
retrospective half of the chain, per CONTEXT.md's locked scope and D1:

1. `src/state/retro-pool.mjs` — pure picker (no fs, no direct `.fgos/`
   read), modeled 1:1 on `src/state/cleanup-pool.mjs`'s shape:
   `isCandidate(item)` → `item.status === 'retrospective'`, FIFO by the
   item's own `delivered -> retrospective` entry timestamp (mirrors
   `cleanup-pool.mjs`'s `latestCleanupEntry` helper, just matching
   `to: 'retrospective'` instead of `to: 'cleanup'`), returns `{id}` or
   `null`.
2. `plugins/fgOS/skills/retro-next/SKILL.md` — single item: **first**
   runs `fgos retrospective --dir "$root"` (the sweep — D1, cheap and
   idempotent, run every call so the pool is never stale), **then** picks
   via `pickNextRetrospectiveItem`, **then** invokes `fgos-compounding`
   on the picked id (the actual synthesis: settlement/decision/
   enduser-docs), **then** on success runs `fgos move <id> --to cleanup
   --dir "$root"`. Classify/report the same way `cleanup-next`/
   `discover-next` already do (exit-code based: success / lock-timeout /
   per-item conflict-or-error).
3. `plugins/fgOS/skills/retro-loop/SKILL.md` — wraps the built-in `/loop`
   skill around `retro-next`, same recursion precedent
   (`docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`).
   Stop rules **follow `discover-loop`'s shape, not `cleanup-loop`'s**:
   pool-empty, lock-timeout, **and an iteration cap** — because
   `retro-next`'s own per-item step (`fgos-compounding`) is real LLM
   judgment, the same cost profile `discover-loop`'s cap-of-15 exists to
   bound, unlike `cleanup-next`'s purely mechanical TTL/content/merge
   check (no cap needed there). Default cap: **15**, same number
   `discover-loop` already uses, user-overridable from their own
   invocation wording — no new number to justify separately.
   Per-item-blocked-twice-in-a-row is *not* a separate stop condition
   here: `fgos-compounding` either succeeds (tag stored, doc written) or
   the session running it gets stuck mid-flow, which is a real-session
   failure, not a clean "blocked" verdict the way `cleanup`'s harness
   produces one — so a failed `retro-next` iteration is reported the same
   way `cleanup-next`/`discover-next` report a per-item conflict/error:
   skipped, loop continues, never a stop condition on its own (only
   lock-timeout and the iteration cap stop the whole loop).
4. `.claude/skills/fgos-compounding/SKILL.md` — fix the stale trigger
   description. Currently (frontmatter + step 1) says the skill "Use[s]
   once a claimed item's stage reads `compound-learn`" and "this step
   only runs once the item is already at stage `compound-learn`" — but
   that stage is retired (D11, `src/state/workflow-stage-graphs.mjs:
   25-28,48-49,80-81`) and the real trigger, since `tsk-1zi`, is status
   `retrospective`, "driven by the retrospective loop" — i.e. by
   `retro-next`, the first real caller under the new trigger. In scope
   here because `retro-next` is what actually wires the call; leaving the
   doc stale would make the one skill this item depends on describe the
   wrong invocation condition to the next reader.

### Impact-analysis note

`fgos tool query --capability impact-analysis --status present` →
GitNexus present, posture **full** (recorded in CONTEXT.md). The MUST-run
rule applies to editing "any symbol" (function/class/method) — every file
in this plan is either brand new (`retro-pool.mjs`, both new `SKILL.md`
files) or a prose-only doc correction (`fgos-compounding/SKILL.md`, no
code symbol touched). There is no existing symbol being modified, so
there is nothing to run `impact({target, direction: "upstream"})` against
for this item. Noted explicitly per the full posture's own bar, rather
than silently skipping it.

### Risk map

| Component | Risk | Proof point (fgos-validating) |
|---|---|---|
| `retro-pool.mjs` | low — near-identical port of `cleanup-pool.mjs`'s already-proven shape | `test/state/retro-pool.test.mjs`: candidate filter (`status==='retrospective'` only), FIFO ordering by entry timestamp, `null` on empty pool |
| `retro-next` SKILL.md | medium — the actual wiring: sweep-then-pick-then-synthesize-then-move, and the first real caller of `fgos-compounding` under its new status-based trigger | structural check: `test -f plugins/fgOS/skills/retro-next/SKILL.md && grep -q "fgos retrospective" ... && grep -q "fgos-compounding" ... && grep -q "retro-pool" ...` (same shape `tsk-3go-3`'s verify already used for `discover-loop`) |
| `retro-loop` SKILL.md | low-medium — same recursion pattern as three already-shipped siblings | `test -f plugins/fgOS/skills/retro-loop/SKILL.md && grep -q retro-next ...` |
| `fgos-compounding/SKILL.md` fix | low — prose correction only | grep confirms the trigger text now reads status `retrospective`, not stage `compound-learn` |

No medium/high item here needs more than a structural/grep proof —
`fgos-planning`'s own precedent (`tsk-3go-3`, `tsk-dvc`) already treats
skill-file wiring as verified by presence + keyword grep, since the skill
files are prose orchestration read by a future session, not executable
code with a meaningful unit-test surface of their own.

## Files touched

- `src/state/retro-pool.mjs` (new)
- `test/state/retro-pool.test.mjs` (new)
- `plugins/fgOS/skills/retro-next/SKILL.md` (new)
- `plugins/fgOS/skills/retro-loop/SKILL.md` (new)
- `.claude/skills/fgos-compounding/SKILL.md` (edit — trigger wording only)

## Order

1. `retro-pool.mjs` + its test (foundation; nothing else can be built or
   proven against without it).
2. `retro-next` SKILL.md (depends on the picker existing).
3. `retro-loop` SKILL.md (depends on `retro-next` existing to wrap).
4. `fgos-compounding/SKILL.md` doc fix (independent of 1-3, but sequenced
   last since it's the smallest, lowest-risk piece and benefits from
   `retro-next`'s finished wiring being the concrete reference for what
   the corrected trigger text should say).

`fgos graph --json` was run for ordering context: `tsk-3o3` is not on the
repo's global critical path (`criticalPath.path` does not include it) and
appears in `topUnblock` with `unblocks: 1`. That ranking is about which
*item* to work on repo-wide, not internal step order — this item is one
honest piece of work (see Split, below), so internal ordering above is
governed by the files' own build dependency (picker before wrapper before
outer loop), not the graph tool.

## Split

None. One honest piece — `retro-pool.mjs`, `retro-next`, `retro-loop`,
and the `fgos-compounding` doc fix are tightly coupled (each of the first
three depends on the previous existing; the doc fix only makes sense once
`retro-next`'s real invocation shape is settled) and match the size class
(`small`) that does not call for a split. No child items created.

## Assumptions

- `fgos-compounding`'s actual *runtime* logic already reads status
  `retrospective` correctly (only its doc *text* is stale) — CONTEXT.md's
  scout evidence traced this to `workflow-stage-graphs.mjs`'s own
  retirement of the `compound-learn` stage, not to the skill's own
  step-by-step instructions (which never branch on stage/status
  programmatically — they're prose read by whichever session runs them).
  If `fgos-validating` finds the skill's *actual steps* (not just its
  frontmatter) still assume a `compound-learn`-stage precondition that no
  longer holds, that is new evidence changing this plan, not an unproven
  assumption to carry forward silently.
