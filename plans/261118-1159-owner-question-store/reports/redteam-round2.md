# Red team round 2: owner-question store plan

Reviewer: independent code-reviewer subagent, 2026-11-18. Read-only everywhere; this file is the only write.
Plan at HEAD `3300fcc1b` (branch `plan/owner-questions`). Blockers read on `origin/main` `0e0b677c1`. The supervisor
plan was read on the local branch `plan/supervisor` (`31acf2896`), because `origin/plan/supervisor` does not exist.

Verdict: **not ready**. The revision fixes most first-round findings for real: C2, H2, H4 (for the store), H6, H7, H9,
M1, M3-M10. Five new or remaining high findings rest on code facts the plan got wrong:
- the Event Store runs only on Linux;
- head-request verbs run in a Node child, not in `head_request.rs`;
- `ancestry_cli` is not an agent detector;
- Identity rejects an `answers:` role;
- the wake detection reads Observe, which does not sync between machines.

No critical finding.

## A. Fixes from round 1

| finding | verdict | evidence |
|---|---|---|
| C1 heads cannot write; Stop loop | **partly fixed.** The stateless hook and `stop_hook_active` are real fixes. The socket design is wrong (N2), and nothing proves the hook can read the store inside a confined head (N7) | `head_request.rs:1-8`; `head-request.v1.json` `run` |
| C2 shared lock | **fixed.** The Event Store has its own `event-append` lock, and the Observe write door stays separate and fail-open | `packages/event-store/rust/src/layout.rs` `append_lock`; `.git/fgos/events/locks/` |
| H1 owner rule bypass | **partly fixed.** The MCP part is fixed. The ancestry mechanism QP-16 cites does not exist (N3), and the gateway inherits the agent's session env (N9) | `resolve.rs:213-219`; `gateway_control.rs:113,453-460` |
| H2 rotation | **fixed** through the same `head:` role | QP-4, QP-11, acceptance 5 |
| H3 successor link owner | **not fixed, only moved.** The role shape is invalid, and the two plans each name the other as the owner (N4) | `directory.rs:37-41,171-182`; supervisor plan.md "Handoff update 2" |
| H4 no sync | **fixed for the store, but it comes back in the wake path (N5).** The store is also Linux-only (N1) | `docs/platform/event-store/spec.md:649` |
| H5 supervisor plan out of step | **content fixed, citation broken.** `07a741621` is on no branch (it was rewritten as `0adf4ae5f`), and `origin/plan/supervisor` is not pushed. The agreement lives in local `31acf2896` | `git branch -a --contains 07a741621` is empty |
| H6 ref checked on main | **fixed** (caller's checkout, with branch and commit recorded) | QP-7, phase 3 step 5 |
| H7 deleted reader's test and manifest | **fixed** | phase 4 inputs and footprint |
| H8 generated and hot files | **mostly fixed.** New gaps are listed in N8 | phase table |
| H9 blocking on all of ops-metrics | **fixed.** Phase 1 is disjoint: no active plan on `origin/main` lists its files | footprint scan |
| M1 a second bridge | **fixed** (the existing bridge is reused). The bridge contract needs a data line kind (N14) | `doctor-bridge.v1.json` `lines` |
| M2 two validators | **partly fixed.** The authority is named, but the discovery stages differ: `shaping` here, `discovery\|exploring` in Node (N13) | `src/state/decision-question.mjs:30` |
| M3, M5, M6, M7, M8, M9, M10, L1-L5 | **fixed** | QP-1, QP-2, QP-4, QP-11, QP-13, QP-14, QP-19 |
| M4 no "not acked yet" | **fixed on one machine, broken across machines** (N5) | |
| L6 contract check | **still pending.** It must run on the main checkout before `ready` | |

## B. New and remaining findings

### High

**N1. The Event Store is Linux-only, so `fgos questions` stops working on macOS and Windows.**
- The store spec says "Linux only. Every other platform, macOS and Windows included, is refused with
  `event-store-unsupported-platform`" (`docs/platform/event-store/spec.md:649`, `lifecycle.rs:20`).
- Today's markdown reader works on every platform. After phase 4, the verb, the hook, S04 and Miu's batch cannot ask
  or answer at all on a Mac. fgOS supports macOS. The plan checks only that it compiles for `aarch64-apple-darwin`.
- QP-2 says the move "removes" problems, but this new cost is not mentioned anywhere: not in Risks, not in Owner
  questions. The planner changed the storage half of OQ-D2 without asking. With this cost included, that change is no
  longer a clear pick.
- Fix: state the support matrix in QP-2, the spec and the CHANGELOG. Add `event-store-unsupported-platform` to
  `refusals.v1.json`, and make the list print it and still show the work sources. If macOS asking matters now, put the
  trade-off to the owner as one decision question, against backlog `p-zsy3fmbcpd`.

**N2. Head-request verbs run in a Node child, not in `head_request.rs`. QP-22 and phase 8 serve them in the wrong
place.**
- `head_request.rs:1-8` says the module is "only transport and enforcement", and that what a verb means is "the Node
  payload behind `fgos internal head-request`".
- Each request execs `<hostBin> internal head-request`, which runs `src/session-host/head-request.mjs`
  `runHeadRequest` (`head_request.rs:31,505-566`; switch at `head-request.mjs:89`).
- If phase 8 serves `questions *` in `head_request.rs`:
  - `fgos-run-supervisor` must link `fgos-questions` and an Event Store adapter;
  - its `Cargo.toml` and `Cargo.lock` are not in phase 8's footprint;
  - the module's own contract text breaks.
  If the verbs go through the Node child instead, `head-request.mjs` is not in any footprint.
- The step environment of the route child carries no `CLAUDE_CODE_SESSION_ID`. The asker's session id therefore comes
  from Identity's role-to-session step (the `role` rule in the contract), not from "the envelope" as phase 8 step 2
  says.
- Fix: decide the serving point explicitly. The smallest choice keeps the transport untouched: add one Rust branch
  in the host's `internal head-request` route for `questions *`, before the Node exec. That branch uses the host's
  Event Store adapter (N6), and the asker is resolved from the Identity role the supervisor already checked. Add the
  files to phase 8, plus a client retry on `busy`, because one request runs at a time and a secretary `head start` can
  hold the socket for up to 45 s (`head-request.v1.json` `order`).

**N3. QP-16 cites an agent detector that does not exist.**
- `resolve::ancestry_cli(env_var, tree, pid)` returns `Some` only when `env_var == PI_SESSION_ID`, and only to tell pi
  from omp (`resolve.rs:191-219`). It cannot say "an agent CLI is in my ancestry", and it is driven by the env.
- So the round-1 bypass (`env -u CLAUDE_CODE_SESSION_ID ...`) is still open, and phase 3 step 4's
  `isAgent from ancestry_cli` cannot be built as written.
- Fix: name the real mechanism. Either write a new ancestry walk over `ProcessTree::comm` that looks for
  `claude|codex|omp|pi|agy` (new code in Identity, so add `resolve.rs` and its tests to the footprint), or drop the
  ancestry claim and keep the env rule, labelled "guards against mistakes". Either way, QP-16's citation must change.

**N4. The `answers:<question id>` role fails Identity validation, and neither plan owns making it valid.**
- `role_problem` accepts only `lead:`, `work:` and `head:` (`directory.rs:37-41,171-182`). Any other prefix gets
  `invalid-identifier`. A new role kind also needs a Convention identifier in
  `packages/convention/contracts/convention.rules.v1.json`.
- This plan lists "starting the successor with role `answers:<id>`" as a supervisor non-goal. The supervisor plan says
  phases 12 and 18 "use whatever the question plan lands for setting that role" (`plan/supervisor` plan.md, Handoff
  update 2). Each plan points at the other.
- Fix: this plan owns the role kind. Add `("answers:", "question-id")`, the Convention rule, `directory.rs`, the
  Identity tests and the spec to phase 2 or 3. Cover it in acceptance 2 with a real `register` of that role, not a
  fixture string. Tell the supervisor planner that only the start-time `register` is theirs.

**N5. The wake detection reads Observe, and Observe does not sync, so QP-2's cross-machine benefit stops at the
supervisor.**
- QP-12 and phase 5 run `question-answered` over the `fgos.question.answered` and `fgos.question.acked` Observe
  records. Each record is written on the machine where that action happened. Observe shards are never synced (round-1
  H4).
- Example: the owner answers on machine B (gateway or Miu), and the asker acks on machine A.
  - B's watcher sees "answered, no ack" and wakes a successor for a question that was already taken.
  - A's watcher never sees the answer, so an idle asker on A is never woken.
- Fix: base the detection on the store fold. One way is a `--unacked` read of `fgos questions --json` that the watcher
  runs. Another is to emit the Observe `answered` record on the asker's machine when the event is taken in after a
  fetch. Or state that the wake works on one machine only, and add a backlog row. Say which in QP-12, and tell the
  supervisor planner.

### Medium

**N6. Phase 3 builds a second Event Store adapter instead of reusing the host's.**
- Identity's pattern is a port in the crate and the adapter in the host: `apps/fgos/src/wiring/identity_log.rs`. That
  file says Identity cannot link the store. Its `StoreLogDoor::open_stream(dir, writer, stream)` is already generic,
  and the mailbox reuses it (`mailbox_ingest.rs:23`).
- Phase 3 steps 1 and 3 instead give the crate a dependency on `fgos-event-store` and its own adapter. That copies
  the write admission (`admit_write`), the cursor and the incomplete-history refusal (`identity_log.rs:117-213`).
- Fix: the crate keeps `QuestionLog` as a port, and the host wiring opens `project:questions` through
  `StoreLogDoor::open_stream`. Put that in phase 4's `wiring/questions.rs`, and phase 3's tests use an in-memory log, as
  `packages/identity/rust/tests/shared.rs:341` does. This also settles N2's adapter question.

**N7. The hook reads the whole stream on every prompt and every stop, and nothing proves it can read inside a
sandbox.**
- `read()` without a checkpoint walks from zero every time (`read.rs:468-540`).
- The mailbox keeps Event Store reads out of its hook on purpose ("Never in the hook", `mailbox_ingest.rs:1-4`) and
  reads a local record that a detached sync child fills.
- `fgos identity list`, which reads the same kind of stream, takes 220-245 ms here today. That cost grows with the
  history and lands on every turn of every session.
- Inside a head, `GitDriver::new(state_root)` creates the state root when it is missing (`git/rust/src/driver.rs:266-
  272`), while the sandbox mounts `/` read-only (`confinement/resources.mjs:516`). The hook then silently prints
  nothing forever.
- `event-store-incomplete-history` also makes the hook fail silent until a sync.
- Round 1 asked for a hook test inside a confined head. It was not added.
- Fix: add an acceptance-5 case that runs the hook under the bwrap driver with a read-only root. Set a latency budget
  for the hook and measure it in phase 6. Consider the mailbox's split, where the sync child folds answered-unacked into
  a small per-clone file that the hook reads. A head can read that file.

**N8. Footprint gaps.** The revision introduced files the plan does not own:
- `package.json` `files`: `test/event-store/consumers.test.mjs` ("every contract file the manifest names ships in the
  release payload") fails until `packages/questions/contracts/question-event-streams.v1.json` is listed.
- `src/session-host/head-request.mjs`, or `packages/run-supervisor/rust/Cargo.toml` plus `Cargo.lock` (N2).
- `packages/identity/rust/src/directory.rs` and `convention.rules.v1.json` (N4).
- `packages/identity/rust/src/resolve.rs`, if N3 adds a walk.
- Phase 3 step 1 gives the crate "a layer entry in the architecture manifest". The manifest's `tiers` and `layers`
  cover only Node `src/` paths, and no Rust crate row exists. Drop that step, or name the guard that checks crate
  dependencies.

**N9. The gateway answer runs with the starting agent's session env.**
- `fgos gateway start` does detach (`setsid` through `spawn_detached`, `gateway_control.rs:453-460`), so phase 7's
  step-0 check passes.
- But it removes only the recursion guard (`:113`). The gateway and every `fgos questions answer` child inherit
  `CLAUDE_CODE_SESSION_ID` and the other session variables of whichever agent ran `gateway start`. Under any
  env-based agent test (N3), REST answers are refused or credited to that agent.
- The gateway also already records callers as `--source gateway:<caller>` (`Caller::source`, `gateway.rs:448-450,953,
  979`). The plan invents `--via gateway:`.
- Fix: the answer handler clears the four `ENV_ORDER` variables for its child, or the use case takes `by=owner` from
  an authenticated `--source gateway:*` given by a process whose parent is the registered gateway pid. Reuse
  `--source`, not `--via`, for the gateway path.

**N10. Nothing says when question events are published.**
- Appends land in local open segments. Other machines see them only after a seal and a push. The mailbox starts its
  detached sync child after each send (`mailbox_remote.rs:5,794`). Otherwise publishing depends on the invocation
  door's maintain timer (`invocation_doors.rs:61-85`).
- Automatic triggers never run in a dispatched worker (`event-store/spec.md:644`), which can include socket route
  children.
- "At the Event Store's sync pace" (non-goals) is therefore undefined for an answer given through the gateway.
- Unsealed events are lost with the disk (`spec.md:653`).
- Fix: QP-2 names the trigger. Either the `questions` route declares the Event Store maintain policy, or `answer`
  and `ask` start the existing detached sync child (the door row "start a detached Event Store child" allows only its
  owner). Add the store's refusals (`event-store-unavailable`, `-write-refused`, `-incomplete-history`,
  `-append-failed`) to `refusals.v1.json`. A head cannot run `fgos events sync` itself, so the socket path must print
  the reason for the owner to act on.

**N11. The `Stop` hook blocks every turn until the ack, Miu's turns included.**
- Every stop where the flag is false costs one forced extra model turn, until the ack. The owner talks to Miu, so
  each of Miu's replies to the owner gets a forced continuation while any of its own questions waits for an ack.
- Fix, still stateless: Claude Code's `Stop` input carries `transcript_path`. Block only when the answer's id is not
  already in that transcript. The read is read-only and has no state to write. Add that case to acceptance 5.

**N12. The cutover has to invent the five parts.**
- Open `QUESTIONS.md` rows and draft-plan questions mostly lack options, gain, harm and cost. A `plan:` ref has no
  discovery exception. So the phase 9 leader must write option content for questions it did not ask, under QP-19.
- Fix: phase 9 step 2 already sends plan questions to their planners. Do the same for discussion rows: their
  shaper re-asks them, or the secretary does when that shaper is closed. The cutover leader asks only rows whose text
  already passes QP-19, and records the rest as handed off in `integration.md`.

### Low

- **N13.** Discovery stages differ: QP-19 uses `stage: shaping`, and Node uses `discovery|exploring`
  (`decision-question.mjs:30`). Use the same set, or name the difference in the backlog row `p-wgbzcazoak`.
  `parts.recommendation` and the option flag `recommended: true` say the same thing twice; make one derive from the
  other.
- **N14.** The bridge protocol has only `row`, `fix`, `end` and `refusal` lines (`doctor-bridge.v1.json`).
  `work-questions` needs a data line kind and vectors, so state that in phase 4 step 2. The bridge "ends with the last
  Node-owned row" (S7), and this request now blocks that retirement. Record it on the S7 row.
- **N15.** `head-grants.mjs` has only `secretary` and `shaper` (`:21-26`). Put the three `questions` verbs in a shared
  frozen list, like `ROTATION_VERBS`, so the personas the supervisor plan adds in its phase 9 inherit them.
- **N16.** QP-4 settles a conflict by `answeredAt`, which is wall-clock time. Identity folds "in the store's
  deterministic order (never by timestamp)" (`shared.rs:49-51`). Use the store order.
- **N17.** DISCUSSION acceptance 4 says S04 "shows and answers the same set". Gates are shown but not answered. The
  Work-on-hold frame justifies that, so list it as a stated deviation next to OQ-D4, not only as a non-goal.
- **N18.** The plan cites `origin/plan/supervisor` `07a741621` in QP-9, Footprint across plans and the H5 answer.
  Replace it with the pushed commit that holds Handoff update 2 (`31acf2896` today, unpushed).

## C. Checked and fine

- An Event Store consumer can register and append from Rust. The registry embeds `consumers.v1.json` at build time
  (`event-store/rust/build.rs`, `registry.rs:55-63`). `question.*` under domain `questions` passes the
  domain-prefix and `project` scope rules (`registry.rs:85-120`).
- A head can read the store paths. The sandbox is `--ro-bind / /`, and the store lives in the Git common dir, outside
  any mask. `read()` writes nothing without a checkpoint. The caveat is `GitDriver::new` (N7).
- The Rust client of the head socket exists: `fgos_run_supervisor::head_client::request_head`, already used by
  `session_rotation_hook.rs:13,238`. The CLI-side forwarding should name it.
- The socket verb names `questions <x>` follow the "socket verbs mirror CLI verbs" rule (session-verb SV-9).
- The 60 s bound is ample for one append and one Observe write.
- The `stop_hook_active` handling matches the mailbox adapter (`mailbox/.../adapters/claude.rs:12-18`).
- Mint: phase 2's verify works, because the refusal comes from the crate, not from the manifest enum (`fgos identity
  mint bogus` gives `unknown-kind`).
- Waves: every phase sits after its dependencies. Within a wave, footprints are disjoint (wave 3: `apps/fgos`, `src`
  and the census against `core/questions`; wave 4: the hook files against the gateway). The census, manifest and
  route files have one writer per wave.
- The supervisor plan's content agrees with the bare verb, `core/questions/definitions` in its watcher defaults
  (`phase-04-config-keys.md:17,30`), `blockedBy` this plan, and no supervisor acks.
- QP-19 is workable: every rule can be measured, counts characters, and is held as data.
- Install/setup/doctor gate: no new config key, no new doctor row (the existing `*-hook-wired` rows are extended), the
  setup files are in the footprint, and the CHANGELOG is in phase 10. The only gap is the platform statement (N1).
- One door: the bridge, the observe write door, mint and the hook kind are reused. N6 is the exception.
- L10: `--open` gets no alias, and every caller moves. RUL104 does not apply: this is a settled new component, not a
  hardening pass.
- DISCUSSION acceptance:
  - 1, 2, 3, 6 and 8 are covered;
  - 4 is covered except gate answering (N17);
  - 5 is covered on one machine (N5, N7);
  - 7 is covered, with the N12 caveat.

Status: DONE_WITH_CONCERNS
Summary: Most round-1 fixes are real, but the plan is not ready. The Event Store is Linux-only, head verbs run in a Node child, the ancestry detector does not exist, the `answers:` role fails Identity validation, and the wake reads Observe, which does not sync.
