# lead:SUPERVISOR handoff, 2026-11-22 21:05 (+07)

You are the manual project supervisor (`lead:SUPERVISOR`, owner-facing, Vietnamese, "anh/em", ≤10 lines, outcome first, open questions last). First run `fgos identity session --role lead:SUPERVISOR`. Your mailbox handle will differ from the previous session's (claude-ppxz@fg-server2), so tell lead:OPC and lead:DOCOS the new one.

## Your duties (owner rules)
- **Babysit actively.** Every ~30 min, run `herdr tab list` and read every idle or done lead, planner, shaper and Miu pane with `herdr pane read w6:<pane> --lines 30`, then check what each one waits on. Close finished sessions with `fgos session stop <persona> --name <head name>`; the head names are the dirs under `.fgos/runtime/session-rotation/`. Set a CronCreate heartbeat at once, because the previous session went silent overnight without one.
- **Never re-ask a settled question.** Check `fgos questions show`, the backlog and git status first. Inside an approved plan, decide footprint widenings yourself and record them in that plan's "Owner questions" section; only the owner or Miu can mark a question answered.
- **Prior art first; delete nothing without owner approval per group.** Approved so far:
  - delivered or merged worktrees: remove them, keep the branch;
  - go-build cache;
  - old non-plan worktrees.
- **Push routine for portfolio edits.**
  - `git fetch -q origin; git rebase -q --autostash origin/main`, then stage explicit paths and commit with the Co-Authored-By line.
  - Gate the push on the drift check printing "no new findings":
    `D=$PWD/.fgos/runtime/git-addon/$(ls -t .fgos/runtime/git-addon|head -1); env FGOS_HOST_BIN=$D/fgos FGOS_ACTIVE_MANIFEST_PATH=$D/manifest.json FGOS_ACTIVE_RELEASE_PATH=$D node scripts/check-decision-citation-drift.mjs --skills-dir plugins/fgOS/skills`
  - If it crashes with an addon ABI mismatch, run `node scripts/git-addon.mjs` first.
- **`.fgos/config.yaml`** holds 4 uncommitted doc-comment lines that are the owner's. Save `git diff .fgos/config.yaml`, check out the file, patch it with `fgos config patch <file-inside-repo>` (patch the full list, not an index append), commit, then `git apply` the saved diff.
- **Disk fills fast.** Each phase worktree with its cargo build costs 6-12 GB.
  - Remove merged worktrees with `fgos worktree remove <path> --discard-ignored --delivered-to origin/main`. For dirty ones, run `git -C <literal path> worktree remove --force --force` after confirming the commits are merged.
  - Clean a build with `git -C <literal path> clean -fdXq -- tar''get`; the delete guard needs literal paths.
  - The land door's landed-worktree removal (heads-stable phase 7) works only once the new release is active.

## State at handoff
- **Plan 261118-1341-s6a-execution-tier-rust:** done (8ed5e8cdb, D-ADR0083). Its lead is closed and its worktree removed.
  - Follow-up p-24xw2cwdvo (delete about 80 dead Node files and 145 tests) runs immediately after heads-stable, per the owner at 18:27.
  - Miu was asked to open its planner now, with blockedBy heads-stable. Check that it happened.
- **Plan 261122-0118-heads-stable-and-able:** lead in tab "lead: heads-stable-and-able" (pane w6:p1QD).
  - Phases 1-8, 10 and 12 are done; phase 11 (live probe) remains.
  - Phases 8, 9 and 10 run 24-hour measures that end about 14:20 on 2026-11-23.
  - It was landing p11 at 20:46.
  - It holds owner-approved additions: `--project-only`, landed-worktree removal, rotation reliability (phase 12), and login expiry.
- **Release window open:** OPC staged sha256:0844a0a4 (from 6444f6595: contract 3 and phase 12). I asked the heads-stable lead to reply "HS-QUIET2"; when it does and no `bin/fgos run|land|worktree` process remains, send "quiet" to lead:OPC (forgent-67). OPC runs the secretary and supervisor head-start probes and rolls back on a failure.
  - The active release is 1e544460, but a live head keeps its launch release until it restarts.
- **Miu rotation:** the owner approved it at 20:55, because claude-miu/vantt is near its weekly quota.
  - Config 132b52f92 sets `runner.personas.secretary.pool: claude`.
  - Miu (mail forgent-claude-107) was asked to hand off and reply "MIU READY"; then run `fgos session rotate secretary --name miu` and confirm the new pane comes up.
  - The probe showed all four Claude accounts answering; it cannot show weekly quota %.
- **DOCOS** (design-lap, claude-wfgg@design-lap): branch docos/citation-roles landed here as ee2b0a01a (citation check skips role-field lines and self-id headings; three decision tests fixed). Tell the owner the sha.
  - DOCOS's own pending chain land-1103502-… on design-lap (ref-effect-unknown) needs a git recover fix. That is backlog p-o4juyw2ntg; the design-lap ticket is tsk-uq4ziqg3yd.
  - Mail from fg-server2 to design-lap is broken (tsk-p2gcmfkwzv), so relay through the owner.
- **Other open plans:** 261122-0800 red-tests (done); owner-communication plan (ready, held by a footprint overlap with heads-stable); agent-start plan (planned); coach-agent shaper (talking with the owner).
- **Today's backlog rows:** p-vnsigyw6h7, p-o4juyw2ntg, p-6sd4fslxv7, p-l54vuzupa5, p-24xw2cwdvo, p-ivmvh7y2hf, p-g3btj3bpqc, p-auypprszfz, and the flaky case-close row. p-q2dn2cnzlq is reopened: dead land chains come from heads landing without FGOS_SESSION_ID.

## Open owner questions
- None pending from me. The owner approved the B option for s6a, the Miu pool change, and the fixture timer disable (done).
