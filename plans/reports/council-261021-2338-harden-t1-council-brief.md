# HARDEN T1 council brief (shared by every seat)

Big lead: session `forgent-a8`, 2026-10-21 23:50 (Asia/Saigon). Repository: `/home/vantt/projects/forgent`, branch `main` (T0 is merged as `7d1f1c1b2`). Reports go to `/home/vantt/projects/forgent/plans/reports/`. Timezone Asia/Saigon. You may answer in English.

This is the council for layer **T1** of the HARDEN lane: **Holder-lock, Session Identity, Convention**, plus the review of the state store's hot mutex (`src/state/hot-lock.mjs`). You are one seat. You are **read-only**: edit no source, test, spec or config file, and make no git mutation. The only file you may write is your own seat report, at the path your seat prompt names. Out-of-process seats return the report as their final answer instead.

## Read first, in this order

1. `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`:
   - §2: axes A–G, severity, evidence rule;
   - §3: gates 1–9;
   - §4.3: Rust move criteria;
   - §4.7: dead code, tests, Rust priority.
2. `plans/261021-1118-harden-low-layers-bottom-up/plan.md`:
   - "The per-layer loop", step 2: what each seat returns;
   - "Size rule";
   - "Owner decisions" 1–8;
   - the two ledgers (hand-offs, and items handed to HARDEN).
3. `plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md`, the whole file. It holds the T1 inventory leads, doctor rows, constraints, and the section **"Received from other lanes"**, whose items are all in scope:
   - T0's size debt;
   - T0-R1 and T0-R2;
   - HL-N8/N9.
4. How T0 ended (this layer builds on it):
   - `plans/reports/closing-261021-2213-harden-t0-process-facts-door.md`;
   - `plans/reports/council-261021-1507-harden-t0-arbitration.md` §2 (the T0 shapes, now in the specs).
5. Specs and laws:
   - `docs/platform/holder-lock/spec.md`, `docs/platform/session-identity/spec.md`, `docs/platform/convention/spec.md`;
   - `docs/platform/process/spec.md`, the T0 door;
   - `docs/platform/component-boundary.md`;
   - `core/instructions/design-principles.md`.

Then read **every line** of the code in scope:
- **Rust:**
  - `packages/holder-lock/rust/**` (≈ 5 400 lines of src), `packages/session-identity/rust/**`, `packages/convention/rust/**`, and their `contracts/`;
  - the host routes that serve them in `apps/fgos/src/**`.
- **Node:**
  - `src/holder-lock/*` (10 files), `src/runner/lock-fence.mjs`, `src/state/hot-lock.mjs`;
  - `src/util/session-identity.mjs`, `src/convention/*`;
  - every Node site that resolves `.fgos` or the state root on its own (`rg -l "path\.join\([^)]*'\.fgos'" src bin` is the starting inventory).

## Decisions already made (do not reopen)

- **Owner, 2026-10-21 12:05:**
  - foundations go fully to Rust, cost accepted, so T0–T4 end with no deciding logic in Node;
  - Node reaches Rust through the **in-process door** (the T0 addon, `src/native/door.mjs`) wherever a hot path or a lock wait is involved; cold paths may keep a host route;
  - stop-everything landing on every workspace and both machines;
  - old data needs one read path; fences and drains live one release, then go.
- **The state store's hot mutex stays in Node until the WORK lane lands** (owner decision 3). T1 reviews it and may fix Critical/High defects in it, but does not move it. `src/state/hot-lock.mjs` lines in the staging region (`tx.*`, the WORK-owned part) are WORK's, so check WORK's current edits before proposing changes there.
- **SEAT has not landed.** SEAT changes `src/util/session-identity.mjs`, `src/convention/*` and `packages/convention/*`. The council may review them; edits wait until SEAT lands.
- **Out of scope:** `src/state/events.mjs` and `src/state/legacy-event-git-adapter.mjs` (WORK); Git internals (T2); run supervisor (T4); new features; OPC.
- **RUL104:** better, not bigger. No new feature, layer or mechanism. A contract change moves every caller and deletes the old path in the same change (L10). Any idea that adds something goes into a separate "proposed additions" section with problem, evidence and benefit, for the owner to pick.
- **T1's size target carries T0's debt** (owner 23:37): T0 + T1 together must end ≤ 0. T0 is ≈ +150 lines.

