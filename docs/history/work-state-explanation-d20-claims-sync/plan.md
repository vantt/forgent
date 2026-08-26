# plan.md — tsk-gli: sync work-state.md + role-holder-axis explanation + agent-roster.mjs docstring to D20's real model

Mode: small

Lane decided via `fgos-routing`'s Mode-gate table (this item entered
directly through `/fgOS:cook`, so no lane was handed off — applying the
table directly per `fgos-coding-planning`'s own direct-entry fallback).
Flags checked: auth (no), authorization (no), data model (no),
audit/security (no), external systems (no), public contracts (no —
internal narrative docs only), cross-platform (no), existing covered
behavior (no — no test-covered logic touched), weak proof around the area
(no), multi-domain (no). 0 flags → tiny/small band; picked **small** over
**tiny** because the footprint is 3 files with 3 distinct edits (2 doc
notes + 1 docstring rewrite) and its own acceptance-criteria grep sweep,
not "a couple of files, one direct task."

## Approach

**Chosen path:** For each of the two canonical docs (`docs/specs/work-
state.md`, `docs/explanation/why-coding-domain-has-a-role-holder-axis-and-
task-spec-ontology.md`), keep the existing D12 `claims:` excerpt verbatim
as historical evidence, and insert a short correction note immediately
after it: the field was inverted by D20/D26, citing
`docs/history/core-foundation-domain-boundary/DISCUSSION.md` at the real
line numbers (D20 @ 461, D26 @ 467 — verified in `RESEARCH.md` Round 1,
not the task's estimated 466), and naming the real fields in force today
(`skills:` on agent-type, `requires-skill:`/`agent:` on task-spec). For
`src/runner/agent-roster.mjs`'s docstring (line 3), replace the bare
"D20/D22" mention with the same DISCUSSION.md path.

**Alternatives rejected:**
- Rewriting the D12 excerpt in place instead of appending a note — rejected
  per the task's own acceptance criteria ("Giữ nguyên đoạn trích D12 như
  bằng chứng lịch sử"): the excerpt is evidence of what was actually
  shipped once, not a live claim, and erasing it loses that trail.
- Also fixing the `.claude/agents/*.md` stale path mention at
  work-state.md:2143 (RESEARCH.md Round 1, finding under claim 9) — out of
  this item's declared footprint/acceptance criteria (which scope only the
  `claims:`/`skills:`/`requires-skill:`/`agent:` field), so left alone;
  named as an Outstanding question below instead of silently expanding
  scope.

**Risk map:**

| Component | Risk | What would prove it |
|---|---|---|
| `docs/specs/work-state.md` edit | light — prose-only, no code path reads this file | `rg` sweep (Step below) shows the D20 pointer present, no bare `claims:`-as-current phrasing left |
| `docs/explanation/...md` edit | light — prose-only | same sweep |
| `src/runner/agent-roster.mjs` docstring edit | light — comment-only, inside a `//` block, not parsed at runtime (confirmed: the changed lines are plain `//` comments, not JSDoc consumed by any tool in this repo) | `npm test` unchanged (no behavior touched) |

