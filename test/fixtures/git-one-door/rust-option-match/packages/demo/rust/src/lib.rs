use std::path::PathBuf;
use std::process::Command;

const LOCATIONS: [&str; 2] = ["/usr/local/bin/git", "/usr/bin/git"];

fn pick(named: &Option<PathBuf>) -> Option<PathBuf> {
    match named {
        Some(path) => (path.is_absolute()).then(|| path.clone()),
        None => LOCATIONS.iter().map(PathBuf::from).find(|path| path.is_file()),
    }
}

pub fn run() {
    if let Some(bin) = pick(&None) {
        let _ = Command::new(bin).arg("commit").status();
    }
}
