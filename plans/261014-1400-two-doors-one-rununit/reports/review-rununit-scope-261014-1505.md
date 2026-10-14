# Review: feat/rununit-scope (phase 01, write scope + unit contract)

Reviewer: independent code-reviewer, read-only. Diff: `main...feat/rununit-scope` (4 commits, 16 files, +547/-33).

## Scope

- Source: `src/runner/dispatch/write-scope.mjs` (new), `src/runner/execution/unit.mjs`, `src/workflow/definition.mjs`, `src/runner/dispatch/config.mjs`, `src/setup/registrations.mjs`, `src/runner/execution/run.mjs`, `docs/architecture-manifest.json`, two doc rows.
- Tests run (env -u CLAUDE_CODE_SESSION_ID): write-scope, unit, dispatch-config-patterns, architecture: 57/57 pass. New cases in run/registrations/workflow-runner: 4/4 pass.
- Independent count of on-disk resume risk (main checkout): 253 `unit.json`, 6 with non-empty `writes`, 0 changed by canonicalization, 0 refused. Matches the lane report.

## Overall

All of the spec's case tables are implemented and pass. The canonicalizer, config validation and doctor check follow existing patterns. The real gaps are in the matcher, which is the module phases 02 and 03 will build on. It trusts its inputs too much. Nothing consumes it in production yet, so each gap below is cheap to fix now and expensive after 02 and 03 wire it into staging and coverage.

## High

None.

## Medium

### M1. The matcher does not normalize `..` or absolute queried paths, so `.fgos` exclusion can be bypassed
`src/runner/dispatch/write-scope.mjs:122-127`. `matchesWriteScope` drops `''` and `.` segments but keeps `..` and ignores a leading `/`. Measured:
- `matchesWriteScope('docs/../.fgos/state.json', ['docs'])` gives true. The first segment is `docs`, so the `.fgos` guard never fires, and the literal prefix check passes.
- `matchesWriteScope('/docs/a.md', ['docs'])` gives true.

Failure scenario: phase 03 routes attribution through this function. `evidence-attribution.mjs` already labels worker evidenceRefs as "untrusted claims". A worker that claims `docs/../.fgos/state.json` is then counted in scope, which breaks the "never `.fgos`" invariant the module header promises. Git status paths never contain `..`, so today's git-only callers are safe. The module still advertises itself as the one reader for every consumer.
Fix: in `matchesWriteScope`, return false when any segment is `..`, when the path starts with `/`, or when it contains `\` or NUL. Add tests for each.

### M2. Exponential backtracking on repeated `**`
`write-scope.mjs:103-114` (`globMatches`) recurses over every skip count for each `**`. `canonicalizeWriteEntry` accepts consecutive `**` segments (`a/**/**/b` canonicalizes to itself).
Measured: `matchesWriteScope('a/'.repeat(40)+'z', ['**/**/**/**/**/**/q'])` took 7.8 s. Each extra `**` multiplies the cost. Non-consecutive `**/a/**/a/**/a/**/a/**/q` on a 31-segment path took 174 ms. `partitionPaths` multiplies this by the number of dirty paths.
Failure scenario: a unit's writes are authored by agents (workflow YAML, `fgos run --unit`). One pathological entry hangs commit staging in phase 02 with no error.
Fix:
1. Collapse consecutive `**` segments in `canonicalizeWriteEntry`. The meaning is identical and the output is canonical.
2. Memoize `globMatches` on (patternIndex, pathIndex) so it runs in O(p*n) and stops slicing arrays.

### M3. The matcher assumes canonical scope entries but never enforces it, and fails silently
`write-scope.mjs:116-128`. Measured: `matchesWriteScope('docs/a', ['docs/'])`, `['./docs']` and `['docs/**/']` all return false. The `checkCoverage` this function replaces (`evidence-attribution.mjs:123-127`) accepts a trailing `/`.
Failure scenarios:
- Phase 03 passes `declaredCoverage.paths` or `writeScope` straight through, and every file reads as uncovered.
- `run.mjs:365` passes `unitRecord.writeScope` from a resumed `unit.json` verbatim, with no type or canonical check. A hand-edited or old record with `"docs/"` gives a scope that matches nothing. A string value is passed as `assignment.writes` unchanged.

There is also a naming hazard. `workspace.writeScope` already exists in `effective-execution-contract.mjs:218`, where it holds absolute cwd paths. `checkCoverage` reads `declaredCoverage.writeScope`. If phase 03 wires the contract's absolute writeScope into the matcher, nothing will ever match.
Fix:
- Canonicalize scope entries inside `matchesWriteScope`/`partitionPaths`, either once per call or with a cached Set. Alternatively, throw on a non-canonical entry.
- On resume, pass `unitRecord.writeScope` through `canonicalizeWrites`.

## Low

### L1. `canonicalizeWriteEntry` is not idempotent
`write-scope.mjs:29,35`. Only the whole string is trimmed, not each segment. `"docs /"` gives `"docs "`, which gives `"docs"` on a second pass.
Failure scenario: `definition.mjs` stores `"docs "` in `template.writes`. `src/workflow/runner.mjs:424` then re-validates the unit through `validateUnit` and gets `"docs"`. Two layers now hold two spellings, and `capability-plan-lint` collision detection sees `"docs "`.
Fix: refuse segments with leading or trailing whitespace. Spaces inside a segment stay allowed.

### L2. `expandGenerated` widens any scope entry that starts with a glob
`write-scope.mjs:77`. `literalPrefix('*.md')` is `''`, and `''` overlaps every mapping. A unit writing only root-level `*.md` therefore gets every render tree added. This follows the spec text literally ("chiều nào cũng được"), but it widens without cause. Consider skipping the expansion when the entry's literal is `''` and the entry is not a bare `**`. It is harmless for `**`, which already covers everything.

### L3. Stale architecture comments in `definition.mjs`, and the module sits in a misleading location
- `src/workflow/definition.mjs:2` still says "MUST NOT import src/state/** or src/runner/**".
- `src/workflow/definition.mjs:7-8` still says "Kept free of runner imports".

Both are now false. Update them to say "may import only kernel-layer leaves (rigor.mjs, write-scope.mjs)". A `kernel` file living under `src/runner/dispatch/` also misleads readers. `src/runner/write-scope.mjs`, next to `rigor.mjs`, would match its layer.

### L4. The `.fgos` guard only checks an exact-case top-level segment
- `matchesWriteScope('.FGOS/x', ['**'])` is true. On case-insensitive filesystems (macOS) that path is the store.
- `sub/.fgos/x` is true. This matters if nested fgOS projects are possible.

The spec only names `.fgos`. Decide this deliberately and pin it with a test either way.

### L5. Test gaps
- No test covers resuming an old `unit.json` without `writeScope`, where `assignment.writes` should fall back to `unit.writes`. The spec names this as the rollback path.
- The resume test (`run.test.mjs`, last test) only checks that `unit.json#writeScope` is unchanged. It never checks the assignment written on resume.
- No tests cover M1, M2 or M3 inputs.
- `docs/**` matching `docs` itself is true and correct per "0..n segments", but no test pins it.

