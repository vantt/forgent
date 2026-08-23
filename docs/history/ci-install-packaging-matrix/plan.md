# Plan: CI workflow for install-packaging matrix (tsk-49r)

Status: shaped, pending approval. See `CONTEXT.md` in this directory for
locked decisions D1-D5.

## Mode gate

**Mode: high-risk** (fuller map below, phased execution).

Flags counted (from `fgos-coding-planning`'s fixed checklist):

| Flag | Applies? | Why |
|---|---|---|
| external systems | yes | GitHub Actions becomes a new external dependency this repo relies on for its own safety net — nothing today depends on it. |
| cross-platform | yes | D3's OS matrix (ubuntu+macos+windows) turned out to need real code, not just config — see D5. |
| existing covered behavior | yes | `test/install-packaging.test.mjs`, an already-passing, already-relied-on proof, gets its internals modified (D5's win32 branching). |
| weak proof around the area | yes | This item's entire purpose (`docs/distribution-vision.md` §3) is replacing a local-only proof with CI-enforced proof — the area was already flagged weak. |
| auth / authorization / data model / audit-security / public contracts / multi-domain | no | none apply — single area (distribution/CI), no user data, no auth surface, no contract exposed to other consumers. |

4 flags → high-risk per the mode-gate table. A `standard` mode would not
honestly cover this: D5 (confirmed via real research, not guesswork) means
one of the three matrix legs needs actual new conditional logic in an
existing, already-relied-upon test file, with real failure risk if the
branching is wrong — that is exactly the kind of proof-carrying risk
`standard` mode is too thin for.

## Approach

**Chosen path:** three concrete pieces, in this order:

1. **`test/install-packaging.test.mjs`: add win32 path branching (D5).**
   Branch on `process.platform === 'win32'` for the two hardcoded paths:
   - package dir: posix `path.join(installPrefix, 'lib', 'node_modules', 'forgent')` vs win32 `path.join(installPrefix, 'node_modules', 'forgent')` (no `lib`).
   - binaries: posix `path.join(installPrefix, 'bin', 'fgos'/'fgos-runner')` vs win32 shims directly at `path.join(installPrefix, 'fgos.cmd'/'fgos-runner.cmd')` (npm places `.cmd`, extensionless, and `.ps1` shims at the prefix root on Windows, confirmed via research — see `CONTEXT.md` D5).
   - The executable-bit assertion (`fs.constants.S_IXUSR`) is POSIX-only; Windows has no exec bit on files the same way, so that specific assertion needs a win32 branch too (skip or replace with "file exists" on win32).
   This is the file already in the item's declared footprint — not a new
   file, not new scope, but real logic, not just CI wiring.

2. **New test: fresh-runner `fgos doctor` clean-run proof (D4).**
   Add `test/setup/doctor-fresh-run.test.mjs`, mirroring
   `install-packaging.test.mjs`'s existing real-process pattern (no
   mocks): pack → install -g into a scratch prefix → run `fgos init` in a
   fresh external tmp cwd → run `fgos setup` → run `fgos doctor` → assert
   every entry in the JSON output reports `passed: true` (or the CLI's
   overall exit code is 0, whichever `fgos doctor`'s existing output
   contract already gives — confirm the exact shape while implementing,
   not guessed here). Placed in `test/setup/` to match that directory's
   existing convention (`ansi.test.mjs`, `checks.test.mjs`,
   `config-merge.test.mjs`, `shell-rc.test.mjs` already live there).
   Putting this in a real `*.test.mjs` file (not a CI-only shell step)
   means D1 (full `npm test` per matrix cell) already covers it on every
   OS in D3 for free — no separate CI job needed.

3. **`.github/workflows/ci.yml`: the actual workflow.**
   Trigger on push + pull_request to `main`. One job, matrix
   `os: [ubuntu-latest, macos-latest, windows-latest]`. Steps: checkout,
   `actions/setup-node` (with `cache: npm`, node version matching
   `engines.node` — `>=18`, pin to a current LTS), `npm ci` (or
   `npm install` if no lockfile exists — confirmed: this repo has none
   today, so `npm install`), `npm test`. That single `npm test` step
   is what exercises pieces 1 and 2 above across every matrix cell —
   the workflow file itself stays thin.

**Alternatives rejected:**
- A bespoke CI-only script step for the doctor-fresh-run check (D4),
  separate from `npm test` — rejected because it would need its own
  per-OS scripting and wouldn't be enforced by `npm test` locally, unlike
  a real test file (matches this repo's own "real enforcement, not
  fixtures" pattern already stated in `install-packaging.test.mjs`'s
  header comment).
- Dropping windows or skipping packaging tests on windows — rejected;
  user chose real branching (D5) after seeing the concrete gap.
- Corepack for package-manager version pinning — rejected in `CONTEXT.md`
  D2 discussion: being removed from Node core distribution in v26.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `.github/workflows/ci.yml` (new) | low | Workflow YAML is valid and a real push triggers a green run — config-only, easy to eyeball. |
| `install-packaging.test.mjs` win32 branching (D5) | **high** | Must actually pass on a real `windows-latest` GitHub Actions runner, not just a local diff review — path-layout logic is easy to get subtly wrong (e.g. `.cmd` vs extensionless resolution, exec-bit assertion). |
| new `test/setup/doctor-fresh-run.test.mjs` (D4) | medium | Must actually pass on all three matrix OSes. Traced today (not guessed): `fgos setup`'s `installGitHooks` fill-only-writes `core.hooksPath=.githooks` for any git repo unconditionally (no-op-safe even without a local `.githooks/` folder existing), so `main-checkout-hook-wired` should report passed for an external test project too — but this needs confirming against real `fgos doctor` output, not just reading the source. `shell-integration-sourced` auto-passes when the runner has zero detected rc files, which may differ by OS/runner image — confirm actual behavior per OS rather than assume. |
| `package.json` | low | Item's footprint lists it defensively; no change identified as necessary yet beyond what already exists (`scripts.test` already runs the right glob). Pin as assumption — if `fgos-coding-implement` finds a real need (e.g. a lockfile, a `ci` script alias), it's a small addition, not a redesign. |

Impact-analysis gate checked (`fgos tool query --capability impact-analysis
--status present`): **full** (GitNexus registered and present). Low
relevance here — this item is CI/test/YAML wiring, not a graph of
callers/callees to trace; no proof point in this plan leans on blast-radius
evidence.

## Concrete cases to prove (per mode: high-risk gets the fuller sketch)

- Windows leg: package dir and both binaries actually found at their
  win32-real paths after a real `npm install -g --prefix`.
- Windows leg: the executable-bit assertion doesn't false-fail (needs its
  own win32 path, not just skipped silently — silently skipping a safety
  assertion is itself a regression risk worth naming, not glossing over).
