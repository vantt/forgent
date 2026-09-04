---
authoritative_for: out-of-process worker prompts (worker-prompt-skill-pointer.txt, worker-prompt-default.txt) never stating the [DONE]/[BLOCKED] completion-signal requirement inline, reachable only through a 3-hop file redirect, causing real correct work to return outcome:unsignaled — confirmed live 4 times (tsk-2ux, tsk-2tmk, plus the 2 coding-worker-contract.md already documented)
---

# The completion-signal instruction was three file-hops away from the worker that needed to read it

`tsk-3km` fixed a reliability gap: `worker-prompt-skill-pointer.txt` and
`worker-prompt-default.txt` (the real prompt templates rendered for an
out-of-process worker) never stated the `[DONE]`/`[BLOCKED]`
completion-signal requirement directly. The instruction only reached a
headless worker through a 3-hop file redirect chain: the prompt's
`{skillPath}` → `.claude/skills/fgos-coding-implement/SKILL.md` (a thin
wrapper) → `.agents/skills/fgos-coding-implement/SKILL.md` →
`../_shared/coding-worker-contract.md`. Only `worker-prompt-discovery.txt`
was self-contained for this — its own "How to finish" section is written
directly into that template.

## Confirmed live 4 times, 2 distinct root causes

`coding-worker-contract.md` already documented two prior instances of
workers not signaling completion correctly:

- `tsk-1dsr` — a git permission denial case,
- `tsk-5gd` — a backtick-quoted `[DONE]` false positive (a parsing bug,
  already fixed).

This item added a third, independent root cause — the instruction never
reaching the worker's context at all in a one-shot headless dispatch, not a
parsing bug — confirmed twice more before the fix landed:

- **`tsk-2ux`** (2026-08-23) — a real, correct dispatch (`agy`/gemini,
  commit `f1643e39`, correct diff, 309/309 tests passed) still returned
  `outcome: 'unsignaled'`, no `[DONE]` token anywhere in stdout, forcing
  driver-side git forensics instead of trusting the signal.
- **`tsk-2tmk`**'s own Implement-step dispatch — same executor, same
  prompt template family, real correct work landed and committed (commit
  `cbc96fb3`), still no `[DONE]` token — confirming the pattern before
  this item even reached planning.

Both new occurrences share the same signature: no token at all, not a
quoting/parsing miss like `tsk-5gd`.

## What shipped

A new `# How to finish` section was added directly to both
`worker-prompt-skill-pointer.txt` and `worker-prompt-default.txt`,
mirroring `worker-prompt-discovery.txt`'s already-self-contained structural
pattern and worded per `coding-worker-contract.md`'s own Layer 1 rule 4. It
states the `[DONE]`/`[BLOCKED]` literal-token requirement inline, placed
after `# Worktree boundary` and before `# Expected proof`, so the worker
never has to resolve the 3-hop redirect chain just to learn how to signal
completion:

```
# How to finish
Report your completion status through a fixed token in your output — your
caller reads this token mechanically, not free prose:

- `[DONE]` — the work described in your boundary is complete and committed on
  this branch.
- `[BLOCKED] <exactly what's missing or what stopped you>` — you cannot proceed
  because required context is missing, a file is outside your boundary, or a
  real mid-work blocker stopped you. Never leave this bare.

Exiting without printing either token is not a valid end state — your caller
has nothing mechanical to read and will treat your outcome as unsignaled.
```

The two byte-for-byte golden-render assertions in
`test/runner/prompt-templates.test.mjs` were updated to match.

## Related, not duplicated

[`tsk-3ys`](worker-prompt-iron-law-evidence-timing.md) landed on the same
two template files around the same time (adding an Iron Law evidence
section), and this item explicitly depends on it — both close inline-content
gaps in the same out-of-process worker-prompt templates, but for two
independent obligations (Iron Law evidence vs. completion signaling).