## What every seat returns

Your report has these sections, in this order. Every finding cites `file:line` on current `main`; put `git rev-parse --short HEAD` at the top of your report. A finding without `file:line` is not a finding.

### Part A: target shape per component (decide first)

For each component, propose:
1. what it is the **authority** for, in one sentence;
2. its **contract and ports**: named functions and routes, and their error names;
3. the **Rust/Node boundary** and the **Node budget** (lines or exports of the thin Node client that may remain), stating which calls go through the in-process door and which keep a route;
4. the **delete list**: mechanisms, Node copies, routes, checks, tests, doctor rows, setup steps, instruction text;
5. the **doctor rows it keeps**: one or a few, named after the component;
6. a **size target** (net Δ Node, Rust, tests) that, summed over the layer, pays back T0's ≈ +150.

The components are:
- **Holder-lock**, including the lock-fence verb and `src/holder-lock/fences.mjs`. Under the compatibility decision, say which fences can go now.
- **Session Identity.**
- **Convention.**
- **The one state-root / `.fgos` lookup door.**
- **The hot mutex.** Review only: list its defects and what WORK will need from T1.

### Part B: findings against that shape

Review against axes A–G (proposal §2.1), through your seat's lens. Per finding, give:
- id;
- axis;
- severity (Critical/High/Medium/Low per proposal §2.2);
- **reproduced** or **inferred**. An inferred finding cannot be rated above Medium until it is reproduced; say how to reproduce it (a red test, a script or a command);
- `file:line`;
- what goes wrong, and when;
- the fix shape. A fix that adds something must name what it replaces.

Cover the received items:
- **HL-N8/N9:** a proof per bytes-equal check, and whether both checks are needed;
- **T0-R1:** the N-API canonical JSON cost;
- **T0-R2:** the durable door's unnamed `mode` error;
- **T0's size debt:** where T1 or the T0 code can shrink, such as N-API boilerplate in `packages/git/node-addon/src/{process,durable_file,canonical_json}.rs`, or phase-1 red tests that duplicate post-fix owning tests.

### Tables

- **Migration table:** Node part | what it decides | move or not | reason | order | Node budget after the move.
- **Delete list:** each candidate with evidence that nothing needs it: `rg` or GitNexus showing no caller, plus a run where possible.
- **Doctor table:** each fail/warn condition of the T1 rows, and which surviving row keeps it. No condition may be lost silently.
- **Tests table:** the owning proof per behaviour, Node↔Rust duplicates (reuse TEST's labels: TEST phase 2 for holder-lock landed on main `ff24dbde3`), time-based waits, tests that should move down a layer, and tests to retire, each naming the test that will own its behaviour.

### Rejected hypotheses

List what you checked and found fine.

End your report with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

## Rules for every seat

- Read-only. Report only what you saw yourself, and say what you ran.
- Run only commands that read, plus focused tests if you need to reproduce a finding:
  - `cargo test -p <crate>` with a private `CARGO_TARGET_DIR` **on ext4** under `/home/vantt/projects/forgent-worktrees/<your-seat>-target`. **Never under `/tmp`**: it is a 16 GB tmpfs shared by every session;
  - `node --test <file>`, after staging the addon the way `scripts/lib/git-addon-stage.mjs` `ensureGitAddon(env, cwd)` does.
- Never run the whole `npm test`: the machine is shared. Run every `fgos …` command with `</dev/null`.
- Hooks block the words `node_modules`, `.git`, `target` and `build` inside commands; put such paths in a shell variable.
- No `--yagni` flag was passed. Deliver the full scope above, and add nothing it does not ask for.
