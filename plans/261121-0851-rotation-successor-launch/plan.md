---
contract: plan-v1
title: "A pane send and launch wait out a foreground that is only briefly odd"
status: done
lead: lead:ROTATE2
base: 2996306e4e558baa1a9a183697ea782152705d46
priority: P1
footprint:
  - plans/261121-0851-rotation-successor-launch/**
  - packages/terminal-control/rust/src/core.rs
  - packages/terminal-control/rust/tests/core_failures.rs
  - packages/terminal-control/rust/tests/common/mod.rs
  - CHANGELOG.md
source:
  - p-re2cgxvfq5
created: 2026-11-21
---

# A pane send and launch wait out a foreground that is only briefly odd

## Outcome
A secretary rotation (and any head start) types its brief once the successor CLI is the pane's foreground, even when the CLI was caught at the instant its image was being replaced.

## Cause (proven)
Rotation 18 to 19 spawned pane w6:p1B2. The pane's foreground group held only the successor claude process (pid 1872258, state D), which the OS showed with no command line. The herdr driver files a process without argv as unlisted, so Core::send saw an empty foreground list, judged the pane a bare shell and refused once. The supervisor ended the attempt, and rotation ended no-answer after 120 s.
The fixture-project head failures seen the same morning are a separate cause: that project is not trusted in the person's claude config, so no onboarding seed is derived (documented behavior, not a defect).

A second variant (head generation 47 of the supervisor, 08:55) refused with `terminal-launch-not-started: pane foreground is not the shell`: `Core::launch` read the process info once more right after the shell proved it runs commands, and a transient foreground (the probe's child or a prompt hook) failed it.

## Acceptance criteria
1. A send whose pane lists only the shell but has an unlisted non-shell foreground pid re-reads the pane within the identify window and types once the program has a command line.
2. A pane that never shows a program is still refused with the same reason after the window.
3. A launch re-reads the pane for the identify window after the shell probe and types the launcher once the foreground is the bare shell; a refusal names what the pane answered.
4. `cargo test -p fgos-terminal-control --test core_failures` green; clippy clean for the crate.

## Non-goals
Trust seeding of untrusted projects; the supervisor's one-shot handling of a refused send.

## Phases
| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Send waits for a starting program | - | packages/terminal-control/rust/src/core.rs, packages/terminal-control/rust/tests/core_failures.rs, packages/terminal-control/rust/tests/common/mod.rs, CHANGELOG.md | 1 | done |

## Risks and rollback
A pane with a stuck unlisted process delays the refusal by the identify window (default of launchIdentifyTimeoutMs). Revert the commit.
