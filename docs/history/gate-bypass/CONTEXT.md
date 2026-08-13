# gate-bypass — locked decisions

Item: `tsk-6bx` (D1-D5), extended by `tsk-539` (D6) and `tsk-1vi` (D7-D8),
then partly **superseded by tsk-224** (D9-D11 — D6 wholly, D4 in placement,
D2 in one clause; D5 kept in full).

> **Reading order for D2/D4/D6.** Their rows below are left exactly as
> written — per AGENTS.md's "changing a decision means superseding it with
> a new record, not editing it in place", nothing about their original text
> was touched. Read D9-D11 at the end of the table for what replaced them.
Source request (raw, untrusted per RUL45): "thêm config/options để bật
tắt chế độ auto-approved tại các gate để tự động đi qua các bước, cái
này có thể quét và học cách tiếp cận của bee. hỏi distill consult. tất
nhiên chúng ta có thể sáng tạo để flexible và dễ dùng hơn, thông minh
hơn."

## Feature boundary

fgOS's own gates split into two mechanisms that must not be conflated:

- **`awaiting-human` park** (`fgos ask`/`fgos answer`, `src/state/fsm.mjs`)
  — a single generic status transition requiring a non-empty question/answer.
  This is a genuine unclear-stop that intentionally-unattended flows rely on
  to pause. **Out of scope** for this feature — untouched.
