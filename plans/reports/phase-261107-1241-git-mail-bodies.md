# Git crate: mail-body ref namespace (phase report)

Landed on main as `df644d414` and `5f158d3ea` (rebased from `7a30d77fd` and `7defbe405`); OPC merged with three conditions, all done. The worktree and the 6 GB target are removed.

Deviations from the brief (reviewer to accept or reverse):
1. `publication_fetch_mappings` keeps its two mappings (events, legacy). New `granted_fetch_mappings` = those two + mail-bodies. Reason: Event Store `refspec::pinned_url` (packages/event-store/rust/src/refspec.rs:11) requires every mapping of `publication_fetch_mappings` in config and provenance, so a third mapping there would fail event sync on every clone before setup runs. Setup/doctor and the fetch/config allow-list use the granted set.
2. One-line edit outside the file list: packages/git/node-addon/src/git.rs:329, `git_fetch_mappings` returns the granted set. It is the only Node door to the mapping policy (setup `installFetchMapping` and doctor row call `native.gitFetchMappings`); no Node setup code changed.
3. Recovery: `recover_transfer` (src/remote.rs ~680) never queries the remote; it records "outcome unknown, query remote before any new request". Next push re-reads ls-remote and takes a fresh lease, so no change needed. `recover_own_transfers` is already pub on PublicationPort.
4. Event Store reader/sync never touch mail-bodies: read.rs `mirror_suffix` (line 211) returns None for `mail-bodies/...` mirrors, `tips()` prefixes list no `refs/fgos/mail-bodies/`, sync.rs `verify_mirrors` only handles `refs/fgos/remotes/<r>/events/`. Verified by reading plus sync tests green; I did NOT add an event-store test (event-store files are outside ownership). The fetch-side proof in the git crate: event-only refspecs do not mirror mail-bodies.
5. Push porcelain flag `+` (forced update) now counts as Accepted; needed for a leased replace.
6. ls-remote pattern `refs/fgos/mail-bodies/*` is added only when a mail-bodies refspec is passed, so event sync requests are byte-identical to before.
