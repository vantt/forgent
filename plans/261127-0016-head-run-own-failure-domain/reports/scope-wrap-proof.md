# Scope-wrap proof (phase 1, step 1)

Status: **PASS** (run unconfined by lead:SUPERVISOR, 2026-11-27 00:27). Exec-wrap design stays.

## Why the lead could not run it

On 2026-11-27 the lead tried it from its confined shell. `systemctl --user` and `systemd-run --user` both failed with
`Failed to connect to user scope bus via local transport: No data available`, even with
`XDG_RUNTIME_DIR=/run/user/1000` set. Unit sandboxes have the same mask (`docs/platform/agent-confinement/spec.md`,
runtimeDir). Phase 1 therefore builds the exec-wrap design. This proof decides whether that design stays or whether
phase 1 switches to the D3 fallback (attach the spawned pid with `StartTransientUnit` + `PIDs`) before phase 4.

## The check (paste into an unconfined shell)

```bash
L=$(mktemp); OUT=$(mktemp); U=fgos-run-proof-$$
( exec 3>"$L"; flock -x 3
  setsid systemd-run --user --scope --collect --unit="$U" -p OOMPolicy=stop -- \
    bash -c 'echo "fd3=$(readlink /proc/self/fd/3)"; echo "cgroup=$(cat /proc/self/cgroup)"; sleep 6' \
    >"$OUT" 2>&1 3>&3 &
  sleep 2; exec 3>&-
  flock -n "$L" -c 'echo RESULT=FAIL lock free while child runs' || echo "RESULT=PASS lock held by child in scope"
  systemctl --user status "$U.scope" --no-pager | head -5
  wait )
cat "$OUT"; rm -f "$L" "$OUT"
```

Pass: `RESULT=PASS`, `fd3=` names the lock file, and the cgroup line ends in `/fgos-run-proof-<pid>.scope`.
Fail: phase 1 switches to the fallback through a fix unit; names and the binding field stay the same.

## Result

**PASS.** lead:SUPERVISOR ran the check unconfined on fg-server2 at 2026-11-27 00:27 (+07):

```text
RESULT=PASS lock held by child in scope
fd3=/tmp/tmp.RUtt9eYhlr
cgroup=0::/user.slice/user-1000.slice/user@1000.service/app.slice/fgos-run-proof-2788851.scope
```

The fd and its lock survive `setsid systemd-run --user --scope`, and the child sits in its own scope. Phase 1 keeps
the exec-wrap design; the D3 fallback is not needed. Question `q-j7zgwtgyyu` was cancelled by its asker.
