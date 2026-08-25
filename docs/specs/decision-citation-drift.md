---
area: decision-citation-drift
updated: 2026-07-27
sources: [str72-supersede-drift-check]
decisions: [28f8d8f8]
coverage: partial
---

# Spec: Decision Citation Drift Check

A read-only detection check that scans the product backlog and area specs for
lines that still cite a decision by its old id after that decision has been
superseded, without also naming the decision that replaced it. Its purpose is
to catch "dead framing" — a backlog row or spec line whose reasoning was
overturned, but whose wording still reads as if the old decision were current,
so a reader (human or agent) re-derives the outdated conclusion. Used by
whoever maintains `docs/backlog.md` and `docs/specs/*.md` (a human operator or
an agent doing grooming/scribing).

## Entry Points & Triggers

- `node scripts/check-decision-citation-drift.mjs` (from the product repo
  root) — the only way to run the check today. Manual invocation only; there
  is no scheduled or CI trigger yet (see Open Gaps).
- Optional flags override the default locations: `--decisions-dir <path>`
  (default `docs/decisions`), `--backlog <path>` (default `docs/backlog.md`),
  `--specs-dir <path>` (default `docs/specs`).

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Decision id | The 4-digit id of a decision record under the decisions directory | 4 digits, e.g. `0002` | yes | — |
| 2 | Superseded-by id | The id of the decision that replaced a given decision, read from that decision's own front matter | 4 digits | no (absent when a decision was never superseded) | — |
| 3 | Cited id (in a scanned line) | A decision id referenced in a backlog row or spec line | written either as `ADR<4-digit>` or as a bare 4-digit number that matches a known decision id | — | — |
| 4 | Finding | One flagged line | `{kind: "dead-framing", file, line, id, supersededBy, message}` | — | — |
| 5 | Scan scope | Which files are scanned | the backlog file + every file in the specs directory | — | fixed: `docs/backlog.md` + `docs/specs/*.md` |

## Behaviors & Operations

### Run citation-drift scan

- **Runs when:** an operator or agent invokes the check manually.
- **What changes:** nothing — the check only reads files, never writes.
- **Side effects:** none. Findings are printed to the console; nothing is
  persisted.
- **Afterwards:** the operator sees either "no findings" (and the process
  exits 0), or a numbered list of dead-framing findings, each naming the
  file, line number, the stale cited id, and the id that superseded it (and
  the process exits 1). No line is edited automatically — a human or agent
  must add the superseding id to the flagged line by hand.

## Actors & Access

| Capability | Operator (manual run) | CI |
|---|---|---|
| Run the scan | yes | not wired yet (Open Gap) |
| See findings | yes (console output) | — |
| Auto-fix a finding | never — detection only | — |

## Business Rules

- **R1.** A line in `docs/backlog.md` or any `docs/specs/*.md` file that cites
  a decision id whose decision record carries a superseded-by value is a
  finding unless the same line also cites the superseding id (per `28f8d8f8`).
- **R2.** A bare 4-digit number in a scanned line counts as a citation only
  when it matches a real, known decision id — an unrelated 4-digit number
  (a year, a count, an unrelated code) is never treated as a citation
  (per `28f8d8f8`).
- **R3.** The scan scope is exactly `docs/backlog.md` plus `docs/specs/*.md`.
  `docs/decisions/*.md` itself is out of scope for this check — a decision
  record's own internal backward-pointer consistency (does the superseding
  record point back to what it superseded) is a different check, not this one.

## Edge Cases Settled

- A line citing a superseded decision that also cites the superseding id on
  the same line produces no finding — the citation already carries a live
  pointer forward.
- A line citing a decision that has never been superseded never produces a
  finding, regardless of citation form.
- A bare digit sequence that does not match any known decision id is ignored,
  never counted as a citation.
- Real dogfood run against this repo (2026-07-26) found exactly one finding:
  `docs/backlog.md:88` (the STR53 row) cited ADR0002 (flat work-item model, one item kind, one FSM, "epic" is a plain item) without mentioning
  `0012`, its superseder — confirming the check catches a real, not
  hypothetical, instance of dead framing.

## Open Gaps

- Not wired into any automated gate: neither an npm script, `.bee/config.json`
  `commands.verify`, nor a CI workflow runs this check today. It must be
  invoked manually, so citation drift can persist undetected between manual
  runs. Answerable by whoever next wires a backlog/spec consistency gate.
- No auto-fix: a flagged line's acknowledgement of the superseding id must be
  added by hand; the check only ever reports.

## Pointers (implementation)

- `scripts/check-decision-citation-drift.mjs` — pure functions
  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI
  (`loadSupersededById`, `loadSourceFiles`, `runCli`).
- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering
  the rules and edge cases above.
- `src/report/frontmatter.mjs` — reused to read a decision record's
  `superseded_by` front-matter field.
- `scripts/check-decision-supersession.mjs` — the sibling check this one
  mirrors in structure; it checks a decision record's own internal
  backward-pointer instead of backlog/spec citations (a different area).
  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the
  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it
  validates was retired for good along with the hand-authored ADR corpus
  -- no longer wired into `npm run check:*` (removed from `package.json`).
  Its pure functions stay real and unit-tested against synthetic
  fixtures; only the real-repo CLI mode has nothing left to run against.
