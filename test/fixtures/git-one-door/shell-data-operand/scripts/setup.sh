#!/bin/sh
die() { echo "setup: $*" >&2; exit 1; }
[ -d tools ] || die "tools missing: build them (git clone https://example.invalid/tools.git && make)"
echo "pushed: $(git push origin HEAD)"
