# Phase 04 report: setup and doctor readers

Branch `capability-reads-p04`, base `origin/capability-reads-one-door` 74d5f296f.

## Done

- `src/setup/registrations.mjs`: rows `runner-patterns-config`, `workflow-capabilities-configured`, `capability-serves-valid`,
  `confinement-policies-declared`, `confinement-strict-readiness` read the catalog through the port
  (`capabilityNamesOf`, `ownMinCheckersOf`, `isCapabilityDeclared`, `hasPreferPool`, `capabilityServesOf`, `catalogOf`,
  `hasCapabilityEntry`, `capabilityConfinementOf`). Branches and messages kept. The stale "bare verb" comment now says
  "exact name, then its `<prefix>:*` entry".
- `src/setup/seat-binding-checks.mjs`: `bindCapabilityPostures` uses `capabilityNamesOf`, `hasOwnPreferPool`, `preferOf`;
  section read is flat-only.
- `src/runner/execution/seat-resolver.mjs`: `capabilityEntriesOf` and `hasUsablePrefer` deleted;
  `rg "capabilityEntriesOf|hasUsablePrefer" src bin scripts test` finds nothing (the port keeps private helpers under other names).
- `docs/architecture-manifest.json`: three debt entries removed from the `read runner.capabilities` row
  (`seat-resolver.mjs`, `registrations.mjs`, `seat-binding-checks.mjs`). Row now: allowed = the port; 13 debt entries left.

## Evidence

- Gate tests (11 files in the phase list): 283 pass, 0 fail. Importers of the three files (40 test files) plus
  `test/scripts/doc-health.test.mjs`: 660 of 662 pass; the one failure is
  `test/rust-host/release-targets.test.mjs` "only a Windows-built release tree...", which needs a built addon
  (`target/release/libfgos_node_addon.so`) this worktree does not have; unrelated to capability reads.
- `scripts/check-decision-citation-drift.mjs` exit 0; `git-one-door-scan` 0 undeclared sites.
  `scripts/doc-health.mjs` alone needs the host binary; its test passes.
- Doctor at head (`npm run fgos:dev -- doctor --json`, checkout under forgent-worktrees): the six rows
  `runner-patterns-config`, `workflow-capabilities-configured`, `capability-serves-valid`, `confinement-policies-declared`,
  `confinement-strict-readiness`, `seat-binding-dry-bind` have message digests equal to `doctor-base.summary.json`,
  same status. `seat-binding-route` differs only because its message prints the dev-host path of this run
  (`.../cap-p04/.fgos/runtime/dev-host/run-*/fgos`); it reads no capability.
- Success criterion `rg "\.capabilities\b" src/setup`: only terminal-control `.capabilities(` and message strings remain.

## Deviations

- No new test for `{}` / string / null entries in rows 25-26: tried it, but `effectiveSection` merges the project file
  over the shipped catalog (never empty) and the schema refuses non-object entries, so those shapes cannot reach the rows
  through config. The branches are kept as they were; a test would have to inject a runner section the rows never get.
- GitNexus impact analysis not run (`fgos tool query --capability impact-analysis` not consulted; blast radius covered by
  rg of importers and the 40-file importer run above).

## Lessons

- Doctor rows read the merged effective section, so shape edge cases of a raw file are unreachable; prove those in the port
  test, not in the rows' file.
- The doctor message digest of `seat-binding-route` is not stable across checkouts (it prints the host path); exclude it
  from the base comparison.
