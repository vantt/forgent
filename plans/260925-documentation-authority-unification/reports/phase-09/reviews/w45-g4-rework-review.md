# W45 G4 rework re-review (fbcb8e016, 2fa7fe921, cb7342614)

**Verdict: REWORK.** Both w42 fixes work for the shapes they target, and the red/green and parity evidence holds up. Each fix still leaves one raw shape that bypasses it silently. Machine-readable findings: [w45-g4-rework-review.json](w45-g4-rework-review.json).

## Blocking

1. **W45-1 (high): a rewind with a zero old OID is still admitted.** Git 2.55 gives the reference-transaction hook old=`0000…` for `git update-ref refs/heads/main <oid>` (no expected old value) and for `git branch -f main <oid>`. The guard reads zero as "main is being created", so it skips the forward-only check. I tested end to end in a scratch repo with the worktree `.githooks`, a held sidecar on main and origin/main set to the commit before acquire. `git reset --hard c1` is refused. `git update-ref refs/heads/main c1` exits 0, and main loses `plans/documentation-cutover-lease.json`.
   Fix: when old is zero, resolve it with `rev-parse --verify --quiet refs/heads/main`. Status 1 means absent; any other failure throws. Only a proven-absent main counts as creation. Add a unit case (zero old, main present, rewind) and a real-git `update-ref` case.
2. **W45-2 (high): `export { g as default } from './read.mjs'` hides callers.** The new named re-export follower pushes the item under the alias `default`, and the default import (`import h from './barrel.mjs'; h(['reset','--hard'])`) is never resolved. The declared wrapper still passes with only its own caller. The local forms refuse (`export { g as default }`, `export default g`), and §17 says this shape refuses. The same shape hides a configured-binary adapter caller too.
   Fix: if the alias is `default`, escape with `'exported as default'`, and add the shape to the re-export test matrix.
3. **W45-3 (medium): docs overclaim.** The §7 and CHANGELOG:27 statement "a rewind stays refused" is false until W45-1 is fixed. In §17, "a namespace import passed on as a value" is broader than the code, which refuses only an exported namespace holder; reword it.

## Verified

- **Pre-fix proof.** The rewind unit case fails against the dc15c5030 hook (0/1) and passes now. A rewind with a real old OID is refused, forward published moves are admitted, and read errors fail closed.
- **Scanner red/green.** The 12 star / star-as / exported-namespace subtests fail on the 129cbb127 scanner (13 fail with the parent test). The positive registered-adapter case fails on 2fa7fe921, which also reproduces the `cliSpawnAdapter` unresolved-binary regression, and passes at HEAD.
- **Full-repo scan parity.** The HEAD scanner and the 129cbb127/fbcb8e016 scanner both report 0 undeclared with identical class counts (configured-binary 92, declared-tooling-exemption 19, and so on).
- **Adversarial registered-by-value shapes.** Star or namespace routes to the transport or the registry, and an exported holder with `.execute`, all now surface sites. At 129cbb127 five of them were silent. The `cliSpawnAdapter` fix opened no new route among the shapes tried; the only silent one left is the W45-2 default alias.
- **Census and tests.** `--write-census` leaves git status clean. Test runs: declarations 62/0, lease unit 17/0, census-drift 3/0.

## Non-blocking

- **W45-7 (low, pre-existing):** `import('./m.mjs').then(m => m.g(...))` and `let m; m = await import(...)` callers are invisible. Open a separate item.
