# tsk-2aa — plan

Mode: tiny

Lane-gate: 0 flags apply (no auth, no authorization, no data model, no
audit/security, no external-system change, no public contract, no
cross-platform, no existing covered behavior, no weak proof area, single
domain) — one file, one direct task.

## Approach

Per D1 (`docs/history/claude-code-hook-spawn-enoent/CONTEXT.md`), the only
deliverable is one markdown runbook:
`docs/how-to/recognize-a-claude-code-hook-spawn-enoent-failure.md` (path
locked as D2). No forgentX source file changes — scout in `CONTEXT.md`
already confirmed no call site in this repo owns the failing spawn path.

Content to write, following the existing sibling convention in
`docs/how-to/` (e.g.
`docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`):

- **Symptom** — the exact error text (`<Event> hook error ... ENOENT: no
  such file or directory, posix_spawn '/bin/sh'`), which events it hits
  (Stop, UserPromptSubmit, PreToolUse:Bash).
- **Why it's not a forgentX bug** — the affected hooks are declared in the
  user's global `~/.claude/settings.json`, not this repo's own
  `.claude/settings.json`; no `posix_spawn`/`spawnSync`/`execSync` call
  site in `src`/`bin`/`test` reaches this path.
- **How to confirm it's the harness, not a broken script** — re-run the
  failing hook command directly (e.g. `rtk hook claude`) outside the
  Claude Code hook harness; a clean exit confirms the script itself is
  fine.
- **Not to confuse with** — the repo's own unrelated prior
  `spawnSync git ENOENT` incidents (`docs/history/tsk-k8u/`,
  `docs/history/tsk-3lx/`), which had a different, already-fixed, in-repo
  cwd-resolution root cause.
- **What to do** — treat as non-blocking (the harness already reports it
  non-blocking and the underlying tool call still succeeds); no local
  workaround identified beyond waiting for the harness's own retry/next
  invocation.

No split — one honest piece of work.

## Proof surface

Verify (already recorded on the item, D2):

```
test -f docs/how-to/recognize-a-claude-code-hook-spawn-enoent-failure.md
```

Risk map: none — doc-only change, no code path touched, no regression
surface. impact-analysis capability gate checked in `CONTEXT.md` (GitNexus
present, posture `full`) but not load-bearing here — no blast radius to
assess for a new markdown file.

## Assumptions

- The runbook's exact prose/heading structure is left to
  `fgos-coding-implement` to write, following the cited sibling-doc
  convention — not material enough to lock as a separate `CONTEXT.md`
  decision (implementation detail, per `fgos-coding-exploring`'s own filter).
