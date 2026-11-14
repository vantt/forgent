//! `apps/fgos` binary.
//!
//! Entry point for the fgOS platform host CLI.
//!
//! Scans arguments for host-global options (only `--version`, mapped to the
//! `version` verb), embeds
//! the checked `command-routes.json` routing descriptor, delegates legacy-cli
//! routes to `legacy_exec`, and routes native operations through the
//! `fgos-host-runtime` `InvocationService` kernel pipeline.

mod cli_presenter;
mod cli_projector;
mod help;
mod invocation_doors;
mod legacy_exec;
mod routing;
mod wiring;
use fgos_distribution::suggest::suggest;
use fgos_host_runtime::exit_codes;
use fgos_host_runtime::invocation_service::NoopEventSink;
use fgos_host_runtime::{build_snapshot, InvocationService, ProviderDescriptor, CATALOG};
use routing::{command_routes, Call, HookKind, Lane};
use std::sync::Arc;

/// Whether a native invocation consumes a payload from stdin. `cli_args[0]` is
/// the selector, `cli_args[1]` the subcommand. Keep in step with the
/// providers that read `ObserveRequest.stdin`.
fn native_invocation_reads_stdin(op_id: &str, cli_args: &[std::ffi::OsString]) -> bool {
    let arg = |i: usize| cli_args.get(i).and_then(|a| a.to_str());
    match op_id {
        "observe.metrics" => {
            arg(1) == Some("ping") || (arg(1) == Some("eval") && arg(2) == Some("record"))
        }
        "observe.friction" => cli_args.iter().any(|a| a == "--detail-stdin"),
        _ => false,
    }
}

/// Whether an exact `--help` or `-h` token follows the selector: a help
/// request, which the host answers from the verb manifest (`help.rs`).
fn wants_help_token(cli_args: &[std::ffi::OsString]) -> bool {
    cli_args.iter().skip(1).any(|a| a == "--help" || a == "-h")
}

/// Printed when `fgos` runs with no arguments: the three steps of a first run
/// (the same three `fgctl` and the README print) and the agent path.
const GET_STARTED: &str = "\
fgos - the foundation for generative agents

Get started:
  1. Install fgctl:      curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh
  2. In your project:    fgctl init
  3. Run a task:         fgos run \"<prompt>\"

Agents / automation:
  Run `fgctl init`, then `fgos doctor --json` and run each `next` command it lists.

More: `fgos --help` lists every command, `fgos <command> --help` describes one,
`fgos --version` prints the version.
";

/// Refuses an unlisted selector: the exit-4 usage error, with the nearest verb
/// when the input looks like a typo of one, and the fault record of a malformed call.
fn refuse_unknown_verb(selector: &str, cli_args: &[std::ffi::OsString]) -> ! {
    let message = format!("unknown verb \"{selector}\". Usage: fgos <command> [args...]");
    eprintln!("fgos: {message}");
    let mut verbs: Vec<&str> = command_routes().keys().map(String::as_str).collect();
    verbs.sort_unstable();
    if let Some(near) = suggest(selector, verbs.into_iter()) {
        eprintln!("did you mean `fgos {near}`?");
    }
    if let Some(path) = invocation_doors::record_unknown_verb(selector, cli_args, &message) {
        eprintln!("fgos: invocation fault recorded to {}", path.display());
    }
    std::process::exit(exit_codes::validation());
}

/// Prints a help answer and ends the process: the text on stdout and exit 0,
/// or one stderr line and exit 4 with nothing on stdout.
fn answer_help(answer: Result<String, help::Refusal>) -> ! {
    match answer {
        Ok(text) => {
            use std::io::Write;
            // A closed pipe (`fgos --help | head`) is the reader's choice, not a failure.
            let mut stdout = std::io::stdout().lock();
            let _ = stdout.write_all(text.as_bytes());
            let _ = stdout.flush();
            std::process::exit(exit_codes::ok());
        }
        Err(help::Refusal(message)) => {
            eprintln!("fgos: {message}");
            std::process::exit(exit_codes::validation());
        }
    }
}