- Doctor-fresh-run: a *genuinely* fresh external tmp cwd (never
  `fgos init`'d before) reaching all-`passed:true` after
  `init` → `setup` → `doctor`, on each of the three OSes.
  Boundary: what `doctor` reports on that same cwd
  *before* `fgos setup` runs — expected to show real (not bug) failures
  for `config-not-stale` etc. — should not be asserted as if it were a bug,
  since that's normal pre-setup state (RUL11 / distribution.md), not this
  item's concern to change.
- `.tgz` cleanup: existing `no stray pack artifact` test already covers
  this; the new doctor-fresh-run test must reuse the same
  `mkTemp`/cleanup discipline (`finally` blocks removing every scratch
  dir) so a matrix run across 3 OSes doesn't leave build-runner disk
  litter, matching the existing test's own care here.
- Concurrent matrix cells: each OS runs on its own isolated GitHub-hosted
  runner VM already — no shared-state risk between matrix legs to prove.

## Split decision

No split. `fgos graph tsk-49r --json` confirms this item is its own
isolated graph component (component size 1), not on the critical path, and
unblocks nothing else (`topUnblock` has no entry for it) — a single,
self-contained piece of work with one real footprint
(`.github/workflows/`, `test/install-packaging.test.mjs`,
`test/setup/doctor-fresh-run.test.mjs`, `package.json`). Proceeds as
itself.

## Execution note

Execute's own build/verify/return path is unchanged by this plan — it only
needs one real verify command per deliverable, named here:

- `npm test` (already exists) — proves pieces 1 and 2 (win32 branching +
  new doctor-fresh-run test) once the workflow actually runs them on every
  OS; also the same command a contributor runs locally on their own OS.
- No new verify command needed for piece 3 (the workflow file itself) —
  its own proof is a real green GitHub Actions run after push, which
  `fgos-coding-validating`/`fgos-coding-implement` can check via `gh run list`/`gh run
  view` once pushed.
