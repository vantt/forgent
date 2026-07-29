# fgos skill discovery gap — CONTEXT

## Feature boundary

`tsk-d3c`. Any session that claims an fgOS item and calls `Skill()` to
route through `fgos-routing`, `fgos-exploring`, `fgos-planning`,
`fgos-validating`, `fgos-executing`, `fgos-compounding`,
`fgos-indexing`, `fgos-submit-assist`, or `fgos-unlock` — the 9 dotdir
skills at `.claude/skills/fgos/<name>/SKILL.md` (`fgos-unlock` is
missing from this item's own original acceptance text, which counted
only 8 — corrected here against the real directory listing) — gets
`Unknown skill`, for both
the scoped form (`fgOS:fgos-routing`) and the unscoped form
(`fgos-routing`). This item locks what's actually true about the gap
before any fix is chosen, and hands the fix itself to `fgos-planning`.

Reproduced twice, independently, from a fresh `/fgOS:pick` +
`EnterWorktree` session each time: `tsk-62x` (per this item's own
acceptance record) and `tsk-d3c` (this session, both `Skill(fgos-routing)`
and `Skill(fgOS:fgos-routing)` calls failed identically, then
`Skill(fgos-exploring)` failed the same way after `stage` resolved to
`clarify`).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Do not duplicate the 9 `fgos/*` skills into `plugins/fgOS/skills/*` as a first move, and do not blindly rename the `fgos/` subdirectory as an unverified workaround. Hand the item to `fgos-planning` to root-cause *why* the discovery gap exists before picking a fix — the original hypothesis this item shipped with ("dotdir skills need plugin registration") is contradicted by scout evidence below, so the fix shape is still open. |

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
  **not** decided here — `fgos-planning` investigates and proposes the
  fix shape. This item's contribution is ruling out the original
  "needs-plugin-registration" hypothesis and ruling in "root-cause
  first" as the approach, per D1.
- Whether the eventual fix lives entirely in this repo (e.g. a rename,
  a manifest tweak) or is actually a Claude Code harness behavior this
  repo cannot control on its own is left open — `fgos-planning` should
  surface that distinction explicitly if it turns out to be the latter.

## Canonical references

- `.claude/skills/fgos/fgos-routing/SKILL.md`
- `.claude/skills/fgos/fgos-exploring/SKILL.md`
- `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` (counterexample)
- `plugins/fgOS/.claude-plugin/plugin.json`
- `.claude/settings.json` (`enabledPlugins`)
