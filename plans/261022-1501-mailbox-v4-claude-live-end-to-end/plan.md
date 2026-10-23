---
title: "Mailbox V4: Claude Code live end to end through a test-only hook entry, plus a two-session feasibility demo"
description: "Build rung V4 of the Agent Mailbox ladder on branch mailbox/v1-v3: the hook shell (write, then finish), the Claude Code head finder and caller check, the send delivery report and the inbox verb as crate functions, a never-installed cargo example `mailbox-test-hook` that `claude -p --settings` calls, the mailbox root in BLIND_HIDDEN_ROOTS, a fixed-count live suite (stop gate, mid-step, hook really ran, send, inbox, output size), and a feasibility demo in which two real CLI sessions talk on one machine (Claude to Claude, then Claude to Codex, labelled not a support claim)."
status: pending
priority: P2
effort: ~3d (10 phases, strictly sequential)
branch: main (plan only); all code on branch mailbox/v1-v3 in linked worktree /home/vantt/projects/forgent-mailbox, never merged to main until the owner says feasibility is proven
tags: [mailbox, rust, hooks, live-test, claude, codex, confinement, feature, tdd]
blockedBy: [261022-1005-mailbox-v2-record-store, 261022-0007-mailbox-v3-hook-payload-contract]
blocks: []
created: 2026-10-22
---

# Mailbox V4: Claude Code live end to end through a test-only hook entry

Planned on main `bb1050d39` (origin/main `94b61ca31`), 2026-10-22 15:01 Asia/Saigon. Branch `mailbox/v1-v3` was at `9a53299e1` when planning started and at `b299e63f7` (the V2 H1 fix) with uncommitted V2-review edits by another session when the red team ran; phase 1 records the real V4 base and refuses a dirty tree. Spec on the branch: `docs/platform/agent-mailbox/spec.md` (read it with `git -C /home/vantt/projects/forgent-mailbox show HEAD:docs/platform/agent-mailbox/spec.md`), §5–§8, §11, §14 (V4 row), §15.6, §17. Previous rungs: [V1](../261021-2255-mailbox-v1-core-crate/plan.md), [V2](../261022-1005-mailbox-v2-record-store/plan.md) (its independent review is committed on the branch only, `plans/261022-1005-mailbox-v2-record-store/reports/code-review-v2.md` at `599570dbd`, and was still being acted on when this plan was written), [V3](../261022-0007-mailbox-v3-hook-payload-contract/plan.md) and its review [`reports/code-review-v3.md`](../261022-0007-mailbox-v3-hook-payload-contract/reports/code-review-v3.md). Board row `MAIL`; the controller edits the board, never a phase.

## Outcome

1. **Live end to end on a real Claude Code** (`claude -p`, haiku), through the hook entry a test-only cargo example provides, with one fixed run per case:
   - **stop gate:** a `wake:true` message written after the last tool call is claimed at the `Stop` hook, the Stop is blocked with the frame as its reason, the model continues and acts on it, and the next Stop passes;
   - **mid-step:** a message written while a tool runs is claimed at the first `PostToolUse` after that tool, and the model acts on it in the same turn;
   - **the hook really ran:** the transcript shows each injection; every hook call also leaves an `enter` log line from the entry; a run whose `Stop` entry is in a wrong shape is flagged "Stop hook did not run" by the same detector, and the mail sent to that registered head stays `recorded`, not lost;
   - **`send` and `inbox`:** the sender gets `recorded` plus the delivery-report sentence of tier `turn`; a read-only `inbox` lists pending mail and changes nothing (`inbox --claim` waits for V5);
   - **output size:** whether Claude Code shortens a `PostToolUse` `additionalContext` or a `Stop` `reason`, on a ladder that ends at `queue.cap × maxBodyBytes` plus frame text.
