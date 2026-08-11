# fgos skill discovery gap — CONTEXT

## Feature boundary

`tsk-d3c`. Any session that claims an fgOS item and calls `Skill()` to
route through `fgos-routing`, `fgos-coding-exploring`, `fgos-coding-planning`,
`fgos-coding-validating`, `fgos-coding-implement`, `fgos-coding-compounding`,
`fgos-indexing`, `fgos-submit-assist`, or `fgos-unlock` — the 9 dotdir
skills at `.claude/skills/fgos/<name>/SKILL.md` (`fgos-unlock` is
missing from this item's own original acceptance text, which counted
only 8 — corrected here against the real directory listing) — gets
`Unknown skill`, for both
the scoped form (`fgOS:fgos-routing`) and the unscoped form
(`fgos-routing`). This item locks what's actually true about the gap
before any fix is chosen, and hands the fix itself to `fgos-coding-planning`.

Reproduced twice, independently, from a fresh `/fgOS:pick` +
`EnterWorktree` session each time: `tsk-62x` (per this item's own
acceptance record) and `tsk-d3c` (this session, both `Skill(fgos-routing)`
and `Skill(fgOS:fgos-routing)` calls failed identically, then
`Skill(fgos-coding-exploring)` failed the same way after `stage` resolved to
`clarify`).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Do not duplicate the 9 `fgos/*` skills into `plugins/fgOS/skills/*` as a first move, and do not blindly rename the `fgos/` subdirectory as an unverified workaround. Hand the item to `fgos-coding-planning` to root-cause *why* the discovery gap exists before picking a fix — the original hypothesis this item shipped with ("dotdir skills need plugin registration") is contradicted by scout evidence below, so the fix shape is still open. |

## Pinned terms

- **Dotdir skill** — a project skill living at
  `.claude/skills/<subdir>/<name>/SKILL.md`, discovered (or not) by the
  harness's own project-skill scan, as opposed to a plugin skill under
  `plugins/<plugin>/skills/<name>/SKILL.md`, which this repo's `fgOS` and
  `dogfood-fixture` plugins register explicitly via
  `.claude/settings.json`'s `enabledPlugins`.
- **Scoped vs. unscoped invocation** — `Skill({skill: "fgOS:fgos-routing"})`
  (plugin-namespaced) vs. `Skill({skill: "fgos-routing"})` (bare name).
  Both forms failed identically in this session — the gap is not a
  namespace-prefix mistake at the call site.

## Scout evidence

