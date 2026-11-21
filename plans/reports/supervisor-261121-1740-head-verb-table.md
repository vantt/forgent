# Head verb table: secretary and supervisor (draft for owner reading)

Backlog row: p-vquz26ibnn. Owner decision 2026-11-21 17:39: the supervisor writes the verb-by-verb list, the owner reads the final table.
Source of the grants: `GRANTS` in `src/session-host/head-grants.mjs` (lines 59-77). Probes were run from the confined supervisor head `head:supervisor-forgent` on 2026-11-21 17:40 (+07). The secretary column is read from the grant only; its live probe needs a run from Miu's head and is still open.

Probe values: **ok** = ran from the confined head today and returned a result; **ok (use)** = used successfully by this head in normal wakes today; **refused** = probe returned a refusal; **grant** = in the grant, not probed live yet; **—** = not granted.

## Verbs a head may ask for through its request socket

| Verb | Secretary | Supervisor | Supervisor probe |
|------|-----------|------------|------------------|
| session bind session | yes | yes | ok (use, every start) |
| session rotate | yes | yes | grant |
| session answered | yes | yes | grant |
| session restore role | yes | yes | grant |
| session start | yes | yes | ok (use) |
| session stop | yes (heads) | yes (heads only) | ok (use) |
| session write (docs/backlog.md) | yes | yes | ok (use) |
| session read | — | yes | ok (by session id; a role name such as `head:lead-<name>` returned session-not-found, see gap A) |
| session type | — | yes (stuck target only) | grant |
| questions list | yes | yes | ok |
| questions ask | yes | yes | ok (use, q-o3omqvtsuc) |
| questions ack / cancel | yes | yes | grant |
| questions answer | yes (owner's reply) | — | — |
| land (paths) | yes (portfolio paths) | yes (plans, backlog) | ok (use) |
| request result | yes | yes | grant |
| supervisor plans | yes | yes | ok |
| supervisor queue | yes | yes | ok |
| slots | yes | yes | ok |
| supervisor handled | — | yes | ok (use) |
| supervisor done | — | yes | ok (use) |
| supervisor raise | yes | yes | grant |
| supervisor wake | yes | yes | grant |
| run (one urgent chore) | yes (read-only or linked worktree) | yes | grant |
| metrics record | yes (coordination kinds) | yes | grant |
| metrics prune | — | yes | grant |
| watcher tune | — | yes | grant |
| config patch | — | **— (owner said yes; not yet in the grant)** | refused `config-write-confined` (earlier today) |

## Writes (sandbox binds)

| Path | Secretary | Supervisor |
|------|-----------|------------|
| plans/ | yes | yes |
| docs/backlog.md (read-only, replaced via `session write`) | yes | yes |
| plans/backlog/* | yes | yes |
| docs/discussions | yes | — |
| mailbox / peers | yes / yes | yes / yes |

## Never (both heads)

Implement, review a diff, land a code branch, edit files outside the grant, answer an owner question (supervisor), chat with the owner (supervisor), type into or read a session (secretary).

## Gaps found by the probe

- A. `session read` resolves a session id or handle but not the lead's role name the plan listing gives (`headName`); the supervisor cannot go on site to a lead by the name it holds. Needs a row or a fix in the read target resolution.
- B. `config patch` is not in the supervisor grant yet (owner approved 17:39); it is a code change to `GRANTS`, so it needs a plan and a lead, not a supervisor edit.
- C. Secretary column needs a live probe from Miu's head before the table is final.
- D. `friction record` fails on the read-only observe lock for any head (p-ndortdckid), not in either grant table.
