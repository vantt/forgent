# RESEARCH — tsk-4dy: audit of commit a23ec8a1's stray-merge absorption

## Round 1 — 2026-08-18

**Asked:** Did the sync commit absorbed into `a23ec8a1` ('main into
fgw/tsk-13m') lose any real content, and did tsk-1q5's own
retrospective-synthesis doc write survive and get properly tagged via
`fgos compound`? (Row 3 of the 5-instance table in
`docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md`,
carried over from tsk-2oy round 1's audit list.)

**Checked (git, direct — no assumption from the item description):**

1. `git log -1 --format='%H %P %s' a23ec8a1` — confirms `a23ec8a1` is a
   2-parent merge (`Merge: 14861841 a1d0a992`), commit message
   `docs(tsk-1q5): retrospective synthesis`.

2. Parent 1, `14861841` (`docs(tsk-59b): retrospective synthesis`) —
   single parent `a5e5362f` (`docs(tsk-2x9k): retrospective synthesis`).

3. Parent 2, `a1d0a9921664c3cd86451da5d2f51d00485e6324` (`Merge branch
   'main' into fgw/tsk-13m`) — 2 parents itself:
   - `201672f059c639110f2501285c7513b556a081c0`
     (`test(tsk-13m): add Iron Law failing-test-first proof for the
     ppidOf timeout`) — tsk-13m's own real content commit, adds
     `docs/history/tsk-13m/iron-law-evidence.md` (45 insertions).
   - `a5e5362fcb01f443d7a934668d03a34b07a69b49` — **the same commit as
     parent 1's own parent.** Both sides of the merge that produced
     `a23ec8a1` share the identical base (`a5e5362f`), so the only
     content `a1d0a992` contributes beyond that shared base is
     `201672f0`'s own diff.

4. `git merge-base --is-ancestor 201672f0 main` → **YES**. `git
   merge-base --is-ancestor a1d0a992 main` → **YES** (trivially true
   since its child `a23ec8a1` is itself an ancestor of `main`, also
   confirmed YES). tsk-13m's real content commit sits cleanly in
   `main`'s own ancestry, not merely "reachable through a corrupted
   merge" — it is the literal commit main descends from.

5. `git show main:docs/history/tsk-13m/iron-law-evidence.md` — file
   exists, content is the RED/GREEN Iron Law evidence for the `ppidOf`
   timeout fix. `git log --oneline main -- <path>` shows **exactly one**
   commit ever touched it: `201672f0` itself. No truncation, no
   conflict-marker corruption, no second write that could have altered
   it.

6. tsk-1q5's own retrospective-synthesis doc write: `git diff 14861841
   a23ec8a1 -- docs/explanation/events-jsonl-lost-update-race-under-
   concurrent-session-writes.md` shows a clean +63/-1 diff (frontmatter
   `source_capture_ids` gains `tsk-1q5`, plus a full new "Two candidate
   causes, and why the investigation started with the wrong one" +
   "What actually got fixed, and what stayed deferred" section,
   including the item's own real settlement quote). `git show
   main:<path>` today still contains that exact section verbatim
   (`grep -n "Two candidate causes" main:<path>` → line 59 present;
   `source_capture_ids: [tsk-2xt, tsk-1q5, tsk-3wq]` — the added
   `tsk-3wq` tag is a later, unrelated legitimate edit, not evidence of
   loss).

7. `fgos show tsk-1q5 --json` — `outcome.docType: "explanation"`,
   `outcome.docPath:
   "docs/explanation/events-jsonl-lost-update-race-under-concurrent-
   session-writes.md"` — the doc write was captured and properly tagged
   via `fgos compound`, not silently dropped. `tsk-1q5` itself is at
   `status: cleanup` (already resolved) with a real `branchHeadAtReturn`.

**Found:** Both open questions resolve clean. `a23ec8a1` has the same
*mechanical shape* as the bug tsk-2oy fixed (an unrelated second parent —
a self-sync "merge main into fgw/tsk-13m" commit, not a feature commit —
absorbed into a `docs(tsk-1q5): ...`-labeled commit), and in this
specific instance the merge preserved every byte of both sides: tsk-13m's
Iron Law evidence commit (`201672f0`) is a direct ancestor of `main`
today with a clean, single-commit file history, and tsk-1q5's own
synthesis doc survived and is correctly tagged on the item. No content
was lost or corrupted. This is a **mislabeling-only** instance, exactly
the `tsk-psb`-documented "fourth case" pattern
(`docs/explanation/why-checkmergestillresolves-can-false-positive-after-
a-root-branch-prune.md`) — a self-sync merge that carries no unique
content beyond what already reached `main` through the normal route —
not a content-loss instance.

**Still open:** Nothing regarding tsk-4dy's own scope. The other 2
unaudited rows in the 5-instance table (tsk-1vi/tsk-66t, tsk-2x9/tsk-1r3)
are out of scope here — each is its own follow-up item per tsk-2oy
CONTEXT.md D1 (tsk-2x9/tsk-1r3 is flagged in that table as the most
severe instance, a genuine CODE fix absorbed and buried — worth
prioritizing when its own item is picked up).

**Verdict:** `clear: true`, `verify: "npm test"` (item's existing verify;
no code change is warranted by this finding, so the repo's ambient test
suite green is the only proof needed).
