# Phase 11 — Docs, Changelog, Closeout

Depends on: Phase 10 closed and merged. This is the track's last cell — by
this point every cell (P00-P10, including the Rust lane P04-P08) is merged.

## Objective

Close the whole track: record every user-visible surface it shipped, add
the one reading-map entry for the new architecture docs, and write the
closeout report every cell's evidence must trace back to.

## Requirements

- R1: Add one `## [Unreleased]` line per user-visible surface this track
  shipped to `CHANGELOG.md`, at minimum: the Rust `fgos` release-tree build
  pipeline and its four new doctor checks (P09), and the tier-0 workspace-
  shim resolver (P10). Add one line for anything else the merged Rust-lane
  cells (P04-P08) shipped that a user of `fgos doctor`, `fgos version`, or
  the CLI itself would see — sourced from those cells' own merge commits
  and trace files, never invented here.
- R2: Confirm `docs/specs/distribution.md` row 7/7b already list the four
  P09 check ids verbatim; add any doctor check or fix the merged Rust-lane
  cells registered that row 7/7b does not yet list. Do not restate rows
  that are already correct.
- R3: Add one new bullet to `docs/specs/reading-map.md`, in the file's
  existing flat-list style (path — one-paragraph description — spec
  pointer, matching every existing entry's format) for
  `docs/architect/host-invocation-routing/`, naming its five files
  (`host-invocation-provider-routing.md`, `legacy-cli-transition.md`,
  `external-provider-protocol.md`, `node-to-rust-component-migration.md`,
  `rust-cli-and-proof-components-plan.md`). Confirm the file count with
  `ls` before writing the bullet — do not assume it is still five.
- R4: Write
  `plans/260910-1700-rust-host-r1-kernel/reports/track-closeout.md` per
  `fgos-plan-loop` SKILL.md §5 step 6: every cell's merge commit — read
  from `fgos coordination chain rust-host-r1-kernel --json`, never from
  worker narration — every deferred finding across every cell, the exact
  reproduction command for each of the two performance measurements
  (legacy exec overhead, native `version` latency) and both measured
  numbers, and every full-suite-gate command from `plan.md`'s
  `FULL_TEST`.
- R5: Every link in R1-R4's output resolves to a real file, and every named
  command in the closeout report actually runs (exit code recorded, not
  assumed) before this cell closes.
- R6: No edit outside the `docs-closeout` lease (`CHANGELOG.md`,
  `README.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`,
  `docs/architect/host-invocation-routing/**`) plus this plan's own
  `reports/` directory. A factual correction to a `host-invocation-routing`
  source doc is allowed only if named explicitly in the closeout report.

## Files

Likely touch:

- `CHANGELOG.md`
- `docs/specs/distribution.md`
- `docs/specs/reading-map.md`
- `plans/260910-1700-rust-host-r1-kernel/reports/track-closeout.md` (new)

Do not touch:

- `src/**`, `test/**`, `apps/**`, `packages/**`, `Cargo.*` (docs-only cell)
- `docs/architect/host-invocation-routing/**` source content, except a
  named factual correction per R6

## Verification

```sh
grep -n "## \[Unreleased\]" CHANGELOG.md
rg -n "rust-host-binary-present|rust-host-target-supported|legacy-node-payload-present|command-routes-drift" src/setup/registrations.mjs docs/specs/distribution.md
ls docs/architect/host-invocation-routing/ | wc -l
fgos coordination chain rust-host-r1-kernel --json
```

**Full-suite gate** — run `plan.md`'s `FULL_TEST` before merge; every
command named in `track-closeout.md` reproduces green.

- `CHANGELOG.md` carries the new Unreleased lines; every check id from P09
  appears in both the live registry and `distribution.md`; the file-count
  check confirms the reading-map bullet names all real files.
- `track-closeout.md` names every cell's real merge commit and both
  performance measurements with reproducible commands.
- Capability annotation for this cell: `code:review`.
