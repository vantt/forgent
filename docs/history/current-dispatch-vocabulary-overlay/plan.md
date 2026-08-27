Mode: small

## Context

No `CONTEXT.md` exists for this item — discovery verdict was `clear`
(`RESEARCH.md` Round 1), which skips `exploring` and therefore skips
`CONTEXT.md`. This plan proceeds directly from the discovery evidence
already recorded in `RESEARCH.md`.

## Approach

**Chosen path:** add one new "current vocabulary" section to
`docs/specs/runner.md`, placed before `## Lịch sử quyết định retired từ
docs/decisions/ (tsk-1lv-4)` (line 1117 today), and extend
`docs/architect/dispatch-control-plane-redesign.md`'s existing `## 5.
Vocabulary` (line 117) rather than inventing a second vocabulary
structure there.

**Alternatives rejected:**
- Rewriting the existing 2×2 grid in `runner.md:2172-2180` in place —
  rejected: that grid lives inside the frozen `### 0031` historical
  record; the repo's own supersede convention (see `0031`'s own closing
  line, "Đổi quyết định này = supersede bằng record mới, không sửa tại
  chỗ") and this item's own hard rule ("giữ lịch sử ADR") both say don't
  edit history in place — add a new current-facing section instead, and
  have it point back at the grid rather than duplicate or replace it.
- One shared vocabulary doc instead of two per-file sections — rejected:
  out of scope (item's own Scope line names exactly these two files); a
  merged doc is a bigger structural change than "add a current-vocabulary
  overlay" calls for.

**Risk map:**
| Component | Risk | What would prove it |
|---|---|---|
| `docs/specs/runner.md` new section | light | `rg` verify command (below) plus the existing `test/docs/decisions-corpus-retired.test.mjs` assertion that `### 0032 — Cổng Iron Law` header text is untouched — checked by reading the insertion point (line 1117) is strictly before any `### 003x` header, so no existing header moves or is edited |
| `docs/architect/dispatch-control-plane-redesign.md` §5.1 edit | light | same `rg` verify; §5.1 is prose-only, no test references this file (`rg -l` for the filename under `test/` returned nothing) |
| `capacities.<id>` → `capabilities.<id>` prose fix in `runner.md` | light | same `rg` verify; confirmed comment/prose-only in code paths, no identifier rename, so no code-behavior change |

No medium/high-risk component — all light, so no `fgos-coding-validating`
proof point beyond the verify command itself.

**Impact-analysis posture:** `full` (GitNexus present, `fgos tool query
--capability impact-analysis --status present`) — not invoked as a proof
point here because nothing in scope changes code behavior (no identifier
rename, no logic edit); blast-radius evidence would have nothing to
measure.

**Files touched, in order** (per `fgos graph --json`'s component read —
`tsk-4he` sits in a 2-item component with its own dependency `tsk-17m`,
still `executing`; no `criticalPath`/`topUnblock` ordering applies within
this item's own single-piece scope):
1. `docs/specs/runner.md` — add the new vocabulary section.
2. `docs/architect/dispatch-control-plane-redesign.md` — extend §5.1.

## Shape

Not a split — one honest piece, both edits are the same "surface today's
current vocabulary, point back at history" move, just in two files named
by the item's own Scope line.

**docs/specs/runner.md** — insert a new `## Từ vựng dispatch hiện hành`
section immediately before line 1117 (`## Lịch sử quyết định retired từ
docs/decisions/`), containing:
- A table: current term → old/superseded term → one-line meaning →
  pointer (file:line or ADR id) — covering `work`, `child work`,
  `executor`, `capability` (see next bullet for the `capacity` wording
  call), `launcher`, `driver`, `orchestrator` (T0 layer), `DispatchPlan`,
  `DispatchAssignment`.
- For `capacity`: keep it as its own row (the concept `runner.md:1734`
  already named — "a functional/helper unit", distinct from `subTask` per
  that same passage) rather than treating it as fully superseded by
  `capability` — the two words are used for two different things today
  (`capability` = abstract behavior promise per
  `dispatch-control-plane-redesign.md:125`; `capacity` = the functional
  unit concept `runner.md` itself defined in §0029). Add one line noting
  the doc's own `capacities.<id>` config-key mentions
  (`runner.md:1820,1822,1844,1859,1864-1865`) are stale prose and should
  read `capabilities.<id>` to match the real field name
  (`src/runner/dispatch/{resolve,config}.mjs`) — fix those mentions as
  part of this same edit, not just flag them.
- A one-line pointer to the existing `launcher`/`driver`/`orchestrator`
  2×2 grid at `runner.md:2172-2180` ("see the `0031` record's own grid for
  the T1/T0 axis this table's `orchestrator`/`launcher`/`driver` rows
  summarize") instead of duplicating its content.
- Explicitly note `rootTask`/`subTask` as removed (superseded by `0029`,
  citing `docs/decisions/index.md`'s own chain lines per this repo's
  citation convention — never a direct `docs/decisions/00xx-*.md` link,
  those are retired per `tsk-1lv-4`).

**docs/architect/dispatch-control-plane-redesign.md** — extend §5.1
`Dispatch Roles` with one new bullet for `orchestrator` (T0, N-unit,
stays — same meaning as `runner.md`'s grid), and one line noting `capacity`
(the `runner.md`-side term) maps to this doc's `capability` for the same
concept, so a reader moving between the two docs does not read them as
naming two different things.

**Concrete cases this plan is scaled to prove** (mode `small` depth):
- Every `rootTask`/`subTask`/`capacity`/`orchestrator` hit under
  `docs/specs`, `docs/architect`, `src/runner`, `src/state` (33+4 hits
  found in `RESEARCH.md` Round 1) ends up classified: still-current
  (has a current-vocabulary row), historical/quoted (inside a frozen
  `### 00xx` record or a code comment), or fixed (the `capacities.<id>`
  → `capabilities.<id>` prose correction).
- No existing header/test-asserted string in `runner.md` moves — the new
  section is a pure insertion before line 1117, never a rewrite of
  anything `decisions-corpus-retired.test.mjs` checks.
- No code file changes at all — the verify command's `src/runner
  src/state` scope stays comment-only, confirmed already in `RESEARCH.md`.

## Verify

```bash
rg -n "rootTask|subTask|capacity|orchestrator" docs/specs docs/architect src/runner src/state
```
Every hit classified as: (a) inside a current-vocabulary table row this
plan adds, (b) inside a `### 00xx` historical record already frozen
(`runner.md:1117`+), (c) a code comment (unchanged, already confirmed
prose-only), or (d) the corrected `capabilities.<id>` wording (no longer a
`capacity`-prefixed string once fixed). No hit left unclassified.

## Outstanding questions

None
