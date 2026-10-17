---
phase: 1
title: "Vendor js-yaml and route every yaml import through one door"
status: completed
priority: P1
effort: "5h"
dependencies: []
---

# Phase 1: Vendor js-yaml and route every `yaml` import through one door

## Goal

The YAML parser is part of the source tree, every YAML parse goes through
`src/util/yaml.mjs`, and `package.json` has no runtime dependency.

## Context (scouted)

Every current use is `YAML.parse` (no stringify, no `parseDocument`):

| File | Form |
|---|---|
| `src/workflow/loader.mjs:6,34` | static import |
| `src/workflow/plan-source.mjs:6,15` | static import |
| `src/workflow/units-source.mjs:6,37` | static import |
| `src/setup/instruction-registry.mjs:17,166` | static import |
| `src/runner/execution/run.mjs:385,393` | `await import('yaml')` fallback after `JSON.parse` |
| `src/report/capability-plan-lint.mjs:3-10,305` | lazy `require`, `YAML = null` when missing |
| `src/setup/workflow-pool-independence.mjs:54-60` | `createRequire(import.meta.url)('yaml')`, returns `{ unavailable }` |
| `scripts/project-agents.mjs:31,180,231,286` | static import of `parse` |
| `scripts/build-domain-registry.mjs:14` | static import |
| `test/architecture.test.mjs:16,935` | static import |
| `test/workflow/discussion-workflows.test.mjs:10,103,155,203` | static import |

Also: `test/rust-host/dev-host.test.mjs:38-39` copies `repoRoot/node_modules`
unconditionally. `test/architecture.test.mjs:1136` holds the string
`"const YAML = await import('yaml');"` as a `findDynamicLoads` fixture: test
data, keep.

## Files

- Create: `src/util/third-party/js-yaml.mjs`, `src/util/yaml.mjs`, `test/util/yaml.test.mjs`
- Modify: every file in the table above
- Modify: `test/rust-host/dev-host.test.mjs` (copy declared production deps only)
- Modify: `docs/architecture-manifest.json` (two `kernel` rows)
- Modify: `test/architecture.test.mjs` (one-door test)
- Modify: `package.json`, `package-lock.json`
- Modify: `test/test-ownership.mjs` if the ownership lint needs a row for the new test

## Steps

0. **Baseline.** In the fresh worktree (`test ! -e node_modules`), run
   `npm test`, save the list of failing test files and their first error to
   the phase report. This is the "before" for the success criterion.
1. **Fetch.** In a new empty scratch directory: `npm pack js-yaml@5.4.3
   --ignore-scripts`; compare the tarball's sha512 with `npm view
   js-yaml@5.4.3 dist.integrity`. Extract the bundle with a constructed path
   (`tar -xzOf js-yaml-5.4.3.tgz "package/$(printf 'd%sst' i)/js-yaml.mjs" >
   js-yaml-5.4.3.mjs`). Never execute anything inside the unpacked package.
2. **Inspect.** Confirm the bundle has no real import or require after comment
   blanking (use `lexSource` + `extractImports` from `test/architecture.test.mjs`,
   not a raw grep: the JSDoc has `import … from 'js-yaml'` examples). Diff it
   against the 5.4.2 bundle and record the diff summary. Drop the trailing
   `//# sourceMappingURL` line (the map is not vendored) and say so in the header.
3. **Vendor.** Write `src/util/third-party/js-yaml.mjs` = header + bundle.
   Header: package, version, upstream URL, tarball integrity, license MIT with
   the copyright line from the package LICENSE, sha256 of the bytes after the
   header, "do not edit; upgrade by replacing the whole file per the decision
   record".
4. **Door.** `src/util/yaml.mjs`:
   ```js
   import { loadAll } from './third-party/js-yaml.mjs';
   export function parseYaml(text, { filename } = {}) {
     const docs = loadAll(text, { filename, maxAliases: 100 });
     if (docs.length === 0) return null;
     if (docs.length > 1) throw new Error(`${filename ?? 'YAML input'}: expected a single document, found ${docs.length}`);
     return docs[0];
   }
   ```
   Re-export nothing else; callers keep their own error handling.
