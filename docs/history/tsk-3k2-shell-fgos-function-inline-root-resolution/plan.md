# Plan: inline root-resolution into fgos/fgos-runner, drop the dead helper

Item: `tsk-3k2`. Mode: **tiny** — one file, mechanical inline, no design
question, no split.

## Approach

1. `scripts/fgos-shell-integration.sh`: replace `_fgos_repo_root()`'s
   single definition with its body duplicated inline at the top of both
   `fgos()` and `fgos-runner()`; delete the standalone function
   definition (D2 — nothing else calls it).
2. `test/scripts/fgos-shell-integration.test.mjs`: add one new test that
   sources the script, `unset -f _fgos_repo_root` (now a no-op against a
   function that no longer exists, but faithfully simulates a harness
   that filtered it before this fix), and confirms `fgos --x` and
   `fgos-runner --y` both still resolve and invoke correctly. This is the
   failing-test-first proof for the real defect (D3 above).

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Inlining root-resolution into both functions | low — mechanical, 6 lines duplicated twice, no behavior change to the resolution logic itself | existing 9 tests all `source` the whole script and call `fgos`/`fgos-runner` observably — none reference the internal helper by name, so none need updating |
| Removing `_fgos_repo_root` entirely | low | `grep -rln "_fgos_repo_root" src bin scripts test .claude .agents plugins docs` — zero real call sites outside this file and historical/report docs |
| New regression test's fidelity to the real harness bug | medium — this repo cannot reproduce Claude Code's actual snapshot mechanism, only simulate its observable effect | `unset -f _fgos_repo_root` directly reproduces the one fact the bug report established: the helper is absent from the agent's shell while `fgos`/`fgos-runner` remain defined. Proven failing-test-first (Iron Law evidence) against the pre-fix script, where the same `unset -f` line makes `fgos`/`fgos-runner` fail exactly as the live repro did (`fgos:2: command not found: _fgos_repo_root`) |

Impact-analysis posture: `inactive` for GitNexus's call-graph sense — this
is a shell script, not a symbol in GitNexus's own indexed language surface
(confirmed: GitNexus's hook reminder this session only ever names
`.mjs`/`.md` symbols, never anything under `scripts/*.sh`). No blast-radius
tool applies; the risk map above is the complete proof surface.

## Outstanding questions

None
