# CONTEXT: split the overloaded `fgos discover` verb (tsk-2b0)

## Feature boundary

`tsk-2b0` was spun off from `tsk-4y5`'s exploring pass (D1,
`docs/history/work-item-priority-matrix/CONTEXT.md`) as its own item. The
CLI verb `discover` in `bin/fgos.mjs` (case `'discover'`, line ~871)
dynamically picks which of two already-separate functions to run based on
the claimed item's current `stage`:

```js
const result = stage === 'decompose'
  ? resolveDecompose(dir, id, cfg, 'session')
  : resolveDiscovery(dir, id, cfg, 'session');
```

`resolveDiscovery` (`src/intake/discovery.mjs:231`, wraps `judgeDiscovery`)
and `resolveDecompose` (`src/intake/plan.mjs:279`, wraps
`judgeDecompose`) are already two distinct functions with distinct
behavior — only the CLI verb name conflates them, so nothing in the CLI
surface tells a caller which judgment will actually run. This item splits
the CLI verb into two real verbs, `discover` and `decompose`, one per
stage, with no new judging mechanism.

`src/runner/loop.mjs` (the async sweep, RUL19) already calls
`resolveDiscovery`/`resolveDecompose` directly by function name, not
through the CLI verb — it is unaffected by this split.

Related but separate: `tsk-ozl` (a dependency of this item, still at its
own `clarify` stage as of this writing) is a narrower behavior bug on
`resolveDiscovery` itself (calls `judgeDiscovery` unconditionally, never
checking `docsRef`/CONTEXT.md first). Splitting the verb name does not fix
that bug by itself; `tsk-4y5`'s CONTEXT.md already recorded this as a
bundling recommendation, not a hard technical coupling — this item's own
scope is the split only.

Out of scope: `tsk-ozl`'s behavior fix (tracked entirely on `tsk-ozl`
itself); any change to `judgeDiscovery`/`judgeDecompose`'s judgment logic;
`priority`/`impact`/`effort` field work (the rest of `tsk-4y5`'s D2-D8,
a separate item).

## Locked decisions

| D-ID | Decision | Rationale |
|---|---|---|
| D1 | Hard split, no fallback. `discover` only runs `resolveDiscovery`/`judgeDiscovery`; `decompose` only runs `resolveDecompose`/`judgeDecompose`. Each errors when called on an item not at the stage it handles (`discover` on a non-`clarify` item, `decompose` on a non-`decompose` item), rather than silently falling back to auto-routing by stage. | User decision (this session). Matches D1's literal wording upstream ("split... into two") and actually removes the "nothing in the CLI surface tells you which judge runs" confusion `tsk-4y5`'s D1 names as the reason for splitting — a back-compat shim that kept `discover` auto-routing would leave that exact confusion live under the `discover` name. |
| D2 | Every live caller of the old dynamic-dispatch contract found by this pass's scout gets updated in this same item, not deferred to a follow-up. | Direct consequence of D1: a hard split with no fallback means any caller still relying on `discover` auto-routing to `decompose`-stage judgment breaks at runtime the moment this ships. Shipping D1 without updating known callers would violate the item's own definition of done (real, verified behavior — `AGENTS.md` DoD #5). |
| D3 | Historical/narrative docs (`docs/history/**`, `docs/tutorials/**`, `docs/how-to/**`, `docs/backlog.md`) that reference `fgos discover` in past tense, describing events that already happened under the old verb, are **not** rewritten. Only currently-prescriptive docs are updated (see scope table below). | Precedent: `tsk-ozl`'s own locked D2 ("KHÔNG sửa docs/backlog.md — log lịch sử đã done, giữ nguyên đúng quy ước lúc đó") already establishes this repo's convention that historical logs stay as-written, not revised when the underlying mechanism later changes. Rewriting them would misrepresent what actually happened at the time. |

## Pinned terms

- **Hard split** — `discover` and `decompose` become two independent CLI
  verbs, each bound to exactly one judgment function and one stage
  precondition; neither falls back to the other's behavior.
- **Live caller** — any file whose content is executed or asserted against
  at runtime (SKILL.md steps that shell out, `command-registry.mjs`,
  `test/cli/fgos.test.mjs`), as opposed to a **narrative reference**
  (prose in `docs/history/**`/`docs/tutorials/**`/`docs/how-to/**`/
  `docs/backlog.md` describing something that already happened).

## Scout evidence cited

- `bin/fgos.mjs:871-883` — the `case 'discover':` dynamic-dispatch site
  this item splits; no existing `case 'decompose':` name collision found
  (`grep -n "case '" bin/fgos.mjs`).
- `src/intake/discovery.mjs:231` (`resolveDiscovery`), `src/intake/
  decompose.mjs:279` (`resolveDecompose`) — already-separate functions,
  confirming D1's "no new mechanism" framing.
- `src/runner/loop.mjs:86-87,957,977` — the async sweep calls both
  functions directly by name already, unaffected by the CLI-verb split.
- `src/cli/command-registry.mjs:127-143` — the single `discover` registry
  entry that needs splitting into two entries.
- `plugins/fgOS/skills/discover/SKILL.md` — dedicated `/fgOS:discover`
  slash-command skill whose entire step 2/3 contract (single call,
  branching report logic) is built on today's dynamic dispatch; needs a
  companion `decompose` skill or an update to route explicitly.
- `plugins/fgOS/skills/cook/SKILL.md:90` — calls `fgos discover <id>
  --json` generically as "the same engine command" regardless of stage.
- `.claude/skills/fgos-coding-exploring/SKILL.md:46`, `.claude/skills/
  fgos-coding-validating/SKILL.md:50` (and their `.agents/skills/` mirrors) —
  hand-off prose citing `fgos discover` as the stage-advancing call from
  both `clarify` and `decompose`.
- `test/cli/fgos.test.mjs:2738-2884` — 9 call sites using `['discover',
  id]` to exercise both the clarify and decompose branches through the
  same verb name.
- `docs/history/work-item-priority-matrix/CONTEXT.md` D1 and its
  "Correction (post-lock audit)" note — the upstream locked decision this
  item implements, and the `tsk-ozl` scope clarification it already
  recorded.
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` —
  flagged in `tsk-4y5`'s CONTEXT.md as needing a follow-up pass once this
  ships; a live/prescriptive reference doc, not historical, so D3 does not
  exempt it.

## Live callers in scope (per D2)

- `bin/fgos.mjs` — the verb dispatch itself
- `src/cli/command-registry.mjs` — registry entries
- `plugins/fgOS/skills/discover/SKILL.md` — update, and/or add a sibling
  `decompose` skill (shape/size is `fgos-coding-planning`'s call, not locked
  here)
- `plugins/fgOS/skills/cook/SKILL.md`
- `.claude/skills/fgos-coding-exploring/SKILL.md`, `.claude/skills/
  fgos-coding-validating/SKILL.md`, and their `.agents/skills/` mirrors
- `test/cli/fgos.test.mjs`
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md`

## Outstanding questions deferred to `fgos-coding-planning`

- Exact error message/exit-code shape for calling `discover`/`decompose`
  on the wrong stage.
- Whether `plugins/fgOS/skills/discover/` gets a new sibling `decompose/`
  skill directory, or `discover/SKILL.md` itself gets narrowed and a new
  file added alongside it — a shaping/sizing call, not a product decision.
- Whether this ships as one commit/pass or is itself split further —
  `fgos-coding-planning`'s mode-gate call, given the number of live callers in
  scope (D2).
