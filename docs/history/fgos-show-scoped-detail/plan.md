# Plan — fgos show (scoped single-task detail)

Item: tsk-2fw. See `CONTEXT.md` in this dir for locked decisions (D1, D2).

## Mode

**small.** Flag count against the mode-gate checklist: 0.

- auth — no. authorization — no. data model — no (reads existing
  per-item log shapes, no schema change). audit/security — no. external
  systems — no. public contracts — no (D1's decision doc explicitly
  keeps `list --id`'s existing behavior untouched; this only adds a new,
  additive verb/skill, nothing existing changes shape). cross-platform —
  no. existing covered behavior — no (nothing existing is touched).
  weak proof around the area — no more than any new verb needs (new
  tests cover it directly). multi-domain — no, single fgOS-CLI-internal
  concern.

0 flags would normally be `tiny`, but the item touches four files across
two layers (verb implementation, verb registration/schema, tests, plugin
skill) rather than one direct task — `small` (a few files, no gray areas)
is the honest fit; `tiny` would undersell the file count.

## Approach

Add the `show` verb next to `list` in `bin/fgos.mjs` (same file, same
dispatch `switch`), reusing `listWork(dir)` and the same
`requireField`/`StoreError` idioms `list --id` already uses for
not-found handling — no new store-facade function needed, since
`view.discovery[id]`, `view.decisionsById[id]`, `view.gates[id]`,
`view.outcomes[id]`, `view.learnings[id]` are already directly
addressable off the `listWork(dir)` return value (confirmed in
CONTEXT.md's scout section). Rejected alternative: a new
`src/state/*.mjs` helper — unnecessary indirection for a single
object-literal assembly (YAGNI), and every other simple read verb
(`stale`, `conflicts`, `graph`) either calls a dedicated compute module
only when there's real graph/ranking logic, or inlines directly in
`bin/fgos.mjs` when it's a plain lookup — `show` is the latter.

Risk map:

| Component | Risk | Proof point (for validating) |
|---|---|---|
| id-not-found path | low | mirror `list --id`'s exact error shape/message convention (`StoreError('validation', ...)`) so callers get a consistent contract across both verbs |
| output shape (D1: scoped, not global) | low-medium | a live run against an item that actually has entries in `discovery`/`decisions`/`gates`/`outcome`/`friction`/`settlement`/`learning` must show only that item's slice, and a second item's data must be absent |
| `--json` no-op (D2) | low | byte-identical output with and without `--json` on the same item |
| command-registry.mjs schema registration | low | matches the existing pattern other id-taking verbs (`take`, `pick`, `rollup`) already use for their `id` positional/flag entry |

No high/medium-risk item here needs more than the single proof point
already listed; none rises to needing a dedicated spike.

Files touched, in build order:

1. `bin/fgos.mjs` — add `case 'show':` near `case 'list':` (~line 1132,
   right after `list`'s block ends). Resolves `id = requireField(positional[0]
   ?? flags.id, 'show requires an id: fgos show <id>')` (same
   positional-or-flag convention `take`/`pick` already use — pinned as an
   implementation default, not a fresh product decision, since every
   other id-taking verb already does exactly this). Looks up
   `rawView.work[id]`, throws the same not-found `StoreError` shape
   `list --id` throws on a miss. Assembles the result as `{ work: item,
   discovery: rawView.discovery?.[id] ?? [], decisions:
   rawView.decisionsById?.[id] ?? [], gates: rawView.gates?.[id] ?? null,
   outcome: collectOutcomeEntry(id, rawView.outcomes?.[id]), friction:
   collectFrictionData(rawView, id), settlement:
   collectSettlementData(rawView, id), learning:
   collectLearningData(rawView, id) }` — reusing the exact per-item
   collectors `check` already built (`bin/fgos.mjs:335-440`) for
   friction/settlement/learning/outcome, per CONTEXT.md's corrected scout
   finding that these ARE per-item (`view.frictions[id]`/
   `view.settlements[id]`), not global aggregates as an earlier pass of
   that doc wrongly claimed. The CLI's outer print/output path already
   renders every verb's return value as `JSON.stringify(result, null, 2)`
   regardless of `--json` (confirmed: `bin/fgos.mjs:2676-2680`, the
   `renderPretty` branch only fires for `setup`/`doctor` with
   `--pretty`) — D2 depends on that already being true, nothing this verb
   needs to special-case.
2. `src/cli/command-registry.mjs` — register `show` alongside `list`
   entries: description citing this is the per-item scoped detail view
   (distinct from `list --id`'s global-arrays behavior), `id` as a
   required positional/flag per the convention above.
3. `test/cli/fgos.test.mjs` — cases for: not-found id (matches `list
   --id`'s error shape), scoped output only contains the target item's
   discovery/decisions/gates/outcomes/learnings (not another item's),
   `--json` byte-identical to no-flag output.
4. `plugins/fgOS/skills/show/SKILL.md` — new plugin skill, modeled on
   `plugins/fgOS/skills/list/SKILL.md`'s structure (frontmatter,
   `${CLAUDE_PROJECT_DIR}` substitution, `--dir` resolution pattern from
   `pick`/`submit`'s own skills since `show` is a read but this skill
   still needs the worktree-vs-main-checkout `--dir` resolution any
   `requiresExistingStore` verb needs). No rendering step per D2 — the
   skill runs the verb and relays its raw JSON output verbatim.

No split: this is one honest piece of work end to end, no `parent` child
items needed.

## Concrete cases to prove (small-mode depth)

- Existing item with discovery/decisions/gates/outcomes/learnings
  entries → `show` returns only that item's slices.
- Item with none of those (a freshly submitted item like tsk-2fw itself
  was before this work started) → each key present but empty/null, not
  omitted (consistent shape for callers).
- Unknown id → same `StoreError` shape as `list --id`'s miss.
- `--json` flag present vs absent → identical output.

## Execution

Per the locked base-workflow rule, Execute's own goal-check/verify path
and `return`'s re-verify already exist mechanically — this plan does not
redesign them. The one command that proves this item done: the new
`test/cli/fgos.test.mjs` cases added in step 3, run via the project's
existing test command (`npm test`).
