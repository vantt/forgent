#!/usr/bin/env bash
# Experiment E1 (Git spec §15, §10, §19): power cut at every write barrier on a real ext4 device.
#
# dm-log-writes records every write, flush and FUA the filesystem sends while a workload runs
# (scripts/git/e1-power-cut.mjs workload): Publication (CAS of refs with loose objects) and
# ScopedCommit (a commit of new files in new directories). Each acknowledged receipt is followed by a
# log mark; the two kinds are recorded and replayed one after the other. Afterwards the log is
# replayed, prefix by prefix, to every FUA entry (the points a power cut can expose), and each prefix
# is mounted through a throwaway dm-snapshot and checked: ext4 mounts, `git fsck --full` is clean,
# every acknowledged CAS or commit is still visible on its ref (or a later one) with its trees and
# blobs readable, and every acknowledged WAL chain is readable and terminal.
#
# Needs root, device-mapper (dm-log-writes, dm-snapshot) and xfstests' replay-log. Never run it on a
# device that holds data: both devices are overwritten.
#
#   sudo env "PATH=$PATH" scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 [--ops N]
#        [--kind publication|scoped|both] [--size-mib 256]
#        [--data /dev/X --log /dev/Y] [--replay-log /path/to/replay-log] [--user $SUDO_USER]
#
# Without --data/--log it makes loop devices from files under --work, which must sit on the real
# ext4 disk being judged (not tmpfs). --ops defaults to 24 for Publication and 12 for ScopedCommit.
# The verdict is written to <work>/e1-verdict.json, one entry per kind.
set -euo pipefail

WORK="" OPS="" KIND=both SIZE_MIB=256 DATA="" LOG="" REPLAY_LOG="$(command -v replay-log || true)" RUN_AS="${SUDO_USER:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --work) WORK="$2"; shift 2 ;; --ops) OPS="$2"; shift 2 ;; --kind) KIND="$2"; shift 2 ;; --size-mib) SIZE_MIB="$2"; shift 2 ;;
    --data) DATA="$2"; shift 2 ;; --log) LOG="$2"; shift 2 ;; --replay-log) REPLAY_LOG="$2"; shift 2 ;;
    --user) RUN_AS="$2"; shift 2 ;; *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
CHECKOUT="$(cd "$(dirname "$0")/../.." && pwd)"
NODE="$(command -v node)" || { echo 'e1: node is not on PATH; run it as sudo env "PATH=$PATH" scripts/git/e1-power-cut.sh ...' >&2; exit 1; }
die() { echo "e1: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || die "needs root (dm-log-writes, mount)"
case "$KIND" in publication|scoped|both) ;; *) die "--kind must be publication, scoped or both" ;; esac
[ -n "$WORK" ] || die "--work <dir on the ext4 disk under test> is required"
[ -n "$RUN_AS" ] && [ "$RUN_AS" != root ] || die "--user <the checkout's owner> is required (Git refuses repositories of another owner)"
[ -x "$REPLAY_LOG" ] || die "replay-log not found: build xfstests (git clone https://git.kernel.org/pub/scm/fs/xfs/xfstests-dev.git && make -C xfstests-dev) and pass --replay-log xfstests-dev/src/log-writes/replay-log"
# replay-log prints its usage and exits 1 for --help; under pipefail read the text, not the status.
usage="$("$REPLAY_LOG" --help 2>&1 || true)"
grep -q -- '--next-fua' <<<"$usage" && grep -q -- '--find' <<<"$usage" || die "$REPLAY_LOG lacks --find/--next-fua"
modprobe dm-log-writes 2>/dev/null || true
dmsetup targets | grep -q '^log-writes' || die "kernel has no dm-log-writes target"
dmsetup targets | grep -q '^snapshot' || modprobe dm-snapshot

