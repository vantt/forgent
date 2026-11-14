---
phase: 07
title: "Retire `fgos tool` (query, check) and the status overlay; move every caller to `fgos dispatch decide`; doctor probes live"
status: pending
effort: 4h
depends_on: [04, 05, 06]
parallel_with: [02]
---

# Phase 07 — One way to ask about a tool

## Context

Owner decision Q1 "one path" (plan.md "Owner decisions"): after phase 06, `fgos dispatch decide --for <capability>`
answers tool purposes through `toolProvidersOf` (`src/runner/dispatch/tool-providers.mjs`) with a live probe. This
phase deletes the second way to ask (`fgos tool query`), the overlay writer (`fgos tool check`) and the overlay
(phase 06 "Overlay facts": not needed — probe cost is in-process and staleness is computed live), and moves every
caller. Start after 04 (same `registrations.mjs`), 05 (same `bin/fgos.mjs`) and 06 (the function it moves callers
to) are merged, and only if phase 06's probe measurement met its budget; else stop and ask the big lead.
Read `src/state/tool-registry.mjs`, `bin/fgos.mjs:3611-3646` (comment and `case 'tool'`), `bin/fgos.mjs:47` (static
import), `src/cli/command-registry.mjs:2275-2304` (the `tool` entry), `src/setup/registrations.mjs:99,990-1025` (row
`tool-registry-configured`), `src/setup/executor-profile-warnings.mjs:59-63`, `src/state/fgos-file-registry.mjs:27,40`,
`AGENTS.md:228-262` ("Impact-analysis capability gate", prose above the GitNexus block), the four
`domains/coding/skills/*/references` files and `plugins/fgOS/skills/terminal/{SKILL.md,rename.sh}` listed below.
Impact analysis (as phase 01) on `checkTools`, `queryTools`, `toolsFromExecutors`, `checkToolRegistryConfigured`.

## Requirements

1. Delete the verb: `case 'tool'` and its comment block in `bin/fgos.mjs` (3611-3646) and the static import at
   `bin/fgos.mjs:47` (remove `'../src/state/tool-registry.mjs'` from `ARM_STATIC_IMPORTS` in
   `test/architecture.test.mjs:1812`: that list only shrinks); the `tool` entry in `src/cli/command-registry.mjs`
   (2275-2304); regenerate `packages/host-runtime/contracts/command-routes.json` with
   `node scripts/export-command-selectors.mjs` (and `command-manifest.json` if F0 phase 01 has landed; check
   `--check` passes). `fgos tool …` then fails as an unknown verb through the existing generic path.
2. Delete `src/state/tool-registry.mjs` whole: its live parts moved to `tool-providers.mjs` in phase 06
   (`normalizeCapability`, the probe, `isIndexStale`); the rest has no caller after (1) and (3): `toolsFromExecutors`,
   `checkTools`, `queryTools`, `readLocalStatus`, `writeLocalStatus`, `resolvedStatus`, `toolStatusPath`,
   `classifyRegistryPosture`, its `findExecutableOnPath` copy (the one door is `src/runner/paths.mjs:244`), `KINDS`.
   Delete its manifest row (`docs/architecture-manifest.json:192`; the big lead's one-writer rule: phase 08 is the
   next manifest writer, this edit lands before it), `FGOS_FILE.TOOL_STATUS` and its path
   (`src/state/fgos-file-registry.mjs:27,40`), and the `tool-status.local.json` mention in `.gitignore:18`. An
   existing `.fgos/runtime/tool-status.local.json` on a machine is inert (nothing reads it); say so in the CHANGELOG
   proposal.
3. Doctor row `tool-registry-configured` (`registrations.mjs:990-1025`): same id and same three postures, computed
   from `toolProvidersOf(runner, { repoRoot: mainCheckout })` (live): every provider `present` -> `full`; any
   `stale`, `missing` or `unknown` -> `degraded` with counts per status (no "never checked" any more); none ->
   `inactive`. Fix line: "install the missing tool, or reindex the stale one; `fgos dispatch decide --for <capability>`
   shows the answer a dispatch gets". Add one warning line per tool-served capability whose own row declares
   `prefer` (`hasOwnPreferPool`): "runner.capabilities.<cap>.prefer is ignored: <cap> is served by tool executor(s)
   <ids> through `for`" (warning, not failure; doctor never edits config). `executor-profile-warnings.mjs:59-63` reads
   `for` through `forEntriesOf`.
