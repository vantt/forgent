# Cell repo-divorce-1 — report

**Status:** [DONE]
**Outcome:** Migration tool `scripts/repo-divorce.mjs` + tests delivered — classify algorithm, 6-step `--execute`, `--dry-run`, `--rollback`; verify green; `--execute` never run against this workspace.

**Files touched**
- `scripts/repo-divorce.mjs` (new)
- `scripts/repo-divorce.test.mjs` (new)

**Verify:** `npm test && node --test scripts/repo-divorce.test.mjs && node scripts/repo-divorce.mjs --dry-run` — EXIT 0 (234/234 product, 14/14 script tests, dry-run clean plan, 0 unknown).

Full trace / evidence: `.bee/cells/repo-divorce-1.json`.

## Notes for slice C (execute) and reviewers

- **Doctrine-swap contract (step 2):** the staged dir is read at `repo/scripts/repo-divorce-staged/` after the whole-tree move; it must contain a `repo/` subtree (overlaid onto `./repo`) and a `workshop/` subtree (overlaid onto the workshop root). Cell 2 owns filling it to that shape.
- **Config patch (step 6):** exact text-edit targets the current `.bee/config.json` command strings and rewrites them to `cd repo && npm test` and `cd repo && npm test && node ../.claude/skills/distill/scripts/distill.mjs check`. The distill `check` cwd/path is the CONTEXT deferred-to-validating question — confirm literally during the slice-C rehearsal; the patch throws (never silently mangles) if the source strings have drifted.
- **`docs/decisions` and `.fgos/`** are in the product list but absent from the current tree — classified only if present; their absence does not affect dry-run.
