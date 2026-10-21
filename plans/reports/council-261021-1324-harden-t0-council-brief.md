# HARDEN T0 council brief (shared by every seat)

Big lead: session `forgent-a8`, 2026-10-21 13:30 (Asia/Saigon). Repository: `/home/vantt/projects/forgent`, branch `main`. Work context: `/home/vantt/projects/forgent`. Reports: `/home/vantt/projects/forgent/plans/reports/`. Timezone Asia/Saigon. You may answer in English.

This is the council for layer **T0** of the HARDEN lane: "Process Facts & Control + Containment port", plus the three leaf crates `host-runtime`, `canonical-json` and `durable-file`. You are one seat. You are **read-only**: you edit no source, test, spec or config file, and you make no git mutation. The only file you may write is your own seat report, at the path your seat prompt names (out-of-process seats return the report as their final answer instead).

## Read first, in this order

1. `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`, §2 (axes A–G, severity, evidence rule), §3 (gates 1–9), §4.3 (Rust move criteria) and §4.7 (dead code, tests, Rust priority).
2. `plans/261021-1118-harden-low-layers-bottom-up/plan.md`: "The per-layer loop" step 2 (what each seat returns), "Size rule", "Owner decisions".
3. `plans/261021-1118-harden-low-layers-bottom-up/phase-01-t0-process-facts-and-leaf-crates.md`: the whole file. It holds the T0 inventory (§A liveness/signal sites, §B atomic writes by contract class, §C canonical-JSON twins, §D doctor rows, §E tests), the T0 questions and constraints. The inventory was verified on `f453cd941`; main is now newer, so **re-check every `file:line` you rely on**.
4. `plans/reports/research-261021-1210-harden-t0-baseline.md`: measured latencies and sizes (the "before" table).
5. `plans/reports/research-261021-1210-harden-test-suite-investigation.md`: §4 (one CLI call's cost, including the per-process bwrap probe at `packages/process/rust/src/containment/linux.rs:44-61`), §7, §8, §9 (T0 test files).
6. `docs/platform/process/spec.md`, `docs/platform/component-boundary.md` (rows "Process Facts & Control (L0)" and "Containment port (L0)"), `core/instructions/design-principles.md`.

Then read **every line** of the code in scope:
- Rust: `packages/process/rust/**`, `packages/host-runtime/rust/**`, `packages/canonical-json/rust/**`, `packages/durable-file/rust/**`, and their `contracts/`.
- Node: `src/runner/dispatch/process-identity.mjs`, `src/util/unique-tmp-tag.mjs`, and every Node site named in phase 01 §A–§C.

## Decisions already made (do not reopen)

- **Owner, 2026-10-21 12:05.** Node reaches the T0 door through an **in-process binding** (N-API) with T0's own loader, so nothing spawns on a hot path. Cold paths may keep the host route. The addon ships for every supported target and the npm channel. Addon ownership is coordinated with the Git lane (`packages/git/node-addon`).
- **Compatibility.** Stop-everything landing on every workspace and both machines at once. Old data needs one read path only. Fences and drains live one release, then go.
- **The state store's hot mutex stays in Node until the WORK lane lands.** `src/state/hot-lock.mjs:290-394` (staging, `tx.*`) is WORK-owned and is being edited by WORK now. Only its liveness judging (`:57-99`) is T0.
- **Out of scope here:** `src/state/events.mjs` and `src/state/legacy-event-git-adapter.mjs` (WORK); `src/git/native.mjs`'s per-process addon re-hash (the GIT lane is fixing it); new features; the OPC operation-scoped containment lane (held).
- **RUL104:** better, not bigger. No new feature, layer or mechanism. A contract change moves every caller and deletes the old path in the same change (L10). Any idea that adds something goes into a separate "proposed additions" section with problem, evidence and benefit, for the owner to pick.

## What every seat returns

Your report has these sections, in this order. Every finding cites `file:line` on current `main` (`git rev-parse --short HEAD` at the top of your report). A finding without `file:line` is not a finding.

### Part A: target shape per component (decide first)

For each of the four components (`fgos-process` with the Containment port, `host-runtime`, `canonical-json`, `durable-file`), propose:
1. what it is the **authority** for (one sentence);
2. its **contract and ports** (named functions/routes and their error names);
3. the **Rust/Node boundary** and the **Node budget** (lines or exports of the thin Node client that may remain);
4. the **delete list** (mechanisms, Node copies, routes, checks, tests, doctor rows, setup steps, instruction text);
5. the **doctor rows it keeps** (one or few, named after the component);
6. a **size target** (net Δ lines for Node, Rust and tests; ≤ 0, or name the deletion that pays for any growth).

Also say, with your reasons, whether anything in `host-runtime` is really a Host & Surface (T9) concern rather than a T0 primitive.

### Part B: findings against that shape

Review against axes A–G (proposal §2.1), through your seat's lens. Per finding: id, axis, severity (Critical/High/Medium/Low per proposal §2.2), **reproduced** or **inferred** (inferred findings cannot be rated above Medium until reproduced; say how to reproduce: a red test, a script, or a command), `file:line`, what goes wrong and when, the fix shape (a fix that adds something must name what it replaces).

Answer these T0 questions where your lens reaches them (phase 01 "Council brief"):
- Q1, given the owner's choice of an in-process binding: the loader shape, the channel matrix (activated release, npm bin, direct `node bin/fgos.mjs`, dev host, test runner, Windows), the absolute budget per call class (µs for judge and atomic write; ms only for spawns on cold paths), and which paths keep the route.
- Q2: per atomic-write contract class (phase 01 §B), does `durable-file` cover it, and what is gained or lost on fsync and permission mode. The baseline measured `durable-file` at 10–15 ms per write against 20–40 µs for the no-fsync classes; say per class whether durability is actually wanted.
- Q3: the `unknown` mapping per §A site, who owns each policy (door or caller), and how old records are read under the compatibility decision.
- Q5: which of the six T0 doctor rows are component health and which are packaging.

### Tables

- **Migration table:** Node part | what it decides | move or not | reason | order | Node budget after the move.
- **Delete list:** with the evidence that nothing needs it (`rg`/GitNexus with no caller, plus a run if possible).
- **Doctor table:** each fail/warn condition of the T0 rows and which surviving row keeps it. No condition may be lost silently.
- **Tests table:** the owning proof per behaviour, Node↔Rust duplicates, time-based waits, tests that should move down a layer, and tests to retire, each naming the test that will own its behaviour.

### Rejected hypotheses

List what you checked and found fine, so the next review does not repeat it.

End your report with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

## Rules for every seat

- Read-only. Report only what you saw yourself, and say what you ran.
- Run commands that only read, plus focused tests if you need to reproduce a finding: `cargo test -p <crate>` with a private `CARGO_TARGET_DIR` under `/tmp/fgos-work/`, or `node --test <file>` after staging the addon the way `scripts/lib/git-addon-stage.mjs` `ensureGitAddon(env, cwd)` does. Never run the whole `npm test` (the machine is shared). Run every `fgos …` command with `</dev/null`.
- Hooks block the words `node_modules`, `.git`, `target` and `build` inside commands; put such paths in a shell variable.
- No `--yagni` flag was passed. Deliver the full scope above, and add nothing that it does not ask for.
