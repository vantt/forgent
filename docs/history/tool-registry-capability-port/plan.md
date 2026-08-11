# tool-registry-capability-port — plan

Item: `tsk-1dj`. Decisions: `docs/history/tool-registry-capability-port/CONTEXT.md` (D1-D3).

## Mode

**Standard.** Flag count: 3 —
- **data model** — new event kinds (`tool.register`/`tool.remove`) folding
  into a new `view.tools` map, plus a new local-only overlay file
  (`.fgos/tool-status.local.json`) that is not event-logged at all.
- **public contracts** — new CLI verb group (`fgos tool register/check/
  query/remove`) added to `src/cli/command-registry.mjs`, the
  machine-readable manifest guarded by its own anti-drift test
  (`test/cli/fgos-manifest.test.mjs`).
- **existing covered behavior** — touches `bin/fgos.mjs`'s single verb
  dispatch (2895 lines today) and `src/setup/checks.mjs`'s `DOCTOR_CHECKS`
  array, which `test/setup/checks.test.mjs` asserts has an *exact* count
  today ("has exactly the three v1 checks... plus main-checkout-hook-
  wired") — adding a 5th entry must update that assertion, not just add
  code.

No hard-gate flag applies (no auth, no data loss, no audit/security
surface, no external provider integration, nothing being removed) — 3
flags lands squarely in standard, not high-risk. Not a spike: nothing
here is a single yes/no question deciding whether the plan is real: the
deep-dive (`docs/distillery/deep-dives/tool-registry.md`) already answered
what/why; this plan is straightforward "where does each piece live."

## Approach

**Chosen path:** mirror the existing `porting.mjs` / `porting-store.mjs`
split already in `src/state/` — a new `src/state/tool-registry.mjs`
holding pure logic (kind enum, `normalizeCapability`, the
inactive/degraded/full classifier, local-status-file read/merge), called
from a new `case 'tool':` block in `bin/fgos.mjs`, with `replay.mjs`
gaining two new fold cases (`tool.register`, `tool.remove` — not
`tool.check`, which never touches the event log per CONTEXT.md's pinned
"registered vs present" term).

**Alternatives rejected** (all already settled in CONTEXT.md/the
deep-dive, cited not reopened):
- Fold `tool.check`'s result into the shared event log alongside
  `register`/`remove` — rejected per the distillery consult cited in the
  deep-dive (Trade-off #2): check status is a fact about *this machine*,
  not a team decision, so it never goes through `.fgos/events.jsonl`.
- A dedicated SQL/schema store (what repository-harness itself uses) —
  rejected as YAGNI; fgOS's existing event-log + `view.json` fold
  infrastructure already covers this shape, per CONTEXT.md/deep-dive §6.
- A standalone `fgos tool doctor` subverb — rejected; add the new
  posture check as one more entry in the existing `DOCTOR_CHECKS` array
  instead (add-through-not-alongside, `docs/distillery/porting-log.md:86`,
  and CONTEXT.md D1).

**No split.** `fgos graph --what-if` comparison across candidate pieces
was not run — CONTEXT.md D1 and D3 explicitly lock the doctor-check entry
and the gitnexus seed as *this item's own deliverable*, not deferred
work, so there is nothing left that is honestly a separate, independently
workable piece. Splitting now would contradict decisions already locked
in `clarify`, not discover a real seam.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Event-log fold (`replay.mjs` 2 new cases) | Diverges from the existing flat-switch fold convention, or corrupts `view.tools` on replay | New cases in `test/state/replay.test.mjs`, following the existing case-test pattern for `work.add`/`decision`/etc. |
| CLI verb wiring (`bin/fgos.mjs`, `command-registry.mjs`) | Breaks existing verb dispatch or the manifest anti-drift test | `test/cli/fgos-manifest.test.mjs` passes unchanged shape + new entries; `test/cli/fgos.test.mjs` gains `tool` subcommand coverage |
| Local status overlay (`.fgos/tool-status.local.json`) | Query-time merge gets "registered, no local file" wrong — must read `unknown`, never `missing` (US-027 semantics, deep-dive §Bước 1) | Explicit test: registry has an entry, local file absent → `query` reports `unknown`, not `missing` |
| `tool check` exit code | A missing tool accidentally makes the CLI process exit non-zero | Test asserts `check` always exits 0 regardless of probe outcome (deep-dive: "absent = fact to report, never a CLI error") |
| Doctor entry (`checks.mjs`) | Breaks `test/setup/checks.test.mjs`'s exact-count assertion | Update that assertion alongside the new entry; new entry gets its own status-mapping test (inactive/degraded/full → doctor severity) |
| Gitnexus seed (D3) | Registering against the live `.fgos/events.jsonl` in this repo's main checkout is a real, shared-state write, not a local test fixture | Do this last, after verbs are implemented and tested — `fgos tool register --name gitnexus ...` run once, then `fgos tool query --capability impact-analysis` confirms it |

## Files touched (implementation order)

1. `src/state/tool-registry.mjs` (new) — kind enum (`cli`/`binary`/`mcp`/
   `skill`/`http`, D2), `normalizeCapability`, degrade-ladder classifier
   (inactive/degraded/full), local-status-file read/write/merge helpers.
2. `src/state/replay.mjs` — add `tool.register`/`tool.remove` fold cases
   → `view.tools: { <name>: {kind, capability, scanTarget, command,
   responsibility, description} }`.
3. `bin/fgos.mjs` — new `case 'tool':` dispatch (`register`/`check`/
   `query`/`remove` subcommands), following the existing verb-handler
   shape.
4. `src/cli/command-registry.mjs` — manifest entries for the 4 subverbs
   (`touchesState`/`requiresExistingStore`/`externalEffect`/`paginated`
   per str46-io-contract's existing per-verb declaration discipline;
   `check` is `touchesState: false` since it never appends an event, only
   writes the local file).
5. `src/setup/checks.mjs` — new `DOCTOR_CHECKS` entry
   `tool-registry-configured` (D1), reporting inactive/degraded/full.
6. `.gitignore` — add `.fgos/tool-status.local.json`, alongside the
   existing local-only entries (`.fgos/sessions.json`, `.fgos/*.lock`,
   `.fgos/invocation-faults.jsonl`) already following this exact pattern.
7. `docs/specs/work-state.md` — document the new verb group + `view.tools`
   shape (DoD #6: a settled spec fact belongs in the area spec).

## Tests

- `test/state/tool-registry.test.mjs` (new) — kind validation, capability
  kebab-case normalization, degrade-ladder classification, local-file
  merge semantics (registered+no-file → `unknown`; registered+file-says-
  missing → `missing`/degraded; registered+file-says-present → `present`/
  full).
- `test/state/replay.test.mjs` — extend with `tool.register`/`tool.remove`
  fold cases.
- `test/cli/fgos.test.mjs` — extend with `tool register`/`check`/`query`/
  `remove` integration coverage: happy path, duplicate `--name` rejected,
  invalid `--kind` rejected, `check` always exits 0 including on a
  missing tool.
- `test/cli/fgos-manifest.test.mjs` — passes unchanged (anti-drift check
  picks up the new registry entries automatically).
- `test/setup/checks.test.mjs` — update the exact-count assertion; add a
  case for the new `tool-registry-configured` entry.

## Concrete cases to prove (standard-mode depth)

- Empty/boundary: `query` with no tools registered for a capability →
  empty set, not an error (inactive).
- Existing behavior must not regress: `fgos --help --json` manifest shape
  for every pre-existing verb is byte-for-byte unchanged apart from the
  4 additions.
- Registered-but-absent vs never-registered: the deep-dive's core US-027
  distinction — `query --status present` after `check` on a machine
  missing the tool must NOT return the same shape as a capability with
  zero registrations.
- `check` on a `kind: mcp`/`skill` tool probes `scanTarget` existence on
  disk; on `kind: cli`/`binary` probes `PATH` resolution; on `kind: http`
  does a short TCP probe — three different probe strategies, one test
  each.
- D3's seed step: after implementation, `fgos tool register --name
  gitnexus --kind mcp --capability impact-analysis --scan .gitnexus
  --responsibility Verification --description "Code-graph blast radius"`
  run once against the real store, then `fgos tool query --capability
  impact-analysis` returns it.

## Verify command

```
npm test
```
(full suite — this item touches `src/state/`, `bin/fgos.mjs`, and
`src/setup/checks.mjs`, matching AGENTS.md's DoD #5 default of the whole
state+cli+runner+e2e suite for anything crossing those layers.)
