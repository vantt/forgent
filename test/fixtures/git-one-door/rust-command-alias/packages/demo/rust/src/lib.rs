use std::process::Command as Proc;

pub fn push() -> std::io::Result<std::process::Output> {
    Proc::new("git").args(["push", "origin", "main"]).output()
}
