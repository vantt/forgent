# Plan — install/setup reliability for external projects (tsk-2qc)

Mode: high-risk

**Flag count (fgos-routing Mode-gate, applied directly — no Orient
handoff existed for this item, direct-entry fallback):** 5 of 10 flags
apply — public contracts (`fgos setup`/`doctor` behavior is documented in
`docs/specs/distribution.md` and the README Install section; npm `files`
allowlist is a public contract of what ships), cross-platform (bash/zsh/
PowerShell shell-integration surface), existing covered behavior (changes
already-tested `checkPluginSkillCliReachable`/`checkClaudePluginMarketplace`/
`checkShellIntegrationSourced`/`test/skills/fgos-mirror.test.mjs`), weak
proof around the area (impact-analysis posture degraded — GitNexus index
repeatedly flagged stale this session, `last indexed: c0cedaa`), external
systems (npm/pnpm/yarn package managers, Claude Code plugin marketplace).
4+ flags → **high-risk** per the mechanical gate, not a judgment call.

**Impact-analysis posture:** degraded (GitNexus `present` but stale index,
confirmed via `fgos tool query --capability impact-analysis --status
present` + repeated stale-index hook warnings during shaping/exploring).
Every proof point below that would lean on blast-radius evidence is
marked accordingly — `fgos-coding-validating` should re-run `gitnexus
analyze` before trusting any blast-radius claim for `src/setup/*.mjs`.

## Approach

Three independently-scoped pieces, matching `DISCUSSION.md` §7's already-
identified task boundaries — no new shape invented here, this step
confirms the split is real and adds the risk map / verify.

**Rejected alternative:** one single flat item covering all of D2-D7.
Rejected because the three pieces touch disjoint file sets (bin-discovery
vs skill-source-of-truth vs hide-dev-skills) and carry meaningfully
different risk levels — bundling them would force one uniform verify
command across unrelated surfaces and make a partial revert (e.g. keep
D5/D7's architecture, roll back D6's frontmatter rollout alone) needlessly
hard.

**Order:** skill-source-of-truth first (or in parallel with bin-
discovery — no file overlap) since hide-dev-skills has a soft dependency
on its generator existing; bin-discovery has no dependency on either.

| Component | Risk | What would prove it |
|---|---|---|
| Bin-discovery 3-tier + config-cache (D2/D3/D4) | standard | Real doctor/setup run against a simulated PATH-less global-only environment resolves via cache; shell-integration test fixture covers all 3 tiers, not just 1+3 |
| Skill source-of-truth migration (D5/D7) | heavy | Real `fgos setup` run in a scratch git repo (no `claude` CLI on PATH) produces working `.agents/skills/*` + `.claude/skills/*`; `npm test` green with mirror test's new wrapper-correctness assertion. Blast-radius confirmed LOW risk on `checkShellIntegrationSourced`/`integrationScriptPath`/`checkClaudePluginMarketplace` (fresh `gitnexus analyze` re-run + `impact` calls, 2026-08-13) — 1 direct caller each, `Setup` module only |
| Hide dev-skills rollout (D6) | light | Empirical platform check (not code-provable): `user-invocable: false` on 1 skill first, confirm both menu-removal and Skill-tool-dispatch-still-works, before rollout to all 14 |

**Files likely touched (informs footprint below):**
`src/setup/registrations.mjs`, `src/setup/shell-rc.mjs`,
`scripts/fgos-shell-integration.sh`, `src/config/global-config.mjs`,
`test/setup/*.test.mjs`, `test/scripts/fgos-shell-integration.test.mjs`
(bin-discovery); `package.json`, `src/setup/skill-wrappers.mjs` (new),
`.agents/skills/*`, `.claude/skills/*`, `test/skills/fgos-mirror.test.mjs`
(skill-source-of-truth); `.claude/skills/fgos-*/SKILL.md` frontmatter,
`src/setup/skill-wrappers.mjs` (hide-dev-skills, shares the generator
file with skill-source-of-truth — expected overlap, not a conflict, since
hide-dev-skills only adds a frontmatter field the generator already
emits).

