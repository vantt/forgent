---
phase: 1
title: "YAML frontmatter through the YAML door; the hand-written parser and writer deleted"
status: pending
effort: 1.5d
leak: "census rank 1"
startAfter: ["F0 wave A on main"]
landAfter: ["capability plan on main (bin/fgos.mjs, test/architecture.test.mjs, test/test-ownership.mjs, test/suite-baseline.json)"]
---

# Phase 01: YAML frontmatter through the YAML door

<!-- Red team 2026-11-14: parseYaml call shape, addon loading for checkout scripts, standalone skill scripts, version type, specs naming the deleted tools. -->

Rules: `phase-lead-rules.md` (this directory). pNN = `p01`; report slug `odd-p01-yaml-frontmatter`; no Rust.
Facts: `phase-00-facts.md` "Leak 1".

## Outcome

Only the YAML door (`src/util/yaml.mjs` over `fgos-yaml-doc`) decides what a frontmatter block means. One function cuts
the block and parses it; every reader calls it. `src/report/frontmatter.mjs` is gone, and so are the finished migration
tools that were its only writer. No flat subset survives (census Q4 settled in phase 00).

## Requirements

1. `src/util/yaml.mjs` gains one export, `readFrontmatter(text, file)` -> `{ meta, body }`: no block gives
   `{ meta: {}, body: text }` (today's `parseFrontmatter` answer); a block is parsed with `parseYaml(blockText, { filename: file })`; a
   refusal throws `YamlParseError` naming the file. CRLF is handled as `frontmatter.mjs` handles it today (`13315c352`).
   A block that parses to a non-mapping is a `YamlParseError`.
2. Move every reader to it, file by file, keeping each caller's output:
   - `bin/fgos.mjs:2783` (`authoritative-match`), `src/report/enduser-index-generate.mjs:68`, `src/report/knowledge-lints.mjs:62`,
     `scripts/check-decision-citation-drift.mjs:235`, `scripts/check-decision-supersession.mjs:123`.
   - Callers that scan a directory (`enduser-index-generate`, `knowledge-lints`, `authoritative-match`) catch `YamlParseError`
     per file and report it naming the file (a lint finding in `knowledge-lints`; a refusal line for the generator and the verb).
     Never treat an unparseable block as "no frontmatter".
   - The block cutters: `src/setup/skill-wrappers.mjs` (`FRONTMATTER_PATTERN` :27, `extractFrontmatter` :86 and its four
     callers; the `version:` line regex at :241 reads `meta.version` from `readFrontmatter` instead; an unquoted
     `version: 1.10` arrives as the number 1.1, so a non-string version is treated exactly as a missing version line is today
     and a warning names the file and asks to quote it; test the `1.10` vs `1.9` vector),
     `src/setup/instruction-registry.mjs:94,167`, `scripts/lib/git-spawn-match.mjs:85-87`. Where a caller needs the raw fenced
     text (skill-wrappers copies the block into a generated wrapper), add `block` (the fenced source, fences included) to the
     result of `readFrontmatter` rather than keeping a second regex. One cut rule, one place in product code.
   - Scripts that now read YAML from a checkout must load the addon the way the existing YAML scripts do: call
     `ensureAddonForScript()` (`scripts/lib/git-addon-stage.mjs:83-86`) inside the script's main-only entry, never at module
     scope (`src/state/retrospective-doors.mjs:23` imports `check-decision-citation-drift.mjs`, and `bin/fgos.mjs:43` imports
     that module: a module-scope call would build Rust on every `fgos` start). This applies to
     `check-decision-citation-drift.mjs` and `check-decision-supersession.mjs`. Product callers (`bin/`, `src/`) run inside a
     release and need nothing. Gate: run `node scripts/check-decision-citation-drift.mjs` in a fresh linked worktree with no
     `FGOS_*` variables set; it must pass (cost: one incremental `cargo build -p fgos-node-addon`, state it in the report).
   - Shipped standalone skill scripts are outside the one-door boundary (skills marked `oneDoor: standalone`, owner decision
     2026-10-20) and cannot reach the payload's addon in a user's project: `core/skills/distill/scripts/distill.mjs:93-188`
     (own `parseFrontmatter`) and `core/skills/instruction-audit/scripts/instruction-audit.mjs:90-91` (own cut) stay, named in
     the row's `allowed` with that reason.
3. Fix the docs whose frontmatter is not YAML (phase 00 list): quote the scalar or use a block scalar so the parsed value is
   the text the flat parser returned. Confirm the full list by running `readFrontmatter` over every tracked `*.md` under
   `docs/`, `core/`, `domains/` and recording the refused files in the report; fix each one. `docs/distillery/deep-dives/fgos-harness-architecture.md:7`
   (folded block) now yields the full text: correct, record it.
4. Delete `src/report/frontmatter.mjs`, `scripts/knowledge-migration.mjs`, `scripts/knowledge-classifier.mjs` (verify first:
   `rg -l "knowledge-classifier|knowledge-migration" src scripts bin apps packages .githooks package.json .github` shows no
   importer or runner other than each other; if one appears, stop and ask the big lead).
5. Supersede the recorded "keep the helper" decision, never edit it in place: resolve the holder through
   `docs/platform/governance.md#decision-scope-to-holder-table` (expected: the YAML Document spec's decision-history section),
   add the entry (mint any number with `fgos identity mint d-adr` if the holder numbers its entries) citing the census and the
   owner approval of 2026-11-14, and point `docs/platform/packaging-distribution/spec.md:827` and
   `docs/platform/yaml-document/spec.md:43,177` at it. Update the other doc mentions (phase 00 list) to the door, and the
   specs and comments that still describe the deleted migration tools as live: `docs/platform/git/spec.md:724,726`
   (knowledge-migration in the ScopedCommit census mapping), `docs/platform/documentation/spec.md:126` (classifier),
   `src/state/knowledge-registry.mjs:45`, `scripts/knowledge-canary.mjs:16` (comments): say they were removed with the helper.
6. `doors` row (new, `kind: door`), no debt:
   `{ job: "read a YAML frontmatter block", patterns: ["\\b(?:parseFrontmatter|renderFrontmatter|extractFrontmatter)\\b", "\\bFRONTMATTER_PATTERN\\b", "report/frontmatter\\.mjs"], allowed: [{path:"core/skills/distill/scripts/distill.mjs", reason:"standalone shipped skill script; runs in user projects without the fgOS addon"}], reason: "only src/util/yaml.mjs readFrontmatter cuts and parses a frontmatter block" }`
   plus a pattern for an inline frontmatter cut regex (a `^---` regex source) if the check's JS lexer keeps regex-literal text;
   if it blanks it, say so in the row reason (the limit is known). `src/util/yaml.mjs` holds the one cut and is `allowed` if
   that pattern catches it; `instruction-audit.mjs` likewise with the standalone reason. If a pattern catches an unrelated use,
   narrow it and say so.

## Files

- Modify: `src/util/yaml.mjs`, `bin/fgos.mjs` (import + the `authoritative-match` hunk only), `src/report/enduser-index-generate.mjs`,
  `src/report/knowledge-lints.mjs`, `scripts/check-decision-citation-drift.mjs`, `scripts/check-decision-supersession.mjs`,
  `src/setup/skill-wrappers.mjs` (frontmatter parts only; its temp names are phase 15's), `src/setup/instruction-registry.mjs`,
  `scripts/lib/git-spawn-match.mjs`, the docs of requirement 3, the spec/doc lines of requirement 5,
  `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks), `docs/architecture-manifest.json`
  (file row of the deleted module at :238; the new `doors` row), `test/architecture.test.mjs` (`ARM_STATIC_IMPORTS` line :1775),
  `docs/platform/git/spec.md`, `docs/platform/documentation/spec.md`, `src/state/knowledge-registry.mjs` (comment), `scripts/knowledge-canary.mjs` (comment),
  `test/test-ownership.mjs:49`, `test/suite-baseline.json` (rows of deleted test files), `docs/reading-map.md:170`.
- Delete: `src/report/frontmatter.mjs`, `scripts/knowledge-migration.mjs`, `scripts/knowledge-classifier.mjs`,
  `test/report/frontmatter.test.mjs`, `test/scripts/knowledge-migration.test.mjs`, `test/scripts/knowledge-classifier.test.mjs`.
- Regenerate: `packages/git/contracts/mutation-census.v1.json`.
- Tests: the owning proof of `readFrontmatter` goes in the existing YAML door test (`rg -l "parseYaml" test/util test/native` -> the
  file that owns `src/util/yaml.mjs`): no block; a block; CRLF; a refused block names the file; a non-mapping block is refused;
  `block` returns the fenced text. One wiring case per scanning caller that a refused doc is reported by name
  (`test/report/enduser-index.test.mjs`, the knowledge-lints test). Retired: `frontmatter.test.mjs` cases "never throws on
  malformed input" (behaviour removed on purpose) and the round-trip cases (writer removed); its block/no-block/ADR-shape cases
  move to the YAML door test (new owner). `knowledge-migration.test.mjs` and `knowledge-classifier.test.mjs`: behaviour removed.
- Net size: src/scripts about -550 (helper ~100, migration ~350, classifier ~100, cutters -30, door +25); tests about -600, +60.

## Gates

`node scripts/run-tests.mjs` on: the YAML door test, `test/report/enduser-index.test.mjs`, the knowledge-lints test,
`test/scripts/check-decision-supersession.test.mjs`, the citation-drift test, `test/setup/skill-wrappers.test.mjs`,
`test/skills/fgos-mirror.test.mjs`, `test/setup/instruction-registry.test.mjs`, `test/setup/instruction-projections.test.mjs`,
`test/git/one-door.test.mjs`, `test/setup/git-mutation-census.test.mjs`, the `authoritative-match` CLI test
(`rg -l authoritative-match test`), `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`; plus `npm run build:skills`
leaves no diff (skill wrappers unchanged byte for byte) and `node scripts/check-decision-citation-drift.mjs` passes.

## Risk and rollback

- A doc refused by YAML aborts a generator (M x M): per-file catch and the doc sweep of requirement 3.
- Skill wrapper bytes change (M x M): `build:skills` diff must be empty.
- Pre-commit reaches `readFrontmatter` through `git-spawn-match.mjs` (L x H): it already reached `parseYaml` there; keep its
  `YamlParseError` handling identical.
- Rollback: revert the phase.
