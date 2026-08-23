# plugin skill packaging audit — research

## Round 1 — 2026-08-12 (tsk-2qg discovery)

**Asked:** (a) full, grep-verified list of skill names dispatched from
`plugins/fgOS/skills/*/SKILL.md` via the `Skill` tool but with no
corresponding directory under `plugins/fgOS/skills/`; (b) does the repo's
own distribution/plugin architecture already define a documented split
between "plugin-packaged skill" and "project-local dev-skill" that would
make this gap intentional rather than a bug.

**Checked:**
- `grep -rhoE '`fgos-[a-z0-9-]+`' plugins/fgOS/skills/*/SKILL.md` vs
  `ls plugins/fgOS/skills/` vs `ls .claude/skills/ | grep '^fgos-'`.
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` and `plan.md` (found
  via `grep -rln 'fgos-unlock' docs/`).
- `node bin/fgos.mjs show tsk-d3c --json` for the item's real final state.
- `git log -1 --date=short 1e14290` + `git merge-base --is-ancestor
  1e14290 HEAD` to confirm the fix commit is merged and dated.
- `grep -rln 'mdview' docs/ src/` and `find .claude/skills plugins -iname
  '*mdview*'` — zero hits anywhere in this repo.

**Found:**

1. **The dispatch-name list.** 12 real skill names are referenced by name
   from `plugins/fgOS/skills/*/SKILL.md` (`fgos-clarifying`,
   `fgos-coding-compounding`, `-discovering`, `-driving`, `-exploring`,
   `-implement`, `-planning`, `-shaping`, `-validating`, `fgos-fanout`,
   `fgos-researching`, `fgos-routing`) — all 12 exist as flat directories
   under `.claude/skills/`, none exist under `plugins/fgOS/skills/`.
   `fgos-runner` is also mentioned but is the CLI/daemon (`src/runner/`),
   never a skill. `fgos-indexing` and `fgos-unlock` exist under
   `.claude/skills/` but are never referenced from `plugins/fgOS/skills/`
   at all (their own callers are elsewhere, e.g.
   `fgos-coding-compounding` calls `fgos-indexing` directly).

2. **This exact class of bug was already investigated and fixed —
   `tsk-d3c`, status `done`, docs at
   `docs/history/fgos-skill-discovery-gap/{CONTEXT,plan}.md`.**
   - D1 (locked decision): *"Do not duplicate the 9 `fgos/*` skills into
     `plugins/fgOS/skills/*` as a first move... the original hypothesis
     this item shipped with ('dotdir skills need plugin registration') is
     contradicted by scout evidence."* Plan.md's own "Rejected
     alternative" section repeats this explicitly: *"duplicating the 9
     skills into `plugins/fgOS/skills/*` was rejected because it doubles
     maintenance of routing-critical text and never tests the collision
     hypothesis."*
   - D2: the case-fold-collision hypothesis (`plugins/fgOS/` vs
     `.claude/skills/fgos/`) was tested via a real rename and disproven —
     reverted.
   - D3: real root cause found via controlled A/B probe —
     **`.claude/skills/` project-skill scan is flat-only, one level, no
     recursion.** Skills nested two levels deep
     (`.claude/skills/fgos/<name>/SKILL.md`) were invisible to `Skill()`
     for that reason alone, independent of plugin/namespace.
   - D4: the fix — flatten every skill to
     `.claude/skills/<name>/SKILL.md` (no shared parent dir) — shipped as
     commit `1e14290` (2026-07-29), confirmed working end-to-end in a
     **fresh session, inside a worktree**, `npm test` 1641/1641 green.
     `git merge-base --is-ancestor 1e14290 HEAD` confirms this commit is
     an ancestor of today's `main` — the fix is live, not stranded on an
     unmerged branch.
   - This session's own experience confirms D4 still holds: three flat
     dev-skills (`fgos-coding-driving`, `fgos-coding-discovering`,
     `fgos-researching`) all loaded successfully via the `Skill` tool
     from inside a `.claude/worktrees/tsk-2qg-*` worktree, same shape
     `tsk-d3c`'s own final proof used.

3. **`mdview` is not a repo concept at all.** Zero hits for `mdview`
   anywhere under `docs/`, `src/`, `.claude/skills/`, or `plugins/` in
   this repo. It is a Claude-Code-side skill/tool
   (`markdown-novel-viewer` / `mdview` in this session's own available-
   skills and deferred-tools listings) that spawns its own session
   context to render a markdown file — not something forgentX defines,
   registers, or controls. `fgos-skill-discovery-gap/CONTEXT.md`'s own
   "Deferred / out of scope" section already named this exact class of
   question: *"Whether the eventual fix lives entirely in this repo... or
   is actually a Claude Code harness behavior this repo cannot control on
   its own is left open."*

**Still open (real gap, not resolved by the above):**

- Whether the specific "mdview session can't load `fgos-coding-driving`"
  report is (a) stale — observed before commit `1e14290` landed
  (2026-07-29) or against an unflattened checkout, and no longer
  reproducible today, or (b) a *different*, still-open root cause: an
  mdview-spawned session context that skips the standard project-skill
  scan entirely (a harness/session-type gap, not a directory-shape gap —
  `tsk-d3c`'s own fix only ever addressed directory nesting depth, never
  session-type/bootstrap differences). No evidence gathered this round
  either confirms or rules out (b); reproducing it requires an actual
  mdview-spawned session, which this discovery pass does not have access
  to.
- If (b) is real, the fix direction is unknown and does **not** default
  to "package into `plugins/fgOS/skills/`" — that exact move was already
  evaluated and rejected by `tsk-d3c` D1 for the general case, and
  nothing found this round distinguishes the mdview case from the general
  case enough to reopen that rejection.