## Shape — split into 3 children

One piece is not honestly enough here — three disjoint-enough concerns
with different risk levels, per the Approach above. Specs below, created
only by `fgos-coding-validating`'s single gate, not here.

```json
[
  {
    "title": "Rework fgOS bin-discovery to 3-tier resolution with global-tier config-cache",
    "verify": "npm test -- 'test/setup/**/*.test.mjs' test/scripts/fgos-shell-integration.test.mjs",
    "action": "D2/D3/D4: implement 3-tier deterministic bin resolution (dev-checkout and project-local file-checks unchanged; global tier reads a config-cached path, multi-tier probe populates it once via fgos setup/doctor --fix); extend scripts/fgos-shell-integration.sh to cover all 3 tiers; stop integrationScriptPath()/checkShellIntegrationSourced from requiring a git checkout for npm-installed copies",
    "footprint": ["src/setup/registrations.mjs", "src/setup/shell-rc.mjs", "scripts/fgos-shell-integration.sh", "src/config/global-config.mjs", "test/setup/", "test/scripts/fgos-shell-integration.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Make .agents/skills canonical source with generated .claude/skills thin wrappers",
    "verify": "npm run build:skills && npm test -- 'test/skills/**/*.test.mjs'",
    "action": "D5/D7: add .agents/ to package.json files allowlist; write one shared generator function producing .claude/skills/<name>/SKILL.md thin-wrapper stubs from .agents/skills/<name>/SKILL.md; wire it into a new npm run build:skills script (forgentX self-dogfood) and into fgos setup's external-project materialize path (copies both .agents/skills and generated .claude/skills into the target project, sibling-relative paths, never pointing at the global install); replace test/skills/fgos-mirror.test.mjs's byte-identical assertion with a wrapper-correctness assertion",
    "footprint": ["package.json", "src/setup/skill-wrappers.mjs", ".agents/skills/", ".claude/skills/", "test/skills/fgos-mirror.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Verify and roll out user-invocable:false for the 14 coding-domain dev-skills",
    "verify": "npm test -- 'test/skills/**/*.test.mjs'",
    "action": "D6: empirically verify user-invocable:false on fgos-unlock first (menu removal + explicit Skill-tool dispatch still works), then add that frontmatter to the SOURCE .agents/skills/fgos-*/SKILL.md files for all 14 dev-skills (re-sliced per engine footprint-overlap check against the skill-source-of-truth task: the generator copies frontmatter as-authored, never special-cases which skills are dev-skills, so this task never touches src/setup/skill-wrappers.mjs)",
    "footprint": [".agents/skills/fgos-clarifying/SKILL.md", ".agents/skills/fgos-coding-compounding/SKILL.md", ".agents/skills/fgos-coding-discovering/SKILL.md", ".agents/skills/fgos-coding-driving/SKILL.md", ".agents/skills/fgos-coding-exploring/SKILL.md", ".agents/skills/fgos-coding-implement/SKILL.md", ".agents/skills/fgos-coding-planning/SKILL.md", ".agents/skills/fgos-coding-shaping/SKILL.md", ".agents/skills/fgos-coding-validating/SKILL.md", ".agents/skills/fgos-fanout/SKILL.md", ".agents/skills/fgos-indexing/SKILL.md", ".agents/skills/fgos-researching/SKILL.md", ".agents/skills/fgos-routing/SKILL.md", ".agents/skills/fgos-unlock/SKILL.md"],
    "kind": "task",
    "risk": "light",
    "deps": [1]
  }
]
```

