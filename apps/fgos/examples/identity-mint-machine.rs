//! Mints the machine id of a private state root through Identity's own door
//! (`fgos_identity::machine::mint`), for a live suite whose case has its own
//! `HOME` and so its own state root. The product mints it in `fgos doctor
//! --fix`, which a case's private release does not stage. Never run on a
//! real state root: it refuses one that already holds anything.
//!
//! ```text
//! cargo run --release -p fgos --example identity-mint-machine -- <empty-or-missing-state-root>
//! ```
use std::path::PathBuf;

fn main() {
    let Some(root) = std::env::args_os().nth(1).map(PathBuf::from) else {
        eprintln!("usage: identity-mint-machine <state-root>");
        std::process::exit(2);
    };
    let occupied = std::fs::read_dir(&root).is_ok_and(|mut entries| entries.next().is_some());
    if occupied {
        eprintln!("identity-mint-machine: {} is not empty", root.display());
        std::process::exit(3);
    }
    if let Err(error) = std::fs::create_dir_all(&root) {
        eprintln!("identity-mint-machine: {error}");
        std::process::exit(3);
    }
    match fgos_identity::machine::mint(&root, "mailbox-live") {
        Ok((_, id)) => println!("{id}"),
        Err(error) => {
            eprintln!("identity-mint-machine: {error}");
            std::process::exit(3);
        }
    }
}
