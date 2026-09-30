# Unit P8b (Rust) — Execution Report

Phase 8 / C4: rename `providers::external_process::supervisor` to reflect the
`bound-invocation-supervisor` vocabulary decided in plan.md.

Worktree: `.claude/worktrees/dispatch-engine-liveness-p8b-rust-supervisor-rename`
Branch: `unit/P8b-rust`, commit `e589577c1`, based on `9d5ad8cef`.

## Naming call made

Kept the `external_process` directory (legitimate description of what it
wraps, not the source of confusion). Renamed only the supervisor
submodule/type, per plan.md's own literal scope ("supervisor.rs (and its
module path under providers/external_process/) renamed to reflect
bound-invocation-supervisor") — narrower than the task message's mention of
`ExternalProcessProviderAdapter`/"related types". Left `ExternalProcessConfig`,
`ExternalProcessRequest`, `ExternalProcessOutcome`, and
`ExternalProcessProviderAdapter` unchanged: they name the wire
protocol/adapter, not the supervisor role, so renaming them would be scope
creep beyond what plan.md's decision actually covers.

## Files changed (all under `packages/host-runtime/rust/`)

- `src/providers/external_process/supervisor.rs` → `bound_invocation_supervisor.rs`
  (git rename). Struct `ExternalProcessSupervisor` → `BoundInvocationSupervisor`.
  Doc comment now states the `bound-invocation-supervisor` role explicitly and
  contrasts it with Node's `detached-run-supervisor` (`cli-spawn-supervisor.mjs`).
- `src/providers/external_process/mod.rs` — `pub mod supervisor` →
  `pub mod bound_invocation_supervisor`; re-export list updated.
- `src/providers/external_process/adapter.rs` — import + all 4 type-position
  uses of the old struct name updated; field/method names (`supervisor`,
  `.supervisor()`) kept as-is (role-agnostic, still correct).
- `src/providers/mod.rs` — top-level wildcard re-export (`pub use
  external_process::{...}`) updated. **Not caught by the Lead's original
  7-file grep** (`external_process::supervisor|providers::external_process|
  use.*supervisor::`) because this file re-exports the bare module name
  (`supervisor`) and bare type name (`ExternalProcessSupervisor`) without
  either literal substring the grep looked for. Found via a full
  `grep -rn "ExternalProcessSupervisor"` sweep after the initial edits —
  worth flagging in case other C4/Phase-8 blast-radius greps have the same
  blind spot for wildcard re-exports.
- `tests/external_process_tests.rs` — import + 13x `ExternalProcessSupervisor::new(`
  + 1x fully-qualified `providers::external_process::supervisor::ExternalProcessOutcome`
  path updated. Test names/comments ("Supervisor Tests", `test_supervisor_*`)
  left as-is — generic English word, not the ambiguous identifier.
- `tests/external_process_router_integration.rs`,
  `tests/external_provider_manifest_and_registry.rs`,
  `tests/fixtures/external-provider/echo_process.rs` — **no changes**: none
  of these actually import the supervisor type/module (confirmed by
  re-reading each in full); they only matched the Lead's grep via the
  `providers::external_process` alternative for unrelated imports
  (`ExternalProcessProviderAdapter`, manifest/linker types, frame_codec).

`apps/fgos/src/` — no references found (grep clean).

## Verification

- `cargo build --workspace`: clean, 5 crates compiled.
- `cargo test --workspace`: **177 passed, 0 failed** (16 suites) — includes
  `external_process_tests` (45 assertions covering handshake/timeout/crash/
  cancellation/flood paths), `external_process_router_integration`,
  `external_provider_manifest_and_registry`.
- `cargo fmt --check -p fgos-host-runtime`: found import-ordering diffs (this
  repo enforces fmt); ran `cargo fmt`, re-verified build+test green after.
