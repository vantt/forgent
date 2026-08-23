---
title: agent-executor generalized capacity-dispatch helper (tsk-53h) — plan
timestamp: 2026-08-03T11:30:00.000Z
---

# Plan

## Mode

Flags counted (per fgos-coding-planning's mode gate):
- **weak proof around the area** — yes. The precedent doc itself
  (`docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`,
  "Why this exists") names a real, structural gap: no skill's runtime
  behavior is unit-tested anywhere in this repo, only mirror-identity
  (`test/skills/fgos-mirror.test.mjs`). This item's own deliverable lives
  in that same untested surface.
- No other flag applies: no auth/authorization/data model/audit/
  external-system/public-contract/cross-platform/multi-domain change, and
  `tsk-3sw` (D1's blocker) landed (`status: retrospective`) so there is no
  longer a race against a moving `resolveCapacityCli` contract.

**Mode: small** — a few files, no gray areas, one honest piece of work.
Bigger modes exist for hard-gate risk (auth/data-loss/audit/external
provider/removing a validation) or 4+ flags; neither applies. The one real
flag (weak proof) is answered the same way the precedent item already
answered it — a real one-time manual verification step, not a bigger plan
shape.

`impact-analysis` posture (`fgos tool query --capability impact-analysis
--status present`): **full** — GitNexus registered and present on this
machine. `fgos-coding-implement` should run `impact` on any exported symbol this
item touches (none currently planned — see below) before editing it.

## Decision split (per CONTEXT.md's own deferred question)

**No split.** D1's original reason to consider two children (a
design/pattern-record piece buildable now vs. a helper-authoring piece
formally depending on `tsk-3sw`) no longer applies: `tsk-3sw` already
landed (`resolveCapacityCli`'s return shape — `{command, args, provider,
model}` — is final, confirmed by reading `src/runner/dispatch.mjs`'s
current `resolveCapacityCli`). One session can now write the shared
fragment and rewire `fgos-submit-assist` in the same pass, against the
real final contract, with no rework risk. Proceeds as itself.

## Approach

**What's actually missing today:** `docs/how-to/wire-a-skills-classify-
step-through-an-agent-executor-capacity.md` already documents steps
1–3 (config entry, `fgos tool register`, `dispatch.mjs resolve` CLI) in
skill-agnostic language — those need no rewrite. The part that is
*not* generalized is step 4 (the actual branch prose: not-configured /
configured-but-absent / configured-and-present / malformed-response
fallback) — today it lives only inline in
`.claude/skills/fgos-submit-assist/SKILL.md` (and its
`.agents/skills/` mirror). A second skill wanting this same dispatch-
with-fallback shape would have to copy that prose by hand, and the two
copies would drift the next time the branching logic changes (D2's own
DRY rationale). That is this item's actual, narrow deliverable: extract
step 4's branch logic into one shared file, have `fgos-submit-assist`
point at it instead of inlining it, verified byte-identical to itself
via the mirror machinery.

**Chosen path:**
1. Create `.claude/skills/_shared/capacity-dispatch-fallback.md` — the
   four-way branch prose (not-configured / configured-but-absent /
   configured-and-present / malformed-response), written generically
   (parameterized on "the capacity id", "the fixed prompt template",
   "the announce line format") rather than naming `submit-assist-
   classify` specifically. Mirror it byte-identically at
   `.agents/skills/_shared/capacity-dispatch-fallback.md` (D2: same
   mirrored-tree convention every `fgos-*` skill already follows).
2. Extend `test/skills/fgos-mirror.test.mjs` to also enumerate a
   `_shared` directory (not just `fgos-*`-prefixed ones) across both
   roots, so the new fragment's mirror is structurally enforced the same
   way every skill's is — otherwise this item would introduce the exact
   drift risk D2 exists to prevent, unchecked. This is the one concrete
   implementation choice `CONTEXT.md` left open for planning (exact
   path/filename): `_shared/` chosen over a `docs/how-to/` location
   because a *skill-facing* fragment other `SKILL.md` files point to by
   relative path belongs in the skill tree the mirror test already
   governs, not in `docs/` (which the mirror test does not scan at all).
3. Rewrite `.claude/skills/fgos-submit-assist/SKILL.md`'s step 4 (and
   its `.agents/skills/` mirror) to a short pointer at
   `_shared/capacity-dispatch-fallback.md`, filling in this skill's own
   three parameters (capacity id `submit-assist-classify`, its fixed
   classify prompt template, its announce line) — replacing the inline
   branch prose, not adding a second copy of it.
4. Update `docs/how-to/wire-a-skills-classify-step-through-an-agent-
   executor-capacity.md` step 4 to point at the new shared fragment
   instead of describing the branch logic itself, so the how-to and the
   real skill file stay pointed at one source of truth.

**Risk map:**

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| New `_shared/capacity-dispatch-fallback.md` mirror pair | low | `test/skills/fgos-mirror.test.mjs` (extended) passes — byte-identical, same file set |
| `fgos-submit-assist/SKILL.md` rewrite (both mirrors) | low-medium | Same mirror test, plus a real manual run of the "configured and present" path (mirrors the precedent item's own step 5 acceptance proof: resolve `submit-assist-classify`, invoke the resolved command with a real prompt, confirm a sane parseable response) — must still work identically after the rewrite, not just look unchanged. **Run this from the main checkout, not this item's own worktree** — see Assumptions below for why. |
| Existing behavior regression (fgos-submit-assist silently changes meaning) | low | Read the rewritten `SKILL.md` side-by-side with today's inline prose before committing — no test exercises a skill's runtime prose, so this read *is* the proof, same ceiling the precedent doc already names |

No auth/data/external-system/cross-platform component — the risk map is
short because the change is doc/skill-tree only; no `src/` runtime code
changes.

**Files touched:**
- `.claude/skills/_shared/capacity-dispatch-fallback.md` (new)
- `.agents/skills/_shared/capacity-dispatch-fallback.md` (new, mirror)
- `.claude/skills/fgos-submit-assist/SKILL.md` (edit)
- `.agents/skills/fgos-submit-assist/SKILL.md` (edit, mirror)
- `test/skills/fgos-mirror.test.mjs` (edit — scan `_shared` too)
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md` (edit)

**Order:** mirror test extension first (so the new `_shared` pair is
checked from the moment it's created, not added after), then the shared
fragment pair, then the `fgos-submit-assist` rewrite, then the how-to
doc update last (it only needs to point at what already exists by then).

## Assumptions

- `resolveCapacityCli`'s `{command, args, provider, model}` return shape
  is stable going forward — confirmed by reading the landed `tsk-3sw`
  code directly (`src/runner/dispatch.mjs`'s current `resolveCapacityCli`),
  not merely inferred from `CONTEXT.md`'s description of the pre-landing
  design. Not material enough to send back to `fgos-coding-exploring` — an
  implementation-detail confirmation, not a product decision.
- No second real consumer skill exists yet to generalize *against* beyond
  `fgos-submit-assist` — the shared fragment is written generic enough for
  a hypothetical second consumer (per D2's own stated goal) but this plan
  does not invent or wire a second skill, since none was named in scope.
- **The manual live-dispatch acceptance step (risk-map row 2, mirrored from
  the precedent how-to's own step 5) must be run with cwd = the main
  checkout, never from inside this item's own `fgw/tsk-53h` worktree.**
  Confirmed live: `node src/runner/dispatch.mjs resolve submit-assist-
  classify --prompt "test prompt"` succeeds from the main checkout
  (`{"command":"agy","args":[...],"provider":"agy","model":"Gemini 3.5
  Flash (Medium)"}`) but fails with `capacity "submit-assist-classify"
  declares kind "cli" but is not registered` when run from inside the
  worktree — misleading, since the capacity genuinely is registered
  (`fgos tool query` confirms `status: present`) in the main checkout's
  `.fgos/`. Root cause: `resolveCapacityCli`'s `resolveRepoRoot`
  (`src/runner/paths.mjs:25`, non-strict git mode) resolves via `git
  rev-parse --show-toplevel`, which returns the linked worktree's own
  path — not the main checkout, unlike every other `fgos` verb's
  `--git-common-dir`-based resolution — and `dispatch.mjs`'s `resolve` CLI
  subcommand exposes no `--repoRoot`/`--dir` flag to override it. This is
  a pre-existing gap in the reused dispatch mechanism (`tsk-62v`/`tsk-5l2-
  1`'s own scope), out of this item's declared feature boundary to fix
  (`CONTEXT.md`: "This item does not build a new dispatch mechanism --
  `tsk-62v` already built that") — pinned here only so `fgos-coding-implement`'s
  own manual verify pass doesn't misdiagnose this known gap as evidence
  the rewrite itself is broken.

## Proof surface (for `fgos-coding-implement`/`fgos-coding-validating`)

Real verify command for this item as a whole (not `npm test --
test/skills/fgos-mirror.test.mjs` — `package.json`'s `test` script
hardcodes `node --test 'test/**/*.test.mjs'`, so appending a path via `--`
does not scope it; `node --test` receives both paths and runs the entire
suite. Confirmed live: `node --test test/skills/fgos-mirror.test.mjs`
passes today, 3/3, 40ms — the baseline pre-change):

```
node --test test/skills/fgos-mirror.test.mjs
```

plus the one manual live-dispatch check named in the risk map above
(not automatable — same ceiling the precedent doc already accepted).
