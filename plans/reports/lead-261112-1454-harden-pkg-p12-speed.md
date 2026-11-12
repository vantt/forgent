# Packaging P12: speed (no-op re-runs, download cap, release profile)

Branch `harden/pkg-p12-speed`, on origin/main `f2c4d6dd8`. Phase: `plans/261109-1617-harden-packaging-distribution/phase-12-speed.md`.

## What changed

- **Tail shape** (`packages/distribution/rust/src/init.rs`, `run_tail`). OPC and the big lead chose this shape over a first version that skipped `fgos init` on a no-op: `fgos init` (settles an interrupted Git operation, detects agent CLIs, migrates a legacy config, creates the machine id, lock dirs and header files) always runs, because no doctor fix covers that work and `repair` after a crash expects it. Then one `fgos doctor --json`. If `doctor_is_clean` (ok, and no `warn` or `fail` row names a `fix`; fail closed on anything that is not a doctor result), the closing block is built from that result and the run stops, with no `doctor --fix` and no second doctor. Otherwise `doctor --fix`, a second `doctor --json`, and the closing block, as before. When the outcome is `AlreadyCurrent` (init or upgrade of the release already active) and the doctor is clean, the first line is `nothing to do: fgOS <tag> already active, doctor ok` followed by the `Next:` line. `repair` re-publishes and `init` of a new release is an activation, so both print `Ready: ...`. `TailOutcome` is unchanged; the earlier `is_noop` and `Activated { previous }` were deleted. Kept: P06 closing block and exit 2, P10 `read_tracked_pin` and exit 4, the drift row inside doctor.
- **Download cap** (`fetch.rs` `CURL_ARGS`, `install.sh`): `--speed-limit 1024 --speed-time 30 --max-time 900` replaces `--max-time 120`; connect timeout unchanged; the wget backstop wrapper is `timeout 910`; a comment in each file names the other.
- **Release profile**: measured, not taken. `Cargo.toml` is unchanged.

## Before and after

Scratch HOME, a git project, a release tree built from the same source, PATH holding only `node` and `fgctl`, so doctor is ok. Same machine (fg-server2, 24 cores, load 15 to 34 during the final runs), baseline and new fgctl interleaved. "Before" is the fgctl built from origin/main before the change. "fgos init" cost is the after time minus the doctor-alone time of the same run.