- **Skill-embedded confirmation gates** — the "ask exactly: ...?" prompts
  baked into skill prose (e.g. `fgos-coding-exploring`'s "Approve CONTEXT.md before
  planning?", `fgos-coding-planning`'s "Work shape is ready. Approve...?"). These
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
| D1 | Bypass targets skill-embedded confirmation gates only (fgos-coding-exploring / fgos-coding-planning "Approve...?" prompts). Never the `awaiting-human` park — that stays reserved for genuine unclear-stops in unattended flows. |
| D2 | Skip criterion is mechanical completeness ("zero open items"): no deferred questions and no "assumption" markers left in the gated artifact, verify command defined. Never the session's own confidence/vibe read — self-grading is exactly what a human-set ceiling (D5) exists to check. |
| D3 | A skipped gate stays visible: post a short non-question "auto-approved: ..." line and log a decision entry (`fgos decision`) every time a gate is skipped. Never a fully silent skip. |
| D4 | Hard-gate/high-risk items (RUL34 risk-keyword/module flags, `src/intake/risk-keywords.mjs`) always still stop for a human regardless of bypass setting. This floor is non-negotiable — mirrors bee's own non-negotiable floor for its riskiest lane. |
| D5 | The gate check requires two independent axes, both true, before a skip is allowed: (a) D2's mechanical zero-open-items check, and (b) the item's existing `tier` field (`light`/`standard`/`heavy`, `src/state/work.mjs:45`, already assigned by `src/intake/classify.mjs`) covered by a repo-wide config level. D4's floor overrides both axes unconditionally. This reuses tier/hard-gate infra fgOS already has rather than inventing bee's four-level scheme from scratch. |
| D6 | (seq 9891, tsk-539 — extends this feature to the third gate this feature's own "Deferred to planning" section below flagged as an open question: `fgos-coding-validating`'s `validateApprove`.) `validateApprove` gets its own mechanical bypass axis: bypass when `fgos-coding-validating`'s own reality-gate verdict is `READY` (zero constraints); always ask a human when the verdict is `READY WITH CONSTRAINTS` (any constraint at all). Measured on `.fgos/events.jsonl` (108 items through `validateApprove` as of 2026-08-09): 1 `NOT READY`, 13 `READY WITH CONSTRAINTS`, ~94 (87%) zero constraints, 0/108 ever re-asked — the only one of the three skill-embedded gates never repeated. A multi-condition axis (reality-gate-PASS + verify-runs + test-surface-exists + tier + no risk-keyword) was considered and rejected: 3 of 13 real constraints needed judgment, and 2 of those 3 were undetectable in advance — they only surface once the skill itself writes the verdict, and the skill is exactly the party that already knows it is recording a constraint. A self-reported axis (the verdict itself) fits that better than a five-way axis that has to guess ahead of time. `NOT READY` is unchanged: skips the question entirely and returns to `fgos-coding-planning`, same as today. D4's hard-gate floor and D5's tier-coverage axis both still apply unchanged, reusing `canAutoApprove`'s first two checks verbatim — only the third axis (`hasOpenItems` → verdict `!== 'READY'`) differs, via a new `canAutoApproveValidate(item, verdict, level)` export that never modifies the existing `canAutoApprove`. |
| D7 | (tsk-1vi, `docs/history/gate-bypass/DISCUSSION.md`.) All three skill-embedded Gate sections' inline `node -e` checks (`fgos-coding-exploring`/`fgos-coding-planning`'s `canAutoApprove`, `fgos-coding-validating`'s `canAutoApproveValidate`) try the existing cwd-relative import of `gate-bypass.mjs`/`store.mjs` first; if the needed named export comes back `undefined` or the import throws, retry the same import from `${root}/src/state/...` (the main checkout, already resolved into `root` earlier in each Gate section) before falling through to `false`. Reproduced on `tsk-5lr`: its `fgw/tsk-5lr` branch forked 2026-08-06, before D6 added `canAutoApproveValidate` to `main` (2026-08-09) — the cwd-relative import returned `undefined` for that export, and the uncaught `TypeError` from calling it only happened to fail closed via the Gate section's own "anything but `true` is `false`" consumer rule, not by design. A flat switch to `$root`-only import was considered and rejected: `fgos-coding-exploring`'s and `fgos-coding-planning`'s own Gate sections already document the cwd-relative import as deliberate — "this worktree's own branch already carries whatever version it needs" — protecting the case where an item is itself modifying `gate-bypass.mjs` (as D1-D5's and D6's own rollouts did) and needs its own gate check to exercise its own branch's in-progress code before `main` has it. Local-first-fallback-to-root is correct in both that self-referential case (local import succeeds, used as today) and `tsk-5lr`'s stale-branch case (local import fails, falls back to `main`'s canonical code) — and it also brings these Gate sections in line with every other `fgos <verb>` call in these same skill files, which already resolve `bin/fgos.mjs` via `$root`, not cwd. No changes to `src/state/gate-bypass.mjs`/`store.mjs` themselves. |
| D8 | (tsk-1vi.) A pure global npm install of fgOS onto a different product's repo has no repo-local `src/state/*.mjs` at all, at either `./` or `$root` — the same import crashes unconditionally for every item there, not just stale branches. This is a distinct, deeper failure mode (always-crash vs. sometimes-crash) than D7 fixes, and is out of scope for `tsk-1vi`: split into its own backlog item, `tsk-65q`, rather than expanding this item's scope, per AGENTS.md's DoD-before-polish priority order. |

| D9 | (`tsk-224`, `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1/D8.) **D6 is superseded by tsk-224.** The `validateApprove` gate D6 gave its own bypass axis no longer exists as one of two gates: `planApprove` and `validateApprove` are merged into a single gate at `fgos-coding-validating`, placed immediately before split children are materialized. D6's verdict axis (`READY` → bypass, any constraint → ask) is replaced by the two-tier criterion in that CONTEXT.md's D3-D5 plus its three ask triggers (D6 there), supplied to a new `canAutoApproveMergedGate` export; `canAutoApproveValidate` is deleted. D6's own measurement stands and is not being disputed — it was a good axis for the gate it served; that gate is simply gone. |
| D10 | (`tsk-224`, same CONTEXT.md D9/D10.) **D4 is superseded by tsk-224**, in placement rather than in strength. The 34-keyword hard-gate list is not an independent safety concern sitting above the bypass decision — it is a mechanical, keyword-shaped answer to the *same* question the merged gate's cost tier asks ("if this is wrong, can it be undone"), which is why its entries read `irreversible`, `data loss`, `migration`, `delete`, `breaking change`, `payment`. It therefore folds INTO that tier as its floor, keeping D4's non-negotiable property exactly: a session's own judgment may escalate to "ask" but can never lower the floor (that CONTEXT.md's D9 monotone invariant). Its source also widens from `title`+`description` alone to the union of that text with the plan's **structured** fields — footprint paths and child `title`/`verify`/`action` — because the old source was frozen at submit time and never saw the plan. Narrative `plan.md` prose is deliberately excluded: measured over all 318 real `docs/history/*/plan.md` files, scanning prose would trip the floor on 266 (83.6%), driven by `audit`/`auth`/`security` — this repo's everyday vocabulary, not a danger signal. |
| D11 | (`tsk-224`, same CONTEXT.md D8/D11.) **D2 is superseded by tsk-224 in one clause only**, and **D5 is kept in full.** Superseded: D2's "Never the session's own confidence/vibe read". The merged gate does accept a self-reported cost verdict — safe here, and only here, because every check in that gate is monotone toward asking, so self-grading can raise the bar and never lower it. **Not** superseded: D2's mechanical completeness check ("zero open items"), which survives unchanged as one of the merged gate's four axes, still read fresh off `plan.md`. D5 survives with both axes intact, but with what they measure named correctly: the `tier` axis measures **delegation appetite** ("how heavy a piece has the person authorized the machine to run alone"), never risk — size and reversibility are different properties — and the human-set `level` remains the one mechanism by which a person can say "stop auto-approving, I want to look", which is precisely the ceiling D2's original objection appealed to. |

## Pinned assumptions (implementer-level, deferred to `fgos-coding-planning`)

- **Level vocabulary** reuses `TIERS` (`src/state/work.mjs:45`) directly —
  `off` / `light` / `standard` / `heavy`, each covering that tier and below.
  No new vocabulary invented.
- **Config storage**: a new file `.fgos/gate-bypass.json`, following the
  existing precedent of small dedicated config files
  (`.fgos/coexistence.json`, `.fgos-runner.json`) rather than growing
  `state.json`. Exact key/schema shape is `fgos-coding-planning`'s call, not
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
- (D7/D8) `.claude/skills/fgos-coding-exploring/SKILL.md:273-286`,
  `.claude/skills/fgos-coding-planning/SKILL.md:286-299`,
  `.claude/skills/fgos-coding-validating/SKILL.md:181-198` — the three Gate
  sections' `node -e` scripts and, for the first two only, the explicit
  "this worktree's own branch already carries whatever version it needs"
  rationale for the cwd-relative import (missing from `fgos-coding-validating`'s
  own Gate section).
- (D7) `tsk-5lr`'s own record (`fgos show tsk-5lr`): `branchHeadAtTake`
  2026-08-06, `validateApprove` gate reached 2026-08-09 — three days
  after D6 added `canAutoApproveValidate` to `main`, confirming the
  stale-branch reproduction.
- (D7) every other `fgos <verb>` call across `fgos-coding-exploring`/
  `fgos-coding-planning`/`fgos-coding-validating`'s own Hard rules already resolves
  `bin/fgos.mjs` via `node "$root/bin/fgos.mjs" ... --dir "$root"` —
  the Gate sections' cwd-relative code import is the one place still
  diverging from that established convention.
- (D8) `docs/distribution-vision.md` §2 trụ cột 6 (updated 2026-08-01) —
  the three install contexts (global, project-local, dev-checkout
  self-hosting) and why the self-referential case is unique to
  self-hosting/project-local, not global install.
- (D7/D8) `docs/history/gate-bypass/DISCUSSION.md` — full round-by-round
  reasoning, including why the person's initial "flat `$root`-only"
  answer was revised after new evidence surfaced (Review/Audit rule:
  verified decision, new evidence, trade-off, options, then wait).

## Deferred to planning

- Exact schema of `.fgos/gate-bypass.json` (key names, versioning).
- Which skill files (`fgos-coding-exploring`, `fgos-coding-planning`, possibly
  `fgos-coding-validating`) need their Gate section rewritten, and how the
  "zero open items" check is implemented per artifact type (CONTEXT.md vs
  a shape/plan doc).
- Whether `fgos-routing`'s stage table or `workflow-stage-graphs.mjs` needs
  any change, or whether this is purely additive inside the existing skill
  files.
- (D7) Exact JS shape of the local-first-fallback retry (try/catch around
  a second `import()`, a pre-check on the destructured export before
  calling it, or another equivalent structure) — a real implementation
  choice, not decided here. Whether `fgos-coding-validating`'s Gate section also
  gains the explanatory "this worktree's own branch..." line that
  `fgos-coding-exploring`/`fgos-coding-planning` already carry (recommended for
  consistency, since it is currently the one Gate section missing it) is
  likewise `fgos-coding-planning`'s call.

## Outstanding questions

None — all material product decisions locked (D1-D8). Implementation
shape is `fgos-coding-planning`'s job. D6 (2026-08-09) resolves the "possibly
fgos-coding-validating" open question this file's own "Deferred to planning"
section above used to carry. D7 (2026-08-10, `tsk-1vi`) resolves the
stale-branch class of gate-check failure; D8 splits the global-install
gap into its own item (`tsk-65q`) rather than leaving it as an open
question here.
