# Phase 6 fgos-code-change merge design research

Read-only research, no files written by the fork. Produced to draft Units
I28/I29 in `plans/260919-coordination-skill-harness-simplification/plan.md`.

## 1. Existing skills, read in full

- `core/skills/fgos-plan-loop/SKILL.md` (181 lines) already has its own
  Facade Hook Values table (~L45-58) from Phase 4/I15 — the exact template
  I26 cited as precedent. Its `open inputs` hook (~L50) reads from
  `plan.md`'s Product Gates table, never calls `fgos capability match`.
- `domains/coding/skills/fgos-code-panel/SKILL.md` (977 lines) has NO
  fragment link, NO hook table — Phase 4/I15 never touched it. Much
  larger, self-contained: mode-selection rules M1/A1/A2/CE1-5, a
  recursive-dispatch guard (R2), a 3-tier proof policy, full
  actor-roster/model-tier prose, a post-merge-verification protocol.
- Mode-selection: code-panel decides `direct-single-cell` vs.
  `planned-multi-cell` via imperative-instruction-directed-at-plan
  detection (~L90-151); the recursive-dispatch guard (R2, ~L153-163)
  prevents re-entering planned mode from inside an active plan-loop cell
  dispatch.
- **Duplication is architectural, not textual**: no literal copied JSON/
  worktree-recipe/roster/recovery-prose block exists between the two
  files as-is. Code-panel's `open.json`/`fix-N.json`/`close.json`
  templates (~L635-873) and its private-worktree section (~L600-631) are
  code-panel's own, structurally PARALLEL to but not textually copied
  from plan-loop's step-by-step cell operations (~L61-181). Phase 6's own
  "duplicated" wording refers to two independent implementations of the
  same open/fix/close/worktree lifecycle shape — an implementer needs to
  DESIGN one shared version, not just delete a copy-pasted block.

## 2. `coding-design-panel`

Not a separate skill file — a routing target name inside
`core/skills/fgos-panel/SKILL.md` (~L45: "For `architecture-panel` or
architectural `coding-design-panel`, follow..."). It's `fgos-panel`'s own
advisory route, already structurally distinct from both plan-loop/
code-panel (advisory, non-mutating). No boundary work needed — just don't
let the merged facade's own routing swallow this existing route.

## 3. CLI shapes (read directly from `bin/fgos.mjs`)

- `fgos plan-lint <path> [--cell <id>] [--json]` → `{path, ok, units,
  findings}` (~`bin/fgos.mjs:2504-2536`). `ok: false` is the hard-finding
  signal that must refuse cell open.
- `fgos capability match --demand '<json>' [--override <cap> --reason
  <text>]` (~`bin/fgos.mjs:2547-2568+`) → returns a `form` field:
  `"facade"` (triggers on `hasPlanOrTrack` alone, per I20's own fix round
  M1) or `"inline"` (no cell should open at all).

## 4. Deprecated-stub precedent

Confirmed still none anywhere in the repo (re-grepped) — I26's own finding
holds. Phase 6's unit will be the FIRST to establish this pattern, not
copy an existing one.

## 5. Unit-split recommendation

Split into two units, mirroring the I24a/I24b and I25/I26 precedent:

- **Unit A (I28)** — build `fgos-code-change` fresh: fragment link + hook
  table wired to real `plan-lint`/`capability match` calls, one merged
  open/fix/close lifecycle covering both single-cell and plan-mode, the
  mode-selection rule reused from code-panel's own M1/A1/A2/CE1-5/R2
  logic. Pure creation, no deletion risk.
- **Unit B (I29, depends on I28)** — convert `fgos-plan-loop` and
  `fgos-code-panel` into deprecated stubs pointing at the new facade,
  removing their old content only once the new facade is proven to carry
  it forward.

Reasoning: `fgos-code-panel` alone is 977 lines of real operational
doctrine (proof-tier policy, actor rosters, post-merge-verification
protocol) that must be preserved SOMEWHERE in the new facade before the
old file can safely become a stub. Building and stubbing in one unit
risks the exact "we deleted real content with nowhere to land" trap I26's
own decomposition review caught for `fgos-group-thinking`. Sequencing the
stub-conversion as a dependent follow-up, only after the new facade is
tested and verified to actually carry the content forward, avoids
repeating that exact class of mistake.

## Unresolved (Lead's call, not guessed)

Whether the 3-tier proof policy (focused/affected/full) and the
model/executor roster prose get copied verbatim into the new facade, or
BECOME the coding-cell-policy fragment's (`../_shared/coding-cell-policy.md`)
new canonical content — `fgos-plan-loop` already links that fragment for
its own policy layer (~L20). This is a real design choice: retroactively
promoting code-panel's richer version into the shared fragment (so both
plan-loop-derived and code-panel-derived logic converge on ONE canonical
policy source) versus keeping it facade-local prose in the new skill.
