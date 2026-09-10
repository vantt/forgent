# P00 — Inventory And Inputs Freeze

Track: `rust-host-r1-kernel`. No code change in this phase (`src/**`, `test/**`,
`apps/**`, `packages/**`, `Cargo.*` untouched — verified by `git diff --stat`
at close).

## R1 — Decisions table confirmed as-is

`plans/260910-1700-rust-host-r1-kernel/plan.md` "Decisions Fixed For This
Track" table is confirmed with **no override**. Every row's default is taken:

- Target matrix: `x86_64-unknown-linux-gnu` only.
- Preview vs stable: preview.
- Node compatibility window: two releases after a selector goes native.
- Performance budgets: legacy exec overhead ≤ 25 ms p50; native `version`
  ≤ 10 ms p50, measured warm by the P02 harness.
- Selector classification: all 73 selectors `legacy-cli` except `version`
  (`native`, `distribution.build.show`).
- `distribution.build.show` owner: `fgos-distribution`
  (`packages/distribution/rust`).

Cross-checked against
`docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md`
§3/§5 and `plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md`
§6–§8 — no conflict found; the plan.md table already carries these settled
values verbatim. This check covers the 6 rows named by phase-00 R1 (target
matrix, preview-vs-stable, Node compatibility window, performance budgets,
selector classification, `distribution.build.show` owner) — the full
Decisions table has 15 rows (`plan.md:130-144`); the 9 fgctl/install rows
added by the 2026-09-10 scope widening are outside R1's named scope and are
not examined here.

`rust-cli-and-proof-components-plan.md` §3 (`:76-78`) separately directs that
decisions 1/5/6 (target matrix, preview-vs-stable, compatibility window) be
recorded in `docs/architect/packaging-distribution/`. This track's P16
docs-closeout lease covers `CHANGELOG.md`, `docs/specs/distribution.md`,
`docs/specs/reading-map.md`, and `docs/architect/host-invocation-routing/**`
only — no cell in this track's Product Gates writes to
`docs/architect/packaging-distribution/`. Flagged as an open gap for the
Lead to resolve at or before P16 (either widen P16's lease or accept
`plan.md`'s Decisions table as the recorded location and note the deviation
from §3 explicitly).

## R2 — 73-selector classification

`grep -c "^    name:" src/cli/command-registry.mjs` → **73**; the only other
`name:` match in the file (`:1343`) is a JSON-Schema property inside a
registry entry, not a 74th selector. All 73 top-level `name` entries
enumerated below (one selector per `sub`-positional group — this phase's own
R2 instruction states the rule directly; `legacy-cli-transition.md` §3
`:58-64` supports it only by implication at `:62` and does not state it
outright, so the rule is this phase's own, not a citable fact from that
section — `coordination`, `dispatch`, `session`, `tool`, `doc`, `workflow`
each count once regardless of their `sub` enum arms).

Classification: exactly **1 native** (`version` → operation
`distribution.build.show`, owner_path = `fgos-distribution` crate,
`packages/distribution/rust`). The remaining **72 legacy-cli** (owner_path =
legacy-node payload, i.e. the existing `src/cli/command-registry.mjs` handler
reached via `bin/fgos.mjs`, staged as `components.legacyNode` in the release
manifest).

