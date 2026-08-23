# Plan — tsk-37l: reusable wrapper-script helper

Mode: standard

Lane decided directly (no `fgos-routing` Orient handoff — claimed and
driven straight through by `fgos-coding-driving`). Flags counted per
`fgos-routing`'s Mode-gate table: **public contracts** (edits
`.agents/skills/_shared/executor-dispatch-fallback.md`, the shared
fragment six coding-domain skills point at) and **existing covered
behavior** (`scripts/`/`test/scripts/` is an established, tested
convention this item extends). 2 flags → standard. This item only adds a
new dev-tooling script, a test, and a doc-pointer edit — it does not
touch identity/access control, losing stored data, a compliance review
surface, an outside service dependency, or removing an existing safety
check, so none of the mode-gate's hard-gate categories apply here — not
high-risk. No single yes/no question decides plan realism — not a spike.

No CONTEXT.md exists — discovery's verdict was `clear`, skipping
`exploring` (per `fgos-coding-discovering`'s own Flow). `docsRef`
registered fresh at this step, reusing the discovery-stage feature dir.

## Approach

**Chosen path:** a new, general-purpose, dispatch-agnostic script,
`scripts/write-wrapper-script.mjs`, that takes an arbitrary shell command
string, writes it into a small `.sh` file (`#!/bin/sh` + `set -eu` + the
command) inside a target directory (default cwd), `chmod +x`s it, and
prints the resulting file path to stdout — nothing else. A caller (a
live session, or another script) captures that one path and hands it
straight to Monitor/Bash, replacing the hand-authored-every-time Write-
tool step.

CLI contract:
```
node scripts/write-wrapper-script.mjs --command "<full shell command>" [--dir <path>] [--name <basename>]
```
- `--command` (required): the exact command to wrap, written byte-for-byte
  into the file body — never re-quoted, re-escaped, or interpreted.
- `--dir` (optional, default cwd): where the wrapper file is written —
  the caller passes its own worktree path, matching the existing
  hand-written pattern (`dispatch-tsk-2ky.sh` written directly inside
  the worktree, per this same conversation's own tsk-2ky precedent).
- `--name` (optional): basename for the file (`.sh` appended if absent);
  default derived from a short random suffix so repeated calls in the
  same dir never collide, matching the existing `dispatch-tsk-<id>.sh`
  naming habit without forcing it.

Prints exactly one line: the absolute path to the file that was written,
so a caller can capture it directly (`path=$(node scripts/write-wrapper-
script.mjs --command "..." --dir "$root")`) rather than parsing JSON for
a single string.

**Why general-purpose, not dispatch-specific:** RESEARCH.md Round 1
confirms the guard trips on general shell-syntax complexity (pipe/
substitution/multi-statement), not something specific to
`dispatch.mjs execute`'s own `--prompt "$(cat ...)"` shape — a narrower
`--prompt-file` flag on `dispatch.mjs` would not have helped the other
real cases the scratchpad sweep found (`run-verify.sh`, `run-gate-
check.sh`, `codex-*-test.sh` probes, none of which are dispatch prompts
at all). A single general helper covers all of them with one file.

**Why NOT auto-invoke or auto-cleanup (scope cut from the original
submission text's "can also self-clean... after the dispatch
completes"):** the smallest honest piece is "generate the wrapper", not
"generate AND run AND clean up" — auto-invoking would require the helper
to own Monitor-launching logic it has no business owning (Monitor is a
tool-call surface, not something a Node script can invoke), and
auto-cleanup-after-completion requires the helper to know when "after"
is, which only the caller (holding the Monitor result) actually knows.
Leaving cleanup to the caller (a plain `rm` after reading the Monitor
result, or simply leaving it — the file sits inside a worktree that gets
removed at merge/cleanup time anyway, same fate `dispatch-tsk-2ky.sh` had
this session) keeps the helper's own contract to exactly one
responsibility, matching Layer 1 rule 2's "stay inside your declared
boundary" discipline applied to a script instead of a dispatched worker.

**Alternatives rejected:**
1. A new `dispatch.mjs` subcommand (`wrap-and-execute`) instead of a
   standalone script — rejected: ties the helper to the dispatch module
   specifically, when the real evidence (Round 1) shows the need is
   general (verify probes, gate-check calls, arbitrary multi-step
   commands), not dispatch-only. A standalone script under `scripts/`
   matches the existing convention for repo-wide utilities
   (`scripts/install-git-hooks.mjs`, etc.) better than adding an
   unrelated concern to `dispatch/cli.mjs`.
2. Auto-invoke-and-report (the script also launches Monitor itself,
   returning the result) — rejected per the scope-cut reasoning above: a
   Node script cannot call the Monitor tool; only a live session can.
   This alternative was never actually buildable, not merely
   undesirable.
3. Leave the pattern undocumented-but-tolerated (do nothing) — rejected:
   the scratchpad sweep (12+ sessions, 2026-08-14 through 2026-08-19)
   shows this recurs constantly and costs "2 extra tool calls plus a
   stray file to clean up, every time" (tsk-38w's own words), a real,
   measured, recurring cost this item exists to reduce.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| New script `scripts/write-wrapper-script.mjs` | standard | Real test: write a command, read the file back, assert exact byte-for-byte content, assert the executable bit is set, assert the printed path resolves to a real file |
| Doc references added to `executor-dispatch-fallback.md` Step B (both `.agents/` and `plugins/fgOS/` mirrors) pointing at the new helper as the preferred generation step, keeping the existing hand-authoring instructions as the underlying explanation | standard | Same mirror-parity test tsk-3rg/tsk-38w themselves used: `test/skills/fgos-mirror.test.mjs` |

No row needs blast-radius/impact-analysis evidence — this item creates a
new, standalone file and edits prose; nothing existing changes shape at
the function/symbol level.

**Impact-analysis posture:** `full` — `fgos tool query --capability
impact-analysis --status present` returned `gitnexus` present. Not
applicable at symbol level: no existing function/class is being modified,
only a new file created and prose edited (same honest non-applicability
tsk-2ky's own plan.md recorded for a pure prose edit).

**Files touched, in order:**
1. `scripts/write-wrapper-script.mjs` — the new helper.
2. `test/scripts/write-wrapper-script.test.mjs` — real test, matching the
   `scripts/<name>.mjs` / `test/scripts/<name>.test.mjs` pairing
   convention already used by every other file in `scripts/`.
3. `.agents/skills/_shared/executor-dispatch-fallback.md` and
   `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` — Step B
   gets one added line pointing at the helper as the way to produce the
   wrapper file, replacing "write the exact command into a small wrapper
   script file" (manual) with "run `scripts/write-wrapper-script.mjs
   --command "..." --dir "$root"` to produce the wrapper file" — the
   existing prose explaining WHY (single-file invocation satisfies the
   guard) stays, since that reasoning doesn't change.
4. `CHANGELOG.md` `## [Unreleased]` — per `AGENTS.md`'s install/setup/
   doctor gate: a new dev-facing script every session's dispatch flow can
   use is user-visible. To be confirmed/added at Execute.

## Shape

Concrete cases worth proving against, at `standard` depth:
- **Positive case:** the script writes a file whose content matches
  `--command` exactly (no re-escaping, no truncation), the file is
  executable, and the printed stdout is exactly the one absolute path
  (nothing else — a caller doing `path=$(node scripts/write-wrapper-
  script.mjs ...)` must get a clean, single-line path).
- **Existing behavior must not regress:** `test/skills/fgos-mirror.test.mjs`
  still passes after the `executor-dispatch-fallback.md` edit (both
  mirror copies stay byte-identical) — the same test tsk-3rg/tsk-38w
  themselves relied on.
- **Edge/boundary case:** a `--command` value containing single quotes,
  double quotes, or a literal `$(...)` substring must survive into the
  file unmodified — the whole point is embedding an arbitrary real
  command, including one that itself contains quoting.
- **Collision case:** two calls in the same `--dir` with no `--name`
  produce two DIFFERENT files (never silently overwrite one another).

## Split decision

No split. One honest piece: one small script, its own test, and a
doc-pointer update — nothing here crosses an independent module boundary
that would benefit from being its own separately workable item.

## Verify (pass-through, synced onto the item)

```
npm test && grep -q 'write-wrapper-script.mjs' .agents/skills/_shared/executor-dispatch-fallback.md
```

- `npm test` — runs the new `test/scripts/write-wrapper-script.test.mjs`
  plus the standing `test/skills/fgos-mirror.test.mjs` mirror-parity
  check, both already part of the suite `npm test` runs in full.
- POSITIVE — confirms the doc pointer was actually added, not just the
  script created in isolation with nothing referencing it.

## Outstanding questions

None
