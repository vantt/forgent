---
type: explanation
title: Can fgOS reliably remove its own installed package?
tags: [uninstall, npm, package-manager, self-removal]
source_capture_ids: [tsk-4iv-2, tsk-652]
authoritative_for: whether fgos uninstall --remove-package can reliably remove its own package, which package managers/platforms it covers, and how it handles an unconfirmed install method
---
# Can fgOS reliably remove its own installed package?

`tsk-4iv-2`'s spike question: can a running process reliably delete its own
npm-installed package's files, on this machine, without corruption or a
stuck file lock? First-attempt success, verify passed —
`test/setup/self-uninstall-spike.test.mjs`.

## The finding: yes, on npm + Linux/macOS

`fgos uninstall --yes --remove-package` shells out to
`npm uninstall -g forgent` — the officially-supported removal path, not a
hand-rolled `fs.rmSync` on the running process's own files. Against a real
`npm pack` + `npm install -g` scratch install, invoked from the installed
binary itself while it was still executing:

```
SPIKE RESULT: packageRemoval.outcome = removed
```

The package directory and the `fgos` shim were both confirmed gone
afterward, and the command stopped resolving. No corruption, no lock
error, no partial removal.

## Why this works

On POSIX filesystems, deleting a file that a process still has open (or is
still executing from) unlinks the directory entry immediately but keeps
the underlying inode alive until every open file descriptor referencing it
closes — the running process keeps working off the now-unlinked inode
until it exits, and the disk space is reclaimed only then. `npm uninstall`
doesn't need any special-casing for "the tool being removed is the one
running the removal" — it's the same file-removal semantics any other
`npm uninstall -g` call already relies on.

## What's still unproven

The spike's scope was deliberately narrow (`docs/history/fgos-uninstall/
CONTEXT.md` D1, `plan.md`'s spike reshape):

- **pnpm, yarn** — not exercised. Different package managers have
  different global-install layouts and removal mechanics; nothing here
  proves or disproves them.
- **Windows** — explicitly skipped (`test.skip` on `win32`). Windows
  file-locking rules are the opposite of POSIX's — a process typically
  cannot delete a file it still has open — so this finding does not
  transfer. `docs/distribution-vision.md`'s CI pillar (`tsk-3nx`) still
  has no Windows matrix to test this against.

A follow-up item extending `--remove-package` to pnpm/yarn (and, once
`tsk-3nx` lands CI coverage, Windows) is deliberately not created yet —
YAGNI: there was no point shaping that build plan before this one
package-manager question was even answered.

## The false-success gap this scoping left open (`tsk-652`)

The spike's own npm-only scoping had a real, live consequence: `fgos
uninstall --remove-package` ran `execFileSync('npm', ['uninstall', '-g',
'forgent'])` **unconditionally**, with no detection of which package
manager the running copy was actually installed through. For a
pnpm- or yarn-installed copy, `npm uninstall` removes nothing, exits `0`,
and the CLI reported successful removal — a false-success report leaving
the package still installed. No follow-up item had ever tracked closing
this gap until `tsk-652` filed and fixed it directly.

**Fix**: `--remove-package` no longer reports success on a non-npm
install. It now refuses with a clear message when the actual install
method cannot be confirmed to be npm, rather than silently reporting a
removal that never happened.