| # | Selector | route_kind | owner_path |
|---|---|---|---|
| 1 | version | native | fgos-distribution crate (`distribution.build.show`) |
| 2 | init | legacy-cli | legacy-node payload |
| 3 | add | legacy-cli | legacy-node payload |
| 4 | submit | legacy-cli | legacy-node payload |
| 5 | discover | legacy-cli | legacy-node payload |
| 6 | plan | legacy-cli | legacy-node payload |
| 7 | move | legacy-cli | legacy-node payload |
| 8 | retrospective | legacy-cli | legacy-node payload |
| 9 | cleanup | legacy-cli | legacy-node payload |
| 10 | compound | legacy-cli | legacy-node payload |
| 11 | edit | legacy-cli | legacy-node payload |
| 12 | resolve-park-reason | legacy-cli | legacy-node payload |
| 13 | ask | legacy-cli | legacy-node payload |
| 14 | answer | legacy-cli | legacy-node payload |
| 15 | handoff | legacy-cli | legacy-node payload |
| 16 | handoff-return | legacy-cli | legacy-node payload |
| 17 | decision | legacy-cli | legacy-node payload |
| 18 | decision-index | legacy-cli | legacy-node payload |
| 19 | context-render | legacy-cli | legacy-node payload |
| 20 | gate-approve | legacy-cli | legacy-node payload |
| 21 | list | legacy-cli | legacy-node payload |
| 22 | ready | legacy-cli | legacy-node payload |
| 23 | graph | legacy-cli | legacy-node payload |
| 24 | gate-bypass | legacy-cli | legacy-node payload |
| 25 | gate-check | legacy-cli | legacy-node payload |
| 26 | stale | legacy-cli | legacy-node payload |
| 27 | slots | legacy-cli | legacy-node payload |
| 28 | report | legacy-cli | legacy-node payload |
| 29 | conflicts | legacy-cli | legacy-node payload |
| 30 | faults | legacy-cli | legacy-node payload |
| 31 | recheck-blocked | legacy-cli | legacy-node payload |
| 32 | schedule | legacy-cli | legacy-node payload |
| 33 | merge | legacy-cli | legacy-node payload |
| 34 | coordination | legacy-cli | legacy-node payload |
| 35 | dispatch | legacy-cli | legacy-node payload |
| 36 | rebuild | legacy-cli | legacy-node payload |
| 37 | repair | legacy-cli | legacy-node payload |
| 38 | check | legacy-cli | legacy-node payload |
| 39 | rollup | legacy-cli | legacy-node payload |
| 40 | show | legacy-cli | legacy-node payload |
| 41 | take | legacy-cli | legacy-node payload |
| 42 | pick | legacy-cli | legacy-node payload |
| 43 | return | legacy-cli | legacy-node payload |
| 44 | review | legacy-cli | legacy-node payload |
| 45 | approve | legacy-cli | legacy-node payload |
| 46 | sync-root | legacy-cli | legacy-node payload |
| 47 | promote-to-component | legacy-cli | legacy-node payload |
| 48 | reject | legacy-cli | legacy-node payload |
| 49 | catchup | legacy-cli | legacy-node payload |
| 50 | evolve | legacy-cli | legacy-node payload |
| 51 | triage | legacy-cli | legacy-node payload |
| 52 | docs-index | legacy-cli | legacy-node payload |
| 53 | dispatch-report | legacy-cli | legacy-node payload |
| 54 | doc-sources | legacy-cli | legacy-node payload |
| 55 | authoritative-match | legacy-cli | legacy-node payload |
| 56 | topic | legacy-cli | legacy-node payload |
| 57 | doc | legacy-cli | legacy-node payload |
| 58 | knowledge | legacy-cli | legacy-node payload |
| 59 | doc-registry | legacy-cli | legacy-node payload |
| 60 | session | legacy-cli | legacy-node payload |
| 61 | gateway | legacy-cli | legacy-node payload |
| 62 | goal | legacy-cli | legacy-node payload |
| 63 | tool | legacy-cli | legacy-node payload |
| 64 | setup | legacy-cli | legacy-node payload |
| 65 | uninstall | legacy-cli | legacy-node payload |
| 66 | doctor | legacy-cli | legacy-node payload |
| 67 | unclaim | legacy-cli | legacy-node payload |
| 68 | preflight | legacy-cli | legacy-node payload |
| 69 | unlock | legacy-cli | legacy-node payload |
| 70 | lock-status | legacy-cli | legacy-node payload |
| 71 | resync-worktree | legacy-cli | legacy-node payload |
| 72 | main-checkout-reset | legacy-cli | legacy-node payload |
| 73 | workflow | legacy-cli | legacy-node payload |

Count = 73, matches `grep -c` above. Source: `src/cli/command-registry.mjs`
lines 52–1522 (`grep -n "^    name:"`).

## R3 — Nine real call sites (file:line, resolver), plus three the phase's own grep method missed

