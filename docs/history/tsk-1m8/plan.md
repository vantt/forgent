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

**Revised at `fgos-coding-validating`'s own Reality gate (smaller path
found — see below).** The dispatch mechanism already exists — no code
change to `src/runner/dispatch.mjs`/`src/runner/loop.mjs` is needed
(RESEARCH.md Round 1). The first draft of this plan proposed mutating the
live `.fgos/config.json` (add the capacity, prove it, revert it). That is
NOT the smallest honest path: `spawnWorker`/`decideCapacityCli`/
`executeCapacityCli` all take their config as a plain in-memory `cfg` (or
an explicit `repoRoot` pointing at wherever `.fgos/config.json` lives) —
this repo's own test suite already proves the pattern
(`test/runner/dispatch.test.mjs`'s `writeRunnerConfigFixture(root, {...})`
+ `decideCapacityCli(undefined, {repoRoot: root, ...})`, and
`spawnWorker(work, cfg, cwd)` with a synthetic `cfg` object spawning a
REAL subprocess — the "echo executor" tests use a fake COMMAND but a real
`child_process` spawn, never a mocked `spawnWorker`). Pointing that same
pattern at the real `agy` command proves the exact mechanism end-to-end
without ever touching the live, shared `.fgos/config.json` — eliminating
the entire mutate/revert dance and the risk of an incomplete revert.

1. **Build a scratch config fixture**, not a live-repo edit: a throwaway
   directory (this item's own worktree, e.g.
   `docs/history/tsk-1m8/scratch/.fgos/config.json` deleted again after
   the run, or a `mkTempDir()`-style location) containing only:
   `runner.capacities["fgos-coding-implement"] = { kind: "agent",
   invocations: [{via:"cli", adapter:"cli-spawn", command:"agy",
   args:["-p","{prompt}","--dangerously-skip-permissions","--model",
   "{model}"]}], providerModel: "gemini", allowCrossProvider: true }` —
   the same shape the live `"agy"` entry already carries
   (`.fgos/config.json`, read directly in RESEARCH.md Round 1), plus
   `executor`/`models`/`timeoutMs` fields shaped like
   `writeRunnerConfigFixture`'s own existing fixtures so
   `ensureRunnerConfigForDir`/`resolveExecutorConfig` accept it without
   inventing new fixture shape.
2. **Prove resolution.** Call `decideCapacityCli('fgos-coding-implement',
   {repoRoot: <scratchDir>, hasLiveTaskAccess: true})` (or the CLI
   equivalent, `node src/runner/dispatch.mjs decide fgos-coding-implement
   --dir <scratchDir>`) — expect `{mechanism: "out-of-process",
   configured: true}` (kind `agent` → `hasNativeMechanism: true`, per
   `decideCapacityCli`'s own logic already read in RESEARCH.md).
3. **Prove a real dispatch runs.** Call `executeCapacityCli(
   'fgos-coding-implement', {repoRoot: <scratchDir>, prompt: "<short,
   safe, non-repo-mutating smoke-test prompt>"})` (or
   `node src/runner/dispatch.mjs execute fgos-coding-implement --prompt
   "..." --dir <scratchDir>`) — this really spawns `agy` (confirmed
   present at `/home/vantt/.local/bin/agy`). Capture the real
   stdout/stderr/exit status.
4. **Clean up the scratch fixture** (delete the throwaway directory) —
   trivial, since nothing was ever written to the live `.fgos/`.
5. **Write the evidence file** (`docs/history/tsk-1m8/dispatch-
   experiment-evidence.md` — deliberately NOT named `iron-law-
   evidence.md`: that name is reserved for `classifyIronLaw`'s own
   required-evidence file, `fgos-coding-implement`'s own red flags forbid
   writing one when `required: false`, and this change touches no `src/`
   logic) with the real `decide`/`execute` output and the real `agy`
   transcript — the same real-transcript convention this repo already
   uses for that kind of proof (e.g.
   `docs/history/tsk-3ik-3/iron-law-evidence.md`), just under this item's
   own non-reserved filename.

The live `.fgos/config.json` — and every other coding item's headless
dispatch default — is **never touched at all**, at any point. This also
means: no revert step to get wrong, and no window (however small) where a
concurrent `fgos loop` run on another item could observe the experimental
capacity.

No split: one honest piece of work, contained entirely in a scratch-config
proof run plus one evidence doc. `tsk-1m8` proceeds as itself.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| Cross-provider content leaving Claude ecosystem (`agy`/Gemini) | Real — governed by `allowCrossProvider` gate | Gate already documented+tested elsewhere (`docs/reference/capacity-cross-provider-governance.md`); the scratch fixture sets the flag explicitly per that doc, never bypasses it |
| Shared dispatch chokepoint (`resolveExecutorConfig`) blast radius | Downgraded from the first draft: the live `.fgos/config.json` is never written, so no other item's headless dispatch is ever exposed, at any point — GitNexus impact (`impact({target:"resolveExecutorConfig", direction:"upstream"})`, 2026-08-16: `impactedCount: 6`, `risk: HIGH`, degraded posture — stale index, cross-checked via direct source read) confirms the chokepoint's real reach, which is exactly why this plan now avoids touching it | Scratch-fixture isolation (this Approach); `spawnWorker`/`decideCapacityCli` already accept an in-memory/explicit-`repoRoot` cfg by design, not a new capability being relied on |
| Real external process spawn (`agy` binary) | Low mechanically — reuses existing `cliSpawnAdapter`'s own timeout/maxBuffer/spawn-fail handling, no new code | `command -v agy` confirmed present; adapter code already has test coverage (`test/runner/dispatch.test.mjs`); `spawnWorker`'s "echo executor" tests confirm a real (non-mocked) `child_process` spawn path |
| `.fgos/` not present inside this item's own worktree (ADR0020) | Moot for the live store (never touched) — only the scratch fixture, created and deleted entirely inside this item's own worktree, needs no `--dir <mainCheckoutRoot>` at all | Scratch fixture lives under `docs/history/tsk-1m8/scratch/` inside this item's own worktree; no main-checkout `.fgos/` access required for steps 1-4 |

## Outstanding questions

None
