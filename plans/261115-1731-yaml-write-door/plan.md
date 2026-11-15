---
title: "YAML write door: one writer of YAML text"
description: "The native YAML door gains emit; the five hand-written frontmatter writers use it; a doors row lets only the door emit YAML text; every emitted block reads back to the same value."
status: pending
priority: P2
effort: 11.5h (9 executable phases; longest chain 01 -> 02 -> 07 -> 09, about 8h)
branch: plan/yaml-write-door
tags: [refactor, one-door, yaml, rust, node]
blockedBy: []
blocks: []
created: 2026-11-15
---

# YAML write door

Source: backlog row `p-eqhfqpz3gy` (`docs/backlog.md:22`), owner approved 2026-11-15; it was option (a) of Q1 in
`plans/261114-2215-one-door-debt/plan.md` (Ideas row 1). Its precondition ("after the capability-reads and one-door-debt
plans close") holds: capability reads landed (`1c30f30f8` on main), one-door-debt landed (`67a4c9380`, last phase). Code
read on `origin/main` `0b425a2f0`. Facts, census and prior art: [phase-00-facts.md](phase-00-facts.md). Rules for every
phase lead: [phase-lead-rules.md](phase-lead-rules.md).

## Outcome

- The crate `fgos-yaml-doc` emits a whole document from a value (`emit`), as one `set` of the whole value on an empty
  document, so the existing re-parse check guarantees the text reads back to the value (shape A, no second printer).
- The addon's `yaml` namespace exposes `emit`; `src/util/yaml.mjs` exports `writeFrontmatter(meta, body, file)`, the one
  writer of YAML text in Node, symmetric with `readFrontmatter`.
- The five hand writers (`knowledge-projection.mjs`, `decision-index.mjs`, `case-runtime.mjs`, `knowledge-canary.mjs`,
  `project-agents.mjs`) call `writeFrontmatter`; their fence literals are gone (L10, same series).
- A `doors` row "emit YAML text" in `docs/architecture-manifest.json` fails any other fence-literal writer; it lands with no debt.

Non-goals: no general Node `stringifyYaml` (D2); no change of what any writer means (`approved: yes` stays a string, RUL104);
no change to the standalone `distill.mjs` writer (kept, `oneDoor: standalone`); no regeneration of the committed
`.claude/agents/*.md` unless the owner answers Q1 yes; no Rust caller of `emit` beyond the addon.

## Decisions taken from evidence (no owner question needed)

| ID | Decision | Evidence |
|---|---|---|
| D1 | The writer is the crate's existing shape-A `set`, fixed for an empty document and named `emit`; no new printer | spec section 15 "writer shape A ... no B-then-A" (2026-10-22); `edit.rs:48,261`; gap traced in F2 |
| D2 | **Frontmatter only on the Node surface** (`writeFrontmatter`); the crate's `emit` is general by construction | census F3: every YAML text writer outside the Config crate writes frontmatter; none writes a `.yaml` file; a general export would have no caller (RUL104) |
| D3 | Round-trip proven twice at different layers, no copies: the crate's commit re-parse (every call) plus golden bytes (`golden_emit.rs`, owner of emit); Node checks `isDeepStrictEqual(readFrontmatter(text).meta, meta)` per call (owner of the JS-to-JSON step, wiring proof in `test/util/yaml.test.mjs`); each writer's existing test asserts its own meta value-level | design principle 8; F6 proof owners |
| D4 | ABI marker `yaml` 1 -> 2 and `combinedAbiMatches` requires 2 | `door.mjs:31-35` pattern (`config >= 4`, `holderLock >= 3`) |
| D5 | `distill.mjs` stays a writer, `allowed` in the row with the reader row's reason | 2026-10-20 `oneDoor: standalone`; reader row in the manifest |
| D6 | Doors row lands last with no debt (writers moved first) | lane brief: a fix deletes its debt entry; landing last avoids a hot manifest in five parallel phases |

## Phases

| # | Phase | Owns (writes) | Start after | Effort | Status |
|---|---|---|---|---|---|
| 00 | [Facts and prior art](phase-00-facts.md) | (record only) | - | done | done |
| 01 | [Crate emits a whole document](phase-01-crate-emit.md) | `packages/yaml-doc/rust/src/{edit,lib}.rs`, `packages/yaml-doc/rust/tests/{golden_emit,fixture_shape,api_seal}.rs`, `packages/yaml-doc/contracts/fixtures/{emit.v1.json,README.md}` | approval | 3h | pending |
| 02 | [Addon and Node door write](phase-02-node-door-write.md) | `packages/git/node-addon/{Cargo.toml,src/yaml.rs,src/lib.rs,tests/yaml_parts.rs}`, `src/native/door.mjs`, `src/util/yaml.mjs`, `test/util/yaml.test.mjs`, `test/config/config-door.test.mjs`, `test/git/native-load.test.mjs` | 01 | 3h | pending |
| 03 | [Knowledge projection writer](phase-03-knowledge-projection-writer.md) | `src/report/knowledge-projection.mjs`, `test/report/knowledge-lints.test.mjs` | 02 | 0.5h | pending |
| 04 | [Decisions index writer](phase-04-decision-index-writer.md) | `src/report/decision-index.mjs`, `test/report/decision-index.test.mjs` | 02 | 0.5h | pending |
| 05 | [Case answer writer](phase-05-case-answer-writer.md) | `src/workflow/case-runtime.mjs`, `test/workflow/case-runtime.test.mjs` | 02 | 0.5h | pending |
| 06 | [Knowledge canary writer](phase-06-knowledge-canary-writer.md) | `scripts/knowledge-canary.mjs` | 02 | 0.5h | pending |
| 07 | [Agent projection writer](phase-07-agent-projection-writer.md) | `scripts/project-agents.mjs`, `test/scripts/project-agents.test.mjs` (+ `.claude/agents/*.md` only if Q1 = yes) | 02 | 1h | pending |
| 08 | [Specs and decision record](phase-08-specs-and-decision.md) | `docs/platform/yaml-document/spec.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md` | approval (lands after 02) | 1.5h | pending |
| 09 | [Doors row and close](phase-09-door-row-and-close.md) | `docs/architecture-manifest.json`, `docs/backlog.md`, this `plan.md` status | 03-08 | 1h | pending |

## Parallel map

```text
wave 1:  01 ─────────────┐        08 (writes beside 01; lands after 02)
wave 2:  02 ◄────────────┘
wave 3:  03   04   05   06   07   (all at once; file-disjoint)
wave 4:  09 ◄── 03, 04, 05, 06, 07, 08
```

- Run at the same time: 01 with 08; 03, 04, 05, 06, 07 together (and with 08 if still open).
- Must wait: 02 for 01 (`emit`); 03-07 for 02 (`writeFrontmatter`); 09 for all.
- Hot files inside this plan: none shared between two phases (every file has exactly one owner in the table above).
  `src/util/yaml.mjs` is written only by 02; writers 03-07 import it read-only.

## Data flow

`meta` (JS object) -> `writeFrontmatter` -> `JSON.stringify` -> addon `yaml.emit(json, file)` -> `serde_json` (order kept)
-> `Value::from_json` -> `emit`: `parse("")` + `set([], value)` -> commit re-parses under `tool` and compares -> bytes
-> Node wraps `---\n…---\n` + body -> `readFrontmatter(text)` + `isDeepStrictEqual` -> text returned to the writer -> the
writer's file. Refusals travel back as `YamlParseError` (rule, file; never a value).

## Test matrix

| Layer | Proof (owner) | Phase |
|---|---|---|
| Crate: emitted bytes, quoting, order, round trip under each profile | `golden_emit.rs` over `emit.v1.json` (new family) | 01 |
| Crate: non-empty edits unchanged | `golden_edit.rs` unchanged | 01 |
| Crate: emit sealed (no panic out, bounded time, no value in refusals) | `api_seal.rs` extended | 01 |
| Addon pure half: key order, non-JSON refused, refusal passthrough | `yaml_parts.rs` extended | 02 |
| Node wiring: write then read gives `{ meta, body }`; non-mapping and non-JSON values refused | `test/util/yaml.test.mjs` (one case) | 02 |
| ABI marker | `config-door.test.mjs` (+1 assertion), `native-load.test.mjs` (marker set) | 02 |
| Each writer's meta, value-level | the writer's existing test (one assertion each; 06 the end-to-end canary) | 03-07 |
| Committed projections unchanged | `fgos doc-registry --check`, `fgos decision-index --check` | 03, 04 |
| Only the door emits YAML text | `test/architecture.test.mjs` `checkDoors` over the new row (no test code change) | 09 |
| Whole system | `cargo test --workspace` and full `npm test` once on the integration head (big lead, queue) | before landing on main |

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Root-set change alters bytes of an existing edit | M x M | branch entered only for an empty document and empty path; `edit.v1.json` unchanged and green |
| Emitter quotes a string the profile reads differently | L x H | commit re-parse refuses instead of writing; golden cases `yes`, `null`, `true`, `123`, `": "` |
| Committed generated files drift (`doc-registry.md`, `decisions/index.md`) | L x M | bytes predicted identical (F3); `--check` in 03 and 04 gates |
| Key order lost across N-API | L x M | explicit `preserve_order` on the addon; `yaml_parts.rs` order case |
| Stale addon on a machine | L x M | marker 2, named ABI mismatch at load; machines upgrade together |
| Door row false positive or missed writer | M x L | planning-time dry run matched exactly the six known lines; 09 repeats it red-first |
| Agent files regenerated drop `model:` lines | M x M | not done without owner (Q1) |

## Collision table

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `docs/architecture-manifest.json` | 09: one new `doors` row | COOK S4 (`plans/261115-1501-rust-verb-migration-s4`, every phase adds rows, integration `origin/rust-verb-migration-program/s4`) | additive row; second lander rebases and reruns `test/architecture.test.mjs`; never hand-merge |
| `docs/platform/packaging-distribution/spec.md` | 08: one decision-history entry | S4 phase 12 (section 2 entry points and its own history entry) | different sections; rebase |
| `docs/backlog.md` | 09: row `p-eqhfqpz3gy` | S4 phase 12 (closes `p-bkmh4egqlv`, `p-tgqxcemygh`, `p-wheblpunzi`) | different rows; rebase |
| `CHANGELOG.md` | none (09 proposes a line; big lead writes) | S4 step lead | big lead serializes |
| `test/architecture.test.mjs`, `bin/fgos.mjs`, `src/setup/**`, `src/setup/registrations.mjs`, `apps/fgos/**` | not touched | S4 (hot files) | no collision (`scripts/project-agents.mjs` is only named in a comment of `registrations.mjs:327`) |
| `packages/git/node-addon/src/lib.rs` | 02: marker line 73 | `origin/harden/ci-state-root` (PR #20, adds `driver_for`/`operation` near line 29) | different hunk; rebase |
| `src/util/yaml.mjs` | 02 | board "File chung dễ va": CFG (Slice C); no open branch touches it (scan of the 40 newest origin branches, 2026-11-15) | 02 checks `git log origin/main -- src/util/yaml.mjs` before editing |
| `docs/platform/yaml-document/spec.md`, `docs/platform/component-boundary.md` | 08 | board: HARDEN/DOC write specs per tier | message DOC before landing 08 if a DOC branch is open; rebase |
| MAIL capability reads (`plans/261114-2051-capability-reads-one-door`, branch `plan/capability-reads-one-door`) | none | code landed on main (`1c30f30f8`); its plan names `scripts/project-agents.mjs:168` as prose only, no edit | no collision |
| `test/suite-baseline.json` | none (no Node test file added or deleted) | TEST lane | none |

## Integration and landing

Integration branch `yaml-write-door/integration` from `origin/main`. Each phase lands there after OPC MERGE on its pushed
head. When 09 is in, the plan lead runs (through the big lead's queue) `cargo test --workspace` and one full `npm test` on
the integration head, then tells `forgent-6a` the head; the big lead lands it on main as one series.

## Rollback

Each phase is one revertible commit series. Revert order: 09, then any of 03-07 and 08, then 02, then 01. Reverting 09
needs no debt restore (the row carries none). Reverting a writer phase after 09 has landed fails the row: revert 09 first
or add that writer as a `debt` entry with a reason in the same revert commit. No data format changes: rows 1-4 keep their
bytes; row 5's files change only if regenerated (Q1).

## Acceptance (measurable)

1. `pub fn emit` in `packages/yaml-doc/rust/src/edit.rs`, re-exported; `cargo test -p fgos-yaml-doc` green, `edit.v1.json` unchanged.
2. Addon `versions().yaml === 2`; `nativeDoor().yaml.emit` exists; `writeFrontmatter` exported from `src/util/yaml.mjs`.
3. The new row's patterns hit only `src/util/yaml.mjs` and `core/skills/distill/scripts/distill.mjs` on the integration head;
   on `origin/main` `0b425a2f0` they hit exactly the five writers' lines (F3) plus distill.
4. `fgos doc-registry --check` and `fgos decision-index --check` clean with unchanged committed files.
5. For each of the five writers, its test reads the written block back through `readFrontmatter` and gets the intended meta.
6. `npm test` and `cargo test --workspace` green on the integration head; `docs/backlog.md` row `p-eqhfqpz3gy` is `done`.

## Owner questions (batch)

None blocks a phase: every phase runs with the default stated in the question.

### Q1: regenerate the committed Claude Code agent files now?

- **What is happening:** phase 07 moves `scripts/project-agents.mjs` onto the YAML door. The four committed outputs it owns
  (`.claude/agents/council-assumptions.md`, `council-feedback-loops.md`, `council-ship-maintain.md`, `fgos-placeholder.md`)
  are stale: they still carry `model: sonnet` / `model: haiku`, and the three council files hold invalid YAML frontmatter
  (`description: Council task posture: assumption testing ...`).
- **Cause:** `3133ed474` made the generator name no model (the seat's model is Seat Binding's answer) but did not
  regenerate the committed files, and no test compares them with the generator. Regenerating now would quote the
  descriptions (good) and also drop the `model:` lines, so when Claude Code's Agent tool runs these agents directly they
  would inherit the session's model (often a stronger, costlier one) instead of sonnet/haiku.
- **Options:**
  - (a) Regenerate in phase 07 as a separate commit: one source of truth; the council agents run on the session model in
    direct Claude Code use. Cost: 10 min; possible higher model cost for direct council runs.
  - (b) Do not regenerate here; open a backlog item to decide whether the generator should emit a model for direct
    Claude Code use (and then regenerate). Cost: none now; the committed files stay stale and their frontmatter stays
    invalid YAML until that item lands.
  - (c) Regenerate, then hand-restore the `model:` lines. Rejected by the plan: a hand edit of a generated file (principle 7).
- **Recommendation:** (b). The model question is about agent cost and seat binding, not about the YAML writer; doing it
  here would change model routing as a side effect of a one-door refactor (RUL104). The backlog item carries the evidence above.
- **Scope of the answer:** only the four committed `.claude/agents/*.md` files; the generator change in phase 07 lands
  either way. Default if unanswered when 07 lands: (b).

## Ideas (not planned; RUL104, owner's choice)

| Idea | Problem and evidence | Gain |
|---|---|---|
| A drift check for `.claude/agents/*.md` against `scripts/project-agents.mjs` | committed projections went stale after `3133ed474` unnoticed (F4) | generated agents always equal their source |
