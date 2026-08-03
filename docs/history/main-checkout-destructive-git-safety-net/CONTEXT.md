---
title: Main-checkout destructive git-op safety net
item: tsk-3au
---

# tsk-3au — Safety net for `git reset --hard` on the shared main checkout

## Feature boundary

A session ran `git reset --hard <sha>` directly on the main checkout (via
Bash, outside any fgOS verb) to undo a mis-landed commit, checking only the
3 files it meant to touch first instead of a full `git status`. The reset
discarded other uncommitted work that predated this session: edits in
`src/runner/claim-port.mjs`, `src/runner/loop.mjs`, `src/runner/worktree.mjs`,
plus `.fgos/entropy-history.jsonl`, `.fgos/events.jsonl`,
`.fgos/coexistence.json` — state other in-flight merge-loop/runner
processes may have depended on. None of it was ever `git add`-ed, so no
stash/reflog/blob could recover it.

This item builds a safety net so a destructive `git reset --hard` on the
main checkout can no longer silently discard another process's uncommitted
work: a required full-tree status check plus explicit human confirmation
before the reset proceeds, backed by both a documented reminder and a real
code-level choke-point.

Out of scope (D1): the causally-upstream mistake — a session's cd/absolute
path drifting back to the main checkout instead of staying in its
`EnterWorktree`-switched worktree, which is what put the session in a
position to need the reset in the first place. That is a different problem
surface (harness-owned `EnterWorktree` tool, not fixable from inside fgOS
code) and is tracked separately as `tsk-8v1`.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Scope is the destructive-git-op safety net only. The EnterWorktree/cd path-drift detection idea (item description's second half) is filed as a separate follow-up, `tsk-8v1` — different problem surface (harness-owned tool fgOS can't modify), keeps this item narrow per this repo's existing choke-point-item convention (e.g. `choke-point-workingtree-clean-duplication`). |
| D2 | Fix mechanism is both layers: (1) a documented reminder in the fgOS skill layer (mirrors `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` D2's pattern for the same-day twin incident tsk-4hk) added to `plugins/fgOS/skills/pick/SKILL.md`, `plugins/fgOS/skills/cook/SKILL.md`, and `AGENTS.md`; (2) a real code-level choke-point — a shared helper enforcing a full `git status --porcelain` check (whole main checkout, not scoped to the files the caller intends to touch) plus explicit human confirmation before any destructive `git reset --hard` on the main checkout runs. Doc-only (tsk-4hk's fix) was judged insufficient here because tsk-3au's incident actually lost data (tsk-4hk's did not) and the item's tier is already `heavy`. |

## Pinned terms