/// Static provider table for the composition root.
static COMPOSITION_PROVIDERS: &[ProviderDescriptor] = &[
    fgos_distribution::DISTRIBUTION_BUILD_SHOW_DESCRIPTOR,
    fgos_work_state::WORK_GATE_BYPASS_SHOW_DESCRIPTOR,
    fgos_observe::OBSERVE_METRICS_DESCRIPTOR,
    fgos_observe::OBSERVE_FRICTION_DESCRIPTOR,
    fgos_convention::CONVENTION_DESCRIPTOR,
    fgos_identity::IDENTITY_DESCRIPTOR,
    fgos_identity::IDENTITY_READ_DESCRIPTOR,
    fgos_identity::IDENTITY_WRITE_DESCRIPTOR,
    wiring::mailbox_verbs::SEND_DESCRIPTOR,
    wiring::mailbox_verbs::INBOX_DESCRIPTOR,
    wiring::mailbox_verbs::INBOX_CLAIM_DESCRIPTOR,
    wiring::mailbox_verbs::LIST_DESCRIPTOR,
    wiring::mailbox_verbs::STATUS_DESCRIPTOR,
    fgos_config::provider::CONFIG_READ_DESCRIPTOR,
    fgos_config::provider::CONFIG_WRITE_DESCRIPTOR,
];