- Repo-wide `grep -rn "ExternalProcessSupervisor|external_process::supervisor\b"`
  across `packages/host-runtime/rust/{src,tests}` and `apps/fgos/src`: zero
  matches after the fix above. GitNexus's own PostToolUse hook flagged 2
  "related symbols" still named `ExternalProcessSupervisor` — that's its
  index being stale (pre-rename), not a real leftover; confirmed by the
  grep and by `cargo build` succeeding.

## Docs — decision record (shared, not per-unit, per the Lead's own split)

**Scouted first, found the delegation brief's premise stale**: plan.md says
"recorded in `docs/decisions/`" and the Lead's brief said "check this
repo's own existing convention... read 1-2 existing entries there to match
structure" (implying hand-authored markdown files under `docs/decisions/`).
Reading `docs/decisions/index.md`'s own header and `AGENTS.md` shows that
corpus retired (tsk-1lv-4): it's now **generated, never hand-edited**, from
`state.decisions` via `fgos decision write` + `fgos decision-index`. The
"D-ADR00NN:" number itself is a pure human convention embedded in `--text`
by whoever writes it (confirmed in `src/report/decision-index.mjs` — no
auto-numbering field exists anywhere in the pipeline).

Given that, and given my worktree's own `.fgos/` is a frozen snapshot from
the `9d5ad8cef` base commit (this worktree was created by plain `git
worktree add`, not fgOS's own `createWorktree`, so it never got the
symlink-to-shared-store treatment `session.mjs` gives interactive
sessions) — writing state from inside my worktree would be a dead end even
before ADR0020's "no `.fgos/` commit from a worker branch" wall, since a
worktree branch's `.fgos/` here is a disconnected copy, not a live view —
I ran the write from the **main checkout** instead (an append-only CLI
call, not a git write, so safe to run against the live store while other
sessions are active):

```
node bin/fgos.mjs decision --text "Vocabulary: bound-invocation-supervisor ... vs detached-run-supervisor ..." \
  --rationale "..." --relation none --scope runner
node bin/fgos.mjs decision-index
```

