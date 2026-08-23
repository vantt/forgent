---
type: plan
title: Retire .fgos-runner.json — remove the legacy-fallback support entirely
tags: [config, runner, cleanup]
timestamp: 2026-08-07T05:10:00.000Z
source_capture_ids: []
---

# Plan: retire `.fgos-runner.json`

tsk-5hv. Decisions this plan honors: `CONTEXT.md` D1 (cold-turkey removal,
no migration), D2 (delete this repo's own tracked legacy file).

Mode: **high-risk**

Flags counted per `fgos-routing`'s Mode-gate: **public contract**
(`docs/routing-handoff-contract.md` names `.fgos/config.json`'s `runner`
section "fallback `.fgos-runner.json`" as part of the Routing Handoff
Contract itself — this item changes that contract's own fallback clause)
and **data loss** (hard-gate flag: cutting the runtime fallback cold-turkey
means any project that only ever had a legacy file and never ran `fgos
setup` would silently lose its effective config to
`DEFAULT_RUNNER_CONFIG` — CONTEXT.md D1 accepts this risk because no such
project exists yet, but the characteristic itself is real, which is what
the flag is naming). One hard-gate flag (data loss) alone forces
**high-risk** regardless of total flag count — no `Lane:` renaming; this
line is `plan.md`'s parsed `Mode:` token per `fgos-coding-planning`'s own
Bootstrap rule.

## Impact-analysis posture

`full` (GitNexus present). Cross-check performed before trusting it: this
session's own index-freshness hook flagged "stale (last indexed
251d0b5)" — before relying on `impact()` output, cross-checked its claim
that `describeConfigAwareness` calls `legacyRunnerConfigPath` against a
live read of `src/config/global-config.mjs:72`
(`const projectPresent = fs.existsSync(resolvedProjectPath) ||
fs.existsSync(legacyRunnerConfigPath(cwd));`) — symbol, line, and call
shape matched exactly. Impact results below are treated as trustworthy.

Real `impact()` results (upstream, callgraph mode):

- `legacyRunnerConfigPath` (shared-config-file.mjs): **MEDIUM**, 15
  impacted (5 direct: `describeConfigAwareness`, `readSharedConfig`,
  `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`,
  `checkConfigNotStale`).
- `readSharedConfig` (shared-config-file.mjs): **MEDIUM**, 8 impacted (5
  direct).
- `readRunnerModels` (project-agents.mjs, the item's original bug): **LOW**,
  2 impacted, contained inside its own module.

## Approach

Cold-turkey removal (D1) touches one tightly-coupled call chain — land it
as one piece, in this order:

1. `src/config/shared-config-file.mjs` — remove `readSharedConfig()`'s
   legacy-read branch (currently: shared file present → parse it; else
   legacy file present → parse it, wrap as `{runner: ...}`; else `{}`.
   Becomes: shared file present → parse it; else `{}`). Remove the
   `legacyRunnerConfigPath()` export entirely — GitNexus confirms nothing
   outside this module's own former callers needs it once they're updated
   in steps 2-3.
2. `src/config/global-config.mjs` — `describeConfigAwareness()`: drop the
   `|| fs.existsSync(legacyRunnerConfigPath(cwd))` disjunct from
   `projectPresent` (line ~72); drop the now-unused
   `legacyRunnerConfigPath` import (line ~16).
3. `src/setup/registrations.mjs` — `checkConfigNotStale`/
   `ensureSharedConfigDefaults`: drop their legacy-aware read branches;
   update the `config-not-stale` check's registered `description` string
   to stop naming ".fgos-runner.json fallback" (~line 370).
4. `scripts/project-agents.mjs` — `readRunnerModels()`: replace the direct
   `fs.readFileSync(path.join(repoRoot, '.fgos-runner.json'))` with
   `readSharedConfig` from `src/config/shared-config-file.mjs` (already
   returns `{runner: {...}}` shape post-step-1) rather than hand-rolling a
   second JSON parse here. This is the item's original root bug, closed by
   construction: there is no longer a second file for it to diverge from.

   **Correction (fgos-coding-validating round 1, FAIL — repo fit / proof
   surface):** `readRunnerModels(repoRoot)` must NOT be called with the
   module's own `REPO_ROOT = path.resolve(import.meta.dirname, '..')`
   (line ~33) for this lookup. `.fgos/` is unconditionally wiped from
   every freshly-created worktree (ADR0020) — confirmed live:
   `.fgos/config.json` does not exist in this item's own worktree
   (`ENOENT`), only at the main checkout. The legacy `.fgos-runner.json`
   never had this problem because it was a normal git-tracked file that
   survived worktree creation. `project-agents.mjs` genuinely runs inside
   disposable `/tmp/fgos-return-*` worktrees during real `npm test` verify
   runs (`docs/history/worktree-dependency-provisioning/CONTEXT.md`) — so
   an unfixed naive lookup would silently fall back to `DEFAULT_MODELS` on
   every such run, defeating the point of reading real config at all, with
   nothing in today's test suite positioned to catch it (`test/scripts/
   project-agents.test.mjs` calls `projectAgentMarkdown` directly with an
   explicit `models` argument — it never exercises `readRunnerModels`/
   `REPO_ROOT`).

   Fix: pass a main-checkout-resolving helper as the root for the
   `.fgos/config.json` lookup specifically, while `project-agents.mjs`'s
   own existing `REPO_ROOT` (`import.meta.dirname`-based) stays exactly
   as-is for locating `agents/`/`.claude/agents/` — those are git-tracked
   source directories that correctly follow the worktree's own
   checked-out branch, unlike `.fgos/`.

   **Second correction (found during Implement itself, not by
   fgos-coding-validating — the plan's first fix was ALSO wrong):**
   `resolveRepoRoot()` (`src/runner/paths.mjs`) does not actually resolve
   the main checkout — tested live and confirmed it returns
   `git rev-parse --show-toplevel`, which inside a worktree is the
   worktree's OWN root, not its main checkout (its own doc comment says
   "works correctly from inside a worktree", which is true for its actual
   callers but not the same claim as "resolves to the main checkout" —
   the plan conflated the two). The real fix: `resolveMainCheckoutRoot()`,
   a NEW function added to `src/runner/paths.mjs` during this item
   (`--git-common-dir`-based, extracted from `src/setup/registrations.mjs`'s
   pre-existing `resolveMainCheckout`, which now delegates to it instead of
   duplicating the git shell-out — avoids a circular import back into
   `registrations.mjs` from `dispatch.mjs`/`project-agents.mjs`, both of
   which needed the identical resolution and had the identical latent bug:
   `dispatch.mjs`'s `resolveCapacityCli`/`decideCapacityCli` and
   `bin/fgos.mjs`'s `discover`/`decompose` cases were ALSO calling
   `ensureRunnerConfigForDir` with a worktree-blind root
   — `resolveRepoRoot(cwd)` and a bare `process.cwd()` respectively — for
   the exact same reason, fixed the same way here).
5. `.claude/skills/_shared/capacity-dispatch-fallback.md` **and**
   `.agents/skills/_shared/capacity-dispatch-fallback.md` — identical
   edit, both files (confirmed byte-identical, hand-maintained, no
   projection script keeps them in sync). Step A's config-check script
   currently does
   `JSON.parse(readFileSync('$root/.fgos-runner.json')).capacities?.[...]`
   — becomes a read of `.fgos/config.json`'s `.runner.capacities?.[...]`.
   **Shape note (assumption, not a CONTEXT.md gap — implementation detail
   CONTEXT.md correctly left open):** the legacy file had `capacities` at
   its top level; the shared file nests the same data under a `runner`
   key. The script's JSON-path must change, not just its file path.
6. `src/cli/command-registry.mjs` — update the two `config` option help
   strings ("default .fgos-runner.json in cwd" → "default .fgos/config.json
   in cwd") and the `setup` command's description (drop "migrating a
   legacy .fgos-runner.json when present").
7. Comment-only cleanup: `src/setup/config-merge.mjs`,
   `src/state/gate-bypass.mjs`, `src/runner/loop.mjs`,
   `src/runner/prompt-templates.mjs`, `bin/fgos.mjs` (3 spots) — reword
   historical/illustrative references to cite `.fgos/config.json` instead.
   **Exception (locked in CONTEXT.md, extended during Implement):**
   `src/intake/plan.mjs`'s dotfile-tokenizer example comment keeps
   `.fgos-runner.json` as an illustrative dotfile name — it demonstrates
   generic tokenizer behavior on dotfiles, not this file's existence. Its
   own test file, `test/intake/plan.test.mjs`, carries the same
   exception for the same reason: its `findUncoveredLockedDecisions`
   dotfile-tokenizer regression tests (`tsk-gio`, citing "the tsk-2ta
   case") reproduce a real historical bug report that used
   `.fgos-runner.json` as its motivating example — rewriting the filename
   would lose that historical fidelity for no behavioral gain, since the
   test exercises generic dotfile-tokenizing, not this item's config
   resolution.
8. `git rm .fgos-runner.json` (D2).
9. Update the 17 test files CONTEXT.md enumerates. Each one's
   "legacy-file-present, shared-file-absent" fixture case either gets
   deleted (if it existed solely to prove the now-removed fallback) or
   repointed to assert the new behavior (defaults win silently, per D1 —
   no exception, no read).
10. Update the ~15 active docs CONTEXT.md enumerates, including
    `docs/routing-handoff-contract.md`'s explicit fallback clause (the
    public-contract flag this plan's Mode is based on).

No `fgos graph`/`--what-if` ordering call made — that tooling ranks
multiple *work items* against each other; this plan has no split (below),
so there is nothing for it to rank.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `readSharedConfig()` legacy branch removed | MEDIUM (impact: 8 upstream, 5 direct) | `npm test` green on `test/config/shared-config-file.test.mjs`, `test/config/global-config.test.mjs`, `test/setup/registrations.test.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/loop.test.mjs` — the 5 depth-1 callers `impact()` named |
| `legacyRunnerConfigPath` export removed | MEDIUM (impact: 15 upstream across 3 depths) | item's own NEGATIVE verify clause — zero repo-wide hits for the literal string post-change (scoped exclusions per CONTEXT.md) |
| `project-agents.mjs` direct-read bug closed, root resolved via `resolveMainCheckoutRoot()` not naive `REPO_ROOT` (nor `resolveRepoRoot()`, the plan's own first, also-wrong fix attempt) | LOW (impact: 2 upstream, contained), but a wrong root-resolution is invisible to today's tests (see Approach step 4 correction) | `test/scripts/project-agents.test.mjs` green + item's POSITIVE clause `grep -q 'resolveMainCheckoutRoot' scripts/project-agents.mjs && grep -q "runner/paths.mjs" scripts/project-agents.mjs` — pins the specific correct helper/import, not just the string "config.json" (which a broken naive-`REPO_ROOT` implementation would also contain) |
| Repo-root file deleted (D2) | LOW, but visible | item's POSITIVE clause `test ! -e .fgos-runner.json` |
| Skill-prose fragment edit (2 identical files) | MEDIUM — prose, not statically provable at runtime | per `docs/how-to/write-verify-for-a-skill-prose-change.md`: POSITIVE (`grep -q 'config.json'` in both files) + repo-wide NEGATIVE is the correct and *sufficient* proof surface for a skill-prose change — no live agy/capacity-dispatch smoke run required as a blocking proof point here (that doc's standing rebuttal to `judgeVerifySemanticCorrectness`'s runtime-comprehension demand) |
| Doc updates (~15 files) | LOW — prose only | reviewed for accuracy at PR time; `docs.maxLoc` respected; no automated proof beyond that |

## Shape — cases worth proving (high-risk depth)

- **Empty/boundary**: fresh install, neither `.fgos/config.json` nor
  `.fgos-runner.json` present — `describeConfigAwareness` must still
  report `active: 'none'`/`'global'` correctly. Existing
  `global-config.test.mjs` coverage must survive the edit re-pointed at
  this case, not just have its legacy-branch assertions deleted wholesale.
- **Existing behavior, must not regress**: `.fgos/config.json`-only path —
  already the common case (this repo's own dogfooding runs on it) — must
  be provably unaffected. Covered by the bulk of the existing green
  `npm test` suite.
- **Concurrent access**: not applicable — config is read-only per
  invocation; this item introduces no new concurrency surface.
- **Silent divergence** (the actual defect this item exists to close):
  proof is the item's own POSITIVE verify clause, reinforced structurally
  — once there is exactly one file, there is no second copy left to drift
  from.

## Split decision

**No split.** `impact()` confirms `shared-config-file.mjs` /
`global-config.mjs` / `registrations.mjs` / `dispatch.mjs` sit in one
tightly-coupled call chain (depth-1/2 callers of the same two removed
symbols), and their existing tests assert behavior spanning exactly that
chain. A child touching only one file would leave sibling files' existing
tests asserting fallback behavior that no longer holds — the pieces only
compile/test green together. This is one honest piece of work; the item
proceeds as itself.

## Verify

Strengthened after `fgos-coding-validating` round 1's FAIL (proof surface): the
`project-agents.mjs` POSITIVE clause now pins the specific correct
helper/import, not just the string "config.json":

```
npm test && test ! -e .fgos-runner.json && grep -q 'resolveMainCheckoutRoot' scripts/project-agents.mjs && grep -q "runner/paths.mjs" scripts/project-agents.mjs && grep -q 'config.json' .claude/skills/_shared/capacity-dispatch-fallback.md && grep -q 'config.json' .agents/skills/_shared/capacity-dispatch-fallback.md && ! rg --hidden -l '\.fgos-runner\.json' --glob '!.git' --glob '!node_modules' --glob '!.claude/worktrees/**' --glob '!.fgos/events.jsonl*' --glob '!docs/history/**' --glob '!docs/decisions/**' --glob '!plans/reports/**' --glob '!src/intake/plan.mjs' --glob '!test/intake/plan.test.mjs' --glob '!docs/how-to/fix-fgos-write-rejected-merge-block.md' --glob '!docs/backlog.md' .
```

## Assumptions

- The skill-fragment shape note in Approach step 5 (legacy top-level
  `capacities` → shared file's nested `runner.capacities`) — **proven** at
  `fgos-coding-validating` round 1 by reading both `.fgos-runner.json` and the
  main checkout's `.fgos/config.json` live: confirmed exactly as stated
  (`capacities` at legacy top level; `runner.capacities` nested in the
  shared file).
- `readRunnerModels`'s reuse of `readSharedConfig` (step 4) assumes that
  function's returned shape after step 1 lands is exactly `{runner:
  {models: {...}, ...}}` — same shape it already returns for the
  shared-file case today. Not re-verified here — remains open for
  `fgos-coding-validating`'s next pass or for execution itself to confirm.
