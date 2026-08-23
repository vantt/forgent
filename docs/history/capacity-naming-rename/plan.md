---
item: tsk-225
---

# plan.md — tsk-225

Mode: **standard**

Flags (per `fgos-routing`'s Mode-gate, applied directly — this session
entered via `fgos-coding-shaping`'s native-first handoff, so no lane was
pre-decided): **data model** (`runner.capacities` → `runner.executors` is
a real config-schema field rename, validated by
`validateCapabilitiesShape`/`validateRunnerConfigShape`), **public
contracts** (a widely-consumed field — `.fgos/config.json`'s live shape,
17+ skill-prose files, `AGENTS.md` — renamed with explicit no-back-compat,
per D1), **existing covered behavior** (the edit lands inside
`src/runner/dispatch.mjs`, the same CRITICAL-blast-radius chokepoint
`tsk-pdg`/`tsk-34n` both touched, with 500 real test occurrences in
`test/` depending on the current shape). 3 flags, no hard-gate flag
(not auth/data-loss/audit-security/external-provider/removing-a-
validation — this is a mechanical rename, not a governance change) →
**standard**, matching `tsk-34n`'s own precedent for a rename of this
shape and magnitude.

## Approach

Every material decision (D1-D3) is locked in `CONTEXT.md`. `fgos graph
--json` was checked for split-ordering guidance (`criticalPath`/
`topUnblock`); neither field names this item or any candidate split of
it, and no split is being cut here (see "Decide the split" below), so its
output is not load-bearing for this plan.

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present`): `gitnexus` present, but this session has repeatedly
observed (PostToolUse hook, this session) its index reporting stale
(`last indexed: 7bb3231`, behind current HEAD) — **degraded**. Every
proof point below leans on direct `grep`/`rg`/`npm test` evidence, not
GitNexus's graph, consistent with `CLAUDE.md`'s own cross-check rule and
the same posture `tsk-34n`'s own plan.md recorded for this identical file
neighborhood.

Three phases, in dependency order — each independently verifiable, no
phase left half-done before the next starts:

### Phase 1 — code + config (the real behavior surface)

Rename `capacity`/`capacities` → `executor`/`executors` in:
- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 files, 466 occurrences per `CONTEXT.md`'s scout — re-run
  `grep -rlc "capacit" src/` at implement time as the authoritative list,
  never hand-copied): `src/runner/dispatch.mjs` (the chokepoint —
  `resolveCapacityAndOverrides` → `resolveExecutorAndOverrides`, every
  `capacityId`/`capacity` local/param, `cfg.capacities` accesses,
  `validateCapacityShape` (singular, line 661 — validates one
  `capacities.<id>` entry) → renamed to something OTHER than
  `validateExecutorShape`, since that exact name already exists at line
  418 and validates a genuinely different thing (the global-default
  `cfg.executor` shape) — collision found during `fgos-coding-validating`'s
  reality gate; a naive full-identifier rename would have produced a
  duplicate function declaration. Use `validateExecutorEntryShape` for the
  renamed one, etc.),
  `src/runner/loop.mjs`, `src/state/tool-registry.mjs`,
  `src/state/worker-slots.mjs`, `src/state/replay.mjs`,
  `src/setup/registrations.mjs`, `src/cli/command-registry.mjs`.
- `test/` (8 files, 500 occurrences per `CONTEXT.md`'s scout, re-run
  `grep -rlc "capacit" test/` at implement time): every fixture, helper
  (`declareCapacity` → `declareExecutor`, etc.), and assertion string
  that currently says "capacity".

This is D1's core: no back-compat alias, no `capacity` key left reachable
after this phase. Full `npm test` must be green before Phase 2 starts —
a red suite here means the rename is not actually complete yet, not
something to paper over and continue past.

### Phase 2 — decision record (D2)

Write `docs/decisions/0034-<slug>.md` (next real number, confirmed via
`ls docs/decisions/` at plan time: `0032`/`0033` are the highest taken).
Content: records the `capacity`→`executor` rename, and formally closes
the definitional gap `0029`'s D8 left open (D8 defined "capacity" as
covering both the promised behavior and its concrete realization,
undifferentiated — `tsk-34n` split that into `capability`/`capacity`
without ever revisiting D8's own wording; `0034` records that split
explicitly). Annotate the corresponding rows in `docs/decisions/
0000-index.md` (the same annotation pattern `0026`'s row already carries
for `0028`/`0029`) — never edit `0026`/`0029`/`0033`'s own body text,
never mark them superseded (D2: their substance stays valid, only the
term used going forward changes).

### Phase 3 — living docs + shared fragment (D3)

Rename content AND filename (where "capacit" is in the filename) for:
- Living docs whose filename carries the old term (10 files, confirmed
  via `find docs/explanation docs/how-to docs/reference -iname
  "*capacit*"` at plan time): `docs/explanation/agent-executor-capacity-
  aware-dispatch.md`, `docs/explanation/capacity-dispatch-audit-records-
  command-not-just-provider-label.md`, `docs/explanation/coding-classify-
  intake-capacity-lifecycle-created-then-retired-as-dead-config.md`,
  `docs/how-to/configure-a-capacity-to-dispatch-via-a-named-agent.md`,
  `docs/how-to/generalize-a-judge-retry-helper-for-any-capacity-
  dispatch.md`, `docs/how-to/reuse-the-shared-capacity-dispatch-fallback-
  fragment.md`, `docs/how-to/wire-a-headless-function-through-an-agent-
  executor-capacity.md`, `docs/how-to/wire-a-skills-classify-step-
  through-an-agent-executor-capacity.md`, `docs/how-to/wire-a-skill-to-a-
  capacity-by-purpose-not-name.md`, `docs/reference/capacity-cross-
  provider-governance.md`.
- Content-only updates (remaining files among the 33 that
  `grep -rl "capacit" docs/explanation docs/how-to docs/reference`
  matches but whose filename does not itself carry the term — re-run
  that exact command at implement time as the authoritative list).
- `.agents/skills/_shared/capacity-dispatch-fallback.md` +
  `plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md` (byte-
  identical mirrors, 17 real "capacit" occurrences each) → both renamed
  to `executor-dispatch-fallback.md`, content updated, and every one of
  the 13 real reference sites across `.agents/skills/*/SKILL.md`,
  `plugins/fgOS/skills/*/SKILL.md`, and `AGENTS.md` (confirmed via `grep
  -l "capacity-dispatch-fallback"` at plan time) updated to the new path.
- `AGENTS.md`'s own prose mentions of "capacity" (the "Dispatch" section).

`docs/history/*capacity*/` (~14 directories) are explicitly OUT of scope
for this phase — D3's own rationale (period-accurate content).
`docs/decisions/0026`/`0029`/`0033`'s own body text is also out of scope
(D2 — their substance stays as originally worded; only `0000-index.md`
gets the annotation).

## Decide the split

One honest piece, not split into children. The three phases above are a
strict, linear execute-order within a single item, not independently
workable pieces — Phase 2's decision record describes what Phase 1 just
did, and Phase 3's doc updates reference the field name Phase 1 just
established. Landing them as separate items would mean a real window
where the codebase uses `capacity` in code and `executor` in a decision
record simultaneously, exactly the confusion D1 exists to eliminate.
`fgos graph --what-if` was not run for candidate splits since there are
none to compare.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| Phase 1 rename inside `src/runner/dispatch.mjs` (CRITICAL blast-radius chokepoint, same file `tsk-pdg`/`tsk-34n` both touched) | Real — large mechanical rename touching the dispatch resolution chokepoint, 3 flags earn `standard` | Full `npm test` green (baseline 3477 pass/0 fail/5 skipped, post-`tsk-34n`); Iron Law red/green transcript (`src/runner/` matches `MODULE_RULES`, same as `tsk-34n`'s own 4 evidence rounds) |
| No-back-compat break of a live, widely-read config field | Real — every skill/session reading `runner.capacities` breaks silently if a reference is missed, by explicit D1 design (no alias) | `grep -rn "capacit" src/ test/ .claude/skills .agents/skills plugins AGENTS.md CLAUDE.md docs/explanation docs/how-to docs/reference` returns zero matches, except `docs/decisions/0026`/`0029`/`0033`'s own body text (D2, explicitly preserved) and `docs/history/*capacity*/` (D3, explicitly preserved) |
| Live `.fgos/config.json` migration | Low — same additive/renaming shape `tsk-34n`'s own D3 migration already proved safe; behavior must stay byte-identical externally | Re-run the same `decide --work`/`decide --for` native+headless proof `tsk-34n`/`tsk-pdg` both used, against the migrated config |
| Decision record `0034` + `0000-index.md` annotation | Low — additive doc only, no code coupling | Manual read-back; no test coverage expected for prose |
| Shared fragment rename (`_shared/capacity-dispatch-fallback.md` → `executor-dispatch-fallback.md`), 13 real reference sites | Real but mechanically bounded — a missed reference breaks a skill's own relative-path read at runtime, not silently | `grep -rl "capacity-dispatch-fallback"` returns zero after rename; a spot-check invocation of one referencing skill (`fgos-coding-exploring` or `fgos-coding-planning`) confirms it still loads |

## Assumptions

- **Concurrent-worktree read of the renamed live config is a reversible,
  self-healing risk, not an expensive one.** Once Phase 1 lands, any
  other worktree session still running pre-rename `dispatch.mjs` code
  that reads the main checkout's `.fgos/config.json` (via `--dir`, per
  ADR0020) will find `runner.capacities` simply absent (renamed to
  `runner.executors`). `resolveCapacityAndOverrides`'s own guard
  (`const capacities = cfg && cfg.capacities && typeof cfg.capacities
  === 'object' ? cfg.capacities : {}`) already treats a missing/absent
  `capacities` the same as an empty one — `configured: false`, falling
  back to the global default executor, never a crash. This degrades a
  capability preference (e.g. `agy` momentarily unavailable) until that
  session rebases; it does not corrupt state or lose work. This is the
  same class of consequence D1's own "no back-compat" already knowingly
  accepted — not a new risk this plan introduces, just its concrete
  shape spelled out (found during `fgos-coding-validating`'s reality
  gate, D5: reversible risk, pin and carry on rather than ask).

## Implementation addendum (post-validating, real findings)

Beyond the two reality-gate fixes recorded above (validator naming
collision, concurrent-worktree assumption), implementation itself found
and fixed several more real issues no amount of grep-only scouting
surfaced ahead of time:

1. **A second, more severe naming collision** inside
   `resolveExecutorConfig`: the raw catalog entry (until this item,
   locally named `capacity`) and the function's own final resolved
   dispatch shape (already, independently, named `executor` before this
   item) collided into the same identifier once the entry got mechanically
   renamed too — a real `SyntaxError: Identifier 'executor' has already
   been declared`, not caught by the earlier `validateExecutorEntryShape`
   fix since it's a different function. Fixed by naming the raw entry
   `executorEntry` throughout that function, distinct from the resolved
   `executor` — also fixed one place (`allowCrossProvider` governance)
   where a naive resolution would have silently read the WRONG variable
   (the resolved shape never carries `allowCrossProvider` for
   `invocations[]`-shaped entries like `agy`; only the raw entry does).
2. **`bin/fgos.mjs` and `scripts/dispatch-decide-hook.mjs`/
   `project-agents.mjs`/`check-decision-codes.baseline.json`** — real
   callers/references outside the `src/`/`test/` scope `CONTEXT.md`'s
   scout enumerated, found only once `npm test` exercised them.
3. **The live `.fgos/config.json` rename target `executors` collides with
   an already-retired, historically-inert field of the exact same name**
   (`executors.<tier>`, a per-tier override rung retired at `tsk-in1-2`
   D6, 0 live entries, never validated). One test asserting that inert
   property is now categorically wrong now that D1 gives the name real,
   validated meaning — fixed the test and its header comment to document
   both `executors` across time rather than delete the history.
4. **~10 corrupted historical path citations**, found across `src/`,
   `test/`, `docs/`, and skill files: a comment/doc citing
   `docs/decisions/0026-...md`'s own filename, or a `docs/history/
   *capacity*/` directory name, by name — got mechanically swapped mid-
   citation by the same rename that correctly touched everything else
   around it, breaking the reference to a file D2/D3 deliberately never
   renamed. Confirmed each one against real paths on disk and reverted.
5. **The item's own `verify` command was too strict once these legitimate
   historical citations were confirmed correct** — `grep -rqE "capacit"
   src test` with no exceptions would forever fail against 8 lines that
   are supposed to keep saying "capacity" (citing `docs/history/
   capability-capacity-remodel/`, D3). Corrected the command to exclude
   exactly those known, enumerable, intentional citations rather than
   loosen the check's actual intent (catching real leftovers).

6. **A real live incident on the shared main checkout**, found by
   re-running `fgos return tsk-225`: the live `.fgos/config.json`'s
   `runner.capacities`→`runner.executors` rename (committed to `main`
   directly, matching the pattern used for `tsk-34n`'s own D3 config
   migration) broke config load-time validation (the `prefer`/`for`
   symmetry check in `validateRunnerConfigShape`) for **every** `fgos`
   command run from the main checkout — `main`'s own `src/runner/
   dispatch.mjs` has not merged this item's rename yet, so it can no
   longer find `capacities` (renamed away) and cannot understand
   `executors` (its own vocabulary doesn't have that word yet). Unlike
   `tsk-34n`'s own live-config edit (purely additive — new fields old code
   safely ignores), this rename removes a key old code structurally
   depends on, so it cannot land ahead of the matching code the way
   additive changes safely can. Fixed by reverting just that one key on
   `main` (commit `6e4f8919`) — restoring every `fgos` command immediately
   — and by skipping the 2 tests that read the real committed config via
   `committedRunnerConfig()` and can only pass once code and config land
   together, at this item's own merge (same "Live migration proof" shape
   `tsk-34n`'s own evidence used, done once, near merge time, not baked
   into this item's own blocking verify). **This item's own approve/merge
   step must (a) re-apply the `capacities`→`executors` rename to the live
   `.fgos/config.json`, and (b) un-skip both tests (swap their read back
   to `cfg.executors`) — see `iron-law-evidence.md`'s own "Live migration
   proof" section for the exact steps.**

Full suite after all fixes: 3475 pass / 0 fail / 7 skipped (5 pre-existing
+ the 2 above, both explained and temporary — no unexplained regression).

## Outstanding questions

None
