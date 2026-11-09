---
name: instruction-audit
description: >-
  Periodically audit a repository's agent instruction surface and its
  enforcement so coding agents get the smallest, sharpest, non-duplicated set
  of rules, and every rule that matters is backed by a mechanical check. Scans
  what each agent runtime (Claude Code, AGENTS.md readers such as Codex and
  omp/pi, Gemini, Cursor, Copilot) loads on every turn, finds content loaded
  twice, installer-written blocks, stale hand-copied projections, duplicate or
  broken hook registrations, rules with no check, and mines git history for
  duplicated code and unfinished migrations to find which missing rule or
  check let them in. Produces a ranked, evidence-linked report and a delta
  against the previous run. Use when the user asks to audit, clean up, or
  improve CLAUDE.md / AGENTS.md / rules / hooks, asks why agents keep
  ignoring a rule or keep generating duplicate code, after installing or
  upgrading an agent kit or tool that writes into instruction files, or on a
  periodic schedule. Read-only: it proposes changes, it does not apply them.
metadata:
  version: "0.1"
  ecosystem: forgent
  # Outside the fgOS product one-door boundary (Git spec §12): its own git calls are a named class.
  oneDoor: standalone
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: scripts/instruction-audit.mjs does the mechanical scan; without node the lanes measure by hand.
    git:
      kind: command
      command: git
      missing_effect: degraded
      reason: the forensics lane and git-ignored hook detection need git history.
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/instruction-audit/SKILL.md`, an assembled projection whose generated header identifies its canonical source.
Read that file and follow it directly.
