---
title: main-checkout-reset ancestor/commit-loss guard
item: tsk-1ck
---
# tsk-1ck — Plan

Mode: high-risk

Lane decided via `fgos-routing`'s Mode gate (not pre-loaded into this
session — applied directly here per `fgos-coding-planning`'s direct-entry
fallback). Flags counted: **data loss** (hard-gate flag — this item's own
description documents a real incident, 2026-08-26, where two sessions'
already-committed work was silently discarded by a `reset --hard` this
guard did not catch) and **existing covered behavior** (an existing test
file, `test/runner/main-checkout-reset-guard.test.mjs`, already locks
`assertSafeMainCheckoutReset`'s current two behaviors as tsk-3au's
acceptance bar — CONTEXT.md D2/Gate note). One hard-gate flag alone forces
`high-risk` regardless of total count, per the Mode gate's own rule.

Discovery verdict `clear` skipped `exploring` (no CONTEXT.md exists for
this item) — see `RESEARCH.md`'s Round 1 for the grounding evidence this
plan cites throughout; there is no locked-decisions table to cite D-ids
from, so every claim below traces to `RESEARCH.md` or a direct read
instead.

## Approach

**Chosen path**: extend the existing dirty-tree guard
(`assertSafeMainCheckoutReset`, `src/runner/main-checkout-reset-guard.mjs`)
with a second, independent check — whether `--sha` is a strict ancestor of
current `HEAD` with one or more real intervening commits — refusing
(unless the caller passes `--confirm`, reusing the existing flag rather
than adding a new one) and, on refusal, listing the commits about to be
discarded (author, subject, files touched), mirroring the dirty-tree
refusal's existing shape of "print full evidence, then let `--confirm`
override." This directly implements the item's own "Suggested direction"
(its description explicitly says "not prescriptive — let discovery/
planning judge" — `RESEARCH.md` Round 1 already closed the one open design
question this needed, see below).

