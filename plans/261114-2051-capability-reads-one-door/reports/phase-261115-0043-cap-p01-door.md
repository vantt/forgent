# Phase 01 report: the capability read door

Branch `capability-reads-one-door/p01`, base `origin/capability-reads-one-door` 9ae1022b4. Equivalence base: 781537524.

## What landed

- `src/runner/execution/capability-config.mjs` (kernel layer, tier override 0, imports only `../rigor.mjs`): the
  only reader of `runner.capabilities` added by this phase. Exports exactly the 18 functions of the phase table:
  `catalogOf`, `capabilityNamesOf`, `hasCapabilityEntry`, `isCapabilityDeclared`, `registeredCapabilityOf`,
  `capabilityPersonaOf`, `capabilityRigorOf`, `minCheckersOf`, `ownMinCheckersOf`, `capabilityVerifyOf`,
  `capabilityConfinementOf`, `capabilityServesOf`, `capabilityDescriptionOf`, `preferOf`, `hasPreferPool`,
  `hasOwnPreferPool`, `bindingTasteOf`. `entriesOf` is private. No export hands out an entry object.
- Switched: `seat-policy.mjs` (`seatConfigOf` uses `bindingTasteOf`; the slice builder moved out), `bind.mjs`
  (`resolvePersona` takes `capabilityPersonaOf`; persona provenance stays `capability:<key>`), `seat-resolver.mjs`
  (own `capabilityRigorOf` deleted; `checkerPlanOf` uses `minCheckersOf` for config and shipped default),
  `operation-capability.mjs` (`hasCapabilityEntry`), `registeredCapabilityOf` moved out of `dispatch/config.mjs`
  (importers `decide.mjs`, `propose-validate.mjs`), `dispatch/plan.mjs` import line.
- `seat-resolver.mjs` still exports `capabilityEntriesOf` and `hasUsablePrefer` for `registrations.mjs` and
  `seat-binding-checks.mjs`; the doors phase for setup deletes them.
- Manifest: file row and tier-0 override for the port.
- Owning proof `test/runner/execution/capability-config.test.mjs` (12 tests). The two `capabilityRigorOf`
  assertions in `seat-resolver.test.mjs` (effective-rigor test, which stays) moved into it: the exact-then-prefix
  and bare-verb cases are owned by "a capability reads its exact entry before its prefix entry" and "a name with
  no colon has no prefix entry and the bare verb is never consulted".

## Tests

- Gate list of the phase plus every test file importing a touched module (49 files): 1094 of 1095 pass; the one
  "failure" is `test/fixtures/usage/pi-multiturn-normal.jsonl`, a data fixture that the importer grep matched and
  the runner executed as a file. It is not a test.
- `test/architecture.test.mjs` 56/56. `test/scripts/doc-health.test.mjs` 8/8 (the bare script needs an activated
  host, so the test is the proof). `check-decision-citation-drift`: no new findings (57 baselined).
  `git-one-door-scan --root .`: 0 undeclared sites.
- Rust: not touched.

## Impact analysis

`fgos tool query --capability impact-analysis --status present` returned no provider: inactive, not a gap. `rg`
census of word matches in `src bin scripts test`: `capabilityEntriesOf` 2 files, `capabilityRigorOf` 4,
`registeredCapabilityOf` 4, `seatConfigOf` 2, `resolvePersona` 1, `deriveOperationCapability` 3.

## Equivalence (base 781537524 vs head)

`reports/equivalence/compare-capability-reads.mjs --base <worktree> --head <worktree> --out <dir> [--run <name>]
[--base-target <cargo dir>]`.

- Each side runs in its own child process on its own modules. One host binary and one native addon are staged
  from the base checkout and copied byte for byte into the head checkout's staging directory with a manifest naming
  head as the payload (the in-process door refuses any other pairing), so Rust differences between the two commits
  cannot appear as answer differences. Both paths must be registered worktrees or the main checkout.
- Inputs: shipped standard in a fresh project, this repo's config, and a 12-config synthetic matrix built from the
  standard section (verify exact/prefix/whitespace, nested shape, both sections, persona and minCheckers incl. `[]`,
  string/list/pinned/blank/empty `prefer`, null/string/array entries, string `aliases` and an alias collision, a
  name with no colon, prototype names as own capability and executor keys via `JSON.parse`, a bad rigor).
- Questions per name (~60 per input): effective rigor, checker plan for each rigor, `registeredCapabilityOf`,
  `verifyCommandOf`, `resolveExecutorAndOverrides`, capability details per executor id and per candidate,
  confinement request (mode, policy, anchor), `compileDispatchPlan`, the legacy checker decoder, proposal
  refusals, `bind()` minus `hostVersion`; per domain `deriveOperationCapability`; per input the seat config digest,
  the run record hash, config shape validation, plan-lint findings and the proposal refusal list.
- Result: self-compare of base with itself 0 failures (deterministic); base vs head **0 failures, 0 notes**.
  Differences exist only where the intended deltas say: `non-object-entry` (m-entries: `registeredCapability`,
  `proposalRefusals`, `operationCapability`) and `string-aliases` (m-aliases: `registeredCapability`,
  `proposalRefusals`). The prototype-name delta does not show in any answer (a JS truthy lookup of an inherited
  name yields a function or `Object.prototype`, which the old code also read as an entry with no fields); the
  port tests own that rule. Every other question is byte-identical at base and head on all 14 inputs.
- Committed evidence: `reports/equivalence/phase-01.summary.json` (digests per input and question, allowlist names).
  Full outputs: `.fgos/runtime/tmp/capability-equivalence/` (ignored).
- Doctor base: `npm run fgos:dev -- doctor --json` at the base worktree; messages of the seven rows saved to
  `.fgos/runtime/tmp/capability-equivalence/doctor-base.json`, digests in
  `reports/equivalence/doctor-base.summary.json`. All `ok` except `confinement-strict-readiness` (`warn`).
  The messages mention this machine's state, so they are comparable on this machine only.

## Notes for later phases

- Port API change is not needed by anything in the census; phases 02-05 import only what the table lists.
- The doctor base was taken in a checkout under `/home/vantt/projects/forgent-worktrees`; a later head run must use
  the same kind of checkout for the messages to compare.
- `ALLOWLIST` in the harness is keyed by input and question; a phase that adds a delta adds one entry naming the
  plan row.

## Lessons

- A checkout's in-process native door loads only a manifest whose payload is that checkout, so a two-checkout
  comparison cannot just share `FGOS_HOST_BIN`; copy the staged bytes and write a per-checkout manifest.
- The importer grep for the gate list also matches data fixtures; filter to `*.test.mjs` before passing to the runner.

## Authority

None changed. `capability-config.mjs` is the authority for how a capability row is read; the crate stays the
authority for binding.

Status: DONE
