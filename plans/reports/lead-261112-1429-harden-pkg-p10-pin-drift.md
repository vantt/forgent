# Packaging P10: activation-versus-pin drift

Branch `harden/pkg-p10-pin-drift` (machine fg-server2). Decision 80 Q4/5 (a): exact-digest pins stay, doctor warns when the activation differs from the pin, the pin moves at each official release. The committed pin's value is untouched.

## What changed

- `packages/distribution/rust/src/init.rs`: `pin_drift(activation, pin) -> Option<PinDrift>` (pure), `PinDrift` with one `Display` line `active <d12> != pin <d12> (override: <reason|none>)`, `FgctlWorkspaceStatus.pin_drift` (additive JSON, absent when equal), `fgctl verify` prints the line after `verified <d12>`. The digest-only-pin error now lists three ways out, checked against `init_workspace_resolving`: `fgctl init --from <release>`, `FGCTL_VERSION=<tag> fgctl init` (the tag whose digest is the pinned one, because the pin still validates what was fetched), `fgctl init --override-pin <reason> --from <staged release>` (the override needs `--from` and a release staged here, see `pin-override-needs-from`).
- `apps/fgctl/src/main.rs`: `status` prints the drift line before its result line (3 lines).
- `src/setup/registrations.mjs`: doctor row `activation-matches-pin`. A `warning:` message with a `fixCommand` naming both choices; never `fail`, no registered fix, so `next` is unchanged. Skips without a pin or activation; an unparseable pin is "no pin", the same as `read_tracked_pin`.
- One golden `packages/distribution/rust/tests/goldens/pin-drift-cases.json` (equal, no pin, differs with override, differs without, digest-only pin) read by `tests/pin_drift.rs` and `test/setup/pin-drift-check.test.mjs`; both assert the exact line.
- Release how-to step 6: `FGCTL_VERSION=vX.Y.Z fgctl upgrade`, commit `.fgos/distribution.json` as `chore(release): pin vX.Y.Z`, confirm the row is quiet. Fact check: `upgrade_workspace_resolving` reaches `activate` with `update_pin: true` and the downloaded tag, and the already-active path rewrites the pin with the tag, so no new script is needed.
- Docs: doctor how-to table row, registry contract inventory and a paragraph, CHANGELOG line.

## Unreadable pin (OPC review delta)

A pin file that exists but is not a pin used to read as "no pin" in `read_tracked_pin`, so `fgctl init` over a corrupt pin went off to download the latest release (shown by the red test). Now there is one reader: `read_tracked_pin` returns `PinFile {Absent, Unreadable, Present}`; a second reader I first added was deleted. `init` refuses with `the committed pin is unreadable: .fgos/distribution.json; restore it from version control, or run fgctl upgrade to write a new pin`, exit 4 (`validation`). `status`, `verify` and the doctor row print the same line (golden case "a pin file that is not a pin..."). The post-activation tail only reads the pin's tag and never refuses; `upgrade` never read the pin, it writes it, so it is the repair the hint names. `FgctlWorkspaceStatus` carries `pinNote` (one string) instead of a typed drift.

## Plan unresolved question 3 (shared comparator)

Not shareable. `active-release-matches-checkout` compares a Node payload tree against a manifest; this row compares two digests. What is shared is the symlink-safe reader `doctorDriftPath`. The row replaces no row; decision 80 authorises it. Reader choice: the row reads the two files rather than calling `fgctl status --json`, so doctor needs no `fgctl` on PATH.

## Proof

- Red first: `98dc8783d`; the unreadable-pin delta has its own red commit `4730813b2` (unresolved import, missing three-ways text; Node row absent).
- `cargo test -p fgos-distribution -p fgctl` green; `cargo fmt --all --check`, `cargo clippy -p fgos-distribution -p fgctl --all-targets -- -D warnings` clean; `cargo check --all-targets` for x86_64-pc-windows-msvc and aarch64-apple-darwin pass (the warnings they print are old unused-test-helper warnings on Windows).
- Scratch HOME: staged and activated the newest local release with `fgctl init --from`, equal pin printed nothing, a changed pin gave `active ed51feeafded != pin df7a1a043a5c (override: none)` from `fgctl status` (before the result line), `fgctl verify`, and `fgos doctor --json` (row `activation-matches-pin`, status `warn`, 110 rows, `next` unchanged). `init` exited 2 there only because the empty scratch HOME has other failing doctor rows (P06 behaviour).
- Node: `test/setup/pin-drift-check.test.mjs` 7 pass; `checks.test.mjs` inventory and `registrations.test.mjs` pass; `test/architecture.test.mjs`, `doc-health` pass. `check-decision-citation-drift` has its one known red (document-identity spec glosses), unchanged by this branch.
- Census regenerated with `--write-census`; 0 undeclared sites.
- Full `npm test` on the head before the rebase: 8835 tests, 2 fail, both known reds (the frozen V7n addendum and the document-identity citation drift), no run-tests ERROR lines. After the rebase onto the then-current main: focused set and Rust tests rerun green.

## Measured size against the estimate

| Part | Estimate | Measured |
|---|---|---|
| Rust (src) | +40 | +67 / -1 (Display, serde derives, error text, helper) |
| Node (src) | +30 | +41 / -1 |
| Docs | +15 | +31 |
| Tests and golden | +50 | +223 (Rust 59 + 63 cli, Node 65, golden 35, one-line fixture edits) |

Over the estimate mostly in tests: the golden carries five named cases and the status wiring has one real child-process proof.

## Authority

- The pin digest versus activation digest comparison lives in one place per language (`pin_drift`, `checkActivationMatchesPin`) tied by one golden; two readers of one contract, not one authority. The lowest layer that knows it is the distribution crate; if doctor ever calls the Rust host for status, the Node reader goes. Not moved: `.fgos/distribution.json` and `activation.json` are both written by `fgctl` and read by doctor through its own path reader, which is the existing pattern for the other install rows.
- The release procedure (pin bump) is a manual how-to step, not a command. A `fgctl pin` verb would belong in the distribution layer; not added (RUL104, no new mechanism).

## Lessons

- A Rust `\` line continuation strips the next line's leading spaces; indented list lines inside a `format!` need `\x20`.
- The edit hook blocks any shell text containing the git directory name, so a test fixture that fakes a repository skeleton has to be written with the Edit tool, not a heredoc; and a test that shells out to git joins the one-door census (the census digest changed for every test file touched), so faking the skeleton avoids a new census entry.
- Scratch-HOME smoke needs the Node directory on a stripped PATH (`preflight failed: runtime-dependency-missing: node`) and the working-tree doctor runs only through `npm run fgos:dev -- doctor` with `INIT_CWD` set to the scratch project.
- A second reader of one file looks harmless until the first one disagrees with it; when a review asks for a new state (unreadable), widen the single reader's return type and move every caller, do not add a sibling.
