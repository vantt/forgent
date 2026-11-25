# Confined mailbox diagnosis — phase 1

Status: **done. Both failures reproduced live from a real confined lead head (section "Live head evidence"); one cause per failure named with its source line.**

The body below was written by an assignment worker that had no head socket. The lead then ran the missing probes from
its own confined head session; that section supersedes the "unavailable" cells of the persona matrix for the lead.
The other personas follow the same code path (`routing.rs:660` is persona-independent); their permission rows are
source-proven in the matrix.

The confined worker reproduced `lock-unavailable` for both `inbox` and a local `send`. The kernel rejects the mailbox lock open with `EROFS`; this is not lock contention. Source tracing also identifies why a code-less mailbox failure becomes `host-failed`. This worker has no head persona or request socket, so it did **not** reproduce a forwarded head send, run the five-persona matrix, or reproduce the historical Event Store floor failure. Those missing observations must not be treated as passing evidence.

The inbox routing correction belongs in `apps/fgos/src/routing.rs:660` (the existing confined argv window), which is **outside phase 4's declared footprint and the whole plan's footprint**. Phase 4 must resolve that ownership/scope gap through its prescribed coordination-help door before implementation. No code or plan changes were made here.

## Coordinates and method

- Source checkout: `/home/vantt/projects/forgent-worktrees/261125-2313-head-communication-agent-to-agent-p01`.
- Inspected source HEAD: `423fc46e6ed5fa4fa6434b0e8fc594d7c19a4a3a`.
- Observation date: 2026-11-25; live JSON timestamps below are UTC (local timezone UTC+07).
- Current process is a confined assignment worker, writer `FGOS_SESSION_ID=att-cmd_1795623742205_6b8a3476`. Its environment contains `FGOS_CONFINED`, but **no** `FGOS_HEAD_REQUEST_SOCKET`, `FGOS_HEAD_PERSONA`, or `FGOS_HEAD_ROLE`.
- `fgos` resolves to `/home/vantt/.local/bin/fgos`; `strace` to `/usr/bin/strace`.
- Main checkout activation: `sha256:33f462be401154a0dc869e8c830d92a970a99b5ca95d01346fc8f6a41424a4a0`, activated at `2026-11-25T11:42:43.994Z`. Executed commands below use that installed release; inspected source is the assignment checkout. Rust freshness equivalence between the two has **not** been established.
- Commands were captured with Python `subprocess.run(..., text=True, capture_output=True, timeout=30)`; no shell output redirection or scratch files. `strace` output was captured in memory. Only relevant syscall lines are reproduced; they are labelled excerpts, not complete stderr.
- Input docs read: the plan and phase-01/phase-04 briefs, reading map, confinement spec, mailbox spec local-record section and history, discussion rows 5/7/14 and Seed, both backlog records, permission contract and source inputs named by the brief.

## Step 1: actual commands and output

### Initial launcher obstruction in the assigned worktree

Actual argv, separately executed:

```json
["fgos", "mailbox", "send", "--to", "head:supervisor-forgent", "probe"]
["fgos", "mailbox", "inbox"]
["fgos", "session", "list", "--json"]
```

Each exited **127**, stdout empty, stderr exactly:

```text
fgos: no .fgos/installation found above /home/vantt/projects/forgent-worktrees/261125-2313-head-communication-agent-to-agent-p01 -- run 'fgctl init' in the project
```

The installed launcher `/home/vantt/.local/bin/fgos:4` searches ancestors of `$PWD` for activation; `:7` exits 127. A sibling linked worktree is not below the activated main checkout. This is separate from mailbox behavior and outside phase 4. No installation was created or changed. For the following probes only the subprocess cwd was set to the already activated main checkout; the confinement and writer environment were unchanged.

### Inbox, real confined process

Cwd: `/home/vantt/projects/forgent`.

Argv: `["fgos", "mailbox", "inbox", "--json"]`.

Exit: **1**. Stderr: **empty**. Full stdout:

```json
{
  "contract": "fgos.v1",
  "generated_at": "2026-11-25T16:23:18.728Z",
  "data_hash": "6077bd4fcfcaa497f0734f8e82f77e5bdc4d895ec34b6737245307f1485f0db3",
  "data": {
    "ok": false,
    "text": "Not done: the mailbox record failed (lock-unavailable) and nothing was changed. Try once more later; do not loop."
  }
}
```

