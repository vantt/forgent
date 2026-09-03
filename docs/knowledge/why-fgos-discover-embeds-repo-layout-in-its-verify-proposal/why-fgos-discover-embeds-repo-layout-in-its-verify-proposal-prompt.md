---
framework: diataxis
mode: explanation
---
# Why `fgos discover` embeds repo layout in its verify-proposal prompt

`fgos discover`'s context-discovery judgment
(`buildDiscoveryPrompt`, `src/intake/discovery.mjs`) asks the model to
propose a verify command that actually runs. Before this fix, the prompt
never told the model anything about the real cwd or directory structure
the verify command would run from — only title/description/refs/deps/
graph-context/QA history. The model had no way to know that
`goal-check.mjs` always spawns `item.verify` with `cwd: repoRoot` (the
worktree root), never from any subdirectory — so a feature living inside
a nested package (e.g. `dogfood-fixture/`, with its own `test/` and
`package.json`) needed an explicit path prefix the model couldn't infer.

## The dogfood-proven bug

Decision 0018 (`tsk-1wd`, 2026-07-28, `fgos-coding-validating`) caught this for
real: a discover verdict came back `clear: true` with
`verify: "node --test test/expr/*.test.mjs"`. Running that from the real
cwd produced `no matches found` (exit 1) — the tests actually lived under
`dogfood-fixture/test/expr/`, and the proposed command was missing the
`dogfood-fixture/` prefix. This is systemic, not a one-off phrasing
issue: it recurs for *any* item whose relevant files sit inside a
subdirectory or nested package, regardless of how that item's own
title/description is worded.

## The fix — `buildRepoLayoutBlock`

`buildDiscoveryPrompt` now takes `repoRoot` and calls a new
`buildRepoLayoutBlock(repoRoot)` before the model proposes a verify
command. It reads the repo's real top-level directory
(`fs.readdirSync(repoRoot, { withFileTypes: true })`, excluding
`node_modules`/`.git`/`.fgos`), and separately marks which top-level
directories carry their own `package.json` (a nested package):

```js
const nestedPackages = topLevelDirs.filter((name) => {
  try {
    return fs.existsSync(path.join(repoRoot, name, 'package.json'));
  } catch {
    return false;
  }
});
```

The resulting prompt block states plainly that `goal-check.mjs` always
spawns `verify` from `repoRoot`, never from a subdirectory, and that any
nested-package directory's own test/verify command must `cd`/prefix into
it explicitly (e.g. `cd dogfood-fixture && npm test`) — it cannot run
directly from `repoRoot`.

## The listing is capped, on purpose

The block only shows the first `MAX_TOP_LEVEL_DIRS_SHOWN` (40) top-level
entries and `MAX_NESTED_PACKAGES_SHOWN` (15) nested packages, with a
`, +N khác` suffix when truncated — this keeps the prompt bounded even on
a repo with many top-level directories.

## A real anomaly threshold, found while writing tests

Above `TOP_LEVEL_ANOMALY_THRESHOLD` (500) top-level entries, the function
treats the directory as anomalous — almost certainly not a real repo
root — and skips the per-entry nested-package `existsSync` scan
entirely, rather than paying its cost only to truncate the result
anyway. This threshold wasn't a speculative guard: it was found live
while writing tests. The real `repoRoot=/tmp` of the test environment had
**330,280 entries**. The first unbounded version generated a giant
prompt that made `spawnSync` fail, which pushed every call into the
fail-safe `unclear` path — breaking all 11 `resolveDiscovery` tests at
once. This was a genuine unexpected bug, not just dirty test-environment
noise: a real repo with many nested packages could hit the same
unbounded-listing cost, so the cap stays in production, not just as a
test patch.

## Verification

4 new tests cover: real repo-layout embedding, the no-nested-package
case, graceful degradation when `repoRoot` is missing, and the
anomaly-threshold path. Full suite: 2325/2325 passing.

## Why a mechanical block, not model-driven scouting

The alternative — let the model scout the layout itself via Bash
`rg`/`Read` through the existing route — was considered and rejected.
Whether a directory has its own `package.json` is a 100%-mechanically-
determinable fact; it shouldn't depend on the model reliably choosing to
look. This keeps the same shape as the existing
`buildGraphContextBlock`/`buildRelatedItemsBlock` prompt sections, which
already inject mechanically-gathered facts rather than asking the model
to go find them.
