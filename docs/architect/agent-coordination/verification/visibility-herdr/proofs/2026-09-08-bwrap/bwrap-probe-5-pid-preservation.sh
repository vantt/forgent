#!/bin/sh
# Probe 5 — which confinement mechanisms preserve the pid?
#
# Probe 4 found the real blocker: herdr decides a pane is "an available shell"
# by comparing the pane's foreground pid against the shell pid it recorded.
# bwrap must fork to build its namespace, so the pid changes and herdr refuses.
#
# That makes pid preservation the property to select on, not sandbox strength.
#
# The measurement has to happen inside ONE shell: it prints its own pid, then
# execs the mechanism, which prints the pid again. A first attempt compared
# pids from two separate shells and reported the exec baseline itself as
# "changed", which is how a broken measurement announces itself.
set -u

measure() {
  label="$1"
  body="$2"
  out=$(sh -c "$body" 2>&1)
  first=$(echo "$out" | head -1)
  last=$(echo "$out" | tail -1)
  if [ "$first" = "$last" ]; then verdict='SAME PID -- herdr would still see its shell'; else verdict='pid changed'; fi
  printf '%-40s %-9s -> %-40s %s\n' "$label" "$first" "$last" "$verdict"
}

measure "exec (baseline: no confinement)" \
  'echo $$; exec sh -c "echo \$\$"'

measure "bwrap --ro-bind / /" \
  'echo $$; exec bwrap --ro-bind / / --dev /dev --proc /proc -- sh -c "echo \$\$"'

measure "unshare --mount --map-root-user" \
  'echo $$; exec unshare --mount --map-root-user -- sh -c "echo \$\$"'

printf '\n'
printf 'Landlock is the other shape: it is a syscall a process applies to ITSELF\n'
printf '(landlock_restrict_self), inherited by children, with no new process at\n'
printf 'all. This machine reports it active:\n  '
cat /sys/kernel/security/lsm 2>/dev/null
printf '\nNo CLI here applies it, so using it would mean a small helper that\n'
printf 'restricts itself and then execs the shell -- exec keeps the pid.\n'
