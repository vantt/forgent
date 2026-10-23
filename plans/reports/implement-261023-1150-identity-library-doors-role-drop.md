# Identity library doors, role drop, refusals as data

Branch `ident/library-doors-role-drop` (base 0fc44d12e). Four commits, one per item.

## Public signatures (crate `fgos-identity`, feature `directory`, no `provider`, no direct host-runtime dependency)

```rust
// fgos_identity::Refusal (also fgos_identity::refusal::Refusal; provider re-exports it)
pub struct Refusal { pub reason: &'static str, pub detail: String, pub candidates: Vec<Candidate> }
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct Candidate { pub id: String /* full id */, pub handle: String, pub liveness: Liveness }
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub enum Liveness { Alive, Unknown }   // also Listed.liveness (JSON text unchanged: "alive" | "unknown")
impl Refusal { pub const EXIT: i32 = 65; }

// fgos_identity::current
pub struct CurrentSession { pub local: session::Local, pub info: SessionInfo /* id, handle */ }
pub fn current_session(state_root: &Path, caller_pid: u32, fgos_dir: Option<&Path>) -> Result<CurrentSession, Refusal>;
pub fn machine_info(state_root: &Path) -> Result<MachineInfo, Refusal>;

// fgos_identity::directory
pub fn register_current(state_root: &Path, caller_pid: u32, fgos_dir: Option<&Path>,
    clone_dir: Option<&Path>, roles: &[String], take: bool) -> Result<Listed, Refusal>;
pub fn drop_role(root: &Path, own_id: &str, role: &str, judge: Judge) -> Result<Listed, Refusal>;
pub fn drop_current_role(state_root: &Path, caller_pid: u32, fgos_dir: Option<&Path>, role: &str) -> Result<Listed, Refusal>;
pub fn resolve(root: &Path, query: &str, judge: Judge) -> Result<Listed, Refusal>;   // unchanged
// judge: fgos_process::facts::judge_here
```

MAIL recipe: `let me = current_session(root, pid, None)?; match resolve(root, &me.info.handle, &judge_here) { Err(r) if r.reason == "not-found" => register_current(root, pid, None, Some(cwd), &[], false), other => other }`.
`caller_pid` is the pid whose terminal-head is the agent head (a hook passes its own pid, `std::process::id()`). Env (`CLAUDE_CODE_SESSION_ID` etc.) is read from the process env.

Feature split: `directory = [convention, git]`, `provider = [directory, host-runtime, holder-lock]`. `fgos-identity` no longer needs host-runtime for the directory doors; transitively `fgos-convention` (role lane-id rule) still depends on host-runtime in this workspace, so a binary linking it still compiles host-runtime (not a feature of this crate).

## In-process timing (release build, 10 other entries, this machine, avg of 50-200 runs)

| call | cost |
|---|---|
| `current_session` (own id and handle) | 2.5-6 us |
| resolve own handle (`current_session` + `resolve`) | 67-180 us |
| `register_current`, first registration | 100-115 us |
| `register_current`, refresh | 105-930 us (noisy; the high figure with a real repository: project id read through the git driver, 68 us warm once, more cold) |

Debug build is about 2x. All far inside 50 ms p95. The bench was a throwaway test, not committed.

## Items

1. Typed candidates: `Refusal.candidates` are `Candidate {id, handle, liveness}` objects: `not-found` the live sessions whose handle or role contains the query, `ambiguous` the sessions matched, `role-not-held` the live sessions that do hold the role (empty when nobody); empty otherwise. `Listed.liveness` is now the same `Liveness` enum. Spec section 5 states the mailbox maps `not-found`/`ambiguous` to its `unknown-name`/`ambiguous-name`, and notes the I4 additions (`machine`, `fetchedAt`, liveness `remote`) without implementing them. Owning proof: `unknown_names_are_not_found_with_the_close_candidates`, `a_role_held_twice_is_ambiguous_and_lists_both` in `tests/directory.rs`.
2. `register_current` / `current_session`; the provider's `--register` calls it (no second copy). Proof: `tests/register_current.rs` (own file: it sets the session id in the env).
3. `fgos identity session --drop-role lead:<LANE>` (identity.write). Refusals `role-not-held`, `not-registered`, `invalid-role`. Registered in projector, `command-routes.json` (`subcommand_flags.session`), command registry; drift and route tests green. Owning proof `a_session_drops_only_its_own_role_and_it_then_resolves_not_found`; one CLI wiring step in the existing directory CLI test. Backlog row `p-q4vcrihcxb` set to done.
4. Refusals as data under `--json`: stdout gets one line `{"error": <message>, "reason": <code>, "candidates": [...]}`; exit 65 and stderr unchanged. Declared as `definitions.refusal` in both contracts, spec section 5 with an example, CHANGELOG. Owning wiring proof: the CLI directory test (not-found with candidates); the machine CLI test now asserts the reason on stdout instead of empty stdout.

## Decision to confirm (item 4)

The requested convention does not exist. `docs/io-contract.md` says the error path is NOT wrapped in the `fgos.v1` envelope (stderr plus exit code), the native presenter only emits success envelopes, and the single stdout failure precedent is `dispatch decide`'s unwrapped `{error, errorClass}`. I did not invent an envelope-wrapped failure: the shape reuses the precedent's `error` key (message), adds `reason` and `candidates`, and has no `contract` key so it never reads as a success envelope. `candidates` is always present (`[]` when none) for a stable shape, as `[{id, handle, liveness}]`. The shape lives in one function, `cli_presenter::refusal_json`, so a change is one edit. Only typed refusals are covered; argument-projection errors (unknown flag) stay stderr/exit 1.

## Verification

- `cargo test --workspace --no-fail-fast`: green.
- `npm test`: 18 failures, all known (17 fgctl init/upgrade/download, codex `cli-bypass`). No new test() calls reported by the suite inventory.
- The mutation census was left untouched (a test run rewrote it with unrelated drift; not committed).
