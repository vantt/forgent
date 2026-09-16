# P08 Final Evaluation - Test Suite Feedback Cost

Date: 2026-09-16

Branch: `test-suite-feedback-cost--p08`

Base: `d96425f9babc0d259bd26b4433b17d366af2fd09`

Verdict: close this track after P08 lands. Retain P00-P04, P06, and P07.
Do not claim P05 selector adoption, remote CI restoration, broad matrix
consolidation, caching, tiering, mutation expansion, timing thresholds, or a
global `runCli(argv, ctx)` surface from this track.

## Evidence Boundaries

This report reconciles committed track artifacts only. Focused timing results
come from each pilot's own before/after state and are not summed into a single
suite-wide saving because they were measured on different integrated snapshots
and under different ambient load. Full-suite runs prove retained integration,
not a precise CPU/wall delta across the whole track.

Remote CI proof remains an external gate. P01 fixed the portable local door and
the final branch remains ready for CI, but this track still has no linked
three-OS GitHub Actions run that reports non-zero Node test counts in Ubuntu,
macOS, and Windows.

## Integrated Commit List

| Commit | Cell | Meaning |
|---|---|---|
| `8376385c` | P00 | Pin a hermetic test-only `FGOS_SESSION_ID` for CLI harness children. |
| `1e749320` | P00 | Merge P00 into the track. |
| `bd56ae02` | P01 | Replace shell-dependent `npm test` with a portable Node runner. |
| `4149bd31` | P01 | Record P00/P01 checkpoint evidence. |
| `6c903f70` | P02 | Add timing/profiling instrumentation. |
| `d5932af0` | P02 | Remove `spawnSync` buffer truncation risk from full-suite timing. |
| `6ddb6771` | P02 | Record the accepted green baseline/profile. |
| `fffb156e` | P03 | Pilot the small real Work-state fixture for docs-index tests. |
| `f2f1e1ee` | P03 | Record P00-P03 sync proof. |
| `a04c15df` | P04 | Isolate accidental real-Claude setup/doctor e2e calls. |
| `da5684af` | P06 | Pilot fast CLI fixture initialization in three files. |
| `d96425f9` | P07 | Audit remaining CLI harness responsibility and candidates. |

P05 was not implemented in this track. P06 was intentionally advanced ahead of
P05 by operator prioritization to reduce measured fixture cost sooner.

## Pilot Verdicts

| Pilot | Verdict | Feedback-time effect | Full-suite proof | Confidence | False-negative risk | Fallback rate | Impl cost | Maintenance cost |
|---|---|---:|---|---|---|---|---|---|
| P03 docs-index state fixture | expand | File total `195.46s -> 5.27s`, about `-192.5s` focused file time | Later integrated full suites green, final P03 sync `6753 pass / 9 skipped / 0 fail`, P04/P06/P07 also green | high | low; real `docs/` still scanned and `sourceCaptureId` unconditional | not applicable | low; one helper plus one file | low |
| P04 external-Claude isolation | expand | Sequential focused total `50.68s -> 9.84s`, `-40.84s`; doctor-file deltas treated as noise, uninstall wins material | Final P04 full suite `6800 pass / 9 skipped / 0 fail` | high for confirmed sites | low; intentionally provider-facing tests remain subprocess/provider-backed | not applicable | low; env seam at traced sites | low |
| P05 related-test selector | stop for this track | none measured | no implementation, no shadow report | none | unknown; no miss analysis exists | unknown | unspent | unknown |
| P06 CLI fixture init | expand, bounded | Sequential focused total `94.36s -> 67.57s`, `-26.79s`; `fgos init` subprocess sites in three files `136 -> 3` | Final P06 full suite `6802 pass / 9 skipped / 0 fail` | medium-high for opt-in fixture construction only | medium if broadened blindly; low inside explicit opt-in files that do not prove init/process boundary | not applicable | medium; per-file opt-in | medium |
| P07 harness audit | expand as planning input | no runtime change | Final P07 full suite `6802 pass / 9 skipped / 0 fail` | high for static inventory, medium for cost extrapolation | low; no behavior changed | not applicable | docs-only | low |

