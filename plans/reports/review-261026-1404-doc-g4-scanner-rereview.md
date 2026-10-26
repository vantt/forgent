# Re-review: DOC Git one-door scanner fixes

- Reviewer: lead:HARDEN (`claude-p74h@fg-server2`)
- Branch: `origin/review/doc-git-one-door` at `2ad5fecf4`. The previous review was of `eb744281d` ([first review](review-261026-1059-doc-g4-git-declarations.md)).
- Scope: the scanner diff only (`scripts/git-one-door-scan.mjs`, the declarations file, `test/scripts/git-one-door-declarations.test.mjs`). The commits are `d0dcc24ec`, `2fa7fe921`, `cb7342614`, `6aa8e5af0` and `2ad5fecf4`, plus main's `4f0428b81`, which the board line of 12:55 asked about. OPC reviews the hook part.

## Verdict: CHANGES (one Medium)

The three required changes from the first review are fixed:

1. **`configured-binary`.** It is now refused when a resolved caller passes a literal Git program (`declarationPrograms`, `fixedGit`). Escapes are kept only when every program value is configured data and the wrapper has no aliased export.
2. **`declared-tooling-exemption`.** It needs observed literal verbs, and all of them must be read verbs. A trailing spread after a fixed verb is accepted, except for `config`, `reflog` and `symbolic-ref`, where the operands decide whether the call reads or writes. HARDEN checked the remaining read verbs: a spread there can add output options, but it cannot turn the call into a repository write.
3. **Aliased exports.** These are now refused:
   - `export { fn as alias }` and `export default fn`;
   - `export * from` and `export * as ns from`;
   - a namespace import that is exported again;
   - `export { fn as default } from`;
   - string export names.

Reproduced on the branch head:

- `test/scripts/git-one-door-declarations.test.mjs` and `test/git/one-door.test.mjs`, run through `runChosenTests`, pass 82/0.
- `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared sites. The class counts are identical to DOC's receipt: configured-binary 95, hook-read-context 26, declared-tooling-exemption 19, uncalled-wrapper 10, rust-test 139, argv-runner 14, standalone-skill-script 4, production-sandbox-probe 4, sandbox-door 2, git-driver 1.

## Medium (required before Land): two dynamic-import caller forms are neither followed nor treated as escapes

The caller resolver follows `const m = await import('./w.mjs')` and `const { runGit } = await import('./w.mjs')`. It does not follow these two forms, and it records no escape for them:

- `(await import('./w.mjs')).runGit([...])`. The repo uses this form today, in `scripts/git/e3-bench.mjs:703`, `:716` and `:815` on `src/git/native.mjs`.
- `import('./w.mjs').then((m) => m.runGit([...]))`.

Negative control (scratch fixture, not committed):

- `src/w.mjs`: `export function runGit(args) { return spawnSync('git', args, { encoding: 'utf8' }); }`
- `src/c0.mjs`: `runGit(['rev-parse', 'HEAD'])` through a static import.
- `src/c4.mjs`: `return (await import('./w.mjs')).runGit(['push', 'origin', 'main']);`

The scan reports one site, with `callers: ['src/c0.mjs:2']` and `escapes: []`. A `declared-tooling-exemption` for that site is **accepted**, which leaves 0 sites, so the `push` is hidden. The `.then` form behaves the same with `branch -D`.

Fix shape (fail closed, no new mechanism): in the `importersOf` loop of `computeValueFlow`, any `import('<spec naming this file>')` that is not bound as `const|let|var X = await import(...)` or as a destructuring of it is an export escape ("imported dynamically in a form the caller resolver does not follow"). After the fix:

- one owning test case is needed per form, in `test/scripts/git-one-door-declarations.test.mjs`;
- the full-tree scan must still report 0 undeclared sites with the same class counts. If a current declaration gains an escape, it is refused and reviewed again.

## Low (not blocking): `readConfig` provenance goes by name only

`4f0428b81` (main) treats any `readConfig(...)` as configured data (`scripts/git-one-door-scan.mjs:475`, `:574`). HARDEN noted this as a Low on 2026-10-25, with "tighten only if a second `readConfig` appears". Since then, two things have changed:

- a second definition now exists, though only in the scanner's own fixture `test/fixtures/git-one-door/config-door-value/src/config.mjs`;
- DOC's `declarationPrograms` now relies on this provenance to keep escapes on `configured-binary`.

Negative control: a local `function readConfig() { return { bin: 'git' }; }` with `execFileSync(readConfig().bin, ['push', 'origin', 'main'])` is classed `configured-binary` and is not a site. The same code with the function named `getBin` is reported as a site.

No product file defines another `readConfig`; the 18 product importers all import it from `src/config/facade.mjs`. So this is not a live hole, and it does not block DOC's Land. The tightening is small: trust `readConfig` only when `resolveFunction` resolves it to `src/config/facade.mjs`, and move the fixture's door to that path. Owner: the scanner owner, OPC. This is recorded as an item, not a condition.

## Unresolved questions

None.