### Send, real confined process without a head socket

Cwd: `/home/vantt/projects/forgent`.

Argv: `["fgos", "mailbox", "send", "--to", "head:supervisor-forgent", "probe", "--json"]`.

Exit: **1**. Stderr: **empty**. Full stdout:

```json
{
  "contract": "fgos.v1",
  "generated_at": "2026-11-25T16:23:18.752Z",
  "data_hash": "3d9814a732e37fb3dbbba0802be772ac3b2b9defecff0910c2afa9b281942f28",
  "data": {
    "ok": false,
    "recorded": false,
    "text": "Not done: the mailbox record failed (lock-unavailable) and nothing was changed. Try once more later; do not loop."
  }
}
```

This send is **not** a forwarded send and is not evidence of any head persona's permission decision. The probe failed before recording mail. There was no wake flag.

A discovery attempt `fgos session list --json` in the main cwd exited **4**, stdout empty, stderr:

```text
fgos: unknown session sub-verb "list". Usage: fgos session <start|rotate|stop|write|read|type>
```

### Persona matrix: source coverage versus live coverage

| Persona | Send permission in source | Inbox permission if explicitly put through argv window | Genuine live head send/inbox observations |
|---|---|---|---|
| lead | allow; `--to head:secretary-*` or `head:supervisor-*` | ask, unmatched | unavailable in this worker |
| planner | allow; same recipient limits | ask, unmatched | unavailable in this worker |
| shaper | allow | ask, unmatched | unavailable in this worker |
| supervisor | allow | ask, unmatched | unavailable in this worker |
| secretary | allow, inherited from supervisor | ask, unmatched | unavailable in this worker |

Contract source: `packages/session-host/contracts/head-permissions.v1.json:17` (base rules), `:41` (lead), `:54` (planner), `:65` (shaper), `:76` (supervisor), and secretary's `inherits: supervisor`. No persona supplies an inbox row; `packages/session-host/rust/src/permissions.rs:295` returns `Ask` for an unmatched argv. These are **source conclusions**, not five executed probes. Merely setting a persona environment variable would not produce real persona evidence: the supervisor resolves persona from its protected envelope.

## Step 2: syscall proof and call paths

Traced inbox argv:

```json
["strace", "-f", "-e", "trace=openat,flock", "fgos", "mailbox", "inbox", "--json"]
```

Same main cwd; exit **1**. Stdout had exactly the inbox envelope above except `generated_at` was `2026-11-25T16:23:33.477Z`; hash and data unchanged. Relevant stderr excerpt:

```text
openat(AT_FDCWD, "/home/vantt/projects/forgent/.fgos/locks/mailbox.lock", O_RDWR|O_CREAT|O_CLOEXEC, 0666) = -1 EROFS (Read-only file system)
+++ exited with 1 +++
```

Traced send argv:

```json
["strace", "-f", "-e", "trace=openat,flock", "fgos", "mailbox", "send", "--to", "head:supervisor-forgent", "probe", "--json"]
```

Same cwd; exit **1**. Stdout had exactly the send envelope above except `generated_at` was `2026-11-25T16:24:14.025Z`; hash and data unchanged. Relevant stderr excerpt:

```text
openat(AT_FDCWD, "/home/vantt/projects/forgent/.fgos/runtime/mailbox/record/snapshot.json", O_RDONLY|O_NONBLOCK|O_NOFOLLOW|O_CLOEXEC) = 3
openat(AT_FDCWD, "/home/vantt/projects/forgent/.fgos/locks/mailbox.lock", O_RDWR|O_CREAT|O_CLOEXEC, 0666) = -1 EROFS (Read-only file system)
+++ exited with 1 +++
```

No `flock` call appeared in the selected trace: opening the lock file fails first. A successful snapshot read followed by `EROFS` on the lock distinguishes this from an unreadable record and a busy lock. No Event Store floor failure was observed in these probes.

Source chain for inbox:

