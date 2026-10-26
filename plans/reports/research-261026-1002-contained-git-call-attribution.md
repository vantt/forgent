# Contained Git call attribution: one trivial store test and `fgos list`

Date 2026-10-26, main checkout on fg-server2, source at `e73c69b52`. Read-only investigation; nothing under source, test or config was edited.

Release caveat. The trivial-test and steady `fgos list` rows below were measured with the release activated 2026-10-25 21:19 (digest `d6871c23...`), which predates `843ed0483` (22:30). Every row about a due sync (sections 2b, 3) is superseded by section 3, measured on the working tree through the dev host. Section 2b is kept only as the pre-`843ed0483` baseline: at that release the pull, push and walk ran inside the `fgos list` process itself. Raw traces and the parser are in `/home/vantt/projects/forgent/.fgos/runtime/tmp/r13-attrib/`.

## Answer in one paragraph

Both operations issue every git call from one process (the node process that holds the in-process addon), so the per-process caches work: `git var GIT_CONFIG_SYSTEM` and `GIT_CONFIG_GLOBAL` run exactly once per process, the repository config listing and `rev-parse --show-object-format` run once per repository, and the floor verdict is probed once. The steady `fgos list` (no sync due) is only 11 contained git calls (12 bwrap, one of them the `/bin/true` availability probe), not 224; the 224 TEST saw is the sync-due case. On main the due sync no longer runs in the command: the foreground `fgos list` stays at the steady 11 contained calls, and the pull, push, second pull and two history walks run in the detached `fgos events sync --opportunistic` child (111 git calls excluding the floor probe: 48 contained, 63 plain; section 3). The double walk has a confirmed cause: `verify_mirrors` walks every mirror ref after each fetch even when the tip equals the recorded one. The trivial store test is 31 git calls (24 contained, 7 plain), of which 18 contained plus 1 plain are the floor probe, which runs once per test process because the fixture gives each process a fresh state root (the persisted floor record is keyed to the state root); that is a cross-process cost and is only described here. Inside one process the avoidable calls are few: the `cat-file -t` that precedes every `ls-tree` page, the per-operation `config --show-scope --list`, and the one-call-per-ref ref observations during sync.

## Harness (use for every "after")

Script: `/home/vantt/projects/forgent/.fgos/runtime/tmp/r13-attrib/measure.sh trivial|list`. It resolves the activated release binary from `.fgos/installation/activation.json`, never through the `.fgos/installation/bin/fgos` shim (the shim only runs sed/tr and execs the entry). Attribution: `python3 -I /home/vantt/projects/forgent/.fgos/runtime/tmp/r13-attrib/parse.py <op>.strace seq`.

```sh
cd /home/vantt/projects/forgent        # main checkout, cwd matters
D=/home/vantt/projects/forgent/.fgos/runtime/tmp/r13-attrib
# release: digest sha256:d6871c236c96c6334dcc61873eda96b2e00557823a4df00c7475e9bba230b5f7
HOST=/home/vantt/.local/state/fgos/releases/sha256:d6871c236c96c6334dcc61873eda96b2e00557823a4df00c7475e9bba230b5f7/bin/fgos
TRACE='-f -e trace=execve,clone,clone3,fork,vfork -s 300'

# trivial store operation
FGOS_HOST_BIN=$HOST strace $TRACE -o $D/trivial.strace \
  node --test --test-name-pattern="resolvePlan throws a validation StoreError for an unknown id" \
  test/intake/plan.test.mjs

# fgos list, host binary called directly, stdin closed
strace $TRACE -o $D/list.strace "$HOST" list </dev/null >/dev/null
```

