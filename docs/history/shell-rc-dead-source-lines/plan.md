# plan — shell rc dead source lines

Item: `tsk-5lk`. Decisions: `CONTEXT.md` (same directory), D1–D5.
This plan never reopens those decisions; it cites them.

## Mode: standard

Flags counted (from the mode gate's own list):

| Flag | Applies | Evidence |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | nothing under `.fgos/` changes: no new field, no new event kind |
| audit / security | no | no credential, no permission, no secret in scope |
| external systems | no | — |
| **public contracts** | **yes** | `fgos setup`'s returned `rcFilesInserted`/`rcFilesAlreadyConfigured` shape (`bin/fgos.mjs:2504-2509`); `fgos doctor`'s per-check `{passed, message}` (`bin/fgos.mjs:2518-2524`), whose `passed` value D5 changes; the exported `hasSourceLine`/`insertSourceLine`/`integrationScriptPath` signatures |
| **cross-platform** | **yes** | `src/setup/shell-rc.mjs:10-14,24-34` carries locked win32 PowerShell profile detection (tsk-63j D3); D2/D3 must not disturb it |
| **existing covered behavior** | **yes** | four test files cover this area: `test/setup/shell-rc.test.mjs`, `test/setup/checks.test.mjs`, `test/cli/fgos.test.mjs` (incl. `:491`), `test/scripts/fgos-shell-integration.test.mjs`. D4 additionally touches `run()` at `test/cli/fgos.test.mjs:41`, the shared helper of every CLI test |
| weak proof around the area | no | proof is unusually strong here — four dedicated test files |
| multi-domain | no | single coding domain |

**Count: 3.** No hard-gate flag applies — D1 explicitly forbids deleting rc
lines (no data-loss path), and D3 *adds* a refusal rather than removing a
validation. 2–3 flags → **standard**.

**Why not `small`.** Three distinct surfaces change (path resolution, setup's
write decision, doctor's verdict), plus the test-harness `HOME` sandbox that
touches the helper every CLI test shares. Four existing test files assert
today's behavior. That is not "a few files, no gray areas."

**Why not `high-risk`.** 3 flags, not 4+, and no hard gate. Nothing touches
`.fgos/` state, the event log, the merge/approve path, or auth. The worst
realistic failure is shell integration silently not being sourced — which
`fgos doctor` itself detects and reports by design.

## Prior art that shortens this

- **`src/runner/paths.mjs`** — tsk-63j's canonical resolver already exists,
  with an explicit `strict` mode (its D5). **But its git mode uses
  `git rev-parse --show-toplevel`** (`paths.mjs:30`), which inside a linked
  worktree returns *that worktree's* toplevel, **not** the main checkout.
  D2 needs `--git-common-dir`. So D2 is not "call the existing resolver" —
  it is a resolution the canonical resolver does not yet expose.
- **`src/runner/merge.mjs:222-234` `isMainWorktree()`** — already does exactly
  the `--git-common-dir` → `path.dirname` → `realpath` comparison D2 needs,
  *and* already fails open on a non-git directory (`:226-228`), which is
  precisely D3's detection condition. This is the pattern to follow; a
  precedent beats new research.
- **`scripts/fgos-shell-integration.sh:15`** — uses
  `git rev-parse --path-format=absolute --git-common-dir` already, so D2
  makes setup/doctor agree with the shell script instead of diverging from it.

## Approach

Reuse `isMainWorktree`'s resolution shape to derive the main checkout, and
make that the single input to both the write decision and the doctor check.

**Rejected: add a `commonDir` option to `paths.mjs`'s `resolveRepoRoot`.**
Tempting for tidiness, but `paths.mjs` is imported by `bin/fgos.mjs`,
`bin/fgos-runner.mjs`, `src/runner/session.mjs`, `src/runner/loop.mjs`, and
`scripts/fgos-session-start-hook.mjs`. tsk-63j D5 locked its two modes
against two documented, tested contracts; adding a third mode to a
five-caller resolver is a materially larger blast radius than this bug
justifies. Revisit only if a second caller needs common-dir resolution.

**Rejected: keep `import.meta.url` and dedupe at write time.** Leaves
`checkShellIntegrationSourced` still misreporting inside every worktree,
so the "run fgos setup" prompt keeps firing. Treats the symptom.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| `--git-common-dir` resolves to main checkout from a linked worktree | **low — already proven** | Run in this very worktree during clarify: `git rev-parse --path-format=absolute --git-common-dir \| xargs dirname` → `/home/vantt/projects/forgentX`. Empirically confirmed, not assumed. |
| Pre-existing main-checkout line must be recognized, not duplicated | **medium** | One of the 2 alive lines already points at `/home/vantt/projects/forgentX/scripts/fgos-shell-integration.sh`. After D2, `hasSourceLine` must match it and setup must report `alreadyConfigured` — never append a 42nd line. Proof point for `fgos-coding-validating`: real rc fixture containing that exact line. |
| win32 branch not disturbed | **medium** | `detectRcFiles` returns PowerShell paths on win32 while `insertSourceLine` is bash/zsh-only by design (`shell-rc.mjs:10-14`). D3's decline path must not make the win32 detection throw. Proof point: unit test passing `platform: 'win32'`. |
| `run()` HOME sandbox breaks unrelated CLI tests | **medium** | `test/cli/fgos.test.mjs:41` currently inherits `process.env` deliberately ("keeping every existing call site byte-identical"). Proof point: full `npm test` green, not just the setup tests. |
| Doctor check-contract change | **low** | Grepped for consumers: only `bin/fgos.mjs:2518`, the `--pretty` renderer (`bin/fgos.mjs:2663`), and `test/setup/checks.test.mjs`. `merge.mjs:703,749`'s `check.passed` is `runGoalCheck`, unrelated. Confirmed, not assumed. |
| **The item's own `verify` field is unrunnable as written** | **medium — must be settled** | The engine auto-wrote `verify` = `zsh -ic exit 2>&1 \| grep -c 'no such file or directory' ; ... grep -n 'fgos-shell-integration.sh' ~/.zshrc`. It reads the developer's real `~/.zshrc`, which D1 forbids fgOS from cleaning — so it can never honestly go green, and `runGoalCheck` runs it at merge (`merge.mjs:748`). See "Verify" below. |

### Files likely touched

- `src/setup/checks.mjs` — `integrationScriptPath()` (main-checkout resolution, D2); `checkShellIntegrationSourced()` (stop misreporting, D2; dead-line failed check, D1+D5)
- `src/setup/shell-rc.mjs` — decline path for non-git copies (D3)
- `bin/fgos.mjs` `setup` case (`:2478-2517`) — report the declined rc write with its reason (D3)
- `test/cli/fgos.test.mjs` — `run()` HOME sandbox (D4); keep `:491` green
- `test/setup/checks.test.mjs`, `test/setup/shell-rc.test.mjs` — new cases

### Order, and why it is forced

`fgos graph --json` puts `tsk-5lk` on no critical path
(`criticalPath.path` is the unrelated `tsk-4vo…tsk-19y-1` chain), and
`fgos graph --what-if tsk-5lk --json` returns an **empty `topUnblock`** —
`deps: []` and nothing depends on it. So graph impact does not constrain
ordering here; testability does.

1. **D4 first — sandbox `HOME` in the test harness.** Not preference:
   steps 2 and 3 cannot be honestly tested until the suite stops writing to
   the real `~/.zshrc`, and every test run before this lands adds another
   dead line to the developer's machine.
2. **D2 + D3 — resolution and the write decision.** One coherent change:
   both answer "which path, if any, gets written."
3. **D1 + D5 — doctor's dead-line failed check.** Last, because it reports
   on the state the earlier steps stop producing.

## Shape: no split

Judgment, with the graph checked rather than assumed: `fgos graph --what-if
tsk-5lk --json` yields an empty `topUnblock`, so carving children buys **no**
parallel unblock — only lineage overhead. The three pieces share one file
cluster (`src/setup/` plus the `setup`/`doctor` verbs in `bin/fgos.mjs`) and
one verify command covers all of them.

D4 stays inside this item rather than becoming a child, despite its wider
test-file reach: it is the piece that stops active ongoing harm to the
developer's machine, and deferring it to a child means every `npm test` run
during this item keeps appending dead lines.

### Cases worth proving against (standard depth)

- rc file already containing the correct main-checkout line → recognized, **no** second line appended
- rc file containing only dead lines → doctor fails, naming each dead path; setup still adds the live line
- `fgos setup` from inside a linked worktree → writes/recognizes the *main checkout* line, and `test/cli/fgos.test.mjs:491`'s "succeeds in a worktree" assertion stays green
- `fgos setup` in a directory that is not a git repo at all → declines the rc write with a stated reason, still writes config and wires hooks
- no rc file exists → unchanged: `detectRcFiles` reports nothing, `insertSourceLine` never creates one (`shell-rc.mjs:50-52`)
- `platform: 'win32'` → PowerShell detection still returns profile paths, no throw
- rc file with a commented-out or `.`-form source line → existing `sourceLinePattern` (`shell-rc.mjs:36-39`) behavior preserved

## Verify

The one command that proves each piece done:

```
npm test
```

with `node --test test/setup/ test/cli/fgos.test.mjs` as the narrow first run.

**The item's stored `verify` field must be replaced before this item can
reach done.** As auto-written it inspects the developer's real `~/.zshrc`,
which under D1 stays dirty until a human edits it — so `runGoalCheck`
(`merge.mjs:748`) could never see it pass. `npm test` is the honest gate:
the regression this item fixes is fully expressible as tests over a
sandboxed `HOME` (D4), with no dependence on one machine's shell profile.
Flagged here as a proof point for `fgos-coding-validating`; this plan does not edit
the field itself.

## Validated at `fgos-coding-validating` — READY WITH CONSTRAINTS

Reality gate: all five dimensions PASS. Mode, shape, and ordering unchanged.
Baseline suite green before any change: **1827 tests, 1822 pass, 0 fail, 5
skipped**.

Proven, not assumed:

- **D2's divergence is real.** From inside a linked worktree,
  `git rev-parse --show-toplevel` → the worktree's own path, while
  `--git-common-dir | dirname` → `/home/vantt/projects/forgentX`.
- **The pre-existing live line is already recognized.** `hasSourceLine`
  called against the real `~/.zshrc`: main-checkout path `true`, this
  worktree's path `false`. After D2, setup reports already-configured and
  appends nothing.
- **win32 is already covered** by `test/setup/shell-rc.test.mjs:43,56,69`.
- **paths.mjs really does have 5 production importers**
  (`worker-log.mjs`, `session.mjs`, `loop.mjs`,
  `scripts/fgos-session-start-hook.mjs`, `bin/fgos.mjs`, plus
  `bin/fgos-runner.mjs` transitively). The rejection of a third resolver
  mode stands.

### C1 — the stored `verify` field is inverted and must be replaced

Run verbatim, the stored verify
(`zsh -ic exit 2>&1 | grep -c 'no such file or directory' ; ... ; grep -n
'fgos-shell-integration.sh' ~/.zshrc`) returns a **count** and exits **0**,
because `grep` exits 0 when it finds matches. So `runGoalCheck`
(`merge.mjs:748`) would see it **pass right now, with no code written** — and
it would only begin failing once the dead lines are gone, which D1 forbids
fgOS from doing. `npm test` is the honest gate (see "Verify" above). This
must be settled at `executing` before the item can reach done.

### C2 — D4 is a one-call-site change

`run()` at `test/cli/fgos.test.mjs:41` **already** accepts `extraEnv` and
merges it over `process.env`, and `test/setup/checks.test.mjs:167` already
uses exactly this pattern (`env: { ...process.env, HOME: homeDir }`). The
shared helper stays untouched; only the call at `:491` passes a sandboxed
`HOME`. Proven: running that test alone under a sandboxed `HOME` put the
line in the sandbox and left the real profile unchanged (43 → 43).

### C3 — `~/.bashrc` is the larger half

Measured: `~/.bashrc` carries **104** integration lines, **101 dead**, in a
447-line file — against `~/.zshrc`'s 43/39. Roughly **140 dead lines** total,
not 39. `detectRcFiles` returns both (`shell-rc.mjs:19`), so D1/D5's report
must cover both files.

### C4 — never use the real shell profile as a test fixture

A **live concurrent writer** was observed appending to the real profile
mid-session: the two newest lines point at `tsk-45u-Gudl0S` (already removed,
so already dead) and `tsk-5q5-SBbMIG` (present in `git worktree list` at the
time of validation). Any before/after assertion against the real profile
would be flaky by construction.

## Deferred (from CONTEXT.md, still deferred)

- Whether the dead-line report is a new `doctor` check id or an extension of
  `checkShellIntegrationSourced`'s message — implementation choice.
- Whether `~/.bashrc` needs the same measured audit `~/.zshrc` got
  (`detectRcFiles` writes to both, `shell-rc.mjs:19`) — cheap to check
  during execution.
- `docsRef` is not set on this item; `CONTEXT.md`/`plan.md` were located by
  convention. Setting it is optional per the schema and not required here.
