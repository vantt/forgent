# Report — fgctl/install/CI Phase Files (P11–P15)

Wrote the five phase files for `plans/260910-1700-rust-host-r1-kernel/`:
`phase-11-fgctl-crate-and-release-store.md`,
`phase-12-fgctl-init-and-activation.md`,
`phase-13-fgctl-upgrade-repair-rollback.md`,
`phase-14-install-script.md`,
`phase-15-ci-release-and-external-consumer.md`. Docs only; no code, no
commits, no other file in the track dir touched.

## Sources read and paths verified

- `plan.md` in full (Decisions table rows 11-14, Product Gates P11-P15,
  Shared-File Lease Rule `fgctl`/`install`/`ci`, Non-Negotiable Boundaries).
- `phase-09-release-tree-builder-and-doctor.md`,
  `phase-10-tier-zero-resolver.md`, `phase-08-native-version.md`,
  `phase-04-cargo-workspace-skeleton.md`, `phase-00-inventory-and-inputs-
  freeze.md` (format, existing `distribution.build.show` field shape,
  workspace-skeleton CI job placement).
- `docs/architect/packaging-distribution/runtime-identity-and-activation.md`
  §§1-15 in full, `README.md` §§1-7, and
  `docs/architect/workspace-topology.md` §4 — cited by section number
  throughout the five files.
- Ground truth, verified live rather than assumed: `.github/workflows/
  ci.yml` (existing `test`/`herdr-plugin` jobs, "no third-party actions"
  comment); `README.md`'s `## Install` section (current npm-only content);
  `test/install-packaging.test.mjs` (must keep passing, named explicitly as
  Do-Not-Touch in P14); `src/runner/main-checkout-lock.mjs` (full read —
  `acquireMainCheckoutLock` API, `DEFAULT_TTL_MS = 3*60*1000`, `isPidAlive`
  EPERM-is-alive semantics, `{pid, ts}` on-disk shape) — cited in P12 R5 as
  the rule to reuse, not reinvent; `bin/fgos.mjs` (`case 'ready'` at line
  2844, confirms the byte-parity test target in P12); `package.json`
  (`version: "0.1.0"`, `dependencies: {yaml}` only — no `tar` package,
  which is why P11 R7 picks Rust `tar`+`flate2` crates instead of shelling
  out).

## Mechanisms chosen (and why)

- **tar handling in `fgctl`**: pure-Rust `tar` + `flate2` crates rather than
  shelling out to a system `tar` binary — `fgctl`'s own consumer machines
  (via `install.sh`) are not guaranteed to have `tar`, so the binary must
  stay self-contained (P11 R7).
- **install.sh version resolution**: follow the redirect of `https://
  github.com/vantt/forgent/releases/latest` to its `.../tag/<tag>` location
  via `curl -w '%{url_effective}'`, rather than calling the GitHub API —
  avoids JSON parsing in POSIX `sh` and unauthenticated rate-limit exposure
  for a script many machines will run (P14 R3).
- **YAML syntax check for P15**: verified live in this environment that the
  repo's own `yaml` npm dependency (`package.json` already depends on it)
  parses `.github/workflows/ci.yml` today via `node -e
  "require('yaml').parse(...)"` — chosen as the primary check since it
  needs no new tool. `python3 -c "import yaml"` (pyyaml, confirmed present)
  is the secondary fallback; `ruby` is confirmed NOT installed, so it is
  named explicitly as unavailable rather than as a fallback.
- **Rust host's `.fgos/main-checkout.lock` liveness check (P12 R5)**: since
  `fgctl`/`apps/fgos` are Rust and cannot import the Node module, the
  requirement pins the exact rule to mirror — file shape `{pid, ts}`,
  numeric-pid liveness probe mirroring `isPidAlive`, string-identity
  freshness against the exact exported `DEFAULT_TTL_MS` constant value —
  rather than restating "reuse the logic" vaguely, so review can catch
  drift between the two independent implementations.
- **Rust host runtime-identity resolution (P12 R10)**: reuses P12 R1's own
  git-common-dir walk from cwd rather than inventing a second resolution
  algorithm, and defines `host: "dev-source"` purely by absence of a
  resolvable `activation.json" — matches the walking-skeleton doc's "never
  errors" requirement.

## Doubts / unresolved for the Lead or reviewer

1. P08's exact hashing crate for `data_hash` isn't named in `phase-08-
   native-version.md`'s text (only "sha256 hex"); P11 R7 says to reuse
   whichever crate P08 pins rather than re-guessing a name — the Doer must
   check P08's actual `Cargo.toml` diff once merged.
2. The exact job id/name the Phase 04 cell gives its new workspace-cargo CI
   job isn't fixed in `phase-04-cargo-workspace-skeleton.md` (only its
   steps are specified). P15 R3 refers to it by role ("the workspace cargo
   job Phase 04 added") rather than a guessed id — the Doer should confirm
   the real job key once Phase 04 is merged before writing "after: <job>".
3. P13's R1 refusal for a state-schema-incompatible *write* target
   currently refuses the upgrade outright rather than offering the `--read-
   only` activation path §11 mentions as a future option — this matches
   the team-lead brief's explicit instruction to "implement the refusal,
   mention read-only as deferred", not an independent scope call.
4. `install.sh`'s wget-based redirect-resolution fallback (P14 R3) is
   specified as a requirement ("a wget-based redirect fallback") without
   pinning exact `wget` flags, since the flag choice doesn't change what
   R7's test asserts (end-to-end behavior against a local fixture server,
   not the exact commands used) — left to the Doer's implementation
   choice, checkable by the same test either way.

## Verification of this cell's own scope

- `git status --porcelain` on the track dir shows only the five new files
  as untracked additions; `plan.md` and the phase-11→phase-16 rename
  visible in the working tree are pre-existing/concurrent changes from
  other teammates in this shared checkout, not made by this cell.
- Line counts: 120 / 140 / 90 / 100 / 108 (all within the 80-140 bound).
- `grep -n "OperationKey\|ProviderResponse\|ProviderCall\|LegacyCliRequest\
  |EncodedMessage"` across all five files returns nothing.
- `grep -n "setup"` across all five files returns only two hits, both
  inside the file path `src/setup/bin-discovery.mjs`.
- All five files carry `Capability annotation for this cell: code:implement`
  and a `Depends on:` line matching the plan's dependency chain
  (P11←P10, P12←P11, P13←P12, P14←P11, P15←P13+P14).

Status: DONE
Summary: Authored phase-11 through phase-15 for the fgctl/install/CI lane, grounded in the runtime-identity-and-activation contract, workspace-topology §4, and live repo ground truth (CI, README, install-packaging test, main-checkout-lock module); all five pass the track's line-count, alias-ban, and wording constraints.
Concerns/Blockers: None blocking. Three doubts noted above are informational for the Doer/reviewer once earlier cells (P04, P08) are actually merged, not open questions this cell needed to resolve.