2. **Shell proofs without a model:** the entry exits 0 and prints nothing under malformed stdin, a failed stdout write (and then never finishes the claim), a timeout and a panic; it writes stdout before it finishes; it drains only when it runs directly under the head process the session file names (or under the one shell hop the probe found), compared through process facts. That is a topology and pid-reuse guard, not a guard against same-user processes (phase 5).
3. **Feasibility demo, two real CLI sessions on one machine, talking through the mailbox:**
   - **D1, Claude to Claude** (required): session A asks session B a question with a nonce; B receives it at a hook, answers with the reply command its frame shows; A receives the answer at a hook and reports it. The snapshot shows the reply derived from the question (`reply_to`, depth 1).
   - **D2, Claude to Codex** (same rung, same test entry): the same exchange with B a real `codex exec` session. Labelled **"feasibility demo, not a support claim"**: the Codex adapter is built at V7 only if the V6 stop rule passes and authorization exists (spec §14).
4. **The mailbox root is hidden from blind workers:** `'{fgosDir}/runtime/mailbox'` is in `BLIND_HIDDEN_ROOTS`, with its owning test and the confinement spec §9.2 sentence.

V4 does **not** prove: the real `fgos hook mailbox` entry and its install (V5); the hook cost through the host and its p95 (V5); idle wake through the Claude socket or `codex queue` (no wake channel is built; tiers are `turn`); the interactive REPL (print mode only, see owner question 1); behaviour of models under adversarial or many-cell conditions (V6); the Codex adapter as a supported path (V7); the circuit breaker (V5, decision 9); runner heads (`att-`, V5); `inbox --claim` (V5); the record-TTL notice when no checkpoint ever comes (spec §11 item 4; V6/V7); any guard against same-user processes (phase 5).

## Where the code lives (owner, 2026-10-21; unchanged)

- All code, contracts and doc updates live on branch **`mailbox/v1-v3`** in the linked worktree **`/home/vantt/projects/forgent-mailbox`**. Every phase commits to that branch only and pushes it.
- **Nothing merges to main.** Only this plan directory goes to main; the controller commits it. Never commit or stash in the main checkout `/home/vantt/projects/forgent`: other sessions share it.

## Branch sync rule (owner; unchanged from V1–V3)

Update by **merge, never rebase**:

```bash
cd /home/vantt/projects/forgent-mailbox
git fetch origin
git merge --no-edit origin/main   # resolve on the branch; regenerate Cargo.lock and the census rather than hand-merge
```

Sync at the start and at the end of every phase. End of a phase, in order: commit, fetch and merge main, run the phase's proof, commit any regenerated census or lock, `git push origin mailbox/v1-v3`. If the merge brought changes, rerun the proof. **A phase is done only when its proof is green on top of a fresh `origin/main` merge.**

- `Cargo.lock` conflict: take main's lock, run `cargo build -p fgos-mailbox` once without `--locked`, commit in the merge commit.
- Mutation census: for every commit that adds or changes a hashed file (`.rs` under `packages/`, `.mjs` the scanner reads), run `node scripts/git-one-door-scan.mjs --write-census` and commit the result with it.

## Memory rule (owner, 2026-10-22: the machine crashed from OOM today)

- Before every heavy gate: `free -g | awk '/Mem:/{print $7}'` must print **8 or more**. Below 8, stop and report; never start the gate.
- Heavy gates run **one at a time**, never in parallel, never while a live CLI run is going: `cargo test --workspace` is never run together with `npm test`.
- Always: `CARGO_BUILD_JOBS=4`; `cargo test … -- --test-threads=4`; `npm test -- --test-concurrency=4`.
- Long commands need an observable exit: the harness's background facility with exit notification, or the foreground under `timeout` with output teed to `.fgos/runtime/tmp/mailbox-v4/<step>.log` and `; echo "exit=$?"` right after the command. Never a bare `&`.

## Live-call rule

Live runs spend the owner's model quota. The count is fixed (table below); **there is no retry loop anywhere**. A case that fails, for any reason, is reported as failed with its evidence; it is run again only when the controller decides so, and the report says it was a re-run. The harness enforces the fixed count: it writes `spawned.json` just before it starts a real CLI and refuses a case that has one; every case is dry-run against a stub CLI first (phase 8).

