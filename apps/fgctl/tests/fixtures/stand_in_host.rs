//! Stand-in for the release's `fgos` host on Windows, where the workspace shim
//! launches `bin\fgos.exe` directly and so needs a real program. It takes no
//! lock and touches no state: `init` and every other step succeed silently, and
//! `doctor --json` answers with a clean doctor result.
fn main() {
    if std::env::args().any(|arg| arg == "--json") {
        println!(r#"{{"data":{{"ok":true,"next":[],"checks":[]}}}}"#);
    }
}
