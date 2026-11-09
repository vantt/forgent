---
title: "HARDEN T8 phase 03 probe: does a Claude seat need the .claude reference copies?"
date: 2026-11-09
verdict: PASS
---

# Verdict: PASS (the `.claude/skills/<skill>/references/` copies can go)

Question (owner decision 79 Q2): does a worker that loads a `.claude/skills/<skill>/SKILL.md` wrapper still work with no `references/` copy beside it? Probe skill: `fgos-fanout`, the skill the copies were added for in `b91488318`. Its real SKILL.md names `references/wave-dispatch-mechanics.md` three times.

## Method

- `fgos dispatch decide claude --has-live-task-access --json` returned `mechanism: out-of-process`, executor `claude` (the `--for judge` purpose named in the phase file is not a registered capability on this tree; `--for investigate` binds to gemini, so the executor was named directly).
- Two detached scratch worktrees from `origin/main` `121686e1a` under `/home/vantt/projects/forgent-worktrees/`:
  - `t8-p03-probe-ctl`: untouched (copies present), the control.
  - `t8-p03-probe-nocopy`: `.claude/skills/fgos-fanout/references/` deleted (the run's `evidence.json` records it as the only dirty path); `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` present.
- One read-only seat each: `fgos run "<prompt>" --provider claude --capability investigate --worktree <wt> --json` (no `--writes`, claude-cli-bwrap confinement, herdr pane).
- Prompt: open `.claude/skills/fgos-fanout/SKILL.md`, follow its redirect, open the reference SKILL.md names "as a normal user of the skill would, using the path the skill text gives you", then report the absolute path of every open attempt (OK or FAILED, including failures before the right path) and the reference's first heading.
- A first no-copy run (unit-run-1794205126398-ff1ce6cf) gave the same result with a less strict report; the rerun below asked for absolute paths.

## Evidence (seat reports, `outbox/report-1.md` of each run)

No-copy run `unit-run-1794205225745-eceee2f8`, outcome pass, files opened in order:

1. `.../t8-p03-probe-nocopy/.claude/skills/fgos-fanout/SKILL.md` OK (wrapper)
2. `.../t8-p03-probe-nocopy/.agents/skills/fgos-fanout/SKILL.md` OK (wrapper redirect target)
3. `.../t8-p03-probe-nocopy/.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` OK, first heading `# Wave dispatch mechanics`
4. `.../t8-p03-probe-nocopy/.claude/skills/fgos-fanout/references` FAILED (`ls`, directory does not exist). This was a check made after the successful read, not a read the seat needed; no relative open failed before the reference was found.

Control run `unit-run-1794205225855-c4bfda4d`, outcome pass: the same three opens, all OK, no failed attempt, same heading.

Both read-only (`changedFiles: []`, git before equals after).

## Why this meets the pass rule

The phase's rule: with the copy removed the seat opened `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` after following the wrapper and never needed the missing relative path. It did, and the control read the reference too, so the probe discriminates. The mechanism is plain: the wrapper says "the real skill lives at `../../../.agents/skills/fgos-fanout/SKILL.md`", and the `references/...` path in that SKILL.md is read relative to the real skill's directory, which is where the file exists. Nothing in a reference-reading flow resolves against the wrapper directory.

## Limits (stated, not hidden)

- The tool-call log of the seat is not recoverable: the bwrap seat's `HOME` is a per-dispatch directory under `/tmp/fgos-confinement/` removed at run end. The open list is the seat's own report, asked for with absolute paths and failure marking, plus the checkout state recorded by the runner (`evidence.json`). It is consistent in two independent runs and with the file layout, but it is a report, not a trace.
- One skill, one Claude seat shape (claude-cli-bwrap through herdr), two runs. Other hosts (a Claude Code interactive session that loads the wrapper as a skill) were not exercised; the redirect text is the same for them. The phase's risk table accepts this: a doubtful result keeps the copies; this one is not doubtful for the skill the copies were made for.
- The other 28 copied files belong to other skills; they follow the same wrapper-to-`.agents` redirect, but only `fgos-fanout` was run.

## Branch to take

Pass branch of phase 03 (delete the copy step in `generateAllSkillWrappers`, one test "a wrapper dir holds only its SKILL.md", orphan prune removes old copies, render in P12). No question to the owner.

## Cleanup

Both scratch worktrees removed with `fgos worktree remove ... --delivered-to origin/main --discard-ignored`; `git worktree list` shows neither. Run records stay under `.fgos/assignments/unit-run-1794205225745-eceee2f8/` and `unit-run-1794205225855-c4bfda4d/`.