5. **Manifest and scans.** Add both `kernel` rows; run
   `node --test test/architecture.test.mjs` at once. If any scan flags the
   third-party file, exempt exactly that path with a reason; never widen a rule
   for authored code.
6. **One-door test.** In `test/architecture.test.mjs`, built on
   `extractImports`/`lexSource`: outside `src/util/yaml.mjs`, no file under
   `src bin scripts test` may import `yaml`, `js-yaml`, or a specifier ending in
   `third-party/js-yaml.mjs`, by static import, `import()`, `require(` or the
   `createRequire(...)( '...' )` call form. The third-party file itself is
   exempt by exact path. Add caught/passed fixtures like the existing
   `findDynamicLoads` test.
7. **Swap call sites** in the table to `parseYaml` (pass `filename` where the
   caller has one). In `run.mjs` and `capability-plan-lint.mjs` the lazy-load
   and `YAML = null` branches go; keep JSON-first order in `run.mjs`. In
   `workflow-pool-independence.mjs` switch the parse now and leave the
   `unavailable` branch deletion to phase 2 (it becomes dead code here; phase 2
   removes it with its callers).
8. **dev-host test.** Replace the unconditional `node_modules` copy with a copy
   of the packages `package.json#dependencies` declares (same resolution as
   `scripts/build-rust-distribution.mjs:150-215`; reuse its exported
   `resolveProductionDependencies` if the import direction allows). With zero
   deps it copies nothing. Grep `test/` for other `node_modules` assumptions
   (`active-release-drift-check`, `fgos-return`, `install-packaging` were
   named) and fix any that break without one.
9. **Dependency removal.** Remove `yaml` from `package.json`. In the worktree,
   delete the `yaml` entries from `package-lock.json` (or `npm install
   --package-lock-only`, which does not create `node_modules`); re-check
   `test ! -e node_modules`.
10. **Parity on 5.4.3.** Re-run the scratch parity script
    (`<scratchpad>/tools/yaml-parity.mjs`, yaml 2.9.1 vs the 5.4.3 bundle through
    the same wrapper semantics) over tracked YAML and frontmatter. Save output to
    the phase report. Expected: zero differences once empty input maps to
    `null`. Resolve any other difference explicitly.
11. **Tests** in `test/util/yaml.test.mjs`:
    - mapping, sequence, scalars; filename and line/column in the error for malformed input;
    - empty, whitespace-only and comment-only input return `null`; `---` and `~` return `null`; two documents throw;
    - duplicate key throws; `yes`/`no`/`on`/`off` stay strings; unquoted ISO date stays a string; `<<` is an ordinary key; `!!binary`/`!foo` throw;
    - alias bomb (nested aliases beyond 100) throws; `a: &a {b: *a}` returns a self-referencing object (documented) and does not hang;
    - `__proto__` top-level and nested, `constructor: {prototype: …}` become own keys and `Object.prototype` is unchanged;
    - integrity: sha256 of the third-party file after its header equals the constant;
    - the 5.4.3 regression inputs (indented block mapping) parse as upstream intends.

## Verification

- `node --test test/util/yaml.test.mjs test/architecture.test.mjs test/workflow/discussion-workflows.test.mjs test/rust-host/dev-host.test.mjs`
- Tests importing the touched modules (`grep -rln "<module>" test`).
- `node -e "import('./src/workflow/loader.mjs')"` and `import('./src/setup/instruction-registry.mjs')` load with no `node_modules`.
- `grep -rn "from 'yaml'\|require('yaml')\|import('yaml')\|('yaml')" src bin scripts test` returns only the `findDynamicLoads` fixture and the `registrations.mjs:888` comment (removed in phase 2).
- Cold timing of `node bin/fgos.mjs --version` and `node bin/fgos.mjs dispatch decide --for research --needs-soul --has-live-task-access` before and after, recorded; budget +15 ms.

## Risk and rollback

Parser behaviour differences are surfaced by step 10 before callers ship.
Rollback is reverting the phase commit and restoring the dependency.
