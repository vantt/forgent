# Doctor readiness only, repo rows to tests: lead report

Branch `harden/doctor-p03-repo-rows-to-tests` from origin/main `601cdcff6`, worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p03`. Not pushed to main, no release built or activated.

## What moved where

Nine doctor rows and three fixes are gone from `src/setup/registrations.mjs`, `src/setup/git-checks.mjs` and `src/setup/identity-checks.mjs`. Each judgment has one owning proof that runs in `npm test`.

| Row | New home |
|---|---|
| `enduser-docs-index-stale` (+fix) | `test/scripts/doc-health.test.mjs`: committed index `docPath` set equals `enumerateDocEntries`; opens no `.fgos`, no Work fold |
| `decision-index-stale` (+fix) | same file: committed `docs/decisions/index.md` is a fixpoint of `buildDecisionIndexMarkdown([], committed, { holderFor })`; opens no `.fgos` |
| `instruction-projections-stale` (+fix) | `test/setup/instruction-projections.test.mjs` repo case; `scripts/build-skill-wrappers.mjs` now also calls `materializeInstructionProjection` (so `npm run build:skills` regenerates them) |
| `git-mutation-one-door` | `test/setup/git-mutation-census.test.mjs` calls `verifyCensus` directly; `checkMutationOneDoor` and its imports deleted |
| `identity-ids-unique` | body moved whole to `scripts/identity-ids-unique.mjs`; fixture case moved into `test/scripts/doc-health.test.mjs` plus a repo case |
| `readme-install-tag-exists` | repo case in `test/scripts/doc-health.test.mjs` (regex plus `git tag -l`; skips with a stated reason when README pins no tag or the checkout lists no tags) |
| `convention-conformance` | body moved to `scripts/convention-conformance.mjs`; `test/setup/convention-doctor-check.test.mjs` `git mv` to `test/scripts/convention-conformance.test.mjs` plus a repo case |
| `changelog-unreleased-stale` | deleted; owner `scripts/prepare-release.mjs`, new case in `test/scripts/prepare-release.test.mjs` |
| `observe-run-coverage` | deleted |

Supporting moves: `pathExistsAt` and `commitAt` moved from `registrations.mjs` to `src/git/inspect.mjs` (callers `registrations.mjs` doc-current-path row, `bin/fgos.mjs` now a static import and `existsAtHead` is sync, the conformance script). `isFgosSourceCheckout`, `extractUnreleasedSection`, `unreleasedHasEntries`, `runInstructionProjectionHelper` deleted with their rows. Census regenerated. Registry contract: both inventory lines edited, the two row paragraphs replaced by an "owning proofs outside doctor" table. `observe/spec.md`, `identity/spec.md`, `convention/spec.md` lines updated. `CHANGELOG.md` one `[Unreleased]` entry.

One deliberate improvement in the moved conformance judgment: a host that cannot answer, an invalid answer, or an unreadable cutoff now fails by name. The doctor row passed with "skipped"; in a test that would be a silent pass.

## Tests retired and their owners

- `checks.test.mjs` changelog cases (3): `test/scripts/prepare-release.test.mjs` "updateChangelogText refuses a release whose Unreleased section is empty or missing" (new). Behaviour removed: the doctor treated an Unreleased section with only empty `###` headings as empty; the release check refuses only an empty body.
- `checks.test.mjs` enduser cases (8: not-yet-exists, missing count, covered, orphan count, decisions alias, fix, fix idempotent, outside-source-repo no-create): path enumeration and the decisions alias are owned by `test/report/enduser-index.test.mjs` ("fgos docs-index reads BOTH the docs/decisions/ alias and the primary docs/explanation/ dir", the `enumerateDocEntries` cases) and idempotence by "fgos docs-index is idempotent"; the repo-state judgment by the new doc-health case. Fix and message-format cases: behaviour removed (fix and row gone).
- `checks.test.mjs` decision cases (7): generator, union and preserve-committed-rows are owned by `test/report/decision-index.test.mjs` ("generateDecisionIndex: preserves committed rows absent from local state", "computeDecisionIndex: reports changed:true against a nonexistent index file", "buildDecisionIndexMarkdown: state wins by ADR identity", the `--check` CLI cases); repo state by the new doc-health case. Fix, refusal-message and "missing index with rows" doctor wording: behaviour removed.
- `checks.test.mjs` row-list pin: nine ids removed.
- `instruction-projections.test.mjs`: "doctor check is read-only, skips unmaterialized..." became "inspectInstructionProjection is read-only and reports an unmaterialized projection as passing but not materialized"; "accepts a tracked managed AGENTS projection..." and "ignores unrelated projection ledger entries" were re-pointed at `inspectInstructionProjection` (same assertions, no doctor row); "doctor fix resolves a linked worktree to the main checkout" retired: behaviour removed (the build script runs on its own repo root).
- `observe-doctor-checks.test.mjs` run-coverage cases (all, former lines 89-210): shared run-layout fixture owners are Node `test/runner/assignment-layout.test.mjs` "shared layout fixture yields every safe directory candidate...", Rust `packages/run-result/rust/tests/layout_fixture.rs` `shared_layout_fixture_and_consumers_have_identical_run_sets`, and the Observe crate's `metrics_cli/coverage.rs` accounting test. Behaviour removed with the row: the Node-versus-host directory-count comparison, the 60 s recent-run tolerance, the old-host degraded report.
- `convention-doctor-check.test.mjs`: "registered once" and "pass-skips outside the fgOS source repository" removed with the row; host-failure cases now assert a named failure instead of a pass-skip; cutoff, block-posture and clean-result cases kept in the renamed file.
- `readme-tag-check.test.mjs` deleted (`git rm`): the four fixture cases tested the removed row body; the repo case lives in doc-health.
- `identity-checks.test.mjs` "ids row..." moved into doc-health with identical assertions.
- `git-mutation-census.test.mjs`: one case kept, now calls `verifyCensus` directly.
- `release-tree.test.mjs`: the staged-doctor convention row spawn removed (row gone); the staging assertions for `convention.rules.v1.json` stay, since installed `src/convention/*.mjs` still read it, with reworded messages.

