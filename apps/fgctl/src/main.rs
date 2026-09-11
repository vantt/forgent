use fgos_distribution::store::{
    list_releases, resolve_machine_release_store_root, stage_release, StageOutcome,
};
use std::path::PathBuf;

fn print_usage_and_exit() -> ! {
    eprintln!("Usage: fgctl <stage|status> [options]");
    eprintln!();
    eprintln!("Subcommands:");
    eprintln!("  stage   Stage a release tree into the machine release store");
    eprintln!("  status  Show staged releases in the machine release store");
    std::process::exit(1);
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        print_usage_and_exit();
    }

    match args[1].as_str() {
        "stage" => {
            let mut from_path: Option<PathBuf> = None;
            let mut i = 2;
            while i < args.len() {
                if args[i] == "--from" && i + 1 < args.len() {
                    from_path = Some(PathBuf::from(&args[i + 1]));
                    i += 2;
                } else {
                    eprintln!("Unknown option: {}", args[i]);
                    print_usage_and_exit();
                }
            }

            let from = match from_path {
                Some(p) => p,
                None => {
                    eprintln!("Error: --from <path> is required for 'fgctl stage'");
                    print_usage_and_exit();
                }
            };

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
            let mut json_output = false;
            let mut i = 2;
            while i < args.len() {
                if args[i] == "--json" {
                    json_output = true;
                    i += 1;
                } else {
                    eprintln!("Unknown option: {}", args[i]);
                    print_usage_and_exit();
                }
            }

            let store_root = resolve_machine_release_store_root();
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
                    }
                }
                Err(err) => {
                    eprintln!("Error reading releases: {}", err);
                    std::process::exit(1);
                }
            }
        }
        _ => {
            print_usage_and_exit();
        }
    }
}
