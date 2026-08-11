# tsk-45y — worktree/.fgos decouple proposal re-checked against current code (stale)

## Feature boundary

tsk-45y proposed a redesign: make `.fgos` an independent, per-worktree
single-writer area (no `main-checkout.lock` blocking writes from a
worktree), with a human manually committing/pushing `.fgos` back to main
"at an appropriate moment." The stated premise (verbatim): worktrees
today isolate `.fgos` and write to it freely, and that writing frequently
conflicts with the main checkout, causing processes to keep waiting on
each other.

This skill's job here is not to design the redesign — it is to check
whether the stated premise still holds against current code before any
such redesign is worth planning.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | tsk-45y's stated premise does not match current code and is stale. Confirmed via direct code read (this session) rather than trusting the prior decision note alone: (1) `main-checkout.lock` (`src/runner/main-checkout-lock.mjs`) is a separate lock from `events.lock` (`src/state/events.mjs`) and only guards two short windows — the `claim` moment (`claim-port.mjs:96`) and the merge/verify/commit window (`merge.mjs:650`) — both run from the real main checkout; it has never guarded ordinary state writes. (2) Dispatch worktrees (`src/runner/worktree.mjs`, ADR0020, `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`) have `fs.rmSync(<worktree>/.fgos, ...)` run immediately after checkout — by design, no writable `.fgos` path exists inside one at all. (3) Session worktrees (`pick`'s `EnterWorktree`, `src/runner/session.mjs`) carry `.fgos` as a **symlink** back to the single shared store (D10, "never copied, always symlinked back"), not an isolated copy — no divergence is structurally possible there either. Grep confirms no other call site expands `main-checkout.lock`'s scope (`rg main-checkout-lock` across `src/`/`test/`/`docs/`). |
| D2 | The one bug that ever matched tsk-45y's literal description (`EnterWorktree` + cwd-relative `dataDir()` silently recreating a divergent local `.fgos/events.jsonl` inside a worktree) is `tsk-56t` — **status done**. Closed by `tsk-4fu-2`'s `requiresExistingStore` guard (merged before tsk-56t) plus tsk-56t's own locked option (b): `pick`'s `EnterWorktree` never applies to state-writing verbs; a `--dir` flag lets a worktree-resident session target main explicitly (`docs/how-to/run-a-state-verb-from-inside-a-worktree.md`). |
| D3 | `tsk-49a` (dep of this item, status done) is an unrelated session-role claim race in the dispatcher, not a locking/worktree-.fgos issue — orthogonal, already fixed. |
| D4 | `tsk-2eq`, which had self-recorded "xung đột hướng với tsk-45y — phải chờ quyết định trước khi sửa," was independently re-examined via code scan on 2026-08-02 (`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`, D3) and shipped its fix (lockRoot separated from git-op cwd) without waiting on tsk-45y — confirming no real tension existed between the two items. |
| D5 | The residual UX pain this item's proposal was actually reaching for — a process waiting on `main-checkout.lock` during a slow/hung verify — already has a shipped, narrower fix: `tsk-6c2`'s `--wait[=<ms>]` flag on the CLI verbs that call `acquireMainCheckoutLock` (status done, `test/cli/fgos.test.mjs:7796`). No further mitigation is pending on this item's outcome. |
| D6 | No implementation work remains for this item. It resolves as **wontfix** (resolved-by-context): the architecture it asked to change was never the architecture actually running, the one real bug matching its description was already fixed by other items, and the softer UX complaint already has its own shipped fix. This is a closure, not a hand-off to `fgos-coding-planning` — there is nothing left to shape or build. |

## Pinned terms

- **Silent divergence** — a state-writing verb creating/writing its own
  `.fgos/` inside a worktree cwd, invisible to the main checkout until a
  human manually merges the branch. Already closed (`tsk-56t` D1, cited in
  D2 above) — this is the only failure mode that ever matched tsk-45y's
  description.
- **Resolved-by-context** — closing an item as `wontfix` because the
  premise it was filed against no longer holds, verified by re-reading the
  current code rather than assumed from a decision-log note.

## Scout evidence

- `rg -- "main-checkout-lock" src bin test docs` (this session, 2026-08-02):
  every hit is either the lock module itself, `claim-port.mjs`'s claim-time
  acquire, `merge.mjs`'s merge-time acquire, the `--wait`/`lock-wait.mjs`
  retry layer, or docs describing that same narrow scope — no hit expands
  the lock into a per-worktree write path.
- `fgos tool query --capability impact-analysis --status present`: 1
  provider (`gitnexus`, status `present`) — `impact-analysis: full` per
  `CLAUDE.md`'s gate. Informational only; this item makes no code change.
- `fgos list --id tsk-45y --json`: `discovery` array empty (no prior
  `judgeDiscovery` verdict to reconcile against); `deps` = [`tsk-56t`,
  `tsk-49a`], both `status: done` — item was already dependency-unblocked
  going into this pass.
- Prior decision log on `tsk-45y` itself (2026-08-02 entry) had already
  reached the same D1 conclusion informally; this pass independently
  re-derives it from source rather than re-stating the note, per this
  item's own acceptance-criteria discipline seen on sibling items
  (`tsk-49a`'s "not because the assumption was found broken" standard).

## Canonical references

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020)
- `src/runner/main-checkout-lock.mjs`, `src/runner/worktree.mjs`,
  `src/runner/session.mjs`, `src/state/events.mjs`
- `docs/history/fgos-worktree-state-write-guard/CONTEXT.md` (tsk-56t)
- `docs/how-to/run-a-state-verb-from-inside-a-worktree.md`
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  (D3 — tsk-2eq/tsk-45y tension re-examined, no real conflict found)
- `plans/reports/research-260730-1133-open-lock-contention-items-survey.md`
  (original framing of tsk-45y as an open architectural fork)

## Outstanding questions deferred to planning

None — this item closes here (D6). No implementation work is being handed
to `fgos-coding-planning`.