**Verify fix (post-plan, tsk-2qc-1 own implementation):** piece 1's
original `verify` (`npm test -- test/setup/ test/scripts/fgos-shell-
integration.test.mjs`) passes a bare directory (`test/setup/`) as a
positional arg to `node --test` alongside the npm script's own already-
active glob (`node --test 'test/**/*.test.mjs'`) — confirmed reproducible:
this combination makes Node's test runner report a phantom failing
`test/setup` pseudo-test with zero real per-test failures underneath
(3183/3183 real tests pass either way). Passing the equivalent glob
(`'test/setup/**/*.test.mjs'`) instead of the bare directory avoids the
bug entirely — same coverage, same 3183 real tests, verified both ways.
Fixed on the item's own `verify` field (`fgos edit --verify`) and here.

**Verify fix, piece 2 (post-plan, tsk-1qi own implementation):** same
`node --test` bare-directory-vs-glob quirk already fixed for piece 1
(tsk-2qc-1) — `test/skills/` as a bare positional arg alongside the npm
script's own already-active glob produces the identical phantom failing
pseudo-test, zero real per-test failures underneath either way. Fixed the
same way: the equivalent glob (`'test/skills/**/*.test.mjs'`).

**Empirical verification, piece 3 (post-plan, tsk-424n own implementation):**
D6/DISCUSSION.md §9 flagged one open item before rollout: "chưa xác nhận
100% qua docs liệu `user-invocable: false` gỡ khỏi listing model thấy hay
chỉ gỡ khỏi menu `/` người gõ", with a manual restart-and-observe test
sketched as the fallback. Resolved instead via authoritative, verified
Claude Code documentation (code.claude.com/docs/en/skills.md, fetched and
grep-checked against the raw page, not paraphrased from memory): "The
`user-invocable` field only controls menu visibility, not Skill tool
access" (matches the page's own comparison table: `user-invocable: false`
→ description stays in context, Claude can still invoke it). This closes
the open question more conclusively than a single-skill manual check
would have, so all 14 dev-skills were updated directly rather than
staging `fgos-unlock` alone first. Also updated the 14
`plugins/fgOS/skills/fgos-*/SKILL.md` mirrors (same field) to keep
test/skills/fgos-mirror.test.mjs's pre-existing (tsk-32b) byte-identical
invariant intact — not itself in piece 3's declared footprint, but
required to avoid a real regression in an unrelated, already-locked test.

**Verify fix, piece 3 (post-plan, tsk-424n own implementation):** same
`node --test` bare-directory-vs-glob quirk already fixed for pieces 1
and 2 — fixed the same way (`'test/skills/**/*.test.mjs'`).

**Re-slice note (post-plan, resolving engine footprint-overlap ask):** the
original spec had this task editing `src/setup/skill-wrappers.mjs`
directly to special-case the 14 dev-skill names. Re-sliced instead: the
generator (skill-source-of-truth task) copies frontmatter mechanically
from `.agents/skills/*` source, with no hardcoded skill-name list; this
task authors `user-invocable: false` directly into the 14 source files.
Cleaner architecture (frontmatter lives with its own skill, not injected
by the generator) and removes the file-level overlap entirely. `deps: [1]`
kept for the empirical-verification ordering (needs the generator to
exist to produce a real wrapper to test against), not for footprint
reasons.

## Assumptions (not material enough to send back to exploring)

- Exact generator function name/module path (`src/setup/skill-wrappers.mjs`)
  is illustrative, not binding — the implementer may name it differently
  as long as it is the single shared function D7 requires.
- `git tag -l` showing no real semver tag yet (only `pre-tsk-3ce`) does not
  block this item — D2's project-local version-pinning story works with a
  commit-SHA pin today and improves automatically once `tsk-jtb` cuts a
  real tag; no dependency edge added since `tsk-jtb` is a separate,
  already-progressed item outside this scope.
- Whether the plugin marketplace channel (`plugins/fgOS/skills/*`) also
  gets auto-generated from `.agents/skills` (vs. staying hand-maintained,
  now genuinely optional) is left to the skill-source-of-truth child's own
  implementer judgment — not material to this item's product decisions
  (D5 already settled that the plugin channel is optional/non-load-bearing
  either way).

## Outstanding questions

None
