---
type: how-to
title: How to close out a goalTier milestone/MVP item once all its targets are done
tags: []
timestamp: 2026-08-01T10:31:22.000Z
source_capture_ids: [tsk-u9k]
framework: diataxis
mode: how-to
---
# How to close out a goalTier milestone/MVP item once all its targets are done

**Update (tsk-580):** step 2's manual `jq` command below is now a real,
supported shortcut — `fgos edit <milestone-id> --verify-from-targets`
generates the exact same check automatically, reading the item's own
`targets` array and resolving the repo root itself, so neither the
`--dir <repo-root>` gotcha nor the id-list typing below has to be done by
hand. It refuses outright if `targets` is empty, rather than writing a
`jq`  `all()` over an empty array (which is vacuously always `true`), and
it accepts the same resolved-status set (`delivered`/`retrospective`/
`cleanup`/`done`) the "target sitting in `cleanup`" lesson below already
settled on — not the stricter literal `done` the original manual recipe
used. The manual command stays below as what the flag actually generates,
and as the fallback for a milestone whose real condition needs more than
a status check (the content-assertion lesson further down, which the flag
does not attempt to replace).

Use this when a `goalTier: "milestone"` (or `"mvp"`) item's `targets` array
are all `status: "done"`, but the milestone item itself still sits at
`status: "todo"` and never shows up in `fgos merge list`'s `ready` array —
nothing closes a goalTier item just because its targets finished; that
remains a deliberate manual step, the one this page walks through.

`fgos rollup <milestone-id>` now *reports* the targets (a `targets` array
plus a `targetDoneCount`/`targetTotalCount` pair — see
[check-rollup-progress](check-rollup-progress.md)), which is the fastest way
to confirm they really are all `done` before starting. Reporting is all it
does: `rollup` is read-only and still moves nothing.

## Watch out for: `rollup`'s plain `doneCount`/`totalCount` reads `0/0` for a targets-based milestone — that's not the field to check

