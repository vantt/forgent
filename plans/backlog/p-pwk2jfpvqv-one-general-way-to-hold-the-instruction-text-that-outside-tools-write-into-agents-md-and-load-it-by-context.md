---
id: p-pwk2jfpvqv
title: "One general way to hold the instruction text that outside tools write into AGENTS.md or .claude/rules (AgentKit, GitNexus, MDView, any later tool) and load it by persona and context, so it is neither triplicated nor always loaded (context engine, priority P1; source: owner via Miu, 2026-11-28 16:1x)"
status: proposed
priority: P1
area: context-engine
created: 2026-11-28
---

# Why

The Agent Context Engine and the start-context composer govern only the fgOS rule block. Outside tools write instruction text of their own into the files agents read, and ACE does not touch it. Measured 2026-11-28 on this repo: AgentKit's rules are present three times, in `/home/vantt/projects/.claude/rules/` (16,867 bytes), in `.claude/rules/` (16,867 bytes, nearly identical) and as the `AGENTKIT-OMP` block of `AGENTS.md` (about 17 KB); GitNexus (2,902 bytes) and MDView (806 bytes) add blocks too. `AGENTS.md` grew from 48,855 to 54,833 bytes after the start-context slice, and is above Codex's 32 KiB limit. The owner's point: AgentKit is one case of a general problem for every tool that integrates by writing into AGENTS.md, so the answer must be general, not an AgentKit patch.

# Done when

- A general mechanism, decided in the discussion, that holds each outside tool's instruction text as data (source tool, version, digest, text unchanged) and selects what a given persona and context loads, through the same engine and compose door as the fgOS rules.
- An outside tool's installer or update re-running does not undo it: drift is detected by digest and reported or re-captured, never silently overwritten.
- The same text is loaded once per session, not once per file that happens to carry it.
- Selection only: the engine never edits an outside tool's text (the ASC rule), and a tool whose text cannot be selected stays whole, with its size shown in the start table.
- Measured: bytes and tokens of always-loaded text per persona before and after, per outside tool, in the start token table.

# Notes

Related: `p-yrhsr6wf7v` (render the fixed part of each start context to a file; load long rules by path), `p-oisgk74z6a` (measure the effect of ACE and ASC after release), plans `261125-1631-agent-context-engine` and `261122-1946-agent-start-context` (both done, in `rc.13`). Discussion: `ds-2la64d7syu`.