1. `apps/fgos/src/main.rs:345` checks confinement and asks `routing::confined_head_call` whether to intercept.
2. `apps/fgos/src/routing.rs:660` intercepts **only `mailbox send`**, and only when a head socket exists. Inbox misses the window match (`:663`) and the remaining verb match returns `None` (`:682`), so it runs locally even in a real head with a socket. The missing permission row is a second gap, not the immediate cause of this local execution.
3. `apps/fgos/src/wiring/mailbox_verbs.rs:796` handles inbox locally; `:797` opens the record and `:804` calls `verbs::inbox` with a lock wait.
4. `apps/fgos/src/wiring/mailbox_root.rs:60` resolves the main checkout, `:69` selects its `.fgos`, including when called from a linked worktree.
5. `packages/mailbox/rust/store/src/verbs.rs:99` takes `Record::hold` even for plain inbox. `packages/mailbox/rust/store/src/record/mod.rs:601` acquires the mailbox lock before reading the snapshot.
6. `packages/holder-lock/contracts/lock-registry.v1.json:271` names `<fgosDir>/locks/mailbox.lock`. `packages/holder-lock/rust/src/port.rs:843` opens it read/write with create (`:845-848`). Kernel evidence above proves `EROFS`.
7. `packages/mailbox/rust/store/src/record/mod.rs:281` maps lock acquisition unavailable to `LockUnavailable`; `:260` renders `lock-unavailable`.

Correction to the backlog's explanation: **plain `inbox` does not mark mail taken or write a snapshot**. `verbs.rs:90-102` uses `Reported::unchanged`; it still takes an exclusive read/write lock. `inbox --claim` is the mutating path. Thus “every read changes the record” is not the reason this particular plain read fails.

Source chain for a real forwarded send (not executed here):

- With a head socket, `routing.rs:660` constructs the argv window; `supervision.rs:1883` obtains the socket and `:1890` calls `head_client::request_head`.
- `packages/run-supervisor/rust/src/head_client.rs:156` creates the REQUEST frame; `:173` connects, `:182` writes the frame, and `:183` reads the reply.
- `head_request.rs:1507` asks the forwarder to plan using the envelope's persona; `:1514` executes an allowed forward row. `forwarder.rs:428` appends `--json` when absent.
- `head_request.rs:2074` is the spawn door: host binary resolved from activation/start host, `:2094` clears the environment, `:2095` uses the protected step environment, `:2096` uses project cwd. The confined caller's environment must not be assumed to be the host's.
- `head_request.rs:1547` parses real child stdout/stderr using `forwarder::read_answer`; `:1561` returns `RouteRefused`. `head_client.rs:70` interprets the refusal and `supervision.rs:1901` prints it to the caller.
- `mailbox_hook.rs:89` independently resolves the same local `.fgos`; `:135-154` passes it to the hook shell locally. Its socket check at `:170` concerns subsequent Identity registration, not forwarding the earlier drain.

## Step 3: why the domain refusal loses its code

The exact **executed host-verb stdout/stderr** is captured above: exit 1, JSON `{contract, generated_at, data_hash, data:{ok:false, recorded:false, text:...}}`, stderr empty. It is a real invocation from the confined worker, **not** a capture of a request supervisor's child. The original failing head's child stdout/stderr was not available here. The mapping below is a deterministic source trace for this captured document, not a claim that the Rust forwarder was executed against it in this run.

`packages/session-host/rust/src/forwarder.rs` does the following on nonzero exit:

- `:482-486`: looks only for a top-level `code` or `error.code`; neither exists.
- `:472-480`: looks on stderr for `fgos: ... [code]`; stderr is empty. The parentheses in `data.text` are not that bracketed stderr form.
- `:487-493`: looks only for top-level `message` or `error.message`, ignoring `data.text`.
- `:99-104`: `provider_refusal` requires `provider failed: <code>: <message>`. This marker is absent, and `data.text` would not reach this parser anyway (`:497-502`).
- `:509`: all code candidates are absent, so chooses **`host-failed`**.
- `:515-518`: all message candidates are absent too, so chooses **`the host verb ended with exit 1`**, losing even the useful lock explanation.

