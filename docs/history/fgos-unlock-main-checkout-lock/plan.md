# fgos-unlock-main-checkout-lock — plan (tsk-3h4)

Decisions this plan builds on: D1/D2/D3 in
`docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md`. None reopened here.

## Mode

**high-risk.**

Flags counted (of the 10 in the mode-gate checklist):

1. **audit/security / data-integrity** — the object being deleted is the
   guard against the STR65 `.git/index` clobbering race (decision 0021). A
   wrong staleness judgment here reopens real concurrent-writer corruption,
   not a cosmetic bug.
2. **public contracts** — adds a new entry to `COMMAND_REGISTRY`
   (`src/cli/command-registry.mjs`), part of `fgos --help --json`'s
   documented manifest surface (`test/cli/fgos-manifest.test.mjs`).
3. **existing covered behavior** — extends `src/runner/main-checkout-lock.mjs`
   and touches the same lock `claim-port.mjs` already depends on
   (`test/runner/main-checkout-lock.test.mjs`, `test/runner/claim-port.test.mjs`,
   `test/e2e/main-checkout-lock-hook.test.mjs` — 7/7 green today, must stay
   green).

Flag #1 is also one of the rule's named hard gates (data
loss/corruption risk) — that alone forces high-risk regardless of the count.
A `standard` plan would not honestly cover the proof burden this item
carries: the whole reason it exists is to touch a corruption guard by hand.

## Approach

### What actually needs fixing (scout correction, not a new decision)

