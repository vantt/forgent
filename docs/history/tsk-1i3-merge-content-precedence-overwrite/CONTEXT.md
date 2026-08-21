# tsk-1i3 — merge-content-precedence-overwrite — CONTEXT

## Feature boundary

The item's own text asked for a fix inside `merge.mjs`'s merge-into-main
mechanism ("một pre-merge... integrity check từ chối/chặn khi nội dung
`.fgos/` log files sắp merge vào KHÔNG phải superset/ahead-of nội dung
live hiện tại trên target"), citing commit `e921fdb4` (2026-08-20
22:51:58 +0700) as evidence that the mechanism only warns. Discovery-stage
research (`RESEARCH.md` Round 1) found that premise false: `merge.mjs`'s
`mergeRunnerItem` already stages every merge, checks the staged diff for
any `.fgos/` path, and hard-aborts (`fgos-write-rejected`, live since
2026-08-17, three days before the incident) — never a warn. The event log
shows the real `fgos approve` attempt on `tsk-6al` at 22:33+07 correctly
aborting with "main unchanged"; the actual incident commit 18 minutes
later left **zero** corresponding engine event, meaning it did not go
through `fgos approve` at all — most plausibly a manual `git merge`
run directly on the shared main checkout.

This exploring pass re-aims the item's boundary accordingly: **the fix
target is the shared main checkout's own `.githooks/pre-commit` hook**
(`.githooks/pre-commit`), which fires for every `git commit` against that
checkout regardless of actor — human, agent, or CI, per its own header
comment — not `merge.mjs`, which only runs inside `fgos approve`'s own
call path and therefore cannot close a gap that a manual `git merge`
bypasses entirely. Confirmed non-overlapping with prior work: `tsk-56u`
(delivered, `mergedSha 25f7321d`) already added two checks to this same
hook — `stagedFgosDeletions` (staged **deletions** under `.fgos/`,
`--diff-filter=D` only) and `stagedFgosChangesOnWorkerBranch` (any staged
`.fgos/` change, but only when `HEAD` is a `fgw/*` branch). Neither fires
for the incident's actual shape: a commit with `HEAD=main` that
**modifies** (not deletes) `.fgos/*.jsonl` content with a regressed
version. `tsk-1vc` (delivered) covers a different mechanism entirely
(silent event-history reversion from a concurrent-write race, not a
merge/commit content-precedence gap).