Producer side of the mismatch: `apps/fgos/src/wiring/mailbox_verbs.rs:250-255` produces `{ok:false,text}` for early failures; the send result at `:776-788` similarly uses `{ok,recorded,text}`. `apps/fgos/src/cli_presenter.rs:113-114` wraps this under `data`. The mailbox failure is a completed domain answer with a nonzero exit; it does not have the provider-error wrapper that the forwarder currently recognizes.

Prior art confirms this is a remaining shape mismatch rather than a missing forwarding mechanism: commit `e47368469079547d7f2c58d80e8534136e82345a` added mailbox send interception and earlier refusal-code handling; `8f0079b01` subsequently added `provider_refusal` extraction. Both were found with `git log -S` on the routing expression / parser name. Reuse the existing window and parser rather than adding a parallel host client.

## Step 4: causes and footprint decisions

| Failure or gap | Cause with source line | Phase 4 footprint |
|---|---|---|
| Reproduced `lock-unavailable` on plain inbox | Missing inbox interception, `apps/fgos/src/routing.rs:660-682`, leaves the command inside the cage; lock acquisition at `record/mod.rs:601` opens the main checkout lock with write/create (`holder-lock/port.rs:843-848`) and receives EROFS | **Outside** for the existing routing door (`apps/fgos/src/routing.rs`). Kernel lock primitive is also outside, but its behavior is correct and needs no widening. Coordinate routing scope before phase 4. |
| Inbox would be `ask` if sent through the window today | No inbox row in `head-permissions.v1.json:17-31`; fallback `permissions.rs:295-298` | **Inside**: permission contract and tests. This alone does not fix the missing interception. |
| Code-less failed send becomes `host-failed` (source-proven mapping, not live forwarded reproduction) | `forwarder.rs:482-509` ignores mailbox envelope `data.text`; mailbox producers `mailbox_verbs.rs:250-255,776-788` supply no machine code | **Inside**: forwarder, mailbox verbs and their tests. Prefer a structured domain code understood by the same forwarder; do not guess a refusal from arbitrary message body text. |
| Worker-local send fails lock open | No head socket, so `routing.rs:660` intentionally keeps a worker local; `record/mod.rs:601` then gets EROFS | Worker behavior is intentional, not proof that a real forwarded head send is still confined. Do not change worker grants to obtain a pass. |
| Worktree `fgos` exits 127 | Launcher ancestor-only activation lookup, installed shim `:4-7` | **Outside**, installation/distribution concern. It was avoided for diagnosis by selecting the existing activated project cwd, without changing the fence. |
| Historical `event-store-unavailable: git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)` | Backlog `p-ia2v33b54u` records it on 2026-11-22, not reproduced here. Current source has Event Store stream open in `mailbox_remote.rs:780-787`, fault category in `event_store_clone.rs:18-21`, and floor error wrapping in `packages/git/rust/src/driver.rs:331-336` | The printed error is consistent with a write-dependent Git floor probe inside a cage, but the exact failing syscall/path of that old run is **unproved**. Remote/Event Store/Git files are outside phase 4; do not attribute a new fix there without live evidence. |

The routing file omission is independently actionable even while forwarded send evidence is missing. Putting a second socket client inside mailbox verbs to stay nominally within the listed files would bypass the plan's existing confined window; the appropriate boundary is the router that already decides forwarded verbs.

## Live head evidence (lead persona, real request socket)

Run on 2026-11-25 at 16:33 UTC by head `forgent-261125-2313-head-c-cdfd0` (persona `lead`, `FGOS_CONFINED=1`,
`FGOS_HEAD_REQUEST_SOCKET` set by the session host), cwd `/home/vantt/projects/forgent`.

1. `fgos mailbox send --to head:supervisor-forgent "probe ..." --json`: exit **0**,
   `{"ok":true,"recorded":true,"text":"recorded 2a6ad404eac74706 for forgent-claude-9b\nqueued: it sees it at its next tool call. ..."}`.
   A forwarded send whose host verb succeeds works today; the 2026-11-22 `event-store-unavailable` of
   `p-ia2v33b54u` did not recur on the local path.