mkdir -p "$WORK"; WORK="$(cd "$WORK" && pwd)"
[ "$(findmnt -T "$WORK" -n -o FSTYPE)" = ext4 ] || die "--work must be on the ext4 disk being judged"
OUT="$WORK/out"; MNT="$WORK/mnt"; mkdir -p "$OUT" "$MNT"; chown "$RUN_AS" "$OUT"
LW=fgos-e1-lw SNAP=fgos-e1-snap LOOPS=()
cleanup() {
  set +e
  mountpoint -q "$MNT" && umount "$MNT"
  dmsetup remove --retry "$SNAP" 2>/dev/null; dmsetup remove --retry "$LW" 2>/dev/null
  for l in "${LOOPS[@]}"; do losetup -d "$l"; done
}
trap cleanup EXIT
# Sets LOOP_DEV in this shell (not a command substitution), so cleanup sees every loop device.
loop() { truncate -s "$2" "$WORK/$1.img"; LOOP_DEV="$(losetup --show -f "$WORK/$1.img")"; LOOPS+=("$LOOP_DEV"); }
[ -n "$DATA" ] || { loop data "${SIZE_MIB}M"; DATA="$LOOP_DEV"; }
[ -n "$LOG" ] || { loop log "$((SIZE_MIB * 4))M"; LOG="$LOOP_DEV"; }
loop replay "${SIZE_MIB}M"; REPLAY="$LOOP_DEV"
loop cow "${SIZE_MIB}M"; COW="$LOOP_DEV"
SECTORS="$(blockdev --getsz "$DATA")"
# sudo leaves HOME at root's; the owner's Git state, cargo and node need the owner's own.
RUN_HOME="$(getent passwd "$RUN_AS" | cut -d: -f6)"
as_user() { runuser -u "$RUN_AS" -- env HOME="$RUN_HOME" "$@"; }
# A process the check started can still be closing files in the mount for a moment
# after the check returns: retry, and record who held it the first time.
release_mount() {
  local i
  for ((i = 0; i < 50; i++)); do
    umount "$MNT" 2>/dev/null && return 0
    [ "$i" -eq 0 ] && { echo "umount busy at entry ${cur:-?}:"; fuser -vm "$MNT" 2>&1 || true; } >> "$OUT/umount-busy.log"
    sleep 0.2
  done
  umount "$MNT"
}

# Addon descriptor and host binary are built as the checkout's owner, outside the device.
DESCRIPTOR="$(as_user "$NODE" "$CHECKOUT/scripts/git/e1-power-cut.mjs" descriptor --root "$OUT")"

# replay-log --find prints "<entry>@<sector>"; only the entry number is used here.
find_entry() { local found; found="$("$REPLAY_LOG" --log "$LOG" --find "$@")" || return 1; echo "${found%%@*}"; }

