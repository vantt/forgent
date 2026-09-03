---
framework: diataxis
mode: explanation
---
# Why `fgos uninstall` shipped as two pieces

`tsk-4iv` — first-attempt success, verify (`npm test`) passed,
`aheadCount: 13` (both children's real commits, merged onto this item's
own branch).

## The starting ask

The item's own description named the gap directly: fgOS's 7
distribution-vision pillars (`docs/distribution-vision.md`) had no
uninstall branch at all, and flagged that scope needed to be chosen
before anything could be built — "cần chốt scope (những gì tính là
'harness/file liên quan' cần gỡ) trước khi thi công."

## What got locked, and why it needed a person

The real recorded settlement (`fgos check tsk-4iv`) captures the answer
given during `fgos-coding-exploring`, cited verbatim:

> Đã chốt trong docs/history/fgos-uninstall/CONTEXT.md (D1-D4), approved
> qua fgos-coding-exploring: (1) shell profiles — CHỈ report dòng source, KHÔNG
> tự xoá (D4, giữ nguyên precedent docs/history/shell-rc-dead-source-lines
> D1 'deletion stays a human act'); (2) .githooks — xoá file+dir CHỈ khi
> core.hooksPath vẫn còn đúng '.githooks' (D2, mirror installGitHooks
> fill-only); (3) package — gỡ luôn package đã cài qua package manager
> phát hiện được, không chỉ binary (D1); (4) config path — .fgos/ data,
> ~/.fgos/config.json, project config.json đều PHẢI giữ nguyên, không đụng
> tới (pinned constraint từ mô tả item gốc).

D4 specifically only got locked because `fgos-coding-validating`'s reality gate
caught a real conflict: the plan's first draft assumed the shell-rc source
line would be deleted, but this repo already has a locked decision saying
the opposite. That's a genuine example of the reality gate doing its job —
not a hypothetical failure mode.

## Why it split into two items instead of one

`fgos-coding-planning`'s mode gate scored this **high-risk** — 5 flags hit, two
of them hard-gate on their own (it disables a live security control, the
main-checkout-lock pre-commit hook; and it "removes a validation" by the
same token). The split separated the well-precedented piece (wiring
reversal, mirrors already-tested fill-only patterns) from the genuinely
novel one (a process removing its own installed package — zero precedent
anywhere in this repo).

- **`tsk-4iv-1`** — `docs/how-to/uninstall-fgos-wiring.md`. Ships
  `fgos uninstall --yes`: unwires git hooks, reports (never deletes) the
  shell-rc line.
- **`tsk-4iv-2`** — `docs/explanation/fgos-self-uninstall-package-removal-spike.md`.
  A feasibility spike, not a full build — `fgos-coding-validating` caught that the
  package-removal piece had been shaped as a buildable feature with zero
  supporting evidence, and sent it back to be reshaped as a spike first.
  The finding: real self-removal via `npm uninstall -g` works reliably on
  npm + Linux/macOS; pnpm/yarn/Windows stay unproven, deliberately not
  built yet (YAGNI — no plan shaped for a question not yet answered).

## The net result

`fgos uninstall [--yes] [--remove-package]` — wiring reversal is the
default (unchanged since `tsk-4iv-1`), package removal is opt-in and
scoped to what the spike actually proved.
