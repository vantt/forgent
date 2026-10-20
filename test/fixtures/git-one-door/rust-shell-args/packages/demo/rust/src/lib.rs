use std::process::Command;

pub fn publish() -> std::io::Result<std::process::Output> {
    Command::new("sh").args(["-c", "git push origin refs/fgos/events/x"]).output()
}
