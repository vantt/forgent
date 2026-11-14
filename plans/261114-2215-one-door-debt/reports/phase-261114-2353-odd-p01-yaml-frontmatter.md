# Phase report: YAML frontmatter through the YAML door (leak 1)

Branch `one-door-debt/p01`, cut from origin/main 3cd0b8c41. Worktree `/home/vantt/projects/forgent-worktrees/odd-p01`. No Rust touched, no Cargo target.

## What changed

- `src/util/yaml.mjs` gains `cutFrontmatter(text)` -> `{ block, source, body }` (cut only, never throws) and `readFrontmatter(text, file)` (cut, then parse) -> `{ meta, body, block }`. It is the one fence cut and the one parse. No block: `{ meta: {}, body: text, block: '' }`. Empty block: empty meta. Refused block or non-mapping block: `YamlParseError` naming the file (rule `frontmatter-not-a-mapping` for the second).
- Readers moved: `bin/fgos.mjs` (`authoritative-match`), `src/report/enduser-index-generate.mjs`, `src/report/knowledge-lints.mjs`, `scripts/check-decision-citation-drift.mjs`, `scripts/check-decision-supersession.mjs`, `src/setup/skill-wrappers.mjs`, `src/setup/instruction-registry.mjs`, `scripts/lib/git-spawn-match.mjs`.
- Refusals are reported by file, never read as "no frontmatter":
  - `fgos authoritative-match`: validation refusal (exit 4) listing every refused file.
  - `enumerateDocEntries` (so `fgos docs-index`): throws one error listing every refused file, so no partial index is written.
  - `knowledge-lints`: new `doc-frontmatter-refused` lint (level `fail`).
  - skill-wrappers: `generateWrapperContent`, `withGeneratedHeader` and `carriesStamp` use `cutFrontmatter` only (they copy bytes, so a user skill whose frontmatter is not YAML, such as `description: Use when: ...`, still gets its wrapper; a test pins it); `skillVersion` warns on stderr naming the file and ignores that version. `metadata.version` is read as before (the old regex matched the indented line); a non-string version (unquoted `1.10`) is ignored with a warning that asks to quote it. Test pins `"1.10"` newer than `"1.9"` and the unquoted case.
- The two check scripts call `ensureAddonForScript()` only inside their main-only entry (never at module scope: `bin/fgos.mjs` imports the drift module). They print a refusal and exit 1 on a `YamlParseError`.
- Deleted: `src/report/frontmatter.mjs`, `scripts/knowledge-migration.mjs`, `scripts/knowledge-classifier.mjs`, and their three test files. Importer check before deleting: only each other plus comments in `knowledge-canary.mjs` and `knowledge-registry.mjs` (fixed) and one fixture jsonl that merely contains the words.
- Rows and registrations removed: `ARM_STATIC_IMPORTS` line, manifest file row, `test-ownership` row, three `suite-baseline` rows. `ARM_STATIC_IMPORTS` gained `../src/util/yaml.mjs` (the shell entry now imports the door statically for `authoritative-match`).
- Docs: nine invalid-frontmatter docs fixed; decision entry added; spec and doc mentions updated (below).

## Doc sweep (requirement 3)

`readFrontmatter` over every tracked `*.md` under `docs/`, `core/`, `domains/` (2962 files) refused exactly nine, all as phase 00 predicted:
`docs/distillery/deep-dives/{compound-engineering,routing,state}.md`, `docs/explanation/{compound-learn-artifact-registry,settleclaim-revision-drift-self-caused,unsignaled-detection-backtick-false-positive}.md`, `docs/knowledge/{fgos-list-s-side-log-scoping/fgos-list-side-log-scoping,fgos-show-id-output-fields/fgos-show-verb-output-fields,fgos-triage-table-columns/triage-table-columns}.md`.
Each offending scalar is now a double-quoted string; a script compared old-parser and new-parser meta for every key of those nine files: no difference. Over all 2962 files the new meta differs from the old flat meta only where the old one was wrong (folded `>-` blocks and nested maps in skill files, `specificity: 10` now a number, `user-invocable: false` now a boolean, `fgos-harness-architecture.md` folded block now full text). No field a caller reads (`mode`, `authoritative_for`, `superseded_by`, `supersedes`, `type`, `version`) changed.
Outside the reader scope, three `.claude/agents/council-*.md` and about eight files under `plans/` also carry non-YAML frontmatter; no caller of `readFrontmatter` reads those trees, so they are untouched (item for the owner if a future reader scans them).

## Decision supersession

Holder: `docs/platform/packaging-distribution/spec.md` "Lịch sử quyết định" (it holds the RUL101/RUL108 YAML entries; the YAML Document spec points there). New first entry dated 2026-11-14, no new RUL number minted (the holder dates entries; none of the nearby YAML entries minted one for a clause supersession). It cites the census and the owner approval of 2026-11-14. Pointers added: the "Kept on their own paths" clause of the 2026-10-16 entry, `docs/platform/yaml-document/spec.md` section 9 table row, section 10 bullet, and one line in its decision history. Deleted-module mentions in `git/spec.md`, `documentation/spec.md`, `knowledge-registry.md`, `decision-citation-drift/spec.md`, `proposals/knowledge-registry-redesign.md`, `reading-map.md`, and two code comments now say removed or point at the door. Backticks were dropped around the deleted paths (doc-health flags a backticked path that does not exist).

## `doors` row

