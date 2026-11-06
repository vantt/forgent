---
phase: 03
title: "fgOS-repo rows move to npm test, pre-commit and the release check; the two history-derived indexes check only what the checkout has"
status: pending
depends_on: [02]
parallel: "none (registrations.mjs and git-checks.mjs chains)"
owning_lane: "HARDEN (reviewers: TEST for every new owning proof, DOC for the indexes, OPC for the census)"
effort: ~1d
net_size: "Node −300 / Rust 0 / tests −100 (estimate)"
---

# Phase 03 — Repo rows to tests

## Context

Decision 65 (1a). The biggest time win: `enduser-docs-index-stale` alone is 19.7 s of 45 s (audit §4). Rows (audit class H/O, home R); code read on `fd476d709`:

| Row id | Body | Registration | New home |
|---|---|---|---|
| `enduser-docs-index-stale` (+fix) | `registrations.mjs:2838-2869`, fix `:2875-2887` | `:2888-2898` | `npm test`: disk path set (`enumerateDocEntries`, `src/report/enduser-index-generate.mjs:89`) equals the committed index's `docPath` set; no Work fold |
| `decision-index-stale` (+fix) | `:2920-2955`, fix `:2962-2983` | `:2984-2993` | `npm test`: the committed `docs/decisions/index.md` is a fixpoint of `buildDecisionIndexMarkdown([], committed)` (`src/report/decision-index.mjs:40`); with no local state `computeDecisionIndex` reduces to committed rows (`:90`) |
| `instruction-projections-stale` (+fix) | `:2995-3051`, fix `:3052-3070` | `:3071-3081` | `npm test`: `inspectInstructionProjection(repoRoot).passed` (`src/setup/instruction-projections.mjs:278`); regeneration joins `npm run build:skills` (`scripts/build-skill-wrappers.mjs`) |
| `git-mutation-one-door` | `src/setup/git-checks.mjs:94-99` | `registrations.mjs:5494-5499` | `test/setup/git-mutation-census.test.mjs:13` already runs it on the repo payload; it calls `verifyCensus` (`scripts/git-one-door-scan.mjs`) directly; pre-commit census stays (`test/githooks/census-drift.test.mjs`) |
| `identity-ids-unique` | `src/setup/identity-checks.mjs:286-` | `registrations.mjs:5432-5436` | `npm test` over the tracked registries (backlog, ADR headings, decision files) |
| `observe-run-coverage` | `registrations.mjs:5286-5340` | `:5470-5474` | deleted: host/Node admission parity is owned by the shared run-layout fixture (`test/fixtures/run-layout`, Node `test/runner/assignment-layout.test.mjs`, the Observe crate's tests over the same fixture; registry contract §3 says so) |
| `changelog-unreleased-stale` | `:2736-2771` (+ exports `extractUnreleasedSection`, `unreleasedHasEntries`, used nowhere else) | `:2772-2776` | deleted: `scripts/prepare-release.mjs:141-152` refuses an empty `[Unreleased]` at release; `test/scripts/prepare-release.test.mjs` owns it |
| `readme-install-tag-exists` | `:2786-2814` | `:2815-2819` | `npm test` over the checkout (CI has tags: `.github/workflows/ci.yml:32` `fetch-depth: 0`) |
| `convention-conformance` | `:5153-5272` | `:5273-5278` | `npm test` over the checkout through the same host judgment (block posture always fails; warn-posture paths after the rule cutoff fail) |

`active-release-matches-checkout` stays (UQ-1, default (a)).

## Requirements

- **One owning proof per moved judgment, at the lowest layer that observes it** (design principle 8). Repo-scan cases go into the file that already owns repo-tree checks: `test/scripts/doc-health.test.mjs` for the indexes, ids and README tag (all read tracked docs), the census in `test/setup/git-mutation-census.test.mjs` (renamed only if the lead shows the old name misleads; otherwise kept), convention in the file that owns convention behaviour (`test/setup/convention-doctor-check.test.mjs` renamed by `git mv` to a name from `fgos convention name` if it no longer tests doctor). A judgment's body moves to where its only remaining caller can import it without making product code test-only: into `scripts/` beside `git-one-door-scan.mjs` (doc-health precedent), or stays in `src/report/*` when a product verb also calls it (the index generators).
- **Indexes, history-free.** The enduser proof uses only `enumerateDocEntries` and the committed JSON; the decision proof only the committed markdown and the pure renderer. Neither opens `.fgos`. A run in a checkout with no `.fgos` (CI) and one with full history give the same answer.
- **Instruction projections.** `scripts/build-skill-wrappers.mjs` also calls `materializeInstructionProjection(repoRoot)` and prints what it wrote; the test asserts `inspectInstructionProjection(repoRoot).passed && materialized`. The `execFileSync` child helper `runInstructionProjectionHelper` (`registrations.mjs:2995-3022`) goes with the rows. AGENTS.md "Dispatch" paragraph that names `npm run build:skills` already covers the door; the gate rewrite in P10 names projections.
- **Census.** `checkMutationOneDoor` (`git-checks.mjs:94-99`) and its `OWN_PAYLOAD_ROOT`/`verifyCensus` imports leave `src/setup`; the test calls `verifyCensus` on the repo root.
- **No skip without a reason.** The README tag case skips with `t.skip('<reason>')` only when the checkout lists no tags at all; never passes silently.
- **Delete** every moved body, registration, fix and import from `src/setup`; delete `fixEnduserDocsIndexStale` and `fixDecisionIndexStale`: projects refresh with `fgos docs-index` / `fgos decision-index` (verbs unchanged).
- Run the plan.md id grep for all nine ids; the `release-tree` test (`test/rust-host/release-tree.test.mjs`) names `convention-conformance`: update.
- `CHANGELOG.md`: nine rows and three fixes leave doctor; where each judgment now runs; projects that adopted the indexes refresh with the verbs.

## Files

**Create:** a test case per moved judgment in the existing owning files (no new test file unless a judgment has no owning file; then one, named via `fgos convention name`). Possibly `scripts/<convention conformance>.mjs` if the body has no product caller (name via convention).

**Modify:**
- `src/setup/registrations.mjs` (ranges above; imports)
- `src/setup/git-checks.mjs:12,94-99`, `src/setup/identity-checks.mjs:286-` (moved out)
- `scripts/build-skill-wrappers.mjs`
- Tests: `test/setup/checks.test.mjs:576-820` (row cases), `test/setup/instruction-projections.test.mjs:167`, `test/setup/git-mutation-census.test.mjs`, `test/setup/identity-checks.test.mjs`, `test/setup/readme-tag-check.test.mjs`, `test/setup/observe-doctor-checks.test.mjs:89-200`, `test/setup/convention-doctor-check.test.mjs`, `test/rust-host/release-tree.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/registrations.test.mjs`
- Docs: registry contract §3 (`observe-run-coverage`, `convention-conformance`, `active-release-matches-checkout` paragraphs: the first two move to "Owning proofs outside doctor"), `docs/platform/observe/spec.md`, `docs/platform/identity/spec.md` (ids-unique), `docs/platform/convention/spec.md` if it names the row, `CHANGELOG.md`, `docs/architecture-manifest.json` for any moved/new `scripts`/`src` file

**Delete:** `test/setup/readme-tag-check.test.mjs` only if its cases move whole into `doc-health.test.mjs` (`git rm`, named in the report).

**Tests to retire** (each names its owner):
- `checks.test.mjs:609-700` enduser cases → generator behaviour owned by `test/report/enduser-index.test.mjs`; the repo-state judgment by the new doc-health case. Fix cases → behaviour removed (fix gone).
- `checks.test.mjs:702-820` decision cases → generator and union rules owned by `test/report/decision-index.test.mjs` (verify each of "missing index with rows", "committed rows preserved" has a case there; move it if not); repo-state by the new case.
- `checks.test.mjs:576-607` changelog cases → `test/scripts/prepare-release.test.mjs` (empty `[Unreleased]` refusal; add the case there if missing).
- `instruction-projections.test.mjs:167` doctor case → the materialize/inspect cases in the same file (`:94`, `:122`, `:306-422`) own the behaviour; the repo case owns repo state.
- `observe-doctor-checks.test.mjs:89-200` run-coverage cases → the run-layout fixture tests (lead names the exact Node and Rust tests); a case asserting something the fixture tests do not (old-host identification, the 60 s recency window) is behaviour removed with the row — state so.
- `convention-doctor-check.test.mjs:47-107` → the moved repo case keeps the cutoff and block-posture assertions; "registered once" and "pass-skips outside fgOS" → behaviour removed.

## Net size

Node: removed bodies/fixes/helpers ≈ −520, moved into `scripts/` ≈ +180, build script +10 → about −330 (−300 budgeted). Tests: retired doctor-row cases ≈ −300, new repo cases +120, moved generator cases ±0 → about −180 (−100 budgeted, conservative).

## Validation

- FR `test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs test/setup/identity-checks.test.mjs test/setup/instruction-projections.test.mjs test/report/enduser-index.test.mjs test/report/decision-index.test.mjs test/scripts/prepare-release.test.mjs test/runner/assignment-layout.test.mjs test/setup/checks.test.mjs test/setup/registrations.test.mjs test/rust-host/release-tree.test.mjs` (+ the convention file)
- Red evidence: each new repo case fails when its input is broken on a scratch copy (delete one index entry; duplicate a backlog id; rename the README tag; add a block-posture path) — recorded in the report.
- `npm run build:skills` leaves a clean tree on main.
- `npm run fgos:dev -- doctor --json` on fg-server2: nine rows gone; time before/after (expect about −21 s).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Decision index drift against local state no longer surfaces automatically in this repo | M × M | Owner accepted "check only what the checkout has" (1a); `fgos decision-index --check` exists; P10 guide names it |
| Repo-scan tests slow the suite (convention judgment ≈ 1 s, census) | M × L | Each case runs once; report the added test time against the removed doctor time |
| Convention case needs the host (`FGOS_HOST_BIN`), absent in some runs | M × M | Refuse by name when no host resolves (never pass silently), same as the census tests |
| `build:skills` now writes AGENTS.md's managed block; the owner's uncommitted AgentKit block in AGENTS.md is outside the managed markers | L × M | `materializeInstructionProjection` preserves unmanaged bytes (`instruction-projections.test.mjs:122`) |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Nine rows out of doctor, each judgment owned by one named proof that runs in a checkout without Work history; doctor time down by about 21 s on fg-server2; landed with a guide section.

## Lead brief essentials

Owning proof first, then delete. The index proofs never open `.fgos`. Report each retired test → owner. All plan.md lead rules apply.
