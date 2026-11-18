# Phase 7c: A host-side write door for a head's granted files

Owner decision 2026-11-18 (option B, [question](reports/phase-07-owner-question-2.md)): phase 7 landed with a documented
hole (the head's granted file needs its parent `docs/` bound read-write; a sibling the host replaces, e.g. by `git pull`,
loses its read-only re-bind and becomes writable until the head restarts). This phase closes it. Depends on phase 7b
(shares the head shape, `src/session-host/**` and the run-supervisor head-request socket). No other permission changes.

## Inputs (read first)
- Head-request socket: `packages/run-supervisor/rust/src/head_request.rs` (verbs, SO_PEERCRED gate-tree check),
  contract `packages/run-supervisor/contracts/head-request.v1.json`, client `src/session-host/head-request*.mjs`.
- Grant table `src/session-host/head-grants.mjs` (`writes`); the granted-file shape in
  `src/runner/dispatch/confinement/resources.mjs` / `drivers/bwrap.mjs` (parent rw + siblings ro).
- Durable File (atomic write) primitive in Rust: find it (`rg -n "fn write_atomic|durable" packages`) and reuse it.
- Skill `core/skills/fgos-secretary/SKILL.md` (adds backlog rows).

## Steps
1. Rust verb `head write <path>` on the head-request socket: the content comes on the request (stdin of the CLI), the
   host checks that `<path>` (project-relative, no `..`, no symlink at it or any ancestor) is a granted file of the
   caller's role, then writes it atomically with the existing durable-file primitive. Contract updated. Node is only
   the thin CLI caller.
2. The head shape no longer binds a granted file's parent read-write: a granted *file* is reachable read-only only
   (its parent stays read-only, live); granted *directories* (`docs/discussions`, `plans`) stay as today.
3. Skill fgos-secretary: add a backlog row by editing a scratch copy and `fgos head write docs/backlog.md < copy`
   (or the exact form step 1 ships); regenerate render surfaces with `npm run build:skills`.
4. Confinement spec: remove the documented `docs/` hole; state the write door.
5. Tests: the grant check (granted / not granted / `..` / symlinked ancestor) and the atomic write at the Rust layer;
   one wiring proof that a launched secretary shape cannot write `docs/backlog.md` directly but the door writes it, and
   a host replace of a docs sibling leaves it read-only in the head.

## Verify
- `cargo test -p` run-supervisor and fgos, clippy `-D warnings`, msvc and aarch64-apple-darwin checks; focused Node
  session-host and confinement tests.
- Live after release (owner go via Miu): Miu adds one backlog row through the door; `git pull` then an attempted
  direct edit of another docs file fails.

## Rollback
`git revert`; the phase 7 shape (parent rw) returns with its documented hole.
