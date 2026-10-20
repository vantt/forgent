#!/usr/bin/env bash
# Event Store power-loss qualification (spec section 23.2 item 10).
#
# Each run makes a fresh ext4 filesystem on a dm-flakey device over a loop
# device whose image sits on a real ext4 disk, appends through the Event Store
# facade (with periodic seals) as the invoking user, then cuts power: the writer
# is frozen, the flakey table switches to drop_writes, the writer is killed and
# the filesystem unmounted, so nothing that was not durable reaches the disk.
# After remount (journal replay) every acknowledged event must be readable,
# none doubled, no sequence reused. Acknowledgements are logged on the image
# disk, outside the device under test.
#
# Run as root through sudo from the checkout, after building the addon as
# yourself (node scripts/git-addon.mjs):
#   sudo env "PATH=$PATH" scripts/event-store/power-loss.sh --runs 20
# Options:
#   --image-dir DIR   ext4 directory for the loop image and ack logs
#                     (default .fgos/runtime/tmp/es-power-loss)
#   --device DEV      use this existing loop device instead of creating one;
#                     its contents are destroyed
#   --runs N          number of power cuts (default 20)
#   --size-mb N       image size (default 512)
#   --seal-every N    seal after every N appends (default 7; 0 = never)
#   --out FILE        JSON lines result (default <image-dir>/power-loss.jsonl)
set -euo pipefail

checkout=$(cd "$(dirname "$0")/../.." && pwd)
image_dir="$checkout/.fgos/runtime/tmp/es-power-loss"
device=""
runs=20
size_mb=512
seal_every=7
out=""
while [ $# -gt 0 ]; do
  case "$1" in
    --image-dir) image_dir=$2; shift 2 ;;
    --device) device=$2; shift 2 ;;
    --runs) runs=$2; shift 2 ;;
    --size-mb) size_mb=$2; shift 2 ;;
    --seal-every) seal_every=$2; shift 2 ;;
    --out) out=$2; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

die() { echo "power-loss: $*" >&2; exit 2; }
[ "$(id -u)" = 0 ] || die "run as root: sudo env \"PATH=\$PATH\" $0"
[ -n "${SUDO_UID:-}" ] && [ "$SUDO_UID" != 0 ] || die "run through sudo from your own account; the store runs as that user"
for tool in dmsetup losetup mkfs.ext4 findmnt blockdev setpriv node git; do
  command -v "$tool" >/dev/null || die "missing $tool"
done
node=$(command -v node)
modprobe dm-flakey 2>/dev/null || true
dmsetup targets | grep -q '^flakey' || die "dm-flakey target unavailable (modprobe dm-flakey)"
[ -f "$checkout/.fgos/runtime/git-addon/native-addon.json" ] || die "build the addon first as yourself: node scripts/git-addon.mjs"

as_user() { setpriv --reuid="$SUDO_UID" --regid="$SUDO_GID" --init-groups env HOME="$(getent passwd "$SUDO_UID" | cut -d: -f6)" "$@"; }
as_user mkdir -p "$image_dir"
image_dir=$(cd "$image_dir" && pwd)
[ "$(findmnt -n -o FSTYPE -T "$image_dir")" = ext4 ] || die "$image_dir is not on ext4"
out=${out:-$image_dir/power-loss.jsonl}
mnt=$(mktemp -d /mnt/fgos-es-power-loss.XXXXXX 2>/dev/null || mktemp -d)
name="fgos-es-flakey-$$"
created_loop=""

cleanup() {
  set +e
  mountpoint -q "$mnt" && umount "$mnt"
  dmsetup info "$name" >/dev/null 2>&1 && dmsetup remove "$name"
  [ -n "$created_loop" ] && losetup -d "$created_loop"
  [ -n "$created_loop" ] && rm -f "$image_dir/device.img"
  rmdir "$mnt" 2>/dev/null
}
trap cleanup EXIT

if [ -z "$device" ]; then
  as_user truncate -s "${size_mb}M" "$image_dir/device.img"
  created_loop=$(losetup --find --show "$image_dir/device.img")
  device=$created_loop
fi
sectors=$(blockdev --getsz "$device")
allow="0 $sectors flakey $device 0 180 0"
drop="0 $sectors flakey $device 0 0 180 1 drop_writes"
load() { dmsetup suspend --nolockfs "$name"; dmsetup load "$name" --table "$1"; dmsetup resume "$name"; }

dmsetup create "$name" --table "$allow"
failures=0
for run in $(seq 1 "$runs"); do
  mkfs.ext4 -q -F "/dev/mapper/$name"
  mount "/dev/mapper/$name" "$mnt"
  chown "$SUDO_UID:$SUDO_GID" "$mnt"
  ack="$image_dir/ack-$run.jsonl"
  rm -f "$ack"; as_user touch "$ack"
  (cd "$checkout" && as_user "$node" scripts/event-store/power-loss-driver.mjs init "$mnt/store")
  sync
  (cd "$checkout" && exec setpriv --reuid="$SUDO_UID" --regid="$SUDO_GID" --init-groups "$node" scripts/event-store/power-loss-driver.mjs write "$mnt/store" "$ack" "$seal_every") &
  writer=$!
  sleep "$((2 + RANDOM % 5)).$((RANDOM % 10))"
  # Power cut: freeze the writer, drop every later write, kill, unmount.
  kill -STOP "$writer"
  load "$drop"
  kill -KILL "$writer"; wait "$writer" 2>/dev/null || true
  umount "$mnt"
  load "$allow"
  mount "/dev/mapper/$name" "$mnt"
  result=$(cd "$checkout" && as_user "$node" scripts/event-store/power-loss-driver.mjs verify "$mnt/store" "$ack") || failures=$((failures + 1))
  echo "{\"run\":$run,\"device\":\"$device\",\"sealEvery\":$seal_every,\"result\":${result:-null}}" | as_user tee -a "$out"
  umount "$mnt"
done
echo "power-loss: $runs runs, $failures failed; results in $out"
[ "$failures" = 0 ]