Grep basis: `rg -n "bin/fgos\.mjs" scripts/fgos-shell-integration.sh
herdr-plugin/src/fgos.rs herdr-plugin/src/gateway.rs herdr-plugin/src/main.rs
src/runner/dispatch/cli.mjs src/evolve/iron-law.mjs
src/setup/registrations.mjs core/skills/_shared/fgos-cli-fallback.md
package.json`. Every real-call hit below has a file:line; comment-only hits
(noted per file) are excluded per `legacy-cli-transition.md` §2 ("Comments are
not callers"). Four hits this exact grep prints are neither call sites nor
explicitly annotated above as comments — recorded here for R7/Verification
completeness: `scripts/fgos-shell-integration.sh:15` (comment, tier-1
narrative), `scripts/fgos-shell-integration.sh:100` (error-message string, not
an exec), `herdr-plugin/src/main.rs:205` (doc comment), and
`src/runner/dispatch/cli.mjs:41` (comment — its "fixed sibling" wording is
stale once P10 lands and should be rewritten then, not in this phase per R8).

**This nine-site list is the set `legacy-cli-transition.md` §2 itself names,
confirmed exact against the repo — it is not a claim that grepping the
literal string `bin/fgos.mjs` across the whole repo finds only nine hits.**
Live review + red-team against this report (2026-09-10) found three more real,
non-comment callers a whole-repo sweep for `bin/fgos.mjs`-composing code (not
just the literal string, since these compose the path via `path.join`/
`path.resolve` rather than writing the literal string inline) surfaces; they
are recorded as items 10-12 below rather than folded into the nine because
`legacy-cli-transition.md` §2's own text does not name them, and P10's "nine
inventoried call sites" scope (`plan.md` Goal 6, `:64-66`) should be
re-confirmed against this wider list before that cell closes:

1. `scripts/fgos-shell-integration.sh` — `fgos()` shell function, tier-1
   branch: `scripts/fgos-shell-integration.sh:69` (`if [ -f
   "$root/bin/fgos.mjs" ]`), exec at `:71`/`:73` (`node "$root/bin/fgos.mjs"
   "$@" [--dir "$root"]`). Resolver: the shell function's own inline tier
   logic (no shared resolver module — shell has none yet, per `plan.md` Goal 6
   `:64-66`, the "tier 0" work P10 does).
2. `herdr-plugin/src/fgos.rs::run_fgos` —
   `herdr-plugin/src/fgos.rs:363` (`vec![root.join("bin/fgos.mjs")...]`).
   Resolver: none yet (planned `resolve_fgos` in P10).
3. `herdr-plugin/src/gateway.rs::build_fgos_command` —
   `herdr-plugin/src/gateway.rs:382`. (Lines 203, 377, 589, 673, 687, 712, 731,
   766, 779, 1965 are comments referencing `bin/fgos.mjs`'s behavior, not
   calls.) Resolver: none yet.
4. `herdr-plugin/src/main.rs::fetch_worker_slots` —
   `herdr-plugin/src/main.rs:213` (`let fgos_mjs = root.join("bin/fgos.mjs")`).
   Resolver: none yet.
5. `src/runner/dispatch/cli.mjs` (`BIN_FGOS_PATH` constant) —
   `src/runner/dispatch/cli.mjs:47` (`const BIN_FGOS_PATH =
   fileURLToPath(new URL('../../../bin/fgos.mjs', import.meta.url))`). Line
   `:974` is a comment. Resolver: none (hardcoded sibling path today).
6. `src/evolve/iron-law.mjs` (`MODULE_RULES` footprint entry) —
   `src/evolve/iron-law.mjs:24` (`{ kind: 'equals', value: 'bin/fgos.mjs' }`).
   **Distinction flagged**: this is a static risk-classifier match against a
   changed-file path string, not a resolver call that locates/execs
   `bin/fgos.mjs` at runtime — it does not need tier-0 shim awareness, only
   needs the path string to stay valid (it will, since `bin/fgos.mjs` is not
   moved). Lines `:17`/`:18` are comments.
7. `src/setup/registrations.mjs` (`checkPluginSkillCliReachable`, already
   calls `resolveFgosBin`) — `src/setup/registrations.mjs:2336` (`const
   resolved = resolveFgosBin(cwd)`, inside `checkPluginSkillCliReachable`
   defined at `:2335`). Resolver: `resolveFgosBin` from
   `./bin-discovery.mjs` (imported `:52`) — this is the one Node resolver
   P10 adds tier 0 to. (A second, unrelated `resolveFgosBin` call exists at
   `:303` inside a different check, not part of the nine-site inventory but
   confirms the resolver is already centralized for Node call sites.) Other
   hits in this file (`:19,960,1094,1532,2213,2338,2343,2349,2423,3084`) are
   comments/strings referencing `bin/fgos.mjs` by name, not calls.
8. `core/skills/_shared/fgos-cli-fallback.md` (documented shell snippet,
   source for ~20 `.agents`/`plugins` mirror copies) —
   `core/skills/_shared/fgos-cli-fallback.md:16` (`FGOS_BIN="...
   /bin/fgos.mjs"`). Line `:4` and `:22` are prose/error-message comments.
   Resolver: inline `FGOS_NESTED_PREFIX`/`CLAUDE_PROJECT_DIR` composition, no
   shared resolver module (same shell-side gap as #1).
9. `package.json` `bin.fgos` — `package.json:10` (`"fgos": "bin/fgos.mjs"`).
   `package.json:29` (`"cli": "node bin/fgos.mjs"`, the `npm run cli` script)
   is a tenth textual hit in this same file, included in scope here (both
   lines are in the file R3 already names) but not one of the nine
   inventoried call sites per `legacy-cli-transition.md` §2's own list (which
   names only `package.json` `bin`).
10. `scripts/herdr-cockpit-notify.mjs:45` — `spawnSync(process.execPath,
    [path.join(repoRoot, 'bin', 'fgos.mjs'), 'list', '--all', '--json'], ...)`.
    Not a comment, not under `test/`; `scripts/` is inside `package.json`
    `files` (`:13-24`) so it ships in the legacy payload. Resolver: none
    (hardcoded `path.join`). **P10's tier-0 resolver work (`plan.md` Goal 6,
    `:64-66`) and its Product Gate exit (`plan.md:160`) must account for this
    caller or it is left on the hardcoded path after cutover.**
