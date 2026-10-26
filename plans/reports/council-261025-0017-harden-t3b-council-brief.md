# HARDEN T3 part 04b council brief: Event Store (shared by every seat)

Big lead: `lead:HARDEN` `claude-p74h@fg-server2`, 2026-10-25 00:20 (Asia/Saigon). Repository `/home/vantt/projects/forgent`, branch `main` at `c7522c86d` or later. The Work cutover onto the Event Store landed on 2026-10-24 (fg-server2; the other machines follow WORK's guide), and T3 part 04a landed at `48a45a5f5`. Reports go to `/home/vantt/projects/forgent/plans/reports/`. You may answer in English.

This is the council for layer **T3, part 04b**: the **Event Store**. It covers:
- `packages/event-store/rust`;
- the addon namespace `packages/git/node-addon/src/event_store.rs`;
- the Node facade and consumers: `src/event-store/*`, the `src/state` consumer files, `src/verbs/events/*`, `src/setup/event-store-*.mjs`, the detached seal child `src/cli/detached-child.mjs`;
- the doctor rows and setup fixes of the store.

You are one seat, and you are **read-only**:
- edit no source, test, spec or config file;
- make no git mutation;
- **never run a verb that appends, seals, syncs, fetches, migrates or rebuilds in this repository.**

The only file you may write is your own seat report, at the path your seat prompt names.

**Warning.** `fgos list`, `fgos show` and `fgos events status` run an opportunistic sync when one is due, and that fetches from the remote. Do not run Work read verbs in the real repository either. Read the code instead. Where you must run something, use a throwaway clone under `/home/vantt/projects/forgent-worktrees/<your-seat>-clone` (ext4, never `/tmp`) and delete it at the end. The baseline found that a fresh clone refuses the store (see below), which is itself an input.

## Read first, in this order

1. `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`: §2 (axes A–G, severity, evidence rule), §3 (gates), §4.3 (Rust move criteria), §4.7 (dead code, tests, Rust priority).
2. `plans/261021-1118-harden-low-layers-bottom-up/plan.md`:
   - "The per-layer loop", step 2 (what each seat returns);
   - "Size rule";
   - "Owner decisions" 1–32;
   - the hand-off ledger: H30, H31 (A is done at `c42f30dc1`) and H33 (the legacy friction fence, WORK's).
3. `plans/261021-1118-harden-low-layers-bottom-up/phase-04-t3-agent-protocol-observe-event-store.md`, including the section "04b council inputs".
4. **The baseline:** `plans/reports/research-261024-2352-harden-t3b-event-store-baseline.md`. Re-check any number you rely on. Facts in it that the council must answer:
   - a read verb pays for an opportunistic sync (2.97 s against 0.84 s warm);
   - `fgos list` spawns 11 git children and takes 0.84 s;
   - the 20-session write benchmark failed once with `hot-lock-timeout` at 5 000 ms;
   - a fresh clone fails every read with an opaque `event-store-io: NotFound` until `.git/fgos/events` exists, and refuses writes with `git-wal-unreadable: repository-identity-changed`;
   - 11 Windows test targets fail to compile.
5. The WORK/ES plan `plans/261018-0945-event-store-fgos-event-store/plan.md`:
   - its decisions;
   - "Hand-offs received for after the cutover";
   - its open follow-ups.
6. Specs and laws:
   - `docs/platform/event-store/spec.md`;
   - `docs/specs/reading-map.md`;
   - `docs/platform/component-boundary.md` (Event Store row);
   - `docs/platform-foundations.md` L1–L3 (log versus state, two-tier memory, truth in JSONL with the db as a view);
   - `core/instructions/design-principles.md`.

Then read **every line** of the code in scope:
- the Rust crate (about 7.8 k src and 9.0 k test lines);
- the addon namespace;
- the Node files listed above.

## Decisions already made (do not reopen)

- **Event Store direction:** owner decision direction B. Per-machine git refs, the cache as a view, the claims runtime, three machines. Details are in WORK's plan and the ES spec.
- **The cutover is landed.** Do not propose changes to the cut commit or to migration history. The legacy friction fence is H33 (WORK, one release after the cutover).
- **Owner, 2026-10-21 12:05:**
  - foundations go fully to Rust;
  - T0–T4 end with no deciding logic in Node;
  - Node reaches Rust through the in-process door where a hot path or a wait is involved;
  - stop-everything landing;
  - old data needs one read path.
- **The state store's hot mutex** (`withStateTx` in `src/state/hot-lock.mjs`) belongs to the state store until it moves to Rust (component-boundary). Say whether the Event Store still needs it after the cutover, with evidence. Do not redesign it here.
- **WORK owns the store's semantics.** HARDEN reviews after the store layer is done, not alongside. Findings that change semantics are proposals with evidence; WORK reviews any landing.
- **RUL104:** better, not bigger. No new feature, layer or mechanism. A contract change moves every caller and deletes the old path in the same change (L10). Every idea that adds something goes into "proposed additions", with the problem, the evidence and the benefit.
- **Doctor:** no new row unless it replaces one. Ten store rows exist today.

## What every seat returns

The same sections as the T3-04a brief (`plans/reports/council-261024-1927-harden-t3a-council-brief.md`, "What every seat returns"):
- **Part A:** the target shape of the Event Store. It covers:
  - what it is the authority for;
  - its contract and ports;
  - the Rust/Node boundary and the Node budget in lines and exports;
  - the delete list;
  - the doctor rows it keeps;
  - its size target.
- **Part B:** findings, each with id, axis, severity, reproduced or inferred, `file:line`, what goes wrong, and the fix shape.
- **The tables:** migration (with the receiving layer), delete list, doctor, and tests.
- **Proposed additions.**
- **Rejected hypotheses.**
- **The status block.**

Put `git rev-parse --short HEAD` at the top. A finding without `file:line` is not a finding.

Questions every seat should cover for its lens:
- **Fresh clone.** Why does a fresh clone of a project that uses fgOS fail every read with `event-store-io: NotFound`, and refuse writes with `repository-identity-changed`? This is mission #1: every user project gets cloned. What should the store do on first use, inside existing code: a named refusal with a next step, or the setup fix it already has?
- **Read cost.** Why does a read verb sync, and is that the store's rule or a caller's choice? What do the 11 git children of `fgos list` do, and which are repeats?
- **Write path under contention.** Is the 20-session `hot-lock-timeout` a real limit, a benchmark artefact (dev profile, strace), or a lock held across I/O?
- **Node twins.** Does any Node file still decide something the store decides?
- **Windows.** Which test targets need `cfg(unix)` gating, and does any lib path on Windows silently differ?
- **The detached seal child.** Is it bounded, and can it be orphaned?

## Rules for every seat

- **Read-only.** Report only what you saw yourself, and say what you ran.
- **Commands:** run only commands that read, plus focused tests if you need them to reproduce a finding.
  - `cargo test -p fgos-event-store` must use a private `CARGO_TARGET_DIR` on ext4 at `/home/vantt/projects/forgent-worktrees/<your-seat>-target`. **Never** put it under `/tmp`, and never share it.
  - Never run the whole `npm test`, `scripts/run-tests.mjs` or `cargo test --workspace`.
  - Node test files run only through `node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; const r=runChosenTests([...]); process.exit(r.status)"` with `PATH=$HOME/.cargo/bin:$PATH`.
  - Run any `fgos …` command with `</dev/null`, and only in a throwaway clone, never in the real repository.
- **Hooks** block the words `node_modules`, `.git`, `target` and `build` inside commands, so put such paths in a shell variable.
- **Timings:** record the load average beside any timing.
- No `--yagni` flag was passed: deliver the full scope above, and add nothing it does not ask for.