| Phase | Run | CLI | Invocations |
|---|---|---|---|
| 2 | re-record Claude Code at the installed version (dump, accept, subagent, agent-head), probe data from the same runs | `claude -p` haiku | 4 (only `dump` if the installed version is already in `testedAgainst`) |
| 2 | Codex probe (recorder `dump`, also re-checks 0.161.0) | `codex exec` | 1 (+2 for `accept`, `subagent` only if the installed Codex is not in `testedAgainst`) |
| 8 | L1 stop gate + mid-step + inbox + send | `claude -p` haiku | 1 |
| 8 | L2 hook-did-not-run detector (wrong settings shape) | `claude -p` haiku | 1 |
| 8 | L3a and L3b output-size probes (context, then Stop reason) | `claude -p` haiku | 2 |
| 9 | D1 Claude to Claude | `claude -p` haiku ×2 | 2 |
| 9 | D2 Claude to Codex | `claude -p` haiku + `codex exec` | 2 |
| | **Expected total** | | **13** (11 Claude, 2 Codex); at most 15; at least 10 |

An invocation is one CLI process; each makes several API requests (one per model turn). L3a and L3b each inject about 820 KB on purpose (spec §14 V4 row): the most expensive runs of the rung, one per channel because one such context likely fills the model's window.

## Phases

| # | Phase | Proof | Live calls |
|---|---|---|---|
| 1 | [Sync, preconditions, API re-check](phase-01-sync-preconditions-and-api-recheck.md) | baseline `cargo test -p fgos-mailbox -p fgos-mailbox-core` green on fresh main; API checklist matches; V2 H1 fixed | 0 |
| 2 | [Version pin and process probe](phase-02-version-pin-and-process-probe.md) | `fixtures_contract` and payload suite green with the installed Claude version listed; probe facts written to a research report | 5 (expected) |
| 3 | [Mailbox root in the hidden roots](phase-03-hidden-root-for-the-mailbox-record.md) | `node --test test/runner/dispatch-confinement-blind.test.mjs` | 0 |
| 4 | [Contract keys, delivery report, refusal and inbox text](phase-04-contract-keys-delivery-report-and-refusal-text.md) | `cargo test -p fgos-mailbox-core` (new `tests/report.rs`), limits contract tests | 0 |
| 5 | [Claude head finder and caller check](phase-05-claude-head-finder-and-caller-check.md) | `cargo test -p fgos-mailbox --test head_finder` | 0 |
| 6 | [Hook shell and the `send`/`inbox` verbs](phase-06-hook-shell-and-verbs.md) | `cargo test -p fgos-mailbox --test hook_shell --test verbs` | 0 |
| 7 | [Test-only entry `mailbox-test-hook` and the exit-status proof](phase-07-test-hook-entry-and-exit-status-proof.md) | `cargo test -p fgos-mailbox` (the whole crate: it builds the example; `tests/test_hook_entry.rs`) | 0 |
| 8 | [Live Claude Code suite](phase-08-live-claude-suite.md) | `node test/live/mailbox-claude.live.mjs run L1|L2|L3a|L3b`, results in a research report | 4 |
| 9 | [Feasibility demo: Claude to Claude, Claude to Codex](phase-09-feasibility-demo-two-sessions.md) | `node test/live/mailbox-claude.live.mjs demo D1|D2`, results in the same report | 4 |
| 10 | [Branch docs, full gates, review, hand-off](phase-10-branch-docs-gates-review-handoff.md) | workspace gates (sequential), independent review, closing report | 0 |

Dependencies: strictly sequential. 3 and 4 do not depend on 2's probe, but 5 does, and the live phases 8–9 depend on every earlier phase. No phase runs in parallel with another (memory rule, shared files).

## Prior art (what existed, what was reused, what is missing)

Searched with `git log -S` on `mailbox-test-hook`, `test/live`, `.live.mjs`, `claude -p`, `--settings`, `MAX_STDIN`, `claude/sessions`:

