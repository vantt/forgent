# Code review: mailbox V7a, V7b, V7d (branch `mailbox/v1-v3`, `2536d16a2..7bed9c728`, first parent)

Date 2026-10-23 (Asia/Saigon). Read-only review. Nothing in the repo was edited or committed.

## Scope and method

- Lane commits reviewed: `dfbcbe30c`, `38948c01d`, `c4038ecfd`, `d74bae9c2` (V7a); `a3574712c`, `b251608d5`, `db1b0bf87`, `d79d85b6e`, `a034004b8` (V7b); `a8af00ebf` (V7d). The merges from main were not reviewed.
- The tree at `7bed9c728` was exported with `git archive` to `/tmp/fgos-work/v7abd`. The first build target on `/tmp` filled the tmpfs quota (16 GB, RAM-backed). The build was moved to the disk-backed, ignored `/home/vantt/projects/forgent/.fgos/runtime/tmp/v7abd-cbuild`. Settings: `CARGO_BUILD_JOBS=4`, `--test-threads=4`, `free -g` at 15 GB or more available before every build. Both directories were deleted at the end.
- Baseline, all green: `cargo test -p fgos-mailbox -p fgos-mailbox-core`, `-p fgos --test mailbox_routes` (22 shipped tests plus my probes), `-p fgos-host-runtime` (catalog count 14), `-p fgos --bins`, and `node --test test/rust-host/command-routes.test.mjs` (16/16).
- Not run: the full workspace, `npm test`, `test/setup/registrations.test.mjs` (it needs a host binary and `node_modules`), any real CLI or model, and the real state root.
- 11 mutants and 3 probe tests ran in the scratch copy. Results are under "Proof quality" below.

## Critical

None.

## High

### H1. The safety check of V7b, "deliver only to the session Identity resolved", has no owning proof. A mutant that drops it delivers a role's mail to the wrong head while every shipped test stays green. CONFIRMED

- `apps/fgos/src/wiring/mailbox_identity.rs:136`: `.find(|(_, info)| info.id == listed.id && (!by_handle || info.handle == to))`.
- Mutant M6 dropped `info.id == listed.id`. All 22 shipped `mailbox_routes` tests passed.
- My probe used two heads: the Claude head `WRITER` and a Codex head `zzz-holder` that holds `lead:PROBE`.
  - Original code: `recorded … for main-codex-bf` / `delivered to the current holder of lead:PROBE, codex-no2a@routes-test` (correct).
  - Mutant: `recorded … for main-claude-5c`, the wrong head. The holder line is still printed, because it comes from `listed.handle` and not from the head the mail went to.
- Every role and alias wiring proof uses a record with one head. "Delivered to the head that holds the role, not just any head of this record" is therefore unproven.
- The V7b report (`research-261023-1701`, "Mutants killed": "the Identity id check removed") says this mutant was killed. My run does not reproduce that. Either the report mutated a different expression, or the claim is wrong.
- Fix:
  1. Add one wiring proof in `apps/fgos/tests/mailbox_routes.rs`: two heads, with the role (and, in a second case, the queried handle) held by the head that sorts last. Assert the recipient's short name.
  2. Better, also build the holder line from the head that was actually chosen (`view`), not from `listed`, so a future regression cannot print a holder that did not get the mail.

### H2. A handle can be taken over by a 4-character suffix collision. Mail sent to the victim's handle is delivered to the squatter, and only a quiet hook-outcome line records it. CONFIRMED

- `mailbox_identity.rs:86-106` (`ensure_registered`) and `:136` (`address`).
- The handle is `<cli>-<suffix>@<machine>`, and the suffix is 4 base32 characters of sha256 (`identity/src/session.rs:11,89`).
- Probe:
  1. Brute-force a Codex key whose suffix equals the victim's. It took 6,476 tries and well under a second.
  2. Start that key as a head of this record. The test helper's own method works for this: `codex_like`, a copy of `/bin/sh` named `codex`, with a forged payload `session_id`. Spec §8 item 3 already admits this is possible.
  3. Then start the victim. Result: the victim's hook recorded `ident-handle-in-use` and Identity lists only the squatter (`routes-test-…/attacker-6476`, `codex-dlf3@routes-test`). `fgos mailbox send --to codex-dlf3@routes-test` answered `recorded … for main-codex-49`, which is the squatter.
