#!/usr/bin/env bash
# P-SPACE (Git spec §15, §10 C4) on a private small filesystem: the part that needs root to mount.
#
#   sudo scripts/git/p-space.sh --work /var/tmp/fgos-p-space [--user $SUDO_USER] [--size-mib 24]
#
# Three loop-backed ext4 filesystems, each mounted only for this run and owned by --user:
#   bytes   ENOSPC sweep: scripts/git/p-space-resource.mjs space leaves k bytes free per run
#   inodes  inode exhaustion: same sweep with --inodes on an ext4 made with very few inodes
#   eio     EIO: dm-flakey with error_writes alternating 1 s up / 1 s down under the E1 workload;
#           afterwards the device is switched back to linear and scripts/git/e1-power-cut.mjs check
#           verifies every acknowledged operation and the WAL scan
# Results land in <work>/out/*.json. Nothing outside --work is written.
set -euo pipefail
WORK="" RUN_AS="${SUDO_USER:-}" SIZE_MIB=24
while [ $# -gt 0 ]; do
  case "$1" in
    --work) WORK="$2"; shift 2 ;; --user) RUN_AS="$2"; shift 2 ;; --size-mib) SIZE_MIB="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
die() { echo "p-space: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || die "needs root (losetup, mount, dmsetup)"
[ -n "$WORK" ] || die "--work <dir> is required"
[ -n "$RUN_AS" ] && [ "$RUN_AS" != root ] || die "--user <the checkout's owner> is required"
CHECKOUT="$(cd "$(dirname "$0")/../.." && pwd)"
NODE="$(command -v node)"
mkdir -p "$WORK/out"; WORK="$(cd "$WORK" && pwd)"; chown "$RUN_AS" "$WORK/out"
LOOPS=() MOUNTS=() FLAKEY=fgos-p-space-flakey
cleanup() {
  set +e
  for m in "${MOUNTS[@]}"; do mountpoint -q "$m" && umount "$m"; done
  dmsetup remove "$FLAKEY" 2>/dev/null
  for l in "${LOOPS[@]}"; do losetup -d "$l"; done
}
trap cleanup EXIT
as_user() { runuser -u "$RUN_AS" -- env -C "$CHECKOUT" "$@"; }
fresh_fs() { # name, mkfs options...; prints the mount point
  local name="$1"; shift
  truncate -s "${SIZE_MIB}M" "$WORK/$name.img"
  local loop; loop="$(losetup --show -f "$WORK/$name.img")"; LOOPS+=("$loop")
  mkfs.ext4 -q -F "$@" "$loop" >/dev/null
  mkdir -p "$WORK/$name"; mount "$loop" "$WORK/$name"; MOUNTS+=("$WORK/$name")
  chown "$RUN_AS" "$WORK/$name"; echo "$WORK/$name"
}

status=0
bytes="$(fresh_fs bytes)"
as_user "$NODE" scripts/git/p-space-resource.mjs space --root "$bytes" --step 4096 --out "$WORK/out/p-space-bytes.json" || status=1
inodes="$(fresh_fs inodes -N 256)"
as_user "$NODE" scripts/git/p-space-resource.mjs space --inodes --root "$inodes" --step 1 --out "$WORK/out/p-space-inodes.json" || status=1

# EIO: alternate working and failing writes under a steady workload, then judge the image.
truncate -s "${SIZE_MIB}M" "$WORK/eio.img"; loop="$(losetup --show -f "$WORK/eio.img")"; LOOPS+=("$loop")
mkfs.ext4 -q -F "$loop" >/dev/null
sectors="$(blockdev --getsz "$loop")"
dmsetup create "$FLAKEY" --table "0 $sectors linear $loop 0"
mkdir -p "$WORK/eio"; mount "/dev/mapper/$FLAKEY" "$WORK/eio"; MOUNTS+=("$WORK/eio"); chown "$RUN_AS" "$WORK/eio"
descriptor="$(as_user "$NODE" scripts/git/e1-power-cut.mjs descriptor --root "$WORK/out")"
plan="$WORK/out/eio-plan.jsonl"; : > "$plan"; chown "$RUN_AS" "$plan"
as_user "$NODE" scripts/git/e1-power-cut.mjs workload --root "$WORK/eio/w" --descriptor "$descriptor" --plan "$plan" --ops 400 > "$WORK/out/eio-workload.log" 2>&1 &
writer=$!
sleep 2
dmsetup suspend "$FLAKEY"; dmsetup load "$FLAKEY" --table "0 $sectors flakey $loop 0 1 1 1 error_writes"; dmsetup resume "$FLAKEY"
wait "$writer" && echo "eio: workload finished without meeting EIO" || echo "eio: workload stopped: $(tail -c 400 "$WORK/out/eio-workload.log")"
dmsetup suspend "$FLAKEY"; dmsetup load "$FLAKEY" --table "0 $sectors linear $loop 0"; dmsetup resume "$FLAKEY"
umount "$WORK/eio"; mount "/dev/mapper/$FLAKEY" "$WORK/eio"   # drop the page cache: judge what reached the device
acked="$(grep -c '"kind":"ack"' "$plan" || true)"
as_user "$NODE" scripts/git/e1-power-cut.mjs check --root "$WORK/eio/w" --descriptor "$descriptor" --plan "$plan" --acked "$acked" > "$WORK/out/p-space-eio.json" || status=1
cat "$WORK/out/p-space-eio.json"
exit "$status"