No medium/high-risk component — no proof point beyond the mechanical
verify below is needed. Impact-analysis posture: **n/a — no blast-radius
claim made**, not "inactive" in CLAUDE.md's gate sense (`fgos tool query
--capability impact-analysis --status present` confirms GitNexus IS
registered and `present`, so the provider-count sense of "inactive" does
not literally apply here). This plan's own risk map (above) has no
medium/high-risk row and none leans on blast-radius evidence — comment-only
code change, prose-only doc changes — so this axis has nothing to check
regardless of GitNexus's status.

**Files touched, in order** (no ordering dependency between them — `fgos
graph --json` shows tsk-gli as an isolated size-1 component, no
`criticalPath`/deps to sequence against):

1. `docs/specs/work-state.md` — add the D20 correction note after the
   existing D12 excerpt in "Position vs Agent-type" (lines 2138-2150).
2. `docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-
   spec-ontology.md` — same, after the D12 blockquote (lines 191-201).
3. `src/runner/agent-roster.mjs` — rewrite line 3's docstring to carry the
   real path.

## Shape

Small, direct edits — no phased plan needed:

- **File 1** (`work-state.md`): insert a new bullet-continuation
  immediately below the existing `claims: [phiếu]` sentence (still inside
  the same `- **Position vs Agent-type**:` bullet, or as an immediately
  following bullet — whichever reads cleaner in context once editing).
  Content: field inverted by D20 (`docs/history/core-foundation-domain-
  boundary/DISCUSSION.md:461`), renamed by D26 (`:467`); today an
  agent-type declares `skills:` (7/7 `core/agents/*.yaml`); a task-spec
  declares `requires-skill:` (13/13 `domains/coding/task-specs/*.md`) or
  pins one agent-type via `agent:` (D26's rename of `assignable-to`,
  available but unused by any task-spec today).
- **File 2** (`why-coding-domain-...md`): same correction note, placed
  right after the D12 blockquote + its narrative paragraph (after line
  201, before the next `##` heading).
- **File 3** (`agent-roster.mjs`): line 3 changes from "for D20/D22's
  eligibility-inversion resolution" to "for
  docs/history/core-foundation-domain-boundary/DISCUSSION.md's D20/D22
  eligibility-inversion resolution" (or equivalent phrasing carrying the
  same path) — comment-only, no code line changes.

Edge cases considered (proportionate to `small`, not exhaustive):
- Both docs must keep the D12 excerpt byte-for-byte (acceptance criteria
  says "giữ nguyên") — the new note is an addition, never a replacement.
- `docs/history/` is frozen — this plan touches none of it (only reads
  `DISCUSSION.md` for citation, per RESEARCH.md Round 1).
- No agent-type yaml or task-spec file is touched — code already matches
  the real model (RESEARCH.md Round 1, claims 1-6), only the two docs and
  one docstring are stale.

## Split decision

No split. One honest piece — 3 files, one coherent correction, no
independent sub-pieces worth materializing as separate items.

## Verify (root item, pass-through — no split)

```bash
rg -c core-foundation-domain-boundary/DISCUSSION.md docs/specs/work-state.md docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md src/runner/agent-roster.mjs && npm test
```

Same command already synced onto the item at `discover --verdict clear`
(Round 1). Confirms all 3 footprint files carry the DISCUSSION.md pointer,
and the full suite still passes (comment/prose-only changes, no behavior
expected to move).

`action`: this `plan.md`. `footprint`: `docs/specs/work-state.md`,
`docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-spec-
ontology.md`, `src/runner/agent-roster.mjs` (already the item's declared
footprint at submit time — unchanged here).

## Outstanding questions

- The `.claude/agents/*.md` file-location mention at `work-state.md:2143`
  (same "Position vs Agent-type" bullet) also looks stale — real
  agent-type source today is `core/agents/*.yaml` +
  `domains/<name>/agents/*.yaml` (D24, same DISCUSSION.md, ~line 485) —
  but it is outside this item's declared footprint/acceptance criteria
  (scoped to the `claims:`→`skills:`/`requires-skill:`/`agent:` field
  only). Left untouched here; worth a follow-up item if a person agrees
  it's in scope for a future docs pass.

## Post-return flake confirmation

A retry of this item's own `verify` (`... && npm test`) failed on two
`test/runner/dispatch.test.mjs` assertions ("fires candidates in batch
concurrently with overlapping execution windows", and a timing-sensitive
`idleTimeoutMs` worker-kill assertion) — both timing-sensitive tests,
neither touching anything this item's own diff changes (`docs/specs/
work-state.md`, the role-holder-axis explanation doc, and a 4-line
comment-only edit in `src/runner/agent-roster.mjs`, confirmed via `git
diff` against this branch's own merge-base). Re-ran both failing tests in
isolation, away from full-suite concurrency load: both passed cleanly.
`tsk-1sl`'s own Iron Law evidence documents the identical
"overlapping execution windows" test failing the same way under
concurrent load and passing in isolation — this is a known, pre-existing
environment-timing flake in the test suite, not a regression from this
item's docs-only diff.