- **Reused:** the V3 recorder `scripts/record-mailbox-hook-fixtures.mjs` (outside every checkout, id variables removed from the env, `--setting-sources project` with an empty workspace, managed-settings check before a Claude run, the Codex `auth.json` symlink and login guard in `scripts/lib/codex-auth-guard.mjs`, `--dangerously-bypass-hook-trust`, `timeout 300`); its guards move into one shared module (phase 2) and the recorder and the live harness import them. The V2 cost example `packages/mailbox/rust/store/examples/mailbox-record-cost.rs` is the precedent for a hand-run cargo example in this crate (fresh `.fgos` under a parent it refuses when it already holds one). The V2 hold API, the V3 drain (`begin` / `render_reply` / `finish`), `fgos_process::facts::{identity_of, judge_here}`, `fgos_session_identity::resolve_current`, the frame contract `packages/mailbox/contracts/frame.v1.txt` and the limits contract. Precedent for a stdin byte cap: `packages/terminal-control/rust/src/route.rs:23` (`MAX_STDIN = 1 MiB`).
- **Measured before, reused as facts:** `claude -p` keeps `~/.claude/sessions/<pid>.json` (pid, `sessionId`, `messagingSocketPath`) readable while its hooks run, and the session id is stable across `--resume` while pid and socket change (`plans/reports/research-261020-1457-mailbox-claude-busy-socket-and-subagent-probe.md`). Interactive session files on this machine today carry `pid`, `sessionId`, `procStart`, `version` (2.1.308), `kind`, `name`, `nameSource`, `status` (read 2026-10-22).
- **Missing, built here:** no `test/live/` directory and no live-suite harness exist (the `.live.mjs` name occurs only in the spec); `npm test` discovers only `*.test.mjs` (`scripts/run-tests.mjs`), so a `*.live.mjs` file never runs in it. No Rust reader of Claude's session file exists. No delivery-report text, refusal text or inbox text exists in any contract. No hook shell exists (V3 left it to V4).

## Decisions (planning lead, inside the signed frame)

1. **Logic in the crate, the example is a thin shell.** Everything V5's host entry will also need (bounded stdin read, head finder, caller check, two holds with write-then-finish, panic catch, budget watchdog, `send`, read-only `inbox`) is library code in `fgos-mailbox` (`hook::shell`, `adapters::claude_head`, `verbs`). The example only parses arguments, wires the real stdin, stdout and clock, appends one log line and exits 0. V5 then wires the same functions into `apps/fgos`, so nothing is built twice.
2. **The entry is an example, never a bin.** `packages/mailbox/rust/store/examples/mailbox-test-hook.rs`; no `[[bin]]`, no install path, no doctor or setup registration. AGENTS.md's install gate is untouched because nothing is installed (spec §14 V4 row).
3. **`send` and `inbox` reach the model through a fixture wrapper.** The frame's reply line says `fgos mailbox send --to … --reply-to … "…"` (frame contract). In a live run the harness puts an executable named `fgos` first on the CLI's `PATH` inside the run directory; it accepts only `mailbox send|inbox`, refuses any argument that would redirect the example (`--fgos-dir`, `--log`, `--fault`, `--topology`), runs the example with the run's record directory, and refuses every other verb with exit 2. The CLI runs with an allowlisted environment and `ZDOTDIR` pointing at an empty directory, because in the owner's shell `fgos` is a zsh function that would shadow any `PATH` entry (phase 8). The wrapper is test fixture in the run directory, never in the repository's `bin/`, and never a product door.
4. **Delivery report and every other model-facing text live in the frame contract.** New sections `[report.*]`, five `[refusal.*]` sections (not one per code), `[inbox.*]` in `packages/mailbox/contracts/frame.v1.txt`, which already calls itself "the one source of every text the mailbox puts in front of a model"; the core renders them (`delivery_report`, `refusal_text`, `inbox_text`). Additive sections; no existing section changes, so no frame version bump.
5. **Every drained CLI is tier `turn` in V4, so the report needs no tier type yet.** No wake channel is built (the Claude scoped socket and `codex queue` are the first slice's push paths, not V4's), and spec §6.2 allows lowering a tier, never raising it without proof. The report renders the spec's `turn` sentences (§6.2: "queued: it sees it at its next tool call", and "… or when its turn ends" for an effective wake) plus the wake-dropped sentence (§5.3). A tier value, the `push` and `pull` sentences and the `Nudge` port arrive with the first real wake channel (spec §4 rule 5); adding them now would be code nothing calls.
6. **The untested-version clause of the delivery report waits for V5.** It needs the recipient's CLI version at `send`; the binding does not store it and snapshot schema 1 is frozen by its fixture. Adding it is a schema change for the rung that first reads a version at `send`. The live suite still enforces the version pin itself (spec §11 item 7).
7. **Two new hook keys, both with a named source.** `mailbox.hook.budgetMs` = 8000 (spec §12, already specified, not yet in the contract) and `mailbox.hook.maxReadBytes` = 1048576 (borrowed from `terminal-control`'s `MAX_STDIN`, the repository's only bound on a foreign input read; status "placeholder, borrowed, unmeasured"), bounding both foreign JSON documents the hook reads: its stdin payload (over the cap: quiet `Malformed`) and the CLI's session file (over the cap: no head). No other number is introduced: the stdin read and the finish are bounded by the whole-hook budget and by `hook.lockWaitMs`, not by the reference's 3 s values (spec §8 item 7 quotes them as the reference's, not as keys).
8. **The Codex half of D2 lives only in the example.** The Codex head finder (the hook's parent process, measured in phase 2) and the Codex writer key from the payload's `session_id` (spec §7.3, a V5 entry duty) are example code, labelled; product code gains no Codex claim before V7. The drain's own `WriterMismatch` check still runs.
9. **No circuit breaker in V4.** Its keys (`mailbox.hook.breaker.*`) are not in the contract and the V4 row does not list it; it lands with the product entry (V5). The entry still exits 0 on every path.
10. **Panic proof at process level through a fault option of the test-only example** (`--fault panic-in-render`). The panic catch is library code; only the trigger is in the example, which is test code by spec; no product code has a switch.
11. **Live cases are scripted with nonces and harness triggers, not timing guesses.** The harness waits for the entry's own log line (registration, the claim of M1) or a file (`peer.txt`) before the next step; the one ordering that cannot be built (a Stop claim needs mail recorded after the last tool's hook) is measured and reported with its margin; a race that still loses is "not observed", never retried. Every case is dry-run first with a stub CLI that fires the recorded payloads, and the fixed-count guard counts real CLI spawns, not attempts.
12. **The trusted-sender line in the demo prompts is a stand-in.** Spec §16 question 16 leaves the form of the authorization key undecided. Each demo recipient's prompt names the peer it may answer, in plain words, written by the harness that starts it (the spec's "whoever starts the head writes the line"). The report labels it a stand-in, not the `inbound.<class>` key.
13. **Claude fixtures keep one set, both versions listed.** If the 2.1.308 recordings match 2.1.307 in structure (same key sets, same injected shapes, same subagent and agent-head markers), the fixtures are rewritten from the new runs and `testedAgainst` lists both versions (both were recorded). If they differ, phase 2 stops and reports: that is a V3 contract change, not V4 work.
14. **The output-size probe runs at the spec's size, once per channel** (L3a context, L3b Stop reason). Spec §14 V4 row asks for exactly `queue.cap × maxBodyBytes` plus frame text; a smaller size would not answer it and skipping it leaves V5 without the fact that decides whether a drain needs an output cap. It is the rung's most expensive pair of runs and is reported as such. L2 (a wrong settings shape) and the `--fault panic-in-render` run break something on purpose; both are the spec's own detector proofs (§11 item 6, §14 V4 row), not staged evidence for the delivery cases, which come from natural runs.

