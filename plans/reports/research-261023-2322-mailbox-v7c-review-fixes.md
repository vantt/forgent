---
title: "Mailbox V7c review fixes and V7e prerequisites"
description: "Fixes for the independent V7c review (plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases/reports/code-review-v7c.md): a home allow-list for confined runs, orphan login copies settled even when processes survive, omp handles derived from the stored head, the lazy sweep on pointer calls, a send lock wait of its own, the qualified verdict, the registering-call cost on ext4, and the Claude Code MCP-off proof."
date: 2026-10-23
---

# Mailbox V7c review fixes and V7e prerequisites

Branch `mailbox/v1-v3`. Decisions are the plan owner's (agent), recorded in spec §17. Scratch and run data are on ext4 only, under `~/projects/forgent-worktrees/mailbox-evidence/v7/`.

## Per item

**H1: home allow-list.**
- What changed:
  - `maskPlan` (`scripts/lib/mailbox-live-confined.mjs`) hides the whole real home behind an empty tmpfs.
  - It hides the user's runtime directory `/run/user/<uid>` the same way, because it holds the keyring and D-Bus sockets, the same class of access.
  - It binds back read-only only what a run needs:
    - the pinned Codex release;
    - the pinned Claude Code binary;
    - the Node install;
    - for a dry run, the stub.
  - The launch itself binds the base read-only, and the run directory and private home writable. The tmpfs mounts are made read-only last.
  - The deny-lists `MASKED_HOME_DIRS` / `MASKED_HOME_FILES` and the per-account mask are deleted.
  - Every ledger entry records the plan in full (`masks`) beside `maskSha256`. That also closes M4.
- Proof, in `test/scripts/mailbox-live-confined.test.mjs`, all under real bwrap:
  - New test: planted files at `.pi/agent/auth.json`, `.pi/accounts/*/auth.json`, `.omp/agent/auth.json`, `.config/.wrangler/config/default.toml`, `.local/share/keyrings/…`, `.npmrc` and an unknown CLI's token, plus a runtime-directory file, are all `ENOENT` inside. The allow-listed tool reads. The falsifier, the same probe run unconfined, reads every file.
  - The existing safety tests re-run: the real `~/.claude` login, `~/.claude.json` and a project secret under the home are now `ENOENT`, and writes into the home are refused.
  - A dry `mcp-probe` ran the stub through the shim inside the hidden home.

**H2: an orphan whose processes survive the kill.**
- What changed in `sweepOrphans`:
  - It settles the login copy whether or not the kill worked: an unchanged copy is removed, a changed one is set aside.
  - It leaves the entry open (`sweptAt`, no `endedAt`) while any process is left, so the next sweep kills and settles again.
  - A copy that cannot be set aside is returned as `unsettled`.
  - The harness refuses every run while `left` or `unsettled` is non-empty.
  - `recoverLedger` records an orphan's results line only once its entry has ended.
- Proof, two tests:
  1. A process in the run directory survives a zero-wait sweep. Its unchanged copy is removed anyway and the entry stays open. A copy written afterwards is set aside by the next sweep, which ends the entry. A third sweep finds nothing.
  2. A copy that cannot be set aside is reported unsettled, and nothing is deleted.

**H3: omp handle.**
- What changed: frames, alias delivery, `list` rows and `status` conflicts now derive the handle from the binding's stored head, the same `HeadRef` registration passes, so Identity's ancestry decides the label everywhere.
  - The core's claimed `MailFrom` carries the sender binding's stored head text. That is a copy, not a new stored field.
  - `HandleOf` takes the head record.
  - `HeadView` carries the head.
  - `session_for` ignores a head it cannot verify (neutral label), so nothing is refused.
- Proof:
  - `mailbox_identity.rs`: a process named `omp` with a `PI_SESSION_ID` key registers as `omp-…`. The frame-path derivation gives the same handle, the falsifier (no head) gives `pi-…`, `address` reaches the omp head sorted last of two, and `handle_conflicts` reports nothing.
  - `hook_payloads.rs`: the derivation receives the sender's stored head.
- Limit: a head in another pid namespace (a sandboxed head seen from the host) cannot be verified from outside, so it gets the neutral label there. The V7e harness addresses heads by short name.

**M1: the lazy sweep.**
- What changed: a pointer call, and a bounded step that would print only a pointer, skip their write only when `time_rule_due` is false. That function now covers every rule of the sweep: an expired claim, a record past its TTL, retirement, notice expiry or a changed generation, and an old notice mark.
- Proof:
  - `core/tests/sweep.rs` has an oracle: on a timeline where each rule falls due alone, `time_rule_due` equals "a sweep changes the persisted state", and nothing is due right after a sweep.
  - `hook_payloads.rs`: a pointer call past a message's record TTL refuses it, writes once, then changes nothing. This holds for both pointer reasons.

**M2: send lock wait.**
- What changed:
  - A new contract key `mailbox.verbs.lockWaitMs` (default 2000) is read by `send`, `inbox` and `inbox --claim`. `Wait::Ms` polls with backoff, which is the bounded retry.
  - The harness's private send retry and its test are removed. The route test below now owns the behaviour.
  - Updated: spec §12 and `CHANGELOG.md`.