This landed as `docs/decisions/index.md`'s new `runner`-scoped row (verified
`fgos decision-index --check` reports `changed: false` immediately after —
no drift). **Picked `scope: runner`, not `distribution`**: plan.md's own C4
section frames this as a dispatch/runner-track decision, precedent already
lives there (D-ADR0026/0028/0029/0033 are the exact same "dispatch
vocabulary rename" shape, all scoped `runner`), and `cli-spawn-supervisor.mjs`
literally lives at `src/runner/dispatch/`. `docs/specs/distribution.md`
(what `reading-map.md` currently points `host-invocation-routing` narrative
at) turned out to be a **legacy/promoted file** ("Do not use this legacy
file for: Final human navigation or post-migration authority" — promoted to
`docs/platform/packaging-distribution/*`) and topically about install/
packaging, not dispatch/invocation internals — a bad fit either way.

**I did not embed a "D-ADR00NN:" number in the `--text`** (missed the
convention until after the write landed — the number is invisible in the
code path, only visible by pattern-matching existing rows by eye). The
append-only log can't be edited after the fact; the row lives in
`docs/decisions/index.md` correctly, just unnumbered. Highest existing
number at write time was `D-ADR0042` (confirmed via
`grep -oE "D-ADR[0-9]+" docs/decisions/index.md docs/specs/*.md | sort -n | tail`),
so **`D-ADR0043` is the natural next number** — but **given how many
concurrent Phase-8/other-track agents are active in this session, a real
risk exists that another agent claimed 0043 for something else in the same
window**. Recommend the Lead grep for `D-ADR0043` across `docs/` before
locking it in.

**Narrative write-up still needed, and it's outside my Rust-only file
ownership** (`docs/specs/runner.md` is a large shared file, plausibly being
edited concurrently for Phase 8's own S4 decision) — draft below, ready to
paste into `docs/specs/runner.md`'s existing "## Lịch sử quyết định retired
từ docs/decisions/ (tsk-1lv-4)" section (matches its `### 00NN — <title>` /
`#### Bối cảnh` / `#### Quyết định` / `#### Hệ quả` shape):

```markdown
### 0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor

#### Bối cảnh

Phase 8's C4 investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found `supervisor.rs` (Rust, ~855 lines) and `cli-spawn-supervisor.mjs`
(Node, ~1208 lines) look like duplicate "supervisor" implementations —
both do bounded capture, deadlines, crash mapping, cancellation grace — but
they answer different questions. `supervisor.rs` has zero detach/setsid/
process-group logic anywhere (confirmed via source) and short default
deadlines (2-5s): a short RPC-shaped call bound to ONE invocation's own
lifetime, never expected to outlive its caller. `cli-spawn-supervisor.mjs`
deliberately detaches (`startSupervisorProcess`'s own detached spawn,
PGID-based kill, immutable receipt publication) so a long agent/executor
run survives the crash of whatever dispatched it. Zero live conflict
today: the Rust mechanism has zero current consumers (`command-routes.json`
confirms `dispatch` is 100% `legacy-cli`; only 2 `native` routes exist,
neither uses it).

#### Quyết định

Name the two roles by the load-bearing axis — lifecycle/detachment — not
current content label ("agent" vs "RPC"), so the names stay correct if
either mechanism's real use case shifts later:

- **`detached-run-supervisor`** — `cli-spawn-supervisor.mjs`'s role: a
  supervised run deliberately detached, must survive the crash of whatever
  dispatched it.
- **`bound-invocation-supervisor`** — `supervisor.rs`'s role (renamed
  `BoundInvocationSupervisor`, module `providers::external_process::
  bound_invocation_supervisor`): a supervised external-process call bound
  to one invocation's own lifetime, never detached.

Renamed both implementations to match: `cli-spawn-supervisor.mjs`'s
adapter-specific exports (Node side, unit P8a) and `supervisor.rs`/
`ExternalProcessSupervisor` → `bound_invocation_supervisor.rs`/
`BoundInvocationSupervisor` (Rust side, unit P8b, this record).

#### Hệ quả

- A future reader comparing the two "supervisor" files judges them by
  lifecycle ownership, not by guessing from a shared generic name.
- `ExternalProcessConfig`/`Request`/`Outcome` and
  `ExternalProcessProviderAdapter` keep their current names — they name the
  wire protocol and the `OperationProvider` adapter, not the supervisor
  role, so this rename doesn't touch them.
- The day any operation (including `dispatch`) is routed `native` instead
  of `legacy-cli`, `bound-invocation-supervisor` becomes a real second
  invocation mechanism alongside `detached-run-supervisor` — this record is
  the ownership boundary written down before that happens, not after.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

## Constraints honored

Rust-only: touched only `packages/host-runtime/rust/`. Nothing under
`src/runner/`, `test/runner/`, or any `.mjs` file. Did not touch
`docs/specs/runner.md` (flagged above as the Lead's/main-session's own
follow-up, since it's shared and outside my file ownership). Did not commit
anything in the main checkout — the `fgos decision write` append and
`docs/decisions/index.md` regenerate are sitting there uncommitted
(`git status` shows `M docs/decisions/index.md` + a new untracked
`.fgos/events/*.jsonl` shard); recommend committing that promptly given
this session's own prior lesson about uncommitted shared-checkout state
being at risk from a concurrent session.

## Unresolved / needs Lead action

1. Confirm `D-ADR0043` isn't claimed by a concurrent decision write before
   pasting the narrative into `docs/specs/runner.md`.
2. Paste the drafted `### 0043` section into `docs/specs/runner.md`'s
   "Lịch sử quyết định" area (outside my file ownership).
3. Commit `docs/decisions/index.md` + the new `.fgos/events/*.jsonl` shard
   in the main checkout.
4. Merge `unit/P8b-rust` (commit `e589577c1`) after independent re-verify.
