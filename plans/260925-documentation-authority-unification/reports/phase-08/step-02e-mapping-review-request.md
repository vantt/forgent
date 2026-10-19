# A50 replacement mapping review request — step 02e

Status: **AUTHOR PACKET; independent review pending.** This is the ONE request for
L12-21. `step-02c-mapping-review-request.md` and all 97 logical 02c parts are
**SUPERSEDED**. The 338 earlier per-edge parts remain superseded too. The 35
existing mapping reviews and replay report are retained as evidence; no old
request, report, census or correction file was edited. Review parts 36–97 of 02c
must not be dispatched.

Input source HEAD: `04366dfdd9a17640de87bb19a3929c846432541c`. Rules: owner-answers A49, A50, L12-7,
L12-10, L12-19, L12-20, and especially L12-21. Phase 8 Step 2 and its shared
rules still apply. No consumer rewrite, authority flip, semantic acceptance or
Step 2 closure is claimed.

## Volume and review contract

- Fresh tracked class boundary: **5,440 edges / 1,036 files**; before:
  5,427 edges / 1,036 files. **1,018 → 1,330 distinct mappings**.
  Old edge disposition is explicit for all 5,427 IDs. 5,403 old rows join
  regenerated units; 24 substring/code false positives are excluded with
  reason and source pins. New full-token/local-link enumeration also adds
  references missed by the former scanner. This is a regenerated population,
  not a count-preserving relabel of 02c.
- **94 logical parts / 5,159 entries**, overlaps intentional;
  at most 60 entries and 400,000 UTF-8 bytes per resolved part, including part
  metadata. Largest **397,442 bytes**. All part payloads are
  resolved from source tables through `step-02e-mapping-review-index.json`;
  no per-part payload files exist. Report names are reserved in that index:
  `review-a38-step-02e-map-part-NN.md` under this report directory. They are
  unique and must be authored only by Lead-started independent reviewers.
- **816 edges (15%)** are selected by portable SHA-256 ranking using
  seed `A50-step02e-L12-21-2026-10-19-v1`. Every mapping, every exception/control and every selected
  semantic edge is a mandatory deep read. Read every source/target passage and
  each action/rule/role variant in a mapping; a representative alone is not
  sufficient. Each part has at least ten deep reads, or all when fewer.
- One independent reviewer mechanically replays every file, edge, full unit,
  excluded prior edge disposition, mapping join, overlay and downstream
  exception/sample/review-part reference. Other reviewers deep-read the
  logical parts. Author checks are not independent acceptance.
- Rework above 3% expands the affected set to full review and returns review
  sizing to Lead. A sample breach expands semantic reading to all 5,440
  regenerated edges. No known systemic defect is sent onward for repetitive
  part-by-part review. Started **0**, accepted **0**, independent elapsed **0**;
  budget **unassigned**. Lead must size this actual volume under A38/A50.

## Artifacts and replay

1. `step-02e-parser.py`: plan-local **read-only** parser/compiler; stdout only.
   It re-enumerates tracked class-3 files and fails if the class boundary has
   additions/removals not accounted for. Each Markdown link is one physical
   unit; path-text label and destination share the destination identity and
   complete patch. Relative/repo-prefixed tokens, braces, whole-token bounds
   and physically wrapped inline references are explicit. JS operands and
   regex/minified false positives have exclusion reasons. Actual documentation
   string literals remain provenance or generated-source consumers.
2. `step-02e-census-maps-portals-prose.json`: full file hashes, physical spans,
   bounded context plus full call-site hashes, current switchboard route pins,
   roles/dispositions, generated-source routes, lookup-only alias IDs,
   non-executable successor notes and unchanged anchor API checks. No patch
   replaces a prefix/suffix. Parked rows carry no executable `new`.
3. `step-02e-distinct-mappings.json`: all effective reference/owner/anchor
   groups, full membership and hashes of the effective source rows.
4. `step-02e-review-data.json`: exception memberships, 15% seed/ranks, 197
   effective correction controls, prior failure/native annex and per-defect
   before/after counts, exact old IDs and examples. Detection sets overlap.
5. `step-02e-packet.py`: read-only deterministic packet compiler; stdout only.
6. `step-02e-replay.py`: full read-only replay plus parser and mutation probes.
   It reparses current bytes, reapplies chronological field-level correction
   precedence, checks corrected source spans directly, and regenerates every
   downstream mapping, exception, sample and part. A stale consumer of an
   overlaid row fails even when its old digest/span still matches.

From repository root, no fgOS CLI or git mutation:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02e-replay.py
```

To independently regenerate without writing in the repo, direct stdout to
`/tmp/fgos-work/` and compare parsed JSON. Run these sequentially:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02e-parser.py > /tmp/fgos-work/step-02e-independent-census.json
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02e-packet.py /tmp/fgos-work/step-02e-independent-census.json > /tmp/fgos-work/step-02e-independent-packet.json
```

`inputHEAD` records author inputs; after the runner commit replay compares all
source bytes and semantics while allowing that historical HEAD field to differ.
`sourceTablePins` pins exact serialized review-table bytes. `inputEvidencePins`
keeps all 35 prior part reports, replay, L12 decisions and old tables immutable.

