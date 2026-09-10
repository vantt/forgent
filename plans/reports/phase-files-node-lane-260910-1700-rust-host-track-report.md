# Phase Files — Node Lane (rust-host-r1-kernel track)

Wrote P00, P01, P02, P03, P09, P10, P11 for
`plans/260910-1700-rust-host-r1-kernel/`. Docs only, no code, no commits.

## Per-file mapping and paths verified

**P00 — `phase-00-inventory-and-inputs-freeze.md`** (`code:review`)
- Source: plan doc §5 (P0 deliverables/scout evidence/exit gate).
- Verified: `grep -c "^    name:" src/cli/command-registry.mjs` = 73;
  file:line for all nine callers (`scripts/fgos-shell-integration.sh` lines
  57-100, `herdr-plugin/src/fgos.rs:363` `run_fgos`,
  `herdr-plugin/src/gateway.rs:382` `build_fgos_command`,
  `herdr-plugin/src/main.rs:213` `fetch_worker_slots`,
  `src/runner/dispatch/cli.mjs:47` `BIN_FGOS_PATH`,
  `src/evolve/iron-law.mjs:24-40` `MODULE_RULES`,
  `src/setup/registrations.mjs:2338-2349`
  `checkPluginSkillCliReachable`, `core/skills/_shared/fgos-cli-fallback.md`,
  `package.json` `bin.fgos`).
- Doubt: `iron-law.mjs`'s entry is a static footprint-match rule, not a
  runtime resolver call — flagged that distinction explicitly in R3 rather
  than silently treating it the same as the other eight.

**P01 — `phase-01-command-route-descriptor.md`** (`code:implement`)
- Source: plan §6 P1 steps 3, 4, 6; `legacy-cli-transition.md` §2's
  `CommandRouteDescriptor` minimum-fields block; §3 (subcommand-mode
  selectors stay one entry).
- Verified: `scripts/export-command-selectors.mjs` and
  `scripts/explain-command-route.mjs` are the exact names `plan.md`'s
  Product Gates row and Shared-File Lease Rule already commit to — first
  draft used an invented `test/rust-host/generate-command-routes.mjs` name;
  corrected via `Edit` before finalizing (caught by re-reading `plan.md`'s
  lease block against my own draft).
- Verified `coordination`'s registry entry uses a `sub` positional +
  `enum`, confirming subcommand modes fold into one selector, never
  exploded.

**P02 — `phase-02-parity-harness.md`** (`code:implement`)
- Source: plan §6 P1 steps 1, 2, 7, 8; coverage floor; performance-gate
  section (measurement capture named here; threshold judgment deferred to
  P08 per the task brief, not restated in this phase file).
- Named one concrete child-process spy mechanism
  (`NODE_OPTIONS=--require <spy>.cjs`) since the source docs only require
  "spawned-process evidence" without naming a mechanism — a Doer-level
  design choice stated explicitly so a Reviewer can check it was actually
  built, not merely gestured at.

**P03 — `phase-03-envelope-vectors-and-corpus.md`** (`code:implement`)
- Source: plan §6 P1 step 5; `legacy-cli-transition.md` §4 (hash/pretty/
  corpus split, seven-category differential corpus).
- Verified `src/state/envelope.mjs`'s `wrapEnvelope` (hash = sha256 of
  compact `JSON.stringify(data)`, pretty-printed final output) — the exact
  behavior the vectors must capture.
- Named the generator `test/rust-host/generate-vectors.mjs`, inside the
  `node-harness` lease's `test/rust-host/**` glob (not a new top-level
  `scripts/` entry, since the lease list names only two specific `scripts/`
  files and this generator is P03-local, unlike P01's descriptor
  generator which the plan explicitly names at the `scripts/` root).

**P09 — `phase-09-release-tree-builder-and-doctor.md`** (`code:implement`,
full-suite gate)
- Source: plan §11 P6 steps 2, 3, 7, 8 (release tree + doctor only — NOT
  `fgctl` proof, NOT the installed-entry flip); `runtime-identity-and-
  activation.md` §5 (manifest minimum fields, digest formula, Release Tree
  Canonicalization table).
