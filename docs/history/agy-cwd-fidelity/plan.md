# plan.md — tsk-it0: agy ignores spawn cwd

Mode: tiny

## Root cause (RESEARCH.md round 1)

`agy` (v1.1.13) print-mode (`-p`) does not use the OS process `cwd` it was
spawned with — it resumes its own internally-tracked "current
project"/"most recent conversation" instead. Live repro (two independent
temp dirs, run back-to-back through the real binary, not just the adapter):

- without `--new-project`: `agy` reported `/home/vantt/.gemini/antigravity-cli/scratch`
  (wrong — spawned from `/tmp/agy-repro-a`)
- with `--new-project`: `agy` reported the actual spawn `cwd`
  (`/tmp/agy-repro-b`, correct)

`cliSpawnAdapter`/`spawnWorker` (`src/runner/dispatch.mjs:1481-1486,
1749-1756`) were checked and pass `cwd` through to `child_process.spawn`
correctly — **not the adapter's fault**. This is a real `agy`-binary
behavior, worked around at the config layer.

## Approach

Add `"--new-project"` to `runner.executors.agy.invocations[0].args` in
`.fgos/config.json`, so every dispatch through `agy` starts a fresh project
scoped to the actual spawn `cwd` instead of resuming whatever project `agy`
last touched. No adapter/`dispatch.mjs` code change needed — this is a
one-line config data fix.

**Impact-analysis gate (CLAUDE.md):** GitNexus present (`fgos tool query
--capability impact-analysis --status present` → provider `gitnexus`,
`status: present`) → posture `full`. Not applicable here regardless: this
change edits one JSON config value (`.fgos/config.json`), touches no
function/class/method symbol, so there is nothing for `impact({target:
...})` to run against. Noted per the gate, not skipped silently.

## Files touched

- `.fgos/config.json` — `runner.executors.agy.invocations[0].args`: append
  `"--new-project"`.

## Risk

Light. Config-data-only change, single array element, no code path
altered. The only behavior change is that every `agy` dispatch now
explicitly starts fresh instead of implicitly (and unreliably) inheriting
whatever project `agy` last had open — strictly safer than today, since
today's implicit behavior is exactly the bug.

## No split

Single piece — a one-line config fix plus its own live-repro verify. Not
separable into independently workable pieces.

## Outstanding questions

None
