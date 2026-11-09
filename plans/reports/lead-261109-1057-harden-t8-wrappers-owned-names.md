# HARDEN T8 lead: skill render writes only owned names

Branch `harden/t8-wrappers`. Fixes the two High findings of `council-261109-1000-harden-t8-arbitration.md` (build script dying after it wrote; wrapper step rewriting other kits' skills).

## What changed
- `src/setup/skill-wrappers.mjs`: `ownedSkillNames(...roots)` (names assembled from `core/skills` and `domains/*/skills`, plus `_shared`) and one filter `ownedSkillDirs`; the wrapper step, the plugin mirror and the `fgos setup` copy all take their names from it. `generateAllSkillWrappers` and `mirrorDevSkillsIntoPlugin` now require the owned set (every caller moved). A generated-stamp refusal for a same-named folder (Q3 b, unanswered) is not built; it would be one more check inside `ownedSkillDirs`.
- `renderSkillSurfaces(root)`: computes the owned set and the instruction projection before the first write, then assembles, wraps, mirrors, projects.
- `scripts/build-skill-wrappers.mjs`: `ensureAddonForScript()` plus one call.
- Tests (`test/setup/skill-wrappers.test.mjs`, red first): foreign `ak-x` under all three roots survives render; setup leaves a foreign target dir byte-identical and never copies a package `ak-x`; a projection refusal leaves the tree untouched; the script with no staged addon either completes or exits before its first write (scratch tree, symlinked modules). Fixtures that modelled a package with only `.agents/skills` now give it `core/skills` sources, since ownership is read from sources.
- CHANGELOG line, contract row in `skill-package-distribution.md`, census regenerated (two file hashes; OPC to glance).

## Gate
Focused: skill-wrappers, uninstall-wiring, fgos-mirror, architecture, doc-health, citation drift green (232); git-one-door-scan 0 undeclared. Full suite (966 s): 7 fails, none touch this change: V7n addendum (known); seal child, run-verify-pin, mailbox-live-confined orphan sweep, session multiprocess, worktree-admin-multiprocess pass alone; `loop.test.mjs` exceeds the 600 s limit at load 28 to 40 (also alone), no reference to skills. It left `fgos-loop-test-*` dirs in the tmp root.

## Not done / notes
- `build:skills` was never run in a worktree or the main checkout; the script is proven in a scratch tree only. Real tracked surfaces are covered: every tracked name under the three roots is owned except hand-authored `.claude/skills/ui-spec` and the plugin commands, which the render never wrote.
- Orphan prune of `.claude` wrappers still tests the marker with `includes` (a foreign skill quoting the marker would be pruned); that is the anchored-stamp item, still open.