### L6. `definition.mjs` now refuses non-array `writes` instead of coercing to `[]`
An empty YAML `writes:` (null) used to load and is now a `WorkflowDefinitionError`. A repo grep found 2 `writes:` lines in workflow YAML, both arrays, so nothing breaks here. Downstream projects with `writes:` empty will now fail. Add a CHANGELOG line when L7 writes the entry.

### L7. `prefer` and `persona` are accepted but nothing reads them yet
No `unit.prefer` or `unit.persona` reads exist in `run.mjs` or `bind.mjs`. A unit that sets `prefer` used to be refused loudly and is now silently ignored until phases 04/05 land. This matches the plan's sequencing. Do not cut a release between 01 and 04.

## Author deviations

- **(a) `kernel` classification: agree.** The precedent is `src/state/work.mjs`, which imports `src/runner/rigor.mjs` (kernel). The module has zero imports and `test/architecture.test.mjs` passes. Only the location and comments need work (L3).
- **(b) Leaf `WriteScopeError`, rewrapped by callers: agree.** It avoids the config.mjs cycle. One nit: the definition messages repeat the field, e.g. `...units[0].writes: writes[0]: ...`.
- **(c) Refusing a glob in `from`'s first segment: agree.** It is stricter than the spec, and a leading-glob `from` would widen every unit through the `''` literal (see L2).
- **(d) Refusing unknown prefer keys and a bare string: agree.** It is consistent with the shape-only contract and with G2 (it blocks `model` and similar keys smuggled through prefer).
- **(e) Doc rows: agree.** They are required by the `Data Dictionary #7` test.

## Plan status

- Steps 1-5 are done and their tests pass.
- Step 6 is reported proven in the lane report. I did not re-run doctor against the activated release.
- `rg "contains path escape" src/workflow` returns 0.
- I did not run `npm test` (instructed not to).
- CHANGELOG and runner.md deltas are deferred to L7, per the lane report.
- The Lead still needs to commit the default config line on main.

## Recommended actions

1. M1: reject `..`, absolute paths, backslash and NUL in queried paths, and add tests.
2. M2: collapse repeated `**` and memoize `globMatches`.
3. M3: canonicalize scope entries inside the matcher, and canonicalize `unitRecord.writeScope` on resume.
4. L1: refuse segment-edge whitespace.
5. L5: add the old-`unit.json` fallback test and the resume-assignment assertion.
6. L3: fix the stale comments.

## Unresolved questions

- Does phase 03 plan to pass `effective-execution-contract`'s absolute `workspace.writeScope` into coverage? If so, M3's naming collision becomes a real bug.
- Should `.fgos` exclusion be case-insensitive or cover nested `.fgos` (L4)? This is a product decision.

Status: DONE_WITH_CONCERNS
Summary: The phase's case tables are implemented and the targeted tests pass. All five deviations are acceptable. The shared matcher has three medium gaps to fix before phases 02/03 consume it: unnormalized `..` and absolute queried paths that bypass the `.fgos` guard, exponential backtracking on repeated `**`, and silent misses on non-canonical scope entries.
