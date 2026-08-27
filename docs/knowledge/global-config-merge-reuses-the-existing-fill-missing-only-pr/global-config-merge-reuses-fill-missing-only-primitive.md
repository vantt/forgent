---
framework: diataxis
mode: explanation
---
# Global config merge reuses the existing fill-missing-only primitive

`tsk-2ta-1` needed fgOS to read a new global config file
(`~/.fgos/config.json`) and merge it with a project's own config, with the
project always winning any key present in both
(`docs/history/global-project-config-awareness/CONTEXT.md` D1). The
straightforward path would have been writing a new merge function for this
one case. It didn't need to.

## The primitive already anticipated this caller

`src/setup/config-merge.mjs`'s own header comment, written before this item
existed, already named the future need:

> "Designed for reuse by any config shape (not hardcoded to
> the runner config's own fields) — today's one caller is
> `runner/dispatch.mjs`'s `ensureRunnerConfigForDir`, **a future caller may be a
> user-level config file**."

`mergeConfigDefaults(existingConfig, defaultConfig)` is a fill-missing-only
merge: any key already in `existingConfig` is kept exactly as-is, and only a
key `existingConfig` is missing gets copied in from `defaultConfig`. That is
already, byte-for-byte, "project always overwrites global" — call it as
`mergeConfigDefaults(projectConfig, globalConfig)` and the existing
semantics (existing wins, defaults only fill gaps) becomes exactly the
locked precedence rule, with zero new merge logic and the function's
existing test coverage (`test/setup/config-merge.test.mjs`) already backing
the mechanism.

`src/config/global-config.mjs`'s `mergeWithGlobalConfig` is a thin
composition on top of this: read the global file (missing file → `{}`,
invalid JSON → a clear thrown error, mirroring `dispatch.mjs`'s
`loadRunnerConfig` discipline for the project-level file), then hand both
configs to the same `mergeConfigDefaults` the runner config path already
uses and trusts.

## What this bought, and what it didn't

Reusing an already-tested primitive meant the new module's own precedence
tests (`test/config/global-config.test.mjs`) only had to prove the
composition, not the merge algorithm itself — the algorithm's correctness
already had prior evidence. Building on a primitive the codebase already
had *does* let a small item stay small.

It does not, by itself, make the feature live. As recorded on the item's
own commit: the new module is intentionally not yet wired into
`src/runner/dispatch.mjs`'s real `ensureRunnerConfig` path — the one that
actually feeds a running `fgos`/`fgos-runner` invocation — and
`src/setup/checks.mjs`'s existing `checkConfigNotStale` was deliberately
left untouched to avoid regressing its already-tested behavior for a case
outside this item's own declared footprint. The read+merge primitive is
real and proven; a caller that puts it on the runtime path is a separate,
not-yet-done piece of work.

## The general shape

Before writing a new merge/precedence function for a new config surface,
check whether an existing fill-missing-only or overwrite-only primitive in
the codebase already has the exact semantics needed, just applied to a
different pair of inputs. A primitive's own header comment naming a
"future caller" is a real signal, not decoration — reading it first can
turn what looks like new logic into composition of something already
proven.

## The write side hits the same shape (`fgos setup`, tsk-1ri)

`tsk-2ta`'s work above made global config *readable* — `fgos doctor` could
report which level was active, but nothing actually wrote
`~/.fgos/config.json`. A user who wanted a global config had no guided way
to get one. `tsk-1ri` closed that gap, and ran into the exact same
already-proven-primitive shape one layer over, on the write side instead of
the read side.

The project-local init path already existed:
`ensureSharedConfigDefaults(dir)` (`src/setup/registrations.mjs:161-171`)
reads the existing config at `dir`, computes the full default shape via
`assembleRegistryDefaults()`, fills in only genuinely-missing keys via
`mergeConfigDefaults`, and writes the result — the same fill-missing-only
discipline documented above, just applied to *writing* a file instead of
*merging* two in-memory configs. The obvious-looking path was a new
`ensureGlobalConfigDefaults` function, or a write path added to
`global-config.mjs` duplicating `readSharedConfig`/`writeSharedConfig`.

It wasn't needed. `ensureSharedConfigDefaults(dir)` was already dir-generic
— nothing inside it assumes `dir` is a project root — and
`sharedConfigFilePath(os.homedir())` resolves to
`path.join(os.homedir(), '.fgos', 'config.json')`, byte-identical to
`global-config.mjs`'s own `defaultGlobalConfigPath()`. So
`ensureSharedConfigDefaults(os.homedir())` already does exactly what was
needed, with zero new functions — a call-site change in `bin/fgos.mjs`'s
`setup` case (calling the same function twice, once per `dir`), not new
logic anywhere else. The plan's own words for the rejected alternative:
"it would duplicate logic `ensureSharedConfigDefaults` already provides
byte-for-byte, for no behavioral difference... violates DRY for no gain;
the existing function's own `dir` parameter already generalizes to this
case honestly."

Same lesson as above, now confirmed on both sides of the read/write pair:
a primitive already generalized over its input (a `dir` parameter, a pair
of configs) is worth checking against the new surface *before* reaching
for a parallel function that would just duplicate it.
