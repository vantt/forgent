---
title: "YAML Document + Config foundation, Slice B: crate fgos-config, descriptors and the standard, two locks"
description: "The Rust crate fgos-config (descriptor dialect and lint, snapshot with provenance and cache, one-file write transaction, comment grammar, redaction), the bundled descriptors that make the standard, and the project-config and global-config locks. Rust-only; no Node door, no migration."
status: in-progress
priority: P1
effort: 75h
branch: cfg/slice-b-config-crate (linked worktree; never the shared main checkout)
tags: [config, rust, descriptors, locks, standard]
lane: CFG
spec: docs/platform/config/spec.md
created: 2026-10-23
---

# YAML Document + Config, Slice B

Specs (signed 2026-10-22): [Config](../../docs/platform/config/spec.md) (source of truth here), [YAML Document](../../docs/platform/yaml-document/spec.md) (the landed leaf this builds on). Board row: CFG in [the program board](../261017-1313-fgos-platform-program-board/plan.md). Evidence: [config access inventory](../reports/research-261021-2221-config-access-inventory.md), [folded review](../reports/review-261022-1316-config-spec-standard-and-machine-files.md), [spike](../reports/spike-261022-0017-yaml-config-gate-evidence.md). Slice A (landed): [plan](../261022-1342-yaml-config-slice-a-yaml-document/plan.md).

## Outcome

1. Crate `fgos-config` (`packages/config/rust`, contracts `packages/config/contracts/`) answers, in Rust only: what is the effective value of every key and where did it come from (snapshot), is this file legal (descriptor check, scope rules, file rules), and what are the exact bytes after this one change (write transaction with compare-and-swap, comment grammar, writer class).
2. The standard exists as data: descriptors at `core/config-schema/<section>.yaml`, bundled into the crate, linted, and authored from this repository's tuned catalog; a pinned equivalence proof shows "standard + differences" reads back as this repository's effective config.
3. Locks `project-config` (repo) and `global-config` (machine) are registry rows with Rust pin tests.
4. The spec states the settled facts again: the Holder-lock bootstrap section is gone (the reader it described was deleted), and the registration count and `sectionOf` copies are corrected.

Non-goals (Slice C): native-door `config` namespace, Node facade, moving any reader or writer, deleting `src/config/` or the write-on-read, the real PATH detector for `runner.executor`, resolving the main checkout root, deciding who is "confined", `fgos config` verbs, `.githooks/pre-commit` check. Non-goals (Slice D): migration, tombstone, backups, doctor checks and fixes, the text renderer of the standard file and `refresh-docs`, `~/.fgos/private` creation by setup, gate G6. Nothing in Slice B is linked by an existing consumer; shipped behaviour does not change.

## Phases

