# CONTEXT: CI workflow for install-packaging matrix (tsk-49r)

## Feature boundary

Add `.github/workflows/` — a GitHub Actions CI workflow that runs this
repo's own test suite (which includes `test/install-packaging.test.mjs`,
the real e2e proof of `npm pack -> npm install -g -> fgos init`) across an
OS matrix, plus a fresh-runner `fgos doctor` clean-run check. Purely a CI
layer: no change to `install-packaging.test.mjs`'s existing behavior, no
change to `src/setup/*`, no change to the documented install command in
`README.md`.

This is `tsk-3nx`'s (goalTier milestone) sole target — Phase 0 of
`docs/distribution-vision.md` §6's rollout, chosen to land first because
it is independent of every other milestone and gives a safety net before
later phases touch `src/setup/*`.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | CI workflow runs the full `npm test` suite (1980 tests, ~2min, includes `install-packaging.test.mjs`) per matrix cell — not `install-packaging.test.mjs` in isolation. |
| D2 | Package-manager scope is **npm only** — no pnpm/yarn matrix axis. |
| D3 | OS matrix is **ubuntu + macos + windows** (all three). |
| D4 | Workflow also adds a **fresh-runner `fgos doctor` clean-run check**, settling `docs/distribution-vision.md` §5 open question 4 in this item rather than deferring it. |
| D5 | `install-packaging.test.mjs` gets real **OS-conditional (`process.platform`) path-resolution branching**, so the windows-latest matrix leg (D3) actually passes instead of failing on wrong path assumptions. Locked mid-planning (`fgos-coding-planning`), see rationale below. |

## Rationale / scout evidence

- **No `.github/workflows/` exists today** (confirmed: directory absent).
  `test/install-packaging.test.mjs` is the only local proof of the
  packaging/install surface (`docs/distribution-vision.md` §3).
- **`test/install-packaging.test.mjs`** (read in full) hardcodes real
  `npm` process calls (`execFileSync('npm', ['pack', ...])`,
  `spawnSync('npm', ['install', '-g', ...])`) — no pnpm/yarn support
  exists in the test today. The item's own original description
  mentioned an npm/pnpm/yarn matrix, but making pnpm/yarn real would mean
  rewriting the test — a scope expansion the item's own framing
  ("thuần thêm lớp kiểm tự động", no behavior change) argues against.
- **`package.json`** (read in full) has **zero** `dependencies` and
  **zero** `devDependencies`. pnpm's disk-saving mechanism (single
  content-addressable store, symlinked `node_modules`) has no
  overlap-across-projects benefit to offer when a project installs
  nothing — the benefit that motivated considering pnpm doesn't apply to
  this repo.
- **`README.md`** (`## Install` section, read in full) documents
  `npm install -g github:vantt/forgent` as the literal end-user install
  command. `install-packaging.test.mjs` proves exactly that command.
  Nothing prevents an end user from already running
  `pnpm install -g github:vantt/forgent` themselves today — this
  decision is about what *this repo's own CI/tests* exercise, not about
  restricting end-user choice.
- **Corepack** (Node's own package-manager-version-management tool) is
  being removed from Node core distribution starting Node v26 (Node TSC
  vote, per Socket.dev coverage, checked 2026-08-01) — not a safe
  long-term base to build new multi-package-manager CI on.
  `actions/setup-node` already natively supports
  `cache: npm|yarn|pnpm` if a package-manager axis is ever added later;
  no separate tool fills a real gap for this item.
- **Repo confirmed PUBLIC** (`gh repo view vantt/forgent` ->
  `"visibility":"PUBLIC"`, checked 2026-08-01). GitHub Actions'
  OS-runner-cost multiplier (2x windows, 10x macos against included
  minutes) only applies to private repos — public repos get unlimited
  minutes on standard runners regardless of OS. The item's original
  "if runner cost acceptable" hedge on macOS/Windows is resolved: cost is
  not a constraint.
- **Full suite timing measured directly**: `npm test` (1980 tests) took
  ~119.5s wall clock in this environment — cheap enough to run per matrix
  cell rather than isolating just the packaging test.
- **Impact-analysis gate** (`fgos tool query --capability impact-analysis
  --status present`): GitNexus registered and `present` → `full`. Limited
  relevance here since this item is CI/YAML wiring, not a symbol edit.
- **No prior `judgeDiscovery` verdicts** existed for this item
  (`view.discovery["tsk-49r"]` was empty) — nothing to reconcile against.

## D5 rationale (mid-planning gap, locked during fgos-coding-planning)

- **Confirmed via research** (not assumption): Windows `npm install -g
  --prefix <dir>` places the installed package directly under
  `<dir>/` + a dependency folder (no `lib` subfolder the way Unix does),
  and drops executable shims (`.cmd`, extensionless, `.ps1`) directly in
  `<dir>/`, never in a `bin/` subfolder. macOS follows the same layout as
  Linux/Unix (unaffected).
- `install-packaging.test.mjs`'s current assertions
  (`path.join(installPrefix, 'lib', 'node_modules', 'forgent')`,
  `path.join(installPrefix, 'bin', 'fgos')`) are Unix-only and will fail
  immediately on a windows-latest runner without this branching — not a
  hypothetical, a structural mismatch.
- This surfaced only after `fgos-coding-exploring`'s D3 (OS matrix) was already
  locked — a genuine mid-planning gap under `fgos-coding-planning`'s own
  material/grounded/answerable filter, not a re-litigation of D3 itself.
  User chose to add the real branching rather than drop windows from the
  matrix or skip the packaging/doctor tests on windows.

## Pinned terms

- **"CI workflow" (this item)** = a `.github/workflows/*.yml` file running
  `npm test` (which includes `install-packaging.test.mjs`) across the
  OS matrix in D3, plus the `fgos doctor` clean-run check from D4. It is
  NOT a package-manager-matrix workflow (see D2) and NOT a change to
  `install-packaging.test.mjs`'s own test logic.
- **"fresh-runner `doctor` clean-run check" (D4)** = a workflow step that
  runs `fgos doctor` (or the equivalent install+init+doctor sequence) on
  a brand-new CI runner that has never had fgOS installed, asserting it
  reports clean/passing — distinct from `install-packaging.test.mjs`'s
  own proof, which stops at `fgos init`.

## Canonical references

- `docs/distribution-vision.md` §2 pillar 7, §3, §5 open question 4, §6
  (milestone `tsk-3nx` / target `tsk-49r`), §7.
- `docs/specs/distribution.md` (`repo/test/install-packaging.test.mjs`
  entry).
- `test/install-packaging.test.mjs` (current test, unchanged by this
  item).
- `README.md` `## Install` section.
- `package.json` (`scripts.test`, no dependencies).
- `src/setup/checks.mjs` (`DOCTOR_CHECKS` registry — what "clean" means
  for the D4 fresh-runner check).

## Outstanding questions deferred to planning

- Exact GitHub Actions workflow file name/trigger (push/PR/both) —
  implementation detail, belongs to `fgos-coding-planning`.
- Whether the D4 doctor check runs as a separate job/step from the main
  test matrix, or as an additional step within each matrix cell —
  implementation detail, belongs to `fgos-coding-planning`.
- Caching strategy (`actions/setup-node`'s `cache: npm`) — implementation
  detail, belongs to `fgos-coding-planning`.
