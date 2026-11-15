# Phase 13 report: raw config read through the facade

## Result
- `src/config/facade.mjs`: new `readProjectConfigSource(dir)` -> `{ path, format, text } | null` (YAML wins over JSON; null when absent or unreadable).
- `src/setup/runner-config-conversion.mjs`: `findProjectConfigFile` and the two raw reads in `convertRunnerPatternsConfig` removed; format check uses `source.format`; `discardUnusedBackup` re-reads through the facade and compares with the text the copy was made from (no direct reads of target or backup).
- `doors` row "locate and read a project config file" added with `retiredBy` S7 and no debt.
- Row `allowed` as the real check finds it: `src/config/facade.mjs`; `src/runner/dispatch/config.mjs` (display name); `src/setup/runner-config-conversion.mjs` (names the global file in a notice default; reads nothing); `packages/config/rust/src/files.rs`, `machine.rs` (crate owns the names). Debt: none.
- Census regenerated (`--write-census`), 0 undeclared sites.
- Tests: new facade case (none / json / yaml over json); conversion tests unchanged and green.

## Gates (green)
runner-config-conversion, config/facade, architecture, doc-health, git-mutation-census, dispatch-config-patterns, settle-legacy-config, mailbox-behaviour-v7n; citation drift (57 baselined, none new); git-one-door scan 0 undeclared. No file of the frozen V7n addendum touched.

## Concerns
- `retiredJsonAdvice` (conversion file) keeps one `fs.readFileSync` of an explicit path when `parsed` is not given: its caller `src/setup/registrations.mjs:534` passes global-scope files too, which `readProjectConfigSource(dir)` cannot serve, and registrations.mjs is outside this phase. The line names no config file literal, so the door row does not see it. Follow-up if the owner wants it gone.
- Spec listed an allowed row for `src/verbs/merge/iron-law-level.mjs`, `seat-binding-checks.mjs`, `settle-legacy-config.mjs`, `apps/fgctl/src/help.rs`, `scripts/ci-external-consumer.sh`: none matches the patterns on current main, so none is listed (would be stale).

## CHANGELOG
None (internal).

## Lessons
- The door check reads string literals only; a raw read through a variable path is invisible to it.
- Row `allowed` lists must come from running the check, not from the census: half of the census names no longer match.
- Moving a read before the validating load check is harmless here, but keeps order identical only if text is not needed earlier.

## Authority
None.