- Verified: `package.json`'s `files` array (11 entries: bin, src, scripts,
  core, domains, .agents, README.md, LICENSE, docs/how-to,
  docs/explanation, docs/enduser-docs-index.json) — the exact set to stage
  under `libexec/legacy-node/`; `docs/specs/distribution.md` row 7/7b exact
  comma-separated list format to append four new check ids into.
- Doubt: whether the Doer should read `package.json` `files` directly or
  shell to `npm pack --dry-run --json` — left as an explicit either/or in
  R1 with instruction to name the choice, since both are defensible and the
  plan doc doesn't mandate one.

**P10 — `phase-10-tier-zero-resolver.md`** (`code:implement`)
- Source: plan §9 P4 step 9; `legacy-cli-transition.md` §2 (nine call
  sites, tier-0 mechanism).
- Verified all three Herdr call sites independently build
  `root.join("bin/fgos.mjs")` today (confirmed via `sed -n` on
  `fgos.rs:363`, `gateway.rs:382`, `main.rs:213`) — grounds R3's claim that
  a shared `resolve_fgos` replaces three independent hardcodings.
- Verified `checkPluginSkillCliReachable` (registrations.mjs ~2338-2349)
  already calls `resolveFgosBin` and has a tier-1/tier-2/else ternary that
  needs a new tier-0 branch — a concrete, checkable line-level requirement
  rather than a vague "wire the reachability check" instruction.
- Resolved an ambiguity: `iron-law.mjs`'s `bin/fgos.mjs` MODULE_RULES entry
  is a static risk-classifier match, not a resolver call, so "routing it
  through the resolver" (as the task brief phrased it) can't mean calling
  `resolveFgosBin` at runtime. Reframed as: add a matching MODULE_RULES
  entry for the new `src/setup/bin-discovery.mjs` resolver file itself, so
  the Iron Law's self-modifying-capable list flags edits to the tier-0
  logic the same way it already flags `bin/fgos.mjs` edits. Grounded in the
  file's own documented "over-reporting is the safe direction" rule (D13).

**P11 — `phase-11-docs-changelog-closeout.md`** (`code:review`, full-suite
gate)
- Source: plan §11 P6 step 9; §15 (Test And Review Gates); §18 (Definition
  Of Done); `core/skills/fgos-plan-loop/SKILL.md` §5 step 6
  (track-closeout report contents: merge commits, deferred findings,
  reproduction commands).
- Verified `docs/architect/host-invocation-routing/` currently holds
  exactly 5 files (`ls` count) and `docs/specs/reading-map.md`'s existing
  bullet format (flat list: path — description — spec pointer) to match.
- Read `core/skills/fgos-plan-loop/SKILL.md` (not `.agents`/`.claude`/
  `plugins` mirrors) per this repo's own "edit core, not the render
  target" rule.
- Left CHANGELOG/distribution.md content requirements deliberately generic
  about the Rust-lane cells' (P04-P08) specific output, since those phase
  files are written by a concurrent agent and I have not read their
  content — R1/R2 instruct sourcing any additional lines from those cells'
  own merge commits rather than guessing what they shipped.

## Constraint checks

- `ls plans/260910-1700-rust-host-r1-kernel/` — all seven files present
  alongside the concurrent agent's P04-P07 (P08 not yet written at the time
  of this check).
- `grep -n "setup\b" phase-0[0-3]*.md phase-{09,10,11}*.md` — every hit is
  inside a file path (`src/setup/...`, `test/setup/**`); no bare "setup"
  verb usage.
- Line counts: 84, 81, 77, 71, 89, 96, 83 — all within the 60-120 range.
- Every phase ends with a `Depends on:` line matching the Parallel
  Execution Map (P00 → P01 → P02 → P03 sequential; P09 depends on P08
  merged; P10 on P09; P11 on P10).
- No task IDs, phase numbers, or audit labels used as the *reason* for any
  requirement — every requirement cites the underlying doc/code fact
  instead (a stray `tsk-*` appears only inside a quoted existing code
  comment cited as ground truth, e.g. the D13 reference in P10, never
  authored by this phase file itself).

## Unresolved questions

None blocking. Two Doer-level choices were left explicit rather than
over-specified (P09's `files`-array-vs-`npm pack` read method; P02's exact
child-process-spy mechanism name) — both are cheap for a Reviewer to check
either way was actually implemented.