`fgos-coding-exploring`'s CONTEXT.md scoped this as "clear a stuck lock," but a
closer read of `src/runner/main-checkout-lock.mjs`'s own reclaim loop
(`tryAcquireOnce`, called from `acquireMainCheckoutLock`) shows a
dead-pid/expired-ttl `HELD` lock **already self-heals** on the very next
`acquireMainCheckoutLock` call — no human ever needs to intervene for that
case; `fgos take`/`fgos pick` retried a second time already clears it. The
*only* status with zero automatic recovery today is `AMBIGUOUS`
(unparseable JSON content — the string-identity-without-`ttlMs` branch of
`AMBIGUOUS` never actually fires here, since both current callers,
`claim-port.mjs:80` and `.githooks/pre-commit`, always pass a `ttlMs`).
This narrows, not reopens, D2/D3: the verb still needs to handle all three
outcomes (D2's "refuse when live" requirement stands), it just means the
genuinely-new code is smaller than it first looked — one case, not three.

### Design (D1 + D2 realized)

1. **`src/runner/main-checkout-lock.mjs`** — add one new exported function,
   `forceReclaimAmbiguousLock(dir, { now = Date.now() } = {})`:
   - Reads the lock file; if missing, returns `{ status: 'already-clear' }`
     (idempotent, mirrors `releaseMainCheckoutLock`'s own idempotency).
   - Re-parses with the module's existing `parseLockContent`-equivalent
     check. If it now parses (a legitimate holder wrote a fresh, valid
     record since the caller's own earlier read), returns
     `{ status: 'no-longer-ambiguous' }` and touches nothing — same
     TOCTOU-safe re-read-before-unlink discipline `tryAcquireOnce` already
     uses for its stale-numeric-pid branch (lines 173–192).
   - Only unlinks when the content is still unparseable at the moment of
     the second read. Returns `{ status: 'reclaimed' }`.
   - Zero-dep, same file, same lineage — not a new module.

2. **The verb calling it** — the new `fgos` verb (name TBD by
   implementation, e.g. `fgos unlock`) does no bespoke lock inspection of
   its own for the `ACQUIRED`/`HELD` cases; it just calls the *existing*
   `acquireMainCheckoutLock(dir, { identity: <one-off session id>, ttlMs:
   DEFAULT_TTL_MS })` and branches on the result already defined by that
   primitive:
   - `ACQUIRED` → the call itself just reclaimed a stale-or-free lock as a
     side effect; immediately `release()` (the verb never wants to *hold*
     the lock, only clear it) → report "cleared" or "was already free."
   - `HELD` → refuse, report `holderPid` verbatim (D2) — no new code, this
     status already carries the identity.
   - `AMBIGUOUS` → call the new `forceReclaimAmbiguousLock` from step 1 →
     report its result.
   - `touchesState: true`, `externalEffect: false` in the registry entry
     (writes/deletes a local file, no network/process side effect).

3. **`.claude/skills/fgos/fgos-unlock/SKILL.md`** (new file, new directory
   — mirrors the existing one-skill-per-directory layout used by
   `fgos-routing`/`fgos-coding-exploring`/etc.). Deciding this now closes
   CONTEXT.md's third deferred question: a dedicated file, not a section
   folded into `fgos-routing`'s gate contract, because this isn't a stage
   -routing concern (`fgos-routing`'s whole job is orienting on stage) —
   it's a narrow recovery procedure triggered by a specific CLI failure
   (`lock-held`/`lock-ambiguous` from `claimWork`), and needs its own
   frontmatter `description` so the Skill tool's own matching can surface
   it on phrases like "take failed with lock held" without that noise
   living inside `fgos-routing`. Content: read the CLI's own error/refusal
   message, never second-guess it by hand-deleting the file directly (the
   entire point of this item is to stop that hand-`rm` habit), call the new
   verb, surface its result.

### Alternatives rejected

- **Fold the fix into `fgos doctor --fix`.** Rejected in `fgos-coding-exploring`
  (D1) — `doctor` is explicitly documented and tested as read-only
  (`bin/fgos.mjs`'s `case 'doctor'` comment: "Never writes anything"); a
  `--fix` mode would be a second write path bolted onto a verb whose
  contract currently promises none.
- **Skill-only, no CLI verb, just document `rm .fgos/main-checkout.lock`.**
  Rejected in `fgos-coding-exploring` (D1/D2) — no code path could enforce the
  live-holder refusal; an agent following prose instructions has no way to
  safely tell `HELD`-by-live-pid apart from `AMBIGUOUS` before deleting.
- **Reimplement staleness/parsing logic inline in `bin/fgos.mjs`.** Rejected
  here — `main-checkout-lock.mjs`'s own file-header commits to each of the
  four sibling locks staying "independently testable and zero-dep";
  `forceReclaimAmbiguousLock` living beside `acquireMainCheckoutLock`/
  `releaseMainCheckoutLock` keeps that property and lets it reuse the
  existing TOCTOU-safe re-read pattern instead of writing a second copy.

## Risk map

| Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `forceReclaimAmbiguousLock`'s re-read-before-unlink | High — a race here is exactly the STR65 corruption class this lock exists to prevent | Unit test: two identities racing where one writes a *valid* record between the function's first and second read must NOT be unlinked (mirrors `test/runner/main-checkout-lock.test.mjs`'s existing stale-pid race test at line ~173) |
| Verb's `ACQUIRED`/`HELD` branching | Medium — reuses `acquireMainCheckoutLock` as-is, but wrong branch mapping would silently hold or silently refuse-when-clear | Unit test per status: free, dead-pid-stale, live-pid-held, corrupt-content — asserting the verb's reported outcome, not just the primitive's |
| `COMMAND_REGISTRY` entry / `--help --json` manifest | Low-medium — mechanical, but `fgos-manifest.test.mjs` already asserts registry shape | Run `test/cli/fgos-manifest.test.mjs` and `test/cli/fgos-help.test.mjs` unmodified-assertions still pass, plus one new assertion for the added entry |
| End-to-end: verb run against a real corrupt lock file in a temp repo | Medium — integration surface, easy to get fs paths wrong | Extend `test/e2e/main-checkout-lock-hook.test.mjs`'s temp-repo harness (or a sibling e2e test) with one real corrupt-lock-file + verb-invocation case |
| Skill file content | Low — docs only | Read-through against `fgos-coding-exploring`/`fgos-coding-planning`'s own frontmatter + hard-rules + gate shape for consistency |

## Files touched

- `src/runner/main-checkout-lock.mjs` — add `forceReclaimAmbiguousLock`
- `src/cli/command-registry.mjs` — new verb entry
- `bin/fgos.mjs` — new verb case (dispatch to the lock module)
- `test/runner/main-checkout-lock.test.mjs` — unit tests for the new export
- `test/cli/fgos.test.mjs` — integration tests for the new verb's 4 outcomes
- `test/cli/fgos-manifest.test.mjs` / `test/cli/fgos-help.test.mjs` — extend
  for the new registry entry
- `test/e2e/main-checkout-lock-hook.test.mjs` (or a new sibling e2e file) —
  one corrupt-lock recovery case
- `.claude/skills/fgos/fgos-unlock/SKILL.md` — new skill file

## Ordering

`fgos graph --json`: tsk-3h4 is not on the current critical path
(`tsk-34y → tsk-3wr → tsk-3wr-3 → tsk-3wr-2 → tsk-3wr-1`, depth 5), but
appears in `topUnblock` (`unblocks: 1, newlyUnblocks: 2`) — finishing it as
one piece clears that unblock; splitting would only delay it for no
benefit, consistent with treating this as a single item (below).

Within the item, the dependency order is mechanical, not a judgment call:
lock-module export (1) → verb wiring that calls it (2) → tests for both →
skill file (3, has no code dependency on 1/2 but documents their final
shape, so written last).

## Split decision

No split. One coherent piece: the lock-module export, the verb, and the
skill wrapper are only meaningful together (a verb with no export has
nothing to call; a skill with no verb has nothing to wrap, per D1). `fgos
graph --what-if` was not run for alternate splits because there is no
second candidate piece to compare against — nothing here is independently
shippable.

## Cases to prove (input for `fgos-coding-validating`)

- Lock file missing → verb reports "already clear," no file written.
- Lock file with a dead numeric pid → reclaimed and released in one call.
- Lock file with a live numeric pid, fresh → refused, holder pid reported,
  file untouched.
- Lock file with a live numeric pid, past `ttlMs` → reclaimed (matches
  existing primitive behavior, not new).
- Lock file with unparseable content → `forceReclaimAmbiguousLock` fires,
  file removed.
- Lock file with unparseable content that becomes valid between the
  function's two reads (simulated race) → NOT removed.
- `fgos --help --json` includes the new verb with correct
  `touchesState`/`externalEffect` labels.
