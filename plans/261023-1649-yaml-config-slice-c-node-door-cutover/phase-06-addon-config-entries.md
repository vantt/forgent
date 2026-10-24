# Phase 06: Addon `config` entries `snapshot`, `explain`, `applyPatch`, `init`

Depends on 05 and 02 (shared `door.mjs`, `marshal.rs`). Suggested executor: sonnet; **independent sonnet review before landing** (define semantics, class, trusted root). Cap: `config.rs` delta 190 lines. Impact analysis on `versions` and on D's entries in `config.rs`.

## Context

D-11 (absorbed, landing B) opens the `config` namespace with `check`, `fix`, `accounts` in `packages/git/node-addon/src/config.rs` (cap 110); each marshals JSON in and plain data out, resolves the writer identity in the addon the way `session_identity.rs` does, and carries failure ids in the message JSON. This phase adds the entries the Node facade needs and settles four things D left: the main-checkout trusted root for `snapshot`, the session class, the cache instance, and the response size.

## Files it may touch

`packages/git/node-addon/src/config.rs` (append), `src/lib.rs` (`"config": 2` in `versions()`; a bump from D's 1 so a mixed-up addon fails by name), `src/native/door.mjs` (`typeof v.config !== 'number'` stays D's; add `v.config < 2` -> `git-addon-unavailable: combined addon ABI mismatch`), `test/config/config-door.test.mjs` (append four cases).

## Design

- **`snapshot({ projectRoot?, globalDir, class, sections?, origins? }) -> { json, revisions, accounts, origins? }`.**
  - `projectRoot` absent: the machine view of phase 05 (C3).
  - Present: the addon canonicalises `projectRoot`, resolves `trusted_root` with D22's `RepoHandle::trusted_main_root` helper; **no repository found means the trusted root is the project root** (C4); the result is memoised per canonical project root while the `.git` entry's (dev, ino, mtime) is unchanged.
  - `class` comes from the caller (the facade reads D's marker; phase 00 records the name). The addon trusts it the way the crate does (D4: politeness, the mount view is the boundary).
  - `sections` (a list of top-level keys) filters `value` in Rust before it is serialised; absent means all. `origins: ['runner.capabilities']` returns provenance (layer, role, file, line, column, described) for those paths only.
  - The snapshot goes through the addon-owned cache (C5): a `Mutex<Vec<(SnapshotRequest, SnapshotCache)>>` of at most 8 entries, evicting the least recently used; each call still opens and hashes every source (`snapshot_cached`), so a hit is never stale. No other process-global state.
  - `json` is the value as JSON text; `revisions` is the per-source byte revision map; `accounts` is `present | unavailable-confined`. A refusal list becomes the failure message JSON (`ids`, each with file, line, column, path, keyword; never a value, `redact`'s display form for anything shown).
- **`explain({ projectRoot?, globalDir, class, path })`:** `inspect::explain`: schema node (description, type, enum or bounds, standard value, scope, owner) and where the current value comes from, redacted (`gateway.token` is `<redacted>`, acceptance 15). One entry, no formatting.
- **`applyPatch({ projectRoot?, globalDir, class, target, expected, edits, reason, acknowledgeCommentLoss? })`:** builds `WriteRequest` (`lock_wait_ms` default of the crate), resolves the writer id in the addon (`resolve_current`), calls `commit`. `edits` are `{ set: <path text>, value }` or `{ unset: <path text> }` (D18's patch element shape, paths in YAML Document's path text form). Returns `{ writerId, newRevision, applied, notices }`. A confined `class` is `config-write-confined`; a legacy JSON target is `config-format-legacy-json` (named so a person knows the global file must be converted first, Ideas I2).
- **`init({ projectRoot?, globalDir, class, target })`:** phase 05's `init`; `{ created, revision }`.
- All four run inside `marshal::guarded` (a panic is `yaml-internal-error`'s sibling `config-internal-error`, nothing printed) and call `check()?` first.
- Responses are JSON text; the Node side builds objects (phase 07).

## Steps

1. Merge `origin/main`; `impact` on `versions`, D's `config.rs` entries; record the landed argument shapes (they win over this text).
2. Implement; build with `CARGO_BUILD_JOBS=4`.
3. Extend `test/config/config-door.test.mjs` (D created it; append, about 90 lines, one case per entry, wiring only): `snapshot` returns the standard for an empty project and a project value over it, with `sections` returning only the named key and `origins` naming the file; the machine view with no project; a linked worktree whose own config sets an `invariantChecks.commands` is ignored for `command` values (the trusted root is the main checkout), and a non-repository directory works; confined class gives `accounts: unavailable-confined`; `explain` redacts the token path; `applyPatch` creates a key with a reason in a YAML project fixture and returns `config-write-confined` for a confined class; `init` creates the header-only file once, the second call says `created: false`; an older addon marker (`config: 1`, simulated by a descriptor with a stub `versions`, the pattern of the door tests) fails by name.
4. Measure (feeds phase 08): cold and warm `snapshot` for the migrated rehearsal copy of this repository's file that D's phase 16 produced (scratch) and for the unmigrated legacy JSON of the same file and the 8-entry cache under alternating requests; do not optimise here.
5. `cargo test -p fgos-node-addon --jobs 4`, clippy, fmt; the config door test through the launcher; line count against the cap.

## Owning proofs

Behaviour belongs to B's and D's crate tests and to phase 05; this phase's proofs are the four wiring cases, the trusted-root case (acceptance 13 at the door; the owning proof of the rule is B's `golden_snapshot.rs`) and the marker check.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `trusted_root` resolution costs a git open per read | M x M | memo; measured in 08; fallback path tested |
| The 8-entry cache grows memory (a `runner` snapshot is about 25 KB of value plus origins) | L x L | bounded; entries hold one snapshot each |
| `class` supplied by the caller is wrong | L x M | D4's stated limit; the write transaction also needs the lock and the mount view stops a worker writing the file |
| JSON text of a big snapshot is slow to parse in Node | L x M | `sections` filter; measured in 08 |

## Rollback

Revert: the entries, the marker bump and the cases go together; phase 07 must be reverted first (it calls them).
