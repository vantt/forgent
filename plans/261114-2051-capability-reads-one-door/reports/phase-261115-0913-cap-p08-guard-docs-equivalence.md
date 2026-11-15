# Phase 08 report: the door made mechanical, docs, final equivalence

Branch `capability-reads-p08`, from the integration branch at 93b91525e, with origin/main (321b050d3, S2/S3 phase 01 included)
merged in. Only conflict: `packages/git/contracts/mutation-census.v1.json`, taken from main and regenerated with
`node scripts/git-one-door-scan.mjs --root . --write-census` (also regenerated again after the port edit below).

## What changed

- `docs/architecture-manifest.json` `doors`: five rows added after the existing "read runner.capabilities" row
  (prefer chooser, purpose chooser retired, tool lookup, old tool registry retired, `catalogOf`). The two debt entries of the first
  row are gone: the help text and the propose refusal message were reworded (below).
- `src/runner/execution/capability-config.mjs`: `entriesOf` reads the flat section only (`sectionOf`); the `cfg.runner.capabilities`
  fallback and its header sentence are gone. Owner of the wrapped-config proof: `test/runner/execution/capability-config.test.mjs`
  (the old "lookups accept the wrapped config" case now asserts the wrapped config holds no catalog for every function).
- Harness: the allowlist entry `plan-lint-odd-shape` became `nested-config-not-read` and claims input `m-nested` for four questions (`lint`,
  `effectiveRigor`, `checkerPlan`, `bind`); its comment now says the port reads the flat section only. The first run after dropping
  the fallback showed exactly those 15 differences (base unwrapped the nested config for the lookups, head does not).
- New tests: one `{}` entry case in `test/setup/confinement-doctor-checks.test.mjs` (an empty entry is a missing anchor: named when
  not strict, a failure when strict); one case in `test/report/capability-plan-lint.test.mjs` (`{runner:{}}` flags every unit as
  `capability.unregistered`).
- Docs: `docs/platform/work-state/spec.md` section 8 rewritten to the current state (no verb, no overlay, `toolProvidersOf`, `decide`);
  `document-identity/spec.md` (two lines); `dispatch-control-plane.md` (3 places: purpose names, `bindingSource: seat-binding`, the
  binding resolver); `docs/reference/dispatch-module-boundaries.md` (resolve.mjs row); a "Superseded on 2026-11-14" note under the
  title of both `docs/explanation` files; one parenthetical each in the runner decision history (`h-36d872fbb0e5.md`) and the runner
  contract (`h-b3eb60fb4d2b.md`); `docs/platform/vision.md` bullet says step 1 landed; `docs/platform/seat-binding/spec.md` section 3
  rule line, section 15 dated entry (what moved, Q1-Q3, deltas, leftovers, evidence), section 16 pointers.
  No decision id minted: `docs/platform/governance.md` ("newer approved decisions supersede older decisions") does not ask for one,
  and earlier "Cap nhat" entries in section 15 narrow decisions the same way.
- `docs/backlog.md`: `p-nd2qtfz4qq` done (only `src/runner/paths.mjs` defines `findExecutableOnPath`).
- `CHANGELOG.md` `[Unreleased]`: three lines (tool verb removed and decide live; decide names the bound executor and the `prefer`
  changes; hook refusal wording and doctor row).
- `plan.md`: the step-2 leftover about the nested tolerance marked done. Final and doctor summaries committed.

## Door rows, calibration and final lists

The check ignores comments (the architecture test blanks them), so no comment rewording was needed. Calibrated with the real
check; zero `.rs` hits. Two findings that differ from the phase file's table:

1. `capability-config.mjs` defines `preferOf`, `bindingTasteOf` and `catalogOf` as `export const x = (`, so `\bname\(` does not
   match the definitions and the check reports the file stale. It is therefore not listed in the prefer row or the `catalogOf` row.
2. The `.for` pattern first matched `Symbol\.for\(` inside a regex literal in `scripts/git-one-door-scan.mjs`; the `(` lookahead now
   tolerates an escaped paren: `(?!\s*\\?\()`.

