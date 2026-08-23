# tool-registry-capability-port — locked decisions

Item: `tsk-1dj`. Source request (raw, untrusted per RUL45): "Port
tool-registry-capability from repository-harness (distillery candidate,
docs/distillery/sources/repository-harness.md#tool-registry-capability):
a two-way registry -- capability manifest the harness provides + inbound
tools a project registers (kind: cli/binary/mcp/skill/http; capability
kebab-case; responsibility); a `tool check` probe for presence; agent
queries before a step that needs a tool. Core contract: 'absent tool
capability is a clean skip, never a failure.'"

## Feature boundary

Porting the `tool-registry-capability` mechanism itself into fgOS: a new
`fgos tool` verb-group (`register`/`check`/`query`/`remove`), its
event-log-backed store (`view.tools`) plus a separate local,
gitignored status overlay (`.fgos/tool-status.local.json`), and a new
`fgos doctor` check entry that surfaces registry posture.

The design (store split, verb signatures, capability normalization,
degrade-ladder semantics, kind-vs-probe-strategy mapping) is already
fully specified in `docs/distillery/deep-dives/tool-registry.md` — this
item does not re-derive it, only locks the product-level scope gaps that
doc left open.

**Out of scope** (belongs to a sibling item, not this one):
- `tsk-1e4` — rewriting fgos-coding-planning/fgos-coding-validating/fgos-coding-implement
  prose (and `CLAUDE.md`) to consult the `impact-analysis` capability
  instead of hardcoding "GitNexus". Building the registry does not by
  itself make anyone ask it (deep-dive's own finding: injection is a
  prose contract, never automatic) — that prose rewrite is tsk-1e4's job.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | tsk-1dj's deliverable includes the `fgos doctor` DOCTOR_CHECKS entry (`tool-registry-configured`, one new entry in the existing array at `src/setup/checks.mjs:173`) that reports inactive/degraded/full registry posture — not deferred to a later item. Matches the deep-dive's own proposal and the "add-through-not-alongside" doctrine already settled at `docs/distillery/porting-log.md:86`. |
| D2 | The `kind` enum ports repository-harness's full 5-value set (`cli`/`binary`/`mcp`/`skill`/`http`) unchanged, not trimmed to only `mcp`/`cli`. Future providers (a `skill`-kind or `http`-kind capability provider) register without a schema change later; validation cost is the same either way. |
| D3 | tsk-1dj also pre-seeds the `impact-analysis` capability and registers `gitnexus` (kind `mcp`, scan target `.gitnexus`, per `AGENTS.md`'s own reference to `.gitnexus/run.cjs`) as part of this item's own deliverable, rather than shipping an empty registry. This absorbs the job `docs/history/tool-registry-capability-learn/CONTEXT.md` (tsk-2br's own locked decisions, line 21) had scoped to `tsk-4ad` ("registering gitnexus itself for this repo once the verb-group exists"). **Consequence, not itself decided here:** once tsk-1dj lands, `tsk-4ad`'s stated job is already done — that item's own disposition (close as done-by-tsk-1dj, or redirect to something else) is for whoever next reads `tsk-4ad`, not silently resolved by this item. |

## Pinned terms

- **Capability** (from the deep-dive, carried over unchanged): a
  free-text, kebab-case-normalized label a workflow step asks for (e.g.
  `impact-analysis`) — never a specific tool name. A tool *registers*
  against one or more capabilities; a step *consults* a capability, never
  a tool directly.
- **Registered vs present**: `register`/`remove` are team decisions
  (event-log, `view.tools`); `check`'s resulting `status` (`present` /
  `missing` / `unknown`) is a fact about *this machine*, stored locally
  and gitignored, never folded into the shared event-log.

## Scout evidence cited

- `docs/distillery/deep-dives/tool-registry.md` — full technical design
  (store split, verb signatures §"Thiết kế cụ thể", doctor-check
  add-through note, capability vocab note, kind enum as ported from
  repository-harness §"Cơ chế").
- `docs/history/tool-registry-capability-learn/CONTEXT.md` — sibling
  item tsk-2br's locked scope boundary (originally assigned gitnexus
  registration to tsk-4ad; D3 above knowingly changes that assignment).
- `docs/distillery/porting-log.md:34` — candidate row, already bumped
  R2→R3 by tsk-2br with a concrete blocking use case (tsk-1e4).
- `docs/distillery/porting-log.md:86` — add-through-not-alongside
  doctrine cited for D1.
- `src/setup/checks.mjs:173` — existing `DOCTOR_CHECKS` array confirmed
  open for a new entry; no existing `tool` verb collision found in
  `bin/fgos.mjs`.
- `AGENTS.md:65` — confirms `.gitnexus` as the on-disk marker this repo
  already documents for GitNexus, used as D3's `--scan` value.

## Outstanding questions

None — all three material gray areas (doctor-check inclusion, kind enum
breadth, initial seed data / tsk-4ad overlap) were locked by direct
answer above. No deferred items beyond the tsk-4ad consequence noted in
D3, which is flagged, not resolved, here.
