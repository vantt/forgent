# fgOS plugin dev-skill packaging gap — plan

Mode: standard

**Lane derivation (direct-entry fallback — no `fgos-routing` Orient step ran
this session, no prior `Mode:` line in this file):** flags counted per
`fgos-routing`'s own Mode-gate table —
- **public contracts** — `plugins/fgOS/` is fgOS's own distributed surface,
  consumed by every external repo that installs it as a plugin; this item
  changes what that surface ships.
- **existing covered behavior** — interacts with and extends
  `test/skills/fgos-mirror.test.mjs`'s existing enforcement scope (CONTEXT.md
  D3).
- **external systems** — hinges on Claude Code's own plugin-manifest loader
  behavior (confirmed via official docs during discovery, RESEARCH.md Round 1),
  a system this repo does not control.

3 flags, no hard-gate flag (no auth/data-loss/audit/external-provider/
validation-removal) → **standard** (2-3 flags, or story-sized behavior).

**Impact-analysis posture:** `full` (GitNexus registered and `present`,
checked fresh this stage — `fgos tool query --capability impact-analysis
--status present`, same result as `fgos-coding-exploring`'s own check).

## Approach

Chosen path: implement CONTEXT.md's D1 (a)+(c) as ONE coherent phased fix
inside this single item — not a split into separate backlog items. Rejected
alternative: splitting phase 1 (packaging) and phase 4 (docs) into separate
items — rejected because they share one root cause and one CONTEXT.md; a
split would add coordination/footprint-declaration overhead between two
child items whose only real ordering constraint is "packaging exists before
the test can assert against it," which a phased plan inside one item already
expresses without a second item's process cost.

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| Copying the 14 dev-skills into `plugins/fgOS/` (D2/D4) | Medium — must not silently diverge from `.claude/skills/fgos-coding-*` (the exact drift bug tsk-4jk/18g/11f/2qh already found for the existing two-way mirror) | Phase 2's extended test asserts byte-identical content; `npm test` green is the proof point |
| Extending `test/skills/fgos-mirror.test.mjs`'s enforcement to a third leg (D3) | Medium — this is "existing covered behavior" (one of the 3 flags above); a careless edit could weaken the existing `.claude/skills`<->`.agents/skills` assertions while adding the new one | `npm test` green, AND a manual negative check: temporarily desync one plugin copy, confirm the test fails, then restore — proof point run once during implementation, not left in the suite |
| Doctor check placement (D5) | Light — additive, read-only, follows `plugin-skill-cli-reachable`'s own established shape exactly (`src/setup/registrations.mjs`) | `fgos doctor` run manually against a deliberately-broken plugin copy (one dev-skill file removed) shows the new check failing, then passes again once restored |
| Distribution docs (D6) | Light — prose only, no code path depends on it | Read-back: confirm the added section states the before/after posture accurately against what phases 1-3 actually shipped |

### Files likely touched

- `plugins/fgOS/skills/<name>/SKILL.md` — new, one per coding-domain
  dev-skill (14 files: `fgos-coding-driving`, `fgos-coding-exploring`,
  `fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`,
  `fgos-coding-discovering`, `fgos-coding-shaping`, `fgos-coding-compounding`,
  `fgos-routing`, `fgos-clarifying`, `fgos-researching`, `fgos-fanout`,
  `fgos-indexing`, `fgos-unlock`) — or `plugins/fgOS/.claude-plugin/
  plugin.json` gains a `skills` manifest field pointing at a subfolder,
  whichever the implementer picks per D4 (both are "adds to the default
  scan" per the confirmed schema — RESEARCH.md Round 1)
- `test/skills/fgos-mirror.test.mjs` — extended to compare the plugin
  copies against `.claude/skills/fgos-*` the same way it already compares
  `.agents/skills/fgos-*`
- `src/setup/registrations.mjs` — new doctor check beside
  `plugin-skill-cli-reachable` (~line 1092)
- `docs/distribution-vision.md`, `docs/specs/distribution.md` — before/
  after posture statement (D6)
- `CHANGELOG.md` — `## [Unreleased]` entry (this is user-visible: a
  plugin-only consumer's `/fgOS:cook`/`/fgOS:discover`/`/fgOS:plan`/
  `/fgOS:pick` now works, per AGENTS.md's install/setup/doctor gate)

### Order

1. Package the 14 dev-skills into `plugins/fgOS/` (D2/D4) — everything
   else depends on this existing first.
2. Extend `test/skills/fgos-mirror.test.mjs` to enforce the new copies stay
   byte-identical to `.claude/skills/fgos-*` (D3) — needs phase 1's files to
   exist first.
3. Add the doctor check beside `plugin-skill-cli-reachable` (D5) —
   independent of phase 2, but naturally follows once phase 1's target
   paths are settled.
4. Update `docs/distribution-vision.md`/`docs/specs/distribution.md` (D6)
   and `CHANGELOG.md` — documents what phases 1-3 actually shipped, so it
   goes last.

No `fgos graph --json`/`--what-if` signal available (`topUnblock` returned
empty — this item has no deps/children to compare), so the order above is
argued from the phases' own real dependency (packaging before the test that
checks it), not from graph metrics.

## Split decision

No split — one honest piece of work, proceeds as itself (see Approach's
"rejected alternative" above).

## Verify

```bash
npm test
```

`npm test` covers the whole suite, including the new/extended
`test/skills/fgos-mirror.test.mjs` assertions (phase 2) — a real, runnable
command, not a placeholder. The manual negative checks named in the risk
map (temporarily desync a copy / remove a doctor-checked file) are one-time
proof points run during implementation, never left as permanent suite
state.

## Outstanding questions

None