# One kind end to end: record on the logging target, replay to every FUA, then the syscall order.
# Sets KIND_JSON, KIND_CHECKED and KIND_FAILED for the verdict.
run_kind() {
  local kind="$1" ops="$2" i cur acked verdict line
  local kout="$OUT/$kind"; mkdir -p "$kout"; chown "$RUN_AS" "$kout"

  # 1. Record: mkfs and the workload on the logging target.
  dd if=/dev/zero of="$LOG" bs=1M count=1 status=none
  dmsetup create "$LW" --table "0 $SECTORS log-writes $DATA $LOG"
  mkfs.ext4 -q -F "/dev/mapper/$LW"
  dmsetup message "$LW" 0 mark mkfs
  mount "/dev/mapper/$LW" "$MNT"; mkdir "$MNT/w"; chown "$RUN_AS" "$MNT/w"
  local plan="$kout/plan.jsonl"; : > "$plan"; chown "$RUN_AS" "$plan"
  coproc WORKLOAD { as_user env -C "$CHECKOUT" "$NODE" scripts/git/e1-power-cut.mjs workload --kind "$kind" --root "$MNT/w" --descriptor "$DESCRIPTOR" --plan "$plan" --ops "$ops" --handshake; }
  local workload_child="$WORKLOAD_PID"  # bash unsets WORKLOAD_PID once the coprocess exits
  while IFS= read -r line <&"${WORKLOAD[0]}"; do
    case "$line" in ack\ *) dmsetup message "$LW" 0 mark "ack-${line#ack }"; echo ok >&"${WORKLOAD[1]}" ;; esac
  done
  wait "$workload_child" || die "$kind workload failed"
  umount "$MNT"
  dmsetup message "$LW" 0 mark done
  dmsetup remove --retry "$LW"

  # 2. Mark positions: ack-i is acknowledged at every replay point after its entry.
  local -a ack_at
  for ((i = 0; i < ops; i++)); do ack_at[i]="$(find_entry --end-mark "ack-$i")"; done
  local start; start="$(find_entry --end-mark mkfs)"

  # 3. Replay to every FUA after mkfs and check the image through a snapshot (mount writes go to COW).
  local results="$kout/checkpoints.jsonl"; : > "$results"
  local failed=0 checked=0
  cur="$(find_entry --next-fua --start-entry "$start" || true)"
  while [ -n "$cur" ]; do
    "$REPLAY_LOG" --log "$LOG" --replay "$REPLAY" --limit "$((cur + 1))" >/dev/null
    acked=0; for ((i = 0; i < ops; i++)); do [ "${ack_at[i]}" -lt "$cur" ] && acked=$((i + 1)); done
    dmsetup create "$SNAP" --table "0 $SECTORS snapshot $REPLAY $COW N 8"
    if mount "/dev/mapper/$SNAP" "$MNT" 2>"$kout/mount.err"; then
      if [ -d "$MNT/w" ]; then
        verdict="$(as_user env -C "$CHECKOUT" "$NODE" scripts/git/e1-power-cut.mjs check --kind "$kind" --root "$MNT/w" --descriptor "$DESCRIPTOR" --plan "$plan" --acked "$acked" || true)"
      else
        verdict="{\"acked\":$acked,\"violations\":$([ "$acked" -gt 0 ] && echo '["workload directory missing"]' || echo '[]')}"
      fi
      release_mount
    else
      verdict="{\"acked\":$acked,\"violations\":[\"mount failed: $(tr -d '"\n' < "$kout/mount.err")\"]}"
    fi
    udevadm settle 2>/dev/null || true  # udev may still be probing the new snapshot device
    dmsetup remove --retry "$SNAP"
    echo "{\"entry\":$cur,\"verdict\":${verdict:-null}}" >> "$results"
    checked=$((checked + 1))
    echo "$verdict" | grep -q '"violations":\[\]' || failed=$((failed + 1))
    cur="$(find_entry --next-fua --start-entry "$((cur + 1))" || true)"
  done

  # 4. The same workload's syscall order (§10) on this disk, unprivileged.
  as_user env -C "$CHECKOUT" "$NODE" scripts/git/e1-power-cut.mjs trace --kind "$kind" --root "$kout/trace" --ops "$ops" > "$kout/order.json" || failed=$((failed + 1))
  KIND_JSON="{\"kind\":\"$kind\",\"ops\":$ops,\"checkpoints\":$checked,\"failedCheckpoints\":$failed,\"checkpointLog\":\"$results\",\"order\":\"$kout/order.json\"}"
  KIND_CHECKED="$checked"; KIND_FAILED="$failed"
}

KINDS=(publication scoped); [ "$KIND" = both ] || KINDS=("$KIND")
TOTAL_CHECKED=0 TOTAL_FAILED=0 SUMMARIES=()
for kind in "${KINDS[@]}"; do
  default_ops=24; [ "$kind" = scoped ] && default_ops=12
  run_kind "$kind" "${OPS:-$default_ops}"
  TOTAL_CHECKED=$((TOTAL_CHECKED + KIND_CHECKED)); TOTAL_FAILED=$((TOTAL_FAILED + KIND_FAILED)); SUMMARIES+=("$KIND_JSON")
done

GIT_VERSION="$("$NODE" "$CHECKOUT/scripts/lib/sandbox-git.mjs" --root "$OUT" -- -C "$OUT" --version)"
KINDS_JSON="$(IFS=,; echo "${SUMMARIES[*]}")"
cat > "$WORK/e1-verdict.json" <<EOF
{"experiment":"E1","kernel":"$(uname -r)","git":"$GIT_VERSION","filesystem":"ext4","data":"$DATA",
 "kinds":[$KINDS_JSON],"checkpoints":$TOTAL_CHECKED,"failedCheckpoints":$TOTAL_FAILED,
 "result":"$([ "$TOTAL_FAILED" = 0 ] && [ "$TOTAL_CHECKED" -gt 0 ] && echo held || echo violated)"}
EOF
cat "$WORK/e1-verdict.json"
[ "$TOTAL_FAILED" = 0 ] && [ "$TOTAL_CHECKED" -gt 0 ]
