---
name: distill
description: >-
  Set up and run a project-local reference-learning area: extract notable
  features from reference sources (git repos, papers, living docs) into
  per-source indexes with incremental cursors, compare across sources, and
  track porting decisions. Use when the user asks to learn from / analyze /
  scan a reference project or document, set up reference learning in a
  project, run a delta scan since the last analysis, triage the intake queue,
  or check the learning area's consistency. Not for porting or implementing
  the features themselves.
metadata:
  version: "0.1"
  ecosystem: forgent
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: scripts/distill.mjs automates init/delta/seal/check; without node the lifecycle still works manually.
    git:
      kind: command
      command: git
      missing_effect: degraded
      reason: git-repo sources need a local clone for delta computation.
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/distill/SKILL.md`, this project's own canonical skill source.
Read that file and follow it directly.