| Phase | Content | Owning proof | Waits for |
|---|---|---|---|
| [00](phase-00-facts.md) | Prior art, what exists vs missing, reuse, corrected counts, decisions taken. No code. | facts re-verified with file:line | - |
| [01](phase-01-crate-skeleton-contracts.md) | Crate skeleton, workspace member, failure-code and dialect contract files, fixture-shape test | `cargo test -p fgos-config` fixture shape | 00 |
| [02](phase-02-lock-rows.md) | Registry rows `project-config`, `global-config`; schema owner value; Rust pin test; holder-lock doc lines | `tests/lock_rows.rs` + existing Node registry contract test | 00 |
| [03](phase-03-descriptor-model.md) | Descriptor model, loader (strict-config), `<any>` path patterns, bundled-set enumeration | golden descriptor-parse runner | 01 |
| [04](phase-04-descriptor-lint.md) | Lint rules of spec sections 3-4, closed rule ids | golden lint runner | 03 |
| [05](phase-05-check-and-standard.md) | Value-vs-descriptor check (types, values, `<any>`, line/col/descriptor in errors), standard assembly, the two lint rules that need the check | golden check + standard runners | 04 |
| [06](phase-06-scope-and-placement.md) | `scope` rules (ancestors, `null`, `replace`, wildcards), `file` placement, first-slice global-only list | golden scope runner | 05 |
| [07](phase-07-file-rules.md) | Open-beneath without symlinks, revision from the open file, modes, file selection (`config-legacy-shadowed`, tombstone text) | real-fs integration tests | 01 |
| [08](phase-08-comment-grammar.md) | Reason rules, actor from the writer, `@fgos:` forging refusal, doc-line and new-file header rendering for writes | golden grammar runner | 01 |
| [09](phase-09-snapshot.md) | Layers, merge rules from descriptors, provenance with line/column, cache by content, trusted root for `command` keys, `detected` port, confined accounts layer | golden snapshot runner + cache tests | 05, 06, 07 |
| [10](phase-10-write-transaction.md) | One-file transaction: lock, CAS, edits, validate, second check, durable replace, writer class, redundancy rule | transaction tests (two writers, observer seam) | 02, 07, 08, 09 |
| [11](phase-11-redaction-and-failure-matrix.md) | `secret-reference` / `secret-value` rendering, no-echo fixtures, failure-code coverage matrix | no-echo golden runner + matrix test | 09, 10 |
| [12](phase-12-descriptors-small-sections.md) | Descriptors for 13 sections + `secrets` + `bin` from the registrations and hand-written merge rules; defaults equivalence | lint green + registry-defaults fixture | 04, 05, 06 |
| [13](phase-13-descriptor-runner-and-authoring.md) | `runner` descriptor from the tuned catalog; machine-specific scrub; **OWNER GATE G-B2**; authoring equivalence proof | lint green + authoring equivalence test | 12 + **owner answer** |
| [14](phase-14-spec-amendment-docs-closeout.md) | Spec amendments (section 10, counts, `sectionOf`), reading-map, board row and log, final gates | `cargo test --workspace`, `npm test`, sequential | all |

Parallelism (file-disjoint, see ownership): after 01, tracks {02}, {03 -> 04 -> 05 -> 06}, {07}, {08} run in parallel. 09 joins 05, 06, 07. 10 joins 02, 07, 08, 09. 11 after 10. 12 can start once 06 is done (it needs lint, check and scope to prove itself) and runs beside 09-11. A question parked on G-B2 blocks only 13 and 14; 00-12 still land.

## File ownership (no two parallel phases touch the same file)

| Phase | Owns |
|---|---|
| 01 | root `Cargo.toml` (members line), `packages/config/rust/Cargo.toml`, `src/lib.rs`, `src/error.rs`, `packages/config/contracts/{failure-codes,descriptor-dialect}.v1.json`, `contracts/fixtures/README.md`, `tests/fixture_shape.rs`, stub files for later modules |
| 02 | `packages/holder-lock/contracts/lock-registry.v1.json`, `lock-registry.schema.v1.json`, `packages/config/rust/src/locks.rs`, `tests/lock_rows.rs`, two lines in `docs/platform/holder-lock/spec.md` |
| 03 | `src/descriptor.rs`, `src/pattern.rs`, `src/bundle.rs`, `contracts/fixtures/descriptor.v1.json`, `tests/golden_descriptor.rs` |
| 04 | `src/lint.rs`, `contracts/fixtures/lint.v1.json`, `tests/golden_lint.rs` |
| 05 | `src/check.rs`, `src/standard.rs`, `contracts/fixtures/{check,standard}.v1.json`, `tests/golden_{check,standard}.rs`; appends two rules to `src/lint.rs` and `contracts/fixtures/lint.v1.json` (04 lands first) |
| 06 | `src/scope.rs`, `contracts/fixtures/scope.v1.json`, `tests/golden_scope.rs` |
| 07 | `src/files.rs`, `tests/files_*.rs`; in Durable File (D17): `packages/durable-file/rust/src/open_beneath.rs`, its tests, and the `rustix` line of `packages/durable-file/rust/Cargo.toml` |
| 08 | `src/grammar.rs`, `contracts/{comment-grammar.v1.json,fixtures/grammar.v1.json}`, `tests/golden_grammar.rs` |
| 09 | `src/snapshot.rs`, `src/cache.rs`, `src/detect.rs`, `contracts/fixtures/snapshot.v1.json`, `tests/golden_snapshot.rs`, `tests/cache.rs` |
| 10 | `src/write.rs`, `tests/write_*.rs`, `contracts/fixtures/write.v1.json` |
| 11 | `src/redact.rs`, `contracts/fixtures/{no-echo,failure-matrix}.v1.json`, `tests/{golden_no_echo,failure_matrix}.rs` |
| 12 | `core/config-schema/*.yaml` except `runner.yaml`, `contracts/fixtures/registry-defaults.v1.json`, `tests/registry_defaults.rs`, descriptor list in `src/bundle.rs` (appended lines only; see shared edits) |
| 13 | `core/config-schema/runner.yaml`, `contracts/fixtures/authoring-source.config.json`, `contracts/fixtures/repo-differences.v1.json`, `tests/authoring_equivalence.rs`, one line in `src/bundle.rs` |
| 14 | `docs/platform/config/spec.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md` (Config row), board `plan.md` and `log.md` |

