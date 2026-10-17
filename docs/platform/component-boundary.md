# Component Boundary

```txt
Document type: Platform architecture anchor
Audience: Human reviewer, architect, maintainer, design-shaping agent
Purpose: Track the whole-system component and authority boundary map
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor for docs/architect/component-boundary/**
Last reviewed: 2026-10-16
Related:
- docs/architect/component-boundary/README.md
- docs/architect/component-boundary/component-boundary-advisory.md
- docs/architect/proposals/component-authority-boundary-map.md
- docs/platform/README.md
```

## 1. Purpose

This document is the platform-wide anchor for component boundaries.

It answers:

- which major components exist;
- which parent/child responsibilities belong together;
- which component owns a decision or state write;
- which areas depend on each other through explicit contracts;
- when a design changes the whole-system boundary map.

## 2. Current Source During Migration

The current detailed source remains:

| Source | Role |
| --- | --- |
| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |
| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |
| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |

Until this anchor is fully promoted, use those sources for detail and update this file as the stable entry point.

## 3. Update Rule

Any design discussion or documentation rewrite must check this boundary map when it changes:

- a platform component;
- a parent/child component relationship;
- ownership of a state write, decision, runtime authority, or contract;
- a cross-area dependency;
- the boundary between platform core, platform support, domain layer, host surface, or extension/plugin layer.

If the boundary changes, update this document or the current detailed source listed above. If it does not change, record `No component-boundary change` in the implementation alignment, verification note, discussion summary, or PR note.

## 4. Current High-Level Components

This table is a compact navigation surface, not a full replacement for the advisory docs.

| Component | Current role | Current source |
| --- | --- | --- |
| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |
| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for "ai làm / model / persona / cơ chế" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |
| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |
| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\|status\|stop`; không phải một phần của herdr và không phải "herdr-gateway" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |
| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |
| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |
| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |
| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |
| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |
| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |
| Session Identity (Writer Identity) | Foundation authority for "who is the writer of this process" (`{id, source}`). One implementation, the Rust crate `fgos-session-identity` (`packages/session-identity/rust`, native verb `fgos identity`); Observe calls it in process, Node through the facade `src/util/session-identity.mjs`. Owns no state and depends only on `fgos-host-runtime`; Observe depends on it. Grants no lock or claim authority. | [session-identity/spec.md](session-identity/spec.md) |
| Terminal-control (L2) | Foundation component for "which pane does this key run in" on a terminal multiplexer, usable without a run. Rust crate `fgos-terminal-control` (`packages/terminal-control/rust`) with a key-addressed upper port and a driver port with declared capabilities (herdr first; Windows declares none). Writes only the allocation record; closes only panes it allocated, never a tab; Node reaches it through the internal route `fgos internal terminal-control`, no user verb. Dependency one way: run supervisor → Terminal-control. Node migration in progress. | [terminal-control/spec.md](terminal-control/spec.md) |
| Process Facts & Control (L0) | Single authority for "is this process tuple `{host, bootId, pidNs, pid, startTime}` alive, dead or unknown" (`judge`, one shared vector file for Rust and Node), for signalling a process by identity (`pidfd` on Linux, never a bare pid), for spawning with an explicit fd mapping, and for the domain primitives `domain_is_empty`/`domain_kill_all` the predecessor rule of holder-lock needs. Never spawns to read facts, never kills by bare pid, never reads mtime, knows no run, lock or pane. Rust crate `fgos-process` (`packages/process/rust`), one driver per OS; the Node leaf `src/runner/dispatch/process-identity.mjs` reads the same vectors, and reconcile imports only `facts`. The gate primitives (subreaper, PDEATHSIG, PID namespace, tty) and the containment port stay with the run supervisor. Depends only on the OS. | [process/spec.md](process/spec.md) |
| Holder-lock (L1) | Single authority for "who holds which resource", as the kernel sees it: kernel locks on open file descriptions behind one OS-neutral port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`, `guarantee`), the lock registry (`packages/holder-lock/contracts/lock-registry.v1.json`: every lock's kind, scope, rank, path, legacy shape and fence), lock order inside one `LockScope`, the description rules, the predecessor-domain rule, the single state-root resolution and the cutover fences. Never reads writer identity, never takes a lock from a live holder, never derives a decision from a pid, TTL or mtime. Rust crate `fgos-holder-lock` (`packages/holder-lock/rust`) plus the internal routes `fgos internal lock-fd|state-root|quiesce-scan|lock-borrow-vectors`; Node only through the facade `src/holder-lock/`, which never exposes an fd. Depends on Process Facts & Control and the kernel. Owns the cold locks (gateway, runner, sessions, advance, reconcile, recovery, full-suite, provider account/state, dispatch cwd) and the main checkout mutex (one door `withMainCheckout`, git children and the pre-commit hook borrow the lock through the description, no pid or TTL), the merge slot and `worktree-admin`; `fgos lock fence` is the one door for a hung live holder. It does not own the state store's hot mutex (`state`, `porting-events`: `withStateTx` in `src/state/hot-lock.mjs`, which replaced `events.lock`, `claims.lock` and `porting/events.lock`): the state store owns that mechanism, a temporary one until the store moves to Rust, and takes only its cleanup lock and the fences from this component. The main door's `.fgos` checkpoint is a detachable adapter, so the lock core knows nothing of the event log. | [holder-lock/spec.md](holder-lock/spec.md) |
## 5. How To Change

1. Read this anchor and the current detailed component-boundary source.
2. Identify whether the change is component packaging, bounded context, authority boundary, or physical layout.
3. Update the owning area docs.
4. Update this anchor or the detailed source when the whole-system map changes.
5. Link evidence or record `No component-boundary change`.

## 6. Related Files

| Relationship | File |
| --- | --- |
| platform portal | [README.md](README.md) |
| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| draft authority map | [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) |
| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |
| observe component | [../specs/observe.md](../specs/observe.md) |
| process facts & control component | [process/spec.md](process/spec.md) |
| holder-lock component | [holder-lock/spec.md](holder-lock/spec.md) |
