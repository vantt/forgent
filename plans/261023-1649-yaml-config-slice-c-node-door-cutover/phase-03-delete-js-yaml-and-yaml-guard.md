# Phase 03: Delete js-yaml and its hash test, rewrite the YAML guard, stage the addon for scripts

Depends on 02. Suggested executor: haiku for the deletions and manifest rows, sonnet for the guard and the scripts. Shared files: `test/architecture.test.mjs` (YAML section only here, config sections in 19), `docs/architecture-manifest.json`.

## Context

Spec: "the vendored `src/util/third-party/js-yaml.mjs` and its hash test are deleted in the same change"; "an architecture test: no import of a YAML library anywhere in `src`, `bin`, `scripts` or `test` other than the door". After phase 02 the door itself loads no YAML library, so the guard becomes stricter than today's: today the door may load `./third-party/js-yaml.mjs` (`architecture.test.mjs:1237` asserts exactly that).

## Files it may touch

`src/util/third-party/js-yaml.mjs` (deleted, 3,614 lines, counted apart), the hash test inside `test/util/yaml.test.mjs` (already gone in 02), `test/architecture.test.mjs` (the YAML block `:1176-1290`: `YAML_THIRD_PARTY`, `YAML_SPECIFIER`, `findYamlParserLoads`, `hasYamlBundleSignature`, the two tests), `docs/architecture-manifest.json` (the `src/util/third-party/js-yaml.mjs` row `:208`), `test/rust-host/release-tree.test.mjs` (`:63-76`: the vendored list and the import of the door from a staged tree), `.github/cargo-deny.toml` (bans), `scripts/project-agents.mjs`, `scripts/build-domain-registry.mjs`, `scripts/lib/git-spawn-match.mjs` (only those phase 00 proved run outside a release payload).

## Design

- **Guard.** The set of specifiers stays (`yaml`, `js-yaml`, `yaml/*`, any `third-party/js-yaml.mjs`), the allowed-loader exception is removed: the door file is scanned like every other file and must load nothing; `hasYamlBundleSignature` stays (a pasted copy of the parser is still caught). The test that asserted the door loads `./third-party/js-yaml.mjs` becomes "the door loads `../native/door.mjs` and no YAML library". `src`, `bin`, `scripts`, `test` and `core` are scanned as today.
- **Rust side of the same guard.** `.github/cargo-deny.toml` `[bans]` denies `serde_yaml`, `serde_yml`, `yaml-rust`, `yaml-rust2`, `serde_yaml_ng`, `unsafe-libyaml`; the only YAML parser crate in the workspace is `saphyr-parser` behind `fgos-yaml-doc` (`Cargo.toml:68`, `packages/yaml-doc/rust/Cargo.toml:10`). `cargo deny --config .github/cargo-deny.toml check advisories bans sources` runs in CI (`release-assets.yml:29`).
- **Scripts outside a release (C19).** A script that parses YAML and is run from a bare checkout calls `ensureGitAddon(process.env)` from `scripts/lib/git-addon-stage.mjs` before its first `parseYaml` (the leaf the launcher and the git scripts already use; it builds once, then reuses the digest-keyed stage). The test launcher already stages the addon for every child (`scripts/run-tests.mjs:121-130`), so `git-spawn-match.mjs` as a preload needs nothing if phase 00 shows it runs inside that env. A README line in `scripts/` and the CHANGELOG (phase 04) say a focused `node --test` needs the staged environment.
- `package.json#dependencies` stays empty; `release-tree.test.mjs` no longer lists the vendored file as payload and gains one assertion that a staged tree's `src/util/yaml.mjs` imports `../native/door.mjs` only.

## Steps

1. Merge `origin/main`; `rg -n "js-yaml|third-party" src bin scripts test core --glob '*.{mjs,cjs,json}'` as the edit list (L10).
2. Delete the file, edit the guard and the two other tests, the manifest row and `cargo-deny.toml`; add `ensureGitAddon` calls where phase 00 listed them.
3. `rg -n "js-yaml|third-party/js-yaml|loadAll" src bin scripts test core --glob '*.{mjs,cjs}'` finds nothing; `cargo deny ... check bans` clean; `node scripts/build-skill-wrappers.mjs --check` and `node scripts/build-domain-registry.mjs --check` (or the repo's equivalent dry runs, phase 00 names them) pass in a bare worktree.
4. Run the architecture test and `release-tree.test.mjs` through the launcher; then `npm test` once, sequentially after `free -g` (this landing changes how every YAML read works; run it fully before landing A).

## Owning proofs

`test/architecture.test.mjs` YAML guard (the one owner of "no YAML library anywhere"); the guard's own self-test cases (`findYamlParserLoads` catches each way to load a parser) stay as they are; `release-tree.test.mjs` for the payload.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A bare-checkout script or doc command silently needed the vendored parser | M x M | phase 00 list; scripts stage the addon; CHANGELOG line; the doctor row text for a missing addon says what to run |
| The staged release tree still ships the deleted file | L x M | `release-tree.test.mjs` and the release builder list; phase 00 step 7 checks `prepare-release.mjs` |
| Backlog item p-8d04c7f1 (watch js-yaml advisories) lingers | L x L | phase 04 closes it |

## Rollback

Revert: the file, the guard and the manifest row return; the addon namespace stays unused.
