# HARDEN packaging: an upgrade from a JSON-era release migrates its config

Branch `harden/pkg-upgrade-migrates-legacy-config`. Release-gate item: a user on `v0.2.0-rc.5` runs the candidate's `fgctl upgrade`.

## Cause (two bugs, one symptom)

1. `fgos init` read config (event store) before anything moved rc.5's `~/.fgos/config.json`, which holds `gateway.token`. The Config door refuses that key there (`config-key-in-wrong-file`), so the tail's first step failed with exit 1 and the user was left to run three Config verbs by hand. After P06 the same init next stopped on the project file (`config-legacy-shadowed`).
2. `fgos doctor --fix` applied `create-machine-files` before `copy-to-destination` (contract order). On an rc.5 machine with no `private/gateway-token` it generated a new token, the copy then found a different destination and skipped, so the user's token was lost and `config-key-in-wrong-file` stayed red as `destination-different`. Found by the live reproduction; it was not in the brief.

## Change

- `fgos init` (`src/verbs/state/init.mjs`, new `src/verbs/state/settle-legacy-config.mjs`): before its first config read it asks the door's `check` what is legacy, then runs the Config spec section 13 steps through the existing doors, each only while the check still reports it: `copy-to-destination` (addon `fix`), `config migrate --global --finish`, `--global --convert`, then `config migrate` for the project (host verbs). No second migration, no new Rust surface. Idempotent: a second init finds nothing and changes no byte.
- A private token or account pool that differs from the old global file's: init refuses with `config-migrate-destination-differs`, nothing written (no silent token swap). The project migration does not pass `--accept-machine-overrides`; a project value overridden by this machine's global file stops init with the listed paths.
- Where the write verbs cannot run (Windows: `config-platform-unsupported`) the settle does nothing.
- `doctor-rows.v1.json` `fixes` and `repair.rs` `FIXES`: `copy-to-destination` before `create-machine-files`; the contract's `about` says the list is the apply order.
- The legacy JSON reader is untouched (the doctor still reads legacy files, the migration reads them).
- Spec section 13 and the decision history, CHANGELOG line, architecture manifest row, census regenerated.

## Proof

- Red then green: `test/setup/config-checks.test.mjs` (doctor fixes in registered order keep the legacy token; was red with the generated token).
- Wiring: `test/verbs/settle-legacy-config.test.mjs`: real `fgos init` on a legacy global plus project JSON: token equals the old one, mode 0600, no output carries it, no legacy row or misplaced-key row left, `gateBypass.level` (`light`), `ironLaw.level` and `gateway.port` effective values kept, second init changes no byte; and the differing-token refusal writes nothing.
- Live, real assets: rc.5 installed from its release assets into a scratch HOME (`fgctl init --from` rc.5 tarball; it wrote `gateway.port`, `gateway.token`, `bin.globalFgosPath` and a project `config.json`), then the candidate `fgctl upgrade --from` a release packaged from this branch (with P11's two trust-row commit cherry-picked locally, not pushed, because a clean runner needs those rows): exit 0, `Ready: fgOS active`, activation moved, `~/.fgos/private/gateway-token` is the rc.5 token (compared with the global backup, value not printed) mode 600, both `config.json` are tombstones with `config.yaml` beside them and backups under `~/.fgos/private/config-migrate` and `.fgos/runtime/config-migrate`, `fgos config show --json` keeps `gateBypass.level` and `ironLaw.level`, the tail's `doctor` has no config row failing. Without the two P11 rows the same upgrade exits 2 on exactly `trust-store-readable` and `agent-cli-project-trusted` and nothing config related.
- Before the change, same scratch: exit 1 `event-store-config: config-key-in-wrong-file global:config.json:4:5 gateway.token`.
- Gates run: `cargo fmt --check`, `cargo clippy -p fgos-config -p fgos --all-targets -D warnings`, `cargo test -p fgos-config`, `cargo test -p fgos` green; `cargo check -p fgos-config` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` green; focused Node set (settle, config-checks, config-door, facade, registrations, fgctl-upgrade, fgctl-init, architecture, doc-health, config-fixture) green. Full `npm test` is the landing step.
- Known red not mine: `check-decision-citation-drift` reports five findings in `docs/platform/documentation/subcomponents/document-identity/spec.md` on main.

## Decisions taken (owner can overturn)

- The init or upgrade of a Config-era release asserts the spec's machine check (`--machine-checked`). Evidence: rc.5 predates the Config crate; owner 11-09 said machines upgrade together; the older release on the same home would read the tombstone and refuse loudly without writing (spec, tombstone rule); backups hold everything. Cost: another project on the same machine still pinned to rc.5 refuses until it is upgraded; the CHANGELOG line says so.
- No `--accept-machine-overrides` by default, so a changed effective value is never silent. Rare path; init stops with the list.

## Authority

- The order of the four migration steps and the assertion of the machine check live in the init use case (`settle-legacy-config.mjs`); the steps themselves, their checks, backups and refusals are Config's. If a second caller appears, the order belongs in one Config verb (`config migrate --all`); one caller does not pay for a new verb and a projector change now.
- The doctor fix order was held implicitly by the contract list; it is now stated there and proved by a test.

## Lessons

- A repro against the real previous release asset found a second bug (fix order) that reading the brief and the code did not.
- Running the candidate's own `fgctl` matters: the previous release's installed `fgctl` upgrades silently with its own tail and hides the result.
- A scratch HOME must use umask 022 and a clean PATH, or Git driver directory checks and host-installed agent CLIs add false failures.
- A `pgrep -f` wait loop matched its own command line; wait on a log marker instead.
