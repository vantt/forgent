# Start token table

Measured on fg-server on 2026-11-27, on branch `agent-start-context/p09` (main plus phase 9). Tokens ≈ bytes / 4, the
same measure as `before-bytes.md`.

## How it was measured

- **Before:** each opening is its phase-4 golden (`packages/agent-start-context/goldens/opening/`), plus AGENTS.md as
  it was on main before phase 9 (61,705 bytes).
- **After:** each opening is composed by `fgos internal start-context compose` on this tree, plus AGENTS.md after
  phase 9 (48,855 bytes). The record column names each start's `fgos.start.context` record.
- **The heads were not started as live sessions.** Phase 11 step 2 asks for live starts, but on this machine a live
  secretary or supervisor would run beside the machinery that already runs; it could act on its own. A door call
  composes the same text from the same facts and writes the same record.
- **Handoff rows:** the "before" opening includes the fixture handoff text that phase 7 added to those goldens. The
  "after" opening has no lineage, so the contributor adds nothing. The difference therefore understates the saving
  by that fixture's size.

## Heads

| Start | Opening before | Opening after | Start before (with AGENTS.md) | Start after | Net bytes | Net ~tokens | Record |
|---|---:|---:|---:|---:|---:|---:|---|
| head secretary (plain) | 3,193 | 15,388 | 64,898 | 64,243 | -655 | ~-164 | rnd:dad03430888ac7bd1cb422e0b83a7d3a |
| head secretary (handoff) | 3,481 | 15,540 | 65,186 | 64,395 | -791 | ~-198 | rnd:8e900bde9e6b8382d203ec96ee408c2a |
| head supervisor (plain) | 2,747 | 14,942 | 64,452 | 63,797 | -655 | ~-164 | rnd:f4f9b1c3d596d2a8439a1ffd55c4c2c9 |
| head supervisor (handoff) | 3,035 | 15,094 | 64,740 | 63,949 | -791 | ~-198 | rnd:539acbc0f8097bfe67e4e1da330a4009 |
| head shaper (plain) | 1,877 | 14,072 | 63,582 | 62,927 | -655 | ~-164 | rnd:cb75f98626c25e15b45310afc3b273f4 |
| head shaper (handoff) | 2,165 | 14,224 | 63,870 | 63,079 | -791 | ~-198 | rnd:3bc5ef7378d6f8031298dc16baada85e |
| head planner (plain) | 1,830 | 14,025 | 63,535 | 62,880 | -655 | ~-164 | rnd:8d4e1058e219816fb408e0cfe160a023 |
| head planner (handoff) | 2,118 | 14,177 | 63,823 | 63,032 | -791 | ~-198 | rnd:61fe5f8dd2d39f5fe8910d7611b49521 |
| head lead (plain) | 1,935 | 14,130 | 63,640 | 62,985 | -655 | ~-164 | rnd:4a081e2c4ef3be7b20f9c7ae545db488 |
| head lead (handoff) | 2,223 | 14,282 | 63,928 | 63,137 | -791 | ~-198 | rnd:4f545ff2c442aaa12bf883bc7c0e0b1b |

## Workers

| Start | Prompt before | Prompt after | AGENTS.md before | AGENTS.md after | Net bytes | Net ~tokens |
|---|---|---|---:|---:|---:|---:|
| every worker operation (every role task, `-p` and terminal brief) | as rendered | unchanged (the persona block moved to the composer byte for byte, `section_tests`) | 61,705 | 48,855 | -12,850 | ~-3,212 |

## Unchanged lines

These do not change, and are not counted in the net columns above:
- the external blocks of AGENTS.md (MDView, GitNexus, AgentKit);
- CLAUDE.md (505 bytes);
- `.claude/rules/*.md` (16,867 bytes).

The whole AGENTS.md is still above Codex's 32 KiB, because of those external blocks.

## Reading it

- A head's opening grows by about 12 KB: the six orchestration rules (dispatch, capability routing, run door, driver
  discipline, domain doctrine read, gateway) now come in it. AGENTS.md shrinks by the same rules, so each head start
  is about 650 bytes smaller net. Those rules are also in one place now, not two.
- Every worker start, and every session that reads only AGENTS.md, reads 12,850 bytes (about 3,200 tokens) less.
