#!/bin/sh
set -eu
export CARGO_TARGET_DIR=.fgos/runtime/phase-target
cargo fmt -p fgos-event-store -p fgos-git
cargo test --locked -p fgos-event-store -p fgos-git -- --test-threads=1
cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings
