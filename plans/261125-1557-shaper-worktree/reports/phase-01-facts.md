# Phase 01 facts: Launch a head inside a linked worktree

Step 1 of Phase 1 (`plans/261125-1557-shaper-worktree/phase-01-launch-in-worktree.md`).

## Inventory of `request.project_root` in `apps/fgos/src/wiring/unit_run_host/session_attempt.rs`

Every use of `request.project_root` in `session_attempt.rs` (and associated request fields) was audited and classified:

### 1. "The working checkout" (uses redirected to `workdir` when present)

- **Attempt cwd (`HostSessionDriver::open_attempt`)**:
  - Code: `cwd: self.request.project_root.to_string_lossy().into_owned()` (line 353).
  - Purpose: Working directory for the attempt process.
  - Classification: **"The working checkout"**. When `workdir` is set, `attempt.cwd` must point to the linked worktree instead of the project root.
- **Seat launch cwd (`HostSessionDriver::prepare_seat` -> `prepare_pane`)**:
  - Code: In `terminal.rs`, `OpenRequest` takes `cwd: attempt.cwd.to_string_lossy().into_owned()` (lines 409, 1152 in `round.rs`).
  - Purpose: Working directory of the new pane's shell in terminal/tmux.
  - Classification: **"The working checkout"**. Since `attempt.cwd` is set in `open_attempt`, routing `attempt.cwd` to `workdir` automatically configures the seat launch cwd to the linked worktree.
- **Sandbox context root (`HostSessionDriver::prepare_seat` -> `SeatInput.repo_root`)**:
  - Code: `repo_root: root` passed into `SeatInput` (line 493).
  - Purpose: Sets `context.repoRoot` in the confinement request (line 272 of `seat.rs`), which the policy resolver uses to resolve `workspace-paths` and writable directory binds (line 516 of `resolver.rs`).
  - Classification: **"The working checkout"**. Must resolve to the linked worktree so that `workspace-paths` (such as `plans/discussions/<topic>`) resolve against the worktree, leaving the main checkout untouched.

### 2. "The project" (uses that remain `request.project_root`)

- **`.fgos` directory (`HostSessionDriver::new` and `launch_session`)**:
  - Code: `fgos_dir: super::machine::fgos_dir(&request.project_root)` (lines 329, 597).
  - Purpose: Identifies the project's `.fgos` directory.
  - Classification: **"The project"**. Platform state, run assignments, and session telemetry remain centrally located in the project root's `.fgos/`.
- **Attempt locks' assignment directory (`HostSessionDriver::acquire_locks`)**:
  - Code: `let assignment_dir = self.fgos_dir.join("assignments").join(&self.request.key)` and `AttemptLockRequest { fgos_dir: &self.fgos_dir, assignment_dir: &assignment_dir, cwd: &self.request.project_root, ... }` (lines 370-380).
  - Purpose: Acquires read-only attempt lock within the project's assignments store.
  - Classification: **"The project"**. Stays in the project root's assignments directory.
- **Account lease `repo_root` (`HostSessionDriver::lease_account`)**:
  - Code: `repo_root: &self.request.project_root` in `LeaseRequest` (line 410).
  - Purpose: Scopes LLM provider account leasing and quota tracking.
  - Classification: **"The project"**. The account lease is taken on behalf of the project, not an ephemeral worktree.
- **Runner config and launch settings (`HostSessionDriver::prepare_seat`)**:
  - Code: `let settings = self.exec.launch_settings(root)` and `crate::wiring::doctor::terminal::project_retain_failed_pane_ms(root)` (lines 458, 475).
  - Purpose: Loads the project-wide runner configuration and execution settings.
  - Classification: **"The project"**. Config files (`runner.yaml`, etc.) reside in the project root.
- **Project terminal routing (`SessionSeatPorts::prepare_pane` -> `SeatInput.root`)**:
  - Code: `SeatInput.root` (line 478) and `HerdrRoute::of_project(ask.seat.root)` (line 266).
  - Purpose: Herdr route configuration and terminal project routing.
  - Classification: **"The project"**. Route configuration is project-level.

## Validation & Inspect Door

- When `workdir` is provided, validation occurs before opening any attempt.
- It verifies that `workdir` is a registered linked worktree of the project (its `.git` is a file whose common dir is the project's), and not the project root itself.
- Reuses the Git inspect door (`super::machine::git_roots(workdir, false)`) to inspect repository topology, refusing with `workdir-not-linked` if the path is not a linked worktree of the project.
