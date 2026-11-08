# HARDEN lead report: wipe rule, pin analysis, recovery runbook

Date: 2026-11-08. Branch `harden/wipe-rule-pin-runbook`.

## A. Rule (done)
- AGENTS.md: new `## Destructive cleanup` section after "Scratch artifacts" (4 lines): no hand-rolled deletion of ignored/untracked paths; use `fgos worktree remove --discard-ignored` (being added by another lead) or `git -C "$W"` after asserting `$W` is a registered linked worktree; never chain a destructive step after `cd` with `;`/`&&`; points to the runbook.
- `.fgos/runtime/tmp/t6-phase-lead-brief.md` (untracked, edited in place in the main checkout): same rule added under item 9.
- Scanned `core/instructions` and `core/skills`: no source tells agents to delete ignored paths or `git clean`. `core/skills/_shared/private-cell-worktree.md` already says `fgos worktree remove`, no force flag. AGENTS.md "Scratch artifacts" is hand-written (no generator), so no regeneration. Note: the `--discard-ignored` flag is not in the CLI yet (`fgos worktree --help`); the rule names it as the target door.

## D. Pin analysis
Facts:
- `.fgos/distribution.json` is `exact-digest`, `releaseVersion: null` (digest-only). History: 9 bumps 10-16..10-17, each "pin the release that carries X" or "land on the second machine"; last bump 10-17 18:59 (856e26b1c) to df7a1a04. Nobody bumped it since; machines moved on through `fgctl upgrade`, which rewrites the pin only locally.
- `init.rs` (pin vs `--from`): a `--from` that resolves to a different digest than the pin is refused as `pin-mismatch`; the pin only validates, it cannot be overridden by a flag. A digest-only pin on a machine that lacks it needs an explicit source. `fgctl upgrade` ignores the pin but needs an existing activation.
- df7a1a04 is staged on fg-server2 but has no `.node` addon (find shows 0); 674c76fb and bb0e2624 (current active, `fgctl verify` ok) have one.
- Spec intent (RUL15, contracts/distribution-pin.md): the pin is team policy "which runtime the project wants"; activation is per-workspace readiness. A tag-carrying pin lets a fresh clone download it checksum-verified.
- Result: for a repo where three machines each run their own release, an exact-digest pin is stale within a day; it only bites in the one path with no activation (a wipe or fresh clone), which is when it blocks recovery. I did not change the pin: moving it to bb0e2624 would not cure the cause and would change policy for the other two machines.

Runbook documents the existing workaround (temporary pin edit, `fgctl init --from`, restore pin).

### Owner question (decision-question template)
**What is happening:** After a wipe, `fgctl init` could not re-activate because the committed pin names df7a1a04 (3 weeks old, no addon) and `--from` cannot override a pin; recovery needed a temporary hand edit of a tracked file.
**Cause:** Checked `init.rs` pin-vs-`--from` reconciliation, `git log -p -- .fgos/distribution.json` (last bump 10-17) and the staged releases on fg-server2 (df7a1a04 has no addon; 674c76fb, bb0e2624 do). The pin is exact-digest and digest-only, so it cannot track three machines that upgrade on their own.
**Options:**
1. Add `fgctl init --ignore-pin` (or `--allow-pin-mismatch`) for recovery: explicit, logged, writes the activation without touching the tracked pin. Gain: no tracked-file edit; harm: new flag, weakens "pin is policy" for that one command; cost: about 40-60 lines Rust in `packages/distribution/rust/src/init.rs` plus a test and spec rule.
2. Change the policy for this repo: drop `.fgos/distribution.json` (no pin) or use a `channel` policy, so each machine follows latest/its own release. Gain: no stale pin, no recovery trap; harm: the repo no longer states a team runtime, and other projects keep exact-digest; cost: delete or edit one file, plus a check that init without a pin works offline (it downloads latest, needs network).
3. Keep exact-digest but bump the pin to a release every machine has staged (today bb0e2624 on fg-server2; fg-server and design-lap unverified) at each landing. Gain: no code; harm: manual chore that rots again, and still blocks recovery on a machine that lacks that digest; cost: one commit per bump.
4. Runbook only (done in this change). Gain: nothing to build; harm: recovery still needs a temporary tracked-file edit.
**Recommendation:** Option 1. The pin should stay policy for normal init and upgrade; recovery of an already-trusted staged release should be an explicit, one-command override instead of editing a file shared by all machines. Option 2 is the fallback if the owner does not want a team runtime pinned at all.
**Scope of the answer:** A yes to option 1 authorizes a Rust change in `packages/distribution/rust/src/init.rs`, its test and the packaging spec rule (RUL15 area), and a runbook update. It does not authorize changing `.fgos/distribution.json`, other projects' pins, or `fgctl upgrade`.

## Runbook
`docs/how-to/recover-main-checkout-after-ignored-files-wipe.md` (how-to quadrant, where `docs/reading-map.md` places end-user procedures); linked from `docs/reading-map.md` §5 and registered in `docs/enduser-docs-index.json` (regenerated with `fgos docs-index`). Covers: re-activate (with pin workaround), `fgos setup` and coexistence.json, cargo build and `git worktree prune`, AgentKit v3 per runtime (ui-spec trap, no `ak init`, no `--force`, restore settings and agents), runtime tmp, verify (`fgctl verify`, `fgos doctor`, `ak versions --local-only`), and what is lost.
Unverified by running (would repeat the destructive scenario): the exact `ak` flags come from the owner's reinstall notes. The `ak projects add` step and the `AK_NO_AUTO_UPDATE` export are taken from those notes.

## Verification
- `test/scripts/doc-health.test.mjs`: 9 pass (after regenerating the end-user docs index).
- `test/docs/*.test.mjs`: 30 pass.
- `node scripts/check-decision-citation-drift.mjs`: no new findings (57 baselined). `test/scripts/check-decision-citation-drift.test.mjs`: 31 pass, 1 fail ("CLI run against the real repo root"): every one of the 39 findings is under the git-ignored `.agents/skills/` projection present in this worktree; none is in a tracked file or in files I touched.
- No CHANGELOG line: no user-visible product change.
