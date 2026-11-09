---
phase: 03
title: "The .claude reference-file copies: one live probe of whether the host needs them, then drop the copy step (pass) or keep it under a byte-compare test (fail)"
status: landed
depends_on: ["probe step: none", "edit step: 02 landed", "fail branch also after 04 landed"]
parallel: "probe in group A (writes no file); edit in group C"
effort: ~0.5d (+ one seat run)
net_size: "pass: Node -20 / Rust 0 / tests -10, generated -3 393 lines (removed by P12); fail: Node 0 / tests +10"
---

# Phase 03 - The `.claude` reference copies (Q2)

## Context

Owner decision 79 Q2: "live probe first; pass -> drop the `.claude/skills` reference copies, fail -> keep them with a byte-compare test". Each `.claude/skills/<skill>/SKILL.md` is a 16-20 line wrapper pointing at `.agents/skills/<skill>/SKILL.md`; beside it `generateAllSkillWrappers` copies the skill's `references/` files (`skill-wrappers.mjs:226`, `copyDirRecursive(subSource, subTarget, keptCopy(keep))`). Tracked today: 29 non-`SKILL.md` files under `.claude/skills` except hand-authored `ui-spec` (`git ls-files .claude/skills | grep -v SKILL.md | grep -v ui-spec | wc -l`), 3 393 lines (arbitration count); no test compares them. The copies were added on purpose in `b91488318` (2026-08-19, "enable out-of-process dispatch for fgos-fanout"), possibly because a worker reads a reference by a path relative to the wrapper's directory. Nobody has checked what Claude Code does after following the wrapper's redirect.

Reused doors: `fgos run` (one read-only seat, no `--writes`); the wrapper `.claude/skills/fgos-fanout/SKILL.md` with its one reference `references/wave-dispatch-mechanics.md`.

## Requirements

1. **Probe (no file written, runs as soon as the phase starts).** Through the one dispatch door (`fgos dispatch decide --for judge` first, as AGENTS.md requires, then `fgos run "<prompt>" --provider <claude executor> --capability <read-only>`): a Claude seat loads the `fgos-fanout` wrapper, follows it, and must read `wave-dispatch-mechanics.md`. Record, from the seat's tool-call log, **the exact path it opened** and whether any relative-path open failed first. Run it once on the current tree (copies present) as a control and once on a scratch copy of the tree with `.claude/skills/fgos-fanout/references/` removed (ignored checkout path, under `/home/vantt/projects/forgent-worktrees/`, never `/tmp`).
2. **Pass rule (RT-4):** the seat, with the copy removed, opened `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` after following the wrapper, and never needed the missing relative path. Anything else (a relative open that failed then recovered by luck, a seat that skipped the reference, a seat that could not find it) is a **fail**. The control run must open the reference too, else the probe proves nothing and is rerun once; a second inconclusive control is `NEEDS_CONTEXT` to the big lead (the decision question template), never a guess.
3. **Pass branch (edit, after P02 lands).** Delete the reference copy step in `generateAllSkillWrappers` (`:226` and the sub-walk around it); a wrapper dir holds only `SKILL.md`. Replace the existing tests that assert the copies with one: "a wrapper dir holds only its SKILL.md". The orphan prune keeps removing a previously generated copy so the next render deletes the 29 files (P12 does the render). The Packaging contract line that says reference files are mirrored into `.claude` is corrected in P13.
4. **Fail branch (edit, after P02 and P04 landed).** Keep the copies. Add the byte comparison to `test/skills/fgos-mirror.test.mjs` (P04's file, append-only after P04): every non-`SKILL.md` file under `.agents/skills/<owned>/` equals its `.claude/skills/<owned>/` twin over `ownedFileSet`, and no extra file exists there. The fixed-point rule of P02 already removes stale copies. Node 0, tests +10. **No new question is asked on a fail** (decision 79: "fail -> keep with a byte-compare test").
5. **Report** the probe verbatim (prompt, executor, path opened, control result) in the phase report before choosing a branch; the branch is mechanical from requirement 2.

## Files

**Create:** none (the probe scratch tree is removed after the run).

**Modify:** pass: `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `CHANGELOG.md` (one line), census; fail: `test/skills/fgos-mirror.test.mjs` only.

**Delete:** pass: the copy step and its tests. The 29 tracked reference copies are deleted by the render in P12, not here.

**Tests to retire:** pass: the tests that assert `.claude` reference copies exist (named in the report with the owner "behaviour removed; `a wrapper dir holds only SKILL.md`"). Fail: none.

**Cross-lane one-liners:** none.

## Net size

Pass: Node about -20, tests about -10, generated about -3 393 lines (P12). Fail: tests +10, nothing else. Both below zero for the layer.

## Steps

1. Probe (control, then without copies); record the path; branch.
2. Wait for P02 on `origin/main` (and P04 on the fail branch); rebase.
3. Edit, test, CHANGELOG, census.
4. Report; the probe transcript is part of it.

## Validation (focused)

- Pass: FR `test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
- Fail: FR `test/skills/fgos-mirror.test.mjs`
- Full land gate on the edit step. The probe has no land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A one-off probe passes by luck | M x M | Control run must read the reference; the pass rule requires the exact path; a doubtful result is a fail (keep and byte-test), the cheap branch |
| Removing the copies breaks a worker of `fgos-fanout` that the probe does not exercise | L x H | The probe uses the very skill the copies were added for; the fail branch is chosen on any doubt |
| Probe cost (a seat run at load 28-40) | M x L | One seat, read-only; announce on the board before running |

## Rollback

Revert the edit commit; a render regenerates the copies. Nothing else depends on them.

## Done when

Probe recorded; branch taken mechanically; the passing branch leaves no `.claude` reference copy for the next render to write, or the failing branch has the byte test green; guide section says which branch was taken and what the user sees.

## Lead brief essentials

Probe first, write no file; the branch is decided by the stated rule, not by preference. All plan.md lead rules apply.
