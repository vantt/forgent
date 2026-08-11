# Canonical path resolver — plan

## Mode

**high-risk.** Flags counted against `docs/history/canonical-path-resolver/CONTEXT.md`'s
locked decisions:

- **public contracts** — `FGOS_NESTED_PREFIX` (D4) is read by 17
  `plugins/fgOS/skills/*/SKILL.md` templates and 1 spec
  (`docs/specs/fgos-plugin.md:167-168`; `docs/specs/distribution.md:287`'s
  `repo/bin/fgos.mjs` line is unrelated — setup/doctor dispatch, not this
  convention); the shell integration script is sourced from users' own
  `.bashrc`/`.zshrc`. Changing how any of these resolve is a contract
  change.
- **cross-platform** — D3 adds real Windows profile-path detection where
  none exists today.
- **existing covered behavior** — D2's scope replaces path-resolution code
  already exercised by `test/runner/session.test.mjs`,
  `test/runner/loop.test.mjs`, `test/runner/worker-log.test.mjs`, and
  `test/setup/shell-rc.test.mjs`.
- **multi-domain** — D1/D2 span `bin/` (CLI entry), `src/runner/`
  (session/loop/worker-log), `src/setup/` (shell-rc), `plugins/fgOS/skills/`
  (templates), and a new Claude Code SessionStart hook integration point
  outside this repo's own test harness.

4 flags → high-risk per the mode gate; no smaller mode honestly covers an
item that touches this many call sites and one brand-new platform surface
at once.

`fgos graph --json` shows `tsk-63j` in an isolated, size-1 component — no
existing dependency chain to defer to for ordering. Ordering below follows
technical dependency instead: everything downstream needs the resolver to
exist before it can be wired to it, so the resolver is the only piece that
unblocks the other three — the same shape a `topUnblock` comparison would
show once children exist.

## Approach

Build one resolver module (exact file location and export shape is an
implementation choice, deferred to whichever child item builds it — a
single function or a small object of path getters, not a class, not a
config file, per CONTEXT.md's pinned term). It reads `FGOS_NESTED_PREFIX`
(subsuming D4) plus whatever env vars the storage/skill root needs, and
exposes the paths D2 scoped: `.fgos` storage root, `.fgos/logs`,
`state.json`/`events.jsonl`, and the skill root. Every existing call site
that derives one of those paths independently switches to calling the
resolver instead of re-deriving it.

Alternatives rejected: leaving the four scattered `.fgos`-root getters
(`bin/fgos.mjs:61`, `src/runner/session.mjs:84`, `src/runner/loop.mjs:281`/`941`)
as-is and only adding Windows detection — rejected because it leaves D2's
"everything named" and D4's subsumption unmet, and does not remove the
actual drift risk (four independent getters can silently diverge; a fifth
one for Windows would only add a fifth).

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Resolver core + CLI wiring | medium — regression risk if the unified root diverges from any of the 4 existing getters under worktree/nested-repo layouts | `session.test.mjs`/`loop.test.mjs`/`worker-log.test.mjs` must be confirmed to actually exercise the replaced code paths post-migration, not just avoid touching them |
| Windows profile-path detection | low-medium — new code path, additive only, no existing platform regression risk | `shell-rc.test.mjs` gets a Windows-profile fixture/mock case exercising the new detection, mirroring the existing bash/zsh cases |
| Claude Code SessionStart hook wiring | medium-high — new integration surface outside this repo's own `npm test` harness; a broken hook could affect every session opening in this repo | confirm the hook degrades gracefully (session still starts if resolver injection fails) and has its own smoke-test/manual verification path, since no automated harness covers Claude Code hook execution today |
| ~~Skill-template migration~~ | dropped per D4-revised — no code/template touches this piece anymore | n/a |

## Shape — split into 4 pieces

`tsk-63j` is too wide to build as one honest piece (high-risk, 4 flags,
spans 4+ subsystems and a new platform). Splitting into 4 children, each
carrying `tsk-63j` as `parent`:

1. **Canonical path resolver core + CLI wiring** — build the resolver
   (subsumes `FGOS_NESTED_PREFIX` per D4) and switch `bin/fgos.mjs`,
   `bin/fgos-runner.mjs`, `src/runner/session.mjs`, `src/runner/loop.mjs`,
   and `src/runner/worker-log.mjs` off their independent `process.cwd()`-
   based getters onto it.
   verify: `node --test 'test/runner/session.test.mjs' 'test/runner/loop.test.mjs' 'test/runner/worker-log.test.mjs'`

2. **Windows shell-profile-path detection** — extend the resolver's
   profile-path check (today bash/zsh only, `src/setup/shell-rc.mjs`) to
   detect a Windows equivalent (e.g. PowerShell `$PROFILE`), per D3.
   Depends on piece 1.
   verify: `node --test 'test/setup/shell-rc.test.mjs'`

3. **Claude Code SessionStart hook wiring** — add the second entry point
   from D1: a SessionStart hook that calls the resolver and injects
   precomputed paths as session context/env. Depends on piece 1.
   verify: `npm test`

4. **Dropped per D4-revised.** The 17 `plugins/fgOS/skills/*/SKILL.md`
   templates (and `docs/specs/fgos-plugin.md:167-168`) keep their existing
   `FGOS_NESTED_PREFIX` shell-substitution pattern unchanged — empirically
   confirmed unreadable from an in-process JS resolver (zero JS hits for
   the variable; it resolves before Node starts). No migration needed;
   the resolver built in piece 1 just also parses the same variable name
   independently for its own JS-side needs.

Order: piece 1 first (unblocks 2, 3, 4); pieces 2–4 are independent of
each other once piece 1 lands and can proceed in any order.

## Execution

Per the locked decision that Execute and its own verify path (the engine's
goal-check, `return`'s re-verify of real progress) already work
mechanically, this plan does not redesign that — each piece above names
only the one command that proves it done.
