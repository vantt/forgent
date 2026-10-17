---
name: fgos-lock-fence
user-invocable: false
description: >-
  Recover from a registry lock a wedged process keeps, when fgos take/fgos
  pick/fgos approve fail with "lock-held" (exit 7) and the holder is not making
  progress. Use when a claim or merge is refused because another process
  holds the main checkout, a merge slot or the worktree-admin lock for
  longer than its work explains. Examples: "take failed with lock held",
  "claim refused: main checkout locked", "approve waits on a merge slot
  forever".
---

This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.
The real skill content lives at `../../../.agents/skills/fgos-lock-fence/SKILL.md`, an assembled projection whose generated header identifies its canonical source.
Read that file and follow it directly.
