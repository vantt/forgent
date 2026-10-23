# Phase 06: Scope rules and file placement

Depends on 05. Suggested executor: sonnet (security-relevant; independent sonnet review before landing).

## Context

Spec section 3: precedence is project over global over standard, narrowed by `scope`. The project file is not trusted for machine keys. Rules: (1) non-public sensitivity declares scope (lint, phase 04); (2) `global-only` applies to ancestors: a project value at any ancestor path of a `global-only` key, including `null` and a `replace`-merged mapping, is refused; (3) `<any>` makes "`runner.providers.<any>.accounts` is global-only" expressible; (4) first-slice `global-only` list, each pinned by a fixture: the whole `gateway` section, `secrets.globalFile`, `secrets.sources`, `secrets.declarations.<any>.consumers`, `bin.*`. Account pools and `gateway.token` go further: they belong to their own files and are refused in config files by name (`config-key-in-wrong-file`, naming the file). Section 14: "Key outside its scope: refused by name, naming the file it belongs in"; "A project value sits on or above a `global-only` path: refused by name, naming the global file".

## Files it may touch

`src/scope.rs`, `contracts/fixtures/scope.v1.json`, `tests/golden_scope.rs`.

## Design

One total function: `judge(&Descriptors, source: SourceKind, value: &Value, document: Option<&Document>) -> Vec<Refusal>` with `SourceKind` of `Project`, `Global`, `Accounts` (and `Token` as a name only: the token file is not YAML and never parsed here). For every path present in `value` (walking all keys, including those under `null`):

- phase 03's `resolve` (most specific entry, then inheritance from ancestors, D20) decides `scope` and `file`;
- `file != config` and `source` is Project or Global: `config-key-in-wrong-file` naming `accounts` or `token` (the destination wins at Slice D; here just the refusal);
- `scope: global-only` and `source` is Project: `config-key-out-of-scope` naming the global file;
- **ancestors:** a project value at a path that is a strict prefix of any `global-only` descriptor path (matched with `<any>`), whatever its shape (`null`, scalar, mapping, a `replace` map): refused. A project mapping that merely contains a `global-only` descendant is refused at the descendant, while a project mapping at the ancestor itself (`gateway: {}`, `gateway: null`) is refused at the ancestor;
- `scope: project-only` in Global: `config-key-out-of-scope` naming the project file;
- a `Accounts` source holding a key whose `file` is not `accounts`: `config-key-in-wrong-file`;
- undescribed keys: no scope refusal (they are kept, reported by check as `undescribed`), **except** at the ancestors of `global-only` paths.

Refusals carry file, path, line and column (through `Document::span_of`) and never a value. Where the source is a legacy JSON project file, the same function applies (JSON parsed as `strict-config`).

## Steps

1. Merge `origin/main`. Implement `judge` with the descriptor set injected, so the phase proves the rules on small synthetic descriptors (not waiting for phases 12-13).
2. Fixtures (about 30 cases): each first-slice path pinned with a project value refused and the same value in the global file accepted (descriptor text for `gateway`, `secrets`, `bin` inline, same shape phase 12 will ship); ancestor cases: `gateway: null`, `gateway: {}`, `runner: {providers: null}`, `runner.providers: {replace map}` where only `runner.providers.<any>.accounts` is `global-only`; wildcard case `runner.providers.openai.accounts`; accounts and token placed in config files; `project-only` in the global file; undescribed key accepted; a deep `replace` merge descriptor at an ancestor does not rescue a project value; line and column present; no value in the refusal.
3. A test that the refusal for a `global-only` project value names the **global file's role** (`global`), not a path guessed from the home directory (the crate holds roles; Slice C maps roles to paths).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Scope, ancestors, wildcards, file placement | `golden_scope.rs` over `scope.v1.json` |
| The first-slice global-only list is pinned | same runner; the real descriptors are checked against the same list in phase 12 (`tests/registry_defaults.rs` reads `scope.v1.json`'s list, so the list lives once) |

## Validation

`cargo test -p fgos-config --test golden_scope --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A path form escapes the ancestor rule (bracket-quoted key, key `__proto__`, key with `.`) | M x H | the walk uses yaml-doc `Segment`s, never dotted strings; fixtures for `["a.b"]` keys; `__proto__` is already refused by the profile |
| Rule over-refuses legitimate project files (a project file legitimately holds `gateway.port` today: `.fgos/config.json` has `"gateway": {"port": 4170, "token": null}`) | H x L | intended by spec ("keeps current behaviour: the gateway reads only the global file"); the equivalence proof in phase 13 lists `gateway.*` as an expected refusal, and Slice D migration drops it |
| Descriptor set lacks a `global-only` path the spec lists (`secrets.*`, `bin.*`) | M x H | phase 12 authors both sections and its test fails when any listed path is absent or not `global-only` |

## Rollback

Revert: new files only.
