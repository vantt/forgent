# Research log — dispatch.mjs execute --prompt-file flag (tsk-3ps)

## Round 1 — 2026-08-20 (discovery stage, fgos-researching helper)

**Asked:** current shape of `execute`'s flag parsing in
`src/runner/dispatch/cli.mjs` post tsk-3av merge (which added
`fanout-batch` and switched `execute` to a `switch` structure); whether
`executeExecutorCli`'s signature would need to change to support a
file/stdin-sourced prompt; whether an existing `--*-file`/stdin
convention exists to mirror; and whether the already-delivered tsk-37l
("reusable wrapper-script helper") makes this item redundant.

**Checked:**
- `src/runner/dispatch/cli.mjs:826-861` (`case 'execute':`, full read) —
  `--prompt` is parsed via the local `flagValue(name)` helper
  (line 821-824: `rest.indexOf(name)` then next token), a plain
  string lookup with no special handling.
- `src/runner/dispatch/cli.mjs:336-360` (`executeExecutorCli` signature,
  full read) — `prompt = ''` is already a plain string option (line 339).
  A `--prompt-file <path>` flag can be handled entirely in the CLI layer
  (read the file with `fs.readFileSync`, pass the content as `prompt`)
  with **zero signature change** to `executeExecutorCli`.
- `rg -- "-file'" src bin` and `rg "process.stdin|readFileSync(0"
  src bin` — no existing `--*-file` flag or stdin-reading convention
  exists anywhere in this codebase to mirror; the item's own suggested
  flag name (`--prompt-file`) is the only concrete proposal on the table.
- `test/runner/dispatch.test.mjs:3411,3441` — real `spawnSync`-based CLI
  tests already exist for `execute`, confirming a real verify command:
  `node --test test/runner/dispatch.test.mjs` (or full `npm test`).
- `fgos show tsk-37l` (full read) — status `delivered`, stage `executing`,
  branch `fgw/tsk-37l`, **not yet merged to main**
  (`git log --oneline main` has no tsk-37l commit; found instead on
  `git log --all --grep=wrapper`: commit `9e373a72 feat(scripts): add
  write-wrapper-script.mjs helper (tsk-37l)`).
- `git show 9e373a72:scripts/write-wrapper-script.mjs` (full read) — a
  GENERIC command-wrapper: takes an arbitrary `--command` string, writes
  it into a chmod'd `.sh` file, returns the path. It does not read a
  prompt from a file itself; a caller still has to get the long prompt
  text into the `command` string somehow (or, in practice, author the
  wrapper file's content directly via the Write tool, bypassing this CLI
  entirely for prompt-heavy cases).
- `docs/history/dispatch-wrapper-script-shared-helper/RESEARCH.md`
  (tsk-37l's own discovery round, full read) — explicitly evaluated a
  `--prompt-file` flag on `dispatch.mjs execute` as a possible fix and
  found it insufficient **for tsk-37l's own broader scope** (it would not
  help the Monitor live-tee `| grep` pipe case, nor unrelated
  verify/gate-check/probing wrapper scripts) — not a claim that
  `--prompt-file` has no independent value for the plain-prompt case.

**Found:** `--prompt-file <path>` is a self-contained, mechanical CLI-layer
change: read the file synchronously, pass its content as `prompt` to
`executeExecutorCli` unchanged. `node .../dispatch.mjs execute <id>
--prompt-file <path>` is a single plain command with no shell substitution
or piping, so it structurally cannot trip the worktree-isolation guard
(confirmed empirically this session: a plain single-line `node
bin/fgos.mjs pick ... --dir ...` command passed the guard that refused an
equivalent multi-line/compound script). tsk-37l's delivered
`write-wrapper-script.mjs` helper is complementary, not a substitute: it
is a general any-command wrapper (useful for verify probes, gate-check
scripts, and the Monitor live-tee case), while this item removes the need
for a wrapper script entirely in the common "just pass a long prompt to
execute" case — the exact case the item's own description cites
(dispatching `fgos-coding-implement` out-of-process for tsk-3av/tsk-5pb).
No scope overlap or redundancy found; the two items solve different
slices of the same underlying friction.

**Verdict:** clear. Scope: add `--prompt-file <path>` to `case 'execute'`
in `src/runner/dispatch/cli.mjs` (`runDispatchCli`), reading the file with
`fs.readFileSync(path, 'utf8')` and passing it as `prompt` (mutually
exclusive with, or overriding, `--prompt`); no change to
`executeExecutorCli`'s signature. Verify:
`node --test test/runner/dispatch.test.mjs` plus a new CLI-level test
mirroring the existing `spawnSync`-based execute tests at lines 3411/3441.
Stdin support ("(or stdin)" in the item description) is a secondary,
non-blocking nice-to-have — the file-flag alone satisfies the item's
actual observed friction (a real file already exists on disk in every
cited incident).
