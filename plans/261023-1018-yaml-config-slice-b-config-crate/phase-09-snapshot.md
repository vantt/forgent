# Phase 09: Snapshot (layers, merge, provenance, cache, trusted root, detected, confined accounts)

Depends on 05, 06, 07. Suggested executor: sonnet. Independent sonnet review before landing (the merge-rule closure and the trusted-root rule are the load-bearing parts).

## Context

Spec section 5: `snapshot` returns the effective value of every described key and every undescribed key present in a file, the provenance of every value (`project`, `global`, `accounts`, `standard`, `detected`, with file, line, column when from a file) and the byte revision of each source. Rules: a read never writes; missing is not malformed; absent is not null; cache by content; environment facts are not defaults (`detected`); command values come from the trusted root; plain data (the no-prototype rule is Slice C's door, not this crate's). Section 3: ladder project over global over standard, `detected` between global and standard, only for keys whose descriptor says `absent: detected`; the accounts file is a source for its own keys only, not a layer of the ladder.

## Files it may touch

`src/snapshot.rs`, `src/cache.rs`, `src/detect.rs`, `contracts/fixtures/snapshot.v1.json`, `tests/golden_snapshot.rs`, `tests/cache.rs`.

## Design

- **Request (no defaults, no env reads):** `SnapshotRequest { project_root, trusted_root, global_dir, class: SessionClass }`; `project_root`, `trusted_root` and `global_dir` are plain paths the caller resolved (D2: the crate never guesses `$HOME`, never reads git). `SessionClass { Confined, Unconfined }` is the same type the write API uses (D3). `Detectors` is a trait with `detect(&[Segment]) -> Option<Value>` (D1); a `NoDetectors` impl is provided.
- **Sources:** project file at `<project_root>/.fgos/`, trusted copy at `<trusted_root>/.fgos/` when the roots differ, global at `<global_dir>/`, accounts at `<global_dir>/private/accounts.yaml` unless `class` is `Confined`. Each goes through phase 07 (`open_beneath`, `select_source`); a missing source is empty; a source that does not parse under `strict-config`, shadows (`config-legacy-shadowed`), is a symlink, or fails `judge` (phase 06) or `check` type findings (phase 05, everything except `undescribed`) fails the whole snapshot, listing every refusal with file, line, column and descriptor, never a value (D19: all-or-nothing, fail closed, same as a parse error; a malformed file never becomes an empty object).
- **Resolution helpers** (phase 03's `Descriptors::resolve`, D20): an entry that does not state `scope`, `sensitivity`, `file` or `merge` inherits it from the nearest ancestor entry (wildcards included), then the dialect default. This is how `gateway` as a whole is `global-only` and how `runner.executors.<any>` as a whole is `command`. (Phase 03 adds `resolve`; phase 06 and this phase consume it; lint's `descriptor-scope-implicit` still demands an explicit own `scope` on every non-public entry.)
- **Trusted root (rule 6):** the project layer is built from the caller's project file, then every path whose resolved `sensitivity` is `command` is replaced by the value at that path in the trusted file (or removed if the trusted file lacks it). Command values of the global file are used as they are. When the roots are equal nothing is replaced.
- **Layers, highest first:** project, global, accounts (keys disjoint by construction after `judge`), detected, standard. `detected` is filled only for `absent: detected` entries that no file set, by calling `Detectors`; the result sits in its own layer.
- **Merge:** `fgos_yaml_doc::merge(layers, &rules)`; the rule closure is `|path| descriptors.resolve(path).merge` (D-note: yaml-doc matches paths exactly, `packages/yaml-doc/rust/src/merge.rs:31`, so wildcard resolution happens here, in one function). Without a descriptor: mapping `deep`, sequence `leaf` (yaml-doc default; spec section 5 acceptance 5: lists are leaves). A `merge-type-mismatch` from the primitive surfaces as `config-schema` naming both layers.
- **Provenance:** `Merged.origins` (path, layer index) is mapped to `Provenance { layer, role, file, line, column }`, the span coming from the layer's `Document::span_of(path)`. Standard and detected carry no file. For command values taken from the trusted root the role says `project@trusted`. Undescribed keys present in a file are included (and flagged `described: false` for Slice D's unknown-key warning).
- **Revisions:** `Snapshot.revisions` = per source role the `revision()` of the bytes actually read (phase 07), `absent` for a missing source; this is what the write transaction receives as `expected`.
- **Confined:** no accounts source is opened; `Snapshot.accounts = UnavailableConfined`, which renders as `accounts: unavailable-confined` in provenance (spec section 9). A verb that leases an account calls `Snapshot::require_accounts()` which returns `config-accounts-unavailable-confined` in that state (the nested `fgos run` refusal, by name).
- **Cache (D15, D21):** `SnapshotCache` is a value the caller owns. `snapshot_cached(&mut cache, request, ...)` opens each source (phase 07), compares (size, sha256) and the bundle digest (phase 03) and the request, and reuses the previous snapshot when all are equal: one open, one read and one hash per source per call, which is the measured 24 µs budget. A snapshot that contains a `detected` value is never reused, because PATH is not a hashed source. A write by this crate invalidates by construction (the revision changes).