| Command (nothing to do) | Before | After |
|---|---|---|
| `fgctl init` (first activation) | 7.4 to 8.2 s | 8.5 to 11.2 s on a loaded machine; one fewer doctor run when the doctor is clean |
| `fgctl init` again | 6.7 to 9.6 s | 3.3 to 4.4 s |
| `fgctl upgrade` same digest | 6.8 to 8.4 s (also replaced fgctl with the tree's own) | 3.4 to 4.6 s |
| `fgctl repair` (re-publishes, runs init, prints Ready) | 7.5 to 8.5 s | 3.8 to 4.8 s |
| `fgos doctor --json` alone | 3.1 to 3.5 s | 3.2 to 3.9 s |
| `fgos init` inside the tail (after minus doctor) | n/a | about 0.2 to 0.9 s |
| `fgctl verify` | 0.1 s | 0.1 s |

Target at most 4.5 s: met on 5 of 6 runs; 4.6 and 4.8 s occurred on the run where doctor alone took 3.9 s (load), so the tail is doctor plus about 0.2 to 0.9 s for `fgos init`. Before the change a no-op ran init, `doctor --fix` and doctor: about two to three doctor-class runs.

| Release profile (`cargo build --locked --release --workspace`, cold target, same load class) | No LTO (today) | `lto = "thin"`, `codegen-units = 1` |
|---|---|---|
| build time | 43 s (twice) | 101 to 107 s (2.35x) |
| native addon | 16.79 MB | 14.77 MB |
| `fgos` host | 20.28 MB | 17.86 MB |
| `fgctl` | 3.85 MB | 3.44 MB |
| no-op init (first shape of the tail, 2 runs each) | 3.1 to 3.4 s | 3.0 to 3.1 s (4.6 on a load spike) |

Decision: revert. The build is above the "about 2x" bound and the start-up numbers do not move (doctor time is Node-bound), so the 12 percent smaller addon does not pay for a build that is 2.35x slower on every CI matrix leg including Windows. If the addon size matters later, `lto = "thin"` alone is the next thing to measure.

## Proof

- Rust unit tests (`init.rs`, `fetch.rs`): `doctor_is_clean` (ok with an `ok`, `warn` without fix, or `skip` row with a fix is clean; a `warn` row with a fix, `ok: false` or non-JSON is not), `noop_block` wording, `CURL_ARGS` carries the stall flags and `--max-time 900`, no `--max-time 120` (this one failed first on the old args).
- `test/rust-host/closing-block.test.mjs`: the payload logs each call. A first init with a clean doctor logs `init`, `doctor --json`; `init` and `upgrade` reruns log the same and print the nothing-to-do block, transaction `complete`; `repair` prints `Ready:` after `init`, `doctor --json`. A doctor with a `warn` row that names a fix logs `init`, `doctor --json`, `doctor --fix`, `doctor --json` and still prints `Ready: already up to date`.
- `test/install/install-sh.test.mjs` Case 6 asserts the stall flags and `--max-time 900`; the fake curl swallows the two new option arguments.
- Timing is measured here, not asserted in CI.

Gates: see the end of this file.

## Coordination

- The legacy-config migration lead's upgrade tail does not touch `init.rs` on its branch today. A legacy JSON config fails doctor (`ec68b605f`), and an rc.5 upgrade has a different digest, so neither can be skipped by the no-op. Whoever lands second rebases; the census was regenerated, not merged, during my rebase.
- Not touched: Work code, P07 files, T9 P32 files.

## Net size

7 files plus this report, +178 / -25 (`git diff --numstat origin/main`): `init.rs` +88/-6 (about 25 are unit tests), `fetch.rs` +20/-4, `install.sh` +8/-4, `closing-block.test.mjs` +51/-2, `install-sh.test.mjs` +3/-2, `CHANGELOG.md` +1, census +7/-7 (regenerated). The phase estimate was Rust +30, shell +3, toml +2, tests +25: Rust production is about +60 (the probe branch, `doctor_is_clean`, `noop_block`, and the comments naming what `fgos init` does); no toml change because the profile was not taken.

## Gates

- `cargo fmt --all --check`, `cargo clippy -p fgos-distribution -p fgctl --all-targets -- -D warnings`, `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (only a vendored `arraydeque` lifetime warning), `cargo test -p fgos-distribution -p fgctl`: pass.
- `node scripts/run-tests.mjs test/rust-host/*.test.mjs test/install/*.test.mjs`: 193 tests, 192 pass, 0 fail. Architecture, doc-health: pass. Census regenerated, never merged.
- Full `npm test` (log `/dev/shm/pkg-p12/full2-154626.log`): 8840 tests, 8807 pass, 2 fail, both known reds (V7n addendum, citation drift on `document-identity/spec.md`); one `ERROR` text match, a passing test title (`RECOVERY declares an entry for every ERROR_CLASSES member`), no run-tests ERROR line. The suite ran on the commit before the final rebase; the rebase only moved the census and CHANGELOG.
- OPC: MERGE on `d428f25d5` (CHANGES on the first shape, which skipped `fgos init`; that shape was replaced).

## Authority

- The question "is this release already active" stays with the callers' digest comparison (`AlreadyCurrent`); `run_tail` only prints it.
- The question "is the machine healthy" stays with `fgos doctor`; the no-op reads its `ok` and per-row `fix` and does not re-derive it. The rule "a warn row naming a fix means work remains" lives in `doctor_is_clean`, in the distribution layer, over the doctor contract fields (`status`, `fix`); if doctor ever reports "repairable" as its own field, this should read that field instead.
- The two download caps (Rust and shell) are one decision held in two files, cross-referenced by comment; a single source would need the install script to read fgctl, which does not exist at that point, so two files stay.

## Lessons

- A doctor-ok scratch HOME needs agent trust files, `claude.json` trust, and a launcher on PATH; budget the first hour of any timing phase for building that fixture, not for the code.
- `scripts/run-tests.mjs` does not rebuild `fgctl`; a test against a stale release binary fails in a way that looks like a logic error. Rebuild with `cargo build --release --workspace` before a rust-host run.
- Measuring on a shared machine: interleave before and after runs and quote doctor-alone beside every row, otherwise load noise (3 to 14 s) hides the change.
- The census guard fires on any staged Rust file under the distribution package; run `--write-census` before the first commit, and after a rebase regenerate rather than merge.
