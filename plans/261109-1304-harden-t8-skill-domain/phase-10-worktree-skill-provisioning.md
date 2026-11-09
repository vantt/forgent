---
phase: 10
title: "Worktree skill provisioning, kit-agnostic: a new worktree receives every foreign (git-ignored, not fgOS-owned) skill dir of the main checkout's skill roots, with no kit name and no glob on a vendor prefix; hardlink only if a probe proves it safe, else a real copy; a rerun never nests"
status: pending
depends_on: []
parallel: "group A; one line of .fgos/config.yaml; the config component and the owner machine own the file"
effort: ~0.5d
net_size: "Node 0 / Rust 0 / tests 0; config one line replaced (a recorded smoke is the proof, see Context)"
---

# Phase 10 - Worktree skill provisioning (Q5 owner correction, T8-24)

## Context

Owner decision 79 Q5 (owner correction of the arbitration's recommendation): "fgOS must not know any kit (no `ak-cook` naming); a worktree gets every foreign (git-ignored, non-fgOS) skill dir from the main checkout's skill roots, kit-agnostic, or the worktree breaks when another skill set is used; cheap copy (hardlink) if safe." The arbitration's option (a) (name `ak-cook` and nine skills it calls) is **withdrawn**: it hard-codes a kit. T8-24: the current line uses `cp -R`, which nests `ak-x/ak-x` on a rerun.

Today (`.fgos/config.yaml:257`, from `9fa8a08f0`): a shell line over `.claude/skills .agents/skills .omp/skills .pi/skills .grok/skills` copying `"$FGOS_REPO_ROOT/$d"/ak-*` with `cp -R`. It copies 8 759 files, 89 MB per worktree in 3.7 to 4.4 s (speed seat, load 41 and 98) from 104 vendor dirs, for an executor that declares one skill.

**Where the rule lives (decided here, RUL104).** The `worktreeSetup.commands` line, no Node change, because the config key can already express it: `runWorktreeSetupCommands` (`src/runner/worktree.mjs:143`) runs each line through the shell in the new worktree with `FGOS_REPO_ROOT` set to the main checkout, reading the command list from the main checkout's config (`:145-146`). The rule is expressible as: for each of the five host skill roots, for each directory directly under it in the main checkout, copy it when `git check-ignore` says it is ignored there and it is absent in the worktree. "Ignored" is exactly "not fgOS-owned": `.gitignore:68-79` ignores `/.claude/skills/*` and `/.agents/skills/*` and re-includes only the owned names (`fgos-*`, `distill`, `_shared`, `instruction-audit`), and P04 adds the one missing line and a test that keeps the allowlist equal to the owned set. No kit name appears, and the five roots are host directories, not kits. The code alternative (a default step in `provisionWorktree`, `worktree.mjs:224`) is a new default mechanism for every project and is **not** taken; say if the owner wants it (plan unresolved question 1).

**Why there is no test case.** `.fgos/config.yaml` is tracked but `skip-worktree` in every linked worktree (`git ls-files -v` prints `S`; the file is absent where tests run), so no test can read the real line. The proof is a recorded smoke run on a scratch clone (requirement 4); principle 8 is met by "no unit proof exists for project config; the behaviour has one recorded end-to-end proof".

Provisioning is recorded and reversible: `provisionWorktree` records every new untracked or ignored path (a file by digest) and `fgos worktree remove` takes back exactly those bytes (`setProvisionedAside`, `worktree.mjs:269`), so copied skill dirs leave with the worktree; a worker-edited copy stays and the port refuses, as it does today.

## Requirements

1. **Hardlink probe first (decision 79: "if safe", prove it).** On this machine, in a scratch directory under `/home/vantt/projects/forgent-worktrees/` (never `/tmp`), record: (a) `cp -al` source and target on the same filesystem, then an **in-place write** through the target (`echo x >> target/file`) and the source's bytes; (b) the same across two filesystems (the `EXDEV` failure and the fallback needed); (c) a replace-style write (write temp, rename) and the source's bytes; (d) one seat run in a scratch worktree with a hardlinked skill dir, asked to edit a file there with its own edit tool, then the source's bytes. **Rule:** hardlink is adopted only if no write path a worker uses changes the main checkout's file, and a cross-filesystem fallback exists in the same line. An in-place write (a) is the shell redirect every worker has, so the expected result is **not safe**; then the line copies for real (`cp -R`), the 8 759 files and 89 MB per worktree stay (3.7 to 4.4 s), and the report says so plainly. Either result is the phase's outcome, never a question back.
2. **The line.** One command string, kit-agnostic, idempotent: for each root, `[ -d "$FGOS_REPO_ROOT/$d" ] || continue`, `mkdir -p "$d"`, for each directory `n` under the main checkout's root: `git -C "$FGOS_REPO_ROOT" check-ignore -q -- "$d/$n"` (trailing-slash form too, so a directory-only pattern matches) and `[ -e "$d/$n" ]` absent, then copy (`cp -R`, or `cp -al ... || cp -R` only on a probe pass). Never `rm -rf` in the line: skipping a present target is what makes a rerun safe (the arbitration's "clear then `cp -RT`" is not needed and a destructive line in config is avoided). `true` at the end as today so an empty root is not a failure. The git call is an explicitly configured consumer command (`runWorktreeSetupCommands` marks it, `worktree.mjs:151`), so the one-door census is unaffected. The exact text is the lead's; it contains no `ak`, no vendor prefix, no skill name (`rg "\bak-" ` on the committed file returns nothing).
3. **Commit route (plan unresolved question 5).** Step 1 of the commit: name the route and have the big lead confirm it. `.fgos/config.yaml` is skip-worktree in linked worktrees and the main checkout carries 27 uncommitted local lines in it; the commit holds only the `worktreeSetup` hunk. Candidate routes: `fgos config patch`/`set worktreeSetup.commands` on a clean copy of the committed file placed where the config door can write it, then a temporary index (`git update-index --cacheinfo` with a blob from `git hash-object -w`) so the main checkout's local lines are never staged; the owner machine applies by `git pull` and then re-applies its local lines (the AgentKit-block precedent). Board line before the edit (the config component owns the file).
4. **Recorded smoke (the proof).** On a scratch clone with three foreign ignored skill dirs under three different roots (one with a name that is not `ak-`, one with a space-free but uncommon name) and the tracked owned skills: `fgos worktree create` (through `fgos run`'s door or the verb) -> all three foreign dirs present with the same bytes; no owned dir copied over its tracked checkout; `fgos worktree create` again at the same path (or the setup line run twice) -> no `x/x` nesting, no error; `fgos worktree remove ... --discard-ignored`-less removal takes the copies back (the provisioning record). Record time and bytes before and after (the arbitration's 3.7 to 4.4 s and 89 MB are the baseline; on this tree the copy keeps every foreign dir, so expect no size cut unless the probe passes and the hardlink is used).
5. **Net behaviour for projects that use another skill set:** nothing is named; a project with no ignored skill dirs copies nothing; a project with none of the roots skips them.