- Every frame the victim sends also shows `handle="codex-dlf3@…"`, so replies by handle go to the squatter too.
- Spec §8 item 9 says the mailbox "bounds the harm: it delivers only to a head this project's record holds". That holds, but the squatter is a head of this record. The check `info.handle == to` cannot help, because the squatter's derived handle really is equal to the query.
- The same mechanism has a non-adversarial form. Two sessions on one machine whose suffixes collide (20 bits, birthday-bound across the up to 512 directory entries) leave the second one unaddressable by the handle printed in its own frames. If the first one is in the same project, that second session's mail goes to the first.
- Severity: same-user processes are outside the guard by spec §8 item 3, so this is not a new trust boundary. But nothing tells the sender, and the shipped tests do not cover it. Hence High, not Critical.
- Fix (small, inside the mailbox wiring):
  - In `address`, when more than one of `ours` derives the queried handle, refuse `ambiguous-name` with both as candidates. Do the same in the derived-handle fallback (`:154-158`, which picks the first match with `find`).
  - When `ensure_registered` returns `ident-handle-in-use`, make it visible beyond the overwritten single-line outcome file. For example, `status` could list heads whose derived handle Identity maps to another id.
  - Add a sentence to spec §8 item 9 that names the collision.

## Medium

### M1. The user-role refusal in V7a is a string match and is vacuous for Claude Code's channels. PLAUSIBLE (design gap, not a bypass)

- `packages/mailbox/rust/store/src/adapters/mod.rs:332`: `channel.deliver && channel.role == "user"`. A contract edit to `"User"`, `" user"` or `"transcript:user"` passes.
- The contract is embedded with `include_str!` (`adapters/mod.rs:26`), and a refused contract falls back to "every CLI untested" (`:252`, `unwrap_or_default`). So no runtime edit or unlisted CLI version can turn Codex Stop back on: `facts()` is per CLI, not per version, and the drain gate at `hook/drain.rs:270-281` reads only `stop_delivers`. V7a's runtime safety therefore holds.
- The gap is the invariant itself. Claude Code's `stop` channel delivers with role `transcript:attachment:hook_blocking_error`, and the contract says "the provider-level role is not recorded". "No delivering channel may have role user" is met for Claude only because the role is unknown.
- Fix:
  1. Parse roles into a closed enum (`user`, `developer`, `system`, `tool`, `transcript:<type>`) and refuse anything else.
  2. Treat a `transcript:` role on a delivering Stop channel as "provider role unmeasured". Either name it in the spec as an accepted residual, or require a recorded provider role before `deliver: true`. That is a measurement item for V7c/V7e, which already record roles for pi and omp.

### M2. A resolved alias goes back to the core as plain text and is resolved again by the name-first rules. PLAUSIBLE (latent)

- `apps/fgos/src/wiring/mailbox_verbs.rs:453-455` passes `to: to_key`. The core then runs `resolve_skipping(&req.to, …)` (`core/src/policy.rs:113`), which tries in order: exact short name, unique short-name prefix, exact key, key prefix (`core/src/names.rs` steps).
- A head whose short name equals or starts with the resolved key wins over the key match. Short names are `<project>-<cli>-<xx>` and keys are UUIDs, so this does not happen today. But Codex keys come from the payload (any valid writer-key text, see H2), so the property rests on naming convention, not on the type.
- Fix: carry the resolved head as a typed recipient (for example `SendRequest.to_key: Option<WriterKey>`, matched on exact key only) instead of reusing the name string.

### M3. `register_writer` is given a pid, not the verified head record. PLAUSIBLE (narrow)

- Plan decision 7 says the door takes "the mailbox's verified head record". The wiring passes `pid.0` (`mailbox_identity.rs:102`), and Identity re-reads `os_record(head_pid)` (`identity/src/directory.rs:425`).
- If the head exits and the pid is reused between the hook's caller check and this read, the entry records a stranger's liveness. The window is milliseconds, and Identity's next scan judges by start time.
- Fix: pass the start time too, so Identity can refuse a mismatch. The plan's open item, `session_for` gaining `head_pid`, is a natural place.