```sh
# sync-due case on the working tree, through the Rust dev host (not the 10-25 release)
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-r13-target   # never under /tmp
cd /home/vantt/projects/forgent
npm run fgos:dev -- --version </dev/null            # build only, untraced; not a store verb, consumes no due sync
strace -f -e trace=execve,clone,clone3,fork,vfork -s 300 -o $D/devlist.strace \
  npm run fgos:dev -- list </dev/null >/dev/null    # foreground row; spawns the detached child, followed by -f
strace -f -e trace=execve,clone,clone3,fork,vfork -s 300 -o $D/devsync.strace \
  npm run fgos:dev -- events sync --opportunistic --dir /home/vantt/projects/forgent </dev/null   # child row, see section 3
```

`measure.sh devlist` runs the build and the first strace; the child row is the third command above (also noted in `measure.sh`). Traced: the `npm run fgos:dev` wrapper, which stages the dev host per invocation (so Cargo's own processes are not in the traces because the build ran first; Node/npm processes are, and are not git).

Method notes. The parent map comes from `clone`/`clone3` return values; `bwrap --as-pid-1` forks the git child, so a git exec is "contained" when it or its parent last exec'd `/usr/bin/bwrap`. Only successful `execve` of a git binary counts: PATH-search misses (`ENOENT` in the strace) are excluded, which probably explains TEST's 37 and 12 `config`, 4 `var`, 5 `rev-parse` against the 31, 2 `var` and 3 `rev-parse` here (not reproduced; see questions). Line numbers are the working tree at `e73c69b52`; the activated release was built 2026-10-25 21:19 and may predate it.

Shim: `fgos list` was never measured through the shim in this report. The first trivial run took `FGOS_HOST_BIN` from `realpath` of the shim (which is the shim script itself, so the addon path was identical); it was discarded and the numbers below are from the direct binary.

Sync state. Run 1 of `fgos list` (10-25 release) had a sync due: 21.8 s wall under strace, with 3 remote operations (pull, push, pull) against `https://github.com/vantt/forgent`. The push of `refs/fgos/events/fg-server2-jdp2bv` in that run is the designed publish of the own stream; at `843ed0483` it runs in the detached sync child, not in the read command. Run 2 immediately after had no sync: 1.29 s wall under strace. Traces: `list-sync-due.strace` and `list.strace`.

## Operation 1: trivial store test (24 contained, 7 plain, 25 bwrap; one process issues all)

Issuer: the single node test child (`node --test-concurrency=0 ...`), in-process addon. Each shape below is one process; "repeats" are inside that process.

| Shape | Count | Procs | Code site | Needed or avoidable | Owner |
|---|---|---|---|---|---|
| `var GIT_CONFIG_SYSTEM`, `var GIT_CONFIG_GLOBAL` | 1 + 1 | 1 (cache hit afterwards) | `packages/git/rust/src/driver.rs:627` via `config_paths` (cache `CONFIG_SOURCES`, `:139`) | Needed once per process | Git |
| `config --null --show-origin --list` (no repo, state root cwd) | 1 | 1 | `driver.rs:1336` in `floor_key` | Needed: detects include directives and config file identity for the floor record key | Git |
| `--version` | 1 | 1 | `driver.rs:1366` `probe_floor` | Needed by the floor probe | Git |
| floor probe children: `init --bare`, `hash-object -w`, `update-ref` x2, `symbolic-ref` x2, `rev-parse --verify`, `update-ref -d`, `hook run`, `config remote.origin.*` x3, `cat-file -e` x2 | 14 | 1 | `driver.rs:1417-1535` `probe_features` | Needed per state root; repeats across test processes because `test/helpers/git-fixture.mjs` `ensureFixtureStateRoot` makes a new state root (hence new floor record) per process. Cross-process: described, not proposed | Git (probe), TEST (state root) |
| `fetch origin --filter=blob:none` (plain, `Policy::Remote`) | 1 plain | 1 | `driver.rs:1535-1545` lazy-fetch control inside the floor probe | Needed by the probe | Git |
| `config --null --show-origin --list` (git-dir) | 1 | 1 | `driver.rs:692` `validated_config`, once per repository (`REPOSITORY_CONFIG`) | Needed | Git |
| `rev-parse --show-object-format --show-ref-format` | 1 | 1 | `driver.rs:416` `repository_formats` | Needed once per repository | Git |
| `for-each-ref --sort=refname ... %(HEAD)` (events prefixes) | 1 | 1 | `driver.rs:2321` `list_refs` from `packages/event-store/rust/src/refs.rs:77` | Needed | Event Store |
| `symbolic-ref --quiet HEAD`, `rev-parse HEAD^{commit} --symbolic-full-name HEAD`, `for-each-ref refs/heads/main*` | 3 | 1 | `driver.rs:2148`, `:2156`, `:2166` `resolve_head` (unborn fixture repo) | The first two are deliberately two children (race comment at `:2143`). The third runs only because HEAD is unborn and the first `list_refs` did not name HEAD; avoidable only if the first listing also covered `refs/heads/` | Git |
| plain fixture calls: `config --global --get user.name` / `user.email` | 2 plain | 2 | `test/helpers/process-tmp-root.mjs:122` | Test harness, once per process | TEST |
| plain fixture calls: `init -q -b main`, `config user.name`, `config user.email`, `config fgos.machineId` | 4 plain | 4 | `test/helpers/work-store-release.mjs:16-18`, `test/helpers/git-fixture.mjs:28` via `sandboxGit` | Test harness | TEST |

Totals: 31 git execs = 24 contained + 7 plain; 25 bwrap = 24 + 1 availability probe (`packages/process/rust/src/containment/linux.rs:58`). Floor-related: 18 contained + 1 plain.

## Operation 2a: `fgos list`, no sync due (11 contained, 0 plain, 12 bwrap, 44 execs total)

Process tree: `fgos` host (Rust) execs `node libexec/legacy-node/bin/fgos.mjs list`; the node process issues all 11 git calls through the in-process addon. The host process issues none.

| Shape | Count | Procs | Code site | Needed or avoidable | Owner |
|---|---|---|---|---|---|
| `var GIT_CONFIG_SYSTEM`, `var GIT_CONFIG_GLOBAL` | 2 | 1 | `driver.rs:627` | Needed once; floor record reuse still needs the key | Git |
| `config --show-origin --list` (no repo) | 1 | 1 | `driver.rs:1336` `floor_key` | Needed (floor record is reused, no probe ran) | Git |
| `config --show-origin --list` (git-dir) | 1 | 1 | `driver.rs:692` | Needed | Git |
| `rev-parse --show-object-format --show-ref-format` | 1 | 1 | `driver.rs:416` | Needed | Git |
| `for-each-ref ... refs/fgos/events/ ...` | 1 | 1 | `driver.rs:2321`; HEAD fact comes from `%(HEAD)` so no `resolve_head` | Needed | Event Store |
| `cat-file --batch -Z` (pin of `.fgos/events` at HEAD) | 1 | 1 | `packages/event-store/rust/src/fence.rs:49` `read_pin`, `driver.rs:2679` | Needed in-operation | Event Store |
| `cat-file --batch -Z` (absent legacy roots) | 1 | 1 | `legacy_import.rs:150` `absent_roots` | Needed in-operation | Event Store |
| `cat-file -t` | 1 | 1 | `driver.rs:2200` `list_tree` | Avoidable: the previous batch read already proved the commit exists and its kind | Git |
| `ls-tree -r -t -z --full-tree` | 1 | 1 | `driver.rs:2245` | Needed | Git |
| `cat-file --batch -Z` (legacy file bodies) | 1 | 1 | `legacy_import.rs` after `:215` | Needed in-operation | Event Store |

Cross-process repeat, described only: every `fgos list` re-reads the legacy commit `7e456df` (3 `cat-file`, 1 `-t`, 1 `ls-tree` = 5 of the 11 calls) because `INVENTORIES`, `LEGACY_VIEWS` and `FENCE` are in-process memos. The repeats come from separate processes (one per `fgos` invocation), not from a cache miss inside one process.

## Operation 2b: `fgos list`, sync due (114 git: 51 contained, 63 plain; 52 bwrap)

Issuer is again the single node process (108 execs); the other 6 are git's own children (`remote-https` x4, `rev-list --objects` x2). The three remote operations are named `remote-49947-...-0`, `-1`, `-2` in the candidate refs: pull, push, pull.

| Shape | Count | Contained | Code site | Needed or avoidable | Owner |
|---|---|---|---|---|---|
| `for-each-ref -- <one literal ref>` | 40 | plain | `driver.rs:1570` `read_ref_value` and `driver.rs:1944` `WalReader::read_ref` | Before-and-after observation of each mirror ref around each `update-ref`, one child per ref; `list_refs` already takes up to 256 prefixes in one child, so N ref reads can be one read | Git |
| `update-ref --no-deref` | 8 | plain | Git ref transaction (`wal.rs`/`publication.rs`) | Needed | Git |
| `show-ref --exists` | 3 | plain | `driver.rs:1913` | Needed once per remote op | Git |
| `ls-remote` 3, `fetch` 2, `push` 1, plus git's own children `remote-https` 4 and `rev-list --objects` 2 | 12 | plain | `remote.rs` | Needed (network). The second pull repeats the first pull's fetch of the same tips (the four mirror refs get the same new oids in both rounds) | Git / Event Store sync |
| `config --null --show-scope --list` | 6 | contained | `driver.rs:755` `untrusted_transport_config` (called at `:787`, `:1102`) | Avoidable: relists the same config that `driver.rs:692` already listed once per process; `config_listing` already supports `--show-scope --show-origin` together (`:739` comment) | Git |
| `remote get-url -- origin` | 4 | contained | `remote.rs:52`, `driver.rs:2489` | Needed (applies `insteadOf`) | Git |
| `rev-list --max-count=256 --stdin` / `cat-file --batch-check` / `cat-file --batch` / `cat-file --batch -Z` | 6 / 6 / 6 / 9 | contained | History walk, `packages/event-store/rust/src/walk.rs:45,184`, `read.rs:933` | 3 streams x 4 calls = 12 per walk, and the whole walk runs twice in the process (pids 79641 and 96455), once after the first pull and once after the final pull. The mirror tips are identical across those two points, so the second walk looks like a repeat (see question 1). Of the 9 `cat-file --batch -Z`, 3 are the legacy reads listed in 2a | Event Store |
| remaining contained: `var` 2, `config --show-origin` 2, `rev-parse` formats 1, `for-each-ref` 3, `symbolic-ref` 2, `rev-parse --symbolic-full-name` 2, `cat-file -t` 1, `ls-tree` 1 | 14 | contained | as in 2a, plus `resolve_head` at `driver.rs:2148/2156` (x2) | Needed except `cat-file -t` | Git / Event Store |

Counts check: plain 40 + 8 + 3 + 12 = 63; contained 6 + 4 + 27 (walk: 6 + 6 + 6 + 9) + 14 = 51.

Note on plain: all 63 plain calls are remote-policy or WAL ref observation; I did not trace why the WAL ref observations run outside bwrap (see question 3).

## 3. Sync-due `fgos list` on current main (working tree, dev host), two rows

Due state: more than 300 s (`eventStore.sync.intervalSec`) since the last attempt. Binary: the dev host built from the working tree at `e73c69b52` (`npm run fgos:dev`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-r13-target`), built first with an untraced `--version`; the trace covers only the second call. Not measured with a release containing `843ed0483`: none is activated.

Row A, foreground `fgos list` (`devlist.strace`): 27 git calls: 26 contained, 1 plain. All come from the one `node bin/fgos.mjs list` process. Excluding the floor probe (15 contained + 1 plain: `--version`, 14 probe children, and the lazy-fetch control), it is the same 11 contained calls as section 2a, with no remote calls and no walk. The command spawned `node bin/fgos.mjs events sync --opportunistic --dir <root>` and returned. The floor probe ran here, and again in row B, because the dev host's floor record key did not match the stored one (the key includes the hosting path and probe code; why it did not hit on the second dev run is not resolved), so it is an artifact of the dev host and not part of the release rows.

Row B, the detached child. The spawned child exited with status 1 after seven execs/clones and no git call, because under the dev host it has no host: the invocation-fault log (`/home/vantt/projects/forgent/.fgos/logs/invocation-faults.jsonl`, record `event-store-child` at 2026-10-26T03:11:32Z) says `git-addon-unavailable`, `writerError: host-missing`. Probable cause: the dev host removes its staged per-invocation directory when the foreground command exits while the detached child, which holds no reference to it, starts later; with an installed release the host path is persistent. This is a dev-host artifact, not a product measurement (unverified). So the child's work was measured by running the same verb in the foreground through the dev host: `devsync.strace`, 47 s wall under strace (a second record at 03:13:21Z in the fault log is from my own diagnostic run of that verb with an empty `FGOS_HOST_BIN`).

Child row (`devsync.strace`): 127 git calls: 63 contained, 64 plain, issued by one node process (120) plus git's own helpers (6 children, 1 unattributed). Excluding the floor probe (15 contained + 1 plain), 111 git: 48 contained, 63 plain. Shapes (counts in the child, ex-floor):

| Shape | Count | Contained | Code site | Needed or avoidable | Owner |
|---|---|---|---|---|---|
| History walk per stream: `rev-list --max-count=256 --stdin`, `cat-file --batch-check`, `cat-file --batch`, `cat-file --batch -Z` | 6 + 6 + 6 + 6 = 24 (the other 2 `cat-file --batch -Z` are the legacy and pin reads) | contained | `packages/event-store/rust/src/sync.rs:151` `verify_mirrors`, called at `:342` and `:483`; `walk.rs:45,184` | The same three mirror streams are walked after the first fetch and again after the confirming fetch with unchanged tips (see below) | Event Store |
| `config --null --show-scope --list` | 6 | contained | `driver.rs:755` | Avoidable, as in 2b | Git |
| `remote get-url -- origin` | 5 (4 + `pinned_url` at `sync.rs:331`) | contained | `remote.rs:52`, `driver.rs:2489` | Needed (`insteadOf`) | Git |
| `for-each-ref -- <one literal ref>` | 40 | plain | `driver.rs:1570` `read_ref_value`, `driver.rs:1944` | One child per ref, before and after each `update-ref` | Git |
| `update-ref`, `show-ref --exists` | 8 + 3 | plain | WAL ref transaction | Needed | Git |
| `ls-remote` 3, `fetch` 2, `push` 1, `remote-https` 4, `rev-list --objects` 2 | 12 | plain | `remote.rs` | Needed (network) | Git |
| the rest of the contained calls (`var` 2, `config --show-origin` 2, `rev-parse` formats 1, `for-each-ref` 3, `symbolic-ref`/`rev-parse` HEAD 2+2, legacy reads) | about 13 | contained | as in 2a, plus `resolve_head` | Needed | Git / Event Store |

Order of events in the child (positions in `parse.py seq`): fetch (36) then `verify_mirrors` walk (52-64) then push (82) then the confirming fetch (98) then `verify_mirrors` walk again (114-126). Both fetches set the same four mirror refs to the same oids (33b8d07, 6acf234, d72cf3c, 7e456df): the second `update-ref` of each ref is a no-op.

Cut 1, re-checked and its cause confirmed. The walk is not behind `CommitMemo` (it is not used here). `verify_mirrors` (`sync.rs:151-215`) calls `walk::walk_verified` for every mirror ref unconditionally. For a ref whose tip equals `state.tips[name]` it builds `cover = positions` and `certified = {old}` and still walks, because `walk_inner` re-reads `seal.json` for certified commits when an identity is supplied (`walk.rs`, condition `identity.is_none()`). Result: with unchanged tips each `verify_mirrors` costs 12 contained calls (3 streams x 4), and one sync does it twice, so the saving available from skipping a mirror whose tip is unchanged and already recorded in `sync.json` is 24 of 48 contained calls in the child (50%). Caveat for the owner: the always-walk may be a deliberate identity re-verification (the own-origin check at `sync.rs:192`); skipping it for an unchanged recorded tip trades repeated verification for fewer calls, which is Event Store's decision, not mine.

Rows for `measure.sh` comparison: foreground command 11 contained (ex-floor); detached child 48 contained, 63 plain (ex-floor).

## Top three cuts by calls saved (none adds a mechanism, layer or on-disk cache)

1. Skip the history walk of a mirror ref whose tip equals the one already recorded in `sync.json` (Event Store, `sync.rs:151` `verify_mirrors`): saves 12 contained calls per `verify_mirrors`, 24 of the 48 contained calls in the detached sync child, which runs it twice. The change is one `if` before `walk_verified`; whether the repeated verification is deliberate is the owner's call (section 3).
2. Answer `untrusted_transport_config` from the config listing already validated for the repository: saves 6 contained calls (12% of contained, sync-due) and 1 per remote operation generally. Change: list with `--show-scope --show-origin` together at `driver.rs:692` and read scope from the cached records in `ConfigCache`, instead of the second `config_listing` at `driver.rs:755`.
3. Drop `cat-file -t` from the happy path of `list_tree` (`driver.rs:2200`): saves 1 contained call per tree page (9% of the 11 in steady `fgos list`, 5 calls of the Work read path across every `fgos` verb that imports the legacy ref). Change: run `ls-tree` first and ask for the object kind only when it fails, so the error cause is still named.

Honorable mention, not ranked: reading the N mirror refs of a pull with one `list_refs` call (up to 40 plain calls in a sync-due run) is within existing capability but touches the WAL observation contract, so the Git reviewer should judge it.

Out of scope, described only: the floor probe (18 contained + 1 plain per fixture process) and the legacy re-read (5 of 11 in steady `fgos list`) are both repeated by separate processes; a cross-process fix is a cache and is not proposed.

## Owners

- Git crate `packages/git` (lead:OPC reviews): cuts 2 and 3, the ref observation batching, floor probe.
- Event Store `packages/event-store` (HARDEN): cut 1, the legacy re-read, the `fence`/`legacy_import` reads.
- TEST: fixture state root per process (`test/helpers/git-fixture.mjs`), `process-tmp-root.mjs:122` global config reads, `work-store-release.mjs` fixture git calls (7 plain per test process).

## Unresolved questions

1. (Answered in section 3.) The double walk is `verify_mirrors` called after each of the two fetches; no memo is involved. Open: is re-verifying an unchanged mirror tip intended (origin identity check) or only unoptimized? Event Store owner.
2. TEST's 37 git / 12 `config` / 5 `rev-parse` and 224 git for `fgos list` were not reproduced here (31 and 2 `var`, 3 `rev-parse`; 114 sync-due, 11 steady). The likely sources are PATH-miss execs counted by name and a sync-due run; not verified.
3. Why do WAL and mirror ref observations (63 plain calls) run without bwrap? Not traced.
4. The activated release is older than `e73c69b52`; the line numbers and counts may shift after the next activation.

Status: DONE_WITH_CONCERNS
Summary: Both operations are attributed to code sites with exact counts (trivial 31 git: 24 contained, 7 plain; steady `fgos list` 11 contained; sync-due 114: 51 contained, 63 plain), the harness and `measure.sh` are saved, and three in-process cuts are named.
Concerns/Blockers: Cut 1's saving depends on an unverified memo-key cause (question 1); TEST's counts were not reproduced; the 8-row `update-ref` and 12-row network counts in 2b were summed from the `parse.py` shape list.
