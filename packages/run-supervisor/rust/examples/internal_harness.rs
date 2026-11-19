//! Plays the host binary for the supervisor tests: `internal <route> ...`
//! dispatches to the routes this crate owns, exactly as `fgos` does, so a
//! test can run the supervisor, its gate and its steps without the whole host.
//! It composes no paths land: a head's `session write` here refuses before
//! writing (`write-catch-up-refused`), naming this harness.

use std::sync::Arc;

use fgos_run_supervisor::route::{CatchUpRefusal, PublishRefusal, WritePublisher};

fn no_land() -> PublishRefusal {
    PublishRefusal {
        code: "land-not-composed".into(),
        detail: "the supervisor test harness composes no paths land".into(),
    }
}

fn main() {
    let publisher = WritePublisher {
        catch_up: Arc::new(|_, _| Err(CatchUpRefusal::Refused(no_land()))),
        path_clean: Arc::new(|_, _| Err(no_land())),
        publish: Arc::new(|_, _, _, _| Err(no_land())),
    };
    let args: Vec<String> = std::env::args().skip(1).collect();
    let code = match (args.first().map(String::as_str), args.get(1)) {
        (Some("internal"), Some(route)) => {
            fgos_run_supervisor::route::main(route, &args[2..], &publisher)
        }
        _ => None,
    };
    std::process::exit(code.unwrap_or(2));
}
