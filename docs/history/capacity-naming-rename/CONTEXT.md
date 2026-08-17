---
item: tsk-225
---

# CONTEXT.md — tsk-225: capacity/capacities naming rename

## Feature boundary

Rename `capacity`/`capacities` → `executor`/`executors` throughout the
runner model, both in `.fgos/config.json`'s `runner.capacities` field and
in the code identifiers `src/`/`test/` use for the same concept. No
back-compat alias for the old name. Companion: one new decision record
documenting the rename and annotated into `docs/decisions/0000-index.md`.

`runner.capabilities` (the promise/purpose concept) and `runner.executor`
(singular, the existing global default) are both unchanged by this item —
only the named-backend-catalog concept (currently `capacities`) is being
renamed.

Full design discussion, scout evidence, and the two locked decisions
below: `docs/history/capacity-naming-rename/DISCUSSION.md` (this item's
own `refs` target,
`#task-capacity-to-executor-rename`).

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Rename `capacity`/`capacities` → `executor`/`executors` everywhere — both the config field (`runner.capacities` → `runner.executors`) and every internal code identifier (`capacity`, `capacityId`, `capacities`, `resolveCapacityAndOverrides`, etc. — 466 occurrences in `src/`, 500 in `test/`). No back-compat alias for the old name. `executor` won over the alternative `backend` on two grounds: (1) technical — `resolveExecutorConfig` (`src/runner/dispatch.mjs:1143`) already resolves both a named capacity and the global default into one shape it calls `executor`, so this rename unifies a type the code already treats as one, not an arbitrary relabel; (2) semantic — the user's own framing: `capability` names a promised behavior, this concept is the *realization* of that promise, and "executor" carries that action sense ("to execute") where "backend" (a static, descriptive noun) does not. |
| D2 | Of the 7 locked decision records mentioning "capacity" (`0026`, `0028`–`0031`, `0033`, `0000-index.md`), only `0026` (minted the term), `0029` (D8 — the real definitional record), and `0033` (dense, mechanistic usage) carry substantive content; `0028`/`0030`/`0031` mention it only in passing and need no change. Handle via one new decision record (confirmed next number: `0034`) documenting the rename, annotated into `0000-index.md` the same way `0028`'s rename is already annotated onto `0026` — never reopening or superseding the still-valid substance of `0026`/`0029`/`0033`. `0034` also formally resolves a real definitional gap: `0029`'s D8 originally defined "capacity" as covering *both* the promised behavior and the concrete realization, undifferentiated (`behavior-promise / functional-helper`) — tsk-34n later split that single concept into `capability` (promise) + `capacity` (realization) without ever revisiting D8's own wording. `0034` records that split explicitly instead of leaving it implicit. |
| D3 | **(mid-planning gap, round 2)** Rename scope by file category: `docs/history/*capacity*/` (~14 frozen historical directories, e.g. `docs/history/capability-capacity-remodel/`) are **left untouched** — a history folder's own content (`CONTEXT.md`/`plan.md`/evidence transcripts) is written in whatever terminology was literally true at that moment and has to stay that way (e.g. tsk-34n's own history folder quotes the exact `capacity.capability` field it retired); renaming only the outer folder name would leave it inconsistent with its own still-period-accurate content. Living docs (`docs/explanation/`, `docs/how-to/`, `docs/reference/`, ~8 files) and the shared skill-prose fragment `_shared/capacity-dispatch-fallback.md` (13 real reference sites across both mirrors + `AGENTS.md`) DO follow the rename, filename included, since both describe/serve current behavior, not a historical snapshot. |

## Pinned terms

- **executor** (new) — a concrete backend that can carry out a
  capability's work (renamed from `capacity`); declares `for: [...]`
  naming which capability/capabilities it serves.
- **executors** (new) — the named catalog, `runner.executors.<id>`
  (renamed from `runner.capacities.<id>`).
- **executor** (existing, unchanged) — `runner.executor` (singular), the
  global default `command`/`args` template used when no named executor is
  selected. Same type as the named catalog entries (per D1's technical
  grounding), distinguished only by being anonymous/default rather than
  named.
- **capability** (unchanged) — a named purpose/promise (e.g.
  `fgos-coding-implement`, `impact-analysis`); `runner.capabilities.<name>`
  may declare `prefer`/`overrides` pointing at a named executor.

## Scout evidence

- `grep -rlc "capacit" src/`: 7 files, 466 total occurrences.
- `grep -rlc "capacit" test/`: 8 files, 500 total occurrences.
- `grep -rl "capacit" docs/decisions/`: 7 files (`0000-index.md`, `0026`,
  `0028`, `0029`, `0030`, `0031`, `0033`).
- `grep -rl "capacit" .claude/skills .agents/skills plugins`: 17 files.
- `grep -n "cfg.executor\|runner.executor" src/runner/dispatch.mjs`: 9
  sites, confirming `runner.executor` is a distinct, real, already-used
  field — renaming `capacities` to `executors` (plural) sits alongside it
  without collision (same underlying type, singular default vs. plural
  named catalog).
- `grep -rn "\bbackend\b" src/ docs/decisions/ docs/specs/`: 3 matches,
  all prose description, never a field/key name — ruled out as a real
  alternative once `executor`'s technical grounding surfaced.
- Read all 7 `docs/decisions/*capacit*` files in full (not by filename
  guess): only `0026`/`0029`/`0033` have substantive content; `0029`'s D8
  is the key finding (see D2 above). `0000-index.md` already has a live
  precedent for exactly this annotation pattern (`0026`'s row already
  reads "Đã supersede bởi CẢ 0028 LẪN 0029").
- `fgos tool query --capability impact-analysis --status present`:
  `gitnexus` present. Per `CLAUDE.md`'s own gate, this session has
  separately observed GitNexus's index reporting stale (last indexed
  `7bb3231`, behind current HEAD) via the PostToolUse hook repeatedly
  this session — **impact-analysis: degraded**. This item's own blast
  radius was cross-checked with real `grep`/`rg` sweeps throughout (see
  above), not trusted to the graph alone, consistent with the repo's own
  stale-index cross-check rule.

## Outstanding questions

None
