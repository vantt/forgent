# Iron Law evidence — tsk-2ej

`classifyIronLaw({ filesChanged, description })` against the real committed
diff (`git rev-parse --path-format=absolute --git-common-dir`-resolved
root, `changedFiles(root, item)`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` (the CLI entrypoint) is a sensitive module, so evidence is
required regardless of description keyword flags.

## Test command (item's own `verify`)

```
node bin/fgos.mjs version | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!d.data.verbs.includes('plan')||!d.data.verbs.includes('version')||!d.data.packageVersion) process.exit(1)" && node --test test/cli/fgos-manifest.test.mjs && node --test test/setup/*.test.mjs && node --test test/architecture.test.mjs
```

## Failing-before

Neither the new verb's implementation nor its test existed before this
item's implementation commit — confirmed directly against the parent
commit, not inferred:

```
$ git show HEAD^:test/cli/fgos-version.test.mjs
fatal: path 'test/cli/fgos-version.test.mjs' exists on disk, but not in 'HEAD^'

$ git show HEAD^:src/cli/version.mjs
fatal: path 'src/cli/version.mjs' exists on disk, but not in 'HEAD^'
```

And, captured live during this item's own discovery round (before any
implementation), the pre-existing CLI's own unknown-verb usage line had no
`version` verb at all — the exact gap this item closes:

```
$ node bin/fgos.mjs --version
fgos: unknown verb "--version". Usage: fgos <init|add|submit|discover|plan|move|retrospective|cleanup|compound|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status|main-checkout-reset> ...
```

## Passing-after

Full verify chain, run against the real implementation commit
(`2c2346bc`):

```
$ node bin/fgos.mjs version | node -e "...verb-check..."
verb-check OK

$ node --test test/cli/fgos-manifest.test.mjs test/setup/*.test.mjs test/architecture.test.mjs
✔ fgos version works from a fresh cwd with no .fgos/ store at all
✔ fgos version reports the current build's own verb set, including "plan" but never "decompose" (tsk-403 rename retired the verb, only the stage alias survives)
✔ fgos version reports this checkout's own real git commit, not the tmp cwd's
✔ cli-version-visible passes and its message embeds the resolved packageVersion
✔ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus ... and cli-version-visible
✔ Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one
ℹ tests 177
ℹ pass 177
ℹ fail 0
```
