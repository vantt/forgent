//! Prints the `sh` workspace shim this build of `fgctl` writes (`fgos` by
//! default, or the name given), byte for byte. The mailbox live suite lays out
//! its private shim from it, so the bytes it measures are the generator's.
fn main() {
    let name = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "fgos".to_string());
    match fgos_distribution::shim::workspace_shims()
        .into_iter()
        .find(|s| s.name == name)
    {
        Some(shim) => print!("{}", shim.body),
        None => {
            eprintln!("no workspace shim named {name}");
            std::process::exit(2);
        }
    }
}
