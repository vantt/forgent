---
type: explanation
title: Why docs/enduser-docs-index.json needed a doctor check, not just a regenerate skill
tags: []
source_capture_ids: [tsk-1m0]
---
# Why `docs/enduser-docs-index.json` needed a doctor check, not just a regenerate skill

`fgos-indexing` exists specifically to regenerate
`docs/enduser-docs-index.json` after every `fgos-coding-compounding` write — the
skill's whole job is keeping the index current. It wasn't being run, and
nothing noticed.

## The drift, measured twice

> "Hôm trước: 220 tài liệu trên đĩa, 151 trong index, thiếu 70 = 32%.
> Hôm nay: 236 trên đĩa, 152 trong index, thiếu 85 = 36%. Tức thêm 15 tài
> liệu mới, ĐÚNG 1 CÁI được index."
> — real item description, `tsk-1m0`

Two measurements, one day apart: 15 new end-user docs landed, and only
one of them made it into the index. Both measurements found zero entries
pointing at files that don't exist — the index isn't corrupted, it's
simply falling further behind over time as new docs land and the
regenerate step doesn't run.

## Why nobody had caught it

`fgos doctor` had 12 registered checks at the time
(`node-version-and-git`, `shell-integration-sourced`,
`config-not-stale`, `main-checkout-hook-wired`,
`tool-registry-configured`, `root-drift`, `config-awareness`,
`dependencies-installed`, `gate-bypass-configured`,
`claude-plugin-marketplace`, `plugin-skill-cli-reachable`,
`changelog-unreleased-stale`) — none of them watched this. The failure
mode is exactly the shape a "someone remembers to run a follow-up skill"
process degrades into: it works as long as every session that writes a
doc also runs the regenerate step, and silently doesn't the moment one
session skips it, with nothing downstream ever surfacing the gap.

## Why the check could register both `registerCheck` and `registerFix`, unlike a recent sibling

A closely preceding item (`tsk-3ip`, the `changelog-unreleased-stale`
check) had been barred from doing "decide/write" together, because
judging whether a given change *should* have a changelog entry requires
real judgment — not something a mechanical doctor check can safely
decide on its own. Regenerating the docs index needed no such judgment
call:

> "Regenerate index thì KHÔNG cần phán đoán gì cả — nó là hàm thuần từ
> nội dung trên đĩa, kết quả tất định. Nên ở đây đăng ký CẢ HAI là đúng:
> registerCheck (báo độ lệch) VÀ registerFix (regenerate index khi chạy
> `doctor --fix`). Ranh giới thật là PHÁN ĐOÁN, không phải việc ghi."
> — real item description, `tsk-1m0`

The real boundary this item drew: doctor's own read-only-diagnosis
contract isn't about whether a fix *writes* something — it's about
whether producing that fix requires judgment doctor can't safely make on
its own. Regenerating an index from disk content is a pure, deterministic
function (`buildEnduserIndex`, `src/report/enduser-index.mjs`, already
built with no I/O by design) — there's nothing to decide, only something
to recompute. A `changelog` entry's necessity is a judgment call; an
index's staleness is a mechanical fact.

## Why the check itself still stays read-only

Even with `registerFix` allowed to write, the *check* path itself never
calls `fgos docs-index regenerate` directly — that verb is marked
`externalEffect` in the command registry, and doctor's own diagnosis
pass is read-only by contract. The check instead calls the same pure
`buildEnduserIndex` function in-memory and diffs the result against what's
actually on disk at `docs/enduser-docs-index.json` — computing the same
drift number the real regenerate step would produce, without ever writing
anything during a plain `fgos doctor` run. Only `doctor --fix` triggers
the real regeneration, through the registered fix, reusing the verb's own
path rather than a second implementation of the same logic.

## Why this matters beyond one missing check

This item's own broader framing ties it to a live discussion (`docs/
history/compound-learn-artifact-registry/DISCUSSION.md`, constraint R6):
a post-write step that depends on "someone remembers to run it" degrades
measurably over time — this case's own 32%→36% drift over a single day is
concrete evidence for that argument, not a hypothetical. Registering the
check turns what had been an uncontrolled natural experiment (how bad
does the drift get before someone notices) into a guarded, measured
invariant instead.

## Related

- `docs/history/tsk-1m0/plan.md` — full plan and locked decisions.
- `src/report/enduser-index.mjs` — `buildEnduserIndex`, the pure function
  both the check and the real regenerate verb share.
- `docs/history/compound-learn-artifact-registry/DISCUSSION.md` — the
  wider discussion this finding fed evidence into.
