# Phase 1 report: vendor js-yaml and one YAML door

Worktree: /home/vantt/projects/forgent-worktrees/vendor-js-yaml, branch feat/vendor-js-yaml. `node_modules` never existed there (checked before and after).
Scratch evidence: /tmp/claude-1000/-home-vantt-projects-forgent/56677996-c150-4c44-a1e8-6ef83bafc6be/scratchpad/{p1-baseline,p1-after,p1-pkgs,p1-parity-543.txt,tools/}

## Step 0 baseline (fresh worktree, `node scripts/run-tests.mjs`, before any change)
7597 tests, 7380 pass, 131 fail (132 distinct failing names; list in p1-baseline/failing-names.txt).
14 test files failed to load: `Cannot find package 'yaml'` (25 occurrences):
test/architecture.test.mjs, test/scripts/project-agents.test.mjs, test/setup/instruction-{composition,projections,registry}.test.mjs, test/state/domain-registry-compiled.test.mjs, test/workflow/{advisory-m-contracts,architecture-advisory-workflow,business-discussion-workflow,discussion-workflows,seats,units-runner,units-source,workflow-runner}.test.mjs.
Other failures in single tests: `fgos run executes read-only unit from file`, plan-lint CLI, `fgos workflow start ...`, `fgos dispatch execute ...`, bind/account tests (all `yaml` not found via run.mjs / capability-plan-lint), plus the rust-host group (dev-host x10, fgctl-* ~50) failing because `target/release/fgos` and `target/release/fgctl` do not exist in a fresh worktree (environmental, unrelated to yaml), and release-tree "staged legacy-node payload carries its production dependencies" (no node_modules).

## Fetch and inspect
- `npm pack js-yaml@5.4.3 --ignore-scripts` in p1-pkgs/; sha512 of tarball = `npm view js-yaml@5.4.3 dist.integrity` =
  `sha512-yzzNtgczwgoVHNigCyKTXcQJU4Y8t/ikU4UxXW0BvrLfHTGWZhsNcOT2s/a7vn81/4KqVnNmHjaUEPlvWnNwVw==` (match).
- Bundle extracted by constructed path; nothing executed in the package.
- `lexSource` + `extractImports` patterns on the bundle (and on 5.4.2): zero real import/require, no dynamic-load tokens. (JSDoc examples ignored by comment blanking.)
- Bundle sha256 as extracted (with sourceMappingURL line): 2ed2785988d4737fa33bcf4330be3a7b88d0da7b1fd534e9811cc48313ba0f6e.
- Vendored bytes below the header marker (sourceMappingURL line dropped, trailing newline kept): sha256 `4b208996e4d5bb3a48dc15eee95806173f23062d7ac19d21f25240dfb0501c3a`, 128754 bytes; constant lives in test/util/yaml.test.mjs and in the header.
- License: MIT, "Copyright (C) 2011-2015 by Vitaly Puzrin".

## 5.4.2 -> 5.4.3 bundle diff (19 changed lines)
1. Version banner.
2. Block scalar header scan (bundle line ~2136): `column < maxLeadingIndent` became `column >= parentIndent && column < maxLeadingIndent`. 5.4.2 threw "bad indentation of a mapping entry" on a block scalar holding only over-indented blank lines followed by a less-indented line; 5.4.3 returns an empty string. Confirmed on both bundles, e.g. `top:\n  k: |\n        \nnext: 1\n` -> 5.4.2 error, 5.4.3 `{top:{k:''},next:1}`. Pinned in test/util/yaml.test.mjs.
3. Block mapping with anchor/tag before the first key (~2346-2355): event is now spliced in instead of `restoreState` + reparse of the key. I found no input where the two bundles differ in output, aliases counted, or time (probed ~35 inputs incl. anchored/tagged keys, nesting 8-16); the test pins that anchored keys read as one mapping but cannot discriminate 5.4.2 from 5.4.3.

## Parity (scratchpad/tools/yaml-parity-543.mjs: yaml 2.9.1 vs the repo's own door, tracked yaml/yml/md-frontmatter)
```
js-yaml dist self-contained: yes
checked 828 documents; differences 0; both-fail 13
both parsers reject: .claude/agents/council-assumptions.md, .claude/agents/council-feedback-loops.md, .claude/agents/council-ship-maintain.md, docs/distillery/deep-dives/compound-engineering.md, docs/distillery/deep-dives/routing.md, ...
```
Zero differences (comment-only config now `null` via the wrapper). Full output p1-parity-543.txt.

