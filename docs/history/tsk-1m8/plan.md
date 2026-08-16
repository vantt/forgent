---
item: tsk-1m8
---

# plan.md — tsk-1m8

Mode: **high-risk**

Flags that apply (per `fgos-routing`'s Mode-gate, decided directly here —
this item skipped `exploring` on a `clear` discovery verdict, so there is
no `fgos-routing` Orient hand-off in this session's own context and no
`CONTEXT.md` to cite; grounded instead in `docs/history/tsk-1m8/
RESEARCH.md`'s Round 1 findings):

- **audit/security** (hard-gate) — the change enables
  `allowCrossProvider: true` on a capacity that resolves to a non-Claude
  command (`agy`, Gemini-backed). That is a real cross-provider
  content-carry boundary (`docs/reference/capacity-cross-provider-
  governance.md`), not a cosmetic config flip.
- **external systems** (hard-gate, "external provider") — dispatch target
  is a real external CLI process (`agy`, confirmed present at
  `/home/vantt/.local/bin/agy`), not an in-repo function.
- **existing covered behavior** — `capacityIdForWork(coding)` always
  resolves to the literal string `"fgos-coding-implement"`
  (`src/runner/dispatch.mjs:1512-1515`, pinned by
  `test/runner/dispatch.test.mjs:3275`). Adding a
  `runner.capacities["fgos-coding-implement"]` entry to the live
  `.fgos/config.json` changes the DEFAULT headless dispatch target for
  every coding-domain item's `executing` stage run through the runner
  loop (`spawnWorker`/`dispatchClaimedItem`/`runWatch`,
  `src/runner/loop.mjs`), not just this one item. GitNexus impact
  (`impact({target:"resolveExecutorConfig", direction:"upstream"})`,
  2026-08-16): `impactedCount: 6`, `risk: HIGH`, confirms
  `spawnWorker`/`dispatchClaimedItem`/`runWatch` all sit downstream —
  **impact-analysis posture: degraded** (GitNexus `present` but this
  session's own index was flagged stale at session start; cross-checked
  directly against source in RESEARCH.md Round 1 instead of trusting the
  graph alone).

Two hard-gate flags alone put this at `high-risk` regardless of raw count
(`fgos-routing`'s own table: "4+ flags, or any hard-gate flag ... →
high-risk").

## Approach

The dispatch mechanism already exists — no code change to
`src/runner/dispatch.mjs`/`src/runner/loop.mjs` is needed (RESEARCH.md
Round 1). What is missing is purely a `.fgos/config.json` entry keyed
`"fgos-coding-implement"`, per the exact example already documented at
`docs/reference/capacity-cross-provider-governance.md:55-73`.

Because the item's own text frames this explicitly as **thử nghiệm**
(an experiment/test), not "route every future coding item's headless
implement stage through agy from now on", this plan treats the config
change as **scoped and temporary**, not a permanent default switch — this
is a Not-material implementation-scope call (would not change what the
*item itself* is proving, only how long the config edit persists), so it
is pinned here as an assumption rather than escalated:

1. **Capture the before state.** Read the current
   `.fgos/config.json` `runner.capacities` block (main checkout —
   `.fgos/` never exists inside this item's own `fgw/tsk-1m8` worktree,
   ADR0020, so every step below runs with `--dir <mainCheckoutRoot>` or
   directly against the main checkout file, never assumed present in the
   worktree). Record it verbatim in the evidence file before touching
   anything.
2. **Add the entry.** Add `runner.capacities["fgos-coding-implement"]`
   mirroring the existing `"agy"` entry's real shape (`kind: "agent"`,
   `invocations: [{via:"cli", adapter:"cli-spawn", command:"agy",
   args:[...]}]`, `providerModel: "gemini"`, `allowCrossProvider: true`)
   — do not edit or remove the existing `"agy"` entry itself (RESEARCH.md
   confirmed nothing else in the repo keys a purpose lookup to the literal
   string `"agy"`, so the two entries coexisting is safe).
3. **Prove resolution flips.** `node src/runner/dispatch.mjs decide
   --work tsk-1m8 --dir <mainCheckoutRoot>` — before step 2:
   `mechanism` native/in-process fallback (no capacity entry, confirmed
   live in RESEARCH.md); after step 2: `mechanism: "out-of-process"`,
   `capacityId: "fgos-coding-implement"`, `configured: true`. Record both
   raw JSON outputs.
4. **Prove a real dispatch runs.** Execute a real, safe, throwaway prompt
   through the newly-configured capacity (`node src/runner/dispatch.mjs
   execute fgos-coding-implement --prompt "<short smoke-test prompt, no
   repo-mutating instruction>" --dir <mainCheckoutRoot>`, or the
   equivalent `spawnWorker` call inside this item's own worktree) and
   capture the real stdout/stderr — proving `agy` actually receives the
   prompt and returns real output, not a spawn failure or timeout.
5. **Revert.** Remove the `"fgos-coding-implement"` entry, restoring
   `.fgos/config.json` to its pre-step-2 state exactly (diff against the
   before-capture in step 1 to confirm a clean revert) — so no other
   in-flight or future coding item's headless dispatch is ever actually
   exposed to this experiment once it lands.
6. **Write the evidence file** (`docs/history/tsk-1m8/iron-law-
   evidence.md`) with the real before/after `decide` output, the real
   `execute`/dispatch transcript, and the before/after config diff proving
   a clean revert — the standard real-transcript convention this repo
   already uses for this kind of proof (e.g.
   `docs/history/tsk-3ik-3/iron-law-evidence.md`).

No split: one honest piece of work, contained entirely in a config
add/revert cycle plus one evidence doc. `tsk-1m8` proceeds as itself.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| Cross-provider content leaving Claude ecosystem (`agy`/Gemini) | Real — governed by `allowCrossProvider` gate | Gate already documented+tested elsewhere (`docs/reference/capacity-cross-provider-governance.md`); this item sets the flag explicitly per that doc, never bypasses it |
| Shared dispatch chokepoint (`resolveExecutorConfig`) blast radius | Real, HIGH per GitNexus (degraded posture — stale index, cross-checked via direct source read) | Change is config-only, additive, and reverted within this same item's own execution (step 5) — no other item's dispatch is ever live-exposed |
| Real external process spawn (`agy` binary) | Low mechanically — reuses existing `cliSpawnAdapter`'s own timeout/maxBuffer/spawn-fail handling, no new code | `command -v agy` confirmed present; adapter code already has test coverage (`test/runner/dispatch.test.mjs`) |
| `.fgos/` not present inside this item's own worktree (ADR0020) | Real constraint on HOW steps 1-5 run, not a risk to correctness if respected | Every config-touching step above runs against the main checkout root explicitly, never assumed present at the worktree cwd |

## Outstanding questions

None
