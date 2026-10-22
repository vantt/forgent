---
title: "YAML Document + Config foundation, Slice A: fixture helper, crate fgos-yaml-doc, serde_yaml removal"
description: "One shared config fixture helper for tests, the Rust crate fgos-yaml-doc with golden fixtures and fuzz targets, a three-candidate parser choice behind an owner gate, and the three serde_yaml users moved onto the crate."
status: in-progress
priority: P1
effort: 56h
branch: cfg/slice-a-yaml-document (linked worktree; never the shared main checkout)
tags: [yaml, config, rust, fixtures, supply-chain]
lane: CFG
spec: docs/platform/yaml-document/spec.md
created: 2026-10-22
---

# YAML Document + Config, Slice A

Specs (signed 2026-10-22): [YAML Document](../../docs/platform/yaml-document/spec.md) (source of truth here), [Config](../../docs/platform/config/spec.md) sections 3, 13, 16 only. Board row: CFG in [the program board](../261017-1313-fgos-platform-program-board/plan.md). Evidence: [spike](../reports/spike-261022-0017-yaml-config-gate-evidence.md), [config access inventory](../reports/research-261021-2221-config-access-inventory.md).

## Outcome

1. Tests write config through one helper, so the later JSON-to-YAML switch is one change in one file.
2. Crate `fgos-yaml-doc` (`packages/yaml-doc/rust`) answers "what does this YAML mean, and what are the exact bytes after this one change", with two profiles, surgical edits, comment guard, merge primitive, fuzz targets, golden fixtures (`packages/yaml-doc/contracts/`).
3. `fgos-host-runtime`, `fgos-observe`, `fgos-gateway` use the crate; `serde_yaml`, `unsafe-libyaml` and the `RUSTSEC-2024-0449` ignore are gone, in one change (L10).
4. The parser crate underneath is chosen by evidence and signed by the owner, not by default.

Non-goals: Node `yaml`/`config` namespaces, deleting js-yaml and `src/config/`, crate `fgos-config`, descriptors, doctor checks, migration. Listed under Follow-ups only.

## Phases

| Phase | Content | Proof | Waits for |
|---|---|---|---|
| [00](phase-00-facts.md) | Prior art, what exists vs missing, reuse, decisions taken. No code. | facts re-verified with file:line | - |
| [01](phase-01-config-fixture-helper.md) | `test/helpers/config-fixture.mjs`; every hand-written `config.json` write in `test/**` moves to it, mechanically. **Lands first.** | helper round-trip test; `npm test` green; census grep finds no hand write outside the helper | 00 |
| [02](phase-02-crate-skeleton-contracts-fixtures.md) | Crate skeleton, value/span model, contract files, golden fixture files incl. every case of `test/util/yaml.test.mjs` | `cargo test -p fgos-yaml-doc` (fixture-shape test) | 00 (can be built beside 01; lands after it) |
| [03](phase-03-parser-independent-parts.md) | Path text form, comment guard, pre-scan bounds, merge primitive | golden comment/prescan/merge/path runners | 02 |
| [04](phase-04-parser-evaluation-and-owner-gate.md) | Three-candidate comparison (yaml-rt, noyalib, saphyr-parser), supply-chain review, upgrade record. **STOPS for owner sign-off.** | upgrade record + decision question | 02 (03 not required) |
| [05](phase-05-parse-profiles-limits.md) | Backend adapter, document parse, both profiles, limits, alias expansion, JSON bridge, panic guard | golden parse runner | 03, 04 + **owner sign-off** |
| [06](phase-06-edits-and-recheck.md) | `set`/`insert`/`remove`, comments on documents, re-parse check, `comment-would-be-lost` | golden edit runner | 05 |
| [07](phase-07-public-api-seal.md) | Every public entry guarded, `forbid(unsafe_code)`, error text carries no value, adversarial-through-API test | guard unit test + corpus test | 06 |
| [08](phase-08-move-serde-yaml-users.md) | Three consumers move; advisory ignore, `serde_yaml`, `unsafe-libyaml` removed from both lock files, one change | each consumer's own suite; `cargo deny` | 05 |
| [09](phase-09-fuzz-targets.md) | `cargo fuzz` targets parse / edit-then-reparse / merge seeded from fixtures; first run recorded | targets build and run clean for the budget | 03, 05, 06 |
| [10](phase-10-docs-board-closeout.md) | Spec status and decision history, reading-map, board row and log line, CHANGELOG if user-visible, final gates | `cargo test --workspace`, `npm test` green, sequential | all |

