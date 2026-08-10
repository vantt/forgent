# Plan: add --dir to all 10 read-verb plugin skills

Item: `tsk-2ew`. Mode: **small** — 10 files, one repeated mechanical
pattern already proven correct in 13 sibling files, no design question,
no split.

## Approach

For each of `list`, `ready`, `triage`, `show`, `stale`, `rollup`, `graph`,
`check`, `conflicts`, `merge-list` (`plugins/fgOS/skills/<name>/SKILL.md`):

1. Append `--dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"`
   to every `node "$FGOS_BIN" <verb> ...` line and its paired
   `fgos <verb> ...` PATH-fallback line — `pick/SKILL.md`'s own existing
   lines are the byte-for-byte template.
2. Add a short prose note (mirroring `pick/SKILL.md`'s own `--dir`
   paragraph, trimmed to what a read-verb actually needs — no claim-
   chaining rationale, just ADR0020's worktree-never-carries-`.fgos/`
   fact) explaining why `--dir` is here now.

No test file exercises these plugin-skill markdown files directly (they
are prose read by a session, not executable code) — `test/skills/fgos-
mirror.test.mjs` only covers `.claude/skills/**`↔`.agents/skills/**`
byte-identity, which doesn't apply here per `CONTEXT.md` D2. Verify is a
grep-based structural proof instead (below), consistent with how this
report's own evidence was gathered.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| 10 files, `--dir` insertion | low — mechanical, pattern already proven in 13 sibling files | `grep -c -- "--dir"` on all 10 files, before (0 each) and after (>=1 each) |
| No behavior change for main-checkout sessions | low | `${CLAUDE_PROJECT_DIR}` resolves to the main checkout in the common case too (same as every write-verb skill already does) — `--dir` there is a no-op, exactly `pick/SKILL.md`'s own documented case |

Impact-analysis posture: `degraded` — `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present` (checked
directly; "0 providers registered" is the only case that's honestly
`inactive`, and that's not this one). Its index is stale regardless
(reported behind current HEAD throughout this session). Moot for this
specific change either way: these are markdown prose files, not code
GitNexus indexes at all (its own repo-context resource lists only `.mjs`
symbols and processes; no plugin-skill markdown file has ever appeared in
a GitNexus query this session) — no blast-radius tool has anything to say
about this file type regardless of index freshness.

## Outstanding questions

None