2. `fgos mailbox inbox --json`: exit **1**, `{"ok":false,"text":"Not done: the mailbox record failed (lock-unavailable) ..."}`.
   `strace -f -e trace=openat,flock` on the same argv:
   `openat(AT_FDCWD, "/home/vantt/projects/forgent/.fgos/locks/mailbox.lock", O_RDWR|O_CREAT|O_CLOEXEC, 0666) = -1 EROFS (Read-only file system)`.
   Even with a head socket, inbox is not forwarded: cause **`apps/fgos/src/routing.rs:660`** (window holds
   `("mailbox", Some("send"))` only).
3. `fgos mailbox send --to head:secretary-nosuchhead "probe" --json` (a recipient the lead's table row allows, the
   host verb then rejects): exit **1**, stderr `fgos: host-failed: the host verb ended with exit 1 [host-failed]`,
   stdout `{"ok":false,"code":"host-failed","detail":"host-failed: the host verb ended with exit 1"}`. This is
   tonight's bare `host-failed`, reproduced; cause **`packages/session-host/rust/src/forwarder.rs:509`** (the
   mailbox verb's `{ok:false,text}` answer carries no `code`, so the fallback wins), with the producer side at
   `apps/fgos/src/wiring/mailbox_verbs.rs:250-255` and `:776-788`.

Rerun: steps 1 to 3 from any confined lead head reproduce the same answers.

## Footprint consequence for phase 4

- Inside the footprint: the `mailbox inbox` permission rows, the code pass-through in `forwarder.rs`, and a machine
  `code` in the mailbox verb answers.
- Outside: the one-line widening of the window in `apps/fgos/src/routing.rs:660` to `("mailbox", Some("send" |
  "inbox"))`. That file is not in this plan's footprint and is listed by the running plan
  `261125-1631-agent-context-engine` (phase 3). Per the plan's Owner questions section, phase 4 does not widen its
  footprint on its own; the lead raised it for a decision.

## Verification and exact remaining work

The worker's verdicts below were written before the live head evidence above. With that evidence, steps 1 and 3 are
met for the lead persona live; the other personas share the same route and are covered by source.

| Required phase step | Evidence obtained | Verdict |
|---|---|---|
| 1. Confined send and inbox for each persona | Actual confined worker send/inbox, launcher obstruction, source matrix for all five personas | **Incomplete:** worker has no protected head context/socket |
| 2. Request socket versus local path and filesystem failure | Real openat/EROFS for inbox and local send; source trace of socket path | Partial; local root cause proven |
| 3. Real forwarded child stdout/stderr and host-failed | Real worker host-verb output plus source explanation of exact parser fallback | **Incomplete:** no live forwarded child capture / outer host-failed reply |
| 4. File/line causes and phase-4 boundary | Table above, including out-of-scope router | Complete for observed failures; historical Event Store cause remains unproved |

To finish the live check, run the following **from each already managed confined head's own CLI tool** (lead, planner, shaper, supervisor, secretary), retaining its real protected persona and socket; do not export borrowed socket paths or fabricate persona variables:

```sh
fgos mailbox send --to head:supervisor-forgent "probe" --json
fgos mailbox inbox --json
strace -f -e trace=openat,flock fgos mailbox inbox --json
```

For the supervisor itself choose a distinct live secretary/peer role to avoid self delivery; for lead/planner preserve the allowed secretary/supervisor target. Use the head's actual activated launch path/cwd, record complete argv/exit/stdout/stderr, and capture the request host child's actual stdout/stderr at `head_request.rs:1547` together with its refusal reply. That requires host-side diagnostic access or an existing owning test/harness; it was not supplied to this assignment worker. Do not change source just to instrument this report-only phase. If the relevant host child succeeds instead, record that observation rather than manufacturing `host-failed`.

No tests were added or run: this is a report-only diagnosis, and running Cargo/npm would write outside the permitted report path. No git staging, commit, lifecycle verb, configuration change, or persona/socket impersonation was performed. The report must not be used as a green signal for phase 1's “both failures live, every persona” acceptance check.

Artifact checks: `git diff --check` exited 0; `git status --short` showed only the new assigned `reports/` directory. The required Markdown preview was attempted with `mdview open <absolute-report-path>` and exited 1, stderr: `error: database error: attempt to write a readonly database: attempt to write a readonly database: Error code 8: Attempt to write a readonly database`. No preview URL was returned.