- `find .claude/skills -maxdepth 3 -iname SKILL.md` shows two dotdir
  subtrees with the *same* nesting shape — `.claude/skills/fgos/*` (8
  skills, all missing from this session's available-skills list) and
  `.claude/skills/gitnexus/*` (6 skills present in this repo tree:
  `gitnexus-cli`, `gitnexus-debugging`, `gitnexus-exploring`,
  `gitnexus-guide`, `gitnexus-impact-analysis`, `gitnexus-refactoring` —
  every one of which *is* listed, unscoped, in this session's
  available-skills list).
- `.claude/skills/distill/SKILL.md` — a flat (non-nested) project
  skill — is also listed, unscoped, confirming flat dotdir skills work
  too; the anomaly is specific to the `fgos` subtree, not "nesting" or
  "dotdir skills" in general.
- `find /home/vantt/.claude/skills -maxdepth 2 -iname "*gitnexus*" -o -iname "*fgos*" -o -iname "*distill*"` — empty. None of the three
  come from a global skill install; `gitnexus-exploring` etc. showing up
  is genuinely this project's own `.claude/skills/gitnexus/` tree being
  discovered, not a global copy masking the project one.
- `plugins/fgOS/skills/<name>/SKILL.md` (17 files: `pick`, `ask`,
  `answer`, `list`, `ready`, `move`, `return`, `submit`, `discover`,
  `goal`, `graph`, `conflicts`, `rollup`, `stale`, `triage`, `check`,
  `cook`) is a *separate*, working set — these are the CLI-wrapper
  skills that show up as `fgOS:pick` etc. They are not duplicates of the
  9 `fgos/*` skills; they wrap individual CLI verbs, while the 9 `fgos/*`
  skills are the *workflow-routing* layer (`fgos-routing` and friends)
  that decides which of the CLI-wrapper (or dev-workflow) skills to load
  next. Losing the routing layer does not remove the CLI wrappers, but
  it does remove the only thing that reads an item's `stage` and decides
  where to send a session — which is why this item exists at all.

## Deferred / out of scope

- Whatever narrow mechanism actually explains the `fgos` vs. `gitnexus`
  discovery difference (name collision, stale skill-index cache tied to
  session lifecycle, a harness-side scan limit or bug) is explicitly
  **not** decided here — `fgos-coding-planning` investigates and proposes the
  fix shape. This item's contribution is ruling out the original
  "needs-plugin-registration" hypothesis and ruling in "root-cause
  first" as the approach, per D1.
- Whether the eventual fix lives entirely in this repo (e.g. a rename,
  a manifest tweak) or is actually a Claude Code harness behavior this
  repo cannot control on its own is left open — `fgos-coding-planning` should
  surface that distinction explicitly if it turns out to be the latter.

## D2 — collision hypothesis disproven (post-executing)

The `fgos-coding-planning`-shaped rename (`.claude/skills/fgos/` →
`.claude/skills/fgos-workflow/`, plus the `.agents/` mirror,
`dispatch.mjs`, 3 tests, and doc references — committed `3e683aa` on
`fgw/tsk-d3c`) shipped, `npm test` green, item returned to `proposed`.
A fresh session opened directly in that worktree (real new session,
not a continuation) then called `Skill({skill: "fgos-routing"})` —
the skill's own name, unchanged by the rename — and it still failed
with the identical `Unknown skill: fgos-routing`, and the skill still
did not appear in that session's own available-skills list.

**This disproves the case-fold collision hypothesis.** The rename was
reverted (`dfe189e`, clean revert, `npm test` still green on the 3
targeted files afterward). D1's "root-cause before fixing" stance is
vindicated by this outcome, not contradicted by it — the
strongest-available lead turned out wrong, and the item is better off
having spent one cheap, reversible rename to learn that than having
silently shipped a fix that never addressed the real cause.

**What remains ruled out or open now:**
- Ruled out: "needs plugin registration" (original hypothesis, D1).
- Ruled out: case-fold name collision with `plugins/fgOS/` (D2, this
  section).
- **Invalidated, not just ruled out**: the original `gitnexus`
  counterexample. `.claude/skills/gitnexus/` was never a stable,
  git-tracked comparator — `.gitignore` never allowlisted it (only
  `fgos`/`distill` were), and the directory vanished from disk entirely
  partway through this investigation, confirming it is materialized by
  GitNexus's own MCP-server integration, not by the generic project-skill
  scan this item is actually about. Every earlier claim resting on "gitnexus
  is nested and discoverable, therefore nesting works" no longer holds —
  see D3.

## D3 — real root cause confirmed: the scan is flat-only, no recursion

Controlled A/B test, same fresh session, same worktree: two disposable
probe skills, `.claude/skills/zzz-flat-test/SKILL.md` (flat, one level,
matching `distill`'s real shape) and
`.claude/skills/zzz-nest-test/inner/SKILL.md` (nested, two levels,
matching `fgos`'s shape). `Skill({skill: "zzz-flat-test"})` loaded
successfully; `Skill({skill: "zzz-nest-test"})` reported "not in skill
list" — confirmed with the file's real presence verified by `pwd` +
`cat` in that same session first, ruling out a wrong-directory or
stale-cache explanation.

**Root cause: the generic `.claude/skills/` project-skill scan enumerates
exactly one level deep (`.claude/skills/<name>/SKILL.md`) — it does not
recurse into subdirectories.** `distill` works because it is flat.
`fgos`'s 9 skills sit two levels deep (`.claude/skills/fgos/<name>/SKILL.md`)
and are invisible for exactly that reason — independent of the parent
folder's name, which is why D2's rename never helped: renaming
`fgos/` to `fgos-workflow/` kept the nesting, so the real blocker was
untouched.

**The fix implied by D3**, superseding D2's rejected/rewound rename:
flatten each of the 9 skills to live directly under
`.claude/skills/<skill-name>/SKILL.md` (e.g.
`.claude/skills/fgos-routing/SKILL.md`), with no shared parent folder —
matching `distill`'s proven-working shape exactly. The `.agents/`
mirror, `dispatch.mjs`'s hardcoded path, the 3 test files, the doc/spec
references, and the `.gitignore` allowlist all need the equivalent
flattening (same blast radius already mapped in `plan.md`'s standard-mode
pass, just flattening instead of renaming the parent).

The probe files (`zzz-flat-test`, `zzz-nest-test`) were deleted after
the test — disposable, never meant to persist.

## D4 — fix confirmed working (final proof)

The D3 flatten shipped (commit `1e14290` on `fgw/tsk-d3c`), `npm test`
green (1641 pass), item returned to `proposed`. A fresh session opened
directly in the same worktree then called
`Skill({skill: "fgos-routing"})` — the exact call that failed with
`Unknown skill` at the start of this item — and it loaded successfully,
immediately orienting via `fgos list`/`fgos ready` per its own flow.

**tsk-d3c's core bug is fixed and confirmed, end to end**: claim →
root-cause (twice, once wrong then corrected) → shape → validate →
implement → verify → real-session confirmation.

## Canonical references

- `.claude/skills/fgos/fgos-routing/SKILL.md`
- `.claude/skills/fgos/fgos-coding-exploring/SKILL.md`
- `.claude/skills/distill/SKILL.md` (real working comparator — flat)
- `plugins/fgOS/.claude-plugin/plugin.json`
- `.claude/settings.json` (`enabledPlugins`)
