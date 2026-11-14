---
phase: 08
title: "The door made mechanical: rows in the doors table, docs, final equivalence"
status: pending
effort: 2h
depends_on: [02, 03, 04, 05, 06, 07, "F0 phase 01 (plans/261114-2051-rust-verb-migration-program) landed on main"]
---

# Phase 08 — The door made mechanical

## Context

Owner concern: the one door keeps regressing because nothing enforces it (plan.md Facts, last paragraph). The
system has one mechanism for one-door guards: the `doors` table in `docs/architecture-manifest.json`, checked by
`test/architecture.test.mjs`, added by F0 phase 01 (`plans/261114-2051-rust-verb-migration-program/phase-01-manifest-artifact.md`
on `origin/plan/rust-verb-migration-program` 3509d10f3, requirements 5-7). This phase adds rows to that table and
builds no guard of its own.

Row shape (F0 phase 01 req 5): `{ "job": "<plain words>", "patterns": ["<regex source>", ...], "allowed": ["<repo path>", ...], "reason": "<why these files>", "retiredBy": "<step, only for a twin>" }`;
`allowed: []` marks a retired name. F0's later revision (eb2e29d2f, "stale debt fails, new debt needs a reason") may add fields; read the landed schema before writing rows. The check scans product files (tracked `bin/ src/ scripts/ apps/ packages/
.githooks/`, `.mjs .js .cjs .rs .sh .ps1`, no tests or fixtures), comments included, and fails when a pattern
matches outside `allowed`, when an `allowed` path no longer matches (stale), or when a row allows both `.mjs` and
`.rs` without `retiredBy`. Its message names the row's `job`, the file and the line, so the `job` text names the
door to use.

Order: start after F0 phase 01 is on main and 02-07 are merged; rebase the integration branch on main first. All
readers are then switched, the purpose chooser is gone and the tool registry is deleted, so the rows are green when added; the integration
branch lands on main once, so the rows and the last reader move reach main in the same change and can never start red.

## Requirements

1. Rows in `docs/architecture-manifest.json` `doors` (patterns are JS regex sources; calibrate them on the
   rebased branch with the same file list the check uses, and record the calibration in the report):

| job | patterns (intent) | allowed | reason |
|---|---|---|---|
| "read runner.capabilities only through src/runner/execution/capability-config.mjs (one function per field) or bind()'s result" | a property read `.capabilities` followed by a read token (`??`, `\|\|`, `&&`, `?.`, `[`, `)`, `;`, `,`, `===`, `!==`) — not a write (`x.capabilities = …`, as `seat-policy.mjs` builds the crate slice) and not a Rust field chain (`.capabilities.0`, `.iter()`, `{`), excluding the receivers of the other meanings by lookbehind: `contract`, `payload`, `fanOutPayload`, `manifestWithoutDigest`, `manifest`, `report`, `entry`, `provider`, `self`, `a`; a computed read `['capabilities']`; a destructuring that binds `capabilities` (plain or renamed) except from `report` | `src/runner/execution/capability-config.mjs` | the port is the one Node reader. The crate (`packages/seat-binding/rust/src/policy.rs`, `config.capabilities.0`) is the authority over binding fields and is not matched by these JS-shaped patterns; it must not be listed, because a row allowing both an `.mjs` and an `.rs` file is F0's twin rule (needs `retiredBy`) and these are not twins |
| "choose an executor from a capability's prefer only in the seat-binding crate; ask bind() (or purposeSeatOf in src/runner/dispatch/plan.mjs)" | `\bpreferOf\(`, `\bnormalizePreferCandidates\(`, `\bbindingTasteOf\(` | `src/runner/execution/capability-config.mjs` (definitions), `src/runner/execution/seat-policy.mjs` (crate slice), `src/runner/dispatch/config.mjs` (load validator: named executors exist), `src/setup/seat-binding-checks.mjs` (which capabilities to dry-bind; it then asks bind()) | reading `prefer` here never picks an executor |
| "the purpose chooser outside bind() is gone" | `\bresolveExecutorAndOverrides\b`, `capability\.prefer` | `[]` (retired) | deleted in phase 06 |
| "tool lookup by capability: ask toolProvidersOf in src/runner/dispatch/tool-providers.mjs (or fgos dispatch decide --for)" | a read of an executor's `for` (`.for` not followed by `(`, receivers `flags`, `opts`, `Symbol` excluded by lookbehind; a computed `['for']` after an identifier); `\bprobeTool\b`; `\bisIndexStale\b`; `\bnormalizeCapability\b` | `src/runner/dispatch/tool-providers.mjs` | the one reader of `for` and the one probe |
| "the old tool registry and its overlay are gone" | `\btoolsFromExecutors\b`, `\bqueryTools\b`, `\bcheckTools\b`, `\breadLocalStatus\b`, `\bwriteLocalStatus\b`, `tool-status\.local`, `tool-registry\.mjs`, `\bfgos tool (query\|check)\b` | `[]` (retired) | deleted in phase 07 |
| "the raw capability section is handed out only for the run record and doctor presence" | `\bcatalogOf\(` | `src/runner/execution/capability-config.mjs`, `src/runner/execution/run.mjs`, `src/setup/registrations.mjs` | the only port function that returns the section |

   Patterns hit comments and message strings too (F0's rule). Calibrated today (781537524) the first row's intent
   also matches prose such as `Object.keys(runner.capabilities)` in comments (`bin/fgos.mjs:2327`,
   `src/report/capability-plan-lint.mjs:608`) and `cfg.capabilities[...]` (`src/runner/dispatch/resolve.mjs:212`).
   Product Rust files with other meanings (`packages/distribution`, `packages/host-runtime`, `packages/terminal-control`)
   do not match the read tokens or are excluded by receiver; the calibration run must show zero `.rs` hits.
   Those files belong to phases 03, 05, 06 and 07, which reword the comments (no message text a user sees is
   changed for this). If calibration finds a hit in a file no phase owns, stop and ask the big lead rather than
   widening `allowed`.
2. No change to `test/architecture.test.mjs` and no unit cases of our own: the rows are data proven by F0's general
   check and its cases (F0 phase 01 req 7; design principle 8, one proof).
3. Docs (Vietnamese where the file is Vietnamese; holders through `docs/platform/governance.md#decision-scope-to-holder-table`;
   seat-binding has its own §15 history):
   - `docs/platform/seat-binding/spec.md` §3: one rule line — every read of `runner.capabilities` goes through
     `bind()` (binding fields, via the crate) or `src/runner/execution/capability-config.mjs` (one function per
     field), and an executor is chosen from `prefer` only by the crate (a purpose through `purposeSeatOf`),
     enforced by the `doors` rows; §16 Pointers: the port, `purposeSeatOf`, the rows; §15: a dated 2026-11-14
     entry "step 1 of the capability-rows decision implemented": what moved, the purpose chooser and reverse match
     removed, the tool registry verb and overlay retired in favour of `decide` (owner decisions Q1-Q3; the D1/D5 narrative removed from `resolve.mjs`), the Intended
     deltas, the leftovers for step 2 (plan.md), evidence `plans/261114-2051-capability-reads-one-door/reports/equivalence/`.
     Q1 "one path" narrows the 2026-08 D5 rule ("only `prefer` binds a purpose") for tool executors: record it in the
     §15 entry; if `docs/platform/governance.md` requires a decision id for narrowing a recorded decision, mint one with
     `fgos identity mint d-adr`.
   - `docs/platform/vision.md:169-182`: the bullet says step 1 landed, pointing at the spec §3 line; step 2 text unchanged.
   - No `docs/reading-map.md` edit and no `CHANGELOG.md` line from this phase (phase 06's user-visible change, if
     any, is the big lead's CHANGELOG call: `fgos dispatch decide --for` now answers with the bound executor).
4. Final equivalence: run `compare-capability-reads.mjs --base <781537524 worktree> --head <integration branch>`
   (0 failures outside the allowlist; commit `reports/equivalence/final.summary.json`), and
   `npm run fgos:dev -- doctor --json` at head: the seven rows of phase 01 req 10 print the messages saved in
   `doctor-base.json`; commit `reports/equivalence/doctor.summary.json` (digests and equal/different per row only).

## Files

- Modify: `docs/architecture-manifest.json` (`doors` rows only), `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`
- Create: `plans/261114-2051-capability-reads-one-door/reports/equivalence/final.summary.json`, `.../doctor.summary.json`
- Delete: none

## Tests

- New: none (rows are data under F0's check). Retired: none.

## Gates

```
node scripts/run-tests.mjs test/architecture.test.mjs test/runner/execution/capability-config.test.mjs test/scripts/doc-health.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Then, before landing, the big lead runs `npm test` and `cargo test --workspace` on the integration branch (Rust
untouched; the cargo gate is the repo DoD). Rust fmt/clippy/msvc/aarch64-apple-darwin: N/A — confirm with
`git diff --stat origin/main -- packages apps Cargo.lock` = empty.

## Net size

manifest: +~45 lines (six rows); docs: +~15 lines.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| F0 phase 01 not landed or its row shape changed | M x M | dependency in plan.md; read the landed `doors` schema before writing rows |
| A pattern hits prose or another meaning | M x L | receiver lookbehinds; reword comments in files this plan already owns; ask the big lead for any other file |
| A pattern misses a read (false negative) | M x M | three shapes covered (property, computed, destructuring); the port never returns an entry; the `catalogOf` row closes the only path to raw entries |
| Rows land red | L x H | written after 02-07 merged and the branch rebased on F0; run the check before commit |
| `docs/architecture-manifest.json` written by F0 at the same time | M x M | rows are an additive block; rebase first; plan.md Collision risk |

## Rollback

Revert the phase merge (plan.md Rollback); rows and docs have no runtime effect.

## Success criteria

The `doors` check green with the six rows; harness 0 failures and doctor rows equal (summaries committed);
docs gates green; `git diff --stat origin/main` shows no file under `core/config-standard`, `core/config-schema`,
`packages`, `apps`, nor `CHANGELOG.md`, `Cargo.lock`.
