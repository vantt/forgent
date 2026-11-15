---
title: "YAML write door: one writer of YAML text"
description: "The native YAML door gains emit; the five hand-written frontmatter writers use it; a doors row keeps fence writing in the door; every emitted block reads back to the same value."
status: pending
priority: P2
effort: 13.5h (9 executable phases; longest chain 01 -> 02 -> 07 -> 08 -> 09, about 11h)
branch: plan/yaml-write-door
tags: [refactor, one-door, yaml, rust, node]
blockedBy: []
blocks: []
created: 2026-11-15
---

# YAML write door

Source: backlog row `p-eqhfqpz3gy` (`docs/backlog.md:23` on `origin/main` `83a8178b2`), owner approved 2026-11-15; it was option (a) of Q1 in
`plans/261114-2215-one-door-debt/plan.md` (Ideas row 1). Its precondition ("after the capability-reads and one-door-debt
plans close") holds: capability reads landed (`1c30f30f8` on main), one-door-debt landed (`67a4c9380`, last phase). Code
read on `origin/main` `0b425a2f0`. Facts, census and prior art: [phase-00-facts.md](phase-00-facts.md). Rules for every
phase lead: [phase-lead-rules.md](phase-lead-rules.md).

## Outcome

- The crate `fgos-yaml-doc` emits a whole document from a value (`emit`), as one `set` of the whole value on an empty
  document, so the existing re-parse check guarantees the text reads back to the value; keys keep the caller's order;
  hidden (bidi, zero-width) characters are escaped, never written raw.
- The addon's `yaml` namespace exposes `emit`; `src/util/yaml.mjs` exports `writeFrontmatter(meta, body, file)`, the one
  writer of YAML text in Node, symmetric with `readFrontmatter`, which re-reads every block it writes.
- The five hand writers (`knowledge-projection.mjs`, `decision-index.mjs`, `case-runtime.mjs`, `knowledge-canary.mjs`,
  `project-agents.mjs`) call `writeFrontmatter`; their fence literals are gone (L10, same series).
- A `doors` row "write a YAML frontmatter fence" fails any other fence-literal writer in the scanned roots; no debt.
  Stated limit: YAML built without a fence literal, or outside the scanned roots/extensions, is not seen by the row; the
  census (F3) found none.

Non-goals: no general Node `stringifyYaml` (D2); no change of what any writer means (`approved: yes` stays a string,
RUL104); no change to the standalone `distill.mjs` writer (kept, `oneDoor: standalone`; its url check gets a backlog
row); no regeneration of the committed `.claude/agents/*.md` (Q1, backlog row); no Rust caller of `emit` beyond the addon.

## Decisions taken from evidence (no owner question needed)

| ID | Decision | Evidence |
|---|---|---|
| D1 | The writer is the crate's shape-A `set`, made to meet its own contract on an empty document and named `emit`: a bounded render of new content with the renderers `set` already uses, not a shape-B re-render of an existing document | spec section 15 (2026-10-22); `edit.rs:48,261`; gap F2 |
| D2 | **Frontmatter only on the Node surface** (`writeFrontmatter`); the crate's `emit` is general by construction | census F3: every YAML text writer outside the Config crate writes frontmatter; none writes a `.yaml` file; a general export would have no caller (RUL104) |
| D3 | Round trip owned at two layers, no copies: the crate (commit re-parse on every call; golden bytes in `edit.v1.json`) and Node (`writeFrontmatter` re-reads with `readFrontmatter` and compares on every call; one wiring proof). Writer tests add no read-back assertion when their meta is a literal; 05 owns a malformed-input case, 07 a quoting case (its bytes change) | design principle 8; F6 |
| D4 | ABI marker `yaml` 1 -> 2; `combinedAbiMatches` requires 2 (one conjunction: a stale addon disables the whole door for this payload; landing pairs them) | `door.mjs:31-35` |
| D5 | `distill.mjs` stays a writer, `allowed` with the reader row's reason; its url injection becomes a backlog row | 2026-10-20 `oneDoor: standalone`; `distill.mjs:245,288` |
| D6 | Doors row lands last with no debt | lane brief; avoids five phases writing the manifest |
| D7 | `preserve_order` belongs to `fgos-yaml-doc` (owner of `Value::from_json`), not the addon | F2: `-p fgos-yaml-doc` sorts keys today |
| D8 | Hidden characters in values are escaped by the emitter (quoting only; no refusal rule, no profile change), reusing `Hidden::of` | F2; spec section 6 I2 (2026-10-22) applies the same set to comment text |
| D9 | The answer view (05) coerces untrusted round fields to JSON-plain values so it never throws on a malformed inbox file | `case-runtime.mjs:152-158,271-272,349` |
| D10 | Writer phases stay separate (owner asked for small parallel phases) but share one Cargo target while their Rust is byte-identical (a rebase that brings Rust moves a phase to a private target) and regenerate the census per commit | phase-lead-rules; `scripts/lib/git-addon-stage.mjs:37-40` |

## Phases

| # | Phase | Owns (writes) | Start after | Effort | Status |
|---|---|---|---|---|---|
| 00 | [Facts and prior art](phase-00-facts.md) | (record only) | - | done | done |
| 01 | [Crate emits a whole document](phase-01-crate-emit.md) | `packages/yaml-doc/rust/{Cargo.toml,src/edit.rs,src/lib.rs,tests/golden_edit.rs,tests/api_seal.rs}`, `packages/yaml-doc/contracts/fixtures/edit.v1.json` | approval | 4h | pending |
| 02 | [Addon and Node door write](phase-02-node-door-write.md) | `packages/git/node-addon/{src/yaml.rs,src/lib.rs,tests/yaml_parts.rs}`, `src/native/door.mjs`, `src/util/yaml.mjs`, `test/util/yaml.test.mjs`, `test/config/config-door.test.mjs`, `test/git/native-load.test.mjs` | 01 | 3h | pending |
| 03 | [Knowledge projection writer](phase-03-knowledge-projection-writer.md) | `src/report/knowledge-projection.mjs` | 02 | 0.5h | pending |
| 04 | [Decisions index writer](phase-04-decision-index-writer.md) | `src/report/decision-index.mjs` | 02 | 0.5h | pending |
| 05 | [Case answer writer](phase-05-case-answer-writer.md) | `src/workflow/case-runtime.mjs`, `test/workflow/case-runtime.test.mjs` | 02 | 1h | pending |
| 06 | [Knowledge canary writer](phase-06-knowledge-canary-writer.md) | `scripts/knowledge-canary.mjs` | 02 | 0.5h | pending |
| 07 | [Agent projection writer](phase-07-agent-projection-writer.md) | `scripts/project-agents.mjs`, `test/scripts/project-agents.test.mjs` | 02 | 1h | pending |
| 08 | [Specs and decision record](phase-08-specs-and-decision.md) | `docs/platform/yaml-document/spec.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md` | approval (lands after 07) | 1.5h | pending |
| 09 | [Doors row and close](phase-09-door-row-and-close.md) | `docs/architecture-manifest.json`, `test/architecture.test.mjs` (one seeded-case test), `docs/backlog.md`, this `plan.md` status | 03-08 | 1.5h | pending |

Shared by every code phase: `packages/git/contracts/mutation-census.v1.json` (regenerated, never hand-merged; F7).

## Parallel map

```text
wave 1:  01 ─────────────┐        08 (writes beside 01-07; lands after 07)
wave 2:  02 ◄────────────┘
wave 3:  03   04   05   06   07   (all at once; file-disjoint except the census)
         08 lands ◄── 07 (and 02-06)
wave 4:  09 ◄── 03, 04, 05, 06, 07, 08
```

- Run at the same time: 01 with 08 (writing); 03, 04, 05, 06, 07 together (08 may still be writing).
- Must wait: 02 for 01 (`emit`); 03-07 for 02 (`writeFrontmatter`); 08's landing for 07 (it cites the reports of 01-07); 09 for all.
- Hot file inside this plan: `packages/git/contracts/mutation-census.v1.json` only. Every code commit regenerates it on its
  own tree (the pre-commit hook requires it); landings on the integration branch are serialized by OPC's MERGE order, and
  each later lander drops its census hunk, rebases, and regenerates (phase-lead-rules). Every other file has exactly one owner.
- Wave 3 shares one Cargo target (`ywd-node-target`): one cold addon build, cargo's lock serializes the rest.

## Data flow

`meta` (JS object) -> `writeFrontmatter` (plain-object check) -> `JSON.stringify` (throw -> `frontmatter-not-json`) ->
addon `yaml.emit(json, file)` -> `serde_json` (order kept by the crate) -> `Value::from_json` -> `emit`: `parse("")` +
`set(&[], value)` (Rust empty slice; the fixture text form is `""`) -> commit re-parses under `tool` and compares -> bytes -> Node wraps `---\n…---\n` + body ->
`readFrontmatter(text)` + `isDeepStrictEqual` (else `frontmatter-not-round-trip`) -> text -> the writer's file. Refusals
reach the writer as `YamlParseError` (rule, file; never a value).

## Test matrix

| Layer | Proof (owner) | Phase |
|---|---|---|
| Crate: empty-document `set` and `emit` bytes, quoting, hidden-character escape, key order, round trip | `golden_edit.rs` over `edit.v1.json` (new cases), run with `-p fgos-yaml-doc` | 01 |
| Crate: existing edits unchanged | existing `edit.v1.json` cases | 01 |
| Crate: `emit` sealed (no panic out, bounded time, no value in refusals) | `api_seal.rs` extended | 01 |
| Addon pure half: order, refusal passthrough | `yaml_parts.rs` extended | 02 |
| Node wiring: write then read gives `{ meta, body }`; non-mapping, cyclic, `Date` refused value-free | `test/util/yaml.test.mjs` (one case) | 02 |
| ABI marker | `config-door.test.mjs` (+1 assertion), `native-load.test.mjs` (marker set) | 02 |
| Answer view survives a malformed inbox round | `test/workflow/case-runtime.test.mjs` (one new case) | 05 |
| Agent frontmatter: tools, skills list, `": "` description read back | `test/scripts/project-agents.test.mjs` (assertions moved to value level) | 07 |
| Committed projections unchanged | `test/scripts/doc-health.test.mjs:150-154` (decisions index fixpoint); `fgos doc-registry --check` (no test owns `docs/doc-registry.md` today) | 03, 04 |
| Census matches the tree | `test/setup/git-mutation-census.test.mjs` | every code phase |
| The row's patterns catch every literal fence form and ignore other dashes | `test/architecture.test.mjs`, one seeded-case test (`caught`/`passed`, red first) | 09 |
| Only the door writes a fence in the repo | `test/architecture.test.mjs` live `checkDoors` over the new row | 09 |
| Per-crate map order after `preserve_order` | `cargo test -p` for `fgos-host-runtime`, `fgos-convention`, `fgos-run-result`, `fgos-seat-binding`, `fgos-identity --features provider` | 01 |
| Whole system | `cargo test --workspace` and one full `npm test` on the integration head (big lead's queue) | before landing on main |

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Census conflicts between parallel phases | H x L | regenerate-never-merge rule; serialized landings |
| Root-set change alters bytes of an existing edit | M x M | branch only for empty document + empty path; existing `edit.v1.json` cases unchanged |
| Emitter quotes a string the profile reads differently | L x H | commit re-parse refuses; cases `true`/`null`/`123`/`1e5`/`0123`/hex digest |
| Key order sorted in a per-crate build | M x M | `preserve_order` on the crate; non-alphabetical case under `-p` |
| `preserve_order` flips map order in per-crate builds of five crates without `fgos-config` | M x M | per-crate `cargo test -p` gates in 01 |
| A typo in a door pattern stays green | M x M | seeded-case test in 09 (red first) |
| Stale MERGE carried to a changed landing head | L x M | MERGE carries over only when range-diff shows census-only change (phase-lead-rules) |
| Hidden characters written raw into agent files | M x M | escape in the emitter (D8) |
| Answer view throws after durable writes | M x H | coercion (D9) and the malformed-round case |
| Committed index drifts and `readDecisionIds` silently empties | L x H | doc-health fixpoint test in 04's gate |
| Stale addon paired with the new payload disables the whole native door | M x H | landing step below; machines upgrade together |
| Five cold Rust builds in wave 3 | M x L | shared target while Rust is identical (D10) |
| Door row misses a writer | L x M | stated limit; census F3 over all roots and extensions found none |

## Collision table

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `packages/git/contracts/mutation-census.v1.json` | every code phase (regenerated) | every product change on main (COOK S4, HARDEN) | regenerate after each rebase; never hand-merge |
| `docs/architecture-manifest.json` | 09: one new `doors` row | COOK S4 (`plans/261115-1501-rust-verb-migration-s4`, every phase adds rows, integration `origin/rust-verb-migration-program/s4`) | additive; second lander rebases and reruns `test/architecture.test.mjs` |
| `docs/platform/packaging-distribution/spec.md` | 08: one decision-history entry | S4 phase 12 (section 2 and its own history entry) | different sections; rebase |
| `docs/backlog.md` | 09: one row done, two new rows | S4 phase 12 (closes `p-bkmh4egqlv`, `p-tgqxcemygh`, `p-wheblpunzi`) | different rows; rebase |
| `CHANGELOG.md` | none (09 names a candidate line) | S4 step lead | big lead serializes |
| `test/architecture.test.mjs` | 09: one seeded-case test beside the YAML parser row's cases | S4 (`ARM_STATIC_IMPORTS` and its own rows' cases) | additive; rebase handles it; rerun the file |
| `bin/fgos.mjs`, `src/setup/**`, `apps/fgos/**` | not touched | S4 hot files | no collision (`registrations.mjs:327` names `project-agents.mjs` in a comment only) |
| `packages/git/node-addon/src/lib.rs` | 02: marker line 73 | `origin/harden/ci-state-root` (PR #20, `driver_for`/`operation` near line 29) | different hunk; rebase |
| `src/util/yaml.mjs` | 02 | board "File chung dễ va": CFG; no open branch touches it (scan of the 40 newest origin branches, 2026-11-15) | 02 step 1 checks `git log` first |
| `docs/platform/yaml-document/spec.md`, `docs/platform/component-boundary.md` | 08 | board: HARDEN/DOC | message DOC before landing 08 if a DOC branch is open |
| MAIL capability reads (`plans/261114-2051-capability-reads-one-door`, branch `plan/capability-reads-one-door`) | none | code landed (`1c30f30f8`); its plan names `scripts/project-agents.mjs:168` as prose only | no collision |
| `test/suite-baseline.json` | none (no Node test file added or deleted) | TEST lane | none |

## Integration and landing

Integration branch `yaml-write-door/integration` from `origin/main`. Each phase lands there after OPC MERGE on its pushed
head. When 09 is in, the plan lead runs (big lead's queue) `cargo test --workspace` and one full `npm test` on the
integration head, then tells `forgent-6a` the head; the big lead lands it on main as one series. Because the addon marker
moves to 2 (D4), landing on main is followed in the same window by: build, stage and activate the new release on this
machine; `fgos doctor` through the installed shim; a board line; and an owner-machine sync guide linked on the board, so
no machine runs a new payload with an old addon.

## Rollback

Each phase is one revertible commit series (regenerate the census on the reverted tree). Revert order: 09, then any of
03-07 and 08, then 02, then 01. Reverting 09 needs no debt restore. Reverting a writer after 09 has landed fails the row:
revert 09 first, or add that writer as a `debt` entry with a reason in the same revert commit. Reverting 02 after an
activation needs the release rebuilt and reactivated. No data format changes: rows 1-4 keep their bytes.

## Acceptance (measurable)

1. `pub fn emit` re-exported by `fgos-yaml-doc`; `cargo test -p fgos-yaml-doc` green with `-p`; existing `edit.v1.json` cases unchanged; `Cargo.lock` unchanged.
2. Addon `versions().yaml === 2`; `nativeDoor().yaml.emit` exists; `writeFrontmatter` exported; no general emitter export.
3. The new row hits only `src/util/yaml.mjs` and `core/skills/distill/scripts/distill.mjs` on the integration head; on
   `origin/main` `0b425a2f0` the same patterns hit exactly the five writers (F3) plus distill (planning-time dry run).
4. `docs/decisions/index.md` and `docs/doc-registry.md` byte-identical (doc-health fixpoint test; `doc-registry --check`).
5. Each writer goes through `writeFrontmatter`, which re-reads every block to the intended meta; 05's malformed-round case and 07's `": "` case green.
6. `npm test` and `cargo test --workspace` green on the integration head; backlog row `p-eqhfqpz3gy` `done`; the two follow-up rows exist.

## Owner questions (batch)

None blocks a phase: every phase runs with the default stated in the question.

### Q1: regenerate the committed Claude Code agent files?

- **What is happening:** phase 07 moves `scripts/project-agents.mjs` onto the YAML door. The four committed outputs it owns
  (`.claude/agents/council-assumptions.md`, `council-feedback-loops.md`, `council-ship-maintain.md`, `fgos-placeholder.md`)
  are stale: they still carry `model: sonnet` / `model: haiku`, and the three council files hold invalid YAML frontmatter
  (`description: Council task posture: assumption testing ...`).
- **Cause:** `3133ed474` made the generator name no model (the seat's model is Seat Binding's answer) but did not
  regenerate the committed files, and no test compares them with the generator. Regenerating would quote the descriptions
  (good) and also drop the `model:` lines, so Claude Code's Agent tool would run these agents on the session's model
  (often stronger and costlier) instead of sonnet/haiku.
- **Options:**
  - (a) Regenerate as they are generated today: one source of truth; possible higher model cost for direct council runs. About 10 min.
  - (b) First decide whether the generator should write a model for direct Claude Code use, then regenerate. About 1h, one small item.
  - (c) Leave them as they are. Free; the three council files keep invalid frontmatter and the files keep drifting.
- **Recommendation:** (b): the model choice is a cost and seat-binding question, not part of the YAML writer, and doing (a)
  here would change model routing as a side effect of a one-door refactor (RUL104).
- **Scope of the answer:** the four committed files and the generator's model field only. This plan does not regenerate
  them under any answer; phase 09 opens the backlog row and records the answer there.

## Red Team Review

Four reviewers (failure modes, assumptions, security, scope and contracts), 2026-11-15. 29 findings, deduplicated to 17;
14 accepted, 3 rejected. Every accepted finding is applied in the phase files listed.

| # | Finding (severity) | Disposition | Applied in |
|---|---|---|---|
| 1 | Committed mutation census pins every edited file; pre-commit refuses without regeneration; parallel phases collide (Critical, 3 reviewers) | Accept | F7, phase-lead-rules, every phase Files list, plan hot files and collision table |
| 2 | `preserve_order` only on the addon; `-p fgos-yaml-doc` sorts keys (High, 3) | Accept | D7, 01 req 4, 02 req 1 |
| 3 | "Bidi value refused by check_value" is false; emitter writes hidden characters raw (High, 2) | Accept: escape in the emitter, no new rule | D8, 01 req 3, 08 |
| 4 | Answer view throws on untrusted inbox data after durable writes (High, 3) | Accept | D9, 05 |
| 5 | Stale addon disables the whole native door; no activation step (High, 2) | Accept | D4, 02 req 2, Integration and landing |
| 6 | New fixture family duplicates `edit.v1.json`; `set` change lacks its owning proof (High) | Accept | 01 Proofs (cases in `edit.v1.json`, no new family) |
| 7 | Tautological per-writer read-back assertions (Medium) | Accept | D3, 03, 04 (no test change), 05 |
| 8 | `JSON.stringify` throws raw `TypeError`; dead `yaml-emit-not-json` id (Medium, 2) | Accept | 02 req 3 (`frontmatter-not-json`), req 1 (no new addon id) |
| 9 | Doors row overclaims "only the door emits YAML text"; constant fence not matched (Medium, 3) | Accept: renamed job, `;` added, limit stated | Outcome, 09 |
| 10 | Project-agents changes field types (number description) (Medium) | Accept | 07 (`String(...)`) |
| 11 | `distill.mjs` url allows newline injection (Medium) | Accept as backlog row (standalone script, out of scope) | D5, 09 |
| 12 | Decisions-index drift silently empties `readDecisionIds`; name the drift proof (Medium, 2) | Accept | 04, test matrix |
| 13 | Consumers needing the addon not listed (Medium) | Accept: listed; each path already loads the door | 03, 04 |
| 14 | Wrong citation `project-agents.mjs:101-104`; `FIXTURE_FILES` length (Medium) | Accept (citation fixed; fixture list no longer changes) | F4, 01 |
| 15 | Merge 03-06 into one phase (Medium, 2) | Reject: the owner asked for small, file-disjoint parallel phases; the build cost is met by a shared target instead (D10) | phase-lead-rules |
| 16 | Drop Q1 and its conditional branches (Medium) | Partly accept: conditional regeneration removed from 07 and 09; Q1 stays because the model field is owner intent (cost), answered into a backlog row | 07, 09, Q1 |
| 17 | Cap meta size before cloning in `emit` (Medium) | Reject: the `tool` profile's limits and the depth check already bound input; callers write a handful of keys; no evidence of a real path to large meta | - |

Rejected without evidence filter: none (every finding cited file:line).

### OPC review of 73545bbdb (applied)

One blocking change and six folds, each re-verified on `origin/main` `83a8178b2`: B1 seeded cases for the new row
(09; patterns simulated over the `lexSource` code view, all cases as intended); N1 per-crate gates for the five crates
that reach `fgos-yaml-doc` without `fgos-config` (01; `cargo tree --offline -p`); N2 shared-target validity and the
staging-log rule (phase-lead-rules); N3 MERGE carry-over only for census-only deltas (phase-lead-rules); N4 08 lands after
07 (08, parallel map); N5 the `:45` test title is pinned by `scripts/check-decision-codes.baseline.json:217-219` (07);
N6 the fixture's empty path is `""` (01) and the backlog row is at `docs/backlog.md:23`.

### Whole-Plan Consistency Sweep

Decision deltas: no `emit.v1.json`/`golden_emit.rs` (cases in `edit.v1.json`); `preserve_order` on the crate, not the
addon; no addon id `yaml-emit-not-json`; Node ids `frontmatter-not-json`, `frontmatter-not-round-trip`; row job renamed
"write a YAML frontmatter fence"; no conditional regeneration in 07/09; census owned per commit; red-first scratch run in
09 dropped. Searched all plan files for `golden_emit`, `emit.v1`, `yaml-emit-not-json`, `emit YAML text`, `Q1 = yes`,
`FIXTURE_FILES`: remaining hits are only in this review table, where they name what was removed. No unresolved contradiction.

## Validation Log

### Verification Results
- Claims checked: 61 (planner self-check plus the reviewers' fact-check lists)
- Verified: 58 | Failed: 3 | Unverified: 0
- Tier: Full
- Failures (all corrected above): `scripts/project-agents.mjs:101-104` (actual `:106-110`); "bidi value refused by
  `check_value`" (`edit.rs:438-443` checks depth only); "`preserve_order` on the addon suffices"
  (`packages/yaml-doc/rust/Cargo.toml:8`, `model.rs:35-39`).

### Decisions (validate interview)

This plan runs as a delegated planner with no live owner channel; the critical questions were settled from evidence
(D1-D10). The one question that depends on owner intent is Q1 above, and no phase waits on it.
