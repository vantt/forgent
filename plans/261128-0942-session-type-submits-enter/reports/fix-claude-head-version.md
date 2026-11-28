# Fix unit: read a confined Claude head's version from its process

Plan: `plans/261128-0942-session-type-submits-enter/plan.md`, criterion 4 (live check).

## What failed

Live check on release 389b328d: `fgos session type head:shaper-probe-0853-check --text '...'` answered
`fgos: claude-asak@fg-server2: nothing was typed [unknown]`, twice, with identical screens before and after
(captures: `reports/captures/live-check/`).

## Cause (proven by reading)

`apps/fgos/src/wiring/supervision.rs` (verb `session type`) gets the head's Claude version through
`fgos_mailbox::adapters::version::recipient_version` -> `claude_session_version`, which reads
`<caller's CLAUDE_CONFIG_DIR>/sessions/<head pid>.json`. A head runs Claude confined: its Claude config dir is its
own confinement home (`/tmp/fgos-confinement/<disp>/home`), and inside its pid namespace Claude's pid is `2`, so its
file is `/tmp/fgos-confinement/<disp>/home/sessions/2.json`. The caller's lookup never finds it, the version is
`None`, and `PaneIo::typed_wake` refuses `unknown` at `packages/session-host/rust/src/pane_io.rs:102` before typing.

The running Claude binary is the versioned file itself: `/proc/<host pid>/exe` ->
`/home/<user>/.local/share/claude/versions/2.1.332`.

## Change

In `packages/mailbox/rust/store/src/adapters/version.rs`, for `claude`: keep the session-file read; when it gives no
version, read the version from the head process's executable: `/proc/<pid>/exe` resolves to a file whose parent
directory is named `versions` and whose name is a plain `MAJOR.MINOR.PATCH` (digits only). Before trusting it, check
the process is still the head: the head text carries `pid` and `startTime` (`record_of_head_text`); use the
process identity primitive that already exists in `packages/process` (`fgos_process` `identity_of` / its tuple,
reuse, never re-read `/proc/<pid>/stat` by hand) and refuse (None) on a mismatch. Any failure stays `None`
("Any failure is no version, never a refused send"). Update the module doc comment to say this.

The same function serves the mailbox delivery report and the mailbox typed wake; that is intended (one door).

## Proof

One owning proof in `packages/mailbox/rust/store/tests/verbs.rs` (it owns `recipient_version` behaviour today, see
`a_wake_whose_recipient_version_is_unreadable_is_not_nudged_and_says_why`): a claude head whose session file is
absent gets its version from a process whose executable sits in a `versions/<semver>` directory (for example copy or
symlink-free hard copy of a small executable such as `/bin/sleep` to `<tmp>/versions/9.8.7`, spawn it, pass its pid
and start time), and gets `None` when the start time does not match or the exe name is not a version. Name the
behaviour in the test title. If the pure exe-path-to-version part is cleaner as a unit test inside `version.rs`,
that is fine too; do not add both for the same behaviour.

Run: `cargo test -p fgos-mailbox-store --test verbs` (check the crate name in its Cargo.toml) and
`cargo test -p fgos --test supervision_verbs`.

## Writes

For the first change: `packages/mailbox/rust/store/src/adapters/version.rs` and `packages/mailbox/rust/store/tests/verbs.rs`.
A path you need outside these goes in `needsWrites`, not on disk. Do not run `git add` or `git commit`.

# Second change in the same unit: heads start with Claude prompt suggestions off

## Cause (proven by capture)

`reports/captures/live-check/probe.ansi.txt`: an idle Claude 2.1.332 head shows its prompt suggestion in the composer
drawn faint (`ESC[2m`), and herdr's `agent explain` quotes it as the prompt text (`probe.explain.json`,
`region_preview: "❯ it's just a start-up check, stop here"`). Plain screen text cannot tell it from a typed draft, so
the claude composer predicate reads it `NotEmpty` and `session type` would refuse `composer-not-empty` on every idle
head after a turn.

## Change

`src/session-host/head-start.mjs` already merges `statusLine` into the Claude `--settings` object of a head launch
(`withHeadSettings` and the helper around line 310-340). Merge `promptSuggestionEnabled: false` in the same place, in
all three branches the code already has (`--settings=<json>`, `--settings <json|object>`, no `--settings`), and only
for a Claude binding, exactly like `statusLine`. A non-JSON `--settings` value stays unchanged, as today. No new
helper, no config key.

## Proof

Extend the existing owning tests in `test/session-host/head-start.test.mjs` (`a Claude binding carries statusLine on
the launch invocation, a non-Claude binding does not` and `a head launch merges statusLine into an existing
--settings object on the invocation`) to assert `promptSuggestionEnabled === false` next to `statusLine`, and that a
non-Claude binding carries neither. Rename their titles to name both settings. No new test file.

Run: `node --test test/session-host/head-start.test.mjs`.

## Writes (whole unit)

`packages/mailbox/rust/store/src/adapters/version.rs`, `packages/mailbox/rust/store/tests/verbs.rs`,
`src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`.