- **Destructive git op (this item's scope)** — specifically `git reset
  --hard` run against the main checkout. The item's own description names
  this exact command, not a general "any destructive git command" class;
  broadening to `git clean -f`, `checkout --force`, etc. is a planning-time
  question (does the same mechanism generalize for free, or does the
  narrower scope ship first) — not locked here as in-scope.
- **Main checkout** — the one shared working tree every session's `fgos
  <verb>` call resolves against via `git rev-parse --git-common-dir`
  (distinct from a per-item `.claude/worktrees/<id>-*` worktree, which is
  never shared across sessions).

## Scout evidence

- Grep across `src/` and `bin/fgos.mjs` for `reset --hard` / `execSync.*reset`
  / `spawnSync.*reset`: no call site exists in fgOS's own code (only an
  unrelated comment at `src/runner/loop.mjs:656`). The incident's
  destructive command ran via the agent's own Bash tool, outside every
  fgOS verb — confirms a pure `fgos`-CLI-level guard cannot intercept it;
  the guard has to live in a shared helper that skill-layer flows are
  taught to route through, plus a doc reminder for the raw-Bash path.
- `.githooks/pre-commit` + `src/runner/main-checkout-lock.mjs`
  (`docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`):
  existing infrastructure guards concurrent **commits** clobbering the main
  checkout's `.git/index` — a different failure mode (race between two
  writers), not this item's (a single writer discarding uncommitted work
  via `reset --hard`). Git has no native hook for `reset`, so this
  precedent's hook mechanism does not directly extend to this item's gap;
  the new guard has to be an explicit call in the flow that would otherwise
  run `reset --hard`, not a git hook.
- `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`
  + `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` D2: the
  same-day twin incident (direct `git checkout <fgw/branch>` on main
  checkout) chose a doc-reminder-only fix, explicitly no code gate. Cited
  here as the precedent D2 deliberately goes beyond, given tsk-3au's higher
  severity (real data loss vs none).
- `docs/history/promote-to-component/CONTEXT.md` D3 + its Scout section:
  a separate item (`tsk-3gx`) already cites tsk-3au's incident as
  precedent grounding its own "bail to human if the target worktree looks
  active" threshold — confirmed no scope overlap with tsk-3au itself (that
  item is about branch retargeting during component promotion, not the
  general reset-safety-net this item builds).
- `src/runner/merge.mjs` (`isWorkingTreeClean`/`isMainTreeClean`) and
  `bin/fgos.mjs:98,130` (`isWorkingTreeClean`, subtree-scoped): existing
  precedent for a shared git-status-check helper already used to gate
  `return`/`approve` — the pattern this item's code-level guard (D2) should
  follow, though this item's check must be whole-repo-scoped (not
  subtree-scoped like `return`'s), since a `reset --hard` on the main
  checkout affects the entire tree, not just the acting item's own files.
- `choke-point-workingtree-clean-duplication` (dep, `status: done`): the
  item tsk-3au's own description said was permanently blocked by this
  incident's fallout has since been resolved (merged manually) — confirms
  the immediate fallout is closed; this item is about preventing
  recurrence, not un-blocking anything still stuck.
- `fgos tool query --capability impact-analysis --status present`:
  `gitnexus` present via MCP — impact-analysis posture is **full** for
  this session.

## Canonical references

- `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` — the
  doc-reminder-only precedent this item's D2 deliberately extends beyond.
- `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`
  — the same-day twin incident.
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` +
  `src/runner/main-checkout-lock.mjs` — existing (different-purpose)
  main-checkout concurrency-safety infrastructure.
- `src/runner/merge.mjs` (`isWorkingTreeClean`) — existing git-status-check
  helper pattern to follow for D2's code-level guard.
- `tsk-8v1` — the split-out follow-up item for the EnterWorktree/path-drift
  half (D1).

## Gate note

`fgos discover`'s `--verdict clear --verify` path gained a mid-session,
concurrently-merged secondPass semantic-correctness judge (`tsk-5q5-1`,
merged into main by another process while this item was mid-clarify) that
rejects a non-executable or claim-irrelevant `verify` string — the
long-standing repo convention of leaving `verify` as the P15 placeholder at
clarify time (seen in many older `CONTEXT.md`s) no longer clears this gate.
User's explicit call (asked live, since this is an engine-behavior
conflict no clarify-stage judgment call can resolve alone): write a minimal
RED acceptance test now rather than defer further. `test/runner/main-checkout-reset-guard.test.mjs`
was added — 3 assertions against a not-yet-existing
`src/runner/main-checkout-reset-guard.mjs#assertSafeMainCheckoutReset`
(refuse when dirty+unconfirmed, allow once confirmed, allow outright when
clean) — confirmed genuinely RED (`ERR_MODULE_NOT_FOUND`) before commit.
The module path and function name are a placeholder, not a locked design —
planning may rename freely, but must keep these three observable behaviors
as tsk-3au's acceptance bar unless it deliberately edits this test with its
own recorded rationale.

## Outstanding questions deferred to planning

- Exact shape of the code-level guard (D2(2)): a new `fgos`-CLI verb
  (invocable from Bash directly, e.g. `fgos safe-reset`), or a shared
  helper function skill docs point sessions at, or both — implementation
  choice for planning.
- Whether "explicit human confirmation" is enforced by the guard refusing
  to proceed without an interactive yes, or by requiring the caller to pass
  an explicit `--confirm`/`--i-understand`-style flag once status has been
  shown — an implementation detail, not a product decision.
- Whether the doc reminder (D2(1)) also needs a line in
  `plugins/fgOS/skills/fgos-routing/SKILL.md` or stays scoped to
  `pick`/`cook`/`AGENTS.md` as tsk-4hk's precedent did — planning's call
  once it sees which flows can actually reach this danger.