fn main() {
    let args: Vec<std::ffi::OsString> = std::env::args_os().collect();

    // `fgos internal ...`: host routes for the Node payload (lock-fd,
    // lock-hold, quiesce-scan, lock-borrow-vectors). Dispatched before the
    // route table, composition and any spawn, so no child of this process
    // can inherit a descriptor handed to a route; not listed in
    // command-routes.json or help.
    if args.get(1).is_some_and(|a| a == "internal") {
        // `holder-lock-helper <role>`: the roles a re-executed binary plays
        // for the holder-lock port (see `fgos_holder_lock::helper`).
        if args.get(2).is_some_and(|a| a == "holder-lock-helper") {
            std::process::exit(fgos_holder_lock::helper::main(&args[3..]));
        }
        // `terminal-control <op>`: the key-addressed terminal port, one
        // operation per process (see `fgos_terminal_control::route`).
        if args.get(2).is_some_and(|a| a == "terminal-control") {
            let rest: Vec<String> = args[3..]
                .iter()
                .map(|a| a.to_string_lossy().into_owned())
                .collect();
            std::process::exit(fgos_terminal_control::route::main(&rest));
        }
        // `seat-binding <op>`: the seat binding decision the Node payload must
        // not copy (see `fgos_seat_binding::route`).
        if args.get(2).is_some_and(|a| a == "seat-binding") {
            let rest: Vec<String> = args[3..]
                .iter()
                .map(|a| a.to_string_lossy().into_owned())
                .collect();
            std::process::exit(fgos_seat_binding::route::main(&rest));
        }
        // The run supervisor's routes: supervise, gate, adopt, attempt-step.
        let rest: Vec<String> = args[2..]
            .iter()
            .map(|a| a.to_string_lossy().into_owned())
            .collect();
        if let Some(route) = rest.first() {
            if let Some(code) = fgos_run_supervisor::route::main(route, &rest[1..]) {
                std::process::exit(code);
            }
        }
        std::process::exit(fgos_holder_lock::route::main(&args[2..]));
    }

    // `fgos --version` prints one line, `fgos <version>`, like `fgctl --version`; the `version`
    // verb keeps the envelope for callers that read it.
    let owned_args: Vec<std::ffi::OsString> = args.iter().skip(1).cloned().collect();
    if owned_args.first().is_some_and(|a| a == "--version") {
        println!("fgos {}", env!("CARGO_PKG_VERSION"));
        std::process::exit(exit_codes::ok());
    }
    let cli_args = &owned_args[..];

    // No arguments: the first-run guide, not an error.
    if cli_args.is_empty() {
        print!("{GET_STARTED}");
        std::process::exit(exit_codes::ok());
    }

    // R1: No host-global options besides `--version` (answered above) -- the first positional
    // token is always the selector, dash-prefixed or not. `--help` and `-h`
    // are selectors in the route table like any verb (the manifest door);
    // every other dash-prefixed token has no route. Do NOT skip past a
    // leading dash-prefixed token while searching for "the real" selector:
    // that would let an unlisted option in front of a real selector (e.g.
    // `fgos --made-up version`) slip past R3's unknown-verb rejection and
    // fall through to whatever route the token after it happens to name.
    let selector = match cli_args.first().and_then(|a| a.to_str()) {
        Some(s) if !s.is_empty() => s,
        // R3: an empty or non-UTF-8 selector fails closed with the table's validation status.
        other => refuse_unknown_verb(other.unwrap_or(""), cli_args),
    };

    // `fgos --help|-h [<verb> [<sub>]] [--json]`: the manifest door, answered
    // here before any route lookup, composition or spawn.
    if selector == "--help" || selector == "-h" {
        answer_help(help::top_level(&cli_args[1..]));
    }

    let routes = command_routes();
    let route = match routes.get(selector) {
        Some(r) => r,
        // R3: Unknown/unlisted selector fails closed with exit code 4.
        None => refuse_unknown_verb(selector, cli_args),
    };

    // `fgos <verb> [<sub>] --help|-h [--json]` for a listed selector, whatever
    // its route kind (`hook` and the native kinds included): the verb's
    // manifest entry, never the operation. Only an exact help token counts,
    // even where the verb's own parser would take it as a flag value.
    if wants_help_token(cli_args) {
        answer_help(help::for_verb(cli_args));
    }

    // A kind the route table declares native (`hook mailbox`) runs here,
    // before the composition root: the hook protocol needs exact stdout
    // bytes, exit 0 on every path, and no snapshot or async runtime on its
    // hot path.
    let call = Call::new(cli_args);
    let lane = routing::decide(route, &call);
    if let Lane::HookProtocol(kind) = lane {
        match kind {
            HookKind::MailboxSync => wiring::mailbox_sync::main(&cli_args[2..]),
            HookKind::Mailbox => wiring::mailbox_hook::main(&cli_args[2..]),
        }
    }

    // Composition root: build snapshot and InvocationService.
    let snapshot = build_snapshot(CATALOG, COMPOSITION_PROVIDERS, "fgos-composition-root-v1");
    let service = InvocationService::new(snapshot);
    service.register_provider(Arc::new(fgos_distribution::BuildShowProvider::new()));
    service.register_provider(Arc::new(fgos_work_state::GateBypassShowProvider::new()));
    let observe_wiring = Arc::new(fgos_observe::ObserveWiring {
        sources: wiring::metrics_sources::build_metrics_sources(),
        work_source: wiring::metrics_sources::build_work_observation_source(),
        coverage_scanner: fgos_run_result::scan_coverage,
        unit_summary_scanner: wiring::metrics_sources::build_unit_summary_scanner(),
    });
    for descriptor in [
        fgos_observe::OBSERVE_METRICS_DESCRIPTOR,
        fgos_observe::OBSERVE_FRICTION_DESCRIPTOR,
    ] {
        service.register_provider(Arc::new(fgos_observe::ObserveProvider::for_descriptor(
            descriptor,
            Arc::clone(&observe_wiring),
        )));
    }
    service.register_provider(Arc::new(fgos_convention::ConventionProvider::new()));
    for descriptor in [
        fgos_identity::IDENTITY_DESCRIPTOR,
        fgos_identity::IDENTITY_READ_DESCRIPTOR,
        fgos_identity::IDENTITY_WRITE_DESCRIPTOR,
    ] {
        service.register_provider(Arc::new(
            fgos_identity::IdentityProvider::for_descriptor(descriptor)
                .with_log_door(Arc::new(wiring::identity_log::StoreLogDoor)),
        ));
    }
    for descriptor in [
        wiring::mailbox_verbs::SEND_DESCRIPTOR,
        wiring::mailbox_verbs::INBOX_DESCRIPTOR,
        wiring::mailbox_verbs::INBOX_CLAIM_DESCRIPTOR,
        wiring::mailbox_verbs::LIST_DESCRIPTOR,
        wiring::mailbox_verbs::STATUS_DESCRIPTOR,
    ] {
        service.register_provider(Arc::new(
            wiring::mailbox_verbs::MailboxProvider::for_descriptor(descriptor),
        ));
    }
    for descriptor in [
        fgos_config::provider::CONFIG_READ_DESCRIPTOR,
        fgos_config::provider::CONFIG_WRITE_DESCRIPTOR,
    ] {
        service.register_provider(Arc::new(
            fgos_config::provider::ConfigProvider::for_descriptor(descriptor),
        ));
    }
    let tracker = service.tracker();

    match lane {
        Lane::HookProtocol(_) => unreachable!("a hook kind ends the process above"),
        Lane::Legacy if route.route_kind == "legacy-cli" => {
            // Check recursion guard immediately. Fails closed if already set.
            if let Err(err) = legacy_exec::check_recursion_guard() {
                eprintln!("fgos: error: {}", err);
                std::process::exit(exit_codes::unexpected());
            }
            // Delegate to legacy-cli lane.
            legacy_exec::execute_legacy_cli(selector, &tracker, cli_args);
        }
        Lane::Native { operation_id } => {
            let doors = invocation_doors::Doors::new(
                route,
                &call,
                cli_args,
                &invocation_doors::EventStoreLifecycle,
            );
            let entered = match doors.enter() {
                Ok(entered) => entered,
                Err(refused) => std::process::exit(refused.report()),
            };
            let code = run_native(&service, &operation_id, cli_args, entered.project.clone());
            doors.leave(&entered);
            std::process::exit(code);
        }
        Lane::Legacy => {
            eprintln!(
                "fgos: error: unsupported route_kind '{}' for selector '{}'",
                route.route_kind, selector
            );
            std::process::exit(exit_codes::unexpected());
        }
    }
}

