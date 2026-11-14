# F0 merge of origin/main, wave boundary 1

Branch `rust-verb-migration-program/f0-merge-main-1` (from f0 head dc6f99ef4), merge commit "merge: main into the F0 integration branch".

## Conflicts and resolutions

| File | Resolution |
|---|---|
| bin/fgos.mjs | import line: kept F0's (`isNativeInvocation`, `publicManifest`); main's side lacked `isNativeInvocation`, which F0 code below still calls. |
| scripts/export-command-selectors.mjs | import line: kept F0's (`parseShape`); main's `HELP_SELECTORS` is retired and no longer used in the file. |
| src/setup/bin-discovery.mjs | import union: main's `installationDir` from host-bin-path plus F0's `globalFgosDir` from the config facade (both are used). |
| docs/architecture-manifest.json | five hunks. Kept every row from both sides: main's "civil date arithmetic", "process identity: start time of a process", "installation shim and activation record location", "agent definition tier directories", "read a YAML frontmatter block", "writer and session id environment" rows next to F0's help, retired-native, lane, invocation-root, global-dir, admission, twin and Event Store rows. No duplicate keys. "verb manifest projection" bin/fgos.mjs reason: F0 wording. Three debt entries in "process facts: read /proc" (git worktree.rs, git node-addon single_load.rs, terminal-control herdr.rs) were dropped: main moved those reads onto fgos-process, and the door test reported them stale. |
| packages/git/contracts/mutation-census.v1.json | generated: took ours, regenerated with `node scripts/git-one-door-scan.mjs --root . --write-census`; scan reports 0 undeclared. |
| command-routes.json, command-manifest.json | not conflicted; regenerated with `node scripts/export-command-selectors.mjs`, `--check` passes. |
| CHANGELOG.md, Cargo.lock | merged cleanly (no conflict); `--locked` builds pass. |

## Adaptations

No main code used a retired F0 name (nativeOnly, native_kinds, HELP_SELECTORS, NATIVE_HOOK_KINDS, publicManifestEntries): `git grep` finds only historic citation text in the drift baseline. Main's deletion of src/report/frontmatter.mjs and the knowledge scripts came through unchanged. The only manifest edit beyond a union is the three stale debt entries above.

## Gates

- cargo build --locked --release --workspace: pass
- cargo fmt --all --check: pass
- cargo clippy --locked --workspace --all-targets -D warnings: pass
- cargo check --locked --workspace for x86_64-pc-windows-msvc and aarch64-apple-darwin: pass (msvc shows pre-existing warnings: vendored arraydeque lifetimes and an unused `mut` at packages/distribution/rust/src/fetch.rs:316)
- export-command-selectors --check, git-one-door-scan: pass, 0 undeclared
- Focused node tests (architecture, rust-host/*, fgos-manifest, parse-args-vectors, git-mutation-census, doc-health, citation-drift): 316/316
- 50 more files (every test that references a conflicted file or command-registry, plus every test file main changed): all pass; the two non-test files in the list (a fixture and suite-baseline.json) were fed to node by mistake and are not failures.