## Acceptance criteria

- [ ] Phase 1: the worktree is clean, the V4 base is recorded, the V2 H1 test passes by name, and the API checklist matches or deviations are recorded.
- [ ] `cargo test -p fgos-mailbox -p fgos-mailbox-core` green with the new tests, each named for its behaviour, each in the file that owns the module.
- [ ] The installed Claude Code version is in `testedAgainst`, recorded by the recorder, before the live suite runs.
- [ ] `BLIND_HIDDEN_ROOTS` includes `'{fgosDir}/runtime/mailbox'`; its owning test asserts it; `docs/specs/confinement-authority.md` §9.2 names it.
- [ ] Every live case passed its dry run first; the wrapper-wins check passed; L1, L2, L3a, L3b, D1, D2 each ran exactly once (or their re-runs are named as such), with evidence in one research report: entry log lines, snapshot states, transcript record types, the models' final answers with nonces, delivery-report sentences.
- [ ] D2 is labelled "feasibility demo, not a support claim" everywhere it is reported.
- [ ] Full gates green on fresh main (sequential, memory rule); failures that also fail on clean `origin/main` are listed by title, not hidden.
- [ ] Spec V4 row marked built on the branch, with what it proves and does not; §17 records decisions 1–14 and the owner's answer.
- [ ] Independent review has no open Critical or High.

