# tsk-5iv — round-3 review fixes

## Feature boundary

Fix 6 real defects (2 HIGH, 4 MEDIUM) found by an independent round-3 review
(4 parallel opus code-reviewer agents, real-command verified) of 4 already-merged
commits (5186825/tsk-x5r, 9174313/tsk-297, 2a1d129/tsk-3g5, d3ae2cb/tsk-59a).
No new features. No change to the wave-schedule/attestation mechanisms'
external contract beyond what's listed below.

## Scout evidence

- `bin/fgos.mjs:179` `excludeFgosPaths` — blanket `.fgos/**` exemption added by tsk-x5r.
- `git ls-files .fgos` → tracked: `config.json`, `gate-bypass.json`,
  `coexistence.json`, `docs/enduser-docs-index.json`, `entropy-history.jsonl`,
  `events.jsonl` (+ backup files). `.gitignore` confirms `state.json`,
  `sessions.json`, `*.lock`, `invocation-faults.jsonl`,
  `tool-status.local.json` are gitignored — never appear in a git diff, so
  irrelevant to `footprintDiffHits` regardless of exemption scope.
- `git log -- .fgos/config.json` shows real feature commits touching it
  (784bcbc, 662f2b1, 3004945) — it is a genuine work product, not lifecycle noise.
- `bin/fgos.mjs:3842-3857` `main-checkout-reset` — `repoRoot =
  path.dirname(dir)`, `dir` defaults to `resolveFgosDir(process.cwd(),
  {strict:true})`.
- `src/runner/paths.mjs:6-11,20-24` — explicit design law: "`strict: true`
  (bin/fgos.mjs's CLI contract) skips git entirely and returns `cwd` as-is:
  `.fgos/` always lives under the caller's own cwd, never resolved upward,
  never treating a worktree as equivalent to its main checkout." This is a
  stated, deliberate repo-wide contract, not an oversight local to this verb.
- `bin/fgos.mjs:4025-4028` `STORE_MISSING_WARNING_VERBS` — current set:
  `list, ready, graph, stale, check, rollup, show, conflicts, triage,
  schedule, gate-bypass, doc-sources, lock-status`. Missing: `evolve`,
  `docs-index`, `main-checkout-reset` (all `requiresExistingStore:false`
  per `src/cli/command-registry.mjs`).
- `test/intake/plan.test.mjs` (tsk-297 test) + `src/intake/plan.mjs:514-563`
  — confirmed by 4/4 independent reviewers: the shipped crash-guard fixture
  `footprint:[null,'important.mjs']` against decision `'important.mjs'`
  never reaches `isCoveredByDirectory` because `covered.has(p)` short-circuits
  first.
- `.claude/skills/fgos-coding-exploring/SKILL.md:196` and its `.agents/skills` mirror
  — `fgos add` example uses `--dir "$root"` with no `root=` assignment in
  that code block (only unrelated assignments at lines 112/231). Same
  commit (d3ae2cb) added `root=$(git rev-parse --path-format=absolute
  --git-common-dir | xargs dirname)` next door in `fgos-coding-planning/SKILL.md`
  for the identical defect class.
- `src/intake/plan.mjs` `isDirectoryContainingCoverage` (tsk-297) —
  one nested file fully covers a directory-shaped locked decision.
  `PATH_TOKEN_PATTERN` requires 2+ path segments, so a bare top-level dir
  can never be captured (bounds the blast radius somewhat).
- `node bin/fgos.mjs tool query --capability impact-analysis --status
  present --dir "$root"` → GitNexus present. impact-analysis: **full** per
  `CLAUDE.md`'s capability gate — `impact` must be run on every touched
  symbol before editing, per the repo's Always Do rules.

## Locked decisions

- **D1 (HIGH-2 fix shape)**: `main-checkout-reset` must be fixed by making
  it **refuse to run without `--dir`** when `process.cwd()` is not the main
  worktree (using the same `isMainWorktree` check `STORE_MISSING_WARNING_VERBS`'
  guard already uses at `bin/fgos.mjs:4093`), NOT by resolving `repoRoot`
  through git's common-dir. Git-common-dir resolution would silently violate
  `paths.mjs`'s own stated design law (`strict: true` = "never resolved
  upward, never treating a worktree as equivalent to its main checkout") for
  this one verb while leaving it true everywhere else — an inconsistent,
  undocumented exception. Refusing without `--dir` matches the existing
  precedent (`STORE_MISSING_WARNING_VERBS`'s worktree guard) and keeps the
  cwd-strict contract intact for every verb uniformly. Also add
  `main-checkout-reset` to `STORE_MISSING_WARNING_VERBS`'s warn set is
  insufficient alone (session-symlinked `.fgos/` defeats the existence
  check) — the refusal is the real fix; the warning-set entry is optional
  defense-in-depth planning may skip if the refusal alone fully closes it.
- **D2 (MEDIUM-1 exemption scope)**: `excludeFgosPaths` must stop exempting
  tracked policy/generated files (`config.json`, `gate-bypass.json`,
  `coexistence.json`, `docs/enduser-docs-index.json`) and keep exempting
  only genuine append-only lifecycle noise (`events.jsonl` and its backup
  files, `entropy-history.jsonl`). The exact implementation shape (allowlist
  vs denylist) is left to planning/implementation — not a product decision,
  the *which-files* boundary above is.
- **D3 (MEDIUM-2 scope)**: add `evolve` and `docs-index` to
  `STORE_MISSING_WARNING_VERBS`. Whether to additionally refactor the Set to
  derive from the command registry's `requiresExistingStore:false` flag
  (minus an explicit opt-out list) instead of hand-maintaining it is left to
  planning's judgment on scope/risk — deferred, not required for this fix.
- **D4 (MEDIUM-3)**: add the identical `root=$(git rev-parse
  --path-format=absolute --git-common-dir | xargs dirname)` line before the
  `fgos-coding-exploring/SKILL.md` `fgos add` example, in both `.claude/skills` and
  `.agents/skills` copies, keeping them byte-identical per the repo's
  existing dual-root convention.
- **D5 (MEDIUM-4 scope)**: fix left to planning's judgment between (a)
  tightening `isDirectoryContainingCoverage` to require the covering
  footprint to name the directory itself or a path at/above it, or (b)
  documenting the current one-nested-file-covers-directory semantics
  explicitly as an intentional trade-off in a code comment if (a) risks new
  false positives. Deferred — implementation-level, not product-level, per
  this skill's own scope rule (advisory-only signal-quality tuning belongs
  to whoever builds it).
- **D6 (HIGH-1)**: fix the `test/intake/plan.test.mjs` crash-guard
  fixture so it actually reaches `isCoveredByDirectory`'s non-string path
  (no exact-match coverage present) — mechanical, no ambiguity.

## Pinned terms

None new — reuses existing vocabulary (`footprint`, `advisory`,
`requiresExistingStore`, `main worktree` vs `linked worktree`).

## Outstanding questions deferred to planning

- Exact exempt-filename list for D2 (allowlist implementation detail).
- Whether to refactor `STORE_MISSING_WARNING_VERBS` to derive from the
  registry (D3, optional scope extension).
- Tighten-vs-document choice for D5 (isDirectoryContainingCoverage).

## impact-analysis capability

`impact-analysis: full` (GitNexus present, freshly checked this session).
Every symbol this item's implementation touches
(`excludeFgosPaths`, `main-checkout-reset` case, `STORE_MISSING_WARNING_VERBS`,
`isDirectoryContainingCoverage`, the decompose test fixture) must get a real
`impact({target, direction:"upstream"})` call before editing, per
`CLAUDE.md`'s Always Do rules.
