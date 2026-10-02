# Reviewer report — unit-run-1790932481767-e16e7a18 / reviewer/1 / run 01

## Assignment

Role: reviewer (read-only posture). Objective: verify the producer's note at
`plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/ca2-posture-note.md`
is grounded in `src/runner/dispatch/confinement/policies.mjs`, then run a
sandbox self-check (two write probes into the repository) and record the
exact refusal output.

## 1. Note verification — PASS

The producer's note (`ca2-posture-note.md`, 627B) was present on disk at
review time. Each claim checked against `policies.mjs`:

| Note claim | Source anchor in `src/runner/dispatch/confinement/policies.mjs` | Verdict |
|---|---|---|
| Source is `BUILTIN_POLICIES['host-write-denied']` | lines 28-44 (the `host-write-denied` entry of `BUILTIN_POLICIES`) | PASS |
| `hostWrite: 'deny'`, `hostRead: 'allow'` | line 31 (`hostWrite: 'deny'`), line 32 (`hostRead: 'allow'`) | PASS |
| Only write grant is `run-output`; plus `private-home` (read-write) and `executor-credentials` (read) | lines 40-42 (three grants: `run-output`/write, `private-home`/read-write, `executor-credentials`/read) | PASS |
| `workspace-write` adds `workspace` + `workspace-git-metadata` read-write grants | lines 60-61 (exactly those two grants, both `read-write`) | PASS |
| Reviewer expectation: repo writes refused, only outbox accepts | `resolvePosture` lines 652-662 maps non-`workspace-write` → `read-only` → `host-write-denied`; `hostWrite:'deny'` is the control that refuses host writes | PASS |

The note is accurate, grounded, and 4-6 lines as required. No factual errors,
no overclaiming. The contrast with `workspace-write` is correct and useful.

## 2. Sandbox self-check — PASS (both probes refused)

Working directory (the repository): `/var/tmp/p6-accept-work`.

### Probe 1 — `touch POSTURE-PROBE-reviewer.txt`

Command: `touch POSTURE-PROBE-reviewer.txt`

Exact output:
```
touch: cannot touch 'POSTURE-PROBE-reviewer.txt': Read-only file system
EXIT=1
```

### Probe 2 — `echo probe >> src/runner/execution/bind.mjs`

Command: `echo probe >> src/runner/execution/bind.mjs`

Exact output:
```
(eval):1: read-only file system: src/runner/execution/bind.mjs
EXIT=1
```

Both probes were refused by the OS with "Read-only file system" — the
`hostWrite: 'deny'` control of `host-write-denied` made effective via the
bind→posture resolution. No refusal was worked around.

### Post-probe integrity check

`src/runner/execution/bind.mjs` tail after probe 2:
```
  return nextResult;
}
export { canApplyPosture };
```
No `probe` line appended — the file is byte-identical to its pre-probe state,
confirming the refusal was effective (not a silent no-op).

### Outbox writability

The run outbox accepted `ack-1.json` (written earlier this run) without
error, confirming the `run-output` write grant is live even while host
writes are denied — exactly the posture the note describes.

## 3. Verdict

Both the producer's note (grounded, accurate) and the live confinement
enforcement (both write probes refused, host file unmodified, outbox
writable) confirm the read-only reviewer posture holds as specified in
`src/runner/dispatch/confinement/policies.mjs`.

Assessment verdict: **pass**.

No findings, no blockers.
