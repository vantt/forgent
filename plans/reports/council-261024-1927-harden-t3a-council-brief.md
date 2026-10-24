# HARDEN T3 part 04a council brief (shared by every seat)

Big lead: `lead:HARDEN` `claude-p74h@fg-server2`, 2026-10-24 19:40 (Asia/Saigon). Repository: `/home/vantt/projects/forgent`, branch `main` at `330c5242a` or later. T0, T1 and T2 are closed; T2 closed on 2026-10-24 (owner decision 28). Reports go to `/home/vantt/projects/forgent/plans/reports/`. You may answer in English.

This is the council for layer **T3, part 04a** of the HARDEN lane: the **Agent protocol** (`packages/agent-protocol/rust`) and **Observe** (`packages/observe/rust`, its host wiring, and `src/observe/*`). Part 04b, the Event Store, is **out of scope**: it waits for the Work cutover. You are one seat. You are **read-only**: edit no source, test, spec or config file, make no git mutation, and write nothing under `.fgos/`. The only file you may write is your own seat report, at the path your seat prompt names.

## Read first, in this order

1. `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`: §2 (axes A–G, severity, evidence rule), §3 (gates 1–9), §4.3 (Rust move criteria), §4.7 (dead code, tests, Rust priority).
2. `plans/261021-1118-harden-low-layers-bottom-up/plan.md`: "The per-layer loop" step 2 (what each seat returns), "Size rule", "Owner decisions" 1–29, and the hand-off ledger (look for rows that name T3, T4 or the run supervisor).
3. `plans/261021-1118-harden-low-layers-bottom-up/phase-04-t3-agent-protocol-observe-event-store.md`, the whole file (its line numbers may be stale).
4. **The baseline:** `plans/reports/research-261024-1927-harden-t3a-baseline.md`. It has LOC, route latency, tests, doctor rows, backlog rows, and a list of Node↔Rust duplicates in §6 that nobody has judged yet. Re-check any number you rely on.
5. How T2 ended: `plans/reports/closing-261023-2228-harden-t2-git-terminal-control.md`.
6. Specs and laws:
   - `docs/platform/agent-protocol/spec.md`;
   - `docs/specs/observe.md`;
   - `docs/platform/component-boundary.md` (the rows for both components and for the run supervisor);
   - `docs/specs/reading-map.md`;
   - `core/instructions/design-principles.md`.

Then read **every line** of the code in scope:
- **Rust:**
  - `packages/agent-protocol/rust/**` (≈ 2.0 k lines);
  - `packages/observe/rust/**` (≈ 7.7 k lines) and its contracts;
  - the host wiring that serves Observe in `apps/fgos/src/**` (`main.rs` descriptors and providers, `cli_projector.rs`, `wiring/friction_sources.rs`, `wiring/metrics_sources.rs`);
  - the agent-protocol call sites in `packages/run-supervisor/rust/src/supervise.rs` and `supervise/terminal.rs`. Read these as the protocol's consumer only; the supervisor itself is T4.
- **Node:**
  - `src/observe/*`;
  - the Node sites that name agent outcomes or provider states again. Start from the baseline's §1 and §6: `src/run-supervisor/steps/settle-attempt.mjs`, `src/runner/dispatch/usage-parsers.mjs`, `provider-adapter.mjs`, `provider-auth-failure.mjs`, `trust-store.mjs`, `settlement.mjs`, `herdr-round.mjs`. Find more with `rg` on `usage-limit|trust-dialog|needs-human|quota|login|provider-limit`.

## Decisions already made (do not reopen)

- **Owner, 2026-10-21 12:05:**
  - foundations go fully to Rust, cost accepted; T0–T4 end with no deciding logic in Node;
  - Node reaches Rust through the in-process door where a hot path or a wait is involved, and cold paths may keep a host route;
  - stop-everything landing;
  - old data needs one read path; fences and drains live one release.