## Exception sets (all deep-read)

| Set | Entries | Retiring-root consumer edges |
|---|---:|---:|
| preserve-pending-target | 626 | 395 |
| preserve-pending-behavioral-proof | 160 | 8 |
| phase9-row-flip | 53 | 0 |
| mechanical-target-failures | 9 | 3 |
| writers-and-writer-triage | 769 | 147 |
| behavioral-runtime-and-contract-triage | 1061 | 205 |
| semantic-roadmap | 4 | 2 |
| overlay-precedence-controls | 197 | 0 |
| prior-target-failure-dispositions | 104 | 0 |
| prior-anchor-check-failures | 21 | 0 |
| native-dynamic-patterns | 9 | 0 |
| seeded-semantic-edge-sample | 816 | 207 |

Retiring-root counts use consumer paths under `docs/specs/**` or
`docs/architect/**`, independent of reference spelling (L12-7). For annex/control
sets, zero means the annex has no direct consumerPath field; resolve each
contained effective/source row, never infer zero dependencies. Every one of the
104 former target failures is individually carried even where new full units
merge. Nine current target failures are placeholder paths, not passes. The 21
earlier anchor failures and nine native dynamic records are still open.

## Systemic regression diff

| Defect class | Before → after detected instances |
|---|---:|
| partial-reference-patch | 1312 → 0 |
| corrupted-reference-key | 192 → 0 |
| split-markdown-link | 168 → 0 |
| evidence-prefix-or-suffix-patch | 444 → 0 |
| prefix-inside-longer-token | 95 → 0 |
| code-token-as-path | 22 → 0 |
| unexpanded-brace-list | 2 → 0 |
| provenance-rewritten | 775 → 0 |
| migration-cell-path-substitution | 62 → 0 |
| generated-hand-patch | 40 → 0 |
| operative-read-to-area-portal | 51 → 0 |
| self-link-patch | 32 → 0 |
| verbatim-carriage-patch | 4 → 0 |
| authoritative-for-key-rewrite | 4 → 0 |
| reading-map-wrong-owner | 30 → 0 |
| evidence-wrong-mirror | 38 → 0 |
| live-writer-treated-as-navigation | 10 → 0 |
| checker-scope-treated-as-navigation | 12 → 0 |
| external-citation-with-fgos-owner | 103 → 0 |
| ui-compiler-self-reference-rewritten | 0 → 0 |
| roadmap-without-semantic-disposition | 4 → 0 |
| template-placeholder-rewritten | 4 → 0 |

Counts use the explicit predicates and populations recorded beside each class
in review-data; examples contain the old reference/patch and all corresponding
new IDs/actions. `partial-reference-patch` includes complete-link changes;
`evidence-prefix-or-suffix-patch` isolates the review's exact 444 subspan patches.
The prefix boundary count is the full **95**, tested against actual following
characters. The brace count includes truncated old keys (`{p6-probe.sh`) whose
full physical reference is a brace list. Zero after means the named detectable
systemic defect is absent under these predicates; it is not semantic approval.

## Required semantic judgments and limits

Provenance/source-locator headers and columns, pinned citations, audit redirects,
closeout lists and exact `authoritative_for` keys retain their text. Deleted
local citations have non-executable successor notes; unresolved successors are
named as such. The implementation-alignment lookup points to the conserved
retired-engine `#literal-snapshot`, with an actual anchor check, never a patch.
Migration-state cells require a Phase 9 row flip, including status and source
semantics. Generated projections route through their named sources in Step 5.
Operative read instructions use an exact retained file or park when that exact
passage cannot be established; the area README is not substituted for a read.
No executable patch introduces a self-link or points to a literal-snapshot
carriage. Existing verbatim carriage remains unchanged.

Reading-map references use `docs/reading-map.md`; the maps-01794 quotation stays
historical. Verification refs use the same-path platform prefix; all seven new
live writer/check cases and five L12-19 overrides remain Step 5 behavioral rows.
Checker scope commands/defaults need joint behavioral proof. Upstream citations
have no fgOS owner; ui-spec schema/config and shipped templates retain their
contract. Four host-invocation packaging roadmap sentences are whole-sentence
semantic judgments for Step 3, including the carried copies.

All earlier native inventory receipts/dynamic non-joins remain referenced,
without a second heavy export. Class-3 actual adoption, current-coordinate and
IO parity traces remain open. **Class 4 not started; stop at the class-3 boundary.**
No ignored/external/state/secrets export, installed-package proof, full suite,
gateway process, writer parity, Step 3 approval or post-cutover link check was
performed. No consumer/code/docs/checker/test/baseline/skill/switchboard edit,
protected-manifest write, git write or fgOS CLI call is authorized here.

The runner commits author artifacts. L12-11 then needs a separate Lead-owned
accounting commit for every actual commit/path pair in both unchanged Phase 6
manifests, followed by clean committed-byte acceptance. No commit ID is guessed.
