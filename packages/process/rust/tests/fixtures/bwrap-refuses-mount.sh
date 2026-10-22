#!/bin/sh
# A bwrap that refuses a mount: it names the mount on stderr and exits without
# writing --info-fd, on every invocation.
echo "bwrap: Can't bind mount /oldroot/var/tmp/x on /newroot/var/tmp/x: Invalid argument" >&2
exit 1
