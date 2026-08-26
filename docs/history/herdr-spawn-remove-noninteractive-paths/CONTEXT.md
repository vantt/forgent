# CONTEXT.md — tsk-by0: remove herdr-spawn's non-interactive dispatch paths

## Feature boundary

`src/runner/dispatch/transport.mjs`'s `herdrSpawnAdapter` — specifically its
non-interactive body (the plain sh-wrapper/sentinel path and the
`liveOutput` tee/PIPESTATUS mechanism) — plus the two `live-renderers/*.mjs`
files that mechanism alone consumes, plus the test coverage and
docs/manifest entries tied to both. `herdrSpawnInteractiveAdapter` (the
`-i`/`interactiveMode` path) is explicitly out of scope for behavior
changes beyond making it herdr-spawn's one required entry point.

## Why this round exists

`fgos-coding-validating`'s reality gate (see
`RESEARCH.md` round 2) found the plan's premise partially contradicted by
the real, gitignored `.fgos/config.json`: `claude-herdr`/`pi-herdr` declare
`liveOutput` pointing at the two `live-renderers/*.mjs` files this item
deletes, `codex-herdr` depends on the plain path entirely, and
`agy-herdr`'s own `interactiveMode` — the mechanism being kept — has a
documented, twice-confirmed production bug (never delivers the prompt,
`runner.capabilities.fgos-coding-implement`'s own description,
`prefer: "agy-cli"` as the live workaround). This needed a person's call
on whether to still proceed.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | planning->exploring hand-back: plan's core premise (keep ONLY herdrSpawnInteractiveAdapter/interactiveMode, delete plain+liveOutput paths + live-renderers as dead weight) is contradicted by real .fgos/config.json evidence -- claude-herdr/pi-herdr/codex-herdr are real dormant-but-configured herdr-spawn executors that depend on exactly what would be deleted, and agy-herdr's own interactiveMode is a twice-confirmed broken prompt-delivery path (runner.capabilities.fgos-coding-implement's own description), currently avoided via prefer:agy-cli. |
| D1 | proceed with tsk-by0's original plan as written -- delete herdrSpawnAdapter's plain-path + liveOutput mechanism + live-renderers/*.mjs. User's call: these are functionally redundant with the existing cli-spawn adapter (already provides headless/non-interactive dispatch), so removing them loses no real capability. agy-herdr's interactiveMode prompt-delivery bug (RESEARCH.md round 2) is explicitly OUT of this item's scope -- to be fixed independently on its own, never a blocker here. claude-herdr/pi-herdr/codex-herdr (dormant configs depending on the removed paths) are also fine to lose/retire, since equivalent plain executors (claude/codex/pi via cli-spawn) already cover non-interactive dispatch for those CLIs. |

## Pinned terms

- **plain path** — `herdrSpawnAdapter`'s non-interactive body when neither
  `interactiveMode` nor `liveOutput` is set: writes the command to a
  disposable script, types `sh <script>` into a fresh herdr pane, waits for
  a runner-owned exit sentinel.
- **liveOutput mechanism** — same shape, but the typed command pipes
  through `tee`+a `live-renderers/*.mjs` renderer via bash `PIPESTATUS`, so
  a person watching the pane sees translated live JSONL as readable text.
- **cli-spawn** — the sibling adapter (`cliSpawnAdapter`, same file) that
  already provides headless/non-interactive dispatch via a real local child
  process, no herdr pane involved — the capability D1 says the plain
  path/liveOutput mechanism duplicates for no real gain.

## Scout evidence

- `src/runner/dispatch/transport.mjs:903-1348` — `herdrSpawnAdapter`'s full
  shape, `EXECUTOR_ADAPTERS['herdr-spawn']` as its sole registration site
  (`RESEARCH.md` round 1).
- `.fgos/config.json`'s real `runner.executors`/`runner.capabilities` blocks
  (`RESEARCH.md` round 2) — the config-level evidence D1 directly answers.
- `test/runner/herdr-spawn-adapter.test.mjs` — full test-block enumeration
  and triage (`RESEARCH.md` round 1, section 5).

## Canonical references

- `docs/history/herdr-spawn-remove-noninteractive-paths/RESEARCH.md`
  (rounds 1 and 2 — the full evidence trail)
- `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md`
- `docs/history/herdr-spawn-agy-interactive-mode/plan.md` (tsk-10j, prior
  art for `interactiveMode`'s own design)

## Outstanding questions

None
