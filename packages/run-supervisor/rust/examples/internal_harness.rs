//! Plays the host binary for the supervisor tests: `internal <route> ...`
//! dispatches to the routes this crate owns, exactly as `fgos` does, so a
//! test can run the supervisor, its gate and its steps without the whole host.

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let code = match (args.first().map(String::as_str), args.get(1)) {
        (Some("internal"), Some(route)) => fgos_run_supervisor::route::main(route, &args[2..]),
        _ => None,
    };
    std::process::exit(code.unwrap_or(2));
}
