# W47 G4 final review (c5750a967, 6aa8e5af0)

**Verdict: REWORK (one medium item).** W45-1, W45-2 and W45-3 are closed for the shapes they name. One more spelling of the W45-2 shape still hides callers. Machine-readable findings: [w47-g4-final-review.json](w47-g4-final-review.json).

## Rework

- **W47-1 (medium): string export names bypass the default re-export refusal.** The barrel `export { g as "default" } from './read.mjs'` with the caller `import h from './barrel.mjs'; h(['reset','--hard'])` scans clean (0 sites, no escape). The same happens with `export { g as 'x-y' } from` and `import { 'x-y' as h }`. Node 24 runs both. This was already present at f4324b27d, and no file in the repo uses it today. Fix: strip quotes from the alias before comparing. Escape when the alias is `default`, and escape any quoted name that is not an identifier. Add both spellings to the re-export test matrix.

## Closed

- **W45-1.** Scratch repo with this worktree's `.githooks`, a held sidecar on main and origin/main at the commit before acquire. These are all refused and main stays held: `update-ref refs/heads/main <pre>`, `branch -f`, `update-ref --stdin` without an old value, `reset --hard`, `update-ref HEAD` while HEAD points at main, and a symref alias. Results are the same without origin/main. With the hook from c5750a967^, the same probe rewinds main. Creating an absent main still succeeds. rev-parse failing with status 128, 129, 2 or no status, or returning empty output with status 0, fails closed.
- **W45-2.** The `as default` re-export refuses in multi-line form, with a comment inside the braces, behind a forwarding barrel, as `export { g, g as default } from`, and through `export { default as g } from` chains. The configured-adapter case also refuses. The 6 new failures appear against the f4324b27d scanner. A full-tree scan gives 0 undeclared, and the output is byte-identical to the output of the c5750a967 scanner.
- **W45-3.** §7 and CHANGELOG:27 now match the code. §17's "namespace import that is exported again" matches the refusal of an exported holder.
- **Census and tests.** `--write-census` leaves git status clean. Declarations 66/0, lease unit 18/0.
