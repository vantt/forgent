# IDENT lead state (before context compaction)

Lead: `claude-5v7u@fg-server` (session `b8f192bf`), role `lead:IDENT`, machine `fg-server`, checkout `~/projects/forgent`. Written 2026-10-23 11:44 (Asia/Saigon) so the lead can continue after compaction. Plan: [plan.md](../261022-1100-identity-i1-i4-project-machine-session-directory/plan.md). Spec: [identity](../../docs/platform/identity/spec.md) (decisions in section 10, minting rules in 4a, verbs in 5, local session in 7a).

## Landed on main (each verified independently: cargo green, npm only known reds)

| Phase | Commit | What |
|---|---|---|
| 00 | `b4f9a2219` | Session Identity renamed Identity: `packages/identity`, crate `fgos-identity`, operation `identity.writer` |
| 01-02 | `24d5d6cd8` | `fgos identity machine` / `session`, handles `<cli>-<4>@<machine>` |
| 03 | `4f26e1eef` | project id `.fgos/project.json`; this repo `08b076572f6eff3a90c586a35f24e4bb` (`forgent`), committed `3fcca3e68` |
| 07 | `19d2947a2` | `fgos identity mint <kind>`; one counter ref per sequence; `core/instructions/id-minting.md` |
| 04 | `79895352b` | session directory, `--register`, `--role`, `resolve`, `list` |
| 06 (part) | `6614a0a3c`, `6e972635b` | board section "Máy và phiên" + rule "name by handle" |

All three machines run releases with 00-04 and 07: `design-lap` (owner machine, release `94e26894`, owner confirmed 11:24), `fg-server` (landed by IDENT 10:34, `sha256:8514ec4b…`, report `landing-261023-1040-main-release-fg-server-identity.md`), `fg-server2` (`199d85223`).

## Open

- **Phase 06:** 9/11 lane leads have handles in the board table. Missing: WORK (`forgent-cd`, `fg-server2`) and DOC (machine unknown). Close 06 at 11/11. The mailbox address change is MAIL's own owner decision ("B then A", 11:35), not part of 06.
- **In flight:** worktree `/home/vantt/projects/forgent-worktrees/identity-lib`, branch `ident/library-doors-role-drop`, a sonnet lead doing four commits: (1) typed `candidates` in `directory::Refusal`; (2) library `register_current(...)` so the Rust mailbox registers heads in process (measure in-process cost); (3) `fgos identity session --drop-role lead:<LANE>` (backlog `p-q4vcrihcxb`); (4) owner 11:40: every `fgos identity` refusal under `--json` prints structured data on stdout (reason, message, candidates) following the host's existing `--json` error convention. When it reports: verify independently, land, then post the final Rust signatures and the JSON refusal shape on the board for MAIL (`lead:MAIL` `claude-rgvd@fg-server`, who builds step B on them after V6).
- **Phase 05:** waits for Event Store publication (WORK lane). Then ask the owner I5 (signing key mechanism).
- **HARDEN T2** fixes the `d-adr` claim for scp-style SSH origins and edits `packages/identity/rust/src/mint.rs:166,206`; IDENT does not touch `mint.rs` or the Git `sequence.rs` until T2 lands.
- Owner decided: keep two ISO clock helpers (identity, host-runtime).

## How the lead works here (learned)

- Commit board/docs from the worktree `/home/vantt/projects/forgent-worktrees/ident-board` (detached at origin/main; `fetch` + `checkout --detach origin/main` first), never in the shared main checkout (other sessions' unpushed commits there). Push with a fetch/rebase retry loop.
- Read the board top for new lines on every turn, including lines addressed "Cho IDENT".
- Landing a branch: merge origin/main; `packages/git/contracts/mutation-census.v1.json` nearly always conflicts → take main's and run `node scripts/git-one-door-scan.mjs --write-census` (5 `unresolved-binary` sites pre-exist); rebuild list-style doc conflicts from the code registry, never by text merge; then `cargo test --workspace -- --test-threads=4` (CARGO_BUILD_JOBS=4, target `/home/vantt/projects/forgent-worktrees/identity-verify-target`), then full `npm test`, never together (`free -g` ≥ 8 GB). Known reds: 17 fgctl init/upgrade/download, codex `cli-bypass`; flaky under load: `run-provider-failover` "two checkers", `concurrent createSession`, `fgos-distribution` lock test, `fgos-git` `killed_move…`.
- Delegate implementation to `fullstack-developer` on sonnet with a full brief; run `fgos dispatch decide --for implement --needs-soul --has-live-task-access` first. Owner memory: cheap models, discuss before editing, agents are customers (explicit typed results).