P00/P01/P02 are retained foundations rather than optimization pilots:

- P00 fixed harness hermeticity: four focused environment variants of the
  durable-doing test passed, and no production code changed.
- P01 restored the local `npm test` door through a Node >=18-compatible runner;
  CI execution proof remains external.
- P02 produced the accepted green baseline: full-suite wall median `342.70s`
  across three valid green samples, plus a separate profile that identified
  docs-index and CLI hotspots.

## Retained And Reverted Work

Retained:

- P00 harness writer pin and override behavior.
- P01 portable `scripts/run-tests.mjs` and `npm test` door.
- P02 timing/profile tooling and retained artifacts.
- P03 docs-index fixture helper and focused test edits.
- P04 setup/doctor env isolation and guard.
- P06 explicit fast fixture helpers and three-file opt-in.
- P07 report plus JSON inventory/candidate artifacts.

No experimental code requires revert before close. P05 produced no code. P06's
failed over-broad subdir-init attempt was corrected inside the P06 cell; only
the bounded passing form remains.

## Unsupported Or Rejected Claims

- No additive savings total is claimed across P03, P04, and P06.
- P05 selector adoption is rejected for this track because no selector, fallback
  rate, selected-file ratio, or miss analysis exists.
- Matrix consolidation remains deferred. P07 found distinct `approve`, `merge
  next`, `sync-root`, GitHub, rollback, lock, and durable-write boundaries.
- Tiering, caching, mutation expansion, and timing thresholds remain rejected by
  TFC-D10/TFC-D11.
- A global `runCli(argv, ctx)` is not authorized. P07 found committed
  Rust-host/legacy-node posture still treats `bin/fgos.mjs` as the payload
  entry, so follow-up should use narrow `src/verbs/*` use-case extraction only.
- Remote CI restoration cannot be claimed until a linked push/PR run proves all
  supported OS lanes enter the Node test runner with non-zero test counts.

## Accepted Follow-Up Tracks

1. `p06-fast-fixture-expansion`
   - Packet: `reports/handoff-fast-fixture-expansion.md`
   - Capability: `code:refactor`
   - First hotspot: nine CLI files with 128 residual static `fgos init`
     construction sites from P07 Candidate 1.
   - Scope: expand explicit fast fixture opt-in only; keep `tmpCwd()` global
     default unchanged unless the new track separately proves it.
   - Required baseline: start from main after P08, rebuild Rust release binaries,
     run the named files before mutation, then after mutation, then one full
     `npm test`.

2. `bin-local-state-verb-usecase-extraction`
   - Packet: `reports/handoff-bin-local-state-verb-usecase-extraction.md`
   - Capability: `code:refactor`
   - First hotspot: `stage`, `edit`, and `read` CLI tests whose assertions are
     primarily business/use-case behavior.
   - Scope: extract narrow use-case modules following the existing
     `src/verbs/merge/*` pattern; keep parser/envelope/cwd/env error smoke tests
     subprocess-backed.
   - Required baseline: start after the fixture-expansion track or explicitly
     remeasure if done first.

Rejected follow-up from P07:

- `merge-return-approve-consolidation` stays deferred. Its process/Git doors are
  different enough that it needs a separate correctness plan, not this cost track.

## Final Proof

- `npm ci`: pass
- `cargo build --release --workspace`: pass
- capability plan lint:
  `{"ok":true,"units":9}`
- GitNexus detect_changes: degraded:
  `MISSING .gitnexus/run.cjs`
- Manual fallback audit: scoped diff is docs-only under this plan root
  (`plan.md`, this final report, and two handoff packets); no source, tests,
  package/CI config, product docs, or pilot measurements changed in P08.
- `git diff --check`: pass
- `npm test`: pass, `6811` tests, `6802` pass, `0` fail, `9` skipped,
  duration `398002.014974ms`
- Remote CI: explicit external gate, no linked run in this track

## Handoff

After P08 lands, start with `handoff-fast-fixture-expansion.md`. Do not begin
P05-style related selection, caching, tiering, or broad CLI-core work until a new
plan states its own evidence standard and preserves the full-suite DoD gate.
