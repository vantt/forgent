# Implement: identity project id (rung I1)

Branch `ident/p03-project-id` (base 553105da2). Worktree only; nothing pushed or merged; no `.fgos/project.json` committed for this repo.

## Built
- `packages/identity/rust/src/project.rs` (provider feature): file `{v,projectId,handle,createdAt}`, `read`, `mint(replace)`, `remote_tracks`, `project_info`, `project_init`. Reuses `text::random_hex128`/`slug`, `fgos_durable_file`, Convention `project-handle` (new kind + golden cases). Added `text::iso_utc_now` (lowest layer; same algorithm already exists in run-supervisor/distribution/observe, which sit above identity).
- Git reads only through `fgos-git` (new optional dep behind `provider`): `GitDriver::open_at`-style resolve, `trusted_main_root`, `resolve_trunk`, `resolve_ref`, `paths_at_revision`. No new git spawn, no mutation, census untouched.
- Verb `identity project [--init|--new] [--handle h]`: read -> `identity.read`, init/new -> `identity.write` (contracts updated, `command-routes.json` flags, `command-registry.mjs`, projector with flag validation).
- Doctor `identity-project-id` (warn when absent, no fix). `identity-checks.mjs` refactored: one `askIdentity` shared by machine and project rows.
- Docs: identity spec (section 4 row, 5 verbs, I1 rung, decision history), event-store spec tracked-`.fgos` note, setup-doctor-registry checks list, distribution.md row 7, component-boundary, CHANGELOG.

## Behaviour
- `--init`: main checkout only; refuses `project-id-exists`, `linked-worktree`, `project-id-on-remote` (fetched remote default branch tracks the file); prints commit command; never commits.
- `--new`: replaces on purpose, skips exists/remote checks, still refuses in a worktree.
- Read from a worktree returns the main checkout's file.
- Remote check only sees what was fetched (documented).

## Proof
- `cargo test -p fgos-identity`: project.rs 5 tests (bare origin + 2 clones + linked worktree; refusals; file validation; handle default).
- `cargo test -p fgos --test cli_tests identity` + projector unit tests: wiring (cwd as repo, exit 65, flag validation).
- Manual: two clones of one bare repo with the built host: clone one `--init` + push; clone two after fetch `--init` -> exit 65 `[project-id-on-remote]`; after pull both print `c281f5fb9035f3ed2b6e838ce86ecaa9`.
- `node run-subset test/setup/identity-checks.test.mjs test/setup/checks.test.mjs`: 110 pass, includes the doctor row: warn text, pass `project <id>, handle sample-app` after `--init`, fail on a broken file.
- `cargo test --workspace -- --test-threads=4`: exit 0, no FAILED.
- Full `npm test` (committed tree): 8833 tests, 18 fail = the known reds only (17 fgctl init/upgrade/download + codex `cli-bypass`). The suite gate also flagged the new host spawn in the doctor row test for lacking a `// boundary:` reason; fixed by a follow-up commit and re-checked with `suiteReport` (0 without a reason); the suite was not re-run in full after that one-comment change.

## Notes
- No test retired or weakened. Event Store spec line 565 reference landed at line 566.