**Alternatives rejected**:
- *A new git hook to catch a raw `git reset --hard` outside the `fgos`
  CLI* (the item's own second suggested direction) — rejected on evidence,
  not judgment: `RESEARCH.md` Round 1 cites tsk-3au's own CONTEXT.md Scout
  evidence verbatim — "Git has no native hook for `reset`" — so this
  is not implementable as suggested. The existing `.githooks/pre-commit`
  infra guards concurrent *commits* (a different git lifecycle event
  entirely), confirmed not extensible to this gap. AGENTS.md prose remains
  the only defense against a raw Bash `git reset --hard` bypassing the CLI
  entirely — unchanged by this item, same as tsk-3au's own D1 left the
  causally-upstream path-drift problem to a separate item (`tsk-8v1`).
- *A brand-new confirmation flag* (e.g. `--i-understand-commits-are-lost`)
  distinct from `--confirm` — rejected for YAGNI/backward-compat: reusing
  the existing `--confirm` flag for both the dirty-tree and the
  ancestor-violation refusal keeps one flag, one mental model, and every
  existing caller that already passes `--confirm` gains the new protection
  for free instead of needing to learn a second flag. The refusal
  *message* (not the flag) is what changes to list the commits at risk —
  matching the item description's own ask almost verbatim.
- *Inventing new git plumbing for the ancestor check* — rejected: this
  repo already has a used, working pattern for exactly this
  (`git merge-base --is-ancestor`), see Scout below. No new mechanism
  needed.

**Risk map**:

| Component | How risky | What would prove it |
|---|---|---|
| `assertSafeMainCheckoutReset` (pure decision fn, `src/runner/main-checkout-reset-guard.mjs`) | Low — pure function, no I/O, already has a locked 2-assertion test precedent to extend | Add RED assertions to `test/runner/main-checkout-reset-guard.test.mjs` for the new ancestor-violation branch before writing the fix (same pattern tsk-3au itself used — CONTEXT.md Gate note) |
| CLI verb wiring (`bin/fgos.mjs`'s `main-checkout-reset` case, ~4391-4415) — computing ancestor/commit-count via git subprocess calls | Medium — must not regress the existing dirty-tree path, must handle the no-common-ancestor/orphan edge case without throwing an unrelated error | Extend the same test file with an integration-style check (a throwaway scratch repo, never the shared main checkout) covering: (a) clean tree, `sha` is HEAD or an ancestor with 0 commits behind → unchanged, silent success; (b) clean tree, `sha` strictly behind HEAD by N real commits → refuses without `--confirm`, message lists the N commits; (c) same case with `--confirm` → proceeds |
| Confirmation UX shape (reuse `--confirm`, new message content) | Medium — user-facing CLI contract change (`docs/how-to/safely-reset-the-main-checkout.md`) | Doc update in the same commit; existing `--confirm` semantics for the dirty case stay byte-for-byte unchanged (only a new refusal branch is added) — no existing caller's currently-succeeding invocation starts failing unless it was genuinely about to discard committed work, which is the entire point |

**Files touched, in order**:
1. `test/runner/main-checkout-reset-guard.test.mjs` — add RED assertions
   for the new ancestor-violation refuse/confirm behavior first (Iron Law:
   real failing-before/passing-after, same convention tsk-10j/tsk-3au used).
2. `src/runner/main-checkout-reset-guard.mjs` — extend
   `assertSafeMainCheckoutReset` to accept the ancestor/commit-count
   evidence and refuse on it per the Approach above.
3. `bin/fgos.mjs` (`case 'main-checkout-reset':`, ~4391-4415) — compute
   `git merge-base --is-ancestor <sha> HEAD` + `git rev-list <sha>..HEAD`
   (for the commit list) and pass the result into the guard call.
4. `docs/how-to/safely-reset-the-main-checkout.md` — document the new
   refusal branch and its message shape, alongside the existing dirty-tree
   one.
5. `CHANGELOG.md` — `## [Unreleased]` entry (AGENTS.md's install/setup/
   doctor gate: this changes a documented CLI verb's user-visible
   behavior).

`fgos graph --json`'s `criticalPath` does not include `tsk-1ck` and
`topUnblock` is empty for it — confirms this item is an isolated
size-1 component (same shape `RESEARCH.md` already found for its own
precedent, tsk-3au), so file ordering above is scoped to this item alone,
not informed by any cross-item dependency.

**Impact-analysis posture**: `fgos tool query --capability impact-analysis
--status present` reports `gitnexus` present via MCP. However,
`mcp__gitnexus__list_repos` shows the indexed entry at this repo's own
path (`/home/vantt/projects/forgentX`) is **2141 commits behind HEAD** —
severely stale, per this repo's own CLAUDE.md gate ("present but flagged
stale — Degraded... mark that proof weak, and name the gap plainly").
Posture recorded as **degraded**: a graph-based blast-radius query against
that index would not be trustworthy for recently-changed code, so this
plan instead cross-checked with a direct `rg -n
"assertSafeMainCheckoutReset|main-checkout-reset-guard"` across the repo
(excluding `node_modules`/`.git`) — the only real caller (not a comment or
doc mention) is `bin/fgos.mjs`'s own `main-checkout-reset` case (import at
line 64, call at line 4405); `src/runner/worktree.mjs:852` is a
comment-only mention, not a caller. Confirms the blast radius genuinely is
this narrow (one pure function, one call site, one test file) without
leaning on the stale graph.

## Shape

**Concrete cases to prove** (scaled to `high-risk`, per Mode gate):
- Empty/boundary: `sha == HEAD` exactly (0 commits behind) — must behave
  identically to today (silent success when clean).
- Existing behavior that must not regress: dirty tree + no `--confirm`
  still refuses with today's exact message shape; dirty tree + `--confirm`
  still proceeds — the two assertions the current test file already locks.
- The new case: clean tree, `sha` strictly behind `HEAD` by real commits,
  no `--confirm` → refuses, message names the commits (author, subject,
  files) that would be discarded, mirroring this item's own incident
  writeup's own "author, message, files touched" ask.
- Same new case with `--confirm` → proceeds (matches the reused-flag
  choice in Approach).
- Edge case: `sha` and `HEAD` have no common ancestor (orphan/unrelated
  history) — `git merge-base --is-ancestor` exits non-zero for "not an
  ancestor" the same way it does for "behind" (per `bin/fgos.mjs:155`'s
  own comment on this exact exit-code shape) — the guard must treat this
  as the same refusal branch, not throw a separate/confusing error.

**Assumptions** (pinned, not asked — neither is material: neither changes
scope, only implementation shape, and both are grounded in direct evidence
above, not guesses):
- Reusing `--confirm` for both refusal branches (see Approach's "brand-new
  flag" alternative, rejected).
- The commit-list message format (author, subject, files touched) matches
  the item description's own literal wording; exact string formatting is
  an execution-time detail, not a plan-level decision.

## Outstanding questions

None
