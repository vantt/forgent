# gate-bypass — locked decisions

Item: `tsk-6bx`. Source request (raw, untrusted per RUL45): "thêm
config/options để bật tắt chế độ auto-approved tại các gate để tự động đi
qua các bước, cái này có thể quét và học cách tiếp cận của bee. hỏi distill
consult. tất nhiên chúng ta có thể sáng tạo để flexible và dễ dùng hơn,
thông minh hơn."

## Feature boundary

fgOS's own gates split into two mechanisms that must not be conflated:

- **`awaiting-human` park** (`fgos ask`/`fgos answer`, `src/state/fsm.mjs`)
  — a single generic status transition requiring a non-empty question/answer.
  This is a genuine unclear-stop that intentionally-unattended flows rely on
  to pause. **Out of scope** for this feature — untouched.
- **Skill-embedded confirmation gates** — the "ask exactly: ...?" prompts
  baked into skill prose (e.g. `fgos-exploring`'s "Approve CONTEXT.md before
  planning?", `fgos-planning`'s "Work shape is ready. Approve...?"). These
  fire unconditionally today, even when the underlying artifact is already
  complete and there is no real decision left for a human to make. **This is
  the target** — the low-value-ask problem this item exists to fix.

Reference pattern: bee's `gate_bypass` (`.bee/config.json`, levels
`off`/`normal`/`full`/`total`, `docs/distillery/sources/bee.md:169`) forces
an external, human-set, persisted ceiling above the LLM's own judgment,
specifically because bee's skip condition is an LLM confidence read — which
untrusted item text could talk a session into faking. fgOS's skip condition
(below) is mechanical instead, so it doesn't need bee's four-level scheme,
but it keeps the same two-layer shape: a deterministic trigger, gated by a
human-set ceiling, never by the session's own say-so alone.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Bypass targets skill-embedded confirmation gates only (fgos-exploring / fgos-planning "Approve...?" prompts). Never the `awaiting-human` park — that stays reserved for genuine unclear-stops in unattended flows. |
| D2 | Skip criterion is mechanical completeness ("zero open items"): no deferred questions and no "assumption" markers left in the gated artifact, verify command defined. Never the session's own confidence/vibe read — self-grading is exactly what a human-set ceiling (D5) exists to check. |
| D3 | A skipped gate stays visible: post a short non-question "auto-approved: ..." line and log a decision entry (`fgos decision`) every time a gate is skipped. Never a fully silent skip. |
| D4 | Hard-gate/high-risk items (RUL34 risk-keyword/module flags, `src/intake/risk-keywords.mjs`) always still stop for a human regardless of bypass setting. This floor is non-negotiable — mirrors bee's own non-negotiable floor for its riskiest lane. |
| D5 | The gate check requires two independent axes, both true, before a skip is allowed: (a) D2's mechanical zero-open-items check, and (b) the item's existing `tier` field (`light`/`standard`/`heavy`, `src/state/work.mjs:45`, already assigned by `src/intake/classify.mjs`) covered by a repo-wide config level. D4's floor overrides both axes unconditionally. This reuses tier/hard-gate infra fgOS already has rather than inventing bee's four-level scheme from scratch. |

## Pinned assumptions (implementer-level, deferred to `fgos-planning`)

- **Level vocabulary** reuses `TIERS` (`src/state/work.mjs:45`) directly —
  `off` / `light` / `standard` / `heavy`, each covering that tier and below.
  No new vocabulary invented.
- **Config storage**: a new file `.fgos/gate-bypass.json`, following the
  existing precedent of small dedicated config files
  (`.fgos/coexistence.json`, `.fgos-runner.json`) rather than growing
  `state.json`. Exact key/schema shape is `fgos-planning`'s call, not
  decided here.

## Scout evidence cited

- `src/state/fsm.mjs:85-184` — `awaiting-human` is the only status-machine
  gate; requires non-empty `ask`/`answer` text to enter/leave.
- `src/cli/command-registry.mjs:197-234` — `ask`/`answer` CLI surface.
- `src/state/work.mjs:45,99` — `TIERS = ['light','standard','heavy']`,
  default `tier: 'standard'`.
- `src/intake/classify.mjs:40-72` — tier classification at item creation.
- `src/intake/risk-keywords.mjs:12` — hard-gate flag detection (D4's floor).
- `docs/distillery/sources/bee.md:169` — bee's `gate_bypass` level table
  (reference pattern, not copied verbatim per D5).
- `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md:188`
  — bee's rule that bypass level is read from config, never a verbal
  override — the reasoning D5's two-layer shape is grounded in.
- `.fgos/coexistence.json`, `.fgos-runner.json` — existing small
  dedicated-config-file precedent, cited for the pinned config-storage
  assumption.

## Deferred to planning

- Exact schema of `.fgos/gate-bypass.json` (key names, versioning).
- Which skill files (`fgos-exploring`, `fgos-planning`, possibly
  `fgos-validating`) need their Gate section rewritten, and how the
  "zero open items" check is implemented per artifact type (CONTEXT.md vs
  a shape/plan doc).
- Whether `fgos-routing`'s stage table or `workflow-stage-graphs.mjs` needs
  any change, or whether this is purely additive inside the existing skill
  files.

## Outstanding questions

None — all material product decisions locked (D1-D5). Implementation
shape is `fgos-planning`'s job.
