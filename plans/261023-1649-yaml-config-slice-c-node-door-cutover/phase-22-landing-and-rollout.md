# Phase 22: Landing C, per-machine activation, the other workspaces, severity raise

Depends on 21. Suggested executor: the lead (sonnet) for the commands; haiku for the guide text. Owner gate G-C1 per machine. Guide and landing report under `plans/reports/` (names from `fgos convention name`).

## Landing

1. Final merge of `origin/main` into `cfg/slice-c`; re-run phase 20's checklist lines 9 and 10; land on main per the board's rules (one merge, so `git revert -m 1` undoes the cutover); board log line (merge commit, counts, parity result, machines pending). Message `lead:HARDEN`, `lead:SEAT`, `lead:TEST`, `lead:COOK`, `lead:WORK`, `lead:DOC` (plan table): landing C merged, rebase onto it, `src/config/` is gone, tests write YAML through the helper.

## Per machine (one at a time; machine with one release and one project first; G-C1 answered for it)

1. Re-run phase 20's checklist on that machine.
2. Build and `fgctl stage` the release from the landing commit **in a linked worktree** (the shared checkout stays untouched); note `previousArtifactDigest`.
3. Back to back: `git pull --ff-only` in the shared checkout, `fgctl upgrade --from <staged>`, `fgctl verify` (the window between pull and upgrade is where an old release meets the tombstone; it fails loudly and writes nothing).
4. Verify: `fgos config check`, `fgos doctor`, `fgos dispatch decide` and `explain` (accounts visible), one real lease on a cheap read-only unit, `fgos gateway stop` then `start` and `status` reachable, a confined probe run (`confinement-probe-freshness`), one nested lease from a worker refused with `config-accounts-unavailable-confined`, `fgos setup` run twice (second changes nothing), the doctor's `bin` row, a PreToolUse Agent call through the hook, a commit staging a deliberately broken scratch config (refused) in a scratch repo. Time `fgos dispatch decide` and `fgos doctor` against phase 08's numbers.
5. Board line per machine: release id, digest, check outputs (ids only), cold-start numbers.

## Other workspaces

forgentX, mdview and mcp-skill-hub each migrate their own project file with D's verb when their release is active (each its own item; dry run, owner reads the machine-override list, backup, commit in that project). The same for any other project phase 20 listed. Nothing in this repository touches them.

## Severity raise (C17)

When the evidence shows no owner-machine project still holds a legacy `config.json`, change `config-format-legacy-json` to `fail` in `packages/config/contracts/doctor-rows.v1.json` (one value; D's `golden_doctor.rs` fixture value updated in the same commit), land, board line. If a project is excepted by the owner it stays a warning until it migrates.

## Owning proof

Live evidence on each machine (the table in the guide); crate proofs are D's.

## Risk / rollback

See the plan's "Rollback" table; before any machine is activated nothing needs rolling back beyond `git revert -m 1`. Risks: activation without the pull ordering (M x M, loud), an unlisted older release (L x H, preflight line 5), a worker confined session calling a write door (refused by name).