### M4. Shared-file churn: `cargo fmt` rewrapped code owned by other lanes. CONFIRMED

- `a8af00ebf` reformats about 120 lines of Identity's projector code in `apps/fgos/src/cli_projector.rs` (`project_identity_request` and its tests) and four `internal` routes in `apps/fgos/src/main.rs` (git-grant-check, terminal-control, seat-binding, run-supervisor). None of them belong to V7d.
- There is no behaviour change; `-p fgos --bins` and `-p fgos-host-runtime` are green. But these are the board's shared-collision files, and the churn will conflict with the IDENT and host-routing lanes.
- Fix: drop the formatting hunks from the lane commit, or land them as a separate `style:` commit announced on the board.

## Low

- **L1. `ensure_registered`'s "found with own id, record nothing" branch is unproven.** CONFIRMED. Mutant M8 (`Ok(listed) if listed.id == own.id => Some("x")`) survived. The first call goes through `not-found`, and the second call never asks Identity. Add one case: Identity already holds the head under its own id, and the registering call leaves no outcome line.
- **L2. `status` and `list` count heads differently.** CONFIRMED. `heads` in `status` counts every binding (`store/src/verbs.rs`, `existing.state.bindings().count()`), dead and runner ones included. `list` drops dead heads and `att-` keys, and the doctor row prints the `status` number as "N head(s)". Name the field `bindings`, or count with the same filter.
- **L3. One-bit existence oracle.** `no_address_here: true` ("That session has no mailbox address in this project") tells a sender that a handle, role or full id is live on this machine, even though it is in another project. Candidates are correctly cut to this record (proven: mutant M7 was killed). Acceptable under the same-user model; note it in spec §8 item 9.
- **L4. The platform check is copied three times.** `facts()`, `tier()` and `stop_drains()` in `adapters/mod.rs:268-305` each repeat `platforms.get(cli) == Some(OS)`. Route `tier`/`stop_drains` through one helper (DRY, one door).
- **L5. A watchdog exit during the Identity write can leave a temp file.** If the 8 s watchdog fires inside `register_writer`, a `.durable-file-<pid>-<n>.tmp` stays in Identity's directory. It is never counted (`scan` reads only `*.json`), but nothing removes it. Very unlikely at the measured 32 ms p95.
- **L6. `read_existing` checks the directory chain, then opens the snapshot by path** (`store/src/record/mod.rs:361-383`). A same-user directory swap in between is not detected, unlike the hold's `TrustedDirs` ids. It is read-only and within the same-user limit; note it in the doc comment, or re-check the record dir id after the read.
- **L7. A machine id minted after a head registered never registers that head** within that process (by design: "no retry"). `doctor --fix` on a fresh machine leaves current heads reachable only through the derived-handle fallback, which carries H2's first-match weakness.

## Focus answers

1. **V7a safety.** I found no runtime path that delivers through Codex `Stop`:
   - The gate (`drain.rs:270-281`) runs after registration and before the first-Stop reset, the cap and any claim, so no frame, notice or pointer line is ever produced on a Codex Stop.
   - The gate is per CLI, so an unlisted Codex version is untested, or Stop-off at worst.
   - The contract is compiled in and fails closed.
   - `inbox --claim` output reaches the model as tool output, not as a hook role.
   - Mutants M1 to M5 were all killed.
   - The remaining weakness is M1 above (string role match, Claude provider role unmeasured).
2. **Alias security.**
   - A squatter outside the record is refused: the existing test passes and I re-checked it.
   - Stale entries and pid reuse are handled by Identity's `judge_here` liveness.
   - A full id of another machine is `not-found` (`directory.rs:555-561`) and never matches a local head.
   - A squatter that is also a head of this record gets role mail. The holder line names it, as spec §8 item 9 accepts. For handles it gets the mail silently (H2).
   - The proof that delivery follows the resolved id is missing (H1).
   - Hook-time registration: the Codex `session_id` is not bound to `head_pid` by anything except the environment-mismatch check (killed mutant M11). A forged hook can register any id against its own Codex pid. Alone, that only pollutes the directory, toward its 512-entry cap. Combined with suffix collisions it gives H2.
   - Enumeration: candidates are cut to this record (M7 killed). Identity's refusal detail text is never printed. The only leak is L3.
