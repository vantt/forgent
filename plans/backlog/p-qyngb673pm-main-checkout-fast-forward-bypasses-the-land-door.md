---
id: p-qyngb673pm
title: "The main checkout's fast-forward to origin/main goes through the land door's lock, so it never races a land (git, priority P2; owner decision 2026-11-23)"
status: proposed
priority: P2
area: git
created: 2026-11-23
---

# Why

On design-lap the release-landing session fast-forwards the main checkout (`git merge --ff-only origin/main`, a
write to `refs/heads/main`) every time origin/main moves, and takes no lock the land door uses. On 2026-11-23 four
`fgos land` attempts of one branch failed at "fast-forward main":
- `git-timeout`;
- `ref-write-failed-recovery-required` (refs/heads/main was at c9c2dfd26, expected 06274e58e);
- `resource-recovery-required`, settled by `fgos git recover`;
- one more `git-timeout`.

The land read main, the other session moved it, and the land's ref write failed. Neither side has a signal to check:
`fgos git status` shows a land's open RefUpdate in `pendingOperations`, but nothing proves it covers the window from
the land reading main to writing it.

# Done when

Every write to the main checkout's `refs/heads/main` (land's fast-forward and a plain sync to origin/main) goes
through one door that holds the same lock, or a sync refuses by name while a land is in flight. A test runs a sync
concurrently with a land and shows neither fails with a ref-write error.

# Notes

Owner decision 2026-11-23: open as a backlog item. Until it lands, the landing session pauses its fast-forwards
while another session's land is in flight, by agreement only.
