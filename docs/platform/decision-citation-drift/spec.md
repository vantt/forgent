---
area: decision-citation-drift
updated: 2026-11-22
sources: [str72-supersede-drift-check]
decisions: [28f8d8f8]
coverage: partial
---

# Spec: Decision Citation Drift Check

```txt
Document type: Specification
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/decision-citation-drift.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/decision-citation-drift/spec.md#spec-decision-citation-drift-check
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Source carriage:  Implementation corrections: only identified false current sentences corrected; evidence: scripts/check-decision-citation-drift.mjs:16-20; docs/decisions/index.md:1; package.json:1; scripts/check-decision-citation-drift.mjs:1-34; no tracked .bee/config.json or CI trigger.


A read-only detection check over the product backlog, the platform specs and
decision narratives, and the skill trees. It flags two citation-format defects:

- **bare citation:** an `ADR<n>` or `RUL<n>` id with no one-line gloss right after
  it, so a reader cannot tell what it says without opening another file;
- **D-local outside home:** an item-local `D<n>` id cited anywhere outside its own
  `CONTEXT.md`. A D-local id is never cited outside its home, gloss or not; the fix
  is to inline the content and drop the id (decision 0017).

Used by whoever maintains `plans/backlog/` and the platform specs (a human operator or
an agent doing grooming), and by `npm run check:before-merge`.

The check used to have a third family, **dead framing**: a line citing a decision that
had since been superseded, without naming its successor. It was retired on 2026-11-22
(see Decision history). Which decisions are in force will come from the documentation
area's pkm view ([document identity 8.2](../documentation/subcomponents/document-identity/spec.md#82-the-search-view)),
not from this check.

## Entry Points & Triggers

- `node scripts/check-decision-citation-drift.mjs` from the product repo root.
- `npm run check:before-merge` runs it with `--skills-dir plugins/fgOS/skills`.
- Optional flags: `--backlog <path>` (default `plans/backlog`, a file or a directory of
  Markdown files), `--specs-dir <path>` (default `docs/platform`), `--skills-dir <path>`
  (repeatable), `--baseline <path>` (default
  `scripts/check-decision-citation-drift.baseline.json`) and `--write-baseline`.

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Cited id | An id referenced in a scanned line | `ADR<n>`, `RUL<n>` or `D<n>` | — | — |
| 2 | Gloss | A parenthetical right after the id that explains it in words | not just other id tokens or punctuation | — | — |
| 3 | Finding | One flagged citation | `{kind: "bare-citation" or "d-local-outside-home", file, line, id, text, message}` | — | — |
| 4 | Baseline | Known findings, keyed by file, kind, id and full line text, counted per occurrence | JSON object | — | the checked-in baseline |
| 5 | Scan scope | Which files are scanned | the backlog path, the area `spec.md` files, decision narratives and `platform-foundations.md` under the specs root (history trees excluded), and every `--skills-dir` tree | — | `plans/backlog` + `docs/platform/**` |

## Behaviors & Operations

### Run the citation scan

- **Runs when:** an operator or agent invokes it, or `check:before-merge` runs.
- **What changes:** nothing; `--write-baseline` is the only mode that writes, and it writes only the baseline file.
- **Afterwards:** "no findings" or "no new findings (N baselined)" exits 0. A finding not in the baseline is listed and the process exits 1. No line is edited automatically.

### Write-time sweep for `fgos decision --relation supersedes:<id>`

`collectWideSourceFiles` and `findWideCitationFindings` are exported for the `decision`
verb. After a `supersedes` write, it lists citations of the old id under `docs/`, `src/`,
`plugins/`, `core/skills/` and `domains/` that do not also name the new decision. The list
is reported, never refused. `touches:<id>` and `amends:<id>` leave the target in force, so they
run no sweep.

## Actors & Access

| Capability | Operator (manual run) | `check:before-merge` |
|---|---|---|
| Run the scan | yes | yes |
| See findings | yes (console output) | yes |
| Auto-fix a finding | never: detection only | never |

## Business Rules

- **R1.** An `ADR<n>` or `RUL<n>` citation without a gloss is a finding.
- **R2.** A `D<n>` citation outside its own `CONTEXT.md` is a finding, glossed or not.
- **R3.** A bare 4-digit id with no `ADR`, `RUL` or `D` prefix is not detected.
- **R4.** The scan never reads `history/` trees, and skips skill directories that git ignores.

## Open Gaps

- No auto-fix: a gloss must be added by hand, and the check cannot judge whether a gloss is correct ([how-to](../../how-to/fix-bare-citation-findings.md)).

## Decision history

- 2026-11-22: the dead-framing family was retired. It read `superseded_by` from
  `docs/decisions/NNNN-*.md` front matter, and that corpus was retired by tsk-1lv-4, so
  its map was always empty and it could never fire (the checked-in baseline held 0
  dead-framing entries). The pkm roles probe
  ([report](../../../plans/reports/research-261122-0828-docos-pkm-roles-probe-effective-decisions.md))
  showed that decisions in force need explicit ids and role fields, which the
  documentation area's pkm view computes. The `--decisions-dir` flag went with it.

## Pointers (implementation)

- `scripts/check-decision-citation-drift.mjs`: pure functions (`isGlossed`,
  `findCitationFormatFindings`, `findNewFindings`, `baselineFromFindings`,
  `collectWideSourceFiles`, `findWideCitationFindings`) and a thin CLI (`runCli`). It
  stages the native addon in its main-only entry (`ensureAddonForScript`), so it runs from
  a checkout.
- `test/scripts/check-decision-citation-drift.test.mjs`: the owning tests.
- `test/state/decision-relation.test.mjs`: the write-time sweep through the `decision` verb.
