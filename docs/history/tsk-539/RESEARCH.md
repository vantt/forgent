# RESEARCH.md — gate-question-quality-and-routing

Accumulating research rounds, called from `fgos-coding-discovering` (and later
`fgos-coding-exploring`/`fgos-coding-planning`) against items in this feature.
Never overwritten — each round appends its own dated section.

---

## 2026-08-17 · tsk-539 discovery round 1

**Asked (two related goals, investigated together since both bear on the
same unresolved "hình thức can thiệp cụ thể" question):**

1. tsk-37i (delivered) shipped a "bare id → id+gloss" citation
   self-containment convention + machine check. Does it already provide a
   reusable format/mechanism that tsk-539's gate-question citations could
   adopt directly, or would that be new work?
2. tsk-539's newest decision (logged today, 2026-08-17T16:46Z) mandates
   Markdown for all work-item text including ask/gate questions. Does any
   validation/enforcement infra for field format (Markdown or otherwise)
   already exist in this codebase?

**Checked (repo, cited):**

- `plans/reports/from-code-reviewer-to-planner-260817-2010-tsk-37i-post-merge-audit-report.md`
  (untracked, sitting in the working tree at claim time) — full read.
- `fgos list --all --json` (current live state, not the audit report's
  point-in-time view) — cross-checked every finding in the audit report
  against current item status, since the report is now several hours old
  and follow-up items have already landed since it was written.
- `rg -n "citation-format" .agents/skills docs/distillery AGENTS.md` —
  0 `SKILL.md`/`AGENTS.md` citers of `.agents/skills/_shared/citation-format.md`
  today.
- `rg -n "isValidMarkdown|requireMarkdown|markdown.*valid" src scripts` —
  0 hits. `rg -ln markdown --glob "*.mjs" src/state src/setup scripts` —
  the only src hit (`src/state/work.mjs:593`) is a code comment, not
  validation logic.

**Found:**

- The citation-format **convention doc** (`.agents/skills/_shared/citation-format.md`,
  format `<ID> (<gloss>)`) is real, current, and directly citable prose —
  no code dependency, safe to point tsk-539's own gate-question wording
  rule at it regardless of what else gets decided.
- The citation-format **machine checker**
  (`scripts/check-decision-citation-drift.mjs`) had two CRITICAL bugs at
  audit time (F1: baseline keyed by line number, breaks on any line shift;
  F2: `--write-baseline` silently amnesties real new violations) — **both
  already fixed and delivered**: `tsk-3x8` (delivered, stage executing).
  `tsk-6at` (delivered) reviewed that fix. `tsk-352f` (delivered) fixed the
  audit's F8 (bare citation baked into the generated skill-wrapper
  boilerplate). So the mechanism is materially healthier now than the audit
  report (a few hours old) describes.
- Scan-surface widening (audit F3, "zero consumers"/narrow scan roots) is
  **actively in progress**, not done and not unowned: `tsk-12v` (status
  `doing`, stage `discovery`) is widening `WIDE_SWEEP_ROOTS` to cover
  `.agents/skills`/`.claude/skills`.
- **None of tsk-37i/tsk-3x8/tsk-352f/tsk-12v ever touch, or plan to touch,
  gate-question text.** The entire checker family scans files on disk
  (`docs`, `src`, `plugins`, soon `.agents/skills`) — `.md`/source files.
  `ask`/gate-approve question text lives in `.fgos/events.jsonl` as an
  event field, a structurally different surface the file-walker never
  reaches. Extending machine enforcement to gate-question text (tsk-539's
  own Q4, "có cưỡng chế định dạng bằng máy không") would be **new design
  work with no existing scaffold to extend** — not a reuse of tsk-37i's
  checker, and not something any open item currently covers.
- The Markdown-mandate decision (2026-08-17T16:46Z) has **zero existing
  validation infra to build on**, for any field, in this codebase today.
  Whatever shape it takes (a write-time check in `fgos ask`/`fgos decision`,
  a lint pass, or prose-only convention) is undesigned.

**Still open (for exploring, not resolvable by more research):**

- Does tsk-539 commit to machine-enforcing gate-question citation format
  (Q4), given there is no existing scaffold for that specific surface —
  or does it stay convention-only (cite `citation-format.md` in the
  ask/gate-approve skill prose, no code)?
- Does the Markdown mandate apply to gate/ask question text only, or to
  every work-item text field (`description`, `decision.text/rationale/
  alternatives`, …) as its own text literally states? Which skill(s)
  write the enforcement, if any is wanted?
- The item's own `description` field is now stale relative to its
  `state.decisions` (last two decisions, both 2026-08-17, expand scope
  beyond what `description` still says was "narrowed... to its original
  core" on 2026-08-12) — exploring should reconcile this before writing a
  plan, since `description`/`refs` are what a plan would otherwise be
  shaped against.

**Verdict:** `unclear` — real product decisions remain (enforcement scope,
which fields, which skills), grounded now in current infra state rather
than the stale audit snapshot.
