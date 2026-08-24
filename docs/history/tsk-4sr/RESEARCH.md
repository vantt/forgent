# RESEARCH.md — dispatch-config-cache (tsk-4sr)

## Round 1 — 2026-08-24, discovery stage

**Asked:** tsk-4sr proposes caching `.fgos/config.json`/`.fgos/runner.json`
reads (per-process, mtime-invalidated) in `dispatch/cli.mjs` and
`scripts/dispatch-decide-hook.mjs`, plus memoizing
`resolveExecutorAndOverrides()` within one invocation, to cut ~7-15ms/call
overhead that "amplifies under fan-out (10 agents ~70-150ms cumulative)".
Verify: (1) the re-read/redundancy claims at the cited lines, (2) whether
the PreToolUse hook path is a fresh process per call (which would defeat a
per-process cache's claimed fan-out benefit), (3) what "D3 no-trust
guarantee" is.

### Checked: `src/runner/dispatch/cli.mjs` — re-read + redundancy claims

- `ensureRunnerConfigForDir(root)` is called at `cli.mjs:390`
  (`executeExecutorCli`), `:639` (`decideExecutorCli`), `:741`
  (`fanoutBatchExecutorCli`) — each unconditionally, once per function
  call. Its implementation (`config.mjs:245-274`) does
  `fs.readFileSync(sharedPath, 'utf8')` unconditionally on every call, no
  in-memory cache of any kind. **Confirmed: no caching exists today.**
- `resolveExecutorAndOverrides(cfg, ...)` call sites: `cli.mjs:207`
  (`spawnWorker`, a different function/path entirely — not part of the
  decide/execute hot path), `:419`/`:429` (`executeExecutorCli`, mutually
  exclusive `if/else` — **only ONE fires per call, not redundant**;
  `cli.mjs:392-404`'s own comment records that a prior version *did* call
  it twice here and was already fixed — "A single call per door, never a
  second one on the already-resolved id afterward"), `:668`/`:695`
  (`decideExecutorCli`'s `--work` door — `:668` only checks `.configured`
  inside `if (!executorId && workIdArg)`, then unconditional `:695` calls
  it again with the SAME `cfg`/`executorId` when the block fell through —
  **this one is genuinely redundant, confirmed 2x, not conditional**),
  `:767` (`fanoutBatchExecutorCli`, once per candidate — necessary, not
  redundant, since each candidate can have a distinct executorId).
  **Verdict: the redundant-call claim is real but narrower than stated —
  only `decide --work <id>` calls it twice; "2-3 times" appears to
  overstate the general case (the `--for`/named-executor door in
  `executeExecutorCli` was already fixed to one call).**

### Checked: `scripts/dispatch-decide-hook.mjs` + `.claude/settings.json` — process model

- `.claude/settings.json:24`: hook registered as
  `"command": "node \"${CLAUDE_PROJECT_DIR}/scripts/dispatch-decide-hook.mjs\""`
  — Claude Code's PreToolUse hook mechanism spawns a fresh `node` process
  per tool-call event; this is a plain CLI script reading JSON from stdin
  (`fs.readFileSync(0, 'utf8')`), not a persistent daemon.
- Every other invocation path the proposal names (`decide`, `execute` as
  CLI subcommands via `bin/fgos.mjs`/`src/runner/dispatch.mjs`) is
  likewise a fresh `node` process per call (confirmed by
  `../_shared/fgos-cli-fallback.md`'s own invocation pattern: `node
  "$FGOS_BIN" <verb-cmd>`, one process per call).
- **Finding: a per-process, module-level cache resets to empty on every
  one of these invocations** — the fan-out scenario the item's own
  description uses as its headline motivation ("10 agent ~70-150ms
  cumulative just from re-reading 1 unchanged file") is exactly N
  *separate* PreToolUse hook processes (one per Agent/Task-tool call),
  so a per-process cache delivers **zero** cross-call benefit there. The
  only place a per-process cache actually pays off is intra-process reuse
  within a single invocation — e.g. memoizing the two `:668`/`:695`
  `resolveExecutorAndOverrides` calls found above, or
  `fanoutBatchExecutorCli`'s own loop over multiple `candidateIds` in one
  process (which already reads config only once, at `:741`, before the
  loop — no further gap there).

### Checked: "D3 no-trust guarantee" citation

- `grep -rn "no-trust" docs/ src/` — zero hits anywhere in the repo.
- Checked `docs/decisions/index.md` (dispatch/runner rows) and
  `docs/specs/runner.md` for any `D3` tied to config/cache trust — no
  match. GitNexus symbol search for "trust" near dispatch turned up two
  unrelated docs (`fgos-discover-trusts-a-locked-context...`,
  `recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md`),
  neither about config-read caching.
- **Finding: "D3 no-trust guarantee" does not correspond to any locatable
  decision in this repo.** The item's own provenance line credits "4
  haiku scout + 1 fable-eval song song" as the source — this citation may
  be fabricated by that automated pass rather than grounded.

## Round 2 — 2026-08-24, same discovery pass, follow-up from user

**Asked:** user questioned whether `.fgos/runner.json` still exists as a
separate file at all, given the item's description claims both
`.fgos/config.json` AND `.fgos/runner.json` are re-read uncached.

### Checked: does `.fgos/runner.json` exist as a live config source?

- `src/config/shared-config-file.mjs:1-7` (module header): "The legacy
  runner config file was retired (tsk-5hv D1) -- this is now the sole
  config source, no fallback." `sharedConfigFilePath(dir)` returns
  `path.join(dir, '.fgos', 'config.json')` only.
- `docs/specs/runner.md:1082`: "tsk-5hv xoá hẳn fallback về file flat
  legacy cũ — đây giờ là nguồn config DUY NHẤT" (tsk-5hv fully removed
  the fallback to the old legacy flat file — this is now the SOLE config
  source).
- `ls .fgos/runner.json` in the main checkout: does not exist.
- `grep -rn "runner\.json" src/ scripts/ bin/`: zero real references (one
  unrelated hit in `src/intake/plan.mjs` about a `.fgos-runner.json`
  dotfile-tokenization comment in a different subsystem, not this one).
- **Finding: the item's premise is factually wrong.** Only ONE file
  (`.fgos/config.json`) is ever read by `ensureRunnerConfigForDir`/
  `loadRunnerConfigFromDir` — "runner.json" as a second live file does
  not exist in the current codebase (retired by tsk-5hv). This is on top
  of the redundancy-count and D3-citation gaps already found in Round 1 —
  a third concrete factual error in the item's own automated-research
  provenance.

### Checked: likely real source of the "D3 no-trust guarantee" garble

- `src/runner/dispatch/config.mjs:13-19`, a genuine existing comment
  labeled "TRUSTED-CONFIG NOTE (security panel...)": "the shared config
  file's `runner` section (`.fgos/config.json`) is an EXECUTABLE config,
  not passive data — whoever can edit it controls what process
  `dispatch/transport.mjs` spawns and with what arguments... it carries
  the same trust level as code: only apply it from a checkout you already
  trust."
- **Finding: this is very likely what got garbled into "D3 no-trust
  guarantee"** by the automated scout/eval pass — a real security note
  about config trust exists in the exact file the proposal targets, but
  it is not decision-numbered, not named "no-trust guarantee", and its
  actual content (trust the FILE's origin, not a caching-safety claim)
  does not by itself confirm or deny that adding a cache is safe.

## Open (unresolved)

1. The proposal's core design (per-process mtime-invalidated cache) cannot
   deliver its own headline claimed benefit (fan-out savings across
   separate hook/CLI process invocations) because every one of those
   invocations is already a fresh process with no shared memory. A person
   needs to decide: scope the fix down to the real, small, intra-invocation
   win only (memoize `:668`/`:695`'s redundant `resolveExecutorAndOverrides`
   call in `decideExecutorCli`'s `--work` door — genuinely real, minor),
   or pursue a cross-process cache (e.g. an mtime-keyed on-disk/shared-memory
   cache), which is materially bigger scope and risk than "safe, read-only
   cache" framing suggests.
2. "D3 no-trust guarantee" cannot be located in the repo — cannot confirm
   or refute that any caching design here would violate it. Needs the
   person who wrote/approved that citation (or knows what it refers to)
   to clarify, or the item's safety claim should be dropped/rewritten
   without it.