Parallelism: 01 || 02 || 03 || 04 are file-disjoint (see ownership table). After the owner gate: 05 then {06, 08}; 09 after 06; 07 after 06. A question parked on 04 blocks only 05 and everything after it; 01, 02, 03 still land.

## File ownership (no two parallel phases touch the same file)

| Phase | Owns |
|---|---|
| 01 | `test/**` (config write sites only), `test/helpers/config-fixture.mjs`, `test/helpers/config-fixture.test.mjs` |
| 02 | `Cargo.toml` (workspace members), `packages/yaml-doc/rust/Cargo.toml`, `src/lib.rs`, `src/model.rs`, stub files for later modules, `packages/yaml-doc/contracts/**`, `tests/fixture_shape.rs` |
| 03 | `src/path.rs`, `src/comment.rs`, `src/prescan.rs`, `src/merge.rs`, `tests/golden_{path,comment,prescan,merge}.rs` |
| 04 | scratch workspace only (`.fgos/runtime/tmp/yaml-eval/`), then `packages/yaml-doc/upgrade-record.md` |
| 05 | `src/backend.rs`, `src/document.rs`, `src/profile.rs`, `src/expand.rs`, `src/guard.rs`, `tests/golden_parse.rs`, `packages/yaml-doc/rust/Cargo.toml` (parser dep line only), `packages/yaml-doc/third-party/**`, root `Cargo.toml` (`exclude`, `[patch]` only) |
| 06 | `src/edit.rs`, `tests/golden_edit.rs` |
| 07 | `tests/api_seal.rs`, doc comments in `src/lib.rs` |
| 08 | the three consumers' `Cargo.toml` and call sites, both `Cargo.lock`, `.github/cargo-deny.toml` |
| 09 | `packages/yaml-doc/rust/fuzz/**` |
| 10 | docs, board, CHANGELOG |

Shared edits handled in order: root `Cargo.toml` (02 then 05); `packages/yaml-doc/rust/Cargo.toml` (02 then 05).

## Frame (approved by the owner 2026-10-22 15:10, with ideas I1 and I2)

- Scope: the files in the ownership table; nothing else. Out of frame (ask first): changing a locked law, the spec's profile table, the `parseYaml` signature, adding a Node-side change.
- Budget: about 2,600 lines Rust source, 1,600 lines Rust tests, about 130 fixture cases (JSON), 300 lines Node test helper and conversions (mechanical), 250 lines docs. Effort 56h (about 7 working days) excluding owner wait time.

## Constraints

