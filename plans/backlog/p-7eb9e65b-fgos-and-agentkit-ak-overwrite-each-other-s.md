---
id: p-7eb9e65b
title: fgOS and AgentKit (`ak`) overwrite each other's registrations
status: proposed
priority: P2
area: general
created: 2026-10-16
---

# Why

Observed 2026-10-16 in this repo: installing the `ak` engineer kit for both `claude-code` and `omp` targets wrote the same rule set into `.claude/rules/*.md` and into an `AGENTKIT-OMP` block in `AGENTS.md` (read twice by Claude through `@AGENTS.md`, about 17 KB), and re-appended about 19 hooks into `.claude/settings.json` in its raw form next to the guarded form fgOS had rewritten them to (commit `036884908`), so each hook fires twice; `statusLine` points at paths that do not exist. Cause: two installers each assume they own `settings.json` and the instruction files, and each compares hook commands by exact string. Related doctrine: `docs/platform/coexistence/spec.md` (territory, one conductor per session, Known Gaps). **2026-10-20 (owner machine, `forgentx-95`):** reinstalling ak for codex/omp/pi/grok again injected a 367-line `AGENTKIT-OMP:START:engineer` block into `AGENTS.md` (uncommitted; it blocked pulling main, so it was saved to `.fgos/runtime/config-backup-261020-1200/AGENTS.md.agentkit-omp-block.patch` and `AGENTS.md` restored). The same 8 rules also land in `.omp/rules/`, `.pi/rules/ak-engineer-*`, `.grok/rules/`, `.claude/rules/`. Measured: an omp worker (`unit-run-1792485257960-9c944a90`) loads only `AGENTS.md`; it does **not** load `.omp/rules/*` (no load condition), so without the block omp runs without the ak rules, with the block Claude reads them twice. Separately fixed today: `assembleSkills` no longer prunes third-party `.agents/skills` (COOK P4). **2026-11-17 (measured, `docs/discussions/secretary-miu/DISCUSSION.md` point 4):** a Claude session in the main checkout loads the eight rules three times, about 17 KB each: `~/projects/.claude/rules/*.md`, the untracked `forgent/.claude/rules/*.md`, and the `AGENTKIT-OMP` block in `AGENTS.md`; a linked worktree loads two. Options: (A) one copy per CLI, Claude not reading the omp/codex block; (B) stopgap, drop the untracked `forgent/.claude/rules`. Also recorded as an observed problem for the H3 Agent Context Engine (`docs/platform/proposals/documentation-system-unification.md` section 4.7.2). Owner 15:42: handle in a separate session (INS lane; waits on the owner decision whether the 10-06 rule "do not modify ak/ck files" still holds and how to stay under codex's 32 KiB instruction limit).

# Done when

A written ownership contract between fgOS and other kit installers: each tool owns named files or marked blocks (e.g. fgOS hooks in `.claude/settings.json`, kit hooks in `.claude/settings.local.json` or a kit-owned block), neither rewrites the other's entries, and hook identity is the script path, not the command string; `fgos doctor` reports duplicate hook registrations and instruction blocks loaded twice (reuse `core/skills/instruction-audit/scripts/instruction-audit.mjs` logic) and `--fix` removes only fgOS's own duplicates; `docs/platform/coexistence/spec.md` Known Gaps updated; re-running `ak kit install` and `fgos setup` in either order leaves no duplicates (test)

# Notes

Migrated from the legacy backlog table. Original status: proposed.

2026-11-25: the owner chose to handle the rules loaded three times here, apart from the ASC plan (`plans/261122-1946-agent-start-context`, which keeps external blocks out of scope by ASC-D2). Measured at d72117393: the `AGENTKIT-OMP:engineer` block in `AGENTS.md` is 16,953 B (lines 453-818), and the project and global `.claude/rules` copies are about 18 KB each, so a Claude Code start carries about 35 KB (about 9k tokens) of repeated rule text. The same problem is the observed problem of the Agent Context Engine in `docs/platform/proposals/documentation-system-unification.md` §4.7.2. The fix touches only fgOS-owned surfaces, never AgentKit's installer or the global files. Also found: a stray `<!-- mdview:START -->` at `AGENTS.md:232` with no matching end, before the fgOS impact-analysis gate, so an MDView reinstall that rewrites from the first start marker could replace that gate.
