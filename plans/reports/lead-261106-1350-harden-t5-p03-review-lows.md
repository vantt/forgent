# Credential doors: the four Low notes of the third security review (branch `harden/t5-p03-lows`, base `84f36c8f3`)

Commit `2ff1b6a63`. Runs from the worktree with every `HERDR_*`/`CLAUDE*` variable unset, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/cargo-harden-t5-p03-lows`. No Rust change.

## Fixes

| Note | Fix | Proof (red on `84f36c8f3` source, green after) |
|---|---|---|
| 1 Crash replay | `applyAgentCopies` writes `.gate-spent` into the original pending copy just before the renewal call, and removes it when the call renewed nothing. A lock holder that finds the mark follows a runner that died during the call: it drops the copy (stderr `credential-copy-dropped`) and never redeems its token again; the renewed pair, if any, is in the dead runner's `pending/.tmp-*` staging, which the interrupted-staging sweep and doctor report. | "an agent's copy is marked spent before the call, and one found still marked is dropped without a call" |
| 2 Doctor wording | Agent copies set aside under `torn/` (name `<ts>-agent-<hex>`) are inspect kind `set-aside`; `credential-copies-retained` reports them on their own line ("renewed inside a private home and set aside after renewals that returned nothing"), never as half-written. | "an agent's copy set aside after renewals that returned nothing has its own wording, not a half-written one"; the existing N1 test now also asserts kind `set-aside` |
| 3 Preparation that always throws | A throw before the call (isolating or marking the copy) counts a try like a call that renews nothing; after two the copy goes to `torn/`. A throw after the call leaves the spent mark, so the next holder drops it. | "an agent's copy whose preparation fails counts its tries and is set aside after two" (SQLite that cannot write the isolated copy) |
| 4 In-place home by real path | `machineLoginStores` compares the in-place CLI's homes and every store by real path, so a store spelled through a link to that home stays visible to the in-place launch. | "every login store the inventory and the executors name is masked, …" (a `~/claude-link -> ~/.claude` store) |

Red evidence: the five named tests fail on the base source (`git stash` of `src/`, 5 fail / 153 pass), all pass with the fix.

## Files

`src/runner/dispatch/provider-credential-renewal.mjs`, `src/runner/dispatch/llm-accounts.mjs`, `src/setup/registrations.mjs` (only the `credential-copies-retained` check: one new summary line and one kind excluded from the waiting line; the observe row of the doctor phase is not touched), tests in `test/runner/provider-credential-renewal.test.mjs`, `test/runner/dispatch-confinement-machine-private.test.mjs`, `test/setup/credential-copies-retained-check.test.mjs`; runner spec RUL75 change note (the old "cools the account down" sentence corrected), CHANGELOG line, census regenerated. No file of P05.

## Proofs

- Focused (62 affected files plus workflow, doc-health, citation-drift, architecture): 1056 pass, 0 fail.
- Full suite: 8747 tests, 8714 pass, 1 fail (known frozen V7n addendum), 0 `run-tests: ERROR` lines.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared.

## Size

Node +30 / −6 (src), tests +72 / −1. No test retired. Confinement directory unchanged.

Status: DONE
Summary: The four Low notes are fixed with one owning test each (all red before, green after); the full suite fails only the known V7n test.