- AGENTS.md: L10 one door (move every caller, delete the old path in the same change), design principle 8 (one owning proof per behaviour, lowest layer), no test-only switch or flag, RUL104 better not bigger, conventional commits without AI references except the attribution line the session requires.
- Resource safety: run `free -g` first and need at least 8 GB available; every cargo command carries `--jobs 4` (or `CARGO_BUILD_JOBS=4`). `cargo test --workspace` and `npm test` are never run together; one finishes, its exit code is read on the very next statement, then the other starts. Long runs go through the harness's background facility so exit is observable.
- Worktree, not the shared main checkout (it holds other sessions' unstaged work; no autostash pull). Merge `origin/main` at the start and end of every phase and before any test used as evidence.
- Lane TEST edits test files too: phase 01 is mechanical, file by file, touching only the config write lines (and an import line), no other test edits. One board log line to TEST before starting; skip and list any file TEST has in flight.
- Scratch artifacts under `.fgos/runtime/tmp/` (fallback `${TMPDIR:-/tmp}/fgos-work/`), never repo root.
- Paths and names of reports and plans come from `fgos convention path|name --json`; parallel agents pick distinct slugs.
- Impact analysis gate: run `fgos tool query --capability impact-analysis --status present` once; if present, run `impact` before editing each existing symbol (the three consumers' parse call sites, `writeSharedConfig` callers) and `detect_changes()` before each commit; cross-check zero results with `rg`. New crate symbols need none.

## Delegation economy (suggested)

Owner rule: the cheapest model that does the job reliably. 01 batch conversions: haiku per batch, sonnet for the helper itself. 02, 03, 04, 05, 06, 08, 09: sonnet. Move one phase to opus only after a sonnet attempt failed on it (byte-exact splicing in 06 is the likeliest), and to `kongming` only if a design fork resists analysis.

## Decisions taken (inside the spec's silence; pinned by fixtures, reversible by editing a fixture)

| # | Decision | Reason |
|---|---|---|
| D1 | Node counting for the `nodes` bound counts values (a shared alias reference once per use), not keys. | Today's `assertExpandedSize` (`src/util/yaml.mjs:15`) counts values; the 10 000-item fixture then costs about 50 000. |
| D2 | A leading UTF-8 BOM is accepted and preserved; U+FEFF elsewhere inside text is refused (strict-config values and keys, tool keys). | Spec section 4 says "inside text"; a BOM at byte 0 is an encoding mark. |
| D3 | Refusal rule ids are a closed list in `contracts/refusal-rules.v1.json`; `comment-would-be-lost` and `yaml-internal-error` are spec-named, the rest are chosen in phase 02. | Spec names the rule but not the ids. |
| D4 | Refusal order is fixed: byte size, UTF-8, pre-scan depth, parse error, then a document-order walk of the tree; first violation wins. | Deterministic output for fixtures. |
| D5 | Empty comment line is written as `#` (no trailing space). | `# ` plus empty text leaves trailing whitespace. |
| D6 | Merge: a present `null` at the top wins whole; at a `deep` path a lower layer that is a scalar or sequence against a map is a mismatch; a lower `null` masks layers below it. Mappings merge, `leaf` takes the highest layer. | Config spec section 3 lets a file switch an entry off with `null`; the spec's mismatch rule must not make that an error. Revisit in the Config slice. |
| D7 | The syntax-error position of `a: [1,\nb: }` (2:1) is pinned only if the chosen parser reproduces it; otherwise the fixture pins the line and the changed column is recorded in the upgrade record. | Position is a parser property; today's test pins it. |

## Risks (likelihood x impact)

| Risk | L x I | Mitigation | Phase |
|---|---|---|---|
| 104-file mechanical edit collides with lane TEST | M x M | batch by directory, merge main before each batch, skip files in flight, post to board first | 01 |
| Helper changes bytes some test asserts on (indent, trailing newline) | M x L | helper reproduces today's per-site serialization options; grep for tests that read the file as text before converting | 01 |
| Pre-scan miscounts and refuses legitimate YAML (regex-like plain scalars) | M x M | count only token-start brackets, skip quotes, comments and block scalars; differential run over every YAML file in the repo (scratch) | 03, 05 |
| Chosen parser lacks exact spans or has a panic / stack-overflow path | M x H | evaluation measures spans first; pre-scan in front; fuzz after; swap cost is one file (`backend.rs`) | 04, 09 |
| Parser is young and its author or churn is a supply-chain risk | M x H | pinned exact, committed copy under `third-party/` with integrity test, source diff read, `cargo deny`, owner sign-off, upgrade record | 04, 05 |
| Typed deserialization of the host-runtime manifest differs from `serde_yaml` (number-looking scalars into `String` fields) | L x M | differential run over every real manifest and test fixture before removal; fix the YAML or add a quote, not a mechanism | 08 |
| `third-party/` crates swept into `--workspace` clippy or fmt | M x L | `exclude` in root workspace; verified by running `cargo clippy --workspace` | 05 |
| Out of RAM again | M x H | `free -g` gate, `--jobs 4`, sequential gates | all |
| `cargo-fuzz` and nightly toolchain not installed here | H x L | phase 09 lists the install as a machine prerequisite; not shipped with the product | 09 |

## Rollback

Each phase is its own commit group on the branch; rollback of a phase is `git revert` of its commits. 01: revert restores the hand writes (no product code touched). 02-07, 09: new files only, plus the workspace member line; revert deletes them. 08 is one commit: revert restores `serde_yaml`, the ignore line and both lock files together, so a half-moved state cannot exist. Nothing here changes shipped behaviour except 08, and 08 is proven by the consumers' own suites.

## Owner gate (phase 04), written as a decision question

Full text in [phase 04](phase-04-parser-evaluation-and-owner-gate.md). Phase 05 and later do not start without the owner's answer, recorded in `packages/yaml-doc/upgrade-record.md`.

## Success criteria (observable)

- `rg -n "config\.json" test --glob '!test/helpers/config-fixture*'` shows no write call (census command in phase 01); `npm test` green.
- `cargo test -p fgos-yaml-doc` green; fixtures include all 14 behaviour tests of `test/util/yaml.test.mjs` (mapping table in phase 02).
- `rg -n "serde_yaml|unsafe-libyaml|RUSTSEC-2024-0449" Cargo.lock apps/fgos-gateway/Cargo.lock .github packages apps --glob '!target'` finds nothing; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` clean.
- `cargo test --workspace` and `npm test` green, run sequentially.
- Fuzz targets run for the recorded budget with no crash, hang or out-of-memory.
- Upgrade record carries the owner's sign-off.

## Ideas for the owner (beyond the spec; owner chose I1 and I2 on 2026-10-22, declined I3 and I4)

I1 is done in phase 01 (architecture guard, in `test/architecture.test.mjs`); I2 in phase 03 (comment guard), recorded in the YAML Document spec's decision history in the same change.

| Idea | Problem and evidence | Benefit |
|---|---|---|
| I1. Permanent architecture guard: no test file writes `config.json` outside the helper | The helper only holds while nobody adds a 105th hand write; lane TEST adds tests daily (suite-baseline shows 8,058 tests) and 104 hand writes grew without a rule. | The format switch stays one change; about 30 lines in `test/architecture.test.mjs`. |
| I2. Strip or refuse bidi controls in comment text the crate writes | Spec section 4 refuses bidi in values "so a diff cannot hide what a command value runs"; section 6 guards comment text only against line breaks and control characters. A `@fgos:why` written by an agent could carry a Trojan-Source sequence. | Closes the same diff-hiding vector for comments; about 10 lines plus 3 fixtures. |
| I3. CI job that builds the fuzz targets (not runs them) | Fuzz targets sit outside the workspace, so nothing compiles them and they rot silently. | Targets stay buildable at upgrade time; one CI step, nightly toolchain. |
| I4. Differential parity script kept as a dev tool (old js door vs new crate over all repo YAML) | Phase 05 and 08 each run it once in scratch; the Node slice will need it again. | Re-usable proof at the Node slice; not added unless chosen. |

## Follow-ups (not planned here)

Slice B: crate `fgos-config`, descriptors under `core/config-schema/` (the standard), the `project-config` and `global-config` locks, the Holder-lock bootstrap. Slice C: native-door `yaml` and `config` namespaces, the `src/util/yaml.mjs` re-point, every Node caller moved, deletion of js-yaml and its hash test, `src/config/` and the write-on-read, RUL101 supersession. Slice D: comment renderer, doctor checks, `fgos config migrate` with tombstone and backups, `~/.fgos/private` (needs gate G6). Windows addon load G4 before a Windows release; reads of `config.json` in tests (census count in phase 01, moved in Slice C).

## Unresolved questions

2. Parser choice and vendoring layout: owner gate in phase 04.
3. Fuzz sign-off timing: sign-off precedes the first fuzz run, so a finding later reopens the gate (stated in phase 04).
