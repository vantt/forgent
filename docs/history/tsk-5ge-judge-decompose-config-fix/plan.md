# plan.md — tsk-5ge: land the `.fgos/config.json` half of tsk-4eu on main

Mode: **tiny** (0 flags: no auth, authorization, data model, audit/security,
external system, public contract, cross-platform, or validation-removal
flag applies — this is a one-file config data edit plus a direct commit).
No `CONTEXT.md` exists for this item — `fgos-clarifying` found intent fully
understood from the item's own description (exact target shape, exact
root cause, exact precedent commits) and `discover` moved `clarify ->
decompose` directly with a caller-supplied clear verdict, same as
`tsk-4eu` itself did. This plan's only source of truth is therefore the
item's own description, verified against the real repo below.

## Verified against the real repo (not taken on faith from the description)

- `git show HEAD:.fgos/config.json` (main branch, commit `59fa540`) —
  `runner.executors.judge` still present, `runner.capacities.judge-decompose`
  still bare `{"kind":"task"}` — confirmed, matches the bug this item
  describes.
- `git show HEAD:.fgos/config.json`'s `runner.capacities.judge-discovery` —
  already carries its own `command`/`args` (including `Read`, `Task`,
  `WebSearch`, `WebFetch`, `Bash(rg:*)`) — confirmed unaffected, the shape
  to mirror.
- **The live main-checkout working tree already carries the fix,
  uncommitted** (`git status` at session start: `M .fgos/config.json`) —
  reading `/home/vantt/projects/forgentX/.fgos/config.json` directly off
  disk shows `runner.executors` is gone entirely and
  `runner.capacities.judge-decompose` now has the exact same
  `command`/`args` shape as `judge-discovery`. This matches this item's
  own target shape exactly — someone already made this edit on the shared
  main checkout but never committed it. This item's remaining work is
  narrower than its own description assumed: verify the existing
  uncommitted edit is correct and safe, prove it with the test suite, then
  commit it — not re-derive the edit from scratch.
- `docs/history/tsk-4eu-executors-key-tier-validation/plan.md`'s
  "Correction during executing" section and `iron-law-evidence.md`'s
  matching section — confirm `ADR0020`'s `fgos-write-rejected` guard
  permanently blocks any `fgw/<id>` branch from carrying a `.fgos/` change
  through `fgos approve`, and that every prior `.fgos/config.json` change
  in this repo's history landed as a direct, single-parent commit on
  `main` (`26b5403`, `b59595c`) — confirmed, same precedent this item's
  own description already cites.
- `docs/how-to/fix-fgos-write-rejected-merge-block.md` step 5 — a branch
  whose `verify` reads `.fgos/` state can still pass through `fgos
  return`'s disposable detached-worktree re-verify, because
  `test/runner/dispatch.test.mjs`'s live-config-dependent tests spawn
  `dispatch.mjs`'s CLI entry point with no override, which resolves
  `.fgos/config.json` via the shared main-checkout root
  (`git rev-parse --git-common-dir`), not the branch's own excluded
  `.fgos/` — confirmed by reading `iron-law-evidence.md`'s own "Full item
  verify command" section for `tsk-4eu`, which names exactly this
  behavior for the same 4 tests this item's own `verify` command
  (`node --test test/runner/dispatch.test.mjs`, no skip pattern) now
  exercises.

## Approach

This item is not a normal branch-merge change — its entire deliverable is
a direct operator commit against the shared main checkout, exactly the
same shape `tsk-4eu`'s own "Correction during executing" section already
established as the only legal path for a `.fgos/config.json` content
change (`ADR0020`). There is nothing for the `fgw/tsk-5ge` branch itself
to carry:

1. **Confirm the live main-checkout `.fgos/config.json` edit is correct**
   (already done above) — `executors.judge`'s content has moved into
   `capacities.judge-decompose` with `command`/`args` mirroring
   `judge-discovery`, and `executors.judge` is gone.
2. **Prove it**: run `node --test test/runner/dispatch.test.mjs` from the
   main checkout. This is the same file `tsk-4eu` pinned its own two
   regression tests in — it must now pass in full, including the 4 tests
   that read the live main-checkout config directly (previously excluded
   via `--test-skip-pattern` specifically because the config was still
   broken).
3. **Commit directly on the main checkout**, single-parent, same as
   `26b5403`/`b59595c` — never through `fgw/tsk-5ge`.
4. **This item's own `fgw/tsk-5ge` branch carries no diff.** Its `verify`
   command (`node --test test/runner/dispatch.test.mjs`) still legitimately
   proves the fix, because — per the confirmed behavior above —
   `dispatch.mjs`'s CLI entry resolves `.fgos/config.json` against the
   shared main-checkout root regardless of which worktree the test file
   itself runs from. `fgos return`'s disposable detached-worktree re-verify
   will therefore see the real, now-committed main-checkout config and
   pass.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `.fgos/config.json` edit content | Low — already applied and hand-verified above against `judge-discovery`'s own shape; no code path change, config-only | `node --test test/runner/dispatch.test.mjs` (full run, no skip pattern) — the 4 previously-skipped live-config tests now pass |
| Direct main-checkout commit | Low-medium — bypasses the normal `fgw/<id>` review/merge path entirely, by design (`ADR0020`) | Full-repo `git status` read before committing (never blind-commit on the shared main checkout); commit scoped to exactly `.fgos/config.json`, nothing else staged |
| `fgw/tsk-5ge` branch carrying zero diff | Low — this is expected and correct for this item's shape, not a defect | `fgos return`'s own re-verify still exercises the real fix via the shared-root config resolution confirmed above |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returns `gitnexus` present.
Not applicable here in practice — this item edits no function, class, or
method; `.fgos/config.json` is a data file, not an indexed code symbol, so
there is no blast-radius question `impact()` could answer for it. The one
piece of code-adjacent behavior this item touches
(`loadRunnerConfig`/`resolveExecutorConfig` reading this file) is proven
directly by the existing, already-pinned `test/runner/dispatch.test.mjs`
suite (written by `tsk-4eu`), not by graph analysis.

## No split

One honest piece of work — a single config-content edit plus one commit.
`fgos graph --json` shows `tsk-5ge` as an isolated node (no deps, no
existing children); there is no independently-shippable sub-piece to split
out.

## Explicitly out of scope

Re-deriving the config edit from scratch, or reasoning about it as if it
were still unstarted — the live working tree already carries the correct
content (see Verified section above). Any code change to
`src/runner/dispatch.mjs` — that landed already, in `tsk-4eu`, delivered.

## Outstanding questions

None. (A direct commit to the shared main branch is unusual enough that
this session will still surface it explicitly at this skill's own Gate
step before executing, rather than relying on gate-bypass auto-approval —
noted here for traceability, not because `CONTEXT.md`/`plan.md` itself is
silent on anything material.)
