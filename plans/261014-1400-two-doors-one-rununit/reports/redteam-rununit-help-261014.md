# Red team: `--help` / `-h` manifest door (feat/rununit-help @ b060f41b1)

Date: 2026-10-14. Target: committed HEAD `b060f41b1` (`git diff main...feat/rununit-help`).

**How it was run.** While this red team ran, someone else was editing the worktree:
`bin/fgos.mjs`, `src/cli/command-registry.mjs` and two tests were uncommitted.
A first parity sweep failed with "manifest digest mismatch" because `bin/fgos.mjs`
changed partway through. So every result below comes from a frozen copy of HEAD
(`git archive b060f41b1` into the scratchpad):
- Node direct: `node <snap>/bin/fgos.mjs`.
- Rust host: the branch's binary (`~/.cache/fgos-lane-help-cargo/debug/fgos`, built
  incrementally through `scripts/run-rust-dev-host.mjs`), copied into the snapshot,
  with a manifest built exactly as the dev-host script builds it.

Each attack ran with `env -u CLAUDE_CODE_SESSION_ID` and cwd set to a new `mktemp -d`.
After each run I listed the temp dir and `~/.fgos`, `~/.config/fgos` and `~/.cache/fgos*`
for new files. The snapshot cannot resolve some npm deps (`yaml`), so `workflow status`
did not run in the snapshot. Help paths did not need it.

A few checks were also re-run against the uncommitted fix in the worktree, marked "WIP" below.

## Hits

### H1. A help token taken as a flag's value runs the verb, side effects included. HIGH (at HEAD)
`parseArgs` gives the next token to any `--flag` as its value. Node at HEAD only looks at
`flags.help` and positional `-h`, so in `--json -h`, `--anyflag -h` or `-- -h` the `-h`
becomes a value and the verb runs. The Rust host still forwards the call, because it sees
`-h` and treats it as a help request, then Node runs the operation anyway.
`<verb> --help|-h [--json]` is the advertised form, and an agent can easily write it in the other order.

| Repro (temp dir) | Observed | Expected |
|---|---|---|
| `fgos init --json -h` (N and H) | exit 0, fgos.v1 envelope, **`.fgos/` created** (events.jsonl, cache/state.json, coexistence.json) | init manifest entry, no store |
| `fgos init --foo -h`, `fgos init -- -h` (N and H) | init runs, `.fgos/` created | help |
| `fgos init --dir -h` (N and H) | creates `./-h/.fgos/` | help |
| `fgos session start --json -h` via the host, in a temp git repo | exit 0, **real session: git worktree `/tmp/fgos-sessions/<id>-…` created, `.fgos/sessions.json` written** (removed afterwards) | help |
| `fgos dispatch decide --json -h` | runs decide (usage error, exit 4) | dispatch/decide help |
| `fgos version --json -h` | runs version (envelope) | help |

Not fired, because they would launch real agents or a real gateway: `run "<p>" --json -h`,
`workflow start <preset> --json -h`, `gateway start --json -h`. They go through the same
code path, so they would have the same result.
**WIP status:** fixed in the uncommitted worktree, where Node checks
`rest.includes('--help'|'-h')`. Re-running the first three rows against the WIP
`bin/fgos.mjs` gave help with no store created. Needs a regression test with the help
token after a value-taking flag (`--json -h`, `--x -h`, `-- -h`).

### H2. Top-level help fails through the user's `fgos` shell function. HIGH (at HEAD)
The `fgos` shell function adds `--dir <root>` to every call (`whence -f fgos`).
`handleHelp` rejects any other dash word:
`fgos --help --dir /tmp` and `fgos -h version --dir /tmp` → exit 4, `unknown option "--dir" for --help` (N and H).
So the main human entry point `fgos --help` is broken.
**WIP status:** fixed in the uncommitted worktree (`--dir`, its value and `--dir=` are dropped).
Remaining WIP edge: `fgos --help --dir dispatch` treats `dispatch` as the dir value and prints the whole manifest. LOW.

