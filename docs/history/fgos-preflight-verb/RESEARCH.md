# Research: tsk-4e1 — `fgos preflight` verb

## 2026-08-25 — discovery round 1

**Asked:** How do existing fgOS CLI verbs get registered/implemented, so a
new `fgos preflight` verb bundling 3 existing checks (mirror-sync-diff,
`check-decision-citation-drift.mjs`, `check-backlog-reconciliation.mjs`)
follows the same shape? What exactly are the "3 mirror paths"? Are the two
`check-*.mjs` scripts already safely invokable standalone? Is any of this
already caught automatically today (npm test / CI / pre-commit)?

**Checked and found:**

- No `preflight` verb exists yet — `grep -n "^\s*case '" bin/fgos.mjs`
  lists 60+ verbs (`version`, `init`, ... `resync-worktree`,
  `main-checkout-reset`), none named `preflight`.
- Verb registration is two-part:
  1. `bin/fgos.mjs` — a `case '<name>': { ... }` in the big dispatch
     switch.
  2. `src/cli/command-registry.mjs:52` — a matching `COMMAND_REGISTRY`
     manifest entry (`name`, `invoke`, `description`, `parameters`,
     `touchesState`, `requiresExistingStore`, `externalEffect`,
     `paginated`, `deprecated`). Per the file's own header comment
     (`src/cli/command-registry.mjs:1-45`) this is pure data, the single
     source of truth for `fgos --help --json`.
  - Closest existing pattern for "run N named checks, aggregate, report":
    the `doctor` verb (`bin/fgos.mjs:3943-3956`) — `DOCTOR_CHECKS.map(({id,
    description, check}) => ({id, description, passed, message}))`,
    returns `{checks}` (or `{fixed, checks}` with `--fix`). A `preflight`
    verb can mirror this shape with its 3 checks.
- Mirror topology (source of the item's own "presumably .agents/skills as
  source" guess) — confirmed exactly via `scripts/build-skill-wrappers.mjs`
  (full file read):
  - Source: `.agents/skills/` (`agentsSkillsRoot`).
  - Mirror 1: `.claude/skills/` via `generateAllSkillWrappers(agentsSkillsRoot,
    claudeSkillsRoot)` (thin wrappers).
  - Mirror 2: `plugins/fgOS/skills/` via
    `mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot)`.
  - Both driven by `npm run build:skills` (`package.json:30`).
  - The item's guess was correct: 2 real mirror destinations + 1 source,
    "3 paths" total.
- No existing test enforces `.claude/skills`/`plugins/fgOS/skills`
  freshness against the real, committed `.agents/skills`:
  `grep -rln "generateAllSkillWrappers\|mirrorDevSkillsIntoPlugin"
  test/setup/skill-wrappers.test.mjs` shows every call there uses
  `mkTempDir(...)` throwaway roots, never the real repo paths. A separate
  drift guard test in the same file (`test/setup/skill-wrappers.test.mjs:256-273`)
  checks a DIFFERENT layer (`core/skills`+`domains/*/skills` → committed
  `.agents/skills`), not the `.agents/skills` → `.claude/skills` /
  `plugins/fgOS/skills` layer this item is about. So the mirror-sync gap
  is currently NOT caught by any automated test at all (worse than
  "only caught by npm test" — today it's not caught until someone notices
  by hand, matching the item's own tsk-3av incident).
- `.githooks/pre-commit` (full file read, real hook at
  `<repoRoot>/.githooks/pre-commit`, wired via `core.hooksPath`) only
  protects 5 `.fgos/`-invariant guards (stale worktree index, staged
  `.fgos/` deletions, staged `.fgos/` changes on a worker branch, main
  checkout sitting on a `fgw/*` branch, staged `.fgos/` modifications that
  regress line count). It has zero mirror-sync or decision/backlog-drift
  logic — confirms the item's own rationale that adding those 3 checks
  there would be scope creep on a hook that today has one narrow job.
- `.github/workflows/ci.yml` (full file read) runs exactly `npm test` (+ a
  separate `cargo test` job for `herdr-plugin/`) — no standalone
  `git diff --exit-code` / lint job exists in CI either.
- `scripts/check-decision-citation-drift.mjs`: has a clean CLI contract —
  `runCli(argv, cwd)` returns `0`/`1`, only self-invokes under
  `if (import.meta.url === \`file://${process.argv[1]}\`)`
  (`scripts/check-decision-citation-drift.mjs:437,509-513`), so it is safe
  to import OR to spawn as `node scripts/check-decision-citation-drift.mjs`.
  It already has `test/scripts/check-decision-citation-drift.test.mjs` and
  is already exercised by `npm test` today (bin/fgos.mjs even imports two
  of its helpers directly — `bin/fgos.mjs:21`).
- `scripts/check-backlog-reconciliation.mjs`: runs its checks
  UNCONDITIONALLY at module top level and calls `process.exit(1)` directly
  on failure (no `import.meta.url` guard, confirmed by reading the full
  file, exits at lines 62/77/85/93/140) — safe to invoke only as a
  subprocess (`node scripts/check-backlog-reconciliation.mjs`), never as an
  `import`. `grep -rln "check-backlog-reconciliation" --include=*.mjs
  --include=*.json --include=*.yml .` (scoped to this item's own worktree)
  returns **nothing** — this script has zero test coverage and zero
  callers anywhere in the repo today. It is not part of `npm test`, not
  part of CI, not part of any doctor check. This is a stronger gap than
  the item description implies (item says these get caught "when npm test
  runs" — for this one script specifically, nothing currently runs it at
  all).
- Test naming convention for a new verb: `test/cli/fgos-<verb>.test.mjs`
  (confirmed via `ls test/cli/` — `fgos-approve.test.mjs`,
  `fgos-merge.test.mjs`, `fgos-move.test.mjs`, etc.). A `preflight` verb's
  own test would be `test/cli/fgos-preflight.test.mjs`, giving a concrete,
  runnable verify command.
- Classification vocabulary (`src/state/workflow-stage-graphs.mjs:122-125`):
  `kind` ∈ {bug, chore, design, docs, feature, task}; `risk` ∈ {light,
  standard, heavy}. The item currently carries `kind: bug`, but the real
  deliverable is net-new capability (a verb that does not exist today,
  plus a manifest entry and a new test file) rather than a fix to broken
  existing behavior — `feature` fits the real evidence better than `bug`.
  `risk: standard` (already set) matches: moderate, well-precedented scope
  (one new verb following the `doctor` pattern, no locked-law or
  cross-cutting change), not `light` (new CLI surface + manifest entry is
  more than a one-line tweak) and not `heavy` (no architecture change, no
  new invariant, no locked law touched).

**Classification note:** attempted `fgos edit --kind feature` per the
judgment above; the engine refused (exit 4): `kind` can only change while
`status` is `todo` (it selects the workflow/stage graph), and this item is
already claimed (`status: doing`). `kind` stays `bug` as originally
submitted — a mechanical engine constraint, not new counter-evidence
against the `feature` judgment above. `tier`/`risk` were already correct
(`standard`/`standard`), so no edit was needed for those.

**Still open (left for planning, not a discovery blocker):** whether
wiring the new verb's invocation into `fgos-coding-implement`'s own Step 3
(Verify) is in THIS item's scope or a natural follow-up — the item's own
text states a design constraint ("should be CALLED by the driver skill,
not a git hook") but does not by itself require editing that skill in the
same change. This is a scope-sizing call, which `fgos-coding-planning`
owns (YAGNI / smallest-honest-plan), not a fact discovery is missing.
