# CONTEXT — Route `/fgOS:discover`, `/fgOS:plan`, `/fgOS:discover-next` through fgos-routing instead of a blind verb call

Item: tsk-31l

## Feature boundary

Fixes 3 skill wrappers — `plugins/fgOS/skills/discover/SKILL.md`,
`plugins/fgOS/skills/plan/SKILL.md`,
`plugins/fgOS/skills/discover-next/SKILL.md` — so they route the
already-live session's own reasoning into `fgos discover`/`fgos plan`
via the caller-supplied `--verdict` flag (`tsk-27y`), instead of calling the
bare CLI verb with no `--verdict`, which unconditionally spawns
`judgeDiscovery`/`judgeDecompose`'s own subprocess judge — a real model
call, but one with no access to this session's conversation, code reads, or
prior reasoning ("blind" describes that missing context, not an absent
model). Does not touch the intake engine (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`) — the `--verdict` flag already works correctly
since `tsk-27y`.

## Problem (confirmed by reading the code, not suspected)

- `plugins/fgOS/skills/discover/SKILL.md:45` — `/fgOS:discover <id>` runs
  `node bin/fgos.mjs discover $ARGUMENTS --json --dir ...`, no `--verdict`
  → always triggers the blind subprocess judge.
- `plugins/fgOS/skills/plan/SKILL.md:46` — same pattern, same gap.
- `plugins/fgOS/skills/discover-next/SKILL.md` step 4 (lines 52-57) — after
  picking an item via `pickNextDiscoverItem`, also calls the bare verb,
  blind.
- Contrast: `.claude/skills/fgos-coding-exploring/SKILL.md`'s own gate step calls
  `fgos discover <id> --verdict clear --verify ...` — the already-correct
  path, reached by going through `fgos-routing` → `fgos-coding-driving` →
  `fgos-coding-exploring` instead of a direct verb call.
- `rg -n "fgos.mjs discover|fgos.mjs" plan" plugins .claude .agents
  --glob "*.md"` (scout, this session) confirms these 3 files are the ONLY
  copies calling the bare verb — no `.claude/skills`/`.agents/skills`
  mirror of `discover`/`decompose`/`discover-next` exists, so there is no
  second copy to miss.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | `/fgOS:discover <id>` and `/fgOS:plan <id>` change from calling `bin/fgos.mjs discover/decompose` directly to: claim the item if not already `doing` (`fgos take --role session --id <id>`), then dispatch it to `fgos-coding-driving` (or directly to `fgos-coding-exploring`/`fgos-coding-planning`) so the live session does its own Socratic/shape reasoning and supplies `--verdict` itself. |
| D2 | `/fgOS:discover-next` keeps its step 2 pick logic unchanged (`pickNextDiscoverItem`, `src/state/discover-pool.mjs` — ordering is correct, not touched). Only step 4 changes: instead of calling the bare verb on the picked id, hand that id to `fgos-coding-driving` with a **dynamic ceiling** — `stage:decompose` when the picked item's stage is `clarify`, `stage:executing` when the picked stage is `decompose` (superseded by D6 below — the original "no ceiling needed for decompose" reasoning here was wrong; see D6 for the corrected rationale). |
| D3 | Group B — `/fgOS:cleanup-next`/`-loop`, `/fgOS:merge-next`/`-loop`, `/fgOS:retro-next`/`-loop` — stays untouched. These operate on `status` values (`cleanup`/merge-ready/`retrospective`) outside the `clarify`/`decompose`/`executing` `stages` array `fgos-coding-driving` manages (D9/D10, locked in `fgos-coding-driving/SKILL.md`). Folding them in would require extending the domain-stage registry itself — a separate, larger design decision, out of this item's scope. |
| D4 | `fgos-runner`'s own clarify/decompose sweep (`src/runner/loop.mjs`, the `RUL14`/`RUL17` sweeps per `docs/specs/runner.md`) is a structurally separate code path — it imports and calls `resolveDiscovery`/`resolveDecompose` directly in-process, never through these 3 skill files, and is untouched by this item. No headless/blind fallback flag is added to the 3 skills being fixed: a slash-command can only ever be invoked from inside an already-live Claude Code session (human-attended or otherwise), so the "keep a blind path for headless callers" question in this item's original description is resolved as moot — that caller shape does not exist at the skill layer. |
| D5 | Docs describing the old direct-wrap behavior get updated to describe the new routed behavior: `docs/how-to/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md:68-70` ("`/fgOS:discover <id>` and `/fgOS:plan <id>` wrap these two verbs directly"), plus `decompose/SKILL.md`'s own self-referencing lines (8, 25) once its steps change per D1. |
| D6 | (fgos-coding-planning gap, confirmed material, human-answered) Every invocation of `fgos-coding-driving` this item introduces carries an explicit ceiling — `discover/SKILL.md`: `ceiling: stage:decompose`; `decompose/SKILL.md`: `ceiling: stage:executing`; `discover-next/SKILL.md` step 4: `stage:decompose` when the picked stage is `clarify`, `stage:executing` when the picked stage is `decompose`. Without a ceiling on the decompose-stage case, a `pass-through`/`noop` outcome lands the item on `stage:executing` with `status:doing` in the same driving-loop turn, and the loop's own "no ceiling = keep going" rule would immediately invoke `fgos-coding-implement` — silently starting a real code build from a command (`/fgOS:plan <id>`) a person expects to run only the split-work judgment. Every one of these 3 skills must do exactly one stage's work per invocation, never cascade into the next. |

## Pinned terms

- **"Blind" (mù)** — the judge subprocess call (`judgeDiscovery`/
  `judgeDecompose`, spawned via `spawnSync`) IS a real model call, not an
  absent one. "Blind" describes its missing context: it only sees the
  item's stored fields (title/description/refs/prior discovery records),
  never the live session's conversation, code reads, or prior reasoning.
  Distinguish from "no soul" — 0026 itself calls this a "soul mù" (a blind
  soul), never a soulless one.
- **`fgos-runner`'s clarify/decompose sweep** — a genuinely unattended
  orchestrator loop (decision 0005; `docs/specs/runner.md` RUL14/RUL17):
  no live Claude Code session backs it (it is a bare Node process), so it
  has no native/skill-routing path available to it at all — spawning the
  judge subprocess is its only way to get any model judgment. When that
  judgment is `unclear`/`need-human`, the item parks in `awaiting-human`
  and the sweep continues to the next item (`docs/specs/runner.md:926`) —
  this is established, working-as-intended behavior, not a gap this item
  addresses.

## Scout evidence

- `plugins/fgOS/skills/discover/SKILL.md`, `decompose/SKILL.md`,
  `discover-next/SKILL.md` — full read, this session (see conversation
  history preceding this CONTEXT.md).
- `.claude/skills/fgos-coding-exploring/SKILL.md` gate step — the already-correct
  `--verdict clear --verify` call pattern this item extends to the 3 skill
  wrappers.
- `docs/how-to/pass-a-caller-supplied-verdict-to-discover-or-decompose.md`
  — confirms `--verdict` is caller-facing and stable since `tsk-27y`; no
  engine change needed.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine; this item is Phase 2's own consumer
  (a caller with a live soul, same provider, should prefer supplying its
  own verdict over a blind re-derive).
- `docs/decisions/0005-runner-va-co-lap-worker.md`,
  `docs/specs/runner.md` (RUL14/RUL15/RUL17, line 926, line 935) — confirm
  `fgos-runner`'s sweep is a deliberate, already-working unattended design
  (park-to-`awaiting-human`-and-continue), structurally separate from the
  3 skills this item touches (D4).
- `src/runner/loop.mjs:87-88, 970-1000` — confirms the runner sweep calls
  `resolveDiscovery`/`resolveDecompose` directly in-process, never via a
  CLI subprocess or a skill file.
- `fgos tool query --capability impact-analysis --status present` (this
  session) — GitNexus registered and `present`. Posture: **full**. Not
  load-bearing for this item (prose/doc-only change, no symbol edits), but
  recorded per this skill's own step 1.
- `rg -n "fgos.mjs discover|fgos.mjs" plan" plugins .claude .agents
  --glob "*.md"` (this session) — confirmed only 3 files call the bare
  verb; no missed mirror copy.

## Outstanding questions

None — every decision above was locked in conversation before this
CONTEXT.md was written; `fgos-coding-planning` picks up from D1-D5 to shape the
actual edit sequence.