### H3. Native verbs' help hides their sub-verbs, and the old host listing was removed. MEDIUM
`main.rs` used to answer `fgos metrics --help` with "Available subcommands: …". This
branch removed that branch and sends the call to Node. The registry entries for
`metrics`, `friction` and `convention` have no `subcommands`, so:
- `fgos --help metrics runs` → exit 4 `metrics takes no sub-verb (got "runs")`, yet the same output says `fgos metrics <subcommand>`.
- `fgos friction --help` → only "recording, resolution, inspection, and ranking". The text never names `record`, `resolve`, `list`, `show`, `rank`, `ping` or `migrate`. The only place an agent sees them is the error for an unknown sub-verb (`fgos friction bogus`).
- `fgos metrics bogus -h` and `fgos convention bogus --help` → exit 0 with the generic entry. The brief says an unknown sub-verb under help should exit 4. Without help, the host rejects `bogus`.
- Manual check: an agent trying `friction record` gets nothing from help. It has to find
  `--subject` (format `kind:id`) and `--layer` one error at a time.

Expected: generate native sub-verbs into `subcommands` (the host knows `available`), or keep the host's listing.

### H4. A help token used as a flag value on a native verb gives a misleading error. MEDIUM (at HEAD)
`fgos convention name --slug -h`, `fgos metrics snapshot --json -h`, `fgos convention name --json -h`
via the host → exit 4 `fgos: "convention" chỉ có ở Rust host.`
The host forwarded the call to Node, Node did not see a help request (same cause as H1),
and the error says the verb exists only on the Rust host, while it is in fact running on the Rust host.
WIP: `convention name --slug -h` now prints convention help. Fixed by the same change.

### H5. The verb-first form and the help-first form disagree on extra words. LOW
- `fgos init bogus --help` → exit 0 (help), but `fgos --help init bogus` → exit 4 (`init takes no sub-verb`). Same for `friction bogus --help` and `version bogus --help`. Still the case in WIP.
- `fgos dispatch --help decide bogus` → exit 0, but `fgos --help dispatch decide bogus` → exit 4 (too many words).
- `fgos dispatch --help -h` and `fgos dispatch decide --help -h` → exit 4 `unknown dispatch sub-verb "-h"`. `flags.help` swallows `-h` and is then read as the sub-verb. Still the case in WIP.

### H6. Sub-verb entries have no risk label of their own. LOW
`subcommands.<sub>` has no `touchesState` or `externalEffect`. `fgos --help merge list` prints
`fgos merge <list|next> [write]` (and `goal show` prints `[write]`), while the description
says list and show are read-only. An agent reading the JSON for one sub-verb sees
`touchesState: true` for a read-only sub-verb.

### H7. Help text disagrees with real behaviour. LOW, PRE-EXISTING
- `fgos tool query` (manifest example, described as returning the provider set) **writes
  `.fgos/config.json`** the first time ("wrote a default (executor: claude)"). The tool
  entry's description does not mention this.
- `friction` is labelled `touchesState: false` / `[read]`, but `record`, `resolve` and `migrate` write.
- Node's unknown-verb usage lists `item`, but `item` is not a verb (`fgos item --help` → unknown verb).
- When stdout is closed early (`| head -c 100`) or the disk is full (`>/dev/full`), help crashes with
  an unhandled `EPIPE` / `ENOSPC` Node stack trace and exit 1. `handleHelp` on main does the same.

## Misses (behaved as specified)

**Floor 1: help of side-effecting verbs (form `<verb> [sub] --help|-h` and `--help <verb>`), N and H.**
`init --help`, `session start -h`, `gateway start --help`, `workflow start code-panel --help`,
`run "do x" --writes x --help`, `merge next --help`, `tool check -h`,
`dispatch probe-account --help`, `metrics runs --help`, `metrics snapshot -h`,
`friction record --help`, `--help init`: all exit 0 and print help. No new file in the temp
dir and no new file under `~/.fgos` that this run created. The `~/.fgos/runtime/provider-capacity`
files changed during two runs, but they came from other sessions and not from these
help calls: they also changed at other times, unrelated to these calls.
`-h friction record` → exit 4, correctly refused.

