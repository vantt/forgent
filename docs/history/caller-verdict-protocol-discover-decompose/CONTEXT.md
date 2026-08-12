---
type: context
title: "tsk-27y — caller-supplied verdict protocol for fgos discover/fgos plan"
---

# tsk-27y — caller-supplied verdict protocol for `fgos discover`/`fgos plan`

## Feature boundary

`fgos discover <id>` and `fgos plan <id>` (`bin/fgos.mjs:886-919`) always
call `resolveDiscovery`/`resolveDecompose` (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`), which — unless the existing `readLockedContext`
trust signal fires (committed CONTEXT.md for discovery; plan.md `mode:
tiny/small` for decompose) — always spawn `judgeDiscovery`/`judgeDecompose`, a
blind `claude -p` subprocess judge, even when the CLI caller is itself a live
session (e.g. `fgos-coding-exploring`/`fgos-coding-planning`) that already did real Socratic
reasoning and has a verdict in hand. This item adds new optional CLI flags on
both verbs so that caller can pass its own already-rendered verdict directly,
skipping the subprocess judge call for that invocation. Native-First Dispatch
Doctrine (`docs/decisions/0026-...md`) rule 2 realization: a bare CLI verb
cannot itself call Task tool, so "native" here means the caller supplies its
own verdict as data instead of the verb re-deriving one via a context-blind
spawn.

**Out of scope:** the runner sweep (`src/runner/loop.mjs:977,997`) calls
`resolveDiscovery`/`resolveDecompose` directly in-process with `role:
'runner'`, never through `bin/fgos.mjs`'s CLI argv parsing — so the new flags,
living only in the CLI case blocks, structurally never reach the headless
sweep without any extra guard code. This item does not touch `loop.mjs`.
`readLockedContext` is untouched — it stays the exact fallback signal for
callers (including headless/older ones) that pass no explicit verdict flag.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Phase 2 covers the full three-way decompose verdict via caller-supplied flags: `pass-through`, `need-human`, and `decompose` (with a real children array) — not a narrower pass-through/need-human-only first cut. |
| D2 | Precedence when multiple signals are present on one call: explicit caller-supplied verdict flag is checked FIRST (skips the subprocess judge outright). `readLockedContext` (discovery) / plan.md tiny-small mode (decompose) stay the exact existing fallback, evaluated only when no verdict flag is passed — unchanged from today's behavior in that case. |
| D3 | `resolveDecompose`'s existing mechanical safety gates — heavy-risk (`work.risk === 'heavy'`), blast-radius threshold, footprint-overlap-among-children (`decompose.mjs:517-577`) — fire unconditionally on a caller-supplied `decompose` verdict, exactly as they do on a model-produced one. These are synchronous JS checks (string/array comparison), not a second model/subprocess call — negligible cost — and they catch structural mistakes in caller-supplied data (e.g. two children declaring the same footprint path) the same way they catch them in model output. Never bypassed by verdict origin. |

## Pinned terms

- **caller-supplied verdict** — a verdict shape (matching `judgeDiscovery`'s
  `{clear, question?, verify?}` or `judgeDecompose`'s `{verdict, reason?,
  children?}`) passed as CLI flags to `fgos discover`/`fgos plan`,
  bypassing that call's own `judgeDiscovery`/`judgeDecompose` subprocess spawn
  for this one invocation.
- **Native-First Dispatch Doctrine** — per `docs/decisions/0026-...md`; this
  item is Phase 2 of that doctrine's 5-phase plan.

## Assumptions (implementer-level, not asked — fgos-coding-planning's call to confirm or revise)

- Flag shape, discover: `--verdict clear --verify "<cmd>"` (clear path) /
  `--verdict unclear --question "<text>"` (unclear path) — matches the
  item's own original description verbatim.
- Flag shape, decompose: `--verdict pass-through [--reason "..."]` /
  `--verdict need-human --reason "..."` / `--verdict decompose --reason "..."
  --children '<JSON array>'` — the JSON-array flag mirrors the existing
  `submit --acceptance` precedent (`bin/fgos.mjs`'s `parseAcceptanceFlag`,
  JSON-encoded array because child objects carry nested fields, not a
  comma-splittable shape). Each array element's shape matches
  `normalizeChild`'s input contract (`decompose.mjs:177-201`): `title`,
  `verify` required; `kind`, `risk`, `refs`, `footprint`, `deps` optional.
  Reuse `normalizeChild` itself to validate caller-supplied children — same
  fail-safe (`{kind: 'invalid'}` on a bad child) a model-produced verdict
  already gets, never a parallel/looser validation path for caller input.
- Audit trail: a caller-supplied verdict logs through the exact same
  `addDiscovery`/`logDecomposeVerdict` doors a model verdict does, with a
  distinct source/text noting caller-origin (mirrors the existing
  `resolveDiscovery`'s `'discovery skip: trusted committed CONTEXT.md'` /
  `resolveDecompose`'s `'decompose skip: plan.md declares mode ...'`
  precedent for a non-model-judge codepath) — so `fgos show <id>`/audit
  trail can tell a caller verdict apart from a model verdict after the fact.
- `resolveDiscovery`/`resolveDecompose` gain the caller-supplied verdict as a
  new optional trailing parameter (same additive, backward-compatible shape
  every other optional param on these two functions already follows —
  `scoutContext`, `fgosDir`, `role`) — every existing call site (including
  `loop.mjs`'s runner sweep) stays byte-identical, omitting it.

## Scout evidence

- `bin/fgos.mjs:886-919` — `discover`/`decompose` CLI case blocks, today's
  only entry point into `resolveDiscovery`/`resolveDecompose` from a live
  session; `src/cli/command-registry.mjs:130-169` — their current registered
  flags (`id`, `config` only).
- `src/intake/discovery.mjs:351-473` (`judgeDiscovery`), `:511-602`
  (`resolveDiscovery`) — verdict shape `{clear, question?, verify?}`; existing
  `readLockedContext` trust-signal skip at `:518-543`.
- `src/intake/plan.mjs:46-60` (`readLockedContext`, exported/shared with
  discovery.mjs), `:177-201` (`normalizeChild`), `:232-335` (`judgeDecompose`,
  verdict shape `{kind, reason?, children?}`), `:379-600` (`resolveDecompose`,
  including plan.md tiny/small mode skip at `:457-470` and the three
  mechanical gates at `:517-577`).
- `src/runner/loop.mjs:977,997` — runner sweep's direct in-process calls,
  confirming CLI-only flags never reach it.
- `bin/fgos.mjs`'s `submit --acceptance` (`parseAcceptanceFlag`) — existing
  precedent for a JSON-encoded-array CLI flag on this same file.
- `impact-analysis: full` — GitNexus present (`fgos tool query --capability
  impact-analysis --status present`), per `CLAUDE.md`'s capability gate.

## Canonical references

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, this item is Phase 2/5.
- `docs/history/discovery-decompose-reporoot-verify-overwrite/` — tsk-1ni
  (Phase 1), footprint overlaps this item's own target files
  (`src/intake/discovery.mjs`, `src/intake/plan.mjs`) but no logical
  dependency; tsk-1ni still at stage `decompose` as of this writing (not yet
  landed in those files) so no real merge conflict exists yet.

## Outstanding questions deferred to planning

- Exact validation-error message wording for a malformed `--children` JSON
  payload or an unrecognized `--verdict` value.
- Whether `fgos-coding-exploring`/`fgos-coding-planning`'s own SKILL.md files should be
  updated in this same item to actually pass the new flags once their gate
  approves (the original item description names this as in-scope — planning
  to confirm the concrete edit).
