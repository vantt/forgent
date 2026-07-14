# Cell repo-divorce-4 — report

**Status:** [DONE]
**Outcome:** Three rehearsal round-2 findings fixed in `scripts/repo-divorce.mjs` (flat staged swap, step-0 precheck, ignore upstreams); verify green; `--execute` exercised only on tmp fixtures.

**Files touched**
- `scripts/repo-divorce.mjs`
- `scripts/repo-divorce.test.mjs`

**Verify:** `npm test && node --test scripts/repo-divorce.test.mjs && node scripts/repo-divorce.mjs --dry-run` — EXIT 0 (234/234 product, 20/20 script tests, dry-run clean).

## Fixes

- **F1 — flat staged consumption.** `stepSwapDoctrine` now maps the six flat suffix-named staged files (`AGENTS.repo.md`→`repo/AGENTS.md`, `CLAUDE.repo.md`→`repo/CLAUDE.md`, `reading-map.repo.md`→`repo/docs/specs/reading-map.md`, `AGENTS.workshop.md`→`AGENTS.md`, `CLAUDE.workshop.md`→`CLAUDE.md`, `reading-map.workshop.md`→`docs/reading-map.md`) via `STAGED_MAP`. Any missing staged file throws — no silent no-op, so a full BEE block can never survive into `repo/AGENTS.md`.
- **F2 — step-0 precheck.** New non-mutating `stepPrecheck` runs before step 1: resolves the git identity (`git config` = repo-local then global), asserts the six staged files and the two step-6 config patterns exist. Everything that could throw in steps 5/6 now fatals before the point of no return. The resolved identity flows to `stepGitInitWorkshop`, which sets it repo-local on the fresh workshop repo before its commit.
- **F3 — ignore upstreams.** The workshop `.gitignore` (step 5) now includes `/upstreams/`, so embedded upstream clones are never staged as gitlinks (original `.gitignore` semantics).

Unchanged as required: classification algorithm, 6-step order, exit codes, and the contents of the six staged files.

Full trace / evidence: `.bee/cells/repo-divorce-4.json`.

## Notes

- Real workspace was not mutated by this cell. `AGENTS.md`/`CLAUDE.md` appear modified in `git status`, but that is pre-existing GitNexus re-index churn in the managed `gitnexus:start` block (symbol counts 1774→2214), timestamped before this session — out of this cell's scope and not committed here.
- New tests run `--execute` only on throwaway `/tmp` fixtures (`buildDivorceFixture`); F2 isolates git config via `GIT_CONFIG_GLOBAL/SYSTEM=/dev/null`.
