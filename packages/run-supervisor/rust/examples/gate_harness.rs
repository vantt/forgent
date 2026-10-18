//! Runs `gate::run` as a process of its own, the way the host binary's
//! `internal gate` route does, so the gate tests can start it under bwrap
//! without building the whole host.

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    std::process::exit(fgos_run_supervisor::gate::run(&args));
}
