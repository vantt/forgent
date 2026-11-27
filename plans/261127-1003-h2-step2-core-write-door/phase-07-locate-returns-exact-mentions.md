---
phase: 7
title: "Locate returns exact mentions beside the ranked candidates"
status: draft
dependencies: []
---

# Phase 7: locate returns exact mentions beside the ranked candidates

## Inputs

- `plan.md` decisions D7, D8 and facts F14, F15, F16, F17; gaps G3, G6, G7 (what this phase does not do).
- `packages/documentation/rust/src/port.rs` (`Query`, `Part`, `Answer`, `Locator`), `locate.rs` (the use case),
  `profile.rs` (`excluded_globs`, the corpus definition), `pkm.rs` (the adapter; untouched unless the corpus walk
  is shared from there).
- `packages/documentation/rust/tests/locate.rs` and `tests/fixtures/vault/` (the owning tests).
- `apps/fgos/src/wiring/doc_locate.rs`: `REPEATED_FLAGS`, `project_request`, `answer_locate`, `human`,
  `locate_record`, `DETAIL_REDACTION_REV`.
- `packages/documentation/rust/observe-kinds.json` (the declared attrs and measures of `fgos.doc.locate`).
- Document identity spec 8.1, 8.2 (what locate returns; scores never returned).

## Footprint

`packages/documentation/rust/src/**`, `packages/documentation/rust/tests/**`,
`packages/documentation/rust/observe-kinds.json`, `apps/fgos/src/wiring/doc_locate.rs`.

`src/cli/command-registry.mjs` and the exported contracts are phase 1's: phase 1 declares `--exact` there.

## Steps

1. **Port.** In `port.rs`, add `Query.exact: Vec<String>` and `Part.mentions: Vec<Mention>`, where
   `Mention { term, total, truncated, sections: Vec<MentionAt> }` and
   `MentionAt { path, section: Vec<String>, line, missed_by_search }` (serialised camelCase), plus `Part.dropped_terms`
   when more than `TERMS_MAX` terms were found. Constants `TERMS_MAX = 16`, `MENTION_SECTIONS_MAX = 20`,
   `TERM_MIN_CHARS = 3`. Add a `MentionScanner` trait: `scan(&self, terms: &[String]) -> Result<Vec<Mention>, ...>`.
   Nothing in the port names a file system or pkm.
2. **Terms.** A pure function in the use case: backticked spans of one part (trimmed, at least `TERM_MIN_CHARS`,
   deduplicated in order of first appearance), then the `--exact` strings; cut at `TERMS_MAX` and count the rest.
3. **Filesystem adapter.** Walk the corpus root with the same exclusions as the profile (share `excluded_globs`
   rather than copy it; design principle 1), read each Markdown file, find each term as a literal substring, and
   record the enclosing heading path and line. One read of each file per call, all terms checked in that pass. Keep
   at most `MENTION_SECTIONS_MAX` sections per term, set `total` and `truncated`. Paths carry the `docs/` prefix,
   as candidates do.
4. **Use case.** `locate` takes the scanner next to the locator. After the locator answers (or answers `partial`
   with no candidates), it scans each part's terms and sets `missed_by_search` on every section whose path is not
   among that part's candidates. The scan runs even when the index is not ready; a scan failure leaves `mentions`
   empty and adds a sentence to `action`, never fails the call.
5. **Wiring.** `--exact` joins `REPEATED_FLAGS` and fills `Query.exact`. The human output prints, under each part's
   candidates, the mentions with the `missed by search` mark first. The record:
   - attrs/measures `fgos.doc.locate.mentions` and `fgos.doc.locate.missed_by_search` (counts), declared in
     `observe-kinds.json`;
   - `detail` lists the paths of `missed_by_search` sections after the top paths; never a term, since terms are
     draft text;
   - `DETAIL_REDACTION_REV` becomes `doc-locate-draft-digests.v2`.
6. **Tests** (extend `tests/locate.rs` and the module tests; one owning proof per behaviour):
   - a term found in a fixture document the fake locator did not return gives `missedBySearch: true`;
   - a term in a file written after the index was built is found (the scan reads disk);
   - a term in more than 20 sections gives `truncated: true` and the right `total`;
   - an `--exact` term with spaces and punctuation is matched literally;
   - a term inside an excluded folder is not reported;
   - the record carries the counts and paths and no term text.
7. **Cost.** Time one call with ten terms over this repository's `docs/` and note it in the commit body.

## Verify

```bash
cargo test -p fgos-documentation
cargo test -p fgos doc_locate
npm run fgos:dev -- doc locate --draft "The write door records \`fgos knowledge attest\` with a locate file." --json
```

Pass: tests green; the dev call returns `mentions` for `fgos knowledge attest` with at least one
`missedBySearch` section or an explicit empty list, whatever the index state.

## Rollback

Revert the phase commit. `mentions` is additive in the answer; callers that ignore it are unaffected.