11. `scripts/knowledge-canary.mjs:23` — `path.resolve(...,'bin',
    'fgos.mjs')`, `execSync`'d four times (`:27,:31,:42` and one more).
    Outside `test/`, so the "~75 Node tests are fixtures" carve-out below
    does not cover it by name; classified here as fixture-class (a canary
    script exercising the Node payload's own behavior, same rationale as the
    test fixtures) but flagged since it was not previously named explicitly.
12. `plugins/fgOS/skills/terminal/rename.sh:51-52` — `[ -f
    "$project_root/bin/fgos.mjs" ] || exit 0` then `node
    "$project_root/bin/fgos.mjs" tool query --capability pane-labeling ...`.
    Fail-closed capability probe, not under `test/`. Resolver: none (inline
    file-existence check). Same P10 accounting note as #10 applies.

**~75 Node tests spawning `bin/fgos.mjs` directly confirmed as fixtures, not
callers to migrate** — per `legacy-cli-transition.md` §2's own statement
("The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are —
they test the Node payload's behavior with the Node payload"); this track
does not enumerate or touch them.

## R4 — Packaging interface fields confirmed

`docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5
("ReleaseManifest"), read directly (lines 270–405):

- `entries.fgos` / `entries.fgosRunner` — confirmed, minimum-fields example
  at `:306-309` (`"entries": {"fgos": "bin/fgos", "fgosRunner":
  "bin/fgos-runner"}`).
- `components.legacyNode.{root,entry,digest}` — confirmed at `:310-315`
  (`"root": "libexec/legacy-node", "entry": "bin/fgos.mjs", "digest":
  "sha256:..."`); narrative at `:344` confirms the Rust host resolves
  `join(activeReleasePath, root, entry)` and nothing else.
- `artifactDigest` formula — confirmed at `:281-286`: `fileDigest =
  sha256(file bytes as emitted by the release build)`; `artifactDigest =
  sha256(canonical-json(release tree manifest without artifactDigest))`. The
  release build (not the installer) owns byte normalization.
- Release Tree Canonicalization table — confirmed at `:350-363`: path root
  relative only, `/` separator always, UTF-8 NFC normalization, lexicographic
  byte order, case-collision refusal, SHA-256 file digest, line endings
  included in bytes, executable bit as `mode`, directories not hashed
  separately, **symlinks refused in V1** (explicit `kind: "symlink"` deferred),
  mtime/owner/group excluded from identity, archive digest optional/never
  identity.
- `distribution.build.show` owner = `fgos-distribution`
  (`packages/distribution/rust`) — confirmed, matches `plan.md`'s Decisions
  table row and kernel §9 (no separate citation needed; kernel doc already
  read for R1).

## R5 — Ownership-header wording for `bin/fgos.mjs` (recorded, not applied)

Per `docs/architect/host-invocation-routing/legacy-cli-transition.md` §2
(`:37`): *"`package.json` `bin.fgos` is removed (or pointed at the workspace
shim) when the Rust host becomes the installed default; `bin.fgos-runner`
stays until the runner migrates. A header in `bin/fgos.mjs` and the root
`AGENTS.md` state the ownership rule for editors already at that path."*

Exact ownership rule content to state (derived from §2's three-row table at
`:27-31` and the identity-rename sentence at `:33`): **"This file is the
`legacy-node` payload entry, staged whole under a release's
`components.legacyNode.root` and exec'd by the Rust host at
`components.legacyNode.entry` — never relocated, never renamed in the source
tree. The Rust host resolves this file only through the release manifest's
`components.legacyNode` fields, never PATH, never cwd, never hardcoded
outside the manifest. This does not mean this file becomes unreachable any
other way: `plan.md` (`:21-22`) keeps the global npm `bin.fgos` as a
compatibility channel, and `legacy-cli-transition.md` (`:39`) keeps `node
bin/fgos.mjs` as the fallback for a project that has not run `fgctl init` —
both call this same file directly, outside the Rust host's own manifest
resolution."** The corrected wording drops the earlier "reached only
through... never hardcoded outside the manifest" phrasing (which conflated
how the *Rust host* resolves the payload with the file's own reachability —
the two npm/fallback paths above call it directly, hardcoded, by design) and
scopes the "never PATH/never cwd/never hardcoded" claim to the Rust host's
own resolution mechanism only, matching `legacy-cli-transition.md:35`. P07
applies this header text (word-for-word or Lead-adjusted at that time) to
`bin/fgos.mjs` and adds the matching ownership note to the root `AGENTS.md`;
**not applied in this phase** (R8).

## R6 — Wave-2 lease overlap check

`plan.md` "Shared-File Lease Rule":

```
node-harness = test/rust-host/**, scripts/export-command-selectors.mjs,
               scripts/explain-command-route.mjs,
               packages/host-runtime/contracts/**

rust-workspace = Cargo.toml, Cargo.lock, rustfmt.toml, clippy.toml,
                  .gitignore, .github/workflows/ci.yml,
                  scripts/run-rust-dev-host.mjs

rust-kernel = packages/host-runtime/rust/**
```

No path prefix, glob, or exact filename is shared between `node-harness` and
`rust-workspace`/`rust-kernel`: `node-harness` roots under `test/rust-host/`,
two `scripts/*.mjs` script names, and `packages/host-runtime/contracts/`;
`rust-workspace` roots under repo-root config files and one different
`scripts/*.mjs` name; `rust-kernel` roots under
`packages/host-runtime/rust/` — a sibling directory of `contracts/` under the
same `packages/host-runtime/` parent, but a distinct subtree (no file path can
match both `packages/host-runtime/contracts/**` and
`packages/host-runtime/rust/**`). **No overlap found.** Wave 2 may run one
Node cell (P01) and one Rust cell (P04) concurrently as `plan.md`'s Parallel
Execution Map states.

**Lease map (full, beyond the wave-2 overlap check above):** `plan.md:150`
lists a "lease map" among P00's exit artifacts; the wave-2 overlap check
above is the only lease cross-reference this phase originally produced. Two
paths this track touches carry no lease entry in `plan.md`'s Shared-File
Lease Rule table (`:187-245`) at all: `src/cli/command-registry.mjs` (read by
P01's `scripts/export-command-selectors.mjs` generator but not itself listed
in any lease block — P01 should either add it to `node-harness` or note it as
read-only input) and `scripts/herdr-cockpit-notify.mjs` (item #10 above,
uninventoried by any lease — falls under no existing lease block; the Lead
should assign it a lease, most likely `resolver`, when P10 touches it).

## Verification (per phase-00 Verification section)

- `git diff --stat` — only this report file added under `reports/` (checked
  at cell close).
- `grep -c "^    name:" src/cli/command-registry.mjs` → 73, all 73 accounted
  for in R2's table.
- The nine-site `rg` command's every hit is either a listed R3 call site or
  explicitly marked comment/non-caller above — confirmed complete after this
  revision (the four previously-unaccounted hits are now listed at the top of
  R3).

## Revision note (post-review)

This report was revised after its own review + red-team pass
(`rust-host-r1-kernel--cell-01`, superseded by session
`rust-host-r1-kernel--p00` — see `docs/architect/agent-coordination/verification/rust-host-r1-kernel/p00.md`
for the full disposition). All 9 findings (1 HIGH, 4 MEDIUM, 4 LOW) from the
reviewer pass and both non-LOW findings from the red-team pass are accepted
and fixed in this revision; the 3 LOW/"not found" red-team findings needed no
change. No open, unaddressed finding remains.