## Files

**Create:** none.

**Modify:** `.fgos/config.yaml` (the one `worktreeSetup.commands` entry), `CHANGELOG.md` (one line: new worktrees receive every ignored skill dir of the main checkout instead of dirs named by one vendor prefix).

**Delete:** the `ak-*` glob entry (replaced in place).

**Tests to retire:** none. Existing worktree-setup tests (`test/runner/worktree.test.mjs`, `test/runner/worktree-config-trust.test.mjs`, `test/verbs/worktree-create.test.mjs`) use fixture commands, not this line; run them as the regression set.

**Cross-lane one-liners:** none. Owner-machine guide section names the line and says `git pull` on forgentX and on `~/projects/forgent` on fg-server brings it.

## Net size

Config one line replaced; no Node, no Rust, no test change. Copy size per worktree is **unchanged on the expected (real-copy) result**: 8 759 files, 89 MB (the arbitration's 92 percent cut is gone with the correction). Ideas not taken: F-6 (derive from `supports.skills`: a new mechanism), F-7 (a size budget doctor row).

## Steps

1. Probe (requirement 1), recorded; decide `cp -al` or `cp -R`.
2. Name the commit route; board line; big lead confirms.
3. Write the line; smoke on a scratch clone (requirement 4); time and bytes.
4. Commit only the hunk; CHANGELOG; report with the probe transcript and the smoke output.

## Validation (focused)

- FR `test/runner/worktree.test.mjs test/runner/worktree-config-trust.test.mjs test/verbs/worktree-create.test.mjs test/verbs/worktree-remove.test.mjs` (regression; they must stay green).
- `git show HEAD:.fgos/config.yaml | rg "\bak-"` -> nothing. `fgos config check` -> no new finding.
- The recorded smoke. Land gate (the config file is read by the test suite's config fixtures, not this line).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Hardlink corrupts the main checkout's skill through a worker's in-place write | H x H | Probe first; the shell redirect case decides; real copy on any unsafe result |
| The line copies an ignored dir that holds secrets into every worktree | M x M | Same exposure class as today's `cp -R` of five roots (same user, same repo); only dirs directly under the five roots; stated in the guide (RT-8) |
| Committing the config file carries the owner's 27 local lines | M x H | Route confirmed by the big lead before the commit; `git diff --cached` read in full; the hunk only |
| `git check-ignore` is slow over 104 dirs at load | M x L | Measure in the smoke; 104 calls are about 1-2 ms each; report the time |
| A project without git at `FGOS_REPO_ROOT` | L x L | A worktree implies git; `check-ignore` failing means "not ignored", so nothing is copied |

## Rollback

Revert the commit; the owner machine and fg-server `git pull` and keep their local lines. A worktree already created keeps its copies (the provisioning record removes them with the worktree).

## Done when

Probe result and the chosen form recorded; the line contains no kit name; smoke shows foreign dirs copied, owned dirs untouched, rerun not nested, removal takes them back; commit holds only that hunk; owner-machine guide section written.

## Lead brief essentials

No kit name anywhere, in the line, the comment, the commit message or the report title. Prove or fall back; never ask. All plan.md lead rules apply.