`tsk-4bc` (a 4-milestone MVP tracked via `targets`, not `children`) flagged
this as a real tooling trap: `fgos rollup <id>` prints **two** separate
progress pairs in the same JSON — `doneCount`/`totalCount` (computed from
the item's `children` array) and `targetDoneCount`/`targetTotalCount`
(computed from `targets`). For a `goalTier` milestone tracked purely via
`targets`, `children` is genuinely empty, so `doneCount`/`totalCount`
always reads `0/0` — that's correct, not a bug, but it's easy to misread
as "rollup isn't seeing my targets at all" if you're only looking at the
first pair. The real progress signal is `targetDoneCount`/
`targetTotalCount` (and the `targets` array itself, each entry carrying
its own live `status`) — always check those fields specifically for a
targets-based milestone, not the children-based pair.

A second, related trap: `targetDoneCount` counts only the literal
`status: "done"` — it does **not** apply the "a target sitting in
`cleanup`/`retrospective`/`delivered` has already delivered" resolved-
status reasoning the lesson further down this page locks. A milestone
whose targets have all genuinely landed but haven't finished their TTL
sweep to `done` yet will show `targetDoneCount: 0` even though every
target's real work is complete — read each target's individual `status`
in the `targets` array, not just whether `targetDoneCount ==
targetTotalCount`, to judge real readiness the same way the resolved-
status lesson below already recommends for the milestone's own `verify`.

## If the milestone was created via `fgos submit` instead of `fgos add`

Before `tsk-5fs`, `goalTier` could only ever be set at creation time via
`fgos add --goal-tier ...` — `fgos submit` (the public intake door)
exposed no `--goal-tier` flag at all, and `goalTier` was deliberately
excluded from `store.mjs`'s `EDITABLE_FIELDS`, so an item submitted
without one was **permanently** unable to become a milestone/MVP. This
actually happened (`tsk-3w3`, created via `submit`, needed `goalTier:
milestone`, had no path to add it). `fgos submit` now exposes the same
`--goal-tier` flag `add` always had, and `goalTier` is now in
`EDITABLE_FIELDS` — `fgos edit <id> --goal-tier milestone` (or `mvp`) can
retrofit it onto an existing item, submitted or added, at any time.

## Before you start

- This is a **different** relationship from a decomposed root item's
  `children` (see Related): a milestone's `targets` are ordinary work
  items that usually merge **straight into `main`** on their own, not into
  a shared `fgw/<milestone-id>` integration branch the way decomposed
  children merge into their root's branch. A fresh claim of the milestone
  therefore starts with **zero** commits ahead of `main` — there is
  nothing for the targets' own commits to have accumulated onto.
- A goalTier item's stored `verify` field is very often **prose**
  ("Done when tsk-X and tsk-Y both reach done…"), not a runnable shell
  command — it was usually written that way at submit time before anyone
  intended to actually run it. `fgos return`/`fgos approve` both shell out
  to whatever string is there via `spawn(item.verify, { shell: true, cwd
  })` — prose will just fail as a bad command, not report a clear error
  about being non-executable.

## Steps

1. Confirm every target is actually done — one command reads all of them:
   ```
   fgos rollup <milestone-id>        # targetDoneCount == targetTotalCount?
   ```
   A target row printed with `"status": null` is an id in `targets` that
   matches no work item at all (entries are not validated at write time) —
   fix the id before going further, rather than reading it as pending.

   The longer per-target walk still works if you want it:
   ```
   fgos show <milestone-id> --json   # read .data.work.targets
   fgos list --id <target-id> --json # for each target, check .status
   ```

2. **Give the milestone a real, runnable `verify` command** before doing
   anything else — checking every target's status via `fgos list` itself:
   ```
   fgos edit <milestone-id> --verify \
     'node <repo-root>/bin/fgos.mjs list --json --all --dir <repo-root> | jq -e ".data.work as \$w | [\"<target-1>\",\"<target-2>\"] | map(\$w[.].status) | all(. == \"done\")" > /dev/null'
   ```
   **The `--dir <repo-root>` (absolute path) is not optional here.** The
   worktree `fgos return`'s own verify step runs this command inside never
   carries its own `.fgos/` at all (ADR0020 — every fresh worktree has it
   stripped) — a verify command that shells `fgos` itself without an
   explicit `--dir` silently resolves against a missing store and exits 1,
   with **empty** `output` in the returned JSON (no stack trace, no
   message — just `passed: false, exitStatus: 1, output: ""`), which is
   easy to misread as the check itself being wrong rather than a path
   problem. Test the exact command by hand from a plain shell before
   trusting it.

3. Claim the milestone item itself:
   ```
   fgos pick <milestone-id>
   ```
   This forks a **brand-new** `fgw/<milestone-id>` branch from the current
   tip of `main` (or whatever `HEAD` `fgos pick` uses) — unlike a
   decomposed root's branch, it starts with nothing on it yet.

4. `fgos return <milestone-id>` **will refuse** the first time:
   ```
   fgos: return: branch "fgw/<milestone-id>" has not advanced past
   branchHeadAtTake ... — commit the work on the branch before
   returning, or pass --no-new-commits-ok if the work was already done
   before this claim.
   ```
   This is expected — the targets' work already landed on `main` before
   this claim, so there is genuinely nothing new to commit on the
   milestone's own branch. `--no-new-commits-ok` exists for exactly this.

   **But if your verify command was wrong the first time** (step 2's
   `--dir` gotcha) and you already hit a failed `return` once, `--no-new-
   commits-ok` will refuse on the RETRY too:
   ```
   fgos: return: "<id>" cannot use --no-new-commits-ok — this item was
   previously blocked by a failed verify; the flag only closes out work
   that was never returned, never rescues a failed retry. Commit new
   work and retry return normally.
   ```
   This is a deliberate guard — the flag is for "nothing to commit,
   never mind", not for "my verify was broken, let me skip past it
   without proving the fix." Once you've been blocked once, you need a
   REAL new commit. Writing a genuine closure note under
   `docs/history/<milestone-id>/CONTEXT.md` (real evidence: which
   targets, which commits, what the milestone actually delivered) both
   satisfies this and gives the later compound-learn step real source
   material — `fgos edit <milestone-id> --docs-ref
   docs/history/<milestone-id>` first if the item has no `docsRef` yet.

5. `fgos move <milestone-id> --to doing` (if step 4's first attempt left
   it `blocked`) then `fgos return <milestone-id>` again (no flag needed
   once there's a real commit — `aheadCount` will be `1`).

6. `fgos compound <milestone-id> --doc-type <quadrant> --doc-path ...` —
   same compound-learn step every item goes through.

7. `fgos approve <milestone-id> [--acknowledge-iron-law]` — merges the
   milestone's own branch (just the closure-note commit) into `main`.

## Real example

`tsk-u9k` (milestone: judge scout output persists and is reused across
`judgeDiscovery`/`judgeDecompose` calls, targets `tsk-62v`, `tsk-g18`, both
`status: "done"` on `main`) hit every gotcha above in sequence:

- Its stored `verify` was prose ("Done when tsk-62v and tsk-g18 both reach
  done…") — fixed via `fgos edit --verify` to a real `jq`-checked command.
- The first version of that command omitted `--dir <repo-root>` — `fgos
  return --no-new-commits-ok` came back `{"passed": false, "exitStatus":
  1, "output": ""}` and the item landed at `blocked`.
- `--no-new-commits-ok` then refused on retry (the "cannot use ... this
  item was previously blocked" guard above) — resolved by writing a real
  `docs/history/tsk-u9k/CONTEXT.md` closure note (this file's own sibling)
  and committing it, then `fgos return tsk-u9k` (no flag) succeeded with
  `aheadCount: 1`.

## Real-world lesson: a target sitting in `cleanup` has already delivered — don't wait out its TTL

`tsk-2jc` (milestone, single target `tsk-1qm`, closing when
`docs/specs/distribution.md` matches reality after a `doctor --fix`
feature landed) hit a version of this pattern the original how-to above
doesn't cover: the target wasn't `done` yet, but not because anything was
unfinished — it was sitting in `cleanup`, waiting out the mechanical
7-day TTL sweep (`DEFAULT_CLEANUP_TTL_DAYS`, `src/setup/
registrations.mjs:545`) before `/fgOS:cleanup-next` would eventually flip
it to `done`. The milestone's stored verify (prose: "Done when tsk-1qm
reaches done") took that literally and blocked the goal-check.

The resolution, once surfaced to a person:

> "D1 — nới điều kiện done từ 'tsk-1qm = done' sang 'tsk-1qm đã resolved'...
> Lý do nới là hợp lệ ở đây: điều kiện thực chất của milestone là *nội
> dung spec khớp thực tại*, còn `tsk-1qm = done` chỉ là cách viết tắt cho
> 'target đã giao xong'. Trạng thái `cleanup` đã chứng minh target giao
> xong rồi (nó đã qua `delivered` và `retrospective`); phần còn lại thuần
> là bookkeeping TTL."

The rewritten verify accepted any of the four resolved tail statuses —
`delivered`, `retrospective`, `cleanup`, `done` — but **not** `wontfix`,
since that means the target was cancelled, not delivered. The general
rule: if a milestone's real condition is "the target's work landed," a
verify pinned to the literal terminal status `done` is checking a proxy,
not the real condition — and the proxy lags the real condition by up to
the cleanup TTL for no reason. Check the tail-status *category* the
target has reached, not the single final label.

## Real-world lesson: a milestone verify that only reads status is vacuous — check the content it claims

Reading only `tsk-1qm`'s status would prove the target's work happened,
but nothing about *what* it delivered — meaningless for a milestone whose
actual claim is "the spec text matches reality now." `tsk-2jc`'s verify
added content assertions (RUL11 wording, two `not a fixed list` markers,
and a loop confirming every `registerCheck`/`registerFix` id in
`src/setup/registrations.mjs` is actually named in the spec) so the
milestone proves its own real claim, not just a tracker read.

That last pair of assertions caught something real on the very first
`approve` attempt: a `verify-fail-post-merge` (merge landed, post-merge
verify failed, merge rolled back cleanly — see the diagnose how-to under
Related). A different item had registered a new check/fix pair after this
milestone's spec text was written, without updating the spec — exactly
the kind of registry-vs-spec drift the content assertions exist to catch.
Worse, the spec's own Data Dictionary entry explicitly permitted this:

> "#7 khi đó tự nói 'this list grows without a spec update whenever a
> module registers a new one' — tức spec tự cho phép danh sách cũ đi. Câu
> đó mâu thuẫn trực tiếp với mệnh đề 4."

The spec's own drift-tolerant wording contradicted the verify's drift-
intolerant assertion — both couldn't be true. The resolution: the spec's
registry list is a **contract**, not a snapshot — the permissive sentence
was removed and replaced with an explicit obligation that any module
adding a check/fix updates this list in the same change. The accepted
trade-off: a future module that adds a check but forgets the spec now
fails `return`/`approve` loudly, instead of the drift only surfacing when
someone happens to audit by hand.

## Why this doesn't happen automatically

Same underlying reason a decomposed root doesn't close itself (see
Related): `fgos rollup`/`fgos triage` can report on a goalTier item's
`targets` but never write to `status`/`stage` — a goalTree item earns its
own `done` through the same claim → verify → return → compound → approve
cycle every other item goes through, on purpose, so the final commit on
its own branch has a natural place to hold a real, evidence-based closure
summary instead of the milestone silently vanishing into "some targets
happen to be done now."

## Related

- `docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`
  — the sibling how-to for a **decomposed root** (children merge into the
  root's own `fgw/<root-id>` branch via `parent`) rather than a **goalTier
  milestone/MVP** (targets merge straight into `main` via `targets`) —
  same closing cycle, different branch topology and a different starting
  `aheadCount`.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` —
  what to do when `approve`'s own full-suite verify (a different, later
  gate than `return`'s item-scoped verify) blocks a merge for a reason
  unrelated to the item's own diff.
- `fgos check <id>` — full outcome/friction history for an item, including
  the `verify-miss` friction entry this how-to's real example quotes.
