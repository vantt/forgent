# Phase report: Node temp names (p15)

Branch `one-door-debt/p15`. No Rust. No CHANGELOG line (internal temp names, no user-visible change).

## Done

- Temp names through `uniqueTmpTag()`: `main-checkout-activity.mjs`, `skill-wrappers.mjs` (both copy sites), `capped-jsonl-log.mjs`,
  `managed-timer.mjs`, `hold-transport.mjs` (`req-<n>.json.tmp-<tag>`), `scripts/export-command-selectors.mjs` `writeAtomic`.
  One form for file temps: `<target>.tmp-<tag>` (as `hot-lock.mjs` and `worktree.mjs` already do).
- `.gitignore` pattern for the generator scratch file: `*.tmp.*` -> `*.tmp-*`.
- `skill-wrappers.mjs` `ATOMIC_TMP_SUFFIX_PATTERN` accepts the older `pid-ts-rand` form and the tag form `pid-thread-ts-hex`.
  New case in `test/setup/skill-wrappers.test.mjs`: an in-flight temp skill dir of either form gets no wrapper. Verified it fails
  with the old pattern. Why new: the filter's input form changed.
- `docs/platform/component-boundary.md` Durable file row: one clause for `run-lock.mjs` best-effort fsync helpers (kept until the
  door has an fsync-only op) and for the new row.
- `doors` row "temp file name of a Node write-then-rename" added, `debt: []`.
- `packages/git/contracts/mutation-census.v1.json` regenerated (`--write-census`; payload digests only). Scan: 0 undeclared, classes
  unchanged. Expect a regenerate on rebase if another phase touched the census.

## Readers of the old names (searched by shape: `rg -n "\.tmp" src scripts bin test`)

- `skill-wrappers.mjs` filter: updated. Tests `test/setup/skill-wrappers.test.mjs:343`, `test/skills/fgos-mirror.test.mjs:81`
  use `/\.tmp-\d+/`: still match the new form.
- Rust reader `holder-lock/rust/src/route/hold.rs:78` `request_number` strips `req-` and `.json`; `req-1.json.tmp-<tag>` ends in
  neither, so it stays ignored (its tests use `req-N.json.tmp` as a non-matching fixture, still non-matching).
- `provider-credential-renewal.mjs:850` reads `.durable-file-*.tmp` (the crate's temp), unrelated. `pending/.tmp-<pid>-<id>`
  directory staging (`:1208,1466`) is another job; left, and the row's first pattern is anchored on `}.tmp-${process.pid}` so it
  does not match them.
- No sweeper keyed on the old temp names of the other four files.

## Pattern before/after (git grep over src scripts bin packages apps)

| pattern | base sites | after |
|---|---|---|
| `\}\.tmp-\$\{process\.pid\}` | main-checkout-activity:95, skill-wrappers:60,582 | none |
| `\$\{process\.pid\}\.tmp` | managed-timer:353, capped-jsonl-log:20, and tooling below | tooling only (allowed) |
| `\.tmp\.\$\{process\.pid\}` | export-command-selectors:377 | none |
| `req-\$\{[^}]+\}\.json\.tmp(?!-)` | hold-transport:229 | none |

Final `allowed` (each with reason, single-process tooling): `scripts/git-one-door-scan.mjs`, `scripts/lib/git-addon-stage.mjs`,
`scripts/run-rust-dev-host.mjs`. `store-increment-worker.mjs:62` (`.${index}.tmp`) matches no pattern, so not listed. Negative
check: putting `${logPath}.${process.pid}.tmp` back makes `test/architecture.test.mjs` fail on that line.

## Re-check of the big lead's three writers

- `generator writeAtomic`: real leak (pid + clock temp, `.gitignore` coupled to the name). Fixed.
- `provider-credential-renewal.mjs:127` `writeFileAtomic`: confirmed adapter. One line over `replaceDurably(dir, base, content, 0o600)`;
  it names no temp. It is the one place that fixes 0600 for credentials, cooldown and the cleanup markers (`cleanup.mjs:107,201`,
  own callers). Kept.
- `visibility-session.mjs:84` `writeJsonAtomic`: confirmed adapter over `publishMutableProjection`; only maps the error to
  `VisibilityError`. Kept. Same for `workflow/case-runtime.mjs:30-35` (adds mkdir over `replaceDurably`).
- `run-lock.mjs` best-effort fsync helpers: kept, named in the component-boundary clause.

## Gates

- `test/architecture.test.mjs` 56/56 green; `node scripts/export-command-selectors.mjs --check` ok; decision-citation-drift ok;
  Git one-door scan 0 undeclared.
- Every test matching `rg -l "capped-jsonl-log|hold-transport|skill-wrappers|managed-timer|main-checkout-activity|export-command-selectors" test`
  plus `doc-health` and `git-mutation-census`: green except the two reconcile import-graph cases (see below).
- Logs: `/dev/shm/odd-p15-*.log`.

## Open

Resolved with approval: `test/runner/dispatch-reconciliation-import-graph.test.mjs` pins the exact static closure of reconcile; `hold-transport.mjs`
importing the tier-0 `unique-tmp-tag.mjs` added one leaf to it; the leaf is now in the pinned closure list (not in the child_process exemption list).

## Lessons

- A temp-name filter and the names it filters are one contract: grep readers by name shape, not just by the old template.
- Anchor a door pattern on the surrounding syntax (`}.tmp-`) to separate file temps from directory staging instead of allowing a file.
- A pinned import-closure test is a hidden consumer of every new import in a module it reaches.
- A test for a filter must drive the pass that uses it (`ownedSkillDirs`), not the neighbouring prune pass that does not.