New row `read a YAML frontmatter block` (kind door, `debt: []`). Patterns: the three retired names, `FRONTMATTER_PATTERN`, `report/frontmatter.mjs`, and the fence regex source `\^---\r\?\n`. The JS lexer keeps regex-literal text, so the fence pattern works; the row reason states the limit (a cut written without that regex, such as a split on a fence, is not seen).
Final `allowed`: `src/util/yaml.mjs`; `core/skills/distill/scripts/distill.mjs` and `core/skills/instruction-audit/scripts/instruction-audit.mjs` with the reason "standalone shipped skill script; runs in user projects without the fgOS addon". `debt`: none. The row passed `checkDoors` on first run, no stale entry.

## Gates (all through `node scripts/run-tests.mjs`)

Green: `test/util/yaml.test.mjs`, `test/report/enduser-index.test.mjs`, `test/report/knowledge-lints.test.mjs`, `test/report/authoritative-match.test.mjs`, `test/report/decision-index.test.mjs`, both decision-script tests, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs`, `test/skills/knowledge-canary.test.mjs`, `test/setup/instruction-{registry,projections,composition}.test.mjs`, `test/setup/uninstall-project.test.mjs`, `test/git/one-door.test.mjs`, `test/setup/git-mutation-census.test.mjs`, `test/state/{decision-relation,knowledge-bootstrap,knowledge-registry}.test.mjs`, `test/distribution/native-addon.test.mjs`, `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`.
`node scripts/check-decision-citation-drift.mjs` passes in this fresh linked worktree with no `FGOS_*` variables (57 baselined, no new). Cost of the staging call: one incremental `cargo build -p fgos-node-addon`. `npm run build:skills` leaves no diff. Git one-door scan: 0 undeclared sites (same as base); census regenerated with `--write-census`.
Not green here, not caused by this change:
- `test/rust-host/release-tree.test.mjs` (4 cases) needs `cargo build --locked --release --workspace`; not run (heavy, ask first).
- `test/scripts/run-tests.test.mjs` (3 "real entrypoint" cases) fail with `ERR_MODULE_NOT_FOUND` for `scripts/lib/rust-source.mjs` imported by `scripts/git-one-door-scan.mjs` inside the test's copied scripts tree. Neither file is touched by this branch; not re-run on base, the big lead should confirm it is already red on main.

## Retired tests (new owner)

- `test/report/frontmatter.test.mjs`: block, no-block and ADR-shape cases moved to `test/util/yaml.test.mjs` (owner of `readFrontmatter`). "Never throws on malformed input" and the round-trip cases: behaviour removed on purpose (a refused block now throws; no writer left).
- `test/scripts/knowledge-migration.test.mjs`, `test/scripts/knowledge-classifier.test.mjs`: behaviour removed with the finished one-shot migration.
- `extractFrontmatter` cases in `skill-wrappers.test.mjs`: the fenced-block-verbatim and no-block cases moved to the yaml test; `fgos-mirror.test.mjs` reads `.block` through the door.
- One wiring case each for the scanning callers (`enduser-index`, `knowledge-lints`, `authoritative-match`) that a refused doc is reported by name.

## Behaviour notes for the reviewer

- `instruction-registry` keeps its own parse and its three refusals (missing block, parse failure, empty or non-mapping block); it only takes the cut from `cutFrontmatter`.
- The doors row fence pattern is `\^---(?:\\r\?)?(?:\\n|\\s|\$)`, which also catches `/^---\n/`, `/^---\s*\n/` and `/^---$/m`.
- Check-script fixtures (YAML strings only) now quote ids (`supersedes: ["0002"]`): YAML types an unquoted `0002` as a number, which the supersession check reports as "not a clean list of ids" and the drift check skips (it only accepts the string form). The decision corpus these scripts targeted is retired, so no real file is affected.
- `readFrontmatter` returns `body` from the original text (CRLF kept); the old helper returned an LF-normalised body. No caller used `body` except skill-wrappers, which needs the original bytes (wrapper output unchanged, `build:skills` diff empty).

## CHANGELOG lines for the big lead (`## [Unreleased]`)

- An unquoted `metadata.version` (such as `1.10`) in a project skill no longer protects it from being overwritten by `fgos setup`; a warning names the file and asks to quote the version.
- Removed: `scripts/knowledge-migration.mjs` and `scripts/knowledge-classifier.mjs`, finished one-shot migration tools that shipped in the payload.
- A document whose frontmatter is not valid YAML is now reported by file name by `fgos docs-index`, `fgos authoritative-match` and `fgos knowledge status` instead of being read as having no frontmatter.

## Authority

- Frontmatter cut and parse: `readFrontmatter` in `src/util/yaml.mjs` over the YAML door; guarded by the `read a YAML frontmatter block` row of `docs/architecture-manifest.json`. Decision text: `docs/platform/packaging-distribution/spec.md` "Lịch sử quyết định", first entry (2026-11-14).

## Lessons

- A row whose patterns are tokens of deleted code needs the deleted names in its patterns and an `allowed` entry for the door itself; the JS lexer keeps regex-literal text, so a fence regex source is a usable pattern.
- Swapping a lenient hand parser for the YAML door changes types, not just errors (`0002` and `1.10` become numbers): grep every fixture and every doc for unquoted numeric-looking ids before moving a reader.
- Cut-only callers (skill-wrapper stamp checks over foreign files) must not die on a refused block; decide per caller whether a refusal means "not ours", "warn and ignore" or "stop", and name the file in each.
- doc-health flags backticked paths to deleted files, including inside decision-history prose; write removed paths without backticks.
- `check-decision-citation-drift.mjs --write-baseline` run without its default arguments gutted the baseline file; never use it as a "check if stale" probe.

Status: DONE_WITH_CONCERNS