## Steps

1. Merge `origin/main`. Implement sources and the single-source judge pipeline, then layers and merge, then provenance, then cache.
2. Golden fixtures (about 36), each with inline descriptors and a file map the runner writes to a temp dir: precedence (project over global over standard, per key); a map merges per entry so one overridden capability inherits the others (spec acceptance 5); `replace` at a map; absent is not null (a present `null` wins, a missing key falls through); null switching off a standard entry where `values: [null]` allows it; lists are leaves; type mismatch between layers names both layers; undescribed keys kept with `described: false`; `detected` fills only an `absent: detected` key, ranks below global, never beats a file value, and is not applied to a key whose descriptor says `default`; project value on `gateway.*` is a refusal naming the global role (also `gateway: null`); command key from the trusted root while the worktree copy changes it (acceptance 13); accounts layer present for accounts-file keys and `config-key-in-wrong-file` when the same key sits in the project file; confined request has no accounts layer and `require_accounts` refuses by name; missing files are empty; a malformed global file fails and the error names the global role, line and column and no value; both `config.yaml` and `config.json` present; tombstone text present (ignored); provenance lines and columns for a nested key; a comment-only edit changes the revision and not the effective value (acceptance 6); plain-data equality: `__proto__` key in a file is refused by the profile (not Slice B's rule, one pass-through case documents it).
3. `tests/cache.rs` on real files: unchanged files reuse the snapshot (counted by a probe in the test through the public `CacheStats` returned by the API, not a test-only hook); content change with same size and same mtime misses; bundle digest change misses; a detected value bypasses; a different `class` or root misses; a write by another process is seen on the next call. Never a process-global (two caches in one test do not share).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Ladder, deep/replace/leaf, absent vs null, provenance, trusted root, confined accounts, errors | `golden_snapshot.rs` over `snapshot.v1.json` |
| Cache hit/miss rules | `tests/cache.rs` |
| `<any>` merge-rule resolution | the golden cases with `<any>` at three depths and a literal key that equals a descriptor key (no separate unit test of the closure) |

## Validation

`cargo test -p fgos-config --test golden_snapshot --test cache --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Trusted-root substitution misses a path inside a `command` subtree (e.g. `runner.executors.x.invocations[0].args`) | M x H | substitution works on the whole subtree of the nearest `command` ancestor, not per leaf; a fixture changes `args`, `env` and an added invocation in the worktree copy |
| A command key reaches the effective value through the global layer by `null` or a `replace` at an ancestor | L x H | the global file is the user's own (trusted); the project cannot reach it; phase 06 refuses project values at ancestors of global-only paths, and the trusted-root rule covers project command keys |
| All-or-nothing refusal (D19) makes a bad pull request stop every verb for teammates | M x M | by design and consistent with spec section 5 rule 2; the error is named and has line and column; `.githooks/pre-commit` check is Slice C |
| Cache reuses a snapshot after the standard changes | L x H | bundle digest in the key; test pins it |
| Snapshot cost grows with the 42-entry catalog | L x L | linear merge over a 40 KB value; phase 13 records the measured time; no assertion on time |

## Rollback

Revert: new files only.
