# A38 review, step-02i mapping packet, part 84 (native-dynamic-patterns)

- Reviewer: reviewer:sonnet-session:a9082873e7e8f5a42@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree /home/vantt/projects/forgentX-s8-review detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, read-only)
- Part: 84, population native-dynamic-patterns, 9 entries, source table step-02i-review-data.json (annex rows from step-02c-inventory-edges.json), index step-02i-mapping-review-index.json
- Method: resolved the 9 annex rows; confirmed they are exactly the nine `identityStatus: unresolved-dynamic-pattern` edges of step-02c-inventory-edges.json (13,136 edges; set equality holds; the other 121 dynamic edges resolved). Read the code at every site and compared with current source and git history.

## Population finding that applies to all nine
All nine sites are `path.join(...)` expressions inside fenced code examples in four markdown knowledge docs under docs/knowledge/. None is executed code in src/, scripts/ or bin/, so none is a runtime consumer of any docs path. The labels "native code/scripts" and "Step 5 trace needed" over-describe them. Every line number matches the committed file. Not one of the nine builds a path under a retiring root (docs/specs, docs/architect, docs/decisions); the roots are the repo or main checkout root, a node_modules directory, a temporary npm install prefix, and a state-log directory. Index `retiringConsumerEdges: 0` is confirmed. The disposition (preserved unresolved, trace deferred) is conservative but loses nothing; preserve-as-non-consumer would also be right, and a Step 5 behavioral trace adds no proof for any of them.

## Per-entry verdicts

| Entry | Site (line) | What the path is at runtime | Retiring root? | Disposition judgment | Verdict |
|---|---|---|---|---|---|
| native-consumer_unresolved_efaf1bfba96769d62428f16e | docs/knowledge/add-a-new-npm-dependency-to-forgent/add-a-new-npm-dependency-to-forgent.md:24 `path.join(root, 'package.json')` | `<root>/package.json`, root = main checkout or cwd (snippet copies `checkDependenciesInstalled`, still identical at src/setup/registrations.mjs:2765-2783). Census pattern `**/package.json` is wider than the real single root-level file but names the right target. | no | Park/preserve both safe; no behavioral coupling to docs roots. | ok |
| native-consumer_unresolved_cf7df440e5263b0ac6b69906 | same file:33 `path.join(root, 'node_modules')` | `<root>/node_modules`. | no | as above | ok |
| native-consumer_unresolved_dc7b7934db247dc52f584f67 | same file:34 `path.join(nodeModulesPath, dep)` | `<root>/node_modules/<dependency name>`; pattern `**` is imprecise but the root `nodeModulesPath` is recorded. | no | as above | ok |
| native-consumer_unresolved_b58356fa733715aaf1222992 | docs/knowledge/why-approve-logs-post-success-movework-faults-outside-events/why-approve-logs-post-success-movework-faults-outside-events-lock.md:73 `path.join(dir, APPROVE_FAULT_LOG_BASENAME)` | `<dir>/approve-post-success-faults.jsonl`; the constant is defined five lines above in the same snippet, so the census `**` pattern drops a basename that was statically resolvable. In current source the module is gone (no `APPROVE_FAULT_LOG_BASENAME` in src; introducing commit cef13cb25) and the file is `.fgos/logs/approve-post-success-faults.jsonl` via src/state/fgos-file-registry.mjs:38, so the doc snippet is historical. State directory, not a docs root. | no | Preserve as historical snippet is right; Step 3 may note the stale snippet, not a census defect. | ok |
| native-consumer_unresolved_717e428fd2ffeffa0de2aa5c | docs/knowledge/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal-prompt.md:42 `path.join(repoRoot, name, 'package.json')` | `<repoRoot>/<top-level dir>/package.json` (nested-package detection). Code no longer exists (`buildRepoLayoutBlock` absent from src and bin; removed by 794df20e0, introduced by e7934f313), so the snippet is historical. | no | Preserve; no behavior to prove. | ok |
| native-consumer_unresolved_b6b49faaa1d014cc08d5cf08 | docs/knowledge/windows-npm-install-g-prefix-has-no-lib-or-bin-subfolder/windows-npm-global-install-has-no-lib-or-bin-subfolder.md:39 `path.join(installPrefix, 'node_modules', 'forgent')` | Windows global-install package dir under a temp `--prefix` dir; mirrors test/install-packaging.test.mjs:110. | no | Preserve; test-only temp path. | ok |
| native-consumer_unresolved_68de4058d052c3b8cec17653 | same file:40 `path.join(installPrefix, 'lib', 'node_modules', 'forgent')` | Unix global-install package dir; test/install-packaging.test.mjs:111. | no | Preserve. | ok |
| native-consumer_unresolved_4a7a194a457ec2d22c074b19 | same file:43 `path.join(installPrefix, 'fgos.cmd')` | Windows shim path; test/install-packaging.test.mjs:130. | no | Preserve. | ok |
| native-consumer_unresolved_f20b1a27a67c9949c6246d1e | same file:44 `path.join(installPrefix, 'bin', 'fgos')` | Unix shim path; test/install-packaging.test.mjs:131. | no | Preserve. | ok |

## Observations (not rework)
- The same Windows doc has two more path expressions at lines 19-20 (`lib/node_modules/forgent`, `bin/fgos`) in an untyped code fence; they are not in the census because only language-tagged js fences were parsed. They build the same two paths as lines 40 and 44, so no new path and no retiring root is missed.
- Pattern text such as `**` and `**/package.json` is wider than the real runtime target; harmless here because the census records the unresolved root and none of the nine reaches a docs root.
- If Lead wants the set closed rather than carried to Step 5: reclassify all nine as illustrative snippets in docs/knowledge (non-consumers, no legacy-root path), with this review as the evidence; that choice is optional and not required for acceptance.

## Totals
9 entries: ok 9, rework 0, needs-Lead-judgment 0. Rework 0%.