4. Move the callers of `tool query` to `decide` (wording, not mechanism):
   - `AGENTS.md` "Impact-analysis capability gate" (228-262, prose above the GitNexus block, never inside the
     generated block): the command becomes `fgos dispatch decide --for impact-analysis --json`; the ladder reads its
     answer: `configured: false` -> Inactive; `mechanism: "unavailable"` (`tool.missing`/`tool.unprobeable`) or
     `stale: true` -> Degraded (same wording as today for missing and stale); `mechanism: "in-process"` without
     `stale` -> Full. Replace "regardless of what `fgos tool query` reports" with `decide`.
   - `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md:67`,
     `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md:47`,
     `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md:18`,
     `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md:46`: same command swap.
   - `plugins/fgOS/skills/terminal/rename.sh:36-63`: gate on `fgos dispatch decide --for pane-labeling --json` answering
     `"mechanism": "in-process"` (same two call forms: installed shim, then `node bin/fgos.mjs`; same fail-closed
     no-op); rewrite the comment (the "registered, not present" reasoning is gone: the probe is live).
     `plugins/fgOS/skills/terminal/SKILL.md:51,67`: same.
   - Rebuild generated skill surfaces: `npm run build:skills` (rewrites `.agents/skills/` and `plugins/fgOS/skills/`
     copies of the four coding references; never edit them by hand).
   - Docs a user reads: `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:269` (the row's example message and
     fix); `docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md` lookup
     command. `docs/distillery/**` and `docs/history/**` are research and history records: not edited.
5. CHANGELOG: not edited. The report proposes, for `## [Unreleased]`:
   "`fgos tool query` and `fgos tool check` are removed. Ask `fgos dispatch decide --for <capability> --json`: it
   probes the tool live (present, stale or missing) and is the same answer a dispatch gets. The local
   `.fgos/runtime/tool-status.local.json` is no longer written or read and can be deleted. A `prefer` on a capability
   served by a tool executor is ignored; `fgos doctor` warns about it."

## Files

- Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json`
  (generated; plus `command-manifest.json` if present), `src/setup/registrations.mjs`, `src/setup/executor-profile-warnings.mjs`,
  `src/state/fgos-file-registry.mjs`, `.gitignore`, `docs/architecture-manifest.json` (delete one row),
  `test/architecture.test.mjs` (one `ARM_STATIC_IMPORTS` line), `test/setup/checks-doctor-config.test.mjs`,
  `test/test-ownership.mjs` (drop the `state-tool-registry` rule), `test/suite-baseline.json` (drop the two files),
  `scripts/check-decision-codes.baseline.json` (drop entries of deleted tests, by regenerating it the way the
  script documents), `AGENTS.md`, the four `domains/coding/skills/*/references/*.md`, `plugins/fgOS/skills/terminal/SKILL.md`,
  `plugins/fgOS/skills/terminal/rename.sh`, generated `.agents/skills/**` and `plugins/fgOS/skills/fgos-coding-*/references/**`
  (by `npm run build:skills` only), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`,
  `docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md`
- Delete: `src/state/tool-registry.mjs`, `test/state/tool-registry.test.mjs`, `test/cli/fgos-tool.test.mjs`

## Tests retired, each with its new owner

| Retired | New owner, or why gone |
|---|---|
| `tool-registry.test.mjs`: `normalizeCapability` (27, 33) | `test/runner/dispatch/tool-providers.test.mjs` (spelling folds) |
| `toolsFromExecutors` cases (42-95): `for` mapping, agent executor skipped, empty `for`, no invocations, `for[0]`, legacy `capability` field ignored | `tool-providers.test.mjs` (every `for` entry read; agent `for` ignored; no probe -> `unknown`). The `for[0]`-only and legacy-field cases: behaviour removed (every entry is read; the legacy field was retired by tsk-34n) |
| `probeTool` cases (102-153): cli/binary, mcp/skill scan, no scanTarget, stale | `tool-providers.test.mjs` (same probes, moved) |
| `KINDS` without `http` (156) | behaviour removed (no `KINDS` constant; the probe switches on `via`) |
| overlay cases (162-184): `readLocalStatus`, `writeLocalStatus`, `resolvedStatus` | behaviour removed (no overlay) |
| `classifyRegistryPosture` (190-222) | `test/setup/checks-doctor-config.test.mjs` (the row's inactive/full/degraded, now live) |
| `checkTools`, `queryTools` (225-260) | behaviour removed with the verb; query's filters by capability and status are `decide`'s wiring cases in `test/runner/dispatch.test.mjs` (phase 06) |
| `fgos-tool.test.mjs` (108-227): register/remove rejected, check writes overlay, check on missing exits 0, `--name`, query filters, multiple providers, agent never listed, unknown/no sub-verb | verb gone: unknown-verb handling is owned by the generic CLI tests (`rg -l "unknown verb" test/cli`); multiple providers and agent never listed -> `tool-providers.test.mjs`; "absence is a fact, never an error" -> `decide` missing case in `dispatch.test.mjs` |
| `checks-doctor-config.test.mjs` overlay-driven cases (28, 59-90: `writeLocalStatus`, "never checked") | rewritten in the same file against a live fixture (a cli tool on a fixture PATH, an mcp tool with and without `scanTarget`), plus one case for the ignored-`prefer` warning |
| `test/plugins/terminal-skill-attach.test.mjs:56-60` stub prints a `tool query` answer | kept; the stub `bin/fgos.mjs` prints the `decide` answer (`{"mechanism":"in-process"}`) |

## Gates

```
node scripts/export-command-selectors.mjs --check
npm run build:skills && git diff --exit-code -- .agents/skills plugins/fgOS/skills   # after committing the rebuild: clean
node scripts/run-tests.mjs test/setup/checks-doctor-config.test.mjs test/setup/checks.test.mjs \
  test/setup/registrations.test.mjs test/runner/dispatch/tool-providers.test.mjs test/runner/dispatch.test.mjs \
  test/plugins/terminal-skill-attach.test.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-help.test.mjs \
  test/cli/fgos-manifest.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs
node scripts/check-decision-codes.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
npm run fgos:dev -- doctor --json     # row tool-registry-configured answers live; warning for impact-analysis.prefer
rg -n "tool query|tool check|tool-registry|tool-status" -- src bin scripts AGENTS.md domains plugins core   # nothing
```
Plus `rg -l "tool-registry.mjs|fgos-tool|tool-status|command-registry.mjs|setup/registrations.mjs" test`.
Rust: not touched (the routes JSON is a generated contract, not Rust code); if `command-routes.test.mjs` covers a
Rust embed, run `cargo test -p` on that crate as the test names.

## Net size

src: −~330 (`tool-registry.mjs` 315, the verb case and registry entry ~45) +~25 (doctor row live, warning);
tests: −~350 (two files) +~60 (doctor cases); docs/skills: wording only.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A script or skill on another machine still calls `fgos tool query` | M x M | CHANGELOG proposal; the unknown-verb error names the verb; all in-repo callers moved and `rg` gate |
| `rename.sh` stops labeling panes | M x L | same fail-closed shape; `terminal-skill-attach.test.mjs`; herdr present -> `decide` in-process |
| Generated surfaces edited by hand or left stale | M x M | `npm run build:skills` only; diff-clean gate |
| `bin/fgos.mjs`, `command-registry.mjs`, `command-routes.json`, `AGENTS.md` collide with F0 | H x M | plan.md Collision risk; rebase first; line-local deletions |
| Doctor row fails on machines where a tool is declared but absent | M x L | same as today's degraded (it already fails, tsk-3oa2); now accurate |

## Rollback

Revert the phase merge (plan.md Rollback); 08 must be reverted first if merged.

## Success criteria

`fgos tool` is an unknown verb; `rg` gate empty; doctor row live with the warning; generated surfaces clean; gates green;
CHANGELOG line proposed in the report.
