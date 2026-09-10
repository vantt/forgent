# Phase 14 — install.sh From GitHub Release

Depends on: Phase 11 closed and merged (needs a real `fgctl` binary and the
asset-naming decision). May run beside Phase 13 — disjoint leases, per
`plan.md`'s Parallel Execution Map.

## Objective

Ship `install.sh`, a POSIX `sh` script that installs the `fgctl` binary for
the current machine from a GitHub release (or a locally served override)
with no clone, no npm, and no Rust toolchain on the consumer machine, plus
its own end-to-end test and the README rewrite naming it as the primary
install path.

## Requirements

- R1: `install.sh` at repo root. POSIX `sh` only — no `[[`, arrays, or
  `function` keyword. `sh -n install.sh` is this cell's own syntax gate;
  `dash -n install.sh` is reviewer-side only when the reviewer's machine has
  `dash` (neither `dash` nor `shellcheck` is installed in this environment —
  confirmed).
- R2: Target detection via `uname -s`/`uname -m`, mapped to the target
  triple naming used by `fgos-<version>-<target>.tar.gz`/
  `fgctl-<version>-<target>.tar.gz` (Decisions table: only
  `x86_64-unknown-linux-gnu` ships from this track). Any other pair refuses
  with the short list of supported targets and exits non-zero — no
  best-effort guess. `FGCTL_TARGET` overrides detection (used by the
  unsupported-target test case and by adding a future target without
  touching detection logic).
- R3: Version resolution: default `FGCTL_VERSION` resolves the latest tag by
  following the redirect from `https://github.com/vantt/forgent/releases/
  latest` to its final `.../releases/tag/<tag>` location (`curl -fsSL -o
  /dev/null -w '%{url_effective}' <url>`, with a `wget`-based redirect
  fallback when `curl` is absent) — no GitHub API call, so no JSON parsing
  in `sh` and no unauthenticated rate-limit exposure. An explicit
  `FGCTL_VERSION=<tag>` skips this resolution entirely.
- R4: Download `fgctl-<version>-<target>.tar.gz` and `SHA256SUMS` from
  `${FGCTL_ASSET_BASE_URL:-https://github.com/vantt/forgent/releases/
  download/<resolved-tag>}` with `curl` (fallback `wget`); verify with
  `sha256sum -c --ignore-missing` (fallback `shasum -a 256 -c` when
  `sha256sum` is absent) against the tarball's own line in `SHA256SUMS`.
  Any download or checksum failure aborts before extraction — nothing under
  `$FGCTL_INSTALL_DIR` is touched.
- R5: Extract to a fresh temp directory, then install `fgctl` to
  `${FGCTL_INSTALL_DIR:-$HOME/.local/bin}/fgctl` by writing a temp file in
  that same directory and `mv`-ing it into place (atomic replace, matching
  the atomicity discipline this track uses elsewhere for activation writes).
- R6: Refuse to run as root (`id -u` = `0`) unless `FGCTL_ALLOW_ROOT=1`.
  Never edit a shell rc file; when `$FGCTL_INSTALL_DIR` is not on `PATH`,
  print the exact line to add and let the person decide. Print `fgctl init`
  as the next step on success.
- R7: `test/install/install-sh.test.mjs` (Node): starts a `node:http` server
  on `127.0.0.1` serving a fixture `fgctl-<version>-<target>.tar.gz`
  (containing a tiny fake `fgctl` shell script that prints a marker) plus a
  correct `SHA256SUMS`; runs `sh install.sh` with `FGCTL_ASSET_BASE_URL`
  pointed at that server and `FGCTL_INSTALL_DIR`/`HOME` pointed at temp
  dirs, first with an explicit `FGCTL_VERSION` (exercising R4 alone), then a
  second time omitting it against a server that also serves a
  `/releases/latest`-style redirect (exercising R3's resolution). Asserts
  the installed file runs and prints the marker in both cases. A third case
  tampers one byte of the served tarball and asserts non-zero exit with
  nothing installed. A fourth case sets `FGCTL_TARGET` to an unsupported
  value and asserts the refusal message names it.
- R8: `README.md`'s `## Install` section is rewritten: the
  `curl -fsSL https://raw.githubusercontent.com/vantt/forgent/main/
  install.sh | sh` line first, then `fgctl init`, then the existing
  `npm install -g github:vantt/forgent#v0.1.0` path kept as the documented
  compatibility channel (not removed — Node compatibility window decision),
  with one sentence saying why it still exists.

## Files

Likely touch:

- `install.sh` (new)
- `test/install/install-sh.test.mjs` (new, with its fixture tarball built by
  a helper in the test file — never a checked-in binary fixture)
- `README.md` (`## Install` section only)

Do not touch:

- `test/install-packaging.test.mjs` (existing npm-pack e2e proof — must keep
  passing unmodified)
- `package.json`
- any `apps/**`/`packages/**` Rust source, `scripts/build-rust-
  distribution.mjs`

## Verification

```sh
sh -n install.sh
node --test test/install/install-sh.test.mjs
```

- `sh -n install.sh` parses clean.
- All four `install-sh.test.mjs` cases pass.
- `git diff --stat test/install-packaging.test.mjs` is empty.
- `README.md`'s `## Install` section leads with the `curl | sh` line; the
  npm path remains present below it.
- Capability annotation for this cell: `code:implement`.
