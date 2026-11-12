use fgos_distribution::fgctl_refresh::{refresh_fgctl_for_workspace, FgctlRefresh};
use fgos_distribution::store::{
    list_releases, resolve_machine_release_store_root, stage_release, StageOutcome,
};
use fgos_distribution::{
    get_workspace_status, repair_workspace, status_result_line, upgrade_workspace_resolving,
    verify_workspace,
};
use std::path::PathBuf;

mod help;

use help::{find_verb, parse_flags, print_overview, print_verb_help, unknown_verb};

/// `fgctl <version> (<commit12>, <commit date>)`; the commit parts read
/// `unknown commit` when the build did not state them.
fn print_version(json: bool) {
    let version = env!("CARGO_PKG_VERSION");
    let commit = env!("FGCTL_BUILD_COMMIT");
    let commit_date = env!("FGCTL_BUILD_COMMIT_DATE");
    if json {
        let known = |value: &str| (!value.is_empty()).then(|| value.to_string());
        let object = serde_json::json!({
            "name": "fgctl",
            "version": version,
            "commit": known(commit),
            "commitTime": known(commit_date),
        });
        println!("{object}");
    } else if commit.is_empty() {
        println!("fgctl {version} (unknown commit)");
    } else if commit_date.is_empty() {
        println!("fgctl {version} ({commit})");
    } else {
        println!("fgctl {version} ({commit}, {commit_date})");
    }
}

fn current_dir_or_exit() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|err| {
        eprintln!("Error reading current directory: {}", err);
        std::process::exit(1);
    })
}

