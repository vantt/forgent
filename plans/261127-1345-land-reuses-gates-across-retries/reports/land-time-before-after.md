# Land time before and after

Measured on fg-server, 2026-11-27.

## Before

From the land logs and step timings of 2026-11-27, before the change landed:
- One attempt took 2 to 5 minutes.
  - Each fresh candidate compiled 208 external and 61 workspace crates, in 40 to 60 s of build.
  - The census scan ran twice: once in regenerate, and again as a gate.
  - The seven gate test files took about 37 s.
- The regenerate step alone, in a checkout with no warm target, took 170 s.
- A successful land often took 15 to 30 minutes, because each "remote moved" retry ran every step again.

## After

- **Regenerate, in a fresh checkout against the shared target** (`.fgos/runtime/land/cargo-target`, 5.6 GB after the
  first lands): 89 s, with 0 external crates compiled, against 170 s before. Workspace crates still compile once
  per candidate, because the candidate's path is new each time.
- **The census scan** runs once per land; the duplicate gate is gone.
- **A retry after "remote moved"** reuses the passed gates whenever the trunk moved only outside every gate's `when`.
  Most trunk commits that day were plan and backlog files, so such a retry costs one merge and one push, not a whole
  attempt. The owning test is `a_retry_whose_trunk_moved_only_outside_every_gate_reuses_the_gates_it_passed_and_lands`.
- **A malformed plan** is refused at commit by the pre-commit hook, and at land by the first gate, in seconds.

## Not measured

A full land on a quiet trunk after the change, end to end: every land since has met other lands or recovery work on
the machine, so its wall time would not isolate this change.
