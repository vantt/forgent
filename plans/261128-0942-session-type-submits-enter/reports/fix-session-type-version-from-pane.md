# Fix unit: `session type` reads the CLI version from the process in the pane

Plan: `plans/261128-0942-session-type-submits-enter/plan.md`, criterion 4 (live check).

## What failed

Rerun on release 0de56517 (main a27546744d): `fgos session type head:shaper-probe-0853-check2 --text '...'` answered
`nothing was typed [unknown]`. The pane was idle with an empty composer (`reports/captures/live-check/rerun-*`).

## Cause (proven)

`type_into_session` in `apps/fgos/src/wiring/supervision.rs` (about line 3247-3257) builds the head text for
`recipient_version` from `session.ids.cli_session.{pid,start_time}`. A confined head's identity record carries
`cliSession` with only `source` and `id` (its hook cannot read its session file), so the closure returns `None`,
the version is `None`, and `PaneIo::typed_wake` refuses `unknown` before typing.

The pane itself names the process: `rerun-process-info.json` shows the pane's one foreground process is Claude itself
(host pid 2309026), and `rerun-exe.txt` shows its exe is `/home/vantt/.local/share/claude/versions/2.1.332`.
`recipient_version` already reads a claude version from a live process's exe (`claude_process_version` in
`packages/mailbox/rust/store/src/adapters/version.rs`, guarded by `judge_here(&record) == Verdict::Alive`).

## Change

In `type_into_session`, take the process to version from the pane the verb types into, not from the identity
record: inspect the pane with the terminal core's existing foreground read (`Want { foreground: true, .. }`; the
inspection's `foreground` is a `ProcessIdentity { pid, start_time, .. }`). Turn it into a full process record with
the existing `fgos_process::facts::identity_of(ProcId(pid))`, accept it only when its `start_time` equals the
pane's `ProcessIdentity.start_time`, and pass `record.to_json().to_string()` as the head text to
`recipient_version`, exactly as `apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs` passes its head record. No
foreground process, or a mismatch, leaves the version `None` (the gate then refuses `unknown`, as today). Remove the
now-unused `cli_session` pid/startTime path from this verb. Do not change the mailbox typed wake
(`mailbox_verbs/typed_wake.rs`) or `version.rs`: the mailbox's own rules stay unchanged (plan non-goal).

Reuse only existing helpers; add no new module.

## Proof

One wiring proof in `apps/fgos/tests/supervision_verbs.rs`: find the existing `session type` proofs and the fake
herdr pane they use (`packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py`). Extend the owning case, or
add one case if none owns it, so that a head whose identity record has no CLI pid gets past the version gate when the
pane's foreground process is a live process whose exe sits in `versions/<the claude profile's pinned version>`
(read the pin through `fgos_agent_protocol::terminal::adapter_for("claude").pinned_version()`, never a literal; use
`install -m 700 /bin/sleep <dir>/versions/<pin>` in its own process to make the copy, then spawn it, as
`packages/mailbox/rust/store/tests/verbs.rs` `spawn_named_copy` does, to avoid ETXTBSY). If the fake pane cannot report
a foreground process today, extend `fake-herdr-pane.py` to report one from an env var or its state file, following
how it reports its other fields. Name the behaviour in the test title. If the wiring proof turns out infeasible,
say exactly why in the summary instead of adding a weaker test.

Run: `cargo test -p fgos --test supervision_verbs`, then `cargo fmt --all -- --check` (never call rustfmt directly).
Quote the result lines.

## Writes

`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/tests/supervision_verbs.rs`,
`packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py`. Anything else goes in `needsWrites`, not on disk.
Do not run `git add` or `git commit`.
