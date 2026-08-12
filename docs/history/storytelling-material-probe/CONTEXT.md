# Storytelling-material probe (tsk-1hy) — decisions

## Feature boundary

A read-only probe script that reads the repo's real `.fgos/events.jsonl`
and gathers two specific vistas of material — question/ask events, and
decisions whose rationale text appears exactly once — filtered of known
boilerplate, grouped for readability. The probe's real product is not the
script: it is a verdict, backed by verbatim quotes from real data, on
whether this material actually shows narrative arc / turning points / real
disagreement, or is just unusable notes. That verdict answers the open
question in `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
§6.4 ("Cách 1 — chỉ mặt đọc"), which `tsk-28x` depends on to pick among its
four still-open architecture options. This item locks no architecture
itself — see DISCUSSION.md §7 "Chưa chia được".

## Locked decisions

| ID | Decision | Source |
|---|---|---|
| D1 | Script lives at `scripts/probe-storytelling-material.mjs`, never registered as a `bin/fgos.mjs` verb. Two real reasons: (a) a probe should not become a permanent public surface before the material is known to be usable; (b) `bin/fgos.mjs` already has a live footprint conflict between `tsk-3ip`/`tsk-3cb` — a third writer compounds it. `scripts/` is confirmed absent from `package.json`'s `files` array (checked directly), so nothing here ships. | Item description + DISCUSSION.md §7 "Quyết định thiết kế đáng ghi" |
| D2 | Read-only boundary: reads `.fgos/events.jsonl` only, via the same `readEvents` (`src/state/events.mjs`) + `git rev-parse --path-format=absolute --git-common-dir` main-checkout-resolution pattern `scripts/measure-verify-cost.mjs` and `scripts/verify-fanout-overlap.mjs` already use (works identically from a worktree, since a worktree carries no `.fgos/` of its own — ADR0020). No new event type, no `.fgos/` writes, no schema changes, no end-user docs. | Item description + scout of `scripts/measure-verify-cost.mjs:16-29`, `scripts/verify-fanout-overlap.mjs:20,45` |
| D3 | Exactly two independent vistas, never merged into one stream: (a) ask/question material — `work.move` events carrying `payload.ask` (the text that parked the item in `awaiting-human`; folds visibly as `view.gates[id].ask`/`askHistory` in `src/state/replay.mjs:196-236`, but the probe reads the raw events directly, not the replayed view, per D2); (b) decisions whose rationale text appears exactly once across the whole log (raw `decision` events, `event.payload.rationale`, folded at `src/state/replay.mjs:318-336`). | Item description ("gom hai vi") |
| D4 | Boilerplate to filter out of vista (b), by exact/prefix match, with before/after counts printed as proof: `"tsk-27y D2: caller-supplied verdict — session already reasoned live..."` (×321), empty string (×132), the repeated `fgos-coding-planning` template line for the same chain (×96), `"see CONTEXT.md for full scout evidence and reasoning"` (×82), `"see CONTEXT.md for the full scout evidence and reasoning"` (×38, note the added "the" — a distinct string, not a duplicate of the ×82 line). | Item description (pre-measured 2026-08-07/09, not to be re-derived) |
| D5 | Grouping shape (by item, by time, or by topic) is the implementer's free choice — the only hard requirement is human-readability, not a flat unstructured dump. Not re-litigated here; this is an implementation choice, not a product decision. | Item description ("tự chọn, đây là phép thử") |
| D6 | Output: print to stdout; a Markdown report under `docs/history/compound-learn-artifact-registry/reports/` only if useful, not mandatory. | Item description |
| D7 | No ranking/scoring signal is designed or chosen here (AUC-measured signal selection, per DISCUSSION.md §6.5, is explicitly a later-phase concern) — this probe only filters boilerplate and groups. | Item description + DISCUSSION.md §6.5 |
| D8 | The test (`test/scripts/probe-storytelling-material.test.mjs`, the item's own `verify`) asserts against a synthetic fixture `events.jsonl` built in the test, never the live repo `.fgos/events.jsonl` — matching every existing `test/scripts/*.test.mjs` in this repo (`check-events-seq-contiguity.test.mjs`, `migrate-actor-to-role.test.mjs`, etc.), none of which read the live log. The live-log counts in D4 are the pre-measured proof for this item's own acceptance criteria, read once by hand/by running the script against the real repo — not something `verify` re-asserts as a moving target. | Scout of `test/scripts/check-events-seq-contiguity.test.mjs:46-60`, `test/scripts/migrate-actor-to-role.test.mjs:17-34` (repo-wide convention, no exception found) |
| D9 | Impact-analysis posture: GitNexus registered and `present`, freshly checked (`fgos tool query --capability impact-analysis --status present`). Informational only — this item adds a new read-only script rather than editing an existing symbol, so this does not gate or reshape any question here. | `fgos tool query` output, this session |

## Pinned terms

- **Probe (phép thử)**: a throwaway, read-only investigation whose product
  is a written verdict backed by quotes, not a shipped feature or a
  reusable tool.
- **Vista (vỉa)**: one of the two independent slices of raw material this
  script gathers (D3) — not a merged or ranked combination of the two.

## Scout evidence

- `scripts/measure-verify-cost.mjs:1-29` — sibling precedent: reads
  `.fgos/events.jsonl` via `readEvents`, resolves the main-checkout root
  the same way, writes a one-off Markdown report, is not itself registered
  in `bin/fgos.mjs`.
- `scripts/verify-fanout-overlap.mjs:9-45` — second sibling precedent,
  same `readEvents` + main-checkout-root pattern.
- `src/state/replay.mjs:196-236` — ask/answer gate fold (`view.gates[id].ask`),
  confirms the raw event shape the probe's vista (a) reads from.
- `src/state/replay.mjs:318-336` — decision fold (`view.decisions`,
  `view.decisionsById`), confirms the raw event shape vista (b) reads from.
- `test/scripts/check-events-seq-contiguity.test.mjs`,
  `test/scripts/migrate-actor-to-role.test.mjs` — confirm the
  fixture-not-live-log test convention (D8).
- `package.json:13-21` — confirms `scripts/` is absent from `files`
  (D1's "never ships" claim).
- `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §6.4-§7 —
  the design decision (Cách 1) and full task rationale this item
  implements verbatim.

## Outstanding questions

None
