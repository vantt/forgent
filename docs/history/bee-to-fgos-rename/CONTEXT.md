---
type: how-to
title: BEE_ → FGOS_ identifier rename scope (tsk-19z)
tags: [naming, bee-coexistence]
timestamp: 2026-08-13T03:25:00.000Z
source_capture_ids: []
date: 2026-08-13
status: locked
source_decisions: []
relates_specs: [runner, work-state]
---

# BEE_ → FGOS_ identifier rename scope (tsk-19z)

## Feature boundary

tsk-19z asks to find every constant/name carrying a `BEE_` prefix and
rename it to `FGOS_`. The original gate question flagged that several
`BEE_` occurrences are (or were) a live contract with the real external
`bee` tool, not fgOS's own naming, and that ADR0017 locked keeping the
fgOS/bee naming systems parallel rather than merged — so a blind
find-and-replace risked breaking real interop and contradicting a locked
decision.

The user answered directly (2026-08-13, via `fgos answer`): forgentX is
now fully isolated from bee — no live interop remains, and anything
learned from bee has already been internalized rather than depended on —
and asked for a scan-and-evaluate pass, not a blind mass rename. This
document locks what "evaluate" resolved to: which occurrences are
fgOS's own naming (rename), and which are accurate references to the
real external tool that a mechanical swap would misdescribe (keep, but
for a different reason than the original interop-risk concern).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Isolation is real, not just asserted. Scout: this checkout has no `.bee/` directory at all, and `test/e2e/coexistence-canary.test.mjs` is already written to skip honestly (`BEE_SKIP`) when no bee installation is found — the codebase already tolerates bee's absence as a normal state. This clears the interop-breakage concern the original gate question raised for `BEE_SESSION_ID` and the README badge marker: nothing left in this environment reads those names expecting bee's real output. |
| D2 | Rename applies only to identifiers **fgOS's own code defines and controls the meaning of** — even when that meaning was originally chosen to match bee's own convention. Renaming does **not** apply to occurrences where `BEE_`/`bee` is a **proper-noun reference to the actual external tool** — a real path, filename, delimiter, or flag whose entire semantic content IS "the bee tool" (e.g. `.bee/bin/hooks/bee-write-guard.mjs`, `BEE_SKIP` — a flag meaning "skip because bee isn't installed", `<<<BEE_DIGEST` — a delimiter quoted from beegog's own contract doc). Swapping those to `FGOS_` would misdescribe them, not modernize them — the ticket's mandate is a naming rename, not a rewrite of what the code is actually checking for. |
| D3 | Historical and quoted records are excluded from rename regardless of D1/D2: `docs/history/**` (immutable per-item decision records — this repo's own decisions are changed by superseding, never edited in place, the same convention ADR0017 states about itself), `docs/distillery/**` (factual capture of the real bee/beegog tools' own actual naming — rewriting these would falsify what was distilled from them), and `plans/reports/**` (point-in-time scan snapshots). These stay byte-identical; renaming them would corrupt the historical record for a naming-hygiene gain that does not apply to history. |
| D4 | In-scope renames (fgOS's own live code and currently-descriptive specs) — see table below. |
| D5 | `test/e2e/coexistence-canary.test.mjs` (`BEE_SKIP`, `.bee/` paths, `WORKSHOP_ROOT`) is explicitly **out of this item's scope**. Whether fgOS should keep testing coexistence with a real bee installation as a product capability (for other workshops/users who may still run both tools) is a separate, larger decision than an identifier rename — this item does not touch that test file at all. If it turns out to be genuinely dead weight, that is a new candidate item, not silently folded into this one. |

## In-scope rename table (D4)

| File | Current | New |
|------|---------|-----|
| `src/runner/session-identity.mjs:67` | `'BEE_SESSION_ID'` (first key in `envSessionId`'s priority list) | `'FGOS_SESSION_ID'` |
| `src/runner/session-identity.mjs:6-8,20,33` | Header comments describing the env var and its "same precedence as `.bee/bin/lib/lock.mjs`'s `envSessionId`" rationale | Update to describe `FGOS_SESSION_ID` plainly; drop the bee-priority-matching claim (no longer true — D1) |
| `plugins/fgOS/skills/terminal/rename.sh:60-63` | `fg_ssid="${BEE_SESSION_ID:-}"` + comment "fgOS/bee's own session id" | `fg_ssid="${FGOS_SESSION_ID:-}"`; comment describes it as fgOS's own session id only |
| `plugins/fgOS/skills/terminal/rename.sh:78-79` | Comment: "resolveWriterIdentity()'s own fallback chain reads CLAUDE_CODE_SESSION_ID too when BEE_SESSION_ID is unset" | Update the env var name referenced |
| `test/runner/session-identity.test.mjs` (10 occurrences) | `BEE_SESSION_ID` in fixtures/test names | `FGOS_SESSION_ID` |
| `test/e2e/main-checkout-lock-hook.test.mjs` (11 occurrences) | `BEE_SESSION_ID` in fixtures | `FGOS_SESSION_ID` |
| `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (2 occurrences) | `BEE_SESSION_ID` in fixtures | `FGOS_SESSION_ID` |
| `test/cli/fgos-return.test.mjs` (5 occurrences) | `BEE_SESSION_ID` in fixtures | `FGOS_SESSION_ID` |
| `README.md:3,5` | `<!-- BEE:BACKLOG-BADGES:START/END -->` | `<!-- FGOS:BACKLOG-BADGES:START/END -->` — text-only. Scout: no script or CI workflow in this repo currently reads/writes this literal marker string (grepped `.github/`, `*.mjs`, `*.cjs`, `*.sh`, `*.json` — no hit besides README.md itself), so this is behavior-inert. Building a real fgOS-native badge generator is out of scope for this item (scope creep) — deferred. |
| `docs/specs/runner.md:1051` | Prose describing `resolveWriterIdentity()`'s env priority as `BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`, matching `.bee/bin/lib/lock.mjs` | Update to `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`, drop the bee-matching claim — this spec describes the present system, not history |
| `docs/specs/work-state.md:171` | Table cell citing `BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` | Update to `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` |

## Pinned terms

- **"fgOS's own naming"** — an identifier fgOS's own code or currently-live
  docs (`docs/specs/**`) define and control the meaning of, even if the
  original choice was made to match another tool's convention.
- **"proper-noun reference to bee"** — an identifier, path, filename, or
  delimiter whose entire semantic content IS the external `bee`/`beegog`
  tool (its real directory layout, its real env vars as read by *its own*
  code, a flag describing bee's presence/absence, or a literal quote of
  bee's own documented syntax).

## Scout evidence

- No `.bee/` directory exists in this checkout (D1).
- `test/e2e/coexistence-canary.test.mjs:64-66` — `WORKSHOP_ROOT`/`BEE_SKIP`
  already designed to skip honestly when no bee installation is found,
  proving the codebase already treats bee's absence as a normal, tested
  state, not a gap.
- `src/runner/session-identity.mjs:6-8,20,33,67` — `BEE_SESSION_ID` is
  fgOS's own priority-list entry, explicitly chosen to match
  `.bee/bin/lib/lock.mjs`'s `envSessionId` precedence for coexistence.
- `plugins/fgOS/skills/terminal/rename.sh:60-79` — mirrors the same
  env var and rationale in shell.
- `docs/specs/runner.md:1051`, `docs/specs/work-state.md:171` — current,
  live specs restating the same env var priority.
- `README.md:3-5` — `BEE:BACKLOG-BADGES` marker; no generator found
  in-repo (`.github/workflows/ci.yml` has no badge logic; no `.mjs`/`.cjs`/
  `.sh`/`.json` file references the literal string).
- `docs/history/fgos-terminal-pane-rename/CONTEXT.md:27,43,52`,
  `docs/history/tsk-1wr/plan.md:83`, `iron-law-evidence.md:72`,
  `docs/history/tsk-3xo-domain-agnostic-stage-literals/iron-law-evidence.md:99`
  — historical decision records quoting `BEE_SESSION_ID`/`BEE_SKIP` as they
  existed at decision time (D3, excluded).
- `docs/distillery/sources/bee.md`, `docs/distillery/sources/beegog.md`,
  `docs/distillery/reports/distill-bee-inventory-*.md`,
  `docs/distillery/deep-dives/work-item-schema-and-io-contracts.md` —
  factual capture of the real bee/beegog tools (D3, excluded).
- `docs/history/fanout-and-delegation-rubric/DISCUSSION.md:164,272` —
  quotes beegog's own `<<<BEE_DIGEST` delimiter convention verbatim (D3,
  excluded — this is bee's real syntax, not fgOS's).
- `plans/reports/distill-consult-worktree-in-out-bee-260728.md:136,170`,
  `plans/reports/from-scan-team-to-planning-260729-1614-...md:84,402` —
  point-in-time scan reports quoting bee's real `BEE_AGENT_NAME`/
  `BEE_SKIP` (D3, excluded).
- `impact-analysis` capability gate: `fgos tool query --capability
  impact-analysis --status present` returned `gitnexus` present — full
  posture. This skill makes no code edits itself, so this is
  informational for whichever session executes the plan next; that
  session should still run `impact({target: "resolveWriterIdentity",
  direction: "upstream"})` before editing it, per `CLAUDE.md`'s own rule,
  rather than treat this note as already having done so.

## Canonical references

- `docs/decisions/0017-dong-audit-he-id-ten-goi.md` — the ADR the original
  gate question cited; its decision #1 ("keep fgOS/bee naming systems
  parallel, do not merge") was framed for a period when bee coexistence
  was still live. This item does not edit or supersede 0017 itself — that
  ADR's own text still accurately describes *why* the systems were kept
  parallel *then*; D1 above is new evidence about *now*, recorded here
  rather than as an ADR edit (ADR change = supersede, never edit in
  place, per 0017's own closing line). Whether 0017 itself needs a
  superseding record is named as an outstanding question below, not
  decided by this item.
- `docs/decisions/0004-pham-vi-va-non-goal.md` — the "ngưỡng-có-tên"
  (named threshold) framing for when forgent may stop running in parallel
  with its build harness. Same treatment: this item's evidence (D1) is
  relevant to that threshold, but deciding whether the threshold is
  formally reached is out of this item's scope.

## Outstanding questions

Whether ADR0017 (and possibly 0004) should be formally superseded given
the isolation confirmed in D1, and whether `coexistence-canary.test.mjs`'s
bee-interop testing should be retired as a feature, are both real
follow-on questions this item surfaced but does not answer — they are
larger product decisions than a naming rename, and are better raised as
their own candidate items once this rename lands. `fgos-coding-planning`
should treat the D4 rename table as the full scope of tsk-19z and not
expand into either of those.
