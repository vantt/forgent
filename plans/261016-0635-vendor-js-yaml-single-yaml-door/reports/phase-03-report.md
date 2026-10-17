# Phase 3 report: doctor checks compiled.json freshness

## What changed
- `scripts/build-domain-registry.mjs`: `compileDomain` exported already; parse failures now throw `domains/<d>/<file>: cannot be parsed: <reason> (line L, column C)` (file named relative to the repo shape, not an absolute path). Header comment updated.
- `src/setup/registrations.mjs` `checkDomainRegistryCompiled`: per domain with registry.yaml: missing / unreadable (as before), parse failure of the YAML (named), stale (`domains/<d>/compiled.json is stale — run npm run build:domains`) by deep-equal of the JSON on disk with `compileDomain` output. Imports `compileDomain` from `scripts/` (setup already imports `scripts/build-rust-distribution.mjs`; scripts ship in the payload via package.json `files`; scripts are outside the layer manifest) so no function move and no manifest row were needed.
- Comments in `src/state/domain-registry.mjs` and the drift test updated (no longer claim "no YAML parser"). compiled.json and `npm run build:domains` kept.

## Commit
f705b9c8c feat(doctor): report a stale or unparsable domain compiled.json

## Tests (test/state/domain-registry-compiled.test.mjs, 7 pass)
fresh passes; stale named; malformed workflow YAML named with line/column; missing and unreadable still named; `fgos doctor` CLI still lists every registered check with a malformed domain workflow. Existing drift test and no-dependency load test pass. `node scripts/build-domain-registry.mjs --check` rc 0; doctor in the C copy reports "1 domain registry compiled, readable and in step with their YAML".

## CHANGELOG line
`fgos doctor` check `domain-registry-compiled` now also reports a compiled.json that is stale against its YAML and domain YAML that cannot be parsed.

## Final full suite (after phases 2 and 3, with release fgos/fgctl binaries present)
`node scripts/run-tests.mjs`: 7850 tests, 7764 pass, 0 fail (rest skipped). An earlier run before the release binaries existed had 76 failures, all the rust-host/fgctl/dev-host/release-tree group (missing target/release binaries) plus nothing new vs the phase-1 baseline; after the binaries were built they pass, including the release-tree test for the vendored parser.
