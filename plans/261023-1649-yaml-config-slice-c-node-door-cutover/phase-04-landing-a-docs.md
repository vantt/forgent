# Phase 04: RUL101 supersession, spec status lines, landing A

Depends on 03. Suggested executor: haiku for the text, the lead for the landing. Shared files: `CHANGELOG.md`, `docs/specs/distribution.md`, `docs/platform/*` (board rows; post first, merge `origin/main` at start and end).

## Context

YAML Document spec section 10: RUL101 ("every YAML parse goes through one vendored js-yaml behind `src/util/yaml.mjs`") is superseded by a new decision id recorded in `docs/specs/distribution.md`'s "Lịch sử quyết định"; the one-door rule stays, the implementation behind the door becomes Rust. `distribution.md` today holds RUL101, RUL102 and RUL107 (the highest id found by `rg -o "RUL1[0-9][0-9]" docs`); phase 00 re-greps and takes the next free id (C21; this plan calls it `RUL<next>` and the commit message carries the real one).

## Files it may touch

`docs/specs/distribution.md` (a new bullet after the RUL107 line in the rules list, a new decision entry, the RUL101 bullet marked superseded by id and date; **do not delete RUL101's text**, its history is evidence), `docs/platform/yaml-document/spec.md` (header "Implementation status": Node door done; section 12 step 3 and 4 marked done; one history line), `docs/platform/component-boundary.md` (YAML Document row: Node door done), `docs/specs/reading-map.md` (the YAML Document line), `docs/backlog.md` (close p-8d04c7f1 "Watch js-yaml security advisories": the file is gone; note p-99951b9e progress), `CHANGELOG.md` (`## [Unreleased]`), board `plan.md` row CFG and `log.md`.

## Content

- **Decision entry** (Vietnamese in the existing history style, the rule line short): `RUL<next> (every YAML parse goes through the native door: one Rust parser behind src/util/yaml.mjs; supersedes RUL101)`. Before: a vendored js-yaml 5.4.3 bundle, hash-pinned, because a bare checkout had no `npm install`. Decision: `fgos-yaml-doc` (parser `saphyr-parser` 0.2.2, pinned and vendored under RUL107) is the only YAML parser; `parseYaml(text, { filename })` keeps its signature and calls the addon's `yaml` namespace with the `tool` profile; the architecture test fails on any YAML library import; no JavaScript fallback; `package.json#dependencies` stays empty. Consequence stated plainly: a process that cannot load the addon (bare checkout without the staged addon, a channel that does not ship it) fails every YAML read with the door's named error. Evidence: Slice A fixtures (136 cases), the parity run of phase 02 (documents compared, rejected set equal), commit ids of landing A. Rejected: keeping js-yaml beside the crate (two authorities for what YAML means, spec section 1 of the YAML Document spec), a JSON projection plus spawn (owner 2026-10-22, 3 to 40 ms per call against 12 µs). The upgrade procedure paragraph of RUL101 is replaced by a pointer to `packages/yaml-doc/upgrade-record.md`.
- **CHANGELOG `[Unreleased]`:** one line for the user-visible change (YAML in workflows, personas and units now parses through the native addon; a checkout without the staged addon cannot read YAML: run `fgctl init` or use `npm test`/`ensureGitAddon`; js-yaml removed; parse errors name rule, file, line and column and never echo input).
- Board `log.md` line for landing A: merge commit, counts (Rust added, Node added and removed, the vendored 3,614), the parity result, machines not yet activated.

## Steps

1. Read each file before editing; merge `origin/main`.
2. Write the text; verify every id, path and commit named against `git log` and the tree; verify links.
3. Final gates for landing A, sequential: `cargo test -p fgos-yaml-doc -p fgos-node-addon --jobs 4`, then `npm test`; record the exit code on the next statement each time.
4. Land: merge `cfg/slice-c-yaml` to main per the board's landing rules; post the log line; tell `lead:HARDEN`, `lead:DOC`, `lead:TEST` (the shared-file rows) that YAML parses through the addon.

## Owning proof

Text re-read against code and tests; no new test.

## Risk / rollback

Docs only; if landing A is reverted the decision entry is reverted with it (`git revert -m 1`).
