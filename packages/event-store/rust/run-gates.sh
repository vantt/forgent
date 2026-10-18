#!/bin/sh
set -eu
export CARGO_TARGET_DIR=.fgos/runtime/es-p03-u4-private
cargo fmt --check -p fgos-event-store -p fgos-git
cargo test --locked -p fgos-event-store -p fgos-git -- --test-threads=1
cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings
