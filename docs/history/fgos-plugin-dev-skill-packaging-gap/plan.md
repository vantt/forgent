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

## tsk-5zi — active copy/generation script (2026-08-20)

Mode: tiny

**Lane derivation (direct-entry fallback — no prior `Mode:` line for this
item, no `fgos-routing` Orient step ran this session):** flags counted per
`fgos-routing`'s own Mode-gate table — none of auth/authorization/data
model/audit-security/external systems/public contracts/cross-platform/
multi-domain apply; the one arguable flag is **existing covered
behavior** (this extends `test/skills/fgos-mirror.test.mjs`'s existing
byte-identical assertions, which already pass today against the manual
copy). 0-1 flags, two files touched, one direct task → **tiny**.

**Impact-analysis posture:** `full` (GitNexus registered and `present`,
checked fresh this stage — same result as above, unchanged since 2026-08-12).

This item closes the specific open choice this feature's own D3 (above)
left unresolved: "whether to ALSO add an active copy/generation script
... is left to fgos-coding-planning". This round answers: yes, add it,
scoped to `npm run build:skills` only.

### Approach

Chosen path: add one new exported function to `src/setup/skill-
wrappers.mjs` (reusing the existing, already-proven `copyDirRecursive`
helper — no new copy mechanism) that mirrors `.agents/skills/{_shared,
fgos-*}` into `plugins/fgOS/skills/`, called from `scripts/build-skill-
wrappers.mjs` right after its existing `generateAllSkillWrappers` call.
Rejected alternative: adding the mirror call inside
`materializeSkillsIntoProject` instead/also — rejected because that
function's `targetRoot` is an external project being set up, and
`plugins/fgOS/skills/` is this repo's own package-relative plugin
directory, never something materialized per external target (confirmed,
RESEARCH.md Round 2).

Cites: this feature's own D2 (plugins/fgOS's copies stay a
generated/enforced mirror, never an independently-edited third copy —
this item is exactly that generation step) and D3 (test-based enforcement
already exists; this item adds the generation half D3 explicitly left
open).

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| New `mirrorDevSkillsIntoPlugin`-style function reusing `copyDirRecursive` | Light — same helper already proven correct by 3 existing callers | `npm run build:skills` run once, `git diff --stat` shows only the 14 dev-skill + `_shared` dirs under `plugins/fgOS/skills/` touched, no unrelated file changed |
| Wiring the new call into `scripts/build-skill-wrappers.mjs` | Light — one new function call after an existing one, same script | `npm run build:skills` exits 0, prints the new copy summary alongside the existing wrapper-generation output |
| No regression to the existing byte-identical enforcement | Light — `test/skills/fgos-mirror.test.mjs` already asserts the exact target shape (name set, file set, byte content, `_shared`) unchanged by this item | `node --test test/skills/fgos-mirror.test.mjs` green after running `npm run build:skills` |

### Files likely touched

- `src/setup/skill-wrappers.mjs` — new exported function
- `scripts/build-skill-wrappers.mjs` — one new call, after
  `generateAllSkillWrappers`
- No test file changes needed — `test/skills/fgos-mirror.test.mjs`
  already asserts the target state this item makes self-maintaining

### Order

1. Add the new function to `src/setup/skill-wrappers.mjs` (nothing to
   call it from yet).
2. Wire the call into `scripts/build-skill-wrappers.mjs`.
3. Run `npm run build:skills`, confirm the diff is empty content-wise
   (source and target already byte-identical today) and `npm test`
   stays green.

No `fgos graph --json` critical-path signal needed — single isolated
item, two files, strictly sequential internal dependency (the function
must exist before the script can call it).

### Split decision

No split — one honest piece of work.

### Verify

```bash
npm run build:skills && node --test test/skills/fgos-mirror.test.mjs
```

Real, runnable command (synced onto the item's own `verify` field via
`fgos edit --verify`, replacing the discovery-stage placeholder that had
embedded prose, not valid shell). Runs the automation, then the existing
test that already proves the target shape (name-set match, file-set
match, byte-identical content, `_shared` mirror, `user-invocable: false`
on every copy) — the same 6 assertions phases 1-2 of tsk-32b's own plan
above established, now proven against a freshly-generated copy instead of
a hand-maintained one.

## Outstanding questions

None
