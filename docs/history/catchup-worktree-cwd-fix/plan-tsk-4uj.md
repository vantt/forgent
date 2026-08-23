# sync-root/approve trust-dir opt-in flag — plan (tsk-4uj)

CONTEXT.md: `docs/history/catchup-worktree-cwd-fix/CONTEXT.md` (D3/D4
locked and approved, gate-bypass level `standard`). This plan covers ONLY
tsk-4uj's own scope; tsk-5vl's `catchup` fix is already delivered
separately (same feature dir, same CONTEXT.md, different D-ID).

**Revision note:** `fgos-coding-validating`'s first pass on this plan found two
things this revision addresses: (1) `promote-to-component` shares the
same guard pattern but is explicitly OUT of scope per CONTEXT.md D4
(filed as `tsk-2bg`) — see the Approach section's own out-of-scope note;
(2) `main-checkout-reset` already establishes a different, broader
trust-widening precedent this plan must cite and explain the divergence
from, also in Approach below.

## Mode gate

No lane was handed off before this skill loaded (this session reached
`tsk-4uj` via `/fgOS:pick` → `fgos-coding-driving`, never through
`fgos-routing`'s own Orient step), and no `plan.md` existed yet on this
branch to carry a prior `Mode:` line — per this skill's own direct-entry
fallback, the lane is derived directly here from `fgos-routing`'s
Mode-gate table.

Flags counted:

- **audit/security (hard-gate)** — this item adds an opt-in bypass to a
  trust-boundary/verification guard (`isMainWorktree`) on `approve` and
  `sync-root`, and `approve`'s guard has a documented TWO-incident history
  of real false-verification failures (`P44` original +
  `review-260718`'s later `--github`-path bypass) — see CONTEXT.md D3 and
  `RESEARCH.md` Round 2. **Hard-gate flag present.**
- **existing covered behavior** — `approve`/`sync-root` are both
  exercised by extensive existing suites (`test/cli/fgos.test.mjs`,
  ~30+ `approve` cases from line ~5572, the P44 guard tests at
  8055-8161, the session-nesting guard tests at 7915-7963). **1 flag.**
- **weak proof around the area** — confirmed during Round 2 research:
  every existing guard test invokes with no `--dir` flag, so none of them
  exercise the specific combination (cwd inside a worktree, `--dir`
  pointed elsewhere) the new opt-in flag changes. **1 flag.**
- **public contract** — adds a new CLI flag to two already-documented
  verbs (`fgos approve`, `fgos sync-root`), visible to anyone scripting
  against them. **1 flag.**

A hard-gate flag alone is enough → **high-risk**, regardless of the total
count (4, here). This differs from the item's own intake-time `tier:
standard` — that was a preliminary classification made before this
deeper analysis; the Mode-gate table's flag count is the authoritative
sizing signal for planning depth, not the intake tier.

## Approach

Locked scope (CONTEXT.md D3): add an opt-in CLI flag to `bin/fgos.mjs`'s
`sync-root` (`case 'sync-root'`, currently `bin/fgos.mjs:3265-3393`) and
`approve` (`case 'approve'`, currently `bin/fgos.mjs:2724-3265`) handlers.
When the flag is passed, `repoRoot` derives from `path.dirname(dir)`
(the `--dir`-resolved main checkout) instead of `process.cwd()` — the
same substitution `tsk-k8u`/`tsk-5vl` already proved for `take`/`pick`/
`catchup`, but gated behind an explicit flag here rather than made the
unconditional default, per D3. When the flag is OMITTED (the default),
behavior is byte-identical to today — `repoRoot = process.cwd()`,
`isMainWorktree`/session-worktree guards fire exactly as they do now.

Per CONTEXT.md's pinned assumption: no skill call-site wiring is in
scope — the flag's user is a person invoking `fgos approve --trust-dir
<id>` / `fgos sync-root --trust-dir <id>` by hand while sitting inside a
worktree session, not an automated caller (neither `fgos-coding-driving`
nor `fgos-coding-implement` ever calls `approve` themselves — that stays a
human gate per AGENTS.md's own boundary).

**Explicitly out of scope (CONTEXT.md D4):** `promote-to-component`
(`bin/fgos.mjs` ~3411-3423) shares the exact same `repoRoot =
process.cwd()` + `isMainWorktree` single-layer guard as `sync-root`, but
is NOT touched by this item — it has a second, independent guard layer
(`retargetMember`, `src/runner/promote-engine.mjs:53-58`, which takes
`repoRoot` as a parameter and re-checks `isMainWorktree` itself) reached
via a structurally different batch/multi-member promotion path. Filed as
its own follow-up item, `tsk-2bg`, for dedicated review of both guard
layers together.

**Existing precedent, and why this plan diverges from it:**
`main-checkout-reset` (`bin/fgos.mjs:4172-4180`) already implements a
DIFFERENT trust-widening shape for the identical underlying question —
its guard only fires `if (flags.dir === undefined &&
!isMainWorktree(repoRoot))`, meaning passing `--dir` explicitly is
*already* full trust there, no separate flag required. This plan
deliberately does NOT follow that precedent for `approve`/`sync-root`:
every automated caller in this codebase (`fgos-coding-driving`,
`fgos-coding-implement`) already always passes `--dir` on every call, so
adopting `main-checkout-reset`'s convention verbatim would silently
relax `approve`/`sync-root`'s trust boundary for all of them at once —
exactly the broad, unreviewed change D3's explicit opt-in flag exists to
avoid. `main-checkout-reset` itself carries no comparable incident
history to `approve`'s `P44`/`review-260718`, which is presumably why its
narrower, `--dir`-implicit trust model was acceptable there.

`fgos graph tsk-4uj --json`: isolated item, no deps, no children —
`criticalPath`/`topUnblock` carry no ordering signal; one honest piece of
work, no split (step 4 of this skill's flow doesn't apply).

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` → `gitnexus` present, re-confirmed
fresh this session). GitNexus `impact()` MUST run before editing the
`approve`/`sync-root` handlers and `isMainWorktree`
(`src/runner/merge.mjs`) — CLAUDE.md's Always-Do rules — this is the
blast-radius proof point for the risk-map rows below, carried to
`fgos-coding-validating`.

### Changes

1. **`bin/fgos.mjs` — `sync-root` handler.** Add a new flag (exact name
   left to whoever implements — `--trust-dir` is CONTEXT.md's own working
   name; pick the final wording during implementation, matching this
   repo's existing flag-naming convention, e.g. `--acknowledge-iron-law`'s
   own explicit-opt-in style). When passed, `repoRoot = path.dirname(dir)`
   instead of `process.cwd()` (currently line ~3273), before the existing
   `isMainWorktree(repoRoot)` guard (currently line ~3274) — the guard
   itself is UNCHANGED code, it now just evaluates a different `repoRoot`
   value depending on the flag.

2. **`bin/fgos.mjs` — `approve` handler.** Same substitution (currently
   line ~2739, ahead of the registry-based session-worktree guard at
   ~2764-2772 and the structural `isMainWorktree` guard at ~2785-2790) —
   both existing guards stay unchanged code, gated on the same new flag's
   `repoRoot` value. Must also thread through the `--github` branch's own
   guard positioning (the `review-260718` fix already relocated these
   guards ahead of that branch) — the new flag must not reopen that
   already-closed gap; the guards still run, just against a possibly
   different `repoRoot`.

3. **`docs/how-to/`** — a new how-to page (or an addition to
   `avoid-a-hung-verify-on-return-approve-catchup.md`'s neighborhood,
   whoever implements decides which reads better) explaining when a human
   should reach for the new flag: recovering `approve`/`sync-root` while
   still inside the item's own worktree session, mirroring the
   `fgos-coding-implement/SKILL.md` Return-step callout tsk-5vl already
   added for `catchup`. Must explicitly warn about the trust trade-off
   (citing `P44`/`review-260718`) — this is a deliberate escape hatch from
   an incident-driven guard, not a routine convenience flag.

### Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `approve`'s guard interaction with the new flag | **High** — `approve` is the final merge-to-main gate with a two-incident history (`P44`, `review-260718`) of real false-verification failures when its worktree-identity check was bypassed or mispositioned | `impact({target: "isMainWorktree", direction: "upstream"})` already run during `fgos-coding-validating`'s own pass on THIS plan: GitNexus's index was confirmed stale (`last indexed 4ce7a96`, behind current HEAD) and returned only 1 of 7 real callers — degraded posture, named plainly, not silently dropped. Manual `grep -n "isMainWorktree(" bin/fgos.mjs src/runner/promote-engine.mjs` cross-check substituted and is what surfaced D4's `promote-to-component` finding — re-run both (GitNexus + grep cross-check) again at implementation time in case the index has since been refreshed. Full existing `approve` suite green with UNCHANGED pass/fail set when the new flag is NOT passed (regression baseline); every existing P44/session-nesting/`--github` guard test still refuses exactly as today when the flag is omitted |
| `sync-root`'s guard interaction with the new flag | Medium — same guard shape as `approve`, one layer instead of two, lower stakes (internal decision-record op, never the final done/delivered edge) | Full existing `sync-root` suite green, unchanged pass/fail set, when the flag is omitted |
| New CLI-level regression coverage for the flag itself (currently absent, by definition — the flag doesn't exist yet) | The whole point of this item — nothing today can prove the opt-in path actually works OR that the default path is truly unchanged | New tests in `test/cli/fgos.test.mjs`: (a) `approve`/`sync-root` with the new flag, cwd inside the item's own linked worktree, `--dir` at the main checkout — succeeds, no worktree-refusal error; (b) the SAME setup WITHOUT the flag — still refuses exactly as today (this is the regression guard that proves the default is untouched); (c) every existing P44/session-nesting/`--github` test re-run unmodified to confirm zero behavior change without the flag |
| Doc addition | Low — prose-only | `docs/how-to/write-verify-for-a-skill-prose-change.md`'s shape does not apply here (this is a `docs/how-to/*` page, not a `SKILL.md` change) — a plain markdown read-through is enough proof |

### Concrete cases to prove

- `approve`/`sync-root` with NO flag, from the main checkout — byte-identical
  to today (regression baseline).
- `approve`/`sync-root` with NO flag, from inside a linked/session/ad-hoc
  worktree — still refuses exactly as today, citing the exact same error
  messages (P44, session-nesting, `--github` tests all re-run unmodified).
- `approve`/`sync-root` WITH the new flag, cwd inside the item's own
  worktree, `--dir` at the main checkout (the tsk-5vl-shaped scenario,
  applied here) — succeeds, git ops land correctly at the real main
  checkout.
- `approve`/`sync-root` WITH the flag but WITHOUT `--dir` — `path.dirname
  (dir)` reduces to the same value `process.cwd()` already gives (per
  `tsk-k8u`'s own established byte-identical-when-no-`--dir` contract), so
  the guard still correctly refuses; confirms the flag alone (without a
  trustworthy `--dir`) grants no bypass.
- `approve --github` WITH the flag — the `review-260718` guard
  repositioning must still hold; the flag changes `repoRoot`'s VALUE, never
  the ORDER guards run in relative to the `--github` branch.
- `promote-to-component` — completely untouched by this item's diff;
  its own existing tests (if any) pass unmodified, confirming the
  out-of-scope boundary (CONTEXT.md D4) was actually honored, not just
  declared.

## Assumptions

- Exact flag name (`--trust-dir` vs. an alternative) is an
  implementation/writing detail — left to whoever implements, matching
  existing flag-naming conventions in this file.
- Whether the new how-to doc is a standalone page or an addition to an
  existing one is likewise left to whoever implements — a documentation
  organization choice, not a product decision (CONTEXT.md's own pinned
  assumption already defers this).
- GitNexus's index was confirmed stale during tsk-5vl's own work in this
  same feature area (`last indexed: 4ce7a96`) — `fgos-coding-validating`/
  `fgos-coding-implement` should re-check freshness rather than assume it
  has since been fixed; if still stale, the impact-analysis proof points
  above degrade per CLAUDE.md's own gate (manual grep cross-check
  substitutes, named plainly as weaker evidence).

## Proof surface

`npm test` (`node --test 'test/**/*.test.mjs'`, per `package.json`'s
`test` script) is the full-suite bar named in AGENTS.md's own DoD and
this plan's own recorded proof point through the planning/validating
gates.

Item's own `verify` (narrower, existence-confirmed set covering exactly
the risk-map rows above — what `fgos return`'s goal-check actually runs;
the full `npm test` stays the broader CI-level bar):

```
node --test test/cli/fgos.test.mjs
```

(the one file already exercising `approve`/`sync-root`'s full CLI-layer
behavior, including the P44/session-nesting/`--github` guard suites this
item must leave passing unmodified, and where the new flag's own
regression cases land.)

## Split

None — one honest piece of work, no children created.

## Outstanding questions

None
