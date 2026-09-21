# P06 — Integration And Final Disposition

**Status:** track complete. `npm test` unchanged/authoritative throughout. Two additive commands shipped to main (`test:canary`, `test:related:shadow`); no test deleted; no `test:related` promotion made unilaterally.

## Dispositions

| Unit | Disposition | Basis |
|---|---|---|
| Current hotspot removal (P01) | **stop** | One real, traced candidate (25 duplicate `fgos-init` sites) measured 8.76% wall-clock improvement — real, reproducible, but under the pre-registered 10% threshold. Reverted. No candidate cleared the bar. |
| Fast-fixture expansion (P02) | **stop** | The nine-file lease's real eligible surface had shrunk from the inherited audit's 128 sites to 7 (only 4 usable). Measured at three scopes (4, 25, 67 sites) — effect stayed 1-9%, never cleared 10%, and did not scale up with site count (structural ceiling, not a measurement artifact). Reverted at every scope. |
| Canary-first runner (P03) | **expand** | Shipped (`f9ba99ca`, merged to main). `npm test` semantics proven byte-for-byte unchanged; real end-to-end run confirmed. |
| Related selector (P04/P05) | **expand** (shadow-mode capability) / **revise** (`test:related` promotion) | Shadow-mode shipped and proven safe (P05: 0/3 real fault-injection misses, 100% correct fallback, all 6 numeric thresholds met) — expand/keep as-is, it already produces useful comparison data on every real run. Promoting to an adopted, non-shadow `test:related` command is explicitly **not** done in this track: the evidence set is smaller and differently-shaped than the plan's literal 30-historical-commit design (real infrastructure blocker, documented in P05's report), so that specific promotion is left as a deliberate follow-up decision rather than automatic. |

## Final proof (integrated branch, same commit now on `main`)

```sh
node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs test/scripts/test-select.test.mjs
```
89/89 green (15 + 24 + 50 across the three suites — `test-select.test.mjs` grew from 46 to 50 during P05's own fault-finding).

```sh
node scripts/test-timing.mjs profile --log-dir plans/.../reports/artifacts/p06-final-profile --top 30
```
Clean (before/after `git status` both clean), **status 0**, wall **428.40s**, user **2425.15s**, system **642.78s**, one JUnit profile retained (`junit.xml`, 7188 `<testcase>` entries — this run's own count was not re-derived from stdout since the JUnit reporter doesn't echo a summary line; the profile's own status/exit code is the authoritative pass/fail signal, same convention P00 used).

`git diff --check`: clean throughout the whole track (checked at every phase commit, not just here).

## Directional comparison to P00 (not a precise aggregate — different sample count, single run, non-comparable ambient load, exactly as the plan requires this be reported)

| | P00 baseline (3-sample median) | P06 final (1 profile run) |
|---|---:|---:|
| Wall (s) | 404.03 | 428.40 |
| Discovered test files | 357 | 358 |
| Total tests | 7104 | ~7188 (JUnit testcase count; this track added 89 new focused tests across three new/extended suites) |

The +24s / +6% wall delta is directionally consistent with the +1 file / +~84-90 test increase this track itself added (run-tests.mjs extraction tests, run-test-canary.mjs's 24 tests, test-select.mjs's 50 tests) — not claimed as a precise before/after saving, per the plan's own instruction not to compare a single final run as a precise aggregate against P00 unless load is comparable (it is not: P00's samples ran hours earlier under different ambient conditions this session repeatedly documented).

**No net full-suite speedup was produced by this track** — P01/P02 (the two units that could have reduced `npm test`'s own runtime) both concluded `stop`. This is consistent with, and was flagged plainly in, every phase report along the way and in the mid-track check-in with the user (see conversation).

## Promotion rules — compliance check

- `test:canary` shipped: focused/full semantics proven (P03 report, 24 tests + real e2e run). ✓
- `test:related` NOT shipped: P05 thresholds technically passed, but on adapted (not the plan's literal) evidence — left as an explicit open decision, not shipped. ✓ (plan's rule is a ceiling — "may ship... only if thresholds pass" — not a floor requiring it to ship the moment thresholds pass)
- `npm test`, Work verification, post-merge and CI remain full-suite: unchanged at every phase; `test:related:shadow` always runs the unchanged full suite regardless of its own related-subset outcome. ✓
- No cross-commit cache or proof reuse: none introduced. ✓

## Changelog and documentation

- `CHANGELOG.md` `[Unreleased]`: entries present for both `test:canary` and `test:related:shadow`, including the shadow-only/non-DoD framing (added during P04, verified current here).
- `docs/how-to/use-fast-test-feedback-commands.md`: covers both commands; updated in this phase to reflect P05's completed (not just planned) evaluation.
- `docs/specs/reading-map.md`: pointer line added during P04, still accurate.
- All three previewed through MDView during their respective phases.

## Track summary (all 18 commits, `a74a265a..HEAD`)

- **P00**: baseline (3 green samples + profile), plus 4 small tooling-hardening fixes needed to trust the samples.
- **P00A**: proof/duplication inventory tool (`scripts/test-proof-inventory.mjs`), no deletions — found the nine-file P02 lease had gone stale (128→7 sites).
- **P01, P02 (×2 scopes)**: hotspot/fixture removal — all `stop`, all reverted, full evidence retained.
- **P03**: `npm run test:canary` — shipped.
- **P04**: `npm run test:related:shadow` — shipped, shadow-only.
- **P05**: real fault-injection safety proof, found and fixed 2 real bugs (one in the shipped P04 selector, one accidental corruption of the user's global machine config caused by this evaluation's own historical-commit attempts, both fixed and verified) — all promotion thresholds met on adapted evidence.
- **P06** (this phase): dispositions, final proof, directional comparison, doc/changelog compliance check.

Every phase merged to `main` incrementally as it completed and passed its own tests (not batched at the end), per the user's own instruction to sync and merge as the track progressed.

## Remaining risks / explicit deferred work

- **`test:related` promotion decision** — open, left to the user (see P05 report's Disposition section).
- **Global config-merge bug** (writes stale tier-policy keys into `~/.fgos/config.json` additively, never pruning) — real, found during P05, out of this track's scope (belongs to the setup/config-merge subsystem, not the test selector), flagged in P05's Handoff section, not filed as a separate work item by this track.
- **The double-`fgos-init` pattern P01/P02 both found** (real, ~7-9% effect, present across ≥14 files) — flagged as a possible future candidate at a wider, differently-measured scope; not opened here.
- **A literal 30-historical-commit P05 retry** — now unblocked (both bugs fixed), not attempted in this track; would take several hours of real full-suite execution if pursued later.