## Câu hỏi cho owner

One question, in the template of `core/skills/_shared/decision-question.md`. Its provisional default applies if the owner has not answered when phase 9 starts, and is recorded in spec §17 as "provisional default, owner may reverse". Everything else this plan decides inside the signed frame (decisions 1–14) and reports.

**Câu 1 — Bản demo hai phiên chạy ở chế độ nào? (phase 9)**

- **Chuyện gì đang xảy ra:** Demo của V4 cho hai phiên CLI thật nói chuyện với nhau qua mailbox. Kế hoạch chạy cả hai phiên ở chế độ in (`claude -p`, `codex exec`, không có cửa sổ tương tác): mỗi phiên làm theo kịch bản, chờ thư bằng lệnh `sleep`, nhận thư ở hook, trả lời bằng lệnh reply in dưới thư.
- **Nguyên nhân:** Hàng V4 của spec (§14) quy định `claude -p --settings`. Một phiên tương tác đang nghỉ chỉ nhận thư ngay nếu có kênh đánh thức (socket của Claude với `accept` có phạm vi, hoặc `codex queue`); V4 không xây kênh nào, nên phiên nghỉ chỉ thấy thư ở lần gọi tool kế tiếp hoặc khi người gõ. Đã kiểm: spec §6.2, §7.2, §14 hàng V4 và V5.
- **Các lựa chọn:**
  - (a) Chỉ chế độ in, như kế hoạch: 4 lần gọi CLI; chứng minh đường hook thật hai chiều, kể cả Claude với Codex. Hại: trông như kịch bản, không giống hai phiên người đang ngồi dùng. Không thêm mã.
  - (b) Thêm một lượt D1 ở chế độ tương tác trong tmux, người nhận đang làm việc (không nghỉ): thêm 2 lần gọi CLI, thêm phần điều khiển tmux trong harness (khoảng 150 dòng Node, nửa ngày). Lợi: thấy thư hiện ra trong phiên tương tác thật. Hại: thêm một đường điều khiển terminal chỉ cho demo.
  - (c) Như (b) nhưng đánh thức được phiên đang nghỉ: phải đưa kênh socket Claude (`Nudge`) vào V4, vượt hàng V4 của spec; khoảng 1–2 ngày và phải sửa spec §14.
- **Khuyến nghị:** (a) cho V4. Phần tương tác nên chạy ở V5, khi entry thật `fgos hook mailbox` đã được cài, để demo dùng đúng cửa sản phẩm thay vì entry thử.
- **Phạm vi của câu trả lời:** chỉ phase 9 của V4. "Có" với (b) cho phép thêm phần tmux vào harness `test/live/` và 2 lần gọi; không cho phép sửa spec hay xây kênh đánh thức. (c) cần một quyết định đổi spec riêng.
- **Mặc định tạm:** (a).

## Validation and red-team

- Validation log: [`reports/validation-log.md`](reports/validation-log.md).
- Red-team log: [`reports/red-team-log.md`](reports/red-team-log.md); summary in "Red Team Review" below.

## Red Team Review

Four hostile reviewers (security, failure modes, assumptions, scope) on 2026-10-22, 38 raw findings, deduplicated to 30 dispositions: 27 accepted (4 of them partly, and 2 with a sub-point rejected), 3 rejected with evidence (the hook writer env was recorded at V3, the struct rename stays, the recorder guard move stays in phase 2). Full table: [`reports/red-team-log.md`](reports/red-team-log.md). The changes that matter most: the live CLIs run with an allowlisted environment and an empty `ZDOTDIR`, because `fgos` is a zsh function in the owner's shell and would shadow the test wrapper; phase 1 refuses a dirty tree (another session was editing the record layer); the hidden root is created when missing so the mask never depends on start order; both head-finder topologies are specified before the probe; every live case is dry-run against a stub CLI and the fixed-count guard counts real spawns; L2 now proves retention of mail to a registered head; L3 climbs a size ladder; `inbox --claim` was cut and the refusal text shrank from thirteen sections to five.

## Not done here

- Task hydration: this planning session has no task-management tool; the implementation lead hydrates from the phase files.
- Journal: the brief limits this session's writes to this plan directory; the closing phase writes the journal (path from `fgos convention path --kind journal`).
