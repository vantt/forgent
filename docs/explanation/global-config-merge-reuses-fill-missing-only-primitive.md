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
> `.fgos-runner.json`'s own fields) — today's one caller is
> `runner/dispatch.mjs`'s `ensureRunnerConfig`, **a future caller may be a
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
