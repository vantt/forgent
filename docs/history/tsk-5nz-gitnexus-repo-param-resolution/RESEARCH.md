# Research: tsk-5nz — gitnexus repo-param resolution guidance is missing

## Round 1 — 2026-08-19 (discovery stage)

**Asked:** Is the durable, git-tracked fix location for "call `list_repos`
and match the exact repo identifier before retrying `impact`/`context`/etc.
when gitnexus errors with 'Multiple repositories indexed'" the local
`.claude/skills/gitnexus/*/SKILL.md` files, or somewhere else in this repo
that actually survives a `gitnexus analyze` re-run?

**Checked:**
- `git ls-files -- .claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
  (repo root) — empty output: this file is **not tracked** by git in
  forgentX.
- `.gitignore:53` — `/.claude/skills/*` ignores everything under
  `.claude/skills/`, with explicit un-ignore exceptions only for
  `!/.claude/skills/fgos-*/`, `!/.claude/skills/distill/`,
  `!/.claude/skills/_shared/`. No exception for `gitnexus`, confirming the
  ignore is deliberate, not an oversight that happens to also catch this
  directory.
- Worktree `tsk-5nz-7W7WXX`: `.claude/skills/gitnexus/` does not exist at
  all here (only in the main checkout) — direct evidence the directory is a
  local/untracked artifact, not something a fresh worktree checkout
  reproduces from git.
- `.gitnexus/run.cjs:293-300` (local copy dropped by `gitnexus analyze`
  itself, read directly) — its own comment: "This lets the **committed
  skills** and **generated** AGENTS.md/CLAUDE.md reference ONE stable,
  CLI-neutral command... `gitnexus analyze` drops a copy of this file at
  `.gitnexus/run.cjs`." This is the tool's own primary-source description
  of its regeneration boundary: it draws a line between skills (meant to be
  installed/regenerated per-consumer, matching the `.gitignore` exclusion
  found above) and the CLAUDE.md/AGENTS.md reference block (also
  generated).
- `CLAUDE.md` (repo root, read directly) — the "GitNexus — Code
  Intelligence" section (`Always Do`/`Never Do`/`Resources`/`CLI` table)
  is immediately preceded by this exact sentence: "The block below
  regenerates from GitNexus's own template on `gitnexus analyze`; edit this
  gate section when the policy changes, never the rules inside the block."
  This confirms in writing that even CLAUDE.md's own GitNexus block is
  tool-regenerated — only the "## Impact-analysis capability gate" prose
  ABOVE that block (the fgOS-authored capability-gate tiers: "0 providers
  registered" / "Registered but not present" / "present, freshly checked")
  is the hand-maintained, durable part of that file.

**Found:** `.claude/skills/gitnexus/*/SKILL.md` is a local/regenerated
artifact (untracked, gitignored, absent from a fresh worktree, and the
tool's own shipped comment in `.gitnexus/run.cjs` calls its skills
installed/regenerated). Editing those files directly would not survive the
next `gitnexus analyze` and would never reach another developer's machine
or CI — it would look like a fix while being silently discarded. The only
durable, git-tracked, hand-editable location in this repo for
gitnexus-usage policy prose is the "## Impact-analysis capability gate"
section of `CLAUDE.md` — everything at or below the "# GitNexus — Code
Intelligence" heading in that same file is regenerated and must not be
hand-edited for this purpose (confirmed by the file's own inline comment).

**Decided:** land the fix as a new rule inside CLAUDE.md's existing
"## Impact-analysis capability gate" section (above the regenerated
block) — a short paragraph instructing that on "Multiple repositories
indexed" or "Repository not found" from any gitnexus MCP tool
(`impact`/`context`/`explain`/`trace`/`pdg_query`), the agent must call
`list_repos` and match the exact registered `name` by `scanTarget`/
absolute project path before retrying, never reuse the error message's own
display string or guess a bare short name (which this session's own
reproduction showed resolves ambiguously across 3+ repos sharing the name
"forgent" on this machine). No change to `.claude/skills/gitnexus/*`
(regenerated, would not persist) and no change needed to
`.gitnexus/run.cjs` (already correctly describes the regeneration
boundary — it is not itself wrong).

**Remaining open:** none — the fix location and content are both fully
determined by direct evidence above, no product decision needed from a
person.

**Verify (real, runnable):**
```
grep -q "list_repos" CLAUDE.md && grep -q "Multiple repositories indexed" CLAUDE.md
```
(confirms the new rule text actually landed in CLAUDE.md's gate section,
not in the regenerated block or anywhere else.)