- **Owner decision 10:** the checkout channel `node bin/fgos.mjs` is unsupported for process, lock and identity verbs.
- **Layer boundaries:**
  - the run supervisor is **T4**;
  - dispatch, seats and the runner loop are **T5**;
  - the Event Store and Work are **WORK/ES**.

  T3 settles **what the agent protocol is the authority for** and **who may name an outcome**. When a Node twin lives inside T4 or T5 code, say which layer moves it and hand it over (name the receiving layer in the migration table); do not plan T4/T5 rewrites here.
- **WORK's Event Store cutover is pending** on `work/es-cutover`. Observe and friction may write through the state store; do not propose changes that collide with the cutover without saying so.
- **RUL104:** better, not bigger. No new feature, layer or mechanism. A contract change moves every caller and deletes the old path in the same change (L10). Put every idea that adds something into a separate "proposed additions" section, with the problem, the evidence and the benefit, for the owner to pick.
- **Doctor:** do not add rows for a dormant component. The failing `agent-cli-project-trusted` row is a machine setup fact (codex trust entry), not a code defect, unless you show otherwise.

## What every seat returns

The same sections as the T1 and T2 briefs (`plans/reports/council-261021-2338-harden-t1-council-brief.md`, "What every seat returns"):

- **Part A:** the target shape per component, covering:
  - what it is the authority for;
  - its contract and ports;
  - the Rust/Node boundary and the Node budget in lines and exports;
  - the delete list;
  - the doctor rows it keeps;
  - its size target.
- **Part B:** findings, each with:
  - id;
  - axis;
  - severity;
  - whether it is reproduced or inferred;
  - `file:line`;
  - what goes wrong;
  - the fix shape.
- **The tables:**
  - migration: Node part, what it decides, move or not, reason, order, receiving layer, and the Node budget after the move;
  - delete list;
  - doctor;
  - tests: the owning proof per behaviour, Node↔Rust duplicates, time-based waits, and tests that should move down a layer.
- **Proposed additions,** kept separate from the rest.
- **Rejected hypotheses.**
- **The status block:**

  ```text
  Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
  Summary: one or two sentences
  Concerns/Blockers: optional
  ```

Put `git rev-parse --short HEAD` at the top. A finding without `file:line` is not a finding.

Questions every seat should cover for its lens:
- **Agent protocol:**
  - Is it the single place that turns an agent CLI's output or screen into an outcome?
  - Which Node regexes or word lists re-derive the same outcome? `settle-attempt.mjs` matches Rust reason strings by regex.
  - Are the per-CLI adapters (9–17 lines each) one table or many copies?
- **Observe:**
  - Is it the one authority for friction, metrics, the scorecard and the journals?
  - The `metrics coverage`, `runs` and `harness` routes cost 1.0–1.4 s because they scan 445 assignment directories. Is that scan bounded, is it done more than once per call, and does the doctor row pay for it?
  - Is `store_lock_multiprocess.rs`'s 35 s a real wait or a time-based test?
  - Can `friction-client.mjs` (194 lines) shrink to a thin client?

## Rules for every seat

- **Read-only.** Report only what you saw yourself, and say what you ran.
- **Commands:** run only commands that read, plus focused tests if you need them to reproduce a finding.
  - `cargo test -p <crate>` must use a private `CARGO_TARGET_DIR` **on ext4** at `/home/vantt/projects/forgent-worktrees/<your-seat>-target`. **Never** put it under `/tmp`, and never share it with another checkout.
  - Never run the whole `npm test`, `scripts/run-tests.mjs` or `cargo test --workspace`; the machine is shared.
  - Run every `fgos …` command with `</dev/null`.
  - **Never run an `fgos` verb that writes:** no `metrics snapshot`, no `friction` record or resolve, no Work verb, no runner, no workflow. Read the verb's source before you run it.
  - Hooks block the words `node_modules`, `.git`, `target` and `build` inside commands, so put such paths in a shell variable.
- **Timings:** if you take any, record the load average beside them.
- No `--yagni` flag was passed: deliver the full scope above, and add nothing it does not ask for.
