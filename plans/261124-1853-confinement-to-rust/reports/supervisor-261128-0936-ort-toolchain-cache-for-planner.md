# Note for the planner of 261124-1853-confinement-to-rust

Source: supervision event 2a674b0309dfcd92 from the lead of 261127-1220-confined-rust-offline (done, main 52d70b8aa9).

The Rust resolver's toolchain-cache resource (`resolver.rs` `toolchain_cache_resources`) now carries three entries:
cargo, rustup, and `toolchain-cache:ort` (`<home>/.cache/ort.pyke.io` read-only, plus `ORT_LIB_PATH` when exactly one
`dfbin/<triple>/<hash>` dir exists). The port and the Node-twin delete must keep all three (spec agent-confinement 9.4).
Confined units can now run cargo gates themselves.