| row | allowed | debt |
|---|---|---|
| read runner.capabilities | `capability-config.mjs` | none |
| prefer chooser | `seat-policy.mjs`, `dispatch/config.mjs`, `setup/seat-binding-checks.mjs` | none |
| purpose chooser (retired) | none | none |
| tool lookup | `dispatch/tool-providers.mjs` | none |
| old tool registry (retired) | none | none |
| `catalogOf` | `execution/run.mjs`, `setup/registrations.mjs` | none |

The capability row has no debt: the plan-lint help text now says "the capability names declared in this repo's own live config" (generated command manifest regenerated) and the propose refusal reads "(none under runner.capabilities in the config)"; no test pinned either text.
Pattern probes (seeded strings): property read, write (not matched), computed key, destructuring, `x?.for`, `['for']`,
`const { for: f } = e` all behave as intended; `flags.for`, `Symbol.for(` and `required: ['for']` are not matched.

## Equivalence and gates

- Harness base `cap-rebase-base` (0f47018b3), head this worktree: `compare-capability-reads: 0 failure(s), 0 note(s)`;
  `reports/equivalence/final.summary.json`.
- Doctor at head (`npm run fgos:dev -- doctor --json`): six of the seven rows have the same status and message digest as
  `doctor-base.summary.json`. `seat-binding-route` has the same status; its message embeds the per-invocation dev-host path and
  the base message text was never kept, so only status can be compared (recorded in `doctor.summary.json`).
- Gate run (`scripts/run-tests.mjs`): architecture, capability-config, doc-health, mailbox-behaviour-v7n, git-mutation-census,
  confinement-doctor-checks, capability-plan-lint, capability-catalog-doctrine, plus the 19 tests that import the seat resolver,
  bind or the port: 395 pass, 0 fail. `git-one-door-scan`: 0 undeclared sites.
- `check-decision-citation-drift`: one finding, `docs/backlog.md:7` ("cites RUL108 with no gloss", the `p-eqhfqpz3gy` row that main
  added). It is on origin/main as it stands, not in this branch's diff; left for its owner (COOK) or the big lead.
- `node scripts/doc-health.mjs` bare needs a host binary (unset here); its test passes.
- Review fixes: both strings reworded and debt removed, a lint case pinning the `{runner:{capabilities}}` unwrap, a retired-verb line in `docs/distillery/deep-dives/tool-registry.md`.
- Rust untouched: `git diff --stat origin/main -- packages apps Cargo.lock` is only the regenerated census JSON.

## Concerns

- The wrapped `{runner:{capabilities}}` config is no longer read by `bind()`, `effectiveRigorOf` and `checkerPlanOf`. No product
  caller passes one (nothing in `src` or `bin` builds it; the old tolerance was for tests), and the whole targeted gate is green,
  but the full suite is the big lead's single run.
- `capability-config.mjs` was edited after phase 01 on the big lead's instruction (item 2).

## Lessons

- A door pattern that names a call (`name\(`) never matches the definition `export const name = (`; a row listing the defining
  file as allowed is reported stale, so calibrate `allowed` with the real check, not from the intent table.
- A pattern aimed at JS source also meets regex literals and strings in tooling scripts (`Symbol\.for\(`); run it over `scripts/`.
- Dropping a tolerance needs the harness allowlist to name the exact questions it changes; the first run lists them.
- Cite no decision id in a doc outside its own context file (`check-decision-citation-drift` fails on `D1`/`D5`); inline the rule.

## Authority

- `docs/architecture-manifest.json` `doors`: the five capability rows are the mechanical guard for the one door of capability
  reads, executor choice, tool lookup and the retired tool registry.
- `docs/platform/seat-binding/spec.md` section 3 (rule line) and section 15 (2026-11-14 entry): the decision narrative.

CHANGELOG: three lines added under `## [Unreleased]` by this phase (the plan's single writer).
