# HARDEN: `work:<name>` role kind

Worktree: /home/vantt/projects/forgent-worktrees/harden-work-role, branch harden/work-role-kind. Not pushed, not merged.

## Commit
- a89adf9bd feat(identity): a work:<name> role for one piece of work that is not a lane (14 files, +98 -56; the census file is 34 of those lines, line shifts only)

## Sites changed
- packages/identity/rust/src/directory.rs: `ROLE_PREFIX` removed. New `ROLE_KINDS = [("lead:", "lane-id"), ("work:", "work-item-id")]`, the one list. `role_problem` looks up the kind by prefix. New `is_role_alias(query)`. Both refusal details use one shape text. `resolve` uses `is_role_alias`.
- packages/identity/rust/src/shared.rs: resolve's `is_role` uses `is_role_alias`.
- packages/identity/rust/src/provider.rs: doc comments only (`<role>`).
- packages/identity/contracts/identity.write.v1.json (role, dropRole, roles, description) and identity.read.v1.json (roles, description): pattern `^(lead:[A-Z][A-Z0-9-]{0,15}|work:[a-z][a-z0-9-]{0,29})$`. The slug part is the work-item-id charset and its 30-char bound.
- apps/fgos/src/cli_projector.rs: it passes the role through without parsing the prefix, so only the doc comment and the resolve usage text changed.
- src/cli/command-registry.mjs: identity help (description, role, drop-role, resolve, mailbox send --to, one new example).
- packages/convention/contracts/convention.rules.v1.json: the `work-item-id` description now says it is the name after `work:`. The `lane-id` wording was already right (the prefix is Identity's), so it is unchanged.
- apps/fgos/src/wiring/mailbox_identity.rs (MAIL's file): only the import and the two uses (:55, :175) changed to `is_role_alias`. No other edit.
- CHANGELOG.md `[Unreleased]` line; packages/git/contracts/mutation-census.v1.json regenerated (test line shifts).

## Convention kind for `<name>`
`work-item-id`. Reason: its charset (a-z, 0-9, hyphen, max 30) is already a slug, and it is the kind the owner named for item ids. The other slug kinds do not fit: `seat-id` is tied to run layout and has reserved words, and handle/workflow/agent kinds name other things. No new Convention kind was added.

## MAIL follow-ups (not edited)
- apps/fgos/src/wiring/mailbox_identity.rs:8 and :51: doc comments still say only `lead:<LANE>` / "starts with `lead:`". Behaviour is already correct.
- packages/mailbox/rust/core/src/frame.rs:104: doc comment names `lead:<LANE>` only. `escape_handle` does not validate the prefix; `work:x` passes through unchanged (`:` is in its allowed set).
- packages/mailbox/contracts/remote.v1.json: no role-pattern validation. The only `lead:` hit is a prose source note (`lead:ES`) in a limit entry, unrelated.
- Mailbox docs/spec wording for addressing (see docs lines).

## Tests and counts
Extended owning tests, no new files:
- packages/identity/rust/tests/directory.rs: the role-shape test now also refuses `work:`, `work:Tsk-1`, `work:1abc`, `work:a:b`, and a 31-char name, and accepts `work:tsk-4f2a9c1b3d` and a slug. New test `a_work_role_has_one_live_holder_moves_with_take_and_resolves` covers refusal without take (role-held), take, resolve, drop and then not-found.
- apps/fgos/tests/cli_tests.rs (identity directory test): one CLI wiring proof, work role registers, resolves, and a bad `work:` name is refused `[invalid-role]`.
- apps/fgos/tests/mailbox_routes.rs: the existing role-send test also registers `work:probe-run` and proves a send to it resolves to the holder.

Results:
- `cargo test -p fgos-identity`: all green. `cargo test -p fgos-convention`: green.
- `fgos --test cli_tests identity_`: 12 passed. `--test mailbox_routes`: 32 passed. `--bin fgos`: 28 passed.
- clippy `-p fgos-identity -p fgos --all-targets -D warnings`: clean.
- `cargo check` on x86_64-pc-windows-msvc and aarch64-apple-darwin for fgos-identity and fgos: clean.
- Node (command-registry, fgos-help, fgos-verb-help-json, test/convention, test/identity, rust-host help-routes): 38 tests, 33 pass, 5 fail. All 5 are in test/rust-host/help-routes.test.mjs: "Compiled native addon not found ... target/release/libfgos_node_addon.so; run cargo build --locked --release --workspace first". That is the missing release build in this worktree, not this change. I did not build it (heavy).
- git-one-door scan: 0 undeclared sites.

## Net size
14 files, +98 -56 (net +42; 34 of the changed lines are the regenerated census).

## Docs lines needed (docs/ is frozen, not edited)
- docs/platform/identity/spec.md: role section: a role is `lead:<LANE>` (Convention lane-id) or `work:<name>` (Convention work-item-id, a work item id or slug, max 30), same field, one live holder, `--take`, `--drop-role`, `resolve`. Add: `work:` is for one piece of work that is not a lane lead.
- docs/specs/mailbox.md (addressing): `--to` accepts `work:<name>` as it accepts `lead:<LANE>`.
- docs/specs/identity.md decision history, if the area keeps one: owner decision 52.

Status: DONE
Summary: `work:<name>` role added through one `ROLE_KINDS` list in directory.rs. Resolve, shared view, contracts, CLI help and the two mailbox call sites all use it. Tests, clippy, and both cross-target checks are green.
Concerns/Blockers: 5 help-routes node tests fail only because the release native addon is not built in the worktree. MAIL doc comments (mailbox_identity.rs, frame.rs) still mention only `lead:`.