/// After `fgctl upgrade` activated a release: make this binary the `fgctl`
/// that release ships. A refusal exits non-zero after saying the activation
/// itself stands.
fn refresh_own_binary(cwd: &std::path::Path) {
    let installed = match std::env::current_exe() {
        Ok(path) => path,
        Err(err) => {
            eprintln!("Error: release activated, but fgctl cannot locate its own binary: {err}");
            std::process::exit(1);
        }
    };
    match refresh_fgctl_for_workspace(cwd, &installed) {
        Ok(FgctlRefresh::UpToDate { digest }) => {
            eprintln!("fgctl: up to date with the release ({digest})");
        }
        Ok(FgctlRefresh::NotShipped) => {
            eprintln!(
                "fgctl: the release ships no fgctl; {} left unchanged",
                installed.display()
            );
        }
        Ok(FgctlRefresh::Replaced { previous, digest }) => {
            eprintln!(
                "fgctl: replaced {} with the release's fgctl ({digest}); previous binary kept at {}",
                installed.display(),
                previous.display()
            );
            // One fgctl serves every project on this machine; say which activation chose it.
            let project = fgos_distribution::workspace::resolve_workspace_root(cwd)
                .map(|root| root.display().to_string())
                .unwrap_or_else(|_| cwd.display().to_string());
            eprintln!(
                "fgctl: this is the machine-wide fgctl for every project; the release active in {project} chose it"
            );
        }
        Err(err) => {
            eprintln!("Error: release activated, but fgctl was not updated: {err}");
            std::process::exit(1);
        }
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    // Hidden, unlisted: the holder-lock helper roles. The activation gate must
    // not run anything from a candidate release, so it re-executes `fgctl`.
    if args.len() >= 3 && args[1] == "internal" && args[2] == "holder-lock-helper" {
        let helper_args: Vec<std::ffi::OsString> = std::env::args_os().skip(3).collect();
        std::process::exit(fgos_holder_lock::helper::main(&helper_args));
    }

    if args.get(1).is_some_and(|a| a == "internal")
        && args.get(2).is_some_and(|a| a == "quiesce-scan")
    {
        let route_args: Vec<std::ffi::OsString> = std::env::args_os().skip(2).collect();
        std::process::exit(fgos_holder_lock::route::main(&route_args));
    }

    let Some(name) = args.get(1).map(String::as_str) else {
        print_overview();
        return;
    };
    match name {
        "--help" | "-h" => return print_overview(),
        "--version" | "-V" => return print_version(false),
        "help" => {
            match args.get(2).map(String::as_str) {
                None => print_overview(),
                Some(topic) => match find_verb(topic) {
                    Some(verb) => print_verb_help(verb),
                    None => unknown_verb(topic),
                },
            }
            return;
        }
        _ => {}
    }
    let Some(verb) = find_verb(name) else {
        unknown_verb(name);
    };
    let flags = parse_flags(verb, &args[2..]);

    match verb.name {
        "version" => print_version(flags.has("--json")),
        "stage" => {
            let from = PathBuf::from(flags.require("--from"));
            let store_root = resolve_machine_release_store_root();
            match stage_release(&store_root, &from) {
                Ok(StageOutcome::Staged { artifact_digest }) => {
                    println!("staged release {}", artifact_digest);
                }
                Ok(StageOutcome::NoOp { artifact_digest }) => {
                    println!("release {} already staged", artifact_digest);
                }
                Err(err) => {
                    eprintln!("{}", err);
                    std::process::exit(1);
                }
            }
        }
        "status" => {
            let json_output = flags.has("--json");
            let store_root = resolve_machine_release_store_root();
            let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

            if let Some(ws) = get_workspace_status(&cwd, &store_root) {
                if json_output {
                    let json =
                        serde_json::to_string_pretty(&ws).unwrap_or_else(|_| "{}".to_string());
                    println!("{}", json);
                } else {
                    println!("activeArtifactDigest: {}", ws.active_artifact_digest);
                    if let Some(prev) = &ws.previous_artifact_digest {
                        println!("previousArtifactDigest: {}", prev);
                    }
                    if ws.quarantined {
                        println!("quarantined: true");
                    }
                    for r in &ws.releases {
                        println!(
                            "{} (version: {}, created: {})",
                            r.artifact_digest,
                            r.release_version.as_deref().unwrap_or("none"),
                            r.created_at.as_deref().unwrap_or("none")
                        );
                    }
                    if let Some(drift) = &ws.pin_drift {
                        println!("{drift}");
                    }
                    println!("{}", status_result_line(Some(&ws)));
                }
            } else {
                match list_releases(&store_root) {
                    Ok(releases) => {
                        if json_output {
                            let json = serde_json::to_string_pretty(&releases)
                                .unwrap_or_else(|_| "[]".to_string());
                            println!("{}", json);
                        } else {
                            for r in releases {
                                println!(
                                    "{} (version: {}, created: {})",
                                    r.artifact_digest,
                                    r.release_version.as_deref().unwrap_or("none"),
                                    r.created_at.as_deref().unwrap_or("none")
                                );
                            }
                            println!("{}", status_result_line(None));
                        }
                    }
                    Err(err) => {
                        eprintln!("Error reading releases: {}", err);
                        std::process::exit(1);
                    }
                }
            }
        }
        "init" => {
            let cwd = current_dir_or_exit();
            let inputs = fgos_distribution::fetch::SourceInputs::from_env(flags.value("--from"));
            let endpoint = fgos_distribution::fetch::DownloadEndpoint::from_env();
            let pin_override_reason = flags.value("--override-pin");
            if let Err(err) = fgos_distribution::init_workspace_resolving(
                &cwd,
                &inputs,
                &endpoint,
                pin_override_reason.as_deref(),
            ) {
                eprintln!("Error: {}", err);
                std::process::exit(err.exit_status());
            }
        }
        "upgrade" => {
            let cwd = current_dir_or_exit();
            let inputs = fgos_distribution::fetch::SourceInputs::from_env(flags.value("--from"));
            let endpoint = fgos_distribution::fetch::DownloadEndpoint::from_env();
            if let Err(err) = upgrade_workspace_resolving(&cwd, &inputs, &endpoint) {
                // Not ready still means the release is activated, so fgctl follows it.
                if matches!(err, fgos_distribution::InitError::NotReady) {
                    refresh_own_binary(&cwd);
                }
                eprintln!("Error: {}", err);
                std::process::exit(err.exit_status());
            }
            refresh_own_binary(&cwd);
        }
        "repair" => {
            if let Err(err) = repair_workspace(&current_dir_or_exit()) {
                eprintln!("Error: {}", err);
                std::process::exit(err.exit_status());
            }
        }
        "verify" => {
            if let Err(err) = verify_workspace(&current_dir_or_exit()) {
                eprintln!("Error: {}", err);
                std::process::exit(1);
            }
        }
        "uninstall" => {
            let options = fgos_distribution::uninstall::UninstallOptions {
                yes: flags.has("--yes"),
                dry_run: flags.has("--dry-run"),
                purge: flags.has("--purge"),
            };
            let store_root = resolve_machine_release_store_root();
            if let Err(err) = fgos_distribution::uninstall::run_uninstall(
                &current_dir_or_exit(),
                &options,
                &store_root,
            ) {
                eprintln!("Error: {}", err);
                std::process::exit(1);
            }
        }
        _ => unreachable!("every verb in the table has an arm"),
    }
}