Shared edits handled in order: `src/lint.rs` and `lint.v1.json` (04 then 05); `contracts/failure-codes.v1.json` (01 creates, 03 appends the three parse ids, 04 appends the lint ids, in that order); root `Cargo.toml` (01 only); `src/bundle.rs` (03 creates, 12 then 13 append one list line each, merged by whoever lands second); `src/lib.rs` module lines (01 declares every module up front as a stub, so later phases never edit it); `lock-registry*.json` (02; also touched by HARDEN T1 and DOC per the board's shared-file table, so merge `origin/main` before the edit and post a log line first).

## Frame (approved by the owner 2026-10-23 10:40)

- Scope: the files in the ownership table; nothing else. Out of frame (ask first): any Node-side edit (`src/**`, `bin/**`, `test/**`), a change to a locked law or to the YAML Document spec's profile table, a new dialect field beyond the table in spec section 4 plus the one named in D5, a change to `fgos-yaml-doc`'s public API, a Windows implementation of the file rules.
- Budget: about 3,900 lines Rust source, 2,900 lines Rust tests, about 170 golden cases (JSON) plus two pinned inputs, about 2,100 lines of descriptor YAML (runner about 1,500), about 200 lines docs. Effort 75h (about 9-10 working days) excluding owner wait time.

## Constraints

- AGENTS.md: L10 one door (nothing here duplicates a door that exists; Slice C moves every caller), design principle 8 (one owning proof per behaviour, lowest layer, listed per phase), no test-only switch, flag or env branch (the one seam in phase 10 is a public observer parameter, same pattern as `fgos_durable_file::replace_durably_observed`, `packages/durable-file/rust/src/lib.rs:187`), RUL104 better not bigger, conventional commits without AI references except the attribution line the session requires.
- Install/setup/doctor gate: Slice B adds no env var, no default a running system expects, no file a tool assumes. The 14 `registerConfigDefault` calls and `fgos doctor` keep working untouched until Slice C replaces them. The descriptors are the future registration and are bundled in the crate; nothing is registered in `src/setup/checks.mjs` yet because no Node check reads them. Doctor checks arrive with Slice D (spec section 11).
- Resource safety: `free -g` first and at least 8 GB available (this machine showed 21 GB available at planning time); every cargo command carries `--jobs 4` (or `CARGO_BUILD_JOBS=4`). Crate tests first (`cargo test -p fgos-config --jobs 4`). `cargo test --workspace --jobs 4` and `npm test` are never run together: one finishes, its exit code is read on the very next statement, then the other starts. Never run two heavy gates at once. Long runs go through the harness's background facility so exit is observable; wait on the concrete PID the harness returned, never on `pgrep -f <pattern>` (a pattern in your own command line matches itself).
- Worktree, not the shared main checkout (it holds other sessions' unstaged work; no autostash pull). Merge `origin/main` at the start and end of every phase and before any test used as evidence.
- Every landing on main gets one line at the top of the board's `log.md` (`plans/261017-1313-fgos-platform-program-board/log.md`, newest first, format in its header). Phase 00 also posts the start line (lane CFG, Slice B, shared files named).
- Scratch artifacts under `.fgos/runtime/tmp/` (fallback `${TMPDIR:-/tmp}/fgos-work/`), never repo root.
- Paths and names of reports and plans come from `fgos convention path|name --json`; parallel agents pick distinct slugs.
- Impact-analysis gate: run `fgos tool query --capability impact-analysis --status present` once and record `full | degraded | inactive`. This slice edits no existing code symbol (new crate, registry data, spec text), so `impact` is needed only for the registry-row edit in 02 (`rank`, `entry` in `packages/holder-lock/rust/src/scope.rs` read the file; cross-check with `rg`). Run `detect_changes()` before each commit if present.

## Delegation economy (suggested)

Owner rule: the cheapest model that does the job reliably. Haiku: 01, 02 (mechanical edits), the descriptor row transcription in 12 once the shape is fixed, the doc lines of 14. Sonnet (default): 03, 04, 05, 06, 07, 08, 09, 10, 11, the first pass of 12 and 13. Opus only after a sonnet attempt failed on that phase (likeliest: the transaction in 10 and the open-beneath code in 07), and `kongming` only if a design fork resists analysis (none expected: forks are settled below). Reviewer pass (independent, sonnet) on 07, 10 and 13 before landing, since they carry the security and standard-content risk.

## Test matrix

| Layer | What | Where |
|---|---|---|
| Pure functions, golden JSON | descriptor parse, lint, check, scope, standard, grammar, snapshot merge, no-echo | `tests/golden_*.rs` over `contracts/fixtures/*.v1.json`, one runner per file (as in `packages/yaml-doc/contracts/fixtures/README.md`) |
| Real filesystem | open-beneath, symlinks, modes, file selection, revision from the open file | `tests/files_*.rs` in temp dirs |
| Real locks, real concurrency | two writers from one revision; lock held; second check via observer seam | `tests/write_*.rs`, `common::serial()` as in holder-lock tests |
| Contract pins | registry rows, ladder text, failure-code list, bundled-set completeness | `tests/lock_rows.rs`, `tests/golden_descriptor.rs`, `tests/fixture_shape.rs` |
| Content proofs | registry defaults equal the standard (non-catalog sections); standard + differences equals the authoring source | `tests/registry_defaults.rs`, `tests/authoring_equivalence.rs` |
| End to end | none in this slice: no consumer exists. The first wiring proof is Slice C's, one per door. | - |

## Decisions taken (inside the spec's silence; pinned by fixtures or tests, reversible by editing one)

| # | Decision | Reason |
|---|---|---|
| D1 | `detected` is a port (`Detectors` trait, caller supplies it); the crate ships no PATH probe. Rust tests use a fake. The real detector and the candidate/template data (`detectAssistantCli`, `SUPPORTED_EXECUTOR_TEMPLATES`, `src/runner/dispatch/config.mjs:462`) move in Slice C. | The data is Node code today; copying it into Rust now would be a second copy (one door). This repository sets `runner.executor` itself, so equivalence does not need it. |
| D2 | `snapshot` takes both the caller's project root and a `trusted_root` (the main checkout); `command` keys come from the trusted root's project file. Resolving the main checkout from a linked worktree is the caller's job (Slice C, via the Git component). | Keeps the crate a leaf (no `fgos-git` dependency) and still makes rule 6 of section 5 a rule of the snapshot, pinned by a fixture. |
| D3 | The write API takes `Writer { identity: fgos_identity::WriterIdentity, class: Confined | Unconfined }`. The actor text is `identity.id.to_string()`. `SessionClass` (`Confined | Unconfined`) is one type shared by the write API and `SnapshotRequest`; it is required, never defaulted; deriving it from the session is Slice C. Today no Rust primitive says "this session is confined" (`rg` over `packages`, `src` finds none). | Spec section 6 says the class comes from Session Identity, which has no such fact. The crate enforces the refusal given the class; the missing fact is flagged to Slice C, not invented here. |
| D4 | Lock rows: `project-config` mutex, scope repo, rank 80, `<fgosDir>/locks/project-config.lock`; `global-config` mutex, scope machine, rank 80, `<lockRoot>/global-config.lock`; owner value `config` added to the schema enum. No new rank row. | Rank 80 is the leaf rank the registry uses for `repo-config` and every other leaf; `LockScope::assert_can_acquire` (`packages/holder-lock/rust/src/scope.rs:95-103`) refuses held rank `>=` acquired, so a config write may happen inside `main-checkout` (50) and event locks (58-70), and takes nothing under it. A transaction touches one source, so the two never nest. Phase 00 traces that no flow writes config while holding another rank-80 leaf; if one exists, take rank 85 with one new `ranks` row. |
| D5 | Dialect adds one field not in the section 4 table: `justification` (text), required to keep `scope: both` on a non-public key (spec section 3 rule 1 speaks of "a written justification" without naming the field). Nothing else is added: no `retired`, no `doc-from`. | Rule 1 needs somewhere to carry the text; every other mechanism is an idea below. |
| D6 | Descriptors parse under the `strict-config` profile (no aliases, no tags, no duplicate keys, 1 MiB). A descriptor file is a mapping `{owner, section, entries: [ {path, type, ...} ]}`; entry order is the order the standard prints. `<any>` is a literal segment; a real key named `<any>` is refused by lint. | Descriptors are config-grade data under the same safety rules; a sequence keeps order and lets paths contain `.`-free text form (YAML Document spec section 3). |
| D7 | Bundling: `src/bundle.rs` lists every descriptor with `include_str!`; a test enumerates `core/config-schema/` and fails on a file missing from the list or a listed file that is gone. No `build.rs`. | A new `build.rs` is new supply-chain and build surface; the test gives the same completeness at no cost. |
| D8 | The doc line (`@fgos:doc`) for a key a door writes, and the new-file header, are rendered in Slice B (the write path needs them: spec section 7 says every key a door writes carries both lines). The text renderer for the whole standard file, `refresh-docs` and drift detection are Slice D and reuse this function. | One function, two later users; the slicing says no renderer "for existing files". |
| D9 | The Seat Binding ladder text in the `runner` descriptors (`modelPolicies`, `tierFallback`, `maxTier`) is a literal in the descriptor; a test pins it equal to the rendering of `packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json`. | "Owned by the Seat Binding crate and supplied through the descriptor" (spec section 7) without a new dialect field; drift fails a test. |
| D10 | `sanitizeGlobal` and the other hand-written merge rules map as in phase 12: seat-binding capability keys in the global file become `scope: project-only`; the `rigorToTier` drop, the stale-tier-key drop and the extended-cell drop are transitional filters whose reason (older releases on the machine) ended or is ending (board log 2026-10-23 10:15: SEAT-TRIM follow-up A deletes the conversion code), so they do not become dialect fields. `runner.rigorToTier` in the owner's global file is an owner action before Slice C cuts over (listed below). | Spec section 4 says the rules "become descriptor fields" without a field for these; building one for rules being deleted is bigger, not better. The spec sentence is amended in phase 14. |
| D11 | A write to a legacy `config.json` is refused (`config-format-legacy-json`, an id chosen here; it is also the name of the Slice D doctor check). Reads of `config.json` parse as `strict-config` (JSON is valid YAML, YAML Document spec section 4). | JSON cannot carry the mandatory `@fgos:` comments, so a write into it would break the comment contract; the spec is silent on writes before migration. This is a sequencing consequence for Slice C (see Unresolved). |
| D12 | Failure ids not named in the spec are chosen in phase 01 and closed in `contracts/failure-codes.v1.json` (`config-parse`, `config-schema`, `config-key-out-of-scope`, `config-format-legacy-json`, `config-platform-unsupported`, plus the `descriptor-` lint ids). Spec-named ids are used verbatim. Yaml-doc refusals pass through with their rule id. | Same approach as Slice A D3. |
| D13 | A held lock is waited for a bounded time (`Wait::Ms`, default 5 000, a parameter); on timeout the write fails with `config-write-conflict` (reason `lock-held`). | Section 14 has no "lock held" id; the loser writes nothing either way, which is the conflict contract. |
| D14 | Redundancy: `set` of a value equal to the standard on an absent key is a no-op with a named notice (`redundant-noop`); on a present key it becomes `unset`. Judged against the standard only (spec section 3). A `null` entry set against a map that allows it is not redundant. | Direct from spec section 3 and review M1/M4. |
| D15 | Cache: a caller-owned `SnapshotCache` value, keyed per source by (path, size, sha256) and the bundle digest; never a process global. | Spec section 5 rule 4: "never a process-lifetime cache"; the door (Slice C) owns the instance. |
| D16 | A file may set a map entry to `null` only where the `<any>` child lists `values: [null]` (existing field, no new one). | Spec section 3 puts the permission on the map's descriptor. Fallback `nullable` field needs an owner mention (phase 05). |
| D17 | (coordinator, 2026-10-23, replaces the first draft) The open-beneath primitive (`openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS`, per-component `O_NOFOLLOW` fallback, revision computed from the same open file) lives in **Durable File** as `open_beneath(root, relative)`, not in `fgos-config`; it is built on `rustix` (already in `Cargo.lock` 1.1.4 as a transitive dependency, so no new crate is fetched; record its use in the crate's Cargo.toml and run `cargo deny`), so neither crate needs `unsafe`. `fgos-config` stays `forbid(unsafe_code)`. | Design principle 2: file opening is a shared primitive and belongs to the lowest layer that owns how fgOS touches files; Durable File already owns `O_NOFOLLOW` opens (`packages/durable-file/rust/src/lib.rs:257`). Idea I3 (directory-fd replace) becomes a natural follow-up of the same module, still only if chosen. |
| D18 | An actor that fails the identity-charset check is written as `unknown`; the transaction result keeps the real writer id. | Provenance text in the file is "nothing more" for readers (spec section 7); a write must not fail on it. |
| D19 | A snapshot fails as a whole (all refusals listed, none carries a value) when any source breaks `strict-config`, scope, placement or a type check; an undescribed key is not a failure. | Same fail-closed rule as a parse error (spec section 5 rule 2; hooks fail closed, section 11). Consequence: this repository's own project file (`gateway` section, `lock` key) is refused until Slice D migrates it, so Slice C must not cut over before then (Unresolved 2). |
| D20 | A descriptor field the entry does not state (`scope`, `sensitivity`, `file`, `merge`) is inherited from the nearest ancestor entry, wildcards included, then the dialect default. Lint still requires an explicit own `scope` on every non-public entry. | Spec section 3 says "the whole `gateway` section" and "`runner.executors.<any>` command, args and env" are single declarations; without inheritance every child would repeat them and a forgotten child would silently become `both`. |
| D21 | A snapshot containing a `detected` value is never served from the cache. | `PATH` is not a hashed source; stale detection after installing a CLI is a worse failure than one extra probe for projects that name no executor. |

## Risks (likelihood x impact)

| Risk | L x I | Mitigation | Phase |
|---|---|---|---|
| The standard authored from the tuned catalog carries machine- or owner-specific content (already seen: the `xai` executor description names the `xai-vantt` profile, `.fgos/config.json:1151`) | H x M | per-executor and per-capability scan list in phase 13 (paths, user or profile names, env refs, `credentialStore`, `resourceBindings`); each hit becomes a difference or is scrubbed; owner gate G-B2 | 13 |
| The tuned catalog moves between authoring and landing (SEAT, MP-B1 and TEST edit `.fgos/config.json` regularly) | M x M | pin the source in `authoring-source.config.json` with its sha256 and commit; re-author from `origin/main` at phase 13 start; later drift is Slice D's `check` | 13 |
| `<any>` matching in the merge-rule closure is wrong (`merge.rs:31` matches paths exactly, so the wildcard lives in Config) and silently flips deep/replace | M x H | golden snapshot cases for `<any>` at depth 1-3, a path with a key equal to a descriptor key, `replace` on a map; the closure is one function with one owner | 05, 09 |
| Path-based Durable File: between the open-beneath check and `replace_durably(dir, name)` a directory component could be swapped for a symlink | L x H | re-check the directory's (dev, ino) against the held fd immediately before the replace; residual window named in the phase and in Ideas (fd-based replace) | 07, 10 |
| A project file arrives from a pull request and drives scope, merge and check code with hostile shapes | M x H | scope and check are total functions over `Value` with the yaml-doc bounds already applied; adversarial golden cases (`__proto__` refused by the profile, `null` at ancestors, deep `replace`); fuzz target is an idea | 05, 06, 09 |
| Lock rows collide with HARDEN T1 / DOC edits to `lock-registry*.json` (board D8: DOC adds an owner value and a row) | M x M | post log line first; merge `origin/main` before the edit; keep the diff to two rows and one enum value; whoever lands second rebases | 02 |
| Two writers: CAS passes, lock held by a crashed process | L x M | holder-lock kills dead holders (predecessor protocol) and reports `Held`; D13 bound; test with a real child process holding the lock | 10 |
| Windows: `openat2` and modes are Unix-only; the crate is in the workspace | M x L | file rules compile on Unix only (`cfg(unix)`); on other targets the file-reading and writing entries return a named refusal `config-platform-unsupported` (added to the closed id list); pure parts compile everywhere; tied to gate G4 | 07 |
| Out of RAM again | M x H | `free -g` gate, `--jobs 4`, sequential gates | all |

## Rollback

Each phase is its own commit group on the branch; rollback is `git revert` of its commits. 01, 03-13: new files only (plus the workspace member line in 01 and appended list lines in `src/bundle.rs`); revert deletes them, and nothing links the crate. 02: reverting restores the registry, schema and the two doc lines together (the Rust pin test goes with it); no consumer reads the new rows yet. 14: docs only. Nothing in Slice B changes shipped behaviour, so no phase needs a data migration to roll back.

## Owner gates

- **Frame approval** (above): budget and scope, asked once before phase 01 starts.
- **G-B2 answered 2026-10-23 10:40: option A** (catalogs from the tuned file after the machine scrub; scalars from today's code defaults; project-specific keys detected or empty; account material never in the standard). Phase 13 asks again only for an entry that fits none of these rules. Original gate, phase 13, parked only phases 13 and 14: which values are the release's standard and which are this repository's own choices. Full text in [phase 13](phase-13-descriptor-runner-and-authoring.md).

No other decision remains open: the forks above are settled with reasons. Owner action items that are not decisions: remove `runner.rigorToTier` from `~/.fgos/config.json` on each machine before Slice C cuts over (D10); remove the dead `lock.predecessorKillWaitMs` key from this repository's project file whenever convenient (Slice D migration also drops it).

## Success criteria (observable)

- `cargo test -p fgos-config --jobs 4` green; every case of the golden files runs; `cargo clippy -p fgos-config --jobs 4 -- -D warnings` clean.
- Lint passes on every file under `core/config-schema/`; `tests/golden_descriptor.rs` fails when a descriptor file is added without being listed in `src/bundle.rs`.
- Equivalence: `standard + differences(authoring-source)` equals the authoring source except the four documented exclusions (`gateway.*` global-only, `lock.*` retired, `runner.$comment` becomes doc text, any path the owner moved in G-B2), and the difference list matches `repo-differences.v1.json`.
- Two writers from one revision: exactly one commits, the other gets `config-write-conflict`, the file is never torn (test with threads and with a child process).
- A fixture proves a project value on or above each first-slice `global-only` path is refused by name, including `null` and a `replace` ancestor; another proves no error text contains a fixture's secret bytes.
- `rg -n "readPredecessorKillWaitMs|predecessorKillWaitMs" src packages apps test --glob '!target'` finds nothing (phase 00 records it, phase 14 re-runs it); the spec's section 10 is replaced by the settled fact; the registration count and the `sectionOf` sentence in spec section 4 are corrected.
- `cargo test --workspace --jobs 4` and `npm test` green, run sequentially.

## Ideas for the owner (beyond the spec; none is in the budget unless chosen)

| Idea | Problem and evidence | Benefit |
|---|---|---|
| I1. `retired` descriptor field (the review's M3, `plans/reports/review-261022-1316-config-spec-standard-and-machine-files.md`) | A renamed standard entry survives as a valid `<any>` key in files that copied it; `rigorToTier` is the live example (`src/runner/dispatch/config.mjs:366` drops it by hand). D10 does not build the field because the filters are being deleted. | If renames recur, one field replaces hand-written filters; about 120 lines + lint rule + 4 fixtures. |
| I2. Fuzz target over `snapshot` and `check` with hostile project files | The project file arrives by pull request (spec section 3); yaml-doc is fuzzed but scope, merge and check code over its output is not. | Closes the gap between the parser's fuzz and Config's logic; one target seeded from fixtures; needs `cargo-fuzz` and nightly (same prerequisite as Slice A). |
| I3. A directory-fd based replace in Durable File | `replace_durably(dir: &Path, name, bytes)` resolves `dir` by path (`packages/durable-file/rust/src/lib.rs:164`), so a symlink swap of a directory between the check and the rename is narrowed (D-level re-check), not closed. | Closes the window the spec's section 6 already admits for outside editors, for hostile local swaps too; touches a lower component. |
| I4. `doc-from` descriptor field for text owned by a contract | D9 pins the Seat Binding ladder by test; a second contract-owned text would need another pin. | One mechanism instead of N pins; not needed for one case. |
| I5. CI report of "standard vs the tracked project file" until Slice D migrates it | After Slice B the tuned catalog and the standard can drift; only phase 13's pinned copy proves equality at one commit. | Drift becomes a visible number each run; about 40 lines in a test or script. |
| I6. Tùm lum seen outside scope (RUL11), each its own item if chosen | `findExecutableOnPath` exists twice (`src/state/tool-registry.mjs:135`, `src/runner/paths.mjs:150`); `DEFAULT_RUNNER_CONFIG` (`src/runner/dispatch/config.mjs`) is a second seed that dies in Slice C; `lock.predecessorKillWaitMs` is a dead key in the tracked project file. | Smaller Slice C. |

## Follow-ups (not planned here)

Ordering consequence of D19 (coordinator): this repository's project file is refused by the new snapshot until it is migrated, so Slice D's `migrate` must land before Slice C cuts any reader over; Slice C and D are planned together with that order.

Slice C: native-door `config` namespace and facade; move every reader and writer; real `detected` probe and the executor template data; resolve the main checkout root for `trusted_root`; the "is this session confined" fact; `LOCK_FILES` rows for the two new locks in `src/setup/holder-lock-checks.mjs`; the two Holder-lock callers no longer exist, so spec acceptance 11 becomes a standing check; delete `DEFAULT_RUNNER_CONFIG`, the five `JSON.stringify` writers and the write-on-read. Slice D: migration (drops `lock.*`, `runner.$comment`, moves `gateway.*` out of the project file), doctor checks, comment renderer for the standard file, `~/.fgos/private`, gate G6.

## Unresolved questions

1. How does a session learn it is confined (needed by D3 in Slice C)? Candidate: an env marker the confinement driver sets plus a process-tree fact in `fgos-identity`; not decided here.
2. Sequencing C and D: D11 refuses writes to JSON files, so writers cannot move onto the crate before a project file is YAML. Either `migrate` for projects lands inside Slice C, or Slice C moves readers first and keeps the Node writers until D. Slice C's plan must pick one; asking now would be early.
3. G-B2 (phase 13) and the frame approval, above.