**Floor 2: leading options and odd help forms.** All exit 4 with empty stdout, N and H:
`-h foo`, `--help --bogus`, `--help add submit`, `--made-up version`, `-x`, `--HELP`,
`--help=1`, `-- --help`, `--help ''`, `--help 'add '`, `--help __proto__`, `--help constructor`,
`--help dispatch __proto__|constructor|toString`.
Accepted as specified: `-h -h`, `--help --json --json`, `-h version --json`.

**Floor 3: native verbs.**
- Accepted: `metrics -h runs`, `version -h`, `version --help --json`, `gate-bypass -h`, `convention --help name --json`.
- Rejected without help: unknown native sub-verbs `metrics bogus`, `convention bogus` and `friction bogus` → host exit 4 with a list of the valid sub-verbs.
- `gate-bypass set heavy --json -h` ran gate-bypass's read-only status. It wrote nothing.
- Exceptions: H3 and H4.

**Floor 4: sub-verbs.**
- Unknown sub-verbs rejected, exit 4 with stdout empty: `dispatch bogus --help --json`, `workflow stages --help`, `session bogus -h`.
- Narrowed to the named sub-verb: `dispatch --help decide --json` (the value-swallow form), `dispatch -h decide`, `dispatch --json --help decide`, `session --help start`.
- Help shown for `hook`: `hook --help`, `hook bogus -h --json`, `hook -h x y z`.

**Floor 5: large-manifest truncation.**
- Byte count: `--help --json` is 136,496 bytes from both Node and the host, byte-identical.
- Pipe and slow readers: piping through `cat`, a reader that sleeps 3 s, and a reader that pauses between lines all received all 136,496 bytes, and `JSON.parse` succeeded every time.
- File and text: a redirect to a file is identical. Text `--help` is 31,753 bytes and identical.
- `head -c` exits 1 with EPIPE on stderr (H7). This is the same as on main.

**Floor 6: Node vs host parity.**
- Coverage: all 101 verb and sub-verb pairs from the manifest, each in 4 forms (`--help X`, `X --help --json`, `-h X --json`, `X -h`). That makes 404 invocations.
- Result: 0 differences in stdout bytes or exit codes, 0 non-zero exits, and no files left in the temp cwd.

**Help routes in the host.**
- `fgos version` on the host lists no `--help` or `-h` verb.
- `export-command-selectors.mjs --check` passes, so `fgos doctor`'s command-routes drift check stays green.
- `explain-command-route.mjs -h|--help` resolves to legacy-cli.

**Documented examples in an initialized temp store.** These work as documented:
- `goal show`, `merge list`, `session list`, `tool query [--capability … --status present]`, `agents list`.
- `workflow operations planning` and `workflow operations --step planning --domain coding`.
- `dispatch inspect --run run_abc123`, `dispatch reconcile plan`, `dispatch decide --for general-purpose --has-live-task-access`.
- `dispatch show-run`, `watch` and `recover run_abc123` exist and return "no run" (exit 2).
- Required positionals are enforced with matching messages: `goal set`, `session end`, `dispatch show-run`, `workflow operations`.
- Unknown sub-verbs of `merge`, `goal`, `tool` and `agents` → exit 4.

## Cleanup
- I removed the session worktree that H1 created (`git worktree remove --force`) and its temp repo.
- I removed `.fgos/runtime/dev-host/redteam-help` from the worktree. The dev-host directory is left empty.
- I did not edit or commit any repo file except this report.

Status: DONE_WITH_CONCERNS
Summary: At HEAD b060f41b1, a help token placed after a flag value (`init --json -h`, `session start --json -h`) runs the verb and its side effects, through both Node and the Rust host. Top-level `fgos --help` also fails through the user's `--dir`-adding shell function. The uncommitted worktree fixes both. Parity (404 invocations) and the truncation checks are clean.
Concerns/Blockers: Commit the WIP fix with regression tests (help token after a value-taking flag, and `--help --dir`). Native verbs (metrics, friction, convention) still have no sub-verb schemas, and their unknown sub-verbs under help exit 0 (H3). Sub-verb risk labels are missing (H6). The verb-first and help-first forms are inconsistent (H5).