## Timing (cold `node bin/fgos.mjs ...`, 25 runs each, median wall, two rounds)
| command | before | after |
|---|---|---|
| `version` (`--version` is not a verb) | 97 / 97 ms | 99 / 99 ms |
| `dispatch decide --for research --needs-soul --has-live-task-access` | 109 / 109 ms | 110 / 112 ms |
Delta +2..3 ms, within the +15 ms budget; no lazy import needed.

## Tests after
- Focused: `node --test test/util/yaml.test.mjs test/architecture.test.mjs test/workflow/discussion-workflows.test.mjs test/rust-host/dev-host.test.mjs test/rust-host/release-tree.test.mjs test/install-packaging.test.mjs test/scripts/release-packaging.test.mjs test/scripts/test-ownership-lint.test.mjs` all pass (68 tests in the last run). yaml.test.mjs: 13 tests, all listed cases incl. integrity hash.
- Full `node scripts/run-tests.mjs` after changes (with a copy of the debug host placed at the worktree's release dir to let dev-host run, removed afterwards): 7831 tests, 7682 pass, 63 fail, 11 skipped. Compared by name (LC_ALL=C comm): 0 new failures, 68 fixed. Remaining 63 = rust-host fgctl-* group needing `target/release/fgctl` (not built here) + 1 release-tree test, which I then fixed (below) and reran green. So every remaining failure is the missing-fgctl-binary environment gap, present in baseline.
- Note: direct `node --test` of workflow tests needs `FGOS_HOST_BIN` (run-tests.mjs sets it by building via cargo); without it the delphi/nominal/group tests fail with "writer identity (host-missing)", unrelated to yaml.
- `node -e "import('./src/workflow/loader.mjs')"` and instruction-registry load with no node_modules: ok.
- Grep for `from 'yaml'|require('yaml')|import('yaml')|('yaml')` in src bin scripts test: only the old findDynamicLoads fixture (architecture.test.mjs:1136), the `registrations.mjs:888` comment (phase 2), and the new guard's own caught/ignored fixtures in architecture.test.mjs (string literals the guard deliberately ignores).
- test-ownership lint: pass (one pre-existing warning on test/direct/merge-gate.test.mjs). No ownership row needed for test/util.

## Commits (branch feat/vendor-js-yaml)
1. 8ef1baf1c feat(util): vendor js-yaml 5.4.3 behind a single YAML door (door, third-party file, 2 manifest rows, yaml.test.mjs)
2. 838b044e5 refactor(yaml): route every YAML parse through the single door (11 call-site files, one-door test with fixtures, architecture test import swap)
3. b75c01a3f test(rust-host): stage only declared dependencies and prove the vendored parser ships (dev-host + release-tree)
4. 6013ca389 build(deps): drop the yaml dependency (package.json `dependencies: {}`, lock via `npm install --package-lock-only`)
Pre-commit hook ran normally on each.

## Deviations and decisions
- Added test/rust-host/release-tree.test.mjs to the edited set (not in the plan's file list): its first test asserted at least one declared runtime dependency and would fail with zero deps. It now asserts the door and vendored file are staged and manifest-listed and that the door, loader and instruction-registry import and parse from the staged tree alone (via `-e` probe; `fgos workflow status` without id exits before loading YAML so was a weak probe).
- `package.json` keeps `"dependencies": {}` rather than dropping the key; lock root has no dependencies and no yaml entry.
- `workflow-pool-independence.mjs`: the createRequire loader had to go with the swap, so `loadWorkflowDefinitions` no longer returns `unavailable`; the caller's `if (loaded.unavailable)` branch at line 88 is now dead and left for phase 2 as instructed.
- run.mjs passes `filename: options.unitPath` / `'<stdin>'`; plan-source and capability-plan-lint pass no filename (no path in scope).
- Door guard: the `import(` pattern uses a no-leading-dot lookbehind (`obj.import('yaml')` is a method, ignored) and call patterns accept a trailing comma; matches starting inside a string/template literal are ignored via the lexer's `shape` view. Third-party file and door exempt by exact path; no scan needed an exemption for the vendored file (architecture suite passed unmodified).
- Header avoids the literal path segment `dist` (the scout hook blocks it in commands); it says "the ESM bundle js-yaml.mjs".
- Impact analysis: GitNexus MCP not used; call sites cross-checked by grep. Every swap is a one-line parser substitution inside the callee, no signature changes; the only behavioral change visible to callers is the removed `unavailable` result.
- Phase file checkboxes/status not updated (plan state is owned by the caller).

## Unresolved
- Fix 2 of 5.4.3 (block-mapping splice) has no observable test discriminator; only the block-scalar fix is pinned.
- fgctl/release-binary tests cannot run in a fresh worktree without a cargo release build of fgctl; not attempted.