/// Runs one native operation of the composition root and presents its answer; returns the exit code.
/// `project` is the root the doors resolved, or why there is none: only the operations that read a project
/// consume it.
fn run_native(
    service: &InvocationService,
    route_operation: &str,
    cli_args: &[std::ffi::OsString],
    project: Result<std::path::PathBuf, String>,
) -> i32 {
    let op_id_owned = match cli_projector::native_operation_id(route_operation, cli_args) {
        Ok(id) => id,
        Err(err) => {
            eprintln!("fgos: error: {}", err);
            return exit_codes::unexpected();
        }
    };
    let op_id_str = op_id_owned.as_str();

    // Only the invocations that take a payload on stdin read it, and
    // they read it to EOF. Every other native verb never touches
    // stdin, so an inherited-but-open stdin (heredoc, agent Bash tool,
    // pipe with a live writer) cannot block it.
    let stdin_data = if native_invocation_reads_stdin(op_id_str, cli_args) {
        use std::io::IsTerminal;
        if !std::io::stdin().is_terminal() {
            use std::io::Read;
            let mut buf = Vec::new();
            let max_bytes = 1024 * 1024;
            let mut handle = std::io::stdin().take(max_bytes as u64 + 1);
            handle.read_to_end(&mut buf).unwrap_or_default();
            if buf.len() > max_bytes {
                eprintln!("fgos: error: stdin payload exceeds 1 MiB limit [stdin-overflow]");
                return exit_codes::validation();
            }
            if !buf.is_empty() {
                Some(buf)
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    let (invocation, request) =
        match cli_projector::project_cli_invocation(op_id_str, cli_args, project, stdin_data) {
            Ok(pair) => pair,
            Err(err) => {
                eprintln!("fgos: error: {}", err);
                return exit_codes::unexpected();
            }
        };
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("failed to build current-thread tokio runtime");

    let (res, record) = rt.block_on(async {
        service
            .invoke_with_record(invocation, request, &NoopEventSink)
            .await
    });

    legacy_exec::emit_invocation_record(&record);

    match res {
        Ok(outcome) => {
            cli_presenter::present_outcome(&outcome, cli_args.iter().any(|arg| arg == "--json"))
        }
        Err(err) => cli_presenter::present_error(&err),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_production_composition_carries_no_test_fixture_provider() {
        for descriptor in COMPOSITION_PROVIDERS {
            assert!(
                !descriptor.operation_id.as_str().starts_with("test."),
                "production composition wires fixture operation {}",
                descriptor.operation_id.as_str()
            );
        }
    }
}
