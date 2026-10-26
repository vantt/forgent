# Documentation-cutover lease hook fixes from the OPC review (Doer brief, code slice)

Status: Lead brief under L13-30 and L13-31. OPC, the standing `.githooks` reviewer, reviewed the hook part of G4 on `origin/review/doc-git-one-door` (`eb744281d`). The verdict is **CHANGES**. The text is on origin/main: board log line `2026-10-26 11:01 OPC` in `plans/261017-1313-fgos-platform-program-board/log.md` (read it with `git show origin/main:<path>`). Read `docs/platform/git/spec.md` §7, "Documentation-cutover hook contract", and `plans/260925-documentation-authority-unification/cutover-write-lease-design.md`.

1. **High: `src/runner/documentation-cutover-lease-hook.mjs` `guardReferenceTransaction`.**
   - The guard judges every `refs/heads/main` move against the LOCAL main's sidecar.
   - So on another machine, a plain `git pull` (or `merge --ff-only`) of main is refused when it brings the holder's already-landed docs commits, or the acquire/release commit itself.
   - Fix: admit a main update whose new OID is already published, meaning it is an ancestor of, or equal to, `refs/remotes/origin/main`. The holder's typed doors judged it.
   - Keep refusing everything else the guard refuses today.
   - Add a two-clone proof to `test/e2e/documentation-cutover-lease-hooks.test.mjs`: clone B has the hook wired; the holder in clone A acquires, lands a scoped docs change and releases, all through the existing test doors; B pulls across each of these and is admitted. A local unpublished main move in B is still refused. The current pull case at about line 791 covers only a pull from a local branch.
2. **Medium: §7 text.** The spec says "linked worktrees are covered", but they are not fully covered. The commit-time guard does not run for `git merge`, `cherry-pick`, `rebase`, `am` or `--no-verify` in a linked worktree. The reference guard watches only the local `refs/heads/main`, so `git push origin HEAD:main` from a linked worktree passes both hooks. Name these uncovered routes in §7, and say the lease does not stop them; it is a convention plus the typed doors.
3. **Low.** Creating main while it is absent, with a zero old OID, makes `rev-parse refs/heads/main` throw, so the guard fails closed. Diff against the empty tree instead, and add a unit case to `test/runner/documentation-cutover-lease.test.mjs`.
4. **Low.** Spec §18 line "2026-10-22 — Documentation-cutover hardening" is not an owner decision. Move it into §7's dated history.

Doc edits to `docs/platform/git/spec.md` change bound units. After editing:
- run `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0join/join.py --pin HEAD`;
- run `python3 -B .../fchain/check.py --pin HEAD`, then restore `fchain/check.json` if only volatile fields changed, and delete only an untracked `fchain/chain-check-*.json` it writes;
- run `python3 -B .../rebind/rebind.py --check`.

If a G0 binding or the ownership audit goes stale because of the spec edit, record target-digest edges in `rebind/g0-rework-rebindings.json` in its existing format (see records 149–154). Leave the edges `authored-pending-independent-review` and report them.

Proofs, all exit 0:
- `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/runner/documentation-cutover-lease.test.mjs`;
- the same for `test/e2e/documentation-cutover-lease-hooks.test.mjs`; if it needs the host binary or a native addon, report it as not run, and the Lead runs it;
- the three plan checks above.

Write `reports/phase-09/git-one-door/hook-fixes/receipt.md` and `receipt.json` with each fix, the tests added, and every command with its exit code.

Writable (exact):
- src/runner/documentation-cutover-lease-hook.mjs
- .githooks/reference-transaction
- test/runner/documentation-cutover-lease.test.mjs
- test/e2e/documentation-cutover-lease-hooks.test.mjs
- docs/platform/git/spec.md
- plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/hook-fixes/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-rework-rebindings.json

No other docs or ledgers. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
