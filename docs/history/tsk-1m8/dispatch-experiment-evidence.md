---
item: tsk-1m8
---

# dispatch-experiment-evidence.md — tsk-1m8

Real, live run (2026-08-16) proving the existing dispatch mechanism
(`src/runner/dispatch.mjs`) can route a coding-domain item's `executing`
stage to the `agy` capacity out-of-process, end to end — entirely via a
scratch `.fgos/config.json` fixture, never touching the live repo's real
config. This is NOT named `iron-law-evidence.md`: this item's diff
touches no `src/` logic (`classifyIronLaw` — see below — came back
`required: false`), and that filename is reserved for when it comes back
`true`.

## Setup (never landed in the live repo)

Two scratch roots outside this worktree, each `<root>/.fgos/config.json`:

- `config-root-before/` — the live repo's real `runner.capacities` shape,
  minus any `fgos-coding-implement` entry (mirrors `.fgos/config.json` as
  read directly in `RESEARCH.md` Round 1 — only `"agy"` is registered
  there today).
- `config-root/` — the same, PLUS one added entry:
  ```json
  "fgos-coding-implement": {
    "kind": "agent",
    "invocations": [{ "via": "cli", "adapter": "cli-spawn", "command": "agy",
      "args": ["-p", "{prompt}", "--dangerously-skip-permissions", "--model", "{model}"] }],
    "providerModel": "gemini",
    "allowCrossProvider": true,
    "rigorOverrides": { "light": "lightweight", "standard": "lightweight", "heavy": "lightweight" }
  }
  ```
  — the exact shape `docs/reference/capacity-cross-provider-governance.md`'s
  own example documents, and the same shape the live `"agy"` entry already
  carries.

A throwaway `scratch-item` work item (`kind: task`, `domain: coding`) was
seeded into both roots so `decide --work` resolves through the real
`capacityIdForWork(coding)` → `"fgos-coding-implement"` indirection — the
same chokepoint the live runner loop (`spawnWorker`/`dispatchClaimedItem`,
`src/runner/loop.mjs`) actually uses, not a shortcut.

Both scratch roots and the isolated `agy-cwd` spawn directory were deleted
immediately after this run. Nothing here ever touched
`/home/vantt/projects/forgentX/.fgos/config.json`.

## Round 1 — `decide --work`, before vs after

Caller declared `hasLiveTaskAccess: false` — the accurate self-declaration
for the real caller this mechanism serves (`fgos loop`'s headless
`dispatchClaimedItem`, which has no Agent/Task tool of its own), not a
live interactive session's own (which would correctly resolve
`in-process` instead — confirmed as a side effect of an earlier, corrected
run of this same script with `hasLiveTaskAccess: true`, which returned
`{"mechanism":"in-process","configured":true}` — the Native-First
Dispatch Doctrine working as documented for a soul that already has one).

```
=== decide --work BEFORE (fgos-coding-implement not registered) ===
{
  "mechanism": "out-of-process",
  "capacityId": "fgos-coding-implement",
  "configured": false
}
=== decide --work AFTER (fgos-coding-implement -> agy registered) ===
{
  "mechanism": "out-of-process",
  "configured": true,
  "capacityId": "fgos-coding-implement"
}
```

**Correction to RESEARCH.md's Round-1 framing:** `mechanism` reads
`"out-of-process"` in BOTH the before and after case — it does not flip.
What actually flips is `configured` (`false` → `true`). This is the real,
observed signal, and it is consistent with `decideCapacityCli`'s own code
(`src/runner/dispatch.mjs:1865-1869`, the `hasExplicitCapacity` branch):
an unconfigured work-item-resolved capacity still resolves
`hasNativeMechanism: true` (Native-First default) into
`decideDispatchMechanism`, which returns `out-of-process` whenever the
caller has no live Task access regardless — so a headless runner with no
capacity configured still spawns SOMETHING out-of-process (the bare
global `executor`, i.e. `claude`, per `resolveExecutorConfig`'s own
precedence), it just does not spawn `agy` specifically until `configured`
flips to `true`. RESEARCH.md's "mechanism native/in-process fallback"
phrasing (Round 1) was imprecise; this file is the corrected, real
observation.

## Round 2 — real `execute`, with the real `agy` binary

```
fgos: dispatch capability=(none declared) capacity=fgos-coding-implement via=cli-spawn provider=agy model=Gemini 3.5 Flash (Medium) tier=standard
=== execute result ===
{
  "mechanism": "out-of-process",
  "status": 0,
  "signal": null,
  "stdout": "AGY_DISPATCH_TEST_OK\n",
  "stderr": "",
  "tier": "standard",
  "model": "Gemini 3.5 Flash (Medium)",
  "provider": "agy",
  "command": "agy"
}
```

Prompt sent: `Reply with exactly this text and nothing else:
AGY_DISPATCH_TEST_OK` — a safe, non-repo-mutating smoke test, run with
`cwd` pointed at an isolated, empty scratch directory (never this
worktree, never the live repo) so `--dangerously-skip-permissions` had
nothing consequential in reach even in principle.

`agy --version`: `1.1.13` (confirmed present at
`/home/vantt/.local/bin/agy` before this run).

**Result: real success.** `status: 0`, real stdout exactly matching the
requested reply — `agy` genuinely received the prompt, ran, and returned
real output through the exact same `cliSpawnAdapter` code path
`spawnWorker`/`dispatchClaimedItem` already use for every other coding
item's headless `executing`-stage dispatch. No code change was needed in
`src/runner/dispatch.mjs`/`src/runner/loop.mjs` — the mechanism already
worked; this item is the first real end-to-end proof of it targeting
`agy` specifically.

## `classifyIronLaw`

```
required: false
```

(computed against this item's real committed diff — doc-only, no `src/`
change) — confirms `iron-law-evidence.md` is correctly NOT the filename
used here, per this skill's own red flag against writing one when not
required.

## Outstanding questions

None — this item was an experiment/proof, not a permanent routing
change. Whether `.fgos/config.json`'s live `runner.capacities` should
ever gain a real `"fgos-coding-implement"` entry (making `agy` the
default for every coding item's headless `executing` stage) is a
separate, future product decision, not something this item's own scope
covers or implies.
