# Identity: head named by pid and start time

Commits: `da1a7ad66` (code and tests), docs commit after it. Branch `ident/head-ref`.

## Signatures
- `pub struct HeadRef { pub pid: u32, pub start_time: String }` (Debug, Clone, PartialEq, Eq), crate root next to `WriterKey`; `start_time` is `fgos_process::facts::Record::start_time` text.
- `directory::register_writer(state_root, clone_dir, &WriterKey, head: &HeadRef, roles, take)`
- `current::session_for(state_root, &WriterKey, head: Option<&HeadRef>)`
- One judge, private `current::read_head(&HeadRef) -> Result<Record, String>`; both doors use it. No CLI caller existed.

## Refusal
`head-not-live`, detail one of:
- `process <pid> cannot be read or is not running, so it cannot be a session's head`
- `process <pid> started at "<now>", not "<given>": the pid was reused, so it is not the head`

`session_for` never refuses on this: an untrusted head gives the neutral `pi` label, same id.

## Tests (extended, no new files)
- `tests/directory.rs`: live head with right start time registers (and refreshes); exited child, unreadable pid and a live pid with a wrong start time are `head-not-live` (detail says reused), no entry left.
- `tests/session.rs`: mismatched start time gives `pi-` with the same id as the `omp-` trusted case.

Gates: `cargo test -p fgos-identity` and `cargo test -p fgos --test cli_tests identity` green.

## Docs
Spec section 5 (signatures, refusal), section 7a L6 (key-grinding limit), CHANGELOG line amended.
