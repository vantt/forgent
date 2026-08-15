# Plan — tsk-4w4

Mode: small

**Lane decided per `fgos-routing`'s Mode-gate** (no lane handed off by
`/fgOS:cook`'s own free-run driving, applying the gate directly, same
tsk-da1 direct-entry fallback branch 3 `tsk-2te` already used). Flag
count: 0 of the 10 hard-gate flags apply on their own merits (no auth, no
authorization, no data-model change — the two entries are removed, not
reshaped; no audit/security surface, no external system, no cross-
platform concern, no existing covered behavior at risk — confirmed zero
tests depend on these two entries, single domain `coding`). Rounded up to
**small** rather than **tiny**, not because of risk but because of real
procedural weight: the fix is not a normal branch commit — it requires a
direct main-checkout operator commit outside this item's own `fgw/tsk-4w4`
branch (see Approach), the same shape `tsk-5ge`'s own precedent used.

## Approach

**Chosen path:** remove `runner.capacities.judge-discovery` and
`runner.capacities.judge-decompose` from the committed `.fgos/config.json`
— confirmed dead in `RESEARCH.md` Round 1 (zero live resolvers in
`src`/`bin`, zero real test dependence, explicitly retired by tsk-1x3/
tsk-27y's Native-First Dispatch Doctrine). Land the edit the one proven-
safe way this repo's own history already established
(`docs/how-to/fix-fgos-write-rejected-merge-block.md`, precedent
`tsk-5ge`/`tsk-49u`): a **direct, single-parent commit on the main
checkout**, never through this item's own branch (ADR0020 — a
`fgw/<id>` branch carrying a `.fgos/` diff is permanently rejected at
merge time, `fgos-write-rejected`).

**Alternatives rejected:**
- *Commit the config change on `fgw/tsk-4w4` itself, let the merge gate
  catch it.* Rejected — this is not a workaround to discover, it is a
  documented, permanent wall (`fix-fgos-write-rejected-merge-block.md`);
  attempting it would only reproduce the exact failure four prior items
  (`tsk-n4i-1`/`tsk-5vf`/`tsk-4eu`/`tsk-5ge`) already hit and fixed the
  same way.
- *Leave the entries in place since they are harmless (truly dead, no
  runtime effect).* Rejected — same reasoning the `coding-classify-intake`
  precedent doc gives: dead config left in a live, shared file is exactly
  what caused a THIRD item to have to go looking for it later; the cost of
  removing it now (one line-item edit, already proven safe) is far lower
  than leaving it to confuse the next reader of `.fgos/config.json` or the
  next session investigating "what actually uses dispatch."
- *Also touch `test/runner/dispatch.test.mjs`'s unit tests that use these
  names as example fixtures.* Rejected — `RESEARCH.md` Round 1 confirms
  those tests build their own self-contained `cfg` object; they never read
  the real `.fgos/config.json`, so removing the real entries cannot break
  them. Renaming the fixture's example names to something else would be
  scope creep with no functional reason (unlike `tsk-49u`'s precedent,
  which DID have a real pinning test to update — this item genuinely has
  none).

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `.fgos/config.json` capacities removal | light — two proven-dead keys removed from a JSON object; `loadRunnerConfig`/`validateRunnerConfigShape` place no minimum-count requirement on `capacities` | `npm test` run against the edited main checkout, full suite green, before this item's own branch is returned |
| Coordination with concurrent sessions on the shared main checkout | the one real non-zero risk — the main-checkout lock was observed contended by another live session earlier this same conversation | `git status` on the main checkout checked clean immediately before the edit; the edit itself is a two-line JSON removal, minimizing the window another session's concurrent write could collide with |

No component here leans on blast-radius/impact-analysis (GitNexus) evidence
— this is data removal, not a code-symbol edit — so the `CLAUDE.md`
impact-analysis capability gate does not apply.

**Files touched:** `.fgos/config.json` (direct main-checkout commit, not
on this item's branch).

**Order:** single piece, no ordering question.

## Shape

One direct task, no split:

1. On the **main checkout** (`/home/vantt/projects/forgentX`, not this
   worktree): check `git status` is clean for `.fgos/config.json`
   specifically, then remove the `judge-discovery` and `judge-decompose`
   keys from `runner.capacities`, leaving `agy` and every other key
   untouched. Run the full `npm test` there to confirm the edited config
   still loads and validates. Commit directly on `main` with the item id
   in the message (`chore(tsk-4w4): remove dead judge-discovery/judge-
   decompose capacity entries`).
2. On this item's own `fgw/tsk-4w4` branch: no code/config change — the
   branch's own history is the research/plan already committed, proving
   the investigation and decision. `fgos return` re-verifies `npm test`
   against the branch's own (unrelated) commit history, which now also
   reflects the just-landed main-checkout state once this worktree is
   re-synced (or, if `fgos return`'s detached re-verify worktree forks
   from a point before the main-checkout commit, `npm test` still passes
   either way since the removed entries were never referenced by any
   test — the point of `RESEARCH.md`'s own finding).

Concrete case worth checking at Execute time: confirm `.fgos/config.json`
still parses as valid JSON and `agy`'s own entry is untouched (a fat-
fingered edit removing the wrong key is the one realistic failure mode
for a two-line JSON removal).

## Verify

Already synced onto the item at discovery: `npm test` (narrowed per
`docs/how-to/fix-fgos-write-rejected-merge-block.md` step 5 — a command
reading `.fgos/config.json` content would not survive `fgos return`'s
disposable detached re-verify worktree, which never carries `.fgos/`
either, same ADR0020 exclusion this item's own fix touches).

## Outstanding questions

None
