# repo-divorce-3

**Status:** DONE
**Outcome:** `stepUntrack` in `scripts/repo-divorce.mjs` now filters each `WORKSHOP_PATHS` entry through `git ls-files` before calling `git rm --cached`; an entry with 0 tracked files (e.g. `upstreams/`, ignored via `.gitignore`) is skipped with a one-line log instead of hitting git's fatal pathspec error. Classification algorithm, 6-step order, and exit codes unchanged.

**Files touched:** `scripts/repo-divorce.mjs`, `scripts/repo-divorce.test.mjs`

**Verify:** `npm test && node --test scripts/repo-divorce.test.mjs && node scripts/repo-divorce.mjs --dry-run` — passed (234/234, 15/15, exit 0). Full trace and evidence: `.bee/cells/repo-divorce-3.json`.

**Commit:** 4bdbe8b
