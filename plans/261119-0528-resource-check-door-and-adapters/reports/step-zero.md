# Step zero (plan A decision 24)

- base: e5ea2c754940704d6bc37bca1815d3340c6ce9bc (origin/main, equals HEAD of lead/resource-door); plan.md frontmatter `base:` updated from f3c32fb891d0
- date: 2026-11-19 08:53

## Facts

| Fact | Cited | Status |
|---|---|---|
| portfolio.rs `plain` | ~317 | corrected: line 296 (packages/supervision/rust/src/portfolio.rs) |
| read_phase_table wave -> None | 384 | corrected: fn at 343, `wave: plain(..).parse().ok()` at 381 |
| read_phase_table (388) | 388 | corrected: ends ~389 (`Vec::new()` return at 388 is the no-table fallback); duplicate ids not deduped, still true |
| frontmatter non-string entries dropped | 121-129 | still true (list closure 125-131, `Value::Str` filter_map at 128) |
| normalize / overlaps / admissible / read_plan | n/a | normalize 192, overlaps 200, admissible 215, read_plan 106 |
| graph-harness.mjs footprintOverlapAmong / rankImpact | 144 / 151 | still true |
| architecture-manifest.json hot-lock door | 268-284 | still true (job 268, retiredBy 283, reason 284) |
| build-skill-wrappers.mjs ensureAddonForScript | 15, 20 | still true (import 15, call 20) |
| capability-plan-lint.test.mjs pathsOverlap | 14, 414-423 | still true |
| fgos-merge.test.mjs merge-list conflicts | 778-786 | still true |
| hot-lock.mjs nativeDoor import | 25 | still true |
| land.rs calls fgos_write_scope | exists | still true: packages/git/rust/src/land.rs (259-360) and packages/supervision/rust/src/land.rs (486-488, new fact: supervision crate also uses it) |
| durable-file open_beneath | exists | still true: packages/durable-file/rust/src/beneath.rs:283 (open_beneath_with 247) |

## Plan check (run-plan-check.mjs --all, no --json flag exists)

- exit 1 (one pre-existing failing plan); baseline saved at reports/plan-check-baseline-step0.txt (includes cargo compile lines first)
- plans counted: 128 (contract 15, failing 1; legacy 113)
- failing: 261118-1117-external-ui-integration-multica (missing sections, source not a list)
- errors naming 261119-0528: none
- overlap pairs: none reported
