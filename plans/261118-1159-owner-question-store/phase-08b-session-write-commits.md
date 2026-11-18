# Phase 8b: `fgos session write` commits and pushes what it writes

Backlog row `p-o5h4qfpt53` (owner 2026-11-19). The head write door from the session-verb plan (its phase 7c) writes
the file atomically but commits nothing. On 2026-11-19 four of Miu's backlog edits sat uncommitted until the
supervisor committed them by hand (86b50667a, c59ffd340).

## Decision (QP-23)
A write through `session write` is published by the existing **paths land** use case:
`fgos_supervision::land::land` with `LandCommand { paths: [<path>], .. }` (`packages/supervision/rust/src/land.rs:183`,
`land_paths` at :909). This is the door of plan 261118-1045 PS-6 and its phase 7a Git ports. It already:
- takes the target's merge slot, fetches, and fast-forwards the main checkout to the remote tip through
  `GitDriver::catch_up_main_checkout` (`packages/git/rust/src/land.rs:1067`; refusals
  `main-checkout-catch-up-refused: <reason>`, `land-remote-diverged`);
- commits only the named paths through `scoped_commit` (`packages/git/rust/src/scoped_commit.rs:1337`), keeping any
  other dirty path out of the commit;
- pushes the checked-out branch without force (`land-paths-push-rejected` when the remote moved);
- runs only the configured `land.gates` whose `when` matches the path.

No second commit, fetch or push path is written. The supervisor crate stays transport: `head_request.rs` gets one
port, and the composition root (`apps/fgos`) fills it with the paths land. That is the one place `fgos-supervision`
is composed into the host until plan 1045 phase 16 wires `fgos land`, which then reuses the same composition.

Order and refusals:
1. Grant and path checks as today (`write_granted`, `head_request.rs:587`).
2. **The path has no uncommitted change** in the main checkout before the write. Otherwise refuse
   `write-path-dirty` (new, in `head-request.v1.json`) and write nothing.
3. The atomic write as today.
4. The paths land with message `docs(<role>): write <path>`, where `<role>` is `envelope.session.role` and the writer is
   that head's writer key. Any land refusal comes back by its own name in `publish.refusal`, and the file stays
   written and uncommitted; nothing is forced.
5. The reply data becomes `{path, bytes, commit}` on success, or `{path, bytes, publish: {refusal, detail}}`. A
   publish refusal is a reply, not a transport error, so the head can tell "written but not published" from "not
   written".

## Inputs
- `packages/run-supervisor/contracts/head-request.v1.json`: the `session write` block (args `{path, content}`, its
  refusals, reply `{path, bytes}`, `identity: "held"`).
- `packages/run-supervisor/rust/src/head_request.rs`: `WRITE_VERB` (:72), `Config` and its port fields (:117-150; the
  new port follows `caller_under_gate: ChecksPeer`), `write_granted` (:587), the write dispatch (:919, :953).
- `packages/run-supervisor/rust/src/route.rs` and `apps/fgos/src/main.rs:236` (`fgos_run_supervisor::route::main`):
  where the supervisor's `Config` is built and how the composition root hands it the port.
- `packages/supervision/rust/src/land.rs`: `LandPorts` (:169), `LandCommand` (:33), `LandConfig`, and the test
  composition in `packages/supervision/rust/tests/land.rs:196`.
- Project config `land.gates` / `land.regenerate`, if present: `core/config-standard`, `core/config-schema`.
- Tests that own `session write` now: `packages/run-supervisor/rust/tests/head_request.rs:952-1033`,
  `test/session-host/head-request.test.mjs`, `test/cli/session-verb.test.mjs`.
- `src/session-host/head-request-client.mjs` `requestHeadWrite`: prints the reply of `fgos session write <path>`.

## Footprint
See the phase table in `plan.md`, row 8b.

## Steps
0. Re-grep every input. Confirm that `land` with `paths` needs no branch-only state (`LandConfig` gates and
   regenerate may be empty for a paths land). Confirm how `route::main` gets `Config`, and choose the smallest way to
   pass the port from `main.rs` (a parameter, not a global).
1. In `head_request.rs`, add the port `publish_write: PublishesWrite`
   (`Fn(&Path /*root*/, &str /*path*/, &str /*role*/) -> Result<String /*commit*/, PublishRefusal>`) and a
   `path_clean` check before the write (through the same port's preflight, or through `fgos-git`'s dirty-path read
   if the crate already reaches it; never a raw `git status` spawn). Apply the order above. Unit-test the order with
   stub ports: dirty path refused before any write, publish refusal returned with the file written, success returns
   the commit.
2. In `apps/fgos`, add `wiring/session_write_publish.rs`: build `LandPorts` for the main checkout of the root
   (`fgos_git::main_checkout_root`), the remote grant, the head's writer key and the configured land gates, and call
   `fgos_supervision::land::land` with `paths: [path]`. Add `fgos-supervision` to `apps/fgos/Cargo.toml`.
3. Contract: `head-request.v1.json` gets `write-path-dirty`, the new reply shape and a line saying the publish goes
   through the paths land.
4. `requestHeadWrite` prints `committed <sha>`, or `written, not published: <refusal> <detail>` with a non-zero exit.
5. One owning proof through the real door (acceptance 11), in `packages/run-supervisor/rust/tests/head_request.rs`
   or `apps/fgos/tests/session_write_publish.rs`, whichever can drive the real supervisor socket with the real
   composition. It uses a temp repo with a bare remote. Move or retire any existing case that the new proof now owns;
   the stub-port unit tests stay as the order's proof.
6. `docs/platform/session-host/spec.md`: the write verb publishes through the paths land; name the refusals.
   Regenerate the census.

## Verify
- The new proof, `cargo test -p fgos-run-supervisor --test head_request` and `cargo test -p fgos-supervision`
- `test/session-host/head-request.test.mjs` and `test/cli/session-verb.test.mjs` through the repo test runner
- clippy `-D warnings`, the msvc check, and the census scan

Pass condition: all are green, and acceptance 11 holds.

## Rollback
Revert the phase commit. `session write` then writes without publishing, as before.