`test/suite-baseline.json` untouched (TEST's): retired file `test/setup/readme-tag-check.test.mjs`, renamed `test/setup/convention-doctor-check.test.mjs` to `test/scripts/convention-conformance.test.mjs`.

## Net size

| | Estimate | Measured |
|---|---|---|
| Node (`src`, `bin`, `scripts`) | -300 | -477 (+220 / -697) |
| Rust | 0 | 0 |
| Tests | -100 | -522 (+123 / -645) |

Census JSON, CHANGELOG and docs not counted.

## Red evidence

Each new repo case broken on this worktree, run, then restored with `git checkout`:

- drop the first entry of `docs/enduser-docs-index.json`: end-user index case red
- swap two rows of `docs/decisions/index.md`: fixpoint case red (a deleted row stays a fixpoint by design; the case catches hand edits and ordering)
- duplicate a backlog id: ids case red naming the id
- README pin changed to `v9.9.9`: tag case red
- altered the managed block in `AGENTS.md`: projections case red
- untracked `docs/specs/blocked.md`: conformance case red, `retired-specs` block placement

## Gate

- Focused: doc-health, convention-conformance, git-mutation-census, prepare-release, instruction-projections, identity-checks, observe-doctor-checks, checks, registrations, report enduser/decision index, assignment-layout, release-tree, architecture, check-decision-citation-drift, git one-door, census-drift, checks-doctor-config: all green except the one finding below.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared (census regenerated).
- `npm run build:skills` leaves the tracked tree clean.
- Full `node scripts/run-tests.mjs` (private target, HERDR and CLAUDE vars unset): tests 8579, pass 8543, fail 4, skipped 32, no `run-tests: ERROR` lines. Fails: native-load "inspection leaves WAL absent" (pre-existing), two `provider-capacity` account-lock cases (load flakes, 0 fail when rerun alone with `checks` and `release-tree`: 67/67), and the new conformance case (below).
- Doctor timing before/after not measured: nothing was built or activated. Expected from the plan: about -21 s (the index row was 19.7 s).

## Finding the new proof exposes

`this repository has no blocking convention violation and no post-cutoff naming violation` is red on current main: `plans/reports/git-mail-bodies-261107-phase-report.md` does not match a report template and did not exist at the rule cutoff (`3faf81996`). It was already a red doctor row (LAND's 08:25 board line: "91 old, 1 after the cutoff"), which never failed a build. As a test it fails `npm test`. Fix is one rename of that report to a conforming name (`fgos convention name`) plus any link to it; I did not do it because the file is outside this phase's ownership. Landing needs that rename first (or the owner of the report renaming it).

## Deviations

1. Convention judgment lives in `scripts/convention-conformance.mjs`, not inline in the test: the cutoff and block-posture cases need the function, and it has no product caller.
2. Instruction projections: the repo case ignores a missing ledger. The ledger is per-machine state under `.fgos/installation`, untracked, so a fresh clone (CI) has none; the phase text asked for `passed && materialized`, which would fail there. A ledger that exists is still judged; `materialized` is asserted true.
3. README tag case skips (with a reason) when README pins no tag or the checkout has no tags, as the phase says.
4. Not done because outside the listed files; these still name the removed rows and want a follow-up line edit each: `docs/platform/git/spec.md` (table row near 636, text near 645 and 647), `docs/platform/holder-lock/spec.md:280`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (rows 233, 234, 263, 338, 339), `docs/platform/work-state/contracts/knowledge-registry.md` (334, 692), `docs/platform/packaging-distribution/contracts/projection-ledger.md:56`, `docs/platform/packaging-distribution/spec.md` (the 7b fixes list near 552), `docs/explanation/enduser-docs-index-stale-orphan-detection-gap.md`, `core/task-specs/fgos-indexing.md:19`, comments in `scripts/git-one-door-scan.mjs` (38, 2764), `scripts/build-rust-distribution.mjs:505`, `test/git/one-door.test.mjs:3`. `test/setup/helpers/setup-checks-harness.mjs` `writeEnduserDoc` and `writeEnduserManifest` are now unused (four `checks-setup-*` files import them without using them).
5. `docs/architecture-manifest.json` not edited: it lists `src` files only, and no `src` file was added or removed.

## Items for other phases

- The next phase can reuse `src/git/inspect.mjs` `pathExistsAt`/`commitAt` (doc-current-path-missing row still uses them).
- `eventStoreMappingProblems` import in `git-checks.mjs` is unused (pre-existing, not touched).