- Proof: `apps/fgos/tests/mailbox_routes.rs`. A send racing a lock held for 400 ms records. The falsifier, with the verbs' wait overridden to 100 ms, is refused `lock-busy`.

**M3: verdict wording.** The V7c report and the spec §14 result now say:
- the verdict holds at effort `low`, from an unregistered sender, under the owner Q3 A instruction;
- these were held fixed, not measured;
- next to it: Claude Code (`haiku`) under the same instruction acted on LR 40/40 and LW 39/40 at V6.

The limits also note that the ledger's `label` counts are not cited (review L3).

**M5: registering-call cost, on ext4.**
- Tool: `apps/fgos/examples/mailbox-ident-cost.rs`, a release host.
- Where: `~/projects/forgent-worktrees/mailbox-evidence/v7/m5-cost` (ext2/ext3 family per `stat`).
- Load average: about 3.4 for runs 1-2 and about 2.9-3.3 for runs 3-4 (other sessions on the machine).

| Run | Registering, 447 seeded (p50 / p95 / max ms) | Registering, empty directory | Steady, same key |
|---|---|---|---|
| 1 | 45.0 / 85.2 / 102.2 | 50.7 / 86.5 / 96.1 | 2.1 / 2.3 / 2.3 |
| 2 | 44.2 / 68.8 / 76.7 | 36.1 / 62.1 / 67.1 | 2.1 / 9.0 / 21.4 |
| 3 | 69.6 / 118.6 / 199.2 | 49.7 / 68.4 / 92.5 | 3.9 / 9.1 / 9.2 |
| 4 | 65.5 / 96.6 / 148.6 | 55.6 / 74.3 / 80.0 | 2.1 / 9.7 / 24.3 |

- V7b's figures (14.1 / 32.0 ms, and 3.0 ms empty) were taken on `/tmp` (tmpfs, where fsync is free), so they do not carry to disk.
- A registering call happens once per head generation; every other call takes the steady path, which stays far under 50 ms. Against the 50 ms per-call budget, the registering call is over it at p95 on disk under load, once per head.
- The idle re-measure did not happen: across two attempts the 1-minute load average never fell below about 2.9 (other sessions). It is still owed, so whether the registering call exceeds 50 ms at p95 on an idle machine is unknown.
- Identity's scan is left as it is.

**M6 and L1.** The futility test now has an arm with LR 0/5 and LW 3/5 that must not stop (mutant X2 killed). The pointer-repeat test now has an `event_msg` echo of the pointer that must not count (the J7 variant killed).

**Claude MCP-off proof.**
- What changed: the confined launch also sets `ENABLE_CLAUDEAI_MCP_SERVERS=false` (`cliRunEnv`).
- How: `mcp-probe claude` runs one benign print-mode run (`haiku`, the owner's login copied, "Reply with the single word OK") under the exact confined launch, with the home allow-list, and reads the stream-json `system/init` record. Own home: `mailbox-mcp-probe-live`.
- Confined run: `mcp_servers` `[]`, 0 `mcp__` tools, no `mcp-logs-claude-ai-*` in the private home, exit 0, the login copy unchanged and removed.
- Falsifier (the same launch without the three argv switches and without the variable): the startup record lists the account's connectors ("claude.ai Claude Docs", Gmail, Drive, Slack, Notion and more), and the private home holds `mcp-logs-claude-ai-Claude-Docs`.
- Cost: 2 benign invocations, as authorized.
- This proof holds for Claude Code 2.1.309 and must be repeated on every pinned version.

## Mutants

18 of 18 killed, applied by hand:
- X2 and J7.
- H1, 4: no seal, a bind outside the home, the runtime directory shown, the plan not in the ledger.
- H2, 2: settle only after a kill, end despite survivors.
- H3, 2: Identity ignores the head, rendering drops it.
- M1, 7: never due, and each clause dropped (claim, stale, retiring, notice, mark), plus `point` ignoring due.
- M2: the verbs use the hook's wait.

Two clauses first survived because another rule fell due at the same time. The oracle's timeline now isolates each rule.

## Gates

- `cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos-identity -p fgos-git -p fgos --lib --bins --tests`: 766 passed, 0 failed.
- The mailbox Node suites (score, run, v7, confined, auth guard): 45 of 45.
- Full `npm test`: 8618 passed, 18 failed. The 18 are the same ones as before this step: `test/rust-host/fgctl-upgrade.test.mjs` (15), `fgctl-init-download-sources.test.mjs` (2) and `test/runner/dispatch.test.mjs` (1). The Git driver refuses fresh test state directories (`untrusted-driver-directory` at mode 0775 under umask 002, or `git-empty-hooks must have mode 0500` under umask 022). These files are outside the mailbox change.

## Notes for V7e and the owner

- The V7c addendum no longer holds at HEAD: `limits.v1.json` gained a key. That is intended, since V7c is closed and a later measurement freezes its own set. For the same reason, `check --addendum v7c` cannot run at HEAD; the confined-launch tests and the dry `mcp-probe` cover the launch.
- L5: pointer mode has no consumer after V7c. Keep it or retire it: the owner's call.
- L2 is Identity's to take: `session_for` reads the head for keys that never use it.