3. **Fail-quiet and cost.**
   - Every Identity error in `ensure_registered` maps to an `ident:<reason>` outcome line. Proven: the shipped test for a missing machine id exits 0 with empty stdout and stderr. Unreadable directory and `directory-full` take the same path.
   - Panics are caught (`mailbox_hook.rs` `catch_unwind`).
   - Registering calls are quiet by construction, so the write gate stays idle and the 8 s watchdog (`arm_budget`) covers the Identity step.
   - The measured numbers match the report and spec §7.5: 30.4 / 39.6 ms steady p95, and 32.0 ms registering p95 at 450-499 entries. They are not invented. The source is the instrument and log paths named in the report.
4. **`list` and `status`.**
   - Both use `Record::read_existing`: no lock, no directory creation. The shipped test asserts no `.fgos/runtime` before a hook ran, and the doctor test asserts the snapshot bytes are unchanged.
   - Identity reads are read-only (`machine::read`, `read_alias`).
   - The record root is the main checkout's `.fgos`, so no other project is read.
   - The doctor row spawns nothing when the mailbox is disabled. It reports `none yet` with no record and fails only on an unreadable record.
   - Minor: L2, L6.
5. **Quality.**
   - Owning proofs exist for V7a and most of V7b, with the gaps H1 and L1.
   - No test-only switches in product code. The two `examples/` instruments are by-hand tools, not doors.
   - Paths are defined once (`Paths`, `state_root()` shared by hook and verbs, and proven).
   - Shared files: command-registry, `command-routes.json` and the catalog (count 12 to 14, test updated) are consistent, and their tests are green. The fmt churn is M4.

## Mutation table

| # | Mutant | Result |
|---|---|---|
| M1 | Codex Stop gate removed | killed (4 tests) |
| M2 | user-role refusal removed | killed |
| M3 | PostToolUse deliver/bound agreement removed | killed |
| M4 | wake no-channel check removed | killed |
| M5 | report no-stop sentence removed | killed |
| M6 | alias: resolved-id match dropped | **survived** (H1) |
| M7 | candidates not cut to this record | killed |
| M8 | own-id-found branch records an outcome | **survived** (L1) |
| M9 | role holder line dropped | killed |
| M10 | frame handle not derived | killed |
| M11 | Codex environment/payload mismatch not refused | killed (2 tests) |

## Verdict

- **V7a: yes.** It meets its goal. Codex Stop takes no mail through any payload, version or contract path I could find, and the report and quota behaviour are correct and proven. M1 (role-string rigour) should be done before V7c/V7e add more channels, but it does not block.
- **V7b: no, not yet.** Addressing works, the cost is within budget and fail-quiet holds. Two things block:
  - H1: the core delivery-safety rule (deliver to the session Identity resolved) is untested, and a mutant that breaks it ships green.
  - H2: a handle can be silently taken over by a suffix-collision squatter that is a head of the record.
  - Both are small fixes in `mailbox_identity.rs`: refuse when several heads of the record derive the queried handle, build the holder line from the delivered head, and add a two-head wiring proof.
- **V7d: yes, with Low items.** `list` and `status` are read-only, lock-free and confined to this project, and the doctor row is correct when the mailbox is disabled. M4 (fmt churn in other lanes' code in shared files) should be split out before merge.

Status: DONE_WITH_CONCERNS
Summary: V7a and V7d meet their goals. V7b does not yet: its rule of delivering to the resolved session has no owning proof (a mutant misdelivers role mail with all tests green), and a 4-character handle-suffix collision lets a same-project squatter silently receive mail sent to another session's handle (confirmed by probe).
Concerns/Blockers: H1 and H2 block V7b. The V7b report's claim that the "Identity id check removed" mutant was killed did not reproduce.