Out of scope: re-litigating `tsk-1vc`'s or `tsk-56u`'s own already-closed,
delivered work (cited, not reopened); identifying who/what specifically
ran the `e921fdb4` manual merge (not recoverable from git/event-log
evidence alone, and not required to close the guard gap); `tsk-9tu`'s
separate open discussion about the dispatch-out-of-process policy
question.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | scope re-aimed to the shared main checkout's .githooks/pre-commit hook, not merge.mjs's mergeRunnerItem (already correct, already refuses .fgos/ diffs, predates the incident, and is unreachable by a manual git merge run outside fgos approve -- confirmed: e921fdb4 has zero fgos-engine event, and the pre-commit hook's 3 existing checks all scope to fgw/* branches or full-deletions only, never firing when HEAD=main and a commit modifies .fgos/*.jsonl content) |
| D2 | guard scope is content-precedence, not parent-count -- applies to ANY commit landing on the main checkout's own default branch that touches .fgos/*, not narrowed to merge commits specifically. A single-parent commit (e.g. the periodic checkpoint auto-commit) is trivially compliant since it only appends, so scoping by parent count would add complexity the invariant itself does not need |
| D4 | acceptance bar is a cheap, synchronous-hook-safe heuristic (e.g. per-file line-count non-decrease for .fgos/*.jsonl) -- it does not need full semantic/content-hash correctness, which would cost real latency on every commit. It only needs to catch the class of regression already observed (bulk content loss, e.g. events.jsonl losing 352 lines), not every theoretical malformed-but-same-length edit. The exact comparison mechanism is fgos-coding-planning's call |
| D3 | hard refuse, with no bypass flag -- matches the item's own original ask and the track record (2 confirmed real data-loss incidents from adjacent guard gaps, tsk-1vc and this incident). Unlike tsk-1ji's opportunistic checks (detect-and-warn, chosen because they run on every claim/return call and a false positive would block legitimate high-frequency work), this guard sits on the rare commit-time path for the main checkout only, so the false-positive-blocking-legitimate-recovery cost that justified detect-and-warn elsewhere is much weaker here |

## Pinned terms

- **Content-precedence** (this item's own scope, not to be confused with
  `tsk-1vc`'s truncation-detection scope): a commit landing on the main
  checkout's default branch must never stage `.fgos/*` content that
  regresses relative to what `HEAD` already has — per D4, checked with a
  cheap per-file line-count-non-decrease heuristic, not full
  content-hash/semantic diffing.
- **The incident** (`e921fdb4`, 2026-08-20 22:51:58+07): the commit this
  item's own description cites as evidence — confirmed by this pass to
  have bypassed `fgos approve` entirely (no corresponding engine event),
  overwriting 4 live `.fgos/*.jsonl` files with `fgw/tsk-6al`'s
  frozen/regressed content; restored 58s later by `165bc0cb`.

## Scout evidence cited

- `src/runner/merge.mjs:1-26` (module header), `:1264-1330`
  (`mergeRunnerItem`'s post-stage `.fgos/` check + verify-before-commit),
  `:159` (`isFgosPath`) — the existing, already-correct, already-refusing
  guard, confirmed live in main's own tree at the incident commit
  (`git show e921fdb4^1:src/runner/merge.mjs | grep fgos-write-rejected`,
  exit 0) and first introduced 2026-08-17 22:44:13+07 (`git log
  -S"fgos-write-rejected" --reverse -- src/runner/merge.mjs`).
- `.githooks/pre-commit` (full file read) — the actual fix target.
  `stagedFgosDeletions` (tsk-56u, `--diff-filter=D` only),
  `stagedFgosChangesOnWorkerBranch` (tsk-5pb, `fgw/*` branches only),
  `staleWorktreeIndexRefusal` (tsk-1d7, `fgw/*` branches only),
  `currentFgwBranchIfMainCheckout` (tsk-4hkd, refuses main sitting on a
  `fgw/*` branch, unrelated to this gap), STR65 main-checkout-lock
  acquire (blocks only a genuinely concurrent session, not an uncontested
  manual merge) — none of the five checks in this hook fire for a commit
  with `HEAD=main` that modifies (not deletes) `.fgos/*` content.
- `.fgos/events.jsonl` (main checkout, live) — `tsk-6al`'s own event
  history around the incident window: `seq 22679`-`22680` (15:33:06Z,
  real `fgos approve` attempt, correctly aborted, "main unchanged");
  `seq 22793` (2026-08-21T01:45:16Z, the item's real `delivered` event,
  `mergedSha 2f72ca22...`, 7 hours after and a different SHA from the
  incident commit); no event of any kind in the window
  `15:33:07Z`-`16:50:47Z`, which contains the incident commit
  (`15:51:58Z`).
- `git show --stat e921fdb4`, `git merge-base 94746624 6e47455c` (==
  `94746624`, confirming a `--no-ff`-forced ancestor merge, matching
  `mergeRunnerItem`'s own flag) — git forensics on the incident commit
  itself.
- `fgos list --id tsk-56u --json` / `fgos list --id tsk-1vc --json` —
  confirmed both dependencies are `delivered`, and read their own scope
  text directly to confirm no overlap with this item's re-aimed boundary.
- `fgos tool query --capability impact-analysis --status present` —
  GitNexus is registered and `present`, but a same-session PostToolUse
  hook reported its index as stale (last indexed `7bb3231`, behind
  current HEAD) — **impact-analysis: degraded**. `fgos-coding-planning`/
  `fgos-coding-validating` should treat any GitNexus blast-radius read for
  this item's own change (`.githooks/pre-commit`) as unconfirmed until a
  fresh `gitnexus analyze` runs, or cross-check with a direct grep the way
  this pass already did for `merge.mjs`/the hook itself.

## Canonical references

- `docs/history/tsk-1i3-merge-content-precedence-overwrite/RESEARCH.md`
  — the full discovery-stage research round this CONTEXT.md summarizes.
- `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`
  — the original incident timeline and the report that raised this item.
- `plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md`
  — the ADR0020 history and the `worktree-merge-staged-verify-gate`
  pattern comparison that first flagged `merge.mjs`'s own staged-merge
  structure as already matching that pattern.
- `.githooks/pre-commit` — the fix target this item's plan will extend.
- ADR0020 (worktree isolation: `.fgos/` is stripped from every `fgw/<id>`
  worktree at creation and never carried live by a worker branch) — the
  invariant every existing guard in this area, and this item's own new
  one, exists to protect.

## Outstanding questions

None
